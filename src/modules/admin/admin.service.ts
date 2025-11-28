import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: true,
        payments: true,
      },
    });

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === PaymentStatus.PAID)
      .reduce((sum, o) => sum + Number(o.totalPrice), 0);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
    const pendingOrders = orders.filter((o) => o.status === OrderStatus.PENDING).length;
    const preparingOrders = orders.filter((o) => o.status === OrderStatus.PREPARING).length;

    // Daily sales breakdown
    const dailySales = orders
      .filter((o) => o.paymentStatus === PaymentStatus.PAID)
      .reduce((acc, order) => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, orders: 0 };
        }
        acc[date].revenue += Number(order.totalPrice);
        acc[date].orders += 1;
        return acc;
      }, {} as Record<string, { date: string; revenue: number; orders: number }>);

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      preparingOrders,
      dailySales: Object.values(dailySales),
    };
  }

  async getUsers(filters?: { limit?: number; skip?: number }) {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      take: filters?.limit || 50,
      skip: filters?.skip || 0,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getChatHistory(orderId: string) {
    return this.prisma.chat.findMany({
      where: { orderId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        staff: {
          select: { id: true, name: true },
        },
      },
      orderBy: { sentAt: 'asc' },
    });
  }
}


