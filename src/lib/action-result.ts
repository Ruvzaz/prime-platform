/**
 * Standardized result type for Server Actions
 */
export type ActionResult<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  redirectUrl?: string;
  error?: {
    code: string;
    message: string;
    fields?: Record<string, string[]>; // For Zod validation errors
  };
};

/**
 * Common Error Codes
 */
export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  NOT_FOUND: "NOT_FOUND",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CONFLICT: "CONFLICT",
  BAD_REQUEST: "BAD_REQUEST",
} as const;

/**
 * Utility to create a success result
 */
export function successResult<T>(data?: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

/**
 * Utility to create an error result
 */
export function errorResult(
  code: keyof typeof ErrorCodes | string,
  message: string,
  fields?: Record<string, string[]>
): ActionResult {
  return {
    success: false,
    error: {
      code,
      message,
      fields,
    },
  };
}
