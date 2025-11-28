import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getChatHistory(orderId: string, userId?: string, isStaff: boolean = false) {
    // Verify access
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId },
          ...(isStaff ? [{}] : []),
        ],
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or access denied');
    }

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

  async sendMessage(
    orderId: string,
    message: string,
    user: CurrentUserPayload,
  ) {
    // Verify access
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId: user.id },
          ...(user.type === 'staff' ? [{}] : []),
        ],
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found or access denied');
    }

    return this.prisma.chat.create({
      data: {
        orderId,
        userId: user.type === 'user' ? user.id : null,
        staffId: user.type === 'staff' ? user.id : null,
        message,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        staff: {
          select: { id: true, name: true },
        },
      },
    });
  }
}

