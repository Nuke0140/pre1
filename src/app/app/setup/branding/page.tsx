'use client'

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Palette, Upload, RefreshCw, RotateCcw, Save, CheckCircle2,
  AlertTriangle, Building2, Trash2, Image as ImageIcon, Sparkles
} from 'lucide-react'
import { PageHead, Skeleton, Breadcrumbs, SetupScopeBadge } from '@/components/preone'
import { Modal } from '@/components/preone/Modal'
import { useToast } from '@/components/preone/Toast'
import {
  PREONE_BRANDING_DEFAULTS,
  isValidHexColor,
  evaluateColorContrast,
  type BrandingConfig
} from '@/lib/branding-types'
import {
  PREONE_THEME_PRESETS,
  DEFAULT_SHELL_GLOW_CONFIG,
  getStoredShellGlowConfig,
  saveShellGlowConfig,
  applyShellGlowToDom,
  type ShellGlowConfig,
  type GlowIntensity,
  type GlowStyle,
} from '@/lib/theme/shell-glow'

export default function BrandingPage() {
  const toast = useToast()
  const router = useRouter()

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [removeLogoModalOpen, setRemoveLogoModalOpen] = useState(false)

  // Form Data (Draft state)
  const [schoolName, setSchoolName] = useState('PreOne Preschool')
  const [schoolCode, setSchoolCode] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primaryColor, setPrimaryColor] = useState('#7C3AED')
  const [isPrimaryCustom, setIsPrimaryCustom] = useState(false)
  const [accentColor, setAccentColor] = useState('#3B82F6')
  const [isAccentCustom, setIsAccentCustom] = useState(false)
  const [glowConfig, setGlowConfig] = useState<ShellGlowConfig>(DEFAULT_SHELL_GLOW_CONFIG)

  // File Upload Ref
  const logoFileInputRef = useRef<HTMLInputElement | null>(null)

  // Initial loaded snapshot to check dirty state
  const [initialData, setInitialData] = useState<BrandingConfig | null>(null)

  // 1. Load Canonical Branding Data
  const loadBranding = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/setup/config/BRANDING')
      const json = await res.json()

      if (json.success && json.data) {
        const d = json.data as BrandingConfig
        setSchoolName(d.schoolName || '')
        setSchoolCode(d.schoolCode || '')
        setLogoUrl(d.logoUrl || null)
        setPrimaryColor(d.primaryColor || PREONE_BRANDING_DEFAULTS.primaryColor)
        setIsPrimaryCustom(d.primaryColor !== PREONE_BRANDING_DEFAULTS.primaryColor)
        setAccentColor(d.accentColor || PREONE_BRANDING_DEFAULTS.accentColor)
        setIsAccentCustom(d.accentColor !== PREONE_BRANDING_DEFAULTS.accentColor)

        if (d.footerGlow) {
          setGlowConfig(d.footerGlow)
          applyShellGlowToDom(d.footerGlow, d.primaryColor, d.accentColor)
        } else {
          const stored = getStoredShellGlowConfig()
          setGlowConfig(stored)
          applyShellGlowToDom(stored, d.primaryColor, d.accentColor)
        }

        setInitialData(d)
      } else {
        // Fallback to defaults
        setPrimaryColor(PREONE_BRANDING_DEFAULTS.primaryColor)
        setAccentColor(PREONE_BRANDING_DEFAULTS.accentColor)
        const stored = getStoredShellGlowConfig()
        setGlowConfig(stored)
      }
    } catch (e: any) {
      toast.error('Failed to load branding', e.message)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadBranding()
  }, [loadBranding])

  // 2. Real-time validations
  const isPrimaryValid = useMemo(() => isValidHexColor(primaryColor), [primaryColor])
  const isAccentValid = useMemo(() => isValidHexColor(accentColor), [accentColor])

  const contrastAssessment = useMemo(() => {
    if (!isPrimaryValid || !isAccentValid) return { isWeakContrast: false, warningMessage: null }
    return evaluateColorContrast(primaryColor, accentColor)
  }, [primaryColor, accentColor, isPrimaryValid, isAccentValid])

  // 3. Branding Status Indicator
  const brandingStatus = useMemo(() => {
    const hasLogo = Boolean(logoUrl)
    const hasCustomColor = isPrimaryCustom || isAccentCustom

    if (hasLogo && hasCustomColor) {
      return {
        label: 'Branding configured',
        cls: 'b-success',
        desc: 'Custom school identity and colors are active across all portals.',
      }
    }
    if (hasLogo || hasCustomColor) {
      return {
        label: 'Branding partially configured',
        cls: 'b-warning',
        desc: 'Some visual identity elements are configured with PreOne defaults.',
      }
    }
    return {
      label: 'Branding not configured',
      cls: 'b-neutral',
      desc: 'Using standard PreOne visual identity and theme defaults.',
    }
  }, [logoUrl, isPrimaryCustom, isAccentCustom])

  // 4. Logo File Upload Handler
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Allowed types: PNG, JPEG, SVG, WebP
    const allowedMime = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedMime.includes(file.type.toLowerCase())) {
      toast.error('Invalid file format', 'Please upload a PNG, JPG, SVG, or WebP image.')
      return
    }

    // Size check: max 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large', 'School logo must be under 2MB in size.')
      return
    }

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')

      const res = await fetch('/api/v1/setup/branding/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success && json.data?.url) {
        setLogoUrl(json.data.url)
        toast.success('Logo uploaded', 'Logo uploaded successfully. Click "Save Changes" to apply globally.')
      } else {
        toast.error('Upload failed', json.error?.message || 'Failed to upload logo.')
      }
    } catch (err: any) {
      toast.error('Upload error', err.message || 'Network error while uploading logo.')
    } finally {
      setUploadingLogo(false)
      if (logoFileInputRef.current) logoFileInputRef.current.value = ''
    }
  }

  // 5. Save Changes Action
  const handleSaveChanges = async () => {
    if (!isPrimaryValid) {
      toast.error('Invalid Primary Color', 'Please provide a valid 6-digit HEX color (e.g. #7C3AED).')
      return
    }
    if (!isAccentValid) {
      toast.error('Invalid Accent Color', 'Please provide a valid 6-digit HEX color (e.g. #3B82F6).')
      return
    }

    if (logoUrl && (logoUrl.startsWith('data:') || logoUrl.startsWith('blob:'))) {
      toast.error('Invalid Logo', 'Please upload your logo file again.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        primaryColor: isPrimaryCustom ? primaryColor : PREONE_BRANDING_DEFAULTS.primaryColor,
        accentColor: isAccentCustom ? accentColor : PREONE_BRANDING_DEFAULTS.accentColor,
        logoUrl: logoUrl || null,
        footerGlow: glowConfig,
      }

      const res = await fetch('/api/v1/setup/config/BRANDING', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error?.message || 'Could not save branding configuration.')
      }

      // Synchronize client-side glow config
      await saveShellGlowConfig(glowConfig)

      // Mark setup step complete if in setup context
      await fetch('/api/v1/setup/steps/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      }).catch(() => {})

      toast.success('Branding updated successfully', 'School visual identity and colors have been saved.')
      setInitialData({
        ...payload,
        schoolName,
        schoolCode,
        layout: 'WINDOWS_SHELL',
        bannerUrl: null,
      })

      // Refresh server-side components across workspace
      router.refresh()
    } catch (e: any) {
      toast.error('Save failed', e.message)
    } finally {
      setSaving(false)
    }
  }

  // 6. Reset Theme Action (Preserves Logo & School Profile)
  const handleExecuteResetTheme = async () => {
    setResetting(true)
    try {
      const res = await fetch('/api/v1/setup/config/BRANDING', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_THEME' }),
      })
      const json = await res.json()

      if (!json.success) {
        throw new Error(json.error?.message || 'Could not reset theme settings.')
      }

      setPrimaryColor(PREONE_BRANDING_DEFAULTS.primaryColor)
      setIsPrimaryCustom(false)
      setAccentColor(PREONE_BRANDING_DEFAULTS.accentColor)
      setIsAccentCustom(false)
      setGlowConfig(DEFAULT_SHELL_GLOW_CONFIG)
      await saveShellGlowConfig(DEFAULT_SHELL_GLOW_CONFIG)

      setResetModalOpen(false)
      toast.success('Theme reset to defaults', 'Colors and glow settings were reset. School logo is preserved.')
      router.refresh()
    } catch (e: any) {
      toast.error('Reset failed', e.message)
    } finally {
      setResetting(false)
    }
  }

  // 7. Explicit Remove Logo Action
  const handleExecuteRemoveLogo = async () => {
    setLogoUrl(null)
    setRemoveLogoModalOpen(false)
    toast.info('Logo removed from preview', 'Click "Save Changes" to confirm logo removal.')
  }

  if (loading) {
    return (
      <div className="page-shell" style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
        <Skeleton w="100%" h={60} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20 }}>
          <Skeleton w="100%" h={260} />
          <Skeleton w="100%" h={260} />
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell" style={{ maxWidth: 960, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Breadcrumb Navigation ── */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/app' },
            { label: 'Setup', href: '/app/setup' },
            { label: 'Branding & Theme' },
          ]}
        />
      </div>

      <PageHead
        eyebrow="FOUNDATION SETUP"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span>Branding & Visual Identity Center</span>
            <SetupScopeBadge scope="TENANT" size="md" />
          </div>
        }
        sub="Personalize themes, school colors, ambient navigation glow, and institutional logo (applies to all branches)."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm font-semibold"
              onClick={() => setResetModalOpen(true)}
              disabled={saving || resetting}
            >
              <RotateCcw size={14} style={{ marginRight: 5 }} /> Reset Theme
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm font-bold"
              onClick={handleSaveChanges}
              disabled={saving || resetting || !isPrimaryValid || !isAccentValid}
              style={{ padding: '7px 18px' }}
            >
              {saving ? (
                <>
                  <RefreshCw size={13} className="spin" style={{ marginRight: 6 }} />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={13} style={{ marginRight: 6 }} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        }
      />

      {/* ── Branding Status Card (Modern Pill / Stat Overview) ── */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: 24,
          background: 'var(--card, #fff)',
          borderRadius: 14,
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className={`badge ${brandingStatus.cls}`} style={{ fontSize: 12, padding: '4px 10px', fontWeight: 700 }}>
              {brandingStatus.label}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {brandingStatus.desc}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <ImageIcon size={13} style={{ color: logoUrl ? 'var(--color-success, #10b981)' : 'var(--text-muted)' }} />
              Logo: <strong style={{ color: 'var(--text-primary)' }}>{logoUrl ? 'Configured' : 'Default Mark'}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: primaryColor,
                  border: '1px solid rgba(0,0,0,0.1)',
                  display: 'inline-block',
                }}
              />
              Primary: <strong style={{ color: 'var(--text-primary)' }}>{primaryColor}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: accentColor,
                  border: '1px solid rgba(0,0,0,0.1)',
                  display: 'inline-block',
                }}
              />
              Accent: <strong style={{ color: 'var(--text-primary)' }}>{accentColor}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <Sparkles size={13} style={{ color: glowConfig.enabled ? 'var(--color-success, #10b981)' : 'var(--text-muted)' }} />
              Glow: <strong style={{ color: 'var(--text-primary)' }}>{glowConfig.enabled ? 'ON' : 'OFF'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Workspace Form (Single Clean Column) ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── 1. Brand Colors ── */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: 15, fontWeight: 750, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Palette size={16} /> 1. Brand Colors
              </h3>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Primary color applies to navigation and major buttons; accent color applies to highlights and badges across portals.
            </p>
          </div>

          {/* Contrast Warning Banner if present */}
          {contrastAssessment.isWeakContrast && (
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                padding: 12,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
                fontSize: 12.5,
                color: 'var(--text-primary)',
              }}
            >
              <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <span>{contrastAssessment.warningMessage}</span>
            </div>
          )}

          {/* Quick Theme Presets */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
              Preset Color Palettes
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {PREONE_THEME_PRESETS.map((p) => {
                const isSelected =
                  primaryColor.toUpperCase() === p.primary.toUpperCase() &&
                  accentColor.toUpperCase() === p.accent.toUpperCase()
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPrimaryColor(p.primary)
                      setIsPrimaryCustom(true)
                      setAccentColor(p.accent)
                      setIsAccentCustom(true)
                      applyShellGlowToDom(glowConfig, p.primary, p.accent)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      background: isSelected ? 'var(--surface-hover)' : 'var(--card)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.primary, border: '1px solid rgba(255,255,255,0.4)' }} />
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: p.accent, marginLeft: -5, border: '1px solid rgba(255,255,255,0.4)' }} />
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: isSelected ? 700 : 500, color: 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Primary Color Control */}
            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Primary Color
              </label>

              {/* PreOne Default vs Custom Toggle */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${!isPrimaryCustom ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: 11.5, padding: '4px 10px' }}
                  onClick={() => {
                    setIsPrimaryCustom(false)
                    setPrimaryColor(PREONE_BRANDING_DEFAULTS.primaryColor)
                    applyShellGlowToDom(glowConfig, PREONE_BRANDING_DEFAULTS.primaryColor, accentColor)
                  }}
                >
                  {!isPrimaryCustom && '✓ '}PreOne Default
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${isPrimaryCustom ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: 11.5, padding: '4px 10px' }}
                  onClick={() => setIsPrimaryCustom(true)}
                >
                  {isPrimaryCustom && '✓ '}Custom Color
                </button>
              </div>

              {/* Picker & HEX Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={isPrimaryValid ? primaryColor : PREONE_BRANDING_DEFAULTS.primaryColor}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase()
                    setPrimaryColor(val)
                    setIsPrimaryCustom(true)
                    applyShellGlowToDom(glowConfig, val, accentColor)
                  }}
                  style={{ width: 40, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }}
                />
                <input
                  className="input text-xs font-mono"
                  value={primaryColor}
                  maxLength={7}
                  onChange={(e) => {
                    const val = e.target.value.trim().toUpperCase()
                    setPrimaryColor(val)
                    setIsPrimaryCustom(true)
                    if (isValidHexColor(val)) applyShellGlowToDom(glowConfig, val, accentColor)
                  }}
                  placeholder="#7C3AED"
                />
              </div>
              {!isPrimaryValid && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                  Invalid HEX (e.g. #7C3AED)
                </div>
              )}
            </div>

            {/* Accent Color Control */}
            <div className="field">
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                Accent Color
              </label>

              {/* PreOne Default vs Custom Toggle */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${!isAccentCustom ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: 11.5, padding: '4px 10px' }}
                  onClick={() => {
                    setIsAccentCustom(false)
                    setAccentColor(PREONE_BRANDING_DEFAULTS.accentColor)
                    applyShellGlowToDom(glowConfig, primaryColor, PREONE_BRANDING_DEFAULTS.accentColor)
                  }}
                >
                  {!isAccentCustom && '✓ '}PreOne Default
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${isAccentCustom ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: 11.5, padding: '4px 10px' }}
                  onClick={() => setIsAccentCustom(true)}
                >
                  {isAccentCustom && '✓ '}Custom Color
                </button>
              </div>

              {/* Picker & HEX Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={isAccentValid ? accentColor : PREONE_BRANDING_DEFAULTS.accentColor}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase()
                    setAccentColor(val)
                    setIsAccentCustom(true)
                    applyShellGlowToDom(glowConfig, primaryColor, val)
                  }}
                  style={{ width: 40, height: 38, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0 }}
                />
                <input
                  className="input text-xs font-mono"
                  value={accentColor}
                  maxLength={7}
                  onChange={(e) => {
                    const val = e.target.value.trim().toUpperCase()
                    setAccentColor(val)
                    setIsAccentCustom(true)
                    if (isValidHexColor(val)) applyShellGlowToDom(glowConfig, primaryColor, val)
                  }}
                  placeholder="#3B82F6"
                />
              </div>
              {!isAccentValid && (
                <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>
                  Invalid HEX (e.g. #3B82F6)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 2. Glow Settings ── */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 750, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> 2. Glow Settings
              </h3>
              <button
                type="button"
                onClick={() => {
                  const next = { ...glowConfig, enabled: !glowConfig.enabled, applyTo: 'footer' as const }
                  setGlowConfig(next)
                  applyShellGlowToDom(next, primaryColor, accentColor)
                }}
                className={`btn btn-sm ${glowConfig.enabled ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: 11.5, padding: '3px 12px', borderRadius: 999 }}
              >
                {glowConfig.enabled ? 'Glow: ON' : 'Glow: OFF'}
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Configure the ambient outer glow and 1px gradient accent border on the floating bottom navigation dock.
            </p>
          </div>

          {glowConfig.enabled && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              {/* Glow Intensity */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Glow Intensity
                </label>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', padding: 3, borderRadius: 8 }}>
                  {(['subtle', 'balanced', 'prominent'] as GlowIntensity[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        const next = { ...glowConfig, intensity: lvl, applyTo: 'footer' as const }
                        setGlowConfig(next)
                        applyShellGlowToDom(next, primaryColor, accentColor)
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: 11,
                        fontWeight: glowConfig.intensity === lvl ? 700 : 500,
                        borderRadius: 6,
                        background: glowConfig.intensity === lvl ? 'var(--card)' : 'transparent',
                        color: glowConfig.intensity === lvl ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Glow Style */}
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Glow Style
                </label>
                <div style={{ display: 'flex', gap: 4, background: 'var(--bg-subtle)', padding: 3, borderRadius: 8 }}>
                  {(
                    [
                      { id: 'soft', label: 'Soft Aura' },
                      { id: 'gradient', label: 'Gradient Line' },
                      { id: 'edge-highlight', label: 'Edge Highlight' },
                    ] as { id: GlowStyle; label: string }[]
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        const next = { ...glowConfig, style: s.id, applyTo: 'footer' as const }
                        setGlowConfig(next)
                        applyShellGlowToDom(next, primaryColor, accentColor)
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 6px',
                        fontSize: 11,
                        fontWeight: glowConfig.style === s.id ? 700 : 500,
                        borderRadius: 6,
                        background: glowConfig.style === s.id ? 'var(--card)' : 'transparent',
                        color: glowConfig.style === s.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive Mini Dock Mock within this section */}
          <div
            style={{
              marginTop: 14,
              padding: '14px 16px',
              borderRadius: 12,
              background: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              className="taskbar preone-dock"
              style={{
                height: 38,
                width: '100%',
                maxWidth: 290,
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Home</span>
              <div className="dock-orb-container" style={{ margin: '0 4px' }}>
                <div
                  className="dock-orb"
                  style={{
                    width: 32,
                    height: 32,
                    transform: 'translateY(-4px)',
                    boxShadow: glowConfig.enabled
                      ? `0 4px 14px -2px color-mix(in srgb, ${primaryColor} 50%, transparent)`
                      : 'none',
                  }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: primaryColor }} />
                </div>
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Settings</span>
            </div>
          </div>
        </div>

        {/* ── 3. School Logo ── */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 750, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ImageIcon size={16} /> 3. School Logo
              </h3>
              {logoUrl && (
                <span className="badge b-success" style={{ fontSize: 11, fontWeight: 700 }}>
                  Active Logo
                </span>
              )}
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              Official institutional crest displayed on Login, Application Forms, Admission Dossiers, and Home Launcher.
            </p>
          </div>

          <input
            type="file"
            ref={logoFileInputRef}
            onChange={handleLogoFileUpload}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            style={{ display: 'none' }}
          />

          {logoUrl ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                borderRadius: 12,
                border: '1.5px solid var(--border-default)',
                background: 'var(--bg-subtle)',
                gap: 12,
              }}
            >
              <div
                style={{
                  maxHeight: 100,
                  maxWidth: 240,
                  padding: 8,
                  borderRadius: 10,
                  background: 'var(--card, #fff)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <img
                  src={logoUrl}
                  alt="School Crest"
                  style={{ maxHeight: 84, maxWidth: 220, objectFit: 'contain' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm font-semibold"
                  disabled={uploadingLogo}
                  onClick={() => logoFileInputRef.current?.click()}
                >
                  <Upload size={13} style={{ marginRight: 6 }} />
                  {uploadingLogo ? 'Uploading Logo...' : 'Replace Logo'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm text-danger font-semibold"
                  onClick={() => setRemoveLogoModalOpen(true)}
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={13} style={{ marginRight: 4 }} /> Remove Logo
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                borderRadius: 12,
                border: '2px dashed var(--border-default)',
                background: 'var(--bg-subtle)',
                textAlign: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'var(--card, #fff)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <Building2 size={24} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  No School Logo Configured
                </div>
                <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', margin: '3px 0 10px', maxWidth: 320 }}>
                  Upload a PNG, JPG, WebP, or SVG logo (max 2MB). PreOne will display neutral institutional defaults when no logo is set.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm font-semibold"
                disabled={uploadingLogo}
                onClick={() => logoFileInputRef.current?.click()}
              >
                <Upload size={13} style={{ marginRight: 6 }} />
                {uploadingLogo ? 'Uploading Logo...' : 'Upload School Logo'}
              </button>
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <input
              className="input text-xs"
              placeholder="Or enter direct durable logo URL (https://.../logo.png)"
              value={logoUrl || ''}
              onChange={(e) => setLogoUrl(e.target.value.trim() || null)}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Accepted formats: PNG, JPG, WebP, SVG. Max file size: 2MB. Stored durably in centralized cloud storage.
            </div>
          </div>
        </div>

      </div>

      {/* ── Fixed Footer Action Bar ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--card)',
          borderTop: '1px solid var(--border-default)',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <button
          type="button"
          className="btn btn-outline btn-sm font-semibold"
          onClick={() => setResetModalOpen(true)}
          disabled={saving || resetting}
        >
          <RotateCcw size={14} style={{ marginRight: 6 }} /> Reset Theme
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn-primary font-bold"
            onClick={handleSaveChanges}
            disabled={saving || resetting || !isPrimaryValid || !isAccentValid}
            style={{ padding: '8px 22px', fontSize: 13.5 }}
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="spin" style={{ marginRight: 8 }} />
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={14} style={{ marginRight: 8 }} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── MODAL: Reset Theme Confirmation ── */}
      <Modal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset theme settings to PreOne defaults?"
        subtitle="This will restore PreOne standard colors and glow settings."
        icon={<RotateCcw size={20} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            This will reset <strong>Primary Color</strong>, <strong>Accent Color</strong>, and <strong>Footer Glow</strong>.
          </p>

          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 8,
              padding: 10,
              fontSize: 12.5,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
            <span><strong>Your school logo and legal profile will NOT be removed.</strong></span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setResetModalOpen(false)}
              disabled={resetting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm font-bold bg-danger"
              style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={handleExecuteResetTheme}
              disabled={resetting}
            >
              {resetting ? 'Resetting...' : 'Yes, Reset Theme'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: Remove Logo Confirmation ── */}
      <Modal
        open={removeLogoModalOpen}
        onClose={() => setRemoveLogoModalOpen(false)}
        title="Remove school logo?"
        subtitle="This will remove the logo from official receipts, reports, and portals."
        icon={<Trash2 size={20} />}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Are you sure you want to remove your school logo? PreOne will display the school initials placeholder instead.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setRemoveLogoModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm font-bold"
              style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={handleExecuteRemoveLogo}
            >
              Remove Logo
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
