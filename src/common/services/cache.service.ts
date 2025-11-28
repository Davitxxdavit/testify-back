import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly enabled: boolean;
  private connectionAttempted = false;
  private connectionFailed = false;

  constructor(private configService: ConfigService) {
    this.enabled = !!this.configService.get<string>('redis.host');
    
    if (this.enabled) {
      try {
        this.redis = new Redis({
          host: this.configService.get<string>('redis.host') || 'localhost',
          port: this.configService.get<number>('redis.port') || 6379,
          password: this.configService.get<string>('redis.password'),
          db: this.configService.get<number>('redis.db') || 0,
          retryStrategy: (times) => {
            if (times > 3) {
              if (!this.connectionFailed) {
                this.logger.warn('Redis connection failed after 3 retries. Caching will be disabled.');
                this.connectionFailed = true;
              }
              return null; // Stop retrying
            }
            return Math.min(times * 50, 2000);
          },
          maxRetriesPerRequest: null, // Don't retry individual requests
          lazyConnect: true,
          enableOfflineQueue: false, // Don't queue commands when disconnected
        });

        // Only log errors once, not repeatedly
        this.redis.on('error', (error) => {
          if (!this.connectionFailed && this.connectionAttempted) {
            // Only log if we haven't already logged a failure
            this.logger.debug(`Redis error: ${error.message}`);
          }
        });

        this.redis.on('connect', () => {
          this.logger.log('Redis connected successfully');
          this.connectionFailed = false;
        });

        // Connect asynchronously without throwing
        this.connectionAttempted = true;
        this.redis.connect().catch((error) => {
          if (!this.connectionFailed) {
            this.logger.warn(`Redis connection failed: ${error.message}. Caching disabled.`);
            this.connectionFailed = true;
          }
          // Don't set redis to null here, keep it for potential reconnection
        });
      } catch (error: any) {
        this.logger.warn('Redis initialization failed, caching disabled');
        this.redis = null;
        this.connectionFailed = true;
      }
    } else {
      this.logger.debug('Redis not configured, caching disabled');
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  private async ensureConnection(): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    // If we've already failed to connect, don't keep trying
    if (this.connectionFailed) {
      return false;
    }

    try {
      if (this.redis.status !== 'ready') {
        // Try to reconnect if not ready, but with a timeout
        const connectPromise = this.redis.connect();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 1000)
        );
        
        await Promise.race([connectPromise, timeoutPromise]);
      }
      
      // Verify connection with a ping
      await this.redis.ping();
      this.connectionFailed = false;
      return true;
    } catch (error) {
      // Silently fail - don't log every time
      this.connectionFailed = true;
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!(await this.ensureConnection())) {
      return null;
    }

    try {
      const value = await this.redis!.get(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      this.logger.warn(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    if (!(await this.ensureConnection())) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.redis!.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis!.set(key, serialized);
      }
      return true;
    } catch (error) {
      this.logger.warn(`Cache set error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!(await this.ensureConnection())) {
      return false;
    }

    try {
      await this.redis!.del(key);
      return true;
    } catch (error) {
      this.logger.warn(`Cache delete error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!(await this.ensureConnection())) {
      return 0;
    }

    try {
      const keys = await this.redis!.keys(pattern);
      if (keys.length > 0) {
        await this.redis!.del(...keys);
      }
      return keys.length;
    } catch (error) {
      this.logger.warn(`Cache delete pattern error for ${pattern}: ${error.message}`);
      return 0;
    }
  }

  // Cache key generators
  static menuItemKey(itemId: number): string {
    return `menu:item:${itemId}`;
  }

  static menuCategoryKey(categoryId: number): string {
    return `menu:category:${categoryId}`;
  }

  static menuItemsKey(): string {
    return 'menu:items:all';
  }

  static userProfileKey(userId: string): string {
    return `user:profile:${userId}`;
  }

  static userOrdersKey(userId: string, filters?: string): string {
    return `user:orders:${userId}${filters ? `:${filters}` : ''}`;
  }

  static orderKey(orderId: string): string {
    return `order:${orderId}`;
  }
}

