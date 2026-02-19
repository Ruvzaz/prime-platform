
import { getRegistrationsForExport } from '../src/app/actions/registration'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('📦 Testing Export Logic...')

    // 1. Test Fetch All
    console.log('\n--- 1. Fetching ALL ---')
    const all = await getRegistrationsForExport('all', '')
    console.log(`✅ Retrieved ${all.length} records (Expect ~5100+)`)

    // 2. Test Fetch Specific Event
    const event = await prisma.event.findFirst({ where: { title: { contains: "Dashboard" } }})
    if (event) {
        console.log(`\n--- 2. Fetching Event: ${event.title} ---`)
        const eventRegs = await getRegistrationsForExport(event.id, '')
        console.log(`✅ Retrieved ${eventRegs.length} records for event (Expect 100)`)
    }

    // 3. Test Fetch with Query
    const query = "RefCode" // Unlikely to match much if we used random strings, let's try a specific one if possible or just check empty
    // Let's use a query we know exists from seed-dashboard-data
    const query2 = "Dietary" // This is in form fields, not searchable by default text search unless we implemented it. 
    // Wait, our search logic searches values.
    // In seed-dashboard-data, we added "T-Shirt Size": "M". Let's search "M" - might be too broad.
    // Let's search for "User 1" name.
    console.log('\n--- 3. Fetching Query "User 1" ---')
    const queryRegs = await getRegistrationsForExport('all', 'User 1')
    console.log(`✅ Retrieved ${queryRegs.length} records matching "User 1"`)
    
    // Verify structure
    if (all.length > 0) {
        const first = all[0]
        console.log('\n--- Sample Data ---')
        console.log('Keys:', Object.keys(first))
        console.log('Event:', first.event?.title)
        
        // Check for Form Fields
        if (first.event?.formFields) {
            console.log('Form Fields:', first.event.formFields.map((f: any) => f.label))
        }

        // Check for Phone in formData?
        // Note: Our seed script didn't add phone numbers explicitly, but let's check keys
        console.log('FormData Keys:', Object.keys(first.formData as object))
    }

    if (queryRegs.length > 0) {
        console.log('\n--- Dynamic Values Check ---')
        const sample = queryRegs[0]
        const data = sample.formData as Record<string, any>
        console.log('T-Shirt Size:', data['T-Shirt Size'])
        console.log('Dietary:', data['Dietary Preference'])
    }
}

main()
