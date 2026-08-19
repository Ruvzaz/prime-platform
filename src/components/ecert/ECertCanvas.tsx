'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Download, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CertData {
  certCode: string;
  recipientPrefix?: string;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientFullName: string;
  eventTitle?: string;
  issueDate?: string;
  verifyLink?: string;
}

interface ECertCanvasProps {
  certData: CertData;
  showDownloadBtn?: boolean;
  onRendered?: () => void;
  className?: string;
}

export function ECertCanvas({
  certData,
  showDownloadBtn = true,
  onRendered,
  className = '',
}: ECertCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(true);

  const extractDayNumber = (dateStr?: string): string => {
    if (!dateStr) return '31';
    const match = dateStr.match(/\d+/);
    return match ? match[0] : '31';
  };

  const p = (certData.recipientPrefix || '').trim();
  const fn = (certData.recipientFirstName || '').trim();
  const ln = (certData.recipientLastName || '').trim();

  const displayName = (p || fn || ln)
    ? `${p}${fn}${ln ? ' ' + ln : ''}`.trim()
    : (certData.recipientFullName || '').trim();

  useEffect(() => {
    let isMounted = true;

    async function drawCertificate() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = 2000;
      const height = 1414;

      canvas.width = width;
      canvas.height = height;

      // Try loading protected template image
      const templateImg = new Image();
      templateImg.src = '/api/ecert/template';

      const hasTemplate = await new Promise<boolean>((resolve) => {
        templateImg.onload = () => resolve(true);
        templateImg.onerror = () => resolve(false);
      });

      if (isMounted) {
        if (hasTemplate) {
          // Draw image background base
          ctx.drawImage(templateImg, 0, 0, width, height);
        } else {
          // Fallback High-Res Certificate Template Canvas Design
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);

          // Outer Border Frame
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 16;
          ctx.strokeRect(40, 40, width - 80, height - 80);

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 6;
          ctx.strokeRect(60, 60, width - 120, height - 120);

          // Inner Decorative Header Accent
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(100, 100, width - 200, 6);

          // Header Text
          ctx.font = "bold 42px 'Courier New', monospace";
          ctx.fillStyle = '#d97706';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('NATIONAL CYBER SECURITY AGENCY', 1000, 220);

          ctx.font = "bold 60px 'Prompt', 'Sarabun', sans-serif";
          ctx.fillStyle = '#0f172a';
          ctx.fillText('ใบประกาศนียบัตร (CERTIFICATE OF ACHIEVEMENT)', 1000, 310);

          ctx.font = "32px 'Prompt', 'Sarabun', sans-serif";
          ctx.fillStyle = '#475569';
          ctx.fillText('ขอมอบใบประกาศนียบัตรนี้เพื่อแสดงว่า', 1000, 460);
        }

        // 1. Recipient Full Name (Centered horizontally at X = 1000px, Y = 640px)
        const nameY = 640;
        ctx.font = "bold 65px 'Prompt', 'Sarabun', sans-serif";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';
        const nameWidth = ctx.measureText(displayName).width;
        const nameX = Math.round(1000 - nameWidth / 2);
        ctx.fillText(displayName, nameX, nameY);

        // Subtitle Event Title
        if (!hasTemplate) {
          const eventY = 780;
          ctx.font = "bold 36px 'Prompt', 'Sarabun', sans-serif";
          ctx.fillStyle = '#2563eb';
          const eventText = certData.eventTitle || 'Thailand Cyber Top Talent 2026';
          const eventWidth = ctx.measureText(eventText).width;
          ctx.fillText(eventText, Math.round(1000 - eventWidth / 2), eventY);
        }

        // 2. Day Number (Centered horizontally at X = 945px, Y = 1006px)
        const dayNumber = extractDayNumber(certData.issueDate);
        const dayY = 1006;
        ctx.font = "bold 32px 'Prompt', 'Sarabun', sans-serif";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';
        const dayWidth = ctx.measureText(dayNumber).width;
        const dayX = Math.round(945 - dayWidth / 2);
        ctx.fillText(dayNumber, dayX, dayY);

        // Full Issue Date (if fallback canvas)
        if (!hasTemplate && certData.issueDate) {
          ctx.font = "28px 'Prompt', 'Sarabun', sans-serif";
          ctx.fillStyle = '#475569';
          const dateText = `ให้ไว้ ณ วันที่ ${certData.issueDate}`;
          ctx.fillText(dateText, Math.round(1000 - ctx.measureText(dateText).width / 2), 1140);
        }

        // 3. QR Code Verification Badge (Position X = 1680px, Y = 1110px, Size 165x165px)
        const verifyUrl = certData.verifyLink || `${window.location.origin}/verify-cert/${certData.certCode}`;
        try {
          const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
            margin: 1,
            width: 165,
            color: { dark: '#0f172a', light: '#ffffff' },
          });

          const qrImg = new Image();
          qrImg.src = qrDataUrl;
          await new Promise((res) => { qrImg.onload = res; });
          ctx.drawImage(qrImg, 1680, 1110, 165, 165);
        } catch (e) {
          console.error('QR rendering error:', e);
        }

        // 4. Certificate Code Footnote Text
        ctx.font = "16px 'Courier New', monospace";
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(`Code: ${certData.certCode}`, 1762, 1290);

        setIsRendering(false);
        if (onRendered) onRendered();
      }
    }

    drawCertificate();

    return () => {
      isMounted = false;
    };
  }, [certData, onRendered]);

  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Certificate-${certData.certCode}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [2000, 1414],
    });
    pdf.addImage(imgData, 'PNG', 0, 0, 2000, 1414);
    pdf.save(`Certificate-${certData.certCode}.pdf`);
  };

  return (
    <div className={`flex flex-col items-center gap-6 ${className}`}>
      {/* Canvas Container with sleek styling */}
      <div className="relative w-full max-w-[900px] aspect-[2000/1414] bg-[#0e1418] rounded-xl overflow-hidden shadow-2xl border border-[#3b494b]">
        {isRendering && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0e1418]/90 backdrop-blur-sm z-10 text-[#dee3e9]">
            <Loader2 className="w-8 h-8 animate-spin text-red-500 mr-3" />
            <span className="font-mono text-sm uppercase tracking-widest">
              Generating High-Res Certificate...
            </span>
          </div>
        )}
        <canvas ref={canvasRef} className="w-full h-full object-contain" />
      </div>

      {/* Download Action Buttons */}
      {showDownloadBtn && !isRendering && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={handleDownloadPNG}
            className="font-mono text-xs uppercase tracking-widest font-bold px-6 py-2.5 bg-[#161c21] border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 active:scale-95 transition-all duration-150 rounded flex items-center gap-2 shadow-[0_0_15px_rgba(52,211,153,0.1)]"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download Image (PNG)</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="font-mono text-xs uppercase tracking-widest font-bold px-6 py-2.5 bg-[#161c21] border border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500 active:scale-95 transition-all duration-150 rounded flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
          >
            <FileText className="w-4 h-4 text-red-400" />
            <span>Download PDF</span>
          </button>
        </div>
      )}
    </div>
  );
}
