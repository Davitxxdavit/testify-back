import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { GlovoService } from './glovo.service';
import { GlovoController } from './glovo.controller';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'glovoSync',
    }),
  ],
  controllers: [GlovoController],
  providers: [GlovoService],
  exports: [GlovoService],
})
export class GlovoModule {}

