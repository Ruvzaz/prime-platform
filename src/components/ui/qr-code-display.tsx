"use client"

import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { useRef, useCallback } from "react"
import { Download } from "lucide-react"

interface QRCodeDisplayProps {
  value: string
  size?: number
  showDownload?: boolean
}

export function QRCodeDisplay({ value, size = 200, showDownload = true }: QRCodeDisplayProps) {
  const svgRef = useRef<HTMLDivElement>(null)

  const handleDownload = useCallback(() => {
    if (!svgRef.current) return

    const svg = svgRef.current.querySelector("svg")
    if (!svg) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const padding = 20
    canvas.width = size + padding * 2
    canvas.height = size + padding * 2

    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const img = new Image()
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size)
      URL.revokeObjectURL(url)

      const link = document.createElement("a")
      link.download = `qr-${value}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    img.src = url
  }, [value, size])

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={svgRef}
        className="bg-white p-4 rounded-xl shadow-sm border inline-block"
      >
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          marginSize={1}
        />
      </div>
      {showDownload && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="text-xs gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        >
          <Download className="w-3.5 h-3.5" />
          บันทึก QR Code
        </Button>
      )}
    </div>
  )
}
