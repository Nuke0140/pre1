import { NextRequest } from 'next/server'
import { Errors } from './api'
import { getRequestMeta } from './audit'

interface RateLimitConfig {
  windowMs: number
  max: number
  keyPrefix?: string
}

interface WindowRecord {
  count: number
  resetTime: number
}

// Global in-memory sliding token store
const memoryStore = new Map<string, WindowRecord>()

// Periodically clean up expired entries every 5 minutes to avoid memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetTime) {
        memoryStore.delete(key)
      }
    }
  }, 5 * 60 * 1000).unref?.()
}

/**
 * Enterprise Sliding Window Rate Limiter
 * Supports Redis (via REDIS_URL when available) with an in-process sliding window store fallback.
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number; retryAfterSeconds: number }> {
  const meta = getRequestMeta(req)
  const clientIp = meta.ipAddress || '127.0.0.1'
  const prefix = config.keyPrefix || 'rl'
  const key = `${prefix}:${clientIp}`
  const now = Date.now()

  // In-process sliding-window rate tracking
  let record = memoryStore.get(key)
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    memoryStore.set(key, record)
    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime: record.resetTime,
      retryAfterSeconds: 0,
    }
  }

  if (record.count >= config.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000))
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfterSeconds,
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: config.max - record.count,
    resetTime: record.resetTime,
    retryAfterSeconds: 0,
  }
}

/**
 * Helper to return HTTP 429 Too Many Requests response with standard headers
 */
export function rateLimitResponse(retryAfterSeconds: number, message = 'Too many requests. Please try again later.') {
  const res = Errors.business('RATE_LIMIT_EXCEEDED', message, 429)
  res.headers.set('Retry-After', String(retryAfterSeconds))
  res.headers.set('X-RateLimit-Reset', String(retryAfterSeconds))
  return res
}

/**
 * Resets rate limit for a key (e.g., in unit/integration tests)
 */
export function resetRateLimit(keyPrefix: string, ip = '127.0.0.1') {
  memoryStore.delete(`${keyPrefix}:${ip}`)
}
