import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as bcrypt from 'bcrypt';

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
      const existingAdmin = await this.staff.findFirst({ where: { role: 'ADMIN' } });
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('admin123', 10);
        await this.staff.create({
          data: {
            name: 'Administrator',
            phone: '555000001',
            role: 'ADMIN',
            passwordHash,
          },
        });
        this.logger.log('✅ Default admin created! Phone: 555000001, Password: admin123');
      } else {
        this.logger.log('Admin user already exists');
      }

      // Seed menu data
      const categoryCount = await this.menuCategory.count();
      if (categoryCount === 0) {
        const burgers = await this.menuCategory.create({ data: { name: 'Burgers', sortOrder: 1 } });
        const sides = await this.menuCategory.create({ data: { name: 'Sides', sortOrder: 2 } });
        const drinks = await this.menuCategory.create({ data: { name: 'Drinks', sortOrder: 3 } });

        await this.menuItem.createMany({
          data: [
            { categoryId: burgers.id, name: 'Classic Cheeseburger', description: 'Juicy beef patty with cheddar cheese', price: 12.99, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', isActive: true },
            { categoryId: burgers.id, name: 'Bacon BBQ Burger', description: 'Smoky BBQ sauce, crispy bacon', price: 15.49, imageUrl: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500', isActive: true },
            { categoryId: burgers.id, name: 'Mushroom Swiss Burger', description: 'Sautéed mushrooms, swiss cheese', price: 14.50, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500', isActive: true },
            { categoryId: burgers.id, name: 'Double Smash Burger', description: 'Two crispy patties, American cheese', price: 16.99, imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500', isActive: true },
            { categoryId: sides.id, name: 'Crispy Fries', description: 'Golden, perfectly salted', price: 4.99, imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500', isActive: true },
            { categoryId: sides.id, name: 'Onion Rings', description: 'Beer-battered with chipotle dip', price: 5.99, imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=500', isActive: true },
            { categoryId: drinks.id, name: 'Fresh Lemonade', description: 'House-made with fresh lemons', price: 3.99, imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=500', isActive: true },
            { categoryId: drinks.id, name: 'Craft Cola', description: 'Premium artisan cola', price: 2.99, imageUrl: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=500', isActive: true },
          ],
        });
        this.logger.log('✅ Sample menu seeded! (4 burgers, 2 sides, 2 drinks)');
      } else {
        this.logger.log('Menu data already exists');
      }
    } catch (error: any) {
      this.logger.error('❌ Seeding failed:', error?.message);
      // Don't throw - app can still work, just without seed data
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
