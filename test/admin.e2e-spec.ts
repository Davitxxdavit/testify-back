import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminId: string;
  let userId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Create admin
    const bcrypt = require('bcrypt');
    const admin = await prisma.staff.create({
      data: {
        name: 'Admin Test',
        role: 'ADMIN',
        phone: '+995555888999',
        passwordHash: await bcrypt.hash('admin123', 10),
      },
    });
    adminId = admin.id;

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ phone: '+995555888999', password: 'admin123' });
    adminToken = loginRes.body.data.accessToken;

    // Create test user and order for analytics
    const user = await prisma.user.create({
      data: {
        name: 'Analytics User',
        email: 'analytics@example.com',
        phone: '+995555000111',
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });
    userId = user.id;

    const category = await prisma.menuCategory.create({
      data: { name: 'Analytics Category', sortOrder: 1 },
    });

    const item = await prisma.menuItem.create({
      data: {
        categoryId: category.id,
        name: 'Analytics Item',
        price: 10.00,
        isActive: true,
      },
    });

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        type: 'INSTANT',
        deliveryType: 'PICKUP',
        totalPrice: 10.00,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    if (adminId) await prisma.staff.delete({ where: { id: adminId } }).catch(() => {});
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await app.close();
  });

  describe('GET /api/admin/analytics/daily-sales', () => {
    it('should get daily sales analytics', () => {
      return request(app.getHttpServer())
        .get('/api/admin/analytics/daily-sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('totalRevenue');
          expect(res.body.data).toHaveProperty('totalOrders');
          expect(res.body.data).toHaveProperty('dailySales');
        });
    });
  });

  describe('GET /api/admin/users', () => {
    it('should get all users', () => {
      return request(app.getHttpServer())
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('GET /api/admin/chat/:orderId', () => {
    it('should get chat history', () => {
      return request(app.getHttpServer())
        .get(`/api/admin/chat/${orderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});



