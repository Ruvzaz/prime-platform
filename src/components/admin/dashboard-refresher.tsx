"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function DashboardRefresher() {
    const router = useRouter()

    useEffect(() => {
        // Auto-refresh the server component data every 30 seconds
        const interval = setInterval(() => {
            router.refresh()
        }, 5000)

        return () => clearInterval(interval)
    }, [router])

    return null
}
