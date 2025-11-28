import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../services/metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(@Optional() @Inject(MetricsService) private metricsService?: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const requestId = (request as any).id || 'unknown';
    const userId = (request as any).user?.id || 'anonymous';
    const now = Date.now();

    // Log request with structured data
    const logContext = {
      requestId,
      method,
      url,
      userId,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const delay = Date.now() - now;
          
          // Record metrics
          if (this.metricsService) {
            this.metricsService.recordHttpRequest(method, url, statusCode, delay);
          }
          
          // Structured logging
          this.logger.log(
            JSON.stringify({
              ...logContext,
              statusCode,
              duration: `${delay}ms`,
              timestamp: new Date().toISOString(),
            }),
          );
        },
        error: (error: any) => {
          const delay = Date.now() - now;
          
          // Structured error logging
          this.logger.error(
            JSON.stringify({
              ...logContext,
              error: error.message,
              statusCode: error.status || 500,
              duration: `${delay}ms`,
              timestamp: new Date().toISOString(),
            }),
            error.stack,
          );
        },
      }),
    );
  }
}


