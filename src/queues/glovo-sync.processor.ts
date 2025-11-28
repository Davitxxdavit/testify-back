import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GlovoService } from '../modules/glovo/glovo.service';

@Processor('glovoSync')
export class GlovoSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(GlovoSyncProcessor.name);

  constructor(
    private prisma: PrismaService,
    private glovoService: GlovoService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing Glovo sync job: ${job.id}`);
    const { orderId, action } = job.data;

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { glovoOrder: true },
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      switch (action) {
        case 'sync_status':
          if (order.glovoOrder) {
            await this.glovoService.syncOrderStatus(order.glovoOrder.glovoOrderId);
          }
          break;
        case 'create_delivery':
          if (!order.glovoOrder && order.deliveryType === 'GLOVO') {
            await this.glovoService.createDelivery(orderId);
          }
          break;
        default:
          this.logger.warn(`Unknown Glovo action: ${action}`);
      }

      return { success: true, orderId, action };
    } catch (error) {
      this.logger.error(`Error processing Glovo sync: ${error.message}`);
      throw error;
    }
  }
}


