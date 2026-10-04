'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  Palette,
  Sliders,
  Check,
  RotateCcw,
  Layers,
  Eye,
  SlidersHorizontal,
  Compass,
} from 'lucide-react'
import {
  PREONE_THEME_PRESETS,
  DEFAULT_SHELL_GLOW_CONFIG,
  type ShellGlowConfig,
  type GlowIntensity,
  type GlowStyle,
  type GlowColorMode,
  type GlowApplyTarget,
  getStoredShellGlowConfig,
  saveShellGlowConfig,
  applyShellGlowToDom,
  saveThemePreset,
} from '@/lib/theme/shell-glow'
import { useToast } from '@/components/preone/Toast'

interface ThemeGlowSettingsProps {
  onSaved?: () => void
  showTitle?: boolean
}

export function ThemeGlowSettings({ onSaved, showTitle = true }: ThemeGlowSettingsProps) {
  const toast = useToast()

  // State
  const [glowConfig, setGlowConfig] = useState<ShellGlowConfig>(DEFAULT_SHELL_GLOW_CONFIG)
  const [activePresetId, setActivePresetId] = useState<string>('purple')
  const [customPrimary, setCustomPrimary] = useState<string>('#7C3AED')
  const [customAccent, setCustomAccent] = useState<string>('#3B82F6')
  const [saving, setSaving] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  // Load stored state on mount
  useEffect(() => {
    setMounted(true)
    const storedConfig = getStoredShellGlowConfig()
    setGlowConfig(storedConfig)

    if (typeof window !== 'undefined') {
      const storedPreset = localStorage.getItem('preone-theme-preset') || 'purple'
      setActivePresetId(storedPreset)

      const storedPrimary = localStorage.getItem('preone-primary-color')
      const storedAccent = localStorage.getItem('preone-accent-color')
      if (storedPrimary) setCustomPrimary(storedPrimary)
      if (storedAccent) setCustomAccent(storedAccent)
    }
  }, [])

  // Live apply glow config changes to DOM immediately
  const updateGlowConfig = useCallback((partial: Partial<ShellGlowConfig>) => {
    setGlowConfig((prev) => {
      const next = { ...prev, ...partial }
      applyShellGlowToDom(next)
      return next
    })
  }, [])

  // Preset selection
  const handleSelectPreset = (presetId: string) => {
    setActivePresetId(presetId)
    const found = PREONE_THEME_PRESETS.find((p) => p.id === presetId)
    if (found) {
      saveThemePreset(found.primary, found.accent, found.id)
      applyShellGlowToDom(glowConfig, found.primary, found.accent)
    }
  }

  // Custom colors update
  const handleCustomPrimaryChange = (color: string) => {
    setCustomPrimary(color)
    setActivePresetId('custom')
    saveThemePreset(color, customAccent, 'custom')
    applyShellGlowToDom(glowConfig, color, customAccent)
  }

  const handleCustomAccentChange = (color: string) => {
    setCustomAccent(color)
    setActivePresetId('custom')
    saveThemePreset(customPrimary, color, 'custom')
    applyShellGlowToDom(glowConfig, customPrimary, color)
  }

  // Save all settings to persistence
  const handleSave = async () => {
    setSaving(true)
    try {
      await saveShellGlowConfig(glowConfig)
      if (activePresetId === 'custom') {
        await saveThemePreset(customPrimary, customAccent, 'custom')
      } else {
        const found = PREONE_THEME_PRESETS.find((p) => p.id === activePresetId)
        if (found) {
          await saveThemePreset(found.primary, found.accent, found.id)
        }
      }
      toast.success('Shell appearance & glow settings saved')
      onSaved?.()
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Reset to default
  const handleReset = async () => {
    setGlowConfig(DEFAULT_SHELL_GLOW_CONFIG)
    setActivePresetId('purple')
    const purple = PREONE_THEME_PRESETS[0]
    await saveThemePreset(purple.primary, purple.accent, purple.id)
    await saveShellGlowConfig(DEFAULT_SHELL_GLOW_CONFIG)
    toast.info('Appearance reset to PreOne defaults')
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[var(--primary)]" />
              <h3 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">
                Global Shell Glow & Theme Accents
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
              Elevate the global header and floating bottom dock with subtle, adaptive gradient borders and atmospheric glow.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-sm"
              title="Reset glow and theme to defaults"
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary btn-sm"
            >
              <Check size={13} />
              <span>{saving ? 'Saving...' : 'Apply & Save'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Section 1: Color Presets ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette size={15} className="text-[var(--primary)]" />
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Theme Accent Presets</h4>
        </div>
        <p className="text-xs text-[var(--foreground-muted)] mb-3">
          Select an authoritative color theme. Glow highlights and navigation borders adapt instantly across all pages.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PREONE_THEME_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--surface-hover)] shadow-sm ring-2 ring-[var(--primary)]/20'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full shadow-xs border border-white/20"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs -ml-1 border border-white/20"
                      style={{ backgroundColor: preset.accent }}
                    />
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-[var(--foreground)]">{preset.name}</span>
                <span className="text-[10.5px] text-[var(--foreground-muted)] line-clamp-1 mt-0.5">
                  {preset.description}
                </span>
              </button>
            )
          })}
        </div>

        {/* Custom Hex Color Pickers */}
        <div className="mt-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-[var(--foreground)]">Custom Accent:</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[var(--foreground-muted)]">Primary:</span>
            <input
              type="color"
              value={customPrimary}
              onChange={(e) => handleCustomPrimaryChange(e.target.value)}
              className="w-7 h-7 p-0 rounded-md border border-[var(--border)] cursor-pointer bg-transparent"
            />
            <code className="text-[11px] font-mono uppercase text-[var(--foreground)]">{customPrimary}</code>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[var(--foreground-muted)]">Accent:</span>
            <input
              type="color"
              value={customAccent}
              onChange={(e) => handleCustomAccentChange(e.target.value)}
              className="w-7 h-7 p-0 rounded-md border border-[var(--border)] cursor-pointer bg-transparent"
            />
            <code className="text-[11px] font-mono uppercase text-[var(--foreground)]">{customAccent}</code>
          </label>
          {activePresetId === 'custom' && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10.5px] font-medium ml-auto">
              Custom Active
            </span>
          )}
        </div>
      </div>

      {/* ── Section 2: Glow Controls ── */}
      <div className="pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Sliders size={15} className="text-[var(--primary)]" />
            <h4 className="text-sm font-semibold text-[var(--foreground)]">Navigation Glow Configuration</h4>
          </div>
          {/* Master Enable / Disable Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs font-medium text-[var(--foreground)]">
              {glowConfig.enabled ? 'Glow Enabled' : 'Glow Disabled'}
            </span>
            <input
              type="checkbox"
              checked={glowConfig.enabled}
              onChange={(e) => updateGlowConfig({ enabled: e.target.checked })}
              className="sr-only"
            />
            <div
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                glowConfig.enabled ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  glowConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>

        <div className={`space-y-4 transition-opacity ${glowConfig.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          {/* 1. Intensity Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                Glow Intensity
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)]">
                {(['subtle', 'balanced', 'prominent'] as GlowIntensity[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateGlowConfig({ intensity: lvl })}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                      glowConfig.intensity === lvl
                        ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-xs'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-1">
                {glowConfig.intensity === 'subtle' && 'Minimal whisper glow for understated elegance.'}
                {glowConfig.intensity === 'balanced' && 'Default balanced luminance with soft gradient border.'}
                {glowConfig.intensity === 'prominent' && 'Pronounced halo accent for vivid navigation focus.'}
              </p>
            </div>

            {/* 2. Glow Style */}
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                Glow Style
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)]">
                {(
                  [
                    { id: 'soft', label: 'Soft' },
                    { id: 'gradient', label: 'Gradient' },
                    { id: 'edge-highlight', label: 'Edge' },
                  ] as { id: GlowStyle; label: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => updateGlowConfig({ style: s.id })}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                      glowConfig.style === s.id
                        ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-xs'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-1">
                {glowConfig.style === 'soft' && 'Diffuse ambient aura with softened perimeter lines.'}
                {glowConfig.style === 'gradient' && '1px precision gradient border blending into soft glow.'}
                {glowConfig.style === 'edge-highlight' && 'Sharp high-contrast stroke outline with light halo.'}
              </p>
            </div>

            {/* 3. Apply Target */}
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                Apply Glow To
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg border border-[var(--border-subtle)]">
                {(
                  [
                    { id: 'both', label: 'Both' },
                    { id: 'header', label: 'Header' },
                    { id: 'footer', label: 'Dock' },
                  ] as { id: GlowApplyTarget; label: string }[]
                ).map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => updateGlowConfig({ applyTo: target.id })}
                    className={`px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
                      glowConfig.applyTo === target.id
                        ? 'bg-[var(--surface-card)] text-[var(--foreground)] shadow-xs'
                        : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {target.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[var(--foreground-muted)] mt-1">
                {glowConfig.applyTo === 'both' && 'Synchronized glow on top header and bottom floating dock.'}
                {glowConfig.applyTo === 'header' && 'Glow isolated exclusively on global top header.'}
                {glowConfig.applyTo === 'footer' && 'Glow isolated exclusively on bottom floating dock.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Live Interactive Preview Card ── */}
      <div className="pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 mb-2">
          <Eye size={15} className="text-[var(--primary)]" />
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Live Surface Preview</h4>
        </div>
        <div className="p-6 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-subtle)] relative overflow-hidden flex flex-col items-center justify-center gap-6 min-h-[160px]">
          {/* Mock Header */}
          <div
            className="workspace-floating-surface w-full max-w-[480px] h-10 px-4 flex items-center justify-between"
            style={{
              opacity: glowConfig.applyTo === 'footer' ? 0.6 : 1,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--primary)]">
                P
              </span>
              <span className="text-xs font-semibold text-[var(--foreground)]">PreOne Header</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-[var(--foreground-muted)]">Active</span>
            </div>
          </div>

          {/* Mock Dock with Center Orb */}
          <div
            className="workspace-floating-surface w-full max-w-[380px] h-10 px-4 flex items-center justify-between"
            style={{
              opacity: glowConfig.applyTo === 'header' ? 0.6 : 1,
            }}
          >
            <span className="text-[11px] font-medium text-[var(--foreground-muted)]">Home</span>
            {/* Center mock orb */}
            <div className="dock-orb-container -mt-3">
              <div className="dock-orb w-8 h-8 !translate-y-0 !shadow-md flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-[var(--primary)]" />
              </div>
            </div>
            <span className="text-[11px] font-medium text-[var(--foreground-muted)]">Settings</span>
          </div>
        </div>
      </div>
    </div>
  )
}
