import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
  private redis: Redis | null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize Redis connection with error handling
    try {
      const redisConfig = {
        host: this.configService.get<string>('redis.host') || 'localhost',
        port: this.configService.get<number>('redis.port') || 6379,
        password: this.configService.get<string>('redis.password'),
        db: this.configService.get<number>('redis.db') || 0,
        retryStrategy: () => null, // Disable retry to prevent connection loops
        maxRetriesPerRequest: null,
        lazyConnect: true, // Don't connect immediately
      };

      this.redis = new Redis(redisConfig);
      
      // Handle connection errors silently
      this.redis.on('error', () => {
        // Silently handle errors - Redis is optional for basic functionality
      });
    } catch (error) {
      // Redis is optional - app can run without it
      this.redis = null;
    }
  }

  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkRedis() {
    if (!this.redis) {
      return {
        status: 'warning',
        redis: 'not configured',
        message: 'Redis is optional for basic functionality',
        timestamp: new Date().toISOString(),
      };
    }
    
    try {
      await this.redis.ping();
      return {
        status: 'ok',
        redis: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        redis: 'disconnected',
        error: error.message,
        message: 'Redis is optional - app will work without it',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

