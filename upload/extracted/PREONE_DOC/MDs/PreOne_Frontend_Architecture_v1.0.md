P R E O N E E N T E R P R I S E
PreOne Enterprise
Frontend Architecture
Frontend Architecture — Enterprise Preschool Operating System
Document Version: 1.0
Status: Frontend Architecture Freeze
Framework: Next.js 16 + React 19 + TypeScript
Date: 2026-07-14
Product: PreOne — Enterprise Preschool Operating System
Predecessor: Vision v1.0, Master PRD v1.0, DDD v1.0, ADR Catalog, UI Design Philosophy, API Contract Catalog,
Backend Technical Design
Successor: Web Portal Implementation, Component Library, Storybook, Playwright Tests, Production Build
Classification: Internal Engineering Reference
Prepared by: PreOne Frontend Architecture & Engineering Team
PreOne Platform Frontend Arch v1.0

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Table of Contents
1. Frontend Overview.........................................................................................................1
1.1 Purpose...........................................................................................................................1
1.2 Scope..............................................................................................................................2
1.3 Audience.........................................................................................................................2
1.4 Document Conventions..................................................................................................4
1.5 Related Documents........................................................................................................5
2. Technology Stack............................................................................................................5
2.1 Stack Pipeline.................................................................................................................5
2.2 Component Catalog........................................................................................................8
2.3 Version Pinning Strategy................................................................................................8
2.4 Type Sharing with Backend............................................................................................9
3. Project Structure...........................................................................................................10
3.1 Top-Level Layout..........................................................................................................11
3.2 Top-Level Directory Roles............................................................................................13
3.3 Monorepo Layout.........................................................................................................13
4. App Router...................................................................................................................15
4.1 Route Groups................................................................................................................15
4.2 App Router Features....................................................................................................19
4.3 Route Metadata...........................................................................................................20
5. Module Structure..........................................................................................................23
5.1 Module Template (student/ example).........................................................................23
5.2 Directory Responsibilities.............................................................................................25
5.3 Module List...................................................................................................................25
5.4 Module Barrel Pattern..................................................................................................25
1

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
6. Layout System..............................................................................................................27
6.1 Layout Catalog..............................................................................................................27
6.2 Layout Slots..................................................................................................................27
6.3 Layout Composition.....................................................................................................28
7. State Management.......................................................................................................30
7.1 Global State (Zustand)..................................................................................................30
7.2 Server State (TanStack Query).....................................................................................31
7.3 State Management Rules.............................................................................................31
7.4 Zustand Store Example.................................................................................................32
8. API Layer......................................................................................................................36
8.1 API Layer Flow..............................................................................................................37
8.2 API Service Catalog.......................................................................................................39
8.3 Axios Interceptor Rules................................................................................................39
8.4 Service Example............................................................................................................41
9. Authentication..............................................................................................................44
9.1 Authentication Flow.....................................................................................................45
9.2 Authentication Features...............................................................................................47
9.3 Token Storage Strategy................................................................................................48
9.4 Multi-School Context Switch........................................................................................48
10. RBAC...........................................................................................................................50
10.1 RBAC Layers................................................................................................................50
10.2 RBAC Examples...........................................................................................................50
10.3 RBAC Rules.................................................................................................................50
10.4 <Can> Component Implementation...........................................................................52
11. Navigation..................................................................................................................57
11.1 Navigation Types........................................................................................................57
11.2 Navigation Rules.........................................................................................................57
11.3 Command Palette (Cmd+K)........................................................................................58
2

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
12. Forms.........................................................................................................................61
12.1 Form Patterns.............................................................................................................61
12.2 Form Submission Flow...............................................................................................61
12.3 Form Rules..................................................................................................................64
12.4 Example — CreateStudentForm.................................................................................65
13. Validation...................................................................................................................72
13.1 Validation Levels.........................................................................................................72
13.2 Validation Examples...................................................................................................72
13.3 Zod Schema Example.................................................................................................72
14. Theme Engine.............................................................................................................75
14.1 Theme Hierarchy........................................................................................................75
14.2 Theme Hierarchy Layers.............................................................................................77
14.3 Theme Tokens............................................................................................................77
14.4 Theme Modes.............................................................................................................77
14.5 Theme Application.....................................................................................................77
15. Component Library.....................................................................................................81
15.1 Base Components.......................................................................................................81
15.2 Composite Components.............................................................................................81
15.3 Component Rules.......................................................................................................81
15.4 Storybook Integration................................................................................................83
16. Data Tables.................................................................................................................87
16.1 Table Features............................................................................................................87
16.2 Table Rules.................................................................................................................87
16.3 Table Component Example........................................................................................88
17. Charts.........................................................................................................................94
17.1 Chart Types.................................................................................................................94
17.2 Chart Rules.................................................................................................................94
17.3 Chart Example............................................................................................................96
3

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
18. Notifications.............................................................................................................100
18.1 Notification Types....................................................................................................100
18.2 Notification Rules.....................................................................................................100
18.3 Toast System............................................................................................................101
19. File Upload................................................................................................................105
19.1 Upload Features.......................................................................................................105
19.2 Upload Flow..............................................................................................................105
19.3 FileUpload Component Example..............................................................................107
20. Error Handling...........................................................................................................113
20.1 Error Types...............................................................................................................113
20.2 Error Flow.................................................................................................................113
20.3 Error Handling Rules.................................................................................................116
20.4 Global Error Boundary..............................................................................................117
21. Performance.............................................................................................................122
21.1 Performance Tactics.................................................................................................122
21.2 Performance SLOs....................................................................................................123
21.3 Bundle Analysis........................................................................................................123
22. Accessibility..............................................................................................................126
22.1 Accessibility Rules....................................................................................................126
22.2 Automated Testing...................................................................................................128
23. Internationalization..................................................................................................131
23.1 i18n Configuration....................................................................................................132
23.2 i18n Rules.................................................................................................................132
23.3 Translation File Example..........................................................................................133
24. Testing......................................................................................................................137
24.1 Test Pyramid.............................................................................................................137
24.2 Test Pyramid Diagram..............................................................................................138
24.3 Testing Rules.............................................................................................................139
4

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
24.4 Component Test Example........................................................................................141
25. Deployment..............................................................................................................145
25.1 Pre-Deployment Checklist........................................................................................146
25.2 Deployment Topology..............................................................................................146
25.3 CI/CD Pipeline...........................................................................................................146
26. Coding Standards......................................................................................................149
26.1 Standards Catalog....................................................................................................150
26.2 Pre-commit Hooks....................................................................................................152
26.3 PR Review Checklist..................................................................................................154
27. Folder Standards.......................................................................................................156
27.1 Folder Standards Catalog.........................................................................................156
27.2 ESLint Import Boundaries.........................................................................................158
28. Glossary....................................................................................................................162
29. Document Control.....................................................................................................162
29.1 Version History.........................................................................................................162
29.2 Approval Matrix........................................................................................................162
29.3 Review Cadence.......................................................................................................162
29.4 Distribution List........................................................................................................163
29.5 Companion Documents............................................................................................164
29.6 Deliverables..............................................................................................................165
Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-
click the TOC and select "Update Field."
5

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
1. Frontend Overview
1.1 Purpose
हा(cid:2) Document PreOne च्या(cid:2) Frontend System ची(cid:7) complete technical blueprint प्र(cid:9)दा(cid:2)न करतो(cid:15).
Frontend हा(cid:2) PreOne platform ची(cid:2) user-facing layer आहा(cid:17) — teachers, parents, administrators,
आणि(cid:20) platform operators सो(cid:15)बतो direct interact करतो(cid:15). या(cid:2) document ची(cid:2) primary goal म्हा(cid:20)जे(cid:17)
frontend architecture, patterns, standards, आणि(cid:20) tooling ची(cid:7) एकची source of truth स्था(cid:2)णिप्रतो कर(cid:20) (cid:17)
जे(cid:7) implementation, review, आणि(cid:20) onboarding सो(cid:2)ठी(cid:7) reference म्हा(cid:20)न(cid:29) वा(cid:2)प्ररली(cid:7) जे(cid:2)ऊ शक(cid:17) ली.
Frontend Architecture (FA) हा(cid:2) Vision, Master PRD, DDD, ADR, UI Design Philosophy, API
Contract Catalog, आणि(cid:20) Backend Technical Design च्या(cid:2) वार build हा(cid:15)तो(cid:15). या(cid:2) document मधून(cid:29) प्रढी$ (cid:7)ली
production artifacts तोया(cid:2)र हा(cid:15)तो(cid:7)ली: Complete Next.js Project Structure, 14 Business Domain
Modules, App Router Architecture, Global Layout System, State Management Strategy, API
Client Layer, Authentication & Session Management, RBAC Guards (Route, Screen,
Component, Button), Theme Engine & White Label Support, Form & Validation Framework,
Enterprise Component Library, Dashboard & Data Table Standards, Performance
Optimization Guide, Testing Strategy, आणि(cid:20) Frontend Coding Standards.
Frontend ची(cid:2) core philosophy म्हा(cid:20)जे(cid:17) type safety end-to-end (TypeScript + Zod + OpenAPI
codegen), component-driven development (Storybook-first), accessibility-by-default
(WCAG 2.2 AA), आणि(cid:20) progressive enhancement (server components + selective client
hydration). हा(cid:7) philosophy enterprise-grade reliability + developer productivity दा(cid:15)न्हा(cid:7) सोणि$नणि'चीतो
करतो(cid:17).
1.2 Scope
हा(cid:2) document फक्तो Web Portal (admin/teacher dashboard) च्या(cid:2) architecture cover करतो(cid:15).
खा(cid:2)ली(cid:7)ली explicitly out of scope आहा(cid:17)तो:
• Parent Mobile App (React Native) — separate mobile architecture document मध्या.(cid:17)
• Marketing Website — separate Next.js app with different stack (MDX + content
layer).
• Browser Extensions — out of current scope.
• Embedded Widgets (for third-party integration) — future scope.
1.3 Audience
हा(cid:2) document खा(cid:2)ली(cid:7)ली audiences सो(cid:2)ठी(cid:7) णिलीणिखातो आहा(cid:17):
6

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
• Frontend Engineers: Primary reference — module structure, patterns, coding
standards, testing strategy implementation सो(cid:2)ठी(cid:7).
• Tech Leads / Frontend Architects: Architecture enforcement — folder boundaries,
state management rules, performance budgets review सो(cid:2)ठी(cid:7).
• QA Engineers: Testing pyramid understanding, E2E patterns, accessibility testing
strategy सो(cid:2)ठी(cid:7).
• UI/UX Designers: Component library structure, Storybook workflow, theme engine
integration सो(cid:2)ठी(cid:7).
• DevOps / SRE: Deployment readiness, performance monitoring, error tracking
setup सो(cid:2)ठी(cid:7).
• AI Code Assistants: Each section structured as a prompt-able block; AI tools च्या(cid:2)
context मध्या (cid:17)णिदाल्या(cid:2)वार accurate Next.js code generation हा(cid:15)तो(cid:17).
• New Hires: Onboarding reference — first 2 weeks मध्या (cid:17)वा(cid:2)चीन(cid:29) frontend mental model
तोया(cid:2)र हा(cid:15)तो(cid:15).
1.4 Document Conventions
• Module names: kebab-case (student, attendance, identity).
• Component names: PascalCase (StudentCard, CreateStudentForm).
• File names: kebab-case (student-card.tsx, not StudentCard.tsx).
• Hook names: camelCase starting with 'use' (useStudents, usePermissions).
• Type names: PascalCase (StudentProfile, FeeBreakdown).
• Constant names: UPPER_SNAKE_CASE (MAX_FILE_SIZE).
• REST endpoints: kebab-case plural (/v1/students, /v1/attendance-records).
• Code blocks: monospace font (Consolas); tree diagrams use └ ─ characters.
• Bilingual content: Marathi business context + English technical terms preserved
exactly as user provided.
1.5 Related Documents
PreOne document series मध्या(cid:17) FA ची(cid:17) specific position आहा(cid:17). खा(cid:2)ली(cid:7)ली documents FA ची (cid:17)
predecessors आहा(cid:17)तो:
7

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Document        | Version | Status        | Relationship to FA     |
| --------------- | ------- | ------------- | ---------------------- |
| Vision Document | v1.0    | Vision Freeze | Strategic intent — FA  |
ची(cid:7) non-functional
requirements
(accessibility, i18n)
Vision श(cid:7) align
| Master PRD | v1.0 | Product Freeze | Functional  |
| ---------- | ---- | -------------- | ----------- |
requirements — FA
ची (cid:17)screens + user
flows PRD च्या(cid:2) FRs ची (cid:17)
direct mapping
| DDD | v1.0 | Architecture Freeze | Domain model — FA  |
| --- | ---- | ------------------- | ------------------ |
ची (cid:17)14 modules DDD
च्या(cid:2) bounded
contexts ची (cid:17)direct
mirror
ADR Catalog v1.0 Architecture Freeze Decisions — FA प्र(cid:9)त्या(cid:17)क
architectural choice
ली(cid:2) ADR reference
करतो(cid:15)
| UI Design Philosophy | v1.0 | Design Freeze | Theme engine,  |
| -------------------- | ---- | ------------- | -------------- |
component patterns,
accessibility
standards
| API Contract Catalog | v1.0 | API Freeze | Endpoint contracts  |
| -------------------- | ---- | ---------- | ------------------- |
— FA च्या(cid:2) API services
ची (cid:17)spec
| Backend Technical  | v1.0 | Backend Freeze | Backend architecture     |
| ------------------ | ---- | -------------- | ------------------------ |
| Design             |      |                | — FA च्या(cid:2) auth +  |
RBAC patterns श(cid:7)
aligned
2. Technology Stack
PreOne frontend ची(cid:2) technology stack enterprise-grade reliability, developer productivity,
आणि(cid:20) AI-assisted development optimize करण्या(cid:2)सो(cid:2)ठी(cid:7) choose क(cid:17) ली(cid:2) आहा(cid:17). प्र(cid:9)त्याक(cid:17)  choice ली(cid:2) ADR
backing आहा (cid:17)जे(cid:15) trade-offs documented करतो(cid:15). Stack ची(cid:2) core philosophy म्हा(cid:20)जे (cid:17)type safety end-
to-end (TypeScript + Zod + OpenAPI codegen), component-driven development (ShadCN +
8

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Storybook), आणि(cid:20) progressive enhancement (React Server Components + selective
hydration).
2.1 Stack Pipeline
User interaction ची(cid:2) flow stack च्या(cid:2) प्र(cid:9)त्याक(cid:17) layer through जे(cid:2)तो(cid:15). हा(cid:7) pipeline understanding user
experience आणि(cid:20) performance characteristics सोमजेण्या(cid:2)सो(cid:2)ठी(cid:7) critical आहा(cid:17):
User Action (click, type, navigate)
↓
React Event Handler (component)
↓
Hook (useStudents, usePermissions)
↓
TanStack Query cache OR Zustand store
↓ (cache miss)
API Service (services/student.ts)
↓
Axios Client (with interceptors)
↓
Backend REST API (over HTTPS)
↓
Response normalized + cached by TanStack Query
↓
Component re-renders with new data
↓
React commits DOM update
↓
User sees updated UI
2.2 Component Catalog
खा(cid:2)ली(cid:7)ली table सोवा/ stack components ची(cid:7) authoritative list आहा(cid:17). नवा(cid:7)न component introduce
करतो(cid:2)न(cid:2) या(cid:2) table मध्या (cid:17)entry जे(cid:15)डा(cid:2)वा(cid:7) ली(cid:2)गे(cid:17)ली आणि(cid:20) corresponding ADR draft कर(cid:2)वा(cid:2) ली(cid:2)गेली(cid:17) :
Component Version Role Highlights Why Chosen
Next.js v16 Meta- App Router, Production-
Framework RSC, Server grade React
Actions, Edge framework;
Runtime, ISR, built-in
Partial optimizations;
Prerendering Vercel-grade DX
9

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Component | Version | Role       | Highlights         | Why Chosen      |
| --------- | ------- | ---------- | ------------------ | --------------- |
| React     | v19     | UI Library | Concurrent         | Latest stable;  |
|           |         |            | rendering, use(),  | enables         |
|           |         |            | Actions,           | progressive     |
|           |         |            | useOptimistic,     | enhancement +   |
|           |         |            | useFormStatus,     | streaming       |
useActionState
| TypeScript | v5.5+ | Language | Strict mode,      | Type safety    |
| ---------- | ----- | -------- | ----------------- | -------------- |
|            |       |          | path aliases,     | end-to-end;    |
|            |       |          | satisfies, const  | backend types  |
|            |       |          | generics,         | shared via     |
|            |       |          | decorators        | OpenAPI        |
codegen
| Tailwind CSS | v4  | Styling | JIT, container   | Utility-first     |
| ------------ | --- | ------- | ---------------- | ----------------- |
|              |     |         | queries, native  | velocity; design  |
|              |     |         | cascade layers,  | tokens via CSS    |
|              |     |         | oklch() colors,  | vars              |
theme variables
| ShadCN UI | v2.x | Component  | Radix primitives,  | Own the code;    |
| --------- | ---- | ---------- | ------------------ | ---------------- |
|           |      | Foundation | copy-into-repo,    | no vendor lock-  |
|           |      |            | fully themable,    | in; AI-friendly  |
|           |      |            | accessible         | composability    |
TanStack Query v5 Server State Suspense mode,  Best-in-class
|     |     |     | infinite queries,  | data fetching +  |
| --- | --- | --- | ------------------ | ---------------- |
|     |     |     | mutations,         | cache            |
|     |     |     | optimistic         | invalidation     |
updates,
devtools
| Zustand     | v5  | Client State | Slices, persist,  | Minimal          |
| ----------- | --- | ------------ | ----------------- | ---------------- |
|             |     |              | devtools,         | boilerplate; no  |
|             |     |              | middleware,       | provider hell;   |
|             |     |              | selectors         | SSR-friendly     |
| React Hook  | v7  | Form         | Resolver          | Performance via  |
| Form        |     | Management   | pattern,          | uncontrolled     |
|             |     |              | controlled/unco   | refs; tiny re-   |
|             |     |              | ntrolled, field   | render scope     |
arrays, watch
10

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Component        | Version | Role        | Highlights         | Why Chosen          |
| ---------------- | ------- | ----------- | ------------------ | ------------------- |
| Zod              | v3      | Schema      | Infer, transform,  | Single source of    |
|                  |         | Validation  | refinements,       | truth for client +  |
|                  |         |             | discriminated      | server              |
|                  |         |             | unions, brand      | validation          |
| Axios            | v1.7    | HTTP Client | Interceptors,      | Mature              |
|                  |         |             | transformers,      | interceptor         |
|                  |         |             | cancel tokens,     | ecosystem; per-     |
|                  |         |             | retry, progress    | request config      |
| Socket.IO Client | v4      | Real-Time   | Rooms,             | Same protocol       |
|                  |         |             | namespaces,        | as backend;         |
|                  |         |             | ack callbacks,     | multi-instance      |
|                  |         |             | reconnection,      | via Redis           |
|                  |         |             | adapter            | adapter             |
NextAuth.js v5 (Auth.js) Auth Layer JWT strategy,  Standards-
|           |     |      | refresh rotation,  | based;           |
| --------- | --- | ---- | ------------------ | ---------------- |
|           |     |      | custom             | integrates with  |
|           |     |      | providers, edge    | backend JWT      |
|           |     |      | middleware         | flow             |
| next-intl | v3  | i18n | ICU                | App Router       |
|           |     |      | MessageFormat      | native; type-    |
|           |     |      | , plurals, dates,  | safe message     |
|           |     |      | numbers, locale    | keys             |
routing
| Recharts | v2  | Charts | Composable,       | React-native     |
| -------- | --- | ------ | ----------------- | ---------------- |
|          |     |        | responsive,       | API; integrates  |
|          |     |        | custom tooltips,  | with theme       |
|          |     |        | animation         | tokens           |
control
TanStack Table v8 Data Tables Headless, row  Headless = full
|     |     |     | models, column  | styling control;  |
| --- | --- | --- | --------------- | ----------------- |
|     |     |     | sizing,         | SSR-ready         |
virtualization,
sorting
| react-hook-form  | —   | Form Schema | zodResolver,  | Schema drives  |
| ---------------- | --- | ----------- | ------------- | -------------- |
| + zod            |     |             | infer         | UI + API       |
|                  |     |             | Input/Output  | contract       |
types from
schema
11

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Component | Version | Role       | Highlights   | Why Chosen          |
| --------- | ------- | ---------- | ------------ | ------------------- |
| Vitest    | v2      | Unit Test  | Native ESM,  | Vite-powered        |
|           |         | Runner     | jsdom,       | fast startup; Jest  |
|           |         |            | snapshot,    | API compatible      |
coverage v8, in-
source testing
| Playwright | v1.45+ | E2E + Visual | Cross-browser,  | Modern E2E;     |
| ---------- | ------ | ------------ | --------------- | --------------- |
|            |        |              | trace viewer,   | visual          |
|            |        |              | component       | regression via  |
|            |        |              | testing, auto-  | screenshot diff |
wait
| Storybook | v8  | Component Dev | CSF 3.0, addons,  | Living          |
| --------- | --- | ------------- | ----------------- | --------------- |
|           |     |               | interaction       | component       |
|           |     |               | tests, chromatic  | documentation;  |
|           |     |               | integration       | design system   |
hub
| ESLint + Prettier | v9  | Lint/Format | Flat config,  | Architecture     |
| ----------------- | --- | ----------- | ------------- | ---------------- |
|                   |     |             | import        | enforcement via  |
|                   |     |             | boundaries,   | import rules     |
react-hooks, jsx-
a11y
2.3 Version Pinning Strategy
Production stability सो(cid:2)ठी(cid:7) सोवा/ dependencies pinned आहा(cid:17)तो — caret ranges (~) फक्तो patch
updates allow करतो(cid:2)तो, minor/major bumps ली(cid:2) explicit review ली(cid:2)गेतो(cid:15). Lockfile (bun.lock)
committed आहा(cid:17) आणि(cid:20) Renovate Bot weekly PRs raise करतो(cid:15). Next.js major upgrades (15 → 16
→ 17) ली(cid:2) dedicated migration sprint allocate क(cid:17) ली(cid:2) जे(cid:2)तो(cid:15) — codemods + breaking changes
review सोहा.
2.4 Type Sharing with Backend
Frontend आणि(cid:20) backend च्या(cid:2) वार type drift prevent करण्या(cid:2)सो(cid:2)ठी(cid:7) OpenAPI codegen pipeline आहा(cid:17).
Backend च्या(cid:2) Swagger spec प्र(cid:2)सोन(cid:29)  frontend TypeScript types auto-generate हा(cid:15)तो(cid:2)तो. हा(cid:17) types
frontend च्या(cid:2) API services + Zod schemas ची(cid:2) foundation आहा(cid:17)तो. Type drift CI मध्या (cid:17)detect हा(cid:15)तो(cid:15) —
backend breaking change झा(cid:2)ल्या(cid:2)सो frontend build fail हा(cid:15)तो(cid:15):
Backend (NestJS + @nestjs/swagger)
    ↓ generates OpenAPI spec
openapi.json (committed to repo)
    ↓ codegen via openapi-typescript
12

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
types/api-contracts.ts (auto-generated, never hand-edited)
↓ imported by
services/*.ts (typed API clients)
↓ imported by
modules/*/hooks/*.ts (typed query hooks)
↓ consumed by
Components (typed props)
3. Project Structure
Project structure हा(cid:17) developer navigation ची(cid:2) foundation आहा(cid:17). PreOne मध्या(cid:17) strict folder
convention आहा(cid:17) जे(cid:15) ESLint import boundaries न(cid:17) enforce क(cid:17) ली(cid:2) जे(cid:2)तो(cid:15) — क(cid:15)(cid:20)तो(cid:7)हा(cid:7) file wrong
folder मध्या (cid:17)place क(cid:17) ल्या(cid:2)सो lint error यातो(cid:17) (cid:15) आणि(cid:20) build fail हा(cid:15)तो(cid:15). हा(cid:7) discipline onboarding friction कम(cid:7)
करतो(cid:17) आणि(cid:20) code discoverability वा(cid:2)ढीवातो(cid:17).
3.1 Top-Level Layout
apps/web/ folder च्या(cid:2) खा(cid:2)ली(cid:7)ली top-level directories आहा(cid:17)तो. प्र(cid:9)त्याक(cid:17) directory ची(cid:7) specific
responsibility आहा(cid:17) आणि(cid:20) cross-directory imports णिनयाणिमतो आहा(cid:17)तो:
apps/web/
├── app/ # Next.js App Router
├── modules/ # Business domain modules
├── components/ # Shared UI components
├── layouts/ # Layout shells
├── hooks/ # Shared hooks
├── lib/ # Framework glue (singletons, config)
├── services/ # API service layer
├── store/ # Zustand stores (UI state)
├── providers/ # Context providers
├── styles/ # Global CSS + theme tokens
├── types/ # Shared TypeScript types
├── utils/ # Pure utility functions
├── assets/ # Static assets (images, fonts, icons)
└── middleware.ts # Next.js edge middleware
3.2 Top-Level Directory Roles
Directory Responsibility Notes
app/ Next.js App Router — routes, Routing root; file-based
layouts, loading, error, page
components
13

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Directory | Responsibility           | Notes                      |
| --------- | ------------------------ | -------------------------- |
| modules/  | Business domain modules  | Feature-first organization |
(one folder per bounded
context)
| components/ | Shared UI components —  | Cross-module reusable |
| ----------- | ----------------------- | --------------------- |
base primitives + composite
| layouts/ | Layout shells — AuthLayout,  | Page-level wrappers |
| -------- | ---------------------------- | ------------------- |
DashboardLayout,
PrintLayout
| hooks/ | Shared hooks —  | Cross-module reusable |
| ------ | --------------- | --------------------- |
useDebounce, usePagination,
usePermissions
| lib/ | Framework glue —  | Singletons + config |
| ---- | ----------------- | ------------------- |
queryClient, axiosClient,
authConfig, i18nConfig
| services/ | API service layer — per- | REST + WebSocket clients |
| --------- | ------------------------ | ------------------------ |
domain API clients
| store/ | Zustand stores — global UI  | Client state |
| ------ | --------------------------- | ------------ |
state slices
| providers/ | Context providers —  | App-wide context wiring |
| ---------- | -------------------- | ----------------------- |
QueryProvider,
ThemeProvider,
AuthProvider
styles/ Global CSS, Tailwind layers,  Design system foundation
theme tokens, animations
types/ Shared TypeScript types —  Cross-module type contracts
DTOs, enums, brand types
| utils/ | Pure utility functions —  | Side-effect-free helpers |
| ------ | ------------------------- | ------------------------ |
formatters, parsers,
validators
| assets/ | Static assets — images, fonts,  | Bundled at build |
| ------- | ------------------------------- | ---------------- |
icons, illustrations
middleware.ts Next.js edge middleware —  Runs before every route
auth gate, locale redirect
14

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
3.3 Monorepo Layout
PreOne हा(cid:2) monorepo आहा(cid:17) — apps/ मध्या(cid:17) multiple applications (web, mobile-future,
marketing) आणि(cid:20) packages/ मध्या (cid:17)shared packages (ui, utils, types, config). हा (cid:17)setup Turborepo
न(cid:17) manage हा(cid:15)तो(cid:15) — task orchestration, caching, आणि(cid:20) parallel execution सोहा. प्र(cid:9)त्याक(cid:17) app वा app-
level dependencies own करतो(cid:15), shared packages ची(cid:7) versioning independent आहा(cid:17):
preone/
├── apps/
│ ├── web/ # Next.js admin portal
│ ├── marketing/ # Public marketing site
│ └── mobile/ # Future React Native app
├── packages/
│ ├── ui/ # Shared component library
│ ├── types/ # Shared TypeScript types
│ ├── utils/ # Shared utilities
│ ├── config/ # Shared config (eslint, tsconfig, tailwind)
│ └── api-client/ # Generated API client
├── turbo.json
└── package.json
4. App Router
Next.js 16 ची(cid:2) App Router हा(cid:2) PreOne ची(cid:2) primary routing system आहा(cid:17). App Router file-based
routing uses करतो(cid:15) — filesystem structure ची mirror URL structure. Server Components by
default, selective 'use client' directive for interactive components. हा (cid:17)approach performance
optimal करतो(cid:17) — minimum JS shipped to client, maximum work on server.
4.1 Route Groups
App Router मध्या(cid:17) route groups (parenthesized folders) URL structure ली(cid:2) affect न करतो(cid:17) logical
grouping enable करतो(cid:2)तो. PreOne मध्या(cid:17) दा(cid:15)न primary route groups आहा(cid:17)तो — (auth) for
unauthenticated pages (login, forgot password) आणि(cid:20) (dashboard) for authenticated pages
(students, finance, etc.). प्र(cid:9)त्याक(cid:17) group ची(cid:2) आप्रली(cid:2) layout आहा(cid:17):
app/
├── (auth)/
│ ├── layout.tsx # AuthLayout (minimal chrome)
│ ├── login/page.tsx
│ ├── forgot-password/page.tsx
│ └── reset-password/page.tsx
├── (dashboard)/
│ ├── layout.tsx # DashboardLayout (sidebar + header)
│ ├── dashboard/page.tsx
│ ├── student/
│ │ ├── page.tsx # Student list
15

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
│ ┒ └── [id]/page.tsx # Student detail
│ ├── admissions/
│ ├── finance/
│ ├── inventory/
│ ├── attendance/
│ ├── academics/
│ ├── communication/
│ ├── hr/
│ ├── administration/
│ ├── reports/
│ ├── settings/
│ └── platform/
├── (print)/
│ └── reports/[id]/page.tsx # Print-optimized layout
├── layout.tsx # RootLayout (HTML shell)
├── loading.tsx # Global loading fallback
├── error.tsx # Global error boundary
├── global-error.tsx # Root-level error
└── not-found.tsx # 404 page
4.2 App Router Features
PreOne मध्या(cid:17) App Router च्या(cid:2) खा(cid:2)ली(cid:7)ली features use हा(cid:15)तो(cid:2)तो. हा(cid:17) features ADR-FA-003 मध्या (cid:17)
documented आहा(cid:17)तो:
• Server Components (Default): Components render on server, zero JS shipped. Most
pages RSC-only — data fetched server-side, HTML streamed.
• Route Groups: Logical grouping without URL impact — (auth), (dashboard), (print).
• Nested Layouts: Layouts nest — RootLayout > DashboardLayout >
StudentDetailLayout. Persistent UI across route changes.
• Dynamic Routes: [id] segment for entity detail pages. Generate static params for
known IDs (ISR).
• Parallel Routes: @analytics, @feed slots rendered side-by-side. Used in dashboard
for independent data loading.
• Intercepting Routes: (..)modal intercepts navigation — e.g., photo modal opens
over gallery. Used in student profile.
• Loading States: loading.tsx auto-wraps route in Suspense. Skeletons during data
fetch.
• Error Boundaries: error.tsx catches errors within route subtree. Recovery actions +
error ID.
16

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
• Server Actions: Form submissions via Server Actions — no API endpoint needed.
Used for simple mutations.
• Streaming: React Suspense + Server Components — progressive HTML streaming.
Faster TTFB.
4.3 Route Metadata
प्र(cid:9)त्याक(cid:17) route ची(cid:7) metadata declare क(cid:17) लीली(cid:17) (cid:7) असोतो(cid:17) — title, description, permissions, sidebar
config. हा(cid:7) metadata generateMetadata() function through populate हा(cid:15)तो(cid:17). middleware.ts या(cid:2)
metadata ली(cid:2) read करून permission check perform करतो(cid:15):
// app/(dashboard)/student/[id]/page.tsx
export const metadata = {
title: 'Student Profile',
description: 'View + edit student details',
permissions: ['STUDENT_READ'], // custom field
sidebar: { key: 'students', label: 'Students', icon: 'users' },
};
export default async function StudentProfilePage({
params,
}: {
params: { id: string };
}) {
const student = await fetchStudent(params.id); // server-side fetch
return <StudentProfile student={student} />;
}
5. Module Structure
PreOne ची(cid:2) प्र(cid:9)त्याक(cid:17) business domain identical folder template follow करतो(cid:15). हा(cid:17) consistency
onboarding friction कम(cid:7) करतो (cid:17)— developer एक module णिशकल्या(cid:2)वार दासो$ र(cid:2) module navigate कर(cid:20) (cid:17)
intuitive हा(cid:15)तो(cid:17). प्र(cid:9)त्याक(cid:17) Business Domain स्वातोत्र5 module असोली(cid:17) . Module ची(cid:7) structure DDD च्या(cid:2)
bounded context श(cid:7) 1:1 align आहा(cid:17) — 14 modules = 14 bounded contexts.
5.1 Module Template (student/ example)
खा(cid:2)ली(cid:7)ली tree student/ module ची(cid:17) complete structure दा(cid:2)खावातो(cid:17). हा(cid:17)ची pattern सोवा/ 14 modules सो(cid:2)ठी(cid:7)
apply हा(cid:15)तो(cid:17) — फक्तो folder name बदालीतो(cid:17):
modules/student/
├── api/ # Module-specific API client functions
├── components/ # Module UI components
├── pages/ # Page compositions
├── forms/ # Form components (RHF + Zod)
17

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
├── hooks/             # Module hooks (TanStack Query wrappers)
├── services/          # Business logic (pure functions)
├── store/             # Module-local Zustand slice (UI state)
├── types/             # Module DTOs + types
├── validation/        # Zod schemas (source of truth)
├── utils/             # Module-scoped helpers
└── index.ts           # Public API barrel
5.2 Directory Responsibilities
प्र(cid:9)त्याक(cid:17)  sub-directory ची(cid:7) specific responsibility आहा(cid:17). खा(cid:2)ली(cid:7)ली table सोवा/ directories ची(cid:17) purpose +
boundaries document करतो(cid:17):
| Directory | Responsibility              | Example               |
| --------- | --------------------------- | --------------------- |
| api/      | Module-specific API client  | e.g., fetchStudents,  |
|           | functions                   | createStudent,        |
searchStudents
components/ Module UI components —  Module-scoped, not shared
StudentCard, StudentList,
StudentDetail
| pages/ | Page-level compositions  | Compose module     |
| ------ | ------------------------ | ------------------ |
|        | (used inside App Router  | components + hooks |
routes)
| forms/ | Form components —  | React Hook Form + Zod |
| ------ | ------------------ | --------------------- |
CreateStudentForm,
EditStudentForm,
BulkImportForm
| hooks/ | Module hooks —  | Encapsulate TanStack Query |
| ------ | --------------- | -------------------------- |
useStudents,
useStudentMutations,
useStudentFilters
services/ Module services — business  Pure functions + side effects
logic that doesn't fit
components
store/ Module-local Zustand slice  e.g., student list filters
(UI state only — no server
data)
| types/ | Module-specific types —  | Module DTOs |
| ------ | ------------------------ | ----------- |
StudentProfile,
StudentListFilters
18

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Directory   | Responsibility |     | Example                |
| ----------- | -------------- | --- | ---------------------- |
| validation/ | Zod schemas —  |     | Single source of truth |
CreateStudentSchema,
UpdateStudentSchema,
FilterSchema
| utils/ | Module utility functions —  |     | Module-scoped helpers |
| ------ | --------------------------- | --- | --------------------- |
formatStudentName,
computeAge
| index.ts | Public API barrel — exports  |     | Module encapsulation |
| -------- | ---------------------------- | --- | -------------------- |
only what other modules
may import
5.3 Module List
PreOne मध्या(cid:17) 14 business domain modules आहा(cid:17)तो — DDD च्या(cid:2) 14 bounded contexts श(cid:7) 1:1
mapping. प्र(cid:9)त्याक(cid:17)  module ची (cid:17)independent ownership, release cadence, आणि(cid:20) test suite आहा(cid:17):
| #   | Module   | Primary Domain   | Approximate Pages |
| --- | -------- | ---------------- | ----------------- |
| 1   | identity | Login, Profile,  | ~12               |
Settings, Tenant
Switch
| 2   | crm | Leads, Campaigns,  | ~15 |
| --- | --- | ------------------ | --- |
Conversions
| 3   | admissions | Applications,  | ~18 |
| --- | ---------- | -------------- | --- |
Counselling,
Approvals
| 4   | student | Student Lifecycle,  | ~22 |
| --- | ------- | ------------------- | --- |
Profiles, Guardians
| 5   | academics | Curriculum,  | ~20 |
| --- | --------- | ------------ | --- |
Observations, Report
Cards
| 6   | attendance | Daily Attendance,  | ~12 |
| --- | ---------- | ------------------ | --- |
Arrival, Pickup,
Reports
| 7   | communication | Announcements,  | ~15 |
| --- | ------------- | --------------- | --- |
Chat, Broadcasts
19

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| #   | Module  | Primary Domain   | Approximate Pages |
| --- | ------- | ---------------- | ----------------- |
| 8   | finance | Fees, Invoices,  | ~28               |
Payments, Ledger,
Reports
| 9   | inventory | Items, Stock,  | ~18 |
| --- | --------- | -------------- | --- |
PR/PO/GRN, Vendors
| 10  | hr  | Staff, Payroll, Leave,  | ~22 |
| --- | --- | ----------------------- | --- |
Attendance, Reviews
| 11  | administration | Assets, Maintenance,  | ~15 |
| --- | -------------- | --------------------- | --- |
Visitors, Transport
| 12  | reports | Cross-domain  | ~15 |
| --- | ------- | ------------- | --- |
Reports, Analytics,
KPIs
| 13  | settings | Academic Years,  | ~10 |
| --- | -------- | ---------------- | --- |
Calendars, Configs,
Feature Flags
| 14  | platform | Subscriptions, Billing,  | ~12 |
| --- | -------- | ------------------------ | --- |
Feature Flags,
Integrations
5.4 Module Barrel Pattern
प्र(cid:9)त्याक(cid:17)  module च्या(cid:2) index.ts file ची(cid:2) role म्हा(cid:20)जे(cid:17) module च्या(cid:2) public API define कर(cid:20).(cid:17)  फक्तो index.ts
मधून(cid:29)  exported symbols ची दासो$ र(cid:2) module import करू शकतो(cid:15). या(cid:2)मळे$ (cid:17)  module encapsulation
enforce हा(cid:15)तो(cid:17) — internal files refactor कर(cid:20) (cid:17)safe हा(cid:15)तो(cid:17). ESLint rule या(cid:2) discipline ली(cid:2) enforce करतो(cid:15):
// modules/student/index.ts
export { StudentCard } from './components/student-card';
export { StudentList } from './components/student-list';
export { CreateStudentForm } from './forms/create-student-form';
export { useStudents, useStudent, useCreateStudent } from './hooks';
export { fetchStudents, createStudent } from './api';
export type { Student, StudentFilters, CreateStudentInput } from './types';

// Other modules import ONLY from this barrel:
//   import { StudentCard, useStudents } from '@/modules/student';
// NEVER from internal files:
//   import { StudentCard } from '@/modules/student/components/student-
card'; // FORBIDDEN
20

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
6. Layout System
Layout system हा (cid:17)UI ची(cid:2) structural foundation आहा(cid:17). PreOne मध्या (cid:17)8 distinct layouts आहा(cid:17)तो — प्र(cid:9)त्याक(cid:17)
layout ची(cid:7) specific responsibility आणि(cid:20) use case आहा(cid:17). Layouts NestJS च्या(cid:2) nested layout pattern
through compose हा(cid:15)तो(cid:2)तो — RootLayout wraps AuthLayout wraps LoginPage.
6.1 Layout Catalog
| Layout     | File              | Purpose            | Notes           |
| ---------- | ----------------- | ------------------ | --------------- |
| RootLayout | app/layout.tsx    | HTML shell, font   | Always wraps    |
|            |                   | loading, providers | everything      |
| AuthLayout | (auth)/layout.tsx | Login, Forgot      | No sidebar, no  |
|            |                   | Password, Reset —  | header          |
minimal chrome
DashboardLayout (dashboard)/ Sidebar + Header +  Most pages use this
|     | layout.tsx | Breadcrumb +  |     |
| --- | ---------- | ------------- | --- |
Content
PrintLayout (print)/layout.tsx Print-optimized —  Report cards,
|             |     | no nav, A4 size    | invoices      |
| ----------- | --- | ------------------ | ------------- |
| ModalLayout | —   | Dialog/Drawer      | Forced-focus  |
|             |     | rendered in portal | overlays      |
ErrorLayout error.tsx Full-page error UI  Catches route errors
with recovery actions
LoadingLayout loading.tsx Skeleton/spinner  Suspense fallback
during route
transitions
NotFoundLayout not-found.tsx 404 page with  Catches unmatched
|     |     | helpful navigation | routes |
| --- | --- | ------------------ | ------ |
6.2 Layout Slots
DashboardLayout हा(cid:2) सोवा8तो complex layout आहा(cid:17) — त्या(cid:2)तो खा(cid:2)ली(cid:7)ली slots आहा(cid:17)तो. हा(cid:17) slots compose
हा(cid:15)ऊन complete dashboard UI तोया(cid:2)र हा(cid:15)तो(cid:17). प्र(cid:9)त्याक(cid:17)  slot independent component आहा(cid:17) ज्या(cid:2)ली(cid:2)
individually test आणि(cid:20) replace करतो(cid:2) या(cid:17)तो(cid:17):
21

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Slot Purpose Used In
Header Top bar — logo, school DashboardLayout
switcher, branch switcher,
notifications, user menu
Sidebar Primary navigation — RBAC- DashboardLayout
driven menu tree,
collapsible, multi-level
Breadcrumb Current location trail — DashboardLayout
Home / Students / Profile
Content Main page content — varies All layouts
per route
Footer Minimal — version, DashboardLayout
copyright, support link
PageHeader Page title, description, Content (top)
primary actions
PageActions Contextual actions — Export, PageHeader (right)
Create, Filter
6.3 Layout Composition
Layouts chain तोया(cid:2)र करतो(cid:2)तो — प्र(cid:9)त्या(cid:17)क outer layout त्या(cid:2)च्या(cid:2) inner content ली(cid:2) wrap करतो(cid:15). हा(cid:7)
composition React Context through propagate हा(cid:15)तो(cid:17) — inner components outer layout ची(cid:2)
context access करू शकतो(cid:2)तो (e.g., sidebar collapse state):
<RootLayout> // app/layout.tsx
<html>
<body>
<Providers> // QueryProvider, ThemeProvider, AuthProvider
<NextIntlClientProvider>
{children} // (auth) or (dashboard) layout
</NextIntlClientProvider>
</Providers>
</body>
</html>
</RootLayout>
<DashboardLayout> // (dashboard)/layout.tsx
<Header /> // school/branch/year switchers, user menu
<Sidebar /> // RBAC-filtered menu
<Breadcrumb /> // auto-generated
<main>{children}</main> // actual page content
<Footer />
22

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
</DashboardLayout>
7. State Management
State management  हा(cid:17)  frontend architecture  ची(cid:2)  core  आहा(cid:17). PreOne  मध्या(cid:17)  state  ची(cid:17)  three
categories आहा(cid:17)तो — Server State (TanStack Query), Client/UI State (Zustand), आणि(cid:20) Form
State (React Hook Form). या(cid:2)ची5 (cid:17) clear separation critical आहा(cid:17) — गेल्लीतो क(cid:17) ल्या(cid:2)सो bugs आणि(cid:20)
| performance issues यातो(cid:17) | (cid:2)तो. |     |     |
| ------------------------------- | ---------- | --- | --- |
7.1 Global State (Zustand)
Zustand मध्या (cid:17)global UI state stores आहा(cid:17)तो — user, permissions, theme, sidebar, notifications,
current school/branch/year. हा(cid:17) state cross-component shared कर(cid:2)याली(cid:2) ली(cid:2)गेतो(cid:17), प्र(cid:20) server data
न(cid:2)हा(cid:7). Server data न(cid:17)हाम(cid:7) TanStack Query मध्या (cid:17)र(cid:2)हातो(cid:17) — Zustand मध्या (cid:17)कधू(cid:7)ची. हा(cid:17) rule strict आहा(cid:17):
| State | Type            | Description | Source       |
| ----- | --------------- | ----------- | ------------ |
| User  | AuthUser | null | Current     | AuthProvider |
authenticated user
— id, name, email,
avatar
| Permissions | string[] | Resolved permission  | Loaded on login +  |
| ----------- | -------- | -------------------- | ------------------ |
|             |          | codes — e.g.,        | cache              |
['STUDENT_READ',
'INVOICE_CREATE']
Theme 'light' | 'dark' | 'auto' Active theme  ThemeProvider +
|     |     | preference | persisted |
| --- | --- | ---------- | --------- |
Sidebar { collapsed: boolean,  Sidebar collapse  UI-only, no
|     | mobileOpen:  | state | persistence |
| --- | ------------ | ----- | ----------- |
boolean }
Notifications Notification[] In-app notification  Auto-dismiss after 5s
stack (max 5 visible)
Current School School | null Active school context  Switchable, persisted
(multi-school admin)
Current Branch Branch | null Active branch  Switchable, persisted
context within school
Current Academic  AcademicYear | null Active academic year  Switchable per
| Year |     | for filtering | school year |
| ---- | --- | ------------- | ----------- |
23

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
7.2 Server State (TanStack Query)
TanStack Query  सोवा/  server data handle  करतो(cid:15) —  students list, admissions pipeline,
attendance grid, finance ledger. प्र(cid:9)त्याक(cid:17)  query ची(cid:7) specific stale time, refetch strategy, आणि(cid:20)
invalidation rules आहा(cid:17)तो. Server state कधू(cid:7)ची Zustand मध्या(cid:17) mirror हा(cid:15)तो न(cid:2)हा(cid:7) — तो(cid:17) फक्तो TanStack
Query cache मध्या (cid:17)र(cid:2)हातो(cid:17):
| Domain | Module | Cache Strategy | Invalidation |
| ------ | ------ | -------------- | ------------ |
Students identity + student  Student list, detail,  5 min stale; refetch
|     | modules | search | on focus |
| --- | ------- | ------ | -------- |
Admissions admissions module Application pipeline,  30s polling on active
|     |     | status, documents | tab |
| --- | --- | ----------------- | --- |
Attendance attendance module Daily attendance  Live updates via
|     |     | grid, monthly  | Socket.IO |
| --- | --- | -------------- | --------- |
summary
| Finance | finance module | Invoices, payments,  | Invalidate on  |
| ------- | -------------- | -------------------- | -------------- |
|         |                | ledger entries       | mutation       |
Reports reports module Generated reports,  60s stale; manual
|     |     | KPIs, dashboards | refresh button |
| --- | --- | ---------------- | -------------- |
Inventory inventory module Stock levels, POs,  30s stale; refetch on
|               |                | low-stock alerts   | focus           |
| ------------- | -------------- | ------------------ | --------------- |
| HR            | hr module      | Staff list, leave  | Invalidate on   |
|               |                | calendar, payroll  | mutation        |
| Communication | communication  | Announcements,     | Socket.IO live  |
|               | module         | chat messages      | updates         |
7.3 State Management Rules
खा(cid:2)ली(cid:7)ली rules state management discipline सोणि$नणि'चीतो करतो(cid:2)तो. या(cid:2)तो(cid:7)ली बऱ्या(cid:2)ची rules ESLint न (cid:17)enforce
हा(cid:15)तो(cid:2)तो — ब(cid:2)क(cid:7) PR review मध्या (cid:17)check हा(cid:15)तो(cid:2)तो:
•  Server data → TanStack Query (NEVER in Zustand)
•  UI state (toggles, filters, modals) → Zustand (sliced, persisted selectively)
•  Form state → React Hook Form (uncontrolled refs, not React state)
•  URL state (page, sort, filter) → useSearchParams + Next.js router
•  Local component state → useState/useReducer (ephemeral, not shared)
•  Cross-component shared UI → Zustand slice (e.g., sidebar collapse)
24

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
• Server-derived state → useMemo (never re-fetched, derived from cache)
• Persistent preferences → Zustand persist middleware (theme, last school)
• Realtime updates → invalidate query on Socket.IO event
• Optimistic updates → TanStack Query onMutate + rollback onError
7.4 Zustand Store Example
Zustand store ची(cid:7) structure खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20) (cid:17)आहा(cid:17). एक(cid:2)ची store मध्या (cid:17)multiple slices combine हा(cid:15)तो(cid:2)तो —
या(cid:2)मळे$ (cid:17) single source of truth सोणि$नणि'चीतो हा(cid:15)तो(cid:17). Persist middleware user preferences (theme, last
school) ली(cid:2) localStorage मध्या (cid:17)save करतो(cid:15):
interface AppStore {
// State
user: AuthUser | null;
permissions: string[];
theme: 'light' | 'dark' | 'auto';
sidebar: { collapsed: boolean; mobileOpen: boolean };
currentSchool: School | null;
currentBranch: Branch | null;
currentAcademicYear: AcademicYear | null;
notifications: Notification[];
// Actions
setUser: (user: AuthUser | null) => void;
setPermissions: (perms: string[]) => void;
setTheme: (theme: 'light' | 'dark' | 'auto') => void;
toggleSidebar: () => void;
switchSchool: (school: School) => void;
switchBranch: (branch: Branch) => void;
addNotification: (notif: Notification) => void;
dismissNotification: (id: string) => void;
}
export const useAppStore = create<AppStore>()(
persist(
(set) => ({
// initial state + actions
}),
{ name: 'preone-app', partialize: (s) => ({ theme: s.theme, currentSchool:
s.currentSchool }) }
)
);
25

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
8. API Layer
API Layer हा(cid:2) frontend आणि(cid:20) backend च्या(cid:2) मध्या(cid:17) communication ची(cid:2) structured bridge आहा(cid:17). Page
कधू(cid:7)ची directly axios ली(cid:2) call करतो न(cid:2)हा(cid:7) — तो(cid:17) फक्तो hooks श(cid:7) interact करतो(cid:17). Hooks API services श(cid:7),
services axios client श(cid:7), axios client backend REST API श(cid:7). हा(cid:7) layered architecture testability +
maintainability सोणि$नणि'चीतो करतो(cid:17).
8.1 API Layer Flow
Request ची(cid:2) flow खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). प्र(cid:9)त्याक(cid:17) layer ची(cid:7) specific responsibility आहा(cid:17) — गेल्लीतो क(cid:17) ल्या(cid:2)सो
debugging कठी(cid:7)(cid:20) हा(cid:15)तो(cid:17):
Page Component (renders)
↓
useStudents() hook (TanStack Query wrapper)
↓
studentApi.list(filters) function call
↓
axiosClient.get('/v1/students', { params: filters })
↓ (request interceptor: attach JWT + traceId + tenantId)
Backend REST API (NestJS)
↓
Response (success or error)
↓ (response interceptor: normalize errors)
TanStack Query cache populated (or error thrown)
↓
Component re-renders with data (or shows error state)
8.2 API Service Catalog
services/ directory मध्या(cid:17) per-domain API client files आहा(cid:17)तो. प्र(cid:9)त्याक(cid:17) file त्या(cid:2) domain ची(cid:17) सोवा/
endpoints encapsulate करतो(cid:15). नवा(cid:7)न endpoint add करतो(cid:2)न(cid:2) corresponding service file मध्या (cid:17)entry
जे(cid:15)डा(cid:2)वा(cid:7) ली(cid:2)गे(cid:17)ली:
File Purpose Notes
api.ts Core axios instance — Single shared client
interceptors, base URL, error
normalizer
auth.ts Login, refresh, logout, me, Auth namespace
permission resolve
student.ts CRUD + search + bulk + Student module
export + import
26

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| File       | Purpose                        | Notes          |
| ---------- | ------------------------------ | -------------- |
| finance.ts | Invoices, payments, receipts,  | Finance module |
refunds, ledger, GST returns
| attendance.ts | Mark, edit, monthly  | Attendance module |
| ------------- | -------------------- | ----------------- |
summary, bulk mark
| communication.ts | Announcements, chat,  | Communication module |
| ---------------- | --------------------- | -------------------- |
broadcast, templates
| admissions.ts | Applications, counselling,  | Admissions module |
| ------------- | --------------------------- | ----------------- |
approval, documents
| academics.ts | Curriculum, observations,  | Academics module |
| ------------ | -------------------------- | ---------------- |
report cards, PTM
| inventory.ts | Items, stock, PR/PO/GRN,  | Inventory module |
| ------------ | ------------------------- | ---------------- |
vendors
| hr.ts | Staff, leave, payroll,  | HR module |
| ----- | ----------------------- | --------- |
attendance
| reports.ts | Report generation,  | Reports module |
| ---------- | ------------------- | -------------- |
download, schedule
| platform.ts | Subscriptions, billing, feature  | Platform module |
| ----------- | -------------------------------- | --------------- |
flags, integrations
8.3 Axios Interceptor Rules
Axios interceptors  हा(cid:17)  cross-cutting concerns handle  करतो(cid:2)तो —  auth, tracing, error
normalization. खा(cid:2)ली(cid:7)ली rules ADR-FA-008 मध्या (cid:17)documented आहा(cid:17)तो:
•  Request interceptor: attach Authorization header from auth store
•  Request interceptor: attach traceId header (UUID v7) for distributed tracing
•  Request interceptor: attach tenantId + branchId from context store
•  Response interceptor (2xx): pass through
•  Response interceptor (401): attempt silent refresh, retry original request
•  Response interceptor (403): redirect to /forbidden
•  Response interceptor (429): backoff retry with jitter (3 attempts max)
•  Response interceptor (5xx): throw standardized ApiError
•  Response interceptor (network): throw NetworkError with offline hint
•  All errors normalized to ApiError shape for component consumption
27

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
8.4 Service Example
API service file ची(cid:2) structure खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). प्र(cid:9)त्याक(cid:17) function typed input accept करतो(cid:15) आणि(cid:20)
typed output return करतो(cid:15) — types OpenAPI codegen प्र(cid:2)सोन(cid:29) या(cid:17)तो(cid:2)तो. या(cid:2)मळे$ (cid:17) frontend आणि(cid:20)
backend च्या(cid:2) वार type drift prevent हा(cid:15)तो(cid:17):
// services/student.ts
import { axiosClient } from '@/lib/axios-client';
import type { Student, CreateStudentInput, StudentFilters } from
'@/types/api-contracts';
export const studentApi = {
list: (filters: StudentFilters) =>
axiosClient.get<Page<Student>>('/v1/students', { params: filters }),
getById: (id: string) =>
axiosClient.get<Student>(`/v1/students/${id}`),
create: (input: CreateStudentInput) =>
axiosClient.post<Student>('/v1/students', input),
update: (id: string, input: Partial<CreateStudentInput>) =>
axiosClient.patch<Student>(`/v1/students/${id}`, input),
delete: (id: string) =>
axiosClient.delete<void>(`/v1/students/${id}`),
search: (query: string) =>
axiosClient.get<Page<Student>>('/v1/students/search', { params: { q:
query } }),
bulkCreate: (inputs: CreateStudentInput[]) =>
axiosClient.post<BatchResult<Student>>('/v1/students/bulk', { items:
inputs }),
export: (filters: StudentFilters, format: 'xlsx' | 'csv' | 'pdf') =>
axiosClient.post<{ jobId: string }>('/v1/students/export', { filters, format }),
};
9. Authentication
Authentication हा (cid:17)security ची(cid:2) foundation आहा(cid:17). PreOne JWT-based authentication use करतो(cid:15) —
short-lived access tokens + long-lived refresh tokens. Access tokens memory मध्या(cid:17) र(cid:2)हातो(cid:2)तो
(XSS-resistant), refresh tokens HttpOnly cookies मध्या (cid:17)(CSRF-resistant). Silent refresh user ली(cid:2)
invisible र(cid:2)हातो(cid:15) — session continuous असोतो(cid:15).
28

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
9.1 Authentication Flow
Login ची(cid:2) complete flow खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). प्र(cid:9)त्याक(cid:17) step specific responsibility handle करतो(cid:17) —
error क(cid:15)(cid:20)त्या(cid:2)हा(cid:7) step प्रर याऊ(cid:17) शकतो(cid:15) आणि(cid:20) user-friendly message श(cid:7) translate हा(cid:15)तो(cid:15):
User enters email + password on /login
↓
POST /v1/auth/login
↓
Server returns: {
accessToken (15min, RS256 signed),
refreshToken (30d, HttpOnly cookie, rotated),
user: { id, name, email, avatar }
}
↓
Store accessToken in memory (Zustand) — NOT localStorage
↓
Resolve permissions: GET /v1/auth/permissions
↓
Cache permissions in Zustand + sessionStorage
↓
Generate menu tree based on permissions
↓
Redirect to /dashboard
9.2 Authentication Features
PreOne च्या(cid:2) authentication system मध्या (cid:17)खा(cid:2)ली(cid:7)ली features आहा(cid:17)तो. हा (cid:17)features enterprise-grade UX
आणि(cid:20) security दा(cid:15)न्हा(cid:7) सोणि$नणि'चीतो करतो(cid:2)तो:
Feature Mechanism Benefit
Silent Refresh Axios interceptor catches User never sees login mid-
401, calls /auth/refresh, session
retries original request
Auto Logout On 401 after refresh attempt Security: prevent stale token
fails — clear state, redirect to use
/login
Session Recovery On page reload — validate Seamless UX across reloads
accessToken, re-resolve
permissions if expired
Multi-school Context Switch School switcher in header; Admin users with multiple
switches tenant context + schools
clears server cache
29

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Feature | Mechanism |     | Benefit |
| ------- | --------- | --- | ------- |
Branch Switch Branch switcher in header;  Multi-branch schools
updates context.branchId;
invalidates affected queries
Academic Year Switch Year switcher in header;  Filter scope for academic
|     | updates  |     | data |
| --- | -------- | --- | ---- |
context.academicYearId
Idle Timeout 30 min idle → soft warning at  DPDP Act compliance
25 min → logout at 30 min
Concurrent Session Limit Max 3 concurrent sessions  Prevent session sharing
per user; oldest auto-
revoked
9.3 Token Storage Strategy
Token storage हा(cid:17) security ची(cid:2) critical aspect आहा(cid:17). खा(cid:2)ली(cid:7)ली table दा(cid:2)खावातो(cid:17) क(cid:15)(cid:20)तो(cid:2) token क(cid:15)ठी(cid:17) store
हा(cid:15)तो(cid:15) आणि(cid:20) क(cid:2). या(cid:2) strategy मळे$ (cid:17) XSS आणि(cid:20) CSRF दा(cid:15)न्हा(cid:7) attacks प्र(cid:2)सोन(cid:29)  protection णिमळेतो(cid:17):
| Token        | Storage          | Why                     | Lifetime |
| ------------ | ---------------- | ----------------------- | -------- |
| Access Token | Memory (Zustand  | XSS-resistant (no       | 15 min   |
|              | store)           | localStorage); lost on  |          |
refresh but silent
refresh recovers
Refresh Token HttpOnly Cookie JS cannot read (XSS- 30 days, rotated
resistant);
SameSite=Strict
(CSRF-resistant)
| Permissions | Zustand +      | Fast access on page  | Session |
| ----------- | -------------- | -------------------- | ------- |
|             | sessionStorage | reload; cleared on   |         |
logout
| User Profile | Zustand +      | Fast access; cleared  | Session |
| ------------ | -------------- | --------------------- | ------- |
|              | sessionStorage | on logout             |         |
Theme Preference localStorage (via  Survives logout —  Persistent
|     | Zustand persist) | applies to login page  |     |
| --- | ---------------- | ---------------------- | --- |
too
30

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
9.4 Multi-School Context Switch
Platform admin users एक(cid:2)ची प्र(cid:17)क्षा(cid:2) जे(cid:2)स्तो schools manage करतो(cid:2)तो. School switcher header मध्या (cid:17)
आहा(cid:17) — switch करतो(cid:2)न(cid:2) current school, branch, academic year context update हा(cid:15)तो(cid:15) आणि(cid:20) सोवा/
server cache invalidate हा(cid:15)तो(cid:15). हा(cid:17) behavior ADR-FA-009 मध्या(cid:17) documented आहा(cid:17). Switch क(cid:17) ल्या(cid:2)वार
प्रणिहाली(cid:2) page dashboard असोतो(cid:15) — mixed-context data confusion prevent करण्या(cid:2)सो(cid:2)ठी(cid:7):
User clicks school switcher in header
↓
Dropdown shows list of schools user has access to
↓ (user selects)
Update Zustand: currentSchool, currentBranch=null,
currentAcademicYear=null
↓
Clear TanStack Query cache (queryClient.clear())
↓
Re-fetch permissions for new school (if differs)
↓
Re-build sidebar menu based on new permissions
↓
Redirect to /dashboard (clean slate)
10. RBAC
Role-Based Access Control (RBAC) हा(cid:17) PreOne च्या(cid:2) security ची(cid:2) core mechanism आहा(cid:17). Frontend
मध्या(cid:17) RBAC ची(cid:17) 7 layers आहा(cid:17)तो — defense in depth. प्र(cid:9)त्याक(cid:17) layer different granularity प्रर enforce
हा(cid:15)तो(cid:15) — route (coarsest) प्र(cid:2)सोन(cid:29) field (finest) प्रया/तो5 . Screen, menu, button, आणि(cid:20) field-level
authorization API Contract आणि(cid:20) ADR मध्या (cid:17)define क(cid:17) लील्(cid:17) या(cid:2) permission model श(cid:7) aligned र(cid:2)हा(cid:7)ली.
10.1 RBAC Layers
खा(cid:2)ली(cid:7)ली table सोवा/ 7 layers ची(cid:7) catalog करतो(cid:17). प्र(cid:9)त्याक(cid:17) layer ची(cid:7) specific responsibility आहा (cid:17)— एक layer
fail झा(cid:2)ली(cid:2) तोर(cid:7) दासो$ र(cid:2) defense दातो(cid:17) (cid:15):
Layer Mechanism Purpose When
Route Guard middleware.ts + Block access to Before page render
(dashboard)/layout.t unauthorized routes
sx — redirect to
/forbidden
Menu Guard Sidebar menu Hide menu items On login +
builder user has no permission change
permission for
31

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Layer | Mechanism | Purpose | When |
| ----- | --------- | ------- | ---- |
Screen Guard Page-level <Can>  Show 403 fallback if  Per page
|                 | wrapper or         | user lacks screen     |               |
| --------------- | ------------------ | --------------------- | ------------- |
|                 | usePermission hook | access                |               |
| Component Guard | <Can               | Conditionally render  | Per component |
|                 | permission="STUDEN | component             |               |
T_EDIT"> wrapper
| Button Guard | <Can  | Hide/disable button | Per button |
| ------------ | ----- | ------------------- | ---------- |
permission="INVOIC
E_DELETE"> wrapper
| Field Guard | <Can               | Mask or hide     | Per field |
| ----------- | ------------------ | ---------------- | --------- |
|             | permission="STUDEN | sensitive fields |           |
T_VIEW_AADHAAR">
wrapper
| API Guard | Backend enforces      | Returns 403 if  | Per request |
| --------- | --------------------- | --------------- | ----------- |
|           | (defense in depth) —  | unauthorized    |             |
frontend never trusts
10.2 RBAC Examples
खा(cid:2)ली(cid:7)ली examples दा(cid:2)खावातो(cid:2)तो कसो(cid:17) <Can> component वा(cid:17)गेवा(cid:17)गेळ्या(cid:2) scenarios मध्या(cid:17) use हा(cid:15)तो(cid:17). प्र(cid:9)त्याक(cid:17)
example ची(cid:7) specific use case आहा(cid:17) — copy-paste ready:
| Code                      | Component      |     | Purpose                        |
| ------------------------- | -------------- | --- | ------------------------------ |
| <Can                      | <EditButton /> |     | Show edit button only if user  |
| permission="STUDENT_EDIT" |                |     | can edit students              |
>
| <Can                     | <ExportButton /> |     | Show export button only if   |
| ------------------------ | ---------------- | --- | ---------------------------- |
| permission="FINANCE_EXPO |                  |     | user can export finance data |
RT">
| <Can                     | <AadhaarField /> |     | Mask Aadhaar for users      |
| ------------------------ | ---------------- | --- | --------------------------- |
| permission="STUDENT_VIEW |                  |     | without explicit permission |
_AADHAAR"
fallback={<MaskedField />}>
| <Can role="ADMIN"         | <DeleteButton /> |     | Show delete button for  |
| ------------------------- | ---------------- | --- | ----------------------- |
| anyOf={["FINANCE_ADMIN",  |                  |     | admin roles             |
"PLATFORM_ADMIN"]}>
32

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Code Component Purpose
usePermission('STUDENT_CR const canCreate = Hook for programmatic
EATE') usePermission('STUDENT_CR checks
EATE')
menuBuilder(permissions) Generate sidebar menu tree Filter menu items at runtime
from permission list
10.3 RBAC Rules
• Every screen must declare required permission in route metadata
• Every data-modifying button must be wrapped in <Can>
• Every sensitive field (Aadhaar, PAN, salary) must be field-guarded
• Menu items dynamically filtered — never hardcode visibility
• API responses may include permissions for context-aware UI
• Permission changes (role update) trigger menu re-build + cache invalidation
• Frontend RBAC is UX optimization — backend is source of truth
• Permission codes match backend ADR exactly (e.g., STUDENT_EDIT, not
student.edit)
• Route guard uses middleware (edge runtime) for instant redirect — no flash of
content
• All <Can> components memoized to prevent re-render storms
10.4 <Can> Component Implementation
<Can> component ची(cid:2) implementation खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). हा(cid:2) component memoized आहा(cid:17) —
permissions change झा(cid:2)ल्या(cid:2)णिशवा(cid:2)या re-render हा(cid:15)तो न(cid:2)हा(cid:7). Fallback prop allow करतो(cid:17) क(cid:7) user ली(cid:2)
permission नसोली(cid:17) तोर क(cid:2)या दा(cid:2)खावा(cid:2)याची (cid:17)(default: null):
interface CanProps {
permission?: string | string[];
role?: string | string[];
anyOf?: string[]; // OR logic
allOf?: string[]; // AND logic
fallback?: React.ReactNode;
children: React.ReactNode;
}
export const Can = memo(function Can({
permission,
33

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
role,
anyOf,
allOf,
fallback = null,
children,
}: CanProps) {
const permissions = useAppStore((s) => s.permissions);
const userRole = useAppStore((s) => s.user?.role);
const allowed = useMemo(() => {
if (permission) {
return Array.isArray(permission)
? permission.some((p) => permissions.includes(p))
: permissions.includes(permission);
}
if (role) {
return Array.isArray(role) ? role.includes(userRole) : role === userRole;
}
if (anyOf) return anyOf.some((p) => permissions.includes(p));
if (allOf) return allOf.every((p) => permissions.includes(p));
return false;
}, [permission, role, anyOf, allOf, permissions, userRole]);
return <>{allowed ? children : fallback}</>;
});
11. Navigation
Navigation हा(cid:17) user experience ची(cid:2) critical part आहा(cid:17). PreOne मध्या(cid:17) multiple navigation
mechanisms आहा(cid:17)तो — primary sidebar, top header, breadcrumbs, command palette. प्र(cid:9)त्याक(cid:17)
mechanism ची(cid:7) specific use case आहा (cid:17)आणि(cid:20) तो (cid:17)all together cohesive navigation experience तोया(cid:2)र
करतो(cid:2)तो.
11.1 Navigation Types
Type Description Use Case
Primary Sidebar Multi-level collapsible menu, All dashboard pages
RBAC-filtered
Top Header School/Branch/Year Dashboard layout
switchers, notifications, user
menu
Breadcrumbs Auto-generated from route + Below header
page metadata
34

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Type Description Use Case
In-page Tabs Tab navigation within a page Detail pages
(e.g., Student → Profile |
Attendance | Fees)
Pagination Cursor or page-based Data tables
navigation for lists
Command Palette Cmd+K fuzzy search across Power users
pages/actions
Quick Actions Floating action button for Mobile-friendly
primary action on list pages
Mobile Bottom Nav Bottom tab bar on mobile Responsive
breakpoints
11.2 Navigation Rules
• Sidebar collapses to icons-only on medium screens; hamburger on mobile
• Active route highlighted in sidebar + breadcrumb
• Breadcrumbs reflect actual navigation path, not URL structure
• External links open in new tab with rel="noopener noreferrer"
• Back button preserved via browser history; never broken by client-side routing
• Route transitions show loading.tsx skeleton immediately (no white flash)
• Navigation to unauthorized route shows 403 page (not silent redirect)
• Cmd+K command palette includes: pages, recent items, quick actions
11.3 Command Palette (Cmd+K)
Command palette power users सो(cid:2)ठी(cid:7) आहा(cid:17) — Cmd+K दा(cid:2)बल्या(cid:2)वार fuzzy search box उघडातो(cid:15). User
त्या(cid:2)तो pages, recent items, quick actions search करू शकतो(cid:15). हा(cid:17) feature velocity boost करतो(cid:17) —
mouse णिशवा(cid:2)या सोवा/ navigation possible हा(cid:15)तो(cid:17). Implementation cmdk library वार based आहा(cid:17):
Cmd+K pressed
↓
Modal opens with search input
↓ (user types)
Fuzzy search across:
- All pages (filtered by permissions)
- Recent students (last 10 viewed)
- Recent invoices (last 10 created)
- Quick actions (Create Student, Generate Invoice)
35

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
- Settings pages
↓ (user selects)
Navigate to selected item OR execute action
↓
Modal closes
// Keyboard shortcuts:
// Cmd+K Open palette
// Esc Close
// ↑↓ Navigate results
// Enter Select
// Cmd+Enter Open in new tab
12. Forms
Forms हा (cid:17)enterprise applications ची(cid:2) core interaction mechanism आहा(cid:17). PreOne मध्या (cid:17)React Hook
Form + Zod combination use हा(cid:15)तो(cid:15) — performance (uncontrolled refs) + type safety (schema-
driven) दा(cid:15)न्हा(cid:7). प्र(cid:9)त्याक(cid:17) form ची(cid:7) Zod schema आहा(cid:17) जे(cid:7) client + server validation ची(cid:2) single source of
truth आहा(cid:17).
12.1 Form Patterns
Pattern Implementation Use Case
Controlled Components <Input {...register('name')} /> Default for simple inputs
Uncontrolled Components useController for complex Performance optimization
widgets (DatePicker,
FileUpload)
Field Arrays useFieldArray for repeating Dynamic add/remove rows
groups (guardians, education
history)
Conditional Fields watch() + conditional render Show/hide based on other
fields
Async Validation Trigger on blur; debounce Username/email uniqueness
500ms; show spinner
Multi-step Forms useForm across steps; Wizard patterns (admission)
validate per step; persist to
Zustand
Form Context FormProvider for deeply Avoid prop drilling
nested fields
36

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Pattern Implementation Use Case
Schema-driven Forms React Hook Form + Zod Consistent validation
resolver — UI generated
from schema
12.2 Form Submission Flow
Form submission ची(cid:2) complete flow खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20) (cid:17)आहा(cid:17). प्र(cid:9)त्याक(cid:17) step specific responsibility handle
करतो(cid:17) — error क(cid:15)(cid:20)त्या(cid:2)हा(cid:7) step प्रर याऊ(cid:17) शकतो(cid:15) आणि(cid:20) appropriate UI feedback श(cid:7) translate हा(cid:15)तो(cid:15):
User fills form (controlled by React Hook Form)
↓ on submit
Zod resolver validates (client-side)
↓ valid
Submit handler calls API service
↓
API validates server-side (defense in depth)
↓ success
Invalidate relevant TanStack Query (refetch list)
↓
Show success toast
↓
Navigate to detail page OR reset form
-- OR -- on error
Show error toast with field-level details (if validation)
↓
setFormError() for programmatic field errors
12.3 Form Rules
• Every form has a Zod schema — single source of truth
• Submit button disabled during mutation (useFormStatus)
• Optimistic UI for non-critical mutations (mark attendance)
• Pessimistic UI for critical mutations (payment, delete)
• Confirm dialog before destructive actions
• Unsaved changes warning via beforeunload + route block
• Autosave for long forms (debounced 2s, save to draft endpoint)
• Reset form after successful create (not update)
• Server validation errors mapped to fields via setError()
• Display field-level error below input; show error count in submit button
37

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
12.4 Example — CreateStudentForm
खा(cid:2)ली(cid:7)ली example complete form implementation दा(cid:2)खावातो(cid:17) — Zod schema, React Hook Form
integration, mutation hook, error handling. हा(cid:17) pattern सोवा/ forms सो(cid:2)ठी(cid:7) template आहा(cid:17):
// modules/student/forms/create-student-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateStudent } from '../hooks';
import { CreateStudentSchema } from '../validation';
import type { CreateStudentInput } from '../types';
export function CreateStudentForm({ onSuccess }: { onSuccess: () => void })
{
const {
register,
handleSubmit,
formState: { errors, isSubmitting },
setError,
} = useForm<CreateStudentInput>({
resolver: zodResolver(CreateStudentSchema),
});
const createStudent = useCreateStudent();
const onSubmit = async (data: CreateStudentInput) => {
try {
await createStudent.mutateAsync(data);
toast.success('Student created successfully');
onSuccess();
} catch (error) {
if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
error.details.forEach(({ field, message }) => {
setError(field, { message });
});
} else {
toast.error('Failed to create student');
}
}
};
return (
<form onSubmit={handleSubmit(onSubmit)}>
<Input
label="First Name"
error={errors.firstName?.message}
{...register('firstName')}
38

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
      />
      {/* ... more fields */}
      <Button type="submit" loading={isSubmitting}>
        Create Student
      </Button>
    </form>
  );
}
13. Validation
Validation हा(cid:17) defense-in-depth strategy आहा(cid:17) — same as backend. PreOne मध्या(cid:17) 4 validation
layers आहा(cid:17)तो — client, business, API, server. प्र(cid:9)त्याक(cid:17)  layer वा(cid:17)गेवा(cid:17)गेळ्या(cid:2) type ची(cid:7) invalid input catch
| करतो(cid:17). या(cid:2)मळे$ (cid:17) invalid data कधू(cid:7)ची database प्रया/तो5 |     |  प्र(cid:15)हा(cid:15)चीतो न(cid:2)हा(cid:7). |     |
| --------------------------------------------------------------------------------- | --- | --------------------------------------------- | --- |
13.1 Validation Levels
| Level | Where | Purpose | Examples |
| ----- | ----- | ------- | -------- |
Client Validation Browser native + Zod  Instant feedback;  Required, max
|     | schema in form | UX-friendly | length, email format |
| --- | -------------- | ----------- | -------------------- |
Business Validation Cross-field rules in  Catch logic errors  EndDate > StartDate,
|     | Zod refinements | before API call | FeeMin < FeeMax |
| --- | --------------- | --------------- | --------------- |
API Validation Backend DTO  Defense in depth;  Duplicate email,
|     | validation (class- | never trust client | invalid references |
| --- | ------------------ | ------------------ | ------------------ |
validator + Zod)
Server Validation Domain aggregate  Last line of defense Unique roll number,
|     | invariants + DB  |     | section capacity |
| --- | ---------------- | --- | ---------------- |
constraints
13.2 Validation Examples
खा(cid:2)ली(cid:7)ली table common field validation rules दा(cid:2)खावातो(cid:17). हा (cid:17)rules Zod schema मध्या (cid:17)implement हा(cid:15)तो(cid:2)तो
आणि(cid:20) frontend + backend दा(cid:15)न्हा(cid:7) णिठीक(cid:2)(cid:20)(cid:7) enforce हा(cid:15)तो(cid:2)तो:
| Field | Rules |     | Implementation |
| ----- | ----- | --- | -------------- |
Student Name Required, Max 100, Trim, No  @Matches(/^[\p{L}\s.'-]+$/u)
Emoji
| Email | Required, RFC 5322, Max  |     | @IsEmail() |
| ----- | ------------------------ | --- | ---------- |
254, Lowercase
39

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Field Rules Implementation
Phone (India) Required, 10 digits, starts 6-9 @Matches(/^[6-9]\d{9}$/)
Date of Birth Required, ISO-8601, age 2-6 @IsDateString() + custom
for preschool
Aadhaar Optional, 12 digits, Verhoeff Custom validator
checksum valid
PAN Optional, 10 chars, @Matches(/[A-Z]{5}[0-9]{4}
ABCDE1234F format [A-Z]{1}/)
Fee Amount Required, positive integer @Min(1) @Max(10000000)
(paise), max 10L
Date Range EndDate >= StartDate, max Zod .refine()
365 days span
13.3 Zod Schema Example
Zod schema हा(cid:17) single source of truth आहा(cid:17) — या(cid:2)ची schema प्र(cid:2)सोन(cid:29) TypeScript types infer हा(cid:15)तो(cid:2)तो,
frontend form validation हा(cid:15)तो(cid:17), आणि(cid:20) backend DTO validation हा(cid:15)तो(cid:17). या(cid:2)मळे$ (cid:17) type drift prevent हा(cid:15)तो(cid:17):
// modules/student/validation/create-student-schema.ts
import { z } from 'zod';
export const CreateStudentSchema = z.object({
firstName: z.string().min(1).max(100).trim().regex(/^[\p{L}\s.'-]+$/u, 'Invalid
name'),
lastName: z.string().min(1).max(100).trim().regex(/^[\p{L}\s.'-]+$/u, 'Invalid
name'),
dateOfBirth: z.string().datetime().refine((dob) => {
const age = computeAge(dob);
return age >= 2 && age <= 6; // preschool age range
}, 'Age must be between 2 and 6 years for preschool'),
gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
address: AddressSchema,
guardians: z.array(GuardianSchema).min(1, 'At least one guardian required'),
aadhaar: z.string().optional().refine(validateAadhaarVerhoeff, 'Invalid
Aadhaar'),
});
// Type inferred from schema — used in form + API service
export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;
40

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
14. Theme Engine
Theme Engine हा(cid:17) PreOne च्या(cid:2) white-label strategy ची(cid:2) foundation आहा(cid:17). PreOne सो(cid:2)रख्या(cid:2) multi-
tenant SaaS मध्या (cid:17)प्र(cid:9)त्याक(cid:17) school ची(cid:2) own brand identity आहा (cid:17)— logo, colors, fonts. Theme Engine
या(cid:2)लीa runtime प्रर support करतो(cid:15) — क(cid:15)(cid:20)तो(cid:17)हा(cid:7) redeploy न करतो(cid:2) school switch क(cid:17) ल्या(cid:2)वार theme
change हा(cid:15)तो(cid:17). हा(cid:17) UI Design Philosophy मधू(cid:7)ली Theme Engine श(cid:7) प्र(cid:20)(cid:29) /प्र(cid:20) (cid:17)aligned असोली(cid:17) .
14.1 Theme Hierarchy
Theme resolution ची(cid:2) order खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20) (cid:17)आहा(cid:17) — Platform → Subscription → School → Branch
→ User. Outer themes baseline provide करतो(cid:2)तो, inner themes override करतो(cid:2)तो. User
preference (light/dark) सोवा8तो inner layer आहा(cid:17) — तो(cid:17) सोवा8तो जे(cid:2)स्तो priority ली(cid:2):
Platform Theme (PreOne default)
↓ overridden by
Subscription Plan Theme (Starter/Pro/Enterprise accent)
↓ overridden by
School Theme (custom primary color + logo + font)
↓ overridden by
Branch Theme (branch-level accent — rare)
↓ overridden by
User Preference (light/dark/auto)
↓
Final Computed Theme applied to UI
14.2 Theme Hierarchy Layers
Layer Scope Override Rule
Platform Theme PreOne default brand theme Baseline — applied when no
override
Subscription Plan Theme Tier-based (Starter, Pro, Subtle accent shifts
Enterprise) accent variations
School Theme Per-tenant custom primary Loaded on login, persisted
color + logo
Branch Theme Branch-level accent Multi-branch schools
(optional, rare)
User Preference Light / Dark / Auto mode Per-user, persisted
toggle
41

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
14.3 Theme Tokens
Theme tokens हा(cid:17) CSS custom properties (variables) आहा(cid:17)तो जे(cid:17) runtime प्रर swap हा(cid:15)ऊ शकतो(cid:2)तो.
oklch() color space use हा(cid:15)तो(cid:15) — wide gamut + perceptual uniformity. खा(cid:2)ली(cid:7)ली table सोवा/ tokens
ची(cid:7) catalog करतो(cid:17):
| Token | Purpose | Example Value |
| ----- | ------- | ------------- |
Primary Brand primary color (buttons,  oklch(0.55 0.18 240) — varies
|           | links, active states)    | per school           |
| --------- | ------------------------ | -------------------- |
| Secondary | Supporting brand color   | oklch(0.70 0.10 200) |
| Success   | Success feedback (paid,  | oklch(0.65 0.18 145) |
approved, completed)
| Warning | Caution (pending, due soon,  | oklch(0.75 0.15 85) |
| ------- | ---------------------------- | ------------------- |
low stock)
| Danger | Errors, destructive actions  | oklch(0.60 0.20 25) |
| ------ | ---------------------------- | ------------------- |
(delete, reject)
| Info | Informational badges,  | oklch(0.65 0.12 230) |
| ---- | ---------------------- | -------------------- |
tooltips
| Background | App background | Light: oklch(0.98 0.005 240);  |
| ---------- | -------------- | ------------------------------ |
Dark: oklch(0.18 0.01 240)
| Surface | Card / panel background | Light: oklch(1 0 0); Dark:  |
| ------- | ----------------------- | --------------------------- |
oklch(0.22 0.01 240)
| Text | Primary body text | Light: oklch(0.20 0.02 240);  |
| ---- | ----------------- | ----------------------------- |
Dark: oklch(0.95 0.005 240)
Border Subtle dividers, input borders Light: oklch(0.90 0.01 240);
Dark: oklch(0.30 0.01 240)
14.4 Theme Modes
PreOne मध्या(cid:17) 5 theme modes आहा(cid:17)तो. Light/Dark/Auto हा(cid:17) standard modes आहा(cid:17)तो, High Contrast
accessibility सो(cid:2)ठी(cid:7), White Label enterprise clients सो(cid:2)ठी(cid:7):
| Mode       | Description       | Use Case              |
| ---------- | ----------------- | --------------------- |
| Light Mode | Default — bright  | Brightness preference |
background, dark text
42

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Mode Description Use Case
Dark Mode Inverted — dark background, Low-light comfort
light text
Auto Mode Follows system preference Best UX default
via prefers-color-scheme
High Contrast Accessibility mode — WCAG AAA compliance
maximum contrast, larger
text
White Label Full rebrand — different Resale / franchise
logo, colors, font for
enterprise clients
14.5 Theme Application
Theme application ची(cid:2) mechanism खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). CSS variables runtime प्रर swap हा(cid:15)तो(cid:2)तो —
React re-render complete app ली(cid:2) हा(cid:15)तो न(cid:2)हा(cid:7). हा (cid:17)performance optimal आहा(cid:17). Theme provider फक्तो
<html> element च्या(cid:2) data-theme attribute ली(cid:2) update करतो(cid:15) आणि(cid:20) CSS variables automatically
cascade हा(cid:15)तो(cid:2)तो:
// User logs in
↓
Fetch school theme: GET /v1/theme
↓
Merge with platform defaults (deep merge)
↓
Compute final theme (apply user preference)
↓
Set CSS variables on :root via <style> tag
↓
All components re-render with new colors (CSS cascade)
// CSS:
:root {
--color-primary: oklch(0.55 0.18 240);
--color-background: oklch(0.98 0.005 240);
/* ... */
}
[data-theme='dark'] {
--color-background: oklch(0.18 0.01 240);
--color-text: oklch(0.95 0.005 240);
/* ... */
}
43

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
15. Component Library
Component Library  हा(cid:17)  PreOne  च्या(cid:2)  UI  ची(cid:2)  foundation  आहा(cid:17). PreOne  मध्या(cid:17) दा(cid:15)न  component
categories आहा(cid:17)तो — Base Components (generic, reusable across modules) आणि(cid:20) Composite
Components (domain-specific, used in specific modules). Base components ShadCN UI वार
based आहा(cid:17)तो — copy-into-repo model, fully owned, no version drift.
15.1 Base Components
Base components हा(cid:17) generic UI primitives आहा(cid:17)तो — Button, Input, Card, etc. हा(cid:17) components
क(cid:15)(cid:20)त्या(cid:2)हा(cid:7) module मध्या (cid:17)use हा(cid:15)ऊ शकतो(cid:2)तो. ShadCN UI प्र(cid:2)सोन(cid:29)  copied, fully themable, accessible by
default. खा(cid:2)ली(cid:7)ली table सोवा/ base components ची(cid:7) catalog करतो(cid:17):
| Component | Variants / Features         | Use Case    |
| --------- | --------------------------- | ----------- |
| Button    | Primary, Secondary, Ghost,  | All actions |
Danger, Link variants; sizes
sm/md/lg; loading state
| Input | Text, password, number,  | Form inputs |
| ----- | ------------------------ | ----------- |
email, search; with
prefix/suffix icons; error state
| Select | Single/multi/async;  | Dropdowns |
| ------ | -------------------- | --------- |
searchable; grouping; with
avatars
| Textarea | Auto-resize; character count;  | Long text |
| -------- | ------------------------------ | --------- |
max length
| Checkbox | Indeterminate state;  | Multi-select |
| -------- | --------------------- | ------------ |
controlled; group with
CheckAll
| Radio | Group with cards;  | Single-select |
| ----- | ------------------ | ------------- |
horizontal/vertical layout
| Switch | Toggle state; loading;  | Binary toggle |
| ------ | ----------------------- | ------------- |
disabled; with label
| DatePicker | Single/range; time; locale- | Date selection |
| ---------- | --------------------------- | -------------- |
aware; shortcuts (today, this
week)
44

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Component  | Variants / Features     | Use Case        |
| ---------- | ----------------------- | --------------- |
| FileUpload | Drag-drop; multi-file;  | Document upload |
progress; preview; type
validation
| Card | Header/body/footer slots;  | Content containers |
| ---- | -------------------------- | ------------------ |
hoverable; selectable
| Table | Built on TanStack Table;  | Data display |
| ----- | ------------------------- | ------------ |
server pagination; sort; filter
| Dialog | Modal with backdrop; sizes  | Modal interactions |
| ------ | --------------------------- | ------------------ |
sm/md/lg/xl; close on ESC
| Drawer | Side panel; left/right; sizes;  | Detail panels |
| ------ | ------------------------------- | ------------- |
nested
| Tabs | Underline/pills/cards  | Section navigation |
| ---- | ---------------------- | ------------------ |
variants;
controlled/uncontrolled
| Toast | Stack; auto-dismiss; manual  | Notifications |
| ----- | ---------------------------- | ------------- |
close; types
success/error/warn/info
| Badge | Count, dot, label variants;  | Status indicators |
| ----- | ---------------------------- | ----------------- |
colors per status
| Avatar | Image/initials fallback; sizes;  | User representation |
| ------ | -------------------------------- | ------------------- |
group overlap
| Breadcrumb | Auto-generated from route;  | Navigation trail |
| ---------- | --------------------------- | ---------------- |
custom items; with icons
15.2 Composite Components
Composite components हा(cid:17) domain-specific complex components आहा(cid:17)तो — StudentCard,
AttendanceGrid, FeeSummaryCard, etc. हा(cid:17) components specific business context represent
करतो(cid:2)तो आणि(cid:20) multiple base components compose करतो(cid:2)तो. खा(cid:2)ली(cid:7)ली table PreOne ची(cid:17) composite
components दा(cid:2)खावातो(cid:17):
| Component | Composition | Used In |
| --------- | ----------- | ------- |
StudentCard Student photo, name, class,  List view + dashboard
section, attendance %, fee
status
45

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Component Composition Used In
AttendanceGrid Monthly grid with color- Attendance module
coded status, click-to-edit,
legend
FeeSummaryCard Total/paid/outstanding Finance dashboard
amounts, last payment, next
due
ObservationTimeline Vertical timeline of teacher Academics module
observations with milestones
DashboardKpiTile KPI label, value, delta vs last All dashboards
period, sparkline
AdmissionPipeline Funnel visualization: Leads → Admissions dashboard
Applied → Counselling →
Approved → Enrolled
InvoicePreview Print-ready invoice layout Finance module
with itemized breakdown
ReportCardPreview Term report card with Academics module
grades, teacher remarks,
signature
StaffLeaveCalendar Calendar view of staff leaves HR module
with color coding per type
InventoryStatusBoard Low-stock alerts, reorder Inventory dashboard
suggestions, recent
movements
15.3 Component Rules
• Base components live in components/ui/ — copied from ShadCN, fully owned
• Composite components live in modules/{module}/components/ — domain-specific
• Components NEVER call API services directly — only via hooks
• Components NEVER access global state directly — props or hooks
• Components must accept className for Tailwind composition
• Components must forward refs via React.forwardRef
• Components must be accessible (ARIA, keyboard, focus management)
• Every component has a Storybook story with variants
46

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
• Breaking changes to base components require version bump + migration guide
• Composite components document their data dependencies in JSDoc
15.4 Storybook Integration
प्र(cid:9)त्याक(cid:17) component ची(cid:7) Storybook story आहा(cid:17) — variants, states, edge cases document क(cid:17) लीली(cid:17) .(cid:17)
Storybook हा(cid:17) living documentation आहा(cid:17) — designer + developer + QA सोवा/ एकची reference
बघतो(cid:2)तो. Story file component च्या(cid:2) श(cid:17)जे(cid:2)र(cid:7) co-located आहा(cid:17) (student-card.stories.tsx). Chromatic
integration visual regression catch करतो(cid:15):
// components/ui/button/button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
const meta = {
title: 'UI/Button',
component: Button,
parameters: { layout: 'centered' },
tags: ['autodocs'],
argTypes: {
variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger',
'link'] },
size: { control: 'select', options: ['sm', 'md', 'lg'] },
},
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {
args: { variant: 'primary', size: 'md', children: 'Click me' },
};
export const Loading: Story = {
args: { variant: 'primary', loading: true, children: 'Submit' },
};
export const Disabled: Story = {
args: { variant: 'primary', disabled: true, children: 'Submit' },
};
16. Data Tables
Data Tables हा(cid:17) enterprise applications ची(cid:2) core UI element आहा(cid:17) — students list, invoices,
attendance, staff. PreOne मध्या(cid:17) TanStack Table (headless) + ShadCN styling ची combination
47

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
use हा(cid:15)तो(cid:15). Headless approach दातो(cid:17) (cid:15) full styling control, TanStack Table दातो(cid:17) (cid:15) enterprise-grade
features (sorting, filtering, pagination, virtualization).
16.1 Table Features
PreOne च्या(cid:2) data tables मध्या(cid:17) खा(cid:2)ली(cid:7)ली features standard आहा(cid:17)तो. प्र(cid:9)त्याक(cid:17)  feature ADR-FA-015 मध्या (cid:17)
documented आहा(cid:17) — PR review मध्या(cid:17) verify क(cid:17) ली(cid:17) जे(cid:2)तो(cid:17) क(cid:7) new table या(cid:2)प्र@क(cid:7) सोवा/ features support
करतो(cid:17):
| Feature | Implementation | Purpose |
| ------- | -------------- | ------- |
Server Pagination Cursor-based for large  Avoid loading all rows
datasets; page-based for
small
Column Filter Per-column filter UI (text,  Combined with global search
select, date range)
| Global Search | Fuzzy search across visible  | Quick filter UX |
| ------------- | ---------------------------- | --------------- |
columns; debounced 300ms
| Sorting | Single or multi-column;  | Click header to toggle |
| ------- | ------------------------ | ---------------------- |
server-side; indicator in
header
| Export | Excel, CSV, PDF — server- | Respects current filter |
| ------ | ------------------------- | ----------------------- |
generated via BullMQ job
Bulk Actions Row selection via checkbox;  Bulk delete, bulk status
|     | action bar appears | change |
| --- | ------------------ | ------ |
Column Visibility User can hide/show columns;  Personalization
persisted per user
| Sticky Header | Header stays visible on  | Long tables |
| ------------- | ------------------------ | ----------- |
vertical scroll
Sticky First Column Name column stays visible on  Wide tables
horizontal scroll
| Row Expansion | Click row to expand details  | Quick preview |
| ------------- | ---------------------------- | ------------- |
(no navigation)
| Empty State | Friendly illustration + CTA  | Better than blank |
| ----------- | ---------------------------- | ----------------- |
when no data
Loading State Skeleton rows during fetch  Perceived performance
(not spinner)
48

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Feature Implementation Purpose
Error State Inline error + retry button Graceful degradation
Density Toggle Compact / Regular / User preference
Comfortable row height
Responsive Horizontal scroll on mobile; Mobile-friendly
columns hide based on
priority
16.2 Table Rules
• All tables built on TanStack Table (headless) + ShadCN styling
• Server-side pagination/sorting/filtering — never client-side for large data
• URL state for filters (shareable + back-button friendly)
• Debounce text filters 300ms to avoid excessive API calls
• Bulk actions require explicit confirm dialog
• Export runs async via BullMQ — email link when ready
• Column visibility persisted per user per table
• Row click navigates to detail (unless expansion configured)
• Keyboard navigation: arrow keys + Enter to select
• Virtual scrolling for 1000+ rows (TanStack Virtual)
16.3 Table Component Example
खा(cid:2)ली(cid:7)ली example दा(cid:2)खावातो (cid:17)कसो (cid:17)DataTable component use हा(cid:15)तो(cid:15). हा (cid:17)component headless TanStack
Table ची(cid:2) wrapper आहा(cid:17) — consumer फक्तो columns + data + fetch function provide करतो(cid:15).
Server-side pagination, sorting, filtering built-in:
// modules/student/components/student-table.tsx
'use client';
import { DataTable } from '@/components/ui/data-table';
import { useStudents } from '../hooks';
import { columns } from './student-columns';
export function StudentTable({ filters }: { filters: StudentFilters }) {
const [pagination, setPagination] = usePagination();
const [sorting, setSorting] = useSorting();
const [search, setSearch] = useDebounce('', 300);
49

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
const { data, isLoading } = useStudents({
...filters,
page: pagination.pageIndex,
pageSize: pagination.pageSize,
sort: sorting,
search,
});
return (
<DataTable
columns={columns}
data={data?.items ?? []}
loading={isLoading}
pagination={pagination}
onPaginationChange={setPagination}
sorting={sorting}
onSortingChange={setSorting}
search={search}
onSearchChange={setSearch}
totalCount={data?.totalCount ?? 0}
bulkActions={[
{ label: 'Delete Selected', onClick: handleBulkDelete, permission:
'STUDENT_DELETE' },
{ label: 'Export Selected', onClick: handleBulkExport, permission:
'STUDENT_EXPORT' },
]}
emptyState={<EmptyState title="No students"
action={<CreateStudentButton />} />}
/>
);
}
17. Charts
Charts हा (cid:17)data visualization ची(cid:2) mechanism आहा (cid:17)— dashboards, reports, analytics. PreOne मध्या (cid:17)
Recharts ची(cid:2) use हा(cid:15)तो(cid:15) — composable API, theme-aware, responsive. सोवा/ charts theme tokens
use करतो(cid:2)तो — school theme change झा(cid:2)ल्या(cid:2)वार charts आप्र(cid:15)आप्र update हा(cid:15)तो(cid:2)तो.
17.1 Chart Types
PreOne मध्या(cid:17) 10 chart types use हा(cid:15)तो(cid:2)तो — line, bar, stacked bar, pie/donut, area, scatter,
heatmap, funnel, gauge, sparkline. प्र(cid:9)त्याक(cid:17) chart type ची(cid:7) specific use case आहा(cid:17):
50

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Chart      | Use Case                | Example          |
| ---------- | ----------------------- | ---------------- |
| Line Chart | Trends over time — fee  | Time-series data |
collection, attendance %,
enrollment
| Bar Chart | Comparisons — branch-wise  | Categorical comparison |
| --------- | -------------------------- | ---------------------- |
revenue, class-wise strength
| Stacked Bar | Composition — fee heads,  | Part-to-whole |
| ----------- | ------------------------- | ------------- |
attendance reasons
| Pie / Donut | Distribution — admission  | ≤ 6 categories |
| ----------- | ------------------------- | -------------- |
sources, payment modes
| Area Chart | Cumulative trends —  | Cumulative |
| ---------- | -------------------- | ---------- |
revenue YTD, expenses
| Scatter | Correlation — age vs. fee,  | Two-variable |
| ------- | --------------------------- | ------------ |
attendance vs. grades
| Heatmap | Density — attendance  | Grid data |
| ------- | --------------------- | --------- |
patterns, classroom
utilization
| Funnel | Pipeline — admission stages,  | Sequential stages |
| ------ | ----------------------------- | ----------------- |
conversion
| Gauge | Single KPI — target  | Single metric |
| ----- | -------------------- | ------------- |
achievement %
| Sparkline | Inline mini chart in  | Compact trend |
| --------- | --------------------- | ------------- |
tables/cards
17.2 Chart Rules
•  All charts via Recharts (composable, theme-aware)
•  Colors pulled from theme tokens (consistent with brand)
•  Tooltips show precise values + date on hover
•  Legends positioned below chart; collapsible
•  Responsive container; min-height to prevent layout shift
•  Loading state: skeleton chart (not spinner)
•  Empty state: friendly message + CTA
•  Data labels disabled by default (enable on user toggle)
51

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
• Accessibility: data table alternative behind toggle
• Export to PNG + SVG via chart wrapper utility
17.3 Chart Example
खा(cid:2)ली(cid:7)ली example दा(cid:2)खावातो(cid:17) कसो(cid:17) theme-aware chart component तोया(cid:2)र कर(cid:2)याची.(cid:17) Colors theme
tokens प्र(cid:2)सोन(cid:29) या(cid:17)तो(cid:2)तो — hardcoded colors न(cid:2)हा(cid:7)तो. Responsive container layout shift prevent
करतो(cid:15):
// components/charts/fee-collection-chart.tsx
'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
ResponsiveContainer } from 'recharts';
import { useTheme } from '@/providers/theme-provider';
export function FeeCollectionChart({ data }: { data: FeePoint[] }) {
const { theme } = useTheme();
return (
<ResponsiveContainer width="100%" height={300}>
<LineChart data={data}>
<CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
<XAxis dataKey="month" stroke={theme.text} />
<YAxis stroke={theme.text} tickFormatter={(v) =>
formatCurrency(v)} />
<Tooltip
contentStyle={{ backgroundColor: theme.surface, border: `1px solid $
{theme.border}` }}
formatter={(value: number) => [formatCurrency(value), 'Collected']}
/>
<Line
type="monotone"
dataKey="collected"
stroke={theme.primary}
strokeWidth={2}
dot={{ fill: theme.primary }}
/>
</LineChart>
</ResponsiveContainer>
);
}
18. Notifications
Notifications हा(cid:17) user feedback ची(cid:2) mechanism आहा(cid:17) — action confirmations, errors, system
alerts. PreOne मध्या (cid:17)8 notification types आहा(cid:17)तो — toast, banner, modal, inline, push (browser
52

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
+ mobile), badge counter, realtime indicator. प्र(cid:9)त्याक(cid:17)  type ची(cid:7) specific use case आहा(cid:17) — wrong
type use क(cid:17) ल्या(cid:2)सो UX suffers.
18.1 Notification Types
| Type   | Description             | Use Case                | Persistence       |
| ------ | ----------------------- | ----------------------- | ----------------- |
| Toast  | Brief, auto-dismiss     | Success/error after     | Transient         |
|        | (3-5s), top-right stack | action                  |                   |
| Banner | Full-width,             | System-wide             | Persistent until  |
|        | dismissible, above      | announcements,          | dismissed         |
|        | content                 | maintenance             |                   |
| Modal  | Centered dialog,        | Critical confirmations  | Blocking          |
|        | requires interaction    | (delete, irreversible)  |                   |
| Inline | Within form/page,       | Field-level hints,      | Contextual        |
|        | contextual to section   | contextual help         |                   |
Push (Browser) OS-level notification  New message, fee  Opt-in
|     | when tab inactive | due reminder |     |
| --- | ----------------- | ------------ | --- |
Push (Mobile) FCM/APNs for  Critical alerts, chat  Future scope
|     | mobile app (future) | messages |     |
| --- | ------------------- | -------- | --- |
Badge Counter Numeric indicator on  Unread count,  Persistent
|     | icon/menu | pending approvals |     |
| --- | --------- | ----------------- | --- |
Realtime Indicator Pulse animation on  Attendance being  Transient
|     | live data | marked, payment  |     |
| --- | --------- | ---------------- | --- |
received
18.2 Notification Rules
•  Max 3 toasts visible simultaneously — older ones queue
•  Toasts auto-dismiss after 5s (success) or 10s (error)
•  Error toasts include 'View Details' link for full error
•  Banners persist across page navigation (until dismissed)
•  Realtime notifications via Socket.IO — instant badge update
•  Push notifications require explicit user opt-in
•  Notifications respect Do Not Disturb (user-configurable hours)
•  Notification preferences stored per-user, synced across devices
53

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
• Critical notifications (fee due, attendance alert) bypass DND
• Audit log for sent notifications (compliance requirement)
18.3 Toast System
Toast system हा(cid:17) सोवा8तो common notification mechanism आहा(cid:17). PreOne मध्या(cid:17) Sonner library use
हा(cid:15)तो(cid:17) — stack-based, auto-dismiss, swipe-to-dismiss. Toasts top-right corner मध्या (cid:17)stack हा(cid:15)तो(cid:2)तो,
max 3 visible simultaneously. Older ones queue. Error toasts जे(cid:2)स्तो णिदासोतो(cid:2)तो (10s vs 5s) आणि(cid:20)
'View Details' link include करतो(cid:2)तो:
// lib/toast.ts
import { toast } from 'sonner';
export const showToast = {
success: (message: string, description?: string) =>
toast.success(message, { description, duration: 5000 }),
error: (message: string, options?: { description?: string; traceId?: string })
=>
toast.error(message, {
description: options?.description,
duration: 10000, // longer for errors
action: options?.traceId
? { label: 'View Details', onClick: () => copyTraceId(options.traceId!) }
: undefined,
}),
warning: (message: string, description?: string) =>
toast.warning(message, { description, duration: 7000 }),
info: (message: string, description?: string) =>
toast.info(message, { description, duration: 5000 }),
loading: (message: string) => toast.loading(message),
promise: toast.promise,
};
19. File Upload
File Upload हा(cid:17) document-heavy preschool operations ची(cid:2) core feature आहा(cid:17) — student
documents, photos, invoices, certificates. PreOne मध्या(cid:17) pre-signed URL pattern use हा(cid:15)तो(cid:15) —
client directly uploads to S3 (bypassing backend), backend फक्तो metadata persist करतो(cid:15). या(cid:2)मळे$ (cid:17)
backend load कम(cid:7) हा(cid:15)तो(cid:17) आणि(cid:20) upload speed वा(cid:2)ढीतो(cid:17).
54

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
19.1 Upload Features
| Feature     | Implementation               | Benefit         |
| ----------- | ---------------------------- | --------------- |
| Drag & Drop | Drop zone with hover state;  | UX optimization |
multi-file
| Progress Bar | Per-file progress; abort  | Long uploads |
| ------------ | ------------------------- | ------------ |
button
| Preview | Image/video preview; PDF  | Before commit |
| ------- | ------------------------- | ------------- |
first page; icon for others
| Type Validation | MIME + extension check;  | Security |
| --------------- | ------------------------ | -------- |
reject invalid types
| Size Validation | Per-file max (10MB); per- | Storage limits |
| --------------- | ------------------------- | -------------- |
session max (100MB)
| Chunked Upload | Large files (>50MB) uploaded  | Reliability |
| -------------- | ----------------------------- | ----------- |
in 5MB chunks; resumable
| Virus Scan | ClamAV scan on backend  | Security |
| ---------- | ----------------------- | -------- |
before commit to S3
| Compression | Client-side image  | Bandwidth savings |
| ----------- | ------------------ | ----------------- |
compression (max 1920px,
80% quality)
| Pre-signed URL | Direct upload to S3 via pre- | Performance |
| -------------- | ---------------------------- | ----------- |
signed URL (bypass backend)
| Retry on Failure | Auto-retry 3x with  | Network resilience |
| ---------------- | ------------------- | ------------------ |
exponential backoff
19.2 Upload Flow
Complete upload flow खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). Pre-signed URL pattern backend load कम(cid:7) करतो(cid:15) —
file data backend through जे(cid:2)तो न(cid:2)हा(cid:7), थाट(cid:17)  S3 ली(cid:2) upload हा(cid:15)तो(cid:17). Backend फक्तो metadata persist
करतो(cid:15). Virus scan backend प्रर happen हा(cid:15)तो(cid:15) — ClamAV integration:
User selects files (drag-drop or click)
    ↓
Client-side validation (type, size)
    ↓
Request pre-signed URL from backend
    ↓
Upload directly to S3 via pre-signed URL (with progress)
    ↓
55

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Notify backend of upload completion (POST /uploads/confirm)
↓
Backend virus scan + persist metadata
↓
Return file ID + URL to client
↓
Form submission includes file IDs (not files)
19.3 FileUpload Component Example
FileUpload component ची(cid:2) implementation खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). Drag-drop, progress, preview,
validation — सोवा/ features built-in. Component fully controlled — parent form state through
manage हा(cid:15)तो(cid:17):
// components/ui/file-upload/file-upload.tsx
'use client';
interface FileUploadProps {
accept: string[]; // e.g., ['image/*', 'application/pdf']
maxSize: number; // bytes
multiple?: boolean;
onUpload: (files: UploadedFile[]) => void;
folder: string; // S3 folder (e.g., 'students/abc-123/documents')
}
export function FileUpload({ accept, maxSize, multiple, onUpload, folder }:
FileUploadProps) {
const [uploads, setUploads] = useState<UploadState[]>([]);
const handleFiles = async (files: File[]) => {
for (const file of files) {
// Validate
if (file.size > maxSize) {
showToast.error(`File too large: ${file.name}`);
continue;
}
// Get pre-signed URL
const { uploadUrl, fileId } = await getUploadUrl({ filename: file.name,
folder });
// Upload directly to S3
await axios.put(uploadUrl, file, {
onUploadProgress: (progress) => {
setUploads((prev) => updateProgress(prev, fileId, progress));
},
});
56

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
      // Confirm with backend
      await confirmUpload({ fileId });
    }
  };

  return (
    <Dropzone accept={accept} multiple={multiple} onDrop={handleFiles}>
      {uploads.map((u) => <UploadProgress key={u.fileId} upload={u} />)}
    </Dropzone>
  );
}
20. Error Handling
Error Handling हा(cid:17) user experience ची(cid:2) critical part आहा(cid:17) — कसो(cid:17) errors present क(cid:17) ली(cid:17) जे(cid:2)तो(cid:17) तो(cid:17) user
frustration कम(cid:7) करतो(cid:17) णिक5वा(cid:2) वा(cid:2)ढीवातो(cid:17). PreOne मध्या(cid:17) layered error handling आहा(cid:17) — global error
boundary, route-level error boundary, component-level error fallback, आणि(cid:20) form-level
error display. प्र(cid:9)त्याक(cid:17)
 layer different granularity प्रर handle करतो(cid:17).
20.1 Error Types
PreOne मध्या (cid:17)8 primary error types आहा(cid:17)तो. प्र(cid:9)त्याक(cid:17)  type ची(cid:7) specific UI treatment आहा (cid:17)— validation
errors inline, network errors persistent banner, critical errors modal:
| Error            | HTTP Status | UI Treatment        | Recovery          |
| ---------------- | ----------- | ------------------- | ----------------- |
| Validation Error | 422         | Field-level errors  | setFormError() +  |
|                  |             | displayed inline    | toast             |
below inputs
| Permission Denied | 403 | Inline 403 fallback  | <Can> fallback |
| ----------------- | --- | -------------------- | -------------- |
component or
redirect to
/forbidden
| Network Error | —   | Offline banner +     | useOnlineStatus  |
| ------------- | --- | -------------------- | ---------------- |
|               |     | retry button; queue  | hook             |
mutations if offline
| Session Expired | 401 | Silent refresh  | Axios interceptor |
| --------------- | --- | --------------- | ----------------- |
attempt; if fails,
redirect to /login
with return URL
| Server Error | 5xx | Toast + error ID for  | Global error  |
| ------------ | --- | --------------------- | ------------- |
|              |     | support; retry button | boundary      |
57

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Error HTTP Status UI Treatment Recovery
Not Found 404 Friendly 404 page not-found.tsx
with navigation
suggestions
Rate Limited 429 Toast with retry-after Axios interceptor
countdown
Conflict 409 Toast with conflict Refetch + toast
details; refresh data
20.2 Error Flow
Error handling ची(cid:2) complete flow खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). खा(cid:2)ली(cid:7)ली flow ensure करतो(cid:17) क(cid:7) user ली(cid:2) कधू(cid:7)ची
raw stack trace णिदासोतो न(cid:2)हा(cid:7), आणि(cid:20) त्या(cid:2)ली(cid:2) clear recovery path णिमळेतो(cid:15):
API Error occurs (interceptor catches)
↓
Normalize to ApiError shape
↓
If 401: attempt silent refresh
↓ refresh success
Retry original request
-- OR -- refresh fail
Redirect to /login
↓ (other errors)
TanStack Query onError callback
↓
Show toast (transient) OR modal (critical)
↓
If retryable, show retry button
↓
Fallback UI if component crashed (Error Boundary)
20.3 Error Handling Rules
• Every route has error.tsx boundary catching unexpected errors
• Global error boundary in app/global-error.tsx catches root errors
• Form validation errors shown inline (not toast)
• Network errors show persistent banner (not toast)
• Critical errors (5xx) include error ID for support tickets
• Error states never expose stack traces to users
• Retry button on all transient errors
58

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
• 404 page includes search + navigation suggestions
• 403 page explains why access denied + link to request access
• Errors logged to Sentry/LogRocket for analysis
20.4 Global Error Boundary
Global error boundary हा(cid:17) root-level error catcher आहा(cid:17) — React tree मध्या(cid:17) क(cid:15)(cid:20)तो(cid:2)हा(cid:7) uncaught
error या(cid:2)मध्या(cid:17) handle हा(cid:15)तो(cid:15). app/global-error.tsx Next.js convention follow करतो(cid:15). खा(cid:2)ली(cid:7)ली
example दा(cid:2)खावातो(cid:17) implementation:
// app/global-error.tsx
'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
export default function GlobalError({
error,
reset,
}: {
error: Error & { digest?: string };
reset: () => void;
}) {
useEffect(() => {
Sentry.captureException(error);
console.error('Global error:', error);
}, [error]);
return (
<html>
<body>
<ErrorLayout
title="Something went wrong"
description="An unexpected error occurred. Our team has been
notified."
errorId={error.digest}
actions={(
<>
<Button onClick={reset}>Try again</Button>
<Button variant="ghost" onClick={() => window.location.href =
'/dashboard'}>
Go to Dashboard
</Button>
</>
)}
/>
</body>
59

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
    </html>
  );
}
21. Performance
Performance हा(cid:17) user experience ची(cid:2) direct contributor आहा(cid:17) — Google च्या(cid:2) research नसो$ (cid:2)र
100ms सो(cid:2)ठी(cid:7) wait कर(cid:20)(cid:2)र(cid:17) users 7% conversion कम(cid:7) करतो(cid:2)तो. PreOne ची(cid:17) SLO (Service Level
Objective) Core Web Vitals श(cid:7) aligned आहा(cid:17)तो — LCP < 2.5s, INP < 200ms, CLS < 0.1.
Continuous monitoring Lighthouse CI + Vercel Analytics through हा(cid:15)तो(cid:17).
21.1 Performance Tactics
PreOne मध्या (cid:17)12 distinct performance tactics apply हा(cid:15)तो(cid:2)तो. प्र(cid:9)त्याक(cid:17)  tactic ची(cid:7) specific use case आहा(cid:17)
— blanket application न(cid:2)हा(cid:7). खा(cid:2)ली(cid:7)ली table सोवा/ tactics ची(cid:7) catalog करतो(cid:17):
| Tactic | Mechanism | Benefit |
| ------ | --------- | ------- |
Code Splitting next/dynamic for heavy  Smaller initial bundle
components (charts, editors)
Route-based Lazy Loading App Router auto-codesplits  Faster navigation
per route
Image Optimization next/image with WebP/AVIF;  60% smaller images
lazy load; blur placeholder
Virtual Scrolling TanStack Virtual for 1000+  Smooth scrolling
rows
| Memoization | React.memo, useMemo,  | Avoid re-renders |
| ----------- | --------------------- | ---------------- |
useCallback strategically
| Suspense | Streaming SSR with React  | Faster TTFB |
| -------- | ------------------------- | ----------- |
Suspense boundaries
| Partial Hydration | Server Components +  | Less JS to client |
| ----------------- | -------------------- | ----------------- |
selective 'use client'
| Prefetch | Link prefetch on hover; route  | Instant navigation |
| -------- | ------------------------------ | ------------------ |
prefetch on viewport
| Cache Headers | Static assets immutable;  | CDN efficiency |
| ------------- | ------------------------- | -------------- |
HTML revalidate
| Bundle Analysis | next/bundle-analyzer in CI;  | Prevent bloat |
| --------------- | ---------------------------- | ------------- |
budget alerts
60

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Tactic       | Mechanism                   | Benefit         |
| ------------ | --------------------------- | --------------- |
| Tree Shaking | ESM imports; named imports  | Smaller bundles |
only
Font Subsetting next/font with subset 'latin' +  Faster font load
'devanagari'
21.2 Performance SLOs
SLOs measurable performance targets  आहा(cid:17)तो.  या(cid:2)  targets consistently miss  झा(cid:2)ल्या(cid:2)सो
performance optimization sprint triggered हा(cid:15)तो(cid:15). PreOne ची(cid:17) SLOs aggressive प्र(cid:20) achievable
आहा(cid:17)तो — industry benchmarks श(cid:7) aligned:
| Metric                   | Target | Scope          |
| ------------------------ | ------ | -------------- |
| LCP (Largest Contentful  | < 2.5s | Core Web Vital |
Paint)
INP (Interaction to Next  < 200ms Core Web Vital (replaces FID)
Paint)
| CLS (Cumulative Layout Shift) | < 0.1            | Core Web Vital  |
| ----------------------------- | ---------------- | --------------- |
| TTFB (Time to First Byte)     | < 800ms          | Server response |
| Route Transition (cached)     | < 100ms          | SPA navigation  |
| Route Transition (uncached)   | < 500ms          | First visit     |
| Bundle Size (initial)         | < 200 KB gzipped | Landing page    |
Bundle Size (per route) < 100 KB gzipped additional Lazy-loaded
| API Response (cached)  | < 50ms      | TanStack Query hit |
| ---------------------- | ----------- | ------------------ |
| API Response (network) | < 500ms p95 | Backend SLO        |
21.3 Bundle Analysis
Bundle size हा(cid:17) performance ची(cid:2) critical factor आहा(cid:17) — initial bundle 越大, TTFB + parse time
जे(cid:2)स्तो. PreOne मध्या (cid:17)next/bundle-analyzer CI मध्या (cid:17)run हा(cid:15)तो(cid:15) — budget exceed झा(cid:2)ल्या(cid:2)सो build fail.
खा(cid:2)ली(cid:7)ली example दा(cid:2)खावातो(cid:17) bundle structure आणि(cid:20) budgets:
Bundle Budget:
  Initial JS (gzip):   < 200 KB
  Initial CSS (gzip): < 30 KB
  Per-route JS (gzip): < 100 KB additional
  Total (lazy):        < 1 MB
61

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Composition (example):
next/ (framework) ~80 KB
react + react-dom ~45 KB
@tanstack/react-query ~12 KB
zustand ~3 KB
react-hook-form ~9 KB
zod ~12 KB
axios ~12 KB
recharts (lazy) ~45 KB (route-split)
@tanstack/react-table ~20 KB (lazy)
----------------------------------------
Initial total ~173 KB (within budget)
Monitoring:
- CI runs next build --analyze
- Bundle sizes stored per build
- PR shows bundle diff vs main
- Alert if any chunk grows > 10%
22. Accessibility
Accessibility (a11y) हा(cid:17) PreOne ची(cid:2) non-negotiable requirement आहा(cid:17) — WCAG 2.2 AA
compliance. Section 508, ADA, आणि(cid:20) India च्या(cid:2) Rights of Persons with Disabilities Act 2016 सोवा/
compliance mandate करतो(cid:2)तो. PreOne मध्या (cid:17)a11y by-default आहा (cid:17)— components accessible-by-
construction, automated testing CI मध्या,(cid:17) manual screen reader testing release cycle मध्या.(cid:17)
22.1 Accessibility Rules
खा(cid:2)ली(cid:7)ली rules WCAG 2.2 AA compliance सोणि$नणि'चीतो करतो(cid:2)तो. या(cid:2)तो(cid:7)ली बऱ्या(cid:2)ची rules automated axe-
core tests न(cid:17) enforce हा(cid:15)तो(cid:2)तो — ब(cid:2)क(cid:7) PR review मध्या (cid:17)check हा(cid:15)तो(cid:2)तो:
• WCAG 2.2 AA compliance (target AAA where feasible)
• Semantic HTML (nav, main, section, article, aside)
• ARIA labels only when semantic HTML insufficient
• Keyboard navigation for all interactions (Tab, Enter, ESC, arrows)
• Focus management: visible focus ring, logical tab order, focus trap in modals
• Color contrast: 4.5:1 for normal text, 3:1 for large text
• Never convey information by color alone (add icon + text)
• Alt text for all meaningful images; empty alt for decorative
• Form labels associated via htmlFor; error messages via aria-describedby
62

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
• Skip-to-content link at top of page
• Live regions for dynamic updates (aria-live)
• Reduced motion support via prefers-reduced-motion
• Screen reader testing with NVDA + VoiceOver in CI
• Automated a11y tests via axe-core in Vitest + Playwright
22.2 Automated Testing
Automated a11y testing हा(cid:17) CI pipeline ची(cid:2) mandatory part आहा(cid:17) — PR merge हा(cid:15)ण्या(cid:2)प्रवा(cid:29) B zero
violations प्र(cid:2)णिहाजे(cid:17). axe-core Vitest integration सोहा component tests मध्या(cid:17) run हा(cid:15)तो(cid:17), Playwright
integration सोहा E2E tests मध्या (cid:17)run हा(cid:15)तो(cid:17):
// Example: a11y test in component test
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { Button } from './button';
describe('Button a11y', () => {
it('should have no violations', async () => {
const { container } = render(<Button>Click me</Button>);
const results = await axe(container);
expect(results).toHaveNoViolations();
});
it('should have no violations when disabled', async () => {
const { container } = render(<Button disabled>Click me</Button>);
const results = await axe(container);
expect(results).toHaveNoViolations();
});
});
// CI: GitHub Actions runs all a11y tests on every PR
// - Failure blocks merge
// - Report uploaded as PR comment with violation details
23. Internationalization
Internationalization (i18n) हा(cid:17) PreOne च्या(cid:2) India-first strategy ची(cid:2) core आहा(cid:17) — 3 locales launch
सो(cid:2)ठी(cid:7) (en-IN, hi, mr). India मध्या (cid:17)preschool education मर(cid:2)ठी(cid:7), णिहादा5 (cid:7), आणि(cid:20) English मध्या (cid:17)happen हा(cid:15)तो (cid:17)—
users ची(cid:7) preferred language vary हा(cid:15)तो(cid:17). next-intl library App Router native support दातो(cid:17) (cid:17)— type-
safe message keys, ICU MessageFormat, locale routing.
63

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
23.1 i18n Configuration
| Aspect | Value | Notes |
| ------ | ----- | ----- |
Supported Locales en-IN (default), hi, mr 3 locales at launch
| Locale Routing | /en/dashboard,  | SEO + UX |
| -------------- | --------------- | -------- |
/hi/dashboard,
/mr/dashboard
| Message Format | next-intl with ICU  | Plurals, gender, dates |
| -------------- | ------------------- | ---------------------- |
MessageFormat
Translation Source Crowdin (or Lokalise) —  Translator workflow
managed translation
platform
| Fallback | en-IN for missing keys (never  | Graceful degradation |
| -------- | ------------------------------ | -------------------- |
show key string)
Date/Time Intl.DateTimeFormat with  e.g., 14/07/2026 (en-IN),
|             | locale                  | १४/०७/२०२६ (hi)              |
| ----------- | ----------------------- | ---------------------------- |
| Numbers     | Intl.NumberFormat with  | ₹1,234.56 (en-IN), १,२३४.५६  |
|             | locale + currency       | (mr)                         |
| RTL Support | Architecture-ready      | Logical properties           |
(Arabic/Urdu future)
23.2 i18n Rules
•  All user-facing strings in messages/{locale}.json — never hardcoded
•  Translation keys namespaced by module: student.create.title
•  Plurals handled via ICU: {count, plural, =0 {No students} one {# student} other {#
students}}
•  Dates/times/numbers/currency always via Intl formatters
•  Locale switcher in user menu; persisted in cookie
•  Translation missing key logged in dev (not in prod)
•  Translation PRs require linguist approval
•  Automated check in CI: no hardcoded user-facing strings
64

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
23.3 Translation File Example
Translation files JSON format मध्या(cid:17) आहा(cid:17)तो — namespaced by module. ICU MessageFormat
plurals, gender, dates handle करतो(cid:17). Missing keys fallback locale (en-IN) प्र(cid:2)सोन(cid:29) या(cid:17)तो(cid:2)तो — user ली(cid:2)
कधू(cid:7)ची raw key string णिदासोतो न(cid:2)हा(cid:7):
// messages/en-IN/student.json
{
"student": {
"title": "Students",
"create": {
"title": "Create Student",
"success": "Student created successfully",
"error": "Failed to create student"
},
"list": {
"empty": "No students found",
"count": "{count, plural, =0 {No students} one {# student} other {#
students}}"
},
"fields": {
"firstName": "First Name",
"lastName": "Last Name",
"dateOfBirth": "Date of Birth",
"gender": "Gender"
}
}
}
// messages/mr/student.json
{
"student": {
"title": "वि(cid:2)द्या(cid:4)र्थी(cid:6)",
"create": {
"title": "न(cid:2)(cid:8)न वि(cid:2)द्या(cid:4)र्थी(cid:6)",
"success": "वि(cid:2)द्या(cid:4)र्थी(cid:6) यशस्(cid:2)(cid:8)वि(cid:13)त्य(cid:4) तय(cid:4)(cid:13) झा(cid:4)ला(cid:4)",
"error": "वि(cid:2)द्या(cid:4)र्थी(cid:6) तय(cid:4)(cid:13) क(cid:13)ण्य(cid:4)त अयशस्(cid:2)(cid:8)"
}
}
}
24. Testing
Testing हा(cid:17) frontend quality ची(cid:2) foundation आहा(cid:17). PreOne ची(cid:2) testing approach classic test
pyramid follow करतो(cid:15) — broad base of fast unit tests, narrow top of slow E2E tests. या(cid:2)मळे$ (cid:17)
feedback loop fast र(cid:2)हातो(cid:15) आणि(cid:20) confidence high र(cid:2)हातो(cid:15). Accessibility testing + visual regression
testing या(cid:2)ची5 (cid:2) inclusion enterprise-grade discipline दाश/वातो(cid:15).
65

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
24.1 Test Pyramid
| Layer | Tool | Scope | Coverage  | Speed |
| ----- | ---- | ----- | --------- | ----- |
Target
| Unit Tests | Vitest + jsdom | Pure functions,  | 100% coverage  | ms  |
| ---------- | -------------- | ---------------- | -------------- | --- |
|            |                | hooks, utils,    | target         |     |
validators
| Component  | Vitest + Testing  | Component   | 85% coverage  | ms  |
| ---------- | ----------------- | ----------- | ------------- | --- |
| Tests      | Library           | rendering,  | target        |     |
interaction,
accessibility
| Integration  | Vitest + MSW   | Hook +        | Critical paths | seconds |
| ------------ | -------------- | ------------- | -------------- | ------- |
| Tests        | (mock service  | component +   |                |         |
|              | worker)        | API mock end- |                |         |
to-end
E2E Tests Playwright Real browser,  Smoke + critical  minutes
|     |     | full user  | flows |     |
| --- | --- | ---------- | ----- | --- |
journeys across
routes
| Accessibility  | axe-core +       | WCAG              | Zero critical  | seconds |
| -------------- | ---------------- | ----------------- | -------------- | ------- |
| Tests          | Vitest +         | violations auto-  | violations     |         |
|                | Playwright       | detected          |                |         |
| Visual         | Playwright       | Pixel-level diff  | Per Storybook  | seconds |
| Regression     | screenshot diff  | on component      | story          |         |
|                | + Chromatic      | change            |                |         |
Performance  Lighthouse CI Core Web Vitals  Per PR + weekly minutes
| Tests |     | per route |     |     |
| ----- | --- | --------- | --- | --- |
Contract Tests OpenAPI  Frontend types  Per API change seconds
|     | codegen +  | match backend  |     |     |
| --- | ---------- | -------------- | --- | --- |
|     | Vitest     | contract       |     |     |
24.2 Test Pyramid Diagram
                  /\
                 /  \         E2E (10%)
                /----\        Playwright + real browser
               /      \
              /        \      Integration (20%)
             /----------\     Vitest + MSW
            /            \
66

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
/ \ Unit + Component (70%)
/----------------\ Vitest + Testing Library
Speed: fast <-----------> slow
Coverage: broad <---------> narrow
Cost: cheap <---------> expensive
24.3 Testing Rules
• 70% unit, 20% integration, 10% E2E — classic pyramid
• Component tests use Testing Library (query by role, not test-id)
• MSW for API mocking — never mock fetch directly
• E2E tests run against staging with seeded data
• Visual regression baseline requires designer approval to update
• Accessibility tests run on every PR — block merge on violations
• Lighthouse CI budget: 90+ on all metrics
• Tests run in parallel via Vitest + Playwright sharding
• Flaky tests auto-disabled after 3 flakes; ticket created
• Coverage reported in CI; PRs cannot decrease coverage
24.4 Component Test Example
Component test ची(cid:2) example खा(cid:2)ली(cid:7)लीप्र(cid:9)म(cid:2)(cid:20)(cid:17) आहा(cid:17). Testing Library use करतो(cid:17) — query by role (not
test-id), user-centric assertions. MSW API mocking करतो(cid:17) — real HTTP semantics.
Accessibility check axe-core सोहा automatic:
// modules/student/components/student-card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { StudentCard } from './student-card';
describe('StudentCard', () => {
const mockStudent: Student = {
id: 'abc-123',
firstName: 'Aarav',
lastName: 'Sharma',
className: 'Nursery-A',
attendancePercent: 95,
feeStatus: 'PAID',
};
67

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
it('renders student name and class', () => {
render(<StudentCard student={mockStudent} />);
expect(screen.getByRole('heading', { name: /aarav
sharma/i })).toBeInTheDocument();
expect(screen.getByText(/nursery-a/i)).toBeInTheDocument();
});
it('navigates to detail on click', async () => {
const user = userEvent.setup();
const onNavigate = vi.fn();
render(<StudentCard student={mockStudent}
onNavigate={onNavigate} />);
await user.click(screen.getByRole('button', { name: /aarav sharma/i }));
expect(onNavigate).toHaveBeenCalledWith('abc-123');
});
it('has no accessibility violations', async () => {
const { container } = render(<StudentCard student={mockStudent} />);
const results = await axe(container);
expect(results).toHaveNoViolations();
});
});
25. Deployment
Deployment हा(cid:17) production release ची(cid:2) final gate आहा(cid:17) — PreOne च्या(cid:2) deployment checklist ली(cid:2)
strict enforcement आहा(cid:17). या(cid:2)तो(cid:7)ली क(cid:15)(cid:20)तो(cid:2)हा(cid:7) item pending असोली(cid:17) तोर deployment block हा(cid:15)तो(cid:15). PreOne
frontend Vercel वार hosted आहा(cid:17) — edge network, instant rollbacks, preview deployments
per PR.
25.1 Pre-Deployment Checklist
Aspect Item Tool
Code All PRs merged; feature flags Git + Flagsmith
configured
Build next build passes; bundle next build
within budget
Tests Unit + integration + E2E + Vitest + Playwright
a11y all green
Lighthouse All routes ≥ 90 on all metrics Lighthouse CI
Type Check tsc --noEmit passes; no type tsc
errors
68

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Aspect | Item                        | Tool   |
| ------ | --------------------------- | ------ |
| Lint   | ESLint + Prettier clean; 0  | ESLint |
warnings
| Env Vars | All NEXT_PUBLIC_* set in  | Vercel project settings |
| -------- | ------------------------- | ----------------------- |
Vercel env
| API Contract | Backend deployed + contract  | OpenAPI diff |
| ------------ | ---------------------------- | ------------ |
verified
| Translations | All keys translated for  | Crowdin sync |
| ------------ | ------------------------ | ------------ |
supported locales
| Analytics | Tracking events verified in  | PostHog / GA4 |
| --------- | ---------------------------- | ------------- |
staging
| Error Monitoring | Sentry release tagged; source  | Sentry CLI |
| ---------------- | ------------------------------ | ---------- |
maps uploaded
| Performance | Bundle size within budget; no  | Bundle analyzer |
| ----------- | ------------------------------ | --------------- |
regressions
Rollback Plan Instant rollback via Vercel (1- Vercel dashboard
click)
| Smoke Tests | Post-deploy smoke test  | GitHub Actions |
| ----------- | ----------------------- | -------------- |
(Playwright) on prod
| Stakeholder Comms | Release notes circulated;  | Email / Slack |
| ----------------- | -------------------------- | ------------- |
stakeholders notified
25.2 Deployment Topology
| Component | Service | Notes |
| --------- | ------- | ----- |
Hosting Vercel (primary) / self-hosted  Edge network; instant
|     | Node.js                  | rollbacks         |
| --- | ------------------------ | ----------------- |
| CDN | Vercel Edge Network (or  | Global edge cache |
CloudFront for self-hosted)
Image Optimization Vercel Image Optimization  On-the-fly resize
(or next/image with S3)
| Analytics | Vercel Analytics + PostHog  | Real user metrics |
| --------- | --------------------------- | ----------------- |
(product analytics)
Error Monitoring Sentry (browser + server) Stack traces + source maps
69

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Component Service Notes
Session Replay LogRocket (for critical flows UX debugging
only — sampling 1%)
Feature Flags Flagsmith (or Vercel Toolbar Progressive rollout
for dev)
A/B Testing Vercel Edge Config + Server-side experiments
Middleware
i18n CDN Crowdin CDN for live No redeploy for translations
translation updates
Fonts next/font (self-hosted via No Google Fonts request
Vercel)
25.3 CI/CD Pipeline
CI/CD pipeline GitHub Actions वार आहा(cid:17) — प्र(cid:9)त्या(cid:17)क push ची(cid:2) build + test + a11y + Lighthouse scan
हा(cid:15)तो(cid:15). PRs वार preview deployments auto-create हा(cid:15)तो(cid:2)तो — reviewers URL श(cid:7) live preview बघ (cid:29)
शकतो(cid:2)तो. main branch merge झा(cid:2)ल्या(cid:2)वार staging deploy हा(cid:15)तो(cid:15), production deploy manual
approval नतो5 र हा(cid:15)तो(cid:15):
Push to feature branch
↓
CI: lint + typecheck + unit tests
↓ pass
CI: component tests + a11y tests
↓ pass
CI: build (next build) + bundle size check
↓ pass
CI: Lighthouse CI on critical routes
↓ pass (all metrics >= 90)
Vercel: preview deployment auto-created
↓
PR review with live preview URL
↓ approval + merge to main
CD: deploy to staging (auto)
↓
E2E tests on staging (Playwright)
↓ pass
Manual approval (release manager)
↓
CD: deploy to production (Vercel promotion)
↓
Smoke tests on production (Playwright smoke)
↓ pass
Release complete (1-click rollback available)
70

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
26. Coding Standards
Coding standards हा(cid:17) codebase consistency सोणि$नणि'चीतो करतो(cid:2)तो — ज्या(cid:2)मळे$ (cid:17) code read कर(cid:20),(cid:17) review
कर(cid:20),(cid:17) आणि(cid:20) maintain कर(cid:20) (cid:17)सो(cid:15)प्र (cid:17)हा(cid:15)तो(cid:17). PreOne ची (cid:17)standards strict प्र(cid:20) pragmatic आहा(cid:17)तो — developer
productivity balance with code quality. ESLint + Prettier automated enforcement करतो(cid:2)तो;
ब(cid:2)क(cid:7) rules PR review मध्या (cid:17)check हा(cid:15)तो(cid:2)तो.
26.1 Standards Catalog
• Feature-first architecture — one module folder per business domain
• One module = one business domain (no cross-module business logic)
• Reusable UI components in components/ui/ — domain components in modules/
• No business logic inside components (only rendering + interaction)
• Hooks for reusable behavior — useStudent, usePermissions, useDebounce
• Strict TypeScript — no implicit any, no unchecked index access, no any
• ESLint + Prettier enforced via pre-commit hook (Husky)
• Import order: React → external → internal absolute → relative → types
• Named exports only (no default exports) — except page.tsx for Next.js
• File names: kebab-case (student-form.tsx, not StudentForm.tsx)
• Component names: PascalCase (StudentForm, not studentForm)
• Hook names: camelCase starting with 'use' (useStudent, not studentHook)
• Constant names: UPPER_SNAKE_CASE (MAX_FILE_SIZE, not maxFileSize)
• Type names: PascalCase (StudentProfile, not student_profile)
• No magic numbers — extract to named constant
• No console.log in production code (use Sentry or proper logger)
• JSDoc on every public hook + utility
• Comments explain WHY, not WHAT
26.2 Pre-commit Hooks
Quality enforcement local level प्रर हा(cid:15)ण्या(cid:2)सो(cid:2)ठी(cid:7) Husky pre-commit hooks install आहा(cid:17)तो. प्र(cid:9)त्याक(cid:17)
commit वार lint + format + type-check run हा(cid:15)तो(cid:2)तो — failures commit block करतो(cid:2)तो. या(cid:2)मळे$ (cid:17) broken
code repository मध्या (cid:17)push हा(cid:15)तो न(cid:2)हा(cid:7):
// package.json
71

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
"husky": {
"hooks": {
"pre-commit": "lint-staged",
"pre-push": "npm run test:unit"
}
},
"lint-staged": {
"*.{ts,tsx}": [
"eslint --fix",
"prettier --write",
"tsc --noEmit"
]
}
26.3 PR Review Checklist
PR review मध्या(cid:17) खा(cid:2)ली(cid:7)ली checklist follow क(cid:17) ली(cid:2) जे(cid:2)तो(cid:15). हा(cid:17) checklist reviewer ची(cid:7) cognitive load कम(cid:7)
करतो(cid:17) — सोवा/ aspects systematically cover हा(cid:15)तो(cid:2)तो:
• Components are pure — no API calls or global state access in components (use
hooks).
• Server Components by default — 'use client' only when interactivity required.
• Zod schema exists for every form — single source of truth for validation.
• TanStack Query for server state — NEVER in Zustand.
• RBAC guards on all data-modifying buttons — <Can> component.
• Accessibility tested — axe-core passes, keyboard navigation works.
• Loading + error states implemented — not just happy path.
• Storybook story added for new components.
• Tests added — unit for logic, component for UI, E2E for critical flows.
• Bundle size within budget — no new heavy dependencies without ADR.
• Translations added for all user-facing strings (en-IN, hi, mr).
• Performance: Lighthouse score >= 90 on affected routes.
27. Folder Standards
Folder Standards हा(cid:17) codebase organization ची(cid:2) enforcement mechanism आहा(cid:17) — where files
live, how they import each other, what goes where. PreOne मध्या(cid:17) strict folder conventions
आहा(cid:17)तो जे (cid:17)ESLint import boundaries न (cid:17)enforce हा(cid:15)तो(cid:2)तो. Violation सो(cid:2)ठी(cid:7) lint error यातो(cid:17) (cid:15) आणि(cid:20) build fail
हा(cid:15)तो(cid:15).
72

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
27.1 Folder Standards Catalog
• Each module folder has index.ts barrel exporting public API
• Modules never import from another module's internal files (only via index.ts)
• Shared components live in components/ui/ — not in modules/
• Shared hooks live in hooks/ — not in modules/
• Shared utilities live in utils/ — not in modules/
• Module-local types live in modules/{module}/types/ — not in root types/
• Module-local utilities live in modules/{module}/utils/ — not in root utils/
• Test files co-located with source: student-form.tsx → student-form.test.tsx
• Story files co-located: student-card.tsx → student-card.stories.tsx
• App Router routes in app/ — thin wrappers that compose module components
• No business logic in app/ routes — only composition + data fetching
• Layouts in layouts/ — reusable across routes
• Providers in providers/ — context wrappers, one per concern
• Services in services/ — API clients, one file per domain
• Config in lib/ — framework glue (queryClient, axiosClient, etc.)
27.2 ESLint Import Boundaries
Import boundary rules ESLint config मध्या(cid:17) defined आहा(cid:17)तो. खा(cid:2)ली(cid:7)ली snippet rules ची(cid:2) essence
दा(cid:2)खावातो (cid:17)— full config repo मध्या (cid:17).eslintrc.js मध्या (cid:17)आहा(cid:17). हा (cid:17)rules ensure करतो(cid:2)तो क(cid:7) modules एकम(cid:17)क(cid:2)श5 (cid:7)
only via public barrels communicate करतो(cid:2)तो:
// .eslintrc.js
'import/no-restricted-paths': ['error', {
zones: [
// Modules cannot import from another module's internal files
{
target: './src/modules/**/!(*index.ts)',
from: './src/modules/**/!(*index.ts)',
},
// Components cannot import from modules (use modules' public API)
{
target: './src/components',
from: './src/modules',
},
// App router routes cannot contain business logic
{
target: './src/app',
73

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
from: './src/modules/*/services',
},
{
target: './src/app',
from: './src/modules/*/api',
},
],
}],
'import/no-internal-modules': ['error', {
allow: ['@/modules/*', '@/components/ui/*', '@/hooks/*'],
}],
28. Glossary
Frontend terminology ची(cid:7) authoritative reference. नवा(cid:7)न terms introduce करतो(cid:2)न(cid:2) या(cid:2) glossary
मध्या(cid:17) entry add कर(cid:2)वा(cid:7) ली(cid:2)गेली(cid:17) . Onboarding engineers सो(cid:2)ठी(cid:7) हा(cid:2) glossary प्रणिहाली(cid:2) read कर(cid:2)याची(cid:2)
resource आहा(cid:17) — frontend vocabulary build करण्या(cid:2)सो(cid:2)ठी(cid:7).
Term Meaning
App Router Next.js 13+ routing system using filesystem in
app/ directory
RSC React Server Components — components
that render on server, zero JS shipped
Server Actions Functions that run on server, called from
client — no API endpoint needed
Edge Runtime V8 isolate runtime for low-latency global
execution (middleware, edge functions)
ISR Incremental Static Regeneration — static
pages re-generated at runtime
Partial Prerendering Next.js 14+ feature — static shell + streamed
dynamic content
TanStack Query Server state library for data fetching, caching,
mutations
Zustand Minimal client state library — no provider
boilerplate
React Hook Form Performance-optimized form library using
uncontrolled refs
Zod TypeScript-first schema validation library
74

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Term Meaning
ShadCN UI Component collection copied into repo (not
npm dependency)
Radix UI Headless accessible primitives underlying
ShadCN
TanStack Table Headless table library for building data tables
TanStack Virtual Headless virtualization for long lists
Storybook Component development environment +
living documentation
Glossary (cont.)
Term Meaning
MSW Mock Service Worker — API mocking for tests
Playwright Cross-browser E2E testing framework
Lighthouse Google's performance + accessibility auditing
tool
Core Web Vitals Google's user experience metrics: LCP, INP,
CLS
WCAG Web Content Accessibility Guidelines — W3C
standard
RBAC Role-Based Access Control — permissions via
roles
ABAC Attribute-Based Access Control —
permissions via attributes
ACL Access Control List — per-resource
permission list
SSR Server-Side Rendering — HTML generated on
server per request
SSG Static Site Generation — HTML generated at
build time
CSR Client-Side Rendering — HTML generated in
browser via JS
Hydration Attaching event listeners to server-rendered
HTML
75

PreOne Frontend Architecture v1.0  |  Frontend Architecture Freeze
| Term     |     | Meaning                                  |     |
| -------- | --- | ---------------------------------------- | --- |
| Suspense |     | React component for declarative loading  |     |
states
| Error Boundary |     | React component catching errors in tree  |     |
| -------------- | --- | ---------------------------------------- | --- |
below
| Provider Pattern |     | Context providers wrapping app to share  |     |
| ---------------- | --- | ---------------------------------------- | --- |
state
29. Document Control
29.1 Version History
| Version | Date       | Author            | Changes            |
| ------- | ---------- | ----------------- | ------------------ |
| 1.0     | 2026-07-14 | PreOne Frontend   | Initial version —  |
|         |            | Architecture Team | Frontend           |
Architecture Freeze
29.2 Approval Matrix
या(cid:2) document च्या(cid:2) freeze सो(cid:2)ठी(cid:7) खा(cid:2)ली(cid:7)ली roles ची(cid:7) approval mandatory आहा(cid:17). सोवा /approvals recorded
असोल्या(cid:2)वारची document 'Architecture Freeze' status मध्या (cid:17)move हा(cid:15)तो(cid:15):
| Role            | Name  | Responsibility       | Status  |
| --------------- | ----- | -------------------- | ------- |
| Chief Architect | [TBD] | Architecture review  | Pending |
+ sign-off
| VP Engineering | [TBD] | Engineering approval | Pending |
| -------------- | ----- | -------------------- | ------- |
| Frontend Lead  | [TBD] | Frontend             | Pending |
architecture review
| UI/UX Lead | [TBD] | Design system +  | Pending |
| ---------- | ----- | ---------------- | ------- |
theme alignment
review
| DevOps Lead | [TBD] | Deployment +  | Pending |
| ----------- | ----- | ------------- | ------- |
observability review
| Accessibility Officer | [TBD] | WCAG 2.2 AA  | Pending |
| --------------------- | ----- | ------------ | ------- |
compliance review
76

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
29.3 Review Cadence
• Architecture Freeze: quarterly review (Q1, Q2, Q3, Q4)
• Major version bump (v2.0): on framework upgrade (Next.js 17 → 18)
• Minor version bump (v1.1): on new chapter / significant section addition
• Patch version bump (v1.0.1): on clarification / typo fixes only
29.4 Distribution List
हा(cid:2) document खा(cid:2)ली(cid:7)ली teams प्रर distributed आहा(cid:17). Internal Engineering Reference —
confidential, not for external distribution:
• PreOne Architecture Team (primary authors + maintainers)
• PreOne Frontend Engineering Team (all frontend engineers)
• PreOne Backend Engineering Team (API contract alignment)
• PreOne QA Team (test strategy + E2E reference)
• PreOne UI/UX Team (component library + theme reference)
• PreOne DevOps / SRE Team (deployment + monitoring reference)
• PreOne Onboarding Team (new hire orientation reference)
• PreOne Leadership (architectural investment decisions)
29.5 Companion Documents
हा(cid:2) document खा(cid:2)ली(cid:7)ली documents सोहा read क(cid:17) ली(cid:2) जे(cid:2)वा(cid:2) — त्या(cid:2)ची5 (cid:2) context this document ली(cid:2)
supplement करतो(cid:15):
Document Version Relationship
Vision Document v1.0 Strategic intent + non-
functional requirements
Master PRD v1.0 Functional requirements —
screen + flow mapping
DDD v1.0 Domain model — 14
modules alignment
ADR Catalog v1.0 Architecture decisions —
frontend choices rationale
77

PreOne Frontend Architecture v1.0 | Frontend Architecture Freeze
Document Version Relationship
UI Design Philosophy v1.0 Theme engine, component
patterns, accessibility
API Contract Catalog v1.0 Endpoint contracts — API
services spec
Backend Technical Design v1.0 Backend architecture — auth
+ RBAC alignment
29.6 Deliverables
या(cid:2) Frontend Architecture document मधून(cid:29) खा(cid:2)ली(cid:7)ली production artifacts तोया(cid:2)र हा(cid:15)तो(cid:7)ली. हा(cid:17) artifacts
implementation phase मध्या (cid:17)frontend engineering team द्वा(cid:2)र(cid:17) deliver क(cid:17) ली (cid:17)जे(cid:2)तो(cid:7)ली:
• Complete Next.js Project Structure — apps/web/ with monorepo setup.
• 14 Business Domain Modules — feature-first organization with barrel exports.
• App Router Architecture — route groups, nested layouts, parallel routes.
• Global Layout System — 8 layouts covering all UI shells.
• State Management Strategy — TanStack Query + Zustand + React Hook Form
separation.
• API Client Layer — 12 service files + axios interceptors + OpenAPI codegen.
• Authentication & Session Management — JWT + silent refresh + multi-school
switch.
• RBAC Guards — 7 layers (route, menu, screen, component, button, field, API).
• Theme Engine & White Label Support — 5-level hierarchy + light/dark/auto modes.
• Form & Validation Framework — React Hook Form + Zod + 4-layer validation.
• Enterprise Component Library — 18 base + 10 composite components + Storybook.
• Dashboard & Data Table Standards — TanStack Table + 15 features + virtualization.
• Performance Optimization Guide — 12 tactics + SLOs + bundle budgets.
• Testing Strategy — 8 test layers including a11y + visual regression.
• Frontend Coding Standards — 18 rules + PR review checklist + ESLint boundaries.
78