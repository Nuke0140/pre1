import { NextResponse } from 'next/server'

/** PreOne API v1 envelope  { success, data, meta?, traceId } (API Contract Catalog §8) */
export function traceId(): string {
  return (
    Date.now().toString(16) + Math.random().toString(16).slice(2, 10)
  ).toUpperCase()
}

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}), traceId: traceId() },
    { status, headers: { 'X-API-Version': '1.0.0' } }
  )
}

export function fail(
  code: string,
  message: string,
  status = 400,
  field?: string,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(field ? { field } : {}), ...(details ? { details } : {}) },
      traceId: traceId(),
    },
    { status, headers: { 'X-API-Version': '1.0.0' } }
  )
}

export const Errors = {
  unauthorized: () => fail('AUTH_001', 'Authentication required', 401),
  invalidToken: () => fail('AUTH_002', 'Invalid or expired session', 401),
  forbidden: (what = 'You do not have permission to perform this action') =>
    fail('PERMISSION_001', what, 403),
  notFound: (entity = 'Resource') => fail('NOT_FOUND_001', `${entity} not found`, 404),
  validation: (message: string, field?: string, details?: unknown) =>
    fail('VALIDATION_001', message, 400, field, details),
  conflict: (message: string) => fail('CONFLICT_001', message, 409),
  business: (code: string, message: string, status = 422) => fail(code, message, status),
  system: (e: unknown) => {
    console.error('[api] system error:', e)
    return fail('SYSTEM_001', 'Something went wrong on our side', 500)
  },
}

export const bad = (message: string, code = 'BAD_REQUEST', field?: string) => fail(code, message, 400, field)
export const forbidden = (message = 'Forbidden') => Errors.forbidden(message)
export const notFound = (message = 'Resource not found') => fail('NOT_FOUND', message, 404)
export const conflict = (message: string) => Errors.conflict(message)
export const serverError = (e?: unknown) => Errors.system(e)
