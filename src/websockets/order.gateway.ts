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
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/orders',
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrderGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    // Register this gateway with notifications service
    this.notificationsService.setOrderGateway(this);
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
      this.logger.log(`Client ${client.id} connected as ${type}: ${user.id}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join_order_room')
  async handleJoinOrderRoom(
    @MessageBody() data: { orderId: string },
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
          ...(user.type === 'staff' ? [{}] : []), // Staff can access any order
        ],
      },
    });

    if (!order) {
      return { error: 'Order not found or access denied' };
    }

    client.join(`order:${data.orderId}`);
    return { success: true, orderId: data.orderId };
  }

  @SubscribeMessage('leave_order_room')
  async handleLeaveOrderRoom(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`order:${data.orderId}`);
    return { success: true };
  }

  // Methods called by NotificationsService
  async emitOrderCreated(orderId: string) {
    this.server.to(`order:${orderId}`).emit('order_created', { orderId });
    this.server.to('admin_room').emit('admin_new_order', { orderId });
  }

  async emitOrderUpdated(orderId: string, status: string) {
    this.server.to(`order:${orderId}`).emit('order_updated', { orderId, status });
    this.server.to('admin_room').emit('admin_order_update', { orderId, status });
  }

  async emitOrderCancelled(orderId: string) {
    this.server.to(`order:${orderId}`).emit('order_cancelled', { orderId });
    this.server.to('admin_room').emit('admin_order_update', { orderId, status: 'CANCELLED' });
  }

  async emitOrderReady(orderId: string) {
    this.server.to(`order:${orderId}`).emit('order_ready', { orderId });
    this.server.to('admin_room').emit('admin_order_update', { orderId, status: 'READY' });
  }

  async emitOrderDelivering(orderId: string) {
    this.server.to(`order:${orderId}`).emit('order_delivering', { orderId });
    this.server.to('admin_room').emit('admin_order_update', { orderId, status: 'DELIVERING' });
  }

  async emitOrderCompleted(orderId: string) {
    this.server.to(`order:${orderId}`).emit('order_completed', { orderId });
    this.server.to('admin_room').emit('admin_order_update', { orderId, status: 'COMPLETED' });
  }

  async emitAdminNewOrder(orderId: string) {
    this.server.to('admin_room').emit('admin_new_order', { orderId });
  }

  async emitAdminOrderUpdate(orderId: string, status: string) {
    this.server.to('admin_room').emit('admin_order_update', { orderId, status });
  }

  @SubscribeMessage('join_admin_room')
  async handleJoinAdminRoom(@ConnectedSocket() client: Socket) {
    const user: CurrentUserPayload = client.data.user;
    if (!user || user.type !== 'staff') {
      return { error: 'Unauthorized' };
    }

    client.join('admin_room');
    return { success: true };
  }
}

