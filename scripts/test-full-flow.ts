import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const slug = `flow-test-${Date.now()}`
  let eventId = ""
  let registrationId = ""
  let refCode = ""

  try {
    console.log('--- 1. Create Event with Custom Forms ---')
    const event = await prisma.event.create({
      data: {
        title: 'Full Flow Test Event',
        slug: slug,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        organizer: {
            connectOrCreate: {
                where: { email: 'admin@test.com' },
                create: { email: 'admin@test.com', role: 'ADMIN' }
            }
        },
        formFields: {
            create: [
                { label: "Company", type: "TEXT", required: true, order: 0 },
                { label: "Dietary", type: "SELECT", options: ["None", "Vegan"], required: false, order: 1 }
            ]
        }
      },
      include: { formFields: true }
    })
    eventId = event.id
    console.log('✅ Event Created:', event.slug)
    console.log('✅ Form Fields:', event.formFields.length, 'fields created')

    console.log('\n--- 2. Register Attendee (With Custom Data) ---')
    refCode = "REF-" + Math.random().toString(36).substring(2, 8).toUpperCase()
    const registration = await prisma.registration.create({
        data: {
            eventId: eventId,
            referenceCode: refCode,
            formData: { 
                name: "Test User", 
                email: "test@user.com",
                field_company: "Tech Corp",
                field_dietary: "Vegan"
            },
            status: "CONFIRMED"
        }
    })
    registrationId = registration.id
    console.log('✅ Registered:', refCode)

    console.log('\n--- 3. Perform Check-in ---')
    // Mock staff
    const staff = await prisma.user.findFirst()
    if (!staff) {
        console.warn("⚠️ No staff found, skipping check-in test")
    } else {
        const checkIn = await prisma.checkIn.create({
            data: {
                registrationId: registrationId,
                staffId: staff.id
            }
        })
        console.log('✅ Check-in Recorded:', checkIn.scannedAt)
    
        console.log('\n--- 4. Verify Duplicate Check-in Prevention ---')
        try {
            await prisma.checkIn.create({
                data: {
                    registrationId: registrationId,
                    staffId: staff.id
                }
            })
            console.error('❌ Failed: Should not allow duplicate check-in')
        } catch (e) {
            console.log('✅ Correctly rejected duplicate check-in')
        }
    }

  } catch (error) {
    console.error('❌ Test Failed:', error)
  } finally {
    console.log('\n--- Cleanup ---')
    if (eventId) {
        // Delete CheckIns first (if any created in this test)
        await prisma.checkIn.deleteMany({
            where: { registration: { eventId: eventId } }
        })
        // Delete Registrations
        await prisma.registration.deleteMany({
            where: { eventId: eventId }
        })
        // Delete Event
        await prisma.event.delete({ where: { id: eventId } })
        console.log('✅ Cleaned up')
    }
    await prisma.$disconnect()
  }
}

main()
