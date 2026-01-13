import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = 5;
  private readonly retryDelay = 1000; // 1 second

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
    });

    // Log slow queries
    this.$on('query' as never, (e: any) => {
      if (e.duration > 1000) {
        this.logger.warn(`Slow query detected: ${e.query} took ${e.duration}ms`);
      }
    });

    this.$on('error' as never, (e: any) => {
      this.logger.error(`Database error: ${e.message}`, e.stack);
    });
  }

  async onModuleInit() {
    // Run migrations before connecting (ensures tables exist)
    await this.runMigrations();
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async runMigrations(): Promise<void> {
    try {
      this.logger.log('🔄 Running database migrations...');
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        timeout: 60000, // 60 second timeout
      });
      this.logger.log('✅ Database migrations completed successfully');
    } catch (error) {
      this.logger.error('❌ Migration failed:', error);
      // Don't throw - let the app try to connect anyway
      // Tables might already exist from a previous deployment
    }
  }

  private async connectWithRetry(retries = 0): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      if (retries < this.maxRetries) {
        this.logger.warn(
          `Database connection failed (attempt ${retries + 1}/${this.maxRetries}). Retrying in ${this.retryDelay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.connectWithRetry(retries + 1);
      }
      this.logger.error('Failed to connect to database after all retries', error);
      throw error;
    }
  }

  /**
   * Execute a transaction with retry logic for deadlocks
   */
  async executeWithRetry<T>(
    fn: (tx: PrismaClient) => Promise<T>,
    maxRetries = 3,
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.$transaction(fn, {
          maxWait: 5000, // 5 seconds
          timeout: 10000, // 10 seconds
        });
      } catch (error: any) {
        // P2034 is Prisma's deadlock error code
        if (error.code === 'P2034' && i < maxRetries - 1) {
          const delay = 100 * (i + 1);
          this.logger.warn(
            `Transaction deadlock detected (attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Transaction failed after all retries');
  }
}


