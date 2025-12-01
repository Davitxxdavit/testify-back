import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as promClient from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly register: promClient.Registry;
  private readonly httpRequestDuration: promClient.Histogram<string>;
  private readonly httpRequestTotal: promClient.Counter<string>;
  private readonly httpErrorsTotal: promClient.Counter<string>;
  private readonly queueJobsTotal: promClient.Counter<string>;
  private readonly queueJobDuration: promClient.Histogram<string>;
  private readonly dbQueryDuration: promClient.Histogram<string>;

  constructor(private configService: ConfigService) {
    this.register = new promClient.Registry();
    promClient.collectDefaultMetrics({ register: this.register });

    // HTTP metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpErrorsTotal = new promClient.Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    // Queue metrics
    this.queueJobsTotal = new promClient.Counter({
      name: 'queue_jobs_total',
      help: 'Total number of queue jobs processed',
      labelNames: ['queue_name', 'status'],
      registers: [this.register],
    });

    this.queueJobDuration = new promClient.Histogram({
      name: 'queue_job_duration_seconds',
      help: 'Duration of queue jobs in seconds',
      labelNames: ['queue_name'],
      buckets: [1, 5, 10, 30, 60],
      registers: [this.register],
    });

    // Database metrics
    this.dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'model'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [this.register],
    });
  }

  onModuleInit() {
    // Metrics are ready
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    const routeLabel = this.sanitizeRoute(route);
    this.httpRequestDuration.observe({ method, route: routeLabel, status_code: statusCode }, duration / 1000);
    this.httpRequestTotal.inc({ method, route: routeLabel, status_code: statusCode });

    if (statusCode >= 400) {
      this.httpErrorsTotal.inc({ method, route: routeLabel, status_code: statusCode });
    }
  }

  recordQueueJob(queueName: string, status: 'success' | 'failed', duration: number) {
    this.queueJobsTotal.inc({ queue_name: queueName, status });
    this.queueJobDuration.observe({ queue_name: queueName }, duration / 1000);
  }

  recordDbQuery(operation: string, model: string, duration: number) {
    this.dbQueryDuration.observe({ operation, model }, duration / 1000);
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  private sanitizeRoute(route: string): string {
    // Replace UUIDs and IDs with placeholders for better metric aggregation
    return route
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d+/g, '/:id')
      .replace(/\/api\/v\d+\//g, '/api/v1/');
  }
}


