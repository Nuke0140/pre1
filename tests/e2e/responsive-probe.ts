import { expect as baseExpect, type Page } from '@playwright/test'

export interface ProbeResult {
  hasPageHScroll: boolean
  documentScrollWidth: number
  windowInnerWidth: number
  clippedElements: Array<{ tag: string; className: string; id: string; right: number; innerWidth: number }>
  profileButtonInViewport: boolean
  profileButtonBounds?: { left: number; right: number; top: number; bottom: number }
}

export interface ResponsiveProbeOptions {
  pageName?: string
  viewportName?: string
  tolerancePx?: number
  requireProfile?: boolean
}

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, Args = {}> {
      toPassResponsiveProbe(options?: ResponsiveProbeOptions): Promise<R>
    }
  }
}

/**
 * Audit Probe for WCAG 1.4.10 and Responsive Layout Integrity
 * Asserts:
 * (a) no element.right > viewport width without an explicitly scrollable ancestor (overflow-x: auto | scroll)
 * (b) no page horizontal scroll (document.documentElement and document.body scrollWidth <= window.innerWidth)
 * (c) profile button fully visible and accessible within the viewport bounds
 */
export async function auditResponsiveProbe(page: Page): Promise<ProbeResult> {
  return await page.evaluate(() => {
    const innerWidth = window.innerWidth
    const docElem = document.documentElement
    const body = document.body

    // (b) Check page horizontal scroll
    const docScrollWidth = Math.max(docElem.scrollWidth, body.scrollWidth)
    const hasPageHScroll = docScrollWidth > innerWidth + 1 // 1px subpixel tolerance

    // (a) Inspect all visible DOM elements for illegal horizontal overflow without a scrollable parent
    const allElements = Array.from(document.querySelectorAll<HTMLElement>('*'))
    const clippedElements: Array<{ tag: string; className: string; id: string; right: number; innerWidth: number }> = []

    for (const el of allElements) {
      // Skip script, style, SVG sub-elements, head
      const tagName = el.tagName.toLowerCase()
      if (['script', 'style', 'path', 'defs', 'lineargradient', 'circle', 'svg'].includes(tagName)) continue

      const rect = el.getBoundingClientRect()
      // Skip non-rendered or zero-dimension elements
      if (rect.width === 0 && rect.height === 0) continue

      // Check if element right exceeds viewport width (with 1.5px subpixel tolerance)
      if (rect.right > innerWidth + 1.5) {
        // Trace ancestors: is there a scrollable ancestor with overflow-x auto or scroll?
        let hasScrollableAncestor = false
        let ancestor: HTMLElement | null = el.parentElement

        while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
          const style = window.getComputedStyle(ancestor)
          if (
            style.overflowX === 'auto' ||
            style.overflowX === 'scroll' ||
            ancestor.classList.contains('overflow-x-auto') ||
            ancestor.classList.contains('rail-edge-fade')
          ) {
            hasScrollableAncestor = true
            break
          }
          ancestor = ancestor.parentElement
        }

        if (!hasScrollableAncestor) {
          clippedElements.push({
            tag: tagName,
            className: el.className ? String(el.className).slice(0, 80) : '',
            id: el.id || '',
            right: Math.round(rect.right),
            innerWidth,
          })
        }
      }
    }

    // (c) Profile button fully in viewport
    const profileBtn =
      document.querySelector<HTMLElement>('[data-testid="workspace-profile-btn"]') ||
      document.querySelector<HTMLElement>('.workspace-profile-trigger') ||
      document.querySelector<HTMLElement>('button[aria-label*="Profile" i]') ||
      document.querySelector<HTMLElement>('.workspace-header-right button:last-child')

    let profileButtonInViewport = false
    let profileButtonBounds: { left: number; right: number; top: number; bottom: number } | undefined

    if (profileBtn) {
      const pRect = profileBtn.getBoundingClientRect()
      profileButtonBounds = {
        left: Math.round(pRect.left),
        right: Math.round(pRect.right),
        top: Math.round(pRect.top),
        bottom: Math.round(pRect.bottom),
      }
      profileButtonInViewport =
        pRect.right <= innerWidth + 1 &&
        pRect.left >= 0 &&
        pRect.top >= 0 &&
        pRect.bottom <= window.innerHeight
    }

    return {
      hasPageHScroll,
      documentScrollWidth: docScrollWidth,
      windowInnerWidth: innerWidth,
      clippedElements,
      profileButtonInViewport,
      profileButtonBounds,
    }
  })
}

/**
 * Promoted Playwright Custom Assertion: toPassResponsiveProbe
 * Evaluates the 3 core responsive guardrail promises simultaneously:
 * (a) No element.right > viewport width without a scrollable ancestor
 * (b) No document horizontal scroll
 * (c) Profile button fully reachable within viewport
 */
export const expect = baseExpect.extend({
  async toPassResponsiveProbe(page: Page, options: ResponsiveProbeOptions = {}) {
    const result = await auditResponsiveProbe(page)
    const issues: string[] = []

    if (result.hasPageHScroll) {
      issues.push(
        `Illegal page horizontal scroll detected: scrollWidth (${result.documentScrollWidth}px) exceeds viewport width (${result.windowInnerWidth}px)`
      )
    }

    if (result.clippedElements.length > 0) {
      issues.push(
        `${result.clippedElements.length} element(s) spilling past viewport (${result.windowInnerWidth}px) without a scrollable ancestor:\n` +
          result.clippedElements
            .map(
              (el, i) =>
                `  ${i + 1}. <${el.tag}${el.id ? ` id="${el.id}"` : ''}${el.className ? ` class="${el.className}"` : ''}> right=${el.right}px`
            )
            .join('\n')
      )
    }

    const checkProfile = options.requireProfile !== false
    if (checkProfile && !result.profileButtonInViewport) {
      issues.push(
        `Profile / Sign-out button is clipped or not reachable within viewport bounds: ${JSON.stringify(
          result.profileButtonBounds || 'not found'
        )}`
      )
    }

    const pass = issues.length === 0
    const label = options.pageName
      ? `[${options.pageName} @ ${options.viewportName || `${result.windowInnerWidth}px`}] `
      : `[${options.viewportName || `${result.windowInnerWidth}px`}] `

    return {
      pass,
      message: () =>
        pass
          ? `${label}Responsive layout probe passed (no h-scroll, no unrailed clipped elements, profile button reachable)`
          : `${label}Responsive layout probe failed with ${issues.length} violation(s):\n${issues.map((iss) => `• ${iss}`).join('\n')}`,
    }
  },
})
