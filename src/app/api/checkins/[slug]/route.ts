import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { extractAttendeeInfo, maskEmail } from "@/lib/attendee-utils";

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

    const linkedIds: string[] = event.liveConfig?.linkedEventIds || [];
    const allEventIds = Array.from(new Set([event.id, ...linkedIds]));

    const linkedEvents = await prisma.event.findMany({
      where: { id: { in: allEventIds } },
      select: { id: true, title: true, formFields: true },
    });

    const eventMap = new Map<string, { title: string; formFields: any[] }>();
    linkedEvents.forEach((e) => eventMap.set(e.id, { title: e.title, formFields: e.formFields }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [checkIns, totalUniqueCheckIns, totalRegistrations] = await Promise.all([
      prisma.checkIn.findMany({
        where: {
          registration: { eventId: { in: allEventIds } },
          scannedAt: { gte: today },
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
              eventId: true,
            },
          },
        },
      }),
      prisma.checkIn.count({
        where: {
          registration: { eventId: { in: allEventIds } },
          scannedAt: { gte: today },
        },
      }),
      prisma.registration.count({
        where: { eventId: { in: allEventIds } },
      }),
    ]);

    const data = checkIns.map((ci) => {
      const targetEv = eventMap.get(ci.registration.eventId) || event;
      const { name, email } = extractAttendeeInfo(
        ci.registration.formData as Record<string, unknown>,
        targetEv.formFields
      );
      return {
        id: ci.id,
        referenceCode: ci.registration.referenceCode,
        name: name,
        email: maskEmail(email),
        scannedAt: ci.scannedAt.toISOString(),
        eventTitle: targetEv.title,
      };
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
      totalRegistrations: totalRegistrations,
    });
  } catch (error) {
    console.error("Failed to fetch check-ins:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
