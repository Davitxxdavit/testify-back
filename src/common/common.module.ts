import { Global, Module } from '@nestjs/common';
import { CacheService } from './services/cache.service';
import { MetricsService } from './services/metrics.service';

@Global()
@Module({
  providers: [CacheService, MetricsService],
  exports: [CacheService, MetricsService],
})
export class CommonModule {}
