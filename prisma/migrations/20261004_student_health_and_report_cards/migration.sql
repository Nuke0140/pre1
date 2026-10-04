-- AlterTable
ALTER TABLE "students" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "dietaryRestrictions" TEXT,
ADD COLUMN     "emergencyMedicalInstructions" TEXT,
ADD COLUMN     "medicalAlerts" TEXT;

-- CreateTable
CREATE TABLE "student_report_cards" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "branchId" TEXT,
    "academicSessionId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classroomId" TEXT,
    "term" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "evaluatorId" TEXT,
    "evaluatorName" TEXT,
    "remarks" TEXT,
    "overallGrade" TEXT,
    "attendancePct" INTEGER,
    "fieldValues" JSONB NOT NULL,
    "documentId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "publishedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_report_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_report_cards_tenantId_studentId_idx" ON "student_report_cards"("tenantId", "studentId");

-- CreateIndex
CREATE INDEX "student_report_cards_tenantId_classroomId_idx" ON "student_report_cards"("tenantId", "classroomId");

-- CreateIndex
CREATE INDEX "student_report_cards_tenantId_academicSessionId_term_idx" ON "student_report_cards"("tenantId", "academicSessionId", "term");

-- CreateIndex
CREATE UNIQUE INDEX "student_report_cards_tenantId_academicSessionId_term_studen_key" ON "student_report_cards"("tenantId", "academicSessionId", "term", "studentId", "templateId");

-- AddForeignKey
ALTER TABLE "student_report_cards" ADD CONSTRAINT "student_report_cards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_report_cards" ADD CONSTRAINT "student_report_cards_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_report_cards" ADD CONSTRAINT "student_report_cards_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "academic_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_report_cards" ADD CONSTRAINT "student_report_cards_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_report_cards" ADD CONSTRAINT "student_report_cards_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "classrooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_report_cards" ADD CONSTRAINT "student_report_cards_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "document_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_report_cards" ADD CONSTRAINT "student_report_cards_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "generated_profile_documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
