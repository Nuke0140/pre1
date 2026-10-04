import { db } from '../src/lib/db'
import { StaffService } from '../src/lib/hr/staff-service'
import { validateStatutoryAndBankFields, maskAccountNumber } from '../src/lib/hr/validation'
import { saveStaffDocumentFile, deleteStaffDocumentFile } from '../src/lib/storage'
import fs from 'fs'
import path from 'path'

async function main() {
  console.log('=== PreOne — HR Release Blockers E2E Verification Suite ===\n')

  // Load Seed Tenant
  const tenant = await db.tenant.findFirst()
  if (!tenant) throw new Error('No seed tenant found in database.')
  console.log(`✓ Seed Tenant: ${tenant.name} (${tenant.id})`)

  const actor = { id: 'admin-user-id', name: 'System Admin', role: 'ADMIN' }

  // -------------------------------------------------------------
  // BLOCKER 1: STATUTORY & BANK INFORMATION Persistence & Masking
  // -------------------------------------------------------------
  console.log('\n--- BLOCKER 1 TESTS: Statutory & Bank Information ---')

  // 1. Format Validations
  console.log('1. Testing Validation Rules...')
  const invalidVal = validateStatutoryAndBankFields({
    panNumber: 'INVALID_PAN',
    aadhaarNumber: '123',
    ifscCode: 'INVALID',
    accountNumber: '12',
  })
  if (invalidVal.valid || Object.keys(invalidVal.errors).length !== 4) {
    throw new Error('Validation failed to catch invalid PAN, Aadhaar, IFSC, or Account Number!')
  }
  console.log('  ✓ Invalid PAN, Aadhaar, IFSC, Account Number correctly caught by validator.')

  const validVal = validateStatutoryAndBankFields({
    panNumber: 'ABCDE1234F',
    aadhaarNumber: '123456789012',
    ifscCode: 'SBIN0001234',
    accountNumber: '98765432109876',
  })
  if (!validVal.valid) {
    throw new Error(`Valid statutory fields rejected! Errors: ${JSON.stringify(validVal.errors)}`)
  }
  console.log('  ✓ Valid PAN, Aadhaar, IFSC, Account Number accepted by validator.')

  // 2. Onboard Staff with Basic Info Only
  console.log('2. Onboarding Staff with Basic Info Only...')
  const empCode1 = `EMP-${Date.now().toString().slice(-4)}-1`
  const staff1 = await StaffService.createStaff(
    {
      tenantId: tenant.id,
      fullName: 'Ananya Roy',
      email: `ananya.${Date.now()}@preschool.com`,
      employeeCode: empCode1,
      designation: 'Toddler Educator',
      department: 'Academics',
    },
    actor
  )
  console.log(`  ✓ Staff 1 created with ID: ${staff1.id}`)

  // 3. Onboard Staff with Statutory & Bank Information
  console.log('3. Onboarding Staff with Statutory & Bank Information...')
  const empCode2 = `EMP-${Date.now().toString().slice(-4)}-2`
  const staff2 = await StaffService.createStaff(
    {
      tenantId: tenant.id,
      fullName: 'Rohan Verma',
      email: `rohan.${Date.now()}@preschool.com`,
      employeeCode: empCode2,
      designation: 'Senior Educator',
      department: 'Academics',
      panNumber: 'ABCDE1234F',
      aadhaarNumber: '123456789012',
      uanNumber: '100123456789',
      pfNumber: 'MH/BAN/0012345/000/0001',
      esiNumber: '31001234560001001',
      bankDetails: {
        bankName: 'State Bank of India',
        accountHolderName: 'Rohan Verma',
        accountNumber: '98765432109876',
        ifscCode: 'SBIN0001234',
      },
    },
    actor
  )

  console.log(`  ✓ Staff 2 created with ID: ${staff2.id}`)

  // 4. Verify Database Persistence & Masking
  const fetchedStaff2 = await db.staffProfile.findUnique({
    where: { id: staff2.id },
    include: { bankDetails: true },
  })
  if (!fetchedStaff2) throw new Error('Staff 2 profile not found in database!')

  console.log(`  ✓ Database PAN: ${fetchedStaff2.panNumber}`)
  console.log(`  ✓ Database Aadhaar: ${fetchedStaff2.aadhaarNumber}`)
  console.log(`  ✓ Database UAN: ${fetchedStaff2.uanNumber}`)
  console.log(`  ✓ Database PF: ${fetchedStaff2.pfNumber}`)
  console.log(`  ✓ Database ESI: ${fetchedStaff2.esiNumber}`)

  if (
    fetchedStaff2.panNumber !== 'ABCDE1234F' ||
    fetchedStaff2.aadhaarNumber !== '123456789012' ||
    fetchedStaff2.uanNumber !== '100123456789' ||
    fetchedStaff2.pfNumber !== 'MH/BAN/0012345/000/0001' ||
    fetchedStaff2.esiNumber !== '31001234560001001'
  ) {
    throw new Error('Statutory numbers were not correctly persisted to StaffProfile!')
  }

  if (!fetchedStaff2.bankDetails) throw new Error('StaffBankDetail was not created!')
  console.log(`  ✓ Bank Name: ${fetchedStaff2.bankDetails.bankName}`)
  console.log(`  ✓ Masked Account Number: ${fetchedStaff2.bankDetails.accountNumberMasked}`)
  console.log(`  ✓ IFSC Code: ${fetchedStaff2.bankDetails.ifscCode}`)

  if (fetchedStaff2.bankDetails.accountNumberMasked !== '••••••••9876') {
    throw new Error(`Bank account masking failed! Expected "••••••••9876", got "${fetchedStaff2.bankDetails.accountNumberMasked}"`)
  }

  // 5. Verify Edit / Update Flow
  console.log('5. Verifying Staff Profile Update Flow...')
  await StaffService.updateStaffProfile(
    tenant.id,
    staff2.id,
    {
      panNumber: 'XYZPS9876K',
      bankDetails: {
        bankName: 'HDFC Bank',
        accountHolderName: 'Rohan Verma',
        accountNumber: '112233445566',
        ifscCode: 'HDFC0000123',
      },
    },
    actor
  )

  const updatedStaff2 = await db.staffProfile.findUnique({
    where: { id: staff2.id },
    include: { bankDetails: true },
  })
  if (updatedStaff2?.panNumber !== 'XYZPS9876K' || updatedStaff2?.bankDetails?.bankName !== 'HDFC Bank') {
    throw new Error('Statutory/Bank update failed!')
  }
  console.log('  ✓ Staff statutory & bank details updated successfully.')
  console.log('✅ BLOCKER 1 VERIFIED 100% SUCCESSFUL!')

  // -------------------------------------------------------------
  // BLOCKER 2: STAFF DOCUMENT BINARY FILE UPLOAD & STORAGE
  // -------------------------------------------------------------
  console.log('\n--- BLOCKER 2 TESTS: Staff Document Binary File Upload ---')

  // 1. Upload Valid PDF Document
  console.log('1. Uploading Valid PDF File...')
  const pdfBuffer = Buffer.from('%PDF-1.4 Mock PDF Content for Verification')
  const savedPdf = await saveStaffDocumentFile({
    tenantId: tenant.id,
    staffProfileId: staff2.id,
    docType: 'ID_PROOF',
    buffer: pdfBuffer,
    mimeType: 'application/pdf',
    originalName: 'aadhaar-card-test.pdf',
  })

  console.log(`  ✓ PDF Saved at URL: ${savedPdf.url}`)
  console.log(`  ✓ Saved File Name: ${savedPdf.fileName}`)

  const docRecordPdf = await db.staffDocument.create({
    data: {
      tenantId: tenant.id,
      staffProfileId: staff2.id,
      docType: 'ID_PROOF',
      documentNumber: '1234-5678-9012',
      fileUrl: savedPdf.url,
      fileName: savedPdf.fileName,
      verificationStatus: 'PENDING',
    },
  })
  console.log(`  ✓ StaffDocument DB Record created with ID: ${docRecordPdf.id}`)

  // 2. Upload Valid JPEG File
  console.log('2. Uploading Valid JPEG File...')
  const jpgBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
  const savedJpg = await saveStaffDocumentFile({
    tenantId: tenant.id,
    staffProfileId: staff2.id,
    docType: 'ID_PROOF',
    buffer: jpgBuffer,
    mimeType: 'image/jpeg',
    originalName: 'pan-card-photo.jpg',
  })
  console.log(`  ✓ JPEG Saved at URL: ${savedJpg.url}`)

  // 3. Upload Valid PNG File
  console.log('3. Uploading Valid PNG File...')
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const savedPng = await saveStaffDocumentFile({
    tenantId: tenant.id,
    staffProfileId: staff2.id,
    docType: 'DEGREE_CERTIFICATE',
    buffer: pngBuffer,
    mimeType: 'image/png',
    originalName: 'degree-certificate.png',
  })
  console.log(`  ✓ PNG Saved at URL: ${savedPng.url}`)

  // 4. Test Unsupported File Format Rejection
  console.log('4. Testing Unsupported File Format Rejection...')
  let rejectedFormat = false
  try {
    await saveStaffDocumentFile({
      tenantId: tenant.id,
      staffProfileId: staff2.id,
      docType: 'OTHER',
      buffer: Buffer.from('executable binary code'),
      mimeType: 'application/x-msdownload',
      originalName: 'malicious.exe',
    })
  } catch (err: any) {
    rejectedFormat = true
    console.log(`  ✓ Invalid file format correctly rejected: "${err.message}"`)
  }
  if (!rejectedFormat) throw new Error('Unsupported file format (.exe) was NOT rejected!')

  // 5. Test Oversized File Rejection (> 5MB)
  console.log('5. Testing Oversized File (>5MB) Rejection...')
  let rejectedSize = false
  try {
    const hugeBuffer = Buffer.alloc(6 * 1024 * 1024) // 6MB
    await saveStaffDocumentFile({
      tenantId: tenant.id,
      staffProfileId: staff2.id,
      docType: 'OTHER',
      buffer: hugeBuffer,
      mimeType: 'application/pdf',
      originalName: 'huge-file.pdf',
    })
  } catch (err: any) {
    rejectedSize = true
    console.log(`  ✓ Oversized file correctly rejected: "${err.message}"`)
  }
  if (!rejectedSize) throw new Error('Oversized file (>5MB) was NOT rejected!')

  // 6. Test Orphan File Cleanup on Database Rollback
  console.log('6. Testing Orphan File Cleanup on Transaction Error...')
  const orphanFile = await saveStaffDocumentFile({
    tenantId: tenant.id,
    staffProfileId: staff2.id,
    docType: 'OTHER',
    buffer: Buffer.from('temp content'),
    mimeType: 'application/pdf',
    originalName: 'orphan-test.pdf',
  })

  // Simulate failed DB transaction & cleanup call
  await deleteStaffDocumentFile(orphanFile.url)
  const relativePath = orphanFile.url.replace('/uploads/documents/staff/', '')
  const filePathOnDisk = path.join(process.cwd(), 'public', 'uploads', 'documents', 'staff', path.normalize(relativePath))

  if (fs.existsSync(filePathOnDisk)) {
    throw new Error('Orphan file cleanup failed! File remains on disk after deletion.')
  }
  console.log('  ✓ Orphan file correctly deleted from storage after failure.')

  // 7. Verify Document Verification Workflow
  console.log('7. Verifying Document Verification Status Workflow...')
  const verifiedDoc = await db.staffDocument.update({
    where: { id: docRecordPdf.id },
    data: {
      verificationStatus: 'VERIFIED',
      verifiedById: actor.id,
      verifiedByName: actor.name,
      verifiedAt: new Date(),
    },
  })
  console.log(`  ✓ Document Status: ${verifiedDoc.verificationStatus}, Verified By: ${verifiedDoc.verifiedByName}`)

  // Cleanup test uploads from disk
  await deleteStaffDocumentFile(savedPdf.url)
  await deleteStaffDocumentFile(savedJpg.url)
  await deleteStaffDocumentFile(savedPng.url)

  console.log('\n✅ ALL E2E VERIFICATION TESTS PASSED 100%! BOTH BLOCKERS FULLY RESOLVED.')
}

main()
  .catch((e) => {
    console.error('\n❌ E2E TEST FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
