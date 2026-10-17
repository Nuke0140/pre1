import { describe, it, expect } from 'bun:test'
import * as fs from 'fs'

describe('PreOne Global Universal Scrollbar System v2.0 Suite', () => {
  const css = fs.readFileSync('src/app/globals.css', 'utf-8')
  const layout = fs.readFileSync('src/app/layout.tsx', 'utf-8')
  const globalScrollbar = fs.readFileSync('src/components/scrollbar/GlobalScrollbar.tsx', 'utf-8')

  it('verifies canonical light theme scrollbar design tokens in :root', () => {
    expect(css).toContain('--po-scrollbar-size:')
    expect(css).toContain('--po-scrollbar-size-thin:')
    expect(css).toContain('--po-scrollbar-radius: 9999px')
    expect(css).toContain('--po-scrollbar-track-bg:')
    expect(css).toContain('--po-scrollbar-thumb-idle-bg:')
    expect(css).toContain('--po-scrollbar-thumb-idle-opacity:')
    expect(css).toContain('--po-scrollbar-thumb-idle-shadow:')
    expect(css).toContain('--po-scrollbar-thumb-hover-bg:')
    expect(css).toContain('--po-scrollbar-thumb-hover-opacity:')
    expect(css).toContain('--po-scrollbar-thumb-hover-shadow:')
    expect(css).toContain('--po-scrollbar-thumb-active-bg:')
    expect(css).toContain('--po-scrollbar-thumb-active-opacity:')
    expect(css).toContain('--po-scrollbar-thumb-active-shadow:')
    expect(css).toContain('--po-scrollbar-color-idle:')
    expect(css).toContain('--po-scrollbar-color-active:')
  })

  it('verifies canonical dark theme scrollbar design tokens in [data-theme="dark"], .dark', () => {
    // Check dark theme override section contains dark tokens
    expect(css).toContain('--po-scrollbar-thumb-idle-bg: color-mix(in srgb, var(--brand-400')
    expect(css).toContain('--po-scrollbar-thumb-hover-bg: color-mix(in srgb, var(--brand-400')
    expect(css).toContain('--po-scrollbar-thumb-active-bg: var(--brand-400')
  })

  it('verifies universal standard cross-browser scrollbar properties', () => {
    expect(css).toContain('scrollbar-width: thin')
    expect(css).toContain('scrollbar-color: var(--po-scrollbar-color-idle)')
    expect(css).toContain('scrollbar-color: var(--po-scrollbar-color-active)')
  })

  it('verifies WebKit glass-3D floating capsule architecture', () => {
    expect(css).toContain('::-webkit-scrollbar {')
    expect(css).toContain('background-clip: padding-box')
    expect(css).toContain('border: 1.5px solid transparent')
    expect(css).toContain('border-radius: var(--po-scrollbar-radius')
    expect(css).toContain('box-shadow: var(--po-scrollbar-thumb-idle-shadow')
    expect(css).toContain('box-shadow: var(--po-scrollbar-thumb-hover-shadow')
    expect(css).toContain('box-shadow: var(--po-scrollbar-thumb-active-shadow')
  })

  it('verifies active scrolling and auto-hide states via [data-scrolling="true"]', () => {
    expect(css).toContain('*[data-scrolling="true"]::-webkit-scrollbar-thumb')
    expect(css).toContain('.preone-scrollbar-autohide')
    expect(css).toContain('.preone-scrollbar-thin')
    expect(css).toContain('.scrollbar-thin')
  })

  it('verifies unified table scrollbar integration with canonical tokens', () => {
    expect(css).toContain('.dtable-scroll,')
    expect(css).toContain('.table-scroll-container,')
    expect(css).toContain('.zen-table-wrap {')
    expect(css).toContain('scrollbar-color: var(--po-scrollbar-color-idle)')
  })

  it('verifies accessibility: forced-colors and prefers-reduced-motion', () => {
    expect(css).toContain('@media (forced-colors: active)')
    expect(css).toContain('scrollbar-color: ButtonText Canvas !important')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('transition: none !important')
  })

  it('verifies opt-out utilities .scrollbar-none and .no-scrollbar', () => {
    expect(css).toContain('.scrollbar-none,')
    expect(css).toContain('.no-scrollbar')
    expect(css).toContain('display: none !important')
  })

  it('verifies GlobalScrollbar component is mounted in RootLayout', () => {
    expect(layout).toContain('<GlobalScrollbar />')
    expect(layout).toContain('import { GlobalScrollbar } from "@/components/scrollbar/GlobalScrollbar"')
  })

  it('verifies GlobalScrollbar registers passive capture listener with memory-safe auto-hide timeout', () => {
    expect(globalScrollbar).toContain("window.addEventListener('scroll', handleScroll, { capture: true, passive: true })")
    expect(globalScrollbar).toContain("scrollElement.setAttribute('data-scrolling', 'true')")
    expect(globalScrollbar).toContain("scrollElement.removeAttribute('data-scrolling')")
    expect(globalScrollbar).toContain('WeakMap')
  })
})
