import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [MetricsController],
})
export class MetricsModule {}


