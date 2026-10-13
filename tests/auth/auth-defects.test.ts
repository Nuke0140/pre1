import { describe, it, expect } from 'bun:test'

/**
 * Regression and Verification Test Suite for PreOne Premium Quality Sprint:
 * BUG-003, BUG-005, BUG-009, BUG-010, BUG-011
 */

describe('PreOne Authentication Defects Regression Test Suite', () => {
  describe('BUG-009: Primary Button Text Contrast', () => {
    it('verifies primary and auth variants enforce text-white and high-contrast tokens', async () => {
      const buttonFile = await Bun.file('src/components/ui/button.tsx').text()
      // Variant "primary" and "auth" must enforce "!text-white"
      expect(buttonFile).toContain('!text-white')
      expect(buttonFile).toContain('text-white')

      // Check globals.css .auth-button has color: #FFFFFF !important
      const globalsCss = await Bun.file('src/app/globals.css').text()
      expect(globalsCss).toContain('.auth-button')
      expect(globalsCss).toContain('color: #FFFFFF !important;')

      // AuthActions primary button must explicitly declare !text-white text-white
      const authActionsFile = await Bun.file('src/components/auth/AuthActions.tsx').text()
      expect(authActionsFile).toContain('!text-white text-white')
    })
  })

  describe('BUG-011: Dark-Mode Auth Card Corner Gradient', () => {
    it('verifies AuthCard does not render a hard-edged w-32 h-32 rectangular corner gradient', async () => {
      const authCardFile = await Bun.file('src/components/auth/AuthCard.tsx').text()
      // Hard-edged unrounded corner box must not exist
      expect(authCardFile).not.toContain('rounded-tr-3xl pointer-events-none')
      expect(authCardFile).not.toContain('w-32 h-32 bg-gradient-to-bl from-purple-100/40')

      // It must use smooth blurred radial/circular glow that eliminates seams
      expect(authCardFile).toContain('rounded-full')
      expect(authCardFile).toContain('blur-2xl')
    })
  })

  describe('BUG-010: Theme Flash on Initial Render & Theme Persistence Sync', () => {
    it('verifies layout.tsx has an early blocking script before render', async () => {
      const layoutFile = await Bun.file('src/app/layout.tsx').text()
      expect(layoutFile).toContain('<head>')
      expect(layoutFile).toContain('localStorage.getItem(\'preone-theme\')')
      expect(layoutFile).toContain('document.documentElement.setAttribute(\'data-theme\', theme)')
      expect(layoutFile).toContain('document.documentElement.classList.add(\'dark\')')
    })

    it('verifies AuthShell and PreHydration support both keys and synchronize the dark class', async () => {
      const authShellFile = await Bun.file('src/components/auth/AuthShell.tsx').text()
      expect(authShellFile).toContain('preone-theme')
      expect(authShellFile).toContain('document.documentElement.classList.toggle(\'dark\'')

      const preHydrationFile = await Bun.file('src/components/PreHydration.tsx').text()
      expect(preHydrationFile).toContain('localStorage.getItem(\'preone-theme\') || localStorage.getItem(\'preone_theme\')')
    })
  })

  describe('BUG-005: Inline Link Minimum Hit Target Area', () => {
    it('verifies AuthLink expands hit target to meet touch accessibility requirements', async () => {
      const authLinkFile = await Bun.file('src/components/auth/AuthLink.tsx').text()
      // Needs pseudo-element touch expansion or minimum dimensions
      expect(authLinkFile).toContain('before:absolute before:-inset-2')
      expect(authLinkFile).toContain('min-h-[38px]')
      expect(authLinkFile).toContain('focus-visible:ring-2')
    })
  })

  describe('BUG-003: Accessible Form Validation, OnBlur & ARIA Attributes', () => {
    it('verifies AuthField connects id to error message id', async () => {
      const authFieldFile = await Bun.file('src/components/auth/AuthField.tsx').text()
      expect(authFieldFile).toContain('id={`${id}-error`}')
      expect(authFieldFile).toContain('role="alert"')
    })

    it('verifies page.tsx implements onBlur validation, touched tracking and ARIA attributes', async () => {
      const pageFile = await Bun.file('src/app/page.tsx').text()
      expect(pageFile).toContain('const [touched, setTouched] = useState')
      expect(pageFile).toContain('validateField')
      expect(pageFile).toContain('aria-invalid={!!fieldErrors.schoolCode}')
      expect(pageFile).toContain('aria-describedby={fieldErrors.schoolCode ? \'login-school-code-error\' : undefined}')
      expect(pageFile).toContain('aria-invalid={!!fieldErrors.identifier}')
      expect(pageFile).toContain('aria-describedby={fieldErrors.identifier ? \'login-identifier-error\' : undefined}')
      expect(pageFile).toContain('aria-invalid={!!fieldErrors.password}')
      expect(pageFile).toContain('login-password-error')
    })
  })
})
