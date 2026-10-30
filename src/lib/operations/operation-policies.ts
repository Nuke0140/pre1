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
import bcrypt from 'bcryptjs'

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
      policyNote: `Late pickup by ${diffMinutes}m (grace: ${graceMinutes}m). INR ${chargeRupees} charged per policy.`,
    }
  }

  /**
   * Authorize a pickup person against StudentGuardian relationships and PIN policy
  /**
   * Evaluates if a pickup person is authorized and validates PIN if required.
   * Traverses the entire StudentGuardian relationship set to eliminate false NOT_MATCH.
   */
  static async verifyPickupPerson(
    tenantId: string,
    studentId: string,
    personIdentifier:
      | string
      | {
          guardianId?: string
          phone?: string
          userId?: string
          pin?: string
        },
    providedPin?: string | null
  ): Promise<{
    authorized: boolean
    status: 'MATCH' | 'NOT_MATCH'
    guardianId?: string
    guardianName?: string
    relationship?: string
    requiresPin: boolean
    pinMatched: boolean
    reason?: string
  }> {
    const spRaw = await getDomainConfig(tenantId, 'STUDENT_PARENT')
    const spCfg = getStudentParentConfig(spRaw)

    const guardianId = typeof personIdentifier === 'string' ? personIdentifier : personIdentifier?.guardianId
    const phone = typeof personIdentifier === 'object' ? personIdentifier.phone?.trim() : undefined
    const userId = typeof personIdentifier === 'object' ? personIdentifier.userId : undefined
    const pin = providedPin || (typeof personIdentifier === 'object' ? personIdentifier.pin : undefined)

    const student = await db.student.findFirst({
      where: { id: studentId, tenantId, deletedAt: null },
      select: { id: true, firstName: true },
    })

    if (!student) {
      return {
        authorized: false,
        status: 'NOT_MATCH',
        requiresPin: false,
        pinMatched: false,
        reason: 'Student record not found in this school.',
      }
    }

    // Traverse all linked guardians for this student (no single-parent assumption)
    const allLinks = await db.studentGuardian.findMany({
      where: { studentId },
      include: { guardian: { include: { user: true } } },
    })

    // Match across the complete guardian relationship set
    let matchedLink = allLinks.find((l) => {
      if (guardianId && l.guardianId === guardianId) return true
      if (userId && l.guardian.userId === userId) return true
      if (phone && l.guardian.phone === phone) return true
      return false
    })

    if (!matchedLink) {
      // Check for approved alternate / temporary pickup authorization (e.g. Nanny/Driver)
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      const alternateAuth = await db.transportPickupAuthorization.findFirst({
        where: {
          studentId,
          tenantId,
          status: 'APPROVED',
          validFrom: { lte: todayEnd },
          validUntil: { gte: todayStart },
          OR: [
            ...(guardianId ? [{ id: guardianId }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      })

      if (alternateAuth) {
        return {
          authorized: true,
          status: 'MATCH',
          guardianId: alternateAuth.id,
          guardianName: alternateAuth.personName,
          relationship: alternateAuth.relationship,
          requiresPin: false,
          pinMatched: true,
        }
      }

      return {
        authorized: false,
        status: 'NOT_MATCH',
        requiresPin: false,
        pinMatched: false,
        reason: allLinks.length === 0
          ? 'No registered guardians or approved alternate pickup persons found for this student.'
          : 'Person is not registered as an authorized pickup person or guardian for this student.',
      }
    }

    const effectiveRelationship = (matchedLink.relationship || matchedLink.guardian.relationship) as string
    const effectiveExpectedPin = matchedLink.pickupPin || matchedLink.guardian.pickupPin
    const now = new Date()

    // 1. Check pickup authorization status and flag
    const rawStatus = matchedLink.pickupStatus
    const pickupStatus = (rawStatus === 'NOT_AUTHORIZED' && matchedLink.canPickup)
      ? 'AUTHORIZED'
      : (rawStatus || (matchedLink.canPickup ? 'AUTHORIZED' : 'NOT_AUTHORIZED'))
    if (pickupStatus === 'NOT_AUTHORIZED' || !matchedLink.canPickup) {
      return {
        authorized: false,
        status: 'NOT_MATCH',
        guardianId: matchedLink.guardian.id,
        guardianName: matchedLink.guardian.fullName,
        relationship: effectiveRelationship,
        requiresPin: false,
        pinMatched: false,
        reason: 'Pickup authorization is marked as Not Authorized for this child.',
      }
    }

    if (pickupStatus === 'PENDING') {
      return {
        authorized: false,
        status: 'NOT_MATCH',
        guardianId: matchedLink.guardian.id,
        guardianName: matchedLink.guardian.fullName,
        relationship: effectiveRelationship,
        requiresPin: false,
        pinMatched: false,
        reason: 'Pickup authorization is pending verification or approval.',
      }
    }

    if (pickupStatus === 'EXPIRED' || (matchedLink.authExpiresAt && new Date(matchedLink.authExpiresAt) < now)) {
      return {
        authorized: false,
        status: 'NOT_MATCH',
        guardianId: matchedLink.guardian.id,
        guardianName: matchedLink.guardian.fullName,
        relationship: effectiveRelationship,
        requiresPin: false,
        pinMatched: false,
        reason: 'Pickup authorization for this person has expired.',
      }
    }

    if (matchedLink.authStartDate && new Date(matchedLink.authStartDate) > now) {
      return {
        authorized: false,
        status: 'NOT_MATCH',
        guardianId: matchedLink.guardian.id,
        guardianName: matchedLink.guardian.fullName,
        relationship: effectiveRelationship,
        requiresPin: false,
        pinMatched: false,
        reason: 'Pickup authorization is not yet active.',
      }
    }

    // 2. Check authorized days of week (e.g. "Mon, Tue, Wed, Thu, Fri" or "Mon, Wed")
    if (matchedLink.pickupDays && matchedLink.pickupDays.trim() && matchedLink.pickupDays.toLowerCase() !== 'all days') {
      const daysMap: Record<number, string[]> = {
        0: ['sun', 'sunday'],
        1: ['mon', 'monday'],
        2: ['tue', 'tuesday'],
        3: ['wed', 'wednesday'],
        4: ['thu', 'thursday'],
        5: ['fri', 'friday'],
        6: ['sat', 'saturday'],
      }
      const todayDay = now.getDay()
      const allowedTokens = matchedLink.pickupDays.toLowerCase().split(/[\s,]+/).filter(Boolean)
      const dayMatches = daysMap[todayDay].some((d) => allowedTokens.includes(d))
      if (!dayMatches) {
        const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][todayDay]
        return {
          authorized: false,
          status: 'NOT_MATCH',
          guardianId: matchedLink.guardian.id,
          guardianName: matchedLink.guardian.fullName,
          relationship: effectiveRelationship,
          requiresPin: false,
          pinMatched: false,
          reason: `Pickup not authorized on ${currentDayName} (Authorized days: ${matchedLink.pickupDays}).`,
        }
      }
    }

    // 3. Check authorized pickup time window (e.g. "01:45 PM – 02:15 PM" or "13:45 - 14:15")
    if (matchedLink.pickupTimeWindow && matchedLink.pickupTimeWindow.trim()) {
      const parts = matchedLink.pickupTimeWindow.split(/[–—\-]/)
      if (parts.length === 2) {
        const parseTime = (timeStr: string) => {
          const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i)
          if (!match) return null
          let hours = parseInt(match[1], 10)
          const minutes = parseInt(match[2], 10)
          const meridian = match[3]?.toLowerCase()
          if (meridian === 'pm' && hours < 12) hours += 12
          if (meridian === 'am' && hours === 12) hours = 0
          return hours * 60 + minutes
        }
        const startMin = parseTime(parts[0])
        const endMin = parseTime(parts[1])
        if (startMin !== null && endMin !== null) {
          const curMin = now.getHours() * 60 + now.getMinutes()
          if (curMin < startMin || curMin > endMin) {
            return {
              authorized: false,
              status: 'NOT_MATCH',
              guardianId: matchedLink.guardian.id,
              guardianName: matchedLink.guardian.fullName,
              relationship: effectiveRelationship,
              requiresPin: false,
              pinMatched: false,
              reason: `Attempted pickup outside authorized time window (${matchedLink.pickupTimeWindow}).`,
            }
          }
        }
      }
    }

    const requiresPin = spCfg.pickupVerification === 'PIN_MATCH' || Boolean(pin)
    let pinMatched = false

    if (requiresPin) {
      // Fail closed: Missing or unconfigured PINs cannot authorize pickup
      if (!effectiveExpectedPin || !effectiveExpectedPin.trim() || effectiveExpectedPin === '1234' || effectiveExpectedPin === '0000') {
        return {
          authorized: false,
          status: 'NOT_MATCH',
          guardianId: matchedLink.guardian.id,
          guardianName: matchedLink.guardian.fullName,
          relationship: effectiveRelationship,
          requiresPin: true,
          pinMatched: false,
          reason: 'Pickup verification failed: No secure pickup PIN configured for this guardian. Enrollment is required.',
        }
      }

      const cleanPin = typeof pin === 'string' ? pin.trim() : ''

      // Reject fallback/trivial PINs and invalid format
      if (!cleanPin || cleanPin === '1234' || cleanPin === '0000' || !/^\d{4,6}$/.test(cleanPin)) {
        return {
          authorized: false,
          status: 'NOT_MATCH',
          guardianId: matchedLink.guardian.id,
          guardianName: matchedLink.guardian.fullName,
          relationship: effectiveRelationship,
          requiresPin: true,
          pinMatched: false,
          reason: 'Pickup PIN verification failed. Incorrect or invalid security PIN.',
        }
      }

      // Authoritative comparison (bcrypt hash or legacy plaintext)
      if (effectiveExpectedPin.startsWith('$2a$') || effectiveExpectedPin.startsWith('$2b$')) {
        pinMatched = await bcrypt.compare(cleanPin, effectiveExpectedPin)
      } else {
        pinMatched = effectiveExpectedPin.trim() === cleanPin
      }

      if (!pinMatched) {
        return {
          authorized: false,
          status: 'NOT_MATCH',
          guardianId: matchedLink.guardian.id,
          guardianName: matchedLink.guardian.fullName,
          relationship: effectiveRelationship,
          requiresPin: true,
          pinMatched: false,
          reason: 'Pickup PIN verification failed. Incorrect security PIN.',
        }
      }
    }

    return {
      authorized: true,
      status: 'MATCH',
      guardianId: matchedLink.guardian.id,
      guardianName: matchedLink.guardian.fullName,
      relationship: effectiveRelationship,
      requiresPin,
      pinMatched: requiresPin ? pinMatched : true,
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
