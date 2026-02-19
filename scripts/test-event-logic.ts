import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()


async function main() {
  console.log('1. Testing Database Connection...')
  try {
    await prisma.$connect()
    console.log('✅ Connected to Database')
  } catch (error) {
    console.error('❌ Failed to connect to Database:', error)
    process.exit(1)
  }

  console.log('\n2. Testing Event Creation...')
  const slug = `test-event-${Date.now()}`
  try {
    const event = await prisma.event.create({
      data: {
        title: 'Integration Test Event',
        description: 'Created via test script',
        slug: slug,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000), // +1 day
        location: 'Test Runner',
        organizer: {
            // connecting to a mock organizer or creating one if validation allows
            create: {
                email: `admin-${Date.now()}@test.com`,
                name: 'Test Admin',
                role: 'ADMIN'
            }
        }
      },
    })
    console.log('✅ Event Created:', event.id, event.slug)
    
    console.log('\n3. Testing Event Retrieval...')
    const verified = await prisma.event.findUnique({
        where: { id: event.id }
    })
    
    if (verified) {
        console.log('✅ Event Retrieved Successfully')
    } else {
        console.error('❌ Event not found after creation')
    }

    console.log('\n4. Cleaning up...')
    await prisma.event.delete({
        where: { id: event.id }
    })
    // clean up user too to avoid clutter (optional, depends on cascade)
    await prisma.user.delete({
        where: { id: event.organizerId }
    })
    console.log('✅ Test Data Cleaned up')

  } catch (error) {
    console.error('❌ Test Failed:', error)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
