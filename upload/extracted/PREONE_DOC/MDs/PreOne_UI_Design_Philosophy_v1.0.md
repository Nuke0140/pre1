P R E O N E E N T E R P R I S E
PreOne UI Design
Philosophy
PreOne Fluent Metro Design System — Enterprise Preschool Operating System
Document Version: 1.0
Status: Design Freeze
Date: 2026-07-13
Product: PreOne — Enterprise Preschool Operating System
Predecessor: Vision v1.0, Master PRD v1.0, DDD v1.0, Engineering Standards v1.0
Successor: Component Library v1.0, Design Studio v1.0, Parent App Design v1.0
Classification: Internal Design Reference
Prepared by: PreOne Design & Engineering Team
PreOne Platform UI v1.0

PreOne UI Design Philosophy v1.0 | Design Freeze
Table of Contents
Introduction.......................................................................................................................1
Document Purpose...............................................................................................................1
Design System Name............................................................................................................2
Design Influences.................................................................................................................2
Document Hierarchy............................................................................................................2
Scope Summary....................................................................................................................2
Part 1 — Design Foundations..............................................................................................3
1.1 Five Design Principles.....................................................................................................3
1. Fresh...........................................................................................................................3
2. Tile Based....................................................................................................................4
3. Everything in Cards.....................................................................................................4
4. Rounded UI.................................................................................................................5
5. Flat..............................................................................................................................6
1.2 Typography.....................................................................................................................6
Type Scale.......................................................................................................................7
Font Weights..................................................................................................................7
1.3 Color Engine...................................................................................................................7
Semantic Color Tokens (Light Mode).............................................................................7
Dark Mode Token Overrides..........................................................................................7
1.4 Motion............................................................................................................................7
Motion Rules..................................................................................................................8
Forbidden Motion..........................................................................................................9
1.5 Iconography..................................................................................................................10
Icon Rules.....................................................................................................................10
1

PreOne UI Design Philosophy v1.0 | Design Freeze
Forbidden Icons............................................................................................................11
1.6 Illustrations...................................................................................................................11
Illustration Usage.........................................................................................................12
Part 2 — Theme Engine....................................................................................................13
2.1 Four-Level Theme Hierarchy........................................................................................13
Hierarchy Details..........................................................................................................13
2.2 Theme Configuration....................................................................................................14
Configuration Operations.............................................................................................14
2.3 Logo Position................................................................................................................15
Logo Rules....................................................................................................................17
2.4 Login Screen.................................................................................................................17
Login Screen Example...................................................................................................18
Login Screen Rules........................................................................................................20
2.5 Theme Storage.............................................................................................................21
Theme JSON Schema....................................................................................................22
Part 3 — PreOne Design Studio.........................................................................................25
3.1 Access Matrix...............................................................................................................25
3.2 Design Studio Features.................................................................................................25
School Logo..................................................................................................................26
Login Background.........................................................................................................26
Primary / Secondary Colors..........................................................................................26
Dashboard Layout........................................................................................................27
Sidebar Style.................................................................................................................27
Card Style......................................................................................................................28
Border Radius...............................................................................................................28
Font Family...................................................................................................................28
Light / Dark / Auto Mode.............................................................................................29
Welcome Message.......................................................................................................29
2

PreOne UI Design Philosophy v1.0 | Design Freeze
School Banner...............................................................................................................29
Favicon..........................................................................................................................30
Parent App Branding (Limited).....................................................................................30
3.3 Design Studio Workflow...............................................................................................31
3.4 Technical Foundation...................................................................................................32
Part 4 — Layout System....................................................................................................32
4.1 Global Layout................................................................................................................33
Desktop Layout.............................................................................................................33
Mobile Layout...............................................................................................................35
4.2 Header..........................................................................................................................37
Header Contents..........................................................................................................37
Header Rules................................................................................................................38
4.3 Sidebar..........................................................................................................................39
Sidebar Contents..........................................................................................................39
Sidebar Behaviors.........................................................................................................39
Sidebar Customization.................................................................................................40
4.4 Content Area................................................................................................................41
White Space Rule.........................................................................................................41
4.5 Responsive Breakpoints...............................................................................................42
4.6 Grid System..................................................................................................................42
Grid Examples...............................................................................................................42
Part 5 — Component Library............................................................................................43
5.1 Component Categories.................................................................................................43
5.2 Layout Components.....................................................................................................43
5.3 Form Components........................................................................................................43
5.4 Data Display Components............................................................................................44
5.5 Chart Components.......................................................................................................44
5.6 Feedback Components.................................................................................................44
3

PreOne UI Design Philosophy v1.0 | Design Freeze
5.7 Action Components......................................................................................................44
5.8 Navigation Components...............................................................................................44
5.9 Utility Components......................................................................................................44
Part 6 — Page Catalog (All 14 Modules)............................................................................44
6.1 Module Summary.........................................................................................................45
6.2 M01 — Identity & Authentication................................................................................45
6.3 M02 — CRM (Lead Management)................................................................................45
6.4 M03 — Admissions.......................................................................................................46
6.5 M04 — Student Lifecycle.............................................................................................46
6.6 M05 — Academics........................................................................................................47
6.7 M06 — Daily Operations (Attendance + Transport)....................................................47
6.8 M07 — Parent Communication....................................................................................48
6.9 M08 — Finance............................................................................................................48
6.10 M09 — Inventory.......................................................................................................49
6.11 M10 — HR (Staff + Payroll).........................................................................................49
6.12 M11 — Administration...............................................................................................50
6.13 M12 — Reports & Analytics.......................................................................................50
6.14 M13 — Settings..........................................................................................................51
6.15 M14 — Platform Management..................................................................................51
Part 7 — Multi-Tenant Branding & White Label................................................................52
7.1 Concept........................................................................................................................52
7.2 Branding Levels............................................................................................................53
7.3 White-Label Flow..........................................................................................................53
White-Label Steps........................................................................................................53
7.4 Theme Isolation............................................................................................................54
Part 8 — Implementation Roadmap.................................................................................55
8.1 Token Architecture.......................................................................................................55
8.2 Component Library Implementation Plan....................................................................56
4

PreOne UI Design Philosophy v1.0 | Design Freeze
8.3 Design Studio Delivery..................................................................................................56
8.4 Page Implementation Plan...........................................................................................56
Module Priority............................................................................................................56
Quality Gates................................................................................................................57
8.5 Accessibility..................................................................................................................58
Accessibility Features...................................................................................................58
Accessibility Testing......................................................................................................59
Appendix A — Design Token Reference............................................................................59
Color Tokens.......................................................................................................................60
Spacing Tokens...................................................................................................................60
Radius Tokens.....................................................................................................................60
Shadow Tokens...................................................................................................................60
Typography Tokens............................................................................................................60
Motion Tokens...................................................................................................................60
Appendix B — Page Catalog Summary..............................................................................61
Appendix C — Glossary.....................................................................................................61
Document Control & Sign-off............................................................................................61
Approval Matrix..................................................................................................................62
Revision History..................................................................................................................62
Document Control..............................................................................................................62
Right-click the table above and choose “Update Field” to refresh page numbers.
5

PreOne UI Design Philosophy v1.0 | Design Freeze
Introduction
Document Purpose
This UI Design Philosophy document is the authoritative reference for how PreOne looks,
feels, and behaves across every screen, every module, and every user role. It defines the
PreOne Fluent Metro Design System — an original synthesis of Windows 8 Metro's tile-
based hierarchy, Windows 11 Fluent's depth and motion, Apple's whitespace discipline,
and Google Material's usability conventions. The system is not a copy of any one tradition;
it is engineered specifically for the Indian preschool context, where users range from tech-
comfortable young teachers to first-time app users among parents and grandparents.
This document covers eight parts: design foundations (principles, typography, color,
motion, icons, illustrations), the Theme Engine (PreOne's major USP), the PreOne Design
Studio (the customization module), the layout system, the 86-component library, the
complete page catalog across all 14 modules, multi-tenant branding and white-label
architecture, and the implementation roadmap. Three appendices provide the full design
token reference, page catalog summary, and glossary.
Design System Name
PreOne Fluent Metro Design System. 'Fluent' for the depth, motion, and focus indicators
inherited from Windows 11 Fluent Design. 'Metro' for the bold, tile-based, content-first
composition inherited from Windows 8 Metro. The name signals that this is a modern,
layered, motion-aware system — not a flat minimalism, not a heavy skeuomorphism. It is
the synthesis that works for preschool ERP: warm enough for parents, structured enough
for admins, fast enough for teachers in the classroom.
Design Influences
Every design system stands on the shoulders of predecessors. PreOne Fluent Metro is
transparent about its influences and explicit about what it borrows, what it rejects, and
how it synthesizes them into something original. The table below documents the four
primary influences and how each contributes to the final system.
6

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Source | Borrowed | Rejected | Synthesis |
| ------ | -------- | -------- | --------- |
Windows 8 Metro Tile-based  Hard edges, limited  Tile-based layout
|     | information          | color palette, cold  | with rounded         |
| --- | -------------------- | -------------------- | -------------------- |
|     | hierarchy, bold      | feel                 | corners, warmer      |
|     | typography, content- |                      | palette, and softer  |
|     | first composition    |                      | elevation            |
Windows 11 Fluent Material depth,  Heavy translucency  Soft elevation via 1-
|     | acrylic surfaces,  | on low-end             | 2px shadows,           |
| --- | ------------------ | ---------------------- | ---------------------- |
|     | smooth motion,     | hardware, complex      | smooth 150-250ms       |
|     | focus indicators   | acrylic rendering cost | motion, visible focus  |
rings for accessibility
| Apple HIG | Whitespace              | Platform-locked      | Generous                |
| --------- | ----------------------- | -------------------- | ----------------------- |
|           | discipline,             | aesthetics, premium- | whitespace (max 6       |
|           | typographic             | only positioning     | cards per screen),      |
|           | restraint, progressive  |                      | restrained type scale,  |
|           | disclosure, delight in  |                      | progressive             |
|           | detail                  |                      | disclosure for          |
complex forms
Google Material Elevation tokens,  Overly busy  Outlined minimal
|     | recognizable         | iconography, dense  | icons, generous     |
| --- | -------------------- | ------------------- | ------------------- |
|     | iconography,         | default spacing,    | spacing, branded    |
|     | standard motion      | generic feel        | motion, PreOne-     |
|     | curves, predictable  |                     | specific component  |
|     | component behavior   |                     | semantics           |
Document Hierarchy
| Document        | Version | Relationship | Authority           |
| --------------- | ------- | ------------ | ------------------- |
| Vision Document | v1.0    | Predecessor  | Product & business  |
direction
| Master PRD | v1.0 | Predecessor | Product  |
| ---------- | ---- | ----------- | -------- |
requirements
| DDD Document | v1.0 | Predecessor | Domain model &  |
| ------------ | ---- | ----------- | --------------- |
bounded contexts
| Engineering  | v1.0     | Predecessor       | Engineering          |
| ------------ | -------- | ----------------- | -------------------- |
| Standards    |          |                   | execution            |
| **UI Design  | **v1.0** | **This document** | **Visual &           |
| Philosophy** |          |                   | interaction design** |
7

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Document          | Version    | Relationship | Authority           |
| ----------------- | ---------- | ------------ | ------------------- |
| Component Library | v1.0 (TBD) | Successor    | React/React Native  |
implementation
| Design Studio | v1.0 (TBD) | Successor | Theme  |
| ------------- | ---------- | --------- | ------ |
customization
module
| Parent App Design | v1.0 (TBD) | Successor | PreOne Hub mobile  |
| ----------------- | ---------- | --------- | ------------------ |
design
Scope Summary
This document specifies 14 modules, 320 page types, 86 components, and the complete
design token architecture. It covers the web portal (Next.js), the parent mobile app (React
Native), and the design tokens that keep web, mobile, and Figma in sync. It does not cover
marketing websites (separate brand guidelines) or the public preone.in website (separate
design). It covers everything a user sees after logging in to PreOne.
| Dimension                               |     | Count |     |
| --------------------------------------- | --- | ----- | --- |
| Modules (Bounded Contexts)              |     | 14    |     |
| Page Types (across all modules)         |     | 320   |     |
| Components (in library)                 |     | 86    |     |
| Design Tokens (color, spacing, radius,  |     | 75+   |     |
shadow, type, motion)
| Responsive Breakpoints |     | 5 (sm, md, lg, xl, 2xl)                  |     |
| ---------------------- | --- | ---------------------------------------- | --- |
| Theme Hierarchy Levels |     | 4 (platform, school, branch, user)       |     |
| Branding Levels        |     | 4 (Standard, Premium, Enterprise, White- |     |
Label)
| Supported Fonts        |     | 4 (Inter, Poppins, Nunito, Roboto) |     |
| ---------------------- | --- | ---------------------------------- | --- |
| WCAG Compliance Target |     | Level AA                           |     |
8

PreOne UI Design Philosophy v1.0 | Design Freeze
Part 1 — Design Foundations
The PreOne Fluent Metro Design System is an original design language built on the
shoulders of three industry-defining traditions: the bold tile-based hierarchy of Windows 8
Metro, the depth and motion of Windows 11 Fluent, and the calm whitespace discipline of
Apple. It is not a copy of any one system; it is a synthesis deliberately engineered for the
Indian preschool context — where users range from tech-comfortable young teachers to
first-time app users among parents and grandparents. Every principle, token, and
component in this document serves the same goal: making the complex simple, the heavy
light, and the impersonal warm.
1.1 Five Design Principles
The PreOne Fluent Metro Design System rests on five principles. They are not equal — they
are ordered. 'Fresh' comes first because without whitespace, nothing else matters. 'Tile
Based' comes second because without glanceability, dashboards fail. 'Everything in Cards'
comes third because without containers, consistency breaks. 'Rounded UI' and 'Flat' come
fourth and fifth — they are aesthetic refinements that make the system feel modern, but
they build on the first three. Every principle has a rule and an anti-pattern; engineers and
designers reference both.
1. Fresh
Principle: Lots of white space. Screen कधी(cid:3)च भरलेले(cid:9) (cid:10) वा(cid:10)टू(cid:13) नये(cid:9).
Whitespace is not empty space — it is the breathing room that lets content speak. Every
screen reserves at least 30% of its area for whitespace. Cards are separated by 24-32px
gaps. Section headers have generous top padding (48-64px). A screen that feels 'full' is a
screen that needs to be split. This principle fights the Indian SaaS tendency to cram every
pixel with information, which overwhelms non-technical users and reduces
comprehension.
Rule: Maximum 6 cards + 1 table + 1 chart per screen. More than that? Split the screen or
move to a detail page.
Anti-pattern: Dashboard with 12 widgets, 3 tables, and 2 charts on one screen. User cannot
tell what matters first.
2. Tile Based
Principle: Windows 8 सा(cid:10)रखे (cid:9)पण Modern. Information in glanceable tiles, not just rows.
9

PreOne UI Design Philosophy v1.0 | Design Freeze
Tiles are the primary information unit. Each tile communicates one piece of information at
a glance — today's attendance (95%), pending fees (₹42,500), new admissions (12). Tiles
have a clear hierarchy: large number (the 'what'), small label (the 'context'), and a 'View →'
action (the 'next step'). Tiles are sized by importance, not by symmetry — a critical metric
gets a larger tile than a secondary one. This is the modern evolution of the Windows 8 Start
screen: same information density, but with rounded corners, softer colors, and richer
interactions.
Rule: Every dashboard tile answers one question in one glance: number + label + view-link.
Anti-pattern: Tile that tries to show attendance AND fees AND admissions — user doesn't
know what to look at first.
3. Everything in Cards
Principle: Forms साद्धा(cid:20) (cid:10), Lists साद्धा(cid:20) (cid:10), Charts साद्धा(cid:20) (cid:10), Reports साद्धा(cid:20) (cid:10) — everything lives in a card.
Cards are the universal container. A form is a card. A list is a card. A chart is a card. A report
is a card. This consistency gives users a single mental model: 'I am looking at a card, and a
card has a title, content, and optional actions.' Cards have rounded corners (12-16px), soft
elevation (1-2px shadow), and a header-content-action structure. The card header carries
the title and optional filter/sort controls; the body holds the content; the footer (optional)
holds primary actions. This pattern repeats across all 320 page types in PreOne.
Rule: If content needs a container, it goes in a card. Cards never nest more than 2 levels
deep.
Anti-pattern: Form fields scattered on a page without visual grouping; chart floating
without a title or context.
4. Rounded UI
Principle: Not sharp. Radius 12-16px on cards, 8-12px on inputs, 50% on avatars, 24px on
large containers.
Rounded corners feel friendly and modern — critical for a preschool product where warmth
matters. Sharp corners (radius 0) feel corporate and cold; we avoid them except for data-
dense tables where edge alignment matters. The default card radius is 16px, inputs use
12px, buttons use 8-10px depending on size, and avatars are fully circular. The radius scale
is a design token — admins can adjust it via Design Studio (8px / 12px / 16px presets), and
the entire UI updates instantly.
10

PreOne UI Design Philosophy v1.0 | Design Freeze
Rule: Default radius: cards 16px, inputs 12px, buttons 8px, avatars 50%. Design Studio
allows global radius adjustment.
Anti-pattern: Inconsistent radii across the same screen — card at 16px, button at 4px, input
at 0px. Looks broken.
5. Flat
Principle: No heavy shadows. Very soft elevation. Depth via subtle layering, not drop
shadows.
Heavy shadows (4px+ blur, 30%+ opacity) feel dated and Web 2.0. PreOne uses soft
elevation: 1-2px shadows with 6-12px blur and 4-8% opacity. Depth is communicated
through subtle background tint (surface tokens) and 1px borders, not through shadow
drama. The only exception is modals and popovers, which use slightly stronger elevation (3-
4px, 12% opacity) to communicate layering above the page. This keeps the UI feeling
modern, calm, and lightweight — essential for low-end devices common in Indian schools.
Rule: Card shadow: 0 1px 3px rgba(0,0,0,0.04). Modal shadow: 0 4px 12px rgba(0,0,0,0.12).
No other shadows.
Anti-pattern: Card with 0 8px 24px shadow — feels heavy, slows rendering on low-end
devices, looks Web 2.0.
1.2 Typography
Inter is the default because it is optimized for screen reading at small sizes, has excellent
multilingual coverage (Latin, Devanagari via fallback), and renders crisply across Windows,
Mac, Android, and iOS. Poppins is offered as an alternative for schools wanting a rounder,
friendlier feel; Nunito for soft warmth; Roboto for familiarity (Android-native). The admin
selects the font family in Design Studio; CSS variables propagate the choice across the
entire UI.
Default font: Inter. Alternatives: Poppins, Nunito, Roboto. 1.5 for body text, 1.2 for
headings, 1.4 for table cells. Generous line height improves readability for non-native
English readers.
11

PreOne UI Design Philosophy v1.0  |  Design Freeze
Type Scale
| Token     | Size | Weight | Usage      |
| --------- | ---- | ------ | ---------- |
| --text-xs | 12px | 400    | Captions,  |
timestamps,
secondary metadata
| --text-sm | 14px | 400 | Table cells, form  |
| --------- | ---- | --- | ------------------ |
helper text, list items
| --text-base | 16px | 400 | Body text, default  |
| ----------- | ---- | --- | ------------------- |
input text, paragraph
| --text-lg | 18px | 500 | Card titles, section  |
| --------- | ---- | --- | --------------------- |
subheadings, form
labels
| --text-xl | 20px | 600 | Page subheadings,  |
| --------- | ---- | --- | ------------------ |
dialog titles,
important tiles
| --text-2xl | 24px | 600 | Page titles, primary  |
| ---------- | ---- | --- | --------------------- |
tile numbers
| --text-3xl | 32px | 700 | Dashboard tile  |
| ---------- | ---- | --- | --------------- |
numbers, hero text
| --text-4xl | 40px | 700 | Login screen school  |
| ---------- | ---- | --- | -------------------- |
name, onboarding
hero
Font Weights
| Weight | Name    |     | Usage                      |
| ------ | ------- | --- | -------------------------- |
| 400    | Regular |     | Body text, table content,  |
helper text
| 500 | Medium |     | Card titles, form labels,  |
| --- | ------ | --- | -------------------------- |
button text
| 600 | Semibold |     | Page titles, section headers,  |
| --- | -------- | --- | ------------------------------ |
important tiles
| 700 | Bold |     | Hero numbers, login  |
| --- | ---- | --- | -------------------- |
branding, onboarding
headlines
12

PreOne UI Design Philosophy v1.0  |  Design Freeze
1.3 Color Engine
Instead of hardcoding #6A35FF everywhere, every color is a CSS variable (design token).
When the theme changes, the complete UI updates instantly. This is the technical
foundation of multi-tenant branding: one codebase, infinite themes.
Override mechanism: School theme JSON is loaded at app boot and injected as inline CSS
variables on :root. Branch themes inject on a more specific selector. User preference
(light/dark) applies a class on <html>. The cascade resolves: user preference > branch >
school > platform. No component code reads hardcoded colors — all components
reference var(--token).
Semantic Color Tokens (Light Mode)
| Token     | Default | Usage                    |
| --------- | ------- | ------------------------ |
| --primary | #6A35FF | Primary actions, active  |
states, brand emphasis, links
| --primary-hover | #5A2BD9 | Hover state for primary  |
| --------------- | ------- | ------------------------ |
buttons and links
| --primary-light | #F0EBFF | Subtle backgrounds, selected  |
| --------------- | ------- | ----------------------------- |
item tints, chip backgrounds
| --secondary | #009688 | Secondary actions,  |
| ----------- | ------- | ------------------- |
supporting elements, badges
| --accent | #FF6B35 | Highlights, call-to-action  |
| -------- | ------- | --------------------------- |
accents, notification dots
| --success | #10B981 | Success states, completed  |
| --------- | ------- | -------------------------- |
items, positive metrics
| --warning | #F59E0B | Warnings, pending items,  |
| --------- | ------- | ------------------------- |
attention-needed states
| --danger | #EF4444 | Errors, destructive actions,  |
| -------- | ------- | ----------------------------- |
overdue items
| --info | #3B82F6 | Informational badges,  |
| ------ | ------- | ---------------------- |
informational toasts, tips
| --bg-page | #F8F9FB | Page background behind  |
| --------- | ------- | ----------------------- |
cards
| --bg-card | #FFFFFF | Card background, input  |
| --------- | ------- | ----------------------- |
background on light surfaces
13

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Token        | Default | Usage                      |
| ------------ | ------- | -------------------------- |
| --bg-surface | #F1F3F5 | Secondary surfaces, table  |
header rows, disabled states
| --text-primary | #1A1D21 | Primary text, headings,  |
| -------------- | ------- | ------------------------ |
important content
| --text-secondary | #5B6B7D | Secondary text, captions,  |
| ---------------- | ------- | -------------------------- |
helper text
| --text-muted | #9AA5B1 | Muted text, placeholders,  |
| ------------ | ------- | -------------------------- |
disabled labels
| --border-default | #E3E7EB | Default borders on cards,  |
| ---------------- | ------- | -------------------------- |
inputs, dividers
| --border-strong | #C4CAD2 | Stronger borders for  |
| --------------- | ------- | --------------------- |
emphasis, table outer
borders
Dark Mode Token Overrides
| Token        | Dark Value | Usage                     |
| ------------ | ---------- | ------------------------- |
| --bg-page    | #0F1419    | Dark mode page background |
| --bg-card    | #1A1F26    | Dark mode card background |
| --bg-surface | #252B33    | Dark mode secondary       |
surface
| --text-primary   | #F1F3F5 | Dark mode primary text   |
| ---------------- | ------- | ------------------------ |
| --text-secondary | #9AA5B1 | Dark mode secondary text |
| --border-default | #2D3440 | Dark mode default border |
1.4 Motion
150-250ms for all transitions. Nothing flashy, nothing slow. Users should feel the UI
respond instantly, not wait for animations to finish. cubic-bezier(0.4, 0, 0.2, 1) for most
transitions (Material standard). cubic-bezier(0.0, 0, 0.2, 1) for entrances (deceleration).
cubic-bezier(0.4, 0, 1, 1) for exits (acceleration).
Motion Rules
•  Hover transitions: 150ms ease-out. Buttons, links, cards lift subtly on hover.
14

PreOne UI Design Philosophy v1.0 | Design Freeze
• Modal/Dialog open: 200ms with fade + 8px slide-up. Close: 150ms fade + 4px slide-
down.
• Tile hover: 200ms lift (transform: translateY(-2px)) + shadow enhance.
Communicates clickability.
• Page transitions: 200ms fade. No slide — slides disorient in dense admin UIs.
• Loading skeletons: 1.5s shimmer animation. Pulse, not spin — feels calmer.
• Toast notifications: 250ms slide-in from top-right, 4s display, 200ms slide-out.
• Reduced motion (accessibility): all transitions collapse to 0ms. Respects user's OS
setting.
Forbidden Motion
• Spinning loaders (use skeleton screens instead — they communicate shape, not just
'wait')
• Bounce animations (feel childish for an enterprise product)
• Animations longer than 300ms (feel sluggish)
• Multiple simultaneous animations on different elements (chaotic)
• Parallax scrolling (performance cost, disorienting)
• Auto-playing carousels (users miss content, accessibility issue)
1.5 Iconography
Style: Outlined, minimal, rounded. No colorful icons. No filled icons except for
active/selected states.
Library: Lucide (open-source, consistent, 1500+ icons). Custom icons only when Lucide
lacks a suitable option — must follow the same stroke width (1.5px), corner radius (2px),
and 24x24 viewbox.
Sizing: 16px (inline in text), 20px (buttons, list items), 24px (navigation, cards), 32px (empty
states), 48px (onboarding, large empty states).
Icon Rules
• Stroke width: 1.5px default, 2px for active/selected state
• Color: inherit from parent text color. Never hardcode icon color.
• Active state: filled variant or primary color tint
• No emoji in production UI (inconsistent across platforms, accessibility issues)
15

PreOne UI Design Philosophy v1.0 | Design Freeze
• No decorative icons without text labels (accessibility: icons need labels for screen
readers)
Forbidden Icons
• Material filled icons (too heavy, inconsistent with outlined style)
• Font Awesome (overused, less consistent than Lucide)
• Custom hand-drawn icons (inconsistent stroke width, alignment issues)
• Colorful multi-tone icons (breaks the minimal aesthetic)
1.6 Illustrations
Style: Soft, friendly, kids-themed but professional. Hand-drawn feel with consistent stroke.
Warm colors from the brand palette. Used in empty states, onboarding, error states, and
welcome screens — never in dense data views.
Library: Custom illustrations commissioned from a professional illustrator (unDraw style
but warmer). Stored as SVG components in the design system package. 40 base illustrations
covering: empty states (no students, no fees, no messages), error states (network error,
permission denied, not found), onboarding (welcome, first steps, completion), and
seasonal (festive greetings for Diwali, Christmas, etc.).
Illustration Usage
• Empty states: illustration + headline + subtext + primary action button
• Error states: illustration + headline + retry button
• Onboarding: full-screen illustration + step indicator + next button
• Welcome screen: school-branded illustration + welcome message + get-started
button
• Never: in tables, forms, dashboards, or anywhere they compete with data
16

PreOne UI Design Philosophy v1.0  |  Design Freeze
Part 2 — Theme Engine
The Theme Engine is PreOne's major unique selling proposition. In one database, 1000
schools can each have a completely different branded UI — different logos, colors, fonts,
dashboard layouts — while sharing the same backend codebase and database schema. This
is multi-tenant branding at the presentation layer, achieved through a four-level theme
hierarchy and CSS variable (design token) propagation. No component code changes; only
theme tokens change. This feature alone positions PreOne apart from every other
preschool ERP in the Indian market, where 'customization' usually means a different logo
on a login page.
2.1 Four-Level Theme Hierarchy
Platform Theme ↓ Subscription Plan (limits which features are themeable) ↓ School
Theme ↓ Branch Theme ↓ User Preference. The cascade resolves at runtime: when a user
loads the app, the platform theme loads first, then the school theme overrides matching
tokens, then the branch theme overrides further (if present), then the user preference
applies (light/dark, layout). The final computed theme is injected as CSS variables on :root.
| Level | Name           | Source         | Scope        | Configurable |
| ----- | -------------- | -------------- | ------------ | ------------ |
| 1     | Platform Theme | PreOne default | All tenants  | No           |
without a
custom theme
| 2   | School Branding | School Admin  | All branches     | Yes |
| --- | --------------- | ------------- | ---------------- | --- |
|     |                 | via Design    | and users under  |     |
|     |                 | Studio        | one school       |     |
| 3   | Branch          | Branch Admin  | All users under  | Yes |
|     | Branding        | via Design    | one branch       |     |
Studio (limited)
| 4   | User Preference | Each user via  | Single user only | Yes |
| --- | --------------- | -------------- | ---------------- | --- |
Profile →
Preferences
Hierarchy Details
Platform Theme (Level 1): The PreOne Fluent Metro default. Purple primary (#6A35FF), teal
secondary (#009688), Inter font, 16px radius. This is what a brand-new tenant sees before
they customize anything. It is maintained by the PreOne design team and updated with
each platform release.
17

PreOne UI Design Philosophy v1.0 | Design Freeze
School Branding (Level 2): School logo, school name, school colors (primary, secondary,
accent, and semantic colors), school banner, school font. Set by the School Admin in
Settings → Branding → Theme. Changes propagate to all branches and all users under that
school within 60 seconds (cache invalidation). This is the primary customization layer.
Branch Branding (Level 3): Optional. Branch banner, branch-specific welcome message,
limited color overrides (only accent color — primary/secondary remain school-level for
brand consistency). Useful for school chains where each branch has a distinct identity (e.g.,
'Little Angels — Koramangala' vs 'Little Angels — Indiranagar').
User Preference (Level 4): Light/Dark/Auto mode, sidebar collapsed/expanded, dashboard
widget arrangement, font size preference (accessibility). These do not override brand
colors — they layer on top. A user in dark mode still sees the school's brand colors, just
rendered against a dark background.
2.2 Theme Configuration
Path: Settings → Branding → Theme
Access: School Admin role or higher. Branch Admin can configure branch-level overrides
only.
Configuration Operations
• Change Logo — Upload PNG or SVG. Auto-generates favicon. Stored in S3, CDN-
cached.
• Change Colors — Primary, Secondary, Accent, Success, Warning, Danger, Info. Live
preview shows old vs new.
• Change Font — Inter (default), Poppins, Nunito, Roboto. Applied globally.
• Change Border Radius — 8px (compact), 12px (default), 16px (comfortable). Global
token update.
• Change Layout — Sidebar collapsed/expanded default, dashboard widget
arrangement.
• Live Preview — Old theme → New theme comparison before Apply.
• Apply — Commits changes. Cache invalidated. All users see new theme within 60
seconds.
• Revert — One-click revert to previous theme. Safety net for bad changes.
18

PreOne UI Design Philosophy v1.0 | Design Freeze
2.3 Logo Position
Default: Top-left of sidebar (expanded) or center of sidebar (collapsed). School name to the
right of logo. Academic year below school name in smaller, muted text.
┌─────────────────────────────────────┐
│ [LOGO] School Name │
│ Academic Year 2026-27 │
├─────────────────────────────────────┤
│ □ Dashboard │
│ □ Students │
│ □ ... │
└─────────────────────────────────────┘
Logo Rules
• Logo max-height: 40px (expanded sidebar), 32px (collapsed sidebar)
• Logo aspect ratio preserved — no stretching
• School name truncated with ellipsis if too long (tooltip shows full name)
• Academic year shown only when user has multi-year access
• On mobile: logo top-center, school name below, no academic year
2.4 Login Screen
Default: PreOne logo on login screen for tenants without custom branding.
Branded: School logo on login screen when school theme is configured. 'Powered by
PreOne' badge at bottom — required on all plans except Enterprise White-Label.
Login Screen Example
┌─────────────────────────────────────┐
│ │
│ [School Logo] │
│ ABC Preschool │
│ │
│ ┌─────────────────────┐ │
│ │ Phone / Email │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Password │ │
│ └─────────────────────┘ │
│ │
│ [ Sign In ] │
19

PreOne UI Design Philosophy v1.0 | Design Freeze
│ │
│ Forgot password? │
│ │
│ ───────────────────────────── │
│ Powered by PreOne │
└─────────────────────────────────────┘
Login Screen Rules
• School logo centered at top (max 80px height)
• School name below logo in --text-2xl, --text-primary
• Login form card below, max-width 400px, centered
• 'Powered by PreOne' badge at bottom: PreOne logo + text, 12px, --text-muted
• Enterprise White-Label plan: 'Powered by PreOne' badge removable
• Background: subtle pattern or school-uploaded login background image (optional,
Design Studio feature)
2.5 Theme Storage
Location: PostgreSQL: tenants.theme_config (JSONB), branches.theme_config (JSONB),
user_preferences.theme (JSONB)
Theme JSON Schema
{
"theme": "light" | "dark" | "auto",
"colors": {
"primary": "#009688",
"secondary": "#FF6B35",
"accent": "#FFD23F",
"success": "#10B981",
"warning": "#F59E0B",
"danger": "#EF4444",
"info": "#3B82F6"
},
"logo": {
"url": "https://cdn.preone.in/schools/abc/logo.png",
"favicon": "https://cdn.preone.in/schools/abc/favicon.ico"
},
"font": "Poppins",
"border_radius": 12,
"layout": {
"sidebar": "expanded" | "collapsed" | "auto-hide",
"dashboard": ["attendance", "fees", "admissions", "reports"]
},
"login_background": "https://cdn.preone.in/schools/abc/login-bg.jpg",
20

PreOne UI Design Philosophy v1.0 | Design Freeze
"welcome_message": "Welcome to ABC Preschool!"
}
Caching: Theme JSON cached in Redis (key: theme:{tenantId}:{branchId}). TTL 5 minutes.
Cache invalidated on theme update via event. CDN serves logo/favicon with 1-year cache +
content-hash URL.
21

PreOne UI Design Philosophy v1.0 | Design Freeze
Part 3 — PreOne Design Studio
PreOne Design Studio is a dedicated module that elevates PreOne to a premium position in
the Indian preschool ERP market. Accessible at Settings → Design Studio, it allows a School
Admin to customize the entire visual identity of their PreOne instance — logo, colors, fonts,
layouts, border radius, dark mode, welcome messages, banners, favicons, and even limited
parent-app branding — without writing a single line of code. The studio operates entirely
on CSS variables (design tokens), so no component code changes; only theme tokens
change, and the entire web portal and PreOne Hub parent app re-render in the new
branding instantly. This is the feature that lets 1000 schools share one codebase while each
having a unique branded experience — a positioning no competitor in the Indian market
currently offers.
3.1 Access Matrix
Design Studio is accessible to School Admin and above, with Branch Admin having limited
scope. The access matrix below defines who can do what.
Role Access Notes
Super Admin All features + platform PreOne internal team only
default theme
School Admin All Design Studio features for Primary user of Design Studio
their school
Branch Admin Branch banner + welcome Limited to branch-scope
message + accent color only overrides
Teacher / Staff View-only (cannot modify) Cannot access Design Studio
Parent No access Parents see the configured
theme, cannot change it
3.2 Design Studio Features
Design Studio provides 13 customization features. Each feature operates on CSS variables
(design tokens) — no component code changes. The school admin configures in the studio,
previews live, and applies. All users under the school see the new theme within 60 seconds.
22

PreOne UI Design Philosophy v1.0 | Design Freeze
School Logo
Upload PNG (max 1MB, min 200x200px) or SVG (max 500KB). Auto-generates favicon at
32x32, 64x64, 180x180 (Apple touch icon). Stored in S3, served via CDN with content-hash
URL for cache-busting. Live preview shows logo in sidebar, login screen, header, and parent
app before apply.
Constraints: PNG with transparency preferred. SVG preferred for crisp rendering at all sizes.
School name text shown alongside logo — logo should not contain the school name to
avoid redundancy.
Login Background
Upload JPG/PNG (max 2MB, recommended 1920x1080). Applied as login screen
background with 30% dark overlay for text readability. Default: subtle gradient using brand
colors. Live preview shows login screen with the uploaded background.
Constraints: No text in the background image (overlay will distort). No student photos
(privacy + consent). Recommended: abstract patterns, school building exterior, or
classroom illustrations.
Primary / Secondary Colors
Color picker for primary, secondary, accent, success, warning, danger, info. Each color
validated for WCAG AA contrast against white background (minimum 4.5:1 for text, 3:1 for
large text and UI components). Invalid colors show a warning with suggested alternatives.
Live preview shows the entire UI in the new colors before apply.
Constraints: Primary color must have a hover variant (auto-generated by darkening 10%).
Primary light variant auto-generated at 10% opacity on white. Cannot use pure black or
pure white as primary.
Dashboard Layout
Drag-and-drop tile arrangement. Admin chooses which tiles appear on each role's
dashboard (Principal, Teacher, Parent, Accountant, etc.). Tile sizes adjustable
(small/medium/large). Tiles can be hidden, pinned, or marked as favorite (always top).
Default layouts provided per role; admin customizes from there.
Constraints: Maximum 12 tiles per dashboard (beyond that, split into tabs). Critical tiles
(e.g., 'Today's Attendance' for Principal) cannot be hidden — only repositioned. Layout
saved per role, not per user.
23

PreOne UI Design Philosophy v1.0 | Design Freeze
Sidebar Style
Three options: Expanded (default, 240px wide, icon + label), Collapsed (72px wide, icon
only with tooltip), Auto-Hide (overlays on hover, full content width otherwise). Per-user
preference overrides admin default. Sidebar items customizable per role (e.g., parents see
only relevant items).
Constraints: Auto-Hide disabled on mobile (always overlay on mobile). Minimum 6 items
visible in sidebar — if fewer, consider consolidating. Logout and Settings always at bottom.
Card Style
Two density options: Comfortable (default, generous padding, 16px radius) and Compact
(tighter padding, 12px radius, more content per screen). Comfortable is preferred for touch
devices and less-technical users; Compact is preferred by power users on desktops. Per-
user preference overrides admin default.
Constraints: Compact mode reduces card padding from 24px to 16px, table row height from
48px to 36px. Font sizes unchanged. Critical for users on small monitors.
Border Radius
Three presets: 8px (Sharp — more corporate), 12px (Default — balanced), 16px (Soft —
friendliest). Applied globally to cards, inputs, buttons, modals. Live preview shows the
entire UI in the new radius before apply.
Constraints: Avatars always 50% (circular) regardless of global radius. Modals always use
global radius + 4px (slightly softer than cards).
Font Family
Four options: Inter (default), Poppins (rounder, friendly), Nunito (soft, warm), Roboto
(familiar, Android-native). All four pre-loaded as web fonts (Google Fonts) for instant
switching. Applied globally to all text. Devanagari (Marathi/Hindi) support verified for all
four via Noto Sans Devanagari fallback.
Constraints: Custom font upload not supported in v1 (planned for v2). All four fonts have
weights 400, 500, 600, 700 available. Font loading optimized via font-display: swap.
24

PreOne UI Design Philosophy v1.0 | Design Freeze
Light / Dark / Auto Mode
Three options: Light (default), Dark (inverted background/text, brand colors stay), Auto
(follows OS setting). Per-user preference; admin sets the default. Dark mode uses the dark
token values defined in Part 1 — brand colors remain, only surfaces and text invert.
Constraints: Dark mode contrast verified for WCAG AA. Charts and illustrations have dark-
mode variants. Printed reports always light mode (dark mode would waste ink).
Welcome Message
Custom welcome message shown on login screen below school name (max 80 chars).
Default: 'Welcome to {School Name}'. Supports English + Devanagari. Used to set the tone
— e.g., 'Where little ones bloom' or 'नन्हे(cid:9) कदम, बड़े(cid:29)(cid:9) सापन(cid:9)'.
Constraints: No emojis in welcome message (inconsistent across platforms). No HTML
(plain text only). Profanity filter applied on save.
School Banner
Upload JPG/PNG (max 3MB, recommended 1920x400). Shown on login screen (above login
form) and on the main dashboard header for the first 3 seconds after login (then collapses).
Default: gradient using brand colors. Used for seasonal greetings (Diwali, Christmas, New
Year) — admin can schedule banner changes.
Constraints: Banner should not contain critical text (collapses on small screens). Mobile:
banner hidden, only welcome message shown. Banner scheduling: admin sets start/end
date for each banner.
Favicon
Auto-generated from school logo. Manual override available (upload .ico or .png). Applied
to browser tab, bookmark, PWA home screen icon. Multiple sizes generated automatically
(16x16, 32x32, 180x180, 192x192, 512x512).
Constraints: Auto-generation prefers the logo's most distinctive element (may require
admin to upload a simplified favicon separately if the full logo is too detailed).
Parent App Branding (Limited)
School logo and school name shown in PreOne Hub parent app (mobile). Parent app uses
school colors for primary actions. Login screen of parent app shows school logo + 'Powered
25

PreOne UI Design Philosophy v1.0 | Design Freeze
by PreOne'. Limited because the parent app is a shared binary — full white-label parent app
requires Enterprise plan.
Constraints: Enterprise plan: fully white-labeled parent app (custom app name, custom app
icon, custom splash screen, no 'PreOne' mention). Available at additional cost.
3.3 Design Studio Workflow
The workflow below describes the end-to-end flow from opening Design Studio to all users
seeing the new theme. The key insight is the live preview — admin sees exactly what users
will see before committing. Revert provides a safety net for bad changes.
• 1. Admin navigates to Settings → Design Studio
• 2. Admin sees current theme on the left, live preview on the right
• 3. Admin modifies any combination of logo, colors, fonts, layout, radius, etc.
• 4. Live preview updates instantly as admin makes changes (no save required to
preview)
• 5. Admin clicks 'Compare' to see old vs new side-by-side
• 6. Admin clicks 'Apply' to commit changes — confirmation dialog warns that all
users will see the new theme
• 7. On confirm: theme JSON updated in DB, Redis cache invalidated, CDN cache
busted (logo URL changes)
• 8. Within 60 seconds, all active users see the new theme on their next API call or
page navigation
• 9. Admin can 'Revert' to previous theme at any time (one-click, no confirmation —
revert is always safe)
3.4 Technical Foundation
Design Studio operates entirely on CSS variables (design tokens). The theme JSON stored in
DB is transformed into CSS variables and injected on :root at app boot. When a user
navigates, the theme is included in the initial HTML response (server-side rendering) — no
flash of unstyled content. Components reference var(--token), never hardcoded values.
This is why a theme change updates the entire UI without any component code changes —
the components don't know about themes; they just read CSS variables.
26

PreOne UI Design Philosophy v1.0 | Design Freeze
Part 4 — Layout System
The layout system defines how pages, sidebars, headers, and content areas are structured
across PreOne. Consistency in layout reduces cognitive load — once a user learns the
layout, they can navigate any page in the system. The layout system is responsive (desktop,
tablet, mobile), adaptive (sidebar behavior changes by screen size), and role-aware
(different roles see different navigation items).
4.1 Global Layout
Desktop Layout
┌─────────────────────────────────────────────────────────┐
│ [LOGO] School Name [Search] [🔔] [Profile ▼] │ Header (64px)
├──────────┬──────────────────────────────────────────────┤
│ │ Page Title [Action] │
│ □ Dashb. │ ┌──────────────────────────────────────────┐ │
│ □ Stud. │ │ │ │
│ □ Teach. │ │ Card Content │ │
│ □ Fees │ │ │ │
│ □ Atten. │ └──────────────────────────────────────────┘ │
│ □ Messg. │ ┌──────────────────────────────────────────┐ │
│ □ Repor. │ │ Card Content │ │
│ □ Settin.│ └──────────────────────────────────────────┘ │
│ │ │
│ [Logout] │ │
└──────────┴──────────────────────────────────────────────┘
Sidebar Main Content Area
(240px) (flexible, max-width 1400px)
Mobile Layout
┌─────────────────────────┐
│ ☰ School Name [🔔] │ Header (56px)
├─────────────────────────┤
│ Page Title │
│ ┌─────────────────┐ │
│ │ Card Content │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ Card Content │ │
│ └─────────────────┘ │
│ │
├─────────────────────────┤
│ □ □ □ □ □ □ │ Bottom Nav (56px)
└─────────────────────────┘
27

PreOne UI Design Philosophy v1.0 | Design Freeze
4.2 Header
Height: 64px desktop, 56px mobile
Header Contents
• Logo + School Name (left, sidebar collapsed — full school name; sidebar expanded
— just logo)
• Global Search (center, 400px max-width, searches students, staff, invoices by
name/ID/phone)
• Notification bell (right, shows unread count badge, dropdown shows recent
notifications)
• Profile menu (right, avatar + name + role, dropdown: Profile, Settings, Theme,
Logout)
Header Rules
• Header is sticky (position: sticky, top: 0) — always visible on scroll
• Header background: var(--bg-card) with 1px bottom border var(--border-default)
• Header z-index: 100 (above content, below modals at 1000)
• On mobile: logo hidden, only school name; search collapses to icon; bottom nav
replaces sidebar
4.3 Sidebar
Width: 240px expanded, 72px collapsed, 0px auto-hide (overlay on hover)
Sidebar Contents
• Logo + School Name + Academic Year (top, 64px tall, matches header)
• Navigation items (middle, grouped by section: Operations, Academics,
Administration, Reports, Settings)
• Help + Logout (bottom, 48px tall)
Sidebar Behaviors
• Expanded (default on desktop ≥ 1200px): full sidebar visible, icon + label
• Collapsed (default on tablet 768-1199px or user preference): icon only, expand on
hover (overlay)
28

PreOne UI Design Philosophy v1.0 | Design Freeze
• Auto-Hide (user preference): sidebar hidden, hamburger menu reveals overlay
sidebar
• Mobile (< 768px): no sidebar, bottom navigation bar with 5 primary items + 'More'
Sidebar Customization
• Admin can reorder navigation items per role (Design Studio)
• Admin can hide non-critical items per role (e.g., hide 'Inventory' for teachers)
• Critical items (Dashboard, Logout, Settings) cannot be hidden
• User can collapse/expand sidebar (preference saved per user)
4.4 Content Area
Max width: 1400px (centered on screens wider than 1400px, with 32px page padding)
Padding: 32px desktop, 24px tablet, 16px mobile
Structure: Page Title (top, with optional action button on right) → Breadcrumb (optional,
below title) → Filter Bar (optional, below breadcrumb) → Cards (stacked vertically, 24px
gap) → Pagination (optional, at bottom of lists)
White Space Rule
Rule: Maximum 6 cards + 1 table + 1 chart per screen
Detail: More than that? Split the screen into tabs or move secondary content to a detail
page. The goal is glanceability — a user should be able to understand the page's purpose in
3 seconds.
Enforcement: Design review rejects mockups with more than 6 cards. Engineering review
rejects PRs with more than 6 cards on a single route without tab splitting.
4.5 Responsive Breakpoints
Breakpoint Min Width Target Layout
sm 0 Mobile phones Single column,
(portrait) bottom nav, stacked
cards
md 768 Tablets (portrait), Single column,
Mobile phones collapsible sidebar,
(landscape) stacked cards
29

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Breakpoint | Min Width | Target                | Layout            |
| ---------- | --------- | --------------------- | ----------------- |
| lg         | 1024      | Tablets (landscape),  | Two-column where  |
|            |           | Small laptops         | appropriate,      |
expanded sidebar
| xl  | 1280 | Standard laptops,     | Multi-column grids,  |
| --- | ---- | --------------------- | -------------------- |
|     |      | Small desktops        | expanded sidebar     |
| 2xl | 1536 | Large desktops, Wide  | Multi-column grids,  |
|     |      | monitors              | expanded sidebar,    |
max-width 1400px
content
4.6 Grid System
Type: 12-column CSS Grid with 24px gutter
Usage: Cards align to grid columns. A card can span 12 (full width), 6 (half), 4 (third), 3
(quarter), 8 (two-thirds), or 9 (three-quarters). On mobile, all cards span 12 (full width,
stacked).
Grid Examples
•  Dashboard: 4 stat tiles (3 cols each) + 1 chart (8 cols) + 1 list (4 cols)
•  Student list: 1 table (12 cols)
•  Student detail: 1 photo + summary (4 cols) + 1 tabs card (8 cols)
•  Settings: 1 nav (3 cols) + 1 form (9 cols)
30

PreOne UI Design Philosophy v1.0 | Design Freeze
Part 5 — Component Library
The PreOne component library is the single source of truth for UI building blocks. Every
component is built once, tested once, and reused across all 320 page types. Components
are implemented in React (web), React Native (mobile), and Figma (design) — all three stay
in sync via the design tokens. Engineers do not build custom components when a library
component exists; they use the library. New components require design review and
architecture approval.
5.1 Component Categories
The PreOne component library has 68 components across 8 categories. Each component is
built once, tested once, and reused across all 320 page types. Engineers do not build
custom components when a library component exists.
Category Component Count
Layout 12
Form 14
Data 13
Chart 7
Feedback 7
Action 6
Navigation 4
Utility 6
5.2 Layout Components
Component Key Props Usage
Card title, subtitle, actions, Universal container for all
padding, radius, elevation content. Header (title +
actions) + Body (content) +
optional Footer (actions).
31

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Component | Key Props                   | Usage                          |
| --------- | --------------------------- | ------------------------------ |
| Tile      | label, value, icon, trend,  | Dashboard glanceable           |
|           | onClick, size               | metric. Large value (number),  |
small label, optional trend
indicator, optional icon.
Clickable to drill down.
PageHeader title, subtitle, breadcrumb,  Top of every page. Title +
|     | actions | optional subtitle + optional  |
| --- | ------- | ----------------------------- |
breadcrumb + optional
action button on right.
Sidebar items, collapsed, onItemClick Left navigation. Items
grouped by section.
Collapsible to icon-only.
Auto-hide on mobile.
| Header | logo, schoolName, search,  | Top bar. Sticky. Contains      |
| ------ | -------------------------- | ------------------------------ |
|        | notifications, profile     | brand, search, notifications,  |
profile menu.
| BottomNav | items, active | Mobile navigation. 5 primary  |
| --------- | ------------- | ----------------------------- |
items + 'More'. Fixed to
bottom.
| Tabs | tabs, activeTab, onChange | Content organization within  |
| ---- | ------------------------- | ---------------------------- |
a page. Horizontal tabs at top
of card. Used when a page
has 3-7 sections.
Accordion items, allowMultiple Collapsible sections. Used for
long forms, FAQs, settings
groups.
Modal open, title, children, actions,  Overlay dialog for focused
|     | size | tasks (confirm, edit single  |
| --- | ---- | ---------------------------- |
item). Sizes: sm (400px), md
(600px), lg (800px), xl
(1000px).
Drawer open, side, title, children,  Side panel for filters, details,
|     | width | quick-edit. Slides in from  |
| --- | ----- | --------------------------- |
right (default) or left.
| Grid | columns, gap, children | 12-column responsive grid.  |
| ---- | ---------------------- | --------------------------- |
Cards align to columns.
32

PreOne UI Design Philosophy v1.0  |  Design Freeze
5.3 Form Components
| Component | Key Props | Usage |
| --------- | --------- | ----- |
TextInput label, value, onChange, error,  Standard text input. Label
|     | helperText, placeholder,  | above, input below, helper  |
| --- | ------------------------- | --------------------------- |
|     | required, disabled        | text or error below that.   |
NumberInput label, value, onChange, min,  Numeric input with optional
|     | max, step, prefix, suffix | prefix (₹) or suffix (kg, cm).  |
| --- | ------------------------- | ------------------------------- |
Validates numeric.
| Select | label, value, options,      | Dropdown select. Single or     |
| ------ | --------------------------- | ------------------------------ |
|        | onChange, searchable, multi | multi. Searchable for lists >  |
10 items.
DatePicker label, value, onChange, min,  Date selection. Calendar
|     | max, range | popover. Supports single  |
| --- | ---------- | ------------------------- |
date or date range.
TimePicker label, value, onChange,  Time selection. 12-hour or
|     | format | 24-hour format based on  |
| --- | ------ | ------------------------ |
locale.
Checkbox label, checked, onChange,  Binary selection. Single or in
|     | indeterminate, disabled | group. |
| --- | ----------------------- | ------ |
RadioGroup label, value, options,  Mutually exclusive selection.
|     | onChange, direction | Horizontal or vertical layout. |
| --- | ------------------- | ------------------------------ |
Switch label, checked, onChange,  Toggle for binary settings
|     | disabled | (on/off). Used in settings, not  |
| --- | -------- | -------------------------------- |
in forms.
Textarea label, value, onChange, rows,  Multi-line text input.
|     | maxLength, counter | Optional character counter. |
| --- | ------------------ | --------------------------- |
FileUpload label, accept, maxSize,  Drag-and-drop file upload.
|     | multiple, onUpload | Shows preview for images,  |
| --- | ------------------ | -------------------------- |
file name for others.
Validates type and size.
| RichTextEditor | label, value, onChange,  | WYSIWYG editor for       |
| -------------- | ------------------------ | ------------------------ |
|                | toolbar                  | messages, observations,  |
announcements. Limited
toolbar (bold, italic, list, link).
33

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Component | Key Props | Usage |
| --------- | --------- | ----- |
OTPInput length, value, onChange,  6-digit OTP input. Individual
|     | onComplete | boxes, auto-advance, paste  |
| --- | ---------- | --------------------------- |
support.
| SearchInput | value, onChange,      | Debounced search input with   |
| ----------- | --------------------- | ----------------------------- |
|             | placeholder, onSearch | search icon. Triggers search  |
after 300ms of no typing.
FormLayout columns, children, spacing Wraps form fields in a
responsive grid. 1 column on
mobile, 2 on desktop.
5.4 Data Display Components
| Component | Key Props | Usage |
| --------- | --------- | ----- |
Table columns, data, sortable,  Tabular data. Sticky header.
|     | pagination, selectable,  | Sortable columns. Pagination  |
| --- | ------------------------ | ----------------------------- |
|     | onRowClick               | at bottom. Row click for      |
detail.
DataTable columns, data, filters, export,  Advanced table with filter
|     | density | bar, column show/hide,  |
| --- | ------- | ----------------------- |
CSV/PDF export, density
toggle. Used for lists.
| List | items, renderItem,     | Vertical list of items. Each  |
| ---- | ---------------------- | ----------------------------- |
|      | keyExtractor, loadMore | item is a row with avatar,    |
title, subtitle, action.
| Pagination | page, pageSize, total,  | Page navigation. Shows      |
| ---------- | ----------------------- | --------------------------- |
|            | onChange                | current page, total pages,  |
prev/next, page size selector.
| Badge | label, color, variant | Small status indicator.  |
| ----- | --------------------- | ------------------------ |
Variants: solid, soft, outline.
Colors: success, warning,
danger, info, neutral.
| Avatar | src, name, size, shape | User photo or initials.  |
| ------ | ---------------------- | ------------------------ |
Circular (default) or square.
Sizes: 24, 32, 40, 48, 64,
96px.
34

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Component | Key Props | Usage |
| --------- | --------- | ----- |
Chip label, onDelete, onClick,  Filter chip, tag, or selection.
|     | selected | Removable (x icon) or  |
| --- | -------- | ---------------------- |
clickable.
Stat label, value, unit, trend,  Inline statistic. Label + value
|     | trendValue | + optional unit + optional  |
| --- | ---------- | --------------------------- |
trend (up/down arrow with
%).
| ProgressBar | value, max, color, label | Horizontal progress  |
| ----------- | ------------------------ | -------------------- |
indicator. Used for form
completion, fee collection,
attendance.
| Timeline | items, variant | Vertical timeline of events.  |
| -------- | -------------- | ----------------------------- |
Used for audit logs,
application status, admission
pipeline.
EmptyState illustration, title, description,  Shown when no data.
|     | action | Illustration + headline +  |
| --- | ------ | -------------------------- |
subtext + primary action
button.
ErrorState illustration, title, description,  Shown on error. Illustration +
|     | onRetry | 'Something went wrong' +  |
| --- | ------- | ------------------------- |
Retry button.
| Skeleton | variant, width, height, count | Loading placeholder.  |
| -------- | ----------------------------- | --------------------- |
Variants: text, card, table-
row, avatar. Shimmer
animation.
5.5 Chart Components
| Component | Key Props | Usage |
| --------- | --------- | ----- |
LineChart data, xKey, yKeys, colors,  Trend over time. Attendance
|     | legend | %, fee collection, admissions  |
| --- | ------ | ------------------------------ |
trend.
| BarChart | data, xKey, yKeys, colors,  | Comparison across        |
| -------- | --------------------------- | ------------------------ |
|          | stacked                     | categories. Branch-wise  |
enrollment, class-wise
attendance.
35

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Component | Key Props | Usage |
| --------- | --------- | ----- |
PieChart data, colors, legend, donut Composition. Fee breakup,
attendance status
distribution.
| AreaChart | data, xKey, yKeys, colors,  | Cumulative trend.            |
| --------- | --------------------------- | ---------------------------- |
|           | stacked                     | Cumulative fees, cumulative  |
admissions.
DonutChart data, colors, centerLabel Pie chart with center label.
Used for percentage display.
Sparkline data, color, width, height Inline mini-chart in tiles and
tables. 7-day trend.
| GaugeChart | value, max, color, label | Single-value gauge.  |
| ---------- | ------------------------ | -------------------- |
Attendance rate, target
achievement.
5.6 Feedback Components
| Component | Key Props                 | Usage                          |
| --------- | ------------------------- | ------------------------------ |
| Toast     | message, type, duration,  | Transient notification. Top-   |
|           | action                    | right. Types: success, error,  |
warning, info. Auto-dismiss
after 4s.
Alert type, title, message, action Inline alert in page content.
Persistent until dismissed.
Types: success, warning,
error, info.
Snackbar message, action, onAction Bottom-center notification
with action button. 'Undo'
pattern.
Tooltip content, position, trigger Hover/focus tooltip for icon
buttons and truncated text.
Popover content, trigger, position Rich tooltip with interactive
content. Used for quick
details without navigation.
ConfirmDialog title, message, confirmLabel,  Confirmation modal for
|     | cancelLabel, onConfirm | destructive actions. 'Are you  |
| --- | ---------------------- | ------------------------------ |
sure?' pattern.
36

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Component | Key Props | Usage |
| --------- | --------- | ----- |
LoadingOverlay active, message Full-card loading overlay for
long operations (file upload,
report generation).
5.7 Action Components
| Component | Key Props                    | Usage                          |
| --------- | ---------------------------- | ------------------------------ |
| Button    | label, variant, size, icon,  | Primary action button.         |
|           | onClick, loading, disabled   | Variants: primary, secondary,  |
outline, ghost, danger. Sizes:
sm, md, lg.
IconButton icon, label, variant, size,  Icon-only button. Tooltip on
|     | onClick | hover shows label. |
| --- | ------- | ------------------ |
FloatingActionButton icon, label, onClick FAB for primary create
action. Bottom-right. Mobile-
only.
ButtonGroup buttons, value, onChange Group of toggle buttons.
Used for view switch
(list/grid), filter selection.
| DropdownMenu | items, trigger | Menu of actions. Triggered  |
| ------------ | -------------- | --------------------------- |
by button (kebab menu,
'More actions').
| Breadcrumb | items, onItemClick | Navigation trail. Home /  |
| ---------- | ------------------ | ------------------------- |
Students / Raj Patel / Edit.
5.8 Navigation Components
| Component | Key Props               | Usage                     |
| --------- | ----------------------- | ------------------------- |
| NavLink   | to, label, icon, active | Sidebar navigation item.  |
Active state highlighted.
| Tabs | tabs, active, onChange | Tab navigation. (Same as  |
| ---- | ---------------------- | ------------------------- |
Layout Tabs.)
| Stepper | steps, current | Multi-step flow indicator.  |
| ------- | -------------- | --------------------------- |
Admission application,
onboarding, payment.
37

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Component  | Key Props             | Usage                      |
| ---------- | --------------------- | -------------------------- |
| Pagination | page, total, onChange | Page navigation. (Same as  |
Data Pagination.)
5.9 Utility Components
| Component | Key Props | Usage |
| --------- | --------- | ----- |
Modal open, onClose, title, children Overlay dialog. (Same as
Layout Modal.)
Drawer open, onClose, side, children Side panel. (Same as Layout
Drawer.)
| Divider | variant, label | Horizontal divider with  |
| ------- | -------------- | ------------------------ |
optional label. Separates
sections in cards.
| Spacer | size | Vertical spacing element. Use  |
| ------ | ---- | ------------------------------ |
sparingly — prefer card body
padding.
| Tag | label, color, size | Small label tag. Similar to  |
| --- | ------------------ | ---------------------------- |
Badge but smaller, inline.
| KeyVal | label, value, copyable | Key-value pair display. Used  |
| ------ | ---------------------- | ----------------------------- |
in detail views. Optional
copy-to-clipboard.
38

PreOne UI Design Philosophy v1.0  |  Design Freeze
Part 6 — Page Catalog (All 14 Modules)
This part catalogs every page type across all 14 PreOne modules. Each module is a bounded
context (per DDD v1.0) with its own navigation, dashboards, list views, detail views, and
forms. The page catalog serves as the master reference for engineering — every page here
must be implemented, tested, and documented. Designers reference this catalog for
consistency; product managers reference it for scope; QA references it for test coverage.
6.1 Module Summary
PreOne has 14 modules (bounded contexts), each with its own navigation, dashboards, list
views, detail views, and forms. Total page types across all modules: 200. The table below
summarizes each module; subsequent sections detail every page in every module.
| ID  | Module Name | Domain   | Pages |
| --- | ----------- | -------- | ----- |
| M01 | Identity &  | Platform | 15    |
Authentication
| M02 | CRM (Lead  | Admissions | 12  |
| --- | ---------- | ---------- | --- |
Management)
| M03 | Admissions        | Admissions    | 12  |
| --- | ----------------- | ------------- | --- |
| M04 | Student Lifecycle | Student       | 13  |
| M05 | Academics         | Academics     | 13  |
| M06 | Daily Operations  | Attendance +  | 13  |
|     | (Attendance +     | Transport     |     |
Transport)
| M07 | Parent  | Communication | 12  |
| --- | ------- | ------------- | --- |
Communication
| M08 | Finance              | Finance   | 18  |
| --- | -------------------- | --------- | --- |
| M09 | Inventory            | Inventory | 16  |
| M10 | HR (Staff + Payroll) | HR        | 17  |
| M11 | Administration       | Platform  | 18  |
| M12 | Reports & Analytics  | Reports   | 13  |
| M13 | Settings             | Settings  | 13  |
| M14 | Platform             | Platform  | 15  |
Management
39

PreOne UI Design Philosophy v1.0  |  Design Freeze
6.2 M01 — Identity & Authentication
Domain: Platform
Role Access: All users
Total Pages: 15
| Page                | Type | Layout        | Notes              |
| ------------------- | ---- | ------------- | ------------------ |
| Login (Phone + OTP) | Auth | Centered card | Phone input → OTP  |
input → verify.
School logo +
'Powered by
PreOne'.
| Login (Email +  | Auth | Centered card | Email + password.      |
| --------------- | ---- | ------------- | ---------------------- |
| Password)       |      |               | Forgot password link.  |
Remember device
checkbox.
| Forgot Password | Auth | Centered card | Email → reset link  |
| --------------- | ---- | ------------- | ------------------- |
sent. Confirmation
screen.
| Reset Password | Auth | Centered card | New password +  |
| -------------- | ---- | ------------- | --------------- |
confirm. Password
strength meter.
Argon2 enforced
server-side.
| MFA Setup (TOTP) | Auth | Stepper | QR code →  |
| ---------------- | ---- | ------- | ---------- |
authenticator app →
verify code →
backup codes.
| MFA Challenge | Auth | Centered card | 6-digit TOTP input.  |
| ------------- | ---- | ------------- | -------------------- |
'Use backup code'
link. 'Remember
device' checkbox.
| First-Time Login  | Onboarding | Stepper | Welcome → Profile  |
| ----------------- | ---------- | ------- | ------------------ |
| Onboarding        |            |         | setup → Security   |
setup → Tour →
Done.
40

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page             | Type | Layout | Notes               |
| ---------------- | ---- | ------ | ------------------- |
| Session Timeout  | Auth | Modal  | Warning modal 5     |
| Warning          |      |        | min before session  |
expiry. 'Continue
session' or 'Sign out'.
| Account Locked | Auth | Centered card | After 5 failed  |
| -------------- | ---- | ------------- | --------------- |
attempts. Shows
unlock time. 'Contact
admin' link.
| User Profile | Detail | Tabs | Profile photo, name,  |
| ------------ | ------ | ---- | --------------------- |
contact, role, change
password, sessions,
preferences.
| User Preferences | Settings | Form | Theme  |
| ---------------- | -------- | ---- | ------ |
(light/dark/auto),
sidebar mode,
density, language,
timezone.
| Active Sessions | List | Table | List of active sessions  |
| --------------- | ---- | ----- | ------------------------ |
with device, location,
last active. Revoke
button per session.
| Change Password | Form | Card | Current password +  |
| --------------- | ---- | ---- | ------------------- |
new + confirm.
Strength meter.
Cannot reuse last 5
passwords.
| Manage API Keys | List | Table | API keys list with  |
| --------------- | ---- | ----- | ------------------- |
name, scopes, last
used, expiry. Create
+ revoke. 90-day
rotation enforced.
| Role & Permission  | Matrix | Table | Roles (rows) x  |
| ------------------ | ------ | ----- | --------------- |
| Matrix             |        |       | Permissions     |
(columns).
Check/uncheck per
role. Read-only for
non-super-admins.
41

PreOne UI Design Philosophy v1.0  |  Design Freeze
6.3 M02 — CRM (Lead Management)
Domain: Admissions
Role Access: Sales, Admission Counselor, Branch Head, School Admin
Total Pages: 12
| Page          | Type      | Layout            | Notes             |
| ------------- | --------- | ----------------- | ----------------- |
| CRM Dashboard | Dashboard | Tile grid + chart | Tiles: New leads  |
today, Lead-to-
enquiry %, Hot leads,
Conversion rate.
Chart: leads trend.
| Lead List | List | DataTable | All leads with search,  |
| --------- | ---- | --------- | ----------------------- |
filter (status, source,
program, assigned
to), sort, pagination,
export.
| Lead Detail | Detail | Tabs | Tabs: Profile, Activity  |
| ----------- | ------ | ---- | ------------------------ |
Timeline, Enquiries,
Documents, Tasks,
Communications.
| Create Lead | Form | Card form | Parent name,  |
| ----------- | ---- | --------- | ------------- |
contact, child name
& DOB, program
interest, source,
assigned counselor.
| Edit Lead | Form | Card form | Same as Create, pre- |
| --------- | ---- | --------- | -------------------- |
filled.
Lead Activity  Timeline Card timeline All activities: calls,
| Timeline |     |     | emails, visits, status  |
| -------- | --- | --- | ----------------------- |
changes. Reverse
chronological.
| Lead Conversion to  | Workflow | Stepper | Qualify lead →    |
| ------------------- | -------- | ------- | ----------------- |
| Enquiry             |          |         | Create enquiry →  |
Assign to admission
→ Notify.
42

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page               | Type   | Layout        | Notes            |
| ------------------ | ------ | ------------- | ---------------- |
| Lead Source Report | Report | Chart + table | Leads by source  |
(walk-in, online,
referral, campaign).
Conversion % per
source.
| Counselor   | Report | Chart + table | Per-counselor: leads  |
| ----------- | ------ | ------------- | --------------------- |
| Performance |        |               | assigned, enquiries   |
created, admissions
closed, conversion %.
| Lead Assignment | Workflow | Modal | Bulk assign leads to  |
| --------------- | -------- | ----- | --------------------- |
counselor. Round-
robin or manual.
| Follow-up Reminders | List | DataTable | Today's follow-ups,  |
| ------------------- | ---- | --------- | -------------------- |
overdue follow-ups.
Snooze / complete /
reschedule.
| Lead Import (CSV) | Upload | Stepper | Upload CSV → Map  |
| ----------------- | ------ | ------- | ----------------- |
columns → Validate
→ Preview →
Import.
6.4 M03 — Admissions
Domain: Admissions
Role Access: Admission Counselor, Branch Head, School Admin
Total Pages: 12
| Page | Type | Layout | Notes |
| ---- | ---- | ------ | ----- |
Admissions  Dashboard Tile grid + pipeline Tiles: Applications
| Dashboard |     |     | today, Pending  |
| --------- | --- | --- | --------------- |
approval, Approved
this week, Rejected.
Pipeline: stages.
43

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page             | Type | Layout    | Notes                  |
| ---------------- | ---- | --------- | ---------------------- |
| Application List | List | DataTable | All applications with  |
filter (status,
program, academic
year, branch), sort,
pagination, export.
| Application Detail | Detail | Tabs | Tabs: Applicant,  |
| ------------------ | ------ | ---- | ----------------- |
Parent, Documents,
Eligibility, Fee Plan,
Approvals,
Communications.
| Create Application | Form | Stepper | Steps: Applicant info  |
| ------------------ | ---- | ------- | ---------------------- |
→ Parent info →
Documents upload
→ Program selection
→ Fee plan →
Review → Submit.
| Edit Application | Form | Stepper | Same as Create, pre- |
| ---------------- | ---- | ------- | -------------------- |
filled. Locked fields
after approval.
| Document Review | Review | Card grid | Uploaded  |
| --------------- | ------ | --------- | --------- |
documents in cards
with preview,
verify/reject buttons,
rejection reason.
| Eligibility Check | Workflow | Card | Age validation per  |
| ----------------- | -------- | ---- | ------------------- |
program. Auto-
compute from DOB.
Show pass/fail with
rationale.
| Application Approval | Workflow | Modal | Approve / Reject /  |
| -------------------- | -------- | ----- | ------------------- |
Waitlist with reason.
Multi-tier approval
for fee waivers >
threshold.
44

PreOne UI Design Philosophy v1.0 | Design Freeze
Page Type Layout Notes
Fee Plan Selection Selection Card grid Available fee plans
for selected
program. Compare
side-by-side. Select +
proceed.
Admission Letter Document Print view Generated admission
letter with school
branding. Download
PDF, email to parent.
Application Status Timeline Card timeline All status changes
Tracking with timestamp,
user, reason. Parent-
visible subset via
parent app.
Admission Reports Report Charts + table Applications by
program, conversion
rate, avg time-to-
approval, rejection
reasons.
6.5 M04 — Student Lifecycle
Domain: Student
Role Access: Teacher, Branch Head, School Admin
Total Pages: 13
Page Type Layout Notes
Students Dashboard Dashboard Tile grid + chart Tiles: Total students,
New this month,
Active, Promoted.
Chart: enrollment
trend.
Student List List DataTable All students with
search (name, ID,
parent phone), filter
(class, branch,
status), sort, export.
45

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page           | Type   | Layout | Notes           |
| -------------- | ------ | ------ | --------------- |
| Student Detail | Detail | Tabs   | Tabs: Profile,  |
Parent/Guardian,
Academics,
Attendance, Fees,
Health, Documents,
Communications.
| Create Student | Form | Stepper | Steps: Student info  |
| -------------- | ---- | ------- | -------------------- |
→ Parent info →
Medical info →
Documents →
Classroom → Review
→ Save.
| Edit Student | Form | Card form | Edit student profile.  |
| ------------ | ---- | --------- | ---------------------- |
Sensitive fields (DOB,
parent) locked after
creation — require
admin.
| Student Promotion | Workflow | Modal | Bulk promote at year  |
| ----------------- | -------- | ----- | --------------------- |
boundary. Select
class → target class
→ preview →
confirm.
| Student Transfer  | Workflow | Stepper | Initiate transfer →  |
| ----------------- | -------- | ------- | -------------------- |
| (Branch)          |          |         | approve at source →  |
approve at
destination →
update records.
| Student Archive | Workflow | Confirm dialog | Soft-delete after 7  |
| --------------- | -------- | -------------- | -------------------- |
years per DPDP.
Requires admin +
reason. Reversible
for 30 days.
| Classroom  | Workflow | Card grid | Drag-and-drop     |
| ---------- | -------- | --------- | ----------------- |
| Assignment |          |           | students between  |
classrooms. Capacity
warnings. Save.
46

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page             | Type   | Layout | Notes               |
| ---------------- | ------ | ------ | ------------------- |
| Student Profile  | Upload | Modal  | Upload/crop photo.  |
| Photo            |        |        | Auto-resized to     |
256x256, 128x128,
64x64.
| Medical Record | Form | Card form | Allergies, conditions,  |
| -------------- | ---- | --------- | ----------------------- |
immunizations,
emergency contact.
Locked after doctor
verification.
| Student Documents | Library | Card grid | All documents (birth  |
| ----------------- | ------- | --------- | --------------------- |
cert, photos,
medical). Upload,
preview, download,
verify.
| Student Reports  | Document | Print view | Generated report       |
| ---------------- | -------- | ---------- | ---------------------- |
| Card             |          |            | card with milestones,  |
grades, teacher
remarks. Download
PDF.
6.6 M05 — Academics
Domain: Academics
Role Access: Teacher, Academic Coordinator, Branch Head
Total Pages: 13
| Page       | Type      | Layout            | Notes                |
| ---------- | --------- | ----------------- | -------------------- |
| Academics  | Dashboard | Tile grid + chart | Tiles: Lesson plans  |
| Dashboard  |           |                   | pending,             |
Observations today,
Reports due,
Milestone coverage.
Chart: observations
trend.
47

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page            | Type | Layout    | Notes              |
| --------------- | ---- | --------- | ------------------ |
| Curriculum Plan | Plan | Card grid | Annual curriculum  |
per program.
Themes, months,
learning outcomes.
Edit per month.
| Lesson Plan List | List | DataTable | All lesson plans with  |
| ---------------- | ---- | --------- | ---------------------- |
filter (program,
week, status), sort,
search.
| Lesson Plan Detail | Detail | Tabs | Tabs: Overview,  |
| ------------------ | ------ | ---- | ---------------- |
Activities, Materials,
Objectives,
Assessment, AI Draft,
History.
| Create Lesson Plan | Form | Card form | Theme, date,  |
| ------------------ | ---- | --------- | ------------- |
duration, activities,
materials, objectives.
AI draft button.
| Observation List | List | DataTable | All observations with  |
| ---------------- | ---- | --------- | ---------------------- |
filter (student, class,
date, milestone),
sort, search.
| Create Observation | Form | Card form | Student, date,  |
| ------------------ | ---- | --------- | --------------- |
category (behavior,
learning, social,
motor), narrative
note, photos. AI
draft.
| Observation Detail | Detail | Card | Full observation with  |
| ------------------ | ------ | ---- | ---------------------- |
photos, milestone
tags, parent-share
toggle.
| Milestone Tracker | Matrix | Table | Students (rows) x  |
| ----------------- | ------ | ----- | ------------------ |
Milestones
(columns). Status:
emerging / achieving
/ mastered. Per age
band.
48

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page             | Type | Layout    | Notes                  |
| ---------------- | ---- | --------- | ---------------------- |
| Report Card List | List | DataTable | All report cards with  |
filter (class, term,
status), sort.
| Create Report Card | Form | Stepper | Select student →  |
| ------------------ | ---- | ------- | ----------------- |
select term →
milestones → grades
→ teacher remarks
→ review →
generate. AI draft.
| Report Card Preview | Document | Print view | Print-ready report  |
| ------------------- | -------- | ---------- | ------------------- |
card. Download PDF,
email to parent,
share via parent app.
| AI Draft Review | Review | Side-by-side | AI-generated draft  |
| --------------- | ------ | ------------ | ------------------- |
on left, editable
version on right.
Accept/reject/modif
y.
6.7 M06 — Daily Operations (Attendance + Transport)
Domain: Attendance + Transport
Role Access: Teacher, Transport Manager, Branch Head
Total Pages: 13
| Page | Type | Layout | Notes |
| ---- | ---- | ------ | ----- |
Daily Ops Dashboard Dashboard Tile grid + chart Tiles: Attendance %,
Late arrivals,
Absentees, Transport
on-time. Chart:
attendance trend.
| Mark Attendance  | Workflow | Card grid | Student grid with    |
| ---------------- | -------- | --------- | -------------------- |
| (Class)          |          |           | present/absent/late  |
toggles. One-tap per
student. Save.
49

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page             | Type     | Layout | Notes                   |
| ---------------- | -------- | ------ | ----------------------- |
| Mark Attendance  | Workflow | List   | Trip-wise student list  |
| (Transport)      |          |        | with pickup/drop        |
status. GPS auto-
mark.
| Attendance List | List | DataTable | All attendance  |
| --------------- | ---- | --------- | --------------- |
records with filter
(date, class, student,
status), sort, export.
| Attendance  | Form | Modal | Correct attendance     |
| ----------- | ---- | ----- | ---------------------- |
| Correction  |      |       | for a student. Reason  |
required. Audit
logged.
| Absentee Report | Report | Chart + table | Absentees today,  |
| --------------- | ------ | ------------- | ----------------- |
this week, this
month. Trend.
Frequent absentees
flagged.
| Transport Route List | List | DataTable | All routes with filter  |
| -------------------- | ---- | --------- | ----------------------- |
(branch, vehicle,
driver), sort, search.
| Route Detail | Detail | Tabs | Tabs: Route map,  |
| ------------ | ------ | ---- | ----------------- |
Stops, Students,
Vehicle, Driver, Trip
history, Live tracking.
| Create Route | Form | Card form | Name, stops  |
| ------------ | ---- | --------- | ------------ |
(address + ETA),
vehicle, driver,
students per stop.
| Live Trip Tracking | Map | Full map | Real-time vehicle  |
| ------------------ | --- | -------- | ------------------ |
location on map. ETA
per stop. Student
pickup/drop status.
| Trip History | List | DataTable | All trips with date,  |
| ------------ | ---- | --------- | --------------------- |
route, driver,
start/end time,
deviations.
50

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page                 | Type | Layout    | Notes                 |
| -------------------- | ---- | --------- | --------------------- |
| Pickup Authorization | List | DataTable | Authorized guardians  |
per student. OTP-
based pickup
verification. Override
with reason + audit.
| Transport Alerts | List | Card list | Speed alerts, route  |
| ---------------- | ---- | --------- | -------------------- |
deviations, ETA
delays. Filter by
severity, date.
6.8 M07 — Parent Communication
Domain: Communication
Role Access: Teacher, Branch Head, Communication Manager
Total Pages: 12
| Page           | Type      | Layout            | Notes                  |
| -------------- | --------- | ----------------- | ---------------------- |
| Communication  | Dashboard | Tile grid + chart | Tiles: Messages        |
| Dashboard      |           |                   | today, Delivery rate,  |
Open rate, Pending
replies. Chart:
message volume.
| Conversation List | List | List | All conversations  |
| ----------------- | ---- | ---- | ------------------ |
(1:1 with parent).
Filter by unread,
class, student.
Search.
| Conversation View | Chat | Split view | Chat interface.  |
| ----------------- | ---- | ---------- | ---------------- |
Messages, photos,
attachments. AI reply
draft button.
| Broadcast List | List | DataTable | All broadcasts  |
| -------------- | ---- | --------- | --------------- |
(1:many). Filter by
channel, date, status.
Search.
51

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page             | Type | Layout    | Notes             |
| ---------------- | ---- | --------- | ----------------- |
| Create Broadcast | Form | Card form | Audience (class,  |
branch, all), channels
(push, SMS,
WhatsApp, email),
template, schedule.
| Broadcast Detail | Detail | Tabs | Tabs: Content,  |
| ---------------- | ------ | ---- | --------------- |
Audience, Delivery,
Opens, Clicks,
Bounces.
| Template List | List | DataTable | All message  |
| ------------- | ---- | --------- | ------------ |
templates. Filter by
channel, category,
locale. Search.
| Create Template | Form | Card form | Name, channel,  |
| --------------- | ---- | --------- | --------------- |
category, locale,
subject, body with
variables. Preview.
| Notification Center | List | Card list | All notifications sent.  |
| ------------------- | ---- | --------- | ------------------------ |
Filter by channel,
status, date. Search.
| Delivery Report | Report | Chart + table | Delivery rate per  |
| --------------- | ------ | ------------- | ------------------ |
channel, per
template, per day.
Failures with reason.
| Opt-out    | List | DataTable | Parents who opted   |
| ---------- | ---- | --------- | ------------------- |
| Management |      |           | out. Channel-wise.  |
Re-subscribe
requires parent
action.
| AI Reply Drafts | Review | Side-by-side | AI-drafted reply on  |
| --------------- | ------ | ------------ | -------------------- |
left, editable on
right.
Accept/edit/reject.
6.9 M08 — Finance
Domain: Finance
Role Access: Accountant, Branch Head, School Admin
52

PreOne UI Design Philosophy v1.0  |  Design Freeze
Total Pages: 18
| Page | Type | Layout | Notes |
| ---- | ---- | ------ | ----- |
Finance Dashboard Dashboard Tile grid + chart Tiles: Collected
today, Outstanding,
Overdue, DSO. Chart:
collection trend.
| Invoice List | List | DataTable | All invoices with  |
| ------------ | ---- | --------- | ------------------ |
filter (status,
student, branch,
date), sort, search,
export.
| Invoice Detail | Detail | Tabs | Tabs: Summary,  |
| -------------- | ------ | ---- | --------------- |
Items, Payments,
Receipt, History,
Communications.
| Create Invoice | Form | Stepper | Student → fee items  |
| -------------- | ---- | ------- | -------------------- |
→ discounts → tax
→ review →
generate. Auto-
numbering.
| Bulk Invoice  | Workflow | Stepper | Select class/branch  |
| ------------- | -------- | ------- | -------------------- |
| Generation    |          |         | → select fee plan →  |
preview → generate
all.
| Payment List | List | DataTable | All payments with  |
| ------------ | ---- | --------- | ------------------ |
filter (mode, status,
date, student), sort,
export.
| Record Payment | Form | Card form | Invoice, amount,  |
| -------------- | ---- | --------- | ----------------- |
mode (cash, card,
UPI, cheque, bank),
reference, date.
| Payment Gateway  | Payment | Payment modal | Razorpay/UPI        |
| ---------------- | ------- | ------------- | ------------------- |
| (Online)         |         |               | integration. Card,  |
UPI, net banking.
Receipt auto-
generated.
53

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page    | Type     | Layout     | Notes              |
| ------- | -------- | ---------- | ------------------ |
| Receipt | Document | Print view | Generated receipt  |
with school
branding. Download
PDF, email/SMS to
parent.
| Refund List | List | DataTable | All refunds with filter  |
| ----------- | ---- | --------- | ------------------------ |
(status, amount,
date), sort.
| Process Refund | Workflow | Stepper | Invoice → refund  |
| -------------- | -------- | ------- | ----------------- |
amount → reason →
approval (2-tier if >
threshold) →
process.
| Fee Plan List | List | DataTable | All fee plans with  |
| ------------- | ---- | --------- | ------------------- |
filter (program,
academic year), sort.
| Create Fee Plan | Form | Card form | Program, academic  |
| --------------- | ---- | --------- | ------------------ |
year, fee items
(tuition, transport,
meal, activity),
frequency, discounts.
| Late Fee      | Settings | Card form | Grace period, late  |
| ------------- | -------- | --------- | ------------------- |
| Configuration |          |           | fee                 |
amount/frequency,
auto-apply toggle.
| GST Filing Report | Report | Table + export | Monthly GST report.  |
| ----------------- | ------ | -------------- | -------------------- |
Tax collected, filed,
pending. Export for
filing.
| Fee Defaulters  | Report | Table | Students with      |
| --------------- | ------ | ----- | ------------------ |
| Report          |        |       | overdue invoices.  |
Amount, days
overdue, last
reminder.
| Financial Statements | Report | Tabs | Tabs: P&L, Balance  |
| -------------------- | ------ | ---- | ------------------- |
Sheet, Cash Flow. Per
branch, per period.
54

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page           | Type     | Layout    | Notes           |
| -------------- | -------- | --------- | --------------- |
| Reconciliation | Workflow | Card grid | Match payments  |
with bank
statements. Auto-
match + manual.
Discrepancy flags.
6.10 M09 — Inventory
Domain: Inventory
Role Access: Store Manager, Branch Head, School Admin
Total Pages: 16
| Page | Type | Layout | Notes |
| ---- | ---- | ------ | ----- |
Inventory Dashboard Dashboard Tile grid + chart Tiles: Total SKUs,
Low stock, Out of
stock, Stock value.
Chart: consumption
trend.
| Item List | List | DataTable | All SKUs with filter  |
| --------- | ---- | --------- | --------------------- |
(category, branch,
stock status), sort,
search.
| Item Detail | Detail | Tabs | Tabs: Profile, Stock,  |
| ----------- | ------ | ---- | ---------------------- |
Movements, GRN,
PO, Consumption,
Valuation.
| Create Item | Form | Card form | Name, SKU,  |
| ----------- | ---- | --------- | ----------- |
category, unit,
reorder level,
valuation method
(FIFO/LIFO/avg).
| Stock Adjustment | Workflow | Modal | Adjust quantity with  |
| ---------------- | -------- | ----- | --------------------- |
reason (damage,
loss, recount). Audit
logged.
55

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page                | Type | Layout    | Notes                |
| ------------------- | ---- | --------- | -------------------- |
| Purchase Order List | List | DataTable | All POs with filter  |
(status, vendor,
date), sort, search.
| Create PO | Form | Stepper | Vendor → items →  |
| --------- | ---- | ------- | ----------------- |
quantities → rates →
taxes → review →
approve. 2-tier if >
₹50k.
| PO Approval | Workflow | Modal | Approve/reject with  |
| ----------- | -------- | ----- | -------------------- |
reason. Multi-tier for
high value.
| GRN List | List | DataTable | All GRNs with filter  |
| -------- | ---- | --------- | --------------------- |
(PO, vendor, date),
sort.
| Create GRN | Form | Stepper | PO → received items  |
| ---------- | ---- | ------- | -------------------- |
→ quantities →
quality check →
stock update.
| Vendor List | List | DataTable | All vendors with  |
| ----------- | ---- | --------- | ----------------- |
filter (category,
active), sort, search.
| Create Vendor | Form | Card form | Name, GST, contact,  |
| ------------- | ---- | --------- | -------------------- |
address, payment
terms, categories.
| Consumption Log | List | DataTable | All consumption  |
| --------------- | ---- | --------- | ---------------- |
entries with filter
(item, branch, date),
sort, export.
| Stock Valuation  | Report | Table + chart | Stock value per item,  |
| ---------------- | ------ | ------------- | ---------------------- |
| Report           |        |               | category, branch.      |
FIFO/LIFO/avg
comparison.
| Reorder Report | Report | Table | Items below reorder  |
| -------------- | ------ | ----- | -------------------- |
level. Suggested PO
quantity. Auto-
create PO button.
56

PreOne UI Design Philosophy v1.0 | Design Freeze
Page Type Layout Notes
Stock Count (Audit) Workflow Stepper Select location →
generate count sheet
→ enter counts →
review discrepancies
→ adjust.
6.11 M10 — HR (Staff + Payroll)
Domain: HR
Role Access: HR Manager, Branch Head, School Admin
Total Pages: 17
Page Type Layout Notes
HR Dashboard Dashboard Tile grid + chart Tiles: Total staff,
Present today, On
leave, Payroll
pending. Chart:
headcount trend.
Staff List List DataTable All staff with filter
(role, branch, status),
sort, search, export.
Staff Detail Detail Tabs Tabs: Profile,
Employment, Payroll,
Leave, Attendance,
Documents,
Performance.
Create Staff Form Stepper Personal info →
employment (role,
designation, branch,
joining) → salary
structure →
documents → review
→ save.
Edit Staff Form Card form Edit staff profile.
Salary changes
require approval +
audit.
57

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page             | Type     | Layout  | Notes                 |
| ---------------- | -------- | ------- | --------------------- |
| Staff Onboarding | Workflow | Stepper | Create staff → setup  |
payroll → assign role
→ create login →
induction checklist.
| Staff Offboarding | Workflow | Stepper | Resignation → notice  |
| ----------------- | -------- | ------- | --------------------- |
period → handover
→ full & final →
deactivate login →
archive.
| Payroll Run | Workflow | Stepper | Select month/branch  |
| ----------- | -------- | ------- | -------------------- |
→ preview payslips
→ approve →
disburse → file
statutory.
| Payslip List | List | DataTable | All payslips with filter  |
| ------------ | ---- | --------- | ------------------------- |
(staff, month,
status), sort, export.
| Payslip Detail | Document | Print view | Generated payslip  |
| -------------- | -------- | ---------- | ------------------ |
with school
branding. Earnings,
deductions, net pay.
Download PDF.
| Leave Request List | List | DataTable | All leave requests  |
| ------------------ | ---- | --------- | ------------------- |
with filter (staff,
status, type, date),
sort.
| Apply Leave | Form | Card form | Type, from-to,  |
| ----------- | ---- | --------- | --------------- |
reason, coverage
plan. Balance check.
Approval workflow.
| Leave Approval | Workflow | Modal | Approve/reject with  |
| -------------- | -------- | ----- | -------------------- |
reason. Balance
impact shown.
Coverage reminder.
58

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page           | Type   | Layout | Notes                |
| -------------- | ------ | ------ | -------------------- |
| Leave Balance  | Report | Table  | Per-staff leave      |
| Report         |        |        | balances. Accruals,  |
used, available. Per
leave type.
| Staff Attendance | List | DataTable | Daily staff  |
| ---------------- | ---- | --------- | ------------ |
attendance with
filter (date, branch,
status), sort, export.
| Statutory Filings | List | DataTable | PF, ESI, TDS filings  |
| ----------------- | ---- | --------- | --------------------- |
with status, due
date, filed date.
Reminders.
| Performance Review | Workflow | Stepper | Self-assessment →  |
| ------------------ | -------- | ------- | ------------------ |
manager review →
goals → rating →
feedback → finalize.
6.12 M11 — Administration
Domain: Platform
Role Access: School Admin, Super Admin
Total Pages: 18
| Page | Type | Layout | Notes |
| ---- | ---- | ------ | ----- |
Admin Dashboard Dashboard Tile grid + chart Tiles: Total tenants,
Active schools, Total
branches, Total
users. Chart: growth.
| Tenant List | List | DataTable | All tenants (schools)  |
| ----------- | ---- | --------- | ---------------------- |
with filter (status,
plan), sort, search.
Super admin only.
| Tenant Detail | Detail | Tabs | Tabs: Profile,  |
| ------------- | ------ | ---- | --------------- |
Subscription,
Branches, Users,
Billing, Theme,
Feature flags.
59

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page          | Type | Layout  | Notes          |
| ------------- | ---- | ------- | -------------- |
| Create Tenant | Form | Stepper | School info →  |
subscription plan →
first branch → admin
user → theme →
activate.
| Branch List | List | DataTable | All branches with  |
| ----------- | ---- | --------- | ------------------ |
filter (tenant, city,
status), sort, search.
| Create Branch | Form | Card form | Name, address, city,  |
| ------------- | ---- | --------- | --------------------- |
contact, academic
year, timezone.
| User List | List | DataTable | All users with filter  |
| --------- | ---- | --------- | ---------------------- |
(role, branch, status),
sort, search, export.
| Create User | Form | Card form | Name, email, phone,  |
| ----------- | ---- | --------- | -------------------- |
role, branch. Invite
email sent.
| Role List | List | DataTable | All roles with  |
| --------- | ---- | --------- | --------------- |
permissions count,
user count. Edit
permissions.
| Create Role | Form | Card form + matrix | Role name,  |
| ----------- | ---- | ------------------ | ----------- |
description,
permission matrix
(checkboxes).
| Audit Log | List | DataTable | All audit entries with  |
| --------- | ---- | --------- | ----------------------- |
filter (user, action,
entity, date), sort,
export. Immutable.
| Feature Flags | List | DataTable | All feature flags with  |
| ------------- | ---- | --------- | ----------------------- |
toggle per
tenant/branch.
Search.
60

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page             | Type | Layout    | Notes             |
| ---------------- | ---- | --------- | ----------------- |
| Integration List | List | DataTable | All integrations  |
(payment,
WhatsApp, SMS, AI)
with status, last sync,
config.
| Integration Config | Form | Card form | API keys, webhooks,  |
| ------------------ | ---- | --------- | -------------------- |
sync settings. Test
connection button.
| Subscription  | Detail | Tabs | Tabs: Plan, Invoices,  |
| ------------- | ------ | ---- | ---------------------- |
| Management    |        |      | Usage, Add-ons,        |
Renewal, Cancel.
| Billing History | List | DataTable | All invoices with  |
| --------------- | ---- | --------- | ------------------ |
status, amount, date.
Download PDF.
| Design Studio | Studio | Split view | Theme  |
| ------------- | ------ | ---------- | ------ |
customization. Live
preview.
Apply/Revert. (See
Part 3.)
| Settings (Global) | Settings | Tabs | Tabs: General,  |
| ----------------- | -------- | ---- | --------------- |
Academic Year,
Workflow,
Notifications,
Security, Backup,
API.
6.13 M12 — Reports & Analytics
Domain: Reports
Role Access: All roles (scope-based)
Total Pages: 13
61

PreOne UI Design Philosophy v1.0 | Design Freeze
Page Type Layout Notes
Reports Dashboard Dashboard Card grid Report categories as
cards: Operations,
Finance, Academics,
HR, Compliance.
Click to open.
Report List (by List Card grid Available reports in
category) category. Search,
filter by frequency,
format.
Report Generator Workflow Stepper Select report →
parameters (date
range, branch,
filters) → format
(PDF, Excel, CSV) →
schedule
(one-time/recurring)
→ generate.
Report Viewer Document Print view + charts Generated report
with charts + tables.
Download, email,
share.
Scheduled Reports List DataTable All scheduled reports
with filter
(frequency, status),
sort. Edit, pause,
delete.
Operations Report Report Charts + table Attendance trends,
late arrivals,
absentee patterns,
transport on-time.
Financial Report Report Charts + table Revenue, collections,
outstanding, DSO,
defaulters, write-
offs.
Admissions Report Report Charts + table Leads, applications,
conversions, time-to-
approve, rejection
reasons.
62

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page            | Type   | Layout         | Notes                |
| --------------- | ------ | -------------- | -------------------- |
| Academic Report | Report | Charts + table | Milestone coverage,  |
observations per
student, report card
completion.
| HR Report | Report | Charts + table | Headcount, attrition,  |
| --------- | ------ | -------------- | ---------------------- |
leave utilization,
payroll summary,
statutory
compliance.
| Compliance Report | Report | Table | DPDP, POSH, NBC,  |
| ----------------- | ------ | ----- | ----------------- |
RTE, FSSAI
compliance status
per branch.
| Custom Report  | Builder | Split view | Drag-and-drop      |
| -------------- | ------- | ---------- | ------------------ |
| Builder        |         |            | dimensions/measure |
s. Filter, group, sort.
Save as template.
| Report Templates | List | DataTable | Saved report  |
| ---------------- | ---- | --------- | ------------- |
templates. Duplicate,
edit, delete, share.
6.14 M13 — Settings
Domain: Settings
Role Access: School Admin, Branch Admin (limited)
Total Pages: 13
| Page          | Type       | Layout    | Notes                 |
| ------------- | ---------- | --------- | --------------------- |
| Settings Home | Navigation | Card grid | Categories: General,  |
Academic, Workflow,
Notifications,
Security, Branding,
Integrations, Backup,
API, Audit.
63

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page             | Type     | Layout    | Notes         |
| ---------------- | -------- | --------- | ------------- |
| General Settings | Settings | Card form | School name,  |
address, contact,
timezone, currency,
fiscal year, locale.
| Academic Year  | List | DataTable | All academic years  |
| -------------- | ---- | --------- | ------------------- |
| Settings       |      |           | with status         |
(active/upcoming/ar
chived). Create,
activate.
| Workflow Settings | Settings | Tabs | Tabs: Admissions,  |
| ----------------- | -------- | ---- | ------------------ |
Finance, HR, Leave.
Configure approval
matrices, thresholds.
| Notification Settings | Settings | Card form | Per-event channel  |
| --------------------- | -------- | --------- | ------------------ |
selection. Quiet
hours. Opt-out rules.
Template defaults.
| Security Settings | Settings | Card form | Password policy,  |
| ----------------- | -------- | --------- | ----------------- |
MFA enforcement,
session timeout, IP
allowlist, rate limits.
| Branding Settings | Studio | Split view | Redirects to Design  |
| ----------------- | ------ | ---------- | -------------------- |
Studio (Part 3).
| Integration Settings | List | DataTable | All integrations with  |
| -------------------- | ---- | --------- | ---------------------- |
status, config, last
sync. Edit, test,
disable.
| Backup Settings | Settings | Card form | Backup frequency,  |
| --------------- | -------- | --------- | ------------------ |
retention,
destination (S3),
encryption, restore
test.
API Settings Settings Card form + table API keys, rate limits,
webhooks, IP
allowlist. Generate,
revoke, test.
64

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page           | Type     | Layout    | Notes                  |
| -------------- | -------- | --------- | ---------------------- |
| Audit Settings | Settings | Card form | Audit retention, hash  |
chain verification,
export, alerting.
| Data Export | Workflow | Stepper | Select data → format  |
| ----------- | -------- | ------- | --------------------- |
→ date range →
request → download
link emailed. DPDP
DSAR.
| Data Retention | Settings | Card form | Per-entity retention  |
| -------------- | -------- | --------- | --------------------- |
periods. Auto-
archive rules. DPDP
compliance.
6.15 M14 — Platform Management
Domain: Platform
Role Access: Super Admin (PreOne internal)
Total Pages: 15
| Page | Type | Layout | Notes |
| ---- | ---- | ------ | ----- |
Platform Dashboard Dashboard Tile grid + chart Tiles: Total tenants,
MAU, API calls today,
Error rate. Charts:
growth, latency.
| Tenant List  | List | DataTable | All tenants with filter  |
| ------------ | ---- | --------- | ------------------------ |
| (Platform)   |      |           | (plan, status, region),  |
sort, search.
Suspend, terminate.
| Tenant Detail  | Detail | Tabs | Tabs: Profile,        |
| -------------- | ------ | ---- | --------------------- |
| (Platform)     |        |      | Subscription, Usage,  |
Health, Logs,
Support,
Impersonate.
65

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page               | Type | Layout    | Notes                |
| ------------------ | ---- | --------- | -------------------- |
| Subscription Plans | List | DataTable | All plans (Starter,  |
Growth, Enterprise,
White-Label) with
features, pricing,
tenants on plan.
| Create Plan | Form | Card form | Name, features  |
| ----------- | ---- | --------- | --------------- |
(checkbox matrix),
limits, pricing, billing
cycle.
Platform Health Dashboard Tile grid + chart API latency, error
rate, DB connections,
cache hit, queue
depth, infra metrics.
| Platform Logs | List | DataTable | Platform-level logs  |
| ------------- | ---- | --------- | -------------------- |
with filter (level,
service, traceId),
sort, search. Export.
| Feature Flag  | List | DataTable | All feature flags with  |
| ------------- | ---- | --------- | ----------------------- |
| Management    |      |           | toggle per              |
tenant/branch/globa
l. Audit log.
| Webhook    | List | DataTable | All webhook     |
| ---------- | ---- | --------- | --------------- |
| Management |      |           | endpoints with  |
status, last delivery,
retry. Test button.
| AI Gateway | Dashboard | Tile grid + chart | Tiles: Tokens  |
| ---------- | --------- | ----------------- | -------------- |
consumed today, AI
calls, Avg latency,
Cost. Charts: usage
trend.
| AI Model Config | Settings | Card form | Model selection,  |
| --------------- | -------- | --------- | ----------------- |
temperature, max
tokens, rate limits,
cost caps.
66

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Page            | Type | Layout    | Notes                |
| --------------- | ---- | --------- | -------------------- |
| Support Tickets | List | DataTable | All support tickets  |
with filter (status,
priority, tenant),
sort. Assign, resolve.
| Impersonate Tenant | Workflow | Confirm dialog | Super admin  |
| ------------------ | -------- | -------------- | ------------ |
impersonates tenant
admin for support.
Audit logged. Time-
limited.
| Platform Audit Log | List | DataTable | All platform-level  |
| ------------------ | ---- | --------- | ------------------- |
actions. Immutable.
Filter, search, export.
| Platform Settings | Settings | Tabs | Tabs: General, Email,  |
| ----------------- | -------- | ---- | ---------------------- |
SMS, WhatsApp,
Payment, AI,
Storage, CDN, DNS.
67

PreOne UI Design Philosophy v1.0 | Design Freeze
Part 7 — Multi-Tenant Branding & White Label
Multi-tenant branding is the architectural capability that lets 1000 schools share one
database and one codebase while each having a completely different branded UI. This is not
just 'logo on login page' — it is end-to-end theming: colors, fonts, layouts, dashboards,
mobile app branding, and (for Enterprise) full white-label with custom app name and icon.
This capability is PreOne's major USP in the Indian preschool ERP market, where
competitors either (a) offer one fixed UI for all schools, or (b) require separate deployments
per school. PreOne's approach — shared backend, themed frontend — gives each school a
branded experience at the operational cost of a single deployment.
7.1 Concept
Example: PreOne (platform default) ↓ ABC Kids (Blue theme) ↓ Tiny Tots (Green theme) ↓
Little Angels (Orange theme). Same backend, same database, same codebase. Each school's
users see only their school's branding. Cross-school data isolation enforced at the database
query layer (tenant_id filter); cross-school branding isolation enforced at the theme layer
(CSS variables from tenant's theme JSON).
Backend: Same. One PostgreSQL database, one API service, one Redis cache, one S3 bucket.
tenant_id on every row enforces data isolation. Theme JSON per tenant enforces branding
isolation.
Frontend: Different per tenant (visually). Same React codebase, same components, same
routes. Only the CSS variables differ — injected from the tenant's theme JSON at app boot.
The user sees a completely branded UI; the code sees var(--primary), var(--secondary), etc.
7.2 Branding Levels
PreOne offers four branding levels, tied to subscription plans. Each level unlocks additional
customization. The highest level (White-Label) removes all PreOne branding and ships a
fully client-branded mobile app.
Level What's Included Constraints
Standard (All plans) Logo, school name, colors, 'Powered by PreOne' badge
font, welcome message on on login screen. PreOne Hub
web portal parent app shows school
logo + 'Powered by PreOne'.
68

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Level | What's Included | Constraints |
| ----- | --------------- | ----------- |
Premium (Growth plan+) All Standard + custom login  'Powered by PreOne' badge
|     | background, school banner,   | still required on web. Parent  |
| --- | ---------------------------- | ------------------------------ |
|     | dashboard layout             | app still 'Powered by          |
|     | customization, sidebar style | PreOne'.                       |
Enterprise All Premium + 'Powered by  Parent app still 'Powered by
|     | PreOne' badge removable  | PreOne' (requires White- |
| --- | ------------------------ | ------------------------ |
|     | from web portal          | Label add-on).           |
White-Label Add-on All Enterprise + fully white- Requires Enterprise plan +
|     | labeled parent app (custom  | White-Label add-on. App      |
| --- | --------------------------- | ---------------------------- |
|     | app name, custom app icon,  | store submission under       |
|     | custom splash screen, no    | client's developer account.  |
|     | 'PreOne' mention anywhere)  | Additional cost.             |
7.3 White-Label Flow
Trigger: Client purchases Enterprise + White-Label add-on.
White-Label Steps
•  1. Sales confirms white-label plan in subscription management.
•  2. Platform admin enables 'white_label' feature flag for tenant.
•  3. Tenant admin uploads: app name, app icon (1024x1024), splash screen image,
custom domain (optional).
•  4. PreOne DevOps generates white-labeled mobile app build with tenant's branding
(CI/CD pipeline).
•  5. App submitted to App Store / Play Store under client's developer account (client
provides credentials or submits themselves).
•  6. Web portal: 'Powered by PreOne' badge removed automatically. Custom domain
configured (CNAME to PreOne load balancer, TLS via Let's Encrypt).
•  7. Ongoing: app updates (new features, bug fixes) require re-submission to app
stores. PreOne DevOps handles, client approves.
Technical detail: White-labeled mobile app is a separate build configuration in the React
Native monorepo. The build pipeline injects tenant-specific assets (icon, splash, name) and
produces a signed APK/IPA. The binary is uploaded to the client's app store account. Web
portal white-label is simpler — just a feature flag that hides the 'Powered by PreOne' badge
and enables custom domain routing at the CDN.
69

PreOne UI Design Philosophy v1.0 | Design Freeze
7.4 Theme Isolation
Multi-tenant branding requires multi-tenant isolation at every layer — not just the theme
layer. The table below documents isolation at each layer of the stack. Cross-tenant data
access is forbidden; cross-tenant branding access is impossible by construction.
Layer Isolation Mechanism
Data Database-level: every query filters by
tenant_id from JWT. Cross-tenant reads
require platform-admin scope and are
audited. No exceptions.
Cache Redis keys are prefixed with tenant_id (e.g.,
tnt_123:session:abc). Cache isolation
enforced at key level. No cross-tenant cache
reads possible.
Files S3 buckets partitioned by tenant_id prefix
(e.g.,
s3://preone-uploads/tnt_123/students/...).
IAM policies enforce per-tenant access. CDN
serves with signed URLs for private files.
Theme Theme JSON per tenant. At app boot, the
tenant's theme is fetched and injected as CSS
variables on :root. Components reference
var(--token), so they render in the tenant's
branding without any code change.
Search Elasticsearch indices prefixed by tenant_id
(e.g., tnt_123_students). Search queries filter
by tenant. No cross-tenant search.
70

PreOne UI Design Philosophy v1.0 | Design Freeze
Part 8 — Implementation Roadmap
This part translates the design philosophy into an actionable engineering roadmap. It
defines the design token architecture, the component library implementation plan, the
Design Studio delivery sequence, and the quality gates that ensure the design system is
built right. The roadmap is phased: foundations first (tokens, base components), then the
Design Studio (the differentiator), then module-by-module page implementation.
8.1 Token Architecture
Design tokens are organized in four layers. Raw tokens hold primitive values. Semantic
tokens alias raw tokens with meaningful names. Component tokens (optional) alias
semantic tokens for component-specific tweaks. Theme overrides replace semantic token
values per tenant. The cascade resolves at runtime.
Layer Detail
Raw tokens Primitive values: colors (hex), spacing (px),
radii (px), font sizes (px), shadows (css).
Stored in tokens.json (Style Dictionary
format).
Semantic tokens Aliases referencing raw tokens: --primary, --
bg-card, --text-primary, --border-default.
These are what components reference.
Component tokens Optional per-component aliases: --button-
primary-bg, --card-radius. Used when a
component needs a slightly different value
than the semantic default.
Theme overrides Tenant theme JSON overrides semantic
tokens. Platform default is the base;
school/branch/user cascade on top.
Tooling: Style Dictionary transforms tokens.json into platform-specific outputs: CSS
variables (web), JS constants (React), TypeScript types (engineers), Swift/Android XML
(mobile), Figma tokens (designers). Single source of truth; all platforms in sync.
File structure: /packages/design-tokens/ → tokens.json (source) → build/ (generated
CSS/JS/TS/Swift/XML) → consumed by /packages/ui/ (React), /apps/mobile/ (React
Native), /docs/figma/ (designers).
71

PreOne UI Design Philosophy v1.0 | Design Freeze
8.2 Component Library Implementation Plan
The component library is delivered in three phases over 12 weeks. Phase 1 covers the ~40
core components needed for the first pilot module. Phase 2 adds ~25 advanced
components. Phase 3 completes the library with ~21 remaining components and verifies
dark mode across all.
Phase Scope Deliverable
Phase 1 (Weeks 1-4) Layout components (Card, Storybook deployed. Unit
Tile, PageHeader, Sidebar, tests 90%+. Used in 1 pilot
Header, BottomNav, Tabs, module (Identity).
Modal, Drawer, Grid). Form
components (TextInput,
Select, DatePicker, Checkbox,
Switch, Button, IconButton,
FormLayout). Data
components (Table, List,
Badge, Avatar, EmptyState,
Skeleton). Feedback (Toast,
Alert, Tooltip,
ConfirmDialog). Total: ~40
components.
Phase 2 (Weeks 5-8) Advanced components Storybook updated. Used in 4
(DataTable, Timeline, Charts, pilot modules (Identity, CRM,
FileUpload, RichTextEditor, Admissions, Student).
OTPInput, Stepper,
Breadcrumb). Total: ~25
components. Refinements
from Phase 1 feedback.
Phase 3 (Weeks 9-12) Remaining components Complete library. 86
(FloatingActionButton, components. Used in all 14
Sparkline, GaugeChart, modules.
Popover, LoadingOverlay,
KeyVal, Divider, Spacer, Tag).
Total: ~21 components. Dark
mode verified across all
components.
Governance: New components require: design review (designer), architecture review
(engineer), Storybook entry, unit tests, accessibility audit, documentation. Component
changes require version bump (semver) and changelog. Breaking changes require
migration guide.
72

PreOne UI Design Philosophy v1.0 | Design Freeze
8.3 Design Studio Delivery
Design Studio is delivered in four phases over 20 weeks. Phase 1 (MVP) ships the core
customization. Phase 2 (Premium) adds advanced features. Phase 3 (Enterprise) adds
badge removal and parent app branding. Phase 4 (White-Label) ships the fully white-
labeled mobile app pipeline.
Phase Scope Timeline Deliverable
Phase 1 (MVP) Logo upload, color Weeks 5-8 Functional Design
picker Studio usable by
(primary/secondary/ school admins.
accent), font
selection, border
radius,
light/dark/auto, live
preview,
apply/revert.
Phase 2 (Premium) Login background, Weeks 9-12 Full Design Studio
school banner, per this document's
dashboard layout spec.
customization,
sidebar style, card
density, welcome
message, favicon
auto-gen.
Phase 3 (Enterprise) 'Powered by PreOne' Weeks 13-16 Enterprise-grade
badge removal, branding.
parent app branding
(limited), custom
domain support.
Phase 4 (White- Fully white-labeled Weeks 17-20 White-Label add-on
Label) mobile app build shippable.
pipeline. App store
submission
automation.
8.4 Page Implementation Plan
Strategy: Module-by-module, in priority order. Each module: design review → component
selection → page implementation → unit/integration/E2E tests → accessibility audit →
design QA → release. Estimated 2-3 weeks per module with 2 engineers + 1 designer.
73

PreOne UI Design Philosophy v1.0  |  Design Freeze
Module Priority
| Priority | Modules                     | Rationale                  |
| -------- | --------------------------- | -------------------------- |
| 1        | M01 Identity, M08 Finance,  | Core flows — login, fees,  |
|          | M04 Student                 | students. Highest user     |
impact.
| 2   | M03 Admissions, M06 Daily  | Daily operations —       |
| --- | -------------------------- | ------------------------ |
|     | Ops, M07 Communication     | admissions, attendance,  |
parent messaging.
| 3   | M05 Academics, M10 HR,   | Operational depth — lesson  |
| --- | ------------------------ | --------------------------- |
|     | M09 Inventory            | plans, payroll, stock.      |
| 4   | M02 CRM, M12 Reports,    | Supporting — leads,         |
|     | M13 Settings             | analytics, configuration.   |
| 5   | M11 Administration, M14  | Internal — super admin and  |
|     | Platform Management      | platform ops.               |
Quality Gates
•  Design review: designer approves mockups before implementation.
•  Component review: engineer verifies only library components used (no custom
components).
•  Accessibility audit: WCAG AA verified (color contrast, keyboard nav, screen reader).
•  Responsive audit: verified at sm, md, lg, xl, 2xl breakpoints.
•  Dark mode audit: all pages verified in dark mode.
•  Theme audit: all pages verified with at least 3 different school themes (blue, green,
orange).
•  Performance audit: LCP < 2s, TTI < 3s on staging.
8.5 Accessibility
Standards: WCAG 2.1 Level AA. Verified via axe-core (automated) + manual testing
(keyboard, screen reader).
Accessibility Features
•  High Contrast mode: toggle increases contrast for visually impaired users.
•  Large Font mode: toggle increases all text sizes by 25%.
•  Reduced Motion: respects OS setting. All animations collapse to 0ms.
74

PreOne UI Design Philosophy v1.0 | Design Freeze
• Keyboard Navigation: every interactive element reachable via Tab. Focus rings
visible (never removed).
• Screen Reader: all components have ARIA labels. Icons have aria-label. Images have
alt text.
• Color Independence: information never conveyed by color alone (always icon + text
+ color).
Accessibility Testing
• axe-core in CI: blocks PR on critical/serious violations.
• Manual keyboard test: every page navigable with Tab/Shift+Tab/Enter/Space/Esc.
• Screen reader test (NVDA on Windows, VoiceOver on Mac): every page announced
correctly.
• quarterly third-party accessibility audit.
75

PreOne UI Design Philosophy v1.0  |  Design Freeze
Appendix A — Design Token Reference
Complete reference of all design tokens in the PreOne Fluent Metro Design System. These
tokens are the single source of truth — components reference tokens, never raw values.
School themes override tokens; the cascade resolves at runtime.
Color Tokens
| Token     | Default (Light) | Dark    | Usage             |
| --------- | --------------- | ------- | ----------------- |
| --primary | #6A35FF         | #9D7BFF | Primary actions,  |
active states, brand
emphasis
| --primary-hover | #5A2BD9 | #8566E8 | Hover state for  |
| --------------- | ------- | ------- | ---------------- |
primary elements
| --primary-light | #F0EBFF | #2A1F4D | Subtle backgrounds,  |
| --------------- | ------- | ------- | -------------------- |
selected item tints
| --secondary | #009688 | #4DB6AC | Secondary actions,  |
| ----------- | ------- | ------- | ------------------- |
supporting elements
| --accent | #FF6B35 | #FF8A5C | Highlights, call-to- |
| -------- | ------- | ------- | -------------------- |
action accents
| --success | #10B981 | #34D399 | Success states,  |
| --------- | ------- | ------- | ---------------- |
positive metrics
| --warning | #F59E0B | #FBBF24 | Warnings, pending  |
| --------- | ------- | ------- | ------------------ |
items
| --danger | #EF4444 | #F87171 | Errors, destructive  |
| -------- | ------- | ------- | -------------------- |
actions
| --info | #3B82F6 | #60A5FA | Informational  |
| ------ | ------- | ------- | -------------- |
badges, tips
| --bg-page        | #F8F9FB | #0F1419 | Page background    |
| ---------------- | ------- | ------- | ------------------ |
| --bg-card        | #FFFFFF | #1A1F26 | Card background    |
| --bg-surface     | #F1F3F5 | #252B33 | Secondary surfaces |
| --text-primary   | #1A1D21 | #F1F3F5 | Primary text       |
| --text-secondary | #5B6B7D | #9AA5B1 | Secondary text     |
| --text-muted     | #9AA5B1 | #6B7280 | Muted text,        |
placeholders
76

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Token            | Default (Light) | Dark    | Usage            |
| ---------------- | --------------- | ------- | ---------------- |
| --border-default | #E3E7EB         | #2D3440 | Default borders  |
| --border-strong  | #C4CAD2         | #3D4452 | Stronger borders |
Spacing Tokens
| Token     | Value |     | Usage                         |
| --------- | ----- | --- | ----------------------------- |
| --space-0 | 0px   |     | No spacing                    |
| --space-1 | 4px   |     | Inline spacing, icon gaps     |
| --space-2 | 8px   |     | Tight element spacing         |
| --space-3 | 12px  |     | Input padding, list item gaps |
| --space-4 | 16px  |     | Card padding (compact),       |
button padding
| --space-6 | 24px |     | Card padding (default), card  |
| --------- | ---- | --- | ----------------------------- |
gaps
| --space-8 | 32px |     | Section padding, large card  |
| --------- | ---- | --- | ---------------------------- |
gaps
| --space-12 | 48px |     | Page section gaps         |
| ---------- | ---- | --- | ------------------------- |
| --space-16 | 64px |     | Large page padding, hero  |
spacing
Radius Tokens
| Token         | Value |     | Usage                     |
| ------------- | ----- | --- | ------------------------- |
| --radius-sm   | 8px   |     | Buttons, small inputs     |
| --radius-md   | 12px  |     | Inputs, dropdowns         |
| --radius-lg   | 16px  |     | Cards, modals (default)   |
| --radius-xl   | 24px  |     | Large containers, banners |
| --radius-full | 50%   |     | Avatars, pills            |
77

PreOne UI Design Philosophy v1.0  |  Design Freeze
Shadow Tokens
| Token |     | Value | Usage |     |
| ----- | --- | ----- | ----- | --- |
--shadow-sm 0 1px 3px rgba(0,0,0,0.04) Cards (default elevation)
| --shadow-md |     | 0 4px 12px rgba(0,0,0,0.12) | Modals, popovers,  |     |
| ----------- | --- | --------------------------- | ------------------ | --- |
dropdowns
--shadow-lg 0 8px 24px rgba(0,0,0,0.16) (Reserved, rarely used)
Typography Tokens
| Token     | Size | Weight | Line Height | Usage      |
| --------- | ---- | ------ | ----------- | ---------- |
| --text-xs | 12px | 400    | 1.4         | Captions,  |
metadata
| --text-sm | 14px | 400 | 1.4 | Table cells,  |
| --------- | ---- | --- | --- | ------------- |
helper text
| --text-base | 16px | 400 | 1.5 | Body text,  |
| ----------- | ---- | --- | --- | ----------- |
inputs
| --text-lg | 18px | 500 | 1.4 | Card titles,  |
| --------- | ---- | --- | --- | ------------- |
labels
| --text-xl | 20px | 600 | 1.3 | Page  |
| --------- | ---- | --- | --- | ----- |
subheadings
| --text-2xl | 24px | 600 | 1.25 | Page titles    |
| ---------- | ---- | --- | ---- | -------------- |
| --text-3xl | 32px | 700 | 1.2  | Tile numbers,  |
hero
| --text-4xl | 40px | 700 | 1.15 | Login branding |
| ---------- | ---- | --- | ---- | -------------- |
Motion Tokens
| Token           |     | Value | Usage                    |     |
| --------------- | --- | ----- | ------------------------ | --- |
| --duration-fast |     | 150ms | Hover, focus transitions |     |
| --duration-base |     | 200ms | Modal, drawer, tile      |     |
transitions
| --duration-slow |     | 250ms                        | Toast, page transitions |     |
| --------------- | --- | ---------------------------- | ----------------------- | --- |
| --ease-out      |     | cubic-bezier(0.4, 0, 0.2, 1) | Standard easing         |     |
78

PreOne UI Design Philosophy v1.0  |  Design Freeze
| Token         | Value                        | Usage           |
| ------------- | ---------------------------- | --------------- |
| --ease-in     | cubic-bezier(0.4, 0, 1, 1)   | Exit easing     |
| --ease-in-out | cubic-bezier(0.0, 0, 0.2, 1) | Entrance easing |
79

PreOne UI Design Philosophy v1.0  |  Design Freeze
Appendix B — Page Catalog Summary
Summary count of all page types across the 14 PreOne modules. Full detail in Part 6. This
appendix serves as a quick-reference for scope planning and test coverage.
| ID  | Module Name | Domain   | Page Count |
| --- | ----------- | -------- | ---------- |
| M01 | Identity &  | Platform | 15         |
Authentication
| M02 | CRM (Lead  | Admissions | 12  |
| --- | ---------- | ---------- | --- |
Management)
| M03 | Admissions        | Admissions    | 12  |
| --- | ----------------- | ------------- | --- |
| M04 | Student Lifecycle | Student       | 13  |
| M05 | Academics         | Academics     | 13  |
| M06 | Daily Operations  | Attendance +  | 13  |
|     | (Attendance +     | Transport     |     |
Transport)
| M07 | Parent  | Communication | 12  |
| --- | ------- | ------------- | --- |
Communication
| M08 | Finance              | Finance   | 18  |
| --- | -------------------- | --------- | --- |
| M09 | Inventory            | Inventory | 16  |
| M10 | HR (Staff + Payroll) | HR        | 17  |
| M11 | Administration       | Platform  | 18  |
| M12 | Reports & Analytics  | Reports   | 13  |
| M13 | Settings             | Settings  | 13  |
| M14 | Platform             | Platform  | 15  |
Management
Total page types across all modules: 200
80

PreOne UI Design Philosophy v1.0 | Design Freeze
Appendix C — Glossary
Term Definition
Design Token Named value (color, spacing, radius, etc.)
stored as a CSS variable. Components
reference tokens, not raw values. Enables
theming.
CSS Variable Custom CSS property (--name) that holds a
value. Inherited through the DOM.
Foundation of PreOne's theming system.
Theme Collection of token values that define a visual
identity. Platform default, school, branch, and
user themes cascade.
Design Studio PreOne module (Settings → Design Studio)
where school admins customize their theme
without code.
Tile Glanceable dashboard element showing one
metric: large number + small label + view link.
Card Universal container with title, content, and
optional actions. Rounded corners, soft
elevation.
White Space Empty space around content. PreOne
reserves 30%+ per screen for whitespace.
White-Label Removal of all PreOne branding from the
product. Enterprise add-on. Includes custom
app name, icon, splash.
Multi-Tenant Single deployment serving multiple
customers (schools) with data and branding
isolation.
Tenant A single school. Top-level isolation boundary
for data and branding.
Branch A physical preschool location under a tenant.
Can have branch-specific branding.
Bounded Context DDD concept. A boundary within which a
domain model applies. PreOne has 14
bounded contexts = 14 modules.
81

PreOne UI Design Philosophy v1.0 | Design Freeze
Term Definition
WCAG Web Content Accessibility Guidelines. PreOne
targets Level AA.
Skeleton Loading placeholder that mimics the shape of
upcoming content. Preferred over spinners.
Toast Transient notification at top-right. Auto-
dismisses after 4 seconds.
Drawer Side panel that slides in for filters or quick
edits. Right-side by default.
Modal Overlay dialog for focused tasks. Centered.
Blocks background interaction.
Empty State UI shown when no data exists. Illustration +
headline + subtext + action button.
Design Dictionary Single source of truth for design tokens. Style
Dictionary format. Transforms to
CSS/JS/TS/Swift/XML.
Style Dictionary Open-source tool by Amazon for managing
design tokens. Transforms tokens into
platform-specific formats.
PWA Progressive Web App. Installable web app
with offline support. PreOne web portal is a
PWA.
PreOne Hub PreOne's parent-facing mobile app. React
Native. Branded per school (limited) or fully
white-labeled (Enterprise).
Sidebar Left navigation panel. 240px expanded, 72px
collapsed. Auto-hides on mobile.
BottomNav Mobile navigation. 5 primary items + 'More'.
Fixed to bottom of screen.
Breadcrumb Navigation trail showing current location:
Home / Students / Raj Patel / Edit.
Stepper Multi-step flow indicator. Used in admissions,
onboarding, payment workflows.
Live Preview Design Studio feature showing real-time UI
changes before apply.
82

PreOne UI Design Philosophy v1.0 | Design Freeze
Term Definition
Powered by PreOne Badge on login/bottom of branded apps.
Required on all plans except Enterprise
White-Label.
CSS Cascade Order in which CSS rules apply. User
preference > branch > school > platform.
Acrylic Translucent material effect (Windows 11
Fluent). PreOne uses sparingly due to
rendering cost.
83

PreOne UI Design Philosophy v1.0 | Design Freeze
Document Control & Sign-off
This UI Design Philosophy document is the authoritative reference for all visual and
interaction design at PreOne. It is the foundation for the Component Library, Design Studio,
and every page across all 14 modules. Compliance is mandatory for all designers and
engineers. Deviations require design review approval.
Approval Matrix
Role Name Responsibility Date
Head of Design Design Council Design philosophy 2026-07-13
and token
architecture sign-off
Head of Frontend Engineering Council Implementation 2026-07-13
Engineering feasibility sign-off
Head of Product Product Council Product alignment 2026-07-13
and scope sign-off
VP Engineering Architecture Council Architecture and 2026-07-13
theming architecture
sign-off
Head of Accessibility Accessibility Council WCAG AA 2026-07-13
compliance sign-off
Head of Mobile Mobile Council Mobile (React 2026-07-13
Native)
implementation sign-
off
84

PreOne UI Design Philosophy v1.0 | Design Freeze
Revision History
Version Date Author Changes
1.0 2026-07-13 Design & Engineering Initial release. Design
Team Freeze status.
PreOne Fluent Metro
Design System
defined. 86
components, 320
page types across 14
modules, Design
Studio spec, multi-
tenant branding
architecture,
implementation
roadmap.
Document Control
This document is maintained by the PreOne Design & Engineering Team. Changes require
design council approval and a new revision history entry. The document is reviewed
quarterly and updated as the design system evolves. The current version is always available
in the PreOne design wiki. Questions, suggestions, and deviation requests should be
directed to the design council via the design Slack channel.
Distribution: All PreOne designers, frontend engineers, mobile engineers, and product
managers. Classification: Internal Design Reference — not for external distribution without
VP Design approval. The document is stored in the design wiki (single source of truth) and
mirrored to the monorepo /docs/ folder for version control. The wiki version is
authoritative when the two diverge.
85