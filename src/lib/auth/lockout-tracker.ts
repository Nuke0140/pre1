import { db } from '@/lib/db'

interface AttemptRecord {
  count: number
  lastAttempt: number
}

// In-memory supplement (for invalid/non-existent identifiers to prevent enumeration)
const inMemoryAttempts = new Map<string, AttemptRecord>()

export const MAX_CONSECUTIVE_FAILURES = 5
export const ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Returns in-memory consecutive failed attempts for raw keys/identifiers.
 */
export function getFailedAttempts(key: string): number {
  if (!key) return 0
  const normalizedKey = key.toLowerCase().trim()
  const record = inMemoryAttempts.get(normalizedKey)
  if (!record) return 0

  const now = Date.now()
  if (now - record.lastAttempt >= ATTEMPT_WINDOW_MS) {
    inMemoryAttempts.delete(normalizedKey)
    return 0
  }

  return record.count
}

/**
 * Increments in-memory failed attempt count.
 */
export function recordFailedAttempt(key: string): number {
  if (!key) return 1
  const normalizedKey = key.toLowerCase().trim()
  const current = getFailedAttempts(normalizedKey)
  const next = current + 1
  inMemoryAttempts.set(normalizedKey, { count: next, lastAttempt: Date.now() })
  return next
}

/**
 * Clears in-memory failed attempts for provided identifiers.
 */
export function resetFailedAttempts(...keys: (string | null | undefined)[]) {
  for (const k of keys) {
    if (k && typeof k === 'string') {
      inMemoryAttempts.delete(k.toLowerCase().trim())
    }
  }
}

export const MAX_IP_FAILURES = 10

/**
 * Returns in-memory consecutive failed attempts for a given IP address.
 */
export function getIpFailedAttempts(ip?: string | null): number {
  if (!ip) return 0
  return getFailedAttempts(`ip:${ip}`)
}

/**
 * Increments in-memory failed attempt count for a given IP address.
 */
export function recordIpFailedAttempt(ip?: string | null): number {
  if (!ip) return 0
  return recordFailedAttempt(`ip:${ip}`)
}

/**
 * Clears in-memory failed attempts for a given IP address.
 */
export function resetIpFailedAttempts(ip?: string | null): void {
  if (!ip) return
  resetFailedAttempts(`ip:${ip}`)
}

/**
 * Clears all in-memory attempt tracking (used by test suites).
 */
export function clearAllAttempts(): void {
  inMemoryAttempts.clear()
}

/**
 * Atomically records a failed attempt in PostgreSQL for a canonical user ID.
 * Uses row-level locking and sliding-window logic directly in SQL to prevent race conditions
 * across concurrent serverless instances.
 */
export async function recordPersistentFailedAttempt(userId: string): Promise<number> {
  if (!userId) return 1

  try {
    const result: any = await db.$queryRaw`
      UPDATE "users"
      SET 
        "failedLoginAttempts" = CASE
          WHEN "lastFailedLoginAt" IS NULL OR "lastFailedLoginAt" < (NOW() - INTERVAL '15 minutes') THEN 1
          ELSE "failedLoginAttempts" + 1
        END,
        "lastFailedLoginAt" = NOW()
      WHERE "id" = ${userId}
      RETURNING "failedLoginAttempts"
    `
    const count = result[0]?.failedLoginAttempts
    return typeof count === 'number' ? count : 1
  } catch {
    // Fallback gracefully to in-memory tracking if DB query fails
    return recordFailedAttempt(userId)
  }
}

/**
 * Reads persistent failed attempts for a canonical user ID from PostgreSQL.
 * Evaluates the 15-minute sliding window expiration.
 */
export async function getPersistentFailedAttempts(userId: string): Promise<number> {
  if (!userId) return 0

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true, lastFailedLoginAt: true },
    })

    if (!user || !user.lastFailedLoginAt) return 0
    const windowStart = new Date(Date.now() - ATTEMPT_WINDOW_MS)
    if (user.lastFailedLoginAt < windowStart) {
      return 0
    }
    return user.failedLoginAttempts ?? 0
  } catch {
    return getFailedAttempts(userId)
  }
}

/**
 * Resets persistent failed attempts in PostgreSQL upon successful login
 * or authorized administrative unlock.
 */
export async function resetPersistentFailedAttempts(userId: string): Promise<void> {
  if (!userId) return

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
      },
    })
  } catch {
    // Non-fatal
  }
}
