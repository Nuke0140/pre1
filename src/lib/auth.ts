import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'preone_session'
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'preone-dev-jwt-secret-2f8b7c9d4e6a1f3b5c8d0e'
)

export type Role =
  | 'PLATFORM_ADMIN'
  | 'OWNER'
  | 'PRINCIPAL'
  | 'COORDINATOR'
  | 'TEACHER'
  | 'ACCOUNTS'
  | 'RECEPTION'
  | 'PARENT'

export interface SessionPayload {
  uid: string
  email: string
  name: string
  tenantId: string | null
  branchId: string | null
  role: Role
}

// ── RBAC — permission bundles per role (PRD §7 + API Catalog §5.3) ──
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  PLATFORM_ADMIN: ['platform:manage', 'audit:read'],
  OWNER: ['*'],
  PRINCIPAL: [
    'students:read', 'students:write',
    'admissions:read', 'admissions:write', 'admissions:approve',
    'attendance:read', 'attendance:mark', 'attendance:approve',
    'finance:read', 'finance:write',
    'communication:read', 'communication:broadcast',
    'academics:read', 'academics:write', 'academics:approve',
    'timeline:read',
    'settings:read', 'settings:write',
    'users:read', 'users:write',
    'audit:read',
  ],
  COORDINATOR: [
    'students:read', 'students:write',
    'admissions:read', 'admissions:write',
    'attendance:read', 'attendance:mark',
    'finance:read',
    'communication:read', 'communication:broadcast',
    'academics:read', 'academics:write',
    'timeline:read',
    'settings:read', 'users:read',
  ],
  TEACHER: [
    'students:read',
    'attendance:read', 'attendance:mark',
    'academics:read', 'academics:write',
    'communication:read',
    'timeline:read',
  ],
  ACCOUNTS: [
    'students:read',
    'finance:read', 'finance:write',
    'attendance:read',
    'audit:read',
  ],
  RECEPTION: [
    'students:read', 'students:write',
    'admissions:read', 'admissions:write',
    'communication:read',
    'timeline:read',
  ],
  PARENT: ['timeline:read', 'communication:read', 'finance:read'],
}

export function can(role: Role, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || []
  if (perms.includes(permission)) return true
  // '*' grants every SCHOOL-scope permission, but never platform-scope ones —
  // platform:* is reserved for PLATFORM_ADMIN (tenant plane ≠ school plane).
  if (perms.includes('*')) return !permission.startsWith('platform:')
  return false
}

// ── JWT ──
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('preone')
    .setExpirationTime('7d')
    .sign(SECRET)
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: 'preone' })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
