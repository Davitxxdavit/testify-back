import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;
  let categoryId: number;
  let itemId: number;
  let orderId: string;
  let addressId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Create test user
    const bcrypt = require('bcrypt');
    const user = await prisma.user.create({
      data: {
        name: 'Order Test User',
        email: 'ordertest@example.com',
        phone: '+995555333444',
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });
    userId = user.id;

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'ordertest@example.com', password: 'password123' });
    userToken = loginRes.body.data.accessToken;

    // Create admin
    const admin = await prisma.staff.create({
      data: {
        name: 'Order Admin',
        role: 'ADMIN',
        phone: '+995555444555',
        passwordHash: await bcrypt.hash('admin123', 10),
      },
    });
    adminId = admin.id;

    const adminLoginRes = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ phone: '+995555444555', password: 'admin123' });
    adminToken = adminLoginRes.body.data.accessToken;

    // Create menu item
    const category = await prisma.menuCategory.create({
      data: { name: 'Test Category', sortOrder: 1 },
    });
    categoryId = category.id;

    const item = await prisma.menuItem.create({
      data: {
        categoryId: categoryId,
        name: 'Test Burger',
        price: 15.99,
        isActive: true,
      },
    });
    itemId = item.id;

    // Create address
    const address = await prisma.address.create({
      data: {
        userId: userId,
        street: '123 Test St',
        city: 'Tbilisi',
        country: 'Georgia',
      },
    });
    addressId = address.id;
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    if (adminId) await prisma.staff.delete({ where: { id: adminId } }).catch(() => {});
    await app.close();
  });

  describe('POST /api/orders', () => {
    it('should create an instant order', () => {
      return request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'INSTANT',
          deliveryType: 'OWN',
          addressId: addressId,
          items: [
            {
              itemId: itemId,
              quantity: 2,
              price: 15.99,
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.status).toBe('PENDING');
          orderId = res.body.data.id;
        });
    });

    it('should create a scheduled order', () => {
      const scheduledFor = new Date();
      scheduledFor.setHours(scheduledFor.getHours() + 2);

      return request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'SCHEDULED',
          deliveryType: 'OWN',
          scheduledFor: scheduledFor.toISOString(),
          addressId: addressId,
          items: [
            {
              itemId: itemId,
              quantity: 1,
              price: 15.99,
            },
          ],
        })
        .expect(201);
    });
  });

  describe('GET /api/orders', () => {
    it('should get user orders', () => {
      return request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order by id', () => {
      return request(app.getHttpServer())
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(orderId);
        });
    });
  });

  describe('GET /api/orders/admin/all (Admin)', () => {
    it('should get all orders', () => {
      return request(app.getHttpServer())
        .get('/api/orders/admin/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('PATCH /api/orders/:id/status (Admin)', () => {
    it('should update order status', () => {
      return request(app.getHttpServer())
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'PREPARING',
          notes: 'Order is being prepared',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('PREPARING');
        });
    });
  });

  describe('PATCH /api/orders/:id/cancel', () => {
    it('should cancel order', () => {
      // Create a new order to cancel
      return request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          type: 'INSTANT',
          deliveryType: 'PICKUP',
          items: [{ itemId: itemId, quantity: 1, price: 15.99 }],
        })
        .expect(201)
        .then((res) => {
          const cancelOrderId = res.body.data.id;
          return request(app.getHttpServer())
            .patch(`/api/orders/${cancelOrderId}/cancel`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(200);
        });
    });
  });
});

