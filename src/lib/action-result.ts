"use server";

/**
 * Standardized response type for all server actions.
 * Ensures consistent error handling across the application.
 */
export type ActionResult<T = void> =
  | { success: true; message?: string; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };
