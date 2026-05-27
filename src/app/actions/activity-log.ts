"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function logActivity(data: {
  type: "REGISTRATION" | "EMAIL" | "CHECK_IN" | "SYSTEM" | "EVENT";
  action: "SUCCESS" | "FAILED" | "CREATED" | "UPDATED" | "DELETED";
  description: string;
  eventId?: string;
  registrationId?: string;
  metadata?: any;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        type: data.type,
        action: data.action,
        description: data.description,
        eventId: data.eventId,
        registrationId: data.registrationId,
        metadata: data.metadata || {},
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getLogs(eventId?: string, type?: string, page = 1, pageSize = 20) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { data: [], metadata: { total: 0, page: 1, pageSize: 20, totalPages: 0 } };
  }

  const where: any = {};
  if (eventId && eventId !== 'all') {
    where.eventId = eventId;
  }
  
  if (type && type !== 'all') {
    where.type = type;
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        event: { select: { title: true } },
        registration: { select: { referenceCode: true, formData: true } },
      }
    }),
    prisma.activityLog.count({ where })
  ]);

  return {
    data: logs,
    metadata: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}
