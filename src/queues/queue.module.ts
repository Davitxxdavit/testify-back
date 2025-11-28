import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduledOrdersProcessor } from './scheduled-orders.processor';
import { NotificationsProcessor } from './notifications.processor';
import { GlovoSyncProcessor } from './glovo-sync.processor';
import { PrismaModule } from '../database/prisma.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { GlovoModule } from '../modules/glovo/glovo.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    GlovoModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = {
          host: configService.get<string>('redis.host') || 'localhost',
          port: configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('redis.password'),
          db: configService.get<number>('redis.db') || 0,
          maxRetriesPerRequest: null,
          retryStrategy: () => null, // Disable retry to prevent connection loops
        };
        
        return {
          connection: redisConfig,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: 'scheduledOrders',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            count: 1000,
            age: 24 * 3600, // 24 hours
          },
          removeOnFail: {
            count: 5000,
            age: 7 * 24 * 3600, // 7 days
          },
        },
      },
      {
        name: 'notifications',
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            count: 500,
            age: 24 * 3600, // 24 hours
          },
          removeOnFail: {
            count: 1000,
            age: 7 * 24 * 3600, // 7 days
          },
        },
      },
      {
        name: 'glovoSync',
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
          removeOnComplete: {
            count: 500,
            age: 24 * 3600, // 24 hours
          },
          removeOnFail: {
            count: 2000,
            age: 7 * 24 * 3600, // 7 days
          },
        },
      },
    ),
  ],
  providers: [ScheduledOrdersProcessor, NotificationsProcessor, GlovoSyncProcessor],
})
export class QueueModule {}

