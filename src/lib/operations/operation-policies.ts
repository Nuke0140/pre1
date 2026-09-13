/**
 * PreOne — Operations Policy Layer
 *
 * Centralizes all business rules and policy thresholds:
 * - Arrival cutoff and late arrival determination
 * - Attendance marking escalation windows
 * - Pickup authorization and PIN verification
 * - Late pickup fee calculation and finance policy
 * - Health check symptom severity triage
 * - Incident escalation rules
 *
 * Dynamic values are resolved from SchoolConfig (OPERATING, DAILY_OPERATIONS,
 * HEALTH_SAFETY, STUDENT_PARENT, FINANCE) and Branch settings.
 */

import { getDomainConfig, getOperating, getDailyOps, getStudentParentConfig } from '@/lib/config'
import { db } from '@/lib/db'

export interface LatePickupCalculation {
  isLate: boolean
  pickupWindowEnd: string
  actualTime: string
  lateMinutes: number
  chargeRupees: number
  chargeCents: number
  policyNote: string
}

export class OperationPolicies {
  /**
   * Determine whether an arrival time is considered LATE based on Setup OPERATING configuration
   */
  static async evaluateArrivalStatus(
    tenantId: string,
    arrivalTime: Date = new Date()
  ): Promise<{ status: 'PRESENT' | 'LATE'; isLate: boolean; cutoffTime: string; rule: string }> {
    const opRaw = await getDomainConfig(tenantId, 'OPERATING')
    const opCfg = getOperating(opRaw)

    const cutoff = opCfg.arrivalWindowEnd || '09:30'
    const hours = String(arrivalTime.getHours()).padStart(2, '0')
    const minutes = String(arrivalTime.getMinutes()).padStart(2, '0')
    const currentHHMM = `${hours}:${minutes}`

    const isLate = currentHHMM > cutoff

    return {
      status: isLate ? 'LATE' : 'PRESENT',
      isLate,
      cutoffTime: cutoff,
      rule: opCfg.lateArrivalRule || `Arrivals after ${cutoff} are marked LATE.`,
    }
  }

  /**
   * Evaluate late pickup duration and calculate financial fee adjustment
   * Standard policy: configured grace period (default 15 mins), then ₹100 per 30 minutes.
   */
  static async calculateLatePickup(
    tenantId: string,
    pickupTime: Date = new Date()
  ): Promise<LatePickupCalculation> {
    const opRaw = await getDomainConfig(tenantId, 'OPERATING')
    const opCfg = getOperating(opRaw)

    const windowEnd = opCfg.pickupWindowEnd || '16:30'
    const [endHours, endMinutes] = windowEnd.split(':').map(Number)

    const pickupHours = pickupTime.getHours()
    const pickupMinutes = pickupTime.getMinutes()

    const windowEndTotalMinutes = endHours * 60 + endMinutes
    const pickupTotalMinutes = pickupHours * 60 + pickupMinutes

    const diffMinutes = pickupTotalMinutes - windowEndTotalMinutes

    // Grace period from config or 15 mins
    const graceMinutes = 15
    if (diffMinutes <= graceMinutes) {
      return {
        isLate: false,
        pickupWindowEnd: windowEnd,
        actualTime: `${String(pickupHours).padStart(2, '0')}:${String(pickupMinutes).padStart(2, '0')}`,
        lateMinutes: Math.max(0, diffMinutes),
        chargeRupees: 0,
        chargeCents: 0,
        policyNote: 'Within normal pickup window or grace period.',
      }
    }

    const billableMinutes = diffMinutes - graceMinutes
    const blocksOf30 = Math.ceil(billableMinutes / 30)
    const ratePerBlock = 100 // ₹100 per 30 minutes
    const chargeRupees = blocksOf30 * ratePerBlock
    const chargeCents = chargeRupees * 100

    return {
      isLate: true,
      pickupWindowEnd: windowEnd,
      actualTime: `${String(pickupHours).padStart(2, '0')}:${String(pickupMinutes).padStart(2, '0')}`,
      lateMinutes: diffMinutes,
      chargeRupees,
      chargeCents,
      policyNote: `Late pickup by ${diffMinutes}m (grace: ${graceMinutes}m). ₹${chargeRupees} charged per policy.`,
    }
  }

  /**
   * Authorize a pickup person against StudentGuardian relationships and PIN policy
   */
  static async verifyPickupPerson(
    tenantId: string,
    studentId: string,
    guardianId: string,
    providedPin?: string | null
  ): Promise<{
    authorized: boolean
    guardianName?: string
    relationship?: string
    requiresPin: boolean
    pinMatched: boolean
    reason?: string
  }> {
    const spRaw = await getDomainConfig(tenantId, 'STUDENT_PARENT')
    const spCfg = getStudentParentConfig(spRaw)

    const link = await db.studentGuardian.findUnique({
      where: { studentId_guardianId: { studentId, guardianId } },
      include: { guardian: true },
    })

    if (!link) {
      return {
        authorized: false,
        requiresPin: false,
        pinMatched: false,
        reason: 'Person is not registered as a guardian for this student.',
      }
    }

    if (!link.canPickup) {
      return {
        authorized: false,
        guardianName: link.guardian.fullName,
        relationship: link.guardian.relationship,
        requiresPin: false,
        pinMatched: false,
        reason: 'Guardian record exists, but pickup authorization (canPickup) is revoked.',
      }
    }

    const requiresPin = spCfg.pickupVerification === 'PIN_MATCH' && Boolean(link.guardian.pickupPin)
    let pinMatched = true

    if (requiresPin) {
      if (!providedPin || providedPin.trim() !== link.guardian.pickupPin?.trim()) {
        return {
          authorized: false,
          guardianName: link.guardian.fullName,
          relationship: link.guardian.relationship,
          requiresPin: true,
          pinMatched: false,
          reason: 'Pickup PIN verification failed. Incorrect or missing security PIN.',
        }
      }
    }

    return {
      authorized: true,
      guardianName: link.guardian.fullName,
      relationship: link.guardian.relationship,
      requiresPin,
      pinMatched: true,
    }
  }

  /**
   * Health Check triage rule: determines if symptoms warrant isolation or alert
   */
  static evaluateHealthOutcome(
    outcome: 'CLEAR' | 'ATTENTION' | 'ISOLATE' | 'PARENT_CONTACT_REQUIRED',
    temperature?: number | null,
    symptoms?: string[]
  ): { isConcerning: boolean; severity: 'INFO' | 'WARNING' | 'URGENT' | 'EMERGENCY'; actionNeeded: string } {
    if (outcome === 'ISOLATE' || outcome === 'PARENT_CONTACT_REQUIRED' || (temperature && temperature >= 100.4)) {
      return {
        isConcerning: true,
        severity: 'URGENT',
        actionNeeded: 'Child must be isolated in medical room and parent contacted immediately.',
      }
    }

    if (outcome === 'ATTENTION' || (temperature && temperature > 99.5) || (symptoms && symptoms.length > 0)) {
      return {
        isConcerning: true,
        severity: 'WARNING',
        actionNeeded: 'Observe child closely throughout morning. Notify classroom teacher.',
      }
    }

    return {
      isConcerning: false,
      severity: 'INFO',
      actionNeeded: 'Normal classroom participation approved.',
    }
  }
}
