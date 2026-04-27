import { z } from "zod";
import { errorResult, ErrorCodes } from "./action-result";
import { Prisma } from "@prisma/client";

/**
 * Maps a Zod validation error to an ActionResult
 */
export function handleValidationError(error: z.ZodError) {
  const fields: Record<string, string[]> = error.flatten().fieldErrors as Record<string, string[]>;
  return errorResult(
    ErrorCodes.VALIDATION_FAILED,
    "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
    fields
  );
}

/**
 * Maps common Prisma errors to an ActionResult
 */
export function handleDatabaseError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint violation
    if (error.code === "P2002") {
      return errorResult(
        ErrorCodes.CONFLICT,
        "ข้อมูลนี้มีอยู่ในระบบแล้ว (Duplicate entry)"
      );
    }
  }

  console.error("Unhandled Database Error:", error);
  return errorResult(
    ErrorCodes.INTERNAL_ERROR,
    "เกิดข้อผิดพลาดภายในระบบกรุณาลองใหม่อีกครั้ง"
  );
}

/**
 * General catch-all error handler for actions
 */
export function handleActionError(error: unknown) {
  if (error instanceof z.ZodError) return handleValidationError(error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) return handleDatabaseError(error);
  
  console.error("Unhandled Action Error:", error);
  return errorResult(
    ErrorCodes.INTERNAL_ERROR,
    "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง"
  );
}
