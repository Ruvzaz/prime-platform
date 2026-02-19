
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
    const COUNT = 5000;
    const timestamp = Date.now();
    const slug = `perf-test-${timestamp}`;

    console.log(`🚀 Seeding ${COUNT} registrations for Performance Testing...`)
    
    // 1. Create Event
    const event = await prisma.event.create({
        data: {
            title: 'Performance Test Event',
            slug: slug,
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000), // +1 day
            organizer: {
                connectOrCreate: {
                    where: { email: 'admin@test.com' },
                    create: { email: 'admin@test.com', role: 'ADMIN' }
                }
            }
        }
    })
    console.log(`✅ Event Created: ${slug} (${event.id})`)

    // 2. Prepare Data
    const data = [];
    for(let i=0; i<COUNT; i++) {
        data.push({
            eventId: event.id,
            referenceCode: `P-${timestamp}-${i}`, // Simple unique code
            status: "CONFIRMED" as const, // Explicit cast
            formData: {
                name: `Perf User ${i}`,
                email: `perf${i}@test.com`,
                company: "Big Data Corp"
            },
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000)) // Random past dates
        })
    }

    // 3. Bulk Insert
    console.log('⏳ Inserting data (this may take a few seconds)...')
    const start = Date.now();
    
    // Prisma createMany is efficient
    await prisma.registration.createMany({
        data: data
    })

    const duration = Date.now() - start;
    console.log(`✅ Inserted ${COUNT} records in ${(duration/1000).toFixed(2)}s`)
    console.log(`⚡ Speed: ${(COUNT / (duration/1000)).toFixed(0)} records/sec`)

    await prisma.$disconnect()
}

main()
