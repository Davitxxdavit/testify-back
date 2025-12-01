import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('Orders Flow Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;
  let menuItemId: number;

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
        email: 'test-orders@test.com',
        password: 'password123',
        name: 'Test User',
      });

    authToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;

    // Create test menu item
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

    menuItemId = menuItem.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: 'test-orders@test.com' } });
    await prisma.menuItem.deleteMany({ where: { id: menuItemId } });
    await prisma.menuCategory.deleteMany({ where: { name: 'Test Category' } });
    await app.close();
  });

  it('should create an order successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'INSTANT',
        items: [
          {
            itemId: menuItemId,
            quantity: 2,
            price: 15.99,
          },
        ],
        deliveryType: 'PICKUP',
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.status).toBe('PENDING');
    expect(response.body.data.totalPrice).toBe('31.98');
  });

  it('should get user orders', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
  });
});


