import { vi } from 'vitest';

// Configurable session mock
let mockSession: any = null;

export function setMockSession(session: any) {
  mockSession = session;
}

export function clearMockSession() {
  mockSession = null;
}

export const auth = vi.fn(async () => mockSession);
export const signIn = vi.fn();
export const signOut = vi.fn();
export const handlers = {};
