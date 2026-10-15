import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { recordAudit } from '@/lib/audit'

export interface AvailableAlternate {
  guardianId: string
  userId: string | null
  fullName: string
  relationship: string
  phone: string
  email: string | null
}

export interface AffectedStudent {
  studentId: string
  studentName: string
  admissionNo: string
  hasAvailableAlternates: boolean
  availableAlternates: AvailableAlternate[]
}

export interface PrimaryContactTransfer {
  studentId: string
  fromGuardianId: string
  toGuardianId: string
}

export interface CheckPrimaryContactGuardParams {
  tenantId: string
  userId: string // user.id, tenantUser.id, or guardian.id
  targetStatus?: string
  action?: string
  isExplicitPrimaryRevocation?: boolean
  alternateGuardianId?: string
  alternateUserId?: string
  nominateAlternateId?: string
  alternateGuardiansByStudent?: Record<string, string>
  tx?: Prisma.TransactionClient
}

export interface SafetyCheckResult {
  safe: boolean
  isPrimary: boolean
  error?: string
  code?: string
  affectedStudents: AffectedStudent[]
  transfers: PrimaryContactTransfer[]
}

export class PrimaryContactGuard {
  /**
   * Evaluates if deactivating, suspending, deleting, or revoking primary status
   * from a user/guardian would leave any active student without an active primary contact.
   */
  static async checkDeactivationSafety(
    params: CheckPrimaryContactGuardParams
  ): Promise<SafetyCheckResult> {
    const {
      tenantId,
      userId,
      alternateGuardianId,
      alternateUserId,
      nominateAlternateId,
      alternateGuardiansByStudent,
      tx,
    } = params

    const client = tx || db

    // 1. Locate the Guardian record in this tenant
    const guardian = await client.guardian.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { id: userId },
          { userId: userId },
          { user: { memberships: { some: { id: userId, tenantId } } } },
        ],
      },
      include: {
        studentLinks: {
          include: {
            student: {
              include: {
                guardians: {
                  where: {
                    guardian: {
                      deletedAt: null,
                    },
                  },
                  include: {
                    guardian: {
                      include: {
                        user: {
                          include: {
                            memberships: {
                              where: { tenantId, deletedAt: null },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // If target user is not a guardian in this tenant, guard passes
    if (!guardian) {
      return {
        safe: true,
        isPrimary: false,
        affectedStudents: [],
        transfers: [],
      }
    }

    // 2. Filter for currently enrolled active students
    const activeStudentLinks = guardian.studentLinks.filter(
      (sl) => sl.student && sl.student.deletedAt === null && sl.student.status === 'ACTIVE'
    )

    if (activeStudentLinks.length === 0) {
      return {
        safe: true,
        isPrimary: false,
        affectedStudents: [],
        transfers: [],
      }
    }

    const unresolvedStudents: AffectedStudent[] = []
    const transfers: PrimaryContactTransfer[] = []

    // Global nomination fallback if passed
    const globalNominatedId = (
      alternateGuardianId ||
      alternateUserId ||
      nominateAlternateId ||
      ''
    ).trim()

    // 3. Evaluate each active student link
    for (const link of activeStudentLinks) {
      const student = link.student

      // All other non-deleted guardian links for this student
      const otherLinks = (student.guardians || []).filter(
        (sg) => sg.guardianId !== guardian.id && sg.guardian && sg.guardian.deletedAt === null
      )

      // Filter other guardians to active accounts/contacts
      const availableAlternates: AvailableAlternate[] = []
      for (const sg of otherLinks) {
        const g = sg.guardian
        if (!g) continue

        // If guardian has an associated portal user, verify active tenant membership
        if (g.user) {
          const activeMembership = (g.user.memberships || []).find(
            (m) => m.status === 'ACTIVE' && m.deletedAt === null
          )
          if (!activeMembership) {
            continue
          }
        }

        availableAlternates.push({
          guardianId: g.id,
          userId: g.userId || null,
          fullName: g.fullName,
          relationship: (sg.relationship as string) || (g.relationship as string) || 'GUARDIAN',
          phone: g.phone,
          email: g.email || null,
        })
      }

      const isLinkPrimary = Boolean(link.isPrimary)
      const isProfilePrimary = Boolean(guardian.isPrimaryContact)
      const isSoleGuardian = availableAlternates.length === 0

      // Guardian is considered primary for this student if:
      // - link.isPrimary is true, OR
      // - guardian.isPrimaryContact is true, OR
      // - guardian is the sole available active guardian for this student
      const requiresPrimaryGuard = isLinkPrimary || isProfilePrimary || isSoleGuardian

      if (!requiresPrimaryGuard) {
        // This guardian is purely secondary for this student; no nomination needed for this student
        continue
      }

      // 4. Check if an alternate is nominated for this student
      const nominatedForThisStudent = (
        (alternateGuardiansByStudent && alternateGuardiansByStudent[student.id]) ||
        globalNominatedId
      ).trim()

      const matchedAlternate = availableAlternates.find(
        (alt) =>
          alt.guardianId === nominatedForThisStudent ||
          (alt.userId && alt.userId === nominatedForThisStudent)
      )

      if (matchedAlternate) {
        transfers.push({
          studentId: student.id,
          fromGuardianId: guardian.id,
          toGuardianId: matchedAlternate.guardianId,
        })
      } else {
        unresolvedStudents.push({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
          admissionNo: student.admissionNo,
          hasAvailableAlternates: availableAlternates.length > 0,
          availableAlternates,
        })
      }
    }

    // 5. If any student is left without a primary contact
    if (unresolvedStudents.length > 0) {
      const orphanStudent = unresolvedStudents.find((s) => !s.hasAvailableAlternates)
      let errorMessage = 'Cannot deactivate primary contact without nominating an alternate contact.'
      if (orphanStudent) {
        errorMessage = `Cannot deactivate primary contact without nominating an alternate contact. Student ${orphanStudent.studentName} (${orphanStudent.admissionNo}) has no other registered active guardians. Please register an alternate guardian first.`
      } else {
        errorMessage = `Cannot deactivate primary contact without nominating an alternate contact. Please nominate an alternate active guardian for affected student(s).`
      }

      return {
        safe: false,
        isPrimary: true,
        error: errorMessage,
        code: 'PRIMARY_CONTACT_DEACTIVATION_BLOCKED',
        affectedStudents: unresolvedStudents,
        transfers: [],
      }
    }

    return {
      safe: true,
      isPrimary: transfers.length > 0,
      affectedStudents: [],
      transfers,
    }
  }

  /**
   * Atomically executes the primary contact transfers inside a Prisma transaction.
   */
  static async applyTransfersTx(
    tx: Prisma.TransactionClient,
    transfers: PrimaryContactTransfer[],
    actorSession?: { uid: string; name: string; role: string; tenantId?: string | null }
  ): Promise<void> {
    if (!transfers || transfers.length === 0) return

    for (const t of transfers) {
      // 1. Demote previous primary contact on student link
      await tx.studentGuardian.update({
        where: {
          studentId_guardianId: {
            studentId: t.studentId,
            guardianId: t.fromGuardianId,
          },
        },
        data: {
          isPrimary: false,
        },
      })

      // 2. Promote target guardian to primary contact on student link
      await tx.studentGuardian.update({
        where: {
          studentId_guardianId: {
            studentId: t.studentId,
            guardianId: t.toGuardianId,
          },
        },
        data: {
          isPrimary: true,
          receivesComm: true,
        },
      })

      // 3. Ensure target guardian's profile has isPrimaryContact: true
      await tx.guardian.update({
        where: { id: t.toGuardianId },
        data: { isPrimaryContact: true },
      })
    }

    // 4. For fromGuardian, check if they remain primary contact for any other students
    const uniqueFromGuardianIds = [...new Set(transfers.map((t) => t.fromGuardianId))]
    for (const fromGid of uniqueFromGuardianIds) {
      const remainingPrimaryCount = await tx.studentGuardian.count({
        where: {
          guardianId: fromGid,
          isPrimary: true,
        },
      })

      if (remainingPrimaryCount === 0) {
        await tx.guardian.update({
          where: { id: fromGid },
          data: { isPrimaryContact: false },
        })
      }
    }

    // 5. Audit record
    if (actorSession && actorSession.tenantId) {
      for (const t of transfers) {
        await recordAudit({
          tenantId: actorSession.tenantId,
          actorId: actorSession.uid,
          actorName: actorSession.name,
          actorRole: actorSession.role,
          action: 'PRIMARY_CONTACT_TRANSFERRED',
          entity: 'StudentGuardian',
          entityId: t.studentId,
          module: 'FAMILY',
          severity: 'INFO',
          summary: `Transferred primary contact for student from guardian ${t.fromGuardianId} to ${t.toGuardianId}`,
          newValues: {
            studentId: t.studentId,
            previousPrimaryGuardianId: t.fromGuardianId,
            newPrimaryGuardianId: t.toGuardianId,
          },
        })
      }
    }
  }

  /**
   * Helper to check student unlink safety before unlinking a guardian from a student.
   */
  static async checkStudentUnlinkSafety(params: {
    tenantId: string
    studentId: string
    guardianId: string
    alternateGuardianId?: string
    tx?: Prisma.TransactionClient
  }): Promise<{
    safe: boolean
    error?: string
    code?: string
    affectedStudents: AffectedStudent[]
    transfers: PrimaryContactTransfer[]
  }> {
    const { tenantId, studentId, guardianId, alternateGuardianId, tx } = params
    const client = tx || db

    const student = await client.student.findFirst({
      where: { id: studentId, tenantId, deletedAt: null },
      include: {
        guardians: {
          where: { guardian: { deletedAt: null } },
          include: {
            guardian: {
              include: {
                user: {
                  include: {
                    memberships: {
                      where: { tenantId, deletedAt: null },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!student) {
      return { safe: true, affectedStudents: [], transfers: [] }
    }

    const currentLink = student.guardians.find((sg) => sg.guardianId === guardianId)
    if (!currentLink) {
      return { safe: true, affectedStudents: [], transfers: [] }
    }

    const otherLinks = student.guardians.filter((sg) => sg.guardianId !== guardianId)
    const availableAlternates: AvailableAlternate[] = []
    for (const sg of otherLinks) {
      const g = sg.guardian
      if (!g) continue
      if (g.user) {
        const hasActive = (g.user.memberships || []).some(
          (m) => m.status === 'ACTIVE' && m.deletedAt === null
        )
        if (!hasActive) continue
      }
      availableAlternates.push({
        guardianId: g.id,
        userId: g.userId || null,
        fullName: g.fullName,
        relationship: (sg.relationship as string) || (g.relationship as string) || 'GUARDIAN',
        phone: g.phone,
        email: g.email || null,
      })
    }

    const isPrimary = currentLink.isPrimary || currentLink.guardian.isPrimaryContact
    const isSole = availableAlternates.length === 0

    if (!isPrimary && !isSole) {
      return { safe: true, affectedStudents: [], transfers: [] }
    }

    const nominated = (alternateGuardianId || '').trim()
    const matched = availableAlternates.find(
      (alt) => alt.guardianId === nominated || (alt.userId && alt.userId === nominated)
    )

    if (matched) {
      return {
        safe: true,
        affectedStudents: [],
        transfers: [
          {
            studentId: student.id,
            fromGuardianId: guardianId,
            toGuardianId: matched.guardianId,
          },
        ],
      }
    }

    const affected: AffectedStudent[] = [
      {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName || ''}`.trim(),
        admissionNo: student.admissionNo,
        hasAvailableAlternates: availableAlternates.length > 0,
        availableAlternates,
      },
    ]

    return {
      safe: false,
      error:
        availableAlternates.length === 0
          ? `Cannot unlink sole guardian for student ${student.firstName} (${student.admissionNo}). Please register an alternate guardian first.`
          : `Cannot unlink primary contact without nominating an alternate contact for student ${student.firstName}.`,
      code: 'PRIMARY_CONTACT_DEACTIVATION_BLOCKED',
      affectedStudents: affected,
      transfers: [],
    }
  }
}
