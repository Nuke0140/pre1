/**
 * PreOne — Admission Communication Templates & Resolver
 *
 * Configurable, context-aware WhatsApp & SMS communication templates for Admissions.
 * Replaces placeholders dynamically from actual application, parent, school,
 * campus, and tour metadata. Never exposes raw placeholder tokens (e.g. {{parent_name}}).
 */

export interface CommunicationTemplateContext {
  parentName?: string | null
  childName?: string | null
  schoolName?: string | null
  branchName?: string | null
  tourDate?: string | null
  tourTime?: string | null
  brochureUrl?: string | null
  programName?: string | null
  applicationNumber?: string | null
  leadNumber?: string | null
}

export interface WhatsAppTemplate {
  id: string
  name: string
  description: string
  badge: string
  buildMessage: (ctx: CommunicationTemplateContext) => string
  requiresTour?: boolean
}

export const ADMISSION_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'VISIT_THANK_YOU',
    name: 'Thank You for Campus Visit',
    description: 'Send to parents following an in-person campus visit or discovery tour.',
    badge: 'Campus Visit',
    buildMessage: (ctx) => {
      const parent = ctx.parentName?.trim() || 'Parent'
      const school = ctx.schoolName?.trim() || (ctx.branchName ? `${ctx.branchName} Campus` : 'our preschool')
      
      let msg = `Hi ${parent}, thank you for visiting ${school}! We are happy to help you explore the right learning environment for ${ctx.childName?.trim() || 'your child'}.`
      
      if (ctx.brochureUrl?.trim()) {
        msg += ` Here is our brochure and fee structure: ${ctx.brochureUrl.trim()}.`
      }
      
      msg += ` Please contact us if you have any questions or need further guidance.`
      return msg
    },
  },
  {
    id: 'TOUR_REMINDER',
    name: 'Campus Tour Reminder',
    description: 'Friendly schedule reminder before an upcoming campus appointment.',
    badge: 'Reminder',
    requiresTour: true,
    buildMessage: (ctx) => {
      const parent = ctx.parentName?.trim() || 'Parent'
      const school = ctx.schoolName?.trim() || (ctx.branchName ? `${ctx.branchName} Campus` : 'our school')
      
      if (ctx.tourDate && ctx.tourTime) {
        return `Hi ${parent}, this is a friendly reminder that your campus tour at ${school} is scheduled for ${ctx.tourDate} at ${ctx.tourTime}. We look forward to meeting you and ${ctx.childName?.trim() || 'your child'}!`
      }
      if (ctx.tourDate) {
        return `Hi ${parent}, this is a friendly reminder that your campus tour at ${school} is scheduled for ${ctx.tourDate}. We look forward to meeting you and ${ctx.childName?.trim() || 'your child'}!`
      }
      return `Hi ${parent}, this is a friendly reminder regarding your scheduled campus tour at ${school}. Please let us know if you need to adjust your visit schedule. We look forward to meeting you!`
    },
  },
  {
    id: 'APPLICATION_FOLLOWUP',
    name: 'Admission Application Follow-up',
    description: 'Follow up on active enquiry or assist with formal application completion.',
    badge: 'Follow-up',
    buildMessage: (ctx) => {
      const parent = ctx.parentName?.trim() || 'Parent'
      const school = ctx.schoolName?.trim() || (ctx.branchName ? `${ctx.branchName} Campus` : 'our school')
      const child = ctx.childName?.trim() ? `${ctx.childName.trim()}` : 'your child'
      const prog = ctx.programName?.trim() ? ` for the ${ctx.programName.trim()} program` : ''

      return `Hi ${parent}, we wanted to follow up on the admission enquiry for ${child}${prog} at ${school}. Please let us know if you need any assistance with the application process or have questions regarding fees and batch schedules.`
    },
  },
  {
    id: 'DOCUMENTS_PENDING',
    name: 'Documents or Information Pending',
    description: 'Remind parents to upload mandatory child documents or verify particulars.',
    badge: 'Documents',
    buildMessage: (ctx) => {
      const parent = ctx.parentName?.trim() || 'Parent'
      const school = ctx.schoolName?.trim() || (ctx.branchName ? `${ctx.branchName} Campus` : 'our school')
      const child = ctx.childName?.trim() ? `${ctx.childName.trim()}` : 'your child'
      const ref = ctx.applicationNumber ? ` (Application Ref: ${ctx.applicationNumber})` : ''

      return `Hi ${parent}, we are following up regarding the pending documents and information for ${child}'s admission at ${school}${ref}. Please contact us if you need assistance submitting these items to confirm the seat.`
    },
  },
  {
    id: 'CUSTOM',
    name: 'Custom Direct Message',
    description: 'Compose a customized message tailored to specific parent inquiries.',
    badge: 'Custom',
    buildMessage: (ctx) => {
      const parent = ctx.parentName?.trim() || 'Parent'
      const school = ctx.schoolName?.trim() || 'our school'
      const child = ctx.childName?.trim() ? ` regarding ${ctx.childName.trim()}` : ''

      return `Hi ${parent}, contacting you from ${school} Admissions${child}. `
    },
  },
]

export function resolveCommunicationTemplate(
  templateId: string,
  ctx: CommunicationTemplateContext & { missingDocuments?: string }
): string {
  const normId = templateId === 'CAMPUS_TOUR_REMINDER' ? 'TOUR_REMINDER' : templateId
  const tmpl = ADMISSION_WHATSAPP_TEMPLATES.find((t) => t.id === normId || t.id === templateId)
  if (!tmpl) {
    return `Hi ${ctx.parentName || 'Parent'}, contacting you regarding admissions at ${ctx.schoolName || 'our school'}.`
  }
  let msg = tmpl.buildMessage(ctx)
  if (ctx.missingDocuments && (normId === 'DOCUMENTS_PENDING' || templateId === 'DOCUMENTS_PENDING')) {
    msg = msg.replace('pending documents and information', `pending documents (${ctx.missingDocuments})`)
  }
  return msg
}
