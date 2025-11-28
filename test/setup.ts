import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean up test data if needed
  // await prisma.$executeRaw`TRUNCATE TABLE ... CASCADE;`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

