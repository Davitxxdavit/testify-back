import { SocketRateLimiter } from './socket-rate-limiter';

describe('SocketRateLimiter', () => {
  it('allows the first message from a socket', () => {
    const limiter = new SocketRateLimiter(10, 1000);
    expect(limiter.allow('socket-1', 5_000)).toBe(true);
  });

  it('allows up to the limit within one window and rejects the rest', () => {
    const limiter = new SocketRateLimiter(3, 1000);
    const results = [0, 100, 200, 300].map((t) => limiter.allow('socket-1', t));
    expect(results).toEqual([true, true, true, false]);
  });

  it('starts a new window once the previous one has passed', () => {
    const limiter = new SocketRateLimiter(1, 1000);
    expect(limiter.allow('socket-1', 0)).toBe(true);
    expect(limiter.allow('socket-1', 500)).toBe(false);
    expect(limiter.allow('socket-1', 1000)).toBe(true);
  });

  it('tracks sockets independently and forgets released ones', () => {
    const limiter = new SocketRateLimiter(1, 1000);
    expect(limiter.allow('socket-1', 0)).toBe(true);
    expect(limiter.allow('socket-2', 0)).toBe(true);
    limiter.release('socket-1');
    expect(limiter.allow('socket-1', 1)).toBe(true);
  });
});
