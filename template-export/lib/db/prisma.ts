import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.LOG_LEVEL === 'debug' 
    ? ['query', 'error', 'warn', 'info'] 
    : process.env.NODE_ENV === 'development' 
    ? ['error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export { prisma as db };