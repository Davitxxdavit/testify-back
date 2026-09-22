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
import { SocketRateLimiter } from './socket-rate-limiter';

@WebSocketGateway({
  cors: (origin, callback) => {
    // CORS will be handled dynamically in handleConnection
    callback(null, true);
  },
  namespace: '/chat',
  maxHttpBufferSize: 10 * 1024, // 10KB message size limit
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly allowedOrigins: string[];
  private readonly maxConnectionsPerUser = 5;
  private readonly userConnections = new Map<string, Set<string>>();
  private readonly rateLimiter = new SocketRateLimiter(10, 1000);
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {
    this.notificationsService.setChatGateway(this);
    
    // Setup allowed origins based on environment
    const nodeEnv = this.configService.get<string>('nodeEnv') || 'development';
    const frontendUrl = this.configService.get<string>('frontendUrl') || '';
    
    this.allowedOrigins = nodeEnv === 'production'
      ? frontendUrl.split(',').filter(Boolean)
      : ['http://localhost:3001', 'http://localhost:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'];

    this.setupHeartbeat();
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.server.emit('ping', { timestamp: Date.now() });
    }, 30000);
  }

  private checkRateLimit(socketId: string): boolean {
    return this.rateLimiter.allow(socketId);
  }

  private checkConnectionLimit(userId: string, socketId: string): boolean {
    const connections = this.userConnections.get(userId) || new Set();
    
    if (connections.size >= this.maxConnectionsPerUser) {
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

      if (!this.checkConnectionLimit(user.id, client.id)) {
        this.logger.warn(`Connection limit reached for user ${user.id}`);
        client.disconnect();
        return;
      }

      client.data.user = user;
      this.logger.log(`Chat client ${client.id} connected as ${type}: ${user.id}`);

      client.on('pong', () => {
        // Client responded to ping
      });
    } catch (error: any) {
      this.logger.error(`Chat connection error: ${error.message}`);
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
    this.logger.log(`Chat client ${client.id} disconnected`);
  }

  @SubscribeMessage('send_chat_message')
  async handleSendMessage(
    @MessageBody() data: { orderId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.checkRateLimit(client.id)) {
      return { error: 'Rate limit exceeded' };
    }

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
    if (!this.checkRateLimit(client.id)) {
      return { error: 'Rate limit exceeded' };
    }

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
    if (!this.checkRateLimit(client.id)) {
      return { error: 'Rate limit exceeded' };
    }

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


