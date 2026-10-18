import { describe, it, expect } from 'bun:test'
import * as fs from 'node:fs'
import { SetupIncompleteBanner } from '@/components/dashboard/SetupIncompleteBanner'

describe('SetupIncompleteBanner Component & Executive Preview Test Suite', () => {
  const bannerSource = fs.readFileSync('src/components/dashboard/SetupIncompleteBanner.tsx', 'utf-8')
  const clientSource = fs.readFileSync('src/app/app/dashboard/DashboardClient.tsx', 'utf-8')
  const pageSource = fs.readFileSync('src/app/app/dashboard/page.tsx', 'utf-8')

  it('1. Verifies SetupIncompleteBanner source includes accessibility and navigation attributes', () => {
    expect(bannerSource).toContain('role="region"')
    expect(bannerSource).toContain('aria-label="Setup Incomplete Notice"')
    expect(bannerSource).toContain('Continue Setup')
    expect(bannerSource).toContain('/app/setup')
  })

  it('2. Verifies SetupIncompleteBanner returns null when status is LIVE', () => {
    const renderedLive = SetupIncompleteBanner({ status: 'LIVE' })
    expect(renderedLive).toBeNull()
  })

  it('3. Verifies SetupIncompleteBanner renders for non-LIVE statuses (NOT_STARTED, IN_PROGRESS, BLOCKED)', () => {
    const renderedProgress = SetupIncompleteBanner({ status: 'IN_PROGRESS' })
    expect(renderedProgress).not.toBeNull()
    expect(renderedProgress?.type).toBe('div')
    expect(renderedProgress?.props['aria-label']).toBe('Setup Incomplete Notice')

    const renderedNotStarted = SetupIncompleteBanner({ status: 'NOT_STARTED' })
    expect(renderedNotStarted).not.toBeNull()

    const renderedBlocked = SetupIncompleteBanner({ status: 'BLOCKED' })
    expect(renderedBlocked).not.toBeNull()
  })

  it('4. Verifies DashboardClient conditionally renders SetupIncompleteBanner when setup is not LIVE', () => {
    expect(clientSource).toContain('SetupIncompleteBanner')
    expect(clientSource).toContain("setup && setup.status !== 'LIVE'")
  })

  it('5. Verifies page controller queries setup status and active academic session without blocking redirect', () => {
    expect(pageSource).toContain('db.schoolSetup.findUnique')
    expect(pageSource).toContain('currentSession(tenantId)')
    expect(pageSource).toContain('setup={setup}')
    expect(pageSource).toContain('sessionName={activeSession?.name}')
  })

  it('6. Verifies empty classroom data renders honest empty state without sample placeholders', () => {
    expect(clientSource).toContain('data.classrooms.length === 0 && (')
    expect(clientSource).toContain('No classrooms configured yet.')
  })

  it('7. Verifies empty audit activity renders honest empty state without sample placeholders', () => {
    expect(clientSource).toContain('data.recentActivity.length === 0 && (')
    expect(clientSource).toContain('No recent activity recorded.')
  })
})
