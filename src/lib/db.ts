import { PrismaClient } from '@prisma/client'

// PreOne runs on PostgreSQL (frozen ADR). The sandbox exports a legacy
// DATABASE_URL for SQLite, so we prefer the explicit PostgreSQL URLs, with
// the canonical Prisma DATABASE_URL as fallback.
const PREONE_PG_URL =
  process.env.PREONE_PG_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://preone:preone@127.0.0.1:54329/preone'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: PREONE_PG_URL } },
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
