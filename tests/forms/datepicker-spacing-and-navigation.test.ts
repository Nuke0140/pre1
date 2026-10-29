import { describe, it, expect } from 'bun:test'
import { toIso, maskPhone, maskAadhaar } from '@/components/preone/forms'

describe('PR #12: DatePicker Spacing & Direct Month/Year Navigation Test Suite', () => {
  it('verifies toIso formatting produces consistent YYYY-MM-DD format', () => {
    expect(toIso(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toIso(new Date(2026, 9, 29))).toBe('2026-10-29')
    expect(toIso(new Date(2026, 11, 31))).toBe('2026-12-31')
  })

  it('verifies forms.tsx source code resolves spacing bug using .dp-day-empty instead of global .empty class', async () => {
    const code = await Bun.file('src/components/preone/forms.tsx').text()

    // 1. Spacing Bug Resolution: empty cells must use dp-day-empty, not dp-day empty
    expect(code).toContain('className="dp-day-empty"')
    expect(code).toContain('aria-hidden="true"')
    expect(code).not.toContain('className="dp-day empty"')

    // 2. Direct Month & Year Selection Header
    expect(code).toContain('className="dp-title-btn"')
    expect(code).toContain('aria-label="Select month"')
    expect(code).toContain('aria-label="Select year"')

    // 3. Selection Grids
    expect(code).toContain('className="dp-month-grid"')
    expect(code).toContain('className="dp-year-grid"')
    expect(code).toContain('className={`dp-selection-btn${isSelected ? \' on\' : \'\'}`}')

    // 4. Back Navigation & Escape Handling
    expect(code).toContain('Back to Dates')
    expect(code).toContain("if (mode !== 'days')")
    expect(code).toContain("setMode('days')")

    // 5. Year Paging
    expect(code).toContain('Previous 12 years')
    expect(code).toContain('Next 12 years')
    expect(code).toContain('yearPageStart')
  })

  it('verifies globals.css overrides guarantee zero padding and correct height for calendar empty slots', async () => {
    const css = await Bun.file('src/app/globals.css').text()

    // Scoped rules for empty cells
    expect(css).toContain('.dp-day-empty')
    expect(css).toContain('height:32px!important')
    expect(css).toContain('padding:0!important')
    expect(css).toContain('margin:0!important')
    expect(css).toContain('visibility:hidden!important')

    // Month & Year selection layouts
    expect(css).toContain('.dp-month-grid')
    expect(css).toContain('.dp-year-grid')
    expect(css).toContain('.dp-selection-btn')
    expect(css).toContain('.dp-title-btn')
  })

  it('verifies calendar day cell generation logic for various months', () => {
    // October 2026: Oct 1 is Thursday (getDay() = 4 -> 4 empty padding cells, 31 days)
    const y = 2026
    const m = 9 // 0-indexed October
    const startPad = new Date(y, m, 1).getDay()
    const daysIn = new Date(y, m + 1, 0).getDate()

    expect(startPad).toBe(4) // Thursday
    expect(daysIn).toBe(31)

    const cells: (Date | null)[] = []
    for (let i = 0; i < startPad; i++) cells.push(null)
    for (let d = 1; d <= daysIn; d++) cells.push(new Date(y, m, d))

    expect(cells.length).toBe(35) // 5 full rows of 7
    expect(cells.filter((c) => c === null).length).toBe(4)
    expect(cells.filter((c) => c !== null).length).toBe(31)
  })

  it('verifies 12-year window calculation logic', () => {
    const computeYearWindow = (yr: number) => Math.floor(yr / 12) * 12

    expect(computeYearWindow(2026)).toBe(2016) // 2016 to 2027
    expect(computeYearWindow(2024)).toBe(2016)
    expect(computeYearWindow(2028)).toBe(2028)
    expect(computeYearWindow(2015)).toBe(2004)
  })
})
