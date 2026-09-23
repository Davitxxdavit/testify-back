import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isProduction: boolean;

  constructor(private configService?: ConfigService) {
    this.isProduction =
      this.configService?.get<string>('nodeEnv') === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get request ID from request
    const requestId = (request as any).id || request.headers['x-request-id'] || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    // ValidationPipe errors carry a string[] (one entry per failed constraint)
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        error = (exceptionResponse as any).error || error;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
    }

    // Sanitize sensitive data from message
    message = Array.isArray(message)
      ? message.map((m) => this.sanitizeMessage(String(m)))
      : this.sanitizeMessage(String(message));

    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.isProduction && status >= 500 ? 'Internal server error' : message,
      error,
      requestId,
    };

    // Only include stack trace in development
    if (!this.isProduction && stack) {
      errorResponse.stack = this.sanitizeStack(stack);
    }

    // Set request ID header
    response.setHeader('X-Request-ID', requestId);

    // Log error with context
    const logContext = {
      requestId,
      method: request.method,
      url: request.url,
      status,
      userId: (request as any).user?.id,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      JSON.stringify(logContext),
      stack || '',
    );

    response.status(status).json(errorResponse);
  }

  private sanitizeMessage(message: string): string {
    // Mask passwords, tokens, and other sensitive data
    return message
      .replace(/password["\s:=]+[^,\s}]+/gi, 'password=***')
      .replace(/token["\s:=]+[^,\s}]+/gi, 'token=***')
      .replace(/secret["\s:=]+[^,\s}]+/gi, 'secret=***')
      .replace(/authorization["\s:=]+[^,\s}]+/gi, 'authorization=***');
  }

  private sanitizeStack(stack: string): string {
    // Remove sensitive paths and data from stack traces
    return stack
      .split('\n')
      .map((line) => this.sanitizeMessage(line))
      .join('\n');
  }
}


