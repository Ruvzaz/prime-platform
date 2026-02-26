
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Verifying Data...')
    const reg = await prisma.registration.findFirst({
        where: { formData: { path: ['name'], string_contains: "Perf User 0" } }
    })
    if (reg) {
        console.log('FormData:', reg.formData)
        const workshops = (reg.formData as any)["Workshops"]
        console.log('Workshops Value:', workshops)
        console.log('Is Array?', Array.isArray(workshops))
    } else {
        console.log('No data found')
    }
}

main()
