-- CreateTable: Multi-branch staff assignment junction (Doc 2.2 P2 Audit)
CREATE TABLE IF NOT EXISTS "tenant_user_branches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantUserId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_user_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tenant_user_branches_tenantUserId_branchId_key" ON "tenant_user_branches"("tenantUserId", "branchId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_user_branches_tenantId_branchId_idx" ON "tenant_user_branches"("tenantId", "branchId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_user_branches_tenantUserId_idx" ON "tenant_user_branches"("tenantUserId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_user_branches_tenantId_fkey'
  ) THEN
    ALTER TABLE "tenant_user_branches" ADD CONSTRAINT "tenant_user_branches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_user_branches_tenantUserId_fkey'
  ) THEN
    ALTER TABLE "tenant_user_branches" ADD CONSTRAINT "tenant_user_branches_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "tenant_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_user_branches_branchId_fkey'
  ) THEN
    ALTER TABLE "tenant_user_branches" ADD CONSTRAINT "tenant_user_branches_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
