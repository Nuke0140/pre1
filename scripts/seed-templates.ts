import { PrismaClient } from '@prisma/client'
import { TemplateService } from '../src/lib/templates/template-service'
import { DocumentType } from '../src/lib/templates/types'

const prisma = new PrismaClient()

async function main() {
  const tenant = await prisma.tenant.findFirst()
  if (!tenant) throw new Error('No tenant found')

  console.log(`Using tenant: ${tenant.name} (${tenant.id})`)

  const starterTypes: DocumentType[] = [
    'STUDENT_ID_CARD',
    'STAFF_ID_CARD',
    'FEE_RECEIPT',
    'CERTIFICATE',
    'ADMISSION_FORM',
    'REPORT_CARD',
    'GENERAL_LETTER',
  ]

  for (const tType of starterTypes) {
    const existing = await prisma.documentTemplate.findFirst({
      where: { tenantId: tenant.id, type: tType },
    })

    if (!existing) {
      const created = await TemplateService.createTemplate(tenant.id, {
        name: `Default ${tType.replaceAll('_', ' ')}`,
        type: tType,
        presetKey: tType,
        createdByName: 'System Setup',
      })
      console.log(`Created default ${tType}: ${created.id}`)
    } else {
      console.log(`Already exists: ${tType} -> ${existing.id}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
