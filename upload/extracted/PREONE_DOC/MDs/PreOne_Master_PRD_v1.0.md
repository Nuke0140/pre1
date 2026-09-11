P R E O N E E N T E R P R I S E
PreOne Master PRD
Enterprise Preschool Operating System
Document Version: 1.0
Status: Product Freeze
Date: 2026-07-12
Product: PreOne — Enterprise Preschool OS
Predecessor: Vision v1.0, BPM v1.0, BRC v1.0
Classification: Internal Engineering Reference
Prepared by: PreOne Product & Engineering Team
PreOne Platform Master PRD v1.0

PreOne Master PRD v1.0 | Product Freeze
Table of Contents
1. Introduction...................................................................................................................1
1.1 Purpose...........................................................................................................................1
1.2 Scope..............................................................................................................................2
1.3 Document Conventions..................................................................................................2
1.4 Related Documents........................................................................................................2
2. Product Overview...........................................................................................................3
2.1 Product Vision................................................................................................................3
2.2 Objectives.......................................................................................................................3
2.3 Target Users....................................................................................................................4
2.4 Product Pillars.................................................................................................................4
2.5 Architecture Snapshot....................................................................................................5
3. Business Requirements (BR)...........................................................................................6
3.1 Business Requirement Template...................................................................................6
4. Functional Requirements (FR).........................................................................................6
4.1 Sample FR Detail — FR-001 User Authentication..........................................................7
4.2 Functional Requirement Template................................................................................7
5. Non-Functional Requirements (NFR)...............................................................................8
5.1 Performance...................................................................................................................8
5.2 Availability......................................................................................................................8
5.3 Scalability........................................................................................................................9
5.4 Security...........................................................................................................................9
5.5 Reliability........................................................................................................................9
5.6 Maintainability...............................................................................................................9
5.7 Usability........................................................................................................................10
1

PreOne Master PRD v1.0 | Product Freeze
5.8 Localization...................................................................................................................10
5.9 NFR Template...............................................................................................................10
6. Business Rules..............................................................................................................10
6.1 Rule Categories Summary............................................................................................11
6.2 Sample Business Rules.................................................................................................11
6.2.1 Eligibility & Admission.........................................................................................11
6.2.2 Financial & Fee....................................................................................................12
6.2.3 Compliance..........................................................................................................12
6.3 Compliance Framework Mapping................................................................................12
7. User Roles & Permissions..............................................................................................12
7.1 Role Definitions............................................................................................................13
7.2 RBAC Permission Matrix...............................................................................................13
7.3 Permission Principles....................................................................................................13
8. Module Requirements..................................................................................................15
8.1 Marketing & CRM.........................................................................................................15
8.2 Admissions....................................................................................................................15
8.3 Student Lifecycle..........................................................................................................16
8.4 Academics.....................................................................................................................16
8.5 Daily Operations...........................................................................................................17
8.6 Parent Communication................................................................................................17
8.7 Finance.........................................................................................................................17
8.8 Inventory & Procurement............................................................................................18
8.9 Human Resources.........................................................................................................18
8.10 Administration............................................................................................................18
8.11 Reports & Analytics....................................................................................................19
8.12 Settings.......................................................................................................................19
8.13 Platform Management...............................................................................................20
9. Reports & Analytics......................................................................................................20
2

PreOne Master PRD v1.0 | Product Freeze
9.1 Operational Reports.....................................................................................................20
9.2 Academic Reports.........................................................................................................21
9.3 Financial Reports..........................................................................................................21
9.4 Management Reports...................................................................................................21
9.5 Compliance Reports.....................................................................................................21
10. Integrations................................................................................................................22
10.1 Payment Gateway Integration...................................................................................22
10.2 SMS Gateway Integration...........................................................................................22
10.3 WhatsApp Business Integration.................................................................................22
10.4 Email Integration........................................................................................................23
10.5 Biometric Integration.................................................................................................23
10.6 AI / LLM Integration...................................................................................................23
10.7 Cloud Storage Integration..........................................................................................23
10.8 Identity & SSO Integration.........................................................................................24
11. Acceptance Criteria (AC).............................................................................................24
11.1 Acceptance Criteria Template....................................................................................24
12. Out of Scope...............................................................................................................25
12.1 Explicitly Excluded from v1.0......................................................................................25
12.2 Future Roadmap Placeholder.....................................................................................25
13. Traceability Matrix (RTM)...........................................................................................26
13.1 Requirements Flow....................................................................................................27
13.2 Master Traceability Matrix.........................................................................................27
13.3 Coverage Summary....................................................................................................27
13.4 Traceability Process....................................................................................................28
Appendix A: Document Control........................................................................................29
A.1 Version History.............................................................................................................29
A.2 Approval Matrix...........................................................................................................29
A.3 Review Cadence...........................................................................................................29
3

PreOne Master PRD v1.0 | Product Freeze
A.4 Distribution List............................................................................................................30
A.5 Companion Documents...............................................................................................31
Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-
click the TOC and select "Update Field."
4

PreOne Master PRD v1.0  |  Product Freeze
1. Introduction
1.1 Purpose
या(cid:2) दस्तऐवजा(cid:2)चा(cid:2) उद्देश(cid:13)  PreOne Platform मधी(cid:17)ल सव (cid:20)Functional आणि(cid:23) Business Requirements स्पष्टप(cid:23) (cid:13)
define कर(cid:23) (cid:13)आहे(cid:13). हे(cid:2) Master PRD product development lifecycle मधी(cid:17)ल authoritative reference
document आहे(cid:13), जा(cid:30) engineering team ल(cid:2) implementation scope दत(cid:13) (cid:30), QA team ल(cid:2) acceptance
| criteria दत(cid:13) | (cid:30), आणि(cid:23) business stakeholders ल(cid:2) commitment lock दत(cid:13) |     |     | (cid:30). |
| ------------------- | ------------------------------------------------------------------------------- | --- | --- | --------- |
हे(cid:2) document Vision v1.0, BPM v1.0 आणि(cid:23) BRC v1.0 चा(cid:2) natural successor आहे(cid:13). Vision ने(cid:13) "क ठे(cid:13)
जा(cid:2)याचा"(cid:13)  स(cid:2)णि"#तल,(cid:13)  BPM ने(cid:13) "कस(cid:13) चा(cid:2)लव(cid:2)याचा"(cid:13)  detailed क(cid:13) ल,(cid:13)  BRC ने(cid:13) "क(cid:30)(cid:23)त(cid:13) rules enforce कर(cid:2)याचा"(cid:13)  list
क(cid:13) ल,(cid:13)  आणि(cid:23) Master PRD आत(cid:2) "क(cid:2)या build कर(cid:2)याचा"(cid:13)  exactly define करत(cid:13). प$त्याक(cid:13)  requirement
traceable आहे (cid:13)— BR वरूने FR पया(cid:20)त" , FR वरूने BRC rule पया(cid:20)त" , आणि(cid:23) श(cid:13)वट(cid:17) acceptance criterion पया(cid:20)त" .
1.2 Scope
PreOne खा(cid:2)ल(cid:17)ल 13 Business Domains कव्हेर कर(cid:13)ल. हे(cid:13) domains DDD philosophy नेस  (cid:2)र bounded
contexts म्हे(cid:23)ने+  design क(cid:13) ल(cid:13) आहे(cid:13)त — प$त्या(cid:13)क domain चा(cid:17) स्वत,चा(cid:17) data model, business rules,
workflows आणि(cid:23) APIs आहे(cid:13)त:
| #   |     | Domain          | Scope Summary  | Primary Persona  |
| --- | --- | --------------- | -------------- | ---------------- |
| 1   |     | Marketing & CRM | Lead capture,  | Reception, Owner |
counselling, follow-
ups, conversion
analytics
| 2   |     | Admissions | Online applications,  | Reception, Principal |
| --- | --- | ---------- | --------------------- | -------------------- |
document
verification,
workflow
automation
| 3   |     | Student Lifecycle | Allocation, transfers,  | Principal,  |
| --- | --- | ----------------- | ----------------------- | ----------- |
|     |     |                   | archives, graduation,   | Coordinator |
alumni
| 4   |     | Academics | Curriculum,  | Teacher, Coordinator |
| --- | --- | --------- | ------------ | -------------------- |
milestones,
observations,
portfolios, report
cards
5

PreOne Master PRD v1.0  |  Product Freeze
| #   | Domain           | Scope Summary      | Primary Persona |
| --- | ---------------- | ------------------ | --------------- |
| 5   | Daily Operations | Attendance, daily  | Teacher         |
sheet, meals, nap,
activities, incidents
| 6   | Parent        | Announcements,      | Parent, Teacher |
| --- | ------------- | ------------------- | --------------- |
|     | Communication | events, chat, SMS,  |                 |
WhatsApp, email
| 7   | Finance | Fee plans, invoices,  | Accounts, Owner |
| --- | ------- | --------------------- | --------------- |
payments, receipts,
expenses, refunds
| 8   | Inventory &  | Purchase requests,  | Accounts,   |
| --- | ------------ | ------------------- | ----------- |
|     | Procurement  | POs, GRN, issues,   | Coordinator |
returns, audits
| 9   | Human Resources | Staff, recruitment,  | Principal, Owner |
| --- | --------------- | -------------------- | ---------------- |
leave, payroll,
training,
performance
| 10  | Administration | Assets, maintenance,   | Principal,  |
| --- | -------------- | ---------------------- | ----------- |
|     |                | visitors, compliance,  | Coordinator |
meal plans
| 11  | Reports & Analytics | Real-time  | Owner, Principal |
| --- | ------------------- | ---------- | ---------------- |
dashboards, KPIs,
trends, predictions
| 12  | Settings | Configurations,  | Principal, Owner |
| --- | -------- | ---------------- | ---------------- |
templates,
notification rules,
integrations
| 13  | Platform   | Multi-tenant SaaS  | Platform Admin |
| --- | ---------- | ------------------ | -------------- |
|     | Management | layer, billing,    |                |
subscriptions, audit
1.3 Document Conventions
हे(cid:2) document क(cid:2)हे(cid:17) standard conventions follow करत(cid:30) जा (cid:13)व(cid:2)चा(cid:23) "आणि(cid:23) reference कर(cid:23) "स(cid:30)प "करत(cid:2)त.
Requirement IDs (BR-001, FR-001, AC-001) stable identifiers आहे(cid:13)त जा(cid:13) future versions मध्या (cid:13)
change हे(cid:30)(cid:23)(cid:2)र ने(cid:2)हे(cid:17)त — जार क(cid:30)(cid:23)त(cid:17) requirement deprecate हे(cid:30)ईल तर ID retired क(cid:13) ल(cid:17) जा(cid:2)ईल, reuse
6

PreOne Master PRD v1.0  |  Product Freeze
हे(cid:30)(cid:23)(cid:2)र ने(cid:2)हे(cid:17). Priority levels: P0 (must-have for v1.0 GA), P1 (should-have for v1.0 GA), P2 (nice-
to-have, v1.1+ candidate). Status: Draft, Reviewed, Approved, Frozen.
Marathi + Hindi + English mixed language convention हे(cid:2) document मध्या (cid:13)जा(cid:2)(cid:23)(cid:17)वपव+ (cid:20)क व(cid:2)परल(cid:2) आहे(cid:13)
—  business context Marathi/Hindi  मध्या(cid:13)  explain  क(cid:13) ल(cid:2) आहे(cid:13) ज्या(cid:2)मळे  (cid:13)  Indian preschool
stakeholders ने(cid:2) native resonance णिमळेत(cid:30), आणि(cid:23) technical terms English मध्या(cid:13) ठे(cid:13)वल(cid:13) आहे(cid:13) ज्या(cid:2)मळे  (cid:13)
engineering team चा(cid:17) implementation clarity र(cid:2)हेत(cid:13). Code snippets, field names, API paths,
error codes हे(cid:13) always English मध्या (cid:13)आहे(cid:13)त.
1.4 Related Documents
| Document       | Version | Status | Role                  |
| -------------- | ------- | ------ | --------------------- |
| PreOne Vision  | 1.0     | Frozen | Strategic direction,  |
| Document       |         |        | target market,        |
success metrics
| PreOne BPM         | 1.0  | Frozen | Cross-domain          |
| ------------------ | ---- | ------ | --------------------- |
| (Business Process  |      |        | process flows, 13     |
| Map)               |      |        | domain workflows      |
| PreOne BRC         | 1.0  | Frozen | 176 rules across 12   |
| (Business Rules    |      |        | categories, 14-field  |
| Catalog)           |      |        | schema each           |
| PreOne ADR         | 1-12 | Frozen | Tech stack, multi-    |
| (Architecture      |      |        | tenant model,         |
| Decision Records)  |      |        | identity, AI          |
architecture
| PreOne Database  | v2  | Frozen | 69 models across 13  |
| ---------------- | --- | ------ | -------------------- |
| Schema           |     |        | modules, Prisma      |
schema reference
| PreOne Master PRD  | 1.0 | Product Freeze | Functional + business  |
| ------------------ | --- | -------------- | ---------------------- |
| (this document)    |     |                | requirements,          |
acceptance criteria
7

PreOne Master PRD v1.0 | Product Freeze
2. Product Overview
2.1 Product Vision
PreOne हे(cid:13) AI-ready Enterprise Preschool Operating System आहे(cid:13) जा(cid:13) Preschool मधी(cid:17)ल सव(cid:20)
Business Processes एक(cid:2) एक(cid:2)णित्मक Platform वर आ(cid:23)त(cid:13). हे(cid:17) vision statement त(cid:17)ने strategic choices
represent करत(cid:13): "AI-ready" म्हे(cid:23)जा(cid:13) AI हे(cid:2) bolted-on feature ने(cid:2)हे(cid:17) तर platform च्या(cid:2) architecture
मध्या(cid:13) embedded आहे(cid:13); "Enterprise" म्हे(cid:23)जा(cid:13) multi-school chains स(cid:2)ठे(cid:17) scalable, RBAC, audit,
compliance built-in; "Operating System" म्हे(cid:23)जा(cid:13) क(cid:13) वळे ERP ने(cid:2)हे(cid:17) तर daily users चा(cid:2) primary
workspace.
हे(cid:13) vision PreOne ल(cid:2) "yet another school ERP" प(cid:2)सने+ स्पष्टप(cid:23)(cid:13) व(cid:13)#ळे(cid:13) करत(cid:13). Generic school ERPs
फक्त records ट6क5 करत(cid:2)त (attendance, marks, fees) प(cid:23) preschool-specific workflows (daily
child timeline, learning observations, activity-based curriculum, age-appropriate
milestones) त्या(cid:2)च्" या(cid:2) data model मध्या(cid:13) fundamentally fit हे(cid:30)ऊ शकत ने(cid:2)हे(cid:17)त. PreOne हे(cid:13) ground-up
preschool-specific design क(cid:13) लल(cid:13) (cid:13)आहे(cid:13).
2.2 Objectives
PreOne चा(cid:13) प(cid:2)चा primary objectives खा(cid:2)ल(cid:17)लप$म(cid:2)(cid:23)(cid:13) आहे(cid:13)त. हे(cid:13) एकमक(cid:13) (cid:2)श" (cid:17) aligned आहे(cid:13)त — क(cid:30)(cid:23)त(cid:2)हे(cid:17)
single objective स्वत,चा(cid:2) priority claim करू शकत ने(cid:2)हे(cid:17), त्या(cid:2)चा" (cid:2) combined effect PreOne चा (cid:13)product
character define करत(cid:30):
• Paperless Operations: Preschool मधी(cid:17)ल प$त्याक(cid:13) record — admission form, attendance
register, fee receipt, observation note, stock book — digital format मध्या (cid:13)capture
हे(cid:30)ईल. Paper usage 95%+ कम(cid:17) हे(cid:30)ईल.
• Mobile-first Experience: Teacher app (tablet-optimized) आणि(cid:23) Parent app (phone-
first) हे(cid:13) primary surfaces आहे(cid:13)त. Admin portal desktop-first प(cid:23) responsive — owners
travel करत(cid:2)ने(cid:2) dashboard check करू शकत(cid:17)ल.
• Enterprise-grade Security: JWT auth, MFA, RBAC, audit trail, AES-256 encryption at-
rest, TLS 1.3 in-transit, tenant isolation, DPDP Act 2023 compliance, ISO 27001
alignment.
• Multi-School SaaS: True multi-tenant architecture — single codebase, school_id
isolation at every table, per-school configurations, cross-school analytics for chain
owners. 10,000+ schools target.
• AI-ready Architecture: AI capabilities embedded across platform — observation
assistant, daily sheet auto-draft, report card AI paragraph generation, fee default
prediction, parent reply composer, growth milestone prediction.
8

PreOne Master PRD v1.0  |  Product Freeze
2.3 Target Users
PreOne चा (cid:13)7 primary personas आहे(cid:13)त ज्या(cid:2)च्" या(cid:2)स(cid:2)ठे(cid:17) product design क(cid:13) ल (cid:13)#ल(cid:13)  (cid:13)आहे(cid:13). प$त्याक(cid:13)  persona चा(cid:17)
distinct context, goals, pain points आणि(cid:23) success metrics आहे(cid:13)त. Feature prioritization चा(cid:2)
primary framework हे(cid:13) persona coverage matrix आहे(cid:13) — जा(cid:13) feature 2+ personas च्या(cid:2) needs
address करत(cid:13) त(cid:13) P0.
| Persona | Role Context | Primary Device | Success Metric |
| ------- | ------------ | -------------- | -------------- |
Preschool Owner Business owner /  Desktop + Mobile Revenue visibility +
|           | investor         |                  | branch ROI           |
| --------- | ---------------- | ---------------- | -------------------- |
| Principal | Academic +       | Desktop + Mobile | Operations smooth +  |
|           | operational head |                  | parent satisfaction  |
Coordinator Multi-class  Tablet + Desktop Teacher productivity
|     | supervisor |     | + class outcomes |
| --- | ---------- | --- | ---------------- |
Teacher Classroom execution Tablet (primary) Less admin time +
better observations
| Parent | Child's guardian | Mobile (primary) | Real-time child  |
| ------ | ---------------- | ---------------- | ---------------- |
visibility + easy fee
pay
| Accounts Team | Finance operations | Desktop | Fee collection % +  |
| ------------- | ------------------ | ------- | ------------------- |
reconciliation
accuracy
| Reception | Front desk | Desktop + Tablet | Lead response time +  |
| --------- | ---------- | ---------------- | --------------------- |
admission
conversion
2.4 Product Pillars
PreOne चा(cid:13) design decisions प(cid:2)चा pillars श(cid:17) aligned अस(cid:2)व(cid:13) ल(cid:2)#त(cid:2)त. हे(cid:13) pillars design review चा(cid:2)
framework आहे(cid:13)त आणि(cid:23) जा(cid:13)व्हे(cid:2) feature tradeoffs यात(cid:13) (cid:2)त त(cid:13)व्हे(cid:2) tie-breaker म्हे(cid:23)ने+  व(cid:2)परल (cid:13)जा(cid:2)त(cid:2)त:
•  Preschool First: Architecture decisions प(cid:2)सने+  UI copy पया(cid:20)त"  preschool context reflect
हे(cid:30)ईल — activities वर subjects, milestones वर grades, observations वर exams.
•  Mobile First: Teacher tablet app आणि(cid:23) Parent phone app हे(cid:13) primary surfaces.
Desktop portal secondary.
9

PreOne Master PRD v1.0 | Product Freeze
• Enterprise Ready: Multi-school, multi-branch, RBAC, audit, security, SaaS
architecture built-in from day 1.
• AI Ready: AI capabilities platform च्या(cid:2) प$त्याक(cid:13) layer मध्या (cid:13)embedded — data model,
workflows, notifications, reports, analytics.
• Simple Yet Powerful: Progressive disclosure — small preschool सहेजा व(cid:2)परू शक(cid:13) ल,
enterprise chains सहेजा scale करू शकत(cid:17)ल.
2.5 Architecture Snapshot
PreOne चा (cid:13)architecture Domain-Driven Design (DDD) philosophy वर आधी(cid:2)णिरत आहे(cid:13). 13 business
domains हे(cid:13) 13 bounded contexts आहे(cid:13)त ज्या(cid:2)चा" (cid:17) स्वत,चा(cid:17) data models, business rules, workflows
आणि(cid:23) APIs आहे(cid:13)त. Cross-domain communication event-driven architecture द्वा(cid:2)र (cid:13)हे(cid:30)त (cid:13)— Identity,
Notification, Audit, Approval, Reporting हे(cid:13) 5 cross-domain flows सव(cid:20) domains ल(cid:2) tie करत(cid:2)त.
Tech stack: Next.js 16 (frontend + API routes), Prisma ORM (PostgreSQL multi-tenant),
Redis (cache + queue), S3-compatible object storage (file uploads), Razorpay/Cashfree
(payments), MSG91/Twilio (SMS), WhatsApp Cloud API, SES/SendGrid (email), LLM APIs (AI
features). Multi-tenant isolation strategy: shared database with school_id discriminator on
every table + row-level security policies.
3. Business Requirements (BR)
Business Requirements हे(cid:13) "What the business needs" या(cid:2)चा(cid:13) उत्तर दत(cid:13) (cid:2)त. हे(cid:13) requirements
technical implementation वर depend करत ने(cid:2)हे(cid:17)त — त(cid:13) business outcomes आहे(cid:13)त जा(cid:13) PreOne ने(cid:13)
achieve कर(cid:2)याचा(cid:13) आहे(cid:13)त. प$त्याक(cid:13) BR चा(cid:2) unique ID, clear objective, measurable business value,
priority, owner, related domains, dependencies आणि(cid:23) success metrics आहे(cid:13)त.
खा(cid:2)ल(cid:17)ल 30 Business Requirements 13 domains वर distributed आहे(cid:13)त. Priority distribution: P0
(must-have v1.0) = 18, P1 (should-have v1.0) = 9, P2 (nice-to-have v1.1+) = 3. हे (cid:13)distribution
development focus दत(cid:13) (cid:30) — v1.0 चा(cid:2) scope फक्त P0 + P1 आहे(cid:13), P2 explicitly v1.1+ मध्या(cid:13) push क(cid:13) ल (cid:13)
आहे(cid:13).
10

PreOne Master PRD v1.0  |  Product Freeze
| BR ID  | Title     | Priority | Owner      | Dependenci  | Success   |
| ------ | --------- | -------- | ---------- | ----------- | --------- |
|        |           |          | Domain     | es          | Metrics   |
| BR-001 | Student   | P0       | Admissions | Marketing,  | Lead-to-  |
|        | Admission |          |            | Finance     | enrolled  |
conversion
≥25%,
admission
TAT ≤7 days
| BR-002 | Parent    | P0  | Communica | Daily Ops,  | Parent   |
| ------ | --------- | --- | --------- | ----------- | -------- |
|        | Communica |     | tion      | Academics   | DAU/MAU  |
|        | tion      |     |           |             | ≥60%,    |
message
response
time ≤4
hours
| BR-003 | Daily       | P0  | Daily Ops | Academics | Daily sheet  |
| ------ | ----------- | --- | --------- | --------- | ------------ |
|        | Operations  |     |           |           | completion   |
|        | Digital     |     |           |           | ≥95%, paper  |
usage
reduction
90%+
| BR-004 | Fee       | P0  | Finance | Admissions | Fee           |
| ------ | --------- | --- | ------- | ---------- | ------------- |
|        | Managemen |     |         |            | collection    |
|        | t         |     |         |            | ≥92%, online  |
payment
adoption
≥70%
| BR-005 | Inventory  | P0  | Inventory | Finance,  | Stock     |
| ------ | ---------- | --- | --------- | --------- | --------- |
|        | Managemen  |     |           | Admin     | accuracy  |
|        | t          |     |           |           | ≥98%,     |
wastage
reduction
30%+
| BR-006 | Multi-School  | P0  | Platform | Settings | 10,000+  |
| ------ | ------------- | --- | -------- | -------- | -------- |
|        | SaaS          |     |          |          | schools  |
scale, 99.9%
uptime, NRR
≥110%
11

PreOne Master PRD v1.0  |  Product Freeze
| BR ID  | Title      | Priority | Owner     | Dependenci | Success   |
| ------ | ---------- | -------- | --------- | ---------- | --------- |
|        |            |          | Domain    | es         | Metrics   |
| BR-007 | Lead       | P0       | Marketing | Admissions | Lead      |
|        | Capture &  |          |           |            | response  |
|        | CRM        |          |           |            | ≤30 min,  |
lead-to-visit
≥40%
| BR-008 | Student   | P0  | Student   | Admissions,  | Zero data  |
| ------ | --------- | --- | --------- | ------------ | ---------- |
|        | Lifecycle |     | Lifecycle | Academics    | loss on    |
transfer,
alumni
access
retained 5
years
| BR-009 | Academic     | P0  | Academics | Daily Ops | Observation  |
| ------ | ------------ | --- | --------- | --------- | ------------ |
|        | Observations |     |           |           | frequency    |
≥3/child/we
ek, parent
visibility
100%
| BR-010 | HR & Payroll | P0  | HR  | Finance | Payroll  |
| ------ | ------------ | --- | --- | ------- | -------- |
accuracy
100%, leave
transparency
100%
| BR-011 | Compliance  | P0  | Admin | Settings,  | 100%          |
| ------ | ----------- | --- | ----- | ---------- | ------------- |
|        | Managemen   |     |       | Platform   | compliance    |
|        | t           |     |       |            | adherence, 0  |
audit
findings
| BR-012 | Real-time  | P0  | Reports | All domains | Dashboard  |
| ------ | ---------- | --- | ------- | ----------- | ---------- |
|        | Dashboards |     |         |             | DAU ≥80%   |
managemen
t, decision
speed 5x
faster
12

PreOne Master PRD v1.0  |  Product Freeze
| BR ID  | Title         | Priority | Owner    | Dependenci | Success       |
| ------ | ------------- | -------- | -------- | ---------- | ------------- |
|        |               |          | Domain   | es         | Metrics       |
| BR-013 | Notification  | P0       | Platform | Communica  | Notification  |
|        | Engine        |          |          | tion       | delivery      |
≥99%, opt-
out rate ≤2%
| BR-014 | Audit Trail | P0  | Platform | All domains | 100% actions  |
| ------ | ----------- | --- | -------- | ----------- | ------------- |
logged, log
retention 7
years
| BR-015 | Mobile Apps | P0  | Platform | All domains | App store  |
| ------ | ----------- | --- | -------- | ----------- | ---------- |
rating ≥4.5,
crash-free
≥99.5%
| BR-016 | Multi-    | P1  | Platform | Settings | 3 languages     |
| ------ | --------- | --- | -------- | -------- | --------------- |
|        | language  |     |          |          | v1.0 (English,  |
|        | Support   |     |          |          | Marathi,        |
Hindi), 8 by
year 3
| BR-017 | Visitor   | P1  | Admin | Communica | 100% visitor    |
| ------ | --------- | --- | ----- | --------- | --------------- |
|        | Managemen |     |       | tion      | check-in        |
|        | t         |     |       |           | digital, child  |
pickup auth
100%
| BR-018 | Asset     | P1  | Admin | Finance | Asset     |
| ------ | --------- | --- | ----- | ------- | --------- |
|        | Managemen |     |       |         | tracking  |
|        | t         |     |       |         | 100%,     |
maintenance
schedule
adherence
≥90%
| BR-019 | Event     | P1  | Communica | Academics,  | Event RSVP  |
| ------ | --------- | --- | --------- | ----------- | ----------- |
|        | Managemen |     | tion      | Finance     | rate ≥75%,  |
|        | t         |     |           |             | event       |
revenue
tracking
100%
13

PreOne Master PRD v1.0  |  Product Freeze
| BR ID  | Title        | Priority | Owner     | Dependenci | Success      |
| ------ | ------------ | -------- | --------- | ---------- | ------------ |
|        |              |          | Domain    | es         | Metrics      |
| BR-020 | Report Cards | P1       | Academics | Reports    | Report card  |
generation
≤2
hours/class,
parent ack
≥90%
| BR-021 | Refund     | P1  | Finance | Admissions | Refund TAT  |
| ------ | ---------- | --- | ------- | ---------- | ----------- |
|        | Processing |     |         |            | ≤7 days,    |
100% audit
trail
| BR-022 | Bulk        | P1  | Platform | All domains | 10,000       |
| ------ | ----------- | --- | -------- | ----------- | ------------ |
|        | Import/Expo |     |          |             | records ≤5   |
|        | rt          |     |          |             | min, 0 data  |
corruption
| BR-023 | Custom    | P1  | Settings | All domains | Workflow  |
| ------ | --------- | --- | -------- | ----------- | --------- |
|        | Workflows |     |          |             | builder   |
adoption
≥30%
schools
| BR-024 | Biometric  | P1  | Daily Ops | HR  | Biometric  |
| ------ | ---------- | --- | --------- | --- | ---------- |
|        | Attendance |     |           |     | adoption   |
≥40% staff,
spoof rate
0%
| BR-025 | AI           | P1  | Academics | Daily Ops | AI          |
| ------ | ------------ | --- | --------- | --------- | ----------- |
|        | Observation  |     |           |           | suggestion  |
|        | Assistant    |     |           |           | acceptance  |
≥40%,
teacher time
saved ≥30%
| BR-026 | Parent   | P1  | Communica | Reports | NPS ≥50,  |
| ------ | -------- | --- | --------- | ------- | --------- |
|        | Feedback |     | tion      |         | feedback  |
response
rate ≥30%
| BR-027 | Third-party  | P2  | Platform | Settings | 10+           |
| ------ | ------------ | --- | -------- | -------- | ------------- |
|        | Integrations |     |          |          | integrations  |
v1.1+
14

PreOne Master PRD v1.0  |  Product Freeze
| BR ID  | Title       | Priority | Owner    | Dependenci | Success         |
| ------ | ----------- | -------- | -------- | ---------- | --------------- |
|        |             |          | Domain   | es         | Metrics         |
| BR-028 | Transport   | P2       | Admin    | Communica  | Live tracking,  |
|        | Managemen   |          |          | tion       | route           |
|        | t           |          |          |            | optimization    |
| BR-029 | Marketplace | P2       | Platform | Finance    | 10+ vendors,    |
5%
conversion
| BR-030 | Voice-based  | P2  | Daily Ops | Academics | Voice entry  |
| ------ | ------------ | --- | --------- | --------- | ------------ |
|        | Daily Sheet  |     |           |           | adoption     |
≥20%
teachers
3.1 Business Requirement Template
प$त्याक(cid:13)  Business Requirement खा(cid:2)ल(cid:17)ल template नेस  (cid:2)र structured आहे(cid:13). हे(cid:2) template future BR
additions स(cid:2)ठे(cid:17) reference format आहे(cid:13):
| Field                   |     | Description                   |     | Example |     |
| ----------------------- | --- | ----------------------------- | --- | ------- | --- |
| Business Requirement ID |     | Stable identifier, format BR- |     | BR-001  |     |
XXX
| Title |     | Concise business outcome  |     | Student Admission |     |
| ----- | --- | ------------------------- | --- | ----------------- | --- |
name
| Objective |     | What the system shall do (1- |     | System shall support        |     |
| --------- | --- | ---------------------------- | --- | --------------------------- | --- |
|           |     | 2 sentences)                 |     | complete digital admission  |     |
lifecycle.
Business Value Why this matters to the  Faster admissions, reduced
|     |     | business |     | paperwork, better  |     |
| --- | --- | -------- | --- | ------------------ | --- |
conversion tracking.
| Priority |     | P0/P1/P2 with rationale |     | P0 — core revenue-driving  |     |
| -------- | --- | ----------------------- | --- | -------------------------- | --- |
workflow
| Owner |     | Domain accountable for  |     | Admissions Domain |     |
| ----- | --- | ----------------------- | --- | ----------------- | --- |
delivery
| Related Domains |     | Other domains impacted |     | Marketing, Finance |     |
| --------------- | --- | ---------------------- | --- | ------------------ | --- |
15

PreOne Master PRD v1.0  |  Product Freeze
| Field |     | Description | Example |     |
| ----- | --- | ----------- | ------- | --- |
Dependencies Predecessor requirements or  Marketing lead data, Finance
|     |     | systems | invoice engine |     |
| --- | --- | ------- | -------------- | --- |
Success Metrics Measurable acceptance  Lead-to-enrolled ≥25%, TAT
|     |     | criteria | ≤7 days |     |
| --- | --- | -------- | ------- | --- |
4. Functional Requirements (FR)
Functional Requirements हे(cid:13) "System क(cid:2)या कर(cid:13)ल?" या(cid:2)चा(cid:13) उत्तर दत(cid:13) (cid:2)त. हे(cid:13) requirements business
requirements ल(cid:2) actionable system behavior मध्या(cid:13) translate करत(cid:2)त. प$त्याक(cid:13)  FR चा(cid:2) unique ID,
description, actors, preconditions, workflow, inputs, outputs, validations, exceptions,
related business rules आणि(cid:23) priority आहे(cid:13).
खा(cid:2)ल(cid:17)ल 60 Functional Requirements 13 domains वर distributed आहे(cid:13)त. प$त्याक(cid:13)  FR detailed
implementation spec चा(cid:2) anchor point आहे (cid:13)— engineering team त्या(cid:2)च्या(cid:2) आधी(cid:2)र (cid:13)user stories आणि(cid:23)
technical tasks derive कर(cid:13)ल. Priority distribution: P0 = 36, P1 = 18, P2 = 6.
| FR ID  | Title           | Domain    | Priority | Related BR |
| ------ | --------------- | --------- | -------- | ---------- |
| FR-001 | Lead Capture    | Marketing | P0       | BR-007     |
| FR-002 | Lead Follow-up  | Marketing | P0       | BR-007     |
Tracking
| FR-003 | Counselling  | Marketing | P0  | BR-007 |
| ------ | ------------ | --------- | --- | ------ |
Session Booking
| FR-004 | Lead Conversion  | Marketing | P1  | BR-007 |
| ------ | ---------------- | --------- | --- | ------ |
Analytics
| FR-005 | Campaign  | Marketing | P2  | BR-007 |
| ------ | --------- | --------- | --- | ------ |
Tracking
| FR-006 | Online  | Admissions | P0  | BR-001 |
| ------ | ------- | ---------- | --- | ------ |
Application
Form
| FR-007 | Document  | Admissions | P0  | BR-001 |
| ------ | --------- | ---------- | --- | ------ |
Verification
| FR-008 | Admission  | Admissions | P0  | BR-001 |
| ------ | ---------- | ---------- | --- | ------ |
Workflow
16

PreOne Master PRD v1.0  |  Product Freeze
| FR ID  | Title         | Domain     | Priority | Related BR |
| ------ | ------------- | ---------- | -------- | ---------- |
| FR-009 | Offer Letter  | Admissions | P0       | BR-001     |
Generation
| FR-010 | Student Record  | Admissions | P0  | BR-001 |
| ------ | --------------- | ---------- | --- | ------ |
Creation
| FR-011 | Class & Section  | Student   | P0  | BR-008 |
| ------ | ---------------- | --------- | --- | ------ |
|        | Allocation       | Lifecycle |     |        |
| FR-012 | Student          | Student   | P0  | BR-008 |
|        | Transfer         | Lifecycle |     |        |
| FR-013 | Student          | Student   | P0  | BR-008 |
|        | Promotion        | Lifecycle |     |        |
| FR-014 | Student          | Student   | P1  | BR-008 |
|        | Archives &       | Lifecycle |     |        |
Alumni
| FR-015 | Curriculum  | Academics | P0  | BR-009 |
| ------ | ----------- | --------- | --- | ------ |
Management
| FR-016 | Observation  | Academics | P0  | BR-009 |
| ------ | ------------ | --------- | --- | ------ |
Recording
| FR-017 | Milestone  | Academics | P0  | BR-009 |
| ------ | ---------- | --------- | --- | ------ |
Tracker
| FR-018 | Portfolio  | Academics | P1  | BR-009 |
| ------ | ---------- | --------- | --- | ------ |
Generation
| FR-019 | Report Card  | Academics | P1  | BR-020 |
| ------ | ------------ | --------- | --- | ------ |
Generation
| FR-020 | Attendance  | Daily Ops | P0  | BR-003 |
| ------ | ----------- | --------- | --- | ------ |
Marking
| FR-021 | Daily Sheet  | Daily Ops | P0  | BR-003 |
| ------ | ------------ | --------- | --- | ------ |
Creation
| FR-022 | Meal Tracking    | Daily Ops | P0  | BR-003 |
| ------ | ---------------- | --------- | --- | ------ |
| FR-023 | Activity Logging | Daily Ops | P0  | BR-003 |
| FR-024 | Incident         | Daily Ops | P0  | BR-003 |
Reporting
17

PreOne Master PRD v1.0  |  Product Freeze
| FR ID  | Title  | Domain    | Priority | Related BR |
| ------ | ------ | --------- | -------- | ---------- |
| FR-025 | Nap &  | Daily Ops | P0       | BR-003     |
Bathroom
Tracking
| FR-026 | Parent App  | Communication | P0  | BR-002 |
| ------ | ----------- | ------------- | --- | ------ |
Timeline
| FR-027 | Two-way Chat   | Communication | P0  | BR-002 |
| ------ | -------------- | ------------- | --- | ------ |
| FR-028 | Announcements  | Communication | P0  | BR-002 |
& Broadcasts
| FR-029 | Event Calendar  | Communication | P1  | BR-019 |
| ------ | --------------- | ------------- | --- | ------ |
& RSVP
| FR-030 | Fee Plan  | Finance | P0  | BR-004 |
| ------ | --------- | ------- | --- | ------ |
Configuration
| FR-031 | Invoice  | Finance | P0  | BR-004 |
| ------ | -------- | ------- | --- | ------ |
Generation
| FR-032 | Payment  | Finance | P0  | BR-004 |
| ------ | -------- | ------- | --- | ------ |
Processing
| FR-033 | Receipt  | Finance | P0  | BR-004 |
| ------ | -------- | ------- | --- | ------ |
Generation
| FR-034 | Refund  | Finance | P1  | BR-021 |
| ------ | ------- | ------- | --- | ------ |
Processing
| FR-035 | Expense  | Finance | P1  | BR-004 |
| ------ | -------- | ------- | --- | ------ |
Tracking
| FR-036 | Purchase  | Inventory | P0  | BR-005 |
| ------ | --------- | --------- | --- | ------ |
Request
| FR-037 | Purchase Order | Inventory | P0  | BR-005 |
| ------ | -------------- | --------- | --- | ------ |
| FR-038 | Goods Receipt  | Inventory | P0  | BR-005 |
Note (GRN)
| FR-039 | Stock Issue &  | Inventory | P0  | BR-005 |
| ------ | -------------- | --------- | --- | ------ |
Returns
| FR-040 | Staff  | HR  | P1  | BR-010 |
| ------ | ------ | --- | --- | ------ |
Recruitment
| FR-041 | Leave  | HR  | P0  | BR-010 |
| ------ | ------ | --- | --- | ------ |
Management
18

PreOne Master PRD v1.0  |  Product Freeze
| FR ID  | Title    | Domain | Priority | Related BR |
| ------ | -------- | ------ | -------- | ---------- |
| FR-042 | Payroll  | HR     | P0       | BR-010     |
Processing
| FR-043 | Performance  | HR  | P1  | BR-010 |
| ------ | ------------ | --- | --- | ------ |
Review
| FR-044 | Asset  | Admin | P1  | BR-018 |
| ------ | ------ | ----- | --- | ------ |
Management
| FR-045 | Visitor  | Admin | P1  | BR-017 |
| ------ | -------- | ----- | --- | ------ |
Management
| FR-046 | Maintenance  | Admin | P1  | BR-018 |
| ------ | ------------ | ----- | --- | ------ |
Scheduling
| FR-047 | Compliance  | Admin | P0  | BR-011 |
| ------ | ----------- | ----- | --- | ------ |
Dashboard
| FR-048 | Operational  | Reports | P0  | BR-012 |
| ------ | ------------ | ------- | --- | ------ |
Dashboards
| FR-049 | Custom Report  | Reports | P1  | BR-012 |
| ------ | -------------- | ------- | --- | ------ |
Builder
| FR-050 | Predictive  | Reports | P2  | BR-012 |
| ------ | ----------- | ------- | --- | ------ |
Analytics
| FR-051 | School  | Settings | P0  | BR-006 |
| ------ | ------- | -------- | --- | ------ |
Configuration
| FR-052 | Notification  | Settings | P0  | BR-013 |
| ------ | ------------- | -------- | --- | ------ |
Rules
| FR-053 | Workflow  | Settings | P1  | BR-023 |
| ------ | --------- | -------- | --- | ------ |
Builder
| FR-054 | Tenant  | Platform | P0  | BR-006 |
| ------ | ------- | -------- | --- | ------ |
Onboarding
| FR-055 | Subscription &  | Platform | P0  | BR-006 |
| ------ | --------------- | -------- | --- | ------ |
Billing
| FR-056 | Audit Log &  | Platform | P0  | BR-014 |
| ------ | ------------ | -------- | --- | ------ |
Compliance
| FR-057 | User  | Platform | P0  | BR-015 |
| ------ | ----- | -------- | --- | ------ |
Authentication
19

PreOne Master PRD v1.0 | Product Freeze
FR ID Title Domain Priority Related BR
FR-058 Role-Based Platform P0 BR-015
Access Control
FR-059 Multi-language Platform P1 BR-016
UI
FR-060 Bulk Platform P1 BR-022
Import/Export
4.1 Sample FR Detail — FR-001 User Authentication
खा(cid:2)ल(cid:17)ल FR-001 detailed template दश(cid:20)वत (cid:13)कस(cid:2) प$त्या(cid:13)क FR structured आहे(cid:13). हे(cid:13)चा template सव(cid:20) 60 FRs
स(cid:2)ठे(cid:17) apply हे(cid:30)त(cid:30), प(cid:23) space constraints मळे (cid:13) या(cid:2) document मध्या (cid:13)फक्त summary table + एक sample
detail णिदल(cid:13) आहे(cid:13)त. Implementation team ल(cid:2) PRD companion wiki मध्या(cid:13) प$त्याक(cid:13) FR चा(cid:13) full detail
available असल(cid:13) .
Requirement ID FR-001
Title User Authentication
Description User shall login using Mobile Number + OTP /
Password. MFA support for admin roles.
Actors Parent, Teacher, Admin
Preconditions Active account exists; mobile number verified
Workflow Open App → Login → OTP Verification →
(MFA for admin) → Authentication →
Dashboard
Inputs Mobile number (mandatory), OTP (6 digits, 5-
min expiry) OR Password, MFA token (admin
only)
Outputs JWT access token, refresh token, user profile,
role permissions, dashboard
Validations Mobile mandatory + 10 digits; OTP expiry 5
min; max 3 retries; MFA required for admin
roles
Exceptions Lockout after 5 failed attempts → 30-min
cooldown + support contact; OTP delivery fail
→ fallback channel (SMS if push fails)
20

PreOne Master PRD v1.0  |  Product Freeze
Business Rules BR-015, BR-011; BRC R-AUTH-001 (lockout
policy), R-AUTH-002 (MFA mandate), R-
SEC-001 (token expiry)
Priority P0
4.2 Functional Requirement Template
प$त्याक(cid:13)
 Functional Requirement खा(cid:2)ल(cid:17)ल template नेस  (cid:2)र structured आहे(cid:13). Engineering team या(cid:2)
template चा(cid:2) व(cid:2)पर करूने user stories, technical tasks आणि(cid:23) test cases derive करत(cid:30):
| Field          | Description                  | Mandatory |
| -------------- | ---------------------------- | --------- |
| Requirement ID | Stable identifier FR-XXX     | Yes       |
| Title          | Concise feature name         | Yes       |
| Description    | What the system shall do (1- | Yes       |
3 sentences)
| Actors        | User roles involved          | Yes |
| ------------- | ---------------------------- | --- |
| Preconditions | What must be true before FR  | Yes |
executes
| Workflow | Step-by-step flow (text or  | Yes |
| -------- | --------------------------- | --- |
visual)
| Inputs  | Input fields with types   | Yes |
| ------- | ------------------------- | --- |
| Outputs | System outputs (records,  | Yes |
notifications, files)
| Validations | Field-level + business  | Yes |
| ----------- | ----------------------- | --- |
validations
| Exceptions     | Error cases and handling     | Yes |
| -------------- | ---------------------------- | --- |
| Business Rules | Related BR IDs and BRC rule  | Yes |
IDs
| Priority | P0/P1/P2 with rationale | Yes |
| -------- | ----------------------- | --- |
21

PreOne Master PRD v1.0  |  Product Freeze
5. Non-Functional Requirements (NFR)
Non-Functional Requirements हे(cid:13) System Quality Attributes define करत(cid:2)त. हे(cid:13) requirements
"how well" the system should perform address  करत(cid:2)त —  performance, availability,
security, scalability. हे(cid:13) requirements architecture आणि(cid:23) infrastructure decisions ल(cid:2) drive
करत(cid:2)त.
हे(cid:13) ADR मध्या(cid:13) freeze क(cid:13) लल्(cid:13) या(cid:2) Identity आणि(cid:23) Authorization म<डे(cid:13)लश(cid:17) सस  #" त असल(cid:13) . खा(cid:2)ल(cid:17)ल 8 NFR
categories each with measurable targets — performance, availability, scalability, security,
reliability, maintainability, usability, localization. प$त्याक(cid:13)  NFR चा(cid:2) measurement method आणि(cid:23)
acceptance method दखा(cid:13) (cid:17)ल defined आहे(cid:13) ज्या(cid:2)मळे  (cid:13) QA team त(cid:13) verify करू शकत(cid:30).
5.1 Performance
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Login response time ≤2 seconds (95th  APM monitoring +  Load test 1000
|     | percentile) | synthetic tests | concurrent users;  |
| --- | ----------- | --------------- | ------------------ |
95% ≤2s
Dashboard load time ≤3 seconds (95th  RUM + synthetic Real user monitoring
|     | percentile) |     | 30 days; 95% ≤3s |
| --- | ----------- | --- | ---------------- |
Search response  ≤1 second (95th  APM + query log Search 10K records;
| time | percentile) |     | 95% ≤1s |
| ---- | ----------- | --- | ------- |
API response time ≤500 ms (95th  APM per endpoint API test suite; 95%
|                   | percentile) |             | ≤500ms          |
| ----------------- | ----------- | ----------- | --------------- |
| Bulk import (10K  | ≤5 minutes  | Import log  | Test with 10K   |
| records)          |             | timestamp   | student records |
Report generation  ≤30 seconds Report job log Generate annual
| (complex) |     |     | financial report |
| --------- | --- | --- | ---------------- |
Image upload (5MB) ≤10 seconds Upload time tracking Test from mobile +
web
Real-time  ≤5 seconds (push),  Notification log vs  Send test notification
notification delivery ≤30 seconds (SMS) delivery log 100 users
22

PreOne Master PRD v1.0  |  Product Freeze
5.2 Availability
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
System uptime ≥99.9% monthly (≤43  External uptime  Monthly uptime
|          | min downtime)    | monitor (Pingdom) | report  |
| -------- | ---------------- | ----------------- | ------- |
| Planned  | ≤2 hours/month,  | Maintenance       | Verify  |
maintenance  announced 7 days  schedule + comms announcement +
| window | prior |     | actual downtime |
| ------ | ----- | --- | --------------- |
Automatic recovery  ≤5 minutes (auto- Health check +  Chaos engineering
| (failure) | restart) | recovery log | test |
| --------- | -------- | ------------ | ---- |
Database failover ≤2 minutes Failover drill log Quarterly failover
drill
| RTO (Recovery Time  | ≤4 hours | DR drill report | Annual DR drill |
| ------------------- | -------- | --------------- | --------------- |
Objective)
RPO (Recovery Point  ≤15 minutes Backup log + PITR  Point-in-time
| Objective) |     | test | recovery test |
| ---------- | --- | ---- | ------------- |
Mobile app crash- ≥99.5% Crashlytics / Sentry 30-day rolling
| free sessions        |        |                | average             |
| -------------------- | ------ | -------------- | ------------------- |
| API success rate     | ≥99.9% | APM error rate | Monthly API health  |
| (critical endpoints) |        |                | report              |
5.3 Scalability
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Total schools 10,000+ schools Tenant count +  Capacity plan + load
|     |     | growth curve | test |
| --- | --- | ------------ | ---- |
Branches per school 100+ branches per  Multi-branch load  Test with 100-branch
|     | school | test | single tenant |
| --- | ------ | ---- | ------------- |
Concurrent users 100,000+ concurrent Load test with  K6/Gatling test 100K
|     |     | realistic mix | users |
| --- | --- | ------------- | ----- |
Records per tenant 1M+ students, 10M+  Database capacity  Test with seeded
|     | audit logs | test | data |
| --- | ---------- | ---- | ---- |
Horizontal scaling Auto-scale within 2  Auto-scaling policy +  Trigger load spike +
|     | minutes | monitor | verify scale |
| --- | ------- | ------- | ------------ |
23

PreOne Master PRD v1.0  |  Product Freeze
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Database sharding  Shard by tenant_id,  Architecture review Design review sign-
| readiness | future-ready |     | off |
| --------- | ------------ | --- | --- |
File storage scale 1 PB+ object storage S3 capacity plan Storage growth
projection
| Cache hit ratio | ≥85% for hot paths | Redis stats | Production  |
| --------------- | ------------------ | ----------- | ----------- |
monitoring 30 days
5.4 Security
Security NFRs DPDP Act 2023, ISO 27001, SOC 2 Type II compliance चा(cid:2) baseline define
करत(cid:2)त. हे(cid:13) requirements PreOne च्या(cid:2) multi-tenant architecture मध्या(cid:13) tenant isolation ensure
करत(cid:2)त आणि(cid:23) PII protection guarantee करत(cid:2)त. Security design review चा(cid:2) framework हे(cid:2) NFR set
आहे(cid:13).
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Authentication JWT + refresh token,  Auth log + MFA  Pen test + auth flow
|     | MFA for admin | enrollment rate | audit |
| --- | ------------- | --------------- | ----- |
Authorization RBAC per API  Permission matrix  Automated RBAC
|     | endpoint | test | test suite |
| --- | -------- | ---- | ---------- |
Encryption at-rest AES-256 for database  Config audit Infrastructure audit
+ S3
Encryption in-transit TLS 1.3 mandatory SSL Labs test Quarterly SSL scan
A+ rating
Tenant isolation Row-level security,  Isolation test (cross- Pen test: try cross-
|     | school_id     | tenant access  | tenant access |
| --- | ------------- | -------------- | ------------- |
|     | discriminator | attempt)       |               |
Audit trail 100% state-changing  Audit log coverage  Automated audit
|     | actions logged | report | coverage test |
| --- | -------------- | ------ | ------------- |
PII handling DPDP Act 2023  DSAR response time  DPDP compliance
|     | compliant (consent,  | + retention audit | audit |
| --- | -------------------- | ----------------- | ----- |
retention, DSAR)
Vulnerability scan 0 critical, ≤2 high  Quarterly Snyk +  Scan report +
|     | (≤30 days to fix) | Nessus scan | remediation SLA |
| --- | ----------------- | ----------- | --------------- |
24

PreOne Master PRD v1.0  |  Product Freeze
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Penetration test Annual third-party  Pen test report Remediation of all
|     | pen test |     | critical findings |
| --- | -------- | --- | ----------------- |
Secure file upload Type + size  Upload attempt log Test malicious
|     | validation, virus  |     | uploads |
| --- | ------------------ | --- | ------- |
scan, sandbox
storage
5.5 Reliability
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Retry policy 3 retries with  Retry log + success  Inject failures +
|     | exponential backoff | rate | verify retry |
| --- | ------------------- | ---- | ------------ |
Idempotent APIs All payment + write  Idempotency key  Send duplicate
|     | APIs idempotent | test | request, verify single  |
| --- | --------------- | ---- | ----------------------- |
effect
Graceful failure User-friendly error,  Error log audit Force errors + verify
|     | no PII in message |     | UX  |
| --- | ----------------- | --- | --- |
Circuit breaker Trip after 5 failures,  Circuit breaker state  Inject downstream
|     | half-open after 30s | log | failure |
| --- | ------------------- | --- | ------- |
Backup & restore Daily full +  Backup log + restore  Quarterly restore
|     | continuous WAL | test | drill |
| --- | -------------- | ---- | ----- |
Database replication Read replica + sync  Replication lag  Verify replication lag
|     | standby | monitor | ≤1s |
| --- | ------- | ------- | --- |
Queue durability Persistent queues  Queue depth + DLQ  Inject poison
|     | with DLQ | count | message + verify DLQ |
| --- | -------- | ----- | -------------------- |
Health check Liveness + readiness  K8s health endpoint Manual + automated
|     | probes |     | probe test |
| --- | ------ | --- | ---------- |
25

PreOne Master PRD v1.0  |  Product Freeze
5.6 Maintainability
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Modular architecture DDD bounded  Module dependency  Architecture review
|     | contexts, ≤7  | graph |     |
| --- | ------------- | ----- | --- |
dependencies per
module
Clean architecture Separation of  Code review + lint Quarterly
|     | concerns,  |     | architecture audit |
| --- | ---------- | --- | ------------------ |
dependency
inversion
API versioning URI versioning  API spec + breaking  API contract test
|     | (/v1, /v2), backward  | change log |     |
| --- | --------------------- | ---------- | --- |
compatibility
| Code coverage | ≥80% line coverage  | Coverage report  | CI gate |
| ------------- | ------------------- | ---------------- | ------- |
|               | for critical paths  | (Istanbul/nyc)   |         |
Structured logging JSON logs with  Log sample +  Verify searchability
|     | correlation ID | Loki/ELK query | in log tool |
| --- | -------------- | -------------- | ----------- |
Documentation OpenAPI for all APIs,  Doc coverage report Onboarding test:
|             | ADRs for decisions |                   | new dev finds docs |
| ----------- | ------------------ | ----------------- | ------------------ |
| Deployment  | Daily deploys      | Deploy frequency  | CI/CD pipeline     |
| frequency   | possible           | dashboard         | uptime             |
MTTR (Mean Time  ≤1 hour for P1  Incident log Quarterly incident
| To Recovery) | incidents |     | review |
| ------------ | --------- | --- | ------ |
5.7 Usability
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Mobile-first All primary tasks  Task completion test  Usability test with 10
|     | completable on  | on mobile | users |
| --- | --------------- | --------- | ----- |
mobile
Responsive web Desktop + tablet +  BrowserStack test Test on 20
|     | mobile breakpoints |     | device+browser  |
| --- | ------------------ | --- | --------------- |
combos
26

PreOne Master PRD v1.0  |  Product Freeze
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Accessibility WCAG 2.1 AA  Axe + Lighthouse  Accessibility scan
|     | compliant | audit | score ≥90 |
| --- | --------- | ----- | --------- |
Task completion  Attendance: ≤2  Time-on-task  Usability test
| time | min/class; Daily  | measurement |     |
| ---- | ----------------- | ----------- | --- |
sheet: ≤3 min/child
| Error recovery | Clear error +  | Usability test | Force errors,    |
| -------------- | -------------- | -------------- | ---------------- |
|                | recovery path  |                | measure recovery |
Onboarding time First login to first  Onboarding analytics New user funnel
|     | task: ≤5 min |     | analysis |
| --- | ------------ | --- | -------- |
Help &  In-app contextual  Help usage analytics Search success rate
| documentation | help + searchable  |     | ≥80% |
| ------------- | ------------------ | --- | ---- |
docs
Visual consistency Design system  Design lint Component library
|     | adherence ≥95% |     | audit |
| --- | -------------- | --- | ----- |
5.8 Localization
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Languages (v1.0) English, Marathi,  Locale coverage Translation QA per
|     | Hindi |     | locale |
| --- | ----- | --- | ------ |
Languages (year 3) Tamil, Telugu,  Locale roadmap Quarterly locale
|     | Kannada, Bengali,  |     | rollout |
| --- | ------------------ | --- | ------- |
Gujarati (8 total)
i18n architecture ICU MessageFormat,  Code audit Add new locale in <1
|     | ready for new locales |     | day |
| --- | --------------------- | --- | --- |
Date/time format Per-locale format,  Format test Verify across locales
IST timezone default
Number/currency  Indian numbering  Format test Verify INR + Indian
| format | (lakh/crore), ₹  |     | format |
| ------ | ---------------- | --- | ------ |
symbol
RTL support Architecture ready  Code review Design review sign-
|     | (no RTL in v1.0) |     | off |
| --- | ---------------- | --- | --- |
27

PreOne Master PRD v1.0  |  Product Freeze
| Requirement | Target | Measurement | Acceptance Method |
| ----------- | ------ | ----------- | ----------------- |
Content translation UI + system  Translation coverage Coverage report per
|     | messages + email  |     | locale |
| --- | ----------------- | --- | ------ |
templates
Dynamic content User-generated  Content review Verify parent posts
|     | content stays in  |     | not auto-translated |
| --- | ----------------- | --- | ------------------- |
original language
5.9 NFR Template
प$त्याक(cid:13)  NFR  खा(cid:2)ल(cid:17)ल  template  नेस  (cid:2)र  structured  आहे(cid:13) —  Category, Requirement, Target,
Measurement, Acceptance Method. हे(cid:2) template ensure करत(cid:30) क(cid:17) NFR measurable आणि(cid:23)
verifiable आहे(cid:13):
| Field    | Description                 |     | Example     |
| -------- | --------------------------- | --- | ----------- |
| Category | NFR category (Performance,  |     | Performance |
Security, etc.)
| Requirement | What aspect of quality  |     | Login response time          |
| ----------- | ----------------------- | --- | ---------------------------- |
| Target      | Measurable target value |     | ≤2 seconds (95th percentile) |
Measurement How it will be measured APM monitoring + synthetic
tests
Acceptance Method How QA will verify Load test 1000 concurrent
users; 95% ≤2s
6. Business Rules
Business Rules  हे(cid:13)  PreOne  च्या(cid:2) प$त्याक(cid:13)  domain  मधी(cid:17)ल  decision points  आहे(cid:13)त जा(cid:13)  system
automatically enforce करत(cid:13). हे(cid:13) rules BRC v1.0 (Business Rules Catalog) मध्या (cid:13)comprehensively
documented आहे(cid:13)त — 176 rules across 12 categories with 14-field schema per rule. हे(cid:2)
section BRC चा(cid:2) executive summary प$द(cid:2)ने करत(cid:30) आणि(cid:23) key rules example म्हे(cid:23)ने+  दश(cid:20)वत(cid:30).
Business Rules चा(cid:2) primary purpose हे(cid:2) ensure कर(cid:23)(cid:13) आहे(cid:13) क(cid:17) system decisions consistent,
auditable, आणि(cid:23) compliant आहे(cid:13)त. प$त्याक(cid:13)
 rule चा(cid:2) unique ID (R-CATEGORY-XXX format), trigger,
condition, action, exception, आणि(cid:23) compliance framework mapping documented आहे(cid:13). हे (cid:13)rules
28

PreOne Master PRD v1.0  |  Product Freeze
engine configuration द्वा(cid:2)र (cid:13)enforce हे(cid:30)त(cid:2)त — नेव(cid:17)ने rule addition णिक"व(cid:2) modification स(cid:2)ठे(cid:17) Settings
> Workflow Builder व(cid:2)पर(cid:2).
6.1 Rule Categories Summary
| #   | Category       | Rules | Key Examples         |
| --- | -------------- | ----- | -------------------- |
| 1   | Eligibility &  | 15    | Age eligibility per  |
|     | Admission      |       | program, capacity    |
check, duplicate
admission
prevention, transfer
rules
| 2   | Financial & Fee | 20  | Receipt uniqueness,  |
| --- | --------------- | --- | -------------------- |
GST breakdown,
refund approval
matrix, fee default
escalation,
scholarship
validation
| 3   | Operational | 20  | One attendance per  |
| --- | ----------- | --- | ------------------- |
student per day,
daily sheet cutoff,
incident severity
escalation, meal plan
enforcement
| 4   | Academic &  | 18  | Milestone age- |
| --- | ----------- | --- | -------------- |
|     | Observation |     | appropriate,   |
observation
validation, portfolio
compilation, report
card approval chain
| 5   | HR & Staff | 12  | Leave balance  |
| --- | ---------- | --- | -------------- |
validation, payroll
cutoff, biometric
exception,
performance review
calendar
29

PreOne Master PRD v1.0  |  Product Freeze
| #   | Category     | Rules | Key Examples         |
| --- | ------------ | ----- | -------------------- |
| 6   | Inventory &  | 12    | Negative stock       |
|     | Procurement  |       | prevention, reorder  |
triggers, GRN-PO
match, vendor
onboarding, audit
cadence
| 7   | Communication | 12  | Parent-child data  |
| --- | ------------- | --- | ------------------ |
access, pickup
authorization,
broadcast audience
validation, response
SLA
| 8   | Compliance | 18  | DPDP consent, POSH  |
| --- | ---------- | --- | ------------------- |
committee mandate,
RTE 25% reservation,
Fire NOC validity,
GST filing
| 9   | Approval Workflow | 15  | Multi-level  |
| --- | ----------------- | --- | ------------ |
approvals, SLA
enforcement,
escalation matrix,
delegation rules,
audit trail
| 10  | Notification | 12  | Channel preference,  |
| --- | ------------ | --- | -------------------- |
opt-out respect,
frequency capping,
critical bypass,
delivery retry
| 11  | Data Governance | 12  | PII access logging,  |
| --- | --------------- | --- | -------------------- |
retention
enforcement, DSAR
response,
anonymization,
backup encryption
30

PreOne Master PRD v1.0  |  Product Freeze
| #   | Category          | Rules |     | Key Examples            |
| --- | ----------------- | ----- | --- | ----------------------- |
| 12  | Platform & Multi- | 10    |     | Tenant isolation,       |
|     | tenant            |       |     | subscription validity,  |
feature flag
enforcement, cross-
tenant data
prevention
6.2 Sample Business Rules
खा(cid:2)ल(cid:17)ल examples BRC v1.0 मधी(cid:17)ल representative rules दश(cid:20)वत(cid:2)त. प$त्याक(cid:13)  rule चा(cid:2) complete 14-field
schema BRC document मध्या(cid:13) available आहे(cid:13). याथे(cid:13) (cid:13) फक्त title, trigger, action, आणि(cid:23) compliance
mapping दश(cid:20)वल (cid:13)आहे(cid:13):
6.2.1 Eligibility & Admission
| Rule ID | Title | Trigger | Action | Compliance |
| ------- | ----- | ------- | ------ | ---------- |
R-ELG-001 Age Eligibility  Admission form  Reject if age not  ECCE NEP 2020
|     | Check | submission | in program  |     |
| --- | ----- | ---------- | ----------- | --- |
range (1.5-6
years)
R-ELG-002 Class Capacity  Allocation  Block allocation  Internal Policy
|     | Enforcement | attempt | beyond  |     |
| --- | ----------- | ------- | ------- | --- |
configured
capacity
| R-ELG-003 | Duplicate  | New admission   | Check          | DPDP §4 |
| --------- | ---------- | --------------- | -------------- | ------- |
|           | Admission  | record creation | phone+aadhaar  |         |
|           | Prevention |                 | +name; prompt  |         |
merge if exists
| R-ELG-004 | Document      | Admission stage  | Block             | Maharashtra  |
| --------- | ------------- | ---------------- | ----------------- | ------------ |
|           | Verification  | advance          | enrollment until  | State Rules  |
|           | Mandatory     |                  | all mandatory     |              |
docs verified
31

PreOne Master PRD v1.0  |  Product Freeze
6.2.2 Financial & Fee
| Rule ID   | Title      | Trigger    | Action         | Compliance |
| --------- | ---------- | ---------- | -------------- | ---------- |
| R-FIN-001 | Receipt    | Receipt    | Sequential     | GST Act    |
|           | Uniqueness | generation | unique number  |            |
per school per
FY
| R-FIN-002 | GST Breakdown  | Invoice    | Item-wise    | GST Act §12 |
| --------- | -------------- | ---------- | ------------ | ----------- |
|           | Calculation    | generation | CGST+SGST @  |             |
18% on taxable
services
| R-FIN-003 | Refund          | Refund request  | Principal  | Internal Policy |
| --------- | --------------- | --------------- | ---------- | --------------- |
|           | Approval Matrix | submission      | approval   |                 |
≤₹5000; Owner
approval
>₹5000
| R-FIN-004 | Fee Default  | Due date        | Day 7:         | Internal Policy |
| --------- | ------------ | --------------- | -------------- | --------------- |
|           | Escalation   | passed + unpaid | reminder; Day  |                 |
14: principal
alert; Day 30:
hold
R-FIN-005 Negative Stock  Stock issue  Block issue if  Internal Policy
|     | Prevention | attempt | stock < quantity  |     |
| --- | ---------- | ------- | ----------------- | --- |
requested
6.2.3 Compliance
| Rule ID | Title | Trigger | Action | Compliance |
| ------- | ----- | ------- | ------ | ---------- |
R-CMP-001 DPDP Consent  PII collection  Mandatory  DPDP Act 2023
|     | Capture | (parent/child) | consent  | §4-7 |
| --- | ------- | -------------- | -------- | ---- |
checkbox +
version log
R-CMP-002 POSH  Staff count ≥10 Alert if ICC not  POSH Act 2013
|     | Committee  |     | configured;  | §4  |
| --- | ---------- | --- | ------------ | --- |
|     | Mandate    |     | block hiring |     |
32

PreOne Master PRD v1.0  |  Product Freeze
| Rule ID | Title | Trigger | Action | Compliance |
| ------- | ----- | ------- | ------ | ---------- |
R-CMP-003 RTE 25%  Admission to  Track 25% seats  RTE Act 2009
|     | Reservation | entry class | for  | §12 |
| --- | ----------- | ----------- | ---- | --- |
EWS/disadvanta
ged
R-CMP-004 Fire NOC  NOC expiry  Alert principal +  NBC 2016 Fire
|           | Validity        | approaching (60   | owner; renewal    |         |
| --------- | --------------- | ----------------- | ----------------- | ------- |
|           |                 | days)             | task              |         |
| R-CMP-005 | Data Retention  | Record            | Auto-archive      | DPDP §8 |
|           | Enforcement     | retention period  | alumni after 5    |         |
|           |                 | reached           | years; purge per  |         |
DPDP
6.3 Compliance Framework Mapping
PreOne 8 compliance frameworks चा (cid:13)enforcement ensure करत(cid:13). प$त्याक(cid:13)
 framework चा (cid:13)specific
sections PreOne च्या(cid:2) business rules मध्या(cid:13) mapped आहे(cid:13)त. हे(cid:13) mapping BRC v1.0 Appendix B मध्या (cid:13)
complete detail मध्या (cid:13)available आहे(cid:13):
| Framework     | Scope                | Rules Count |     | Key Sections          |
| ------------- | -------------------- | ----------- | --- | --------------------- |
| DPDP Act 2023 | Data protection,     | 22          |     | §4 (consent), §8      |
|               | consent, retention,  |             |     | (retention), §11      |
|               | DSAR                 |             |     | (children data), §17  |
(DSAR), §21 (breach),
§33 (transfer)
| POSH Act 2013 | Workplace sexual     | 8   |     | §4 (ICC mandate), §9  |
| ------------- | -------------------- | --- | --- | --------------------- |
|               | harassment           |     |     | (complaint), §19      |
|               | prevention           |     |     | (awareness)           |
| RTE Act 2009  | Right to education,  | 6   |     | §12 (25% EWS          |
|               | 25% reservation      |     |     | reservation), §11     |
(pre-school)
| GST & Finance | Tax compliance,  | 18  |     | GST §12 (services),  |
| ------------- | ---------------- | --- | --- | -------------------- |
|               | invoicing, TDS   |     |     | §31 (invoice), TDS   |
§194C
Fire & Safety (NBC  Building safety, fire  5 Part 4 Fire, Part 3
| 2016) | NOC |     |     | Building |
| ----- | --- | --- | --- | -------- |
33

PreOne Master PRD v1.0  |  Product Freeze
| Framework     | Scope                 | Rules Count | Key Sections        |
| ------------- | --------------------- | ----------- | ------------------- |
| ECCE NEP 2020 | Early childhood       | 9           | Curriculum          |
|               | curriculum, age       |             | standards, age 3-6  |
|               | criteria              |             | for entry           |
| ISO 27001     | Information security  | 14          | A.5-A.18 controls   |
management
| Maharashtra State  | State-specific  | 10  | License,               |
| ------------------ | --------------- | --- | ---------------------- |
| Preschool Rules    | preschool       |     | infrastructure, staff  |
|                    | regulations     |     | qualifications         |
7. User Roles & Permissions
PreOne चा(cid:2) Role-Based Access Control (RBAC) model 8 primary roles define करत(cid:30) आणि(cid:23) प$त्याक(cid:13)
role चा(cid:17) per-module permissions specify करत(cid:30). हे(cid:13) model ADR-007 (Identity & Authorization)
मध्या (cid:13)freeze क(cid:13) ल (cid:13)#ल(cid:13)  (cid:13)आहे(cid:13) आणि(cid:23) त(cid:13) multi-tenant architecture चा(cid:2) core security mechanism आहे(cid:13).
RBAC चा(cid:2) primary principle हे(cid:2) आहे(cid:13): "least privilege" — प$त्याक(cid:13)  user ल(cid:2) फक्त त्या(cid:2)च्या(cid:2) role ल(cid:2) आवश्याक
असलल(cid:13) (cid:13) permissions णिमळेत(cid:2)त. Permissions चा(cid:13) चा(cid:2)र levels आहे(cid:13)त: Read (view only), Create (add
new), Update (edit existing), Delete (remove). क(cid:2)हे(cid:17) actions (e.g., refund approval, fee plan
edit) additional approval workflows द्वा(cid:2)र(cid:13) governed आहे(cid:13)त जा(cid:13) role permission पल(cid:17)कडे(cid:13) आहे(cid:13)त.
7.1 Role Definitions
| Role           | Description  | Primary Device | Reports To |
| -------------- | ------------ | -------------- | ---------- |
| Platform Admin | PreOne SaaS  | Desktop        | PreOne CTO |
platform operator
(internal)
| School Owner | Business owner /  | Desktop + Mobile | Self |
| ------------ | ----------------- | ---------------- | ---- |
investor of preschool
| Principal | Academic +  | Desktop + Mobile | Owner |
| --------- | ----------- | ---------------- | ----- |
operational head of
school
| Coordinator | Multi-class  | Tablet + Desktop | Principal |
| ----------- | ------------ | ---------------- | --------- |
supervisor /
academic
coordinator
34

PreOne Master PRD v1.0  |  Product Freeze
| Role    |     | Description          |     | Primary Device   |     | Reports To  |     |
| ------- | --- | -------------------- | --- | ---------------- | --- | ----------- | --- |
| Teacher |     | Classroom teacher /  |     | Tablet (primary) |     | Coordinator |     |
caregiver
| Accounts |     | Finance operations  |     | Desktop |     | Principal / Owner |     |
| -------- | --- | ------------------- | --- | ------- | --- | ----------------- | --- |
staff
| Reception |     | Front desk /  |     | Desktop + Tablet |     | Coordinator |     |
| --------- | --- | ------------- | --- | ---------------- | --- | ----------- | --- |
admissions desk
| Parent |     | Child's guardian (app  |     | Mobile (primary) |     | N/A |     |
| ------ | --- | ---------------------- | --- | ---------------- | --- | --- | --- |
user)
7.2 RBAC Permission Matrix
खा(cid:2)ल(cid:17)ल matrix role × module चा(cid:13) permission level दश(cid:20)वत(cid:13). Permission codes: R = Read, C =
Create, U = Update, D = Delete, Full = CRUD all, Own = only own data, Class = only assigned
class data. या(cid:2) matrix चा(cid:2) enforcement every API endpoint वर हे(cid:30)त(cid:30).
Module Owner Principal Coordin Teacher Account Receptio Parent
|          |      |      | ator |       | s   | n    |     |
| -------- | ---- | ---- | ---- | ----- | --- | ---- | --- |
| Marketin | Full | Full | Full | R Own | R   | Full | —   |
g & CRM
| Admissio | R   | Full | Full | —       | R        | Full | R Own +  |
| -------- | --- | ---- | ---- | ------- | -------- | ---- | -------- |
| ns       |     |      |      |         | invoices |      | C        |
| Student  | R   | Full | Full | R Class | R        | R    | R Own    |
Lifecycle
| Academi  | R   | Full | Full | C+U   | —   | —   | R Own  |
| -------- | --- | ---- | ---- | ----- | --- | --- | ------ |
| cs       |     |      |      | Class |     |     | child  |
| Daily    | R   | Full | Full | C+U   | —   | —   | R Own  |
| Operatio |     |      |      | Class |     |     | child  |
ns
| Parent  | R   | Full | Full | C+U   | —   | R   | C+U  |
| ------- | --- | ---- | ---- | ----- | --- | --- | ---- |
| Commun  |     |      |      | Class |     |     | Own  |
ication
| Finance | Full | R   | —   | —   | Full | C       | R+Pay  |
| ------- | ---- | --- | --- | --- | ---- | ------- | ------ |
|         |      |     |     |     |      | payment | Own    |
s
35

PreOne Master PRD v1.0  |  Product Freeze
Module Owner Principal Coordin Teacher Account Receptio Parent
|          |     |      | ator |         | s         | n          |     |
| -------- | --- | ---- | ---- | ------- | --------- | ---------- | --- |
| Inventor | R   | Full | Full | C       | R+Appro   | R          | —   |
| y        |     |      |      | request | ve        |            |     |
| HR       | R   | Full | R    | R Own   | R payroll | —          | —   |
| Administ | R   | Full | Full | R       | R         | C visitors | R   |
ration
| Reports  | Full | Full | Class | Class | Finance | —   | Own   |
| -------- | ---- | ---- | ----- | ----- | ------- | --- | ----- |
| &        |      |      |       |       |         |     | child |
Analytics
| Settings  | R   | Full | R   | —   | R       | —   | Own   |
| --------- | --- | ---- | --- | --- | ------- | --- | ----- |
|           |     |      |     |     | finance |     | prefs |
| Platform  | —   | —    | —   | —   | —       | —   | —     |
Manage
ment
7.3 Permission Principles
RBAC implementation  खा(cid:2)ल(cid:17)ल  principles follow  करत(cid:30).  हे(cid:13)  principles design review  चा(cid:2)
framework आहे(cid:13)त — जा(cid:13)व्हे(cid:2) permission ambiguity यात(cid:13) (cid:30) त(cid:13)व्हे(cid:2) हे(cid:13) principles tie-breaker म्हे(cid:23)ने+  व(cid:2)परल (cid:13)
जा(cid:2)त(cid:2)त:
•  Least Privilege: Default deny; explicit allow. User ल(cid:2) फक्त त्या(cid:2)च्या(cid:2) role ल(cid:2) आवश्याक
| असलल(cid:13) |  (cid:13)minimum permissions. |     |     |     |     |     |     |
| ------------ | ----------------------------- | --- | --- | --- | --- | --- | --- |
•  Need-to-Know: Data access स(cid:17)णिमत — teacher ल(cid:2) फक्त त्या(cid:2)च्या(cid:2) class चा(cid:2) data, parent ल(cid:2)
फक्त त्या(cid:2)च्या(cid:2) child चा(cid:2) data.
•  Separation of Duties: Critical actions ल(cid:2) द(cid:30)ने व(cid:13)#ळे(cid:13) roles — e.g., fee refund request ≠
refund approval (different persons).
•  Approval Workflow: Role permission पल(cid:17)कडे(cid:13) high-value actions (refund, salary edit,
fee plan change) ल(cid:2) additional approval chain.
•  Audit Every Action: Permission check result (allow/deny) चा(cid:2) audit log; denial चा(cid:2)
reason captured.
•  Context-Aware: Time, location, device, IP — contextual factors role permission ल(cid:2)
override करू शकत(cid:2)त (e.g., after-hours access alert).
36

PreOne Master PRD v1.0 | Product Freeze
• Temporary Elevation: Emergency elevation mechanism with auto-expiry + audit +
manager notification.
• Delegation: Approver out-of-office असल्या(cid:2)स delegation allowed with original
approver notified + audit.
8. Module Requirements
हे(cid:2) section PreOne च्या(cid:2) प$त्याक(cid:13) 13 domain चा(cid:13) detailed module requirements प$द(cid:2)ने करत(cid:30). प$त्याक(cid:13)
domain चा(cid:13) overview, goals, business requirements, functional requirements, user stories,
business rules, workflows, field specifications, validations, notifications, reports,
permissions, APIs, acceptance criteria, आणि(cid:23) estimated size documented आहे(cid:13).
हे(cid:13) domains DDD bounded contexts म्हे(cid:23)ने+ design क(cid:13) ल(cid:13) आहे(cid:13)त — प$त्या(cid:13)क domain चा(cid:17) स्वत,चा(cid:17) data
model, business rules, workflows आणि(cid:23) APIs आहे(cid:13)त. Cross-domain communication event-
driven architecture द्वा(cid:2)र(cid:13) हे(cid:30)त(cid:13). प$त्याक(cid:13) domain section त्या(cid:2) domain चा(cid:2) complete specification
provide करत(cid:30) जा(cid:30) engineering team ल(cid:2) implementation करण्या(cid:2)स(cid:2)ठे(cid:17) पर (cid:13)स(cid:2) आहे(cid:13).
8.1 Marketing & CRM
Marketing & CRM domain preschool चा(cid:13) lead-to-enquiry pipeline manage करत(cid:30). या(cid:2)त lead
capture (walk-in, call, online, referral, campaign), counselling session booking, follow-up
tracking, conversion analytics, आणि(cid:23) campaign ROI tracking या(cid:2)चा" (cid:2) सम(cid:2)व(cid:13)श आहे(cid:13). Domain चा(cid:2)
primary objective म्हे(cid:23)जा (cid:13)every lead ल(cid:2) timely response द(cid:23)(cid:13) (cid:13)आणि(cid:23) conversion funnel चा(cid:17) visibility
provide कर(cid:23).(cid:13)
Goals Lead response ≤30 min; Lead-to-enrolled
conversion ≥25%; Source-wise ROI visibility;
Zero lead leakage
Business Requirements BR-007 Lead Capture & CRM (P0); BR-026
Parent Feedback (P1)
Functional Requirements FR-001 Lead Capture; FR-002 Follow-up
Tracking; FR-003 Counselling Booking; FR-004
Conversion Analytics; FR-005 Campaign
Tracking
User Stories As Reception, I want to capture lead details
so I can follow up. As Owner, I want to see
conversion funnel so I can optimize. As
Marketing, I want to track campaign ROI so I
can allocate budget.
37

PreOne Master PRD v1.0 | Product Freeze
Business Rules R-MKT-001 Lead response SLA 30 min; R-
MKT-002 Duplicate merge within 30 days; R-
MKT-003 Counsellor availability check; R-
MKT-004 Source attribution mandatory; R-
MKT-005 Lead score calculation
Workflows Lead Capture → Pipeline Stage → Follow-up
→ Counselling → Application → Enrollment;
Campaign → Lead Tagging → Conversion →
ROI Report
Field Specifications Lead: name (text, mandatory), phone (10-
digit, mandatory), email (email, optional),
child_age (1-6), source (enum:
walk-in/call/online/referral/campaign),
campaign_id (FK, optional), notes (text, ≤500
chars), status (enum), score (auto-calc)
Validations Phone format; child age range; source from
enum; follow-up date > today; counsellor not
double-booked
Notifications New lead → assigned counsellor (push);
Follow-up due → reception (push + email);
Lead converted → owner + principal
(dashboard + email); Cold lead → coordinator
(weekly summary)
Reports Daily lead summary; Weekly conversion
funnel; Monthly source-wise ROI; Quarterly
campaign performance; Lead aging report
Permissions Reception: Full; Coordinator: Full; Principal:
Full; Owner: Full + analytics; Marketing: Full +
campaigns; Teacher: R Own; Parent: —
APIs (Reference) POST /v1/leads; GET /v1/leads/{id}; PUT
/v1/leads/{id}/status; GET
/v1/leads/analytics/funnel; POST
/v1/campaigns; GET /v1/campaigns/{id}/roi
Acceptance Criteria AC-001 Lead capture; AC-002 Duplicate
handling; AC-003 Conversion report; AC-004
Campaign tracking
Estimated Size Approx. 35-45 pages detailed spec; ~8,000
LoC; 12 API endpoints; 8 database tables
38

PreOne Master PRD v1.0 | Product Freeze
8.2 Admissions
Admissions domain complete digital admission lifecycle manage करत(cid:30) — online application
form, document upload & verification, multi-stage workflow (application → verification →
interaction → offer → enrollment), offer letter generation, आणि(cid:23) student record creation
across connected systems. हे(cid:2) domain preschool चा(cid:2) primary revenue driver आहे(cid:13).
Goals Admission TAT ≤7 days; 100% document
verification; Zero data loss on enrollment;
Parent experience smooth
Business Requirements BR-001 Student Admission (P0); BR-021
Refund Processing (P1)
Functional Requirements FR-006 Online Application; FR-007 Document
Verification; FR-008 Admission Workflow;
FR-009 Offer Letter; FR-010 Student Record
Creation
User Stories As Parent, I want to apply online so I don't
visit office. As Reception, I want to verify
documents digitally. As Principal, I want to
track admission stages. As System, I want to
create records across all modules on
enrollment.
Business Rules R-ADM-001 Age eligibility per program; R-
ADM-002 Capacity enforcement; R-ADM-003
Duplicate prevention; R-ADM-004 Document
verification mandatory; R-ADM-005 Offer
expiry 7-15 days; R-ADM-006 Sequential
stage progression
Workflows Application → Verification → Interaction →
Offer → Acceptance → Fee Payment →
Enrollment → Cross-domain Sync; Document
Review → Approve/Reject → Re-upload if
Rejected
Field Specifications Application: child_name (mandatory), DOB
(date), gender (enum), parent_name
(mandatory), parent_phone (10-digit),
parent_email (email), address (text),
previous_school (optional), medical_info
(text), documents (file array), application_fee
(auto), status (enum)
39

PreOne Master PRD v1.0 | Product Freeze
Validations Age 1.5-6 years; phone 10-digit; document
formats PDF/JPG ≤5MB; mandatory fields;
sequential stages
Notifications Application submitted → school + parent;
Document verified/rejected → parent; Offer
letter → parent; Enrollment → all domains +
parent welcome
Reports Daily admission summary; Weekly stage-wise
pipeline; Monthly conversion report;
Document pending report; Admission source
attribution
Permissions Reception: Full; Principal: Full + approve;
Coordinator: Full; Parent: C+R Own;
Accounts: R invoices; Owner: R + analytics
APIs (Reference) POST /v1/applications; GET
/v1/applications/{id}; PUT
/v1/applications/{id}/verify; POST
/v1/applications/{id}/offer; POST
/v1/applications/{id}/enroll
Acceptance Criteria AC-005 Online application; AC-006 Document
verification; AC-007 Offer generation; AC-008
Enrollment sync
Estimated Size Approx. 50-60 pages detailed spec; ~12,000
LoC; 15 API endpoints; 12 database tables
8.3 Student Lifecycle
Student Lifecycle domain child चा(cid:2) complete journey manage करत(cid:30) — admission प(cid:2)सने+
graduation पया(cid:20)त" . या(cid:2)त class/section allocation, transfers (between
classes/sections/branches), promotion to next academic year, archival, alumni access, आणि(cid:23)
data retention per DPDP Act या(cid:2)चा" (cid:2) सम(cid:2)व(cid:13)श आहे(cid:13).
Goals Zero data loss on transfer; Smooth promotion
cycle; DPDP-compliant archival; Alumni
access retained 5 years
Business Requirements BR-008 Student Lifecycle (P0)
40

PreOne Master PRD v1.0 | Product Freeze
Functional Requirements FR-011 Class & Section Allocation; FR-012
Student Transfer; FR-013 Student Promotion;
FR-014 Archives & Alumni
User Stories As Principal, I want to allocate students to
classes optimally. As Coordinator, I want to
transfer students between sections. As
System, I want to promote students with
auto-class allocation. As Alumni, I want to
access historical records.
Business Rules R-STU-001 Age-program match; R-STU-002
Capacity check; R-STU-003 Transfer approval
chain; R-STU-004 Promotion eligibility; R-
STU-005 Archive after graduation; R-STU-006
Retention 5-7 years
Workflows Allocation → Eligibility Check → Capacity
Check → Assign; Transfer → Approval →
Migration → Archive Old; Promotion → Bulk
→ Eligibility → New Year Record → Class
Allocation
Field Specifications Student: student_id (UUID), name
(mandatory), DOB, gender, class_id (FK),
section_id (FK), academic_year_id (FK),
enrollment_date, status (enum:
active/transferred/graduated/archived),
alumni_until (date)
Validations Age matches program; class has capacity;
transfer date future; promotion eligibility
(completed session)
Notifications Allocation → parent + teacher; Transfer →
both classes' teachers + parent; Promotion →
parent + new teacher; Archive → parent
notification
Reports Active students by class/section; Transfer
history; Promotion summary; Alumni count;
Retention compliance
Permissions Principal: Full; Coordinator: Full; Teacher: R
Class; Parent: R Own child; Owner: R +
analytics
41

PreOne Master PRD v1.0 | Product Freeze
APIs (Reference) POST /v1/students/{id}/allocate; POST
/v1/students/{id}/transfer; POST
/v1/students/promote; GET
/v1/students/{id}/portfolio
Acceptance Criteria AC-009 Class allocation; AC-010 Student
transfer; AC-011 Promotion cycle; AC-012
Alumni access
Estimated Size Approx. 30-40 pages detailed spec; ~6,000
LoC; 10 API endpoints; 8 database tables
8.4 Academics
Academics domain child च्या(cid:2) learning journey manage करत(cid:30) — curriculum management,
milestone-based observations, portfolio generation, holistic report cards. हे(cid:2) domain
preschool चा(cid:2) academic heart आहे(cid:13) णिजाथे(cid:13) teacher चा(cid:17) expertise आणि(cid:23) AI assistance णिमळे+ने child च्या(cid:2)
growth चा(cid:17) qualitative record तया(cid:2)र हे(cid:30)त(cid:13).
Goals Observation frequency ≥3/child/week; 100%
milestone tracking; AI suggestion acceptance
≥40%; Report card generation ≤2 hours/class
Business Requirements BR-009 Academic Observations (P0); BR-020
Report Cards (P1)
Functional Requirements FR-015 Curriculum Management; FR-016
Observation Recording; FR-017 Milestone
Tracker; FR-018 Portfolio Generation; FR-019
Report Card Generation
User Stories As Teacher, I want to record observations
with AI assistance. As Coordinator, I want to
see milestone progress across class. As
Parent, I want to see child's portfolio. As
Principal, I want AI-assisted report cards.
Business Rules R-ACD-001 Milestone age-appropriate; R-
ACD-002 Observation validation; R-ACD-003
Portfolio compilation rules; R-ACD-004 Report
card approval chain; R-ACD-005 Curriculum
version control; R-ACD-006 AI suggestion
threshold
42

PreOne Master PRD v1.0 | Product Freeze
Workflows Curriculum → Activities → Milestones →
Publish; Observation → Select Student →
Milestone → AI Suggestion → Publish →
Parent; Report Card → AI Draft → Teacher
Review → Principal Approval → Parent
Field Specifications Observation: student_id (FK), milestone_id
(FK), text (≥20 chars), photos (file array),
activity_context (text), ai_suggestion (text),
teacher_approved (bool), published_at
(timestamp)
Validations Observation text ≥20 chars; milestone valid;
photo ≤5MB each, max 10; milestone age-
appropriate; teacher approval before publish
Notifications New observation → parent (push + timeline);
Milestone achieved → parent + coordinator;
Report card ready → parent; Delayed
milestone → coordinator alert
Reports Weekly observation summary; Milestone
progress per child/class; Portfolio
compilation; Term report card; Curriculum
adherence
Permissions Teacher: C+U Class; Coordinator: Full;
Principal: Full + approve; Parent: R Own child;
Owner: R + analytics
APIs (Reference) POST /v1/observations; GET
/v1/students/{id}/milestones; POST
/v1/students/{id}/portfolio; POST /v1/report-
cards; GET /v1/curriculum
Acceptance Criteria AC-013 Observation recording; AC-014
Milestone tracking; AC-015 Portfolio
generation; AC-016 Report card workflow
Estimated Size Approx. 55-70 pages detailed spec; ~15,000
LoC; 18 API endpoints; 14 database tables +
AI integration
8.5 Daily Operations
Daily Operations domain preschool च्या(cid:2) दरर(cid:30)जा classroom activities capture करत(cid:30) —
attendance, daily sheet, meals, nap, bathroom, activities, incidents. हे(cid:2) domain teacher चा(cid:2)
43

PreOne Master PRD v1.0 | Product Freeze
primary workspace आहे(cid:13) णिजाथे(cid:13) त(cid:17) प$त्याक(cid:13) child चा(cid:2) णिदवस record करत(cid:13) आणि(cid:23) parents ल(cid:2) real-time
visibility दत(cid:13) (cid:13).
Goals Daily sheet completion ≥95%; Paper usage
reduction 90%+; Real-time parent visibility;
Incident response ≤5 min
Business Requirements BR-003 Daily Operations Digital (P0)
Functional Requirements FR-020 Attendance; FR-021 Daily Sheet;
FR-022 Meal Tracking; FR-023 Activity
Logging; FR-024 Incident Reporting; FR-025
Nap & Bathroom
User Stories As Teacher, I want to mark attendance in <2
min. As Teacher, I want to create daily sheet
per child. As Parent, I want to see child's day
in real-time. As Principal, I want incident
alerts instantly.
Business Rules R-OPS-001 One attendance per student per
day; R-OPS-002 Daily sheet cutoff (end of
day); R-OPS-003 Incident severity escalation;
R-OPS-004 Meal plan enforcement; R-
OPS-005 Activity photo limit; R-OPS-006 Nap
duration validation
Workflows Attendance → Open Class → Mark → Submit
→ Parent Notify; Daily Sheet → Pre-populate
→ Fill → AI Draft → Submit → Parent;
Incident → Capture → Severity → Instant
Alert → Follow-up
Field Specifications Attendance: student_id, date, status
(present/absent/late/half-day/leave),
marked_by, marked_at, reason_if_absent.
Daily Sheet: meals (object), nap (duration),
activities (array), mood (emoji), bathroom
(count), notes (text)
Validations One record per student per day; status from
enum; submission before cutoff; incident
severity from enum; photo limits
Notifications Absent → parent (push + SMS); Late →
parent; Daily sheet published → parent;
Critical incident → instant push + call prompt;
Low meal consumption → coordinator
44

PreOne Master PRD v1.0 | Product Freeze
Reports Daily attendance summary; Daily sheet
completion rate; Meal consumption analytics;
Incident log; Activity participation
Permissions Teacher: C+U Class; Coordinator: Full;
Principal: Full; Parent: R Own child;
Reception: R; Owner: R + analytics
APIs (Reference) POST /v1/attendance; POST /v1/daily-sheets;
POST /v1/meals; POST /v1/activities; POST
/v1/incidents; GET /v1/students/{id}/timeline
Acceptance Criteria AC-017 Attendance; AC-018 Daily sheet;
AC-019 Meal tracking; AC-020 Incident
reporting; AC-021 Activity logging
Estimated Size Approx. 60-75 pages detailed spec; ~18,000
LoC; 22 API endpoints; 16 database tables
8.6 Parent Communication
Parent Communication domain school आणि(cid:23) parent दरम्या(cid:2)ने real-time, two-way
communication enable करत(cid:30). या(cid:2)त parent app timeline, two-way chat,
announcements/broadcasts, event calendar with RSVP, photo gallery, आणि(cid:23) multi-channel
notification delivery या(cid:2)चा" (cid:2) सम(cid:2)व(cid:13)श आहे(cid:13).
Goals Parent DAU/MAU ≥60%; Message response
time ≤4 hours; Notification delivery ≥99%;
Opt-out rate ≤2%
Business Requirements BR-002 Parent Communication (P0); BR-019
Event Management (P1); BR-026 Parent
Feedback (P1)
Functional Requirements FR-026 Parent App Timeline; FR-027 Two-way
Chat; FR-028 Announcements; FR-029 Event
Calendar & RSVP
User Stories As Parent, I want to see child's day in
timeline. As Parent, I want to chat with
teacher. As Principal, I want to broadcast
announcements. As Parent, I want to RSVP
for events.
45

PreOne Master PRD v1.0 | Product Freeze
Business Rules R-COM-001 Parent-child data access; R-
COM-002 Pickup authorization; R-COM-003
Broadcast audience validation; R-COM-004
Response SLA; R-COM-005 Channel
preference; R-COM-006 Frequency capping
Workflows Timeline → Aggregated from Daily Ops +
Academics → Filtered by Child → Parent
View; Chat → Send → Notification → Reply →
Read Receipt; Announcement → Compose →
Audience → Multi-channel → Track Ack
Field Specifications Message: sender_id, recipient_id, text (≤2000
chars), media (file array), read_at
(timestamp), thread_id. Announcement: title,
body, audience (school/class/section),
attachments, ack_required, channels (array)
Validations Recipient is child's teacher/parent; message
length ≤2000; media ≤5MB; audience scope
valid; ack required if mandated
Notifications New message → push; Announcement →
multi-channel per preference; Event reminder
→ 24h + 1h before; RSVP confirmation →
coordinator
Reports Parent engagement metrics; Message
response time; Announcement ack rate;
Event RSVP rate; Channel effectiveness
Permissions Parent: C+U Own; Teacher: C+U Class;
Coordinator: Full + broadcast; Principal: Full +
broadcast; Owner: R + analytics
APIs (Reference) GET /v1/parent/timeline/{child_id}; POST
/v1/chat/messages; POST
/v1/announcements; POST /v1/events;
POST /v1/events/{id}/rsvp
Acceptance Criteria AC-022 Parent timeline; AC-023 Two-way
chat; AC-024 Announcement broadcast;
AC-025 Event RSVP
Estimated Size Approx. 40-50 pages detailed spec; ~10,000
LoC; 14 API endpoints; 10 database tables +
realtime infra
46

PreOne Master PRD v1.0 | Product Freeze
8.7 Finance
Finance domain preschool चा(cid:2) complete financial operations manage करत(cid:30) — fee plan
configuration, invoice generation, payment processing
(UPI/cards/netbanking/cash/cheque), receipt generation, refund processing, expense
tracking, आणि(cid:23) financial reporting. हे(cid:2) domain preschool चा(cid:2) revenue engine आहे(cid:13).
Goals Fee collection ≥92%; Online payment
adoption ≥70%; 100% GST compliance;
Refund TAT ≤7 days
Business Requirements BR-004 Fee Management (P0); BR-021 Refund
Processing (P1)
Functional Requirements FR-030 Fee Plan Config; FR-031 Invoice
Generation; FR-032 Payment Processing;
FR-033 Receipt Generation; FR-034 Refund
Processing; FR-035 Expense Tracking
User Stories As Accounts, I want to generate invoices in
bulk. As Parent, I want to pay fees online. As
System, I want to generate GST-compliant
receipts. As Principal, I want to track fee
defaults. As Owner, I want expense analytics.
Business Rules R-FIN-001 Receipt uniqueness; R-FIN-002 GST
breakdown; R-FIN-003 Refund approval
matrix; R-FIN-004 Fee default escalation; R-
FIN-005 Scholarship validation; R-FIN-006
Invoice sequential numbering; R-FIN-007
Reconciliation mandatory
Workflows Plan → Components → Publish; Cycle →
Invoice → Parent → Payment → Reconcile →
Receipt → Ledger; Refund → Request →
Approval → Gateway → Credit Note → Audit
Field Specifications Invoice: number (unique per school per FY),
student_id, components (array), subtotal,
GST (object: CGST, SGST, IGST), total,
due_date, status (enum). Payment:
invoice_id, amount, method, gateway_ref,
status, paid_at
Validations Amount > 0; GST rates correct per
component; payment method valid; gateway
ref unique; refund amount ≤ original
47

PreOne Master PRD v1.0 | Product Freeze
Notifications Invoice generated → parent (push + email);
Payment due reminder (3 days before, on
due date, 7 days after); Payment success →
parent + accounts; Refund processed →
parent; Default escalation → principal
Reports Daily fee collection; Monthly fee summary;
GST filing report; Defaulters list; Expense
breakdown; P&L summary
Permissions Accounts: Full; Principal: R; Owner: Full +
analytics; Parent: R Own + pay; Reception: C
payments
APIs (Reference) POST /v1/fee-plans; POST /v1/invoices;
POST /v1/payments; POST /v1/refunds;
GET /v1/finance/gst-report
Acceptance Criteria AC-026 Fee plan; AC-027 Invoice generation;
AC-028 Payment processing; AC-029 Receipt
generation; AC-030 Refund workflow
Estimated Size Approx. 55-65 pages detailed spec; ~14,000
LoC; 20 API endpoints; 14 database tables +
payment gateway integration
8.8 Inventory & Procurement
Inventory domain preschool च्या(cid:2) materials चा(cid:2) complete lifecycle manage करत(cid:30) — purchase
requests, purchase orders, goods receipt notes (GRN), stock issues, returns, audits. या(cid:2)त
classroom materials (Montessori, art supplies), kitchen stock, office supplies, आणि(cid:23) cleaning
materials या(cid:2)चा" (cid:2) सम(cid:2)व(cid:13)श आहे(cid:13).
Goals Stock accuracy ≥98%; Wastage reduction 30%
+; Reorder automation; 100% audit trail
Business Requirements BR-005 Inventory Management (P0)
Functional Requirements FR-036 Purchase Request; FR-037 Purchase
Order; FR-038 GRN; FR-039 Stock Issue &
Returns
48

PreOne Master PRD v1.0 | Product Freeze
User Stories As Teacher, I want to request classroom
materials. As Coordinator, I want to
approve/reject requests. As Accounts, I want
to generate POs. As Coordinator, I want to
record GRN with quality check. As System, I
want to prevent negative stock.
Business Rules R-INV-001 Negative stock prevention; R-
INV-002 Reorder triggers; R-INV-003 GRN-PO
match; R-INV-004 Vendor onboarding; R-
INV-005 Audit cadence; R-INV-006 FIFO
consumption; R-INV-007 Issue purpose
mandatory
Workflows Request → Approval → PO → Vendor → GRN
→ Stock Update → Invoice Match; Issue →
Stock Check → Issue → Ledger → Return
Window → Return; Audit → Sample Count →
Variance → Reconciliation
Field Specifications Item: name, category, unit, reorder_level,
current_stock, location. PO: vendor_id,
line_items (array), taxes, total,
payment_terms, delivery_date. GRN: po_id,
received_qty, quality_status, remarks
Validations Quantity > 0; vendor from approved list;
received ≤ PO qty; quality check mandatory;
issue purpose documented
Notifications PR submitted → approver; PO issued →
vendor + accounts; GRN recorded →
accounts; Low stock → coordinator + auto-
reorder suggestion; Audit variance →
principal
Reports Stock valuation; Reorder list; Vendor
performance; Consumption trends; Audit
variance report; Wastage analysis
Permissions Coordinator: Full; Teacher: C request;
Accounts: R + approve; Principal: R; Owner: R
+ analytics
APIs (Reference) POST /v1/purchase-requests; POST
/v1/purchase-orders; POST /v1/grn; POST
/v1/stock-issues; GET
/v1/inventory/valuation
49

PreOne Master PRD v1.0 | Product Freeze
Acceptance Criteria AC-031 Purchase request; AC-032 PO
generation; AC-033 GRN; AC-034 Stock issue;
AC-035 Negative stock prevention
Estimated Size Approx. 40-50 pages detailed spec; ~9,000
LoC; 12 API endpoints; 10 database tables
8.9 Human Resources
HR domain preschool च्या(cid:2) staff चा(cid:2) complete lifecycle manage करत(cid:30) — recruitment, leave
management, payroll processing, performance reviews, training, आणि(cid:23) offboarding. हे(cid:2)
domain staff चा(cid:17) productivity आणि(cid:23) satisfaction ensure करत(cid:30) जा(cid:13) child care quality ल(cid:2) directly
impact करत(cid:13).
Goals Payroll accuracy 100%; Leave transparency
100%; Performance review on-time ≥90%;
Staff retention ≥85%
Business Requirements BR-010 HR & Payroll (P0)
Functional Requirements FR-040 Recruitment; FR-041 Leave
Management; FR-042 Payroll; FR-043
Performance Review
User Stories As HR, I want to manage recruitment
pipeline. As Staff, I want to apply for leave
online. As Accounts, I want to process payroll
accurately. As Coordinator, I want to conduct
performance reviews. As Principal, I want
staff analytics.
Business Rules R-HR-001 Leave balance validation; R-HR-002
Payroll cutoff; R-HR-003 Biometric exception;
R-HR-004 Performance review calendar; R-
HR-005 Recruitment approval; R-HR-006
Probation period; R-HR-007 Exit workflow
Workflows Recruitment → Posting → Applications →
Screening → Interview → Offer → Onboard;
Leave → Apply → Balance Check → Approve
→ Calendar → Coverage; Payroll → Cycle →
Attendance → Calc → Payslip → Bank File
50

PreOne Master PRD v1.0 | Product Freeze
Field Specifications Staff: name, role, doj, salary_structure,
bank_details, status. Leave: staff_id, type,
dates, reason, status, balance_impact.
Payroll: staff_id, month, gross, deductions,
net, bank_file_ref
Validations Leave balance sufficient; payroll cycle
complete; salary structure current; bank
details valid; rating scale valid
Notifications Leave applied → approver; Leave
approved/rejected → staff; Payslip generated
→ staff; Performance review due → manager
+ staff; Payroll processed → accounts + owner
Reports Staff directory; Leave summary; Payroll
register; Performance dashboard;
Recruitment pipeline; Attrition analysis
Permissions Principal: Full; HR: Full; Coordinator: R + leave
approve; Staff: R Own + leave apply;
Accounts: R payroll; Owner: R + analytics
APIs (Reference) POST /v1/leaves; POST /v1/payroll/run;
GET /v1/staff/{id}/payslip; POST
/v1/performance-reviews; GET
/v1/hr/analytics
Acceptance Criteria AC-036 Leave workflow; AC-037 Payroll
processing; AC-038 Performance review;
AC-039 Recruitment
Estimated Size Approx. 45-55 pages detailed spec; ~11,000
LoC; 16 API endpoints; 12 database tables +
biometric integration
8.10 Administration
Administration domain preschool च्या(cid:2) facility आणि(cid:23) compliance operations manage करत(cid:30) —
asset management, visitor management, maintenance scheduling, compliance dashboard,
meal plans. हे(cid:2) domain preschool चा(cid:2) physical operations backbone आहे(cid:13).
Goals Asset tracking 100%; Maintenance schedule
adherence ≥90%; 100% compliance
adherence; Visitor auth 100%
51

PreOne Master PRD v1.0 | Product Freeze
Business Requirements BR-011 Compliance Management (P0);
BR-017 Visitor Management (P1); BR-018
Asset Management (P1)
Functional Requirements FR-044 Asset Management; FR-045 Visitor
Management; FR-046 Maintenance
Scheduling; FR-047 Compliance Dashboard
User Stories As Coordinator, I want to track all assets. As
Reception, I want to digitize visitor check-in.
As Principal, I want compliance dashboard. As
System, I want to alert before compliance
expiry.
Business Rules R-ADMIN-001 Asset tagging; R-ADMIN-002
Maintenance frequency; R-ADMIN-003 Visitor
photo mandatory; R-ADMIN-004 Pickup
authorization; R-ADMIN-005 Compliance alert
thresholds; R-ADMIN-006 Audit cadence
Workflows Asset → Entry → Tag → Assign →
Maintenance → Audit → Depreciation →
Disposal; Visitor → Capture → Photo → Host
Notify → Approve → Check-in → Check-out;
Compliance → Items → Status → Expiry Alert
→ Action → Audit
Field Specifications Asset: name, category, value, purchase_date,
location, assigned_to, qr_code, depreciation.
Visitor: name, phone, photo, purpose, host,
child_id (if pickup), check_in, check_out
Validations Asset value > 0; visitor phone + photo
mandatory; pickup → authorized contact
verification; compliance due dates tracked
Notifications Asset assigned/reassigned → staff;
Maintenance due → coordinator + vendor;
Visitor check-in → host; Unauthorized pickup
→ instant deny + parent call; Compliance
expiry approaching → principal + owner
Reports Asset register; Maintenance schedule; Visitor
log; Compliance status; Depreciation report;
Pickup audit
Permissions Coordinator: Full; Principal: Full; Reception: C
visitors; Accounts: R assets; Owner: R +
analytics
52

PreOne Master PRD v1.0 | Product Freeze
APIs (Reference) POST /v1/assets; POST /v1/visitors; POST
/v1/maintenance; GET
/v1/compliance/dashboard; GET
/v1/admin/audit
Acceptance Criteria AC-040 Asset tracking; AC-041 Visitor check-
in; AC-042 Maintenance; AC-043 Compliance
alert
Estimated Size Approx. 35-45 pages detailed spec; ~8,000
LoC; 14 API endpoints; 10 database tables
8.11 Reports & Analytics
Reports & Analytics domain PreOne चा(cid:2) intelligence layer आहे(cid:13) जा(cid:30) सव(cid:20) domains च्या(cid:2) data ल(cid:2)
aggregate करूने actionable insights generate करत(cid:30) — operational dashboards, custom
report builder, predictive analytics, आणि(cid:23) role-based KPI tracking.
Goals Dashboard DAU ≥80% management; Decision
speed 5x faster; Custom report builder
adoption ≥30%; Prediction accuracy ≥75%
Business Requirements BR-012 Real-time Dashboards (P0)
Functional Requirements FR-048 Operational Dashboards; FR-049
Custom Report Builder; FR-050 Predictive
Analytics
User Stories As Owner, I want real-time KPI dashboard. As
Principal, I want operational alerts. As
Coordinator, I want class-level analytics. As
Owner, I want to build custom reports. As
Principal, I want AI predictions for capacity
planning.
Business Rules R-RPT-001 Role-based data scope; R-RPT-002
Data refresh cadence; R-RPT-003 Export
format validation; R-RPT-004 Prediction
confidence display; R-RPT-005 Dashboard
customization limits
Workflows Data Sources → Aggregation → Role Filter →
Dashboard Render → Drill-down → Export;
Custom Report → Source → Fields → Filters
→ Preview → Save → Schedule
53

PreOne Master PRD v1.0 | Product Freeze
Field Specifications Dashboard: user_role, widgets (array), filters
(object), refresh_interval. Custom Report:
data_source, fields (array), filters (object),
grouping, schedule (cron)
Validations Role sees only authorized scope; data refresh
≤5 min; field-data source compatibility;
schedule frequency valid
Notifications Scheduled report ready → email; Threshold
breach → push + email; Prediction alert →
designated role; Dashboard anomaly →
principal
Reports Daily KPI snapshot; Weekly operational
summary; Monthly business review;
Quarterly trend analysis; Annual strategic
report
Permissions Owner: Full + analytics; Principal: Full;
Coordinator: Class scope; Accounts: Finance
scope; Teacher: Class scope; Parent: Own
child
APIs (Reference) GET /v1/dashboards/{role}; POST
/v1/reports/custom; GET
/v1/reports/{id}/download; POST
/v1/analytics/predict
Acceptance Criteria AC-044 Dashboard load; AC-045 Custom
report; AC-046 Predictive analytics
Estimated Size Approx. 30-40 pages detailed spec; ~7,000
LoC; 10 API endpoints + ML model
integration; 6 database views + materialized
views
8.12 Settings
Settings domain school च्या(cid:2) configurations चा(cid:2) master control आहे (cid:13)— school profile, academic
year, programs, classes, sections, timings, notification rules, workflow builder, integration
settings. हे(cid:2) domain बा(cid:2)क(cid:17)च्या(cid:2) सव(cid:20) domains चा(cid:2) behavior customize करत(cid:30).
Goals 100% configuration flexibility; 0 breaking
changes; Workflow builder adoption ≥30%;
Notification rules per school ≥10
54

PreOne Master PRD v1.0 | Product Freeze
Business Requirements BR-023 Custom Workflows (P1)
Functional Requirements FR-051 School Configuration; FR-052
Notification Rules; FR-053 Workflow Builder
User Stories As Principal, I want to configure school
profile. As Coordinator, I want to set
notification rules. As Principal, I want to
customize approval workflows. As Owner, I
want to manage integrations.
Business Rules R-SET-001 Config versioning; R-SET-002
Cascade impact check; R-SET-003 Workflow
guardrails; R-SET-004 Notification template
validation; R-SET-005 Integration auth
refresh; R-SET-006 Feature flag governance
Workflows Config Change → Impact Analysis →
Confirmation → Apply → Cascade → Audit;
Notification Rule → Event → Channel →
Template → Audience → Test → Activate
Field Specifications School Config: name, address, programs
(array), classes (array), sections (array),
timings (object), academic_years (array).
Notification Rule: event, channel, template,
audience, timing, active
Validations Programs age-appropriate; classes capacity >
0; timings valid; channel enabled; template
valid; audience scope valid
Notifications Config change → stakeholders; Notification
rule activated → test send; Workflow
activated → audit; Integration failure →
admin
Reports Configuration audit log; Notification rule
performance; Workflow usage stats;
Integration health
Permissions Principal: Full; Owner: R + analytics;
Coordinator: R + notifications; Platform
Admin: Full + integrations
APIs (Reference) PUT /v1/school/config; POST /v1/notification-
rules; POST /v1/workflows; GET
/v1/integrations/health
55

PreOne Master PRD v1.0 | Product Freeze
Acceptance Criteria AC-047 School config; AC-048 Notification
rules; AC-049 Workflow builder
Estimated Size Approx. 25-35 pages detailed spec; ~5,000
LoC; 8 API endpoints; 6 database tables +
config store
8.13 Platform Management
Platform Management domain PreOne चा(cid:2) SaaS operations layer आहे(cid:13) जा(cid:30) multi-tenant
infrastructure manage करत(cid:30) — tenant onboarding, subscription & billing, audit log &
compliance, feature flags, system health. हे(cid:2) domain internal PreOne team चा(cid:2) primary
workspace आहे(cid:13).
Goals 10,000+ schools scale; 99.9% uptime; NRR
≥110%; 100% audit trail; Subscription churn
≤5%
Business Requirements BR-006 Multi-School SaaS (P0); BR-013
Notification Engine (P0); BR-014 Audit Trail
(P0); BR-015 Mobile Apps (P0); BR-016 Multi-
language (P1); BR-022 Bulk Import (P1)
Functional Requirements FR-054 Tenant Onboarding; FR-055
Subscription & Billing; FR-056 Audit Log &
Compliance
User Stories As Platform Admin, I want to onboard new
tenants. As Platform Admin, I want to
manage subscriptions. As Platform Admin, I
want to view audit trail. As Platform Admin, I
want to monitor system health.
Business Rules R-PLT-001 Tenant isolation; R-PLT-002
Subscription validity; R-PLT-003 Feature flag
enforcement; R-PLT-004 Cross-tenant
prevention; R-PLT-005 Audit immutability; R-
PLT-006 Retention 7 years
Workflows Tenant → Create → Config → Admin User →
Sample Data → Training → Go-Live;
Subscription → Plan → Billing → Invoice →
Payment → Renewal; Audit → Capture →
Sign → Store → Search → Retain
56

PreOne Master PRD v1.0 | Product Freeze
Field Specifications Tenant: name, plan, admin_user, status,
created_at, go_live_date. Subscription:
tenant_id, plan, billing_cycle, amount, status,
renewal_date. Audit: actor, action, target,
before, after, ip, timestamp
Validations Unique tenant ID; admin email unique; plan
from catalog; audit immutable; retention
enforced
Notifications Tenant onboarded → internal team;
Subscription renewal approaching → owner;
Payment failure → dunning; Audit anomaly →
security team; System health degraded → on-
call
Reports Tenant growth; MRR/ARR; Churn analysis;
Audit coverage; System health; Feature
adoption
Permissions Platform Admin: Full; Owner: R Own tenant;
Principal: — ; Other roles: —
APIs (Reference) POST /v1/platform/tenants; POST
/v1/platform/subscriptions; GET
/v1/platform/audit; GET /v1/platform/health
Acceptance Criteria AC-050 Tenant onboarding; AC-051
Subscription billing; AC-052 Audit log; AC-053
Multi-tenant isolation
Estimated Size Approx. 35-45 pages detailed spec; ~9,000
LoC; 12 API endpoints; 8 database tables +
multi-tenant infra
9. Reports & Analytics
Reports & Analytics section PreOne च्या(cid:2) reporting capabilities चा(cid:2) comprehensive catalog
प$द(cid:2)ने करत(cid:30). Reports चा(cid:13) 5 categories मध्या(cid:13) classified क(cid:13) ल(cid:13) आहे(cid:13) — Operational, Academic,
Financial, Management, Compliance. प$त्याक(cid:13) report चा(cid:2) audience, format, frequency, आणि(cid:23)
export options documented आहे(cid:13).
Reports चा(cid:2) primary objective म्हे(cid:23)जा(cid:13) data-driven decision making enable कर(cid:23).(cid:13) Real-time
dashboards daily operations monitor करत(cid:2)त, scheduled reports periodic reviews support
57

PreOne Master PRD v1.0  |  Product Freeze
करत(cid:2)त, आणि(cid:23) on-demand reports ad-hoc analysis enable करत(cid:2)त. सव(cid:20) reports role-based
access controls follow करत(cid:2)त — user ल(cid:2) फक्त त्या(cid:2)च्या(cid:2) role ल(cid:2) authorized data णिदसत(cid:30).
9.1 Operational Reports
| Report Name      | Audience      | Format       | Frequency     | Export     |
| ---------------- | ------------- | ------------ | ------------- | ---------- |
| Daily            | Teacher,      | Dashboard +  | Real-time +   | PDF, Excel |
| Attendance       | Coordinator,  | PDF          | Daily 6 PM    |            |
| Summary          | Principal     |              |               |            |
| Daily Sheet      | Coordinator,  | Dashboard    | Real-time     | Excel      |
| Completion       | Principal     |              |               |            |
| Weekly Activity  | Coordinator,  | PDF          | Weekly Monday | PDF, Excel |
| Log              | Principal     |              |               |            |
| Incident Log     | Principal,    | Dashboard +  | Real-time +   | PDF        |
|                  | Owner         | PDF          | Daily         |            |
| Meal             | Coordinator,  | Dashboard    | Real-time +   | Excel      |
| Consumption      | Kitchen       |              | Daily         |            |
Report
| Visitor Log | Coordinator,  | Dashboard +  | Daily        | PDF, Excel |
| ----------- | ------------- | ------------ | ------------ | ---------- |
|             | Principal     | PDF          |              |            |
| Stock       | Coordinator,  | Dashboard    | Real-time +  | Excel      |
| Movement    | Accounts      |              | Weekly       |            |
Report
| Staff  | Principal, HR | Dashboard | Daily | Excel |
| ------ | ------------- | --------- | ----- | ----- |
Attendance
Summary
9.2 Academic Reports
| Report Name | Audience        | Format    | Frequency | Export |
| ----------- | --------------- | --------- | --------- | ------ |
| Milestone   | Teacher, Parent | Dashboard | Real-time | PDF    |
Progress per
Child
| Class Milestone  | Coordinator,  | Dashboard | Weekly | Excel |
| ---------------- | ------------- | --------- | ------ | ----- |
| Summary          | Principal     |           |        |       |
58

PreOne Master PRD v1.0  |  Product Freeze
| Report Name  | Audience      | Format    | Frequency | Export |
| ------------ | ------------- | --------- | --------- | ------ |
| Observation  | Coordinator,  | Dashboard | Weekly    | Excel  |
| Frequency    | Principal     |           |           |        |
Report
| Child Portfolio | Parent, Teacher | PDF | On-demand +  | PDF |
| --------------- | --------------- | --- | ------------ | --- |
Term-end
| Report Card  | Parent, Principal | PDF | Term-end | PDF |
| ------------ | ----------------- | --- | -------- | --- |
(Term)
| Curriculum  | Coordinator,  | Dashboard +  | Weekly | PDF, Excel |
| ----------- | ------------- | ------------ | ------ | ---------- |
| Adherence   | Principal     | PDF          |        |            |
Report
| Delayed          | Coordinator,  | Dashboard +  | Real-time +  | Excel |
| ---------------- | ------------- | ------------ | ------------ | ----- |
| Milestone Alert  | Principal     | Alert        | Weekly       |       |
Report
| AI Suggestion  | Principal,  | Dashboard | Monthly | Excel |
| -------------- | ----------- | --------- | ------- | ----- |
| Acceptance     | Product     |           |         |       |
Report
9.3 Financial Reports
| Report Name | Audience    | Format    | Frequency    | Export |
| ----------- | ----------- | --------- | ------------ | ------ |
| Daily Fee   | Accounts,   | Dashboard | Real-time +  | Excel  |
| Collection  | Principal,  |           | Daily        |        |
Owner
| Monthly Fee  | Accounts,  | PDF + Excel | Monthly | PDF, Excel |
| ------------ | ---------- | ----------- | ------- | ---------- |
| Summary      | Owner      |             |         |            |
Defaulters List Accounts,  Dashboard +  Real-time +  PDF, Excel
|             | Principal  | PDF          | Weekly     |            |
| ----------- | ---------- | ------------ | ---------- | ---------- |
| GST Filing  | Accounts   | Excel + PDF  | Monthly +  | Excel, PDF |
| Report      |            |              | Quarterly  |            |
| Refund      | Accounts,  | PDF          | Monthly    | PDF, Excel |
| Summary     | Principal  |              |            |            |
| Expense     | Accounts,  | Dashboard +  | Monthly    | Excel      |
| Breakdown   | Owner      | PDF          |            |            |
59

PreOne Master PRD v1.0  |  Product Freeze
| Report Name | Audience | Format | Frequency  | Export |
| ----------- | -------- | ------ | ---------- | ------ |
| P&L Summary | Owner    | PDF    | Monthly +  | PDF    |
Quarterly
| Fee Plan    | Principal,  | Dashboard | Quarterly | Excel |
| ----------- | ----------- | --------- | --------- | ----- |
| Performance | Owner       |           |           |       |
9.4 Management Reports
| Report Name | Audience  | Format    | Frequency | Export     |
| ----------- | --------- | --------- | --------- | ---------- |
| Admission   | Owner,    | Dashboard | Real-time | PDF, Excel |
| Conversion  | Principal |           |           |            |
Funnel
| Branch  | Owner | Dashboard | Monthly | Excel |
| ------- | ----- | --------- | ------- | ----- |
Performance
Comparison
| Teacher       | Principal,  | Dashboard | Monthly | Excel |
| ------------- | ----------- | --------- | ------- | ----- |
| Productivity  | Owner       |           |         |       |
Report
| Parent NPS /       | Owner,      | Dashboard +  | Quarterly | PDF        |
| ------------------ | ----------- | ------------ | --------- | ---------- |
| CSAT Report        | Principal   | PDF          |           |            |
| Staff Retention /  | Principal,  | Dashboard    | Quarterly | Excel      |
| Attrition          | Owner       |              |           |            |
| Enrollment         | Owner       | Dashboard +  | Monthly   | PDF, Excel |
| Trend Analysis     |             | PDF          |           |            |
| Revenue Trend      | Owner       | Dashboard    | Monthly   | Excel      |
& Forecast
| Capacity     | Principal,  | Dashboard | Monthly | Excel |
| ------------ | ----------- | --------- | ------- | ----- |
| Utilization  | Owner       |           |         |       |
Report
60

PreOne Master PRD v1.0  |  Product Freeze
9.5 Compliance Reports
| Report Name   | Audience    | Format | Frequency | Export |
| ------------- | ----------- | ------ | --------- | ------ |
| DPDP Consent  | Principal,  | PDF    | On-demand | PDF    |
| Register      | Owner       |        |           |        |
| DPDP DSAR     | Principal,  | PDF    | On-demand | PDF    |
| Response Log  | Owner       |        |           |        |
| POSH          | Principal,  | PDF    | Annual    | PDF    |
| Compliance    | Owner       |        |           |        |
Report
| RTE 25%      | Principal,  | Dashboard +  | Annual          | PDF, Excel |
| ------------ | ----------- | ------------ | --------------- | ---------- |
| Reservation  | Owner       | PDF          | admission cycle |            |
Tracker
| Fire & Safety  | Principal,  | Dashboard   | Real-time | PDF        |
| -------------- | ----------- | ----------- | --------- | ---------- |
| NOC Status     | Owner       |             |           |            |
| GST            | Accounts    | Excel + PDF | Monthly   | Excel, PDF |
Reconciliation
Report
Audit Trail  Platform Admin,  Excel + PDF On-demand Excel, PDF
| Export          | Principal   |     |           |     |
| --------------- | ----------- | --- | --------- | --- |
| Data Retention  | Principal,  | PDF | Quarterly | PDF |
| Compliance      | Owner       |     |           |     |
10. Integrations
PreOne  च्या(cid:2)  platform  वर  8 integration categories  आहे(cid:13)त ज्या(cid:2)  external systems  स(cid:30)बात
communicate करत(cid:2)त. प$त्याक(cid:13)  integration चा(cid:2) provider, scope, auth method, SLA, आणि(cid:23) fallback
strategy documented आहे(cid:13). Integrations loosely coupled architecture द्वा(cid:2)र (cid:13)implement हे(cid:30)त(cid:2)त —
एक integration fail हे(cid:30)त(cid:30) तर बा(cid:2)क(cid:17)चा (cid:13)system unaffected र(cid:2)हेत(cid:30).
Integration design principles: (1) Loose coupling via event bus + queue; (2) Idempotent
operations with retry; (3) Fallback chain (primary → secondary → manual); (4) Rate limit
handling with backoff; (5) Audit log of every external call; (6) Health check + alerting per
integration; (7) Cost tracking per integration; (8) Vendor lock-in prevention via abstraction
layer.
61

PreOne Master PRD v1.0  |  Product Freeze
10.1 Payment Gateway Integration
| Provider | Scope | Auth | SLA | Fallback |
| -------- | ----- | ---- | --- | -------- |
Razorpay  UPI, cards,  API key + secret  99.95% uptime,  Cashfree
| (Primary) | netbanking,  | (HMAC) | 2s response | automatic |
| --------- | ------------ | ------ | ----------- | --------- |
wallets
Cashfree  UPI, cards,  API key + secret 99.9% uptime Manual entry /
| (Secondary) | netbanking |     |     | cheque |
| ----------- | ---------- | --- | --- | ------ |
UPI Direct  UPI Collect,  Merchant API 99.5% uptime Razorpay/
| (Reserve) | Intent |     |     | Cashfree |
| --------- | ------ | --- | --- | -------- |
Cash/Cheque  Manual entry by  N/A — internal  Real-time entry N/A
| (Offline) | reception | record |     |     |
| --------- | --------- | ------ | --- | --- |
10.2 SMS Gateway Integration
| Provider    | Scope            | Auth           | SLA              | Fallback     |
| ----------- | ---------------- | -------------- | ---------------- | ------------ |
| MSG91       | Transactional +  | Auth key       | 99.5% delivery,  | Twilio       |
| (Primary)   | OTP SMS India    |                | ≤30s             | automatic    |
| Twilio      | International    | Account SID +  | 99% delivery     | Push         |
| (Secondary) | SMS fallback     | token          |                  | notification |
| Gupshup     | Promotional      | API key        | 99% delivery     | WhatsApp     |
| (Reserve)   | SMS (with        |                |                  |              |
consent)
10.3 WhatsApp Business Integration
| Provider | Scope | Auth | SLA | Fallback |
| -------- | ----- | ---- | --- | -------- |
WhatsApp  Template  Bearer token +  Meta SLA, ≤30s  SMS fallback
| Cloud API  | messages,       | Webhook verify | delivery |     |
| ---------- | --------------- | -------------- | -------- | --- |
| (Meta)     | media, two-way  |                |          |     |
chat
| Interakt  | Template +  | API key | 99% delivery | Cloud API |
| --------- | ----------- | ------- | ------------ | --------- |
| (Reserve) | broadcast   |         |              |           |
62

PreOne Master PRD v1.0  |  Product Freeze
10.4 Email Integration
| Provider | Scope | Auth | SLA | Fallback |
| -------- | ----- | ---- | --- | -------- |
AWS SES  Transactional  SMTP / API +  99.9% delivery SendGrid
| (Primary) | emails (invoices,  | IAM |     | automatic |
| --------- | ------------------ | --- | --- | --------- |
receipts,
notifications)
| SendGrid    | Marketing       | API key | 99.5% delivery | Manual via  |
| ----------- | --------------- | ------- | -------------- | ----------- |
| (Secondary) | emails + backup |         |                | Gmail       |
10.5 Biometric Integration
| Provider | Scope | Auth | SLA | Fallback |
| -------- | ----- | ---- | --- | -------- |
eSSL (Primary) Staff attendance  Device SDK +  Local network Manual entry
|             | (fingerprint) | local API  |               |      |
| ----------- | ------------- | ---------- | ------------- | ---- |
| Mantra      | Aadhaar-      | Device SDK | Local network | eSSL |
| (Secondary) | compatible    |            |               |      |
biometric
| Face         | Child + staff  | AI model +  | TBD | Card / biometric |
| ------------ | -------------- | ----------- | --- | ---------------- |
| Recognition  | touchless      | camera      |     |                  |
| (Future)     | attendance     |             |     |                  |
10.6 AI / LLM Integration
| Provider  | Scope             | Auth    | SLA            | Fallback       |
| --------- | ----------------- | ------- | -------------- | -------------- |
| Z.ai GLM  | Observation       | API key | 99.5% uptime,  | Manual writing |
| (Primary) | assistant, daily  |         | 3s response    |                |
sheet draft,
report card
narrative,
parent reply
composer
63

PreOne Master PRD v1.0  |  Product Freeze
| Provider  | Scope          | Auth    | SLA          | Fallback |
| --------- | -------------- | ------- | ------------ | -------- |
| OpenAI    | Backup LLM if  | API key | 99.5% uptime | GLM      |
| (Reserve) | primary down   |         |              |          |
Vision Model  Photo tagging,  API key 99% accuracy Manual tagging
| (For Photos) | child  |     |     |     |
| ------------ | ------ | --- | --- | --- |
identification
(within school)
| Speech-to-Text  | Voice daily  | API key | 99% accuracy | Text input |
| --------------- | ------------ | ------- | ------------ | ---------- |
| (Future)        | sheet entry  |         |              |            |
10.7 Cloud Storage Integration
| Provider  | Scope       | Auth          | SLA        | Fallback      |
| --------- | ----------- | ------------- | ---------- | ------------- |
| AWS S3    | Photos,     | IAM role +    | 99.99%     | Multi-region  |
| (Primary) | documents,  | bucket policy | durability | replication   |
exports,
backups
| Cloudflare R2  | Cost-effective    | API token | 99.99%     | S3  |
| -------------- | ----------------- | --------- | ---------- | --- |
| (Secondary)    | bulk storage for  |           | durability |     |
archives
| Cloudfront CDN | Image delivery  | Origin +     | 99.99%       | Direct S3 |
| -------------- | --------------- | ------------ | ------------ | --------- |
|                | to apps         | distribution | availability |           |
10.8 Identity & SSO Integration
| Provider      | Scope          | Auth           | SLA        | Fallback     |
| ------------- | -------------- | -------------- | ---------- | ------------ |
| Internal JWT  | All user       | JWT + refresh  | 99.99%     | OTP fallback |
| (Primary)     | authentication | token          | (internal) |              |
Google OAuth  Admin SSO for  OAuth 2.0 Google SLA Internal auth
| (Future) | owners/principa |     |     |     |
| -------- | --------------- | --- | --- | --- |
ls
Microsoft  Enterprise SSO OAuth 2.0 Microsoft SLA Internal auth
OAuth (Future)
64

PreOne Master PRD v1.0  |  Product Freeze
11. Acceptance Criteria (AC)
Acceptance Criteria  हे(cid:13)  QA Team  स(cid:2)ठे(cid:17)  definitive validation rules  आहे(cid:13)त.  प$त्याक(cid:13)  AC
Given/When/Then format मध्या(cid:13) structured आहे(cid:13) ज्या(cid:2)मळे  (cid:13) test automation स(cid:30)प" हे(cid:30)त."  हे(cid:13) 50 ACs 13
domains च्या(cid:2) critical flows cover करत(cid:2)त.
AC चा(cid:2) primary purpose हे(cid:2) ensure कर(cid:23)(cid:13) आहे(cid:13) क(cid:17) implementation acceptance च्या(cid:2) व(cid:13)ळे(cid:17) user
requirements meet हे(cid:30)त(cid:2)त. प$त्याक(cid:13)  AC चा(cid:2) unique ID (AC-XXX format), scenario description,
Given (preconditions), When (trigger action), Then (expected outcome), आणि(cid:23) expected
| result आहे(cid:13). QA team या(cid:2) ACs प(cid:2)सने+ |          |  test cases derive करत(cid:30). |      |      |          |
| ------------------------------------------------------ | -------- | ------------------------------- | ---- | ---- | -------- |
| AC ID                                                  | Scenario | Given                           | When | Then | Expected |
AC-001 Lead  Reception  Capture lead  Lead created  Lead visible
|        | Capture —  | logged in    | with all      | with unique   | in pipeline   |
| ------ | ---------- | ------------ | ------------- | ------------- | ------------- |
|        | Valid      |              | mandatory     | ID, pipeline  | within 5      |
|        |            |              | fields        | entry,        | seconds;      |
|        |            |              |               | counsellor    | notification  |
|        |            |              |               | notified      | delivered     |
| AC-002 | Lead       | Lead exists  | New lead      | System        | Merge         |
|        | Capture —  | with phone   | entered with  | prompts       | option        |
|        | Duplicate  | 9876543210   | same phone    | merge with    | shown; no     |
|        |            |              | within 30     | existing lead | duplicate     |
|        |            |              | days          |               | created       |
AC-003 Conversion  Leads in  Owner views  Funnel  Report loads
|     | Report | various  | conversion   | displayed   | ≤3s; data    |
| --- | ------ | -------- | ------------ | ----------- | ------------ |
|     |        | stages   | funnel for   | with stage- | accurate     |
|     |        |          | last 30 days | wise        | within 5 min |
conversion
%
| AC-004 | Campaign  | Active    | Leads tagged  | Campaign    | Cost-per- |
| ------ | --------- | --------- | ------------- | ----------- | --------- |
|        | Tracking  | campaign  | with          | ROI tracked | lead and  |
|        |           | with UTM  | campaign      |             | cost-per- |
admission
calculated
65

PreOne Master PRD v1.0  |  Product Freeze
| AC ID  | Scenario     | Given       | When         | Then         | Expected     |
| ------ | ------------ | ----------- | ------------ | ------------ | ------------ |
| AC-005 | Online       | Parent has  | Submit       | Application  | Application  |
|        | Application  | app access  | application  | ID           | visible to   |
|        | — Valid      |             | with all     | generated,   | school       |
|        |              |             | mandatory    | acknowledg   | within 10s;  |
|        |              |             | fields +     | ment sent    | parent       |
|        |              |             | documents    |              | notified     |
AC-006 Document  Application  Reception  Workflow  [Please fill
|     | Verification | submitted  | reviews and  | advances to  | in] |
| --- | ------------ | ---------- | ------------ | ------------ | --- |
|     |              | with       | approves     | next stage;  |     |
|     |              | documents  | documents    | parent       |     |
notified
AC-007 Offer Letter  Application  Principal  PDF  Offer expiry
|        | Generation  | reached     | generates    | generated       | 7-15 days     |
| ------ | ----------- | ----------- | ------------ | --------------- | ------------- |
|        |             | offer stage | offer letter | with merge      | from issue;   |
|        |             |             |              | fields, parent  | unique offer  |
|        |             |             |              | notified        | ID            |
| AC-008 | Enrollment  | Offer       | System       | Records         | Sync          |
|        | & Cross-    | accepted +  | creates      | created in all  | complete      |
|        | domain Sync | admission   | student      | 13 domains;     | within 30s;   |
|        |             | fee paid    | record       | welcome         | zero data     |
|        |             |             |              | notification    | loss          |
sent
AC-009 Class  Class has 18  Allocate new  Allocation  Teacher
|        | Allocation —  | students,   | student    | successful;  | notified;  |
| ------ | ------------- | ----------- | ---------- | ------------ | ---------- |
|        | Capacity OK   | capacity 25 |            | roster       | parent     |
|        |               |             |            | updated      | notified   |
| AC-010 | Class         | Class at    | Attempt    | System       | Waitlist   |
|        | Allocation —  | 25/25       | allocation | blocks +     | option     |
|        | Capacity Full | capacity    |            | suggests     | offered    |
alternative
| AC-011 | Student  | Student      | Transfer to    | Transfer      | Both        |
| ------ | -------- | ------------ | -------------- | ------------- | ----------- |
|        | Transfer | enrolled in  | Class B (with  | record        | teachers +  |
|        |          | Class A      | capacity)      | created; old  | parent      |
|        |          |              |                | archived;     | notified    |
new roster
updated
66

PreOne Master PRD v1.0  |  Product Freeze
| AC ID | Scenario | Given | When | Then | Expected |
| ----- | -------- | ----- | ---- | ---- | -------- |
AC-012 Promotion  Academic  Principal  All eligible  New year
|     | Cycle | year ending;  | triggers bulk  | students     | records      |
| --- | ----- | ------------- | -------------- | ------------ | ------------ |
|     |       | students      | promotion      | promoted to  | created;     |
|     |       | completed     |                | next         | ineligible   |
|     |       | session       |                | program      | flagged for  |
review
| AC-013 | Observation  | Teacher     | Teacher      | Observation  | AI           |
| ------ | ------------ | ----------- | ------------ | ------------ | ------------ |
|        | Recording    | logged in;  | records      | saved;       | suggestion   |
|        |              | student in  | observation  | parent       | offered;     |
|        |              | class       | with         | notified;    | teacher can  |
|        |              |             | milestone +  | milestone    | accept/rejec |
|        |              |             | text + photo | progress     | t/edit       |
updated
| AC-014 | Milestone  | Multiple      | View       | Progress   | Delayed       |
| ------ | ---------- | ------------- | ---------- | ---------- | ------------- |
|        | Tracking   | observations  | milestone  | shown per  | milestones    |
|        |            | recorded for  | tracker    | developmen | flagged with  |
|        |            | child         |            | t area     | alert         |
AC-015 Portfolio  Observations  Generate  PDF  File size ≤25
|     | Generation | recorded    | portfolio PDF | compiled      | MB; parent  |
| --- | ---------- | ----------- | ------------- | ------------- | ----------- |
|     |            | over a term |               | with          | shareable   |
|     |            |             |               | observations  | link        |
|     |            |             |               | + photos +    | generated   |
milestones
| AC-016 | Report Card  | Term          | Teacher      | AI draft →  | AI draft       |
| ------ | ------------ | ------------- | ------------ | ----------- | -------------- |
|        | Workflow     | completed;    | triggers     | teacher     | ready ≤30s;    |
|        |              | observations  | report card  | review →    | full cycle ≤2  |
|        |              | recorded      | generation   | principal   | hours per      |
|        |              |               |              | approval →  | class          |
parent share
| AC-017 | Attendance  | Teacher       | Mark        | Records      | One record    |
| ------ | ----------- | ------------- | ----------- | ------------ | ------------- |
|        | — Valid     | logged in;    | attendance  | saved;       | per student   |
|        |             | class roster  | for all     | parents of   | per day;      |
|        |             | loaded        | students +  | absent/late  | submission    |
|        |             |               | submit      | notified     | before cutoff |
AC-018 Attendance  Attendance  Teacher  System  Edit allowed
|     | — Duplicate | already     | submits  | displays    | with reason;  |
| --- | ----------- | ----------- | -------- | ----------- | ------------- |
|     |             | marked for  | again    | duplicate   | original      |
|     |             | student     |          | attendance  | preserved in  |
|     |             | today       |          | validation  | audit         |
67

PreOne Master PRD v1.0  |  Product Freeze
| AC ID  | Scenario    | Given    | When           | Then          | Expected      |
| ------ | ----------- | -------- | -------------- | ------------- | ------------- |
| AC-019 | Daily Sheet | Student  | Teacher fills  | Sheet         | AI draft      |
|        |             | present  | daily sheet +  | published to  | assist        |
|        |             | today    | submits        | parent        | offered; all  |
|        |             |          |                | timeline;     | sections      |
|        |             |          |                | analytics     | validated     |
updated
| AC-020 | Incident —  | Student  | Teacher   | Instant      | Notification  |
| ------ | ----------- | -------- | --------- | ------------ | ------------- |
|        | Critical    | present  | reports   | parent push  | ≤5s; follow-  |
|        |             |          | critical  | + call       | up task auto- |
|        |             |          | incident  | prompt;      | created       |
coordinator
+ principal
alerted
| AC-021 | Activity  | Activity  | Teacher logs  | Photos  | Photo ≤5MB  |
| ------ | --------- | --------- | ------------- | ------- | ----------- |
Logging with  scheduled activity with  uploaded to  each, max
|     | Photos |     | photos | gallery;  | 10; upload  |
| --- | ------ | --- | ------ | --------- | ----------- |
|     |        |     |        | parent    | ≤10s        |
timeline
updated
| AC-022 | Parent   | Child has   | Parent    | Timeline  | Load ≤3s;   |
| ------ | -------- | ----------- | --------- | --------- | ----------- |
|        | Timeline | activities  | opens app | shows     | only own    |
|        |          | today       |           | today's   | child data  |
|        |          |             |           | events    | visible     |
reverse-
chronologica
l
AC-023 Two-way  Parent +  Parent sends  Teacher gets  Delivery ≤5s;
|     | Chat | teacher both  | message to  | push           | SLA-based  |
| --- | ---- | ------------- | ----------- | -------------- | ---------- |
|     |      | have app      | teacher     | notification;  | response   |
|     |      | access        |             | can reply;     | reminder   |
read receipts
| AC-024 | Announcem | Principal     | Send to  | Multi-    | Delivery      |
| ------ | --------- | ------------- | -------- | --------- | ------------- |
|        | ent       | composes      | school   | channel   | ≥99% per      |
|        | Broadcast | announceme    | audience | delivery  | channel; ack  |
|        |           | nt for school |          | (push +   | rate tracked  |
email +
WhatsApp);
ack tracked
68

PreOne Master PRD v1.0  |  Product Freeze
| AC ID  | Scenario   | Given         | When    | Then         | Expected       |
| ------ | ---------- | ------------- | ------- | ------------ | -------------- |
| AC-025 | Event RSVP | Event         | Parent  | RSVP         | Reminder       |
|        |            | created with  | RSVPs   | recorded;    | sent 24h +     |
|        |            | RSVP          | yes/no  | coordinator  | 1h before;     |
|        |            |               |         | sees count   | photo gallery  |
post-event
| AC-026 | Fee Plan   | Principal     | Create fee  | Plan           | Validation:  |
| ------ | ---------- | ------------- | ----------- | -------------- | ------------ |
|        | Creation   | logged in;    | plan with   | published;     | amount > 0;  |
|        |            | academic      | components  | available for  | components   |
|        |            | year          | + amounts   | enrollment     | non-         |
|        |            | configured    |             |                | overlapping  |
| AC-027 | Invoice    | Students      | Cycle       | Invoices       | Unique       |
|        | Generation | enrolled      | triggers    | generated      | sequential   |
|        |            | with fee plan | invoice     | per student;   | invoice      |
|        |            |               | generation  | GST            | number; due  |
|        |            |               |             | breakdown      | date ≥7 days |
correct
| AC-028 | Payment  | Invoice   | Parent pays  | Payment     | Receipt    |
| ------ | -------- | --------- | ------------ | ----------- | ---------- |
|        | Success  | generated | via UPI      | recorded;   | unique;    |
|        |          |           | successfully | receipt     | parent     |
|        |          |           |              | generated;  | notified;  |
|        |          |           |              | ledger      | accounts   |
|        |          |           |              | updated     | dashboard  |
updated
| AC-029 | Receipt    | Payment    | System     | Receipt PDF  | Number      |
| ------ | ---------- | ---------- | ---------- | ------------ | ----------- |
|        | Generation | successful | generates  | with unique  | sequential  |
|        |            |            | receipt    | number +     | per school  |
|        |            |            |            | GST          | per FY;     |
|        |            |            |            | breakdown    | downloadabl |
e + archived
| AC-030 | Refund   | Payment   | Process     | Approval →    | Principal    |
| ------ | -------- | --------- | ----------- | ------------- | ------------ |
|        | Workflow | exists;   | refund per  | gateway       | ≤₹5000;      |
|        |          | refund    | approval    | refund →      | Owner        |
|        |          | requested | matrix      | credit note   | >₹5000; TAT  |
|        |          |           |             | → audit trail | ≤7 days      |
AC-031 Purchase  Coordinator  Raise PR  PR created;  Justification
|     | Request | logged in;  | with item +   | approval  | ≥20 chars;    |
| --- | ------- | ----------- | ------------- | --------- | ------------- |
|     |         | items in    | qty +         | workflow  | expected      |
|     |         | catalog     | justification | triggered | date ≥3 days  |
from now
69

PreOne Master PRD v1.0  |  Product Freeze
| AC ID  | Scenario   | Given       | When         | Then        | Expected          |
| ------ | ---------- | ----------- | ------------ | ----------- | ----------------- |
| AC-032 | PO         | PR approved | Generate PO  | PO PDF      | Vendor from       |
|        | Generation |             | with vendor  | generated;  | approved          |
|        |            |             | + line items | vendor      | list; total > 0;  |
|        |            |             |              | emailed;    | terms valid       |
acknowledg
ment
tracked
| AC-033 | GRN       | PO sent to  | Record GRN    | Stock       | Received ≤     |
| ------ | --------- | ----------- | ------------- | ----------- | -------------- |
|        | Recording | vendor;     | with          | incremented | PO qty;        |
|        |           | goods       | quantity +    | ; invoice   | quality check  |
|        |           | received    | quality check | matched;    | mandatory      |
payment
release
triggered
| AC-034 | Stock Issue | Stock     | Issue stock   | Stock      | Stock ≥ issue  |
| ------ | ----------- | --------- | ------------- | ---------- | -------------- |
|        |             | available | to classroom  | decremente | qty; purpose   |
|        |             |           | with purpose  | d; ledger  | documented     |
updated;
returnable
flag set
| AC-035 | Negative   | Stock at 5  | Attempt      | System         | Error    |
| ------ | ---------- | ----------- | ------------ | -------------- | -------- |
|        | Stock      | units       | issue of 10  | blocks issue;  | message  |
|        | Prevention |             | units        | suggests       | clear;   |
|        |            |             |              | reorder        | reorder  |
suggestion
shown
| AC-036 | Leave    | Staff has  | Apply for   | Approval    | Balance       |
| ------ | -------- | ---------- | ----------- | ----------- | ------------- |
|        | Workflow | leave      | leave with  | chain       | check;        |
|        |          | balance    | dates +     | triggered;  | coverage      |
|        |          |            | reason      | calendar    | alert if      |
|        |          |            |             | updated on  | critical role |
approval
| AC-037 | Payroll    | Attendance    | Accounts    | Payslips    | 100%         |
| ------ | ---------- | ------------- | ----------- | ----------- | ------------ |
|        | Processing | + leave data  | triggers    | generated;  | accuracy;    |
|        |            | complete for  | payroll run | bank file   | staff        |
|        |            | month         |             | created;    | notified;    |
|        |            |               |             | ledger      | bank file    |
|        |            |               |             | updated     | format valid |
70

PreOne Master PRD v1.0  |  Product Freeze
| AC ID | Scenario | Given | When | Then | Expected |
| ----- | -------- | ----- | ---- | ---- | -------- |
AC-038 Performance  Staff  Manager  Self + peer +  All goals
|     | Review | enrolled ≥3  | initiates  | manager       | rated;     |
| --- | ------ | ------------ | ---------- | ------------- | ---------- |
|     |        | months       | review     | feedback      | feedback   |
|     |        |              |            | cycle; final  | ≥50 chars  |
|     |        |              |            | rating + dev  | per goal   |
plan
AC-039 Recruitment Position  HR posts job  Pipeline:  Offer within
|     |     | approved    | + collects   | applications  | budget;     |
| --- | --- | ----------- | ------------ | ------------- | ----------- |
|     |     | with budget | applications | → screening   | onboarding  |
|     |     |             |              | → interview   | tasks auto- |
|     |     |             |              | → offer →     | created     |
onboard
| AC-040 | Asset    | Asset       | Scan QR to  | Asset record   | Depreciation  |
| ------ | -------- | ----------- | ----------- | -------------- | ------------- |
|        | Tracking | registered  | view asset  | shown with     | auto-         |
|        |          | with QR     | details     | location,      | calculated;   |
|        |          |             |             | assignment,    | audit trail   |
|        |          |             |             | maintenance    | visible       |
| AC-041 | Visitor  | Visitor     | Capture     | Host           | Photo         |
|        | Check-in | arrives;    | details +   | notified;      | mandatory;    |
|        |          | reception   | photo +     | visitor badge  | pickup →      |
|        |          | logged in   | purpose +   | printed;       | child auth    |
|        |          |             | host        | check-in       | contact       |
|        |          |             |             | logged         | verified      |
AC-042 Unauthorize Visitor  Visitor not in  System  Child not
|     | d Pickup | attempts     | authorized    | denies;        | released;    |
| --- | -------- | ------------ | ------------- | -------------- | ------------ |
|     |          | child pickup | contacts list | parent         | principal    |
|     |          |              |               | called; alert  | alerted;     |
|     |          |              |               | raised         | audit logged |
AC-043 Compliance  Compliance  System  Alert raised  Critical if
|        | Alert      | item expiry  | checks daily | to principal +  | expired;      |
| ------ | ---------- | ------------ | ------------ | --------------- | ------------- |
|        |            | approaching  |              | owner;          | dashboard     |
|        |            | (60 days)    |              | renewal task    | reflects      |
|        |            |              |              | created         | status        |
| AC-044 | Dashboard  | Owner logs   | Open         | Real-time       | Load ≤3s;     |
|        | Load       | in           | dashboard    | KPIs            | data refresh  |
|        |            |              |              | displayed       | ≤5 min; role- |
|        |            |              |              | per role        | based scope   |
enforced
71

PreOne Master PRD v1.0  |  Product Freeze
| AC ID  | Scenario    | Given       | When          | Then         | Expected       |
| ------ | ----------- | ----------- | ------------- | ------------ | -------------- |
| AC-045 | Custom      | User has    | Build custom  | Report       | Fields         |
|        | Report      | report-     | report with   | preview +    | compatible     |
|        |             | builder     | fields +      | save +       | with source;   |
|        |             | permission  | filters       | schedule     | heavy query    |
|        |             |             |               | options      | async          |
| AC-046 | Predictive  | Sufficient  | Run           | Predictions  | Confidence     |
|        | Analytics   | historical  | prediction    | with         | displayed;     |
|        |             | data (≥6    | for           | confidence   | recommend      |
|        |             | months)     | admission     | score +      | ation tied to  |
|        |             |             | conversion    | recommend    | prediction     |
ations
| AC-047 | School  | Principal  | Edit school    | Impact        | Affects      |
| ------ | ------- | ---------- | -------------- | ------------- | ------------ |
|        | Config  | logged in  | config (e.g.,  | analysis      | enrolled     |
|        | Change  |            | add class)     | shown;        | students →   |
|        |         |            |                | cascade with  | explicit     |
|        |         |            |                | confirmation  | confirmation |
AC-048 Notification  Coordinator  Create  Rule saved;  Channel
|     | Rule | has settings  | notification  | test send    | enabled;     |
| --- | ---- | ------------- | ------------- | ------------ | ------------ |
|     |      | permission    | rule for      | executed;    | template     |
|     |      |               | event         | audit logged | valid; test  |
delivers
| AC-049 | Workflow  | Principal  | Customize  | Within        | Guardrail     |
| ------ | --------- | ---------- | ---------- | ------------- | ------------- |
|        | Builder   | with       | approval   | guardrails →  | violation →   |
|        |           | workflow   | workflow   | saved +       | blocked with  |
|        |           | builder    |            | activated     | explanation   |
permission
| AC-050 | Tenant     | Sales closed;  | Platform     | Tenant        | Unique       |
| ------ | ---------- | -------------- | ------------ | ------------- | ------------ |
|        | Onboarding | contract       | admin        | created;      | tenant ID;   |
|        |            | signed         | creates new  | admin user;   | admin email  |
|        |            |                | tenant       | sample data;  | unique; go-  |
|        |            |                |              | training      | live plan    |
scheduled
11.1 Acceptance Criteria Template
प$त्याक(cid:13)  AC खा(cid:2)ल(cid:17)ल template नेस  (cid:2)र structured आहे(cid:13). QA team या(cid:2) template चा(cid:2) व(cid:2)पर करूने test cases
णिलणिहेत(cid:30) आणि(cid:23) automation scripts develop करत(cid:30):
72

PreOne Master PRD v1.0  |  Product Freeze
| Field          | Description              | Example |
| -------------- | ------------------------ | ------- |
| Requirement ID | Stable identifier AC-XXX | AC-018  |
Scenario Brief scenario description Attendance already marked
| Given | Precondition / state | Attendance already marked  |
| ----- | -------------------- | -------------------------- |
for student today
| When | Trigger action           | Teacher submits again      |
| ---- | ------------------------ | -------------------------- |
| Then | Expected system behavior | System displays duplicate  |
attendance validation
Expected Result Measurable outcome Edit allowed with reason;
original preserved in audit
12. Out of Scope
Out of Scope section clearly define करत(cid:30) क(cid:2)या PreOne v1.0 मध्या(cid:13) deliver हे(cid:30)(cid:23)(cid:2)र ने(cid:2)हे(cid:17). हे(cid:13) scope
management चा(cid:2) critical tool आहे(cid:13) — feature creep prevent करत(cid:30) आणि(cid:23) v1.0 च्या(cid:2) release
timeline ल(cid:2) realistic ठे(cid:13)वत(cid:30). खा(cid:2)ल(cid:17)ल items explicitly future versions णिक"व(cid:2) partner ecosystem कडे(cid:13)
delegated क(cid:13) ल (cid:13)आहे(cid:13)त.
Out of scope decisions चा(cid:2) rationale त(cid:17)ने principles वर आधी(cid:2)णिरत आहे(cid:13): (1) Core focus preservation
— preschool-specific workflows ल(cid:2) priority; (2) Build vs Buy — generic capabilities (e.g.,
accounting) ल(cid:2) integrate कर(cid:23)(cid:13) अप(cid:13)णिBत ने(cid:2)हे(cid:17); (3) v1.0 timeline — 12-month delivery window
मध्या (cid:13)feasible scope only. प$त्याक(cid:13)  out-of-scope item चा(cid:2) revisit plan documented आहे(cid:13).
12.1 Explicitly Excluded from v1.0
| Item | Reason | Revisit Plan |
| ---- | ------ | ------------ |
K-12 / College / University  PreOne हे(cid:13) exclusively  Out of strategic scope
| support | preschool-specific; K-12  | permanently |
| ------- | ------------------------- | ----------- |
fundamentally different data
model
Full accounting system (Tally  Tally/Busy already mature;  v1.1: Tally XML export; v1.2:
| replacement) | integrate via export only | real-time sync API |
| ------------ | ------------------------- | ------------------ |
Transport management with  Complex operational feature;  v1.1+ with partner
| live GPS | not core to preschool | integration |
| -------- | --------------------- | ----------- |
73

PreOne Master PRD v1.0  |  Product Freeze
| Item | Reason | Revisit Plan |
| ---- | ------ | ------------ |
Hostel / Residential  Not applicable to preschool  Out of strategic scope
| management | segment |     |
| ---------- | ------- | --- |
Library management Preschools rarely have  v1.2 if demand emerges
formal libraries
Examination & gradebook  Preschools use observations  Out of strategic scope
| (K-12 style) | + milestones, not exams | permanently |
| ------------ | ----------------------- | ----------- |
Multi-country tax compliance v1.0 India-only (GST);  Year 3+ with global
|     | international tax complex | expansion |
| --- | ------------------------- | --------- |
Third-party marketplace Requires significant seller  v2.0 with ecosystem play
onboarding infrastructure
Parent community / social  Privacy concerns; not core to  v2.0 with opt-in model
| network | operations |     |
| ------- | ---------- | --- |
AI voice-based daily sheet  Speech-to-text accuracy for  v1.2 with proven accuracy
| entry | Indian languages still  |     |
| ----- | ----------------------- | --- |
improving
Biometric child attendance  Privacy concerns with  v1.2 with parent consent +
| (face recognition) | minors; tech not mature | legal review |
| ------------------ | ----------------------- | ------------ |
Wearable device integration  Cost-prohibitive for  v2.0+ with partner
| (smart bands)          | preschools      | ecosystem            |
| ---------------------- | --------------- | -------------------- |
| Multi-currency support | India-only v1.0 | Year 3+ with global  |
expansion
Offline-first mobile app Online-first acceptable for  v1.2 for low-connectivity
|     | v1.0; offline complex | areas |
| --- | --------------------- | ----- |
Custom integrations  Requires developer  v2.0 with public API
| marketplace | ecosystem |     |
| ----------- | --------- | --- |
Advanced HR (training LMS,  Core HR enough for v1.0;  v1.2+ if demand
| recruitment ATS) | advanced HR feature creep |     |
| ---------------- | ------------------------- | --- |
Marketing automation (email  Marketing CRM focus on lead  v1.2 with marketing module
sequences, drip campaigns) pipeline, not automation expansion
Parent payment gateway EMI  Requires NBFC partnerships v1.2 with partner
options
74

PreOne Master PRD v1.0 | Product Freeze
12.2 Future Roadmap Placeholder
खा(cid:2)ल(cid:17)ल items v1.0 च्या(cid:2) बा(cid:2)हे(cid:13)र आहे(cid:13)त प(cid:23) product roadmap मध्या(cid:13) tracked आहे(cid:13)त. हे(cid:13) items Vision v1.0
Section 13 (Long-Term Product Vision 5-10 Years) श(cid:17) aligned आहे(cid:13)त:
• v1.1 (Q1 2027): Tally XML export, biometric integration improvements, custom
report builder enhancements, transport management with partner, voice daily
sheet pilot.
• v1.2 (Q3 2027): Multi-language expansion (Tamil, Telugu, Kannada), offline-first
mobile, advanced HR (LMS), marketing automation, EMI options.
• v2.0 (2028+): Marketplace launch, parent community (opt-in), wearable
integration, advanced AI (vision-based observations, predictive milestone alerts at
scale).
• v3.0 (2029+): International expansion (SE Asia, Middle East, Africa), multi-currency,
global compliance frameworks, third-party integrations marketplace.
13. Traceability Matrix (RTM)
Requirement Traceability Matrix (RTM) हे(cid:2) PreOne च्या(cid:2) requirements engineering चा(cid:2) final
quality gate आहे(cid:13). या(cid:2)त प$त्याश(cid:13) requirement चा(cid:2) complete trace chain documented आहे(cid:13) — Vision
→ BR → FR → BRC → AC → Test Case → Implementation. हे(cid:13) traceability ensure करत(cid:13) क(cid:17)
क(cid:30)(cid:23)त(cid:2)हे(cid:17) requirement orphaned ने(cid:2)हे(cid:17) आणि(cid:23) क(cid:30)(cid:23)त(cid:2)हे(cid:17) implementation un-traced ने(cid:2)हे(cid:17).
RTM चा(cid:2) primary use case: (1) Impact analysis — BR change क(cid:13) ल(cid:2) तर क(cid:30)(cid:23)त (cid:13)FRs, BRC rules, ACs
affected हे(cid:30)त(cid:17)ल; (2) Coverage analysis — क(cid:30)(cid:23)त्या(cid:2) BRs चा(cid:17) ACs प(cid:23)+ (cid:20) झा(cid:2)ल(cid:17) आहे(cid:13)त; (3) Audit
compliance — ISO 27001 / SOC 2 audits मध्या (cid:13)traceability mandatory; (4) Onboarding — new
team members ल(cid:2) context णिमळेत(cid:30). खा(cid:2)ल(cid:17)ल master table 30 BRs चा(cid:2) trace chain दश(cid:20)वत(cid:30).
13.1 Requirements Flow
PreOne च्या(cid:2) requirements hierarchy खा(cid:2)ल(cid:17)लप$म(cid:2)(cid:23) (cid:13)आहे(cid:13). हे(cid:17) hierarchy top-down आहे (cid:13)— वरचा(cid:2) layer
खा(cid:2)लच्या(cid:2) layer ल(cid:2) drive करत(cid:30), आणि(cid:23) खा(cid:2)लचा(cid:2) layer वरच्या(cid:2) layer चा(cid:2) verification provide करत(cid:30):
Vision → Business Requirement (BR) → Functional Requirement (FR) → Business Rule (BRC)
→ Acceptance Criteria (AC) → Test Case (TC) → Implementation
75

PreOne Master PRD v1.0  |  Product Freeze
13.2 Master Traceability Matrix
| BR ID | BR Title | FR IDs | BRC  | AC IDs | Status |
| ----- | -------- | ------ | ---- | ------ | ------ |
Category
| BR-001 | Student   | FR-006 to  | Eligibility &  | AC-005 to  | Covered |
| ------ | --------- | ---------- | -------------- | ---------- | ------- |
|        | Admission | FR-010     | Approval       | AC-008     |         |
| BR-002 | Parent    | FR-026 to  | Communica      | AC-022 to  | Covered |
|        | Communica | FR-029     | tion           | AC-025     |         |
tion
| BR-003 | Daily       | FR-020 to  | Operational | AC-017 to  | Covered |
| ------ | ----------- | ---------- | ----------- | ---------- | ------- |
|        | Operations  | FR-025     |             | AC-021     |         |
Digital
| BR-004 | Fee       | FR-030 to  | Financial | AC-026 to  | Covered |
| ------ | --------- | ---------- | --------- | ---------- | ------- |
|        | Managemen | FR-035     |           | AC-030     |         |
t
| BR-005 | Inventory  | FR-036 to  | Inventory | AC-031 to  | Covered |
| ------ | ---------- | ---------- | --------- | ---------- | ------- |
|        | Managemen  | FR-039     |           | AC-035     |         |
t
| BR-006 | Multi-School  | FR-054 to  | Platform       | AC-050 to  | Covered |
| ------ | ------------- | ---------- | -------------- | ---------- | ------- |
|        | SaaS          | FR-056     |                | AC-053     |         |
| BR-007 | Lead          | FR-001 to  | Eligibility &  | AC-001 to  | Covered |
|        | Capture &     | FR-005     | Notification   | AC-004     |         |
CRM
| BR-008 | Student      | FR-011 to  | Eligibility | AC-009 to  | Covered |
| ------ | ------------ | ---------- | ----------- | ---------- | ------- |
|        | Lifecycle    | FR-014     |             | AC-012     |         |
| BR-009 | Academic     | FR-015 to  | Academic    | AC-013 to  | Covered |
|        | Observations | FR-019     |             | AC-016     |         |
| BR-010 | HR & Payroll | FR-040 to  | HR          | AC-036 to  | Covered |
|        |              | FR-043     |             | AC-039     |         |
| BR-011 | Compliance   | FR-047     | Compliance  | AC-043     | Covered |
Managemen
t
| BR-012 | Real-time     | FR-048 to  | Platform &   | AC-044 to  | Covered |
| ------ | ------------- | ---------- | ------------ | ---------- | ------- |
|        | Dashboards    | FR-050     | Notification | AC-046     |         |
| BR-013 | Notification  | FR-052     | Notification | AC-048     | Covered |
Engine
76

PreOne Master PRD v1.0  |  Product Freeze
| BR ID | BR Title | FR IDs | BRC  | AC IDs | Status |
| ----- | -------- | ------ | ---- | ------ | ------ |
Category
| BR-014 | Audit Trail | FR-056   | Platform | AC-052   | Covered   |
| ------ | ----------- | -------- | -------- | -------- | --------- |
| BR-015 | Mobile Apps | FR-057,  | Platform | AC-022,  | Covered   |
|        |             | FR-058   |          | AC-044   |           |
| BR-016 | Multi-      | FR-059   | Platform | AC-044   | Covered   |
|        | language    |          |          |          | (partial) |
Support
| BR-017 | Visitor   | FR-045   | Operational  | AC-041,  | Covered |
| ------ | --------- | -------- | ------------ | -------- | ------- |
|        | Managemen |          | &            | AC-042   |         |
|        | t         |          | Compliance   |          |         |
| BR-018 | Asset     | FR-044,  | Operational  | AC-040   | Covered |
|        | Managemen | FR-046   |              |          |         |
t
| BR-019 | Event     | FR-029 | Communica | AC-025 | Covered |
| ------ | --------- | ------ | --------- | ------ | ------- |
|        | Managemen |        | tion      |        |         |
t
| BR-020 | Report Cards | FR-019 | Academic     | AC-016 | Covered |
| ------ | ------------ | ------ | ------------ | ------ | ------- |
| BR-021 | Refund       | FR-034 | Financial &  | AC-030 | Covered |
|        | Processing   |        | Approval     |        |         |
| BR-022 | Bulk         | FR-060 | Platform     | AC-008 | Covered |
Import/Expo
rt
| BR-023 | Custom  | FR-053 | Platform | AC-049 | Covered |
| ------ | ------- | ------ | -------- | ------ | ------- |
Workflows
| BR-024 | Biometric    | FR-020        | Operational | AC-017 | Covered       |
| ------ | ------------ | ------------- | ----------- | ------ | ------------- |
|        | Attendance   | (integration) |             |        | (integration) |
| BR-025 | AI           | FR-016 (AI    | Academic    | AC-013 | Covered       |
|        | Observation  | feature)      |             |        |               |
Assistant
| BR-026 | Parent       | FR-028   | Communica | AC-024 | Covered   |
| ------ | ------------ | -------- | --------- | ------ | --------- |
|        | Feedback     | (survey) | tion      |        |           |
| BR-027 | Third-party  | Future   | Platform  | Future | Deferred  |
|        | Integrations |          |           |        | v1.1+     |
77

PreOne Master PRD v1.0  |  Product Freeze
| BR ID | BR Title | FR IDs | BRC  | AC IDs | Status |
| ----- | -------- | ------ | ---- | ------ | ------ |
Category
| BR-028 | Transport  | Future | Operational | Future | Deferred  |
| ------ | ---------- | ------ | ----------- | ------ | --------- |
|        | Managemen  |        |             |        | v1.1+     |
t
| BR-029 | Marketplace | Future | Platform | Future | Deferred  |
| ------ | ----------- | ------ | -------- | ------ | --------- |
v2.0+
| BR-030 | Voice Daily  | Future | Operational | Future | Deferred  |
| ------ | ------------ | ------ | ----------- | ------ | --------- |
|        | Sheet        |        |             |        | v1.2+     |
13.3 Coverage Summary
RTM coverage analysis खा(cid:2)ल(cid:17)लप$म(cid:2)(cid:23)(cid:13) आहे(cid:13). हे(cid:2) summary identify करत(cid:30) क(cid:30)(cid:23)त(cid:13) BRs v1.0 मध्या(cid:13) fully
covered आहे(cid:13)त आणि(cid:23) क(cid:30)(cid:23)त(cid:13) future versions कडे(cid:13) deferred आहे(cid:13)त:
| Coverage Status      | BR Count |     | % of Total | Notes            |     |
| -------------------- | -------- | --- | ---------- | ---------------- | --- |
| Fully Covered (v1.0) | 26       |     | 87%        | P0 + P1 BRs all  |     |
covered with FRs +
ACs
| Partially Covered | 1   |     | 3%  | BR-016 Multi- |     |
| ----------------- | --- | --- | --- | ------------- | --- |
language: 3 of 8
languages in v1.0
| Deferred to v1.1+ | 2   |     | 7%  | BR-027 Integrations,  |     |
| ----------------- | --- | --- | --- | --------------------- | --- |
BR-028 Transport
| Deferred to v2.0+ | 1   |     | 3%  | BR-029 Marketplace  |     |
| ----------------- | --- | --- | --- | ------------------- | --- |
| Deferred to v1.2+ | 1   |     | 3%  | BR-030 Voice daily  |     |
sheet
| Total | 30  |     | 100% | All 30 BRs traceable  |     |
| ----- | --- | --- | ---- | --------------------- | --- |
to FR/BRC/AC or
deferred
78

PreOne Master PRD v1.0 | Product Freeze
13.4 Traceability Process
RTM चा(cid:2) maintenance खा(cid:2)ल(cid:17)ल process द्वा(cid:2)र(cid:13) हे(cid:30)त(cid:30). हे(cid:2) process software development lifecycle चा(cid:2)
embedded step आहे(cid:13) — separate RTM update activity ने(cid:2)हे(cid:17):
• Requirement Creation: नेव(cid:17)ने BR/FR/AC created करत(cid:2)ने(cid:2) traceability links mandatory.
णिबाने(cid:2) trace chain क(cid:30)(cid:23)त(cid:2)हे(cid:17) requirement merged हे(cid:30)(cid:23)(cid:2)र ने(cid:2)हे(cid:17).
• Sprint Planning: Each sprint RTM review करत(cid:30) — orphan requirements identified,
missing ACs flagged.
• Code Review: PR template मध्या (cid:13)"Related AC" field mandatory — code without AC
reference rejected.
• QA Cycle: Test cases traceable to ACs; AC without test case flagged; coverage
report auto-generated.
• Release Sign-off: Release readiness check: 100% P0 BRs covered, ≥95% P1 covered,
0 orphan ACs.
• Quarterly Audit: RTM completeness audit by Product team; gaps remediated within
sprint.
Appendix A: Document Control
Document Control section या(cid:2) PRD च्या(cid:2) versioning, approval, distribution, आणि(cid:23) maintenance
चा(cid:2) authoritative record आहे(cid:13). हे(cid:2) section ISO 27001 / SOC 2 documentation requirements श(cid:17)
compliant आहे(cid:13).
A.1 Version History
Version Date Author Changes Status
0.1 2026-06-01 Product Team Initial draft — Draft
outline +
sections 1-3
0.5 2026-06-15 Product Team Added sections Draft
4-7 (FR, NFR,
BR, Roles)
0.8 2026-06-25 Product Team Added section 8 Draft
(Module
Requirements
for 13 domains)
79

PreOne Master PRD v1.0  |  Product Freeze
| Version | Date       | Author       | Changes         | Status   |
| ------- | ---------- | ------------ | --------------- | -------- |
| 0.9     | 2026-07-01 | Product Team | Added sections  | Reviewed |
9-13 + Appendix
A; integrated
BRC v1.0
references
| 1.0 | 2026-07-12 | Product Team | Product Freeze  | Frozen |
| --- | ---------- | ------------ | --------------- | ------ |
— reviewed +
approved by all
stakeholders
A.2 Approval Matrix
या(cid:2) PRD v1.0 च्या(cid:2) Product Freeze स(cid:2)ठे(cid:17) खा(cid:2)ल(cid:17)ल stakeholders चा(cid:17) approval mandatory हे(cid:30)त(cid:17). सव(cid:20)
approvals documented आणि(cid:23) archived आहे(cid:13)त:
| Role           | Name       | Department | Approval Date | Signature     |
| -------------- | ---------- | ---------- | ------------- | ------------- |
| Chief Product  | 【CPO Name】 | Product    | 2026-07-12    | 【Digital      |
| Officer        |            |            |               | signature on  |
file】
| VP Engineering | 【VP Eng  | Engineering | 2026-07-12 | 【Digital      |
| -------------- | -------- | ----------- | ---------- | ------------- |
|                | Name】    |             |            | signature on  |
file】
| Compliance  | 【Compliance  | Legal &    | 2026-07-12 | 【Digital      |
| ----------- | ------------ | ---------- | ---------- | ------------- |
| Officer     | Name】        | Compliance |            | signature on  |
file】
| Business Head | 【Business  | Business | 2026-07-12 | 【Digital      |
| ------------- | ---------- | -------- | ---------- | ------------- |
|               | Head Name】 |          |            | signature on  |
file】
| Operations  | 【Ops Head  | Operations | 2026-07-12 | 【Digital      |
| ----------- | ---------- | ---------- | ---------- | ------------- |
| Head        | Name】      |            |            | signature on  |
file】
| Academic  | 【Academic     | Academic | 2026-07-12 | 【Digital      |
| --------- | ------------- | -------- | ---------- | ------------- |
| Advisor   | Advisor Name】 |          |            | signature on  |
file】
80

PreOne Master PRD v1.0  |  Product Freeze
A.3 Review Cadence
PRD v1.0 freeze नेत" र खा(cid:2)ल(cid:17)ल review cadence follow क(cid:13) ल(cid:2) जा(cid:2)ईल. हे(cid:17) cadence ensure करत(cid:13) क(cid:17)
document living artifact र(cid:2)हेत(cid:30) आणि(cid:23) stale हे(cid:30)त ने(cid:2)हे(cid:17):
•  Quarterly Review: Every quarter Product team reviews PRD for accuracy. Minor
updates (clarifications, additional examples) push as v1.0.X.
•  Semi-Annual Major Review: Every 6 months comprehensive review. New BRs/FRs
added as v1.X.0. Stakeholder re-approval required.
•  Annual Major Release: Once a year, major version bump (v2.0). Triggers re-baseline
of BRC + companion docs.
•  Emergency Change: Critical compliance / security changes can be pushed as hotfix
with CPO + Compliance Officer approval.
A.4 Distribution List
या(cid:2) PRD चा(cid:17) access खा(cid:2)ल(cid:17)ल teams ल(cid:2) granted आहे(cid:13). Access control via PreOne internal docs
portal; download + share restricted:
| Team               | Access Level   | Purpose              |
| ------------------ | -------------- | -------------------- |
| Product Management | Edit + Comment | Owns PRD; updates +  |
clarifications
| Engineering (All)  | Read + Comment | Implementation reference  |
| ------------------ | -------------- | ------------------------- |
| QA                 | Read + Comment | Test case derivation      |
| Design / UX        | Read           | UI/UX decisions alignment |
| Compliance & Legal | Read + Comment | Compliance review         |
| Business / Sales   | Read           | Customer commitments      |
alignment
| Operations       | Read | Operational readiness |
| ---------------- | ---- | --------------------- |
| Customer Success | Read | Customer onboarding   |
reference
| Executive Leadership | Read | Strategic alignment |
| -------------------- | ---- | ------------------- |
81

PreOne Master PRD v1.0  |  Product Freeze
A.5 Companion Documents
या(cid:2)  PRD  च्या(cid:2)  effective use  स(cid:2)ठे(cid:17) खा(cid:2)ल(cid:17)ल  companion documents reference  क(cid:13) ल(cid:13) जा(cid:2)त(cid:2)त.  हे(cid:13)
documents PreOne documentation portal वर available आहे(cid:13)त:
| Document               | Version | Relationship                   |
| ---------------------- | ------- | ------------------------------ |
| PreOne Vision Document | 1.0     | Strategic context for this PRD |
| PreOne BPM (Business   | 1.0     | Process flows referenced in    |
| Process Map)           |         | Section 8 (Module              |
Requirements)
| PreOne BRC (Business Rules  | 1.0  | 176 rules referenced in    |
| --------------------------- | ---- | -------------------------- |
| Catalog)                    |      | Section 6 (Business Rules) |
| PreOne ADR (Architecture    | 1-12 | Architecture decisions     |
| Decision Records)           |      | referenced throughout      |
| PreOne Database Schema      | v2   | Data model for             |
implementation
PreOne API Specification v1 (OpenAPI) API contracts referenced in
Section 8
| PreOne Design System | v1  | UI/UX components for  |
| -------------------- | --- | --------------------- |
implementation
| PreOne Test Strategy | v1  | QA approach for ACs in  |
| -------------------- | --- | ----------------------- |
Section 11
82