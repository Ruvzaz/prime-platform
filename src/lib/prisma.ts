import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma_v2: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma_v2 ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v2 = prisma;

