"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { acceptPrivacyPolicy } from "@/app/actions/challenge-auth";
import { toast } from "sonner";
import { Shield, Check } from "lucide-react";

export function PrivacyPolicyModal({ 
  isOpen, 
  mode = "post-auth",
  onAcceptClient
}: { 
  isOpen: boolean;
  mode?: "pre-auth" | "post-auth";
  onAcceptClient?: () => void;
}) {
  const [accepted, setAccepted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false); // Default false to prevent SSR flash

  useEffect(() => {
    // If we are in post-auth mode (DB says not accepted), check if local storage has it
    if (mode === "post-auth" && isOpen) {
      const localAccepted = localStorage.getItem("privacy_accepted");
      if (localAccepted === "true") {
        // Silently sync to DB
        setShowModal(false);
        acceptPrivacyPolicy().catch(console.error);
      } else {
        setShowModal(true);
      }
    } else if (mode === "pre-auth") {
      setShowModal(isOpen);
    }
  }, [isOpen, mode]);

  const handleAccept = () => {
    if (!accepted) {
      toast.error("Please accept the terms before proceeding.");
      return;
    }
    if (mode === "pre-auth") {
      localStorage.setItem("privacy_accepted", "true");
      setShowModal(false);
      toast.success("Privacy policy accepted.");
      if (onAcceptClient) onAcceptClient();
      return;
    }

    startTransition(async () => {
      const res = await acceptPrivacyPolicy();
      if (res?.error) {
        toast.error(res.error);
      } else {
        localStorage.setItem("privacy_accepted", "true");
        setShowModal(false);
        toast.success("Privacy policy accepted.");
      }
    });
  };

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[700px] bg-[#0a0e11] border-[#3b494b] text-[#dee3e9] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-mono uppercase tracking-widest text-red-500">
            <Shield className="w-6 h-6" />
            Privacy Policy & Terms of Service
          </DialogTitle>
          <DialogDescription className="text-[#849495] font-mono text-sm">
            Please read and agree to our data protection policy before accessing the platform.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-[300px] max-h-[500px] border border-[#3b494b]/50 rounded-md p-4 bg-[#0e1418] text-sm text-[#dee3e9]/90 font-mono leading-relaxed overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">นโยบายการคุ้มครองข้อมูลส่วนบุคคล (Privacy Policy)</h3>
            <p className="text-[#849495]">สำนักงานคณะกรรมการการรักษาความมั่นคงปลอดภัยไซเบอร์แห่งชาติ</p>

            <p>
              หน่วยงานให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของผู้ใช้บริการ ผู้ติดต่อ และผู้ที่เกี่ยวข้อง
              โดยดำเนินการเก็บรวบรวม ใช้ เปิดเผย และรักษาความมั่นคงปลอดภัยของข้อมูลส่วนบุคคลให้เป็นไปตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล
              พ.ศ. 2562 (PDPA) และกฎหมายที่เกี่ยวข้อง เพื่อสร้างความเชื่อมั่นและความโปร่งใสในการให้บริการ
            </p>

            <h4 className="text-white font-bold">ข้อมูลที่เราเก็บรวบรวม</h4>
            <p>
              เราอาจเก็บรวบรวมข้อมูลที่จำเป็นต่อการให้บริการ ได้แก่ ข้อมูลระบุตัวตน เช่น ชื่อ-นามสกุล เลขประจำตัวประชาชน วันเดือนปีเกิด
              ข้อมูลการติดต่อ เช่น ที่อยู่ หมายเลขโทรศัพท์ อีเมล ข้อมูลการใช้งานเว็บไซต์หรือระบบ เช่น IP Address Cookies Device ID
              และข้อมูลอื่นที่เกี่ยวข้องกับการใช้บริการ รวมถึงข้อมูลอ่อนไหว (Sensitive Data)
              เฉพาะกรณีที่กฎหมายกำหนดหรือได้รับความยินยอมจากเจ้าของข้อมูล
            </p>

            <h4 className="text-white font-bold">วัตถุประสงค์ในการใช้ข้อมูล</h4>
            <p>
              ข้อมูลส่วนบุคคลจะถูกนำไปใช้เพื่อการให้บริการตามภารกิจของหน่วยงาน การดำเนินการตามกฎหมาย การติดต่อประสานงาน
              การยืนยันตัวตน การพัฒนาและปรับปรุงคุณภาพการให้บริการ การวิเคราะห์ข้อมูล การบริหารจัดการภายในองค์กร
              การป้องกันการทุจริตและภัยคุกคามทางไซเบอร์ รวมถึงการดำเนินงานอื่นที่เกี่ยวข้องตามกฎหมาย
            </p>

            <h4 className="text-white font-bold">ฐานกฎหมายในการประมวลผลข้อมูล</h4>
            <p>
              หน่วยงานประมวลผลข้อมูลส่วนบุคคลตามฐานกฎหมายที่เหมาะสม ได้แก่ ความยินยอมของเจ้าของข้อมูล การปฏิบัติตามสัญญา
              การปฏิบัติตามกฎหมาย การปฏิบัติภารกิจเพื่อประโยชน์สาธารณะ ประโยชน์โดยชอบด้วยกฎหมาย
              การป้องกันอันตรายต่อชีวิตหรือสุขภาพ และการจัดทำข้อมูลเพื่อการวิจัยหรือสถิติ
            </p>

            <h4 className="text-white font-bold">การเปิดเผยข้อมูล</h4>
            <p>
              หน่วยงานอาจเปิดเผยข้อมูลส่วนบุคคลแก่หน่วยงานของรัฐ ผู้ให้บริการ ผู้ประมวลผลข้อมูล คู่สัญญา
              หรือพันธมิตรทางธุรกิจที่เกี่ยวข้องเท่าที่จำเป็น ภายใต้มาตรการรักษาความปลอดภัยและข้อกำหนดตามกฎหมาย
              โดยจะไม่เปิดเผยข้อมูลแก่บุคคลภายนอกโดยปราศจากเหตุอันชอบด้วยกฎหมาย
            </p>

            <h4 className="text-white font-bold">การเก็บรักษาและความปลอดภัยของข้อมูล</h4>
            <p>
              หน่วยงานจะเก็บรักษาข้อมูลส่วนบุคคลเท่าที่จำเป็นตามวัตถุประสงค์ของการเก็บรวบรวม หรือตามระยะเวลาที่กฎหมายกำหนด
              และมีมาตรการด้านเทคนิคและการบริหารจัดการเพื่อป้องกันการเข้าถึง การใช้ การเปิดเผย การเปลี่ยนแปลง
              หรือการสูญหายของข้อมูลโดยไม่ได้รับอนุญาต
            </p>

            <h4 className="text-white font-bold">สิทธิของเจ้าของข้อมูล</h4>
            <p>
              เจ้าของข้อมูลมีสิทธิตามกฎหมาย ได้แก่ สิทธิในการเข้าถึง ขอรับสำเนา ขอแก้ไข ขอให้ลบหรือทำลายข้อมูล
              ขอระงับการใช้ข้อมูล คัดค้านการประมวลผล ถอนความยินยอม ขอรับหรือโอนย้ายข้อมูล และสิทธิร้องเรียนต่อหน่วยงานกำกับดูแลตามที่กฎหมายกำหนด
            </p>
          </div>
        </ScrollArea>

        <div className="flex items-start space-x-3 mt-4 mb-2 p-3 bg-red-500/5 border border-red-500/20 rounded-md">
          <Checkbox 
            id="terms" 
            checked={accepted} 
            onCheckedChange={(c) => setAccepted(c as boolean)}
            className="border-red-500/50 data-[state=checked]:bg-red-500 data-[state=checked]:text-white mt-1" 
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="terms"
              className="text-sm font-mono font-medium leading-relaxed text-[#dee3e9] cursor-pointer"
            >
              I have read and agree to the Privacy Policy. <br className="hidden sm:block" />
              (ฉันได้อ่านและยอมรับนโยบายการคุ้มครองข้อมูลส่วนบุคคล)
            </label>
          </div>
        </div>

        <Button 
          onClick={handleAccept} 
          disabled={!accepted || isPending}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2 h-12"
        >
          {isPending ? (
            "Processing..."
          ) : (
            <>
              <Check className="w-5 h-5" /> Accept & Continue
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
