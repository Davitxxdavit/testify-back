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
      },
      {
        name: 'notifications',
      },
      {
        name: 'glovoSync',
      },
    ),
  ],
  providers: [ScheduledOrdersProcessor, NotificationsProcessor, GlovoSyncProcessor],
})
export class QueueModule {}

