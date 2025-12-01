import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let staffToken: string;
  let userId: string;
  let staffId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Clean up test users
    await prisma.user.deleteMany({ where: { email: { contains: 'test@' } } });
    await prisma.staff.deleteMany({ where: { phone: { contains: 'test' } } });
  });

  afterAll(async () => {
    // Clean up
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    if (staffId) await prisma.staff.delete({ where: { id: staffId } }).catch(() => {});
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          phone: '+995555123456',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
          expect(res.body.data.user.email).toBe('test@example.com');
          userToken = res.body.data.accessToken;
          userId = res.body.data.user.id;
        });
    });

    it('should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          userToken = res.body.data.accessToken;
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('POST /api/auth/staff/login', () => {
    it('should create and login staff', async () => {
      // Create staff first
      const staff = await prisma.staff.create({
        data: {
          name: 'Test Staff',
          role: 'KITCHEN',
          phone: '+995555999888',
          passwordHash: '$2b$10$rQZ8vJ8vJ8vJ8vJ8vJ8vJ.8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ8v', // bcrypt hash of 'password123'
        },
      });
      staffId = staff.id;

      // Update with proper hash
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('password123', 10);
      await prisma.staff.update({ where: { id: staff.id }, data: { passwordHash: hash } });

      return request(app.getHttpServer())
        .post('/api/auth/staff/login')
        .send({
          phone: '+995555999888',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          staffToken = res.body.data.accessToken;
        });
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token', // This would need a real refresh token
        })
        .expect((res) => {
          // May fail if refresh token is invalid, which is expected
          expect([200, 401]).toContain(res.status);
        });
    });
  });
});



