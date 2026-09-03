import { getCertTemplates, deleteCertTemplate } from "@/app/actions/cert-template";
import { prisma } from "@/lib/prisma";
import { Plus, LayoutTemplate, Trash2, Edit, CheckCircle2, FileImage, Sparkles, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventCertTemplateSelector } from "./components/EventCertTemplateSelector";

export const dynamic = "force-dynamic";

export default async function CertTemplatesPage() {
  const { templates } = await getCertTemplates();
  
  const [events, challenges, campaigns] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        hasCertificate: true,
        certTemplateId: true,
      },
    }),
    prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        certTemplateId: true,
      },
    }),
    prisma.certCampaign.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        isActive: true,
        certTemplateId: true,
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono text-xs uppercase font-bold tracking-wider">
            <LayoutTemplate className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Certificates Visual Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            จัดการแม่แบบใบประกาศ & ลากวางตำแหน่ง (Templates)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
            อัปโหลดภาพแม่แบบ JPG/PNG กำหนดว่า Event, Challenge หรือ Campaign ไหนใช้แม่แบบใด และลากวางตำแหน่งข้อความบนภาพใบประกาศ
          </p>
        </div>

        <Link href="/admin/certificates/templates/new">
          <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm px-5 h-11 rounded-xl shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4 mr-2" />
            สร้างแม่แบบใหม่ (Visual Editor)
          </Button>
        </Link>
      </div>

      {/* SECTION 1: EVENT, CHALLENGE, AND CAMPAIGN TO TEMPLATE ASSIGNMENT TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            กำหนดแม่แบบประจำกิจกรรม ประจำการแข่งขัน และแคมเปญ (Certificate Settings)
          </h2>
        </div>

        <EventCertTemplateSelector
          events={events}
          challenges={challenges}
          campaigns={campaigns}
          templates={templates || []}
        />
      </div>

      {/* SECTION 2: CERTIFICATE TEMPLATES LIST GRID */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileImage className="w-5 h-5 text-indigo-600" />
          คลังแม่แบบใบประกาศ (Template Gallery)
        </h2>

        {!templates || templates.length === 0 ? (
          <Card className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 p-12 text-center">
            <LayoutTemplate className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-zinc-400">ยังไม่มีแม่แบบใบประกาศ</p>
            <p className="text-xs text-slate-400 mt-1">คลิกปุ่ม &quot;สร้างแม่แบบใหม่&quot; เพื่ออัปโหลดภาพ JPG/PNG และลากวางพิกัดข้อความ</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <Card key={tpl.id} className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all overflow-hidden group">
                <div className="aspect-[2000/1414] bg-slate-100 dark:bg-zinc-800 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tpl.backgroundImageUrl}
                    alt={tpl.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {tpl.isDefault && (
                    <span className="absolute top-3 left-3 bg-indigo-600 text-white font-mono text-[10px] font-bold px-2 py-1 rounded-md shadow">
                      DEFAULT
                    </span>
                  )}
                </div>

                <CardContent className="p-5 space-y-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{tpl.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      กิจกรรม/การแข่งขันที่ใช้งานอยู่: {(tpl.events?.length || 0) + ((tpl as any).challenges?.length || 0)} รายการ
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-zinc-800">
                    <Link href={`/admin/certificates/templates/${tpl.id}`}>
                      <Button variant="outline" size="sm" className="text-xs font-mono">
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        แก้ไขพิกัดการลากวาง
                      </Button>
                    </Link>

                    <form action={async () => {
                      "use server";
                      await deleteCertTemplate(tpl.id);
                    }}>
                      <Button type="submit" variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
