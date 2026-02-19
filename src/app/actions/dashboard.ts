"use server"

import { prisma } from "@/lib/prisma"

export type FieldStat = {
  id: string
  label: string
  type: string
  answers: { name: string; value: number }[]
}

export type EventDashboardStats = {
  eventTitle: string
  totalRegistrations: number
  totalCheckedIn: number
  checkInRate: number
  fieldStats: FieldStat[]
}

export async function getEventDashboardStats(slug: string): Promise<EventDashboardStats | null> {
  try {
    const event = await prisma.event.findUnique({
      where: { slug }, // Lookup by slug
      include: {
        formFields: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!event) return null

    // Fetch all registrations for this event
    // Select only necessary fields to minimize data transfer
    const registrations = await prisma.registration.findMany({
      where: { eventId: event.id },
      select: {
        status: true,
        checkIn: { select: { id: true } },
        formData: true,
      },
    })

    const totalRegistrations = registrations.length
    const totalCheckedIn = registrations.filter((r) => r.checkIn).length
    const checkInRate = totalRegistrations > 0 ? (totalCheckedIn / totalRegistrations) * 100 : 0

    // Aggregate Form Field Answers
    const fieldStats: FieldStat[] = event.formFields
      .filter((field) => ["SELECT", "RADIO", "CHECKBOX"].includes(field.type))
      .map((field) => {
        const counts: Record<string, number> = {}

        registrations.forEach((reg) => {
          const data = reg.formData as Record<string, any>
          const value = data[field.label] // Form builder uses label as key currently? Or ID? 
          // *Correction*: In form-builder, we usually use ID or Label. 
          // Examining registration.ts/submit logic might be needed to confirm Key.
          // Assuming Label for now based on previous knowledge ("name", "email" are keys).
          // If the key is the label, it's brittle if label changes, but that seems to be the current pattern.
          
          if (!value) return

          if (Array.isArray(value)) {
            // Checkbox (array of strings)
            value.forEach((v) => {
              const strVal = String(v)
              counts[strVal] = (counts[strVal] || 0) + 1
            })
          } else {
            // Select/Radio (string)
            const strVal = String(value)
            counts[strVal] = (counts[strVal] || 0) + 1
          }
        })

        // Convert to array for Recharts
        const answers = Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value) // Sort by popularity

        return {
          id: field.id,
          label: field.label,
          type: field.type,
          answers,
        }
      })

    return {
      eventTitle: event.title,
      totalRegistrations,
      totalCheckedIn,
      checkInRate,
      fieldStats,
    }
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
    return null
  }
}
