import { describe, it, expect } from 'bun:test'
import { ApplicationMetadataHelper } from '@/lib/admissions/application-metadata-helper'

describe('ApplicationMetadataHelper Unit Tests', () => {
  it('parses null and undefined notes safely', () => {
    const res1 = ApplicationMetadataHelper.parse(null)
    expect(res1.humanNotes).toBe('')
    expect(res1.metadata.version).toBe(1)

    const res2 = ApplicationMetadataHelper.parse(undefined)
    expect(res2.humanNotes).toBe('')
    expect(res2.metadata.version).toBe(1)
  })

  it('parses pure human notes without metadata block', () => {
    const raw = 'Parent visited on Monday. Interested in bus route.'
    const res = ApplicationMetadataHelper.parse(raw)
    expect(res.humanNotes).toBe(raw)
    expect(res.metadata.version).toBe(1)
    expect(res.metadata.bloodGroup).toBeUndefined()
  })

  it('parses notes containing [Metadata: {...}] and strips the block from human notes', () => {
    const raw = `Walk-in enquiry from father.
[Metadata: {"bloodGroup":"O+","address":"123 Main St","additionalGuardians":[{"fullName":"Anita","phone":"9876543210","relationship":"MOTHER"}]}]
[Offer Generated: OFR-2026-001]`

    const res = ApplicationMetadataHelper.parse(raw)
    expect(res.humanNotes).toContain('Walk-in enquiry from father.')
    expect(res.humanNotes).toContain('[Offer Generated: OFR-2026-001]')
    expect(res.humanNotes).not.toContain('[Metadata:')

    expect(res.metadata.bloodGroup).toBe('O+')
    expect(res.metadata.address).toBe('123 Main St')
    expect(res.metadata.additionalGuardians?.length).toBe(1)
    expect(res.metadata.additionalGuardians?.[0].fullName).toBe('Anita')
  })

  it('merges new metadata while preserving existing human notes and unmentioned metadata keys', () => {
    const initialNotes = `Initial counselling notes.
[Metadata: {"bloodGroup":"B+","address":"Old Address","medicalNotes":"Asthma"}]`

    const merged = ApplicationMetadataHelper.merge(
      initialNotes,
      { address: 'New Address', emergencyContact: '9988776655' }
    )

    const parsed = ApplicationMetadataHelper.parse(merged)
    expect(parsed.humanNotes).toBe('Initial counselling notes.')
    expect(parsed.metadata.bloodGroup).toBe('B+') // preserved
    expect(parsed.metadata.medicalNotes).toBe('Asthma') // preserved
    expect(parsed.metadata.address).toBe('New Address') // updated
    expect(parsed.metadata.emergencyContact).toBe('9988776655') // added
  })

  it('merges new human notes cleanly without corrupting metadata', () => {
    const initialNotes = `Note 1
[Metadata: {"bloodGroup":"A+"}]`

    const merged = ApplicationMetadataHelper.merge(
      initialNotes,
      { medicalNotes: 'None' },
      'Updated note text from staff'
    )

    const parsed = ApplicationMetadataHelper.parse(merged)
    expect(parsed.humanNotes).toBe('Updated note text from staff')
    expect(parsed.metadata.bloodGroup).toBe('A+')
    expect(parsed.metadata.medicalNotes).toBe('None')
  })

  it('normalizes application response object exposing structured fields at top-level', () => {
    const app = {
      id: 'app-1',
      applicationNumber: 'ADM-2026-001',
      childFirstName: 'Rohan',
      status: 'SUBMITTED',
      notes: `Notes here\n[Metadata: {"bloodGroup":"AB+","address":"Pune","additionalGuardians":[{"fullName":"Sunita","phone":"9811122233","relationship":"AUNT"}]}]`,
    }

    const normalized = ApplicationMetadataHelper.normalizeApplicationResponse(app)
    expect(normalized.id).toBe('app-1')
    expect(normalized.childFirstName).toBe('Rohan')
    expect(normalized.bloodGroup).toBe('AB+')
    expect(normalized.address).toBe('Pune')
    expect(normalized.emergencyContact).toBeNull()
    expect(normalized.additionalGuardians.length).toBe(1)
    expect(normalized.additionalGuardians[0].fullName).toBe('Sunita')
    expect(normalized.humanNotes).toBe('Notes here')
    expect(normalized.isDraft).toBe(false)
  })
})
