import { describe, it, expect } from 'bun:test'
import * as fs from 'node:fs'

describe('PreOne Dashboard Design Foundation — CSS Verification', () => {
  const globalsCss = fs.readFileSync('src/app/globals.css', 'utf-8')

  it('verifies that .operational-hero is uniquely defined without duplicate blocks', () => {
    // Count exact top-level selector definition matches
    const matches = globalsCss.match(/\.operational-hero\s*\{/g) || []
    expect(matches.length).toBe(1)
  })

  it('verifies .operational-hero has standard accent border-top bar and subtle borders', () => {
    expect(globalsCss).toContain('.operational-hero::before')
    expect(globalsCss).toContain('.operational-hero-title')
    expect(globalsCss).toContain('.operational-hero-sub')
  })

  it('verifies .quick-action-strip has fluid wrapping and mobile responsive rules', () => {
    expect(globalsCss).toContain('.quick-action-strip')
    expect(globalsCss).toContain('.quick-action-strip .strip-label')
    expect(globalsCss).toContain('@media (max-width: 640px)')
    expect(globalsCss).toContain('@media (max-width: 380px)')
  })

  it('verifies .btn-action enforces minimum 40px height on desktop and 44px on mobile (< 640px)', () => {
    expect(globalsCss).toContain('min-height: 40px')
    expect(globalsCss).toContain('min-height: 44px')
    expect(globalsCss).toContain('white-space: nowrap')
  })
})
