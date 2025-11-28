import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class GlovoService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @InjectQueue('glovoSync') private glovoSyncQueue: Queue,
    private notificationsService: NotificationsService,
  ) {}

  async createDelivery(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { address: true, user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.deliveryType !== 'GLOVO') {
      throw new BadRequestException('Order is not a Glovo delivery');
    }

    if (!order.address) {
      throw new BadRequestException('Order address is required for Glovo delivery');
    }

    // TODO: Call actual Glovo API
    // For now, this is a mock implementation
    const mockGlovoOrderId = `glovo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create Glovo order record
    const glovoOrder = await this.prisma.glovoOrder.create({
      data: {
        orderId: order.id,
        glovoOrderId: mockGlovoOrderId,
        status: 'PENDING',
      },
    });

    // In real implementation, you would:
    // 1. Call Glovo API to create delivery
    // 2. Handle response and update status
    // 3. Set up webhook listeners

    this.logger.log(`Mock Glovo delivery created: ${mockGlovoOrderId} for order ${orderId}`);

    return {
      glovoOrderId: mockGlovoOrderId,
      status: 'PENDING',
      message: 'Glovo delivery created (mock - integrate with actual API)',
    };
  }

  async syncOrderStatus(glovoOrderId: string) {
    // TODO: Call Glovo API to get order status
    // For now, this is a mock implementation

    const glovoOrder = await this.prisma.glovoOrder.findFirst({
      where: { glovoOrderId },
      include: { order: true },
    });

    if (!glovoOrder) {
      throw new NotFoundException('Glovo order not found');
    }

    // Mock status update
    const mockStatus = 'IN_TRANSIT';
    const updatedGlovoOrder = await this.prisma.glovoOrder.update({
      where: { id: glovoOrder.id },
      data: { status: mockStatus },
    });

    // Update internal order status if needed
    // Note: In real implementation, this would be handled by webhook
    // if (mockStatus === 'DELIVERED' && glovoOrder.order.status !== 'COMPLETED') {
    //   // Update order status
    // }

    return updatedGlovoOrder;
  }

  async handleWebhook(payload: any, signature: string) {
    // TODO: Verify Glovo webhook signature
    // For now, this is a placeholder

    const { order_id, status } = payload;

    const glovoOrder = await this.prisma.glovoOrder.findFirst({
      where: { glovoOrderId: order_id },
      include: { order: true },
    });

    if (!glovoOrder) {
      this.logger.warn(`Glovo order not found: ${order_id}`);
      return { received: true };
    }

    // Update Glovo order status
    await this.prisma.glovoOrder.update({
      where: { id: glovoOrder.id },
      data: { status },
    });

    // Map Glovo status to internal order status
    const statusMap: Record<string, string> = {
      ACCEPTED: 'PREPARING',
      PICKING_UP: 'READY',
      IN_TRANSIT: 'DELIVERING',
      DELIVERED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    };

    const internalStatus = statusMap[status];
    if (internalStatus && glovoOrder.order.status !== internalStatus) {
      // Update order status through orders service
      // This would typically call ordersService.updateStatus
      await this.prisma.order.update({
        where: { id: glovoOrder.orderId },
        data: { status: internalStatus as any },
      });

      await this.notificationsService.emitOrderUpdated(glovoOrder.orderId, internalStatus as any);
    }

    return { received: true, glovoOrderId: order_id, status };
  }

  private readonly logger = new Logger(GlovoService.name);
}

