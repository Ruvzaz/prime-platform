
import { getEventDashboardStats } from '../src/app/actions/dashboard'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('📊 Testing Event Dashboard Stats...')

    // Get the Dashboard active event
    const event = await prisma.event.findFirst({
        where: { title: { contains: "Dashboard" }, isActive: true },
        orderBy: { createdAt: 'desc' }
    })

    if (!event) {
        console.log('⚠️ No active event found to test.')
        return
    }

    console.log(`🔹 Testing with Event: ${event.title} (${event.slug})`)

    const stats = await getEventDashboardStats(event.slug)

    if (!stats) {
        console.error('❌ Failed to get stats')
        return
    }

    console.log('✅ Stats Retrieved:')
    console.log(`   - Total Registrations: ${stats.totalRegistrations}`)
    console.log(`   - Checked In: ${stats.totalCheckedIn}`)
    console.log(`   - Check-in Rate: ${stats.checkInRate}%`)
    console.log(`   - Fields Analyzed: ${stats.fieldStats.length}`)

    stats.fieldStats.forEach(field => {
        console.log(`   📝 Field: ${field.label} (${field.type})`)
        field.answers.forEach(a => {
            console.log(`      - ${a.name}: ${a.value}`)
        })
    })
}

main()
