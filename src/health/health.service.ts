import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';

@Injectable()
export class HealthService {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const redisConfig = {
      host: this.configService.get<string>('redis.host') || 'localhost',
      port: this.configService.get<number>('redis.port') || 6379,
      password: this.configService.get<string>('redis.password'),
      db: this.configService.get<number>('redis.db') || 0,
    };

    this.redis = new Redis(redisConfig);
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
        timestamp: new Date().toISOString(),
      };
    }
  }
}

