"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScanLine, Search, UserCheck, AlertCircle, CheckCircle, Zap, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { verifyAndCheckIn, CheckInResult } from "@/app/actions/check-in"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { QRScanner } from "@/components/admin/qr-scanner"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * Extract reference code from a value that might be:
 * - A plain reference code: "REG-A1B2C3"
 * - A check-in URL: "https://example.com/check-in/auto/REG-A1B2C3"
 */
function extractRefCode(input: string): string {
  const trimmed = input.trim()

  // Try to extract from URL pattern: /check-in/auto/CODE
  const urlMatch = trimmed.match(/\/check-in\/auto\/([A-Za-z0-9-]+)/i)
  if (urlMatch) return urlMatch[1].toUpperCase()

  // Try full URL parse
  try {
    const url = new URL(trimmed)
    const pathMatch = url.pathname.match(/\/check-in\/auto\/([A-Za-z0-9-]+)/i)
    if (pathMatch) return pathMatch[1].toUpperCase()
  } catch {
    // Not a URL, treat as plain code
  }

  return trimmed.toUpperCase()
}

export default function CheckInPage() {
  const [code, setCode] = useState("")
  const [machineInput, setMachineInput] = useState("")
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const machineInputRef = useRef<HTMLInputElement>(null)

  const handleCheckIn = async (refCode: string) => {
    if (!refCode || loading) return;
    setLoading(true);
    setResult(null);
    
    try {
        const res = await verifyAndCheckIn(refCode);
        setResult(res);
        if (res.success) {
            setCode(""); 
            setScanCount(prev => prev + 1)
        }
    } catch (e) {
        setResult({ success: false, message: "Network error" });
    } finally {
        setLoading(false);
    }
  }

  const handleQRScan = (scannedValue: string) => {
    const refCode = extractRefCode(scannedValue)
    handleCheckIn(refCode);
  }

  const handleMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!machineInput) return
    const refCode = extractRefCode(machineInput)
    setMachineInput("") // Clear immediately for next scan
    // Re-focus after clearing
    setTimeout(() => machineInputRef.current?.focus(), 50)
    handleCheckIn(refCode)
  }

  // Auto-clear result after 5 seconds (for continuous scanning)
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setResult(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [result])

  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex items-center justify-center transition-colors">
      {/* Floating Back Button */}
      <div className="absolute top-4 left-4 z-50">
        <Button asChild variant="ghost" className="hidden sm:flex gap-2 text-muted-foreground hover:bg-muted">
          <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /> กลับสู่หน้าหลัก</Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="sm:hidden text-muted-foreground hover:bg-muted">
          <Link href="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
      </div>

      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md shadow-xl bg-card text-card-foreground border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Event Check-In</CardTitle>
          <CardDescription>Scan QR Code, Enter Code, or use QR Machine</CardDescription>
          {scanCount > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium mx-auto">
              <UserCheck className="w-3.5 h-3.5" />
              {scanCount} checked in this session
            </div>
          )}
        </CardHeader>
        <CardContent>
          
          {result && (
             <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                {result.success ? (
                    <Alert className="bg-primary/5 border-primary/20 text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <AlertTitle>Success!</AlertTitle>
                        <AlertDescription>
                            <strong>{result.attendee?.name}</strong> checked in to {result.attendee?.eventTitle}.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert variant={result.message?.includes("Already") ? "default" : "destructive"} 
                           className={result.message?.includes("Already") ? "bg-muted border-border text-foreground" : ""}>
                         <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{result.message?.includes("Already") ? "Warning" : "Error"}</AlertTitle>
                        <AlertDescription>
                            {result.message}
                            {result.attendee && (
                                <div className="mt-1 text-xs">
                                    User: {result.attendee.name}<br/>
                                    Checked in at: {result.attendee.checkedInAt?.toString()}
                                </div>
                            )}
                        </AlertDescription>
                    </Alert>
                )}
             </div>
          )}

          <Tabs defaultValue="scan" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="scan">
                <ScanLine className="w-4 h-4 mr-1.5" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Search className="w-4 h-4 mr-1.5" />
                Manual
              </TabsTrigger>
              <TabsTrigger value="machine">
                <Zap className="w-4 h-4 mr-1.5" />
                QR Machine
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="scan" className="space-y-4">
               <QRScanner onScan={handleQRScan} />
               {loading && (
                 <div className="text-center text-sm text-muted-foreground animate-pulse">
                   Checking in...
                 </div>
               )}
            </TabsContent>
            
            <TabsContent value="manual" className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleCheckIn(code); }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reference Code</label>
                  <div className="flex gap-2">
                    <Input 
                        placeholder="REG-XXXXXXXX" 
                        className="uppercase font-mono text-lg" 
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" size="lg" disabled={loading || !code}>
                  {loading ? "Checking..." : "Check In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="machine" className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-border bg-muted/50 p-6 text-center">
                <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">USB QR Scanner Mode</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Point your USB QR scanner at the attendee&apos;s QR code. The scanner will automatically read and check in.
                </p>

                <form onSubmit={handleMachineSubmit}>
                  <Input
                    ref={machineInputRef}
                    value={machineInput}
                    onChange={(e) => setMachineInput(e.target.value)}
                    placeholder="Waiting for QR scan..."
                    className="text-center font-mono text-sm bg-background"
                    autoFocus
                    autoComplete="off"
                  />
                </form>

                <div className="mt-3 flex items-center justify-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${loading ? 'bg-primary/60 animate-pulse' : 'bg-primary'}`} />
                  <span className="text-xs text-muted-foreground">
                    {loading ? 'Processing...' : 'Ready to scan'}
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
