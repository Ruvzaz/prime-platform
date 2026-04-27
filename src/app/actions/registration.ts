"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RegStatus } from "@prisma/client";
import { extractAttendeeInfo } from "@/lib/attendee-utils";
import { getRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { ActionResult, ErrorCodes, errorResult, successResult } from "@/lib/action-result";
import { handleActionError } from "@/lib/error-utils";

function generateRefCode(): string {
  return "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function registerAttendee(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    // 1. Rate Limiting (15 requests per 10 minutes)
    const headersList = await headers()
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(',')[0].trim() : "unknown-ip"
    
    const isAllowed = await getRateLimit(ip, 15, 10 * 60 * 1000)
    if (!isAllowed) {
      return errorResult("TOO_MANY_REQUESTS", "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่");
    }

    const eventId = formData.get("eventId") as string;
    const slug = formData.get("eventSlug") as string;
    
    if (!eventId || !slug) {
      return errorResult(ErrorCodes.BAD_REQUEST, "ข้อมูลกิจกรรมไม่ครบถ้วน กรุณารีเฟรชหน้าแล้วลองใหม่");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
          title: true, 
          startDate: true,
          emailSubject: true,
          emailBody: true,
          emailAttachmentUrl: true,
          formFields: true
      },
    });

    if (!event) {
        return errorResult(ErrorCodes.NOT_FOUND, "ไม่พบข้อมูลกิจกรรม");
    }

    const formFields = event.formFields as { id: string; label: string; type: string }[];
    const rawData: Record<string, any> = {};
    const keys = Array.from(new Set(Array.from(formData.keys())));
    
    for (const key of keys) {
      if (key.startsWith("field_") && !key.endsWith("_other")) {
         const fieldId = key.replace("field_", "");
         const values = formData.getAll(key) as string[];
         
          if (values.length > 1) {
             rawData[fieldId] = values;
         } else if (values.length === 1) {
             let val = values[0];
             
             if (val === "__other__") {
                 const otherVal = formData.get(`${key}_other`);
                 if (otherVal && String(otherVal).trim() !== "") {
                     val = String(otherVal).trim();
                 } else {
                     val = "อื่นๆ"; 
                 }
             }
             
             const fieldDef = formFields.find(f => f.id === fieldId);
             if (fieldDef && typeof val === "string") {
                 if (fieldDef.type === "LONG_TEXT" && val.length > 2000) {
                     return errorResult(ErrorCodes.VALIDATION_FAILED, `ข้อความในช่อง "${fieldDef.label}" ยาวเกินไป (สูงสุด 2000 ตัวอักษร)`);
                 } else if (fieldDef.type !== "LONG_TEXT" && fieldDef.type !== "FILE" && val.length > 255) {
                     return errorResult(ErrorCodes.VALIDATION_FAILED, `ข้อความในช่อง "${fieldDef.label}" ยาวเกินไป (สูงสุด 255 ตัวอักษร)`);
                 }
             }
             
             rawData[fieldId] = val;
         }
      }
    }

    let referenceCode = "";
    const MAX_RETRIES = 3;
    let registration = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      referenceCode = generateRefCode();
      try {
        registration = await prisma.registration.create({
          data: {
            eventId,
            formData: rawData,
            referenceCode,
            status: "CONFIRMED",
          },
        });
        break; 
      } catch (e) {
        if (e instanceof Error && "code" in e && (e as { code: string }).code === "P2002" && attempt < MAX_RETRIES - 1) {
          continue; 
        }
        throw e; // Let the general handler take it
      }
    }

    const { name, email } = extractAttendeeInfo(rawData, event?.formFields || undefined);

    if (email && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD && event) {
      try {
        const { sendRegistrationEmail } = await import("@/lib/email");
        await sendRegistrationEmail(
            email, 
            name, 
            event.title, 
            referenceCode, 
            event.startDate, 
            event.emailSubject, 
            event.emailBody, 
            event.emailAttachmentUrl
        );
      } catch (e) {
        console.error("Failed to send confirmation email:", e);
      }
    }
    
    return successResult(
      { 
        referenceCode, 
        slug, 
        redirectUrl: `/events/${slug}/success?code=${referenceCode}` 
      }, 
      "ลงทะเบียนสำเร็จแล้ว"
    );
  } catch (error) {
    return handleActionError(error);
  }
}

export async function getRegistrations(
  eventId?: string, 
  page: number = 1, 
  pageSize: number = 10,
  query: string = ""
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { data: [], metadata: { total: 0, page: 1, pageSize: 10, totalPages: 0 } };
  }

  try {
    const where: any = {
      event: { isActive: true }, // Exclude soft-deleted events
    };
    
    if (eventId && eventId !== "all") {
      where.eventId = eventId;
    }

    // Search Logic (Basic)
    if (query) {
       // We search refCode OR common fields in formData
       // Since formData is Json, we can't easily do a full-text search on the whole object standardly in Prisma without Raw.
       // However, we can check specific common keys if we know them.
       // OR we can fetch more and filter in memory (bad for pagination).
       // BEST APPROACH FOR NOW (without Schema change):
       // Use Prisma's JSON filtering for specific well-known keys used in our form builder.
       // Our FormBuilder uses: "name", "email", "firstName", "lastName", "phone"
       // We will check if any of these contain the string.
       
       where.OR = [
         { referenceCode: { contains: query, mode: 'insensitive' } },
         { formData: { path: ['name'], string_contains: query } },
         { formData: { path: ['email'], string_contains: query } },
         { formData: { path: ['firstName'], string_contains: query } },
         { formData: { path: ['lastName'], string_contains: query } },
         // Add support for dynamic keys if they follow a pattern, but for now specific keys are safer.
       ];
    }
    
    const [registrations, total] = await prisma.$transaction([
      prisma.registration.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          referenceCode: true,
          status: true,
          createdAt: true,
          formData: true,
          checkIn: {
              select: { scannedAt: true }
          },
          event: {
            select: { title: true, slug: true, formFields: { orderBy: { order: 'asc' } } }
          }
        }
      }),
      prisma.registration.count({ where })
    ]);

    return {
      data: registrations,
      metadata: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  } catch (error) {
    console.error("Failed to fetch registrations:", error);
    return { data: [], metadata: { total: 0, page: 1, pageSize: 10, totalPages: 0 } };
  }
}

export async function updateRegistration(
  id: string,
  status: RegStatus,
  formData: Record<string, any>
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.registration.update({
      where: { id },
      data: {
        status,
        formData,
      },
    });
    revalidatePath("/dashboard/registrations");
    return { success: true };
  } catch (error) {
    console.error("Failed to update registration:", error);
    return { success: false, error: "Failed to update registration" };
  }
}

export async function deleteCheckIn(registrationId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.checkIn.delete({
      where: { registrationId },
    });
    revalidatePath("/dashboard/registrations");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete check-in:", error);
    return { success: false, error: "Failed to delete check-in" };
  }
}

import { auth } from "@/auth";

export async function createCheckIn(registrationId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const staffId = session.user.id;
    // Check if already checked in
    const existing = await prisma.checkIn.findUnique({
      where: { registrationId }
    });

    if (existing) {
        return { success: true, message: "Already checked in" };
    }

    await prisma.checkIn.create({
      data: {
        registrationId,
        scannedAt: new Date(),
        staffId: session.user.id
      },
    });
    revalidatePath("/dashboard/registrations");
    revalidatePath("/events/[slug]/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to create check-in:", error);
    return { success: false, error: "Failed to create check-in" };
  }
}

export async function getRecentCheckIns(eventId: string, limit = 10) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return [];
  }

  try {
    const checkIns = await prisma.checkIn.findMany({
      where: {
        registration: {
            eventId: eventId
        }
      },
      take: limit,
      orderBy: {
        scannedAt: 'desc'
      },
      include: {
        registration: {
            include: {
                event: {
                    include: { formFields: true }
                }
            }
        }
      }
    });

    // Transform for client
    // We want registration details + scan time
    return checkIns.map(ci => ({
        id: ci.id,
        scannedAt: ci.scannedAt,
        registration: ci.registration
    }));
  } catch (error) {
    console.error("Failed to fetch recent check-ins:", error);
    return [];
  }
}

export async function getRegistrationsForExport(
  eventId?: string, 
  query: string = ""
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return [];
  }

  try {
    const where: any = {
      event: { isActive: true }, 
    };
    
    if (eventId && eventId !== "all") {
      where.eventId = eventId;
    }

    if (query) {
       where.OR = [
         { referenceCode: { contains: query, mode: 'insensitive' } },
         { formData: { path: ['name'], string_contains: query } },
         { formData: { path: ['email'], string_contains: query } },
         { formData: { path: ['firstName'], string_contains: query } },
         { formData: { path: ['lastName'], string_contains: query } },
       ];
    }
    
    // FETCH ALL with specific fields for export
    const registrations = await prisma.registration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        referenceCode: true,
        status: true,
        createdAt: true,
        formData: true,
        checkIn: {
            select: { scannedAt: true }
        },
        event: {
          select: { 
              title: true,
              formFields: {
                  orderBy: { order: 'asc' },
                  select: { id: true, label: true, type: true }
              }
          }
        }
      }
    });

    return registrations;
  } catch (error) {
    console.error("Failed to fetch registrations for export:", error);
    return [];
  }
}

export async function deleteRegistrations(registrationIds: string[]) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { message: "Unauthorized" };
  }

  try {
    await prisma.registration.deleteMany({
      where: {
        id: { in: registrationIds }
      }
    });

    revalidatePath("/registrations");
    revalidatePath("/dashboard");
    revalidatePath("/events");
    return { message: "Registrations deleted successfully" };
  } catch (error) {
    console.error("Failed to delete registrations:", error);
    return { message: "Failed to delete registrations" };
  }
}
