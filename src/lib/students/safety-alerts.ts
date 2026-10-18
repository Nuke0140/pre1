/**
 * PreOne — Student Safety & Allergy Parsing Engine
 *
 * Life-saving, reliable classification of child medical alerts,
 * severe allergies (anaphylaxis, EpiPen), dietary restrictions,
 * blood groups, and emergency directives.
 */

import { formatBloodGroup } from '@/lib/users/user-validation'

export type SafetyAlertType = 'ALLERGY' | 'MEDICAL' | 'DIETARY'
export type SafetySeverity = 'CRITICAL' | 'WARNING' | 'INFO'

export interface SafetyAlertItem {
  id: string
  type: SafetyAlertType
  severity: SafetySeverity
  label: string
  detail?: string
  isCritical: boolean
}

export interface StudentSafetySummary {
  hasAlerts: boolean
  hasCriticalAlert: boolean
  criticalCount: number
  totalCount: number
  alerts: SafetyAlertItem[]
  bloodGroup: string | null
  rawBloodGroup: string | null
  emergencyInstructions: string | null
  primaryCriticalLabel: string | null
}

const CRITICAL_KEYWORDS = [
  'severe',
  'anaphylaxis',
  'anaphylactic',
  'epipen',
  'epi-pen',
  'critical',
  'life-threatening',
  'emergency',
  'seizure',
  'convulsion',
  'insulin',
  'cardiac',
  'respiratory arrest',
]

/**
 * Common high-risk allergens that should default to at least high warning / critical in a preschool setting
 */
const HIGH_RISK_ALLERGENS = [
  'peanut',
  'tree nut',
  'walnut',
  'cashew',
  'almond',
  'pistachio',
  'bee sting',
  'wasp',
  'insect sting',
  'penicillin',
  'shellfish',
  'latex',
]

/**
 * Split text by commas, semicolons, newlines, or bullets.
 */
function splitEntries(raw?: string | null): string[] {
  if (!raw || typeof raw !== 'string') return []
  return raw
    .split(/[,;\n\r•]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Detects whether a string describes a critical condition
 */
function isCriticalText(text: string): boolean {
  const lower = text.toLowerCase()
  return CRITICAL_KEYWORDS.some((kw) => lower.includes(kw))
}

/**
 * Parse an allergen entry into a structured SafetyAlertItem
 */
function parseAllergyEntry(entry: string, index: number): SafetyAlertItem {
  const lower = entry.toLowerCase()
  const isExplicitCritical = isCriticalText(lower)
  const isHighRisk = HIGH_RISK_ALLERGENS.some((a) => lower.includes(a))
  const isCritical = isExplicitCritical || isHighRisk

  return {
    id: `allergy-${index}-${entry.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    type: 'ALLERGY',
    severity: isCritical ? 'CRITICAL' : 'WARNING',
    label: entry,
    isCritical,
  }
}

/**
 * Parse a medical alert entry into a structured SafetyAlertItem
 */
function parseMedicalEntry(entry: string, index: number): SafetyAlertItem {
  const lower = entry.toLowerCase()
  const isCritical = isCriticalText(lower) || lower.includes('asthma') || lower.includes('diabetes') || lower.includes('epilepsy')

  return {
    id: `medical-${index}-${entry.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    type: 'MEDICAL',
    severity: isCritical ? 'CRITICAL' : 'INFO',
    label: entry,
    isCritical,
  }
}

/**
 * Parse a dietary restriction entry into a structured SafetyAlertItem
 */
function parseDietaryEntry(entry: string, index: number): SafetyAlertItem {
  const lower = entry.toLowerCase()
  const isCritical = isCriticalText(lower) || lower.includes('celiac')

  return {
    id: `dietary-${index}-${entry.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    type: 'DIETARY',
    severity: isCritical ? 'CRITICAL' : 'WARNING',
    label: entry,
    isCritical,
  }
}

export interface StudentSafetySource {
  bloodGroup?: string | null
  allergies?: string | null
  medicalAlerts?: string | null
  dietaryRestrictions?: string | null
  emergencyMedicalInstructions?: string | null
  health?: {
    bloodGroup?: string | null
    allergies?: string | null
    medicalAlerts?: string | null
    dietaryRestrictions?: string | null
    emergencyMedicalInstructions?: string | null
  } | null
}

/**
 * Extracts and categorizes all safety alerts from a student object
 */
export function getStudentSafetySummary(student?: StudentSafetySource | null): StudentSafetySummary {
  if (!student) {
    return {
      hasAlerts: false,
      hasCriticalAlert: false,
      criticalCount: 0,
      totalCount: 0,
      alerts: [],
      bloodGroup: null,
      rawBloodGroup: null,
      emergencyInstructions: null,
      primaryCriticalLabel: null,
    }
  }

  const rawBlood = student.health?.bloodGroup || student.bloodGroup || null
  const formattedBlood = formatBloodGroup(rawBlood)

  const allergiesRaw = student.health?.allergies || student.allergies || null
  const medicalRaw = student.health?.medicalAlerts || student.medicalAlerts || null
  const dietaryRaw = student.health?.dietaryRestrictions || student.dietaryRestrictions || null
  const emergencyInstructions =
    student.health?.emergencyMedicalInstructions || student.emergencyMedicalInstructions || null

  const allergyItems = splitEntries(allergiesRaw).map((entry, i) => parseAllergyEntry(entry, i))
  const medicalItems = splitEntries(medicalRaw).map((entry, i) => parseMedicalEntry(entry, i))
  const dietaryItems = splitEntries(dietaryRaw).map((entry, i) => parseDietaryEntry(entry, i))

  const allAlerts: SafetyAlertItem[] = [...allergyItems, ...medicalItems, ...dietaryItems]

  // Priority sorting: CRITICAL first, then WARNING, then INFO
  const severityScore = (s: SafetySeverity) => {
    switch (s) {
      case 'CRITICAL':
        return 0
      case 'WARNING':
        return 1
      case 'INFO':
        return 2
      default:
        return 3
    }
  }

  allAlerts.sort((a, b) => severityScore(a.severity) - severityScore(b.severity))

  const criticalAlerts = allAlerts.filter((a) => a.isCritical)

  return {
    hasAlerts: allAlerts.length > 0,
    hasCriticalAlert: criticalAlerts.length > 0,
    criticalCount: criticalAlerts.length,
    totalCount: allAlerts.length,
    alerts: allAlerts,
    bloodGroup: formattedBlood,
    rawBloodGroup: rawBlood,
    emergencyInstructions: emergencyInstructions ? emergencyInstructions.trim() : null,
    primaryCriticalLabel: criticalAlerts[0]?.label || null,
  }
}
