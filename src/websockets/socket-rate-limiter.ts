/**
 * Fixed-window rate limiter keyed by socket id: at most `limit` messages
 * per `windowMs`.
 */
export class SocketRateLimiter {
  private readonly windows = new Map<string, { start: number; count: number }>();

  constructor(
    private readonly limit = 10,
    private readonly windowMs = 1000,
  ) {}

  allow(socketId: string, now = Date.now()): boolean {
    const window = this.windows.get(socketId);
    if (!window || now - window.start >= this.windowMs) {
      this.windows.set(socketId, { start: now, count: 1 });
      return true;
    }
    window.count++;
    return window.count <= this.limit;
  }

  release(socketId: string): void {
    this.windows.delete(socketId);
  }
}
