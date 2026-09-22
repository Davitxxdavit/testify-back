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
import { SocketRateLimiter } from './socket-rate-limiter';

@WebSocketGateway({
  cors: (origin, callback) => {
    // CORS will be handled dynamically in handleConnection
    callback(null, true);
  },
  namespace: '/orders',
  maxHttpBufferSize: 10 * 1024, // 10KB message size limit
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(OrderGateway.name);
  private readonly allowedOrigins: string[];
  private readonly maxConnectionsPerUser = 5;
  private readonly userConnections = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private readonly rateLimiter = new SocketRateLimiter(10, 1000);
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    // Register this gateway with notifications service
    this.notificationsService.setOrderGateway(this);
    
    // Setup allowed origins based on environment
    const nodeEnv = this.configService.get<string>('nodeEnv') || 'development';
    const frontendUrl = this.configService.get<string>('frontendUrl') || '';
    
    this.allowedOrigins = nodeEnv === 'production'
      ? frontendUrl.split(',').filter(Boolean)
      : ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

    // Setup heartbeat
    this.setupHeartbeat();
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.server.emit('ping', { timestamp: Date.now() });
    }, 30000); // Every 30 seconds
  }

  private checkRateLimit(socketId: string): boolean {
    return this.rateLimiter.allow(socketId);
  }

  private checkConnectionLimit(userId: string, socketId: string): boolean {
    const connections = this.userConnections.get(userId) || new Set();
    
    if (connections.size >= this.maxConnectionsPerUser) {
      // Disconnect oldest connection
      const oldestSocketId = Array.from(connections)[0];
      const socket = this.server.sockets.sockets.get(oldestSocketId);
      if (socket) {
        socket.disconnect();
        connections.delete(oldestSocketId);
      }
    }

    connections.add(socketId);
    this.userConnections.set(userId, connections);
    return true;
  }

  async handleConnection(client: Socket) {
    try {
      // Validate origin
      const origin = client.handshake.headers.origin;
      if (origin && !this.allowedOrigins.includes(origin)) {
        this.logger.warn(`Client ${client.id} connected from disallowed origin: ${origin}`);
        client.disconnect();
        return;
      }

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

      // Check connection limit per user
      if (!this.checkConnectionLimit(user.id, client.id)) {
        this.logger.warn(`Connection limit reached for user ${user.id}`);
        client.disconnect();
        return;
      }

      client.data.user = user;
      this.logger.log(`Client ${client.id} connected as ${type}: ${user.id}`);

      // Setup ping-pong for heartbeat
      client.on('pong', () => {
        // Client responded to ping
      });
    } catch (error: any) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user: CurrentUserPayload = client.data.user;
    if (user) {
      const connections = this.userConnections.get(user.id);
      if (connections) {
        connections.delete(client.id);
        if (connections.size === 0) {
          this.userConnections.delete(user.id);
        }
      }
      this.rateLimiter.release(client.id);
    }
    this.logger.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('join_order_room')
  async handleJoinOrderRoom(
    @MessageBody() data: { orderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Rate limiting
    if (!this.checkRateLimit(client.id)) {
      return { error: 'Rate limit exceeded' };
    }

    // Validate message size
    if (JSON.stringify(data).length > 10 * 1024) {
      return { error: 'Message too large' };
    }

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
    // Rate limiting
    if (!this.checkRateLimit(client.id)) {
      return { error: 'Rate limit exceeded' };
    }

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
    // Rate limiting
    if (!this.checkRateLimit(client.id)) {
      return { error: 'Rate limit exceeded' };
    }

    const user: CurrentUserPayload = client.data.user;
    if (!user || user.type !== 'staff') {
      return { error: 'Unauthorized' };
    }

    client.join('admin_room');
    return { success: true };
  }
}


