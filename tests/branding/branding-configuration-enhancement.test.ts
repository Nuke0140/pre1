import { describe, it, expect } from 'bun:test'
import { NextRequest } from 'next/server'
import { validateImageContent, isDurableAssetUrl } from '@/lib/storage'
import { getEffectiveBranding } from '@/lib/branding-service'
import { PREONE_BRANDING_DEFAULTS, isValidHexColor, evaluateColorContrast } from '@/lib/branding-types'

/**
 * PRE1-BRANDING-002: PreOne — Branding Configuration Enhancement & Global School Logo Integration
 *
 * Test Specifications:
 * 1. UI Requirements:
 *    - Redundant School Profile link removed from Branding Configuration page
 *    - Presence of the 4 required areas:
 *      1. Brand Colors
 *      2. Footer Settings
 *      3. Glow Settings
 *      4. School Logo
 *    - Preservation of Workspace Layout & School Banner
 * 2. File Validation & Security:
 *    - Magic-byte validation for PNG, JPEG, WebP, SVG
 *    - Rejection of corrupted files, disguised executables, or scripts
 *    - Size validation (max 2MB for logos)
 *    - Rejection of browser blob/data URLs
 * 3. Configuration & Multi-Tenant Data Contract:
 *    - getEffectiveBranding contract with footerText and footerVisible
 *    - Fail-closed isolation between schools
 * 4. Cross-Screen Logo Integration:
 *    - Login Page (AuthBrand)
 *    - Public Application / Enquiry Form (public/enquiry)
 *    - Admission Form Modal (StaffAdmissionFormModal)
 *    - Home Launcher (HomeClient)
 */

describe('PRE1-BRANDING-002: Branding Configuration Enhancement & Global School Logo', () => {

  describe('1. Setup Branding UI Layout & Removal of Redundant School Profile Option', () => {
    it('verifies School Profile Setup option/link is removed from Branding Configuration area', async () => {
      const pageCode = await Bun.file('src/app/app/setup/branding/page.tsx').text()
      // Should not contain the redundant link to /app/setup/school_profile
      expect(pageCode).not.toContain('/app/setup/school_profile')
      expect(pageCode).not.toContain('1. Linked School Identity')
    })

    it('verifies underlying School Profile route remains intact and functional', async () => {
      const schoolProfileApi = await Bun.file('src/app/api/v1/setup/school-profile/route.ts').text()
      expect(schoolProfileApi).toContain('school-profile')
      expect(schoolProfileApi).toContain('academicYearStartMonth')
    })

    it('verifies the 4 primary configuration areas are present in Branding Configuration', async () => {
      const pageCode = await Bun.file('src/app/app/setup/branding/page.tsx').text()
      expect(pageCode).toContain('1. Brand Colors')
      expect(pageCode).toContain('2. Footer Settings')
      expect(pageCode).toContain('3. Glow Settings')
      expect(pageCode).toContain('4. School Logo')
    })

    it('verifies Workspace Layout and School Banner remain preserved and functional', async () => {
      const pageCode = await Bun.file('src/app/app/setup/branding/page.tsx').text()
      expect(pageCode).toContain('5. Workspace Layout')
      expect(pageCode).toContain('WINDOWS_SHELL')
      expect(pageCode).toContain('CLASSIC_SIDEBAR')
      expect(pageCode).toContain('6. School Banner (Optional)')
      expect(pageCode).toContain('handleBannerFileUpload')
    })
  })

  describe('2. School Logo File Validation & Binary Integrity', () => {
    it('accepts valid PNG image buffer with standard magic bytes', () => {
      // PNG header: 89 50 4E 47 0D 0A 1A 0A
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
      expect(() => validateImageContent(pngBuffer, 'image/png')).not.toThrow()
    })

    it('accepts valid JPEG image buffer with standard magic bytes', () => {
      // JPEG header: FF D8 FF
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
      expect(() => validateImageContent(jpegBuffer, 'image/jpeg')).not.toThrow()
    })

    it('accepts valid WebP image buffer with standard magic bytes', () => {
      // WebP header: RIFF....WEBP
      const webpBuffer = Buffer.from('RIFF\x20\x00\x00\x00WEBPVP8 ', 'ascii')
      expect(() => validateImageContent(webpBuffer, 'image/webp')).not.toThrow()
    })

    it('accepts clean SVG xml without scripts', () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>')
      expect(() => validateImageContent(svgBuffer, 'image/svg+xml')).not.toThrow()
    })

    it('rejects disguised executables or text files claiming to be images', () => {
      const fakeBuffer = Buffer.from('MZ\x90\x00This is a Windows executable disguise')
      expect(() => validateImageContent(fakeBuffer, 'image/png')).toThrow('Corrupted or invalid PNG image file header.')
    })

    it('rejects SVG files with embedded script tags or onload handlers', () => {
      const maliciousSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script></svg>')
      expect(() => validateImageContent(maliciousSvg, 'image/svg+xml')).toThrow('SVG contains disallowed script or event handler elements.')

      const onloadSvg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>')
      expect(() => validateImageContent(onloadSvg, 'image/svg+xml')).toThrow('SVG contains disallowed script or event handler elements.')
    })

    it('rejects empty or truncated image buffers', () => {
      const emptyBuffer = Buffer.from([])
      expect(() => validateImageContent(emptyBuffer, 'image/png')).toThrow('Uploaded file is empty or corrupted.')
    })

    it('strictly rejects temporary browser blob: and base64 data: URLs for durability', () => {
      expect(isDurableAssetUrl('blob:http://localhost:3000/abc-123')).toBe(false)
      expect(isDurableAssetUrl('data:image/png;base64,iVBORw0KGgoAAAANS...')).toBe(false)
      expect(isDurableAssetUrl('https://s3.amazonaws.com/preone-branding/tenant1/logo.png')).toBe(true)
      expect(isDurableAssetUrl('/uploads/branding/logo.png')).toBe(true)
    })
  })

  describe('3. Shared Branding Data Contract & Footer Settings', () => {
    it('verifies PREONE_BRANDING_DEFAULTS has footerText and footerVisible initialized', () => {
      expect(PREONE_BRANDING_DEFAULTS.footerVisible).toBe(true)
      expect(PREONE_BRANDING_DEFAULTS.footerText).toBeNull()
      expect(PREONE_BRANDING_DEFAULTS.primaryColor).toBe('#7C3AED')
      expect(PREONE_BRANDING_DEFAULTS.accentColor).toBe('#3B82F6')
      expect(PREONE_BRANDING_DEFAULTS.layout).toBe('WINDOWS_SHELL')
    })

    it('validates hex color format correctly', () => {
      expect(isValidHexColor('#7C3AED')).toBe(true)
      expect(isValidHexColor('#3B82F6')).toBe(true)
      expect(isValidHexColor('#FFF')).toBe(true)
      expect(isValidHexColor('rgb(255,0,0)')).toBe(false)
      expect(isValidHexColor('blue')).toBe(false)
      expect(isValidHexColor('#12345')).toBe(false)
    })

    it('evaluates color contrast and flags low-contrast colors', () => {
      // Extremely light yellow on white background gives contrast ratio warning
      const lightContrast = evaluateColorContrast('#FFFFE0', '#3B82F6')
      expect(lightContrast.isWeakContrast).toBe(true)
      expect(lightContrast.warningMessage).toContain('Primary color is very light')

      // PreOne Default purple has strong contrast
      const standardContrast = evaluateColorContrast('#7C3AED', '#3B82F6')
      expect(standardContrast.isWeakContrast).toBe(false)
    })

    it('verifies config PUT route validates footerText length and footerVisible type', async () => {
      const routeCode = await Bun.file('src/app/api/v1/setup/config/[domain]/route.ts').text()
      expect(routeCode).toContain('footerText cannot exceed 120 characters')
      expect(routeCode).toContain('footerVisible must be a boolean')
      expect(routeCode).toContain('configPayload.footerText')
      expect(routeCode).toContain('configPayload.footerVisible')
      expect(routeCode).toContain('configPayload.footerGlow')
    })
  })

  describe('4. Global School Logo Integration Across 4 Screens', () => {
    it('Screen A (Login Page): AuthBrand renders logoUrl with neutral fallback', async () => {
      const authBrandCode = await Bun.file('src/components/auth/AuthBrand.tsx').text()
      expect(authBrandCode).toContain('{logoUrl ? (')
      expect(authBrandCode).toContain('<img')
      expect(authBrandCode).toContain('src={logoUrl}')
      expect(authBrandCode).toContain('<PLogoMark')
    })

    it('Screen B (Application Forms): public enquiry form renders logoUrl with neutral fallback', async () => {
      const publicEnquiryCode = await Bun.file('src/app/public/enquiry/page.tsx').text()
      expect(publicEnquiryCode).toContain('{logoUrl ? (')
      expect(publicEnquiryCode).toContain('src={logoUrl}')
      expect(publicEnquiryCode).toContain('<School className="w-7 h-7"')
    })

    it('Screen C (Admission Forms): StaffAdmissionFormModal renders logoUrl with neutral fallback', async () => {
      const admissionModalCode = await Bun.file('src/components/admissions/StaffAdmissionFormModal.tsx').text()
      expect(admissionModalCode).toContain('data-testid="admission-school-logo"')
      expect(admissionModalCode).toContain('data-testid="admission-modal-logo"')
      expect(admissionModalCode).toContain('branding?.logoUrl')
      expect(admissionModalCode).toContain('<Building2')
    })

    it('Screen D (Home Launcher): HomeClient renders logoUrl with PLogoWordmark fallback', async () => {
      const homeClientCode = await Bun.file('src/app/app/home/HomeClient.tsx').text()
      expect(homeClientCode).toContain('{branding?.logoUrl ? (')
      expect(homeClientCode).toContain('src={branding.logoUrl}')
      expect(homeClientCode).toContain('<PLogoWordmark')
    })
  })

  describe('5. Multi-Tenant Authorization & Fail-Closed Isolation', () => {
    it('verifies upload route requires settings:write and checks tenant context', async () => {
      const uploadRouteCode = await Bun.file('src/app/api/v1/setup/branding/upload/route.ts').text()
      expect(uploadRouteCode).toContain("requireApi(req, 'settings:write')")
      expect(uploadRouteCode).toContain('!session.tenantId')
      expect(uploadRouteCode).toContain('saveBrandingAsset')
    })

    it('verifies config update route enforces tenantId scoping on Tenant.logoUrl update', async () => {
      const configRouteCode = await Bun.file('src/app/api/v1/setup/config/[domain]/route.ts').text()
      expect(configRouteCode).toContain('where: { id: session.tenantId }')
      expect(configRouteCode).toContain('logoUrl: body.logoUrl?.trim() || null')
    })
  })
})
