'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CertLayoutConfig } from '@/types/cert-template';

export interface CertData {
  certCode: string;
  recipientPrefix?: string;
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientFullName: string;
  teamName?: string;
  eventTitle?: string;
  issueDate?: string;
  verifyLink?: string;
  backgroundImageUrl?: string | null;
  layoutConfig?: CertLayoutConfig | null;
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

      const layout = certData.layoutConfig;
      const customBg = certData.backgroundImageUrl;

      // Try loading custom or default template image
      const templateImg = new Image();
      templateImg.src = customBg || '/api/ecert/template';

      const hasTemplate = await new Promise<boolean>((resolve) => {
        templateImg.onload = () => resolve(true);
        templateImg.onerror = () => resolve(false);
      });

      if (!isMounted) return;

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

      // RENDER WITH CUSTOM DYNAMIC LAYOUT CONFIG (IF PRESENT)
      if (layout) {
        // 1. Recipient Name
        if (layout.showName !== false) {
          const x = (layout.nameX / 100) * width;
          const y = (layout.nameY / 100) * height;
          ctx.font = `bold ${layout.nameFontSize || 56}px 'Prompt', 'Sarabun', sans-serif`;
          ctx.textAlign = (layout.nameAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = layout.nameColor || '#0f172a';
          ctx.fillText(displayName, x, y);
        }

        // 1.5. Team Name (for CTF Challenge with Max Width Ellipsis Truncation)
        if (layout.showTeam && certData.teamName) {
          const x = ((layout.teamX ?? 50) / 100) * width;
          const y = ((layout.teamY ?? 58) / 100) * height;
          const maxW = ((layout.teamMaxWidth || 650) / 2000) * width;
          ctx.font = `bold ${layout.teamFontSize || 32}px 'Prompt', 'Sarabun', sans-serif`;
          ctx.textAlign = (layout.teamAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = layout.teamColor || '#2563eb';

          let renderText = certData.teamName;
          if (ctx.measureText(renderText).width > maxW) {
            let truncated = renderText;
            while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxW) {
              truncated = truncated.slice(0, -1);
            }
            renderText = truncated ? truncated + '...' : renderText;
          }

          ctx.fillText(renderText, x, y);
        }

        // 2. Issue Date
        if (layout.showDate && certData.issueDate) {
          const x = (layout.dateX / 100) * width;
          const y = (layout.dateY / 100) * height;
          ctx.font = `${layout.dateFontSize || 28}px 'Prompt', 'Sarabun', sans-serif`;
          ctx.textAlign = (layout.dateAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = layout.dateColor || '#475569';
          ctx.fillText(`ให้ไว้ ณ วันที่ ${certData.issueDate}`, x, y);
        }

        // 3. QR Code Verification
        if (layout.showQr !== false) {
          const qrSize = layout.qrSize || 140;
          const x = (layout.qrX / 100) * width - qrSize / 2;
          const y = (layout.qrY / 100) * height - qrSize / 2;
          const verifyUrl = certData.verifyLink || `${window.location.origin}/verify-cert/${certData.certCode}`;

          try {
            const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
              margin: 1,
              width: qrSize,
              color: { dark: '#0f172a', light: '#ffffff' },
            });

            const qrImg = new Image();
            qrImg.src = qrDataUrl;
            await new Promise((res) => { qrImg.onload = res; });
            ctx.drawImage(qrImg, x, y, qrSize, qrSize);
          } catch (e) {
            console.error('QR rendering error:', e);
          }
        }

        // 4. Certificate Code
        if (layout.showCode !== false) {
          const x = (layout.codeX / 100) * width;
          const y = (layout.codeY / 100) * height;
          ctx.font = `${layout.codeFontSize || 20}px 'Courier New', monospace`;
          ctx.textAlign = (layout.codeAlign as CanvasTextAlign) || 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = layout.codeColor || '#64748b';
          ctx.fillText(`Code: ${certData.certCode}`, x, y);
        }
      } else {
        // FALLBACK STANDARD LAYOUT RENDERING
        const nameY = 640;
        ctx.font = "bold 65px 'Prompt', 'Sarabun', sans-serif";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';
        const nameWidth = ctx.measureText(displayName).width;
        const nameX = Math.round(1000 - nameWidth / 2);
        ctx.fillText(displayName, nameX, nameY);

        if (!hasTemplate) {
          const eventY = 780;
          ctx.font = "bold 36px 'Prompt', 'Sarabun', sans-serif";
          ctx.fillStyle = '#2563eb';
          const eventText = certData.eventTitle || 'Thailand Cyber Top Talent 2026';
          const eventWidth = ctx.measureText(eventText).width;
          ctx.fillText(eventText, Math.round(1000 - eventWidth / 2), eventY);
        }

        const dayNumber = extractDayNumber(certData.issueDate);
        const dayY = 1006;
        ctx.font = "bold 32px 'Prompt', 'Sarabun', sans-serif";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0f172a';
        const dayWidth = ctx.measureText(dayNumber).width;
        const dayX = Math.round(945 - dayWidth / 2);
        ctx.fillText(dayNumber, dayX, dayY);

        if (!hasTemplate && certData.issueDate) {
          ctx.font = "28px 'Prompt', 'Sarabun', sans-serif";
          ctx.fillStyle = '#475569';
          const dateText = `ให้ไว้ ณ วันที่ ${certData.issueDate}`;
          ctx.fillText(dateText, Math.round(1000 - ctx.measureText(dateText).width / 2), 1140);
        }

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

        ctx.font = "16px 'Courier New', monospace";
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(`Code: ${certData.certCode}`, 1762, 1290);
      }

      setIsRendering(false);
      if (onRendered) onRendered();
    }

    drawCertificate();

    return () => {
      isMounted = false;
    };
  }, [certData, onRendered]);

  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `Certificate_${certData.certCode}.png`;
    link.href = image;
    link.click();
  };

  const handleDownloadPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [2000, 1414],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, 2000, 1414);
    pdf.save(`Certificate_${certData.certCode}.pdf`);
  };

  return (
    <div className={`flex flex-col items-center space-y-6 ${className}`}>
      <div className="relative w-full max-w-4xl shadow-2xl rounded-2xl overflow-hidden border-2 border-slate-900/10 bg-slate-950/5 dark:bg-zinc-900">
        {isRendering && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm text-white">
            <Loader2 className="w-10 h-10 animate-spin text-amber-400 mb-2" />
            <p className="font-mono text-sm uppercase tracking-wider font-semibold">
              Generating High-Res E-Certificate...
            </p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-auto block bg-white"
          style={{ aspectRatio: '2000 / 1414' }}
        />
      </div>

      {showDownloadBtn && !isRendering && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button
            onClick={handleDownloadImage}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Image (PNG)
          </Button>

          <Button
            onClick={handleDownloadPDF}
            className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs uppercase tracking-wider px-6 h-11 rounded-xl shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
          >
            <FileText className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      )}
    </div>
  );
}
