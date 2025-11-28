import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    this.notificationsService.setChatGateway(this);
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const { sub, type } = payload;

      let user: CurrentUserPayload;
      if (type === 'user') {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: sub },
        });
        if (!dbUser) {
          client.disconnect();
          return;
        }
        user = { id: dbUser.id, email: dbUser.email, phone: dbUser.phone, type: 'user' };
      } else {
        const staff = await this.prisma.staff.findUnique({
          where: { id: sub },
        });
        if (!staff) {
          client.disconnect();
          return;
        }
        user = { id: staff.id, phone: staff.phone, role: staff.role, type: 'staff' };
      }

      client.data.user = user;
      this.logger.log(`Chat client ${client.id} connected as ${type}: ${user.id}`);
    } catch (error) {
      this.logger.error(`Chat connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Chat client ${client.id} disconnected`);
  }

  @SubscribeMessage('send_chat_message')
  async handleSendMessage(
    @MessageBody() data: { orderId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user: CurrentUserPayload = client.data.user;
    if (!user) {
      return { error: 'Unauthorized' };
    }

    // Verify user has access to this order
    const order = await this.prisma.order.findFirst({
      where: {
        id: data.orderId,
        OR: [
          { userId: user.id },
          ...(user.type === 'staff' ? [{}] : []),
        ],
      },
    });

    if (!order) {
      return { error: 'Order not found or access denied' };
    }

    // Save message to database
    const chatMessage = await this.prisma.chat.create({
      data: {
        orderId: data.orderId,
        userId: user.type === 'user' ? user.id : null,
        staffId: user.type === 'staff' ? user.id : null,
        message: data.message,
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

    // Emit to order room
    this.server.to(`chat:${data.orderId}`).emit('chat_message', chatMessage);

    return { success: true, message: chatMessage };
  }

  @SubscribeMessage('join_chat_room')
  async handleJoinChatRoom(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const user: CurrentUserPayload = client.data.user;
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: data.orderId,
        OR: [
          { userId: user.id },
          ...(user.type === 'staff' ? [{}] : []),
        ],
      },
    });

    if (!order) {
      return { error: 'Order not found or access denied' };
    }

    client.join(`chat:${data.orderId}`);
    return { success: true, orderId: data.orderId };
  }

  @SubscribeMessage('request_chat_history')
  async handleRequestChatHistory(
    @MessageBody() data: { orderId: string; limit?: number; offset?: number },
    @ConnectedSocket() client: Socket,
  ) {
    const user: CurrentUserPayload = client.data.user;
    if (!user) {
      return { error: 'Unauthorized' };
    }

    const order = await this.prisma.order.findFirst({
      where: {
        id: data.orderId,
        OR: [
          { userId: user.id },
          ...(user.type === 'staff' ? [{}] : []),
        ],
      },
    });

    if (!order) {
      return { error: 'Order not found or access denied' };
    }

    const messages = await this.prisma.chat.findMany({
      where: { orderId: data.orderId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        staff: {
          select: { id: true, name: true },
        },
      },
      orderBy: { sentAt: 'desc' },
      take: data.limit || 50,
      skip: data.offset || 0,
    });

    client.emit('chat_history', { orderId: data.orderId, messages: messages.reverse() });
    return { success: true };
  }

  async emitChatMessage(orderId: string, message: any) {
    this.server.to(`chat:${orderId}`).emit('chat_message', message);
  }
}


