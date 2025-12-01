import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MetricsService } from '../common/services/metrics.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('metrics')
@Controller('metrics')
@Public()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  async getMetrics() {
    const metrics = await this.metricsService.getMetrics();
    return metrics;
  }
}


