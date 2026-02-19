import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/__mocks__/prisma';

// Mock modules
vi.mock('@/lib/prisma', () => ({ prisma }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

// Import after mocks
import { getRegistrations, updateRegistration, deleteCheckIn } from '../registration';

describe('getRegistrations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return all registrations when no eventId is provided', async () => {
    const mockData = [
      { id: '1', referenceCode: 'REF-001', status: 'CONFIRMED', createdAt: new Date(), formData: {}, checkIn: null, event: { title: 'Event 1', slug: 'event-1', formFields: [] } },
      { id: '2', referenceCode: 'REF-002', status: 'PENDING', createdAt: new Date(), formData: {}, checkIn: null, event: { title: 'Event 2', slug: 'event-2', formFields: [] } },
    ];
    prisma.registration.findMany.mockResolvedValue(mockData);

    const result = await getRegistrations();
    expect(result).toEqual(mockData);
    expect(prisma.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('should filter by eventId when provided', async () => {
    prisma.registration.findMany.mockResolvedValue([]);

    await getRegistrations('event-123');
    expect(prisma.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: 'event-123' } })
    );
  });

  it('should treat "all" as no filter', async () => {
    prisma.registration.findMany.mockResolvedValue([]);

    await getRegistrations('all');
    expect(prisma.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it('should return empty array on error', async () => {
    prisma.registration.findMany.mockRejectedValue(new Error('DB Error'));

    const result = await getRegistrations();
    expect(result).toEqual([]);
  });
});

describe('updateRegistration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update registration successfully', async () => {
    prisma.registration.update.mockResolvedValue({});

    const result = await updateRegistration('reg-1', 'CONFIRMED', { name: 'Test' });
    expect(result).toEqual({ success: true });
    expect(prisma.registration.update).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: { status: 'CONFIRMED', formData: { name: 'Test' } },
    });
  });

  it('should return error on failure', async () => {
    prisma.registration.update.mockRejectedValue(new Error('Not found'));

    const result = await updateRegistration('bad-id', 'PENDING', {});
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to update registration');
  });
});

describe('deleteCheckIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete check-in successfully', async () => {
    prisma.checkIn.delete.mockResolvedValue({});

    const result = await deleteCheckIn('reg-1');
    expect(result).toEqual({ success: true });
    expect(prisma.checkIn.delete).toHaveBeenCalledWith({
      where: { registrationId: 'reg-1' },
    });
  });

  it('should return error on failure', async () => {
    prisma.checkIn.delete.mockRejectedValue(new Error('Not found'));

    const result = await deleteCheckIn('bad-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to delete check-in');
  });
});
