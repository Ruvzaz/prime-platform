import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { extractAttendeeInfo, maskName, maskEmail } from "@/lib/attendee-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        themeColor: true,
        startDate: true,
        formFields: true,
        liveConfig: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const checkIns = await prisma.checkIn.findMany({
      where: {
        registration: {
          eventId: event.id,
        },
      },
      orderBy: { scannedAt: "desc" },
      take: 50,
      select: {
        id: true,
        scannedAt: true,
        registration: {
          select: {
            referenceCode: true,
            formData: true,
          },
        },
      },
    });

    const data = checkIns.map((ci) => {
      const { name, email } = extractAttendeeInfo(ci.registration.formData as Record<string, unknown>, event.formFields);
      return {
        id: ci.id,
        referenceCode: ci.registration.referenceCode,
        name: maskName(name),
        email: maskEmail(email),
        scannedAt: ci.scannedAt.toISOString(),
      };
    });

    // Get unique attendees count (people who checked in at least once)
    const totalUniqueCheckIns = await prisma.registration.count({
      where: {
        eventId: event.id,
        checkIns: { some: {} }
      }
    });

    // Get total registrations count
    const totalRegistrations = await prisma.registration.count({
      where: {
        eventId: event.id
      }
    });

    return NextResponse.json({
      event: {
        title: event.title,
        imageUrl: event.imageUrl,
        themeColor: event.themeColor,
        startDate: event.startDate.toISOString(),
        liveConfig: event.liveConfig,
      },
      checkIns: data,
      total: totalUniqueCheckIns,
      totalRegistrations: totalRegistrations
    });
  } catch (error) {
    console.error("Failed to fetch check-ins:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
