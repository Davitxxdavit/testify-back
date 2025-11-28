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

  // Liveness check - basic app is running
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  // Readiness check - app is ready to serve traffic
  async checkReady() {
    const startTime = Date.now();
    const checks: any = {
      database: await this.checkDatabaseWithTime(),
      redis: await this.checkRedisWithTime(),
    };

    const totalTime = Date.now() - startTime;
    const allHealthy = Object.values(checks).every(
      (check: any) => check.status === 'ok' || check.status === 'warning',
    );

    return {
      status: allHealthy ? 'ok' : 'error',
      checks,
      responseTime: `${totalTime}ms`,
      timestamp: new Date().toISOString(),
    };
  }

  async checkDatabase() {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        database: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkDatabaseWithTime() {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        message: 'connected',
        responseTime: `${responseTime}ms`,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: 'disconnected',
        error: error.message,
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
      const startTime = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        redis: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      return {
        status: 'error',
        redis: 'disconnected',
        error: error.message,
        message: 'Redis is optional - app will work without it',
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkRedisWithTime() {
    if (!this.redis) {
      return {
        status: 'warning',
        message: 'not configured',
        note: 'Redis is optional for basic functionality',
      };
    }
    
    try {
      const startTime = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        message: 'connected',
        responseTime: `${responseTime}ms`,
      };
    } catch (error: any) {
      return {
        status: 'error',
        message: 'disconnected',
        error: error.message,
      };
    }
  }
}

