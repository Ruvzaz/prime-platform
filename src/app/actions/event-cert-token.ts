"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Helper to generate a random 6-character uppercase alphanumeric token
function generate6CharToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude ambiguous chars like 0, O, 1, I
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate X unique 6-character tokens for a specific Event (Admin only)
 */
export async function generateEventCertTokens(eventId: string, count: number = 10) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  if (!eventId || count < 1 || count > 1000) {
    return { success: false, error: "จำนวน Token ต้องอยู่ระหว่าง 1 ถึง 1000" };
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, slug: true }
    });

    if (!event) {
      return { success: false, error: "ไม่พบข้อมูลกิจกรรม" };
    }

    // Generate unique tokens
    const createdTokens: string[] = [];
    const maxAttempts = count * 5;
    let attempts = 0;

    while (createdTokens.length < count && attempts < maxAttempts) {
      attempts++;
      const candidate = generate6CharToken();
      
      // Check in-memory batch & DB
      if (!createdTokens.includes(candidate)) {
        const existing = await prisma.eventCertToken.findUnique({
          where: { token: candidate }
        });
        if (!existing) {
          createdTokens.push(candidate);
        }
      }
    }

    if (createdTokens.length === 0) {
      return { success: false, error: "ไม่สามารถสร้าง Token ได้ กรุณาลองใหม่อีกครั้ง" };
    }

    // Bulk create tokens
    await prisma.eventCertToken.createMany({
      data: createdTokens.map(token => ({
        token,
        eventId: event.id,
        isUsed: false
      }))
    });

    revalidatePath(`/admin/events/${event.slug}/certificates`);
    revalidatePath(`/admin/certificates`);
    return { success: true, count: createdTokens.length };
  } catch (error: any) {
    console.error("Failed to generate event cert tokens:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการสร้าง Token" };
  }
}

/**
 * Get all cert tokens for an Event (Admin only)
 */
export async function getEventCertTokens(eventId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return [];
  }

  try {
    const tokens = await prisma.eventCertToken.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" }
    });
    return tokens;
  } catch (error) {
    console.error("Failed to fetch event cert tokens:", error);
    return [];
  }
}

/**
 * Delete a cert token (Admin only)
 */
export async function deleteEventCertToken(tokenId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const tokenRecord = await prisma.eventCertToken.delete({
      where: { id: tokenId },
      include: { event: { select: { slug: true } } }
    });

    revalidatePath(`/admin/events/${tokenRecord.event.slug}/certificates`);
    revalidatePath(`/admin/certificates`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete cert token:", error);
    return { success: false, error: "Failed to delete token" };
  }
}

/**
 * Public Claim Action: Claim a certificate via Event Slug & 6-character Token
 */
export async function claimEventCertToken(eventSlug: string, tokenInput: string, fullName: string) {
  const cleanToken = tokenInput.trim().toUpperCase();
  const cleanName = fullName.trim();

  if (!cleanToken || cleanToken.length < 5) {
    return { success: false, error: "รหัส Token ไม่ถูกต้อง" };
  }

  try {
    // 1. Find Event
    const event = await prisma.event.findFirst({
      where: {
        OR: [
          { slug: eventSlug },
          { id: eventSlug }
        ]
      }
    });

    if (!event) {
      return { success: false, error: "ไม่พบข้อมูลกิจกรรมนี้" };
    }

    // 2. Find Token
    const tokenRecord = await prisma.eventCertToken.findFirst({
      where: {
        token: cleanToken,
        eventId: event.id
      }
    });

    if (!tokenRecord) {
      return { success: false, error: `ไม่พบรหัส Token "${cleanToken}" สำหรับกิจกรรมนี้` };
    }

    // 3. If Token ALREADY CLAIMED
    if (tokenRecord.isUsed) {
      // Find existing certificate
      let certificate = null;
      if (tokenRecord.certCode) {
        certificate = await prisma.certificate.findUnique({
          where: { certCode: tokenRecord.certCode }
        });
      }

      if (!certificate) {
        // Fallback search by event & recipient name
        certificate = await prisma.certificate.findFirst({
          where: {
            eventId: event.id,
            recipientFullName: tokenRecord.claimedName || cleanName
          }
        });
      }

      return {
        success: true,
        alreadyClaimed: true,
        claimedName: tokenRecord.claimedName || cleanName,
        claimedAt: tokenRecord.claimedAt,
        certificate: certificate ? {
          certCode: certificate.certCode,
          recipientFullName: certificate.recipientFullName,
          eventTitle: certificate.eventTitle,
          issueDate: certificate.issueDate
        } : null
      };
    }

    // 4. Validate Name when claiming for the first time
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: "กรุณาระบุชื่อ-นามสกุลที่ต้องการให้แสดงบนใบประกาศนียบัตร" };
    }

    // 5. Claim Token & Generate Official Certificate
    const certCode = `CERT-EVT-${cleanToken}`;
    const issueDateStr = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create/Upsert Certificate
      const cert = await tx.certificate.upsert({
        where: { certCode },
        create: {
          certCode,
          type: "EVENT",
          email: `token-claim-${cleanToken.toLowerCase()}@event.local`,
          recipientFirstName: cleanName,
          recipientFullName: cleanName,
          eventTitle: event.title,
          issueDate: issueDateStr,
          eventId: event.id,
          status: "ACTIVE"
        },
        update: {
          recipientFirstName: cleanName,
          recipientFullName: cleanName,
          eventTitle: event.title,
          status: "ACTIVE"
        }
      });

      // Update Token Record to USED
      await tx.eventCertToken.update({
        where: { id: tokenRecord.id },
        data: {
          isUsed: true,
          claimedName: cleanName,
          claimedAt: new Date(),
          certCode: cert.certCode
        }
      });

      return cert;
    });

    revalidatePath(`/certification/${event.slug}/${cleanToken}`);
    return {
      success: true,
      alreadyClaimed: false,
      claimedName: cleanName,
      claimedAt: new Date(),
      certificate: {
        certCode: result.certCode,
        recipientFullName: result.recipientFullName,
        eventTitle: result.eventTitle,
        issueDate: result.issueDate
      }
    };
  } catch (error: any) {
    console.error("Failed to claim event cert token:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการออกใบประกาศนียบัตร" };
  }
}
