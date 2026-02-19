import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Testing Dashboard Data Fetching ---')
  try {
    const [eventCount, registrationCount, checkInCount, recentRegistrations] = await Promise.all([
      prisma.event.count(),
      prisma.registration.count(),
      prisma.checkIn.count(),
      prisma.registration.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { event: true }
      })
    ])

    console.log('✅ Stats Fetched Successfully:')
    console.log(`- Events: ${eventCount}`)
    console.log(`- Registrations: ${registrationCount}`)
    console.log(`- Check-ins: ${checkInCount}`)
    console.log(`- Recent Activity: ${recentRegistrations.length} items`)

    if (recentRegistrations.length > 0) {
        const latest = recentRegistrations[0]
        console.log(`  Latest: ${latest.referenceCode} for ${(latest.event as any).title}`)
    }

  } catch (error) {
    console.error('❌ Dashboard Stats Failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
