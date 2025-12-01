import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('ChatController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let staffToken: string;
  let userId: string;
  let staffId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    // Create user
    const bcrypt = require('bcrypt');
    const user = await prisma.user.create({
      data: {
        name: 'Chat User',
        email: 'chatuser@example.com',
        phone: '+995555222333',
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });
    userId = user.id;

    const userLoginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'chatuser@example.com', password: 'password123' });
    userToken = userLoginRes.body.data.accessToken;

    // Create staff
    const staff = await prisma.staff.create({
      data: {
        name: 'Chat Staff',
        role: 'KITCHEN',
        phone: '+995555333444',
        passwordHash: await bcrypt.hash('password123', 10),
      },
    });
    staffId = staff.id;

    const staffLoginRes = await request(app.getHttpServer())
      .post('/api/auth/staff/login')
      .send({ phone: '+995555333444', password: 'password123' });
    staffToken = staffLoginRes.body.data.accessToken;

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: userId,
        type: 'INSTANT',
        deliveryType: 'PICKUP',
        totalPrice: 20.00,
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    if (staffId) await prisma.staff.delete({ where: { id: staffId } }).catch(() => {});
    await app.close();
  });

  describe('GET /api/chat/:orderId', () => {
    it('should get chat history', () => {
      return request(app.getHttpServer())
        .get(`/api/chat/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('POST /api/chat/:orderId', () => {
    it('should send a message as user', () => {
      return request(app.getHttpServer())
        .post(`/api/chat/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          message: 'Hello, when will my order be ready?',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.data.message).toBe('Hello, when will my order be ready?');
        });
    });

    it('should send a message as staff', () => {
      return request(app.getHttpServer())
        .post(`/api/chat/${orderId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          message: 'Your order will be ready in 15 minutes!',
        })
        .expect(201);
    });
  });
});



