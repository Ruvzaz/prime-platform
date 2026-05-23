"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { extractAttendeeInfo } from "@/lib/attendee-utils";

export type CheckInResult = {
  success: boolean;
  message?: string;
  attendee?: {
    name: string;
    email: string;
    eventTitle: string;
    eventImageUrl?: string | null;
    checkedInAt?: Date | null;
  };
};

export async function verifyAndCheckIn(referenceCode: string, sessionTitle?: string): Promise<CheckInResult> {
  if (!referenceCode) return { success: false, message: "Reference code is required" };

  try {
    // 1. Find Registration
    const registration = await prisma.registration.findUnique({
      where: { referenceCode: referenceCode.toUpperCase() },
      include: {
        event: { include: { formFields: true } },
        checkIns: true,
      },
    });

    if (!registration) {
      return { success: false, message: "Registration not found" };
    }

    // Extract name/email from formData json
    const formData = registration.formData as Record<string, any>;
    const { name, email } = extractAttendeeInfo(formData, registration.event.formFields);

    // 2. Check if already checked in
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const alreadyCheckedIn = registration.checkIns.find(ci => {
        if (sessionTitle) {
            return ci.sessionTitle === sessionTitle;
        }
        // Fallback if no session specified: check if already checked in today
        return ci.scannedAt >= today && ci.scannedAt < tomorrow;
    });

    if (alreadyCheckedIn) {
      return { 
        success: false, 
        message: sessionTitle ? `Already checked in for ${sessionTitle}!` : "Already checked in for today!", 
        attendee: {
            name,
            email,
            eventTitle: registration.event.title,
            eventImageUrl: registration.event.imageUrl,
            checkedInAt: alreadyCheckedIn.scannedAt
        }
      };
    }

    // 3. Perform Check-in
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized: Please log in" };
    }

    const staffId = session.user.id;

    try {
      await prisma.$transaction([
        prisma.checkIn.create({
          data: {
            registrationId: registration.id,
            staffId: staffId,
            sessionTitle: sessionTitle || null,
          },
        }),
        prisma.registration.update({
          where: { id: registration.id },
          data: { status: "CONFIRMED" }
        })
      ]);
    } catch (txError: any) {
      // P2002 = Unique constraint on registrationId → concurrent double check-in
      if (txError?.code === "P2002") {
        return { success: false, message: "Already checked in (concurrent request)" };
      }
      return { success: false, message: `Database error: ${txError?.message || String(txError)}` };
    }

    revalidatePath("/check-in");
    revalidatePath(`/events/${registration.event.slug}`);

    return {
      success: true,
      message: "Check-in Successful",
      attendee: {
        name,
        email,
        eventTitle: registration.event.title,
        eventImageUrl: registration.event.imageUrl,
      },
    };

  } catch (error: any) {
    console.error("Check-in error:", error);
    return { success: false, message: `Server error: ${error?.message || String(error)}` };
  }
}
