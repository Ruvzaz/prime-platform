import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing all records from the database...')
  
  // ลบข้อมูลโดยเรียงจากตารางลูกไปตารางแม่ เพื่อหลีกเลี่ยงปัญหา Foreign Key Constraint
  await prisma.checkIn.deleteMany()
  await prisma.registration.deleteMany()
  await prisma.formField.deleteMany()
  await prisma.event.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('Successfully cleared all records.')
}

main()
  .catch((e) => {
    console.error('Error clearing database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
