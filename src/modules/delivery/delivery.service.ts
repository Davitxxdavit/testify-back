import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AssignCourierDto } from './dto/assign-courier.dto';
import { DeliveryTaskStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DeliveryService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createDeliveryTask(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.deliveryType === 'GLOVO' || order.deliveryType === 'PICKUP') {
      throw new BadRequestException('Cannot create delivery task for Glovo or pickup orders');
    }

    // Check if delivery task already exists
    const existingTask = await this.prisma.deliveryTask.findUnique({
      where: { orderId },
    });

    if (existingTask) {
      return existingTask;
    }

    return this.prisma.deliveryTask.create({
      data: {
        orderId,
        status: DeliveryTaskStatus.ASSIGNED,
      },
      include: {
        order: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
            address: true,
          },
        },
        courier: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  }

  async assignCourier(orderId: string, assignCourierDto: AssignCourierDto) {
    const { courierId } = assignCourierDto;

    const courier = await this.prisma.staff.findUnique({
      where: { id: courierId },
    });

    if (!courier || courier.role !== 'COURIER') {
      throw new BadRequestException('Invalid courier');
    }

    const deliveryTask = await this.prisma.deliveryTask.findUnique({
      where: { orderId },
    });

    if (!deliveryTask) {
      throw new NotFoundException('Delivery task not found');
    }

    const updatedTask = await this.prisma.deliveryTask.update({
      where: { orderId },
      data: {
        courierId,
        status: DeliveryTaskStatus.ASSIGNED,
      },
      include: {
        order: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
            address: true,
          },
        },
        courier: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    await this.notificationsService.emitOrderUpdated(orderId, 'DELIVERING');

    return updatedTask;
  }

  async updateDeliveryStatus(orderId: string, status: DeliveryTaskStatus) {
    const deliveryTask = await this.prisma.deliveryTask.findUnique({
      where: { orderId },
    });

    if (!deliveryTask) {
      throw new NotFoundException('Delivery task not found');
    }

    const updatedTask = await this.prisma.deliveryTask.update({
      where: { orderId },
      data: { status },
      include: {
        order: true,
        courier: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    // Update order status if delivery is done
    if (status === DeliveryTaskStatus.DONE) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      });
      await this.notificationsService.emitOrderCompleted(orderId);
    }

    return updatedTask;
  }

  async getDeliveryTasks(filters?: { status?: DeliveryTaskStatus; courierId?: string }) {
    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.courierId) {
      where.courierId = filters.courierId;
    }

    return this.prisma.deliveryTask.findMany({
      where,
      include: {
        order: {
          include: {
            user: {
              select: { id: true, name: true, phone: true },
            },
            address: true,
          },
        },
        courier: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCourierTasks(courierId: string) {
    return this.getDeliveryTasks({ courierId });
  }
}



