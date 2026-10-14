# PreOne Production Deployment Checklist

This checklist defines mandatory security, configuration, and verification requirements prior to deploying PreOne to production environments.

---

## 1. Authentication & Security Gating

### [CRITICAL] Demo OTP Code Bypass (BUG-029)
- [ ] **Verify `NODE_ENV=production` is set** in production container/runtime environment.
- [ ] **Verify `ENABLE_DEMO_OTP` and `ALLOW_DEMO_OTP` are NOT set to `true`** in production environment variables.
  - When `NODE_ENV === 'production'`, the OTP authentication service (`src/lib/auth/otp-service.ts`) automatically gates off fixed demo bypass codes (`0000`, `1234`).
  - Attempting to log in with `0000` or `1234` in production without explicit configuration must be rejected with `AUTH_004` (No active verification code) or `INVALID_OTP`.
- [ ] **Verify JWT Secret**: `JWT_SECRET` must be set to a strong, high-entropy 256-bit random key (do not use default development secret).
- [ ] **Verify Cookie Security**: In production, `session` cookies must be issued with `HttpOnly; SameSite=Lax; Secure`.
- [ ] **Account Lockout & Brute Force Protection**: Max 3 OTP attempts before token invalidation (`OTP_MAX_ATTEMPTS = 3`).

---

## 2. Security Headers & Network Gateway (BUG-006)
- [ ] **HSTS**: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- [ ] **Frame Guard**: `X-Frame-Options: SAMEORIGIN`
- [ ] **MIME Guard**: `X-Content-Type-Options: nosniff`
- [ ] **Referrer Policy**: `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] **Permissions Policy**: `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 3. Storage & Binary Assets
- [ ] **AWS S3 / Cloudflare R2 configured**: Zero raw media binaries stored in Git or local disk in production (`AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).
- [ ] **CDN**: `CDN_BASE_URL` mapped to media distribution edge.

---

## 4. Database & Health Endpoints
- [ ] **Database Connection Pool**: Ensure `DATABASE_URL` uses pooled connection (`pooled.db.prisma.io` or PgBouncer).
- [ ] **Prisma Migrations**: Run `prisma migrate deploy` before container launch.
- [ ] **Public Health Endpoints**: `/api/v1/health` and `/api/v1/version` must return `200 OK` without requiring authentication cookies.
