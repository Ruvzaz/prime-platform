"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CertLayoutConfig } from "@/types/cert-template";

/**
 * Fetch all Certificate Templates
 */
export async function getCertTemplates() {
  try {
    const templates = await prisma.certTemplate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        events: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
    return { success: true, templates };
  } catch (error: any) {
    console.error("Error fetching cert templates:", error);
    return { success: false, error: "ไม่สามารถดึงข้อมูลแม่แบบใบประกาศได้" };
  }
}

/**
 * Fetch a single Certificate Template by ID
 */
export async function getCertTemplateById(id: string) {
  try {
    const template = await prisma.certTemplate.findUnique({
      where: { id },
      include: {
        events: {
          select: { id: true, title: true, slug: true },
        },
      },
    });
    if (!template) {
      return { success: false, error: "ไม่พบแม่แบบใบประกาศ" };
    }
    return { success: true, template };
  } catch (error: any) {
    console.error("Error fetching cert template:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการดึงข้อมูลแม่แบบ" };
  }
}

/**
 * Create or Update a Certificate Template
 */
export async function upsertCertTemplate(data: {
  id?: string;
  name: string;
  backgroundImageUrl: string;
  layoutConfig: CertLayoutConfig;
  isDefault?: boolean;
}) {
  try {
    const { id, name, backgroundImageUrl, layoutConfig, isDefault = false } = data;

    // If setting as default, unset previous default templates
    if (isDefault) {
      await prisma.certTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    let template;
    if (id) {
      template = await prisma.certTemplate.update({
        where: { id },
        data: {
          name,
          backgroundImageUrl,
          layoutConfig: layoutConfig as any,
          isDefault,
        },
      });
    } else {
      template = await prisma.certTemplate.create({
        data: {
          name,
          backgroundImageUrl,
          layoutConfig: layoutConfig as any,
          isDefault,
        },
      });
    }

    revalidatePath("/admin/certificates");
    revalidatePath("/certification");

    return { success: true, template };
  } catch (error: any) {
    console.error("Error saving cert template:", error);
    return { success: false, error: "ไม่สามารถบันทึกแม่แบบใบประกาศได้" };
  }
}

/**
 * Delete a Certificate Template
 */
export async function deleteCertTemplate(id: string) {
  try {
    await prisma.certTemplate.delete({
      where: { id },
    });
    revalidatePath("/admin/certificates");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting cert template:", error);
    return { success: false, error: "ไม่สามารถลบแม่แบบใบประกาศได้" };
  }
}

/**
 * Assign a Certificate Template to an Event or set hasCertificate
 */
export async function updateEventCertSettings(data: {
  eventId: string;
  hasCertificate: boolean;
  certTemplateId?: string | null;
}) {
  try {
    const { eventId, hasCertificate, certTemplateId } = data;

    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        hasCertificate,
        certTemplateId: certTemplateId || null,
      },
    });

    revalidatePath("/admin/certificates");
    revalidatePath("/certification");
    revalidatePath(`/events/${event.slug}`);

    return { success: true, event };
  } catch (error: any) {
    console.error("Error updating event cert settings:", error);
    return { success: false, error: "ไม่สามารถบันทึกการตั้งค่าใบประกาศของ Event ได้" };
  }
}

/**
 * Assign a Certificate Template to a Challenge
 */
export async function updateChallengeCertTemplate(data: {
  challengeId: string;
  certTemplateId?: string | null;
}) {
  try {
    const { challengeId, certTemplateId } = data;

    const challenge = await prisma.challenge.update({
      where: { id: challengeId },
      data: {
        certTemplateId: certTemplateId || null,
      },
    });

    // Auto-link existing orphan certificates matching this challenge's name
    if (challenge.name) {
      await prisma.certificate.updateMany({
        where: {
          challengeId: null,
          eventTitle: { contains: challenge.name, mode: "insensitive" },
        },
        data: {
          challengeId: challenge.id,
        },
      });
    }

    revalidatePath("/admin/certificates");
    revalidatePath("/certification/challenge");
    revalidatePath("/challenge", "layout");
    revalidatePath("/", "layout");

    return { success: true, challenge };
  } catch (error: any) {
    console.error("Error updating challenge cert template:", error);
    return { success: false, error: "ไม่สามารถบันทึกการตั้งค่าแม่แบบของ Challenge ได้" };
  }
}
