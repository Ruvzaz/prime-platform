'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}

export async function toggleCertificateStatus(certId: string, currentStatus: string) {
  try {
    await checkAdmin();
    const newStatus = currentStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    await prisma.certificate.update({
      where: { id: certId },
      data: { status: newStatus },
    });
    revalidatePath('/admin/certificates');
    revalidatePath('/certification/challenge');
    return { success: true, newStatus };
  } catch (error: any) {
    console.error("Toggle Cert Status Error:", error);
    return { error: 'Failed to update certificate status' };
  }
}

export async function adminDeleteCertificate(certId: string) {
  try {
    await checkAdmin();
    await prisma.certificate.delete({
      where: { id: certId },
    });
    revalidatePath('/admin/certificates');
    revalidatePath('/certification/challenge');
    return { success: true };
  } catch (error: any) {
    console.error("Delete Cert Error:", error);
    return { error: 'Failed to delete certificate' };
  }
}

export async function adminCreateCertificate(data: {
  email: string;
  recipientFullName: string;
  type: 'CHALLENGE' | 'EVENT';
  challengeId?: string;
  eventId?: string;
  eventTitle?: string;
  issueDate?: string;
}) {
  try {
    await checkAdmin();
    const cleanEmail = data.email.toLowerCase().trim();
    if (!cleanEmail || !data.recipientFullName.trim()) {
      return { error: 'กรุณากรอกอีเมลและชื่อ-นามสกุล' };
    }

    // Generate unique cert code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomStr = "";
    for (let i = 0; i < 6; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const certCode = `CERT-2026-${randomStr}`;

    // Find user if available (by email or recipient name)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: cleanEmail, mode: "insensitive" } },
          { name: { equals: data.recipientFullName.trim(), mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      const usernameFallback = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      user = await prisma.user.create({
        data: {
          email: cleanEmail,
          username: usernameFallback,
          name: data.recipientFullName.trim(),
        },
      });
    } else if (!user.name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name: data.recipientFullName.trim() },
      });
    }

    let resolvedEventTitle = data.eventTitle;
    if (!resolvedEventTitle) {
      if (data.type === 'CHALLENGE' && data.challengeId) {
        const ch = await prisma.challenge.findUnique({ where: { id: data.challengeId } });
        resolvedEventTitle = ch ? `Thailand Cyber Top Talent 2026 (${ch.name})` : "Thailand Cyber Top Talent 2026";
      } else if (data.type === 'EVENT' && data.eventId) {
        const ev = await prisma.event.findUnique({ where: { id: data.eventId } });
        resolvedEventTitle = ev?.title || "Special Event";
      } else {
        resolvedEventTitle = "Thailand Cyber Top Talent 2026";
      }
    }

    const cert = await prisma.certificate.create({
      data: {
        certCode,
        type: data.type,
        email: cleanEmail,
        recipientFirstName: data.recipientFullName,
        recipientFullName: data.recipientFullName,
        eventTitle: resolvedEventTitle,
        issueDate: data.issueDate || "31 สิงหาคม 2569",
        status: "ACTIVE",
        challengeId: data.challengeId || null,
        eventId: data.eventId || null,
        userId: user.id,
      },
    });

    revalidatePath('/admin/certificates');
    revalidatePath('/certification/challenge');
    revalidatePath('/challenge', 'layout');
    revalidatePath('/', 'layout');
    return { success: true, certificate: cert };
  } catch (error: any) {
    console.error("Create Certificate Error:", error);
    return { error: 'เกิดข้อผิดพลาดในการสร้างใบประกาศ' };
  }
}
