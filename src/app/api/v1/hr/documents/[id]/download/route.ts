import { withApi } from '@/lib/with-api'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Errors } from '@/lib/api'
import { requireApi, isResponse } from '@/lib/auth-api'
import fs from 'fs'
import path from 'path'

async function _GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireApi(req)
  if (isResponse(session)) return session
  if (!session.tenantId) return Errors.forbidden('No tenant context')

  try {
    const { id } = await params
    const doc = await db.staffDocument.findFirst({
      where: {
        id,
        tenantId: session.tenantId,
      },
      include: {
        staffProfile: { select: { userId: true } },
      },
    })

    if (!doc) {
      return Errors.notFound('Staff document not found')
    }

    // Access Control: Self or Authorized HR Manager
    const isSelf = doc.staffProfile.userId === session.userId
    const isHRAuthorized = session.roles ? session.roles.some((r: string) => ['ADMIN', 'PRINCIPAL', 'HR_MANAGER'].includes(r)) : false

    if (!isSelf && !isHRAuthorized) {
      return Errors.forbidden('Unauthorized access to staff document')
    }

    // Serve file from storage
    const relativePath = doc.fileUrl.replace('/uploads/documents/staff/', '')
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'documents', 'staff', path.normalize(relativePath))

    if (!fs.existsSync(filePath)) {
      return Errors.notFound('Document file not found on server storage')
    }

    const fileBuffer = await fs.promises.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    
    let contentType = 'application/octet-stream'
    if (ext === '.pdf') contentType = 'application/pdf'
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
    else if (ext === '.png') contentType = 'image/png'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${doc.fileName || 'document'}${ext}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (e: any) {
    return Errors.system(e)
  }
}

export const GET = withApi(_GET)
