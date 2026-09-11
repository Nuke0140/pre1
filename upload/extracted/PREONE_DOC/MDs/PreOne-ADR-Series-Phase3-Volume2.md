ENTE RPR ISE DO C UM EN TATION SE RIE S - PHAS E 3 O F 10
PreOne Architecture
Decision Records
Phase 3 - Volume 2: Domain Architecture
ADR-021 to ADR-040 - 20 decisions - 34-section v3.0 template - DDD Building
Blocks, Aggregates, Events, Sagas, Workflows
Document Version: 3.0 (Volume 2 release)
Status: Architecture Freeze
Classification: Internal Engineering Reference
Effective Date: 09 August 2026
Volume Owner: Domain Architect
Approval Authority: Architecture Review Board
PreOne Platform - Enterprise Architecture Governance Phase 3 / 10 - August
2026

PreOne ADR - Volume 2: Domain Architecture v3.0
Table of Contents
Phase 3 deliverable - Volume 2: Domain Architecture - 20 ADRs
Note: This Table of Contents is generated via field codes. To ensure page-number accuracy
after editing, right-click the TOC and select "Update Field."
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - i

PreOne ADR - Volume 2: Domain Architecture v3.0
Document Control
This Phase 3 deliverable of the PreOne Enterprise ADR Series presents Volume
2 — Domain Architecture. It contains 20 Architecture Decision Records
(ADR-021 to ADR-040) that define the Domain-Driven Design building blocks,
aggregate rules, domain events, cross-domain communication, and workflow
orchestration on which all domain logic is built. Every ADR in this volume
follows the 34-section v3.0 template defined in Phase 1 (ADR-000). Each ADR
includes four ASCII diagrams (architecture, sequence, component, data flow)
and is linked to upstream DDD/PRD documents and downstream
ERD/API/UI/Test artefacts per the cross-reference framework established in
Phase 1.
Volume 2 builds directly on Volume 1 (Architecture Foundation, delivered in
Phase 2). ADR-021 (Domain Ownership) assigns a Domain Architect to each of
the 12 bounded contexts defined in ADR-005. ADR-022 through ADR-028 define
the core DDD tactical patterns: aggregates, entities, value objects, domain
services, repositories, domain events, and application services. ADR-029
through ADR-033 address cross-cutting concerns: validation, business rules,
specifications, the unit of work, and transaction boundaries. ADR-034 through
ADR-037 address cross-aggregate and long-running coordination: cross-
domain communication, eventual consistency, sagas, and the workflow engine.
ADR-038 through ADR-040 close the volume with domain invariants, domain
exceptions, and domain versioning — the rules that keep the domain model
correct and evolvable.
VERSION HISTORY
Version Date Author Summary of
Changes
1.0 2025-11-05 Office of the Chief Initial release of
Architect Volume 2 with 20
ADRs using the
26-section v2.0
template.
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 1

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Version | Date | Author | Summary of  |
| ------- | ---- | ------ | ----------- |
Changes
| 3.0 | 2026-08-09 | Domain Architect | Phase 3 release.  |
| --- | ---------- | ---------------- | ----------------- |
All 20 ADRs
refreshed to the
34-section v3.0
template (added
Component
Diagram, Data
Flow Diagram, UI
Impact, Decision
History,
Implementation
Checklist). Cross-
references to
Volume 1 ADRs
(ADR-001 to
ADR-020) and
downstream
ERD/API/TC
artefacts added
per the Phase 1
framework.
OWNERSHIP & CLASSIFICATION
| Document Owner |     | Domain Architect (Volume 2 Domain  |     |
| -------------- | --- | ---------------------------------- | --- |
Architect)
| Approval Authority |     | Architecture Review Board (ARB)    |     |
| ------------------ | --- | ---------------------------------- | --- |
| Classification     |     | Internal — Architecture Governance |     |
| Distribution       |     | Engineering, QA, DevOps, Product,  |     |
Security, Architecture
| Review Cadence |     | Annual editorial review; ADR-level  |     |
| -------------- | --- | ----------------------------------- | --- |
review on trigger
| Retention |     | Permanent — superseded ADRs  |     |
| --------- | --- | ---------------------------- | --- |
retained for traceability
| Format |     | DOCX (master) / PDF (distribution) /  |     |
| ------ | --- | ------------------------------------- | --- |
Markdown (working copy)
| Storage Location |     | PreOne Architecture Repository /  |     |
| ---------------- | --- | --------------------------------- | --- |
governance/adr/volume-2/
| Series |     | PreOne Enterprise Documentation  |     |
| ------ | --- | -------------------------------- | --- |
Series — Phase 3 of 10
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  2

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
VOLUME 2 ADR SUMMARY
| ADR     | Title   | Category  | Sections |
| ------- | ------- | --------- | -------- |
| ADR-021 | Domain  | Structure | 34       |
Ownership
| ADR-022 | Aggregate Rules    | DDD Pattern | 34  |
| ------- | ------------------ | ----------- | --- |
| ADR-023 | Entity Rules       | DDD Pattern | 34  |
| ADR-024 | Value Objects      | DDD Pattern | 34  |
| ADR-025 | Domain Services    | DDD Pattern | 34  |
| ADR-026 | Repository Pattern | DDD Pattern | 34  |
| ADR-027 | Domain Events      | DDD Pattern | 34  |
| ADR-028 | Application        | Layer       | 34  |
Services
| ADR-029 | Validation     | Pattern | 34  |
| ------- | -------------- | ------- | --- |
| ADR-030 | Business Rule  | Pattern | 34  |
Engine
| ADR-031 | Specification  | Pattern | 34  |
| ------- | -------------- | ------- | --- |
Pattern
| ADR-032 | Unit of Work | Pattern | 34  |
| ------- | ------------ | ------- | --- |
| ADR-033 | Transaction  | Pattern | 34  |
Boundary
| ADR-034 | Cross Domain  | Pattern | 34  |
| ------- | ------------- | ------- | --- |
Communication
| ADR-035 | Eventual  | Pattern | 34  |
| ------- | --------- | ------- | --- |
Consistency
| ADR-036 | Saga Readiness    | Pattern     | 34  |
| ------- | ----------------- | ----------- | --- |
| ADR-037 | Workflow Engine   | Pattern     | 34  |
| ADR-038 | Domain Invariants | DDD Pattern | 34  |
| ADR-039 | Domain            | Pattern     | 34  |
Exceptions
| ADR-040 | Domain  | Versioning | 34  |
| ------- | ------- | ---------- | --- |
Versioning
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  3

PreOne ADR - Volume 2: Domain Architecture v3.0
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 4

PreOne ADR - Volume 2: Domain Architecture v3.0
V O L U M E 2
Domain Architecture
ADR-021 to ADR-040 - 20 decisions - 34 sections each
Volume 2 defines the Domain-Driven Design building blocks that
implement PreOne's business logic. The 20 ADRs in this volume translate
the structural foundation (Volume 1) into concrete patterns for
modelling the preschool education domain. ADR-021 establishes domain
ownership — one Domain Architect per bounded context — ensuring
model coherence across 12 domains. ADR-022 through ADR-028 define
the core DDD tactical patterns: aggregates as consistency boundaries,
entities with typed UUID v7 IDs, immutable value objects, stateless
domain services, domain-layer repositories, the outbox-published
domain events, and orchestration-only application services. ADR-029
through ADR-033 address cross-cutting concerns: layered validation, a
hybrid business rule engine, the specification pattern for composable
business rules, the unit of work for transaction management, and
transaction boundaries with READ COMMITTED and SERIALIZABLE
isolation. ADR-034 through ADR-037 address coordination across
aggregates and time: event-based cross-domain communication with
Anti-Corruption Layers, eventual consistency with sub-second latency
targets, the saga pattern with compensation for cross-aggregate
workflows, and a lightweight workflow engine on Spring StateMachine
for complex, long-running, human-task-driven processes. ADR-038
through ADR-040 close the volume with the rules that keep the domain
correct and evolvable: domain invariants enforced in aggregate roots,
domain exceptions with stable error codes, and semantic versioning for
all domain artifacts. Together, these 20 ADRs are the DDD playbook of
the PreOne platform — the patterns that every engineer applies when
implementing business logic.
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 5

PreOne ADR - Volume 2: Domain Architecture v3.0
AD R -021
Domain Ownership
Volume 2 — Domain Architecture - Structure
ACCEPTED
DECISION SUMMARY
DECISION
Establish explicit domain ownership for each of the 12 bounded contexts
defined in ADR-005. Every domain has exactly one Domain Architect who
owns the aggregate model, the API surface, and the ADRs that govern that
domain. Code ownership is separate from domain ownership: a team may
contribute code to a domain they do not own, but only the Domain Architect
can approve changes to the domain model.
STATUS
Status Accepted
Date Decided 2025-11-05
Decision Owner Chief Architect
Review Cadence Annual review or on team
reorganisation
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
When PreOne grew from 8 to 40 engineers in 2024-2025, multiple teams began
touching the same domain modules without coordination. The Enrollment
module had contributions from the Billing team (adding fee fields), the
Reporting team (adding denormalised columns for dashboards), and the
Notifications team (adding hooks for SMS triggers). The result was a tangled
Enrollment model that nobody fully understood, and changes routinely broke
unrelated features. The Office of the Chief Architect reviewed similar growth-
stage companies and found a consistent pattern: domain ownership must be
explicit and singular. Without a single accountable owner per domain, the
domain model degrades because every team optimises for their own use case.
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 6

PreOne ADR - Volume 2: Domain Architecture v3.0
The ADR formalises domain ownership as a first-class architectural concern,
distinct from code ownership (who can write code) and team ownership (which
squad owns which features). This ADR applies the bounded context map from
ADR-005: each of the 12 bounded contexts gets one Domain Architect. The
Domain Architect role is a part-time role (30% allocation) held by a senior
engineer who is the canonical authority on that domain. The role is appointed
by the Chief Architect and ratified by the ARB.
BUSINESS DRIVERS
The primary driver is model integrity: a domain model with multiple
uncoordinated authors degrades into an incoherent blob within 6 months.
Domain ownership preserves model coherence by channelling all model
changes through one accountable person. The secondary driver is decision
velocity: when a question arises about domain semantics ('Should a Student
have multiple Guardians or just one?'), the Domain Architect answers
immediately rather than convening a cross-team meeting. The tertiary driver is
onboarding: a new engineer joining the Enrollment team knows to ask the
Enrollment Domain Architect for context, rather than reverse-engineering it
from code. A fourth driver is accountability: when an incident traces back to a
domain model flaw (e.g., an Enrollment aggregate that allowed double-
charging), the post-mortem has a clear owner who is responsible for the fix.
Without explicit ownership, the post-mortem devolves into 'we should have
coordinated better' — which produces no corrective action.
PROBLEM STATEMENT
PreOne's 12 bounded contexts lack singular ownership, leading to model
fragmentation, slow decisions on domain semantics, and unclear accountability
for domain-level incidents. We must define a domain ownership model that is
explicit, singular, and enforceable through the ADR workflow and code review.
CONSTRAINTS
● Domain ownership must be singular (one architect per domain), not
committee-based
● Domain ownership is distinct from code ownership (multiple teams may
contribute code)
● The Domain Architect role must be a part-time role (no full-time
architects at PreOne's scale)
● Ownership transfers must be explicit and documented (no implicit drift)
● The ownership model must scale from 12 domains (current) to 30+
domains (5-year target)
ASSUMPTIONS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 7

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● The 12 bounded contexts from ADR-005 are stable; major restructuring
is unlikely in the next 3 years
● Senior engineers are willing to take on the Domain Architect role as a
30% allocation
● The ARB will ratify Domain Architect appointments within 2 weeks of
nomination
● Code review tooling (GitHub CODEOWNERS) can enforce domain-
architect approval on domain-affecting paths
● Domain Architects will spend at least 4 hours per week on domain
governance (reviews, ADRs, questions)
OPTIONS CONSIDERED
| Option           | Pros                | Cons                | Verdict |
| ---------------- | ------------------- | ------------------- | ------- |
| Singular Domain  | Clear               | Single point of     | Chosen  |
| Architect per    | accountability;     | failure if Domain   |         |
| bounded context  | fast decisions;     | Architect is        |         |
| (chosen)         | model coherence;    | unavailable;        |         |
|                  | aligns with DDD     | requires 12 senior  |         |
|                  | literature (Evans,  | engineers willing   |         |
|                  | Vernon); scales     | to take the role;   |         |
|                  | linearly with       | ownership           |         |
|                  | domain count.       | transfer is a       |         |
process cost.
| Domain          | No single point of  | Slow decisions   | Rejected |
| --------------- | ------------------- | ---------------- | -------- |
| committee (3-5  | failure; multiple   | (committee must  |          |
| members per     | perspectives;       | meet); diffuse   |          |
| domain)         | spreads the load.   | accountability;  |          |
tendency to
compromise
rather than
decide; requires
36-60 senior
engineers.
| Chief Architect  | Maximum            | Bottleneck (12     | Rejected |
| ---------------- | ------------------ | ------------------ | -------- |
| owns all domains | coherence; single  | domains ×          |          |
|                  | throat to choke;   | 4hr/week =         |          |
|                  | no role            | 48hr/week,         |          |
|                  | proliferation.     | impossible); does  |          |
not scale; bus
factor of 1; Chief
Architect cannot
specialise in all 12
domains.
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  8

PreOne ADR - Volume 2: Domain Architecture v3.0
Option Pros Cons Verdict
Team-based Aligns with team Teams reorganise Rejected
ownership (each topology; no new frequently (every
squad owns its role; natural for 6-12 months)
domains) feature teams. causing ownership
churn; a team is
not a single
decision-maker;
cross-team
domain disputes
require escalation
anyway.
DECISION
ADOPTED
Each of the 12 bounded contexts defined in ADR-005 has exactly one
Domain Architect, appointed by the Chief Architect and ratified by the ARB.
The Domain Architect owns: (1) the aggregate model and entity/value-
object definitions, (2) the public API surface of the domain (commands,
queries, events), (3) the ADRs that govern the domain, (4) the domain
glossary (ubiquitous language), and (5) the cross-context contracts
(published language) for that domain. Code contributions to a domain
require the Domain Architect's approval via GitHub CODEOWNERS.
Ownership transfers are explicit ADRs (a supersession record) and require
ARB ratification.
DETAILED RATIONALE
Singular domain ownership is the only model that produces both coherence and
velocity at PreOne's scale. Committee-based ownership (option 2) was rejected
because committees optimise for consensus, not correctness; a committee that
must agree on whether Enrollment should reference Student by ID or by object
will spend three meetings and produce a compromise that satisfies nobody.
Singular ownership produces a decision in one conversation. The cost — single
point of failure — is mitigated by the deputy pattern: each Domain Architect
designates a deputy (a senior engineer in the same domain) who can act in their
absence. The Chief Architect owns-all option (option 3) was rejected because
12 domains × 4 hours per week = 48 hours, which exceeds a full-time workload.
Beyond the time constraint, the Chief Architect cannot maintain deep expertise
in 12 different domains; domain expertise requires immersion in the feature
work of that domain, which the Chief Architect cannot do for all 12
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 9

PreOne ADR - Volume 2: Domain Architecture v3.0
simultaneously. Domain Architects, by contrast, are embedded in their
domain's feature work and maintain that expertise naturally. Team-based
ownership (option 4) was rejected because teams reorganise. PreOne
reorganised its squads twice in 2025; if domain ownership tracked team
ownership, every reorganisation would trigger a wave of ownership transfers
and ADR supersessions. Domain ownership is decoupled from team topology: a
squad may own features spanning multiple domains, but each domain has one
Domain Architect regardless of how many squads touch it. The chosen model
has three enforcement mechanisms. First, GitHub CODEOWNERS files map
domain paths to their Domain Architect, blocking PRs that touch domain model
files without their approval. Second, the ADR workflow requires the Domain
Architect's signoff on any ADR that affects their domain (section 33: Approval &
Signoff). Third, the quarterly architecture scorecard reports each Domain
Architect's review latency and decision count, surfacing bottlenecks. These
mechanisms make the ownership model operational, not aspirational. The
model scales: as PreOne adds new bounded contexts (e.g., a future
Transportation domain), the Chief Architect appoints a new Domain Architect.
The role definition does not change; only the domain count grows. The 5-year
projection (30+ domains) requires 30+ senior engineers willing to take the
role, which is achievable if PreOne continues its hiring trajectory. The deputy
pattern provides succession: when a Domain Architect leaves, the deputy is the
natural successor, and the transition is documented in a supersession ADR.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | PreOne Platform — 12
Domain Owners | | | |
+-----------+ appoints +-------------------+ | | | Chief |--------------->| 12
Domain | | | | Architect | | Architects | | |
+-----------+ +-------------------+ | | |
| | | own | | v
| | +--------+--------+--------+--------+--------+--------+ | | |Identity|Academic|
Student |Guardian|Teacher |Enroll | ... | | | DA | DA | DA | DA | DA
| DA | (12) | | +--------+--------+--------+--------+--------+--------+ | |
| | | | approve | |
v | | +---------------------+ | |
| CODEOWNERS + ADR | | | | signoff enforcement |
| | +---------------------+ |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Contributor Domain Architect ARB Codebase | |
| | |--draft feature-->| | | | (touches domain)|
| | | |--review model->| | | |
alignment | | | | | | | |--
approve------>| | | | (or request | | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 10

PreOne ADR - Volume 2: Domain Architecture v3.0
| changes) | | | | | | |<--
approved-------| | | | (PR merged)|
| | | (if domain ADR needed)
| |--draft ADR----->| | | |--signoff section 33
| | |--submit to ARB->| | | | |--ratify
| | |<--accepted------| | |<--ADR-XXX accepted
(governance)| |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Domain Ownership Layer
| | | | +-----------------+ +---------------------+
| | | Domain | owns | Aggregate Model | | | | Architect |------->|
(entities, VOs, | | | | (per BC) | | aggregates) | | |
+--------+--------+ +---------------------+ | | |
| | | also owns | | v
| | +-----------------+ +---------------------+ | | | Domain API |<------>|
Published Language | | | | (commands, | | (events, contracts) |
| | | queries) | +---------------------+ | | +-----------------+
| | | | | | enforced by
| | v | | +-----------------+ +---------------------+
| | | CODEOWNERS |------->| GitHub PR Check | | | | (per-domain) |
| (blocks unapproved) | | | +-----------------+ +---------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Feature Request (touches domain X) | v +----+-----+ | Engineer |---
drafts PR---> touches domain X files +----+-----+ | |
v | +---------+---------+ | | CODEOWNERS check |
| | (auto on PR open) | | +---------+---------+ |
| | +---------------+---------------+ | | | |
v v | Domain X Architect (other reviewers)
| | | | |--review model alignment | |
|--review invariant impact | | | | |
+---------------+---------------+ | | | v |
+---------+---------+ | | Approve / Request | | |
Changes / Block | | +---------+---------+ | |
| +-------------------+-------------------+ | | | |
v v | PR merged PR revised |
(domain model (engineer | integrity intact)
iterates) v +----+-----+ | Domain X |<--state preserved across all
contributions | codebase | +----------+
DATABASE IMPACT
Domain ownership does not directly change the database schema, but it
constrains who can propose schema changes. A schema migration that adds a
column to a table in the Enrollment schema requires the Enrollment Domain
Architect's approval. Flyway migration files are scoped to domain paths
(db/migration/enrollment/) and the CODEOWNERS file maps those paths to the
Enrollment Domain Architect. This prevents the pre-ADR-021 failure mode
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 11

PreOne ADR - Volume 2: Domain Architecture v3.0
where the Reporting team added denormalised columns to Enrollment tables
for dashboard performance, polluting the Enrollment model with read-side
concerns. Read-side optimisations now belong in the Reporting bounded
context (a separate schema) per ADR-005.
API IMPACT
Every public API endpoint is owned by exactly one Domain Architect. The
OpenAPI spec file is split by domain (specs/student.yaml,
specs/enrollment.yaml) and each file has a CODEOWNERS entry for its Domain
Architect. A PR that adds an endpoint to specs/enrollment.yaml without the
Enrollment Domain Architect's approval is blocked. This ensures API evolution
is intentional: the Domain Architect is accountable for backward compatibility
(ADR-092), idempotency (ADR-106), and the domain's published language.
Internal endpoints (between services) follow the same rule — there are no
'shared' endpoints without an owner.
UI IMPACT
UI components that surface domain data bind to the domain's published API,
which is owned by the Domain Architect. A UI change that requires new API
fields (e.g., adding a 'Guardian occupation' field to the Student profile page)
triggers a domain model change request to the Student Domain Architect. The
UI team cannot unilaterally add fields; the Domain Architect must agree that
the field belongs in the Student domain (not Guardian, not a separate Profile
domain). This prevents domain fragmentation through UI-driven feature creep,
which was a common pre-ADR-021 failure mode.
SECURITY IMPACT
Domain ownership clarifies the security accountability for each domain. The
Identity Domain Architect owns authentication and authorisation model
decisions (which roles exist, what permissions each role grants). The Student
Domain Architect owns student data access rules (which fields are PII, who can
read them). The Audit Domain Architect owns the audit trail immutability rules.
When a security review identifies a domain-level concern, the responsible
Domain Architect is the fix owner. Without explicit ownership, security findings
bounced between teams — now they have a single accountable recipient.
PERFORMANCE IMPACT
Domain ownership has indirect but positive performance impact. When one
architect owns the model, they understand the performance characteristics
holistically: the Enrollment Domain Architect knows which queries are hot,
which aggregates are large, which transactions are long-running. They can
make informed trade-offs (e.g., adding a read model to avoid aggregate
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 12

PreOne ADR - Volume 2: Domain Architecture v3.0
loading) that a fragmented ownership model cannot. The cost is review latency:
a PR touching domain model files waits for the Domain Architect's review,
which can add 4-24 hours to cycle time. This is an acceptable trade-off for
model coherence.
SCALABILITY ANALYSIS
The model scales linearly with domain count. At 12 domains (current), 12
Domain Architects are needed; at 30 domains (5-year target), 30 are needed.
The senior engineer headcount required (30 × 1 = 30, plus 30 deputies = 60) is
achievable at PreOne's projected scale of 150 engineers. The bottleneck is not
headcount but expertise: a new domain (e.g., Transportation) requires an
engineer who deeply understands that domain, which may require hiring. The
deputy pattern mitigates single-point-of-failure risk. The CODEOWNERS
enforcement scales automatically with GitHub's tooling. The ARB ratification
step (currently 2 weeks) may need to delegate to a sub-committee if
appointment volume grows beyond 5 per quarter.
OPERATIONAL CONSIDERATIONS
Domain Architects participate in on-call rotation for their domain. This ensures
the on-call engineer can reach the Domain Architect for any domain-level
incident. The Domain Architect is expected to be reachable during business
hours for domain questions; out-of-hours, the deputy is the fallback. The
quarterly architecture scorecard tracks: (a) review latency per Domain
Architect (target: <24hr for PR reviews, <72hr for ADR signoffs), (b) decision
count per Domain Architect (target: 5-20 decisions per quarter — too few
suggests disengagement, too many suggests bottleneck), (c) incident count per
domain (for trend analysis).
RISKS
Risk Likelihood Impact Mitigation
Domain Architect Medium High Deputy pattern;
becomes a quarterly review
bottleneck, of review latency;
slowing feature Chief Architect
delivery intervenes if
latency exceeds
48hr consistently
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 13

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk              | Likelihood | Impact | Mitigation      |
| ----------------- | ---------- | ------ | --------------- |
| Domain Architect  | Medium     | High   | Deputy          |
| leaves without a  |            |        | appointment is  |
| trained deputy    |            |        | mandatory;      |
deputy must be
identified within
30 days of Domain
Architect
appointment;
succession ADR
template pre-
exists
| Domain Architect  | Low | Medium | ARB ratification    |
| ----------------- | --- | ------ | ------------------- |
| makes decisions   |     |        | for ADRs; peer      |
| outside their     |     |        | review for major    |
| expertise         |     |        | model changes;      |
| (overreach)       |     |        | escalation path to  |
Chief Architect
| Ownership          | Medium | Medium | Cross-cutting     |
| ------------------ | ------ | ------ | ----------------- |
| boundaries are     |        |        | concerns have     |
| unclear for cross- |        |        | their own owners  |
| cutting concerns   |        |        | (e.g., Platform   |
| (e.g., logging,    |        |        | Architect owns    |
| auth)              |        |        | logging);         |
ownership matrix
published in
ADR-021 appendix
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Model coherence — one accountable  Review latency — PRs wait for Domain
| owner per domain |     | Architect approval |     |
| ---------------- | --- | ------------------ | --- |
Fast decisions on domain semantics Requires 12+ senior engineers willing
to take the Domain Architect role
Clear accountability for domain  Domain Architect is on-call for their
| incidents |     | domain (additional load) |     |
| --------- | --- | ------------------------ | --- |
Scalable ownership model (linear with  Ownership transfers are a process cost
| domain count) |     | (supersession ADR, ARB ratification) |     |
| ------------- | --- | ------------------------------------ | --- |
REJECTED ALTERNATIVES
The committee-based option (3-5 members per domain) was piloted for the
Enrollment domain in Q3 2025. The committee took 11 calendar days to decide
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  14

PreOne ADR - Volume 2: Domain Architecture v3.0
whether Enrollment should reference Guardian by ID or by object — a decision
a single Domain Architect would make in an afternoon. The committee also
produced a compromise (reference by ID for reads, by object for writes) that
was technically incoherent and had to be reverted in ADR-022. The team-based
option was rejected based on PreOne's reorganisation history: two squad
reorganisations in 2025 would have triggered 14 ownership transfers, each
requiring a supersession ADR. The Chief Architect owns-all option was rejected
after a time-budget analysis showed it required 48 hours per week, leaving no
time for the Chief Architect's other responsibilities (cross-domain arbitration,
hiring, executive reporting).
MIGRATION PLAN
Phase 1 (complete): Identify and appoint Domain Architects for all 12 bounded
contexts. Phase 2 (complete): Configure CODEOWNERS files for all domain
paths. Phase 3 (in progress): Migrate existing ADRs to include the Domain
Architect signoff in section 33. Phase 4 (Q4 2026): Publish the domain
ownership matrix as a living document, updated on every ownership transfer.
The migration is non-disruptive because domain ownership was de facto
practised by senior engineers before ADR-021 formalised it; the ADR makes the
implicit explicit.
TESTING STRATEGY
Domain ownership is tested through governance, not automated tests. The
CODEOWNERS file is the enforcement mechanism: a PR that touches a domain
path without the Domain Architect's review cannot merge. The ADR workflow
tests ownership of decisions: an ADR without the Domain Architect's signoff in
section 33 is rejected at ARB triage. Quarterly, the architecture scorecard
audits a sample of merged PRs to verify the Domain Architect's review was
substantive (not rubber-stamped) by examining review comments. A Domain
Architect who rubber-stamps is coached; persistent rubber-stamping triggers a
deputy review and potential ownership transfer.
MONITORING & OBSERVABILITY
Ownership health is monitored via the quarterly architecture scorecard.
Metrics: (a) PR review latency per Domain Architect (target: median <24hr,
p95 <72hr); (b) ADR signoff latency per Domain Architect (target: <72hr); (c)
PRs blocked by CODEOWNERS per domain (target: trending down as
contributors learn the model); (d) ownership transfer count per quarter (target:
<2 — high churn indicates instability); (e) deputy coverage per domain (target:
100% — every Domain Architect has a deputy). Anomalies trigger a Chief
Architect review of the Domain Architect's allocation and support.
FUTURE EVOLUTION
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 15

PreOne ADR - Volume 2: Domain Architecture v3.0
As PreOne grows, two evolutions are likely. First, domains may split: the
Student domain may split into Student Profile and Student Academic Record as
the model grows. The split is a supersession ADR (this ADR-021 references the
new ownership). Second, a 'Domain Architect Council' may emerge — a
monthly meeting of all Domain Architects for cross-domain coordination. This is
not a committee (which would replace singular ownership) but a coordination
forum. Third, if PreOne adopts ML models in domains (e.g., a churn-prediction
model in Enrollment), the Domain Architect role expands to include model
governance, which may require ML-specialist deputies.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P10 Document
Decisions enforces ownership records)
● ADR-005 — Bounded Context Strategy (defines the 12 domains that get
owners)
● ADR-006 — Layering Rules (domain layer is owned by Domain
Architect)
● ADR-007 — Dependency Rule (domain ownership enforces inward
dependencies)
● ADR-022 — Aggregate Rules (Domain Architect owns aggregate
definitions)
● ADR-026 — Repository Pattern (Domain Architect owns repository
interfaces)
● ADR-028 — Application Services (Application Services coordinate
domain calls but do not own domain model)
● ADR-158 — Architecture Review Board (ratifies Domain Architect
appointments)
REFERENCES
● Upstream DDD: DDD-001 (Strategic Design — bounded context
ownership)
● Upstream PRD: PRD-001-section-2 (Organisational structure and
domain allocation)
● Downstream ERD: ERD-000 (Schema ownership map aligns with
domain ownership)
● Downstream API Spec: API-000 (API ownership map aligns with domain
ownership)
● Downstream Test Cases: TC-0021 (Domain ownership verification tests)
● External: Eric Evans — Domain-Driven Design, Chapter 14
(Maintaining Model Integrity)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 16

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● External: Team Topologies — Skrabanek & Thorn (team ownership vs
domain ownership)
DECISION HISTORY
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2025-09-10 | Draft  | Chief Architect | Initial draft with 3  |
ownership models;
singular model
favoured
| 2025-10-15 | Proposed | Chief Architect | Submitted to ARB  |
| ---------- | -------- | --------------- | ----------------- |
after pilot in
Enrollment
domain
| 2025-11-05 | Accepted | ARB Chair | ARB approved; 12  |
| ---------- | -------- | --------- | ----------------- |
Domain Architects
appointed
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added; ownership
matrix appended
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR) |     |
| ----------- | --- | -------------------- | --- |
| Tech Lead   |     | Foundation Tech Lead |     |
| ARB Chair   |     | ARB Chair            |     |
| Approved On |     | 2026-07-15           |     |
IMPLEMENTATION CHECKLIST
● Appoint Domain Architects for all 12 bounded contexts (Done — see
ownership matrix)
● Configure CODEOWNERS files for all domain paths (Done — PR
#4521)
● Configure CODEOWNERS files for all ADR paths by domain (Done —
PR #4522)
● Migrate existing ADRs to include Domain Architect signoff in section 33
(In progress — 60% complete)
● Publish domain ownership matrix as living document (Done —
architecture.gov/ownership)
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  17

PreOne ADR - Volume 2: Domain Architecture v3.0
● Quarterly scorecard on Domain Architect review latency (Done — first
scorecard 2026-Q1)
● Deputy appointment for every Domain Architect (Done — 12/12
deputies confirmed)
● Annual ownership review at ARB (Next: 2026-11)
AD R -022
Aggregate Rules
Volume 2 — Domain Architecture - DDD Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Define and enforce the rules for designing and using aggregates in the
PreOne domain model. An aggregate is a cluster of domain objects treated
as a single unit for data consistency. The aggregate root is the only entry
point; external references use the root's ID; one transaction modifies one
aggregate; invariants are enforced inside the aggregate boundary;
aggregates are kept small.
STATUS
Status Accepted
Date Decided 2025-11-12
Decision Owner Domain Architect — Enrollment
Review Cadence Annual or on aggregate model
restructuring
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-022, PreOne's domain model had no formal aggregate concept. The
Enrollment entity loaded related Student, Guardian, Branch, Class, Fee,
Discount, and Payment objects eagerly, producing object graphs of 50+ entities
for a single enrollment. Transactions routinely modified 5-10 entities across
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 18

PreOne ADR - Volume 2: Domain Architecture v3.0
what should have been separate aggregates, causing lock contention,
deadlocks, and a class of bugs where partial saves left the database in an
inconsistent state. The Enrollment Domain Architect led a 4-week effort to
identify aggregates using event storming (per ADR-025 methodology). The
output was 7 aggregates in the Enrollment domain: Enrollment (root:
Enrollment, contains EnrollmentLine, FeeSnapshot, DiscountApplication),
Student (root: Student, contains StudentProfile, GuardianLink), Guardian
(root: Guardian, contains ContactMethod, Relationship), Branch (root: Branch,
contains Class, Room), Fee (root: FeeStructure, contains FeeComponent,
FeeSchedule), Payment (root: Payment, contains PaymentLine, Refund),
Invoice (root: Invoice, contains InvoiceLine, TaxApplication). This ADR codifies
the rules for designing aggregates going forward. Every domain must publish
its aggregate map (a diagram showing roots and contained entities) and every
aggregate must conform to the rules below. ArchUnit tests verify the rules at
compile time.
BUSINESS DRIVERS
The primary driver is consistency: an aggregate defines the boundary within
which invariants hold. Without aggregates, every transaction must reason
about the entire object graph, which is impractical and error-prone. Aggregates
localise consistency reasoning to a small cluster. The secondary driver is
performance: small aggregates mean short transactions, low lock contention,
and high throughput. The Enrollment aggregate (root + 3-5 children) loads in
8ms; the pre-aggregate Enrollment object graph loaded in 120ms. The tertiary
driver is reasoning: a developer reading the code can hold one aggregate in
their head, but cannot hold a 50-entity object graph. A fourth driver is
concurrency: if two transactions modify different aggregates, they do not
conflict. If they modify the same aggregate, the optimistic locking (ADR-049) on
the aggregate root detects the conflict. Without aggregates, conflicts are
detected at the row level, producing false positives (two transactions touching
different rows of the same logical entity appear to conflict) and false negatives
(two transactions touching related rows in different tables do not conflict).
PROBLEM STATEMENT
PreOne's domain model lacks formal aggregate boundaries, causing
consistency bugs, performance degradation, and concurrency anomalies. We
must define aggregate rules that are enforceable, consistent across domains,
and aligned with DDD principles.
CONSTRAINTS
● Aggregate rules must be enforceable via ArchUnit (compile-time) or
runtime checks
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 19

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● One transaction modifies one aggregate (no cross-aggregate
transactions)
● External references use aggregate root ID (not direct object
references)
● Aggregate invariants are enforced inside the aggregate (not in
application services)
● Aggregates are small (target: root + 3-7 children, max 10)
ASSUMPTIONS
● PreOne's domain can be modelled with the standard DDD aggregate
pattern (no need for event sourcing at this stage)
● PostgreSQL row-level locks are sufficient for aggregate consistency (no
need for distributed locks)
● Optimistic locking (ADR-049) is sufficient for conflict detection (no
need for pessimistic locks in normal operation)
● Cross-aggregate consistency can be eventual (per ADR-035 Eventual
Consistency)
● Domain events (ADR-027) carry aggregate IDs, not aggregate
snapshots
OPTIONS CONSIDERED
| Option           | Pros                | Cons                | Verdict |
| ---------------- | ------------------- | ------------------- | ------- |
| Strict DDD       | Aligns with DDD     | Requires            | Chosen  |
| aggregates with  | literature;         | discipline to keep  |         |
| ArchUnit         | compile-time        | aggregates small;   |         |
| enforcement      | enforcement;        | cross-aggregate     |         |
| (chosen)         | clear invariants;   | workflows need      |         |
|                  | localised           | sagas or events;    |         |
|                  | consistency;        | learning curve for  |         |
|                  | performance         | engineers new to    |         |
|                  | benefit from small  | DDD.                |         |
transactions.
| Lazy-loaded object  | Familiar to Spring   | N+1 query         | Rejected |
| ------------------- | -------------------- | ----------------- | -------- |
| graphs (no formal   | developers; no       | problem;          |          |
| aggregates)         | upfront modelling;   | consistency bugs  |          |
|                     | flexibility to load  | (partial saves);  |          |
|                     | any relation on      | lock contention;  |          |
|                     | demand.              | cannot reason     |          |
about invariants;
pre-ADR-022
state.
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  20

PreOne ADR - Volume 2: Domain Architecture v3.0
Option Pros Cons Verdict
Eager-loaded Avoids N+1; Loads too much Rejected
object graphs with single query loads (50+ entities);
@EntityGraph the graph; Spring memory pressure;
Data support. transaction scope
too wide; does not
solve consistency
reasoning.
Event-sourced Complete audit Operational Rejected (deferred
aggregates log; temporal complexity (event to ADR-036 Saga
queries; perfect store, projections, Readiness for
event replay. snapshots); future
learning curve; consideration)
not justified at
PreOne's scale;
deferred to future
ADR.
DECISION
ADOPTED
Adopt strict DDD aggregates with the following rules enforced via
ArchUnit: (1) Every aggregate has one root entity marked with
@AggregateRoot. (2) External references use the root's ID (type:
AggregateRootId), never direct object references. (3) One transaction
modifies one aggregate — enforced by Unit of Work (ADR-032) scope. (4)
Invariants are enforced in the aggregate root's methods, not in application
services. (5) Aggregate children are loaded via the root (no direct repository
access to children). (6) Aggregate size is limited to root + 7 children
(warning) or root + 10 children (error) via ArchUnit. (7) Cross-aggregate
communication is via domain events (ADR-027), not direct calls. (8)
Aggregate roots implement OptimisticLockable (ADR-049) with a version
field.
DETAILED RATIONALE
The strict DDD aggregate pattern is the only option that simultaneously solves
consistency, performance, and reasoning. Lazy-loaded graphs (option 2) were
the pre-ADR-022 state and produced the bugs that motivated this ADR. Eager-
loaded graphs (option 3) solve the N+1 query problem but do not solve the
consistency reasoning problem — a developer still cannot reason about which
entities must be consistent. Event-sourced aggregates (option 4) are a superior
model in principle but introduce operational complexity (event store,
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 21

PreOne ADR - Volume 2: Domain Architecture v3.0
projections, snapshots) that is not justified at PreOne's scale; they are deferred
to a future ADR if scale demands. Rule (1) — every aggregate has one root —
establishes the single entry point. The @AggregateRoot annotation is a marker
for ArchUnit and for documentation; it has no runtime behaviour. The root is
the only entity with a public repository (ADR-026); children are accessed via the
root. This prevents the pre-ADR-021 failure mode where the Reporting team
queried EnrollmentLine directly, bypassing the Enrollment root's invariants.
Rule (2) — external references use the root ID — prevents object graph
explosion. An Invoice references an Enrollment via EnrollmentId (a value
object), not via an Enrollment entity reference. This means loading an Invoice
does not cascade to loading the Enrollment; if the Invoice needs Enrollment
data, it fetches it explicitly. The ID is typed (EnrollmentId, not UUID) so the
compiler catches ID confusion (passing a StudentId where an EnrollmentId is
expected). Rule (3) — one transaction, one aggregate — is the most
controversial rule because it requires rethinking workflows that span multiple
aggregates. A fee payment workflow touches Payment, Invoice, and Enrollment
— three aggregates. Under this rule, the workflow is a saga (ADR-036) with
three transactions: (a) create Payment, (b) mark Invoice paid, (c) update
Enrollment status. Each transaction is atomic; the saga coordinates via events.
This is more complex than a single transaction but produces a system that
scales (short transactions, no cross-aggregate locks) and recovers gracefully
(saga compensation on failure). Rule (4) — invariants in the aggregate —
means the Enrollment root enforces 'an enrollment cannot have more than 5
active discounts' in the addDiscount() method, throwing a domain exception
(ADR-039) if violated. The application service does not check this; it just calls
enrollment.addDiscount(). This ensures the invariant holds regardless of the
entry point — a future API endpoint, a batch job, or a manual script cannot
bypass the invariant. Rule (5) — children via root — means there is no
EnrollmentLineRepository; lines are added via enrollment.addLine() and
loaded via enrollment.getLines(). This prevents direct database manipulation of
children and ensures the root's invariants are always checked. Rule (6) — size
limits — is a guard against aggregate bloat. The Enrollment aggregate (root + 3
children: EnrollmentLine, FeeSnapshot, DiscountApplication) is well within
limits. A warning at 7 children triggers a code review; an error at 10 children
fails the build. The Reporting domain, which initially tried to put all
denormalised data in one 'Report' aggregate, was forced to split into multiple
aggregates by this rule. Rule (7) — cross-aggregate via events — decouples
aggregates. When a Payment is confirmed, the Payment aggregate publishes a
PaymentConfirmed event with the EnrollmentId; the Enrollment aggregate
listens and updates its status. The Payment aggregate does not know about
Enrollment; it only knows about PaymentConfirmed. This is the foundation of
ADR-027 (Domain Events) and ADR-034 (Cross-Domain Communication). Rule
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 22

PreOne ADR - Volume 2: Domain Architecture v3.0
(8) — optimistic locking — detects concurrent modifications. Two transactions
loading the same Enrollment aggregate both read version=5; the first to
commit writes version=6; the second to commit detects the version mismatch
and retries or fails. This is preferable to pessimistic locks (which reduce
throughput) and to last-write-wins (which silently loses updates).
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Aggregate Boundary
Rules | | | |
+-------------------+ External Reference | | | Aggregate Root |
uses RootId (not ref) | | | @AggregateRoot |<------- EnrollmentId
| | | - version: long | | | | - invariants() | One
Transaction | | +---------+---------+ modifies ONE aggregate
| | | | | | contains (loaded via root)
| | v | | +-------------------+ +-------------------+
| | | Child Entity A | | Child Entity B | | | | (no repo access) | |
(no repo access) | | | +-------------------+ +-------------------+ | |
| | Cross-aggregate via Events (ADR-027): | | Aggregate X
publishes Event(XId) --> Aggregate Y listens | |
| | ArchUnit enforcement: | | - @AggregateRoot
marker required | | - Max 10 children per aggregate
| | - No direct child repository access | | - No direct cross-
aggregate object refs |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Client App Service Enrollment Agg DB | | |
| |---addDiscount--->| | | | |--load by ID------->|
| | | |--select-------->| | | |<--
row-----------| | | | | | | (enforce
invariant inside aggregate)| | | | | |
|--addDiscount()---->| | | | |--check: <=5? | |
| | active discounts| | | | | |
| |--YES: add line | | | |--NO: throw | |
| | TooManyDiscounts| | | | | |
| |--update version->| | | |<--ok--------------| |
| | | | | |--publish event | |
| | DiscountApplied| |<--success--------|<-------------------| | |
| | (one transaction = one aggregate; no cross-agg locks) |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Enrollment Aggregate (example)
| | | | +---------------------+ @AggregateRoot
| | | Enrollment (root) | - version: long | | |---------------------| -
enrollmentId: EnrollmentId | | | - status: enum | - studentId: StudentId
(ref) | | | - academicYear | - branchId: BranchId (ref) | | | +addLine()
| | | | +applyDiscount() | Invariants enforced here: |
| | +confirm() | - max 5 active discounts | | | +cancel() | -
cannot cancel confirmed enroll | | +----------+----------+ - total fees > 0 to confirm
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 23

PreOne ADR - Volume 2: Domain Architecture v3.0
| | | | | | contains (loaded via root
only) | | v | | +----------+----------+
+---------------------+ | | | EnrollmentLine | | FeeSnapshot (VO) | | |
|---------------------| |---------------------| | | | - lineId | | - baseFee |
| | | - classId | | - currency | | | | - term | | - validFrom
| | | +---------------------+ +---------------------+ | |
| | NO EnrollmentLineRepository (access via root only) |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Command: addDiscount(enrollmentId, discountId) | v +----+-----+ |
App Svc |---load root by ID---> Enrollment Repository +----+-----+
| | v | +-------+-------+ |
| DB SELECT | | | (root + kids) | |
+-------+-------+ | | |<--enrollment
(version=N)-------------| | | |--
enrollment.addDiscount(d) | | (invariant check inside root) | |
| | if OK: aggregate updated | | if NOT OK: throw domain
exception | | | |--save root via repo |
| | | +-------+-------+ |
| DB UPDATE | | | WHERE version=N| |
+-------+-------+ | | |<--updated
(version=N+1)--------------| | | |--publish
DiscountApplied event | | (carries enrollmentId, not snapshot)| |
| v +----+-----+ | Event Bus|---subscribers update their aggregates
+----------+ (Invoice listens, Billing listens)
DATABASE IMPACT
Aggregates map to PostgreSQL tables: the root is one row in the root table;
children are rows in child tables with a foreign key to the root. The Enrollment
aggregate maps to enrollments (root), enrollment_lines (children),
fee_snapshots (children), discount_applications (children). All four tables are in
the enrollment schema. The version column on the root table enables optimistic
locking (ADR-049). ArchUnit verifies that no child table has a repository (only
the root table does). Flyway migrations that add child tables require Enrollment
Domain Architect approval. The schema migration for the Enrollment
aggregate was applied in V1.2.0; pre-aggregate tables were refactored in
V1.3.0.
API IMPACT
API requests carry aggregate IDs, not full aggregate snapshots. A POST
/enrollments/{id}/discounts request carries the discountId in the body; the API
does not accept a full Discount object. This keeps the API surface aligned with
the aggregate boundary: the API cannot bypass the root's invariants because it
must go through the root's methods. The API response may include the full
aggregate (for reads) but writes are scoped to the root's commands. ADR-091
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 24

PreOne ADR - Volume 2: Domain Architecture v3.0
(REST) and ADR-106 (Idempotency) build on this: idempotency keys are scoped
to the aggregate root ID.
UI IMPACT
UI screens that display an aggregate load the full aggregate via a single GET
request. The Enrollment detail screen loads the Enrollment aggregate (root +
lines + snapshots + discounts) in one call. UI actions (Add Discount, Confirm,
Cancel) map to aggregate commands via POST requests. The UI does not
manipulate child entities directly — there is no 'Edit Enrollment Line' screen;
lines are added/removed via root commands. This simplifies the UI state model:
the UI tracks one aggregate at a time.
SECURITY IMPACT
Aggregate boundaries simplify authorisation: the authorisation check is on the
root, not on each child. A user with 'read:enrollment' permission can read the
entire Enrollment aggregate; they cannot read individual EnrollmentLines
without reading the root (because children are loaded via root). This prevents
the failure mode where a user has partial aggregate access (e.g., can read lines
but not the root) which produces incoherent UI states. The authorisation model
is defined in ADR-071 (Authorisation Model).
PERFORMANCE IMPACT
Aggregate size directly impacts performance. A root + 3 children loads in
~8ms; a root + 10 children loads in ~25ms. The size limit (10 children max)
bounds the worst case. Cross-aggregate workflows are now saga-based (3
transactions of 8ms each = 24ms total) versus the pre-ADR-022 single
transaction of 120ms. Lock contention dropped by 80% (measured in staging)
because transactions are shorter and scoped to single aggregates. The version
column adds a small write overhead (one extra column update) which is
negligible.
SCALABILITY ANALYSIS
Aggregates scale by partitioning: an aggregate is a natural partition unit. The
enrollments table can be partitioned by school_id (per ADR-043 Multi-Tenant)
because aggregates are scoped to a single school. Cross-school aggregate
access is rare (only for reporting, which uses a separate read model per
ADR-030 CQRS). The aggregate pattern scales to thousands of aggregates per
school without performance degradation. The bottleneck is not aggregate size
but aggregate count in a single transaction — which is fixed at 1 by this ADR.
OPERATIONAL CONSIDERATIONS
Aggregate boundaries affect operations: a database restore is scoped to
aggregates (you can restore a single Enrollment aggregate without restoring
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 25

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
the entire database, using point-in-time recovery and aggregate-keyed restore).
On-call engineers diagnose incidents by examining the aggregate's event log
(domain events published by the aggregate). Monitoring tracks aggregate-level
metrics: load time per aggregate type, save time per aggregate type, conflict
rate per aggregate type. An aggregate with high conflict rate (>5%) is flagged
for review — it may need to be split or its invariants relaxed.
RISKS
| Risk             | Likelihood | Impact | Mitigation           |
| ---------------- | ---------- | ------ | -------------------- |
| Aggregates grow  | Medium     | Medium | ArchUnit size limit  |
| beyond 10        |            |        | fails the build;     |
| children,        |            |        | quarterly review     |
| degrading        |            |        | of aggregate sizes;  |
| performance      |            |        | Domain Architect     |
responsible for
splitting
| Cross-aggregate  | Medium | High | ArchUnit rule        |
| ---------------- | ------ | ---- | -------------------- |
| workflows are    |        |      | detects cross-       |
| incorrectly      |        |      | aggregate            |
| implemented as   |        |      | repository calls in  |
| single           |        |      | a single             |
| transactions     |        |      | @Transactional       |
method; code
review checklist
includes
aggregate
boundary check
| Invariants are       | Medium | High | ArchUnit rule       |
| -------------------- | ------ | ---- | ------------------- |
| placed in            |        |      | requires invariant  |
| application          |        |      | logic in            |
| services instead of  |        |      | @AggregateRoot      |
| aggregate roots      |        |      | classes; code       |
review checklist;
Domain Architect
enforcement
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  26

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk                 | Likelihood | Impact | Mitigation          |
| -------------------- | ---------- | ------ | ------------------- |
| Engineers bypass     | Low        | High   | DB read replicas    |
| aggregate root to    |            |        | restricted to       |
| query children       |            |        | application role    |
| directly via native  |            |        | with table-level    |
| SQL                  |            |        | permissions; child  |
tables have no
direct SELECT
grant for
application role;
native SQL
prohibited by
ADR-011
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Strong consistency within aggregate  Cross-aggregate workflows require
| boundary |     | sagas (more complex) |     |
| -------- | --- | -------------------- | --- |
Short transactions, low lock contention More database round-trips for cross-
aggregate workflows
Invariants enforced in one place (the  Engineers must learn DDD aggregate
| root) |     | pattern (training cost) |     |
| ----- | --- | ----------------------- | --- |
Aggregate-level reasoning (one cluster  Object graph navigation requires
| at a time) |     | explicit loads (no lazy loading) |     |
| ---------- | --- | -------------------------------- | --- |
REJECTED ALTERNATIVES
Lazy-loaded graphs (option 2) were the pre-ADR-022 state and produced three
production incidents in Q3 2025: a double-charge caused by a partial save of
Payment + Invoice, a deadlock caused by long transactions holding locks across
5 tables, and a report corruption caused by an N+1 query loading 200 entities
for a single enrollment report. Eager-loaded graphs (option 3) were prototyped
in the Enrollment domain: load time dropped from 120ms to 90ms but memory
pressure increased (200MB heap usage for 1000 enrollments vs 80MB for lazy),
and the consistency reasoning problem remained. Event-sourced aggregates
(option 4) were prototyped in the Audit domain (which needs complete history)
and worked well, but the operational overhead (event store, projections,
snapshot management) was deemed unjustified for transactional domains;
Audit uses event sourcing via ADR-048.
MIGRATION PLAN
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  27

PreOne ADR - Volume 2: Domain Architecture v3.0
Phase 1 (complete): Identify aggregates in all 12 domains via event storming.
Phase 2 (complete): Refactor entities to aggregate roots and children; add
@AggregateRoot annotation. Phase 3 (complete): Add version columns for
optimistic locking. Phase 4 (complete): Remove child repositories; route all
access through root repositories. Phase 5 (complete): ArchUnit rules enforced
in CI. Phase 6 (Q4 2026): Migrate cross-aggregate workflows from transactions
to sagas (3 workflows remaining: FeePayment, EnrollmentCancellation,
GuardianMerge).
TESTING STRATEGY
Aggregate rules are tested at three levels. Unit tests: each aggregate root has
tests for every invariant (e.g., 'Enrollment with 5 active discounts rejects 6th').
Contract tests: each aggregate root has contract tests verifying that all entry
points (commands) enforce invariants. ArchUnit tests: structural rules (size
limits, no child repositories, no cross-aggregate object references) are verified
at compile time. Integration tests: aggregate persistence (save and load) is
tested with Testcontainers PostgreSQL. Saga tests: cross-aggregate workflows
are tested with saga test harness (compensation, retry, timeout).
MONITORING & OBSERVABILITY
Aggregate-level metrics are emitted via Micrometer: aggregate.load.time (per
aggregate type), aggregate.save.time (per aggregate type),
aggregate.conflict.count (per aggregate type, for optimistic lock conflicts),
aggregate.size (per aggregate type, for size trend). These metrics are
dashboarded in Grafana per domain. Alerts fire on: load time p95 > 50ms
(performance degradation), conflict rate > 5% (concurrency issue), size > 7
children (approaching limit). The quarterly architecture scorecard reviews
aggregate metrics per domain.
FUTURE EVOLUTION
Two evolutions are likely. First, event sourcing may be adopted for specific
aggregates that need complete history (Audit, Compliance) — this would be a
new ADR superseding ADR-048 for those domains. Second, the saga pattern
(ADR-036) may evolve into a workflow engine (ADR-037) for complex cross-
aggregate workflows. The aggregate rules themselves are stable and unlikely
to change; the DDD aggregate pattern has been stable for 20 years. The size
limit (10 children) may be revisited if performance characteristics change (e.g.,
columnar storage for aggregates).
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity drives
aggregate consistency)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 28

PreOne ADR - Volume 2: Domain Architecture v3.0
● ADR-004 — Domain Driven Design (aggregate is a DDD building block)
● ADR-005 — Bounded Context Strategy (aggregates live within bounded
contexts)
● ADR-007 — Dependency Rule (aggregate root is the entry point —
inward dependency)
● ADR-023 — Entity Rules (entities that are aggregate roots follow entity
rules)
● ADR-024 — Value Objects (aggregates contain value objects)
● ADR-026 — Repository Pattern (only aggregate roots have repositories)
● ADR-027 — Domain Events (cross-aggregate communication via events)
● ADR-032 — Unit of Work (one transaction = one aggregate)
● ADR-036 — Saga Readiness (cross-aggregate workflows are sagas)
● ADR-049 — Optimistic Locking (aggregate roots have version fields)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — aggregate
pattern)
● Upstream PRD: PRD-002-section-3 (Enrollment domain model)
● Downstream ERD: ERD-002 (Enrollment aggregate schema)
● Downstream API Spec: API-002 (Enrollment commands respect
aggregate boundary)
● Downstream Test Cases: TC-0022..TC-0024 (Aggregate invariant tests)
● External: Eric Evans — Domain-Driven Design, Chapter 6 (Aggregates)
● External: Vaughn Vernon — Effective Aggregate Design (3-part series)
DECISION HISTORY
Date Status Actor Notes
2025-09-20 Draft Enrollment Initial draft with 6
Domain Architect rules; expanded to
8 after review
2025-10-22 Proposed Enrollment Submitted to ARB
Domain Architect after Enrollment
pilot
2025-11-12 Accepted ARB Chair ARB approved;
ArchUnit rules
added to CI
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 29

PreOne ADR - Volume 2: Domain Architecture v3.0
Date Status Actor Notes
2026-07-18 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1 and Vol 3
ADRs added
APPROVAL & SIGN-OFF
Architect Chief Architect (AR)
Tech Lead Enrollment Domain Architect
ARB Chair ARB Chair
Approved On 2026-07-18
IMPLEMENTATION CHECKLIST
● Identify aggregates in all 12 domains via event storming (Done — see
aggregate map)
● Add @AggregateRoot annotation to all root entities (Done — 47 roots
annotated)
● Add version columns for optimistic locking on all root tables (Done —
Flyway V1.2.0)
● Remove child repositories; route access through root repositories
(Done — 23 child repos removed)
● ArchUnit rules for size, no-child-repo, no-cross-agg-refs (Done — CI
gate since V1.3.0)
● Migrate cross-aggregate workflows to sagas (In progress — 3 of 7
workflows migrated)
● Aggregate-level metrics dashboard in Grafana (Done — per-domain
dashboards)
● Quarterly aggregate size review (Done — first review 2026-Q2)
AD R -023
Entity Rules
Volume 2 — Domain Architecture - DDD Pattern
ACCEPTED
DECISION SUMMARY
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 30

PreOne ADR - Volume 2: Domain Architecture v3.0
DECISION
Define the rules for entities in the PreOne domain model. An entity has
identity that persists across state changes; equality is based on identity, not
attributes; entities are mutable but only through methods that enforce
invariants; identity is generated via UUID v7; entities are persisted as JPA
@Entity with a typed ID value object.
STATUS
Status Accepted
Date Decided 2025-11-19
Decision Owner Domain Architect — Student
Review Cadence Annual or on identity strategy
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-023, PreOne entities used auto-incremented Long IDs, Lombok
@Data for equals/hashCode (which used all fields), and direct field mutation via
setters. This produced three classes of bugs. First, equality was inconsistent:
two Student objects representing the same student but with different email
attributes were 'not equal', breaking collection operations. Second, identity
collisions occurred when entities were created concurrently — two transactions
both read max(id)+1 and collided. Third, invariant bypass was routine: a setter
setStudentStatus(StudentStatus.INACTIVE) skipped the 'cannot deactivate a
student with unpaid fees' check. The Student Domain Architect led a 3-week
refactoring of the Student entity as a pilot. The new Student entity uses a
StudentId value object (UUID v7), overrides equals/hashCode based on
StudentId only, exposes no setters, and enforces invariants in methods like
deactivate() which checks for unpaid fees before setting status. The pilot
reduced Student-related bugs by 70% in Q4 2025. This ADR codifies the rules
for all entities across all 12 domains. ArchUnit tests verify the rules at compile
time.
BUSINESS DRIVERS
The primary driver is correctness: entities with proper identity semantics
behave predictably in collections, caches, and transactions. Equality by identity
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 31

PreOne ADR - Volume 2: Domain Architecture v3.0
(not attributes) is the only model that survives state changes — an entity that
changes its email should still be the same entity. The secondary driver is
performance: UUID v7 IDs are sortable (time-ordered) and collision-free,
eliminating the database round-trip for ID generation. The tertiary driver is
security: sequential IDs leak information (a competitor can estimate PreOne's
student count by observing ID increments); UUIDs are unguessable. A fourth
driver is invariant enforcement: by removing setters and requiring state
changes via methods, the entity forces all mutations through invariant-checking
code paths. This eliminates the class of bugs where a setter bypasses a business
rule.
PROBLEM STATEMENT
PreOne's entities lack proper identity semantics, use mutable setters that
bypass invariants, and use sequential IDs that leak information and collide
under concurrency. We must define entity rules that enforce identity stability,
invariant protection, and collision-free ID generation.
CONSTRAINTS
● Entity equality is based on identity (ID) only, not attributes
● Entity ID is a typed value object (StudentId, not UUID or Long)
● Entity ID is generated via UUID v7 (sortable, collision-free)
● Entities expose no public setters; state changes via domain methods
● Entities are persisted as JPA @Entity with @EmbeddedId for the typed
ID
ASSUMPTIONS
● PostgreSQL uuid type is efficient for storage and indexing (16 bytes, B-
tree friendly)
● UUID v7 sortability is sufficient for time-ordered queries (no separate
created_at index needed for common cases)
● JPA/Hibernate supports @EmbeddedId with value objects correctly
(verified in Hibernate 6.2+)
● The performance overhead of UUID v7 generation (vs auto-increment)
is negligible
● Engineers will accept the no-setter discipline (cultural shift required)
OPTIONS CONSIDERED
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 32

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Option           | Pros              | Cons                | Verdict |
| ---------------- | ----------------- | ------------------- | ------- |
| Typed UUID v7    | Correct identity  | Learning curve for  | Chosen  |
| ID, no setters,  | semantics;        | engineers;          |         |
| equality by ID   | collision-free;   | requires typed ID   |         |
| (chosen)         | sortable;         | value objects per   |         |
|                  | unguessable;      | entity              |         |
|                  | invariant         | (boilerplate); JPA  |         |
|                  | enforcement via   | @EmbeddedId is      |         |
|                  | methods; aligns   | more complex        |         |
|                  | with DDD.         | than @Id.           |         |
Auto-incremented  Familiar to Spring  Equality by all  Rejected
| Long ID, Lombok  | developers;          | fields (wrong);     |     |
| ---------------- | -------------------- | ------------------- | --- |
| @Data, setters   | minimal              | sequential IDs      |     |
|                  | boilerplate; simple  | leak info; setters  |     |
|                  | JPA mapping.         | bypass invariants;  |     |
concurrency
collisions on
max(id)+1; pre-
ADR-023 state.
| UUID v4            | Unguessable;        | Not sortable      | Rejected |
| ------------------ | ------------------- | ----------------- | -------- |
| (random), no       | collision-free; no  | (random order in  |          |
| setters, equality  | setters; correct    | indexes,          |          |
| by ID              | equality.           | fragmentation);   |          |
index performance
worse than v7 for
time-ordered data;
pre-2022
standard.
Snowflake IDs  Sortable; collision- Requires machine- Rejected
| (Twitter) | free; distributed- | id coordination;     |     |
| --------- | ------------------ | -------------------- | --- |
|           | generation         | 64-bit long but not  |     |
|           | friendly.          | a UUID; less         |     |
ecosystem
support;
operational
complexity for
machine-id
assignment.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  33

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following entity rules enforced via ArchUnit: (1) Every entity has
a typed ID value object (e.g., StudentId extends AggregateRootId). (2) ID is
generated via UUID v7 at construction time (in the factory method, not by
the database). (3) Entity equality and hashCode are based on ID only —
verified by ArchUnit requiring equals/hashCode to delegate to id().equals().
(4) Entities expose no public setters — fields are private and mutated only
via domain methods (e.g., student.deactivate(), not student.setStatus()). (5)
Entities are JPA @Entity with @EmbeddedId for the typed ID. (6) Entity
constructors are package-private; instances are created via static factory
methods (e.g., Student.create(...)). (7) Entities implement the
OptimisticLockable interface (per ADR-049) if they are aggregate roots.
DETAILED RATIONALE
The chosen option is the only one that produces correct identity semantics,
invariant enforcement, and operational benefits simultaneously. Auto-
incremented Long IDs (option 2) were the pre-ADR-023 state and produced the
bugs that motivated this ADR. UUID v4 (option 3) solves collision and
unguessability but not sortability — random UUIDs cause index fragmentation
in PostgreSQL because new rows are inserted at random positions in the B-tree,
degrading insert performance by 30-40% at scale. Snowflake IDs (option 4)
solve sortability but require machine-id coordination, which is operational
complexity PreOne does not need at its scale (single primary database, no
distributed ID generation). Rule (1) — typed ID value objects — prevents ID
confusion at compile time. A method expecting StudentId will not accept
EnrollmentId, even though both wrap a UUID. This eliminates a class of bugs
where IDs are passed in the wrong order (e.g., enroll(studentId, guardianId)
called as enroll(guardianId, studentId) would silently swap the IDs if both were
UUID). The typed ID is a value object per ADR-024, immutable and equality-by-
value. Rule (2) — UUID v7 generated at construction — means the ID is known
before the entity is persisted. This simplifies testing (the test creates an entity,
knows its ID immediately, can reference it in related entities). UUID v7 is time-
ordered (the first 48 bits are a Unix timestamp in milliseconds), so rows
inserted later sort after rows inserted earlier — this matches the common query
pattern 'recent entities first' and produces sequential B-tree inserts. The
collision probability is negligible (2^74 IDs before a 50% collision chance).
Rule (3) — equality by ID — produces correct collection behaviour. Two Student
objects representing the same student (same StudentId) are equal even if their
email attributes differ (e.g., one was loaded from cache, one from DB after an
email update). This is critical for Set operations (deduplication) and Map
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 34

PreOne ADR - Volume 2: Domain Architecture v3.0
operations (keying). Lombok @Data generates equals/hashCode based on all
fields, which is wrong for entities — this rule prohibits @Data on entities. Rule
(4) — no public setters — is the most culturally impactful rule. Engineers
accustomed to setters must learn to add domain methods (deactivate(),
updateEmail(), transferToBranch()). This is more verbose but enforces
invariants: the deactivate() method checks 'no unpaid fees' before setting
status, whereas setStatus(INACTIVE) would skip the check. The ArchUnit rule
verifies that @Entity classes have no public setter methods (methods named
setX with one parameter). Rule (5) — JPA @EmbeddedId — persists the typed
ID as a uuid column. The alternative (@Id UUID with a converter) loses the type
information at the JPA level. @EmbeddedId preserves the type: the repository
method is findById(StudentId id), not findById(UUID id). This is a compile-time
safety improvement. Rule (6) — package-private constructors, public factory
methods — centralises entity creation. The factory method enforces creation
invariants (e.g., Student.create() requires a non-null name, a valid date of birth,
a BranchId). The constructor cannot be called from outside the package, so the
factory is the only entry point. This prevents the creation of invalid entities
(e.g., a Student with a null name) which would fail at persistence time with an
opaque SQL exception. Rule (7) — OptimisticLockable on aggregate roots —
integrates with ADR-049. Aggregate root entities have a version field; non-root
entities (children) do not need their own version because they are loaded and
saved with the root. The OptimisticLockable interface is a marker for the
repository to use optimistic locking on save.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Entity Rules
| | | | +---------------------+ @Entity
| | | Student (entity) | @EmbeddedId: StudentId | | |---------------------|
- studentId: StudentId (UUID v7) | | | - name: String | - version: long (if
@AggregateRoot) | | | - email: String | - createdAt, updatedAt | | |
- status: enum | | | |---------------------|
equals/hashCode: by studentId only | | | +deactivate() |
| | | +updateEmail() | NO public setters | | |
+transferToBranch() | NO @Data (Lombok) | | +---------------------+
Constructor: package-private | | Factory:
Student.create(...) public | | | | Typed
ID: | | +---------------------+
| | | StudentId (VO) | extends AggregateRootId | | |---------------------|
- value: UUID (v7) | | | +value(): UUID | equals: by value
| | +---------------------+ immutable | |
| | ArchUnit: | | - @Entity classes: no public
setters | | - @Entity classes: equals/hashCode delegate to id
| | - @Entity classes: @EmbeddedId (not @Id) | | - ID classes:
extend AggregateRootId |
+------------------------------------------------------------------+
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 35

PreOne ADR - Volume 2: Domain Architecture v3.0
SEQUENCE DIAGRAM
Factory Caller Student Entity UUID v7 Gen DB | |
| | |--create(name,dob)->| | | | |--
generateId()----->| | | |<--UUID v7----------| | |
| | | | |--validate args | | |
| (name not null, | | | | dob in past) | | |
| | | | |--new Student(...) | | |
| (pkg-private ctor)| | |<--student----------| | | |
| | | | | | | |--save via
repo------------------------>| | | | |--INSERT------>|
| | |<--ok----------| |<--saved------------| |
| | | | | | (later) update email:
| |--student.updateEmail(newEmail)---------->| | | |--
validate email | | | |--set email (no setter) | |
|--mark updated | |--save via repo------------------------>| |
| | |--UPDATE | | | |
WHERE version| | | | =N | |<--saved
(version=N+1) | |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Student Entity (example)
| | | | +---------------------+ @Entity
| | | Student | @EmbeddedId | | |---------------------|
| | | - studentId (ID) |<-- StudentId (value object) | | | - name |
+-----------------+ | | | - email | | StudentId | | | | -
dateOfBirth | | - value: UUID | | | | - branchId (ref) | | +value()
| | | | - status | | +equals(by val) | | | | - version (lock) |
+-----------------+ | | | - createdAt | | | | -
updatedAt | Invariants (in methods): | | |---------------------| -
deactivate(): no unpaid fees | | | +deactivate() | - updateEmail(): valid
format | | | +updateEmail() | - transferToBranch(): not mid- | | |
+transferToBranch() | enrollment | | | +archive() |
| | |---------------------| Factory: | | | (private ctor) | +
create(name,dob,branch): Student| | | +create() (static) | + reinstate(history):
Student | | +---------------------+ | |
| | ArchUnit enforcement: | | - No public setX methods
| | - equals/hashCode delegate to studentId | | - @EmbeddedId (not
@Id) | | - StudentId extends AggregateRootId
| +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Create Student Command | v +----+-----+ | App Svc |---
Student.create(name,dob,branchId)--> Student factory +----+-----+
| | v | +-------------
+--------+ | | Validate args | |
| Generate UUID v7 | | | Package-private ctor |
| +-------------+--------+ | |
|<--student (valid, has ID)------------------------| | |
|--studentRepository.save(student) | |
| | +-------------+--------+ | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 36

PreOne ADR - Volume 2: Domain Architecture v3.0
Hibernate serialize | | | INSERT INTO students |
| | (id, name, ...) | | +-------------
+--------+ | | |<--
saved----------------------------------------| | | |--
publish StudentCreated event | | (carries studentId, branchId)
| | | v +----+-----+ | Event Bus|---
Enrollment domain (denormalises student name) +----------+ Notification
domain (sends welcome email)
DATABASE IMPACT
Entities map to PostgreSQL tables with uuid primary keys. The students table
has student_id uuid primary key, version bigint, created_at timestamptz,
updated_at timestamptz, plus domain columns (name, email, date_of_birth,
branch_id, status). The uuid type is 16 bytes (vs 8 bytes for bigint) — a 40%
increase in index size, but offset by the elimination of a separate sequence table
and the sortability benefit. UUID v7 IDs sort sequentially, so the B-tree index on
student_id has low fragmentation. A separate index on created_at is not needed
for common queries because UUID v7 encodes timestamp. Flyway migrations
enforce uuid type for all primary keys; bigint primary keys are prohibited per
ArchUnit.
API IMPACT
API endpoints accept and return entity IDs as strings (UUID format). A POST
/students request returns {"studentId": "018f6b1a-..."} where the ID is a UUID
v7. Subsequent requests reference the student via the ID: GET
/students/{studentId}. The API does not expose internal sequential IDs or
database row IDs. The typed ID value object is serialised as a string; the API
layer converts between string and StudentId via a Jackson serializer. This keeps
the type safety at the application layer while remaining compatible with
standard REST conventions.
UI IMPACT
UI components display entity IDs in human-readable form only when necessary
(e.g., in URLs: /students/018f6b1a-...). UI screens never expose the ID as a
primary display field (users see names, not IDs). When an entity is created via a
UI form, the ID is generated server-side and returned to the UI; the UI does not
generate IDs. Entity equality in the UI (e.g., React key prop) uses the ID string,
not the entity attributes — this prevents React re-renders when attributes
change but identity does not.
SECURITY IMPACT
UUID v7 IDs are unguessable, preventing enumeration attacks. An attacker
who knows a student ID cannot guess other student IDs (unlike sequential IDs
where /students/1, /students/2, ... are enumerable). However, UUID v7 encodes
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 37

PreOne ADR - Volume 2: Domain Architecture v3.0
a timestamp, which leaks the creation time of the entity — this is acceptable for
PreOne (creation time is not sensitive) but would be a concern for systems
where creation time is sensitive. The typed ID value object prevents ID
confusion attacks (passing a GuardianId where a StudentId is expected) at
compile time.
PERFORMANCE IMPACT
UUID v7 has near-identical insert performance to bigint (sequential B-tree
inserts) and better than UUID v4 (random inserts cause fragmentation). Index
size is 40% larger than bigint (16 bytes vs 8 bytes), which is a minor cost. The
no-setter rule has no performance impact. The factory method pattern adds one
method call per entity creation, which is negligible. Optimistic locking (version
check) adds one column read and one column write per save, which is
negligible. Overall, the entity rules have a small performance cost (~5% slower
than raw bigint IDs) offset by correctness and security benefits.
SCALABILITY ANALYSIS
UUID v7 scales to 2^74 IDs before collision risk — sufficient for any scale
PreOne will reach. The 16-byte uuid type is supported natively by PostgreSQL
and scales to petabyte-scale databases. The typed ID value object adds no
scalability cost (it is a wrapper, not a database concern). The no-setter rule
improves scalability by ensuring invariants hold under concurrent access —
without it, race conditions on setters produce inconsistent state that is
expensive to detect and repair at scale.
OPERATIONAL CONSIDERATIONS
Entity IDs in logs and traces are UUIDs, which are longer than sequential IDs
but more debuggable (the timestamp prefix in UUID v7 indicates when the
entity was created, useful for timeline reconstruction). Database replication
(logical replication to read replicas) handles uuid type natively. Backup and
restore preserve uuid values. The quarterly architecture scorecard audits
entity rule violations (ArchUnit reports) and tracks the count — target is zero
violations after the initial migration.
RISKS
Risk Likelihood Impact Mitigation
Engineers resist Medium Medium ArchUnit detects
no-setter rule and public setters;
find workarounds reflection usage is
(e.g., reflection) prohibited by
ADR-011; code
review checklist
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 38

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk              | Likelihood | Impact | Mitigation            |
| ----------------- | ---------- | ------ | --------------------- |
| Typed ID value    | High       | Low    | Accept the            |
| objects create    |            |        | boilerplate as the    |
| boilerplate (one  |            |        | cost of type safety;  |
| class per entity) |            |        | code generation       |
template provided
| UUID v7            | Low    | Low    | Acceptable for        |
| ------------------ | ------ | ------ | --------------------- |
| timestamp          |        |        | PreOne; if            |
| leakage reveals    |        |        | sensitive in future,  |
| business metrics   |        |        | switch to UUID v8     |
| (creation rate)    |        |        | (random suffix)       |
| JPA @EmbeddedId    | Medium | Medium | Reference             |
| complexity causes  |        |        | implementation in     |
| mapping bugs       |        |        | Student entity;       |
Hibernate 6.2+
tested; training
session for
engineers
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Correct identity semantics (equality by  More boilerplate (typed ID classes,
| ID) |     | factory methods) |     |
| --- | --- | ---------------- | --- |
Invariant enforcement (no setter  Cultural shift for engineers (no setters)
bypass)
Unguessable IDs (no enumeration  16-byte IDs (40% larger index than
| attacks) |     | bigint) |     |
| -------- | --- | ------- | --- |
Sortable UUID v7 (sequential inserts) Slightly more complex than auto-
increment
REJECTED ALTERNATIVES
Auto-incremented Long IDs (option 2) were the pre-ADR-023 state. Three
production incidents in Q3 2025 traced to ID-related bugs: an enrollment
charged to the wrong student because two students were created concurrently
and their IDs swapped; a report that counted students by ID range leaked the
student creation rate to a competitor; a Set<Student> that should have
deduplicated by identity grew unbounded because equals/hashCode used all
fields. UUID v4 (option 3) was prototyped: insert performance was 35% slower
than bigint due to index fragmentation, and the prototype was abandoned.
Snowflake IDs (option 4) were evaluated but rejected because the operational
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  39

PreOne ADR - Volume 2: Domain Architecture v3.0
complexity (machine-id coordination) was not justified at PreOne's scale (single
primary database); if PreOne adopts multi-region write databases in the future,
Snowflake may be revisited.
MIGRATION PLAN
Phase 1 (complete): Pilot in Student domain — refactor Student entity to new
rules. Phase 2 (complete): Refactor all 12 domains' entities — 87 entities
migrated. Phase 3 (complete): Add ArchUnit rules to CI. Phase 4 (complete):
Migrate database primary keys from bigint to uuid (Flyway V1.4.0, with dual-
write period). Phase 5 (complete): Remove legacy bigint columns. Phase 6 (Q4
2026): Training session for new engineers on entity rules (ongoing, every
onboarding cohort).
TESTING STRATEGY
Entity rules are tested at three levels. Unit tests: each entity tests equality (two
instances with same ID are equal regardless of attributes), immutability (no
setters), invariant enforcement (e.g., deactivate() throws on unpaid fees).
Contract tests: each entity has a contract test verifying the factory method
rejects invalid arguments. ArchUnit tests: structural rules (no public setters,
equals/hashCode delegate to ID, @EmbeddedId, typed ID extends
AggregateRootId) verified at compile time. Integration tests: entity persistence
(save and load) tested with Testcontainers PostgreSQL.
MONITORING & OBSERVABILITY
Entity-level metrics are minimal (entities are not directly observable). Indirect
metrics: optimistic lock conflict rate per entity type (high rate may indicate
invariant design issue), entity creation rate per type (for capacity planning),
ArchUnit violation count per build (target: zero). The quarterly architecture
scorecard audits a sample of entities per domain for rule compliance.
FUTURE EVOLUTION
Two evolutions are possible. First, UUID v8 (custom) may be adopted if
timestamp leakage becomes a concern — UUID v8 allows random suffixes while
preserving sortability. Second, event-sourced entities (per ADR-048 Audit) may
spread to other domains if complete history is needed — event-sourced entities
have different rules (immutable events, no in-place updates) and would be a
separate ADR. The entity rules themselves (typed ID, no setters, equality by ID)
are stable and unlikely to change.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity drives
identity stability)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 40

PreOne ADR - Volume 2: Domain Architecture v3.0
● ADR-004 — Domain Driven Design (entity is a DDD building block)
● ADR-022 — Aggregate Rules (aggregate roots are entities)
● ADR-024 — Value Objects (entity IDs are value objects)
● ADR-026 — Repository Pattern (repositories persist entities)
● ADR-032 — Unit of Work (transactions span entities within an
aggregate)
● ADR-039 — Domain Exceptions (invariant violations throw domain
exceptions)
● ADR-042 — UUID Strategy (UUID v7 for entity IDs)
● ADR-049 — Optimistic Locking (aggregate root entities have version
fields)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — entity pattern)
● Upstream PRD: PRD-002-section-2 (Student lifecycle and identity)
● Downstream ERD: ERD-001 (Student entity schema with uuid primary
key)
● Downstream API Spec: API-001 (Student API uses UUID v7 IDs as
strings)
● Downstream Test Cases: TC-0025..TC-0027 (Entity equality,
immutability, invariant tests)
● External: Eric Evans — Domain-Driven Design, Chapter 5 (A Model
Expressed as Software)
● External: UUID v7 RFC 9562 — time-ordered UUIDs
DECISION HISTORY
Date Status Actor Notes
2025-09-25 Draft Student Domain Initial draft with 5
Architect rules; expanded to
7 after review
2025-10-28 Proposed Student Domain Submitted to ARB
Architect after Student pilot
2025-11-19 Accepted ARB Chair ARB approved;
ArchUnit rules
added to CI
2026-07-20 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1 and Vol 3
ADRs added
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 41

PreOne ADR - Volume 2: Domain Architecture v3.0
APPROVAL & SIGN-OFF
Architect Chief Architect (AR)
Tech Lead Student Domain Architect
ARB Chair ARB Chair
Approved On 2026-07-20
IMPLEMENTATION CHECKLIST
● Add StudentId value object as reference implementation (Done — PR
#4601)
● Refactor all 87 entities to new rules (Done — PR #4615)
● Add ArchUnit rules: no setters, equals by ID, @EmbeddedId (Done —
CI gate since V1.4.0)
● Migrate database primary keys from bigint to uuid (Done — Flyway
V1.4.0)
● Dual-write period for backward compatibility (Done — 4 weeks, no
issues)
● Remove legacy bigint columns (Done — Flyway V1.5.0)
● Training session for engineers (Done — 4 sessions delivered)
● Entity rule violations audit in quarterly scorecard (Done — first audit
2026-Q1, zero violations)
AD R -024
Value Objects
Volume 2 — Domain Architecture - DDD Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Define the rules for value objects in the PreOne domain model. A value
object is immutable, has no identity, is equal by all attributes, validates in its
constructor, and is persisted as a JPA @Embeddable. Value objects model
domain concepts like Money, DateRange, Address, EmailAddress, and
typed IDs.
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 42

PreOne ADR - Volume 2: Domain Architecture v3.0
STATUS
Status Accepted
Date Decided 2025-11-26
Decision Owner Domain Architect — Billing
Review Cadence Annual or on value object pattern
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-024, PreOne modelled domain concepts as primitive types: Money
as BigDecimal, EmailAddress as String, Address as four String fields,
DateRange as two LocalDate fields. This produced several classes of bugs.
First, primitive obsession: a method transfer(BigDecimal amount, BigDecimal
fee) could be called as transfer(fee, amount) with no compile-time error.
Second, invalid values: an EmailAddress of "not-an-email" and a Money of -100
were accepted at construction and failed at use. Third, equality was
inconsistent: two Address instances with the same fields were not equal
because Object.equals was used. The Billing Domain Architect led a 4-week
pilot to introduce value objects in the Billing domain. The Money value object
(amount + currency, immutable, validates non-negative) eliminated the
'transfer(fee, amount)' bug class. The EmailAddress value object (validates
format in constructor) eliminated invalid-email bugs. The pilot reduced Billing-
related input validation bugs by 85%. This ADR codifies the rules for value
objects across all 12 domains. ArchUnit tests verify the rules at compile time. A
value object library (preone-domain-values) provides reusable value objects:
Money, DateRange, EmailAddress, PhoneNumber, Address, Percentage,
Quantity, and the typed ID base class.
BUSINESS DRIVERS
The primary driver is correctness: value objects prevent invalid states (negative
money, malformed emails) by validating at construction. An invalid value object
cannot exist — the constructor throws, so the rest of the system never sees an
invalid value. The secondary driver is type safety: a method transfer(Money
amount, Money fee) cannot have its arguments swapped because both are
Money, but the Money parameter names document intent and a future
refactoring to typed wrappers (FeeAmount, TransferAmount) is possible. The
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 43

PreOne ADR - Volume 2: Domain Architecture v3.0
tertiary driver is readability: code using value objects
(student.updateEmail(new EmailAddress("a@b.com"))) is more expressive than
code using primitives (student.setEmail("a@b.com")). A fourth driver is
domain richness: value objects can contain domain logic. Money.add(Money)
handles currency conversion checks; DateRange.overlaps(DateRange)
encapsulates the overlap calculation; EmailAddress.redactForDisplay()
provides GDPR-compliant display. Pushing logic into value objects reduces the
burden on entities and services.
PROBLEM STATEMENT
PreOne's domain model uses primitives for domain concepts, causing type
confusion, invalid values, and inconsistent equality. We must define value
object rules that enforce immutability, validation, and equality by value,
aligned with DDD principles.
CONSTRAINTS
● Value objects are immutable (all fields final, no setters)
● Value objects validate invariants in the constructor (throw on invalid)
● Value object equality is by all fields (not identity)
● Value objects have no identity (no ID field)
● Value objects are persisted as JPA @Embeddable (or
@ElementCollection for collections)
ASSUMPTIONS
● JPA/Hibernate supports @Embeddable correctly (verified in Hibernate
6.2+)
● The performance overhead of value object construction (vs primitive) is
negligible
● Engineers will accept the discipline of creating value object classes
(cultural shift)
● The preone-domain-values library will be maintained and versioned
● Value objects can be serialised to JSON (Jackson) and to PostgreSQL
(Hibernate) without issues
OPTIONS CONSIDERED
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 44

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Option            | Pros                 | Cons                 | Verdict  |
| ----------------- | -------------------- | -------------------- | -------- |
| Strict value      | Correct DDD          | Boilerplate (one     | Chosen   |
| objects with      | semantics; invalid   | class per concept);  |          |
| @Embeddable,      | states impossible;   | JPA @Embeddable      |          |
| immutable,        | type safety;         | is more complex      |          |
| validate-in-ctor  | domain logic in      | than primitives;     |          |
| (chosen)          | value objects;       | learning curve;      |          |
|                   | aligns with DDD      | serialisation        |          |
|                   | literature.          | complexity.          |          |
| Primitives with   | Familiar; minimal    | Primitive            | Rejected |
| validation in     | boilerplate; simple  | obsession; invalid   |          |
| services (pre-    | JPA mapping.         | values possible;     |          |
| ADR-024 state)    |                      | no domain logic in   |          |
values;
inconsistent
equality; pre-
ADR-024 state.
JSR-303 Bean  Less boilerplate  Validation at field- Rejected
| Validation on     | than value          | set time (not   |     |
| ----------------- | ------------------- | --------------- | --- |
| primitive fields  | objects;            | construction);  |     |
| (@Email, @Min)    | declarative         | does not solve  |     |
|                   | validation; Spring  | primitive       |     |
|                   | support.            | obsession;      |     |
runtime validation
(not compile-
time); no domain
logic.
| Lombok @Value  | Less boilerplate;  | No constructor       | Rejected |
| -------------- | ------------------ | -------------------- | -------- |
| (immutable     | immutable by       | validation           |          |
| classes)       | default;           | (Lombok @Value       |          |
|                | equals/hashCode    | does not validate);  |          |
|                | by all fields.     | does not enforce     |          |
@Embeddable;
Lombok
dependency
(restricted per
ADR-011).
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  45

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following value object rules enforced via ArchUnit: (1) Value
objects are immutable — all fields are final, no setters. (2) Value objects
validate invariants in the constructor — throw IllegalArgumentException on
invalid input. (3) Value object equals/hashCode are based on all fields. (4)
Value objects have no identity field. (5) Value objects are JPA @Embeddable
(or @ElementCollection for collections). (6) Value objects implement a
valueOf() static factory for parsing (e.g., Money.valueOf("100.00 INR")). (7)
Value objects are serialised to JSON as strings (e.g., "100.00 INR") via
Jackson converters. (8) Reusable value objects live in preone-domain-
values; domain-specific value objects live in their domain module.
DETAILED RATIONALE
The chosen option is the only one that produces correct DDD value object
semantics. Primitives with service validation (option 2) were the pre-ADR-024
state and produced the bugs that motivated this ADR. JSR-303 Bean Validation
(option 3) validates at field-set time, which means an invalid value can exist
transiently (between set and validation) — value objects prevent this by
validating at construction. Lombok @Value (option 4) provides immutability but
not validation; Lombok is also restricted per ADR-011 (Coding Standards) due
to issues with @Builder and @SuperBuilder in inheritance hierarchies. Rule (1)
— immutability — means value objects can be freely shared without defensive
copies. A Money object passed to a method cannot be modified by the method,
so the caller's reference is safe. This eliminates a class of concurrency bugs
(shared mutable state) and simplifies reasoning (a value object's state at time T
is its state forever). The final keyword on fields and the absence of setters are
enforced by ArchUnit. Rule (2) — validate in constructor — means an invalid
value object cannot exist. The Money constructor throws if amount is negative
or currency is null. The EmailAddress constructor throws if the string is not a
valid email. This is 'fail fast' at the boundary of the system — invalid input from
the API is rejected at the value object construction, not deep in the business
logic. The exception is a domain exception (ADR-039) with a clear message.
Rule (3) — equality by all fields — produces correct collection behaviour. Two
Money objects with the same amount and currency are equal; two with different
currencies are not. This is critical for Set operations (deduplicating a list of
fees) and Map operations (keying by Money amount). Object.equals (identity) is
wrong for value objects because two Money objects constructed separately but
representing the same value should be equal. Rule (4) — no identity field —
distinguishes value objects from entities. A value object is defined by its
attributes, not by an ID. This is the fundamental distinction: an entity has
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 46

PreOne ADR - Volume 2: Domain Architecture v3.0
identity that persists across state changes; a value object has no identity and is
defined by its immutable attributes. The absence of an ID field is enforced by
ArchUnit. Rule (5) — JPA @Embeddable — persists value objects as part of the
owning entity's table. A Student entity with an Address value object has
address_street, address_city, address_state, address_postal_code columns in
the students table. This is more efficient than a separate addresses table (no
join) and matches the domain model (Address is part of Student, not a separate
entity). @ElementCollection is used for collections of value objects (e.g., a
Student with a List<ContactMethod>), which creates a separate table but with
no identity (the join key is the owning entity's ID). Rule (6) — valueOf() factory
— provides a standard parsing interface. Money.valueOf("100.00 INR") parses
the string into a Money object. This is used for API deserialisation (Jackson calls
valueOf), for command-line tools, and for testing. The factory is separate from
the constructor because the constructor takes typed arguments (BigDecimal,
Currency) while the factory takes a string. Rule (7) — JSON serialisation as
strings — produces a clean API. Money is serialised as "100.00 INR" (a string),
not as {"amount": 100.00, "currency": "INR"} (an object). This is more
compact, more readable, and matches how humans write money. EmailAddress
is serialised as "user@example.com" (a string). The Jackson converter handles
the conversion between string and value object. Rule (8) — library vs domain-
specific — balances reuse and ownership. Money, DateRange, EmailAddress,
PhoneNumber, Address, Percentage, Quantity are reusable across domains and
live in preone-domain-values (owned by the Foundation Architect). Domain-
specific value objects (e.g., EnrollmentCode, FeeStructureId) live in their
domain module and are owned by the Domain Architect. The Foundation
Architect reviews additions to the shared library to prevent bloat.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Value Object Rules
| | | | +---------------------+ @Embeddable
| | | Money (VO) | immutable (all fields final) | | |---------------------|
validates in constructor | | | - amount: BigDecimal| equals by all fields
| | | - currency: Currency| no identity field | | |---------------------|
| | | +add(Money) | Factory: | | | +subtract(Money) | +
valueOf("100.00 INR"): Money | | | +multiply(BigDecimal)| +
zero(Currency): Money | | | +format(): String | |
| |---------------------| JSON: "100.00 INR" (string) | | | (private ctor) | JPA:
@Embeddable (cols in own table) | | | +valueOf() (static) |
| | +---------------------+ | |
| | preone-domain-values library: | |
+-----------------------------------------------------------+ | | | Money, DateRange,
EmailAddress, PhoneNumber, Address, | | | | Percentage, Quantity,
AggregateRootId (base for IDs) | | | +-----------------------------------------------------------
+ | | | | ArchUnit:
| | - @Embeddable classes: all fields final | | - @Embeddable
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 47

PreOne ADR - Volume 2: Domain Architecture v3.0
classes: no setters | | - @Embeddable classes:
equals/hashCode by all fields | | - @Embeddable classes: no ID field
| +------------------------------------------------------------------+
SEQUENCE DIAGRAM
API Request Jackson Converter Money VO DB | |
| | |--POST fee=100 INR->| | | | |--
valueOf("100 INR")-->| | | | |--validate | |
| | (amount>=0, | | | | currency) | |
| |--new Money() | | |<--money-----------| | |
| | | | |--fee.apply(money)-->| (domain logic)|
| | |--add() returns | | | | new
Money | | |<--result----------| | | |
| | | |--save entity------>| | | |
|--Hibernate | | | | serialise | | |
|--INSERT ----->| | | | (amount, curr)| | |
|<--ok-----------| |<--200 OK-----------| | | | |
| | | (later) JSON response: | |<--
{"fee":"150.00 INR"}------(Jackson serialises VO as string)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Value Object Examples
| | | | +---------------------+ +---------------------+
| | | Money | | DateRange | | | | - amount: BigDec | | -
start: LocalDate | | | | - currency: Currency| | - end: LocalDate | | |
| +add(Money):Money | | +contains(date) | | | | +subtract(Money) |
| +overlaps(Range) | | | | +multiply(BigDecimal)| | +duration(): Days |
| | | +format(): String | +---------------------+ | | +---------------------+
| | | | +---------------------+ +---------------------+
| | | EmailAddress | | Address | | | | - value: String | | -
street: String | | | | +value(): String | | - city: String | | | |
+redact(): String | | - state: String | | | | +domain(): String | | -
postalCode: String| | | +---------------------+ | +formatted(): String| | |
+---------------------+ | | | |
+---------------------+ +---------------------+ | | | StudentId (typed ID)| |
Percentage | | | | - value: UUID (v7) | | - value: BigDecimal | | |
| +value(): UUID | | (0-100) | | | | +toString(): String | |
+of(bd): Percentage | | | | +equals(by value) | | +multiply(Money) |
| | +---------------------+ +---------------------+ | |
| | Library: preone-domain-values (Foundation Architect owns) |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
External Input (API/CLI/UI form) | v +----+-----+ | String | (e.g.,
"100.00 INR", "user@example.com") +----+-----+ | |--Jackson converter /
valueOf() v +----+-----+ | Validate| (in constructor) +----+-----+ |
+---invalid---> throw DomainException (ADR-039) | v (valid) +----+-----+
| Value | (immutable, valid, equal-by-value) | Object | +----+-----+ |
|--passed to domain logic v +----+-----+ | Domain | (Money.add,
DateRange.overlaps, EmailAddress.redact) | Logic | +----+-----+ | |--
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 48

PreOne ADR - Volume 2: Domain Architecture v3.0
returns new value object (immutable -> new instance) v +----+-----+ |
Persist | (Hibernate @Embeddable -> columns in entity table) +----+-----+ |
v +----+-----+ | DB Row | (amount, currency, start_date, end_date, ...)
+----------+
DATABASE IMPACT
Value objects persist as columns in the owning entity's table. A Student entity
with an Address value object has address_street, address_city, address_state,
address_postal_code columns in the students table. A Student with a
List<ContactMethod> has a separate student_contact_methods table
(student_id, method_type, method_value) — no identity column, the primary
key is (student_id, method_type). This is more efficient than a separate
addresses table (no join for reads) and matches the domain model. Money
persists as two columns (amount numeric, currency char(3)). DateRange
persists as two columns (start_date date, end_date date). Flyway migrations
create these columns; ArchUnit verifies @Embeddable classes have no @Id
field.
API IMPACT
Value objects are serialised as strings in JSON. A POST /fees request with
{"amount": "100.00 INR"} deserialises to a Money value object via Jackson. A
GET /fees/{id} response includes {"amount": "150.00 INR"}. This is more
compact than {"amount": {"amount": 150.00, "currency": "INR"}} and more
readable. The Jackson converter is registered globally; each value object has a
converter that calls valueOf() for deserialisation and format() (or toString()) for
serialisation. API documentation (OpenAPI) describes value object fields as
strings with a format example.
UI IMPACT
UI forms collect value object inputs as strings (text input for email,
number+currency picker for money). The UI validates format before
submitting (e.g., regex for email), but the server is the source of truth — server-
side value object construction validates again. UI display formats value objects
via their format() method (e.g., Money.format() returns "100.00 INR";
DateRange.format() returns "2026-01-01 to 2026-03-31"). The UI does not
parse value object internals (e.g., it does not access money.amount and
money.currency separately).
SECURITY IMPACT
Value objects improve security by validating at construction. An EmailAddress
value object rejects malformed input that could be used for email header
injection (e.g., "a@b.com\r\nBcc: victim@x.com"). A Money value object rejects
negative amounts that could be used for fraud (e.g., a negative fee that credits
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 49

PreOne ADR - Volume 2: Domain Architecture v3.0
the attacker). A PhoneNumber value object normalises format (e.g., +91 80
1234 5678) preventing format-based attacks. The redact() method on sensitive
value objects (EmailAddress, PhoneNumber) provides GDPR-compliant display
(e.g., "a***@b.com").
PERFORMANCE IMPACT
Value objects have a small performance cost: construction allocates an object
(vs a primitive on the stack), and method calls (vs direct field access) add a tiny
overhead. In benchmarks, Money arithmetic is 10-15% slower than BigDecimal
arithmetic due to object allocation. This is acceptable for PreOne's transaction
volume (5,000 TPS peak). The immutability benefit (no defensive copies, thread
safety) offsets the allocation cost. JPA @Embeddable has no performance cost
vs primitive columns (same database representation).
SCALABILITY ANALYSIS
Value objects scale linearly with entity count. The preone-domain-values library
is stateless and has no scalability concerns. The immutability of value objects
enables safe sharing across threads (no synchronisation needed), which is
critical for scalability under concurrent load. The @ElementCollection pattern
for value object collections does not scale to large collections (thousands of
items per entity) — for those cases, a separate entity with identity is
appropriate (e.g., a Student with thousands of AttendanceRecord items should
model AttendanceRecord as an entity, not a value object).
OPERATIONAL CONSIDERATIONS
Value objects simplify operations because they are immutable and self-
validating — an entity containing only value objects (and ID references) cannot
enter an invalid state through field mutation. Debugging is easier because
value object toString() produces a readable representation (Money.toString() =
"100.00 INR"). Logging value objects (e.g., logging a Money amount in a
transaction log) is safe because they are immutable — the logged value does not
change. The quarterly architecture scorecard audits value object rule
compliance via ArchUnit reports.
RISKS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 50

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk            | Likelihood | Impact | Mitigation         |
| --------------- | ---------- | ------ | ------------------ |
| Value object    | High       | Medium | Code generation    |
| boilerplate     |            |        | templates; preone- |
| discourages     |            |        | domain-values      |
| engineers from  |            |        | library for        |
| creating them   |            |        | common cases;      |
code review
enforces value
object usage for
domain concepts
| Value object      | Medium | Medium | Limit               |
| ----------------- | ------ | ------ | ------------------- |
| collections       |        |        | @ElementCollecti    |
| (@ElementCollecti |        |        | on to small         |
| on) have          |        |        | collections (<100   |
| performance       |        |        | items); use         |
| issues at scale   |        |        | entities for large  |
collections;
quarterly review
of collection sizes
| Jackson           | Low | High | Value object       |
| ----------------- | --- | ---- | ------------------ |
| serialisation of  |     |      | format is part of  |
| value objects     |     |      | the API contract;  |
| breaks backward   |     |      | format changes     |
| compatibility if  |     |      | require API        |
| format changes    |     |      | versioning per     |
ADR-092
| Engineers put        | Medium | Low | Code review;         |
| -------------------- | ------ | --- | -------------------- |
| domain logic in      |        |     | value objects        |
| value objects that   |        |     | contain logic that   |
| belongs in entities  |        |     | is intrinsic to the  |
| or services          |        |     | value (formatting,   |
arithmetic), not
business workflow
logic
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Invalid states impossible (validate in  Boilerplate (one class per concept)
constructor)
Type safety (Money vs BigDecimal) Learning curve for engineers
| Domain logic in value objects  |     | JPA @Embeddable complexity |     |
| ------------------------------ | --- | -------------------------- | --- |
(Money.add, DateRange.overlaps)
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  51

PreOne ADR - Volume 2: Domain Architecture v3.0
We Gain We Lose
Immutable (thread-safe, no defensive Object allocation cost (10-15% slower
copies) than primitives)
REJECTED ALTERNATIVES
Primitives with service validation (option 2) were the pre-ADR-024 state. Three
production incidents in Q3 2025 traced to primitive-related bugs: a fee of -100
INR created because BigDecimal accepted negative values; an email of
"a@b.com\r\nBcc: spam@x.com" sent spam to 10,000 parents because String
accepted the injection; a Set<BigDecimal> that should have deduplicated fees
grew unbounded because BigDecimal.equals considers scale (100.00 != 100.0).
JSR-303 Bean Validation (option 3) was prototyped: validation ran at field-set
time, which meant invalid values existed transiently and could be observed by
other threads. Lombok @Value (option 4) was rejected because Lombok is
restricted per ADR-011 and because @Value does not validate in the
constructor.
MIGRATION PLAN
Phase 1 (complete): Create preone-domain-values library with Money,
DateRange, EmailAddress, PhoneNumber, Address, Percentage, Quantity,
AggregateRootId. Phase 2 (complete): Pilot in Billing domain — replace
BigDecimal with Money, String with EmailAddress. Phase 3 (complete):
Migrate all 12 domains — 142 value object usages. Phase 4 (complete):
ArchUnit rules enforced in CI. Phase 5 (Q4 2026): Training session for new
engineers on value object pattern (ongoing).
TESTING STRATEGY
Value object rules are tested at three levels. Unit tests: each value object tests
immutability (methods return new instances), validation (constructor throws on
invalid), equality (two instances with same fields are equal), and domain logic
(Money.add, DateRange.overlaps). Property-based tests: value objects have
property tests (e.g., Money.add is commutative, DateRange.overlaps is
symmetric). ArchUnit tests: structural rules (all fields final, no setters,
equals/hashCode by all fields, no @Id field) verified at compile time. Integration
tests: value object persistence (@Embeddable) tested with Testcontainers
PostgreSQL.
MONITORING & OBSERVABILITY
Value objects are not directly observable (they are immutable data). Indirect
metrics: value object construction failure rate (high rate may indicate API input
validation issue), value object allocation rate (for GC tuning — if excessive,
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 52

PreOne ADR - Volume 2: Domain Architecture v3.0
consider pooling for hot value objects). The quarterly architecture scorecard
audits value object rule compliance via ArchUnit reports.
FUTURE EVOLUTION
Two evolutions are likely. First, the preone-domain-values library will grow as
new reusable value objects are identified (e.g., GeoCoordinate for location-
based features). Additions require Foundation Architect review. Second, value
objects may adopt Java 21 records (introduced in Java 16, matured in 21) for
reduced boilerplate — a record is implicitly immutable and has
equals/hashCode by all fields. A future ADR may approve records for value
objects; the current ADR allows records as an implementation choice within the
value object rules. Third, value objects may integrate with Java 21 sealed
interfaces for algebraic data types (e.g., a sealed ContactMethod interface with
EmailAddress, PhoneNumber, Address permits).
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity drives
value object validation)
● ADR-004 — Domain Driven Design (value object is a DDD building
block)
● ADR-008 — SOLID Enforcement (value objects support SRP and
immutability)
● ADR-022 — Aggregate Rules (aggregates contain value objects)
● ADR-023 — Entity Rules (entity IDs are value objects)
● ADR-026 — Repository Pattern (repositories persist entities containing
value objects)
● ADR-029 — Validation (value object constructor validation is the
primary validation layer)
● ADR-039 — Domain Exceptions (value object validation throws domain
exceptions)
● ADR-042 — UUID Strategy (typed IDs are value objects wrapping UUID
v7)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — value object
pattern)
● Upstream PRD: PRD-003-section-4 (Billing domain value objects)
● Downstream ERD: ERD-003 (Billing schema with Money and
DateRange columns)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 53

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Downstream API Spec: API-003 (Billing API uses value objects as
strings)
● Downstream Test Cases: TC-0028..TC-0030 (Value object immutability,
validation, equality tests)
● External: Eric Evans — Domain-Driven Design, Chapter 5 (Value
Objects)
● External: Ward Cunningham — Value Object pattern (Portland Pattern
Repository)
DECISION HISTORY
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2025-10-02 | Draft  | Billing Domain  | Initial draft with 6  |
|            |        | Architect       | rules; expanded to    |
8 after review
| 2025-11-05 | Proposed | Billing Domain  | Submitted to ARB    |
| ---------- | -------- | --------------- | ------------------- |
|            |          | Architect       | after Billing pilot |
| 2025-11-26 | Accepted | ARB Chair       | ARB approved;       |
preone-domain-
values library
created
| 2026-07-22 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added; Java 21
records note
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)     |     |
| ----------- | --- | ------------------------ | --- |
| Tech Lead   |     | Billing Domain Architect |     |
| ARB Chair   |     | ARB Chair                |     |
| Approved On |     | 2026-07-22               |     |
IMPLEMENTATION CHECKLIST
● Create preone-domain-values library with 8 core value objects (Done —
v1.0.0)
● Pilot in Billing domain (Done — 23 value object usages migrated)
● Migrate all 12 domains (Done — 142 value object usages, 47 value
object classes)
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  54

PreOne ADR - Volume 2: Domain Architecture v3.0
● Add ArchUnit rules: final fields, no setters, equals by all fields, no @Id
(Done — CI gate since V1.4.0)
● Jackson converters for all value objects (Done — registered globally)
● Flyway migrations for @Embeddable columns (Done — V1.4.0)
● Training session for engineers (Done — 4 sessions delivered)
● Quarterly value object rule compliance audit (Done — first audit 2026-
Q1, zero violations)
AD R -025
Domain Services
Volume 2 — Domain Architecture - DDD Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Define the role, placement, and rules for domain services in the PreOne
domain model. A domain service is a stateless operation that does not
naturally belong to a single entity or value object. Domain services live in
the domain layer, have no dependencies on infrastructure, and are invoked
by application services. They encapsulate cross-entity business logic that
cannot be placed in a single aggregate.
STATUS
Status Accepted
Date Decided 2025-12-03
Decision Owner Domain Architect — Billing
Review Cadence Annual or on domain service
proliferation
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 55

PreOne ADR - Volume 2: Domain Architecture v3.0
Before ADR-025, PreOne engineers placed business logic in three ad-hoc
locations: (1) static utility classes (BillingUtils.calculateFee), (2) Spring
@Service beans in the application layer (FeeCalculationService), and (3) entity
methods that reached across aggregates (Enrollment.computeBilling() which
loaded Fee, Discount, and Tax aggregates). The result was scattered business
logic that was hard to find, hard to test, and hard to govern. A change to the
GST calculation required touching 7 places because the logic was duplicated.
The Billing Domain Architect led a 3-week refactoring to extract domain
services for cross-aggregate logic. The FeeCalculationService was split into
FeeCalculationDomainService (pure domain logic, no Spring, no
infrastructure) and FeeCalculationApplicationService (orchestrates repository
calls, invokes the domain service). The GST calculation moved into a
TaxDomainService. After refactoring, the GST calculation existed in exactly one
place. This ADR codifies the rules for domain services across all 12 domains.
ArchUnit tests verify that domain services are stateless, have no infrastructure
dependencies, and live in the domain layer.
BUSINESS DRIVERS
The primary driver is logical centralisation: business logic that spans
aggregates must live in exactly one place. Without domain services, the logic is
either duplicated (in multiple application services) or misplaced (in entity
methods that violate aggregate boundaries). The secondary driver is testability:
domain services are pure functions (no I/O, no Spring context), so they can be
unit-tested without mocks or Testcontainers. The tertiary driver is domain
richness: domain services push business logic into the domain layer (per
ADR-003 Clean Architecture), keeping the application layer thin. A fourth
driver is reusability: a domain service like TaxDomainService can be invoked by
multiple application services (FeeCalculation, InvoiceGeneration,
RefundProcessing) without duplication. This reduces the surface area for tax-
calculation bugs.
PROBLEM STATEMENT
PreOne's cross-aggregate business logic is scattered across utility classes,
application services, and entity methods, causing duplication, poor testability,
and governance gaps. We must define domain service rules that centralise pure
domain logic in the domain layer, aligned with DDD principles.
CONSTRAINTS
● Domain services are stateless (no instance fields, no Spring @Service
annotation)
● Domain services have no infrastructure dependencies (no Repository,
no Gateway, no EventPublisher)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 56

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Domain services live in the domain layer (package:
com.preone.<domain>.domain.service)
● Domain services contain only pure domain logic (no I/O, no side effects)
● Domain services are invoked by application services, not by entities or
other domain services directly
ASSUMPTIONS
● Cross-aggregate business logic exists and cannot always be placed in a
single aggregate
● Engineers can identify when logic belongs in a domain service vs an
entity method vs an application service
● Pure functions (no side effects) are testable and reusable
● Spring's @Service annotation is for application services, not domain
services (cultural distinction)
● Domain services do not need transaction management (they are pure;
transactions are managed by application services)
OPTIONS CONSIDERED
| Option              | Pros                | Cons                  | Verdict |
| ------------------- | ------------------- | --------------------- | ------- |
| Pure domain         | Aligns with DDD     | Requires              | Chosen  |
| services in domain  | and Clean           | discipline to keep    |         |
| layer, no           | Architecture; pure  | domain services       |         |
| infrastructure      | functions are       | pure; engineers       |         |
| (chosen)            | testable;           | may be tempted to     |         |
|                     | centralises cross-  | inject repositories;  |         |
|                     | aggregate logic;    | cultural shift from   |         |
|                     | no Spring           | @Service-             |         |
|                     | dependency in       | everywhere.           |         |
domain layer.
| Spring @Service  | Familiar to Spring  | Mixes domain     | Rejected |
| ---------------- | ------------------- | ---------------- | -------- |
| beans for all    | developers; DI for  | logic with       |          |
| business logic   | repositories and    | infrastructure;  |          |
| (pre-ADR-025     | other beans;        | hard to test     |          |
| state)           | simple model.       | without Spring   |          |
context; logic
scattered across
@Service beans;
violates Clean
Architecture.
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  57

PreOne ADR - Volume 2: Domain Architecture v3.0
Option Pros Cons Verdict
Static utility No instantiation; No polymorphism Rejected
classes for cross- simple to call; no (cannot override
aggregate logic DI needed. for testing); static
methods are a
global namespace;
cannot implement
interfaces; pre-
ADR-025 state for
some logic.
Entity methods Object-oriented; Violates aggregate Rejected
that reach across logic is close to boundaries
aggregates data. (ADR-022);
entities load other
aggregates; tight
coupling; hard to
test.
DECISION
ADOPTED
Adopt the following domain service rules enforced via ArchUnit: (1) Domain
services are classes in the domain layer
(com.preone.<domain>.domain.service package). (2) Domain services are
stateless — no instance fields; all state is passed as method parameters. (3)
Domain services have no Spring annotations (@Service, @Component,
@Autowired prohibited). (4) Domain services have no infrastructure
dependencies — no Repository, no Gateway, no EventPublisher, no @Value
injection. (5) Domain services contain only pure domain logic — no I/O, no
side effects, no exception handling for infrastructure failures. (6) Domain
services are invoked by application services, which manage transactions
and infrastructure. (7) Domain services may depend on other domain
services (via constructor injection at the application layer, passed as
method parameters). (8) Domain services implement interfaces (for
testability and substitution).
DETAILED RATIONALE
The chosen option is the only one that produces a clean separation between
domain logic and infrastructure. Spring @Service beans (option 2) were the
pre-ADR-025 state and produced the testability and duplication problems that
motivated this ADR. Static utility classes (option 3) prevent polymorphism and
testing substitution — a FeeCalculationUtils.calculate() cannot be mocked for
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 58

PreOne ADR - Volume 2: Domain Architecture v3.0
testing a higher-level service. Entity methods reaching across aggregates
(option 4) violate ADR-022 (Aggregate Rules) and produce tight coupling. Rule
(1) — domain layer placement — ensures domain services are part of the
domain model, not the application infrastructure. The package convention
(com.preone.<domain>.domain.service) makes domain services discoverable
and enforces the layering rule (ADR-006): the domain layer has no inward
dependencies. ArchUnit verifies that classes in the domain.service package do
not import from infrastructure or application packages. Rule (2) —
statelessness — means domain services are pure functions. A domain service
method like TaxDomainService.calculateGST(Money amount, GSTCategory
category) takes all inputs as parameters and returns the result, modifying no
state. This makes the method deterministic, thread-safe, and trivially testable.
Stateless services can be singletons (one instance per JVM) without
synchronisation concerns. Rule (3) — no Spring annotations — is the cultural
distinction. Spring @Service is for application services (which need DI for
repositories, event publishers, etc.); domain services do not need DI because
they have no dependencies. The absence of @Service is enforced by ArchUnit.
Application services instantiate domain services via constructor injection (the
application service has @Service, the domain service is a plain class passed to
its constructor). Rule (4) — no infrastructure dependencies — is the core rule.
A domain service that injects a Repository is no longer pure — it depends on I/O.
ArchUnit verifies that domain service classes do not import Repository,
Gateway, EventPublisher, or any infrastructure class. This rule is what makes
domain services unit-testable without mocks: there is nothing to mock. Rule (5)
— pure domain logic — means domain services do not handle infrastructure
exceptions. A domain service method like
FeeCalculationDomainService.calculate() does not catch SQLException or
HttpClientException — those are infrastructure concerns handled by the
application service. Domain services throw only domain exceptions (ADR-039)
for business rule violations (e.g., NegativeAmountException). Rule (6) —
invoked by application services — establishes the layering. The application
service loads aggregates from repositories, invokes the domain service with the
loaded data, and saves the results. The domain service never loads or saves — it
only computes. This separation makes the domain service reusable: the same
FeeCalculationDomainService can be invoked by a web request handler, a
batch job, or a CLI tool, with different application services managing the I/O.
Rule (7) — domain services may depend on other domain services — allows
composition. A FeeCalculationDomainService may invoke a TaxDomainService
and a DiscountDomainService. The dependency is via constructor injection at
the application layer: the application service constructs the
FeeCalculationDomainService with its dependencies. This keeps the domain
layer dependency-free (no Spring DI) while allowing domain service
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 59

PreOne ADR - Volume 2: Domain Architecture v3.0
composition. Rule (8) — interfaces for testability — allows substitution in tests.
A FeeCalculationDomainService implements IFeeCalculationDomainService; a
test can substitute a mock or stub for unit testing higher-level services. The
interface is in the domain layer; the implementation is also in the domain layer.
This is not dependency inversion (DIP in ADR-008) — it is interface-based
design for testability.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Domain Service Rules
| | | | Domain Layer (no infrastructure)
| | +----------------------------------------------------------+ | | |
com.preone.billing.domain.service | | | |
| | | | +---------------------+ +---------------------+ | | | | | FeeCalculation | |
Tax | | | | | | DomainService |-->| DomainService | |
| | | |---------------------| |---------------------| | | | | | (no fields) | | (no fields)
| | | | | | +calculate( | | +calculateGST( | | | | | |
enrollment, | | amount, category) | | | | | | feeStructure) | | :
Money | | | | | | : Money | |---------------------| | | | |
+---------------------| | (no @Service) | | | | | | (no @Service) | | (no
Repository) | | | | | | (no Repository) | +---------------------+ | | | |
+---------------------+ | | |
+----------------------------------------------------------+ | | ^
| | | invokes | | Application Layer |
| | +----------------------------------------------------------+ | | |
com.preone.billing.application | | | | +---------------------+
| | | | | FeeCalculation | @Service | | | | | AppService
| - feeRepo: Repository | | | | |---------------------| - feeDomainSvc:
FeeDomainSvc | | | | | +calculateFee( | - eventBus: EventBus | |
| | | enrollmentId) | - @Transactional | | | | +---------------------+
| | | | (loads aggregates, invokes domain svc, saves, publishes)| | |
+----------------------------------------------------------+ | |
| | ArchUnit: | | - domain.service classes: no
instance fields | | - domain.service classes: no @Service/@Component
| | - domain.service classes: no Repository/Gateway imports |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
App Service Domain Service Aggregate (loaded) DB | |
| | |--calculateFee----->| | | | (enrollmentId)
| | | | | | | | (load
aggregates first) | | |--load enrollment-->| |
| |<--enrollment-------| | | |--load feeStructure----
repo---------------->|---------------->| |<--feeStructure-----| |<--
row-----------| | | | | | (now invoke pure
domain logic) | | |--feeDomainSvc.calculate(enrollment, fee)--
>| | | | | | | |--pure
computation | | | | (no I/O, no state) | | |
| --uses value objs | | | | --returns Money | |
| |<--fee amount--------| | | | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 60

PreOne ADR - Volume 2: Domain Architecture v3.0
| |<--fee amount-------| | | | | |
| | (save result, publish event) | | |--save fee---------->|
| | |--publish event----->| | | | |
| | |<--done-------------| | |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Domain Service vs Application
Service | | | | Domain Layer
(pure, no infra) | | +-----------------------+ +-----------------------+ |
| | IFeeCalculation | | FeeCalculation | | | | DomainService |<--|
DomainService | | | | (interface) | | (impl, no @Service) | | |
+-----------------------+ +-----------------------+ | | ^ ^
| | | implements | depends on | | | |
(constructor) | | +----------+----------+ | | | | (mock for
testing) | +--------+---------+ | | +---------------------+ |
ITaxDomainService| | | +------------------+ | |
| | Application Layer (infra-aware) | | +-----------------------+
+-----------------------+ | | | FeeCalculation | | FeeRepository | | | |
AppService |-->| (infrastructure) | | | | (@Service) |
+-----------------------+ | | | - feeRepo | | | | -
feeDomainSvc | +-----------------------+ | | | - eventBus |-->| EventBus
(infra) | | | +-----------------------+ +-----------------------+ | |
| | Invocation flow: | | AppService.load() ->
DomainService.calculate() -> AppService.save() |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Command: calculateFee(enrollmentId) | v +----+-----+ | App Svc |
@Service, @Transactional +----+-----+ | |--load Enrollment aggregate
from repo |--load FeeStructure aggregate from repo | v +----+-----+
| Domain | pure function, no I/O | Service | --
FeeCalculationDomainService.calculate() +----+-----+ | |--uses
Enrollment, FeeStructure (value objects/entities) |--invokes
TaxDomainService.calculateGST() (another domain svc) |--invokes
DiscountDomainService.apply() (another domain svc) | v +----+-----+ |
Money | (result, immutable value object) +----+-----+ | v +----+-----+
| App Svc | --save Fee aggregate via repo | | --publish FeeCalculated
event +----+-----+ | v +----+-----+ | DB + | --INSERT fee row |
EventBus| --publish event for subscribers +----------+
DATABASE IMPACT
Domain services have no direct database impact — they do not touch the
database. The database is accessed only by repositories (invoked by application
services). However, domain services constrain how business logic is organised,
which indirectly affects the database: complex calculations that were
previously performed in SQL (e.g., a GST calculation in a stored procedure)
now live in domain services, making the database a pure data store. This
simplifies the schema (no computed columns, no triggers for business logic)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 61

PreOne ADR - Volume 2: Domain Architecture v3.0
and improves testability (business logic is testable without a database). Flyway
migrations do not create stored procedures for business logic; ArchUnit verifies
that no business-logic stored procedures exist.
API IMPACT
Domain services are not directly exposed via the API. The API calls application
services, which invoke domain services. This keeps the API surface stable — a
refactoring that moves logic between domain services does not change the API.
The API request and response formats are defined by application services
(DTOs) and value objects, not by domain service method signatures. This
decoupling allows the domain service layer to evolve without API breaking
changes.
UI IMPACT
Domain services have no direct UI impact. The UI calls API endpoints, which
call application services, which call domain services. The UI does not know
about domain services. However, the centralisation of business logic in domain
services means that UI-driven feature changes (e.g., a new discount type)
require a domain service change, which is reviewed by the Domain Architect —
this prevents ad-hoc UI features from bypassing business rules.
SECURITY IMPACT
Domain services improve security by centralising business logic that may have
security implications. For example, a RefundDomainService that calculates
refund amounts enforces the 'no refund after 30 days' rule in one place; an
attacker cannot bypass this rule by invoking a different code path. Domain
services are pure functions, so they do not have injection vulnerabilities (no
SQL, no HTTP). However, domain services must validate their inputs (e.g., a
Money parameter must be non-null, non-negative) — this validation is the
responsibility of the domain service method, not the caller.
PERFORMANCE IMPACT
Domain services have minimal performance overhead — they are method calls
on plain objects. The statelessness allows singleton instantiation (one instance
per JVM), avoiding allocation per call. The purity (no I/O) means domain service
methods are fast (microseconds for typical calculations). The indirection
(AppService → DomainService → result) adds one method call, which is
negligible. Overall, domain services have no measurable performance impact
vs inline logic.
SCALABILITY ANALYSIS
Domain services scale linearly — they are stateless and can be invoked
concurrently without synchronisation. The singleton pattern (one instance per
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 62

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
JVM) means no allocation pressure. If PreOne adopts horizontal scaling
(multiple application instances), each instance has its own domain service
singletons, with no coordination needed (domain services are stateless). The
bottleneck is never the domain service; it is always the infrastructure
(database, network) invoked by the application service.
OPERATIONAL CONSIDERATIONS
Domain services are not directly observable (they are pure functions with no
side effects). Indirect observability comes from the application service that
invokes them: the application service logs the input, output, and duration of the
domain service call. Metrics (e.g., fee_calculation_duration_seconds) are
emitted by the application service, tagged with the domain service name. The
quarterly architecture scorecard audits domain service rule compliance
(statelessness, no infrastructure dependencies) via ArchUnit reports.
RISKS
| Risk               | Likelihood | Impact | Mitigation         |
| ------------------ | ---------- | ------ | ------------------ |
| Engineers inject   | Medium     | High   | ArchUnit rule      |
| repositories into  |            |        | blocks Repository  |
| domain services,   |            |        | imports in         |
| violating purity   |            |        | domain.service     |
package; code
review checklist;
training
| Domain services  | Medium | Medium | Quarterly review   |
| ---------------- | ------ | ------ | ------------------ |
| proliferate,     |        |        | of domain service  |
| becoming a       |        |        | count per domain;  |
| dumping ground   |        |        | Domain Architect   |
| for logic        |        |        | enforces           |
necessity; prefer
entity methods
when logic
belongs to one
aggregate
| Domain service     | High | Low | Accept the            |
| ------------------ | ---- | --- | --------------------- |
| interfaces create  |      |     | boilerplate as the    |
| boilerplate        |      |     | cost of testability;  |
| (interface + impl  |      |     | code generation       |
| per service)       |      |     | template provided     |
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  63

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk             | Likelihood | Impact | Mitigation        |
| ---------------- | ---------- | ------ | ----------------- |
| Domain services  | Low        | Medium | ArchUnit detects  |
| depend on each   |            |        | circular          |
| other circularly |            |        | dependencies;     |
code review
enforces DAG
structure; domain
service
composition is
reviewed by
Domain Architect
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Pure, testable business logic (no mocks  Boilerplate (interface + impl per
| needed) |     | domain service) |     |
| ------- | --- | --------------- | --- |
Centralised cross-aggregate logic (one  Cultural shift from @Service-
| place) |     | everywhere |     |
| ------ | --- | ---------- | --- |
Domain layer has no infrastructure  Engineers must learn the
| (Clean Architecture) |     | domain/application service distinction |     |
| -------------------- | --- | -------------------------------------- | --- |
Reusable across application services  Indirection (AppService →
| (web, batch, CLI) |     | DomainService → result) |     |
| ----------------- | --- | ----------------------- | --- |
REJECTED ALTERNATIVES
Spring @Service beans (option 2) were the pre-ADR-025 state. Three issues
motivated this ADR: (1) a GST calculation change required touching 7 @Service
beans because the logic was duplicated; (2) unit testing a @Service bean
required a Spring context (5-second startup) or extensive Mockito mocking
(brittle); (3) the domain layer had infrastructure imports, violating Clean
Architecture (ADR-003). Static utility classes (option 3) were used for some
logic (BillingUtils.calculateFee) but prevented polymorphism — a test could not
substitute a mock BillingUtils. Entity methods reaching across aggregates
(option 4) were used in Enrollment.computeBilling() which loaded Fee,
Discount, and Tax aggregates, producing a 120ms transaction (vs 24ms after
refactoring to domain services).
MIGRATION PLAN
Phase 1 (complete): Identify cross-aggregate logic in all 12 domains. Phase 2
(complete): Extract domain services — 47 domain services created across 12
domains. Phase 3 (complete): Refactor application services to invoke domain
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  64

PreOne ADR - Volume 2: Domain Architecture v3.0
services. Phase 4 (complete): ArchUnit rules enforced in CI. Phase 5 (Q4 2026):
Training session for new engineers on domain service pattern (ongoing).
TESTING STRATEGY
Domain service rules are tested at three levels. Unit tests: each domain service
method is tested with pure unit tests (no Spring, no mocks) — inputs are value
objects and entities, output is a value object or entity. Property-based tests:
pure functions lend themselves to property testing (e.g.,
TaxDomainService.calculateGST is monotonic — higher amount yields higher
GST). ArchUnit tests: structural rules (no instance fields, no @Service, no
Repository imports) verified at compile time. Integration tests: domain services
are invoked through application services in integration tests with
Testcontainers PostgreSQL.
MONITORING & OBSERVABILITY
Domain services are not directly observable. Indirect metrics: domain service
invocation count and duration (emitted by application services), domain service
exception count (should be zero in steady state — exceptions indicate invariant
violations or input validation failures). The quarterly architecture scorecard
audits domain service count per domain (target: 3-8 domain services per
domain; too few suggests logic is misplaced in entities, too many suggests over-
engineering).
FUTURE EVOLUTION
Two evolutions are likely. First, Java 21 records may be adopted for domain
service method parameters and return types (algebraic data types for domain
concepts). Second, domain services may be exposed as pure functions (static
methods) if statelessness is universal — but the interface pattern is retained for
testability. Third, if PreOne adopts a rules engine (ADR-030 Business Rule
Engine), some domain service logic may migrate to declarative rules; the
domain service remains the host for the rules engine invocation.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P5 Simplicity drives
centralisation)
● ADR-003 — Clean Architecture (domain layer has no infrastructure)
● ADR-004 — Domain Driven Design (domain service is a DDD building
block)
● ADR-006 — Layering Rules (domain services live in domain layer)
● ADR-007 — Dependency Rule (domain services depend only on domain)
● ADR-008 — SOLID Enforcement (SRP: one domain service per business
concept)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 65

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● ADR-022 — Aggregate Rules (domain services span aggregates without
violating boundaries)
● ADR-026 — Repository Pattern (repositories are invoked by app
services, not domain services)
● ADR-028 — Application Services (app services invoke domain services)
● ADR-030 — Business Rule Engine (future host for declarative rules)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — domain service
pattern)
● Upstream PRD: PRD-003-section-5 (Billing domain services)
● Downstream ERD: ERD-003 (Billing schema — no stored procedures for
business logic)
● Downstream API Spec: API-003 (Billing API invokes app services which
invoke domain services)
● Downstream Test Cases: TC-0031..TC-0033 (Domain service purity,
statelessness, correctness tests)
● External: Eric Evans — Domain-Driven Design, Chapter 5 (Services)
● External: Vaughn Vernon — Implementing DDD, Chapter 5 (Domain
Services)
DECISION HISTORY
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2025-10-10 | Draft  | Billing Domain  | Initial draft with 5  |
|            |        | Architect       | rules; expanded to    |
8 after review
| 2025-11-12 | Proposed | Billing Domain  | Submitted to ARB    |
| ---------- | -------- | --------------- | ------------------- |
|            |          | Architect       | after Billing pilot |
| 2025-12-03 | Accepted | ARB Chair       | ARB approved; 47    |
domain services
created
| 2026-07-24 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect |     | Chief Architect (AR) |     |
| --------- | --- | -------------------- | --- |
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  66

PreOne ADR - Volume 2: Domain Architecture v3.0
Tech Lead Billing Domain Architect
ARB Chair ARB Chair
Approved On 2026-07-24
IMPLEMENTATION CHECKLIST
● Identify cross-aggregate logic in all 12 domains (Done — 47 services
identified)
● Extract domain services with interfaces (Done — 47 interfaces + impls
created)
● Refactor application services to invoke domain services (Done — PR
#4701)
● ArchUnit rules: no fields, no @Service, no Repository imports (Done —
CI gate since V1.5.0)
● Remove legacy static utility classes (Done — 12 utils removed)
● Remove entity methods reaching across aggregates (Done — 8 methods
refactored)
● Training session for engineers (Done — 4 sessions delivered)
● Quarterly domain service count audit (Done — first audit 2026-Q1)
AD R -026
Repository Pattern
Volume 2 — Domain Architecture - DDD Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Define the rules for repositories in the PreOne domain model. A repository
is an abstraction over persistence for an aggregate root, providing methods
like findById, save, and findByCriteria. Repositories are interfaces defined
in the domain layer and implemented in the infrastructure layer using
Spring Data JPA. Only aggregate roots have repositories; child entities are
accessed via the root.
STATUS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 67

PreOne ADR - Volume 2: Domain Architecture v3.0
Status Accepted
Date Decided 2025-12-10
Decision Owner Domain Architect — Student
Review Cadence Annual or on persistence strategy
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-026, PreOne used Spring Data JPA repositories directly in
application services, with no domain-layer interface. The StudentRepository
interface lived in the infrastructure package and extended
JpaRepository<Student, Long>. This produced three problems. First, the
domain layer depended on infrastructure (Spring Data JPA), violating Clean
Architecture (ADR-003). Second, repositories existed for child entities
(StudentProfileRepository, GuardianLinkRepository), encouraging direct
access to children and bypassing aggregate root invariants (ADR-022). Third,
repository methods returned Page<Entity> and exposed Spring Data types in
the domain layer, leaking infrastructure concerns. The Student Domain
Architect led a 4-week refactoring. The new pattern: a domain-layer repository
interface (StudentRepository) with domain methods (findById(StudentId),
save(Student), findByBranchId(BranchId, PageRequest)), and an
infrastructure-layer implementation (StudentRepositoryImpl extends
JpaRepository). The domain interface has no Spring Data types; pagination is
via a domain PageRequest value object. Child entity repositories
(StudentProfileRepository) were removed; profiles are accessed via
student.getProfile(). This ADR codifies the rules for repositories across all 12
domains. ArchUnit tests verify that repository interfaces are in the domain
layer, have no Spring Data types, and that only aggregate roots have
repositories.
BUSINESS DRIVERS
The primary driver is layering purity: the domain layer must not depend on
infrastructure (Spring Data JPA, Hibernate, PostgreSQL). The repository
interface is a domain-layer abstraction; the implementation is infrastructure.
This allows the domain layer to be tested without a database and allows the
persistence technology to change without domain changes. The secondary
driver is aggregate boundary enforcement: only aggregate roots have
repositories, preventing direct access to child entities and ensuring the root's
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 68

PreOne ADR - Volume 2: Domain Architecture v3.0
invariants are always enforced. The tertiary driver is domain expressiveness:
domain-layer repository methods use domain types (StudentId, BranchId) not
infrastructure types (Long, String). A fourth driver is testability: the domain-
layer interface can be mocked for unit testing application services, without a
Spring context or database. This makes application service tests fast
(milliseconds, not seconds) and reliable (no flaky database interactions).
PROBLEM STATEMENT
PreOne's repositories are infrastructure-layer interfaces that leak Spring Data
types into the domain, violate aggregate boundaries by providing child entity
access, and prevent domain-layer unit testing. We must define repository rules
that establish domain-layer interfaces, infrastructure-layer implementations,
and aggregate-root-only access.
CONSTRAINTS
● Repository interfaces are defined in the domain layer
(com.preone.<domain>.domain.repository)
● Repository interfaces have no Spring Data or JPA types (no Page, no
Sort, no JpaRepository)
● Only aggregate roots have repositories; child entities do not
● Repository methods use domain types (typed IDs, value objects, domain
PageRequest)
● Repository implementations are in the infrastructure layer
(com.preone.<domain>.infrastructure.repository)
ASSUMPTIONS
● Spring Data JPA can be wrapped behind a domain interface without
significant boilerplate
● The performance overhead of the wrapper (delegation) is negligible
● Engineers will accept the discipline of defining a domain interface and
an infrastructure implementation
● Domain-layer PageRequest is sufficient for all pagination needs (no
need for Spring Data's full Sort/Direction API)
● Custom queries (JPQL, native SQL) are encapsulated in the
infrastructure implementation, not exposed in the domain interface
OPTIONS CONSIDERED
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 69

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Option             | Pros              | Cons               | Verdict |
| ------------------ | ----------------- | ------------------ | ------- |
| Domain-layer       | Clean             | Boilerplate        | Chosen  |
| interface + infra- | Architecture      | (interface + impl  |         |
| layer impl         | compliance;       | per repository);   |         |
| (chosen)           | domain layer      | delegation         |         |
|                    | testable without  | overhead;          |         |
|                    | DB; aggregate     | engineers must     |         |
|                    | boundary          | learn the pattern. |         |
enforced; domain
types preserved;
persistence
swappable.
| Spring Data JPA      | Minimal             | Domain depends      | Rejected |
| -------------------- | ------------------- | ------------------- | -------- |
| interfaces directly  | boilerplate;        | on infrastructure;  |          |
| in domain (pre-      | familiar to Spring  | cannot unit test    |          |
| ADR-026 state)       | developers;         | domain without      |          |
|                      | Spring Data         | DB; child entity    |          |
|                      | features (query     | repos violate       |          |
|                      | methods,            | aggregate           |          |
|                      | Pageable) directly  | boundaries;         |          |
|                      | available.          | Spring Data types   |          |
leak into domain.
| Generic        | Minimal              | Cannot express     | Rejected |
| -------------- | -------------------- | ------------------ | -------- |
| Repository<T,  | boilerplate; one     | domain-specific    |          |
| ID> interface  | interface for all    | query methods      |          |
|                | entities; type-safe. | (findByBranchId);  |          |
loses domain
expressiveness;
generic interfaces
are anti-pattern in
DDD.
| Active Record      | No separate         | Entity depends on     | Rejected |
| ------------------ | ------------------- | --------------------- | -------- |
| pattern            | repository;         | infrastructure        |          |
| (entity.save(),    | methods on entity;  | (static repository);  |          |
| entity.findById()) | simple model.       | violates DDD          |          |
(entities are
persistence-
ignorant); hard to
test without DB;
tight coupling.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  70

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following repository rules enforced via ArchUnit: (1) Repository
interfaces are in the domain layer
(com.preone.<domain>.domain.repository package). (2) Repository
interfaces extend a marker DomainRepository interface (no Spring Data
inheritance). (3) Repository interfaces have no Spring Data or JPA types —
pagination via domain PageRequest, sorting via domain SortOrder, results
via domain Page<T>. (4) Only aggregate roots have repositories —
ArchUnit verifies that classes annotated @AggregateRoot have a
corresponding repository interface. (5) Repository implementations are in
the infrastructure layer (com.preone.<domain>.infrastructure.repository
package) and extend JpaRepository (or SimpleJpaRepository). (6)
Repository methods use domain types — IDs are typed (StudentId), criteria
are value objects, results are entities or domain Page<T>. (7) Custom
queries (JPQL, native SQL) are encapsulated in the infrastructure
implementation; the domain interface exposes only domain-meaningful
methods.
DETAILED RATIONALE
The chosen option is the only one that produces Clean Architecture compliance
and aggregate boundary enforcement. Spring Data JPA interfaces in the
domain (option 2) were the pre-ADR-026 state and produced the layering and
testing problems that motivated this ADR. Generic Repository<T, ID> (option
3) loses domain expressiveness — a method findByBranchId is more meaningful
than a generic findById with a criterion object. Active Record (option 4) couples
entities to infrastructure, violating DDD's persistence ignorance principle.
Rule (1) — domain layer placement — ensures the repository contract is owned
by the domain, not the infrastructure. The package convention
(com.preone.<domain>.domain.repository) makes repository interfaces
discoverable and enforces the layering rule (ADR-006): the domain layer has no
inward dependencies. ArchUnit verifies that repository interfaces in the
domain.repository package do not import from infrastructure packages. Rule
(2) — marker interface, no Spring Data inheritance — means the domain
interface extends DomainRepository (a marker) not JpaRepository. This
decouples the domain from Spring Data; the implementation can use Spring
Data, but the domain does not know. The DomainRepository marker is in the
preone-domain library and has no methods. Rule (3) — no Spring Data types —
means the domain interface uses domain PageRequest, domain SortOrder, and
domain Page<T> instead of Spring's Pageable, Sort, and Page<T>. These
domain types are value objects (per ADR-024) with the same semantics as
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 71

PreOne ADR - Volume 2: Domain Architecture v3.0
Spring's types but without the Spring dependency. The infrastructure
implementation converts between domain and Spring types. Rule (4) — only
aggregate roots have repositories — is the core aggregate boundary
enforcement. ArchUnit verifies that for every class annotated @AggregateRoot,
there is a corresponding repository interface in the domain.repository package.
Conversely, for every repository interface, there is a corresponding
@AggregateRoot class. Child entities (not annotated @AggregateRoot) do not
have repositories. This forces all access to children via the root, ensuring the
root's invariants are enforced. Rule (5) — infrastructure implementation —
means the actual database access is in the infrastructure layer. The
implementation class (StudentRepositoryImpl) extends
JpaRepository<StudentEntity, UUID> (note: StudentEntity, not Student — the
infrastructure layer maps between domain Student and persistence
StudentEntity per the double-entity pattern in ADR-006). The implementation
delegates to Spring Data methods (findAll, save) and adds custom queries
(findByBranchId via JPQL). Rule (6) — domain types in methods — means the
domain interface uses StudentId (typed ID per ADR-023), not UUID or Long.
The infrastructure implementation converts StudentId to UUID for the
JpaRepository call. This preserves type safety through the stack: a method
expecting StudentId will not accept EnrollmentId, even at the repository layer.
Rule (7) — custom queries encapsulated — means the domain interface exposes
only domain-meaningful methods (findByBranchId, findActiveEnrollments), not
generic query methods (findByCriteria with a specification). Custom JPQL or
native SQL is in the infrastructure implementation, behind a domain method.
This keeps the domain interface clean and forces query design to be intentional
— every query method in the domain interface is a deliberate decision,
reviewed by the Domain Architect.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Repository Pattern
Rules | | | | Domain
Layer (no infra types) | |
+----------------------------------------------------------+ | | |
com.preone.student.domain.repository | | | |
| | | | <<interface>> | | | | StudentRepository
extends DomainRepository | | | | + findById(StudentId):
Optional<Student> | | | | + save(Student): Student
| | | | + findByBranchId(BranchId, PageRequest): Page<Student> | | | | +
findActiveByBranch(BranchId): List<Student> | | | | (NO Spring Data
types: no Pageable, no Sort, no Page<T>)| | |
+----------------------------------------------------------+ | | ^
| | | implements | | |
| | Infrastructure Layer | | |
+----------------------------------------------------------+ | | |
com.preone.student.infrastructure.repository | | | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 72

PreOne ADR - Volume 2: Domain Architecture v3.0
| | | | StudentRepositoryImpl extends JpaRepository<StudentEntity,UUID> | |
| + findById(StudentId) { | | | | return em.find(...)
| | | | } | | | | + save(Student) {
| | | | em.persist(toEntity(student)) | | | | }
| | | | + findByBranchId(BranchId, PageRequest) { | | | | // JPQL
query, convert Page<StudentEntity> to Page<Student> | | | }
| | | | (uses Spring Data, JPA, Hibernate) | | |
+----------------------------------------------------------+ | |
| | ArchUnit: | | - domain.repository interfaces:
no Spring Data imports | | - Only @AggregateRoot classes have repositories
| | - Repository impls in infrastructure layer |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
App Service StudentRepository StudentRepositoryImpl DB |
| | | |--findById(id)----->| | |
| (StudentId) | | | | |--
findById(id)--------->| | | | |--em.find(uuid)-
>| | | |<--row------------| | |
| | | | |--toDomain(entity)| |
|<--Optional<Student>----| | |<--Optional--------| |
| | | | | | (save flow) |
| | |--save(student)---->| | | |
|--save(student)-------->| | | | |--
toEntity(student)| | | |--em.persist---->| |
| |<--ok------------| | | |--check version |
| | | (optimistic lock)| | |<--saved
student--------| | |<--saved------------| | |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Repository Pattern: Domain
Interface + Infra Impl | | | | Domain
Layer | | +---------------------+ +---------------------+
| | | StudentRepository | | PageRequest (VO) | | | | (interface)
|--------| - page, size, sort | | | | extends DomainRepo | +---------------------+
| | +---------+-----------+ | | ^
| | | uses | | +---------+-----------+
+---------------------+ | | | App Service | | Page<T> (domain) | | | |
(@Service) |--------| - content, total | | | +---------------------+
+---------------------+ | | | | Infrastructure
Layer | | +---------------------+ +---------------------+ | | |
StudentRepositoryImpl| | StudentEntity | | | | (@Repository)
|-------| (@Entity, JPA) | | | | extends JpaRepository| +---------------------+
| | +---------------------+ | |
| | Mapping (double-entity pattern per ADR-006): | | Student (domain)
<--toEntity/toDomain--> StudentEntity (infra) | | StudentId (domain VO) <--
UUID--> UUID (infra) | | PageRequest (domain) <--Pageable-->
Pageable (Spring) | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 73

PreOne ADR - Volume 2: Domain Architecture v3.0
App Service call: findById(studentId) | v +----+-----+ | Domain |
StudentRepository (interface, domain layer) | Layer | --no Spring Data types
+----+-----+ | |--calls (polymorphic dispatch) v +----+-----+ | Infra
| StudentRepositoryImpl (Spring Data JPA) | Layer | --extends
JpaRepository<StudentEntity, UUID> +----+-----+ | |--convert StudentId
to UUID |--em.find(StudentEntity, uuid) v +----+-----+ | Hibernate| --
SELECT FROM students WHERE id=? +----+-----+ | v +----+-----+ |
DB Row | --StudentEntity (JPA-managed) +----+-----+ | |--convert
StudentEntity to Student (domain) v +----+-----+ | Domain | Student
(aggregate root, with invariants enforced) | Object | +----------+
DATABASE IMPACT
Repositories are the only gateway to the database for aggregate roots. The
StudentRepositoryImpl maps between domain Student and persistence
StudentEntity (double-entity pattern per ADR-006), preserving the domain
model's purity. Custom queries (JPQL, native SQL) are encapsulated in the
implementation. Flyway migrations are unaware of repositories — they create
tables and indexes; the repository implementation is the application's view of
those tables. ArchUnit verifies that no application service or domain class
directly uses EntityManager or JdbcTemplate — all database access goes
through repository interfaces.
API IMPACT
API endpoints call application services, which call repository interfaces. The
API does not know about repositories directly. However, the repository pattern
affects API pagination: the API accepts page/size parameters, which the
application service converts to a domain PageRequest, which the repository
implementation converts to a Spring Pageable. The API response includes
pagination metadata (totalElements, totalPages) from the domain Page<T>.
This keeps the API contract stable — a change from Spring Data to a different
persistence technology does not affect the API.
UI IMPACT
Repositories have no direct UI impact. The UI calls API endpoints, which call
application services, which call repositories. However, the repository pattern
affects UI pagination: the UI sends page/size parameters via the API, which are
propagated to the repository. The UI displays pagination controls based on the
totalElements metadata. This is a standard pattern and requires no special UI
handling.
SECURITY IMPACT
Repositories are the centralised gateway for database access, which improves
security by enabling consistent access control. The repository implementation
can enforce tenant isolation (filtering by school_id per ADR-043), soft delete
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 74

PreOne ADR - Volume 2: Domain Architecture v3.0
(filtering by deleted_at per ADR-047), and audit logging (per ADR-048).
ArchUnit verifies that no code bypasses repositories to access the database
directly, preventing security bypasses. The repository pattern also enables row-
level security enforcement at a single point (the repository implementation)
rather than scattered across the codebase.
PERFORMANCE IMPACT
The repository pattern adds a delegation layer (domain interface →
infrastructure impl → Spring Data → JPA → database), which has negligible
performance overhead (microseconds per call). The double-entity mapping
(Student ↔ StudentEntity) adds a small allocation cost (one entity per direction)
but enables the domain model to be free of JPA annotations, which is a
significant maintainability benefit. The domain PageRequest → Spring Pageable
conversion is a single object allocation. Overall, the repository pattern has no
measurable performance impact vs direct Spring Data usage.
SCALABILITY ANALYSIS
Repositories scale with the underlying database. The interface adds no
scalability concerns; the implementation delegates to Spring Data, which
delegates to JPA/Hibernate, which delegates to PostgreSQL. Read replicas (per
ADR-041) are handled at the implementation level — the repository
implementation routes reads to a replica and writes to the primary, transparent
to the domain layer. Caching (per ADR-081) is also handled at the
implementation level — the repository implementation checks Redis before
querying the database, transparent to the domain layer.
OPERATIONAL CONSIDERATIONS
Repositories are observable via Micrometer metrics emitted by the
implementation: repository.query.time (per repository method),
repository.query.count (per method), repository.query.error (per method).
Slow queries (>100ms) are logged with the repository method name and
parameters (sanitised). The quarterly architecture scorecard audits repository
rule compliance (domain-layer interface, no Spring Data types, aggregate-root-
only) via ArchUnit reports. Repository method count per domain is tracked —
too many methods (>30) suggests the repository is becoming a god interface
and may need splitting.
RISKS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 75

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation         |
| ------------------ | ---------- | ------ | ------------------ |
| Engineers bypass   | Medium     | High   | ArchUnit blocks    |
| repository         |            |        | EntityManager      |
| interface and use  |            |        | imports outside    |
| EntityManager      |            |        | infrastructure.rep |
| directly           |            |        | ository package;   |
code review;
training
| Repository       | Medium | Medium | Quarterly review  |
| ---------------- | ------ | ------ | ----------------- |
| interface        |        |        | of method count;  |
| accumulates too  |        |        | Domain Architect  |
| many query       |        |        | enforces          |
| methods (god     |        |        | necessity;        |
| interface)       |        |        | consider CQRS     |
read models
(ADR-030) for
complex queries
| Double-entity     | High | Medium | MapStruct for     |
| ----------------- | ---- | ------ | ----------------- |
| mapping (Student  |      |        | boilerplate       |
| ↔ StudentEntity)  |      |        | mapping;          |
| creates           |      |        | quarterly review  |
| maintenance       |      |        | of mapping        |
| burden            |      |        | complexity;       |
consider single-
entity with JPA
annotations if
mapping becomes
unwieldy
| Domain             | Low | Low | Domain              |
| ------------------ | --- | --- | ------------------- |
| PageRequest is     |     |     | PageRequest         |
| insufficient for   |     |     | supports multi-     |
| complex            |     |     | field sort; custom  |
| sorting/filtering  |     |     | criteria value      |
| needs              |     |     | objects for         |
complex queries;
CQRS for read-
heavy use cases
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Clean Architecture (domain layer has  Boilerplate (interface + impl + mapping
| no infrastructure) |     | per repository) |     |
| ------------------ | --- | --------------- | --- |
Domain layer testable without database  Delegation overhead (one extra method
| (mock interface) |     | call) |     |
| ---------------- | --- | ----- | --- |
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  76

PreOne ADR - Volume 2: Domain Architecture v3.0
We Gain We Lose
Aggregate boundary enforced (only Engineers must learn the pattern
roots have repos) (cultural shift)
Persistence swappable (interface is Double-entity mapping complexity
technology-agnostic) (Student ↔ StudentEntity)
REJECTED ALTERNATIVES
Spring Data JPA interfaces in the domain (option 2) were the pre-ADR-026
state. Three issues: (1) unit testing an application service required a Spring
context (5-second startup) because the repository interface extended
JpaRepository, which needed Spring to instantiate; (2) child entity repositories
(StudentProfileRepository) allowed direct access to profiles, bypassing the
Student root's invariants; (3) Spring Data types (Pageable, Sort, Page) leaked
into the domain layer, coupling the domain to Spring Data. Generic
Repository<T, ID> (option 3) was rejected because it lost domain
expressiveness — every query became a generic findByCriteria with a
specification object, which is less readable than findByBranchId. Active Record
(option 4) was rejected because it coupled entities to infrastructure
(Student.save() requires a static repository), violating DDD's persistence
ignorance and making entities hard to test.
MIGRATION PLAN
Phase 1 (complete): Pilot in Student domain — create domain interface,
infrastructure impl, remove child entity repos. Phase 2 (complete): Migrate all
12 domains — 47 repositories refactored. Phase 3 (complete): ArchUnit rules
enforced in CI. Phase 4 (complete): Remove direct EntityManager usage in
application services (moved to repository impls). Phase 5 (Q4 2026): Training
session for new engineers on repository pattern (ongoing).
TESTING STRATEGY
Repository rules are tested at three levels. Unit tests: application services are
unit-tested with mocked repository interfaces (verify the service calls findById,
save correctly). Integration tests: repository implementations are tested with
Testcontainers PostgreSQL (verify the JPQL, mapping, pagination). ArchUnit
tests: structural rules (domain-layer interface, no Spring Data types, only
aggregate roots have repos, no EntityManager outside infrastructure) verified
at compile time. Contract tests: repository implementations conform to the
domain interface contract (every method in the interface has a working
implementation).
MONITORING & OBSERVABILITY
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 77

PreOne ADR - Volume 2: Domain Architecture v3.0
Repository metrics are emitted via Micrometer: repository.query.time (per
method, per repository), repository.query.count (per method),
repository.query.error (per method, by exception type). Slow queries (>100ms)
are logged with method name and parameters. The quarterly architecture
scorecard audits: (a) repository method count per domain (target: <30; >30
triggers review), (b) slow query count per repository (target: <5% of queries),
(c) ArchUnit violation count (target: zero), (d) repository test coverage (target:
>90% on implementation classes).
FUTURE EVOLUTION
Three evolutions are possible. First, CQRS (ADR-030) may split repositories
into command repositories (save, delete) and query repositories (complex
reads) for read-heavy domains — the read side may use a different persistence
technology (e.g., Elasticsearch for search). Second, the double-entity mapping
may be eliminated if a future JPA version supports mapping to non-JPA-
annotated domain objects (currently not supported in Hibernate 6). Third,
repositories may adopt reactive types (Mono, Flux) if PreOne adopts Spring
WebFlux — currently, PreOne uses Spring MVC (blocking), and repositories
return synchronous types.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity via
aggregate root access)
● ADR-003 — Clean Architecture (repository interface in domain, impl in
infra)
● ADR-004 — Domain Driven Design (repository is a DDD building block)
● ADR-006 — Layering Rules (double-entity pattern for JPA isolation)
● ADR-007 — Dependency Rule (domain depends on no infrastructure)
● ADR-022 — Aggregate Rules (only aggregate roots have repositories)
● ADR-023 — Entity Rules (repositories persist entities with typed IDs)
● ADR-024 — Value Objects (repositories use domain PageRequest,
SortOrder)
● ADR-028 — Application Services (app services invoke repositories)
● ADR-030 — CQRS Strategy (read side may use different persistence)
● ADR-041 — PostgreSQL Strategy (underlying database for repositories)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — repository
pattern)
● Upstream PRD: PRD-002-section-4 (Student persistence requirements)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 78

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Downstream ERD: ERD-001 (Student schema accessed by
StudentRepositoryImpl)
● Downstream API Spec: API-001 (Student API uses pagination from
repository)
● Downstream Test Cases: TC-0034..TC-0036 (Repository interface, impl,
mapping tests)
● External: Eric Evans — Domain-Driven Design, Chapter 6
(Repositories)
● External: Spring Data JPA Reference Documentation (underlying
implementation)
DECISION HISTORY
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2025-10-18 | Draft  | Student Domain  | Initial draft with 5  |
|            |        | Architect       | rules; expanded to    |
7 after review
| 2025-11-20 | Proposed | Student Domain  | Submitted to ARB    |
| ---------- | -------- | --------------- | ------------------- |
|            |          | Architect       | after Student pilot |
| 2025-12-10 | Accepted | ARB Chair       | ARB approved; 47    |
repositories
refactored
| 2026-07-26 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 and Vol 3
ADRs added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)     |     |
| ----------- | --- | ------------------------ | --- |
| Tech Lead   |     | Student Domain Architect |     |
| ARB Chair   |     | ARB Chair                |     |
| Approved On |     | 2026-07-26               |     |
IMPLEMENTATION CHECKLIST
● Create domain PageRequest, SortOrder, Page<T> value objects (Done
— preone-domain-values v1.1.0)
● Pilot in Student domain (Done — PR #4801)
● Migrate all 47 repositories to domain interface + infra impl (Done — PR
#4815)
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  79

PreOne ADR - Volume 2: Domain Architecture v3.0
● Remove child entity repositories (Done — 12 child repos removed)
● ArchUnit rules: no Spring Data in domain, only roots have repos (Done
— CI gate since V1.5.0)
● Remove direct EntityManager usage outside infrastructure (Done — PR
#4820)
● MapStruct mappers for double-entity mapping (Done — 47 mappers
created)
● Training session for engineers (Done — 4 sessions delivered)
AD R -027
Domain Events
Volume 2 — Domain Architecture - DDD Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Define the model, publication, and consumption of domain events in the
PreOne platform. A domain event represents something meaningful that
happened in the domain (e.g., StudentEnrolled, FeePaid,
AttendanceMarked). Events are published by aggregates after state
changes, persisted via the outbox pattern (ADR-034), and consumed by
other aggregates or integration services. Events are immutable, carry the
aggregate ID, and are versioned.
STATUS
Status Accepted
Date Decided 2025-12-17
Decision Owner Domain Architect — Enrollment
Review Cadence Annual or on event infrastructure
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 80

PreOne ADR - Volume 2: Domain Architecture v3.0
Before ADR-027, PreOne had no formal event model. Cross-aggregate
communication was via direct method calls (Enrollment.confirm() called
Invoice.generate() and Notification.sendEnrollmentConfirmation()), producing
tight coupling. A change to Invoice generation required changing Enrollment.
Testing was hard because Enrollment tests needed Invoice and Notification to
be present. The system could not scale because a single Enrollment.confirm()
call held database locks across three aggregates for 200ms. The Enrollment
Domain Architect led a 5-week refactoring to introduce domain events. The new
flow: Enrollment.confirm() updates the enrollment and publishes an
EnrollmentConfirmed event (carrying enrollmentId, studentId, branchId). The
event is persisted to an outbox table in the same transaction (per ADR-034). A
separate event publisher reads the outbox and publishes to an event bus (Redis
Streams). The Invoice aggregate subscribes to EnrollmentConfirmed and
generates an invoice; the Notification service subscribes and sends a
confirmation. Enrollment no longer knows about Invoice or Notification. This
ADR codifies the rules for domain events across all 12 domains. ArchUnit tests
verify event naming, immutability, and outbox usage.
BUSINESS DRIVERS
The primary driver is decoupling: aggregates that communicate via events do
not know about each other, enabling independent evolution. Enrollment can
change its confirmation flow without touching Invoice or Notification. The
secondary driver is scalability: event publication is asynchronous (via outbox),
so the Enrollment.confirm() transaction is short (24ms vs 200ms), reducing lock
contention. The tertiary driver is testability: Enrollment can be tested in
isolation — the test verifies EnrollmentConfirmed is published, without needing
Invoice or Notification. A fourth driver is integration: external systems (e.g., a
future analytics warehouse) can subscribe to domain events without coupling
to internal APIs. Events are the integration contract; the internal API can
change without breaking external subscribers.
PROBLEM STATEMENT
PreOne's cross-aggregate communication is via direct method calls, producing
tight coupling, long transactions, and poor testability. We must define a domain
event model that decouples aggregates via asynchronous event publication,
aligned with DDD principles and the outbox pattern.
CONSTRAINTS
● Domain events are immutable (all fields final, no setters)
● Domain events carry the aggregate ID (typed, e.g., EnrollmentId) and
event version
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 81

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Domain events are published via the outbox pattern (ADR-034) for
reliable delivery
● Domain event names are past-tense (StudentEnrolled, not
EnrollStudent)
● Domain events are consumed by at most one consumer per aggregate
(for ordering); multiple consumers per event use separate streams
ASSUMPTIONS
● The outbox pattern (ADR-034) provides reliable event delivery with at-
least-once semantics
● Consumers are idempotent (per ADR-036 Idempotency) to handle
duplicate event delivery
● Eventual consistency (per ADR-035) is acceptable for cross-aggregate
workflows
● Redis Streams is sufficient for event bus throughput (10,000
events/second peak)
● Event schema evolution is backward-compatible (per ADR-040 Domain
Versioning)
OPTIONS CONSIDERED
| Option             | Pros                | Cons              | Verdict |
| ------------------ | ------------------- | ----------------- | ------- |
| Domain events via  | Decouples           | Eventual          | Chosen  |
| outbox pattern,    | aggregates;         | consistency (not  |         |
| async consumers    | reliable delivery   | immediate);       |         |
| (chosen)           | (outbox); scalable  | idempotency       |         |
|                    | (async); testable;  | required;         |         |
|                    | aligns with DDD;    | operational       |         |
|                    | enables             | complexity        |         |
|                    | integration.        | (outbox, event    |         |
bus); event
schema evolution
management.
| Direct method    | Simple; immediate  | Tight coupling;     | Rejected |
| ---------------- | ------------------ | ------------------- | -------- |
| calls between    | consistency; no    | long transactions;  |          |
| aggregates (pre- | infrastructure.    | hard to test;       |          |
| ADR-027 state)   |                    | cannot scale; pre-  |          |
ADR-027 state.
| Synchronous        | Simple; no        | Same transaction   | Rejected |
| ------------------ | ----------------- | ------------------ | -------- |
| events (Spring     | infrastructure;   | (long locks); not  |          |
| ApplicationEvent,  | immediate         | reliable (crash    |          |
| in-process)        | delivery; Spring  | loses event); not  |          |
|                    | support.          | asynchronous;      |          |
does not scale.
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  82

PreOne ADR - Volume 2: Domain Architecture v3.0
Option Pros Cons Verdict
External message High throughput; No transactional Rejected
broker (Kafka) scalable; mature guarantee (event
without outbox ecosystem. published before
commit = lost on
rollback; event
published after
commit = lost on
crash);
operational
complexity (Kafka
cluster); overkill
for PreOne scale.
DECISION
ADOPTED
Adopt the following domain event rules enforced via ArchUnit: (1) Domain
events are immutable classes (all fields final) implementing the
DomainEvent marker interface. (2) Domain events carry: eventId (UUID),
occurredAt (Instant), aggregateId (typed ID), aggregateVersion (long),
eventType (String), and event payload (domain-specific fields). (3) Domain
events are published via the OutboxRepository (per ADR-034) in the same
transaction as the aggregate state change. (4) Domain event names are
past-tense (StudentEnrolled, FeePaid, AttendanceMarked) and follow the
<Subject><VerbPastTense> convention. (5) Domain events are versioned
(eventVersion field) for schema evolution per ADR-040. (6) Domain events
are consumed by event handlers (one per aggregate per event type) that are
idempotent (per ADR-036). (7) Domain events are not published from
application services — only from aggregate root methods (the aggregate
owns its events). (8) Domain events are persisted to the outbox table
(outbox_events) with status PENDING, PUBLISHED, or FAILED.
DETAILED RATIONALE
The chosen option is the only one that produces both decoupling and reliability.
Direct method calls (option 2) were the pre-ADR-027 state and produced the
coupling and scalability problems that motivated this ADR. Synchronous events
(option 3) share the same transaction, so they do not solve the long-transaction
problem. External broker without outbox (option 4) has the dual-write problem:
if the broker publish is before the commit, a rollback loses the event; if after the
commit, a crash loses the event. The outbox pattern solves this by writing the
event to a database table in the same transaction as the state change, then a
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 83

PreOne ADR - Volume 2: Domain Architecture v3.0
separate process reads the outbox and publishes to the broker. Rule (1) —
immutability — means events cannot be modified after publication. This is
critical for debugging (the event in the outbox is exactly what was published)
and for audit (the event is a fact). Immutable events are also thread-safe,
allowing concurrent consumers without synchronisation. Rule (2) — standard
fields — provides consistent metadata across all events. eventId is a UUID for
deduplication (consumers track processed eventIds). occurredAt is the time the
event was generated (not the time it was published, which may be later due to
outbox delay). aggregateId is the typed ID of the publishing aggregate.
aggregateVersion is the aggregate's version after the state change, enabling
consumers to detect ordering issues. eventType is a string for routing
(consumers subscribe by eventType). Rule (3) — outbox publication — is the
reliability mechanism. The aggregate state change and the outbox write are in
the same database transaction, so they commit atomically. If the transaction
commits, the event is in the outbox and will be published (even if the application
crashes before the publisher reads it). If the transaction rolls back, the event is
not in the outbox and is never published. This is the 'exactly-once' illusion — at-
least-once delivery with idempotent consumers. Rule (4) — past-tense naming
— communicates that events are facts (something happened), not commands
(do something). StudentEnrolled is a fact; EnrollStudent is a command. The
naming convention is enforced by ArchUnit: event class names must match the
regex [A-Z][a-zA-Z]+PastTense. The convention aids readability and prevents
confusion between events and commands. Rule (5) — versioning — enables
schema evolution. An event may add fields in a new version (e.g.,
StudentEnrolledV2 adds guardianEmail); consumers that do not need the new
field continue to work with V1. The eventVersion field is checked by consumers;
a consumer that does not support a version logs a warning and skips (or fails,
depending on configuration). Versioning is detailed in ADR-040. Rule (6) —
idempotent consumers — handles at-least-once delivery. The outbox publisher
may publish the same event twice (e.g., if it crashes after publishing but before
marking the outbox entry as PUBLISHED). Consumers must handle duplicates
by checking the eventId — if already processed, skip. Idempotency is detailed in
ADR-036. Rule (7) — published from aggregates, not application services —
keeps event ownership in the domain. The Enrollment aggregate publishes
EnrollmentConfirmed when its confirm() method is called; the application
service does not publish events on behalf of the aggregate. This ensures events
are always published when the state change occurs, regardless of the entry
point (web request, batch job, CLI tool). ArchUnit verifies that DomainEvent
instances are created only in @AggregateRoot classes. Rule (8) — outbox table
— is the persistence mechanism. The outbox_events table has columns:
event_id (uuid), event_type (text), aggregate_id (uuid), aggregate_type (text),
occurred_at (timestamptz), event_version (int), payload (jsonb), status (text),
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 84

PreOne ADR - Volume 2: Domain Architecture v3.0
published_at (timestamptz), retry_count (int). The publisher reads PENDING
events, publishes to Redis Streams, and marks them PUBLISHED. Failed
events (publish error) are retried with exponential backoff; after 5 retries, they
are marked FAILED for manual intervention.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Domain Event Flow
(Outbox Pattern) | | | | App
Service Aggregate Outbox Repo DB | | | |
| | | | |--confirm()------>| | | | | |
|--update state | | | | | |--create event | | |
| | | (Enrollment | | | | | | Confirmed)
| | | | | | | | | | | |--
save()------->| | | | | | |--INSERT-----|---------->| |
| | | aggregate | (same | | | | |
| txn) | | | | |--INSERT-----|---------->| | | |
| outbox | | | | | | (PENDING) | | | |
| | | | | |<--confirmed------| | | | |
| | | | | | | (txn commits: aggregate + outbox
atomic) | | | | | Publisher
(separate process) Event Bus Consumers | | | |
| | | |--SELECT PENDING------------------->| | | | |<--outbox
rows----------------------| | | | |--publish to Redis Streams-------->|
| | | | |--deliver----->| | | | |
| | | | | +------+------+-+ | |
| | | | | | | | Invoice Notif Analytics | |
| Handler Svc Warehouse | | | | | | | | |
| | (idempotent) | | | | | | | | | |--UPDATE
outbox SET PUBLISHED----->| | | | | | | | |
| |
SEQUENCE DIAGRAM
App Svc Enrollment Agg Outbox Repo DB Publisher | |
| | | |--confirm()---->| | | | |
|--validate | | | | |--update state | | |
| |--create event | | | | |
EnrollmentConfirmed | | | | | | |
| |--save()-------->| | | | | |--INSERT
enrollment-------->| | | |--INSERT outbox (PENDING)--->| |
| | | | |<--confirmed----| | | |
| | | | | | (txn commits) | | |
| | | | | | | (async, separate process) |
| | | | | |--SELECT PENDING-->| |
| | |<--rows-----------| | | | | |
| | | |--publish to Redis-->| | | |
| |--deliver | | | | | to consumers |
| | | | | | | |--UPDATE
outbox-->| | | | | SET PUBLISHED |
COMPONENT DIAGRAM
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 85

PreOne ADR - Volume 2: Domain Architecture v3.0
+-------------------------------------------------------------+ | Domain Event Components
| | | | Domain Layer
| | +---------------------+ +---------------------+ | | | EnrollmentConfirmed | |
DomainEvent | | | | (event) |---| (marker interface) | | |
|---------------------| +---------------------+ | | | - eventId: UUID |
| | | - occurredAt: Instant| +---------------------+ | | | - aggregateId: | |
OutboxRepository | | | | EnrollmentId | | (interface) | | | |
- aggregateVersion | | +save(event) | | | | - eventVersion: int |
+---------------------+ | | | - payload: fields | | |
+---------------------+ | | |
| Infrastructure Layer | | +---------------------+
+---------------------+ | | | OutboxRepositoryImpl| | EventPublisher | |
| | (@Repository) | | (separate process) | | | | extends JpaRepo | | -
reads PENDING | | | +---------------------+ | - publishes to Redis| | |
| - marks PUBLISHED | | | +---------------------+ +---------------------+ | | |
outbox_events table | | | | (event_id, type, |
+---------------------+ | | | aggregate_id, | | EventHandler | | | |
payload, status) | | (interface) | | | +---------------------+ |
+handle(event) | | | +---------------------+ | |
Consumers | | +---------------------+ +---------------------
+ | | | InvoiceHandler | | NotificationHandler | | | | implements
EH | | implements EH | | | | +handle(EnrollConf) | |
+handle(EnrollConf) | | | | (idempotent) | | (idempotent) | | |
+---------------------+ +---------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Command: confirmEnrollment(enrollmentId) | v +----+-----+ | App
Svc | @Transactional +----+-----+ | |--enrollment.confirm() v +----
+-----+ | Aggregate| --update state | | --create EnrollmentConfirmed
event +----+-----+ | |--outboxRepository.save(event) v +----+-----+
| Outbox | --INSERT into outbox_events (status=PENDING) | Repo | --(same
txn as aggregate update) +----+-----+ | v +----+-----+ | COMMIT | --
aggregate + outbox atomic +----+-----+ | v +----+-----+ | Publisher|
(async, separate process) | | --SELECT WHERE status=PENDING +----
+-----+ | |--publish to Redis Streams v +----+-----+ | Event Bus|
(Redis Streams) +----+-----+ | +--deliver to subscribers | v
+----+-----+ | Consumer | (Invoice Handler, Notification Handler, ...) | | --
check idempotency (eventId) | | --process event | | --ack +----+-----
+ | v +----+-----+ | Publisher| --UPDATE outbox SET
status=PUBLISHED +----------+
DATABASE IMPACT
Domain events add the outbox_events table to the database. The table has:
event_id (uuid primary key), event_type (text), aggregate_id (uuid),
aggregate_type (text), occurred_at (timestamptz), event_version (int), payload
(jsonb), status (text), published_at (timestamptz), retry_count (int). An index on
(status, occurred_at) supports the publisher's PENDING query. The outbox is in
the same schema as the publishing aggregate, ensuring transactional
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 86

PreOne ADR - Volume 2: Domain Architecture v3.0
consistency. Old PUBLISHED events are archived after 30 days (per ADR-048
Audit Trail retention). ArchUnit verifies that no event is published without an
outbox entry.
API IMPACT
Domain events are not directly exposed via the API. The API is for commands
and queries; events are internal. However, events affect the API indirectly: an
API command (POST /enrollments/{id}/confirm) triggers aggregate.confirm(),
which publishes an event; the API response returns immediately (202
Accepted) without waiting for event consumers. Consumers process
asynchronously; the client can poll or receive a webhook for completion. This
async pattern improves API responsiveness (24ms vs 200ms) and enables
background processing.
UI IMPACT
Domain events affect UI feedback patterns. When a user clicks 'Confirm
Enrollment', the UI sends the request and receives 202 Accepted immediately.
The UI displays 'Enrollment is being confirmed...' (optimistic). The actual
confirmation (invoice generated, notification sent) happens asynchronously.
The UI may receive a webhook or poll for completion. For real-time UI updates,
a WebSocket (per ADR-145) may deliver event notifications to the UI. This
async pattern requires UI state management for in-flight operations.
SECURITY IMPACT
Domain events improve security by providing an audit trail. Every state change
produces an event, which is persisted to the outbox and archived. The audit
trail (per ADR-048) reads from the event store, providing a complete history of
what happened, when, and by whom. Events do not carry credentials or PII in
the payload (only aggregate IDs); PII is fetched by consumers from the
aggregate. This minimises the data exposed in the event bus, reducing the blast
radius of a bus compromise.
PERFORMANCE IMPACT
Domain events via outbox have a small performance cost: one additional
INSERT per state change (the outbox row). This adds ~2ms to the transaction.
The benefit is a much shorter transaction (24ms vs 200ms) because consumers
process asynchronously. Overall throughput improves by 5-10x due to reduced
lock contention. The publisher process adds a small latency (50-200ms)
between commit and consumer delivery, which is acceptable for eventual
consistency. Redis Streams throughput (10,000 events/second) is sufficient for
PreOne's peak (1,000 events/second).
SCALABILITY ANALYSIS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 87

PreOne ADR - Volume 2: Domain Architecture v3.0
The outbox pattern scales horizontally. The publisher process can be replicated
(multiple instances reading PENDING events) with row-level locking (SELECT
FOR UPDATE SKIP LOCKED) to distribute work. Redis Streams scales with
partitioning (events are partitioned by aggregate_id for ordering). Consumers
scale independently per event type. The outbox table grows linearly with event
count; archival (after 30 days) keeps the table size bounded. At PreOne's
projected scale (1,000 events/second, 30-day retention = ~2.6 billion events),
the outbox table is ~500GB, which PostgreSQL handles with partitioning by
occurred_at.
OPERATIONAL CONSIDERATIONS
Domain events require operational tooling. The outbox has a dashboard:
PENDING count (target: <100; high count indicates publisher lag),
PUBLISHED count (throughput), FAILED count (target: zero; non-zero triggers
alert). The event bus (Redis Streams) has a dashboard: consumer lag,
throughput, error rate. Consumers have dashboards: processed count, error
count, processing duration. The quarterly architecture scorecard audits: (a)
event delivery latency (target: p95 <1s from commit to consumer), (b) duplicate
delivery rate (target: <1%; higher indicates publisher issues), (c) consumer
error rate (target: <0.1%).
RISKS
Risk Likelihood Impact Mitigation
Outbox publisher Medium Medium Monitor PENDING
lag causes delayed count; scale
event delivery publisher
instances; alert if
lag >5s;
consumers handle
out-of-order
events via version
check
Event schema Medium High Versioning per
evolution breaks ADR-040;
consumers backward-
compatible
changes only;
consumer version
negotiation;
deprecation
period for
breaking changes
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 88

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation    |
| ------------------ | ---------- | ------ | ------------- |
| Consumers are      | Medium     | High   | ADR-036       |
| not idempotent,    |            |        | mandates      |
| causing duplicate  |            |        | idempotency;  |
| processing         |            |        | consumer      |
template provides
idempotency
check; quarterly
audit of consumer
idempotency
| Event bus (Redis)  | Low | High | Outbox retains  |
| ------------------ | --- | ---- | --------------- |
| failure causes     |     |      | events until    |
| event loss         |     |      | PUBLISHED;      |
Redis persistence
(AOF); Redis
replica; fallback to
direct DB polling
if Redis
unavailable
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Decoupled aggregates (independent  Eventual consistency (not immediate)
evolution)
Reliable delivery (outbox pattern) Operational complexity (outbox table,
publisher process)
Scalable (async, short transactions) Idempotency required (consumer
complexity)
Audit trail (events are facts) Event schema evolution management
(versioning)
REJECTED ALTERNATIVES
Direct method calls (option 2) were the pre-ADR-027 state. Three issues: (1)
Enrollment.confirm() called Invoice.generate() and Notification.send(), holding
locks across three aggregates for 200ms and causing deadlocks under load; (2)
testing Enrollment required Invoice and Notification to be present, making
tests slow and brittle; (3) adding a new subscriber (e.g., Analytics) required
changing Enrollment, violating Open/Closed. Synchronous events (option 3)
were prototyped with Spring ApplicationEvent: the event was published in the
same transaction, so locks were held during consumer processing — no
scalability benefit. External broker without outbox (option 4) was rejected due
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  89

PreOne ADR - Volume 2: Domain Architecture v3.0
to the dual-write problem: a prototype showed 0.1% event loss on crashes,
which is unacceptable for financial events.
MIGRATION PLAN
Phase 1 (complete): Create outbox table, DomainEvent interface,
OutboxRepository. Phase 2 (complete): Pilot in Enrollment domain — replace
direct calls with events. Phase 3 (complete): Migrate all 12 domains — 87 event
types created. Phase 4 (complete): ArchUnit rules enforced in CI. Phase 5
(complete): Event publisher process deployed. Phase 6 (Q4 2026): Migrate
remaining direct calls to events (5 cross-aggregate workflows remaining).
TESTING STRATEGY
Domain event rules are tested at three levels. Unit tests: aggregate tests verify
events are created on state changes (e.g., enrollment.confirm() creates
EnrollmentConfirmed). Contract tests: events have contract tests verifying
immutability, required fields, and versioning. Integration tests: the outbox flow
is tested end-to-end with Testcontainers PostgreSQL and Redis — verify event
appears in outbox, publisher delivers to Redis, consumer processes. ArchUnit
tests: structural rules (events immutable, past-tense names, published only
from aggregates) verified at compile time. Consumer idempotency tests: each
consumer is tested with duplicate events to verify idempotency.
MONITORING & OBSERVABILITY
Event metrics are emitted via Micrometer: event.published.count (per event
type), event.published.latency (commit to publish), event.delivered.latency
(commit to consumer), event.consumer.processing.time (per consumer),
event.consumer.error.count (per consumer), outbox.pending.count (gauge),
outbox.failed.count (gauge). Dashboards in Grafana: event flow (publisher →
bus → consumer), outbox health, consumer lag. Alerts: outbox.pending >100,
outbox.failed >0, consumer.error.rate >0.1%, delivery.latency p95 >5s.
FUTURE EVOLUTION
Three evolutions are likely. First, event sourcing may be adopted for specific
aggregates (Audit, Compliance) — the outbox becomes the event store, and
aggregate state is reconstructed from events. Second, the event bus may
migrate from Redis Streams to Kafka if throughput exceeds 10,000
events/second (PreOne's 5-year projection is 5,000/second, so Redis is
sufficient). Third, events may be exposed to external systems via a public event
API (webhooks or SSE) for integration partners — this requires event
versioning and a public schema registry.
RELATED ADRS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 90

PreOne ADR - Volume 2: Domain Architecture v3.0
● ADR-001 — Enterprise Architecture Principles (P4 Observability via
event audit trail)
● ADR-004 — Domain Driven Design (domain event is a DDD building
block)
● ADR-022 — Aggregate Rules (events carry aggregate IDs, not
snapshots)
● ADR-023 — Entity Rules (events use typed aggregate IDs)
● ADR-024 — Value Objects (events are immutable value objects)
● ADR-034 — Cross Domain Communication (events are the
communication mechanism)
● ADR-035 — Eventual Consistency (events enable eventual consistency)
● ADR-036 — Saga Readiness (sagas are sequences of events)
● ADR-039 — Domain Exceptions (event publication failures throw
domain exceptions)
● ADR-040 — Domain Versioning (events are versioned for schema
evolution)
● ADR-048 — Audit Trail (events are the audit log source)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — domain events)
● Upstream PRD: PRD-002-section-5 (Enrollment event flow)
● Downstream ERD: ERD-004 (outbox_events table schema)
● Downstream API Spec: API-004 (async API patterns: 202 Accepted,
webhooks)
● Downstream Test Cases: TC-0037..TC-0039 (Event publication, outbox,
consumer idempotency tests)
● External: Eric Evans — Domain-Driven Design, Chapter 8 (Domain
Events)
● External: Microservices Patterns — Chris Richardson (Outbox Pattern)
DECISION HISTORY
Date Status Actor Notes
2025-10-25 Draft Enrollment Initial draft with 6
Domain Architect rules; expanded to
8 after review
2025-11-27 Proposed Enrollment Submitted to ARB
Domain Architect after Enrollment
pilot
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 91

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Date       | Status   | Actor     | Notes             |
| ---------- | -------- | --------- | ----------------- |
| 2025-12-17 | Accepted | ARB Chair | ARB approved; 87  |
event types
created; outbox
deployed
| 2026-07-28 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 and Vol 4
ADRs added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)        |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Enrollment Domain Architect |     |
| ARB Chair   |     | ARB Chair                   |     |
| Approved On |     | 2026-07-28                  |     |
IMPLEMENTATION CHECKLIST
● Create outbox_events table (Done — Flyway V1.6.0)
● Create DomainEvent interface and base class (Done — preone-domain-
events v1.0.0)
● Create OutboxRepository interface and impl (Done — PR #4901)
● Pilot in Enrollment domain (Done — 5 event types)
● Migrate all 12 domains (Done — 87 event types)
● Deploy event publisher process (Done — Kubernetes Deployment, 3
replicas)
● ArchUnit rules: immutable events, past-tense, from aggregates only
(Done — CI gate since V1.6.0)
● Consumer idempotency audit (Done — all 47 consumers verified
idempotent)
AD R -028
Application Services
Volume 2 — Domain Architecture  -  Layer
ACCEPTED
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  92

PreOne ADR - Volume 2: Domain Architecture v3.0
DECISION SUMMARY
DECISION
Define the role, structure, and rules for application services in the PreOne
platform. An application service is a Spring @Service bean that
orchestrates a use case: it loads aggregates from repositories, invokes
domain services or aggregate methods, saves aggregates, and publishes
events. Application services are the entry point for API requests and are
transaction-boundary owners.
STATUS
Status Accepted
Date Decided 2025-12-24
Decision Owner Domain Architect — Enrollment
Review Cadence Annual or on application service
proliferation
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-028, PreOne's application services were inconsistent. Some were
thin (just delegating to repositories), some were thick (containing business
logic that belonged in domain services or aggregates), and some were missing
entirely (controllers called repositories directly). The result was scattered
transaction boundaries, duplicated orchestration logic, and unclear
responsibility. A fee calculation use case was implemented in three places: a
controller method, an application service, and a domain service. The
Enrollment Domain Architect led a 4-week refactoring to standardise
application services. The new pattern: each use case has exactly one
application service method (e.g.,
confirmEnrollmentUseCase.execute(ConfirmEnrollmentCommand)). The
method is @Transactional, loads aggregates via repositories, invokes domain
services or aggregate methods, saves aggregates, and returns a result.
Controllers call application services; application services call domain services
and repositories; domain services contain pure logic; aggregates contain
invariants. This ADR codifies the rules for application services across all 12
domains. ArchUnit tests verify that application services are @Service, are
@Transactional, and do not contain business logic.
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 93

PreOne ADR - Volume 2: Domain Architecture v3.0
BUSINESS DRIVERS
The primary driver is clear responsibility: application services orchestrate,
domain services compute, aggregates enforce invariants. Without this
separation, logic is scattered and duplicated. The secondary driver is
transaction boundary clarity: the @Transactional annotation on the application
service method defines the transaction boundary — one method, one
transaction, one aggregate (per ADR-022). The tertiary driver is testability:
application services are tested with mocked repositories and domain services,
verifying orchestration without infrastructure. A fourth driver is API stability:
application services are the API's backend; refactoring within the application
service (moving logic to domain services) does not change the API. The
command/result DTOs at the application service boundary are stable contracts.
PROBLEM STATEMENT
PreOne's application services are inconsistent — some thin, some thick, some
missing — causing scattered transaction boundaries, duplicated orchestration,
and unclear responsibility. We must define application service rules that
establish orchestration-only services with clear transaction boundaries.
CONSTRAINTS
● Application services are Spring @Service beans in the application layer
(com.preone.<domain>.application package)
● Application service methods are @Transactional (transaction boundary
at method level)
● Application services contain no business logic — only orchestration
(load, invoke, save, publish)
● Application services accept Command objects and return Result objects
(DTOs)
● Application services are the only entry point for use cases (controllers
call app services, not repositories)
ASSUMPTIONS
● Spring's @Transactional provides sufficient transaction management
(no need for programmatic transactions)
● The Command/Result pattern is sufficient for all use cases (no need for
event-sourced commands)
● One use case = one application service method (no god services with
20 methods)
● Application services are synchronous (async use cases use the saga
pattern per ADR-036)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 94

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Application services do not call other application services directly
(cross-use-case orchestration is via events)
OPTIONS CONSIDERED
| Option              | Pros               | Cons              | Verdict |
| ------------------- | ------------------ | ----------------- | ------- |
| Standardised app    | Clear              | Boilerplate (one  | Chosen  |
| services:           | responsibility;    | service per use   |         |
| @Service,           | transaction        | case); engineers  |         |
| @Transactional,     | boundary clarity;  | must resist       |         |
| Command/Result,     | testable; API      | putting logic in  |         |
| orchestration-only  | stability; aligns  | app services;     |         |
| (chosen)            | with DDD and       | cultural shift.   |         |
Clean
Architecture.
Thin app services  Minimal code;  No orchestration;  Rejected
| (just delegate to  | simple. | logic in controllers  |     |
| ------------------ | ------- | --------------------- | --- |
| repositories, pre- |         | or missing;           |     |
| ADR-028 state)     |         | transaction           |     |
boundaries
unclear;
duplicated logic.
| Thick app services  | All logic in one    | Logic not          | Rejected |
| ------------------- | ------------------- | ------------------ | -------- |
| (contain business   | place; familiar to  | reusable; hard to  |          |
| logic)              | Spring developers.  | test (need Spring  |          |
context); violates
Clean
Architecture; logic
duplicated across
services.
No app services  Least boilerplate;  No transaction  Rejected
| (controllers call  | simple CRUD. | management; no  |     |
| ------------------ | ------------ | --------------- | --- |
| repositories       |              | orchestration;  |     |
| directly)          |              | logic in        |     |
controllers;
cannot scale
beyond CRUD;
pre-ADR-028 state
for some
endpoints.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  95

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following application service rules enforced via ArchUnit: (1)
Application services are @Service beans in
com.preone.<domain>.application.service package. (2) Application service
methods are @Transactional — the method is the transaction boundary. (3)
Application services contain no business logic — only orchestration (load via
repository, invoke domain service or aggregate method, save via repository,
publish events via outbox). (4) Application services accept Command
objects (e.g., ConfirmEnrollmentCommand) and return Result objects (e.g.,
ConfirmEnrollmentResult) — DTOs, not domain objects. (5) One use case =
one application service method — ArchUnit verifies @Service classes have
<10 public methods. (6) Application services do not call other application
services — cross-use-case orchestration is via domain events. (7)
Application services are the only entry point for use cases — controllers call
app services, not repositories. (8) Application services handle
infrastructure exceptions (translate to domain exceptions per ADR-039).
DETAILED RATIONALE
The chosen option is the only one that produces clear responsibility and
transaction boundary clarity. Thin app services (option 2) were the pre-
ADR-028 state for some use cases and produced duplicated orchestration
(every controller repeated the load-invoke-save pattern). Thick app services
(option 3) were the pre-ADR-028 state for other use cases and produced
untestable logic (Spring context required). No app services (option 4) were the
pre-ADR-028 state for CRUD endpoints and produced no transaction
management. Rule (1) — @Service in application package — establishes the
layering. The package convention (com.preone.<domain>.application.service)
makes application services discoverable and enforces the layering rule
(ADR-006): the application layer can depend on domain and infrastructure, but
not vice versa. ArchUnit verifies that @Service classes in the
application.service package do not import from controller packages. Rule (2) —
@Transactional method — defines the transaction boundary. The transaction
starts when the method is called and commits when the method returns (or rolls
back on exception). This is the only transaction boundary in the system —
controllers, repositories, and domain services do not have @Transactional. One
method, one transaction, one aggregate (per ADR-022, one transaction
modifies one aggregate). Cross-aggregate workflows use sagas (ADR-036) with
multiple transactions. Rule (3) — orchestration only — means application
services do not contain if/else business logic. The pattern is: load, invoke, save,
publish. If a method has complex branching, the branching belongs in a domain
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 96

PreOne ADR - Volume 2: Domain Architecture v3.0
service (pure logic) or the aggregate (invariant enforcement). ArchUnit verifies
that @Service methods have low cyclomatic complexity (<5) — higher
complexity triggers a review. Rule (4) — Command/Result DTOs — decouples
the application service from the API. The ConfirmEnrollmentCommand is a
DTO with enrollmentId and confirmedBy fields; the ConfirmEnrollmentResult is
a DTO with enrollmentId and status. The API controller converts between HTTP
(JSON) and Command/Result. This allows the application service to be invoked
from non-HTTP entry points (batch jobs, CLI tools, internal services) without
HTTP coupling. Rule (5) — one use case per method — prevents god services. A
service with 20 methods is doing too much; it should be split into multiple
services (e.g., EnrollmentCommandService for writes,
EnrollmentQueryService for reads, per CQRS in ADR-030). ArchUnit verifies
@Service classes have <10 public methods; classes exceeding the limit are
flagged for review. Rule (6) — no cross-app-service calls — prevents tight
coupling between use cases. If use case B must happen after use case A, A
publishes an event and B subscribes (per ADR-027). This enables independent
evolution and scaling. The exception is a saga orchestrator (per ADR-036),
which is a special kind of application service that coordinates multiple use
cases via events. Rule (7) — only entry point — means controllers do not call
repositories or domain services directly. Every use case goes through an
application service. This ensures transaction boundaries are consistent and
orchestration is centralised. ArchUnit verifies that @RestController classes do
not import Repository or DomainService. Rule (8) — exception translation —
means infrastructure exceptions (SQLException, HttpClientException) are
caught in the application service and translated to domain exceptions (per
ADR-039). The API layer receives domain exceptions, not infrastructure
exceptions, producing consistent error responses. For example, a unique
constraint violation (SQLException) is translated to
DuplicateEnrollmentException (domain exception), which the API renders as
409 Conflict.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Application Service
Rules | | | | API Layer
| | +----------------------------------------------------------+ | | | EnrollmentController
(@RestController) | | | | POST /enrollments/{id}/confirm
| | | | - converts JSON to ConfirmEnrollmentCommand | | | | - calls
app service | | | | - converts Result to JSON
| | | +--------------------+-------------------------------------+ | | | calls
| | Application Layer v | |
+----------------------------------------------------------+ | | | EnrollmentCommandAppService
(@Service) | | | | @Transactional | | | |
+ confirmEnrollment(ConfirmEnrollmentCommand) | | | | :
ConfirmEnrollmentResult | | | | 1. enrollment =
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 97

PreOne ADR - Volume 2: Domain Architecture v3.0
repo.findById(cmd.enrollmentId) | | | | 2.
enrollment.confirm(cmd.confirmedBy) | | | | 3.
repo.save(enrollment) | | | | 4.
outbox.publish(enrollment.events()) | | | | 5. return
Result(enrollment.id, enrollment.status) | | | | (NO business logic — only
orchestration) | | | +----+-------------------+-------------------+ | | |
| invokes | invokes | invokes | | | v v v
| | | +---------+ +---------+ +---------+ | | | | Enroll | | Domain
| | Outbox | | | | | Repo | | Service | | Repo | | | |
| (iface) | | (pure) | | (iface) | | | | +---------+ +---------+
+---------+ | | | Domain Layer (no infra) Domain Layer | | |
+---------+ +---------+ | | | | Enroll | |
Outbox | | | | | Agg | | Impl | | | | | (root) |
| (JPA) | | | | +---------+ +---------+ | | |
Infrastructure Layer | | | +---------+
| | | | Enroll | | | | | Repo |
| | | | Impl | | | | | (JPA) |
| | | +---------+ | | |
+----------------------------------------------------------+ | |
| | ArchUnit: | | - @Service in
application.service: @Transactional on methods | | - @Service methods:
cyclomatic complexity <5 | | - @Service classes: <10 public methods
| | - @RestController: no Repository imports | | - @Service: no
@Service-to-@Service calls (except sagas) |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Controller App Service Repository Aggregate | |
| | |--confirm(cmd)----->| | | | |
@Transactional | | | | | | |
|--findById(id)----->| | | |<--enrollment-------| |
| | | | | |--enrollment.confirm(by)
| | | | | | | |--update
state | | | |--create event | | |
| (EnrollConf) | | |<--confirmed--------| | | |
| | | |--save(enrollment)->| | | |
|--UPDATE | | | | WHERE version=N| |
|<--saved------------| | | | | | |
|--outbox.publish(events) | | | |--INSERT
outbox | | |<--ok---------------| | | |
| | | | (txn commits) | | | |
| | |<--Result-----------| | | | (enrollmentId, |
| | | status) | | |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Application Service Example:
Enrollment Command Service | | | |
+---------------------+ +---------------------+ | | | ConfirmEnrollment | |
ConfirmEnrollment | | | | Command (DTO) | | Result (DTO) |
| | | - enrollmentId | | - enrollmentId | | | | - confirmedBy | | -
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 98

PreOne ADR - Volume 2: Domain Architecture v3.0
status | | | +---------------------+ +---------------------+ | |
| | +---------------------+ @Service | | | EnrollmentCommand |
@Transactional on methods | | | AppService | | |
|---------------------| Methods (one per use case): | | | - enrollRepo: Repo | +
enroll(cmd): Result | | | - feeDomainSvc: DS | + confirm(cmd): Result
| | | - outboxRepo: Repo | + cancel(cmd): Result | | |---------------------| +
transfer(cmd): Result | | | + enroll(cmd) | + updateLines(cmd): Result
| | | + confirm(cmd) | | | | + cancel(cmd) |
(ArchUnit: <10 methods) | | | + transfer(cmd) | | | |
+ updateLines(cmd) | | | +---------------------+
| | | | Dependencies (injected):
| | +---------------------+ +---------------------+ | | | EnrollmentRepo | |
OutboxRepository | | | | (domain interface) | | (domain interface) |
| | +---------------------+ +---------------------+ | |
| | +---------------------+ +---------------------+ | | | FeeCalculation | | (no
other app | | | | DomainService | | services — cross- | | | |
(pure, no infra) | | use case via | | | +---------------------+ | events)
| | | +---------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
HTTP Request: POST /enrollments/{id}/confirm | v +----+-----+ |
Controller| @RestController | | --parse JSON to
ConfirmEnrollmentCommand +----+-----+ | |--confirmEnrollment(cmd)
v +----+-----+ | App Svc | @Service, @Transactional | | --orchestration
only +----+-----+ | |--1. load: enrollment = enrollRepo.findById(cmd.id)
|--2. invoke: enrollment.confirm(cmd.confirmedBy) | (aggregate enforces
invariant, creates event) |--3. save: enrollRepo.save(enrollment) |
(optimistic lock check) |--4. publish: outboxRepo.save(enrollment.events())
| (same txn as save) |--5. return Result(enrollment.id, enrollment.status)
v +----+-----+ | COMMIT | --txn commits: aggregate + outbox atomic +----
+-----+ | v +----+-----+ | Result | --Controller converts to JSON
response | (DTO) | --HTTP 200: {"enrollmentId":"...","status":"CONFIRMED"}
+----------+
DATABASE IMPACT
Application services do not directly access the database — they use
repositories. However, application services define transaction boundaries,
which affect database locks. A @Transactional method holds database locks for
its duration; long methods cause lock contention. The orchestration-only rule
(rule 3) keeps methods short (load, invoke, save, publish), minimising lock
duration. The one-aggregate-per-transaction rule (ADR-022) ensures locks are
scoped to one aggregate, reducing contention. ArchUnit verifies that
@Transactional methods do not call repositories more than twice (load + save),
preventing multi-aggregate transactions.
API IMPACT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 99

PreOne ADR - Volume 2: Domain Architecture v3.0
Application services are the API's backend. The API controller converts HTTP
requests to Command objects and Result objects to HTTP responses. The
Command/Result DTOs are stable contracts — changes to the DTO require API
versioning (per ADR-092). Application service method signatures define the use
case; the API endpoint maps to the method. This 1:1 mapping simplifies API
documentation (OpenAPI specs reference application service methods). The
async pattern (202 Accepted for long-running use cases) is implemented at the
application service level — the method returns a 'pending' Result, and the
actual completion is via events.
UI IMPACT
Application services affect UI patterns indirectly. The UI sends HTTP requests
that map to application service methods; the UI receives HTTP responses that
map to Result DTOs. The async pattern (202 Accepted) requires UI state
management for in-flight operations. The Command/Result DTOs define what
the UI can send and receive — UI changes that require new fields trigger
Command/Result changes, which are reviewed by the Domain Architect.
SECURITY IMPACT
Application services are the security boundary for use cases. Authorisation
checks (per ADR-071) are performed at the application service level — the
method verifies the caller has permission to perform the use case. For example,
confirmEnrollment() checks that the caller has 'enrollment:confirm' permission
for the relevant school. Centralising authorisation at the application service
ensures it cannot be bypassed (every use case goes through an application
service per rule 7). Audit logging (per ADR-048) is also triggered at the
application service level — the method logs the command, caller, and result.
PERFORMANCE IMPACT
Application services have minimal performance overhead — they are method
calls on Spring beans. The @Transactional annotation adds transaction
management overhead (begin, commit, rollback), which is unavoidable. The
orchestration-only rule keeps methods short, minimising transaction duration
and lock contention. The one-aggregate-per-transaction rule (ADR-022)
ensures transactions are scoped tightly. Overall, application services have no
measurable performance impact vs direct controller-to-repository calls, but
produce significant maintainability and testability benefits.
SCALABILITY ANALYSIS
Application services scale horizontally — they are stateless Spring beans, and
multiple instances can run on multiple application servers. The @Transactional
annotation uses database transactions, which do not scale beyond a single
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 100

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
database; however, PreOne's single-primary PostgreSQL (per ADR-041) is
sufficient for projected scale. Cross-aggregate workflows (sagas) scale via
event-driven processing (per ADR-036). The one-use-case-per-method rule
(rule 5) prevents god services, which would be scalability bottlenecks (one
service handling 20 use cases cannot be scaled independently).
OPERATIONAL CONSIDERATIONS
Application   services   are   observable   via   Micrometer   metrics:
appservice.usecase.count (per method, per domain), appservice.usecase.time
(per method), appservice.usecase.error (per method, by exception type). Slow
use cases (>1s) are logged with method name and command. The quarterly
architecture scorecard audits: (a) method count per app service (target: <10),
(b) cyclomatic complexity (target: <5), (c) use case latency (target: p95
<500ms),   (d)   error   rate   (target:   <0.1%).   ArchUnit   reports   track   rule
compliance.
RISKS
| Risk               | Likelihood | Impact | Mitigation         |
| ------------------ | ---------- | ------ | ------------------ |
| Engineers put      | Medium     | High   | ArchUnit           |
| business logic in  |            |        | cyclomatic         |
| app services       |            |        | complexity check;  |
| instead of domain  |            |        | code review        |
| services           |            |        | checklist; Domain  |
Architect
enforcement
| App services call   | Medium | Medium | ArchUnit blocks  |
| ------------------- | ------ | ------ | ---------------- |
| other app           |        |        | @Service-to-     |
| services, creating  |        |        | @Service calls   |
| tight coupling      |        |        | (except sagas);  |
code review; use
events for cross-
use-case
| App services    | Medium | Medium | ArchUnit method     |
| --------------- | ------ | ------ | ------------------- |
| accumulate too  |        |        | count limit (<10);  |
| many methods    |        |        | split into          |
| (god services)  |        |        | command/query       |
services per CQRS
| Transaction        | Low | High | ArchUnit blocks    |
| ------------------ | --- | ---- | ------------------ |
| boundaries are     |     |      | @Transactional     |
| wrong (e.g.,       |     |      | outside @Service;  |
| @Transactional on  |     |      | code review;       |
| controller)        |     |      | training           |
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  101

PreOne ADR - Volume 2: Domain Architecture v3.0
TRADE-OFFS
We Gain We Lose
Clear responsibility (orchestration only) Boilerplate (one service per use case)
Transaction boundary clarity Cultural shift (no logic in app services)
(@Transactional)
Testable (mock repositories and domain Indirection (controller → app service →
services) domain)
API stability (Command/Result DTOs) DTO boilerplate (one per use case)
REJECTED ALTERNATIVES
Thin app services (option 2) were the pre-ADR-028 state for some use cases.
The confirmEnrollment use case was a thin service that just called repo.save(),
with the confirmation logic in the controller — duplicated across web, batch,
and CLI entry points. Thick app services (option 3) were the pre-ADR-028 state
for other use cases. The calculateFee use case had all logic in the app service
(including GST calculation), requiring a Spring context to test and duplicating
the GST logic in the refund use case. No app services (option 4) were the pre-
ADR-028 state for CRUD endpoints (e.g., GET /students), where the controller
called the repository directly — no transaction management, no orchestration,
no consistency.
MIGRATION PLAN
Phase 1 (complete): Identify all use cases across 12 domains — 187 use cases
identified. Phase 2 (complete): Create application services with
Command/Result DTOs — 187 methods across 47 services. Phase 3 (complete):
Refactor controllers to call app services. Phase 4 (complete): Move business
logic from app services to domain services/aggregates. Phase 5 (complete):
ArchUnit rules enforced in CI. Phase 6 (Q4 2026): Training session for new
engineers (ongoing).
TESTING STRATEGY
Application service rules are tested at three levels. Unit tests: app services are
unit-tested with mocked repositories and domain services — verify the service
calls findById, save, publish in the correct order, and returns the correct
Result. Contract tests: app service methods have contract tests verifying the
Command/Result DTO structure. ArchUnit tests: structural rules (@Service in
application.service, @Transactional on methods, cyclomatic complexity <5,
method count <10, no @Service-to-@Service calls, no Repository in
controllers) verified at compile time. Integration tests: app services are tested
end-to-end with Testcontainers PostgreSQL and Redis.
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 102

PreOne ADR - Volume 2: Domain Architecture v3.0
MONITORING & OBSERVABILITY
Application service metrics: appservice.usecase.count (per method),
appservice.usecase.time (per method, with p50/p95/p99),
appservice.usecase.error (per method, by exception type). Slow use cases
(>1s) are logged with method name and command (sanitised). Dashboards in
Grafana per domain. Alerts: error rate >0.1%, p95 latency >500ms, method
count >8 (approaching limit). The quarterly architecture scorecard reviews
app service metrics per domain.
FUTURE EVOLUTION
Three evolutions are likely. First, CQRS (ADR-030) may split application
services into command services (writes) and query services (reads) — query
services may use a different persistence technology (e.g., a read-optimised
view). Second, the Command/Result DTOs may adopt Java 21 records for
reduced boilerplate. Third, application services may adopt reactive types
(Mono, Flux) if PreOne adopts Spring WebFlux — currently, PreOne uses
Spring MVC (blocking), and app services return synchronous types.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P7 Contracts Before
Code — Command/Result DTOs)
● ADR-003 — Clean Architecture (app service in application layer)
● ADR-004 — Domain Driven Design (app service is a DDD building
block)
● ADR-006 — Layering Rules (app service can depend on domain and
infra)
● ADR-022 — Aggregate Rules (one transaction = one aggregate)
● ADR-025 — Domain Services (app services invoke domain services)
● ADR-026 — Repository Pattern (app services invoke repositories)
● ADR-027 — Domain Events (app services publish events via outbox)
● ADR-032 — Unit of Work (app service method = unit of work)
● ADR-036 — Saga Readiness (saga orchestrator is a special app service)
● ADR-039 — Domain Exceptions (app services translate infra exceptions
to domain)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — application
service)
● Upstream PRD: PRD-002-section-6 (Enrollment use cases)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 103

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Downstream ERD: ERD-002 (Enrollment schema accessed via app
service)
● Downstream API Spec: API-002 (Enrollment API maps to app service
methods)
● Downstream Test Cases: TC-0040 (Application service orchestration
tests)
● External: Eric Evans — Domain-Driven Design, Chapter 5 (Application
Services)
● External: Vaughn Vernon — Implementing DDD, Chapter 14
(Application)
DECISION HISTORY
| Date       | Status | Actor            | Notes                 |
| ---------- | ------ | ---------------- | --------------------- |
| 2025-11-01 | Draft  | Enrollment       | Initial draft with 6  |
|            |        | Domain Architect | rules; expanded to    |
8 after review
| 2025-12-03 | Proposed | Enrollment       | Submitted to ARB  |
| ---------- | -------- | ---------------- | ----------------- |
|            |          | Domain Architect | after Enrollment  |
pilot
| 2025-12-24 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
187 use cases
refactored
| 2026-07-30 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)        |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Enrollment Domain Architect |     |
| ARB Chair   |     | ARB Chair                   |     |
| Approved On |     | 2026-07-30                  |     |
IMPLEMENTATION CHECKLIST
● Identify all use cases across 12 domains (Done — 187 use cases)
● Create Command/Result DTOs for each use case (Done — 187 pairs)
● Create application services with @Transactional methods (Done — 47
services)
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  104

PreOne ADR - Volume 2: Domain Architecture v3.0
● Refactor controllers to call app services (Done — PR #5001)
● Move business logic to domain services/aggregates (Done — 23 logic
moves)
● ArchUnit rules: @Transactional, complexity, method count (Done — CI
gate since V1.6.0)
● Remove @Transactional from controllers (Done — 5 controllers fixed)
● Training session for engineers (Done — 4 sessions delivered)
AD R -029
Validation
Volume 2 — Domain Architecture - Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Define the validation strategy for the PreOne platform. Validation is
layered: value objects validate in constructors (primary layer), aggregate
roots enforce invariants in methods (secondary layer), application services
validate commands (tertiary layer), and API controllers validate input
format (quaternary layer). Each layer fails fast and throws domain
exceptions (ADR-039). JSR-303 Bean Validation is used only at the API
boundary for format checks, not for business rules.
STATUS
Status Accepted
Date Decided 2026-01-07
Decision Owner Domain Architect — Student
Review Cadence Annual or on validation framework
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 105

PreOne ADR - Volume 2: Domain Architecture v3.0
Before ADR-029, PreOne's validation was inconsistent. Some validation was in
JSR-303 annotations (@Email, @NotNull) on DTOs, some in service methods (if
(email == null) throw ...), some in entity setters, and some in database
constraints (NOT NULL, CHECK). The result was duplicated validation (the
same email format check in 4 places), inconsistent error messages (different
messages for the same failure), and validation gaps (some paths validated,
others did not). A student with a malformed email could be created via the API
(which had @Email) but not via the batch import (which did not). The Student
Domain Architect led a 3-week refactoring to layer validation. The new
strategy: value objects (EmailAddress, PhoneNumber) validate in constructors
— this is the primary layer, and it is always enforced because value objects
cannot be constructed invalid. Aggregate roots (Student) enforce invariants in
methods (deactivate() checks unpaid fees) — this is the secondary layer.
Application services validate commands (ConfirmEnrollmentCommand has a
non-null enrollmentId) — this is the tertiary layer. API controllers validate input
format (JSON parses correctly, required fields present) — this is the quaternary
layer. This ADR codifies the validation rules. ArchUnit tests verify that
validation is in the correct layer.
BUSINESS DRIVERS
The primary driver is consistency: the same validation in one place (the value
object constructor) ensures it is always enforced, regardless of entry point. The
secondary driver is fail-fast: invalid input is rejected at the earliest possible
layer, producing clear error messages and avoiding deep stack traces. The
tertiary driver is security: validation prevents injection attacks (malformed
emails, SQL injection strings) at the boundary, before they reach the database.
A fourth driver is developer experience: layered validation produces clear error
messages that point to the specific field and rule that failed, helping API
consumers correct their input. A fifth driver is testability: validation in value
objects is unit-testable without Spring context, making tests fast and reliable.
PROBLEM STATEMENT
PreOne's validation is scattered across JSR-303 annotations, service methods,
entity setters, and database constraints, causing duplication, inconsistency,
and gaps. We must define a layered validation strategy that centralises
validation in value objects and aggregates, with API-layer format checks as a
supplementary layer.
CONSTRAINTS
● Value objects validate in constructors (primary layer, always enforced)
● Aggregate roots enforce invariants in methods (secondary layer)
● Application services validate command structure (tertiary layer)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 106

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● API controllers validate input format via JSR-303 (quaternary layer,
format only)
● Business rule validation is NOT in JSR-303 annotations (JSR-303 is for
format only)
ASSUMPTIONS
● Value object constructor validation is sufficient for value-level rules
(email format, non-negative money)
● Aggregate root methods are the correct place for invariant
enforcement (cannot deactivate student with unpaid fees)
● JSR-303 is adequate for API-layer format checks (non-null, length,
regex)
● Database constraints (NOT NULL, CHECK, UNIQUE) are a last-resort
safety net, not the primary validation
● Domain exceptions (ADR-039) are the correct error mechanism for
validation failures
OPTIONS CONSIDERED
| Option          | Pros                 | Cons                | Verdict |
| --------------- | -------------------- | ------------------- | ------- |
| Layered         | Consistent; fail-    | Engineers must      | Chosen  |
| validation: VO  | fast; testable; no   | learn the layers;   |         |
| constructors +  | duplication; aligns  | some validation is  |         |
| aggregate       | with DDD and         | duplicated across   |         |
| methods +       | Clean                | layers (by design,  |         |
| command + API   | Architecture.        | for defense in      |         |
| format (chosen) |                      | depth); JSR-303 is  |         |
restricted to
format.
| JSR-303          | Familiar;        | Cannot express   | Rejected |
| ---------------- | ---------------- | ---------------- | -------- |
| everywhere (pre- | declarative;     | business rules   |          |
| ADR-029 state)   | Spring support;  | (e.g., 'cannot   |          |
|                  | one framework.   | deactivate with  |          |
unpaid fees');
validation at field-
set time (not
construction);
runtime (not
compile-time);
inconsistent
enforcement.
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  107

PreOne ADR - Volume 2: Domain Architecture v3.0
Option Pros Cons Verdict
Validation only in Single source of Error messages Rejected
database truth; always are SQL errors
constraints enforced; no (opaque);
application code. validation too late
(after business
logic); cannot
express cross-field
rules; poor UX.
Validation in Full flexibility; can Duplicated across Rejected
service methods express any rule; services;
(imperative) familiar. inconsistent; hard
to test; scattered;
pre-ADR-029 state
for some logic.
DECISION
ADOPTED
Adopt the following validation rules enforced via ArchUnit: (1) Value objects
validate in constructors — throw DomainException (ADR-039) on invalid
input; this is the primary layer, always enforced. (2) Aggregate roots
enforce invariants in methods — throw DomainException on invariant
violation; this is the secondary layer. (3) Application services validate
command structure — non-null fields, valid IDs; throw DomainException on
invalid command. (4) API controllers use JSR-303 (@NotNull, @Size,
@Pattern) for format checks only — not for business rules. (5) Business rule
validation (e.g., 'email must be unique per school') is in domain services or
aggregate methods, NOT in JSR-303. (6) Database constraints (NOT NULL,
CHECK, UNIQUE) are a last-resort safety net — they should never be the
primary validation, but they catch bugs that bypass application validation.
(7) Validation errors are domain exceptions with clear messages — the API
layer translates to HTTP 400 with field-level error details.
DETAILED RATIONALE
The chosen option is the only one that produces consistent, fail-fast, testable
validation. JSR-303 everywhere (option 2) was the pre-ADR-029 state and
produced the inconsistency and gap problems. Database-only validation (option
3) is too late and produces opaque errors. Service-method validation (option 4)
is duplicated and inconsistent. Rule (1) — value objects validate in constructors
— is the foundation. An EmailAddress constructed with 'not-an-email' throws
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 108

PreOne ADR - Volume 2: Domain Architecture v3.0
immediately; the rest of the system never sees an invalid EmailAddress. This is
'parse, don't validate' — the type system guarantees validity. ArchUnit verifies
that @Embeddable classes (value objects) throw in constructors for invalid
input (via test coverage check). Rule (2) — aggregate roots enforce invariants
— handles rules that span multiple fields or entities. The 'cannot deactivate a
student with unpaid fees' rule requires checking the Student's fee status, which
is in the Student aggregate (or a related aggregate). The deactivate() method
on Student throws if the invariant is violated. This is the secondary layer
because it depends on aggregate state, not just constructor input. Rule (3) —
application services validate commands — ensures the command is well-formed
before invoking the aggregate. ConfirmEnrollmentCommand must have a non-
null enrollmentId and a non-null confirmedBy. This is a structural check, not a
business rule — the command must be processable. ArchUnit verifies that
command DTOs have validation (either JSR-303 on fields or explicit checks in
the app service method). Rule (4) — API controllers use JSR-303 for format — is
the quaternary layer. The controller checks that the JSON field 'email' is
present and matches a regex, before constructing the EmailAddress value
object. This is defense in depth — the regex catches most malformed emails
before the value object constructor, producing a 400 response with a clear
message. JSR-303 is restricted to format (non-null, length, regex); business
rules are not in JSR-303. Rule (5) — business rules not in JSR-303 — is critical.
A rule like 'email must be unique per school' requires a database query, which
JSR-303 cannot do (it is a stateless annotation). This rule is in the Student
domain service (or aggregate method), which queries the repository for
existing emails. JSR-303 annotations that try to express business rules (e.g., a
custom @UniqueEmail validator) are prohibited because they couple the DTO
to the repository, violating layering. Rule (6) — database constraints as safety
net — acknowledges that application validation can have bugs. A NOT NULL
constraint catches a bug where a code path skips the application validation. A
UNIQUE constraint catches a race condition where two concurrent requests
pass the 'unique email' check. Database constraints do not replace application
validation; they supplement it. Rule (7) — domain exceptions with clear
messages — ensures consistent error reporting. A validation failure throws
InvalidEmailException (a domain exception) with a message like 'Email address
is malformed: not-an-email'. The API layer catches domain exceptions and
translates to HTTP 400 with a JSON error body: {"field": "email", "message":
"Email address is malformed: not-an-email"}. This gives API consumers
actionable feedback.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Validation Layers
(Defense in Depth) | | | | Layer
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 109

PreOne ADR - Volume 2: Domain Architecture v3.0
4: API Controller (JSR-303, format only) | |
+----------------------------------------------------------+ | | | @NotNull, @Size, @Pattern on
DTO fields | | | | Catches: missing fields, wrong length, malformed
format | | | | Returns: HTTP 400 with field errors | | |
+--------------------------+-------------------------------+ | | | passes
| | Layer 3: Application Service (command structure) | |
+----------------------------------------------------------+ | | | Non-null IDs, valid command
shape | | | | Catches: null enrollmentId, missing confirmedBy
| | | | Throws: InvalidCommandException (domain exception) | | |
+--------------------------+-------------------------------+ | | | passes
| | Layer 2: Aggregate Root (invariant enforcement) | |
+----------------------------------------------------------+ | | | deactivate(): check unpaid fees
| | | | confirm(): check enrollment is pending | | | | Catches:
business rule violations | | | | Throws:
InvariantViolationException (domain exception) | | | +--------------------------
+-------------------------------+ | | | passes | | Layer
1: Value Object (constructor validation, PRIMARY) | |
+----------------------------------------------------------+ | | | EmailAddress("not-an-email") ->
throws | | | | Money(-100, INR) -> throws | | | |
Catches: invalid values (format, range, type) | | | | Throws:
InvalidValueException (domain exception) | | | +--------------------------
+-------------------------------+ | | | passes | | Layer
0: Database Constraints (safety net) | |
+----------------------------------------------------------+ | | | NOT NULL, CHECK, UNIQUE
| | | | Catches: bugs that bypass app validation | | | | Throws:
SQLException (translated to domain exception) | | |
+----------------------------------------------------------+ | |
| | ArchUnit: | | - @Embeddable classes:
constructor throws on invalid (test) | | - @RestController DTOs: JSR-303 for
format only | | - No JSR-303 custom validators that query repository
| | - @AggregateRoot methods: throw on invariant violation |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Client Controller App Service Aggregate VO Ctor |
| | | | |--POST student--->| | |
| | {email:"bad"} | | | | | |
| | | | (Layer 4: JSR-303 format check) | |
| | |--@Pattern fails | | | |<--400 Bad Request|
| | | | {field:email, | | | | |
msg:malformed} | | | | | | |
| | | (if Layer 4 passes, e.g., email="a@b.com") | | |--
POST student--->| | | | | |--create
cmd----->| | | | | | | |
| | (Layer 3: command structure) | | | |
|--check non-null | | | | | fields | |
| | | | | | | |--
student.create(...) | | | | | | |
| | (Layer 1: VO ctor) | | | | |--
new EmailAddr | | | | | ("a@b.com") | |
| | | --validate | | | | | --OK
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 110

PreOne ADR - Volume 2: Domain Architecture v3.0
| | | | |<--email VO | | | |
| | | | | |--new Student | | |
| | (factory) | | | |<--student-------| | |
| | | | | | |--repo.save(student)
| | | | | | | | |
(Layer 0: DB constraint) | | | | |--INSERT
| | | | | (UNIQUE check)| | |
|<--saved---------| | | | | | | |
|<--Result---------| | | |<--201 Created----| |
| |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Validation Components by Layer
| | | | Layer 4: API Controller
| | +---------------------+ +---------------------+ | | | CreateStudentDTO | |
JSR-303 Annotations | | | | - @NotNull name | | @NotNull, @Size, |
| | | - @Pattern email | | @Pattern | | | | - @NotNull dob | |
(format only) | | | +---------------------+ +---------------------+ | |
| | Layer 3: Application Service | | +---------------------+
+---------------------+ | | | CreateStudentCmd | | CommandValidator |
| | | - name: String | | +validate(cmd) | | | | - email: String | |
checks non-null | | | | - dob: LocalDate | | fields | | | | -
branchId: UUID | +---------------------+ | | +---------------------+
| | | | Layer 2: Aggregate Root
| | +---------------------+ | | | Student (root) | Invariants in
methods: | | | +deactivate() | - no unpaid fees to deactivate | | |
+updateEmail() | - valid email format (delegated | | | +transferToBranch() |
to EmailAddress VO) | | +---------------------+ - not mid-enrollment to
transfer| | | | Layer 1: Value Object
(PRIMARY) | | +---------------------+ +---------------------+ | | |
EmailAddress | | Money | | | | - value: String | | - amount:
BigDec | | | | (ctor validates) | | - currency: Currency| | | | throws
if malformed | | (ctor validates) | | | +---------------------+ | throws if
negative | | | +---------------------+ | |
| | Layer 0: Database Constraints (safety net) | | +---------------------+
| | | students table | NOT NULL, CHECK, UNIQUE | | | - email
UNIQUE | (catches app validation bugs) | | | - name NOT NULL |
| | | - dob CHECK (>1900) | | | +---------------------+
| +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Input: {"email": "not-an-email", "name": "John"} | v +----+-----+ |
Layer 4 | JSR-303 @Pattern on email field | API | --fails: "email must match
regex" +----+-----+ | +--FAIL--> HTTP 400 {field:email, msg:...} |
v (if passes, e.g., "a@b.com") +----+-----+ | Layer 3 | App service checks
command structure | App Svc | --passes (all fields non-null) +----+-----+ |
v +----+-----+ | Layer 1 | EmailAddress constructor | VO Ctor | --validates
format (MX record check optional) +----+-----+ | +--FAIL--> throw
InvalidEmailException -> HTTP 400 | v (if valid) +----+-----+ | Layer 2 |
Student.create() factory | Agg | --enforces creation invariants | Root | --
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 111

PreOne ADR - Volume 2: Domain Architecture v3.0
e.g., branch must exist (checked via domain svc) +----+-----+ | +--FAIL--
> throw InvariantViolation -> HTTP 400 | v (if passes) +----+-----+ |
Layer 0 | DB INSERT | DB | --UNIQUE constraint on email +----+-----+
| +--FAIL--> SQLException -> translated to HTTP 409 | v (if passes)
+----+-----+ | Created | HTTP 201 Created +----------+
DATABASE IMPACT
Database constraints are the safety net (Layer 0). Every table has NOT NULL
on required columns, CHECK constraints for range validation (e.g.,
date_of_birth > '1900-01-01'), and UNIQUE constraints for uniqueness (e.g.,
email unique per school). These constraints catch bugs that bypass application
validation (e.g., a batch import that skips VO construction). Flyway migrations
enforce these constraints; ArchUnit verifies that every entity field has a
corresponding database constraint (NOT NULL for non-optional fields, CHECK
for range-validated fields). The constraints are documented in the ERD per
entity.
API IMPACT
API controllers use JSR-303 for format validation (Layer 4). The
CreateStudentDTO has @NotNull on name, @Pattern on email, @Past on
dateOfBirth. JSR-303 validation runs before the controller method body; if it
fails, Spring returns 400 with field-level errors automatically. Business rule
validation (e.g., 'email unique per school') is not in JSR-303 — it is in the
application service or aggregate, and failures are returned as domain
exceptions translated to 400 or 409. The API error response format is
standardised: {"field": "email", "message": "...", "code": "INVALID_EMAIL"}.
UI IMPACT
UI forms perform client-side validation matching the server-side JSR-303 rules
(e.g., email regex, required fields). Client-side validation improves UX
(immediate feedback) but is not trusted — the server validates again. UI forms
display field-level errors from the API response (e.g., 'Email is malformed'). For
business rule errors (e.g., 'Email already exists for this school'), the UI displays
the error in a non-field-specific location (e.g., a banner) because it is not a
format error.
SECURITY IMPACT
Validation is the first line of defence against injection attacks. EmailAddress
validates format, preventing email header injection. PhoneNumber validates
format, preventing SMS injection. Money validates non-negative, preventing
negative-amount fraud. The 'parse, don't validate' principle (value objects)
ensures invalid input cannot exist in the system — it is rejected at construction.
Database constraints (Layer 0) catch injection that bypasses application
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 112

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
validation (e.g., a stored procedure that constructs SQL from unvalidated input
— but PreOne prohibits stored procedures per ADR-026).
PERFORMANCE IMPACT
Layered   validation   has   minimal   performance   overhead.   Value   object
construction is microseconds. JSR-303 validation is milliseconds (reflection-
based). Database constraints are enforced on INSERT/UPDATE, adding
negligible overhead. The fail-fast principle (reject invalid input early) improves
performance by avoiding wasted work on invalid requests. Overall, layered
validation has no measurable performance impact vs single-layer validation.
SCALABILITY ANALYSIS
Validation scales linearly — it is stateless and per-request. Value object
construction allocates objects, which is a minor GC pressure, but negligible at
PreOne's scale. JSR-303 validation uses reflection, which has a small overhead,
but Spring caches validators. Database constraints scale with the database.
The layered approach does not introduce scalability bottlenecks; it improves
scalability by rejecting invalid requests early, reducing database load.
OPERATIONAL CONSIDERATIONS
Validation failures are observable via metrics: validation.error.count (per layer,
per exception type), validation.error.field (per field, for UI improvement). High
validation error rates indicate either API misuse (clients sending invalid input)
or a UX issue (UI not guiding users). The quarterly architecture scorecard
audits validation error rates per endpoint — high rates trigger a review of the
API contract or UI guidance. ArchUnit reports track validation rule compliance
(JSR-303 only for format, business rules in domain).
RISKS
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Engineers put      | Medium     | Medium | ArchUnit blocks     |
| business rules in  |            |        | custom JSR-303      |
| JSR-303 custom     |            |        | validators that     |
| validators         |            |        | import Repository;  |
code review;
training
| Validation is      | Low | Low | Value objects are   |
| ------------------ | --- | --- | ------------------- |
| duplicated across  |     |     | the primary layer;  |
| layers             |     |     | other layers are    |
| inconsistently     |     |     | defense-in-depth;   |
quarterly audit of
validation
consistency
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  113

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Database           | Medium     | Medium | Flyway migrations   |
| constraints and    |            |        | and entity classes  |
| application        |            |        | are reviewed        |
| validation diverge |            |        | together;           |
ArchUnit verifies
entity fields have
DB constraints
| Validation error    | Medium | Medium | Standard error       |
| ------------------- | ------ | ------ | -------------------- |
| messages are not    |        |        | response format;     |
| actionable for API  |        |        | field-level errors;  |
| consumers           |        |        | quarterly review     |
of error message
quality
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Consistent validation (one place per  Multiple layers (some duplication by
| rule) |     | design) |     |
| ----- | --- | ------- | --- |
Fail-fast (reject invalid input early) Engineers must learn the layers
Testable (VO validation is unit-testable) JSR-303 restricted to format (cultural
shift)
Defense in depth (DB constraints as  Validation overhead across layers
| safety net) |     | (negligible) |     |
| ----------- | --- | ------------ | --- |
REJECTED ALTERNATIVES
JSR-303 everywhere (option 2) was the pre-ADR-029 state. Three issues: (1) a
'unique email per school' rule was implemented as a custom @UniqueEmail
JSR-303 validator that queried the repository, coupling the DTO to the
repository and violating layering; (2) the same email format rule was in
@Pattern on the DTO, in a service method, and in a database CHECK
constraint, with three different error messages; (3) a batch import path skipped
JSR-303 (no Spring MVC), allowing invalid emails into the database. Database-
only validation (option 3) was rejected because SQL errors are opaque (e.g.,
'violates unique constraint students_email_key' does not tell the user which
field). Service-method validation (option 4) was rejected because it was
duplicated across 7 services that created students, with inconsistent rules.
MIGRATION PLAN
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  114

PreOne ADR - Volume 2: Domain Architecture v3.0
Phase 1 (complete): Identify all validation rules across 12 domains. Phase 2
(complete): Move value-level rules to value object constructors — 47 value
objects with constructor validation. Phase 3 (complete): Move invariant rules to
aggregate methods — 87 invariants enforced. Phase 4 (complete): Restrict
JSR-303 to format checks on DTOs — 23 custom validators removed. Phase 5
(complete): ArchUnit rules enforced in CI. Phase 6 (Q4 2026): Training session
for new engineers (ongoing).
TESTING STRATEGY
Validation rules are tested at each layer. Unit tests: value objects test
constructor validation (valid input succeeds, invalid input throws with correct
message). Aggregate tests: aggregate methods test invariant enforcement.
Application service tests: command validation is tested with invalid commands.
API tests: JSR-303 validation is tested via MockMvc with invalid JSON.
Integration tests: database constraints are tested via Testcontainers (INSERT
with invalid data fails). Contract tests: validation error response format is
verified. Property-based tests: value objects have property tests (e.g.,
EmailAddress accepts all valid RFC 5322 addresses).
MONITORING & OBSERVABILITY
Validation metrics: validation.error.count (per layer: VO, aggregate, app
service, API, DB), validation.error.field (per field, for UX improvement),
validation.error.type (per exception type). Dashboards in Grafana: validation
error rate per endpoint, top validation errors by field. Alerts: validation error
rate >10% on an endpoint (indicates API misuse or UX issue). The quarterly
architecture scorecard reviews validation error rates and message quality.
FUTURE EVOLUTION
Two evolutions are likely. First, Java 21 records may be adopted for command
DTOs, reducing boilerplate while preserving JSR-303 compatibility. Second, a
future rules engine (ADR-030) may externalise some business rule validation to
declarative rules, but value object and aggregate validation remain in code.
Third, schema-based validation (JSON Schema) may be adopted for API
contracts, complementing JSR-303 — but this would be an API-layer concern,
not a domain-layer change.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity drives
validation)
● ADR-003 — Clean Architecture (validation in domain layer, not
infrastructure)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 115

PreOne ADR - Volume 2: Domain Architecture v3.0
● ADR-004 — Domain Driven Design (validation in aggregates and value
objects)
● ADR-008 — SOLID Enforcement (SRP: each layer has one validation
responsibility)
● ADR-022 — Aggregate Rules (aggregates enforce invariants)
● ADR-023 — Entity Rules (entities validate in factory methods)
● ADR-024 — Value Objects (VO constructors validate — primary layer)
● ADR-028 — Application Services (app services validate commands)
● ADR-030 — Business Rule Engine (future host for complex business
rules)
● ADR-039 — Domain Exceptions (validation failures throw domain
exceptions)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — validation in
domain)
● Upstream PRD: PRD-002-section-7 (Student validation requirements)
● Downstream ERD: ERD-001 (Student schema with NOT NULL, CHECK,
UNIQUE constraints)
● Downstream API Spec: API-001 (Student API validation rules and error
responses)
● Downstream Test Cases: TC-0041..TC-0043 (Validation layer, VO,
aggregate, API tests)
● External: Eric Evans — Domain-Driven Design (Validation in domain
model)
● External: 'Parse, don't validate' — Alexis King (validation strategy)
DECISION HISTORY
Date Status Actor Notes
2025-11-08 Draft Student Domain Initial draft with 5
Architect rules; expanded to
7 after review
2025-12-10 Proposed Student Domain Submitted to ARB
Architect after Student pilot
2026-01-07 Accepted ARB Chair ARB approved; 47
VOs, 87 invariants
enforced
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 116

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Date       | Status   | Actor     | Notes          |
| ---------- | -------- | --------- | -------------- |
| 2026-08-01 | Accepted | ARB Chair | v3.0 refresh;  |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)     |     |
| ----------- | --- | ------------------------ | --- |
| Tech Lead   |     | Student Domain Architect |     |
| ARB Chair   |     | ARB Chair                |     |
| Approved On |     | 2026-08-01               |     |
IMPLEMENTATION CHECKLIST
● Identify all validation rules across 12 domains (Done — 234 rules)
● Move value-level rules to VO constructors (Done — 47 VOs with
validation)
● Move invariant rules to aggregate methods (Done — 87 invariants)
● Restrict JSR-303 to format checks on DTOs (Done — 23 custom
validators removed)
● Add database constraints as safety net (Done — Flyway V1.7.0)
● ArchUnit rules: no JSR-303 with Repository, VO ctor throws (Done — CI
gate since V1.7.0)
● Standardise error response format (Done — preone-api-errors v1.0.0)
● Training session for engineers (Done — 4 sessions delivered)
AD R -030
Business Rule Engine
Volume 2 — Domain Architecture  -  Pattern
ACCEPTED
DECISION SUMMARY
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  117

PreOne ADR - Volume 2: Domain Architecture v3.0
DECISION
Adopt a hybrid business rule engine strategy: simple rules are encoded in
aggregate methods and domain services (code-based), while complex,
frequently-changing rules are externalised to a declarative rule store
(YAML files in a rules repository) evaluated by a lightweight rule engine.
The rule engine is invoked by domain services; rules are versioned, tested,
and auditable.
STATUS
Status Accepted
Date Decided 2026-01-14
Decision Owner Domain Architect — Billing
Review Cadence Annual or on rule complexity
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-030, all business rules were in code. Most rules were simple (e.g.,
'GST rate is 18% for educational services') and code was appropriate. But some
rules changed frequently (e.g., discount eligibility criteria, fee waiver rules for
siblings) and required code changes, deployments, and release coordination for
what were essentially configuration changes. The Billing team made 23 code
changes in Q4 2025 for rule adjustments, each requiring a full CI/CD cycle (4
hours) and release window coordination. The Billing Domain Architect
evaluated three options: (1) keep all rules in code, (2) adopt a full rules engine
(Drools, Easy Rules), (3) adopt a hybrid approach with a lightweight rule store
for complex/frequent-change rules. The evaluation found that option 1 was too
slow for business agility, option 2 was overkill (Drools adds 50MB to the
deployment and requires learning DRL syntax), and option 3 balanced agility
and simplicity. The hybrid approach: simple rules (e.g., GST rate) stay in code
(TaxDomainService). Complex, frequently-changing rules (e.g., sibling discount
eligibility) move to a YAML rule store (rules/billing/sibling-discount.yml)
evaluated by a lightweight rule engine (preone-rules-engine, a custom 500-line
library). Rules are versioned, tested, and auditable. The Billing team can
change a rule by editing YAML and deploying (1 hour cycle, no code change).
This ADR codifies the hybrid strategy. ArchUnit tests verify that rules in the
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 118

PreOne ADR - Volume 2: Domain Architecture v3.0
rule store are tested and that code-based rules are not duplicated in the rule
store.
BUSINESS DRIVERS
The primary driver is business agility: rules that change frequently (discount
eligibility, fee waivers, promotional offers) should be changeable without code
deployment. The secondary driver is separation of concerns: business analysts
can author rules in YAML without engineering involvement, reducing the
engineering bottleneck. The tertiary driver is auditability: rule changes are
versioned in Git, producing an audit trail of who changed what rule and when.
A fourth driver is testability: rules in YAML are tested independently of the
application code, enabling rule-specific test suites. A fifth driver is A/B testing:
different rule versions can be evaluated in parallel (e.g., a new discount rule for
a pilot school) without code branching.
PROBLEM STATEMENT
PreOne's business rules are all in code, making frequent rule changes slow
(code change, deploy, release coordination) and coupling business analysts to
engineering. We must define a hybrid rule engine strategy that externalises
complex, frequently-changing rules to a declarative store while keeping simple
rules in code.
CONSTRAINTS
● Simple, stable rules stay in code (domain services, aggregate methods)
● Complex, frequently-changing rules move to YAML rule store
● Rule store is versioned in Git (rules/ repository)
● Rule engine is lightweight (preone-rules-engine, <1000 lines)
● Rules are tested (each rule has a test case in the rules test suite)
ASSUMPTIONS
● YAML is sufficiently expressive for PreOne's complex rules (no need for
DRL or DSL)
● Business analysts can learn YAML rule syntax (with tooling support)
● The rule engine evaluation overhead (<1ms per rule) is acceptable
● Rules in YAML can be hot-reloaded (no application restart for rule
changes)
● Rule changes are reviewed by the Domain Architect (not arbitrary
edits)
OPTIONS CONSIDERED
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 119

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Option            | Pros               | Cons                | Verdict |
| ----------------- | ------------------ | ------------------- | ------- |
| Hybrid: code for  | Agility for        | Two rule            | Chosen  |
| simple, YAML for  | frequent changes;  | mechanisms (code    |         |
| complex (chosen)  | separation of      | and YAML);          |         |
|                   | concerns;          | engineers must      |         |
|                   | auditability;      | decide where to     |         |
|                   | testability;       | put a rule; YAML    |         |
|                   | lightweight        | syntax learning     |         |
|                   | engine; aligns     | curve for analysts. |         |
with PreOne's
scale.
| All rules in code  | Simple; one     | Slow for frequent  | Rejected |
| ------------------ | --------------- | ------------------ | -------- |
| (pre-ADR-030       | mechanism;      | changes; couples   |          |
| state)             | familiar; type  | analysts to        |          |
|                    | safety; IDE     | engineering; no    |          |
|                    | support.        | hot-reload; 23     |          |
deploys in Q4
2025 for rule
changes.
Full rules engine  Powerful; mature;  50MB deployment  Rejected
| (Drools) | expressive DRL;   | overhead; DRL    |     |
| -------- | ----------------- | ---------------- | --- |
|          | tooling support;  | learning curve;  |     |
|          | audit trail.      | overkill for     |     |
PreOne's rule
complexity;
operational
complexity (KIE
workbench).
Database-stored  No deployment for  No version control  Rejected
| rules with admin  | rule changes;      | (rules in DB, not  |     |
| ----------------- | ------------------ | ------------------ | --- |
| UI                | admin UI for       | Git); no code      |     |
|                   | analysts; runtime  | review; hard to    |     |
|                   | editing.           | test; risk of      |     |
untested rules in
production; audit
trail requires
custom build.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  120

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following business rule engine rules: (1) Simple, stable rules (e.g.,
GST rate, rounding rules) stay in code — domain services or aggregate
methods. (2) Complex, frequently-changing rules (e.g., discount eligibility,
fee waivers, promotional offers) move to YAML rule store
(rules/<domain>/<rule-name>.yml). (3) The rule store is versioned in Git
(preone-rules repository); rule changes are PRs reviewed by the Domain
Architect. (4) The rule engine (preone-rules-engine) is a lightweight library
(<1000 lines) that evaluates YAML rules against a fact context. (5) Each
rule has a test case in the rules test suite (rules-test/); CI runs the suite on
every rule PR. (6) Rules are hot-reloadable — the rule engine watches the
rules/ directory and reloads on change (no application restart). (7) Rule
evaluation is invoked by domain services (not application services or
controllers) — the domain service calls ruleEngine.evaluate(ruleName,
facts). (8) Rule changes are auditable — the rule engine logs the rule
version evaluated for each decision.
DETAILED RATIONALE
The chosen option is the only one that balances agility and simplicity at
PreOne's scale. All rules in code (option 2) was the pre-ADR-030 state and was
too slow for business agility. Full rules engine (option 3) is overkill — Drools
adds 50MB to the deployment, requires learning DRL syntax, and the KIE
workbench is operational complexity PreOne does not need. Database-stored
rules (option 4) sacrifice version control and code review, which are critical for
audit and quality. Rule (1) — simple rules in code — acknowledges that not all
rules benefit from externalisation. A rule like 'GST rate is 18% for educational
services' changes once a year (when the government changes it); externalising
it to YAML adds overhead without benefit. Code is the right place for stable
rules — it has type safety, IDE support, and is unit-tested. Rule (2) — complex
rules in YAML — targets the rules that change frequently. The sibling discount
eligibility rule (e.g., 'second child gets 10% discount if both children are
enrolled in the same branch, the first child is not on scholarship, and the family
income is below X') changes every quarter as the business tunes the discount
strategy. Externalising to YAML enables a business analyst to change the rule
(e.g., add a 'third child gets 15% discount' clause) without engineering
involvement. Rule (3) — Git-versioned rule store — provides auditability and
code review. Every rule change is a PR, reviewed by the Domain Architect. The
Git history shows who changed what rule and when — critical for audit (e.g.,
'why was this discount applied in March 2026?' — the rule version at that time
is in Git). This is superior to database-stored rules, which have no version
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 121

PreOne ADR - Volume 2: Domain Architecture v3.0
history without custom audit infrastructure. Rule (4) — lightweight rule engine
— is a custom library (preone-rules-engine, <1000 lines). It evaluates YAML
rules against a fact context (a Map<String, Object>). The YAML syntax is
simple: conditions (when: clauses) and actions (then: clauses). The engine
supports basic operators (==, !=, <, >, in, contains) and functions (date_range,
age_at, sum). The engine is intentionally not Turing-complete — it cannot loop
or recurse, preventing complex logic from creeping into rules. Rule (5) — rule
test suite — ensures rule changes are validated. Each rule has a test case
(rules-test/<domain>/<rule-name>.test.yml) with input facts and expected
output. CI runs the suite on every rule PR, preventing a rule change from
breaking behaviour. This is critical because rules are authored by analysts (not
engineers) and may have unintended consequences. Rule (6) — hot-reloadable
— enables rapid iteration. The rule engine watches the rules/ directory (via Java
NIO WatchService) and reloads rules on file change. In production, rule
changes are deployed via a config map update (Kubernetes) which updates the
mounted rules/ directory, triggering a hot reload. No application restart is
needed. This reduces the rule change cycle from 4 hours (code deploy) to 15
minutes (PR review + config map update). Rule (7) — invoked by domain
services — keeps the rule engine in the domain layer. The
DiscountDomainService calls ruleEngine.evaluate('sibling-discount', facts) —
the application service and controller do not know about the rule engine. This
maintains the layering (ADR-006) and allows the rule engine to be substituted
(e.g., a future Drools migration) without changing application services. Rule
(8) — auditable — ensures every decision can be traced to the rule version that
produced it. The rule engine logs: rule name, rule version (Git SHA), facts,
decision. This log is the audit trail for rule-based decisions — critical for
compliance (e.g., 'why was this family denied a discount?') and for debugging
('why is this discount calculated incorrectly?').
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Hybrid Business Rule
Engine | | | | Code-based
Rules (simple, stable) | |
+----------------------------------------------------------+ | | | TaxDomainService (domain
service) | | | | + calculateGST(Money, GSTCategory): Money
| | | | // GST rate is 18% for educational services | | | | // Stable,
changes once a year | | | | return amount.multiply(0.18);
| | | +----------------------------------------------------------+ | |
| | YAML Rule Store (complex, frequent change) | |
+----------------------------------------------------------+ | | | rules/billing/sibling-discount.yml
| | | | name: sibling-discount | | | | version: 1.3
| | | | when: | | | | -
enrolled_children_in_branch >= 2 | | | | - first_child.scholarship
== false | | | | - family.income < 500000 | | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 122

PreOne ADR - Volume 2: Domain Architecture v3.0
| then: | | | | - discount_percentage: 10
| | | | - applies_to: second_child | | |
+----------------------------------------------------------+ | |
| | Rule Engine (preone-rules-engine, <1000 lines) | |
+----------------------------------------------------------+ | | | ruleEngine.evaluate(ruleName,
facts): Decision | | | | 1. Load rule from rules/ directory |
| | | 2. Evaluate 'when' conditions against facts | | | | 3. If all
conditions pass, return 'then' actions | | | | 4. Log: rule name, version,
facts, decision | | | | (hot-reloadable via NIO WatchService)
| | | +----------------------------------------------------------+ | |
| | Invocation (from domain service) | |
+----------------------------------------------------------+ | | | DiscountDomainService
| | | | + calculateDiscount(enrollment, family): Money | | | | facts = {
enrolled_children: ..., first_child: ... } | | | | decision =
ruleEngine.evaluate('sibling-discount', | | | | facts)
| | | | return enrollment.fee.multiply( | | | |
decision.discount_percentage / 100) | | |
+----------------------------------------------------------+ | |
| | CI Pipeline (rule tests) | |
+----------------------------------------------------------+ | | | rules-test/billing/sibling-
discount.test.yml | | | | - facts: { enrolled: 2, scholarship: false,
income: 400k}| | | expected: { discount: 10 } | | | | - facts:
{ enrolled: 1, ... } | | | | expected: { discount: 0 }
| | | | CI runs on every rule PR | | |
+----------------------------------------------------------+ |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
App Service Domain Service Rule Engine Rules Dir |
| | | |--calcDiscount----->| | | |
(enrollment, | | | | family) | |
| | |--build facts map | | | | {enrolled: 2,
| | | | scholarship: F, | | | |
income: 400k} | | | | | | |
|--evaluate( | | | | 'sibling-disc', | | |
| facts)--------->| | | | |--load rule------>| |
| |<--YAML-----------| | | | | |
| |--eval conditions | | | | (enrolled >= 2? |
| | | scholarship=F? | | | |
income<500k?) | | | | | | |
|--all pass: | | | | return {disc:10}| | |
| | | | |--log decision | | |
| (rule v1.3, | | | | facts, result) | | |
| | | |<--decision--------| | | |
| | | |--compute discount | | | |
fee * 10% = X | | | | | | |<--
discount---------| | | | | | |
| (rule change scenario) | | | | |
| | (analyst edits YAML, opens PR) | | |
| | | CI runs rule test suite | | | (tests
pass) | | | Domain Architect reviews | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 123

PreOne ADR - Volume 2: Domain Architecture v3.0
| PR merged | | | | |
| | | |<--file changed---| | | |
(WatchService) | | | |--hot reload rule | |
| | (no restart) |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Business Rule Engine Components
| | | | Rule Store (Git: preone-rules)
| | +---------------------+ +---------------------+ | | | rules/billing/ | | rules-
test/billing/ | | | | sibling-discount.yml| | sibling-discount | | | |
early-bird.yml | | .test.yml | | | | staff-discount.yml | | early-
bird.test.yml | | | +---------------------+ +---------------------+ | |
| | Rule Engine (preone-rules-engine library) | | +---------------------+
+---------------------+ | | | RuleEngine | | RuleLoader | | | |
+evaluate(name, |-->| +loadFromDir(path) | | | | facts): Decision | |
+watchAndReload() | | | +---------------------+ +---------------------+ | |
| | +---------------------+ +---------------------+ | | | ConditionEvaluator | |
DecisionLogger | | | | +eval(when, facts) | | +log(rule, version, | |
| | : boolean | | facts, decision) | | | +---------------------+
+---------------------+ | | | | Domain
Service (invoker) | | +---------------------+
| | | DiscountDomainSvc | facts = { | | | +calculateDiscount()|
enrolled_children: ..., | | | (builds facts, | first_child: ..., | | |
calls engine, | family: { income: ... } | | | returns Money) | }
| | +---------------------+ | |
| | Code-based Rules (stable, in domain services) | | +---------------------+
+---------------------+ | | | TaxDomainService | | RoundingDomainSvc |
| | | +calculateGST() | | +round(Money) | | | | (GST 18%, stable) |
| (banker's rounding)| | | +---------------------+ +---------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Business Analyst edits rule | v +----+-----+ | YAML |
rules/billing/sibling-discount.yml | Edit | (version 1.3 -> 1.4: add third-child
clause) +----+-----+ | |--commit to Git, open PR v +----+-----+ | CI
| --run rule test suite | Pipeline| --rules-test/billing/sibling-discount.test.yml
+----+-----+ | +--FAIL--> block PR, notify analyst | v (if tests
pass) +----+-----+ | Domain | --review rule change | Architect| --verify
business intent +----+-----+ | |--approve, merge PR v +----+-----+ |
Deploy | --update config map (Kubernetes) | | --rules/ directory updated
on pods +----+-----+ | v +----+-----+ | Rule | --WatchService detects
file change | Engine | --hot reload rule (no restart) +----+-----+ | v
+----+-----+ | Runtime | --next evaluate('sibling-discount') uses v1.4 | | --
decision logged with version 1.4 +----------+
DATABASE IMPACT
The rule engine does not directly affect the database — rules are in YAML files,
not database tables. However, rule decisions are logged to the database for
audit (per rule 8). The rule_decision_log table has: id (uuid), rule_name (text),
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 124

PreOne ADR - Volume 2: Domain Architecture v3.0
rule_version (text), facts (jsonb), decision (jsonb), decided_at (timestamptz),
decided_by (text, the user or system that triggered the evaluation). This table is
in the audit schema (per ADR-048) and is retained for 7 years for compliance.
The table grows linearly with rule evaluations (estimated 100,000/day at peak);
partitioning by decided_at keeps the table manageable.
API IMPACT
Rule-based decisions are not directly exposed via the API. The API calls
application services, which call domain services, which call the rule engine. The
API response includes the decision result (e.g., the discount amount) but not
the rule version or facts. However, for debugging, the API may include a
'decision_id' in the response, which can be used to look up the rule decision in
the audit log. This enables support teams to explain why a specific decision was
made ('the discount was 10% because rule sibling-discount v1.3 applied').
UI IMPACT
Rule-based decisions affect UI display. When a discount is applied, the UI
shows the discount amount and a tooltip ('Sibling discount: 10%'). The tooltip
text is part of the rule (in the YAML 'then' clause) and is returned to the UI via
the API. Rule changes that affect display (e.g., changing the discount from 10%
to 15%) are reflected in the UI after the rule hot-reloads. The UI does not need
to be redeployed for rule changes.
SECURITY IMPACT
Rule-based decisions are auditable, which improves security. Every decision is
logged with the rule version, facts, and result — enabling post-hoc analysis of
any decision. Rule changes are Git-versioned and reviewed, preventing
unauthorised rule modifications. The rule engine is intentionally not Turing-
complete (no loops, no recursion), preventing malicious rules from causing
denial-of-service. Rule facts are sanitised (no arbitrary object access) — the fact
context is a Map<String, Object> with primitives and POJOs, not a reflection-
based object graph.
PERFORMANCE IMPACT
Rule engine evaluation is fast (<1ms per rule for typical complexity). The rule is
loaded once and cached in memory; evaluation is a condition check against the
facts map. Hot reload reloads the rule in <100ms. The decision log write (to the
database) adds ~2ms per decision, which is acceptable. Overall, the rule engine
has negligible performance impact vs code-based rules. The benefit (agility) far
outweighs the cost (1ms per evaluation).
SCALABILITY ANALYSIS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 125

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
The rule engine scales horizontally — it is stateless (rules are loaded from files,
not stored in memory between evaluations). Multiple application instances
each load the rules from the shared config map; hot reload propagates via the
config map update. The decision log table scales with partitioning (by
decided_at). At PreOne's projected scale (100,000 decisions/day), the table
grows by ~36 million rows per year, which PostgreSQL handles with monthly
partitions. Rule evaluation is CPU-bound (not I/O-bound), so it scales with CPU
cores.
OPERATIONAL CONSIDERATIONS
Rule engine operations include: rule deployment (config map update), hot
reload verification (monitor rule version in logs), rule test suite (CI gate),
decision log monitoring (decision rate, error rate), and rule rollback (revert PR,
redeploy config map). The quarterly architecture scorecard audits: (a) rule
change frequency (target: 5-20 changes per quarter per domain; too few
suggests rules are in code, too many suggests instability), (b) rule test coverage
(target: 100% — every rule has tests), (c) decision log error rate (target: zero —
errors indicate rule engine issues).
RISKS
| Risk              | Likelihood | Impact | Mitigation         |
| ----------------- | ---------- | ------ | ------------------ |
| Rules in YAML     | Medium     | Medium | Rule engine is     |
| become complex    |            |        | intentionally not  |
| (spaghetti rules) |            |        | Turing-complete;   |
quarterly review
of rule complexity;
Domain Architect
enforces simplicity
| Rule changes        | Low | High | Config map        |
| ------------------- | --- | ---- | ----------------- |
| bypass review       |     |      | updates require   |
| (direct config map  |     |      | PR; CI verifies   |
| edit)               |     |      | rule tests pass;  |
audit log shows
who changed what
| Rule hot-reload  | Low | Medium | Rule engine logs  |
| ---------------- | --- | ------ | ----------------- |
| fails silently   |     |        | reload events;    |
monitor rule
version in decision
logs; alert if
version is stale
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  126

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation          |
| ------------------- | ---------- | ------ | ------------------- |
| Rule facts contain  | Medium     | Medium | Domain service is   |
| stale data (e.g.,   |            |        | responsible for     |
| family income not   |            |        | building facts      |
| updated)            |            |        | from current data;  |
facts are logged
for audit;
quarterly review
of fact freshness
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Business agility (rule changes without  Two rule mechanisms (code and YAML)
code deploy)
Separation of concerns (analysts author  YAML syntax learning curve
rules)
Auditability (Git versioning, decision  Decision log storage cost (database
| log) |     | growth) |     |
| ---- | --- | ------- | --- |
Hot-reloadable (no restart for rule  Rule engine complexity (custom library
| changes) |     | maintenance) |     |
| -------- | --- | ------------ | --- |
REJECTED ALTERNATIVES
All rules in code (option 2) was the pre-ADR-030 state. The Billing team made
23 code deploys in Q4 2025 for rule changes, each requiring 4 hours (CI/CD
cycle) and release window coordination — business analysts were blocked
waiting for engineering. Full rules engine (option 3, Drools) was prototyped:
the deployment grew by 50MB, the DRL syntax required training, and the KIE
workbench was operational complexity (a separate service to maintain).
Database-stored rules (option 4) was rejected because it sacrificed Git version
control and code review — a prototype showed that analysts could edit rules
directly in the admin UI, but there was no audit trail and no test suite,
producing two production incidents from untested rule changes.
MIGRATION PLAN
Phase 1 (complete): Build preone-rules-engine library (v1.0.0). Phase 2
(complete): Pilot in Billing domain — externalise 5 complex rules (sibling-
discount, early-bird, staff-discount, promotional-offer, fee-waiver). Phase 3
(complete): Migrate other domains — 23 rules externalised across 12 domains.
Phase 4 (complete): Rule test suite in CI. Phase 5 (complete): Hot-reload
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  127

PreOne ADR - Volume 2: Domain Architecture v3.0
deployed to production. Phase 6 (Q4 2026): Training session for business
analysts on YAML rule authoring.
TESTING STRATEGY
Rule engine testing has three levels. Rule tests: each rule has a test case (rules-
test/<domain>/<rule>.test.yml) with input facts and expected output; CI runs
all rule tests on every rule PR. Engine tests: the rule engine itself has unit tests
(condition evaluation, action execution, hot reload). Integration tests: domain
services that invoke the rule engine are tested end-to-end with Testcontainers
(verify the decision log is written). Property-based tests: rules have property
tests (e.g., sibling-discount is monotonic — more enrolled children never
reduces the discount).
MONITORING & OBSERVABILITY
Rule engine metrics: rule.evaluation.count (per rule), rule.evaluation.time (per
rule, target <1ms), rule.evaluation.error (per rule, by exception type),
rule.reload.count (hot reload events), rule.version (gauge per rule, for
staleness detection). Decision log metrics: decision.log.write.count,
decision.log.write.time. Dashboards in Grafana: rule evaluation rate per
domain, rule version per domain, decision log growth. Alerts: rule evaluation
time >10ms, rule version stale (>24h since last reload), decision log write
failure.
FUTURE EVOLUTION
Three evolutions are possible. First, the rule engine may adopt a DSL (domain-
specific language) instead of YAML if rule complexity grows — but the current
YAML is sufficient for PreOne's rules. Second, rule versioning may adopt
semantic versioning (1.0.0) instead of Git SHA for clearer communication with
business stakeholders. Third, rule simulation (evaluating a proposed rule
against historical facts to predict impact) may be added — this would be a new
ADR. The hybrid strategy (code for simple, YAML for complex) is stable and
unlikely to change.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P5 Simplicity —
lightweight engine)
● ADR-004 — Domain Driven Design (rules in domain layer)
● ADR-006 — Layering Rules (rule engine invoked by domain services)
● ADR-022 — Aggregate Rules (aggregate invariants are code-based
rules)
● ADR-025 — Domain Services (domain services invoke rule engine)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 128

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● ADR-029 — Validation (rule engine decisions are validated by domain
service)
● ADR-031 — Specification Pattern (specifications may compose rules)
● ADR-039 — Domain Exceptions (rule evaluation failures throw domain
exceptions)
● ADR-048 — Audit Trail (decision log is part of audit trail)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — domain rules)
● Upstream PRD: PRD-003-section-6 (Billing business rules)
● Downstream ERD: ERD-005 (rule_decision_log table schema)
● Downstream API Spec: API-003 (Billing API includes decision_id for
audit)
● Downstream Test Cases: TC-0044..TC-0046 (Rule engine, rule tests,
decision log tests)
● External: Drools Documentation (evaluated and rejected)
● External: Easy Rules Documentation (lightweight alternative evaluated)
DECISION HISTORY
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2025-11-15 | Draft  | Billing Domain  | Initial draft with 4  |
|            |        | Architect       | options; hybrid       |
chosen
| 2025-12-17 | Proposed | Billing Domain  | Submitted to ARB    |
| ---------- | -------- | --------------- | ------------------- |
|            |          | Architect       | after Billing pilot |
| 2026-01-14 | Accepted | ARB Chair       | ARB approved;       |
preone-rules-
engine v1.0.0
released
| 2026-08-03 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect |     | Chief Architect (AR)     |     |
| --------- | --- | ------------------------ | --- |
| Tech Lead |     | Billing Domain Architect |     |
| ARB Chair |     | ARB Chair                |     |
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  129

PreOne ADR - Volume 2: Domain Architecture v3.0
Approved On 2026-08-03
IMPLEMENTATION CHECKLIST
● Build preone-rules-engine library (Done — v1.0.0, 847 lines)
● Pilot in Billing domain with 5 rules (Done — PR #5101)
● Migrate 23 rules across 12 domains (Done — PR #5115)
● Rule test suite in CI (Done — 23 rules, 87 test cases)
● Hot-reload deployed to production (Done — Kubernetes ConfigMap)
● Decision log table and audit integration (Done — Flyway V1.8.0)
● ArchUnit rules: rule engine invoked only from domain services (Done —
CI gate since V1.8.0)
● Training session for business analysts (Done — 2 sessions, 12 analysts
trained)
AD R -031
Specification Pattern
Volume 2 — Domain Architecture - Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Adopt the specification pattern for expressing business rules as
composable, reusable predicates. A specification is a predicate (boolean
test) over a domain object. Specifications are used for validation (e.g.,
'student is eligible for enrollment'), querying (e.g., 'find all students
matching criteria'), and business rule composition (e.g., 'eligible AND not
blocked'). Specifications are immutable, composable (AND, OR, NOT), and
testable.
STATUS
Status Accepted
Date Decided 2026-01-21
Decision Owner Domain Architect — Enrollment
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 130

PreOne ADR - Volume 2: Domain Architecture v3.0
Review Cadence Annual or on specification
proliferation
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-031, PreOne expressed business rules as inline boolean
expressions in services. The 'is student eligible for enrollment' rule was
duplicated in EnrollmentService, EligibilityChecker, BatchImportService, and
ReportingService — four copies with subtle differences (one checked age, one
did not; one checked branch capacity, one did not). A change to the eligibility
rule required touching four places, and twice a place was missed, causing
inconsistent behaviour. The Enrollment Domain Architect led a 3-week
refactoring to extract specifications. The new pattern: an
EligibleForEnrollmentSpecification encapsulates the rule (age check, branch
capacity check, no outstanding fees check). The specification is used in four
places: EnrollmentService (validation), EligibilityChecker (query),
BatchImportService (validation), ReportingService (filter). A change to the rule
changes one specification, and all four places use the updated rule. This ADR
codifies the specification pattern. ArchUnit tests verify that specifications are
immutable, composable, and used consistently.
BUSINESS DRIVERS
The primary driver is DRY (Don't Repeat Yourself): a business rule expressed as
a specification exists in one place, eliminating duplication and inconsistency.
The secondary driver is composability: specifications can be combined (AND,
OR, NOT) to express complex rules from simple ones. The tertiary driver is
testability: specifications are pure functions, easily unit-tested with various
inputs. A fourth driver is query reuse: a specification can be translated to a
database query (via JPA Criteria or Spring Data JPA Specification), enabling the
same rule to be used for in-memory validation and database querying. A fifth
driver is domain expressiveness: code using specifications (if
(eligibilitySpec.isSatisfiedBy(student))) is more readable than code with inline
boolean expressions (if (student.getAge() >= 3 && branch.hasCapacity() && !
student.hasOutstandingFees())).
PROBLEM STATEMENT
PreOne's business rules are duplicated as inline boolean expressions across
services, causing inconsistency and maintenance burden. We must adopt the
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 131

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
specification pattern to centralise rules as composable, reusable, testable
predicates.
CONSTRAINTS
● Specifications are immutable (no state mutation after construction)
● Specifications are composable (AND, OR, NOT operations)
● Specifications implement a Specification<T> interface with
isSatisfiedBy(T): boolean
● Specifications are translatable to database queries (JPA Criteria)
● Specifications are unit-tested with various inputs
ASSUMPTIONS
● Business rules can be expressed as predicates (boolean tests over
domain objects)
● JPA Criteria API is sufficient for translating specifications to queries
● The composition operations (AND, OR, NOT) are sufficient for all rule
combinations
● Specifications do not have side effects (they are pure functions)
● Engineers will learn the specification pattern (cultural shift from inline
expressions)
OPTIONS CONSIDERED
| Option            | Pros              | Cons               | Verdict |
| ----------------- | ----------------- | ------------------ | ------- |
| Specification     | DRY; composable;  | Boilerplate (one   | Chosen  |
| pattern with JPA  | testable; query   | class per rule);   |         |
| Criteria          | reuse; domain     | JPA Criteria is    |         |
| translation       | expressiveness;   | verbose; learning  |         |
| (chosen)          | aligns with DDD.  | curve; engineers   |         |
may overuse
specifications for
trivial rules.
| Inline boolean    | Simple; no    | Duplicated;         | Rejected |
| ----------------- | ------------- | ------------------- | -------- |
| expressions (pre- | abstraction;  | inconsistent; hard  |          |
| ADR-031 state)    | familiar.     | to test; not        |          |
composable; pre-
ADR-031 state.
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  132

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Option             | Pros              | Cons               | Verdict  |
| ------------------ | ----------------- | ------------------ | -------- |
| Spring Data        | Built-in; no      | Couples domain to  | Rejected |
| JpaSpecificationEx | custom            | Spring Data; not   |          |
| ecutor             | framework; query  | composable in      |          |
|                    | support.          | domain layer;      |          |
Spring Data types
leak; does not
support in-
memory
evaluation.
| Rules engine (per  | Single             | Overkill for simple  | Rejected |
| ------------------ | ------------------ | -------------------- | -------- |
| ADR-030) for all   | mechanism;         | rules; YAML          |          |
| rules              | externalised; hot- | cannot express all   |          |
|                    | reloadable.        | rule types; rule     |          |
engine is for
complex/frequent-
change rules, not
all rules.
DECISION
ADOPTED
Adopt the following specification rules: (1) Specifications implement the
Specification<T> interface with isSatisfiedBy(T candidate): boolean and
toPredicate(Root<T>, CriteriaBuilder): Predicate. (2) Specifications are
immutable — all fields are final, set via constructor. (3) Specifications are
composable — the Specification interface provides and(spec), or(spec),
not() methods that return new specifications. (4) Specifications live in the
domain layer (com.preone.<domain>.domain.specification package). (5)
Specifications are used for validation (isSatisfiedBy), querying (toPredicate
via JPA Criteria), and business rule composition. (6) Specifications do not
have side effects — they are pure functions. (7) Each specification has unit
tests covering satisfied and not-satisfied cases. (8) Specifications are not
used for trivial rules (e.g., 'student is active') — a method on the aggregate
(student.isActive()) is preferred for trivial checks.
DETAILED RATIONALE
The chosen option is the only one that produces DRY, composable, testable
business rules. Inline boolean expressions (option 2) were the pre-ADR-031
state and produced the duplication and inconsistency problems. Spring Data
JpaSpecificationExecutor (option 3) couples the domain to Spring Data and
does not support in-memory evaluation. Rules engine for all rules (option 4) is
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  133

PreOne ADR - Volume 2: Domain Architecture v3.0
overkill — the rule engine (ADR-030) is for complex, frequently-changing rules,
not for stable predicates. Rule (1) — Specification<T> interface — defines the
contract. isSatisfiedBy(T) enables in-memory evaluation (e.g., validating a
single student). toPredicate(Root, CriteriaBuilder) enables database querying
(e.g., finding all eligible students). The dual interface allows the same
specification to be used for both validation and querying, eliminating the
duplication that motivated this ADR. Rule (2) — immutability — means
specifications are thread-safe and can be shared. A specification instance (e.g.,
EligibleForEnrollmentSpecification) is constructed once and used many times.
Immutability also enables caching — a specification can be stored as a static
final constant. Rule (3) — composability — enables building complex rules from
simple ones. EligibleForEnrollmentSpec AND NotBlockedSpec AND
BranchHasCapacitySpec produces a composite specification that is itself a
Specification<Student>. The composite is immutable and translatable to a
query (the toPredicate method combines the child predicates with AND).
Composition is the key power of the specification pattern — it eliminates the
need for monolithic rule classes. Rule (4) — domain layer placement — keeps
specifications in the domain, not the infrastructure. The package convention
(com.preone.<domain>.domain.specification) makes specifications
discoverable and enforces the layering rule. ArchUnit verifies that
specifications do not import from infrastructure packages. Rule (5) — three
uses (validation, querying, composition) — maximises the value of each
specification. A specification written once is used in three contexts: validating a
single object (isSatisfiedBy), querying the database (toPredicate), and
composing with other specifications (and, or, not). This eliminates the pre-
ADR-031 duplication where the same rule was implemented three times (once
for validation, once for querying, once for composition). Rule (6) — no side
effects — means specifications are pure functions. A specification does not
modify the candidate, does not write to the database, does not publish events.
This makes specifications deterministic and testable. If a rule needs to take
action (e.g., 'if eligible, send notification'), the action is in the application
service, not the specification — the specification only answers the question 'is
this candidate eligible?'. Rule (7) — unit tests — ensure specifications are
correct. Each specification has tests for satisfied cases (the candidate meets the
rule) and not-satisfied cases (the candidate does not meet the rule). Edge cases
(null fields, boundary values) are tested. Composition is tested (A AND B is
satisfied only when both A and B are satisfied). Tests are in the specification
test suite (com.preone.<domain>.domain.specification test package). Rule (8)
— not for trivial rules — prevents specification overuse. A rule like 'student is
active' is better expressed as a method on the Student aggregate
(student.isActive()) than as a specification
(ActiveStudentSpecification.isSatisfiedBy(student)). The method is more
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 134

PreOne ADR - Volume 2: Domain Architecture v3.0
readable and does not require a separate class. Specifications are for non-trivial
rules that benefit from composition and reuse — typically rules with 3+
conditions that are used in multiple places.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Specification Pattern
| | | | Domain Layer
| | +----------------------------------------------------------+ | | |
com.preone.enrollment.domain.specification | | | |
| | | | <<interface>> | | | | Specification<T>
| | | | + isSatisfiedBy(T candidate): boolean | | | | +
toPredicate(Root<T>, CriteriaBuilder): Predicate | | | | + and(Spec<T>):
Spec<T> | | | | + or(Spec<T>): Spec<T>
| | | | + not(): Spec<T> | | |
+----------------------------------------------------------+ | |
| | +---------------------+ +---------------------+ | | | EligibleForEnroll | |
NotBlockedSpec | | | | Spec | |---------------------| | |
|---------------------| | - no fields | | | | - minAge: int | |
+isSatisfiedBy(s) | | | | - branchCapacity: | | (s.status != |
| | | int | | BLOCKED) | | | | +isSatisfiedBy(s) | |
+toPredicate(...) | | | | (s.age >= minAge | +---------------------+
| | | && ...) | | | | +toPredicate(...) |
+---------------------+ | | +---------------------+ | BranchHasCapacity | |
| | Spec | | | Composition:
|---------------------| | | +---------------------+ | +isSatisfiedBy(b) | | | |
CompositeSpec | | (b.enrolled < | | | | (AndSpec/OrSpec/ | |
b.capacity) | | | | NotSpec) | +---------------------+ | | |
+isSatisfiedBy(t) | | | | (left.isSatisfied | Usage:
| | | && right.isSatis)| spec = new EligibleForEnroll() | | +---------------------+
.and(new NotBlocked()) | | .and(new
BranchHasCapacity()); | | | | Uses:
| | - Validation: spec.isSatisfiedBy(student) | | - Querying:
repo.findBy(spec.toPredicate(...)) | | - Composition:
spec.and(otherSpec) |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
App Service Specification Aggregate (candidate) DB | |
| | |--isEligible(studentId) | | | |
| | | (build composite spec) | | | spec =
EligibleForEnroll | | | .and(NotBlocked) |
| | .and(BranchHasCapacity) | | | |
| | | (load student) | | | |--
repo.findById---->| | | |<--student----------| |
| | | | | | (validate: in-memory evaluation)
| | |--spec.isSatisfiedBy(student)------------>| | |
|--check: age >= 3? | | | |--check: status != BLOCKED?
| | |--check: branch.enrolled < capacity? | | |
(may load branch via repo) | | | | | |
<--boolean----------| | | | | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 135

PreOne ADR - Volume 2: Domain Architecture v3.0
| | (query: database evaluation) | | | (e.g., find all eligible
students) | | |--repo.findBy(spec.toPredicate)---------->|----------------
>| | | |<--rows----------| |<--List<Student>----|
| | | | | | | (composition: build
complex rule) | | | spec2 = spec.or(new TransferEligible()) |
| | (spec2 is also a Specification<Student>)| |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Specification Pattern Components
| | | | +---------------------+ <<interface>>
| | | Specification<T> | - isSatisfiedBy(T): boolean | | | (interface) | -
toPredicate(Root, CB): Pred | | +---------+-----------+ - and(Spec<T>): Spec<T>
| | ^ - or(Spec<T>): Spec<T> | | | - not():
Spec<T> | | +---------+-----------+ | | |
(implementations) | | | +---------------------+
| | | | Concrete Specifications (domain
layer) | | +---------------------+ +---------------------+ | | |
EligibleForEnroll | | NotBlockedSpec | | | | Spec | | (no
fields) | | | | - minAge: int | +---------------------+ | | | - maxAge:
int | | | | +isSatisfiedBy(s) | +---------------------+ | |
| +toPredicate(...) | | BranchHasCapacity | | | +---------------------+ | Spec
| | | | - capacityProvider | | | Composite
Specifications | +isSatisfiedBy(b) | | | +---------------------+ |
+toPredicate(...) | | | | AndSpec<T> | +---------------------+ | | | -
left: Spec<T> | | | | - right: Spec<T> |
+---------------------+ | | | +isSatisfiedBy(t) | | OrSpec<T> | | | |
(left && right) | | (similar to AndSpec)| | | | +toPredicate(...) |
+---------------------+ | | +---------------------+ | |
| | Usage (in domain service or app service) | | +---------------------+
| | | EligibilityChecker | spec = new EligibleForEnroll() | | | (domain service)
| .and(new NotBlocked()) | | | +check(student): | .and(new
BranchHasCapacity()); | | | boolean | return spec.isSatisfiedBy(s); | |
+---------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Build specification (composite) | v +----+-----+ | Spec |
EligibleForEnroll.and(NotBlocked).and(BranchCap) | Builder | (immutable,
composable) +----+-----+ | |--use case 1: in-memory validation |
spec.isSatisfiedBy(student) | -> evaluates each component spec | ->
returns boolean | |--use case 2: database query |
spec.toPredicate(root, cb) | -> builds JPA Criteria Predicate | ->
repo.findAll(predicate) | -> returns List<Student> | |--use case 3:
composition | spec.or(new TransferEligible()) | -> returns new
composite spec | -> can be used in use cases 1 and 2 | v +----+-----
+ | Result | (boolean for validation, List for query, Spec for composition)
+----------+
DATABASE IMPACT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 136

PreOne ADR - Volume 2: Domain Architecture v3.0
Specifications translate to JPA Criteria queries via the toPredicate method. The
EligibleForEnrollmentSpecification.toPredicate produces a Predicate that the
repository uses in a CriteriaQuery. This is more type-safe than JPQL strings and
enables dynamic query building (compose specifications at runtime). The
database sees the same SQL as a hand-written query — the specification
pattern does not add database overhead. ArchUnit verifies that specifications
do not contain native SQL (only JPA Criteria), keeping queries portable.
API IMPACT
Specifications are not directly exposed via the API. The API calls application
services, which use specifications for validation and querying. However, the
API benefits from specifications in query endpoints: a GET /students?
eligible=true endpoint uses the EligibleForEnrollmentSpecification to filter
results, ensuring the API's 'eligible' filter matches the domain's eligibility rule
exactly. Without specifications, the API filter and the domain rule could diverge.
UI IMPACT
Specifications have no direct UI impact. The UI calls API endpoints, which use
specifications internally. However, specifications enable consistent UI
behaviour: a UI element that shows 'eligible students' uses the same
specification as the enrollment validation, ensuring the UI display matches the
actual eligibility rule.
SECURITY IMPACT
Specifications improve security by centralising access rules. An
'CanAccessStudentDataSpecification' that checks the caller's role and the
student's school can be used in both the API authorisation check and the
database query filter, ensuring consistent enforcement. Without specifications,
the authorisation check and the query filter could diverge, allowing access to
data the authorisation check should have blocked.
PERFORMANCE IMPACT
Specification evaluation has minimal overhead. In-memory evaluation
(isSatisfiedBy) is a method call with boolean checks — microseconds. Database
query translation (toPredicate) builds a JPA Criteria Predicate, which
Hibernate translates to SQL — the same SQL as a hand-written query.
Composition (and, or, not) creates a new specification instance, which is a small
allocation. Overall, the specification pattern has no measurable performance
impact vs inline expressions.
SCALABILITY ANALYSIS
Specifications scale linearly — they are stateless and immutable. Multiple
application instances can share specification instances (e.g., as static final
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 137

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
constants). Database queries produced by specifications scale with the
underlying database. The composition pattern does not introduce scalability
concerns — a composite specification produces a single database query, not
multiple queries. The specification pattern is suitable for PreOne's scale and
beyond.
OPERATIONAL CONSIDERATIONS
Specifications are not directly observable (they are pure functions). Indirect
observability comes from the application services that use them: the service
logs the specification result (satisfied/not-satisfied) and the candidate ID. Slow
specifications (e.g., one that loads related aggregates) are flagged in code
review. The quarterly architecture scorecard audits specification count per
domain (target: 5-15 specifications per domain; too few suggests rules are
inline, too many suggests over-engineering).
RISKS
| Risk                | Likelihood | Impact | Mitigation       |
| ------------------- | ---------- | ------ | ---------------- |
| Specifications are  | Medium     | Low    | Rule 8: trivial  |
| overused for        |            |        | rules use        |
| trivial rules       |            |        | aggregate        |
methods; code
review enforces;
quarterly audit of
specification count
| Specifications  | Medium | Medium | Quarterly review    |
| --------------- | ------ | ------ | ------------------- |
| become complex  |        |        | of specification    |
| (deeply nested  |        |        | depth; Domain       |
| composition)    |        |        | Architect enforces  |
readability; prefer
named
specifications over
deep composition
| Specifications      | Low | Medium | Rule engine is for  |
| ------------------- | --- | ------ | ------------------- |
| duplicate rules in  |     |        | complex/frequent-   |
| the rule engine     |     |        | change rules;       |
| (ADR-030)           |     |        | specifications are  |
for
stable/composable
rules; quarterly
audit of overlap
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  138

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation           |
| ------------------ | ---------- | ------ | -------------------- |
| JPA Criteria       | Medium     | Low    | Specification test   |
| translation is     |            |        | suite includes       |
| verbose and error- |            |        | query tests (verify  |
| prone              |            |        | the produced         |
SQL); code
generation
template for
boilerplate
TRADE-OFFS
| We Gain                   |     | We Lose                          |     |
| ------------------------- | --- | -------------------------------- | --- |
| DRY (one rule, one place) |     | Boilerplate (one class per rule) |     |
| Composable (AND, OR, NOT) |     | Learning curve for engineers     |     |
Testable (pure functions) JPA Criteria verbosity in toPredicate
Query reuse (validation + querying) Specification overuse risk (mitigated by
rule 8)
REJECTED ALTERNATIVES
Inline boolean expressions (option 2) were the pre-ADR-031 state. Three issues:
(1) the 'eligible for enrollment' rule was duplicated in 4 services with subtle
differences (one checked age, one did not), causing inconsistent behaviour; (2)
changing the rule required touching 4 places, and twice a place was missed; (3)
the rule could not be used for querying (the database query was a separate
JPQL   string   that   diverged   from   the   in-memory   check).   Spring   Data
JpaSpecificationExecutor (option 3) was prototyped: it coupled the domain to
Spring Data (Specification<T> from Spring Data, not a domain interface), did
not support in-memory evaluation (only database querying), and leaked Spring
Data types into the domain layer. Rules engine for all rules (option 4) was
rejected because the rule engine (ADR-030) is for complex, frequently-changing
rules, not for stable, composable predicates — using the rule engine for all rules
would externalise stable rules to YAML unnecessarily.
MIGRATION PLAN
Phase   1   (complete):   Create   Specification<T>   interface   with   and/or/not
methods. Phase 2 (complete): Pilot in Enrollment domain — extract 7
specifications   (EligibleForEnrollment,   NotBlocked,   BranchHasCapacity,
HasOutstandingFees, etc.). Phase 3 (complete): Migrate other domains — 47
specifications across 12 domains. Phase 4 (complete): Replace inline boolean
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  139

PreOne ADR - Volume 2: Domain Architecture v3.0
expressions with specification calls. Phase 5 (complete): ArchUnit rules
enforced in CI. Phase 6 (Q4 2026): Training session for new engineers.
TESTING STRATEGY
Specification testing has three levels. Unit tests: each specification tests
isSatisfiedBy with satisfied and not-satisfied candidates, edge cases (null fields,
boundaries), and composition (A AND B is satisfied only when both are
satisfied). Query tests: specifications with toPredicate are tested with
Testcontainers PostgreSQL — verify the produced query returns the correct
results. Contract tests: specifications used in multiple places have contract
tests verifying consistent behaviour across use cases. Property-based tests:
specifications have property tests (e.g., AND is commutative, NOT is
involutory).
MONITORING & OBSERVABILITY
Specifications are not directly observable. Indirect metrics: specification
evaluation count (emitted by application services), specification query
performance (slow queries indicate complex specifications). The quarterly
architecture scorecard audits specification count per domain and composition
depth.
FUTURE EVOLUTION
Two evolutions are possible. First, specifications may adopt Java 21 sealed
interfaces for algebraic composition (AndSpec, OrSpec, NotSpec as permitted
subtypes of CompositeSpec). Second, specifications may integrate with the rule
engine (ADR-030) — a rule engine rule could produce a specification, enabling
dynamic specification composition from YAML rules. The specification pattern
itself is stable and unlikely to change.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P5 Simplicity —
composable rules)
● ADR-004 — Domain Driven Design (specification is a DDD pattern)
● ADR-008 — SOLID Enforcement (OCP: specifications are open for
extension via composition)
● ADR-022 — Aggregate Rules (specifications validate aggregate state)
● ADR-025 — Domain Services (domain services use specifications)
● ADR-026 — Repository Pattern (repositories use specifications for
querying)
● ADR-029 — Validation (specifications are a validation mechanism)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 140

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● ADR-030 — Business Rule Engine (rule engine and specifications are
complementary)
● ADR-035 — Eventual Consistency (specifications are pure, supporting
consistency checks)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — specification
pattern)
● Upstream PRD: PRD-002-section-8 (Enrollment eligibility rules)
● Downstream ERD: ERD-002 (specifications translate to queries on this
schema)
● Downstream API Spec: API-002 (Enrollment API uses specifications for
filtering)
● Downstream Test Cases: TC-0047..TC-0049 (Specification, composition,
query tests)
● External: Eric Evans — Domain-Driven Design, Chapter 9
(Specifications)
● External: Martin Fowler — Specification Pattern (article)
DECISION HISTORY
| Date       | Status | Actor            | Notes                 |
| ---------- | ------ | ---------------- | --------------------- |
| 2025-11-22 | Draft  | Enrollment       | Initial draft with 6  |
|            |        | Domain Architect | rules; expanded to    |
8 after review
| 2025-12-24 | Proposed | Enrollment       | Submitted to ARB  |
| ---------- | -------- | ---------------- | ----------------- |
|            |          | Domain Architect | after Enrollment  |
pilot
| 2026-01-21 | Accepted | ARB Chair | ARB approved; 47  |
| ---------- | -------- | --------- | ----------------- |
specifications
created
| 2026-08-05 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect |     | Chief Architect (AR)        |     |
| --------- | --- | --------------------------- | --- |
| Tech Lead |     | Enrollment Domain Architect |     |
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  141

PreOne ADR - Volume 2: Domain Architecture v3.0
ARB Chair ARB Chair
Approved On 2026-08-05
IMPLEMENTATION CHECKLIST
● Create Specification<T> interface with and/or/not (Done — preone-
domain v1.2.0)
● Pilot in Enrollment domain with 7 specifications (Done — PR #5201)
● Migrate 47 specifications across 12 domains (Done — PR #5215)
● Replace inline boolean expressions (Done — 87 inline expressions
replaced)
● ArchUnit rules: specs in domain.specification, immutable, no infra
(Done — CI gate since V1.8.0)
● Specification test suite (Done — 47 specs, 234 test cases)
● Query tests with Testcontainers (Done — all toPredicate methods
tested)
● Training session for engineers (Done — 4 sessions delivered)
AD R -032
Unit of Work
Volume 2 — Domain Architecture - Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Adopt the Unit of Work pattern to manage transaction boundaries and
aggregate persistence. A Unit of Work (UoW) is a transaction-scoped
context that tracks loaded aggregates, detects changes, and commits all
changes atomically. The UoW is implemented via Spring's @Transactional
annotation on application service methods, with Hibernate's persistence
context as the change tracker. One UoW modifies one aggregate (per
ADR-022).
STATUS
Status Accepted
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 142

PreOne ADR - Volume 2: Domain Architecture v3.0
Date Decided 2026-01-28
Decision Owner Domain Architect — Billing
Review Cadence Annual or on transaction strategy
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-032, PreOne's transaction management was inconsistent. Some
application service methods had @Transactional, some did not. Some methods
called repo.save() explicitly, some relied on Hibernate's dirty checking. Some
methods loaded multiple aggregates and modified them all in one transaction,
violating ADR-022 (one transaction, one aggregate). The result was
unpredictable persistence behaviour — sometimes changes were saved,
sometimes not (when @Transactional was missing), and sometimes too much
was saved (when multiple aggregates were in one transaction). The Billing
Domain Architect led a 2-week refactoring to standardise on the Unit of Work
pattern. The new approach: every application service method is
@Transactional (the UoW boundary). The method loads one aggregate,
modifies it, and the UoW (Hibernate's persistence context) detects changes and
saves them on commit. Explicit repo.save() calls are unnecessary (Hibernate's
dirty checking handles it), but are retained for clarity. Cross-aggregate
workflows use sagas (ADR-036) with multiple UoWs. This ADR codifies the
UoW rules. ArchUnit tests verify that application service methods are
@Transactional and that transactions do not span multiple aggregates.
BUSINESS DRIVERS
The primary driver is atomicity: a UoW commits all changes atomically — either
all succeed or all fail. This prevents partial saves that leave the database
inconsistent. The secondary driver is simplicity: the UoW pattern (via
@Transactional) hides transaction management from the developer — the
developer loads, modifies, and the UoW handles persistence. The tertiary driver
is consistency with ADR-022: one UoW = one transaction = one aggregate,
ensuring short transactions and low lock contention. A fourth driver is
testability: with @Transactional on application service methods, tests can use
@Transactional with rollback to test without persisting (or use Testcontainers
for real persistence). The UoW boundary is explicit, making tests deterministic.
PROBLEM STATEMENT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 143

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
PreOne's   transaction   management   is   inconsistent   —   some   methods
@Transactional, some not; some save explicitly, some rely on dirty checking;
transactions span multiple aggregates. We must define UoW rules that
standardise transaction boundaries and align with the one-aggregate-per-
transaction rule (ADR-022).
CONSTRAINTS
● Every application service method is @Transactional (the UoW
boundary)
● One UoW modifies one aggregate (per ADR-022)
● Cross-aggregate workflows use sagas (multiple UoWs, per ADR-036)
● The UoW is implemented via Spring @Transactional + Hibernate
persistence context
● Explicit repo.save() is allowed for clarity but not required (dirty
checking handles it)
ASSUMPTIONS
● Spring's @Transactional provides sufficient transaction management
(no need for programmatic transactions)
● Hibernate's persistence context (dirty checking) is reliable for change
detection
● PostgreSQL's default isolation level (READ COMMITTED) is sufficient
for most transactions
● Serialisable isolation (for financial transactions) is configured via
@Transactional(isolation = SERIALIZABLE)
● Transaction timeout (default 30s) is sufficient for all use cases
OPTIONS CONSIDERED
| Option            | Pros               | Cons              | Verdict |
| ----------------- | ------------------ | ----------------- | ------- |
| Spring            | Standard; simple;  | Implicit          | Chosen  |
| @Transactional +  | well-supported;    | (developer may    |         |
| Hibernate         | dirty checking;    | not realise a     |         |
| persistence       | integrates with    | transaction is    |         |
| context (chosen)  | Spring Data JPA;   | open); Hibernate- |         |
|                   | aligns with        | specific; no      |         |
|                   | ADR-022.           | explicit UoW      |         |
abstraction.
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  144

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Option             | Pros               | Cons              | Verdict  |
| ------------------ | ------------------ | ----------------- | -------- |
| Explicit           | Explicit;          | Boilerplate       | Rejected |
| UnitOfWork         | technology-        | (open/commit/roll |          |
| interface (custom  | agnostic; full     | back); reinvents  |          |
| abstraction)       | control; testable. | Spring            |          |
@Transactional;
Hibernate already
provides this; not
worth the
abstraction.
| Programmatic      | Full control;  | Verbose; error-   | Rejected |
| ----------------- | -------------- | ----------------- | -------- |
| transactions      | explicit; no   | prone (forgot to  |          |
| (TransactionTempl | annotations.   | commit);          |          |
| ate)              |                | boilerplate; not  |          |
idiomatic Spring.
| No transaction   | Simplest; no  | No atomicity;        | Rejected |
| ---------------- | ------------- | -------------------- | -------- |
| management       | abstraction.  | partial saves;       |          |
| (autocommit per  |               | inconsistent state;  |          |
| statement)       |               | pre-ADR-032 state    |          |
for some
endpoints.
DECISION
ADOPTED
Adopt the following Unit of Work rules: (1) Every application service
method is @Transactional — the method is the UoW boundary. (2) One UoW
modifies one aggregate — ArchUnit verifies that @Transactional methods
do not load and modify more than one aggregate. (3) Cross-aggregate
workflows use sagas (ADR-036) — each saga step is a separate UoW. (4) The
UoW is Spring @Transactional + Hibernate persistence context — no
custom UoW abstraction. (5) Explicit repo.save() is allowed for clarity but
not   required   (Hibernate   dirty   checking   auto-saves   on   commit).   (6)
Transaction   isolation   is   READ   COMMITTED   by   default;   financial
transactions   use   SERIALIZABLE   via   @Transactional(isolation   =
SERIALIZABLE). (7) Transaction timeout is 30s by default; long-running
operations use batch jobs (not transactions). (8) The UoW includes the
outbox write (per ADR-027) — the aggregate save and the outbox write are
in the same transaction.
DETAILED RATIONALE
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  145

PreOne ADR - Volume 2: Domain Architecture v3.0
The chosen option is the only one that produces atomicity and simplicity
without unnecessary abstraction. Explicit UoW interface (option 2) reinvents
Spring @Transactional, which is already a mature, well-tested UoW
implementation. Programmatic transactions (option 3) are verbose and error-
prone. No transaction management (option 4) was the pre-ADR-032 state for
some endpoints and produced partial saves. Rule (1) — @Transactional on
every method — makes the UoW boundary explicit. The transaction starts when
the method is called (Spring's proxy intercepts) and commits when the method
returns (or rolls back on exception). ArchUnit verifies that @Service methods in
the application.service package have @Transactional — methods without it are
flagged. Rule (2) — one UoW, one aggregate — aligns with ADR-022. A
@Transactional method that loads and modifies two aggregates is a violation —
it produces a long transaction (locks across two aggregates) and a consistency
risk (partial save if one aggregate fails). ArchUnit verifies that @Transactional
methods do not call more than one repository's save method (allowing one load
+ one save per aggregate, but not two saves). Rule (3) — sagas for cross-
aggregate workflows — is the alternative to multi-aggregate transactions. A fee
payment workflow (Payment, Invoice, Enrollment) is a saga with three UoWs:
(a) create Payment (UoW1), (b) mark Invoice paid (UoW2), (c) update
Enrollment status (UoW3). Each UoW is atomic; the saga coordinates via
events. If UoW2 fails, the saga compensates by reversing UoW1 (cancel
Payment). This is more complex than a single transaction but produces a
system that scales and recovers gracefully. Rule (4) — Spring @Transactional
+ Hibernate — is the implementation. Spring's @Transactional annotation is
the UoW boundary; Hibernate's persistence context (the first-level cache) is the
change tracker. When an aggregate is loaded via the repository, Hibernate
tracks it; when the aggregate is modified (via domain methods), Hibernate
marks it dirty; when the transaction commits, Hibernate flushes all dirty
entities to the database. This is the standard Spring + JPA pattern, well-
understood and well-supported. Rule (5) — explicit save for clarity — addresses
a common criticism of dirty checking: it is 'magic' (changes are saved without
an explicit save call). To improve readability, PreOne allows (but does not
require) explicit repo.save(aggregate) calls. The save call is a no-op (Hibernate
already tracks the entity) but documents intent: 'this aggregate has been
modified and should be saved'. ArchUnit does not enforce explicit saves (they
are optional). Rule (6) — isolation levels — aligns with the data integrity
principle (P2 in ADR-001). READ COMMITTED (PostgreSQL default) is
sufficient for most transactions — it prevents dirty reads and is performant.
Financial transactions (e.g., fee payment, refund) use SERIALIZABLE to
prevent phantom reads and ensure correctness — at the cost of potential retries
(optimistic lock conflicts). The @Transactional(isolation = SERIALIZABLE)
annotation is used on financial application service methods. Rule (7) —
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 146

PreOne ADR - Volume 2: Domain Architecture v3.0
transaction timeout — prevents long-running transactions from holding locks.
The default 30s timeout is sufficient for all online use cases. Long-running
operations (e.g., batch fee generation for 10,000 students) use batch jobs
(Spring Batch) with chunked transactions (100 students per UoW), not a single
long transaction. Rule (8) — outbox in same transaction — is critical for reliable
event delivery (per ADR-027). The aggregate save and the outbox write are in
the same transaction — if the transaction commits, both are persisted; if it rolls
back, neither is. This ensures events are published only for committed changes,
preventing ghost events (published for a rolled-back change) and lost events
(not published for a committed change).
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Unit of Work Pattern
| | | | App Service Method (UoW
boundary) | | +----------------------------------------------------------+ | | |
@Transactional | | | | @Service
| | | | public ConfirmEnrollmentResult confirm(cmd) { | | | | 1.
Enrollment agg = repo.findById(cmd.id); | | | | (Hibernate tracks
agg in persistence context) | | | | | |
| | 2. agg.confirm(cmd.confirmedBy); | | | | (Hibernate
marks agg as dirty) | | | | |
| | | 3. outbox.save(agg.events()); | | | | (outbox write in
same txn) | | | | | | | |
4. return new Result(agg.id, agg.status); | | | | (method returns; txn
commits) | | | | } | | |
+----------------------------------------------------------+ | |
| | Transaction Lifecycle | |
+----------------------------------------------------------+ | | | BEGIN TRANSACTION
| | | | (Spring proxy intercepts method call) | | | |
| | | | --SELECT enrollment WHERE id = ? | | | | (aggregate
loaded, tracked by Hibernate) | | | |
| | | | --aggregate.confirm() (in-memory state change) | | | |
(Hibernate marks entity dirty) | | | |
| | | | --INSERT outbox_events (PENDING) | | | | (outbox
write, same txn) | | | |
| | | | --method returns | | | |
| | | | --Hibernate flush: UPDATE enrollment SET status, version | | | | (dirty
checking auto-saves on flush) | | | |
| | | | COMMIT TRANSACTION | | | | (aggregate +
outbox atomic) | | | +----------------------------------------------------------
+ | | | | ArchUnit:
| | - @Service methods: @Transactional required | | - @Transactional
methods: <=1 repo.save() call | | - @Transactional methods: <=2 repo
calls total (load + save) | +------------------------------------------------------------------+
SEQUENCE DIAGRAM
App Svc Method (UoW) Hibernate Persistence Context DB |
| | | (txn begins) | | | BEGIN
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 147

PreOne ADR - Volume 2: Domain Architecture v3.0
TRANSACTION-------->|---------------------------->| | |
| | 1. repo.findById(id) | | |---------------------------->|
| | |--SELECT-------------------->| | |<--
row-----------------------| | | (track entity in context) | |<--
aggregate-----------------| | | | |
| 2. aggregate.confirm() | | | (in-memory state change) |
| |---------------------------->| | | | (mark entity
dirty) | | | | | 3. outbox.save(events)
| | |---------------------------->| | |
|--INSERT outbox_events------>| | |<--ok------------------------| |
<--ok------------------------| | | | |
| 4. return Result | | | (method exits) |
| | | | | (Spring proxy: commit) |
| | |--flush (dirty checking) | | |--
UPDATE enrollment | | | SET status, version | |
| WHERE id=? AND version=N | | |<--ok
(version=N+1)---------| | | | |
|--COMMIT TRANSACTION-------->| | |<--
committed-----------------| | | | | (txn
committed: aggregate + outbox atomic) | | |
| | (if exception during method) | | |--
ROLLBACK TRANSACTION------>| | |<--rolled back---------------|
| (no changes persisted, no events published) |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Unit of Work Components
| | | | Application Service (UoW boundary)
| | +---------------------+ @Service | | | EnrollmentCmdSvc |
@Transactional | | |---------------------| | | | +
confirm(cmd) | UoW = method execution | | | 1. load aggregate |
| | | 2. modify agg | One UoW = One aggregate: | | | 3. save outbox |
- load 1 aggregate | | | 4. return result | - modify 1 aggregate |
| +---------------------+ - save 1 outbox entry | | - commit
| | Spring Transaction Proxy | | +---------------------+
| | | @Transactional | - begin txn before method | | | (proxy interceptor) |
- commit after method returns | | +---------------------+ - rollback on exception
| | | | Hibernate Persistence Context
(change tracker) | | +---------------------+ | | |
PersistenceContext | - tracks loaded entities | | | (first-level cache) | -
detects dirty entities | | | +contains(entity) | - flushes on commit | |
| +isDirty(entity) | | | +---------------------+
| | | | Cross-Aggregate Workflow (Saga, per
ADR-036) | | +---------------------+ +---------------------+ | | | Saga Step 1
(UoW1) |-->| Saga Step 2 (UoW2) | | | | create Payment | | mark
Invoice paid | | | | @Transactional | | @Transactional | | |
+---------------------+ +---------------------+ | |
| | (each step is a separate UoW; saga coordinates via events)|
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 148

PreOne ADR - Volume 2: Domain Architecture v3.0
Command: confirmEnrollment(enrollmentId) | v +----+-----+ | App
Svc | @Transactional (UoW begins) | Method | --BEGIN TRANSACTION
+----+-----+ | |--1. repo.findById(enrollmentId) | (Hibernate
SELECT, entity tracked) | |--2. enrollment.confirm(confirmedBy) |
(in-memory state change, entity marked dirty) | |--3.
outbox.save(enrollment.events()) | (INSERT outbox_events, same txn) |
|--4. return Result | (method exits) | v +----+-----+ | Spring | --
commit (Spring proxy) | Proxy | --Hibernate flush (dirty checking) | | --
UPDATE enrollment SET status, version +----+-----+ | v +----+-----+ |
COMMIT | --aggregate + outbox atomic | | --events published by
publisher (async) +----+-----+ | +--success--> return Result to caller
| +--exception--> ROLLBACK (no changes, no events) | v +----+-----
+ | (cross-agg| Saga: multiple UoWs coordinated via events | workflow) |
UoW1 (Payment) -> event -> UoW2 (Invoice) -> ... +----------+
DATABASE IMPACT
The UoW pattern via @Transactional uses PostgreSQL transactions. The
transaction holds locks on modified rows for its duration; the one-aggregate-
per-transaction rule (ADR-022) keeps transactions short, minimising lock
contention. The SERIALIZABLE isolation level (for financial transactions) may
cause serialization failures, which are retried via @Transactional(retry = ...).
The outbox write in the same transaction ensures atomic aggregate + event
persistence. Flyway migrations are not affected — they run outside application
transactions. ArchUnit verifies that @Transactional methods do not span
multiple aggregates (one save per transaction).
API IMPACT
The UoW pattern affects API behaviour: an API request maps to one UoW (one
application service method). If the UoW commits, the API returns success; if it
rolls back, the API returns an error. For cross-aggregate workflows (sagas), the
API returns 202 Accepted (the first UoW commits, subsequent UoWs are
async). The API consumer polls or receives a webhook for saga completion. This
async pattern is necessary because sagas cannot complete within a single
HTTP request timeout.
UI IMPACT
The UoW pattern affects UI feedback. For single-aggregate operations (e.g.,
confirm enrollment), the UI receives immediate success/failure. For saga
operations (e.g., fee payment), the UI receives 202 Accepted and must poll or
wait for a webhook. The UI displays 'Processing...' for saga operations and
'Confirmed' or 'Failed' when the saga completes. This requires UI state
management for in-flight sagas.
SECURITY IMPACT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 149

PreOne ADR - Volume 2: Domain Architecture v3.0
The UoW pattern improves security by ensuring atomic changes — a
transaction either fully commits or fully rolls back, preventing partial states
that could expose security vulnerabilities. The SERIALIZABLE isolation level
for financial transactions prevents race conditions that could be exploited for
fraud (e.g., double-spending a fee payment). The outbox-in-same-transaction
rule ensures audit events are published only for committed changes,
preventing ghost audit entries.
PERFORMANCE IMPACT
The UoW pattern via @Transactional has minimal overhead — Spring's proxy
interception is microseconds, Hibernate's dirty checking is efficient (compares
entity snapshots). The one-aggregate-per-transaction rule keeps transactions
short (8-24ms typical), reducing lock contention. SERIALIZABLE isolation has
higher overhead (conflict detection) but is used only for financial transactions.
Overall, the UoW pattern has no measurable performance impact vs explicit
transaction management.
SCALABILITY ANALYSIS
The UoW pattern scales with the underlying database. PostgreSQL handles
thousands of concurrent transactions; the one-aggregate-per-transaction rule
ensures transactions do not block each other (different aggregates = different
rows = no lock contention). Sagas scale via event-driven processing (per
ADR-036). The SERIALIZABLE isolation level does not scale as well (more
conflicts at high concurrency), but financial transactions are a small fraction of
total traffic. Read replicas (per ADR-041) handle read traffic, offloading the
primary.
OPERATIONAL CONSIDERATIONS
UoW operations are observable via Micrometer: transaction.count (per
method, per domain), transaction.duration (per method, p50/p95/p99),
transaction.rollback.count (per method, by exception type),
transaction.lock.timeout.count (deadlock detection). Slow transactions (>1s)
are logged with method name and parameters. The quarterly architecture
scorecard audits: (a) transaction duration (target: p95 <500ms), (b) rollback
rate (target: <0.1%; higher indicates bugs or conflicts), (c) deadlock rate
(target: <0.01%; higher indicates lock ordering issues), (d) ArchUnit violation
count (target: zero — all @Service methods @Transactional).
RISKS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 150

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation        |
| ------------------ | ---------- | ------ | ----------------- |
| Engineers forget   | Medium     | High   | ArchUnit blocks   |
| @Transactional on  |            |        | @Service methods  |
| app service        |            |        | without           |
| methods            |            |        | @Transactional;   |
code review
checklist; training
| Transactions span  | Medium | High | ArchUnit blocks     |
| ------------------ | ------ | ---- | ------------------- |
| multiple           |        |      | >1 repo.save() per  |
| aggregates         |        |      | @Transactional      |
| (violating         |        |      | method; code        |
| ADR-022)           |        |      | review; saga        |
pattern for cross-
aggregate
| SERIALIZABLE      | Low | Medium | Monitor retry       |
| ----------------- | --- | ------ | ------------------- |
| isolation causes  |     |        | rate; if >5%,       |
| excessive retries |     |        | review transaction  |
design; consider
optimistic locking
instead
| Long-running        | Medium | Medium | Transaction         |
| ------------------- | ------ | ------ | ------------------- |
| transactions hold   |        |        | timeout 30s; batch  |
| locks (e.g., batch  |        |        | jobs use chunked    |
| operations)         |        |        | transactions;       |
monitor
transaction
duration
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Atomicity (all-or-nothing persistence) Implicit (developer may not realise txn
is open)
Simplicity (no explicit UoW  Hibernate-specific (not technology-
| management) |     | agnostic) |     |
| ----------- | --- | --------- | --- |
Consistent with ADR-022 (one agg per  Cross-aggregate workflows need sagas
| txn) |     | (complexity) |     |
| ---- | --- | ------------ | --- |
Dirty checking (auto-save on commit) Magic (explicit save allowed for clarity
but not required)
REJECTED ALTERNATIVES
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  151

PreOne ADR - Volume 2: Domain Architecture v3.0
Explicit UoW interface (option 2) was prototyped: a UnitOfWork interface with
open/commit/rollback methods, implemented by a JpaUnitOfWork. The
boilerplate (open, try/commit/catch/rollback/finally) added 10 lines per
method, and the implementation just delegated to Spring's
TransactionTemplate — reinventing @Transactional. Programmatic
transactions (option 3) were rejected as verbose and error-prone (forgot to
commit = no save). No transaction management (option 4) was the pre-
ADR-032 state for some CRUD endpoints — a GET /students endpoint had no
@Transactional and worked (reads don't need transactions in PostgreSQL
autocommit mode), but a POST /students endpoint without @Transactional
saved the student but not the related guardian record (partial save), causing
data inconsistency.
MIGRATION PLAN
Phase 1 (complete): Audit all application service methods for @Transactional.
Phase 2 (complete): Add @Transactional to 23 methods that were missing it.
Phase 3 (complete): Refactor multi-aggregate transactions to sagas (5
workflows migrated). Phase 4 (complete): Add SERIALIZABLE isolation to 12
financial methods. Phase 5 (complete): ArchUnit rules enforced in CI. Phase 6
(Q4 2026): Training session for new engineers.
TESTING STRATEGY
UoW rules are tested at three levels. Unit tests: application service methods are
unit-tested with mocked repositories — verify the method calls findById, save,
outbox.save in the correct order. Integration tests: application services are
tested with Testcontainers PostgreSQL — verify the transaction commits (data
persisted) or rolls back (no data) on exception. ArchUnit tests: structural rules
(@Transactional on @Service methods, <=1 save per method, <=2 repo calls
per method) verified at compile time. Isolation tests: SERIALIZABLE methods
are tested under concurrent access to verify conflict detection and retry.
MONITORING & OBSERVABILITY
Transaction metrics: transaction.count (per method), transaction.duration (per
method, p50/p95/p99), transaction.rollback.count (per method, by exception
type), transaction.lock.timeout.count, transaction.serialization.failure.count
(for SERIALIZABLE). Dashboards in Grafana: transaction duration per domain,
rollback rate per method, deadlock rate. Alerts: transaction.duration p95
>500ms, rollback rate >0.1%, deadlock rate >0.01%, ArchUnit violation count
>0.
FUTURE EVOLUTION
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 152

PreOne ADR - Volume 2: Domain Architecture v3.0
Two evolutions are possible. First, reactive transactions (R2DBC) may be
adopted if PreOne adopts Spring WebFlux — currently, PreOne uses Spring
MVC (blocking), and @Transactional is sufficient. Second, the saga pattern
(ADR-036) may evolve into a workflow engine (ADR-037) for complex cross-
aggregate workflows, but the UoW pattern for individual saga steps remains
unchanged. The UoW pattern itself is stable and unlikely to change.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity drives
atomicity)
● ADR-003 — Clean Architecture (UoW in application layer)
● ADR-022 — Aggregate Rules (one UoW = one aggregate)
● ADR-026 — Repository Pattern (repositories invoked within UoW)
● ADR-027 — Domain Events (outbox in same UoW for atomicity)
● ADR-028 — Application Services (app service method = UoW)
● ADR-033 — Transaction Boundary (UoW defines transaction boundary)
● ADR-034 — Cross Domain Communication (cross-domain via events,
not multi-domain UoW)
● ADR-035 — Eventual Consistency (sagas enable eventual consistency
across UoWs)
● ADR-036 — Saga Readiness (sagas coordinate multiple UoWs)
● ADR-049 — Optimistic Locking (UoW checks version on commit)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — unit of work)
● Upstream PRD: PRD-003-section-7 (Billing transaction requirements)
● Downstream ERD: ERD-003 (Billing schema with version columns for
optimistic locking)
● Downstream API Spec: API-003 (Billing API: 200 for single-agg, 202 for
saga)
● Downstream Test Cases: TC-0050 (UoW atomicity, rollback, isolation
tests)
● External: Martin Fowler — Unit of Work Pattern (PEAA)
● External: Spring @Transactional Documentation (implementation
reference)
DECISION HISTORY
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 153

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2025-11-29 | Draft  | Billing Domain  | Initial draft with 5  |
|            |        | Architect       | rules; expanded to    |
8 after review
| 2026-01-02 | Proposed | Billing Domain  | Submitted to ARB    |
| ---------- | -------- | --------------- | ------------------- |
|            |          | Architect       | after Billing pilot |
| 2026-01-28 | Accepted | ARB Chair       | ARB approved; 23    |
methods fixed, 5
sagas migrated
| 2026-08-07 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)     |     |
| ----------- | --- | ------------------------ | --- |
| Tech Lead   |     | Billing Domain Architect |     |
| ARB Chair   |     | ARB Chair                |     |
| Approved On |     | 2026-08-07               |     |
IMPLEMENTATION CHECKLIST
● Audit all app service methods for @Transactional (Done — 23 methods
fixed)
● Refactor multi-aggregate transactions to sagas (Done — 5 workflows
migrated)
● Add SERIALIZABLE isolation to financial methods (Done — 12
methods)
● ArchUnit rules: @Transactional required, <=1 save per method (Done
— CI gate since V1.8.0)
● Transaction timeout 30s configured (Done — application.yml)
● Transaction metrics dashboard (Done — Grafana per domain)
● Deadlock detection and alerting (Done — alerts on lock.timeout >0)
● Training session for engineers (Done — 4 sessions delivered)
AD R -033
Transaction Boundary
Volume 2 — Domain Architecture  -  Pattern
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  154

PreOne ADR - Volume 2: Domain Architecture v3.0
ACCEPTED
DECISION SUMMARY
DECISION
Define the rules for transaction boundaries in the PreOne platform. A
transaction boundary is the scope within which database operations are
atomic. The primary boundary is the aggregate (per ADR-022): one
transaction modifies one aggregate. Cross-aggregate workflows use sagas
(ADR-036) with multiple transactions coordinated via events. Transaction
isolation is READ COMMITTED by default; financial transactions use
SERIALIZABLE. Transaction timeout is 30 seconds.
STATUS
Status Accepted
Date Decided 2026-02-04
Decision Owner Domain Architect — Billing
Review Cadence Annual or on transaction strategy
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-033, PreOne's transaction boundaries were unclear. Some
application service methods had @Transactional, some did not. Some
transactions spanned multiple aggregates (loading and modifying Student,
Enrollment, and Invoice in one transaction), producing long transactions
(200ms+) and lock contention. Some transactions used the default isolation
(READ COMMITTED) for financial operations, causing race conditions (double-
charging when two concurrent requests both read the same balance). The
concept of 'transaction boundary' was not formalised. The Billing Domain
Architect led a 3-week effort to formalise transaction boundaries. The new
rules: one transaction = one aggregate (per ADR-022); cross-aggregate
workflows use sagas; financial transactions use SERIALIZABLE isolation;
transaction timeout is 30s. The double-charging race condition was eliminated
by SERIALIZABLE isolation on the fee payment method — concurrent requests
now conflict and retry. This ADR codifies the transaction boundary rules.
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 155

PreOne ADR - Volume 2: Domain Architecture v3.0
ArchUnit tests verify that @Transactional methods do not span multiple
aggregates and that financial methods use SERIALIZABLE.
BUSINESS DRIVERS
The primary driver is correctness: a transaction boundary defines the scope
within which invariants hold. Without clear boundaries, invariants can be
violated (e.g., a partial save leaves the database inconsistent). The secondary
driver is performance: short transactions (one aggregate) hold locks briefly,
reducing contention and improving throughput. The tertiary driver is
concurrency: SERIALIZABLE isolation for financial transactions prevents race
conditions that could cause fraud (double-charging, double-refunding). A
fourth driver is predictability: with clear transaction boundaries, developers
can reason about what will be saved (everything in the transaction) and what
will not (nothing outside it). This eliminates the 'did this get saved?' uncertainty
that plagued pre-ADR-033 development.
PROBLEM STATEMENT
PreOne's transaction boundaries are unclear, causing long transactions (multi-
aggregate), race conditions (wrong isolation level), and unpredictable
persistence behaviour. We must define transaction boundary rules that align
with ADR-022 (one aggregate per transaction), use appropriate isolation levels,
and set a timeout.
CONSTRAINTS
● One transaction = one aggregate (per ADR-022)
● Cross-aggregate workflows use sagas (ADR-036) with multiple
transactions
● Default isolation: READ COMMITTED (PostgreSQL default)
● Financial transactions: SERIALIZABLE isolation (via
@Transactional(isolation = SERIALIZABLE))
● Transaction timeout: 30 seconds (default), configurable per method
ASSUMPTIONS
● Spring's @Transactional is the transaction boundary mechanism (per
ADR-032)
● PostgreSQL's SERIALIZABLE isolation is correct (SSI - Serializable
Snapshot Isolation)
● 30s timeout is sufficient for all online transactions (batch operations
use chunked transactions)
● SERIALIZABLE conflicts are rare enough that retry overhead is
acceptable
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 156

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Hibernate's persistence context (dirty checking) is reliable within a
transaction
OPTIONS CONSIDERED
| Option            | Pros                | Cons                | Verdict  |
| ----------------- | ------------------- | ------------------- | -------- |
| Aggregate-scoped  | Correct; aligns     | SERIALIZABLE        | Chosen   |
| transactions,     | with ADR-022;       | may cause retries;  |          |
| READ              | prevents financial  | requires            |          |
| COMMITTED         | race conditions;    | identifying         |          |
| default,          | performant for      | financial methods;  |          |
| SERIALIZABLE      | non-financial;      | engineers must      |          |
| for financial     | standard Spring.    | understand          |          |
| (chosen)          |                     | isolation levels.   |          |
| All transactions  | Maximum             | Performance         | Rejected |
| SERIALIZABLE      | consistency; no     | overhead (conflict  |          |
|                   | race conditions;    | detection);         |          |
|                   | simple (one         | excessive retries   |          |
|                   | isolation level).   | for non-financial   |          |
transactions; not
all transactions
need
SERIALIZABLE.
| All transactions  | Performant;         | Race conditions     | Rejected |
| ----------------- | ------------------- | ------------------- | -------- |
| READ              | minimal conflicts;  | for financial       |          |
| COMMITTED         | PostgreSQL          | transactions        |          |
|                   | default; simple.    | (double-charging);  |          |
does not prevent
phantom reads;
unsafe for money.
Multi-aggregate  Atomicity across  Long transactions;  Rejected
| transactions (pre- | aggregates; no  | lock contention;   |     |
| ------------------ | --------------- | ------------------ | --- |
| ADR-033 state)     | sagas needed;   | does not scale;    |     |
|                    | simple model.   | violates ADR-022;  |     |
pre-ADR-033
state.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  157

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following transaction boundary rules: (1) One transaction = one
aggregate — @Transactional methods do not load and modify more than
one aggregate (enforced by ArchUnit). (2) Cross-aggregate workflows use
sagas (ADR-036) — each saga step is a separate transaction. (3) Default
isolation is READ COMMITTED — sufficient for non-financial transactions.
(4) Financial transactions use SERIALIZABLE — @Transactional(isolation
= SERIALIZABLE) on methods that modify money (fees, payments, refunds,
invoices). (5) Transaction timeout is 30s — @Transactional(timeout = 30) is
the default; long-running operations use batch jobs. (6) SERIALIZABLE
conflicts trigger a retry — Spring's @Transactional(retry = ...) with max 3
retries, 100ms backoff. (7) Read-only transactions use
@Transactional(readOnly = true) — enables Hibernate optimisations and
PostgreSQL read replica routing. (8) The transaction boundary includes the
outbox write (per ADR-027) — aggregate save and outbox write are atomic.
DETAILED RATIONALE
The chosen option is the only one that produces both correctness and
performance. All transactions SERIALIZABLE (option 2) was rejected for
performance — SERIALIZABLE conflict detection adds 10-20% overhead, and
non-financial transactions (e.g., updating a student profile) do not need it. All
transactions READ COMMITTED (option 3) was rejected for correctness — the
double-charging incident in Q4 2025 was caused by READ COMMITTED on a
financial method. Multi-aggregate transactions (option 4) were the pre-
ADR-033 state and violated ADR-022. Rule (1) — one transaction, one
aggregate — is the foundation (per ADR-022). The transaction boundary is the
aggregate boundary: all changes to an aggregate are atomic, and changes to
different aggregates are in different transactions. ArchUnit verifies that
@Transactional methods call at most one repository's save method. Cross-
aggregate workflows use sagas (rule 2). Rule (2) — sagas for cross-aggregate
— is the alternative to multi-aggregate transactions. A fee payment workflow
(Payment, Invoice, Enrollment) is a saga: three transactions, coordinated via
events, with compensation on failure. This is more complex than a single
transaction but scales (short transactions, no cross-aggregate locks) and
recovers gracefully (compensation). Sagas are detailed in ADR-036. Rule (3) —
READ COMMITTED default — is PostgreSQL's default isolation level. It
prevents dirty reads (reading uncommitted data from other transactions) but
allows non-repeatable reads and phantom reads. For most PreOne operations
(student profile updates, attendance marking, report generation), READ
COMMITTED is sufficient — the race conditions it allows are not exploitable in
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 158

PreOne ADR - Volume 2: Domain Architecture v3.0
these contexts. READ COMMITTED is performant (no conflict detection
overhead). Rule (4) — SERIALIZABLE for financial — prevents race conditions
that could cause fraud. The double-charging incident occurred because two
concurrent fee payment requests both read the student's balance (₹0), both
decided to charge, and both wrote the new balance (₹100) — one charge was
lost. SERIALIZABLE isolation (SSI) detects this conflict and aborts one
transaction, which retries. The retry sees the updated balance and correctly
decides not to charge. SERIALIZABLE is used only for financial methods (those
modifying Money fields) to avoid the performance overhead on non-financial
transactions. Rule (5) — 30s timeout — prevents long-running transactions
from holding locks. The default 30s is sufficient for all online transactions
(which are <1s typical, <5s worst case). Long-running operations (e.g., batch
fee generation for 10,000 students) use Spring Batch with chunked
transactions (100 students per transaction, 100 transactions total, each <5s). If
a transaction exceeds 30s, it is aborted and rolled back — this is a safety
mechanism, not a regular occurrence. Rule (6) — SERIALIZABLE retry —
handles serialization failures. When a SERIALIZABLE transaction conflicts with
another, PostgreSQL returns a serialization_failure error. Spring's
@Transactional(retry = ...) catches this error and retries the method (up to 3
times, with 100ms backoff). The retry re-executes the method from the
beginning, re-reading data and re-evaluating decisions. If the conflict persists
after 3 retries, the method fails with a serialization error (translated to a 409
Conflict HTTP response). Rule (7) — read-only transactions — enable
optimisations. @Transactional(readOnly = true) tells Hibernate to skip dirty
checking (no entities will be modified), improving performance. It also tells the
PostgreSQL driver to route the query to a read replica (per ADR-041),
offloading the primary. Read-only transactions are used for all GET endpoints
and for queries within application services. ArchUnit verifies that methods
without @Transactional(readOnly = true) do not call only repository find
methods (which indicates a read-only method missing the annotation). Rule (8)
— outbox in same transaction — is critical for reliable event delivery (per
ADR-027). The aggregate save and the outbox write are in the same transaction
— if the transaction commits, both are persisted; if it rolls back, neither is. This
prevents ghost events (published for a rolled-back change) and lost events (not
published for a committed change). The outbox write is the last operation in the
transaction (after the aggregate save), ensuring the aggregate is valid before
the event is queued.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Transaction Boundary
Rules | | | | Aggregate-
Scoped Transaction | |
+----------------------------------------------------------+ | | | @Transactional
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 159

PreOne ADR - Volume 2: Domain Architecture v3.0
| | | | confirm(cmd) { | | | | Enrollment agg =
repo.findById(cmd.id); // load 1 agg | | | | agg.confirm(cmd.by); //
modify 1 agg| | | | outbox.save(agg.events()); // save outbox | | | |
return result; | | | | }
| | | | (txn commits: agg + outbox atomic) | | |
+----------------------------------------------------------+ | |
| | Cross-Aggregate Workflow (Saga, per ADR-036) | |
+----------------------------------------------------------+ | | | Saga: Fee Payment
| | | | | | | | UoW1: create Payment
(@Transactional) | | | | --commit | | |
| --publish PaymentCreated | | | |
| | | | UoW2: mark Invoice paid (@Transactional) | | | | --listens for
PaymentCreated | | | | --commit
| | | | --publish InvoicePaid | | | |
| | | | UoW3: update Enrollment status (@Transactional) | | | | --listens
for InvoicePaid | | | | --commit
| | | | | | | | (if UoW2 fails, compensate:
cancel Payment) | | | +----------------------------------------------------------+ | |
| | Isolation Levels | |
+----------------------------------------------------------+ | | | Default: READ COMMITTED
(non-financial) | | | | @Transactional | | |
| - student profile update, attendance marking | | | |
| | | | Financial: SERIALIZABLE | | | |
@Transactional(isolation = SERIALIZABLE, retry = 3) | | | | - fee payment,
refund, invoice generation | | |
+----------------------------------------------------------+ | |
| | Timeout: 30s default, configurable | |
+----------------------------------------------------------+ | | | @Transactional(timeout = 30) //
default | | | | @Transactional(timeout = 60) // long operation |
| | | (batch jobs use chunked transactions, not long txns) | | |
+----------------------------------------------------------+ |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Fee Payment Saga (cross-aggregate, multiple transactions) App Svc (UoW1)
Payment Agg Outbox Event Bus Invoice Handler (UoW2) |
| | | | |--createPayment---->| | |
| | @Transactional | | | | | (SERIALIZABLE)
| | | | | |--create agg | |
| | |--event | | | | | |
| | | |--save-------->| | | |
| |--INSERT outbox | | |<--ok---------------| | |
| | | | | | | (UoW1 commits) |
| | | | | | | | |
| | (publisher) | | | | |--publish------>|
| | | | PaymentCreated| | | |
| |--deliver------->| | | | | | |
| | | |--markInvoicePaid | | |
| | @Transactional | | | | |
(SERIALIZABLE) | | | | | |
| | | |--load Invoice | | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 160

PreOne ADR - Volume 2: Domain Architecture v3.0
| |--invoice.markPaid() | | | |
|--save outbox | | | | | (InvoicePaid)
| | | | | | | |
| | (UoW2 commits) | | | | |
| | | | | (publisher) | |
| |<--publish-------| | | | | InvoicePaid |
| | | | | | (Enrollment handler listens
for InvoicePaid, updates status — UoW3) |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Transaction Boundary Components
| | | | Application Service (transaction
boundary) | | +---------------------+ +---------------------+ | | |
FeePaymentAppSvc | | @Transactional | | | | (@Service) |-->|
(isolation=SERIALIZABLE, retry=3)| | | + createPayment() | +---------------------+
| | | + processRefund() | | | +---------------------+
| | | | +---------------------+ +---------------------+
| | | StudentProfileSvc | | @Transactional | | | | (@Service) |-->|
(isolation=READ COMMITTED) | | | + updateEmail() | | (readOnly=false)
| | | +---------------------+ +---------------------+ | |
| | +---------------------+ +---------------------+ | | | StudentQuerySvc | |
@Transactional | | | | (@Service) |-->| (readOnly=true) | |
| | + findById() | | (routes to replica) | | | | + search() |
+---------------------+ | | +---------------------+ | |
| | Saga Orchestrator (cross-aggregate) | | +---------------------+
| | | FeePaymentSaga | coordinates UoW1, UoW2, UoW3 | | | +
execute(cmd) | via events | | | + compensate(sagaId)|
(rollback on failure) | | +---------------------+ | |
| | ArchUnit Enforcement | | +---------------------+
| | | @Service methods: | - @Transactional required | | | rules | -
<=1 repo.save() per method | | | | - financial methods:
SERIALIZABLE| | | | - read-only methods: readOnly=true| |
+---------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Single-Aggregate Transaction (e.g., update student email) | v +----
+-----+ | App Svc | @Transactional (READ COMMITTED) +----+-----+ |
|--1. load Student aggregate |--2. student.updateEmail(newEmail) |--3.
outbox.save(student.events()) |--4. (method returns) | v +----+-----+
| COMMIT | --aggregate + outbox atomic +----+-----+ Cross-Aggregate Saga
(e.g., fee payment) | v +----+-----+ | Saga | coordinates 3
transactions via events | Orchestr | --no single transaction spans multiple
aggregates +----+-----+ | |--UoW1: create Payment (@Transactional,
SERIALIZABLE) | --commit -> PaymentCreated event | |--UoW2:
mark Invoice paid (listens for PaymentCreated) | --@Transactional,
SERIALIZABLE | --commit -> InvoicePaid event | |--UoW3: update
Enrollment (listens for InvoicePaid) | --@Transactional, READ COMMITTED
| --commit -> saga complete | +--if any UoW fails: compensate (reverse
previous UoWs) SERIALIZABLE Conflict Scenario | v +----+-----+ |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 161

PreOne ADR - Volume 2: Domain Architecture v3.0
Txn A | reads balance=0, decides to charge 100 +----+-----+ | v
(concurrent) +----+-----+ | Txn B | reads balance=0, decides to charge 100
+----+-----+ | v +----+-----+ | Commit | --Txn A commits (balance=100)
| Race | --Txn B detects conflict (SSI) +----+-----+ | +--Txn B retries
(3x max) | --re-reads balance=100, decides not to charge | v +----
+-----+ | Correct | --no double-charge +----------+
DATABASE IMPACT
Transaction boundaries directly affect database locks and isolation. READ
COMMITTED transactions hold row-level locks for their duration; the one-
aggregate-per-transaction rule keeps locks scoped to one aggregate's rows.
SERIALIZABLE transactions use SSI (Serializable Snapshot Isolation), which
detects conflicts via predicate locks — these are lightweight (memory-based)
but can cause false positives under high concurrency. The 30s timeout prevents
long transactions from holding locks. Read-only transactions route to read
replicas (per ADR-041), offloading the primary. ArchUnit verifies that financial
methods use SERIALIZABLE and that transactions do not span aggregates.
API IMPACT
Transaction boundaries affect API behaviour. Single-aggregate transactions
(most API calls) return 200 OK or 201 Created immediately. Cross-aggregate
sagas return 202 Accepted (the first UoW commits, subsequent UoWs are
async). SERIALIZABLE conflicts may cause 409 Conflict (if retries are
exhausted), which the API consumer should handle by retrying. Read-only
endpoints (GET) use @Transactional(readOnly = true), routing to replicas and
improving read throughput. The API documentation indicates which endpoints
are async (202) and which may return 409 (financial endpoints).
UI IMPACT
Transaction boundaries affect UI feedback. Single-aggregate operations (e.g.,
update email) return immediately, and the UI shows success/failure. Saga
operations (e.g., fee payment) return 202 Accepted, and the UI shows
'Processing...' until the saga completes (via polling or webhook).
SERIALIZABLE conflicts (409) are rare; the UI may auto-retry or display
'Please try again'. The UI does not expose transaction boundaries to the user —
the user sees 'Payment successful' regardless of whether it was a single
transaction or a saga.
SECURITY IMPACT
Transaction boundaries improve security by ensuring atomic changes. A
SERIALIZABLE transaction on a financial operation prevents race conditions
that could be exploited for fraud (double-charging, double-refunding). The one-
aggregate-per-transaction rule prevents partial saves that could leave the
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 162

PreOne ADR - Volume 2: Domain Architecture v3.0
database in an inconsistent state (e.g., a student created without a guardian
record). The outbox-in-same-transaction rule ensures audit events are
published only for committed changes, preventing ghost audit entries that
could confuse forensic analysis.
PERFORMANCE IMPACT
Transaction boundaries have significant performance implications. READ
COMMITTED transactions are fast (no conflict detection) and scale well.
SERIALIZABLE transactions have 10-20% overhead (conflict detection) but are
used only for financial methods (~5% of traffic). The one-aggregate-per-
transaction rule keeps transactions short (8-24ms typical), reducing lock
contention. The 30s timeout prevents long transactions from degrading system
performance. Read-only transactions route to replicas, improving read
throughput by 3-5x. Overall, the transaction boundary rules improve
performance vs the pre-ADR-033 state (which had 200ms+ multi-aggregate
transactions).
SCALABILITY ANALYSIS
Transaction boundaries scale with the underlying database. PostgreSQL
handles thousands of concurrent READ COMMITTED transactions; the one-
aggregate-per-transaction rule ensures transactions do not block each other.
SERIALIZABLE transactions scale less well (more conflicts at high
concurrency), but financial transactions are a small fraction of traffic. Read
replicas scale read traffic horizontally. Sagas scale via event-driven processing
(per ADR-036). The 30s timeout prevents long transactions from degrading
scalability. At PreOne's projected scale (5,000 TPS), the transaction boundary
rules are sufficient.
OPERATIONAL CONSIDERATIONS
Transaction operations are observable via Micrometer: transaction.count (per
isolation level), transaction.duration (per isolation level, per method),
transaction.rollback.count (by cause: exception, serialization failure, timeout),
transaction.lock.timeout.count (deadlocks),
transaction.serialization.failure.count (SERIALIZABLE conflicts). Slow
transactions (>1s) are logged. The quarterly architecture scorecard audits: (a)
transaction duration (target: p95 <500ms), (b) SERIALIZABLE conflict rate
(target: <1%; higher indicates contention), (c) deadlock rate (target: <0.01%),
(d) timeout rate (target: <0.01%; higher indicates long transactions).
RISKS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 163

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| SERIALIZABLE       | Medium     | Medium | Monitor conflict    |
| conflicts cause    |            |        | rate; if >5%,       |
| excessive retries  |            |        | review transaction  |
| under high         |            |        | design; consider    |
| concurrency        |            |        | optimistic locking  |
or off-peak
scheduling for
batch financial
operations
| Engineers use  | Medium | High | ArchUnit blocks       |
| -------------- | ------ | ---- | --------------------- |
| READ           |        |      | financial methods     |
| COMMITTED for  |        |      | without               |
| financial      |        |      | SERIALIZABLE;         |
| transactions   |        |      | code review           |
| (forget        |        |      | checklist; financial  |
| SERIALIZABLE)  |        |      | method naming         |
convention
| 30s timeout is too  | Low | Low | Configurable per  |
| ------------------- | --- | --- | ----------------- |
| short for some      |     |     | method; batch     |
| valid operations    |     |     | operations use    |
chunked
transactions;
monitor timeout
rate
| Saga                | Low | High | Compensation is      |
| ------------------- | --- | ---- | -------------------- |
| compensation        |     |      | idempotent; saga     |
| fails, leaving the  |     |      | state is persisted;  |
| system in an        |     |      | manual               |
| inconsistent state  |     |      | reconciliation job   |
detects
incomplete sagas
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Correctness (atomic aggregate  Cross-aggregate workflows need sagas
| changes) |     | (complexity) |     |
| -------- | --- | ------------ | --- |
Performance (short transactions, READ  SERIALIZABLE overhead for financial
| COMMITTED) |     | (10-20%) |     |
| ---------- | --- | -------- | --- |
Concurrency (SERIALIZABLE prevents  Retries on conflict (latency for retried
| races) |     | requests) |     |
| ------ | --- | --------- | --- |
Predictability (clear boundaries) Engineers must learn isolation levels
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  164

PreOne ADR - Volume 2: Domain Architecture v3.0
REJECTED ALTERNATIVES
All transactions SERIALIZABLE (option 2) was prototyped: throughput dropped
15% due to conflict detection overhead, and non-financial transactions (student
profile updates) had a 2% conflict rate — unacceptable for non-financial
operations. All transactions READ COMMITTED (option 3) was the pre-
ADR-033 state for financial transactions and caused the double-charging
incident in Q4 2025 (₹50,000 lost before detection). Multi-aggregate
transactions (option 4) were the pre-ADR-033 state and produced 200ms+
transactions with frequent deadlocks; the fee payment workflow held locks
across Payment, Invoice, and Enrollment tables for 200ms, causing contention
under load.
MIGRATION PLAN
Phase 1 (complete): Audit all @Transactional methods for isolation level. Phase
2 (complete): Add SERIALIZABLE to 12 financial methods. Phase 3 (complete):
Refactor multi-aggregate transactions to sagas (5 workflows). Phase 4
(complete): Add @Transactional(readOnly = true) to 47 read methods. Phase 5
(complete): ArchUnit rules enforced in CI. Phase 6 (Q4 2026): Training session
for new engineers on isolation levels.
TESTING STRATEGY
Transaction boundary rules are tested at three levels. Unit tests: application
service methods are unit-tested with mocked repositories — verify the method
has @Transactional and the correct isolation. Integration tests: transactions
are tested with Testcontainers PostgreSQL — verify commit (data persisted),
rollback (no data on exception), and isolation (concurrent transactions produce
correct results). Concurrency tests: SERIALIZABLE methods are tested under
concurrent access — verify conflict detection and retry. ArchUnit tests:
structural rules (@Transactional required, financial methods SERIALIZABLE,
read methods readOnly) verified at compile time.
MONITORING & OBSERVABILITY
Transaction metrics: transaction.count (per isolation level),
transaction.duration (per method, p50/p95/p99), transaction.rollback.count (by
cause), transaction.lock.timeout.count, transaction.serialization.failure.count,
transaction.retry.count. Dashboards in Grafana: transaction duration per
domain, SERIALIZABLE conflict rate, deadlock rate. Alerts:
transaction.duration p95 >500ms, SERIALIZABLE conflict rate >5%, deadlock
rate >0.01%, timeout rate >0.01%.
FUTURE EVOLUTION
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 165

PreOne ADR - Volume 2: Domain Architecture v3.0
Two evolutions are possible. First, reactive transactions (R2DBC) may be
adopted if PreOne adopts Spring WebFlux — reactive transactions have
different semantics (no thread-local transaction). Second, the saga pattern
(ADR-036) may evolve into a workflow engine (ADR-037) with built-in
compensation and state management. The transaction boundary rules
themselves are stable; the SERIALIZABLE-for-financial rule is a long-standing
database best practice.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity drives
transaction correctness)
● ADR-022 — Aggregate Rules (one transaction = one aggregate)
● ADR-027 — Domain Events (outbox in same transaction)
● ADR-028 — Application Services (app service method = transaction
boundary)
● ADR-032 — Unit of Work (UoW is the transaction boundary mechanism)
● ADR-034 — Cross Domain Communication (cross-domain via events,
not multi-domain transactions)
● ADR-035 — Eventual Consistency (sagas enable eventual consistency
across transactions)
● ADR-036 — Saga Readiness (sagas coordinate multiple transactions)
● ADR-041 — PostgreSQL Strategy (underlying database with isolation
levels)
● ADR-049 — Optimistic Locking (version check within transaction)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — transaction
boundaries)
● Upstream PRD: PRD-003-section-8 (Billing transaction requirements)
● Downstream ERD: ERD-003 (Billing schema with version columns and
constraints)
● Downstream API Spec: API-003 (Billing API: 200 for single-agg, 202 for
saga, 409 for conflict)
● Downstream Test Cases: TC-0051 (Transaction boundary, isolation,
concurrency tests)
● External: PostgreSQL Documentation — Transaction Isolation (READ
COMMITTED, SERIALIZABLE)
● External: Spring @Transactional Documentation (isolation, timeout,
readOnly)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 166

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
DECISION HISTORY
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2025-12-06 | Draft  | Billing Domain  | Initial draft with 6  |
|            |        | Architect       | rules; expanded to    |
8 after review
| 2026-01-09 | Proposed | Billing Domain  | Submitted to ARB    |
| ---------- | -------- | --------------- | ------------------- |
|            |          | Architect       | after Billing pilot |
| 2026-02-04 | Accepted | ARB Chair       | ARB approved; 12    |
financial methods
SERIALIZABLE; 5
sagas migrated
| 2026-08-09 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)     |     |
| ----------- | --- | ------------------------ | --- |
| Tech Lead   |     | Billing Domain Architect |     |
| ARB Chair   |     | ARB Chair                |     |
| Approved On |     | 2026-08-09               |     |
IMPLEMENTATION CHECKLIST
● Audit all @Transactional methods (Done — 187 methods audited)
● Add SERIALIZABLE to 12 financial methods (Done — PR #5301)
● Refactor multi-aggregate transactions to sagas (Done — 5 workflows
migrated)
● Add readOnly=true to 47 read methods (Done — PR #5315)
● Configure 30s default timeout (Done — application.yml)
● ArchUnit rules: SERIALIZABLE for financial, readOnly for reads (Done
— CI gate since V1.9.0)
● Transaction metrics dashboard (Done — Grafana per domain)
● Training session for engineers (Done — 4 sessions delivered)
AD R -034
Cross Domain Communication
Volume 2 — Domain Architecture  -  Pattern
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  167

PreOne ADR - Volume 2: Domain Architecture v3.0
ACCEPTED
DECISION SUMMARY
DECISION
Define how PreOne's 12 bounded contexts communicate with each other.
Cross-domain communication is exclusively via domain events (ADR-027)
published through the outbox pattern. Direct service-to-service calls are
prohibited for cross-domain workflows. Each domain publishes events via
its public language (published events) and subscribes to other domains'
events via event handlers. The Anti-Corruption Layer (ACL) pattern
protects each domain from external event schema changes.
STATUS
Status Accepted
Date Decided 2026-02-11
Decision Owner Chief Architect
Review Cadence Annual or on domain restructuring
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-034, PreOne's domains communicated via direct service calls. The
Enrollment domain called BillingService.generateInvoice() directly, the Billing
domain called NotificationService.sendConfirmation() directly, and the
Reporting domain called StudentService.findById() directly. This produced
tight coupling: a change to BillingService's interface required changing
Enrollment; an outage in NotificationService blocked Enrollment; the
Reporting domain's read queries loaded Student aggregates, violating the
aggregate boundary (ADR-022). The Chief Architect led a 6-week refactoring
to introduce event-based cross-domain communication. The new pattern: each
domain publishes events via its outbox (per ADR-027) and subscribes to other
domains' events via event handlers. The Enrollment domain publishes
EnrollmentConfirmed; the Billing domain subscribes and generates an invoice.
The Billing domain publishes InvoiceGenerated; the Notification domain
subscribes and sends a confirmation. The Reporting domain subscribes to all
events and builds read models (per ADR-030 CQRS). This ADR codifies the
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 168

PreOne ADR - Volume 2: Domain Architecture v3.0
cross-domain communication rules. ArchUnit tests verify that domains do not
call each other directly and that event handlers use Anti-Corruption Layers.
BUSINESS DRIVERS
The primary driver is decoupling: domains that communicate via events do not
know about each other, enabling independent evolution. Enrollment can
change its confirmation flow without touching Billing. The secondary driver is
resilience: if the Notification domain is down, Enrollment still works (events
queue in the outbox and are delivered when Notification recovers). The tertiary
driver is scalability: event-based communication is asynchronous, so the
Enrollment transaction is short (24ms vs 200ms for direct calls). A fourth
driver is integration: external systems (analytics warehouse, partner APIs) can
subscribe to domain events without coupling to internal services. Events are
the integration contract; internal services can change without breaking
external subscribers. A fifth driver is auditability: events are facts that are
persisted (in the outbox) and archived, providing a complete audit trail of cross-
domain interactions.
PROBLEM STATEMENT
PreOne's domains communicate via direct service calls, producing tight
coupling, resilience issues, and scalability limitations. We must define cross-
domain communication rules that mandate event-based communication,
prohibit direct calls, and use Anti-Corruption Layers for schema protection.
CONSTRAINTS
● Cross-domain communication is exclusively via domain events
(ADR-027)
● Direct service-to-service calls across domains are prohibited
● Each domain publishes events via its public language (published
events)
● Event handlers use Anti-Corruption Layer (ACL) to translate external
events
● Event schemas are versioned (per ADR-040) for backward compatibility
ASSUMPTIONS
● Domain events (ADR-027) provide reliable delivery via the outbox
pattern
● Eventual consistency (ADR-035) is acceptable for cross-domain
workflows
● Redis Streams is sufficient for cross-domain event bus throughput
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 169

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Anti-Corruption Layers can translate between event schemas without
significant overhead
● Domains can be deployed independently (no shared deployment
dependencies)
OPTIONS CONSIDERED
| Option            | Pros                  | Cons                | Verdict |
| ----------------- | --------------------- | ------------------- | ------- |
| Event-based       | Decoupled;            | Eventual            | Chosen  |
| communication     | resilient; scalable;  | consistency (not    |         |
| with ACL (chosen) | auditable; aligns     | immediate); ACL     |         |
|                   | with DDD; enables     | boilerplate; event  |         |
|                   | independent           | schema              |         |
|                   | deployment.           | management;         |         |
operational
complexity (event
bus).
Direct service-to- Simple; immediate  Tight coupling;  Rejected
| service calls (pre- | consistency;    | cascading failures;  |     |
| ------------------- | --------------- | -------------------- | --- |
| ADR-034 state)      | familiar; no    | long transactions;   |     |
|                     | infrastructure. | cannot scale; pre-   |     |
ADR-034 state.
| Shared database  | No              | Tight coupling   | Rejected |
| ---------------- | --------------- | ---------------- | -------- |
| (domains read    | communication   | (schema changes  |          |
| each other's     | overhead;       | break other      |          |
| tables)          | immediate       | domains); no     |          |
|                  | consistency;    | independent      |          |
|                  | simple queries. | deployment;      |          |
violates bounded
context
(ADR-005); read
queries violate
aggregate
boundaries
(ADR-022).
| gRPC synchronous    | Type-safe;         | Synchronous (long   | Rejected |
| ------------------- | ------------------ | ------------------- | -------- |
| calls with circuit  | performant;        | transactions);      |          |
| breakers            | circuit breakers   | coupling (caller    |          |
|                     | prevent cascading  | knows callee); no   |          |
|                     | failures.          | audit trail; still  |          |
requires fallback
for callee outage.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  170

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following cross-domain communication rules: (1) Cross-domain
communication is exclusively via domain events — no direct service-to-
service calls across domain boundaries. (2) Each domain publishes events
via its outbox (per ADR-027) using its published language (event schemas
owned by the publishing domain). (3) Event handlers in subscribing
domains use an Anti-Corruption Layer (ACL) to translate external events
into the subscribing domain's model. (4) Event schemas are versioned (per
ADR-040) — subscribers handle multiple versions during rollout. (5)
Domains are deployed independently — no shared deployment
dependencies. (6) Cross-domain queries (e.g., Reporting needs Student
data) use read models (per ADR-030 CQRS), not direct queries to the
owning domain. (7) The event bus (Redis Streams) is the communication
substrate — no domain calls another domain's API directly. (8) Event
handlers are idempotent (per ADR-036) to handle duplicate delivery.
DETAILED RATIONALE
The chosen option is the only one that produces decoupled, resilient, scalable
cross-domain communication. Direct service calls (option 2) were the pre-
ADR-034 state and produced the coupling and resilience problems that
motivated this ADR. Shared database (option 3) violates bounded contexts
(ADR-005) and prevents independent deployment. gRPC with circuit breakers
(option 4) is still synchronous and does not solve the long-transaction problem.
Rule (1) — events only — is the core rule. Domains do not call each other's
services; they publish events and subscribe to events. This decouples domains:
the Enrollment domain does not know that Billing exists; it only knows that it
publishes EnrollmentConfirmed. The Billing domain subscribes to
EnrollmentConfirmed and generates an invoice. If Billing is removed or
replaced, Enrollment is unaffected. ArchUnit verifies that no class in
com.preone.enrollment imports from com.preone.billing (or any other domain).
Rule (2) — published language — means each domain owns its event schemas.
The Enrollment domain owns the EnrollmentConfirmed event schema; the
Billing domain owns the InvoiceGenerated event schema. Subscribing domains
consume these schemas as-is (via ACL translation). The publishing domain can
evolve its schema (with versioning, per rule 4) but cannot break subscribers
without a deprecation period. The published language is part of the domain's
public API and is governed by the Domain Architect. Rule (3) — Anti-Corruption
Layer — protects the subscribing domain from external event schema changes.
When the Billing domain subscribes to EnrollmentConfirmed, it does not use
the EnrollmentConfirmed event directly in its domain model. Instead, an ACL
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 171

PreOne ADR - Volume 2: Domain Architecture v3.0
translator converts EnrollmentConfirmed to a Billing-internal event
(EnrollmentConfirmedForBilling) that uses Billing's ubiquitous language. If
Enrollment changes EnrollmentConfirmed (e.g., adds a field, renames a field),
the ACL absorbs the change; Billing's internal model is unaffected. The ACL is a
thin adapter (typically <50 lines) that maps fields and validates the external
event. Rule (4) — versioned schemas — enables evolution. An event may add
fields in a new version (e.g., EnrollmentConfirmedV2 adds guardianEmail);
subscribers that do not need the new field continue to work with V1. The event
version is in the event metadata (per ADR-027); subscribers check the version
and handle accordingly. Breaking changes (field removal, type change) require
a deprecation period (minimum 2 release cycles) during which both versions
are published. The ACL handles version translation during the deprecation
period. Rule (5) — independent deployment — is a key benefit of event-based
communication. Domains can be deployed independently because they do not
depend on each other's availability. Enrollment can be deployed while Billing is
down (EnrollmentConfirmed events queue in the outbox; Billing processes
them when it recovers). This enables continuous deployment per domain —
each domain ships at its own pace. Rule (6) — read models for queries — solves
the cross-domain query problem. The Reporting domain needs Student data,
but it cannot query the Student domain's database (that would violate rule 1)
and cannot call StudentService.findById() (also violates rule 1). Instead,
Reporting subscribes to Student events (StudentCreated, StudentUpdated) and
builds a read model (a denormalised student table in the Reporting schema).
Queries use the read model, not the Student domain. This is the CQRS pattern
(ADR-030) applied to cross-domain reads. Rule (7) — Redis Streams as event
bus — is the communication substrate. Redis Streams provides ordered
delivery (per consumer group), at-least-once semantics, and consumer groups
(multiple subscribers per stream). Domains publish to streams named by event
type (e.g., enrollment-stream, billing-stream); subscribers consume via
consumer groups. Redis Streams throughput (10,000 events/second) is
sufficient for PreOne's peak (1,000 events/second). If PreOne outgrows Redis,
migration to Kafka is possible without domain changes (only the event bus
implementation changes). Rule (8) — idempotent handlers — handles duplicate
delivery. The outbox publisher may publish the same event twice (e.g., if it
crashes after publishing but before marking the outbox entry as PUBLISHED).
Event handlers track processed eventIds (in a processed_events table) and skip
duplicates. Idempotency is detailed in ADR-036.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Cross-Domain
Communication (Event-Based) | |
| | Enrollment Domain Event Bus (Redis Streams) | |
+---------------------+ +---------------------+ | | | Enrollment App Svc | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 172

PreOne ADR - Volume 2: Domain Architecture v3.0
enrollment-stream | | | | + confirm() |--->| (EnrollmentConfirmed|
| | | @Transactional | | events) | | | | outbox.save() |
+----------+----------+ | | +---------------------+ | | |
publish | | | +---------------------+ | | | |
Outbox Publisher |---------------+ | | | (reads PENDING, |
| | | publishes to Redis)| | | +---------------------+
| | | | Billing Domain (subscriber)
Notification Domain | | +---------------------+ +---------------------+ | | |
EnrollmentConfirmed | | EnrollmentConfirmed | | | | Handler |
| Handler | | | | (ACL translates | | (ACL translates | | | |
to Billing-internal| | to Notification- | | | | event) | |
internal event) | | | +----------+----------+ +----------+----------+ | | |
| | | v v | | +---------------------+
+---------------------+ | | | Invoice App Svc | | Email App Svc | | | | +
generateInvoice() | | + sendConfirmation()| | | | @Transactional |
| @Transactional | | | +---------------------+ +---------------------+ | |
| | Reporting Domain (subscriber, builds read model) | |
+---------------------+ | | | All-Events Handler | subscribes
to all streams | | | (updates read | builds denormalised read models
| | | models) | (CQRS per ADR-030) | | +---------------------+
| | | | ArchUnit:
| | - No imports across domain packages | | - Event handlers
use ACL (translator class) | | - No direct service calls across domains
| +------------------------------------------------------------------+
SEQUENCE DIAGRAM
Enrollment Domain Event Bus Billing Domain (ACL) Billing App Svc |
| | | |--confirm()--------| | | |
outbox.save() | | | | (EnrollmentConf) | |
| | | | | | (publisher) | |
| |--publish--------->| | | | EnrollmentConf |
| | | | | | | |
(deliver to | | | | consumer group) |
| | |--deliver---------->| | | |
EnrollmentConf | | | | | | |
| |--ACL translate | | | | EnrollmentConf
-> | | | | EnrollmentConfForBilling | | |
| (Billing's internal model)| | | | | |
| |--check idempotency | | | | (eventId in
| | | | processed_events?) | | |
| | | | |--generateInvoice()-->| |
| | | @Transactional | | |
| --load/create Invoice | | | | --
outbox.save(InvoiceGen) | | | | --commit
| | |<--ok-----------------| | | |
| | | |--ack event | | |<--ack-------------|
| | | | | | | |
(InvoiceGenerated | | | | event published | |
| | to billing-stream, | | | | consumed by
| | | | Notification, | | | |
Reporting, etc.) |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 173

PreOne ADR - Volume 2: Domain Architecture v3.0
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Cross-Domain Communication
Components | | | | Publishing
Domain (e.g., Enrollment) | | +---------------------+ +---------------------+
| | | EnrollmentConfirmed | | OutboxRepository | | | | (event, published
|-->| (saves event in | | | | language) | | same txn as agg) |
| | +---------------------+ +---------------------+ | |
| | +---------------------+ | | | Outbox Publisher | reads
PENDING, publishes to | | | (separate process) | Redis Streams |
| +---------------------+ | |
| | Event Bus (Redis Streams) | | +---------------------+
| | | enrollment-stream | consumer groups per subscriber | | | billing-stream
| at-least-once delivery | | | student-stream | | |
+---------------------+ | | |
| Subscribing Domain (e.g., Billing) with ACL | | +---------------------+
+---------------------+ | | | EnrollmentConfirmed | | EnrollmentConfirmed |
| | | Handler |-->| ACL Translator | | | | (consumer group) | |
(external -> | | | +---------------------+ | internal event) | | |
+---------------------+ | | | |
+---------------------+ +---------------------+ | | | EnrollmentConfirmed | | Invoice
App Svc | | | | ForBilling |-->| (uses internal | | | | (Billing's
internal | | event, not external)| | | | event) | +---------------------+
| | +---------------------+ | |
| | +---------------------+ | | | ProcessedEvents | tracks
eventId for idempotency | | | (table per domain) | (skip duplicates) | |
+---------------------+ | | |
| Reporting Domain (CQRS read model) | | +---------------------+
| | | All-Events Handler | subscribes to all streams, | | | (builds read
models)| updates denormalised tables | | +---------------------+
| +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Enrollment.confirm() (in Enrollment domain) | v +----+-----+ | Outbox
| EnrollmentConfirmed event (PENDING) | (Enroll) | (same txn as aggregate
save) +----+-----+ | v (publisher) +----+-----+ | Event Bus| enrollment-
stream (Redis Streams) | (Redis) | (at-least-once delivery) +----+-----+ |
+--deliver to Billing consumer group | (ACL translates to
EnrollmentConfirmedForBilling) | (idempotency check: eventId in
processed_events?) | --if new: process (generate Invoice) | --if
duplicate: skip (ack) | +--deliver to Notification consumer group |
(ACL translates to EnrollmentConfirmedForNotification) | (idempotency
check) | --if new: process (send email) | --if duplicate: skip | +--
deliver to Reporting consumer group | (updates read model:
enrollment_read_model table) | (idempotency check) | v +----+-----
+ | Multiple | Billing: InvoiceGenerated -> billing-stream | Domain |
Notification: EmailSent -> notification-stream | Updates | Reporting: read
model updated +----------+
DATABASE IMPACT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 174

PreOne ADR - Volume 2: Domain Architecture v3.0
Cross-domain communication via events does not directly affect the database —
each domain has its own schema, and events are in the outbox (per domain).
However, the read model pattern (rule 6) adds denormalised tables in
subscribing domains' schemas. The Reporting domain has a
student_read_model table (denormalised Student data) updated by event
handlers. These tables are in the Reporting schema, not the Student schema —
domain boundaries are preserved at the database level. ArchUnit verifies that
no domain queries another domain's tables directly. The processed_events
table (for idempotency) is in each domain's schema, tracking processed
eventIds.
API IMPACT
Cross-domain communication does not directly affect the API — the API is per-
domain. However, cross-domain workflows affect API behaviour: an API
request to Enrollment may trigger events that Billing, Notification, and
Reporting consume asynchronously. The API response (202 Accepted for saga
workflows) does not wait for cross-domain processing. The API consumer polls
or receives a webhook for completion. This async pattern improves API
responsiveness but requires the API consumer to handle eventual consistency.
UI IMPACT
Cross-domain communication affects UI feedback. A user action in one domain
(e.g., confirming an enrollment) triggers processing in other domains (invoice
generation, email notification). The UI shows 'Confirmed' for the enrollment
immediately, but the invoice and email may take seconds to minutes (eventual
consistency). The UI may poll or receive a WebSocket notification (per
ADR-145) for cross-domain completion. The UI should set user expectations
('You will receive a confirmation email shortly').
SECURITY IMPACT
Cross-domain communication via events improves security by reducing the
attack surface. Domains do not expose APIs to each other (no direct calls), so
there are no inter-domain API vulnerabilities. Events carry only aggregate IDs
(not PII), reducing the data exposed in the event bus. The ACL pattern ensures
external events are validated before processing — an attacker cannot inject a
malicious event that bypasses validation. The processed_events table provides
an audit trail of which events were processed by which domain.
PERFORMANCE IMPACT
Cross-domain communication via events has a small performance cost: the
publisher adds ~2ms (outbox write), the event bus adds 50-200ms (delivery
latency), and the consumer adds ~2ms (idempotency check). The benefit is
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 175

PreOne ADR - Volume 2: Domain Architecture v3.0
much shorter transactions (24ms vs 200ms for direct calls) because cross-
domain processing is asynchronous. Overall throughput improves by 5-10x due
to reduced lock contention. The eventual consistency (50-200ms latency) is
acceptable for all PreOne workflows — immediate consistency is not required
for cross-domain operations.
SCALABILITY ANALYSIS
Cross-domain communication scales horizontally. The event bus (Redis
Streams) scales with partitioning (events partitioned by aggregate_id for
ordering). Consumers scale independently per domain — Billing can scale to 10
instances while Notification scales to 2, based on load. The read model pattern
scales reads — Reporting queries its own denormalised tables, not the Student
domain's database. At PreOne's projected scale (1,000 events/second, 12
domains, 47 event types), the architecture is sufficient. If Redis Streams
becomes a bottleneck, migration to Kafka is possible without domain changes.
OPERATIONAL CONSIDERATIONS
Cross-domain operations are observable via: event.published.count (per event
type, per domain), event.delivered.latency (commit to consumer),
event.consumer.processing.time (per consumer), event.consumer.error.count
(per consumer), event.consumer.lag (per consumer group),
acl.translation.error.count (ACL failures). The quarterly architecture scorecard
audits: (a) event delivery latency (target: p95 <1s), (b) consumer error rate
(target: <0.1%), (c) consumer lag (target: <100 events; higher indicates slow
consumer), (d) ArchUnit violations (target: zero — no direct cross-domain
calls).
RISKS
Risk Likelihood Impact Mitigation
Event bus (Redis) Low High Outbox retains
outage disrupts events until
cross-domain PUBLISHED;
communication Redis persistence
(AOF); Redis
replica; fallback to
direct DB polling
if Redis
unavailable
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 176

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk             | Likelihood | Impact | Mitigation         |
| ---------------- | ---------- | ------ | ------------------ |
| ACL translation  | Low        | Medium | ACL is simple      |
| fails, blocking  |            |        | (<50 lines); unit- |
| event processing |            |        | tested; failed     |
translations go to
dead-letter queue
for manual review
| Event schema   | Medium | High | Versioning per  |
| -------------- | ------ | ---- | --------------- |
| changes break  |        |      | ADR-040;        |
| subscribers    |        |      | backward-       |
compatible
changes only;
deprecation
period; ACL
absorbs minor
changes
| Consumer falls      | Medium | Medium | Monitor consumer     |
| ------------------- | ------ | ------ | -------------------- |
| behind (lag),       |        |        | lag; scale           |
| causing stale read  |        |        | consumer             |
| models              |        |        | instances; alert if  |
lag >100 events;
read models are
eventually
consistent
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Decoupled domains (independent  Eventual consistency (not immediate)
evolution)
Resilient (events queue during outages) Operational complexity (event bus,
outbox, ACL)
Scalable (async, short transactions) Idempotency required (consumer
complexity)
Auditable (events are facts) Event schema management (versioning,
ACL)
REJECTED ALTERNATIVES
Direct service calls (option 2) were the pre-ADR-034 state. Three issues: (1)
Enrollment called BillingService.generateInvoice() directly, so a Billing outage
blocked Enrollment; (2) changing BillingService's interface required changing
Enrollment, violating Open/Closed; (3) the Enrollment transaction held locks
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  177

PreOne ADR - Volume 2: Domain Architecture v3.0
across Enrollment and Billing tables for 200ms, causing contention. Shared
database (option 3) was prototyped by the Reporting team, who queried the
Student schema directly — a schema change to students broke Reporting, and
the read queries violated aggregate boundaries. gRPC with circuit breakers
(option 4) was prototyped: the circuit breaker prevented cascading failures, but
the synchronous nature meant Enrollment still waited for Billing (200ms
transaction), and Billing's outage still degraded Enrollment (circuit breaker
returned fallback, but the user saw an error).
MIGRATION PLAN
Phase 1 (complete): Define published language (event schemas) for all 12
domains. Phase 2 (complete): Implement outbox and publisher in all domains.
Phase 3 (complete): Implement ACLs in all subscribing domains. Phase 4
(complete): Replace direct cross-domain calls with event subscriptions (47 calls
replaced). Phase 5 (complete): Build read models for cross-domain queries
(Reporting, Analytics). Phase 6 (complete): ArchUnit rules enforced in CI.
Phase 7 (Q4 2026): Training session for new engineers on event-based
communication.
TESTING STRATEGY
Cross-domain communication is tested at three levels. Unit tests: ACL
translators are unit-tested with various event versions and payloads.
Integration tests: event flow is tested end-to-end with Testcontainers
PostgreSQL and Redis — verify event appears in outbox, publisher delivers to
Redis, consumer processes via ACL. Contract tests: event schemas have
contract tests verifying backward compatibility across versions. ArchUnit tests:
structural rules (no cross-domain imports, event handlers use ACL, no direct
service calls) verified at compile time. Consumer idempotency tests: each
consumer is tested with duplicate events.
MONITORING & OBSERVABILITY
Cross-domain metrics: event.published.count (per event type, per domain),
event.delivered.latency (commit to consumer, p50/p95/p99),
event.consumer.processing.time (per consumer), event.consumer.error.count
(per consumer, by exception type), event.consumer.lag (per consumer group,
gauge), acl.translation.error.count, dead-letter.queue.count (gauge).
Dashboards in Grafana: event flow per domain, consumer lag per domain, ACL
error rate. Alerts: consumer lag >100 events, consumer error rate >0.1%, ACL
error rate >0.01%, dead-letter queue >0.
FUTURE EVOLUTION
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 178

PreOne ADR - Volume 2: Domain Architecture v3.0
Three evolutions are likely. First, the event bus may migrate from Redis
Streams to Kafka if throughput exceeds 10,000 events/second — domain code is
unaffected (only the event bus implementation changes). Second, events may
be exposed to external systems via a public event API (webhooks or SSE) for
integration partners — this requires event versioning and a public schema
registry. Third, the saga pattern (ADR-036) may evolve into a workflow engine
(ADR-037) with built-in compensation and state management, but the event-
based communication substrate remains unchanged.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P4 Observability via
event audit trail)
● ADR-004 — Domain Driven Design (bounded context communication)
● ADR-005 — Bounded Context Strategy (12 domains that communicate
via events)
● ADR-007 — Dependency Rule (no cross-domain dependencies)
● ADR-021 — Domain Ownership (each domain owns its event schemas)
● ADR-022 — Aggregate Rules (events carry aggregate IDs)
● ADR-027 — Domain Events (event publication via outbox)
● ADR-030 — CQRS Strategy (read models for cross-domain queries)
● ADR-035 — Eventual Consistency (cross-domain is eventually
consistent)
● ADR-036 — Saga Readiness (sagas coordinate cross-domain workflows)
● ADR-040 — Domain Versioning (event schema versioning)
REFERENCES
● Upstream DDD: DDD-001 (Strategic Design — context mapping,
published language, ACL)
● Upstream PRD: PRD-001-section-4 (Cross-domain workflows)
● Downstream ERD: ERD-006 (read model tables in Reporting schema)
● Downstream API Spec: API-005 (async API patterns: 202 Accepted,
webhooks)
● Downstream Test Cases: TC-0052..TC-0054 (ACL, event flow,
idempotency tests)
● External: Eric Evans — Domain-Driven Design, Chapter 14
(Maintaining Model Integrity — ACL)
● External: Microservices Patterns — Chris Richardson (Event-Based
Communication)
DECISION HISTORY
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 179

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2025-12-13 | Draft  | Chief Architect | Initial draft with 6  |
rules; expanded to
8 after review
| 2026-01-15 | Proposed | Chief Architect | Submitted to ARB  |
| ---------- | -------- | --------------- | ----------------- |
after Enrollment-
Billing pilot
| 2026-02-11 | Accepted | ARB Chair | ARB approved; 47  |
| ---------- | -------- | --------- | ----------------- |
cross-domain calls
replaced with
events
| 2026-08-11 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR) |     |
| ----------- | --- | -------------------- | --- |
| Tech Lead   |     | Foundation Tech Lead |     |
| ARB Chair   |     | ARB Chair            |     |
| Approved On |     | 2026-08-11           |     |
IMPLEMENTATION CHECKLIST
● Define published language (event schemas) for 12 domains (Done — 87
event types)
● Implement outbox and publisher in all domains (Done — PR #5401)
● Implement ACLs in subscribing domains (Done — 47 ACL translators)
● Replace direct cross-domain calls with event subscriptions (Done — 47
calls replaced)
● Build read models for cross-domain queries (Done — Reporting,
Analytics)
● ArchUnit rules: no cross-domain imports, ACL required (Done — CI
gate since V1.9.0)
● Consumer idempotency audit (Done — all 47 consumers verified
idempotent)
● Training session for engineers (Done — 4 sessions delivered)
AD R -035
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  180

PreOne ADR - Volume 2: Domain Architecture v3.0
Eventual Consistency
Volume 2 — Domain Architecture - Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Embrace eventual consistency for cross-aggregate and cross-domain
workflows in the PreOne platform. Within an aggregate, strong consistency
holds (per ADR-022). Across aggregates and domains, eventual consistency
is the default — changes propagate via domain events (ADR-027) with
delivery latency typically under 1 second. The platform communicates
eventual consistency to users via UI feedback ('Processing...') and to API
consumers via 202 Accepted responses.
STATUS
Status Accepted
Date Decided 2026-02-18
Decision Owner Chief Architect
Review Cadence Annual or on consistency model
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-035, PreOne attempted strong consistency everywhere. Cross-
aggregate workflows used multi-aggregate transactions (e.g., Enrollment +
Invoice + Notification in one transaction) to guarantee immediate consistency.
This produced 200ms+ transactions, frequent deadlocks, and scalability limits
— the system could not exceed 500 TPS. The team also struggled with
distributed transactions when a workflow spanned services (e.g., Enrollment in
service A, Notification in service B). The Chief Architect led a 4-week
evaluation of consistency models. The conclusion: strong consistency is
necessary within an aggregate (data integrity, per ADR-022) but is overly
expensive across aggregates and domains. Eventual consistency — where
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 181

PreOne ADR - Volume 2: Domain Architecture v3.0
changes propagate via events with a small delay — is sufficient for PreOne's
workflows and enables the platform to scale to 5,000+ TPS. The key insight is
that PreOne's users (parents, teachers, administrators) do not notice a 1-second
delay between 'enrollment confirmed' and 'invoice generated' — but they do
notice if the system is slow or unavailable. This ADR codifies the eventual
consistency model. ArchUnit tests verify that cross-aggregate workflows do not
use multi-aggregate transactions (which would attempt strong consistency).
BUSINESS DRIVERS
The primary driver is scalability: eventual consistency enables short
transactions (one aggregate) and async processing, allowing the platform to
scale to 5,000+ TPS. Strong consistency (multi-aggregate transactions) caps
throughput at ~500 TPS due to lock contention. The secondary driver is
resilience: eventual consistency decouples domains — if the Notification
domain is down, Enrollment still works (events queue and are delivered when
Notification recovers). The tertiary driver is user experience: users do not
notice sub-second delays, and the UI can provide feedback ('Processing...') that
sets correct expectations. A fourth driver is developer experience: eventual
consistency via events is simpler to reason about than distributed transactions
(2PC, sagas with synchronous compensation). The event-based model (publish,
subscribe, idempotent consumer) is well-understood and has mature tooling
(Redis Streams, outbox pattern).
PROBLEM STATEMENT
PreOne attempts strong consistency everywhere, producing long transactions,
deadlocks, and scalability limits. We must define a consistency model that
embraces eventual consistency for cross-aggregate and cross-domain
workflows while maintaining strong consistency within aggregates.
CONSTRAINTS
● Strong consistency within an aggregate (per ADR-022)
● Eventual consistency across aggregates and domains (default)
● Event delivery latency target: p95 <1 second, p99 <5 seconds
● Eventual consistency is communicated to users (UI feedback) and API
consumers (202 Accepted)
● Saga compensation (ADR-036) handles cross-aggregate failures
ASSUMPTIONS
● Users do not notice sub-second delays between related operations
(enrollment confirmed, invoice generated)
● Event delivery via outbox + Redis Streams achieves p95 <1s latency
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 182

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Saga compensation can reverse failed cross-aggregate workflows
within 30 seconds
● Idempotent consumers (ADR-036) handle duplicate event delivery
correctly
● Read models (per ADR-030 CQRS) are eventually consistent with the
source aggregate
OPTIONS CONSIDERED
| Option             | Pros                  | Cons                 | Verdict |
| ------------------ | --------------------- | -------------------- | ------- |
| Eventual           | Scalable; resilient;  | Users may see        | Chosen  |
| consistency for    | simpler than          | stale data briefly;  |         |
| cross-agg, strong  | distributed           | saga                 |         |
| for intra-agg      | transactions;         | compensation is      |         |
| (chosen)           | aligns with DDD;      | complex; testing     |         |
|                    | user-acceptable       | eventual             |         |
|                    | latency.              | consistency is       |         |
harder than
strong.
| Strong             | Immediate        | Long transactions;  | Rejected |
| ------------------ | ---------------- | ------------------- | -------- |
| consistency        | consistency;     | deadlocks;          |          |
| everywhere         | simpler mental   | scalability cap     |          |
| (multi-aggregate   | model; no stale  | ~500 TPS;           |          |
| transactions, pre- | reads.           | distributed         |          |
| ADR-035 state)     |                  | transactions are    |          |
complex (2PC);
pre-ADR-035
state.
| Strong             | Atomicity across  | 2PC is blocking     | Rejected |
| ------------------ | ----------------- | ------------------- | -------- |
| consistency via    | aggregates;       | (locks held during  |          |
| distributed        | immediate         | prepare); not       |          |
| transactions (2PC) | consistency; no   | supported by        |          |
|                    | compensation.     | Redis;              |          |
performance
disaster; not
resilient
(coordinator
failure blocks all).
| Eventual          | Maximum              | Data corruption     | Rejected |
| ----------------- | -------------------- | ------------------- | -------- |
| consistency       | scalability; no      | risk (partial       |          |
| everywhere        | transactions at all. | aggregate           |          |
| (including intra- |                      | updates); violates  |          |
| aggregate)        |                      | ADR-022;            |          |
unacceptable for
financial data.
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  183

PreOne ADR - Volume 2: Domain Architecture v3.0
DECISION
ADOPTED
Adopt the following eventual consistency rules: (1) Strong consistency
within an aggregate — one transaction, one aggregate (per ADR-022). (2)
Eventual consistency across aggregates and domains — changes propagate
via domain events (ADR-027). (3) Event delivery latency target: p95 <1s,
p99 <5s — monitored via Micrometer. (4) Eventual consistency is
communicated to users via UI feedback ('Processing...', 'You will receive an
email shortly') and to API consumers via 202 Accepted (for async
operations) and documentation. (5) Saga compensation (ADR-036) handles
cross-aggregate failures — if a saga step fails, previous steps are
compensated (reversed). (6) Read models (per ADR-030 CQRS) are
eventually consistent — the read model may lag the source aggregate by
<1s. (7) Strong consistency is opt-in for specific use cases (e.g., financial
balance checks) via SERIALIZABLE transactions (per ADR-033) within a
single aggregate. (8) The platform never blocks on cross-aggregate
consistency — if the user needs confirmation of cross-aggregate
completion, they poll or receive a webhook.
DETAILED RATIONALE
The chosen option is the only one that produces both scalability and
correctness. Strong consistency everywhere (option 2) was the pre-ADR-035
state and capped throughput at 500 TPS. Distributed transactions (option 3)
are a performance disaster — 2PC holds locks during the prepare phase,
effectively serialising all transactions. Eventual consistency everywhere (option
4) sacrifices data integrity within aggregates, which is unacceptable. Rule (1)
— strong within aggregate — is non-negotiable. An aggregate's invariants must
hold at all times; if a transaction modifies an aggregate, it commits atomically.
This is enforced by ADR-022 (one transaction, one aggregate) and ADR-032
(Unit of Work). Without strong intra-aggregate consistency, the platform would
corrupt data (e.g., an enrollment with 6 discounts when the limit is 5). Rule (2)
— eventual across aggregates — is the key decision. When
Enrollment.confirm() commits, the Invoice is not yet generated (Billing
subscribes to EnrollmentConfirmed and generates it async). The user sees
'Enrollment confirmed' immediately; the invoice appears within 1 second. This
is acceptable because the user does not need the invoice to confirm the
enrollment — they need it for payment, which happens later. The 1-second
delay is invisible to the user. Rule (3) — latency target — is monitored. The
outbox publisher reads PENDING events every 100ms; Redis Streams delivers
to consumers within 50ms; consumers process within 100ms. Total latency:
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 184

PreOne ADR - Volume 2: Domain Architecture v3.0
~250ms typical, <1s p95, <5s p99. If latency exceeds targets, the architecture
scorecard flags it for investigation (publisher lag, consumer lag, or
infrastructure issues). Rule (4) — communicate to users — is critical for UX.
The UI must not lie — if the invoice is not yet generated, the UI should say
'Invoice is being generated...' not 'Invoice generated'. The 202 Accepted HTTP
status (for async operations) signals to API consumers that the operation is in
progress. API documentation indicates which operations are async and how to
check completion (polling endpoint or webhook). Setting correct expectations
prevents user confusion and support tickets. Rule (5) — saga compensation —
handles failures. If the Invoice generation fails (e.g., Billing domain is down),
the saga compensates by cancelling the Enrollment (reversing the
confirmation). The user sees 'Enrollment confirmation failed — please try again'
or 'Enrollment confirmed, invoice generation pending' (depending on the saga's
compensation policy). Compensation is complex but necessary — without it, a
failed cross-aggregate workflow leaves the system in an inconsistent state.
Rule (6) — read models are eventually consistent — is the CQRS pattern
(ADR-030). The Reporting domain's read model (denormalised Student data)
may lag the Student aggregate by <1s. A report generated at time T may not
include a student created at T+0.5s. This is acceptable for reporting (reports
are not real-time; they are periodic). For real-time reads (e.g., the Student
profile page), the read is from the Student aggregate directly (strong
consistency), not from a read model. Rule (7) — strong consistency opt-in —
allows specific use cases to use SERIALIZABLE isolation (per ADR-033) for
intra-aggregate transactions that require it. For example, a fee payment
transaction that checks the student's balance and charges the fee must be
SERIALIZABLE to prevent double-charging (two concurrent payments both
reading balance=0). This is strong consistency within a single aggregate (the
Payment aggregate), not across aggregates. Rule (8) — never block on cross-
aggregate — is a UX principle. If the user clicks 'Confirm Enrollment' and the
platform waits for Invoice generation (cross-aggregate) before responding, the
user waits 1-5 seconds — unacceptable. Instead, the platform responds
immediately ('Confirmed') and generates the invoice async. If the user needs to
see the invoice, they refresh the page (the invoice is now generated) or receive
a notification. Blocking on cross-aggregate consistency would reintroduce the
scalability problems that eventual consistency solves.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Consistency Model
| | | | Within Aggregate: STRONG
CONSISTENCY | | +----------------------------------------------------------+ |
| | @Transactional | | | | confirm() {
| | | | Enrollment agg = repo.findById(id); | | | | agg.confirm();
// invariants enforced | | | | outbox.save(agg.events()); // atomic
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 185

PreOne ADR - Volume 2: Domain Architecture v3.0
with agg | | | | // commit: agg + outbox atomic | | | | }
| | | +----------------------------------------------------------+ | | (one transaction, one
aggregate, ACID) | | | |
Across Aggregates/Domains: EVENTUAL CONSISTENCY | |
+----------------------------------------------------------+ | | | Enrollment.confirm() commits
| | | | | | | | | v (event published, async)
| | | | EnrollmentConfirmed event | | | | |
| | | | +--Billing subscribes (Invoice generated ~250ms later) | | | | +--
Notification subscribes (email sent ~300ms later) | | | | +--Reporting
subscribes (read model updated ~200ms) | | | |
| | | | (user sees 'Confirmed' immediately; invoice/email async) | | |
+----------------------------------------------------------+ | |
| | Latency Targets | |
+----------------------------------------------------------+ | | | p50: ~250ms (typical)
| | | | p95: <1s (target) | | | | p99: <5s (target)
| | | +----------------------------------------------------------+ | |
| | User Communication | |
+----------------------------------------------------------+ | | | UI: 'Enrollment confirmed.
Invoice is being generated...' | | | | API: 202 Accepted (async operation)
| | | | API: 200 OK (sync operation, single aggregate) | | |
+----------------------------------------------------------+ | |
| | Failure Handling: Saga Compensation (ADR-036) | |
+----------------------------------------------------------+ | | | If Invoice generation fails:
| | | | saga compensates: cancel Enrollment confirmation | | | | user
sees: 'Confirmation failed, please try again' | | |
+----------------------------------------------------------+ |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
User UI API Enrollment Agg Event Bus Billing Agg | |
| | | | |--confirm-->| | | |
| | |--POST------>| | | | | | |--
confirm()---->| | | | | | @Transactional| |
| | | | |--update state | | | | |
|--outbox.save | | | | | | (EnrollConf) | | |
| | |--commit | | | | |<--ok-----------|
| | | |<--202------| | | | | | Accepted
| | | | |<--'Confirmed'--| | | |
| | | | | | | | (user sees 'Confirmed, invoice
being generated') | | | | | | | |
| | | (async, ~250ms later) | | | | |
| | | | | | | (publisher) | | | |
| |--publish----->| | | | | | EnrollConf |
| | | | | |--deliver--->| | | | |
| | | | | | | |--generateInvoice |
| | | | | @Transactional | | |
| | |--commit | | | | | | |
| | | | | (InvoiceGenerated | | |
| | | event published) | | | | |
| | (user refreshes page, sees invoice ~1s later) | | | |
| | | | | (if invoice generation fails, saga compensates:
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 186

PreOne ADR - Volume 2: Domain Architecture v3.0
cancel enrollment) | | | | | | | |
<--'Confirmation failed' (via webhook or poll) | |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Consistency Model Components
| | | | Strong Consistency (within
aggregate) | | +---------------------+ +---------------------+ | | |
Enrollment Agg | | @Transactional | | | | (root) |-->|
(atomic, ACID) | | | | - invariants enforced| +---------------------+ | | |
- version (optimistic)| | | +---------------------+
| | | | Eventual Consistency (across
aggregates) | | +---------------------+ +---------------------+ | | |
Enrollment Agg | | Event Bus | | | | publishes event |-->|
(Redis Streams) | | | +---------------------+ | (at-least-once) | | |
+----------+----------+ | | | | |
+---------------------+ | | | | Invoice Agg |<-------------+
| | | subscribes to event | | | | (async processing) |
+---------------------+ | | +---------------------+ | Notification Svc | | |
| (subscribes) |<---+ | | +---------------------+ +---------------------+ | | | |
Read Model | +---------------------+ | | | | (Reporting, CQRS) |<--| All-
Events Handler |----+ | | | (eventually | +---------------------+ | | |
consistent) | | | +---------------------+
| | | | Saga Orchestrator (compensation)
| | +---------------------+ | | | FeePaymentSaga | if Invoice
fails: | | | + execute() | compensate: cancel Enrollment | | | +
compensate() | (reverse step 1) | | +---------------------+
| | | | Latency Monitoring
| | +---------------------+ | | | event.delivered. | p50: 250ms,
p95: <1s, p99: <5s | | | latency (Micrometer)| alert if p95 >1s | |
+---------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Single-Aggregate Operation (strong consistency) | v +----+-----+ |
App Svc | @Transactional | | --load 1 aggregate | | --modify
aggregate (invariants enforced) | | --save outbox (atomic) | | --
commit (ACID) +----+-----+ | v +----+-----+ | 200 OK | (immediate
response, strong consistency) +----------+ Cross-Aggregate Workflow (eventual
consistency) | v +----+-----+ | Saga | coordinates 3 transactions via
events | Step 1 | --UoW1: Enrollment.confirm() (strong, atomic) +----+-----+
| |--202 Accepted (immediate response to user) | v (async) +----
+-----+ | Event | EnrollmentConfirmed | Bus | (latency: ~250ms) +----
+-----+ | v +----+-----+ | Saga | --UoW2: Invoice.generate() (strong,
atomic) | Step 2 | --if fails: compensate (cancel Enrollment) +----+-----+ |
v +----+-----+ | Event | InvoiceGenerated | Bus | (latency: ~250ms)
+----+-----+ | v +----+-----+ | Saga | --UoW3: Notification.send()
(strong, atomic) | Step 3 | --saga complete +----+-----+ | v +----+-----
+ | Complete | (user notified via webhook/poll, ~1s total) +----------+
DATABASE IMPACT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 187

PreOne ADR - Volume 2: Domain Architecture v3.0
Eventual consistency does not weaken database consistency — each
transaction is still ACID. The change is in transaction scope: one aggregate per
transaction (strong) instead of multi-aggregate (attempted strong). The
database sees more, shorter transactions instead of fewer, longer ones. This
improves database performance (less lock contention, higher throughput).
Read models (per ADR-030 CQRS) add denormalised tables that are updated
asynchronously by event handlers — these tables may be stale by <1s, which is
acceptable for reporting. ArchUnit verifies that no transaction spans multiple
aggregates (which would attempt strong cross-aggregate consistency).
API IMPACT
Eventual consistency affects API responses. Single-aggregate operations
return 200 OK immediately (strong consistency within the aggregate). Cross-
aggregate sagas return 202 Accepted (the first step is done; subsequent steps
are async). API consumers poll a status endpoint or receive a webhook for saga
completion. API documentation clearly indicates which operations are async
and what 'completion' means. The API never blocks on cross-aggregate
consistency — if it did, the API would be slow and defeat the purpose of
eventual consistency.
UI IMPACT
Eventual consistency requires careful UI design. The UI must not lie — if an
operation is in progress (not yet complete), the UI shows 'Processing...' or
'Pending'. When the operation completes (via webhook or poll), the UI updates
to 'Complete'. For operations that the user expects to be immediate (e.g.,
saving a profile), the UI may show 'Saved' optimistically (the single-aggregate
operation is immediate) and handle async side effects (e.g., sending a
confirmation email) without UI feedback. Setting correct expectations prevents
user confusion and support tickets.
SECURITY IMPACT
Eventual consistency does not weaken security — each transaction is still ACID,
and security checks (authorisation, validation) are within the transaction. The
saga compensation pattern ensures that failed cross-aggregate workflows are
reversed, preventing partial states that could be exploited. The event-based
communication (per ADR-034) reduces the attack surface (no inter-domain API
calls). The outbox pattern (per ADR-027) ensures audit events are published
only for committed changes, preventing ghost audit entries.
PERFORMANCE IMPACT
Eventual consistency dramatically improves performance. Short transactions
(one aggregate, 8-24ms) vs long transactions (multi-aggregate, 200ms+)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 188

PreOne ADR - Volume 2: Domain Architecture v3.0
reduce lock contention by 80% (measured in staging). Throughput increases
from 500 TPS (strong consistency) to 5,000+ TPS (eventual consistency). The
trade-off is latency: cross-aggregate operations complete in ~1s (eventual)
instead of immediately (strong). For PreOne's workflows, this trade-off is
favourable — users do not notice sub-second delays, but they do notice system
slowness or unavailability.
SCALABILITY ANALYSIS
Eventual consistency is the key enabler for PreOne's scalability. Short
transactions scale with the database (PostgreSQL handles thousands of
concurrent transactions). Async processing (via events) scales horizontally —
consumers can be replicated based on load. The event bus (Redis Streams)
scales with partitioning. Read models (CQRS) scale reads independently of
writes — Reporting queries read replicas, not the primary. At PreOne's
projected scale (5,000 TPS, 12 domains), eventual consistency is sufficient. If
PreOne outgrows Redis Streams, migration to Kafka is possible without
changing the consistency model.
OPERATIONAL CONSIDERATIONS
Eventual consistency operations are observable via: event.delivered.latency
(p50/p95/p99), saga.completion.time (p50/p95/p99), saga.compensation.count
(per saga type), read.model.lag (per read model, gauge). The quarterly
architecture scorecard audits: (a) event delivery latency (target: p95 <1s), (b)
saga completion time (target: p95 <5s), (c) saga compensation rate (target:
<0.1%; higher indicates bugs), (d) read model lag (target: <1s). High latency or
compensation rate triggers investigation.
RISKS
Risk Likelihood Impact Mitigation
Users notice the Low Medium UI feedback
delay and perceive ('Processing...');
the system as slow sub-second
or buggy latency is invisible
to most users;
user education for
async operations
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 189

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation           |
| ------------------- | ---------- | ------ | -------------------- |
| Saga                | Low        | High   | Compensation is      |
| compensation        |            |        | idempotent; saga     |
| fails, leaving the  |            |        | state persisted;     |
| system in an        |            |        | manual               |
| inconsistent state  |            |        | reconciliation job;  |
alert on
incomplete sagas
>30s
| Read models are  | Medium | Low | Read model lag    |
| ---------------- | ------ | --- | ----------------- |
| stale, causing   |        |     | monitored (<1s    |
| reports to be    |        |     | target); reports  |
| inaccurate       |        |     | are inherently    |
periodic (not real-
time); critical
reads use
aggregate directly
| Event delivery     | Medium | Medium | Monitor latency;  |
| ------------------ | ------ | ------ | ----------------- |
| latency exceeds    |        |        | scale             |
| 1s, violating the  |        |        | publisher/consum  |
| target             |        |        | er instances;     |
investigate
infrastructure
issues; alert if p95
>1s
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Scalability (5,000+ TPS vs 500 TPS) Eventual consistency (cross-aggregate
delay ~1s)
Resilience (events queue during  Saga compensation complexity
outages)
Short transactions (low lock contention) Users may see stale data briefly
Simpler than distributed transactions  Testing eventual consistency is harder
(2PC)
REJECTED ALTERNATIVES
Strong consistency everywhere (option 2) was the pre-ADR-035 state. Three
issues: (1) the fee payment workflow (Enrollment + Invoice + Notification in
one transaction) held locks for 200ms, causing deadlocks under load and
capping throughput at 500 TPS; (2) when Notification was down, Enrollment
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  190

PreOne ADR - Volume 2: Domain Architecture v3.0
was blocked (could not commit the transaction); (3) distributed transactions
across services (Enrollment in service A, Notification in service B) required
2PC, which is blocking and not resilient. Distributed transactions (option 3,
2PC) were prototyped: the prepare phase held locks across all participating
services, effectively serialising all transactions — throughput dropped to 100
TPS, and a coordinator failure blocked all transactions. Eventual consistency
everywhere (option 4) was rejected because it would allow partial aggregate
updates (e.g., an enrollment with 6 discounts when the limit is 5), violating data
integrity.
MIGRATION PLAN
Phase 1 (complete): Identify cross-aggregate workflows attempting strong
consistency. Phase 2 (complete): Refactor 7 multi-aggregate transactions to
sagas (eventual consistency). Phase 3 (complete): Add 202 Accepted responses
for async operations. Phase 4 (complete): Update UI to show 'Processing...' for
async operations. Phase 5 (complete): Monitor event delivery latency (p95
<1s). Phase 6 (Q4 2026): User education for async operations (help docs,
tooltips).
TESTING STRATEGY
Eventual consistency is tested at three levels. Unit tests: aggregate tests verify
strong consistency within the aggregate. Integration tests: saga tests verify
cross-aggregate workflows complete (eventually) and compensation works on
failure. Concurrency tests: eventual consistency under concurrent access —
verify no data corruption, saga completion within 5s. Latency tests: event
delivery latency measured in staging (target: p95 <1s). ArchUnit tests:
structural rules (no multi-aggregate transactions, no 2PC) verified at compile
time.
MONITORING & OBSERVABILITY
Consistency metrics: event.delivered.latency (p50/p95/p99),
saga.completion.time (p50/p95/p99), saga.compensation.count, read.model.lag
(gauge per read model), event.consumer.lag (gauge per consumer).
Dashboards in Grafana: event latency per domain, saga completion time per
saga type, read model lag per read model. Alerts: event.delivered.latency p95
>1s, saga.completion.time p95 >5s, saga.compensation.rate >0.1%,
read.model.lag >1s.
FUTURE EVOLUTION
Two evolutions are possible. First, the latency target may tighten (p95 <500ms)
if the event bus and consumers are optimised — but sub-second is already
invisible to users. Second, specific use cases may require stronger cross-
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 191

PreOne ADR - Volume 2: Domain Architecture v3.0
aggregate consistency (e.g., real-time fraud detection) — these would use a
different pattern (e.g., CQRS with synchronous read models) rather than
changing the default eventual consistency. The consistency model itself is
stable; eventual consistency for cross-aggregate is a well-established pattern.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity within
aggregate)
● ADR-022 — Aggregate Rules (strong consistency within aggregate)
● ADR-027 — Domain Events (event-based propagation)
● ADR-030 — CQRS Strategy (read models are eventually consistent)
● ADR-032 — Unit of Work (transaction boundary = aggregate boundary)
● ADR-033 — Transaction Boundary (one transaction = one aggregate)
● ADR-034 — Cross Domain Communication (events across domains)
● ADR-036 — Saga Readiness (saga compensation for cross-aggregate
failures)
● ADR-049 — Optimistic Locking (concurrency within aggregate)
REFERENCES
● Upstream DDD: DDD-001 (Strategic Design — consistency boundaries)
● Upstream PRD: PRD-001-section-5 (Scalability and consistency
requirements)
● Downstream ERD: ERD-006 (read model tables, eventually consistent)
● Downstream API Spec: API-005 (async API patterns: 202 Accepted,
polling, webhooks)
● Downstream Test Cases: TC-0055 (Eventual consistency, saga, latency
tests)
● External: Pat Helland — Life beyond Distributed Transactions (eventual
consistency)
● External: Microservices Patterns — Chris Richardson (Saga pattern,
eventual consistency)
DECISION HISTORY
Date Status Actor Notes
2025-12-20 Draft Chief Architect Initial draft with 4
options; eventual
consistency
chosen
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 192

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Date       | Status   | Actor           | Notes             |
| ---------- | -------- | --------------- | ----------------- |
| 2026-01-22 | Proposed | Chief Architect | Submitted to ARB  |
after scalability
evaluation
| 2026-02-18 | Accepted | ARB Chair | ARB approved; 7  |
| ---------- | -------- | --------- | ---------------- |
multi-aggregate
transactions
refactored to
sagas
| 2026-08-13 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR) |     |
| ----------- | --- | -------------------- | --- |
| Tech Lead   |     | Foundation Tech Lead |     |
| ARB Chair   |     | ARB Chair            |     |
| Approved On |     | 2026-08-13           |     |
IMPLEMENTATION CHECKLIST
● Identify cross-aggregate workflows attempting strong consistency
(Done — 7 workflows)
● Refactor 7 multi-aggregate transactions to sagas (Done — PR #5401)
● Add 202 Accepted responses for async operations (Done — 12
endpoints updated)
● Update UI to show 'Processing...' for async operations (Done — 8
screens updated)
● Monitor event delivery latency (Done — Grafana dashboard, p95 <1s)
● Read model lag monitoring (Done — 5 read models monitored)
● Saga compensation testing (Done — all 7 sagas tested with failure
scenarios)
● User education for async operations (Done — help docs, tooltips)
AD R -036
Saga Readiness
Volume 2 — Domain Architecture  -  Pattern
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  193

PreOne ADR - Volume 2: Domain Architecture v3.0
ACCEPTED
DECISION SUMMARY
DECISION
Adopt the saga pattern for cross-aggregate workflows that cannot be a
single transaction (per ADR-022, ADR-035). A saga is a sequence of
transactions (one per aggregate) coordinated via domain events, with
compensating transactions to reverse completed steps on failure. Sagas are
orchestrated (an orchestrator coordinates the steps) for complex workflows
and choreographed (each step subscribes to the previous step's event) for
simple workflows. All saga steps are idempotent.
STATUS
Status Accepted
Date Decided 2026-02-25
Decision Owner Domain Architect — Billing
Review Cadence Annual or on saga framework
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-036, PreOne's cross-aggregate workflows used multi-aggregate
transactions (per ADR-035, the pre-ADR-035 state). The fee payment workflow
(Payment + Invoice + Enrollment in one transaction) held locks for 200ms,
caused deadlocks, and capped throughput at 500 TPS. When the Billing domain
was down, the Enrollment domain was blocked (could not commit the
transaction). The team needed a way to coordinate cross-aggregate workflows
without multi-aggregate transactions. The Billing Domain Architect led a 5-
week implementation of the saga pattern. The fee payment workflow became a
saga: Step 1 (create Payment) commits and publishes PaymentCreated; Step 2
(mark Invoice paid) subscribes, commits, and publishes InvoicePaid; Step 3
(update Enrollment status) subscribes and commits. If Step 2 fails (e.g., Invoice
not found), the saga compensates by cancelling the Payment (reversing Step 1).
The saga is orchestrated by a FeePaymentSagaOrchestrator that tracks saga
state and issues compensating commands on failure. This ADR codifies the
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 194

PreOne ADR - Volume 2: Domain Architecture v3.0
saga pattern. ArchUnit tests verify that sagas are idempotent and that
compensating transactions exist for every step.
BUSINESS DRIVERS
The primary driver is consistency without multi-aggregate transactions: sagas
provide cross-aggregate consistency (eventually) without the scalability
penalties of multi-aggregate transactions (per ADR-035). The secondary driver
is resilience: if a saga step fails, the saga compensates (reverses previous steps)
rather than leaving the system in an inconsistent state. The tertiary driver is
scalability: each saga step is a short transaction (one aggregate), enabling high
throughput. A fourth driver is auditability: saga state is persisted (in a
saga_state table), providing an audit trail of cross-aggregate workflows. The
saga orchestrator logs each step (started, completed, failed, compensated),
enabling post-hoc analysis of workflow execution.
PROBLEM STATEMENT
PreOne's cross-aggregate workflows cannot use multi-aggregate transactions
(per ADR-035) but still need consistency (eventually) and failure recovery. We
must define a saga pattern that coordinates cross-aggregate workflows via
events, with compensation for failures.
CONSTRAINTS
● Each saga step is a single-aggregate transaction (per ADR-022,
ADR-033)
● Every saga step has a compensating transaction (reverse action)
● Saga steps are idempotent (per ADR-036 idempotency rule)
● Saga state is persisted (in saga_state table) for recovery
● Saga orchestrator is a separate component (not embedded in app
services)
ASSUMPTIONS
● Domain events (ADR-027) provide reliable delivery for saga
coordination
● Compensating transactions can reverse the effects of completed steps
(within 30s)
● Idempotent steps handle duplicate events correctly (per ADR-036)
● Saga state persistence (in PostgreSQL) is reliable for recovery
● Saga orchestrator can be stateless (state in database) or stateful (in-
memory + database)
OPTIONS CONSIDERED
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 195

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Option        | Pros                | Cons               | Verdict |
| ------------- | ------------------- | ------------------ | ------- |
| Orchestrated  | Explicit            | Orchestrator is a  | Chosen  |
| sagas with    | coordination;       | single component   |         |
| compensating  | clear failure       | to maintain;       |         |
| transactions  | handling;           | compensation       |         |
| (chosen)      | auditable;          | logic is complex;  |         |
|               | scalable; aligns    | testing is harder  |         |
|               | with microservices  | than single        |         |
|               | patterns.           | transactions.      |         |
Choreographed  No central  Hard to track saga  Chosen for simple
sagas (event- orchestrator; fully  state; failure  workflows (2-3
| chain, no     | decoupled;       | handling is          | steps) |
| ------------- | ---------------- | -------------------- | ------ |
| orchestrator) | simpler for 2-3  | distributed (each    |        |
|               | step workflows.  | service handles its  |        |
own
compensation);
complex for >3
steps.
Multi-aggregate  Simple; atomic; no  Long transactions;  Rejected
| transactions (pre- | compensation  | deadlocks;        |     |
| ------------------ | ------------- | ----------------- | --- |
| ADR-036 state)     | needed.       | scalability cap;  |     |
violates ADR-022;
pre-ADR-036
state.
| Distributed        | Atomic across   | Blocking; not  | Rejected |
| ------------------ | --------------- | -------------- | -------- |
| transactions (2PC) | aggregates; no  | resilient;     |          |
|                    | compensation.   | performance    |          |
disaster; not
supported by
Redis; rejected in
ADR-035.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  196

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following saga rules: (1) Cross-aggregate workflows that cannot
be a single transaction use sagas. (2) Each saga step is a single-aggregate
transaction (@Transactional, per ADR-022). (3) Every saga step has a
compensating transaction that reverses the step's effects (e.g.,
cancelPayment compensates createPayment). (4) Saga steps are
idempotent — duplicate events (from at-least-once delivery) do not cause
duplicate effects. (5) Saga state is persisted in the saga_state table (saga_id,
saga_type, current_step, status, started_at, completed_at,
compensation_status). (6) Orchestrated sagas are used for complex
workflows (>3 steps, complex failure handling) — a SagaOrchestrator
component coordinates steps. (7) Choreographed sagas are used for simple
workflows (2-3 steps) — each step subscribes to the previous step's event.
(8) Compensation is triggered on step failure — the orchestrator (or
choreography handler) issues compensating commands for completed
steps, in reverse order.
DETAILED RATIONALE
The chosen option (orchestrated sagas for complex, choreographed for simple)
is the only one that produces consistency without multi-aggregate transactions.
Multi-aggregate transactions (option 3) were the pre-ADR-036 state and are
rejected per ADR-035. Distributed transactions (option 4) are rejected per
ADR-035. Rule (1) — sagas for cross-aggregate — is the alternative to multi-
aggregate transactions. When a workflow must modify multiple aggregates
(e.g., Payment, Invoice, Enrollment), it is a saga: three transactions,
coordinated via events, with compensation on failure. This aligns with ADR-022
(one transaction, one aggregate) and ADR-035 (eventual consistency across
aggregates). Rule (2) — each step is a single-aggregate transaction — ensures
short transactions and low lock contention. The createPayment step is
@Transactional and modifies only the Payment aggregate. The
markInvoicePaid step is @Transactional and modifies only the Invoice
aggregate. Each step commits independently, releasing locks immediately.
Rule (3) — compensating transactions — handle failures. If markInvoicePaid
fails (e.g., Invoice not found, Invoice already paid), the saga cannot leave the
Payment created (orphaned Payment). The compensating transaction
(cancelPayment) reverses createPayment: it marks the Payment as
CANCELLED and publishes a PaymentCancelled event. The user sees 'Payment
failed — your enrollment is not confirmed' and can retry. Compensation is not a
rollback (the database does not roll back) — it is a forward action that
semantically reverses the effect. Rule (4) — idempotent steps — handle
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 197

PreOne ADR - Volume 2: Domain Architecture v3.0
duplicate events. The outbox publisher may publish the same event twice (at-
least-once delivery). The markInvoicePaid step checks if the Invoice is already
paid (idempotency); if so, it skips (returns success without modifying).
Idempotency is verified by the eventId in the processed_events table (per
ADR-034). Without idempotency, duplicate events would cause double-effects
(e.g., marking an Invoice paid twice, which may fail or produce incorrect state).
Rule (5) — saga state persisted — enables recovery. If the saga orchestrator
crashes mid-saga, the saga_state table shows the current step and status. On
restart, the orchestrator reads saga_state and resumes (or compensates if the
saga is in a failed state). Without persisted state, a crash would leave the saga
in an unknown state, requiring manual intervention. The saga_state table has:
saga_id (uuid), saga_type (text), current_step (text), status (text: RUNNING,
COMPLETED, FAILED, COMPENSATING, COMPENSATED), started_at
(timestamptz), completed_at (timestamptz), compensation_status (text),
payload (jsonb, the saga input). Rule (6) — orchestrated for complex — uses a
SagaOrchestrator component. The orchestrator is a Spring @Service that
starts the saga (creates saga_state, issues the first command), subscribes to
step-completion events, issues the next command, and handles failures (issues
compensating commands). The orchestrator is the 'brain' of the saga — it
knows the workflow and the failure handling. Complex workflows (e.g., student
transfer across branches, which touches Student, Enrollment, Invoice,
Attendance, Report Card) benefit from an orchestrator because the failure
handling is centralised and auditable. Rule (7) — choreographed for simple —
uses event subscriptions without an orchestrator. A 2-step workflow (e.g.,
StudentCreated -> WelcomeEmailSent) does not need an orchestrator — the
Notification domain subscribes to StudentCreated and sends the email. If the
email fails, the saga does not compensate (a failed welcome email is not critical;
it is retried by the Notification domain's retry mechanism). Choreography is
simpler than orchestration but does not scale to complex workflows (tracking
state across 5+ event subscriptions is difficult). Rule (8) — compensation in
reverse order — ensures correct reversal. If a 3-step saga (Step1, Step2, Step3)
fails at Step3, the saga compensates Step2 then Step1 (reverse order).
Compensating Step2 before Step1 is important because Step2 may depend on
Step1's effects (e.g., Step2 marks Invoice paid, which depends on Step1
creating Payment; compensating Step1 first would cancel Payment, but Invoice
is still marked paid — incorrect). Reverse-order compensation ensures
dependencies are respected.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Saga Pattern
(Orchestrated) | | | |
Saga Orchestrator (Spring @Service) | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 198

PreOne ADR - Volume 2: Domain Architecture v3.0
+----------------------------------------------------------+ | | | FeePaymentSagaOrchestrator
| | | | + execute(cmd) | | | | 1. create saga_state
(RUNNING, step=1) | | | | 2. issue createPayment command
| | | | 3. (wait for PaymentCreated event) | | | | 4. update
saga_state (step=2) | | | | 5. issue markInvoicePaid command
| | | | 6. (wait for InvoicePaid event) | | | | 7. update
saga_state (step=3) | | | | 8. issue updateEnrollment
command | | | | 9. (wait for EnrollmentUpdated event)
| | | | 10. update saga_state (COMPLETED) | | | |
| | | | + compensate(saga_id) | | | | 1. read saga_state
(find completed steps) | | | | 2. for each completed step (reverse
order): | | | | - issue compensating command | | | |
- wait for compensation event | | | | 3. update saga_state
(COMPENSATED) | | | +----------------------------------------------------------+
| | | | Saga Steps (each is a single-
aggregate transaction) | | +----------------------------------------------------------+ | |
| Step 1: createPayment (@Transactional) | | | | --Payment App
Svc creates Payment aggregate | | | | --publishes PaymentCreated
event | | | | --compensation: cancelPayment (marks Payment
CANCELLED) | | | +----------------------------------------------------------+ | | | Step 2:
markInvoicePaid (@Transactional) | | | | --Invoice App Svc marks
Invoice PAID | | | | --publishes InvoicePaid event |
| | | --compensation: markInvoiceUnpaid (marks Invoice UNPAID)| |
+----------------------------------------------------------+ | | | Step 3: updateEnrollment
(@Transactional) | | | | --Enrollment App Svc updates Enrollment
status | | | | --publishes EnrollmentUpdated event | | | |
--compensation: revertEnrollmentStatus | | |
+----------------------------------------------------------+ | |
| | Saga State (persisted in saga_state table) | |
+----------------------------------------------------------+ | | | saga_id | saga_type | step |
status | comp_status | | | |---------|-----------|------|-----------|------------------| | | |
uuid1 | FeePayment| 3 | COMPLETED | N/A | | | | uuid2 |
FeePayment| 2 | FAILED | COMPENSATING | | | | uuid3 | FeePayment|
1 | RUNNING | N/A | | | +----------------------------------------------------------+
| +------------------------------------------------------------------+
SEQUENCE DIAGRAM
Saga Orchestrator Payment App Svc Invoice App Svc Enrollment App
Svc | | | | |--createPayment------->|
| | | (cmd) | | | |
|--@Transactional | | | | create Payment |
| | | publish PaymentCreated | |<--
PaymentCreated------| | | | | |
| | (update saga_state: step=2) | | | |
| | |--markInvoicePaid------------------>| | | |
(cmd) | | | | | | |--
@Transactional | | | | mark Invoice PAID |
| | | publish InvoicePaid | |<--
InvoicePaid----------------------| | | | | |
| | (update saga_state: step=3) | | | |
| | | |--updateEnrollment---------------------------------------->| |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 199

PreOne ADR - Volume 2: Domain Architecture v3.0
| (cmd) | | | | | | | |--
@Transactional | | | | | update Enrollment | |
| | | publish EnrollUpdated| |<--
EnrollmentUpdated--------------------------------------| | | | |
| | | (update saga_state: COMPLETED) | | |
| | | | | | (FAILURE SCENARIO:
markInvoicePaid fails) | | | | | |
| |--markInvoicePaid------------------>| | | | |
|--@Transactional | | | | Invoice not found! |
| | | (exception) | |<--InvoiceNotFound-----|
| | | | | | | | |
(compensate: reverse step 1) | | | | | |
| | |--cancelPayment--------| | | | |
(compensating cmd) | | | | | |--
@Transactional | | | | cancel Payment |
| | | publish PaymentCancelled | |<--
PaymentCancelled----| | | | | | |
| | | (update saga_state: COMPENSATED) | | |
| | | | | | (notify user: payment failed)
| | |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Saga Components
| | | | Saga Orchestrator (complex
workflows) | | +---------------------+ +---------------------+ | | |
FeePaymentSaga | | SagaStateRepository | | | | Orchestrator |-->|
(persists saga | | | | (@Service) | | state in DB) | | | | +
execute(cmd) | +---------------------+ | | | + compensate(id) |
| | | + onEvent(event) | +---------------------+ | | +---------------------+ |
EventBusSubscriber | | | | (listens for step | | |
Saga Steps (app services) | completion events) | | | +---------------------+
+---------------------+ | | | PaymentAppSvc | | | | +
createPayment() | Compensating Commands | | | + cancelPayment() |
+---------------------+ | | +---------------------+ | cancelPayment | | |
| markInvoiceUnpaid | | | +---------------------+ | revertEnrollment | |
| | InvoiceAppSvc | +---------------------+ | | | + markInvoicePaid() |
| | | + markInvoiceUnpaid()| Saga State Table | | +---------------------+
+---------------------+ | | | saga_state | | |
+---------------------+ | - saga_id (PK) | | | | EnrollmentAppSvc | | -
saga_type | | | | + updateEnrollment()| | - current_step | | | |
+ revertEnrollment()| | - status (RUNNING/ | | | +---------------------+ |
COMPLETED/FAILED/ | | | | COMPENSATING/ | |
| Choreography (simple) | COMPENSATED) | | | +---------------------+ |
- compensation_stat | | | | StudentCreated | | - payload (jsonb) | |
| | Handler (in Notif) | +---------------------+ | | | (subscribes to |
| | | StudentCreated, | | | | sends welcome |
| | | email — no | | | | orchestrator) |
| | +---------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 200

PreOne ADR - Volume 2: Domain Architecture v3.0
Saga: FeePayment(enrollmentId, amount) | v +----+-----+ | Orchestr|
--create saga_state (RUNNING, step=1) | | --issue createPayment
command +----+-----+ | v +----+-----+ | Step 1 | @Transactional |
Payment | --create Payment aggregate (strong consistency) | App Svc | --
publish PaymentCreated event +----+-----+ | v (event delivered
~250ms) +----+-----+ | Orchestr| --update saga_state (step=2) | | --issue
markInvoicePaid command +----+-----+ | v +----+-----+ | Step 2 |
@Transactional | Invoice | --mark Invoice PAID (strong consistency) | App Svc
| --publish InvoicePaid event +----+-----+ | +--SUCCESS--> continue to
step 3 | +--FAILURE--> compensate (reverse step 1) | | |
v | +----+-----+ | | Compensate| --cancelPayment command
| | Step 1 | --Payment App Svc cancels Payment | | | --
publish PaymentCancelled | +----+-----+ | | | v
| +----+-----+ | | saga_state| --status=COMPENSATED |
+----------+ | | | v | notify user: 'Payment failed'
| v (success path) +----+-----+ | Orchestr| --update saga_state (step=3) |
| --issue updateEnrollment command +----+-----+ | v +----+-----+ |
Step 3 | @Transactional | Enroll | --update Enrollment status | App Svc | --
publish EnrollmentUpdated event +----+-----+ | v +----+-----+ |
saga_st | --status=COMPLETED | (done) | --notify user: 'Payment successful'
+----------+
DATABASE IMPACT
Sagas add the saga_state table to the database. The table has: saga_id (uuid
primary key), saga_type (text), current_step (text), status (text), started_at
(timestamptz), completed_at (timestamptz), compensation_status (text),
payload (jsonb), updated_at (timestamptz). An index on (status, updated_at)
supports the recovery query (find RUNNING sagas that may have stalled). The
table is in the platform schema (shared across sagas). Old
COMPLETED/COMPENSATED sagas are archived after 90 days. The
saga_state table grows linearly with saga count (~10,000/day); partitioning by
started_at keeps it manageable. Each saga step is a normal transaction (per
ADR-033) — no special database support needed.
API IMPACT
Sagas affect API responses. A saga-triggering API request (e.g., POST
/payments) returns 202 Accepted (the saga is started, not completed) with a
saga_id. The API consumer polls GET /sagas/{saga_id} for status (RUNNING,
COMPLETED, FAILED, COMPENSATED) or receives a webhook on completion.
The API documentation indicates which operations are sagas and what
'completion' means. For synchronous-feeling operations (e.g., a parent paying a
fee), the UI may poll every 500ms and update on completion — the user
perceives near-synchronous behaviour with sub-second latency.
UI IMPACT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 201

PreOne ADR - Volume 2: Domain Architecture v3.0
Sagas affect UI feedback. A saga-triggering action (e.g., 'Pay Fee') shows
'Processing...' in the UI. The UI polls the saga status (or receives a WebSocket
notification, per ADR-145) and updates on completion: 'Payment successful'
(COMPLETED) or 'Payment failed — please try again' (COMPENSATED). The
UI should handle the COMPENSATED state gracefully — it is not an error per
se, but a reversal of the operation. The user should understand that no money
was charged (the payment was cancelled).
SECURITY IMPACT
Sagas improve security by providing auditability. The saga_state table records
every saga execution (who started it, when, what steps completed, whether it
was compensated). This is a forensic trail for cross-aggregate workflows —
critical for financial sagas. Compensation ensures that failed sagas do not leave
the system in an inconsistent state (e.g., a Payment without an Invoice), which
could be exploited. Idempotent steps prevent double-effects from duplicate
events, which could cause fraud (e.g., marking an Invoice paid twice, allowing
double-refund).
PERFORMANCE IMPACT
Sagas have a performance profile different from multi-aggregate transactions.
Each step is a short transaction (8-24ms), but the saga has inter-step latency
(event delivery, ~250ms per step). A 3-step saga completes in ~1s (vs 200ms
for a multi-aggregate transaction). However, the saga's short transactions do
not hold locks across steps, so concurrent sagas do not contend — throughput is
5,000+ TPS (vs 500 TPS for multi-aggregate). The trade-off is latency (1s vs
200ms) for throughput (5,000 vs 500 TPS) — favourable for PreOne's scale.
SCALABILITY ANALYSIS
Sagas scale horizontally. The orchestrator is stateless (state in saga_state
table), so multiple instances can run concurrently. Saga steps are normal
transactions, scaling with the database. The event bus (Redis Streams) scales
with partitioning. The saga_state table scales with partitioning (by started_at).
At PreOne's projected scale (10,000 sagas/day, 7 saga types), the architecture
is sufficient. The bottleneck is the event bus throughput (10,000 events/second)
— sufficient for 10,000 sagas/day (~1 saga/second average, ~10/second peak).
OPERATIONAL CONSIDERATIONS
Saga operations are observable via: saga.started.count (per saga type),
saga.completed.count (per saga type), saga.failed.count (per saga type),
saga.compensated.count (per saga type), saga.completion.time (p50/p95/p99),
saga.compensation.time (p50/p95/p99), saga.stalled.count (RUNNING >5
minutes). The quarterly architecture scorecard audits: (a) saga completion time
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 202

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
(target: p95 <5s), (b) saga failure rate (target: <0.1%; higher indicates bugs),
(c) saga compensation rate (target: <0.1%; higher indicates downstream
issues), (d) stalled sagas (target: zero; stalled sagas are manually reviewed).
RISKS
| Risk                | Likelihood | Impact | Mitigation           |
| ------------------- | ---------- | ------ | -------------------- |
| Saga                | Low        | High   | Compensation is      |
| compensation        |            |        | idempotent; saga     |
| fails, leaving the  |            |        | state persisted;     |
| system              |            |        | manual               |
| inconsistent        |            |        | reconciliation job;  |
alert on stalled
sagas >5 minutes
| Saga orchestrator  | Medium | Medium | Saga state     |
| ------------------ | ------ | ------ | -------------- |
| crashes mid-saga   |        |        | persisted; on  |
restart,
orchestrator reads
saga_state and
resumes or
compensates;
recovery job
detects stalled
sagas
| Duplicate events  | Medium | High | All steps are     |
| ----------------- | ------ | ---- | ----------------- |
| cause double-     |        |      | idempotent (rule  |
| effects in non-   |        |      | 4);               |
| idempotent steps  |        |      | processed_events  |
table; quarterly
idempotency audit
| Saga latency       | Low | Medium | Monitor           |
| ------------------ | --- | ------ | ----------------- |
| exceeds user       |     |        | completion time;  |
| expectations (>5s) |     |        | optimise slow     |
steps; UI shows
'Processing...' to
set expectations
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Cross-aggregate consistency without  Compensation complexity (each step
| multi-aggregate transactions |     | needs a reverse) |     |
| ---------------------------- | --- | ---------------- | --- |
Scalable (short transactions, async  Saga latency (~1s for 3 steps vs 200ms
| coordination) |     | for multi-agg) |     |
| ------------- | --- | -------------- | --- |
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  203

PreOne ADR - Volume 2: Domain Architecture v3.0
We Gain We Lose
Resilient (compensation reverses Orchestrator is a single component (for
failures) orchestrated sagas)
Auditable (saga_state records Testing is harder (need to test
execution) compensation paths)
REJECTED ALTERNATIVES
Multi-aggregate transactions (option 3) were the pre-ADR-036 state and are
rejected per ADR-035. Distributed transactions (option 4) are rejected per
ADR-035. The choice between orchestrated (option 1) and choreographed
(option 2) is not either-or — both are used, depending on workflow complexity.
Simple workflows (2-3 steps, no complex failure handling) use choreography
(e.g., StudentCreated -> WelcomeEmailSent). Complex workflows (>3 steps,
compensation needed) use orchestration (e.g., FeePayment, StudentTransfer).
The decision criterion is workflow complexity, not a blanket preference.
MIGRATION PLAN
Phase 1 (complete): Implement saga_state table and SagaOrchestrator
framework. Phase 2 (complete): Pilot FeePayment saga (3 steps,
compensation). Phase 3 (complete): Migrate 7 cross-aggregate workflows to
sagas. Phase 4 (complete): Choreographed sagas for simple workflows (5
workflows). Phase 5 (complete): ArchUnit rules enforced in CI. Phase 6 (Q4
2026): Saga testing framework (compensation scenarios, idempotency).
TESTING STRATEGY
Saga testing has three levels. Unit tests: orchestrator logic (step sequencing,
compensation triggering) is unit-tested with mocked app services. Integration
tests: saga end-to-end (success path) tested with Testcontainers PostgreSQL
and Redis. Compensation tests: each saga is tested with failure scenarios (Step
2 fails, verify Step 1 is compensated). Idempotency tests: each step is tested
with duplicate events. Concurrency tests: multiple concurrent sagas of the
same type (verify no interference). Stalled saga recovery: orchestrator crash
mid-saga, verify recovery on restart.
MONITORING & OBSERVABILITY
Saga metrics: saga.started.count (per type), saga.completed.count (per type),
saga.failed.count (per type, by failure reason), saga.compensated.count (per
type), saga.completion.time (p50/p95/p99), saga.compensation.time
(p50/p95/p99), saga.stalled.count (gauge, RUNNING >5 min),
saga.step.latency (per step, per saga type). Dashboards in Grafana: saga flow
per type, completion time per type, compensation rate. Alerts:
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 204

PreOne ADR - Volume 2: Domain Architecture v3.0
saga.completion.time p95 >5s, saga.compensation.rate >0.1%,
saga.stalled.count >0.
FUTURE EVOLUTION
Two evolutions are likely. First, the saga pattern may evolve into a workflow
engine (ADR-037) with built-in state management, visual workflow design, and
automatic compensation — but the current saga framework is sufficient for
PreOne's 7 saga types. Second, the saga orchestrator may adopt a state
machine framework (Spring StateMachine) for complex state transitions —
currently, the orchestrator uses a simple state field. The saga pattern itself is
stable; orchestrated vs choreographed is a long-standing pattern choice.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity via
compensation)
● ADR-022 — Aggregate Rules (each saga step = one aggregate)
● ADR-027 — Domain Events (sagas coordinated via events)
● ADR-030 — CQRS Strategy (sagas may update read models)
● ADR-032 — Unit of Work (each saga step is a UoW)
● ADR-033 — Transaction Boundary (each step = one transaction)
● ADR-034 — Cross Domain Communication (cross-domain sagas)
● ADR-035 — Eventual Consistency (sagas enable eventual consistency)
● ADR-037 — Workflow Engine (future evolution of saga framework)
● ADR-048 — Audit Trail (saga_state is part of audit trail)
REFERENCES
● Upstream DDD: DDD-001 (Strategic Design — saga pattern for cross-
aggregate)
● Upstream PRD: PRD-003-section-9 (Billing saga requirements)
● Downstream ERD: ERD-007 (saga_state table schema)
● Downstream API Spec: API-003 (Billing API: 202 Accepted, saga status
polling)
● Downstream Test Cases: TC-0056..TC-0058 (Saga, compensation,
idempotency tests)
● External: Microservices Patterns — Chris Richardson (Saga pattern)
● External: Pat Helland — Life beyond Distributed Transactions (sagas)
DECISION HISTORY
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 205

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Date       | Status | Actor           | Notes               |
| ---------- | ------ | --------------- | ------------------- |
| 2025-12-27 | Draft  | Billing Domain  | Initial draft with  |
|            |        | Architect       | orchestrated +      |
choreographed
options
| 2026-01-29 | Proposed | Billing Domain  | Submitted to ARB  |
| ---------- | -------- | --------------- | ----------------- |
|            |          | Architect       | after FeePayment  |
pilot
| 2026-02-25 | Accepted | ARB Chair | ARB approved; 7  |
| ---------- | -------- | --------- | ---------------- |
sagas
implemented, 5
choreographed
| 2026-08-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)     |     |
| ----------- | --- | ------------------------ | --- |
| Tech Lead   |     | Billing Domain Architect |     |
| ARB Chair   |     | ARB Chair                |     |
| Approved On |     | 2026-08-15               |     |
IMPLEMENTATION CHECKLIST
● Implement saga_state table (Done — Flyway V2.0.0)
● Build SagaOrchestrator framework (Done — preone-saga v1.0.0)
● Pilot FeePayment saga with compensation (Done — PR #5501)
● Migrate 7 cross-aggregate workflows to sagas (Done — PR #5515)
● Choreographed sagas for 5 simple workflows (Done — PR #5520)
● ArchUnit rules: idempotent steps, compensation exists (Done — CI gate
since V2.0.0)
● Saga testing framework with compensation scenarios (Done — 23 test
cases)
● Stalled saga recovery job (Done — runs every 5 minutes)
AD R -037
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  206

PreOne ADR - Volume 2: Domain Architecture v3.0
Workflow Engine
Volume 2 — Domain Architecture - Pattern
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a lightweight workflow engine for complex, long-running, multi-step
business processes that exceed the saga pattern's complexity. The workflow
engine (preone-workflow, built on Spring StateMachine) manages stateful
workflows with branches, loops, timers, and human tasks. Sagas (ADR-036)
handle simple cross-aggregate coordination; the workflow engine handles
complex business processes like student admission (10+ steps with
conditional branches, parent approvals, document uploads, fee payments).
STATUS
Status Accepted
Date Decided 2026-03-04
Decision Owner Domain Architect — Enrollment
Review Cadence Annual or on workflow complexity
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-037, PreOne's complex workflows were implemented as nested
sagas or procedural code in application services. The student admission
workflow (inquiry -> application -> document upload -> parent approval ->
branch approval -> fee payment -> enrollment) was a 500-line method in
AdmissionAppService with nested if/else, manual state tracking, and no
persistence of intermediate state. A crash mid-workflow lost all progress; a
retry required starting from scratch. The workflow had 12 branches (e.g., 'if
scholarship applied, route to scholarship committee') that were impossible to
test comprehensively. The Enrollment Domain Architect led a 6-week
implementation of a workflow engine. The new admission workflow is a state
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 207

PreOne ADR - Volume 2: Domain Architecture v3.0
machine with 15 states, 25 transitions, 5 timers (e.g., 'parent approval within 7
days'), and 3 human tasks (parent approval, branch approval, scholarship
committee). The workflow engine persists state, handles crashes (resume from
last state), and provides a visualisation of workflow progress. The 500-line
method became a declarative workflow definition (YAML) plus 25 small
handlers (one per transition). This ADR codifies the workflow engine pattern.
ArchUnit tests verify that workflows are declarative (YAML), handlers are small
(<50 lines), and state is persisted.
BUSINESS DRIVERS
The primary driver is manageability: complex workflows with branches, loops,
and timers are unmanageable as procedural code. A declarative workflow
definition (YAML) is readable, modifiable, and testable. The secondary driver is
resilience: the workflow engine persists state, so a crash mid-workflow resumes
from the last state (not from scratch). The tertiary driver is observability: the
workflow engine tracks state transitions, providing a visualisation of workflow
progress for users and operators. A fourth driver is human tasks: many PreOne
workflows require human approval (parent, branch manager, scholarship
committee). The workflow engine manages task assignment, reminders, and
timeouts — features that are complex to build manually. A fifth driver is
compliance: the workflow engine's state log is an audit trail of who approved
what and when, satisfying regulatory requirements.
PROBLEM STATEMENT
PreOne's complex workflows (10+ steps, branches, timers, human tasks) are
unmanageable as procedural code — they are hard to test, crash-prone, and
lack observability. We must adopt a workflow engine that manages stateful
workflows declaratively.
CONSTRAINTS
● Workflow definitions are declarative (YAML), not procedural code
● Workflow state is persisted (in workflow_state table) for crash recovery
● Workflow handlers (per transition) are small (<50 lines) and
idempotent
● Workflow engine supports: branches, loops, timers, human tasks,
parallel steps
● Workflow engine is built on Spring StateMachine (no external BPM
engine)
ASSUMPTIONS
● Spring StateMachine is sufficient for PreOne's workflow complexity (no
need for Camunda, Activiti)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 208

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● YAML workflow definitions are expressive enough (no need for a visual
designer)
● Workflow state persistence (in PostgreSQL) is reliable for crash
recovery
● Human tasks can be modelled as states with timers (timeout ->
escalate)
● Workflows are long-running (minutes to weeks), not short-lived
(seconds)
OPTIONS CONSIDERED
| Option           | Pros               | Cons              | Verdict |
| ---------------- | ------------------ | ----------------- | ------- |
| Lightweight      | Declarative;       | Spring            | Chosen  |
| workflow engine  | resilient;         | StateMachine      |         |
| on Spring        | observable;        | learning curve;   |         |
| StateMachine     | supports complex   | YAML definition   |         |
| (chosen)         | workflows; Spring  | syntax; engine    |         |
|                  | integration; no    | maintenance       |         |
|                  | external           | burden; overkill  |         |
|                  | dependency.        | for simple        |         |
workflows.
| External BPM      | Mature; visual  | External             | Rejected |
| ----------------- | --------------- | -------------------- | -------- |
| engine (Camunda,  | designer; full  | dependency           |          |
| Activiti)         | BPMN support;   | (operational         |          |
|                   | human task      | complexity);         |          |
|                   | management;     | BPMN learning        |          |
|                   | reporting.      | curve; overkill for  |          |
PreOne's scale;
licensing cost
(enterprise
features).
| Procedural code in  | Simple; no         | Unmanageable for    | Rejected |
| ------------------- | ------------------ | ------------------- | -------- |
| application         | abstraction; full  | complex             |          |
| services (pre-      | flexibility;       | workflows; no       |          |
| ADR-037 state)      | familiar.          | crash recovery; no  |          |
observability; hard
to test; pre-
ADR-037 state.
| Saga pattern       | Single             | Sagas are not      | Rejected |
| ------------------ | ------------------ | ------------------ | -------- |
| (ADR-036) for all  | mechanism; no      | designed for long- |          |
| workflows          | new framework;     | running workflows  |          |
|                    | aligns with        | (minutes to        |          |
|                    | existing patterns. | weeks); no human   |          |
task support; no
timer support; no
branching.
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  209

PreOne ADR - Volume 2: Domain Architecture v3.0
DECISION
ADOPTED
Adopt the following workflow engine rules: (1) Complex, long-running
workflows (10+ steps, branches, timers, human tasks) use the workflow
engine (preone-workflow, built on Spring StateMachine). (2) Workflow
definitions are declarative YAML (workflows/<domain>/<workflow>.yml)
with states, transitions, timers, and task definitions. (3) Workflow state is
persisted in the workflow_state table (workflow_id, workflow_type,
current_state, status, started_at, updated_at, payload, task_assignments).
(4) Workflow handlers (one per transition) are small (<50 lines),
idempotent, and @Transactional. (5) The workflow engine supports:
branches (conditional transitions), loops (cycles), timers (state timeout ->
transition), human tasks (state with assignment -> on approval ->
transition), parallel steps (fork/join). (6) Workflow definitions are versioned
(per ADR-040) for evolution. (7) Workflows are visualised (state diagram
auto-generated from YAML) for users and operators. (8) Simple workflows
(2-3 steps, no branches) use sagas (ADR-036), not the workflow engine.
DETAILED RATIONALE
The chosen option is the only one that produces manageable complex
workflows. External BPM (option 2) is overkill — PreOne has 7 complex
workflows, not 700; Camunda's operational complexity (separate service,
database, monitoring) is not justified. Procedural code (option 3) was the pre-
ADR-037 state and produced the 500-line method that motivated this ADR.
Sagas for all (option 4) misunderstands sagas — sagas are for cross-aggregate
coordination (short-lived, seconds), not long-running business processes
(minutes to weeks). Rule (1) — workflow engine for complex — sets the
boundary. A workflow with 3 steps and no branches is a saga (ADR-036); a
workflow with 10+ steps, branches, timers, and human tasks is a workflow
engine workflow. The admission workflow (15 states, 25 transitions, 5 timers, 3
human tasks) clearly qualifies. The fee payment workflow (3 steps, no
branches) is a saga. The criterion is complexity, not length — a 3-step workflow
with a human task (parent approval) is a workflow engine workflow because
human tasks require state persistence and timeout handling. Rule (2) —
declarative YAML — is the core abstraction. A workflow definition specifies
states (INQUIRY, APPLICATION, DOCUMENT_UPLOAD,
PARENT_APPROVAL, ...) and transitions (INQUIRY -> APPLICATION on
submit, APPLICATION -> DOCUMENT_UPLOAD on save, ...). The YAML is the
workflow's 'source code' — readable, modifiable, version-controlled. A business
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 210

PreOne ADR - Volume 2: Domain Architecture v3.0
analyst can review the YAML and verify the workflow matches the business
process. Changes to the workflow (e.g., add a 'scholarship approval' state) are
YAML edits, not code changes. Rule (3) — state persisted — enables crash
recovery. The workflow_state table records the current state, status, payload
(workflow input), and task assignments. If the application crashes mid-
workflow, the recovery job reads workflow_state and resumes (or escalates if a
timer has expired). Without persisted state, a crash would lose all progress —
unacceptable for a workflow that may span weeks (e.g., waiting for parent
approval). Rule (4) — small idempotent handlers — keeps the engine clean.
Each transition has a handler (a Spring @Component with a handle() method)
that executes the transition's logic (e.g., 'send document upload email', 'create
fee payment saga'). Handlers are <50 lines (enforced by ArchUnit) and
idempotent (duplicate execution is safe). The handler does not contain
workflow logic (branching, looping) — that is in the YAML. The handler
executes one transition's side effects. Rule (5) — features (branches, loops,
timers, human tasks, parallel) — covers PreOne's workflow needs. Branches:
conditional transitions (if scholarship_applied, route to
SCHOLARSHIP_APPROVAL; else route to FEE_PAYMENT). Loops: cycles
(DOCUMENT_UPLOAD -> REVIEW -> if rejected, DOCUMENT_UPLOAD
again). Timers: state timeouts (PARENT_APPROVAL times out after 7 days ->
transition to PARENT_REMINDER -> after 14 days -> transition to
ESCALATION). Human tasks: states with assignments (PARENT_APPROVAL
state, assigned to parent_user_id, on approval -> transition to
BRANCH_APPROVAL). Parallel: fork/join (fee payment and document
verification in parallel, join before enrollment). Rule (6) — versioned definitions
— enables evolution. A workflow definition may change (add a state, modify a
transition); existing in-flight workflows continue with their original version, and
new workflows use the new version. The workflow_state table records the
definition version, enabling correct handling of in-flight workflows after a
definition change. Versioning is detailed in ADR-040. Rule (7) — visualisation
— improves UX and operations. The workflow engine auto-generates a state
diagram from the YAML definition (using Graphviz). Users see 'You are here:
DOCUMENT_UPLOAD' on a visual workflow. Operators see the current state of
all workflows on a dashboard. The visualisation is generated, not hand-drawn —
it always matches the YAML. Rule (8) — sagas for simple — prevents workflow
engine overuse. Not every multi-step process needs the workflow engine. A 3-
step fee payment (Payment -> Invoice -> Enrollment) is a saga (ADR-036) — no
branches, no timers, no human tasks. Using the workflow engine for this would
add overhead (YAML definition, state persistence) without benefit. The
criterion: if the workflow has branches, timers, or human tasks, use the
workflow engine; otherwise, use a saga.
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 211

PreOne ADR - Volume 2: Domain Architecture v3.0
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Workflow Engine
Architecture | | | |
Workflow Definition (YAML, declarative) | |
+----------------------------------------------------------+ | | |
workflows/enrollment/admission.yml | | | | name: admission
| | | | version: 1.2 | | | | states:
| | | | - INQUIRY (initial) | | | | - APPLICATION
| | | | - DOCUMENT_UPLOAD | | | | -
PARENT_APPROVAL (human task, timer: 7d) | | | | -
BRANCH_APPROVAL (human task, timer: 3d) | | | | -
SCHOLARSHIP_APPROVAL (conditional) | | | | - FEE_PAYMENT
| | | | - ENROLLED (final) | | | | transitions:
| | | | - INQUIRY -> APPLICATION on submit | | | | -
APPLICATION -> DOCUMENT_UPLOAD on save | | | | -
DOCUMENT_UPLOAD -> PARENT_APPROVAL on upload_complete| | | -
PARENT_APPROVAL -> BRANCH_APPROVAL on approve | | | -
PARENT_APPROVAL -> ESCALATION on timeout(7d) | | | -
BRANCH_APPROVAL -> SCHOLARSHIP_APPROVAL | | | if
scholarship_applied | | | - BRANCH_APPROVAL ->
FEE_PAYMENT if !scholarship | | | - SCHOLARSHIP_APPROVAL ->
FEE_PAYMENT on approve | | | - FEE_PAYMENT -> ENROLLED on
payment_confirmed | | +----------------------------------------------------------+ | |
| | Workflow Engine (preone-workflow, Spring StateMachine) | |
+----------------------------------------------------------+ | | | WorkflowEngine
| | | | + start(definition, payload): WorkflowId | | | | +
signal(workflowId, event) | | | | + getState(workflowId):
WorkflowState | | | | + getActiveWorkflows(type):
List<WorkflowState> | | | +----------------------------------------------------------+ | |
| StateMachine (Spring StateMachine) | | | | - reads YAML,
builds state machine | | | | - executes transitions
| | | | - invokes handlers | | | | - persists state
| | | +----------------------------------------------------------+ | |
| | Workflow State (persisted) | |
+----------------------------------------------------------+ | | | workflow_state table
| | | | workflow_id | type | current_state | status | payload | | | | uuid1 |
admission | PARENT_APPROVAL | RUNNING | {...} | | | | uuid2 | admission |
ENROLLED | COMPLETED | {...} | | | | uuid3 | admission |
FEE_PAYMENT | RUNNING | {...} | | |
+----------------------------------------------------------+ | |
| | Transition Handlers (small, idempotent) | |
+----------------------------------------------------------+ | | | SubmitApplicationHandler (<50
lines, @Transactional) | | | | - create Application aggregate
| | | | - publish ApplicationCreated event | | |
+----------------------------------------------------------+ | | |
SendParentApprovalEmailHandler (<50 lines) | | | | - send email to
parent | | | | - set timer for 7 days |
| | +----------------------------------------------------------+ | |
| | Timer Service (checks for expired timers) | |
+----------------------------------------------------------+ | | | Runs every 1 minute
| | | | - queries workflows with expired timers | | | | - signals
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 212

PreOne ADR - Volume 2: Domain Architecture v3.0
timeout event to state machine | | |
+----------------------------------------------------------+ |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
User Workflow Engine StateMachine Handler DB | |
| | | |--start-------->| | | | |
admission | | | | | (payload) | |
| | | |--create state----->| | | | |
(RUNNING, | | | | | state=INQUIRY) |
| | | | | | | | |--persist
state-----|-----------------|-------------->| | | | | |
|<--workflowId---| | | | | | |
| | | (user submits application) | | | |--
signal------->| | | | | (submit) | |
| | | |--transition------->| | | | |
INQUIRY->APP | | | | | |--invoke
handler>| | | | | SubmitAppHandler | |
| | |--create App | | | | |--
INSERT------>| | | | |<--ok----------| | |
| |--publish event| | | |<--done----------| | |
| | | | | | |--update state |
| | | | (state=APP) | | | |<--
ok---------------| | | | | | |
| | |--persist state-----|-----------------|-------------->| | | |
| | |<--ok-----------| | | | | |
| | | | (timer scenario: PARENT_APPROVAL times out after
7d) | | | | | | | | |
(timer service) | | | | |--check timers----->|
| | | | (find expired) | | | | |
|--signal timeout | | | | | (PARENT_APPROVAL-
>ESCALATION) | | | | | | | |
|--invoke handler>| | | | | EscalationHandler
| | | | |--notify branch| | | |
| manager | | | |<--done----------| | | |
| | | | | |--update state | | |
| | (state=ESCALATION) | | |<--ok---------------|
| | | | | | | | |--persist
state-----|-----------------|-------------->|
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Workflow Engine Components
| | | | Workflow Definition (YAML, Git-
versioned) | | +---------------------+ +---------------------+ | | |
admission.yml | | transfer.yml | | | | (15 states, 25 | | (8 states,
12 | | | | transitions) | | transitions) | | | +---------------------
+ +---------------------+ | | | | Workflow
Engine (preone-workflow library) | | +---------------------+
+---------------------+ | | | WorkflowEngine | | StateMachineFactory |
| | | + start() |-->| (builds Spring | | | | + signal() | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 213

PreOne ADR - Volume 2: Domain Architecture v3.0
StateMachine from | | | | + getState() | | YAML) | | |
+---------------------+ +---------------------+ | |
| | +---------------------+ +---------------------+ | | | WorkflowStateRepo | |
TimerService | | | | (persists state) | | (checks expired | | |
+---------------------+ | timers every 1min) | | |
+---------------------+ | | Transition Handlers (small, idempotent) | |
+---------------------+ +---------------------+ | | | SubmitAppHandler | |
SendApprovalEmail | | | | (<50 lines, | | Handler (<50 lines) | |
| | @Transactional, | +---------------------+ | | | idempotent) |
| | +---------------------+ +---------------------+ | | |
EscalationHandler | | | +---------------------+ | (<50 lines) | | | |
ProcessFeePayment | +---------------------+ | | | Handler (<50 lines) |
| | +---------------------+ | |
| | State Persistence | | +---------------------+
| | | workflow_state table| workflow_id, type, state, | | | (PostgreSQL) |
status, payload, tasks, timers | | +---------------------+ | |
| | Visualisation | | +---------------------+
| | | StateDiagramGenerator| auto-generates Graphviz diagram | | | (from
YAML) | for users and operators | | +---------------------+
| +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Start Workflow (e.g., student admission) | v +----+-----+ | Workflow |
--load YAML definition | Engine | --create state machine | | --create
workflow_state (RUNNING, state=INQUIRY) +----+-----+ | |--return
workflowId to caller (API: 202 Accepted) | v (user drives workflow via
signals) +----+-----+ | Signal | --user submits application (signal=submit) |
Handler | --StateMachine transitions INQUIRY->APPLICATION | | --
invoke SubmitAppHandler (create Application, publish event) | | --update
workflow_state (state=APPLICATION) +----+-----+ | v (continue
transitions) +----+-----+ | Document | --user uploads documents
(signal=upload_complete) | Upload | --transition APPLICATION-
>DOCUMENT_UPLOAD->PARENT_APPROVAL | | --invoke
SendApprovalEmailHandler (email parent, set 7d timer) +----+-----+ | v
(human task: parent approval) +----+-----+ | Parent | --parent approves
(signal=approve) | Approval | --transition PARENT_APPROVAL-
>BRANCH_APPROVAL | | --invoke SendBranchApprovalEmailHandler
+----+-----+ | +--if parent does not approve within 7d: | --timer
expires | --transition PARENT_APPROVAL->ESCALATION | --invoke
EscalationHandler (notify branch manager) | v (continue to enrollment)
+----+-----+ | Fee | --branch approves -> FEE_PAYMENT | Payment | --
invoke ProcessFeePaymentHandler (start fee payment saga) | | --on
payment_confirmed -> ENROLLED +----+-----+ | v +----+-----+ |
COMPLETED| --workflow_state status=COMPLETED | | --notify user
(webhook, email) +----------+
DATABASE IMPACT
The workflow engine adds the workflow_state table to the database. The table
has: workflow_id (uuid primary key), workflow_type (text), definition_version
(text), current_state (text), status (text: RUNNING, COMPLETED, FAILED,
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 214

PreOne ADR - Volume 2: Domain Architecture v3.0
CANCELLED), started_at (timestamptz), updated_at (timestamptz), payload
(jsonb), task_assignments (jsonb), timer_expirations (jsonb). An index on
(status, updated_at) supports the recovery and timer queries. The table is in the
platform schema (shared across workflows). Old COMPLETED workflows are
archived after 90 days. The table grows linearly with workflow count
(~1,000/day); partitioning by started_at keeps it manageable. Transition
handlers execute normal transactions (per ADR-033) — no special database
support needed.
API IMPACT
Workflows affect API responses. A workflow-triggering API request (e.g.,
POST /admissions) returns 202 Accepted with a workflow_id. The API consumer
polls GET /workflows/{workflow_id} for state (current_state, status) or
receives a webhook on state transitions. The API documentation indicates
which operations are workflows and what each state means. For human-task
states (e.g., PARENT_APPROVAL), the API exposes endpoints for the assigned
user to approve/reject (POST /workflows/{id}/approve).
UI IMPACT
Workflows significantly affect UI. The UI displays the workflow's current state
(e.g., 'Awaiting parent approval') and a visual progress indicator (auto-
generated state diagram). For human-task states, the UI shows an action
button ('Approve' / 'Reject') for the assigned user. For timer-based states, the
UI shows a countdown ('Parent approval expires in 5 days'). The UI polls the
workflow state (or receives WebSocket notifications, per ADR-145) for updates.
Workflow visualisation improves UX by showing the user where they are in the
process.
SECURITY IMPACT
The workflow engine improves security by providing auditability. The
workflow_state table records every state transition (who triggered it, when,
what was the previous state). This is a forensic trail for business processes —
critical for compliance (e.g., 'who approved this student's admission?'). Human
tasks enforce segregation of duties (e.g., parent approval and branch approval
are different users). Timers prevent workflows from stalling indefinitely (e.g.,
an approval pending for 30 days is escalated), reducing the risk of forgotten
approvals.
PERFORMANCE IMPACT
The workflow engine has minimal performance overhead for short-lived
workflows (state transitions are milliseconds). For long-running workflows
(weeks), the overhead is the timer service (runs every 1 minute, queries expired
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 215

PreOne ADR - Volume 2: Domain Architecture v3.0
timers — a fast index query). The state machine itself is in-memory (per
workflow instance); state persistence is a single-row UPDATE. The main cost is
the YAML parsing (done once per workflow type at startup, cached). Overall,
the workflow engine has no measurable performance impact for PreOne's
workflow volume (~1,000/day).
SCALABILITY ANALYSIS
The workflow engine scales horizontally. The engine is stateless (state in
workflow_state table), so multiple instances can run concurrently. State
transitions are serialised per workflow (via optimistic locking on
workflow_state), preventing concurrent modifications. The timer service scales
by sharding (each instance checks a subset of workflows). The workflow_state
table scales with partitioning (by started_at). At PreOne's projected scale
(10,000 workflows/day, 7 workflow types), the architecture is sufficient.
OPERATIONAL CONSIDERATIONS
Workflow operations are observable via: workflow.started.count (per type),
workflow.completed.count (per type), workflow.failed.count (per type),
workflow.cancelled.count (per type), workflow.completion.time (p50/p95/p99),
workflow.stalled.count (RUNNING >7 days), workflow.timer.expired.count
(transitions triggered by timers). The quarterly architecture scorecard audits:
(a) workflow completion time (target: p95 varies by type, e.g., admission <7
days), (b) workflow failure rate (target: <1%), (c) stalled workflows (target:
zero; stalled workflows are manually reviewed), (d) timer expiration rate
(target: <5%; higher indicates user disengagement).
RISKS
Risk Likelihood Impact Mitigation
Workflow Medium Medium Quarterly review
definitions of workflow
become complex complexity;
(spaghetti states) Domain Architect
enforces
simplicity; prefer
splitting complex
workflows into
multiple simpler
ones
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 216

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk                 | Likelihood | Impact | Mitigation       |
| -------------------- | ---------- | ------ | ---------------- |
| Workflow engine      | Low        | Medium | State persisted  |
| crashes mid-         |            |        | before handler   |
| transition, leaving  |            |        | execution; on    |
| inconsistent state   |            |        | restart, engine  |
reads state and
resumes; recovery
job detects stalled
workflows
| Timer service       | Low | Medium | Timer service is     |
| ------------------- | --- | ------ | -------------------- |
| misses expirations  |     |        | stateless (queries   |
| (e.g., during       |     |        | DB); on restart, it  |
| outage)             |     |        | catches up;          |
missed expirations
are detected by
the recovery job
| Human tasks are  | Medium | Low | Timers with          |
| ---------------- | ------ | --- | -------------------- |
| not completed    |        |     | escalation;          |
| (user            |        |     | reminders via        |
| disengagement)   |        |     | email/notification;  |
manual override
by admin
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Manageable complex workflows  Engine maintenance burden (custom
| (declarative YAML) |     | library) |     |
| ------------------ | --- | -------- | --- |
Crash recovery (state persisted) State persistence overhead (DB writes)
Observability (state visualisation, audit  Spring StateMachine learning curve
trail)
Human tasks and timers (managed) Overkill for simple workflows (use
sagas)
REJECTED ALTERNATIVES
External BPM (option 2, Camunda) was prototyped: the deployment added a
separate service (Camunda Engine), a separate database (Camunda schema),
and a visual designer (Cockpit) — operational complexity that was not justified
for PreOne's 7 complex workflows. The licensing cost (enterprise features for
human tasks, reporting) was also a factor. Procedural code (option 3) was the
pre-ADR-037 state and produced the 500-line admission method that was
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  217

PreOne ADR - Volume 2: Domain Architecture v3.0
untestable and crash-prone. Sagas for all (option 4) was rejected because sagas
do not support long-running workflows (a saga holding state for 7 days is an
anti-pattern), human tasks, or timers — all of which PreOne's admission
workflow requires.
MIGRATION PLAN
Phase 1 (complete): Build preone-workflow library on Spring StateMachine.
Phase 2 (complete): Pilot admission workflow (15 states, 25 transitions). Phase
3 (complete): Migrate 7 complex workflows to the engine. Phase 4 (complete):
Visualisation (state diagram generator). Phase 5 (complete): Timer service and
recovery job. Phase 6 (Q4 2026): Training session for engineers on workflow
YAML authoring.
TESTING STRATEGY
Workflow testing has three levels. Unit tests: transition handlers are unit-tested
(verify side effects, idempotency). Integration tests: workflow end-to-end (start,
signal, transition, complete) tested with Testcontainers PostgreSQL. State
machine tests: each workflow definition is tested with all possible paths
(branches, loops, timer expirations, human task approvals/rejections).
Concurrency tests: multiple concurrent workflows of the same type (verify no
interference). Crash recovery tests: crash mid-transition, verify resume on
restart. Timer tests: simulate timer expiration, verify transition.
MONITORING & OBSERVABILITY
Workflow metrics: workflow.started.count (per type),
workflow.completed.count (per type), workflow.failed.count (per type, by
failure reason), workflow.completion.time (p50/p95/p99 per type),
workflow.stalled.count (gauge, RUNNING >7 days),
workflow.timer.expired.count, workflow.state.distribution (gauge per state,
per type). Dashboards in Grafana: workflow flow per type, completion time per
type, stalled workflows. Alerts: workflow.completion.time p95 >target,
workflow.stalled.count >0, workflow.failure.rate >1%.
FUTURE EVOLUTION
Three evolutions are possible. First, a visual workflow designer (drag-and-drop)
may be added if business analysts need to author workflows without YAML —
but the current YAML is readable enough. Second, the workflow engine may
adopt BPMN (Business Process Model and Notation) for industry-standard
workflow definitions — but BPMN's complexity is not justified for PreOne.
Third, the workflow engine may integrate with the rule engine (ADR-030) for
conditional transitions (e.g., 'if rule X evaluates true, transition to state Y') —
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 218

PreOne ADR - Volume 2: Domain Architecture v3.0
but the current YAML condition syntax is sufficient. The workflow engine itself
is stable.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P4 Observability via
workflow audit trail)
● ADR-004 — Domain Driven Design (workflows orchestrate domain
operations)
● ADR-022 — Aggregate Rules (workflow handlers modify one aggregate
per transition)
● ADR-027 — Domain Events (workflow transitions publish events)
● ADR-028 — Application Services (workflow handlers are app service
methods)
● ADR-032 — Unit of Work (each transition is a UoW)
● ADR-036 — Saga Readiness (sagas for simple, workflow engine for
complex)
● ADR-039 — Domain Exceptions (workflow failures throw domain
exceptions)
● ADR-040 — Domain Versioning (workflow definitions are versioned)
● ADR-048 — Audit Trail (workflow state log is part of audit trail)
REFERENCES
● Upstream DDD: DDD-001 (Strategic Design — workflow orchestration)
● Upstream PRD: PRD-002-section-9 (Admission workflow requirements)
● Downstream ERD: ERD-008 (workflow_state table schema)
● Downstream API Spec: API-006 (Workflow API: 202 Accepted, state
polling, approve/reject)
● Downstream Test Cases: TC-0059 (Workflow engine, transitions,
timers, human tasks tests)
● External: Spring StateMachine Documentation (implementation
reference)
● External: Workflow Patterns — Russel van der Aalst (workflow pattern
reference)
DECISION HISTORY
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 219

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Date       | Status | Actor            | Notes                 |
| ---------- | ------ | ---------------- | --------------------- |
| 2026-01-03 | Draft  | Enrollment       | Initial draft with 4  |
|            |        | Domain Architect | options; Spring       |
StateMachine
chosen
| 2026-02-05 | Proposed | Enrollment       | Submitted to ARB  |
| ---------- | -------- | ---------------- | ----------------- |
|            |          | Domain Architect | after admission   |
pilot
| 2026-03-04 | Accepted | ARB Chair | ARB approved; 7  |
| ---------- | -------- | --------- | ---------------- |
workflows
migrated
| 2026-08-17 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)        |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Enrollment Domain Architect |     |
| ARB Chair   |     | ARB Chair                   |     |
| Approved On |     | 2026-08-17                  |     |
IMPLEMENTATION CHECKLIST
● Build preone-workflow library on Spring StateMachine (Done — v1.0.0)
● Pilot admission workflow (Done — 15 states, 25 transitions)
● Migrate 7 complex workflows to engine (Done — PR #5601)
● Visualisation (state diagram generator, Done — PR #5615)
● Timer service and recovery job (Done — runs every 1 minute)
● ArchUnit rules: handlers <50 lines, idempotent, @Transactional (Done
— CI gate since V2.0.0)
● Workflow testing framework (Done — 87 test cases across 7 workflows)
● Training session for engineers (Done — 3 sessions delivered)
AD R -038
Domain Invariants
Volume 2 — Domain Architecture  -  DDD Pattern
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  220

PreOne ADR - Volume 2: Domain Architecture v3.0
ACCEPTED
DECISION SUMMARY
DECISION
Define the rules for identifying, enforcing, and testing domain invariants in
the PreOne domain model. An invariant is a business rule that must always
hold (e.g., 'an enrollment cannot have more than 5 active discounts').
Invariants are enforced inside aggregate roots (per ADR-022), validated in
value object constructors (per ADR-024), and tested with invariant tests.
Every invariant has a corresponding domain exception (ADR-039) thrown
on violation.
STATUS
Status Accepted
Date Decided 2026-03-11
Decision Owner Domain Architect — Enrollment
Review Cadence Annual or on invariant model
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-038, PreOne's invariants were scattered and unenforced. Some
were in database constraints (CHECK, UNIQUE), some in service methods (if-
else checks), some in UI validation, and some were not enforced at all (only
documented in wikis). The 'max 5 active discounts' invariant was enforced in
the UI (disabled the 'Add Discount' button after 5) but not in the domain — a
batch import script bypassed the UI and created an enrollment with 8
discounts, causing billing errors. The team realised invariants must be enforced
in the domain (aggregate root or value object), not in the UI or services. The
Enrollment Domain Architect led a 4-week effort to identify and centralise all
invariants. The output was an invariant catalogue (47 invariants across 12
domains), each with a description, the enforcing location (aggregate method or
value object constructor), the exception thrown, and the test case. Every
invariant was moved to the domain layer, with UI and service-layer checks as
defense-in-depth (not primary enforcement). This ADR codifies the invariant
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 221

PreOne ADR - Volume 2: Domain Architecture v3.0
rules. ArchUnit tests verify that invariants are in aggregate roots or value
objects (not in services or controllers).
BUSINESS DRIVERS
The primary driver is correctness: invariants are business rules that must
always hold, regardless of entry point. A rule like 'max 5 active discounts' must
be enforced whether the entry point is the UI, an API, a batch job, or a CLI tool.
The only way to guarantee this is to enforce in the domain (aggregate root or
value object). The secondary driver is auditability: the invariant catalogue
documents every business rule in one place, enabling review by domain
experts. The tertiary driver is testability: invariants in the domain are unit-
testable without UI or infrastructure. A fourth driver is onboarding: new
engineers can read the invariant catalogue to understand the business rules,
rather than reverse-engineering them from code. A fifth driver is compliance:
regulators may ask 'how do you ensure X?' — the invariant catalogue answers
'we enforce it in aggregate Y, method Z, tested by test case W'.
PROBLEM STATEMENT
PreOne's invariants are scattered across UI, services, and database, with some
unenforced, causing business rule violations (e.g., 8 discounts on an
enrollment). We must define invariant rules that centralise enforcement in the
domain layer, with a catalogue for auditability.
CONSTRAINTS
● Invariants are enforced in aggregate roots (methods) or value objects
(constructors)
● Invariants are NOT enforced in services or controllers (those are
defense-in-depth)
● Every invariant has a corresponding domain exception (ADR-039)
● Every invariant has a test case (invariant test)
● Invariants are documented in the invariant catalogue
ASSUMPTIONS
● Business rules can be classified as invariants (always hold) vs policies
(sometimes hold)
● Invariants in aggregate roots are sufficient (no need for a separate
invariant engine)
● Domain exceptions (ADR-039) are the correct error mechanism for
invariant violations
● The invariant catalogue is maintainable (updated when invariants
change)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 222

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Invariant tests catch violations before production (high coverage)
OPTIONS CONSIDERED
| Option              | Pros               | Cons                | Verdict |
| ------------------- | ------------------ | ------------------- | ------- |
| Invariants in       | Always enforced;   | Requires            | Chosen  |
| aggregate roots     | testable;          | discipline to keep  |         |
| and value objects,  | auditable; aligns  | invariants in       |         |
| with catalogue      | with DDD; single   | domain; catalogue   |         |
| (chosen)            | source of truth.   | maintenance;        |         |
cultural shift from
service-layer
enforcement.
| Invariants in     | Always enforced   | Opaque error       | Rejected |
| ----------------- | ----------------- | ------------------ | -------- |
| database          | (database is the  | messages (SQL      |          |
| constraints (pre- | last resort);     | errors); too late  |          |
| ADR-038 partial   | simple; no        | (after business    |          |
| state)            | application code. | logic); cannot     |          |
express cross-field
rules; not testable.
| Invariants in    | Flexible; can      | Bypassed by other  | Rejected |
| ---------------- | ------------------ | ------------------ | -------- |
| service methods  | express any rule;  | entry points       |          |
| (pre-ADR-038     | familiar.          | (batch, CLI);      |          |
| partial state)   |                    | duplicated across  |          |
services; not
always enforced;
pre-ADR-038
state.
| Invariants in UI  | Immediate       | Bypassed by API,  | Rejected |
| ----------------- | --------------- | ----------------- | -------- |
| validation (pre-  | feedback; good  | batch, CLI; not   |          |
| ADR-038 partial   | UX; no server   | enforced; client- |          |
| state)            | round-trip.     | side only; pre-   |          |
ADR-038 state.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  223

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following invariant rules: (1) Invariants are enforced in aggregate
roots (methods) or value objects (constructors) — never in services or
controllers. (2) Every invariant has a corresponding domain exception (per
ADR-039) thrown on violation, with a clear message. (3) Every invariant has
a test case in the invariant test suite — tests verify the invariant holds for
valid input and is violated for invalid input. (4) Invariants are documented in
the invariant catalogue (docs/invariants/<domain>.md) — each invariant
has: ID, description, enforcing location, exception, test case. (5) The
invariant catalogue is version-controlled (in Git) and reviewed by the
Domain Architect. (6) Database constraints (CHECK, UNIQUE) are a last-
resort safety net — they should never be the primary enforcement, but
catch bugs that bypass application validation. (7) UI and service-layer
checks are defense-in-depth — they improve UX and fail-fast, but the
domain is the source of truth. (8) ArchUnit verifies that invariant logic (if-
else checks that throw domain exceptions) is in @AggregateRoot or
@Embeddable classes, not in @Service or @RestController.
DETAILED RATIONALE
The chosen option is the only one that guarantees invariants always hold.
Database constraints (option 2) are too late (after business logic) and produce
opaque errors. Service methods (option 3) are bypassed by other entry points.
UI validation (option 4) is bypassed by API, batch, and CLI. Only domain-layer
enforcement (aggregate roots and value objects) guarantees the invariant
holds regardless of entry point. Rule (1) — invariants in domain — is the core
rule. An invariant like 'an enrollment cannot have more than 5 active discounts'
is enforced in the Enrollment aggregate's addDiscount() method: if
enrollment.discounts.count(active) >= 5, throw
TooManyActiveDiscountsException. This method is the only way to add a
discount (per ADR-022, children accessed via root), so the invariant cannot be
bypassed. ArchUnit verifies that the addDiscount method (and all invariant-
enforcing methods) is in the @AggregateRoot class. Rule (2) — domain
exceptions — provides clear error messages.
TooManyActiveDiscountsException has a message like 'Cannot add discount:
enrollment E001 already has 5 active discounts (limit: 5)'. The API layer catches
this exception and returns 400 Bad Request with the message. The UI displays
the message to the user. Without a specific exception, the invariant violation
would be a generic IllegalStateException with an opaque message. Rule (3) —
test cases — verify invariants hold. The EnrollmentTest class has a test method
should_reject_sixth_discount_when_five_active(): create enrollment, add 5
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 224

PreOne ADR - Volume 2: Domain Architecture v3.0
discounts, attempt to add 6th, verify TooManyActiveDiscountsException is
thrown. Another test should_allow_sixth_discount_when_one_is_inactive(): add
5 discounts, deactivate one, add 6th, verify success. Invariant tests are the
primary defence against regression — if an engineer refactors addDiscount()
and accidentally removes the check, the test fails. Rule (4) — invariant
catalogue — documents all invariants in one place. The catalogue
(docs/invariants/enrollment.md) lists: INV-ENR-001 (max 5 active discounts),
INV-ENR-002 (cannot cancel confirmed enrollment), INV-ENR-003 (total fees >
0 to confirm), etc. Each entry has: ID, description, enforcing location
(Enrollment.addDiscount()), exception (TooManyActiveDiscountsException),
test case (EnrollmentTest.should_reject_sixth_discount_when_five_active). The
catalogue is the authoritative source — if an invariant is not in the catalogue, it
does not exist. Rule (5) — version-controlled catalogue — enables audit. The
catalogue is in Git, so changes are tracked (who added an invariant, when,
why). Regulators can review the catalogue to verify compliance. The catalogue
is reviewed by the Domain Architect on every PR that adds or modifies an
invariant. Rule (6) — database constraints as safety net — acknowledges that
application validation can have bugs. A CHECK constraint (discounts_count <=
5) on the enrollments table catches a bug where the addDiscount() method is
bypassed (e.g., a direct SQL update by a DBA). The constraint produces a SQL
error, which is not user-friendly, but it prevents data corruption. Database
constraints do not replace application validation; they supplement it. Rule (7)
— UI and service checks as defense-in-depth — improves UX. The UI disables
the 'Add Discount' button when 5 discounts are active, providing immediate
feedback without a server round-trip. The service layer (application service)
may also check (e.g., log a warning if the limit is approaching). These checks
are not the primary enforcement (the domain is), but they improve the user
experience and catch issues early. Rule (8) — ArchUnit verification — enforces
rule 1 mechanically. ArchUnit scans for if-else blocks that throw domain
exceptions (identified by the DomainException base class) and verifies they are
in @AggregateRoot or @Embeddable classes. An invariant-enforcing if-else in a
@Service or @RestController is flagged as a violation. This prevents the
gradual migration of invariants back to services (which was the pre-ADR-038
state).
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Domain Invariant Rules
| | | | Invariant Catalogue
(docs/invariants/<domain>.md) | |
+----------------------------------------------------------+ | | | Enrollment Invariants
| | | | INV-ENR-001: Max 5 active discounts per enrollment | | | |
Enforced: Enrollment.addDiscount() | | | | Exception:
TooManyActiveDiscountsException | | | | Test:
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 225

PreOne ADR - Volume 2: Domain Architecture v3.0
EnrollmentTest.should_reject_6th_when_5_active | | | |
| | | | INV-ENR-002: Cannot cancel confirmed enrollment | | | |
Enforced: Enrollment.cancel() | | | | Exception:
CannotCancelConfirmedEnrollmentException | | | | Test:
EnrollmentTest.should_reject_cancel_when_confirm | | | |
| | | | INV-ENR-003: Total fees > 0 to confirm | | | | Enforced:
Enrollment.confirm() | | | | Exception:
CannotConfirmZeroFeeEnrollmentException | | | | Test:
EnrollmentTest.should_reject_confirm_when_zero | | |
+----------------------------------------------------------+ | |
| | Enforcement (in domain layer) | |
+----------------------------------------------------------+ | | | @AggregateRoot
| | | | class Enrollment { | | | | void
addDiscount(Discount d) { | | | | if (activeDiscounts().size()
>= 5) { | | | | throw new TooManyActiveDiscountsException(
| | | | this.id, activeDiscounts().size()); | | | | }
| | | | discounts.add(d); | | | | }
| | | | } | | |
+----------------------------------------------------------+ | |
| | Defense-in-Depth (NOT primary enforcement) | |
+----------------------------------------------------------+ | | | UI: disable 'Add Discount'
button when 5 active | | | | App Service: log warning when 4 active
| | | | DB: CHECK constraint (discounts_count <= 5) | | |
+----------------------------------------------------------+ | |
| | Testing | |
+----------------------------------------------------------+ | | | EnrollmentTest
| | | | + should_reject_6th_when_5_active() | | | | +
should_allow_6th_when_1_inactive() | | | | +
should_reject_cancel_when_confirmed() | | | | +
should_reject_confirm_when_zero_fee() | | |
+----------------------------------------------------------+ | |
| | ArchUnit: | | - if-else throwing
DomainException: in @AggregateRoot or @Embeddable | | - Invariant catalogue
exists for every domain | +------------------------------------------------------------------
+
SEQUENCE DIAGRAM
Caller (any entry point) Aggregate Root Invariant Check |
| | |--addDiscount(d)----------->| | |
| | | |--check invariant | |
| activeDiscounts() | | | .size() >= 5? | |
| | | | (if violated) | | |--
throw TooManyActive | | | DiscountsException | |<--
exception----------------| | | | | |
(API layer catches, returns 400) | | (UI layer catches, shows error
message) | | (batch job catches, logs and skips) | |
| | | (if invariant holds) | |
|--discounts.add(d) | | |--return success | |<--
ok-----------------------| |
COMPONENT DIAGRAM
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 226

PreOne ADR - Volume 2: Domain Architecture v3.0
+-------------------------------------------------------------+ | Invariant Enforcement
Components | | | |
Invariant Catalogue (docs/invariants/) | | +---------------------+
+---------------------+ | | | enrollment.md | | billing.md | | | |
INV-ENR-001.. | | INV-BIL-001.. | | | +---------------------+
+---------------------+ | | | | Aggregate
Root (enforces invariants) | | +---------------------+ @AggregateRoot
| | | Enrollment | Invariants enforced in methods: | | |---------------------| -
addDiscount(): max 5 active | | | + addDiscount() | - cancel(): not if
confirmed | | | + cancel() | - confirm(): fees > 0 | | | + confirm()
| - transfer(): not mid-enroll | | | + transfer() | | |
+---------------------+ | | | |
Value Object (enforces value invariants) | | +---------------------+
@Embeddable | | | Money | Invariants in constructor: |
| |---------------------| - amount >= 0 | | | (ctor validates) | - currency
not null | | | amount >= 0 | | | | currency not
null | | | +---------------------+ | |
| | Domain Exception (thrown on violation) | | +---------------------+
+---------------------+ | | | TooManyActive | | CannotCancel | | | |
DiscountsException | | ConfirmedEnrollment| | | | extends DomainExc |
| Exception | | | +---------------------+ +---------------------+ | |
| | Defense-in-Depth (NOT primary) | | +---------------------+
+---------------------+ | | | UI: disable button | | DB: CHECK constraint| |
| | App Svc: log warning| | (safety net) | | | +---------------------+
+---------------------+ | | | | Invariant
Tests | | +---------------------+ | | |
EnrollmentTest | - should_reject_6th_discount | | | | -
should_reject_cancel_confirmed | | | | -
should_reject_confirm_zero_fee | | +---------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Invariant Enforcement (all entry points) | +--UI: user clicks 'Add
Discount' | (UI checks: 5 active? disable button — defense-in-depth) |
(if enabled, sends POST /enrollments/{id}/discounts) | +--API: POST
/enrollments/{id}/discounts | (App Service loads Enrollment aggregate)
| (App Service calls enrollment.addDiscount(d)) | +--Batch: import
script | (Batch loads Enrollment aggregate) | (Batch calls
enrollment.addDiscount(d)) | +--CLI: admin tool (CLI loads
Enrollment aggregate) (CLI calls enrollment.addDiscount(d))
| v +----+-----+ | Aggregate| Enrollment.addDiscount(d) | Root
| --check invariant: activeDiscounts.size() >= 5? | | --if YES: throw
TooManyActiveDiscountsException | | --if NO: discounts.add(d), return
success +----+-----+ | +--Exception path: | (API: 400 Bad Request
with error message) | (Batch: log error, skip record) | (CLI: print error,
exit 1) | +--Success path: | (API: 200 OK) | (Batch: continue)
| (CLI: print success) | v +----+-----+ | DB | --CHECK constraint
(safety net) | | --if app validation bypassed, DB rejects +----------+
DATABASE IMPACT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 227

PreOne ADR - Volume 2: Domain Architecture v3.0
Invariants in the domain do not directly affect the database — they are
application-layer enforcement. However, database constraints (rule 6) are a
safety net. Every invariant that can be expressed as a database constraint has
one: CHECK constraints for range/ratio invariants (e.g., discount_count <= 5),
UNIQUE constraints for uniqueness invariants (e.g., one active enrollment per
student per academic year), NOT NULL for presence invariants (e.g.,
enrollment must have a student_id). Flyway migrations create these
constraints; ArchUnit verifies that every invariant in the catalogue has a
corresponding database constraint where expressible. Constraints that cannot
be expressed in SQL (e.g., 'max 5 active discounts' requires counting related
rows) are enforced only in the application.
API IMPACT
Invariants affect API error responses. When an invariant is violated, the API
returns 400 Bad Request with a structured error: {"code":
"TOO_MANY_ACTIVE_DISCOUNTS", "message": "Cannot add discount:
enrollment E001 already has 5 active discounts (limit: 5)", "field":
"discountId"}. The error code is derived from the exception class name
(TooManyActiveDiscountsException -> TOO_MANY_ACTIVE_DISCOUNTS).
API documentation lists all possible error codes per endpoint, enabling clients
to handle them programmatically. Invariant violations are never 500 errors
(server errors) — they are 400 errors (client errors), because the client sent a
request that violated a business rule.
UI IMPACT
Invariants affect UI feedback. The UI proactively checks invariants (defense-in-
depth) to provide immediate feedback — e.g., disabling the 'Add Discount'
button when 5 discounts are active. When the UI misses a check (or the user
bypasses it), the server enforces the invariant and returns 400. The UI displays
the error message from the API response. For complex invariants (e.g., 'cannot
transfer mid-enrollment'), the UI may not pre-check (the check requires server
data), so the user submits and sees the error — acceptable, but the UI should
explain the error clearly.
SECURITY IMPACT
Invariants improve security by preventing invalid states that could be exploited.
An invariant like 'payment amount must be non-negative' (enforced in the
Money value object) prevents negative-amount fraud. An invariant like 'user
cannot modify own role' (enforced in the User aggregate) prevents privilege
escalation. By enforcing invariants in the domain (not the UI), the system is
protected regardless of entry point — an attacker cannot bypass the UI to
exploit a missing invariant. The invariant catalogue provides an audit trail for
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 228

PreOne ADR - Volume 2: Domain Architecture v3.0
compliance (e.g., 'how do you ensure payments are non-negative? — INV-
PAY-001, enforced in Money constructor, tested by
MoneyTest.should_reject_negative_amount').
PERFORMANCE IMPACT
Invariants in the domain have minimal performance overhead — they are if-else
checks in methods, microseconds. Database constraints (safety net) are
enforced on INSERT/UPDATE, adding negligible overhead. UI checks (defense-
in-depth) improve performance by avoiding server round-trips for obviously
invalid input. Overall, invariants have no measurable performance impact; they
prevent costly data corruption that would require manual cleanup.
SCALABILITY ANALYSIS
Invariants scale linearly — they are per-method checks, stateless. The invariant
catalogue is documentation (no runtime cost). Invariant tests run in CI (no
production cost). Database constraints scale with the database. The invariant
pattern does not introduce scalability bottlenecks; it improves scalability by
preventing invalid states that could cause cascading failures (e.g., an
enrollment with 100 discounts causing billing calculation to time out).
OPERATIONAL CONSIDERATIONS
Invariants are observable via: invariant.violation.count (per invariant, per entry
point), invariant.violation.entry_point (UI, API, batch, CLI — high batch
violations may indicate stale data), invariant.test.coverage (percentage of
invariants with tests — target: 100%). The quarterly architecture scorecard
audits: (a) invariant violation rate (target: <0.1% of operations; higher
indicates UX issues or bugs), (b) invariant test coverage (target: 100%), (c)
ArchUnit violation count (target: zero — no invariants in services/controllers),
(d) catalogue completeness (target: 100% — every invariant documented).
RISKS
Risk Likelihood Impact Mitigation
Invariants are Medium High ArchUnit blocks
added to services invariant logic in
instead of @Service/@RestC
aggregates ontroller; code
(ArchUnit review; training
violation)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 229

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk              | Likelihood | Impact | Mitigation          |
| ----------------- | ---------- | ------ | ------------------- |
| Invariant         | Medium     | Medium | PR template         |
| catalogue is not  |            |        | requires catalogue  |
| updated when      |            |        | update for          |
| invariants change |            |        | invariant changes;  |
Domain Architect
reviews catalogue
on every PR
| Invariant tests are  | Low | High | CI verifies every  |
| -------------------- | --- | ---- | ------------------ |
| missing, allowing    |     |      | invariant in the   |
| regression           |     |      | catalogue has a    |
test; coverage
report; quarterly
audit
| Database           | Medium | Medium | ArchUnit verifies   |
| ------------------ | ------ | ------ | ------------------- |
| constraints and    |        |        | every expressible   |
| application        |        |        | invariant has a DB  |
| invariants diverge |        |        | constraint; Flyway  |
migrations
reviewed with
invariant changes
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Always enforced (regardless of entry  Requires discipline to keep in domain
point)
Auditable (catalogue documents all  Catalogue maintenance overhead
invariants)
Testable (unit tests, no infrastructure) Defense-in-depth duplication (UI,
service, DB)
Clear error messages (domain  Exception class proliferation (one per
| exceptions) |     | invariant) |     |
| ----------- | --- | ---------- | --- |
REJECTED ALTERNATIVES
Database constraints (option 2) were the pre-ADR-038 state for some invariants
(e.g., UNIQUE on email). Three issues: (1) the 'max 5 discounts' invariant could
not be expressed as a simple CHECK (it required counting related rows), so it
was not enforced in the DB; (2) SQL errors were opaque (e.g., 'violates unique
constraint students_email_key'), causing poor UX; (3) constraints were too late
(after business logic ran). Service methods (option 3) were the pre-ADR-038
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  230

PreOne ADR - Volume 2: Domain Architecture v3.0
state for other invariants — the 'max 5 discounts' check was in
EnrollmentAppService.addDiscount(), bypassed by the batch import script,
causing the 8-discount incident. UI validation (option 4) was the pre-ADR-038
state for the 'max 5 discounts' check (button disabled after 5) — bypassed by
API, batch, and CLI.
MIGRATION PLAN
Phase 1 (complete): Identify all invariants across 12 domains — 47 invariants
identified. Phase 2 (complete): Move invariants to aggregate roots and value
objects. Phase 3 (complete): Create domain exceptions for each invariant.
Phase 4 (complete): Write invariant tests (47 invariants, 234 test cases). Phase
5 (complete): Create invariant catalogue (docs/invariants/). Phase 6 (complete):
ArchUnit rules enforced in CI. Phase 7 (Q4 2026): Training session for new
engineers.
TESTING STRATEGY
Invariant testing has three levels. Unit tests: each invariant has tests for valid
input (invariant holds) and invalid input (invariant violated, exception thrown).
Edge cases (boundary values, null fields) are tested. Property-based tests:
invariants have property tests (e.g., 'discounts count never exceeds 5,
regardless of add/deactivate sequence'). ArchUnit tests: structural rules
(invariants in @AggregateRoot or @Embeddable, not in @Service or
@RestController) verified at compile time. Integration tests: invariants are
tested end-to-end via the API (verify 400 response on violation).
MONITORING & OBSERVABILITY
Invariant metrics: invariant.violation.count (per invariant, per entry point),
invariant.violation.entry_point (UI, API, batch, CLI), invariant.test.coverage
(percentage of invariants with tests). Dashboards in Grafana: invariant
violation rate per domain, top violated invariants, violation by entry point.
Alerts: invariant violation rate >0.1% (UX or bug), ArchUnit violation count >0,
test coverage <100%.
FUTURE EVOLUTION
Two evolutions are possible. First, the invariant catalogue may be generated
from code annotations (e.g., @Invariant(id="INV-ENR-001", description="...")
on the enforcing method) — but the current Markdown catalogue is sufficient.
Second, invariants may integrate with the rule engine (ADR-030) for complex,
frequently-changing invariants — but stable invariants belong in code (per
ADR-030). The invariant pattern itself is stable; it is a fundamental DDD
concept.
RELATED ADRS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 231

PreOne ADR - Volume 2: Domain Architecture v3.0
● ADR-001 — Enterprise Architecture Principles (P2 Data Integrity drives
invariants)
● ADR-004 — Domain Driven Design (invariants are a DDD concept)
● ADR-008 — SOLID Enforcement (SRP: invariants in one place)
● ADR-022 — Aggregate Rules (invariants enforced in aggregate roots)
● ADR-023 — Entity Rules (entity factory methods enforce creation
invariants)
● ADR-024 — Value Objects (value object constructors enforce value
invariants)
● ADR-029 — Validation (invariants are the primary validation layer)
● ADR-031 — Specification Pattern (specifications express invariants as
predicates)
● ADR-039 — Domain Exceptions (invariant violations throw domain
exceptions)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — invariants in
aggregates)
● Upstream PRD: PRD-002-section-10 (Enrollment business rules)
● Downstream ERD: ERD-002 (Enrollment schema with CHECK/UNIQUE
constraints)
● Downstream API Spec: API-002 (Enrollment API error codes for
invariant violations)
● Downstream Test Cases: TC-0060 (Invariant enforcement, catalogue,
ArchUnit tests)
● External: Eric Evans — Domain-Driven Design, Chapter 6 (Aggregates
and Invariants)
● External: Vaughn Vernon — Effective Aggregate Design (invariants and
consistency boundaries)
DECISION HISTORY
Date Status Actor Notes
2026-01-10 Draft Enrollment Initial draft with 4
Domain Architect options; domain
enforcement
chosen
2026-02-12 Proposed Enrollment Submitted to ARB
Domain Architect after 8-discount
incident analysis
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 232

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Date       | Status   | Actor     | Notes             |
| ---------- | -------- | --------- | ----------------- |
| 2026-03-11 | Accepted | ARB Chair | ARB approved; 47  |
invariants
catalogued and
enforced
| 2026-08-19 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)        |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Enrollment Domain Architect |     |
| ARB Chair   |     | ARB Chair                   |     |
| Approved On |     | 2026-08-19                  |     |
IMPLEMENTATION CHECKLIST
● Identify all invariants across 12 domains (Done — 47 invariants)
● Move invariants to aggregate roots and value objects (Done — PR
#5701)
● Create domain exceptions for each invariant (Done — 47 exception
classes)
● Write invariant tests (Done — 234 test cases)
● Create invariant catalogue (Done — docs/invariants/, 12 files)
● Add database constraints as safety net (Done — Flyway V2.1.0)
● ArchUnit rules: invariants in domain only (Done — CI gate since V2.1.0)
● Training session for engineers (Done — 4 sessions delivered)
AD R -039
Domain Exceptions
Volume 2 — Domain Architecture  -  Pattern
ACCEPTED
DECISION SUMMARY
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  233

PreOne ADR - Volume 2: Domain Architecture v3.0
DECISION
Define the exception strategy for the PreOne platform. Domain exceptions
(subclassing DomainException) represent business rule violations (e.g.,
TooManyActiveDiscountsException). Infrastructure exceptions
(SQLException, HttpClientException) are translated to domain exceptions
at the application service boundary. The API layer catches domain
exceptions and returns 400 (client error) with a structured error response.
Exceptions are never swallowed silently — fail loud per P8 in ADR-001.
STATUS
Status Accepted
Date Decided 2026-03-18
Decision Owner Domain Architect — Student
Review Cadence Annual or on exception strategy
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-039, PreOne's exception handling was inconsistent. Some code
threw RuntimeException with generic messages, some threw checked
Exception (forcing try-catch everywhere), some swallowed exceptions silently
(catch and ignore), and some threw infrastructure exceptions (SQLException)
directly to the API layer (producing 500 errors with stack traces). The 'max 5
discounts' violation produced a 500 error with 'java.lang.IllegalStateException:
too many discounts' — no error code, no field, no actionable message. Users
saw 'Internal Server Error' and called support. The Student Domain Architect
led a 3-week refactoring to standardise exceptions. The new strategy: domain
exceptions (subclassing DomainException) for business rule violations, with an
error code, message, and field. Infrastructure exceptions translated at the
application service boundary (SQLException -> DuplicateEmailException). API
layer catches domain exceptions and returns 400 with a structured error
response. Silent swallowing prohibited — fail loud per P8. This ADR codifies
the exception rules. ArchUnit tests verify that domain exceptions are thrown for
business rule violations and that infrastructure exceptions are translated.
BUSINESS DRIVERS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 234

PreOne ADR - Volume 2: Domain Architecture v3.0
The primary driver is user experience: when a business rule is violated, the user
should see a clear, actionable message ('Cannot add discount: 5 active
discounts already') not a generic 'Internal Server Error'. The secondary driver
is API consumer experience: API clients should receive a structured error
(code, message, field) they can handle programmatically. The tertiary driver is
debuggability: exceptions with clear codes and messages are easier to diagnose
than generic RuntimeExceptions. A fourth driver is fail-loud (P8 in ADR-001):
silent swallowing of exceptions masks bugs and causes data corruption. Every
exception must be either handled (with a specific recovery action) or
propagated (with a clear message). Catch-and-ignore is prohibited. A fifth
driver is consistency: all business rule violations produce domain exceptions,
all infrastructure failures are translated, all API responses are structured —
engineers know what to expect.
PROBLEM STATEMENT
PreOne's exception handling is inconsistent — generic RuntimeExceptions,
silent swallowing, infrastructure exceptions leaking to the API — causing poor
UX, undebuggable errors, and data corruption. We must define exception rules
that standardise on domain exceptions, translate infrastructure exceptions, and
fail loud.
CONSTRAINTS
● Domain exceptions subclass DomainException (with errorCode,
message, field)
● Infrastructure exceptions are translated to domain exceptions at the
app service boundary
● Exceptions are never swallowed silently (fail loud per P8)
● API layer catches domain exceptions and returns 400 with structured
error
● Domain exceptions are thrown for business rule violations (invariants
per ADR-038)
ASSUMPTIONS
● Business rule violations are client errors (400), not server errors (500)
● Infrastructure failures (DB down, network timeout) are server errors
(500), translated to a generic InternalErrorException
● Engineers will learn the domain exception hierarchy (cultural shift from
RuntimeException)
● The structured error response (code, message, field) is sufficient for
API consumers
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 235

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● Exception codes are stable (part of the API contract, versioned per
ADR-092)
OPTIONS CONSIDERED
| Option            | Pros               | Cons                 | Verdict  |
| ----------------- | ------------------ | -------------------- | -------- |
| Domain exception  | Clear UX;          | Exception class      | Chosen   |
| hierarchy with    | structured API     | proliferation (one   |          |
| error codes,      | errors;            | per business rule);  |          |
| translation at    | debuggable; fail-  | engineers must       |          |
| boundary (chosen) | loud; aligns with  | learn hierarchy;     |          |
|                   | DDD and Clean      | translation          |          |
|                   | Architecture.      | boilerplate.         |          |
| Generic           | Simple; no         | No error codes;      | Rejected |
| RuntimeException  | hierarchy;         | generic messages;    |          |
| with messages     | familiar.          | cannot handle        |          |
| (pre-ADR-039      |                    | programmatically;    |          |
| state)            |                    | pre-ADR-039          |          |
state.
| Checked             | Explicit; compiler- | Verbose; try-catch  | Rejected |
| ------------------- | ------------------- | ------------------- | -------- |
| exceptions (forced  | enforced handling.  | everywhere;         |          |
| try-catch)          |                     | pollutes            |          |
signatures; not
idiomatic in
Spring.
| Result<T> monad    | Explicit; no  | Not idiomatic in   | Rejected |
| ------------------ | ------------- | ------------------ | -------- |
| (no exceptions,    | exceptions;   | Java/Spring;       |          |
| return             | functional;   | requires Result-   |          |
| Result.success or  | composable.   | handling           |          |
| Result.failure)    |               | everywhere; loses  |          |
stack traces;
cultural shift.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  236

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following exception rules: (1) Domain exceptions subclass
DomainException, which has: errorCode (String, stable, part of API
contract), message (String, human-readable), field (String, optional, the
offending field), and cause (Throwable, optional). (2) Each business rule
violation has a specific domain exception (e.g.,
TooManyActiveDiscountsException,
CannotCancelConfirmedEnrollmentException) — one exception class per
invariant (per ADR-038). (3) Infrastructure exceptions (SQLException,
HttpClientException, JsonProcessingException) are translated to domain
exceptions at the application service boundary — e.g., SQLException
(unique constraint violation) -> DuplicateEmailException. (4) Exceptions
are never swallowed silently — catch blocks must either handle (with a
specific recovery action) or re-throw; catch-and-log-only is prohibited by
ArchUnit. (5) The API layer (@RestControllerAdvice) catches domain
exceptions and returns 400 with a structured error: {"code":
"TOO_MANY_ACTIVE_DISCOUNTS", "message": "...", "field":
"discountId"}. (6) Infrastructure failures (DB down, network timeout) are
translated to InternalErrorException (500) — these are server errors, not
client errors. (7) Exception codes are stable and versioned (per ADR-092
API Versioning) — removing or renaming a code requires a deprecation
period. (8) ArchUnit verifies that no @RestController or @Service throws
RuntimeException directly (must throw DomainException or a subclass).
DETAILED RATIONALE
The chosen option is the only one that produces clear UX, structured API
errors, and debuggability. Generic RuntimeException (option 2) was the pre-
ADR-039 state and produced the 'Internal Server Error' for business rule
violations. Checked exceptions (option 3) pollute method signatures and are not
idiomatic in Spring (Spring's @Transactional rolls back on unchecked
exceptions). Result<T> monad (option 4) is not idiomatic in Java and requires a
cultural shift that is not justified. Rule (1) — DomainException base class —
provides a consistent structure. Every domain exception has an errorCode (a
stable string like 'TOO_MANY_ACTIVE_DISCOUNTS' that API clients can
handle programmatically), a message (human-readable, with context like the
enrollment ID and current discount count), and optionally a field (the offending
field, for field-level UI feedback). The cause is the original exception (for
infrastructure translations). DomainException is in the preone-domain library.
Rule (2) — one exception per invariant — produces a specific, named exception
for each business rule violation. TooManyActiveDiscountsException is more
readable than DomainException('max discounts exceeded'). The exception
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 237

PreOne ADR - Volume 2: Domain Architecture v3.0
class name documents the invariant. With 47 invariants (per ADR-038), there
are 47 exception classes — this is intentional, not proliferation. Each class is
small (<20 lines) and lives in the domain layer with its invariant. Rule (3) —
infrastructure translation — at the application service boundary keeps the
domain layer pure. The domain layer does not know about SQLException or
HttpClientException — it only knows domain exceptions. The application
service catches infrastructure exceptions and translates them: a unique
constraint violation on the email column becomes DuplicateEmailException (a
domain exception); an HTTP timeout calling the payment gateway becomes
PaymentGatewayUnavailableException (a domain exception). The translation
is in the application service, not the domain service or aggregate. Rule (4) — no
silent swallowing — enforces fail-loud (P8). A catch block that only logs (catch
(e) { log.error(e); }) is prohibited by ArchUnit — it must either handle (with a
specific recovery action, like retry or fallback) or re-throw. Silent swallowing
masks bugs (the system appears to work but is in an inconsistent state) and
causes data corruption (the exception indicated a problem that was ignored).
Fail-loud ensures problems are visible. Rule (5) — API layer catches domain
exceptions — via @RestControllerAdvice (Spring's global exception handler).
The handler catches DomainException and returns 400 Bad Request with a
structured JSON error: {"code": "TOO_MANY_ACTIVE_DISCOUNTS",
"message": "Cannot add discount: enrollment E001 already has 5 active
discounts (limit: 5)", "field": "discountId", "timestamp": "2026-07-
13T10:30:00Z"}. The handler also catches InternalErrorException
(infrastructure failure) and returns 500 with a generic message (no stack trace
leaked to the client). The handler catches IllegalArgumentException
(programming error) and returns 500. Rule (6) — infrastructure failures as 500
— distinguishes client errors (business rule violations, 400) from server errors
(infrastructure failures, 500). A DB-down error is not the client's fault — they
should not receive 400. The InternalErrorException has a generic message
('Internal server error, please try again') and logs the full stack trace server-
side for debugging. The client may retry (the failure may be transient). Rule (7)
— stable exception codes — are part of the API contract. API clients may handle
'TOO_MANY_ACTIVE_DISCOUNTS' programmatically (e.g., show a specific UI
message). Changing the code (e.g., to 'MAX_DISCOUNTS_EXCEEDED') breaks
clients — it requires a deprecation period (per ADR-092) during which both
codes are returned (old code as an alias). Removing a code (because the
invariant is removed) also requires a deprecation period. Codes are
documented in the API specification. Rule (8) — ArchUnit verifies no
RuntimeException — in @RestController or @Service. Engineers must throw
DomainException (or a subclass) for business rule violations, not
RuntimeException. This forces the use of the domain exception hierarchy.
RuntimeException is allowed in infrastructure layer (e.g., a repository impl may
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 238

PreOne ADR - Volume 2: Domain Architecture v3.0
throw RuntimeException for unexpected database errors, which the app
service translates). Programming errors (NullPointerException,
IllegalArgumentException) are not caught by ArchUnit — they indicate bugs
and should propagate as 500 errors (after logging).
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Domain Exception
Hierarchy | | | | Domain
Layer | | +----------------------------------------------------------
+ | | | DomainException (base, abstract) | | | | - errorCode:
String (stable, part of API contract) | | | | - message: String (human-
readable, with context) | | | | - field: String (optional, offending field)
| | | | - cause: Throwable (optional, for infrastructure trans) | | |
+----------------------------------------------------------+ | | ^
| | | extends | | +----------+----------+----------
+----------+ | | | | | | | | | | TooMany |
Cannot | Duplicate | Payment | ... (47 classes) | | | Active | Cancel | Email
| Gateway | | | | Discounts| Confirmed | Exception | Unavail |
| | | Exception| Enroll Exc| | Exception| | | +----------+----------
+----------+----------+ | | | |
Application Layer (translation) | |
+----------------------------------------------------------+ | | | AppService.confirm(cmd) {
| | | | try { | | | | enrollment.confirm();
| | | | } catch (SQLException e) { | | | | if
(isUniqueViolation(e)) { | | | | throw new
DuplicateEnrollmentException(e); | | | | }
| | | | throw new InternalErrorException(e); | | | | }
| | | | } | | |
+----------------------------------------------------------+ | |
| | API Layer (catch and respond) | |
+----------------------------------------------------------+ | | | @RestControllerAdvice
| | | | @ExceptionHandler(DomainException.class) | | | |
ResponseEntity(400, {code, message, field}) | | | |
| | | | @ExceptionHandler(InternalErrorException.class) | | | |
ResponseEntity(500, {code: "INTERNAL_ERROR", | | | | message:
"Internal server error"}) | | |
+----------------------------------------------------------+ | |
| | ArchUnit: | | - @Service/@RestController:
no throw RuntimeException | | - No catch-and-log-only (must handle or re-
throw) | +------------------------------------------------------------------+
SEQUENCE DIAGRAM
Aggregate App Service API Layer Client | |
| | |--addDiscount() | | | | (invariant |
| | | violated) | | | |--throw TooMany--|
| | | ActiveDiscounts | | | | Exception |
| | | | | | | | (no catch —
propagate) | | |--throw------------>| | | |
| | | | | @RestCtrlAdvice| | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 239

PreOne ADR - Volume 2: Domain Architecture v3.0
| catches Domain | | | | Exception | | |
| | | | |--400 Bad Request| | |
| {code: "TOO_MANY| | | | ACTIVE_DISCOUNTS",
message:..., | | | field: "discountId"}| | |
| | | | |<--(client handles error)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Exception Components
| | | | Domain Exception Hierarchy (preone-
domain) | | +---------------------+ +---------------------+ | | |
DomainException | | TooManyActive | | | | (abstract base) |<--|
DiscountsException | | | | - errorCode | +---------------------+ | | | -
message | | | | - field | +---------------------+
| | | - cause | | CannotCancel | | | +---------+-----------+<--|
ConfirmedEnrollment | | | ^ | Exception | | |
| +---------------------+ | | +---------+-----------+ | | |
InternalError | +---------------------+ | | | Exception |<--|
DuplicateEmail | | | | (infrastructure) | | Exception | | |
+---------------------+ +---------------------+ | |
| | Application Service (translation) | | +---------------------+
| | | EnrollmentAppSvc | try { | | | @Service |
enrollment.confirm(); | | | @Transactional | } catch (SQLException e) {
| | | | if (isUniqueViolation(e)) | | | + confirm(cmd) |
throw new DuplicateExc(e); | | | + cancel(cmd) | throw new
InternalErrorExc(e); | | | | } | | +---------------------
+ | | | | API Layer
(global exception handler) | | +---------------------+ +---------------------+
| | | GlobalException | | ErrorResponse | | | | Handler |-->|
(DTO) | | | | @RestControllerAdv | | - code | | | | +
handleDomainExc() | | - message | | | | + handleInternal() | | - field
| | | | + handleIllegalArg()| | - timestamp | | | +---------------------+
+---------------------+ | | | | ArchUnit
Enforcement | | +---------------------+ |
| | Rules | - @Service: no throw RuntimeException | | | | -
No catch-and-log-only (must handle or re-throw) | | | | -
@RestControllerAdvice: handles DomainException | | +---------------------+
| +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Business Rule Violation (e.g., add 6th discount) | v +----+-----+ |
Aggregate| Enrollment.addDiscount() | Root | --invariant check fails |
| --throw TooManyActiveDiscountsException +----+-----+ | v
(propagate, no catch in domain) +----+-----+ | Domain | (no catch — pure
domain, no try-catch) | Service | +----+-----+ | v (propagate, app
service may translate infra exceptions) +----+-----+ | App Svc | (no catch for
domain exceptions; catch for infra) | | --domain exception propagates as-is
| | --infra exception (if any) translated to domain +----+-----+ | v
(propagate to API layer) +----+-----+ | API Layer| @RestControllerAdvice
catches DomainException | | --returns 400 with ErrorResponse | |
{code, message, field, timestamp} +----+-----+ | v +----+-----+ | Client
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 240

PreOne ADR - Volume 2: Domain Architecture v3.0
| --receives 400 with structured error | | --handles programmatically (by
code) +----------+ Infrastructure Failure (e.g., DB down) | v +----+-----
+ | Infra | --SQLException (connection refused) | Layer | +----+-----+ |
v (propagate) +----+-----+ | App Svc | --catch SQLException | | --
translate to InternalErrorException | | --log full stack trace server-side
+----+-----+ | v +----+-----+ | API Layer| @RestControllerAdvice
catches InternalErrorException | | --returns 500 with generic message |
| {code: "INTERNAL_ERROR", message: "Internal server error"} +----+-----+
DATABASE IMPACT
Domain exceptions do not directly affect the database — they are application-
layer errors. However, exceptions affect transactions: per Spring's
@Transactional, an uncaught exception (checked or unchecked) triggers a
rollback. Domain exceptions (subclassing RuntimeException) trigger rollback,
ensuring the database is not modified on business rule violations. The
application service method's @Transactional rolls back, undoing any changes
made before the exception. This is the desired behaviour — a business rule
violation should not partially modify the database. ArchUnit verifies that
domain exceptions are unchecked (subclass RuntimeException, not Exception),
ensuring rollback behaviour.
API IMPACT
Domain exceptions directly affect API responses. The @RestControllerAdvice
catches DomainException and returns 400 with a structured error. The error
code (e.g., 'TOO_MANY_ACTIVE_DISCOUNTS') is part of the API contract —
clients handle it programmatically. API documentation lists all possible error
codes per endpoint. Error codes are stable (per rule 7) — changes require
versioning. The 400 status distinguishes business rule violations (client error)
from infrastructure failures (500, server error). This distinction is critical for
API consumers — 400 means 'fix your request', 500 means 'try again or contact
support'.
UI IMPACT
Domain exceptions affect UI feedback. The UI receives the structured error
(code, message, field) and displays it to the user. Field-level errors (e.g.,
'discountId' field) are shown next to the relevant input. Code-level errors (e.g.,
'TOO_MANY_ACTIVE_DISCOUNTS') may trigger specific UI behaviour (e.g.,
disable the 'Add Discount' button). The UI may also proactively check invariants
(defense-in-depth per ADR-038) to avoid the server round-trip. The UI should
never display raw exception stack traces — only the structured error message.
SECURITY IMPACT
Domain exceptions improve security by preventing silent failures (fail-loud per
P8). A catch-and-ignore of an authentication exception could allow
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 241

PreOne ADR - Volume 2: Domain Architecture v3.0
unauthorised access; the no-silent-swallowing rule (rule 4) prevents this. The
structured error response does not leak internal details (no stack traces, no
SQL errors) — the message is controlled by the domain exception, not the
infrastructure. The 500 response for infrastructure failures has a generic
message (no DB connection string, no internal hostnames), preventing
information leakage. The error code is stable and non-sensitive (e.g.,
'TOO_MANY_ACTIVE_DISCOUNTS' does not reveal system internals).
PERFORMANCE IMPACT
Domain exceptions have a performance cost — throwing and catching
exceptions is expensive in Java (stack trace construction). For high-frequency
operations (>10,000 TPS), this cost is measurable (~0.1ms per exception).
However, business rule violations should be rare (<0.1% of operations), so the
total cost is negligible. For expected violations (e.g., a validation failure on user
input), the UI should pre-check (defense-in-depth) to avoid the server round-
trip. Exceptions are for unexpected violations, not for normal control flow.
SCALABILITY ANALYSIS
Domain exceptions scale linearly — they are per-request, stateless. The
exception hierarchy is in memory (class metadata), no runtime cost. The
@RestControllerAdvice is a single global handler, no scalability concern. The
performance cost (stack trace construction) is negligible at PreOne's scale. The
pattern does not introduce scalability bottlenecks; it improves scalability by
preventing invalid states that could cause cascading failures.
OPERATIONAL CONSIDERATIONS
Exception operations are observable via: exception.thrown.count (per
exception class), exception.thrown.endpoint (per API endpoint),
exception.thrown.field (per field, for UX improvement). High exception rates on
an endpoint indicate either API misuse (clients sending invalid input) or a UX
issue (UI not guiding users). The quarterly architecture scorecard audits: (a)
exception rate per endpoint (target: <1%; higher indicates UX or bug), (b) 500
error rate (target: <0.01%; higher indicates infrastructure issues), (c) ArchUnit
violation count (target: zero — no RuntimeException in services, no catch-and-
log-only).
RISKS
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 242

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Risk              | Likelihood | Impact | Mitigation        |
| ----------------- | ---------- | ------ | ----------------- |
| Engineers throw   | Medium     | Medium | ArchUnit blocks   |
| RuntimeException  |            |        | RuntimeException  |
| instead of        |            |        | in                |
| DomainException   |            |        | @Service/@RestC   |
ontroller; code
review; training
| Exception class     | High | Low | Accept the        |
| ------------------- | ---- | --- | ----------------- |
| proliferation (47+  |      |     | proliferation as  |
| classes)            |      |     | the cost of       |
specificity; each
class is <20 lines;
package by
domain
| Error codes       | Low | High | Codes are stable   |
| ----------------- | --- | ---- | ------------------ |
| change, breaking  |     |      | (rule 7); changes  |
| API clients       |     |      | require            |
deprecation
period; versioned
per ADR-092
| Exceptions used   | Low | Low | Code review; UI  |
| ----------------- | --- | --- | ---------------- |
| for control flow  |     |     | pre-checks for   |
| (performance      |     |     | expected         |
| impact)           |     |     | violations;      |
exceptions for
unexpected
violations only
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Clear UX (structured error messages) Exception class proliferation (one per
invariant)
Debuggable (error codes, context) Engineers must learn the hierarchy
Fail-loud (no silent swallowing) Catch-and-log-only prohibited
(engineers must handle or re-throw)
Consistent (all business rules produce  Translation boilerplate at app service
| domain exceptions) |     | boundary |     |
| ------------------ | --- | -------- | --- |
REJECTED ALTERNATIVES
Generic RuntimeException (option 2) was the pre-ADR-039 state. Three issues:
(1) the 'max 5 discounts' violation produced 'java.lang.IllegalStateException:
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  243

PreOne ADR - Volume 2: Domain Architecture v3.0
too many discounts' with no error code, no field, no actionable message — users
saw 'Internal Server Error' and called support; (2) API clients could not handle
errors programmatically (no code to switch on); (3) debuggability was poor
(generic messages, no context). Checked exceptions (option 3) were
prototyped: every method signature had 'throws DomainException', and every
caller needed try-catch or throws — verbose and not idiomatic in Spring
(Spring's @Transactional rolls back on unchecked only). Result<T> monad
(option 4) was prototyped: methods returned Result<Student> instead of
Student, with Result.success(student) or Result.failure(error). The prototype
required Result-handling everywhere (map, flatMap, getOrThrow), lost stack
traces, and was a cultural shift that the team rejected as not idiomatic Java.
MIGRATION PLAN
Phase 1 (complete): Create DomainException base class and 47 specific
exceptions. Phase 2 (complete): Replace RuntimeException throws with
domain exceptions. Phase 3 (complete): Add translation at app service
boundary (23 translations). Phase 4 (complete): Implement
@RestControllerAdvice global handler. Phase 5 (complete): ArchUnit rules
enforced in CI. Phase 6 (Q4 2026): Training session for new engineers.
TESTING STRATEGY
Exception testing has three levels. Unit tests: each domain exception is tested
— verify it is thrown on the correct condition, has the correct errorCode,
message, and field. Integration tests: exceptions are tested end-to-end via the
API — verify 400 response with structured error. ArchUnit tests: structural
rules (no RuntimeException in services/controllers, no catch-and-log-only)
verified at compile time. Translation tests: each infrastructure-to-domain
translation is tested (e.g., SQLException with unique violation ->
DuplicateEmailException).
MONITORING & OBSERVABILITY
Exception metrics: exception.thrown.count (per class, per endpoint),
exception.thrown.field (per field), exception.500.count (infrastructure
failures), exception.translation.count (infra-to-domain translations).
Dashboards in Grafana: exception rate per endpoint, top exceptions by code,
500 error rate. Alerts: exception rate >1% per endpoint, 500 error rate
>0.01%, ArchUnit violation count >0.
FUTURE EVOLUTION
Two evolutions are possible. First, Java 21 pattern matching for switch may
simplify exception handling (switch on exception type with patterns). Second,
the exception hierarchy may adopt sealed interfaces (Java 17+) for exhaustive
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 244

PreOne ADR - Volume 2: Domain Architecture v3.0
catch — but the current class hierarchy is sufficient. The exception strategy
itself is stable; domain exceptions with error codes is a long-standing pattern.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P8 Fail Loud drives no
silent swallowing)
● ADR-003 — Clean Architecture (domain exceptions in domain layer,
translation at boundary)
● ADR-004 — Domain Driven Design (domain exceptions are a DDD
concept)
● ADR-022 — Aggregate Rules (invariant violations throw domain
exceptions)
● ADR-024 — Value Objects (value object constructor validation throws
domain exceptions)
● ADR-029 — Validation (validation failures throw domain exceptions)
● ADR-032 — Unit of Work (domain exceptions trigger transaction
rollback)
● ADR-038 — Domain Invariants (invariant violations throw domain
exceptions)
● ADR-092 — API Versioning (error codes are versioned)
REFERENCES
● Upstream DDD: DDD-002 (Tactical Building Blocks — domain
exceptions)
● Upstream PRD: PRD-002-section-11 (Student error handling
requirements)
● Downstream ERD: ERD-001 (Student schema constraints that trigger
exceptions)
● Downstream API Spec: API-001 (Student API error codes and
responses)
● Downstream Test Cases: TC-0061 (Domain exception, translation, API
handler tests)
● External: Eric Evans — Domain-Driven Design (Domain Exceptions)
● External: Spring @RestControllerAdvice Documentation
(implementation reference)
DECISION HISTORY
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 245

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2026-01-17 | Draft  | Student Domain  | Initial draft with 4  |
|            |        | Architect       | options; domain       |
exception
hierarchy chosen
| 2026-02-19 | Proposed | Student Domain  | Submitted to ARB  |
| ---------- | -------- | --------------- | ----------------- |
|            |          | Architect       | after exception   |
audit
| 2026-03-18 | Accepted | ARB Chair | ARB approved; 47  |
| ---------- | -------- | --------- | ----------------- |
exception classes
created
| 2026-08-21 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR)     |     |
| ----------- | --- | ------------------------ | --- |
| Tech Lead   |     | Student Domain Architect |     |
| ARB Chair   |     | ARB Chair                |     |
| Approved On |     | 2026-08-21               |     |
IMPLEMENTATION CHECKLIST
● Create DomainException base class (Done — preone-domain v1.3.0)
● Create 47 specific domain exceptions (Done — PR #5801)
● Replace RuntimeException throws with domain exceptions (Done — 87
throws replaced)
● Add 23 infrastructure-to-domain translations (Done — PR #5815)
● Implement @RestControllerAdvice global handler (Done — preone-api-
errors v1.1.0)
● ArchUnit rules: no RuntimeException, no catch-and-log-only (Done —
CI gate since V2.1.0)
● Exception testing (Done — 47 exception classes, 187 test cases)
● Training session for engineers (Done — 4 sessions delivered)
AD R -040
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  246

PreOne ADR - Volume 2: Domain Architecture v3.0
Domain Versioning
Volume 2 — Domain Architecture - Versioning
ACCEPTED
DECISION SUMMARY
DECISION
Define the versioning strategy for domain artifacts: aggregates, events,
DTOs, and workflow definitions. Domain artifacts are versioned
semantically (MAJOR.MINOR.PATCH). Backward-compatible changes (add
field, add state) are minor version bumps. Breaking changes (remove field,
change type) are major version bumps requiring a deprecation period. The
platform supports N and N-1 versions simultaneously during deprecation.
Versioning enables evolution without breaking consumers.
STATUS
Status Accepted
Date Decided 2026-03-25
Decision Owner Chief Architect
Review Cadence Annual or on versioning strategy
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment)
CONTEXT
Before ADR-040, PreOne's domain artifacts were unversioned. When the
Student aggregate added a 'guardianEmail' field, the API response included the
new field, breaking an older mobile app that did not expect it (JSON parsing
failed). When the EnrollmentConfirmed event added a 'branchName' field, a
consumer that deserialised the event into a strict DTO failed. When the
admission workflow added a 'scholarship approval' state, in-flight workflows
(started before the change) could not transition correctly. Each change caused
production incidents. The Chief Architect led a 4-week design of a versioning
strategy. The new approach: every domain artifact (aggregate, event, DTO,
workflow) has a version (MAJOR.MINOR.PATCH). Backward-compatible
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 247

PreOne ADR - Volume 2: Domain Architecture v3.0
changes (add field, add state) bump the minor version. Breaking changes
(remove field, change type) bump the major version and require a deprecation
period (minimum 2 release cycles) during which both versions are supported.
The platform supports N and N-1 simultaneously. This ADR codifies the
versioning rules. ArchUnit tests verify that artifacts have version metadata and
that breaking changes follow the deprecation process.
BUSINESS DRIVERS
The primary driver is evolution: the domain model must evolve (add fields, add
states, change behaviour) without breaking existing consumers. Versioning
enables evolution by making changes explicit and controlled. The secondary
driver is compatibility: older clients (mobile apps, integration partners) should
continue to work when the domain evolves, at least during a deprecation
period. The tertiary driver is rollback: if a new version has a bug, the platform
can roll back to the previous version without losing data (both versions are
supported). A fourth driver is auditability: version metadata in events and
aggregates provides a forensic trail (e.g., 'this event was v1.2, produced by
aggregate v3.1'). A fifth driver is communication: semantic versioning
(MAJOR.MINOR.PATCH) communicates the nature of a change — consumers
know that a minor bump is safe to consume, a major bump requires migration.
PROBLEM STATEMENT
PreOne's domain artifacts are unversioned, causing breaking changes to
consumers (mobile apps, event subscribers, integration partners) and
production incidents. We must define a versioning strategy that enables
evolution with controlled deprecation.
CONSTRAINTS
● Every domain artifact has a version (MAJOR.MINOR.PATCH, semantic
versioning)
● Backward-compatible changes: minor version bump (add field, add
state)
● Breaking changes: major version bump (remove field, change type),
require deprecation period
● Deprecation period: minimum 2 release cycles (8 weeks), both versions
supported
● Version metadata is persisted with the artifact (event version,
aggregate version, workflow version)
ASSUMPTIONS
● Semantic versioning (MAJOR.MINOR.PATCH) is sufficient for domain
artifacts
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 248

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● 2 release cycles (8 weeks) is sufficient for consumers to migrate
● Supporting N and N-1 simultaneously is feasible (no N-2 support)
● Version metadata in persisted artifacts enables correct handling of old
data
● Consumers (mobile apps, integration partners) can be notified of
deprecation
OPTIONS CONSIDERED
| Option             | Pros               | Cons              | Verdict  |
| ------------------ | ------------------ | ----------------- | -------- |
| Semantic           | Controlled         | Complexity        | Chosen   |
| versioning with    | evolution;         | (support 2        |          |
| deprecation        | consumer           | versions);        |          |
| period, N and N-1  | compatibility;     | deprecation       |          |
| support (chosen)   | rollback support;  | period overhead;  |          |
|                    | auditable;         | version metadata  |          |
|                    | industry standard. | in payloads.      |          |
| No versioning      | Simple; no         | Breaking changes  | Rejected |
| (pre-ADR-040       | overhead; no       | break consumers;  |          |
| state)             | metadata.          | no rollback;      |          |
production
incidents; pre-
ADR-040 state.
| Date-based         | Chronological; no  | Does not        | Rejected |
| ------------------ | ------------------ | --------------- | -------- |
| versioning (e.g.,  | semantic           | communicate     |          |
| 2026-03-25)        | meaning.           | change nature;  |          |
consumers cannot
assess impact; not
industry standard
for domain
artifacts.
| Single version per  | Simple; no     | Breaking changes  | Rejected |
| ------------------- | -------------- | ----------------- | -------- |
| artifact (always    | compatibility  | break consumers   |          |
| latest)             | burden.        | immediately; no   |          |
rollback; not
feasible for a
platform with
external
consumers.
DECISION
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  249

PreOne ADR - Volume 2: Domain Architecture v3.0
ADOPTED
Adopt the following domain versioning rules: (1) Every domain artifact
(aggregate, event, DTO, workflow definition) has a version in
MAJOR.MINOR.PATCH format (semantic versioning). (2) Backward-
compatible changes (add optional field, add event state, add workflow state)
bump the MINOR version — consumers of the previous version continue to
work. (3) Breaking changes (remove field, change field type, change event
semantics, remove state) bump the MAJOR version and require a
deprecation period (minimum 8 weeks, 2 release cycles). (4) During the
deprecation period, both N (new) and N-1 (previous) versions are supported
simultaneously — events are published in both versions, API responses
include both versions (via content negotiation), workflows run with their
original version. (5) Version metadata is persisted with the artifact: events
have eventVersion, aggregates have aggregateVersion (separate from
optimistic lock version), workflow instances have definitionVersion. (6)
PATCH version bumps are for bug fixes that do not change the artifact's
interface (internal implementation changes). (7) Deprecation is
communicated via API response headers (Deprecation, Sunset), release
notes, and direct notification to known consumers. (8) ArchUnit verifies that
artifacts have version metadata and that breaking changes are documented
in a migration guide.
DETAILED RATIONALE
The chosen option is the only one that enables controlled evolution. No
versioning (option 2) was the pre-ADR-040 state and caused the production
incidents that motivated this ADR. Date-based versioning (option 3) does not
communicate the nature of a change — a consumer seeing 'event version 2026-
03-25' cannot assess whether the change is safe (minor) or requires migration
(major). Single version (option 4) is not feasible for a platform with external
consumers (mobile apps, integration partners) that cannot be forced to
upgrade immediately. Rule (1) — semantic versioning — is the industry
standard. MAJOR version bumps indicate breaking changes (consumers must
migrate); MINOR version bumps indicate backward-compatible additions
(consumers may ignore); PATCH version bumps indicate bug fixes (no interface
change). This convention communicates the nature of a change at a glance,
enabling consumers to assess impact quickly. Rule (2) — backward-compatible
changes are minor — means adding an optional field to an event (e.g.,
EnrollmentConfirmedV1.2 adds optional 'guardianEmail') does not break
consumers. A consumer expecting V1.1 ignores the new field; a consumer that
wants the field can access it. This enables additive evolution — the most
common type of change — without disruption. Rule (3) — breaking changes are
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 250

PreOne ADR - Volume 2: Domain Architecture v3.0
major with deprecation — means removing a field (e.g.,
EnrollmentConfirmedV2.0 removes 'studentName', replaced by 'studentId') is a
major version bump. Consumers using 'studentName' must migrate to
'studentId' (fetching the name via a separate API call). The deprecation period
(8 weeks) gives consumers time to migrate. During the deprecation period,
both V1.x (with 'studentName') and V2.x (without) are published — consumers
choose which to consume. Rule (4) — N and N-1 support — is the
implementation of the deprecation period. For events, the publisher publishes
both versions (V1.x and V2.x) to the event bus; consumers subscribe to the
version they support. For API responses, the server supports content
negotiation (Accept: application/vnd.preone.enrollment.v1+json vs. v2+json);
the client requests the version it supports. For workflows, in-flight workflows
continue with their original definition version; new workflows use the latest
version. After the deprecation period, N-1 is removed (only N is supported).
Rule (5) — version metadata persisted — enables correct handling of old data.
An event in the event store has eventVersion=1.2; a consumer reading the
event knows to handle V1.2 fields. An aggregate loaded from the database has
aggregateVersion=3.1; the repository knows to map V3.1 fields. A workflow
instance has definitionVersion=1.2; the workflow engine knows to use the V1.2
definition. Without persisted versions, old data would be misinterpreted by new
code, causing data corruption. Rule (6) — PATCH for bug fixes — covers
changes that do not affect the artifact's interface. For example, fixing a bug in
the event publisher's serialisation (no field change) is a PATCH bump (1.2.0 ->
1.2.1). Consumers are unaffected. PATCH bumps are informational (no
migration required). Rule (7) — deprecation communication — ensures
consumers know about upcoming breaking changes. API responses include
'Deprecation: true' and 'Sunset: <date>' headers when the client requests a
deprecated version. Release notes describe the breaking change and the
migration path. Known consumers (registered integration partners) are
emailed directly. The deprecation period is 8 weeks minimum — consumers
have time to migrate. Rule (8) — ArchUnit verification — enforces version
metadata. Every @AggregateRoot class has a @Version annotation. Every
DomainEvent subclass has an eventVersion field. Every workflow YAML has a
version field. Every DTO has an @ApiVersion annotation. Breaking changes
(detected by a diff tool) require a migration guide (docs/migrations/<artifact>-
vN-to-vN+1.md) — ArchUnit verifies the guide exists for major version bumps.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | Domain Versioning
Strategy | | | | Semantic
Versioning (MAJOR.MINOR.PATCH) | |
+----------------------------------------------------------+ | | | MAJOR: breaking change
(remove field, change type) | | | | e.g., EnrollmentConfirmed 1.x -> 2.0
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 251

PreOne ADR - Volume 2: Domain Architecture v3.0
(removed studentName) | | | requires deprecation period (8 weeks)
| | | | | | | | MINOR: backward-
compatible (add optional field, add state)| | | | e.g., EnrollmentConfirmed 1.1
-> 1.2 (added guardianEmail) | | | consumers of 1.1 continue to work
| | | | | | | | PATCH: bug fix (no interface
change) | | | | e.g., EnrollmentConfirmed 1.2.0 -> 1.2.1
(serialisation fix) | | | | consumers unaffected | | |
+----------------------------------------------------------+ | |
| | Artifact Versions | |
+----------------------------------------------------------+ | | | Aggregate: @Version on
@AggregateRoot class | | | | Enrollment @Version("3.1")
| | | | | | | | Event: eventVersion field in
DomainEvent | | | | EnrollmentConfirmed eventVersion = 1.2
| | | | | | | | DTO: @ApiVersion on
request/response DTO | | | | CreateStudentResponse
@ApiVersion("2.0") | | | | | | | |
Workflow: version field in YAML | | | | admission.yml version:
1.2 | | | +----------------------------------------------------------+ | |
| | Deprecation Period (MAJOR bumps) | |
+----------------------------------------------------------+ | | | Week 0: V2.0 released, V1.x
deprecated | | | | - V1.x responses include 'Deprecation: true'
header | | | | - V1.x responses include 'Sunset: <date>' header | | | |
- Release notes describe migration path | | | | - Known consumers
emailed | | | | | | | |
Weeks 0-8: both V1.x and V2.0 supported | | | | - events published
in both versions | | | | - API supports content negotiation (v1, v2)
| | | | - in-flight workflows continue with V1.x | | | |
| | | | Week 8: V1.x removed (only V2.0 supported) | | | | - V1.x
requests return 410 Gone | | | | - V1.x events no longer
published | | | +----------------------------------------------------------+ | |
| | Content Negotiation (API) | |
+----------------------------------------------------------+ | | | GET /students/123
| | | | Accept: application/vnd.preone.student.v1+json | | | | -> returns
V1.x response (deprecated, headers set) | | | |
| | | | Accept: application/vnd.preone.student.v2+json | | | | -> returns
V2.0 response (current) | | |
+----------------------------------------------------------+ |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Producer (Publisher) Event Bus Consumer A (v1) Consumer B (v2) |
| | | | (V1.x event published, backward compatible
change) | |--publish V1.2-------->| | | |
EnrollmentConfirmed | | | | (v1.2, adds |
| | | guardianEmail) | | | |
| | | | |--deliver---------->| | |
| v1.2 event | | | | |--deserialise v1.1
| | | | (ignores new field)| | |
|--process OK | | | | | |
|--deliver------------------------------->| | | v1.2 event | |
| | | |--deserialise v1.2 | |
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 252

PreOne ADR - Volume 2: Domain Architecture v3.0
| | (uses new field) | | | |--
process OK | | | | | (V2.0 event
published, breaking change, deprecation period) | |--publish V1.x-------->|
| | | (still publishing | | | | V1.x for
| | | | deprecation) | | |
| |--deliver---------->| | | | |--
process V1.x OK | | | | | |--publish
V2.0-------->| | | | EnrollmentConfirmed | |
| | (v2.0, removed | | | | studentName) |
| | | | | | | |
| (Consumer A does NOT receive V2.0 | | | during
deprecation — it subscribed to V1.x) | | |
| | |--deliver------------------------------->| | |
| |--process V2.0 OK | | | |
| (after deprecation period: V1.x removed) | |--publish V2.0
only--->| | | | |--deliver---------->|
| | | | (Consumer A fails — | |
| must migrate to V2.0) | | | |
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | Versioning Components
| | | | Versioned Artifacts
| | +---------------------+ +---------------------+ | | | @AggregateRoot | |
DomainEvent | | | | @Version("3.1") | | - eventVersion: 1.2 |
| | | class Enrollment | | - payload: ... | | | +---------------------+
+---------------------+ | | | |
+---------------------+ +---------------------+ | | | CreateStudentDTO | |
admission.yml | | | | @ApiVersion("2.0") | | version: 1.2 | | |
| - name, email, dob | | states: ... | | | +---------------------+
+---------------------+ | | | | Content
Negotiation (API) | | +---------------------+
| | | Accept header | application/vnd.preone.student.v1+json | | | (Spring
MVC) | application/vnd.preone.student.v2+json | | +---------------------+
| | | | Deprecation Headers
| | +---------------------+ | | | Response headers |
Deprecation: true | | | (for deprecated v) | Sunset: Sat, 25 May 2026
00:00:00 GMT | | +---------------------+ | |
| | Migration Guide | | +---------------------+
| | | docs/migrations/ | enrollment-v1-to-v2.md | | | (per major bump)
| - removed: studentName | | | | - added: studentId (fetch
name | | | | via GET /students/{id}) | | +---------------------+
| | | | ArchUnit Verification
| | +---------------------+ | | | Rules | -
@AggregateRoot has @Version | | | | - DomainEvent has
eventVersion | | | | - DTOs have @ApiVersion | | |
| - Major bumps have migration guide| | +---------------------+
| +-------------------------------------------------------------+
DATA FLOW DIAGRAM
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 253

PreOne ADR - Volume 2: Domain Architecture v3.0
Backward-Compatible Change (MINOR bump, e.g., 1.1 -> 1.2) | v +----
+-----+ | Producer | --publish V1.2 event (adds optional field) +----+-----+ |
v +----+-----+ | Event Bus| --delivers V1.2 to all consumers +----+-----+ |
+--Consumer A (V1.1): deserialises, ignores new field, processes OK |
+--Consumer B (V1.2): deserialises, uses new field, processes OK | v (no
disruption) Breaking Change (MAJOR bump, e.g., 1.x -> 2.0) | v +----
+-----+ | Producer | --publish V1.x (deprecated) AND V2.0 (current) +----+-----+
| v (deprecation period: 8 weeks) +----+-----+ | Event Bus| --delivers V1.x
to Consumer A | | --delivers V2.0 to Consumer B +----+-----+ |
+--Consumer A (V1.x): processes V1.x, receives deprecation notice | --
migrates to V2.0 during deprecation period | +--Consumer B (V2.0):
processes V2.0 | v (after deprecation period) +----+-----+ | Producer |
--publish V2.0 only +----+-----+ | v +----+-----+ | Event Bus| --delivers
V2.0 to all consumers +----+-----+ | +--Consumer A (now V2.0):
processes V2.0 | +--Consumer B (V2.0): processes V2.0 | v (no
disruption, all migrated) API Content Negotiation | v +----+-----+ |
Client | GET /students/123 | | Accept:
application/vnd.preone.student.v1+json +----+-----+ | v +----+-----+ |
API | --returns V1.x response | | --headers: Deprecation: true, Sunset:
<date> +----+-----+ | v +----+-----+ | Client | --receives V1.x, sees
deprecation headers | | --migrates to V2.0 (changes Accept header)
+----------+
DATABASE IMPACT
Versioning adds version metadata to persisted artifacts. Aggregates have an
aggregateVersion column (text, e.g., '3.1') in their root table. Events in the
outbox have an eventVersion column (integer, e.g., 2). Workflow instances have
a definitionVersion column (text, e.g., '1.2'). These columns are added by
Flyway migrations. Old rows (pre-versioning) have version '1.0' (default). The
version metadata is read when loading artifacts, enabling the repository or
event handler to handle the correct version. ArchUnit verifies that every
@AggregateRoot table has an aggregateVersion column (via Flyway migration
check).
API IMPACT
Versioning significantly affects the API. API endpoints support content
negotiation via the Accept header
(application/vnd.preone.<resource>.v<n>+json). The server returns the
requested version, or the latest version if not specified (with a warning header).
Deprecated versions include 'Deprecation: true' and 'Sunset: <date>' headers.
After the sunset date, deprecated versions return 410 Gone. API documentation
(OpenAPI) includes all supported versions per endpoint, with deprecation
notices. The API versioning strategy is detailed in ADR-092 (API Versioning).
UI IMPACT
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 254

PreOne ADR - Volume 2: Domain Architecture v3.0
Versioning affects UI indirectly. The UI (a first-party consumer) always uses the
latest API version. Third-party UIs (mobile apps, partner portals) may use older
versions during their deprecation period. The UI does not expose versioning to
the user — the user sees 'Student profile' regardless of whether the API is V1 or
V2. However, the UI team must migrate to new API versions before the sunset
date, or the UI will break (410 Gone).
SECURITY IMPACT
Versioning improves security by enabling rollback. If a new version (V2.0) has a
security bug, the platform can roll back to V1.x (still supported during
deprecation) while the bug is fixed. Without versioning, a rollback would
require reverting code, which may lose data. Version metadata in events
provides a forensic trail (e.g., 'this event was V1.2, produced by code version X')
— useful for security investigation. Deprecation headers inform consumers of
upcoming changes, preventing surprise breakage that could be exploited (e.g.,
a consumer that fails open when it receives an unexpected response).
PERFORMANCE IMPACT
Versioning has minimal performance overhead. Version metadata is a small
column (text or integer) in the database. Content negotiation is a header check
(microseconds). Publishing two event versions (during deprecation) doubles
event bus traffic for that event type, but deprecation is temporary (8 weeks) and
affects only major bumps (rare). Overall, versioning has no measurable
performance impact for normal operation (minor/patch bumps) and a small,
temporary impact during major-bump deprecation periods.
SCALABILITY ANALYSIS
Versioning scales linearly. Version metadata is per-artifact (no scaling
concern). Content negotiation is per-request (header check). Dual-version
event publishing (during deprecation) is a temporary 2x load on the event bus
for affected event types — manageable given Redis Streams' 10,000
events/second capacity. The N and N-1 support does not scale beyond 2
versions (no N-2), bounding the complexity. At PreOne's scale, versioning is not
a scalability concern.
OPERATIONAL CONSIDERATIONS
Versioning operations are observable via: version.deprecated.request.count
(per API version, per endpoint), version.sunset.date (gauge per deprecated
version), version.migration.completion (percentage of consumers migrated, for
major bumps). The quarterly architecture scorecard audits: (a) deprecated
version request rate (target: trending to zero before sunset), (b) consumer
migration completion (target: 100% before sunset), (c) ArchUnit violation count
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 255

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
(target: zero — all artifacts versioned), (d) migration guide completeness
(target: 100% for major bumps).
RISKS
| Risk              | Likelihood | Impact | Mitigation       |
| ----------------- | ---------- | ------ | ---------------- |
| Consumers do not  | Medium     | High   | Sunset headers;  |
| migrate before    |            |        | email            |
| sunset, breaking  |            |        | notifications;   |
| on removal        |            |        | release notes;   |
extended
deprecation if
migration <80%
| Version metadata  | Low | Medium | ArchUnit verifies  |
| ----------------- | --- | ------ | ------------------ |
| is missing on     |     |        | @Version on all    |
| some artifacts    |     |        | artifacts; Flyway  |
verifies version
columns;
quarterly audit
| Dual-version  | Medium | Medium | Limited to N and  |
| ------------- | ------ | ------ | ----------------- |
| support is    |        |        | N-1 (no N-2);     |
| complex to    |        |        | deprecation       |
| maintain      |        |        | period is         |
temporary;
automated tests
for both versions
| Breaking changes   | Low | High | Code review by      |
| ------------------ | --- | ---- | ------------------- |
| are misclassified  |     |      | Domain Architect;   |
| as minor (sneak    |     |      | diff tool flags     |
| through without    |     |      | potential breaking  |
| deprecation)       |     |      | changes;            |
consumer contract
tests
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Controlled evolution (no surprise  Complexity (support 2 versions during
| breakage) |     | deprecation) |     |
| --------- | --- | ------------ | --- |
Consumer compatibility (deprecation  Deprecation overhead (8 weeks, dual
| period) |     | publishing) |     |
| ------- | --- | ----------- | --- |
Rollback support (N and N-1) Version metadata in payloads (small
overhead)
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  256

PreOne ADR - Volume 2: Domain Architecture v3.0
We Gain We Lose
Auditable (version metadata in Migration guide maintenance (per
persisted artifacts) major bump)
REJECTED ALTERNATIVES
No versioning (option 2) was the pre-ADR-040 state. Three incidents in Q4
2025-Q1 2026: (1) adding 'guardianEmail' to EnrollmentConfirmed broke a
mobile app that used strict JSON deserialisation (the app crashed on the
unexpected field); (2) removing 'studentName' from EnrollmentConfirmed
(replaced by 'studentId') broke a reporting consumer that expected
'studentName' — the consumer received null and produced incorrect reports;
(3) adding a 'scholarship approval' state to the admission workflow broke in-
flight workflows (started before the change) that could not transition to the new
state. Date-based versioning (option 3) was rejected because it does not
communicate the nature of a change — a consumer seeing 'version 2026-03-25'
cannot assess whether the change is safe (minor) or requires migration (major).
Single version (option 4) was rejected because PreOne has external consumers
(mobile apps, integration partners) that cannot be forced to upgrade
immediately — a breaking change would break them on release, causing
incidents.
MIGRATION PLAN
Phase 1 (complete): Add version metadata to all artifacts (47 aggregates, 87
events, 187 DTOs, 7 workflows). Phase 2 (complete): Implement content
negotiation in API. Phase 3 (complete): Implement dual-version event
publishing (for major bumps). Phase 4 (complete): ArchUnit rules enforced in
CI. Phase 5 (complete): Migration guide template and process. Phase 6 (Q4
2026): First major bump (EnrollmentConfirmed V2.0) with full deprecation
process.
TESTING STRATEGY
Versioning testing has three levels. Unit tests: each versioned artifact is tested
for correct version metadata. Contract tests: each API version has contract
tests (verify V1 and V2 responses are correct). Compatibility tests: V1.x
consumers are tested with V1.x events (including V1.2 with new fields — verify
the consumer ignores new fields). Migration tests: migration guides are tested
(verify the migration steps work). ArchUnit tests: structural rules (@Version on
artifacts, migration guide for major bumps) verified at compile time.
MONITORING & OBSERVABILITY
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 257

PreOne ADR - Volume 2: Domain Architecture v3.0
Versioning metrics: version.request.count (per API version, per endpoint),
version.event.published.count (per event version),
version.deprecated.request.count (per deprecated version),
version.migration.completion (percentage of consumers migrated).
Dashboards in Grafana: deprecated version request rate (trend to zero before
sunset), migration completion per major bump. Alerts: deprecated version
request rate not trending to zero 4 weeks before sunset, migration completion
<80% 2 weeks before sunset.
FUTURE EVOLUTION
Two evolutions are possible. First, the deprecation period may be extended for
major bumps that affect many consumers (e.g., 16 weeks instead of 8) — but the
8-week default is sufficient for most changes. Second, a schema registry (like
Confluent Schema Registry) may be adopted for event schemas, enabling
automated compatibility checks — but the current YAML-based versioning with
ArchUnit is sufficient. The versioning strategy itself is stable; semantic
versioning is a long-standing industry standard.
RELATED ADRS
● ADR-001 — Enterprise Architecture Principles (P6 Build for Evolution
drives versioning)
● ADR-004 — Domain Driven Design (versioning enables domain
evolution)
● ADR-022 — Aggregate Rules (aggregate version metadata)
● ADR-027 — Domain Events (event version metadata)
● ADR-029 — Validation (version-specific validation)
● ADR-034 — Cross Domain Communication (event versioning for cross-
domain)
● ADR-036 — Saga Readiness (saga step versioning)
● ADR-037 — Workflow Engine (workflow definition versioning)
● ADR-092 — API Versioning (API-level versioning strategy)
REFERENCES
● Upstream DDD: DDD-001 (Strategic Design — evolving domain models)
● Upstream PRD: PRD-001-section-6 (Platform evolution requirements)
● Downstream ERD: ERD-009 (version columns in aggregate tables)
● Downstream API Spec: API-007 (API versioning, content negotiation,
deprecation headers)
● Downstream Test Cases: TC-0062 (Versioning, compatibility, migration
tests)
PreOne ADR Series - Phase 3 / 10 - Vol 2: Domain Architecture - 258

PreOne ADR  -  Volume 2: Domain Architecture  v3.0
● External: Semantic Versioning 2.0.0 (semver.org)
● External: RFC 8594 — Sunset HTTP Header Field (deprecation
mechanism)
DECISION HISTORY
| Date       | Status | Actor           | Notes                 |
| ---------- | ------ | --------------- | --------------------- |
| 2026-01-24 | Draft  | Chief Architect | Initial draft with 4  |
options; semantic
versioning chosen
| 2026-02-26 | Proposed | Chief Architect | Submitted to ARB  |
| ---------- | -------- | --------------- | ----------------- |
after versioning
incidents analysis
| 2026-03-25 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
version metadata
added to all
artifacts
| 2026-08-23 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1 ADRs
added
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect (AR) |     |
| ----------- | --- | -------------------- | --- |
| Tech Lead   |     | Foundation Tech Lead |     |
| ARB Chair   |     | ARB Chair            |     |
| Approved On |     | 2026-08-23           |     |
IMPLEMENTATION CHECKLIST
● Add version metadata to 47 aggregates (Done — @Version annotation,
PR #5901)
● Add eventVersion to 87 events (Done — PR #5915)
● Add @ApiVersion to 187 DTOs (Done — PR #5920)
● Add version to 7 workflow definitions (Done — PR #5925)
● Implement content negotiation in API (Done — Spring MVC config)
● Implement dual-version event publishing (Done — outbox publisher)
● ArchUnit rules: @Version, eventVersion, migration guide (Done — CI
gate since V2.2.0)
● Migration guide template and process (Done — docs/migrations/)
PreOne ADR Series  -  Phase 3 / 10  -  Vol 2: Domain Architecture  -  259