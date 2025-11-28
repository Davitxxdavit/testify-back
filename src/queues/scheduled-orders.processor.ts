import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { OrderStatus } from '@prisma/client';

@Processor('scheduledOrders')
export class ScheduledOrdersProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduledOrdersProcessor.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing scheduled order job: ${job.id}`);
    const { orderId } = job.data;

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        this.logger.error(`Order ${orderId} not found`);
        throw new Error(`Order ${orderId} not found`);
      }

      // Check if order was cancelled
      if (order.status === 'CANCELLED') {
        this.logger.log(`Order ${orderId} was cancelled, skipping`);
        return { skipped: true, reason: 'cancelled' };
      }

      // Check if order is already paid
      if (order.paymentStatus !== 'PAID') {
        this.logger.warn(`Order ${orderId} is not paid yet, moving to preparing anyway`);
      }

      // Update order status to PREPARING
      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PREPARING },
        });

        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: OrderStatus.PREPARING,
            notes: 'Scheduled order started',
          },
        });

        return order;
      });

      // Notify kitchen and customer
      await this.notificationsService.emitOrderUpdated(orderId, OrderStatus.PREPARING);
      await this.notificationsService.emitAdminNewOrder(orderId);

      this.logger.log(`Scheduled order ${orderId} moved to PREPARING status`);
      return { success: true, orderId, status: updatedOrder.status };
    } catch (error) {
      this.logger.error(`Error processing scheduled order ${orderId}: ${error.message}`);
      throw error;
    }
  }
}

