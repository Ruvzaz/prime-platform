
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function benchmark(label: string, fn: () => Promise<any>) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`⏱️  [${label}]: ${(end - start).toFixed(2)}ms`); // Changed to normal parsing
    return result;
}

async function main() {
    console.log('🏁 Starting Dashboard Performance Benchmark...')
    
    // 1. Warm up connection
    await prisma.$connect()

    // 2. Test: Count Total Registrations
    // Dashboard metric: Total Registrations
    const totalRegs = await benchmark("Count Total Registrations", async () => {
        return await prisma.registration.count({
            where: { event: { isActive: true } }
        })
    })
    console.log(`   Result: ${totalRegs} records`)

    // 3. Test: Recent Registrations Query (Dashboard List)
    // Complexity: Join Event, Order By CreatedAt Desc, Take 5
    await benchmark("Recent Registrations (Dashboard Widget)", async () => {
        return await prisma.registration.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { event: true },
            where: { event: { isActive: true } }
        })
    })

    // 4. Test: Full Registrations Table (Pagination Page 1)
    // Complexity: Join CheckIn, Join Event, Order By CreatedAt, Take 10
    await benchmark("Registrations Table (Page 1)", async () => {
        return await prisma.registration.findMany({
            take: 10,
            skip: 0,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                referenceCode: true,
                status: true,
                createdAt: true,
                formData: true,
                checkIn: { select: { scannedAt: true } },
                event: { select: { title: true } }
            },
            where: { event: { isActive: true } }
        })
    })
    
     // 5. Test: Search Query (Filtering by Name inside JSON)
     // This is the heaviest query usually
    await benchmark("Search by Name 'User 100' (JSON Filter)", async () => {
         // Prisma doesn't strictly support deep JSON filtering easily without raw query or reliable syntax, 
         // but let's simulate how we might fetch all for client-side filtering or use a simple contains if DB supports
         // For now, let's test a standard "Get All for Event" which populates the table before client-side filter
         const event = await prisma.event.findFirst({ where: { title: 'Performance Test Event' }})
         if(!event) return;

         return await prisma.registration.findMany({
             where: { eventId: event.id },
             select: { id: true, formData: true }
         })
    })

    console.log('✅ Benchmark Complete')
    await prisma.$disconnect()
}

main()
