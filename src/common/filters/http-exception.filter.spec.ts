import { ArgumentsHost, BadRequestException, NotFoundException } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

describe('AllExceptionsFilter', () => {
  const createHost = () => {
    const json = jest.fn();
    const response = {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
      json,
    };
    const request = {
      url: '/api/v1/orders',
      method: 'POST',
      headers: {},
      ip: '127.0.0.1',
      get: jest.fn(),
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;
    return { host, response, json };
  };

  it('keeps validation message arrays instead of crashing', () => {
    const filter = new AllExceptionsFilter();
    const { host, response, json } = createHost();

    expect(() =>
      filter.catch(
        new BadRequestException(['phone must be a string', 'items.0.quantity must not be less than 1']),
        host,
      ),
    ).not.toThrow();

    expect(response.status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0].message).toEqual([
      'phone must be a string',
      'items.0.quantity must not be less than 1',
    ]);
  });

  it('sanitizes string messages', () => {
    const filter = new AllExceptionsFilter();
    const { host, json } = createHost();

    filter.catch(new NotFoundException('token=abc123 not found'), host);

    expect(json.mock.calls[0][0].message).toBe('token=*** not found');
  });
});
