/**
 * PreOne OS — Global Dynamic Shell Glow & Theme Accent System
 * Canonical configuration, token derivation, DOM synchronization, and persistence.
 */

export type GlowIntensity = 'subtle' | 'balanced' | 'prominent'
export type GlowStyle = 'soft' | 'gradient' | 'edge-highlight'
export type GlowColorMode = 'theme' | 'custom'
export type GlowApplyTarget = 'both' | 'header' | 'footer'

export interface ShellGlowConfig {
  enabled: boolean
  intensity: GlowIntensity
  style: GlowStyle
  colorMode: GlowColorMode
  customAccent: string
  applyTo: GlowApplyTarget
}

export interface ThemePreset {
  id: string
  name: string
  primary: string
  accent: string
  description: string
}

export const PREONE_THEME_PRESETS: ThemePreset[] = [
  {
    id: 'purple',
    name: 'PreOne Purple',
    primary: '#7C3AED',
    accent: '#3B82F6',
    description: 'Canonical royal purple with subtle cyan/blue accent',
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    primary: '#2563EB',
    accent: '#06B6D4',
    description: 'Crisp corporate sapphire with sky cyan warmth',
  },
  {
    id: 'green',
    name: 'Emerald Mint',
    primary: '#059669',
    accent: '#10B981',
    description: 'Fresh botanical emerald with bright mint reflection',
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    primary: '#D97706',
    accent: '#F59E0B',
    description: 'Warm gold and radiant amber halo',
  },
  {
    id: 'rose',
    name: 'Berry Rose',
    primary: '#E11D48',
    accent: '#A855F7',
    description: 'Playful preschool magenta rose with soft lavender accent',
  },
  {
    id: 'slate',
    name: 'Nordic Slate',
    primary: '#475569',
    accent: '#64748B',
    description: 'Minimalist neutral graphite with whisper-soft border',
  },
]

export const DEFAULT_SHELL_GLOW_CONFIG: ShellGlowConfig = {
  enabled: true,
  intensity: 'balanced',
  style: 'gradient',
  colorMode: 'theme',
  customAccent: '#7C3AED',
  applyTo: 'footer',
}

const STORAGE_KEY_GLOW = 'preone-shell-glow'
const STORAGE_KEY_PRESET = 'preone-theme-preset'
const STORAGE_KEY_PRIMARY = 'preone-primary-color'
const STORAGE_KEY_ACCENT = 'preone-accent-color'

/**
 * Reads glow settings from localStorage safely (or returns defaults)
 */
export function getStoredShellGlowConfig(): ShellGlowConfig {
  if (typeof window === 'undefined') return DEFAULT_SHELL_GLOW_CONFIG
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GLOW)
    if (!raw) return DEFAULT_SHELL_GLOW_CONFIG
    const parsed = JSON.parse(raw)
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_SHELL_GLOW_CONFIG.enabled,
      intensity: ['subtle', 'balanced', 'prominent'].includes(parsed.intensity)
        ? parsed.intensity
        : DEFAULT_SHELL_GLOW_CONFIG.intensity,
      style: ['soft', 'gradient', 'edge-highlight'].includes(parsed.style)
        ? parsed.style
        : DEFAULT_SHELL_GLOW_CONFIG.style,
      colorMode: ['theme', 'custom'].includes(parsed.colorMode)
        ? parsed.colorMode
        : DEFAULT_SHELL_GLOW_CONFIG.colorMode,
      customAccent: typeof parsed.customAccent === 'string' && parsed.customAccent.startsWith('#')
        ? parsed.customAccent
        : DEFAULT_SHELL_GLOW_CONFIG.customAccent,
      applyTo: ['both', 'header', 'footer'].includes(parsed.applyTo)
        ? parsed.applyTo
        : DEFAULT_SHELL_GLOW_CONFIG.applyTo,
    }
  } catch {
    return DEFAULT_SHELL_GLOW_CONFIG
  }
}

/**
 * Apply the glow configuration to document.documentElement CSS variables & data attributes.
 */
export function applyShellGlowToDom(config: ShellGlowConfig, overridePrimary?: string, overrideAccent?: string): void {
  if (typeof document === 'undefined') return
  const doc = document.documentElement

  // 1. Data attributes for selector hooks
  doc.setAttribute('data-shell-glow', config.enabled ? 'on' : 'off')
  doc.setAttribute('data-shell-glow-intensity', config.intensity)
  doc.setAttribute('data-shell-glow-style', config.style)
  doc.setAttribute('data-shell-glow-apply', config.applyTo)

  // 2. CSS variables for intensity tuning
  doc.style.setProperty('--shell-glow-enabled', config.enabled ? '1' : '0')

  let opacity = '0.18'
  let hoverOpacity = '0.32'
  let borderOpacity = '0.75'
  let hoverBorderOpacity = '0.95'
  let blur = '14px'
  let spread = '1px'

  if (config.intensity === 'subtle') {
    opacity = '0.10'
    hoverOpacity = '0.20'
    borderOpacity = '0.45'
    hoverBorderOpacity = '0.65'
    blur = '8px'
    spread = '0px'
  } else if (config.intensity === 'prominent') {
    opacity = '0.28'
    hoverOpacity = '0.42'
    borderOpacity = '1.0'
    hoverBorderOpacity = '1.0'
    blur = '20px'
    spread = '2px'
  }

  doc.style.setProperty('--shell-glow-opacity', opacity)
  doc.style.setProperty('--shell-glow-hover-opacity', hoverOpacity)
  doc.style.setProperty('--shell-glow-border-opacity', borderOpacity)
  doc.style.setProperty('--shell-glow-hover-border-opacity', hoverBorderOpacity)
  doc.style.setProperty('--shell-glow-blur', blur)
  doc.style.setProperty('--shell-glow-spread', spread)

  // 3. Resolve active primary and secondary colors
  let primaryColor = overridePrimary || 'var(--primary)'
  let secondaryColor = overrideAccent || 'var(--accent)'

  if (config.colorMode === 'custom' && config.customAccent) {
    primaryColor = config.customAccent
    secondaryColor = config.customAccent
  }

  doc.style.setProperty('--shell-glow-primary', primaryColor)
  doc.style.setProperty('--shell-glow-secondary', secondaryColor)

  // 4. Dispatch in-memory event so open components react
  window.dispatchEvent(new CustomEvent('preone-shell-glow-updated', { detail: config }))
}

/**
 * Save glow settings to localStorage and optional API endpoint
 */
export async function saveShellGlowConfig(config: ShellGlowConfig): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_GLOW, JSON.stringify(config))
  }
  applyShellGlowToDom(config)

  // Asynchronously persist to User.preferences
  try {
    await fetch('/api/v1/settings/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shellGlow: config }),
    })
  } catch {
    // quiet persistence failure
  }
}

/**
 * Apply application-wide accent color or preset
 */
export function applyThemePresetToDom(primary: string, accent: string, presetId?: string): void {
  if (typeof document === 'undefined') return
  const doc = document.documentElement

  doc.style.setProperty('--primary', primary)
  doc.style.setProperty('--preone-primary', primary)
  doc.style.setProperty('--po-primary', primary)
  doc.style.setProperty('--accent', accent)
  doc.style.setProperty('--brand-ambient-wash', `radial-gradient(ellipse at top left, color-mix(in srgb, ${primary} 8%, transparent), transparent 70%)`)

  // Sync to glow
  doc.style.setProperty('--shell-glow-primary', primary)
  doc.style.setProperty('--shell-glow-secondary', accent)

  if (typeof window !== 'undefined') {
    if (presetId) localStorage.setItem(STORAGE_KEY_PRESET, presetId)
    localStorage.setItem(STORAGE_KEY_PRIMARY, primary)
    localStorage.setItem(STORAGE_KEY_ACCENT, accent)
    window.dispatchEvent(
      new CustomEvent('preone-theme-preset-changed', {
        detail: { primary, accent, presetId },
      }),
    )
  }
}

/**
 * Save theme preset to localStorage and user preferences
 */
export async function saveThemePreset(primary: string, accent: string, presetId?: string): Promise<void> {
  applyThemePresetToDom(primary, accent, presetId)
  try {
    await fetch('/api/v1/settings/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        themePreset: presetId || 'custom',
        themePrimaryColor: primary,
        themeAccentColor: accent,
      }),
    })
  } catch {
    // quiet
  }
}
