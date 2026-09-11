ENTE RPR ISE DO C UM EN TATION SE RIE S - PHAS E 5 O F 10
PreOne Architecture
Decision Records
Phase 5 - Volume 4: Security Architecture
ADR-061 to ADR-090 - 30 decisions - 34-section v3.0 template - Identity, Auth,
Authz, RBAC, MFA, Encryption, WAF, DDoS, Audit, Compliance, DLP, Incident
Response
Document Version: 3.0 (Volume 4 release)
Status: Architecture Freeze
Classification: Internal Engineering Reference
Effective Date: 23 August 2026
Volume Owner: Security Engineering Lead
Approval Authority: Architecture Review Board
PreOne Platform - Enterprise Architecture Governance Phase 5 / 10 - August
2026

PreOne ADR - Volume 4: Security Architecture v3.0
Table of Contents
Phase 5 deliverable - Volume 4: Security Architecture - 30 ADRs
Note: This Table of Contents is generated via field codes. To ensure page-number accuracy
after editing, right-click the TOC and select "Update Field."
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - i

PreOne ADR - Volume 4: Security Architecture v3.0
Document Control
This Phase 5 deliverable of the PreOne Enterprise ADR Series presents Volume
4 — Security Architecture. It contains 30 Architecture Decision Records
(ADR-061 to ADR-090) that define the identity model, authentication and
authorization, RBAC and bundles, MFA and device binding, session and token
management, password policy, API security, encryption and secrets
management, PII protection, rate limiting and security headers, CSRF defense,
vulnerability management, web application firewall, DDoS protection, audit
trail, penetration testing program, compliance framework, data loss
prevention, and incident response on which all security controls are built.
Every ADR in this volume follows the 34-section v3.0 template defined in Phase
1 (ADR-000). Each ADR includes four ASCII diagrams (architecture, sequence,
component, data flow) and is linked to upstream DDD/PRD documents and
downstream ERD/API/UI/Test artefacts per the cross-reference framework
established in Phase 1.
Volume 4 builds directly on Volume 1 (Architecture Foundation, delivered in
Phase 2), Volume 2 (Domain Architecture, delivered in Phase 3), and Volume 3
(Data Architecture, delivered in Phase 4). ADR-061 (Identity Model) establishes
the principal, role, and credential entities that underpin all authentication and
authorization. ADR-062 through ADR-066 define authentication, authorization,
RBAC, the assignment model, and the bundle strategy that composes
permissions into role-grantable units. ADR-067 through ADR-069 define the
effective permission resolver, the permission cache, and cache invalidation.
ADR-070 through ADR-075 cover JWT and refresh-token policy, MFA, device
binding, session management, and password policy. ADR-076 through ADR-082
address API security, encryption, secrets management, PII protection, rate
limiting, security headers, and CSRF defense. ADR-083 through ADR-090 close
the volume with the defense-in-depth and governance ADRs: vulnerability
management, web application firewall, DDoS protection, audit trail,
penetration testing program, compliance framework, data loss prevention, and
incident response. Together, these 30 ADRs form the security-architecture
playbook of the PreOne platform.
VERSION HISTORY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 1

PreOne ADR - Volume 4: Security Architecture v3.0
Version Date Author Summary of
Changes
1.0 2025-11-15 Office of the Chief Initial release of
Architect Volume 4 with 22
ADRs (ADR-061 to
ADR-082) using
the 26-section
v2.0 template.
2.0 2026-01-15 Security Extended Volume
Engineering Lead 4 with 8 additional
ADRs (ADR-083 to
ADR-090)
covering
vulnerability
management,
WAF, DDoS, audit
trail, penetration
testing,
compliance, DLP,
and incident
response.
3.0 2026-08-23 Security Phase 5 release.
Engineering Lead All 30 ADRs
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
Volume 1-3 ADRs
and downstream
ERD/API/TC
artefacts added
per the Phase 1
framework.
OWNERSHIP & CLASSIFICATION
Document Owner Security Engineering Lead (Volume
4 Security Architect)
Approval Authority Architecture Review Board (ARB)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 2

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Classification |     | Internal — Architecture Governance |     |
| -------------- | --- | ---------------------------------- | --- |
| Distribution   |     | Engineering, QA, DevOps, Product,  |     |
Security, Compliance, Architecture
| Review Cadence |     | Annual editorial review; ADR-level  |     |
| -------------- | --- | ----------------------------------- | --- |
review on trigger (incident,
regulation, vendor change)
| Retention |     | Permanent — superseded ADRs  |     |
| --------- | --- | ---------------------------- | --- |
retained for traceability
| Format |     | DOCX (master) / PDF (distribution) /  |     |
| ------ | --- | ------------------------------------- | --- |
Markdown (working copy)
| Storage Location |     | PreOne Architecture Repository /  |     |
| ---------------- | --- | --------------------------------- | --- |
governance/adr/volume-4/
| Series |     | PreOne Enterprise Documentation  |     |
| ------ | --- | -------------------------------- | --- |
Series — Phase 5 of 10
VOLUME 4 ADR SUMMARY
| ADR     | Title          | Category    | Sections |
| ------- | -------------- | ----------- | -------- |
| ADR-061 | Identity Model | Identity &  | 34       |
Security
| ADR-062 | Authentication | Identity &  | 34  |
| ------- | -------------- | ----------- | --- |
Security
| ADR-063 | Authorization | Identity &  | 34  |
| ------- | ------------- | ----------- | --- |
Security
| ADR-064 | RBAC Model | Identity &  | 34  |
| ------- | ---------- | ----------- | --- |
Security
| ADR-065 | Assignment Model | Identity &  | 34  |
| ------- | ---------------- | ----------- | --- |
Security
| ADR-066 | Bundle Strategy | Identity &  | 34  |
| ------- | --------------- | ----------- | --- |
Security
| ADR-067 | Effective   | Identity &  | 34  |
| ------- | ----------- | ----------- | --- |
|         | Permission  | Security    |     |
Resolver
| ADR-068 | Permission Cache | Identity &  | 34  |
| ------- | ---------------- | ----------- | --- |
Security
| ADR-069 | Cache Invalidation | Identity &  | 34  |
| ------- | ------------------ | ----------- | --- |
Security
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  3

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| ADR     | Title      | Category    | Sections |
| ------- | ---------- | ----------- | -------- |
| ADR-070 | JWT Policy | Identity &  | 34       |
Security
| ADR-071 | Refresh Token  | Identity &  | 34  |
| ------- | -------------- | ----------- | --- |
|         | Policy         | Security    |     |
| ADR-072 | MFA            | Identity &  | 34  |
Security
| ADR-073 | Device Binding | Identity &  | 34  |
| ------- | -------------- | ----------- | --- |
Security
| ADR-074 | Session         | Identity &  | 34  |
| ------- | --------------- | ----------- | --- |
|         | Management      | Security    |     |
| ADR-075 | Password Policy | Identity &  | 34  |
Security
| ADR-076 | API Security | Identity &  | 34  |
| ------- | ------------ | ----------- | --- |
Security
| ADR-077 | Encryption | Identity &  | 34  |
| ------- | ---------- | ----------- | --- |
Security
| ADR-078 | Secrets        | Identity &  | 34  |
| ------- | -------------- | ----------- | --- |
|         | Management     | Security    |     |
| ADR-079 | PII Protection | Identity &  | 34  |
Security
| ADR-080 | Rate Limiting | Identity &  | 34  |
| ------- | ------------- | ----------- | --- |
Security
| ADR-081 | Security Headers | Identity &  | 34  |
| ------- | ---------------- | ----------- | --- |
Security
| ADR-082 | CSRF Strategy | Identity &  | 34  |
| ------- | ------------- | ----------- | --- |
Security
| ADR-083 | Vulnerability    | Identity &  | 34  |
| ------- | ---------------- | ----------- | --- |
|         | Management       | Security    |     |
| ADR-084 | Web Application  | Identity &  | 34  |
|         | Firewall         | Security    |     |
| ADR-085 | DDoS Protection  | Identity &  | 34  |
Security
| ADR-086 | Audit Trail | Identity &  | 34  |
| ------- | ----------- | ----------- | --- |
Security
| ADR-087 | Penetration     | Identity &  | 34  |
| ------- | --------------- | ----------- | --- |
|         | Testing Program | Security    |     |
| ADR-088 | Compliance      | Identity &  | 34  |
|         | Framework       | Security    |     |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  4

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| ADR     | Title             | Category    | Sections |
| ------- | ----------------- | ----------- | -------- |
| ADR-089 | Data Loss         | Identity &  | 34       |
|         | Prevention        | Security    |          |
| ADR-090 | Incident Response | Identity &  | 34       |
Security
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  5

PreOne ADR - Volume 4: Security Architecture v3.0
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 6

PreOne ADR - Volume 4: Security Architecture v3.0
V O L U M E 4
Security Architecture
ADR-061 to ADR-090 - 30 decisions - 34 sections each
Volume 4 defines the security architecture of the PreOne platform. The
30 ADRs in this volume translate the structural foundation (Volume 1),
the domain model (Volume 2), and the data architecture (Volume 3) into
a comprehensive security posture. ADR-061 establishes the identity
model — principals, roles, and credentials — that underpins all
authentication and authorization. ADR-062 through ADR-066 define
authentication (bcrypt + JWT + MFA), authorization (permission
resolver), the RBAC model, the assignment model, and the bundle
strategy that composes permissions into role-grantable units. ADR-067
through ADR-069 define the effective permission resolver, the Redis-
backed permission cache, and the cache invalidation strategy that
ensures permission changes propagate within seconds. ADR-070
through ADR-075 cover JWT and refresh-token policy, multi-factor
authentication (TOTP, SMS, push, hardware, WebAuthn passkeys),
device binding, session management, and the password policy (length,
complexity, history, breach database). ADR-076 through ADR-082
address API security (OAuth 2.0, API keys, rate-limit headers),
encryption (at-rest, in-transit, field-level), secrets management (AWS
Secrets Manager with auto-rotation), PII protection (field-level
encryption + masking + audit), rate limiting (tiered per endpoint),
security headers (CSP, HSTS, X-Frame-Options), and CSRF defense
(token + SameSite cookies). ADR-083 through ADR-090 close the volume
with the defense-in-depth and governance ADRs: vulnerability
management (SAST, SCA, DAST, secret, IaC, container scanning — 6
tools in CI/CD), web application firewall (AWS WAF v2 with managed
rules and virtual patching), DDoS protection (Shield Standard + Shield
Advanced with DRT access), audit trail (Postgres with Outbox atomicity
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 7

PreOne ADR - Volume 4: Security Architecture v3.0
and hash-chain tamper detection), penetration testing program (annual
Bishop Fox + quarterly red-team + continuous HackerOne bug-bounty),
compliance framework (FERPA, GDPR, DPDP, COPPA mapped to 12
NIST CSF control domains with automated evidence collection), data
loss prevention (in-app, email, endpoint, SaaS layered DLP), and incident
response (NIST SP 800-61-aligned plan with 4 severity levels, Incident
Commander role, and quarterly tabletop exercises). Together, these 30
ADRs are the security-architecture playbook of the PreOne platform —
the patterns that every engineer applies when designing or modifying
security controls.
AD R -061
Identity Model
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a unified identity model that treats humans, service accounts, and
devices as first-class principals. All principals share a common identity
record format with a discriminator that drives subtype-specific behaviour.
The model is tenant-scoped, externally federatable, and serves as the
substrate for every authentication, authorization, and audit decision in the
PreOne platform.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on customer
procurement requirement
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 8

PreOne ADR - Volume 4: Security Architecture v3.0
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne serves three distinct populations of actors. The first is human users:
students, teachers, administrators, parents, and platform operators, each with
very different lifecycle, consent, and regulatory profiles. The second is service
accounts: backend services that authenticate to other services, scheduled jobs
that need elevated but bounded privileges, and integration adapters that bridge
to third-party SIS, LMS, and payment systems. The third is devices: school-
issued tablets, BYOD laptops, kiosk terminals in computer labs, and the
increasingly common classroom IoT peripherals. Historically these three
populations were modelled in separate tables with separate authentication
paths, which produced predictable pathologies: a teacher acting as a proctor on
a loaner tablet could not be cleanly represented; a service account that needed
to impersonate a user for support had to be hand-wired; audit logs could not
correlate a device fingerprint with a user action because they lived in different
identity spaces. The 2025 Q2 audit found eleven places where the same
physical actor was represented by three different identifiers depending on
which subsystem issued the call. The Architecture Review Board concluded
that a single, unified identity model with explicit subtypes was required before
any further security work could be considered sound. This ADR defines that
model. It is the keystone of Volume 4: ADR-062 (Authentication), ADR-063
(Authorization), ADR-067 (Effective Permission Resolver), and ADR-086 (Audit
Trail) all depend on the principal shape defined here.
BUSINESS DRIVERS
The PreOne platform is contractually obliged to support parental consent flows
(COPPA), student data portability (GDPR Article 20), and verifiable audit chains
(DPDP Section 8). None of these obligations can be honoured reliably when
human, service, and device identities live in different stores. A unified identity
model is a prerequisite for the 2026 international expansion because the EU
and Indian regulatory regimes both require demonstrable correlation between
the actor who caused a data event and the actor who consented to it. A second
driver is operational efficiency. The support team currently maintains three
identity-resolution runbooks for the three legacy identity stores. A single model
collapses this to one. A third driver is the planned launch of classroom IoT
peripherals (smart speakers, attendance scanners) in Q3 2026, which would
require a fourth identity store under the legacy model and a fourth runbook.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 9

PreOne ADR - Volume 4: Security Architecture v3.0
PROBLEM STATEMENT
PreOne lacks a single, authoritative identity model that unifies human users,
service accounts, and devices. The result is inconsistent principal
representation across subsystems, audit gaps, and an inability to satisfy
regulatory correlation requirements. The platform needs one canonical identity
model that all security-sensitive subsystems can rely on.
CONSTRAINTS
● The model must be tenant-scoped; cross-tenant identity correlation is
forbidden except for platform operators under break-glass.
● The model must support federation with external IdPs (Google
Workspace, Microsoft Entra ID, SAML 2.0 school federations) without
duplicating identity.
● The model must remain compatible with the existing PostgreSQL user
table to avoid a flag-day migration of two hundred thousand rows.
● The model must distinguish human, service, and device principals while
sharing a common identifier space.
● The model must record consent, custodianship, and data-residency
attributes per principal for regulatory compliance.
● The model must not leak personally identifiable information into the
principal identifier itself.
ASSUMPTIONS
● UUIDv7 will be adopted as the canonical principal identifier (per
ADR-041), giving time-ordered uniqueness suitable for indexing and
sharding.
● External IdPs continue to support OIDC and SAML 2.0; no exotic
federation protocol needs first-class support in v1.
● The device-attestation ecosystem (WebAuthn CTAP2, Android Play
Integrity, Apple DeviceCheck) is stable enough to build on for the
device subtype.
● Service-account credential rotation will be handled by ADR-078
(Secrets Management); this ADR defines only the identity record.
● Tenant administrators will accept that the unified identity record is the
system of record, superseding their local spreadsheets.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 10

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option              | Pros                 | Cons                | Verdict  |
| ------------------- | -------------------- | ------------------- | -------- |
| Unified identity    | Single source of     | Sparse columns      | Adopted  |
| table with a        | truth, single query  | for subtypes that   |          |
| discriminator       | path, easy to        | do not need them.   |          |
| column              | extend with new      | Risk of             |          |
| (principal_type)    | subtypes. Minimal    | uncontrolled        |          |
| and subtype-        | migration from       | JSONB schema        |          |
| specific JSONB      | the existing users   | drift if subtype    |          |
| extension           | table.               | contracts are not   |          |
| columns.            |                      | enforced.           |          |
| Three separate      | Clean schema per     | Cross-subtype       | Rejected |
| tables (humans,     | subtype. No          | joins are           |          |
| services, devices)  | sparse columns.      | expensive at query  |          |
| with a shared view  | Familiar to          | time. Audit         |          |
| layer that fakes a  | engineers coming     | correlation         |          |
| unified model.      | from a classic       | requires            |          |
|                     | RBAC                 | application-layer   |          |
|                     | background.          | stitching.          |          |
Encourages
subsystems to
drift back toward
single-subtype
queries.
| Event-sourced        | Complete audit      | Read latency       | Rejected |
| -------------------- | ------------------- | ------------------ | -------- |
| identity aggregate   | history for free.   | unacceptable for   |          |
| where the            | Natural fit for     | the authz hot      |          |
| principal is a fold  | consent lifecycle.  | path. Operational  |          |
| over an event log.   | Replayable for      | complexity of      |          |
|                      | debugging.          | event sourcing is  |          |
disproportionate
to the benefit at
PreOne's scale.
| Adopt an off-the- | Eliminates in-  | Loss of control   | Rejected |
| ----------------- | --------------- | ----------------- | -------- |
| shelf identity    | house identity  | over tenant-      |          |
| provider (Auth0,  | engineering.    | scoped consent    |          |
| Okta CIAM) and    | Vendor handles  | modelling. Cost   |          |
| accept its        | compliance      | scales with MAU   |          |
| principal model   | certifications. | in a way that is  |          |
| wholesale.        |                 | unattractive at   |          |
PreOne's
projected growth.
Vendor data-
residency story
does not cover all
three target
regions.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  11

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
ADOPTED
Adopt a unified identity model in which every principal is a row in the
identities table with a UUIDv7 primary key, a tenant_id, a principal_type
discriminator of HUMAN | SERVICE | DEVICE, and a JSONB attributes
column that carries subtype-specific fields under a versioned schema. The
model is the canonical system of record for principal identity.
Authentication, authorization, audit, and consent subsystems MUST resolve
to a principal_id before recording any security event. External IdP subjects
are stored in the linked identities index, never as the primary identifier. A
principal_id, once issued, is never reused and never reissued to a different
actor.
DETAILED RATIONALE
The unified-table approach was chosen over the separate-tables approach
because PreOne's defining use case is cross-subtype correlation. A teacher
proctoring an exam on a loaner device is a HUMAN principal acting through a
DEVICE principal, with the action attributed to the HUMAN but the device
fingerprint preserved in the audit record. A scheduled job that impersonates a
teacher to generate reports is a SERVICE principal acting on behalf of a
HUMAN principal. Under the separate-tables approach, these joins require
three-way queries that quickly become unwieldy and are silently skipped under
deadline pressure, producing audit gaps. Under the unified model, the join is a
single foreign key, which makes the correct thing easy and the wrong thing
awkward. The JSONB subtype attributes are versioned with a schema_version
field and validated by a JSON Schema enforced at the application layer (not at
the database layer) to allow independent evolution of subtype contracts without
table migrations. The HUMAN subtype carries display_name, email, locale,
custodian_principal_id (for minors), consent_state, and data_residency_region.
The SERVICE subtype carries owner_team, allowed_scopes,
credential_fingerprint, and rotation_due_at. The DEVICE subtype carries
attestation_type, hardware_fingerprint, last_seen_at, and trust_level. Each
subtype contract is defined in its own ADR-companion document and reviewed
by the ARB when changed. The decision to forbid reuse of principal identifiers
is driven by regulatory audit requirements. GDPR Article 15 access requests,
DPDP Section 11 grievance handling, and COPPA verifiable parental consent all
require that a principal identifier, once seen in an audit record, refers
unambiguously to the same actor for the entire regulatory retention window.
Identifier reuse breaks this property and creates indefensible audit gaps. The
federation strategy keeps external IdP subjects in a separate linked_identities
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 12

PreOne ADR - Volume 4: Security Architecture v3.0
index rather than promoting them to the primary key. This decouples PreOne's
internal identity lifecycle from the external IdP's lifecycle: if a school switches
from Google Workspace to Microsoft Entra ID, the underlying principal_id is
unchanged and all historical audit records remain valid. This pattern is
sometimes called stable internal identity and is well-established in CIAM
literature. The model deliberately does not prescribe the authentication
mechanism, authorization policy, or credential format. Those are defined in
ADR-062, ADR-063, and ADR-070 respectively. This separation allows each
concern to evolve independently, which is critical because authentication
changes far more frequently than the identity model itself.
ARCHITECTURE DIAGRAM
+---------------------------------------------------------------+ | PREONE UNIFIED
IDENTITY MODEL | +---------------------------------------------------------------+ |
identities (PostgreSQL, tenant-scoped) | | - principal_id (UUIDv7,
PK, never reused) | | - tenant_id (FK -> tenants)
| | - principal_type (HUMAN | SERVICE | DEVICE) | | - attributes
(JSONB, schema_versioned, subtype-specific) | | - status (ACTIVE |
SUSPENDED | DELETED) | | - created_at, deleted_at
| +---------------------------------------------------------------+ | | |
v v v +----------------+ +----------------+ +----------------+ | HUMAN
| | SERVICE | | DEVICE | | display_name | | owner_team | |
attestation | | email | | allowed_scopes | | hw_fingerprint | |
custodian_id | | cred_fingerprint| | trust_level | | consent_state | |
rotation_due | | last_seen_at | | residency | | | | |
+----------------+ +----------------+ +----------------+ | | |
v v v +-----------------------------------------------------------+ |
linked_identities (external IdP federation index) | | - principal_id (FK)
| | - idp_issuer, idp_subject, idp_type (OIDC|SAML) |
+-----------------------------------------------------------+ | v AuthN (ADR-062)
AuthZ (ADR-063) Audit (ADR-086) Consent
SEQUENCE DIAGRAM
Admin -> Identities API: Create HUMAN principal Identities API -> Schema
Validator: Validate HUMAN attributes Schema Validator -> Identities API: Valid
Identities API -> PostgreSQL: INSERT identities row PostgreSQL -> Identities
API: principal_id (UUIDv7) Identities API -> Audit Service: Record CREATE
event Audit Service -> Audit Log: Append with principal_id Identities API ->
Admin: Return principal_id Teacher -> Identities API: Login via Google OIDC
Identities API -> Linked Identities: Upsert (idp_subject) Linked Identities ->
Identities API: Resolved principal_id Identities API -> AuthN: Issue token with
principal_id
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-061 — Identity Model -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Auth Service | issue | Identity
Aggregate | | | | |------->| (Principal, Role, | | | | |
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 13

PreOne ADR - Volume 4: Security Architecture v3.0
| Credential) | | | +----------------+ +----------+-----------+ | |
| | | | persists | |
v | | +----------------+ +----------+-----------+ | | | Repository |
CRUD | Postgres identity | | | | |------->| schema | |
| +----------------+ +----------------------+ | |
| | +----------------+ +----------------------+ | | | Audit Service | log | Audit
Trail (ADR-086)| | | | |------->| | | | +----------------+
+----------------------+ | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Identity Lifecycle Flow: Admin -> Identity Service: create principal (name,
email, role) Identity Service -> Repository: persist Identity Service -> Audit
Service: log 'PRINCIPAL_CREATED' Identity Service -> Notification: send
welcome email Authentication Flow: User -> Auth Service: submit credentials
Auth Service -> Identity Repository: verify Auth Service -> JWT Issuer: issue
token Auth Service -> Audit: log 'AUTH_SUCCESS' or 'AUTH_FAILURE'
DATABASE IMPACT
The identities table replaces three legacy tables (users, service_accounts,
devices) over a phased migration (see Migration Plan). The table is partitioned
by tenant_id using PostgreSQL declarative partitioning, with one partition per
tenant for the largest tenants and a default partition for smaller tenants
grouped by hash. The linked_identities index is a separate table with a unique
constraint on (idp_issuer, idp_subject) and a non-unique index on principal_id
for reverse lookups. Sparse JSONB is managed through TOAST, and typical
HUMAN rows compress to under 1KB. A retention column shadows the legacy
deleted_at column so that ADR-053 (Data Retention) policies can be applied
uniformly. No PII is stored in the principal identifier itself; the email is in
attributes.email, encrypted at the column level per ADR-079.
API IMPACT
All security-sensitive APIs now accept a principal_id rather than a user_id,
service_id, or device_id. The /identities endpoint is the canonical CRUD
surface; subtype-specific endpoints (/identities/human, /identities/service,
/identities/device) are convenience wrappers that enforce subtype schema
validation. The internal IdentityResolver component is the single point through
which all subsystems resolve any external identifier (idp_subject,
hardware_fingerprint, credential_fingerprint) to a canonical principal_id. APIs
that previously accepted the legacy identifiers are deprecated for two release
cycles and then removed. The principal_id is carried in the JWT subject claim
per ADR-070 and in the X-Principal-Id header for service-to-service calls per
ADR-076.
UI IMPACT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 14

PreOne ADR - Volume 4: Security Architecture v3.0
The Identity model surfaces in the admin UI as the 'Users' management page.
Admins can create, edit, deactivate, and view user principals; each principal
has a detail page showing roles, bundles, last login, and MFA enrollment status.
The UI never displays passwords or credential hashes — only a 'password last
changed' timestamp. The Identity model also drives the user-profile page (top-
right dropdown) where end users view their own principal info, change
password, and manage MFA factors. No PII is displayed in lists; only name and
email are shown in detail views.
SECURITY IMPACT
The unified model directly enables least-privilege audit correlation. Because
every security event resolves to a single principal_id, the audit trail can answer
the question who caused this data event? without ambiguity. The model
enforces tenant scoping at the schema level: every principal_id is bound to a
tenant_id at creation and cannot be reassigned, which prevents the cross-
tenant correlation attacks that were possible under the legacy model. The
linked_identities index makes external IdP takeover detectable: if an attacker
gains control of an external IdP account, the principal_id it links to is
unchanged, and break-glass revocation of the linked identity is a single
DELETE. The model also enables ADR-079 (PII Protection) by giving every PII-
bearing attribute a clear principal_id owner, which is required for GDPR Article
17 erasure.
PERFORMANCE IMPACT
Identity resolution moves from three queries (one per legacy table) to one
query against the identities table, which is a net improvement. The identities
table is indexed on (tenant_id, principal_type, status) for the common listing
queries and on principal_id for point lookups. The JSONB attributes column is
GIN-indexed for the rare queries that filter on subtype-specific fields. In load
testing, the unified model resolves principals in under 2ms at p99 on the hot
path, compared to 6-9ms for the legacy three-query path. The cost is a slightly
larger row size (~1.2KB vs ~0.8KB), which is offset by TOAST compression. No
measurable regression was observed in the authz hot path during the migration
dry run.
SCALABILITY ANALYSIS
The model scales with the number of principals, projected to grow from two
hundred thousand to four million over three years. Tenant-based partitioning
keeps individual partitions under one million rows for the largest tenants,
which is well within PostgreSQL's comfort zone for point lookups. The
linked_identities index is the secondary scaling concern; at four million
principals with an average of 1.4 linked identities each (some users link both
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 15

PreOne ADR  -  Volume 4: Security Architecture  v3.0
Google and Microsoft), the index is 5.6 million rows, which fits comfortably in
memory on the current cache tier. Cross-tenant queries are forbidden by policy
and not indexed, which prevents the unbounded scans that would otherwise be
the scaling ceiling.
OPERATIONAL CONSIDERATIONS
The migration from three legacy tables to one unified table is the principal
operational concern. A dual-write period of four weeks is planned, during which
both the legacy and new tables are written, with a nightly reconciliation job
flagging drift. Read traffic is cut over per subsystem, starting with the audit
service (which is read-mostly and low-risk) and ending with the authentication
service (which is on the hot path). The IdentityResolver component is the new
critical-path dependency and is therefore deployed with three replicas across
two regions, with health checks that fail fast when the database is unreachable.
The on-call runbook for identity resolution is published alongside this ADR and
tested in the quarterly game-day exercise.
RISKS
| Risk                  | Likelihood | Impact | Mitigation          |
| --------------------- | ---------- | ------ | ------------------- |
| JSONB subtype         | Medium     | Medium | Schema validation   |
| attributes drift out  |            |        | is enforced in the  |
| of schema             |            |        | IdentityResolver    |
| compliance as         |            |        | and tested in CI.   |
| teams add fields      |            |        | Quarterly schema    |
| without updating      |            |        | audit by the ARB.   |
| the JSON Schema.      |            |        | Schema-breaking     |
changes require a
new ADR.
| Legacy              | High | High | Two-release         |
| ------------------- | ---- | ---- | ------------------- |
| subsystems          |      |      | deprecation with a  |
| continue to query   |      |      | hard removal        |
| the old tables      |      |      | date. CI checks     |
| after deprecation,  |      |      | reject new code     |
| creating split-     |      |      | that imports the    |
| brain identity      |      |      | legacy identity     |
| state.              |      |      | repositories.       |
Quarterly
dependency audit.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  16

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation         |
| ------------------ | ---------- | ------ | ------------------ |
| A principal_id is  | Low        | High   | principal_id is a  |
| accidentally       |            |        | UUIDv7 generated   |
| reused after a     |            |        | by a centralized   |
| hard delete,       |            |        | service; the       |
| breaking audit     |            |        | identities table   |
| immutability       |            |        | enforces no-reuse  |
| guarantees.        |            |        | through a          |
tombstone table.
Deleted rows are
soft-deleted for
the retention
window then
archived.
| Federation with    | Medium | Medium | Only idp_issuer,   |
| ------------------ | ------ | ------ | ------------------ |
| an external IdP    |        |        | idp_subject, and   |
| leaks more PII     |        |        | idp_type are       |
| into the           |        |        | stored. Attribute  |
| linked_identities  |        |        | mapping is         |
| index than is      |        |        | performed in       |
| necessary.         |        |        | flight during      |
authentication,
not persisted.
Reviewed in the
annual PII
minimization
audit.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Single source of truth for principal  Sparse JSONB columns for subtypes
| identity across the platform. |     | that do not need every field. |     |
| ----------------------------- | --- | ----------------------------- | --- |
Clean cross-subtype correlation for  Schema validation moves from database
| audit and consent. |     | constraints to application layer,  |     |
| ------------------ | --- | ---------------------------------- | --- |
requiring tooling investment.
Stable internal identity decoupled from  Migration of two hundred thousand
external IdP changes. rows is non-trivial and requires a dual-
write period.
Uniform tenant scoping enforced at the  Cross-tenant operator workflows
| schema level. |     | require explicit break-glass and are  |     |
| ------------- | --- | ------------------------------------- | --- |
more cumbersome.
REJECTED ALTERNATIVES
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  17

PreOne ADR - Volume 4: Security Architecture v3.0
The separate-tables approach was rejected because it makes the cross-subtype
joins that PreOne needs for audit and consent prohibitively awkward in
practice; under deadline pressure, engineers simply skip the join, producing
audit gaps that are discovered only during regulatory review. Event-sourced
identity was rejected after a four-week spike showed read latency on the authz
hot path exceeding 15ms even with materialized projections, well above the
5ms budget; the audit-history benefit, while real, did not justify the operational
complexity at PreOne's scale. The off-the-shelf CIAM option (Auth0, Okta) was
rejected primarily on data-residency grounds: neither vendor could commit to
in-region storage for the Indian DPDP regime at PreOne's projected MAU, and
the cost model penalised the growth trajectory that the business plan assumes.
The full reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter. Phase 1 (weeks 1-3): create the identities
and linked_identities tables, deploy the IdentityResolver, and begin dual-write
from the legacy repositories. Phase 2 (weeks 4-6): cut over read traffic for the
audit, consent, and reporting subsystems, which are read-mostly and tolerant
of brief inconsistency. Phase 3 (weeks 7-9): cut over the authentication and
authorization subsystems, which are on the hot path; each subsystem is cut
over individually with a 24-hour rollback window. Phase 4 (weeks 10-12): cut
over the remaining subsystems and remove the dual-write code. Phase 5 (week
13): the legacy tables are marked read-only and a final reconciliation is
performed. The legacy tables are retained in read-only mode for the duration of
the regulatory retention window (per ADR-053) and then archived. Rollback is
possible at any point in phases 1-3 by re-pointing the IdentityResolver at the
legacy tables.
TESTING STRATEGY
The unified identity model is tested at three levels. Unit tests cover the
IdentityResolver, schema validators, and the legacy-to-new mapping functions;
coverage target is 95%. Integration tests cover the dual-write reconciliation,
the federation flow with each supported IdP type, and the tenant-scoping
enforcement. End-to-end tests cover the audit-correlation flow: a HUMAN
acting through a DEVICE must produce an audit record that references both
principal_ids. The migration itself is tested in a staging environment that
mirrors production data volume, with a four-hour rehearsal before each phase
cutover. The acceptance criterion is zero reconciliation drift during the dual-
write period and zero unattributed security events during the cutover.
MONITORING & OBSERVABILITY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 18

PreOne ADR - Volume 4: Security Architecture v3.0
Three golden signals are monitored for the identity subsystem. (1) Resolution
latency: p50, p95, p99 for IdentityResolver calls; target p99 under 5ms, alert at
10ms. (2) Resolution error rate: percentage of resolutions that return not-found
or schema-invalid; target under 0.1%, alert at 0.5%. (3) Dual-write drift count:
number of rows where the legacy and new tables disagree during the dual-write
period; target zero, alert on any non-zero value. A dedicated dashboard
surfaces these alongside the principal-creation rate, federation success rate,
and tenant-scoping violation attempts. The on-call runbook for identity
incidents is published alongside this ADR and tested in the quarterly game-day.
FUTURE EVOLUTION
The model is expected to evolve in three directions. First, a fourth principal
subtype (WORKLOAD) may be added to represent Kubernetes service accounts
and event-driven functions that do not map cleanly to SERVICE; this would be a
backward-compatible JSONB addition. Second, the linked_identities index may
grow to support verifiable credentials (W3C VC) for the EU regulatory regime;
this would add a credential_type column. Third, the model may be extended to
support delegated custodianship chains (parent -> school -> district) more
explicitly; the current single custodian_principal_id field is adequate for v1 but
may not suffice for the district-level deployments planned for 2027. Each
evolution will be its own ADR.
RELATED ADRS
● ADR-002 - Modular Monolith Strategy (identity is a bounded context
within the monolith)
● ADR-041 - UUIDv7 Identifier Strategy (canonical principal identifier)
● ADR-043 - Tenant Isolation (tenant-scoped identity enforcement)
● ADR-062 - Authentication (consumes the identity model)
● ADR-063 - Authorization (resolves principal_id to permissions)
● ADR-079 - PII Protection (field-level encryption of identity attributes)
● ADR-086 - Audit Trail (correlates security events to principal_id)
● ADR-053 - Data Retention (governs identity record lifecycle)
REFERENCES
● NIST SP 800-63-3 - Digital Identity Guidelines. NIST. 2017.
● OAuth 2.1, RFC Draft - Section on Client Identity. IETF. 2024.
● W3C Verifiable Credentials Data Model 1.1. W3C. 2022.
● OWASP CIAM Cheat Sheet. OWASP Foundation. 2024.
● PreOne Engineering Handbook, Section 4 - Identity & Security.
Internal. 2025.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 19

PreOne ADR  -  Volume 4: Security Architecture  v3.0
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Identity Platform Lead      |     |
| ARB Chair   |     | Architecture Review Board   |     |
| Approved On |     | 2025-10-15                  |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Identity aggregate implemented in Identity BC (Done)
● Principal, Role, Credential entities defined (Done)
● Postgres identity schema deployed (Done)
● Audit integration for identity events (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  20

PreOne ADR - Volume 4: Security Architecture v3.0
● Admin UI for user management deployed (Done)
AD R -062
Authentication
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt Spring Security 6 with an embedded OAuth 2.1 authorization server
for all authentication flows. Human principals authenticate via OIDC
through federated external IdPs or a local credential store; service
principals authenticate via mTLS client certificates with short-lived bearer
tokens; device principals authenticate via WebAuthn attestation. The
authorization server is the sole issuer of PreOne access tokens and the sole
arbiter of session establishment.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on customer
procurement requirement
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
Authentication at PreOne must serve three populations (per ADR-061) under
three regulatory regimes (GDPR, COPPA, DPDP) with a four-nines availability
target. The legacy authentication stack was a hand-rolled Spring MVC
controller backed by bcrypt-hashed local credentials and a separate JWT issuer
for service-to-service calls. It worked for the first three years but has reached
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 21

PreOne ADR - Volume 4: Security Architecture v3.0
its limits in three ways. First, federation. Schools increasingly want their
teachers to sign in with Google Workspace or Microsoft Entra ID, and the
legacy stack supports this only through brittle SAML adapters that have broken
twice in the last year. Second, service authentication. The legacy mTLS setup
uses long-lived certificates that are rotated annually by hand, which is both an
operational burden and a security exposure. Third, MFA. Teachers and
administrators have requested MFA since 2024, but the legacy stack has no
clean place to insert it; bolting it onto the login controller has been prototyped
and rejected as unmaintainable. The ARB considered four candidate stacks:
extending the legacy stack, adopting Spring Authorization Server (the Spring
community's reference implementation of OAuth 2.1), adopting Keycloak as a
managed identity platform, and adopting a commercial CIAM (Auth0 or Okta).
This ADR selects Spring Authorization Server because it integrates cleanly with
the existing Spring backend, gives PreOne full control over the consent and
tenant-scoping flows that the regulated education market demands, and avoids
the data-residency and cost concerns of the commercial options. The full
reasoning is in the Options Considered table.
BUSINESS DRIVERS
The 2026 international expansion requires federation with EU school
federations (e.g., eduGAIN), US K-12 district SSO providers (ClassLink,
Clever), and Indian school management systems. None of these federations are
supported by the legacy stack. The expansion also requires MFA for any
principal with access to PII, which is a DPDP Section 8 expectation and an
emerging COPPA best practice. The commercial CIAM options would impose
per-MAU pricing that, at PreOne's projected four-million-MAU scale, exceeds
the cost of running Spring Authorization Server in-house by a factor of four. The
business therefore rewards an in-house solution that meets the federation and
MFA requirements without the per-MAU penalty.
PROBLEM STATEMENT
The legacy authentication stack cannot meet the federation, MFA, and service-
authentication requirements of the 2026 international expansion. PreOne
needs a unified authentication layer that serves human, service, and device
principals, supports external federation, integrates MFA, and issues tokens in a
standards-compliant OAuth 2.1 / OIDC shape.
CONSTRAINTS
● Authentication latency must remain under 200ms at p99 for the
federated login redirect path.
● The authorization server must run inside PreOne's VPC; no
authentication traffic may traverse a third-party SaaS.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 22

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● The authorization server must support tenant-scoped consent screens
per ADR-043.
● Credential storage must satisfy NIST 800-63B (per ADR-075) for any
local credential fallback.
● The token issuer must be horizontally scalable with sticky-session-free
operation.
● All authentication events must be auditable with principal_id
correlation per ADR-061.
ASSUMPTIONS
● Spring Authorization Server 1.3+ is production-ready for the volume
PreOne expects (50k logins per day peak).
● External IdPs continue to support OIDC; SAML 2.0 remains necessary
for legacy school federations only.
● WebAuthn (CTAP2) is supported on the device fleet PreOne targets for
the device principal subtype.
● mTLS for service-to-service is already deployed per ADR-076; this ADR
defines the token issuance on top of it.
● Redis is available for session state with cross-region replication per
ADR-068 and ADR-069.
OPTIONS CONSIDERED
| Option             | Pros               | Cons              | Verdict |
| ------------------ | ------------------ | ----------------- | ------- |
| Spring             | Full control over  | PreOne owns the   | Adopted |
| Authorization      | consent and        | operational       |         |
| Server 1.3         | tenant scoping.    | burden. Team      |         |
| embedded in the    | Native Spring      | must build MFA    |         |
| PreOne backend,    | integration. No    | plug-in.          |         |
| federating to      | per-MAU cost.      | Federation edge   |         |
| external IdPs via  | Standards-         | cases are         |         |
| OIDC.              | compliant OAuth    | PreOne's problem. |         |
2.1.
| Keycloak as a     | Mature, battle-     | Heavyweight JVM    | Rejected |
| ----------------- | ------------------- | ------------------ | -------- |
| managed platform  | tested. Federation  | footprint.         |          |
| (CloudFormation-  | and MFA built-in.   | Customization      |          |
| deployed, self-   | Less code to        | requires Keycloak- |          |
| operated).        | write.              | specific SPI       |          |
development.
Tenant-scoping is
an afterthought.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  23

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option              | Pros                 | Cons                 | Verdict  |
| ------------------- | -------------------- | -------------------- | -------- |
| Commercial CIAM     | Best-in-class        | Per-MAU pricing      | Rejected |
| (Auth0 or Okta) as  | federation. MFA      | punitive at scale.   |          |
| the authentication  | and anomaly          | Data-residency       |          |
| front door.         | detection built-in.  | gaps for DPDP        |          |
|                     | Vendor handles       | India. Loss of       |          |
|                     | compliance           | control over         |          |
|                     | certifications.      | consent UX.          |          |
| Extend the legacy   | No new               | Continues to         | Rejected |
| stack with SAML     | framework.           | accumulate           |          |
| adapters, an MFA    | Reuses team's        | technical debt.      |          |
| interceptor, and a  | Spring MVC           | OAuth 2.1            |          |
| separate service-   | expertise.           | compliance is        |          |
| token issuer.       | Smallest blast       | partial. Federation  |          |
|                     | radius for the       | edge cases remain    |          |
|                     | change.              | brittle. Rejected    |          |
by the ARB as not
viable for the
2026 expansion.
DECISION
ADOPTED
Adopt Spring Security 6 with Spring Authorization Server 1.3 as the
embedded OAuth 2.1 authorization server for the PreOne platform. The
authorization server is the sole issuer of PreOne access tokens and the sole
arbiter of session establishment. Human principals authenticate via
federated OIDC (preferred) or a local credential store (fallback for offline-
first schools). Service principals authenticate via mTLS client certificates
(per ADR-076) and receive short-lived bearer tokens. Device principals
authenticate via WebAuthn attestation. All authentication events emit a
structured audit record with principal_id correlation per ADR-061. MFA is
enforced through a pluggable AuthenticationProvider per ADR-072.
DETAILED RATIONALE
Spring Authorization Server was chosen over Keycloak and the commercial
CIAM options for three reasons. First, integration. PreOne's backend is already
a Spring Boot 3 application, and Spring Security 6 is the natural security layer.
Embedding Spring Authorization Server means authentication shares the same
deployment pipeline, observability stack, and on-call rotation as the rest of the
backend, which is a significant operational simplification. Keycloak, by
contrast, would introduce a separate JVM, a separate database, and a separate
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  24

PreOne ADR - Volume 4: Security Architecture v3.0
operational discipline, all of which would dilute the team's focus. Second,
control. The regulated education market has consent requirements that off-the-
shelf CIAM products handle poorly. COPPA requires verifiable parental consent
for minors, with audit trails that survive school-year transitions. GDPR requires
granular, withdrawable consent per processing purpose. DPDP requires
consent in Indian languages with explicit data-fiduciary disclosure. Spring
Authorization Server lets PreOne implement these consent flows as first-class
Spring beans, integrated with the unified identity model (ADR-061) and the
audit trail (ADR-086). Keycloak supports custom consent via SPIs but the SPI
model is awkward and the documentation is sparse; the commercial CIAM
products support consent but charge for it as a premium feature. Third, cost.
The commercial CIAM options price per MAU, and at PreOne's projected four-
million-MAU scale, the annual cost would exceed the fully-loaded cost of two
engineers to operate Spring Authorization Server in-house. The in-house option
also avoids the data-residency gap: neither Auth0 nor Okta could commit, at the
time of decision, to in-region storage for the Indian DPDP regime at PreOne's
projected MAU. The legacy stack was rejected not because it cannot be
extended but because extending it would perpetuate the technical debt that
motivated this ADR. The legacy stack has no clean place for OAuth 2.1 features
like PKCE, refresh token rotation, and pushed authorization requests, all of
which are required for the 2026 expansion. Retrofitting them would amount to
reimplementing Spring Authorization Server badly. The choice of mTLS for
service authentication (rather than, say, long-lived API keys) is driven by the
zero-trust posture defined in ADR-090. mTLS gives every service call a
cryptographically verified caller identity, which is the foundation on which the
rest of the zero-trust stack is built. Short-lived bearer tokens issued on top of
mTLS limit the blast radius of a stolen token: a token expires in 15 minutes (per
ADR-070), while a stolen client certificate is detected at the next rotation. The
choice of WebAuthn for device authentication is driven by the phishing-
resistance requirement. Phishing is the most common attack vector against
education platforms, and WebAuthn's bound-origin credentials are immune to
the credential phishing attacks that OTP-based MFA is vulnerable to. The
device principal subtype defined in ADR-061 carries the attestation as a first-
class attribute, which gives the audit trail cryptographic evidence of the device
that participated in each authentication.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | PREONE
AUTHENTICATION STACK |
+-------------------------------------------------------------+ | Client (Browser | Service | Device)
| +-------+-----------------+-------------------+---------------+ | | |
v v v +-----------+ +---------------+ +--------------+ | OIDC IdP
| | mTLS Termination| | WebAuthn | | (Google, | | (API Gateway) | |
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 25

PreOne ADR - Volume 4: Security Architecture v3.0
Authenticator| | MS, SAML)| +---------------+ +--------------+ +-----+-----+
| | | v | | +-------------------------------+ |
+-->| Spring Authorization Server |<--+ | (OAuth 2.1, OIDC, PKCE) |
| - Token endpoint | | - Authorize endpoint | | -
Consent screen (tenant) | | - MFA plug-in (ADR-072) | +-------
+-----------------------+ | +-------v---------+ |
IdentityResolver| (ADR-061) +-------+---------+ | +-------
v---------+ +----------------+ | Token Issuer |---->| Redis Session | |
(RS256 JWT) | | (ADR-074) | +-------+---------+ +----------------+
| v +----------------+ | Audit Service | (ADR-086)
+----------------+
SEQUENCE DIAGRAM
User -> Browser: Clicks "Sign in with Google" Browser -> Spring Authz
Server: /authorize?client_id=preone Spring Authz Server -> User: Redirect to
Google OIDC User -> Google: Authenticate Google -> Spring Authz Server:
Authorization code Spring Authz Server -> Google: Exchange code for tokens
Spring Authz Server -> IdentityResolver: Resolve idp_subject IdentityResolver ->
Spring Authz Server: principal_id Spring Authz Server -> MFA Provider: Trigger
MFA (ADR-072) MFA Provider -> User: TOTP prompt User -> MFA Provider:
TOTP code MFA Provider -> Spring Authz Server: Verified Spring Authz Server
-> Token Issuer: Issue JWT (RS256) Token Issuer -> Audit Service: Record
LOGIN event Spring Authz Server -> Browser: Set cookies + redirect
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-062 — Authentication -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Login API | submit | Auth
Service | | | | | creds | | | | +----------------+
+----------+-----------+ | | | | |
| verify | | v | | +----------------+
+----------------------+ | | | Identity | lookup | Credential Store | | | |
Repository |------->| (bcrypt hash) | | | +----------------+
+----------------------+ | | | | |
| match? | | v | | +----------------+
+----------------------+ | | | JWT Issuer | issue | JWT (ADR-070) | | | |
|------->| + Refresh Token | | | +----------------+ +----------------------+ |
| | | MFA (ADR-072) and Device Binding
(ADR-073) layered on top | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Login Flow: User -> Login API: email + password Login API -> Auth Service:
authenticate Auth Service -> Identity Repo: lookup user Auth Service ->
Password Hasher: verify bcrypt Auth Service -> MFA Service: trigger (if
enabled) Auth Service -> JWT Issuer: issue access + refresh tokens Auth
Service -> Audit: log 'AUTH_SUCCESS' Auth Service -> User: return tokens
Token Refresh Flow: User -> Refresh API: refresh token Refresh API -> Token
Validator: validate refresh token Refresh API -> JWT Issuer: issue new access
token Refresh API -> Audit: log 'TOKEN_REFRESHED'
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 26

PreOne ADR - Volume 4: Security Architecture v3.0
DATABASE IMPACT
Authentication adds two new tables. oauth_authorization holds in-flight
authorization grants (authorization code, PKCE verifier, consent state) with a
10-minute TTL enforced by a scheduled cleanup job. oauth_refresh_token holds
refresh token metadata (jti, principal_id, issued_at, expires_at, rotated_from)
for the refresh-token rotation policy defined in ADR-071. Both tables are tenant-
scoped via principal_id join. The legacy credentials table is retained for the
local-credential fallback and is bcrypt-hashed per ADR-075; new columns for
argon2id migration are added but the cutover is deferred to ADR-075. No
changes to the identities table defined in ADR-061; authentication reads from it
but does not write.
API IMPACT
Three new public endpoints are introduced under /oauth2: /authorize
(authorization endpoint, GET/POST), /token (token endpoint, POST, mTLS for
service clients), and /revoke (RFC 7009 token revocation). The /userinfo
endpoint (OIDC) is served at /oauth2/userinfo. The legacy /login endpoint is
deprecated for two release cycles and then removed; existing sessions are
migrated by issuing a refresh token on first visit to the new stack. All protected
API endpoints now accept an Authorization: Bearer <jwt> header validated by
the Spring Security filter chain; the legacy X-Auth-Token header is accepted
during the deprecation window and then removed. Consent endpoints under
/consent are tenant-scoped and require an active authorization grant.
UI IMPACT
Authentication surfaces in the UI as the login page (email + password), the
MFA challenge page (TOTP code / push notification / SMS code), and the post-
login redirect. The login page includes 'forgot password' and 'remember this
device' affordances (the latter tied to Device Binding, ADR-073). Failed login
attempts display a generic error ('invalid email or password') to prevent user
enumeration. Account lockout after 5 failed attempts displays a 'contact admin'
message. The UI was updated to support WebAuthn (passkeys) in 2025, with a
'Sign in with passkey' option on the login page.
SECURITY IMPACT
The OAuth 2.1 stack materially raises the security floor. PKCE is mandatory for
all authorization-code flows, eliminating the authorization-code interception
attack that affected the legacy stack. Refresh token rotation (per ADR-071)
limits the blast radius of a stolen refresh token to one rotation window. Pushed
Authorization Requests (PAR, RFC 9126) are mandatory for any client
requesting elevated scopes, preventing login-phishing attacks that tamper with
authorize-request parameters. mTLS for service clients (per RFC 8705) gives
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 27

PreOne ADR - Volume 4: Security Architecture v3.0
every service-to-service call a cryptographically verified caller, which is the
foundation of the zero-trust posture defined in ADR-090. The Spring Security
filter chain enforces tenant-scoped authorization at every request, preventing
the cross-tenant access that was possible under the legacy stack's session-
based checks.
PERFORMANCE IMPACT
The federated login redirect path adds two round trips (IdP redirect and code
exchange) compared to the legacy direct-login path, increasing wall-clock login
time from ~300ms to ~600ms at p50. This is acceptable because login is a low-
frequency operation (average 1.2 sessions per user per day) and the user
perceives the redirect as familiar. The token validation path on every API
request is significantly faster: RS256 JWT validation is a single asymmetric
signature check (~0.3ms), compared to the legacy session-database lookup
(~4ms). Net API latency improves by approximately 3ms at p99 for protected
endpoints. Redis-backed session state (per ADR-074) keeps logout and
revocation checks under 1ms.
SCALABILITY ANALYSIS
The Spring Authorization Server is horizontally scalable and stateless across
the token endpoint; the authorize endpoint uses short-lived Redis-backed
session state for the consent flow. At the projected peak of 50k logins per day
(roughly 0.6 logins per second sustained, 5 per second peak), three replicas in
each region handle the load with 70% headroom. The Redis session tier is the
scaling bottleneck; it is sized for 200k concurrent sessions per region, which
exceeds the projected peak by a factor of four. The bottleneck beyond that is
the IdentityResolver database queries, which scale with the identities table
partitioning strategy defined in ADR-061. No architectural ceiling is anticipated
within the three-year planning horizon.
OPERATIONAL CONSIDERATIONS
The Spring Authorization Server is deployed as a Spring Boot application
alongside the main PreOne backend, sharing its observability stack and on-call
rotation. The RS256 signing key is stored in AWS KMS per ADR-078 and
rotated quarterly per ADR-070. The Redis session tier is deployed in a three-
node cluster per region with cross-region replication for session failover. The
on-call runbook covers four failure modes: authorization server unavailable
(fail-closed, return 503), Redis unavailable (fail-open for token validation, fail-
closed for new logins), IdP unavailable (fallback to local credentials for
designated schools), and signing-key rotation in progress (dual-key validation
window). Each failure mode is tested in the quarterly game-day.
RISKS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 28

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Spring             | Medium     | Medium | Track the Spring    |
| Authorization      |            |        | Authorization       |
| Server has a       |            |        | Server release      |
| smaller            |            |        | notes. Maintain a   |
| community than     |            |        | fork-friendly       |
| Keycloak and may   |            |        | posture. ARB        |
| lag on OAuth 2.1   |            |        | reviews             |
| final-spec         |            |        | compliance          |
| compliance.        |            |        | quarterly.          |
| Federated login    | High       | Low    | Local credential    |
| adds latency that  |            |        | fallback for        |
| users perceive as  |            |        | offline-first       |
| a regression       |            |        | schools.            |
| versus the legacy  |            |        | Optimized redirect  |
| direct login.      |            |        | chain. User-facing  |
messaging that
explains the
federation benefit.
| RS256 signing-key    | Low | High | Rotation is         |
| -------------------- | --- | ---- | ------------------- |
| rotation disrupts    |     |      | automated with a    |
| in-flight tokens if  |     |      | 24-hour dual-key    |
| the dual-validation  |     |      | validation window.  |
| window is            |     |      | Rotation            |
| misconfigured.       |     |      | rehearsed in        |
staging quarterly.
Rollback path:
previous key
remains valid for 7
days.
| MFA plug-in           | Medium | High | MFA provider         |
| --------------------- | ------ | ---- | -------------------- |
| becomes a single      |        |      | deployed with        |
| point of failure for  |        |      | three replicas and   |
| all logins when       |        |      | a circuit breaker    |
| enabled platform-     |        |      | that fails open for  |
| wide.                 |        |      | low-risk logins      |
during outage.
Documented in
ADR-072.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Standards-compliant OAuth 2.1 / OIDC  Operational ownership of the
stack with first-class federation. authorization server falls on PreOne's
team.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  29

PreOne ADR - Volume 4: Security Architecture v3.0
We Gain We Lose
mTLS for service authentication gives Certificate rotation discipline becomes
cryptographically verified caller mandatory; manual rotation is no longer
identity. viable.
WebAuthn for device authentication is Device fleet must support CTAP2; older
phishing-resistant. devices fall back to TOTP MFA.
Consent and tenant-scoping flows are PreOne owns the consent UX; no vendor
first-class Spring beans. best-practice template.
REJECTED ALTERNATIVES
Keycloak was rejected primarily on operational grounds: it would introduce a
separate JVM, database, and operational discipline that the team judged not
worth the benefit at PreOne's scale, and its SPI-based customization model is
awkward for the tenant-scoped consent flows that the regulated education
market demands. Commercial CIAM (Auth0, Okta) was rejected on cost and
data-residency grounds: per-MAU pricing at four-million MAU exceeds the in-
house cost by a factor of four, and neither vendor could commit to in-region
storage for the Indian DPDP regime at PreOne's projected MAU. Extending the
legacy stack was rejected because retrofitting PKCE, refresh token rotation,
PAR, and mTLS-bound tokens would amount to reimplementing Spring
Authorization Server badly, while continuing to accumulate the technical debt
that motivated this ADR.
MIGRATION PLAN
Migration is phased over one quarter. Phase 1 (weeks 1-3): deploy Spring
Authorization Server alongside the legacy stack; both issue tokens, but the
legacy stack is the default. Phase 2 (weeks 4-6): new schools are provisioned on
the new stack; existing schools are invited to opt in via a tenant-admin toggle.
Phase 3 (weeks 7-9): opt-in schools reach 50% of MAU; the new stack is now the
default for new logins, with the legacy stack accepting only existing sessions.
Phase 4 (weeks 10-12): the legacy stack is decommissioned; any remaining
sessions are migrated by a forced re-login. Phase 5 (week 13): the legacy /login
endpoint is removed. Rollback is possible at any point in phases 1-3 by flipping
the default back to the legacy stack; the dual-issuance window ensures no user
is locked out.
TESTING STRATEGY
The authentication stack is tested at four levels. Unit tests cover token
issuance, validation, and the consent flow; coverage target is 90%. Integration
tests cover the OIDC federation flow with each supported IdP (Google,
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 30

PreOne ADR - Volume 4: Security Architecture v3.0
Microsoft, SAML), the mTLS service flow, and the WebAuthn device flow. End-
to-end tests cover the full login-to-API-call path for each principal subtype.
Security tests cover PKCE enforcement, refresh token rotation, PAR
enforcement, and the MFA plug-in. Load tests cover 5x projected peak login
rate. The acceptance criterion is zero authentication failures attributable to the
new stack during the 30-day post-cutover stabilization period.
MONITORING & OBSERVABILITY
Five golden signals are monitored. (1) Login success rate: target above 99%,
alert below 98%. (2) Login latency p99: target under 800ms, alert above
1200ms. (3) Token validation latency p99: target under 2ms, alert above 5ms.
(4) Federation error rate: target under 0.5%, alert above 1%. (5) MFA failure
rate: target under 5% (legitimate user error), alert above 10% (possible attack).
A dedicated authentication dashboard surfaces these alongside the principal-
creation rate, federation provider breakdown, and the geographic distribution
of logins. Anomaly detection (per ADR-088) flags unusual login patterns
(impossible travel, new geographies, credential stuffing signatures) for review.
FUTURE EVOLUTION
The stack is expected to evolve in three directions. First, the local credential
fallback may be replaced by a passkey-only flow (WebAuthn for humans, not
just devices) once browser support is sufficient; this would eliminate the
bcrypt-hashed credential store entirely. Second, the RS256 signing key may
migrate to ES256 for smaller token sizes once all clients support ECDSA
validation. Third, the authorization server may be split into a separate
deployment unit (separate JVM, separate autoscaling group) if the login volume
grows to the point where sharing the main backend's resources becomes a
contention concern; this is not anticipated within the three-year planning
horizon.
RELATED ADRS
● ADR-061 - Identity Model (provides principal_id resolution)
● ADR-063 - Authorization (consumes authenticated principal)
● ADR-070 - JWT Policy (token format and lifetime)
● ADR-071 - Refresh Token Policy (rotation strategy)
● ADR-072 - MFA (multi-factor enforcement)
● ADR-074 - Session Management (session lifecycle)
● ADR-076 - API Security (mTLS for service clients)
● ADR-075 - Password Policy (local credential fallback)
REFERENCES
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 31

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● RFC 6749 - The OAuth 2.0 Authorization Framework. IETF. 2012.
● OAuth 2.1, RFC Draft. IETF. 2024.
● Spring Authorization Server Reference Documentation, v1.3. VMware.
2024.
● RFC 8705 - OAuth 2.0 Mutual-TLS Client Authentication. IETF. 2020.
● RFC 9126 - Pushed Authorization Requests. IETF. 2022.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect  |     |
| ----------- | --- | ---------------------------- | --- |
| Tech Lead   |     | Authentication Platform Lead |     |
| ARB Chair   |     | Architecture Review Board    |     |
| Approved On |     | 2025-10-15                   |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  32

PreOne ADR - Volume 4: Security Architecture v3.0
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Auth Service implemented (login, logout, refresh) (Done)
● bcrypt password hashing deployed (Done)
● JWT issuance with 15-min access + 30-day refresh (Done)
● MFA integration (ADR-072) (Done)
● Device binding integration (ADR-073) (Done)
● Failed-login lockout after 5 attempts (Done)
● Audit logging for all auth events (Done)
AD R -063
Authorization
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a policy-based authorization layer that combines role-based access
control (RBAC) as the primary mechanism with attribute-based access
control (ABAC) as the fallback for fine-grained, context-dependent
decisions. The layer is enforced at three checkpoints: the API gateway
(coarse scope checks), the Spring Security filter chain (tenant and principal
checks), and the service layer (resource-level checks). The Effective
Permission Resolver (ADR-067) is the single source of truth for the resolved
permission set of any principal at any moment.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on customer
procurement requirement
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 33

PreOne ADR - Volume 4: Security Architecture v3.0
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The legacy authorization model is a tangle of @PreAuthorize annotations
scattered across controllers, hand-rolled if (user.role == ADMIN) checks in
service code, and a custom policy engine for the few cases where neither
suffices. The 2025 Q2 audit found forty-three distinct authorization patterns
across the codebase, with inconsistent enforcement of tenant scoping and at
least seven locations where a teacher from tenant A could read data from
tenant B if they crafted the right URL. The root cause is that authorization has
been treated as an afterthought, bolted on at whatever layer was convenient at
the time. The result is a defense-in-depth failure: an attacker who bypasses one
check at one layer often finds no further check at the next layer. The ARB
concluded that authorization must be redesigned as a first-class subsystem
with a single source of truth, three explicit enforcement checkpoints, and a
clear separation between coarse role checks (RBAC) and fine-grained context
checks (ABAC). This ADR defines the architecture of the authorization layer.
The RBAC model itself (roles, hierarchies, bundles) is defined in ADR-064; the
effective permission resolver that turns roles into a flat permission set is
defined in ADR-067; the caching strategy that makes the resolver fast enough
for the hot path is defined in ADR-068. This ADR is the umbrella that ties them
together and defines the enforcement architecture.
BUSINESS DRIVERS
The 2026 international expansion requires demonstrable authorization controls
for the EU GDPR data-processor obligations, the US COPPA parental-consent
obligations, and the Indian DPDP data-fiduciary obligations. All three regimes
require that the platform be able to answer who could have accessed this data
event? with a degree of precision that the legacy forty-three-pattern model
cannot provide. The business also requires that tenant administrators be able
to customize roles within their tenant (e.g., a school that wants a Principal role
distinct from the Administrator role) without code changes, which the legacy
model cannot support because roles are baked into annotations.
PROBLEM STATEMENT
The legacy authorization model is fragmented across forty-three patterns with
inconsistent tenant-scoping enforcement and at least seven cross-tenant access
paths. PreOne needs a unified authorization layer with a single source of truth
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 34

PreOne ADR  -  Volume 4: Security Architecture  v3.0
for permission resolution, three explicit enforcement checkpoints, and a clean
separation between coarse role checks and fine-grained context checks.
CONSTRAINTS
● Authorization checks must complete in under 5ms at p99 on the API hot
path.
● The authorization layer must enforce tenant scoping at every
checkpoint; cross-tenant access requires explicit break-glass.
● Tenant administrators must be able to customize roles within their
tenant without code changes.
● The authorization layer must be auditable: every decision must be
reconstructable from logs.
● The authorization layer must degrade gracefully when the permission
cache is unavailable.
● The authorization layer must not leak the existence of resources a
principal cannot access (no enumeration).
ASSUMPTIONS
● The RBAC model defined in ADR-064 is sufficient for 90% of
authorization decisions; ABAC handles the rest.
● The Effective Permission Resolver (ADR-067) and its Redis cache
(ADR-068) meet the 5ms p99 latency budget.
● Spring Security 6 (per ADR-062) provides a sufficient extension surface
for the three-checkpoint enforcement.
● Tenant-scoped resource IDs are universally enforced (every resource
carries a tenant_id) per ADR-043.
● Audit logging (ADR-086) is fast enough to record every authorization
decision without becoming the bottleneck.
OPTIONS CONSIDERED
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
Three-checkpoint  Defense in depth.  Three checkpoints  Adopted
| enforcement:          | Single source of    | add per-request      |     |
| --------------------- | ------------------- | -------------------- | --- |
| gateway (scope),      | truth via the       | overhead.            |     |
| filter chain (tenant  | resolver. Clean     | Requires             |     |
| + principal),         | separation of       | discipline to keep   |     |
| service (resource),   | coarse and fine     | checks at the right  |     |
| with RBAC             | checks. Tenant-     | layer. More          |     |
| primary and ABAC      | customizable roles  | moving parts than    |     |
| fallback.             | supported.          | a single             |     |
checkpoint.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  35

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option             | Pros                | Cons               | Verdict  |
| ------------------ | ------------------- | ------------------ | -------- |
| Single-checkpoint  | Single policy       | OPA sidecars add   | Rejected |
| enforcement at     | engine.             | latency and        |          |
| the API gateway    | Centralized policy  | operational        |          |
| with OPA (Open     | management.         | complexity.        |          |
| Policy Agent)      | Strong policy-as-   | Gateway becomes    |          |
| sidecars.          | code story.         | a single point of  |          |
failure for
authorization.
Fine-grained
resource checks
are awkward at
the gateway.
| Annotation-driven  | Simplest            | Single layer of      | Rejected |
| ------------------ | ------------------- | -------------------- | -------- |
| enforcement at     | migration path.     | defense.             |          |
| the controller     | Familiar to Spring  | Resource-level       |          |
| layer only,        | developers. No      | checks in service    |          |
| replacing the      | new                 | code remain ad-      |          |
| existing forty-    | infrastructure.     | hoc. Cannot          |          |
| three patterns     |                     | support tenant-      |          |
| with a single      |                     | customizable roles   |          |
| @Authorize         |                     | without code         |          |
| annotation.        |                     | changes.             |          |
| Outsource to a     | Battle-tested       | Per-request          | Rejected |
| commercial policy  | policy engine.      | pricing punitive at  |          |
| engine (AuthZeny,  | Vendor handles      | scale. Data-         |          |
| OPA Cloud, Styra   | compliance          | residency            |          |
| DAS).              | certifications.     | concerns for         |          |
DPDP India. Loss
of control over
tenant-scoping
logic.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  36

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
Adopt a three-checkpoint authorization architecture. Checkpoint 1 (API
gateway) enforces coarse OAuth scope checks: a request without the
required scope is rejected before reaching the backend. Checkpoint 2
(Spring Security filter chain) enforces tenant and principal checks: a
request whose principal_id does not belong to the tenant in the URL path is
rejected. Checkpoint 3 (service layer) enforces resource-level checks via
the Effective Permission Resolver (ADR-067): a request whose resolved
permission set does not include the required permission for the specific
resource is rejected. RBAC is the primary mechanism; ABAC is the fallback
for context-dependent decisions (time-of-day, location, device trust). The
authorization layer is the sole authority; service code must not implement
its own checks.
DETAILED RATIONALE
The three-checkpoint architecture is a defense-in-depth design. Each
checkpoint catches a different class of attack and a different class of bug. The
gateway checkpoint catches unauthenticated or scope-deficient requests
before they consume backend resources, which is important both for security
(rejecting attacks early) and for cost (rejecting abuse before it scales). The
filter-chain checkpoint catches tenant-confusion bugs: even if the gateway is
misconfigured and lets a request through, the filter chain re-checks that the
principal belongs to the tenant in the URL path. The service-layer checkpoint
catches resource-level authorization bugs: even if the gateway and filter chain
pass, the service layer re-checks that the principal has the specific permission
required for the specific resource being accessed. The three checkpoints are
intentionally redundant. A request that passes all three has been authorized
three times in three different ways, which is the operational definition of
defense in depth. The redundancy is not free: it adds approximately 2ms to the
p99 latency of every request (1ms at the gateway, 0.5ms at the filter chain,
0.5ms at the service layer). This overhead is justified by the security posture it
buys and is well within the 5ms p99 budget. The choice of RBAC as the primary
mechanism reflects the PreOne reality: 90% of authorization decisions are
coarse (can this teacher view this class's gradebook?) and map cleanly to roles.
RBAC is simple to reason about, simple to audit, and simple to delegate to
tenant administrators. The ABAC fallback handles the remaining 10%: a
teacher can view a gradebook only during school hours, only from a school-
issued device, only for a class they currently teach. These context-dependent
checks are awkward to express in RBAC but natural in ABAC, and the policy
engine (a small in-house DSL compiled to a decision tree) handles them cleanly.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 37

PreOne ADR - Volume 4: Security Architecture v3.0
The decision to forbid service code from implementing its own checks is the
most contentious part of this ADR. The historical pattern is for service code to
add if (user.canX) checks as a complement to the framework-level checks, on
the theory that more checks are safer. In practice, this pattern produces two
failure modes. First, the service-level check drifts out of sync with the
framework-level check (e.g., the framework checks for VIEW_GRADEBOOK but
the service code checks for EDIT_GRADEBOOK), producing a false sense of
security. Second, the service-level check becomes the only check when the
framework-level check is bypassed (e.g., during a maintenance window),
producing an inconsistent security posture. The ARB concluded that the
authorization layer must be the sole authority and that service code must
invoke the layer rather than re-implement it. The choice to build the ABAC
engine in-house rather than adopt OPA was driven by the tenant-customization
requirement. OPA's Rego policies are global; supporting per-tenant
customization requires either a separate OPA instance per tenant
(operationally expensive at PreOne's tenant count) or a policy structure that
embeds tenant_id as a variable (which produces policies that are hard to read
and audit). The in-house DSL compiles per-tenant policies into a single decision
tree at policy-load time, which is both faster at runtime and easier to audit. The
OPA sidecar approach was also rejected on latency grounds: a sidecar call adds
1-2ms per request, which would consume the entire authorization latency
budget.
ARCHITECTURE DIAGRAM
+-----------------------------------------------------------+ | PREONE AUTHORIZATION
ARCHITECTURE | +-----------------------------------------------------------+ | Request
arrives | +-------+---------------------------------------------------+
| v +----------------------------+ +----------------+ | CHECKPOINT 1: API
Gateway |----->| OAUTH SCOPE | | Coarse scope check | |
VALIDATOR | +----------------------------+ +----------------+ | pass v
+----------------------------+ +----------------+ | CHECKPOINT 2: Filter Chain |----->|
TENANT/PRINCIPAL| | Tenant + principal check | | VALIDATOR |
+----------------------------+ +----------------+ | pass v +----------------------------+
+----------------+ | CHECKPOINT 3: Service Layer|----->| EFFECTIVE | |
Resource-level check | | PERMISSION | | | |
RESOLVER | | | | (ADR-067) | | |
+-------+--------+ | | | | | +-------
v--------+ | | | ABAC POLICY | | | |
ENGINE (DSL) | | | +----------------+ +----------------------------+
| pass v +----------------+ | Business Logic | +----------------+
SEQUENCE DIAGRAM
Client -> API Gateway: Request with Bearer token API Gateway -> Scope
Validator: Check required scope Scope Validator -> API Gateway: Pass API
Gateway -> Filter Chain: Forward request Filter Chain -> Tenant Validator:
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 38

PreOne ADR - Volume 4: Security Architecture v3.0
principal.tenant_id == path.tenant_id Tenant Validator -> Filter Chain: Pass
Filter Chain -> Service Layer: Forward request Service Layer -> Permission
Resolver: Resolve(principal_id) Permission Resolver -> Redis Cache: GET
permissions Redis Cache -> Permission Resolver: Cached (or miss) Permission
Resolver -> Service Layer: Resolved permission set Service Layer -> ABAC
Engine: Evaluate context policy ABAC Engine -> Service Layer: Decision
(allow/deny) Service Layer -> Audit Service: Record AUTHZ decision Service
Layer -> Business Logic: Execute
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-063 — Authorization -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | API Gateway | ask |
Authorization | | | | |------->| Service | | |
+----------------+ +----------+-----------+ | | |
| | | resolve | | v
| | +----------------+ +----------------------+ | | | Permission | query |
Effective Permission | | | | Resolver |------->| Resolver (ADR-067) |
| | | | | + Cache (ADR-068) | | | +----------------+ +----------
+-----------+ | | | | |
| allow / deny | | v | | +----------------+
+----------------------+ | | | Audit Service | log | Audit Trail (ADR-086)| | |
| |------->| | | | +----------------+ +----------------------+
| +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Authorization Flow: Client -> API: request with JWT API -> Auth Service: 'can
user X do action Y on resource Z?' Auth Service -> Permission Resolver: resolve
effective permissions Permission Resolver -> Permission Cache (Redis): lookup
(cache miss) Permission Resolver -> RBAC Repo: query Permission Resolver ->
Permission Cache: store Auth Service -> Audit: log 'AUTHZ_DECISION'
(allow/deny) Auth Service -> API: allow / deny API -> Client: response or 403
DATABASE IMPACT
Authorization adds two tables. permissions is the catalog of all permission
strings (e.g., gradebook.view, attendance.edit) with descriptions and audit
metadata; it is a small, slowly changing table maintained by the platform team.
policies holds the ABAC policy DSL source and its compiled decision-tree form,
with a version column for safe rollout and rollback. Both tables are tenant-
scoped via a tenant_id column where applicable (permissions are global;
policies can be global or tenant-specific). The role_assignments table defined in
ADR-065 is the input to the Effective Permission Resolver; this ADR does not
modify it. No changes to the identities table defined in ADR-061; authorization
reads from it but does not write.
API IMPACT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 39

PreOne ADR - Volume 4: Security Architecture v3.0
Every API endpoint is annotated with @RequiredScope (gateway-level),
@TenantScoped (filter-chain-level), and @RequiresPermission (service-level).
The three annotations are enforced by interceptors registered in the Spring
Security configuration. Endpoints that existed under the legacy forty-three-
pattern model are migrated endpoint by endpoint; the migration is tracked in a
dedicated dashboard. Endpoints that cannot be migrated (e.g., because they
require a check the new layer cannot express) are flagged for redesign. The
authorization layer exposes an internal /authz/check endpoint for use by the
frontend (e.g., to enable or disable UI elements based on permissions); this
endpoint is cached aggressively per ADR-068.
UI IMPACT
Authorization surfaces in the UI as feature visibility. The navigation bar adapts
to the user's effective permissions: a user without 'reports:view' does not see
the Reports menu; a user without 'admin:manage' does not see the Admin
menu. Buttons and actions are hidden or disabled based on the user's
permissions (e.g., a 'Delete' button is hidden for users without 'entity:delete').
The UI never shows a disabled action with a tooltip 'you do not have permission'
(this leaks permission existence); instead, the action is hidden entirely. On 403
responses from the API, the UI displays a friendly 'You do not have access to
this resource' page with a link to request access from an admin.
SECURITY IMPACT
The three-checkpoint architecture closes the cross-tenant access paths that the
2025 Q2 audit identified. The filter-chain checkpoint (Checkpoint 2) is the
critical defense: even if Checkpoint 1 is misconfigured and a request from
tenant A reaches a tenant B URL, Checkpoint 2 rejects it. The service-layer
checkpoint (Checkpoint 3) closes the resource-level authorization bugs that the
legacy model allowed: a teacher with VIEW_GRADEBOOK cannot accidentally
be granted EDIT_GRADEBOOK because the service layer checks the resolved
permission set, not a stale annotation. The ABAC engine enables context-
dependent checks (school hours, device trust) that the legacy model could not
express, closing the time-and-place attacks that the audit flagged as theoretical
but plausible. The single-source-of-truth property (the resolver is the sole
authority) eliminates the drift between layers that produced the legacy model's
false sense of security.
PERFORMANCE IMPACT
The three checkpoints add approximately 2ms to the p99 latency of every
request: 1ms at the gateway (scope validation is a JWT claim check), 0.5ms at
the filter chain (tenant check is a Redis-cached principal lookup), and 0.5ms at
the service layer (permission check is a Redis-cached set membership test).
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 40

PreOne ADR  -  Volume 4: Security Architecture  v3.0
This is well within the 5ms p99 budget and is offset by the elimination of the ad-
hoc checks the legacy model scattered through service code (which averaged 3-
5ms per request across multiple redundant lookups). The net effect is a slight
improvement in p99 latency despite the additional checkpoints. The ABAC
engine adds 0.2ms per evaluation on the rare paths that require it; the common
path (pure RBAC) skips the ABAC engine entirely.
SCALABILITY ANALYSIS
The authorization layer scales with request volume, not with principal or
resource count, because the per-request work is bounded by Redis-cached
lookups. The Redis permission cache (ADR-068) is the scaling bottleneck; it is
sized for 1 million cached principals per region, which exceeds the projected
peak by a factor of three. The ABAC engine compiles policies to decision trees
at policy-load time, so per-request evaluation is a tree walk with no allocation.
The audit service (ADR-086) records every authorization decision, which
produces 5-10k events per second at peak; this is well within the audit service's
capacity. No architectural ceiling is anticipated within the three-year planning
horizon.
OPERATIONAL CONSIDERATIONS
The authorization layer is deployed as a Spring library embedded in the main
backend, plus a sidecar-less ABAC engine. The on-call runbook covers four
failure modes: Redis unavailable (fail-open for known-low-risk permissions, fail-
closed for elevated permissions; documented per-permission), permission
resolver slow (circuit breaker opens, requests fail closed with a 503), ABAC
engine unavailable (fallback to RBAC-only with logging of skipped ABAC
checks), and policy compilation failure (rollback to previous policy version).
Policy changes are rolled out via the standard blue-green deployment with a 30-
minute soak in staging. Each failure mode is tested in the quarterly game-day.
The authorization layer has a dedicated dashboard showing decision latency,
deny rate, and cache hit rate per checkpoint.
RISKS
| Risk                 | Likelihood | Impact | Mitigation          |
| -------------------- | ---------- | ------ | ------------------- |
| Service code re-     | High       | Medium | CI static analysis  |
| implements           |            |        | rejects new code    |
| authorization        |            |        | that contains if    |
| checks in violation  |            |        | (principal.canX)    |
| of the single-       |            |        | patterns outside    |
| authority rule,      |            |        | the authorization   |
| reintroducing the    |            |        | library. Quarterly  |
| legacy drift.        |            |        | code audit by the   |
ARB.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  41

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation           |
| ------------------- | ---------- | ------ | -------------------- |
| ABAC policy DSL     | Medium     | Medium | DSL is kept          |
| becomes a           |            |        | minimal (10          |
| maintenance         |            |        | constructs).         |
| burden as the       |            |        | Policies are         |
| number of policies  |            |        | reviewed             |
| grows beyond the    |            |        | quarterly. Trigger:  |
| projected 200.      |            |        | if policy count      |
exceeds 500,
revisit the DSL
design.
| Redis cache miss   | Medium | High | Cache warm-up      |
| ------------------ | ------ | ---- | ------------------ |
| storm during cold  |        |      | job pre-populates  |
| start or after     |        |      | high-traffic       |
| invalidation       |        |      | principals. Rate-  |
| causes a           |        |      | limited cache      |
| permission-        |        |      | rebuild.           |
| resolver overload. |        |      | Documented in      |
ADR-068 and
ADR-069.
| Three-checkpoint      | Low | High | Each checkpoint     |
| --------------------- | --- | ---- | ------------------- |
| architecture          |     |      | logs its decision.  |
| creates a false       |     |      | Audit job verifies  |
| sense of security if  |     |      | that all three      |
| any checkpoint is     |     |      | checkpoints ran     |
| silently bypassed.    |     |      | for every request.  |
Anomaly detection
flags requests
with missing
checkpoints.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Defense in depth via three independent  Per-request overhead of ~2ms for
| checkpoints. |     | redundant checks. |     |
| ------------ | --- | ----------------- | --- |
Single source of truth for permission  Service code cannot add custom
| resolution. |     | checks; requires more upfront design. |     |
| ----------- | --- | ------------------------------------- | --- |
RBAC primary with ABAC fallback  Two mental models (roles and policies)
| covers the full decision space. |     | for engineers to learn. |     |
| ------------------------------- | --- | ----------------------- | --- |
Tenant-customizable roles without code  Per-tenant policy compilation adds
| changes. |     | startup time and operational  |     |
| -------- | --- | ----------------------------- | --- |
complexity.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  42

PreOne ADR - Volume 4: Security Architecture v3.0
REJECTED ALTERNATIVES
The single-checkpoint OPA sidecar approach was rejected on three grounds:
latency (sidecar call adds 1-2ms, consuming the entire budget), tenant-
customization (OPA's Rego policies are global; per-tenant customization is
awkward), and operational complexity (a sidecar per service is a significant
infrastructure investment at PreOne's service count). The annotation-only
approach was rejected because it perpetuates the single-layer-of-defense
failure mode that the 2025 Q2 audit identified as the root cause of the cross-
tenant access paths. The commercial policy engine options were rejected on
cost and data-residency grounds, mirroring the ADR-062 reasoning for the
authentication stack. The full reasoning is captured in the Options Considered
table.
MIGRATION PLAN
Migration is phased over two quarters. Phase 1 (weeks 1-6): deploy the
authorization layer alongside the legacy checks; both run, but only the legacy
checks are enforced (the new layer is in shadow mode, logging decisions but
not enforcing). Phase 2 (weeks 7-12): cut over the gateway checkpoint
(Checkpoint 1) for all endpoints; the legacy scope checks are removed. Phase 3
(weeks 13-18): cut over the filter-chain checkpoint (Checkpoint 2) per bounded
context; each context is migrated individually with a one-week rollback
window. Phase 4 (weeks 19-24): cut over the service-layer checkpoint
(Checkpoint 3) per bounded context; this is the largest phase because it
requires removing the ad-hoc if (user.canX) checks from service code. Phase 5
(week 25): the legacy authorization code is removed. Rollback is possible at any
point by re-enabling the legacy checks; the shadow-mode period ensures the
new layer has been validated against production traffic before it enforces.
TESTING STRATEGY
The authorization layer is tested at four levels. Unit tests cover the permission
resolver, the ABAC engine, and each policy; coverage target is 95%. Integration
tests cover the three-checkpoint flow, the tenant-scoping enforcement, and the
cache-invalidation behavior. End-to-end tests cover the full request path for
each principal subtype and each permission. Security tests cover the cross-
tenant access paths (must be denied), the resource-level authorization bugs
(must be denied), and the context-dependent checks (must enforce time,
device, and location constraints). The acceptance criterion is zero authorization
bypasses discovered in the post-cutover penetration test.
MONITORING & OBSERVABILITY
Five golden signals are monitored. (1) Decision latency p99: target under 5ms,
alert above 8ms. (2) Deny rate: target under 5% (legitimate denials), alert
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 43

PreOne ADR - Volume 4: Security Architecture v3.0
above 10% (possible misconfiguration or attack). (3) Cache hit rate: target
above 95%, alert below 90%. (4) Checkpoint coverage: percentage of requests
that ran all three checkpoints; target 100%, alert below 99.9%. (5) ABAC
evaluation rate: percentage of requests that required ABAC; target under 10%,
alert above 20% (may indicate RBAC coverage gap). A dedicated authorization
dashboard surfaces these alongside the per-permission deny breakdown and
the per-tenant authorization anomaly count. Anomaly detection (per ADR-088)
flags unusual deny patterns (spikes, new deny reasons, cross-tenant attempts).
FUTURE EVOLUTION
The authorization layer is expected to evolve in three directions. First, the
ABAC DSL may be replaced by a standard (e.g., a subset of CEL or Rego) if the
in-house DSL proves to be a maintenance burden; the trigger is policy count
exceeding 500 or DSL construct count exceeding 10. Second, the three-
checkpoint architecture may collapse to two if the gateway and filter-chain
checkpoints converge (e.g., if the gateway acquires tenant-aware scope
checks); this is not anticipated within the three-year horizon. Third, the layer
may add a fourth checkpoint for break-glass workflows (operator access during
incidents) if the current break-glass mechanism (documented in the runbook)
proves insufficient; this is monitored but not planned.
RELATED ADRS
● ADR-061 - Identity Model (provides principal_id for authorization)
● ADR-062 - Authentication (authenticates the principal before
authorization)
● ADR-064 - RBAC Model (defines the role hierarchy that feeds the
resolver)
● ADR-065 - Assignment Model (defines how principals are assigned to
roles)
● ADR-067 - Effective Permission Resolver (the single source of truth)
● ADR-068 - Permission Cache (Redis cache for the resolver)
● ADR-076 - API Security (gateway-level scope enforcement)
● ADR-086 - Audit Trail (records every authorization decision)
REFERENCES
● NIST SP 800-162 - Guide to ABAC Definition and Considerations. NIST.
2014.
● OWASP Access Control Cheat Sheet. OWASP Foundation. 2024.
● Spring Security Reference Documentation, Authorization section.
VMware. 2024.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 44

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● Hu, V. et al. - Guide to Attribute Based Access Control (ABAC)
Definition and Considerations. NIST SP 800-162. 2014.
● PreOne Engineering Handbook, Section 4.3 - Authorization
Architecture. Internal. 2025.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Authorization Platform Lead |     |
| ARB Chair   |     | Architecture Review Board   |     |
| Approved On |     | 2025-10-15                  |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  45

PreOne ADR - Volume 4: Security Architecture v3.0
● Authorization Service implemented (Done)
● Permission Resolver integration (ADR-067) (Done)
● Permission Cache integration (ADR-068) (Done)
● API Gateway authorization check (Done)
● Audit logging for all authorization decisions (Done)
● Quarterly access-review process documented (Scheduled)
AD R -064
RBAC Model
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a two-tier RBAC model: a platform-defined system role catalog that
ships with the product and cannot be modified by tenants, and a tenant-
defined custom role catalog that tenant administrators can create, modify,
and assign within their tenant. Roles aggregate permissions; permissions
are the atomic unit of authorization and are defined in ADR-063. Roles
support a single-level parent-child hierarchy for inheritance, with cycle
detection enforced at write time.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on customer
procurement requirement
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 46

PreOne ADR - Volume 4: Security Architecture v3.0
The legacy RBAC model is a flat list of hard-coded roles (STUDENT, TEACHER,
ADMIN, SUPPORT) baked into Spring annotations. It has served PreOne for
four years but cannot meet the demands of the 2026 expansion. Three pain
points motivate this redesign. First, role customization. Schools legitimately
differ in how they organize responsibilities: some have a single Administrator
role, others split it into Principal, Academic Coordinator, and IT Administrator
with distinct permission sets. The legacy model cannot express this without
code changes, which has led to schools abusing the ADMIN role to grant more
access than they need, violating least privilege. Second, role hierarchy. The
legacy model has no inheritance: a Teacher who is also a Department Head
needs both roles assigned explicitly, and any permission change to the Teacher
role must be replicated to Department Head manually. This produces drift and
audit gaps. Third, system vs custom separation. The legacy model conflates
platform-internal roles (SUPPORT, PLATFORM_OPERATOR) with tenant-
visible roles (TEACHER, ADMIN), which has led to tenant administrators
attempting to assign SUPPORT roles to their users (correctly denied, but only
by accident of implementation, not by design). This ADR defines a two-tier
RBAC model that addresses all three pain points. The system role catalog is
owned by the platform team and ships with each release. The custom role
catalog is owned by each tenant and is the primary surface for tenant-specific
role customization. The Effective Permission Resolver (ADR-067) flattens both
catalogs into a permission set for any principal.
BUSINESS DRIVERS
The 2026 international expansion requires that schools in new markets be able
to model their organizational structures without filing customization requests.
EU schools, US K-12 districts, and Indian school chains all have distinct
organizational patterns that the legacy four-role model cannot express. The
business also requires that the platform team be able to evolve the system role
catalog (e.g., adding a PROCTOR role for the new exam-management feature)
without coordinating with every tenant, which the two-tier model enables.
Finally, the regulatory regime requires demonstrable least-privilege
enforcement, which the custom-role capability makes possible by allowing
tenants to grant narrower roles than the system default.
PROBLEM STATEMENT
The legacy flat RBAC model with four hard-coded roles cannot express the
organizational diversity of PreOne's expanding market, does not support role
inheritance, and conflates platform-internal and tenant-visible roles. PreOne
needs a two-tier RBAC model with system and custom catalogs, single-level
inheritance, and clear separation between platform and tenant ownership.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 47

PreOne ADR  -  Volume 4: Security Architecture  v3.0
CONSTRAINTS
● The model must support at least 100 custom roles per tenant without
performance degradation.
● The system role catalog must be versioned and ship with each platform
release; tenants cannot modify it.
● Role inheritance is limited to a single parent to keep the resolver
tractable and auditable.
● Cycle detection must be enforced at write time; the resolver assumes
acyclic inheritance.
● Custom roles cannot grant permissions not present in the system
catalog (no privilege escalation).
● Role changes must be auditable with before/after state per ADR-086.
ASSUMPTIONS
● The permission catalog defined in ADR-063 is the authoritative source
of permissions; roles reference permissions by string ID.
● Single-level inheritance is sufficient for PreOne's organizational
structures; deeper hierarchies are not anticipated.
● Tenant administrators will accept that custom roles are scoped to their
tenant and cannot be shared across tenants.
● The Effective Permission Resolver (ADR-067) handles the flattening of
system + custom + inherited permissions within the 5ms p99 budget.
● Role assignment (ADR-065) is a separate concern; this ADR defines
only the role catalog.
OPTIONS CONSIDERED
| Option             | Pros             | Cons                 | Verdict |
| ------------------ | ---------------- | -------------------- | ------- |
| Two-tier model:    | Clear ownership  | Single-level         | Adopted |
| system catalog     | boundaries.      | inheritance may      |         |
| (immutable,        | Tenant           | be insufficient for  |         |
| platform-owned) +  | customization    | complex              |         |
| custom catalog     | without code     | hierarchies. Two     |         |
| (mutable, tenant-  | changes.         | catalogs add a       |         |
| owned), single-    | Tractable        | small amount of      |         |
| level inheritance. | resolver.        | conceptual           |         |
|                    | Auditable        | overhead.            |         |
inheritance.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  48

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
Flat model with no  Simplest resolver.  Cannot express  Rejected
| inheritance,     | No cycle risk.  | tenant-specific   |     |
| ---------------- | --------------- | ----------------- | --- |
| expanded system  | Easy to audit.  | organizational    |     |
| catalog to 20+   |                 | structures.       |     |
| roles.           |                 | Proliferation of  |     |
system roles per
tenant request.
Rejected by ARB
as not viable for
the 2026
expansion.
| Multi-level      | Maximum           | Resolver             | Rejected |
| ---------------- | ----------------- | -------------------- | -------- |
| inheritance DAG  | flexibility. Can  | complexity grows     |          |
| with arbitrary   | express any       | with depth. Cycle    |          |
| depth.           | organizational    | detection is         |          |
|                  | hierarchy.        | harder. Audit trail  |          |
is harder to read.
Disproportionate
complexity for
PreOne's needs.
| Single catalog  | Single table.   | Loses the clean   | Rejected |
| --------------- | --------------- | ----------------- | -------- |
| with role       | Simpler schema. | separation        |          |
| ownership flag  |                 | between platform  |          |
| (system vs      |                 | and tenant        |          |
| custom), no     |                 | ownership.        |          |
| inheritance.    |                 | Custom roles      |          |
appear alongside
system roles in
the UI, creating
confusion.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  49

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
Adopt a two-tier RBAC model. The system role catalog is owned by the
platform team, ships with each release, and is immutable from the tenant's
perspective. The custom role catalog is owned by each tenant administrator
and supports create, update, and delete of roles scoped to that tenant. Roles
in either catalog reference permissions by string ID from the permission
catalog defined in ADR-063. Custom roles may optionally inherit from a
single parent role (system or custom) via a parent_role_id field; the resolver
flattens inheritance transitively but the schema enforces single-parent at
write time. Custom roles cannot grant permissions absent from the system
catalog (privilege escalation is rejected at write time). All role changes emit
an audit event with before/after state per ADR-086.
DETAILED RATIONALE
The two-tier model was chosen over the flat and DAG models because it is the
simplest model that meets PreOne's requirements. The flat model cannot
express tenant-specific organizational structures, which is a hard requirement
for the 2026 expansion: EU schools need a Bursar role, US K-12 districts need a
Principal role distinct from Administrator, Indian school chains need a Cluster
Coordinator role. Adding all of these to the system catalog would produce a
bloated, confusing role list that is mostly irrelevant to any given tenant. The
custom catalog lets each tenant define exactly the roles it needs, scoped to that
tenant. The DAG model was rejected because the additional flexibility is not
worth the complexity at PreOne's scale. Multi-level inheritance produces
resolver complexity that grows with depth, cycle-detection burden at write
time, and audit trails that are hard to read (a permission grant traced through
four levels of inheritance is harder to reason about than a grant traced through
one). The ARB judged that PreOne's organizational structures can be expressed
with single-level inheritance: a Department Head inherits from Teacher, a
Principal inherits from Administrator, and so on. If a future requirement
emerges for deeper inheritance, the model can be extended without breaking
the single-level cases. The privilege-escalation guard (custom roles cannot
grant permissions absent from the system catalog) is the most important
security property of this model. It ensures that a tenant administrator cannot
escalate their tenant's privileges beyond what the platform allows. The guard is
enforced at write time (the role-create endpoint rejects a custom role that
references an unknown permission) and at read time (the resolver filters out
any permission not in the system catalog, as a defense-in-depth measure
against bugs in the write-time guard). The decision to version the system role
catalog (each role carries a catalog_version) is driven by the platform evolution
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 50

PreOne ADR - Volume 4: Security Architecture v3.0
requirement. When the platform team adds a new feature (e.g., exam
management), it may add new permissions to the catalog and a new system role
(PROCTOR) that aggregates them. Tenants who upgrade to the new platform
version automatically get the new system role available for assignment; tenants
who do not upgrade are unaffected. The version field allows the resolver to
detect version mismatches (e.g., a custom role that references a permission
removed in the current version) and fail safe. The decision to audit all role
changes with before/after state is driven by the regulatory requirement for
demonstrable authorization controls. GDPR Article 32, COPPA verifiable
parental consent, and DPDP Section 8 all require that the platform be able to
answer who changed this role, when, and what was the previous state? The
audit trail (ADR-086) records every role create, update, and delete with the
principal_id of the actor, the timestamp, and the before/after JSONB state. This
is the substrate on which the compliance logging (ADR-087) and security
monitoring (ADR-088) layers are built. The single-parent inheritance design is
the most contentious part of this ADR. The counter-argument is that real
organizations have matrix structures (a Department Head is both a Teacher
and an Administrator) that single-parent inheritance cannot express. The ARB's
response is that matrix structures are expressed through multiple role
assignments (ADR-065), not through multiple inheritance. A principal can be
assigned both the Teacher role and the Department Head role, with
Department Head inheriting from Teacher for the common permissions and
adding the department-specific permissions directly. This is cleaner than
multiple inheritance and produces a flatter, more auditable permission set.
ARCHITECTURE DIAGRAM
+-----------------------------------------------------------+ | PREONE RBAC MODEL
| +-----------------------------------------------------------+ | PERMISSION CATALOG
(ADR-063, platform-owned) | | [gradebook.view] [attendance.edit]
[billing.read] ... | +-----------------------------------------------------------+ |
| v v +-------------------+ +-------------------+ | SYSTEM ROLE
| | CUSTOM ROLE | | CATALOG | | CATALOG (per tenant)| |
(platform-owned, | | (tenant-owned, | | immutable) | | mutable) |
| - STUDENT | | - Department Head | | - TEACHER | | (parent:
TEACHER)| | - ADMINISTRATOR | | - Principal | | - SUPPORT | |
(parent: ADMIN) | | - PROCTOR (v2) | | - Bursar | +-------------------+
+-------------------+ | | +-----------+-----------+
| v +-----------------------+ | EFFECTIVE PERMISSION
| | RESOLVER (ADR-067) | | - flatten inheritance | | -
filter to catalog | | - return permission | | set |
+-----------------------+
SEQUENCE DIAGRAM
Tenant Admin -> RBAC API: Create custom role "Department Head" RBAC API
-> Permission Catalog: Validate referenced permissions Permission Catalog ->
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 51

PreOne ADR - Volume 4: Security Architecture v3.0
RBAC API: All valid RBAC API -> Parent Check: Validate parent_role_id
(TEACHER) Parent Check -> RBAC API: Valid, no cycle RBAC API -> Escalation
Check: Permissions subset of system catalog Escalation Check -> RBAC API: No
escalation RBAC API -> PostgreSQL: INSERT custom_role PostgreSQL -> RBAC
API: role_id RBAC API -> Audit Service: Record CREATE with before/after Audit
Service -> Audit Log: Append RBAC API -> Permission Cache: Invalidate tenant
RBAC API -> Tenant Admin: Return role_id
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-064 — RBAC Model -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Admin UI | CRUD |
Role/Permission | | | | |------->| Service | | |
+----------------+ +----------+-----------+ | | |
| | | persists | | v
| | +----------------+ +----------------------+ | | | Repository | CRUD |
Postgres RBAC tables | | | | |------->| (roles, permissions, | | |
+----------------+ | bundles, assignments)| | |
+----------------------+ | | | | Cache (Redis)
for hot permission lookups | | Invalidation (ADR-069) on
role/permission change | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Permission Resolution Flow: User -> App: action request App -> Permission
Resolver: 'permissions for user X?' Resolver -> Cache (Redis): lookup (cache
miss) Resolver -> Postgres: query roles + bundles + assignments Resolver ->
Cache: store (TTL 5 min) Resolver -> App: effective permissions Cache
Invalidation Flow (on role/permission change): Admin -> RBAC Service: update
role RBAC Service -> Postgres: persist RBAC Service -> Invalidation
Publisher: 'invalidate users with role X' Invalidation Publisher -> Redis: delete
cached entries Invalidation Publisher -> Audit: log 'CACHE_INVALIDATED'
DATABASE IMPACT
RBAC adds two tables. roles holds both system and custom roles with columns
role_id (UUIDv7), tenant_id (NULL for system roles, set for custom roles),
name, description, is_system (boolean), parent_role_id (nullable, self-
referencing FK), catalog_version (for system roles), and created_at/updated_at.
role_permissions is a join table with (role_id, permission_id) pairs; the
permission_id references the permissions table defined in ADR-063. Both tables
are indexed on tenant_id for the common tenant-scoped queries. The roles table
is partitioned by tenant_id for custom roles (one partition per tenant for the
largest, default partition for the rest); system roles live in a separate small
unpartitioned table for query simplicity. A trigger enforces the no-escalation
guard at write time as a defense-in-depth measure.
API IMPACT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 52

PreOne ADR - Volume 4: Security Architecture v3.0
Four new endpoints are introduced under /rbac/roles: GET (list, filtered by
tenant and is_system), POST (create custom role), PUT (update custom role),
and DELETE (soft-delete custom role). The /rbac/roles/{id}/permissions
endpoint manages the role-permission join. System roles are read-only via the
API (GET only); attempts to modify them return 403. The role-create endpoint
validates the no-escalation guard and the cycle-free inheritance before writing;
violations return 400 with a descriptive error. The frontend admin console
exposes a role editor that visualizes the inheritance graph and the permission
delta from the parent role, making it easy for tenant administrators to
understand what a custom role adds.
UI IMPACT
The RBAC model surfaces in the admin UI as the 'Roles', 'Permissions', and
'Bundles' management pages. Admins can create custom roles (name +
description), assign permissions to roles, group permissions into bundles (e.g.,
'Teacher Bundle', 'Admin Bundle'), and assign bundles to users. The UI includes
a 'Permission Matrix' view showing which roles have which permissions
(checkboxes for easy editing). The 'User Detail' page shows the user's assigned
bundles and effective permissions (computed via ADR-067). Changes to roles or
assignments trigger a confirmation modal ('This will affect N users. Continue?')
to prevent accidental bulk permission changes.
SECURITY IMPACT
The two-tier model with the no-escalation guard is the critical security
property. A tenant administrator cannot escalate their tenant's privileges
beyond what the platform allows, even if they have full admin access to their
tenant's role catalog. This protects the platform from malicious or
compromised tenant administrators and protects tenants from their own
mistakes. The single-parent inheritance design keeps the resolver tractable and
auditable, which is essential for the regulatory requirement to demonstrate
least-privilege enforcement. The audit trail of all role changes (per ADR-086)
gives the compliance team the evidence they need for GDPR, COPPA, and DPDP
audits. The version field on system roles allows the platform team to deprecate
and remove permissions safely, with the resolver filtering out deprecated
permissions as a defense-in-depth measure.
PERFORMANCE IMPACT
The RBAC model is read-heavy on the hot path (the resolver queries roles and
role_permissions for every authorization decision) and write-light (role changes
are rare, typically a few per tenant per month). The resolver is cached in Redis
per ADR-068, so the hot-path cost is a Redis lookup, not a database query. Cold-
cache resolution (after invalidation or cold start) requires 2-3 database queries
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 53

PreOne ADR - Volume 4: Security Architecture v3.0
(roles, role_permissions, permission catalog), which takes 5-10ms; this is
amortized across all subsequent requests for the same principal until the cache
expires or is invalidated. Role writes trigger a cache invalidation for the
affected tenant, which causes a brief cold-cache period for that tenant's
principals; the impact is bounded by the cache warm-up job (per ADR-069).
SCALABILITY ANALYSIS
The model scales with the number of roles and assignments, not with request
volume (which is handled by the cache). The projected peak is 100 custom roles
per tenant and 1,000 tenants, giving 100,000 custom roles total. The roles table
at this scale is 100,000 rows plus ~20 system roles, which is well within
PostgreSQL's comfort zone. The role_permissions join table at an average of 10
permissions per role is 1,000,000 rows, also comfortable. The partitioning
strategy (one partition per tenant for the largest) keeps individual partitions
under 1,000 rows for the common tenant-scoped queries. The resolver's
transitive inheritance walk is bounded by the single-parent constraint (max
depth 2: custom role -> parent role), so no scalability concern there.
OPERATIONAL CONSIDERATIONS
The RBAC subsystem is deployed as a Spring library embedded in the main
backend. The system role catalog is versioned and ships with each release; the
migration to a new catalog version is a blue-green deployment with a
compatibility window during which both versions are accepted. The on-call
runbook covers three failure modes: resolver cache miss storm (handled per
ADR-069), role-write conflict (optimistic locking retry), and catalog-version
mismatch (fail safe, return empty permission set with alert). The role editor in
the admin console is the primary surface for tenant administrators; it includes a
dry-run mode that shows the resolved permission set before the role is saved,
reducing the risk of misconfiguration. Each failure mode is tested in the
quarterly game-day.
RISKS
Risk Likelihood Impact Mitigation
Tenant Medium Medium Role editor shows
administrators permission delta
create overly from parent. Dry-
permissive custom run mode shows
roles, defeating resolved
least-privilege permission set.
intent. Quarterly least-
privilege audit by
the platform team.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 54

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation         |
| ------------------- | ---------- | ------ | ------------------ |
| Single-parent       | Low        | Medium | Model can be       |
| inheritance is      |            |        | extended to multi- |
| insufficient for a  |            |        | parent without     |
| future tenant's     |            |        | breaking single-   |
| matrix              |            |        | parent cases.      |
| organization,       |            |        | Trigger: any       |
| forcing a model     |            |        | tenant requesting  |
| redesign.           |            |        | multi-parent       |
inheritance forces
a redesign ADR.
| System role         | Medium | High | Deprecation is    |
| ------------------- | ------ | ---- | ----------------- |
| catalog version     |        |      | phased: mark      |
| migration disrupts  |        |      | deprecated ->     |
| tenants with        |        |      | notify tenant ->  |
| custom roles        |        |      | resolver filters  |
| referencing         |        |      | deprecated ->     |
| deprecated          |        |      | remove. Minimum   |
| permissions.        |        |      | 90-day window     |
per deprecation.
| Resolver cache      | Medium | Medium | Bulk role changes  |
| ------------------- | ------ | ------ | ------------------ |
| invalidation storm  |        |        | are batched and    |
| during a bulk role  |        |        | rate-limited.      |
| change (e.g., year- |        |        | Cache warm-up      |
| end role reset)     |        |        | job pre-populates  |
| overloads the       |        |        | affected           |
| database.           |        |        | principals.        |
Documented in
ADR-069.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Tenant-specific role customization  Two catalogs add conceptual overhead
| without code changes. |     | and a small amount of query  |     |
| --------------------- | --- | ---------------------------- | --- |
complexity.
Single-parent inheritance keeps the  Matrix organizations must be expressed
resolver tractable and auditable. via multiple assignments, not multiple
inheritance.
No-escalation guard protects against  Tenants cannot grant permissions
malicious or compromised tenant  beyond the system catalog, even if they
| admins. |     | have a legitimate edge case. |     |
| ------- | --- | ---------------------------- | --- |
Versioned system catalog enables safe  Deprecation workflow adds operational
| platform evolution. |     | overhead for the platform team. |     |
| ------------------- | --- | ------------------------------- | --- |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  55

PreOne ADR - Volume 4: Security Architecture v3.0
REJECTED ALTERNATIVES
The flat model with an expanded system catalog was rejected because it cannot
express tenant-specific organizational structures without bloating the system
catalog with mostly-irrelevant roles. The multi-level inheritance DAG was
rejected because the additional flexibility is not worth the resolver complexity,
cycle-detection burden, and audit-trail readability cost at PreOne's scale;
single-level inheritance covers the projected organizational structures. The
single-catalog-with-ownership-flag approach was rejected because it loses the
clean separation between platform and tenant ownership, creating UI
confusion and making the no-escalation guard harder to enforce. The full
reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter. Phase 1 (weeks 1-3): create the roles and
role_permissions tables, populate the system role catalog from the legacy hard-
coded roles, and deploy the resolver in shadow mode (logging decisions but not
enforcing). Phase 2 (weeks 4-6): migrate existing role assignments (per
ADR-065) from the legacy role strings to the new role_id references; a nightly
reconciliation job flags drift. Phase 3 (weeks 7-9): enable the custom role
catalog for a pilot group of 10 tenants; collect feedback and iterate the role
editor UX. Phase 4 (weeks 10-12): enable the custom role catalog for all
tenants; the legacy role strings are deprecated. Phase 5 (week 13): the legacy
role strings are removed. Rollback is possible at any point in phases 1-3 by re-
pointing the resolver at the legacy role strings; the shadow-mode period
ensures the new model has been validated against production traffic before it
enforces.
TESTING STRATEGY
The RBAC model is tested at three levels. Unit tests cover the resolver (role
flattening, inheritance, escalation guard), the role-create validation, and the
cycle-detection logic; coverage target is 95%. Integration tests cover the role
editor flow, the cache invalidation behavior, and the catalog-version migration.
End-to-end tests cover the full create-role -> assign-role -> authorize-request
path. Security tests cover the no-escalation guard (must reject custom roles
that grant unknown permissions), the tenant-scoping enforcement (must reject
cross-tenant role references), and the cycle-detection (must reject cyclic
inheritance). The acceptance criterion is zero authorization bypasses
discovered in the post-cutover penetration test.
MONITORING & OBSERVABILITY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 56

PreOne ADR - Volume 4: Security Architecture v3.0
Four golden signals are monitored. (1) Resolver latency p99: target under 5ms,
alert above 8ms. (2) Cache hit rate: target above 95%, alert below 90%. (3)
Role-write rate: target under 10 per tenant per month, alert on spikes (possible
abuse or misconfiguration). (4) Escalation-guard rejection rate: target under
0.1% of role-create attempts, alert above 1% (possible attack or UI bug). A
dedicated RBAC dashboard surfaces these alongside the per-tenant role count,
the per-tenant custom-role distribution, and the system-catalog version
adoption. Anomaly detection (per ADR-088) flags unusual role-change patterns
(bulk changes, off-hours changes, changes by non-admin principals).
FUTURE EVOLUTION
The model is expected to evolve in three directions. First, the single-parent
inheritance may be extended to multi-parent if a tenant requirement emerges
that cannot be expressed via multiple assignments; the trigger is a formal
request from a paying tenant. Second, the system role catalog may grow to
include feature-specific roles (e.g., a LIBRARIAN role for the planned library-
management feature); this is a routine platform evolution, not a model change.
Third, the model may add a role-template concept (a system role that tenants
can clone as a starting point for custom roles) to reduce the cold-start effort for
new tenants; this is monitored but not planned for v1.
RELATED ADRS
● ADR-061 - Identity Model (principals are assigned roles)
● ADR-063 - Authorization (permissions are the atomic unit referenced by
roles)
● ADR-065 - Assignment Model (how principals are assigned to roles)
● ADR-066 - Bundle Strategy (predefined role bundles for common
patterns)
● ADR-067 - Effective Permission Resolver (flattens roles into permission
sets)
● ADR-068 - Permission Cache (caches resolved permission sets)
● ADR-086 - Audit Trail (records all role changes)
● ADR-043 - Tenant Isolation (custom roles are tenant-scoped)
REFERENCES
● NIST SP 800-162 - Guide to ABAC Definition and Considerations,
Section 3 (RBAC comparison). NIST. 2014.
● Sandhu, R. et al. - Role-Based Access Control Models. ACM
Transactions on Information and System Security. 1996.
● OWASP Access Control Cheat Sheet, RBAC section. OWASP
Foundation. 2024.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 57

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● ISO/IEC 21295:2018 - Information technology - Security techniques -
Entity-based access control. ISO. 2018.
● PreOne Engineering Handbook, Section 4.4 - RBAC Model. Internal.
2025.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Authorization Platform Lead |     |
| ARB Chair   |     | Architecture Review Board   |     |
| Approved On |     | 2025-10-15                  |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  58

PreOne ADR - Volume 4: Security Architecture v3.0
● Roles, Permissions, Bundles, Assignments tables deployed (Done)
● Admin UI for role/bundle management (Done)
● Permission Matrix view implemented (Done)
● Default roles (admin, teacher, parent, student) pre-loaded (Done)
● Quarterly role-review process (Scheduled)
AD R -065
Assignment Model
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a direct-assignment model with optional delegation: principals are
assigned roles directly via a role_assignments table, and any principal with
the delegate permission may delegate a subset of their own roles to another
principal within the same tenant. Assignments carry an optional expiration
timestamp and an optional scope (e.g., a class_id or school_id) that
constrains the role's applicability. All assignments are auditable and
revocable.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 59

PreOne ADR - Volume 4: Security Architecture v3.0
The legacy assignment model is a simple user_role join table with (user_id,
role_string) pairs, no expiration, no scope, and no delegation. It has produced
two operational pain points. First, expiration. The school year ends in June, but
role assignments persist indefinitely until manually revoked. A teacher who
moves to a new school keeps their old school's TEACHER role until an
administrator notices and revokes it, which often takes months. The 2025 Q2
audit found 1,200 stale assignments across the platform, 47 of which had been
used to access resources after the principal's official departure date. Second,
scope. The TEACHER role grants gradebook.view for any class in the tenant,
but a teacher should only view gradebooks for classes they teach. The legacy
model has no way to express this, so the application layer adds if (teacher
teaches this class) checks scattered through the code, which is the same anti-
pattern that ADR-063 rejected for authorization in general. Third, delegation.
A principal who needs to delegate a task (e.g., a department head delegating
grade-review duties to an assistant during an absence) has no clean way to do
so. They either share their credentials (a security violation) or an administrator
grants the assistant a full TEACHER role (over-broad). Neither is satisfactory.
This ADR defines an assignment model that addresses all three pain points.
Assignments carry expiration and scope, and a delegation mechanism allows
principals to delegate subsets of their own roles within their tenant. The
Effective Permission Resolver (ADR-067) flattens direct and delegated
assignments into a permission set, applying scope and expiration at resolution
time.
BUSINESS DRIVERS
The 2026 international expansion requires that the platform support school-
year-aligned role expiration, which is a hard requirement in EU and US K-12
markets where the academic calendar drives staffing. The business also
requires that the platform support scoped assignments (a teacher assigned to a
specific class, not the whole tenant) to satisfy least-privilege expectations
under GDPR and DPDP. Finally, the business requires a delegation mechanism
to support the substitute-teacher workflow that is common in all three target
markets: a regular teacher delegates their class-scoped authority to a
substitute for the duration of an absence, without granting the substitute
tenant-wide access.
PROBLEM STATEMENT
The legacy assignment model lacks expiration, scope, and delegation,
producing stale assignments, over-broad access, and insecure credential
sharing as workarounds. PreOne needs an assignment model with optional
expiration, optional scope, and a delegation mechanism that respects tenant
boundaries and least privilege.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 60

PreOne ADR  -  Volume 4: Security Architecture  v3.0
CONSTRAINTS
● Assignments must support optional expiration (timestamp) and optional
scope (resource ID + resource type).
● Delegation must be transitive-bounded: A delegates to B, but B cannot
delegate further (no chains longer than 1).
● Delegation must be revocable by either the delegator or a tenant
administrator at any time.
● Assignments cannot grant roles from another tenant (cross-tenant
delegation is forbidden).
● Expired assignments must be lazily filtered by the resolver (no
background job required for correctness).
● All assignment changes must be auditable with principal_id of actor,
before/after state per ADR-086.
ASSUMPTIONS
● The RBAC model defined in ADR-064 is the source of role definitions;
assignments reference role_id.
● The Effective Permission Resolver (ADR-067) applies scope and
expiration at resolution time.
● Delegation depth of 1 is sufficient for PreOne's workflows (substitute
teacher, temporary department head).
● Scope is expressed as (resource_type, resource_id) pairs (e.g., CLASS,
class-123) and enforced by the resolver.
● Tenant administrators will accept that delegation is a principal-level
action they cannot override (only revoke).
OPTIONS CONSIDERED
| Option             | Pros                | Cons               | Verdict |
| ------------------ | ------------------- | ------------------ | ------- |
| Direct assignment  | Addresses all       | Single-level       | Adopted |
| with optional      | three pain points.  | delegation may be  |         |
| expiration,        | Simple resolver     | insufficient for   |         |
| optional scope,    | (flatten direct +   | complex            |         |
| and single-level   | delegated, apply    | workflows. Scope   |         |
| delegation.        | scope +             | adds resolver      |         |
|                    | expiration).        | complexity.        |         |
Auditable.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  61

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option             | Pros              | Cons                | Verdict  |
| ------------------ | ----------------- | ------------------- | -------- |
| Direct assignment  | Simplest model.   | Cannot express      | Rejected |
| with expiration    | No transitive-    | substitute-teacher  |          |
| and scope, no      | delegation risk.  | workflow without    |          |
| delegation.        | Easy to audit.    | admin               |          |
intervention.
Forces credential
sharing as a
workaround.
| Direct assignment   | Maximum           | Resolver           | Rejected |
| ------------------- | ----------------- | ------------------ | -------- |
| with unlimited      | flexibility. Can  | complexity grows   |          |
| transitive          | express any       | with chain depth.  |          |
| delegation (A -> B  | delegation chain. | Revocation is      |          |
| -> C -> ...).       |                   | complex (must      |          |
propagate down
the chain). Audit
trail is hard to
read.
Disproportionate
complexity for
PreOne's needs.
| Attribute-based   | Maximum             | Rejected the      | Rejected |
| ----------------- | ------------------- | ----------------- | -------- |
| assignment        | flexibility. Scope  | ABAC-primary      |          |
| (ABAC) replacing  | and expiration are  | approach in       |          |
| RBAC entirely.    | natural attributes. | ADR-063; ABAC is  |          |
the fallback, not
the primary.
Would require
redesigning the
entire
authorization
stack.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  62

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
Adopt a direct-assignment model with optional expiration, optional scope,
and single-level delegation. The role_assignments table records
(principal_id, role_id, tenant_id, scope_type, scope_id, expires_at,
assigned_by, assigned_at) for direct assignments and (principal_id, role_id,
tenant_id, scope_type, scope_id, expires_at, delegated_by, delegated_at) for
delegated assignments. Delegation is single-level: a delegated assignment
cannot be further delegated (enforced at write time). Delegation is
revocable by the delegator or a tenant administrator. The resolver
(ADR-067) flattens direct and delegated assignments, applies scope and
expiration, and returns the effective permission set. All assignment changes
emit an audit event per ADR-086.
DETAILED RATIONALE
The direct-assignment model with delegation was chosen over the no-
delegation and unlimited-delegation alternatives because it is the simplest
model that meets PreOne's substitute-teacher workflow requirement. The no-
delegation model forces the substitute-teacher workflow to go through a tenant
administrator, which adds latency (the admin must be available) and over-
grants (the substitute typically receives a full TEACHER role rather than a
class-scoped delegation). The unlimited-delegation model adds resolver
complexity (transitive delegation chains), revocation complexity (cascading
revocation), and audit complexity (chains are hard to read) that are
disproportionate to PreOne's needs. The single-level delegation constraint is
enforced at write time: the assignment-create endpoint checks whether the
delegator's own assignment is a direct assignment (not a delegated one) and
rejects the delegation if not. This is a simple check that prevents delegation
chains from forming. The constraint is also enforced at read time by the
resolver as a defense-in-depth measure: even if a delegated assignment
somehow has a delegated_by field that points to another delegated assignment,
the resolver ignores it. The scope mechanism is the most important addition.
Scope is expressed as (scope_type, scope_id) pairs: a teacher assigned the
TEACHER role with scope (CLASS, class-123) has the TEACHER role's
permissions only for the class-123 resource, not for the whole tenant. The
resolver applies scope at resolution time: a permission check for
gradebook.view on class-123 succeeds, but the same check on class-456 fails
(assuming no other assignment grants it). Scope is optional; an assignment
without scope applies to the whole tenant, which is the legacy behavior. This
backward compatibility is important for the migration: existing assignments
are imported without scope, and scoped assignments are introduced
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 63

PreOne ADR - Volume 4: Security Architecture v3.0
incrementally per bounded context. The expiration mechanism is the second
important addition. An assignment with an expires_at timestamp is lazily
filtered by the resolver: at resolution time, the resolver checks whether
expires_at is in the past and, if so, excludes the assignment from the permission
set. A nightly job soft-deletes expired assignments for hygiene (to keep the
role_assignments table from growing without bound), but correctness does not
depend on the job running. This is the lazy-expiration pattern, which is robust
to job failures. The decision to allow delegation to be revoked by either the
delegator or a tenant administrator (but not by the delegatee) is driven by the
principle that delegation is a grant, not a contract. The delegator can revoke
because they granted; the administrator can revoke because they have tenant-
wide authority. The delegatee cannot revoke because revocation is not their
action (they can simply not use the delegated authority, which is functionally
equivalent). This asymmetry simplifies the revocation logic and the audit trail.
The decision to forbid cross-tenant delegation is driven by the tenant-isolation
requirement (ADR-043). A principal in tenant A cannot delegate to a principal in
tenant B, even if both are part of the same school chain (multi-tenant
organizations are modeled as separate tenants per ADR-043, with a platform-
level operator role for cross-tenant administration). This prevents the cross-
tenant access paths that the 2025 Q2 audit identified as the legacy model's
most serious failure. The audit trail of all assignment changes (per ADR-086) is
the substrate on which the compliance logging (ADR-087) and security
monitoring (ADR-088) layers are built. Every assignment create, update (scope
or expiration change), and delete is recorded with the principal_id of the actor,
the timestamp, and the before/after JSONB state. This is the evidence the
compliance team needs for GDPR, COPPA, and DPDP audits, and the evidence
the security team needs to detect anomalous assignment patterns (e.g., a
principal suddenly receiving a large number of delegations, which may indicate
a compromised account).
ARCHITECTURE DIAGRAM
+-----------------------------------------------------------+ | PREONE ASSIGNMENT
MODEL | +-----------------------------------------------------------+ |
role_assignments (PostgreSQL, tenant-scoped) | | - assignment_id
(UUIDv7, PK) | | - principal_id (FK -> identities) |
| - role_id (FK -> roles) | | - tenant_id (FK -> tenants)
| | - scope_type, scope_id (optional) | | - expires_at (optional)
| | - assigned_by (direct) OR delegated_by (delegated) | | - assigned_at /
delegated_at | +-----------------------------------------------------------+
| v +-----------------------+ +-----------------------+ | DIRECT ASSIGNMENT
| | DELEGATED ASSIGNMENT | | (assigned_by = admin) | |
(delegated_by = user) | | - no chain | | - single-level only | | - full
admin control | | - revocable by either | +-----------+-----------+ +-----------
+-----------+ | | +----------------+----------------+
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 64

PreOne ADR - Volume 4: Security Architecture v3.0
| v +------------------------+ | EFFECTIVE
PERMISSION | | RESOLVER (ADR-067) | | - flatten
direct+deleg | | - apply scope filter | | - apply expiration
| | - return permission set| +------------------------+
SEQUENCE DIAGRAM
Teacher -> Assignment API: Delegate TEACHER role to Substitute Assignment
API -> Delegator Check: Validate teacher has TEACHER (direct) Delegator
Check -> Assignment API: Valid, direct assignment Assignment API -> Tenant
Check: Both principals in same tenant Tenant Check -> Assignment API: Same
tenant Assignment API -> Scope Check: Apply scope (CLASS, class-123)
Assignment API -> Expiration: Set expires_at (end of week) Assignment API ->
PostgreSQL: INSERT role_assignment PostgreSQL -> Assignment API:
assignment_id Assignment API -> Audit Service: Record DELEGATE event Audit
Service -> Audit Log: Append Assignment API -> Permission Cache: Invalidate
substitute Assignment API -> Teacher: Return assignment_id
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-065 — Assignment Model -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Admin UI | CRUD |
Role/Permission | | | | |------->| Service | | |
+----------------+ +----------+-----------+ | | |
| | | persists | | v
| | +----------------+ +----------------------+ | | | Repository | CRUD |
Postgres RBAC tables | | | | |------->| (roles, permissions, | | |
+----------------+ | bundles, assignments)| | |
+----------------------+ | | | | Cache (Redis)
for hot permission lookups | | Invalidation (ADR-069) on
role/permission change | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Permission Resolution Flow: User -> App: action request App -> Permission
Resolver: 'permissions for user X?' Resolver -> Cache (Redis): lookup (cache
miss) Resolver -> Postgres: query roles + bundles + assignments Resolver ->
Cache: store (TTL 5 min) Resolver -> App: effective permissions Cache
Invalidation Flow (on role/permission change): Admin -> RBAC Service: update
role RBAC Service -> Postgres: persist RBAC Service -> Invalidation
Publisher: 'invalidate users with role X' Invalidation Publisher -> Redis: delete
cached entries Invalidation Publisher -> Audit: log 'CACHE_INVALIDATED'
DATABASE IMPACT
The role_assignments table replaces the legacy user_role join table. Columns:
assignment_id (UUIDv7 PK), principal_id (FK), role_id (FK), tenant_id (FK),
scope_type (enum: CLASS, SCHOOL, DEPARTMENT, TENANT), scope_id
(nullable, resource ID), expires_at (nullable, timestamptz), assigned_by
(nullable, principal_id of admin for direct), delegated_by (nullable, principal_id
of delegator for delegated), assigned_at, delegated_at. Exactly one of
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 65

PreOne ADR - Volume 4: Security Architecture v3.0
assigned_by or delegated_by is non-null. The table is partitioned by tenant_id.
Indexes on (principal_id, tenant_id) for resolution, (delegated_by) for
revocation lookups, and (expires_at) for the nightly cleanup job. The legacy
user_role table is retained in read-only mode for the migration window and then
archived.
API IMPACT
Six endpoints are introduced under /assignments: GET (list, filtered by
principal, role, tenant), POST (create direct or delegated assignment), PUT
(update scope or expiration), DELETE (revoke), GET /{id} (detail), and POST
/{id}/revoke (explicit revoke). The create endpoint enforces the single-level
delegation constraint (delegated assignments cannot be further delegated) and
the same-tenant constraint (delegator and delegatee must be in the same
tenant). The frontend admin console exposes an assignment editor that
visualizes the delegation graph and the scope, making it easy for administrators
to understand who has what authority over which resources. The substitute-
teacher workflow is a dedicated UI flow that pre-fills the scope and expiration
for common cases.
UI IMPACT
The RBAC model surfaces in the admin UI as the 'Roles', 'Permissions', and
'Bundles' management pages. Admins can create custom roles (name +
description), assign permissions to roles, group permissions into bundles (e.g.,
'Teacher Bundle', 'Admin Bundle'), and assign bundles to users. The UI includes
a 'Permission Matrix' view showing which roles have which permissions
(checkboxes for easy editing). The 'User Detail' page shows the user's assigned
bundles and effective permissions (computed via ADR-067). Changes to roles or
assignments trigger a confirmation modal ('This will affect N users. Continue?')
to prevent accidental bulk permission changes.
SECURITY IMPACT
The assignment model directly enables least-privilege enforcement via scope. A
teacher with a class-scoped TEACHER role cannot access other classes'
gradebooks, which closes the over-broad access path that the legacy model
allowed. The expiration mechanism closes the stale-assignment path that the
2025 Q2 audit identified (1,200 stale assignments, 47 of which were used after
the principal's departure). The single-level delegation constraint prevents
delegation chains from forming, which keeps the resolver tractable and the
audit trail readable. The same-tenant constraint closes the cross-tenant
delegation path that would otherwise be a tenant-isolation violation. The audit
trail of all assignment changes gives the compliance team the evidence they
need for GDPR Article 32, COPPA, and DPDP Section 8 audits.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 66

PreOne ADR - Volume 4: Security Architecture v3.0
PERFORMANCE IMPACT
The assignment model is read-heavy on the hot path (the resolver queries
role_assignments for every authorization decision) and write-light (assignment
changes are rare, typically a few per principal per month). The resolver is
cached in Redis per ADR-068, so the hot-path cost is a Redis lookup. Cold-cache
resolution requires 1-2 database queries (role_assignments by principal_id,
optionally roles by role_id), which takes 3-5ms. The scope and expiration filters
are applied in-memory by the resolver after the cache lookup, adding negligible
overhead. Assignment writes trigger a cache invalidation for the affected
principal and tenant, which causes a brief cold-cache period; the impact is
bounded by the cache warm-up job (per ADR-069).
SCALABILITY ANALYSIS
The model scales with the number of assignments, projected to grow from two
hundred thousand to four million over three years (one assignment per
principal on average, with delegations adding 10-20%). The role_assignments
table at this scale is 4 million rows, partitioned by tenant_id, with the largest
tenant partitions under 500,000 rows. The (principal_id, tenant_id) index
supports the common resolution query in under 5ms at p99. The (delegated_by)
index supports the revocation lookup in under 5ms. The (expires_at) index
supports the nightly cleanup job efficiently. The resolver's scope and expiration
filters are in-memory and add no scalability concern. No architectural ceiling is
anticipated within the three-year planning horizon.
OPERATIONAL CONSIDERATIONS
The assignment subsystem is deployed as a Spring library embedded in the
main backend. The nightly cleanup job soft-deletes expired assignments; the
job is idempotent and can be re-run safely. The on-call runbook covers three
failure modes: resolver cache miss storm (handled per ADR-069), assignment-
write conflict (optimistic locking retry), and delegation-chain violation (write-
time rejection, no runtime impact). The substitute-teacher workflow is the
primary user-facing surface; it is documented in the teacher handbook and
tested in the quarterly game-day. The assignment editor in the admin console
includes a dry-run mode that shows the resolved permission set before the
assignment is saved, reducing the risk of over-granting.
RISKS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 67

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation          |
| ------------------- | ---------- | ------ | ------------------- |
| Delegation is       | Medium     | Medium | Delegations         |
| abused to grant     |            |        | require expires_at  |
| persistent access   |            |        | (max 30 days).      |
| that should be      |            |        | Auto-revocation at  |
| temporary           |            |        | expiration. Weekly  |
| (delegator forgets  |            |        | digest to           |
| to revoke).         |            |        | delegators of       |
active delegations.
| Scope is not     | Medium | High | Resolver applies    |
| ---------------- | ------ | ---- | ------------------- |
| applied          |        |      | scope centrally;    |
| consistently     |        |      | bounded contexts    |
| across bounded   |        |      | cannot bypass.      |
| contexts,        |        |      | Quarterly scope-    |
| producing over-  |        |      | coverage audit. CI  |
| broad access in  |        |      | checks for          |
| some paths.      |        |      | resource-type       |
registration.
| Single-level           | Low | Medium | Model can be       |
| ---------------------- | --- | ------ | ------------------ |
| delegation is          |     |        | extended to multi- |
| insufficient for a     |     |        | level without      |
| future workflow        |     |        | breaking single-   |
| (e.g., district-level  |     |        | level cases.       |
| cascading              |     |        | Trigger: formal    |
| delegation).           |     |        | request from a     |
district-level
deployment.
| Stale assignments   | Low | Low | Correctness does   |
| ------------------- | --- | --- | ------------------ |
| accumulate if the   |     |     | not depend on the  |
| nightly cleanup     |     |     | job (lazy          |
| job fails silently. |     |     | expiration). Job   |
failure alerts on
the dashboard. Job
is idempotent and
re-runnable.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Expiration closes the stale-assignment  Principals may lose access unexpectedly
path and reduces manual revocation  if expiration is set too aggressively.
burden.
Scope enables least-privilege per  Resolver complexity increases with
| resource, not just per tenant. |     | scope filtering. |     |
| ------------------------------ | --- | ---------------- | --- |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  68

PreOne ADR - Volume 4: Security Architecture v3.0
We Gain We Lose
Single-level delegation supports the Complex delegation chains require
substitute-teacher workflow cleanly. administrator intervention, not self-
service.
Same-tenant constraint closes cross- Multi-tenant organizations cannot
tenant delegation paths. delegate across tenants without
operator involvement.
REJECTED ALTERNATIVES
The no-delegation model was rejected because it forces the substitute-teacher
workflow through a tenant administrator, adding latency and over-granting
access (the substitute receives a full TEACHER role rather than a class-scoped
delegation). The unlimited-transitive-delegation model was rejected because
the resolver complexity, revocation complexity, and audit-trail readability cost
are disproportionate to PreOne's needs; single-level delegation covers the
substitute-teacher and temporary-department-head workflows. The ABAC-
replaces-RBAC option was rejected because ADR-063 already decided that
RBAC is the primary mechanism with ABAC as the fallback; replacing RBAC
entirely would require redesigning the entire authorization stack. The full
reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter. Phase 1 (weeks 1-3): create the
role_assignments table, deploy the resolver in shadow mode (logging decisions
but not enforcing). Phase 2 (weeks 4-6): migrate existing user_role rows to
role_assignments without scope or expiration (legacy behavior preserved); a
nightly reconciliation job flags drift. Phase 3 (weeks 7-9): enable scoped
assignments for a pilot bounded context (gradebook); collect feedback and
iterate the resolver's scope filtering. Phase 4 (weeks 10-12): enable scoped
assignments for all bounded contexts; enable delegation for all tenants. Phase 5
(week 13): the legacy user_role table is marked read-only and a final
reconciliation is performed. Rollback is possible at any point in phases 1-3 by
re-pointing the resolver at the legacy user_role table.
TESTING STRATEGY
The assignment model is tested at three levels. Unit tests cover the resolver
(scope filtering, expiration filtering, delegation flattening), the assignment-
create validation (single-level delegation, same-tenant, scope validity), and the
revocation logic; coverage target is 95%. Integration tests cover the delegation
workflow (create, use, revoke), the scope enforcement across bounded
contexts, and the expiration behavior (lazy filtering and nightly cleanup). End-
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 69

PreOne ADR - Volume 4: Security Architecture v3.0
to-end tests cover the substitute-teacher workflow from delegation to
authorization to revocation. Security tests cover the cross-tenant delegation
rejection, the delegation-chain rejection, and the scope-bypass attempts. The
acceptance criterion is zero authorization bypasses discovered in the post-
cutover penetration test.
MONITORING & OBSERVABILITY
Four golden signals are monitored. (1) Resolver latency p99: target under 5ms,
alert above 8ms. (2) Cache hit rate: target above 95%, alert below 90%. (3)
Assignment-write rate: target under 100 per tenant per month, alert on spikes
(possible abuse or year-end processing). (4) Expired-assignment cleanup lag:
target under 24 hours, alert above 48 hours (job may be stuck). A dedicated
assignment dashboard surfaces these alongside the per-tenant assignment
count, the delegation graph depth, and the scope-coverage percentage.
Anomaly detection (per ADR-088) flags unusual assignment patterns (bulk
delegations, off-hours assignments, assignments by non-admin principals).
FUTURE EVOLUTION
The model is expected to evolve in three directions. First, the single-level
delegation may be extended to multi-level if a district-level deployment
requires cascading delegation; the trigger is a formal request from a district
customer. Second, the scope mechanism may add new scope types (e.g.,
TIME_PERIOD for term-bound roles) as new bounded contexts adopt scoped
assignments; this is a routine extension, not a model change. Third, the model
may add a role-request workflow (principals request assignments that an
administrator approves) to reduce the administrator burden for common cases;
this is monitored but not planned for v1.
RELATED ADRS
● ADR-061 - Identity Model (principals are the subject of assignments)
● ADR-063 - Authorization (resolver consumes assignments)
● ADR-064 - RBAC Model (roles are the object of assignments)
● ADR-066 - Bundle Strategy (bundles create multiple assignments
atomically)
● ADR-067 - Effective Permission Resolver (flattens assignments into
permission sets)
● ADR-068 - Permission Cache (caches resolved permission sets)
● ADR-086 - Audit Trail (records all assignment changes)
● ADR-043 - Tenant Isolation (assignments are tenant-scoped)
REFERENCES
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 70

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● NIST SP 800-162 - Guide to ABAC Definition and Considerations,
Section on Scope. NIST. 2014.
● Sandhu, R. - Lattice-Based Access Control Models. IEEE Computer.
1993.
● OWASP Access Control Cheat Sheet, Delegation section. OWASP
Foundation. 2024.
● PreOne Engineering Handbook, Section 4.5 - Assignment Model.
Internal. 2025.
● Coyne, E. and Weil, T. - ABAC and RBAC: Scalable, Flexible, and
Auditable. IT Professional. 2013.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Authorization Platform Lead |     |
| ARB Chair   |     | Architecture Review Board   |     |
| Approved On |     | 2025-10-15                  |     |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  71

PreOne ADR - Volume 4: Security Architecture v3.0
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Roles, Permissions, Bundles, Assignments tables deployed (Done)
● Admin UI for role/bundle management (Done)
● Permission Matrix view implemented (Done)
● Default roles (admin, teacher, parent, student) pre-loaded (Done)
● Quarterly role-review process (Scheduled)
AD R -066
Bundle Strategy
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a role-bundle abstraction: a bundle is a named, versioned collection
of role assignments that is applied atomically to a principal. Bundles serve
two purposes: they reduce the administrative burden of common multi-role
assignment patterns (e.g., the New Teacher bundle assigns TEACHER,
ATTENDANCE_TAKER, and PARENT_COMMUNICATOR in one action),
and they encode institutional policy (e.g., the Standard School Staff bundle
is the tenant-administrator-approved baseline for all staff). Bundles are
tenant-customizable and auditable.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 72

PreOne ADR - Volume 4: Security Architecture v3.0
Review Cadence Annual review, or on security
incident, or on customer
procurement requirement
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The legacy model has no bundle concept. A new teacher joining a school
requires an administrator to manually assign four to six roles (TEACHER,
ATTENDANCE_TAKER, GRADEBOOK_EDITOR, PARENT_COMMUNICATOR,
and optionally PROCTOR and CLUB_ADVISOR), each through a separate API
call. The process is error-prone: the 2025 Q2 audit found that 18% of new-
teacher onboarding resulted in at least one missing role, requiring a support
ticket to remediate, and 7% resulted in at least one extra role, violating least
privilege. The ARB considered three approaches to this problem. The first is to
leave the assignment process manual and improve the admin console UI to
suggest role groups. The second is to introduce a bundle abstraction that
captures the common patterns as named, reusable objects. The third is to
introduce a policy engine that automatically assigns roles based on attributes
(e.g., role = TEACHER -> assign ATTENDANCE_TAKER automatically). The
ARB selected the bundle approach because it is explicit, auditable, and tenant-
customizable, whereas the policy-engine approach is implicit and harder to
audit, and the UI-suggestion approach does not solve the atomicity problem (an
interrupted onboarding still leaves the principal in an inconsistent state). This
ADR defines the bundle abstraction. Bundles are not a new authorization
mechanism; they are a convenience layer over the assignment model defined in
ADR-065. When a bundle is applied to a principal, the system creates the
constituent assignments atomically (all or nothing), with the bundle's metadata
recorded in the audit trail for traceability.
BUSINESS DRIVERS
The 2026 international expansion requires that the platform support bulk
onboarding (e.g., 200 new teachers at the start of an EU school year) without
per-teacher administrative overhead. The business also requires that the
platform encode institutional policy (e.g., every staff member must have the
SAFETY_REPORTER role for mandated-reporter compliance) in a way that is
auditable and cannot be accidentally omitted. Finally, the business requires
that tenant administrators be able to customize the bundles for their institution
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 73

PreOne ADR - Volume 4: Security Architecture v3.0
(e.g., a school that requires all teachers to also be club advisors) without code
changes.
PROBLEM STATEMENT
The legacy per-role assignment process is error-prone (18% of onboardings
have missing roles, 7% have extra roles), cannot express institutional policy
baselines, and does not support bulk onboarding. PreOne needs a bundle
abstraction that captures common multi-role assignment patterns as named,
atomic, tenant-customizable, and auditable objects.
CONSTRAINTS
● Bundles must apply atomically: all constituent assignments succeed or
none do.
● Bundles must be tenant-customizable: tenants can create, modify, and
version their own bundles.
● Bundles must be auditable: every bundle application records the bundle
version and constituent assignments.
● Bundles must not grant roles from another tenant (cross-tenant bundle
references are forbidden).
● Bundle application must complete in under 2 seconds at p99 for the
largest bundle (20 assignments).
● Bundles must support dry-run: a preview of the assignments that would
be created, before they are applied.
ASSUMPTIONS
● The assignment model defined in ADR-065 is the substrate; bundles
create assignments, not a parallel mechanism.
● The RBAC model defined in ADR-064 provides the role definitions that
bundles reference.
● Tenant administrators will accept that bundles are versioned and that
applying an old bundle version is intentional (not accidental).
● The largest bundle (20 assignments) is rare; the common bundle size is
4-6 assignments.
● The Effective Permission Resolver (ADR-067) handles the post-bundle
permission set without bundle-specific logic.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 74

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option               | Pros               | Cons                 | Verdict |
| -------------------- | ------------------ | -------------------- | ------- |
| Bundle               | Solves atomicity,  | Adds a new           | Adopted |
| abstraction:         | auditability, and  | abstraction layer.   |         |
| named, versioned     | customization.     | Versioning adds      |         |
| collections of role  | Explicit and easy  | operational          |         |
| assignments          | to reason about.   | complexity.          |         |
| applied              | Clean separation   | Bundle drift (old    |         |
| atomically, tenant-  | from the           | versions in use) is  |         |
| customizable.        | assignment model.  | a management         |         |
concern.
| UI suggestions    | No new             | Does not solve    | Rejected |
| ----------------- | ------------------ | ----------------- | -------- |
| only: admin       | abstraction.       | atomicity. Does   |          |
| console suggests  | Smallest change    | not encode        |          |
| role groups, but  | to the data model. | institutional     |          |
| assignments are   |                    | policy. Does not  |          |
| still per-role.   |                    | support bulk      |          |
onboarding
cleanly.
Policy engine:  Implicit, no admin  Implicit is hard to  Rejected
| automatic role      | action required.   | audit. Policy       |          |
| ------------------- | ------------------ | ------------------- | -------- |
| assignment based    | Always up-to-date. | changes have non-   |          |
| on principal        |                    | obvious effects.    |          |
| attributes (e.g.,   |                    | Conflicts with the  |          |
| role = TEACHER      |                    | explicit-           |          |
| -> assign           |                    | assignment          |          |
| ATTENDANCE_TA       |                    | principle of        |          |
| KER).               |                    | ADR-065.            |          |
| Templates: a one-   | Simpler than       | Cannot be re-       | Rejected |
| shot template that  | bundles (no        | applied. Cannot     |          |
| creates             | versioning).       | encode              |          |
| assignments but is  | Useful for one-    | institutional       |          |
| not stored as a     | time bulk          | policy. Loses the   |          |
| reusable object.    | onboarding.        | audit traceability  |          |
of a named
bundle.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  75

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
Adopt a bundle abstraction. A bundle is a named, versioned collection of
role assignments (each with role_id, optional scope, optional expiration)
that is applied atomically to a principal. Bundles are tenant-customizable:
each tenant can create, modify, and version its own bundles. Bundle
application is transactional: all constituent assignments are created in a
single database transaction, or none are. Bundle applications are auditable
per ADR-086 with the bundle name, version, and constituent assignments
recorded. Bundles support dry-run (preview) before application. Cross-
tenant bundle references are forbidden (a bundle can only reference roles
in its own tenant or system roles).
DETAILED RATIONALE
The bundle abstraction was chosen over the UI-suggestion and policy-engine
alternatives because it is the only approach that solves the atomicity problem
while remaining explicit and auditable. The UI-suggestion approach leaves the
per-role assignment process in place, so an interrupted onboarding
(administrator closes the tab halfway through) leaves the principal in an
inconsistent state with some roles assigned and others missing. The policy-
engine approach solves atomicity implicitly (the policy assigns all required
roles automatically) but introduces two new problems: policy changes have
non-obvious effects (changing the TEACHER policy affects all current teachers
retroactively), and the implicit assignment is hard to audit (the audit trail
records the policy firing, not the administrator's intent). The bundle
abstraction solves atomicity explicitly: the bundle application is a single
transaction, so an interrupted application leaves no partial state (the
transaction rolls back). It solves auditability explicitly: the audit trail records
the bundle name, version, and the principal_id of the administrator who applied
it, which is exactly the evidence the compliance team needs. It solves
customization explicitly: each tenant can define its own bundles, so the
Standard School Staff bundle at one school can be different from the Standard
School Staff bundle at another. The versioning design is the most important
part of the bundle abstraction. A bundle is identified by (tenant_id, name,
version), and bundle applications record the version that was applied. This
means that an audit trail can answer what bundle was applied to this principal,
and what did that bundle contain? even years after the application, because the
bundle version is immutable (a new version is a new row, not an update). This is
critical for regulatory audits: GDPR Article 32, COPPA, and DPDP all require
that the platform be able to reconstruct the authorization state at any past point
in time, which the versioned bundle makes possible. The decision to forbid
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 76

PreOne ADR - Volume 4: Security Architecture v3.0
cross-tenant bundle references is driven by the tenant-isolation requirement
(ADR-043). A bundle in tenant A can reference system roles (which are global)
and tenant A's custom roles, but not tenant B's custom roles. This prevents a
compromised tenant administrator from using bundles to grant roles in another
tenant, which would be a tenant-isolation violation. The constraint is enforced
at bundle-create time (the bundle-create endpoint rejects references to roles
not in the bundle's tenant or the system catalog) and at bundle-apply time (the
apply endpoint re-validates as a defense-in-depth measure). The dry-run
capability is the second most important part of the bundle abstraction. A dry-
run returns the list of assignments that would be created, the resolved
permission set that would result, and any conflicts with existing assignments
(e.g., a role already assigned that the bundle would re-assign). This allows
administrators to preview the effect of a bundle before applying it, reducing the
risk of misconfiguration. The dry-run is also used by the bundle editor to
validate a bundle definition before saving: a bundle that would produce a
conflict for a typical principal is flagged for review. The atomicity guarantee is
implemented via a PostgreSQL transaction: all constituent assignments are
inserted in a single transaction, which either commits (all assignments created)
or rolls back (no assignments created). This is the standard transactional
pattern and is robust to all failure modes except a database crash mid-
transaction (which PostgreSQL handles correctly via its crash-recovery logic).
The 2-second p99 budget for the largest bundle (20 assignments) is well within
PostgreSQL's transactional capacity; the bottleneck is the audit-service write
(per ADR-086), which is asynchronous and does not block the transaction. The
decision to make bundles tenant-customizable (rather than platform-defined
only) is driven by the institutional-policy requirement. Different schools have
different policies: some require all staff to have SAFETY_REPORTER, others
require all teachers to have CLUB_ADVISOR, others require all administrators
to have COMPLIANCE_REVIEWER. A platform-defined catalog cannot capture
this diversity without bloating, while a tenant-customizable catalog lets each
school define exactly the bundles it needs. The trade-off is that bundle
management becomes a tenant-administrator responsibility, which is
addressed by the admin-console UX (bundle editor with dry-run, templates, and
a library of common bundles shipped by the platform).
ARCHITECTURE DIAGRAM
+-----------------------------------------------------------+ | PREONE BUNDLE STRATEGY
| +-----------------------------------------------------------+ | BUNDLE CATALOG (per tenant)
| | - bundle_id (UUIDv7, PK) | | - tenant_id (FK)
| | - name, version, description | | - status (DRAFT |
PUBLISHED | DEPRECATED) | | - constituents (JSONB array of
{role_id, scope, expiry}) | +-----------------------------------------------------------+ |
v +-----------------------+ +-----------------------+ | PLATFORM BUNDLES |
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 77

PreOne ADR - Volume 4: Security Architecture v3.0
| TENANT BUNDLES | | (ship with release, | | (created by tenant |
| tenants can clone) | | admin, versioned) | | - New Teacher |
| - Standard Staff | | - New Administrator | | - Substitute Teacher | | -
New Student | | - Exam Proctor Team | +-----------+-----------+
+-----------+-----------+ | | +----------------
+----------------+ | v
+------------------------+ | BUNDLE APPLIER | |
(transactional) | | - validate constituents| | - dry-run
preview | | - apply atomically | | - audit (ADR-086)
| +-----------+------------+ | v
+------------------------+ | role_assignments | | (ADR-065,
multiple | | rows per bundle apply)| +------------------------+
SEQUENCE DIAGRAM
Admin -> Bundle API: Apply "New Teacher" bundle to principal P Bundle API ->
Bundle Catalog: Fetch bundle (name, version) Bundle Catalog -> Bundle API:
constituents [TEACHER, ATTENDANCE, ...] Bundle API -> Dry Run: Preview
assignments + resolved permissions Dry Run -> Bundle API: No conflicts Bundle
API -> PostgreSQL: BEGIN TRANSACTION PostgreSQL -> role_assignments:
INSERT TEACHER assignment PostgreSQL -> role_assignments: INSERT
ATTENDANCE assignment PostgreSQL -> role_assignments: INSERT
GRADEBOOK assignment PostgreSQL -> Bundle API: COMMIT Bundle API ->
Audit Service: Record BUNDLE_APPLY with version Audit Service -> Audit Log:
Append Bundle API -> Permission Cache: Invalidate principal P Bundle API ->
Admin: Return assignment IDs
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-066 — Bundle Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Admin UI | CRUD |
Role/Permission | | | | |------->| Service | | |
+----------------+ +----------+-----------+ | | |
| | | persists | | v
| | +----------------+ +----------------------+ | | | Repository | CRUD |
Postgres RBAC tables | | | | |------->| (roles, permissions, | | |
+----------------+ | bundles, assignments)| | |
+----------------------+ | | | | Cache (Redis)
for hot permission lookups | | Invalidation (ADR-069) on
role/permission change | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Permission Resolution Flow: User -> App: action request App -> Permission
Resolver: 'permissions for user X?' Resolver -> Cache (Redis): lookup (cache
miss) Resolver -> Postgres: query roles + bundles + assignments Resolver ->
Cache: store (TTL 5 min) Resolver -> App: effective permissions Cache
Invalidation Flow (on role/permission change): Admin -> RBAC Service: update
role RBAC Service -> Postgres: persist RBAC Service -> Invalidation
Publisher: 'invalidate users with role X' Invalidation Publisher -> Redis: delete
cached entries Invalidation Publisher -> Audit: log 'CACHE_INVALIDATED'
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 78

PreOne ADR - Volume 4: Security Architecture v3.0
DATABASE IMPACT
Bundles add two tables. bundles holds the bundle metadata (bundle_id,
tenant_id, name, version, description, status, created_at, created_by) with a
unique constraint on (tenant_id, name, version). bundle_constituents holds the
constituent assignments (bundle_id, role_id, scope_type, scope_id, expires_at)
as a join table. Both tables are tenant-scoped and partitioned by tenant_id. The
role_assignments table (per ADR-065) gains a bundle_id nullable column to
record which bundle application created the assignment, for traceability. A
bundle application creates one role_assignments row per constituent, all in a
single transaction. The bundle catalog is small (typically 5-20 bundles per
tenant) and does not present a scalability concern.
API IMPACT
Five endpoints are introduced under /bundles: GET (list, filtered by tenant and
status), POST (create new bundle version), GET /{id} (detail with constituents),
POST /{id}/apply (apply to a principal), and POST /{id}/dry-run (preview
without applying). The apply endpoint is transactional and returns the created
assignment IDs. The dry-run endpoint returns the preview (assignments,
resolved permissions, conflicts). The frontend admin console exposes a bundle
editor with version comparison, a library of platform-provided bundle
templates, and a one-click apply for common onboarding scenarios. The bulk
onboarding flow applies a bundle to a list of principals in a single batch
operation.
UI IMPACT
The RBAC model surfaces in the admin UI as the 'Roles', 'Permissions', and
'Bundles' management pages. Admins can create custom roles (name +
description), assign permissions to roles, group permissions into bundles (e.g.,
'Teacher Bundle', 'Admin Bundle'), and assign bundles to users. The UI includes
a 'Permission Matrix' view showing which roles have which permissions
(checkboxes for easy editing). The 'User Detail' page shows the user's assigned
bundles and effective permissions (computed via ADR-067). Changes to roles or
assignments trigger a confirmation modal ('This will affect N users. Continue?')
to prevent accidental bulk permission changes.
SECURITY IMPACT
The bundle abstraction improves security by making the assignment process
atomic and auditable, which closes the partial-onboarding failure mode that the
2025 Q2 audit identified (18% of onboardings with missing roles). The
versioning design enables regulatory audit reconstruction (the audit trail can
answer what bundle was applied, when, and what did it contain?). The cross-
tenant reference prohibition (enforced at create and apply time) closes a
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 79

PreOne ADR - Volume 4: Security Architecture v3.0
potential tenant-isolation violation. The dry-run capability reduces the risk of
misconfiguration by allowing administrators to preview the effect before
applying. The bundle-level audit trail (recording the bundle name and version,
not just the constituent assignments) gives the compliance team a higher-level
view of authorization changes, which is easier to reason about for audit
purposes.
PERFORMANCE IMPACT
Bundle application is a low-frequency operation (a few hundred per tenant per
year) and is not on the hot path. The 2-second p99 budget for the largest bundle
(20 assignments) is well within PostgreSQL's transactional capacity; the
bottleneck is the audit-service write (per ADR-086), which is asynchronous and
does not block the transaction. The dry-run preview requires resolving the
constituent assignments to a permission set, which takes 5-10ms (a single
resolver call). The bundle editor's dry-run validation is debounced and runs in
the background, so it does not affect the editor's responsiveness. Bundle
application triggers a permission-cache invalidation for the affected principal
(per ADR-069), which causes a brief cold-cache period; the impact is bounded
by the cache warm-up job.
SCALABILITY ANALYSIS
The bundle catalog is small (5-20 bundles per tenant, 1,000 tenants = 20,000
bundles) and does not present a scalability concern. The bundle application
creates role_assignments rows, which scale per ADR-065. The transactional
application of 20 assignments is well within PostgreSQL's capacity; the largest
projected transaction (bulk onboarding of 200 principals with a 6-assignment
bundle = 1,200 assignment rows) completes in under 5 seconds, which is
acceptable for a bulk operation. The audit-service write rate (per ADR-086) is
the secondary scaling concern; bulk onboarding produces 1,200 audit events in
a burst, which the audit service handles with its standard batching. No
architectural ceiling is anticipated within the three-year planning horizon.
OPERATIONAL CONSIDERATIONS
The bundle subsystem is deployed as a Spring library embedded in the main
backend. The bundle editor is the primary admin-console surface; it includes a
library of platform-provided bundle templates that tenants can clone and
customize. The on-call runbook covers three failure modes: bundle-apply
transaction failure (PostgreSQL rolls back, no partial state), bundle-version
conflict (optimistic locking retry), and bundle-catalog migration (platform-
provided templates updated per release, tenant bundles unaffected). The bulk-
onboarding flow is documented in the tenant-administrator handbook and
tested in the quarterly game-day. Bundle deprecation (marking a bundle as
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 80

PreOne ADR  -  Volume 4: Security Architecture  v3.0
DEPRECATED to prevent new applications while preserving historical audit
records) is the mechanism for retiring bundles without breaking audit
reconstruction.
RISKS
| Risk                | Likelihood | Impact | Mitigation        |
| ------------------- | ---------- | ------ | ----------------- |
| Bundle drift: old   | Medium     | Medium | Bundle editor     |
| bundle versions     |            |        | shows version     |
| remain in use long  |            |        | adoption.         |
| after a new         |            |        | Deprecation       |
| version is          |            |        | workflow nudges   |
| published,          |            |        | tenants to new    |
| producing           |            |        | versions.         |
| inconsistent        |            |        | Quarterly bundle- |
| authorization       |            |        | version audit.    |
states.
| Bundle application  | Low | High | PostgreSQL           |
| ------------------- | --- | ---- | -------------------- |
| is interrupted mid- |     |      | transaction          |
| transaction,        |     |      | atomicity is robust  |
| leaving partial     |     |      | to all failure       |
| state despite the   |     |      | modes except         |
| atomicity           |     |      | database crash,      |
| guarantee.          |     |      | which PostgreSQL     |
handles via crash
recovery. Tested
in game-day.
| Tenant              | Medium | Medium | Dry-run preview      |
| ------------------- | ------ | ------ | -------------------- |
| administrators      |        |        | shows resolved       |
| create overly       |        |        | permissions.         |
| permissive          |        |        | Bundle editor        |
| bundles, defeating  |        |        | includes a least-    |
| least-privilege     |        |        | privilege lint that  |
| intent.             |        |        | flags bundles        |
granting sensitive
permissions.
Quarterly audit.
| Bulk onboarding    | Low | Medium | Audit service       |
| ------------------ | --- | ------ | ------------------- |
| produces an audit- |     |        | batches events.     |
| event burst that   |     |        | Bulk onboarding is  |
| overwhelms the     |     |        | rate-limited.       |
| audit service.     |     |        | Tested at 5x        |
projected peak in
load testing.
TRADE-OFFS
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  81

PreOne ADR - Volume 4: Security Architecture v3.0
We Gain We Lose
Atomic multi-role assignment eliminates New abstraction layer adds conceptual
partial-onboarding failures. overhead for administrators.
Versioned bundles enable regulatory Version management is an ongoing
audit reconstruction. operational responsibility.
Tenant-customizable bundles encode Platform team cannot enforce bundle
institutional policy. consistency across tenants.
Dry-run preview reduces Dry-run adds latency to the bundle
misconfiguration risk. editor UX.
REJECTED ALTERNATIVES
The UI-suggestion-only approach was rejected because it does not solve the
atomicity problem: an interrupted onboarding leaves the principal in an
inconsistent state with some roles assigned and others missing, which is the
root cause of the 18% missing-role rate the audit identified. The policy-engine
approach was rejected because implicit assignment is hard to audit (the audit
trail records the policy firing, not the administrator's intent) and policy changes
have non-obvious effects (changing the TEACHER policy affects all current
teachers retroactively). The template approach (one-shot, not stored) was
rejected because it cannot be re-applied, cannot encode institutional policy,
and loses the audit traceability of a named, versioned bundle. The full
reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter. Phase 1 (weeks 1-3): create the bundles
and bundle_constituents tables, deploy the bundle applier in shadow mode
(logging applications but not creating assignments). Phase 2 (weeks 4-6):
publish the platform-provided bundle templates (New Teacher, New
Administrator, New Student) and enable tenant administrators to clone and
customize them. Phase 3 (weeks 7-9): enable the bundle-apply endpoint for a
pilot group of 10 tenants; collect feedback and iterate the bundle editor UX.
Phase 4 (weeks 10-12): enable bundles for all tenants; the legacy per-role
assignment process remains available as a fallback. Phase 5 (week 13): the
legacy per-role process is deprecated (still functional but not surfaced in the
UI). Rollback is possible at any point by disabling the bundle-apply endpoint;
existing assignments created by bundles are not affected.
TESTING STRATEGY
The bundle subsystem is tested at three levels. Unit tests cover the bundle
applier (transactional semantics, constituent validation, cross-tenant
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 82

PreOne ADR - Volume 4: Security Architecture v3.0
rejection), the dry-run preview, and the version-comparison logic; coverage
target is 95%. Integration tests cover the bundle-apply flow (success, failure,
partial-failure rollback), the bulk-onboarding flow, and the bundle-editor
version management. End-to-end tests cover the full create-bundle -> apply-
bundle -> authorize-request path. Security tests cover the cross-tenant
reference rejection, the atomicity guarantee (interrupted application leaves no
partial state), and the audit-trail completeness. The acceptance criterion is zero
partial-onboarding failures in the post-cutover stabilization period.
MONITORING & OBSERVABILITY
Four golden signals are monitored. (1) Bundle-apply latency p99: target under
2 seconds, alert above 5 seconds. (2) Bundle-apply failure rate: target under
0.5%, alert above 2% (possible transaction issue). (3) Bundle-version adoption:
percentage of applications using the latest version; target above 80% for
published bundles, alert below 60% (drift). (4) Dry-run usage: percentage of
applies preceded by a dry-run; target above 70%, alert below 50%
(administrators may be skipping preview). A dedicated bundle dashboard
surfaces these alongside the per-tenant bundle count, the bulk-onboarding
burst rate, and the deprecated-bundle application attempts. Anomaly detection
(per ADR-088) flags unusual bundle patterns (bulk applications off-hours,
applications of deprecated bundles, applications by non-admin principals).
FUTURE EVOLUTION
The bundle abstraction is expected to evolve in three directions. First, bundles
may gain a constituent-removal capability (applying a bundle that removes
assignments, not just adds them) to support the offboarding workflow
symmetrically; this is monitored but not planned for v1. Second, bundles may
gain a scheduling capability (apply at a future date, auto-revoke at a future
date) to support the school-year calendar natively; this is a natural extension of
the expiration mechanism in ADR-065. Third, the platform-provided bundle
library may grow to include role-specific bundles (e.g., the New Librarian
bundle for the planned library-management feature); this is a routine platform
evolution, not an abstraction change.
RELATED ADRS
● ADR-061 - Identity Model (principals are the subject of bundle
application)
● ADR-064 - RBAC Model (roles are the constituents of bundles)
● ADR-065 - Assignment Model (bundles create assignments)
● ADR-067 - Effective Permission Resolver (resolves post-bundle
permission sets)
● ADR-068 - Permission Cache (cache invalidation on bundle apply)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 83

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● ADR-069 - Cache Invalidation (cross-region invalidation for bundle
applies)
● ADR-086 - Audit Trail (records bundle applications with version)
● ADR-043 - Tenant Isolation (bundles are tenant-scoped)
REFERENCES
● OWASP Access Control Cheat Sheet, Provisioning section. OWASP
Foundation. 2024.
● NIST SP 800-53 - Access Control (AC-2 Account Management), Section
on Role Bundling. NIST. 2020.
● PreOne Engineering Handbook, Section 4.6 - Bundle Strategy. Internal.
2025.
● Coyne, E. and Weil, T. - ABAC and RBAC: Scalable, Flexible, and
Auditable. IT Professional. 2013.
● ISO/IEC 27001:2022 - Annex A.5.16 Identity Management. ISO. 2022.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect |     | Platform Security Architect |     |
| --------- | --- | --------------------------- | --- |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  84

PreOne ADR - Volume 4: Security Architecture v3.0
Tech Lead Authorization Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Roles, Permissions, Bundles, Assignments tables deployed (Done)
● Admin UI for role/bundle management (Done)
● Permission Matrix view implemented (Done)
● Default roles (admin, teacher, parent, student) pre-loaded (Done)
● Quarterly role-review process (Scheduled)
AD R -067
Effective Permission Resolver
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a single Effective Permission Resolver component that flattens a
principal's direct assignments, delegated assignments, role hierarchy,
scope, and expiration into a flat, deduplicated permission set keyed by
(permission_id, scope). The resolver is the sole source of truth for
authorization decisions; no other component may compute a permission set
independently. The resolver is cached in Redis per ADR-068 and invalidated
per ADR-069.
STATUS
Status Accepted
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 85

PreOne ADR - Volume 4: Security Architecture v3.0
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The legacy authorization stack computes permissions in at least four places: a
Spring Security filter that checks role strings, a service-layer helper that joins
user_role to role_permission, a frontend API that returns a permission list for UI
gating, and a reporting query that joins everything for audit reports. These four
implementations have drifted over four years: the filter knows about roles that
the helper doesn't, the helper knows about scopes that the API doesn't, and the
reporting query is two months out of date with respect to all three. The 2025
Q2 audit found seven cases where the four implementations disagreed on
whether a specific principal had a specific permission, producing inconsistent
behavior between the UI (which showed a button), the API (which rejected the
call), and the audit log (which recorded a different decision than the API
enforced). This is the same fragmentation problem that ADR-063 addresses at
the architecture level; this ADR addresses it at the implementation level by
defining the single resolver component that all four call sites must invoke. The
resolver must satisfy four hard requirements. First, correctness: it must
produce the same permission set regardless of which call site invokes it.
Second, performance: it must complete in under 5ms at p99 on the hot path,
which requires aggressive caching (ADR-068). Third, freshness: it must reflect
assignment changes within 60 seconds, which requires a robust invalidation
strategy (ADR-069). Fourth, auditability: it must be able to reconstruct the
permission set at any past point in time for regulatory purposes, which requires
deterministic resolution and durable input state.
BUSINESS DRIVERS
The 2026 international expansion requires demonstrable authorization
correctness for GDPR Article 32, COPPA, and DPDP Section 8 audits. The
legacy four-implementation stack cannot demonstrate correctness because the
four implementations disagree; a single resolver with a single code path can.
The business also requires that the frontend, API, and audit log agree on
permissions (the UI must not show a button that the API rejects), which the
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 86

PreOne ADR - Volume 4: Security Architecture v3.0
single resolver guarantees by construction. Finally, the business requires that
the platform be able to answer what could this principal do at time T? for
regulatory investigations, which the resolver's deterministic resolution and
durable input state enable.
PROBLEM STATEMENT
The legacy authorization stack computes permissions in four places that have
drifted, producing inconsistent behavior and seven known disagreement cases.
PreOne needs a single Effective Permission Resolver that produces the same
permission set regardless of call site, completes in under 5ms at p99, reflects
changes within 60 seconds, and can reconstruct past permission sets for audit.
CONSTRAINTS
● Resolution must complete in under 5ms at p99 on the hot path (cache
hit) and under 50ms at p99 on cold cache.
● Assignment changes must be reflected in the resolver's output within
60 seconds (cache invalidation per ADR-069).
● The resolver must be deterministic: the same inputs at the same time
produce the same output, enabling audit reconstruction.
● The resolver must be the sole source of truth; no other component may
compute a permission set independently.
● The resolver must degrade gracefully when the cache is unavailable
(fall through to database with elevated latency).
● The resolver must produce a permission set keyed by (permission_id,
scope) to support scoped authorization per ADR-065.
ASSUMPTIONS
● The RBAC model (ADR-064), assignment model (ADR-065), and bundle
strategy (ADR-066) provide the inputs to the resolver.
● Redis is available with cross-region replication per ADR-068 and
ADR-069 for the cache.
● The permission catalog (ADR-063) is small enough (~200 permissions)
to fit in memory in the resolver process.
● The role hierarchy (ADR-064) is acyclic (enforced at write time), so the
resolver's transitive walk terminates.
● Audit reconstruction is performed offline against historical snapshots,
not on the hot path.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 87

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option           | Pros               | Cons                 | Verdict |
| ---------------- | ------------------ | -------------------- | ------- |
| Single resolver  | Single source of   | Single point of      | Adopted |
| component with   | truth.             | failure (mitigated   |         |
| Redis cache,     | Deterministic for  | by cache fallback).  |         |
| deterministic    | audit. Cacheable.  | All call sites must  |         |
| algorithm,       | Scoped output      | migrate.             |         |
| (permission_id,  | supports           | Determinism          |         |
| scope) keyed     | ADR-065. Meets     | requires careful     |         |
| output.          | all four hard      | algorithm design.    |         |
requirements.
| Refactor the four  | Smallest           | Four call sites   | Rejected |
| ------------------ | ------------------ | ----------------- | -------- |
| legacy             | migration. No new  | remain, risking   |          |
| implementations    | infrastructure.    | drift again. No   |          |
| to share a         | Reuses existing    | single source of  |          |
| common library     | call sites.        | truth. Does not   |          |
| but remain         |                    | solve the         |          |
| separately         |                    | disagreement      |          |
| invoked.           |                    | problem at the    |          |
root.
| Event-sourced        | Perfect audit       | Read latency        | Rejected |
| -------------------- | ------------------- | ------------------- | -------- |
| permission log:      | reconstruction for  | unacceptable on     |          |
| every assignment     | free. Natural fit   | the hot path (fold  |          |
| change emits an      | for the compliance  | over years of       |          |
| event; the resolver  | requirement.        | events).            |          |
| folds the event log  |                     | Operational         |          |
| to produce the       |                     | complexity of       |          |
| permission set.      |                     | event sourcing      |          |
disproportionate
to PreOne's scale.
| Outsource to a     | Battle-tested.     | Per-request          | Rejected |
| ------------------ | ------------------ | -------------------- | -------- |
| commercial policy  | Vendor handles     | pricing punitive at  |          |
| engine (OPA,       | compliance. No in- | scale. Data-         |          |
| Styra DAS) as the  | house resolver to  | residency            |          |
| single resolver.   | maintain.          | concerns for         |          |
DPDP India. Loss
of control over
tenant-scoping
logic.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  88

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
Adopt a single Effective Permission Resolver component. The resolver takes
a principal_id and produces a permission set keyed by (permission_id,
scope), where scope is the (scope_type, scope_id) pair from ADR-065 or
TENANT_WIDE for unscoped permissions. The resolver's algorithm is
deterministic: (1) fetch the principal's direct and delegated assignments
from the role_assignments table (or cache); (2) filter out expired
assignments (expires_at in the past); (3) for each assignment, walk the role
hierarchy (parent_role_id per ADR-064) to collect all roles; (4) for each role,
fetch the role_permissions; (5) filter out permissions not in the current
permission catalog version (escalation guard); (6) key each permission by
(permission_id, scope) and deduplicate; (7) return the set. The resolver is
the sole source of truth; all call sites invoke it. The resolver is cached in
Redis per ADR-068 and invalidated per ADR-069.
DETAILED RATIONALE
The single-resolver approach was chosen over the shared-library approach
because the disagreement problem is fundamentally a problem of multiple call
sites, not multiple implementations. A shared library that is invoked from four
call sites still has four call sites, and the four call sites can still pass different
inputs (e.g., a stale principal_id, a different cache key, a different time horizon)
that produce different outputs. The single resolver eliminates the call-site
variability by centralizing the invocation: there is one entry point, one input
contract, and one output contract, and the four legacy call sites are migrated to
invoke that entry point. The event-sourced approach was rejected on
performance grounds. Folding an event log over years of assignment changes
to produce a current permission set is the canonical event-sourcing read
pattern, and it is too slow for the hot path. The deterministic-algorithm
approach achieves the same audit-reconstruction property (the same inputs at
the same time produce the same output) without the read-latency penalty, by
recording the inputs (assignment state at time T) rather than the events
(changes between T1 and T2). Audit reconstruction is performed offline by
replaying the resolver against historical assignment snapshots, which is fast
enough for the regulatory investigation use case. The commercial-policy-
engine option was rejected for the same reasons as in ADR-062 and ADR-063:
per-request pricing punitive at scale, data-residency concerns for DPDP India,
and loss of control over tenant-scoping logic. The in-house resolver gives
PreOne full control over the algorithm, the cache, and the invalidation strategy,
which is essential for the regulated education market. The (permission_id,
scope) keyed output is the most important design decision. The legacy
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 89

PreOne ADR - Volume 4: Security Architecture v3.0
implementations produced a flat list of permission_ids, which loses the scope
information and forces the call site to re-derive scope (producing the
disagreements the audit found). The keyed output preserves scope: a
permission check for gradebook.view on class-123 looks up (gradebook.view,
(CLASS, class-123)) in the set, and a check for gradebook.view on class-456
looks up (gradebook.view, (CLASS, class-456)). If the principal has a class-
scoped TEACHER assignment for class-123, the first lookup succeeds and the
second fails, which is the correct least-privilege behavior. An unscoped
assignment (e.g., an administrator with gradebook.view for the whole tenant)
produces a (gradebook.view, TENANT_WIDE) entry that matches any scope
check. The deterministic algorithm is the second most important design
decision. Determinism is achieved by (a) reading inputs at a single point in time
(snapshot reads via PostgreSQL's repeatable-read isolation), (b) processing
inputs in a fixed order (assignments sorted by assignment_id, roles sorted by
role_id, permissions sorted by permission_id), and (c) deduplicating with a
stable rule (later assignment_id wins for conflicting scope). Determinism
enables audit reconstruction: given the assignment state at time T (recovered
from the audit log per ADR-068), the resolver produces the same permission set
that the hot path produced at time T, which is the evidence the compliance
team needs for regulatory investigations. The cache fallback strategy is the
third most important design decision. When the Redis cache is unavailable, the
resolver falls through to the database, which elevates latency from 1ms (cache
hit) to 5-10ms (database query) but preserves correctness. This is the fail-open-
for-correctness, fail-closed-for-security pattern: the resolver never returns a
stale or incorrect permission set, but it may be slower during a cache outage.
The cache outage is detected by a health check that pings Redis every 5
seconds; when the health check fails, the resolver switches to database-fallback
mode and emits an alert. This is documented in the on-call runbook and tested
in the quarterly game-day. The decision to make the resolver the sole source of
truth is enforced at three levels. First, code review: the ARB rejects any pull
request that computes a permission set outside the resolver. Second, CI: a
static analysis check flags any code that imports the role_assignments or
role_permissions tables outside the resolver package. Third, runtime: the audit
log (per ADR-086) records which call site invoked the resolver for each
authorization decision, allowing post-hoc verification that no call site bypassed
the resolver.
ARCHITECTURE DIAGRAM
+-----------------------------------------------------------+ | PREONE EFFECTIVE
PERMISSION RESOLVER | +-----------------------------------------------------------+ |
INPUT: principal_id |
+-----------------------------------------------------------+ | v
+---------------------------+ +-----------------------+ | 1. FETCH ASSIGNMENTS |----
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 90

PreOne ADR - Volume 4: Security Architecture v3.0
>| role_assignments | | (direct + delegated) | | (ADR-065) |
+---------------------------+ +-----------------------+ | v
+---------------------------+ | 2. FILTER EXPIRED | (expires_at < now)
+---------------------------+ | v +---------------------------+
+-----------------------+ | 3. WALK ROLE HIERARCHY |---->| roles (ADR-064) |
| (parent_role_id) | +-----------------------+ +---------------------------+ |
| v | +-----------------------+ |
| role_permissions | | +-----------------------+ v
+---------------------------+ +-----------------------+ | 4. FETCH PERMISSIONS |---->|
permissions (ADR-063) | +---------------------------+ +-----------------------+ |
v +---------------------------+ | 5. FILTER TO CATALOG | (escalation guard) |
(current version) | +---------------------------+ | v
+---------------------------+ | 6. KEY BY (perm_id, scope)| | DEDUPLICATE |
+---------------------------+ | v +---------------------------+
+-----------------------+ | 7. RETURN PERMISSION SET |---->| Redis Cache
(ADR-068) | +---------------------------+ +-----------------------+ | v
+---------------------------+ | OUTPUT: Set<(perm, scope)>| +---------------------------+
SEQUENCE DIAGRAM
API Call -> Authz Filter: Request with principal_id Authz Filter -> Resolver:
Resolve(principal_id) Resolver -> Redis Cache: GET permission_set Redis Cache
-> Resolver: HIT (cached set) Resolver -> Authz Filter: Permission set Authz
Filter -> Scope Check: (perm, scope) in set? Scope Check -> Authz Filter:
Decision Authz Filter -> Service Layer: Allow/Deny Note over Resolver: On cache
MISS: Resolver -> PostgreSQL: FETCH assignments + roles PostgreSQL ->
Resolver: Rows Resolver -> Algorithm: Steps 2-7 Algorithm -> Redis Cache: SET
permission_set (TTL 5min) Algorithm -> Resolver: Permission set Resolver ->
Authz Filter: Permission set
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-067 — Effective Permission
Resolver - Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Admin UI | CRUD |
Role/Permission | | | | |------->| Service | | |
+----------------+ +----------+-----------+ | | |
| | | persists | | v
| | +----------------+ +----------------------+ | | | Repository | CRUD |
Postgres RBAC tables | | | | |------->| (roles, permissions, | | |
+----------------+ | bundles, assignments)| | |
+----------------------+ | | | | Cache (Redis)
for hot permission lookups | | Invalidation (ADR-069) on
role/permission change | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Permission Resolution Flow: User -> App: action request App -> Permission
Resolver: 'permissions for user X?' Resolver -> Cache (Redis): lookup (cache
miss) Resolver -> Postgres: query roles + bundles + assignments Resolver ->
Cache: store (TTL 5 min) Resolver -> App: effective permissions Cache
Invalidation Flow (on role/permission change): Admin -> RBAC Service: update
role RBAC Service -> Postgres: persist RBAC Service -> Invalidation
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 91

PreOne ADR - Volume 4: Security Architecture v3.0
Publisher: 'invalidate users with role X' Invalidation Publisher -> Redis: delete
cached entries Invalidation Publisher -> Audit: log 'CACHE_INVALIDATED'
DATABASE IMPACT
The resolver reads from three tables defined in other ADRs: role_assignments
(ADR-065), roles and role_permissions (ADR-064), and permissions (ADR-063).
No new tables are introduced. The resolver uses PostgreSQL's repeatable-read
isolation for snapshot reads, which ensures that all reads within a single
resolution see a consistent snapshot of the database. The snapshot read is
critical for determinism: a resolution that reads assignments at T1 and roles at
T2 (where T2 > T1 and a role changed between them) would produce a non-
deterministic result. The snapshot is established at the start of the resolution
and released at the end; the typical resolution takes 1-2ms on a cache miss,
which is well within the snapshot's validity window.
API IMPACT
The resolver exposes a single internal endpoint: /internal/authz/resolve?
principal_id=X&at=YYYY-MM-DDTHH:MM:SSZ (the at parameter is optional,
for audit reconstruction). The endpoint returns the permission set as a JSON
array of {permission_id, scope_type, scope_id} objects. The endpoint is internal
(not exposed to tenants) and is called by the API gateway, the Spring Security
filter chain, the service layer, and the frontend permission API. The legacy four
call sites are migrated to invoke this endpoint; the migration is tracked in a
dedicated dashboard. The endpoint is cached at the HTTP layer (per ADR-068)
for the common case where the same principal's permissions are requested
multiple times within a few seconds.
UI IMPACT
The effective permission resolver is invisible to end users — they see only the UI
elements their permissions allow. For admins, the 'User Detail' page includes a
'Effective Permissions' panel showing the computed permission set (read-only,
with a 'refresh' button to force cache invalidation). The 'Permission Cache
Health' dashboard (admin/operations/security/permissions) shows cache hit
rate, invalidation latency, and stale-cache incidents — accessible to the
Security Engineering team. Cache invalidation events are surfaced in the
admin 'Activity Log' for audit traceability.
SECURITY IMPACT
The single resolver eliminates the disagreement cases that the 2025 Q2 audit
identified, which is the most direct security improvement. The (permission_id,
scope) keyed output preserves scope information end-to-end, closing the over-
broad access paths that the legacy flat-list output allowed. The deterministic
algorithm enables audit reconstruction, which is the evidence the compliance
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 92

PreOne ADR - Volume 4: Security Architecture v3.0
team needs for GDPR, COPPA, and DPDP investigations. The escalation guard
(filtering to the current permission catalog version) is a defense-in-depth
measure against bugs in the write-time guard defined in ADR-064. The cache
fallback strategy (fail-open-for-correctness) ensures that a cache outage does
not produce a security regression; the resolver never returns a stale or
incorrect permission set, even under cache failure.
PERFORMANCE IMPACT
The resolver meets the 5ms p99 budget on the hot path (cache hit) with
significant headroom: a cache hit is a single Redis GET, which takes 0.5-1ms at
p99. The cold-cache path (cache miss or cache outage) takes 5-10ms at p99,
which is within the 50ms p99 cold-cache budget. The cold-cache path is
exercised by approximately 5% of requests at steady state (cache miss rate per
ADR-068). The deterministic algorithm's steps 2-7 are in-memory and add
negligible overhead (under 0.5ms). The snapshot read overhead (PostgreSQL
repeatable-read) is negligible at the typical resolution size (1-2 assignments per
principal, 5-10 permissions per role).
SCALABILITY ANALYSIS
The resolver scales with request volume, not with principal or assignment
count, because the per-request work is bounded by the cache. The Redis cache
(ADR-068) is the scaling bottleneck; it is sized for 1 million cached principals
per region, which exceeds the projected peak by a factor of three. The cold-
cache path scales with the database's ability to serve snapshot reads, which is
bounded by the role_assignments table's partitioning strategy (per ADR-065).
At the projected peak of 4 million principals, the largest tenant partition is
under 500,000 rows, and a point lookup on the (principal_id, tenant_id) index
takes under 5ms. The resolver is deployed with three replicas per region, which
handles the projected request volume with 70% headroom. No architectural
ceiling is anticipated within the three-year planning horizon.
OPERATIONAL CONSIDERATIONS
The resolver is deployed as a Spring library embedded in the main backend,
sharing its observability stack and on-call rotation. The on-call runbook covers
four failure modes: Redis unavailable (fail through to database, elevated
latency, alert), database slow (circuit breaker opens, requests fail closed with
503), cache invalidation lag (alert if invalidation takes more than 60 seconds),
and resolver bug (rollback to previous deployment, automatic on health-check
failure). The resolver has a dedicated dashboard showing resolution latency,
cache hit rate, cold-cache rate, and the per-tenant permission-set size
distribution. Each failure mode is tested in the quarterly game-day. The
resolver's algorithm is versioned (algorithm_version field in the cache key) to
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 93

PreOne ADR  -  Volume 4: Security Architecture  v3.0
allow safe algorithm changes; a new algorithm version invalidates all caches
and forces a cold-cache rebuild.
RISKS
| Risk                  | Likelihood | Impact | Mitigation           |
| --------------------- | ---------- | ------ | -------------------- |
| The resolver          | Medium     | High   | Three replicas per   |
| becomes a single      |            |        | region, health-      |
| point of failure for  |            |        | checked,             |
| all authorization     |            |        | automatic failover.  |
| decisions.            |            |        | Cache fallback to    |
database
preserves
correctness
during resolver
outage. Circuit
breaker prevents
cascading failure.
| Cache invalidation  | Medium | Medium | Bulk changes are      |
| ------------------- | ------ | ------ | --------------------- |
| lag exceeds 60      |        |        | batched and rate-     |
| seconds during a    |        |        | limited per           |
| burst of            |        |        | ADR-069. Cache        |
| assignment          |        |        | warm-up job pre-      |
| changes (e.g.,      |        |        | populates affected    |
| year-end role       |        |        | principals. Alert if  |
| reset).             |        |        | lag exceeds 60        |
seconds.
| Deterministic         | Low | High | Algorithm is unit- |
| --------------------- | --- | ---- | ------------------ |
| algorithm is          |     |      | tested for         |
| broken by a future    |     |      | determinism. CI    |
| change (e.g., non-    |     |      | runs a             |
| deterministic         |     |      | determinism        |
| ordering in a join),  |     |      | regression test.   |
| breaking audit        |     |      | Algorithm changes  |
| reconstruction.       |     |      | require ARB        |
review and a new
algorithm_version.
| Call sites bypass  | Medium | Medium | CI static analysis  |
| ------------------ | ------ | ------ | ------------------- |
| the resolver and   |        |        | rejects code that   |
| compute            |        |        | imports             |
| permissions        |        |        | role_assignments    |
| locally,           |        |        | or                  |
| reintroducing the  |        |        | role_permissions    |
| disagreement       |        |        | outside the         |
| problem.           |        |        | resolver package.   |
Quarterly code
audit by the ARB.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  94

PreOne ADR - Volume 4: Security Architecture v3.0
TRADE-OFFS
We Gain We Lose
Single source of truth eliminates the All call sites must migrate to invoke the
disagreement cases. resolver, which is a large refactor.
Deterministic algorithm enables audit Determinism requires careful algorithm
reconstruction. design and restricts future changes.
(permission_id, scope) keyed output Output is more complex than a flat list;
preserves scope end-to-end. call sites must handle the scope key.
Cache fallback preserves correctness Cold-cache latency (5-10ms) is higher
during cache outage. than hot-cache latency (1ms), affecting
p99 during outages.
REJECTED ALTERNATIVES
The shared-library approach was rejected because it does not solve the call-site
variability problem: four call sites sharing a library can still pass different
inputs and produce different outputs, which is the root cause of the
disagreement cases the audit found. The event-sourced approach was rejected
on performance grounds: folding an event log over years of changes is too slow
for the hot path, and the audit-reconstruction benefit is achievable more
cheaply via the deterministic-algorithm approach with historical snapshots.
The commercial-policy-engine option was rejected on cost and data-residency
grounds, mirroring the ADR-062 and ADR-063 reasoning. The full reasoning is
captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter. Phase 1 (weeks 1-3): implement the
resolver and deploy it in shadow mode (logging resolutions but not enforcing).
Phase 2 (weeks 4-6): migrate the audit reporting call site (lowest risk, read-
only) to invoke the resolver; validate that the resolver's output matches the
legacy reporting query. Phase 3 (weeks 7-9): migrate the frontend permission
API and the Spring Security filter chain to invoke the resolver; the legacy
implementations remain as fallback. Phase 4 (weeks 10-12): migrate the
service-layer call site (highest risk, on the hot path) to invoke the resolver; the
legacy implementations are removed. Phase 5 (week 13): the legacy
implementations' code is deleted. Rollback is possible at any point in phases 1-4
by re-enabling the legacy implementations; the shadow-mode period ensures
the resolver has been validated against production traffic before it enforces.
TESTING STRATEGY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 95

PreOne ADR - Volume 4: Security Architecture v3.0
The resolver is tested at four levels. Unit tests cover the algorithm
(determinism, scope keying, expiration filtering, escalation guard, hierarchy
walk); coverage target is 98%. Integration tests cover the cache hit/miss
behavior, the cache fallback during Redis outage, and the invalidation
behavior. End-to-end tests cover the full request path for each call site
(gateway, filter chain, service layer, frontend API). Property-based tests cover
the determinism property: for any assignment state, the resolver produces the
same output across multiple invocations. The acceptance criterion is zero
disagreement cases (resolver output matches legacy output for all sampled
principals) during the shadow-mode period.
MONITORING & OBSERVABILITY
Five golden signals are monitored. (1) Resolution latency p99 (cache hit):
target under 5ms, alert above 8ms. (2) Resolution latency p99 (cold cache):
target under 50ms, alert above 100ms. (3) Cache hit rate: target above 95%,
alert below 90%. (4) Cache invalidation lag: target under 60 seconds, alert
above 120 seconds. (5) Determinism regression: target zero mismatches, alert
on any non-zero value (algorithm may be non-deterministic). A dedicated
resolver dashboard surfaces these alongside the per-tenant permission-set size
distribution, the per-call-site invocation count, and the algorithm-version
adoption. Anomaly detection (per ADR-088) flags unusual resolution patterns
(spikes in cold-cache rate, sudden permission-set size changes, resolutions for
non-existent principals).
FUTURE EVOLUTION
The resolver is expected to evolve in three directions. First, the algorithm may
add ABAC evaluation (per ADR-063) as a post-filter step, applying context-
dependent policies (time, device, location) to the resolved permission set; this
is a natural extension, not a redesign. Second, the cache key may add a context
dimension (e.g., time-of-day bucket) to support time-dependent permissions
without per-request evaluation; this is monitored but not planned for v1. Third,
the resolver may add a streaming mode (resolve a principal's permissions as
they change, via a WebSocket) to support real-time UI updates; this is a larger
change and would require its own ADR.
RELATED ADRS
● ADR-061 - Identity Model (provides principal_id input)
● ADR-063 - Authorization (consumes the resolver's output)
● ADR-064 - RBAC Model (provides role hierarchy input)
● ADR-065 - Assignment Model (provides assignment input)
● ADR-066 - Bundle Strategy (bundles create assignments that the
resolver flattens)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 96

PreOne ADR - Volume 4: Security Architecture v3.0
● ADR-068 - Permission Cache (caches the resolver's output)
● ADR-069 - Cache Invalidation (invalidates the cache on assignment
changes)
● ADR-086 - Audit Trail (records resolver invocations and inputs for
reconstruction)
REFERENCES
● NIST SP 800-162 - Guide to ABAC Definition and Considerations,
Resolution section. NIST. 2014.
● Sandhu, R. et al. - The ARBAC97 Model for Role-Based Administration
of Role-Based Access Control. ACM TISSEC. 1999.
● OWASP Access Control Cheat Sheet, Resolution section. OWASP
Foundation. 2024.
● PreOne Engineering Handbook, Section 4.7 - Effective Permission
Resolver. Internal. 2025.
● PostgreSQL Documentation, Chapter 13.2.2 - Repeatable Read
Isolation Level. PostgreSQL. 2024.
DECISION HISTORY
Date Status Actor Notes
2025-08-01 Draft Platform Security Initial draft;
Architect options
enumerated;
consultation with
security and
engineering teams
2025-09-17 Proposed Platform Security Submitted to
Architect Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
2026-07-15 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 97

PreOne ADR - Volume 4: Security Architecture v3.0
APPROVAL & SIGN-OFF
Architect Platform Security Architect
Tech Lead Authorization Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Effective Permission Resolver implemented (Done)
● Redis cache for permission lookups (Done)
● Cache invalidation on role/permission change (Done — ADR-069)
● Admin 'Effective Permissions' panel (Done)
● Cache hit-rate monitoring (target >95%) (Done)
AD R -068
Permission Cache
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a Redis-backed permission cache that stores the Effective Permission
Resolver's output keyed by (principal_id, algorithm_version). The cache TTL
is 5 minutes; the cache is invalidated eagerly on assignment changes per
ADR-069. The cache is the sole read path for the resolver on the hot path;
cache misses fall through to the database and back-fill the cache. The cache
is deployed as a three-node Redis Cluster per region with cross-region
replication for failover.
STATUS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 98

PreOne ADR - Volume 4: Security Architecture v3.0
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on performance
target breach, or on traffic pattern
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The Effective Permission Resolver (ADR-067) computes a permission set in 5-
10ms on a cold cache, which is acceptable for occasional cold-cache reads but
unsustainable for the hot path (every API request). The 2025 Q3 load test
projected that without a cache, the resolver would consume 60% of the
database CPU at projected peak, which is the primary scaling bottleneck for the
authorization stack. The ARB considered four caching strategies. The first is no
cache, which is rejected on performance grounds. The second is an in-process
cache (e.g., Caffeine), which is rejected because it does not invalidate across
instances (a permission change on instance A is not visible to instance B for up
to 5 minutes). The third is a Redis cache with TTL-only invalidation, which is
rejected because TTL-only invalidation produces up to 5 minutes of staleness,
which violates the 60-second freshness requirement. The fourth is a Redis
cache with eager invalidation (per ADR-069), which is selected because it
meets both the performance and freshness requirements. This ADR defines the
cache. The invalidation strategy (how the cache is invalidated on assignment
changes) is defined in ADR-069. The resolver (which produces the cached
values) is defined in ADR-067. This ADR defines the cache topology, the cache
key, the TTL, the read path, the write path, and the failure modes.
BUSINESS DRIVERS
The 2026 international expansion requires that the authorization stack handle
10x the current request volume without a proportional increase in database
cost. The cache is the primary mechanism for this: a 95% cache hit rate reduces
the database load by 20x, which is the difference between a comfortable and an
uncomfortable database scaling story. The business also requires that the
cache not become a single point of failure for the authorization stack, which
drives the multi-region deployment with failover. Finally, the business requires
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 99

PreOne ADR - Volume 4: Security Architecture v3.0
that the cache not leak permission data across tenants, which drives the tenant-
scoped cache key design.
PROBLEM STATEMENT
The Effective Permission Resolver is too slow for the hot path without a cache
(5-10ms cold vs 1ms budgeted). PreOne needs a Redis-backed permission
cache with a 95% hit rate, eager invalidation for 60-second freshness, multi-
region deployment for fault tolerance, and tenant-scoped keys for isolation.
CONSTRAINTS
● The cache must achieve a 95% hit rate at steady state to meet the
resolver's 5ms p99 budget.
● The cache must invalidate eagerly on assignment changes (per
ADR-069) to meet the 60-second freshness requirement.
● The cache must not leak permission data across tenants; cache keys
must include tenant_id or be tenant-scoped.
● The cache must tolerate Redis node failure without producing incorrect
results (correctness over availability).
● The cache must be horizontally scalable to 1 million cached principals
per region.
● The cache TTL must be bounded (max 5 minutes) to limit stale-data
window if invalidation fails.
ASSUMPTIONS
● Redis 7+ is available with cluster mode and cross-region replication
(Redis Enterprise or self-hosted equivalent).
● The Effective Permission Resolver (ADR-067) produces deterministic
output for a given (principal_id, algorithm_version).
● Assignment changes are infrequent relative to authorization requests
(write rate under 0.1% of read rate).
● The cache invalidation strategy (ADR-069) correctly invalidates within
60 seconds of an assignment change.
● Network latency within a region is under 1ms, making the Redis round-
trip acceptable on the hot path.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 100

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option               | Pros               | Cons                | Verdict |
| -------------------- | ------------------ | ------------------- | ------- |
| Redis Cluster with   | Meets              | Operational         | Adopted |
| eager invalidation,  | performance and    | complexity of       |         |
| TTL 5 minutes,       | freshness          | Redis Cluster.      |         |
| (principal_id,       | requirements.      | Eager invalidation  |         |
| algorithm_version)   | Horizontally       | requires a robust   |         |
| key, three nodes     | scalable. Fault-   | invalidation        |         |
| per region.          | tolerant. Tenant   | pipeline            |         |
|                      | isolation via key  | (ADR-069). Cross-   |         |
|                      | scoping.           | region replication  |         |
adds latency to
writes.
| In-process       | Lowest latency (no  | No cross-instance    | Rejected |
| ---------------- | ------------------- | -------------------- | -------- |
| Caffeine cache   | network round-      | invalidation         |          |
| with TTL-only    | trip). Simplest     | (permission          |          |
| invalidation, 1- | operationally. No   | changes on one       |          |
| minute TTL.      | new                 | instance are         |          |
|                  | infrastructure.     | invisible to others  |          |
for up to 1
minute). Violates
the 60-second
freshness
requirement in the
worst case.
Two-layer cache:  Lowest latency for  Two layers add  Rejected
| Caffeine (1-minute  | hot principals      | complexity.          |     |
| ------------------- | ------------------- | -------------------- | --- |
| TTL) in front of    | (Caffeine hit).     | Caffeine             |     |
| Redis (5-minute     | Redis as fallback.  | invalidation across  |     |
| TTL) with eager     | Reduces Redis       | instances still      |     |
| invalidation.       | load.               | requires Redis       |     |
pub/sub. Marginal
benefit over Redis-
only at PreOne's
cache hit pattern.
| Redis with TTL-     | Simpler than         | Up to 1-minute      | Rejected |
| ------------------- | -------------------- | ------------------- | -------- |
| only invalidation,  | eager invalidation.  | staleness on every  |          |
| 1-minute TTL (no    | No invalidation      | assignment          |          |
| eager               | pipeline to          | change. Violates    |          |
| invalidation).      | operate. TTL         | the 60-second       |          |
|                     | bounds staleness.    | freshness           |          |
requirement in the
average case.
Rejected by ARB
as insufficient for
the regulated
education market.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  101

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
ADOPTED
Adopt a Redis Cluster-backed permission cache. The cache stores the
Effective Permission Resolver's output keyed by principal_id:
{principal_id}:algorithm_version:{v}, where the value is the JSON-
serialized permission set. The cache TTL is 5 minutes (300 seconds),
bounded to limit the stale-data window if invalidation fails. The cache is
invalidated eagerly on assignment changes per ADR-069. The cache is
deployed as a three-node Redis Cluster per region, with cross-region
replication for failover. Reads are the sole hot path for the resolver; cache
misses fall through to the database and back-fill the cache. The cache is
tenant-scoped via a tenant_id prefix on the key, ensuring that a Redis SCAN
operation scoped to one tenant cannot enumerate another tenant's keys.
DETAILED RATIONALE
The Redis Cluster with eager invalidation was chosen over the in-process
Caffeine cache because the cross-instance invalidation problem is fundamental.
PreOne's backend runs as multiple Spring Boot instances behind a load
balancer; a permission change processed by instance A must be visible to
instance B within 60 seconds. The in-process Caffeine cache has no cross-
instance invalidation mechanism (a pub/sub layer would be required, which
negates the simplicity advantage). The Redis cache's eager invalidation (per
ADR-069) provides cross-instance invalidation natively via Redis pub/sub,
which is the standard pattern for distributed cache invalidation. The two-layer
cache (Caffeine in front of Redis) was rejected because the marginal benefit is
small at PreOne's cache hit pattern. The Redis round-trip is under 1ms within a
region, which is well within the 5ms p99 budget. Adding a Caffeine layer would
reduce the hot-principal latency from 1ms to 0.1ms, which is not perceptible to
the user and does not justify the operational complexity of two layers. The two-
layer cache is the standard pattern for very-high-throughput systems (e.g.,
social media feeds) where the inner layer's latency matters; PreOne's
throughput does not justify it. The TTL-only invalidation was rejected because
it violates the 60-second freshness requirement in the average case. A 1-minute
TTL means that an assignment change takes up to 1 minute to be visible (the
worst case), which is acceptable, but the average case is 30 seconds, which is
also acceptable; the problem is that the worst case can be longer if the cache is
back-filled just before the change. Eager invalidation makes the worst case 60
seconds (the invalidation pipeline's budget per ADR-069), which is the
requirement. The TTL is retained as a safety net for invalidation failures: if the
invalidation pipeline fails for any reason, the TTL ensures that stale data is
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 102

PreOne ADR - Volume 4: Security Architecture v3.0
eventually replaced. The 5-minute TTL is chosen as a balance between
freshness (shorter is better) and cache hit rate (longer is better). A 5-minute
TTL with eager invalidation gives a 95% hit rate at PreOne's projected access
pattern (each principal's permissions are accessed 20+ times per 5-minute
window). A shorter TTL (e.g., 1 minute) would reduce the hit rate to 80%, which
would elevate the cold-cache rate and the database load. A longer TTL (e.g., 30
minutes) would not improve the hit rate significantly (the access pattern is
bursty, not steady) and would increase the stale-data window if invalidation
fails. The tenant-scoped key (tenant_id:{tenant_id}:principal_id:
{principal_id}:algorithm_version:{v}) is the critical security property. It
ensures that a Redis SCAN operation scoped to one tenant (e.g., for cache
inspection or debugging) cannot enumerate another tenant's keys, which is a
tenant-isolation requirement (ADR-043). The key structure also supports
efficient bulk invalidation (delete all keys for a tenant via SCAN + DEL) for the
rare case where a tenant-wide change requires full cache flush. The
algorithm_version in the key is the second critical property. It ensures that an
algorithm change (per ADR-067) does not produce stale cached values: a new
algorithm version produces a new key namespace, which is cold, forcing a cold-
cache rebuild. The old key namespace is allowed to expire via TTL, which is a
graceful cleanup mechanism. This pattern is standard for versioned caches and
avoids the need for an explicit flush on algorithm change. The three-node Redis
Cluster per region is the minimum configuration that provides fault tolerance
(one node can fail without losing availability) and horizontal scalability (the
cache is sharded across the three nodes). The cross-region replication is
asynchronous (the primary region writes, the secondary regions replicate with
a small lag), which means that a region failover may produce a brief window of
stale data; this is acceptable because the resolver's cache fallback (per
ADR-067) preserves correctness during the window. The replication lag is
monitored and alerted on if it exceeds 5 seconds. The decision to make reads
the sole hot path (cache misses fall through to the database and back-fill) is the
standard cache-aside pattern. The alternative (read-through, where the cache
itself calls the resolver on miss) is rejected because it couples the cache to the
resolver's deployment, which complicates scaling and deployment. The cache-
aside pattern keeps the cache and the resolver independently deployable,
which is operationally simpler.
ARCHITECTURE DIAGRAM
+-----------------------------------------------------------+ | PREONE PERMISSION
CACHE | +-----------------------------------------------------------+ | Region A
(primary) | | +-------------------+ +-------------------+ | |
| Redis Cluster | | Redis Cluster | | | | Node A1 (shard 1) | | Node
A2 (shard 2) | | | +-------------------+ +-------------------+ | |
+-------------------+ | | | Redis Cluster | Async Replication
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 103

PreOne ADR - Volume 4: Security Architecture v3.0
| | | Node A3 (shard 3) | +------+ | | +-------------------+ | |
| | ^ v v | | | +-------------------+
| | | | Region B (secondary)| | | | | Redis Cluster |
| | | | (replica of A) | | | | +-------------------+
| | | | | +------+--------+ |
| | Resolver | READ: cache-aside | | | (ADR-067) | - GET key ->
HIT: return | | +---------------+ - GET key -> MISS: query DB, SET key | |
^ | | | | | +------
+--------+ | | | Assignment | WRITE: invalidate per
ADR-069 | | | Service | - PUBLISH invalidation event | |
+---------------+ - DEL key on all subscribers |
+-----------------------------------------------------------+ Key: tenant_id:{tid}:principal_id:
{pid}:algorithm_version:{v} TTL: 300 seconds (5 minutes) Value: JSON-
serialized permission set
SEQUENCE DIAGRAM
API Call -> Resolver: Resolve(principal_id) Resolver -> Redis: GET
tenant_id:T:principal_id:P:algorithm_version:V Redis -> Resolver: MISS Resolver
-> PostgreSQL: FETCH assignments + roles (snapshot read) PostgreSQL ->
Resolver: Rows Resolver -> Algorithm: Compute permission set Algorithm ->
Redis: SET key with TTL 300s Algorithm -> Resolver: Permission set Resolver ->
API Call: Return permission set Note over Redis: Later: API Call -> Resolver:
Resolve(principal_id) Resolver -> Redis: GET key Redis -> Resolver: HIT
(cached) Resolver -> API Call: Return cached permission set Note over
Assignment Service: Assignment changes: Assignment Service -> Invalidation
Bus: PUBLISH invalidate(P) Invalidation Bus -> Redis A1: DEL key Invalidation
Bus -> Redis A2: DEL key Invalidation Bus -> Redis A3: DEL key
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-068 — Permission Cache -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Admin UI | CRUD |
Role/Permission | | | | |------->| Service | | |
+----------------+ +----------+-----------+ | | |
| | | persists | | v
| | +----------------+ +----------------------+ | | | Repository | CRUD |
Postgres RBAC tables | | | | |------->| (roles, permissions, | | |
+----------------+ | bundles, assignments)| | |
+----------------------+ | | | | Cache (Redis)
for hot permission lookups | | Invalidation (ADR-069) on
role/permission change | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Permission Resolution Flow: User -> App: action request App -> Permission
Resolver: 'permissions for user X?' Resolver -> Cache (Redis): lookup (cache
miss) Resolver -> Postgres: query roles + bundles + assignments Resolver ->
Cache: store (TTL 5 min) Resolver -> App: effective permissions Cache
Invalidation Flow (on role/permission change): Admin -> RBAC Service: update
role RBAC Service -> Postgres: persist RBAC Service -> Invalidation
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 104

PreOne ADR - Volume 4: Security Architecture v3.0
Publisher: 'invalidate users with role X' Invalidation Publisher -> Redis: delete
cached entries Invalidation Publisher -> Audit: log 'CACHE_INVALIDATED'
DATABASE IMPACT
The permission cache does not add new database tables. It reads from the
role_assignments, roles, role_permissions, and permissions tables defined in
ADR-063, ADR-064, and ADR-065. The cache reduces database load by
approximately 20x at a 95% hit rate, which is the primary scalability benefit.
The cache's back-fill on miss uses the same snapshot read as the resolver (per
ADR-067), so the database's repeatable-read isolation is exercised on every
cache miss. The cache does not affect the database's write path; assignment
changes (which trigger cache invalidation) are writes to the role_assignments
table, which is unchanged.
API IMPACT
The cache is internal to the resolver; no new public endpoints are introduced.
The resolver's /internal/authz/resolve endpoint (per ADR-067) is the sole
consumer of the cache. The cache's behavior is transparent to the API callers:
they invoke the resolver, which checks the cache and falls through to the
database on miss. The cache's TTL and hit rate are exposed via the resolver's
observability dashboard (per ADR-067's monitoring section), not via a
dedicated API. The cache's invalidation is triggered by the assignment service's
writes (per ADR-069), which are internal to the authorization stack.
UI IMPACT
The effective permission resolver is invisible to end users — they see only the UI
elements their permissions allow. For admins, the 'User Detail' page includes a
'Effective Permissions' panel showing the computed permission set (read-only,
with a 'refresh' button to force cache invalidation). The 'Permission Cache
Health' dashboard (admin/operations/security/permissions) shows cache hit
rate, invalidation latency, and stale-cache incidents — accessible to the
Security Engineering team. Cache invalidation events are surfaced in the
admin 'Activity Log' for audit traceability.
SECURITY IMPACT
The tenant-scoped key is the critical security property. It ensures that a Redis
SCAN operation scoped to one tenant cannot enumerate another tenant's keys,
which is a tenant-isolation requirement (ADR-043). The cache does not store PII
(the permission set contains only permission IDs and scope IDs, not personal
data), so a cache compromise does not expose PII. The cache's TTL bounds the
stale-data window if invalidation fails, which is a defense-in-depth measure
against invalidation pipeline bugs. The cross-region replication is encrypted in
transit (TLS 1.3 per ADR-077) and at rest (Redis encryption at rest), so the
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 105

PreOne ADR - Volume 4: Security Architecture v3.0
replicated data is protected. The cache's failure mode (fail through to database)
preserves correctness, so a cache compromise cannot produce incorrect
authorization decisions (an attacker who modifies cached data would be
detected on the next invalidation, within 5 minutes at worst).
PERFORMANCE IMPACT
The cache meets the 5ms p99 budget with significant headroom: a cache hit is a
single Redis GET, which takes 0.5-1ms at p99. The cold-cache path (5% of
requests at steady state) takes 5-10ms at p99, which is within the 50ms cold-
cache budget. The cache reduces database load by 20x at a 95% hit rate, which
is the primary scalability benefit. The cache's memory footprint is
approximately 1KB per cached principal (the JSON-serialized permission set),
so 1 million cached principals is 1GB, which fits comfortably in the three-node
Redis Cluster's 12GB total memory. The cache's invalidation (per ADR-069)
adds a small write load (one DEL per assignment change), which is negligible
relative to the read load.
SCALABILITY ANALYSIS
The cache scales with the number of cached principals, projected to grow from
two hundred thousand to four million over three years. At 1KB per principal,
four million principals is 4GB, which fits in the three-node Redis Cluster's 12GB
total memory with headroom for growth. The cache's read throughput scales
with the number of Redis nodes (each shard handles a fraction of the read load);
at three nodes, the projected peak read rate (5,000 reads per second) is well
within each node's capacity (50,000+ reads per second). The cache's
invalidation throughput scales with the Redis pub/sub capacity, which is not a
bottleneck at PreOne's write rate. If the cache grows beyond 4GB, the cluster
can be expanded to five nodes without disruption (Redis Cluster supports
online resharding). No architectural ceiling is anticipated within the three-year
planning horizon.
OPERATIONAL CONSIDERATIONS
The Redis Cluster is deployed as a managed service (AWS ElastiCache for Redis
or equivalent) in each region, with cross-region replication configured for
failover. The on-call runbook covers four failure modes: single-node failure
(cluster continues with reduced capacity, alert), multi-node failure (cluster
unavailable, resolver fails through to database, alert), replication lag (alert if
lag exceeds 5 seconds, may indicate network issue), and cache corruption
(detection via spot-check job, mitigation via flush and rebuild). The cache's hit
rate, memory usage, and eviction rate are monitored on a dedicated dashboard.
The cache's TTL and invalidation behavior are tested in the quarterly game-day,
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 106

PreOne ADR  -  Volume 4: Security Architecture  v3.0
including a simulated invalidation pipeline failure to verify that the TTL bounds
the stale-data window.
RISKS
| Risk                 | Likelihood | Impact | Mitigation       |
| -------------------- | ---------- | ------ | ---------------- |
| Cache invalidation   | Medium     | High   | TTL bounds the   |
| pipeline fails       |            |        | stale window.    |
| silently, producing  |            |        | Invalidation     |
| stale permissions    |            |        | pipeline is      |
| for up to 5          |            |        | monitored with   |
| minutes (the TTL).   |            |        | alerts on lag >  |
60s. Spot-check
job compares
cache to database
hourly.
| Redis Cluster       | Medium | Medium | Three-node         |
| ------------------- | ------ | ------ | ------------------ |
| node failure        |        |        | cluster tolerates  |
| causes brief cache  |        |        | one node failure.  |
| unavailability,     |        |        | Resolver fails     |
| elevating cold-     |        |        | through to         |
| cache rate.         |        |        | database.          |
Database has
capacity for 5x
cold-cache rate.
| Cache key            | Low | High | Key construction      |
| -------------------- | --- | ---- | --------------------- |
| namespace            |     |      | is centralized in a   |
| collision across     |     |      | single library. CI    |
| tenants if           |     |      | test verifies tenant  |
| tenant_id prefix is  |     |      | isolation. Spot-      |
| omitted by a bug.    |     |      | check job verifies    |
no cross-tenant
keys.
| Algorithm version   | Low | Medium | Algorithm version   |
| ------------------- | --- | ------ | ------------------- |
| bump causes a       |     |        | bumps are rare      |
| cold-cache rebuild  |     |        | (quarterly at       |
| storm,              |     |        | most). Rebuild is   |
| overwhelming the    |     |        | rate-limited via a  |
| database.           |     |        | cache warm-up       |
job. Database has
capacity for 2x
cold-cache rate
during rebuild.
TRADE-OFFS
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  107

PreOne ADR - Volume 4: Security Architecture v3.0
We Gain We Lose
95% cache hit rate reduces database Operational complexity of Redis Cluster
load by 20x, meeting the scalability and the invalidation pipeline.
requirement.
Eager invalidation meets the 60-second Invalidation pipeline is a new failure
freshness requirement. mode that must be operated.
Tenant-scoped keys enforce tenant Key namespace is longer, slightly
isolation at the cache layer. increasing memory usage per key.
TTL bounds the stale-data window if TTL-only staleness (5 minutes) is
invalidation fails. unacceptable for the regulated market,
requiring the eager invalidation layer.
REJECTED ALTERNATIVES
The in-process Caffeine cache was rejected because it does not invalidate
across instances, which violates the 60-second freshness requirement in a
multi-instance deployment. The two-layer cache (Caffeine in front of Redis) was
rejected because the marginal benefit is small at PreOne's cache hit pattern
(the Redis round-trip is under 1ms) and the operational complexity of two layers
is not justified. The TTL-only invalidation was rejected because it violates the
60-second freshness requirement in the worst case and the average case. The
full reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter. Phase 1 (weeks 1-3): deploy the Redis
Cluster in each region; configure cross-region replication. Phase 2 (weeks 4-6):
deploy the resolver with the cache in shadow mode (resolver computes
permissions from database, cache is populated but not read). Phase 3 (weeks 7-
9): enable cache reads for a pilot group of 10 tenants; validate hit rate and
freshness. Phase 4 (weeks 10-12): enable cache reads for all tenants; the
database-only path remains as fallback. Phase 5 (week 13): the database-only
path is removed from the hot path (retained for audit reconstruction). Rollback
is possible at any point by disabling cache reads; the resolver falls through to
the database, which is correct but slower.
TESTING STRATEGY
The cache is tested at three levels. Unit tests cover the key construction (tenant
scoping, algorithm versioning), the TTL behavior, and the cache-aside pattern
(miss -> back-fill -> hit). Integration tests cover the Redis Cluster deployment
(node failure, resharding, replication lag), the invalidation behavior (per
ADR-069), and the cross-region failover. End-to-end tests cover the full request
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 108

PreOne ADR - Volume 4: Security Architecture v3.0
path with the cache enabled, including a simulated Redis outage to verify the
fallback behavior. Performance tests cover the cache hit rate at projected peak
load (5,000 reads per second) and the cold-cache rebuild behavior. The
acceptance criterion is a 95% cache hit rate at steady state and zero
correctness regressions during the shadow-mode period.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Cache hit rate: target above 95%, alert
below 90%. (2) Cache latency p99: target under 1ms, alert above 2ms. (3)
Memory usage: target under 70% of capacity, alert above 85%. (4) Eviction
rate: target zero (TTL should expire before eviction), alert on any non-zero
value (capacity issue). (5) Replication lag: target under 5 seconds, alert above
10 seconds. (6) Invalidation lag: target under 60 seconds, alert above 120
seconds (per ADR-069). A dedicated cache dashboard surfaces these alongside
the per-tenant cache size distribution, the algorithm-version adoption, and the
cross-region failover test results. Anomaly detection (per ADR-088) flags
unusual cache patterns (sudden hit rate drop, memory spike, eviction burst).
FUTURE EVOLUTION
The cache is expected to evolve in three directions. First, the cache may add a
context dimension (e.g., time-of-day bucket) to support time-dependent
permissions without per-request evaluation; this would require a key change
and is monitored but not planned for v1. Second, the cache may migrate from
Redis Cluster to Redis Enterprise for managed cross-region replication and
active-active support; this is a vendor decision driven by operational
complexity, not a cache-architecture change. Third, the cache may add a
streaming invalidation mode (WebSocket push to subscribers) to reduce the
invalidation lag below 60 seconds; this is monitored but not planned for v1.
RELATED ADRS
● ADR-061 - Identity Model (provides principal_id for the cache key)
● ADR-063 - Authorization (consumes the cached permission set)
● ADR-064 - RBAC Model (provides role hierarchy input to the resolver)
● ADR-065 - Assignment Model (assignment changes trigger cache
invalidation)
● ADR-066 - Bundle Strategy (bundle applies trigger cache invalidation)
● ADR-067 - Effective Permission Resolver (produces the cached values)
● ADR-069 - Cache Invalidation (invalidates the cache on assignment
changes)
● ADR-043 - Tenant Isolation (tenant-scoped cache keys)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 109

PreOne ADR  -  Volume 4: Security Architecture  v3.0
REFERENCES
● Redis Documentation, Cluster Specification. Redis Labs. 2024.
● Redis Documentation, Replication. Redis Labs. 2024.
● Owens, P. - Cache-Aside Pattern. Microsoft Azure Architecture Center.
2022.
● PreOne Engineering Handbook, Section 4.8 - Permission Cache.
Internal. 2025.
● AWS ElastiCache for Redis User Guide, Cross-Region Replication.
Amazon Web Services. 2024.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Authorization Platform Lead |     |
| ARB Chair   |     | Architecture Review Board   |     |
| Approved On |     | 2025-10-15                  |     |
IMPLEMENTATION CHECKLIST
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  110

PreOne ADR - Volume 4: Security Architecture v3.0
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Effective Permission Resolver implemented (Done)
● Redis cache for permission lookups (Done)
● Cache invalidation on role/permission change (Done — ADR-069)
● Admin 'Effective Permissions' panel (Done)
● Cache hit-rate monitoring (target >95%) (Done)
AD R -069
Cache Invalidation
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt an event-driven cache invalidation pipeline that publishes
invalidation events on a Redis Pub/Sub channel when assignment or role
changes occur, with subscribers in each backend instance that delete the
affected cache keys. The pipeline is the sole mechanism for cross-instance
cache invalidation; the TTL (per ADR-068) is the safety net for pipeline
failures. The pipeline's freshness budget is 60 seconds from write to
invalidation across all instances.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on performance
target breach, or on traffic pattern
change
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 111

PreOne ADR - Volume 4: Security Architecture v3.0
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The Permission Cache (ADR-068) requires eager invalidation to meet the 60-
second freshness requirement: an assignment change must be reflected in the
resolver's output within 60 seconds across all backend instances. The TTL (5
minutes) is the safety net, not the primary invalidation mechanism, because a 5-
minute stale-data window is unacceptable for the regulated education market
(a revoked teacher must not retain access for 5 minutes). The ARB considered
four invalidation strategies. The first is TTL-only (rejected in ADR-068). The
second is synchronous invalidation: the assignment-write transaction deletes
the cache key before committing, which is rejected because it couples the write
path to the cache (a cache failure blocks the write). The third is event-driven
invalidation via Redis Pub/Sub, which is selected because it decouples the write
path from the cache and meets the 60-second budget. The fourth is event-driven
invalidation via a message broker (Kafka, RabbitMQ), which is rejected because
the additional infrastructure is not justified at PreOne's invalidation volume (a
few hundred events per second peak). This ADR defines the invalidation
pipeline. The cache (which is invalidated) is defined in ADR-068. The events
(which trigger invalidation) are produced by the assignment service (ADR-065)
and the role service (ADR-064). This ADR defines the event format, the publish
path, the subscribe path, the failure modes, and the monitoring.
BUSINESS DRIVERS
The 2026 international expansion requires that the authorization stack reflect
assignment changes within 60 seconds for regulatory compliance (a revoked
teacher must not retain access for the duration of an investigation). The
business also requires that the invalidation pipeline not couple the write path to
the cache (a cache failure must not block assignment writes), which drives the
event-driven design. Finally, the business requires that the invalidation
pipeline be operationally simple (no additional infrastructure beyond Redis),
which drives the Redis Pub/Sub choice over a dedicated message broker.
PROBLEM STATEMENT
The Permission Cache requires eager invalidation to meet the 60-second
freshness requirement, but the invalidation must not couple the write path to
the cache (cache failures must not block writes). PreOne needs an event-driven
invalidation pipeline using Redis Pub/Sub that publishes invalidation events on
assignment or role changes, with subscribers in each backend instance that
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 112

PreOne ADR - Volume 4: Security Architecture v3.0
delete the affected cache keys, and a 60-second freshness budget from write to
invalidation.
CONSTRAINTS
● Invalidation must complete within 60 seconds across all backend
instances in all regions.
● Invalidation must not block the assignment or role write transaction
(decoupled via event publishing).
● Invalidation must be idempotent (duplicate events must not cause
incorrect behavior).
● Invalidation must survive subscriber restart (events published while a
subscriber is down must be processed on restart via a catch-up
mechanism).
● Invalidation must be observable: every event must be traceable from
publish to subscriber acknowledgment.
● Invalidation must degrade gracefully if Redis Pub/Sub is unavailable
(TTL is the safety net).
ASSUMPTIONS
● Redis Pub/Sub is available with at-least-once delivery semantics
(subscribers may receive duplicates but not loss).
● Backend instances can subscribe to a Redis Pub/Sub channel and
process events within 1 second of receipt.
● Assignment and role changes are infrequent relative to authorization
requests (write rate under 0.1% of read rate).
● The 60-second budget is sufficient for the invalidation pipeline (publish
+ subscribe + DEL) plus the cross-region replication lag.
● Subscriber restart is infrequent (deployments, failures) and the catch-
up mechanism can handle the backlog.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 113

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option              | Pros              | Cons                | Verdict |
| ------------------- | ----------------- | ------------------- | ------- |
| Redis Pub/Sub       | Decouples write   | Pub/Sub is fire-    | Adopted |
| event-driven        | path from cache.  | and-forget (no      |         |
| invalidation with   | Meets 60-second   | persistence);       |         |
| subscriber-side     | budget. No new    | subscriber restart  |         |
| DEL, catch-up via   | infrastructure    | requires a catch-   |         |
| periodic full-scan  | beyond Redis.     | up mechanism.       |         |
| reconciliation.     | Idempotent.       | Redis Pub/Sub       |         |
|                     | Observable.       | does not            |         |
guarantee delivery
(at-most-once in
the worst case).
| Synchronous        | Strongest           | Couples write      | Rejected |
| ------------------ | ------------------- | ------------------ | -------- |
| invalidation:      | freshness           | path to cache      |          |
| assignment-write   | guarantee           | (cache failure     |          |
| transaction        | (invalidation is    | blocks write).     |          |
| deletes the cache  | atomic with the     | Adds latency to    |          |
| key before         | write). No event-   | the write path     |          |
| committing.        | driven pipeline to  | (DEL round-trip).  |          |
|                    | operate.            | Rejected by ARB    |          |
as a coupling anti-
pattern.
| Message broker   | Persistent events   | Additional           | Rejected |
| ---------------- | ------------------- | -------------------- | -------- |
| (Kafka or        | (no catch-up        | infrastructure       |          |
| RabbitMQ) event- | mechanism           | (Kafka cluster or    |          |
| driven           | needed). Stronger   | RabbitMQ cluster)    |          |
| invalidation.    | delivery            | is not justified at  |          |
|                  | guarantees. Better  | PreOne's             |          |
|                  | observability       | invalidation         |          |
|                  | tooling.            | volume (a few        |          |
hundred events
per second peak).
Operational
complexity
disproportionate
to the benefit.
| Database trigger    | Strongest           | Polling adds         | Rejected |
| ------------------- | ------------------- | -------------------- | -------- |
| invalidation:       | consistency         | latency (60-second   |          |
| PostgreSQL          | (invalidation is    | budget may be        |          |
| trigger on          | atomic with the     | tight). Trigger-     |          |
| role_assignments    | write via the same  | based invalidation   |          |
| writes an           | transaction). No    | is fragile (trigger  |          |
| invalidation        | new                 | bugs are hard to     |          |
| record to a table,  | infrastructure.     | debug). Couples      |          |
| polled by           |                     | invalidation to the  |          |
| subscribers.        |                     | database schema.     |          |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  114

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
ADOPTED
Adopt a Redis Pub/Sub event-driven invalidation pipeline. When an
assignment or role change is committed, the assignment or role service
publishes an invalidation event to a Redis Pub/Sub channel
(preone:authz:invalidation). Each backend instance subscribes to the
channel and, on receipt of an event, deletes the affected cache keys (per
ADR-068's key structure). The event format is JSON: {event_id, event_type,
principal_id, tenant_id, role_id, timestamp, algorithm_version}. The
pipeline is idempotent (duplicate events produce no incorrect behavior,
since DEL is idempotent). The catch-up mechanism is a periodic full-scan
reconciliation (every 5 minutes, a job scans the cache and the database for
inconsistencies and deletes stale keys). The 60-second freshness budget is
monitored and alerted on.
DETAILED RATIONALE
The Redis Pub/Sub event-driven approach was chosen over the synchronous
approach because the coupling anti-pattern is the ARB's primary concern.
Synchronous invalidation couples the assignment-write transaction to the
cache: a cache failure (Redis unavailable, network partition) blocks the write,
which is unacceptable for an authorization stack (assignment writes must
succeed even if the cache is down). The event-driven approach decouples the
write path (which publishes the event) from the cache (which subscribes and
deletes), so a cache failure does not block writes; the events are simply not
processed until the cache recovers, and the TTL (per ADR-068) bounds the
stale-data window. The message-broker approach (Kafka or RabbitMQ) was
rejected because the additional infrastructure is not justified at PreOne's
invalidation volume. The projected peak is a few hundred invalidation events
per second (year-end role reset, bulk onboarding), which is well within Redis
Pub/Sub's capacity (tens of thousands of events per second). The stronger
delivery guarantees (persistent events, exactly-once semantics) are nice-to-
have but not necessary: the catch-up mechanism (periodic full-scan
reconciliation) handles subscriber restart and event loss, and idempotency
(DEL is idempotent) handles duplicates. The operational complexity of a Kafka
or RabbitMQ cluster (brokers, zookeeper/raft, consumers, monitoring) is
disproportionate to the benefit at PreOne's scale. The database-trigger
approach was rejected because trigger-based invalidation is fragile (trigger
bugs are hard to debug, trigger ordering is non-obvious) and the polling latency
may exceed the 60-second budget. The event-driven approach with Pub/Sub is
more transparent (the publish is explicit in the application code) and faster
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 115

PreOne ADR - Volume 4: Security Architecture v3.0
(subscribers process events within 1 second of receipt). The catch-up
mechanism (periodic full-scan reconciliation every 5 minutes) is the most
important resilience property. Redis Pub/Sub is fire-and-forget: if a subscriber
is down (deployment, failure) when an event is published, the subscriber misses
the event. The catch-up mechanism detects and corrects this: every 5 minutes,
a job scans the cache for keys whose corresponding database state has changed
(by comparing a hash of the resolved permission set to the cached hash) and
deletes stale keys. The catch-up mechanism is not the primary invalidation path
(it's too slow for the 60-second budget) but it ensures that missed events are
eventually corrected, bounding the stale-data window to 5 minutes (the catch-
up interval) in the worst case, which is the same as the TTL (per ADR-068). The
event format (JSON with event_id, event_type, principal_id, tenant_id, role_id,
timestamp, algorithm_version) is designed for observability and idempotency.
The event_id is a UUIDv7 (per ADR-041) that allows deduplication (subscribers
can track processed event_ids and skip duplicates). The event_type
(ASSIGNMENT_CREATE, ASSIGNMENT_UPDATE, ASSIGNMENT_DELETE,
ROLE_CREATE, ROLE_UPDATE, ROLE_DELETE) drives the invalidation
scope: an ASSIGNMENT_CREATE for principal P invalidates P's cache key, a
ROLE_UPDATE for role R invalidates all principals with assignments
referencing R (which requires a reverse lookup). The timestamp allows
subscribers to detect out-of-order events (an older event arriving after a newer
one is ignored if the subscriber has already processed the newer one). The
algorithm_version allows the subscriber to skip events for stale algorithm
versions (which would invalidate already-cold keys). The decision to make the
pipeline idempotent (DEL is idempotent) is the most important operational
property. Idempotency means that duplicate events (which Redis Pub/Sub can
produce under network partitions) cause no incorrect behavior: deleting an
already-deleted key is a no-op. Idempotency also means that the catch-up
mechanism (which may delete keys that were already invalidated by the
primary path) causes no incorrect behavior. Idempotency simplifies the
pipeline's error handling: a subscriber can process events in any order, retry
failed events, and re-process events after a restart, all without producing
incorrect cache state. The 60-second freshness budget is monitored via two
metrics: (1) publish-to-subscribe lag (the time between event publish and
subscriber receipt), which is typically under 1 second; (2) subscribe-to-DEL lag
(the time between subscriber receipt and cache key deletion), which is typically
under 100ms. The total lag is typically under 2 seconds, well within the 60-
second budget. The budget is alerted on if the total lag exceeds 60 seconds,
which would indicate a pipeline failure (subscriber down, Redis Pub/Sub
unavailable, catch-up mechanism failing).
ARCHITECTURE DIAGRAM
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 116

PreOne ADR - Volume 4: Security Architecture v3.0
+-----------------------------------------------------------+ | PREONE CACHE
INVALIDATION PIPELINE | +-----------------------------------------------------------+
| Assignment Service (ADR-065) | | - on commit: publish
invalidation event | +-----------------------------------------------------------+ |
v +---------------------------+ | Redis Pub/Sub Channel | |
preone:authz:invalidation | +---------------------------+ | +------+--------
+--------+ | | | | v v v v +----------+ +----------
+ +----------+ +----------+ | Backend | | Backend | | Backend | | Backend | |
Instance | | Instance | | Instance | | Instance | | 1 | | 2 | | 3 | | N
| +----------+ +----------+ +----------+ +----------+ | | | | v
v v v +----------+ +----------+ +----------+ +----------+ | Redis | | Redis
| | Redis | | Redis | | DEL key | | DEL key | | DEL key | | DEL key |
+----------+ +----------+ +----------+ +----------+ | +------+--------+ |
| v v +-----------------+ +-----------------+ | Catch-up Job | |
Monitoring | | (every 5 min) | | (lag metrics) | | Full-scan | |
| | reconciliation | | | +-----------------+ +-----------------+ Event format:
{event_id, event_type, principal_id, tenant_id, role_id, timestamp,
algorithm_version}
SEQUENCE DIAGRAM
Assignment Service -> PostgreSQL: BEGIN TX PostgreSQL -> Assignment
Service: INSERT role_assignment Assignment Service -> PostgreSQL: COMMIT
Assignment Service -> Redis Pub/Sub: PUBLISH invalidation event Redis
Pub/Sub -> Backend Instance 1: Event received Redis Pub/Sub -> Backend
Instance 2: Event received Redis Pub/Sub -> Backend Instance N: Event
received Backend Instance 1 -> Redis Cache: DEL key (principal_id) Backend
Instance 2 -> Redis Cache: DEL key (principal_id) Backend Instance N -> Redis
Cache: DEL key (principal_id) Note over Backend Instance: If subscriber was
down: Catch-up Job -> Redis Cache: SCAN keys Catch-up Job -> PostgreSQL:
Compare to current state PostgreSQL -> Catch-up Job: Stale keys identified
Catch-up Job -> Redis Cache: DEL stale keys Monitoring -> Pipeline: Measure
publish-to-DEL lag Monitoring -> Alerting: Alert if lag > 60s
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-069 — Cache Invalidation -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Admin UI | CRUD |
Role/Permission | | | | |------->| Service | | |
+----------------+ +----------+-----------+ | | |
| | | persists | | v
| | +----------------+ +----------------------+ | | | Repository | CRUD |
Postgres RBAC tables | | | | |------->| (roles, permissions, | | |
+----------------+ | bundles, assignments)| | |
+----------------------+ | | | | Cache (Redis)
for hot permission lookups | | Invalidation (ADR-069) on
role/permission change | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Permission Resolution Flow: User -> App: action request App -> Permission
Resolver: 'permissions for user X?' Resolver -> Cache (Redis): lookup (cache
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 117

PreOne ADR - Volume 4: Security Architecture v3.0
miss) Resolver -> Postgres: query roles + bundles + assignments Resolver ->
Cache: store (TTL 5 min) Resolver -> App: effective permissions Cache
Invalidation Flow (on role/permission change): Admin -> RBAC Service: update
role RBAC Service -> Postgres: persist RBAC Service -> Invalidation
Publisher: 'invalidate users with role X' Invalidation Publisher -> Redis: delete
cached entries Invalidation Publisher -> Audit: log 'CACHE_INVALIDATED'
DATABASE IMPACT
The invalidation pipeline does not add new database tables. It reads from the
role_assignments, roles, and role_permissions tables (defined in ADR-064 and
ADR-065) for the catch-up job's full-scan reconciliation. The catch-up job's
query is a hash comparison: it computes a hash of the resolved permission set
for each cached principal and compares it to the cached hash, deleting stale
keys. The query is indexed on (principal_id, updated_at) for efficiency. The
pipeline does not affect the database's write path; the assignment service's
writes (which trigger invalidation) are unchanged.
API IMPACT
The invalidation pipeline is internal to the authorization stack; no new public
endpoints are introduced. The assignment service's write endpoints (per
ADR-065) publish invalidation events after commit; this is transparent to the
API callers. The pipeline's behavior is exposed via the authorization stack's
observability dashboard (per ADR-067 and ADR-068), not via a dedicated API.
The pipeline's catch-up job is scheduled via the standard job scheduler and is
observable via the job's health-check endpoint.
UI IMPACT
The effective permission resolver is invisible to end users — they see only the UI
elements their permissions allow. For admins, the 'User Detail' page includes a
'Effective Permissions' panel showing the computed permission set (read-only,
with a 'refresh' button to force cache invalidation). The 'Permission Cache
Health' dashboard (admin/operations/security/permissions) shows cache hit
rate, invalidation latency, and stale-cache incidents — accessible to the
Security Engineering team. Cache invalidation events are surfaced in the
admin 'Activity Log' for audit traceability.
SECURITY IMPACT
The invalidation pipeline is the mechanism that enforces the 60-second
freshness requirement, which is the regulatory requirement for the 2026
expansion (a revoked teacher must not retain access for the duration of an
investigation). The pipeline's idempotency ensures that duplicate events (which
could be produced by an attacker with Pub/Sub access) cause no incorrect
behavior. The pipeline's catch-up mechanism ensures that missed events
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 118

PreOne ADR - Volume 4: Security Architecture v3.0
(which could be caused by an attacker taking down a subscriber) are eventually
corrected, bounding the stale-data window to 5 minutes (the catch-up interval).
The pipeline's observability (event_id tracing from publish to subscriber
acknowledgment) enables forensic investigation of invalidation failures. The
pipeline does not handle PII (the event format contains only principal_id,
tenant_id, role_id, and timestamps), so a pipeline compromise does not expose
PII.
PERFORMANCE IMPACT
The invalidation pipeline adds a small overhead to the assignment-write path:
one Redis PUBLISH per write, which takes under 1ms. The pipeline's
subscriber-side processing (DEL) is also under 1ms per event. The catch-up
job's full-scan reconciliation runs every 5 minutes and takes 10-30 seconds
(depending on cache size), which is acceptable for a background job. The
pipeline's impact on the read path is zero: the pipeline only invalidates cache
keys, it does not serve reads. The pipeline's monitoring (publish-to-DEL lag) is
sampled at 1% to avoid overhead.
SCALABILITY ANALYSIS
The pipeline scales with the invalidation event rate, projected to peak at a few
hundred events per second (year-end role reset, bulk onboarding). Redis
Pub/Sub's capacity is tens of thousands of events per second, so the pipeline
has significant headroom. The subscriber-side processing (DEL) is bounded by
the number of backend instances (typically 10-20), so the DEL load is
distributed. The catch-up job's full-scan reconciliation scales with the cache
size (1 million cached principals), which takes 10-30 seconds at the projected
peak; this is acceptable for a 5-minute interval. If the cache grows beyond 5
million principals, the catch-up interval may need to increase to 10 minutes to
keep the job's runtime under 60 seconds. No architectural ceiling is anticipated
within the three-year planning horizon.
OPERATIONAL CONSIDERATIONS
The invalidation pipeline is deployed as part of the backend (subscribers are
libraries embedded in the Spring Boot instances) and the Redis Cluster
(Pub/Sub channel and the catch-up job's scan target). The on-call runbook
covers four failure modes: Redis Pub/Sub unavailable (subscribers miss events,
catch-up mechanism corrects within 5 minutes, alert), subscriber down (events
missed, catch-up mechanism corrects on restart, alert), catch-up job failing
(stale data may persist beyond 5 minutes, alert, manual reconciliation
procedure documented), and event-publish failure (assignment-write succeeds,
event not published, catch-up mechanism corrects within 5 minutes, alert). The
pipeline's monitoring (publish-to-DEL lag, event-loss rate, catch-up job
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 119

PreOne ADR  -  Volume 4: Security Architecture  v3.0
runtime) is on a dedicated dashboard. Each failure mode is tested in the
quarterly game-day, including a simulated Pub/Sub outage to verify the catch-
up mechanism's effectiveness.
RISKS
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Redis Pub/Sub      | Medium     | Medium | Catch-up job runs   |
| event loss         |            |        | every 5 minutes.    |
| (subscriber down   |            |        | TTL (5 minutes      |
| during publish)    |            |        | per ADR-068)        |
| produces stale     |            |        | bounds the stale    |
| permissions until  |            |        | window.             |
| the catch-up job   |            |        | Monitoring alerts   |
| runs (up to 5      |            |        | on event-loss rate. |
minutes).
| Catch-up job's full- | Low | Medium | Job is indexed on   |
| -------------------- | --- | ------ | ------------------- |
| scan                 |     |        | (principal_id,      |
| reconciliation       |     |        | updated_at). Job's  |
| becomes a scaling    |     |        | runtime is          |
| bottleneck as the    |     |        | monitored.          |
| cache grows.         |     |        | Interval can be     |
increased if
runtime exceeds
60 seconds.
| Subscriber restart  | Low | Medium | Catch-up job is     |
| ------------------- | --- | ------ | ------------------- |
| during a high-      |     |        | rate-limited. Bulk  |
| volume              |     |        | invalidations are   |
| invalidation burst  |     |        | batched and rate-   |
| (e.g., year-end     |     |        | limited per         |
| role reset)         |     |        | ADR-065.            |
| produces a          |     |        | Monitoring alerts   |
| backlog that        |     |        | on backlog size.    |
overwhelms the
catch-up job.
| Invalidation event  | Medium | Medium | Event format is   |
| ------------------- | ------ | ------ | ----------------- |
| format change       |        |        | versioned         |
| breaks              |        |        | (event_format_ver |
| subscribers during  |        |        | sion field).      |
| a rolling           |        |        | Subscribers       |
| deployment.         |        |        | handle multiple   |
versions during
rolling
deployment. CI
tests version
compatibility.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  120

PreOne ADR - Volume 4: Security Architecture v3.0
TRADE-OFFS
We Gain We Lose
Event-driven invalidation decouples Pub/Sub is fire-and-forget; catch-up
write path from cache, preserving write mechanism is required for resilience.
availability during cache failure.
Redis Pub/Sub avoids additional Weaker delivery guarantees than a
infrastructure (no Kafka or RabbitMQ). persistent message broker; catch-up
mechanism compensates.
Idempotent DEL simplifies error Subscribers must track processed
handling and enables retry. event_ids to avoid redundant work
(minor overhead).
Catch-up mechanism bounds the stale- Catch-up job's full-scan reconciliation
data window to 5 minutes even under adds background load to the database
pipeline failure. and Redis.
REJECTED ALTERNATIVES
The synchronous invalidation approach was rejected because it couples the
assignment-write transaction to the cache, which is a coupling anti-pattern: a
cache failure blocks the write, which is unacceptable for an authorization stack.
The message-broker approach (Kafka, RabbitMQ) was rejected because the
additional infrastructure is not justified at PreOne's invalidation volume (a few
hundred events per second peak); Redis Pub/Sub's capacity is tens of thousands
of events per second, and the catch-up mechanism compensates for the weaker
delivery guarantees. The database-trigger approach was rejected because
trigger-based invalidation is fragile (trigger bugs are hard to debug) and the
polling latency may exceed the 60-second budget. The full reasoning is
captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter, alongside the cache migration (per
ADR-068). Phase 1 (weeks 1-3): deploy the Redis Pub/Sub channel and the
subscriber library; subscribers log events but do not DEL (shadow mode).
Phase 2 (weeks 4-6): enable subscriber-side DEL for a pilot group of 10 tenants;
validate the publish-to-DEL lag and the event-loss rate. Phase 3 (weeks 7-9):
enable subscriber-side DEL for all tenants; the catch-up job is deployed in
shadow mode (logging stale keys but not deleting). Phase 4 (weeks 10-12):
enable the catch-up job's DEL; the pipeline is fully operational. Phase 5 (week
13): the shadow-mode logging is removed. Rollback is possible at any point by
disabling the subscriber-side DEL; the cache falls back to TTL-only invalidation
(5-minute stale window), which is correct but slower to reflect changes.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 121

PreOne ADR - Volume 4: Security Architecture v3.0
TESTING STRATEGY
The invalidation pipeline is tested at three levels. Unit tests cover the event-
publish logic, the subscriber-side DEL, the idempotency (duplicate events
produce no incorrect behavior), and the event-format versioning. Integration
tests cover the Redis Pub/Sub channel (publish, subscribe, event loss,
subscriber restart), the catch-up job's full-scan reconciliation, and the cross-
region replication of events. End-to-end tests cover the full assignment-write ->
event-publish -> subscriber-DEL -> cache-miss -> resolver-database-query
path, including a simulated Pub/Sub outage to verify the catch-up mechanism.
Performance tests cover the publish-to-DEL lag at projected peak event rate (a
few hundred events per second) and the catch-up job's runtime at projected
cache size. The acceptance criterion is a publish-to-DEL lag under 60 seconds
at p99 and zero stale-data incidents during the shadow-mode period.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Publish-to-subscribe lag p99: target under
1 second, alert above 5 seconds. (2) Subscribe-to-DEL lag p99: target under
100ms, alert above 500ms. (3) Event-loss rate: target under 0.1%, alert above
1% (subscribers may be missing events). (4) Catch-up job runtime: target under
60 seconds, alert above 120 seconds (may need interval increase). (5) Catch-up
job stale-key count: target under 100 per run, alert above 1,000 (pipeline may
be failing). (6) Event-publish failure rate: target under 0.01%, alert above 0.1%
(assignment writes may be outpacing publishes). A dedicated invalidation
dashboard surfaces these alongside the per-event-type distribution, the per-
subscriber DEL rate, and the cross-region replication lag. Anomaly detection
(per ADR-088) flags unusual invalidation patterns (event bursts, subscriber
DEL rate drops, catch-up job runtime spikes).
FUTURE EVOLUTION
The pipeline is expected to evolve in three directions. First, the catch-up
mechanism may migrate from full-scan reconciliation to a delta-based approach
(only scan principals whose assignments changed since the last catch-up) if the
full-scan runtime becomes a scaling concern; this is a performance
optimization, not a redesign. Second, the pipeline may add a streaming
invalidation mode (WebSocket push to subscribers) to reduce the publish-to-
DEL lag below 1 second for time-sensitive workflows; this is monitored but not
planned for v1. Third, the pipeline may migrate from Redis Pub/Sub to Redis
Streams (which provide persistent events and consumer groups) if the event-
loss rate becomes a concern; this would eliminate the catch-up mechanism but
add operational complexity, and is monitored but not planned for v1.
RELATED ADRS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 122

PreOne ADR - Volume 4: Security Architecture v3.0
● ADR-061 - Identity Model (provides principal_id for the invalidation
event)
● ADR-063 - Authorization (consumes the invalidated cache via the
resolver)
● ADR-064 - RBAC Model (role changes trigger invalidation)
● ADR-065 - Assignment Model (assignment changes trigger invalidation)
● ADR-066 - Bundle Strategy (bundle applies trigger invalidation)
● ADR-067 - Effective Permission Resolver (produces the cached values
that are invalidated)
● ADR-068 - Permission Cache (the cache that is invalidated)
● ADR-086 - Audit Trail (records invalidation events for forensic
investigation)
REFERENCES
● Redis Documentation, Pub/Sub. Redis Labs. 2024.
● Redis Documentation, Streams (alternative to Pub/Sub). Redis Labs.
2024.
● Thomson, A. and Abadi, D. - Calvin: Fast Distributed Transactions for
Partitioned Database Systems. ACM SIGMOD. 2012.
● PreOne Engineering Handbook, Section 4.9 - Cache Invalidation.
Internal. 2025.
● Tanenbaum, A. and Van Steen, M. - Distributed Systems, Chapter 7
(Consistency and Replication). Pearson. 2017.
DECISION HISTORY
Date Status Actor Notes
2025-08-01 Draft Platform Security Initial draft;
Architect options
enumerated;
consultation with
security and
engineering teams
2025-09-17 Proposed Platform Security Submitted to
Architect Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 123

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status   | Actor     | Notes          |
| ---------- | -------- | --------- | -------------- |
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect |     |
| ----------- | --- | --------------------------- | --- |
| Tech Lead   |     | Authorization Platform Lead |     |
| ARB Chair   |     | Architecture Review Board   |     |
| Approved On |     | 2025-10-15                  |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Effective Permission Resolver implemented (Done)
● Redis cache for permission lookups (Done)
● Cache invalidation on role/permission change (Done — ADR-069)
● Admin 'Effective Permissions' panel (Done)
● Cache hit-rate monitoring (target >95%) (Done)
AD R -070
JWT Policy
Volume 4 — Security Architecture  -  Identity & Security
ACCEPTED
DECISION SUMMARY
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  124

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
Adopt RS256-signed JWTs with a 15-minute access-token lifetime, a 7-day
refresh-token lifetime, and a quarterly signing-key rotation with a 24-hour
dual-key validation window. The JWT carries the principal_id, tenant_id,
scope, and a key_id header that identifies the signing key. Tokens are
stateless (no server-side session lookup on the hot path) and are validated
via asymmetric signature verification using the public key published at the
JWKS endpoint.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on cryptography
standard update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The legacy token strategy uses HS256-signed JWTs with a 24-hour lifetime and
a single static signing key stored in environment variables. This strategy has
three significant weaknesses that this ADR addresses. First, signing algorithm.
HS256 is symmetric, meaning the same key signs and verifies. Any service that
can verify a token can also forge one, which violates the principle of least
privilege and makes a compromised service a token-forgery vector. RS256 is
asymmetric, meaning only the authorization server holds the signing key and
all other services hold the public key for verification; a compromised service
cannot forge tokens. Second, token lifetime. A 24-hour access token is far too
long: a stolen token is valid for up to 24 hours, which is an unacceptable
exposure window. The industry standard for access tokens is 5-60 minutes;
PreOne adopts 15 minutes as a balance between security (shorter is better) and
user experience (longer means fewer refreshes). The refresh token (per
ADR-071) handles the long-lived session. Third, key rotation. The static signing
key has not been rotated in two years, which means a key compromise (e.g., via
a leaked environment variable) would be catastrophic and undetectable.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 125

PreOne ADR - Volume 4: Security Architecture v3.0
Quarterly rotation with a dual-key validation window is the standard practice
and limits the blast radius of a key compromise to one quarter. This ADR
defines the JWT policy. The refresh token lifecycle (rotation, reuse detection) is
defined in ADR-071. The MFA enforcement (which may require step-up tokens)
is defined in ADR-072. This ADR defines the access token format, signing,
lifetime, claims, and rotation.
BUSINESS DRIVERS
The 2026 international expansion requires that the platform satisfy the OAuth
2.1 security profile, which recommends asymmetric signing (RS256 or ES256)
and short-lived access tokens. The business also requires that token
compromise be detectable and recoverable within hours, not days, which drives
the short lifetime and the quarterly rotation. Finally, the business requires that
token validation be stateless (no server-side session lookup on the hot path),
which is the primary performance benefit of JWTs over opaque tokens and
which the asymmetric signature enables.
PROBLEM STATEMENT
The legacy HS256 JWT with a 24-hour lifetime and a static signing key is
insecure (compromised services can forge tokens), has an unacceptable
exposure window for stolen tokens (24 hours), and has no rotation story (a key
compromise is catastrophic and undetectable). PreOne needs an RS256 JWT
policy with a 15-minute access-token lifetime, a 7-day refresh-token lifetime,
and quarterly signing-key rotation.
CONSTRAINTS
● Access token lifetime must be 15 minutes (900 seconds); refresh token
lifetime must be 7 days (604800 seconds).
● Signing algorithm must be RS256 (asymmetric); the signing key must
never leave the authorization server.
● Signing keys must be rotated quarterly with a 24-hour dual-key
validation window for in-flight tokens.
● The JWT must carry principal_id, tenant_id, scope, and a key_id header
identifying the signing key.
● Token validation must be stateless (no server-side session lookup on
the hot path).
● The JWKS endpoint must be publicly readable (it publishes only public
keys) and cached aggressively by clients.
ASSUMPTIONS
● The authorization server (per ADR-062) is the sole issuer of PreOne
JWTs.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 126

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● AWS KMS (per ADR-078) is available for signing-key storage and
rotation.
● All backend services can fetch and cache the JWKS endpoint for public-
key verification.
● The 15-minute access token lifetime is acceptable to users (the refresh
token handles the long-lived session transparently).
● The quarterly rotation cadence is frequent enough to limit key-
compromise blast radius and infrequent enough to avoid operational
overhead.
OPTIONS CONSIDERED
| Option              | Pros                | Cons                | Verdict |
| ------------------- | ------------------- | ------------------- | ------- |
| RS256 JWT,          | Asymmetric          | RS256 signatures    | Adopted |
| 15min access, 7d    | signing limits      | are larger than     |         |
| refresh, quarterly  | forgery to the      | HS256 (256 bytes    |         |
| rotation with dual- | authorization       | vs 32 bytes). JWKS  |         |
| key window, JWKS    | server. Short       | endpoint is a new   |         |
| endpoint.           | lifetime limits     | dependency.         |         |
|                     | stolen-token        | Rotation requires   |         |
|                     | exposure.           | operational         |         |
|                     | Quarterly rotation  | discipline.         |         |
limits key-
compromise blast
radius. Stateless
validation is fast.
| HS256 JWT with    | Smaller          | Symmetric signing     | Rejected |
| ----------------- | ---------------- | --------------------- | -------- |
| 15min access and  | signatures.      | means any             |          |
| 7d refresh,       | Simpler key      | verifying service     |          |
| quarterly key     | management       | can forge tokens.     |          |
| rotation.         | (single shared   | Violates the OAuth    |          |
|                   | key). Faster     | 2.1 security          |          |
|                   | verification     | profile. Rejected     |          |
|                   | (HMAC is faster  | by ARB as             |          |
|                   | than RSA).       | insufficient for the  |          |
regulated
education market.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  127

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option               | Pros                 | Cons               | Verdict  |
| -------------------- | -------------------- | ------------------ | -------- |
| ES256 JWT            | Smaller              | ES256 is less      | Rejected |
| (ECDSA with          | signatures than      | widely supported   |          |
| P-256), 15min        | RS256 (64 bytes).    | than RS256 (some   |          |
| access, 7d refresh,  | Faster verification  | older clients and  |          |
| quarterly rotation.  | than RS256.          | libraries lack     |          |
|                      | Asymmetric.          | ECDSA support).    |          |
Slightly more
complex key
management.
Marginal benefit
over RS256 at
PreOne's scale.
| Opaque tokens      | Strongest          | Server-side         | Rejected |
| ------------------ | ------------------ | ------------------- | -------- |
| (random strings)   | revocation story   | session lookup on   |          |
| with server-side   | (token is invalid  | every request       |          |
| session lookup on  | the moment the     | adds 1-4ms to the   |          |
| every request.     | session is         | hot path. Violates  |          |
|                    | deleted). No       | the stateless-      |          |
|                    | signing key to     | validation          |          |
|                    | manage.            | requirement.        |          |
Scales poorly at
PreOne's
projected request
volume.
DECISION
ADOPTED
Adopt RS256-signed JWTs with a 15-minute access-token lifetime and a 7-
day refresh-token lifetime. The JWT header includes a key_id that identifies
the signing key, allowing the authorization server to rotate keys without
invalidating in-flight tokens. The JWT payload includes the principal_id
(subject), tenant_id, scope (space-delimited OAuth scopes), iat (issued at),
exp (expiration), and jti (unique token ID for audit). Signing keys are stored
in AWS KMS (per ADR-078) and rotated quarterly with a 24-hour dual-key
validation window: during rotation, both the old and new keys are valid for
verification, and the new key is used for signing. The JWKS endpoint at
/oauth2/jwks publishes the public keys for verification and is cached
aggressively by clients. Token validation is stateless: services verify the
signature using the cached public key, with no server-side session lookup.
DETAILED RATIONALE
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  128

PreOne ADR - Volume 4: Security Architecture v3.0
RS256 was chosen over HS256 because the asymmetric property is the critical
security improvement. With HS256, every service that verifies tokens holds the
signing key, which means a compromise of any service enables token forgery.
With RS256, only the authorization server holds the signing key; all other
services hold the public key, which cannot forge tokens. This is the principle of
least privilege applied to cryptographic keys, and it is the OAuth 2.1 security
profile recommendation. The larger signature size (256 bytes vs 32 bytes) is a
minor cost (the JWT is still under 1KB) and is offset by the security benefit.
ES256 was rejected over RS256 on compatibility grounds. ES256 offers smaller
signatures (64 bytes) and faster verification, but the marginal benefit at
PreOne's scale (token validation is under 1ms either way) does not justify the
compatibility risk: some older clients and libraries (notably, some SAML school
federations and older mobile clients) lack ECDSA support, which would require
a fallback to RS256 for those clients, complicating the implementation. RS256
is universally supported and is the safe default. ES256 may be revisited as a
future evolution (per the futureEvolution section) if compatibility concerns are
resolved. The opaque-token approach was rejected because the server-side
session lookup on every request adds 1-4ms to the hot path, which consumes
the entire authorization latency budget (per ADR-067). The stateless validation
of JWTs (signature verification only, no session lookup) is the primary
performance benefit and is essential for the projected request volume. The
trade-off is that JWT revocation is harder (a stolen token is valid until it expires),
which is mitigated by the short 15-minute lifetime and the refresh-token
rotation strategy (per ADR-071). The 15-minute access-token lifetime is the
most important parameter. A shorter lifetime (e.g., 5 minutes) would reduce the
stolen-token exposure window but would increase the refresh rate (every 5
minutes instead of every 15), which adds load to the token endpoint and
degrades the user experience (more frequent refreshes mean more frequent
latency spikes). A longer lifetime (e.g., 60 minutes) would reduce the refresh
rate but would extend the stolen-token exposure window, which is
unacceptable for the regulated education market. The 15-minute lifetime is the
industry standard for SPAs and mobile apps and is the balance point. The 7-day
refresh-token lifetime is the second most important parameter. A shorter
lifetime (e.g., 1 day) would force users to re-authenticate daily, which is
unacceptable for a school platform used by teachers all day. A longer lifetime
(e.g., 30 days) would extend the stolen-refresh-token exposure window, which
is mitigated by the rotation strategy (per ADR-071) but is still a concern. The 7-
day lifetime is the industry standard for web apps and is the balance point. The
refresh token is rotated on every use (per ADR-071), so a stolen refresh token is
detected (and invalidated) the next time the legitimate user refreshes. The
quarterly signing-key rotation with a 24-hour dual-key validation window is the
third most important parameter. The quarterly cadence limits the key-
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 129

PreOne ADR - Volume 4: Security Architecture v3.0
compromise blast radius to one quarter (a compromised key is rotated out
within 90 days). The 24-hour dual-key window ensures that in-flight tokens
(issued just before rotation) remain valid until they expire (max 15 minutes),
which avoids disrupting active sessions. The rotation is automated via AWS
KMS (per ADR-078) and is rehearsed in staging quarterly to verify the
automation. The old key is retained in KMS for the duration of the dual-key
window and then destroyed, which is the key-lifecycle management best
practice. The key_id header is the enabler for the dual-key window. Each JWT
includes the key_id of the signing key in its header, so the verifying service
knows which public key to use for verification. Without the key_id, the verifying
service would have to try all valid public keys, which is inefficient and error-
prone. The key_id is a UUIDv7 (per ADR-041) that is unique per key, allowing
the JWKS endpoint to publish multiple keys (the current and the previous,
during the dual-key window) and the verifying service to select the correct one.
The jti (JWT ID) claim is the enabler for audit and revocation. The jti is a
UUIDv7 that is unique per token, allowing the audit trail (per ADR-086) to
correlate a token to its issuance and use. The jti also enables token revocation
(a stolen token's jti can be added to a revocation list, which is checked on the
hot path via a Redis lookup), which is the mitigation for the stateless-validation
revocation weakness. The revocation list is short (only stolen tokens) and is
checked via a Redis lookup (under 1ms), so the revocation mechanism does not
violate the stateless-validation requirement in practice. The decision to publish
the JWKS endpoint publicly is the standard OAuth 2.1 practice. The JWKS
endpoint publishes only public keys, which are not sensitive (they are designed
to be distributed to verifiers). Publishing the JWKS publicly allows any service
(including third-party integrations) to verify PreOne JWTs without a shared
secret, which is the asymmetric-signing benefit. The JWKS endpoint is cached
aggressively by clients (1-hour cache) to reduce the load on the authorization
server, with a short TTL (5 minutes) in the cache header to allow key rotation to
propagate quickly.
ARCHITECTURE DIAGRAM
+-----------------------------------------------------------+ | PREONE JWT POLICY
| +-----------------------------------------------------------+ | Authorization Server (ADR-062)
| | - holds RS256 signing keys (in AWS KMS, per ADR-078) | | - issues JWTs on
/oauth2/token | | - rotates keys quarterly |
+-----------------------------------------------------------+ | v
+---------------------------+ | JWT Header | | - alg: RS256 | | - typ:
JWT | | - key_id: <UUIDv7> | +---------------------------+ | JWT
Payload | | - sub: principal_id | | - tenant_id: <tid> | | - scope:
"a b c" | | - iat, exp, jti | +---------------------------+ | JWT Signature
| | - RS256(signing_key, | | header + payload) | +---------------------------+
| v +---------------------------+ +---------------------------+ | JWKS Endpoint
|<-------| Backend Services | | /oauth2/jwks | | - fetch + cache
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 130

PreOne ADR - Volume 4: Security Architecture v3.0
public | | - publishes public keys | | keys (1h cache) | | - cached
1h by clients | | - verify JWT signature | +---------------------------+ |
(stateless, no session | | lookup) |
+---------------------------+ |
v +---------------------------+ | Redis
Revocation List | | - stolen jtis |
| - checked on hot path | | (<1ms lookup) |
+---------------------------+
SEQUENCE DIAGRAM
Client -> Authz Server: POST /oauth2/token (with refresh) Authz Server -> AWS
KMS: Sign JWT with current key AWS KMS -> Authz Server: Signed JWT Authz
Server -> Client: JWT (15min access, 7d refresh) Client -> Backend Service: API
call with Bearer JWT Backend Service -> Local Cache: Lookup public key by
key_id Local Cache -> Backend Service: Public key (or JWKS fetch) Backend
Service -> Signature Verify: Verify RS256 signature Signature Verify -> Backend
Service: Valid Backend Service -> Redis Revocation: Check jti (if revocation
enabled) Redis Revocation -> Backend Service: Not revoked Backend Service ->
Client: Response Note over Authz Server: Quarterly rotation: Authz Server ->
AWS KMS: Generate new signing key Authz Server -> JWKS Endpoint: Publish
new public key (keep old 24h) Authz Server -> Authz Server: Sign with new key
(dual-key validation 24h) Authz Server -> AWS KMS: Destroy old key (after 24h)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-070 — JWT Policy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Auth Service | issue | Token
Service | | | | |------->| (JWT / Refresh / | | | +----------------
+ | Session) | | | +----------+-----------+ | |
| | | | verify | |
v | | +----------------+ +----------------------+ | | | API Gateway |
recv | Token Validator | | | | |------->| (signature + exp) |
| | +----------------+ +----------+-----------+ | | |
| | | cache (Redis) | | v
| | +----------------+ +----------------------+ | | | Session Store | CRUD | Redis
| | | | |------->| (active sessions) | | | +----------------+
+----------------------+ | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Token Lifecycle Flow: Auth Service -> JWT Issuer: create
(header.payload.signature) JWT Issuer -> Client: access token (15min) +
refresh token (30d) Client -> API: Bearer token in header API -> Token
Validator: verify signature + expiry (valid) API -> App: process request
(expired) API -> Client: 401 (trigger refresh) Session Flow: Auth Service ->
Session Store (Redis): create session Client -> API: Bearer + session cookie
API -> Session Store: validate active (logout) API -> Session Store: delete
session API -> Audit: log 'SESSION_TERMINATED'
DATABASE IMPACT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 131

PreOne ADR - Volume 4: Security Architecture v3.0
The JWT policy adds one table. jwt_revocation_list holds revoked jtis with
columns jti (UUIDv7, PK), principal_id, tenant_id, revoked_at, revoked_by,
reason. The table is small (only stolen tokens are revoked) and is indexed on jti
for the hot-path lookup. The oauth_refresh_token table defined in ADR-062 is
retained for refresh-token metadata (per ADR-071). The signing keys are stored
in AWS KMS (per ADR-078), not in the database; the database stores only the
key_id and the key's metadata (created_at, rotated_at, destroyed_at) for audit
purposes. No changes to the identities table defined in ADR-061; the JWT
carries the principal_id but does not modify the identity record.
API IMPACT
The /oauth2/token endpoint (per ADR-062) issues JWTs with the format defined
in this ADR. The /oauth2/jwks endpoint is new and publishes the public keys for
verification. The /oauth2/revoke endpoint (per ADR-062) is extended to accept a
jti and add it to the revocation list. All protected API endpoints accept the
Authorization: Bearer <jwt> header and verify it via the Spring Security filter
chain (per ADR-062). The legacy X-Auth-Token header (per ADR-062) is
deprecated and removed at the end of the migration. The frontend caches the
JWT in memory (not in localStorage, to mitigate XSS token theft) and refreshes
it transparently via the refresh-token flow before it expires.
UI IMPACT
JWT and session management are largely invisible to end users. The UI
maintains session via HTTP-only cookies (for web) and bearer tokens (for API).
When an access token expires, the UI transparently refreshes it (via the refresh
token) without user interaction; if the refresh token is also expired, the UI
redirects to login with a 'Your session has expired. Please log in again.'
message. The 'Account' page includes an 'Active Sessions' panel showing the
user's active sessions (device, IP, last active) with a 'Revoke' button per session
— useful for logging out of a forgotten device. JWT expiry is tuned to balance
security (short expiry) and UX (no frequent re-login).
SECURITY IMPACT
The RS256 signing is the critical security improvement: a compromised
backend service cannot forge tokens because it lacks the signing key. The 15-
minute access-token lifetime limits the stolen-token exposure window to 15
minutes (the refresh-token rotation per ADR-071 limits the stolen-refresh-token
window to one rotation). The quarterly signing-key rotation limits the key-
compromise blast radius to one quarter. The jti-based revocation list closes the
stateless-validation revocation weakness: a stolen token can be revoked
immediately by adding its jti to the list. The key_id header enables the dual-key
rotation window without disrupting active sessions. The JWKS endpoint
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 132

PreOne ADR - Volume 4: Security Architecture v3.0
publishes only public keys, so a JWKS compromise does not enable token
forgery. The net effect is a JWT policy that satisfies the OAuth 2.1 security
profile and the regulated education market's expectations.
PERFORMANCE IMPACT
JWT validation is stateless (signature verification only), which is the primary
performance benefit: a single asymmetric signature verification takes under
1ms at p99, compared to 1-4ms for a server-side session lookup. The JWKS
public key is cached in-process by each backend service (1-hour cache), so the
JWKS endpoint is fetched only once per hour per service, which is negligible
load. The revocation-list check (Redis lookup) adds under 1ms to the hot path
and is enabled only for high-risk tokens (e.g., tokens with elevated scopes). The
signing operation (at token issuance) takes 2-5ms (RSA signing is slower than
verification), which is acceptable because token issuance is not on the hot path
(it happens once every 15 minutes per user).
SCALABILITY ANALYSIS
The JWT policy scales with request volume, not with token count (tokens are
stateless, so there is no server-side storage per token). The JWKS endpoint is
cached aggressively by clients, so it handles a few requests per hour per
service, which is negligible. The revocation list is bounded by the number of
stolen tokens (projected under 1000 active revocations at steady state), so the
Redis lookup is fast and the list is small. The signing-key rotation is a quarterly
event that does not affect steady-state operation. The token-issuance rate (one
per user per 15 minutes) is projected to peak at 5,000 issuances per second
(50k logins per day, plus refreshes), which is within the authorization server's
capacity (per ADR-062). No architectural ceiling is anticipated within the three-
year planning horizon.
OPERATIONAL CONSIDERATIONS
The JWT policy is deployed as part of the authorization server (per ADR-062)
and the Spring Security filter chain. The signing keys are managed by AWS
KMS (per ADR-078) and rotated quarterly via an automated job. The on-call
runbook covers four failure modes: KMS unavailable (signing fails, new logins
fail, alert; existing tokens remain valid until expiry), JWKS endpoint unavailable
(clients cannot fetch new public keys, but cached keys remain valid for 1 hour,
alert), revocation-list Redis unavailable (revocation check is skipped for low-
risk tokens, fail-closed for high-risk, alert), and signing-key rotation failure
(rotation is retried, dual-key window is extended, alert). The rotation is
rehearsed in staging quarterly to verify the automation. The JWT policy has a
dedicated dashboard showing token-issuance rate, validation latency,
revocation-list size, and key-rotation status.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 133

PreOne ADR  -  Volume 4: Security Architecture  v3.0
RISKS
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Signing key        | Low        | High   | KMS access is       |
| compromise (e.g.,  |            |        | tightly scoped and  |
| via a KMS          |            |        | audited. Quarterly  |
| misconfiguration)  |            |        | rotation limits     |
| enables token      |            |        | blast radius.       |
| forgery until the  |            |        | Compromise          |
| next rotation.     |            |        | detection via       |
anomalous token-
issuance patterns
(per ADR-088).
Emergency
rotation procedure
documented.
| JWKS endpoint         | Medium | Medium | Clients cache        |
| --------------------- | ------ | ------ | -------------------- |
| becomes a single      |        |        | public keys for 1    |
| point of failure for  |        |        | hour, so a JWKS      |
| token validation      |        |        | outage is tolerated  |
| (clients cannot       |        |        | for 1 hour. JWKS     |
| fetch public keys).   |        |        | endpoint is          |
deployed with
three replicas and
a CDN. Alert on
JWKS error rate.
| 15-minute access-   | Medium | Low | Refresh-token flow  |
| ------------------- | ------ | --- | ------------------- |
| token lifetime is   |        |     | is transparent and  |
| too short for some  |        |     | handled by the      |
| workflows (e.g.,    |        |     | frontend. Long-     |
| long-running        |        |     | running workflows   |
| uploads), causing   |        |     | use the refresh     |
| mid-workflow re-    |        |     | token to obtain a   |
| authentication.     |        |     | new access token    |
without user
interaction.
| Revocation-list     | Low | Medium | Revocation check     |
| ------------------- | --- | ------ | -------------------- |
| Redis lookup adds   |     |        | is enabled only for  |
| latency to the hot  |     |        | high-risk tokens.    |
| path that exceeds   |     |        | Redis lookup is      |
| the budget.         |     |        | under 1ms.           |
Revocation list is
bounded by
stolen-token count
(projected under
1000).
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  134

PreOne ADR - Volume 4: Security Architecture v3.0
TRADE-OFFS
We Gain We Lose
RS256 asymmetric signing limits token RS256 signatures are larger than
forgery to the authorization server. HS256 (256 bytes vs 32 bytes) and
slower to sign.
15-minute access-token lifetime limits More frequent refreshes add load to the
stolen-token exposure window. token endpoint and require frontend
refresh logic.
Quarterly signing-key rotation limits Rotation requires operational discipline
key-compromise blast radius. and a dual-key validation window.
Stateless validation is fast (under 1ms) Revocation requires a revocation list
and scalable. (Redis lookup), partially negating the
stateless benefit.
REJECTED ALTERNATIVES
HS256 was rejected because the symmetric property means any verifying
service can forge tokens, which violates the principle of least privilege and the
OAuth 2.1 security profile. ES256 was rejected on compatibility grounds: some
older clients and libraries lack ECDSA support, which would require a fallback
to RS256 for those clients, complicating the implementation; the marginal
benefit (smaller signatures, faster verification) does not justify the
compatibility risk at PreOne's scale. The opaque-token approach was rejected
because the server-side session lookup on every request adds 1-4ms to the hot
path, which consumes the entire authorization latency budget and violates the
stateless-validation requirement. The full reasoning is captured in the Options
Considered table.
MIGRATION PLAN
Migration is phased over one quarter, alongside the authentication-stack
migration (per ADR-062). Phase 1 (weeks 1-3): deploy the JWKS endpoint and
the RS256 signing key in KMS; the authorization server issues both RS256 and
HS256 tokens during this phase (dual-issuance). Phase 2 (weeks 4-6): migrate
backend services to verify RS256 tokens (in addition to HS256); both are
accepted during this phase. Phase 3 (weeks 7-9): the authorization server
issues only RS256 tokens; HS256 issuance is disabled. Phase 4 (weeks 10-12):
backend services remove HS256 verification; only RS256 is accepted. Phase 5
(week 13): the legacy HS256 signing key is destroyed. Rollback is possible at
any point in phases 1-3 by re-enabling HS256 issuance; the dual-issuance
window ensures no user is locked out. The signing-key rotation is enabled in
phase 4 and is rehearsed in staging before the first production rotation.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 135

PreOne ADR - Volume 4: Security Architecture v3.0
TESTING STRATEGY
The JWT policy is tested at four levels. Unit tests cover the signing, verification,
key_id selection, jti generation, and revocation-list lookup; coverage target is
95%. Integration tests cover the JWKS endpoint (publishing, caching, key
rotation), the dual-key validation window, and the revocation flow. End-to-end
tests cover the full token-issuance -> API-call -> token-validation path,
including a simulated signing-key rotation. Security tests cover the forgery
resistance (a service with only the public key cannot forge tokens), the
revocation (a stolen token is revoked immediately), and the key-rotation (in-
flight tokens remain valid during rotation). Performance tests cover the
validation latency at projected peak request volume. The acceptance criterion
is zero token-forgery or token-validation failures during the post-cutover
stabilization period.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Token-issuance rate: target under 5,000
per second, alert above 10,000 (possible abuse or misconfiguration). (2) Token-
validation latency p99: target under 1ms, alert above 2ms. (3) JWKS fetch rate:
target under 1 per hour per service, alert above 10 (caching may be broken). (4)
Revocation-list size: target under 1,000 entries, alert above 5,000 (possible
attack or hygiene issue). (5) Signing-key rotation status: target on schedule
(quarterly), alert on rotation failure or delay. (6) Token-forgery attempts: target
zero, alert on any non-zero value (possible key compromise). A dedicated JWT
dashboard surfaces these alongside the per-tenant token-issuance rate, the
per-key validation distribution, and the revocation-list growth. Anomaly
detection (per ADR-088) flags unusual token patterns (issuance spikes,
validation failures, revocation-list bursts).
FUTURE EVOLUTION
The JWT policy is expected to evolve in three directions. First, the signing
algorithm may migrate from RS256 to ES256 once all clients support ECDSA,
which would reduce signature size and improve verification latency; the trigger
is a compatibility audit showing universal ECDSA support. Second, the access-
token lifetime may be reduced to 5 minutes if the refresh-token flow proves
robust enough to handle the increased refresh rate without user-perceived
latency; the trigger is a security review recommending shorter lifetimes. Third,
the JWT may add a proof-of-possession (PoP) mechanism (e.g., DPoP or mTLS-
bound tokens) to make stolen tokens unusable without the client's private key;
this is a larger change and would require its own ADR.
RELATED ADRS
● ADR-061 - Identity Model (provides principal_id for the JWT subject)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 136

PreOne ADR - Volume 4: Security Architecture v3.0
● ADR-062 - Authentication (the authorization server issues JWTs)
● ADR-063 - Authorization (consumes the JWT's scope claim)
● ADR-071 - Refresh Token Policy (rotation strategy for the 7-day refresh
token)
● ADR-072 - MFA (step-up tokens for high-risk operations)
● ADR-074 - Session Management (session lifecycle tied to JWT lifetime)
● ADR-076 - API Security (mTLS-bound tokens for service-to-service)
● ADR-078 - Secrets Management (AWS KMS for signing-key storage)
REFERENCES
● RFC 7519 - JSON Web Token (JWT). IETF. 2015.
● RFC 7517 - JSON Web Key (JWK). IETF. 2015.
● RFC 8725 - JSON Web Token Best Current Practices. IETF. 2020.
● OAuth 2.1, RFC Draft, Section on Token Security. IETF. 2024.
● PreOne Engineering Handbook, Section 4.10 - JWT Policy. Internal.
2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-01 Draft Platform Security Initial draft;
Architect options
enumerated;
consultation with
security and
engineering teams
2025-09-17 Proposed Platform Security Submitted to
Architect Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
2026-07-15 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 137

PreOne ADR - Volume 4: Security Architecture v3.0
Architect Platform Security Architect
Tech Lead Authentication Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● JWT issuance with RS256 signature (Done)
● Refresh token rotation + reuse detection (Done)
● Session Store (Redis) deployed (Done)
● Token validation in API Gateway (Done)
● Active Sessions UI panel (Done)
● Quarterly JWT secret rotation runbook (Scheduled)
AD R -071
Refresh Token Policy
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a rotating refresh-token policy with reuse detection: each refresh-
token use issues a new refresh token and invalidates the old one. If an
invalidated refresh token is presented, the authorization server detects
reuse and revokes the entire refresh-token family (all tokens derived from
the same login), forcing the user to re-authenticate. Refresh tokens are 7
days lifetime, stored as bcrypt-hashed values in the database, and bound to
the issuing client and tenant.
STATUS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 138

PreOne ADR - Volume 4: Security Architecture v3.0
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on cryptography
standard update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The legacy refresh-token policy is a single long-lived refresh token (30 days)
that is never rotated. A stolen refresh token is valid for 30 days, which is an
unacceptable exposure window. Worse, the legacy policy has no reuse
detection: an attacker who steals a refresh token can use it indefinitely without
the legitimate user's knowledge, because the legitimate user's refreshes do not
invalidate the stolen token. The 2025 Q3 security review identified the legacy
refresh-token policy as the single highest-risk item in the authentication stack.
A refresh-token theft scenario (e.g., via a compromised browser extension or a
malicious app on a shared device) would give the attacker 30 days of access,
with no detection and no recovery short of a password reset. The ARB
concluded that a rotating refresh-token policy with reuse detection is required
for the 2026 expansion, which is the OAuth 2.1 security profile
recommendation. This ADR defines the refresh-token policy. The access-token
format and lifetime are defined in ADR-070. The MFA enforcement (which may
interact with refresh-token step-up) is defined in ADR-072. This ADR defines
the rotation strategy, the reuse-detection mechanism, the family-revocation
behavior, and the storage format.
BUSINESS DRIVERS
The 2026 international expansion requires that the platform detect refresh-
token theft within one rotation window (i.e., the next time the legitimate user
refreshes), which is the OAuth 2.1 security profile recommendation. The
business also requires that a stolen refresh token be recoverable without a
password reset (the user should not be locked out by an attacker's theft), which
drives the family-revocation design. Finally, the business requires that the
refresh-token policy not degrade the user experience (the refresh should be
transparent to the user), which drives the 7-day lifetime and the automatic
rotation.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 139

PreOne ADR - Volume 4: Security Architecture v3.0
PROBLEM STATEMENT
The legacy non-rotating 30-day refresh token has an unacceptable exposure
window (30 days) and no reuse detection, making refresh-token theft
undetectable and unrecoverable. PreOne needs a rotating refresh-token policy
with reuse detection that detects theft within one rotation window, recovers
without a password reset, and preserves the transparent-refresh user
experience.
CONSTRAINTS
● Refresh tokens must rotate on every use: the old token is invalidated, a
new token is issued.
● Reuse detection must revoke the entire refresh-token family on
detection of an invalidated token's reuse.
● Refresh tokens must be 7 days lifetime (604800 seconds), aligned with
ADR-070.
● Refresh tokens must be stored as bcrypt-hashed values, not plaintext,
to protect against database compromise.
● Refresh tokens must be bound to the issuing client (client_id) and
tenant (tenant_id) to prevent cross-client or cross-tenant use.
● Family revocation must force re-authentication (MFA per ADR-072 if
enabled).
ASSUMPTIONS
● The authorization server (per ADR-062) is the sole issuer and validator
of refresh tokens.
● The oauth_refresh_token table defined in ADR-062 is available for
refresh-token metadata.
● The 7-day lifetime is acceptable to users (the rotation is transparent, so
the user does not perceive the lifetime).
● Bcrypt hashing of refresh tokens is acceptable for storage (the hash is
checked on every refresh, which is not on the hot path).
● The reuse-detection false-positive rate (legitimate user refreshing from
two devices simultaneously) is acceptably low.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 140

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option               | Pros                | Cons                  | Verdict  |
| -------------------- | ------------------- | --------------------- | -------- |
| Rotating refresh     | Detects theft       | Rotation adds a       | Adopted  |
| tokens with reuse    | within one          | database write per    |          |
| detection and        | rotation window.    | refresh. Reuse        |          |
| family revocation,   | Recovers without    | detection may         |          |
| 7-day lifetime,      | password reset      | produce false         |          |
| bcrypt-hashed        | (family revocation  | positives             |          |
| storage.             | forces re-auth).    | (simultaneous         |          |
|                      | Transparent to      | refreshes). Family    |          |
|                      | user (rotation is   | revocation may        |          |
|                      | automatic). OAuth   | annoy users           |          |
|                      | 2.1 compliant.      | (forced re-auth).     |          |
| Non-rotating         | Simplest            | No theft              | Rejected |
| refresh tokens       | implementation.     | detection. Stolen     |          |
| with 7-day lifetime  | No rotation logic.  | token is valid for 7  |          |
| (shorter than        | No reuse            | days. Violates the    |          |
| legacy 30-day).      | detection. No       | OAuth 2.1 security    |          |
|                      | family revocation.  | profile. Rejected     |          |
by ARB as
insufficient for the
regulated
education market.
Rotating refresh  Detects theft if the  Does not detect  Rejected
| tokens without   | legitimate user       | theft if the        |     |
| ---------------- | --------------------- | ------------------- | --- |
| reuse detection  | refreshes first (the  | attacker refreshes  |     |
| (rotation only). | stolen token is       | first (the          |     |
|                  | invalidated).         | legitimate user's   |     |
|                  | Simpler than          | token is            |     |
|                  | reuse detection.      | invalidated, but    |     |
the attacker has a
fresh token).
Attacker can
maintain access
indefinitely by
refreshing before
the user.
| Opaque refresh  | Strongest          | Server-side lookup  | Rejected |
| --------------- | ------------------ | ------------------- | -------- |
| tokens with     | revocation story   | on every refresh    |          |
| server-side     | (token is invalid  | adds latency.       |          |
| session lookup  | the moment the     | Scales poorly.      |          |
| and immediate   | session is         | Does not solve the  |          |
| revocation.     | deleted). No       | theft-detection     |          |
|                 | rotation logic.    | problem (the        |          |
attacker can
refresh as long as
the session is
valid).
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  141

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
ADOPTED
Adopt a rotating refresh-token policy with reuse detection. Each refresh-
token use issues a new refresh token and invalidates the old one (rotation).
The invalidated token's hash is retained in the database for the family's
lifetime. If an invalidated token is presented again (reuse), the authorization
server detects the reuse and revokes the entire refresh-token family (all
tokens derived from the same login), forcing the user to re-authenticate.
Refresh tokens are 7 days lifetime, stored as bcrypt-hashed values, and
bound to the issuing client_id and tenant_id. Family revocation forces re-
authentication with MFA (per ADR-072) if the user has MFA enabled.
DETAILED RATIONALE
The rotating-with-reuse-detection policy was chosen over the non-rotating and
rotation-only policies because it is the only policy that detects refresh-token
theft regardless of who refreshes first. The rotation-only policy detects theft
only if the legitimate user refreshes first (the stolen token is invalidated); if the
attacker refreshes first, the attacker has a fresh token and the legitimate user's
token is invalidated, which the legitimate user may not notice (their next
refresh fails, but they may attribute it to a network error). The reuse-detection
policy catches this case: when the legitimate user tries to refresh with their
(now-invalidated) token, the authorization server detects the reuse and revokes
the entire family, including the attacker's fresh token. The family-revocation
behavior is the most important security property. A refresh-token family is the
chain of tokens derived from a single login: the initial refresh token (issued at
login) and all tokens derived from it via rotation. When reuse is detected, the
entire family is revoked, which means the attacker's fresh token (which is in the
family) is also revoked. The user is forced to re-authenticate, which establishes
a new family. The attacker's access is terminated at the next refresh attempt
(their token is in the revoked family). This is the OAuth 2.1 security profile
recommendation and is the standard pattern for refresh-token theft detection.
The 7-day lifetime is aligned with ADR-070 and is the balance between security
(shorter is better) and user experience (longer means fewer re-
authentications). The rotation is transparent to the user (the frontend handles it
automatically), so the lifetime is not perceived by the user; the user perceives
only the re-authentication that happens every 7 days (or when the family is
revoked). The 7-day re-authentication cadence is acceptable for a school
platform used daily by teachers. The bcrypt-hashed storage is the most
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 142

PreOne ADR - Volume 4: Security Architecture v3.0
important data-protection property. Refresh tokens are stored as bcrypt hashes
in the oauth_refresh_token table, not as plaintext. A database compromise (e.g.,
via a SQL injection) does not expose usable refresh tokens, because bcrypt is a
one-way hash with a per-token salt. The trade-off is that bcrypt verification (on
every refresh) takes 100-200ms, which is acceptable because refresh is not on
the hot path (it happens once every 15 minutes per user, when the access token
expires). The bcrypt cost factor is set to 12, which is the current
recommendation for online services. The binding to client_id and tenant_id is
the most important isolation property. A refresh token issued to client_id=web-
app and tenant_id=tenant-A cannot be used with client_id=mobile-app or
tenant_id=tenant-B. This prevents a compromised client (e.g., a malicious
mobile app) from using a refresh token issued to a different client, and prevents
a tenant-confusion attack (a refresh token from tenant A being used to access
tenant B). The binding is checked on every refresh and is recorded in the
token's metadata. The reuse-detection false-positive scenario (legitimate user
refreshing from two devices simultaneously) is the most contentious part of this
ADR. If the user has the platform open in two browser tabs and both tabs
refresh at the same time, the second refresh will present the now-invalidated
token (the first refresh invalidated it), which triggers reuse detection and
family revocation. This is a false positive (the user is not an attacker) and is
annoying (the user is forced to re-authenticate in both tabs). The mitigation is
the frontend's refresh coordination: the frontend uses a single refresh-token
coordinate (via a shared lock or a tab_broadcast API) so that only one tab
refreshes at a time, and the other tabs wait for the new token. This is a well-
known pattern for SPAs and is implemented in the PreOne frontend's auth
library. The false-positive rate with this coordination is under 0.01% of
refreshes, which is acceptable. The decision to force re-authentication with
MFA on family revocation (if the user has MFA enabled) is driven by the
principle that a family revocation indicates a possible theft, and the user should
re-prove their identity with a fresh factor. The MFA step-up (per ADR-072) is
the standard pattern for high-risk re-authentication. If the user does not have
MFA enabled, the re-authentication is password-only, which is the legacy
behavior. The decision to retain invalidated tokens' hashes in the database for
the family's lifetime (rather than deleting them) is driven by the reuse-detection
requirement. The authorization server must be able to detect that a presented
token is invalidated, which requires comparing the presented token's hash to
the invalidated tokens' hashes. The retained hashes are deleted when the
family expires (7 days after the last rotation) or is revoked, which bounds the
storage cost. The oauth_refresh_token table grows by one row per refresh,
which is projected to be 50k rows per day (one refresh per user per 15 minutes,
with 50k active users); the table is partitioned by month and old partitions are
archived per ADR-053.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 143

PreOne ADR - Volume 4: Security Architecture v3.0
ARCHITECTURE DIAGRAM
+-----------------------------------------------------------+ | PREONE REFRESH TOKEN
POLICY | +-----------------------------------------------------------+ | Login
| | - Authz Server issues access + refresh (family F1) | | - refresh token T1
stored as bcrypt(T1) in DB | +-----------------------------------------------------------+
| v +---------------------------+ | Refresh (legitimate) | | - Client presents
T1 | | - Authz Server validates | | bcrypt(T1) matches DB | | - Issue new
T2, invalidate| | T1 (retain hash) | | - T2 is in family F1 |
+---------------------------+ | v +---------------------------+ | Refresh
(attacker reuse) | | - Attacker presents T1 | | (already invalidated) | | -
Authz Server detects | | T1 is invalidated | | - REUSE DETECTED |
| - Revoke entire family F1 | | (T1, T2, all derived) | | - Force user re-auth
| | with MFA (ADR-072) | +---------------------------+ | v
+---------------------------+ | oauth_refresh_token table | | - token_hash (bcrypt) |
| - family_id (UUIDv7) | | - client_id, tenant_id | | - issued_at, expires_at |
| - status (ACTIVE|INVALID) | | |REVOKED_FAMILY) |
+---------------------------+
SEQUENCE DIAGRAM
Client -> Authz Server: POST /oauth2/token (grant=refresh, T1) Authz Server ->
DB: Lookup bcrypt(T1) DB -> Authz Server: Match found, family F1, status
ACTIVE Authz Server -> Reuse Check: T1 not in invalidated list Reuse Check ->
Authz Server: No reuse Authz Server -> Token Issue: Issue new T2 Authz Server
-> DB: Update T1 status=INVALID Authz Server -> DB: Insert T2 (bcrypt, family
F1, ACTIVE) Authz Server -> Client: New access + refresh (T2) Note over Authz
Server: Attacker presents T1 (invalidated): Attacker -> Authz Server: POST
/oauth2/token (grant=refresh, T1) Authz Server -> DB: Lookup bcrypt(T1) DB ->
Authz Server: Match found, status INVALID Authz Server -> Reuse Detection:
REUSE DETECTED Authz Server -> DB: Update all F1 tokens
status=REVOKED_FAMILY Authz Server -> Audit: Record REUSE_DETECTED
event Authz Server -> Attacker: 401 Invalid token Authz Server -> Client (next
refresh): 401 Family revoked, re-auth required Client -> Authz Server: Re-
authenticate (with MFA per ADR-072)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-071 — Refresh Token Policy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Auth Service | issue | Token
Service | | | | |------->| (JWT / Refresh / | | | +----------------
+ | Session) | | | +----------+-----------+ | |
| | | | verify | |
v | | +----------------+ +----------------------+ | | | API Gateway |
recv | Token Validator | | | | |------->| (signature + exp) |
| | +----------------+ +----------+-----------+ | | |
| | | cache (Redis) | | v
| | +----------------+ +----------------------+ | | | Session Store | CRUD | Redis
| | | | |------->| (active sessions) | | | +----------------+
+----------------------+ | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 144

PreOne ADR - Volume 4: Security Architecture v3.0
Token Lifecycle Flow: Auth Service -> JWT Issuer: create
(header.payload.signature) JWT Issuer -> Client: access token (15min) +
refresh token (30d) Client -> API: Bearer token in header API -> Token
Validator: verify signature + expiry (valid) API -> App: process request
(expired) API -> Client: 401 (trigger refresh) Session Flow: Auth Service ->
Session Store (Redis): create session Client -> API: Bearer + session cookie
API -> Session Store: validate active (logout) API -> Session Store: delete
session API -> Audit: log 'SESSION_TERMINATED'
DATABASE IMPACT
The oauth_refresh_token table defined in ADR-062 is extended with columns
family_id (UUIDv7, identifying the family), status (enum: ACTIVE, INVALID,
REVOKED_FAMILY), and rotated_from (FK to the previous token's id, for chain
reconstruction). The token_hash column stores the bcrypt hash of the refresh
token. The table is indexed on (token_hash) for the refresh lookup, (family_id,
status) for the family-revocation update, and (expires_at) for the cleanup job.
The table is partitioned by month, with old partitions archived per ADR-053.
The projected growth is 50k rows per day (one refresh per user per 15 minutes,
with 50k active users), which is 1.5M rows per month; the monthly partitions
keep individual partitions under 2M rows, which is well within PostgreSQL's
comfort zone. The bcrypt hash column is 60 bytes per row, so the table's
storage is approximately 90MB per month, which is negligible.
API IMPACT
The /oauth2/token endpoint (per ADR-062) is extended to handle the refresh-
token grant with rotation and reuse detection. The response includes a new
refresh token (in addition to the new access token) on every refresh, which the
frontend must store and use for the next refresh. The frontend's auth library is
updated to handle the rotation transparently: it replaces the stored refresh
token with the new one on every refresh, and it coordinates refreshes across
tabs (via a shared lock or tab_broadcast API) to avoid the simultaneous-refresh
false positive. The /oauth2/revoke endpoint (per ADR-070) is extended to accept
a family_id and revoke the entire family, which is used by the reuse-detection
mechanism and by the user-facing logout-all-devices feature.
UI IMPACT
JWT and session management are largely invisible to end users. The UI
maintains session via HTTP-only cookies (for web) and bearer tokens (for API).
When an access token expires, the UI transparently refreshes it (via the refresh
token) without user interaction; if the refresh token is also expired, the UI
redirects to login with a 'Your session has expired. Please log in again.'
message. The 'Account' page includes an 'Active Sessions' panel showing the
user's active sessions (device, IP, last active) with a 'Revoke' button per session
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 145

PreOne ADR - Volume 4: Security Architecture v3.0
— useful for logging out of a forgotten device. JWT expiry is tuned to balance
security (short expiry) and UX (no frequent re-login).
SECURITY IMPACT
The rotating-with-reuse-detection policy is the critical security improvement
over the legacy non-rotating policy. A stolen refresh token is detected within
one rotation window (the next time the legitimate user refreshes), and the
attacker's access is terminated at that point. The family-revocation behavior
ensures that the attacker's fresh token (if they refreshed first) is also revoked,
which is the only way to recover from an attacker-first theft. The bcrypt-hashed
storage protects against database compromise: a SQL injection that exfiltrates
the oauth_refresh_token table does not expose usable refresh tokens. The
client_id and tenant_id binding prevents cross-client and cross-tenant refresh-
token use, which closes a class of attacks that the legacy policy allowed. The
forced MFA re-authentication on family revocation (per ADR-072) ensures that
the user re-proves their identity after a possible theft, which is the defense-in-
depth measure. The net effect is a refresh-token policy that detects and
recovers from theft, which is the OAuth 2.1 security profile recommendation.
PERFORMANCE IMPACT
The refresh-token policy adds a bcrypt verification (100-200ms) and a database
write (rotation) to every refresh, which is acceptable because refresh is not on
the hot path (it happens once every 15 minutes per user). The reuse-detection
check is a database lookup (under 5ms) and is performed on every refresh. The
family-revocation update is a batch update (under 50ms for a typical family of
10-20 tokens) and is performed only on reuse detection (rare). The overall
impact on the token endpoint's p99 latency is an increase from 50ms (legacy, no
rotation) to 250ms (with rotation and reuse detection), which is acceptable for a
non-hot-path operation. The impact on the hot path (API request validation) is
zero, because the refresh-token policy does not affect access-token validation.
SCALABILITY ANALYSIS
The refresh-token policy scales with the refresh rate, projected to peak at 5,000
refreshes per second (50k active users refreshing every 15 minutes, with peak
concurrency during class transitions). The bcrypt verification (100-200ms
each) is the bottleneck, requiring approximately 1,000 CPU-seconds per second
of refreshes at peak, which is handled by the authorization server's 10-replica
deployment (per ADR-062) with headroom. The database write (rotation) is a
single-row update, which is well within PostgreSQL's capacity. The
oauth_refresh_token table's growth (1.5M rows per month) is managed by
monthly partitioning and archival (per ADR-053). No architectural ceiling is
anticipated within the three-year planning horizon.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 146

PreOne ADR  -  Volume 4: Security Architecture  v3.0
OPERATIONAL CONSIDERATIONS
The refresh-token policy is deployed as part of the authorization server (per
ADR-062). The on-call runbook covers four failure modes: database unavailable
(refresh fails, users forced to re-authenticate, alert; existing access tokens
remain valid until expiry), bcrypt verification slow (refresh latency elevates,
alert; consider reducing bcrypt cost factor if persistent), reuse-detection false
positive (user is forced to re-authenticate, alert; investigate the frontend's
refresh coordination), and family-revocation storm (many families revoked in a
short window, alert; possible attack or frontend bug). The frontend's refresh-
coordination library is the primary mitigation for false positives; it is tested in
the quarterly game-day with a simulated simultaneous-refresh scenario. The
refresh-token policy has a dedicated dashboard showing refresh rate, rotation
rate, reuse-detection rate, and family-revocation rate.
RISKS
| Risk                | Likelihood | Impact | Mitigation        |
| ------------------- | ---------- | ------ | ----------------- |
| Reuse-detection     | Medium     | Low    | Frontend refresh- |
| false positive      |            |        | coordination      |
| (simultaneous       |            |        | library prevents  |
| refresh from two    |            |        | simultaneous      |
| tabs) forces        |            |        | refreshes. False- |
| legitimate user to  |            |        | positive rate     |
| re-authenticate.    |            |        | under 0.01% with  |
coordination. User
education on tab
management.
| Attacker refreshes   | Low | High | Reuse detection     |
| -------------------- | --- | ---- | ------------------- |
| first and maintains  |     |      | catches this case:  |
| access indefinitely  |     |      | the user's next     |
| by refreshing        |     |      | refresh presents    |
| before the user.     |     |      | an invalidated      |
token, triggering
family revocation
(which revokes
the attacker's
fresh token).
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  147

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                 | Likelihood | Impact | Mitigation          |
| -------------------- | ---------- | ------ | ------------------- |
| Bcrypt verification  | Medium     | Medium | Token endpoint is   |
| (100-200ms)          |            |        | not on the hot      |
| elevates token-      |            |        | path. 10-replica    |
| endpoint latency     |            |        | deployment          |
| beyond acceptable    |            |        | handles the load.   |
| bounds.              |            |        | Bcrypt cost factor  |
can be reduced if
persistent (trade-
off with hash
strength).
| Family-revocation   | Low | Medium | Monitoring alerts  |
| ------------------- | --- | ------ | ------------------ |
| storm (many         |     |        | on family-         |
| families revoked    |     |        | revocation rate.   |
| in a short window)  |     |        | Rate-limiting on   |
| indicates an        |     |        | re-authentication  |
| attack or a         |     |        | to prevent DoS.    |
| frontend bug.       |     |        | Frontend bug       |
investigation
procedure
documented.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Rotating refresh tokens detect theft  Rotation adds a database write per
within one rotation window. refresh (acceptable, non-hot-path).
Reuse detection revokes the entire  Family revocation forces re-
family, recovering from attacker-first  authentication, which may annoy users
| theft. |     | (mitigated by MFA step-up). |     |
| ------ | --- | --------------------------- | --- |
Bcrypt-hashed storage protects against  Bcrypt verification adds 100-200ms to
database compromise. each refresh (acceptable, non-hot-path).
Client and tenant binding prevents  Cross-device refresh requires the
cross-client and cross-tenant refresh  frontend to coordinate refreshes,
| use. |     | adding frontend complexity. |     |
| ---- | --- | --------------------------- | --- |
REJECTED ALTERNATIVES
The non-rotating policy was rejected because it has no theft detection and a 7-
day exposure window for stolen tokens, which violates the OAuth 2.1 security
profile. The rotation-only policy (without reuse detection) was rejected because
it does not detect attacker-first theft: the attacker refreshes first, gets a fresh
token, and the legitimate user's token is invalidated without triggering an
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  148

PreOne ADR - Volume 4: Security Architecture v3.0
alarm; the attacker maintains access indefinitely by refreshing before the user.
The opaque-token policy was rejected because the server-side lookup on every
refresh adds latency and does not solve the theft-detection problem (the
attacker can refresh as long as the session is valid). The full reasoning is
captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter, alongside the authentication-stack
migration (per ADR-062). Phase 1 (weeks 1-3): deploy the rotating-with-reuse-
detection policy in shadow mode (rotation happens, but reuse detection does
not revoke; it only logs). Phase 2 (weeks 4-6): enable reuse detection for a pilot
group of 10 tenants; validate the false-positive rate and the family-revocation
behavior. Phase 3 (weeks 7-9): enable reuse detection for all tenants; the legacy
non-rotating refresh tokens are migrated to the new policy on next refresh (the
legacy token becomes the first token in a new family). Phase 4 (weeks 10-12):
the legacy non-rotating policy is removed; all refresh tokens follow the new
policy. Phase 5 (week 13): the shadow-mode logging is removed. Rollback is
possible at any point by disabling reuse detection (rotation continues, but reuse
does not trigger family revocation); the legacy non-rotating policy cannot be
restored because the database schema has changed.
TESTING STRATEGY
The refresh-token policy is tested at four levels. Unit tests cover the rotation
logic, the reuse detection, the family revocation, and the bcrypt hashing;
coverage target is 95%. Integration tests cover the refresh flow (rotation, reuse
detection, family revocation), the client and tenant binding, and the frontend's
refresh-coordination library. End-to-end tests cover the full login -> refresh ->
reuse-detection -> family-revocation -> re-authentication path. Security tests
cover the theft scenarios (user-first, attacker-first, simultaneous), the bcrypt-
hash protection (database compromise does not expose usable tokens), and the
binding enforcement (cross-client and cross-tenant refresh attempts are
rejected). Performance tests cover the refresh rate at projected peak (5,000 per
second). The acceptance criterion is zero false-positive family revocations
during the shadow-mode period and zero theft-undetected incidents in the post-
cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Refresh rate: target under 5,000 per
second, alert above 10,000. (2) Rotation rate: target equal to refresh rate (every
refresh rotates), alert on mismatch (rotation bug). (3) Reuse-detection rate:
target under 0.01% of refreshes (false positives), alert above 0.1% (frontend
coordination issue or attack). (4) Family-revocation rate: target under 0.001%
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 149

PreOne ADR - Volume 4: Security Architecture v3.0
of refreshes, alert above 0.01% (possible attack or bug). (5) Refresh latency
p99: target under 500ms (including bcrypt), alert above 1,000ms. (6) bcrypt
verification latency p99: target under 200ms, alert above 500ms (may need
cost-factor reduction). A dedicated refresh-token dashboard surfaces these
alongside the per-tenant refresh rate, the family-size distribution, and the
reuse-detection false-positive breakdown. Anomaly detection (per ADR-088)
flags unusual refresh patterns (refresh spikes, reuse-detection bursts, family-
revocation storms).
FUTURE EVOLUTION
The refresh-token policy is expected to evolve in three directions. First, the
bcrypt hashing may migrate to argon2id (per ADR-075) for stronger protection
against GPU-based attacks; the trigger is the password-policy migration to
argon2id. Second, the refresh-token lifetime may be reduced to 1 day for high-
risk principals (e.g., administrators) as a risk-based policy; this is monitored but
not planned for v1. Third, the refresh-token may add a proof-of-possession
mechanism (e.g., DPoP) to make stolen refresh tokens unusable without the
client's private key; this is a larger change and would require its own ADR.
RELATED ADRS
● ADR-061 - Identity Model (provides principal_id for the refresh token)
● ADR-062 - Authentication (the authorization server issues refresh
tokens)
● ADR-070 - JWT Policy (access-token format and lifetime, aligned with
refresh-token lifetime)
● ADR-072 - MFA (step-up authentication on family revocation)
● ADR-073 - Device Binding (device-bound refresh tokens for high-risk
clients)
● ADR-074 - Session Management (session lifecycle tied to refresh-token
family)
● ADR-078 - Secrets Management (bcrypt cost factor and hashing
configuration)
● ADR-086 - Audit Trail (records refresh, rotation, reuse, and family-
revocation events)
REFERENCES
● RFC 6749 - The OAuth 2.0 Authorization Framework, Section 10.4
(Refresh Token Theft). IETF. 2012.
● OAuth 2.1, RFC Draft, Section on Refresh Token Rotation. IETF. 2024.
● RFC 6819 - OAuth 2.0 Threat Model and Security Considerations. IETF.
2013.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 150

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● OWASP OAuth 2.0 Cheat Sheet, Refresh Token section. OWASP
Foundation. 2024.
● PreOne Engineering Handbook, Section 4.11 - Refresh Token Policy.
Internal. 2025.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect  |     |
| ----------- | --- | ---------------------------- | --- |
| Tech Lead   |     | Authentication Platform Lead |     |
| ARB Chair   |     | Architecture Review Board    |     |
| Approved On |     | 2025-10-15                   |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  151

PreOne ADR - Volume 4: Security Architecture v3.0
● JWT issuance with RS256 signature (Done)
● Refresh token rotation + reuse detection (Done)
● Session Store (Redis) deployed (Done)
● Token validation in API Gateway (Done)
● Active Sessions UI panel (Done)
● Quarterly JWT secret rotation runbook (Scheduled)
AD R -072
MFA
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a multi-factor authentication (MFA) system that supports TOTP (RFC
6238) as the default second factor and WebAuthn (CTAP2) as the phishing-
resistant option for high-risk principals. MFA is enforced risk-based:
required for administrators and any principal with access to PII, optional for
other principals, and triggered as step-up for high-risk operations (e.g.,
changing bank details, exporting student records). MFA factors are stored
per-principal and can be enrolled, used, and revoked via the MFA API.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on cryptography
standard update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 152

PreOne ADR - Volume 4: Security Architecture v3.0
The legacy platform has no MFA support. Teachers and administrators have
requested MFA since 2024, and the 2025 Q3 security review identified the
absence of MFA as a significant gap for the regulated education market. GDPR
Article 32, COPPA verifiable parental consent, and DPDP Section 8 all
recommend MFA for any principal with access to PII, and the 2026
international expansion requires MFA for administrators as a contractual
obligation in several target markets. The ARB considered four MFA strategies.
The first is no MFA, which is rejected as insufficient for the regulated market.
The second is SMS-based OTP, which is rejected as insecure (SIM swapping
attacks, SS7 vulnerabilities, and delivery latency make SMS unsuitable for
security). The third is TOTP (RFC 6238) as the sole second factor, which is
rejected because TOTP is vulnerable to phishing (a fake login page can capture
the TOTP and replay it). The fourth is TOTP as the default with WebAuthn as the
phishing-resistant option, which is selected because it balances usability (TOTP
is universally supported) with security (WebAuthn is phishing-resistant). This
ADR defines the MFA system. The authentication stack (which invokes MFA) is
defined in ADR-062. The step-up token (issued after MFA) is defined in
ADR-070. This ADR defines the factor types, the enrollment flow, the
verification flow, the risk-based enforcement, and the revocation flow.
BUSINESS DRIVERS
The 2026 international expansion requires MFA for administrators as a
contractual obligation in EU and Indian target markets. The business also
requires that MFA be optional (not mandatory) for teachers and students, to
avoid onboarding friction in markets where MFA is not yet expected. Finally,
the business requires that high-risk operations (e.g., changing bank details,
exporting student records) trigger step-up MFA regardless of the principal's
default MFA setting, which drives the risk-based enforcement design.
PROBLEM STATEMENT
The legacy platform has no MFA support, which is a significant gap for the
regulated education market. PreOne needs an MFA system that supports TOTP
as the default second factor and WebAuthn as the phishing-resistant option,
with risk-based enforcement (required for administrators and PII-access
principals, optional for others, step-up for high-risk operations).
CONSTRAINTS
● MFA must support TOTP (RFC 6238) as the default second factor, with
authenticator apps (Google Authenticator, Authy, 1Password).
● MFA must support WebAuthn (CTAP2) as the phishing-resistant option,
with platform authenticators (Touch ID, Windows Hello) and roaming
authenticators (YubiKey).
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 153

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● MFA must be risk-based: required for administrators and PII-access
principals, optional for others, step-up for high-risk operations.
● MFA factors must be stored per-principal and can be enrolled, used,
and revoked via the MFA API.
● MFA verification must complete in under 5 seconds at p99 (TOTP is
local; WebAuthn is interactive).
● MFA must support backup codes (one-time use) for account recovery
when the primary factor is lost.
ASSUMPTIONS
● The authentication stack (per ADR-062) provides the plug-in point for
MFA via a pluggable AuthenticationProvider.
● Principals have access to a TOTP-capable authenticator app
(universally available on smartphones).
● WebAuthn is supported on the device fleet PreOne targets (modern
browsers, platform authenticators).
● The risk-based enforcement policy is configurable per tenant (tenant
administrators can require MFA for more principals than the platform
default).
● MFA enrollment is performed by the principal during their first login
after MFA is enabled for their account.
OPTIONS CONSIDERED
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
TOTP default +  Balances usability  Two factor types  Adopted
| WebAuthn            | (TOTP is          | add complexity.  |     |
| ------------------- | ----------------- | ---------------- | --- |
| phishing-resistant  | universal) with   | WebAuthn         |     |
| option, risk-based  | security          | enrollment       |     |
| enforcement,        | (WebAuthn is      | requires user    |     |
| backup codes for    | phishing-         | education. Risk- |     |
| recovery.           | resistant). Risk- | based policy     |     |
|                     | based             | requires         |     |
|                     | enforcement       | configuration.   |     |
matches the
regulatory
requirement.
Backup codes
handle recovery.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  154

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option              | Pros                | Cons                 | Verdict  |
| ------------------- | ------------------- | -------------------- | -------- |
| SMS-based OTP       | Universally         | Insecure (SIM        | Rejected |
| as the sole second  | available (any      | swapping, SS7        |          |
| factor.             | phone). No          | vulnerabilities,     |          |
|                     | authenticator app   | delivery latency).   |          |
|                     | required. Simplest  | Rejected by ARB      |          |
|                     | enrollment.         | as insufficient for  |          |
security. Not
phishing-resistant.
| TOTP as the sole   | Simplest             | TOTP is            | Rejected |
| ------------------ | -------------------- | ------------------ | -------- |
| second factor (no  | implementation.      | vulnerable to      |          |
| WebAuthn).         | Single factor type.  | phishing (a fake   |          |
|                    | Universal            | login page can     |          |
|                    | authenticator-app    | capture and        |          |
|                    | support.             | replay the TOTP).  |          |
Insufficient for
high-risk
principals who
need phishing
resistance.
| WebAuthn as the     | Maximum             | WebAuthn        | Rejected |
| ------------------- | ------------------- | --------------- | -------- |
| sole second factor  | security. Phishing- | enrollment is   |          |
| (mandatory for all  | resistant. No       | friction-heavy  |          |
| principals).        | TOTP                | (requires       |          |
|                     | vulnerability.      | hardware        |          |
authenticator or
platform
authenticator).
Not all devices
support
WebAuthn.
Mandatory
WebAuthn would
block onboarding
in markets where
it is not yet
expected.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  155

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
Adopt an MFA system with TOTP (RFC 6238) as the default second factor
and WebAuthn (CTAP2) as the phishing-resistant option. MFA is risk-based:
required for administrators and any principal with access to PII (per
ADR-079), optional for other principals, and triggered as step-up for high-
risk operations (changing bank details, exporting student records,
managing user accounts). MFA factors are stored per-principal in the
mfa_factors table and can be enrolled, used, and revoked via the MFA API.
Backup codes (one-time use) are generated at enrollment for account
recovery. The MFA verification flow is invoked by the authentication stack
(per ADR-062) via a pluggable AuthenticationProvider, after primary
authentication succeeds.
DETAILED RATIONALE
The TOTP-default-plus-WebAuthn-option strategy was chosen over the SMS,
TOTP-only, and WebAuthn-only alternatives because it is the only strategy that
balances usability, security, and flexibility. SMS is insecure (SIM swapping and
SS7 attacks are well-documented, and SMS delivery is not reliable enough for a
security factor). TOTP-only is vulnerable to phishing (a fake login page can
capture the TOTP and replay it within the 30-second window, which is the
primary attack vector against education platforms). WebAuthn-only is secure
but friction-heavy (mandatory WebAuthn would block onboarding in markets
where it is not yet expected, and not all devices support it). The TOTP-default-
plus-WebAuthn-option strategy gives every principal a usable second factor
(TOTP, which works with any authenticator app) and gives high-risk principals
the option to upgrade to a phishing-resistant factor (WebAuthn, which works
with platform authenticators like Touch ID and Windows Hello, and with
roaming authenticators like YubiKey). The risk-based enforcement ensures that
the principals who need the strongest protection (administrators, PII-access
principals) get it, while the principals who do not (students, low-access
teachers) are not burdened with mandatory MFA. The risk-based enforcement
is the most important design decision. The platform default is: MFA required
for administrators and PII-access principals, optional for others, step-up for
high-risk operations. Tenant administrators can configure a stricter policy (e.g.,
require MFA for all teachers in their tenant) but cannot configure a weaker
policy (e.g., disable MFA for administrators). The step-up trigger is a per-
operation risk classification: operations are tagged as STANDARD, ELEVATED,
or HIGH_RISK, and HIGH_RISK operations require step-up MFA regardless of
the principal's default MFA setting. The risk classification is defined per
bounded context and is reviewed by the ARB. The WebAuthn option is the
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 156

PreOne ADR - Volume 4: Security Architecture v3.0
second most important design decision. WebAuthn (CTAP2) is the W3C
standard for phishing-resistant authentication, and it is the only widely-
deployed factor that is immune to phishing. A WebAuthn credential is bound to
the origin (preone.com), so a fake login page at pre0ne.com (note the zero)
cannot use the credential. The WebAuthn enrollment flow is more complex than
TOTP (it requires the user to interact with the platform or roaming
authenticator), so it is offered as an option for high-risk principals rather than
mandatory for all. The WebAuthn verification flow is also more complex (it
requires a challenge-response protocol), but it is transparent to the user (Touch
ID or Windows Hello prompt). The backup codes are the third most important
design decision. When a principal enrolls in MFA, the system generates 10 one-
time-use backup codes that the principal stores securely (typically in a
password manager or printed). If the principal loses their primary factor (e.g.,
their phone with the authenticator app), they can use a backup code to log in
and enroll a new primary factor. Backup codes are stored as bcrypt hashes (per
ADR-078) and are invalidated on use. The backup-code mechanism is the
standard recovery pattern for MFA and is required to prevent account lockout
(which would be a significant support burden and a security risk if users disable
MFA to avoid it). The decision to store MFA factors per-principal (rather than
per-device or per-session) is driven by the principle that MFA is a property of
the principal, not of the device or session. A principal may have multiple factors
(e.g., TOTP on their phone, WebAuthn on their laptop, backup codes in their
password manager), and the MFA API allows the principal to enroll, use, and
revoke each factor independently. The factors are stored in the mfa_factors
table with columns principal_id, factor_type (TOTP, WEBAUTHN,
BACKUP_CODE), factor_data (JSONB, type-specific), enrolled_at, last_used_at,
status (ACTIVE, REVOKED). The factor_data for TOTP is the shared secret
(encrypted per ADR-079); for WebAuthn it is the credential ID and public key;
for BACKUP_CODE it is the bcrypt hash. The decision to make MFA verification
a pluggable AuthenticationProvider (per ADR-062) is driven by the principle
that MFA is a cross-cutting concern that should be invoked after primary
authentication succeeds, regardless of the primary mechanism (federated
OIDC, local credentials, mTLS). The AuthenticationProvider interface is the
Spring Security extension point for MFA, and the MfaAuthenticationProvider
implementation invokes the MFA verification flow (TOTP or WebAuthn) and, on
success, issues a step-up token (per ADR-070) that carries an amr
(authentication methods reference) claim indicating MFA was performed. The
step-up token is the mechanism that records MFA verification for subsequent
requests. The step-up token is a JWT (per ADR-070) with a short lifetime (5
minutes) and an amr claim of mfa. High-risk operations require the step-up
token: if the request's JWT does not have the amr=mfa claim, the operation is
rejected with a 403 MFA Required response, which the frontend handles by
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 157

PreOne ADR - Volume 4: Security Architecture v3.0
triggering the MFA flow and retrying the operation with the step-up token. The
5-minute lifetime is the balance between security (shorter is better) and
usability (longer means fewer MFA prompts), and is the industry standard for
step-up tokens.
ARCHITECTURE DIAGRAM
+-----------------------------------------------------------+ | PREONE MFA SYSTEM
| +-----------------------------------------------------------+ | Primary Authentication (ADR-062)
| | - Federated OIDC, local credentials, mTLS | | - On success, invoke
MfaAuthenticationProvider | +-----------------------------------------------------------+
| v +---------------------------+ | MfaAuthenticationProvider | | (Spring
Security plug-in) | +---------------------------+ | +------+--------+--------+
| | | | v v v v +----------+ +----------+ +----------+
+----------+ | TOTP | | WebAuthn | | Backup | | Risk | | (RFC6238)| |
(CTAP2) | | Codes | | Engine | +----------+ +----------+ +----------+ +----------+
| | | | v v v v
+---------------------------------------------------+ | mfa_factors table | |
- principal_id, factor_type, factor_data (JSONB) | | - enrolled_at, last_used_at,
status | +---------------------------------------------------+ | v
+---------------------------+ | Step-up Token | | (JWT, 5min, amr=mfa) | |
(per ADR-070) | +---------------------------+ | v
+---------------------------+ | High-Risk Operation | | (banking change, export) |
| - requires amr=mfa | +---------------------------+
SEQUENCE DIAGRAM
User -> Authz Server: Primary login (OIDC) Authz Server -> MfaAuthProvider:
Trigger MFA MfaAuthProvider -> Risk Engine: Is MFA required? Risk Engine ->
MfaAuthProvider: Required (admin) MfaAuthProvider -> User: Prompt for TOTP
User -> MfaAuthProvider: TOTP code MfaAuthProvider -> TOTP Verify: Validate
code (RFC 6238) TOTP Verify -> MfaAuthProvider: Valid MfaAuthProvider ->
Step-up Token: Issue JWT (amr=mfa, 5min) Step-up Token -> User: Return token
User -> Backend: API call with step-up token Backend -> Amr Check: amr=mfa
present? Amr Check -> Backend: Yes Backend -> User: Response Note over
User: High-risk operation later: User -> Backend: Change bank details Backend
-> Risk Engine: Is this HIGH_RISK? Risk Engine -> Backend: Yes, requires
amr=mfa Backend -> User: 403 MFA Required (or accept existing step-up) User
-> Authz Server: Step-up MFA (WebAuthn) Authz Server -> WebAuthn:
Challenge-response WebAuthn -> Authz Server: Verified Authz Server -> User:
New step-up token (amr=mfa) User -> Backend: Retry with step-up token
Backend -> User: Success
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-072 — MFA - Component
View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Login API | factor | MFA
Service | | | | |------->| | | | +----------------+
+----------+-----------+ | | | | |
| verify | | v | | +----------------+
+----------------------+ | | | TOTP / SMS / | gen + | MFA Factor Store | |
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 158

PreOne ADR - Volume 4: Security Architecture v3.0
| | Push / Hardware| verify | (Postgres) | | | +----------------+
+----------+-----------+ | | | | |
| match? | | v | | +----------------+
+----------------------+ | | | Auth Service | issue | JWT (factor verified)| | |
| |------->| | | | +----------------+ +----------------------+
| | | | Device Binding (ADR-073) ties factor
to device fingerprint | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
MFA Enrollment Flow: User -> MFA Service: enroll (TOTP / SMS / push) MFA
Service -> Postgres: store factor (encrypted) MFA Service -> User: verify (enter
code / approve push) MFA Service -> Audit: log 'MFA_ENROLLED' MFA
Verification Flow: User -> Login API: password (factor 1) Auth Service -> MFA
Service: trigger factor 2 MFA Service -> User: deliver code / push User ->
MFA Service: enter code / approve MFA Service -> Auth Service: factor verified
Auth Service -> JWT Issuer: issue token (factor-verified claim) Device Binding
Flow: MFA Service -> Device Fingerprint: hash (UA + IP + device ID) Device
Fingerprint -> Postgres: store (per user) (login) Device Fingerprint -> MFA
Service: match? (no match) MFA Service -> User: require device verification
DATABASE IMPACT
MFA adds one table. mfa_factors holds the principal's MFA factors with
columns factor_id (UUIDv7, PK), principal_id (FK), factor_type (enum: TOTP,
WEBAUTHN, BACKUP_CODE), factor_data (JSONB, type-specific and
encrypted per ADR-079), enrolled_at, last_used_at, status (enum: ACTIVE,
REVOKED), enrolled_by (principal_id of the actor who enrolled the factor, for
audit). The table is indexed on (principal_id, status) for the verification lookup.
The factor_data for TOTP is the shared secret (AES-256-GCM encrypted per
ADR-077); for WebAuthn it is the credential ID and public key (not sensitive, but
encrypted for uniformity); for BACKUP_CODE it is the bcrypt hash. The table is
partitioned by tenant_id (via principal_id join) for tenant-scoped queries. The
projected growth is one row per principal per factor (1-3 factors per principal),
which is 4-12 million rows at the projected peak, well within PostgreSQL's
comfort zone.
API IMPACT
Six endpoints are introduced under /mfa: GET (list factors for the current
principal), POST /enroll (enroll a new factor), POST /verify (verify a factor
during login or step-up), POST /revoke (revoke a factor), POST
/backup-codes/generate (generate new backup codes), and POST /backup-
codes/verify (verify a backup code). The enroll endpoint is interactive (TOTP
requires the user to enter a code from their authenticator app to confirm
enrollment; WebAuthn requires a challenge-response). The verify endpoint is
invoked by the MfaAuthenticationProvider during the login flow. The frontend
exposes an MFA management UI (enroll, revoke, generate backup codes) in the
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 159

PreOne ADR - Volume 4: Security Architecture v3.0
user settings page. The step-up flow is triggered automatically by the frontend
when a 403 MFA Required response is received.
UI IMPACT
MFA surfaces in the UI as the 'Multi-Factor Authentication' settings page.
Users can enroll multiple MFA factors (TOTP app, SMS, hardware key, push
notification) and mark one as primary. During login, after password
verification, the UI prompts for the primary MFA factor with a fallback ('Try
another way') to use a secondary factor. The MFA enrollment flow includes
step-by-step instructions (e.g., 'Scan this QR code with Google Authenticator').
The 'Remember this device for 30 days' checkbox (tied to Device Binding)
reduces MFA friction for trusted devices. Admins can enforce MFA for specific
roles via the RBAC UI.
SECURITY IMPACT
The MFA system directly enables the regulatory requirement for MFA on PII-
access principals (GDPR Article 32, COPPA, DPDP Section 8). The TOTP factor
provides a usable second factor for all principals, closing the password-only
attack vector (a stolen password is not sufficient to access the account). The
WebAuthn factor provides phishing-resistant authentication for high-risk
principals, closing the phishing attack vector (a fake login page cannot capture
a WebAuthn credential). The risk-based enforcement ensures that the
principals who need the strongest protection get it, while not burdening low-
risk principals. The step-up token mechanism records MFA verification for
high-risk operations, which is the audit evidence the compliance team needs.
The backup codes prevent account lockout (which would otherwise be a
security risk if users disable MFA to avoid it). The net effect is an MFA system
that satisfies the regulated education market's expectations and the OAuth 2.1
security profile.
PERFORMANCE IMPACT
MFA verification adds 1-5 seconds to the login flow (TOTP is local and instant;
WebAuthn is interactive and depends on user responsiveness), which is
acceptable because login is a low-frequency operation. The MFA factor lookup
(mfa_factors table) takes under 5ms at p99, which is within the authentication
flow's budget. The step-up token verification (JWT signature check) takes under
1ms, which is within the hot-path budget. The risk-engine lookup (per-operation
risk classification) is an in-memory lookup (the classification is cached) and
takes under 0.1ms. The overall impact on the hot path (API request validation)
is the step-up token's amr check, which is a JWT claim check and takes
negligible time.
SCALABILITY ANALYSIS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 160

PreOne ADR - Volume 4: Security Architecture v3.0
The MFA system scales with the number of principals (factor storage) and the
login rate (verification). The mfa_factors table at 4-12 million rows is well
within PostgreSQL's comfort zone, partitioned by tenant_id. The MFA
verification rate (one per login, with MFA-enabled principals) is projected to
peak at 5,000 verifications per second (50k logins per day, with MFA enabled
for 50% of principals), which is handled by the MfaAuthenticationProvider's
deployment as part of the authorization server (per ADR-062). The risk-engine
lookup is in-memory and adds no scalability concern. The step-up token
issuance is a JWT signing operation (per ADR-070), which is handled by the
authorization server's existing capacity. No architectural ceiling is anticipated
within the three-year planning horizon.
OPERATIONAL CONSIDERATIONS
The MFA system is deployed as part of the authorization server (per ADR-062)
and the Spring Security filter chain. The on-call runbook covers four failure
modes: MFA factor lookup slow (alert; consider caching), TOTP verification
failure spike (alert; possible time-sync issue or attack), WebAuthn enrollment
failure spike (alert; possible browser compatibility issue), and backup-code
exhaustion (alert; user may be locked out, support intervention required). The
MFA management UI is the primary user-facing surface; it is documented in the
user handbook and tested in the quarterly game-day. The risk classification
(per-operation) is reviewed by the ARB quarterly to ensure it reflects the
current threat landscape. The MFA system has a dedicated dashboard showing
enrollment rate, verification rate, step-up rate, and backup-code usage.
RISKS
Risk Likelihood Impact Mitigation
Principals lose Medium Medium Backup codes are
their primary generated at
factor and their enrollment and
backup codes, displayed once.
locking them out Support
of their account. intervention
procedure
documented
(identity
verification
required).
Account-recovery
runbook tested
quarterly.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 161

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| TOTP shared        | Low        | High   | Shared secret is    |
| secret is          |            |        | AES-256-GCM         |
| compromised        |            |        | encrypted per       |
| (e.g., via a       |            |        | ADR-077.            |
| database breach),  |            |        | Database breach     |
| enabling MFA       |            |        | does not expose     |
| bypass.            |            |        | plaintext secrets.  |
Re-enrollment
procedure
documented.
| WebAuthn            | Medium | Low | WebAuthn is        |
| ------------------- | ------ | --- | ------------------ |
| enrollment is       |        |     | optional (TOTP is  |
| friction-heavy,     |        |     | the default).      |
| leading principals  |        |     | WebAuthn           |
| to abandon MFA      |        |     | enrollment UX is   |
| enrollment.         |        |     | optimized. User    |
education on the
phishing-
resistance benefit.
| Risk-based      | Medium | Medium | Policy is reviewed  |
| --------------- | ------ | ------ | ------------------- |
| enforcement     |        |        | quarterly by the    |
| policy is       |        |        | ARB. Per-tenant     |
| misconfigured,  |        |        | policy is audited.  |
| over- or under- |        |        | Monitoring alerts   |
| triggering MFA. |        |        | on MFA trigger      |
rate anomalies.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
TOTP default is universally usable and  TOTP is vulnerable to phishing;
balances security with usability. WebAuthn is the mitigation for high-risk
principals.
WebAuthn option provides phishing- WebAuthn enrollment is friction-heavy
resistant authentication for high-risk  and not all devices support it.
principals.
Risk-based enforcement matches the  Risk classification requires
regulatory requirement without  configuration and quarterly review.
burdening low-risk principals.
Backup codes prevent account lockout  Backup codes must be stored securely
when the primary factor is lost. by the principal, which is a user-
education challenge.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  162

PreOne ADR - Volume 4: Security Architecture v3.0
REJECTED ALTERNATIVES
SMS-based OTP was rejected as insecure (SIM swapping, SS7 vulnerabilities,
delivery latency make SMS unsuitable for a security factor). TOTP-only was
rejected because TOTP is vulnerable to phishing (a fake login page can capture
and replay the TOTP within the 30-second window), which is the primary attack
vector against education platforms. WebAuthn-only was rejected because
mandatory WebAuthn would block onboarding in markets where it is not yet
expected, and not all devices support it. The TOTP-default-plus-WebAuthn-
option strategy is the only one that balances usability, security, and flexibility.
The full reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter, alongside the authentication-stack
migration (per ADR-062). Phase 1 (weeks 1-3): deploy the MFA system
(mfa_factors table, MfaAuthenticationProvider, MFA API) in shadow mode
(MFA verification is logged but not enforced). Phase 2 (weeks 4-6): enable MFA
for administrators (required) and a pilot group of PII-access principals; collect
feedback on the enrollment UX. Phase 3 (weeks 7-9): enable MFA for all PII-
access principals (required); enable optional MFA for other principals. Phase 4
(weeks 10-12): enable step-up MFA for high-risk operations (banking change,
export, user management). Phase 5 (week 13): the shadow-mode logging is
removed. Rollback is possible at any point by disabling MFA enforcement (the
system reverts to password-only authentication); the MFA factors remain
enrolled for principals who have them, but verification is not required.
TESTING STRATEGY
The MFA system is tested at four levels. Unit tests cover the TOTP verification
(RFC 6238 compliance), the WebAuthn challenge-response, the backup-code
generation and verification, and the risk-engine classification; coverage target
is 95%. Integration tests cover the enrollment flow (TOTP, WebAuthn, backup
codes), the verification flow (login, step-up), and the revocation flow. End-to-
end tests cover the full login -> MFA -> step-up -> high-risk-operation path.
Security tests cover the TOTP replay attack (must be rejected), the WebAuthn
phishing attack (must be rejected), the backup-code reuse (must be rejected),
and the risk-engine bypass (must be rejected). Performance tests cover the
verification rate at projected peak (5,000 per second). The acceptance criterion
is zero MFA bypass incidents in the post-cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Enrollment rate: target above 80% for
required principals, alert below 60% (possible UX issue). (2) Verification
success rate: target above 95%, alert below 90% (possible time-sync issue or
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 163

PreOne ADR - Volume 4: Security Architecture v3.0
attack). (3) Step-up rate: target under 5% of requests (high-risk operations are
rare), alert above 10% (possible risk-engine misconfiguration). (4) Backup-code
usage rate: target under 0.1% of logins, alert above 0.5% (possible factor-loss
epidemic). (5) Verification latency p99: target under 5 seconds (TOTP) and
under 10 seconds (WebAuthn, interactive). (6) Risk-engine lookup latency p99:
target under 1ms, alert above 5ms. A dedicated MFA dashboard surfaces these
alongside the per-factor-type distribution, the per-tenant enrollment rate, and
the step-up operation breakdown. Anomaly detection (per ADR-088) flags
unusual MFA patterns (verification failure spikes, step-up bursts, backup-code
exhaustion).
FUTURE EVOLUTION
The MFA system is expected to evolve in three directions. First, the WebAuthn
option may become the default (and TOTP the fallback) as device support
improves and the phishing threat intensifies; the trigger is a device-fleet audit
showing universal WebAuthn support. Second, the MFA system may add a risk-
based adaptive authentication layer that prompts for MFA based on contextual
signals (impossible travel, new device, unusual time) rather than per-operation
classification; this is monitored but not planned for v1. Third, the MFA system
may integrate with the FIDO2 passkey ecosystem (which builds on WebAuthn)
to enable passwordless authentication; this is a larger change and would
require its own ADR.
RELATED ADRS
● ADR-061 - Identity Model (provides principal_id for MFA factors)
● ADR-062 - Authentication (invokes MFA via MfaAuthenticationProvider)
● ADR-070 - JWT Policy (step-up token with amr=mfa claim)
● ADR-071 - Refresh Token Policy (family revocation forces MFA re-
authentication)
● ADR-073 - Device Binding (device trust affects MFA risk scoring)
● ADR-074 - Session Management (MFA verification persists for the
session)
● ADR-077 - Encryption (AES-256-GCM for TOTP shared secrets)
● ADR-079 - PII Protection (PII-access principals require MFA)
REFERENCES
● RFC 6238 - TOTP: Time-Based One-Time Password Algorithm. IETF.
2011.
● W3C Web Authentication: An API for accessing Public Key Credentials,
Level 2. W3C. 2021.
● FIDO Alliance - CTAP 2.1 Specification. FIDO Alliance. 2023.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 164

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● NIST SP 800-63B - Digital Identity Guidelines: Authentication and
Lifecycle Management. NIST. 2017.
● PreOne Engineering Handbook, Section 4.12 - MFA. Internal. 2025.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect  |     |
| ----------- | --- | ---------------------------- | --- |
| Tech Lead   |     | Authentication Platform Lead |     |
| ARB Chair   |     | Architecture Review Board    |     |
| Approved On |     | 2025-10-15                   |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● TOTP, SMS, push notification factors deployed (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  165

PreOne ADR - Volume 4: Security Architecture v3.0
● MFA enrollment UI (Done)
● MFA challenge during login (Done)
● Admin-enforced MFA for high-privilege roles (Done)
● WebAuthn passkey support (Done — Q2 2026)
● MFA bypass runbook for lost devices (Done)
AD R -073
Device Binding
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a device-binding scheme that fingerprints client devices through
hardware, browser, and attestation signals, derives a trust score from 0 to
100, and triggers step-up authentication when an unseen or low-trust
device attempts sensitive operations. Device records are tenant-scoped,
revocable per principal, and visible through a self-service UI.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on customer
procurement requirement
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne is accessed from a heterogeneous fleet of client devices: school-issued
tablets under MDM, BYOD laptops in 1:1 programs, shared kiosk terminals in
computer labs, and increasingly classroom IoT peripherals such as attendance
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 166

PreOne ADR - Volume 4: Security Architecture v3.0
scanners. The 2025 Q3 security review found that the legacy platform treated
every HTTP request as originating from an anonymous browser, which left the
platform exposed to credential-stuffing from botnets, account sharing between
students, and session hijacking via cookie theft. The ARB considered three
responses. The first is to ignore device identity entirely and rely on MFA, which
is rejected because MFA alone cannot distinguish a legitimate user on a new
device from an attacker with stolen credentials. The second is to enforce strict
device allow-lists (only pre-registered devices may authenticate), which is
rejected because it breaks BYOD and the kiosk use case. The third is to bind
devices to principals with a trust score that drives step-up authentication,
which is selected because it preserves usability for known devices while raising
the bar for unknown ones. This ADR defines device binding. It depends on
ADR-061 (Identity Model) for the principal record, ADR-062 (Authentication)
for the login flow, and ADR-072 (MFA) for step-up enforcement.
BUSINESS DRIVERS
The 2026 international expansion requires demonstrable device-risk controls
for several target markets; EU GDPR Article 32 explicitly cites device binding
as a reasonable technical measure, and several Indian DPDP-cognisant
customers have made device binding a contractual prerequisite. The business
also requires that device binding be invisible to the user on trusted devices
(zero-friction) and visible only when the trust score drops below threshold, to
avoid onboarding friction. Finally, the business requires that device binding not
block BYOD or kiosk scenarios, which together account for roughly 40% of
teacher traffic and 60% of student traffic in the largest customer tenants.
PROBLEM STATEMENT
The legacy platform has no device-binding capability, which leaves it exposed
to credential stuffing, account sharing, and session hijacking via cookie theft.
PreOne needs a device-binding scheme that fingerprints client devices, derives
a trust score, and triggers step-up authentication for unseen or low-trust
devices, without breaking BYOD or kiosk access patterns.
CONSTRAINTS
● Device fingerprints must be derived from signals that are stable across
browser updates but not so stable that they become a tracking
identifier subject to GDPR Article 5 consent.
● The system must work without client-side installation for browser-only
access (kiosks, BYOD); a native SDK is optional for the mobile app.
● Trust-score computation must complete within 50ms p99 to avoid
adding login latency.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 167

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● Device records must be revocable by the principal (self-service) and by
tenant administrators (administrative).
● The system must degrade gracefully when attestation signals are
unavailable (older browsers, private mode) by treating the device as
untrusted rather than rejecting it.
ASSUMPTIONS
● WebAuthn CTAP2 (per ADR-072) is available as the strongest device-
attestation signal for browsers that support it.
● The FingerprintJS open-source library (or equivalent) provides an
acceptable browser fingerprint with MIT licensing compatible with
PreOne policy.
● Mobile platforms (iOS, Android) expose Play Integrity and DeviceCheck
attestation APIs that remain stable for the planning horizon.
● Tenants will accept a default trust-score threshold of 70 (out of 100) for
step-up, with per-tenant override.
● Principals will tolerate occasional step-up prompts when their device
fingerprint changes (browser update, new browser) provided the rate is
below 5% of logins.
OPTIONS CONSIDERED
| Option             | Pros                 | Cons               | Verdict |
| ------------------ | -------------------- | ------------------ | ------- |
| Trust-scored       | Balances security    | Fingerprint        | Adopted |
| device binding     | and usability.       | collection is a    |         |
| with step-up       | Works for BYOD       | privacy-sensitive  |         |
| authentication     | and kiosks.          | operation          |         |
| (fingerprint +     | Preserves zero-      | requiring a DPIA.  |         |
| trust score + MFA  | friction on trusted  | Trust-score        |         |
| on low trust).     | devices. Aligns      | threshold tuning   |         |
|                    | with GDPR Article    | is per-tenant      |         |
|                    | 32 device-binding    | configuration      |         |
|                    | guidance.            | overhead.          |         |
Anomaly-service
dependency adds
operational
burden.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  168

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option             | Pros              | Cons               | Verdict  |
| ------------------ | ----------------- | ------------------ | -------- |
| Strict device      | Strongest         | Breaks BYOD (a     | Rejected |
| allow-lists (only  | security. Simple  | principal cannot   |          |
| pre-registered     | mental model. No  | pre-register a     |          |
| devices may        | fingerprint       | personal laptop    |          |
| authenticate).     | collection        | they have not yet  |          |
|                    | (privacy-clean).  | used). Breaks      |          |
kiosks (any
student may use
any terminal).
Rejects legitimate
new devices,
creating support
burden.
| No device binding  | Simplest. No      | MFA alone cannot    | Rejected |
| ------------------ | ----------------- | ------------------- | -------- |
| (MFA-only, per     | fingerprint       | distinguish a       |          |
| ADR-072).          | collection. No    | legitimate user on  |          |
|                    | privacy concern.  | a new device from   |          |
|                    | No additional     | an attacker with    |          |
|                    | infrastructure.   | stolen credentials  |          |
and a stolen MFA
seed. The 2024
Kaseya-style
supply-chain
attack
demonstrated that
MFA seeds can be
exfiltrated.
| Hardware-bound      | Strongest device  | Requires MDM     | Rejected |
| ------------------- | ----------------- | ---------------- | -------- |
| certificates        | identity.         | enrollment,      |          |
| (device PKI issued  | Cryptographic     | excluding BYOD.  |          |
| by an MDM).         | non-repudiation.  | Imposes          |          |
|                     | No fingerprint    | operational      |          |
|                     | collection.       | burden that the  |          |
largest customers
have explicitly
rejected.
Incompatible with
kiosks.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  169

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
We will adopt a trust-scored device-binding scheme. On every
authentication, the client submits a device fingerprint composed of
hardware signals (screen resolution, GPU, CPU cores), browser signals
(user-agent, language, timezone, installed fonts), and platform-attestation
signals (WebAuthn credential ID, Play Integrity verdict, DeviceCheck token)
where available. The server stores a device record per principal per
fingerprint hash, computes a trust score from 0 to 100 based on recency,
frequency, attestation strength, and anomaly signals, and returns the score
to the authentication layer. When the trust score falls below the tenant-
configured threshold (default 70), the authentication layer triggers step-up
MFA per ADR-072. Device records are tenant-scoped, revocable, and visible
to the principal through a self-service device-management UI.
DETAILED RATIONALE
The trust-scored approach is selected because it is the only option that
simultaneously satisfies the security, usability, and compatibility requirements.
Strict device allow-lists would provide the strongest security but break BYOD
(the principal cannot pre-register a personal laptop they have not yet used) and
kiosks (where any student may use any terminal). No device binding (MFA-only)
is rejected because MFA alone cannot distinguish a legitimate user on a new
device from an attacker with stolen credentials and a stolen MFA seed; the
2024 Kaseya-style supply-chain attack demonstrated that MFA seeds can be
exfiltrated. Hardware-bound certificates (device PKI) are rejected because they
require an MDM enrollment step that excludes BYOD and imposes an
operational burden that the largest customers have explicitly rejected. The
trust score is computed from four weighted signals. Recency (40%): how
recently the device was last seen, with exponential decay over 90 days.
Frequency (20%): how many successful authentications the device has accrued
for this principal. Attestation strength (30%): WebAuthn-bound devices score
100, Play Integrity / DeviceCheck 80, browser-fingerprint-only 50, no signal 0.
Anomaly (10%): negative adjustments for impossible travel, fingerprint churn,
or known-attacker IP ranges. The thresholds (70 for step-up, 50 for additional
challenge, 30 for hard block) were calibrated against three months of
production login data and validated by the red team. The fingerprint hash is
computed with SHA-256 over a canonicalised JSON of the signals; only the hash
and a coarse classification (attested browser, mobile, kiosk, unknown) are
stored, never the raw signals, to minimise the PII surface and avoid the
fingerprint becoming a tracking identifier under GDPR Article 5. The raw
signals are recomputed at each login and discarded after scoring.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 170

PreOne ADR - Volume 4: Security Architecture v3.0
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | DEVICE BINDING
SUBSYSTEM | +-------------------------------------------------------------+ | Client
(Browser / Mobile / Kiosk) | | - Hardware signals - Browser
signals | | - WebAuthn cred ID - Play Integrity / DeviceCheck |
+-------------------------------------------------------------+ | fingerprint payload (POST
/auth/device) | v | | Fingerprint
Hasher (SHA-256 over canonical JSON) | | |
| | v | | Device Record Store (PostgreSQL,
tenant-scoped) | | - principal_id - fingerprint_hash - first_seen | |
- last_seen - auth_count - attestation_type |
+-------------------------------------------------------------+ |
| | v | | Trust Score Engine
| | recency(0.4) + frequency(0.2) + attestation(0.3) | | + anomaly(0.1)
| +-------------------------------------------------------------+ | trust_score (0-100)
| v | | Auth Layer (ADR-062) ----> MFA step-
up (ADR-072) if < 70 | +-------------------------------------------------------------+
SEQUENCE DIAGRAM
Client -> Auth API: POST /auth/device {fingerprint} Auth API -> Hasher:
canonicalise + SHA-256 Hasher -> Device Store: lookup(principal_id, hash)
Device Store -> Trust Engine: recency, frequency, attestation Trust Engine ->
Anomaly Service: impossible-travel check Anomaly Service -> Trust Engine:
anomaly penalty Trust Engine -> Auth API: trust_score = 72 Auth API -> Auth
Layer: score >= threshold, proceed Note over Auth Layer: If score < 70, invoke
ADR-072 step-up Auth Layer -> Client: login success (or MFA challenge) Auth
API -> Device Store: update last_seen, auth_count++
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-073 — Device Binding -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Login API | factor | MFA
Service | | | | |------->| | | | +----------------+
+----------+-----------+ | | | | |
| verify | | v | | +----------------+
+----------------------+ | | | TOTP / SMS / | gen + | MFA Factor Store | |
| | Push / Hardware| verify | (Postgres) | | | +----------------+
+----------+-----------+ | | | | |
| match? | | v | | +----------------+
+----------------------+ | | | Auth Service | issue | JWT (factor verified)| | |
| |------->| | | | +----------------+ +----------------------+
| | | | Device Binding (ADR-073) ties factor
to device fingerprint | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
MFA Enrollment Flow: User -> MFA Service: enroll (TOTP / SMS / push) MFA
Service -> Postgres: store factor (encrypted) MFA Service -> User: verify (enter
code / approve push) MFA Service -> Audit: log 'MFA_ENROLLED' MFA
Verification Flow: User -> Login API: password (factor 1) Auth Service -> MFA
Service: trigger factor 2 MFA Service -> User: deliver code / push User ->
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 171

PreOne ADR - Volume 4: Security Architecture v3.0
MFA Service: enter code / approve MFA Service -> Auth Service: factor verified
Auth Service -> JWT Issuer: issue token (factor-verified claim) Device Binding
Flow: MFA Service -> Device Fingerprint: hash (UA + IP + device ID) Device
Fingerprint -> Postgres: store (per user) (login) Device Fingerprint -> MFA
Service: match? (no match) MFA Service -> User: require device verification
DATABASE IMPACT
A new table device_binding is introduced with columns principal_id (UUIDv7,
FK to principals), fingerprint_hash (CHAR(64), indexed), attestation_type
(ENUM: webauthn, play_integrity, devicecheck, browser, none), first_seen
(TIMESTAMPTZ), last_seen (TIMESTAMPTZ), auth_count (INTEGER),
revoked_at (TIMESTAMPTZ, nullable), tenant_id (UUIDv7). The primary key is
(principal_id, fingerprint_hash). A partial index on revoked_at IS NULL
supports the active-device query. Retention follows ADR-053 (Data Retention):
device records are purged 180 days after the principal's last authentication or
on principal deletion. The table is partitioned by tenant_id at the 50-tenant
boundary per ADR-044 (Database Sharding). Expected row count at steady
state: ~2.5M (5 devices average per principal, 500K principals).
API IMPACT
A new endpoint POST /auth/device is added to the authentication API; it accepts
the fingerprint payload and returns the trust score (for diagnostics) or invokes
the next authentication step. A GET /me/devices endpoint allows principals to
list and revoke their bound devices; this is exposed in the account-settings UI. A
DELETE /me/devices/{fingerprint_hash} revokes a specific device and
invalidates its sessions (per ADR-074, Session Management). Administrative
endpoints GET /admin/tenants/{id}/devices and DELETE allow tenant
operators to revoke devices in bulk during incident response. All endpoints are
rate-limited per ADR-080 and audit-logged per ADR-086. The fingerprint
payload is treated as sensitive: it is transmitted only over TLS 1.3 (per
ADR-077) and is never logged.
UI IMPACT
Device Binding surfaces in the UI as the 'Trusted Devices' panel on the Account
page. Each trusted device shows a name (auto-generated from user agent), IP
address, last active timestamp, and a 'Revoke trust' button. When a user logs in
from an untrusted device, the UI prompts for an additional verification step
(email link or admin approval) before granting access. The 'New device login'
notification email includes a 'If this was not you, click here' link that revokes the
device and forces logout. The UI was updated in 2025 to support WebAuthn
passkeys as a device-binding mechanism, simplifying the flow for users with
modern browsers.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 172

PreOne ADR - Volume 4: Security Architecture v3.0
SECURITY IMPACT
Device binding raises the cost of credential-stuffing attacks by an estimated
80%: an attacker with a stolen credential list must now also match a device
fingerprint that the principal has previously used, or face step-up MFA. It also
enables detection of session-hijacking attacks: a hijacked cookie presented
from a new device fingerprint triggers step-up. The fingerprint hash itself is a
potential tracking identifier under GDPR Article 5; this is mitigated by storing
only the hash and a coarse classification, never the raw signals, and by
partitioning the device store per tenant so cross-tenant correlation is
impossible. The trust-score engine is a single point of failure for the step-up
decision; it is deployed in HA with a read-only fallback that returns a permissive
score (50) on outage, ensuring login availability is not broken by the device
subsystem.
PERFORMANCE IMPACT
Fingerprint hashing (SHA-256 over ~1KB canonical JSON) is sub-millisecond.
Device-store lookup is a single indexed read; at 2.5M rows partitioned by
tenant, expected p99 latency is 3ms. Anomaly-service lookup (impossible-travel
check) is the slowest component at ~10ms p99 because it requires a GeoIP
lookup and a comparison against the principal's recent locations; this is cached
in Redis for 60 seconds per principal_id. Total trust-score computation adds
15ms p99 to the login flow, well within the 50ms budget. The self-service
device-list endpoint is expected to be low-traffic; no special caching is required.
The administrative bulk-revoke endpoint is rate-limited to 10 concurrent
operations per tenant to avoid saturating the session-invalidation pipeline (per
ADR-074).
SCALABILITY ANALYSIS
The device store grows linearly with the principal count at ~5 rows per
principal, giving ~2.5M rows at 500K principals and ~25M rows at the 5M-
principal projection. Partitioning by tenant_id (per ADR-044) keeps individual
partitions under 100K rows for all but the largest tenants, where sub-
partitioning by fingerprint_hash prefix is available. The trust-score engine is
stateless and scales horizontally behind a load balancer; the GeoIP lookup is the
only shared dependency and is cached in Redis. The anomaly-service
dependency is the most likely scaling bottleneck: at 5,000 logins per second
(projected peak), it must perform 5,000 GeoIP lookups per second, which is
within Redis single-node capacity but will require Redis Cluster by the 10K-
login/second horizon. No architectural change is anticipated before that
horizon.
OPERATIONAL CONSIDERATIONS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 173

PreOne ADR  -  Volume 4: Security Architecture  v3.0
The device-binding subsystem requires three operational artefacts. (1) A
runbook for trust-score threshold tuning: the security team reviews the step-up
rate weekly and adjusts thresholds per tenant if the rate exceeds 5% of logins
(UX friction) or falls below 0.1% (possible attack). (2) A runbook for fingerprint-
hash revocation during incident response: bulk revoke is exposed via the
administrative API and tested quarterly. (3) A runbook for device-store
partitioning: the DBA team monitors partition sizes and triggers sub-
partitioning when any partition exceeds 100K rows. The GeoIP database is
updated monthly via the MaxMind GeoIP2 enterprise feed; staleness beyond 60
days triggers a low-severity alert. The anomaly-service cache hit ratio is
monitored; a drop below 90% indicates a sizing problem.
RISKS
| Risk                | Likelihood | Impact | Mitigation         |
| ------------------- | ---------- | ------ | ------------------ |
| Fingerprint         | Medium     | Medium | Tolerance band in  |
| signals drift over  |            |        | fingerprint        |
| browser updates,    |            |        | comparison; allow  |
| causing legitimate  |            |        | 1-signal drift     |
| users to be         |            |        | without score      |
| stepped-up          |            |        | penalty. Weekly    |
| frequently.         |            |        | step-up-rate       |
monitoring with
threshold tuning.
| Fingerprint          | Medium | High | Store only the    |
| -------------------- | ------ | ---- | ----------------- |
| becomes a            |        |      | SHA-256 hash and  |
| tracking identifier  |        |      | coarse            |
| subject to GDPR      |        |      | classification;   |
| consent.             |        |      | partition per     |
tenant; data-
protection impact
assessment (DPIA)
on file.
| Trust-score engine  | Low | High | HA deployment        |
| ------------------- | --- | ---- | -------------------- |
| outage breaks       |     |      | with permissive      |
| login.              |     |      | fallback (score 50)  |
on outage; circuit
breaker; alerting
on fallback
activation.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  174

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                 | Likelihood | Impact | Mitigation          |
| -------------------- | ---------- | ------ | ------------------- |
| Anomaly service      | High       | Low    | VPN egress IP       |
| returns false        |            |        | ranges are allow-   |
| positives            |            |        | listed; step-up     |
| (impossible travel)  |            |        | MFA (not block) is  |
| for users on VPNs.   |            |        | the response; per-  |
tenant allow-list
maintained by
support.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Strong protection against credential  Added login latency (~15ms p99) and
| stuffing and session hijacking. |     | occasional step-up friction. |     |
| ------------------------------- | --- | ---------------------------- | --- |
Self-service device management  Additional surface area in the account-
| improves user trust. |     | settings UI requiring localisation and  |     |
| -------------------- | --- | --------------------------------------- | --- |
support.
Anomaly detection provides early  False positives on VPN users require
| warning of attacks. |     | allow-list maintenance. |     |
| ------------------- | --- | ----------------------- | --- |
Per-tenant threshold tuning allows  Configuration drift across tenants
| market-specific calibration. |     | complicates support and audit. |     |
| ---------------------------- | --- | ------------------------------ | --- |
REJECTED ALTERNATIVES
Strict device allow-lists were rejected because they break BYOD (a principal
cannot pre-register a personal laptop they have not yet used) and kiosks (where
any student may use any terminal), which together represent the majority of
teacher and student traffic. No device binding (MFA-only) was rejected because
MFA alone cannot distinguish a legitimate user on a new device from an
attacker with stolen credentials and a stolen MFA seed; the 2024 Kaseya-style
supply-chain   attack   demonstrated   that   MFA   seeds   can   be   exfiltrated.
Hardware-bound certificates (device PKI) were rejected because they require
an MDM enrollment step that excludes BYOD and imposes an operational
burden that the largest customers have explicitly rejected. IP-based binding
was rejected because residential IPs rotate frequently (causing false positives)
and school NAT egress IPs are shared by hundreds of students (providing no
signal). The trust-scored approach is the only one that simultaneously satisfies
the security, usability, and compatibility requirements; the full reasoning is
captured in the Options Considered table.
MIGRATION PLAN
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  175

PreOne ADR - Volume 4: Security Architecture v3.0
Migration is phased over one quarter alongside the authentication-stack
migration (per ADR-062). Phase 1 (weeks 1-3): deploy the device-binding
subsystem (device_binding table, FingerprintHasher, TrustScoreEngine,
AnomalyService) in shadow mode (fingerprints are collected and scored but the
score is logged, not enforced). Phase 2 (weeks 4-6): enable step-up enforcement
for administrators only; collect feedback on the step-up rate and tune
thresholds. Phase 3 (weeks 7-9): enable step-up enforcement for all principals
at the default threshold (70); enable the self-service device-management UI.
Phase 4 (weeks 10-12): enable the administrative bulk-revoke API and the
operational runbooks. Phase 5 (week 13): the shadow-mode logging is removed.
Rollback is possible at any point by disabling step-up enforcement (the
subsystem reverts to shadow mode); the device records remain in place for
principals who have them, but step-up is not triggered. The legacy platform's
IP-rate-limit (a crude device proxy) is decommissioned in Phase 4.
TESTING STRATEGY
The device-binding subsystem is tested at four levels. Unit tests cover the
FingerprintHasher (canonicalisation correctness), the TrustScoreEngine
(signal weighting, threshold crossing), and the AnomalyService (impossible-
travel detection, VPN allow-list). Coverage target is 95%. Integration tests
cover the device-store CRUD, the trust-score computation end-to-end, and the
step-up invocation. End-to-end tests cover the full login -> device-binding ->
step-up -> success path. Security tests cover fingerprint-hash collision
resistance, the permissive-fallback on outage, and the bulk-revoke rate limit.
Performance tests cover the trust-score computation at projected peak (5,000
logins per second). Red-team tests cover the fingerprint-spoofing attack (must
trigger step-up), the fingerprint-replay attack (must be rejected by recency
scoring), and the anomaly-service bypass. The acceptance criterion is zero
device-binding bypass incidents in the post-cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Step-up rate: target under 5% of logins,
alert above 10% (possible UX issue or attack). (2) Trust-score distribution:
median should be 85+, alert if median drops below 75 (possible fingerprint-drift
epidemic). (3) Anomaly-service cache hit ratio: target above 90%, alert below
80% (sizing problem). (4) Device-store lookup latency p99: target under 5ms,
alert above 10ms. (5) Trust-score computation latency p99: target under 50ms,
alert above 100ms. (6) Fingerprint-hash collision rate: target 0, alert on any
collision (possible attack or hash bug). A dedicated device-binding dashboard
surfaces these alongside the per-tenant step-up rate, the attestation-type
distribution, and the top anomaly reasons. Anomaly detection (per ADR-088)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 176

PreOne ADR - Volume 4: Security Architecture v3.0
flags unusual patterns such as a tenant-wide step-up burst (possible attack) or a
single principal's device count exceeding 20 (possible account sharing).
FUTURE EVOLUTION
The device-binding subsystem is expected to evolve in three directions. First,
the trust-score engine may incorporate behavioural signals (typing cadence,
mouse movement) for continuous authentication; this is monitored but not
planned for v1 because of the privacy implications. Second, the system may
integrate with the FIDO2 passkey ecosystem (which builds on WebAuthn) to
enable passwordless authentication; the device-binding record would then
become the primary principal identifier, which is a larger change and would
require its own ADR. Third, the system may add device-posture signals (OS
version, browser version, patch level) to the trust score, raising the bar for
outdated devices; this is planned for v2 and is tracked as a follow-up. The
trigger for revisiting this ADR is a regulatory change (e.g., EU eIDAS 2.0
requiring hardware-bound authentication) or a material change in the device
fleet composition.
RELATED ADRS
● ADR-061 - Identity Model (provides principal_id for device records)
● ADR-062 - Authentication (invokes device binding in login flow)
● ADR-072 - MFA (invoked as step-up when trust score < threshold)
● ADR-074 - Session Management (device revocation invalidates
sessions)
● ADR-077 - Encryption (fingerprint payload protected by TLS 1.3)
● ADR-079 - PII Protection (fingerprint hash is borderline PII; DPIA on
file)
REFERENCES
● RFC 7636 - Proof Key for Code Exchange by OAuth Public Clients.
IETF. 2015.
● FIDO Alliance - CTAP 2.1 Specification. FIDO Alliance. 2023.
● Google - Play Integrity API Developer Guide. Google. 2024.
● Apple - DeviceCheck Framework Reference. Apple. 2024.
● PreOne Engineering Handbook, Section 4.13 - Device Binding. Internal.
2025.
DECISION HISTORY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 177

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect  |     |
| ----------- | --- | ---------------------------- | --- |
| Tech Lead   |     | Authentication Platform Lead |     |
| ARB Chair   |     | Architecture Review Board    |     |
| Approved On |     | 2025-10-15                   |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Device fingerprint hashing implemented (Done)
● Trusted Devices UI panel (Done)
● New-device verification flow (Done)
● WebAuthn passkey integration (Done)
● Device revocation flow (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  178

PreOne ADR - Volume 4: Security Architecture v3.0
● Quarterly device-trust review (Scheduled)
AD R -074
Session Management
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a sliding-session model with a 12-hour idle timeout, a 7-day absolute
timeout, and a per-principal concurrent-session limit of 5. Sessions are
stored in Redis as signed JWTs with a server-side revocation list, and are
invalidated on password change, MFA revocation, or device revocation.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on customer
procurement requirement
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The legacy platform uses stateless JWTs with a 30-day absolute expiry and no
idle timeout, which the 2025 Q3 security review identified as the single largest
session-security gap. Long-lived stateless tokens cannot be revoked without
server-side state, which means a stolen token remains valid for up to 30 days.
The ARB considered four session models. The first is pure stateless JWTs with
short expiry (15 minutes) and refresh tokens, which is rejected because the
refresh-token flow itself becomes the de facto session and inherits the same
revocation problem. The second is server-side sessions stored in a database,
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 179

PreOne ADR - Volume 4: Security Architecture v3.0
which is rejected because the lookup cost on every request is prohibitive at
PreOne's scale. The third is sliding sessions in Redis with short idle timeout,
which is selected because it provides revocation, idle timeout, and concurrent-
session limits at acceptable performance. The fourth is a hybrid (stateless JWT
for the first 15 minutes, then server-side check), which is rejected as
unnecessarily complex. This ADR defines session management. It depends on
ADR-062 (Authentication) for session creation, ADR-070 (JWT Policy) for the
token format, and ADR-071 (Refresh Token Policy) for the refresh flow.
BUSINESS DRIVERS
The 2026 international expansion requires session timeouts aligned with each
regulatory regime: GDPR recommends idle timeouts for PII-accessing sessions;
COPPA requires parental re-authentication for minors after 30 minutes of
inactivity; DPDP requires audit logs of session termination. A single
configurable session model with per-tenant policy satisfies all three. The
business also requires concurrent-session limits to prevent credential sharing,
which is a common abuse pattern in education (students share logins to access
paid content). Finally, the business requires that session revocation be near-
instantaneous (under 5 seconds) to support incident response, which rules out
stateless-only models.
PROBLEM STATEMENT
The legacy platform uses 30-day stateless JWTs that cannot be revoked, which
leaves stolen tokens valid for up to 30 days and prevents concurrent-session
control. PreOne needs a session model that supports idle timeout, absolute
timeout, concurrent-session limits, and near-instantaneous revocation, at
acceptable performance for 5,000 requests per second.
CONSTRAINTS
● Sessions must be revocable within 5 seconds p99 across the platform.
● The session-store lookup must add less than 2ms p99 to every
authenticated request.
● Per-principal concurrent sessions must be limited to a tenant-
configurable value (default 5).
● Idle and absolute timeouts must be configurable per tenant and per
principal role (e.g., shorter for administrators).
● The session model must remain compatible with the JWT format
defined in ADR-070 to avoid a flag-day token migration.
ASSUMPTIONS
● Redis (per ADR-046, Caching) is available with sufficient capacity for
~2M concurrent sessions at peak.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 180

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● The JWT signature verification (RS256 per ADR-070) is fast enough
(<1ms) to be performed on every request.
● Principals will tolerate being signed out after 12 hours of inactivity,
provided the re-login flow is fast (<3 seconds).
● COPPA minors' sessions will be configured with a 30-minute idle
timeout at the tenant level.
● The revocation list will be checked on every request via a Redis SET
membership test, which is O(1).
OPTIONS CONSIDERED
| Option               | Pros                | Cons              | Verdict |
| -------------------- | ------------------- | ----------------- | ------- |
| Sliding sessions in  | Provides            | Redis dependency  | Adopted |
| Redis with idle      | revocation, idle    | on every          |         |
| timeout, absolute    | timeout, and        | authenticated     |         |
| timeout,             | concurrent limits.  | request. Redis    |         |
| concurrent limit,    | Sub-2ms lookup.     | outage breaks     |         |
| and revocation       | Compatible with     | authentication    |         |
| list.                | JWT format. Per-    | (mitigated by     |         |
|                      | tenant policy       | fallback).        |         |
|                      | configurable.       | Operational       |         |
burden of Redis
Cluster
management.
| Pure stateless   | No server-side       | Refresh-token flow  | Rejected |
| ---------------- | -------------------- | ------------------- | -------- |
| JWTs with short  | state. Horizontally  | becomes the de      |          |
| expiry (15       | scalable without     | facto session and   |          |
| minutes) and     | shared store.        | inherits the        |          |
| refresh tokens.  | Simple to operate.   | revocation          |          |
problem. Stolen
refresh token is as
valuable as a
stolen session.
Cannot enforce
concurrent limits.
| Server-side  | Strong             | Lookup cost (5-   | Rejected |
| ------------ | ------------------ | ----------------- | -------- |
| sessions in  | consistency. ACID  | 10ms even with    |          |
| PostgreSQL.  | guarantees.        | caching) is       |          |
|              | Familiar           | prohibitive at    |          |
|              | operational model. | 5,000 RPS. Write  |          |
amplification on
last_seen
saturates the
database.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  181

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option             | Pros                 | Cons                | Verdict  |
| ------------------ | -------------------- | ------------------- | -------- |
| Hybrid: stateless  | Reduces server-      | Two code paths      | Rejected |
| JWT for 15         | side load in the     | double the testing  |          |
| minutes, then      | first 15 minutes of  | surface. Server-    |          |
| server-side check. | a session.           | side check still    |          |
|                    | Preserves            | required after 15   |          |
|                    | revocation after     | minutes.            |          |
|                    | 15 minutes.          | Performance win     |          |
only on the first
15 minutes -
exactly when
sessions are most
numerous.
DECISION
ADOPTED
We will adopt a sliding-session model. On successful authentication, the
server issues a JWT (per ADR-070) with a 15-minute expiry and stores a
session record in Redis keyed by the JWT's session_id (a UUIDv7 claim). The
session record contains the principal_id, tenant_id, device fingerprint hash
(per ADR-073), issued_at, last_seen, and expires_at. On every authenticated
request, the server verifies the JWT signature, looks up the session in Redis,
updates last_seen (sliding), and rejects if the session is revoked or expired.
Idle timeout is 12 hours (configurable per tenant); absolute timeout is 7
days. Per-principal concurrent sessions are limited to 5; new sessions
beyond the limit revoke the oldest.
DETAILED RATIONALE
The sliding-session model is selected because it is the only option that
simultaneously satisfies the revocation, idle-timeout, concurrent-limit, and
performance requirements. Pure stateless JWTs with refresh tokens were
rejected because the refresh-token flow becomes the de facto session and
inherits the same revocation problem; a stolen refresh token is as valuable as a
stolen session. Server-side sessions in PostgreSQL were rejected because the
lookup cost (even with caching) adds 5-10ms to every request, which is
unacceptable at 5,000 requests per second. The hybrid model was rejected
because it adds complexity (two code paths) without meaningful benefit: the
server-side check is still required after 15 minutes, so the performance win is
only on the first 15 minutes of a session.  The 12-hour idle timeout is calibrated
against user-behaviour data: 95% of teacher sessions end within 4 hours, and
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  182

PreOne ADR - Volume 4: Security Architecture v3.0
99% within 8 hours; 12 hours covers the longest legitimate workday while
preventing the indefinite sessions that the security review flagged. The 7-day
absolute timeout forces periodic re-authentication, which is a defence-in-depth
measure against stolen tokens: even an undetected token theft expires within 7
days. The 5-session concurrent limit is calibrated against legitimate usage (a
principal typically uses 1-3 devices) while preventing the credential-sharing
abuse pattern (which often involves 10+ concurrent sessions). Session
revocation is implemented via a Redis SET of revoked session_ids with TTL
equal to the session's remaining lifetime. On every request, the server performs
an O(1) SISMEMBER check against the revocation list. Revocation is triggered
by: explicit logout, password change (per ADR-075), MFA factor revocation (per
ADR-072), device revocation (per ADR-073), administrative action, and
security-incident response (per ADR-089). The revocation list is replicated
across Redis nodes; revocation propagation is under 5 seconds p99.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | SESSION MANAGEMENT
SUBSYSTEM | +-------------------------------------------------------------+ | Auth API
(ADR-062) | | on success: issue JWT (15min) + create
session in Redis | +-------------------------------------------------------------+ | JWT
(session_id claim) | v | |
Redis Session Store | | key: session:{session_id}
| | val: {principal_id, tenant_id, device_hash, | | issued_at,
last_seen, expires_at} | | TTL: idle_timeout (12h, sliding)
| +-------------------------------------------------------------+ | +-- Revocation Set (Redis
SET) | | | key: revoked_sessions | | | val:
{session_id1, session_id2, ...} | | | TTL: per-member
| v v | | Auth Middleware (every request)
| | 1. verify JWT signature (RS256) | | 2. SISMEMBER
revoked_sessions session_id -> reject if 1 | | 3. GET session:{session_id}
-> reject if nil | | 4. update last_seen (sliding) | | 5. enforce
concurrent-session limit |
+-------------------------------------------------------------+
SEQUENCE DIAGRAM
Client -> Auth API: POST /auth/login (credentials + MFA) Auth API -> JWT
Issuer: generate JWT (15min, session_id claim) JWT Issuer -> Redis: SET session:
{id} {payload} EX 43200 Redis -> JWT Issuer: OK JWT Issuer -> Client: 200 OK
{access_token, refresh_token} Client -> API: GET /resource (Authorization:
Bearer JWT) API -> Auth Middleware: verify JWT + Redis lookup Auth
Middleware -> Redis: SISMEMBER revoked_sessions id Auth Middleware ->
Redis: GET session:{id} + update last_seen Auth Middleware -> API: principal
context API -> Client: 200 OK {resource}
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-074 — Session Management
- Component View | +-------------------------------------------------------------+ |
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 183

PreOne ADR - Volume 4: Security Architecture v3.0
| | +----------------+ +----------------------+ | | | Auth Service | issue | Token
Service | | | | |------->| (JWT / Refresh / | | | +----------------
+ | Session) | | | +----------+-----------+ | |
| | | | verify | |
v | | +----------------+ +----------------------+ | | | API Gateway |
recv | Token Validator | | | | |------->| (signature + exp) |
| | +----------------+ +----------+-----------+ | | |
| | | cache (Redis) | | v
| | +----------------+ +----------------------+ | | | Session Store | CRUD | Redis
| | | | |------->| (active sessions) | | | +----------------+
+----------------------+ | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Token Lifecycle Flow: Auth Service -> JWT Issuer: create
(header.payload.signature) JWT Issuer -> Client: access token (15min) +
refresh token (30d) Client -> API: Bearer token in header API -> Token
Validator: verify signature + expiry (valid) API -> App: process request
(expired) API -> Client: 401 (trigger refresh) Session Flow: Auth Service ->
Session Store (Redis): create session Client -> API: Bearer + session cookie
API -> Session Store: validate active (logout) API -> Session Store: delete
session API -> Audit: log 'SESSION_TERMINATED'
DATABASE IMPACT
No new persistent tables are introduced. Session state lives entirely in Redis,
which is the canonical store for ephemeral session data per ADR-046. The
principals table gains a column last_session_at (TIMESTAMPTZ) updated on
session creation for concurrency-limit accounting; this is a hot column and is
updated via a deferred write (queued in Redis, flushed to PostgreSQL every 30
seconds) to avoid write amplification. Audit logs of session creation and
revocation are written to the audit_trail table per ADR-086. Expected Redis
memory at steady state: ~2M sessions × 500 bytes = 1GB, well within a 3-node
Redis Cluster capacity. Redis persistence (AOF every-second) provides
acceptable durability for session data.
API IMPACT
The authentication API (per ADR-062) is extended with three session-
management endpoints. POST /auth/logout revokes the current session and
clears the refresh-token family (per ADR-071). POST /auth/sessions/list returns
the principal's active sessions (session_id, device_hash, last_seen, ip_address)
for the self-service UI. DELETE /auth/sessions/{session_id} revokes a specific
session. Administrative endpoints GET /admin/tenants/{id}/sessions and
DELETE allow tenant operators to list and revoke sessions in bulk. All
endpoints are audit-logged per ADR-086. The session_id is exposed in the JWT
as a claim but is not a sensitive identifier on its own: it is bound to the principal
and is meaningless without the JWT signature.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 184

PreOne ADR - Volume 4: Security Architecture v3.0
UI IMPACT
JWT and session management are largely invisible to end users. The UI
maintains session via HTTP-only cookies (for web) and bearer tokens (for API).
When an access token expires, the UI transparently refreshes it (via the refresh
token) without user interaction; if the refresh token is also expired, the UI
redirects to login with a 'Your session has expired. Please log in again.'
message. The 'Account' page includes an 'Active Sessions' panel showing the
user's active sessions (device, IP, last active) with a 'Revoke' button per session
— useful for logging out of a forgotten device. JWT expiry is tuned to balance
security (short expiry) and UX (no frequent re-login).
SECURITY IMPACT
Sliding sessions reduce the stolen-token attack window from 30 days (legacy) to
12 hours (idle timeout) or 7 days (absolute), a 60x improvement in the worst
case. Concurrent-session limits prevent credential sharing, which the support
team has identified as the leading abuse pattern in education customers. Near-
instantaneous revocation enables effective incident response: a compromised
principal can be locked out within 5 seconds, versus the legacy 30-day window.
The Redis session store is a single point of failure for authentication; this is
mitigated by Redis Cluster (3 nodes, 1 replica each) and a permissive fallback
that accepts valid JWTs for 60 seconds during a Redis outage (the Redis-down
window), after which authentication fails closed. The fallback window is
monitored; a sustained outage triggers incident response per ADR-089.
PERFORMANCE IMPACT
The session-store lookup adds 1-2ms p99 to every authenticated request,
dominated by the Redis SISMEMBER and GET round-trip. At 5,000 requests
per second (projected peak), this is 5,000 Redis operations per second, well
within a single Redis node's capacity (~100K ops/sec). The revocation-list
SISMEMBER is O(1) and adds negligible latency. The JWT signature
verification (RS256) is the more expensive component at ~0.5ms per request;
this is unavoidable given the JWT format (per ADR-070) and is amortised across
all authenticated endpoints. The deferred write to principals.last_session_at
avoids write amplification on the hot path. Total authentication-middleware
overhead: ~3ms p99, acceptable for the 100ms p99 API budget.
SCALABILITY ANALYSIS
The session store scales linearly with the concurrent-principal count: ~2M
sessions at peak (500K principals × 4 average concurrent sessions). Redis
Cluster (3 shards) provides horizontal scaling beyond the single-node capacity;
the sharding key is principal_id, which co-locates all sessions for a principal on
one shard (required for concurrency-limit enforcement). The revocation list is a
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 185

PreOne ADR  -  Volume 4: Security Architecture  v3.0
single SET and does not shard; at projected peak it holds ~10K revoked
sessions, well within a single Redis SET's capacity. The concurrency-limit check
requires enumerating the principal's sessions (SCAN by principal_id prefix);
this is O(N) where N is the principal's session count (typically 1-5), so
negligible. The 5M-principal projection requires Redis Cluster expansion to 9
shards, which is a configuration change, not an architectural one.
OPERATIONAL CONSIDERATIONS
The session-management subsystem requires four operational artefacts. (1) A
runbook for Redis-cluster failover: the on-call engineer must verify that the
permissive fallback activates and that authentication continues during a Redis
node failure. (2) A runbook for revocation-list overflow: if the revocation list
exceeds 100K entries (indicating a bulk-revocation incident), the engineer must
verify that SISMEMBER latency remains under 1ms. (3) A runbook for
concurrency-limit disputes: principals who hit the limit may contact support;
the runbook covers manual limit elevation per principal with audit logging. (4)
A runbook for session-store capacity: the DBA team monitors Redis memory
usage and triggers cluster expansion at 70% utilisation. Per-tenant session-
policy   changes   (idle   timeout,   absolute   timeout,   concurrency   limit)   are
propagated within 60 seconds via the configuration service (per ADR-038).
RISKS
| Risk            | Likelihood | Impact | Mitigation           |
| --------------- | ---------- | ------ | -------------------- |
| Redis outage    | Low        | High   | Redis Cluster HA     |
| breaks          |            |        | (3 nodes, 1 replica  |
| authentication. |            |        | each) +              |
permissive 60-
second fallback +
circuit breaker +
alerting on
fallback
activation.
| Revocation list  | Medium | Medium | TTL on each        |
| ---------------- | ------ | ------ | ------------------ |
| grows            |        |        | member; monitor    |
| unboundedly      |        |        | size; alert above  |
| during bulk-     |        |        | 100K; incident-    |
| revocation       |        |        | response runbook   |
| incidents.       |        |        | covers manual      |
purge.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  186

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Sliding-session    | Low        | Medium | Batch updates via   |
| update on every    |            |        | client-side buffer  |
| request saturates  |            |        | (every 5 minutes    |
| Redis.             |            |        | per session);       |
monitor Redis
write rate.
| Concurrent-       | Medium | Low | Default limit of 5  |
| ----------------- | ------ | --- | ------------------- |
| session limit     |        |     | covers 99% of       |
| causes user       |        |     | usage; per-         |
| frustration in    |        |     | principal override  |
| legitimate multi- |        |     | available; self-    |
| device scenarios. |        |     | service session-    |
management UI.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Near-instantaneous revocation enables  Redis dependency on every
| effective incident response. |     | authenticated request. |     |
| ---------------------------- | --- | ---------------------- | --- |
Idle timeout reduces stolen-token  Principals must re-authenticate after 12
| attack window. |     | hours of inactivity. |     |
| -------------- | --- | -------------------- | --- |
Concurrent-session limits prevent  Legitimate multi-device users may hit
| credential sharing. |     | the limit. |     |
| ------------------- | --- | ---------- | --- |
Per-tenant policy tuning satisfies  Configuration drift complicates support.
regulatory diversity.
REJECTED ALTERNATIVES
Pure stateless JWTs with short expiry (15 minutes) and refresh tokens were
rejected because the refresh-token flow becomes the de facto session and
inherits the same revocation problem; a stolen refresh token is as valuable as a
stolen session, and revoking refresh tokens requires the same server-side state
that this model was trying to avoid. Server-side sessions in PostgreSQL were
rejected because the lookup cost (5-10ms even with caching) is prohibitive at
5,000 requests per second, and the write amplification on last_seen would
saturate the database. The hybrid model (stateless JWT for 15 minutes, then
server-side check) was rejected as unnecessarily complex: it requires two code
paths, doubles the testing surface, and the server-side check is still required
after 15 minutes, so the performance win is only on the first 15 minutes of a
session - exactly the period when sessions are most numerous. Cookie-based
sessions (no JWT) were rejected because they do not work for the mobile app
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  187

PreOne ADR - Volume 4: Security Architecture v3.0
and the third-party-cookie deprecation in modern browsers makes cross-site
sessions unreliable. The sliding-session model is the only one that satisfies all
requirements; the full reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter alongside the authentication-stack
migration (per ADR-062). Phase 1 (weeks 1-3): deploy the session-management
subsystem (Redis session store, revocation set, auth middleware) in shadow
mode (sessions are created in Redis but the legacy JWT validation continues).
Phase 2 (weeks 4-6): enable the new auth middleware for administrators only;
collect feedback on the revocation and concurrency-limit behaviour. Phase 3
(weeks 7-9): enable the new auth middleware for all principals; the legacy 30-
day JWTs are migrated to 15-minute JWTs with refresh tokens (per ADR-071).
Phase 4 (weeks 10-12): enable the self-service session-management UI and the
administrative bulk-revoke API. Phase 5 (week 13): the shadow-mode logging is
removed. Rollback is possible at any point by reverting to the legacy JWT
validation; the Redis session store is left in place but ignored. The legacy 30-day
JWTs are force-expired by rotating the JWT signing key (per ADR-070), which
causes a one-time re-authentication for all principals.
TESTING STRATEGY
The session-management subsystem is tested at four levels. Unit tests cover the
session-record serialisation, the revocation-list operations, and the
concurrency-limit enforcement. Coverage target is 95%. Integration tests cover
the session creation, lookup, sliding update, and revocation flows. End-to-end
tests cover the full login -> use -> idle-timeout -> re-login path and the login ->
logout -> session-revoked path. Security tests cover the revocation propagation
(must be under 5 seconds), the concurrency-limit bypass (must be rejected),
and the Redis-outage fallback (must fail closed after 60 seconds). Performance
tests cover the auth-middleware overhead at projected peak (5,000 requests
per second). Chaos tests cover Redis-cluster failover and the permissive-
fallback activation. The acceptance criterion is zero session-revocation bypass
incidents in the post-cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Session-store lookup latency p99: target
under 2ms, alert above 5ms. (2) Revocation-list size: target under 10K, alert
above 100K (possible bulk-revocation incident). (3) Revocation propagation
time p99: target under 5 seconds, alert above 10 seconds. (4) Concurrent-
session-limit hit rate: target under 0.1% of logins, alert above 1% (possible
credential-sharing epidemic). (5) Redis-cluster failover rate: target 0, alert on
any failover. (6) Permissive-fallback activation rate: target 0, alert on any
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 188

PreOne ADR - Volume 4: Security Architecture v3.0
activation (indicates Redis issue). A dedicated session-management dashboard
surfaces these alongside the active-session count, the per-tenant session-policy
distribution, and the top revocation reasons. Anomaly detection (per ADR-088)
flags unusual patterns such as a tenant-wide session-revocation burst (possible
incident) or a single principal's session count exceeding 10 (possible abuse).
FUTURE EVOLUTION
The session-management subsystem is expected to evolve in three directions.
First, the system may add continuous-authentication signals (per ADR-073
device trust) that progressively lower the session trust score over time,
triggering step-up MFA without explicit logout; this is monitored but not
planned for v1. Second, the system may integrate with the FIDO2 passkey
ecosystem to enable passwordless re-authentication, reducing the friction of
the 12-hour idle timeout; this is a larger change and would require its own ADR.
Third, the system may add tenant-scoped session-anomaly detection that flags
unusual session patterns (impossible travel between sessions, session from a
new geolocation) in real time; this is planned for v2 and is tracked as a follow-
up. The trigger for revisiting this ADR is a regulatory change (e.g., EU NIS2
requiring 8-hour idle timeouts) or a material change in the threat landscape.
RELATED ADRS
● ADR-061 - Identity Model (provides principal_id for sessions)
● ADR-062 - Authentication (creates sessions on login)
● ADR-070 - JWT Policy (defines the JWT format)
● ADR-071 - Refresh Token Policy (refresh flow interacts with sessions)
● ADR-073 - Device Binding (device revocation invalidates sessions)
● ADR-072 - MFA (MFA revocation invalidates sessions)
● ADR-046 - Caching (Redis is the session store)
REFERENCES
● OWASP - Session Management Cheat Sheet. OWASP. 2024.
● RFC 6749 - The OAuth 2.0 Authorization Framework. IETF. 2012.
● NIST SP 800-63B - Digital Identity Guidelines: Authentication and
Lifecycle Management. NIST. 2017.
● Redis Documentation - Cluster Specification. Redis Labs. 2024.
● PreOne Engineering Handbook, Section 4.14 - Session Management.
Internal. 2025.
DECISION HISTORY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 189

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect  |     |
| ----------- | --- | ---------------------------- | --- |
| Tech Lead   |     | Authentication Platform Lead |     |
| ARB Chair   |     | Architecture Review Board    |     |
| Approved On |     | 2025-10-15                   |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● JWT issuance with RS256 signature (Done)
● Refresh token rotation + reuse detection (Done)
● Session Store (Redis) deployed (Done)
● Token validation in API Gateway (Done)
● Active Sessions UI panel (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  190

PreOne ADR - Volume 4: Security Architecture v3.0
● Quarterly JWT secret rotation runbook (Scheduled)
AD R -075
Password Policy
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a password policy aligned with NIST SP 800-63B: minimum 8
characters, no composition rules, no forced rotation, mandatory breach-
corpus check (HIBP API), breached passwords rejected at registration and
rotation. Passwords are hashed with bcrypt (cost 12) at rest, with argon2id
available for high-risk principals.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on cryptography
standard update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The legacy platform enforces a password policy inherited from 2015: minimum
8 characters, at least one of each character class, forced rotation every 90 days,
and SHA-256 hashing with a per-user salt. The 2025 Q3 security review
identified this policy as both more burdensome and less secure than modern
guidance. NIST SP 800-63B (2017) explicitly recommends against composition
rules and forced rotation, citing evidence that they degrade security by
encouraging predictable patterns (e.g., Password1!, Password2!). The forced
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 191

PreOne ADR - Volume 4: Security Architecture v3.0
rotation in particular has produced a culture of incremented passwords
(Spring2024, Summer2024) that are trivially guessable. The ARB considered
four password policies. The first is the legacy policy (composition + rotation),
which is rejected as both burdensome and weak. The second is the NIST policy
verbatim (8+ chars, no composition, no rotation, breach check), which is
selected because it aligns with current guidance and reduces user burden. The
third is a stricter policy (12+ chars, breach check, no rotation), which is
rejected as unnecessarily burdensome without security benefit (NIST found no
meaningful security gain above 8 chars when breach check is enforced). The
fourth is passwordless (WebAuthn only), which is rejected as not yet feasible for
the full principal population. This ADR defines the password policy. It depends
on ADR-062 (Authentication) for the credential flow.
BUSINESS DRIVERS
The 2026 international expansion requires password policies aligned with each
regulatory regime: GDPR Article 32 recommends breach-corpus checking;
COPPA requires parental consent for password changes by minors; DPDP
requires audit logs of password changes. The NIST-aligned policy satisfies all
three. The business also requires a reduction in password-related support
tickets, which currently account for 35% of tier-1 support volume; the removal
of forced rotation alone is projected to reduce this by 20%. Finally, the business
requires that the policy be acceptable to the largest customers' security teams,
who have been briefed on the NIST guidance and have signalled acceptance.
PROBLEM STATEMENT
The legacy password policy (composition rules + 90-day rotation + SHA-256) is
both more burdensome and less secure than modern guidance. PreOne needs a
password policy aligned with NIST SP 800-63B: 8+ characters, no composition
rules, no forced rotation, mandatory breach-corpus check, and modern hashing
(bcrypt or argon2id).
CONSTRAINTS
● The policy must be acceptable to the largest customers' security teams,
several of whom have explicit NIST alignment requirements.
● The breach-corpus check must complete within 2 seconds p99 to avoid
registration friction.
● Password hashing must complete within 300ms p99 to avoid login
latency regression.
● The policy must support per-tenant strictness overrides (e.g., 12+
chars for high-security tenants) without breaking the baseline.
● The policy must not log or transmit plaintext passwords at any point in
the system.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 192

PreOne ADR  -  Volume 4: Security Architecture  v3.0
ASSUMPTIONS
● The Have I Been Pwned (HIBP) API or equivalent breach-corpus service
remains available with acceptable latency and rate limits.
● Bcrypt (cost 12) remains computationally infeasible to brute-force for
the planning horizon (5 years).
● Argon2id is available in the JVM's native crypto library for high-risk
principals.
● Principals will accept the removal of forced rotation once the rationale
is communicated (NIST guidance).
● The largest customers will accept the NIST-aligned policy without
contractual amendment.
OPTIONS CONSIDERED
| Option            | Pros                | Cons                | Verdict |
| ----------------- | ------------------- | ------------------- | ------- |
| NIST-aligned: 8+  | Aligns with         | Breach check        | Adopted |
| chars, no         | current NIST        | depends on HIBP     |         |
| composition, no   | guidance. Reduces   | API (external       |         |
| rotation, breach- | user burden.        | service). Bcrypt    |         |
| corpus check      | Breach check is     | adds 250ms to       |         |
| (HIBP), bcrypt    | the most effective  | every login. Some   |         |
| (cost 12).        | defence against     | customers will      |         |
|                   | credential          | initially perceive  |         |
|                   | stuffing. Bcrypt    | removal of          |         |
|                   | raises brute-force  | rotation as         |         |
|                   | cost 10,000x over   | weaker.             |         |
SHA-256.
| Legacy: 8+ chars,   | Familiar to        | NIST explicitly    | Rejected |
| ------------------- | ------------------ | ------------------ | -------- |
| composition rules,  | existing users.    | recommends         |          |
| 90-day rotation,    | Fast hashing       | against            |          |
| SHA-256 hashing.    | (SHA-256).         | composition and    |          |
|                     | Existing runbooks  | rotation. SHA-256  |          |
|                     | and tooling.       | is too fast        |          |
(vulnerable to
brute-force).
Incremented
passwords
(Spring2024) are
trivially guessable.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  193

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option            | Pros                 | Cons                | Verdict  |
| ----------------- | -------------------- | ------------------- | -------- |
| Stricter: 12+     | Stronger against     | NIST found no       | Rejected |
| chars, no         | offline brute-force  | meaningful          |          |
| composition, no   | (longer              | security gain       |          |
| rotation, breach  | passwords). Aligns   | above 8 chars       |          |
| check.            | with some            | when breach         |          |
|                   | customer             | check is enforced.  |          |
|                   | expectations.        | Additional user     |          |
burden. Several
large customers
would find 12-char
minimum
contractually
unacceptable.
| Passwordless:   | Strongest         | Not feasible for    | Rejected |
| --------------- | ----------------- | ------------------- | -------- |
| WebAuthn only,  | security. No      | the full principal  |          |
| no passwords.   | password          | population: many    |          |
|                 | breaches. No      | BYOD devices do     |          |
|                 | password support  | not support         |          |
|                 | tickets.          | WebAuthn. Kiosk     |          |
scenario is
incompatible.
Migration cost
prohibitive.
DECISION
ADOPTED
We will adopt the NIST SP 800-63B-aligned password policy. Minimum
length is 8 characters; no composition rules (special characters, character
classes) are enforced; no forced rotation is imposed. At registration and at
every password change, the password is checked against the HIBP breach
corpus (via the range-search API to avoid transmitting the plaintext
password); breached passwords are rejected with a clear error message.
Passwords are hashed with bcrypt at cost 12 (target 250ms hash time);
high-risk principals (administrators, PII-access) are migrated to argon2id
with memory parameter 64MB. Password changes require the current
password (re-authentication) and are audit-logged per ADR-086. Per-tenant
strictness overrides allow higher minimums (e.g., 12 chars).
DETAILED RATIONALE
The NIST-aligned policy is selected because it is the only option that
simultaneously improves security, reduces user burden, and aligns with
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  194

PreOne ADR - Volume 4: Security Architecture v3.0
current regulatory guidance. The legacy policy (composition + rotation) is
rejected on three grounds. First, NIST SP 800-63B explicitly recommends
against composition rules, citing evidence that they encourage predictable
patterns (Password1!, Spring2024) that are trivially guessable. Second, NIST
recommends against forced rotation, citing evidence that it encourages
incremented passwords and provides no security benefit in the absence of
suspected compromise. Third, SHA-256 hashing (even with a salt) is too fast for
modern hardware; bcrypt and argon2id are purpose-built slow hashes that
raise the cost of offline brute-force by 3-4 orders of magnitude. The stricter
policy (12+ chars) was rejected because NIST found no meaningful security
gain above 8 chars when breach-corpus checking is enforced; the marginal gain
does not justify the additional user burden. The passwordless option
(WebAuthn only) was rejected as not yet feasible for the full principal
population: many BYOD devices do not support WebAuthn, and the kiosk
scenario (where many principals share a terminal) is incompatible with device-
bound credentials. WebAuthn remains available as an MFA factor (per
ADR-072) and as a future passwordless option (per ADR-073 future evolution).
The breach-corpus check is implemented via the HIBP range-search API: the
client sends only the first 5 characters of the SHA-1 hash of the password, and
the server returns the list of breached hashes with that prefix; the client checks
the full hash locally. This avoids transmitting the plaintext password to a third
party. The check is performed at registration, at every password change, and
periodically (every 90 days) for existing passwords to detect newly-discovered
breaches. The bcrypt cost parameter (12) is calibrated to a 250ms hash time on
the production hardware, which is acceptable for login (one hash per login) and
prohibitive for offline brute-force (40 hashes/sec on commodity GPU).
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | PASSWORD POLICY
SUBSYSTEM | +-------------------------------------------------------------+ |
Registration / Password Change | | - min 8 chars, no
composition, no rotation | | - check HIBP range-search API
| +-------------------------------------------------------------+ | password (plaintext, never
logged) | v | | HIBP Client
| | GET https://api.pwnedpasswords.com/range/{5-char-prefix} | | -> filter
response by full SHA-1 hash |
+-------------------------------------------------------------+ | breached? (yes -> reject, no
-> proceed) | v | | Password Hasher
| | - bcrypt (cost 12) for standard principals | | - argon2id (64MB, 3
iters) for high-risk principals | +-------------------------------------------------------------+
| hashed password | v
| | Credential Store (PostgreSQL, principals.password_hash) |
+-------------------------------------------------------------+ | periodic re-check (every 90
days) | v | | Breach Re-check Job
(cron, per ADR-029) | +-------------------------------------------------------------+
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 195

PreOne ADR - Volume 4: Security Architecture v3.0
SEQUENCE DIAGRAM
Client -> Auth API: POST /auth/register {password} Auth API -> Policy
Validator: min 8 chars? no composition check Policy Validator -> Auth API: ok
Auth API -> HIBP Client: range-search(SHA-1(password)[:5]) HIBP Client ->
HIBP API: GET /range/{prefix} HIBP API -> HIBP Client: list of breached hashes
HIBP Client -> Auth API: breached? (no) Auth API -> Password Hasher:
bcrypt(password, cost=12) Password Hasher -> Auth API: hashed password
(~250ms) Auth API -> Credential Store: INSERT principals.password_hash Auth
API -> Audit Log: password_set event (per ADR-086) Auth API -> Client: 201
Created
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-075 — Password Policy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Login API | submit |
Password Service | | | | | new pwd| | | |
+----------------+ +----------+-----------+ | | |
| | | validate | | v
| | +----------------+ +----------------------+ | | | Policy Engine | check | Rules
(length, | | | | |------->| complexity, history, | | | | |
| breach DB) | | | +----------------+ +----------+-----------+ | |
| | | | pass? | |
v | | +----------------+ +----------------------+ | | | Identity Repo |
hash | Credential Store | | | | |------->| (bcrypt / argon2) |
| | +----------------+ +----------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Password Set/Change Flow: User -> Password Service: new password
Password Service -> Policy Engine: validate (length, complexity, history, breach
DB) (pass) Password Service -> Hasher: bcrypt / argon2 Password Service ->
Postgres: update credential Password Service -> Audit: log
'PASSWORD_CHANGED' Password Service -> Notification: send email
Password Reset Flow: User -> Reset API: email Reset API -> Token Service:
generate reset token (1hr expiry) Reset API -> Notification: send email with link
User -> Reset API: token + new password Reset API -> Policy Engine: validate
Reset API -> Postgres: update credential Reset API -> Audit: log
'PASSWORD_RESET'
DATABASE IMPACT
The principals table gains a column password_hash (TEXT, nullable for
federated principals who authenticate via OIDC/SAML) and a column
password_algo (ENUM: bcrypt, argon2id, nullable). A column
password_changed_at (TIMESTAMPTZ) supports the periodic breach re-check
(every 90 days). A column password_breached_at (TIMESTAMPTZ, nullable)
records the last breach detection, triggering forced rotation on next login. The
legacy SHA-256 hashes are migrated to bcrypt on next login (per the migration
plan below); the legacy column is dropped after migration. No new tables are
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 196

PreOne ADR - Volume 4: Security Architecture v3.0
required. The breach re-check job writes a row to audit_trail per principal
checked; the job is throttled to 100 principals per second to avoid HIBP rate
limits.
API IMPACT
The registration and password-change endpoints (POST /auth/register, POST
/auth/password/change) enforce the policy server-side; client-side validation is
advisory only. The password-change endpoint requires the current password
(re-authentication) and is rate-limited per ADR-080. A new endpoint POST
/auth/password/breach-status allows principals to check whether their current
password is in the breach corpus (for the self-service UI); this invokes the same
HIBP range-search. The HIBP API is accessed via a server-side proxy that
caches range-search responses for 7 days (breach data is append-only),
reducing external API calls by 90%. All endpoints audit-log password events per
ADR-086 without logging the plaintext password.
UI IMPACT
Password Policy surfaces in the UI as real-time validation on the 'Change
Password' form. As the user types a new password, the UI displays a strength
meter (weak / fair / strong) and checkmarks for each policy requirement (length
>= 12, uppercase, lowercase, number, symbol, not in breach database, not in
password history). The 'forgot password' flow sends a reset email with a 1-hour
expiry link. After a successful reset, the UI forces re-login on all devices
(session revocation). Password policy violations display specific feedback
('Password must contain at least one uppercase letter') rather than generic
'invalid password'.
SECURITY IMPACT
The NIST-aligned policy improves security on three dimensions. First, the
breach-corpus check rejects passwords that are present in known breach
corpora, which is the single most effective defence against credential-stuffing
(the 2024 attack against the legacy platform used a 4M-credential list, of which
87% would have been rejected by the breach check). Second, bcrypt (cost 12)
raises the offline brute-force cost by approximately 10,000x compared to
SHA-256, making stolen-hash attacks infeasible on commodity hardware.
Third, the removal of forced rotation eliminates the incremented-password
pattern (Spring2024, Summer2024), which is a leading cause of password
compromise in education platforms. The breach-corpus check is itself a privacy-
sensitive operation: the HIBP range-search API is used (not the full-hash API) to
avoid transmitting the plaintext password to a third party. The HIBP client is
implemented with a hard 2-second timeout; on timeout, the check is skipped
and a low-severity alert is raised (fail-open for usability, with monitoring).
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 197

PreOne ADR - Volume 4: Security Architecture v3.0
PERFORMANCE IMPACT
The bcrypt hash (cost 12) takes approximately 250ms on production hardware,
which is the dominant cost in the registration and password-change flows. This
is acceptable for these low-frequency operations. The login flow pays the same
250ms cost on every login, which is a regression from the legacy SHA-256
(~0.1ms); this is mitigated by a login-rate cache (per ADR-046) that caches the
principal's last 5 successful login hashes for 5 minutes, reducing the bcrypt cost
on rapid re-logins to a cache lookup. The HIBP range-search takes 200-800ms
(network round-trip), which is the dominant cost in registration; this is
mitigated by the 7-day cache, which gives a 95% cache-hit rate at steady state.
The periodic breach re-check job runs at off-peak hours and is throttled to avoid
HIBP rate limits.
SCALABILITY ANALYSIS
The password subsystem scales with the principal count, not the request rate
(bcrypt is amortised across logins). At 500K principals, the breach re-check job
processes ~5,500 principals per day (90-day cycle), which at 100 principals per
second completes in under 1 minute per day. The HIBP cache (Redis) stores
~1M range-search responses (one per 5-char prefix) at ~1KB each = 1GB, well
within Redis capacity. The bcrypt CPU cost on the login path is the binding
constraint: at 5,000 logins per second (projected peak), bcrypt at 250ms each
requires 1,250 CPU-seconds per second, or approximately 16 dedicated CPU
cores. This is provisioned as a separate bcrypt-worker pool (per ADR-042) to
avoid starving the request-handling threads. At the 5M-principal projection, the
bcrypt-worker pool scales linearly to 160 cores, which is within the datacentre
capacity.
OPERATIONAL CONSIDERATIONS
The password subsystem requires four operational artefacts. (1) A runbook for
HIBP API outage: the on-call engineer must verify that the fail-open behaviour
activates and that low-severity alerts are raised; sustained outage triggers
incident response per ADR-089. (2) A runbook for bcrypt-cost parameter
upgrade: as hardware improves, the cost parameter must be raised every 2-3
years; the upgrade is performed at next login (re-hash with new cost). (3) A
runbook for breach-corpus re-check: when a major breach is published, the
security team may trigger an immediate re-check of all principals; the runbook
covers the throttled execution. (4) A runbook for password-reset campaigns:
during incidents, the security team may force-reset all principals in a tenant;
the runbook covers the bulk-reset flow and the user-communication template.
Per-tenant policy overrides are propagated within 60 seconds via the
configuration service.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 198

PreOne ADR  -  Volume 4: Security Architecture  v3.0
RISKS
| Risk             | Likelihood | Impact | Mitigation           |
| ---------------- | ---------- | ------ | -------------------- |
| HIBP API outage  | Medium     | Medium | Fail-open with       |
| disables breach  |            |        | low-severity alert;  |
| check.           |            |        | 7-day cache          |
provides partial
coverage;
sustained outage
triggers incident
response.
| Bcrypt cost      | Medium | Medium | Cost parameter     |
| ---------------- | ------ | ------ | ------------------ |
| becomes          |        |        | raised every 2-3   |
| insufficient as  |        |        | years; re-hash at  |
| hardware         |        |        | next login;        |
| improves.        |        |        | monitor brute-     |
force cost trends.
| Principals         | Medium | Low | Communication       |
| ------------------ | ------ | --- | ------------------- |
| perceive the       |        |     | plan explaining     |
| removal of forced  |        |     | NIST guidance;      |
| rotation as a      |        |     | customer security-  |
| security           |        |     | team briefings; in- |
| regression.        |        |     | app messaging on    |
first login post-
migration.
| Argon2id memory   | Low | Medium | Argon2id runs on  |
| ----------------- | --- | ------ | ----------------- |
| parameter (64MB)  |     |        | dedicated worker  |
| causes OOM on     |     |        | pool; memory      |
| shared            |     |        | monitored; per-   |
| infrastructure.   |     |        | principal         |
throttling to avoid
spikes.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
NIST alignment satisfies regulatory and  Some customers will initially perceive
| customer requirements. |     | the removal of rotation as weaker. |     |
| ---------------------- | --- | ---------------------------------- | --- |
Breach-corpus check dramatically  Dependency on HIBP API (external
| reduces credential stuffing. |     | service). |     |
| ---------------------------- | --- | --------- | --- |
Bcrypt raises offline brute-force cost  250ms hash time on every login
| 10,000x. |     | (mitigated by login-rate cache). |     |
| -------- | --- | -------------------------------- | --- |
Removal of forced rotation reduces  Periodic breach re-check adds
| support tickets. |     | background job complexity. |     |
| ---------------- | --- | -------------------------- | --- |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  199

PreOne ADR - Volume 4: Security Architecture v3.0
REJECTED ALTERNATIVES
The legacy policy (composition + 90-day rotation + SHA-256) was rejected on
three grounds: NIST explicitly recommends against composition rules and
forced rotation, citing evidence that they degrade security; SHA-256 is too fast
for modern hardware, making stolen-hash attacks feasible; and the forced
rotation produces a culture of incremented passwords that are trivially
guessable. The stricter policy (12+ chars, no composition, no rotation, breach
check) was rejected because NIST found no meaningful security gain above 8
chars when breach-corpus checking is enforced; the marginal gain does not
justify the additional user burden, and several large customers have signalled
that 12-char minimums would be contractually unacceptable. The passwordless
option (WebAuthn only) was rejected as not yet feasible for the full principal
population: many BYOD devices do not support WebAuthn, the kiosk scenario is
incompatible with device-bound credentials, and the migration cost would be
prohibitive. WebAuthn remains available as an MFA factor (per ADR-072) and
is tracked as a future passwordless option (per ADR-073 future evolution). The
NIST-aligned policy is the only option that simultaneously improves security,
reduces user burden, and aligns with current regulatory guidance; the full
reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter alongside the authentication-stack
migration (per ADR-062). Phase 1 (weeks 1-3): deploy the password subsystem
(policy validator, HIBP client, bcrypt/argon2id hasher, breach re-check job) in
shadow mode (new passwords are hashed with the new policy but legacy
hashes remain in use). Phase 2 (weeks 4-6): enable the new policy for new
registrations and explicit password changes; legacy hashes are migrated to
bcrypt on next login (re-hash on successful authentication). Phase 3 (weeks 7-
9): enable the periodic breach re-check job; principals with breached
passwords are prompted to change on next login. Phase 4 (weeks 10-12):
remove the legacy SHA-256 column after all principals have logged in at least
once (verified by the password_changed_at column); this is a soft deadline,
after which the residual ~2% of inactive principals are force-reset. Phase 5
(week 13): the shadow-mode logging is removed. Rollback is possible at any
point by reverting to the legacy policy; the bcrypt hashes remain valid (the
legacy SHA-256 verifier accepts them as a fallback during the migration
window only).
TESTING STRATEGY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 200

PreOne ADR - Volume 4: Security Architecture v3.0
The password subsystem is tested at four levels. Unit tests cover the policy
validator (length, composition-allowed, breach-rejection), the HIBP client
(range-search, cache, fail-open), and the password hasher (bcrypt and argon2id
correctness, cost parameter). Coverage target is 95%. Integration tests cover
the registration, password-change, and login flows. End-to-end tests cover the
full registration -> breach-check -> bcrypt -> login path. Security tests cover
the plaintext-password non-logging invariant (verified by log inspection), the
HIBP fail-open behaviour, and the bcrypt-cost parameter enforcement.
Performance tests cover the bcrypt hash time (250ms ± 50ms) and the HIBP
range-search latency (under 2 seconds p99). The periodic breach re-check job
is tested with a synthetic breach corpus to verify throttling and notification. The
acceptance criterion is zero plaintext-password leakage incidents in the post-
cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Breach-rejection rate: target under 5% of
registrations, alert above 10% (possible credential-stuffing attack). (2) HIBP
API latency p99: target under 2 seconds, alert above 5 seconds (possible fail-
open). (3) HIBP cache hit ratio: target above 90%, alert below 80% (sizing
problem). (4) Bcrypt hash time p99: target 250ms ± 50ms, alert outside 100-
500ms (possible hardware issue or cost drift). (5) Breach re-check job
throughput: target 100 principals/sec, alert below 50 (possible HIBP rate-limit).
(6) Password-reset rate: target under 0.5% of principals per week, alert above
2% (possible incident). A dedicated password-policy dashboard surfaces these
alongside the per-tenant policy-override distribution, the bcrypt-cost
parameter, and the top breach-rejection reasons. Anomaly detection (per
ADR-088) flags unusual patterns such as a tenant-wide breach-rejection burst
(possible attack) or a single principal's password-change rate exceeding 5 per
day (possible abuse).
FUTURE EVOLUTION
The password subsystem is expected to evolve in three directions. First, the
system may migrate fully to argon2id (deprecating bcrypt) once the JVM's
native crypto library provides stable argon2id support; this is monitored but not
planned for v1 because of the migration cost (every principal must re-hash).
Second, the system may add passwordless authentication (WebAuthn-only) as
the default, with passwords as a fallback; this is a larger change and would
require its own ADR, and is tracked as a follow-up to ADR-073. Third, the
system may integrate with the FIDO2 passkey ecosystem to enable
synchronised passkeys across devices, reducing the friction of the password
reset flow; this is planned for v2 and is tracked as a follow-up. The trigger for
revisiting this ADR is a regulatory change (e.g., EU eIDAS 2.0 requiring
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 201

PreOne ADR - Volume 4: Security Architecture v3.0
passwordless for certain principal types) or a material change in the breach-
corpus landscape.
RELATED ADRS
● ADR-061 - Identity Model (provides principal record for password)
● ADR-062 - Authentication (invokes password verification)
● ADR-072 - MFA (password + MFA for step-up)
● ADR-077 - Encryption (passwords protected at rest by AES-256-GCM
via KMS envelope)
● ADR-080 - Rate Limiting (password-change endpoint rate-limited)
● ADR-086 - Audit Trail (password events audit-logged)
● ADR-088 - Security Monitoring (breach-rejection anomalies detected)
REFERENCES
● NIST SP 800-63B - Digital Identity Guidelines: Authentication and
Lifecycle Management. NIST. 2017.
● Have I Been Pwned - Pwned Passwords API. HIBP. 2024.
● Provos, N. and Mazieres, D. - A Future-Adaptable Password Scheme.
USENIX. 1999.
● Argon2 - The Winner of the Password Hashing Competition. Biryukov et
al. 2015.
● PreOne Engineering Handbook, Section 4.15 - Password Policy.
Internal. 2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-01 Draft Platform Security Initial draft;
Architect options
enumerated;
consultation with
security and
engineering teams
2025-09-17 Proposed Platform Security Submitted to
Architect Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 202

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status   | Actor     | Notes          |
| ---------- | -------- | --------- | -------------- |
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect  |     |
| ----------- | --- | ---------------------------- | --- |
| Tech Lead   |     | Authentication Platform Lead |     |
| ARB Chair   |     | Architecture Review Board    |     |
| Approved On |     | 2025-10-15                   |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Password Policy Engine implemented (Done)
● bcrypt hashing (cost factor 12) (Done)
● Password history (last 12 passwords) (Done)
● Breach database check (Have I Been Pwned API) (Done)
● Forgot-password flow with 1-hour token (Done)
● Quarterly password-policy review (Scheduled)
AD R -076
API Security
Volume 4 — Security Architecture  -  Identity & Security
ACCEPTED
DECISION SUMMARY
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  203

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
Adopt a layered API security model: mutual TLS (mTLS) for service-to-
service communication within the cluster, JWT (RS256) for user-facing API
requests, OAuth 2.1 scope checks at the gateway, and per-endpoint
authorisation via the Effective Permission Resolver (ADR-067). All external
API traffic terminates at the API gateway, which enforces TLS 1.3, rate
limits, and security headers.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The PreOne platform exposes three categories of API surface. The first is user-
facing APIs: REST endpoints called by the web frontend, the mobile app, and
third-party integrations over the public internet. The second is service-to-
service APIs: internal gRPC and REST calls between microservices within the
Kubernetes cluster. The third is platform-operator APIs: administrative
endpoints used by the support and operations teams, accessed via a bastion or
VPN. The legacy platform treats all three categories uniformly: HTTPS with
bearer JWTs, with no mTLS for internal calls and no scope checks at the
gateway. The 2025 Q3 security review identified three gaps. First, internal
service-to-service calls are authenticated only by network position (any pod in
the cluster can call any other pod), which violates the principle of least privilege
and was exploited in the 2024 Redis-escalation incident. Second, user-facing
JWTs are not scope-checked at the gateway, so a compromised JWT with one
scope can probe endpoints that require another scope. Third, platform-operator
APIs are exposed on the same gateway as user-facing APIs, increasing the
attack surface. The ARB considered four API security models. The first is the
legacy model (uniform HTTPS + JWT), which is rejected for the reasons above.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 204

PreOne ADR - Volume 4: Security Architecture v3.0
The second is mTLS everywhere (including user-facing), which is rejected as
incompatible with browser and mobile clients. The third is the layered model
selected here. The fourth is a service mesh (Istio) with sidecar-based mTLS,
which is rejected as operationally heavy for PreOne's current scale but tracked
as a future evolution.
BUSINESS DRIVERS
The 2026 international expansion requires API security aligned with each
regulatory regime: GDPR Article 32 recommends mTLS for service-to-service
PII flows; DPDP requires audit logs of every API access to PII; COPPA requires
parental-consent scope checks for minor-related endpoints. The layered model
satisfies all three. The business also requires that the API gateway enforce rate
limits and security headers uniformly (per ADR-080 and ADR-081), which is
only possible if all traffic terminates at the gateway. Finally, the business
requires that platform-operator APIs be isolated from user-facing traffic, to
reduce the attack surface and to support per-endpoint audit and break-glass
procedures.
PROBLEM STATEMENT
The legacy API security model (uniform HTTPS + JWT, no mTLS for internal, no
gateway scope checks) violates least privilege, was exploited in the 2024 Redis-
escalation incident, and cannot satisfy the regulatory requirements of the 2026
expansion. PreOne needs a layered API security model: mTLS for service-to-
service, JWT + scope checks for user-facing, isolated platform-operator APIs,
and a gateway that enforces TLS, rate limits, and headers.
CONSTRAINTS
● The model must remain compatible with browser and mobile clients,
which cannot present client certificates for user-facing traffic.
● mTLS certificates must be issued and rotated automatically (per
ADR-078) to avoid operational burden.
● Scope checks at the gateway must complete within 5ms p99 to avoid
adding latency.
● Platform-operator APIs must be accessible only via bastion or VPN,
never via the public gateway.
● The model must support per-tenant scope overrides (e.g., a tenant may
restrict access to certain scopes to specific IP ranges).
● All API traffic must be audit-logged per ADR-086.
ASSUMPTIONS
● The Kubernetes cluster provides a stable Certificate Authority (cert-
manager) for mTLS certificate issuance.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 205

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● The API gateway (per ADR-091) supports OAuth 2.1 scope checks via
JWT introspection or local JWT verification.
● The OAuth 2.1 scopes are designed in ADR-068 (Scope Model); this
ADR consumes them.
● Service-to-service calls are always within the cluster; external
integrations use the user-facing gateway with API keys (per ADR-069).
● Platform-operator APIs are accessed only via the bastion (per ADR-024)
or the corporate VPN.
OPTIONS CONSIDERED
| Option             | Pros               | Cons              | Verdict |
| ------------------ | ------------------ | ----------------- | ------- |
| Layered: mTLS      | Defence in depth.  | Three             | Adopted |
| internal +         | Closes the         | enforcement       |         |
| JWT+scope user-    | network-position   | points (gateway,  |         |
| facing + isolated  | gap. Compatible    | mTLS, permission  |         |
| operator APIs +    | with browsers.     | resolver) add     |         |
| gateway            | Isolates operator  | complexity. cert- |         |
| enforcement.       | APIs. Aligns with  | manager           |         |
|                    | GDPR/DPDP/COPP     | dependency.       |         |
|                    | A.                 | Operational       |         |
burden of mTLS
rotation.
| Legacy: uniform   | Simple. Single  | Network-position-   | Rejected |
| ----------------- | --------------- | ------------------- | -------- |
| HTTPS + JWT, no   | enforcement     | based service auth  |          |
| mTLS, no gateway  | point. No cert- | violates least      |          |
| scope checks.     | manager         | privilege.          |          |
|                   | dependency.     | Exploited in 2024   |          |
Redis incident.
Cannot satisfy
GDPR/DPDP
mTLS
recommendations.
mTLS everywhere  Strongest service  Browsers cannot  Rejected
| including user- | identity. Uniform  | easily present        |     |
| --------------- | ------------------ | --------------------- | --- |
| facing traffic. | model. No JWT      | client certificates.  |     |
|                 | scope-check        | Mobile clients        |     |
|                 | complexity.        | require certificate   |     |
provisioning.
Kiosks are
incompatible.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  206

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option         | Pros               | Cons                 | Verdict  |
| -------------- | ------------------ | -------------------- | -------- |
| Service mesh   | Uniform mTLS       | Sidecar overhead     | Rejected |
| (Istio) with   | without            | (~10%                |          |
| sidecar-based  | application        | CPU/memory per       |          |
| mTLS.          | changes. Sidecar   | pod). Control-       |          |
|                | handles rotation.  | plane complexity.    |          |
|                | Rich traffic       | Istio expertise not  |          |
|                | management.        | available in         |          |
current team. Not
justified at 12-
microservice
scale.
DECISION
ADOPTED
We will adopt a layered API security model. Service-to-service calls within
the Kubernetes cluster use mTLS with certificates issued by cert-manager
(per ADR-078); each service presents a client certificate and verifies the
server certificate, with service identity encoded in the certificate's SPIFFE
ID. User-facing API requests terminate at the API gateway, which enforces
TLS 1.3 (per ADR-077), rate limits (per ADR-080), and security headers (per
ADR-081), and verifies the JWT signature and scopes (per ADR-068) before
forwarding to the backend service. Per-endpoint authorisation is enforced
by the Effective Permission Resolver (per ADR-067). Platform-operator APIs
are exposed on a separate gateway accessible only via bastion or VPN, with
mandatory   MFA   (per   ADR-072)   and   break-glass   audit   logging   (per
ADR-086).
DETAILED RATIONALE
The layered model is selected because it is the only option that simultaneously
satisfies the security, compatibility, and operational requirements. The legacy
model (uniform HTTPS + JWT) is rejected because it relies on network position
for service-to-service authentication, which violates least privilege: any pod in
the cluster can call any other pod, and a single compromised pod can escalate
privileges   across   the   platform.   The   2024   Redis-escalation   incident
demonstrated this: an attacker who compromised a low-privilege pod used it to
call the Redis admin API, which was reachable because the network policy
allowed it. mTLS for service-to-service closes this gap by requiring each service
to present a client certificate, with service identity verified at the target.  mTLS
everywhere (including user-facing) was rejected because browser and mobile
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  207

PreOne ADR - Volume 4: Security Architecture v3.0
clients cannot easily present client certificates; user-installed certificates are
operationally burdensome and are not supported by all browsers. The layered
model uses mTLS where it is operationally feasible (service-to-service) and JWT
+ scope checks where it is not (user-facing). The service mesh option (Istio
with sidecar-based mTLS) was rejected as operationally heavy for PreOne's
current scale (12 microservices, ~50 pods): the sidecar overhead (~10% CPU
and memory per pod) and the control-plane complexity are not justified at this
scale. The layered model achieves the same security properties with cert-
manager-issued certificates and application-level mTLS, which is simpler to
operate. The service mesh is tracked as a future evolution if the microservice
count exceeds 30 or if the platform adopts multi-cluster deployment. Scope
checks at the gateway are enforced via local JWT verification (the gateway
verifies the JWT signature and extracts the scopes claim), which is O(1) and
adds ~1ms latency. Per-endpoint authorisation is enforced by the Effective
Permission Resolver (ADR-067) in the backend service, which checks the
principal's effective permissions against the resource's tenancy and ownership.
The gateway scope check is a coarse filter (does the principal have the scope at
all?); the backend permission check is the fine filter (does the principal have
permission on this specific resource?). Both are required for defence in depth.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | API SECURITY LAYERS
| +-------------------------------------------------------------+ | EXTERNAL (user-facing)
| | Browser/Mobile/Integration | | | HTTPS (TLS 1.3) +
JWT (RS256) | | v | | API
Gateway (per ADR-091) | | - TLS termination
| | - JWT verify + scope check (ADR-068) | | - Rate limit
(ADR-080) + Headers (ADR-081) | | - Audit log (ADR-086)
| +-------------------------------------------------------------+ | INTERNAL (service-to-service)
| | Microservice A -> Microservice B | | | mTLS (cert-manager,
SPIFFE ID) | | v | | Backend
service verifies client cert + SPIFFE ID |
+-------------------------------------------------------------+ | OPERATOR (platform-ops)
| | Bastion/VPN -> Operator Gateway | | | HTTPS + JWT +
MFA (ADR-072) | | v | |
Operator APIs (separate from user-facing gateway) | | - Break-glass audit
logging | +-------------------------------------------------------------+
SEQUENCE DIAGRAM
Browser -> API Gateway: GET /resource (Authorization: Bearer JWT) API
Gateway -> JWT Verifier: verify signature (RS256) JWT Verifier -> API Gateway:
valid + scopes=[read:resource] API Gateway -> Scope Checker: scope check
(read:resource required?) Scope Checker -> API Gateway: pass API Gateway ->
Backend: GET /resource (JWT forwarded) Backend -> Permission Resolver:
principal has perm on resource? Permission Resolver -> Backend: yes Backend
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 208

PreOne ADR - Volume 4: Security Architecture v3.0
-> API Gateway: 200 OK {resource} API Gateway -> Browser: 200 OK
{resource} API Gateway -> Audit Log: API access event (per ADR-086)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-076 — API Security -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Client | call | API
Gateway | | | | |------->| (auth + rate limit) | | |
+----------------+ +----------+-----------+ | | |
| | | verify | | v
| | +----------------+ +----------------------+ | | | JWT Validator | check | Token
(ADR-070) | | | | |------->| | | | +----------------+
+----------+-----------+ | | | | |
| scope check | | v | | +----------------+
+----------------------+ | | | Rate Limiter | per | Redis (sliding | | | |
| key | window) | | | +----------------+ +----------------------+ | |
| | WAF (ADR-084) + Shield (ADR-085) at edge for DDoS defense |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
API Request Flow: Client -> API Gateway: HTTPS request + Bearer token API
Gateway -> Rate Limiter: check (per user + per IP) (exceed) API Gateway ->
Client: 429 + Retry-After API Gateway -> Token Validator: verify JWT (invalid)
API Gateway -> Client: 401 API Gateway -> Authorization Service: check scope
(deny) API Gateway -> Client: 403 API Gateway -> App Service: forward
request App Service -> API Gateway: response API Gateway -> Audit: log
'API_CALL' API Gateway -> Client: response
DATABASE IMPACT
No new tables are introduced. The mTLS certificate inventory is stored in cert-
manager's etcd backend (per ADR-078), not in the application database. The
scope assignments are stored in the oauth_scopes table (per ADR-068). Audit
logs of API access are written to audit_trail per ADR-086. The operator-API
gateway maintains a separate audit log (operator_audit_trail) for break-glass
events, with longer retention (7 years per ADR-053) to satisfy regulatory
requirements. The cert-manager certificate-rotation events are logged to the
operational event log (per ADR-088). No schema changes are required beyond
the tables already defined in ADR-068 and ADR-086.
API IMPACT
The API gateway (per ADR-091) is the single entry point for all user-facing
traffic; no backend service is directly reachable from the public internet. The
gateway enforces TLS 1.3 (per ADR-077), rate limits (per ADR-080), security
headers (per ADR-081), and JWT verification with scope checks. Service-to-
service calls use mTLS via Spring's WebClient with X.509 configuration; the
SPIFFE ID is extracted from the client certificate and used for service
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 209

PreOne ADR - Volume 4: Security Architecture v3.0
identification. The operator-API gateway is a separate Spring Cloud Gateway
instance with a separate DNS name (operator.preone.example), accessible only
via the bastion (per ADR-024) or the corporate VPN. Operator-API requests
require a JWT with operator scopes and an MFA-verified session (per ADR-072).
All API responses include the standard security headers (per ADR-081) and the
Correlation-Id header for tracing (per ADR-047).
UI IMPACT
API Security is largely invisible to end users — they benefit from secure APIs
without seeing the controls. For developers, the API documentation
(developers.preone.com) includes authentication guides (Bearer token, OAuth
2.0 client credentials), rate-limit headers (X-RateLimit-Limit, X-RateLimit-
Remaining), and error response formats (401 unauthorized, 403 forbidden, 429
too many requests). The admin UI includes an 'API Keys' management page
where admins can create, rotate, and revoke API keys for third-party
integrations, with per-key rate limits and scopes. API key usage is logged for
audit.
SECURITY IMPACT
The layered model raises the API security floor on three dimensions. First,
mTLS for service-to-service eliminates the network-position-based
authentication that was exploited in the 2024 Redis-escalation incident; a
compromised pod can no longer call any other pod without a valid client
certificate. Second, gateway scope checks prevent the scope-confusion attack
where a JWT with one scope probes endpoints requiring another scope; the
gateway rejects the request before it reaches the backend. Third, the isolation
of operator APIs on a separate gateway (accessible only via bastion or VPN)
reduces the public attack surface by an estimated 40% (the operator endpoints
are no longer reachable from the public internet). The mTLS certificates are
rotated automatically every 24 hours by cert-manager (per ADR-078), which
limits the value of a stolen certificate. The SPIFFE ID in the certificate provides
non-repudiation for service-to-service calls: each call can be attributed to a
specific service instance.
PERFORMANCE IMPACT
The gateway JWT verification adds 1-2ms p99 to every user-facing request
(dominated by the RS256 signature verification). The scope check is O(1) (set
membership) and adds negligible latency. The mTLS handshake for service-to-
service calls adds 5-10ms on the first call (handshake) and 0ms on subsequent
calls (session resumption); the cert-manager rotation does not affect
performance because the rotated certificate is hot-swapped without breaking
the connection. The operator-API gateway has the same overhead as the user-
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 210

PreOne ADR - Volume 4: Security Architecture v3.0
facing gateway plus the MFA verification overhead (per ADR-072, ~5ms for the
MFA claim check). Total API-security overhead on the hot path: ~3ms p99 for
user-facing, ~5ms p99 for service-to-service (first call), well within the 100ms
p99 API budget. The gateway is deployed in HA (3 replicas) and scales
horizontally behind a load balancer.
SCALABILITY ANALYSIS
The API gateway scales horizontally with the request rate; at 5,000 requests
per second (projected peak), 3 gateway replicas (each handling 2,000 RPS)
provide headroom. The JWT verification is CPU-bound (RS256 signature) and
benefits from vertical scaling within each replica. The mTLS for service-to-
service is bounded by the pod count (~50 pods, ~200 service-to-service calls
per second); the cert-manager rotation (every 24 hours) is a background
operation that does not affect request handling. The operator-API gateway is
low-traffic (a few requests per minute) and does not require scaling. The audit-
log write (per ADR-086) is asynchronous (queued in Redis, flushed to
PostgreSQL in batches) and does not affect request latency. At the 5M-principal
projection, the API gateway scales to 15 replicas, which is within the
Kubernetes cluster capacity; no architectural change is anticipated.
OPERATIONAL CONSIDERATIONS
The API security subsystem requires five operational artefacts. (1) A runbook
for mTLS certificate-rotation failure: cert-manager should rotate automatically,
but if rotation fails, the on-call engineer must manually issue a certificate
before the old one expires (24-hour window). (2) A runbook for gateway scope-
check policy changes: scope assignments are propagated within 60 seconds via
the configuration service; the runbook covers verification. (3) A runbook for
operator-API break-glass access: the runbook covers the MFA step-up, the
audit logging, and the post-access review. (4) A runbook for gateway rate-limit
tuning: per-tenant rate limits are reviewed monthly. (5) A runbook for cert-
manager CA rotation: the cluster CA is rotated annually; the runbook covers the
zero-downtime rotation. The mTLS certificate inventory is monitored; any
certificate within 12 hours of expiry triggers a high-severity alert.
RISKS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 211

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk              | Likelihood | Impact | Mitigation        |
| ----------------- | ---------- | ------ | ----------------- |
| cert-manager      | Medium     | High   | 24-hour rotation  |
| outage stops      |            |        | window provides   |
| mTLS certificate  |            |        | buffer; cert-     |
| rotation.         |            |        | manager is HA;    |
manual issuance
runbook; alerting
on rotation failure.
| Gateway scope-      | Low | High | Scope                |
| ------------------- | --- | ---- | -------------------- |
| check policy drift  |     |      | assignments are      |
| allows scope-       |     |      | version-controlled;  |
| confusion attacks.  |     |      | quarterly audit;     |
automated
conformance test
on every
deployment.
| Operator-API   | Low | High | Network policy is    |
| -------------- | --- | ---- | -------------------- |
| isolation is   |     |      | verified by a daily  |
| bypassed by    |     |      | conformance test;    |
| misconfigured  |     |      | alert on violation;  |
| firewall.      |     |      | quarterly red-       |
team verification.
| JWT verification   | Medium | Medium | Dual-key overlap  |
| ------------------ | ------ | ------ | ----------------- |
| key rotation (per  |        |        | during rotation;  |
| ADR-070) causes    |        |        | canary            |
| brief              |        |        | verification;     |
| authentication     |        |        | rollback path     |
| failures.          |        |        | documented.       |
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
mTLS eliminates network-position- cert-manager dependency and rotation
| based service auth. |     | operational burden. |     |
| ------------------- | --- | ------------------- | --- |
Gateway scope checks prevent scope- 1-2ms p99 added to every user-facing
| confusion attacks. |     | request. |     |
| ------------------ | --- | -------- | --- |
Operator-API isolation reduces public  Separate gateway and DNS increase
| attack surface. |     | operational complexity. |     |
| --------------- | --- | ----------------------- | --- |
Per-endpoint permission resolver  Permission-check latency added to
| provides fine-grained auth. |     | every backend call. |     |
| --------------------------- | --- | ------------------- | --- |
REJECTED ALTERNATIVES
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  212

PreOne ADR - Volume 4: Security Architecture v3.0
The legacy model (uniform HTTPS + JWT, no mTLS, no gateway scope checks)
was rejected because it relies on network position for service-to-service
authentication, which violates least privilege and was exploited in the 2024
Redis-escalation incident. mTLS everywhere (including user-facing) was
rejected because browser and mobile clients cannot easily present client
certificates; user-installed certificates are operationally burdensome
(especially on shared kiosk devices) and are not supported by all browsers. The
service mesh option (Istio with sidecar-based mTLS) was rejected as
operationally heavy for PreOne's current scale (12 microservices, ~50 pods):
the sidecar overhead (~10% CPU and memory per pod) and the control-plane
complexity are not justified at this scale, and the Istio expertise required is not
available in the current team. The service mesh is tracked as a future evolution
if the microservice count exceeds 30 or if the platform adopts multi-cluster
deployment. API-key-only authentication (no JWT) was rejected because API
keys do not provide fine-grained scopes and are difficult to revoke. The layered
model is the only option that satisfies all requirements; the full reasoning is
captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter alongside the authentication-stack
migration (per ADR-062). Phase 1 (weeks 1-3): deploy the API gateway (per
ADR-091) with TLS termination and JWT verification; backend services
continue to receive direct traffic during this phase. Phase 2 (weeks 4-6): deploy
cert-manager and issue mTLS certificates to all backend services; service-to-
service calls are migrated to mTLS in a canary pattern (10% per day). Phase 3
(weeks 7-9): enable gateway scope checks for all user-facing endpoints; the
legacy direct-traffic path is decommissioned. Phase 4 (weeks 10-12): deploy the
operator-API gateway on a separate DNS; migrate operator endpoints from the
user-facing gateway to the operator gateway. Phase 5 (week 13): the shadow-
mode logging is removed; the legacy network policies that allowed pod-to-pod
traffic without mTLS are tightened. Rollback is possible at any point by
reverting to the legacy model; the cert-manager certificates remain in place but
mTLS is not enforced (the services accept both mTLS and plaintext during the
migration window only).
TESTING STRATEGY
The API security subsystem is tested at four levels. Unit tests cover the JWT
verifier (signature correctness, scope extraction), the mTLS handshake
(certificate validation, SPIFFE ID extraction), and the scope checker (set
membership, policy evaluation). Coverage target is 95%. Integration tests
cover the gateway-to-backend flow, the service-to-service mTLS flow, and the
operator-API MFA flow. End-to-end tests cover the full request path from
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 213

PreOne ADR - Volume 4: Security Architecture v3.0
browser to backend. Security tests cover the scope-confusion attack (must be
rejected), the network-position-based service call (must be rejected without
mTLS), and the operator-API direct-access attempt (must be rejected at the
firewall). Performance tests cover the gateway JWT verification at projected
peak (5,000 RPS). The mTLS certificate rotation is tested with a synthetic cert-
manager outage. The acceptance criterion is zero API-auth bypass incidents in
the post-cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Gateway JWT verification latency p99:
target under 2ms, alert above 5ms. (2) Gateway scope-check rejection rate:
target under 0.5% of requests, alert above 2% (possible attack or
misconfiguration). (3) mTLS handshake failure rate: target 0, alert above 0.1%
(possible cert-manager issue). (4) cert-manager certificate-rotation lead time:
target over 12 hours, alert below 6 hours (possible rotation failure). (5)
Operator-API MFA step-up rate: target 100% (every operator request must be
MFA-verified), alert below 100%. (6) Gateway rate-limit hit rate: target under
1% of requests, alert above 5% (possible attack or misconfiguration). A
dedicated API-security dashboard surfaces these alongside the per-tenant
scope distribution, the mTLS certificate inventory, and the top rejection
reasons. Anomaly detection (per ADR-088) flags unusual patterns such as a
tenant-wide scope-check rejection burst (possible attack) or a service-to-service
call pattern change (possible compromise).
FUTURE EVOLUTION
The API security subsystem is expected to evolve in three directions. First, the
system may adopt a service mesh (Istio or Linkerd) for sidecar-based mTLS,
which would simplify certificate management and provide uniform
observability; this is monitored but not planned for v1 because of the
operational overhead. Second, the system may add OAuth 2.1 token exchange
(RFC 8693) for service-to-service flows that propagate user context, reducing
the need for service accounts; this is planned for v2. Third, the system may
integrate with the SPIFFE/SPIRE ecosystem for federated service identity
across clusters, supporting the multi-cluster deployment planned for the 2027
horizon. The trigger for revisiting this ADR is the microservice count exceeding
30, the adoption of multi-cluster deployment, or a regulatory change requiring
formal service-identity attestation.
RELATED ADRS
● ADR-062 - Authentication (issues JWTs verified by the gateway)
● ADR-067 - Effective Permission Resolver (per-endpoint authz)
● ADR-068 - Scope Model (defines OAuth 2.1 scopes)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 214

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● ADR-070 - JWT Policy (defines JWT format and signing keys)
● ADR-072 - MFA (required for operator APIs)
● ADR-078 - Secrets Management (mTLS certificate issuance via cert-
manager)
● ADR-091 - REST Standards (defines the API gateway)
REFERENCES
● RFC 8705 - OAuth 2.0 Mutual-TLS Client Authentication. IETF. 2020.
● SPIFFE - SPIFFE Identity Framework. CNCF. 2024.
● NIST SP 800-204 - Security Strategies for Microservices. NIST. 2020.
● OWASP - API Security Top 10. OWASP. 2023.
● PreOne Engineering Handbook, Section 4.16 - API Security. Internal.
2025.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect |     | Platform Security Architect  |     |
| --------- | --- | ---------------------------- | --- |
| Tech Lead |     | Authentication Platform Lead |     |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  215

PreOne ADR - Volume 4: Security Architecture v3.0
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● API Gateway auth + rate limit configured (Done)
● OAuth 2.0 client credentials for integrations (Done)
● API key management UI (Done)
● Rate limit headers in API responses (Done)
● API documentation with auth guides (Done)
● Quarterly API key rotation review (Scheduled)
AD R -077
Encryption
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt AES-256-GCM for data at rest, TLS 1.3 for data in transit, and
envelope encryption via AWS KMS for data keys. Data keys are generated
per-object (not per-tenant) and are wrapped by tenant-specific KMS
customer master keys (CMKs). Key rotation is annual with automatic re-
encryption of new writes; legacy data is re-encrypted lazily on read.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 216

PreOne ADR - Volume 4: Security Architecture v3.0
Review Cadence Annual review, or on security
incident, or on cryptography
standard update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The PreOne platform stores sensitive data at rest (student PII, assessment
responses, financial records) and transmits it over networks (between browser
and gateway, between microservices, between platform and integration
partners). The 2025 Q3 security review found that the legacy platform uses
AES-128-CBC for data at rest with a single static key stored in a configuration
file, and TLS 1.2 for data in transit with cipher suites that include several
deprecated ones. The review identified three gaps. First, AES-128-CBC without
authenticated encryption is vulnerable to padding-oracle attacks. Second, the
single static key means a key compromise exposes all data, and there is no
rotation procedure. Third, the deprecated TLS 1.2 cipher suites are vulnerable
to known attacks (BEAST, CRIME, POODLE). The ARB considered four
encryption strategies. The first is the legacy strategy (AES-128-CBC + static
key + TLS 1.2), which is rejected for the reasons above. The second is AES-256-
GCM + envelope encryption + TLS 1.3, which is selected. The third is field-level
encryption with application-managed keys (no KMS), which is rejected as
operationally heavy and lacking key rotation. The fourth is homomorphic
encryption for PII, which is rejected as not yet performant enough for
production use. This ADR defines encryption. It depends on ADR-078 (Secrets
Management) for key storage and ADR-079 (PII Protection) for field-level
encryption policy.
BUSINESS DRIVERS
The 2026 international expansion requires encryption aligned with each
regulatory regime: GDPR Article 32 mandates appropriate technical measures
including encryption; DPDP Section 17 mandates encryption of sensitive
personal data; COPPA does not mandate encryption but parental-consent
expectations effectively require it. The selected strategy satisfies all three. The
business also requires that key compromise not expose all data, which drives
the per-object data key design. Finally, the business requires that key rotation
be operational (not a flag-day re-encryption), which drives the annual rotation
with lazy re-encryption of legacy data.
PROBLEM STATEMENT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 217

PreOne ADR - Volume 4: Security Architecture v3.0
The legacy encryption strategy (AES-128-CBC + static key + TLS 1.2) is
vulnerable to padding-oracle attacks, exposes all data on a single key
compromise, and uses deprecated cipher suites. PreOne needs an encryption
strategy that uses AES-256-GCM at rest, TLS 1.3 in transit, and envelope
encryption via KMS with per-object data keys and annual rotation.
CONSTRAINTS
● Encryption must not add more than 5ms p99 to read/write latency.
● Key compromise must not expose more than one object's data (per-
object data keys).
● Key rotation must be operational (no flag-day re-encryption); legacy
data is re-encrypted lazily on read.
● The KMS CMK inventory must support per-tenant keys for data-
residency isolation.
● TLS 1.3 must be the minimum version for all external traffic; TLS 1.2 is
allowed only for legacy integration partners with an explicit exception.
ASSUMPTIONS
● AWS KMS (per ADR-078) provides sufficient throughput for the
projected encryption rate (5,000 ops/sec).
● AES-256-GCM is available in the JVM's native crypto library
(BouncyCastle or JCA).
● TLS 1.3 is supported by all modern browsers and mobile clients; the
legacy integration partners with TLS 1.2-only support are bounded
(under 5% of traffic).
● Per-object data keys (rather than per-tenant) provide acceptable
performance because data keys are cached in memory for 5 minutes
after unwrap.
● The annual CMK rotation is automated by AWS KMS and does not
require manual intervention.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 218

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option            | Pros              | Cons               | Verdict |
| ----------------- | ----------------- | ------------------ | ------- |
| AES-256-GCM +     | Authenticated     | KMS call on every  | Adopted |
| envelope          | encryption (no    | write (~50ms       |         |
| encryption via    | padding oracle).  | p99). AWS KMS      |         |
| KMS (per-object   | Per-object DEK    | dependency.        |         |
| DEKs, per-tenant  | limits key-       | Operational        |         |
| CMKs) + TLS 1.3.  | compromise        | burden of CMK      |         |
|                   | exposure. Per-    | inventory          |         |
|                   | tenant CMKs       | management.        |         |
enable
cryptographic
erasure. Annual
rotation is
automated.
| Legacy: AES-128-  | Fast (no KMS       | Vulnerable to       | Rejected |
| ----------------- | ------------------ | ------------------- | -------- |
| CBC + static key  | call). No KMS      | padding-oracle      |          |
| + TLS 1.2.        | dependency.        | attacks. Single     |          |
|                   | Simple             | static key exposes  |          |
|                   | operational model. | all data on         |          |
compromise. No
rotation
procedure.
Deprecated TLS
1.2 cipher suites.
| Field-level       | No AWS KMS          | Application lacks  | Rejected |
| ----------------- | ------------------- | ------------------ | -------- |
| encryption with   | dependency. Full    | expertise and      |          |
| application-      | control over keys.  | physical security  |          |
| managed keys (no  | No KMS rate         | to manage keys.    |          |
| KMS).             | limits.             | No automatic       |          |
rotation. 2024
Redis-escalation
incident
demonstrated
mishandling of
application-
managed secrets.
| Homomorphic         | Enables            | 100-1000x latency  | Rejected |
| ------------------- | ------------------ | ------------------ | -------- |
| encryption for PII. | computation on     | overhead. Not      |          |
|                     | ciphertext.        | performant         |          |
|                     | Strongest privacy  | enough for         |          |
|                     | guarantee. No      | interactive        |          |
|                     | decryption needed  | education          |          |
|                     | for processing.    | platform.          |          |
Immature
ecosystem.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  219

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
ADOPTED
We will adopt AES-256-GCM for data at rest, TLS 1.3 for data in transit, and
envelope encryption via AWS KMS for data keys. Each encrypted object has
a unique data key generated by KMS GenerateDataKey; the plaintext data
key encrypts the object with AES-256-GCM, and the wrapped data key
(encrypted by the tenant's CMK) is stored alongside the object. The CMK is
rotated annually by AWS KMS (automatic key rotation); new writes use the
latest CMK version, and legacy data is re-encrypted lazily on read (the
wrapped data key is unwrapped, re-wrapped with the latest CMK, and the
object is re-encrypted). TLS 1.3 is enforced at the API gateway (per
ADR-076) with a curated cipher suite; legacy TLS 1.2 integration partners
require an explicit exception.
DETAILED RATIONALE
The selected strategy is the only one that simultaneously satisfies the security,
performance, and operational requirements. The legacy strategy (AES-128-
CBC + static key + TLS 1.2) is rejected on three grounds. First, AES-128-CBC
without authenticated encryption is vulnerable to padding-oracle attacks,
which have been exploited in real-world incidents (POODLE, Lucky 13).
Second, the single static key means a key compromise exposes all data, and
there is no rotation procedure; the key has not been rotated in 4 years. Third,
the deprecated TLS 1.2 cipher suites include several that are vulnerable to
known attacks (BEAST, CRIME, POODLE), and the 2026 international
expansion requires TLS 1.3 as a contractual obligation in several target
markets. Field-level encryption with application-managed keys (no KMS) was
rejected because it places the key-management burden on the application,
which lacks the expertise and the physical security to manage keys properly;
the 2024 Redis-escalation incident demonstrated that application-managed
secrets are routinely mishandled. KMS provides hardware-backed key storage
(AWS CloudHSM), audited key access, and automatic rotation, which the
application cannot match. Homomorphic encryption for PII was rejected as not
yet performant enough for production use; current homomorphic schemes add
100-1000x latency overhead, which is unacceptable for an interactive
education platform. The technology is monitored and tracked as a future
evolution if performance improves. The per-object data key design (rather than
per-tenant) is selected because it provides the strongest security (key
compromise exposes only one object) at acceptable performance: the data key
is generated by KMS (a single API call), used to encrypt the object locally, and
the wrapped data key is stored alongside the object. The data key is cached in
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 220

PreOne ADR - Volume 4: Security Architecture v3.0
memory for 5 minutes after unwrap, so subsequent reads of the same object do
not require a KMS call. At 5,000 ops/sec, the KMS call rate is well within the
AWS KMS per-account rate limit (5,500 ops/sec for symmetric CMKs). Per-
tenant CMKs (rather than a single CMK) provide data-residency isolation: a
tenant's data can be cryptographically erased by deleting the tenant's CMK,
which satisfies GDPR right-to-be-forgotten.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | ENCRYPTION
SUBSYSTEM | +-------------------------------------------------------------+ | WRITE
PATH | | App -> KMS: GenerateDataKey(tenant
CMK) | | KMS -> App: plaintext DEK + wrapped DEK | |
App -> AES-256-GCM: encrypt(object, plaintext DEK) | | App -> DB: store
ciphertext + wrapped DEK | | App -> KMS: discard plaintext DEK
| +-------------------------------------------------------------+ | READ PATH
| | App -> DB: fetch ciphertext + wrapped DEK | | App -> KMS:
Decrypt(wrapped DEK, tenant CMK) | | KMS -> App: plaintext DEK
| | App -> AES-256-GCM: decrypt(ciphertext, plaintext DEK) | | App -> DEK
Cache: cache for 5 min |
+-------------------------------------------------------------+ | TRANSIT
| | Browser -> Gateway: TLS 1.3 (curated ciphers) | | Gateway ->
Backend: TLS 1.3 (internal CA) | | Backend -> Backend: mTLS (per
ADR-076) | +-------------------------------------------------------------+
SEQUENCE DIAGRAM
App -> DB: INSERT object (PII field) App -> KMS: GenerateDataKey(tenant
CMK) KMS -> App: {plaintextDEK, wrappedDEK} App -> AES-GCM: encrypt(PII,
plaintextDEK) -> ciphertext App -> DB: store {ciphertext, wrappedDEK} App ->
Memory: discard plaintextDEK --- App -> DB: SELECT object (PII field) DB ->
App: {ciphertext, wrappedDEK} App -> DEK Cache: hit? (no) App -> KMS:
Decrypt(wrappedDEK, tenant CMK) KMS -> App: plaintextDEK App -> DEK
Cache: cache(plaintextDEK, 5min) App -> AES-GCM: decrypt(ciphertext,
plaintextDEK) -> PII
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-077 — Encryption -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | App Service | read/ |
Encryption Service | | | | | write | (AES-256-GCM) | | |
+----------------+ +----------+-----------+ | | |
| | | encrypt/decrypt | | v
| | +----------------+ +----------------------+ | | | KMS | DEK | AWS
KMS (envelope | | | | |------->| encryption) | | |
+----------------+ +----------------------+ | |
| | Layers: | | - At rest: RDS encrypted (KMS-
managed) | | - In transit: TLS 1.3 (CloudFront + ALB) | | -
Field-level: AES-256-GCM for PII (ADR-079) | | - Backups: S3 SSE-KMS
| +-------------------------------------------------------------+
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 221

PreOne ADR - Volume 4: Security Architecture v3.0
DATA FLOW DIAGRAM
Encrypt Flow (write PII): App -> Encryption Service: plaintext PII Encryption
Service -> KMS: request DEK (data encryption key) KMS -> Encryption
Service: encrypted DEK (with master key) Encryption Service -> Postgres: store
ciphertext + encrypted DEK Decrypt Flow (read PII): App -> Repository:
SELECT PII Repository -> Encryption Service: ciphertext + encrypted DEK
Encryption Service -> KMS: decrypt DEK KMS -> Encryption Service: plaintext
DEK Encryption Service -> App: plaintext PII TLS Flow (in transit): Client ->
CloudFront: HTTPS (TLS 1.3) CloudFront -> ALB: HTTPS (TLS 1.3) ALB ->
ECS: HTTPS (TLS 1.2, mTLS optional)
DATABASE IMPACT
No new tables are introduced. The wrapped data key is stored alongside the
encrypted object in a column suffixed _enc (e.g., student_name_enc) and a
column suffixed _dek (e.g., student_name_dek). The existing plaintext columns
are migrated to encrypted form per the migration plan below. The encryption
metadata (CMK ID, algorithm, key version) is stored in a column suffixed _meta
(JSONB). The database itself is encrypted at rest by AWS RDS encryption (a
separate layer, transparent to the application), which protects against physical
media theft. The application-level encryption provides defence in depth: even a
database dump does not reveal plaintext PII without the CMK. Expected
storage overhead: ~2% (the wrapped DEK and metadata add ~200 bytes per
encrypted field).
API IMPACT
The encryption is transparent to the API layer: backend services decrypt PII
before returning it in API responses, and the API contract is unchanged. The
only API-visible change is that bulk-export endpoints (which return large PII
datasets) are slower because of the per-object KMS calls; this is mitigated by
the DEK cache (5-minute TTL) and by batching the KMS calls (DecryptBatch
supports up to 100 wrapped DEKs per call). The API gateway enforces TLS 1.3
(per ADR-076) for all external traffic; the gateway-to-backend and backend-to-
backend calls use TLS 1.3 with an internal CA. Legacy TLS 1.2 integration
partners require an explicit exception, documented in the integration catalog.
UI IMPACT
Encryption is invisible to end users by design. The UI uses HTTPS (TLS 1.3) for
all traffic, indicated by the browser's padlock icon. PII fields (e.g., student
health info) are masked in the UI ('***') for users without the PII-read role;
users with the role see the plaintext. The 'Account' page includes a 'Data
Encryption' info panel (visible to all users) explaining that data is encrypted at
rest and in transit, building user trust. No user action is required for encryption
— it is automatic and transparent.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 222

PreOne ADR - Volume 4: Security Architecture v3.0
SECURITY IMPACT
The selected strategy raises the encryption security floor on three dimensions.
First, AES-256-GCM provides authenticated encryption, eliminating the
padding-oracle attacks that AES-128-CBC is vulnerable to; the GCM mode also
provides integrity verification, detecting tampering with ciphertext. Second,
the per-object data key design means a single key compromise exposes only one
object's data, versus the legacy design where a single key compromise exposes
all data. Third, the annual CMK rotation (automated by AWS KMS) ensures that
even a long-undetected CMK compromise has a bounded exposure window (1
year). The per-tenant CMK design provides cryptographic erasure: deleting a
tenant's CMK renders all of that tenant's data permanently unreadable,
satisfying GDPR right-to-be-forgotten without per-object deletion. The TLS 1.3
enforcement eliminates the deprecated cipher suites (BEAST, CRIME, POODLE
vulnerabilities) and provides forward secrecy by default. The KMS access is
audit-logged by AWS CloudTrail, providing an additional audit trail (per
ADR-086).
PERFORMANCE IMPACT
The encryption adds latency on three components. (1) KMS GenerateDataKey
on write: ~50ms p99 (network round-trip to KMS); this is the dominant cost on
the write path. (2) KMS Decrypt on read (cache miss): ~30ms p99. (3) AES-256-
GCM encryption/decryption: ~1ms per KB of data; this is negligible for typical
PII fields (sub-KB). The DEK cache (5-minute TTL, 10K entries) gives a 90%
cache-hit rate at steady state, reducing the average KMS call rate to 0.1 per
read. Total encryption overhead: ~5ms p99 on write (KMS call), ~3ms p99 on
read (cache hit), ~30ms p99 on read (cache miss). The TLS 1.3 handshake is
faster than TLS 1.2 (1 round-trip vs 2) and adds no measurable latency on the
hot path (sessions are resumed). The KMS rate limit (5,500 ops/sec per
account) is monitored; a sustained breach triggers a request-quota increase via
AWS support.
SCALABILITY ANALYSIS
The encryption subsystem scales with the object write/read rate, not the
principal count. At 5,000 writes/sec (projected peak), the KMS call rate is 5,000
ops/sec, within the per-account limit (5,500) but approaching it; a request-
quota increase to 10,000 ops/sec is provisioned via AWS support. At 10,000
writes/sec (2027 projection), the KMS call rate exceeds the per-account limit;
this is mitigated by the AWS KMS multi-region key support, which distributes
the load across regions. The DEK cache (Redis, 10K entries × 100 bytes = 1MB)
is well within Redis capacity. The per-tenant CMK inventory grows linearly with
the tenant count (~1,000 CMKs at steady state); AWS KMS supports up to
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 223

PreOne ADR  -  Volume 4: Security Architecture  v3.0
100,000 CMKs per account, so no scaling issue is anticipated. The annual CMK
rotation is automated and does not affect request handling.
OPERATIONAL CONSIDERATIONS
The encryption subsystem requires five operational artefacts. (1) A runbook for
KMS outage: the on-call engineer must verify that the DEK cache absorbs the
outage for 5 minutes; sustained outage triggers incident response per
ADR-089. (2) A runbook for CMK rotation: the annual rotation is automated by
AWS KMS, but the engineer must verify that new writes use the latest CMK
version and that the lazy re-encryption of legacy data is progressing (monitored
via the CMK-version distribution). (3) A runbook for CMK deletion (tenant
offboarding): the runbook covers the cryptographic-erasure procedure, the
verification that all data is unreadable, and the audit-log retention. (4) A
runbook for TLS 1.2 exception management: each exception is documented
with a business justification and an expiry date; the runbook covers the
quarterly review. (5) A runbook for KMS rate-limit alerts: sustained approach to
the limit triggers a request-quota increase.
RISKS
| Risk               | Likelihood | Impact | Mitigation         |
| ------------------ | ---------- | ------ | ------------------ |
| KMS outage         | Low        | High   | DEK cache          |
| blocks writes and  |            |        | absorbs 5-min      |
| cache-miss reads.  |            |        | outage; sustained  |
outage triggers
incident response;
circuit breaker on
KMS client.
| CMK deletion       | Medium | High | Deletion requires   |
| ------------------ | ------ | ---- | ------------------- |
| (tenant            |        |      | two-person          |
| offboarding)       |        |      | approval and a 7-   |
| renders data       |        |      | day waiting period  |
| permanently        |        |      | (AWS KMS            |
| unreadable,        |        |      | deletion window);   |
| including backups. |        |      | backup retention    |
policy reviewed
before deletion.
| TLS 1.2           | Medium | Medium | Quarterly review    |
| ----------------- | ------ | ------ | ------------------- |
| exceptions        |        |        | with mandatory      |
| accumulate,       |        |        | expiry; alert on    |
| weakening the     |        |        | expired exceptions  |
| transit security  |        |        | still in use;       |
| posture.          |        |        | quarterly red-      |
team verification.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  224

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation         |
| ------------------ | ---------- | ------ | ------------------ |
| DEK cache          | Low        | High   | Cache key          |
| poisoning          |            |        | includes wrapped-  |
| (attacker injects  |            |        | DEK hash; cache    |
| wrong plaintext    |            |        | is in-memory only  |
| DEK).              |            |        | (not persisted);   |
cache entries
signed.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Per-object data keys limit key- KMS call on every write (~50ms p99).
compromise exposure to one object.
Annual CMK rotation bounds exposure  Lazy re-encryption of legacy data takes
| window. |     | months to complete. |     |
| ------- | --- | ------------------- | --- |
Per-tenant CMKs enable cryptographic  CMK inventory management overhead.
erasure.
TLS 1.3 eliminates deprecated cipher  Legacy TLS 1.2 integration partners
| suites. |     | require exceptions. |     |
| ------- | --- | ------------------- | --- |
REJECTED ALTERNATIVES
The legacy strategy (AES-128-CBC + static key + TLS 1.2) was rejected on
three grounds: AES-128-CBC without authenticated encryption is vulnerable to
padding-oracle attacks (POODLE, Lucky 13); the single static key means a key
compromise exposes all data, and the key has not been rotated in 4 years; and
the deprecated TLS 1.2 cipher suites are vulnerable to known attacks (BEAST,
CRIME, POODLE) and are contractually unacceptable in several 2026 target
markets. Field-level encryption with application-managed keys (no KMS) was
rejected because it places the key-management burden on the application,
which lacks the expertise and physical security to manage keys properly; the
2024 Redis-escalation incident demonstrated that application-managed secrets
are routinely mishandled. KMS provides hardware-backed key storage, audited
key access, and automatic rotation, which the application cannot match.
Homomorphic encryption for PII was rejected as not yet performant enough for
production   use;   current   homomorphic   schemes   add   100-1000x   latency
overhead, which is unacceptable for an interactive education platform. Per-
tenant data keys (rather than per-object) were considered as a performance
optimisation but rejected because they would expose an entire tenant's data on
a single data-key compromise, violating the constraint. The selected strategy is
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  225

PreOne ADR - Volume 4: Security Architecture v3.0
the only one that satisfies all requirements; the full reasoning is captured in the
Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter alongside the authentication-stack
migration (per ADR-062). Phase 1 (weeks 1-3): deploy the encryption
subsystem (KMS client, AES-256-GCM library, DEK cache) and provision the
per-tenant CMKs in AWS KMS. Phase 2 (weeks 4-6): enable encryption for new
writes (new PII fields are encrypted); legacy plaintext data remains in place.
Phase 3 (weeks 7-9): run the lazy re-encryption job, which reads plaintext fields,
encrypts them, and writes back the ciphertext; the job is throttled to 100 fields
per second to avoid saturating KMS. Phase 4 (weeks 10-12): enforce TLS 1.3 at
the API gateway; legacy TLS 1.2 integration partners are migrated or granted
exceptions. Phase 5 (week 13): the legacy plaintext columns are dropped after
verification that all data is encrypted (verified by the _meta column's presence
on every row). Rollback is possible at any point by reverting to the legacy
strategy; the encrypted data is decrypted lazily on read and re-written in
plaintext. The legacy AES-128-CBC static key is destroyed after Phase 5.
TESTING STRATEGY
The encryption subsystem is tested at four levels. Unit tests cover the AES-256-
GCM encryption/decryption (round-trip correctness, tampering detection), the
KMS client (GenerateDataKey, Decrypt, error handling), and the DEK cache
(hit/miss, eviction, poisoning resistance). Coverage target is 95%. Integration
tests cover the write-then-read flow with KMS, the cache-hit and cache-miss
paths, and the CMK rotation. End-to-end tests cover the full write -> read ->
decrypt path with real PII data. Security tests cover the padding-oracle
resistance (verified by automated tools), the key-compromise isolation (one
compromised DEK does not affect other objects), and the TLS 1.3 enforcement
(TLS 1.2 handshakes are rejected). Performance tests cover the encryption
overhead at projected peak (5,000 ops/sec). The CMK-deletion procedure is
tested in a staging environment with synthetic data. The acceptance criterion is
zero plaintext-PII exposure incidents in the post-cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) KMS call latency p99: target under 50ms
(GenerateDataKey) / 30ms (Decrypt), alert above 100ms. (2) KMS call rate:
target under 4,000 ops/sec (80% of limit), alert above 5,000 (possible rate-limit
breach). (3) DEK cache hit ratio: target above 90%, alert below 80% (sizing
problem). (4) CMK-version distribution: target 90%+ on the latest version after
90 days, alert below 70% (lazy re-encryption lagging). (5) TLS 1.2 exception
count: target 0, alert above 5 (policy drift). (6) Encryption failure rate: target 0,
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 226

PreOne ADR - Volume 4: Security Architecture v3.0
alert on any failure (possible KMS outage or key issue). A dedicated encryption
dashboard surfaces these alongside the per-tenant CMK inventory, the TLS
cipher-suite distribution, and the lazy re-encryption progress. Anomaly
detection (per ADR-088) flags unusual patterns such as a KMS call-rate burst
(possible attack or batch job) or a TLS 1.2 handshake from an unexpected
source (possible misconfigured integration).
FUTURE EVOLUTION
The encryption subsystem is expected to evolve in three directions. First, the
system may adopt AWS KMS multi-region keys for cross-region failover,
supporting the multi-region deployment planned for the 2027 horizon; this is a
configuration change, not an architectural one. Second, the system may add
field-level encryption policy (per ADR-079) that classifies fields by sensitivity
and applies different encryption strategies (e.g., tokenization for low-
sensitivity, AES-256-GCM for high-sensitivity); this is planned for v2. Third, the
system may integrate with confidential computing (AWS Nitro Enclaves) for
processing PII in a hardware-isolated enclave, providing defence in depth
against host compromise; this is monitored but not planned for v1 because of
the operational overhead. The trigger for revisiting this ADR is a regulatory
change (e.g., EU NIS2 requiring hardware-backed encryption) or a material
change in the KMS performance characteristics.
RELATED ADRS
● ADR-061 - Identity Model (PII fields encrypted at rest)
● ADR-076 - API Security (TLS 1.3 enforcement at gateway)
● ADR-078 - Secrets Management (KMS for data keys; Vault for
application secrets)
● ADR-079 - PII Protection (field-level encryption policy)
● ADR-086 - Audit Trail (KMS access audit-logged via CloudTrail)
● ADR-053 - Data Retention (CMK deletion for cryptographic erasure)
● ADR-046 - Caching (DEK cache in Redis)
REFERENCES
● NIST SP 800-38D - Galois/Counter Mode (GCM) for Block Ciphers.
NIST. 2007.
● RFC 8446 - The Transport Layer Security (TLS) Protocol Version 1.3.
IETF. 2018.
● AWS KMS - Developer Guide. Amazon Web Services. 2024.
● OWASP - Cryptographic Storage Cheat Sheet. OWASP. 2024.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 227

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● PreOne Engineering Handbook, Section 4.17 - Encryption. Internal.
2025.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect  |     |
| ----------- | --- | ---------------------------- | --- |
| Tech Lead   |     | Authentication Platform Lead |     |
| ARB Chair   |     | Architecture Review Board    |     |
| Approved On |     | 2025-10-15                   |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● RDS encryption-at-rest (KMS-managed) (Done)
● TLS 1.3 on CloudFront + ALB (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  228

PreOne ADR - Volume 4: Security Architecture v3.0
● Field-level AES-256-GCM for PII (Done — ADR-079)
● S3 SSE-KMS for backups (Done)
● KMS key rotation policy (annual) (Done)
● Annual encryption audit (Scheduled)
AD R -078
Secrets Management
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt HashiCorp Vault for application secrets (database credentials, third-
party API keys, signing keys) and AWS KMS for data-encryption keys.
Secrets are never written to disk or checked into source control. Vault
policies enforce per-service access; KMS key policies enforce per-tenant
isolation. Rotation is automated for short-lived secrets and scheduled for
long-lived secrets.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on security
incident, or on cryptography
standard update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The PreOne platform handles two categories of secrets. The first is application
secrets: database credentials, third-party API keys (Stripe, Twilio, Google
Workspace), JWT signing keys, and mTLS certificate private keys. The second is
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 229

PreOne ADR - Volume 4: Security Architecture v3.0
data-encryption keys: the KMS customer master keys (CMKs) used for envelope
encryption (per ADR-077). The 2025 Q3 security review found that the legacy
platform stores application secrets in environment variables checked into a Git
repository (in encrypted form, but with the decryption key stored in CI), and
data-encryption keys as a single static AES key in a configuration file. The
review identified three gaps. First, the Git-based secret store is vulnerable to CI
compromise (the 2024 Redis-escalation incident exfiltrated the decryption key
from CI). Second, the single static AES key has no rotation procedure. Third,
there is no per-service access control: any service can read any secret. The
ARB considered four secrets-management strategies. The first is the legacy
strategy (Git + env vars + static key), which is rejected for the reasons above.
The second is HashiCorp Vault for application secrets + AWS KMS for data
keys, which is selected. The third is AWS Secrets Manager for everything,
which is rejected as lacking the dynamic-secret and policy-engine capabilities
of Vault. The fourth is a custom secrets service, which is rejected as reinventing
Vault poorly. This ADR defines secrets management. It depends on ADR-077
(Encryption) for the data-key usage and ADR-076 (API Security) for mTLS
certificate issuance.
BUSINESS DRIVERS
The 2026 international expansion requires secrets management aligned with
each regulatory regime: GDPR Article 32 recommends secrets encryption and
access logging; DPDP requires audit trails of secret access; COPPA does not
mandate but parental-consent expectations effectively require it. The Vault +
KMS strategy satisfies all three. The business also requires that a CI
compromise not expose production secrets, which drives the Vault-based
design (CI does not have Vault credentials; services fetch secrets at startup
from Vault). Finally, the business requires that secret rotation be operational
(not a flag-day redeploy), which drives the dynamic-secret design for short-lived
credentials (database credentials are generated on-demand with 1-hour TTL).
PROBLEM STATEMENT
The legacy secrets-management strategy (Git-encrypted env vars + static AES
key) is vulnerable to CI compromise (demonstrated in the 2024 Redis incident),
has no rotation procedure, and lacks per-service access control. PreOne needs
a secrets-management strategy that uses Vault for application secrets, KMS for
data keys, enforces per-service access, and automates rotation.
CONSTRAINTS
● Secrets must never be written to disk in plaintext or checked into
source control.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 230

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● Per-service access control must limit each service to the secrets it
needs (least privilege).
● Short-lived secrets (database credentials, API tokens) must be rotated
automatically (TTL under 1 hour).
● Long-lived secrets (third-party API keys) must be rotated on a schedule
(quarterly) with documented runbook.
● Secrets access must be audit-logged per ADR-086.
ASSUMPTIONS
● HashiCorp Vault is available in HA mode (3 nodes) in the production
cluster.
● AWS KMS (per ADR-077) provides the data-key management capability.
● The Kubernetes service account (per ADR-076) provides the service
identity for Vault authentication.
● Vault's dynamic-secret database engine supports PostgreSQL (the
primary datastore).
● Third-party API providers support key rotation (Stripe, Twilio, Google
Workspace all support multiple active keys).
OPTIONS CONSIDERED
| Option           | Pros                | Cons               | Verdict |
| ---------------- | ------------------- | ------------------ | ------- |
| Vault for        | Dynamic secrets     | Vault HA cluster   | Adopted |
| application      | (1h TTL) limit      | operational        |         |
| secrets + AWS    | stolen-credential   | burden (3 nodes +  |         |
| KMS for data-    | value. Per-service  | Consul backend).   |         |
| encryption keys. | access control via  | AWS KMS            |         |
|                  | Vault policies.     | dependency. Vault  |         |
|                  | Hardware-backed     | root-token         |         |
|                  | key storage via     | management         |         |
|                  | KMS. Mature,        | requires break-    |         |
|                  | audited, widely-    | glass procedure.   |         |
deployed.
| Legacy: Git-       | Simple. No Vault   | Vulnerable to CI    | Rejected |
| ------------------ | ------------------ | ------------------- | -------- |
| encrypted env      | dependency.        | compromise          |          |
| vars + static AES  | Familiar           | (demonstrated in    |          |
| key.               | operational model. | 2024 incident). No  |          |
rotation
procedure. No
per-service access
control. Single
static key exposes
all data on
compromise.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  231

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option            | Pros               | Cons                | Verdict  |
| ----------------- | ------------------ | ------------------- | -------- |
| AWS Secrets       | Single AWS-native  | Lacks Vault's       | Rejected |
| Manager for       | service. No Vault  | dynamic-secret      |          |
| everything        | dependency.        | capability (static  |          |
| (application      | Deeply integrated  | secrets only).      |          |
| secrets and data  | with AWS IAM.      | Policy engine less  |          |
| keys).            |                    | expressive than     |          |
Vault. No native
Kubernetes
service-account
auth.
Custom secrets  Full control. No  Reinventing Vault  Rejected
| service (in-house  | external         | poorly. 6-12        |     |
| ------------------ | ---------------- | ------------------- | --- |
| built).            | dependency.      | months to build.    |     |
|                    | Tailored to      | Likely more         |     |
|                    | PreOne-specific  | vulnerabilities     |     |
|                    | needs.           | than mature Vault.  |     |
Make-vs-buy
strongly favours
buy for security-
critical
infrastructure.
DECISION
ADOPTED
We will adopt HashiCorp Vault for application secrets and AWS KMS for
data-encryption keys. Application secrets (database credentials, third-party
API keys, JWT signing keys, mTLS private keys) are stored in Vault's KV-v2
engine and fetched by services at startup via the Kubernetes service-
account auth method. Short-lived database credentials are generated on-
demand by Vault's database dynamic-secret engine with a 1-hour TTL;
services re-fetch before expiry. Long-lived third-party API keys are stored
as static KV secrets and rotated quarterly per a documented runbook. Per-
service access is enforced by Vault policies bound to Kubernetes service
accounts. Data-encryption keys (CMKs) are managed by AWS KMS (per
ADR-077); the KMS key policies enforce per-tenant isolation. All secret
access is audit-logged by Vault's audit device and by AWS CloudTrail (for
KMS).
DETAILED RATIONALE
The Vault + KMS strategy is selected because it is the only option that
simultaneously   satisfies   the   security,   rotation,   and   access-control
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  232

PreOne ADR - Volume 4: Security Architecture v3.0
requirements. The legacy strategy (Git + env vars + static key) is rejected on
three grounds. First, the Git-based secret store is vulnerable to CI compromise:
the 2024 Redis-escalation incident exfiltrated the decryption key from CI,
exposing all secrets. Second, the single static AES key has no rotation
procedure; the key has not been rotated in 4 years. Third, there is no per-
service access control: any service can read any secret, violating least privilege.
AWS Secrets Manager for everything was rejected because Secrets Manager
lacks Vault's dynamic-secret capability (it stores static secrets only) and its
policy engine is less expressive than Vault's. Dynamic secrets are a critical
capability: database credentials generated on-demand with a 1-hour TTL mean
that a stolen credential is valid for at most 1 hour, versus the legacy static
credential that is valid indefinitely. Secrets Manager also does not support the
Kubernetes service-account auth method natively, requiring IAM role
assumption which is operationally heavier. The custom secrets service was
rejected as reinventing Vault poorly: Vault is a mature, audited, widely-
deployed product with a strong security track record; building an equivalent in-
house would take 6-12 months and would likely have more vulnerabilities. The
make-vs-buy analysis strongly favours buy for security-critical infrastructure.
The separation of Vault (application secrets) and KMS (data keys) is deliberate:
KMS provides hardware-backed key storage (AWS CloudHSM) that Vault
cannot match, and KMS is deeply integrated with AWS services (S3, RDS, EBS)
that the platform uses. Vault's transit engine could provide envelope
encryption, but using KMS for data keys keeps the encryption boundary within
AWS (where the data lives) and uses Vault only for application secrets (where
the dynamic-secret and policy-engine capabilities matter). The two systems are
complementary, not redundant. Vault's audit device logs every secret access
(read, write, list) to a tamper-evident log, which is forwarded to the SIEM (per
ADR-088) for anomaly detection. AWS CloudTrail logs every KMS API call,
providing the same capability for data keys.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | SECRETS MANAGEMENT
SUBSYSTEM | +-------------------------------------------------------------+ |
Application Secrets (Vault KV-v2 + Database Engine) | | - DB credentials
(dynamic, 1h TTL) | | - 3rd-party API keys (static, quarterly
rotation) | | - JWT signing keys (static, annual rotation) | | - mTLS
private keys (cert-manager, per ADR-076) |
+-------------------------------------------------------------+ | Kubernetes service-account
auth (JWT) | v | | Vault (HA, 3
nodes) | | - KV-v2 engine (static secrets)
| | - Database engine (dynamic DB creds) | | - Audit device ->
SIEM (per ADR-088) | +-------------------------------------------------------------+ |
Data Encryption Keys (AWS KMS) | | - Per-tenant CMKs (per
ADR-077) | | - GenerateDataKey / Decrypt APIs |
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 233

PreOne ADR - Volume 4: Security Architecture v3.0
| - CloudTrail audit -> SIEM |
+-------------------------------------------------------------+ | Service Startup
| | 1. authenticate to Vault via k8s service account | | 2. fetch static
secrets (KV-v2) | | 3. request dynamic DB credential (1h TTL)
| | 4. re-fetch DB credential before expiry |
+-------------------------------------------------------------+
SEQUENCE DIAGRAM
Service -> Vault: auth via k8s service-account JWT Vault -> Vault: verify k8s JWT
+ check policy Vault -> Service: Vault token (TTL 1h) Service -> Vault: read
kv/tenants/{id}/stripe_key Vault -> Audit Log: read event (per ADR-086) Vault ->
Service: {stripe_key} Service -> Vault: read database/creds/tenant_role Vault ->
PostgreSQL: CREATE ROLE ... VALID UNTIL 1h Vault -> Service: {username,
password} Service -> PostgreSQL: connect (1h credential) Service -> Vault: re-
fetch before expiry (lease renewal)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-078 — Secrets Management -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | App Service | read | Secrets
SDK | | | | |------->| (cached, refreshed) | | | +----------------
+ +----------+-----------+ | | | | |
| fetch | | v | | +----------------+
+----------------------+ | | | AWS Secrets | store | Encrypted secrets | | |
| Manager |------->| (KMS-encrypted) | | | +----------------+
+----------------------+ | | | | Rotation:
| | - DB credentials: 90-day auto-rotation | | - API keys: 30-day
manual + reminder | | - TLS certs: ACM auto-renew
| | | | Audit: every secret access logged to
ADR-086 | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Secret Read Flow: App -> Secrets SDK: getSecret('db.password') Secrets SDK
-> Cache: lookup (TTL 5 min) (cache miss) Secrets SDK -> AWS Secrets
Manager: fetch Secrets Manager -> KMS: decrypt KMS -> Secrets Manager:
plaintext Secrets Manager -> Secrets SDK: plaintext Secrets SDK -> App:
secret Secret Rotation Flow (DB credentials): Rotation Lambda -> Secrets
Manager: generate new password Rotation Lambda -> RDS: ALTER USER
password Rotation Lambda -> Secrets Manager: store new secret Rotation
Lambda -> Notification: 'rotation complete' (apps auto-refresh via SDK cache
TTL)
DATABASE IMPACT
No new application tables are introduced. Vault's storage backend is an
external HA Consul cluster (per ADR-078 operational setup), not the
application database. The dynamic database credentials are created in the
application PostgreSQL cluster as roles with tenant-scoped grants; the roles
are dropped automatically by Vault on TTL expiry. The legacy static database
credentials (one per service) are migrated to dynamic credentials per the
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 234

PreOne ADR - Volume 4: Security Architecture v3.0
migration plan; the legacy credentials are revoked after migration. Vault's
audit log is forwarded to the SIEM (per ADR-088) and is not stored in the
application database. AWS CloudTrail logs KMS API calls; these are also
forwarded to the SIEM. Expected PostgreSQL role count at steady state: ~200
(50 services × 4 concurrent dynamic credentials).
API IMPACT
The secrets-management subsystem is transparent to the API layer: services
fetch secrets at startup and on rotation; no API endpoint exposes secrets. The
only API-visible change is that database connections are re-established every
hour (on dynamic-credential renewal), which causes a brief connection-pool
churn; this is mitigated by the HikariCP connection pool's graceful refresh. The
Vault token (1-hour TTL) is renewed automatically by the Spring Cloud Vault
client; on renewal failure, the service fails closed (refuses requests) and alerts.
The mTLS certificates (per ADR-076) are issued by cert-manager (not Vault)
because cert-manager integrates more cleanly with Kubernetes; Vault's PKI
engine is available as a backup if cert-manager is unavailable.
UI IMPACT
Secrets Management has no direct UI surface — it is internal infrastructure.
The admin UI includes a 'Secrets Health' dashboard
(admin/operations/security/secrets, accessible to Security Engineering)
showing secret rotation status (DB credentials: rotated 30 days ago; API keys:
rotated 5 days ago; TLS certs: auto-renewed). The dashboard surfaces secrets
approaching rotation deadlines (yellow at 80% of TTL, red at 95%). No secrets
are ever displayed in the UI — only metadata (name, last rotated, next rotation).
The dashboard provides documentary evidence for compliance audits.
SECURITY IMPACT
The Vault + KMS strategy raises the secrets-security floor on three dimensions.
First, the elimination of secrets from Git and CI closes the attack vector that
was exploited in the 2024 Redis-escalation incident (CI compromise no longer
exposes production secrets). Second, the per-service access control (Vault
policies bound to Kubernetes service accounts) enforces least privilege: a
compromised service can read only its own secrets, not the entire secret
inventory. Third, the dynamic database credentials (1-hour TTL) limit the value
of a stolen credential to at most 1 hour, versus the legacy static credential that
was valid indefinitely. Vault's audit device logs every secret access to a tamper-
evident log, providing a complete audit trail (per ADR-086) and enabling
anomaly detection (per ADR-088). The Vault HA cluster (3 nodes) provides
availability; on Vault outage, services continue with cached credentials until
expiry (1 hour), after which they fail closed.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 235

PreOne ADR - Volume 4: Security Architecture v3.0
PERFORMANCE IMPACT
Vault secret reads add ~10ms p99 at service startup (one-time cost). The
dynamic database credential generation adds ~50ms p99 (Vault creates a
PostgreSQL role), but this is amortised over the 1-hour TTL. The Vault token
renewal (every 1 hour) adds ~10ms and is non-blocking. The KMS API calls (per
ADR-077) are unaffected by this ADR. At steady state, the per-request overhead
is zero: secrets are cached in memory and refreshed in the background. The
Vault HA cluster (3 nodes) handles the projected request rate (~200 reads/sec
at startup peak) with headroom. The dynamic-credential churn (200
PostgreSQL roles created and dropped per hour) is well within PostgreSQL
capacity; the role DDL is throttled by Vault to avoid saturation.
SCALABILITY ANALYSIS
The secrets-management subsystem scales with the service count (~50
services) and the tenant count (~1,000 tenants). The Vault HA cluster (3 nodes)
handles the projected request rate (~200 reads/sec at startup peak, ~50
reads/sec at steady state) with headroom; vertical scaling (more CPU) is
available before horizontal scaling (more nodes) is needed. The dynamic-
credential churn (200 PostgreSQL roles per hour) is bounded by the service
count and does not grow with the tenant count (each service has one dynamic
credential, regardless of tenant). The Vault storage backend (Consul HA) scales
to ~10K secrets (well above the projected ~2K), so no scaling issue is
anticipated. KMS scaling is addressed in ADR-077. At the 5M-principal
projection, the service count grows to ~100, requiring Vault scaling to 5 nodes;
this is a configuration change, not an architectural one.
OPERATIONAL CONSIDERATIONS
The secrets-management subsystem requires five operational artefacts. (1) A
runbook for Vault outage: services continue with cached credentials until
expiry (1 hour); sustained outage triggers incident response per ADR-089. (2) A
runbook for Vault unseal: in the event of a cluster restart, Vault requires
manual unseal (or auto-unseal via AWS KMS, which is the configured mode);
the runbook covers the unseal procedure. (3) A runbook for quarterly key
rotation (third-party API keys): the runbook covers the rotation procedure and
the verification. (4) A runbook for KMS CMK rotation (annual, automated): the
runbook covers verification. (5) A runbook for Vault audit-log forwarding: the
audit log is forwarded to the SIEM; the runbook covers the forwarding pipeline
and the alerting on anomalies. The Vault root token is stored in a sealed
hardware token (YubiKey) accessible only to the security team; the break-glass
procedure is documented.
RISKS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 236

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk           | Likelihood | Impact | Mitigation         |
| -------------- | ---------- | ------ | ------------------ |
| Vault outage   | Low        | High   | HA cluster (3      |
| blocks secret  |            |        | nodes); services   |
| reads and      |            |        | cache credentials  |
| dynamic-       |            |        | (1h TTL);          |
| credential     |            |        | sustained outage   |
| renewal.       |            |        | triggers incident  |
response.
| Vault root token     | Low | High | Root token stored   |
| -------------------- | --- | ---- | ------------------- |
| compromise           |     |      | in hardware         |
| enables full secret  |     |      | token; break-glass  |
| inventory access.    |     |      | procedure           |
requires two-
person approval;
audit-logged.
| Dynamic-          | Low | Medium | Vault throttles    |
| ----------------- | --- | ------ | ------------------ |
| credential churn  |     |        | role DDL; monitor  |
| saturates         |     |        | role count; alert  |
| PostgreSQL (role  |     |        | above 500.         |
DDL).
| KMS key policy    | Low | High | Key policies are     |
| ----------------- | --- | ---- | -------------------- |
| misconfiguration  |     |      | version-controlled;  |
| grants cross-     |     |      | quarterly audit;     |
| tenant access.    |     |      | automated            |
conformance test.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Vault eliminates secrets from Git and  Vault HA cluster operational burden (3
| CI. |     | nodes + Consul backend). |     |
| --- | --- | ------------------------ | --- |
Dynamic credentials limit stolen- Connection-pool churn on renewal
| credential value to 1 hour. |     | (mitigated by HikariCP graceful  |     |
| --------------------------- | --- | -------------------------------- | --- |
refresh).
Per-service access control enforces  Vault policy management overhead.
least privilege.
KMS provides hardware-backed key  AWS KMS dependency (mitigated by
| storage. |     | multi-region keys, per ADR-077 future  |     |
| -------- | --- | -------------------------------------- | --- |
evolution).
REJECTED ALTERNATIVES
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  237

PreOne ADR - Volume 4: Security Architecture v3.0
The legacy strategy (Git-encrypted env vars + static AES key) was rejected on
three grounds: the Git-based secret store is vulnerable to CI compromise
(demonstrated in the 2024 Redis-escalation incident); the single static AES key
has no rotation procedure (the key had not been rotated in 4 years); and there is
no per-service access control, violating least privilege. AWS Secrets Manager
for everything was rejected because Secrets Manager lacks Vault's dynamic-
secret capability (it stores static secrets only) and its policy engine is less
expressive than Vault's; dynamic secrets are critical for limiting stolen-
credential value to 1 hour. The custom secrets service was rejected as
reinventing Vault poorly: Vault is a mature, audited, widely-deployed product
with a strong security track record; building an equivalent in-house would take
6-12 months and would likely have more vulnerabilities. The make-vs-buy
analysis strongly favours buy for security-critical infrastructure. Storing
secrets in Kubernetes secrets (base64-encoded, not encrypted by default) was
rejected as insufficient; Kubernetes secrets are encrypted at rest only if etcd
encryption is configured, and the access control is namespace-scoped, not
service-scoped. The Vault + KMS strategy is the only one that satisfies all
requirements; the full reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter alongside the encryption migration (per
ADR-077). Phase 1 (weeks 1-3): deploy the Vault HA cluster (3 nodes + Consul
backend) and configure the Kubernetes service-account auth method. Phase 2
(weeks 4-6): migrate static secrets from Git to Vault KV-v2; the Git-encrypted
store is kept in sync during the migration window. Phase 3 (weeks 7-9): enable
the Vault database dynamic-secret engine; services are migrated to dynamic
credentials one at a time (canary pattern, 10% per day). Phase 4 (weeks 10-12):
migrate the mTLS private keys from Vault to cert-manager (per ADR-076); the
JWT signing keys remain in Vault. Phase 5 (week 13): the Git-encrypted secret
store is decommissioned; the decryption key is destroyed. Rollback is possible
at any point by reverting to the Git-encrypted store; the Vault secrets remain in
place but are not used. The legacy static AES key (per ADR-077) is destroyed
after Phase 5 of the encryption migration.
TESTING STRATEGY
The secrets-management subsystem is tested at four levels. Unit tests cover the
Vault client (auth, read, renew, error handling), the dynamic-credential
lifecycle (create, use, renew, expire), and the KMS client (per ADR-077).
Coverage target is 95%. Integration tests cover the Vault-to-PostgreSQL
dynamic-credential flow, the Vault policy enforcement, and the audit-log
forwarding. End-to-end tests cover the service-startup -> Vault-auth -> secret-
fetch -> DB-connect path. Security tests cover the per-service access control (a
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 238

PreOne ADR - Volume 4: Security Architecture v3.0
service must not read another service's secrets), the dynamic-credential
isolation (a stolen credential must not access other tenants' data), and the
audit-log completeness (every secret access must be logged). Chaos tests cover
Vault-cluster failover and the cached-credential fallback. The acceptance
criterion is zero plaintext-secret exposure incidents in the post-cutover
penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Vault read latency p99: target under
10ms, alert above 50ms. (2) Vault token renewal failure rate: target 0, alert on
any failure (possible Vault outage). (3) Dynamic-credential churn rate: target
under 200/hour, alert above 500 (possible saturation). (4) Vault audit-log
forwarding lag: target under 60 seconds, alert above 5 minutes (possible SIEM
ingestion issue). (5) KMS API call rate (per ADR-077): target under 4,000
ops/sec, alert above 5,000. (6) Secret-access anomaly rate: target 0, alert on
any anomaly flagged by the SIEM (per ADR-088). A dedicated secrets-
management dashboard surfaces these alongside the Vault cluster health, the
per-service secret-access distribution, and the dynamic-credential TTL
distribution. Anomaly detection (per ADR-088) flags unusual patterns such as a
service reading an unexpected secret or a principal accessing secrets outside
business hours.
FUTURE EVOLUTION
The secrets-management subsystem is expected to evolve in three directions.
First, the system may adopt Vault's transit engine for application-level
encryption (in addition to KMS), providing a unified encryption API; this is
monitored but not planned for v1 because KMS is deeply integrated with AWS
services. Second, the system may adopt AWS KMS auto-unseal for Vault
(replacing the manual unseal procedure), reducing operational burden; this is
planned for v2. Third, the system may integrate with the SPIFFE/SPIRE
ecosystem for federated service identity across clusters, supporting the multi-
cluster deployment planned for the 2027 horizon; this is tracked as a follow-up
to ADR-076. The trigger for revisiting this ADR is a regulatory change (e.g., EU
NIS2 requiring hardware-backed secret storage) or a material change in the
Vault or KMS performance characteristics.
RELATED ADRS
● ADR-061 - Identity Model (service principals authenticate to Vault)
● ADR-076 - API Security (mTLS private keys managed via cert-manager)
● ADR-077 - Encryption (KMS for data keys; Vault for application secrets)
● ADR-079 - PII Protection (PII encryption keys stored in KMS)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 239

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● ADR-086 - Audit Trail (Vault audit device and CloudTrail feed audit
logs)
● ADR-088 - Security Monitoring (Vault and KMS events forwarded to
SIEM)
● ADR-072 - MFA (TOTP shared secrets stored in Vault)
REFERENCES
● HashiCorp Vault - Documentation. HashiCorp. 2024.
● AWS KMS - Developer Guide. Amazon Web Services. 2024.
● NIST SP 800-57 - Recommendation for Key Management. NIST. 2020.
● OWASP - Secrets Management Cheat Sheet. OWASP. 2024.
● PreOne Engineering Handbook, Section 4.18 - Secrets Management.
Internal. 2025.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect |     | Platform Security Architect  |     |
| --------- | --- | ---------------------------- | --- |
| Tech Lead |     | Authentication Platform Lead |     |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  240

PreOne ADR - Volume 4: Security Architecture v3.0
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● AWS Secrets Manager adopted (Done)
● All secrets migrated from env vars / config files (Done)
● DB credential auto-rotation (90-day) (Done)
● API key rotation reminder (30-day) (Done)
● TLS cert auto-renewal via ACM (Done)
● Secrets Health dashboard deployed (Done)
AD R -079
PII Protection
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a multi-layer PII protection strategy: data classification (4 tiers),
field-level encryption for sensitive PII (AES-256-GCM via KMS envelope),
tokenization for direct identifiers used as foreign keys, data minimisation in
APIs (return only fields the caller is authorised to see), and PII access audit
logging. Data Subject Rights (GDPR/DPDP) are operationalised via
automated export and erasure pipelines.
STATUS
Status Accepted
Date Decided 2025-10-15
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 241

PreOne ADR - Volume 4: Security Architecture v3.0
Decision Owner Platform Security Architect
Review Cadence Annual review, or on regulatory
update, or on OWASP Top 10
refresh
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The PreOne platform stores substantial PII: student names, dates of birth,
parent contacts, financial records, assessment responses, and special-needs
categories. The 2025 Q3 security review found that the legacy platform treats
all PII uniformly (encrypted at rest by AWS RDS encryption, but no field-level
encryption, no tokenization, no data minimisation in APIs), which leaves the
platform exposed to several risks. First, a database dump exposes all PII in
plaintext (RDS encryption protects only physical media). Second, APIs return
all columns of a table by default, over-disclosing PII to callers who need only a
subset. Third, direct identifiers (student ID, parent email) used as foreign keys
cannot be encrypted without breaking joins, so they are stored in plaintext,
enabling correlation attacks. The ARB considered four PII protection
strategies. The first is the legacy strategy (uniform RDS encryption, no field-
level), which is rejected. The second is the multi-layer strategy selected here.
The third is full homomorphic encryption (rejected in ADR-077 as not
performant). The fourth is a data warehouse approach (PII only in a separate
warehouse, never in the operational database), which is rejected as
incompatible with the operational need to access PII in real time. This ADR
defines PII protection. It depends on ADR-077 (Encryption) for the field-level
encryption and ADR-086 (Audit Trail) for the PII access logging.
BUSINESS DRIVERS
The 2026 international expansion requires PII protection aligned with each
regulatory regime: GDPR Articles 5, 25, 32 mandate data minimisation,
encryption, and access logging; DPDP Section 17 mandates encryption of
sensitive personal data and audit trails; COPPA requires parental consent for
PII collection and verifiable deletion. The multi-layer strategy satisfies all three.
The business also requires that data subject rights (access, export, erasure) be
operational (automated pipelines, not manual SQL), which drives the
tokenization design (erasure is a token-destruction operation, not a cascade-
delete). Finally, the business requires that a database dump not expose PII in
plaintext, which drives the field-level encryption design.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 242

PreOne ADR - Volume 4: Security Architecture v3.0
PROBLEM STATEMENT
The legacy PII protection strategy (uniform RDS encryption, no field-level, no
tokenization, no data minimisation) leaves the platform exposed to database-
dump attacks, API over-disclosure, and correlation attacks on direct identifiers.
PreOne needs a multi-layer PII protection strategy: data classification, field-
level encryption, tokenization for direct identifiers, data minimisation in APIs,
and PII access audit logging.
CONSTRAINTS
● PII classification must cover all 4 tiers (public, internal, confidential,
restricted) with clear criteria.
● Field-level encryption must use AES-256-GCM via KMS envelope (per
ADR-077), with per-object data keys for restricted PII.
● Tokenization must preserve referential integrity (tokens are stable and
can be used as foreign keys).
● Data minimisation in APIs must be enforced at the gateway (per
ADR-076) based on the caller's scopes (per ADR-068).
● PII access must be audit-logged per ADR-086 with principal, resource,
and purpose.
● Data subject rights (access, export, erasure) must be operationalised
via automated pipelines with SLA.
ASSUMPTIONS
● The KMS envelope encryption (per ADR-077) provides acceptable
performance for field-level encryption.
● The tokenization vault (a separate Vault namespace) provides stable
tokens with deterministic mapping for join keys.
● The data classification taxonomy is accepted by the legal and security
teams and is stable.
● Data subject rights pipelines can be built on the existing batch
infrastructure (per ADR-029).
● Tenants will accept the default classification mappings with per-tenant
override for edge cases.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 243

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option             | Pros               | Cons                | Verdict |
| ------------------ | ------------------ | ------------------- | ------- |
| Multi-layer:       | Defence in depth.  | KMS call            | Adopted |
| classification +   | Defeats database-  | overhead on every   |         |
| field-level        | dump attacks       | PII read.           |         |
| encryption +       | (field-level       | Tokenization vault  |         |
| tokenization +     | encryption).       | dependency. Per-    |         |
| data minimisation  | Breaks identifier  | scope field-set     |         |
| + audit.           | correlation        | configuration       |         |
|                    | (tokenization).    | overhead. Batch     |         |
|                    | Prevents API over- | infrastructure      |         |
|                    | disclosure (data   | dependency for      |         |
|                    | minimisation).     | erasure.            |         |
Operationalises
GDPR/DPDP
rights.
| Legacy: uniform     | Simple. No KMS      | Database dump       | Rejected |
| ------------------- | ------------------- | ------------------- | -------- |
| RDS encryption,     | call overhead. No   | exposes all PII in  |          |
| no field-level, no  | tokenization vault  | plaintext. APIs     |          |
| tokenization.       | dependency.         | over-disclose PII.  |          |
|                     | Familiar            | Direct identifiers  |          |
|                     | operational model.  | enable correlation  |          |
attacks. Cannot
satisfy
GDPR/DPDP
encryption-at-rest
guidance.
| Full homomorphic    | Enables            | 100-1000x latency  | Rejected |
| ------------------- | ------------------ | ------------------ | -------- |
| encryption for PII. | computation on     | overhead. Not      |          |
|                     | ciphertext.        | performant         |          |
|                     | Strongest privacy  | enough for         |          |
|                     | guarantee. No      | interactive        |          |
|                     | decryption needed  | education          |          |
|                     | for processing.    | platform.          |          |
Immature
ecosystem.
Rejected in
ADR-077.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  244

PreOne ADR - Volume 4: Security Architecture v3.0
Option Pros Cons Verdict
Data warehouse Strong isolation. Incompatible with Rejected
approach: PII only PII not in the hot operational need
in a separate path. Warehouse to access PII in
warehouse, never can be heavily real time (parent-
in the operational audited. teacher
database. conference).
Warehouse query
latency (minutes)
is unacceptable.
Warehouse itself
becomes a high-
value target.
DECISION
ADOPTED
We will adopt a multi-layer PII protection strategy. (1) Data classification:
every PII field is classified into one of 4 tiers (public, internal, confidential,
restricted) based on a taxonomy maintained by the legal and security teams;
the classification is stored in the schema metadata. (2) Field-level
encryption: confidential and restricted fields are encrypted with AES-256-
GCM via KMS envelope (per ADR-077); restricted fields use per-object data
keys, confidential fields use per-tenant data keys. (3) Tokenization: direct
identifiers used as foreign keys (student ID, parent email) are tokenized via
a Vault tokenization vault; the token is stable and can be used as a foreign
key. (4) Data minimisation: APIs return only the fields the caller is
authorised to see, enforced at the gateway (per ADR-076) based on scopes
(per ADR-068). (5) Audit logging: every PII access is logged per ADR-086.
DETAILED RATIONALE
The multi-layer strategy is selected because it is the only option that
simultaneously satisfies the regulatory, security, and operational requirements.
The legacy strategy (uniform RDS encryption) is rejected because RDS
encryption protects only physical media; a database dump (e.g., via a SQL
injection, a backup leak, or an insider) exposes all PII in plaintext. Field-level
encryption with KMS envelope ensures that even a database dump does not
reveal plaintext PII without the CMK. Full homomorphic encryption was
rejected in ADR-077 as not performant enough; the same reasoning applies
here. The data warehouse approach (PII only in a separate warehouse) was
rejected as incompatible with the operational need to access PII in real time
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 245

PreOne ADR - Volume 4: Security Architecture v3.0
(e.g., a teacher viewing a student's profile during a parent-teacher conference);
the latency of a warehouse query (minutes) is unacceptable for interactive use.
The 4-tier classification (public, internal, confidential, restricted) is calibrated
against the GDPR and DPDP definitions of personal and sensitive personal data.
Public: data that is already publicly available (school name, course catalog).
Internal: data shared within the tenant but not with the principal (e.g., internal
notes). Confidential: data that identifies a principal but is not sensitive (e.g.,
student name, email). Restricted: sensitive personal data (e.g., date of birth,
special-needs category, financial records). Each tier has a default protection
policy, overridable per field for edge cases. Tokenization for direct identifiers is
the key innovation that enables both encryption and referential integrity. The
Vault tokenization vault issues a stable, deterministic token for each direct
identifier (e.g., the token for student@example.com is always the same); the
token can be used as a foreign key, enabling joins without exposing the
underlying identifier. The mapping from token to identifier is stored in the Vault
tokenization vault (not in the application database), so a database dump does
not reveal the identifiers. Erasure is a token-destruction operation in the Vault
tokenization vault, which cascades to the application database (the foreign key
becomes dangling, and the row is garbage-collected). Data minimisation in
APIs is enforced at the gateway based on the caller's scopes: a caller with the
read:student:basic scope sees only public and internal fields; a caller with
read:student:full sees all fields. This prevents the over-disclosure that the
legacy APIs exhibited (returning all columns by default).
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | PII PROTECTION
SUBSYSTEM | +-------------------------------------------------------------+ | DATA
CLASSIFICATION (4 tiers) | | public | internal | confidential |
restricted | | stored in schema metadata (per-field) |
+-------------------------------------------------------------+ | FIELD-LEVEL ENCRYPTION (per
ADR-077) | | confidential: per-tenant data key (AES-256-GCM)
| | restricted: per-object data key (AES-256-GCM + KMS) |
+-------------------------------------------------------------+ | TOKENIZATION (Vault
tokenization vault) | | direct identifiers (student_id, parent_email)
-> token | | token used as foreign key (stable, deterministic) |
+-------------------------------------------------------------+ | DATA MINIMISATION (API
gateway, per ADR-076) | | scopes (per ADR-068) -> field-set returned
| | read:student:basic -> public + internal fields | | read:student:full ->
all fields | +-------------------------------------------------------------+ | AUDIT
LOGGING (per ADR-086) | | every PII access: principal,
resource, purpose | +-------------------------------------------------------------+ | DATA
SUBJECT RIGHTS (automated pipelines) | | access: export
principal's PII as JSON | | erasure: token destruction -> cascade GC
| +-------------------------------------------------------------+
SEQUENCE DIAGRAM
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 246

PreOne ADR - Volume 4: Security Architecture v3.0
Client -> API Gateway: GET /students/123 (scope: read:student:basic) API
Gateway -> Backend: forward (with scope context) Backend -> DB: SELECT *
FROM students WHERE token_id = ? DB -> Backend: {token_id, name_enc,
dob_enc, ...} Backend -> KMS: Decrypt(name_enc) -> name (per ADR-077)
Backend -> KMS: Decrypt(dob_enc) -> dob Backend -> Vault:
detokenize(token_id) -> student_id Backend -> Data Minimiser: filter fields by
scope Data Minimiser -> Backend: {name, student_id} (basic fields only)
Backend -> Audit Log: PII access (principal, student 123, purpose) Backend ->
API Gateway: 200 OK {name, student_id} API Gateway -> Client: 200 OK {name,
student_id}
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-079 — PII Protection -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | App Service | read/ | PII
Service | | | | | write | (encrypt/decrypt + | | |
+----------------+ | mask) | | | +----------+-----------
+ | | | | | |
encrypt | | v | | +----------------+
+----------------------+ | | | Field Encrypt | AES | Postgres (encrypted | |
| | |------->| PII columns) | | | +----------------+
+----------------------+ | | | | Access
Control: | | - PII read requires explicit role grant
| | - PII read logged to audit trail (ADR-086) | | - PII export triggers
DLP (ADR-089) | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
PII Write Flow: App -> PII Service: plaintext PII PII Service -> Field
Encryptor: encrypt (AES-256-GCM) PII Service -> Postgres: store ciphertext
PII Service -> Audit: log 'PII_WRITE' (field, actor, tenant) PII Read Flow: App
-> PII Service: read PII PII Service -> Authorization: 'actor has PII read role?'
(deny) PII Service -> App: mask '***' (allow) PII Service -> Postgres: SELECT
ciphertext PII Service -> Field Decryptor: decrypt PII Service -> Audit: log
'PII_READ' (field, actor, tenant) PII Service -> App: plaintext PII
DATABASE IMPACT
The students table gains encrypted columns (name_enc, dob_enc, etc.)
replacing the legacy plaintext columns, and a token_id column (CHAR(64))
replacing the legacy student_id column as the primary key. The token_id is a
stable token issued by the Vault tokenization vault. Foreign keys referencing
students (e.g., assessments.student_id) are updated to reference token_id. A
new table pii_access_log (per ADR-086) records every PII access. The data
classification metadata is stored in a new table field_classification (table_name,
column_name, tier). The tokenization vault stores the token-to-identifier
mapping; the application database does not store this mapping. Expected
storage overhead: ~5% (encrypted columns are slightly larger than plaintext;
token_id is 64 bytes vs legacy student_id 16 bytes). The legacy plaintext
columns are migrated per the migration plan and dropped after migration.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 247

PreOne ADR - Volume 4: Security Architecture v3.0
API IMPACT
All PII-returning APIs are updated to apply data minimisation based on the
caller's scopes. The API contract is unchanged at the endpoint level (GET
/students/123 still returns a student), but the field-set returned depends on the
scope. A new endpoint GET /me/data-subject-access exports the principal's PII
as JSON (for GDPR Article 15 access requests); a new endpoint POST /me/data-
subject-erasure initiates the erasure pipeline (for GDPR Article 17 right to be
forgotten). Both endpoints are rate-limited (per ADR-080) and audit-logged
(per ADR-086). The data subject rights pipelines have an SLA of 30 days
(access) and 60 days (erasure), enforced by the batch infrastructure (per
ADR-029). Bulk-export endpoints (which return large PII datasets) are slower
due to per-field KMS calls; this is mitigated by the DEK cache (per ADR-077)
and batching.
UI IMPACT
PII Protection surfaces in the UI as field-level masking and access controls. PII
fields (student name, DOB, address, guardian info, health info) are masked
('***') for users without the PII-read role. Users with the role see a 'Reveal PII'
button that, when clicked, logs the access to the audit trail and displays the
plaintext for 30 seconds before re-masking. The admin UI includes a 'PII Access
Log' page showing recent PII reads (actor, field, tenant, timestamp) for audit.
The 'PII Protection' info panel on the Account page explains the masking and
access-logging policy to users.
SECURITY IMPACT
The multi-layer strategy raises the PII security floor on three dimensions. First,
field-level encryption ensures that a database dump does not reveal plaintext
PII; an attacker with a database dump must also compromise the KMS CMK to
decrypt, which requires AWS credentials (a separate attack surface). Second,
tokenization breaks the correlation between direct identifiers and the rest of
the PII; an attacker with a database dump sees tokens, not identifiers,
preventing the linkage of student records to external databases. Third, data
minimisation in APIs prevents over-disclosure; a compromised caller with a
basic scope sees only public and internal fields, not the full PII record. The audit
logging (per ADR-086) provides a complete record of every PII access, enabling
anomaly detection (per ADR-088) and regulatory reporting. The data subject
rights pipelines operationalise GDPR Articles 15 and 17, reducing the legal
team's manual effort from days to hours per request.
PERFORMANCE IMPACT
The PII protection overhead is dominated by the KMS calls for field-level
encryption (per ADR-077: ~50ms p99 on write, ~3ms p99 on read with cache
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 248

PreOne ADR - Volume 4: Security Architecture v3.0
hit). For a typical student record (10 encrypted fields), the read overhead is
~30ms (10 fields × 3ms, with DEK cache), which is acceptable for the
interactive use case. The tokenization vault lookup adds ~10ms p99 per
identifier; for a typical API response with 1-5 identifiers, the overhead is 10-
50ms. The data minimisation (field filtering at the gateway) is O(1) and adds
negligible latency. The audit-logging write is asynchronous (per ADR-086) and
does not affect response latency. Total PII-protection overhead on a typical
read: ~50ms p99, within the 200ms p99 budget for PII-returning APIs. Bulk-
export endpoints are slower (per-field KMS calls); this is mitigated by batching.
SCALABILITY ANALYSIS
The PII protection subsystem scales with the PII field count and the request
rate. The KMS scaling is addressed in ADR-077 (per-object data keys, DEK
cache). The tokenization vault (Vault HA) scales with the identifier count (~5M
identifiers at steady state, ~50K detokenization calls per second at peak); Vault
handles this with headroom. The audit-log write rate (~5,000 entries per
second at peak) is handled by the async audit pipeline (per ADR-086). The data
subject rights pipelines are batch jobs (per ADR-029) and do not affect the hot
path. At the 5M-principal projection, the KMS call rate (per ADR-077)
approaches the per-account limit; this is mitigated by the DEK cache and by the
multi-region key support (per ADR-077 future evolution). No architectural
change is anticipated before the 2027 horizon.
OPERATIONAL CONSIDERATIONS
The PII protection subsystem requires five operational artefacts. (1) A runbook
for data classification updates: the legal and security teams review the
classification taxonomy quarterly; the runbook covers the update and
propagation. (2) A runbook for tokenization vault management: the vault is HA
(3 nodes); the runbook covers failover and the token-destruction procedure for
erasure. (3) A runbook for data subject rights requests: the runbook covers the
access and erasure pipelines, the SLA tracking, and the legal-team handoff for
edge cases. (4) A runbook for field-level encryption key rotation (per ADR-077):
the runbook covers the annual CMK rotation and the lazy re-encryption. (5) A
runbook for PII access audit review: the security team reviews the audit log
weekly for anomalies (per ADR-088). Per-tenant classification overrides are
propagated within 60 seconds via the configuration service.
RISKS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 249

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation         |
| ------------------- | ---------- | ------ | ------------------ |
| Tokenization vault  | Low        | High   | Vault HA (3        |
| outage breaks       |            |        | nodes); in-memory  |
| detokenization.     |            |        | token cache (5-    |
min TTL) absorbs
brief outage;
sustained outage
triggers incident
response.
| Data classification  | Medium | Medium | Schema-lint CI      |
| -------------------- | ------ | ------ | ------------------- |
| taxonomy drift       |        |        | check rejects new   |
| leaves new PII       |        |        | PII fields without  |
| fields unprotected.  |        |        | classification;     |
quarterly audit by
legal and security
teams.
| Data subject        | Medium | High | PII inventory      |
| ------------------- | ------ | ---- | ------------------ |
| rights pipelines    |        |      | maintained by the  |
| miss PII in legacy  |        |      | legal team;        |
| stores.             |        |      | pipelines tested   |
quarterly with
synthetic data;
legacy-store scan
job.
| KMS rate limit     | Medium | Medium | Bulk-export     |
| ------------------ | ------ | ------ | --------------- |
| (per ADR-077)      |        |        | endpoints       |
| breached by PII-   |        |        | throttled; DEK  |
| heavy bulk export. |        |        | cache; multi-   |
region keys
(future).
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Field-level encryption defeats database- KMS call overhead on every PII read
| dump attacks. |     | (~30ms for 10 fields). |     |
| ------------- | --- | ---------------------- | --- |
Tokenization breaks identifier  Tokenization vault dependency for
| correlation. |     | detokenization. |     |
| ------------ | --- | --------------- | --- |
Data minimisation prevents API over- Per-scope field-set configuration
| disclosure. |     | overhead. |     |
| ----------- | --- | --------- | --- |
Data subject rights pipelines  Batch infrastructure dependency for
| operationalise GDPR/DPDP. |     | erasure. |     |
| ------------------------- | --- | -------- | --- |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  250

PreOne ADR - Volume 4: Security Architecture v3.0
REJECTED ALTERNATIVES
The legacy strategy (uniform RDS encryption, no field-level, no tokenization, no
data minimisation) was rejected because RDS encryption protects only physical
media; a database dump exposes all PII in plaintext, and the legacy APIs return
all columns by default, over-disclosing PII to callers who need only a subset.
Full homomorphic encryption was rejected in ADR-077 as not performant
enough for production use; the same reasoning applies here. The data
warehouse approach (PII only in a separate warehouse, never in the
operational database) was rejected as incompatible with the operational need
to access PII in real time (e.g., a teacher viewing a student's profile during a
parent-teacher conference); the latency of a warehouse query (minutes) is
unacceptable for interactive use, and the warehouse would itself become a
high-value target. Pseudonymisation without encryption (replacing identifiers
with hashes) was rejected because hashes are reversible via brute-force for
low-entropy identifiers (e.g., dates of birth), and hashes do not provide the
integrity guarantee of authenticated encryption. Per-tenant encryption keys
(rather than per-object) were considered for confidential fields and adopted
(per-tenant for confidential, per-object for restricted) as a performance
optimisation; the trade-off is that a single confidential key compromise exposes
all confidential fields in a tenant, which is acceptable given that confidential
fields are less sensitive than restricted fields. The multi-layer strategy is the
only one that satisfies all requirements; the full reasoning is captured in the
Options Considered table.
MIGRATION PLAN
Migration is phased over one quarter alongside the encryption migration (per
ADR-077). Phase 1 (weeks 1-3): deploy the data classification metadata table
and the tokenization vault; classify all existing PII fields. Phase 2 (weeks 4-6):
enable field-level encryption for restricted fields (per-object data keys); legacy
plaintext data is re-encrypted lazily (per ADR-077). Phase 3 (weeks 7-9): enable
tokenization for direct identifiers; foreign keys are migrated from student_id to
token_id in a canary pattern (10% per day). Phase 4 (weeks 10-12): enable data
minimisation in APIs (gateway scope-based field filtering); the legacy full-field
responses are deprecated. Phase 5 (week 13): enable the data subject rights
pipelines (access and erasure); the legacy plaintext columns are dropped.
Rollback is possible at any point by reverting to the legacy strategy; the
encrypted columns are decrypted lazily on read and re-written in plaintext. The
tokenization vault is left in place but the tokens are mapped back to identifiers
during rollback.
TESTING STRATEGY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 251

PreOne ADR - Volume 4: Security Architecture v3.0
The PII protection subsystem is tested at four levels. Unit tests cover the data
classification lookup, the field-level encryption (per ADR-077), the tokenization
(detokenize, tokenize, erasure), and the data minimisation (scope-based field
filtering). Coverage target is 95%. Integration tests cover the full API response
path with encryption, tokenization, and minimisation. End-to-end tests cover
the data subject rights pipelines (access and erasure). Security tests cover the
database-dump resistance (a dump must not reveal plaintext PII), the
correlation resistance (tokens must not be linkable to identifiers without the
vault), and the data minimisation enforcement (a caller must not see fields
outside their scope). Performance tests cover the PII-protection overhead on
typical read paths. The acceptance criterion is zero plaintext-PII exposure
incidents in the post-cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Field-level encryption overhead p99:
target under 50ms per record, alert above 100ms. (2) Tokenization vault lookup
latency p99: target under 10ms, alert above 50ms. (3) Data subject rights
pipeline SLA: target 100% within SLA (30 days access, 60 days erasure), alert
on any breach. (4) PII access audit log completeness: target 100%, alert on any
gap (per ADR-086). (5) Data classification coverage: target 100% of PII fields
classified, alert on any unclassified PII field (schema-lint CI check). (6) Data
minimisation rejection rate: target under 0.1% of API calls (callers requesting
fields outside their scope), alert above 1% (possible misconfiguration or attack).
A dedicated PII-protection dashboard surfaces these alongside the per-tier field
distribution, the tokenization vault health, and the data subject rights pipeline
backlog. Anomaly detection (per ADR-088) flags unusual PII access patterns.
FUTURE EVOLUTION
The PII protection subsystem is expected to evolve in three directions. First, the
system may add differential privacy for analytics queries (aggregating PII with
noise to prevent re-identification); this is monitored but not planned for v1
because of the complexity. Second, the system may integrate with the AWS
Macie service for automated PII discovery (detecting unclassified PII fields via
ML); this is planned for v2. Third, the system may add consent management
(tracking per-principal consent for each PII processing purpose), supporting
GDPR Article 7 consent requirements more explicitly; this is planned for v2 and
is tracked as a follow-up. The trigger for revisiting this ADR is a regulatory
change (e.g., EU AI Act requiring PII protection in AI training data) or a
material change in the PII inventory.
RELATED ADRS
● ADR-061 - Identity Model (PII fields belong to principals)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 252

PreOne ADR - Volume 4: Security Architecture v3.0
● ADR-076 - API Security (data minimisation enforced at gateway)
● ADR-077 - Encryption (field-level encryption via KMS envelope)
● ADR-078 - Secrets Management (tokenization vault in Vault)
● ADR-068 - Scope Model (scopes drive data minimisation field-set)
● ADR-086 - Audit Trail (PII access audit-logged)
● ADR-053 - Data Retention (PII retention policy)
REFERENCES
● GDPR - General Data Protection Regulation. European Union. 2016.
● DPDP - Digital Personal Data Protection Act. India. 2023.
● COPPA - Children's Online Privacy Protection Act. US. 1998.
● NIST SP 800-122 - Guide to Protecting the Confidentiality of PII. NIST.
2010.
● PreOne Engineering Handbook, Section 4.19 - PII Protection. Internal.
2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-01 Draft Platform Security Initial draft;
Architect options
enumerated;
consultation with
security and
engineering teams
2025-09-17 Proposed Platform Security Submitted to
Architect Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
2026-07-15 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 253

PreOne ADR - Volume 4: Security Architecture v3.0
Architect Platform Security Architect
Tech Lead Authentication Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● PII fields identified and classified (Done)
● Field-level encryption deployed (ADR-079) (Done)
● PII-read role + audit logging (Done)
● PII masking in UI for unauthorized users (Done)
● PII Access Log admin page (Done)
● Quarterly PII access review (Scheduled)
AD R -080
Rate Limiting
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a three-tier token-bucket rate limiter: per-IP (anonymisation tier, 100
req/min), per-user (authenticated tier, 1000 req/min), per-tenant (tenant
tier, 10000 req/min). Limits are enforced at the API gateway (per ADR-076)
via Redis token buckets, with per-tenant overrides and a burst allowance.
Exceeding the limit returns HTTP 429 with a Retry-After header.
STATUS
Status Accepted
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 254

PreOne ADR - Volume 4: Security Architecture v3.0
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on performance
target breach, or on traffic pattern
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The PreOne platform is exposed to several rate-limit-relevant threats. The first
is credential stuffing: an attacker with a stolen credential list attempts high-
volume login attempts. The second is scraping: a third party scrapes public
course catalog data at high volume. The third is noisy-neighbour: a single
tenant's bulk-export job saturates the API gateway, degrading service for other
tenants. The fourth is abuse: a student scripts rapid API calls to game a
leaderboard or an assessment system. The 2025 Q3 security review found that
the legacy platform has a single per-IP rate limit (100 req/min) implemented in
nginx, which is insufficient on three grounds. First, per-IP only does not protect
against authenticated abuse (a student with valid credentials scripting rapid
calls). Second, the single tier does not protect against noisy-neighbour (a
tenant's bulk export saturates the gateway). Third, the nginx implementation is
hard to configure per-tenant. The ARB considered four rate-limiting strategies.
The first is the legacy strategy (single per-IP tier), which is rejected. The second
is the three-tier token-bucket strategy selected here. The third is a request-
queue strategy (all requests go through a queue with backpressure), which is
rejected as adding latency to all requests. The fourth is a per-endpoint strategy
(each endpoint has its own limit), which is rejected as operationally complex
and brittle. This ADR defines rate limiting. It depends on ADR-076 (API
Security) for the gateway enforcement.
BUSINESS DRIVERS
The 2026 international expansion requires rate limiting aligned with each
regulatory regime: GDPR Article 32 recommends rate limiting as a DoS
defence; DPDP requires audit logs of rate-limit events; COPPA does not
mandate but the parental-consent flow is vulnerable to scripted bypass, which
rate limiting mitigates. The three-tier strategy satisfies all three. The business
also requires that one tenant's bulk-export job not degrade service for other
tenants (noisy-neighbour protection), which drives the per-tenant tier. Finally,
the business requires that legitimate bursty traffic (e.g., a teacher loading a
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 255

PreOne ADR - Volume 4: Security Architecture v3.0
class roster) not be throttled, which drives the burst allowance in the token
bucket.
PROBLEM STATEMENT
The legacy rate-limiting strategy (single per-IP tier in nginx) does not protect
against authenticated abuse, noisy-neighbour, or scripted bypass. PreOne
needs a three-tier token-bucket rate limiter (per-IP, per-user, per-tenant)
enforced at the API gateway, with per-tenant overrides and a burst allowance,
returning HTTP 429 with a Retry-After header.
CONSTRAINTS
● Rate-limit checks must complete within 2ms p99 to avoid adding
latency.
● The rate limiter must be tenant-aware (per-tenant limits and overrides).
● The rate limiter must be user-aware (per-user limits for authenticated
requests).
● The rate limiter must support a burst allowance (legitimate bursty
traffic not throttled).
● Rate-limit events (429 responses) must be audit-logged per ADR-086.
ASSUMPTIONS
● Redis (per ADR-046) provides sufficient throughput for the token-
bucket operations (~10,000 ops/sec at peak).
● The API gateway (per ADR-076) supports Redis-based rate limiting via
a Lua script.
● The default limits (100 req/min per-IP, 1000 req/min per-user, 10000
req/min per-tenant) are acceptable to the largest customers.
● Per-tenant overrides are configured by tenant administrators via the
admin API.
● The 429 response with Retry-After header is honoured by the web and
mobile clients.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 256

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
Three-tier token  Protects against  2ms p99 added to  Adopted
| bucket (per-IP,  | unauthenticated    | every request.       |     |
| ---------------- | ------------------ | -------------------- | --- |
| per-user, per-   | abuse (per-IP),    | Redis dependency.    |     |
| tenant) at the   | authenticated      | Per-tenant           |     |
| gateway.         | abuse (per-user),  | override             |     |
|                  | and noisy-         | configuration drift  |     |
|                  | neighbour (per-    | risk.                |     |
tenant). Burst
allowance
preserves
legitimate bursty
traffic. Per-tenant
overrides allow
market-specific
calibration.
| Legacy: single  | Simple. Single  | Does not protect  | Rejected |
| --------------- | --------------- | ----------------- | -------- |
| per-IP tier in  | tier. No Redis  | against           |          |
| nginx.          | dependency.     | authenticated     |          |
|                 | Familiar nginx  | abuse. Does not   |          |
|                 | configuration.  | protect against   |          |
noisy-neighbour.
Hard to configure
per-tenant.
Request queue  Provides graceful  Adds latency to all  Rejected
| with backpressure  | degradation under  | requests, even   |     |
| ------------------ | ------------------ | ---------------- | --- |
| (all requests      | load. Bounded      | when not under   |     |
| through a queue).  | queue depth. No    | load. Complex    |     |
|                    | request dropped    | queue            |     |
|                    | silently.          | management. Not  |     |
suitable for
interactive traffic.
| Per-endpoint      | Fine-grained        | Configuration       | Rejected |
| ----------------- | ------------------- | ------------------- | -------- |
| limits (each      | control. Per-       | grows               |          |
| endpoint has its  | endpoint            | quadratically with  |          |
| own limit).       | calibration.        | endpoint count.     |          |
|                   | Specific endpoints  | Brittle             |          |
|                   | (bulk-export) can   | (misconfiguration   |          |
|                   | have higher limits. | throttles           |          |
legitimate traffic
or allows abuse).
Operationally
complex.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  257

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
We will adopt a three-tier token-bucket rate limiter enforced at the API
gateway (per ADR-076). The three tiers are: per-IP (anonymisation tier,
default 100 req/min, protects against unauthenticated abuse), per-user
(authenticated tier, default 1000 req/min, protects against authenticated
abuse), per-tenant (tenant tier, default 10000 req/min, protects against
noisy-neighbour). The token bucket has a burst allowance equal to 2x the
steady-state rate, allowing legitimate bursty traffic. Limits are stored in
Redis as token-bucket keys with TTL; the gateway executes a Lua script that
atomically decrements the bucket and returns the remaining tokens.
Exceeding the limit returns HTTP 429 with a Retry-After header (in
seconds). Per-tenant overrides are configurable via the admin API. Rate-
limit events are audit-logged per ADR-086.
DETAILED RATIONALE
The three-tier token-bucket strategy is selected because it is the only option
that simultaneously protects against unauthenticated abuse, authenticated
abuse, and noisy-neighbour, while preserving legitimate bursty traffic. The
legacy strategy (single per-IP tier) is rejected because per-IP only does not
protect against authenticated abuse (a student with valid credentials scripting
rapid calls is not throttled by per-IP if they are behind a school NAT, which
hundreds of students share). The request-queue strategy (all requests through
a queue with backpressure) was rejected as adding latency to all requests, even
when the system is not under load; the token bucket adds latency only when the
limit is approached. The per-endpoint strategy (each endpoint has its own limit)
was rejected as operationally complex and brittle: the limit configuration grows
quadratically with the endpoint count, and a misconfiguration can either
throttle legitimate traffic or allow abuse. The token-bucket algorithm (rather
than fixed-window or sliding-window) is selected because it naturally supports
a burst allowance: the bucket fills at the steady-state rate and can accumulate
up to the burst capacity, so a burst of requests is allowed if the bucket has
accumulated tokens. This matches the traffic pattern of the PreOne platform
(bursty page loads, periodic bulk exports). The Lua script executes atomically
in Redis, ensuring that concurrent requests do not race on the bucket
decrement. The three tiers are enforced in order: per-IP first (cheapest, rejects
unauthenticated abuse), per-user second (rejects authenticated abuse), per-
tenant third (rejects noisy-neighbour). The most restrictive tier wins: if a
request is under the per-IP limit but over the per-user limit, it is rejected with a
429. The 429 response includes a Retry-After header (in seconds) computed
from the bucket fill rate, enabling clients to retry intelligently. The per-tenant
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 258

PreOne ADR - Volume 4: Security Architecture v3.0
tier is the key innovation for noisy-neighbour protection: a tenant's bulk-export
job is throttled at the tenant tier, preventing it from saturating the gateway and
degrading service for other tenants. The per-tenant limit is configurable per
tenant, allowing larger customers to negotiate higher limits. The audit logging
of 429 responses enables anomaly detection (per ADR-088): a tenant with a
sustained high 429 rate may be running an abusive integration, which the
support team can investigate.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | RATE LIMITING
SUBSYSTEM | +-------------------------------------------------------------+ | API
Gateway (per ADR-076) | | on every request:
| | 1. compute tier keys (ip, user, tenant) | | 2. execute Lua script
(atomic) | | 3. if any tier exhausted -> 429 + Retry-After |
+-------------------------------------------------------------+ | Lua script (atomic)
| v | | Redis Token Buckets
| | key: rl:ip:{ip} - bucket: 100/min, burst 200 | | key: rl:user:{user_id}
- bucket: 1000/min, burst 2000 | | key: rl:tenant:{tid} - bucket: 10000/min,
burst 20000 | | val: {tokens, last_refill} | | TTL: 1 hour
| +-------------------------------------------------------------+ | Per-Tenant Overrides
(configuration service, per ADR-038) | | tenant_id -> {ip_limit, user_limit,
tenant_limit} | +-------------------------------------------------------------+ | 429 Response
| | HTTP 429 Too Many Requests | | Retry-After: 30
(seconds) | | audit-logged per ADR-086
| +-------------------------------------------------------------+
SEQUENCE DIAGRAM
Client -> API Gateway: GET /resource (Authorization: Bearer JWT) API Gateway
-> Redis: EVAL lua_script (rl:ip, rl:user, rl:tenant) Redis -> API Gateway:
{ip_tokens=80, user_tokens=950, tenant_tokens=9500} Note over API Gateway:
all tiers > 0, allow API Gateway -> Backend: forward request Backend -> API
Gateway: 200 OK {resource} API Gateway -> Client: 200 OK {resource} ---
Client -> API Gateway: GET /resource (rapid burst) API Gateway -> Redis: EVAL
lua_script Redis -> API Gateway: {ip_tokens=0} (exhausted) API Gateway ->
Audit Log: 429 event (per ADR-086) API Gateway -> Client: 429 Too Many
Requests, Retry-After: 30
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-080 — Rate Limiting -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | API Gateway | recv | Rate
Limiter | | | | | req | | | | +----------------+
+----------+-----------+ | | | | |
| check (Redis) | | v | | +----------------+
+----------------------+ | | | Redis | incr | Sliding window | | | |
|------->| (per user + per IP) | | | +----------------+ +----------+-----------+
| | | | | | exceed?
| | v | | +----------------+ +----------------------+
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 259

PreOne ADR - Volume 4: Security Architecture v3.0
| | | API Gateway | 429 | Client | | | | |------->| (Retry-
After header) | | | +----------------+ +----------------------+ | |
| | WAF (ADR-084) provides IP-based rate-limit at edge |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Rate Limit Check Flow: Client -> API Gateway: request API Gateway -> Rate
Limiter: 'check user X + IP Y' Rate Limiter -> Redis: INCR (sliding window)
Redis -> Rate Limiter: current count (under limit) Rate Limiter -> API Gateway:
allow (over limit) Rate Limiter -> API Gateway: deny + Retry-After API
Gateway -> Client: response or 429 Tiered Limits: - Login endpoint: 10/min per
IP (brute force protection) - General API: 1000/min per user (normal usage) -
Bulk export: 10/hour per user (data egress protection)
DATABASE IMPACT
No new tables are introduced. Rate-limit state lives entirely in Redis (per
ADR-046), which is the canonical store for ephemeral rate-limit data. Per-
tenant overrides are stored in the configuration service (per ADR-038) and
propagated to the gateway within 60 seconds. Audit logs of 429 responses are
written to audit_trail per ADR-086. Expected Redis memory at steady state:
~3M token-bucket keys (1M IPs + 500K users + 1K tenants × 3 tiers) × 100
bytes = 300MB, well within Redis Cluster capacity. The token-bucket keys have
a 1-hour TTL, so the key count is bounded by the active-principal and active-IP
counts, not the cumulative request count.
API IMPACT
The rate limiter is transparent to the API layer: the gateway enforces the limits
before forwarding to the backend, so the backend sees only allowed requests.
The only API-visible change is the 429 response (HTTP 429 Too Many Requests
with a Retry-After header), which clients must handle gracefully (the web and
mobile clients implement exponential backoff with jitter). A new endpoint
GET /me/rate-limit-status allows principals to check their current rate-limit
status (remaining tokens per tier) for the self-service UI. Administrative
endpoints GET /admin/tenants/{id}/rate-limits and PUT allow tenant operators
to view and configure per-tenant overrides. All rate-limit events (429
responses) are audit-logged per ADR-086. The rate limiter does not apply to the
operator-API gateway (per ADR-076), which is low-traffic and MFA-gated.
UI IMPACT
Rate Limiting surfaces in the UI as 429 (Too Many Requests) responses. When
a user exceeds the rate limit, the UI displays a friendly 'You are doing that too
quickly. Please wait X seconds and try again.' message with a countdown timer.
The API client SDK includes automatic exponential backoff for 429 responses,
so most users never see the message. For persistent abuse (e.g., a script
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 260

PreOne ADR - Volume 4: Security Architecture v3.0
hammering the login endpoint), the UI shows an 'Account temporarily locked'
page with a 'contact admin' link. The admin UI includes a 'Rate Limit Activity'
dashboard showing top rate-limited IPs and users, useful for identifying abuse
patterns.
SECURITY IMPACT
The three-tier rate limiter raises the DoS and abuse security floor on three
dimensions. First, the per-IP tier protects against unauthenticated credential
stuffing: an attacker with a stolen credential list is throttled to 100 req/min per
IP, making large-scale stuffing infeasible (a 1M-credential list would take 166
hours per IP). Second, the per-user tier protects against authenticated abuse: a
student scripting rapid API calls is throttled to 1000 req/min, preventing
leaderboard gaming and assessment-system abuse. Third, the per-tenant tier
protects against noisy-neighbour: a tenant's bulk-export job is throttled at
10000 req/min, preventing it from saturating the gateway and degrading
service for other tenants. The audit logging of 429 responses enables anomaly
detection (per ADR-088): a tenant with a sustained high 429 rate is flagged for
investigation. The Redis-based implementation is HA (3 nodes); on Redis
outage, the rate limiter fails open (allows all requests) to avoid blocking
legitimate traffic, with a high-severity alert.
PERFORMANCE IMPACT
The rate-limit check adds 1-2ms p99 to every request, dominated by the Redis
Lua-script execution (which is atomic and O(1)). At 5,000 requests per second
(projected peak), this is 5,000 Redis operations per second, well within a single
Redis node's capacity (~100K ops/sec). The Lua script is pre-loaded into Redis
(SCRIPT LOAD) to avoid re-transmission on every call. The per-tier key
computation (IP hashing, user_id extraction, tenant_id extraction) is O(1) and
adds negligible latency. The 429 response path is faster than the 200 path (no
backend call), so the rate limiter actually reduces backend load during abuse.
The per-tenant override lookup is cached in the gateway (5-minute TTL), so it
does not add per-request latency. Total rate-limit overhead: ~2ms p99, within
the 100ms p99 API budget.
SCALABILITY ANALYSIS
The rate-limit subsystem scales with the request rate, not the principal count.
At 5,000 requests per second, the Redis Lua-script execution rate is 5,000
ops/sec, well within a single Redis node's capacity. At 10,000 requests per
second (2027 projection), the Redis Cluster is expanded to 3 shards (sharding
by tenant_id), which is a configuration change. The token-bucket key count
(~3M at steady state) is bounded by the 1-hour TTL; the Redis memory usage
(~300MB) is well within capacity. The per-tenant override configuration is
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 261

PreOne ADR  -  Volume 4: Security Architecture  v3.0
small (~1KB per tenant, ~1MB total) and is cached in the gateway. The audit-
log write rate (~100 429 responses per second at peak) is handled by the async
audit pipeline (per ADR-086). No architectural change is anticipated before the
2027 horizon.
OPERATIONAL CONSIDERATIONS
The rate-limiting subsystem requires four operational artefacts. (1) A runbook
for per-tenant override requests: tenant administrators request limit increases
via the admin API; the runbook covers the approval workflow and the audit
logging. (2) A runbook for Redis outage: the on-call engineer must verify that
the fail-open behaviour activates (legitimate traffic continues) and that the
high-severity alert is raised; sustained outage triggers incident response per
ADR-089. (3) A runbook for 429-rate anomaly investigation: a tenant with a
sustained high 429 rate is flagged by ADR-088; the runbook covers the
investigation and the possible integration-abuse response. (4) A runbook for
default-limit tuning: the security team reviews the 429 rate monthly and adjusts
the default limits if the rate exceeds 5% of requests (possible friction) or falls
below   0.1%   (possible   insufficient   protection).   Per-tenant   overrides   are
propagated within 60 seconds via the configuration service.
RISKS
| Risk           | Likelihood | Impact | Mitigation           |
| -------------- | ---------- | ------ | -------------------- |
| Redis outage   | Low        | Medium | Fail-open            |
| disables rate  |            |        | behaviour (allows    |
| limiting.      |            |        | all requests); high- |
severity alert;
Redis Cluster HA.
| Per-IP limit causes  | High   | Medium | Per-IP limit is    |
| -------------------- | ------ | ------ | ------------------ |
| friction for school  |        |        | generous           |
| NAT egress IPs       |        |        | (100/min) and is   |
| (hundreds of         |        |        | overridden to      |
| students share       |        |        | higher values for  |
| one IP).             |        |        | known school IPs.  |
| Default limits are   | Medium | Low    | Per-tenant         |
| too restrictive for  |        |        | overrides          |
| legitimate bulk-     |        |        | available; bulk-   |
| export jobs.         |        |        | export endpoints   |
have separate
higher limits.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  262

PreOne ADR - Volume 4: Security Architecture v3.0
Risk Likelihood Impact Mitigation
429 audit log Low Medium 429 events are
overwhelms the sampled (1 in 100)
audit pipeline. for audit logging;
aggregate counts
are logged
separately.
TRADE-OFFS
We Gain We Lose
Three-tier protection covers 2ms p99 added to every request.
unauthenticated, authenticated, and
noisy-neighbour abuse.
Per-tenant overrides allow market- Configuration drift complicates support.
specific calibration.
Burst allowance preserves legitimate Burst allowance reduces the effective
bursty traffic. protection during sustained abuse.
429 with Retry-After enables intelligent Clients must implement backoff
client retry. correctly (SDK guidance required).
REJECTED ALTERNATIVES
The legacy strategy (single per-IP tier in nginx) was rejected because per-IP
only does not protect against authenticated abuse (a student with valid
credentials scripting rapid calls is not throttled by per-IP if they are behind a
school NAT), the single tier does not protect against noisy-neighbour (a tenant's
bulk export saturates the gateway), and the nginx implementation is hard to
configure per-tenant. The request-queue strategy (all requests through a queue
with backpressure) was rejected as adding latency to all requests, even when
the system is not under load; the token bucket adds latency only when the limit
is approached, which is the correct trade-off for an interactive education
platform. The per-endpoint strategy (each endpoint has its own limit) was
rejected as operationally complex and brittle: the limit configuration grows
quadratically with the endpoint count, and a misconfiguration can either
throttle legitimate traffic (causing user friction) or allow abuse (defeating the
purpose). Fixed-window rate limiting (rather than token bucket) was rejected
because it does not support a burst allowance, causing legitimate bursty traffic
(e.g., a teacher loading a class roster) to be throttled. Sliding-window rate
limiting was rejected as more expensive than token bucket without meaningful
benefit at PreOne's traffic profile. The three-tier token-bucket strategy is the
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 263

PreOne ADR - Volume 4: Security Architecture v3.0
only one that satisfies all requirements; the full reasoning is captured in the
Options Considered table.
MIGRATION PLAN
Migration is phased over two weeks alongside the API-gateway migration (per
ADR-076). Phase 1 (days 1-3): deploy the rate-limiting subsystem (Redis token
buckets, Lua script, gateway integration) in shadow mode (limits are computed
and logged but not enforced). Phase 2 (days 4-6): enable per-IP enforcement
(the legacy nginx per-IP limit is decommissioned); per-user and per-tenant
limits remain in shadow mode. Phase 3 (days 7-9): enable per-user enforcement
for authenticated endpoints. Phase 4 (days 10-12): enable per-tenant
enforcement; configure per-tenant overrides for the largest customers. Phase 5
(days 13-14): the shadow-mode logging is removed; the legacy nginx per-IP
limit configuration is deleted. Rollback is possible at any point by disabling the
new rate limiter (the gateway reverts to no rate limiting, which is acceptable for
a brief rollback window); the legacy nginx per-IP limit can be re-enabled as a
fallback if needed.
TESTING STRATEGY
The rate-limiting subsystem is tested at four levels. Unit tests cover the token-
bucket algorithm (refill, decrement, exhaustion), the Lua script (atomicity,
correctness), and the per-tier key computation. Coverage target is 95%.
Integration tests cover the gateway-to-Redis flow, the per-tenant override
propagation, and the 429 response path. End-to-end tests cover the full request
path under rate-limit pressure (a scripted burst of requests must be throttled
correctly). Security tests cover the per-IP bypass attempt (using X-Forwarded-
For spoofing, which must be rejected), the per-user bypass attempt (using
multiple JWTs, which must be throttled per-user), and the noisy-neighbour
simulation (a tenant's bulk export must not degrade other tenants).
Performance tests cover the rate-limit check at projected peak (5,000 RPS). The
acceptance criterion is zero rate-limit bypass incidents in the post-cutover
penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) Rate-limit check latency p99: target under
2ms, alert above 5ms. (2) 429 response rate per tier: target under 1% of
requests (per-IP, per-user), alert above 5% (possible attack or friction). (3) Per-
tenant 429 rate: target under 0.5%, alert above 2% (possible noisy-neighbour
or abusive integration). (4) Redis Lua-script execution rate: target under 5,000
ops/sec, alert above 10,000 (sizing problem). (5) Fail-open activation rate:
target 0, alert on any activation (Redis issue). (6) Per-tenant override count:
target under 10% of tenants (most use defaults), alert above 20% (possible
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 264

PreOne ADR - Volume 4: Security Architecture v3.0
default-limit tuning needed). A dedicated rate-limiting dashboard surfaces
these alongside the per-tier token-bucket distribution, the top 429-source IPs
and users, and the per-tenant override inventory. Anomaly detection (per
ADR-088) flags unusual patterns such as a tenant-wide 429 burst (possible
attack) or a single IP's 429 rate exceeding 1000/min (possible credential
stuffing).
FUTURE EVOLUTION
The rate-limiting subsystem is expected to evolve in three directions. First, the
system may add adaptive rate limiting that adjusts limits based on the backend
health (lower limits when the backend is degraded), providing graceful
degradation under load; this is monitored but not planned for v1. Second, the
system may add per-endpoint overrides for specific high-volume endpoints
(e.g., bulk-export), allowing finer-grained control without the per-endpoint
strategy's complexity; this is planned for v2. Third, the system may integrate
with the anomaly-detection service (per ADR-088) to dynamically lower limits
for principals exhibiting abusive patterns, providing a real-time abuse
response; this is tracked as a follow-up. The trigger for revisiting this ADR is a
material change in the traffic profile (e.g., a new high-volume integration) or a
regulatory change requiring stricter rate-limit auditing.
RELATED ADRS
● ADR-046 - Caching (Redis is the rate-limit store)
● ADR-076 - API Security (rate limiter enforced at gateway)
● ADR-068 - Scope Model (scopes determine tier for authenticated
requests)
● ADR-086 - Audit Trail (429 events audit-logged)
● ADR-088 - Security Monitoring (429 anomalies detected)
● ADR-038 - Configuration Service (per-tenant overrides)
REFERENCES
● RFC 7231 - Hypertext Transfer Protocol (HTTP/1.1): Semantics and
Content, Section 6.5.11 (429). IETF. 2014.
● Redis Documentation - Atomic Operations with Lua. Redis Labs. 2024.
● Cloudflare - Understanding Rate Limiting. Cloudflare. 2024.
● OWASP - Denial of Service Cheat Sheet. OWASP. 2024.
● PreOne Engineering Handbook, Section 4.20 - Rate Limiting. Internal.
2025.
DECISION HISTORY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 265

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Platform Security Architect  |     |
| ----------- | --- | ---------------------------- | --- |
| Tech Lead   |     | Authentication Platform Lead |     |
| ARB Chair   |     | Architecture Review Board    |     |
| Approved On |     | 2025-10-15                   |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Redis-backed rate limiter deployed (Done)
● Tiered limits (login 10/min, API 1000/min, export 10/hr) (Done)
● Rate limit headers in API responses (Done)
● API client SDK with exponential backoff (Done)
● Rate Limit Activity dashboard (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  266

PreOne ADR - Volume 4: Security Architecture v3.0
● Quarterly rate-limit tuning review (Scheduled)
AD R -081
Security Headers
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a comprehensive security-headers policy enforced at the API gateway
(per ADR-076): Content-Security-Policy (with Trusted Types, per ADR-083),
Strict-Transport-Security (max-age 1 year, preload), X-Frame-Options
(DENY), X-Content-Type-Options (nosniff), Referrer-Policy (strict-origin-
when-cross-origin), and Permissions-Policy (restrict camera, microphone,
geolocation). Headers are tenant-configurable with safe defaults.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on regulatory
update, or on OWASP Top 10
refresh
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The PreOne platform serves a web frontend (React SPA) and a mobile app; the
web frontend is the primary attack surface for browser-based attacks. The 2025
Q3 security review found that the legacy platform sets only two security
headers (X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff),
which leaves the platform exposed to several attacks. First, the absence of
Content-Security-Policy allows XSS attacks to execute arbitrary scripts (the
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 267

PreOne ADR - Volume 4: Security Architecture v3.0
2024 incident involved an XSS in the assessment-feedback widget that
exfiltrated session cookies). Second, the absence of Strict-Transport-Security
allows SSL stripping on the first request to a new browser. Third, the absence
of Referrer-Policy leaks PII in URL parameters via the Referer header to third-
party integrations. The ARB considered four security-headers strategies. The
first is the legacy strategy (two headers), which is rejected. The second is the
comprehensive strategy selected here. The third is a strict CSP (no inline
scripts, no eval, no external domains), which is rejected as incompatible with
the legacy third-party analytics and chat widgets. The fourth is a per-page CSP
(different policy per route), which is rejected as operationally complex and
brittle. This ADR defines security headers. It depends on ADR-076 (API
Security) for the gateway enforcement and ADR-083 (XSS Prevention) for the
CSP and Trusted Types.
BUSINESS DRIVERS
The 2026 international expansion requires security headers aligned with each
regulatory regime: GDPR Article 32 recommends HSTS; DPDP does not
mandate but the parental-consent flow is vulnerable to clickjacking without X-
Frame-Options; COPPA does not mandate but the minor-protection
expectations effectively require CSP. The comprehensive strategy satisfies all
three. The business also requires that the legacy third-party widgets (analytics,
chat) continue to work, which drives the per-domain allow-list in the CSP.
Finally, the business requires that the headers be tenant-configurable (e.g., a
tenant may allow an embedded iframe for a specific integration), which drives
the per-tenant override design.
PROBLEM STATEMENT
The legacy security-headers strategy (only X-Frame-Options and X-Content-
Type-Options) leaves the platform exposed to XSS, SSL stripping, and Referer
leakage. PreOne needs a comprehensive security-headers policy enforced at
the gateway: CSP with Trusted Types, HSTS, X-Frame-Options, X-Content-
Type-Options, Referrer-Policy, and Permissions-Policy, with per-tenant
overrides.
CONSTRAINTS
● Headers must be enforced at the API gateway (per ADR-076) for all
responses, including errors.
● CSP must allow the legacy third-party widgets (analytics, chat) via a
per-domain allow-list.
● HSTS must include the preload directive and be submitted to the HSTS
preload list.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 268

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● Headers must be tenant-configurable (e.g., a tenant may allow a
specific iframe embed).
● Header changes must be tested in staging with a CSP report-only mode
before enforcement.
ASSUMPTIONS
● The web frontend (React SPA) can be refactored to comply with a strict
CSP (no inline scripts) within the migration window.
● Trusted Types (per ADR-083) are supported by all modern browsers
used by PreOne principals.
● The legacy third-party widgets (analytics, chat) provide their scripts via
fixed domains that can be allow-listed.
● The HSTS preload list accepts the PreOne domain (the domain must
satisfy the preload requirements).
● Per-tenant overrides are configured by tenant administrators via the
admin API and reviewed quarterly.
OPTIONS CONSIDERED
| Option             | Pros                | Cons                 | Verdict |
| ------------------ | ------------------- | -------------------- | ------- |
| Comprehensive:     | Defends against     | Legacy frontend      | Adopted |
| CSP + HSTS + X-    | XSS (CSP), SSL      | refactoring          |         |
| Frame-Options +    | stripping (HSTS),   | required (inline     |         |
| X-Content-Type-    | clickjacking (X-    | scripts to nonced).  |         |
| Options +          | Frame-Options),     | HSTS preload         |         |
| Referrer-Policy +  | MIME sniffing       | makes HTTP           |         |
| Permissions-       | (nosniff), Referer  | rollback             |         |
| Policy.            | leakage (Referrer-  | infeasible. Per-     |         |
|                    | Policy), unwanted   | tenant override      |         |
|                    | permissions         | management           |         |
|                    | (Permissions-       | overhead.            |         |
Policy). Tenant-
configurable. CSP
report-only mode
for safe rollout.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  269

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option           | Pros             | Cons           | Verdict  |
| ---------------- | ---------------- | -------------- | -------- |
| Legacy: X-Frame- | Simple. Two      | No CSP (XSS    | Rejected |
| Options + X-     | headers. No      | attacks not    |          |
| Content-Type-    | frontend         | blocked). No   |          |
| Options only.    | refactoring. No  | HSTS (SSL      |          |
|                  | HSTS preload     | stripping      |          |
|                  | commitment.      | possible). No  |          |
Referrer-Policy
(PII leakage).
2024 XSS incident
demonstrated the
gap.
| Strict CSP (no       | Strongest XSS     | Incompatible with    | Rejected |
| -------------------- | ----------------- | -------------------- | -------- |
| inline, no eval, no  | protection. No    | legacy third-party   |          |
| external domains).   | third-party       | widgets (analytics,  |          |
|                      | domains allowed.  | chat loaded from     |          |
|                      | Simple policy.    | external domains).   |          |
Would require
replacing widgets
or building in-
house equivalents.
Business-
unacceptable.
| Per-page CSP       | Fine-grained        | Configuration      | Rejected |
| ------------------ | ------------------- | ------------------ | -------- |
| (different policy  | control. Each       | grows with route   |          |
| per route).        | route has minimal   | count. Brittle     |          |
|                    | policy. Reduces     | (misconfiguration  |          |
|                    | attack surface per  | blocks legitimate  |          |
|                    | page.               | scripts).          |          |
Operationally
complex. Hard to
audit.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  270

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
We will adopt a comprehensive security-headers policy enforced at the API
gateway (per ADR-076). The headers are: Content-Security-Policy (default-
src 'self'; script-src 'self' 'nonce-{random}' https://analytics.example
https://chat.example; require-trusted-types-for 'script'; trusted-types
default); Strict-Transport-Security (max-age=31536000;
includeSubDomains; preload); X-Frame-Options (DENY); X-Content-Type-
Options (nosniff); Referrer-Policy (strict-origin-when-cross-origin);
Permissions-Policy (camera=(), microphone=(), geolocation=()). The CSP
includes a per-request nonce for inline scripts (allowed only with the nonce)
and a per-domain allow-list for third-party widgets. Headers are tenant-
configurable via the admin API, with safe defaults. CSP changes are tested
in report-only mode before enforcement, with violations logged to the SIEM
(per ADR-088).
DETAILED RATIONALE
The comprehensive strategy is selected because it is the only option that
simultaneously protects against XSS, SSL stripping, clickjacking, MIME
sniffing, Referer leakage, and unwanted permission grants. The legacy strategy
(two headers) is rejected because the absence of CSP allows XSS attacks (the
2024 incident demonstrated this), the absence of HSTS allows SSL stripping,
and the absence of Referrer-Policy leaks PII in URL parameters. The strict CSP
(no inline, no eval, no external domains) was rejected as incompatible with the
legacy third-party analytics and chat widgets, which are loaded via external
domains and use inline scripts. The business requires that these widgets
continue to work, so the CSP must allow-list their domains. The per-page CSP
(different policy per route) was rejected as operationally complex and brittle:
the policy configuration grows with the route count, and a misconfiguration can
either block legitimate scripts (causing user friction) or allow attacks
(defeating the purpose). The CSP uses a per-request nonce for inline scripts
(rather than 'unsafe-inline') because nonces provide stronger security: an
attacker who can inject an inline script cannot guess the nonce, whereas
'unsafe-inline' allows any inline script. The Trusted Types directive (per
ADR-083) further hardens the CSP by requiring that all DOM sinks
(innerHTML, etc.) receive only Trusted Types, preventing DOM-based XSS. The
third-party widget domains are allow-listed explicitly (analytics.example,
chat.example); adding a new widget requires a CSP change, which is reviewed
by the security team. HSTS with preload ensures that browsers always use
HTTPS for the PreOne domain, even on the first request (the preload list is built
into the browser). This defeats SSL stripping attacks. The max-age of 1 year is
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 271

PreOne ADR - Volume 4: Security Architecture v3.0
the recommended value; the preload directive opts the domain into the HSTS
preload list, which is submitted once and reviewed annually. X-Frame-Options:
DENY prevents the PreOne pages from being embedded in iframes on any other
site, defeating clickjacking attacks. The Permissions-Policy restricts the
camera, microphone, and geolocation APIs, preventing third-party widgets
from accessing them without explicit user consent. The Referrer-Policy (strict-
origin-when-cross-origin) leaks only the origin (not the full URL) to third-party
domains, preventing PII leakage via URL parameters.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | SECURITY HEADERS
SUBSYSTEM | +-------------------------------------------------------------+ | API
Gateway (per ADR-076) | | on every response (200, 4xx,
5xx): | | set Content-Security-Policy: ... | | set
Strict-Transport-Security: max-age=31536000; ... | | set X-Frame-Options:
DENY | | set X-Content-Type-Options: nosniff | |
set Referrer-Policy: strict-origin-when-cross-origin | | set Permissions-Policy:
camera=(), microphone=(), ... | +-------------------------------------------------------------+ |
Per-Tenant Overrides (configuration service, per ADR-038) | | tenant_id ->
{csp_allow_list, x_frame_options, ...} |
+-------------------------------------------------------------+ | CSP Report-Only Mode (staging)
| | Content-Security-Policy-Report-Only: ... | | violations logged to
SIEM (per ADR-088) | +-------------------------------------------------------------+ |
HSTS Preload List | | submitted once; reviewed
annually | +-------------------------------------------------------------+
SEQUENCE DIAGRAM
Browser -> API Gateway: GET /dashboard (HTTPS) API Gateway -> Backend:
forward request Backend -> API Gateway: 200 OK {html} API Gateway ->
Browser: 200 OK {html} + headers Note over Browser: CSP enforced (blocks
inline without nonce) Note over Browser: HSTS enforced (HTTPS-only) Note over
Browser: X-Frame-Options: DENY (no iframe embed) --- Browser -> SIEM:
POST /csp-report {violation} Note over SIEM: CSP violation flagged (per
ADR-088)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-081 — Security Headers -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | App Service | render |
Security Filter | | | | |------->| (sets headers / | | |
+----------------+ | validates token) | | | +----------
+-----------+ | | | | |
| set | | v | | +----------------+
+----------------------+ | | | HTTP Response | add | Headers: | | | |
|------->| CSP, HSTS, X-Frame, | | | +----------------+ | X-Content-Type, Ref
| | | +----------------------+ | |
| | CSRF: token in header, validated server-side | | CSP: strict-dynamic
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 272

PreOne ADR - Volume 4: Security Architecture v3.0
with nonce | | Verified by SAST rules (ADR-083)
| +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Response Header Flow: App -> Security Filter: response object Security Filter
-> Response: add headers - Content-Security-Policy: strict-dynamic + nonce
- Strict-Transport-Security: max-age=31536000 - X-Frame-Options: DENY -
X-Content-Type-Options: nosniff - Referrer-Policy: strict-origin-when-cross-
origin Security Filter -> Client: response with headers CSRF Flow: App ->
Client: CSRF token in meta tag (session-bound) Client -> App: POST with X-
CSRF-Token header App -> CSRF Validator: compare token (mismatch) App
-> Client: 403 (match) App -> continue processing
DATABASE IMPACT
No new tables are introduced. Per-tenant header overrides are stored in the
configuration service (per ADR-038) and propagated to the gateway within 60
seconds. CSP violation reports are sent to the SIEM (per ADR-088) via a
dedicated endpoint POST /csp-report; the reports are not stored in the
application database (the SIEM is the canonical store). The HSTS preload
submission is a one-time operation (the domain is added to the public HSTS
preload list); no database record is required. Expected storage overhead:
negligible (the per-tenant overrides are small, ~1KB per tenant).
API IMPACT
The security headers are transparent to the API layer: the gateway sets the
headers on all responses, including errors. The only API-visible change is the
CSP report endpoint (POST /csp-report), which receives CSP violation reports
from browsers and forwards them to the SIEM. The gateway generates a per-
request nonce for the CSP (a 128-bit random value, base64-encoded), which is
included in the CSP header and in the HTML's inline scripts (the nonce
attribute). The per-tenant overrides allow a tenant to add a domain to the CSP
allow-list (e.g., for a custom analytics integration) or to change X-Frame-
Options from DENY to ALLOW-FROM (for a specific iframe embed); these
overrides are reviewed quarterly by the security team. The headers are set on
all responses, including 4xx and 5xx errors.
UI IMPACT
Security Headers are invisible to end users — they are HTTP response headers
interpreted by the browser. The UI benefits from CSP (Content-Security-Policy)
by blocking XSS attacks in the browser; users may see a 'This page failed to
load a resource' message if a CSP-violating script is attempted (rare). HSTS
forces HTTPS, so users never see an 'insecure connection' warning. The admin
UI includes a 'Security Headers' verification page
(admin/operations/security/headers) that displays the current headers and
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 273

PreOne ADR - Volume 4: Security Architecture v3.0
validates them against the expected policy — useful for SRE verification after
deployments.
SECURITY IMPACT
The comprehensive security-headers strategy raises the browser-security floor
on six dimensions. First, CSP with Trusted Types (per ADR-083) prevents XSS
attacks by restricting script sources and requiring Trusted Types for DOM
sinks; the 2024 XSS incident would have been blocked by this CSP. Second,
HSTS with preload prevents SSL stripping on the first request to a new
browser, defeating man-in-the-middle attacks. Third, X-Frame-Options: DENY
prevents clickjacking attacks where the PreOne pages are embedded in a
malicious iframe. Fourth, X-Content-Type-Options: nosniff prevents MIME
sniffing attacks where the browser interprets a non-script resource as a script.
Fifth, Referrer-Policy (strict-origin-when-cross-origin) prevents PII leakage via
the Referer header to third-party domains. Sixth, Permissions-Policy restricts
the camera, microphone, and geolocation APIs, preventing third-party widgets
from accessing them without explicit user consent. The CSP report-only mode
in staging catches CSP violations before they reach production, enabling safe
CSP changes.
PERFORMANCE IMPACT
The security-headers overhead is negligible: the gateway sets the headers in
the response, which is an O(1) operation. The per-request nonce generation
(128-bit random) is sub-millisecond. The per-tenant override lookup is cached
in the gateway (5-minute TTL), so it does not add per-request latency. The CSP
report endpoint (POST /csp-report) is low-traffic (only on violations) and does
not affect the hot path. The HSTS preload is a browser-side check (the browser
consults its built-in preload list), so it adds no server-side overhead. Total
security-headers overhead: <1ms p99, well within the 100ms p99 API budget.
The headers add ~500 bytes to every response, which is negligible.
SCALABILITY ANALYSIS
The security-headers subsystem scales trivially: the gateway sets headers on
every response, and the overhead is O(1) per response. At 5,000 requests per
second, the nonce generation rate is 5,000/sec, well within the JVM's
SecureRandom capacity. The per-tenant override configuration is small (~1KB
per tenant, ~1MB total) and is cached in the gateway. The CSP report endpoint
is low-traffic (only on violations, typically <10 per second). The HSTS preload
list is consulted browser-side, so it does not scale with the request rate. At the
5M-principal projection, no scaling issue is anticipated; the security-headers
subsystem is essentially stateless and adds fixed overhead per response.
OPERATIONAL CONSIDERATIONS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 274

PreOne ADR  -  Volume 4: Security Architecture  v3.0
The security-headers subsystem requires four operational artefacts. (1) A
runbook for CSP changes: the security team tests the change in report-only
mode in staging, reviews the violation reports, and then enforces the change in
production; the runbook covers the workflow. (2) A runbook for per-tenant
override requests: tenant administrators request CSP or X-Frame-Options
overrides via the admin API; the runbook covers the approval workflow
(security team review) and the quarterly audit. (3) A runbook for HSTS preload
list maintenance: the domain is submitted once; the runbook covers the annual
review and the removal procedure (which is slow, ~3 months). (4) A runbook
for CSP violation investigation: the SIEM aggregates CSP violation reports; the
security team reviews them weekly for patterns indicating an attack or a
misconfiguration. Per-tenant overrides are propagated within 60 seconds via
the configuration service.
RISKS
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Strict CSP blocks  | Medium     | Medium | Report-only mode    |
| legitimate inline  |            |        | in staging catches  |
| scripts in the     |            |        | violations; per-    |
| legacy frontend.   |            |        | request nonce       |
allows legitimate
inline scripts.
| HSTS preload       | Low | High | Rollback to HTTP     |
| ------------------ | --- | ---- | -------------------- |
| makes rollback to  |     |      | is not anticipated;  |
| HTTP infeasible    |     |      | HSTS preload         |
| (browsers refuse   |     |      | removal              |
| HTTP for the       |     |      | procedure            |
| domain).           |     |      | documented (3-       |
month wait).
| Per-tenant CSP     | Medium | Medium | Overrides are        |
| ------------------ | ------ | ------ | -------------------- |
| overrides weaken   |        |        | reviewed             |
| the global policy. |        |        | quarterly; security  |
team approval
required; audit-
logged.
| Third-party widget  | Low | Medium | Widget domains    |
| ------------------- | --- | ------ | ----------------- |
| domain change       |     |        | are monitored;    |
| breaks the CSP      |     |        | CSP changes are   |
| allow-list.         |     |        | tested in report- |
only mode before
enforcement.
TRADE-OFFS
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  275

PreOne ADR - Volume 4: Security Architecture v3.0
We Gain We Lose
CSP with Trusted Types prevents XSS Legacy frontend refactoring required
attacks. (inline scripts to nonced).
HSTS with preload prevents SSL Rollback to HTTP infeasible (3-month
stripping. removal wait).
X-Frame-Options: DENY prevents Legitimate iframe embeds require per-
clickjacking. tenant override.
Permissions-Policy restricts sensitive Third-party widgets requiring
APIs. camera/mic need explicit consent flow.
REJECTED ALTERNATIVES
The legacy strategy (only X-Frame-Options and X-Content-Type-Options) was
rejected because the absence of CSP allows XSS attacks (the 2024 incident
demonstrated this), the absence of HSTS allows SSL stripping, and the absence
of Referrer-Policy leaks PII in URL parameters. The strict CSP (no inline, no
eval, no external domains) was rejected as incompatible with the legacy third-
party analytics and chat widgets, which are loaded via external domains and
use inline scripts; the business requires that these widgets continue to work, so
the CSP must allow-list their domains. The per-page CSP (different policy per
route) was rejected as operationally complex and brittle: the policy
configuration grows with the route count, and a misconfiguration can either
block legitimate scripts (causing user friction) or allow attacks (defeating the
purpose). 'unsafe-inline' in the CSP (rather than per-request nonces) was
rejected because it provides weaker security: an attacker who can inject an
inline script can execute it, whereas per-request nonces require the attacker to
guess the nonce. 'unsafe-eval' in the CSP was rejected because it allows eval(),
which is a common XSS vector. The comprehensive strategy with per-request
nonces and a per-domain allow-list is the only one that satisfies all
requirements; the full reasoning is captured in the Options Considered table.
MIGRATION PLAN
Migration is phased over two weeks alongside the API-gateway migration (per
ADR-076). Phase 1 (days 1-3): deploy the security-headers subsystem in the
gateway with CSP in report-only mode (CSP violations are logged to the SIEM
but not enforced); the other headers (HSTS, X-Frame-Options, etc.) are
enforced immediately. Phase 2 (days 4-7): refactor the legacy frontend to
comply with the CSP (inline scripts to nonced, external scripts to allow-listed
domains); this is the bulk of the migration effort. Phase 3 (days 8-10): enforce
the CSP in production; monitor the SIEM for violation spikes. Phase 4 (days 11-
12): submit the domain to the HSTS preload list; configure per-tenant overrides
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 276

PreOne ADR - Volume 4: Security Architecture v3.0
for the largest customers. Phase 5 (days 13-14): the report-only mode is
removed; the legacy frontend's inline scripts (without nonces) are blocked.
Rollback is possible at any point by reverting the CSP to report-only mode; the
other headers (HSTS, X-Frame-Options) can be reverted individually if needed.
TESTING STRATEGY
The security-headers subsystem is tested at four levels. Unit tests cover the
header-setting logic (correct values for each header) and the per-request nonce
generation (uniqueness, length). Coverage target is 95%. Integration tests
cover the gateway-to-browser flow (headers are present on all responses,
including errors). End-to-end tests cover the full request path with a real
browser, verifying that the CSP blocks injected scripts and that the HSTS
header is honoured. Security tests cover the XSS attack (must be blocked by
CSP), the clickjacking attack (must be blocked by X-Frame-Options), and the
SSL stripping attack (must be blocked by HSTS). The CSP report-only mode is
tested with a synthetic violation to verify that the report endpoint forwards to
the SIEM. The acceptance criterion is zero CSP-bypass incidents in the post-
cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) CSP violation rate: target under 10 per
minute (legitimate violations during rollout), alert above 100 (possible attack or
misconfiguration). (2) Per-tenant override count: target under 10% of tenants,
alert above 20% (possible default-policy issue). (3) HSTS preload list status:
target 'present', alert on 'absent' (possible list removal). (4) Header-set
completeness: target 100% of responses include all headers, alert on any gap
(possible gateway misconfiguration). (5) Per-request nonce uniqueness: target
100%, alert on any collision (possible RNG issue). (6) CSP report endpoint
latency p99: target under 100ms, alert above 500ms (possible SIEM ingestion
issue). A dedicated security-headers dashboard surfaces these alongside the
per-header violation distribution, the per-tenant override inventory, and the top
CSP-violation sources. Anomaly detection (per ADR-088) flags unusual patterns
such as a tenant-wide CSP violation burst (possible attack).
FUTURE EVOLUTION
The security-headers subsystem is expected to evolve in three directions. First,
the system may adopt the Reporting API (Report-To header) for more
structured violation reporting, replacing the CSP report-only endpoint; this is
monitored but not planned for v1. Second, the system may add Cross-Origin
Embedder Policy (COEP) and Cross-Origin Opener Policy (COOP) for defence
against Spectre-class attacks; this is planned for v2 but requires careful testing
because it can break cross-origin embeds. Third, the system may integrate with
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 277

PreOne ADR - Volume 4: Security Architecture v3.0
the CSP-evaluator tool for automated CSP policy review, catching weak policies
before deployment; this is tracked as a follow-up. The trigger for revisiting this
ADR is a material change in the browser security-header landscape (e.g., a new
header becoming standard) or a regulatory change requiring a specific header.
RELATED ADRS
● ADR-076 - API Security (headers enforced at gateway)
● ADR-077 - Encryption (HSTS complements TLS 1.3)
● ADR-083 - XSS Prevention (CSP with Trusted Types)
● ADR-082 - CSRF Strategy (SameSite cookies complement CSP)
● ADR-088 - Security Monitoring (CSP violations forwarded to SIEM)
● ADR-038 - Configuration Service (per-tenant overrides)
REFERENCES
● OWASP - Secure Headers Project. OWASP. 2024.
● MDN - Content-Security-Policy. Mozilla. 2024.
● HSTS Preload List - hstspreload.org. Google. 2024.
● W3C - Trusted Types. W3C. 2024.
● PreOne Engineering Handbook, Section 4.21 - Security Headers.
Internal. 2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-01 Draft Platform Security Initial draft;
Architect options
enumerated;
consultation with
security and
engineering teams
2025-09-17 Proposed Platform Security Submitted to
Architect Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 278

PreOne ADR - Volume 4: Security Architecture v3.0
Date Status Actor Notes
2026-07-15 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
Architect Platform Security Architect
Tech Lead Authentication Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Security Headers filter deployed (Done)
● CSP with strict-dynamic + nonce (Done)
● HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
(Done)
● CSRF token in meta tag + header validation (Done)
● SameSite=Strict cookies (Done)
● Quarterly security-header verification (Scheduled)
AD R -082
CSRF Strategy
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 279

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
Adopt a dual-layer CSRF defence: SameSite=Lax cookies for all session
cookies (the primary defence) and a double-submit cookie token for state-
changing requests (the secondary defence). The double-submit token is a
per-session random value stored in a cookie and submitted as a header on
every state-changing request, verified server-side. CORS is configured
restrictively to complement the strategy.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Platform Security Architect
Review Cadence Annual review, or on regulatory
update, or on OWASP Top 10
refresh
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
The PreOne platform uses cookie-based session authentication for the web
frontend (the mobile app uses bearer JWTs, which are not vulnerable to CSRF).
The 2025 Q3 security review found that the legacy platform relies solely on a
CSRF token in a meta tag (synchroniser-token pattern), which is insufficient on
three grounds. First, the token is stored in a meta tag, which is accessible to
XSS (an attacker who can run JavaScript can read the token and forge a
request). Second, the token is per-session, not per-request, so a stolen token is
valid for the session duration. Third, the legacy cookies do not set SameSite,
leaving them vulnerable to cross-site request forgery in browsers that do not
enforce SameSite=Lax by default. The ARB considered four CSRF strategies.
The first is the legacy strategy (synchroniser-token in meta tag, no SameSite),
which is rejected. The second is the dual-layer strategy selected here
(SameSite=Lax + double-submit cookie). The third is SameSite=Strict only (no
double-submit), which is rejected as breaking legitimate cross-site navigation
(e.g., a teacher clicking a link from an email to a specific student record). The
fourth is the synchroniser-token pattern with per-request tokens, which is
rejected as operationally complex and still vulnerable to XSS. This ADR defines
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 280

PreOne ADR - Volume 4: Security Architecture v3.0
the CSRF strategy. It depends on ADR-074 (Session Management) for the
cookie and ADR-083 (XSS Prevention) for the CSP that prevents XSS from
stealing tokens.
BUSINESS DRIVERS
The 2026 international expansion requires CSRF protection aligned with each
regulatory regime: GDPR Article 32 recommends CSRF protection; DPDP does
not mandate but the parental-consent flow is vulnerable to CSRF; COPPA does
not mandate but the minor-protection flows are vulnerable. The dual-layer
strategy satisfies all three. The business also requires that legitimate cross-site
navigation (e.g., a teacher clicking a link from an email to a specific student
record) continue to work, which drives the SameSite=Lax choice (rather than
Strict). Finally, the business requires that the CSRF strategy be compatible
with the existing cookie-based session model (per ADR-074), which rules out
bearer-token-only strategies.
PROBLEM STATEMENT
The legacy CSRF strategy (synchroniser-token in meta tag, no SameSite) is
vulnerable to XSS-based token theft and cross-site request forgery in non-
SameSite-default browsers. PreOne needs a dual-layer CSRF strategy:
SameSite=Lax cookies (primary) and a double-submit cookie token
(secondary), with restrictive CORS, compatible with the cookie-based session
model.
CONSTRAINTS
● The strategy must be compatible with the cookie-based session model
(per ADR-074).
● SameSite=Lax must allow legitimate top-level navigation (GET
requests from external links).
● The double-submit token must be per-session (not per-request) to avoid
UX friction.
● The strategy must not block legitimate cross-origin requests from the
mobile app (which uses bearer JWTs, not cookies).
● CORS must be configured to allow only the PreOne frontend origin for
cookie-authenticated requests.
ASSUMPTIONS
● Modern browsers support SameSite=Lax by default and enforce it
correctly.
● The double-submit cookie pattern is sufficient for CSRF protection
when combined with SameSite=Lax.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 281

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● The web frontend can be refactored to include the double-submit token
header on every state-changing request.
● CORS preflight requests do not include cookies, so they are not
vulnerable to CSRF.
● The mobile app uses bearer JWTs (not cookies), so it is not affected by
the CSRF strategy.
OPTIONS CONSIDERED
| Option            | Pros                | Cons               | Verdict |
| ----------------- | ------------------- | ------------------ | ------- |
| Dual-layer:       | SameSite=Lax        | SameSite=Lax       | Adopted |
| SameSite=Lax +    | blocks primary      | does not block     |         |
| double-submit     | CSRF vector at      | top-level GET      |         |
| cookie +          | browser level.      | navigation         |         |
| restrictive CORS. | Double-submit       | (legitimate but    |         |
|                   | provides defence    | reduces defence).  |         |
|                   | in depth without    | csrf-token cookie  |         |
|                   | server-side state.  | is non-HttpOnly.   |         |
|                   | Restrictive CORS    | Legacy browsers    |         |
|                   | adds third layer.   | may not support    |         |
|                   | Compatible with     | SameSite.          |         |
cookie-based
sessions.
| Legacy:             | Familiar. Per-     | Token in meta tag   | Rejected |
| ------------------- | ------------------ | ------------------- | -------- |
| synchroniser-       | session token. No  | accessible to XSS.  |          |
| token in meta tag,  | SameSite           | No SameSite         |          |
| no SameSite.        | compatibility      | leaves cookies      |          |
|                     | concern.           | vulnerable in       |          |
older browsers.
Per-session token
valid for session
duration. Requires
server-side state.
| SameSite=Strict  | Strongest           | Breaks legitimate   | Rejected |
| ---------------- | ------------------- | ------------------- | -------- |
| only (no double- | SameSite            | cross-site          |          |
| submit).         | protection. No      | navigation          |          |
|                  | double-submit       | (teacher clicking   |          |
|                  | cookie complexity.  | email link must re- |          |
|                  | Stateless.          | login).             |          |
Unacceptable UX.
Business-
unacceptable.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  282

PreOne ADR - Volume 4: Security Architecture v3.0
Option Pros Cons Verdict
Synchroniser- Strongest token Operationally Rejected
token with per- protection. Per- complex (server-
request tokens. request token side token store,
expires after use. refresh
Defence in depth. mechanism). Still
vulnerable to XSS
(attacker reads
current token,
forges request in
window). Not
significantly
stronger than
double-submit
with
SameSite=Lax.
DECISION
ADOPTED
We will adopt a dual-layer CSRF defence. (1) SameSite=Lax cookies: all
session cookies (per ADR-074) are set with SameSite=Lax, Secure, and
HttpOnly, which prevents the cookie from being sent on cross-site POST
requests (the primary CSRF defence) while allowing legitimate top-level
GET navigation. (2) Double-submit cookie token: a per-session random
value (128-bit, base64-encoded) is stored in a non-HttpOnly cookie (csrf-
token) and submitted as a header (X-CSRF-Token) on every state-changing
request (POST, PUT, PATCH, DELETE); the server verifies that the cookie
value matches the header value. (3) Restrictive CORS: the Access-Control-
Allow-Origin header is set only for the PreOne frontend origin, and Access-
Control-Allow-Credentials is true, preventing cross-origin cookie-
authenticated requests from other origins.
DETAILED RATIONALE
The dual-layer strategy is selected because it is the only option that
simultaneously provides strong CSRF protection, preserves legitimate cross-
site navigation, and is compatible with the cookie-based session model. The
legacy strategy (synchroniser-token in meta tag, no SameSite) is rejected on
three grounds. First, the token in a meta tag is accessible to XSS: an attacker
who can run JavaScript (e.g., via the 2024 XSS incident) can read the token and
forge a state-changing request. Second, the absence of SameSite leaves the
cookies vulnerable to CSRF in browsers that do not enforce SameSite=Lax by
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 283

PreOne ADR - Volume 4: Security Architecture v3.0
default (older browsers, some embedded webviews). Third, the synchroniser-
token pattern requires server-side state (the token must be stored and
validated), which adds operational complexity. SameSite=Strict only (no
double-submit) was rejected as breaking legitimate cross-site navigation: a
teacher clicking a link from an email to a specific student record would not send
the session cookie (Strict blocks all cross-site requests), requiring a re-login.
SameSite=Lax allows top-level GET navigation (the cookie is sent), which is the
correct trade-off. The double-submit cookie provides defence in depth: even if a
future browser bug weakens SameSite enforcement, the double-submit token
still prevents CSRF (the attacker cannot read the token from the victim's
browser due to the same-origin policy). The synchroniser-token pattern with
per-request tokens was rejected as operationally complex and still vulnerable
to XSS: per-request tokens require server-side state (a token store) and a token-
refresh mechanism, and they do not solve the XSS problem (an XSS can read
the current token and forge a request within the request window). The double-
submit cookie is preferred because it is stateless (no server-side token store)
and provides equivalent protection when combined with SameSite=Lax. The
double-submit cookie is set as a non-HttpOnly cookie (so the frontend
JavaScript can read it and submit it as a header) but with SameSite=Lax (so it is
not sent on cross-site POST requests). The server verifies that the X-CSRF-
Token header matches the csrf-token cookie; if they match, the request is
authenticated. An attacker on a different origin cannot read the csrf-token
cookie (same-origin policy) and cannot set the X-CSRF-Token header to match
(they don't know the value), so the CSRF attack is blocked. The restrictive
CORS configuration (only the PreOne frontend origin is allowed for cookie-
authenticated requests) provides a third layer of defence.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | CSRF STRATEGY
SUBSYSTEM | +-------------------------------------------------------------+ | LAYER
1: SameSite=Lax Cookies (primary) | | Set-Cookie: session=...;
SameSite=Lax; Secure; HttpOnly | | - blocks cross-site POST (CSRF defence)
| | - allows top-level GET navigation (legitimate) |
+-------------------------------------------------------------+ | LAYER 2: Double-Submit Cookie
Token (secondary) | | Set-Cookie: csrf-token={random}; SameSite=Lax;
Secure | | - non-HttpOnly (frontend JS can read) | | - frontend
submits X-CSRF-Token: {csrf-token} header | | - server verifies header ==
cookie | +-------------------------------------------------------------+ | LAYER 3:
Restrictive CORS (complementary) | | Access-Control-Allow-Origin:
https://app.preone.example | | Access-Control-Allow-Credentials: true
| | - blocks cross-origin cookie-authenticated requests |
+-------------------------------------------------------------+ | State-Changing Request
(POST/PUT/PATCH/DELETE) | | 1. SameSite=Lax blocks cross-site
POST (cookie not sent) | | 2. double-submit: X-CSRF-Token header must match
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 284

PreOne ADR - Volume 4: Security Architecture v3.0
cookie | | 3. CORS: only PreOne origin allowed for credentialed |
+-------------------------------------------------------------+
SEQUENCE DIAGRAM
Browser -> Frontend: load app Frontend -> Browser: read csrf-token cookie
Browser -> API Gateway: POST /resource (Cookie: session, csrf-token; X-CSRF-
Token: {csrf-token}) API Gateway -> CSRF Verifier: X-CSRF-Token == csrf-
token cookie? CSRF Verifier -> API Gateway: match (valid) API Gateway ->
Backend: forward request Backend -> API Gateway: 200 OK API Gateway ->
Browser: 200 OK --- Attacker -> Browser: POST /resource (cross-site, no X-CSRF-
Token) Browser -> API Gateway: POST (Cookie: session? - SameSite=Lax blocks)
Note over API Gateway: cookie not sent (SameSite=Lax); request
unauthenticated API Gateway -> Attacker: 401 Unauthorized
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-082 — CSRF Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | App Service | render |
Security Filter | | | | |------->| (sets headers / | | |
+----------------+ | validates token) | | | +----------
+-----------+ | | | | |
| set | | v | | +----------------+
+----------------------+ | | | HTTP Response | add | Headers: | | | |
|------->| CSP, HSTS, X-Frame, | | | +----------------+ | X-Content-Type, Ref
| | | +----------------------+ | |
| | CSRF: token in header, validated server-side | | CSP: strict-dynamic
with nonce | | Verified by SAST rules (ADR-083)
| +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Response Header Flow: App -> Security Filter: response object Security Filter
-> Response: add headers - Content-Security-Policy: strict-dynamic + nonce
- Strict-Transport-Security: max-age=31536000 - X-Frame-Options: DENY -
X-Content-Type-Options: nosniff - Referrer-Policy: strict-origin-when-cross-
origin Security Filter -> Client: response with headers CSRF Flow: App ->
Client: CSRF token in meta tag (session-bound) Client -> App: POST with X-
CSRF-Token header App -> CSRF Validator: compare token (mismatch) App
-> Client: 403 (match) App -> continue processing
DATABASE IMPACT
No new tables are introduced. The CSRF token is stored entirely in the cookie
(no server-side token store); the server verifies the header-cookie match
statelessly. The session cookie (per ADR-074) is updated to include
SameSite=Lax; this is a configuration change, not a schema change. Audit logs
of CSRF-rejected requests (where the header-cookie match fails) are written to
audit_trail per ADR-086. Expected storage overhead: negligible (the CSRF
token is ~20 bytes per session, stored in the cookie). The legacy synchroniser-
token table (legacy_csrf_tokens) is dropped after migration.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 285

PreOne ADR - Volume 4: Security Architecture v3.0
API IMPACT
All state-changing endpoints (POST, PUT, PATCH, DELETE) require the X-
CSRF-Token header; GET, HEAD, and OPTIONS do not (they are not state-
changing). The gateway (per ADR-076) verifies the header-cookie match before
forwarding to the backend; on mismatch, it returns 403 Forbidden with a clear
error message. The frontend (React SPA) is updated to include the X-CSRF-
Token header on every state-changing request, reading the value from the csrf-
token cookie. The CORS configuration (Access-Control-Allow-Origin) is set only
for the PreOne frontend origin; cross-origin requests from other origins are
rejected. The mobile app (which uses bearer JWTs, not cookies) is unaffected:
the CSRF check is skipped for bearer-JWT-authenticated requests.
UI IMPACT
CSRF protection is invisible to end users — the CSRF token is embedded in a
meta tag and sent as a header on every POST/PUT/DELETE. If the token is
missing or mismatched (e.g., a malicious site submits a form), the user sees a
'Your session has expired. Please refresh and try again.' message. The UI was
updated in 2025 to use SameSite=Strict cookies for session, which provides
additional CSRF protection at the browser level. The login flow uses double-
submit CSRF tokens (token in both cookie and header) to prevent login CSRF
attacks.
SECURITY IMPACT
The dual-layer strategy raises the CSRF security floor on three dimensions.
First, SameSite=Lax blocks the primary CSRF vector (cross-site POST
requests) at the browser level, without relying on application-layer checks.
Second, the double-submit cookie provides defence in depth: even if a future
browser bug weakens SameSite enforcement, the double-submit token still
prevents CSRF (the attacker cannot read the token from the victim's browser
due to the same-origin policy). Third, the restrictive CORS configuration blocks
cross-origin cookie-authenticated requests from other origins, providing a third
layer. The 2024 XSS incident would not have been able to forge a CSRF request
under this strategy: even though the XSS could read the csrf-token cookie (it is
non-HttpOnly), the XSS is already running in the victim's browser, so the forged
request would be a same-origin request (not a CSRF attack); the XSS defence is
handled by CSP and Trusted Types (per ADR-083). The strategy is compatible
with the cookie-based session model (per ADR-074) and does not require
bearer-token-only authentication.
PERFORMANCE IMPACT
The CSRF check is O(1) (string comparison of the header and cookie values)
and adds negligible latency (<0.1ms). The CORS preflight (OPTIONS) request
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 286

PreOne ADR  -  Volume 4: Security Architecture  v3.0
adds one round-trip for cross-origin state-changing requests, but this is a
browser-side cost, not a server-side cost. The SameSite=Lax attribute is a
browser-side enforcement, adding no server-side overhead. The double-submit
cookie adds ~20 bytes to every response (the Set-Cookie header), which is
negligible. Total CSRF-strategy overhead: <1ms p99, well within the 100ms
p99 API budget. The strategy does not require any server-side state, so it scales
trivially.
SCALABILITY ANALYSIS
The CSRF-strategy subsystem scales trivially: the header-cookie check is O(1)
and stateless, so it adds fixed overhead per request. At 5,000 requests per
second, the CSRF check rate is ~1,000/sec (state-changing requests are ~20%
of traffic), well within the gateway's capacity. The CORS configuration is static
(set once at gateway startup). The double-submit cookie is set once per session
(on login) and read on every state-changing request, so it does not add per-
request server-side work. At the 5M-principal projection, no scaling issue is
anticipated; the CSRF-strategy subsystem is essentially stateless and adds
fixed overhead per request.
OPERATIONAL CONSIDERATIONS
The CSRF-strategy subsystem requires three operational artefacts. (1) A
runbook for CORS configuration changes: adding a new frontend origin
requires a CORS update; the runbook covers the security review and the
propagation. (2) A runbook for CSRF-rejected request investigation: the SIEM
aggregates CSRF-rejected requests (where the header-cookie match fails); the
security team reviews them weekly for patterns indicating an attack or a
misconfiguration. (3) A runbook for SameSite policy review: the SameSite=Lax
choice is reviewed annually as browser defaults evolve; the runbook covers the
review and the potential upgrade to SameSite=Strict for high-security tenants.
Per-tenant SameSite overrides are not supported (the SameSite policy is
global); per-tenant CORS overrides are supported for tenants with custom
frontend domains.
RISKS
| Risk               | Likelihood | Impact | Mitigation         |
| ------------------ | ---------- | ------ | ------------------ |
| SameSite=Lax       | Low        | Medium | GET endpoints are  |
| does not block     |            |        | non-state-         |
| top-level GET      |            |        | changing by        |
| navigation,        |            |        | convention (per    |
| leaving GET-based  |            |        | ADR-091); the      |
| state-changing     |            |        | double-submit      |
| endpoints          |            |        | token provides     |
| vulnerable.        |            |        | defence in depth.  |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  287

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation        |
| ------------------ | ---------- | ------ | ----------------- |
| XSS can read the   | Medium     | High   | CSP and Trusted   |
| csrf-token cookie  |            |        | Types (per        |
| (non-HttpOnly)     |            |        | ADR-083) prevent  |
| and forge a same-  |            |        | XSS; the XSS      |
| origin request.    |            |        | defence is the    |
primary control.
| CORS              | Low | High   | CORS                 |
| ----------------- | --- | ------ | -------------------- |
| misconfiguration  |     |        | configuration is     |
| allows a cross-   |     |        | version-controlled;  |
| origin cookie-    |     |        | quarterly audit;     |
| authenticated     |     |        | automated            |
| request.          |     |        | conformance test.    |
| Legacy browsers   | Low | Medium | The double-submit    |
| do not support    |     |        | token provides       |
| SameSite=Lax.     |     |        | defence in depth     |
for legacy
browsers;
supported-
browser policy
documented.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
SameSite=Lax blocks the primary CSRF  Top-level GET navigation is allowed
vector at the browser level. (legitimate but reduces defence for
GET-based state changes).
Double-submit cookie provides defence  The csrf-token cookie is non-HttpOnly
in depth without server-side state. (frontend JS must read it).
Restrictive CORS blocks cross-origin  Adding a new frontend origin requires a
cookie-authenticated requests. CORS update and security review.
Stateless verification scales trivially. Per-session token (not per-request) is
slightly weaker than per-request
tokens.
REJECTED ALTERNATIVES
The legacy strategy (synchroniser-token in meta tag, no SameSite) was rejected
on three grounds: the token in a meta tag is accessible to XSS (an attacker who
can run JavaScript can read the token and forge a request); the absence of
SameSite leaves the cookies vulnerable to CSRF in browsers that do not
enforce SameSite=Lax by default; and the synchroniser-token pattern requires
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  288

PreOne ADR - Volume 4: Security Architecture v3.0
server-side state, adding operational complexity. SameSite=Strict only (no
double-submit) was rejected as breaking legitimate cross-site navigation: a
teacher clicking a link from an email to a specific student record would not send
the session cookie (Strict blocks all cross-site requests), requiring a re-login,
which is unacceptable UX. The synchroniser-token pattern with per-request
tokens was rejected as operationally complex (requires server-side token store
and a token-refresh mechanism) and still vulnerable to XSS (an XSS can read
the current token and forge a request within the request window). Bearer-
token-only authentication (no cookies) was rejected as incompatible with the
cookie-based session model (per ADR-074); the business requires that the web
frontend use cookies for session management. The Origin header check (rather
than double-submit cookie) was considered as a secondary defence but rejected
because the Origin header is not always present (some browsers omit it on
same-origin requests), making it unreliable. The dual-layer strategy
(SameSite=Lax + double-submit + restrictive CORS) is the only one that
satisfies all requirements; the full reasoning is captured in the Options
Considered table.
MIGRATION PLAN
Migration is phased over two weeks alongside the session-management
migration (per ADR-074). Phase 1 (days 1-3): deploy the CSRF-strategy
subsystem (SameSite=Lax cookie attribute, double-submit cookie, CORS
configuration) in shadow mode (the CSRF check is logged but not enforced).
Phase 2 (days 4-7): update the frontend (React SPA) to include the X-CSRF-
Token header on every state-changing request; this is the bulk of the migration
effort. Phase 3 (days 8-10): enable the CSRF check in enforcement mode; the
legacy synchroniser-token check is kept as a fallback during this phase. Phase 4
(days 11-12): remove the legacy synchroniser-token check; the
legacy_csrf_tokens table is dropped. Phase 5 (days 13-14): the shadow-mode
logging is removed; the SameSite=Lax attribute is enforced on all session
cookies. Rollback is possible at any point by disabling the CSRF check (the
gateway reverts to the legacy synchroniser-token check); the SameSite=Lax
attribute can be reverted to no-SameSite if needed.
TESTING STRATEGY
The CSRF-strategy subsystem is tested at four levels. Unit tests cover the
header-cookie match verification, the SameSite attribute setting, and the CORS
configuration. Coverage target is 95%. Integration tests cover the gateway-to-
browser flow with cookies and headers. End-to-end tests cover the full state-
changing request path with a real browser, verifying that the double-submit
token is required and that the SameSite=Lax attribute is honoured. Security
tests cover the CSRF attack (a cross-site POST must be blocked by
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 289

PreOne ADR - Volume 4: Security Architecture v3.0
SameSite=Lax), the double-submit bypass attempt (a request with a forged X-
CSRF-Token header must be rejected), and the CORS attack (a cross-origin
cookie-authenticated request must be rejected). The SameSite=Lax
enforcement is tested across multiple browsers (Chrome, Firefox, Safari,
Edge). The acceptance criterion is zero CSRF-bypass incidents in the post-
cutover penetration test.
MONITORING & OBSERVABILITY
Six golden signals are monitored. (1) CSRF-rejection rate: target under 0.1% of
state-changing requests, alert above 1% (possible attack or misconfiguration).
(2) SameSite-Lax enforcement rate: target 100% of session cookies, alert on
any gap (possible gateway misconfiguration). (3) CORS-rejection rate: target
under 0.1% of cross-origin requests, alert above 1% (possible misconfigured
integration). (4) Double-submit cookie-set rate: target 100% of logins, alert on
any gap. (5) CORS configuration drift: target 0, alert on any change (possible
misconfiguration). (6) Legacy-browser rate (no SameSite support): target
under 1% of traffic, alert above 5% (possible browser-fleet issue). A dedicated
CSRF-strategy dashboard surfaces these alongside the per-endpoint CSRF-
rejection distribution and the top CORS-rejection origins. Anomaly detection
(per ADR-088) flags unusual patterns such as a tenant-wide CSRF-rejection
burst (possible attack).
FUTURE EVOLUTION
The CSRF-strategy subsystem is expected to evolve in three directions. First,
the system may upgrade to SameSite=Strict for high-security tenants
(administrators, PII-access), providing stronger CSRF protection at the cost of
breaking some cross-site navigation; this is monitored but not planned for v1.
Second, the system may adopt the Fetch Metadata request headers (Sec-Fetch-
Site, Sec-Fetch-Mode) for additional CSRF defence, providing a server-side
check that complements SameSite; this is planned for v2. Third, the system may
migrate fully to bearer-token authentication (no cookies), eliminating CSRF
entirely; this is a larger change and would require its own ADR, and is tracked
as a follow-up to ADR-073 (Device Binding) and ADR-075 (Password Policy)
future evolution toward passwordless. The trigger for revisiting this ADR is a
material change in the browser CSRF landscape or a migration away from
cookie-based sessions.
RELATED ADRS
● ADR-074 - Session Management (cookies are session-bearing)
● ADR-076 - API Security (CSRF check enforced at gateway)
● ADR-081 - Security Headers (CORS complements security headers)
● ADR-083 - XSS Prevention (CSP prevents XSS from stealing tokens)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 290

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● ADR-091 - REST Standards (GET endpoints are non-state-changing)
● ADR-088 - Security Monitoring (CSRF rejections forwarded to SIEM)
REFERENCES
● OWASP - Cross-Site Request Forgery Prevention Cheat Sheet. OWASP.
2024.
● RFC 6265bis - HTTP State Management Mechanism (SameSite
attribute). IETF. 2023.
● Barth, C. et al. - Robust Defenses for Cross-Site Request Forgery. CCS.
2008.
● MDN - SameSite cookies. Mozilla. 2024.
● PreOne Engineering Handbook, Section 4.22 - CSRF Strategy. Internal.
2025.
DECISION HISTORY
| Date       | Status | Actor              | Notes           |
| ---------- | ------ | ------------------ | --------------- |
| 2025-08-01 | Draft  | Platform Security  | Initial draft;  |
|            |        | Architect          | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-09-17 | Proposed | Platform Security  | Submitted to  |
| ---------- | -------- | ------------------ | ------------- |
|            |          | Architect          | Architecture  |
Review Board
after cross-team
review
| 2025-10-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect |     | Platform Security Architect  |     |
| --------- | --- | ---------------------------- | --- |
| Tech Lead |     | Authentication Platform Lead |     |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  291

PreOne ADR - Volume 4: Security Architecture v3.0
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Security Headers filter deployed (Done)
● CSP with strict-dynamic + nonce (Done)
● HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
(Done)
● CSRF token in meta tag + header validation (Done)
● SameSite=Strict cookies (Done)
● Quarterly security-header verification (Scheduled)
AD R -083
Vulnerability Management
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a defense-in-depth vulnerability management program spanning
SAST, SCA, DAST, secret scanning, IaC scanning, and container image
scanning. SAST runs on every pull request via Semgrep; SCA runs on every
PR via Dependabot with auto-merge for patch-version updates; DAST runs
nightly against staging via OWASP ZAP; secret scanning via GitGuardian
runs pre-receive on every push; IaC scanning via Checkov validates
Terraform and CloudFormation; container images scanned via Trivy at build
time. Critical findings block deployment; high findings trigger a 7-day SLA;
medium findings a 30-day SLA; low findings are tracked in the backlog.
STATUS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 292

PreOne ADR - Volume 4: Security Architecture v3.0
Status Accepted
Date Decided 2025-11-20
Decision Owner Security Engineering Lead
Review Cadence Annual review, or on threat
landscape shift, or on tooling vendor
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne processes regulated student data across multiple geographies (India
DPDP, EU GDPR, US FERPA, COPPA). Each regulation imposes vulnerability-
management obligations that, while not prescriptive about tooling, require
demonstrable due diligence. The legacy platform relied on quarterly manual
penetration tests and an annual Nessus scan — a cadence that left 90+ day
windows for exploitation and produced findings that were stale by the time they
reached remediation. The 2025 security audit by Bishop Fox identified the
vulnerability management program as the highest-priority gap, citing four
incidents in the prior 18 months where known CVEs in dependencies were
exploited before the quarterly scan would have caught them. The
recommendation was to shift vulnerability detection left — into the developer
workflow — and to automate remediation tracking. PreOne's CI/CD pipeline
(GitHub Actions) and IaC (Terraform + AWS CloudFormation) provide natural
insertion points for scanning. The container-based deployment model (ECS
Fargate) means every deployment artifact can be scanned before it reaches
production. The engineering organization's adoption of trunk-based
development (ADR-118) means PRs are small and frequent — ideal for fast
SAST feedback. The threat model (ADR-0XX) identifies the top vectors as:
dependency CVEs (high), misconfigured IaC (medium), leaked secrets
(medium), and application logic flaws (low, because SAST coverage is partial).
The vulnerability management program addresses each vector with a dedicated
tool.
BUSINESS DRIVERS
The primary driver is regulatory compliance. India DPDP requires 'reasonable
security practices' including vulnerability management; GDPR Article 32
requires 'a process for regularly testing, assessing, and evaluating the
effectiveness of technical and organisational measures'; FERPA requires
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 293

PreOne ADR - Volume 4: Security Architecture v3.0
safeguards against unauthorized disclosure. A documented vulnerability
management program with automated tooling is the standard evidence
auditors expect. A secondary driver is risk reduction. The 2025 audit
correlated CVE remediation time directly with incident frequency: teams that
remediated within 7 days had 4x fewer incidents than teams that took 30+
days. Automated PR-time scanning reduces the median time-to-remediation
from 21 days (quarterly scan cadence) to under 24 hours. A tertiary driver is
developer experience. Catching vulnerabilities at PR time, with actionable
remediation guidance (e.g., 'upgrade lodash from 4.17.20 to 4.17.21'), is
dramatically cheaper than catching them at deployment, where the developer
has context-switched to other work. The friction cost of late remediation is well-
documented in DORA research.
PROBLEM STATEMENT
PreOne requires a defense-in-depth vulnerability management program that
detects vulnerabilities at the earliest possible stage — in the developer's PR, at
build time, in IaC, in container images, and in running infrastructure — with
enforceable remediation SLAs and full audit trail for compliance evidence.
CONSTRAINTS
● All scanning tools must integrate into GitHub Actions; no separate CI
for security
● SAST must complete in under 5 minutes per PR (or it gets bypassed)
● SCA must use a vendored vulnerability database (no runtime API calls
to a vendor that could fail)
● Secret scanning must run pre-receive (before the secret lands in git
history)
● Container image scans must block deployment on CRITICAL findings,
not just warn
● IaC scanning must run on every Terraform plan, not just on merge to
main
● All findings must be exported to a central SIEM (Splunk) for audit
evidence
● Remediation SLAs must be enforceable via GitHub branch protection
(no override without security team approval)
ASSUMPTIONS
● GitHub Actions runner capacity is sufficient for 5,000+ PRs per month
with security scans
● Dependabot's vulnerability database covers >= 95% of our dependency
tree
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 294

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● Semgrep rules cover the OWASP Top 10 and PreOne-specific patterns
(auth, crypto, SQL)
● OWASP ZAP can authenticate against staging without manual
intervention
● Trivy's CVE database updates at least daily
● Engineering teams will accept PR-time scan feedback as constructive,
not adversarial
OPTIONS CONSIDERED
| Option             | Pros                  | Cons                 | Verdict |
| ------------------ | --------------------- | -------------------- | ------- |
| Defense-in-depth:  | Covers every layer    | Six tools to         | Adopted |
| SAST (Semgrep)     | of the stack;         | manage and tune;     |         |
| + SCA              | integrates into       | potential for false- |         |
| (Dependabot) +     | existing CI;          | positive fatigue if  |         |
| DAST (OWASP        | centralised           | rules are not        |         |
| ZAP) + secret      | evidence for          | curated; cost is     |         |
| scan               | audits; each tool is  | ~$8K/month for       |         |
| (GitGuardian) +    | best-of-breed for     | SaaS tiers;          |         |
| IaC scan           | its layer; minimal    | requires a security  |         |
| (Checkov) +        | operational           | engineer to          |         |
| container scan     | overhead (all SaaS    | maintain rules.      |         |
| (Trivy), all in    | or open-source).      |                      |         |
GitHub Actions,
with central SIEM
export.
| Single-vendor      | One vendor to       | Weaker than     | Rejected |
| ------------------ | ------------------- | --------------- | -------- |
| suite: Snyk Code   | manage; unified     | Semgrep for     |          |
| (SAST + SCA +      | findings            | custom rules;   |          |
| container) as the  | dashboard; one      | weaker than     |          |
| single tool.       | integration point;  | Dependabot for  |          |
|                    | potentially lower   | PR-native       |          |
|                    | total cost.         | experience      |          |
(Dependabot
opens PRs, Snyk
requires a
separate review);
Snyk's DAST
offering is
immature; lock-in
to one vendor's
roadmap.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  295

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option              | Pros              | Cons               | Verdict  |
| ------------------- | ----------------- | ------------------ | -------- |
| Outsource to a      | Zero engineering  | Loss of control    | Rejected |
| managed service:    | overhead; vendor  | over rule tuning;  |          |
| a security vendor   | handles tool      | findings latency   |          |
| runs all scans and  | maintenance;      | (vendor may batch  |          |
| provides a          | SLA-backed.       | daily, not real-   |          |
| dashboard.          |                   | time); cost is     |          |
$25K+/month;
does not integrate
into PR-time
feedback loop
(defeats shift-left
goal).
| Continue with      | Minimal cost;      | 90+ day detection  | Rejected |
| ------------------ | ------------------ | ------------------ | -------- |
| quarterly Nessus   | familiar process;  | windows; fails     |          |
| scans + annual     | no new tooling to  | regulatory due-    |          |
| pentest, no shift- | learn.             | diligence          |          |
| left tooling.      |                    | expectations;      |          |
2025 audit
explicitly flagged
this as a gap;
unacceptable risk
for a regulated
education
platform.
DECISION
ADOPTED
Adopt a defense-in-depth vulnerability management program with six
specialised tools integrated into GitHub Actions: Semgrep (SAST) on every
PR with a 5-minute SLA; Dependabot (SCA) on every PR with auto-merge for
patch updates; OWASP ZAP (DAST) nightly against staging; GitGuardian
(secret scanning) pre-receive on every push; Checkov (IaC) on every
Terraform plan; Trivy (container) at build time. Critical findings block
deployment via GitHub branch protection; high findings trigger a 7-day SLA
enforced via a Jira automation; medium findings 30-day SLA; low findings
tracked in the backlog. All findings exported to Splunk for audit evidence.
The Security Engineering Lead owns rule tuning and false-positive
reduction.
DETAILED RATIONALE
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  296

PreOne ADR - Volume 4: Security Architecture v3.0
The defense-in-depth approach was chosen over the single-vendor suite
because no single vendor is best-of-breed across all six layers. Semgrep's
custom-rule capability is unmatched — PreOne's security team can write rules
for PreOne-specific patterns (e.g., 'every Student.find() call must be wrapped in
a tenant-scope check') that Snyk Code cannot express. Dependabot is native to
GitHub, opens PRs automatically, and is free for the tier we need; Snyk's
equivalent requires a separate review workflow that adds friction. OWASP ZAP
is the only open-source DAST with credible coverage; Snyk's DAST offering is a
2024 acquisition and not yet production-grade. Trivy is the de facto standard
for container scanning, with the best CVE database coverage for Alpine-based
images (which ECS Fargate uses). The managed-service option was attractive
on operational grounds but fails the shift-left goal. The whole point of
vulnerability management in 2026 is to catch findings at PR time, where the
developer has context and the fix is small. A managed service that batches
findings daily defeats this — the developer has moved on, the fix is larger, and
the SLA clock starts later. The cost difference ($8K vs $25K per month) is also
significant, but the operational argument alone is decisive. The status-quo
option was rejected because the 2025 Bishop Fox audit explicitly flagged
quarterly Nessus scans as inadequate for a regulated education platform. The
audit cited four incidents in 18 months where known CVEs were exploited
between scans; the remediation cost of those incidents ($1.2M total) exceeded
the annual cost of the defense-in-depth tooling ($96K). The audit also noted that
the FERPA compliance officer had begun questioning the vulnerability
management program — a signal that the regulatory risk was becoming
material. The remediation SLAs (Critical=block, High=7d, Medium=30d,
Low=backlog) were calibrated against industry benchmarks (NIST SP 800-40,
SANS Vulnerability Management Survey 2024) and against PreOne's incident
history. The 7-day high SLA is tighter than the industry median of 14 days
because PreOne's regulated-data exposure justifies a higher bar. The SLAs are
enforced via GitHub branch protection (Critical) and Jira automation
(High/Medium); the Jira automation creates a ticket on finding, escalates to the
team lead at 50% of SLA, and escalates to the Security Engineering Lead at
100% of SLA. SLA breaches are reported in the monthly security scorecard.
The Splunk export is critical for audit evidence. Every finding — including false
positives and dismissed findings — is logged with the dismissal reason and the
approver. Auditors can query Splunk for 'all CRITICAL findings in Q3 2026 and
their remediation time' and get a complete answer in seconds. This audit trail is
the difference between a smooth compliance review and a multi-week evidence-
gathering exercise.
ARCHITECTURE DIAGRAM
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 297

PreOne ADR - Volume 4: Security Architecture v3.0
+------------------------------------------------------------------+ | PreOne Vulnerability
Management Program | +------------------------------------------------------------------
+ | | | Developer Pushes PR
| | | | | v
| | +------------------+ +-----------------+ +-----------------+ | | | Semgrep (SAST) | |
Dependabot(SCA) | | GitGuardian | | | | 5-min SLA | | auto-PR patch | |
(secrets) | | | +--------+---------+ +--------+--------+ +--------+--------+ | | |
| | | | +----------+----------+--------+-----------+ | |
| | | | v v | |
+---------------+ +----------------+ | | | GitHub Branch | | Splunk
(audit | | | | Protection | | trail) | | | |
(block merge) | +----------------+ | | +---------------+
| | | | Nightly:
| | +------------------+ | | | OWASP ZAP (DAST) | --
against staging --> Splunk | | +------------------+ |
| | | Build:
| | +------------------+ +------------------+ | | | Checkov (IaC) | | Trivy
(container)| | | +--------+---------+ +--------+---------+ | |
| | | | v v | |
Block deploy Block deploy | | (CRITICAL)
(CRITICAL) | +------------------------------------------------------------------+
SEQUENCE DIAGRAM
Dev -> GitHub: push branch GitHub -> GitGuardian: pre-receive hook
GitGuardian -> GitHub: OK / blocked (secret found) GitHub -> Actions: PR
opened Actions -> Semgrep: SAST scan (5min SLA) Actions -> Dependabot: SCA
scan Semgrep -> Actions: findings (CRITICAL/HIGH/MED/LOW) Dependabot ->
Actions: findings + auto-PR patch updates Actions -> GitHub: status check
(pass/fail) Actions -> Splunk: export all findings Nightly 02:00: Scheduler ->
ZAP: scan staging ZAP -> Staging: spider + active scan ZAP -> Splunk: export
findings Build time: Builder -> Checkov: scan Terraform plan Builder -> Trivy:
scan container image Checkov -> Builder: pass / fail (CRITICAL) Trivy ->
Builder: pass / fail (CRITICAL) Builder -> ECS: deploy (if pass) / block (if fail)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-083 — Vulnerability
Management - Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | GitHub Actions | PR |
Scanners (6 tools): | | | | |------->| Semgrep (SAST) | | |
+----------------+ | Dependabot (SCA) | | | | ZAP
(DAST) | | | | GitGuardian (secret)| | |
| Checkov (IaC) | | | | Trivy (container) | | |
+----------+-----------+ | | | | |
| findings | | v | | +----------------+
+----------------------+ | | | Branch Protect | block | CRITICAL findings | |
| | |------->| | | | +----------------+ +----------+-----------+
| | | | | | export
| | v | | +----------------+ +----------------------+
| | | Splunk | audit | Findings Registry | | | | |------->|
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 298

PreOne ADR - Volume 4: Security Architecture v3.0
| | | +----------------+ +----------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
PR-Time Scan Flow: Dev -> GitHub: push branch GitHub -> GitGuardian: pre-
receive (secrets) GitHub -> Actions: PR opened Actions -> Semgrep: SAST
(5min SLA) Actions -> Dependabot: SCA Semgrep/Dependabot -> Actions:
findings Actions -> Branch Protection: pass/fail Actions -> Splunk: export all
findings Build-Time Scan Flow: Builder -> Checkov: scan Terraform plan
Builder -> Trivy: scan container image Checkov/Trivy -> Builder: CRITICAL?
block : pass Nightly DAST Flow: Scheduler -> ZAP: scan staging ZAP ->
Splunk: export findings
DATABASE IMPACT
Vulnerability management has minimal direct database impact. Findings are
stored in the source-of-truth tool (Semgrep dashboard, Dependabot alerts, ZAP
reports) and exported to Splunk for audit. A single Postgres table
(security.findings_summary) materialises a weekly rollup for the security
scorecard dashboard, populated by a scheduled ETL job that queries each tool's
API. The table holds ~50K rows per quarter and is partitioned by quarter. Read-
only access is granted to the security team and engineering managers.
API IMPACT
No public API changes. The vulnerability management program is internal to
engineering. The security scorecard is surfaced in an internal admin dashboard
(admin/operations/security) that queries the findings_summary table. The
dashboard exposes a 'vulnerability trend' API endpoint (GET
/internal/security/vulnerability-trend) used by the executive scorecard; the
endpoint is admin-only and rate-limited to 10 requests per minute.
UI IMPACT
Vulnerability Management has no direct UI surface for end users. For
engineering, the admin UI includes a 'Vulnerability Dashboard'
(admin/operations/security/vulnerabilities) showing open findings by severity,
SLA compliance rate, and time-to-remediation trends. The dashboard is
updated daily from Splunk. PR-time scan results appear as GitHub status
checks ('Semgrep: 3 findings' / 'Dependabot: 1 finding'), with links to the
findings detail. Engineering managers receive a weekly email summary of their
team's open findings and SLA status. No end-user UI changes were required.
SECURITY IMPACT
This ADR is itself a security control. The defense-in-depth program directly
addresses the 2025 audit finding on vulnerability management and reduces the
mean-time-to-remediation from 21 days to under 24 hours for PR-time findings.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 299

PreOne ADR - Volume 4: Security Architecture v3.0
The program also provides the audit evidence required by FERPA, GDPR, and
DPDP. The pre-receive secret scan prevents credentials from entering git
history, eliminating the expensive history-rewrite remediation that leaked
secrets previously required (3 incidents in 2024, average remediation cost
$15K each).
PERFORMANCE IMPACT
SAST on every PR adds 3-5 minutes to CI time. To mitigate, Semgrep runs
incrementally (only changed files) and uses the Semgrep Pro Engine (compiled,
faster than the OSS engine). SCA runs in parallel with SAST. The combined
security-scan overhead is ~6 minutes per PR, which is acceptable given that the
average PR takes 18 minutes total in CI. DAST runs nightly (off-peak) and does
not affect developer workflow. Container scanning adds ~30 seconds per image
build, negligible against the 4-minute average build time.
SCALABILITY ANALYSIS
The program scales linearly with PR volume. GitHub Actions runners handle
5,000+ PRs per month currently, projected to grow to 8,000 by end-2026. The
bottleneck is runner concurrency; we provision 20 self-hosted runners (ECS-
based) to handle peak load. Splunk ingestion scales with finding volume; we
ingest ~2GB/day of security findings, well within the Splunk license. The
Security Engineering Lead handles rule tuning; as the rule library grows
(currently 240 rules), a second security engineer may be needed by mid-2027.
OPERATIONAL CONSIDERATIONS
The Security Engineering Lead is on-call for vulnerability-related escalations.
The team maintains a #security-findings Slack channel where high-priority
findings are posted automatically. The monthly security scorecard tracks: (a)
mean-time-to-remediation by severity; (b) SLA compliance rate; (c) false-
positive rate per tool; (d) coverage rate (% of repos with each scanner enabled).
Rule tuning is a weekly activity — the security team reviews the top 10 false
positives and adjusts rules. Quarterly, the team reviews new CVEs in the
dependency tree and prioritises major-version upgrades.
RISKS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 300

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk              | Likelihood | Impact | Mitigation          |
| ----------------- | ---------- | ------ | ------------------- |
| False-positive    | Medium     | High   | Weekly false-       |
| fatigue leads     |            |        | positive review;    |
| developers to     |            |        | one-click dismiss   |
| bypass or ignore  |            |        | with mandatory      |
| findings          |            |        | reason; dismissals  |
audited; SLA
exemption
requires Security
Engineering Lead
approval
| A scanner's API    | Medium | Medium | GitHub branch      |
| ------------------ | ------ | ------ | ------------------ |
| outage blocks PRs  |        |        | protection allows  |
| (availability      |        |        | manual override    |
| dependency)        |        |        | with Security      |
Engineering Lead
approval; SCA
uses vendored DB
(no API
dependency);
SAST runs on self-
hosted runner (no
vendor API)
| Scan time exceeds  | Medium | Medium | Incremental     |
| ------------------ | ------ | ------ | --------------- |
| 5-minute SLA as    |        |        | Semgrep scans   |
| codebase grows     |        |        | (changed files  |
only); rule
pruning; Semgrep
Pro Engine
upgrade; if
needed, SAST-on-
main (nightly full
scan) as fallback
| Critical finding in  | High | High | Virtual patch via   |
| -------------------- | ---- | ---- | ------------------- |
| a third-party        |      |      | WAF (ADR-084);      |
| library has no       |      |      | network isolation;  |
| patch available      |      |      | documented risk     |
acceptance with
Security
Engineering Lead
signoff; weekly
review of open
critical findings
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  301

PreOne ADR - Volume 4: Security Architecture v3.0
Risk Likelihood Impact Mitigation
Auditor challenges Low Low Documented
the program (e.g., rationale in this
'why not Snyk?') ADR; annual
program review;
quarterly threat-
model refresh
TRADE-OFFS
We Gain We Lose
Defense-in-depth with best-of-breed per Six tools to manage and tune
layer (operational complexity)
PR-time feedback loop (shift left) 5-6 minutes added to every PR's CI time
Audit evidence via Splunk export Splunk ingestion cost (~$2K/month for
security findings)
Enforceable SLAs via branch protection Developer friction when critical findings
block merge (rare but disruptive)
Open-source tools (Semgrep, ZAP, Open-source tools require more rule
Checkov, Trivy) reduce vendor lock-in tuning than commercial equivalents
REJECTED ALTERNATIVES
The Snyk single-vendor suite was piloted in Q2 2025 across two repositories.
The pilot revealed three issues: (1) Snyk Code missed custom patterns that
Semgrep caught (e.g., a PreOne-specific rule about tenant-scope wrapping); (2)
Snyk's PR-native experience was inferior to Dependabot (Snyk opened a single
'review your vulnerabilities' comment, while Dependabot opened actionable
upgrade PRs); (3) Snyk's DAST was in beta and produced 30% false positives.
The managed-service option was costed at $25K/month with a 24-hour findings
latency — incompatible with the shift-left goal. The status-quo option was
explicitly rejected by the ARB after the 2025 audit made it clear that quarterly
scans were inadequate for a regulated platform.
MIGRATION PLAN
Phase 1 (Q4 2025, complete): Semgrep, Dependabot, and GitGuardian rolled
out to all repositories. Phase 2 (Q4 2025, complete): Checkov and Trivy
integrated into CI/CD pipeline. Phase 3 (Q1 2026, complete): OWASP ZAP
nightly scans against staging. Phase 4 (Q1 2026, complete): Splunk export
configured for all tools. Phase 5 (Q2 2026, in progress): Remediation SLAs
enforced via Jira automation. Phase 6 (Q3 2026, planned): Security scorecard
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 302

PreOne ADR - Volume 4: Security Architecture v3.0
dashboard for engineering managers. The migration was non-disruptive
because each tool was rolled out independently with a one-week observation
period before SLA enforcement.
TESTING STRATEGY
Vulnerability management tools are tested via synthetic findings. Each tool has
a test repository (security-tool-test) with known vulnerabilities (e.g., a
deliberately vulnerable dependency, a deliberately hardcoded secret, a
deliberately vulnerable SQL query). The test repository is scanned nightly and
the expected findings are verified against a checklist. Missed findings or false
positives trigger a ticket to the Security Engineering Lead. The synthetic tests
catch rule regressions (e.g., a Semgrep rule update that stops matching a
known pattern). Quarterly, the security team performs a manual review of 10
random findings per tool to verify accuracy.
MONITORING & OBSERVABILITY
The security scorecard (admin/operations/security) surfaces the following
metrics: (a) findings opened/closed per week by severity; (b) mean-time-to-
remediation by severity; (c) SLA compliance rate by team; (d) false-positive rate
per tool; (e) scanner coverage (% of repos with each scanner enabled).
Anomalies (e.g., a sudden spike in CRITICAL findings) trigger a Slack alert to
#security-findings. Splunk dashboards provide the audit-evidence view, with
filters by tool, severity, repository, and date range. The Splunk data is retained
for 7 years per FERPA requirements.
FUTURE EVOLUTION
Three evolutions are likely. First, the program may expand to include runtime
vulnerability detection (e.g., Falco for runtime container security) — currently
out of scope because container runtime is AWS-managed (Fargate). Second,
the program may integrate with a bug-bounty platform (HackerOne) to
crowdsource external findings; this is planned for 2027 once the internal
program is mature. Third, the program may adopt AI-assisted vulnerability
remediation (e.g., GitHub Copilot Autofix) to reduce developer remediation
effort; this is gated on the AI tooling ADR (ADR-148) maturity.
RELATED ADRS
● ADR-002 — Modular Monolith Strategy (vulnerability management
covers the monolith and its modules)
● ADR-041 — PostgreSQL Strategy (DB-layer vulnerability scanning via
Trivy in the Postgres container build)
● ADR-077 — Encryption (encryption-at-rest and in-transit reduces the
impact of CVE exploitation)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 303

PreOne ADR - Volume 4: Security Architecture v3.0
● ADR-078 — Secrets Management (integrates with GitGuardian secret
scanning)
● ADR-082 — CSRF Strategy (CSRF tokens verified by SAST rules)
● ADR-084 — Web Application Firewall (virtual patching for unpatchable
CVEs)
● ADR-086 — Audit Trail (correlates vulnerability findings to security
events)
● ADR-087 — Penetration Testing Program (manual pentests complement
automated scanning)
● ADR-090 — Incident Response (vulnerability findings feed incident
triage)
● ADR-118 — Trunk-Based Development (small PRs ideal for shift-left
scanning)
REFERENCES
● Upstream PRD: PRD-007 (Security Requirements — vulnerability
management section)
● Upstream DDD: DDD-006 (Security Bounded Context — vulnerability
findings are an entity)
● Downstream ERD: ERD-083 (security.findings_summary table)
● Downstream API Spec: API-083 (internal security scorecard endpoints)
● Downstream Test Cases: TC-083 (synthetic vulnerability test
repository)
● External: NIST SP 800-40 (Vulnerability Management)
● External: OWASP DevSecOps Maturity Model
● External: SANS Vulnerability Management Survey 2024
DECISION HISTORY
Date Status Actor Notes
2025-09-06 Draft Security Initial draft;
Engineering Lead options
enumerated;
consultation with
security and
engineering teams
2025-10-23 Proposed Security Submitted to
Engineering Lead Architecture
Review Board
after cross-team
review
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 304

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status   | Actor     | Notes          |
| ---------- | -------- | --------- | -------------- |
| 2025-11-20 | Accepted | ARB Chair | ARB approved;  |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect           |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Security Engineering Lead |     |
| ARB Chair   |     | ARB Chair                 |     |
| Approved On |     | 2025-11-20                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Semgrep (SAST) on every PR (Done)
● Dependabot (SCA) on every PR (Done)
● GitGuardian (secret scan) pre-receive (Done)
● OWASP ZAP (DAST) nightly (Done)
● Checkov (IaC scan) on every Terraform plan (Done)
● Trivy (container scan) at build (Done)
● Splunk findings export + dashboard (Done)
● Jira SLA automation (critical=block, high=7d, med=30d) (Done)
AD R -084
Web Application Firewall
Volume 4 — Security Architecture  -  Identity & Security
ACCEPTED
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  305

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION SUMMARY
DECISION
Adopt AWS WAF v2 with the AWS Managed Core Rule Set and AWS
Managed Known Bad Inputs Rule Set as the primary WAF, attached to the
CloudFront distribution and Application Load Balancer. Custom rules block
geographic restrictions (per data residency), rate-limit abusive IPs, and
virtual-patch known CVEs awaiting upstream fixes. WAF logs ship to S3 +
Splunk for analysis. The WAF runs in 'count' mode for one week before any
new rule is promoted to 'block' mode, ensuring zero false-positive
blockpages for legitimate users.
STATUS
Status Accepted
Date Decided 2025-12-02
Decision Owner Security Engineering Lead
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne's public-facing surface includes the web application (CloudFront + ALB
+ ECS Fargate), the public API (API Gateway + Lambda), and the parent mobile
app's backend API. The 2025 Bishop Fox penetration test identified the
application layer as the second-highest risk area (after dependency CVEs),
citing specific OWASP Top 10 categories: A01 Broken Access Control, A03
Injection, and A05 Security Misconfiguration. While SAST (ADR-083) catches
code-level vulnerabilities, it cannot catch runtime attacks against running
infrastructure — that is the WAF's job. The legacy platform used Cloudflare's
free-tier WAF, which provided limited customisation and no integration with
the AWS-native tooling. The migration to AWS-native infrastructure (ADR-002
modular monolith on ECS Fargate) made AWS WAF the natural choice for
consistency. AWS WAF v2 (released 2019, GA 2020) is production-mature,
integrates natively with CloudFront and ALB, and supports the AWS Managed
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 306

PreOne ADR - Volume 4: Security Architecture v3.0
Rules that cover OWASP Top 10. The WAF's role is defense-in-depth: it is not
the primary defense (which is secure coding + SAST + dependency scanning),
but it provides a runtime layer that can block attacks the primary defenses
miss, and can virtual-patch known CVEs while the upstream fix is being
developed. The WAF also provides rate-limiting, which is critical for the public
API (ADR-076) to prevent credential-stuffing and brute-force attacks.
BUSINESS DRIVERS
The primary driver is runtime defense. SAST catches code vulnerabilities at PR
time, but a CVE in a production dependency may not be patched for days; the
WAF provides immediate runtime protection via a virtual patch. In 2025, three
CVEs in production dependencies were exploited before patches were
available; the WAF (had it been deployed) would have blocked all three. The
estimated incident-cost avoidance is $200K per year. A secondary driver is
rate-limiting. The public API (parent app, third-party integrations) is subject to
credential-stuffing attacks (3-5 per month, each with 10K-100K attempts) and
occasional DDoS attempts. The WAF's rate-based rules throttle abusive IPs,
protecting backend services from load spikes. Without WAF rate-limiting, the
API Gateway throttle (10K RPS) is the only protection — too coarse for
sophisticated attacks. A tertiary driver is compliance. PCI DSS Requirement
6.6 mandates either code review or a WAF for public-facing applications; while
PreOne is not PCI-regulated, the same control is expected by FERPA auditors as
a 'reasonable security practice'. The WAF provides documentary evidence of
runtime application-layer defense.
PROBLEM STATEMENT
PreOne requires a Web Application Firewall in front of all public-facing
surfaces to provide runtime defense against OWASP Top 10 attacks, rate-
limiting against credential stuffing and brute force, and virtual patching for
CVEs awaiting upstream fixes — with zero false-positive blockpages for
legitimate users.
CONSTRAINTS
● WAF must integrate natively with AWS CloudFront and ALB (no
separate proxy tier)
● Managed Rules must be AWS-curated (no third-party rule subscriptions
to reduce operational burden)
● Every new rule must run in 'count' mode for one week before
promotion to 'block' mode
● WAF logs must ship to S3 (90-day retention) and Splunk (1-year
retention for audit)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 307

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● Custom rules must be version-controlled in Terraform (no console-only
changes)
● Blockpage must be branded (PreOne logo + support contact) and HTTP
403 with JSON body
● False-positive blockpage must be revertible within 5 minutes
(Terraform apply)
ASSUMPTIONS
● AWS Managed Core Rule Set covers >= 90% of OWASP Top 10 attacks
at acceptable false-positive rate
● CloudFront + ALB can sustain the additional WAF inspection latency
(<10ms p99)
● WAF logs to S3 are sufficiently timely for incident response (5-minute
delivery)
● The engineering team will respect the count-mode -> block-mode
promotion workflow
● AWS WAF pricing ($5/rule/month + $1/million requests) is acceptable
against the security budget
OPTIONS CONSIDERED
| Option              | Pros               | Cons                | Verdict |
| ------------------- | ------------------ | ------------------- | ------- |
| AWS WAF v2 with     | Native AWS         | AWS Managed         | Adopted |
| AWS Managed         | integration;       | Rules are less      |         |
| Rules, attached to  | managed rules      | comprehensive       |         |
| CloudFront +        | reduce             | than Cloudflare's   |         |
| ALB, count-mode     | operational        | equivalent; no bot- |         |
| promotion           | burden;            | management out-     |         |
| workflow.           | Terraform-         | of-the-box; cost    |         |
|                     | managed for        | scales with         |         |
|                     | audit; integrates  | request volume.     |         |
with Splunk;
consistent with
AWS-native
architecture
(ADR-002).
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  308

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option             | Pros                | Cons                 | Verdict  |
| ------------------ | ------------------- | -------------------- | -------- |
| Cloudflare WAF     | Best-in-class       | Introduces a non-    | Rejected |
| on the free/pro    | managed rules;      | AWS dependency;      |          |
| plan, with         | bot management      | Cloudflare's WAF     |          |
| Cloudflare as the  | included; global    | rules are not        |          |
| edge proxy.        | edge network        | Terraform-           |          |
|                    | (faster than        | managed (console-    |          |
|                    | CloudFront for      | driven); log export  |          |
|                    | some regions);      | to Splunk requires   |          |
|                    | generous free tier. | Cloudflare           |          |
Enterprise
($5K+/month);
conflicts with the
AWS-native
architecture
(ADR-002).
| Open-source        | Free (open-        | Self-managed         | Rejected |
| ------------------ | ------------------ | -------------------- | -------- |
| ModSecurity WAF    | source); OWASP     | infrastructure       |          |
| on a self-managed  | Core Rule Set is   | (operational         |          |
| EC2 proxy tier.    | comprehensive;     | overhead); single    |          |
|                    | full control over  | point of failure if  |          |
|                    | rules.             | proxy tier fails;    |          |
ModSecurity
performance is
poor under high
load; requires a
dedicated
engineer to
maintain.
| No WAF; rely on  | Zero cost; no        | No runtime         | Rejected |
| ---------------- | -------------------- | ------------------ | -------- |
| SAST + DAST +    | operational          | defense; cannot    |          |
| secure coding    | overhead; no         | virtual-patch      |          |
| alone.           | false-positive risk. | CVEs; fails FERPA  |          |
'reasonable
security practice'
expectation; 2025
audit explicitly
recommended
WAF adoption.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  309

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
Adopt AWS WAF v2 with the AWS Managed Core Rule Set and AWS
Managed Known Bad Inputs Rule Set, attached to the CloudFront
distribution (web application) and Application Load Balancer (public API).
Custom rules enforce: (1) geographic restrictions per data residency (India,
EU, US only — other countries blocked with a 403); (2) rate-limiting (100
requests/minute per IP for the login endpoint, 1000/minute for general API);
(3) virtual patches for known CVEs awaiting upstream fixes. Every new rule
runs in 'count' mode for one week; the security team reviews counts and
false-positive indicators before promoting to 'block' mode. WAF logs ship to
S3 (90-day retention, Athena-queryable) and Splunk (1-year retention for
audit). All rules are Terraform-managed.
DETAILED RATIONALE
AWS WAF v2 was chosen over Cloudflare because of architectural consistency.
PreOne's infrastructure is AWS-native (ADR-002: ECS Fargate, RDS, S3,
CloudFront); introducing Cloudflare as the edge proxy would split the
operational model, complicate Terraform, and require a separate log pipeline.
The AWS WAF's tighter integration with CloudFront and ALB (one-click attach,
native log destination) outweighs Cloudflare's marginally better rule set. The
Cloudflare Enterprise tier ($5K+/month) required for Splunk log export would
have negated the cost advantage. The AWS Managed Rules were chosen over
self-written rules because the AWS security team maintains them against the
evolving threat landscape (CVE feeds, OWASP updates). PreOne's security
team is two engineers; writing and maintaining custom rules against 10,000+
daily attack signatures is infeasible. The Managed Core Rule Set covers OWASP
Top 10 with documented false-positive rates under 0.1% for typical web traffic
— acceptable given the count-mode promotion workflow. The count-mode ->
block-mode promotion workflow is the critical design choice. WAF false
positives that block legitimate users are worse than no WAF at all — they
generate customer support tickets, churn, and reputational damage. The one-
week count-mode period allows the security team to verify that a rule blocks
attacks without blocking legitimate traffic. Rules that show any false positives
in count mode are tuned (e.g., exclude a specific path or user agent) before
promotion. The workflow is enforced via Terraform: a rule's 'action' attribute is
set to 'count' for one week, then a PR promotes it to 'block' after review. The
geographic restriction rule is mandated by data residency requirements.
PreOne's Indian customers' data must not be accessed from outside India
(DPDP); EU customers' data must not be accessed from outside the EU (GDPR).
The WAF blocks requests from non-allowed countries at the edge, before they
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 310

PreOne ADR - Volume 4: Security Architecture v3.0
reach the application. This is a defense-in-depth control — the application also
enforces residency via IP-based geolocation (ADR-043) — but the WAF block is
faster (no application processing) and cheaper (no compute cost for blocked
requests). Rate-limiting is the second critical custom rule. The login endpoint is
the most-attacked (credential stuffing); a 100/minute per-IP limit blocks
automated stuffing tools without affecting legitimate users (who attempt <5
logins per minute). The general API limit (1000/minute per IP) is generous
enough for legitimate integrations but blocks simple DDoS attempts.
Sophisticated DDoS attacks with distributed IPs are handled by AWS Shield
(standard, included with CloudFront) and AWS Shield Advanced (ADR-085) for
the largest attacks. Virtual patching is the WAF's highest-value feature. When
a CVE is announced in a production dependency (e.g., a Struts-style RCE), the
WAF can block the exploit signature within hours, while the upstream patch
may take days to develop and deploy. In 2025, three such CVEs were exploited
before patches were available; the WAF would have blocked all three. The
virtual patch is a temporary rule, removed when the upstream patch is
deployed and verified. The security team maintains a runbook for virtual
patching: monitor CVE feeds, evaluate exploitability, write WAF rule, deploy in
count mode for 24 hours (faster than the standard one-week), promote to block
mode.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | PreOne WAF Topology
| +------------------------------------------------------------------+ |
| | Client Request | | |
| | v | | +-------------------+
| | | AWS CloudFront | (edge location, global) | | | + AWS WAF v2
| | | | - Managed Core | | |
| - Known Bad | | | | Inputs |
| | | - Geo restrict | | | | - Rate limit |
| | | - Virtual patch | | | +---------+---------+
| | | | | v
| | +-------------------+ | | | Application Load |
| | | Balancer (ALB) | | | | + AWS WAF v2 |
(defense-in-depth, same rules) | | +---------+---------+
| | | | | v
| | +-------------------+ | | | ECS Fargate |
| | | (Modular Monolith)| | | +-------------------+
| | | | Logging:
| | WAF -> S3 (90-day, Athena-queryable) | | WAF -> Splunk (1-
year, audit) | | | |
Terraform: | | All rules version-controlled;
| | count-mode -> block-mode promotion enforced via PR review |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 311

PreOne ADR - Volume 4: Security Architecture v3.0
Client -> CloudFront: HTTPS request CloudFront -> WAF: inspect request WAF
-> WAF: check managed rules WAF -> WAF: check custom rules (geo, rate,
virtual patch) alt rule matches in 'count' mode WAF -> S3: log (counted, not
blocked) WAF -> CloudFront: allow else rule matches in 'block' mode WAF ->
Client: 403 + JSON body WAF -> S3: log (blocked) else no rule matches WAF
-> CloudFront: allow end CloudFront -> ALB: forward (if allowed) ALB -> WAF:
inspect (defense-in-depth) WAF -> ALB: allow / block ALB -> ECS: forward (if
allowed) ECS -> ALB: response
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-084 — Web Application
Firewall - Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | CloudFront | recv | AWS
WAF v2 | | | | | req | - Managed Core Rule | | |
+----------------+ | - Known Bad Inputs | | | | - Geo
restrict | | | | - Rate limit | | |
| - Virtual patch | | | +----------+-----------+ | |
| | | | match? | |
v | | +----------------+ +----------------------+ | | | WAF Action |
block/ | 403 JSON response | | | | | count | + log to S3/Splunk |
| | +----------------+ +----------------------+ | |
| | Rules: Terraform-managed; count-mode -> block-mode promo |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Data Flow: Producer -> App Service -> Security Component -> Audit Security
Component -> Splunk (logs) Security Component -> Alert (if anomaly) Read
Flow: Consumer -> App Service -> Security Component -> allow/deny
DATABASE IMPACT
WAF has no direct database impact. WAF logs are written to S3 (object storage,
not Postgres). The security.findings_summary table (from ADR-083) includes a
row for WAF-blocked requests aggregated daily, populated by a Splunk-to-
Postgres ETL job. The WAF logs in S3 are queryable via Athena for ad-hoc
analysis (e.g., 'show me all blocked requests from IP X in the last 24 hours'). No
schema changes are required.
API IMPACT
No API changes. WAF is transparent to the application. Blocked requests
receive an HTTP 403 with a JSON body: { error: 'request_blocked', reason:
'waf_rule_matched', rule_id: '...', support_contact: 'security@preone.com' }.
The error response is branded (PreOne logo in the HTML variant for browser
requests). The application's error handler logs the WAF block ID for correlation
with WAF logs in Splunk. Legitimate API consumers are unaffected unless they
trigger a rule (e.g., a third-party integration that sends a suspicious payload) —
in which case the security team works with the consumer to whitelist their
traffic via a WAF exclusion.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 312

PreOne ADR - Volume 4: Security Architecture v3.0
UI IMPACT
The UI surface for this ADR is minimal — the decision is primarily a security-
layer concern. Where the decision affects the user experience, it is through
indirect mechanisms (authentication flow, authorization visibility,
performance, latency) rather than direct UI elements. The admin UI may
include a read-only status page showing the relevant security configuration or
health metrics for SRE visibility; end-user-facing changes are limited to
incidental security or reliability improvements.
SECURITY IMPACT
The WAF is a critical security control. It provides runtime defense against
OWASP Top 10 attacks, rate-limits credential stuffing and brute force, and
virtual-patches known CVEs. The 2025 audit cited three CVE-exploitation
incidents that the WAF would have blocked; the estimated annual incident-cost
avoidance is $200K. The geographic restriction rule enforces data residency at
the edge, before any application processing — a defense-in-depth complement
to the application-layer residency enforcement (ADR-043). The WAF also
provides documentary evidence of application-layer defense for
FERPA/GDPR/DPDP audits.
PERFORMANCE IMPACT
WAF inspection adds 5-10ms p99 latency to every request. This is acceptable
given CloudFront's typical 30-50ms edge latency. The WAF runs at the edge
(CloudFront) and at the ALB, providing defense-in-depth without doubling
latency (the ALB WAF only runs for requests that bypass CloudFront, e.g.,
direct ALB access for internal API consumers). Rate-limiting rules have
negligible performance impact (constant-time lookup in a sliding window). WAF
log delivery to S3 is asynchronous and does not affect request latency.
SCALABILITY ANALYSIS
AWS WAF scales with the AWS edge network (no PreOne-managed capacity).
The WAF has handled peak traffic of 50K RPS (back-to-school enrollment peak
in August 2025) with no degradation. Cost scales linearly with request volume:
at 200M requests/month (current), WAF cost is ~$1,500/month for rules +
$200 for requests = $1,700/month. Projected 2027 traffic (500M
requests/month) increases cost to ~$3,500/month — well within the security
budget.
OPERATIONAL CONSIDERATIONS
The Security Engineering Lead is on-call for WAF-related escalations. The team
monitors a #waf-alerts Slack channel where WAF block spikes (e.g., a 10x
increase in blocked requests in a 5-minute window) are posted automatically.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 313

PreOne ADR  -  Volume 4: Security Architecture  v3.0
Weekly, the team reviews the top 10 blocked IPs and the top 10 triggered rules;
recurring false-positive indicators (e.g., a rule that blocks a legitimate API
consumer) are tuned. Monthly, the team reviews the count-mode rules and
promotes qualified rules to block mode. The WAF Terraform module is
reviewed annually for rule coverage and false-positive rate.
RISKS
| Risk                | Likelihood | Impact | Mitigation         |
| ------------------- | ---------- | ------ | ------------------ |
| False-positive      | Medium     | High   | Count-mode         |
| block disrupts      |            |        | promotion          |
| legitimate users    |            |        | workflow; 5-       |
| (e.g., a managed    |            |        | minute revert via  |
| rule update blocks  |            |        | Terraform;         |
| a valid user agent) |            |        | branded            |
blockpage with
support
contact;Splunk
dashboard for
false-positive
detection
| WAF rule bypass   | Medium | Medium | Defense-in-depth  |
| ----------------- | ------ | ------ | ----------------- |
| (attacker crafts  |        |        | (SAST, DAST,      |
| request that      |        |        | secure coding);   |
| evades the rule)  |        |        | AWS Managed       |
Rules updated
quarterly; annual
penetration test
(ADR-087) tests
WAF bypass
| WAF outage          | Low | High | AWS WAF is a      |
| ------------------- | --- | ---- | ----------------- |
| blocks all traffic  |     |      | managed service   |
| (availability       |     |      | with 99.95% SLA;  |
| impact)             |     |      | failover path     |
bypasses WAF
(direct ALB) via
Route53 health
check;
documented
runbook
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  314

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation         |
| ------------------- | ---------- | ------ | ------------------ |
| Geographic          | Medium     | Medium | Support-ticket-    |
| restriction blocks  |            |        | driven whitelist   |
| legitimate users    |            |        | process (5-minute  |
| (e.g., a teacher    |            |        | Terraform apply);  |
| traveling abroad)   |            |        | VPN-based access   |
for traveling staff;
documented in
user guide
| Cost overrun from     | Low | Low | AWS budget alert    |
| --------------------- | --- | --- | ------------------- |
| request-volume        |     |     | at 80% of monthly   |
| spike (e.g., a viral  |     |     | WAF budget; rate-   |
| moment drives         |     |     | limiting rules cap  |
| 10x traffic)          |     |     | abusive traffic;    |
monthly cost
review
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Runtime defense against OWASP Top  5-10ms added latency per request
10 + virtual patching
Native AWS integration (CloudFront +  AWS Managed Rules are less
| ALB + Splunk) |     | comprehensive than Cloudflare's |     |
| ------------- | --- | ------------------------------- | --- |
Terraform-managed rules for audit and  Console-driven rule tuning is faster but
| version control |     | not auditable |     |
| --------------- | --- | ------------- | --- |
Count-mode promotion workflow  One-week delay before new rules
| prevents false-positive blocks |     | enforce |     |
| ------------------------------ | --- | ------- | --- |
Geographic restriction enforces data  Legitimate traveling users require
| residency at edge |     | manual whitelist |     |
| ----------------- | --- | ---------------- | --- |
REJECTED ALTERNATIVES
Cloudflare WAF was piloted in Q3 2025 on the staging environment. The pilot
found Cloudflare's managed rules marginally better than AWS's (caught 95% vs
92% of OWASP test cases), but the operational overhead of managing a non-
AWS edge proxy (separate Terraform provider, separate log pipeline, separate
on-call   runbook)   outweighed   the   marginal   rule-quality   advantage.   The
ModSecurity self-hosted option was rejected after a capacity-planning exercise
showed it would require 4 dedicated EC2 instances with active-active
redundancy, plus a dedicated engineer for rule maintenance — incompatible
with the two-engineer security team. The 'no WAF' option was explicitly
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  315

PreOne ADR - Volume 4: Security Architecture v3.0
rejected by the ARB after the 2025 audit cited three CVE-exploitation incidents
that WAF would have blocked.
MIGRATION PLAN
Phase 1 (Q4 2025, complete): AWS WAF v2 attached to CloudFront in count
mode for all managed rules. Phase 2 (Q4 2025, complete): One-week count-
mode observation; rules promoted to block mode after false-positive review.
Phase 3 (Q1 2026, complete): WAF attached to ALB (defense-in-depth). Phase 4
(Q1 2026, complete): Custom rules for geographic restriction, rate-limiting,
and virtual patching. Phase 5 (Q2 2026, complete): Splunk integration for log
analysis. Phase 6 (Q3 2026, planned): WAF dashboard for engineering
managers. Migration was non-disruptive because count-mode rules do not
block traffic; the cutover to block mode was gradual (one rule per day) with
rollback on any false-positive indicator.
TESTING STRATEGY
WAF rules are tested via the AWS WAF Testing API and a synthetic attack-
replay suite. The testing repository (security-waf-test) contains 100+ attack
payloads (SQL injection, XSS, path traversal, log4j, etc.) replayed against
staging weekly. Expected: all attacks blocked in block mode; all attacks
counted in count mode. False-positive tests replay legitimate traffic (recorded
production traffic, sanitised) and verify zero blocks. Monthly, the team runs an
OWASP ZAP scan against staging with WAF enabled to verify end-to-end
protection. Quarterly, the team reviews AWS's Managed Rules changelog for
rule updates that may require re-tuning.
MONITORING & OBSERVABILITY
WAF logs ship to S3 (5-minute delivery) and Splunk (real-time via Kinesis
Firehose). Splunk dashboards track: (a) blocked requests per minute by rule;
(b) top blocked IPs (last 24 hours); (c) top triggered rules (last 7 days); (d)
count-mode rule trends (indicates attack patterns before block promotion); (e)
false-positive indicators (legitimate traffic blocked, detected via support ticket
correlation). Anomalies (e.g., a 10x spike in a specific rule) trigger Slack alerts.
The WAF dashboard (admin/operations/security/waf) provides a real-time view
for the security team.
FUTURE EVOLUTION
Three evolutions are likely. First, bot management may be added (AWS WAF
bot control rule) to differentiate automated traffic from human traffic — useful
for the public API where legitimate bots (third-party integrations) and
malicious bots (credential stuffing) coexist. Second, machine-learning-based
anomaly detection (AWS WAF Fraud Control) may be enabled for the login
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 316

PreOne ADR - Volume 4: Security Architecture v3.0
endpoint to detect credential stuffing patterns beyond simple rate-limiting.
Third, the WAF may be extended to the internal API Gateway (between
services) for defense-in-depth, though this is gated on a performance impact
assessment.
RELATED ADRS
● ADR-002 — Modular Monolith Strategy (WAF protects the monolith's
public surface)
● ADR-043 — Tenant Isolation (WAF geo-restriction complements tenant
isolation)
● ADR-076 — API Security (WAF rate-limits protect the public API)
● ADR-080 — Rate Limiting (WAF provides IP-based rate-limiting;
ADR-080 provides user-based)
● ADR-081 — Security Headers (WAF enforces security headers in
addition to application)
● ADR-083 — Vulnerability Management (WAF virtual-patches CVEs
found by vuln mgmt)
● ADR-085 — DDoS Protection (WAF is the application-layer component
of DDoS defense)
● ADR-086 — Audit Trail (WAF logs feed the audit trail)
● ADR-087 — Penetration Testing Program (pentests verify WAF
effectiveness)
REFERENCES
● Upstream PRD: PRD-007 (Security Requirements — WAF section)
● Downstream ERD: ERD-084 (security.waf_findings table for aggregated
WAF metrics)
● Downstream API Spec: API-084 (internal WAF dashboard endpoints)
● Downstream Test Cases: TC-084 (WAF attack-replay test suite)
● External: AWS WAF Developer Guide
● External: OWASP ModSecurity Core Rule Set
● External: NIST SP 800-44 (Guidelines on Securing Public Web Servers)
DECISION HISTORY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 317

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status | Actor            | Notes           |
| ---------- | ------ | ---------------- | --------------- |
| 2025-09-18 | Draft  | Security         | Initial draft;  |
|            |        | Engineering Lead | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-11-04 | Proposed | Security         | Submitted to  |
| ---------- | -------- | ---------------- | ------------- |
|            |          | Engineering Lead | Architecture  |
Review Board
after cross-team
review
| 2025-12-02 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect           |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Security Engineering Lead |     |
| ARB Chair   |     | ARB Chair                 |     |
| Approved On |     | 2025-12-02                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
AD R -085
DDoS Protection
Volume 4 — Security Architecture  -  Identity & Security
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  318

PreOne ADR - Volume 4: Security Architecture v3.0
ACCEPTED
DECISION SUMMARY
DECISION
Adopt AWS Shield Standard (included with CloudFront and ALB at no
additional cost) as the baseline DDoS protection for all public-facing
surfaces, and AWS Shield Advanced for the CloudFront distribution and the
public API Gateway (the two highest-value targets). Shield Advanced
provides 24/7 DDoS response team access, financial protection against
scaling costs from DDoS-driven traffic, and advanced detection for
application-layer (Layer 7) attacks. Layer 4 (volumetric) attacks are
absorbed by CloudFront and Route53; Layer 7 attacks are mitigated by
WAF (ADR-084) rate-limiting and Shield Advanced's application-layer DDoS
mitigation.
STATUS
Status Accepted
Date Decided 2025-12-10
Decision Owner Security Engineering Lead
Review Cadence Annual review, or on threat
landscape shift, or on tooling vendor
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne's public-facing infrastructure is subject to regular DDoS attempts. In
2024-2025, the platform experienced 12 documented DDoS incidents: 8 were
low-volume Layer 4 attacks (under 10 Gbps) absorbed automatically by
CloudFront; 3 were Layer 7 application-layer attacks targeting the login and
search endpoints, mitigated by WAF rate-limiting; 1 was a 47 Gbps volumetric
attack that saturated a single CloudFront edge location for 18 minutes before
AWS Shield Standard mitigated it. None of these incidents caused customer-
visible outage, but the trend is increasing in both frequency and volume. The
2025 Bishop Fox audit cited DDoS resilience as a 'mature but with room for
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 319

PreOne ADR - Volume 4: Security Architecture v3.0
improvement' area. The recommendation was to evaluate AWS Shield
Advanced for the highest-value surfaces (CloudFront, public API Gateway) to
gain 24/7 DDoS response team (DRT) access and financial protection against
scaling costs. The audit noted that a sustained 100+ Gbps attack could trigger
$50K+ in CloudFront and ECS Fargate autoscaling costs in a single day —
Shield Advanced's financial protection caps this exposure. PreOne's threat
model identifies the enrollment peak (August) and the report-card release
windows (quarterly) as the highest-impact times for a DDoS attack — an outage
during enrollment could delay school openings and cause contract penalties.
The DDoS protection strategy must be 'always on' rather than 'on-demand' to
ensure protection during these critical windows.
BUSINESS DRIVERS
The primary driver is availability during critical business windows. The August
2025 enrollment peak saw 3 DDoS attempts; an outage during this window
would have caused direct revenue loss (delayed enrollments) and reputational
damage. Shield Advanced's 24/7 DRT access ensures a human expert is
available within 15 minutes during a sophisticated attack. A secondary driver is
financial protection. A sustained 100 Gbps attack could trigger $50K+ in
autoscaling costs (CloudFront, ALB, ECS Fargate, RDS read replicas). Shield
Advanced caps this exposure by covering the scaling costs attributed to the
attack. Without Shield Advanced, a single sophisticated attack could consume
the entire annual infrastructure budget. A tertiary driver is compliance.
FERPA's 'reasonable security practice' expectation includes availability
controls; DDoS protection is a standard availability control. The Shield
Advanced subscription provides documentary evidence of proactive DDoS
mitigation for auditors.
PROBLEM STATEMENT
PreOne requires always-on DDoS protection for all public-facing surfaces, with
24/7 expert response for sophisticated attacks and financial protection against
scaling costs, to ensure availability during critical business windows
(enrollment, report-card release) and to comply with FERPA availability
expectations.
CONSTRAINTS
● DDoS protection must be 'always on' (no on-demand activation that
could fail during an attack)
● Layer 4 protection must absorb attacks at the edge (CloudFront,
Route53) — no traffic reaching ALB
● Layer 7 protection must integrate with WAF (ADR-084) rate-limiting
rules
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 320

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● Shield Advanced DRT access must be available 24/7 with 15-minute
response SLA
● Financial protection must cover CloudFront, ALB, ECS Fargate, and
RDS scaling costs
● Shield Advanced subscription must be cost-justified against the
documented DDoS risk
● DDoS response runbook must be tested quarterly via tabletop exercise
ASSUMPTIONS
● AWS Shield Standard provides adequate Layer 4 protection for non-
Advanced-protected resources
● Shield Advanced's $3,000/month cost is justified by the $50K+ scaling-
cost exposure per major attack
● Shield Advanced DRT can mitigate a sophisticated Layer 7 attack
within 30 minutes of engagement
● CloudFront's global edge network (400+ PoPs) can absorb volumetric
attacks up to 100 Gbps
● Route53 health checks failover to a static S3 maintenance page within
60 seconds of ALB failure
OPTIONS CONSIDERED
| Option             | Pros                 | Cons               | Verdict |
| ------------------ | -------------------- | ------------------ | ------- |
| AWS Shield         | Defense-in-depth;    | Shield Advanced    | Adopted |
| Standard (free) +  | DRT access for       | cost ($3K/month);  |         |
| AWS Shield         | sophisticated        | Shield Advanced    |         |
| Advanced (paid)    | attacks; financial   | protects only      |         |
| for highest-value  | protection against   | named resources    |         |
| surfaces.          | scaling costs;       | (CloudFront        |         |
|                    | native AWS           | distribution, API  |         |
|                    | integration; aligns  | Gateway) — not     |         |
|                    | with AWS-native      | all resources.     |         |
architecture.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  321

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option              | Pros              | Cons                | Verdict  |
| ------------------- | ----------------- | ------------------- | -------- |
| Cloudflare Magic    | Best-in-class     | Introduces a non-   | Rejected |
| Transit / DDoS      | DDoS mitigation;  | AWS dependency;     |          |
| Protection as the   | global anycast    | conflicts with the  |          |
| edge layer for all  | network; bot      | AWS-native          |          |
| traffic.            | management        | architecture        |          |
|                     | included; flat    | (ADR-002); log      |          |
|                     | pricing.          | export to Splunk    |          |
requires
Enterprise tier;
Shield Advanced's
DRT access is
unmatched by
Cloudflare's
automated
mitigation.
| AWS Shield         | Zero additional  | No DRT access for   | Rejected |
| ------------------ | ---------------- | ------------------- | -------- |
| Standard only (no  | cost; Shield     | sophisticated       |          |
| Shield Advanced);  | Standard         | attacks; no         |          |
| rely on            | mitigates most   | financial           |          |
| CloudFront +       | Layer 4 attacks  | protection against  |          |
| WAF rate-limiting. | automatically.   | scaling costs; the  |          |
2025 47 Gbps
attack would have
cost $30K+ in
scaling without
Shield Advanced.
| Self-managed        | No vendor lock-in;  | Self-managed       | Rejected |
| ------------------- | ------------------- | ------------------ | -------- |
| DDoS mitigation     | full control.       | capacity cannot    |          |
| via on-demand       |                     | scale fast enough  |          |
| capacity (ECS       |                     | to absorb a 100+   |          |
| Fargate autoscale)  |                     | Gbps attack; WAF   |          |
| + WAF rate-         |                     | rate-limiting is   |          |
| limiting.           |                     | per-IP and         |          |
ineffective against
distributed
attacks; fails the
'always on'
requirement.
DECISION
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  322

PreOne ADR - Volume 4: Security Architecture v3.0
ADOPTED
Adopt AWS Shield Standard (free, included with CloudFront and ALB) as
the baseline DDoS protection for all public-facing surfaces, and AWS Shield
Advanced ($3K/month) for the CloudFront distribution and the public API
Gateway (the two highest-value targets). Shield Advanced provides: (1) 24/7
DDoS Response Team (DRT) access with 15-minute response SLA; (2)
financial protection against scaling costs attributed to DDoS attacks; (3)
advanced detection for application-layer (Layer 7) attacks; (4) AWS WAF
integration for Layer 7 mitigation. Layer 4 (volumetric) attacks are
absorbed by CloudFront and Route53 (Shield Standard); Layer 7 attacks are
mitigated by WAF rate-limiting (ADR-084) and Shield Advanced's
application-layer DDoS mitigation. The DDoS response runbook is tested
quarterly via tabletop exercise.
DETAILED RATIONALE
The hybrid Shield Standard + Shield Advanced approach was chosen because it
provides defense-in-depth at appropriate cost. Shield Standard (free) covers all
resources with baseline Layer 4 protection — sufficient for the majority of
attacks. Shield Advanced ($3K/month = $36K/year) is reserved for the two
highest-value targets (CloudFront, public API Gateway) where the financial
protection and DRT access justify the cost. The cost-justification for Shield
Advanced is straightforward. The 2025 47 Gbps attack triggered $30K in
scaling costs (CloudFront, ALB, ECS Fargate) over 18 minutes. Without Shield
Advanced, a sustained 6-hour 100 Gbps attack could cost $200K+. Shield
Advanced's annual cost ($36K) is a fraction of one major-attack scaling cost.
The DRT access is the secondary value: a human expert who can mitigate
sophisticated Layer 7 attacks (e.g., a slowloris variant that evades WAF rate-
limiting) within 30 minutes is invaluable during a critical business window.
Cloudflare Magic Transit was the strongest alternative. Cloudflare's anycast
network is marginally larger than CloudFront's (300+ vs 400+ PoPs, but
Cloudflare's network capacity is higher), and Cloudflare's bot management is
more sophisticated than AWS's. However, introducing Cloudflare as the edge
layer for all traffic would split the operational model: CloudFront for static
content, Cloudflare for DDoS, separate log pipelines, separate Terraform
providers. The operational overhead outweighs the marginal technical
advantage. Cloudflare's enterprise tier (required for Splunk log export) costs
$5K+/month, more than Shield Advanced. The 'Shield Standard only' option
was rejected because the 2025 attack demonstrated the scaling-cost exposure.
The 47 Gbps attack cost $30K in 18 minutes; a sustained attack would have cost
10x that. Without Shield Advanced's financial protection, PreOne would have
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 323

PreOne ADR - Volume 4: Security Architecture v3.0
absorbed the cost; with Shield Advanced, AWS credits the scaling cost
attributed to the attack. The DRT access is also valuable: the 2025 attack
required manual WAF rule tuning by the security team (2 engineers, 4 hours);
the DRT could have done it in 30 minutes. The self-managed option was
rejected because no amount of ECS Fargate autoscaling can absorb a 100+
Gbps volumetric attack. The AWS edge network (CloudFront + Route53) has
100+ Tbps of aggregate capacity; PreOne's ECS Fargate cluster has 50 Gbps. A
volumetric attack exceeding 50 Gbps would saturate PreOne's AWS account,
even with autoscaling. Only the AWS edge network (or Cloudflare's equivalent)
can absorb such attacks. The quarterly tabletop exercise is the operational
backbone. The exercise simulates a DDoS attack: the security team receives a
simulated alert, follows the runbook (engage DRT, tune WAF, communicate to
stakeholders), and times the response. The exercise surfaces runbook gaps
(e.g., 'who is the DRT contact during Indian business hours?') and trains the
team. The exercise is mandatory for the security team and the on-call SRE; the
CTO observes annually.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | PreOne DDoS Protection
Topology | +------------------------------------------------------------------+ |
| | Attacker Traffic | | |
| | v | | +-------------------+ Layer 4
(volumetric) | | | AWS Shield | - absorbed at edge | |
| Standard (free) | - 100+ Tbps aggregate capacity | | | + CloudFront |
| | | + Route53 | | | +---------+---------+
| | | | | | (mitigated Layer 4)
| | v | | +-------------------+ Layer 7
(application) | | | AWS Shield | - DRT access (24/7, 15-min SLA)
| | | Advanced ($3K/mo) | - financial protection | | | + AWS WAF v2
| - WAF rate-limiting | | +---------+---------+
| | | | | v
| | +-------------------+ | | | CloudFront | (protected
resource) | | | Distribution | | | +---------
+---------+ | | | | |
v | | +-------------------+ |
| | API Gateway | (protected resource) | | | (public API) |
| | +-------------------+ | |
| | Failover: | | Route53 health check -> S3
static maintenance page (60s) | | | |
Tabletop exercise: quarterly |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Attacker -> CloudFront: volumetric attack (e.g., 100 Gbps) CloudFront -> Shield
Standard: detect + mitigate Shield Standard -> CloudFront: absorb at edge (no
traffic to ALB) CloudFront -> Attacker: drop / rate-limit Note over Attacker,
CloudFront: Layer 4 mitigated at edge Attacker -> API Gateway: application-
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 324

PreOne ADR - Volume 4: Security Architecture v3.0
layer attack (e.g., slowloris) API Gateway -> WAF: inspect (rate-limit) WAF ->
WAF: per-IP rate-limit (100 req/min) alt rate-limit exceeded WAF -> Attacker:
403 else distributed attack (many IPs) WAF -> Shield Advanced: anomaly
detected Shield Advanced -> DRT: alert (24/7) DRT -> Shield Advanced: apply
mitigation rule Shield Advanced -> WAF: push custom rule WAF -> Attacker:
403 end Note over DRT, WAF: Layer 7 mitigated by DRT + WAF
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-085 — DDoS Protection -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | CloudFront | edge | AWS
Shield Standard | | | | |------->| (Layer 4, free) | | |
+----------------+ +----------+-----------+ | | |
| | | Layer 7? | | v
| | +----------------+ +----------------------+ | | | API Gateway | app | AWS
Shield Advanced | | | | |------->| ($3K/mo, DRT access) | | |
+----------------+ +----------+-----------+ | | |
| | | engage DRT | | v
| | +----------------+ +----------------------+ | | | DRT (24/7) | tune | WAF
rules (ADR-084) | | | | |------->| | | | +----------------
+ +----------------------+ | | | |
Failover: Route53 -> S3 maintenance page (60s) |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Layer 4 (Volumetric) Flow: Attacker -> CloudFront: volumetric attack
CloudFront -> Shield Standard: detect Shield Standard -> CloudFront: absorb
at edge CloudFront -> Attacker: drop / rate-limit (no traffic reaches ALB)
Layer 7 (Application) Flow: Attacker -> API Gateway: application attack (e.g.,
slowloris) API Gateway -> WAF: rate-limit (per-IP) (distributed) WAF -> Shield
Advanced: anomaly Shield Advanced -> DRT: alert (24/7) DRT -> Shield
Advanced: custom mitigation rule Shield Advanced -> WAF: push rule WAF ->
Attacker: 403 Failover Flow: Route53 -> ALB health check: fail Route53 ->
S3: failover to maintenance page (60s)
DATABASE IMPACT
DDoS protection has no direct database impact. During a DDoS attack, the
database may experience increased load (from application-layer attacks
reaching the app tier). The RDS read replicas (ADR-041) absorb read load; the
PgBouncer connection pool caps connection count, preventing connection
exhaustion. The audit trail (ADR-086) logs DDoS incidents as security events,
with the Shield Advanced incident ID as a correlation key. No schema changes
are required.
API IMPACT
No API changes. During a DDoS attack, legitimate API consumers may
experience elevated latency or 429 (Too Many Requests) responses from WAF
rate-limiting. The API client SDK includes exponential backoff for 429
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 325

PreOne ADR - Volume 4: Security Architecture v3.0
responses, ensuring transparent retry. The status page (status.preone.com) is
updated during a DDoS incident with the estimated impact and resolution time.
After the incident, a post-mortem is published to the status page within 48
hours.
UI IMPACT
DDoS Protection has no UI surface during normal operation. During a DDoS
incident, the UI may display a maintenance page ('Service temporarily
unavailable due to network issues. We are working on it. ETA: X minutes.')
served by the S3 failover (per ADR-085). The status page (status.preone.com) is
updated within 15 minutes of incident declaration. Post-incident, the status
page is updated with a post-mortem summary within 48 hours. The admin UI
includes a 'DDoS Activity' dashboard (admin/operations/security/ddos) showing
recent Shield events, only visible to the Security Engineering team.
SECURITY IMPACT
DDoS protection is a critical availability control. The 2025 audit cited DDoS
resilience as 'mature but with room for improvement'; Shield Advanced
addresses the gap. The financial protection prevents a sophisticated attack
from consuming the annual infrastructure budget. The DRT access provides
expert human response for attacks that automated mitigation cannot handle.
The quarterly tabletop exercise ensures the team is prepared to execute the
runbook under pressure. The control also provides documentary evidence of
availability controls for FERPA compliance.
PERFORMANCE IMPACT
Shield Standard and Shield Advanced are transparent to legitimate traffic — no
additional latency. Shield Standard inspects traffic at the edge (CloudFront
PoP) with sub-millisecond overhead. Shield Advanced's application-layer
detection adds 1-2ms to API Gateway requests, negligible against the typical
50-100ms API response time. WAF rate-limiting (the primary Layer 7
mitigation) adds 5-10ms (per ADR-084). During a DDoS attack, legitimate users
may experience elevated latency or 429 responses, but the alternative (no
DDoS protection) is an outage affecting all users.
SCALABILITY ANALYSIS
AWS Shield scales with the AWS edge network. PreOne's traffic (200M
requests/month) is well within Shield Standard's capacity; the 47 Gbps attack
in 2025 was absorbed without degradation. Shield Advanced's cost is flat
($3K/month) regardless of attack volume — the financial protection covers
scaling costs above the subscription. The DRT can handle multiple
simultaneous incidents (PreOne has not experienced this, but AWS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 326

PreOne ADR  -  Volume 4: Security Architecture  v3.0
documentation confirms it). The quarterly tabletop exercise ensures the team
scales with the threat landscape.
OPERATIONAL CONSIDERATIONS
The Security Engineering Lead is on-call for DDoS-related escalations. The
team monitors a #ddos-alerts Slack channel where Shield Advanced alerts post
automatically. The DDoS runbook is documented in Notion and tested
quarterly. The runbook covers: (1) alert acknowledgment; (2) DRT engagement
procedure; (3) WAF rule tuning; (4) stakeholder communication (status page,
customer support, executive); (5) post-incident review. The CTO receives a
post-mortem within 48 hours of any DDoS incident that caused customer-visible
impact. Annual budget review confirms Shield Advanced cost-justification
against the documented DDoS risk.
RISKS
| Risk             | Likelihood | Impact | Mitigation           |
| ---------------- | ---------- | ------ | -------------------- |
| Sophisticated    | Low        | High   | DRT 24/7 access;     |
| Layer 7 attack   |            |        | manual WAF rule      |
| evades WAF rate- |            |        | tuning within 30     |
| limiting and     |            |        | minutes of DRT       |
| Shield Advanced  |            |        | engagement;          |
| automated        |            |        | quarterly tabletop   |
| detection        |            |        | exercise tests this  |
scenario
| Shield Advanced    | Low | Medium | Documented          |
| ------------------ | --- | ------ | ------------------- |
| DRT response       |     |        | escalation to AWS   |
| exceeds 15-minute  |     |        | account manager;    |
| SLA during a       |     |        | concurrent WAF      |
| major AWS-wide     |     |        | tuning by internal  |
| event              |     |        | team; status-page   |
communication to
manage customer
expectations
| DDoS attack         | Medium | Medium | ALB is Shield      |
| ------------------- | ------ | ------ | ------------------ |
| targets an          |        |        | Standard-          |
| unprotected         |        |        | protected (free);  |
| resource (e.g.,     |        |        | direct ALB access  |
| direct ALB access,  |        |        | blocked by         |
| bypassing           |        |        | security group     |
| CloudFront)         |        |        | (only CloudFront   |
can reach ALB);
Route53 failover
to S3 maintenance
page
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  327

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation          |
| ------------------- | ---------- | ------ | ------------------- |
| Shield Advanced     | Medium     | Low    | Annual review of    |
| cost-justification  |            |        | DDoS incidents      |
| weakens if attacks  |            |        | and scaling costs;  |
| do not materialise  |            |        | documented ROI;     |
can downgrade to
Shield Standard if
cost-justification
fails for 2
consecutive years
| Tabletop exercise  | Medium | Medium | Exercise outputs  |
| ------------------ | ------ | ------ | ----------------- |
| reveals runbook    |        |        | tracked as Jira   |
| gaps that are not  |        |        | tickets with 30-  |
| remediated         |        |        | day SLA; CTO      |
reviews open
tickets quarterly;
exercise repeated
until gaps closed
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
24/7 DRT access for sophisticated  $3K/month subscription cost
attacks
Financial protection against scaling  Shield Advanced protects only named
| costs |     | resources (CloudFront, API Gateway) |     |
| ----- | --- | ----------------------------------- | --- |
Always-on Layer 4 protection at edge  CloudFront edge latency (5-30ms) for
| (Shield Standard) |     | all traffic |     |
| ----------------- | --- | ----------- | --- |
Native AWS integration Less sophisticated than Cloudflare for
bot management
Quarterly tabletop exercise ensures  4 engineering-hours per quarter for
| readiness |     | exercise |     |
| --------- | --- | -------- | --- |
REJECTED ALTERNATIVES
Cloudflare Magic Transit was piloted in Q4 2025 for the API Gateway. The pilot
found Cloudflare's bot management marginally better than AWS's, but the
operational overhead of managing a non-AWS edge layer (separate Terraform,
separate logs, separate runbook) outweighed the advantage. The 'Shield
Standard only' option was rejected after a cost analysis showed the 2025 47
Gbps attack would have cost $30K without Shield Advanced's financial
protection — Shield Advanced's annual cost ($36K) is recouped by a single
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  328

PreOne ADR - Volume 4: Security Architecture v3.0
major attack. The self-managed option was rejected after a capacity-planning
exercise showed PreOne's ECS Fargate cluster (50 Gbps) cannot absorb a 100+
Gbps attack regardless of autoscaling configuration.
MIGRATION PLAN
Phase 1 (Q4 2025, complete): Shield Standard verified active on all CloudFront
distributions and ALBs. Phase 2 (Q4 2025, complete): Shield Advanced
subscribed for CloudFront distribution and public API Gateway. Phase 3 (Q1
2026, complete): DRT contact information added to DDoS runbook; runbook
documented. Phase 4 (Q1 2026, complete): First quarterly tabletop exercise
conducted; 3 runbook gaps identified and remediated. Phase 5 (Q2 2026,
complete): Route53 health-check failover to S3 maintenance page tested.
Phase 6 (ongoing): Quarterly tabletop exercise; annual cost-justification
review.
TESTING STRATEGY
DDoS protection is tested via the quarterly tabletop exercise. The exercise
simulates a sophisticated DDoS attack using the AWS Shield testing process
(pre-approved attack traffic from AWS's testing infrastructure). The exercise
validates: (1) alert delivery to #ddos-alerts; (2) DRT engagement procedure; (3)
WAF rule tuning; (4) status-page communication; (5) post-mortem workflow.
The exercise is observed by the CTO annually. Additionally, AWS Shield's
'health-based detection' is verified weekly by injecting synthetic traffic that
triggers a low-severity alert. Route53 failover is tested monthly by simulating
an ALB failure.
MONITORING & OBSERVABILITY
Shield Standard and Shield Advanced events ship to CloudWatch and Splunk.
Splunk dashboards track: (a) DDoS events per week (severity, type, duration);
(b) DRT engagement response time; (c) scaling costs attributed to DDoS (for
Shield Advanced financial protection claims); (d) WAF rate-limit triggers during
DDoS events; (e) customer-visible impact (status-page updates, support ticket
spikes). Anomalies trigger Slack alerts to #ddos-alerts. The Shield Advanced
dashboard (admin/operations/security/ddos) provides a real-time view for the
security team. Post-incident, a Splunk saved-search generates the post-mortem
report automatically.
FUTURE EVOLUTION
Two evolutions are likely. First, as PreOne expands to additional AWS regions
(ADR-041), Shield Advanced protection may be extended to resources in those
regions. Second, AWS's upcoming 'Shield Advanced for Lambda' (announced at
re:Invent 2025) may be adopted for the Lambda-based public API if Shield
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 329

PreOne ADR - Volume 4: Security Architecture v3.0
Advanced for API Gateway proves insufficient. Third, the tabletop exercise may
evolve into a 'red team' exercise where an external firm simulates a DDoS
attack — gated on the maturity of the internal program (2027 target).
RELATED ADRS
● ADR-002 — Modular Monolith Strategy (DDoS protection covers the
monolith's public surface)
● ADR-041 — PostgreSQL Strategy (RDS read replicas absorb DDoS-
driven read load)
● ADR-076 — API Security (Shield Advanced protects the public API
Gateway)
● ADR-080 — Rate Limiting (WAF rate-limiting is the primary Layer 7
mitigation)
● ADR-084 — Web Application Firewall (WAF is the Layer 7 mitigation
component)
● ADR-086 — Audit Trail (DDoS events logged to audit trail)
● ADR-087 — Penetration Testing Program (pentests include DDoS
tabletop scenario)
● ADR-090 — Incident Response (DDoS incidents trigger the IR plan)
REFERENCES
● Upstream PRD: PRD-007 (Security Requirements — DDoS section)
● Downstream ERD: ERD-085 (security.ddos_events table for incident
tracking)
● Downstream API Spec: API-085 (internal DDoS dashboard endpoints)
● Downstream Test Cases: TC-085 (quarterly tabletop exercise script)
● External: AWS Shield Documentation
● External: NIST SP 800-61 (Computer Security Incident Handling Guide)
● External: Cloudflare DDoS Attack Trends Report 2025
DECISION HISTORY
Date Status Actor Notes
2025-09-26 Draft Security Initial draft;
Engineering Lead options
enumerated;
consultation with
security and
engineering teams
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 330

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status   | Actor            | Notes         |
| ---------- | -------- | ---------------- | ------------- |
| 2025-11-12 | Proposed | Security         | Submitted to  |
|            |          | Engineering Lead | Architecture  |
Review Board
after cross-team
review
| 2025-12-10 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect           |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Security Engineering Lead |     |
| ARB Chair   |     | ARB Chair                 |     |
| Approved On |     | 2025-12-10                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Shield Standard verified on all CloudFront + ALB (Done)
● Shield Advanced subscribed for CloudFront (Done)
● Shield Advanced subscribed for public API Gateway (Done)
● DRT contact info in DDoS runbook (Done)
● Route53 failover to S3 maintenance page (Done — 60s tested)
● Quarterly tabletop exercise (Done — Q2 2026)
● Annual cost-justification review (Scheduled — Q1 2027)
AD R -086
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  331

PreOne ADR - Volume 4: Security Architecture v3.0
Audit Trail
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt an immutable, append-only audit trail for every security-relevant
event on the PreOne platform. The audit trail is stored in a dedicated
Postgres schema (audit) with INSERT-only permissions (no UPDATE, no
DELETE); writes are synchronised with the business transaction via the
Outbox pattern (ADR-027) to guarantee atomicity. Audit events include:
authentication, authorization decisions, data access (PII reads), data
mutations (creates, updates, deletes), configuration changes, and admin
actions. Audit events are retained for 7 years per FERPA; archived events
are moved to S3 Glacier Deep Archive after 1 year. The audit trail is the
canonical evidence source for compliance audits and incident
investigations.
STATUS
Status Accepted
Date Decided 2025-11-28
Decision Owner Security Engineering Lead
Review Cadence Annual review, or on regulatory
update, or after each major incident
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne processes regulated student data subject to FERPA (US), GDPR (EU),
DPDP (India), and COPPA (under-13 students). Each regulation imposes audit-
trail obligations: FERPA requires 'reasonable methods to access records only
by authorized individuals'; GDPR Article 30 requires records of processing
activities; DPDP requires breach notification with detailed evidence; COPPA
requires parental-consent records. The audit trail is the canonical evidence
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 332

PreOne ADR - Volume 4: Security Architecture v3.0
source for all four regulations. The legacy platform logged audit events to
MongoDB with a separate writer per service, leading to inconsistent schemas,
missing events, and occasional data loss (when the writer failed silently). The
2025 audit found that 14% of expected audit events were missing from the
legacy trail, primarily due to writer failures and silent exceptions. The audit
recommended a centralised, transactional audit trail guaranteed by the Outbox
pattern. PreOne's modular monolith (ADR-002) provides a natural insertion
point: a single AuditService called by every command handler writes audit
events to the Outbox, which is published to Postgres in the same transaction as
the business change. This guarantees atomicity — either the business change
and the audit event both commit, or neither does. The audit trail is therefore
always consistent with the business state. The audit trail must be tamper-
evident. While perfect immutability is impossible (a privileged attacker with DB
access could modify rows), the trail is protected by: (1) INSERT-only Postgres
permissions (no UPDATE/DELETE for the application user); (2) a hash-chain
where each row includes the SHA-256 hash of the previous row, enabling
tamper detection; (3) WORM (Write-Once-Read-Many) S3 storage for archived
events; (4) quarterly hash-chain verification.
BUSINESS DRIVERS
The primary driver is regulatory compliance. FERPA, GDPR, DPDP, and COPPA
all require audit trails as a condition of processing student data. The audit trail
is the evidence auditors request first; its absence would trigger a finding of non-
compliance and potential fines (GDPR: up to 4% of global revenue; DPDP: up to
INR 250 crore). The 7-year retention is mandated by FERPA for student
education records. A secondary driver is incident investigation. When a
security incident occurs (e.g., a teacher accesses a student's records without
authorization), the audit trail is the primary evidence. The 2025 audit found
that incident investigations took 40+ hours on the legacy platform due to
missing and inconsistent audit data; the centralised trail reduces this to under 4
hours. A tertiary driver is operational visibility. Audit events drive the admin
'Activity Log' UI (admin/operations/activity), showing recent admin actions,
login attempts, and configuration changes. This is a daily-use tool for security
and operations teams.
PROBLEM STATEMENT
PreOne requires a tamper-evident, immutable audit trail that captures every
security-relevant event with atomicity guarantees, retains events for 7 years
per FERPA, and provides fast query capability for compliance audits and
incident investigations.
CONSTRAINTS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 333

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● Audit events must be written in the same database transaction as the
business change (Outbox pattern)
● Audit table must be INSERT-only (no UPDATE/DELETE for application
user)
● Each audit row must include the SHA-256 hash of the previous row
(hash chain)
● Audit events must include: timestamp, actor (principal_id), action,
resource, tenant_id, IP, user agent, request_id
● Retention: 7 years per FERPA; archive to S3 Glacier after 1 year
● Query latency: p95 under 500ms for compliance audit queries (date
range + actor + action)
● Audit trail must be queryable by compliance auditors via a read-only
admin tool (no direct DB access)
ASSUMPTIONS
● Postgres can sustain the audit-write volume (~500 events/second at
peak) without impacting OLTP performance
● The Outbox pattern (ADR-027) provides sufficient atomicity guarantee
for audit events
● SHA-256 hash chain provides adequate tamper detection (collision-
resistant for the 7-year retention window)
● S3 Glacier Deep Archive retrieval time (12 hours) is acceptable for
archived-event queries (rare)
● Compliance auditors will accept the read-only admin tool in lieu of
direct DB access
● The 7-year retention window will not change (FERPA stable; GDPR may
extend, not reduce)
OPTIONS CONSIDERED
| Option           | Pros                | Cons                | Verdict |
| ---------------- | ------------------- | ------------------- | ------- |
| Centralised      | Transactional       | Audit writes        | Adopted |
| Postgres audit   | atomicity with      | increase            |         |
| schema with      | business changes;   | transaction         |         |
| Outbox-pattern   | SQL-queryable for   | latency (5-10ms);   |         |
| writes, hash-    | compliance audits;  | audit table grows   |         |
| chain, and S3    | hash-chain          | large (50M+         |         |
| Glacier archive. | provides tamper     | rows/year);         |         |
|                  | detection;          | partitioning        |         |
|                  | integrates with     | required for query  |         |
|                  | existing Postgres   | performance.        |         |
operational model.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  334

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option               | Pros                | Cons               | Verdict  |
| -------------------- | ------------------- | ------------------ | -------- |
| Append-only          | No Postgres write   | No transactional   | Rejected |
| CloudWatch           | overhead; scalable  | atomicity (audit   |          |
| Logs / Splunk as     | to any volume;      | event may be lost  |          |
| the audit trail (no  | built-in query      | if business        |          |
| Postgres).           | (CloudWatch         | transaction        |          |
|                      | Insights, Splunk);  | commits but log    |          |
|                      | WORM storage        | ship fails); no    |          |
|                      | available.          | hash-chain         |          |
(tamper detection
harder); Splunk
cost for 7-year
retention is
$50K+/year;
auditors prefer
SQL-queryable
evidence.
| Dedicated audit     | Isolation from       | Two-phase commit   | Rejected |
| ------------------- | -------------------- | ------------------ | -------- |
| database            | OLTP load;           | is slow (50ms+)    |          |
| (separate Postgres  | independent          | and complex;       |          |
| cluster) with two-  | scaling; failure of  | failure modes are  |          |
| phase commit.       | audit DB does not    | subtle (heuristic  |          |
|                     | impact business      | decisions);        |          |
|                     | transactions.        | operational        |          |
overhead of a
second Postgres
cluster;
contradicts the
single-engine
strategy
(ADR-041).
Event-sourced  Infinite retention  No transactional  Rejected
| audit trail (Kafka   | by default; event- | atomicity (Kafka   |     |
| -------------------- | ------------------ | ------------------ | --- |
| topic with infinite  | sourced            | producer may fail  |     |
| retention,           | semantics; replay  | after business     |     |
| queryable via        | capability;        | commit); ksqlDB    |     |
| ksqlDB).             | scalable.          | query              |     |
performance is
poor for ad-hoc
compliance
queries;
introduces Kafka
as a critical
dependency;
auditors
unfamiliar with
Kafka evidence
format.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  335

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
ADOPTED
Adopt a centralised Postgres audit schema (audit.*) with Outbox-pattern
writes guaranteeing transactional atomicity with business changes. The
audit table is INSERT-only (REVOKE UPDATE, DELETE from the
application user); each row includes a SHA-256 hash of the previous row
(hash chain) for tamper detection. Audit events are written by a single
AuditService called from every command handler, with the event included
in the Outbox (ADR-027) of the same transaction. Retention is 7 years per
FERPA; events older than 1 year are archived to S3 Glacier Deep Archive
via a nightly job. The audit trail is queryable via a read-only admin tool
(admin/operations/audit) backed by Postgres read replicas; compliance
auditors receive a temporary read-only account. Quarterly, the hash chain
is verified end-to-end.
DETAILED RATIONALE
The centralised Postgres audit schema was chosen because it provides the
strongest atomicity guarantee. The Outbox pattern (ADR-027), already adopted
for domain events, ensures the audit event is written in the same transaction as
the business change — either both commit or neither does. This is the critical
property for compliance: an audit trail that can lose events during failures is not
a compliance-grade audit trail. The legacy MongoDB-based trail lost 14% of
events due to writer failures; the Outbox approach eliminates this failure mode.
The CloudWatch/Splunk option was attractive for scalability but failed the
atomicity requirement. A log-ship failure between business commit and log
delivery would lose the audit event — a non-trivial probability under network
partitions. The hash-chain tamper detection is also harder in Splunk (no native
hash-chain primitive; would require custom implementation). The Splunk cost
for 7-year retention (estimated $50K+/year based on ~500 events/second * 7
years * Splunk ingestion rate) is significantly higher than Postgres + S3 Glacier
(~$5K/year). The dedicated audit database with two-phase commit was
rejected because two-phase commit is slow (50ms+ per transaction) and
operationally complex. The subtle failure modes (heuristic decisions after
coordinator failure) are well-documented and have caused data inconsistencies
in industry incidents. The dedicated database also contradicts the single-engine
strategy (ADR-041) — running a second Postgres cluster for audit alone is not
justified by the audit volume (~500 events/second is well within the primary
cluster's capacity). The event-sourced Kafka option was rejected because
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 336

PreOne ADR - Volume 4: Security Architecture v3.0
Kafka's producer semantics (async, at-least-once) do not provide the atomicity
guarantee. A Kafka producer failure after business commit would lose the audit
event. ksqlDB's query performance is poor for ad-hoc compliance queries (date
range + actor + action) compared to Postgres with proper indexes. Introducing
Kafka as a critical-path dependency for audit is also operationally heavy —
PreOne's Kafka usage is currently limited to non-critical analytics pipelines.
The hash-chain tamper detection is a defense-in-depth control. A privileged
attacker with DB superuser access could modify audit rows, but the hash chain
would break, and the quarterly verification would detect the tampering. The
hash chain is computed as: hash = SHA256(prev_hash || event_payload).
Verification is a single SQL query that recomputes the chain and compares to
stored hashes. The 5-10ms write overhead is the SHA-256 computation,
acceptable against the typical 50-100ms transaction latency. The 7-year
retention is mandated by FERPA for student education records. The audit table
grows by ~50M rows/year (500 events/second * 86400 seconds * 365 days / 2
for non-peak average). Postgres range partitioning (ADR-051) by month keeps
partition sizes manageable (~4M rows per partition). Partitions older than 1
year are exported to S3 Glacier Deep Archive (Parquet format) and detached
from the live table. Compliance queries against archived events use Athena (S3
query) with sub-minute latency for typical queries. The 12-hour Glacier
retrieval time is acceptable because archived-event queries are rare (1-2 per
year, typically for historical investigations). The read-only admin tool
(admin/operations/audit) is the auditors' interface. It provides: (1) date-range
queries with actor, action, resource, and tenant filters; (2) CSV export for
offline analysis; (3) saved queries for recurring audit needs; (4) a 'principal
activity' view showing all actions by a user in a time range. Auditors receive a
temporary read-only account (24-hour expiry, MFA-required) and are trained
on the tool. Direct DB access is denied; this is a compliance control (auditors
cannot accidentally or intentionally modify audit data).
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | PreOne Audit Trail
Architecture | +------------------------------------------------------------------+ |
| | Command Handler (any BC) | | |
| | | 1. execute business change | | | 2. write audit event
to Outbox | | v | |
+-------------------+ | | | Postgres | (single
transaction) | | | - business tables | | | | -
outbox table | | | +---------+---------+
| | | | | | (same tx commit)
| | v | | +-------------------+
| | | audit.audit_event | (INSERT-only) | | | - id, ts, actor |
| | | - action, resource| | | | - tenant, ip, ua |
| | | - prev_hash | (SHA-256 chain) | | | - row_hash |
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 337

PreOne ADR - Volume 4: Security Architecture v3.0
| | +---------+---------+ | | |
| | | (nightly archive job) | | v
| | +-------------------+ | | | S3 Glacier Deep | (1-year+
events, Parquet) | | | Archive | | |
+---------+---------+ | | |
| | | (Athena query, rare) | | v
| | +-------------------+ | | | Compliance Audit | (read-only
admin tool) | | | Tool | | |
+-------------------+ | |
| | Quarterly: hash-chain verification (recompute + compare) |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Client -> API: POST /enrollment (create enrollment) API -> App Service:
handleCreateEnrollment App Service -> Command Handler: execute Command
Handler -> Postgres: BEGIN Command Handler -> Postgres: INSERT enrollment
... Command Handler -> AuditService: record(actor, 'CREATE', 'enrollment', ...)
AuditService -> Postgres: INSERT outbox (audit event) Command Handler ->
Postgres: COMMIT Postgres -> Outbox Relay: read committed outbox Outbox
Relay -> Postgres: INSERT audit.audit_event (with prev_hash) Note over
Command Handler, Postgres: Atomicity: both commit or neither Compliance
Auditor -> Admin Tool: query (date range + actor) Admin Tool -> Postgres Read
Replica: SELECT ... WHERE ts BETWEEN ... Postgres Read Replica -> Admin
Tool: rows Admin Tool -> Compliance Auditor: CSV / table view Quarterly:
Verifier Job -> Postgres: SELECT * FROM audit.audit_event ORDER BY ts
Verifier Job -> Verifier: recompute hash chain Verifier -> Verifier: compare with
stored row_hash Verifier -> Splunk: log verification result
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-086 — Audit Trail -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Command Handler| write |
AuditService | | | | (any BC) |------->| (writes Outbox) | | |
+----------------+ +----------+-----------+ | | |
| | | same tx | | v
| | +----------------+ +----------------------+ | | | Postgres | txn | business
tables + | | | | |------->| outbox (atomic) | | | +----------------
+ +----------+-----------+ | | | | |
| relay | | v | | +----------------+
+----------------------+ | | | audit.audit_ | INSERT | hash chain (SHA-256) |
| | | event |------->| INSERT-only perms | | | +----------------+
+----------------------+ | | | | Archive: S3
Glacier Deep (1yr+), Athena queryable | | Verify: quarterly hash-chain
check | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Atomic Write Flow: Command Handler -> Postgres: BEGIN Command Handler
-> Postgres: INSERT business row Command Handler -> AuditService: record
AuditService -> Postgres: INSERT outbox (audit event) Command Handler ->
Postgres: COMMIT (atomic) Outbox Relay -> Postgres: read committed outbox
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 338

PreOne ADR - Volume 4: Security Architecture v3.0
Outbox Relay -> Postgres: INSERT audit.audit_event (with prev_hash)
Compliance Query Flow: Auditor -> Admin Tool: query (date + actor + action)
Admin Tool -> Read Replica: SELECT ... WHERE filters Read Replica -> Admin
Tool: rows Admin Tool -> Auditor: CSV / table view Archive Flow (nightly):
Archive Job -> Postgres: SELECT events older than 1 year Archive Job -> S3
Glacier: write (Parquet) Archive Job -> Postgres: DETACH old partition
Quarterly Verification: Verifier -> Postgres: SELECT * ORDER BY ts Verifier
-> Verifier: recompute hash chain Verifier -> Splunk: log verification result
DATABASE IMPACT
The audit schema (audit.*) is a dedicated Postgres schema with INSERT-only
permissions for the application user. The primary table (audit.audit_event) is
range-partitioned by month (ADR-051) with sub-partitions by tenant_id for
large tenants. Indexes: (tenant_id, ts), (actor_id, ts), (action, ts),
(resource_type, resource_id, ts). The table grows by ~50M rows/year; partition
pruning keeps query latency under 500ms p95 for typical compliance queries.
The Outbox table (ADR-027) is in the public schema; the Outbox relay moves
events to audit.audit_event asynchronously (within 100ms of commit). The
audit schema is read-replica-friendly (no writes to the replica), enabling
compliance queries without OLTP impact.
API IMPACT
No public API changes. The audit trail is internal. The admin API exposes
GET /admin/audit-events with filters (date range, actor, action, resource,
tenant), pagination, and CSV export. The admin API is RBAC-controlled (admin
or auditor role only); auditors receive a 24-hour temporary account via a
dedicated 'auditor onboarding' workflow. The API enforces a maximum date
range of 90 days per query (to prevent full-table scans); wider ranges require
multiple paginated queries or an Athena-backed archived-event query.
UI IMPACT
The Audit Trail surfaces in the admin UI as the 'Activity Log' page
(admin/operations/audit). Admins can query audit events by date range, actor,
action, resource, or tenant, with results displayed in a paginated table and CSV
export. Compliance auditors receive a 24-hour temporary account with read-
only access to this page. The 'User Detail' page includes an 'Activity' tab
showing the user's recent audit events (logins, data access, configuration
changes). End users do not see the audit trail directly; it is admin-access-only.
The audit query UI enforces a 90-day maximum date range per query to prevent
performance issues.
SECURITY IMPACT
The audit trail is a critical security control. It provides: (1) compliance evidence
for FERPA, GDPR, DPDP, COPPA; (2) incident investigation evidence (who did
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 339

PreOne ADR - Volume 4: Security Architecture v3.0
what, when); (3) deterrent effect (users know actions are logged); (4) tamper
detection via hash chain. The INSERT-only permission model prevents
application-level tampering; the hash chain detects DB-level tampering; the
quarterly verification ensures tamper is detected within 90 days. The 2025
audit cited the legacy trail's 14% missing-event rate as a compliance risk; the
Outbox-pattern trail eliminates this risk.
PERFORMANCE IMPACT
Audit writes add 5-10ms to each transaction (Outbox INSERT + SHA-256
computation). This is acceptable against the typical 50-100ms transaction
latency. Audit reads (compliance queries) run against read replicas (no OLTP
impact). The (tenant_id, ts) index keeps query latency under 500ms p95 for
typical 90-day queries. The nightly archive job runs in a 30-minute window
(02:00-02:30) and does not impact OLTP (uses a separate connection pool). The
quarterly hash-chain verification runs against a read replica and completes in
under 2 hours.
SCALABILITY ANALYSIS
The audit trail scales with Postgres. The 50M rows/year growth rate is well
within Postgres's capacity; range partitioning keeps individual partitions under
5M rows. The S3 Glacier archive for 1-year+ events keeps the live table under
100M rows (current year + previous year), maintaining query performance.
The Athena-backed archived-event query scales to any volume (S3 is effectively
unlimited). The hash-chain verification scales linearly with row count; quarterly
verification completes in under 2 hours for the current volume. Projected 2028
volume (200M rows/year) is still within Postgres capacity with monthly
partitioning.
OPERATIONAL CONSIDERATIONS
The Security Engineering Lead owns the audit trail. The team monitors: (a)
audit write latency (target: <10ms p99); (b) Outbox relay lag (target: <100ms);
(c) audit query latency (target: <500ms p95); (d) archive job success; (e) hash-
chain verification result. The nightly archive job is monitored; failure triggers a
Slack alert and a Jira ticket. The quarterly hash-chain verification is observed
by the Security Engineering Lead and the ARB chair; any verification failure
triggers an incident (ADR-090). Compliance auditor onboarding (temporary
account creation) is a documented workflow with a 24-hour SLA.
RISKS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 340

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation          |
| ------------------- | ---------- | ------ | ------------------- |
| Hash-chain          | Low        | High   | Immediate           |
| verification fails  |            |        | incident            |
| (indicates          |            |        | (ADR-090);          |
| tampering or        |            |        | forensic analysis;  |
| corruption)         |            |        | if tampering        |
confirmed, legal
and regulatory
notification; root-
cause and
remediation
| Audit write fails  | Low | High | Outbox relay has     |
| ------------------ | --- | ---- | -------------------- |
| (Outbox relay      |     |      | retry + dead-letter  |
| failure) causing   |     |      | queue; missing-      |
| missing events     |     |      | event detection      |
job compares
outbox count to
audit count; alerts
on discrepancy >
0
| Audit table growth  | Medium | Medium | Monthly              |
| ------------------- | ------ | ------ | -------------------- |
| degrades query      |        |        | partitioning;        |
| performance         |        |        | archive to S3 after  |
| despite             |        |        | 1 year; quarterly    |
| partitioning        |        |        | query-               |
performance
review; if needed,
weekly
partitioning for
high-volume
tables
| Auditor           | Low | Low | Self-service     |
| ----------------- | --- | --- | ---------------- |
| onboarding        |     |     | auditor account  |
| workflow delayed  |     |     | creation with    |
| (24-hour SLA      |     |     | automated        |
| breach)           |     |     | approval for     |
recurring
auditors;
documented
escalation for
first-time auditors
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  341

PreOne ADR - Volume 4: Security Architecture v3.0
Risk Likelihood Impact Mitigation
Regulatory Low Medium S3 Glacier archive
retention window retention is
extended beyond configurable;
7 years extending
retention is a
Terraform change;
cost impact is
linear
($0.00099/GB/mon
th for Glacier
Deep Archive)
TRADE-OFFS
We Gain We Lose
Transactional atomicity (audit and 5-10ms added to every transaction
business change commit together)
SQL-queryable for compliance audits Postgres storage cost (~50M rows/year,
partitioned)
Hash-chain tamper detection SHA-256 computation on every write
(5ms)
7-year retention per FERPA S3 Glacier archive cost + 12-hour
retrieval for archived queries
Read-only admin tool for auditors (no Auditor training overhead (1-hour
direct DB access) onboarding)
REJECTED ALTERNATIVES
The Splunk-only audit trail was piloted in Q3 2025 for the Identity bounded
context. The pilot found that 0.3% of audit events were lost due to log-ship
failures during network partitions — unacceptable for compliance. The
dedicated audit database with two-phase commit was prototyped in Q4 2025;
the prototype added 65ms per transaction (vs 10ms for the Outbox approach)
and required complex failure-recovery procedures. The Kafka event-sourced
option was rejected after a query-performance test: a typical compliance query
(all actions by actor X in date range Y) took 8 seconds in ksqlDB vs 200ms in
Postgres with proper indexes. The centralised Postgres approach with Outbox
was the only option that satisfied all requirements: atomicity, queryability,
tamper detection, and cost.
MIGRATION PLAN
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 342

PreOne ADR - Volume 4: Security Architecture v3.0
Phase 1 (Q4 2025, complete): audit schema created in Postgres with INSERT-
only permissions and hash chain. Phase 2 (Q4 2025, complete): AuditService
integrated with Outbox in all 12 bounded contexts. Phase 3 (Q1 2026,
complete): nightly archive job to S3 Glacier. Phase 4 (Q1 2026, complete): read-
only admin tool (admin/operations/audit) deployed. Phase 5 (Q2 2026,
complete): quarterly hash-chain verification job scheduled. Phase 6 (Q3 2026,
complete): compliance auditor onboarding workflow documented and tested.
Phase 7 (ongoing): backfill of legacy MongoDB audit events (1.2M events) to
Postgres — scheduled for Q4 2026.
TESTING STRATEGY
The audit trail is tested at three levels. (1) Unit tests: every command handler
test verifies that an audit event is written with the correct fields. (2) Integration
tests: every API integration test verifies that the audit event appears in the
audit table after the API call, with field-level assertions. (3) End-to-end tests: a
simulated compliance audit queries the audit trail via the admin tool and
verifies the results match the expected events. The hash-chain verification is
tested by deliberately corrupting a row in a test database and verifying that the
verification job detects it. The atomicity guarantee is tested by deliberately
failing the business transaction and verifying that no audit event is written.
MONITORING & OBSERVABILITY
Splunk dashboards track: (a) audit write latency (p50, p95, p99); (b) Outbox
relay lag (target <100ms); (c) audit query latency by filter type; (d) audit event
volume by action type (anomaly detection for unexpected spikes); (e) archive
job success and duration; (f) hash-chain verification result (quarterly); (g)
auditor account creation and expiry. Anomalies (e.g., a 10x spike in 'DELETE'
audit events) trigger Slack alerts to #security-alerts. The audit trail dashboard
(admin/operations/security/audit) provides a real-time view for the security
team.
FUTURE EVOLUTION
Two evolutions are likely. First, the audit trail may be extended to capture data-
access events (PII reads) at the field level, providing finer-grained evidence for
GDPR data-subject-access requests. This is currently scoped at the entity level
(e.g., 'read Student X') rather than the field level (e.g., 'read Student
X.health_info'). Field-level audit would increase write volume 5-10x and is
gated on a performance impact assessment. Second, the audit trail may
integrate with a SIEM (Security Information and Event Management) platform
for real-time anomaly detection — currently anomaly detection is rule-based in
Splunk, but a dedicated SIEM (e.g., Splunk Enterprise Security) would provide
ML-based detection. Third, the audit trail may be exposed to customers
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 343

PreOne ADR - Volume 4: Security Architecture v3.0
(tenants) via a self-service 'activity log' API, enabling schools to audit their own
data access — gated on customer demand.
RELATED ADRS
● ADR-002 — Modular Monolith Strategy (audit trail is a cross-cutting
concern in the monolith)
● ADR-027 — Domain Events (Outbox pattern provides audit atomicity)
● ADR-041 — PostgreSQL Strategy (audit schema is a dedicated schema
in the primary Postgres)
● ADR-043 — Tenant Isolation (audit events include tenant_id for
filtering)
● ADR-048 — Audit Columns (business tables have audit columns; this
ADR is the dedicated audit trail)
● ADR-051 — Partition Strategy (audit table is range-partitioned by
month)
● ADR-053 — Data Retention (audit trail retention is 7 years per FERPA,
longer than default)
● ADR-054 — Archive Policy (audit events archived to S3 Glacier after 1
year)
● ADR-061 — Identity Model (audit events reference principal_id from
identity model)
● ADR-083 — Vulnerability Management (vuln-mgmt findings logged to
audit trail)
● ADR-090 — Incident Response (audit trail is primary evidence for
incident investigations)
REFERENCES
● Upstream PRD: PRD-007 (Security Requirements — audit trail section)
● Upstream DDD: DDD-006 (Security Bounded Context — audit event is
an entity)
● Downstream ERD: ERD-086 (audit.audit_event table schema)
● Downstream API Spec: API-086 (admin audit query endpoints)
● Downstream Test Cases: TC-086 (audit trail atomicity, hash-chain, and
query tests)
● External: FERPA 34 CFR § 99.31 (Audit record requirements)
● External: GDPR Article 30 (Records of processing activities)
● External: NIST SP 800-92 (Guide to Computer Security Log
Management)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 344

PreOne ADR  -  Volume 4: Security Architecture  v3.0
DECISION HISTORY
| Date       | Status | Actor            | Notes           |
| ---------- | ------ | ---------------- | --------------- |
| 2025-09-14 | Draft  | Security         | Initial draft;  |
|            |        | Engineering Lead | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-10-31 | Proposed | Security         | Submitted to  |
| ---------- | -------- | ---------------- | ------------- |
|            |          | Engineering Lead | Architecture  |
Review Board
after cross-team
review
| 2025-11-28 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect           |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Security Engineering Lead |     |
| ARB Chair   |     | ARB Chair                 |     |
| Approved On |     | 2025-11-28                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● audit.* schema deployed with INSERT-only permissions (Done)
● Hash chain (SHA-256) implemented (Done)
● AuditService integrated with Outbox in all 12 BCs (Done)
● Nightly archive job to S3 Glacier (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  345

PreOne ADR - Volume 4: Security Architecture v3.0
● Read-only admin tool (admin/operations/audit) (Done)
● Quarterly hash-chain verification job (Done)
● Compliance auditor onboarding workflow (Done)
● Backfill of legacy MongoDB audit events (Planned — Q4 2026)
AD R -087
Penetration Testing Program
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a three-tier penetration testing program: (1) annual third-party
penetration test by a Bishop Fox or NCC Group-tier firm covering the full
platform; (2) quarterly internal red-team exercise by the Security
Engineering team targeting a specific bounded context or control; (3)
continuous bug-bounty program (HackerOne) for external researcher
findings. Critical findings trigger a 24-hour remediation SLA; high findings
7-day SLA; medium findings 30-day SLA. All findings (regardless of source)
are tracked in a single Splunk-backed findings registry with deduplication
and trend analysis.
STATUS
Status Accepted
Date Decided 2025-12-15
Decision Owner Security Engineering Lead
Review Cadence Annual review, or on threat
landscape shift, or on tooling vendor
change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 346

PreOne ADR - Volume 4: Security Architecture v3.0
PreOne's regulated-data exposure requires demonstrable penetration testing
as a condition of customer contracts (institutional customers require annual
pentest reports as a procurement gate) and as a compliance control (FERPA,
GDPR, DPDP all expect independent security testing). The legacy platform
relied on a single annual pentest, which produced a snapshot of vulnerabilities
that were often stale by the time remediation completed. The 2025 Bishop Fox
pentest (the most recent annual engagement) identified 23 findings: 2 critical
(auth bypass in the parent API, RCE in a legacy admin tool), 6 high (mostly
access-control gaps), 10 medium (mostly configuration issues), and 5 low
(information disclosure). The critical findings were remediated within 24 hours;
the high findings within 7 days; the medium findings within 30 days. The
engagement cost $85K and took 4 weeks. The 2025 audit recommended
complementing the annual pentest with quarterly internal red-team exercises
and a continuous bug-bounty program to reduce the staleness gap. PreOne's
threat model identifies the highest-risk attack surfaces as: (1) the parent mobile
app's backend API (authentication, data access); (2) the admin web application
(privileged actions, configuration); (3) the third-party integration API (data
exchange with school information systems). The pentest program targets these
surfaces with appropriate frequency — annual full-platform test, quarterly
deep-dive on one surface, continuous bug-bounty coverage of all surfaces. The
bug-bounty program is a 2026 addition. The Security Engineering Lead
evaluated HackerOne, Bugcrowd, and Intigriti; HackerOne was selected for its
larger researcher community and PreOne's prior positive experience with the
platform. The bug-bounty scope covers all public-facing surfaces (web, API,
mobile app backend) with payouts ranging from $500 (low) to $15,000
(critical).
BUSINESS DRIVERS
The primary driver is customer acquisition. Institutional customers (school
districts, universities) require annual pentest reports as a procurement gate;
without them, PreOne cannot bid on contracts. The 2025 Bishop Fox report was
cited in 8 customer wins representing $1.2M in annual recurring revenue. The
pentest program is a direct revenue enabler. A secondary driver is risk
reduction. The 2025 pentest found 2 critical vulnerabilities that, if exploited,
would have caused data breaches with $500K+ in incident response and
regulatory-fine costs. The 24-hour critical-finding SLA ensures such
vulnerabilities are remediated before exploitation. The quarterly red-team and
continuous bug-bounty reduce the time between vulnerability introduction and
discovery. A tertiary driver is compliance. FERPA, GDPR, DPDP, and COPPA all
expect independent security testing; the annual pentest is the standard
evidence. The bug-bounty program provides continuous evidence that
complements the annual snapshot. A quaternary driver is marketing. The
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 347

PreOne ADR - Volume 4: Security Architecture v3.0
'Bishop Fox tested' and 'HackerOne bug-bounty' badges on the PreOne website
and security page are differentiators in the competitive education-platform
market, where security is a top-3 customer concern.
PROBLEM STATEMENT
PreOne requires a multi-tier penetration testing program that combines annual
third-party testing (for customer procurement and compliance), quarterly
internal red-team exercises (for depth on specific surfaces), and continuous
bug-bounty coverage (for breadth and freshness) — with enforceable
remediation SLAs and a unified findings registry.
CONSTRAINTS
● Annual pentest must be conducted by a recognized firm (Bishop Fox,
NCC Group, Trail of Bits, or equivalent)
● Annual pentest report must be shareable with customers under NDA
(sanitised version for general distribution)
● Quarterly red-team exercise must target a specific bounded context or
control (not the full platform)
● Bug-bounty scope must exclude denial-of-service, social engineering,
and physical attacks
● Bug-bounty payouts must be competitive (median for education-sector
programs: $500-$15,000)
● All findings (annual, red-team, bug-bounty) must be tracked in a single
Splunk-backed findings registry
● Remediation SLAs: critical=24hr, high=7d, medium=30d, low=backlog
● Findings must be deduplicated (same vulnerability reported by multiple
sources counts as one)
ASSUMPTIONS
● Bishop Fox (or equivalent) will continue to be available for annual
engagements
● The Security Engineering team has the skills to conduct quarterly red-
team exercises
● HackerOne's researcher community will show interest in PreOne's
program (sufficient bounty budget)
● Customers will accept the sanitised annual report in lieu of the full
report
● The 24-hour critical-finding SLA is achievable given the engineering
team's on-call capacity
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 348

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● Findings volume will remain manageable (under 100/year across all
sources)
OPTIONS CONSIDERED
| Option              | Pros                 | Cons               | Verdict |
| ------------------- | -------------------- | ------------------ | ------- |
| Three-tier          | Comprehensive        | Cost               | Adopted |
| program: annual     | coverage; fresh      | (~$120K/year:      |         |
| third-party +       | findings quarterly;  | $85K annual +      |         |
| quarterly internal  | continuous           | $15K red-team +    |         |
| red-team +          | external             | $20K bug-bounty);  |         |
| continuous bug-     | perspective;         | requires 1 FTE     |         |
| bounty.             | customer-            | Security           |         |
|                     | recognised           | Engineering time   |         |
|                     | evidence; defense-   | for coordination;  |         |
|                     | in-depth.            | potential finding- |         |
fatigue if not
deduplicated.
| Annual third-party  | Lowest cost   | Findings stale     | Rejected |
| ------------------- | ------------- | ------------------ | -------- |
| pentest only (no    | ($85K/year);  | within 3 months;   |          |
| red-team, no bug-   | simplest to   | no continuous      |          |
| bounty).            | manage;       | coverage; 2025     |          |
|                     | customer-     | audit explicitly   |          |
|                     | recognised    | recommended        |          |
|                     | evidence.     | additional tiers;  |          |
fails to detect
vulnerabilities
introduced
between annual
tests.
| Bug-bounty only  | Lowest cost         | Customers require  | Rejected |
| ---------------- | ------------------- | ------------------ | -------- |
| (no annual       | ($20K/year);        | annual pentest     |          |
| pentest, no red- | continuous          | report for         |          |
| team).           | coverage; external  | procurement; bug-  |          |
|                  | perspective.        | bounty findings    |          |
may lack the
depth of a
structured
pentest; no
internal red-team
skill-building.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  349

PreOne ADR - Volume 4: Security Architecture v3.0
Option Pros Cons Verdict
Outsource all Single vendor; Cost Rejected
penetration consistent ($200K+/year);
testing to a reporting; less flexible than
managed service managed SLAs. bespoke
(e.g., Synopsys, engagements;
Rapid7). managed services
often use junior
testers; customers
prefer named
firms (Bishop Fox,
NCC Group).
DECISION
ADOPTED
Adopt a three-tier penetration testing program. Tier 1: Annual third-party
penetration test by Bishop Fox (or equivalent recognised firm) covering the
full platform, with sanitised report shareable under NDA with customers.
Tier 2: Quarterly internal red-team exercise by the Security Engineering
team, targeting a specific bounded context or control (rotating through all
12 contexts over 3 years). Tier 3: Continuous bug-bounty program on
HackerOne, scope covering all public-facing surfaces, payouts $500-
$15,000. All findings tracked in a single Splunk-backed findings registry
with deduplication; remediation SLAs enforced via Jira automation
(critical=24hr, high=7d, medium=30d, low=backlog). The Security
Engineering Lead owns the program and reports quarterly to the ARB.
DETAILED RATIONALE
The three-tier program was chosen because each tier addresses a different gap.
The annual third-party pentest provides the depth and customer recognition
that a structured engagement brings — Bishop Fox's 4-week engagement
produces findings that internal testing and bug-bounty researchers miss,
because the engagement is structured (threat-model-driven, full-coverage) and
conducted by experienced testers. The quarterly red-team provides depth on
specific surfaces — the Security Engineering team, with deep knowledge of
PreOne's architecture, can target specific bounded contexts (e.g., 'this quarter:
the Enrollment aggregate and its access controls') with a focus that an external
firm cannot match. The bug-bounty provides breadth and freshness — external
researchers find different vulnerabilities than internal testers (different
perspectives, different tooling) and provide continuous coverage between
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 350

PreOne ADR - Volume 4: Security Architecture v3.0
annual engagements. The annual-only option was rejected because the 2025
audit found that 60% of the 23 findings would have been caught earlier with
continuous testing. The 6-month gap between the 2024 and 2025 pentests
allowed vulnerabilities to persist undetected; the 2025 critical auth-bypass had
been present since Q1 2025. The quarterly red-team would have caught it in
Q2. The bug-bounty-only option was rejected because customers (especially
large school districts) require a named-firm pentest report for procurement.
The bug-bounty provides supplementary evidence but cannot substitute. The
annual pentest also provides structured coverage that bug-bounty (which
targets low-hanging fruit) does not — Bishop Fox's threat-model-driven
approach finds architectural vulnerabilities that bug-bounty researchers miss.
The managed-service option was rejected after a cost-quality analysis.
Synopsys's managed pentest offering costs $200K+/year and uses junior
testers rotated across engagements; the 2025 Bishop Fox engagement cost
$85K and was conducted by a senior team with PreOne-specific context (they
had also done the 2024 engagement). The continuity of the Bishop Fox
engagement (same firm, same lead tester) produces higher-quality findings
than a managed service's rotating testers. The HackerOne bug-bounty was
selected over Bugcrowd and Intigriti based on three factors: (1) HackerOne's
researcher community is larger (1M+ vs Bugcrowd's 600K), increasing the
likelihood of findings; (2) PreOne's Security Engineering Lead had prior
positive experience with HackerOne at a previous company; (3) HackerOne's
triage service (optional, $5K/year) offloads initial finding validation, reducing
internal coordination overhead. The payout structure ($500 low, $2,500
medium, $7,500 high, $15,000 critical) is calibrated to the median for
education-sector programs per HackerOne's 2024 Annual Hacker Report. The
findings registry is the operational backbone. All findings — from annual
pentest, red-team, bug-bounty, and even SAST/DAST (ADR-083) — are
normalised to a common schema (severity, CVE if applicable, affected
component, reproduction steps, remediation status) and stored in Splunk.
Deduplication is rule-based (same component + same vulnerability class =
duplicate) with manual override. The registry drives the security scorecard and
provides trend analysis (e.g., 'access-control findings decreased 50% from 2024
to 2025'). The remediation SLAs are enforced via Jira automation. A finding
creates a Jira ticket with the SLA as the due date; 50% to SLA escalates to the
team lead; 100% to SLA escalates to the Security Engineering Lead; SLA
breach escalates to the CTO. Critical findings (24-hour SLA) trigger an
immediate page to the on-call engineer. The 24-hour critical SLA is achievable
because critical findings are rare (1-3 per year across all sources) and the on-
call engineer can spin up a fix branch within hours.
ARCHITECTURE DIAGRAM
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 351

PreOne ADR - Volume 4: Security Architecture v3.0
+------------------------------------------------------------------+ | PreOne Penetration
Testing Program | +------------------------------------------------------------------+ |
| | Tier 1: Annual Third-Party Pentest | | +-------------------+
| | | Bishop Fox (or | - 4-week engagement | | | equivalent) | -
full-platform coverage | | +---------+---------+ - sanitised report for
customers | | | | | v
| | +-------------------+ | | | Findings Registry | (Splunk-
backed, deduplicated) | | +---------+---------+ | |
| | Tier 2: Quarterly Internal Red-Team | | +-------------------+
| | | Security Eng Team | - 1 week per quarter | | | (red-team
rotation)| - target: 1 bounded context | | +---------+---------+
| | | | | v
| | +-------------------+ | | | Findings Registry |
| | +---------+---------+ | |
| | Tier 3: Continuous Bug Bounty | | +-------------------+
| | | HackerOne | - public program | | | (researchers) | -
scope: web + API + mobile backend | | +---------+---------+ - payouts: $500-
$15K | | | | | v
| | +-------------------+ | | | Triage Service | - validates
findings | | +---------+---------+ | | |
| | v | | +-------------------+
| | | Findings Registry | | | +-------------------+
| | | | Remediation:
| | Jira automation enforces SLAs (24hr/7d/30d/backlog) | | Security
scorecard tracks SLA compliance + trends |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Bishop Fox -> PreOne Platform: 4-week pentest Bishop Fox -> Findings Registry:
report findings (critical/high/med/low) Security Eng -> PreOne Platform:
quarterly red-team (1 BC) Security Eng -> Findings Registry: report findings
Researcher -> HackerOne: submit finding HackerOne -> Triage: validate Triage
-> Findings Registry: confirmed finding Findings Registry -> Jira: create ticket
(SLA-set due date) Jira -> Engineering Team: assignee Engineering Team ->
PreOne Platform: remediate Engineering Team -> Jira: close ticket Jira ->
Findings Registry: update status Note over Findings Registry, Jira: 50% SLA ->
team lead; 100% SLA -> SecEng Lead; breach -> CTO
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-087 — Penetration Testing
Program - Component View| +-------------------------------------------------------------+ |
| | Tier 1: Annual Third-Party | | +----------------+
+----------------------+ | | | Bishop Fox | test | Full Platform | | | |
(or equiv) |------->| (4-week engagement) | | | +----------------+ +----------
+-----------+ | | | | |
| findings | | v | | Tier 2: Quarterly
Red-Team | | +----------------+ +----------------------+ | | |
Security Eng | test | 1 Bounded Context | | | | (internal) |------->| (1-
week exercise) | | | +----------------+ +----------+-----------+ | |
| | | v | | Tier 3: Continuous Bug
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 352

PreOne ADR - Volume 4: Security Architecture v3.0
Bounty | | +----------------+ +----------------------+ | | |
HackerOne | test | Public Surface | | | | (researchers) |------->|
(continuous) | | | +----------------+ +----------+-----------+ | |
| | | v | | +----------------+
+----------------------+ | | | Findings | dedupe| Splunk Registry | | | |
Registry |------->| + Jira (SLA enforce) | | | +----------------+
+----------------------+ | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Annual Pentest Flow: SecEng Lead -> Bishop Fox: scope + contract Bishop
Fox -> PreOne Staging: 4-week test Bishop Fox -> Findings Registry: report
findings Findings Registry -> Jira: create tickets (SLA-set) Engineering ->
PreOne: remediate Bishop Fox -> PreOne: publish report (sanitised for
customers) Quarterly Red-Team Flow: SecEng -> Target BC: 1-week test
SecEng -> Findings Registry: report findings Findings Registry -> Jira: tickets
Bug-Bounty Flow: Researcher -> HackerOne: submit finding HackerOne ->
Triage: validate Triage -> Findings Registry: confirmed Findings Registry ->
Jira: ticket SecEng -> Researcher: payout ($500-$15K)
DATABASE IMPACT
Penetration testing has no direct database impact. Findings are stored in
Splunk (not Postgres). A materialised view (security.findings_summary, from
ADR-083) includes pentest findings for the security scorecard. The findings
registry in Splunk is the source of truth; the Postgres materialised view is a
read-optimised rollup. No schema changes are required for this ADR.
API IMPACT
No public API changes. The security scorecard API (internal) includes pentest-
finding metrics (open findings by severity, SLA compliance rate, time-to-
remediation trend). The annual pentest report is published as a PDF in the
customer portal (under NDA); a sanitised version (severity counts, no
exploitation details) is public on the security page. The bug-bounty program has
a public HackerOne page (hackerone.com/preone) with scope, payouts, and
leaderboard.
UI IMPACT
Penetration Testing has no direct UI surface for end users. The security page
(preone.com/security) displays 'Bishop Fox tested' and 'HackerOne bug bounty
program' badges, building customer trust. The customer portal (under NDA)
includes the sanitised annual pentest report. For internal users, the admin UI
includes a 'Pentest Findings' dashboard (admin/operations/security/pentest)
showing open findings by source (annual, red-team, bug-bounty) and severity,
with SLA compliance metrics. The HackerOne bug-bounty page
(hackerone.com/preone) is public, showing scope, payouts, and leaderboard.
SECURITY IMPACT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 353

PreOne ADR - Volume 4: Security Architecture v3.0
The pentest program is a critical security control. The 2025 annual pentest
found 2 critical vulnerabilities that, if exploited, would have caused data
breaches; the 24-hour SLA ensured remediation before exploitation. The
quarterly red-team and continuous bug-bounty reduce the time between
vulnerability introduction and discovery. The program provides documentary
evidence for FERPA, GDPR, DPDP, COPPA compliance, and is a direct revenue
enabler for customer procurement. The findings registry provides trend
analysis that informs security investment (e.g., 'access-control findings
decreased 50% — invest elsewhere').
PERFORMANCE IMPACT
Penetration testing has no performance impact on production. The annual
pentest runs against staging (production-mirror) to avoid customer impact. The
quarterly red-team runs against staging for the same reason. The bug-bounty
program runs against production (researchers test the live platform), but the
scope excludes denial-of-service and rate-limited endpoints prevent disruption.
Active scanning by researchers is throttled by WAF (ADR-084) rate-limiting. No
customer-visible performance impact has occurred from bug-bounty activity.
SCALABILITY ANALYSIS
The pentest program scales linearly with finding volume. At 50-100
findings/year across all sources, the Splunk-backed registry handles the volume
easily. The Security Engineering Lead's coordination time (estimated 8
hours/week) is the scaling bottleneck; if finding volume doubles, a second
security engineer may be needed for triage. The bug-bounty budget
($20K/year) is sized for 10-20 payouts; if volume exceeds this, the budget can
be increased proportionally. The annual pentest cost ($85K) is fixed regardless
of finding volume. The quarterly red-team time (1 FTE-week per quarter = 0.25
FTE) is absorbed by the Security Engineering team's existing capacity.
OPERATIONAL CONSIDERATIONS
The Security Engineering Lead owns the pentest program. The team
coordinates: (a) annual pentest engagement (scope, contract, scheduling,
report review); (b) quarterly red-team exercise (scope selection, execution,
findings write-up); (c) bug-bounty program (triage queue, payout approval,
researcher communication). The team monitors a #pentest-findings Slack
channel where new findings post automatically. The monthly security scorecard
tracks: (a) open findings by source and severity; (b) SLA compliance rate; (c)
time-to-remediation trend; (d) finding-duplicate rate; (e) bug-bounty payout
budget burn. Quarterly, the ARB reviews the program and approves scope for
the next quarter's red-team exercise.
RISKS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 354

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk              | Likelihood | Impact | Mitigation           |
| ----------------- | ---------- | ------ | -------------------- |
| Critical finding  | Low        | High   | 24-hour SLA is       |
| exploited before  |            |        | aggressive; on-call  |
| remediation SLA   |            |        | engineer paged       |
| (24 hours)        |            |        | immediately; WAF     |
virtual patch
(ADR-084)
provides interim
protection; if
exploitation
detected, incident
response
(ADR-090)
triggered
| Bug-bounty          | Low | Medium | HackerOne's  |
| ------------------- | --- | ------ | ------------ |
| researcher finds    |     |        | disclosure   |
| vulnerability and   |     |        | framework    |
| discloses publicly  |     |        | encourages   |
| before triage       |     |        | responsible  |
disclosure;
PreOne commits
to 24-hour
acknowledgment
and 7-day
remediation for
high-severity
findings; public
disclosure gated
on remediation
| Annual pentest   | Low | Medium | Backup firms     |
| ---------------- | --- | ------ | ---------------- |
| engagement       |     |        | identified (NCC  |
| delayed (Bishop  |     |        | Group, Trail of  |
| Fox unavailable) |     |        | Bits); contract  |
allows 90-day
delay; customer
communication if
delay impacts
procurement
| Finding volume  | Medium | Medium | HackerOne triage     |
| --------------- | ------ | ------ | -------------------- |
| exceeds triage  |        |        | service offloads     |
| capacity        |        |        | initial validation;  |
quarterly red-
team scope
narrowed if
volume spikes;
second security
engineer
budgeted for 2027
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  355

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation           |
| ------------------ | ---------- | ------ | -------------------- |
| Findings registry  | Medium     | Low    | Rule-based           |
| deduplication      |            |        | deduplication with   |
| misses duplicates  |            |        | manual override;     |
| (same vuln         |            |        | weekly review of     |
| reported multiple  |            |        | recent findings for  |
| times)             |            |        | duplicates;          |
researcher
feedback on
duplicate closure
TRADE-OFFS
| We Gain                           |     | We Lose                 |     |
| --------------------------------- | --- | ----------------------- | --- |
| Comprehensive coverage (annual +  |     | $120K/year program cost |     |
quarterly + continuous)
Customer-recognised evidence (Bishop  Engagement scheduling dependency on
| Fox report) |     | Bishop Fox availability |     |
| ----------- | --- | ----------------------- | --- |
Continuous external perspective (bug- Public disclosure risk if researcher does
| bounty) |     | not follow responsible disclosure |     |
| ------- | --- | --------------------------------- | --- |
Internal skill-building (quarterly red- 0.25 FTE Security Engineering time
team)
Unified findings registry for trend  Triage coordination overhead across 3
| analysis |     | sources |     |
| -------- | --- | ------- | --- |
REJECTED ALTERNATIVES
The annual-only option was the legacy program. The 2025 audit found that 60%
of findings would have been caught earlier with continuous testing, and
recommended the three-tier program. The bug-bounty-only option was rejected
because customers require named-firm pentest reports for procurement; the
bug-bounty cannot substitute. The managed-service option (Synopsys) was
piloted in Q2 2025; the pilot found that the managed service's junior testers
missed architectural vulnerabilities that Bishop Fox's senior team caught, and
the cost ($200K vs $85K) was not justified by the lower quality. The three-tier
program was the only option that satisfied all requirements: customer
recognition,   continuous   coverage,   internal   skill-building,   and   cost-
effectiveness.
MIGRATION PLAN
Phase 1 (Q4 2025, complete): Bishop Fox annual pentest completed; 23 findings
remediated per SLA. Phase 2 (Q1 2026, complete): First quarterly red-team
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  356

PreOne ADR - Volume 4: Security Architecture v3.0
exercise conducted (target: Identity bounded context); 8 findings, all
remediated. Phase 3 (Q2 2026, complete): HackerOne bug-bounty program
launched; public page published; first 10 findings triaged. Phase 4 (Q2 2026,
complete): Splunk findings registry deployed with deduplication. Phase 5 (Q3
2026, complete): Jira automation for SLA enforcement configured. Phase 6
(ongoing): Quarterly red-team (rotating through 12 bounded contexts over 3
years); annual Bishop Fox engagement; continuous bug-bounty triage.
TESTING STRATEGY
The pentest program is itself a testing program. Internal quality is measured
by: (a) duplicate-finding rate (target: <20% — high duplicate rate suggests
internal testing is finding the same vulnerabilities as external); (b) customer-
procurement success rate with the annual report (target: 100% — if customers
reject the report, the engagement quality is insufficient); (c) finding severity
distribution (target: trend toward fewer critical/high findings over time); (d)
time-to-remediation trend (target: stable or improving). The quarterly red-team
exercise is reviewed by the ARB; the bug-bounty program is reviewed annually
by the Security Engineering Lead and the ARB.
MONITORING & OBSERVABILITY
Splunk dashboards track: (a) open findings by source (annual, red-team, bug-
bounty, SAST, DAST) and severity; (b) SLA compliance rate by source; (c) time-
to-remediation trend by severity; (d) bug-bounty payout budget burn; (e)
researcher participation rate (active researchers per month); (f) duplicate-
finding rate; (g) finding-severity trend over time. Anomalies (e.g., a sudden
spike in critical findings from any source) trigger Slack alerts to #pentest-
findings. The pentest dashboard (admin/operations/security/pentest) provides
a real-time view for the security team. Annual report: the Security Engineering
Lead presents the program summary to the ARB and CTO each January.
FUTURE EVOLUTION
Three evolutions are likely. First, the bug-bounty program may expand to
include private engagements with specific researchers (HackerOne Challenge)
for targeted testing of new features before launch. Second, the quarterly red-
team may evolve into a continuous 'purple team' (red + blue) where the
Security Engineering team tests and the SOC team detects, measuring
detection efficacy. Third, the program may integrate AI-assisted vulnerability
remediation (e.g., GitHub Copilot Autofix) to reduce engineering remediation
time — gated on the AI tooling ADR (ADR-148) maturity.
RELATED ADRS
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 357

PreOne ADR - Volume 4: Security Architecture v3.0
● ADR-002 — Modular Monolith Strategy (pentest covers the monolith's
full surface)
● ADR-083 — Vulnerability Management (pentest findings feed the
unified findings registry)
● ADR-084 — Web Application Firewall (WAF virtual-patches pentest
findings awaiting remediation)
● ADR-085 — DDoS Protection (pentest scope excludes DoS, handled by
DDoS protection)
● ADR-086 — Audit Trail (pentest findings logged to audit trail)
● ADR-088 — Compliance Framework (pentest is required evidence for
FERPA/GDPR/DPDP/COPPA)
● ADR-089 — Data Loss Prevention (pentest scope includes DLP bypass
attempts)
● ADR-090 — Incident Response (critical pentest findings may trigger
incident response)
REFERENCES
● Upstream PRD: PRD-007 (Security Requirements — penetration testing
section)
● Downstream ERD: ERD-087 (security.findings_summary materialised
view includes pentest findings)
● Downstream API Spec: API-087 (internal pentest dashboard endpoints)
● Downstream Test Cases: TC-087 (pentest program metrics tests)
● External: OWASP Web Security Testing Guide (WSTG)
● External: PTES (Penetration Testing Execution Standard)
● External: HackerOne 2024 Annual Hacker Report
● External: Bishop Fox 2025 Pentest Report (PreOne, under NDA)
DECISION HISTORY
Date Status Actor Notes
2025-10-01 Draft Security Initial draft;
Engineering Lead options
enumerated;
consultation with
security and
engineering teams
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 358

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status   | Actor            | Notes         |
| ---------- | -------- | ---------------- | ------------- |
| 2025-11-17 | Proposed | Security         | Submitted to  |
|            |          | Engineering Lead | Architecture  |
Review Board
after cross-team
review
| 2025-12-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect           |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Security Engineering Lead |     |
| ARB Chair   |     | ARB Chair                 |     |
| Approved On |     | 2025-12-15                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Bishop Fox annual pentest contracted (Done — Q4 2025)
● Quarterly red-team schedule (rotating 12 BCs over 3yr) (Done)
● HackerOne bug-bounty program launched (Done — Q2 2026)
● HackerOne triage service ($5K/yr) (Done)
● Splunk findings registry with deduplication (Done)
● Jira SLA automation (critical=24h, high=7d, med=30d) (Done)
● Security scorecard dashboard (Done)
AD R -088
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  359

PreOne ADR - Volume 4: Security Architecture v3.0
Compliance Framework
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a unified compliance framework covering FERPA (US, education
records), GDPR (EU, personal data), DPDP (India, digital personal data),
and COPPA (US, under-13 children). The framework is structured around
12 control domains (access control, encryption, audit, retention, breach
notification, data subject rights, consent management, vendor
management, incident response, vulnerability management, training,
governance) with each regulation mapped to the controls it requires. A
single Compliance Operations team owns the framework, with automated
evidence collection from Postgres (audit trail), Splunk (security events), and
AWS Config (infrastructure controls). Annual external audits (SOC 2 Type
II, ISO 27001) validate the framework.
STATUS
Status Accepted
Date Decided 2025-12-20
Decision Owner Compliance Operations Lead
Review Cadence Annual review, or on regulatory
update, or after each major incident
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne operates across multiple regulatory jurisdictions. US customers (school
districts, higher education) require FERPA compliance for student education
records; EU customers require GDPR compliance for personal data; Indian
customers require DPDP compliance for digital personal data; US customers
serving under-13 students require COPPA compliance. Each regulation has
overlapping but distinct requirements — maintaining separate compliance
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 360

PreOne ADR - Volume 4: Security Architecture v3.0
programs per regulation would be operationally infeasible for a 50-engineer
organisation. The 2025 audit found that the legacy platform maintained 4
separate compliance spreadsheets (one per regulation), each tracking the same
controls with different evidence formats. The spreadsheets were inconsistent
(e.g., the FERPA spreadsheet listed 'audit trail retention: 7 years' while the
GDPR spreadsheet listed 'audit trail retention: 3 years' — both incorrect, as the
actual retention is 7 years per the more stringent FERPA requirement). The
audit recommended a unified framework with a single source of truth. The
unified framework is structured around 12 control domains derived from the
NIST Cybersecurity Framework (CSF) and ISO 27001 Annex A. Each regulation
is mapped to the controls it requires; where regulations conflict (e.g., retention:
FERPA 7 years, GDPR 'no longer than necessary'), the more stringent
requirement applies. The framework is technology-agnostic — the same
controls apply regardless of the underlying ADRs — but each control references
the ADRs that implement it (e.g., the 'audit' control references ADR-086 Audit
Trail). The framework is operated by a dedicated Compliance Operations team
(3 people) with automated evidence collection. Manual evidence gathering (the
legacy model) consumed 2 engineer-weeks per audit; automated collection
reduces this to 2 engineer-days. The framework supports annual external
audits (SOC 2 Type II, ISO 27001) which are customer procurement
requirements for large institutional customers.
BUSINESS DRIVERS
The primary driver is operational efficiency. Maintaining 4 separate compliance
programs (FERPA, GDPR, DPDP, COPPA) is infeasible; the unified framework
reduces the operational burden by 75% (one program instead of four). The 2025
audit estimated the legacy program consumed 8 engineer-weeks per quarter
across evidence gathering, audit preparation, and remediation tracking; the
unified framework reduces this to 2 engineer-weeks per quarter. A secondary
driver is customer acquisition. Large institutional customers (state university
systems, multi-state school districts) require SOC 2 Type II and ISO 27001
certifications as procurement gates. The unified framework provides the
evidence base for these certifications, enabling $5M+ in annual recurring
revenue from enterprise customers. The 2025 SOC 2 audit (the first under the
unified framework) was completed in 6 weeks (vs the 18-week estimate for the
legacy model). A tertiary driver is risk reduction. The unified framework
ensures no control falls through the cracks (the legacy spreadsheets had gaps
— e.g., the COPPA spreadsheet did not track parental-consent records, a
COPPA requirement). The framework's automated evidence collection detects
missing evidence immediately, rather than at audit time. A quaternary driver is
regulatory readiness. New regulations (e.g., India's DPDP rules, finalized in
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 361

PreOne ADR - Volume 4: Security Architecture v3.0
2025; the EU AI Act, taking effect in 2026) can be mapped to the existing
framework, reducing the time-to-compliance from months to weeks.
PROBLEM STATEMENT
PreOne requires a unified compliance framework that covers FERPA, GDPR,
DPDP, and COPPA with a single source of truth, automated evidence collection,
and support for annual external audits (SOC 2, ISO 27001) — reducing
operational burden while ensuring no control gaps across jurisdictions.
CONSTRAINTS
● Framework must cover FERPA, GDPR, DPDP, COPPA, and be
extensible to future regulations
● Control domains must be derived from a recognized standard (NIST
CSF or ISO 27001 Annex A)
● Where regulations conflict, the more stringent requirement applies
● Evidence collection must be automated (no manual evidence gathering
for routine controls)
● Evidence must be queryable by auditors via a read-only tool (no direct
DB access)
● Annual external audits (SOC 2 Type II, ISO 27001) must be supported
● The framework must be version-controlled (no spreadsheet-only
changes)
● Compliance gaps must be detected within 24 hours (automated
evidence checks)
ASSUMPTIONS
● The 12 control domains derived from NIST CSF cover all FERPA,
GDPR, DPDP, COPPA requirements
● Automated evidence collection from Postgres, Splunk, and AWS Config
covers >= 90% of required evidence
● The 3-person Compliance Operations team can manage the framework
● SOC 2 Type II and ISO 27001 audits will accept the unified
framework's evidence
● New regulations (e.g., EU AI Act) can be mapped to the existing 12
control domains
● The more-stringent-requirement rule produces no impossible-to-satisfy
conflicts
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 362

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option              | Pros                | Cons                | Verdict |
| ------------------- | ------------------- | ------------------- | ------- |
| Unified             | Single source of    | Requires 3-person   | Adopted |
| framework: 12       | truth; operational  | Compliance          |         |
| NIST CSF-derived    | efficiency (75%     | Operations team;    |         |
| control domains,    | reduction vs 4      | upfront             |         |
| multi-regulation    | separate            | framework design    |         |
| mapping,            | programs);          | effort; ISO 27001   |         |
| automated           | customer-           | certification cost  |         |
| evidence            | recognised          | ($50K/year);        |         |
| collection, annual  | certifications      | potential for over- |         |
| SOC 2 + ISO         | (SOC 2, ISO         | engineering if      |         |
| 27001 audits.       | 27001); extensible  | regulations do not  |         |
|                     | to new              | materialise.        |         |
regulations;
automated
evidence reduces
audit preparation
time.
| Separate       | Each program is      | 4x operational    | Rejected |
| -------------- | -------------------- | ----------------- | -------- |
| compliance     | optimised for its    | burden (8         |          |
| programs per   | regulation; no risk  | engineer-weeks    |          |
| regulation     | of over-             | per quarter);     |          |
| (FERPA, GDPR,  | generalisation;      | inconsistent      |          |
| DPDP, COPPA).  | auditors see a       | evidence (legacy  |          |
|                | regulation-specific  | problem); no SOC  |          |
|                | program.             | 2 / ISO 27001     |          |
certifications;
customer
procurement
failures; infeasible
for a 50-engineer
organisation.
| Outsource        | Minimal internal   | Loss of control   | Rejected |
| ---------------- | ------------------ | ----------------- | -------- |
| compliance to a  | effort; pre-built  | over evidence     |          |
| managed service  | control mappings;  | format; cost      |          |
| (e.g., Drata,    | continuous         | ($50K+/year);     |          |
| Vanta).          | monitoring; SOC 2  | evidence may not  |          |
|                  | / ISO 27001        | map cleanly to    |          |
|                  | support.           | PreOne's ADR-     |          |
based
architecture;
auditors may not
accept managed-
service evidence
without validation.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  363

PreOne ADR - Volume 4: Security Architecture v3.0
Option Pros Cons Verdict
Defer formal Zero upfront cost; Fails customer Rejected
compliance until no operational procurement
customer demand burden. gates (lose $5M+
requires it. ARR); regulatory
exposure (GDPR
fines up to 4%
global revenue);
2025 audit
explicitly rejected
this option; pre-
existing customer
contracts require
compliance.
DECISION
ADOPTED
Adopt a unified compliance framework covering FERPA, GDPR, DPDP, and
COPPA, structured around 12 NIST CSF-derived control domains: (1)
Access Control, (2) Encryption, (3) Audit & Monitoring, (4) Data Retention,
(5) Breach Notification, (6) Data Subject Rights, (7) Consent Management,
(8) Vendor Management, (9) Incident Response, (10) Vulnerability
Management, (11) Security Training, (12) Governance & Risk. Each
regulation is mapped to the controls it requires; where regulations conflict,
the more stringent requirement applies. A 3-person Compliance Operations
team owns the framework, with automated evidence collection from
Postgres (audit trail), Splunk (security events), and AWS Config
(infrastructure controls). Annual external audits (SOC 2 Type II, ISO 27001)
validate the framework. The framework is version-controlled in a dedicated
Git repository (compliance-framework).
DETAILED RATIONALE
The unified framework was chosen because maintaining 4 separate compliance
programs is operationally infeasible. The 2025 audit documented the legacy
problem: 4 spreadsheets tracking the same controls with inconsistent evidence,
consuming 8 engineer-weeks per quarter. The unified framework consolidates
to a single source of truth, reducing operational burden by 75%. The 12 control
domains, derived from NIST CSF, provide a recognized structure that auditors
(SOC 2, ISO 27001) accept without customization. The NIST CSF derivation
was chosen over ISO 27001 Annex A because NIST CSF is more outcome-
oriented (Identify, Protect, Detect, Respond, Recover) while ISO 27001 Annex A
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 364

PreOne ADR - Volume 4: Security Architecture v3.0
is more control-oriented. PreOne's framework needs to be outcome-oriented
(because the regulations specify outcomes, not controls) but also ISO 27001-
compatible (for the certification audit). The 12 domains are a hybrid: derived
from NIST CSF's outcomes, but structured as controls (with specific evidence)
for ISO 27001 compatibility. The separate-programs option was rejected based
on the 2025 audit's operational-burden finding. The 4 separate spreadsheets
consumed 8 engineer-weeks per quarter — equivalent to 1 FTE — and produced
inconsistent evidence (the FERPA vs GDPR retention discrepancy was the most
visible example, but there were 11 other inconsistencies). The unified
framework eliminates the inconsistencies by having a single source of truth.
The managed-service option (Drata, Vanta) was piloted in Q1 2026. The pilot
found that the managed services' pre-built control mappings did not map
cleanly to PreOne's ADR-based architecture (e.g., Drata's 'access control'
control expected an Okta integration; PreOne uses an in-house identity model
per ADR-061). Customizing the managed service to fit PreOne's architecture
would have cost $50K+/year and still required significant internal effort for
evidence customization. The in-house framework costs 3 FTE (Compliance
Operations team) but provides full control over evidence format and is more
audit-defensible. The deferral option was rejected because pre-existing
customer contracts require compliance. The 2025 audit identified 12 customer
contracts with compliance clauses; failure to comply would trigger contract
termination and revenue loss. The regulatory exposure (GDPR fines up to 4% of
global revenue; DPDP fines up to INR 250 crore) is also material. Deferral is not
a viable option. The automated evidence collection is the operational
backbone. The Compliance Operations team built an evidence-collection
pipeline that queries: (a) Postgres audit trail (ADR-086) for access-control,
audit, and data-subject-rights evidence; (b) Splunk for security-event, incident-
response, and vulnerability-management evidence; (c) AWS Config for
encryption, infrastructure-access, and configuration-management evidence.
The pipeline runs nightly and populates a compliance-evidence Postgres
schema, queryable by auditors via a read-only tool
(admin/operations/compliance). Missing evidence (e.g., a control with no
evidence in the last 24 hours) triggers a Slack alert to the Compliance
Operations team. The annual external audits (SOC 2 Type II, ISO 27001) are
customer-procurement requirements. SOC 2 Type II was completed in 2025 (6
weeks, $45K cost); ISO 27001 certification is scheduled for Q1 2027 (estimated
12 weeks, $50K cost). Both audits accept the unified framework's evidence; the
auditors praised the automated evidence collection as 'best-in-class' in the
2025 SOC 2 report. The more-stringent-requirement rule resolves regulatory
conflicts. For retention: FERPA requires 7 years for student education records;
GDPR requires 'no longer than necessary' (typically 3-5 years for personal
data). The more stringent (7 years) applies. For breach notification: GDPR
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 365

PreOne ADR - Volume 4: Security Architecture v3.0
requires 72 hours; DPDP requires 72 hours; FERPA requires 'reasonable'
(interpreted as 24 hours). The more stringent (24 hours) applies. The rule
produces no impossible-to-satisfy conflicts because the regulations are aligned
in spirit (protect individual privacy); conflicts are typically in stringency, not in
kind.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | PreOne Unified
Compliance Framework |
+------------------------------------------------------------------+ |
| | Regulations: | | +--------+ +------+ +------+
+------+ | | | FERPA | | GDPR | | DPDP | |COPPA | ... (extensible)
| | +---+----+ +--+---+ +--+---+ +--+---+ | | | | | |
| | +-----+---+--------+--------+ | | |
| | v | | +-------------------+
| | | Regulation-to- | (mapping; more stringent wins) | | | Control
Mapping | | | +---------+---------+
| | | | | v
| | +-------------------+ | | | 12 Control | (NIST CSF-
derived) | | | Domains: | | | | 1.
Access Control | | | | 2. Encryption |
| | | 3. Audit & Monitor| | | | 4. Retention |
| | | 5. Breach Notif. | | | | 6. Data Subject |
| | | 7. Consent Mgmt | | | | 8. Vendor Mgmt |
| | | 9. Incident Resp. | | | | 10. Vuln Mgmt |
| | | 11. Training | | | | 12. Governance |
| | +---------+---------+ | | |
| | v | | +-------------------+
| | | Evidence | (automated collection) | | | Collection Pipeline|
| | +---------+---------+ | | |
| | +----+---+---+ | | v v v
| | +------+ +-----+ +--------+ | | |Postgres| |Splunk| |AWS
Conf| | | |(audit)| |(sec) | |(infra) | | |
+------+ +-----+ +--------+ | | |
| | v | | +-------------------+
| | | Compliance | (read-only auditor tool) | | | Evidence Schema |
| | +---------+---------+ | | |
| | v | | +-------------------+
| | | Annual Audits: | | | | SOC 2 Type II |
| | | ISO 27001 | | | +-------------------+
| +------------------------------------------------------------------+
SEQUENCE DIAGRAM
Regulation (FERPA/GDPR/DPDP/COPPA) -> Framework: requirement
Framework -> Control Mapping: map to 12 domains Control Mapping -> Control
Domain: assign (more stringent wins) Control Domain -> Evidence Pipeline:
collect evidence nightly Evidence Pipeline -> Postgres: query audit trail Evidence
Pipeline -> Splunk: query security events Evidence Pipeline -> AWS Config:
query infrastructure controls Evidence Pipeline -> Compliance Schema: write
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 366

PreOne ADR - Volume 4: Security Architecture v3.0
evidence Note over Evidence Pipeline, Compliance Schema: missing evidence ->
Slack alert Auditor -> Admin Tool: query compliance evidence Admin Tool ->
Compliance Schema: SELECT ... WHERE control = X AND date BETWEEN ...
Compliance Schema -> Admin Tool: rows Admin Tool -> Auditor: CSV / table
view Annual Audit: External Auditor -> Framework: SOC 2 / ISO 27001 audit
Framework -> External Auditor: evidence + control mappings External Auditor
-> PreOne: certification (or findings)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-088 — Compliance
Framework - Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Regulations | map | 12
Control Domains | | | | (FERPA/GDPR/ |------->| (NIST CSF-derived) |
| | | DPDP/COPPA) | | | | | +----------------+ +----------
+-----------+ | | | | |
| collect evidence | | v | | +-------------+
+--------+ +--------+ | | | Postgres | | Splunk | | AWS |
| | | (audit) | | (sec) | | Config| | | +-------------+ +--------+ +--------+
| | \ | / | | \ | / |
| v v v | | +-----------+
| | | Evidence | | | | Pipeline |
| | +-----+-----+ | | |
| | v | | +-----------+
| | | Compliance| | | | Schema |
| | +-----------+ | |
| | Audits: SOC 2 Type II (annual) + ISO 27001 (Q1 2027) |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Evidence Collection Flow (nightly): Pipeline -> Postgres: query audit trail
(access control evidence) Pipeline -> Splunk: query security events (incident
response evidence) Pipeline -> AWS Config: query infrastructure (encryption
evidence) Pipeline -> Compliance Schema: write evidence rows Pipeline ->
Slack: alert on missing evidence Auditor Query Flow: Auditor -> Admin Tool:
query (control + date range) Admin Tool -> Compliance Schema: SELECT
Admin Tool -> Auditor: CSV / table view Annual Audit Flow: External Auditor
-> PreOne: SOC 2 / ISO 27001 audit Compliance Ops -> Admin Tool: evidence
queries External Auditor -> PreOne: certification (or findings)
DATABASE IMPACT
Compliance framework adds a dedicated Postgres schema (compliance.*) with
the following tables: compliance.control_definitions (12 rows, the control
catalog), compliance.regulations (4 rows, the regulation catalog),
compliance.control_mapping (many-to-many between regulations and controls,
with stringency annotation), compliance.evidence (the automated-evidence
table, ~10K rows/day), compliance.evidence_gaps (missing-evidence alerts,
~10 rows/day). The compliance schema is read-replica-friendly for auditor
queries. The audit trail (ADR-086) is the primary evidence source for access-
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 367

PreOne ADR - Volume 4: Security Architecture v3.0
control, audit, and data-subject-rights controls. No business-schema changes
are required.
API IMPACT
No public API changes. The admin API exposes GET
/admin/compliance/evidence with filters (control, regulation, date range,
status). The admin API is RBAC-controlled (admin or auditor role only); auditors
receive a 24-hour temporary account. The API enforces a maximum date range
of 90 days per query (consistent with the audit trail API). A separate endpoint
(GET /admin/compliance/gaps) surfaces missing-evidence alerts for the
Compliance Operations team.
UI IMPACT
The Compliance Framework surfaces in the admin UI as the 'Compliance'
dashboard (admin/operations/compliance, accessible to Compliance Ops and
ARB members). The dashboard shows the 12 control domains with coverage
status (green / yellow / red), evidence freshness, and open audit findings. The
'Auditor Onboarding' workflow (admin/operations/compliance/auditor-
onboarding) allows Compliance Ops to create 24-hour temporary accounts for
external auditors. The security page (preone.com/security) displays 'SOC 2
Type II Certified' and 'ISO 27001 Certified' badges (the latter after Q1 2027
certification), enabling customer procurement. No end-user UI changes were
required.
SECURITY IMPACT
The compliance framework is the meta-control that ensures all other security
controls are present, evidenced, and audit-ready. It provides: (1) a single
source of truth for control status; (2) automated evidence collection (eliminates
manual-gathering errors); (3) missing-evidence detection (24-hour alert); (4)
auditor self-service (reduces internal coordination); (5) annual external-audit
support (SOC 2, ISO 27001). The framework directly enables customer
procurement ($5M+ ARR from enterprise customers requiring certifications)
and reduces regulatory risk (GDPR, DPDP fines).
PERFORMANCE IMPACT
The compliance framework has minimal performance impact. The evidence-
collection pipeline runs nightly (off-peak) and queries read replicas (no OLTP
impact). The compliance schema is small (10K rows/day = 3.6M rows/year);
partitioning by month keeps query latency under 500ms p95 for auditor
queries. The missing-evidence detection job runs hourly and completes in
under 5 minutes. The admin tool's auditor queries run against read replicas; no
impact on production traffic.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 368

PreOne ADR - Volume 4: Security Architecture v3.0
SCALABILITY ANALYSIS
The framework scales linearly with regulation count (currently 4, projected 6-8
by 2028 with EU AI Act, India DPDP Rules, US state privacy laws). Each new
regulation requires: (1) mapping to the 12 control domains (1-2 days); (2)
identifying any control gaps (1 day); (3) updating the evidence-collection
pipeline if new evidence sources are needed (1-5 days). The 3-person
Compliance Operations team can absorb 2-3 new regulations per year without
additional headcount. The evidence volume scales with audit-event volume
(~500 events/second = 10K evidence rows/day); Postgres capacity is sufficient
through 2030.
OPERATIONAL CONSIDERATIONS
The Compliance Operations team (3 people) owns the framework. The team
coordinates: (a) annual external audits (SOC 2, ISO 27001); (b) quarterly
internal control reviews; (c) missing-evidence alert triage (target: <5 open
alerts at any time); (d) new-regulation onboarding; (e) evidence-pipeline
maintenance. The team monitors a #compliance-alerts Slack channel where
missing-evidence alerts post automatically. The monthly compliance scorecard
tracks: (a) control coverage rate (target: 100%); (b) evidence freshness (target:
<24 hours); (c) open audit findings (target: 0); (d) audit-readiness score
(composite metric). Quarterly, the ARB reviews the framework and approves
new-regulation onboarding.
RISKS
Risk Likelihood Impact Mitigation
New regulation Medium Medium 12 domains
(e.g., EU AI Act) derived from NIST
requires controls CSF
not in the 12 (comprehensive);
domains new domains can
be added
(framework is
extensible);
annual framework
review identifies
gaps
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 369

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Automated          | Low        | High   | Pipeline has retry  |
| evidence pipeline  |            |        | + dead-letter       |
| fails (missing-    |            |        | queue; missing-     |
| evidence false     |            |        | evidence alert      |
| negative)          |            |        | validates pipeline  |
output; weekly
manual sample-
audit of 10
random controls
| External auditor  | Low | High | 2025 SOC 2 audit  |
| ----------------- | --- | ---- | ----------------- |
| rejects the       |     |      | accepted the      |
| framework         |     |      | framework; ISO    |
| (insufficient     |     |      | 27001 pre-        |
| evidence format)  |     |      | assessment in Q4  |
2026 will validate;
auditor feedback
incorporated
annually
| Compliance        | Medium | Medium | Cross-training     |
| ----------------- | ------ | ------ | ------------------ |
| Operations team   |        |        | within team;       |
| loses a member    |        |        | framework          |
| (single-point-of- |        |        | documentation in   |
| knowledge)        |        |        | Git; runbooks for  |
all routine
operations; deputy
appointment
mandatory
| Customer            | Medium | Low | Framework is      |
| ------------------- | ------ | --- | ----------------- |
| requests a          |        |     | extensible; new   |
| regulation not yet  |        |     | regulation        |
| covered (e.g.,      |        |     | onboarding takes  |
| Brazil LGPD)        |        |     | 2-5 days;         |
customer
communication
sets realistic
timeline
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Single source of truth across 4  3-person Compliance Operations team
| regulations |     | cost |     |
| ----------- | --- | ---- | --- |
Automated evidence collection (75%  Pipeline development effort (8 engineer-
| operational reduction) |     | weeks upfront) |     |
| ---------------------- | --- | -------------- | --- |
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  370

PreOne ADR - Volume 4: Security Architecture v3.0
We Gain We Lose
Customer-recognised certifications Annual audit cost ($45K SOC 2 + $50K
(SOC 2, ISO 27001) ISO 27001)
Extensible to new regulations Risk of over-engineering if regulations
do not materialise
Auditor self-service (reduces internal Auditor onboarding training (1 hour per
coordination) auditor)
REJECTED ALTERNATIVES
The separate-programs option was the legacy model and was documented in
the 2025 audit as operationally infeasible (8 engineer-weeks per quarter,
inconsistent evidence). The managed-service option (Drata, Vanta) was piloted
in Q1 2026; the pilot found that pre-built control mappings did not fit PreOne's
ADR-based architecture, and customization cost ($50K+/year) plus internal
effort exceeded the in-house framework cost. The deferral option was rejected
because pre-existing customer contracts require compliance; deferral would
trigger contract termination and regulatory fines. The unified framework was
the only option that satisfied all requirements: operational efficiency, customer
recognition, extensibility, and audit-readiness.
MIGRATION PLAN
Phase 1 (Q4 2025, complete): Framework designed (12 control domains,
regulation mapping). Phase 2 (Q1 2026, complete): Evidence-collection
pipeline deployed. Phase 3 (Q1 2026, complete): Compliance Operations team
hired (3 people). Phase 4 (Q2 2026, complete): 2025 SOC 2 Type II audit
completed (6 weeks, $45K). Phase 5 (Q3 2026, complete): Auditor self-service
tool deployed. Phase 6 (Q4 2026, planned): ISO 27001 pre-assessment. Phase 7
(Q1 2027, planned): ISO 27001 certification audit. Phase 8 (ongoing): New-
regulation onboarding (EU AI Act expected Q2 2027).
TESTING STRATEGY
The framework is tested at three levels. (1) Control tests: each of the 12 control
domains has an automated test that verifies the control is in effect (e.g., the
'encryption' control test verifies that all RDS instances have encryption-at-rest
enabled, queried from AWS Config). (2) Evidence tests: the evidence-collection
pipeline has a synthetic-evidence generator that injects test evidence and
verifies it appears in the compliance schema. (3) End-to-end audit simulation:
quarterly, the Compliance Operations team simulates an external audit (using
the same queries an auditor would use) and verifies the framework produces
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 371

PreOne ADR - Volume 4: Security Architecture v3.0
complete, accurate evidence. The annual external audit (SOC 2, ISO 27001) is
the ultimate test.
MONITORING & OBSERVABILITY
Splunk dashboards track: (a) control coverage rate (target: 100%); (b) evidence
freshness by control (target: <24 hours); (c) open audit findings by severity and
age; (d) missing-evidence alerts (target: 0 open alerts >24 hours); (e) evidence-
pipeline health (success rate, duration); (f) audit-readiness score (composite
metric: coverage + freshness + findings). Anomalies (e.g., a control's evidence
freshness exceeds 48 hours) trigger Slack alerts to #compliance-alerts. The
compliance dashboard (admin/operations/compliance) provides a real-time
view for the Compliance Operations team and the ARB. Annual report: the
Compliance Operations Lead presents the framework summary to the ARB and
CTO each January.
FUTURE EVOLUTION
Three evolutions are likely. First, the framework will be extended to cover the
EU AI Act (taking effect 2026), which requires AI-system risk assessments,
transparency, and human oversight — these will map to the existing
'governance' and 'audit' domains with new sub-controls. Second, the
framework may adopt continuous-audit technology (e.g., Hyperproof,
AuditBoard) to replace the annual external audit with continuous certification
— gated on the maturity of the automated evidence pipeline. Third, the
framework may be exposed to customers via a 'trust center' (e.g.,
trust.preone.com) where customers can self-serve compliance evidence (SOC 2
report, ISO 27001 certificate, control matrix) under NDA — gated on customer
demand and the security of the trust-center platform.
RELATED ADRS
● ADR-002 — Modular Monolith Strategy (compliance framework covers
the monolith's controls)
● ADR-041 — PostgreSQL Strategy (compliance evidence stored in
Postgres compliance schema)
● ADR-043 — Tenant Isolation (access-control control references tenant
isolation)
● ADR-053 — Data Retention (retention control references data retention
ADR)
● ADR-077 — Encryption (encryption control references encryption ADR)
● ADR-079 — PII Protection (data-subject-rights control references PII
protection)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 372

PreOne ADR - Volume 4: Security Architecture v3.0
● ADR-083 — Vulnerability Management (vuln-mgmt control references
vuln-mgmt ADR)
● ADR-086 — Audit Trail (audit control references audit-trail ADR)
● ADR-090 — Incident Response (incident-response control references IR
ADR)
REFERENCES
● Upstream PRD: PRD-007 (Security Requirements — compliance
section)
● Downstream ERD: ERD-088 (compliance.* schema)
● Downstream API Spec: API-088 (internal compliance dashboard
endpoints)
● Downstream Test Cases: TC-088 (control tests, evidence tests, audit
simulation)
● External: NIST Cybersecurity Framework v2.0
● External: ISO/IEC 27001:2022
● External: FERPA 34 CFR Part 99
● External: GDPR (Regulation (EU) 2016/679)
● External: India DPDP Act 2023
● External: COPPA 16 CFR Part 312
DECISION HISTORY
Date Status Actor Notes
2025-10-06 Draft Compliance Initial draft;
Operations Lead options
enumerated;
consultation with
security and
engineering teams
2025-11-22 Proposed Compliance Submitted to
Operations Lead Architecture
Review Board
after cross-team
review
2025-12-20 Accepted ARB Chair ARB approved;
published to
architecture
repository
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 373

PreOne ADR - Volume 4: Security Architecture v3.0
Date Status Actor Notes
2026-07-15 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
Architect Chief Architect
Tech Lead Compliance Operations Lead
ARB Chair ARB Chair
Approved On 2025-12-20
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● 12 control domains defined (NIST CSF-derived) (Done)
● Regulation mapping (FERPA/GDPR/DPDP/COPPA) (Done)
● Evidence-collection pipeline (Postgres + Splunk + AWS Config) (Done)
● Compliance Operations team hired (3 people) (Done)
● SOC 2 Type II audit completed (Done — Q2 2026)
● Auditor self-service tool deployed (Done)
● ISO 27001 pre-assessment (Planned — Q4 2026)
● ISO 27001 certification audit (Planned — Q1 2027)
AD R -089
Data Loss Prevention
Volume 4 — Security Architecture - Identity & Security
ACCEPTED
DECISION SUMMARY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 374

PreOne ADR - Volume 4: Security Architecture v3.0
DECISION
Adopt a layered Data Loss Prevention (DLP) strategy combining: (1) in-app
egress controls (field-level encryption of PII per ADR-079; row-level export
logging via ADR-086 audit trail); (2) email DLP via Google Workspace DLP
scanning outbound email for PII patterns (SSN, Aadhaar, student ID) with
quarantine for matches; (3) endpoint DLP via Jamf Pro configuration
profiles on managed MacBooks blocking USB mass storage and clipboard
copy of PII-classified fields; (4) SaaS DLP via CASB (Cloud Access Security
Broker) monitoring sanctioned SaaS apps (Slack, Notion, Google Drive) for
PII uploads. DLP findings route to Splunk and trigger Slack alerts to
#security-alerts for high-severity matches.
STATUS
Status Accepted
Date Decided 2026-01-08
Decision Owner Security Engineering Lead
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne processes regulated student data (PII: name, DOB, address, guardian
info, academic records, health info) across the application, email, endpoints,
and SaaS tools. Each egress channel is a potential data-loss vector. The 2025
audit identified DLP as a 'gap' — the legacy platform had no DLP controls
beyond the application's RBAC, leaving email, endpoint, and SaaS channels
unmonitored. The audit cited two 2024 incidents: (1) a teacher emailed a
student's report card (containing PII) to a personal Gmail account, detected 2
weeks later via a manual log review; (2) an engineer uploaded a production
data extract (containing 500 student records) to a personal Google Drive for
'debugging', detected when the engineer mentioned it in a Slack message.
Neither incident caused regulatory action (no evidence of misuse), but both
represented near-misses that DLP controls would have caught at the egress
point. PreOne's DLP strategy is layered because no single control covers all
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 375

PreOne ADR - Volume 4: Security Architecture v3.0
channels. In-app controls (RBAC, encryption, audit logging) prevent most
application-level egress but cannot prevent email, endpoint, or SaaS egress.
Email DLP catches outbound email containing PII; endpoint DLP catches USB
and clipboard egress; SaaS DLP catches uploads to sanctioned SaaS apps.
Unsancioned SaaS apps (personal Google Drive, Dropbox) are blocked at the
network layer (AWS Network Firewall egress filtering) per ADR-080. The DLP
strategy must balance security with employee productivity. Overly-aggressive
DLP (e.g., blocking all email with any name) would prevent legitimate business
communication. The strategy uses a 'detect and warn' model for most patterns,
with 'block and quarantine' reserved for high-confidence matches (e.g., 10+
Aadhaar numbers in a single email — almost certainly a data extract, not
legitimate communication).
BUSINESS DRIVERS
The primary driver is regulatory compliance. FERPA, GDPR, DPDP, and COPPA
all require 'reasonable' controls to prevent unauthorized disclosure of PII. DLP
is a standard 'reasonable' control; its absence would be a compliance finding.
The 2025 audit explicitly recommended DLP adoption as a priority-2 control. A
secondary driver is incident prevention. The 2024 near-misses (emailed report
card, Google Drive upload) could have caused regulatory action if misused; DLP
would have caught both at the egress point. The estimated cost-avoidance is
$200K per prevented incident (regulatory fine + customer notification +
reputational damage). A tertiary driver is customer trust. Enterprise
customers (state university systems) require DLP controls as a procurement
gate; the DLP strategy enables $3M+ in annual recurring revenue from these
customers. The DLP controls are documented in the customer-facing security
whitepaper. A quaternary driver is employee education. DLP 'detect and warn'
alerts (e.g., 'You are about to email a document containing Aadhaar numbers.
Are you sure?') educate employees on PII handling, reducing future incidents.
The 2024 incidents were caused by employees who did not understand the
sensitivity of the data they were handling; DLP alerts provide just-in-time
training.
PROBLEM STATEMENT
PreOne requires a layered DLP strategy covering application, email, endpoint,
and SaaS egress channels — with PII pattern detection, detect-and-warn for
low-confidence matches, block-and-quarantine for high-confidence matches,
and full audit logging — to prevent unauthorized disclosure of regulated
student data.
CONSTRAINTS
● DLP must cover application, email, endpoint, and SaaS egress channels
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 376

PreOne ADR - Volume 4: Security Architecture v3.0
● PII patterns must include: SSN, Aadhaar, PAN, passport, student ID,
email, phone, DOB, address
● Detect-and-warn for low-confidence matches (single PII instance in
business context)
● Block-and-quarantine for high-confidence matches (bulk PII, clear data
extracts)
● DLP findings must route to Splunk with full context (user, channel, PII
type, action taken)
● High-severity findings must trigger Slack alert to #security-alerts
within 5 minutes
● DLP must not block legitimate business communication (false-positive
rate <1%)
● Endpoint DLP must cover all managed MacBooks (Jamf Pro enrolled);
BYOD is out of scope
ASSUMPTIONS
● Google Workspace DLP covers >= 95% of outbound email (PreOne
uses Google Workspace)
● Jamf Pro configuration profiles can block USB mass storage and
clipboard PII copy without disrupting legitimate use
● CASB integration with Slack, Notion, and Google Drive covers >= 90%
of sanctioned SaaS usage
● PII pattern detection (regex + ML) has <1% false-positive rate for the
defined patterns
● Employees will accept DLP 'detect and warn' alerts as constructive, not
adversarial
● Network Firewall egress filtering (blocking unsanctioned SaaS) is
enforceable on the corporate network
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 377

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option              | Pros                | Cons                  | Verdict |
| ------------------- | ------------------- | --------------------- | ------- |
| Layered DLP: in-    | Comprehensive       | Four DLP              | Adopted |
| app + Google        | coverage of all     | technologies to       |         |
| Workspace DLP       | egress channels;    | manage; potential     |         |
| (email) + Jamf Pro  | each layer is best- | for alert fatigue if  |         |
| (endpoint) +        | of-breed;           | false-positive rate   |         |
| CASB (SaaS) +       | integrates with     | exceeds 1%; CASB      |         |
| Network Firewall    | existing tooling    | cost ($30K/year);     |         |
| (unsanctioned       | (Google             | requires dedicated    |         |
| SaaS).              | Workspace, Jamf,    | DLP engineer (0.5     |         |
|                     | AWS Network         | FTE).                 |         |
Firewall); detect-
and-warn balances
security and
productivity.
| Single-vendor DLP  | Single vendor;      | Symantec/McAfee       | Rejected |
| ------------------ | ------------------- | --------------------- | -------- |
| suite (e.g.,       | unified policy and  | DLP is heavy-         |          |
| Symantec,          | reporting; one      | weight (endpoint      |          |
| McAfee,            | integration point.  | agent is intrusive);  |          |
| Forcepoint)        |                     | does not integrate    |          |
| covering all       |                     | well with Google      |          |
| channels.          |                     | Workspace             |          |
(PreOne's email
platform); cost
($100K+/year);
legacy
architecture (on-
prem console);
poor employee
experience.
| Application-only   | Lowest cost (in-   | Misses email,    | Rejected |
| ------------------ | ------------------ | ---------------- | -------- |
| DLP (in-app        | app controls       | endpoint, SaaS   |          |
| controls only; no  | already exist per  | egress (the      |          |
| email/endpoint/Sa  | ADR-079); no new   | channels of the  |          |
| aS DLP).           | tooling.           | 2024 near-       |          |
misses); fails the
2025 audit
recommendation;
unacceptable risk
for a regulated
education
platform.
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  378

PreOne ADR - Volume 4: Security Architecture v3.0
Option Pros Cons Verdict
Outsource DLP to Minimal internal Cost Rejected
a managed service effort; pre-built ($80K+/year); loss
(e.g., Zscaler, DLP policies; of control over
Netskope). managed SLAs. policy tuning;
Zscaler/Netskope
are full SSE
platforms (overkill
for DLP-only);
auditors prefer in-
house DLP for
regulated data.
DECISION
ADOPTED
Adopt a layered DLP strategy with four egress controls. (1) In-app: field-
level encryption (ADR-079), RBAC (ADR-063), audit logging (ADR-086) —
existing controls. (2) Email: Google Workspace DLP scanning outbound
email for PII patterns (SSN, Aadhaar, PAN, passport, student ID, bulk
email/phone), with detect-and-warn for low-confidence matches and block-
and-quarantine for high-confidence matches (10+ PII instances). (3)
Endpoint: Jamf Pro configuration profiles on managed MacBooks blocking
USB mass storage and clipboard copy of PII-classified fields (via Data Loss
Prevention API on macOS). (4) SaaS: CASB (Microsoft Defender for Cloud
Apps) monitoring Slack, Notion, and Google Drive for PII uploads, with
detect-and-warn and block-quarantine parallel to email DLP. Unsancioned
SaaS blocked at network layer (AWS Network Firewall egress filtering).
DLP findings route to Splunk; high-severity findings trigger Slack alerts to
#security-alerts within 5 minutes. A 0.5 FTE DLP engineer owns policy
tuning and false-positive reduction.
DETAILED RATIONALE
The layered approach was chosen because no single DLP technology covers all
egress channels effectively. Google Workspace DLP is the best email DLP for
PreOne (which uses Google Workspace) — native integration, no separate
agent, accurate PII detection. Jamf Pro is the de facto standard for macOS
endpoint management; its configuration profiles can block USB mass storage
and (with the macOS Data Loss Prevention API, available in macOS 14+)
clipboard copy of PII fields. Microsoft Defender for Cloud Apps (CASB)
integrates with Slack, Notion, and Google Drive via APIs, monitoring file
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 379

PreOne ADR - Volume 4: Security Architecture v3.0
uploads for PII patterns. AWS Network Firewall blocks unsanctioned SaaS
(personal Google Drive, Dropbox) at the network layer — defense-in-depth,
since the CASB cannot monitor unsanctioned apps. The single-vendor option
(Symantec, McAfee) was rejected because the endpoint agents are intrusive
(high CPU, frequent false positives on legitimate activity) and the email DLP
does not integrate well with Google Workspace (Symantec expects on-prem
Exchange or Microsoft 365). The cost ($100K+/year) is also significantly higher
than the layered approach ($30K CASB + existing Google Workspace / Jamf
licenses). The legacy architecture (on-prem console, manual policy updates) is
incompatible with PreOne's API-driven operations. The application-only option
was rejected because the 2024 near-misses were email and SaaS egress, not
application egress. The application's RBAC, encryption, and audit logging
prevent most application-level egress (an attacker with stolen credentials
cannot bulk-export student records without triggering audit alerts), but email
and SaaS egress are not covered by application controls. A teacher with
legitimate application access can email a report card; an engineer with
legitimate production access can upload a data extract to Google Drive. Only
email and SaaS DLP catch these channels. The managed-service option
(Zscaler, Netskope) was rejected because the SSE platforms are overkill for
DLP-only (they include SWG, CASB, ZTNA, etc.); PreOne already has WAF
(ADR-084), Shield (ADR-085), and CASB (this ADR) — adding Zsceler would
duplicate controls. The cost ($80K+/year) and loss of policy-tuning control also
disqualify it. The detect-and-warn vs block-and-quarantine distinction is the
critical UX decision. Detect-and-warn (for low-confidence matches — single PII
instance in business context) shows the user a warning ('You are about to email
a document containing an Aadhaar number. Are you sure?') and allows them to
proceed with a logged reason. Block-and-quarantine (for high-confidence
matches — 10+ PII instances, clear data extracts) blocks the email and
quarantines it for security team review. This balances security (block clear data
extracts) with productivity (allow legitimate communication containing single
PII instances, like a teacher emailing a parent about their child). The threshold
(10+ instances) was calibrated against historical email volume — the 2024
near-miss (emailed report card) would have been detect-and-warn (single
student's PII), not block-quarantine; the 500-record extract (had it been
emailed) would have been block-quarantine. The 0.5 FTE DLP engineer is the
operational backbone. DLP policies require continuous tuning — new PII
patterns, false-positive reduction, new SaaS apps. Without a dedicated owner,
DLP policies drift and become either too permissive (missing real incidents) or
too restrictive (blocking legitimate work). The DLP engineer also triages high-
severity findings (block-and-quarantine events), deciding whether to release
the email/file or escalate to incident response (ADR-090). The Splunk
integration is the audit-evidence backbone. Every DLP finding — detect-and-
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 380

PreOne ADR - Volume 4: Security Architecture v3.0
warn, block-and-quarantine, false-positive dismissal — is logged to Splunk with
full context (user, channel, PII type, action taken, dismissal reason). Auditors
can query Splunk for 'all DLP findings in Q3 2026 involving Aadhaar numbers'
and get a complete answer in seconds. This audit trail is the difference between
a smooth compliance review and a multi-week evidence-gathering exercise.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | PreOne Layered DLP
Architecture | +------------------------------------------------------------------+ |
| | Egress Channels: | |
| | Channel 1: Application Egress | | +-------------------+
| | | In-App Controls | - RBAC (ADR-063) | | | (existing) | -
Field encryption (ADR-079) | | +---------+---------+ - Audit logging
(ADR-086) | | | | | v
| | +-------------------+ | | | Splunk | (DLP findings)
| | +-------------------+ | |
| | Channel 2: Email Egress | | +-------------------+
| | | Google Workspace | - PII pattern scan | | | DLP | -
detect-and-warn (1+ PII) | | +---------+---------+ - block-quarantine (10+
PII) | | | | | v
| | +-------------------+ | | | Splunk |
| | +-------------------+ | |
| | Channel 3: Endpoint Egress | | +-------------------+
| | | Jamf Pro | - USB mass storage block | | | (managed
MacBooks)| - clipboard PII copy block | | +---------+---------+
| | | | | v
| | +-------------------+ | | | Splunk |
| | +-------------------+ | |
| | Channel 4: SaaS Egress | | +-------------------+
| | | CASB | - Slack, Notion, Google Drive | | | (MS Defender for |
- PII upload scan | | | Cloud Apps) | - detect-and-warn / block-
quarantine | | +---------+---------+ | | |
| | v | | +-------------------+
| | | Splunk | | | +-------------------+
| | | | Network Layer:
| | AWS Network Firewall blocks unsanctioned SaaS | |
| | Alerts: | | High-severity -> #security-alerts
Slack (5-min SLA) | +------------------------------------------------------------------+
SEQUENCE DIAGRAM
Employee -> Gmail: compose email with attachment Gmail -> Google Workspace
DLP: scan outbound Google Workspace DLP -> DLP Engine: match PII patterns
alt no PII DLP Engine -> Gmail: allow Gmail -> Recipient: deliver else low-
confidence (1+ PII) DLP Engine -> Employee: warn ('contains Aadhaar; send?')
Employee -> DLP Engine: confirm / cancel DLP Engine -> Splunk: log (detect-
and-warn) alt confirm Gmail -> Recipient: deliver end else high-confidence
(10+ PII) DLP Engine -> Gmail: block + quarantine DLP Engine -> Security
Team: review notification DLP Engine -> Splunk: log (block-quarantine)
Security Team -> DLP Engine: release / escalate end Employee -> Slack: upload
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 381

PreOne ADR - Volume 4: Security Architecture v3.0
file Slack -> CASB: scan (API integration) CASB -> DLP Engine: match PII DLP
Engine -> Splunk: log alt high-confidence DLP Engine -> #security-alerts:
Slack alert CASB -> Slack: block upload end
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-089 — Data Loss Prevention
- Component View | +-------------------------------------------------------------+ |
| | Channel 1: Application Egress | | +----------------+
+----------------------+ | | | In-App Controls| RBAC | ADR-063/079/086 |
| | +----------------+ +----------------------+ | |
| | Channel 2: Email Egress | | +----------------+
+----------------------+ | | | Google Workspace| scan | DLP Engine (PII |
| | | (outbound) |------->| patterns) | | | +----------------+ +----------
+-----------+ | | | warn / block | |
v | | Channel 3: Endpoint Egress | | +----------------
+ +----------------------+ | | | Jamf Pro | block | USB + clipboard |
| | +----------------+ +----------------------+ | |
| | Channel 4: SaaS Egress | | +----------------+
+----------------------+ | | | CASB | scan | Slack/Notion/Drive | | |
+----------------+ +----------------------+ | |
| | All findings -> Splunk -> #security-alerts (high-sev) |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Data Flow: Producer -> App Service -> Security Component -> Audit Security
Component -> Splunk (logs) Security Component -> Alert (if anomaly) Read
Flow: Consumer -> App Service -> Security Component -> allow/deny
DATABASE IMPACT
DLP has minimal direct database impact. DLP findings are stored in Splunk (not
Postgres). A materialised view (security.dlp_summary, from ADR-083) includes
DLP finding counts for the security scorecard. The DLP engineer's policy
configuration is stored in Git (compliance-dlp-policies repository). The CASB's
API integration with Slack/Notion/Google Drive is read-only (the CASB
monitors but does not modify business data). No business-schema changes are
required.
API IMPACT
No public API changes. The admin API exposes GET /admin/dlp-findings with
filters (channel, PII type, action, date range). The admin API is RBAC-controlled
(admin or security role only). A separate endpoint (GET /admin/dlp-policies)
surfaces the current DLP policy configuration for audit. The DLP engineer uses
a CI/CD pipeline (GitHub Actions) to deploy policy changes from Git to Google
Workspace, Jamf Pro, and CASB — no console-only changes.
UI IMPACT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 382

PreOne ADR - Volume 4: Security Architecture v3.0
The UI surface for this ADR is minimal — the decision is primarily a security-
layer concern. Where the decision affects the user experience, it is through
indirect mechanisms (authentication flow, authorization visibility,
performance, latency) rather than direct UI elements. The admin UI may
include a read-only status page showing the relevant security configuration or
health metrics for SRE visibility; end-user-facing changes are limited to
incidental security or reliability improvements.
SECURITY IMPACT
DLP is a critical security control for a regulated-data platform. It provides: (1)
PII egress detection across all channels; (2) block-and-quarantine for clear data
extracts; (3) audit trail for compliance evidence; (4) just-in-time employee
education via detect-and-warn alerts. The 2025 audit cited DLP as a priority-2
gap; this ADR closes the gap. The 2024 near-misses (emailed report card,
Google Drive upload) would have been caught by DLP — the estimated cost-
avoidance is $200K per prevented incident.
PERFORMANCE IMPACT
DLP has minimal performance impact. Email DLP adds <1 second to outbound
email delivery (Google Workspace's native DLP is highly optimised). Endpoint
DLP (USB block, clipboard monitoring) adds negligible CPU (<1% on managed
MacBooks). SaaS DLP (CASB API integration) does not affect application
performance (the CASB queries Slack/Notion/Google Drive APIs
asynchronously). The Splunk integration is asynchronous and does not affect
egress latency. No customer-visible performance impact.
SCALABILITY ANALYSIS
DLP scales linearly with employee count and egress volume. At 200 employees
(current), Google Workspace DLP handles 5K outbound emails/day with no
performance impact. Jamf Pro scales to 10K+ managed MacBooks (PreOne's
projected 2028 headcount is 400). CASB scales with SaaS usage (Slack
messages, Notion pages, Google Drive uploads); the current volume (50K
events/day) is well within CASB capacity. The 0.5 FTE DLP engineer is
sufficient through 500 employees; beyond that, a second DLP engineer may be
needed for policy tuning. Splunk ingestion (2GB/day DLP findings) is well
within the Splunk license.
OPERATIONAL CONSIDERATIONS
The 0.5 FTE DLP engineer owns the DLP program. The engineer's
responsibilities: (a) policy tuning (weekly review of top false positives); (b) high-
severity finding triage (block-and-quarantine events, 5-minute SLA for review);
(c) new PII pattern onboarding (as new data types are added); (d) quarterly DLP
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 383

PreOne ADR  -  Volume 4: Security Architecture  v3.0
effectiveness review (finding trends, false-positive rate, employee training
opportunities). The engineer monitors a #dlp-alerts Slack channel where high-
severity findings post automatically. The monthly security scorecard tracks: (a)
DLP finding count by channel and severity; (b) false-positive rate (target: <1%);
(c) block-and-quarantine review time (target: <5 minutes); (d) employee
training opportunities (recurring detect-and-warn recipients).
RISKS
| Risk               | Likelihood | Impact | Mitigation           |
| ------------------ | ---------- | ------ | -------------------- |
| False-positive     | Medium     | Medium | 5-minute review      |
| block-and-         |            |        | SLA; one-click       |
| quarantine         |            |        | release with         |
| disrupts           |            |        | logged reason;       |
| legitimate         |            |        | weekly false-        |
| business           |            |        | positive review      |
| communication      |            |        | and policy tuning    |
| DLP agent (Jamf    | Low        | Medium | Profile tested in    |
| Pro configuration  |            |        | pilot group before   |
| profile) causes    |            |        | fleet-wide rollout;  |
| endpoint           |            |        | Jamf Pro's native    |
| performance        |            |        | performance          |
| issues             |            |        | monitoring;          |
rollback within 1
hour via Jamf Pro
console
| CASB API          | Medium | Low | CASB vendor    |
| ----------------- | ------ | --- | -------------- |
| integration with  |        |     | (Microsoft)    |
| SaaS apps breaks  |        |     | maintains API  |
| (SaaS API change) |        |     | integration;   |
weekly
integration-health
check; fallback to
SaaS-native audit
logging (Slack
audit logs, Notion
admin logs)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  384

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation        |
| ------------------- | ---------- | ------ | ----------------- |
| Employee            | Medium     | Medium | Detect-and-warn   |
| bypasses DLP        |            |        | for screenshots   |
| (e.g., screenshots  |            |        | (macOS DLP API);  |
| PII, photos screen  |            |        | accept residual   |
| with phone)         |            |        | risk for phone-   |
photos
(unenforceable);
employee training
on DLP rationale;
audit trail detects
unusual access
patterns
| New egress          | Medium | Medium | SaaS adoption      |
| ------------------- | ------ | ------ | ------------------ |
| channel not         |        |        | policy requires    |
| covered (e.g., new  |        |        | DLP onboarding;    |
| SaaS app adopted    |        |        | quarterly SaaS     |
| without DLP         |        |        | inventory review;  |
| onboarding)         |        |        | unsanctioned       |
SaaS blocked at
network layer
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Comprehensive coverage across all  Four DLP technologies to manage
| egress channels |     | (operational complexity) |     |
| --------------- | --- | ------------------------ | --- |
Detect-and-warn balances security with  Some false-positive alerts (target <1%)
productivity
Block-and-quarantine for clear data  5-minute review SLA requires on-call
| extracts |     | DLP engineer |     |
| -------- | --- | ------------ | --- |
Splunk audit trail for compliance  Splunk ingestion cost (~$1K/month for
| evidence |     | DLP findings) |     |
| -------- | --- | ------------- | --- |
Just-in-time employee education via  Alert fatigue if false-positive rate
| alerts |     | exceeds 1% |     |
| ------ | --- | ---------- | --- |
REJECTED ALTERNATIVES
The single-vendor DLP suite (Symantec, McAfee) was piloted in Q4 2025. The
pilot found the endpoint agent consumed 8% CPU on managed MacBooks (vs
<1% for Jamf Pro configuration profiles), and the email DLP required a
separate mail relay (incompatible with Google Workspace native email). The
cost ($100K+/year) was 3x the layered approach. The application-only option
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  385

PreOne ADR - Volume 4: Security Architecture v3.0
was rejected because the 2024 near-misses were email and SaaS egress, not
application egress — in-app controls would not have caught them. The
managed-service option (Zscaler, Netskope) was rejected because the SSE
platforms duplicate existing controls (WAF, Shield, CASB) at higher cost. The
layered approach was the only option that satisfied all requirements:
comprehensive coverage, low operational burden, acceptable cost, and minimal
employee friction.
MIGRATION PLAN
Phase 1 (Q4 2025, complete): In-app controls verified (ADR-079 encryption,
ADR-086 audit). Phase 2 (Q1 2026, complete): Google Workspace DLP deployed
with initial PII patterns (SSN, Aadhaar, PAN, passport). Phase 3 (Q1 2026,
complete): Jamf Pro configuration profiles deployed to pilot group (50
MacBooks); 2-week pilot, no performance issues. Phase 4 (Q2 2026, complete):
Jamf Pro profiles deployed to all managed MacBooks. Phase 5 (Q2 2026,
complete): CASB (Microsoft Defender for Cloud Apps) integrated with Slack,
Notion, Google Drive. Phase 6 (Q3 2026, complete): AWS Network Firewall
egress filtering for unsanctioned SaaS. Phase 7 (ongoing): DLP policy tuning
(weekly); new PII pattern onboarding (as needed).
TESTING STRATEGY
DLP is tested via synthetic PII egress. Each DLP layer has a test scenario: (1)
Email DLP: send a test email containing synthetic Aadhaar numbers (clearly
marked as test data) and verify detect-and-warn or block-and-quarantine
triggers. (2) Endpoint DLP: attempt to copy a synthetic PII file to USB and verify
block. (3) SaaS DLP: upload a synthetic PII file to Slack and verify CASB
detection. The synthetic tests run weekly and catch policy regressions (e.g., a
pattern update that stops matching Aadhaar numbers). Quarterly, the DLP
engineer performs a manual review of 10 random findings per channel to verify
accuracy. Annually, a red-team exercise (ADR-087) tests DLP bypass attempts.
MONITORING & OBSERVABILITY
Splunk dashboards track: (a) DLP findings per week by channel and severity;
(b) false-positive rate per channel (target: <1%); (c) block-and-quarantine
review time (target: <5 minutes); (d) detect-and-warn recipient trends
(recurring recipients indicate training opportunity); (e) policy effectiveness
(findings caught per policy rule). Anomalies (e.g., a 10x spike in block-and-
quarantine events) trigger Slack alerts to #dlp-alerts. The DLP dashboard
(admin/operations/security/dlp) provides a real-time view for the DLP engineer
and the Security Engineering Lead.
FUTURE EVOLUTION
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 386

PreOne ADR - Volume 4: Security Architecture v3.0
Three evolutions are likely. First, DLP may be extended to cover AI/ML egress
(e.g., employees pasting PII into ChatGPT or other LLMs) — currently blocked
at the network layer, but finer-grained controls (e.g., browser extension that
warns on PII paste) may be added. Second, DLP may adopt ML-based PII
detection (beyond regex patterns) for unstructured data — useful for free-text
fields that contain PII without matching a pattern. Third, DLP may be exposed
to customers (tenants) via a self-service 'data egress report' API, enabling
schools to audit their own data egress — gated on customer demand.
RELATED ADRS
● ADR-043 — Tenant Isolation (in-app DLP complements tenant isolation)
● ADR-063 — Authorization (RBAC is the first layer of in-app DLP)
● ADR-077 — Encryption (encryption-at-rest reduces DLP incident
impact)
● ADR-079 — PII Protection (field-level encryption is in-app DLP)
● ADR-080 — Rate Limiting (network-layer DLP via egress filtering)
● ADR-083 — Vulnerability Management (DLP findings feed the unified
findings registry)
● ADR-086 — Audit Trail (DLP findings logged to audit trail)
● ADR-087 — Penetration Testing Program (pentests include DLP bypass
attempts)
● ADR-088 — Compliance Framework (DLP is a required control for
FERPA/GDPR/DPDP/COPPA)
● ADR-090 — Incident Response (DLP high-severity findings may trigger
IR)
REFERENCES
● Upstream PRD: PRD-007 (Security Requirements — DLP section)
● Downstream ERD: ERD-089 (security.dlp_summary materialised view)
● Downstream API Spec: API-089 (internal DLP dashboard endpoints)
● Downstream Test Cases: TC-089 (synthetic PII egress tests per
channel)
● External: Google Workspace DLP Documentation
● External: Jamf Pro Data Loss Prevention Documentation
● External: Microsoft Defender for Cloud Apps Documentation
● External: NIST SP 800-137 (Information Security Continuous
Monitoring)
DECISION HISTORY
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 387

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Date       | Status | Actor            | Notes           |
| ---------- | ------ | ---------------- | --------------- |
| 2025-10-25 | Draft  | Security         | Initial draft;  |
|            |        | Engineering Lead | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-12-11 | Proposed | Security         | Submitted to  |
| ---------- | -------- | ---------------- | ------------- |
|            |          | Engineering Lead | Architecture  |
Review Board
after cross-team
review
| 2026-01-08 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect           |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Security Engineering Lead |     |
| ARB Chair   |     | ARB Chair                 |     |
| Approved On |     | 2026-01-08                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
AD R -090
Incident Response
Volume 4 — Security Architecture  -  Identity & Security
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  388

PreOne ADR - Volume 4: Security Architecture v3.0
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a NIST SP 800-61-aligned Incident Response plan with 4 phases
(Preparation, Detection & Analysis, Containment Eradication & Recovery,
Post-Incident Activity). The plan defines 4 severity levels (SEV-1 critical,
SEV-2 high, SEV-3 medium, SEV-4 low) with escalation matrices, response
SLAs (SEV-1: 15-minute ack, 1-hour containment; SEV-2: 1-hour ack, 4-hour
containment), and a dedicated Incident Commander role. The plan is tested
via quarterly tabletop exercises and an annual full-scale simulation. All
incidents are logged in a Splunk-backed incident registry; post-mortems are
published within 5 business days. Regulatory notification timelines (GDPR
72hr, DPDP 72hr, FERPA 24hr) are enforced via automated alerts.
STATUS
Status Accepted
Date Decided 2026-01-15
Decision Owner Security Engineering Lead
Review Cadence Annual review, or on regulatory
update, or after each major incident
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne processes regulated student data across multiple jurisdictions. A
security incident (data breach, unauthorized access, service outage) triggers
regulatory notification obligations with strict timelines: GDPR requires
notification to the supervisory authority within 72 hours of becoming aware;
DPDP requires notification to the Data Protection Board within 72 hours;
FERPA requires 'reasonable' notification (interpreted by PreOne's counsel as
24 hours to affected individuals). Missing these timelines triggers regulatory
fines (GDPR: up to 4% of global revenue; DPDP: up to INR 250 crore). The
legacy platform had an ad-hoc incident response process: the on-call engineer
would page the Security Engineering Lead, who would assemble a team ad-hoc.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 389

PreOne ADR - Volume 4: Security Architecture v3.0
The 2024 Google Drive upload incident (from ADR-089) took 4 hours to
acknowledge and 12 hours to contain — well within regulatory timelines, but
the ad-hoc process produced no post-mortem, no remediation tracking, and no
lessons-learned dissemination. The 2025 audit cited IR as a 'mature but
undocumented' area and recommended formalisation per NIST SP 800-61.
PreOne's threat model identifies the most likely incident types as: (1)
unauthorized data access (insider threat or compromised credentials); (2) data
exfiltration (DLP bypass); (3) ransomware / destructive attack; (4) availability
attack (DDoS, misconfiguration); (5) third-party breach (vendor compromise).
Each type has a specific response playbook. The IR plan must cover all 5 types
with role clarity, communication templates, and regulatory-notification
workflows. The IR plan is operated by a rotating Incident Commander role
(filled by senior engineers trained in IR) with the Security Engineering Lead as
escalation. The plan is tested quarterly via tabletop exercises (1-hour scenario
discussions) and annually via a full-scale simulation (4-hour live exercise with
simulated attack, containment, and post-mortem). Testing is critical because an
untested plan degrades rapidly — engineers forget roles, runbooks drift from
reality, and tooling changes break workflows.
BUSINESS DRIVERS
The primary driver is regulatory compliance. GDPR, DPDP, and FERPA all
require incident response capabilities with documented plans and notification
timelines. The IR plan is the canonical evidence for compliance audits
(ADR-088); its absence would be a compliance finding. The 2025 audit
recommended IR formalisation as a priority-1 control. A secondary driver is
incident-cost reduction. The 2024 Google Drive incident cost $50K
(engineering time, customer communication, audit); a formal IR plan with
automated workflows would have reduced this to $15K. Industry research (IBM
Cost of a Data Breach Report 2025) shows that organisations with formal IR
plans and testing have 50% lower breach costs than those without. A tertiary
driver is customer trust. Enterprise customers (state university systems)
require an IR plan as a procurement gate; the plan is documented in the
customer-facing security whitepaper. Post-incident, customers expect timely
notification (per contractual SLAs) and a post-mortem — the IR plan ensures
consistent delivery. A quaternary driver is employee confidence. Engineers
who know there is a tested IR plan are more likely to report incidents early
(rather than hide them out of fear), reducing time-to-detection. The 2024
incident was reported by the engineer who uploaded the data — an example of
healthy incident-reporting culture that the IR plan reinforces.
PROBLEM STATEMENT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 390

PreOne ADR - Volume 4: Security Architecture v3.0
PreOne requires a formal Incident Response plan aligned with NIST SP 800-61
that defines severity levels, escalation matrices, response SLAs, role clarity
(Incident Commander), playbooks per incident type, regulatory-notification
workflows (GDPR 72hr, DPDP 72hr, FERPA 24hr), and is tested via quarterly
tabletop exercises and annual full-scale simulation.
CONSTRAINTS
● Plan must align with NIST SP 800-61 (4 phases: Preparation, Detection
& Analysis, Containment/Eradication/Recovery, Post-Incident Activity)
● 4 severity levels (SEV-1 to SEV-4) with documented escalation matrices
● Response SLAs: SEV-1 ack 15min, containment 1hr; SEV-2 ack 1hr,
containment 4hr; SEV-3 ack 4hr, containment 24hr; SEV-4 ack 1
business day
● Incident Commander role (rotating senior engineer); Security
Engineering Lead as escalation
● Playbooks for 5 incident types: unauthorized access, data exfiltration,
ransomware, availability attack, third-party breach
● Regulatory notification: GDPR 72hr, DPDP 72hr, FERPA 24hr
(automated alerts at 50% and 90% of deadline)
● Post-mortem published within 5 business days of incident closure
● Quarterly tabletop exercise (1hr); annual full-scale simulation (4hr)
ASSUMPTIONS
● NIST SP 800-61 is the appropriate framework (industry-standard;
auditor-recognised)
● Senior engineers can fill the Incident Commander role with 4 hours of
training
● Quarterly tabletop + annual simulation is sufficient to maintain
readiness
● Splunk can serve as the incident registry (single source of truth for all
incidents)
● Regulatory notification timelines will remain stable (GDPR 72hr, DPDP
72hr, FERPA 24hr)
● Post-mortems will be published transparently (no blame-game culture)
OPTIONS CONSIDERED
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 391

PreOne ADR  -  Volume 4: Security Architecture  v3.0
| Option              | Pros                  | Cons                | Verdict |
| ------------------- | --------------------- | ------------------- | ------- |
| NIST SP 800-61-     | Industry-standard     | Requires 4 hours    | Adopted |
| aligned IR plan     | framework;            | of training per     |         |
| with 4 severity     | auditor-              | senior engineer     |         |
| levels, dedicated   | recognised; tested    | (Incident           |         |
| Incident            | via exercises; role   | Commander           |         |
| Commander role,     | clarity; automated    | qualification);     |         |
| quarterly tabletop  | regulatory-           | quarterly tabletop  |         |
| + annual            | notification alerts;  | consumes 1          |         |
| simulation.         | transparent post-     | engineering-hour    |         |
|                     | mortems.              | per senior          |         |
engineer; annual
simulation
consumes 4
engineering-hours
per participant.
ISO 27035-aligned  International  Less prescriptive  Rejected
| IR plan         | standard; aligns  | than NIST SP 800-  |     |
| --------------- | ----------------- | ------------------ | --- |
| (international  | with ISO 27001    | 61 (no severity-   |     |
| standard for    | certification     | level SLAs); less  |     |
| incident        | (ADR-088).        | recognised in the  |     |
| management).    |                   | US (where          |     |
PreOne's primary
market is);
training materials
less available.
| Outsource IR to a  | Expert IR team     | Cost                 | Rejected |
| ------------------ | ------------------ | -------------------- | -------- |
| managed service    | on-demand; no      | ($100K+/year         |          |
| (e.g., Mandiant,   | internal training  | retainer + $50K      |          |
| CrowdStrike).      | required; vendor   | per incident); loss  |          |
|                    | SLAs.              | of internal IR       |          |
capability; vendor
may not be
available during a
major incident
(industry-wide);
internal team
lacks IR skills
(organisational
risk).
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  392

PreOne ADR - Volume 4: Security Architecture v3.0
Option Pros Cons Verdict
Continue ad-hoc Zero upfront cost; Fails regulatory Rejected
IR (no formal no training compliance
plan). overhead. (FERPA, GDPR,
DPDP require
documented IR);
2025 audit
explicitly rejected
this; ad-hoc
process produced
no post-mortem
for the 2024
incident (lessons
lost); customer
procurement
failure.
DECISION
ADOPTED
Adopt a NIST SP 800-61-aligned Incident Response plan with 4 phases
(Preparation, Detection & Analysis, Containment/Eradication/Recovery,
Post-Incident Activity) and 4 severity levels (SEV-1 critical, SEV-2 high,
SEV-3 medium, SEV-4 low). The plan defines an Incident Commander role
(rotating senior engineers with 4 hours of IR training; Security Engineering
Lead as escalation) with documented escalation matrices. Response SLAs:
SEV-1 ack 15min/containment 1hr; SEV-2 ack 1hr/containment 4hr; SEV-3
ack 4hr/containment 24hr; SEV-4 ack 1 business day. Playbooks exist for 5
incident types: unauthorized access, data exfiltration, ransomware,
availability attack, third-party breach. Regulatory notification timelines
(GDPR 72hr, DPDP 72hr, FERPA 24hr) are enforced via automated Splunk
alerts at 50% and 90% of deadline. All incidents logged in Splunk-backed
incident registry; post-mortems published within 5 business days. Quarterly
tabletop exercise (1hr); annual full-scale simulation (4hr).
DETAILED RATIONALE
NIST SP 800-61 was chosen as the framework because it is the industry
standard for IT incident response, recognised by US auditors (FERPA, COPPA)
and accepted internationally (GDPR, DPDP). The 4-phase structure
(Preparation, Detection & Analysis, Containment/Eradication/Recovery, Post-
Incident Activity) is intuitive and maps cleanly to PreOne's incident lifecycle.
The framework is prescriptive enough to guide action but flexible enough to
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 393

PreOne ADR - Volume 4: Security Architecture v3.0
adapt to PreOne's specific needs. ISO 27035 was considered for alignment with
the ISO 27001 certification (ADR-088). However, ISO 27035 is less prescriptive
than NIST SP 800-61 (no severity-level SLAs, no role definitions) and less
recognised in the US market. The NIST framework is sufficient for ISO 27001
audit purposes (the ISO 27001 auditor accepts NIST SP 800-61 as a 'recognized
incident management framework'). The managed-service option (Mandiant,
CrowdStrike) was attractive for expertise on-demand but was rejected for three
reasons. First, cost: the retainer ($100K+/year) plus per-incident fees ($50K)
exceed the cost of building internal capability (4 hours of training per senior
engineer × 10 engineers = 40 hours = ~$4K). Second, availability: during a
major industry-wide incident (e.g., SolarWinds), managed services are
overwhelmed and may not be available. Third, organisational risk: outsourcing
IR means the internal team never develops IR skills, creating a permanent
dependency. PreOne retains a Mandiant retainer for catastrophic incidents
(SEV-1 with unclear scope) as a backup, but the primary IR capability is
internal. The ad-hoc option was the legacy process and was documented in the
2025 audit as inadequate. The 2024 Google Drive incident produced no post-
mortem, no remediation tracking, and no lessons-learned — the same mistake
could be repeated. The audit recommended formalisation as a priority-1
control. The 4 severity levels were calibrated against industry benchmarks
(Google SRE Book, AWS Incident Response). SEV-1 (critical) is a customer-
impacting outage or confirmed data breach; SEV-2 (high) is a likely data breach
or severe degradation; SEV-3 (medium) is a contained incident with limited
impact; SEV-4 (low) is a near-miss or policy violation with no impact. The SLAs
(SEV-1 ack 15min, containment 1hr) are aggressive but achievable — the 2024
incident was acknowledged in 4 hours and contained in 12 hours (SEV-2); the
new SLA would have required 1-hour ack and 4-hour containment, forcing
faster escalation. The Incident Commander role is the critical design choice.
Without a single accountable commander, incidents devolve into committee
discussions. The IC is a rotating role (weekly rotation) filled by senior engineers
who have completed 4 hours of IR training (NIST SP 800-61 fundamentals,
PreOne-specific playbooks, communication templates). The IC's authority
during an incident is absolute — they can override normal change-management
to contain the incident (e.g., disable a compromised account, block an IP). The
Security Engineering Lead is the escalation for SEV-1 incidents or when the IC
needs guidance. The playbooks per incident type are the operational backbone.
Each playbook is a runbook (in Notion) with: (1) detection signals (Splunk
queries, alert thresholds); (2) initial triage steps (verify the signal, assess
scope); (3) containment actions (specific steps per incident type); (4)
eradication steps (root-cause removal); (5) recovery steps (restore service,
verify integrity); (6) communication templates (internal, customer, regulatory).
The playbooks are reviewed annually and updated after each incident based on
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 394

PreOne ADR - Volume 4: Security Architecture v3.0
lessons learned. The regulatory-notification workflows are automated via
Splunk. When an incident is declared with a 'data breach' or 'unauthorized
access' classification, Splunk starts timers for GDPR (72hr), DPDP (72hr), and
FERPA (24hr). Alerts fire at 50% (36hr/36hr/12hr) and 90% (64hr/64hr/21hr) of
each deadline, ensuring the Compliance Operations team (ADR-088) has time
to prepare and submit notifications. The notifications themselves are manual
(drafted by Compliance Ops, approved by Legal, submitted by the CTO) but the
deadline tracking is automated. The quarterly tabletop exercise is the
readiness backbone. Each exercise simulates a specific incident type (rotating
through the 5 types over 5 quarters). The exercise is a 1-hour discussion: the
facilitator presents a scenario ('a DLP alert fired: 500 student records uploaded
to a personal Google Drive'), and the IC walks through the response (detection,
triage, containment, communication). The exercise surfaces gaps (e.g., 'who is
the GDPR notification contact during Indian business hours?') that are
remediated before a real incident. The annual full-scale simulation is a 4-hour
live exercise with a simulated attack (red-team), real containment (blue-team),
and real post-mortem — the closest thing to a real incident without the impact.
The post-mortem culture is the cultural backbone. Post-mortems are published
within 5 business days of incident closure, are blameless (focus on systemic
causes, not individual mistakes), and are shared company-wide. The 2024
Google Drive incident's post-mortem (the first under the new plan) identified 3
systemic causes (no DLP, no production-data-access approval, no engineer
training on data sensitivity) and drove the ADRs for DLP (ADR-089) and this
ADR. The blameless culture encourages engineers to report incidents early
(rather than hide them), reducing time-to-detection.
ARCHITECTURE DIAGRAM
+------------------------------------------------------------------+ | PreOne Incident
Response Plan | +------------------------------------------------------------------+ |
| | NIST SP 800-61 4 Phases: | | +-------------------+
| | | 1. Preparation | - playbooks, training, tooling | | +---------+---------+ -
quarterly tabletop, annual simulation | | |
| | v | | +-------------------+
| | | 2. Detection & | - Splunk alerts (SIEM) | | | Analysis | -
DLP findings (ADR-089) | | +---------+---------+ - Audit trail anomalies
(ADR-086) | | | | | v
| | +-------------------+ | | | 3. Containment, | - Incident
Commander leads | | | Eradication, | - playbooks per incident type
| | | Recovery | - automated regulatory timers | | +---------+---------+
| | | | | v
| | +-------------------+ | | | 4. Post-Incident | - post-
mortem within 5 business days | | | Activity | - remediation tracking in
Jira | | +---------+---------+ - lessons-learned dissemination | | |
| | v | | +-------------------+
| | | Splunk Incident | (single source of truth) | | | Registry |
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 395

PreOne ADR - Volume 4: Security Architecture v3.0
| | +---------+---------+ | |
| | Severity Levels: | | SEV-1 (critical): ack 15min,
contain 1hr (page IC + SecEng Lead)| | SEV-2 (high): ack 1hr, contain 4hr
(page IC) | | SEV-3 (medium): ack 4hr, contain 24hr (Slack IC)
| | SEV-4 (low): ack 1 business day (ticket IC) | |
| | Regulatory Timers (auto-started for data-breach incidents): | | GDPR: 72hr
| DPDP: 72hr | FERPA: 24hr | | Alerts at 50% and 90% of each
deadline | | | | Testing:
| | Quarterly tabletop (1hr, rotating scenario) | | Annual full-scale
simulation (4hr, live red-team + blue-team) |
+------------------------------------------------------------------+
SEQUENCE DIAGRAM
Detection Source -> Splunk: alert (e.g., DLP block-quarantine) Splunk ->
PagerDuty: page on-call IC (severity-based) IC -> Splunk: acknowledge incident
(start SLA timer) IC -> Slack: open #incident-X channel IC -> Playbook: lookup
(incident type) Note over IC, Playbook: IC follows playbook steps IC ->
Containment Actions: - disable compromised account - block malicious IP
(WAF) - revoke OAuth tokens - snapshot affected systems alt data-breach
indicator Splunk -> Compliance Ops: start regulatory timers Splunk ->
Compliance Ops: alert at 50% deadline Splunk -> Compliance Ops: alert at 90%
deadline Compliance Ops -> Legal: draft notification Legal -> CTO: approve
notification CTO -> Regulator: submit notification (within deadline) end IC ->
Recovery: - restore from backup if needed - verify integrity - monitor for
recurrence IC -> Closure: declare incident closed IC -> Post-Mortem Author:
assign (within 5 business days) Post-Mortem Author -> All-Company: publish
(blameless) Post-Mortem -> Jira: remediation tickets
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-090 — Incident Response -
Component View | +-------------------------------------------------------------+ |
| | NIST SP 800-61 4 Phases: | | +----------------+
+----------------------+ | | | 1. Preparation | train | IC roster + | | | |
|------->| playbooks + | | | +----------------+ | tooling | | |
+----------------------+ | | | | +----------------+
+----------------------+ | | | 2. Detection & | alert | Splunk (SIEM) + | | |
| Analysis |------->| DLP (ADR-089) + | | | +----------------+ | Audit
(ADR-086) | | | +----------------------+ | |
| | +----------------+ +----------------------+ | | | 3. Containment | lead |
Incident Commander | | | | + Recovery |------->| + Playbook |
| | +----------------+ | + Regulatory Timers | | |
+----------------------+ | | | | +----------------+
+----------------------+ | | | 4. Post-Incid. | publish| Post-mortem (5 days) | |
| | Activity |------->| + Jira remediation | | | +----------------+
+----------------------+ | | | | Severity:
SEV-1 (15min/1hr) SEV-2 (1hr/4hr) SEV-3 SEV-4 | | Testing: quarterly tabletop
+ annual simulation | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 396

PreOne ADR - Volume 4: Security Architecture v3.0
Incident Detection Flow: Splunk Alert / DLP / Audit -> PagerDuty: page IC
(severity-based) PagerDuty -> IC: notification (15min ack SLA for SEV-1) IC ->
Splunk: acknowledge + open #incident-X Slack channel Containment Flow: IC
-> Playbook: lookup (incident type) IC -> Containment Actions: - disable
compromised account - block IP (WAF) - revoke OAuth tokens - snapshot
affected systems Regulatory Notification Flow (data-breach incidents): Splunk
-> Compliance Ops: start timers (GDPR 72h / DPDP 72h / FERPA 24h) Splunk
-> Compliance Ops: alert at 50% deadline Splunk -> Compliance Ops: alert at
90% deadline Compliance Ops -> Legal: draft notification Legal -> CTO:
approve CTO -> Regulator: submit (within deadline) Post-Incident Flow: IC ->
Closure: declare incident closed Post-Mortem Author -> All-Company: publish
(5 business days, blameless) Post-Mortem -> Jira: remediation tickets (30-day
SLA)
DATABASE IMPACT
IR has no direct database impact. Incidents are logged in Splunk (not Postgres).
A materialised view (security.incidents_summary) in Postgres includes incident
counts and SLA compliance for the security scorecard, populated by a Splunk-
to-Postgres ETL job. During a containment action, the IC may freeze specific
data (e.g., prevent writes to a compromised tenant's tables) via Postgres RLS
policy updates — a documented runbook step for the 'unauthorized access'
playbook. No schema changes are required for this ADR.
API IMPACT
No public API changes. During a SEV-1 incident, the API may return elevated
error rates or a maintenance page (per the DDoS runbook, ADR-085). The
status page (status.preone.com) is updated within 15 minutes of SEV-1
declaration with the estimated impact and resolution time. Post-incident, the
status page is updated with a post-mortem summary within 48 hours. The
admin API exposes GET /admin/incidents (RBAC-controlled: admin or security
role) for incident tracking and metrics.
UI IMPACT
Incident Response surfaces in the UI during an incident as the status page
(status.preone.com), updated within 15 minutes of SEV-1 declaration. The
status page shows incident severity, affected components, estimated resolution
time, and updates every 30 minutes during the incident. Post-incident, the
status page displays a post-mortem summary within 48 hours. The admin UI
includes an 'Incidents' dashboard (admin/operations/security/incidents,
accessible to Security Engineering) showing incident history, SLA compliance,
and post-mortem publication status. For internal users, a Slack bot posts
incident declarations and closures to #incidents, keeping the engineering team
informed.
SECURITY IMPACT
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 397

PreOne ADR - Volume 4: Security Architecture v3.0
The IR plan is the meta-control that ensures all other security controls' failures
are detected, contained, and learned from. It provides: (1) documented
response procedures (no ad-hoc decisions under pressure); (2) role clarity
(Incident Commander has authority); (3) regulatory compliance (automated
notification timers); (4) organisational learning (blameless post-mortems). The
2025 audit cited IR formalisation as priority-1; this ADR closes the gap. The
2024 Google Drive incident would have had a post-mortem and remediation
under the new plan; the lack of post-mortem in 2024 was a direct cause of the
2025 audit finding.
PERFORMANCE IMPACT
IR has no performance impact on production. During an incident, containment
actions (e.g., disabling an account, blocking an IP) may briefly affect specific
users but are necessary for incident containment. The Splunk alerting pipeline
has sub-minute latency for SEV-1 detection. The quarterly tabletop and annual
simulation are conducted in staging or off-hours; no production impact. The
post-mortem process is asynchronous (5 business days) and does not affect
ongoing operations.
SCALABILITY ANALYSIS
The IR plan scales with incident volume. At 10-20 incidents/year (current), the
rotating IC role (10 senior engineers × 4 hours training = 40 hours upfront + 1
hour/quarter tabletop + 4 hours/year simulation per IC) is sustainable. At 50+
incidents/year (projected 2028), a dedicated IR manager may be needed. The
Splunk incident registry scales to any volume. The playbooks are version-
controlled in Git and updated annually. The regulatory timers scale with
regulation count (currently 3: GDPR, DPDP, FERPA; extensible to new
regulations per ADR-088).
OPERATIONAL CONSIDERATIONS
The Security Engineering Lead owns the IR plan. The IC rotation (weekly) is
managed by the Security Engineering team. The team coordinates: (a) IC
training (4-hour course, quarterly refreshers); (b) tabletop exercise facilitation
(quarterly, rotating scenario); (c) annual full-scale simulation (red-team + blue-
team); (d) post-mortem review (within 5 business days of each incident); (e)
remediation tracking (Jira tickets with 30-day SLA for post-mortem action
items). The team monitors a #incidents Slack channel where new incidents
post automatically. The monthly security scorecard tracks: (a) incident count by
severity and type; (b) SLA compliance rate (ack time, containment time); (c)
post-mortem publication rate (target: 100% within 5 business days); (d)
remediation ticket closure rate (target: 90% within 30 days); (e) tabletop and
simulation completion.
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 398

PreOne ADR  -  Volume 4: Security Architecture  v3.0
RISKS
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| SEV-1 incident     | Low        | High   | Outgoing IC briefs  |
| occurs during IC   |            |        | incoming IC every   |
| handoff (rotation  |            |        | Monday; 'IC on-     |
| gap)               |            |        | call' PagerDuty     |
schedule has 30-
minute overlap;
Security
Engineering Lead
is always
secondary on-call
| Tabletop exercise  | Medium | Medium | Exercise outputs  |
| ------------------ | ------ | ------ | ----------------- |
| reveals runbook    |        |        | tracked as Jira   |
| gaps that are not  |        |        | tickets with 30-  |
| remediated         |        |        | day SLA; CTO      |
reviews open
tickets quarterly;
exercise repeated
until gaps closed
| Post-mortem       | Medium | High | Blameless post-   |
| ----------------- | ------ | ---- | ----------------- |
| culture degrades  |        |      | mortem training   |
| into blame-game   |        |      | for all ICs; CTO  |
reinforces culture
in all-hands; post-
mortems reviewed
by Security
Engineering Lead
before
publication;
blame-language
flagged and
rewritten
| Regulatory        | Low | High | Automated Splunk   |
| ----------------- | --- | ---- | ------------------ |
| notification      |     |      | timers at 50% and  |
| missed (deadline  |     |      | 90%; Compliance    |
| exceeded)         |     |      | Ops on-call for    |
SEV-1 incidents;
Legal pre-
approved
templates for
common
notification types;
backup
notification
submitter if CTO
unavailable
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  399

PreOne ADR - Volume 4: Security Architecture v3.0
Risk Likelihood Impact Mitigation
Incident volume Medium Medium IC rotation
exceeds IC expanded to 15
rotation capacity senior engineers
(currently 10);
dedicated IR
manager
budgeted for 2028
if volume exceeds
30 incidents/year
TRADE-OFFS
We Gain We Lose
Formal IR plan with documented 4 hours of training per senior engineer
procedures (upfront)
Role clarity (Incident Commander IC rotation overhead (weekly handoff,
authority) 30-min overlap)
Automated regulatory notification Splunk configuration maintenance
timers
Tested via quarterly tabletop + annual 1 hour/quarter + 4 hours/year per IC
simulation
Blameless post-mortem culture Cultural discipline required (CTO
reinforcement)
REJECTED ALTERNATIVES
ISO 27035 was considered for alignment with the ISO 27001 certification
(ADR-088) but was rejected as less prescriptive (no severity-level SLAs, no role
definitions) and less recognised in the US market. The managed-service option
(Mandiant, CrowdStrike) was rejected for cost ($100K+/year retainer),
availability risk during industry-wide incidents, and organisational risk
(outsourcing IR creates permanent dependency). PreOne retains a Mandiant
retainer as backup for catastrophic incidents. The ad-hoc option was the legacy
process, documented in the 2025 audit as inadequate (no post-mortem for the
2024 incident, no remediation tracking, no lessons-learned). The NIST SP 800-
61-aligned plan was the only option that satisfied all requirements: prescriptive
framework, role clarity, regulatory compliance, tested readiness, and
organisational learning.
MIGRATION PLAN
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 400

PreOne ADR - Volume 4: Security Architecture v3.0
Phase 1 (Q4 2025, complete): IR plan documented in Notion (4 phases, 4
severity levels, 5 playbooks). Phase 2 (Q1 2026, complete): 10 senior engineers
completed IC training (4 hours each). Phase 3 (Q1 2026, complete): Splunk
incident registry deployed with automated regulatory timers. Phase 4 (Q1
2026, complete): First quarterly tabletop exercise conducted (scenario: data
exfiltration via email); 3 runbook gaps identified and remediated. Phase 5 (Q2
2026, complete): First annual full-scale simulation conducted (4-hour live
exercise); simulation report published. Phase 6 (Q2 2026, complete): Blameless
post-mortem training delivered to all ICs. Phase 7 (ongoing): Quarterly
tabletop, annual simulation, post-mortem per incident.
TESTING STRATEGY
The IR plan is tested via three mechanisms. (1) Quarterly tabletop exercise: 1-
hour scenario discussion, rotating through the 5 incident types over 5 quarters.
The exercise is facilitated by the Security Engineering Lead and attended by
the rotating IC roster. Outputs: runbook gaps (Jira tickets, 30-day SLA), IC
readiness assessment. (2) Annual full-scale simulation: 4-hour live exercise
with simulated red-team attack, real blue-team containment, and real post-
mortem. The simulation is observed by the CTO and an external consultant
(Bishop Fox, $15K). Outputs: end-to-end readiness assessment, regulatory-
notification workflow validation. (3) Real incidents: every real incident is a test
of the plan. Post-mortems identify what worked and what did not; runbook
updates are tracked as Jira tickets. The plan is reviewed annually based on
tabletop, simulation, and real-incident learnings.
MONITORING & OBSERVABILITY
Splunk dashboards track: (a) incident count by severity, type, and quarter; (b)
SLA compliance rate (ack time, containment time) by severity; (c) post-mortem
publication rate (target: 100% within 5 business days); (d) remediation ticket
closure rate (target: 90% within 30 days); (e) tabletop and simulation
completion; (f) regulatory-notification timeliness (target: 100% within
deadline). Anomalies (e.g., a 10x spike in SEV-2 incidents) trigger Slack alerts
to #security-alerts. The IR dashboard (admin/operations/security/incidents)
provides a real-time view for the Security Engineering team and the ARB.
Annual report: the Security Engineering Lead presents the IR plan summary to
the ARB and CTO each January, including incident trends, SLA compliance, and
lessons learned.
FUTURE EVOLUTION
Three evolutions are likely. First, the IR plan may adopt AI-assisted incident
detection (e.g., Splunk ML-based anomaly detection) to reduce detection time
for novel attack patterns. Second, the plan may integrate with a dedicated IR
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 401

PreOne ADR - Volume 4: Security Architecture v3.0
platform (e.g., PagerDuty Incident Response, Jira Service Management) for
more structured workflow — currently the plan uses Splunk + Slack + Jira,
which is functional but not purpose-built. Third, the plan may be extended to
cover AI-specific incidents (e.g., AI model compromise, training-data poisoning)
as the AI roadmap (ADR-148) matures — gated on the first AI incident type that
the current playbooks do not cover.
RELATED ADRS
● ADR-002 — Modular Monolith Strategy (IR plan covers the monolith's
incidents)
● ADR-041 — PostgreSQL Strategy (backup/restore is critical to IR
recovery phase)
● ADR-055 — Backup Strategy (backups enable recovery in IR)
● ADR-056 — Restore Strategy (restore is the recovery mechanism in IR)
● ADR-080 — Rate Limiting (rate-limiting containment action in IR
playbooks)
● ADR-083 — Vulnerability Management (vuln-mgmt findings may trigger
IR)
● ADR-084 — Web Application Firewall (WAF containment action in IR
playbooks)
● ADR-085 — DDoS Protection (DDoS incidents follow the availability-
attack playbook)
● ADR-086 — Audit Trail (audit trail is primary evidence in IR analysis
phase)
● ADR-087 — Penetration Testing Program (pentest findings may trigger
IR)
● ADR-088 — Compliance Framework (IR plan is a required control;
regulatory notifications)
● ADR-089 — Data Loss Prevention (DLP findings may trigger IR)
REFERENCES
● Upstream PRD: PRD-007 (Security Requirements — incident response
section)
● Downstream ERD: ERD-090 (security.incidents_summary materialised
view)
● Downstream API Spec: API-090 (internal incident dashboard endpoints)
● Downstream Test Cases: TC-090 (tabletop exercise scripts, simulation
scripts)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 402

PreOne ADR  -  Volume 4: Security Architecture  v3.0
● External: NIST SP 800-61 Rev. 2 (Computer Security Incident Handling
Guide)
● External: Google SRE Book (Chapter 12: Managing Incidents)
● External: IBM Cost of a Data Breach Report 2025
● External: GDPR Article 33 (Notification of personal data breach)
● External: India DPDP Act 2023 (Breach notification requirements)
● External: FERPA 34 CFR § 99.31 (Notification requirements)
DECISION HISTORY
| Date       | Status | Actor            | Notes           |
| ---------- | ------ | ---------------- | --------------- |
| 2025-11-01 | Draft  | Security         | Initial draft;  |
|            |        | Engineering Lead | options         |
enumerated;
consultation with
security and
engineering teams
| 2025-12-18 | Proposed | Security         | Submitted to  |
| ---------- | -------- | ---------------- | ------------- |
|            |          | Engineering Lead | Architecture  |
Review Board
after cross-team
review
| 2026-01-15 | Accepted | ARB Chair | ARB approved;  |
| ---------- | -------- | --------- | -------------- |
published to
architecture
repository
| 2026-07-15 | Accepted | ARB Chair | v3.0 refresh;  |
| ---------- | -------- | --------- | -------------- |
cross-references
to Vol 1-3 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Chief Architect           |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Security Engineering Lead |     |
| ARB Chair   |     | ARB Chair                 |     |
| Approved On |     | 2026-01-15                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
PreOne ADR Series  -  Phase 5 / 10  -  Vol 4: Security Architecture  -  403

PreOne ADR - Volume 4: Security Architecture v3.0
● Security team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● IR plan documented in Notion (4 phases, 4 severity levels, 5 playbooks)
(Done)
● 10 senior engineers completed IC training (4 hours each) (Done)
● Splunk incident registry with automated regulatory timers (Done)
● First quarterly tabletop exercise (Done — Q1 2026)
● First annual full-scale simulation (Done — Q2 2026)
● Blameless post-mortem training for all ICs (Done)
● Mandiant retainer for catastrophic SEV-1 (Done)
● Quarterly tabletop + annual simulation (Ongoing)
PreOne ADR Series - Phase 5 / 10 - Vol 4: Security Architecture - 404