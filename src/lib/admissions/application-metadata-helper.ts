/**
 * PreOne — Admission Application Metadata Helper
 *
 * Responsibilities:
 * 1. Safe, versioned, backward-compatible parsing of [Metadata: {...}] stored within
 *    AdmissionApplication.notes without data loss or note corruption.
 * 2. Unpack structured fields (bloodGroup, address, emergencyContact, medicalNotes,
 *    alternatePhone, middleName, additionalGuardians, declarations, draft status) for APIs and UI.
 * 3. Serialize metadata back into notes while preserving human notes, system tags
 *    (e.g., [Approved:...], [Waitlist:...]), and existing keys.
 */

export interface AdditionalGuardianInput {
  id?: string
  fullName: string
  relationship: string
  phone: string
  email?: string | null
  alternatePhone?: string | null
  isPrimaryContact?: boolean
  canPickup?: boolean
  pickupPin?: string | null
  isFeePayer?: boolean
  receivesCommunication?: boolean
}

export interface ApplicationDeclarations {
  accuracyDeclared?: boolean
  parentConsent?: boolean
  authorizedPickupConsent?: boolean
  declaredAt?: string
  declaredByName?: string
}

export interface ApplicationMetadata {
  version?: number
  bloodGroup?: string | null
  emergencyContact?: string | null
  address?: string | null
  medicalNotes?: string | null
  meetingNotes?: string | null
  alternatePhone?: string | null
  middleName?: string | null
  additionalGuardians?: AdditionalGuardianInput[]
  declarations?: ApplicationDeclarations
  isDraft?: boolean
  draftProgress?: {
    completedSections?: string[]
    lastSavedAt?: string
  }
  [key: string]: any
}

const METADATA_TAG_REGEX = /(?:^|\r?\n)\[Metadata:\s*(\{[\s\S]*?\})\](?:\r?\n|$)/

export class ApplicationMetadataHelper {
  /**
   * Parses application notes, separating human-readable content from structured metadata.
   */
  static parse(rawNotes: string | null | undefined): {
    humanNotes: string
    metadata: ApplicationMetadata
  } {
    if (!rawNotes || typeof rawNotes !== 'string') {
      return { humanNotes: '', metadata: { version: 1 } }
    }

    const match = rawNotes.match(METADATA_TAG_REGEX)
    if (!match) {
      return {
        humanNotes: rawNotes.trim(),
        metadata: { version: 1 },
      }
    }

    let parsed: ApplicationMetadata = { version: 1 }
    try {
      const json = JSON.parse(match[1])
      if (typeof json === 'object' && json !== null) {
        parsed = { version: 1, ...json }
      }
    } catch {
      // If parsing fails, fall back to empty metadata and retain entire raw note
      return { humanNotes: rawNotes.trim(), metadata: { version: 1 } }
    }

    // Cleanly extract human notes by removing the metadata tag
    const humanNotes = rawNotes.replace(METADATA_TAG_REGEX, '\n').trim()

    return { humanNotes, metadata: parsed }
  }

  /**
   * Serializes human notes and metadata into a single string.
   */
  static serialize(humanNotes: string | null | undefined, metadata: ApplicationMetadata): string {
    const cleanHuman = (humanNotes || '').trim()
    const metadataKeys = Object.keys(metadata).filter(
      (k) => k !== 'version' && metadata[k] !== undefined && metadata[k] !== null && metadata[k] !== ''
    )

    if (metadataKeys.length === 0) {
      return cleanHuman
    }

    const payload = {
      version: metadata.version || 1,
      ...metadata,
    }

    const metadataBlock = `[Metadata: ${JSON.stringify(payload)}]`

    if (!cleanHuman) {
      return metadataBlock
    }

    return `${cleanHuman}\n\n${metadataBlock}`
  }

  /**
   * Safely merges existing notes with updated metadata and optional new human notes.
   * Completely preserves any non-metadata lines (system tags, logs, approvals).
   */
  static merge(
    existingNotes: string | null | undefined,
    updatedMetadata: Partial<ApplicationMetadata>,
    newHumanNotes?: string | null
  ): string {
    const current = this.parse(existingNotes)

    // Merge metadata
    const mergedMetadata: ApplicationMetadata = {
      ...current.metadata,
      ...updatedMetadata,
      version: 1,
    }

    // If additionalGuardians is explicitly passed, replace or retain
    if (updatedMetadata.additionalGuardians !== undefined) {
      mergedMetadata.additionalGuardians = updatedMetadata.additionalGuardians
    }

    // Determine final human notes:
    // If newHumanNotes is explicitly provided, use it; otherwise preserve current.humanNotes
    const finalHumanNotes = newHumanNotes !== undefined && newHumanNotes !== null
      ? newHumanNotes
      : current.humanNotes

    return this.serialize(finalHumanNotes, mergedMetadata)
  }

  /**
   * Normalizes an AdmissionApplication record into an API-ready object with
   * structured fields exposed directly at the top level.
   */
  static normalizeApplicationResponse<T extends Record<string, any>>(app: T): T & {
    humanNotes: string
    bloodGroup: string | null
    emergencyContact: string | null
    address: string | null
    medicalNotes: string | null
    alternatePhone: string | null
    middleName: string | null
    additionalGuardians: AdditionalGuardianInput[]
    declarations: ApplicationDeclarations | null
    isDraft: boolean
  } {
    const { humanNotes, metadata } = this.parse(app.notes)

    return {
      ...app,
      humanNotes,
      bloodGroup: metadata.bloodGroup || null,
      emergencyContact: metadata.emergencyContact || null,
      address: metadata.address || null,
      medicalNotes: metadata.medicalNotes || null,
      alternatePhone: metadata.alternatePhone || null,
      middleName: metadata.middleName || null,
      additionalGuardians: Array.isArray(metadata.additionalGuardians) ? metadata.additionalGuardians : [],
      declarations: metadata.declarations || null,
      isDraft: app.status === 'DRAFT' || Boolean(metadata.isDraft),
    }
  }
}
