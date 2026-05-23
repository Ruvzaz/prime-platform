import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const checkins = await prisma.checkIn.findMany({
    where: { registration: { referenceCode: "REF-FEF606F9" } },
  });
  console.log("CheckIns for REF-FEF606F9:", checkins);
}

check().finally(() => prisma.$disconnect());
