import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let userId: string;
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
        name: 'Profile Test User',
        email: 'profiletest@example.com',
        phone: '+995555666777',
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });
    userId = user.id;

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'profiletest@example.com', password: 'password123' });
    userToken = loginRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await app.close();
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.id).toBe(userId);
          expect(res.body.data).toHaveProperty('addresses');
        });
    });
  });

  describe('POST /api/users/addresses', () => {
    it('should create an address', () => {
      return request(app.getHttpServer())
        .post('/api/users/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          street: '456 Test Avenue',
          city: 'Tbilisi',
          postalCode: '0100',
          country: 'Georgia',
          latitude: 41.7151,
          longitude: 44.8271,
          isDefault: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.street).toBe('456 Test Avenue');
          addressId = res.body.data.id;
        });
    });
  });

  describe('GET /api/users/addresses', () => {
    it('should get user addresses', () => {
      return request(app.getHttpServer())
        .get('/api/users/addresses')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('PUT /api/users/addresses/:id', () => {
    it('should update address', () => {
      return request(app.getHttpServer())
        .put(`/api/users/addresses/${addressId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          street: '789 Updated Street',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.street).toBe('789 Updated Street');
        });
    });
  });

  describe('DELETE /api/users/addresses/:id', () => {
    it('should delete address', () => {
      return request(app.getHttpServer())
        .delete(`/api/users/addresses/${addressId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    });
  });
});


