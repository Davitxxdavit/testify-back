import { Module } from '@nestjs/common';
import { OrderGateway } from './order.gateway';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../database/prisma.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, NotificationsModule, JwtModule, ConfigModule],
  providers: [OrderGateway, ChatGateway],
  exports: [OrderGateway, ChatGateway],
})
export class WebSocketModule {}

