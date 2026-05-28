// Prisma 7 generated client. Import from the explicit file path.
import { PrismaClient } from "../app/generated/prisma/client";

// Prevent multiple Prisma client instances in Next.js dev hot-reload.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL!,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
