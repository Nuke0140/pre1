# PreOne Global CSS & UI/UX Audit

**Date:** 2026-10-10  
**Repository:** [Nuke0140/pre1](https://github.com/Nuke0140/pre1)  
**Branch reviewed:** `main` at commit `e0c88c89f0a125c26c0b9d4187db8815f1d29302`  
**Status:** Source audit complete; browser/runtime validation remains required.

## Executive summary

The root layout imports one global stylesheet, but `src/app/globals.css` now combines reset rules, design tokens, theme overrides, typography, shared component rules, feature styling, responsive behavior, and motion effects. The safe path is a staged consolidation—not an immediate rewrite—because existing selectors, legacy aliases, and verification scripts may depend on the current cascade.

## Source-level evidence

| Check | Result |
|---|---|
| Root stylesheet import | Confirmed: `src/app/layout.tsx` imports `./globals.css` |
| Tailwind integration | `globals.css` imports Tailwind and connects `tailwind.config.ts` |
| Stylesheet size | 249,326 characters; approximately 8,570 lines in the retrieved source |
| Custom-property declarations | 567 declarations across 359 unique token names |
| Repeated token names | 188 names occur more than once; theme overrides and compatibility aliases may be intentional |
| `!important` | 127 occurrences |
| Media query blocks | 92 |
| Keyframe declarations | 28 |
| Theme selectors | Both `[data-theme="dark"]` and `.dark` are supported |
| Typography system | CSS custom properties/classes, Tailwind typography values, and a React Typography component all encode parts of the same contract |
| TypeScript build gate | `next.config.ts` sets `typescript.ignoreBuildErrors: true` |
| Test commands | `package.json` defines build/lint but no standard `test` script; multiple verification scripts exist as individual files |

These counts are audit indicators, not automatic defect counts. For example, a token re-declared in a dark-theme block is expected. A stylesheet's source size also does not equal its production-delivered size; that must be measured from the build output.

## Findings

### P0 — Quality and cascade risks

1. **Token ownership is spread out.** Canonical values, theme overrides, compatibility aliases and component-specific styling coexist. It is difficult to tell which token is the authoritative source without a registry.
2. **Responsive breakpoints have accumulated.** The stylesheet includes varied widths and mixed formatting (for example 640px, 760px/767px/768px, 900px/960px, and custom desktop widths). Some are likely justified, but the rationale should be documented by component.
3. **Override pressure is high.** The number of `!important` declarations suggests accumulated cascade conflicts. Review them individually instead of removing them with a global replacement.
4. **Type safety is not guaranteed by build success alone.** A separate blocking type-check is needed while `typescript.ignoreBuildErrors` is true.

### P1 — Design system consistency

5. **Typography is defined in multiple places.** CSS roles and tokens live alongside a Tailwind font-size scale. Existing verification checks for presence, but it does not ensure CSS and Tailwind values match or prove every screen uses the intended typography primitives.
6. **Theme restoration spans multiple layers.** CSS, root layout, `PreHydration`, and `AppShell` participate in theme handling. Test first paint, refresh persistence, selector parity and custom branding together.
7. **Shared UI uses multiple styling mechanisms.** Components mix semantic classes, Tailwind utilities, CSS-variable-backed inline styles and some literal values. Dynamic measurements can remain inline; stable colors, spacing, typography and shadows should prefer semantic tokens.
8. **Some dark-mode component rules include direct color literals.** Migrate these gradually to semantic tokens after computed-style, contrast and screenshot checks.

### P2 — Performance and maintainability

9. **Route-level CSS cost has not been measured.** No production CSS coverage, emitted asset size, Core Web Vitals or runtime profile was executed for this source audit.
10. **Global shell activity should be profiled separately from CSS.** `AppShell.tsx` polls notification and user-attention endpoints. Review role authorization, errors, intervals and behavior in hidden tabs during performance QA.
11. **Existing checks are a good starting point, but not a complete visual audit.** The repo includes typography, dark mode, status pill, empty state, start menu, bottom navigation, motion and table verification scripts. Many checks are source assertions and cannot establish that computed styles or full-page visuals are correct.

## Recommended implementation plan

### Phase 1 — Freeze a baseline
- Capture representative screens: onboarding/login, dashboard, admissions list/form, student detail, finance table, setup, dialogs/drawers, and loading/empty/error states.
- Capture desktop, tablet and mobile widths in light and dark themes.
- Record production build output, emitted CSS/JS sizes, font requests, console errors, layout overflow and representative route timings.
- Run lint, a strict type-check and existing verification scripts to establish a baseline.

### Phase 2 — Add audit guardrails
- Add a reproducible `audit:css` command to inventory token declarations by selector/context, repeated selectors, media queries, `!important`, hardcoded colors in shared UI, and global stylesheet imports.
- Add blocking CI type-checking, such as `tsc --noEmit`. Resolve existing issues before disabling `typescript.ignoreBuildErrors`.
- Add a standard command to run the design-system verification scripts so they are not dependent on manually remembering each filename.

### Phase 3 — Consolidate the CSS safely
- Keep `globals.css` as the single root import, but progressively extract clear ownership into `tokens.css`, `base.css`, and feature/component styles. Preserve cascade/import order initially.
- Document canonical light-mode tokens, explicit dark/branding overrides, and compatibility aliases.
- Search all source usage before deleting any alias or selector. Do not remove a property merely because it is declared more than once.
- Normalize common breakpoints while preserving documented component-specific exceptions.
- Reduce `!important` one conflict at a time and verify its affected screens.
- Make typography CSS and Tailwind values derive from one source of truth where practical.

### Phase 4 — Improve the actual UX
- Preserve PreOne Fluent Metro: clear tiles/cards, white space, violet brand emphasis, restrained elevation, consistent radius and spacing, readable hierarchy, calm motion.
- Improve primary-action visibility, heading consistency, tables, form grouping, empty states, keyboard focus and small-screen reflow.
- Ensure reduced-motion preferences apply to non-essential motion.
- Move stable design constants to semantic tokens/shared classes; retain inline styles for truly dynamic values.

### Phase 5 — Verify and measure
- Add browser-based visual regression checks and accessibility verification for focus, contrast, reduced motion, zoom/reflow, mobile navigation, horizontal overflow, dialogs and drawers.
- Run module-level smoke/regression scripts.
- Compare production CSS/JS assets and representative route performance before/after. Do not claim speed improvements without measured results.
- Review desktop/tablet/mobile screenshots in both themes before merging.

## Definition of done

- Every repeated token is documented as an intentional theme override/alias or removed after a usage check.
- No unintended extra global stylesheet entrypoint exists.
- Breakpoints and component-specific responsive behavior are documented.
- Every removed override is backed by browser verification.
- Strict type-check, lint, design-system verification and browser smoke tests pass.
- No regression in navigation, forms, tables, dialogs, dark mode, responsive screens or school branding.
- CSS/JS/font payload and runtime performance are measured before and after.

## Limitations

This is a repository source/configuration audit. Browser screenshots, local build execution, computed-style coverage, browser-based visual regression and production bundle measurement were not performed during this audit. Therefore, no claim is made that tests passed or runtime performance has already improved.
