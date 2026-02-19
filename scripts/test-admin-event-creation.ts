
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const slug = `admin-test-${Date.now()}`
  console.log('--- Testing Admin Event Creation with Custom Fields ---')

  try {
    // 1. Simulate Admin Creating Event with Fields
    console.log('1. Creating Event...')
    const event = await prisma.event.create({
      data: {
        title: 'Admin Created Event',
        slug: slug,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        organizer: {
            connectOrCreate: {
                where: { email: 'admin@prime.com' },
                create: { email: 'admin@prime.com', role: 'ADMIN' }
            }
        },
        // THIS IS THE KEY PART: Nested create for FormFields
        formFields: {
            create: [
                { label: "T-Shirt Size", type: "SELECT", options: ["S", "M", "L", "XL"], required: true, order: 0 },
                { label: "Allergies", type: "TEXT", required: false, order: 1 },
                { label: "Accept Terms", type: "CHECKBOX", required: true, order: 2 }
            ]
        }
      },
      include: {
        formFields: true
      }
    })

    console.log(`✅ Event Created: ${event.title} (${event.id})`)

    // 2. Verify Form Fields in DB
    console.log('\n2. Verifying Form Fields in Database...')
    if (event.formFields.length !== 3) {
        throw new Error(`Expected 3 fields, found ${event.formFields.length}`)
    }

    const sizeField = event.formFields.find(f => f.label === "T-Shirt Size")
    if (!sizeField || sizeField.type !== "SELECT" || sizeField.options.length !== 4) {
        console.error("❌ T-Shirt Size field mismatch:", sizeField)
        throw new Error("Field verification failed")
    }
    console.log("✅ 'T-Shirt Size' field verified (Select + Options)")

    const allergyField = event.formFields.find(f => f.label === "Allergies")
    if (!allergyField || allergyField.type !== "TEXT" || allergyField.required !== false) {
        console.error("❌ Allergies field mismatch:", allergyField)
        throw new Error("Field verification failed")
    }
    console.log("✅ 'Allergies' field verified (Text + Optional)")

    console.log("\n✅ SYNTAX & LOGIC CHECK PASSED: Event and FormFields created correctly.")

  } catch (error) {
    console.error('❌ Test Failed:', error)
    process.exit(1)
  } finally {
    // Cleanup
    await prisma.formField.deleteMany({ where: { event: { slug: slug }}})
    await prisma.event.delete({ where: { slug: slug }})
    await prisma.$disconnect()
  }
}

main()
