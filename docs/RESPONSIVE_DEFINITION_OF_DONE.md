# PreOne Design System: Responsive Definition of Done (DoD)

> **Mandatory Quality Guardrail**: Every new page, feature module, or redesign in PreOne must satisfy this four-point Definition of Done across the 9 standard viewports prior to merging.

---

## The Four Core Tenets

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RESPONSIVE DEFINITION OF DONE                     │
├─────────────────────┬───────────────────┬───────────────────┬───────────────┤
│    1. Fits 320      │ 2. Rails Scroll   │ 3. Header Intact  │ 4. One-Handed │
│  No page horizontal │ Managed scroll &  │ Collapsed search, │  44px targets,│
│  scroll or clipping │  edge-fade masks  │ sign-out in view  │ thumb-reach   │
└─────────────────────┴───────────────────┴───────────────────┴───────────────┘
```

---

### 1. Fits 320 (Mobile Zero-Overflow)
- [ ] **No Page Horizontal Scroll**: `document.documentElement.scrollWidth <= window.innerWidth` across all test viewports down to 320px (iPhone SE minimum).
- [ ] **The `min-w-0` Chain**: Every `flex` or `grid` ancestor wrapping wide content, tables, or cards must include `min-w-0` to prevent child `min-content` intrinsic widths from blowing out parent flex items.
- [ ] **No Silent Clipping**: Never use `overflow-x: clip` or `overflow-x: hidden` on page roots as a band-aid to hide overflowing content. All overflow must be architecturally managed.
- [ ] **Title & Eyebrow Reflow**: Page titles, badges, and breadcrumb trails must wrap cleanly onto multiple rows or truncate predictably with tooltips.

---

### 2. Rails Scrollable (Managed Scroll Containers)
- [ ] **Horizontal Data Rails**: Any component exceeding viewport width (data tables, step strips, filter pills) MUST be wrapped in the standard rail container:
  ```tsx
  <div className="overflow-x-auto w-full min-w-0 rail-edge-fade scrollbar-none touch-pan-x">
    <table className="w-full min-w-[950px] ...">...</table>
  </div>
  ```
- [ ] **Visual Affordance (`rail-edge-fade`)**: Scrollable rails must apply gradient edge masks so users instantly recognize additional horizontal content exists.
- [ ] **Auto Scroll-Into-View**: Long tab bars (Admissions, Settings) must auto-scroll the active tab into the center of the viewport upon selection:
  ```ts
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  ```
- [ ] **Mobile Pickers for Dense Lists**: If a navigation bar contains $> 6$ items (e.g. Settings 18 sections), provide a select dropdown picker (`<select className="md:hidden ...">`) below `md` ($< 768\text{px}$).

---

### 3. Header Intact (Collapsible Workspace Topbar)
- [ ] **Single Search Affordance**: Below `lg` ($< 1024\text{px}$), the desktop search input must collapse to `hidden lg:flex` and yield to the mobile search icon button (`flex lg:hidden`). Duplicate search bars are strictly forbidden.
- [ ] **Action Collapse**: Below `lg`, secondary utilities (Help, Fullscreen, Language selector) must fold into the Profile popover menu.
- [ ] **Sign-Out Reachability**: The Profile button / workspace action group must remain pinned to the top-right corner, fully visible and tappable on every screen size. Mobile users must always be able to log out in one tap.

---

### 4. Controls Reachable One-Handed (Touch Targets & Reach)
- [ ] **44px Touch Target Rule**: All interactive buttons, dock icons, segmented chips, and action columns must satisfy:
  ```css
  min-height: 44px !important;
  min-width: 44px !important;
  ```
- [ ] **Full-Width Mobile CTAs**: Primary action buttons (e.g. `+ Enroll Child`, `+ New Enquiry`) must stretch full-width (`w-full sm:w-auto`) on mobile devices so thumbs can reach them effortlessly with either hand.
- [ ] **Short Landscape Safety ($667 \times 375$)**: Modals and drawer sheets must use `max-h-[88vh]` or `max-h-[92dvh]` with scrollable bodies (`overflow-y-auto`) so action footers are never lost below the screen fold.

---

## The 9-Viewport Audit Matrix

Every release must pass verification across these 9 device profiles:

| Viewport Profile | Width × Height | Device Baseline | Primary Layout Mode |
|---|---|---|---|
| **Compact Mobile** | $320 \times 568$ | iPhone SE (1st gen) | Mobile cards, full-width CTAs, select pickers |
| **Standard Mobile** | $390 \times 844$ | iPhone 12 / 13 / 14 | Mobile cards, edge-fade rails, collapsed header |
| **Phone Landscape** | $667 \times 375$ | iPhone 8 / SE Landscape | Compact hero, scrollable modals, $\le 90\text{vh}$ cards |
| **Tablet Portrait** | $768 \times 1024$ | iPad 9.7" / Mini | Master-detail layout, dock labels restored |
| **Tablet Air** | $820 \times 1180$ | iPad Air 10.9" | Master-detail layout, touch-pan table rails |
| **Tablet Landscape** | $1024 \times 768$ | iPad Pro 11" | Desktop topbar, edge-fade rails, single-line clock |
| **Standard Laptop** | $1280 \times 800$ | MacBook Air 13" | Full desktop `DataTable`, time-only dock clock |
| **Large Laptop** | $1440 \times 900$ | MacBook Pro 15"/16" | Full desktop view, centered canvas $\le 1460\text{px}$ |
| **Desktop / External** | $1920 \times 1080$ | 1080p Monitor / 27" | `2xl` density bump (roomy padding, $1520\text{px}$ canvas) |

---

## Automated Verification Commands

Run before submitting any Pull Request:

```bash
# 1. Run unit & contract assertions (41+ tests)
bun test tests/design-system/responsive-transformation.test.ts

# 2. Run Playwright Viewport Matrix E2E & visual diffs
npx playwright test tests/e2e/responsive-matrix.spec.ts

# 3. Verify clean production build
bun run build
```
