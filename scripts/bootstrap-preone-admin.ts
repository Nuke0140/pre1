/**
 * Idempotent PreOne Admin Bootstrap Script (CLI Entrypoint)
 *
 * Ensures the canonical PREONE tenant and initial administrator account exist
 * identically across local development and Vercel production environments:
 *
 *   School code: PREONE
 *   Email:       admin@preone.com
 *   Username:    admin
 *   Password:    Preone@2311 (or PREONE_ADMIN_PASSWORD env var)
 *   Role:        OWNER (Institution Admin with full school authority)
 *   Status:      ACTIVE
 */

import { bootstrapPreoneAdmin } from '../src/lib/auth/admin-bootstrap'
import { db } from '../src/lib/db'

export { bootstrapPreoneAdmin }

// Direct execution CLI entrypoint
if (require.main === module || process.argv[1]?.includes('bootstrap-preone-admin')) {
  bootstrapPreoneAdmin()
    .then(() => db.$disconnect())
    .catch((err) => {
      console.error('❌ Bootstrap failed:', err)
      db.$disconnect().finally(() => process.exit(1))
    })
}
