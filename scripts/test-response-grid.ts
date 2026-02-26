
import { prisma } from '../src/lib/prisma'
import { getRegistrations } from '../src/app/actions/registration'

async function main() {
    console.log('📊 Testing Response Grid Data Flow...')

    // 1. Mimic Page Load: Fetch Events
    const events = await prisma.event.findMany({
        where: { title: { contains: "Dashboard" } },
        select: {
            id: true,
            title: true, 
            slug: true,
            formFields: { orderBy: { order: 'asc' } }
        },
        take: 1
    })

    if (events.length === 0) {
        console.log('❌ No events found')
        return
    }

    const event = events[0]
    console.log(`✅ Event Loaded: ${event.title} (${event.formFields.length} fields)`)

    // 2. Mimic Component: Fetch Registrations
    console.log(`\nFetching registrations for ${event.title}...`)
    const result = await getRegistrations(event.id, 1, 10, "")
    const regs = result.data

    console.log(`✅ Loaded ${regs.length} registrations`)

    if (regs.length > 0) {
        const first = regs[0]
        // 3. Verify Event Data for Edit Sheet
        if (first.event && first.event.formFields) {
            console.log('✅ Registration has event.formFields')
            console.log('Fields:', first.event.formFields.map((f: any) => f.label).join(', '))
        } else {
            console.error('❌ Registration MISSING event.formFields (Edit Sheet will break!)')
        }
        
        // 4. Verify Dynamic Data
        console.log('Sample FormData:', first.formData)
        
        event.formFields.forEach((field: any) => {
            const valByLabel = (first.formData as any)?.[field.label]
            const valById = (first.formData as any)?.[field.id]
            console.log(`Field '${field.label}': LabelAccess=${valByLabel}, IdAccess=${valById}`)
            
            if (valByLabel !== undefined) {
                console.log(`✅ Success: Found data using Label '${field.label}'`)
            } else if (valById !== undefined) {
                console.log(`⚠️ Note: Found data using ID '${field.id}'`)
            } else {
                console.log(`❌ Warning: No data found for '${field.label}'`)
            }
        })
    }
}

main()
