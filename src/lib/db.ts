import { PrismaClient } from '@prisma/client'

const rawUrl = (
  process.env.POSTGRES_PRISMA_URL ||
  process.env.PRISMA_DATABASE_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.PREONE_PG_URL ||
  'postgresql://postgres:postgres@127.0.0.1:5432/preone'
).trim()

/**
 * Normalizes PostgreSQL connection string for hosted and serverless environments:
 * 1. Auto-upgrades direct Prisma Postgres (db.prisma.io -> pooled.db.prisma.io).
 * 2. Adds pgbouncer=true for PgBouncer / Neon / Supabase transaction poolers to prevent prepared statement conflicts.
 * 3. Enforces sslmode=require for non-local hosted databases.
 * 4. Configures connection_limit appropriate for serverless (1-3) vs server/dev (20) to prevent pool starvation.
 * 5. Configures connect_timeout and pool_timeout to withstand serverless cold starts.
 */
function runtimeUrl(raw: string): string {
  if (!raw) return raw

  let url = raw.replace(/@db\.prisma\.io(?=:?\d*\/)/, '@pooled.db.prisma.io')

  const isVercelPostgres = url.includes('postgres.vercel-storage.com')
  const isNeon = url.includes('.neon.tech')
  const isSupabasePooler = url.includes('pooler.supabase.com') || (url.includes('.supabase.co') && url.includes(':6543'))
  const isPooler = isVercelPostgres || isNeon || isSupabasePooler || url.includes('pgbouncer=true') || url.includes('-pooler.')

  // Prevent "prepared statement already exists" error with transaction-mode poolers
  if (isPooler && !url.includes('pgbouncer=')) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}pgbouncer=true`
  }

  // Require SSL for hosted/remote databases
  const isLocal = url.includes('127.0.0.1') || url.includes('localhost')
  if (!isLocal && !url.includes('sslmode=')) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}sslmode=require`
  }

  // Optimize connection limit to prevent connection pool exhaustion in serverless environments
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY)
  const defaultLimit = isServerless ? (isPooler ? '1' : '3') : '20'

  if (!url.includes('connection_limit=')) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}connection_limit=${defaultLimit}`
  }

  // Connection timeouts for serverless cold-start resilience
  if (!url.includes('connect_timeout=')) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}connect_timeout=15`
  }

  if (!url.includes('pool_timeout=')) {
    const sep = url.includes('?') ? '&' : '?'
    url = `${url}${sep}pool_timeout=15`
  }

  return url
}

const RUNTIME_DB_URL = runtimeUrl(rawUrl)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: RUNTIME_DB_URL } },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
