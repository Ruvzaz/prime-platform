
import { prisma } from "../src/lib/prisma";

async function main() {
  const refCode = "REF-HO9YL8"; // From user screenshot
  console.log(`Inspecting Registration: ${refCode}`);

  const registration = await prisma.registration.findUnique({
    where: { referenceCode: refCode },
    include: {
      checkIn: true,
      event: true
    }
  });

  if (!registration) {
    console.log("Registration not found!");
    return;
  }

  console.log("Status:", registration.status);
  console.log("CheckIn Record:", registration.checkIn);
  console.log("Event:", registration.event.title);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
