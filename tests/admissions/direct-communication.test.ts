import { describe, it, expect, beforeAll } from 'bun:test'
import { db } from '@/lib/db'
import { POST as commsPost, GET as commsGet } from '@/app/api/v1/admissions/communications/route'
import { NextRequest } from 'next/server'
import { signSession, SESSION_COOKIE } from '@/lib/auth'
import {
  normalizePhoneNumberForTel,
  normalizePhoneNumberForWhatsApp,
  buildWhatsAppChatUrl,
} from '@/lib/contact-utils'
import {
  ADMISSION_WHATSAPP_TEMPLATES,
  resolveCommunicationTemplate,
} from '@/lib/admissions/communication-templates'

describe('1-Click WhatsApp & Phone Actions (Direct Communication)', () => {
  let tenantId: string
  let branchId: string
  let user: any
  let authCookie: string
  let testLead: any

  beforeAll(async () => {
    const ts = Date.now()

    // 1. Resolve or create tenant
    let tenant = await db.tenant.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })
    if (!tenant) {
      tenant = await db.tenant.create({
        data: {
          name: `Communication Test School ${ts}`,
          code: `SCH_COMM_${ts}`,
          status: 'ACTIVE',
        },
      })
    }
    tenantId = tenant.id

    // 2. Resolve or create branch
    let branch = await db.branch.findFirst({
      where: { tenantId, deletedAt: null, isActive: true },
    })
    if (!branch) {
      branch = await db.branch.create({
        data: {
          tenantId,
          name: 'Main Campus',
          code: `BR_COMM_${ts}`,
          isMain: true,
        },
      })
    }
    branchId = branch.id

    // 3. Create active test user with OWNER/ADMIN permissions
    user = await db.user.create({
      data: {
        email: `staff_comm_${ts}@preone.local`,
        fullName: 'Admissions Officer Jane',
        passwordHash: 'dummy_hash',
        status: 'ACTIVE',
      },
    })

    await db.tenantUser.create({
      data: {
        tenantId,
        userId: user.id,
        role: 'OWNER',
        roles: ['OWNER'],
        branchId,
      },
    })

    const token = await signSession({
      uid: user.id,
      tenantId,
      role: 'OWNER',
      roles: ['OWNER'],
      email: user.email,
      branchId,
    })
    authCookie = `${SESSION_COOKIE}=${token}`

    // 4. Create test lead
    testLead = await db.lead.create({
      data: {
        tenantId,
        branchId,
        leadNumber: `ENQ-COMM-${ts.toString().slice(-6)}`,
        parentName: 'Rohan Verma',
        phone: '+91 98765 43210',
        email: `rohan.${ts}@example.com`,
        childName: 'Ananya Verma',
        childDob: new Date('2021-05-10'),
        interestedProgram: 'NURSERY',
        source: 'WALK_IN',
        status: 'NEW',
        notes: 'Test lead for 1-click communication suite',
      },
    })
  })

  describe('1. Phone Number Normalization & WhatsApp URL Builders', () => {
    it('formats standard 10-digit Indian numbers to E.164 without leading 0', () => {
      const formatted = normalizePhoneNumberForWhatsApp('9876543210')
      expect(formatted).toBe('919876543210')

      const formattedWithZero = normalizePhoneNumberForWhatsApp('09876543210')
      expect(formattedWithZero).toBe('919876543210')

      const formattedWithPlus = normalizePhoneNumberForWhatsApp('+91 98765 43210')
      expect(formattedWithPlus).toBe('919876543210')
    })

    it('generates correct tel: protocol URLs', () => {
      expect(normalizePhoneNumberForTel('9876543210')).toBe('tel:9876543210')
      expect(normalizePhoneNumberForTel('+919876543210')).toBe('tel:+919876543210')
      expect(normalizePhoneNumberForTel('')).toBeNull()
      expect(normalizePhoneNumberForTel(null)).toBeNull()
    })

    it('builds wa.me direct chat URLs with encoded messages', () => {
      const url = buildWhatsAppChatUrl('9876543210', 'Hello Parent!')
      expect(url).toContain('https://wa.me/919876543210')
      expect(url).toContain('text=Hello%20Parent!')
    })
  })

  describe('2. WhatsApp Context-Aware Template Engine', () => {
    it('resolves VISIT_THANK_YOU template and ensures zero unresolved placeholders', () => {
      const resolved = resolveCommunicationTemplate('VISIT_THANK_YOU', {
        parentName: 'Mrs. Kapoor',
        childName: 'Vihaan',
        branchName: 'Indiranagar',
      })

      expect(resolved).toContain('Mrs. Kapoor')
      expect(resolved).toContain('Vihaan')
      expect(resolved).toContain('Indiranagar Campus')
      expect(resolved).not.toContain('{{')
      expect(resolved).not.toContain('}}')
    })

    it('cleanly neutralizes missing optional child name with natural phrasing', () => {
      const resolved = resolveCommunicationTemplate('VISIT_THANK_YOU', {
        parentName: 'Mr. Gupta',
        // childName is omitted
        schoolName: 'PreOne Preschool',
      })

      expect(resolved).toContain('Mr. Gupta')
      expect(resolved).toContain('PreOne Preschool')
      expect(resolved).toContain('your child')
      expect(resolved).not.toContain('{{')
      expect(resolved).not.toContain('}}')
    })

    it('resolves CAMPUS_TOUR_REMINDER with custom date/time', () => {
      const resolved = resolveCommunicationTemplate('CAMPUS_TOUR_REMINDER', {
        parentName: 'Sunita Rao',
        childName: 'Kabir',
        schoolName: 'PreOne',
        tourDate: 'Saturday, 10:30 AM',
      })

      expect(resolved).toContain('Sunita Rao')
      expect(resolved).toContain('Saturday, 10:30 AM')
      expect(resolved).not.toContain('{{')
    })

    it('resolves DOCUMENTS_PENDING with specific missing document names', () => {
      const resolved = resolveCommunicationTemplate('DOCUMENTS_PENDING', {
        parentName: 'Aditya Mehta',
        childName: 'Rhea',
        schoolName: 'PreOne Global',
        missingDocuments: 'Birth Certificate, Immunization Record',
      })

      expect(resolved).toContain('Birth Certificate, Immunization Record')
      expect(resolved).not.toContain('{{')
    })
  })

  describe('3. Database-Backed Communication Logging & Outcome Persistence', () => {
    it('logs a phone call interaction with outcome and notes', async () => {
      const reqBody = {
        leadId: testLead.id,
        channel: 'CALL',
        interactionType: 'CALL_LOGGED',
        callOutcome: 'CONNECTED',
        parentName: 'Rohan Verma',
        phone: '+919876543210',
        childName: 'Baby Aarav',
        notes: 'Discussed morning batch timings and fee schedule. Parent was very receptive.',
      }

      const req = new NextRequest('http://localhost:3000/api/v1/admissions/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify(reqBody),
      })

      const res = await commsPost(req)
      expect(res.status).toBe(201)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.id).toBeTruthy()
      expect(json.data.callOutcome).toBe('CONNECTED')
      expect(json.data.notes).toContain('Discussed morning batch timings')

      // Verify record in database
      const dbRecord = await db.admissionCommunication.findUnique({
        where: { id: json.data.id },
      })
      expect(dbRecord).toBeTruthy()
      expect(dbRecord?.tenantId).toBe(tenantId)
      expect(dbRecord?.leadId).toBe(testLead.id)
    })

    it('logs CALL_BACK_REQUESTED and synchronizes Lead.nextFollowUpAt in database', async () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 2 days ahead

      const reqBody = {
        leadId: testLead.id,
        channel: 'CALL',
        interactionType: 'CALL_LOGGED',
        callOutcome: 'CALL_BACK_REQUESTED',
        parentName: testLead.parentName,
        phone: testLead.phone,
        notes: 'Parent is traveling today. Requested call back on Thursday afternoon.',
        followUpDate: futureDate,
        createReminderTask: true,
      }

      const req = new NextRequest('http://localhost:3000/api/v1/admissions/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify(reqBody),
      })

      const res = await commsPost(req)
      expect(res.status).toBe(201)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.followUpDate).toBeTruthy()

      // Verify that Lead.nextFollowUpAt was synchronized
      const updatedLead = await db.lead.findUnique({
        where: { id: testLead.id },
      })
      expect(updatedLead?.nextFollowUpAt).toBeTruthy()
      expect(new Date(updatedLead!.nextFollowUpAt!).getTime()).toBe(new Date(futureDate).getTime())
    })

    it('logs WHATSAPP_PREPARED template message dispatch', async () => {
      const reqBody = {
        leadId: testLead.id,
        channel: 'WHATSAPP',
        interactionType: 'WHATSAPP_PREPARED',
        parentName: testLead.parentName,
        phone: testLead.phone,
        notes: 'Template: Campus Tour Reminder\n\nDear Parent, this is a reminder for your campus walkthrough tomorrow at 10 AM.',
      }

      const req = new NextRequest('http://localhost:3000/api/v1/admissions/communications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: authCookie,
        },
        body: JSON.stringify(reqBody),
      })

      const res = await commsPost(req)
      expect(res.status).toBe(201)

      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.data.channel).toBe('WHATSAPP')
      expect(json.data.notes).toContain('Campus Tour Reminder')
    })
  })

  describe('4. Communication History Ledger Querying', () => {
    it('retrieves communications list scoped to lead in reverse chronological order', async () => {
      const getReq = new NextRequest(
        `http://localhost:3000/api/v1/admissions/communications?leadId=${testLead.id}`,
        {
          method: 'GET',
          headers: {
            cookie: authCookie,
          },
        }
      )

      const getRes = await commsGet(getReq)
      expect(getRes.status).toBe(200)

      const json = await getRes.json()
      expect(json.success).toBe(true)
      expect(Array.isArray(json.data)).toBe(true)
      expect(json.data.length).toBeGreaterThanOrEqual(1)

      // Ensure chronological ordering (most recent first)
      if (json.data.length >= 2) {
        const time0 = new Date(json.data[0].createdAt).getTime()
        const time1 = new Date(json.data[1].createdAt).getTime()
        expect(time0).toBeGreaterThanOrEqual(time1)
      }
    })

    it('rejects query without leadId or applicationId with 400 Bad Request', async () => {
      const getReq = new NextRequest(
        'http://localhost:3000/api/v1/admissions/communications',
        {
          method: 'GET',
          headers: {
            cookie: authCookie,
          },
        }
      )

      const getRes = await commsGet(getReq)
      expect(getRes.status).toBe(400)
    })
  })
})
