P R E O N E E N T E R P R I S E
PreOne Enterprise
OpenAPI Specification
OpenAPI 3.1 — Enterprise Preschool Operating System
Document Version: 1.0
Status: API Specification Freeze
Specification: OpenAPI 3.1
Date: 2026-07-14
Product: PreOne — Enterprise Preschool Operating System
Predecessor: Vision v1.0, Master PRD v1.0, DDD v1.0, ERD v3.0, API Contract Catalog v1.0
Successor: Swagger UI, Postman Collection, SDK Generation, Mock Server, Backend Validation, API Testing
Scope: 14 domains, ~530 REST APIs, 5 WebSocket channels, 5 webhook events
Classification: Internal Engineering Reference
Prepared by: PreOne Architecture & Engineering Team
PreOne Platform OpenAPI Spec v1.0

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Table of Contents
1. Introduction...................................................................................................................1
1.1 Purpose...........................................................................................................................1
1.2 Scope..............................................................................................................................2
1.3 Audience.........................................................................................................................3
1.4 Specification Status........................................................................................................5
1.5 Related Documents........................................................................................................5
2. OpenAPI Standards.........................................................................................................5
2.1 Specification Version......................................................................................................5
2.2 Standards Compliance....................................................................................................6
2.3 File Organization.............................................................................................................6
2.4 Reference Strategy.......................................................................................................10
3. API Information............................................................................................................11
3.1 info Object....................................................................................................................11
3.2 Field Reference.............................................................................................................14
3.3 Versioning Strategy......................................................................................................14
4. Servers..........................................................................................................................15
4.1 Server Environments....................................................................................................15
4.2 Environment Reference...............................................................................................17
4.3 Environment Selection.................................................................................................17
5. Security Schemes..........................................................................................................18
5.1 Supported Schemes......................................................................................................18
5.2 Scheme Reference........................................................................................................22
5.3 Future-Ready Authentication.......................................................................................22
6. Authentication APIs......................................................................................................23
1

PreOne OpenAPI Spec v1.0 | API Specification Freeze
6.1 Login Flow.....................................................................................................................23
6.2 Login Endpoint..............................................................................................................23
6.3 Authentication Endpoints.............................................................................................28
6.4 Token Lifecycle.............................................................................................................29
7. Authorization................................................................................................................30
7.1 Scope-Based Access Control........................................................................................30
7.2 Scope Catalog...............................................................................................................30
7.3 Authorization Flow.......................................................................................................30
8. Common Headers.........................................................................................................34
8.1 Multi-Tenant Header Standards...................................................................................34
8.2 Header Reference.........................................................................................................34
8.3 Header Examples..........................................................................................................34
9. Request Schemas..........................................................................................................38
9.1 Schema Standards........................................................................................................38
9.2 Request Patterns..........................................................................................................38
9.3 StudentCreateRequest Schema...................................................................................39
10. Response Schemas......................................................................................................46
10.1 Response Standards...................................................................................................46
10.2 Response Patterns......................................................................................................46
10.3 StudentResponse Schema..........................................................................................46
10.4 Pagination Response..................................................................................................52
11. Error Schemas.............................................................................................................57
11.1 Standard Error Envelope............................................................................................57
11.2 Common Status Codes...............................................................................................64
11.3 Error Code Catalog.....................................................................................................64
12. Common Components................................................................................................64
12.1 Components Overview...............................................................................................64
12.2 Component Reference...............................................................................................65
2

PreOne OpenAPI Spec v1.0 | API Specification Freeze
12.3 Reusable Parameter Example....................................................................................65
12.4 Reusable Response Example......................................................................................71
13. Identity APIs...............................................................................................................75
13.1 Identity Domain Overview.........................................................................................75
13.2 Identity Endpoints......................................................................................................75
13.3 Create User Example..................................................................................................75
14. CRM APIs....................................................................................................................80
14.1 CRM Domain Overview..............................................................................................81
14.2 CRM Endpoints...........................................................................................................81
14.3 Lead Conversion Example..........................................................................................81
15. Admission APIs...........................................................................................................85
15.1 Admission Domain Overview.....................................................................................85
15.2 Admission Endpoints..................................................................................................85
15.3 Approve Application Example....................................................................................85
16. Student APIs...............................................................................................................88
16.1 Student Domain Overview.........................................................................................88
16.2 CRUD Pattern..............................................................................................................89
16.3 Student Endpoints......................................................................................................90
16.4 Student Example........................................................................................................91
17. Academics APIs...........................................................................................................94
17.1 Academics Domain Overview.....................................................................................94
17.2 Academics Endpoints.................................................................................................94
17.3 Bulk Marks Entry Example..........................................................................................95
18. Attendance APIs........................................................................................................100
18.1 Attendance Domain Overview.................................................................................100
18.2 Attendance Endpoints..............................................................................................100
18.3 Bulk Attendance Example.........................................................................................100
19. Communication APIs.................................................................................................105
3

PreOne OpenAPI Spec v1.0 | API Specification Freeze
19.1 Communication Domain Overview..........................................................................106
19.2 Communication Endpoints.......................................................................................106
19.3 Send Message Example............................................................................................106
20. Finance APIs..............................................................................................................109
20.1 Finance Domain Overview.......................................................................................110
20.2 Finance Endpoints....................................................................................................110
20.3 Create Invoice Example............................................................................................110
21. Inventory APIs..........................................................................................................114
21.1 Inventory Domain Overview....................................................................................114
21.2 Inventory Endpoints.................................................................................................115
21.3 Stock Movement Example........................................................................................115
22. HR APIs.....................................................................................................................118
22.1 HR Domain Overview...............................................................................................118
22.2 HR Endpoints............................................................................................................118
22.3 Apply Leave Example................................................................................................118
23. Administration APIs..................................................................................................121
23.1 Administration Domain Overview............................................................................121
23.2 Administration Endpoints........................................................................................121
23.3 Audit Log Query Example.........................................................................................122
24. Reports APIs.............................................................................................................126
24.1 Reports Domain Overview.......................................................................................126
24.2 Reports Endpoints....................................................................................................126
24.3 Generate Report Example........................................................................................127
25. Platform APIs............................................................................................................131
25.1 Platform Domain Overview......................................................................................131
25.2 Platform Endpoints...................................................................................................131
25.3 Register Webhook Example.....................................................................................131
26. WebSocket Documentation......................................................................................136
4

PreOne OpenAPI Spec v1.0 | API Specification Freeze
26.1 WebSocket Overview...............................................................................................136
26.2 Documented Channels.............................................................................................136
26.3 Connection Example.................................................................................................136
27. Webhooks.................................................................................................................141
27.1 Webhook Overview..................................................................................................141
27.2 Webhook Events......................................................................................................142
27.3 Webhook Payload Example......................................................................................142
28. Examples..................................................................................................................147
28.1 Per-Endpoint Example Matrix..................................................................................147
28.2 Pagination Example..................................................................................................147
28.3 Filter Example...........................................................................................................150
28.4 File Upload Example.................................................................................................151
29. Tags..........................................................................................................................154
29.1 Tag Purpose..............................................................................................................154
29.2 Tag Catalog...............................................................................................................154
29.3 Tag Definition Example............................................................................................154
30. Versioning.................................................................................................................158
30.1 Versioning Strategy..................................................................................................158
30.2 Versioning Rules.......................................................................................................159
30.3 Breaking Change Detection......................................................................................159
31. Deprecation Policy....................................................................................................161
31.1 Deprecation Lifecycle...............................................................................................161
31.2 Deprecation Stages..................................................................................................161
31.3 Deprecation Spec Example.......................................................................................161
32. SDK Generation.........................................................................................................165
32.1 SDK Targets...............................................................................................................166
32.2 SDK Targets Catalog.................................................................................................166
32.3 TypeScript SDK Example...........................................................................................166
5

PreOne OpenAPI Spec v1.0 | API Specification Freeze
33. Validation Rules........................................................................................................170
33.1 Validation Standards................................................................................................170
33.2 Validation Rules Catalog...........................................................................................171
33.3 Validation Example...................................................................................................171
34. Governance..............................................................................................................177
34.1 Governance Overview..............................................................................................178
34.2 Governance Roles.....................................................................................................178
34.3 Governance Workflow.............................................................................................178
34.4 Governance Tools.....................................................................................................178
35. Generated Deliverables.............................................................................................185
35.1 Automation Pipeline.................................................................................................185
35.2 Deliverables Catalog.................................................................................................185
35.3 Quality Gates............................................................................................................186
36. Glossary....................................................................................................................187
36.1 Terms........................................................................................................................187
37. Document Control.....................................................................................................187
37.1 Document Information.............................................................................................187
37.2 Change History.........................................................................................................187
37.3 Approval Matrix........................................................................................................188
37.4 Next Steps.................................................................................................................188
Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-
click the TOC and select "Update Field."
6

PreOne OpenAPI Spec v1.0 | API Specification Freeze
1. Introduction
1.1 Purpose
हा(cid:2) Document PreOne Enterprise API ची(cid:5) complete OpenAPI 3.1 specification प्र(cid:7)दा(cid:2)न करतो(cid:13).
PreOne हा(cid:14) Enterprise Preschool Operating System आहा(cid:14) जे(cid:14) 14 business domains, 530+ REST
endpoints, 5 WebSocket channels, आणि(cid:18) 5 webhook events expose करतो(cid:14). या(cid:2) document ची(cid:2)
primary goal म्हा(cid:18)जे(cid:14) एक canonical, machine-readable API contract स्था(cid:2)णिप्रतो कर(cid:18)(cid:14) ज्या(cid:2)वरून
Swagger UI, Postman collections, mock servers, आणि(cid:18) multi-language SDKs auto-generate
हा(cid:13)तो(cid:5)ल.
OpenAPI Specification (OAS) हा(cid:5) industry-standard format आहा (cid:14)HTTP APIs describe करण्या(cid:2)सा(cid:2)ठी(cid:5).
हा(cid:5) specification फक्तो documentation न(cid:2)हा(cid:5) — तो(cid:5) एक living contract आहा(cid:14) जे(cid:5) backend
implementation, frontend consumption, mobile integration, आणि(cid:18) third-party partner
integrations साव"न# (cid:2) bind करतो(cid:14). CI pipeline मध्या (cid:14)हा(cid:5) spec validate हा(cid:13)तो(cid:14) आणि(cid:18) प्र(cid:7)त्या(cid:14)क PR मध्या (cid:14)breaking
change detection असातो(cid:14).
या(cid:2) specification वरून प्रढी( (cid:5)ल artifacts automatically generate हा(cid:13)तो(cid:5)ल: Swagger UI (interactive
API explorer), OpenAPI YAML/JSON files, Postman Collection, Mock Server (Prism-based),
TypeScript SDK, Flutter/Dart SDK, C# SDK, Java SDK, API Test Collections (Postman +
Newman), Contract Validation suite, आणि(cid:18) client code generation 10 target languages सा(cid:2)ठी(cid:5).
1.2 Scope
हा(cid:5) specification PreOne platform च्या(cid:2) साव +public आणि(cid:18) internal APIs cover करतो(cid:14). खा(cid:2)ल(cid:5)ल explicitly
in scope आहा(cid:14)तो:
• Authentication APIs (login, OTP, refresh, logout)
• 14 business domain APIs (Identity, CRM, Admissions, Students, Academics,
Attendance, Communication, Finance, Inventory, HR, Administration, Reports,
Settings, Platform)
• WebSocket documentation for 5 real-time channels
• Webhook documentation for 5 outbound event types
• Common components (schemas, parameters, headers, responses, examples)
• Security schemes, scopes, common headers, error envelope
खा(cid:2)ल(cid:5)ल explicitly out of scope आहा(cid:14)तो:
• Internal microservice-to-microservice contracts (separate internal spec)
7

PreOne OpenAPI Spec v1.0 | API Specification Freeze
• Database schema (covered in ERD v3.0 + Prisma Schema v3.0)
• Backend implementation patterns (covered in Backend TD v1.0)
• Frontend consumption patterns (covered in Frontend Architecture v1.0)
• Infrastructure deployment (covered in DevOps runbook)
1.3 Audience
हा(cid:5) specification खा(cid:2)ल(cid:5)ल audiences सा(cid:2)ठी(cid:5) णिलणिखातो आहा(cid:14):
• Backend Engineers: Implementation reference — controllers, DTOs, validation,
error responses mirror the spec exactly.
• Frontend Engineers: API consumption patterns — types generated from spec via
openapi-typescript.
• Mobile Engineers: SDK consumption — Dart SDK auto-generated from this spec.
• Integration Partners: Third-party integration — Postman collection + SDKs derived
from this spec.
• QA Engineers: Contract testing — Postman + Newman tests generated from spec.
• Product Managers: API discovery — Swagger UI for exploring available endpoints.
• AI Code Assistants: Structured prompt input — spec provides complete contract for
code generation.
1.4 Specification Status
हा(cid:5) specification 'API Specification Freeze' status मध्या(cid:14) आहा(cid:14). Freeze म्हा(cid:18)जे(cid:14) v1.0 release सा(cid:2)ठी(cid:5)
contract lock झा(cid:2)ल(cid:2) आहा(cid:14) — क(cid:13)(cid:18)तो(cid:14)हा(cid:5) breaking changes न(cid:2)हा(cid:5), फक्तो backward-compatible
additions (MINOR bumps) आणि(cid:18) bug fixes (PATCH bumps) allowed आहा(cid:14)तो. Breaking changes
require MAJOR bump (v2.0) आणि(cid:18) 12-month deprecation cycle.
Specification freeze नतो# र क(cid:13)(cid:18)तो(cid:2)हा(cid:5) change फक्तो PR-based approval workflow through जे(cid:2)ऊन
हा(cid:13)ऊ शकतो(cid:13). PR मध्या(cid:14) automated linting (Redocly + Spectral), breaking change detection
(oasdiff), आणि(cid:18) minimum 2 reviewers ची(cid:5) sign-off आवश्याक आहा(cid:14). Breaking changes सा(cid:2)ठी(cid:5) API
Owner + API Architect दा(cid:13)घां(cid:2)ची# (cid:5) approval mandatory आहा(cid:14).
1.5 Related Documents
PreOne document series मध्या(cid:14) OpenAPI Specification ची(cid:14) specific position आहा(cid:14). खा(cid:2)ल(cid:5)ल
documents या(cid:2) spec ची (cid:14)predecessors आहा(cid:14)तो:
8

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Document | Version | Relationship to OpenAPI  |
| -------- | ------- | ------------------------ |
Spec
| Vision Document | v1.0 | Strategic intent — API non- |
| --------------- | ---- | --------------------------- |
functional requirements
(scale, security)
| Master PRD | v1.0 | Functional requirements —  |
| ---------- | ---- | -------------------------- |
every endpoint traces to a
PRD FR
| DDD | v1.0 | Domain model — API  |
| --- | ---- | ------------------- |
aggregates map to DDD
aggregates
| ERD | v3.0 | Physical schema — API  |
| --- | ---- | ---------------------- |
response fields map to ERD
entities
| API Contract Catalog | v1.0 | Endpoint inventory —  |
| -------------------- | ---- | --------------------- |
OpenAPI spec is the formal
encoding of this catalog
9

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
2. OpenAPI Standards
2.1 Specification Version
PreOne हा(cid:5) OpenAPI 3.1.0 specification व(cid:2)प्ररतो(cid:14). 3.1 हा(cid:5) latest stable version आहा(cid:14) जे(cid:5) full JSON
Schema 2020-12 compatibility  प्र(cid:7)दा(cid:2)न करतो(cid:14). 3.0  च्या(cid:2) तोल( न(cid:14)तो  3.1  मध्या(cid:14)  several important
improvements आहा(cid:14)तो: nullable fields type arrays द्वा(cid:2)र(cid:14) express क(cid:14) ल(cid:14) जे(cid:2)तो(cid:2)तो (type: [string, null]),
webhooks native support  करतो(cid:14), exclusiveMinimum/exclusiveMaximum numeric values
support करतो(cid:14), आणि(cid:18) const keyword support करतो(cid:14). हा(cid:14) साव+ PreOne च्या(cid:2) use cases सा(cid:2)ठी(cid:5) essential
आहा(cid:14)तो.
Version choice documented in ADR-001 (OpenAPI Version Selection). Decision rationale:
3.1 हा(cid:5) future-proof choice आहा(cid:14) क(cid:2)र(cid:18) tooling ecosystem (Swagger UI 5+, Redocly, OpenAPI
Generator 7+) mature झा(cid:2)ल(cid:2) आहा(cid:14). 3.0 वर र(cid:2)हा(cid:18)(cid:14) म्हा(cid:18)जे(cid:14) accepting technical debt जे(cid:14) भणिवष्या(cid:2)तो
migration costlier हा(cid:13)ईल.
2.2 Standards Compliance
PreOne ची(cid:5) specification खा(cid:2)ल(cid:5)ल standards strictly follow करतो(cid:14):
| Standard        | Value | Rationale                  |
| --------------- | ----- | -------------------------- |
| OpenAPI Version | 3.1.0 | Latest stable spec — full  |
JSON Schema 2020-12
compatibility
| Format | YAML primary + JSON export | YAML for human authoring;  |
| ------ | -------------------------- | -------------------------- |
JSON for tool consumption
| License | Apache 2.0 | Specification text copyright- |
| ------- | ---------- | ----------------------------- |
neutral; PreOne content
proprietary
Schema Dialect https://spec.openapis.org/ Base dialect allows nullable
|                     | oas/3.1/dialect/base | via type arrays             |
| ------------------- | -------------------- | --------------------------- |
| JSON Schema Version | 2020-12              | Required for OpenAPI 3.1 —  |
supports const,
exclusiveMinimum
| Encoding | UTF-8 | All strings UTF-8; BOM  |
| -------- | ----- | ----------------------- |
forbidden in YAML
Document Path /specs/openapi.yaml Monorepo path; CI validates
on every commit
10

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Standard Value Rationale
Validation Tool @redocly/cli lint Strict linting + spectral rules
for PreOne conventions
Reference Style $ref internal first Relative refs inside
components/; remote only
for shared SDK contracts
Discriminator Strategy Discriminator on type field Used in Webhook payloads +
Integration Events
2.3 File Organization
Specification ची (cid:14)organization multi-file structure मध्या (cid:14)आहा(cid:14) — single monolithic openapi.yaml
file maintain कर(cid:18) (cid:14)difficult हा(cid:13)तो(cid:14) जेसा(cid:14) spec grow करतो(cid:14). खा(cid:2)ल(cid:5)ल structure followed आहा(cid:14):
specs/
└── openapi.yaml # Root file — info, servers, security, tags, paths
(refs)
├── paths/ # Per-domain path files
│ ├── auth.yaml
│ ├── identity.yaml
│ ├── crm.yaml
│ ├── admissions.yaml
│ ├── students.yaml
│ ├── academics.yaml
│ ├── attendance.yaml
│ ├── communication.yaml
│ ├── finance.yaml
│ ├── inventory.yaml
│ ├── hr.yaml
│ ├── administration.yaml
│ ├── reports.yaml
│ └── platform.yaml
├── components/ # Reusable components
│ ├── schemas/ # Data models
│ │ ├── common/ # Pagination, Money, Error
│ │ ├── identity/ # User, Role, Permission
│ │ ├── student/ # Student, Guardian
│ │ └── ... (per domain)
│ ├── parameters/ # PageParam, SizeParam, etc.
│ ├── headers/ # X-Trace-Id, X-RateLimit-*
│ ├── responses/ # NotFound, ValidationError
│ ├── requestBodies/ # StudentCreateBody
│ ├── examples/ # Example payloads
│ ├── securitySchemes/ # BearerAuth, ApiKey
│ └── links/ # Operation links
├── webhooks/ # Webhook event payloads
11

PreOne OpenAPI Spec v1.0 | API Specification Freeze
└── websockets/ # WebSocket channel docs
2.4 Reference Strategy
$ref usage मध्या (cid:14)consistency critical आहा(cid:14). PreOne च्या(cid:2) convention प्र(cid:7)म(cid:2)(cid:18):(cid:14)
• Internal refs: $ref: '#/components/schemas/Student' — root-relative
• File refs: $ref: './components/schemas/student/Student.yaml' — relative to current
file
• Remote refs: Discouraged — bundle at build time if external schema needed
• Circular refs: Allowed in components but resolved by Swagger UI at render time
• Naming: PascalCase for schemas, camelCase for fields, kebab-case for paths
12

PreOne OpenAPI Spec v1.0 | API Specification Freeze
3. API Information
3.1 info Object
info object हा(cid:2) OpenAPI spec ची(cid:2) first section आहा (cid:14)जे(cid:13) API ची (cid:14)metadata defines करतो(cid:13). हा (cid:14)metadata
Swagger UI च्या(cid:2) header मध्या (cid:14)render हा(cid:13)तो (cid:14)आणि(cid:18) SDK generation मध्या (cid:14)package metadata बनन7 जे(cid:2)तो(cid:14).
PreOne च्या(cid:2) info object मध्या(cid:14) standard fields beyond क(cid:2)हा(cid:5) custom extensions आहा(cid:14)तो जे(cid:14) internal
tooling व(cid:2)प्ररतो(cid:14).
info:
title: PreOne Enterprise API
version: 1.0.0
description: |
Enterprise Preschool Operating System API.
Multi-tenant, multi-branch, multi-academic-year.
14 business domains, ~530 endpoints, 5 WebSocket channels, 5 webhooks.
contact:
name: PreOne API Team
email: api@preone.com
url: https://developers.preone.com
license:
name: PreOne Proprietary v1.0
url: https://www.preone.com/license
termsOfService: https://www.preone.com/terms
x-preone-status: frozen
x-preone-release-date: '2026-07-14'
x-preone-deprecation-policy: https://docs.preone.com/api/deprecation
3.2 Field Reference
Field Value Description
title PreOne Enterprise API Public title shown in Swagger
UI header
version 1.0.0 SemVer
MAJOR.MINOR.PATCH —
frozen for v1.0 release
description Enterprise Preschool Markdown supported;
Operating System API — appears under title in
multi-tenant, multi-branch, Swagger UI
multi-academic-year. 14
business domains, ~530
endpoints, 5 WebSocket
channels, 5 webhook events.
13

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Field        | Value           | Description              |
| ------------ | --------------- | ------------------------ |
| contact.name | PreOne API Team | Email-based contact for  |
support escalations
| contact.email | api@preone.com | Auto-routes to engineering  |
| ------------- | -------------- | --------------------------- |
on-call
| contact.url | https:// | Developer portal link |
| ----------- | -------- | --------------------- |
developers.preone.com
license.name PreOne Proprietary v1.0 Customer license agreement
references this identifier
| license.url | https://www.preone.com/ | License URL |
| ----------- | ----------------------- | ----------- |
license
| termsOfService | https://www.preone.com/ | Terms of service URL |
| -------------- | ----------------------- | -------------------- |
terms
externalDocs.url https://docs.preone.com/api Pointer to long-form
documentation portal
3.3 Versioning Strategy
info.version field SemVer convention follows करतो(cid:13). Initial release 1.0.0 आहा(cid:14). Backward-
compatible additions (new endpoints, new optional fields) MINOR bump trigger करतो(cid:2)तो
(1.1.0, 1.2.0...). Breaking changes MAJOR bump trigger  करतो(cid:2)तो  (2.0.0)  आणि(cid:18)  12-month
deprecation cycle सा(cid:13)बतो या(cid:14)तो(cid:2)तो. Bug fixes आणि(cid:18) documentation clarifications PATCH bump
trigger करतो(cid:2)तो (1.0.1, 1.0.2...).
Version history ची(cid:2) complete record CHANGELOG.md मध्या(cid:14) maintained आहा(cid:14) जे(cid:13) release tag
सा(cid:13)बतो auto-generate हा(cid:13)तो(cid:13). प्र(cid:7)त्याक(cid:14)  release सा(cid:13)बतो Git tag (v1.0.0, v1.1.0...) आणि(cid:18) GitHub Release
created हा(cid:13)तो(cid:13) णिजेथा(cid:14) breaking changes explicitly called out असातो(cid:2)तो.
14

PreOne OpenAPI Spec v1.0 | API Specification Freeze
4. Servers
4.1 Server Environments
PreOne ची(cid:14) 4 server environments आहा(cid:14)तो, प्र(cid:7)त्याक(cid:14) (cid:2)ची(cid:2) specific purpose आहा(cid:14). Production
environment फक्तो customer traffic handle करतो(cid:14) आणि(cid:18) strictest controls आहा(cid:14)तो. Staging
environment प्र(cid:7)(cid:13)डक्शन mirror आहा (cid:14)णिजेथा (cid:14)customer UAT आणि(cid:18) integration partner testing हा(cid:13)तो(cid:14). QA
environment internal testing सा(cid:2)ठी(cid:5) आहा(cid:14) णिजेथा(cid:14) main branch वर auto-deploy हा(cid:13)तो(cid:14). Local
environment developer machine वर ची(cid:2)लतो(cid:14).
servers:
- url: https://api.preone.com/api/v1
description: Production
variables:
tenantId:
default: default
description: Override for multi-tenant routing
- url: https://staging.preone.com/api/v1
description: Staging
- url: https://qa.preone.com/api/v1
description: QA
- url: http://localhost:3000/api/v1
description: Local
4.2 Environment Reference
URL Environment Description
https://api.preone.com/api/ Production Live customer traffic. TLS 1.3
v1 enforced. Rate-limited per
subscription tier.
https:// Staging Pre-production. Mirrors prod
staging.preone.com/api/v1 schema. Customer UAT +
integration partners.
https://qa.preone.com/api/ QA Internal QA. Auto-deployed
v1 from main branch.
http://localhost:3000/api/v1 Local Developer local. Port 3000
default NestJS port.
15

PreOne OpenAPI Spec v1.0 | API Specification Freeze
4.3 Environment Selection
Swagger UI मध्या(cid:14) environment dropdown द्वा(cid:2)र(cid:14) select क(cid:14) ल(cid:14) जे(cid:2)तो(cid:14). SDKs मध्या(cid:14) environment
configuration parameter द्वा(cid:2)र(cid:14) pass क(cid:14) ल(cid:14) जे(cid:2)तो(cid:14). Production environment सा(cid:2)ठी(cid:5) additional
safeguards आहा(cid:14)तो:
• TLS 1.3 mandatory — older TLS versions rejected
• Rate limiting per subscription tier (Free: 100 req/min, Pro: 1000 req/min,
Enterprise: custom)
• WAF (Web Application Firewall) blocks suspicious traffic
• Bot detection via Cloudflare
• Geo-blocking for non-India traffic (configurable per tenant)
• Real-time monitoring + alerting on 5xx rate > 1%
16

PreOne OpenAPI Spec v1.0 | API Specification Freeze
5. Security Schemes
5.1 Supported Schemes
PreOne authentication multi-layered आहा(cid:14). Primary scheme Bearer JWT आहा(cid:14) जे(cid:13) साव+
authenticated endpoints सा(cid:2)ठी(cid:5) व(cid:2)प्ररल(cid:2) जे(cid:2)तो(cid:13). Future-ready schemes म्हा(cid:18)न7 OAuth2 (third-party
partner integrations सा(cid:2)ठी(cid:5)), API Keys (Platform Admin आणि(cid:18) webhook signing सा(cid:2)ठी(cid:5)), आणि(cid:18) SSO
(enterprise customers सा(cid:2)ठी(cid:5) IdP integration) defined आहा(cid:14)तो. v1.0 release मध्या (cid:14)फक्तो Bearer JWT
आणि(cid:18) API Key active आहा(cid:14)तो; OAuth2 आणि(cid:18) SSO v1.1/v1.2 मध्या (cid:14)ship हा(cid:13)तो(cid:5)ल.
securitySchemes:
BearerAuth:
type: http
scheme: bearer
bearerFormat: JWT
description: |
RS256-signed JWT. Obtain via POST /auth/login.
Access token TTL: 15 minutes. Refresh token TTL: 30 days.
Multi-tenant claims: tid (tenant), bid (branch), ayid (academic year),
uid (user), scopes (array of permission strings).
ApiKey:
type: apiKey
in: header
name: X-Api-Key
description: |
Platform Admin + webhook signing. Per-tenant key with scoped
permissions.
Rotated quarterly. Managed via POST /platform/api-keys.
OAuth2:
type: oauth2
description: Future-ready (v1.1). Partner platform integrations.
flows:
authorizationCode:
authorizationUrl: https://api.preone.com/oauth/authorize
tokenUrl: https://api.preone.com/oauth/token
scopes:
read: Read access
write: Write access
admin: Administrative access
clientCredentials:
tokenUrl: https://api.preone.com/oauth/token
scopes:
read: Read access
write: Write access
17

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
5.2 Scheme Reference
| Scheme | Type | Flow / Format | Applicable  | Notes |
| ------ | ---- | ------------- | ----------- | ----- |
Endpoints
| BearerAuth | http | bearer / JWT | All            | RS256-signed   |
| ---------- | ---- | ------------ | -------------- | -------------- |
|            |      |              | authenticated  | JWT, 15 min    |
|            |      |              | endpoints      | access + 30 d  |
refresh rotation.
Multi-tenant
claims: tid, bid,
ayid, uid,
scopes.
OAuth2 (Future) oauth2 authorizationCo Partner  Roadmap v1.1
|     |     | de +             | platform     | — third-party  |
| --- | --- | ---------------- | ------------ | -------------- |
|     |     | clientCredential | integrations | app            |
|     |     | s                |              | marketplace.   |
PKCE
mandatory for
SPA clients.
ApiKey  apiKey header: X-Api- Platform Admin  Per-tenant key
| (Platform) |     | Key | + Partner  | with scoped   |
| ---------- | --- | --- | ---------- | ------------- |
|            |     |     | webhooks   | permissions;  |
|            |     |     | signing    | rotated       |
quarterly.
| SSO (Future) | oauth2 | authorizationCo | Enterprise      | SAML/OIDC     |
| ------------ | ------ | --------------- | --------------- | ------------- |
|              |        | de              | customers with  | bridge.       |
|              |        |                 | IdP             | Roadmap v1.2  |
— Microsoft
Entra, Okta,
Google
Workspace.
5.3 Future-Ready Authentication
OAuth2 आणि(cid:18) SSO हा(cid:14) v1.0 spec मध्या (cid:14)documented आहा(cid:14)तो प्र(cid:18) implementation v1.1/v1.2 मध्या (cid:14)ship
हा(cid:13)ईल. Spec मध्या (cid:14)आधी(cid:5)ची define कर(cid:18) (cid:14)म्हा(cid:18)जे (cid:14)SDK consumers आणि(cid:18) integration partners या(cid:2)न# (cid:2) future
roadmap  णिदासातो(cid:14) आणि(cid:18) त्या(cid:2)न# (cid:5) आप्रल(cid:5)  architecture accordingly plan  करू शकतो(cid:14). OAuth2
implementation सा(cid:2)ठी(cid:5) PKCE mandatory र(cid:2)हा(cid:5)ल SPA clients सा(cid:2)ठी(cid:5); client credentials flow server-
to-server integrations सा(cid:2)ठी(cid:5) व(cid:2)प्ररल(cid:2) जे(cid:2)ईल.
18

PreOne OpenAPI Spec v1.0 | API Specification Freeze
6. Authentication APIs
6.1 Login Flow
PreOne ची(cid:2) authentication flow mobile + OTP based आहा(cid:14) — username/password
combination न(cid:2)हा(cid:5). हा(cid:2) design decision ADR-002 (Mobile OTP Authentication) मध्या (cid:14)
documented आहा(cid:14). Rationale: preschool parents आणि(cid:18) teachers या(cid:2)च्# या(cid:2)सा(cid:2)ठी(cid:5) password
management burden कम(cid:5) कर(cid:18),(cid:14) OTP via SMS/WhatsApp ubiquitous आहा(cid:14), आणि(cid:18) security strong
आहा(cid:14) क(cid:2)र(cid:18) OTP short-lived असातो(cid:13) आणि(cid:18) every login attempt logged असातो(cid:13).
Login flow दा(cid:13)न steps मध्या (cid:14)आहा(cid:14): (1) POST /auth/otp/send with mobile number — backend OTP
generate करतो(cid:13) आणि(cid:18) SMS/WhatsApp प्र(cid:2)ठीवतो(cid:13), rate-limited per mobile (60s cooldown). (2)
POST /auth/login with mobile + otp — backend OTP verify करतो(cid:13) आणि(cid:18) successful verification
वर access + refresh tokens issue करतो(cid:13). Step-up verification सा(cid:2)ठी(cid:5) POST /auth/otp/verify व(cid:2)प्ररल (cid:14)
जे(cid:2)तो(cid:14) णिजेथा (cid:14)फक्तो OTP verify हा(cid:13)तो(cid:13) प्र(cid:18) tokens issue हा(cid:13)तो न(cid:2)हा(cid:5)तो.
6.2 Login Endpoint
POST /auth/login
Request Body:
{
"mobile": "9876543210",
"otp": "123456"
}
Response 200:
{
"accessToken": "eyJhbGciOi...",
"refreshToken": "eyJhbGciOi...",
"expiresIn": 3600,
"tokenType": "Bearer",
"user": {
"id": "usr_01HXY...",
"name": "Aarav Sharma",
"mobile": "9876543210",
"roles": ["teacher"],
"permissions": ["student:read", "attendance:write"],
"activeBranch": {
"id": "br_01HXY...",
"name": "Sunshine Kids - Pune"
},
"activeTenant": {
"id": "ten_01HXY...",
"name": "Sunshine Kids Group"
}
19

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
  }
}

Response 401:
{
  "success": false,
  "error": {
    "code": "INVALID_OTP",
    "message": "Invalid or expired OTP"
  },
  "traceId": "abc-123-def-456"
}
6.3 Authentication Endpoints
| Method | Path | Summary | Description | Status Codes |
| ------ | ---- | ------- | ----------- | ------------ |
POST /auth/login Mobile + OTP  Initiates OTP,  200, 400, 401,
|     |     | login | returns  | 429 |
| --- | --- | ----- | -------- | --- |
access+refresh
on success
POST /auth/otp/send Send OTP via  Rate-limited per  200, 400, 429
|     |     | SMS/WhatsApp | mobile (60s  |     |
| --- | --- | ------------ | ------------ | --- |
cooldown)
POST /auth/otp/verify Verify OTP  Used for step- 200, 400, 401
|     |     | without login | up verification  |     |
| --- | --- | ------------- | ---------------- | --- |
on sensitive
actions
POST /auth/refresh Refresh access  Rotates refresh  200, 401, 403
|     |     | token | token,  |     |
| --- | --- | ----- | ------- | --- |
invalidates old
| POST | /auth/logout | Logout (revoke  | Both access +  | 200, 401 |
| ---- | ------------ | --------------- | -------------- | -------- |
|      |              | tokens)         | refresh        |          |
blacklisted;
Redis TTL
| GET | /auth/me | Current user  | Returns user +  | 200, 401 |
| --- | -------- | ------------- | --------------- | -------- |
|     |          | profile       | roles +         |          |
permissions +
active branch
20

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Method | Path          | Summary        | Description   | Status Codes  |
| ------ | ------------- | -------------- | ------------- | ------------- |
| POST   | /auth/branch/ | Switch active  | Issues new    | 200, 401, 403 |
|        | switch        | branch         | access token  |               |
with new bid
claim
| POST | /auth/        | Password reset  | Emails reset link  | 200, 400 |
| ---- | ------------- | --------------- | ------------------ | -------- |
|      | password/     | link            | with signed        |          |
|      | reset/request |                 | token (15 min      |          |
TTL)
| POST | /auth/        | Confirm        | Validates token  | 200, 400, 401 |
| ---- | ------------- | -------------- | ---------------- | ------------- |
|      | password/     | password reset | + sets new       |               |
|      | reset/confirm |                | password         |               |
6.4 Token Lifecycle
Access tokens 15 minutes TTL सा(cid:13)बतो short-lived आहा(cid:14)तो. Refresh tokens 30 days TTL सा(cid:13)बतो long-
lived आहा(cid:14)तो आणि(cid:18) rotation सा(cid:13)बतो या(cid:14)तो(cid:2)तो — प्र(cid:7)त्याक(cid:14)
 /auth/refresh call नव(cid:5)न access + refresh token
issue करतो(cid:13) आणि(cid:18) old refresh token blacklist हा(cid:13)तो(cid:13). हा(cid:2) rotation strategy refresh token theft
attack प्र(cid:2)सान7  protection दातो(cid:14) (cid:14). Logout क(cid:14) ल्या(cid:2)वर दा(cid:13)न्हा(cid:5) tokens Redis-backed blacklist मध्या(cid:14) added
हा(cid:13)तो(cid:2)तो.
•  Access Token TTL: 15 minutes (900 seconds)
•  Refresh Token TTL: 30 days (2,592,000 seconds)
•  Refresh Token Rotation: mandatory — old token invalidated on each refresh
•  Blacklist: Redis with TTL matching token expiry
•  Signing Algorithm: RS256 (asymmetric, public key distributed via JWKS endpoint)
•  JWKS Endpoint: GET /.well-known/jwks.json (cached for 1 hour)
21

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
7. Authorization
7.1 Scope-Based Access Control
PreOne authorization scope-based access control (SBack) व(cid:2)प्ररतो(cid:14) जे(cid:13)  RBAC (Role-Based
Access Control) च्या(cid:2) वर extends हा(cid:13)तो(cid:13). Each permission एक granular scope string आहा (cid:14)जे(cid:13) format
<domain>:<action> follow करतो(cid:13) — उदा(cid:2). student:read, finance:write, platform:admin. Roles
(admin, teacher, accountant, counselor) या(cid:2) scopes च्या(cid:2) collections आहा(cid:14)तो ज्या(cid:2)न# (cid:2) tenant admin
customize करू शकतो(cid:13) प्र(cid:18) base scope catalog fixed आहा(cid:14).
Scopes JWT मध्या (cid:14)'scopes' claim द्वा(cid:2)र(cid:14) carried असातो(cid:2)तो — array of strings. Backend each request
वर  scope   check  करतो(cid:13)  via   @RequireScopes   decorator.   Frontend   <Can
permission="student:write"> component  द्वा(cid:2)र(cid:14)  UI elements hide/show  करतो(cid:14).  हा(cid:2)  dual
enforcement (server + client) defense-in-depth प्र(cid:7)दा(cid:2)न करतो(cid:13) — client-side checks UX सा(cid:2)ठी(cid:5),
server-side checks security सा(cid:2)ठी(cid:5).
7.2 Scope Catalog
| Scope         | Description         | Notes                      |
| ------------- | ------------------- | -------------------------- |
| identity:read | Read users, roles,  | Branch-scoped read; cross- |
|               | permissions         | branch requires platform   |
scope
identity:write Create/update users, assign  Audit logged; requires
|     | roles | branch admin or higher |
| --- | ----- | ---------------------- |
admissions:read Read admission applications Branch-scoped; counselor
sees only assigned leads
admissions:write Create/update admission  Counselor + branch admin
applications
finance:read Read invoices, payments,  Branch-scoped; accountant
|     | receipts | role |
| --- | -------- | ---- |
finance:write Create invoices, record  Accountant + branch admin;
|     | payments, refund | refund requires admin |
| --- | ---------------- | --------------------- |
student:read Read student records Branch-scoped; teacher sees
only own class students
student:write Create/update student  Branch admin; teacher can
|     | records | update attendance only |
| --- | ------- | ---------------------- |
22

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Scope Description Notes
platform:read Platform-level read across Platform admin only —
tenants superuser scope
platform:write Platform-level write (tenant Platform admin only
config, billing)
7.3 Authorization Flow
1. Client sends request with Authorization: Bearer <JWT>
2. Backend extracts JWT, verifies signature via JWKS
3. Backend extracts scopes claim from JWT
4. Backend checks if required scope present:
- Route handler decorated with @RequireScopes('student:write')
- If scope missing -> 403 FORBIDDEN
5. Backend checks tenant/branch consistency:
- JWT tid vs X-Tenant-Id header -> mismatch = 403 TENANT_MISMATCH
- JWT bid vs X-Branch-Id header -> mismatch = 403 BRANCH_MISMATCH
6. Backend checks ownership (resource tenant/branch = JWT tenant/branch)
- Cross-tenant access = 404 NOT_FOUND (info leak prevention)
7. Backend executes handler, logs audit entry
Authorization Header Format:
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
Decoded JWT Payload:
{
"sub": "usr_01HXY...",
"tid": "ten_01HXY...",
"bid": "br_01HXY...",
"ayid": "ay_01HXY...",
"scopes": ["student:read", "attendance:write"],
"iat": 1736832000,
"exp": 1736832900
}
23

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
8. Common Headers
8.1 Multi-Tenant Header Standards
PreOne multi-tenant, multi-branch, multi-academic-year system आहा(cid:14). हा(cid:14)ची context every API
request सा(cid:13)बतो carry हा(cid:13)(cid:18)(cid:14) आवश्याक आहा(cid:14). Standard headers द्वा(cid:2)र(cid:14) हा(cid:14) context propagate हा(cid:13)तो(cid:14) — या(cid:2)ल(cid:2)
'Multi-Tenant Header Standards' म्हा(cid:18)तो(cid:2)तो. हा(cid:14) headers API Contract Catalog v1.0 च्या(cid:2) Multi-
Tenant Strategy section श(cid:5) प्र(cid:18)7 +प्र(cid:18) (cid:14)aligned आहा(cid:14)तो. JWT claims (tid, bid, ayid) आणि(cid:18) headers दा(cid:13)न्हा(cid:5)
मध्या (cid:14)same context असा(cid:18) (cid:14)mandatory आहा(cid:14) — mismatch = 403 error.
Backend मध्या(cid:14) TenantContext middleware हा(cid:14) headers parse करून AsyncLocalStorage मध्या (cid:14)
store करतो(cid:14). या(cid:2)मळे( (cid:14) downstream services (repositories, services) ल(cid:2) explicit parameter passing
न करतो(cid:2) context available हा(cid:13)तो(cid:13). Logging, audit trails, आणि(cid:18) database queries साव+ या(cid:2) context
व(cid:2)प्ररतो(cid:2)तो automatically.
8.2 Header Reference
| Header | Type | Required | Default /  | Description |
| ------ | ---- | -------- | ---------- | ----------- |
Source
| Authorization | string (JWT) | Required | Bearer <JWT> | All  |
| ------------- | ------------ | -------- | ------------ | ---- |
authenticated
endpoints
| X-Tenant-Id | UUID | Required | tid claim       | All multi-tenant  |
| ----------- | ---- | -------- | --------------- | ----------------- |
|             |      |          | extracted from  | endpoints         |
JWT
| X-Branch-Id | UUID | Required | bid claim —       | Branch-scoped  |
| ----------- | ---- | -------- | ----------------- | -------------- |
|             |      |          | currently active  | endpoints      |
branch
X-Academic- string (2025- Optional ayid — defaults  Academic Year-
| Year       | 2026)          |          | to current    | scoped         |
| ---------- | -------------- | -------- | ------------- | -------------- |
|            |                |          | academic year | endpoints      |
| X-Timezone | string         | Optional | Defaults to   | Date/time      |
|            | (Asia/Kolkata) |          | tenant        | interpretation |
timezone
Accept- string (en, mr,  Optional Defaults to  Localization of
| Language | hi) |     | tenant default  | error messages |
| -------- | --- | --- | --------------- | -------------- |
language
24

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Header Type Required Default / Description
Source
X-Trace-Id UUID Optional Generated Distributed
client-side; tracing
propagated to correlation
logs
X-Idempotency- UUID Optional Required on Idempotent
Key POST/PATCH for retries
write safety
Content-Type application/json Required UTF-8 encoded All POST/PATCH
with body
Accept application/json Required UTF-8 encoded All endpoints
8.3 Header Examples
# Full authenticated request
GET /students/stu_01HXY... HTTP/1.1
Host: api.preone.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
X-Tenant-Id: ten_01HXY...
X-Branch-Id: br_01HXY...
X-Academic-Year: 2025-2026
X-Timezone: Asia/Kolkata
Accept-Language: mr
X-Trace-Id: 550e8400-e29b-41d4-a716-446655440000
Accept: application/json
# Idempotent write request
POST /students HTTP/1.1
Host: api.preone.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
X-Tenant-Id: ten_01HXY...
X-Branch-Id: br_01HXY...
X-Idempotency-Key: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
Content-Type: application/json
{
"firstName": "Aarav",
"lastName": "Sharma",
"dob": "2020-05-15",
"gender": "Male"
}
25

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
9. Request Schemas
9.1 Schema Standards
Request schemas JSON Schema 2020-12 draft follow करतो(cid:2)तो जे(cid:14) OpenAPI 3.1 ची(cid:2) default
dialect आहा(cid:14). प्र(cid:7)त्याक(cid:14)  domain सा(cid:2)ठी(cid:5) request schemas components/schemas/{domain}/ folder
 organized  आहा(cid:14)तो.   Naming   convention:   {Aggregate}{Action}Request   —  उदा(cid:2).
मध्या(cid:14)
StudentCreateRequest, FeeInvoiceUpdateRequest, AdmissionApplicationApproveRequest.
Schemas type-safe आहा(cid:14)तो आणि(cid:18) TypeScript SDK मध्या (cid:14)auto-generated types बनन7  जे(cid:2)तो(cid:2)तो.
9.2 Request Patterns
| Pattern | HTTP | Body Shape | Response | Examples |
| ------- | ---- | ---------- | -------- | -------- |
CreateRequest POST /resource Required fields  Returns 201 +  student.create,
|     |     | + optional  | created  | fee.invoice.crea |
| --- | --- | ----------- | -------- | ---------------- |
|     |     | metadata    | resource | te               |
UpdateRequest PATCH  Partial update  Returns 200 +  student.update,
|     | /resource/{id} | — only changed  | updated  | fee.invoice.upd |
| --- | -------------- | --------------- | -------- | --------------- |
|     |                | fields          | resource | ate             |
SearchRequest GET /resource? Query params +  Returns 200 +  student.search,
|     | q=&filter=&sort | pagination | paginated list | fee.invoice.list |
| --- | --------------- | ---------- | -------------- | ---------------- |
=&page=&size=
| BulkRequest | POST           | Array of         | Returns 200 +    | attendance.mar   |
| ----------- | -------------- | ---------------- | ---------------- | ---------------- |
|             | /resource/bulk | operations (max  | per-item results | k.bulk,          |
|             |                | 100)             |                  | fee.receipt.bulk |
UploadRequest POST  multipart/form- Returns 201 +  student.photo.u
|     | /resource/uploa | data | file metadata | pload,         |
| --- | --------------- | ---- | ------------- | -------------- |
|     | d               |      |               | document.uploa |
d
ActionRequest POST  State machine  Returns 200 +  admission.appr
|     | /resource/{id}/a | transitions | updated state | ove,             |
| --- | ---------------- | ----------- | ------------- | ---------------- |
|     | ction            |             |               | fee.invoice.canc |
el
ExportRequest POST  Async export  Returns 202 +  reports.export,
|     | /resource/expor | with format +  | jobId; poll  | student.export |
| --- | --------------- | -------------- | ------------ | -------------- |
|     | t               | filter         | /jobs/{id}   |                |
26

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Pattern HTTP Body Shape Response Examples
WebhookTestRe POST Sends test Returns 200 + platform.webho
quest /webhooks/{id}/ event to delivery status ok.test
test webhook URL
9.3 StudentCreateRequest Schema
StudentCreateRequest:
type: object
required:
- firstName
- dob
- gender
properties:
firstName:
type: string
minLength: 1
maxLength: 100
description: Student's first name (legal name)
lastName:
type: string
maxLength: 100
description: Student's last name (optional)
dob:
type: string
format: date
description: Date of birth (YYYY-MM-DD)
gender:
type: string
enum: [Male, Female, Other]
admissionNo:
type: string
pattern: '^[A-Z]{3}-\\d{4}$'
description: Auto-generated if not provided
classId:
type: string
format: uuid
description: Initial class assignment
sectionId:
type: string
format: uuid
description: Initial section assignment
guardians:
type: array
maxItems: 4
items:
$ref: '#/components/schemas/GuardianCreateRequest'
address:
$ref: '#/components/schemas/AddressRequest'
27

PreOne OpenAPI Spec v1.0 | API Specification Freeze
additionalProperties: false
example:
firstName: Aarav
lastName: Sharma
dob: '2020-05-15'
gender: Male
classId: cls_01HXY...
sectionId: sec_01HXY...
guardians:
- name: Rohan Sharma
relation: Father
mobile: '9876543210'
28

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
10. Response Schemas
10.1 Response Standards
Response schemas strict typing follow करतो(cid:2)तो. प्र(cid:7)त्याक(cid:14)  endpoint ची(cid:14) response status code-
specific schema define क(cid:14) लल(cid:14) (cid:14) आहा(cid:14) — उदा(cid:2). 200 OK ची(cid:14) schema, 201 Created ची(cid:14) schema, 400
Validation Error ची(cid:14) schema साव+ separate आहा(cid:14)तो. हा(cid:14) approach SDK generation मध्या(cid:14) critical आहा(cid:14)
क(cid:2)र(cid:18)  generated clients type-narrow  करू शकतो(cid:2)तो  based on status code. PreOne  च्या(cid:2)
convention प्र(cid:7)म(cid:2)(cid:18)(cid:14) response objects envelope मध्या(cid:14) wrapped न(cid:2)हा(cid:5)तो — direct resource object
return हा(cid:13)तो(cid:13). Errors सा(cid:2)ठी(cid:5) म(cid:2)त्र standard envelope आहा(cid:14).
10.2 Response Patterns
| Pattern | Status | Body Shape | Example Endpoints |
| ------- | ------ | ---------- | ----------------- |
SingleResource 200 OK Resource object with  GET /students/{id}
id + metadata
| CreatedResource | 201 Created | Newly created  | POST /students |
| --------------- | ----------- | -------------- | -------------- |
resource with id +
createdAt
UpdatedResource 200 OK Updated resource  PATCH /students/{id}
with version +
updatedAt
| DeletedResource | 204 No Content | Empty body | DELETE  |
| --------------- | -------------- | ---------- | ------- |
/students/{id}
| CollectionResponse | 200 OK | Paginated array +  | GET /students |
| ------------------ | ------ | ------------------ | ------------- |
meta (total, page,
size, hasNext)
| AcceptedJob | 202 Accepted |  jobId +          | POST             |
| ----------- | ------------ | ----------------- | ---------------- |
|             |              | status=pending +  | /students/export |
estimated
completion
| BulkResponse | 200 OK | Array of per-item  | POST             |
| ------------ | ------ | ------------------ | ---------------- |
|              |        | results            | /attendance/bulk |
(success/failure +
error)
29

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Pattern Status Body Shape Example Endpoints
HealthCheck 200 OK status + uptime + GET /health
version +
dependency status
10.3 StudentResponse Schema
StudentResponse:
type: object
properties:
id:
type: string
format: uuid
example: stu_01HXY...
admissionNo:
type: string
example: SKP-0001
firstName:
type: string
example: Aarav
lastName:
type: string
example: Sharma
dob:
type: string
format: date
example: '2020-05-15'
gender:
type: string
enum: [Male, Female, Other]
class:
$ref: '#/components/schemas/ClassReference'
section:
$ref: '#/components/schemas/SectionReference'
guardians:
type: array
items:
$ref: '#/components/schemas/GuardianResponse'
status:
type: string
enum: [Active, Inactive, Graduated, Transferred]
createdAt:
type: string
format: date-time
updatedAt:
type: string
format: date-time
version:
type: integer
30

PreOne OpenAPI Spec v1.0 | API Specification Freeze
description: Optimistic locking version
required: [id, admissionNo, firstName, dob, gender, status, createdAt,
updatedAt, version]
10.4 Pagination Response
List endpoints standard pagination response return करतो(cid:2)तो. Page-based pagination default
आहा(cid:14) (page + size); cursor-based pagination available आहा(cid:14) very large datasets सा(cid:2)ठी(cid:5) via ?
cursor= parameter. Page size maximum 100 आहा(cid:14) — larger requests rejected with
VALIDATION_ERROR.
PaginatedStudents:
type: object
properties:
data:
type: array
items:
$ref: '#/components/schemas/StudentResponse'
meta:
type: object
properties:
page:
type: integer
minimum: 1
size:
type: integer
minimum: 1
maximum: 100
total:
type: integer
minimum: 0
totalPages:
type: integer
minimum: 0
hasNext:
type: boolean
hasPrev:
type: boolean
required: [page, size, total, totalPages, hasNext, hasPrev]
required: [data, meta]
example:
data:
- id: stu_01HXY...
admissionNo: SKP-0001
firstName: Aarav
lastName: Sharma
meta:
page: 2
size: 20
total: 145
31

PreOne OpenAPI Spec v1.0 | API Specification Freeze
totalPages: 8
hasNext: true
hasPrev: true
32

PreOne OpenAPI Spec v1.0 | API Specification Freeze
11. Error Schemas
11.1 Standard Error Envelope
Errors सा(cid:2)ठी(cid:5) एक standard envelope आहा(cid:14) जे(cid:14) साव+ endpoints सा(cid:2)ठी(cid:5) consistent आहा(cid:14). हा(cid:2) envelope
success responses प्र(cid:2)सान7 completely different structure मध्या(cid:14) असातो(cid:13) — client SDKs type-
narrow करू शकतो(cid:2)तो 'success' boolean field द्वा(cid:2)र(cid:14). Error envelope मध्या(cid:14) three primary
components आहा(cid:14)तो: success (always false), error (object with code + message + optional
field-level details), आणि(cid:18) traceId (for support correlation).
Error:
type: object
properties:
success:
type: boolean
enum: [false]
error:
type: object
properties:
code:
type: string
description: Machine-readable error code
example: STUDENT_NOT_FOUND
message:
type: string
description: Human-readable error message
example: Student not found
details:
type: array
description: Field-level validation errors (only for 400)
items:
type: object
properties:
field:
type: string
example: firstName
message:
type: string
example: firstName is required
code:
type: string
example: REQUIRED_FIELD_MISSING
required: [code, message]
traceId:
type: string
format: uuid
description: Correlation ID for support tickets
example: 550e8400-e29b-41d4-a716-446655440000
33

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
  required: [success, error, traceId]

Example Error Response:
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student not found"
  },
  "traceId": "abc123"
}
11.2 Common Status Codes
| HTTP | Meaning | When Used                 |
| ---- | ------- | ------------------------- |
| 200  | Success | Standard successful GET,  |
PATCH
| 201 | Created | Successful POST creating new  |
| --- | ------- | ----------------------------- |
resource
| 202 | Accepted | Async job accepted (export,  |
| --- | -------- | ---------------------------- |
bulk operation)
| 204 | No Content | Successful DELETE, no body  |
| --- | ---------- | --------------------------- |
to return
| 400 | Validation Error | Request body/params failed  |
| --- | ---------------- | --------------------------- |
schema validation
| 401 | Unauthorized | Missing/expired JWT    |
| --- | ------------ | ---------------------- |
| 403 | Forbidden    | Insufficient scope or  |
tenant/branch mismatch
| 404 | Not Found | Resource does not exist or  |
| --- | --------- | --------------------------- |
not in tenant scope
| 409 | Conflict | Duplicate resource or version  |
| --- | -------- | ------------------------------ |
conflict
| 422 | Business Rule Violation | Domain invariant violated  |
| --- | ----------------------- | -------------------------- |
(e.g., student already
admitted)
| 429 | Rate Limited | Too many requests; Retry- |
| --- | ------------ | ------------------------- |
After header returned
34

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| HTTP | Meaning               |     | When Used                |
| ---- | --------------------- | --- | ------------------------ |
| 500  | Internal Server Error |     | Unhandled server error;  |
logged with traceId
| 503 | Service Unavailable |     | Downstream dependency  |
| --- | ------------------- | --- | ---------------------- |
failure
11.3 Error Code Catalog
| HTTP | Code | Description | Notes |
| ---- | ---- | ----------- | ----- |
400 VALIDATION_ERROR Request body failed  Returns field-level
|     |                  | schema validation    | errors array        |
| --- | ---------------- | -------------------- | ------------------- |
| 400 | INVALID_QUERY_PA | Query parameter      | Returns param +     |
|     | RAM              | invalid              | reason              |
| 401 | UNAUTHENTICATED  | Missing or invalid   | Client should re-   |
|     |                  | JWT                  | authenticate        |
| 401 | TOKEN_EXPIRED    | Access token expired | Client should call  |
/auth/refresh
| 403 | FORBIDDEN | Insufficient  | User authenticated   |
| --- | --------- | ------------- | -------------------- |
|     |           | scope/role    | but lacks permission |
403 TENANT_MISMATCH Header tid ≠ JWT tid Cross-tenant access
attempt
| 404 | NOT_FOUND | Resource not found | Resource id does not  |
| --- | --------- | ------------------ | --------------------- |
exist or tenant-
scoped
| 404 | ROUTE_NOT_FOUND | Endpoint not found | Path doesn't match  |
| --- | --------------- | ------------------ | ------------------- |
any route
| 409 | CONFLICT | State conflict | E.g., duplicate  |
| --- | -------- | -------------- | ---------------- |
admission number,
version mismatch
409 VERSION_MISMATC Optimistic lock failed Resource updated by
|     | H   |     | another transaction |
| --- | --- | --- | ------------------- |
422 BUSINESS_RULE_VIO Domain invariant  E.g., student already
|     | LATION | violated | admitted, invoice  |
| --- | ------ | -------- | ------------------ |
already paid
35

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| HTTP | Code              | Description       | Notes                 |
| ---- | ----------------- | ----------------- | --------------------- |
| 429  | RATE_LIMIT_EXCEED | Too many requests | Returns Retry-After   |
|      | ED                |                   | header                |
| 500  | INTERNAL_ERROR    | Unhandled server  | Logged with traceId;  |
|      |                   | error             | user sees generic     |
message
| 503 | SERVICE_UNAVAILAB | Downstream         | E.g., DB, Redis, SMS  |
| --- | ----------------- | ------------------ | --------------------- |
|     | LE                | dependency failure | gateway down          |
36

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
12. Common Components
12.1 Components Overview
OpenAPI components/ section हा(cid:2) reusability क(cid:2) क(cid:14)#दा ? आहा(cid:14). Common schemas, parameters,
headers, responses, examples, आणि(cid:18) security schemes साव+ याथा(cid:14)  (cid:14)defined आहा(cid:14)तो जे (cid:14)$ref द्वा(cid:2)र (cid:14)across
multiple paths reused हा(cid:13)तो(cid:2)तो. हा (cid:14)approach spec ची (cid:14)size कम(cid:5) करतो(cid:14), consistency साणि(नणिश्चीतो करतो(cid:14), आणि(cid:18)
maintenance सा(cid:13)प्र(cid:5) करतो(cid:14) — एक change क(cid:14) ल्या(cid:2)वर साव+ consumers automatic update दाखा(cid:14) (cid:2)ल(cid:5) यातो(cid:14) (cid:2)तो.
PreOne च्या(cid:2) components/ मध्या(cid:14) 9 sub-folders आहा(cid:14)तो: schemas (data models), parameters
(reusable path/query/header params), headers (response headers), responses (reusable
response objects), requestBodies (reusable request payloads), securitySchemes (auth
schemes), examples (example payloads), links (operation links), आणि(cid:18) callbacks (webhook
contracts). प्र(cid:7)त्याक(cid:14)  sub-folder per-domain organized आहा(cid:14) णिजेथा(cid:14) applicable.
12.2 Component Reference
| Folder | Purpose | Examples | Usage |
| ------ | ------- | -------- | ----- |
schemas/ Reusable data  Student, Guardian,  Referenced by $ref:
|             | models             | Address, Money,   | '#/components/sche   |
| ----------- | ------------------ | ----------------- | -------------------- |
|             |                    | Pagination, Error | mas/Student'         |
| parameters/ | Reusable           | PageParam,        | Referenced by $ref:  |
|             | path/query/header  | SizeParam,        | '#/components/para   |
|             | parameters         | SortParam,        | meters/PageParam'    |
TenantIdHeader
headers/ Reusable response  X-Trace-Id, X- Referenced by $ref:
|     | headers | RateLimit-Limit, X- | '#/components/head |
| --- | ------- | ------------------- | ------------------ |
|     |         | RateLimit-Remaining | ers/XTraceId'      |
responses/ Reusable response  NotFound,  Referenced by $ref:
|     | objects | ValidationError,  | '#/components/resp |
| --- | ------- | ----------------- | ------------------ |
|     |         | Unauthorized,     | onses/NotFound'    |
Forbidden
requestBodies/ Reusable request  StudentCreateBody,  Referenced by $ref:
|     | bodies | BulkAttendanceBody | '#/components/requ |
| --- | ------ | ------------------ | ------------------ |
estBodies/StudentCr
eateBody'
37

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Folder Purpose Examples Usage
securitySchemes/ Auth schemes BearerAuth, ApiKey Referenced at
operation or root
level
examples/ Reusable example StudentCreateExamp Referenced by $ref:
payloads le, '#/components/exa
ValidationErrorExam mples/StudentCreat
ple eExample'
links/ Operation links CreateStudent → Enables Swagger UI
GetStudentById link 'try it out' chaining
callbacks/ Webhook callbacks StudentAdmitted Referenced in
webhook contract operation callbacks
12.3 Reusable Parameter Example
components:
parameters:
PageParam:
name: page
in: query
description: Page number (1-indexed)
required: false
schema:
type: integer
minimum: 1
default: 1
SizeParam:
name: size
in: query
description: Page size (max 100)
required: false
schema:
type: integer
minimum: 1
maximum: 100
default: 20
SortParam:
name: sort
in: query
description: |
Sort fields. Prefix with - for descending.
Example: -createdAt,firstName
required: false
schema:
type: string
pattern: '^-?[a-zA-Z]+(,-?[a-zA-Z]+)*$'
38

PreOne OpenAPI Spec v1.0 | API Specification Freeze
TenantIdHeader:
name: X-Tenant-Id
in: header
required: true
schema:
type: string
format: uuid
# Usage in path:
/students:
get:
parameters:
- $ref: '#/components/parameters/PageParam'
- $ref: '#/components/parameters/SizeParam'
- $ref: '#/components/parameters/SortParam'
- $ref: '#/components/parameters/TenantIdHeader'
12.4 Reusable Response Example
components:
responses:
NotFound:
description: Resource not found
content:
application/json:
schema:
$ref: '#/components/schemas/Error'
example:
success: false
error:
code: NOT_FOUND
message: Resource not found
traceId: 550e8400-e29b-41d4-a716-446655440000
ValidationError:
description: Request validation failed
content:
application/json:
schema:
$ref: '#/components/schemas/Error'
example:
success: false
error:
code: VALIDATION_ERROR
message: Request validation failed
details:
- field: firstName
message: firstName is required
code: REQUIRED_FIELD_MISSING
traceId: 550e8400-e29b-41d4-a716-446655440000
39

PreOne OpenAPI Spec v1.0 | API Specification Freeze
40

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
13. Identity APIs
13.1 Identity Domain Overview
Identity domain हा(cid:2) PreOne ची(cid:2) foundational domain आहा(cid:14) जे(cid:13) users, roles, permissions, आणि(cid:18)
session management handle करतो(cid:13). हा(cid:2) domain साव+ other domains ची(cid:2) prerequisite आहा(cid:14) —
क(cid:13)(cid:18)तो(cid:2)हा(cid:5) authenticated API call Identity domain द्वा(cid:2)र(cid:14) issued JWT न(cid:14) यातो(cid:14) (cid:13). Identity endpoints
'Identity' tag अ#तोर्ग+तो grouped आहा(cid:14)तो आणि(cid:18) /identity/ prefix व(cid:2)प्ररतो(cid:2)तो.
Identity domain ची(cid:14) key aggregates: User (root aggregate with credentials + profile + roles),
Role (collection of permissions), Permission (granular scope string), Session (active JWT
sessions). Role-Permission association many-to-many आहा(cid:14); User-Role association many-to-
many per-branch आहा(cid:14) (user एक(cid:2) branch मध्या (cid:14)teacher, दासा( ऱ्या(cid:2) branch मध्या (cid:14)admin असा 7शकतो(cid:13)).
13.2 Identity Endpoints
| Method | Path | Summary | Required Scope | Status Codes |
| ------ | ---- | ------- | -------------- | ------------ |
POST /identity/users Create user  identity:write 201, 400, 409
(admin/teacher
/staff)
| GET | /identity/users | List users with  | identity:read | 200, 400 |
| --- | --------------- | ---------------- | ------------- | -------- |
pagination
| GET | /identity/ | Get user by id | identity:read | 200, 404 |
| --- | ---------- | -------------- | ------------- | -------- |
users/{id}
| PATCH | /identity/ | Update user | identity:write | 200, 404, 409 |
| ----- | ---------- | ----------- | -------------- | ------------- |
users/{id}
| DELETE | /identity/ | Soft-delete user | identity:write | 204, 404 |
| ------ | ---------- | ---------------- | -------------- | -------- |
users/{id}
POST /identity/roles Create role identity:write 201, 400, 409
| GET  | /identity/roles | List roles     | identity:read  | 200           |
| ---- | --------------- | -------------- | -------------- | ------------- |
| POST | /identity/      | Create custom  | identity:write | 201, 400, 409 |
|      | permissions     | permission     |                |               |
POST /identity/ Assign roles to  identity:write 200, 404, 409
|      | users/{id}/roles | user         |                |          |
| ---- | ---------------- | ------------ | -------------- | -------- |
| POST | /identity/       | Revoke user  | identity:write | 200, 404 |
|      | sessions/revoke  | sessions     |                |          |
41

PreOne OpenAPI Spec v1.0 | API Specification Freeze
13.3 Create User Example
POST /identity/users
Request:
{
"name": "Aarav Sharma",
"mobile": "9876543210",
"email": "aarav@example.com",
"roles": ["teacher"],
"branchId": "br_01HXY..."
}
Response 201:
{
"id": "usr_01HXY...",
"name": "Aarav Sharma",
"mobile": "9876543210",
"email": "aarav@example.com",
"roles": [
{
"id": "rol_teacher",
"name": "Teacher",
"scopes": ["student:read", "attendance:write"]
}
],
"branchId": "br_01HXY...",
"status": "Active",
"createdAt": "2026-07-14T10:30:00Z"
}
Response 409 (CONFLICT):
{
"success": false,
"error": {
"code": "USER_ALREADY_EXISTS",
"message": "User with this mobile number already exists"
},
"traceId": "abc-123"
}
42

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
14. CRM APIs
14.1 CRM Domain Overview
CRM (Customer Relationship Management) domain हा(cid:2) admissions funnel ची(cid:2) top portion
handle करतो(cid:13). Leads capture, follow-ups, campaigns, आणि(cid:18) lead-to-application conversion या(cid:2)
साव+ workflows याथा(cid:14) न7  सारू(  हा(cid:13)तो(cid:2)तो. CRM endpoints 'CRM' tag अ#तोर्ग+तो grouped आहा(cid:14)तो आणि(cid:18) /crm/
prefix व(cid:2)प्ररतो(cid:2)तो. Key aggregates: Lead (with status state machine), Campaign (lead source
attribution), FollowUp (interaction history).
Lead status state machine: New → Contacted → Interested → Visit Scheduled →
Application Submitted → Won/Lost. हा(cid:14) transitions server-side enforced आहा(cid:14)तो — invalid
transitions   422   BUSINESS_RULE_VIOLATION   return  करतो(cid:2)तो.   Lead   conversion
(/crm/leads/{id}/convert)  हा(cid:2)  critical   endpoint  आहा(cid:14)   जे(cid:13)  Lead   aggregate  ल(cid:2)
AdmissionApplication aggregate मध्या (cid:14)transform करतो(cid:13) आणि(cid:18) cross-domain event publish करतो(cid:13).
14.2 CRM Endpoints
| Method | Path       | Summary          | Required Scope | Status Codes |
| ------ | ---------- | ---------------- | -------------- | ------------ |
| POST   | /crm/leads | Create lead      | crm:write      | 201, 400     |
| GET    | /crm/leads | List leads with  | crm:read       | 200, 400     |
filters
| GET    | /crm/leads/{id} | Get lead details | crm:read  | 200, 404      |
| ------ | --------------- | ---------------- | --------- | ------------- |
| PATCH  | /crm/leads/{id} | Update lead      | crm:write | 200, 404, 409 |
| DELETE | /crm/leads/{id} | Soft-delete lead | crm:write | 204, 404      |
| POST   | /crm/leads/     | Add follow-up    | crm:write | 201, 404      |
{id}/followups
| POST | /crm/leads/  | Convert lead to  | crm:write | 200, 404, 422 |
| ---- | ------------ | ---------------- | --------- | ------------- |
|      | {id}/convert | admission        |           |               |
application
| GET  | /crm/campaigns | List campaigns | crm:read  | 200      |
| ---- | -------------- | -------------- | --------- | -------- |
| POST | /crm/campaigns | Create         | crm:write | 201, 400 |
campaign
| GET | /crm/analytics/ | Lead funnel  | crm:read | 200 |
| --- | --------------- | ------------ | -------- | --- |
|     | funnel          | analytics    |          |     |
43

PreOne OpenAPI Spec v1.0 | API Specification Freeze
14.3 Lead Conversion Example
POST /crm/leads/lead_01HXY.../convert
Request:
{
"applicationData": {
"academicYearId": "ay_01HXY...",
"classId": "cls_01HXY...",
"documents": ["doc_01HXY..."]
}
}
Response 200:
{
"leadId": "lead_01HXY...",
"applicationId": "app_01HXY...",
"applicationStatus": "Submitted",
"convertedAt": "2026-07-14T11:00:00Z"
}
Response 422 (BUSINESS_RULE_VIOLATION):
{
"success": false,
"error": {
"code": "LEAD_NOT_CONVERTIBLE",
"message": "Lead must be in 'Interested' or 'Visit Scheduled' status to
convert"
},
"traceId": "abc-456"
}
44

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
15. Admission APIs
15.1 Admission Domain Overview
Admission domain हा(cid:2) CRM च्या(cid:2) प्र(cid:2)ठी(cid:5)श(cid:5) यातो(cid:14) (cid:13) आणि(cid:18) application review + approval workflow
handle  करतो(cid:13). Application lifecycle: Submitted → Document Verification → Interview
Scheduled → Interview Completed → Approved/Rejected → Student Record Created. हा(cid:2)
workflow state machine enforced आहा(cid:14) आणि(cid:18) प्र(cid:7)त्या(cid:14)क transition वर specific permissions + audit
logging required आहा(cid:14). Application approve झा(cid:2)ल्या(cid:2)वर Student record automatically create हा(cid:13)तो(cid:13)
आणि(cid:18) StudentAdmitted webhook fire हा(cid:13)तो(cid:13).
Admission domain ची(cid:14) key aggregates: AdmissionApplication (root), ApplicationDocument
(child entity), Interview (child entity), DocumentVerification (child entity). Application
approve हा(cid:2) saga pattern द्वा(cid:2)र(cid:14) orchestrate हा(cid:13)तो(cid:13): Application → Student created → Initial
Invoice generated → Welcome communication sent. हा(cid:14) साव+ transactional outbox pattern द्वा(cid:2)र(cid:14)
reliable आहा(cid:14) — क(cid:2)हा(cid:5) fail झा(cid:2)ल्या(cid:2)सा compensation logic rollback करतो(cid:13).
15.2 Admission Endpoints
| Method | Path         | Summary    | Required Scope  | Status Codes  |
| ------ | ------------ | ---------- | --------------- | ------------- |
| POST   | /admissions/ | Submit     | admissions:writ | 201, 400, 409 |
|        | applications | admission  | e               |               |
application
| GET   | /admissions/      | List applications  | admissions:read | 200, 400      |
| ----- | ----------------- | ------------------ | --------------- | ------------- |
|       | applications      | with filters       |                 |               |
| GET   | /admissions/      | Get application    | admissions:read | 200, 404      |
|       | applications/{id} | details            |                 |               |
| PATCH | /admissions/      | Update             | admissions:writ | 200, 404, 409 |
|       | applications/{id} | application        | e               |               |
| POST  | /admissions/      | Approve            | admissions:appr | 200, 404, 422 |
|       | applications/     | application        | ove             |               |
{id}/approve
| POST | /admissions/  | Reject      | admissions:appr | 200, 404, 422 |
| ---- | ------------- | ----------- | --------------- | ------------- |
|      | applications/ | application | ove             |               |
{id}/reject
45

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Method | Path           | Summary      | Required Scope  | Status Codes |
| ------ | -------------- | ------------ | --------------- | ------------ |
| POST   | /admissions/   | Upload       | admissions:writ | 201, 404     |
|        | applications/  | application  | e               |              |
|        | {id}/documents | document     |                 |              |
| POST   | /admissions/   | Schedule     | admissions:writ | 201, 404     |
|        | applications/  | interview    | e               |              |
{id}/interviews
| GET | /admissions/ | Admission  | admissions:read | 200 |
| --- | ------------ | ---------- | --------------- | --- |
|     | dashboard    | dashboard  |                 |     |
metrics
| POST | /admissions/  | Bulk import  | admissions:writ | 202, 400 |
| ---- | ------------- | ------------ | --------------- | -------- |
|      | applications/ | applications | e               |          |
bulk-import
15.3 Approve Application Example
POST /admissions/applications/app_01HXY.../approve

Request:
{
  "comments": "All documents verified. Approved for LKG-A.",
  "classId": "cls_01HXY...",
  "sectionId": "sec_01HXY...",
  "feeStructureId": "fs_01HXY..."
}

Response 200:
{
  "applicationId": "app_01HXY...",
  "status": "Approved",
  "approvedBy": "usr_01HXY...",
  "approvedAt": "2026-07-14T12:00:00Z",
  "studentId": "stu_01HXY...",
  "invoiceId": "inv_01HXY...",
  "webhookEventId": "evt_01HXY..."
}
46

PreOne OpenAPI Spec v1.0 | API Specification Freeze
16. Student APIs
16.1 Student Domain Overview
Student domain हा(cid:2) PreOne ची(cid:2) core domain आहा(cid:14) जे(cid:13) student records ची(cid:2) master data manage
करतो(cid:13). Student aggregate मध्या (cid:14)student profile, guardians (max 4), address, academic history,
attendance history, fee history — साव+ included आहा(cid:14). हा(cid:2) aggregate eventually consistent आहा(cid:14)
— updates propagate to derived views (reports, dashboards) via domain events. Student
endpoints standard CRUD pattern follow करतो(cid:2)तो.
Student soft-deletion supported आहा(cid:14) — DELETE request record permanently remove करतो
न(cid:2)हा(cid:5), फक्तो deletedAt timestamp set करतो(cid:13). हा(cid:14) data integrity सा(cid:2)ठी(cid:5) essential आहा(cid:14) क(cid:2)र(cid:18) students
historical reports मध्या(cid:14) reference हा(cid:13)तो असातो(cid:2)तो. Hard delete फक्तो platform admin via separate
endpoint करू शकतो(cid:13) जे(cid:13) 90-day grace period सा(cid:13)बतो या(cid:14)तो(cid:13).
16.2 CRUD Pattern
हा(cid:14)ची pattern Admissions, Finance, HR, Inventory, Communication आणि(cid:18) इतोर साव+ domains सा(cid:2)ठी(cid:5)
ल(cid:2)र्ग 7हा(cid:13)ईल. Standard CRUD endpoints:
GET /students # List with pagination + filters
GET /students/{id} # Get by id
POST /students # Create new
PATCH /students/{id} # Update existing
DELETE /students/{id} # Soft delete
Additional endpoints:
GET /students/{id}/guardians # Sub-resource list
POST /students/{id}/guardians # Sub-resource create
GET /students/{id}/attendance # Cross-domain view
GET /students/{id}/fees # Cross-domain view
POST /students/export # Async export
16.3 Student Endpoints
Method Path Summary Required Scope Status Codes
POST /students Create student student:write 201, 400, 409
record
GET /students List students student:read 200, 400
with pagination
+ filters
47

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Method | Path           | Summary         | Required Scope | Status Codes |
| ------ | -------------- | --------------- | -------------- | ------------ |
| GET    | /students/{id} | Get student by  | student:read   | 200, 404     |
id
PATCH /students/{id} Update student student:write 200, 404, 409
| DELETE | /students/{id} | Soft-delete  | student:write | 204, 404 |
| ------ | -------------- | ------------ | ------------- | -------- |
student
| GET | /students/{id}/ | List guardians | student:read | 200, 404 |
| --- | --------------- | -------------- | ------------ | -------- |
guardians
POST /students/{id}/ Add guardian student:write 201, 404, 409
guardians
| GET | /students/{id}/ | Attendance  | student:read | 200, 404 |
| --- | --------------- | ----------- | ------------ | -------- |
|     | attendance      | history     |              |          |
| GET | /students/{id}/ | Fee history | student:read | 200, 404 |
fees
| POST | /students/ | Async export to  | student:read | 202, 400 |
| ---- | ---------- | ---------------- | ------------ | -------- |
|      | export     | Excel            |              |          |
16.4 Student Example
POST /students

Request:
{
  "firstName": "Aarav",
  "lastName": "Sharma",
  "dob": "2020-05-15",
  "gender": "Male",
  "classId": "cls_01HXY...",
  "sectionId": "sec_01HXY..."
}

Response 201:
{
  "id": "stu_01HXY...",
  "admissionNo": "SKP-0001",
  "firstName": "Aarav",
  "lastName": "Sharma",
  "dob": "2020-05-15",
  "gender": "Male",
  "status": "Active",
  "createdAt": "2026-07-14T10:00:00Z",
  "updatedAt": "2026-07-14T10:00:00Z",
48

PreOne OpenAPI Spec v1.0 | API Specification Freeze
"version": 1
}
49

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
17. Academics APIs
17.1 Academics Domain Overview
Academics domain हा(cid:2) Class → Section → Subject → Timetable → Exam → Marks hierarchy
manage करतो(cid:13). Class हा(cid:2) top-level entity आहा(cid:14) (e.g., LKG, UKG, Nursery, Playgroup). प्र(cid:7)त्याक(cid:14)  Class
ची(cid:14) multiple Sections असातो(cid:2)तो (e.g., LKG-A, LKG-B). Subjects Class-स्तोर(cid:2)वर defined असातो(cid:2)तो.
Timetable Section-स्तोर(cid:2)वर weekly schedule defines करतो(cid:13). Exams Class-स्तोर(cid:2)वर defined असातो(cid:2)तो
आणि(cid:18) Marks Student-स्तोर(cid:2)वर entered हा(cid:13)तो(cid:2)तो.
Academics domain ची(cid:14) key entities: Class, Section, Subject, Timetable, TimetableSlot, Exam,
Mark. Hierarchy strict  आहा(cid:14) —  Section Class  णिशव(cid:2)या  exist  करू शकतो न(cid:2)हा(cid:5), TimetableSlot
Timetable णिशव(cid:2)या exist करू शकतो न(cid:2)हा(cid:5). Bulk operations supported आहा(cid:14)तो — bulk timetable
generation, bulk marks entry, bulk exam creation. Async jobs द्वा(cid:2)र(cid:14) handled हा(cid:13)तो(cid:2)तो जे(cid:14) 202
Accepted return करतो(cid:2)तो.
17.2 Academics Endpoints
| Method | Path        | Summary      | Required Scope  | Status Codes |
| ------ | ----------- | ------------ | --------------- | ------------ |
| POST   | /academics/ | Create class | academics:write | 201, 400     |
classes
| GET | /academics/ | List classes | academics:read | 200 |
| --- | ----------- | ------------ | -------------- | --- |
classes
| POST | /academics/ | Create section | academics:write | 201, 400 |
| ---- | ----------- | -------------- | --------------- | -------- |
sections
| GET | /academics/ | List sections | academics:read | 200 |
| --- | ----------- | ------------- | -------------- | --- |
sections
| POST | /academics/ | Create subject | academics:write | 201, 400 |
| ---- | ----------- | -------------- | --------------- | -------- |
subjects
| GET | /academics/ | List subjects | academics:read | 200 |
| --- | ----------- | ------------- | -------------- | --- |
subjects
| POST | /academics/ | Create            | academics:write | 201, 400, 409 |
| ---- | ----------- | ----------------- | --------------- | ------------- |
|      | timetable   | timetable slot    |                 |               |
| GET  | /academics/ | Get timetable     | academics:read  | 200           |
|      | timetable   | for class/section |                 |               |
| POST | /academics/ | Create exam       | academics:write | 201, 400      |
exams
50

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Method Path Summary Required Scope Status Codes
POST /academics/ Bulk enter academics:write 202, 400
marks/bulk marks
17.3 Bulk Marks Entry Example
POST /academics/marks/bulk
Request:
{
"examId": "exm_01HXY...",
"subjectId": "sub_01HXY...",
"marks": [
{
"studentId": "stu_01HXY...",
"marksObtained": 85,
"remarks": "Good performance"
},
{
"studentId": "stu_02HXY...",
"marksObtained": 92,
"remarks": "Excellent"
}
]
}
Response 202 (Accepted):
{
"jobId": "job_01HXY...",
"status": "pending",
"estimatedCompletionTime": "2026-07-14T10:01:00Z"
}
# Poll job status:
GET /reports/jobs/job_01HXY...
Response 200:
{
"jobId": "job_01HXY...",
"status": "completed",
"progress": 100,
"result": {
"totalProcessed": 2,
"successCount": 2,
"failureCount": 0
}
}
51

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
18. Attendance APIs
18.1 Attendance Domain Overview
Attendance domain हा(cid:2) daily preschool operations ची(cid:2) critical function आहा(cid:14). Two types of
attendance supported: Class Attendance (teacher marks students present/absent) आणि(cid:18)
Transport Attendance (vehicle staff marks students boarded/alighted). Class attendance
per-day per-student one record आहा(cid:14); Transport attendance per-trip per-student one record
आहा(cid:14). Both types WebSocket channels द्वा(cid:2)र(cid:14) real-time updates push करतो(cid:2)तो — attendance.live
आणि(cid:18) transport.live.
Attendance marking stateful operation  आहा(cid:14) —  already marked attendance update
करण्या(cid:2)सा(cid:2)ठी(cid:5) Correction Request workflow आहा(cid:14). Teacher directly edit करू शकतो न(cid:2)हा(cid:5); correction
request create करतो(cid:13) जे(cid:13) Branch Admin approve करतो(cid:13). हा(cid:14) audit trail सा(cid:2)ठी(cid:5) essential आहा(cid:14). Bulk
attendance endpoint class-स्तोर(cid:2)वर साव+ students एक(cid:2)ची व(cid:14)ळे(cid:5) mark करण्या(cid:2)सा(cid:2)ठी(cid:5) आहा(cid:14) आणि(cid:18) async job
द्वा(cid:2)र(cid:14) process हा(cid:13)तो(cid:13).
18.2 Attendance Endpoints
| Method | Path         | Summary      | Required Scope  | Status Codes  |
| ------ | ------------ | ------------ | --------------- | ------------- |
| POST   | /attendance/ | Mark single  | attendance:writ | 201, 400, 422 |
|        | mark         | student      | e               |               |
attendance
| POST | /attendance/ | Bulk mark       | attendance:writ | 202, 400 |
| ---- | ------------ | --------------- | --------------- | -------- |
|      | mark/bulk    | attendance for  | e               |          |
class
| GET | /attendance/    | Get attendance  | attendance:read | 200, 404 |
| --- | --------------- | --------------- | --------------- | -------- |
|     | students/{id}   | for student     |                 |          |
| GET | /attendance/    | Get attendance  | attendance:read | 200      |
|     | class/{classId} | for class       |                 |          |
| GET | /attendance/    | Attendance      | attendance:read | 200, 400 |
|     | summary         | summary (date   |                 |          |
range)
| POST | /attendance/ | Mark transport  | attendance:writ | 201, 400 |
| ---- | ------------ | --------------- | --------------- | -------- |
|      | transport    | attendance      | e               |          |
52

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Method | Path           | Summary         | Required Scope  | Status Codes |
| ------ | -------------- | --------------- | --------------- | ------------ |
| GET    | /attendance/   | Live transport  | attendance:read | 200          |
|        | transport/live | attendance      |                 |              |
stream
| POST | /attendance/ | Request     | attendance:writ | 201, 400 |
| ---- | ------------ | ----------- | --------------- | -------- |
|      | corrections  | attendance  | e               |          |
correction
| PATCH | /attendance/ | Approve    | attendance:app | 200, 404, 422 |
| ----- | ------------ | ---------- | -------------- | ------------- |
|       | corrections/ | correction | rove           |               |
{id}/approve
| GET | /attendance/ | Monthly     | attendance:read | 200, 400 |
| --- | ------------ | ----------- | --------------- | -------- |
|     | reports/     | attendance  |                 |          |
|     | monthly      | report      |                 |          |
18.3 Bulk Attendance Example
POST /attendance/mark/bulk

Request:
{
  "date": "2026-07-14",
  "classId": "cls_01HXY...",
  "sectionId": "sec_01HXY...",
  "records": [
    {
      "studentId": "stu_01HXY...",
      "status": "Present"
    },
    {
      "studentId": "stu_02HXY...",
      "status": "Absent",
      "reason": "Sick leave"
    }
  ]
}

Response 202 (Accepted):
{
  "jobId": "job_att_01HXY...",
  "status": "pending"
}

# WebSocket notification when complete:
# Channel: attendance.live
# Room: branch:br_01HXY...
53

PreOne OpenAPI Spec v1.0 | API Specification Freeze
{
"event": "attendance.marked",
"payload": {
"studentIds": ["stu_01HXY...", "stu_02HXY..."],
"date": "2026-07-14",
"markedBy": "usr_01HXY...",
"markedAt": "2026-07-14T09:30:00Z"
}
}
54

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
19. Communication APIs
19.1 Communication Domain Overview
Communication domain हा(cid:2) omnichannel messaging manage करतो(cid:13) — SMS, WhatsApp,
Email, In-App Notifications, आणि(cid:18) real-time Chat. हा (cid:14)साव +channels unified interface द्वा(cid:2)र (cid:14)exposed
आहा(cid:14)तो.   Templates   centralised  आहा(cid:14)तो  variable   placeholders  आहा(cid:14)तो  (e.g.,   'Dear
  णिजेथा(cid:14)
{{parentName}}, your child {{studentName}} was marked absent today.'). Templates
approved हा(cid:13)(cid:18)(cid:14) आवश्याक आहा(cid:14) त्या(cid:2)नतो# रची usage सा(cid:2)ठी(cid:5) available हा(cid:13)तो(cid:2)तो — या(cid:2)मळे( (cid:14) brand consistency
आणि(cid:18) compliance (SMS/WhatsApp DLT regulations) साणि(नणिश्चीतो हा(cid:13)तो(cid:14).
Communication domain  ची(cid:14)  key aggregates: Message (single outbound message with
channel + template + recipient + status), Template (reusable message body with variables),
Group (recipient collection for broadcast), ChatRoom (real-time 1:1 or group chat),
Notification (in-app notification with read/unread state). Message sending async operation
आहा (cid:14)— 202 Accepted return हा(cid:13)तो(cid:13) आणि(cid:18) actual delivery background job द्वा(cid:2)र (cid:14)हा(cid:13)तो(cid:13). Delivery status
update webhook द्वा(cid:2)र(cid:14) available आहा(cid:14).
19.2 Communication Endpoints
| Method | Path          | Summary       | Required Scope | Status Codes |
| ------ | ------------- | ------------- | -------------- | ------------ |
| POST   | /             | Send message  | communication: | 202, 400     |
|        | communication | (SMS/WhatsApp | write          |              |
|        | /messages     | /Email)       |                |              |
| GET    | /             | List messages | communication: | 200, 400     |
|        | communication |               | read           |              |
/messages
| POST | /             | Create template | communication: | 201, 400, 409 |
| ---- | ------------- | --------------- | -------------- | ------------- |
|      | communication |                 | write          |               |
/templates
| GET | /             | List templates | communication: | 200 |
| --- | ------------- | -------------- | -------------- | --- |
|     | communication |                | read           |     |
/templates
| POST | /             | Create         | communication: | 201, 400 |
| ---- | ------------- | -------------- | -------------- | -------- |
|      | communication | communication  | write          |          |
|      | /groups       | group          |                |          |
55

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Method | Path          | Summary       | Required Scope | Status Codes |
| ------ | ------------- | ------------- | -------------- | ------------ |
| POST   | /             | Broadcast to  | communication: | 202, 400     |
|        | communication | group         | write          |              |
/broadcast
| GET | /             | List chat rooms | communication: | 200 |
| --- | ------------- | --------------- | -------------- | --- |
|     | communication |                 | read           |     |
/chat/rooms
| POST | /             | Send chat  | communication: | 201, 400 |
| ---- | ------------- | ---------- | -------------- | -------- |
|      | communication | message    | write          |          |
/chat/messages
| GET | /             | List user     | communication: | 200 |
| --- | ------------- | ------------- | -------------- | --- |
|     | communication | notifications | read           |     |
/notifications
| POST | /               | Mark          | communication: | 200, 404 |
| ---- | --------------- | ------------- | -------------- | -------- |
|      | communication   | notification  | write          |          |
|      | /notifications/ | read          |                |          |
{id}/read
19.3 Send Message Example
POST /communication/messages

Request:
{
  "channel": "WhatsApp",
  "templateId": "tpl_absent_alert",
  "recipients": [
    {
      "mobile": "9876543210",
      "variables": {
        "parentName": "Rohan Sharma",
        "studentName": "Aarav Sharma"
      }
    }
  ]
}

Response 202 (Accepted):
{
  "messageId": "msg_01HXY...",
  "status": "queued",
  "channel": "WhatsApp",
  "recipientCount": 1,
  "queuedAt": "2026-07-14T10:30:00Z"
56

PreOne OpenAPI Spec v1.0 | API Specification Freeze
}
57

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
20. Finance APIs
20.1 Finance Domain Overview
Finance domain हा(cid:2) financial transactions manage करतो(cid:13) — invoices, payments, receipts,
refunds. Invoice lifecycle: Draft → Issued → Partially Paid → Paid → Cancelled. Draft state
मध्या(cid:14) invoice edit कर(cid:18)(cid:14) allowed आहा(cid:14); Issued state नतो# र फक्तो payment receive कर(cid:18)(cid:14) णिक#व(cid:2) cancel
कर(cid:18)(cid:14) possible आहा(cid:14). Payments दा(cid:13)न प्र(cid:7)क(cid:2)रची:(cid:14)  Online (Razorpay/PayU gateway integration) आणि(cid:18)
Offline (cash/cheque/UPI manual entry). Refunds Online payments सा(cid:2)ठी(cid:5) only allowed आहा(cid:14)तो
| आणि(cid:18) original payment amount च्या(cid:2) 50% प्रया+तो# |     |  limit आहा(cid:14). |     |     |
| ------------------------------------------------------------- | --- | ------------------- | --- | --- |
Finance domain ची(cid:14) key aggregates: Invoice (root with line items), Payment (recorded
payment with method + reference), Receipt (auto-generated on payment success), Refund
(linked to original Payment). Financial immutability principle: once Issued, invoice never
modified — corrections via credit notes. हा(cid:14) accounting standards (GAAP/IndAS) compliance
सा(cid:2)ठी(cid:5) essential आहा(cid:14).
20.2 Finance Endpoints
| Method | Path      | Summary        | Required Scope | Status Codes  |
| ------ | --------- | -------------- | -------------- | ------------- |
| POST   | /finance/ | Create invoice | finance:write  | 201, 400, 422 |
invoices
| GET | /finance/ | List invoices | finance:read | 200, 400 |
| --- | --------- | ------------- | ------------ | -------- |
invoices
| GET | /finance/ | Get invoice | finance:read | 200, 404 |
| --- | --------- | ----------- | ------------ | -------- |
invoices/{id}
| PATCH | /finance/     | Update invoice  | finance:write | 200, 404, 422 |
| ----- | ------------- | --------------- | ------------- | ------------- |
|       | invoices/{id} | (draft only)    |               |               |
| POST  | /finance/     | Cancel invoice  | finance:write | 200, 404, 422 |
invoices/{id}/
cancel
| POST | /finance/ | Record payment | finance:write | 201, 400, 422 |
| ---- | --------- | -------------- | ------------- | ------------- |
payments
| POST | /finance/ | Initiate online  | finance:write | 200, 400 |
| ---- | --------- | ---------------- | ------------- | -------- |
|      | payments/ | payment          |               |          |
online
58

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Method Path Summary Required Scope Status Codes
POST /finance/ Refund finance:write 200, 404, 422
payments/{id}/ payment
refund
GET /finance/ List receipts finance:read 200, 400
receipts
GET /finance/ Finance finance:read 200, 400
reports/ summary report
summary
20.3 Create Invoice Example
POST /finance/invoices
Request:
{
"studentId": "stu_01HXY...",
"academicYearId": "ay_01HXY...",
"invoiceType": "Tuition Fee",
"dueDate": "2026-08-15",
"lineItems": [
{
"description": "Tuition Fee - Q1 2025-2026",
"amount": 15000.00,
"tax": 0,
"discount": 0
}
],
"notes": "Pay before due date to avoid late fee"
}
Response 201:
{
"id": "inv_01HXY...",
"invoiceNo": "INV-2026-0001",
"studentId": "stu_01HXY...",
"status": "Issued",
"totalAmount": 15000.00,
"dueDate": "2026-08-15",
"createdAt": "2026-07-14T11:00:00Z",
"version": 1
}
59

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
21. Inventory APIs
21.1 Inventory Domain Overview
Inventory domain हा(cid:2) physical assets manage करतो(cid:13) — stationery, books, uniforms, snacks,
teaching materials. Stock movements हा (cid:14)core concept आहा(cid:14)तो: Stock-In (receive from supplier),
Stock-Out (issue  to  class/teacher), Adjustment  (loss/damage  correction),  Transfer
(between branches). प्र(cid:7)त्याक(cid:14)  movement audit logged आहा (cid:14)आणि(cid:18) stock levels auto-update हा(cid:13)तो(cid:2)तो.
Purchase Orders supplier procurement handle करतो(cid:2)तो — PO lifecycle: Draft → Submitted →
Approved → Partially Received → Fully Received → Closed.
Inventory domain ची(cid:14) key aggregates: Item (with category + unit + current stock level),
Category (classification), StockMovement (immutable record of every movement),
PurchaseOrder (procurement document with line items). Stock levels per-branch tracked
आहा(cid:14)तो —  cross-branch stock queries require platform:read scope. Low stock alerts
automatic हा(cid:13)तो(cid:2)तो via background job जे(cid:13) threshold check करतो(cid:13) आणि(cid:18) communication domain
ल(cid:2) alert प्र(cid:2)ठीवतो(cid:13).
21.2 Inventory Endpoints
| Method | Path        | Summary     | Required Scope  | Status Codes |
| ------ | ----------- | ----------- | --------------- | ------------ |
| POST   | /inventory/ | Create item | inventory:write | 201, 400     |
items
| GET | /inventory/ | List items | inventory:read | 200, 400 |
| --- | ----------- | ---------- | -------------- | -------- |
items
| POST | /inventory/ | Create category | inventory:write | 201, 400 |
| ---- | ----------- | --------------- | --------------- | -------- |
categories
| POST | /inventory/     | Stock-in         | inventory:write | 201, 400, 422 |
| ---- | --------------- | ---------------- | --------------- | ------------- |
|      | stock/in        | (receive)        |                 |               |
| POST | /inventory/     | Stock-out        | inventory:write | 201, 400, 422 |
|      | stock/out       | (issue)          |                 |               |
| GET  | /inventory/     | Current stock    | inventory:read  | 200           |
|      | stock/levels    | levels           |                 |               |
| POST | /inventory/     | Create purchase  | inventory:write | 201, 400      |
|      | purchase-orders | order            |                 |               |
60

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Method Path Summary Required Scope Status Codes
PATCH /inventory/ Receive PO inventory:write 200, 404, 422
purchase- items
orders/{id}/
receive
GET /inventory/ Stock audit log inventory:read 200
audit
POST /inventory/ Stock inventory:write 201, 400, 422
stock/adjust adjustment
(loss/damage)
21.3 Stock Movement Example
POST /inventory/stock/out
Request:
{
"itemId": "itm_01HXY...",
"quantity": 50,
"reason": "Issued to LKG-A class",
"recipientId": "cls_01HXY...",
"reference": "ISSUE-2026-0001"
}
Response 201:
{
"movementId": "mov_01HXY...",
"itemId": "itm_01HXY...",
"movementType": "StockOut",
"quantity": 50,
"remainingStock": 450,
"movedAt": "2026-07-14T12:00:00Z",
"movedBy": "usr_01HXY..."
}
61

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
22. HR APIs
22.1 HR Domain Overview
HR domain हा(cid:2) employee lifecycle manage करतो(cid:13) — recruitment (out of scope), onboarding,
leave management, payroll, attendance, offboarding. Employee आणि(cid:18) User या(cid:2)ची# (cid:2) linkage 1:1
आहा(cid:14) — प्र(cid:7)त्याक(cid:14)  Employee ची(cid:2) एक User account असातो(cid:13) जे(cid:13) login सा(cid:2)ठी(cid:5) व(cid:2)प्ररल(cid:2) जे(cid:2)तो(cid:13). Roles assigned
via User account. Employee types: Teaching Staff (with subject + class assignment), Non-
Teaching Staff (administrative roles), Contract Staff (hourly). Payroll monthly run  द्वा(cid:2)र(cid:14)
processed हा(cid:13)तो(cid:13) आणि(cid:18) payslips generated हा(cid:13)तो(cid:2)तो.
HR domain ची(cid:14) key aggregates: Employee (root with personal + employment details), Leave
(with type + duration + status + approver), Payslip (monthly salary computation with
earnings + deductions), EmployeeAttendance (different from Student Attendance). Leave
workflow: Applied → Pending → Approved/Rejected → Cancelled. Multi-level approval
आवश्याक असाल्या(cid:2)सा sequence द्वा(cid:2)र(cid:14) routed हा(cid:13)तो(cid:13).
22.2 HR Endpoints
| Method | Path          | Summary | Required Scope | Status Codes  |
| ------ | ------------- | ------- | -------------- | ------------- |
| POST   | /hr/employees | Create  | hr:write       | 201, 400, 409 |
employee
| GET | /hr/employees | List employees | hr:read | 200, 400 |
| --- | ------------- | -------------- | ------- | -------- |
| GET | /hr/          | Get employee   | hr:read | 200, 404 |
employees/{id}
| PATCH | /hr/           | Update          | hr:write   | 200, 404, 409 |
| ----- | -------------- | --------------- | ---------- | ------------- |
|       | employees/{id} | employee        |            |               |
| POST  | /hr/leaves     | Apply for leave | hr:write   | 201, 400, 422 |
| PATCH | /hr/leaves/    | Approve leave   | hr:approve | 200, 404, 422 |
{id}/approve
| POST | /hr/payroll/run | Run payroll for  | hr:write | 202, 400 |
| ---- | --------------- | ---------------- | -------- | -------- |
month
| GET  | /hr/payroll/{id} | Get payslip    | hr:read  | 200, 404 |
| ---- | ---------------- | -------------- | -------- | -------- |
| POST | /hr/attendance   | Mark employee  | hr:write | 201, 400 |
attendance
62

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Method Path Summary Required Scope Status Codes
GET /hr/reports/ Headcount hr:read 200
headcount report
22.3 Apply Leave Example
POST /hr/leaves
Request:
{
"employeeId": "emp_01HXY...",
"leaveType": "Casual Leave",
"startDate": "2026-08-10",
"endDate": "2026-08-12",
"reason": "Personal work",
"approverId": "usr_02HXY..."
}
Response 201:
{
"id": "lv_01HXY...",
"employeeId": "emp_01HXY...",
"status": "Pending",
"days": 3,
"appliedAt": "2026-07-14T13:00:00Z"
}
63

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
23. Administration APIs
23.1 Administration Domain Overview
Administration domain हा(cid:2) tenant-level configuration manage करतो(cid:13) — branches, academic
years, holidays, audit logs, system health, maintenance mode. हा (cid:14)superuser-level operations
आहा(cid:14)तो जे (cid:14)फक्तो Branch Admin णिक#व(cid:2) Platform Admin role व(cid:2)ल (cid:14)users perform करू शकतो(cid:2)तो. Branch
creation हा(cid:2) critical operation आहा(cid:14) जे(cid:13) multiple aggregates initialize करतो(cid:13) — default roles,
default fee structures, default academic calendar. Audit log query read-only  आहा(cid:14) प्र(cid:18)
| powerful filter + export features दातो(cid:14) |     | (cid:13). |     |     |
| ---------------------------------------------- | --- | --------- | --- | --- |
Administration domain ची (cid:14)key aggregates: Branch (location with address + contact + config),
AcademicYear (yearly period with start/end dates + terms), Holiday (institutional holiday
calendar), AuditLog (immutable event log with user + action + entity + before/after diff).
Maintenance mode हा(cid:2) feature flag आहा(cid:14) जे(cid:13) enable क(cid:14) ल्या(cid:2)वर non-admin users ल(cid:2) 503 Service
Unavailable return करतो(cid:13) आणि(cid:18) maintenance page णिदासातो(cid:13).
23.2 Administration Endpoints
| Method | Path | Summary       | Required Scope | Status Codes  |
| ------ | ---- | ------------- | -------------- | ------------- |
| POST   | /    | Create branch | admin:write    | 201, 400, 409 |
administration/
branches
| GET | /   | List branches | admin:read | 200 |
| --- | --- | ------------- | ---------- | --- |
administration/
branches
| PATCH | /   | Update branch | admin:write | 200, 404 |
| ----- | --- | ------------- | ----------- | -------- |
administration/
branches/{id}
| POST | /               | Create        | admin:write | 201, 400, 409 |
| ---- | --------------- | ------------- | ----------- | ------------- |
|      | administration/ | academic year |             |               |
academic-years
| POST | /   | Declare holiday | admin:write | 201, 400 |
| ---- | --- | --------------- | ----------- | -------- |
administration/
holidays
| GET | /   | Query audit logs | admin:read | 200, 400 |
| --- | --- | ---------------- | ---------- | -------- |
administration/
audit-logs
64

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Method | Path | Summary        | Required Scope | Status Codes |
| ------ | ---- | -------------- | -------------- | ------------ |
| POST   | /    | Trigger backup | admin:write    | 202, 400     |
administration/
backup/run
| GET | /               | System health  | admin:read | 200 |
| --- | --------------- | -------------- | ---------- | --- |
|     | administration/ | check          |            |     |
health
| POST | /               | Enable       | admin:write | 200 |
| ---- | --------------- | ------------ | ----------- | --- |
|      | administration/ | maintenance  |             |     |
|      | maintenance-    | mode         |             |     |
mode
| GET | /               | Get system  | admin:read | 200 |
| --- | --------------- | ----------- | ---------- | --- |
|     | administration/ | config      |            |     |
config
23.3 Audit Log Query Example
GET /administration/audit-logs?
userId=usr_01HXY...&action=UPDATE&entity=Student&from=2026-07-
01T00:00:00Z&to=2026-07-14T23:59:59Z&page=1&size=50

Response 200:
{
  "data": [
    {
      "id": "log_01HXY...",
      "userId": "usr_01HXY...",
      "userName": "Aarav Sharma",
      "action": "UPDATE",
      "entity": "Student",
      "entityId": "stu_01HXY...",
      "changes": {
        "firstName": {
          "from": "Aarav",
          "to": "Aaravkumar"
        }
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "timestamp": "2026-07-14T14:30:00Z",
      "traceId": "abc-123"
    }
  ],
  "meta": {
    "page": 1,
65

PreOne OpenAPI Spec v1.0 | API Specification Freeze
"size": 50,
"total": 145,
"totalPages": 3,
"hasNext": true,
"hasPrev": false
}
}
66

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
24. Reports APIs
24.1 Reports Domain Overview
Reports domain हा(cid:2) read-only analytical views + report generation manage करतो(cid:13). Reports
async operations आहा(cid:14)तो क(cid:2)र(cid:18) large datasets process कर(cid:18) (cid:14)synchronous impossible आहा(cid:14). प्र(cid:7)त्याक(cid:14)
report request 202 Accepted return करतो(cid:13) आणि(cid:18) background job मध्या(cid:14) queued हा(cid:13)तो(cid:13). Job status
polling endpoint via check क(cid:14) ल(cid:2) जे(cid:2)तो(cid:13). Job complete झा(cid:2)ल्या(cid:2)वर download URL available हा(cid:13)तो(cid:13) जे(cid:13)
24 hours valid असातो(cid:13). Standard reports pre-built आहा(cid:14)तो; custom report builder business users
सा(cid:2)ठी(cid:5) आहा(cid:14) णिजेथा(cid:14) filter + group + aggregate drag-drop interface द्वा(cid:2)र(cid:14) defined हा(cid:13)तो(cid:2)तो.
Reports domain  ची(cid:14)  key aggregates: ReportJob (async job with status + result URL),
ReportTemplate (reusable report definition), ScheduledReport (recurring report schedule
with cron expression + recipients). Standard report categories: Attendance Reports
(monthly, class-wise, student-wise), Finance Reports (collection summary, outstanding
dues, fee structure analysis), Academic Reports (exam performance, progress card, term
summary), Admissions Reports (funnel analysis, conversion rate, source attribution).
24.2 Reports Endpoints
| Method | Path       | Summary        | Required Scope | Status Codes |
| ------ | ---------- | -------------- | -------------- | ------------ |
| POST   | /reports/  | Student        | reports:read   | 202, 400     |
|        | student/   | attendance     |                |              |
|        | attendance | report         |                |              |
| POST   | /reports/  | Finance        | reports:read   | 202, 400     |
|        | finance/   | summary report |                |              |
summary
| POST | /reports/   | Admissions    | reports:read | 202, 400 |
| ---- | ----------- | ------------- | ------------ | -------- |
|      | admissions/ | funnel report |              |          |
funnel
| POST | /reports/      | Academic        | reports:read | 202, 400      |
| ---- | -------------- | --------------- | ------------ | ------------- |
|      | academic/      | performance     |              |               |
|      | performance    | report          |              |               |
| GET  | /reports/jobs/ | Get report job  | reports:read | 200, 404      |
|      | {id}           | status          |              |               |
| GET  | /reports/jobs/ | Download        | reports:read | 200, 404, 410 |
|      | {id}/download  | report          |              |               |
67

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Method | Path      | Summary          | Required Scope | Status Codes |
| ------ | --------- | ---------------- | -------------- | ------------ |
| POST   | /reports/ | Custom report    | reports:write  | 202, 400     |
|        | custom    | builder          |                |              |
| GET    | /reports/ | List report      | reports:read   | 200          |
|        | templates | templates        |                |              |
| POST   | /reports/ | Create report    | reports:write  | 201, 400     |
|        | templates | template         |                |              |
| POST   | /reports/ | Schedule         | reports:write  | 201, 400     |
|        | schedule  | recurring report |                |              |
24.3 Generate Report Example
POST /reports/student/attendance

Request:
{
  "studentIds": ["stu_01HXY..."],
  "fromDate": "2026-07-01",
  "toDate": "2026-07-31",
  "format": "PDF",
  "includeCharts": true
}

Response 202 (Accepted):
{
  "jobId": "job_rpt_01HXY...",
  "status": "pending",
  "estimatedCompletionTime": "2026-07-14T14:01:00Z"
}

# Poll for completion:
GET /reports/jobs/job_rpt_01HXY...

Response 200 (when complete):
{
  "jobId": "job_rpt_01HXY...",
  "status": "completed",
  "progress": 100,
  "downloadUrl": "/reports/jobs/job_rpt_01HXY.../download",
  "expiresAt": "2026-07-15T14:00:00Z",
  "fileSize": 245678
  "mimeType": "application/pdf"
}
68

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
25. Platform APIs
25.1 Platform Domain Overview
Platform domain  हा(cid:2)  multi-tenant super-admin operations manage  करतो(cid:13) —  tenant
management, subscriptions, billing, webhooks, API keys, platform-level metrics. हा(cid:14) साव+
endpoints फक्तो Platform Admin role व(cid:2)ल(cid:14) users access करू शकतो(cid:2)तो. Tenant lifecycle: Trial →
Active → Suspended → Terminated. Subscription lifecycle: Active → Past Due → Cancelled
→ Reactivated. Webhook registration द्वा(cid:2)र (cid:14)third-party systems PreOne events subscribe करू
शकतो(cid:2)तो — हा(cid:14) OAuth2 client credentials flow सा(cid:13)बतो authenticated असातो(cid:2)तो.
Platform domain ची (cid:14)key aggregates: Tenant (root customer organization with subscription +
plan + features), Subscription (billing cycle with plan + limits + status), Webhook (event
subscription with URL + signing secret + retries), ApiKey (per-tenant API key with scoped
permissions). Platform metrics read-only aggregated views दातो(cid:14) (cid:2)तो — total tenants, active
users, API calls per tenant, error rates. हा (cid:14)metrics real-time WebSocket channel द्वा(cid:2)र (cid:14)platform
admin dashboard मध्या (cid:14)push हा(cid:13)तो(cid:2)तो.
25.2 Platform Endpoints
| Method | Path       | Summary        | Required Scope | Status Codes  |
| ------ | ---------- | -------------- | -------------- | ------------- |
| POST   | /platform/ | Create tenant  | platform:write | 201, 400, 409 |
|        | tenants    | (super-admin)  |                |               |
| GET    | /platform/ | List tenants   | platform:read  | 200           |
tenants
| PATCH | /platform/ | Update tenant | platform:write | 200, 404 |
| ----- | ---------- | ------------- | -------------- | -------- |
tenants/{id}
| POST | /platform/    | Create        | platform:write | 201, 400, 422 |
| ---- | ------------- | ------------- | -------------- | ------------- |
|      | subscriptions | subscription  |                |               |
| GET  | /platform/    | List          | platform:read  | 200           |
|      | subscriptions | subscriptions |                |               |
| POST | /platform/    | Register      | platform:write | 201, 400      |
|      | webhooks      | webhook       |                |               |
| GET  | /platform/    | List webhooks | platform:read  | 200           |
webhooks
69

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Method Path Summary Required Scope Status Codes
POST /platform/ Test webhook platform:write 200, 404
webhooks/{id}/ delivery
test
GET /platform/ Platform platform:read 200
metrics metrics
POST /platform/api- Generate API platform:write 201, 400
keys key
25.3 Register Webhook Example
POST /platform/webhooks
Request:
{
"url": "https://api.partner.com/preone/webhooks",
"events": [
"student.admitted",
"finance.payment.received"
],
"description": "Sync to partner CRM"
}
Response 201:
{
"id": "wh_01HXY...",
"url": "https://api.partner.com/preone/webhooks",
"events": ["student.admitted", "finance.payment.received"],
"signingSecret": "whsec_abc123...",
"status": "Active",
"createdAt": "2026-07-14T15:00:00Z"
}
# Test webhook delivery:
POST /platform/webhooks/wh_01HXY.../test
Response 200:
{
"delivered": true,
"responseStatus": 200,
"responseTimeMs": 245,
"attempt": 1
}
70

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
26. WebSocket Documentation
26.1 WebSocket Overview
PreOne real-time communication Socket.IO v4.x द्वा(cid:2)र(cid:14) handled हा(cid:13)तो(cid:13). WebSocket हा(cid:2) HTTP प्र(cid:14)क्षा(cid:2)
efficient bi-directional communication  प्र(cid:7)दा(cid:2)न करतो(cid:13) —  server push + client push  दा(cid:13)न्हा(cid:5)
supported. PreOne मध्या(cid:14) 5 documented WebSocket channels आहा(cid:14)तो. प्र(cid:7)त्याक(cid:14)  channel specific
event types carry करतो(cid:13) आणि(cid:18) room-based subscription model व(cid:2)प्ररतो(cid:13). Authentication JWT द्वा(cid:2)र(cid:14)
connection handshake वर mandatory आहा(cid:14) — unauthenticated connections immediately
disconnected.
WebSocket   connection   URL:   wss://api.preone.com/ws?token=<JWT>.   Connection
handshake वर client JWT provide करतो(cid:13), server validate करतो(cid:13), आणि(cid:18) successful authentication
वर connection established हा(cid:13)तो(cid:13). Rooms namespace-based isolation दातो(cid:14) (cid:2)तो — branch:{bid},
user:{uid}, room:{roomId}, vehicle:{vehicleId}. Client specific rooms मध्या (cid:14)join हा(cid:13)तो(cid:13) server-side
event emit द्वा(cid:2)र(cid:14). Message format JSON आहा(cid:14) with envelope: { event, payload, timestamp }.
26.2 Documented Channels
| Channel | Purpose | Room Pattern | Payload | Consumers |
| ------- | ------- | ------------ | ------- | --------- |
attendance.live Real-time  branch:{bid} AttendanceMar Teacher
|     | attendance   |     | ked event  | dashboard live  |
| --- | ------------ | --- | ---------- | --------------- |
|     | updates per  |     | payload    | updates         |
branch
| notifications | User           | user:{uid}    | Notification  | Web + mobile      |
| ------------- | -------------- | ------------- | ------------- | ----------------- |
|               | notifications  |               | payload +     | notification bell |
|               | push           |               | unread count  |                   |
| chat          | Two-way chat   | room:{roomId} | Message       | Parent-teacher    |
|               | messages       |               | payload +     | chat              |
sender info
transport.live Live transport  vehicle: GPS coordinates  Parent app +
|                | vehicle tracking | {vehicleId} | + ETA + student  | admin     |
| -------------- | ---------------- | ----------- | ---------------- | --------- |
|                |                  |             | status           | dashboard |
| dashboard.metr | Live dashboard   | branch:     | Metric key +     | Admin     |
ics metric updates {bid}:dashboard value + delta dashboard real-
time cards
71

PreOne OpenAPI Spec v1.0 | API Specification Freeze
26.3 Connection Example
// Client-side (browser) connection
import { io } from 'socket.io-client';
const socket = io('https://api.preone.com/ws', {
auth: {
token: 'eyJhbGciOiJSUzI1NiIs...',
tenantId: 'ten_01HXY...',
branchId: 'br_01HXY...'
}
});
socket.on('connect', () => {
console.log('Connected:', socket.id);
});
// Listen to attendance.live channel
socket.on('attendance.marked', (data) => {
console.log('Attendance update:', data);
// {
// studentIds: ['stu_01HXY...'],
// date: '2026-07-14',
// status: 'Present',
// markedBy: 'usr_01HXY...',
// markedAt: '2026-07-14T09:30:00Z'
// }
});
// Listen to notifications channel
socket.on('notification.new', (data) => {
console.log('New notification:', data);
});
socket.on('disconnect', (reason) => {
console.log('Disconnected:', reason);
});
socket.on('error', (err) => {
console.error('Socket error:', err);
});
72

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
27. Webhooks
27.1 Webhook Overview
Webhooks हा(cid:14) outbound HTTP callbacks आहा(cid:14)तो जे(cid:14) PreOne च्या(cid:2) specific events occur झा(cid:2)ल्या(cid:2)वर
third-party systems ल(cid:2) notify करतो(cid:2)तो. WebSocket हा(cid:14) real-time push आहा(cid:14) प्र(cid:18) तो(cid:14) PreOne ची own
clients  सा(cid:2)ठी(cid:5)  (web/mobile); Webhooks  हा(cid:14)  external systems  सा(cid:2)ठी(cid:5) आहा(cid:14)तो  (partner CRMs,
accounting software, parent apps). Webhook delivery at-least-once semantics द्वा(cid:2)र(cid:14) handled
हा(cid:13)तो(cid:13) — duplicate delivery possible आहा(cid:14), clients idempotency handle कर(cid:18)(cid:14) आवश्याक आहा(cid:14) via
event id.
Webhook delivery retry strategy exponential backoff द्वा(cid:2)र(cid:14): 1min, 5min, 30min, 2hr, 6hr, 24hr
— total 6 attempts. हा(cid:14) साव+ attempts failed झा(cid:2)ल्या(cid:2)सा webhook auto-disabled हा(cid:13)तो(cid:13) आणि(cid:18) tenant
admin ल(cid:2) email notification जे(cid:2)तो(cid:13). Webhook payload HMAC-SHA256 द्वा(cid:2)र(cid:14) signed असातो(cid:13) —
signature X-PreOne-Signature header मध्या (cid:14)sent हा(cid:13)तो(cid:13). Clients signature verify कर(cid:18) (cid:14)mandatory
आहा(cid:14) to prevent forgery.
27.2 Webhook Events
| Event Name | Event Type | Trigger | Payload | Consumers |
| ---------- | ---------- | ------- | ------- | --------- |
StudentAdmitte student.admitte When  { studentId,  CRM sync,
| d   | d   | admission       | branchId,        | welcome email  |
| --- | --- | --------------- | ---------------- | -------------- |
|     |     | approved +      | academicYearId,  | trigger        |
|     |     | student record  | admittedAt }     |                |
created
PaymentReceiv finance.paymen When payment  { paymentId,  Accounting
| ed  | t.received | recorded    | invoiceId,  | sync, receipt  |
| --- | ---------- | ----------- | ----------- | -------------- |
|     |            | (online or  | studentId,  | email          |
|     |            | offline)    | amount,     |                |
method,
receivedAt }
AttendanceMar attendance.mar When  { studentIds[],  Parent SMS,
| ked | ked | attendance      | date, status,  | daily summary |
| --- | --- | --------------- | -------------- | ------------- |
|     |     | marked (single  | markedBy,      |               |
|     |     | or bulk)        | markedAt }     |               |
73

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Event Name Event Type Trigger Payload Consumers
InvoiceGenerat finance.invoice. When invoice { invoiceId, Parent
ed generated created (single studentId, notification,
or bulk) amount, accounting sync
dueDate,
generatedAt }
ReportCardPubli academics.repo When report { studentId, Parent email,
shed rt.published card published classId, dashboard
for sectionId, badge
student/class termId,
publishedAt }
27.3 Webhook Payload Example
# HTTP POST to registered webhook URL
POST https://api.partner.com/preone/webhooks HTTP/1.1
Host: api.partner.com
Content-Type: application/json
X-PreOne-Event: student.admitted
X-Preone-Event-Id: evt_01HXY...
X-Preone-Delivery: del_01HXY...
X-PreOne-Signature: sha256=abc123def456...
X-PreOne-Timestamp: 2026-07-14T12:00:00Z
User-Agent: PreOne-Webhook/1.0
{
"event": "student.admitted",
"eventId": "evt_01HXY...",
"deliveryId": "del_01HXY...",
"timestamp": "2026-07-14T12:00:00Z",
"tenant": {
"id": "ten_01HXY...",
"name": "Sunshine Kids Group"
},
"data": {
"studentId": "stu_01HXY...",
"branchId": "br_01HXY...",
"academicYearId": "ay_01HXY...",
"admissionNo": "SKP-0001",
"firstName": "Aarav",
"lastName": "Sharma",
"admittedAt": "2026-07-14T12:00:00Z"
}
}
# Expected response from partner:
74

PreOne OpenAPI Spec v1.0 | API Specification Freeze
# HTTP 2xx = success (no retry)
# HTTP 4xx (except 429) = client error (no retry)
# HTTP 5xx or 429 = server error (retry with backoff)
75

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
28. Examples
28.1 Per-Endpoint Example Matrix
प्र(cid:7)त्याक(cid:14)  endpoint सा(cid:2)ठी(cid:5) standard set of examples provide क(cid:14) ल(cid:14) जे(cid:2)तो(cid:14) जे(cid:14) Swagger UI मध्या(cid:14) render
हा(cid:13)तो(cid:2)तो आणि(cid:18) SDK consumers reference सा(cid:2)ठी(cid:5) व(cid:2)प्ररू शकतो(cid:2)तो. हा(cid:14) examples spec मध्या (cid:14)inline न(cid:2)हा(cid:5)तो तोर
components/examples/ मध्या(cid:14) reusable definitions म्हा(cid:18)न7  defined आहा(cid:14)तो जे(cid:14) $ref द्वा(cid:2)र(cid:14) referenced
हा(cid:13)तो(cid:2)तो. हा(cid:14) approach example consistency साणि(नणिश्चीतो करतो(cid:13) — एक example अन(cid:14)क endpoints
reference करू शकतो(cid:13).
| Example Type | Description | Where Used |
| ------------ | ----------- | ---------- |
Request Example Full request body + headers +  All POST/PATCH endpoints
query params
| Success Response (200) | Standard success body | All endpoints |
| ---------------------- | --------------------- | ------------- |
Validation Error (400) Field-level error array All POST/PATCH endpoints
Permission Error (403) Insufficient scope error All secured endpoints
Not Found (404) Resource not found error All GET/PATCH/DELETE with
{id}
Conflict (409) Duplicate / version conflict POST create + PATCH update
Business Rule Violation (422) Domain invariant error Workflow transition
endpoints
| Rate Limited (429) | Rate limit + Retry-After  | All endpoints |
| ------------------ | ------------------------- | ------------- |
header
| Internal Error (500) | Generic error + traceId | All endpoints  |
| -------------------- | ----------------------- | -------------- |
| Pagination Example   | page=2&size=20 + meta   | List endpoints |
block
| Filter Example | ?   | List endpoints |
| -------------- | --- | -------------- |
filter=status:active,grade:LKG
| Sorting Example | ?sort=-createdAt,firstName | List endpoints |
| --------------- | -------------------------- | -------------- |
File Upload Example multipart/form-data payload Upload endpoints
Bulk Operation Example Array of operations + bulk  Bulk endpoints
response
76

PreOne OpenAPI Spec v1.0 | API Specification Freeze
28.2 Pagination Example
# Request with pagination
GET /students?page=2&size=20&sort=-createdAt,firstName HTTP/1.1
Host: api.preone.com
Authorization: Bearer eyJhbGc...
# Response 200:
{
"data": [
{ "id": "stu_01HXY...", "firstName": "Aarav", ... },
{ "id": "stu_02HXY...", "firstName": "Diya", ... }
],
"meta": {
"page": 2,
"size": 20,
"total": 145,
"totalPages": 8,
"hasNext": true,
"hasPrev": true
}
}
28.3 Filter Example
# Multiple filters combined
GET /students?
filter=status:active,gender:Male,classId:cls_01HXY...&page=1&size=50
HTTP/1.1
Host: api.preone.com
Authorization: Bearer eyJhbGc...
# Filter syntax: field:value pairs joined by comma
# Equality filter: status:active
# IN filter: status:active,pending (interpreted as OR)
# Range filter: createdAt:2026-07-01..2026-07-31
# Null check: deletedAt:null
28.4 File Upload Example
# Multipart form data upload
POST /students/stu_01HXY.../photo HTTP/1.1
Host: api.preone.com
Authorization: Bearer eyJhbGc...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="aarav.jpg"
Content-Type: image/jpeg
77

PreOne OpenAPI Spec v1.0 | API Specification Freeze
<binary data>
------WebKitFormBoundary--
# Response 201:
{
"fileId": "fil_01HXY...",
"url": "https://cdn.preone.com/students/stu_01HXY.../photo.jpg",
"size": 245678,
"mimeType": "image/jpeg",
"uploadedAt": "2026-07-14T16:00:00Z"
}
78

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
29. Tags
29.1 Tag Purpose
Tags हा(cid:14) Swagger UI मध्या (cid:14)endpoints grouping करण्या(cid:2)सा(cid:2)ठी(cid:5) व(cid:2)प्ररल (cid:14)जे(cid:2)तो(cid:2)तो. PreOne मध्या (cid:14)14 business
domains सा(cid:2)ठी(cid:5) 14 tags आहा(cid:14)तो जे (cid:14)domain names श(cid:5) match करतो(cid:2)तो. प्र(cid:7)त्याक(cid:14)  tag ची (cid:14)description, color,
आणि(cid:18) owner documented आहा(cid:14). Tag-based grouping द्वा(cid:2)र(cid:14) Swagger UI मध्या(cid:14) endpoints logical
sections मध्या (cid:14)organized णिदासातो(cid:2)तो — user क(cid:13)(cid:18)तो(cid:14)हा(cid:5) domain collapse णिक#व(cid:2) expand करू शकतो(cid:13).
Tag colors UI मध्या(cid:14) visual distinction दातो(cid:14) (cid:2)तो — Identity blue, CRM violet, Students emerald,
Finance green, इत्या(cid:2)दा(cid:5). हा (cid:14)colors brand palette श(cid:5) aligned आहा(cid:14)तो आणि(cid:18) Design System document
मध्या(cid:14) documented आहा(cid:14)तो. Tag descriptions Swagger UI मध्या(cid:14) group header मध्या(cid:14) display हा(cid:13)तो(cid:2)तो
ज्या(cid:2)मळे( (cid:14) user ल(cid:2) group purpose immediately सामजेतो(cid:13).
29.2 Tag Catalog
| Tag      | Description  | Color          | Primary Users     |
| -------- | ------------ | -------------- | ----------------- |
| Identity | User, role,  | Blue (#2563EB) | End-user + admin  |
|          | permission   |                | operations        |
management
| CRM | Lead, campaign,  | Violet (#7C3AED) | Marketing +     |
| --- | ---------------- | ---------------- | --------------- |
|     | follow-up        |                  | admissions team |
management
| Admissions | Admission             | Amber (#D97706)   | Admissions team +  |
| ---------- | --------------------- | ----------------- | ------------------ |
|            | application workflow  |                   | counselors         |
| Students   | Student record        | Emerald (#059669) | Branch admin +     |
|            | management            |                   | teachers           |
| Academics  | Classes, sections,    | Cyan (#0891B2)    | Academic           |
|            | subjects, timetable,  |                   | coordinators       |
exams
Attendance Daily attendance +  Rose (#E11D48) Teachers + transport
|     | transport attendance |     | staff |
| --- | -------------------- | --- | ----- |
Communication SMS, WhatsApp,  Indigo (#4F46E5) All staff + parents
email, chat,
notifications
Finance Invoices, payments,  Green (#16A34A) Accountants + admin
receipts, refunds
79

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Tag Description Color Primary Users
Inventory Items, stock, Orange (#EA580C) Inventory managers
purchase orders,
audit
HR Employees, leaves, Pink (#DB2777) HR team
payroll, attendance
Administration Branches, academic Slate (#475569) Branch admin
year, holidays, audit
Reports Standard + custom Teal (#0D9488) All staff
reports, scheduling
Settings Tenant config, Gray (#374151) Branch admin
theme, modules
Platform Multi-tenant, Crimson (#BE123C) Platform admin
subscriptions,
webhooks
29.3 Tag Definition Example
tags:
- name: Identity
description: |
User, role, permission, and session management.
Foundation for all authenticated operations.
x-preone-color: '#2563EB'
x-preone-owner: identity-team@preone.com
x-preone-sla: 99.9%
- name: Students
description: |
Student records management — profile, guardians,
address, academic history, fee history.
x-preone-color: '#059669'
x-preone-owner: student-team@preone.com
x-preone-sla: 99.95%
# Usage in path:
paths:
/students:
get:
tags: [Students]
summary: List students
...
post:
tags: [Students]
summary: Create student
80

PreOne OpenAPI Spec v1.0 | API Specification Freeze
...
81

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
30. Versioning
30.1 Versioning Strategy
PreOne API URI versioning द्वा(cid:2)र(cid:14) versioned आहा(cid:14) — version URL path मध्या(cid:14) (/api/v1, /api/v2). हा(cid:2)
approach header-based versioning  प्र(cid:14)क्षा(cid:2)  explicit  आहा(cid:14) आणि(cid:18)  SDKs  सा(cid:2)ठी(cid:5)  simpler  आहा(cid:14). URI
versioning ची(cid:2) drawback म्हा(cid:18)जे(cid:14) breaking changes नव(cid:5)न URL सा(cid:13)बतो या(cid:14)तो(cid:2)तो जे(cid:14) old URLs सा(cid:13)बतो
parallel run हा(cid:13)तो(cid:2)तो — हा(cid:14) operational cost आहा(cid:14) प्र(cid:18) client compatibility सा(cid:2)ठी(cid:5) necessary आहा(cid:14).
Multiple major versions 12 months parallel supported असातो(cid:2)तो.
Spec version (info.version field) SemVer convention follow करतो(cid:13) — MAJOR.MINOR.PATCH.
MAJOR bump द्वा(cid:2)र(cid:14) नव(cid:5)न URL version (/api/v2) आणि(cid:18) 12-month deprecation cycle triggered
हा(cid:13)तो(cid:13). MINOR bump द्वा(cid:2)र (cid:14)backward-compatible additions हा(cid:13)तो(cid:2)तो जे (cid:14)same URL (/api/v1) मध्या (cid:14)ship
हा(cid:13)तो(cid:2)तो. PATCH bump द्वा(cid:2)र (cid:14)bug fixes आणि(cid:18) doc updates हा(cid:13)तो(cid:2)तो. Status header X-API-Version प्र(cid:7)त्याक(cid:14)
response मध्या (cid:14)sent हा(cid:13)तो(cid:13) ज्या(cid:2)मळे( (cid:14) client आप्रल(cid:2) version pin णिक#व(cid:2) upgrade करू शकतो(cid:13).
30.2 Versioning Rules
| Rule | Pattern | Behavior | Example |
| ---- | ------- | -------- | ------- |
URI Versioning /api/v1, /api/v2 MAJOR version in  Breaking changes
|     |     | URL path | require new MAJOR |
| --- | --- | -------- | ----------------- |
Semantic Versioning MAJOR.MINOR.PATC info.version field in  Follows semver.org
|     | H (1.0.0) | spec | rules |
| --- | --------- | ---- | ----- |
MAJOR Bump Breaking change —  New URL version +  Existing v1 frozen; v2
|     | schema/enum/route | 12-month  | in parallel |
| --- | ----------------- | --------- | ----------- |
deprecation
| MINOR Bump | New endpoint, new  | Same URL version | Backward           |
| ---------- | ------------------ | ---------------- | ------------------ |
|            | field (optional)   |                  | compatible         |
| PATCH Bump | Bug fix, doc       | Same URL version | No behavior change |
clarification
Field Addition Optional new field in  MINOR bump Old clients ignore
|     | response |     | unknown fields |
| --- | -------- | --- | -------------- |
Field Removal Field marked  MINOR → MAJOR  Deprecation header
|     | deprecated then  | (after 12 months) | returned |
| --- | ---------------- | ----------------- | -------- |
removed
82

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Rule Pattern Behavior Example
Enum Addition New enum value MINOR bump Clients must handle
added unknown enum
values
Enum Removal Value marked MINOR → MAJOR Clients must validate
deprecated then (after 12 months) enum
removed
Status Header X-API-Version: 1.0.0 Returned on every Client can pin or
response upgrade
30.3 Breaking Change Detection
CI pipeline मध्या(cid:14) oasdiff tool द्वा(cid:2)र(cid:14) breaking change detection run हा(cid:13)तो(cid:13). हा(cid:14) tool PR मधी(cid:5)ल spec
changes compare करून main branch श(cid:5) breaking changes identify करतो(cid:13). Breaking changes
include: required field addition, field removal, type change, enum value removal, endpoint
removal, URL change. Breaking changes detected झा(cid:2)ल्या(cid:2)सा PR block हा(cid:13)तो(cid:13) आणि(cid:18) API Owner
approval required हा(cid:13)तो(cid:13).
# CI pipeline breaking change detection
- name: Check for breaking changes
run: |
npx oasdiff breaking main.yaml pr.yaml \
--format html \
--output breaking-changes-report.html
if [ -s breaking-changes-report.html ]; then
echo "Breaking changes detected!"
cat breaking-changes-report.html
exit 1
fi
83

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
31. Deprecation Policy
31.1 Deprecation Lifecycle
Endpoints आणि(cid:18) fields deprecate करण्या(cid:2)ची(cid:2) clear 12-month lifecycle documented आहा(cid:14). हा(cid:14)
lifecycle 6 stages मध्या(cid:14) divided आहा(cid:14) जे(cid:14) gradually client migration enforce करतो(cid:2)तो. Stage 1
announcement सा(cid:13)बतो सारू(  हा(cid:13)तो(cid:13) आणि(cid:18) Stage 6 (removal) सा(cid:13)बतो complete हा(cid:13)तो(cid:13). या(cid:2) दारम्या(cid:2)न clients ल(cid:2)
multiple warnings + time + tools provided हा(cid:13)तो(cid:2)तो migration सा(cid:2)ठी(cid:5). हा(cid:14) policy RFC 8594 (Sunset
HTTP Header) श(cid:5) aligned आहा(cid:14).
Deprecation decision API Owner च्या(cid:2) approval नतो# रची announce हा(cid:13)तो(cid:13). Major deprecations
customer advisory board सा(cid:13)बतो discussed हा(cid:13)तो(cid:2)तो ज्या(cid:2)मळे( (cid:14) feedback gathered हा(cid:13)तो(cid:13). Per-tenant
deprecation usage tracked र(cid:2)हातो(cid:13) — क(cid:13)(cid:18)तो(cid:2) tenant क(cid:13)(cid:18)तो(cid:2) deprecated endpoint व(cid:2)प्ररतो आहा(cid:14) हा(cid:14)
dashboard  मध्या(cid:14)  visible  आहा(cid:14). Stage 4 (email notification)  मध्या(cid:14) प्र(cid:7)त्याक(cid:14)  affected tenant  ल(cid:2)
personalized email जे(cid:2)तो(cid:13) ज्या(cid:2)मध्या(cid:14) त्या(cid:2)च्# या(cid:2) usage details आणि(cid:18) migration guide असातो(cid:14).
31.2 Deprecation Stages
| Stage        | Action        | Timeline | Effect            |
| ------------ | ------------- | -------- | ----------------- |
| Stage 1 —    | Deprecation   | Day 0    | Swagger UI shows  |
| Announcement | announced in  |          | strikethrough     |
changelog + spec x-
deprecated: true
Stage 2 — Warning  Deprecation + Sunset  Day 0 — 90 Clients see warnings
| Header                | headers returned |              | in console  |
| --------------------- | ---------------- | ------------ | ----------- |
| Stage 3 — Rate Limit  | Deprecated       | Day 90 — 180 | Encourages  |
| Reduction             | endpoints rate-  |              | migration   |
limited more
aggressively
Stage 4 — Email  Per-tenant email  Day 180 — 270 Active outreach
| Notification | listing deprecated  |     |     |
| ------------ | ------------------- | --- | --- |
endpoints in use
Stage 5 — Sunset  Sunset header with  Day 270 — 365 Final warning
| Header            | specific date         |          |             |
| ----------------- | --------------------- | -------- | ----------- |
| Stage 6 — Removal | Endpoint returns 410  | Day 365+ | Removed     |
|                   | Gone                  |          | permanently |
84

PreOne OpenAPI Spec v1.0 | API Specification Freeze
31.3 Deprecation Spec Example
# OpenAPI deprecation syntax
paths:
/students/{id}/photo:
get:
deprecated: true
summary: Get student photo (deprecated)
description: |
**DEPRECATED**: Use GET /students/{id}/assets/photo instead.
This endpoint will be removed on 2027-07-14.
parameters:
- name: id
in: path
required: true
schema:
type: string
format: uuid
responses:
'200':
description: Photo retrieved
headers:
Deprecation:
schema:
type: string
description: 'true'
Sunset:
schema:
type: string
description: 'Sunset date: 2027-07-14'
Link:
schema:
type: string
description: '</students/{id}/assets/photo>; rel="successor-version"'
85

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
32. SDK Generation
32.1 SDK Targets
PreOne specification वरून 10 programming languages सा(cid:2)ठी(cid:5) SDKs auto-generate हा(cid:13)तो(cid:2)तो. SDK
generation CI pipeline मध्या(cid:14) spec merge वर triggered हा(cid:13)तो(cid:13) आणि(cid:18) package managers (npm,
pub.dev, Maven Central, NuGet, PyPI, RubyGems, Packagist, etc.) वर published हा(cid:13)तो(cid:2)तो. SDKs
type-safe  आहा(cid:14)तो —  TypeScript SDK full type definitions provide  करतो(cid:13), Java/C# SDKs
POJOs/PONOs generate करतो(cid:2)तो. SDK versioning spec version श(cid:5) synced आहा (cid:14)— spec v1.2.0 →
SDK v1.2.0.
Primary SDK (most used) हा(cid:2) TypeScript SDK आहा(cid:14) जे(cid:13) PreOne च्या(cid:2) own frontend + mobile apps
consume  करतो(cid:2)तो. Secondary SDKs partner integrations  सा(cid:2)ठी(cid:5) आहा(cid:14)तो —  partner system
language नसा( (cid:2)र appropriate SDK व(cid:2)प्ररतो(cid:2)तो. Mobile-first partners सा(cid:2)ठी(cid:5) Flutter/Dart SDK आहा(cid:14),
enterprise customers सा(cid:2)ठी(cid:5) Java/C# SDKs आहा(cid:14)तो, data science use cases सा(cid:2)ठी(cid:5) Python SDK आहा(cid:14).
SDK documentation auto-generated + examples spec मधीन7  sourced हा(cid:13)तो(cid:2)तो.
32.2 SDK Targets Catalog
| SDK Name | Package | Use Case | Generator | Distribution |
| -------- | ------- | -------- | --------- | ------------ |
TypeScript SDK @preone/sdk-ts Frontend +  Auto-generated  npm install
|     |     | Node.js | via openapi- |     |
| --- | --- | ------- | ------------ | --- |
typescript-
codegen
JavaScript SDK @preone/sdk-js Browser-only Bundled TS,  CDN available
transpiled
Python SDK preone-python Backend  Generated via  pip install
|     |     | integrations +  | openapi-      | preone |
| --- | --- | --------------- | ------------- | ------ |
|     |     | data science    | python-client |        |
Java SDK io.preone:sdk- Enterprise  Generated via  Maven Central
|     | java | integrations | openapi- |     |
| --- | ---- | ------------ | -------- | --- |
generator
| C# SDK | PreOne.Sdk | .NET         | Generated via  | NuGet |
| ------ | ---------- | ------------ | -------------- | ----- |
|        |            | integrations | openapi-       |       |
generator
(csharp)
86

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| SDK Name | Package | Use Case | Generator | Distribution |
| -------- | ------- | -------- | --------- | ------------ |
Dart/Flutter SDK preone_dart Mobile app  Generated via  pub.dev
|     |     | (Flutter) | openapi- |     |
| --- | --- | --------- | -------- | --- |
generator (dart-
dio)
| Go SDK  | github.com/    | Microservices +  | Generated via  | go get    |
| ------- | -------------- | ---------------- | -------------- | --------- |
|         | preone/sdk-go  | CLI tools        | oapi-codegen   |           |
| PHP SDK | preone/sdk-php | Legacy CMS       | Generated via  | Packagist |
|         |                | integrations     | openapi-       |           |
generator (php)
| Ruby SDK | preone-sdk | Rails        | Generated via  | RubyGems |
| -------- | ---------- | ------------ | -------------- | -------- |
|          |            | integrations | openapi-       |          |
generator (ruby)
Swift SDK PreOneSDK iOS native app  Generated via  Swift Package
|     |     | (future) | openapi- | Manager |
| --- | --- | -------- | -------- | ------- |
generator
(swift5)
32.3 TypeScript SDK Example
// npm install @preone/sdk-ts
import { PreOneClient } from '@preone/sdk-ts';

const client = new PreOneClient({
  environment: 'production',  // 'production' | 'staging' | 'qa' | 'local'
  accessToken: 'eyJhbGciOiJSUzI1NiIs...',
  tenantId: 'ten_01HXY...',
  branchId: 'br_01HXY...'
});

// List students with pagination
const response = await client.students.list({
  page: 1,
  size: 20,
  sort: '-createdAt',
  filter: 'status:active'
});

console.log(response.data);        // Student[]
console.log(response.meta.total);  // 145

// Create student
const newStudent = await client.students.create({
87

PreOne OpenAPI Spec v1.0 | API Specification Freeze
firstName: 'Aarav',
lastName: 'Sharma',
dob: '2020-05-15',
gender: 'Male'
});
// Type-safe — IntelliSense + compile-time checks
// All types auto-generated from OpenAPI spec
88

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
33. Validation Rules
33.1 Validation Standards
Swagger schema मध्या(cid:14) validation rules declaratively defined आहा(cid:14)तो. हा(cid:14) rules frontend (Zod),
backend (class-validator), आणि(cid:18) SDKs साव+ consumers द्वा(cid:2)र(cid:14) enforced हा(cid:13)तो(cid:2)तो. Validation layered
approach follow करतो(cid:13) — frontend first validation करतो(cid:13) (instant feedback), backend re-
validates (security), आणि(cid:18) database constraints final safety net आहा(cid:14)तो. OpenAPI spec हा(cid:5) single
| source of truth आहा(cid:14) णिजेथान7 |  साव+ layers ची (cid:14)validation rules derived हा(cid:13)तो(cid:2)तो. |     |     |
| ------------------------------------ | ----------------------------------------------------------------------- | --- | --- |
Validation rules 14 categories मध्या(cid:14) organized आहा(cid:14)तो: required fields, string length, regex
patterns, enum values, date formats, UUID format, email format, URI format, decimal
precision, numeric range, array constraints, object constraints, nullable fields, आणि(cid:18) custom
validators. Custom validators domain-specific rules सा(cid:2)ठी(cid:5) आहा(cid:14)तो — उदा(cid:2). mobileNumber (10-
digit Indian mobile), aadhaarNumber (12-digit + Verhoff algorithm), panNumber (10-char
alphanumeric + checksum).
33.2 Validation Rules Catalog
| Rule Type | Spec Syntax | Description | Backend  |
| --------- | ----------- | ----------- | -------- |
Enforcement
Required Fields required: [firstName,  Spec enforces  Backend re-validates
|     | dob, gender] | presence at request  |     |
| --- | ------------ | -------------------- | --- |
level
String Length minLength /  E.g., firstName: 1- Backend rejects with
|     | maxLength | 100 chars | VALIDATION_ERROR |
| --- | --------- | --------- | ---------------- |
Regex Patterns pattern: '^[A-Z]{3}-\ PCRE-compatible  Used for admission
|     | \d{4}$' | regex | numbers, codes |
| --- | ------- | ----- | -------------- |
Enum Values enum: [Male,  Closed enum —  Backend re-validates
|     | Female, Other] | additional values  | against domain  |
| --- | -------------- | ------------------ | --------------- |
|     |                | rejected           | enum            |
Date Formats format: date (YYYY- ISO 8601 strict date-time for
|              | MM-DD)        |                     | timestamps             |
| ------------ | ------------- | ------------------- | ---------------------- |
| UUID Format  | format: uuid  | RFC 4122 v4         | All entity identifiers |
| Email Format | format: email | RFC 5322 simplified | Backend uses           |
validator.js
89

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Rule Type | Spec Syntax | Description | Backend  |
| --------- | ----------- | ----------- | -------- |
Enforcement
| URI Format | format: uri | Must be valid  | Used for webhooks,  |
| ---------- | ----------- | -------------- | ------------------- |
|            |             | absolute URL   | file URLs           |
Decimal Precision multipleOf: 0.01 Currency precision Backend uses
Decimal.js
| Numeric Range | minimum /  | Inclusive bounds | exclusiveMinimum  |
| ------------- | ---------- | ---------------- | ----------------- |
|               | maximum    |                  | for strict bounds |
Array Constraints minItems / maxItems  E.g., bulk max 100  Backend enforces
|     | / uniqueItems | items | hard limit |
| --- | ------------- | ----- | ---------- |
Object Constraints minProperties /  E.g., filter object max  Prevents query
|     | maxProperties | 10 keys | explosion |
| --- | ------------- | ------- | --------- |
Nullable Fields type: [string, null] OpenAPI 3.1 nullable  Backend treats null
|     |     | syntax | as absent |
| --- | --- | ------ | --------- |
Custom Validators x-preone-validator:  Extension for domain  Backend uses custom
|     | mobileNumber | validators | Zod refinements |
| --- | ------------ | ---------- | --------------- |
33.3 Validation Example
components:
  schemas:
    StudentCreateRequest:
      type: object
      required: [firstName, mobile, dob, gender]
      properties:
        firstName:
          type: string
          minLength: 1
          maxLength: 100
          pattern: '^[a-zA-Z\\s]+$'
          description: Alphabetic + spaces only
        mobile:
          type: string
          pattern: '^[6-9]\\d{9}$'
          description: 10-digit Indian mobile starting 6-9
          x-preone-validator: mobileNumber
        dob:
          type: string
          format: date
          x-preone-validator: notFutureDate
        gender:
          type: string
          enum: [Male, Female, Other]
90

PreOne OpenAPI Spec v1.0 | API Specification Freeze
email:
type: [string, null]
format: email
description: Optional, must be valid email if provided
admissionNo:
type: string
pattern: '^[A-Z]{3}-\\d{4}$'
description: 3 uppercase letters + dash + 4 digits (e.g., SKP-0001)
guardians:
type: array
minItems: 1
maxItems: 4
uniqueItems: true
items:
$ref: '#/components/schemas/GuardianRequest'
additionalProperties: false
# Generated TypeScript type (auto-generated):
interface StudentCreateRequest {
firstName: string; // 1-100 chars, alphabetic+spaces
mobile: string; // 10-digit Indian mobile
dob: string; // ISO date, not future
gender: 'Male' | 'Female' | 'Other';
email?: string | null; // RFC 5322 email
admissionNo?: string; // SKP-0001 format
guardians: GuardianRequest[]; // 1-4 unique items
}
91

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
34. Governance
34.1 Governance Overview
API governance हा(cid:2) process आहा (cid:14)ज्या(cid:2)द्वा(cid:2)र (cid:14)API spec changes controlled, reviewed, आणि(cid:18) published
हा(cid:13)तो(cid:2)तो. PreOne  च्या(cid:2)  governance model  मध्या(cid:14)  6 defined roles  आहा(cid:14)तो ज्या(cid:2)च्# या(cid:2) प्र(cid:2)सा  specific
responsibilities आहा(cid:14)तो. हा (cid:14)roles ensure करतो(cid:2)तो क(cid:5) spec changes high quality, secure, compliant,
आणि(cid:18) developer-friendly आहा(cid:14)तो. क(cid:13)(cid:18)तो(cid:2)हा(cid:5) change फक्तो PR-based approval workflow द्वा(cid:2)र(cid:14) spec
मध्या (cid:14)merge हा(cid:13)तो(cid:13) — direct commits strictly forbidden आहा(cid:14)तो.
Governance workflow 10 steps  मध्या(cid:14)  divided  आहा(cid:14) जे(cid:14)  spec change announcement  प्र(cid:2)सान7

customer notification प्रया+तो#  complete journey define करतो(cid:2)तो. प्र(cid:7)त्याक(cid:14)  step automated णिजेथा(cid:14)
possible  आहा(cid:14) —  linting, breaking change detection, SDK regeneration, Swagger UI
deployment. Manual steps review sign-off, changelog edit, आणि(cid:18) customer communication
आहा(cid:14)तो. हा(cid:14) workflow API quality + reliability साणि(नणिश्चीतो करतो(cid:13).
34.2 Governance Roles
| Role      | Held By         | Responsibilities | Approval Authority |
| --------- | --------------- | ---------------- | ------------------ |
| API Owner | Product Manager | Owns endpoint    | Approval required  |
|           |                 | lifecycle,       | for MAJOR bumps    |
deprecation,
breaking changes
API Architect Tech Lead Owns spec structure,  Approval required
|     |     | naming, common  | for new tags |
| --- | --- | --------------- | ------------ |
components
| Spec Maintainer | Senior Engineer | Day-to-day spec   | Maintains    |
| --------------- | --------------- | ----------------- | ------------ |
|                 |                 | edits, PR reviews | openapi.yaml |
Security Reviewer Security Engineer Reviews auth flows,  Required sign-off for
|     |     | scopes, sensitive  | new auth schemes |
| --- | --- | ------------------ | ---------------- |
endpoints
DX Reviewer DX Engineer Reviews SDK quality,  Required sign-off for
|     |     | examples, docs | public endpoints |
| --- | --- | -------------- | ---------------- |
Compliance  Compliance Officer Reviews PII handling,  Required for
| Reviewer |     | audit logging | endpoints touching  |
| -------- | --- | ------------- | ------------------- |
student/finance data
92

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
34.3 Governance Workflow
| Step | Action | Notes |
| ---- | ------ | ----- |
1. Spec Change PR Author submits PR against  All changes via PR — no
|     | openapi.yaml | direct commits |
| --- | ------------ | -------------- |
2. Automated Lint Redocly CLI + Spectral run in  Must pass — no warnings
|     | CI  | allowed |
| --- | --- | ------- |
3. Breaking Change Detection oasdiff runs against main  Breaking changes flag for API
|     | branch | Owner review |
| --- | ------ | ------------ |
4. Reviewer Assignment Auto-assigned based on  1 reviewer minimum; 2 for
|                    | changed tags         | breaking changes      |
| ------------------ | -------------------- | --------------------- |
| 5. Review Sign-off | Reviewers approve    | All comments resolved |
| 6. Merge to Main   | Squash merge to main | Spec frozen on merge  |
7. SDK Regeneration CI generates SDKs for all  SDKs published to package
|                      | targets               | managers |
| -------------------- | --------------------- | -------- |
| 8. Swagger UI Update | Swagger UI redeployed | Live at  |
developers.preone.com
9. Changelog Update Auto-generated changelog  Manual edit for narrative
PR
10. Customer Notification For MINOR/MAJOR bumps —  30-day advance for MAJOR
|     | email + dashboard banner | bumps |
| --- | ------------------------ | ----- |
34.4 Governance Tools
# CI pipeline (GitHub Actions)
name: OpenAPI Spec Validation
on:
  pull_request:
    paths: ['specs/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
93

PreOne OpenAPI Spec v1.0 | API Specification Freeze
with:
node-version: 20
- name: Install Redocly CLI
run: npm install -g @redocly/cli@latest
- name: Lint OpenAPI spec
run: redocly lint specs/openapi.yaml --config redocly.yaml
- name: Bundle spec
run: redocly bundle specs/openapi.yaml --output bundled.yaml
- name: Detect breaking changes
run: |
git fetch origin main
npx oasdiff breaking origin/main:specs/openapi.yaml specs/openapi.yaml
\
--format text
- name: Validate examples
run: npx @stoplight/spectral-cli lint specs/openapi.yaml
- name: Generate SDKs (dry-run)
run: |
npx openapi-typescript-codegen --input bundled.yaml \
--output /tmp/sdk-ts --client axios
- name: Post comment with summary
uses: actions/github-script@v7
with:
script: |
github.rest.issues.createComment({
issue_number: context.issue.number,
owner: context.repo.owner,
repo: context.repo.repo,
body: '✅ OpenAPI spec validation passed'
})
94

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
35. Generated Deliverables
35.1 Automation Pipeline
या(cid:2) specification वरून automate हा(cid:13)(cid:18)(cid:2)र (cid:14)artifacts हा(cid:5) document ची(cid:2) primary value proposition आहा(cid:14).
Manual maintenance न करतो(cid:2) spec एक बदालल(cid:2) क(cid:5) साव+ downstream artifacts regenerate हा(cid:13)तो(cid:2)तो.
हा (cid:14)automation CI/CD pipeline द्वा(cid:2)र (cid:14)handled हा(cid:13)तो(cid:13) जे(cid:13) spec merge वर triggered हा(cid:13)तो(cid:13). प्र(cid:7)त्याक(cid:14)  artifact
ची(cid:5) quality gate defined आहा(cid:14) — SDKs ची(cid:14) tests run हा(cid:13)तो(cid:2)तो, Postman collection ची(cid:14) contract tests
run हा(cid:13)तो(cid:2)तो, Swagger UI ची (cid:14)visual regression tests run हा(cid:13)तो(cid:2)तो.
Artifact generation timing different आहा(cid:14). Swagger UI + Postman Collection immediate
deploy हा(cid:13)तो(cid:2)तो (within minutes of merge). SDKs ची(cid:14) publish हा(cid:14) release tag वर triggered हा(cid:13)तो(cid:13)
(scheduled releases weekly). Mock server continuously updated हा(cid:13)तो(cid:13) with latest spec.
Contract tests every CI run मध्या(cid:14) executed हा(cid:13)तो(cid:2)तो. हा(cid:14) staged approach balance दातो(cid:14) (cid:13) — quick
iteration सा(cid:2)ठी(cid:5) immediate artifacts, stability सा(cid:2)ठी(cid:5) release-gated SDKs.
35.2 Deliverables Catalog
| Artifact   | Purpose          | Location            | Update Trigger      |
| ---------- | ---------------- | ------------------- | ------------------- |
| Swagger UI | Interactive API  | Hosted at           | Auto-deployed from  |
|            | explorer         | developers.preone.c | main                |
om/api-explorer
OpenAPI 3.1 YAML Canonical spec file openapi.yaml in  Source of truth
monorepo
OpenAPI JSON Machine-readable  openapi.json  For tools that prefer
|     | spec | (generated) | JSON |
| --- | ---- | ----------- | ---- |
Postman Collection Importable collection  PreOne.postman_col Per-environment
|             | + environments    | lection.json    | variables       |
| ----------- | ----------------- | --------------- | --------------- |
| Mock Server | Prism-based mock  | Hosted at       | For frontend +  |
|             | server            | mock.preone.com | mobile dev      |
TypeScript SDK Generated TS client @preone/sdk-ts on  Auto-published on
|     |     | npm | merge |
| --- | --- | --- | ----- |
Flutter/Dart SDK Generated Dart  preone_dart on  For mobile app
|        | client              | pub.dev        |                 |
| ------ | ------------------- | -------------- | --------------- |
| C# SDK | Generated C# client | PreOne.Sdk on  | For enterprise  |
|        |                     | NuGet          | integrations    |
95

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
| Artifact | Purpose         | Location            | Update Trigger  |
| -------- | --------------- | ------------------- | --------------- |
| Java SDK | Generated Java  | io.preone:sdk-java  | For enterprise  |
|          | client          | on Maven            | integrations    |
API Test Collections Contract +  Postman + Newman  Runs on every spec
|     | integration tests | CI  | change |
| --- | ----------------- | --- | ------ |
Contract Validation Pact-style contract  Backend implements  Bidirectional
|     | tests | + spec validates | contract testing |
| --- | ----- | ---------------- | ---------------- |
Client Code  Auto-generated  10 target languages Per release tag
| Generation | clients for all  |     |     |
| ---------- | ---------------- | --- | --- |
languages
35.3 Quality Gates
प्र(cid:7)त्याक(cid:14)  generated artifact ची (cid:14)quality gate आहा(cid:14) जे (cid:14)ensure करतो(cid:14) क(cid:5) artifact production-ready आहा(cid:14):
•  Swagger UI — visual regression tests via Playwright
•  Postman Collection — Newman contract tests against staging
•  Mock Server — Prism schema validation against spec
•  TypeScript SDK — generated types compile + sample app builds
•  Dart SDK — flutter analyze + sample app builds
•  Java SDK — mvn test + sample integration test
•  C# SDK — dotnet test + sample integration test
•  Contract Tests — backend implementation matches spec
96

PreOne OpenAPI Spec v1.0 | API Specification Freeze
36. Glossary
36.1 Terms
Term Definition
OpenAPI Specification for describing HTTP APIs
(formerly Swagger Spec)
Swagger UI Interactive UI for browsing OpenAPI specs
JWT JSON Web Token — compact, self-contained
auth token
RBAC Role-Based Access Control
Scope Granular permission identifier (e.g.,
student:read)
Aggregate Cluster of domain objects treated as a unit
(DDD)
Webhook HTTP callback triggered by an event
WebSocket Persistent bi-directional communication
channel
Idempotency Key Client-generated UUID for safe retry of write
operations
Rate Limiting Restricting request count per client per time
window
Tenant Customer organization in a multi-tenant
system
Branch Sub-tenant unit (a single preschool location)
Academic Year Yearly academic period (e.g., 2025-2026)
Deprecation Marking an endpoint as scheduled for
removal
Sunset Header HTTP header announcing future endpoint
removal date
SDK Software Development Kit — client library for
consuming an API
Contract Test Test verifying API conforms to its specification
97

PreOne OpenAPI Spec v1.0 | API Specification Freeze
Term Definition
Mock Server Server mimicking API behavior from spec, for
development
Discriminator OpenAPI field for choosing schema variant by
type field
$ref Reference to a reusable component within or
external to spec
37. Document Control
37.1 Document Information
Document Title PreOne Enterprise OpenAPI Specification
Document Version 1.0
Status API Specification Freeze
Specification OpenAPI 3.1
Date 2026-07-14
Product PreOne — Enterprise Preschool Operating
System
Predecessor Vision v1.0, Master PRD v1.0, DDD v1.0, ERD
v3.0, API Contract Catalog v1.0
Successor Swagger UI, Postman Collection, SDK
Generation, Mock Server, Backend Validation,
API Testing
Classification Internal Engineering Reference
Prepared by PreOne Architecture & Engineering Team
98

PreOne OpenAPI Spec v1.0  |  API Specification Freeze
37.2 Change History
| Version | Date       | Author            | Changes              |
| ------- | ---------- | ----------------- | -------------------- |
| 1.0     | 2026-07-14 | Architecture Team | Initial freeze — 34  |
sections covering 14
domains, ~530 APIs,
WebSocket,
Webhooks, SDK
generation,
governance
| 0.9 | 2026-07-10 | Architecture Team | Pre-freeze draft —  |
| --- | ---------- | ----------------- | ------------------- |
internal review
feedback
incorporated
| 0.5 | 2026-07-01 | Architecture Team | Initial draft —  |
| --- | ---------- | ----------------- | ---------------- |
sections 1-12
(standards, auth,
components)
| 0.1 | 2026-06-15 | Architecture Team | Skeleton — TOC +  |
| --- | ---------- | ----------------- | ----------------- |
section headers +
placeholder content
37.3 Approval Matrix
| Role      | Name | Responsibility       | Status  |
| --------- | ---- | -------------------- | ------- |
| API Owner | —    | Endpoint lifecycle,  | Pending |
deprecation
decisions
| API Architect | —   | Spec structure,  | Pending |
| ------------- | --- | ---------------- | ------- |
naming, components
| Security Reviewer | —   | Auth flows, scopes,  | Pending |
| ----------------- | --- | -------------------- | ------- |
sensitive endpoints
| DX Reviewer | —   | SDK quality,  | Pending |
| ----------- | --- | ------------- | ------- |
examples,
documentation
| Compliance  | —   | PII handling, audit  | Pending |
| ----------- | --- | -------------------- | ------- |
| Reviewer    |     | logging              |         |
99

PreOne OpenAPI Spec v1.0 | API Specification Freeze
37.4 Next Steps
• Architecture review board sign-off (this week)
• Security review for OAuth2 + SSO roadmap (next sprint)
• Engineering team walkthrough + Q&A session
• Partner integration team enablement + SDK onboarding
• Customer advisory board notification of v1.0 freeze
• Backend implementation kickoff — controllers + DTOs from spec
• Frontend + mobile SDK consumption patterns documentation
• Contract test suite development against spec
• Postman Collection + Newman CI integration
• Swagger UI deployment to developers.preone.com
100