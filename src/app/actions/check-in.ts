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
    checkedInAt?: Date | null;
  };
};

export async function verifyAndCheckIn(referenceCode: string): Promise<CheckInResult> {
  if (!referenceCode) return { success: false, message: "Reference code is required" };

  try {
    // 1. Find Registration
    const registration = await prisma.registration.findUnique({
      where: { referenceCode: referenceCode.toUpperCase() },
      include: {
        event: true,
        checkIn: true,
      },
    });

    if (!registration) {
      return { success: false, message: "Registration not found" };
    }

    // Extract name/email from formData json
    const formData = registration.formData as Record<string, any>;
    const { name, email } = extractAttendeeInfo(formData);

    // 2. Check if already checked in
    if (registration.checkIn) {
      return { 
        success: false, 
        message: "Already checked in!", 
        attendee: {
            name,
            email,
            eventTitle: registration.event.title,
            checkedInAt: registration.checkIn.scannedAt
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
          },
        }),
        prisma.registration.update({
          where: { id: registration.id },
          data: { status: "CONFIRMED" }
        })
      ]);
    } catch (txError) {
      // P2002 = Unique constraint on registrationId → concurrent double check-in
      if (txError instanceof Error && "code" in txError && (txError as { code: string }).code === "P2002") {
        return { success: false, message: "Already checked in (concurrent request)" };
      }
      throw txError;
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
      },
    };

  } catch (error) {
    console.error("Check-in error:", error);
    return { success: false, message: "Internal server error" };
  }
}
