import { PrismaClient } from '@prisma/client'
import { PdfService } from '../src/lib/templates/pdf-service'
import { APPROVED_TEMPLATE_FIELDS } from '../src/lib/templates/field-registry'

const prisma = new PrismaClient()

async function audit() {
  console.log('=== PHASE 0: PREONE ENVIRONMENT & IMPLEMENTATION AUDIT ===\n')

  // 1. Browser & PDF Service Engine
  const browserPath = PdfService.getBrowserExecutable()
  console.log(`[PDF Renderer] Chromium/Edge Executable: ${browserPath || 'NOT FOUND (Using Vector Fallback)'}`)

  // 2. Field Registry
  console.log(`[Field Registry] Approved Fields Count: ${APPROVED_TEMPLATE_FIELDS.length}`)

  // 3. Database & Tenants
  const tenantCount = await prisma.tenant.count()
  console.log(`[Database] Total Tenants: ${tenantCount}`)

  const activeTenants = await prisma.tenant.findMany({
    select: { id: true, name: true, code: true },
    take: 20,
  })

  let targetTenant: any = null
  for (const t of activeTenants) {
    const studentCount = await prisma.student.count({ where: { tenantId: t.id } })
    const staffCount = await prisma.staffProfile.count({ where: { tenantId: t.id } })
    const templateCount = await prisma.documentTemplate.count({ where: { tenantId: t.id } })

    if (studentCount > 0 && staffCount > 0) {
      console.log(`  -> Tenant "${t.name}" (${t.id}) [Code: ${t.code}]:`)
      console.log(`     Students: ${studentCount}, Staff: ${staffCount}, Templates: ${templateCount}`)
      if (!targetTenant) targetTenant = { ...t, studentCount, staffCount, templateCount }
    }
  }

  if (targetTenant) {
    console.log(`\n[Selected Target Tenant for Testing] "${targetTenant.name}" (${targetTenant.id})`)
    const templates = await prisma.documentTemplate.findMany({
      where: { tenantId: targetTenant.id },
      select: { id: true, name: true, type: true, isDefault: true, content: true },
    })
    console.log(`Existing Templates in Tenant: ${templates.length}`)
    templates.forEach((tmpl) => {
      const def = tmpl.content as any
      console.log(`  - [${tmpl.type}] "${tmpl.name}" (ID: ${tmpl.id}) | Default: ${tmpl.isDefault} | Version: v${def?.version || 1} | Status: ${def?.status || 'UNKNOWN'}`)
    })
  } else {
    console.log('\n[Notice] No single tenant has both student and staff records in the sample. We can set up our authorized test tenant.')
  }
}

audit().catch(console.error).finally(() => prisma.$disconnect())
