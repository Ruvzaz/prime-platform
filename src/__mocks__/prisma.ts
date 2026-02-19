import { vi } from 'vitest';

// Mock Prisma client with deep mock capability
export const prisma = {
  registration: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  event: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  checkIn: {
    create: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    update: vi.fn(),
  },
  formField: {
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn(),
};
