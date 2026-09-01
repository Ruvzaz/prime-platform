import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventTokenInputClient } from "@/components/ecert/EventTokenInputClient";
import { Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EventCertLandingPage({
  params,
}: {
  params: Promise<{ eventSlug: string }>;
}) {
  const { eventSlug } = await params;

  const event = await prisma.event.findFirst({
    where: {
      OR: [
        { slug: eventSlug },
        { id: eventSlug }
      ]
    }
  });

  if (!event) {
    notFound();
  }

  // If event has no certificate enabled
  if (!event.hasCertificate) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-md shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            กิจกรรมนี้ไม่มีการออกใบประกาศนียบัตร
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            กิจกรรม <strong className="text-slate-900">{event.title}</strong> ถูกตั้งค่าโดยผู้จัดงานว่าไม่มีการแจกใบประกาศนียบัตร
          </p>
          <Link href="/certification">
            <Button variant="outline" className="w-full mt-2 font-mono text-xs uppercase tracking-wider">
              <ArrowLeft className="w-4 h-4 mr-2" /> กลับสู่หน้าหลัก E-Certificate
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EventTokenInputClient
      eventSlug={event.slug}
      eventTitle={event.title}
    />
  );
}
