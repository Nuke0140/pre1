-- Drop the single-tenant unique constraint on userId alone (Doc 3.1)
DROP INDEX IF EXISTS "staff_profiles_userId_key";

-- Create compound unique constraint scoping StaffProfile to (tenantId, userId)
CREATE UNIQUE INDEX IF NOT EXISTS "staff_profiles_tenantId_userId_key" ON "staff_profiles"("tenantId", "userId");

-- Create index on userId for fast relational queries
CREATE INDEX IF NOT EXISTS "staff_profiles_userId_idx" ON "staff_profiles"("userId");

-- Add foreign key constraint to tenant_users compound key (tenantId, userId)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'staff_profiles_tenantId_userId_fkey'
  ) THEN
    ALTER TABLE "staff_profiles"
      ADD CONSTRAINT "staff_profiles_tenantId_userId_fkey"
      FOREIGN KEY ("tenantId", "userId")
      REFERENCES "tenant_users"("tenantId", "userId")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
