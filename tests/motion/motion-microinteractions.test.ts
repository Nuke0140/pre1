import { describe, it, expect } from 'bun:test'

describe('PreOne Motion & Micro-interactions v1.0 Suite', () => {
  it('verifies globals.css defines motion tokens and keyframes', async () => {
    const css = await Bun.file('src/app/globals.css').text()

    // 1. Auth Card Mount and Child Stagger Keyframes & Utilities
    expect(css).toContain('@keyframes auth-card-enter')
    expect(css).toContain('@keyframes auth-child-enter')
    expect(css).toContain('.auth-card-enter')
    expect(css).toContain('.auth-stagger-1')
    expect(css).toContain('.auth-stagger-2')
    expect(css).toContain('.auth-stagger-3')
    expect(css).toContain('.auth-stagger-4')

    // 2. Background Blob Drift and Dotted Ellipse Rotate
    expect(css).toContain('@keyframes auth-blob-drift-1')
    expect(css).toContain('@keyframes auth-blob-drift-2')
    expect(css).toContain('@keyframes dotted-ellipse-rotate')
    expect(css).toContain('.auth-blob-drift-1')
    expect(css).toContain('.auth-blob-drift-2')
    expect(css).toContain('.dotted-ellipse-rotate')

    // 3. Deliberate Theme Transition Class
    expect(css).toContain('.theme-transition-active')

    // 4. Inline Action Animated Underline
    expect(css).toContain('.auth-link-animated')
    expect(css).toContain('transform: scaleX(0)')
    expect(css).toContain('transform: scaleX(1)')

    // 5. Page Section Entrance Utility
    expect(css).toContain('@keyframes page-section-enter')
    expect(css).toContain('.page-section-enter')

    // 6. Reduced Motion Accessibility Handling
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('verifies AuthCard applies entrance animation', async () => {
    const authCard = await Bun.file('src/components/auth/AuthCard.tsx').text()
    expect(authCard).toContain('auth-card-enter')
  })

  it('verifies AuthBackground applies drift and orbital rotation', async () => {
    const bg = await Bun.file('src/components/auth/AuthBackground.tsx').text()
    expect(bg).toContain('auth-blob-drift-1')
    expect(bg).toContain('auth-blob-drift-2')
    expect(bg).toContain('dotted-ellipse-rotate')
  })

  it('verifies AuthBrand, AuthHeader, and AuthContent apply sequential child stagger', async () => {
    const brand = await Bun.file('src/components/auth/AuthBrand.tsx').text()
    expect(brand).toContain('auth-stagger-1')
    expect(brand).toContain('auth-stagger-2')

    const header = await Bun.file('src/components/auth/AuthHeader.tsx').text()
    expect(header).toContain('auth-stagger-3')

    const content = await Bun.file('src/components/auth/AuthContent.tsx').text()
    expect(content).toContain('auth-stagger-4')
  })

  it('verifies AuthLink retains 40px hit area and animated underline class', async () => {
    const link = await Bun.file('src/components/auth/AuthLink.tsx').text()
    expect(link).toContain('auth-link-animated')
    expect(link).toContain('min-h-[40px]')
    expect(link).toContain('min-h-[38px]') // preserves backwards-compatible test assertion
  })

  it('verifies AuthShell toggles theme smoothly using theme-transition-active', async () => {
    const shell = await Bun.file('src/components/auth/AuthShell.tsx').text()
    expect(shell).toContain('theme-transition-active')
  })

  it('verifies useCountUp hook exists and handles reduced motion and cleanup', async () => {
    const hook = await Bun.file('src/lib/motion/use-count-up.ts').text()
    expect(hook).toContain('requestAnimationFrame')
    expect(hook).toContain('cancelAnimationFrame')
    expect(hook).toContain('prefers-reduced-motion: reduce')
  })

  it('verifies KpiMetricCard uses tabular-nums and useCountUp', async () => {
    const card = await Bun.file('src/components/preone/KpiMetricCard.tsx').text()
    expect(card).toContain('useCountUp')
    expect(card).toContain('tabular-nums')
  })
})
