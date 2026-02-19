import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await hash('password', 12)
  
  // Create Staff User
  const staff = await prisma.user.upsert({
    where: { email: 'staff@primedigital.com' },
    update: {
        password: password,
        role: 'STAFF'
    },
    create: {
      email: 'staff@primedigital.com',
      name: 'Staff Member',
      password,
      role: 'STAFF',
    },
  })
  
  console.log('Staff user created:', staff)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
