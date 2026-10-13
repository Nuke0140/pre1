import { describe, it, expect } from 'bun:test'

describe('PreOne Typography Quiet Upgrades v1.0 Test Suite', () => {
  it('verifies centralized typography tokens in globals.css', async () => {
    const css = await Bun.file('src/app/globals.css').text()

    // 1. Font roles
    expect(css).toContain('--font-display: \'Poppins\', sans-serif;')
    expect(css).toContain('--font-body: \'Nunito\', sans-serif;')

    // 2. Responsive page heading fluid clamp formula
    expect(css).toContain('--font-size-h1: clamp(26px, 1.2vw + 22px, 34px);')

    // 3. Supporting type scale
    expect(css).toContain('--font-size-label: 13px;')
    expect(css).toContain('--font-size-input: 15px;')
    expect(css).toContain('--font-size-input-compact: 14px;')
    expect(css).toContain('--font-size-body: 14px;')
    expect(css).toContain('--font-size-footnote: 12px;')

    // 4. Sparse uppercase micro-labels & tracking
    expect(css).toContain('--font-size-micro: 11px;')
    expect(css).toContain('--letter-spacing-label: 0.01em;')
    expect(css).toContain('--letter-spacing-micro: 0.08em;')

    // 5. Typography weights
    expect(css).toContain('--font-weight-regular: 400;')
    expect(css).toContain('--font-weight-medium: 500;')
    expect(css).toContain('--font-weight-semibold: 600;')
    expect(css).toContain('--font-weight-bold: 700;')

    // 6. Numeric data token
    expect(css).toContain('--font-variant-data: tabular-nums;')
  })

  it('verifies typography utility classes and semantic specifications', async () => {
    const css = await Bun.file('src/app/globals.css').text()

    // .page-title specification (Phase 3)
    expect(css).toContain('.page-title')
    expect(css).toContain('font-family: var(--font-display);')
    expect(css).toContain('font-size: var(--font-size-h1);')
    expect(css).toContain('font-weight: 600;')
    expect(css).toContain('line-height: 1.2;')

    // .form-label specification (Phase 4)
    expect(css).toContain('.form-label')
    expect(css).toContain('font-family: var(--font-body);')
    expect(css).toContain('font-size: var(--font-size-label);')
    expect(css).toContain('font-weight: var(--font-weight-semibold);')
    expect(css).toContain('letter-spacing: var(--letter-spacing-label);')
    expect(css).toContain('color: var(--text-2);')

    // .footnote specification (Phase 5)
    expect(css).toContain('.footnote')
    expect(css).toContain('font-size: var(--font-size-footnote);')
    expect(css).toContain('color: var(--text-3);')

    // .micro-label specification (Phase 6)
    expect(css).toContain('.micro-label')
    expect(css).toContain('font-size: var(--font-size-micro);')
    expect(css).toContain('letter-spacing: var(--letter-spacing-micro);')
    expect(css).toContain('text-transform: uppercase;')

    // .data-numeric specification (Phase 8)
    expect(css).toContain('.data-numeric')
    expect(css).toContain('font-variant-numeric: tabular-nums;')
  })

  it('verifies Nunito is the default interface font on html and body', async () => {
    const css = await Bun.file('src/app/globals.css').text()
    expect(css).toContain('html, body {')
    expect(css).toContain('font-family: var(--font-body);')
  })

  it('verifies shared Form Label components use target typography classes', async () => {
    const labelComponent = await Bun.file('src/components/ui/label.tsx').text()
    expect(labelComponent).toContain('form-label')
    expect(labelComponent).toContain('text-[13px]')

    const authField = await Bun.file('src/components/auth/AuthField.tsx').text()
    expect(authField).toContain('form-label')
    expect(authField).toContain('text-[13px]')
  })

  it('verifies Input component uses standardized 15px text and 14px compact size', async () => {
    const inputComponent = await Bun.file('src/components/ui/input.tsx').text()
    expect(inputComponent).toContain('text-[15px]')
    expect(inputComponent).toContain('text-sm') // 14px for compact/sm
  })

  it('verifies data table and KPI numbers implement tabular numerals and data-numeric', async () => {
    const kpiCard = await Bun.file('src/components/preone/KpiMetricCard.tsx').text()
    expect(kpiCard).toContain('data-numeric')
    expect(kpiCard).toContain('tabular-nums')

    const dataTable = await Bun.file('src/components/preone/DataTable.tsx').text()
    expect(dataTable).toContain('data-numeric')
    expect(dataTable).toContain('cell-num data-numeric')
    expect(dataTable).toContain('micro-label')

    const zenTable = await Bun.file('src/components/preone/ZenTable.tsx').text()
    expect(zenTable).toContain('data-numeric')
    expect(zenTable).toContain('micro-label')
  })

  it('verifies Tailwind exposes font display and fluid clamp h1 token', async () => {
    const tailwindConfig = await Bun.file('tailwind.config.ts').text()
    expect(tailwindConfig).toContain('display: [\'var(--font-display)\', \'Poppins\', \'sans-serif\']')
    expect(tailwindConfig).toContain('clamp(26px, 1.2vw + 22px, 34px)')
  })
})
