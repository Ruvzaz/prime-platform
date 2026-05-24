import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const result = await prisma.$queryRaw`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'CheckIn';`;
  console.log(result);
}

run().finally(() => prisma.$disconnect());
