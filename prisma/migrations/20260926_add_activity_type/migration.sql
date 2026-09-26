-- AlterTable
ALTER TABLE "classroom_activities" ADD COLUMN IF NOT EXISTS "activity_type" TEXT DEFAULT 'ACTIVITY';
