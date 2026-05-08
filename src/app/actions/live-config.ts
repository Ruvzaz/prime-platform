"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getLiveConfig(eventId: string) {
  try {
    const config = await prisma.liveConfig.findUnique({
      where: { eventId },
    });
    return config;
  } catch (error) {
    console.error("Failed to get live config:", error);
    return null;
  }
}

export async function updateLiveConfig(eventId: string, data: {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  welcomeMessage?: string | null;
  themeColor?: string | null;
  showStats?: boolean;
  showLog?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const config = await prisma.liveConfig.upsert({
      where: { eventId },
      update: data,
      create: {
        eventId,
        ...data,
      },
    });

    // Fetch event slug for revalidation
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { slug: true }
    });

    if (event) {
      revalidatePath(`/live/${event.slug}`);
    }
    
    revalidatePath(`/events/${event?.slug}/live`);
    return { success: true, data: config };
  } catch (error) {
    console.error("Failed to update live config:", error);
    return { success: false, error: "Failed to update live config" };
  }
}
