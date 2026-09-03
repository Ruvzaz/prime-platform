"use client";

import { useState } from "react";
import { updateEventCertSettings, updateChallengeCertTemplate } from "@/app/actions/cert-template";
import { updateCampaignCertSettings } from "@/app/actions/cert-campaign";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Trophy, Calendar, Layers } from "lucide-react";
import { toast } from "sonner";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  hasCertificate: boolean;
  certTemplateId: string | null;
}

interface ChallengeItem {
  id: string;
  name: string;
  slug: string;
  certTemplateId: string | null;
}

interface CampaignItem {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
  certTemplateId: string | null;
}

interface TemplateItem {
  id: string;
  name: string;
}

export function EventCertTemplateSelector({
  events,
  challenges = [],
  campaigns = [],
  templates,
}: {
  events: EventItem[];
  challenges?: ChallengeItem[];
  campaigns?: CampaignItem[];
  templates: TemplateItem[];
}) {
  const [activeTab, setActiveTab] = useState<"events" | "challenges" | "campaigns">("events");

  // State for Events
  const [eventSettings, setEventSettings] = useState<Record<string, { hasCert: boolean; templateId: string }>>(() => {
    const initial: Record<string, { hasCert: boolean; templateId: string }> = {};
    events.forEach((ev) => {
      initial[ev.id] = {
        hasCert: ev.hasCertificate,
        templateId: ev.certTemplateId || "",
      };
    });
    return initial;
  });

  // State for Challenges
  const [challengeSettings, setChallengeSettings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    challenges.forEach((ch) => {
      initial[ch.id] = ch.certTemplateId || "";
    });
    return initial;
  });

  // State for Campaigns
  const [campaignSettings, setCampaignSettings] = useState<Record<string, { isActive: boolean; templateId: string }>>(() => {
    const initial: Record<string, { isActive: boolean; templateId: string }> = {};
    campaigns.forEach((cmp) => {
      initial[cmp.id] = {
        isActive: cmp.isActive,
        templateId: cmp.certTemplateId || "",
      };
    });
    return initial;
  });

  const [savingId, setSavingId] = useState<string | null>(null);

  const handleSaveEvent = async (eventId: string) => {
    const settings = eventSettings[eventId];
    if (!settings) return;

    setSavingId(eventId);
    try {
      const res = await updateEventCertSettings({
        eventId,
        hasCertificate: settings.hasCert,
        certTemplateId: settings.templateId || null,
      });

      if (res.success) {
        toast.success("บันทึกการตั้งค่าใบประกาศนียบัตรของ Event เรียบร้อยแล้ว");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      toast.error("ไม่สามารถทำรายการได้");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveChallenge = async (challengeId: string) => {
    const templateId = challengeSettings[challengeId];

    setSavingId(challengeId);
    try {
      const res = await updateChallengeCertTemplate({
        challengeId,
        certTemplateId: templateId || null,
      });

      if (res.success) {
        toast.success("บันทึกการตั้งค่าแม่แบบของ Challenge เรียบร้อยแล้ว");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      toast.error("ไม่สามารถทำรายการได้");
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveCampaign = async (campaignId: string) => {
    const settings = campaignSettings[campaignId];
    if (!settings) return;

    setSavingId(campaignId);
    try {
      const res = await updateCampaignCertSettings({
        campaignId,
        isActive: settings.isActive,
        certTemplateId: settings.templateId || null,
      });

      if (res.success) {
        toast.success("บันทึกการตั้งค่าแม่แบบของ Campaign เรียบร้อยแล้ว");
      } else {
        toast.error(res.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      toast.error("ไม่สามารถทำรายการได้");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs: Events vs CTF Challenges vs Campaigns */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
            activeTab === "events"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>กิจกรรมจัดอบรม (EVENTS) ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("challenges")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
            activeTab === "challenges"
              ? "bg-red-600 text-white shadow-md shadow-red-600/20"
              : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>การแข่งขัน CTF (CHALLENGES) ({challenges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
            activeTab === "campaigns"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>แคมเปญแจกใบประกาศ (CAMPAIGNS) ({campaigns.length})</span>
        </button>
      </div>

      {/* EVENTS TABLE */}
      {activeTab === "events" && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-zinc-800/80 uppercase text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3.5">ชื่อกิจกรรม (Event Name)</th>
                  <th className="px-6 py-3.5">แจกใบประกาศ (Has Certificate)</th>
                  <th className="px-6 py-3.5">แม่แบบที่ใช้งาน (Cert Template)</th>
                  <th className="px-6 py-3.5 text-right">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-sans">
                {events.map((ev) => {
                  const settings = eventSettings[ev.id] || { hasCert: true, templateId: "" };
                  const isSaving = savingId === ev.id;

                  return (
                    <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                      <td className="px-6 py-4">
                        <strong className="text-sm font-bold text-slate-900 dark:text-white block">{ev.title}</strong>
                        <span className="text-xs font-mono text-slate-400">/events/{ev.slug}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={settings.hasCert}
                            onCheckedChange={(checked) =>
                              setEventSettings((prev) => ({
                                ...prev,
                                [ev.id]: { ...prev[ev.id], hasCert: checked },
                              }))
                            }
                          />
                          <span className={`text-xs font-mono font-bold ${settings.hasCert ? "text-emerald-600" : "text-slate-400"}`}>
                            {settings.hasCert ? "เปิดใช้งาน (Active)" : "ปิดการแจก (Disabled)"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Select
                          disabled={!settings.hasCert}
                          value={settings.templateId}
                          onValueChange={(val) =>
                            setEventSettings((prev) => ({
                              ...prev,
                              [ev.id]: { ...prev[ev.id], templateId: val },
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 text-xs w-64 bg-slate-50 dark:bg-zinc-800">
                            <SelectValue placeholder="เลือกแม่แบบใบประกาศ" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-zinc-900">
                            <SelectItem value="default">แม่แบบมาตรฐาน (Standard Default)</SelectItem>
                            {templates.map((tpl) => (
                              <SelectItem key={tpl.id} value={tpl.id}>
                                {tpl.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEvent(ev.id)}
                          disabled={isSaving}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                          บันทึก
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CHALLENGES TABLE */}
      {activeTab === "challenges" && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-zinc-800/80 uppercase text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3.5">ชื่อการแข่งขัน (Challenge Name)</th>
                  <th className="px-6 py-3.5">แม่แบบใบประกาศที่ใช้งาน (Cert Template)</th>
                  <th className="px-6 py-3.5 text-right">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-sans">
                {challenges.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      ยังไม่มีรายการการแข่งขัน CTF Challenge ในระบบ
                    </td>
                  </tr>
                ) : (
                  challenges.map((ch) => {
                    const selectedTemplate = challengeSettings[ch.id] || "";
                    const isSaving = savingId === ch.id;

                    return (
                      <tr key={ch.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                        <td className="px-6 py-4">
                          <strong className="text-sm font-bold text-slate-900 dark:text-white block flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-red-500 shrink-0" />
                            {ch.name}
                          </strong>
                          <span className="text-xs font-mono text-slate-400">/challenge/{ch.slug}</span>
                        </td>

                        <td className="px-6 py-4">
                          <Select
                            value={selectedTemplate}
                            onValueChange={(val) =>
                              setChallengeSettings((prev) => ({
                                ...prev,
                                [ch.id]: val,
                              }))
                            }
                          >
                            <SelectTrigger className="h-9 text-xs w-72 bg-slate-50 dark:bg-zinc-800">
                              <SelectValue placeholder="เลือกแม่แบบใบประกาศสำหรับ Challenge" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900">
                              <SelectItem value="default">แม่แบบมาตรฐาน (Standard Default)</SelectItem>
                              {templates.map((tpl) => (
                                <SelectItem key={tpl.id} value={tpl.id}>
                                  {tpl.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSaveChallenge(ch.id)}
                            disabled={isSaving}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                            บันทึก
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CAMPAIGNS TABLE */}
      {activeTab === "campaigns" && (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-zinc-800/80 uppercase text-slate-500 border-b border-slate-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3.5">ชื่อแคมเปญ (Campaign Name)</th>
                  <th className="px-6 py-3.5">เปิดใช้งาน (Is Active)</th>
                  <th className="px-6 py-3.5">แม่แบบที่ใช้งาน (Cert Template)</th>
                  <th className="px-6 py-3.5 text-right">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-sans">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      ยังไม่มีรายการแคมเปญใบประกาศ (No Event) ในระบบ
                    </td>
                  </tr>
                ) : (
                  campaigns.map((cmp) => {
                    const settings = campaignSettings[cmp.id] || { isActive: true, templateId: "" };
                    const isSaving = savingId === cmp.id;

                    return (
                      <tr key={cmp.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50">
                        <td className="px-6 py-4">
                          <strong className="text-sm font-bold text-slate-900 dark:text-white block flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                            {cmp.title}
                          </strong>
                          <span className="text-xs font-mono text-slate-400">/cert/{cmp.slug}</span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={settings.isActive}
                              onCheckedChange={(checked) =>
                                setCampaignSettings((prev) => ({
                                  ...prev,
                                  [cmp.id]: { ...prev[cmp.id], isActive: checked },
                                }))
                              }
                            />
                            <span className={`text-xs font-mono font-bold ${settings.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                              {settings.isActive ? "เปิดใช้งาน (Active)" : "ปิดใช้งาน (Disabled)"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Select
                            disabled={!settings.isActive}
                            value={settings.templateId}
                            onValueChange={(val) =>
                              setCampaignSettings((prev) => ({
                                ...prev,
                                [cmp.id]: { ...prev[cmp.id], templateId: val },
                              }))
                            }
                          >
                            <SelectTrigger className="h-9 text-xs w-64 bg-slate-50 dark:bg-zinc-800">
                              <SelectValue placeholder="เลือกแม่แบบใบประกาศ" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-zinc-900">
                              <SelectItem value="default">แม่แบบมาตรฐาน (Standard Default)</SelectItem>
                              {templates.map((tpl) => (
                                <SelectItem key={tpl.id} value={tpl.id}>
                                  {tpl.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleSaveCampaign(cmp.id)}
                            disabled={isSaving}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-sm"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                            บันทึก
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
