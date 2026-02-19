import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/__mocks__/prisma';
import { auth, setMockSession, clearMockSession } from '@/__mocks__/auth';

// Mock modules
vi.mock('@/lib/prisma', () => ({ prisma }));
vi.mock('@/auth', () => ({ auth }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Import after mocks
import { verifyAndCheckIn } from '../check-in';

describe('verifyAndCheckIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMockSession();
  });

  it('should return error when reference code is empty', async () => {
    const result = await verifyAndCheckIn('');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Reference code is required');
  });

  it('should return "not found" when registration does not exist', async () => {
    prisma.registration.findUnique.mockResolvedValue(null);

    const result = await verifyAndCheckIn('REF-UNKNOWN');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Registration not found');
  });

  it('should return "already checked in" with attendee info', async () => {
    const checkedInAt = new Date('2026-01-15T10:00:00Z');
    prisma.registration.findUnique.mockResolvedValue({
      id: 'reg-1',
      formData: { name: 'John Doe', email: 'john@example.com' },
      event: { title: 'Tech Conference', slug: 'tech-conference' },
      checkIn: { scannedAt: checkedInAt },
    });

    const result = await verifyAndCheckIn('REF-ABC123');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Already checked in!');
    expect(result.attendee).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      eventTitle: 'Tech Conference',
      checkedInAt,
    });
  });

  it('should return "Unauthorized" when not logged in', async () => {
    prisma.registration.findUnique.mockResolvedValue({
      id: 'reg-1',
      formData: { name: 'Jane', email: 'jane@test.com' },
      event: { title: 'Event', slug: 'event' },
      checkIn: null,
    });
    clearMockSession(); // No session

    const result = await verifyAndCheckIn('REF-VALID1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized: Please log in');
  });

  it('should successfully check in an attendee', async () => {
    prisma.registration.findUnique.mockResolvedValue({
      id: 'reg-1',
      formData: { name: 'Alice', email: 'alice@test.com' },
      event: { title: 'Startup Meetup', slug: 'startup-meetup' },
      checkIn: null,
    });
    setMockSession({ user: { id: 'staff-1', role: 'STAFF' } });
    prisma.$transaction.mockResolvedValue([{}, {}]);

    const result = await verifyAndCheckIn('REF-CHECKIN');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Check-in Successful');
    expect(result.attendee).toEqual({
      name: 'Alice',
      email: 'alice@test.com',
      eventTitle: 'Startup Meetup',
    });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('should handle concurrent double check-in gracefully', async () => {
    prisma.registration.findUnique.mockResolvedValue({
      id: 'reg-1',
      formData: { name: 'Bob', email: 'bob@test.com' },
      event: { title: 'Event', slug: 'event' },
      checkIn: null,
    });
    setMockSession({ user: { id: 'staff-1', role: 'STAFF' } });
    // Simulate P2002 unique constraint error (concurrent check-in)
    const p2002Error = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    prisma.$transaction.mockRejectedValue(p2002Error);

    const result = await verifyAndCheckIn('REF-DOUBLE');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Already checked in (concurrent request)');
  });

  it('should convert reference code to uppercase', async () => {
    prisma.registration.findUnique.mockResolvedValue(null);

    await verifyAndCheckIn('ref-lower');
    expect(prisma.registration.findUnique).toHaveBeenCalledWith({
      where: { referenceCode: 'REF-LOWER' },
      include: { event: true, checkIn: true },
    });
  });
});
