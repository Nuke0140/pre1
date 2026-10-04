/**
 * PreOne — Bulk Document Generation Jobs Engine
 * Orchestrates multi-tenant bulk document generation, population resolution,
 * parallel PDF rendering via PdfService, unified ZIP archive generation with JSZip,
 * and automatic synchronization with Student and Staff Profile Document Libraries.
 */

import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'
import { db } from '@/lib/db'
import { PdfService } from '@/lib/templates/pdf-service'
import { TemplateDataResolver } from '@/lib/templates/data-resolver'
import { DocumentType, TemplateDefinition } from '@/lib/templates/types'
import { AuditService } from '@/lib/audit/audit-service'

export interface BulkJobFilters {
  academicYear?: string
  branchId?: string
  programId?: string
  classroomId?: string
  staffCategory?: string
  status?: string
  search?: string
}

export interface CreateBulkJobInput {
  title: string
  templateId: string
  documentType: DocumentType
  filters?: BulkJobFilters
  createdById: string
  createdByName?: string
  autoStart?: boolean
}

export class BulkDocumentService {
  /**
   * List document generation jobs for a tenant with pagination, search, and status filters.
   */
  static async listJobs(
    tenantId: string,
    filters: {
      status?: string
      documentType?: string
      branchId?: string
      search?: string
      page?: number
      limit?: number
    } = {}
  ) {
    const page = Math.max(1, filters.page ?? 1)
    const limit = Math.max(1, Math.min(100, filters.limit ?? 20))
    const skip = (page - 1) * limit

    const where: any = { tenantId }

    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status
    }
    if (filters.documentType && filters.documentType !== 'ALL') {
      where.documentType = filters.documentType
    }
    if (filters.branchId && filters.branchId !== 'ALL') {
      where.branchId = filters.branchId
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim()
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { templateName: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [total, jobs] = await Promise.all([
      db.bulkDocumentJob.count({ where }),
      db.bulkDocumentJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          branch: { select: { id: true, name: true, code: true } },
          _count: {
            select: { items: true, generatedDocs: true },
          },
        },
      }),
    ])

    return {
      jobs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get single job by ID with detailed counters and items.
   */
  static async getJobById(
    tenantId: string,
    jobId: string,
    options: { includeItems?: boolean; itemPage?: number; itemLimit?: number } = {}
  ) {
    const job = await db.bulkDocumentJob.findFirst({
      where: { id: jobId, tenantId },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        template: { select: { id: true, name: true, type: true, content: true } },
      },
    })

    if (!job) return null

    let items: any[] = []
    let itemsTotal = 0

    if (options.includeItems) {
      const itemPage = Math.max(1, options.itemPage ?? 1)
      const itemLimit = Math.max(1, Math.min(100, options.itemLimit ?? 50))
      const skip = (itemPage - 1) * itemLimit

      const [count, itemRows] = await Promise.all([
        db.bulkDocumentJobItem.count({ where: { jobId: job.id, tenantId } }),
        db.bulkDocumentJobItem.findMany({
          where: { jobId: job.id, tenantId },
          orderBy: [{ status: 'asc' }, { entityName: 'asc' }],
          skip,
          take: itemLimit,
          include: {
            document: {
              select: { id: true, fileName: true, fileUrl: true, fileSizeBytes: true },
            },
          },
        }),
      ])

      items = itemRows
      itemsTotal = count
    }

    return {
      ...job,
      items,
      itemsTotal,
    }
  }

  /**
   * Resolve the eligible population for a given document type and filter criteria.
   */
  static async resolvePopulation(tenantId: string, documentType: DocumentType, filters: BulkJobFilters = {}) {
    const isStaff = documentType === 'STAFF_ID_CARD'

    if (isStaff) {
      const where: any = {
        tenantId,
        deletedAt: null,
      }
      if (filters.branchId && filters.branchId !== 'ALL') {
        where.branchId = filters.branchId
      }
      if (filters.staffCategory && filters.staffCategory !== 'ALL') {
        where.department = filters.staffCategory
      }
      if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status
      }

      const staff = await db.staffProfile.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: { employeeCode: 'asc' },
      })

      return staff.map((s) => ({
        entityType: 'STAFF' as const,
        entityId: s.id,
        entityName: s.user?.fullName || `Staff ${s.employeeCode}`,
        identifier: s.employeeCode,
        metadata: {
          designation: s.designation || 'Staff',
          department: s.department || 'Academics',
          branch: s.branch?.name || 'Main Campus',
        },
      }))
    }

    // Student population
    const where: any = {
      tenantId,
      deletedAt: null,
    }
    if (filters.branchId && filters.branchId !== 'ALL') {
      where.branchId = filters.branchId
    }
    if (filters.classroomId && filters.classroomId !== 'ALL') {
      where.currentClassroomId = filters.classroomId
    }
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status as any
    } else {
      where.status = 'ACTIVE'
    }

    const students = await db.student.findMany({
      where,
      include: {
        currentClassroom: { select: { id: true, name: true, programType: true } },
      },
      orderBy: [{ admissionNo: 'asc' }],
    })

    return students.map((s) => {
      const fullName = `${s.firstName} ${s.lastName || ''}`.trim()
      return {
        entityType: 'STUDENT' as const,
        entityId: s.id,
        entityName: fullName,
        identifier: s.admissionNo,
        metadata: {
          classroom: s.currentClassroom?.name || 'Unassigned',
          program: s.currentClassroom?.programType || '',
        },
      }
    })
  }

  /**
   * Create a new bulk generation job and enqueue background processing.
   */
  static async createJob(tenantId: string, input: CreateBulkJobInput) {
    // 1. Validate template
    const template = await db.documentTemplate.findFirst({
      where: { id: input.templateId, tenantId },
    })

    if (!template) {
      throw new Error('Selected template not found or does not belong to this tenant')
    }

    const templateDef = template.content as unknown as TemplateDefinition
    const templateVersion = templateDef?.version || 1

    // 2. Resolve eligible population
    const population = await this.resolvePopulation(tenantId, input.documentType, input.filters || {})
    if (population.length === 0) {
      throw new Error('No eligible records found matching the specified filters')
    }

    // 3. Create the master job record
    const job = await db.bulkDocumentJob.create({
      data: {
        tenantId,
        branchId: input.filters?.branchId && input.filters.branchId !== 'ALL' ? input.filters.branchId : null,
        title: input.title.trim(),
        templateId: template.id,
        templateVersion,
        templateName: template.name,
        documentType: input.documentType,
        status: 'QUEUED',
        filters: (input.filters || {}) as any,
        totalCount: population.length,
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        createdById: input.createdById,
        createdByName: input.createdByName || 'System',
      },
    })

    // 4. Create batch items in PENDING state
    await db.bulkDocumentJobItem.createMany({
      data: population.map((p) => ({
        jobId: job.id,
        tenantId,
        entityType: p.entityType,
        entityId: p.entityId,
        entityName: p.entityName,
        identifier: p.identifier,
        status: 'PENDING',
      })),
    })

    // 5. Audit Log
    await AuditService.recordSecurityEvent({
      action: 'DATA_EXPORT',
      entity: 'BulkDocumentJob',
      entityId: job.id,
      module: 'REPORTS',
      actorId: input.createdById,
      actorName: input.createdByName || 'Admin',
      actorRole: 'PRINCIPAL',
      tenantId,
      summary: `Created bulk document job "${job.title}" for ${population.length} records (${job.documentType})`,
      severity: 'INFO',
    }).catch(() => {})

    // 6. Trigger execution asynchronously
    if (input.autoStart !== false) {
      setImmediate(() => {
        this.processJob(job.id).catch((err) => {
          console.error(`[BulkDocumentService] Failed to process job ${job.id}:`, err)
        })
      })
    }

    return job
  }

  /**
   * Core execution engine for a bulk document job.
   * Renders each record's document, stores PDF files, registers Profile Documents,
   * creates the bundle ZIP, and updates real-time progress.
   */
  static async processJob(jobId: string) {
    const job = await db.bulkDocumentJob.findUnique({
      where: { id: jobId },
      include: {
        template: true,
      },
    })

    if (!job || job.status === 'COMPLETED' || job.status === 'CANCELLED') {
      return
    }

    // Set job to RUNNING
    await db.bulkDocumentJob.update({
      where: { id: jobId },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    })

    const templateDef = job.template?.content as unknown as TemplateDefinition
    if (!templateDef) {
      await db.bulkDocumentJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorMessage: 'Template content definition missing or invalid',
          completedAt: new Date(),
        },
      })
      return
    }

    // Setup storage directory
    const outputDir = path.join(process.cwd(), 'public', 'uploads', 'documents', job.tenantId, job.id)
    await fs.promises.mkdir(outputDir, { recursive: true })

    // Fetch pending items
    const items = await db.bulkDocumentJobItem.findMany({
      where: { jobId, status: { in: ['PENDING', 'PROCESSING'] } },
      orderBy: { createdAt: 'asc' },
    })

    let processedCount = 0
    let successCount = 0
    let failedCount = 0
    const zip = new JSZip()
    const successfulFiles: { filename: string; filePath: string }[] = []

    // Concurrency limit to prevent memory spikes
    const CONCURRENCY = 4
    for (let i = 0; i < items.length; i += CONCURRENCY) {
      // Check if job was cancelled mid-flight
      const currentJobState = await db.bulkDocumentJob.findUnique({
        where: { id: jobId },
        select: { status: true },
      })
      if (currentJobState?.status === 'CANCEL_REQUESTED' || currentJobState?.status === 'CANCELLED') {
        await db.bulkDocumentJob.update({
          where: { id: jobId },
          data: { status: 'CANCELLED', completedAt: new Date() },
        })
        return
      }

      const batch = items.slice(i, i + CONCURRENCY)

      await Promise.all(
        batch.map(async (item) => {
          try {
            await db.bulkDocumentJobItem.update({
              where: { id: item.id },
              data: { status: 'PROCESSING' },
            })

            // 1. Resolve live token data context
            const dataContext = await TemplateDataResolver.resolveDataContext(
              job.tenantId,
              job.documentType as DocumentType,
              item.entityId,
              item.entityType as any
            )

            // 2. Generate PDF
            const cleanIdentifier = item.identifier.replace(/[^a-zA-Z0-9_-]/g, '')
            const cleanName = item.entityName.replace(/[^a-zA-Z0-9_-]/g, '_')
            const docName = `${cleanIdentifier}_${cleanName}_${job.documentType}.pdf`
            const filePath = path.join(outputDir, docName)

            const pdfResult = await PdfService.generatePdf({
              definition: templateDef,
              dataContext,
              filename: docName,
            })

            await fs.promises.writeFile(filePath, pdfResult.buffer)

            const fileUrl = `/uploads/documents/${job.tenantId}/${job.id}/${docName}`

            // 3. Register or reuse GeneratedProfileDocument (Idempotent)
            let profileDoc = await db.generatedProfileDocument.findFirst({
              where: {
                tenantId: job.tenantId,
                jobId: job.id,
                entityType: item.entityType,
                studentId: item.entityType === 'STUDENT' ? item.entityId : null,
                staffProfileId: item.entityType === 'STAFF' ? item.entityId : null,
                deletedAt: null,
              },
            })

            if (profileDoc) {
              profileDoc = await db.generatedProfileDocument.update({
                where: { id: profileDoc.id },
                data: {
                  templateVersion: job.templateVersion,
                  documentType: job.documentType,
                  title: `${job.templateName} (${item.identifier})`,
                  fileName: docName,
                  fileUrl,
                  fileSizeBytes: pdfResult.sizeBytes,
                  mimeType: 'application/pdf',
                  metadata: {
                    jobTitle: job.title,
                    identifier: item.identifier,
                    entityName: item.entityName,
                    renderedAt: new Date().toISOString(),
                  },
                },
              })
            } else {
              profileDoc = await db.generatedProfileDocument.create({
                data: {
                  tenantId: job.tenantId,
                  branchId: job.branchId,
                  entityType: item.entityType,
                  studentId: item.entityType === 'STUDENT' ? item.entityId : null,
                  staffProfileId: item.entityType === 'STAFF' ? item.entityId : null,
                  jobId: job.id,
                  templateId: job.templateId,
                  templateVersion: job.templateVersion,
                  documentType: job.documentType,
                  title: `${job.templateName} (${item.identifier})`,
                  fileName: docName,
                  fileUrl,
                  fileSizeBytes: pdfResult.sizeBytes,
                  mimeType: 'application/pdf',
                  metadata: {
                    jobTitle: job.title,
                    identifier: item.identifier,
                    entityName: item.entityName,
                    renderedAt: new Date().toISOString(),
                  },
                  createdById: job.createdById,
                  createdByName: job.createdByName,
                },
              })
            }

            // 4. Update item status to SUCCESS
            await db.bulkDocumentJobItem.update({
              where: { id: item.id },
              data: {
                status: 'SUCCESS',
                documentId: profileDoc.id,
                fileUrl,
                errorMessage: null,
              },
            })

            zip.file(docName, pdfResult.buffer)
            successfulFiles.push({ filename: docName, filePath })
            successCount++
          } catch (err: any) {
            console.error(`[BulkDocumentService] Failed for item ${item.id}:`, err)
            await db.bulkDocumentJobItem.update({
              where: { id: item.id },
              data: {
                status: 'FAILED',
                errorMessage: err.message || 'PDF Generation failed',
              },
            })
            failedCount++
          } finally {
            processedCount++
          }
        })
      )

      // Periodic progress update
      await db.bulkDocumentJob.update({
        where: { id: jobId },
        data: {
          processedCount,
          successCount,
          failedCount,
        },
      })
    }

    // 5. Build ZIP Package if at least one file succeeded
    let zipUrl: string | null = null
    let zipSizeBytes: number | null = null

    if (successfulFiles.length > 0) {
      try {
        const zipBuffer = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        })

        const zipFilename = `documents-${job.documentType.toLowerCase().replace(/_/g, '-')}-${job.id.slice(0, 8)}.zip`
        const zipFilePath = path.join(outputDir, zipFilename)
        await fs.promises.writeFile(zipFilePath, zipBuffer)

        zipUrl = `/uploads/documents/${job.tenantId}/${job.id}/${zipFilename}`
        zipSizeBytes = zipBuffer.length
      } catch (zipErr) {
        console.error('[BulkDocumentService] Failed to generate ZIP archive:', zipErr)
      }
    }

    // 6. Set final job status
    let finalStatus = 'COMPLETED'
    if (failedCount > 0 && successCount > 0) {
      finalStatus = 'PARTIALLY_COMPLETED'
    } else if (failedCount > 0 && successCount === 0) {
      finalStatus = 'FAILED'
    }

    await db.bulkDocumentJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        processedCount,
        successCount,
        failedCount,
        zipUrl,
        zipSizeBytes,
        completedAt: new Date(),
      },
    })

    // 7. Audit completion
    await AuditService.recordSecurityEvent({
      action: 'DATA_EXPORT',
      entity: 'BulkDocumentJob',
      entityId: jobId,
      module: 'REPORTS',
      actorId: job.createdById,
      actorName: job.createdByName || 'System',
      actorRole: 'PRINCIPAL',
      tenantId: job.tenantId,
      summary: `Bulk document job "${job.title}" finished: ${successCount} succeeded, ${failedCount} failed (${finalStatus})`,
      severity: finalStatus === 'FAILED' ? 'WARNING' : 'INFO',
    }).catch(() => {})
  }

  /**
   * Retry failed items in a job.
   */
  static async retryFailed(tenantId: string, jobId: string, actorId: string, actorName?: string) {
    const job = await db.bulkDocumentJob.findFirst({
      where: { id: jobId, tenantId },
    })

    if (!job) throw new Error('Job not found')

    // Reset failed items
    const updatedItems = await db.bulkDocumentJobItem.updateMany({
      where: { jobId, tenantId, status: 'FAILED' },
      data: { status: 'PENDING', errorMessage: null },
    })

    if (updatedItems.count === 0) {
      throw new Error('No failed items to retry in this job')
    }

    // Set job back to QUEUED
    await db.bulkDocumentJob.update({
      where: { id: jobId },
      data: {
        status: 'QUEUED',
        errorMessage: null,
      },
    })

    await AuditService.recordSecurityEvent({
      action: 'DATA_EXPORT',
      entity: 'BulkDocumentJob',
      entityId: jobId,
      module: 'REPORTS',
      actorId,
      actorName: actorName || 'Admin',
      actorRole: 'PRINCIPAL',
      tenantId,
      summary: `Triggered retry for ${updatedItems.count} failed items in job "${job.title}"`,
      severity: 'INFO',
    }).catch(() => {})

    setImmediate(() => {
      this.processJob(jobId).catch((err) => {
        console.error(`[BulkDocumentService] Failed retry for job ${jobId}:`, err)
      })
    })

    return { retriedCount: updatedItems.count }
  }

  /**
   * Cancel an in-progress or queued job.
   */
  static async cancelJob(tenantId: string, jobId: string, actorId: string, actorName?: string) {
    const job = await db.bulkDocumentJob.findFirst({
      where: { id: jobId, tenantId },
    })

    if (!job) throw new Error('Job not found')

    if (job.status === 'COMPLETED' || job.status === 'FAILED') {
      throw new Error(`Cannot cancel a job that is already ${job.status}`)
    }

    await db.bulkDocumentJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED', completedAt: new Date() },
    })

    await db.bulkDocumentJobItem.updateMany({
      where: { jobId, tenantId, status: { in: ['PENDING', 'PROCESSING'] } },
      data: { status: 'SKIPPED', errorMessage: 'Job cancelled by user' },
    })

    await AuditService.recordSecurityEvent({
      action: 'DATA_EXPORT',
      entity: 'BulkDocumentJob',
      entityId: jobId,
      module: 'REPORTS',
      actorId,
      actorName: actorName || 'Admin',
      actorRole: 'PRINCIPAL',
      tenantId,
      summary: `Cancelled bulk document job "${job.title}"`,
      severity: 'WARNING',
    }).catch(() => {})

    return { success: true }
  }

  /**
   * List generated documents for an entity's profile library (Student or Staff).
   */
  static async listEntityDocuments(
    tenantId: string,
    entityType: 'STUDENT' | 'STAFF',
    entityId: string
  ) {
    const where: any = {
      tenantId,
      entityType,
      deletedAt: null,
    }

    if (entityType === 'STUDENT') {
      where.studentId = entityId
    } else {
      where.staffProfileId = entityId
    }

    const docs = await db.generatedProfileDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { id: true, title: true, createdAt: true } },
      },
    })

    return docs
  }

  /**
   * Delete a single generated document from profile library.
   */
  static async deleteDocument(
    tenantId: string,
    documentId: string,
    actorId: string,
    actorName?: string
  ) {
    const doc = await db.generatedProfileDocument.findFirst({
      where: { id: documentId, tenantId, deletedAt: null },
    })

    if (!doc) throw new Error('Document not found or already deleted')

    // Soft delete
    await db.generatedProfileDocument.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    })

    // Remove file from disk if present
    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/')) {
      const absPath = path.join(process.cwd(), 'public', doc.fileUrl)
      if (fs.existsSync(absPath)) {
        try {
          await fs.promises.unlink(absPath)
        } catch {
          // Non-blocking file unlink
        }
      }
    }

    await AuditService.recordSecurityEvent({
      action: 'DATA_EXPORT',
      entity: 'GeneratedProfileDocument',
      entityId: documentId,
      module: 'DOCUMENTS',
      actorId,
      actorName: actorName || 'User',
      actorRole: 'PRINCIPAL',
      tenantId,
      summary: `Deleted generated document "${doc.title}"`,
      severity: 'INFO',
    }).catch(() => {})

    return { success: true }
  }

  /**
   * Get an authorized document for viewing or downloading.
   * Enforces multi-tenant isolation, role permissions, and guardian child linking.
   */
  static async getDocumentForAccess(
    tenantId: string,
    documentId: string,
    session: any
  ) {
    const doc = await db.generatedProfileDocument.findFirst({
      where: {
        id: documentId,
        deletedAt: null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            guardians: {
              where: { guardian: { deletedAt: null } },
              select: {
                guardian: {
                  select: { userId: true },
                },
              },
            },
          },
        },
        staffProfile: {
          select: {
            id: true,
            userId: true,
            user: { select: { fullName: true, email: true } },
          },
        },
      },
    })

    if (!doc) {
      throw new Error('Document not found')
    }

    // Tenant check
    if (session.role !== 'PLATFORM_ADMIN' && doc.tenantId !== tenantId) {
      throw new Error('Unauthorized cross-tenant access')
    }

    // Authorization check
    const roles: string[] = session.roles && session.roles.length > 0 ? session.roles : [session.role]
    const isOwnerOrAdmin = session.role === 'PLATFORM_ADMIN' || session.role === 'OWNER' || session.role === 'PRINCIPAL'
    let authorized = isOwnerOrAdmin

    if (!authorized) {
      if (doc.entityType === 'STUDENT') {
        const canReadStudents = roles.some((r: string) =>
          ['COORDINATOR', 'TEACHER', 'ACCOUNTS', 'RECEPTIONIST'].includes(r)
        )
        if (canReadStudents) {
          authorized = true
        } else {
          // Check guardian linking
          const isLinkedGuardian = doc.student?.guardians.some(
            (g) => g.guardian?.userId === session.uid
          )
          if (isLinkedGuardian) {
            // Guard: Guardians may ONLY access report card documents that are PUBLISHED
            if (doc.documentType === 'REPORT_CARD') {
              const linkedRc = await db.studentReportCard.findFirst({
                where: {
                  tenantId,
                  documentId: doc.id,
                },
                select: { status: true },
              })
              if (linkedRc && linkedRc.status !== 'PUBLISHED') {
                throw new Error('This report card is not yet published')
              }
            }
            authorized = true
          }
        }
      } else if (doc.entityType === 'STAFF') {
        const canReadStaff = roles.some((r: string) =>
          ['COORDINATOR', 'ACCOUNTS'].includes(r)
        )
        if (canReadStaff) {
          authorized = true
        } else if (doc.staffProfile?.userId === session.uid) {
          // Own staff profile document
          authorized = true
        }
      }
    }

    if (!authorized) {
      throw new Error('You do not have permission to access this document')
    }

    // Resolve file on disk
    let relativePath = doc.fileUrl
    if (relativePath.startsWith('/')) {
      relativePath = relativePath.slice(1)
    }
    const absPath = path.join(process.cwd(), 'public', relativePath)

    if (!fs.existsSync(absPath)) {
      throw new Error('Document file is missing from storage')
    }

    const fileBuffer = await fs.promises.readFile(absPath)

    return {
      doc,
      absPath,
      fileBuffer,
      fileName: doc.fileName || `${doc.title}.pdf`,
      mimeType: doc.mimeType || 'application/pdf',
      fileSizeBytes: doc.fileSizeBytes || fileBuffer.length,
    }
  }
}

