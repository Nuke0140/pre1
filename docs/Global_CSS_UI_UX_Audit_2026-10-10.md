# PreOne Global CSS & UI/UX Audit — 2026-10-10

## Scope and method
Reviewed the public `Nuke0140/pre1` repository's main branch, `src/app/globals.css`, the root layout import, Tailwind configuration, selected shared UI components, package scripts/configuration, and existing CSS-focused verification scripts. This was a repository/source audit; no browser screenshot inspection, local build, production bundle analysis, or runtime visual regression suite was run from this connector session.

## Confirmed findings

### 1. Global stylesheet is wired
- Root layout imports `./globals.css` from `src/app/layout.tsx`.
- Tailwind CSS v4 is imported from the same stylesheet; `tailwind.config.ts` is connected via `@config`.
- The stylesheet is approximately 249 KB by UTF-8 content length and about 8,570 lines in the retrieved file representation.
- The file includes global reset/base rules, semantic tokens, light/dark theme rules, component-level classes, responsive rules and motion states in one large stylesheet.

### 2. Design token architecture has accumulated duplication
- A source scan counted 567 custom-property declarations representing 359 unique token names; 188 token names are declared more than once across contexts (including intentional light/dark overrides and compatibility aliases).
- Several names are repeated up to four times, e.g. `--surface-elevated`, `--border-subtle`, `--border-default`, `--border-strong`.
- This is not, by itself, proof that every duplicate is a defect. Some repetition is expected for theme overrides, but current token ownership is difficult to audit safely without separating canonical definitions, theme overrides, and deprecated aliases.
- Motion, surface, elevation, radius, spacing, typography, legacy PO aliases and workspace tokens coexist. Consolidate ownership before deleting old variables.

### 3. Media queries and override pressure
- 92 media-query blocks and 127 `!important` declarations were found in `globals.css`.
- Breakpoints vary in formatting and values: examples include 640px/640px compact forms, 760px/767px/768px, 900px/960px and several custom desktop widths.
- The stylesheet contains 28 keyframes, and reduced-motion safeguards appear in more than one place.
- These are audit hotspots, not automatic bugs. The next step is to inventory each component's responsive contract, merge truly equivalent blocks, and retain intentional component-specific breakpoints.

### 4. Type and color source-of-truth mismatch risk
- Global CSS defines canonical typography variables/classes, while Tailwind config separately declares the same type scale.
- Existing `scripts/verify-typography-system.ts` checks token/class existence and Tailwind mapping, but it does not compare the actual CSS/Tailwind values, selector precedence, or real component adoption across the application.
- The app currently imports both Poppins and Nunito weights globally; the actual per-route font payload and rendered font use were not profiled in this audit.
- Shared components show a mix of semantic CSS classes, Tailwind utilities, CSS-variable inline styles, and a few hardcoded style values. Runtime values may legitimately need inline styles; design constants should prefer canonical tokens.

### 5. Theme handling
- `globals.css` supports `[data-theme="dark"]` and `.dark` selectors.
- Root HTML initializes with `data-theme="light"`; client components restore saved theme from localStorage, and `PreHydration` applies saved theme/brand values before hydration.
- Theme logic therefore spans CSS, root layout, `PreHydration`, and `AppShell`. A contract test should verify first paint, reload persistence, dark/light selector parity, and custom brand overrides together.
- Dark-mode rules use direct color literals in some component selectors instead of only semantic tokens. Gradually replace these only after a visual and contrast check.

### 6. Performance and quality gates
- `package.json` exposes `build` and `lint`, but no standard `test` script is declared there; many verification scripts exist as direct files and are not visibly wired into a default command from the inspected package file.
- `next.config.ts` sets `typescript.ignoreBuildErrors: true`, allowing a Next.js build to proceed despite TypeScript errors. This is a release-quality risk; CI should run a strict type-check as an independent blocking job before this is disabled/removed.
- `src/components/shell/AppShell.tsx` polls notification and user-attention endpoints on intervals. This is not a CSS issue, but contributes to global shell network activity and should be checked for role authorization, failures, tab visibility, and mount/unmount cleanup during broader performance testing.

### 7. Existing verification coverage
The repository includes scripts for typography, dark mode, semantic status pills, empty states, start menu, bottom navigation, tactile motion and table styling. This is useful groundwork. Most inspected checks are source-string assertions; they establish that expected selectors/tokens exist, not that computed styles are correct in a browser or that the whole app is visually consistent.

## Priority recommendation

### P0 — Establish guardrails before a broad refactor
1. Add a dedicated CSS/design-system audit command that reports duplicate token declarations by selector/context, duplicate selectors, media-query inventory, `!important` inventory, hardcoded colors in shared UI files, and direct stylesheet imports.
2. Make strict TypeScript checking a blocking CI step (e.g. `tsc --noEmit`) and stop treating a successful framework build alone as proof of type safety.
3. Capture baseline screenshots for representative flows: login/onboarding, dashboard, admissions list/form, student detail, finance table, setup, dialogs/drawers, empty/loading/error states, light and dark themes, and mobile widths.

### P1 — Reduce global CSS complexity safely
4. Define clear stylesheet ownership: `tokens.css` (canonical tokens and themes), `base.css` (resets, typography, focus and shared document rules), and feature/component styles where appropriate. Keep one root import entrypoint. Do this incrementally; avoid a one-shot split that can alter cascade order.
5. Create a token registry with exactly one canonical light-mode declaration per token, explicit dark/brand overrides, and a documented compatibility map. Deprecate aliases first; remove only when a repo-wide usage scan proves they are unused.
6. Normalize responsive breakpoints into a small documented set (while retaining justified exceptions). Group media rules by component instead of adding new disconnected global patches.
7. Audit and reduce `!important` only when the underlying cascade conflict is understood. Never bulk-remove it by regex.

### P2 — Improve the design system and perceived performance
8. Keep the existing PreOne Fluent Metro direction: clean light canvas, violet brand, restrained elevation, clear card/tile hierarchy, consistent radius/spacing and calm motion. Improve hierarchy and whitespace rather than layering more glow/shadow effects onto every surface.
9. Move stable visual constants (colors, spacing, radius, typography, shadows) to semantic tokens/shared classes. Keep inline styles for genuinely dynamic values only.
10. Profile production CSS and JS bundles and font loading on representative routes; optimize based on measured route-level payload and rendering, not raw source size alone.
11. Add browser-based visual regression and accessibility checks for keyboard focus, reduced motion, contrast, zoom/reflow, mobile navigation, overflow and dialog/drawer behavior.

## Definition of done for the next phase
- No unexplained token conflicts; every duplicate is documented as a theme override or compatibility alias.
- No accidental duplicate global style sources.
- CSS diff is reviewed against baseline screenshots at desktop, tablet and mobile widths in both themes.
- Strict type-check, lint, existing module verification scripts and browser smoke tests pass.
- Production CSS/JS bundle and font loading are measured before and after; no performance gain is claimed without comparing those measurements.
- Existing routes, forms, tables, menus, dialogs, responsive layout and school branding continue to work.

## Important limitation
This document reports findings from source inspection. It does not claim a successful build, passing tests, measured runtime speed improvement, or a complete visual audit because those were not executed in this connector session.
