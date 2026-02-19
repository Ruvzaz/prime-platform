
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const timestamp = Date.now()
  const activeSlug = `test-active-${timestamp}`
  const inactiveSlug = `test-inactive-${timestamp}`
  let activeEventId = ""
  let inactiveEventId = ""

  try {
    console.log('\n🔵 --- 1. Setup Events ---')
    
    // 1.1 Create Active Event
    const activeEvent = await prisma.event.create({
      data: {
        title: 'Active Test Event',
        slug: activeSlug,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        isActive: true,
        organizer: {
          connectOrCreate: {
            where: { email: 'admin@test.com' },
            create: { email: 'admin@test.com', role: 'ADMIN' }
          }
        },
        formFields: {
            create: [
                { id: `name_${timestamp}`, label: "Name", type: "TEXT", required: true, order: 0 },
                { id: `email_${timestamp}`, label: "Email", type: "EMAIL", required: true, order: 1 }
            ]
        }
      },
      include: { formFields: true }
    })
    activeEventId = activeEvent.id
    console.log(`✅ Created Active Event: ${activeSlug}`)

    // 1.2 Create Inactive Event
    const inactiveEvent = await prisma.event.create({
        data: {
          title: 'Inactive Test Event',
          slug: inactiveSlug,
          startDate: new Date(),
          endDate: new Date(),
          isActive: false, // Soft deleted / Inactive
          organizer: { connect: { email: 'admin@test.com' } }
        }
    })
    inactiveEventId = inactiveEvent.id
    console.log(`✅ Created Inactive/Deleted Event: ${inactiveSlug}`)


    console.log('\n🔵 --- 2. Registration Tests ---')

    // 2.1 Register for Active Event (Should Success)
    const refCode = "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase()
    const regSuccess = await prisma.registration.create({
        data: {
            eventId: activeEventId,
            referenceCode: refCode,
            formData: { 
                [`name_${timestamp}`]: "Happy User", 
                [`email_${timestamp}`]: "happy@test.com" 
            },
            status: "CONFIRMED"
        }
    })
    console.log(`✅ [POSITIVE] Registration successful for active event (${regSuccess.referenceCode})`)

    // 2.2 Register for Inactive Event (Should NOT happen via UI, but DB allows it? Testing logic)
    // In strict API logic, we should probably block this, but let's see if our Actions block it.
    // Note: This script tests DB direct access. To test API/Action logic, we'd need to mock the request or use fetch.
    // We will assume if DB allows, the Action needs to check.
    
    console.log('\n🔵 --- 3. Check-in Logic Tests ---')

    // 3.1 Check-in happy path
    const staff = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (staff) {
        const checkIn = await prisma.checkIn.create({
            data: {
                registrationId: regSuccess.id,
                staffId: staff.id
            }
        })
        console.log(`✅ [POSITIVE] Check-in successful`)
    
        // 3.2 Duplicate check-in
        try {
            await prisma.checkIn.create({
                data: {
                    registrationId: regSuccess.id,
                    staffId: staff.id
                }
            })
            console.error(`❌ [NEGATIVE] Failed: Allowed duplicate check-in!`)
        } catch (e) {
            console.log(`✅ [POSITIVE] Correctly blocked duplicate check-in`)
        }
    }

    console.log('\n🔵 --- 4. Dashboard Stats Check ---')
    const stats = await prisma.registration.count({ where: { event: { isActive: true } } })
    console.log(`ℹ️ Current active registrations count: ${stats}`)


  } catch (error) {
    console.error('❌ Test Suite Failed:', error)
  } finally {
    console.log('\n🟡 --- Cleanup ---')
    // Cleanup logic
    await prisma.checkIn.deleteMany({ where: { registration: { eventId: activeEventId } } })
    await prisma.registration.deleteMany({ where: { eventId: activeEventId } })
    await prisma.event.delete({ where: { id: activeEventId } })
    await prisma.event.delete({ where: { id: inactiveEventId } })
    console.log('✅ Cleanup complete')
    await prisma.$disconnect()
  }
}

main()
