
import { updateRegistration } from '../src/app/actions/registration'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧪 Testing Update Registration with Arrays...')

    // 1. Get a registration
    const reg = await prisma.registration.findFirst()
    if (!reg) {
        console.error('❌ No registration found')
        return
    }
    console.log(`🔹 Testing with Registration: ${reg.referenceCode}`)

    // 2. Update with Array Data
    const newFormData = {
        ...reg.formData as object,
        "Workshops": ["React", "Advanced Node"], // Array value
        "UpdatedField": "Test Value"
    }

    console.log('🔹 Updating with:', newFormData)

    const result = await updateRegistration(reg.id, reg.status, newFormData)
    
    if (result.success) {
        console.log('✅ Update Successful')
        
        // 3. Verify in DB
        const updated = await prisma.registration.findUnique({ where: { id: reg.id } })
        console.log('🔹 Retrieved FormData:', updated?.formData)
        
        const workshops = (updated?.formData as any)["Workshops"]
        if (Array.isArray(workshops) && workshops.includes("React")) {
            console.log('✅ Array stored correctly as JSON Array')
        } else {
            console.error('❌ Array check failed:', workshops)
        }
    } else {
        console.error('❌ Update Failed:', result.error)
    }
}

main()
