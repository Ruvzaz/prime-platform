import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const reg = await prisma.registration.findUnique({
    where: { referenceCode: "REF-FEF606F9" },
    include: { checkIns: true }
  });
  if (!reg) return console.log("Not found");
  
  const staffId = reg.checkIns.length > 0 ? reg.checkIns[0].staffId : (await prisma.user.findFirst())?.id;
  
  try {
    await prisma.$transaction([
      prisma.checkIn.create({
        data: {
          registrationId: reg.id,
          staffId: staffId!,
          sessionTitle: "Day 1 - Afternoon",
        },
      })
    ]);
    console.log("Success");
  } catch (e: any) {
    console.log("Code:", e.code);
    console.log("Meta:", e.meta);
    console.log("Message:", e.message);
  }
}
run().finally(() => prisma.$disconnect());
