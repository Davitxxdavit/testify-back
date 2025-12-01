import { RequestIdInterceptor } from './request-id.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('RequestIdInterceptor', () => {
  let interceptor: RequestIdInterceptor;
  let mockContext: ExecutionContext;
  let mockHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new RequestIdInterceptor();
    mockRequest = {
      headers: {},
      id: undefined,
    };
    mockResponse = {
      setHeader: jest.fn(),
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as ExecutionContext;

    mockHandler = {
      handle: () => of({ data: 'test' }),
    } as CallHandler;
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should generate request ID if not present', (done) => {
    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: () => {
        expect(mockRequest.id).toBeDefined();
        expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
        done();
      },
    });
  });

  it('should use existing request ID from header', (done) => {
    mockRequest.headers['x-request-id'] = 'existing-id';

    interceptor.intercept(mockContext, mockHandler).subscribe({
      next: () => {
        expect(mockRequest.id).toBe('existing-id');
        expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id');
        done();
      },
    });
  });
});


