import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { extractAttendeeInfo } from "@/lib/attendee-utils";

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
      const { name } = extractAttendeeInfo(ci.registration.formData as Record<string, unknown>);
      return {
        id: ci.id,
        referenceCode: ci.registration.referenceCode,
        name,
        scannedAt: ci.scannedAt.toISOString(),
      };
    });

    return NextResponse.json({
      event: {
        title: event.title,
        imageUrl: event.imageUrl,
        themeColor: event.themeColor,
        startDate: event.startDate.toISOString(),
      },
      checkIns: data,
      total: data.length,
    });
  } catch (error) {
    console.error("Failed to fetch check-ins:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
