import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'scheduledOrders',
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}



