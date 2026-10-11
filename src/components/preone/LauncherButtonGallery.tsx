'use client'

import React, { useState } from 'react'
import {
  PreOneLauncherButton,
  PreOnePlanetMark,
  LauncherSize,
  LauncherState,
  LauncherTheme,
} from './PreOneLauncherButton'
import { Home, User, ChevronDown, LayoutDashboard, Copy, Check, Download, Sparkles, Layers } from 'lucide-react'

export function LauncherButtonGallery() {
  const [copied, setCopied] = useState(false)
  const [activeInteractiveState, setActiveInteractiveState] = useState(false)

  const copyJsonPath = () => {
    navigator.clipboard.writeText('/animations/preone_launcher.json')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '32px 24px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#0F172A',
      }}
    >
      {/* ── Main Canvas Card matching user's design reference ── */}
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: 24,
          border: '1px solid #E2E8F0',
          padding: 36,
          boxShadow: '0 20px 48px -12px rgba(0, 112, 243, 0.08), 0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Top Header Row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', letterSpacing: -0.5 }}>
              PreOne Launcher Button
            </h1>
            <p style={{ fontSize: 15, color: '#64748B', margin: 0, fontWeight: 500 }}>
              Fluent Metro • Classic Style (Pure Vector & Lightweight Lottie JSON)
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={copyJsonPath}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
              {copied ? 'Copied JSON Path!' : 'Copy Lottie JSON Path'}
            </button>
            <a
              href="/animations/preone_launcher.json"
              download="preone_launcher.json"
              style={{
                background: '#0070F3',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(0, 112, 243, 0.25)',
              }}
            >
              <Download size={14} /> Download JSON
            </a>
          </div>
        </div>

        {/* ── Top Half: Large Hero Showcase & Specifications Grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(280px, 340px) 1fr',
            gap: 28,
            marginBottom: 28,
          }}
        >
          {/* Left: Prominent Glowing Hero Orb */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #E2E8F0',
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #0070F3, #00C6FF)',
              }}
            />

            {/* Giant Ceramic Disc */}
            <div
              style={{
                width: 170,
                height: 170,
                borderRadius: 9999,
                background: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 48px -8px rgba(0, 112, 243, 0.28), 0 4px 12px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'
                e.currentTarget.style.boxShadow = '0 24px 56px -6px rgba(0, 112, 243, 0.38), 0 6px 16px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 20px 48px -8px rgba(0, 112, 243, 0.28), 0 4px 12px rgba(0,0,0,0.04)'
              }}
            >
              <PreOnePlanetMark size={110} animated />
            </div>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Interactive Vector Emblem</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Ultra-lightweight • Zero pixelation</div>
            </div>
          </div>

          {/* Right: Button States Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Section 1: Button States */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 16 }}>
                Button States
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, textAlign: 'center' }}>
                {/* 1. Default */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <PreOneLauncherButton size="lg" buttonState="default" />
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Default</span>
                </div>

                {/* 2. Hover */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <PreOneLauncherButton size="lg" buttonState="hover" />
                  <span style={{ fontSize: 12, color: '#0070F3', fontWeight: 600 }}>Hover</span>
                </div>

                {/* 3. Pressed */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <PreOneLauncherButton size="lg" buttonState="pressed" />
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Pressed</span>
                </div>

                {/* 4. Focus */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <PreOneLauncherButton size="lg" buttonState="focus" />
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>Focus</span>
                </div>

                {/* 5. Active (Cobalt Gradient with White Icon) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <PreOneLauncherButton size="lg" buttonState="active" />
                  <span style={{ fontSize: 12, color: '#0070F3', fontWeight: 700 }}>Active</span>
                </div>

                {/* 6. Disabled */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <PreOneLauncherButton size="lg" buttonState="disabled" />
                  <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Disabled</span>
                </div>
              </div>
            </div>

            {/* Section 2: Sizes & Themes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
              {/* Sizes */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 14 }}>
                  Sizes
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 8px' }}>
                  {(['xs', 'sm', 'md', 'lg', 'xl'] as LauncherSize[]).map((sz) => {
                    const px = sz === 'xs' ? 24 : sz === 'sm' ? 32 : sz === 'md' ? 40 : sz === 'lg' ? 48 : 56
                    return (
                      <div key={sz} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <PreOneLauncherButton size={sz} />
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>{sz}</div>
                          <div style={{ fontSize: 10, color: '#94A3B8' }}>{px}px</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Alternative Themes */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  padding: '18px 20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 14 }}>
                  Alternative Themes
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
                  {/* Light */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <PreOneLauncherButton size="lg" themeMode="light" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Light</span>
                  </div>

                  {/* Dark */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ background: '#0B0F19', padding: 6, borderRadius: 9999 }}>
                      <PreOneLauncherButton size="lg" themeMode="dark" />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0F172A' }}>Dark</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Half: Usage Examples ── */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginBottom: 14 }}>
            Usage Examples (PreOne Applications)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 20 }}>
            {/* Example 1: Top Navigation (Web Portal) */}
            <div>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  height: 64,
                  boxSizing: 'border-box',
                }}
              >
                <PreOneLauncherButton size="md" />

                <div style={{ width: 1, height: 24, background: '#E2E8F0' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
                    Sunshine Kids Preschool
                  </span>
                  <ChevronDown size={14} color="#64748B" />
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
                Top Navigation (Web Portal)
              </div>
            </div>

            {/* Example 2: Sidebar (Web Portal) */}
            <div>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  height: 94,
                  boxSizing: 'border-box',
                  justifyContent: 'center',
                }}
              >
                <PreOneLauncherButton size="sm" />
                <button
                  type="button"
                  style={{
                    background: '#0070F3',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  <LayoutDashboard size={13} /> Dashboard
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
                Sidebar (Web Portal)
              </div>
            </div>

            {/* Example 3: Mobile (PreOne Hub Floating Dock) */}
            <div>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  height: 64,
                  boxSizing: 'border-box',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Home size={16} color="#64748B" />
                  <span style={{ fontSize: 10, color: '#64748B' }}>Home</span>
                </div>

                {/* Floating Elevated Center Launcher Button */}
                <div style={{ transform: 'translateY(-8px)' }}>
                  <PreOneLauncherButton
                    size="lg"
                    buttonState={activeInteractiveState ? 'active' : 'default'}
                    onClick={() => setActiveInteractiveState(!activeInteractiveState)}
                    title="Click to toggle active state"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <User size={16} color="#64748B" />
                  <span style={{ fontSize: 10, color: '#64748B' }}>Profile</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 8 }}>
                Mobile (PreOne Hub Dock)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
