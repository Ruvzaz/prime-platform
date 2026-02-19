import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/__mocks__/prisma';
import { auth, setMockSession, clearMockSession } from '@/__mocks__/auth';

// Mock modules
vi.mock('@/lib/prisma', () => ({ prisma }));
vi.mock('@/auth', () => ({ auth }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@/lib/storage', () => ({ uploadToR2: vi.fn() }));

// Import after mocks
import { getEvents, deleteEvents } from '../events';

describe('getEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return events with registration counts', async () => {
    const mockEvents = [
      { id: '1', title: 'Event 1', slug: 'event-1', startDate: new Date(), _count: { registrations: 10 } },
      { id: '2', title: 'Event 2', slug: 'event-2', startDate: new Date(), _count: { registrations: 5 } },
    ];
    prisma.event.findMany.mockResolvedValue(mockEvents);

    const result = await getEvents();
    expect(result).toEqual(mockEvents);
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { registrations: true } } },
    });
  });

  it('should return empty array on error', async () => {
    prisma.event.findMany.mockRejectedValue(new Error('DB Error'));

    const result = await getEvents();
    expect(result).toEqual([]);
  });
});

describe('deleteEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMockSession();
  });

  it('should reject unauthorized users', async () => {
    clearMockSession(); // No session
    const result = await deleteEvents(['event-1']);
    expect(result.message).toBe('Unauthorized');
  });

  it('should reject non-ADMIN users', async () => {
    setMockSession({ user: { id: 'staff-1', role: 'STAFF' } });
    const result = await deleteEvents(['event-1']);
    expect(result.message).toBe('Unauthorized');
  });

  it('should delete events for ADMIN users', async () => {
    setMockSession({ user: { id: 'admin-1', role: 'ADMIN' } });
    prisma.event.deleteMany.mockResolvedValue({ count: 2 });

    const result = await deleteEvents(['event-1', 'event-2']);
    expect(result.message).toBe('Events deleted successfully');
    expect(prisma.event.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['event-1', 'event-2'] } },
    });
  });

  it('should handle delete failure gracefully', async () => {
    setMockSession({ user: { id: 'admin-1', role: 'ADMIN' } });
    prisma.event.deleteMany.mockRejectedValue(new Error('FK constraint'));

    const result = await deleteEvents(['event-1']);
    expect(result.message).toBe('Failed to delete events');
  });
});
