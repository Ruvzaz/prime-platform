import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventCertClaimClient } from "@/components/ecert/EventCertClaimClient";
import { Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EventCertTokenPage({
  params,
}: {
  params: Promise<{ eventSlug: string; token: string }>;
}) {
  const { eventSlug, token } = await params;
  const cleanToken = token.trim().toUpperCase();

  // 1. Find Event with Template
  const event = await prisma.event.findFirst({
    where: {
      OR: [
        { slug: eventSlug },
        { id: eventSlug }
      ]
    },
    include: {
      certTemplate: true
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

  // 2. Find Token Record
  const tokenRecord = await prisma.eventCertToken.findFirst({
    where: {
      token: cleanToken,
      eventId: event.id
    }
  });

  if (!tokenRecord) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-3xl max-w-md shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 font-bold">
            <Award className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-xl font-black text-slate-900">
            ไม่พบรหัส Token "{cleanToken}"
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            รหัส Token นี้ไม่มีอยู่ในระบบ หรือไม่ได้ลงทะเบียนไว้สำหรับกิจกรรม <strong className="text-slate-900">{event.title}</strong>
          </p>
          <Link href={`/certification/${event.slug}`}>
            <Button className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl h-11">
              <ArrowLeft className="w-4 h-4 mr-2" /> ลองกรอกรหัส Token ใหม่
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Find existing Certificate if claimed
  let certificate = null;
  if (tokenRecord?.isUsed && tokenRecord.certCode) {
    certificate = await prisma.certificate.findUnique({
      where: { certCode: tokenRecord.certCode }
    });
  }

  return (
    <EventCertClaimClient
      eventSlug={event.slug}
      token={cleanToken}
      eventTitle={event.title}
      isUsed={!!tokenRecord?.isUsed}
      initialClaimedName={tokenRecord?.claimedName || certificate?.recipientFullName}
      initialCertCode={tokenRecord?.certCode || certificate?.certCode}
      initialIssueDate={certificate?.issueDate}
      backgroundImageUrl={event.certTemplate?.backgroundImageUrl}
      layoutConfig={event.certTemplate?.layoutConfig as any}
    />
  );
}
