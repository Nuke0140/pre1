# PreOne Design Token System v1.0 — Architecture & Engineering Specification

## 1. Overview & Objective

The **PreOne Design Token System v1.0** establishes a single source of truth across the PreOne Preschool Operating System. It defines the brand ramp, semantic surfaces, violet-tinted elevation levels, motion curves, and radii scales across both light and dark themes.

---

## 2. Canonical Token File & Structure

The canonical token definitions are maintained in:
`src/app/globals.css` (with Tailwind configuration integration in `tailwind.config.ts`).

### 2.1 Primitive Brand Ramp
Anchor: **`#7C3AED`** (`--brand-600` / `--preone-primary`)

```css
--brand-50:  #F5F3FF;
--brand-100: #EDE9FE;
--brand-200: #DDD6FE;
--brand-300: #C4B5FD;
--brand-400: #A78BFA;
--brand-500: #8B5CF6;
--brand-600: #7C3AED; /* Brand Anchor */
--brand-700: #6D28D9;
--brand-800: #5B21B6;
--brand-900: #4C1D95;
```

### 2.2 Semantic Surfaces & Text Hierarchy

| Token | Light Theme | Dark Theme (`.dark`, `[data-theme="dark"]`) | Description |
|---|---|---|---|
| `--bg` | `#F7F8FC` | `#0B0F19` | Application canvas base |
| `--surface` | `rgba(255, 255, 255, 0.82)` | `rgba(17, 24, 39, 0.78)` | Translucent material surface |
| `--surface-solid` | `#FFFFFF` | `#111827` | Opaque material surface |
| `--surface-2` | `#F8FAFC` | `#1B2438` | Secondary grouped surface |
| `--border` | `rgba(226, 232, 240, 0.9)` | `rgba(255, 255, 255, 0.08)` | Subtle border |
| `--border-strong` | `#CBD5E1` | `rgba(255, 255, 255, 0.16)` | High-emphasis border |
| `--text-1` | `#1E293B` | `#F1F5F9` | Primary headings & high-contrast body text |
| `--text-2` | `#475569` | `#CBD5E1` | Secondary body text & form labels |
| `--text-3` | `#64748B` | `#94A3B8` | Tertiary metadata, subtitles & hints |

### 2.3 Violet-Tinted Elevation Scale

Elevation is layered into three distinct levels:

* **Level 1 (`--shadow-1`) — Subtle Separation:**
  ```css
  --shadow-1:
    0 1px 2px rgba(30, 27, 57, 0.05),
    0 2px 8px rgba(30, 27, 57, 0.05);
  ```
  *Used for:* Standard cards, table containers (`.dtable-wrap`), KPI metric cards, navigation ribbons.

* **Level 2 (`--shadow-2`) — Floating Surfaces:**
  ```css
  --shadow-2 (light):
    0 2px 6px rgba(30, 27, 57, 0.06),
    0 12px 32px -8px rgba(124, 58, 237, 0.14);

  --shadow-2 (dark):
    0 2px 6px rgba(0, 0, 0, 0.4),
    0 12px 32px -8px rgba(0, 0, 0, 0.5);
  ```
  *Used for:* Dropdown menus, action menus, popovers, tooltips, interactive card hover states (`.card-interactive:hover`).

* **Level 3 (`--shadow-3`) — High-Emphasis Overlays:**
  ```css
  --shadow-3 (light):
    0 4px 12px rgba(30, 27, 57, 0.07),
    0 24px 64px -16px rgba(124, 58, 237, 0.20);

  --shadow-3 (dark):
    0 4px 12px rgba(0, 0, 0, 0.45),
    0 24px 64px -16px rgba(124, 58, 237, 0.25);
  ```
  *Used for:* Modals & dialogs (`DialogContent`), slide-out sheets (`SheetContent`), toasts (`Toast`), authentication cards (`AuthCard`).

---

### 2.4 Motion Tokens

* Curves:
  * `--ease-out`: `cubic-bezier(0.22, 1, 0.36, 1)`
  * `--ease-standard`: `cubic-bezier(0.4, 0, 0.2, 1)`
  * `--ease-spring`: `cubic-bezier(0.34, 1.56, 0.64, 1)`
* Durations:
  * `--dur-1`: `150ms` (Micro-interactions, button hover, focus rings)
  * `--dur-2`: `250ms` (Card hover elevations, dropdown open/close)
  * `--dur-3`: `420ms` (Dialog enter/exit, sheet slide, overlay transitions)
* Accessibility:
  * Automatically respects `@media (prefers-reduced-motion: reduce)` by clamping transition and animation durations to `0.01ms`.

---

### 2.5 Radius Scale

* `--r-sm`: `10px` (Compact controls, badges)
* `--r-md`: `12px` (Standard buttons, inputs, segmented controls)
* `--r-lg`: `16px` (Cards, table containers, popover menus)
* `--r-xl`: `24px` (Large modals, dialogs, auth surfaces)
* `--r-pill`: `999px` (Status pills, avatar clips, floating tags)

---

## 3. Component Token Mapping

| Component | Tokens Consumed | Notes |
|---|---|---|
| `Button` | `--button-primary-bg`, `--button-primary-text`, `--dur-1`, `--ease-standard` | Enforces WCAG AA text contrast (`#FFFFFF` on `#7C3AED`) |
| `Input` | `--input-bg`, `--input-border`, `--input-text`, `--input-placeholder`, `--focus-ring-color` | High-contrast inputs with velvet double-ring focus |
| `Card` | `--card-bg`, `--card-border`, `--shadow-1`, `--shadow-2` (hover) | Supports default, interactive, elevated, and flat variants |
| `DropdownMenu` | `--menu-bg`, `--menu-border`, `--shadow-2`, `--r-lg` | Floating menus with violet-tinted elevation |
| `GlobalActionMenu` | `--menu-bg`, `--shadow-2`, `--shadow-1` (trigger hover), `--r-lg` | Standardized across modules |
| `Dialog` | `--surface-solid`, `--shadow-3`, `--r-xl`, `--dur-3` | Center modals with high-emphasis elevation |
| `Sheet` | `--surface-solid`, `--shadow-3`, `--dur-2` / `--dur-3` | Lateral slide drawers |
| `Tooltip` | `--surface-solid`, `--shadow-2`, `--r-sm` | High-contrast contextual tooltips |
| `DataTable` | `--surface-card`, `--shadow-1`, `--r-lg` | Frosted sticky header with subtle row hover |
| `AdmissionsRibbon` | `--surface`, `--shadow-1`, `--r-xl` | Navigation workspace ribbon |

---

## 4. Guidelines for Future Modules

1. **Use Semantic Tokens:** Always reference `var(--bg)`, `var(--surface)`, `var(--surface-solid)`, `var(--text-1)`, etc., rather than arbitrary hex values.
2. **Standard Elevation Hierarchy:**
   * Level 1 (`var(--shadow-1)`) for cards and tables.
   * Level 2 (`var(--shadow-2)`) for dropdowns, popovers, and interactive card hovers.
   * Level 3 (`var(--shadow-3)`) for modals, toasts, and major overlays.
3. **Radii Consistency:** Use `var(--r-sm)` to `var(--r-xl)` or Tailwind classes (`rounded-r-sm`, `rounded-r-lg`, etc.).
4. **Theme Compatibility:** Both light and dark themes are handled automatically by the custom properties. Do not hardcode dark-mode color overrides that bypass CSS variables.
