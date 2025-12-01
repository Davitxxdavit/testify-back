import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';
import { Queue } from 'bullmq';
import { getQueueToken } from '@nestjs/bullmq';

describe('Scheduled Orders Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let scheduledOrdersQueue: Queue;
  let authToken: string;
  let userId: string;
  let menuItemId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    scheduledOrdersQueue = moduleFixture.get<Queue>(getQueueToken('scheduledOrders'));
    await app.init();

    // Create test user
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test-scheduled@test.com',
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
    await scheduledOrdersQueue.obliterate({ force: true });
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: 'test-scheduled@test.com' } });
    await app.close();
  });

  it('should create scheduled order', async () => {
    const scheduledFor = new Date(Date.now() + 60000); // 1 minute from now

    const response = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SCHEDULED',
        scheduledFor: scheduledFor.toISOString(),
        items: [
          {
            itemId: menuItemId,
            quantity: 1,
            price: 15.99,
          },
        ],
        deliveryType: 'PICKUP',
      })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.type).toBe('SCHEDULED');
    expect(response.body.data.scheduledFor).toBeDefined();

    // Verify job was created in queue
    const jobs = await scheduledOrdersQueue.getJobs(['delayed', 'waiting']);
    expect(jobs.length).toBeGreaterThan(0);
  });

  it('should reject scheduled order in the past', async () => {
    const pastDate = new Date(Date.now() - 1000);

    await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'SCHEDULED',
        scheduledFor: pastDate.toISOString(),
        items: [
          {
            itemId: menuItemId,
            quantity: 1,
            price: 15.99,
          },
        ],
        deliveryType: 'PICKUP',
      })
      .expect(400);
  });
});


