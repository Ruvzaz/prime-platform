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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [checkIns, totalUniqueCheckIns, totalRegistrations] = await Promise.all([
      prisma.checkIn.findMany({
        where: {
          registration: { eventId: event.id },
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
            },
          },
        },
      }),
      prisma.checkIn.count({
        where: {
          registration: { eventId: event.id },
          scannedAt: { gte: today },
        }
      }),
      prisma.registration.count({
        where: { eventId: event.id }
      })
    ]);

    const data = checkIns.map((ci) => {
      const { name, email } = extractAttendeeInfo(ci.registration.formData as Record<string, unknown>, event.formFields);
      return {
        id: ci.id,
        referenceCode: ci.registration.referenceCode,
        name: name,
        email: maskEmail(email),
        scannedAt: ci.scannedAt.toISOString(),
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
