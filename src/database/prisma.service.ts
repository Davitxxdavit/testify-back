import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as bcrypt from 'bcrypt';
import { seedMenu } from './seed-data';

// Local demo credentials, never created in production
export const DEMO_CUSTOMER = {
  name: 'Demo Customer',
  email: 'demo@tastify.ge',
  phone: '+995555123456',
  password: 'demo1234',
};
export const DEMO_KITCHEN = {
  name: 'Kitchen Staff',
  phone: '555000002',
  password: 'kitchen123',
};

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
    // Step 1: Sync database schema (creates tables)
    await this.syncSchema();
    // Step 2: Connect to database
    await this.connectWithRetry();
    // Step 3: Seed initial data (only after tables exist)
    await this.seedDatabase();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async syncSchema(): Promise<void> {
    try {
      this.logger.log('🔄 Syncing database schema...');
      const result = execSync('npx prisma db push --accept-data-loss', {
        timeout: 120000,
        encoding: 'utf-8',
      });
      this.logger.log('✅ Database schema synced successfully');
      if (result) {
        this.logger.log(result.substring(0, 500)); // Limit output
      }
    } catch (error: any) {
      this.logger.error('❌ Schema sync failed:', error?.message || error);
      // Continue - tables might already exist
    }
  }

  private async connectWithRetry(retries = 0): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      if (retries < this.maxRetries) {
        this.logger.warn(
          `Database connection failed (attempt ${retries + 1}/${this.maxRetries}). Retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.connectWithRetry(retries + 1);
      }
      this.logger.error('Failed to connect to database after all retries', error);
      throw error;
    }
  }

  private async seedDatabase(): Promise<void> {
    this.logger.log('🌱 Checking if seeding is needed...');

    try {
      // Seed admin user
      // Credentials come from ADMIN_PHONE / ADMIN_PASSWORD. The built-in
      // fallback is for local development only and is never used in production.
      const isProduction = process.env.NODE_ENV === 'production';
      const adminPhone = process.env.ADMIN_PHONE || '555000001';
      const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? undefined : 'admin123');

      const existingAdmin = await this.staff.findFirst({ where: { role: 'ADMIN' } });
      if (existingAdmin) {
        this.logger.log('Admin user already exists');
      } else if (!adminPassword) {
        this.logger.warn('No admin user exists and ADMIN_PASSWORD is not set; skipping admin creation');
      } else {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await this.staff.create({
          data: {
            name: 'Administrator',
            phone: adminPhone,
            role: 'ADMIN',
            passwordHash,
          },
        });
        this.logger.log(`✅ Admin user created (phone: ${adminPhone})`);
      }

      // Seed menu data
      const categoryCount = await this.menuCategory.count();
      if (categoryCount === 0) {
        let itemCount = 0;
        for (const [index, category] of seedMenu.entries()) {
          await this.menuCategory.create({
            data: {
              name: category.name,
              sortOrder: index + 1,
              items: {
                create: category.items.map(({ modifiers, ...item }) => {
                  itemCount++;
                  return { ...item, isActive: true, modifiers: { create: modifiers } };
                }),
              },
            },
          });
        }
        this.logger.log(`✅ Georgian menu seeded (${seedMenu.length} categories, ${itemCount} items)`);
      } else {
        this.logger.log('Menu data already exists');
      }

      // Demo accounts for local development only
      if (!isProduction) {
        await this.seedDemoAccounts();
      }
    } catch (error: any) {
      this.logger.error('❌ Seeding failed:', error?.message);
      // Don't throw - app can still work, just without seed data
    }
  }

  private async seedDemoAccounts(): Promise<void> {
    const existingCustomer = await this.user.findUnique({ where: { email: DEMO_CUSTOMER.email } });
    if (!existingCustomer) {
      await this.user.create({
        data: {
          name: DEMO_CUSTOMER.name,
          email: DEMO_CUSTOMER.email,
          phone: DEMO_CUSTOMER.phone,
          passwordHash: await bcrypt.hash(DEMO_CUSTOMER.password, 10),
          addresses: {
            create: { street: 'Rustaveli Ave 12, apt 7', city: 'Batumi', isDefault: true },
          },
        },
      });
      this.logger.log(`✅ Demo customer created (${DEMO_CUSTOMER.email})`);
    }

    const existingKitchen = await this.staff.findUnique({ where: { phone: DEMO_KITCHEN.phone } });
    if (!existingKitchen) {
      await this.staff.create({
        data: {
          name: DEMO_KITCHEN.name,
          phone: DEMO_KITCHEN.phone,
          role: 'KITCHEN',
          passwordHash: await bcrypt.hash(DEMO_KITCHEN.password, 10),
        },
      });
      this.logger.log(`✅ Demo kitchen staff created (phone: ${DEMO_KITCHEN.phone})`);
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
          maxWait: 5000,
          timeout: 10000,
        });
      } catch (error: any) {
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
