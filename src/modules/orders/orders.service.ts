import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { OrderStatus, OrderType, PaymentStatus } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('scheduledOrders') private scheduledOrdersQueue: Queue,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const {
      type,
      scheduledFor,
      items,
      deliveryType,
      addressId,
      paymentMethod,
      contactPhone,
      notes,
    } = createOrderDto;

    // Validate scheduled time
    if (type === OrderType.SCHEDULED) {
      if (!scheduledFor) {
        throw new BadRequestException('scheduledFor is required for scheduled orders');
      }
      const scheduledDate = new Date(scheduledFor);
      const now = new Date();
      if (scheduledDate <= now) {
        throw new BadRequestException('Scheduled time must be in the future');
      }
      // Max 30 days in advance
      const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (scheduledDate > maxDate) {
        throw new BadRequestException('Cannot schedule orders more than 30 days in advance');
      }
    }

    // Validate address if delivery
    if (deliveryType !== 'PICKUP' && !addressId) {
      throw new BadRequestException('Address is required for delivery orders');
    }

    if (addressId) {
      const address = await this.prisma.address.findFirst({
        where: { id: addressId, userId },
      });
      if (!address) {
        throw new NotFoundException('Address not found');
      }
    }

    // Calculate total price
    let totalPrice = 0;
    for (const item of items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.itemId },
      });
      if (!menuItem || !menuItem.isActive) {
        throw new NotFoundException(`Menu item ${item.itemId} not found or inactive`);
      }

      let itemTotal = Number(menuItem.price) * item.quantity;
      if (item.modifiers) {
        for (const modifier of item.modifiers) {
          itemTotal += Number(modifier.price) * item.quantity;
        }
      }
      totalPrice += itemTotal;
    }

    // Create order with retry logic for deadlocks
    const order = await this.prisma.executeWithRetry(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          type,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          deliveryType,
          addressId,
          paymentMethod,
          contactPhone,
          notes,
          totalPrice,
          status: type === OrderType.SCHEDULED ? OrderStatus.PENDING : OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      // Create order items
      for (const item of items) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            itemId: item.itemId,
            quantity: item.quantity,
            price: item.price,
          },
        });

        // Create order item modifiers
        if (item.modifiers && item.modifiers.length > 0) {
          for (const modifier of item.modifiers) {
            await tx.orderItemModifier.create({
              data: {
                orderItemId: orderItem.id,
                modifierId: modifier.modifierId,
                price: modifier.price,
              },
            });
          }
        }
      }

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: newOrder.status,
        },
      });

      return newOrder;
    });

    // If scheduled, create BullMQ job
    if (type === OrderType.SCHEDULED && scheduledFor) {
      const delay = new Date(scheduledFor).getTime() - Date.now();
      await this.scheduledOrdersQueue.add(
        'processScheduledOrder',
        { orderId: order.id },
        { delay },
      );
    }

    // Emit order created event
    await this.notificationsService.emitOrderCreated(order.id);

    return this.findOne(order.id, userId);
  }

  async findAll(userId?: string, filters?: any) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        address: true,
        items: {
          include: {
            item: true,
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.skip || 0,
    });
  }

  async findOne(orderId: string, userId?: string) {
    const where: any = { id: orderId };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        address: true,
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
            modifiers: {
              include: {
                modifier: true,
              },
            },
          },
        },
        payments: true,
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
        glovoOrder: true,
        deliveryTask: {
          include: {
            courier: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
    orderId: string,
    updateStatusDto: UpdateOrderStatusDto,
    changedBy?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DELIVERING, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowedStatuses = validTransitions[order.status];
    if (!allowedStatuses.includes(updateStatusDto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${updateStatusDto.status}`,
      );
    }

    const updatedOrder = await this.prisma.executeWithRetry(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: updateStatusDto.status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: updateStatusDto.status,
          changedBy,
          notes: updateStatusDto.notes,
        },
      });

      return order;
    });

    // Emit order updated event
    await this.notificationsService.emitOrderUpdated(orderId, updateStatusDto.status);

    return this.findOne(orderId);
  }

  async cancel(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    // Cancel scheduled job if exists
    if (order.type === OrderType.SCHEDULED) {
      const jobs = await this.scheduledOrdersQueue.getJobs(['delayed', 'waiting']);
      const job = jobs.find((j) => j.data.orderId === orderId);
      if (job) {
        await job.remove();
      }
    }

    return this.updateStatus(orderId, { status: OrderStatus.CANCELLED });
  }

  async getUserOrders(userId: string) {
    return this.findAll(userId);
  }
}


