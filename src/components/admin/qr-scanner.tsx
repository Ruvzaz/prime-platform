"use client"

import { useEffect, useId, useRef, useState, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Camera, CameraOff, SwitchCamera } from "lucide-react"

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const reactId = useId()
  const containerId = `qr-reader-${reactId.replace(/:/g, "")}`
  const lastScanRef = useRef<string>("")
  const cooldownRef = useRef<boolean>(false)
  const onScanRef = useRef(onScan)
  onScanRef.current = onScan

  const stopScanning = useCallback(async () => {
    const scanner = scannerRef.current
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop()
        }
        scanner.clear()
      } catch {
        // Ignore cleanup errors
      }
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  const startScanning = useCallback(async () => {
    setCameraError(null)

    // Stop any existing scanner first
    await stopScanning()

    try {
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          // Prevent duplicate scans within 3 seconds
          if (cooldownRef.current || decodedText === lastScanRef.current) return
          lastScanRef.current = decodedText
          cooldownRef.current = true

          onScanRef.current(decodedText)

          setTimeout(() => {
            cooldownRef.current = false
            lastScanRef.current = ""
          }, 3000)
        },
        () => {} // Ignore scan failures (expected while searching)
      )

      setIsScanning(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied"
      setCameraError(msg)
      onError?.(msg)
    }
  }, [containerId, facingMode, onError, stopScanning])

  const switchCamera = async () => {
    await stopScanning()
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }

  // Auto-restart when facingMode changes
  useEffect(() => {
    if (isScanning) {
      startScanning()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  return (
    <div className="space-y-4">
      {/* Wrapper keeps the QR reader div and React-managed overlay separate */}
      <div className="aspect-square w-full rounded-lg overflow-hidden bg-black relative">
        {/* This div is EXCLUSIVELY owned by html5-qrcode — React never renders children inside it */}
        <div
          id={containerId}
          className="absolute inset-0"
        />

        {/* React-managed overlay sits OUTSIDE the library-owned div */}
        {!isScanning && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white z-10">
            <Camera className="w-12 h-12 opacity-40" />
            <Button
              onClick={startScanning}
              variant="secondary"
              size="lg"
              className="gap-2"
            >
              <Camera className="w-4 h-4" />
              Open Camera
            </Button>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <CameraOff className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-700 font-medium">Camera Error</p>
          <p className="text-xs text-red-500 mt-1">{cameraError}</p>
          <Button
            onClick={startScanning}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Retry
          </Button>
        </div>
      )}

      {isScanning && (
        <div className="flex gap-2">
          <Button
            onClick={switchCamera}
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
          >
            <SwitchCamera className="w-4 h-4" />
            Flip Camera
          </Button>
          <Button
            onClick={stopScanning}
            variant="destructive"
            size="sm"
            className="flex-1 gap-1.5"
          >
            <CameraOff className="w-4 h-4" />
            Stop
          </Button>
        </div>
      )}
    </div>
  )
}
