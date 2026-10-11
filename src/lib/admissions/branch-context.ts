/**
 * PreOne — Canonical Admissions Branch Context & Scoping Helper
 *
 * Implements authoritative tenant & branch isolation for multi-branch preschool operators:
 * - ALL_BRANCHES sentinel (ALL_BRANCHES_ID = '__ALL_BRANCHES__')
 * - Server-side resolution of authorized branches per session & role
 * - Enforcing single-branch scope vs multi-branch authorization
 * - Strict tenant boundary validation
 */

import { db } from '@/lib/db'
import type { SessionPayload, Role } from '@/lib/auth'
import { isInstitutionWide } from '@/lib/security/resource-scope'

export const ALL_BRANCHES_ID = '__ALL_BRANCHES__'

export type BranchContextMode = 'ALL_BRANCHES' | 'SINGLE_BRANCH' | 'NO_BRANCH_ACCESS'

export interface ResolvedBranchScope {
  tenantId: string
  mode: BranchContextMode
  selectedBranchId: string | null // Specific branch ID if SINGLE_BRANCH, null if ALL_BRANCHES
  authorizedBranchIds: string[] // List of database branch IDs the user is authorized to read
  branches: Array<{
    id: string
    name: string
    code: string
    isMain: boolean
    isActive: boolean
  }>
  isMultiBranchAuthorized: boolean
}

/**
 * Resolves the authenticated user's allowed branch IDs directly from database and session.
 * Never trusts client-supplied branch lists or claims.
 */
export async function resolveAuthorizedBranchScope(
  session: SessionPayload,
  requestedBranchId?: string | null
): Promise<ResolvedBranchScope> {
  if (!session.tenantId) {
    throw new Error('Tenant context is required')
  }

  const tenantId = session.tenantId
  const canAccessAll = isInstitutionWide(session)

  // Fetch all active branches for this tenant from database
  const allTenantBranches = await db.branch.findMany({
    where: { tenantId, deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      code: true,
      isMain: true,
      isActive: true,
    },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  })

  if (allTenantBranches.length === 0) {
    return {
      tenantId,
      mode: 'NO_BRANCH_ACCESS',
      selectedBranchId: null,
      authorizedBranchIds: [],
      branches: [],
      isMultiBranchAuthorized: false,
    }
  }

  // Derive user's authorized branch list
  let authorizedBranches = allTenantBranches
  if (!canAccessAll) {
    if (!session.branchId) {
      return {
        tenantId,
        mode: 'NO_BRANCH_ACCESS',
        selectedBranchId: null,
        authorizedBranchIds: [],
        branches: [],
        isMultiBranchAuthorized: false,
      }
    }
    authorizedBranches = allTenantBranches.filter((b) => b.id === session.branchId)
    if (authorizedBranches.length === 0) {
      return {
        tenantId,
        mode: 'NO_BRANCH_ACCESS',
        selectedBranchId: null,
        authorizedBranchIds: [],
        branches: [],
        isMultiBranchAuthorized: false,
      }
    }
  }

  const authorizedBranchIds = authorizedBranches.map((b) => b.id)
  const isMultiBranchAuthorized = canAccessAll && authorizedBranches.length > 1

  // Handle branch selection
  const cleanReq = requestedBranchId?.trim()

  if (cleanReq === ALL_BRANCHES_ID || cleanReq === 'all') {
    if (!isMultiBranchAuthorized) {
      // Single branch user cannot select All Branches — fallback safely to their assigned branch
      return {
        tenantId,
        mode: 'SINGLE_BRANCH',
        selectedBranchId: authorizedBranchIds[0],
        authorizedBranchIds,
        branches: authorizedBranches,
        isMultiBranchAuthorized: false,
      }
    }

    return {
      tenantId,
      mode: 'ALL_BRANCHES',
      selectedBranchId: null,
      authorizedBranchIds,
      branches: authorizedBranches,
      isMultiBranchAuthorized: true,
    }
  }

  if (cleanReq && authorizedBranchIds.includes(cleanReq)) {
    return {
      tenantId,
      mode: 'SINGLE_BRANCH',
      selectedBranchId: cleanReq,
      authorizedBranchIds,
      branches: authorizedBranches,
      isMultiBranchAuthorized,
    }
  }

  if (cleanReq && !authorizedBranchIds.includes(cleanReq)) {
    throw new Error('Unauthorized: requested branch does not belong to your authorized school scope')
  }

  // Default selection if no specific branch requested:
  // If user can access all branches and more than 1 exists, default to ALL_BRANCHES for complete multi-campus visibility
  // Otherwise default to main branch or first authorized branch
  const mainBranch = authorizedBranches.find((b) => b.isMain) || authorizedBranches[0]

  return {
    tenantId,
    mode: isMultiBranchAuthorized ? 'ALL_BRANCHES' : 'SINGLE_BRANCH',
    selectedBranchId: isMultiBranchAuthorized ? null : mainBranch.id,
    authorizedBranchIds,
    branches: authorizedBranches,
    isMultiBranchAuthorized,
  }
}
