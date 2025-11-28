import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StaffModule } from './modules/staff/staff.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ChatModule } from './modules/chat/chat.module';
import { GlovoModule } from './modules/glovo/glovo.module';
import { AdminModule } from './modules/admin/admin.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebSocketModule } from './websockets/websocket.module';
import { QueueModule } from './queues/queue.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('throttle.ttl') || 60,
        limit: configService.get<number>('throttle.limit') || 100,
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StaffModule,
    MenuModule,
    OrdersModule,
    PaymentsModule,
    ChatModule,
    GlovoModule,
    AdminModule,
    DeliveryModule,
    NotificationsModule,
    WebSocketModule,
    QueueModule,
    HealthModule,
  ],
})
export class AppModule {}

