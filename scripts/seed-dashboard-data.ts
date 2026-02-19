
import { PrismaClient, FieldType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('📊 Seeding Dashboard Data...')

    // 1. Create Event with Fields
    const event = await prisma.event.create({
        data: {
            title: 'Dashboard Test Event',
            slug: `dash-test-${Date.now()}`,
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
                    { label: 'T-Shirt Size', type: FieldType.SELECT, options: ['S', 'M', 'L', 'XL', '2XL'], order: 1, required: true },
                    { label: 'Dietary Preference', type: FieldType.SELECT, options: ['None', 'Vegetarian', 'Vegan', 'Halal'], order: 2, required: true },
                    { label: 'Workshops', type: FieldType.CHECKBOX, options: ['React', 'Node', 'Design', 'Marketing'], order: 3, required: false }
                ]
            }
        },
        include: { formFields: true, organizer: true }
    })

    console.log(`✅ Event Created: ${event.title} (${event.slug})`)

    // 2. Generate Random Registrations
    const sizes = ['S', 'M', 'M', 'L', 'L', 'L', 'XL', '2XL']; // weighted
    const diets = ['None', 'None', 'None', 'Vegetarian', 'Halal'];
    const workshops = ['React', 'Node', 'Design', 'Marketing'];

    const data = [];
    for(let i=0; i<100; i++) {
        // Random check-in status
        const isCheckedIn = Math.random() > 0.3;
        
        // Random workshops (0-2)
        const selectedWorkshops = [];
        if(Math.random() > 0.5) selectedWorkshops.push(workshops[Math.floor(Math.random() * workshops.length)]);
        if(Math.random() > 0.8) selectedWorkshops.push(workshops[Math.floor(Math.random() * workshops.length)]);

        data.push({
            eventId: event.id,
            referenceCode: `D-${i}-${Date.now().toString().slice(-4)}`,
            status: "CONFIRMED" as const,
            formData: {
                name: `User ${i}`,
                email: `user${i}@dash.com`,
                "T-Shirt Size": sizes[Math.floor(Math.random() * sizes.length)],
                "Dietary Preference": diets[Math.floor(Math.random() * diets.length)],
                "Workshops": selectedWorkshops
            },
            createdAt: new Date()
        })
    }

    // Insert Registrations
    await prisma.registration.createMany({ data })
    
    // Insert Check-ins for some
    const users = await prisma.registration.findMany({ where: { eventId: event.id } });
    const checkIns = users.filter((_, i) => i % 3 !== 0).map(u => ({ // 2/3 checked in
        registrationId: u.id,
        staffId: event.organizerId, // The admin created above
        scannedAt: new Date()
    }));

    // CheckIn needs unique registrationId constraint handling? 
    // createMany skipDuplicates is useful if re-running, but here checks are fresh.
    await prisma.checkIn.createMany({ 
        data: checkIns,
        skipDuplicates: true 
    })

    console.log(`✅ Seeded 100 registrations (${checkIns.length} checked in)`)
    console.log(`👉 View Dashboard at: /events/${event.slug}/dashboard`)
}

main()
