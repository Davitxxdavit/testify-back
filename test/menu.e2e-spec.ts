import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('MenuController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let categoryId: number;
  let itemId: number;
  let modifierId: number;
  let adminId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Create admin user
    const bcrypt = require('bcrypt');
    const admin = await prisma.staff.create({
      data: {
        name: 'Admin User',
        role: 'ADMIN',
        phone: '+995555111222',
        passwordHash: await bcrypt.hash('admin123', 10),
      },
    });
    adminId = admin.id;

    // Login as admin
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ phone: '+995555111222', password: 'admin123' });
    adminToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (adminId) await prisma.staff.delete({ where: { id: adminId } }).catch(() => {});
    await app.close();
  });

  describe('GET /api/menu/categories (Public)', () => {
    it('should get all categories', () => {
      return request(app.getHttpServer())
        .get('/api/menu/categories')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('POST /api/menu/categories (Admin)', () => {
    it('should create a category', () => {
      return request(app.getHttpServer())
        .post('/api/menu/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Category',
          imageUrl: 'https://example.com/category.jpg',
          sortOrder: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.name).toBe('Test Category');
          categoryId = res.body.data.id;
        });
    });
  });

  describe('POST /api/menu/items (Admin)', () => {
    it('should create a menu item', () => {
      return request(app.getHttpServer())
        .post('/api/menu/items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          categoryId: categoryId,
          name: 'Test Burger',
          description: 'A delicious test burger',
          price: 15.99,
          imageUrl: 'https://example.com/burger.jpg',
          isActive: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.name).toBe('Test Burger');
          itemId = res.body.data.id;
        });
    });
  });

  describe('GET /api/menu/items (Public)', () => {
    it('should get all items', () => {
      return request(app.getHttpServer())
        .get('/api/menu/items')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter by category', () => {
      return request(app.getHttpServer())
        .get(`/api/menu/items?categoryId=${categoryId}`)
        .expect(200);
    });
  });

  describe('GET /api/menu/items/:id (Public)', () => {
    it('should get item by id', () => {
      return request(app.getHttpServer())
        .get(`/api/menu/items/${itemId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(itemId);
        });
    });
  });

  describe('POST /api/menu/modifiers (Admin)', () => {
    it('should create a modifier', () => {
      return request(app.getHttpServer())
        .post('/api/menu/modifiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          itemId: itemId,
          name: 'Extra Cheese',
          price: 2.50,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.name).toBe('Extra Cheese');
          modifierId = res.body.data.id;
        });
    });
  });

  describe('GET /api/menu/items/:itemId/modifiers (Public)', () => {
    it('should get modifiers for item', () => {
      return request(app.getHttpServer())
        .get(`/api/menu/items/${itemId}/modifiers`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('PUT /api/menu/items/:id (Admin)', () => {
    it('should update item', () => {
      return request(app.getHttpServer())
        .put(`/api/menu/items/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 16.99,
        })
        .expect(200)
        .expect((res) => {
          expect(Number(res.body.data.price)).toBe(16.99);
        });
    });
  });

  describe('DELETE /api/menu/items/:id (Admin)', () => {
    it('should soft delete item', () => {
      return request(app.getHttpServer())
        .delete(`/api/menu/items/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});


