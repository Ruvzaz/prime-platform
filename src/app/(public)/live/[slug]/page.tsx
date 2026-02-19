"use client"

import { useState, useEffect, useCallback } from "react"
import { UserCheck, Users, Radio } from "lucide-react"

interface CheckInEntry {
  id: string
  referenceCode: string
  name: string
  scannedAt: string
}

interface EventInfo {
  title: string
  imageUrl: string | null
  themeColor: string | null
  startDate: string
}

export default function LiveBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("")
  const [event, setEvent] = useState<EventInfo | null>(null)
  const [checkIns, setCheckIns] = useState<CheckInEntry[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [highlightId, setHighlightId] = useState<string | null>(null)

  // Unwrap params
  useEffect(() => {
    params.then(p => setSlug(p.slug))
  }, [params])

  const fetchData = useCallback(async () => {
    if (!slug) return
    try {
      const res = await fetch(`/api/checkins/${slug}`)
      if (!res.ok) {
        setError("Event not found")
        return
      }
      const data = await res.json()
      
      // Detect new check-in for highlight animation
      if (data.checkIns.length > 0 && checkIns.length > 0) {
        const latestNew = data.checkIns[0].id
        const latestOld = checkIns[0]?.id
        if (latestNew !== latestOld) {
          setHighlightId(latestNew)
          setTimeout(() => setHighlightId(null), 5000)
        }
      }
      
      setEvent(data.event)
      setCheckIns(data.checkIns)
      setTotal(data.total)
      setLastUpdate(new Date())
      setError(null)
    } catch {
      setError("Connection error")
    }
  }, [slug, checkIns])

  // Poll every 5 seconds
  useEffect(() => {
    if (!slug) return
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p className="text-xl text-gray-400">{error}</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    )
  }

  const themeColor = event.themeColor || "#6366f1"

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Header */}
      <header
        className="relative px-6 py-6 border-b border-white/10"
        style={{ background: `linear-gradient(135deg, ${themeColor}22, transparent)` }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
            <p className="text-sm text-gray-400 mt-1">Live Check-in Board</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur">
              <Users className="w-4 h-4" />
              <span className="text-xl font-bold">{total}</span>
              <span className="text-xs text-gray-400">checked in</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              LIVE
            </div>
          </div>
        </div>
      </header>

      {/* Latest Check-in Spotlight */}
      {checkIns.length > 0 && (
        <div
          className="max-w-5xl mx-auto px-6 py-8"
        >
          <div
            className="relative p-8 rounded-2xl border border-white/10 text-center overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${themeColor}15, ${themeColor}05)`,
              borderColor: `${themeColor}40`,
            }}
          >
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Latest Check-in</p>
            <div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
              style={{ background: `${themeColor}30`, color: themeColor }}
            >
              {checkIns[0].name.substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{checkIns[0].name}</h2>
            <p className="text-lg font-mono text-gray-400">{checkIns[0].referenceCode}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(checkIns[0].scannedAt).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>

            {/* Decorative glow */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20"
              style={{ background: themeColor }}
            />
          </div>
        </div>
      )}

      {/* Check-in List */}
      <div className="max-w-5xl mx-auto px-6 pb-8">
        {checkIns.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Waiting for check-ins...</p>
            <p className="text-sm mt-1">This page will update automatically</p>
          </div>
        ) : (
          <>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Recent Check-ins
            </h3>
            <div className="grid gap-2">
              {checkIns.map((ci, index) => (
                <div
                  key={ci.id}
                  className={`
                    flex items-center justify-between p-4 rounded-xl border transition-all duration-700
                    ${ci.id === highlightId
                      ? "border-green-500/50 bg-green-500/10 scale-[1.01] shadow-lg shadow-green-500/10"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-600 w-8 text-right font-mono">
                      #{index + 1}
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        background: `${themeColor}20`,
                        color: themeColor,
                      }}
                    >
                      {ci.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{ci.name}</p>
                      <p className="text-xs font-mono text-gray-500">
                        {ci.referenceCode}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(ci.scannedAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {ci.id === highlightId && (
                      <span className="text-[10px] text-green-400 font-medium uppercase tracking-wider">
                        Just now
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950/80 backdrop-blur border-t border-white/5 px-6 py-2">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-gray-600">
          <span>Auto-refreshing every 5s</span>
          <span>Last update: {lastUpdate.toLocaleTimeString("th-TH")}</span>
        </div>
      </div>
    </div>
  )
}
