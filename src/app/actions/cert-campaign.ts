"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface CreateCampaignInput {
  title: string;
  slug: string;
  description?: string;
  issueDate: string;
  certTemplateId?: string;
}

/**
 * Create a Standalone E-Certificate Campaign
 */
export async function createCertCampaign(input: CreateCampaignInput) {
  try {
    const cleanSlug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const cleanTitle = input.title.trim();
    const cleanDate = input.issueDate.trim();

    if (!cleanTitle) {
      return { success: false, error: "กรุณาระบุชื่อแคมเปญ" };
    }
    if (!cleanSlug) {
      return { success: false, error: "กรุณาระบุ URL Slug ของแคมเปญ" };
    }

    // Check slug collision
    const existing = await prisma.certCampaign.findUnique({
      where: { slug: cleanSlug }
    });

    if (existing) {
      return { success: false, error: `URL Slug "${cleanSlug}" ถูกใช้งานแล้ว กรุณาตั้งชื่ออื่น` };
    }

    const campaign = await prisma.certCampaign.create({
      data: {
        title: cleanTitle,
        slug: cleanSlug,
        description: input.description?.trim() || null,
        issueDate: cleanDate,
        certTemplateId: input.certTemplateId || null,
        isActive: true,
      }
    });

    revalidatePath("/admin/certificates/campaigns");
    return { success: true, campaign };
  } catch (error: any) {
    console.error("Create Cert Campaign Error:", error);
    return { success: false, error: error.message || "เกิดข้อผิดพลาดในการสร้างแคมเปญ" };
  }
}

/**
 * Get all Cert Campaigns for Admin Table
 */
export async function getCertCampaigns() {
  try {
    const campaigns = await prisma.certCampaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        certTemplate: {
          select: { id: true, name: true, backgroundImageUrl: true }
        },
        _count: {
          select: { certificates: true }
        }
      }
    });
    return { success: true, campaigns };
  } catch (error: any) {
    console.error("Get Cert Campaigns Error:", error);
    return { success: false, campaigns: [] };
  }
}

/**
 * Delete a Cert Campaign and its recipients
 */
export async function deleteCertCampaign(id: string) {
  try {
    await prisma.certCampaign.delete({
      where: { id }
    });
    revalidatePath("/admin/certificates/campaigns");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Cert Campaign Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการลบแคมเปญ" };
  }
}

/**
 * Public Lookup Action: Search recipient by Name or Email within a Campaign Slug
 */
export async function lookupCertByInput(campaignSlug: string, queryInput: string) {
  const cleanSlug = campaignSlug.trim().toLowerCase();
  const cleanQuery = queryInput.trim();

  if (!cleanQuery) {
    return { success: false, error: "กรุณาระบุชื่อ-นามสกุล หรือ อีเมลเพื่อค้นหา" };
  }

  try {
    // 1. Find Campaign
    const campaign = await prisma.certCampaign.findUnique({
      where: { slug: cleanSlug },
      include: {
        certTemplate: true
      }
    });

    if (!campaign || !campaign.isActive) {
      return { success: false, error: "ไม่พบแคมเปญใบประกาศนี้ หรือแคมเปญถูกปิดใช้งาน" };
    }

    // 2. Find Certificate by email OR recipientFullName
    const certificate = await prisma.certificate.findFirst({
      where: {
        campaignId: campaign.id,
        OR: [
          { email: { equals: cleanQuery, mode: 'insensitive' } },
          { recipientFullName: { contains: cleanQuery, mode: 'insensitive' } },
          { recipientFirstName: { contains: cleanQuery, mode: 'insensitive' } },
          { recipientLastName: { contains: cleanQuery, mode: 'insensitive' } }
        ]
      }
    });

    if (!certificate) {
      return { 
        success: false, 
        error: `ไม่พบรายชื่อในระบบสำหรับ "${cleanQuery}" กรุณาตรวจสอบการสะกดชื่อหรืออีเมลอีกครั้ง` 
      };
    }

    // 3. Optional Bonus: Count other certificates owned by this email
    let otherCertsCount = 0;
    if (certificate.email) {
      otherCertsCount = await prisma.certificate.count({
        where: {
          email: { equals: certificate.email, mode: 'insensitive' },
          id: { not: certificate.id }
        }
      });
    }

    return {
      success: true,
      campaignTitle: campaign.title,
      certificate: {
        id: certificate.id,
        certCode: certificate.certCode,
        recipientFullName: certificate.recipientFullName,
        recipientFirstName: certificate.recipientFirstName,
        recipientLastName: certificate.recipientLastName,
        eventTitle: certificate.eventTitle || campaign.title,
        issueDate: certificate.issueDate || campaign.issueDate,
        status: certificate.status,
      },
      template: campaign.certTemplate ? {
        backgroundImageUrl: campaign.certTemplate.backgroundImageUrl,
        layoutConfig: campaign.certTemplate.layoutConfig,
      } : null,
      otherCertsCount,
    };
  } catch (error: any) {
    console.error("Lookup Cert Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการค้นหาใบประกาศ" };
  }
}
