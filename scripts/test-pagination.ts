
import { PrismaClient } from '@prisma/client'
import { getRegistrations } from '../src/app/actions/registration'

// Mocking Prisma for the action if needed, or just using the real one via the action which imports it.
// Since actions import prisma from @/lib/prisma, we need to make sure that works in script context.
// Usually scripts use relative imports which might fail if aliases (@/...) are not resolved by tsx/ts-node without config.
// However, let's try. If it fails on alias, I'll copy the logic to test it or use a relative path trick.

// Actually, testing Server Actions from scripts is tricky due to Next.js context.
// Better to just test the logic with raw prisma in the script, replicating the action's query.
// OR, I can use the existing 'test-dashboard-perf.ts' approach but simplified.

const prisma = new PrismaClient()

async function main() {
    console.log('📄 Testing Pagination Logic...')
    
    const pageSize = 10;
    const page = 2;

    const start = Date.now();
    
    // Simulate what getRegistrations does
    const [registrations, total] = await prisma.$transaction([
        prisma.registration.findMany({
            where: { event: { isActive: true } },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: "desc" },
            select: { id: true, referenceCode: true }
        }),
        prisma.registration.count({ where: { event: { isActive: true } } })
    ]);

    const duration = Date.now() - start;

    console.log(`✅ Fetched Page ${page} (Size ${pageSize})`)
    console.log(`   Count: ${registrations.length}`)
    console.log(`   Total in DB: ${total}`)
    console.log(`   Total Pages: ${Math.ceil(total/pageSize)}`)
    console.log(`⏱️ Time: ${duration}ms`)

    if (registrations.length === pageSize) {
        console.log('✅ Page size limit respected')
    } else {
        console.error('❌ Page size mismatch')
    }
}

main()
