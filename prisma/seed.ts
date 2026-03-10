import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be strictly set in environment variables.")
  }

  const password = await hash(adminPassword, 12)
  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
        password: password,
        role: 'ADMIN'
    },
    create: {
      email: adminEmail,
      name: 'Admin User',
      password,
      role: 'ADMIN',
    },
  })
  console.log({ user })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
