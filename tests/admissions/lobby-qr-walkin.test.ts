import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '@/lib/db'
import { POST as publicEnquiryPost } from '@/app/api/v1/public/enquiry/route'
import { NextRequest } from 'next/server'
import { LeadSource } from '@prisma/client'

describe('Front-Desk Lobby QR Code ("Self-Fill" for Waiting Parents)', () => {
  let tenant: any
  let branch: any
  let program: any
  let academicSession: any

  beforeEach(async () => {
    // Resolve test school, branch, program & session
    tenant = await db.tenant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })
    expect(tenant).toBeTruthy()

    branch = await db.branch.findFirst({
      where: { tenantId: tenant.id, deletedAt: null, isActive: true },
    })
    expect(branch).toBeTruthy()

    program = await db.program.findFirst({
      where: { tenantId: tenant.id, deletedAt: null, isActive: true },
    })
    expect(program).toBeTruthy()

    academicSession = await db.academicSession.findFirst({
      where: { tenantId: tenant.id },
    })
  })

  it('1. Successfully ingests a lobby walk-in enquiry with source: "LOBBY_QR" and medical notes', async () => {
    const uniquePhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`
    const reqBody = {
      parentName: 'Priya Sharma (Lobby Walk-In)',
      phone: uniquePhone,
      email: `priya.${Date.now()}@example.com`,
      childName: 'Aarav Sharma',
      childDob: '2021-08-15',
      branchId: branch.id,
      academicSessionId: academicSession?.id,
      interestedProgram: program.programType,
      preferredShift: 'Morning Shift',
      notes: 'Parent waiting at reception table 2 with child.',
      medicalNotes: 'Lactose intolerant, mild dust allergy. Carries nasal spray.',
      source: 'LOBBY_QR',
      consentGiven: true,
    }

    const req = new NextRequest('http://localhost:3000/api/v1/public/enquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqBody),
    })

    const res = await publicEnquiryPost(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data.leadNumber).toMatch(/^ENQ-\d{4}-\d{4}$/)

    // Verify lead in database
    const createdLead = await db.lead.findFirst({
      where: {
        tenantId: tenant.id,
        leadNumber: json.data.leadNumber,
      },
    })

    expect(createdLead).toBeTruthy()
    expect(createdLead?.parentName).toBe('Priya Sharma (Lobby Walk-In)')
    expect(createdLead?.childName).toBe('Aarav Sharma')
    // Verify source is mapped to LeadSource.WALK_IN
    expect(createdLead?.source).toBe(LeadSource.WALK_IN)
    expect(createdLead?.status).toBe('NEW')
    // Verify medical notes are persisted in lead notes
    expect(createdLead?.notes).toContain('Medical & Dietary Notes: Lactose intolerant, mild dust allergy')
    expect(createdLead?.notes).toContain('[Front-Desk Lobby Walk-In / Self-Fill QR]')
  })

  it('2. Ingests walk-in with standard source: "WALK_IN" correctly', async () => {
    const uniquePhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`
    const reqBody = {
      parentName: 'Rohan Gupta (Desk Walk-In)',
      phone: uniquePhone,
      childName: 'Kiara Gupta',
      childDob: '2022-02-10',
      branchId: branch.id,
      interestedProgram: program.programType,
      medicalNotes: 'No known medical conditions or food allergies.',
      source: 'WALK_IN',
      consentGiven: true,
    }

    const req = new NextRequest('http://localhost:3000/api/v1/public/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    })

    const res = await publicEnquiryPost(req)
    const json = await res.json()
    expect(json.success).toBe(true)

    const createdLead = await db.lead.findFirst({
      where: { leadNumber: json.data.leadNumber },
    })

    expect(createdLead?.source).toBe(LeadSource.WALK_IN)
    expect(createdLead?.notes).toContain('Medical & Dietary Notes: No known medical conditions')
  })

  it('3. Handles duplicate phone gracefully and appends lobby notes if re-submitted', async () => {
    const duplicatePhone = `96${Math.floor(10000000 + Math.random() * 90000000)}`
    
    // Initial submission
    const req1 = new NextRequest('http://localhost:3000/api/v1/public/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Ananya Roy',
        phone: duplicatePhone,
        childName: 'Ishaan Roy',
        childDob: '2021-11-20',
        branchId: branch.id,
        interestedProgram: program.programType,
        source: 'WEBSITE',
        consentGiven: true,
      }),
    })
    const res1 = await publicEnquiryPost(req1)
    const json1 = await res1.json()
    expect(json1.success).toBe(true)
    const firstLeadNumber = json1.data.leadNumber

    // Parent walks into lobby and scans QR code with same phone
    const req2 = new NextRequest('http://localhost:3000/api/v1/public/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName: 'Ananya Roy',
        phone: duplicatePhone,
        childName: 'Ishaan Roy',
        childDob: '2021-11-20',
        branchId: branch.id,
        interestedProgram: program.programType,
        medicalNotes: 'Severe egg allergy',
        source: 'LOBBY_QR',
        consentGiven: true,
      }),
    })
    const res2 = await publicEnquiryPost(req2)
    const json2 = await res2.json()
    expect(json2.success).toBe(true)
    expect(json2.data.isExisting).toBe(true)
    expect(json2.data.leadNumber).toBe(firstLeadNumber)

    // Verify existing record had the lobby walk-in note appended
    const updated = await db.lead.findFirst({
      where: { leadNumber: firstLeadNumber },
    })
    expect(updated?.notes).toContain('[Front-Desk Lobby Walk-In]')
    expect(updated?.notes).toContain('Medical / Allergies: Severe egg allergy')
  })
})
