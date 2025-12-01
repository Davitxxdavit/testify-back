import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Queue } from 'bullmq';
import { OrderStatus, OrderType, PaymentStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    address: {
      findFirst: jest.fn(),
    },
    menuItem: {
      findUnique: jest.fn(),
    },
    orderItem: {
      create: jest.fn(),
    },
    orderItemModifier: {
      create: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    executeWithRetry: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
    getJobs: jest.fn(),
  };

  const mockNotificationsService = {
    emitOrderCreated: jest.fn(),
    emitOrderUpdated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'BullQueue_scheduledOrders', useValue: mockQueue },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw BadRequestException for scheduled order in the past', async () => {
      const pastDate = new Date(Date.now() - 1000);

      await expect(
        service.create('user-id', {
          type: OrderType.SCHEDULED,
          scheduledFor: pastDate.toISOString(),
          items: [],
          deliveryType: 'PICKUP',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for invalid menu item', async () => {
      mockPrismaService.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        service.create('user-id', {
          type: OrderType.INSTANT,
          items: [{ itemId: 999, quantity: 1, price: 10 }],
          deliveryType: 'PICKUP',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});


