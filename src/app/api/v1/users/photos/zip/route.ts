import { NextRequest } from 'next/server'
import JSZip from 'jszip'
import { ok, bad, errAuth } from '@/lib/api'
import { withApi } from '@/lib/with-api'
import { requireApi, isResponse } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { saveUserProfilePhoto, deleteUserProfilePhoto } from '@/lib/storage'
import { recordAudit, getRequestMeta } from '@/lib/audit'

const MAX_ZIP_SIZE = 50 * 1024 * 1024 // 50MB
const MAX_TOTAL_EXTRACTED_SIZE = 150 * 1024 * 1024 // 150MB
const MAX_FILE_COUNT = 500
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp']

export interface ZipPhotoItem {
  fileName: string
  identifier: string // e.g. EMP-2026-001 or rahul01
  status: 'MATCHED' | 'UNMATCHED' | 'INVALID_FORMAT'
  action: 'ADD' | 'REPLACE' | 'SKIP'
  userId?: string
  userName?: string
  role?: string
  currentPhotoUrl?: string | null
  reason?: string
}

/**
 * POST /api/v1/users/photos/zip
 * Supports two modes:
 * 1. action='preview' (validates ZIP, matches against employeeCode/username/email, returns diff)
 * 2. action='execute' (extracts matched files and durably stores photos)
 */
export const POST = withApi(async (req: NextRequest) => {
  const session = await requireApi(req, 'users:write')
  if (isResponse(session)) return session
  if (!session.tenantId) throw errAuth('Tenant required')

  const formData = await req.formData()
  const file = formData.get('zip') as File | null
  const mode = (formData.get('mode') as string) || 'preview' // 'preview' | 'execute'

  if (!file || !(file instanceof File)) {
    return bad('Please upload a valid .zip archive file', 'ZIP_REQUIRED')
  }

  if (file.size > MAX_ZIP_SIZE) {
    return bad('ZIP archive exceeds maximum size limit of 50MB', 'ZIP_TOO_LARGE')
  }

  const arrayBuffer = await file.arrayBuffer()
  const zip = new JSZip()
  let loadedZip: JSZip

  try {
    loadedZip = await zip.loadAsync(arrayBuffer)
  } catch (err: any) {
    return bad('Failed to parse ZIP archive. Ensure file is not corrupted.', 'INVALID_ZIP')
  }

  // Pre-load all tenant users with staffProfiles for matching
  const tenantMembers = await db.tenantUser.findMany({
    where: {
      tenantId: session.tenantId,
      deletedAt: null,
    },
    include: {
      user: {
        include: {
          staffProfile: true,
        },
      },
    },
  })

  // Build lookup maps for employeeCode, username, and email
  const codeToUser = new Map<string, (typeof tenantMembers)[number]>()
  const usernameToUser = new Map<string, (typeof tenantMembers)[number]>()
  const emailToUser = new Map<string, (typeof tenantMembers)[number]>()

  for (const m of tenantMembers) {
    if (m.user.staffProfile?.employeeCode) {
      codeToUser.set(m.user.staffProfile.employeeCode.toUpperCase().trim(), m)
    }
    if (m.user.username) {
      usernameToUser.set(m.user.username.toLowerCase().trim(), m)
    }
    if (m.user.email) {
      emailToUser.set(m.user.email.toLowerCase().trim(), m)
    }
  }

  let totalExtractedSize = 0
  let fileCount = 0
  const items: ZipPhotoItem[] = []
  const filesToProcess: { item: ZipPhotoItem; fileData: JSZip.JSZipObject }[] = []

  const zipEntries = Object.entries(loadedZip.files)
  if (zipEntries.length > MAX_FILE_COUNT) {
    return bad(`ZIP contains too many files (${zipEntries.length}). Maximum allowed is ${MAX_FILE_COUNT}.`, 'TOO_MANY_FILES')
  }

  for (const [relativePath, zipEntry] of zipEntries) {
    if (zipEntry.dir) continue

    // Path traversal protection: ensure filename has no ../ or absolute references
    const cleanFileName = relativePath.split('/').pop() || ''
    if (!cleanFileName || cleanFileName.includes('..') || cleanFileName.startsWith('/') || cleanFileName.startsWith('\\')) {
      continue
    }

    // Ignore hidden files (e.g. __MACOSX, .DS_Store)
    if (cleanFileName.startsWith('.') || relativePath.startsWith('__MACOSX')) {
      continue
    }

    fileCount++
    const dotIndex = cleanFileName.lastIndexOf('.')
    if (dotIndex === -1) {
      items.push({
        fileName: cleanFileName,
        identifier: cleanFileName,
        status: 'INVALID_FORMAT',
        action: 'SKIP',
        reason: 'Missing file extension',
      })
      continue
    }

    const baseName = cleanFileName.slice(0, dotIndex).trim()
    const ext = cleanFileName.slice(dotIndex).toLowerCase()

    if (!ALLOWED_IMAGE_EXTS.includes(ext)) {
      items.push({
        fileName: cleanFileName,
        identifier: baseName,
        status: 'INVALID_FORMAT',
        action: 'SKIP',
        reason: `Unsupported extension "${ext}". Allowed: jpg, png, webp`,
      })
      continue
    }

    // Attempt matching: 1) Employee Code, 2) Username, 3) Email
    const matchedMember =
      codeToUser.get(baseName.toUpperCase()) ||
      usernameToUser.get(baseName.toLowerCase()) ||
      emailToUser.get(baseName.toLowerCase())

    if (matchedMember) {
      const hasExistingPhoto = Boolean(matchedMember.user.avatarUrl)
      const item: ZipPhotoItem = {
        fileName: cleanFileName,
        identifier: baseName,
        status: 'MATCHED',
        action: hasExistingPhoto ? 'REPLACE' : 'ADD',
        userId: matchedMember.userId,
        userName: matchedMember.user.fullName,
        role: matchedMember.role,
        currentPhotoUrl: matchedMember.user.avatarUrl,
      }
      items.push(item)
      filesToProcess.push({ item, fileData: zipEntry })
    } else {
      items.push({
        fileName: cleanFileName,
        identifier: baseName,
        status: 'UNMATCHED',
        action: 'SKIP',
        reason: `No user found with identifier "${baseName}"`,
      })
    }
  }

  const matchedCount = items.filter((i) => i.status === 'MATCHED').length
  const replaceCount = items.filter((i) => i.action === 'REPLACE').length
  const addCount = items.filter((i) => i.action === 'ADD').length
  const unmatchedCount = items.filter((i) => i.status === 'UNMATCHED').length
  const invalidCount = items.filter((i) => i.status === 'INVALID_FORMAT').length

  // PREVIEW MODE: Return review summary and detailed items
  if (mode === 'preview') {
    return ok({
      success: true,
      mode: 'preview',
      totalFiles: fileCount,
      matched: matchedCount,
      toAdd: addCount,
      toReplace: replaceCount,
      unmatched: unmatchedCount,
      invalid: invalidCount,
      items,
    })
  }

  // EXECUTE MODE: Extract files and update database
  let uploadedCount = 0
  let replacedSuccessCount = 0
  let failedCount = 0

  for (const { item, fileData } of filesToProcess) {
    if (!item.userId) continue

    try {
      const buffer = await fileData.async('nodebuffer')
      totalExtractedSize += buffer.length

      if (totalExtractedSize > MAX_TOTAL_EXTRACTED_SIZE) {
        throw new Error('Total extracted size exceeded safe limit of 150MB')
      }

      const mimeType = item.fileName.endsWith('.png')
        ? 'image/png'
        : item.fileName.endsWith('.webp')
        ? 'image/webp'
        : 'image/jpeg'

      const saved = await saveUserProfilePhoto({
        tenantId: session.tenantId,
        userId: item.userId,
        buffer,
        mimeType,
        originalName: item.fileName,
      })

      // If replacing, clean up old photo
      if (item.currentPhotoUrl) {
        await deleteUserProfilePhoto(item.currentPhotoUrl)
        replacedSuccessCount++
      } else {
        uploadedCount++
      }

      await db.user.update({
        where: { id: item.userId },
        data: { avatarUrl: saved.url },
      })
    } catch (err: any) {
      failedCount++
      item.reason = err.message || 'Failed to save photo'
    }
  }

  const meta = getRequestMeta(req)
  await recordAudit({
    tenantId: session.tenantId,
    actorId: session.userId,
    actorName: session.fullName || 'Admin',
    actorRole: session.role,
    action: 'BULK_PHOTOS_UPLOADED',
    entity: 'User',
    entityId: session.tenantId,
    module: 'USERS',
    summary: `Bulk photo upload completed: ${uploadedCount} added, ${replacedSuccessCount} replaced, ${unmatchedCount} unmatched.`,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    newValues: {
      totalFiles: fileCount,
      uploadedCount,
      replacedSuccessCount,
      failedCount,
      unmatchedCount,
    },
  })

  return ok({
    success: true,
    mode: 'execute',
    totalFiles: fileCount,
    uploaded: uploadedCount,
    replaced: replacedSuccessCount,
    failed: failedCount,
    unmatched: unmatchedCount,
    items,
  })
})
