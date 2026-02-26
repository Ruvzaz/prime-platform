"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { RegStatus } from "@prisma/client";
import { extractAttendeeInfo } from "@/lib/attendee-utils";

function generateRefCode(): string {
  return "REF-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

export async function registerAttendee(formData: FormData) {
  const eventId = formData.get("eventId") as string;
  const slug = formData.get("eventSlug") as string;
  
  if (!eventId || !slug) {
    throw new Error("Event ID or Slug missing");
  }

  // extract dynamic fields
  const rawData: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("field_")) {
       const fieldId = key.replace("field_", "");
       rawData[fieldId] = value as string;
    }
  }

  let referenceCode = "";
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    referenceCode = generateRefCode();
    try {
      await prisma.registration.create({
        data: {
          eventId,
          formData: rawData,
          referenceCode,
          status: "CONFIRMED",
        },
      });
      break; // Success
    } catch (e) {
      if (e instanceof Error && "code" in e && (e as { code: string }).code === "P2002" && attempt < MAX_RETRIES - 1) {
        continue; 
      }
      console.error(e);
      throw new Error("Registration failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  }

  // Extract email and name
  const { name, email } = extractAttendeeInfo(rawData);

  // Fetch event title and custom email settings
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { 
        title: true, 
        startDate: true,
        emailSubject: true,
        emailBody: true,
        emailAttachmentUrl: true
    },
  });

  // Send Confirmation Email immediately
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
      console.error("Failed to send confirmation email. Proceeding with registration anyway:", e);
    }
  }
  
  redirect(`/events/${slug}/success?code=${referenceCode}`);
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
                  select: { label: true }
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
