import { PrismaClient } from "@/generated/prisma";

declare global {
  var prisma: PrismaClient | undefined;
}

const globalForPrisma = global as typeof globalThis & { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
