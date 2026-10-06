import fs from 'fs'
import path from 'path'
import { db } from '@/lib/db'
import { recordAudit } from '@/lib/audit'
import { UsernameService } from './username-service'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars')
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface PhotoUploadResult {
  filename: string
  status: 'SUCCESS' | 'FAILED'
  userId?: string
  matchedIdentifier?: string
  avatarUrl?: string
  reason?: string
}

export class UserPhotoService {
  /**
   * Ensures the local storage directory exists.
   */
  private static ensureUploadDirectory() {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true })
    }
  }

  /**
   * Validates file buffer, mime type, and file size.
   */
  static validateImage(mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      return { valid: false, error: `Unsupported format: ${mimeType}. Allowed formats: JPG, PNG, WEBP` }
    }
    if (sizeBytes > MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds 5MB limit (${(sizeBytes / 1024 / 1024).toFixed(2)}MB)` }
    }
    return { valid: true }
  }

  /**
   * Saves a single user photo to local storage and updates User.avatarUrl in database.
   */
  static async saveSingleUserPhoto(params: {
    userId: string
    tenantId: string
    fileBuffer: Buffer
    mimeType: string
    originalFilename: string
    actor: { id: string; name: string; role: string; ipAddress?: string; userAgent?: string }
  }): Promise<{ success: boolean; avatarUrl: string }> {
    this.ensureUploadDirectory()

    const ext = path.extname(params.originalFilename).toLowerCase() || '.png'
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.png'
    const fileName = `avatar-${params.userId}-${Date.now()}${safeExt}`
    const filePath = path.join(UPLOAD_DIR, fileName)
    const avatarUrl = `/uploads/avatars/${fileName}`

    // 1. Fetch user to verify tenant membership and clean up old avatar file
    const member = await db.tenantUser.findFirst({
      where: { tenantId: params.tenantId, userId: params.userId, deletedAt: null },
      include: { user: { select: { avatarUrl: true, fullName: true } } },
    })

    if (!member) {
      throw new Error('User not found in this school context')
    }

    // 2. Remove old photo if stored in /uploads/avatars/
    if (member.user.avatarUrl && member.user.avatarUrl.startsWith('/uploads/avatars/')) {
      const oldFilename = path.basename(member.user.avatarUrl)
      const oldPath = path.join(UPLOAD_DIR, oldFilename)
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath)
        } catch {
          // Non-blocking cleanup warning
        }
      }
    }

    // 3. Write new image buffer
    fs.writeFileSync(filePath, params.fileBuffer)

    // 4. Update database
    await db.user.update({
      where: { id: params.userId },
      data: { avatarUrl, updatedAt: new Date() },
    })

    // 5. Audit event
    await recordAudit({
      tenantId: params.tenantId,
      actorId: params.actor.id,
      actorName: params.actor.name,
      actorRole: params.actor.role,
      action: 'USER_PHOTO_UPLOADED',
      entity: 'User',
      entityId: params.userId,
      module: 'USERS',
      summary: `Uploaded profile photo for user ${member.user.fullName}`,
      ipAddress: params.actor.ipAddress,
      userAgent: params.actor.userAgent,
      newValues: { avatarUrl },
    })

    return { success: true, avatarUrl }
  }

  /**
   * Removes user photo from storage and database.
   */
  static async removeUserPhoto(params: {
    userId: string
    tenantId: string
    actor: { id: string; name: string; role: string; ipAddress?: string; userAgent?: string }
  }): Promise<{ success: boolean }> {
    const member = await db.tenantUser.findFirst({
      where: { tenantId: params.tenantId, userId: params.userId, deletedAt: null },
      include: { user: { select: { avatarUrl: true, fullName: true } } },
    })

    if (!member) {
      throw new Error('User not found in this school context')
    }

    if (member.user.avatarUrl && member.user.avatarUrl.startsWith('/uploads/avatars/')) {
      const filename = path.basename(member.user.avatarUrl)
      const filePath = path.join(UPLOAD_DIR, filename)
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
        } catch {
          // ignore
        }
      }
    }

    await db.user.update({
      where: { id: params.userId },
      data: { avatarUrl: null, updatedAt: new Date() },
    })

    await recordAudit({
      tenantId: params.tenantId,
      actorId: params.actor.id,
      actorName: params.actor.name,
      actorRole: params.actor.role,
      action: 'USER_PHOTO_REMOVED',
      entity: 'User',
      entityId: params.userId,
      module: 'USERS',
      summary: `Removed profile photo for user ${member.user.fullName}`,
      ipAddress: params.actor.ipAddress,
      userAgent: params.actor.userAgent,
    })

    return { success: true }
  }

  /**
   * Processes bulk user photo upload with matching strategy and comprehensive reporting.
   */
  static async processBulkUserPhotos(params: {
    tenantId: string
    files: Array<{ filename: string; mimeType: string; buffer: Buffer }>
    csvMapping?: Record<string, string> // photoFilename -> userIdentifier
    actor: { id: string; name: string; role: string; ipAddress?: string; userAgent?: string }
  }): Promise<{
    summary: { totalFiles: number; successful: number; failed: number }
    results: PhotoUploadResult[]
  }> {
    this.ensureUploadDirectory()

    const results: PhotoUploadResult[] = []
    let successfulCount = 0

    // Fetch all tenant users to build matching index
    const tenantMembers = await db.tenantUser.findMany({
      where: { tenantId: params.tenantId, deletedAt: null },
      include: {
        user: {
          include: {
            staffProfile: { select: { employeeCode: true } },
            guardianProfile: {
              include: {
                studentLinks: {
                  include: { student: { select: { admissionNo: true } } },
                },
              },
            },
          },
        },
      },
    })

    // Build lookup maps for tenant-isolated matching
    const userIdMap = new Map<string, string>() // userId -> userId
    const usernameMap = new Map<string, string>() // username -> userId
    const empCodeMap = new Map<string, string>() // employeeCode -> userId
    const admissionNoMap = new Map<string, string>() // student admissionNo -> guardian/user or student userId

    for (const m of tenantMembers) {
      userIdMap.set(m.userId.toLowerCase(), m.userId)
      if (m.user.username) {
        usernameMap.set(m.user.username.toLowerCase(), m.userId)
      }
      if (m.user.staffProfile?.employeeCode) {
        empCodeMap.set(m.user.staffProfile.employeeCode.toLowerCase(), m.userId)
      }
      if (m.user.guardianProfile) {
        for (const sl of m.user.guardianProfile.studentLinks) {
          if (sl.student?.admissionNo) {
            admissionNoMap.set(sl.student.admissionNo.toLowerCase(), m.userId)
          }
        }
      }
    }

    for (const f of params.files) {
      const filenameClean = path.basename(f.filename)
      const baseNameWithoutExt = path.parse(filenameClean).name.toLowerCase()

      // Validate file size & type
      const validation = this.validateImage(f.mimeType, f.buffer.length)
      if (!validation.valid) {
        results.push({
          filename: filenameClean,
          status: 'FAILED',
          reason: validation.error,
        })
        continue
      }

      // Determine matching user identifier
      let targetIdentifier = baseNameWithoutExt
      if (params.csvMapping && params.csvMapping[filenameClean]) {
        targetIdentifier = params.csvMapping[filenameClean].toLowerCase().trim()
      }

      // Resolve userId from index
      const matchedUserId =
        userIdMap.get(targetIdentifier) ||
        usernameMap.get(targetIdentifier) ||
        empCodeMap.get(targetIdentifier) ||
        admissionNoMap.get(targetIdentifier)

      if (!matchedUserId) {
        results.push({
          filename: filenameClean,
          status: 'FAILED',
          reason: `No matching user found in this school for identifier '${targetIdentifier}'`,
        })
        continue
      }

      try {
        const res = await this.saveSingleUserPhoto({
          userId: matchedUserId,
          tenantId: params.tenantId,
          fileBuffer: f.buffer,
          mimeType: f.mimeType,
          originalFilename: filenameClean,
          actor: params.actor,
        })

        successfulCount++
        results.push({
          filename: filenameClean,
          status: 'SUCCESS',
          userId: matchedUserId,
          matchedIdentifier: targetIdentifier,
          avatarUrl: res.avatarUrl,
        })
      } catch (err: any) {
        results.push({
          filename: filenameClean,
          status: 'FAILED',
          userId: matchedUserId,
          matchedIdentifier: targetIdentifier,
          reason: err.message || 'Storage error',
        })
      }
    }

    // Record bulk audit log
    await recordAudit({
      tenantId: params.tenantId,
      actorId: params.actor.id,
      actorName: params.actor.name,
      actorRole: params.actor.role,
      action: 'BULK_USER_PHOTOS_UPLOADED',
      entity: 'User',
      module: 'USERS',
      summary: `Bulk photo upload processed ${params.files.length} files (${successfulCount} succeeded, ${params.files.length - successfulCount} failed)`,
      ipAddress: params.actor.ipAddress,
      userAgent: params.actor.userAgent,
      newValues: {
        totalFiles: params.files.length,
        successfulCount,
        failedCount: params.files.length - successfulCount,
      },
    })

    return {
      summary: {
        totalFiles: params.files.length,
        successful: successfulCount,
        failed: params.files.length - successfulCount,
      },
      results,
    }
  }
}
