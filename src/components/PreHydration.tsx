'use client'

// Module-scope side effect: this file is evaluated at bundle-load time on the
// browser, which always precedes React's hydrateRoot pass. That lets us mutate
// the DOM to match what React rendered server-side BEFORE hydration compares
// them, without ever emitting a <script> element into React's tree.
//
// 1. Restore the persisted theme so the very first paint (and hydrate) matches.
// 2. Strip attributes injected by browser extensions (e.g. 1Password's
//    `fdprocessedid`, `data-lp-*`) before hydration, preventing spurious
//    hydration-mismatch warnings on every input/button/select in the app.

if (typeof window !== 'undefined') {
  try {
    const stored = localStorage.getItem('preone-theme') || localStorage.getItem('preone_theme')
    let isDark = false
    if (stored === 'dark') {
      isDark = true
    } else if (stored === 'light') {
      isDark = false
    } else {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    const resolvedTheme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', resolvedTheme)
    document.documentElement.classList.toggle('dark', isDark)

    const syncThemeColor = (dark: boolean) => {
      const meta = document.getElementById('app-theme-color-meta') || document.querySelector('meta[name="theme-color"]')
      if (meta) {
        meta.setAttribute('content', dark ? '#0B0F19' : '#F7F8FC')
      }
    }
    syncThemeColor(isDark)

    // Observe runtime changes to document.documentElement (data-theme or class='dark')
    const themeObserver = new MutationObserver(() => {
      const isCurrentlyDark =
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        document.documentElement.classList.contains('dark')
      syncThemeColor(isCurrentlyDark)
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    })

    const primary = localStorage.getItem('preone-primary-color')
    const accent = localStorage.getItem('preone-accent-color')
    if (primary) {
      document.documentElement.style.setProperty('--primary', primary)
      document.documentElement.style.setProperty('--preone-primary', primary)
      document.documentElement.style.setProperty('--po-primary', primary)
      document.documentElement.style.setProperty('--shell-glow-primary', primary)
    }
    if (accent) {
      document.documentElement.style.setProperty('--accent', accent)
      document.documentElement.style.setProperty('--shell-glow-secondary', accent)
    }

    const glowRaw = localStorage.getItem('preone-shell-glow')
    if (glowRaw) {
      const g = JSON.parse(glowRaw)
      document.documentElement.setAttribute('data-shell-glow', g.enabled ? 'on' : 'off')
      document.documentElement.setAttribute('data-shell-glow-intensity', g.intensity || 'balanced')
      document.documentElement.setAttribute('data-shell-glow-style', g.style || 'gradient')
      document.documentElement.setAttribute('data-shell-glow-apply', g.applyTo || 'footer')
      document.documentElement.style.setProperty('--shell-glow-enabled', g.enabled ? '1' : '0')

      let opacity = '0.16'
      let hoverOpacity = '0.28'
      let borderOpacity = '0.70'
      let hoverBorderOpacity = '0.95'
      let blur = '14px'
      let spread = '1px'

      if (g.intensity === 'subtle') {
        opacity = '0.10'
        hoverOpacity = '0.18'
        borderOpacity = '0.45'
        hoverBorderOpacity = '0.65'
        blur = '8px'
        spread = '0px'
      } else if (g.intensity === 'prominent') {
        opacity = '0.26'
        hoverOpacity = '0.40'
        borderOpacity = '0.95'
        hoverBorderOpacity = '1.0'
        blur = '20px'
        spread = '2px'
      }

      document.documentElement.style.setProperty('--shell-glow-opacity', opacity)
      document.documentElement.style.setProperty('--shell-glow-hover-opacity', hoverOpacity)
      document.documentElement.style.setProperty('--shell-glow-border-opacity', borderOpacity)
      document.documentElement.style.setProperty('--shell-glow-hover-border-opacity', hoverBorderOpacity)
      document.documentElement.style.setProperty('--shell-glow-blur', blur)
      document.documentElement.style.setProperty('--shell-glow-spread', spread)

      if (g.colorMode === 'custom' && g.customAccent) {
        document.documentElement.style.setProperty('--shell-glow-primary', g.customAccent)
        document.documentElement.style.setProperty('--shell-glow-secondary', g.customAccent)
      }
    }
  } catch {}

  const BAD_PREFIXES = ['fdprocessedid', 'data-lp-', 'data-frm', 'autocapitalize']
  const MATCHED_ATTRS = [
    'fdprocessedid',
    'data-lp-anchor',
    'data-lp-custom-fields-display',
    'data-lp-mo-localize',
    'data-lp-form-grouped-vault-products',
    'data-lp-form-processing',
    'data-lp-no-op',
    'autocapitalize',
  ]

  function strip(node: Element) {
    const attrs = node.attributes
    if (!attrs) return
    for (let i = attrs.length - 1; i >= 0; i--) {
      const name = attrs[i].name
      if (BAD_PREFIXES.some((p) => name.indexOf(p) === 0)) node.removeAttribute(name)
    }
  }

  strip(document.documentElement)
  try {
    document.querySelectorAll('*').forEach(strip)
  } catch {}

  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes') strip(m.target as Element)
      else if (m.type === 'childList') m.addedNodes.forEach((n) => n.nodeType === 1 && strip(n as Element))
    }
  })
  mo.observe(document.documentElement, {
    subtree: true,
    attributes: true,
    attributeFilter: MATCHED_ATTRS,
    childList: true,
  })
}

export default function PreHydration() {
  return null
}