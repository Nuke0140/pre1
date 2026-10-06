-- R2 Financial Integrity: tenant-scoped payment idempotency
-- Safety gate: fail the migration if existing non-null transaction references
-- collide inside a tenant. Resolve duplicates before retrying this migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "payments"
    WHERE "transactionRef" IS NOT NULL
    GROUP BY "tenantId", "transactionRef"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'R2 migration blocked: duplicate non-null payment transactionRef values exist within a tenant';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "payments_tenantId_transactionRef_key"
  ON "payments" ("tenantId", "transactionRef")
  WHERE "transactionRef" IS NOT NULL;
