// Database connection and utilities
import { PrismaClient } from '@prisma/client'
import { redis } from './redis'

// Global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections growing exponentially
// during API Route usage.
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient()
  }
  prisma = (global as any).prisma
}

export function getRedis() {
  return redis
}

export async function withTransaction<T>(fn: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>): Promise<T> {
  return await prisma.$transaction(fn)
}

export { prisma }

// Mock database for development if no database is configured
export const mockDb = {
  users: [],
  campaigns: [],
  applications: [],
  payments: []
}

export default prisma