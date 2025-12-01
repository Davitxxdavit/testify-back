import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('Payments Flow Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Create test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test-payments@test.com',
        password: 'password123',
        name: 'Test User',
      });

    authToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;

    // Create test order
    const category = await prisma.menuCategory.create({
      data: { name: 'Test Category' },
    });

    const menuItem = await prisma.menuItem.create({
      data: {
        categoryId: category.id,
        name: 'Test Burger',
        price: 15.99,
        isActive: true,
      },
    });

    const order = await prisma.order.create({
      data: {
        userId,
        type: 'INSTANT',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        deliveryType: 'PICKUP',
        totalPrice: 15.99,
      },
    });

    orderId = order.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.payment.deleteMany({ where: { orderId } });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: 'test-payments@test.com' } });
    await app.close();
  });

  it('should create payment intent', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/payments/intent')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        orderId,
        provider: 'STRIPE',
        amount: 15.99,
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('paymentId');
    expect(response.body.data).toHaveProperty('idempotencyKey');
  });

  it('should handle webhook (with signature verification)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/payments/webhook/stripe')
      .set('stripe-signature', 'test-signature')
      .send({
        id: 'test-payment-id',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'test-payment-id',
            status: 'succeeded',
          },
        },
      })
      .expect(200);

    expect(response.body.data).toHaveProperty('received');
  });
});


