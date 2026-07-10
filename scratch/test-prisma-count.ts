import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { isActive: true },
      include: {
        teams: {
          select: {
            id: true,
            name: true,
            leader: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: {
            teamMembers: {
              where: { status: 'APPROVED' }
            }
          }
        }
      },
    });
    console.log("Success!", challenges);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
