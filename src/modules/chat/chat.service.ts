import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { orderAccessWhere } from '../../common/utils/order-access';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getChatHistory(orderId: string, userId?: string, isStaff: boolean = false) {
    // Verify access
    const order = await this.prisma.order.findFirst({
      where: orderAccessWhere(orderId, { id: userId, type: isStaff ? 'staff' : 'user' }),
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
      where: orderAccessWhere(orderId, user),
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



