-- Admissions End-to-End Workflow Migration (ADM-01 to ADM-19)
-- 1. AlterTable admission_applications: make childDob nullable for early walk-ins/enquiries
ALTER TABLE "admission_applications" ALTER COLUMN "childDob" DROP NOT NULL;

-- 2. AlterTable application_documents: add durable storage & verification audit fields
ALTER TABLE "application_documents"
  ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "storageKey" TEXT,
  ADD COLUMN IF NOT EXISTS "fileSize" INTEGER,
  ADD COLUMN IF NOT EXISTS "mimeType" TEXT,
  ADD COLUMN IF NOT EXISTS "uploadedById" TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedById" TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedByName" TEXT,
  ADD COLUMN IF NOT EXISTS "remarks" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. CreateTable application_invitations: secure, single-use, hashed invitation tokens for parent portal access
CREATE TABLE IF NOT EXISTS "application_invitations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "rawToken" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "sendAttempts" INTEGER NOT NULL DEFAULT 1,
    "lastError" TEXT,
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_invitations_pkey" PRIMARY KEY ("id")
);

-- 4. CreateIndexes on application_invitations
CREATE UNIQUE INDEX IF NOT EXISTS "application_invitations_tokenHash_key" ON "application_invitations"("tokenHash");
CREATE INDEX IF NOT EXISTS "application_invitations_tenantId_status_idx" ON "application_invitations"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "application_invitations_applicationId_idx" ON "application_invitations"("applicationId");
CREATE INDEX IF NOT EXISTS "application_invitations_tokenHash_idx" ON "application_invitations"("tokenHash");

-- 5. Foreign Key Constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'application_invitations_tenantId_fkey'
  ) THEN
    ALTER TABLE "application_invitations"
      ADD CONSTRAINT "application_invitations_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'application_invitations_applicationId_fkey'
  ) THEN
    ALTER TABLE "application_invitations"
      ADD CONSTRAINT "application_invitations_applicationId_fkey"
      FOREIGN KEY ("applicationId") REFERENCES "admission_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
