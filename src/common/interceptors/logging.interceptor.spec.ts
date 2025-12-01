import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockContext: ExecutionContext;
  let mockHandler: CallHandler;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
          get: jest.fn(() => 'test-agent'),
          id: 'test-request-id',
        }),
        getResponse: () => ({
          statusCode: 200,
        }),
      }),
    } as ExecutionContext;

    mockHandler = {
      handle: () => of({ data: 'test' }),
    } as CallHandler;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should log request and response', (done) => {
    const loggerSpy = jest.spyOn(interceptor['logger'], 'log');
    
    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: () => {
        expect(loggerSpy).toHaveBeenCalled();
        done();
      },
    });
  });
});


