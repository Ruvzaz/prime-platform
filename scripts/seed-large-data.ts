
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function main() {
    const COUNT = 5000;
    const timestamp = Date.now();
    const slug = `perf-test-${timestamp}`;

    console.log(`🚀 Seeding ${COUNT} registrations for Performance Testing...`)
    
    // 1. Create Event with Fields
    const event = await prisma.event.create({
        data: {
            title: 'Performance Test Event (with Stats)',
            slug: slug,
            startDate: new Date(),
            endDate: new Date(Date.now() + 86400000), // +1 day
            organizer: {
                connectOrCreate: {
                    where: { email: 'admin@test.com' },
                    create: { email: 'admin@test.com', role: 'ADMIN' }
                }
            },
            formFields: {
                create: [
                    { id: 'f-workshop', label: "Workshop", type: "SELECT", options: ["Next.js", "Prisma", "Tailwind", "Supabase"], order: 1 },
                    { id: 'f-size', label: "T-Shirt Size", type: "RADIO", options: ["S", "M", "L", "XL"], order: 2 },
                    { id: 'f-diet', label: "Dietary", type: "CHECKBOX", options: ["None", "Vegan", "Halal"], order: 3 }
                ]
            }
        }
    })
    console.log(`✅ Event Created with Fields: ${slug} (${event.id})`)

    // 2. Prepare Data
    const data = [];
    const workshops = ["Next.js", "Prisma", "Tailwind", "Supabase"];
    const sizes = ["S", "M", "L", "XL"];
    const diets = ["None", "Vegan", "Halal"];

    for(let i=0; i<COUNT; i++) {
        // Randomize some answers
        const selectedDiets = diets.filter(() => Math.random() > 0.7);
        if (selectedDiets.length === 0) selectedDiets.push("None");

        data.push({
            eventId: event.id,
            referenceCode: `P-${timestamp}-${String(i).padStart(4, '0')}`, // Padded for better sorting
            status: "CONFIRMED" as const,
            formData: {
                name: `Perf User ${i}`,
                email: `perf${i}@test.com`,
                company: "Big Data Corp",
                "f-workshop": workshops[Math.floor(Math.random() * workshops.length)],
                "f-size": sizes[Math.floor(Math.random() * sizes.length)],
                "f-diet": selectedDiets
            },
            createdAt: new Date(Date.now() - Math.floor(Math.random() * 1000000000))
        })
    }

    // 3. Bulk Insert
    console.log('⏳ Inserting data (this may take a few seconds)...')
    const start = Date.now();
    
    await prisma.registration.createMany({
        data: data
    })

    const duration = Date.now() - start;
    console.log(`✅ Inserted ${COUNT} records in ${(duration/1000).toFixed(2)}s`)
    console.log(`⚡ Speed: ${(COUNT / (duration/1000)).toFixed(0)} records/sec`)

    await prisma.$disconnect()
}

main()
