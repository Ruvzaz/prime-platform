"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { RegStatus } from "@prisma/client";
import { extractAttendeeInfo } from "@/lib/attendee-utils";
import { logActivity } from "@/app/actions/activity-log";
import { getRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { ActionResult, ErrorCodes, errorResult, successResult } from "@/lib/action-result";
import { handleActionError } from "@/lib/error-utils";
import { auth } from "@/auth";

function generateRefCode(): string {
  return "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

// --- Helper Functions to Reduce Cognitive Complexity ---

async function checkRateLimitAndGetIP(): Promise<{ isAllowed: boolean; error?: ActionResult }> {
    const headersList = await headers()
    const forwarded = headersList.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(',')[0].trim() : "unknown-ip"
    
    const isAllowed = await getRateLimit(ip, 15, 10 * 60 * 1000)
    if (!isAllowed) {
        return { isAllowed: false, error: errorResult("TOO_MANY_REQUESTS", "คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่") };
    }
    return { isAllowed: true };
}

function parseRegistrationFormData(
    formData: FormData, 
    formFields: { id: string; label: string; type: string }[]
): { rawData?: Record<string, any>; error?: ActionResult } {
    const rawData: Record<string, any> = {};
    const keys = Array.from(new Set(Array.from(formData.keys())));
    
    for (const key of keys) {
      if (!key.startsWith("field_") || key.endsWith("_other")) continue;
      
      const fieldId = key.replace("field_", "");
      const values = formData.getAll(key) as string[];
      
      if (values.length > 1) {
          rawData[fieldId] = values;
          continue;
      } 
      
      if (values.length === 1) {
          let val = values[0];
          
          if (val === "__other__") {
              const otherVal = formData.get(`${key}_other`);
              val = (otherVal && String(otherVal).trim() !== "") ? String(otherVal).trim() : "อื่นๆ";
          }
          
          const fieldDef = formFields.find(f => f.id === fieldId);
          if (fieldDef && typeof val === "string") {
              if (fieldDef.type === "LONG_TEXT" && val.length > 2000) {
                  return { error: errorResult(ErrorCodes.VALIDATION_FAILED, `ข้อความในช่อง "${fieldDef.label}" ยาวเกินไป (สูงสุด 2000 ตัวอักษร)`) };
              } else if (fieldDef.type !== "LONG_TEXT" && fieldDef.type !== "FILE" && val.length > 255) {
                  return { error: errorResult(ErrorCodes.VALIDATION_FAILED, `ข้อความในช่อง "${fieldDef.label}" ยาวเกินไป (สูงสุด 255 ตัวอักษร)`) };
              }
          }
          rawData[fieldId] = val;
      }
    }
    return { rawData };
}

async function createRegistrationWithRetry(eventId: string, rawData: Record<string, any>) {
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
        return { referenceCode, registration };
      } catch (e) {
        if (e instanceof Error && "code" in e && (e as { code: string }).code === "P2002" && attempt < MAX_RETRIES - 1) {
          continue; 
        }
        throw e;
      }
    }
    throw new Error("Failed to generate unique reference code after max retries");
}

async function sendConfirmationEmailSafe(email: string, name: string, event: any, referenceCode: string) {
    if (!email || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !event) return;
    
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
            event.emailAttachmentUrl,
            event.generateQr,
            event.senderEmail
        );
        return true;
    } catch (e: any) {
        console.error("Failed to send confirmation email:", e);
        await logActivity({
            type: "EMAIL",
            action: "FAILED",
            description: `Failed to send confirmation email to ${email}`,
            eventId: event.id,
            metadata: { error: e.message }
        });
        return false;
    }
}

// --- Main Action Function ---

export async function registerAttendee(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    // 1. Rate Limiting
    const rateLimit = await checkRateLimitAndGetIP();
    if (!rateLimit.isAllowed) return rateLimit.error!;

    // 2. Validate Event Input
    const eventId = formData.get("eventId") as string;
    const slug = formData.get("eventSlug") as string;
    if (!eventId || !slug) {
      return errorResult(ErrorCodes.BAD_REQUEST, "ข้อมูลกิจกรรมไม่ครบถ้วน กรุณารีเฟรชหน้าแล้วลองใหม่");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { 
          id: true, title: true, startDate: true, emailSubject: true, 
          emailBody: true, emailAttachmentUrl: true, formFields: true,
          sendEmail: true, generateQr: true, senderEmail: true
      },
    });

    if (!event) return errorResult(ErrorCodes.NOT_FOUND, "ไม่พบข้อมูลกิจกรรม");

    // 3. Parse and Validate Form Data
    const formFields = event.formFields as { id: string; label: string; type: string }[];
    const parsed = parseRegistrationFormData(formData, formFields);
    if (parsed.error) return parsed.error;
    const rawData = parsed.rawData!;

    // 4. Create Record
    const { referenceCode, registration } = await createRegistrationWithRetry(eventId, rawData);

    // 5. Send Confirmation Email (if enabled)
    if (event.sendEmail) {
        const { name, email } = extractAttendeeInfo(rawData, formFields);
        const emailSent = await sendConfirmationEmailSafe(email, name, event, referenceCode);
        if (emailSent) {
            await logActivity({
                type: "EMAIL",
                action: "SUCCESS",
                description: `Sent confirmation email to ${email}`,
                eventId: event.id,
                registrationId: registration.id,
            });
        }
    }
    
    await logActivity({
        type: "REGISTRATION",
        action: "SUCCESS",
        description: `New registration created: ${referenceCode}`,
        eventId: event.id,
        registrationId: registration.id,
    });
    
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
  query: string = "",
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
  checkInStatus?: string,
  sessionFilter?: string
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { data: [], metadata: { total: 0, page: 1, pageSize: 10, totalPages: 0 } };
  }

  try {
    const where: any = {};
    
    if (eventId && eventId !== "all") {
      where.eventId = eventId;
    }

    // Search Logic (Basic)
    if (query) {
       const matchingIds = await prisma.$queryRaw<{id: string}[]>`
          SELECT id FROM "Registration"
          WHERE "referenceCode" ILIKE ${`%${query}%`}
             OR "formData"::text ILIKE ${`%${query}%`}
       `;
       where.id = { in: matchingIds.map((m) => m.id) };
    }
    
    // Check-in Filters
    if (checkInStatus) {
        if (checkInStatus === "any") {
            where.checkIns = { some: {} };
        } else if (checkInStatus === "none") {
            where.checkIns = { none: {} };
        } else if (checkInStatus === "attended" && sessionFilter) {
            where.checkIns = { some: { sessionTitle: sessionFilter } };
        } else if (checkInStatus === "missing" && sessionFilter) {
            where.checkIns = { none: { sessionTitle: sessionFilter } };
        }
    }
    
    const [registrations, total] = await prisma.$transaction([
      prisma.registration.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          referenceCode: true,
          status: true,
          createdAt: true,
          formData: true,
          checkIns: {
              select: { id: true, scannedAt: true, sessionTitle: true }
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
    await prisma.checkIn.deleteMany({
      where: { registrationId },
    });
    revalidatePath("/dashboard/registrations");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete check-in:", error);
    return { success: false, error: "Failed to delete check-in" };
  }
}



export async function createCheckIn(registrationId: string, sessionTitle: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const staffId = session.user.id;
    
    // Check if already checked in for this session
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: { 
          registrationId,
          sessionTitle
      }
    });

    if (existingCheckIn) {
        return { success: false, error: `Checked In Already for ${sessionTitle}` };
    }

    await prisma.checkIn.create({
      data: {
        registrationId,
        scannedAt: new Date(),
        staffId: staffId,
        sessionTitle
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
  query: string = "",
  checkInStatus?: string,
  sessionFilter?: string
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return [];
  }

  try {
    const where: any = {};
    
    if (eventId && eventId !== "all") {
      where.eventId = eventId;
    }

    if (query) {
       const matchingIds = await prisma.$queryRaw<{id: string}[]>`
          SELECT id FROM "Registration"
          WHERE "referenceCode" ILIKE ${`%${query}%`}
             OR "formData"::text ILIKE ${`%${query}%`}
       `;
       where.id = { in: matchingIds.map((m) => m.id) };
    }
    
    if (checkInStatus) {
        if (checkInStatus === "any") {
            where.checkIns = { some: {} };
        } else if (checkInStatus === "none") {
            where.checkIns = { none: {} };
        } else if (checkInStatus === "attended" && sessionFilter) {
            where.checkIns = { some: { sessionTitle: sessionFilter } };
        } else if (checkInStatus === "missing" && sessionFilter) {
            where.checkIns = { none: { sessionTitle: sessionFilter } };
        }
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
        checkIns: {
            select: { id: true, scannedAt: true, sessionTitle: true }
        },
        event: {
          select: { 
              title: true,
              startDate: true,
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
