ENTE RPR ISE DO C UM EN TATION SE RIE S - PHAS E 4 O F 10
PreOne Architecture
Decision Records
Phase 4 - Volume 3: Data Architecture
ADR-041 to ADR-060 - 20 decisions - 34-section v3.0 template - Relational Store,
Isolation, Concurrency, Partitioning, Retention, Backup, Migration, Search, Reporting
Document Version: 3.0 (Volume 3 release)
Status: Architecture Freeze
Classification: Internal Engineering Reference
Effective Date: 16 August 2026
Volume Owner: Data Platform Lead
Approval Authority: Architecture Review Board
PreOne Platform - Enterprise Architecture Governance Phase 4 / 10 - August
2026

PreOne ADR - Volume 3: Data Architecture v3.0
Table of Contents
Phase 4 deliverable - Volume 3: Data Architecture - 20 ADRs
Note: This Table of Contents is generated via field codes. To ensure page-number accuracy
after editing, right-click the TOC and select "Update Field."
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - i

PreOne ADR - Volume 3: Data Architecture v3.0
Document Control
This Phase 4 deliverable of the PreOne Enterprise ADR Series presents Volume
3 — Data Architecture. It contains 20 Architecture Decision Records (ADR-041
to ADR-060) that define the relational data platform, tenant and scope isolation,
concurrency and consistency controls, partitioning and indexing strategies,
retention and archival policies, backup and restore topologies, schema
migration discipline, seed data, and the search and reporting database
strategies on which all data persistence is built. Every ADR in this volume
follows the 34-section v3.0 template defined in Phase 1 (ADR-000). Each ADR
includes four ASCII diagrams (architecture, sequence, component, data flow)
and is linked to upstream DDD/PRD documents and downstream
ERD/API/UI/Test artefacts per the cross-reference framework established in
Phase 1.
Volume 3 builds directly on Volume 1 (Architecture Foundation, delivered in
Phase 2) and Volume 2 (Domain Architecture, delivered in Phase 3). ADR-041
(PostgreSQL Strategy) consolidates the relational data store onto PostgreSQL
16 with PgBouncer, PostGIS, pgvector, pg_partman, and pg_stat_statements.
ADR-042 (UUID Strategy) standardises on UUID v7 for monotonic, time-
sortable primary keys. ADR-043 through ADR-046 establish the four isolation
axes — tenant, school, branch, and academic year — that scope every multi-
tenant query. ADR-047 through ADR-049 mandate soft delete, audit columns,
and optimistic concurrency for every mutable entity. ADR-050 and ADR-051
define the indexing and partitioning strategies that keep query latency bounded
as data volume grows. ADR-052 governs JSONB usage for flexible schemas.
ADR-053 and ADR-054 define retention and archival policies. ADR-055 and
ADR-056 define the backup and restore topologies that meet the platform's
RPO and RTO targets. ADR-057 and ADR-058 govern schema migration and
seed data. ADR-059 and ADR-060 close the volume with the search strategy
(Postgres FTS plus optional Elasticsearch) and the reporting database strategy
(read-optimised replica fed by logical replication). Together, these 20 ADRs
form the data-architecture playbook of the PreOne platform.
VERSION HISTORY
Version Date Author Summary of
Changes
1.0 2025-10-15 Office of the Chief Initial release of
Architect Volume 3 with 20
ADRs using the
26-section v2.0
template.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 1

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Version | Date | Author | Summary of  |
| ------- | ---- | ------ | ----------- |
Changes
| 3.0 | 2026-08-16 | Data Platform  | Phase 4 release.  |
| --- | ---------- | -------------- | ----------------- |
|     |            | Lead           | All 20 ADRs       |
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
Volume 2 ADRs
(ADR-021 to
ADR-040), plus
downstream
ERD/API/TC
artefacts, added
per the Phase 1
framework.
OWNERSHIP & CLASSIFICATION
| Document Owner |     | Data Platform Lead (Volume 3 Data  |     |
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
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  2

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Storage Location |     | PreOne Architecture Repository /  |     |
| ---------------- | --- | --------------------------------- | --- |
governance/adr/volume-3/
| Series |     | PreOne Enterprise Documentation  |     |
| ------ | --- | -------------------------------- | --- |
Series — Phase 4 of 10
VOLUME 3 ADR SUMMARY
| ADR     | Title       | Category          | Sections |
| ------- | ----------- | ----------------- | -------- |
| ADR-041 | PostgreSQL  | Data Architecture | 34       |
Strategy
| ADR-042 | UUID Strategy    | Data Architecture | 34  |
| ------- | ---------------- | ----------------- | --- |
| ADR-043 | Tenant Isolation | Data Architecture | 34  |
| ADR-044 | School Isolation | Data Architecture | 34  |
| ADR-045 | Branch Isolation | Data Architecture | 34  |
| ADR-046 | Academic Year    | Data Architecture | 34  |
Isolation
| ADR-047 | Soft Delete   | Data Architecture | 34  |
| ------- | ------------- | ----------------- | --- |
| ADR-048 | Audit Columns | Data Architecture | 34  |
| ADR-049 | Optimistic    | Data Architecture | 34  |
Concurrency
| ADR-050 | Indexing Strategy  | Data Architecture | 34  |
| ------- | ------------------ | ----------------- | --- |
| ADR-051 | Partition Strategy | Data Architecture | 34  |
| ADR-052 | JSONB Usage        | Data Architecture | 34  |
| ADR-053 | Data Retention     | Data Architecture | 34  |
| ADR-054 | Archive Policy     | Data Architecture | 34  |
| ADR-055 | Backup Strategy    | Data Architecture | 34  |
| ADR-056 | Restore Strategy   | Data Architecture | 34  |
| ADR-057 | Migration          | Data Architecture | 34  |
Strategy
| ADR-058 | Seed Data  | Data Architecture | 34  |
| ------- | ---------- | ----------------- | --- |
Strategy
| ADR-059 | Search Strategy | Data Architecture | 34  |
| ------- | --------------- | ----------------- | --- |
| ADR-060 | Reporting       | Data Architecture | 34  |
Database Strategy
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  3

PreOne ADR - Volume 3: Data Architecture v3.0
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 4

PreOne ADR - Volume 3: Data Architecture v3.0
V O L U M E 3
Data Architecture
ADR-041 to ADR-060 - 20 decisions - 34 sections each
Volume 3 defines the data architecture of the PreOne platform. The 20
ADRs in this volume translate the structural foundation (Volume 1) and
the domain model (Volume 2) into a concrete data-persistence strategy.
ADR-041 establishes PostgreSQL 16 as the sole relational store,
concentrating operational expertise and simplifying DR. ADR-042
standardises on UUID v7 for monotonic, time-sortable primary keys
across every table. ADR-043 through ADR-046 establish the four
isolation axes — tenant, school, branch, and academic year — that scope
every multi-tenant query, enforced by Postgres row-level security and
composite keys. ADR-047 through ADR-049 mandate soft delete, audit
columns, and optimistic concurrency for every mutable entity, ensuring
data integrity and recoverability. ADR-050 and ADR-051 define the
indexing and partitioning strategies that keep query latency bounded as
data volume grows: composite and partial indexes for hot paths, range
partitioning by academic year for high-volume tables. ADR-052 governs
JSONB usage for flexible schemas, balancing structure with adaptability.
ADR-053 and ADR-054 define retention and archival policies that
balance regulatory compliance with cost. ADR-055 and ADR-056 define
the backup and restore topologies that meet the platform's 5-minute RPO
and 1-hour RTO targets. ADR-057 and ADR-058 govern schema
migration discipline (Flyway, versioned, forward-only) and seed data
strategy. ADR-059 and ADR-060 close the volume with the search
strategy (Postgres FTS first, Elasticsearch as optional accelerator) and
the reporting database strategy (read-optimised replica fed by logical
replication, isolating analytical load from OLTP). Together, these 20
ADRs are the data-architecture playbook of the PreOne platform — the
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 5

PreOne ADR - Volume 3: Data Architecture v3.0
patterns that every engineer applies when designing or modifying data
persistence.
AD R -041
PostgreSQL Strategy
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt PostgreSQL 16 as the sole relational data store for the PreOne
platform across OLTP, audit, configuration, and reporting-adjacent
workloads. All persistence layers, including the modular monolith's
bounded contexts, will use Postgres via a shared cluster topology with read
replicas, connection pooling through PgBouncer, and the PostGIS,
pgvector, pg_partman, and pg_stat_statements extensions enabled by
default. MongoDB, MySQL, and DynamoDB are rejected as primary stores.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne is a multi-tenant SaaS platform serving the K-12 and higher-education
sectors across multiple geographies. The data layer must support transactional
workloads (enrollment, grading, attendance), bulk reporting (academic
transcripts, attendance rosters), audit trails (every mutation to a regulated
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 6

PreOne ADR - Volume 3: Data Architecture v3.0
entity), full-text and semantic search (institution directory, course catalog), and
time-series-ish telemetry (daily attendance aggregates). The previous platform
generation used a mix of MongoDB for documents and MySQL for transactions,
which produced consistency, operational, and hiring problems. PostgreSQL
16, released in September 2023 and production-hardened by mid-2024, brings
logical replication improvements, parallel query enhancements, SQL/JSON
path expressions, and improved vacuum feedback that materially affect our
workload profile. The PostGIS extension covers the geolocation needs of the
school-locator service; pgvector covers the semantic-search needs of the AI-
assistant roadmap (ADR-148); pg_partman automates the range-partition
maintenance mandated by ADR-051. The engineering organisation is already
fluent in SQL and in the Postgres operational model. Standardising on a single
relational engine reduces the cognitive surface area for on-call, simplifies the
disaster-recovery story (one PITR topology, one backup format), and
concentrates tooling investment. The principal alternative considered was a
polyglot persistence strategy (Postgres for OLTP, Elasticsearch for search,
DynamoDB for session state), but the operational cost of three engines for a 50-
engineer organisation was judged prohibitive.
BUSINESS DRIVERS
PreOne's institutional customers sign annual contracts with strict uptime and
data-recoverability SLAs; data-layer incidents are the single largest contributor
to churn. Consolidating on Postgres concentrates operational expertise,
shortens on-call escalation paths, and reduces the number of backup and DR
topologies the SRE team must rehearse. The savings are redirected into higher-
value platform work. A second driver is the international expansion planned for
2026, which requires data residency in India, the EU, and the US. Postgres runs
identically in AWS, Azure, and on-premises; a polyglot strategy would multiply
the residency certification work. A single engine also simplifies the auditors'
job: one schema-introspection script, one retention enforcement job, one
access-control model. A tertiary driver is the AI roadmap. Embeddings, vector
similarity search, and structured retrieval all benefit from co-location with the
transactional data, avoiding the dual-write consistency problems that arise
when vectors live in a separate store. pgvector inside Postgres gives us ACID
guarantees over embedding updates without a separate vector database.
PROBLEM STATEMENT
PreOne requires a single, well-understood relational data platform that can
serve transactional, audit, search, and reporting workloads under a multi-
tenant model while keeping operational complexity, hiring cost, and DR
rehearsal burden within the capacity of a 50-engineer organisation.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 7

PreOne ADR  -  Volume 3: Data Architecture  v3.0
CONSTRAINTS
● All regulated data must reside in PostgreSQL; no shadow databases
holding PII or academic records.
● The engine must support logical replication for tenant-scoped
extraction and cross-region replication for DR.
● The engine must support range and list partitioning for high-volume
tables (attendance, gradebook, audit log).
● Extensions required: PostGIS, pgvector, pg_partman,
pg_stat_statements, pgcrypto, uuid-ossp or pg_idkit.
● Connection pooling is mandatory; no direct application connection to
the primary without PgBouncer in transaction mode.
● Major version upgrades occur on a 24-month cadence with one minor
version lag from upstream GA.
ASSUMPTIONS
● PostgreSQL 16 will receive security support through November 2028,
sufficient for our upgrade cadence.
● AWS RDS for PostgreSQL and Aurora PostgreSQL will continue to
support the extensions we depend on.
● The engineering organisation's Postgres fluency will scale linearly with
headcount; no sudden skill cliff.
● pgvector performance will remain competitive with dedicated vector
databases for our workload size (≤ 100M vectors per tenant).
● Logical replication will remain stable enough for tenant-extraction use
cases without bespoke conflict resolution.
OPTIONS CONSIDERED
| Option              | Pros             | Cons                  | Verdict |
| ------------------- | ---------------- | --------------------- | ------- |
| Adopt PostgreSQL    | Single engine    | Some workloads        | Adopted |
| 16 as the sole      | concentrates     | (e.g., log analytics  |         |
| relational store    | operational      | at petabyte scale)    |         |
| across OLTP,        | expertise,       | are not a good fit;   |         |
| audit, search, and  | simplifies DR,   | we will need an       |         |
| reporting           | enables ACID     | outbound pipeline     |         |
| workloads.          | guarantees over  | to a columnar         |         |
|                     | embeddings via   | store for those       |         |
|                     | pgvector, and    | cases.                |         |
aligns with
existing team
fluency.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  8

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option             | Pros                | Cons              | Verdict  |
| ------------------ | ------------------- | ----------------- | -------- |
| Polyglot           | Each workload       | Three engines to  | Rejected |
| persistence:       | runs on the engine  | operate, patch,   |          |
| PostgreSQL for     | best suited to it;  | back up, and      |          |
| OLTP,              | peak performance    | rehearse DR for.  |          |
| Elasticsearch for  | per workload is     | Dual-write        |          |
| search,            | higher.             | consistency       |          |
| DynamoDB for       |                     | problems between  |          |
| sessions, S3 for   |                     | Postgres and      |          |
| blobs.             |                     | Elasticsearch.    |          |
Hiring surface
expands to three
specialisations.
| Adopt MySQL 8.4   | Operationally    | Weaker JSON        | Rejected |
| ----------------- | ---------------- | ------------------ | -------- |
| as the sole       | familiar to a    | support than       |          |
| relational store. | subset of the    | Postgres JSONB;    |          |
|                   | team; lower per- | no first-party     |          |
|                   | replica cost on  | vector extension;  |          |
|                   | AWS.             | weaker             |          |
partitioning story
until 8.0 matured;
smaller extension
ecosystem;
GROUP BY
semantics differ
from team
expectation.
Defer the decision  No migration cost;  Operational debt  Rejected
| and continue with  | no risk of         | continues to        |     |
| ------------------ | ------------------ | ------------------- | --- |
| the legacy         | regression during  | compound; two       |     |
| MongoDB +          | cutover.           | engines to staff    |     |
| MySQL mix for      |                    | on-call for; cross- |     |
| two more years.    |                    | engine joins        |     |
require
application-level
fan-out.
DECISION
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  9

PreOne ADR - Volume 3: Data Architecture v3.0
ADOPTED
Adopt PostgreSQL 16 as the sole relational data store for the PreOne
platform across transactional, audit, configuration, and reporting-adjacent
workloads. We will run it on AWS RDS for PostgreSQL for the primary
cluster, with cross-region read replicas for DR and Aurora PostgreSQL as a
documented future migration target. PgBouncer in transaction-pooling
mode will front every application connection. The PostGIS, pgvector,
pg_partman, and pg_stat_statements extensions are enabled by default on
every database. Major version upgrades occur on a 24-month cadence. No
new workloads will be written against MongoDB or MySQL; existing
workloads will be migrated per the plan in ADR-057.
DETAILED RATIONALE
PostgreSQL 16 was chosen over the alternatives because it is the only engine
that satisfies all five of PreOne's hard requirements simultaneously: ACID
transactions with serializable isolation, native UUID generation, robust range
and list partitioning, JSONB for flexible schemas, and a first-party vector
extension (pgvector) that co-locates embeddings with transactional data. The
polyglot alternative was attractive on theoretical grounds (best engine per
workload) but fails on operational grounds. PreOne's SRE team has four
engineers; running three engines well requires six. The polyglot path also
introduces dual-write consistency problems between Postgres and
Elasticsearch that are well documented in the industry and that we have
personally experienced in the legacy platform: out-of-sync search indexes,
repair jobs that run for hours, and customer-visible staleness during incident
recovery. Co-locating search in Postgres via FTS (ADR-059) and using
Elasticsearch only as an optional accelerator where Postgres FTS cannot meet
latency targets eliminates the dual-write problem. MySQL 8.4 was a serious
contender. The team has prior MySQL experience and AWS pricing favours
MySQL slightly. However, MySQL's JSON type lacks the GIN-indexed JSONB
operations that PreOne's flexible-schema use cases depend on (ADR-052),
MySQL's partitioning cannot partition by an expression in the way PreOne's
academic-year partitioning requires (ADR-051), and MySQL has no equivalent
to pgvector for the AI roadmap (ADR-148). Each gap alone is bridgeable;
together they represent a three-year strategic disadvantage. The 'defer' option
was rejected because every quarter of deferral adds to the operational debt.
The legacy MongoDB cluster requires dedicated on-call, dedicated backup
rehearsal, and dedicated patching. Each of those activities consumes engineer-
weeks per quarter that would otherwise fund platform investment. The Aurora
PostgreSQL variant was considered as the primary rather than RDS. Aurora's
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 10

PreOne ADR - Volume 3: Data Architecture v3.0
storage architecture (distributed storage, fast replica promotion) is attractive,
but Aurora's extension support lags RDS by 3-6 months and Aurora's cost model
is unfavourable at the relatively modest data volumes PreOne currently holds.
We will revisit Aurora when total dataset size exceeds 5 TB or when cross-
region read replica lag becomes a constraint; the trigger is documented in the
futureEvolution section.
ARCHITECTURE DIAGRAM
+---------------------------------------------------------------+ | PREONE DATA
PLATFORM TOPOLOGY | +---------------------------------------------------------------+
| | | App Tier (Modular Monolith) ----+
| | | | | | v v
| | +-------+ +-------------+ | | |PgBounc| tx-pool | RDS
PG 16 | (Primary, AZ-a) | | |er x N | ------------> | primary | | |
+-------+ +-------------+ | | | WAL stream
| | +---------------+---------------+ | | v v
| | +-------------+ +-------------+ | | | RDS PG 16 | |
RDS PG 16 | | | | read rep | | read rep | | | |
(region-us)| | (region-eu)| | | | reporting | | DR
standby | | | +-------------+ +-------------+ | | ^
| | | | | +--------------+----------+ S3
(Glacier archive) | | | Materialized Views | ^ | | |
(refresh nightly) | -------+ | | +-------------------------+
| | | | Extensions: PostGIS, pgvector,
pg_partman, pg_stat_stmts | +---------------------------------------------------------------+
SEQUENCE DIAGRAM
App -> PgBouncer: BEGIN; SELECT ... PgBouncer -> RDS Primary: route (tx-
pool) RDS Primary -> Storage: WAL write RDS Primary -> PgBouncer: rows
PgBouncer -> App: result set RDS Primary -> Read Replica (us): WAL stream
RDS Primary -> Read Replica (eu): WAL stream (async) Reporting Job -> Read
Replica (us): SELECT ... (read-only) Read Replica (us) -> Reporting Job: rows
Backup Job -> S3: nightly snapshot + WAL archive S3 -> S3 Glacier: monthly
archive (lifecycle)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-041 — PostgreSQL Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Application | pool |
PgBouncer | | | | Service |------->| (transaction mode) | | | |
(per BC) | +----------+-----------+ | | +----------------+ |
| | | route | | v
| | +----------------+ +----------------------+ | | | Read Replica | read | RDS
Primary | | | | (reporting) |<-------| (writes) | | |
+----------------+ +----------+-----------+ | | |
| | | WAL | | v
| | +--------+----------+ | | | S3 (WAL
archive) | | | +-------------------+ | |
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 11

PreOne ADR - Volume 3: Data Architecture v3.0
| | Extensions: PostGIS, pgvector, pg_partman, pg_stat |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Write Path: App -> PgBouncer -> RDS Primary -> WAL -> Storage RDS
Primary -> Read Replicas (async stream) RDS Primary -> S3 (nightly snapshot
+ WAL archive) S3 -> Glacier (lifecycle, monthly) Read Path: App ->
PgBouncer -> Read Replica (us) -> rows Reporting Job -> Read Replica (us) ->
result set DR Path: RDS Primary (us) -> Read Replica (eu, promoted on
failover) S3 cross-region replicate -> S3 (eu)
DATABASE IMPACT
Every bounded context in the modular monolith will own exactly one schema in
the primary Postgres cluster. Cross-schema foreign keys are forbidden; cross-
schema references use UUID columns without FK constraints and are validated
at the application layer (ADR-043). Tables must use UUID v7 primary keys
(ADR-042), include the standard audit columns (ADR-048), include a deleted_at
column for soft delete (ADR-047), and include a version column for optimistic
concurrency (ADR-049). High-volume tables (attendance, gradebook,
audit_log) must be range-partitioned by academic_year (ADR-051). The
pgvector and PostGIS extensions create their own catalog objects; tenant
migrations must include extension availability checks. The shared cluster
topology means noisy-neighbour risk between contexts is real; context owners
must use statement_timeout and cost-based admission control to protect
shared capacity.
API IMPACT
API contracts do not change as a direct consequence of this ADR, but the
persistence choice shapes several API conventions. Pagination must use keyset
pagination over UUID v7 (which is monotonically increasing) rather than
OFFSET, because OFFSET on large tables is unbounded in cost. Bulk endpoints
must use COPY through the Postgres binary protocol rather than INSERT
loops; the API gateway exposes a /bulk endpoint family for this purpose. Error
responses that surface database constraint violations must map Postgres
SQLSTATE codes to HTTP status codes deterministically (23505 -> 409, 23503
-> 422, 40001 -> 409 with retry-after). Read-after-write consistency for APIs
that read from replicas is governed by ADR-060 (Reporting Database Strategy)
and requires clients to send an X-Read-Consistency header when they need
primary reads.
UI IMPACT
The PostgreSQL strategy has no direct UI surface — it is infrastructure.
Indirectly, UI consistency benefits because all reads return from a single
engine with consistent transaction semantics; users never see partial writes or
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 12

PreOne ADR - Volume 3: Data Architecture v3.0
stale reads across engines. Reporting dashboards (which query read replicas)
may lag the primary by up to 5 seconds; UI components that surface time-
sensitive data (e.g., a parent app showing 'just-marked' attendance) display a
'syncing' indicator when the lag exceeds 2 seconds, set via the lag-threshold
endpoint. No UI changes were required for the migration itself; the application
API is engine-agnostic.
SECURITY IMPACT
Consolidating on Postgres concentrates the security surface in one engine,
which is a net positive: one set of role definitions, one row-level-security policy
framework, one audit pipeline. Row-level security (RLS) is mandatory for any
table that contains PII and is shared across tenants; tenant isolation RLS
policies are defined in ADR-043. Connection strings are issued per service per
environment and stored in AWS Secrets Manager with 30-day rotation. The
postgres superuser role is never granted to applications; the highest privilege
any application holds is the owner of its own schema. The pg_stat_statements
extension exposes query text, which can leak PII in logs; this is mitigated by
redacting parameters before they reach pg_stat_statements via the
log_statement_sample_rate knob and by scrubbing pg_stat_statements dumps
before they leave the cluster.
PERFORMANCE IMPACT
PostgreSQL 16 on RDS with the configuration specified in the operational
runbook sustains approximately 18,000 TPS on the primary for our
transactional workload (enrollment, attendance, grading) at p99 latency of
12ms for indexed point lookups and 85ms for the median reporting query.
Connection pooling through PgBouncer in transaction mode allows 400
application connections to share 50 backend connections, reducing memory
pressure on the primary. Parallel query (max_parallel_workers_per_gather=4)
reduces the median aggregate reporting query by 35% versus serial execution.
The pgvector HNSW index delivers p99 vector similarity latency of 18ms for
1M-vector tenant scope. The principal performance risk is autovacuum falling
behind on the high-churn audit_log and attendance tables; this is mitigated by
per-table autovacuum scaling factors documented in ADR-050.
SCALABILITY ANALYSIS
Vertical scaling on RDS reaches its ceiling at db.r6g.16xlarge (64 vCPU, 512
GB RAM); we are currently at db.r6g.8xlarge, leaving one doubling of vertical
headroom. Beyond that, horizontal scaling proceeds through read replicas (we
currently run two, can scale to fifteen) and through logical partitioning at the
application layer (tenant-sharding across multiple Postgres clusters). The
trigger for tenant-sharding is documented in ADR-043: when total dataset size
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 13

PreOne ADR  -  Volume 3: Data Architecture  v3.0
exceeds 5 TB or when the primary sustains > 60% CPU at peak, we shard by
tenant cohort. The pgvector workload scales through HNSW index partitioning
per tenant; the 100M-vectors-per-tenant ceiling is the documented soft limit
beyond which we will move that workload to a dedicated vector store. Logical
replication lag to read replicas is monitored; sustained lag > 5 seconds triggers
investigation.
OPERATIONAL CONSIDERATIONS
The SRE team owns the Postgres platform: cluster provisioning, extension
management, parameter tuning, version upgrades, backup verification, and DR
rehearsal. Application teams own their schemas: migrations (via Flyway,
ADR-057), index choices, query plans, and tenant-isolation RLS policies. On-call
runbooks cover: replica promotion, failover to the DR region, PITR restoration
(ADR-056), autovacuum lag remediation, replication slot overflow, and the
pg_stat_statements-based slow-query triage. Major version upgrades are
rehearsed on the DR replica first, then promoted during a maintenance
window. Minor version upgrades are applied via the RDS managed patch
window. Every change to cluster parameters is reviewed by SRE and recorded
in the parameter-group change log.
RISKS
| Risk                 | Likelihood | Impact | Mitigation         |
| -------------------- | ---------- | ------ | ------------------ |
| pgvector             | Medium     | Medium | Monitor p99        |
| performance          |            |        | vector-query       |
| regresses at scale   |            |        | latency; trigger   |
| beyond the 100M-     |            |        | ADR review when    |
| vectors-per-tenant   |            |        | any tenant         |
| ceiling, forcing an  |            |        | exceeds 75M        |
| unplanned            |            |        | vectors. Pre-      |
| migration to a       |            |        | evaluate Pinecone  |
| dedicated vector     |            |        | and Weaviate as    |
| store.               |            |        | documented         |
fallbacks in
ADR-148.
| PostgreSQL major   | Low | High | Rehearse on a       |
| ------------------ | --- | ---- | ------------------- |
| version upgrades   |     |      | production-mirror   |
| (every 24 months)  |     |      | snapshot, run the   |
| introduce          |     |      | full regression     |
| regressions that   |     |      | suite, and stage a  |
| survive rehearsal  |     |      | 24-hour soak        |
| on the DR replica. |     |      | before promotion.   |
Maintain the prior
version for 30
days for fast
rollback.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  14

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Aurora             | Low        | Medium | Track Aurora        |
| PostgreSQL         |            |        | extension support   |
| migration, if      |            |        | quarterly; any      |
| triggered later,   |            |        | extension we        |
| reveals extension  |            |        | depend on must      |
| or feature gaps    |            |        | be on Aurora's      |
| not present in     |            |        | supported list      |
| RDS.               |            |        | within 6 months of  |
our adoption.
| PgBouncer          | Medium | Medium | Lint for session-  |
| ------------------ | ------ | ------ | ------------------ |
| transaction        |        |        | state usage in     |
| pooling breaks     |        |        | code review;       |
| session-level      |        |        | documented         |
| features (SET,     |        |        | escape hatch is a  |
| advisory locks,    |        |        | dedicated session- |
| prepared           |        |        | mode PgBouncer     |
| statements) that   |        |        | pool for the few   |
| some library code  |        |        | services that      |
| implicitly relies  |        |        | require it.        |
on.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Single engine to operate, patch, back  Some workloads (petabyte log
up, and rehearse DR for. analytics) are a poor fit; we route those
to a separate columnar store.
ACID guarantees over embeddings and  Vector workload competes with OLTP
transactional data in the same cluster. for cache and CPU; we accept this until
the 100M-vector ceiling is reached.
Concentrated hiring surface (Postgres  Reduced latitude to use purpose-built
fluency is broadly available). engines (e.g., time-series DBs) for niche
workloads.
Logical replication is built-in and well  Logical replication conflict resolution is
| understood. |     | rudimentary; we must avoid multi- |     |
| ----------- | --- | --------------------------------- | --- |
master topologies.
REJECTED ALTERNATIVES
MongoDB was rejected as a primary store because its lack of multi-statement
ACID transactions across collections (until 4.0, and still with caveats) made the
audit-trail and enrollment flows brittle in the legacy platform. MySQL was
rejected on the JSON, partitioning, and vector-extension gaps documented
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  15

PreOne ADR - Volume 3: Data Architecture v3.0
above. CockroachDB was considered for its multi-region active-active topology
but rejected on cost grounds and because our workload does not require multi-
writer globally distributed writes; single-region primary with cross-region read
replicas is sufficient. SQLite was considered for edge deployments (school-
branch local servers) but rejected because the branch-local workload is now
served by the cloud primary with offline-tolerant sync (ADR-045). The full
reasoning for each rejection is captured in the Options Considered table.
MIGRATION PLAN
Migration from the legacy MongoDB + MySQL mix to Postgres proceeds in four
phases over four quarters. Phase 1 (Q1): stand up the Postgres 16 primary, read
replicas, PgBouncer, and the S3-based backup topology; migrate the three
lowest-risk bounded contexts (configuration, notifications, feature-flags) as the
pilot. Phase 2 (Q2): migrate the audit-log and reference-data contexts, which
are high-volume but low-complexity; this exercises the partitioning,
autovacuum, and backup-verification machinery at scale. Phase 3 (Q3): migrate
the enrollment and gradebook contexts, which are the highest-complexity
transactional workloads; dual-write during cut-over with reconciliation jobs.
Phase 4 (Q4): decommission MongoDB and MySQL; archive the final snapshots
to S3 Glacier with a 7-year retention per ADR-053. Rollback per phase is to the
prior engine for 30 days after cut-over, after which the legacy snapshots
become read-only.
TESTING STRATEGY
Each migrated context is tested at three layers before cut-over. (1) Schema
equivalence: a property-based test compares the set of queryable predicates
between the legacy and Postgres schemas; any gap is a blocker. (2) Query
equivalence: 5% of production read traffic is shadowed to the Postgres replica
and the result sets are compared row-by-row; mismatch rate must be below
0.01%. (3) Transactional equivalence: a synthetic workload replays 24 hours of
production write traffic against a Postgres mirror and verifies post-conditions.
After cut-over, the legacy engine is kept in read-only shadow mode for 30 days
with nightly reconciliation. The Postgres platform itself is tested via the
standard RDS build pipeline plus the chaos rehearsal documented in ADR-150
(Performance Testing).
MONITORING & OBSERVABILITY
The Postgres platform is monitored through three dashboards. (1) Cluster
health: CPU, memory, IOPS, replication lag, autovacuum lag, connection count,
cache hit ratio; alerts fire on replication lag > 5s, autovacuum lag > 1 hour,
cache hit ratio < 95%, connection saturation > 80%. (2) Query performance:
top-100 queries by mean and p99 latency from pg_stat_statements, exported
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 16

PreOne ADR - Volume 3: Data Architecture v3.0
every 60 seconds to CloudWatch; slow-query alert fires on any query exceeding
5 seconds. (3) Capacity: dataset growth, WAL archive growth, replica lag trend,
index bloat estimate from pgstattuple; alerts fire on projected capacity
exhaustion within 30 days. All dashboards are linked from the on-call runbook
and reviewed in the weekly SRE review.
FUTURE EVOLUTION
The decision is stable for the foreseeable future. Three triggers would force a
revisit. (1) Dataset growth beyond 5 TB on the primary: triggers evaluation of
Aurora PostgreSQL or tenant-sharding across multiple Postgres clusters. (2)
pgvector workload exceeding the 100M-vectors-per-tenant ceiling: triggers
evaluation of a dedicated vector store (Pinecone, Weaviate, or OpenSearch with
the k-NN plugin). (3) A regulatory change requiring data residency in a region
where AWS RDS is unavailable: triggers evaluation of self-managed Postgres
on alternative cloud or on-premises. The most likely successor to this ADR is a
split: Postgres remains the OLTP and audit store, but vector workloads move to
a dedicated store as the AI roadmap matures.
RELATED ADRS
● ADR-042 - UUID Strategy (primary key design)
● ADR-043 - Tenant Isolation (RLS policy framework)
● ADR-050 - Indexing Strategy (B-tree, GIN, GiST, BRIN)
● ADR-051 - Partition Strategy (range partitioning by academic year)
● ADR-057 - Migration Strategy (Flyway)
● ADR-059 - Search Strategy (PostgreSQL FTS + Elasticsearch)
● ADR-060 - Reporting Database Strategy (read replica + materialized
views)
● ADR-148 - AI Assistant Architecture (pgvector dependency)
REFERENCES
● PostgreSQL 16 Documentation - The PostgreSQL Global Development
Group. 2024.
● AWS RDS for PostgreSQL User Guide - Amazon Web Services. 2024.
● PgBouncer Documentation - pgBouncer project. 2024.
● pgvector: Open-source vector similarity search for Postgres - Andrew
Kane. 2024.
● PreOne Engineering Handbook, Section 7 - Data Platform Operations.
Internal. 2025.
DECISION HISTORY
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 17

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Office of the Chief Architect |     |
| ----------- | --- | ----------------------------- | --- |
| Tech Lead   |     | Data Platform Lead            |     |
| ARB Chair   |     | Architecture Review Board     |     |
| Approved On |     | 2025-10-15                    |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● PostgreSQL 16 provisioned on AWS RDS (Done)
● PgBouncer deployed in transaction-pooling mode (Done)
● PostGIS, pgvector, pg_partman, pg_stat_statements extensions enabled
(Done)
● Cross-region read replica (eu) configured for DR (Done)
● Backup topology (WAL archive + daily snapshot) validated (Done)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  18

PreOne ADR - Volume 3: Data Architecture v3.0
● Quarterly restore drill scheduled (Next: 2026-Q4)
AD R -042
UUID Strategy
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt UUID v7 as the standard primary key type across every table in the
PreOne Postgres cluster. UUID v7 combines a 48-bit Unix millisecond
timestamp prefix with 74 bits of randomness, producing identifiers that are
globally unique, time-ordered, and indexable without the hot-spot pathology
of UUID v4. bigint identity columns remain only for legacy tables pending
migration; new tables must use UUID v7. The pg_idkit extension provides
the generator function.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
Primary key choice has consequences that propagate across the data layer:
index locality, replication topology, key-shardability, client-side generation,
and URL stability. PreOne's legacy platform used a mix of MySQL auto-
increment bigint, MongoDB ObjectId, and UUID v4, with predictably messy
results: foreign-key columns with mismatched types, indexes with poor locality,
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 19

PreOne ADR - Volume 3: Data Architecture v3.0
and a class of bugs where client-generated ObjectIds collided with server-
generated sequences. PostgreSQL 16 does not yet ship a built-in UUID v7
generator (the uuid_v7() function arrives in PostgreSQL 18), so we require an
extension. The pg_idkit extension is the de facto community standard, is
maintained, and exposes a uuid_generate_v7() function whose output is the
standard 128-bit UUID with the version nibble correctly set. UUID v7's
structure means the first 48 bits are millisecond timestamp, the next 12 bits are
random, and the remaining 62 bits are random; the result is monotonically
increasing within a millisecond window. The principal alternative was bigint
identity (auto-increment). Bigint is smaller (8 bytes vs 16), produces perfectly
ordered indexes, and is well understood. Its weaknesses for our use case are: it
leaks row-count information through sequential IDs (a tenant who sees
enrollment_id 47 can infer prior volume), it requires a centralised generator
that becomes a contention point under high write concurrency, and it cannot be
generated client-side without a round trip. UUID v7 addresses all three: no
information leakage, no centralised generator, and client-side generation is
safe.
BUSINESS DRIVERS
PreOne's institutional customers care about predictable performance at scale;
the hot-spot pathology of UUID v4 (random inserts into a B-tree index cause
page splits across the entire index) is a well-documented contributor to write-
latency variance at high concurrency. UUID v7's time-ordered prefix means
new inserts land at the right edge of the index, producing sequential-page
writes that are friendlier to SSD I/O and to Postgres's buffer management. The
expected write-latency reduction at our target concurrency is 15-25% based on
internal benchmarks. A secondary driver is client-side ID generation. PreOne's
offline-tolerant branch clients (ADR-045) must generate primary keys while
disconnected from the cloud primary; a server-generated key requires a round
trip per insert, which is intolerable over intermittent connections. UUID v7
generated client-side and reconciled server-side is the cleanest solution. A
tertiary driver is multi-tenant key sharding. If we ever tenant-shard the
Postgres cluster (the trigger is documented in ADR-041), the UUID v7 prefix
carries the timestamp and the suffix is random; we can shard on a hash of the
suffix without ordering problems. Sequential bigint keys would require careful
modulo-based shard assignment and would produce hotspots in the highest-
numbered shard.
PROBLEM STATEMENT
PreOne requires a primary key strategy that supports client-side generation,
time-ordered indexes, multi-tenant sharding, and zero information leakage
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 20

PreOne ADR  -  Volume 3: Data Architecture  v3.0
about row counts, while remaining indexable in PostgreSQL's B-tree without
the hot-spot pathology of UUID v4.
CONSTRAINTS
● All new tables must use UUID v7 as the primary key type.
● Legacy tables on bigint identity will be migrated during their next
schema change, not as a standalone project.
● The generator function must be deterministic given a clock; clock skew
beyond 5 seconds is treated as a bug.
● Foreign-key columns referencing UUID v7 tables must themselves be
UUID v7.
● The UUID v7 prefix must be treated as informational only; applications
must not parse it for timestamps.
● External APIs must accept UUID v7 in canonical hyphenated form only;
bare hex is rejected.
ASSUMPTIONS
● pg_idkit will remain maintained for the lifetime of PostgreSQL 16 on
our stack.
● PostgreSQL 18 will ship a built-in uuid_v7() function; we will migrate to
it then.
● Client-side UUID v7 generation libraries are available in every
language PreOne uses (TS, Go, Python).
● Clock skew on application hosts will remain below 5 seconds under
NTP discipline.
● The 16-byte storage cost of UUID versus 8-byte bigint is acceptable
given the other benefits.
OPTIONS CONSIDERED
| Option              | Pros               | Cons               | Verdict |
| ------------------- | ------------------ | ------------------ | ------- |
| Adopt UUID v7       | Time-ordered       | 16 bytes per key   | Adopted |
| (RFC 9562) as the   | index locality,    | (versus 8 for      |         |
| standard primary    | client-side        | bigint) increases  |         |
| key, generated via  | generation, no     | storage and index  |         |
| pg_idkit on the     | information        | size by            |         |
| server and          | leakage, sharding- | approximately      |         |
| equivalent          | friendly,          | 20% on the         |         |
| libraries on the    | standardised.      | average table;     |         |
| client.             |                    | requires an        |         |
extension until
PostgreSQL 18.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  21

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
Continue with  Smallest key size,  Leaks row counts,  Rejected
| bigint identity   | perfectly ordered,  | requires server    |     |
| ----------------- | ------------------- | ------------------ | --- |
| (auto-increment)  | well understood,    | round trip for     |     |
| columns.          | no extension        | client-generated   |     |
|                   | required.           | keys, centralised  |     |
generator
becomes a
contention point,
complicates future
sharding.
| Adopt UUID v4  | Standard,           | Random inserts     | Rejected |
| -------------- | ------------------- | ------------------ | -------- |
| (random).      | available in        | cause B-tree page  |          |
|                | Postgres core via   | splits across the  |          |
|                | uuid-ossp, no       | entire index,      |          |
|                | information         | producing write-   |          |
|                | leakage, client-    | latency variance   |          |
|                | side generation is  | at high            |          |
|                | safe.               | concurrency; the   |          |
pathology is well
documented.
| Adopt ULID         | Time-ordered,      | Not a UUID;         | Rejected |
| ------------------ | ------------------ | ------------------- | -------- |
| (Universally       | lexicographically  | would require a     |          |
| Unique             | sortable as a      | text column rather  |          |
| Lexicographically  | string, 26-        | than UUID type,     |          |
| Sortable           | character          | losing Postgres's   |          |
| Identifier).       | representation is  | native UUID         |          |
|                    | URL-friendly.      | operators. Stored   |          |
as text, indexes
are larger than
UUID.
DECISION
ADOPTED
Adopt UUID v7 (RFC 9562) as the standard primary key type across every
new table in the PreOne Postgres cluster, generated via the pg_idkit
extension's uuid_generate_v7() function on the server and equivalent
libraries on the client. We will migrate legacy bigint identity tables to UUID
v7 during their next schema change, not as a standalone project. The UUID
v7 prefix is informational only; applications must not parse it for
timestamps. External APIs accept UUID v7 in canonical hyphenated form
only.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  22

PreOne ADR - Volume 3: Data Architecture v3.0
DETAILED RATIONALE
UUID v7 was chosen because it is the only option that simultaneously satisfies
all five PreOne requirements: client-side generation, time-ordered index
locality, multi-tenant sharding, zero information leakage, and Postgres B-tree
friendliness. The 16-byte storage cost versus 8-byte bigint is real but bounded.
On the average PreOne table (eight columns, four of which are foreign keys to
other UUID tables), switching from bigint to UUID v7 increases row size from
approximately 96 bytes to approximately 160 bytes, a 67% increase in row
storage. However, the index size increase is smaller (B-tree indexes on UUID v7
are 30% larger than equivalent bigint indexes) because the index leaf pages are
densely packed. The total storage increase across the cluster is estimated at
18%, which is acceptable given the operational benefits. The index locality
benefit is the strongest argument. UUID v4's random inserts produce B-tree
page splits distributed across the entire index, which on a 100M-row table
means random I/O across thousands of 8KB pages per insert. UUID v7's time-
ordered inserts land at the right edge of the index, producing sequential I/O on
a small number of pages. Internal benchmarks on the enrollment table (40M
rows, 200 inserts per second) showed a 22% reduction in p99 insert latency
after switching from UUID v4 to UUID v7. Client-side generation is essential
for the offline-tolerant branch clients (ADR-045). A branch client that is
disconnected from the cloud primary for up to 72 hours must be able to
generate primary keys for new attendance, grading, and enrollment records
without a server round trip. UUID v7 generated client-side is safe because the
random suffix provides uniqueness even if the timestamp prefix collides. The
information-leakage concern is not academic. PreOne's customers are schools
that compete for students; a competitor who can infer enrollment volume from
sequential IDs has a business-intelligence advantage. UUID v7's random suffix
prevents this inference. (The timestamp prefix does leak approximate creation
time, but that is already available through the created_at audit column; the net
information leakage is zero.) The sharding benefit is forward-looking. If we
tenant-shard the Postgres cluster (the trigger is in ADR-041), UUID v7's
structure means we can shard on a hash of the random suffix without ordering
problems. Sequential bigint keys would require careful modulo-based shard
assignment that produces hotspots in the highest-numbered shard. ULID was a
serious contender because its lexicographic-sortability as a string is appealing
for URL-stable identifiers. However, ULID stored as text in Postgres loses the
native UUID operators and produces larger indexes than UUID. The string-
sortability benefit is achievable with UUID v7 via the
uuid_v7_extract_timestamp() helper; we do not need a separate ID format for it.
ARCHITECTURE DIAGRAM
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 23

PreOne ADR - Volume 3: Data Architecture v3.0
+-------------------------------------------------------------+ | UUID v7 STRUCTURE
(128 bits) | +-------------------------------------------------------------+ | 48 bits | 4
bits | 12 bits | 2 bits | 62 bits | | unix_ms | ver=7 | rand_a | var |
rand_b | | timestamp | | | | |
+-------------------------------------------------------------+ | | | | v
v v v Time-ordered Identifies Random Random prefix ->
UUID v7 suffix suffix sequential (within (across B-tree
ms window) ms windows) inserts | v
+-------------------------------------------------------------+ | GENERATION
| +-------------------------------------------------------------+ | Server-side: uuid_generate_v7()
via pg_idkit | | Client-side: uuidv7() libraries (TS, Go, Python) | |
Reconciled: server accepts client-generated UUID v7 | | on write;
no round trip required | +-------------------------------------------------------------+
| v +-------------------------------------------------------------+ | STORAGE & INDEXING
| +-------------------------------------------------------------+ | Column type: UUID (16 bytes)
| | Primary index: B-tree, time-ordered right-edge inserts | | Foreign keys:
UUID v7 only; bigint FK forbidden | | Index size: ~30% larger than
bigint; acceptable | +-------------------------------------------------------------+
SEQUENCE DIAGRAM
Client -> UUID v7 lib: uuidv7() (client-side) UUID v7 lib -> Client: 16-byte UUID
Client -> API: POST /enrollments {id: uuid, ...} API -> PgBouncer: INSERT INTO
enrollments (id, ...) VALUES (uuid, ...) PgBouncer -> RDS Primary: route RDS
Primary -> B-tree index: append to right edge B-tree index -> RDS Primary: ok
(sequential page write) RDS Primary -> WAL: insert row RDS Primary ->
PgBouncer: 201 Created PgBouncer -> API: ok API -> Client: 201 Created {id:
uuid} Client -> Local Store: cache (offline-tolerant) Note over Client,Local Store:
If offline, ID is preserved Note over Client,Local Store: Reconciled on reconnect
(ADR-045)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-042 — UUID Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Application | call | UUIDv7
Generator | | | | Service |------->| (timestamp + random) | | | |
(any BC) | +----------+-----------+ | | +----------------+ |
| | | emit | | v
| | +--------+----------+ | | | Postgres UUID
col | | | | (B-tree indexed) | | |
+-------------------+ | | | | +----------------+
+----------------------+ | | | Migration | read | Legacy UUID mapping | |
| | Service |------->| (v4 -> v7 bridge) | | | +----------------+
+----------------------+ | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Generation Flow: App -> UUIDv7 Generator (timestamp + random) -> 128-bit
ID App -> Repository (ID in INSERT) -> Postgres UUID column Postgres -> B-
tree index (sorted by time, monotonic) Migration Flow: Legacy row (UUIDv4)
-> UUIDv7 mapping table -> new UUIDv7 column Dual-write window (30 days)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 24

PreOne ADR - Volume 3: Data Architecture v3.0
-> cutover -> drop v4 column Lookup Flow: App -> Repository.findByID(v7) ->
Index scan -> row
DATABASE IMPACT
Every new table uses UUID v7 as the primary key, declared as id UUID
DEFAULT uuid_generate_v7() PRIMARY KEY. Foreign-key columns are UUID,
referencing the parent table's UUID primary key. Legacy bigint identity tables
retain their primary keys during their normal lifecycle; migration to UUID v7
occurs when the table is next touched for a schema change, with a dual-key
transition period where both the bigint and UUID columns coexist and the
UUID column is backfilled. The pg_idkit extension is installed by default on
every database in the cluster. The uuid_generate_v4() function from uuid-ossp
is disabled by default to prevent accidental use; teams who need a random
UUID (e.g., for opaque tokens) must use gen_random_uuid() from pgcrypto
instead, which is the cryptographically secure variant.
API IMPACT
External APIs accept UUID v7 in canonical hyphenated form (8-4-4-4-12) only.
Bare hex is rejected with 400. The API gateway validates UUID format with a
regex before routing to the application; invalid UUIDs never reach the service.
URL paths use lowercase UUID v7 (e.g., /enrollments/018f6b1c-5e3d-7a4f-
bc12-9d8e7f6a5b4c). The API never exposes the bigint primary keys of legacy
tables; those tables are wrapped in a view that exposes only the UUID v7
surrogate key. Pagination over UUID v7 uses keyset pagination (WHERE id > ?
ORDER BY id LIMIT ?), which is O(log n) on the B-tree index, versus OFFSET
pagination which is O(n) and unacceptable for large tables.
UI IMPACT
The UI never displays raw UUIDs to end users — they are internal identifiers.
However, the migration from UUIDv4 to UUIDv7 affects URL stability:
ADR-042 mandates that all public-facing URLs use UUIDv7 going forward, and
old UUIDv4 URLs redirect (HTTP 301) to their v7 equivalent for the duration of
the dual-write window (30 days). After cutover, v4 URLs return 410 Gone. The
admin UI was updated to display 'ID: ...' truncated to the first 8 characters of
the v7 (which is sortable and time-prefixed), giving admins a rough creation
timestamp at a glance. No user-facing forms were affected.
SECURITY IMPACT
UUID v7 eliminates the row-count information leakage that sequential bigint
keys would create. A tenant who sees enrollment_id 018f6b1c-... cannot infer
the prior enrollment volume because the random suffix is unpredictable. The
timestamp prefix does leak approximate creation time, but this is already
available through the created_at audit column (ADR-048), so the net
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 25

PreOne ADR - Volume 3: Data Architecture v3.0
information leakage is zero. UUID v7 keys are not a security control; they are
predictable enough that an attacker who knows the timestamp window and can
brute-force the random suffix (74 bits) could in principle enumerate IDs.
Sensitive resources (documents, transcripts) require an additional access-
control check at the API layer regardless of whether the ID is guessable; this is
enforced by the Effective Permission Resolver (ADR-067).
PERFORMANCE IMPACT
UUID v7 reduces write latency variance versus UUID v4 by 15-25% at high
concurrency, based on internal benchmarks on the enrollment table (40M rows,
200 inserts/second). The reduction comes from sequential B-tree page writes at
the right edge of the index, which benefit SSD I/O and Postgres buffer
management. Read latency is unchanged: point lookups on a UUID v7 primary
key are O(log n) on the B-tree index, identical to bigint. The 16-byte storage
cost increases table and index size by approximately 18% across the cluster,
which is acceptable. Foreign-key joins on UUID v7 are slightly slower than on
bigint due to the larger comparison cost, but the difference is below 5% on our
workload and within the noise floor of p99 latency. The total performance
impact is net-positive: write variance reduction outweighs the storage cost.
SCALABILITY ANALYSIS
UUID v7 scales cleanly to the multi-billion-row range per table, far beyond
PreOne's projected peak of 500M rows on the largest table (attendance). The
time-ordered prefix means inserts remain sequential regardless of table size, so
write performance does not degrade as the table grows. Client-side generation
eliminates the centralised-generator contention point that sequential bigint
would create at high write concurrency. Multi-tenant sharding on a hash of the
UUID v7 random suffix distributes writes evenly across shards without
hotspots. The 16-byte key size increases index memory footprint by
approximately 30% versus bigint, which slightly reduces the effective cache hit
ratio on the largest tables; this is monitored and mitigated by index-only scans
where possible. The strategy is stable for the foreseeable future; no UUID v8 or
successor format is on the horizon.
OPERATIONAL CONSIDERATIONS
The pg_idkit extension is installed by default on every database and is included
in the cluster provisioning Terraform module. Application teams do not
configure UUID generation; the default column value handles it. Client-side
UUID v7 libraries are published to the internal package registry for TypeScript,
Go, and Python. Clock skew on application hosts is monitored via the NTP offset
metric; sustained skew beyond 5 seconds triggers a node-level alert. The
uuid_v7_extract_timestamp() helper function is available in Postgres for
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 26

PreOne ADR  -  Volume 3: Data Architecture  v3.0
debugging and for partition-pruning decisions (ADR-051), but applications
must not rely on it for business logic because the prefix is informational only.
Legacy bigint-to-UUID migrations are tracked in the migration registry
(ADR-057) and verified by the quarterly schema audit.
RISKS
| Risk               | Likelihood | Impact | Mitigation           |
| ------------------ | ---------- | ------ | -------------------- |
| pg_idkit is        | Low        | Medium | Track pg_idkit       |
| unmaintained or    |            |        | release cadence; if  |
| incompatible with  |            |        | maintenance          |
| a future Postgres  |            |        | stalls, fork         |
| major version,     |            |        | internally or        |
| blocking           |            |        | migrate to the       |
| upgrades.          |            |        | uuid_v7() function   |
in PostgreSQL 18
when released.
| Client-side clock    | Medium | Medium | NTP discipline       |
| -------------------- | ------ | ------ | -------------------- |
| skew produces        |        |        | enforced on all      |
| UUID v7 values       |        |        | application hosts;   |
| with timestamps      |        |        | clock skew alert     |
| that drift, causing  |        |        | fires at 5 seconds.  |
| subtle ordering      |        |        | Queries that         |
| bugs in time-        |        |        | require strict       |
| ordered queries.     |        |        | ordering must use    |
the created_at
audit column, not
the UUID prefix.
| Storage cost       | Low | Low | Monitor storage     |
| ------------------ | --- | --- | ------------------- |
| increase from 8-   |     |     | growth monthly; if  |
| byte bigint to 16- |     |     | growth exceeds      |
| byte UUID strains  |     |     | projection by 20%,  |
| the cluster's      |     |     | accelerate          |
| storage budget     |     |     | partition pruning   |
| earlier than       |     |     | and archive         |
| projected.         |     |     | policies (ADR-053,  |
ADR-054).
| Legacy bigint-to-  | Medium | Medium | Migration registry  |
| ------------------ | ------ | ------ | ------------------- |
| UUID migrations    |        |        | tracks outstanding  |
| stall, leaving a   |        |        | bigint tables;      |
| permanent mix of   |        |        | quarterly audit     |
| key types that     |        |        | reports migration   |
| complicates        |        |        | progress to the     |
| foreign-key joins. |        |        | ARB. Stalled        |
migrations are
escalated.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  27

PreOne ADR - Volume 3: Data Architecture v3.0
TRADE-OFFS
We Gain We Lose
Time-ordered indexes with sequential 16-byte key size increases table and
right-edge inserts; 15-25% write-latency index storage by approximately 18%.
variance reduction.
Client-side generation enables offline- Requires pg_idkit extension until
tolerant branch clients without server PostgreSQL 18 ships built-in uuid_v7().
round trips.
Zero row-count information leakage via Timestamp prefix leaks approximate
the random suffix. creation time (already available via
created_at).
Sharding-friendly: hash of random suffix Larger foreign-key columns increase
distributes writes evenly across shards. join cost by less than 5% on our
workload.
REJECTED ALTERNATIVES
Bigint identity was rejected because it leaks row counts, requires server round
trips for client-generated keys, and complicates future tenant-sharding. UUID
v4 was rejected because its random inserts cause B-tree page splits across the
entire index, producing write-latency variance that is unacceptable at our
target concurrency. ULID was rejected because it requires a text column rather
than the native UUID type, losing Postgres's UUID operators and producing
larger indexes. Snowflake IDs (Twitter-style) were considered but rejected
because they require a centralised generator (the worker-ID assignment
problem) and embed a worker ID that complicates migration between
generator instances. The full reasoning for each rejection is captured in the
Options Considered table.
MIGRATION PLAN
Migration from the legacy mix of bigint, ObjectId, and UUID v4 to UUID v7
proceeds table-by-table, attached to each table's next schema change rather
than as a standalone project. Each migration follows the standard four-step
pattern: (1) add a UUID v7 column with a default of uuid_generate_v7() and
backfill existing rows; (2) add a unique constraint on the UUID column and
update all foreign-key references to use the UUID column via a join; (3) after a
30-day observation period with reconciliation jobs, drop the old primary key
and promote the UUID column to primary key; (4) update application code to
use the UUID column exclusively. The legacy MongoDB ObjectId columns are
migrated as part of the broader MongoDB-to-Postgres migration (ADR-041,
ADR-057); the ObjectId is preserved as a string column for traceability but is
not used as a primary key.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 28

PreOne ADR - Volume 3: Data Architecture v3.0
TESTING STRATEGY
UUID v7 generation is tested at three levels. (1) Unit: every client-side UUID v7
library is tested against the RFC 9562 test vectors, including the version nibble,
variant bits, and timestamp extraction. (2) Integration: the Postgres
uuid_generate_v7() function is tested for monotonicity within a millisecond
window and for cross-process uniqueness under concurrent inserts. (3)
Performance: the enrollment-table write-latency benchmark runs in CI on every
schema change; regression beyond 5% on p99 latency blocks the change.
Foreign-key joins on UUID v7 are tested in the integration suite against tables
of 10M, 100M, and 500M rows to verify that join performance scales within the
documented envelope. Clock-skew tolerance is tested by injecting 1, 5, and 10
seconds of skew and verifying that UUID ordering remains consistent with the
created_at audit column.
MONITORING & OBSERVABILITY
UUID v7 health is monitored through three metrics. (1) Generation rate: count
of uuid_generate_v7() calls per second per database, exported to CloudWatch;
alert fires if generation rate drops to zero on a database that should be writing
(indicates application-layer regression). (2) Index locality: the pgstattuple
extension reports the right-edge fragmentation of primary-key indexes; the
right-edge leaf pages should be > 95% full, indicating sequential inserts. (3)
Storage overhead: total bytes consumed by UUID columns versus bigint
columns in the legacy tables, tracked monthly. Client-side UUID v7 libraries
export generation count and clock-skew observations to the application
telemetry pipeline; sustained clock skew beyond 5 seconds triggers an
application-level alert. The pg_idkit extension version is tracked in the cluster
inventory and reviewed quarterly.
FUTURE EVOLUTION
The decision is stable for the foreseeable future. PostgreSQL 18 (expected
2025) ships a built-in uuid_v7() function; when our cluster is upgraded to 18, we
will migrate from pg_idkit's uuid_generate_v7() to the built-in, removing the
extension dependency. The UUID v7 format itself is standardised in RFC 9562
and is unlikely to change. A successor format (UUID v8, vendor-defined) is not
on the horizon for our use case. The most likely evolution is the addition of
UUID v6 (reordered timestamp-first variant of v1) for niche use cases where the
timestamp prefix must be in a different position, but no current PreOne use
case requires it.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent decision)
● ADR-043 - Tenant Isolation (tenant-scoped UUID generation)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 29

PreOne ADR - Volume 3: Data Architecture v3.0
● ADR-045 - Branch Isolation (offline-tolerant client-side UUID
generation)
● ADR-047 - Soft Delete (UUID v7 keys in soft-deleted rows)
● ADR-048 - Audit Columns (UUID v7 used in created_by, updated_by
where applicable)
● ADR-051 - Partition Strategy (UUID v7 prefix for partition pruning)
● ADR-057 - Migration Strategy (bigint-to-UUID migration pattern)
● ADR-067 - Effective Permission Resolver (access control on UUID-
keyed resources)
REFERENCES
● RFC 9562 - Universally Unique IDentifiers (UUIDs). IETF. 2024.
● Peabody, B. and Bowers, S. - UUID v7: Time-Ordered UUIDs. IETF
draft. 2023.
● pg_idkit Documentation - Tiaan Louw. 2024.
● PostgreSQL Documentation - UUID Type. The PostgreSQL Global
Development Group. 2024.
● PreOne Engineering Handbook, Section 7.2 - Primary Key Conventions.
Internal. 2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-16 Draft Data Platform Initial draft;
Lead options
enumerated;
consultation with
engineering team
2025-09-24 Proposed Data Platform Submitted to
Lead Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
2026-07-15 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1 ADRs
added; 34-section
template applied
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 30

PreOne ADR - Volume 3: Data Architecture v3.0
APPROVAL & SIGN-OFF
Architect Office of the Chief Architect
Tech Lead Data Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● UUIDv7 generator library adopted across all services (Done)
● All new tables use UUID v7 primary keys (Done)
● Legacy UUIDv4 -> v7 migration plan documented (In progress)
● Dual-write window for high-volume tables (In progress)
● Index rebuild for time-sorted queries (Done)
● Decommission UUIDv4 generation paths (Planned: 2026-Q4)
AD R -043
Tenant Isolation
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 31

PreOne ADR - Volume 3: Data Architecture v3.0
DECISION
Adopt a shared-cluster, schema-level tenant isolation strategy enforced by
PostgreSQL Row-Level Security (RLS) policies on every tenant-scoped
table. Each tenant row carries a tenant_id UUID v7 column that participates
in a composite primary key; RLS policies enforce that queries return only
rows whose tenant_id matches the session's active tenant. Cross-tenant
queries are forbidden at the application layer and are prevented at the
database layer by session settings. The strategy is a middle path between
database-per-tenant (operational cost) and no isolation (compliance risk).
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on tenant
onboarding pattern change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne is a multi-tenant SaaS where each tenant is an educational institution
(school district, university, or chain of schools). Tenants must be isolated from
each other at the data layer: a query by tenant A must never return tenant B's
data, even in the presence of application bugs. The isolation must hold across
OLTP queries, reporting queries, batch jobs, logical replication, and backup
restoration. The isolation must be auditable: a compliance auditor must be able
to verify, by inspecting the database, that tenant isolation is enforced. Three
isolation models were considered. (1) Database-per-tenant: each tenant gets a
dedicated Postgres database. Strong isolation, but operational cost scales
linearly with tenants (200 tenants = 200 databases to patch, back up, and
monitor). Cross-tenant reporting requires federated queries across databases.
(2) Shared-database, shared-schema with RLS: all tenants share one database
and one schema; isolation is enforced by RLS policies on a tenant_id column.
Operational cost is constant in the number of tenants, but a single RLS policy
bug can leak data across tenants. (3) Shared-database, schema-per-tenant:
each tenant gets a dedicated schema in a shared database. Middle ground, but
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 32

PreOne ADR - Volume 3: Data Architecture v3.0
schema-per-tenant complicates migrations (200 schemas to migrate per
change) and query routing. PreOne's projected tenant count at steady state is
500 (current 180, growing to 500 by end of 2027). Database-per-tenant at 500
tenants would require 500 RDS instances, which is operationally infeasible.
Schema-per-tenant would require 500 schema migrations per Flyway run,
which is too slow. Shared-schema with RLS is the only model that scales
operationally, provided the RLS policies are correct and tested. The risk of an
RLS policy bug is real but manageable. RLS policies are declarative, testable,
and auditable. The PreOne RLS policy framework includes a property-based
test that generates random tenant pairs and verifies that queries under one
tenant's session never return the other tenant's rows. The test runs in CI on
every migration.
BUSINESS DRIVERS
PreOne's institutional customers sign contracts that include data-isolation
clauses: a tenant's data must not be accessible to other tenants, and the
isolation must be verifiable by audit. A single tenant-isolation incident would be
a material breach of contract and would trigger contractual penalties. The data
layer must therefore enforce isolation by construction, not by convention. A
secondary driver is operational efficiency. Shared-schema isolation allows the
SRE team to operate one Postgres cluster (with replicas) rather than hundreds,
concentrating operational expertise and reducing the per-tenant cost. The
marginal cost of adding a tenant is one row in the tenants table and one entry in
the RLS policy cache, not a new database instance. A tertiary driver is
reporting. Many PreOne reports aggregate across tenants (e.g., market-
benchmark reports sold to district superintendents). These reports require
cross-tenant queries, which are straightforward in a shared schema (with
explicit superuser bypass) and painful in a database-per-tenant topology.
PROBLEM STATEMENT
PreOne requires a tenant isolation strategy that enforces strict data separation
between tenants at the database layer, scales operationally to 500 tenants,
supports cross-tenant reporting when explicitly authorised, and is auditable by
compliance reviewers.
CONSTRAINTS
● Every tenant-scoped table must have a tenant_id UUID v7 column
participating in the composite primary key.
● RLS policies must be enabled on every tenant-scoped table; the policy
must filter on tenant_id = current_setting('app.tenant_id').
● Application connections must set app.tenant_id at session start; queries
without the setting return zero rows.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 33

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● Superuser and rls_bypass roles are forbidden for application use; they
are reserved for SRE break-glass.
● Cross-tenant queries require explicit rls_bypass role and are logged to
a separate audit table.
● Logical replication exports are tenant-scoped; a replication slot exports
only one tenant's rows.
ASSUMPTIONS
● PostgreSQL RLS is correct and free of bypass bugs; we will track
Postgres security advisories.
● Application code can reliably set app.tenant_id at session start before
any query is issued.
● PgBouncer transaction pooling preserves session settings within a
transaction (via SET LOCAL).
● Property-based testing of RLS policies will catch the vast majority of
policy bugs.
● Tenant count will not exceed 5000 by 2030; beyond that, we will revisit
sharding.
OPTIONS CONSIDERED
| Option            | Pros                | Cons                  | Verdict |
| ----------------- | ------------------- | --------------------- | ------- |
| Shared-cluster,   | Operational cost    | A single RLS          | Adopted |
| shared-schema     | constant in tenant  | policy bug can        |         |
| with RLS on       | count; cross-       | leak data across      |         |
| tenant_id (the    | tenant reporting    | tenants; requires     |         |
| chosen strategy). | via explicit        | discipline in policy  |         |
|                   | bypass; isolation   | authorship and        |         |
|                   | is declarative and  | testing.              |         |
testable.
| Database-per-      | Strongest          | Operational cost    | Rejected |
| ------------------ | ------------------ | ------------------- | -------- |
| tenant: each       | isolation; a       | scales linearly     |          |
| tenant gets a      | database-level     | with tenants;       |          |
| dedicated          | breach does not    | cross-tenant        |          |
| Postgres database  | leak across        | reporting requires  |          |
| on a shared        | tenants; per-      | federated queries;  |          |
| cluster or         | tenant backup and  | migration runs N    |          |
| dedicated          | restore is         | times per change.   |          |
| clusters.          | straightforward.   |                     |          |
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  34

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option            | Pros              | Cons               | Verdict  |
| ----------------- | ----------------- | ------------------ | -------- |
| Schema-per-       | Middle ground     | Migration runs N   | Rejected |
| tenant: each      | between database- | times per change   |          |
| tenant gets a     | per-tenant and    | (500 schemas);     |          |
| dedicated schema  | shared-schema;    | query routing      |          |
| in a shared       | some isolation    | complexity; cross- |          |
| database.         | benefit from      | tenant reporting   |          |
|                   | schema            | still painful;     |          |
|                   | separation.       | isolation is not   |          |
stronger than RLS
in practice.
| No database-level   | Simplest schema;  | A single         | Rejected |
| ------------------- | ----------------- | ---------------- | -------- |
| isolation; rely on  | no RLS overhead;  | application bug  |          |
| application-layer   | maximum query     | can leak data    |          |
| filtering.          | flexibility.      | across tenants;  |          |
not auditable at
the database
layer; fails
compliance
review.
DECISION
ADOPTED
Adopt a shared-cluster, shared-schema tenant isolation strategy enforced
by PostgreSQL Row-Level Security (RLS) policies on every tenant-scoped
table. Every tenant-scoped table will have a tenant_id UUID v7 column that
participates in a composite primary key. RLS policies will filter on tenant_id
=   current_setting('app.tenant_id')   and   will   be   enabled   by   default.
Application connections will set app.tenant_id at session start via SET
LOCAL   within   each   transaction.   Cross-tenant   queries   require   the
rls_bypass role and are logged to a separate audit table. Logical replication
exports are tenant-scoped. The strategy scales operationally to 5000
tenants before sharding becomes necessary.
DETAILED RATIONALE
Shared-schema RLS was chosen because it is the only model that satisfies
PreOne's four hard requirements simultaneously: strict isolation at the
database layer, operational scalability to 500 tenants, support for cross-tenant
reporting, and auditability.  Database-per-tenant was rejected primarily on
operational cost. At 500 tenants, we would operate 500 RDS instances, each
requiring patching, backup verification, DR rehearsal, and on-call attention.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  35

PreOne ADR - Volume 3: Data Architecture v3.0
The SRE team of four cannot operate 500 databases well; the result would be
patchy patching, unverified backups, and DR rehearsals that never happen. The
cost of a single missed patch on a tenant database is a security incident; the
cost of an RLS policy bug is also a security incident, but RLS policies are
testable in CI in a way that 500 database instances are not. Schema-per-tenant
was a serious contender. Its isolation benefit over shared-schema RLS is real
but small: a schema-level breach still requires the attacker to have credentials,
and an attacker with credentials can also bypass RLS via the rls_bypass role.
The operational cost of schema-per-tenant (500 migrations per Flyway run,
query routing complexity, cross-tenant reporting pain) outweighs the small
isolation benefit. The decision came down to: schema-per-tenant is isolation-by-
schema plus RLS-by-convention; shared-schema is isolation-by-RLS plus
testing-by-property. The latter is more auditable because the isolation policy is
declarative and inspectable. Application-layer-only filtering was rejected
because it is not auditable at the database layer. A compliance auditor must be
able to verify isolation by inspecting the database, not by reading application
code. RLS policies are inspectable; application-layer filters are not.
Furthermore, application-layer filters are bypassable by any code path that
forgets to apply the filter, and the PreOne codebase has historically had such
bugs. The principal risk of shared-schema RLS is the single-policy-bug risk: one
incorrect RLS policy can leak data across tenants. This risk is mitigated by
three controls. (1) Property-based testing: the CI pipeline generates random
tenant pairs and verifies that queries under one tenant's session never return
the other tenant's rows. (2) Policy templating: RLS policies are generated from
a template, not hand-authored per table, reducing the surface area for bugs. (3)
Quarterly audit: an external auditor reviews the RLS policy set against the table
inventory and reports any gaps. The cross-tenant reporting use case is served
by the rls_bypass role, which is granted only to the reporting service account
and is logged to a separate audit table on every use. The reporting service
account is constrained to read-only access. Market-benchmark reports that
aggregate across tenants use this account; the audit log entry for each report
includes the report name, the requesting user, and the tenant set included.
Logical replication is tenant-scoped via the PUBLICATION ... WHERE clause,
which filters rows by tenant_id. This enables tenant-scoped extraction (e.g., for
a tenant who requests data export under GDPR) without exporting other
tenants' data. The replication slot for a tenant export is created with a WHERE
clause and is torn down after the export completes.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | TENANT ISOLATION
TOPOLOGY | +-------------------------------------------------------------+ |
| | App (tenant A) App (tenant B) App (tenant C) ... | | | |
| | | v v v | |
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 36

PreOne ADR - Volume 3: Data Architecture v3.0
+---------------------------------------------+ | | | PgBouncer (tx pool) |
| | | SET LOCAL app.tenant_id = <uuid> | | |
+---------------------------------------------+ | | | | | |
| +--------------+--------------+ | | v
| | +---------------------------------------------+ | | | RDS PostgreSQL 16
| | | | +---------------------------------------+ | | | | | enrollments
| | | | | | (tenant_id, id) PK | | | | | | RLS: tenant_id =
app.tenant_id | | | | | +---------------------------------------+ | | | | |
gradebook | | | | | | (tenant_id, id) PK | |
| | | | RLS: tenant_id = app.tenant_id | | | | |
+---------------------------------------+ | | | | | audit_log | |
| | | | (tenant_id, id) PK | | | | | | RLS: tenant_id =
app.tenant_id | | | | | +---------------------------------------+ | | |
+---------------------------------------------+ | | |
| | v | | +---------------------------------------------+
| | | rls_bypass role (reporting only) | | | | every use logged to
cross_tenant_audit | | | +---------------------------------------------+ |
+-------------------------------------------------------------+
SEQUENCE DIAGRAM
App -> PgBouncer: BEGIN App -> PgBouncer: SET LOCAL app.tenant_id =
'uuid-A' PgBouncer -> RDS Primary: route (tx-pool) RDS Primary -> Session:
app.tenant_id = 'uuid-A' App -> PgBouncer: SELECT * FROM enrollments
PgBouncer -> RDS Primary: SELECT * FROM enrollments RDS Primary -> RLS
Policy: filter tenant_id = 'uuid-A' RLS Policy -> RDS Primary: rows for tenant A
only RDS Primary -> PgBouncer: result set PgBouncer -> App: rows App ->
PgBouncer: COMMIT PgBouncer -> RDS Primary: commit (clears SET LOCAL)
Reporting Service -> PgBouncer: BEGIN Reporting Service -> PgBouncer: SET
ROLE rls_bypass PgBouncer -> RDS Primary: route RDS Primary -> Audit Log:
log rls_bypass use RDS Primary -> RLS Policy: bypassed (return all rows) RDS
Primary -> Reporting Service: aggregated rows
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-043 — Tenant Isolation -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | API Gateway | inject | Tenant
Context | | | | |------->| (thread-local + JWT) | | |
+----------------+ +----------+-----------+ | | |
| | | sets | | v
| | +----------------+ +----------+-----------+ | | | Repository | filter | Row-
Level Security | | | | (per BC) |------->| Policy (tenant_id) | | |
+----------------+ +----------+-----------+ | | |
| | v | | +--------+----------+
| | | Postgres RLS | | | | (per-tenant
scope)| | | +-------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Request Flow: Client -> API Gateway (extract tenant_id from JWT) API
Gateway -> Tenant Context (thread-local set) App Service -> Repository
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 37

PreOne ADR - Volume 3: Data Architecture v3.0
(tenant_id in scope) Repository -> Postgres RLS policy (auto-filter) Postgres ->
rows (only current tenant) Cross-Tenant Admin Flow: Platform Admin -> Admin
API (special role) Admin Service -> Repository (bypass RLS via SET LOCAL)
Postgres -> rows (all tenants, audited)
DATABASE IMPACT
Every tenant-scoped table has a tenant_id UUID v7 column as the first column
of the composite primary key (tenant_id, id). RLS is enabled on every tenant-
scoped table via ALTER TABLE ... ENABLE ROW LEVEL SECURITY. The RLS
policy is generated from a template: CREATE POLICY tenant_isolation ON
<table> USING (tenant_id = current_setting('app.tenant_id')::uuid). The
app.tenant_id session setting is set via SET LOCAL within each transaction;
PgBouncer transaction pooling preserves it. Tables that are not tenant-scoped
(e.g., the tenants table itself, reference-data tables like countries) are exempted
from RLS via the FORCE ROW LEVEL SECURITY = OFF flag. Foreign keys that
cross tenant boundaries (rare; only for shared reference data) are not tenant-
scoped and do not carry the tenant_id column. The rls_bypass role is granted
only to the reporting service account and is logged via a Postgres event trigger
on SET ROLE.
API IMPACT
API requests must include an X-Tenant-Id header (validated against the
authenticated user's tenant membership). The API gateway sets app.tenant_id
on the Postgres session before any query is issued. Requests without the header
are rejected with 400. Requests where the header does not match the
authenticated user's tenant are rejected with 403. Cross-tenant API calls (e.g.,
the market-benchmark report endpoint) are routed to the reporting service,
which uses the rls_bypass role and is rate-limited. Tenant-scoped endpoints
return 404 rather than 403 for resources that exist in another tenant, to avoid
leaking the existence of the resource. Bulk endpoints that span tenants are
forbidden; bulk operations are tenant-scoped only.
UI IMPACT
Tenant isolation is invisible to end users by design — a tenant's users see only
their own data, and the UI never offers a 'switch tenant' affordance (except for
platform admins). The platform admin UI gained a tenant-picker dropdown in
the top bar (showing tenant name + ID); selecting a tenant sets the X-Tenant-ID
header on all subsequent requests. The admin UI displays a prominent banner
('Viewing as Tenant: X') whenever a platform admin impersonates a tenant
scope, to prevent accidental cross-tenant actions. No end-user UI changes were
required; tenant isolation is a server-side concern.
SECURITY IMPACT
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 38

PreOne ADR - Volume 3: Data Architecture v3.0
Tenant isolation is the single most important security property of the PreOne
platform. RLS enforces it at the database layer, which is the correct layer
because it is the lowest layer that has access to all data. Application-layer
filtering is bypassable by any code path that forgets to apply the filter; RLS is
bypassable only by the rls_bypass role, which is logged and audited. The
principal residual risk is an RLS policy bug, which is mitigated by property-
based testing, policy templating, and quarterly audit. The rls_bypass role is the
highest-privilege role in the system; its use is logged to a separate audit table
(cross_tenant_audit) that is itself RLS-protected (only the security team can
read it). Superuser access is reserved for SRE break-glass and is also logged.
The tenants table is RLS-exempt but access is restricted to the tenant-
management service account.
PERFORMANCE IMPACT
RLS adds a constant per-row filter cost to every query on a tenant-scoped table.
On a tenant-scoped table with 10M rows and a tenant_id-indexed B-tree, the
filter cost is one index lookup per query, adding approximately 0.1ms to query
latency. On a tenant-scoped table with a composite primary key (tenant_id, id),
point lookups are O(log n) on the composite index and the RLS filter is satisfied
by the index condition itself, adding zero cost. The net performance impact is
negligible (less than 2% on p99 latency) on the PreOne workload. The cost of
RLS is in planning time, not execution time: the planner must consider the RLS
policy when choosing an index. This adds approximately 0.5ms to planning time
on tenant-scoped tables, which is acceptable. The composite primary key
(tenant_id, id) is also the optimal index for the most common query pattern
(point lookup by id within a tenant), so the index does not add storage overhead.
SCALABILITY ANALYSIS
Shared-schema RLS scales operationally to 5000 tenants before sharding
becomes necessary. The per-tenant cost is one row in the tenants table and one
entry in the RLS policy cache (Postgres caches RLS policy evaluations per
session, so the cache hit ratio is high). The dataset size per tenant averages 2
GB at PreOne's projected steady state, so 500 tenants = 1 TB total, well within a
single RDS instance's capacity. Beyond 5000 tenants, the dataset would exceed
10 TB and we would tenant-shard by hashing tenant_id to one of N Postgres
clusters; the trigger is documented in ADR-041. Within a shard, RLS continues
to enforce isolation. Cross-shard queries are served by the reporting service via
federated queries or by a separate analytics store (ADR-060). The strategy is
stable for the foreseeable future.
OPERATIONAL CONSIDERATIONS
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 39

PreOne ADR  -  Volume 3: Data Architecture  v3.0
The SRE team owns the RLS policy template and the property-based test that
verifies isolation. Application teams own the schema migrations that add
tenant-scoped tables; the migration must include the tenant_id column, the
composite primary key, the RLS policy (generated from the template), and the
test case that verifies isolation. The CI pipeline runs the property-based
isolation test on every migration; a failure blocks the migration. The rls_bypass
role is granted only to the reporting service account, which is rotated quarterly.
The cross_tenant_audit table is reviewed weekly by the security team; any
unexpected rls_bypass use triggers an investigation. Quarterly, an external
auditor reviews the RLS policy set against the table inventory and reports any
gaps; the report is filed with the compliance team.
RISKS
| Risk                | Likelihood | Impact | Mitigation            |
| ------------------- | ---------- | ------ | --------------------- |
| An RLS policy bug   | Low        | High   | Property-based        |
| leaks data across   |            |        | isolation test in CI  |
| tenants, causing a  |            |        | on every              |
| material breach of  |            |        | migration; policy     |
| contract.           |            |        | templating            |
reduces authoring
errors; quarterly
external audit of
the policy set.
| PgBouncer          | Medium | High | SET LOCAL (not    |
| ------------------ | ------ | ---- | ----------------- |
| transaction        |        |      | SET) is used      |
| pooling fails to   |        |      | within each       |
| preserve           |        |      | transaction;      |
| app.tenant_id      |        |      | integration test  |
| across a           |        |      | verifies that     |
| transaction        |        |      | app.tenant_id is  |
| boundary, causing  |        |      | reset between     |
| queries to return  |        |      | transactions.     |
zero rows or
wrong-tenant
rows.
| The rls_bypass      | Low | High | rls_bypass is     |
| ------------------- | --- | ---- | ----------------- |
| role is abused for  |     |      | granted only to   |
| non-reporting       |     |      | the reporting     |
| queries,            |     |      | service account;  |
| weakening           |     |      | every use is      |
| isolation.          |     |      | logged to         |
cross_tenant_audit
; weekly review by
security team.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  40

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk             | Likelihood | Impact | Mitigation           |
| ---------------- | ---------- | ------ | -------------------- |
| A future tenant  | Low        | Medium | Track tenant         |
| count beyond     |            |        | count quarterly; if  |
| 5000 forces an   |            |        | growth exceeds       |
| unplanned        |            |        | projection,          |
| sharding         |            |        | accelerate           |
| migration.       |            |        | sharding design      |
(ADR-041 future
evolution).
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Operational cost constant in tenant  A single RLS policy bug can leak data
count; one cluster to operate, patch,  across tenants; requires disciplined
| back up. |     | testing. |     |
| -------- | --- | -------- | --- |
Cross-tenant reporting via explicit,  rls_bypass is a high-privilege role whose
| audited rls_bypass role. |     | use must be carefully monitored. |     |
| ------------------------ | --- | -------------------------------- | --- |
Isolation is declarative and auditable at  RLS adds approximately 0.5ms planning
| the database layer. |     | overhead per query on tenant-scoped  |     |
| ------------------- | --- | ------------------------------------ | --- |
tables.
Tenant-scoped logical replication  Composite primary keys (tenant_id, id)
enables clean data-export workflows. are slightly more complex than single-
column keys.
REJECTED ALTERNATIVES
Database-per-tenant was rejected on operational cost at 500 tenants (500 RDS
instances to operate). Schema-per-tenant was rejected on migration cost (500
schemas per Flyway run) and query-routing complexity, with isolation benefit
not materially greater than RLS. Application-layer-only filtering was rejected
because it is not auditable at the database layer and is bypassable by any code
path that forgets the filter. A hybrid model (database-per-tenant for the largest
tenants, shared-schema for the rest) was considered but rejected because it
would require maintaining two isolation models and would complicate the
reporting service. The full reasoning for each rejection is captured in the
Options Considered table.
MIGRATION PLAN
Migration from the legacy MongoDB + MySQL mix to the shared-schema RLS
model proceeds in four phases over four quarters, aligned with the broader
PostgreSQL migration (ADR-041). Phase 1 (Q1): add the tenant_id column and
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  41

PreOne ADR - Volume 3: Data Architecture v3.0
RLS policy to the three pilot contexts (configuration, notifications, feature-
flags); verify isolation with the property-based test. Phase 2 (Q2): migrate the
audit-log and reference-data contexts, which are the highest-volume tenant-
scoped tables; this exercises the RLS policy at scale. Phase 3 (Q3): migrate the
enrollment and gradebook contexts, which are the highest-complexity
transactional workloads; dual-write during cut-over with reconciliation jobs
that verify isolation. Phase 4 (Q4): decommission the legacy engines; archive
the final snapshots to S3 Glacier with a 7-year retention per ADR-053. Rollback
per phase is to the prior engine for 30 days after cut-over.
TESTING STRATEGY
Tenant isolation is tested at three levels. (1) Unit: every tenant-scoped table's
RLS policy is verified by a property-based test that generates random tenant
pairs, inserts rows for both tenants, and asserts that queries under one tenant's
session return only that tenant's rows. (2) Integration: the CI pipeline runs the
full isolation suite on every migration; a failure blocks the migration. (3) Chaos:
a quarterly red-team exercise attempts to extract cross-tenant data via
application bugs, SQL injection, and session-setting manipulation; findings are
filed as security issues. The property-based test is the primary control; it has
caught three RLS policy bugs in pre-production since its introduction. The
chaos exercise has not yet found a successful cross-tenant extraction; the most
recent exercise identified a session-setting manipulation vector that was
patched in the same quarter.
MONITORING & OBSERVABILITY
Tenant isolation health is monitored through three metrics. (1) RLS policy
coverage: the percentage of tenant-scoped tables with an active RLS policy;
target 100%, current 100%. (2) rls_bypass usage: count of rls_bypass role
activations per hour, broken down by source service; alert fires on any
activation outside the reporting service's normal pattern. (3) Cross-tenant
query attempts: count of queries that would have returned cross-tenant rows
but were blocked by RLS; this metric is derived from the pg_stat_statements
extension by comparing actual row counts to expected row counts under the
session's tenant_id. Alerts fire on: any rls_bypass use outside business hours,
any cross-tenant query attempt that is not a known reporting query, and any
tenant-scoped table that loses its RLS policy (detected by a daily introspection
job).
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is
tenant-sharding when the cluster reaches 5 TB or 5000 tenants; the trigger is
documented in ADR-041. Within a shard, RLS continues to enforce isolation, so
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 42

PreOne ADR - Volume 3: Data Architecture v3.0
the sharding migration is a topology change, not a policy change. A second
possible evolution is the introduction of column-level encryption for the most
sensitive PII (e.g., student names), which would complement RLS rather than
replace it; this is currently under evaluation in ADR-079 (PII Protection). A third
possible evolution is the use of PostgreSQL 17's MERGE ... RETURNING for
atomic cross-tenant operations, which would simplify some reporting queries;
this is a minor optimisation, not a policy change.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-042 - UUID Strategy (tenant_id is UUID v7)
● ADR-044 - School Isolation (sub-tenant isolation)
● ADR-045 - Branch Isolation (sub-tenant isolation)
● ADR-046 - Academic Year Isolation (temporal isolation)
● ADR-048 - Audit Columns (tenant_id is a standard audit column)
● ADR-067 - Effective Permission Resolver (enforces tenant scoping at
the API layer)
● ADR-079 - PII Protection (complements RLS for sensitive columns)
REFERENCES
● PostgreSQL Documentation - Row Security Policies. The PostgreSQL
Global Development Group. 2024.
● AWS RDS for PostgreSQL - Multi-Tenant SaaS Patterns. Amazon Web
Services. 2024.
● Boroughs, A. - Building Multi-Tenant SaaS Applications with
PostgreSQL. AWS Whitepaper. 2023.
● PreOne Engineering Handbook, Section 7.3 - Tenant Isolation. Internal.
2025.
● PreOne Security Policy, Section 4 - Tenant Data Separation. Internal.
2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-16 Draft Data Platform Initial draft;
Lead options
enumerated;
consultation with
engineering team
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 43

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Date       | Status   | Actor          | Notes         |
| ---------- | -------- | -------------- | ------------- |
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Office of the Chief Architect |     |
| ----------- | --- | ----------------------------- | --- |
| Tech Lead   |     | Data Platform Lead            |     |
| ARB Chair   |     | Architecture Review Board     |     |
| Approved On |     | 2025-10-15                    |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● tenant_id column added to all tenant-scoped tables (Done)
● Postgres RLS policies deployed for all tenant tables (Done)
● Tenant Context middleware deployed (Done)
● Integration tests verify tenant isolation (Done — 247 tests)
● Quarterly RLS policy audit scheduled (Next: 2026-Q4)
● Bypass-RLS admin paths audited and documented (Done)
AD R -044
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  44

PreOne ADR - Volume 3: Data Architecture v3.0
School Isolation
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a sub-tenant isolation layer for schools within a tenant. Each tenant
(district or chain) may contain multiple schools; every school-scoped table
carries a school_id UUID v7 column that participates in a composite
primary key with tenant_id. Row-Level Security policies on school-scoped
tables filter on school_id = ANY(current_setting('app.school_ids')::uuid[])
allowing a session to access multiple schools when the user's role permits.
School isolation is enforced in addition to tenant isolation (ADR-043), never
instead of.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on tenant
onboarding pattern change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
A PreOne tenant is an educational institution that may span multiple schools: a
school district has 5-50 schools, a university has 3-20 colleges, a chain of
private schools has 2-100 branches. Users within a tenant must be scoped to
one or more schools: a principal sees only their school, a district superintendent
sees all schools in the district, a regional director sees a subset. The data layer
must enforce school scoping in addition to tenant scoping (ADR-043); a
principal's query must never return another school's enrollment data, even
within the same tenant. The challenge is that school scoping is role-dependent:
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 45

PreOne ADR - Volume 3: Data Architecture v3.0
the same user may have access to one school in one role and to all schools in
another. The school-scoping rule must therefore be flexible: a session may be
scoped to a single school, to a list of schools, or to all schools within the tenant.
PostgreSQL RLS policies support this via the ANY() operator on an array
session setting: school_id = ANY(current_setting('app.school_ids')::uuid[]).
When the session is scoped to all schools, the array contains a sentinel value
that matches all rows (e.g., the tenant's root school_id, which is reserved). The
alternative considered was to enforce school scoping only at the application
layer (the Effective Permission Resolver, ADR-067), without database-level
RLS. This was rejected for the same reason that application-layer-only tenant
filtering was rejected in ADR-043: it is not auditable at the database layer and is
bypassable by any code path that forgets the filter. School isolation is enforced
at the database layer via RLS, in addition to tenant isolation. A subtlety:
school_id is nullable on tables that are tenant-scoped but not school-scoped
(e.g., the tenants table itself, the schools reference table, district-wide
configuration). RLS policies on school-scoped tables must accept NULL
school_id (meaning 'applies to all schools in the tenant') and treat it as
matching any session scope.
BUSINESS DRIVERS
PreOne's district customers require that a principal can access only their
school's data, even though the principal and the superintendent share the same
tenant. This is a contractual requirement for FERPA compliance in the US K-12
market: a principal is not authorised to see another principal's student records.
The data layer must enforce this; relying on application-layer filtering alone has
produced at least two incidents in the legacy platform where a configuration
change accidentally exposed cross-school data. A secondary driver is the
university market, where colleges within a university are similarly isolated. A
dean of engineering must not see the law school's gradebook, even though both
are within the same university tenant. The school-isolation pattern generalises
cleanly to this use case. A tertiary driver is the chain-of-private-schools market,
where each branch (school) is independently managed but reports to a
corporate parent. Branch managers see only their branch; corporate sees all
branches. This is the same pattern with different terminology (branch vs
school), and is generalised in ADR-045 (Branch Isolation).
PROBLEM STATEMENT
PreOne requires a sub-tenant isolation layer that enforces school scoping at the
database layer, supports role-dependent scoping (single school, multiple
schools, or all schools in the tenant), composes cleanly with tenant isolation,
and is auditable by compliance reviewers.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 46

PreOne ADR - Volume 3: Data Architecture v3.0
CONSTRAINTS
● Every school-scoped table must have a school_id UUID v7 column
(nullable for tenant-wide data).
● RLS policies on school-scoped tables must filter on school_id =
ANY(current_setting('app.school_ids')::uuid[]).
● NULL school_id means 'applies to all schools in the tenant' and must
match any session scope.
● The session setting app.school_ids is set at session start based on the
user's role assignments.
● School isolation is enforced in addition to tenant isolation (ADR-043),
never instead of.
● Cross-school queries within a tenant require the rls_bypass role and are
logged.
ASSUMPTIONS
● The number of schools per tenant will not exceed 500; the ANY() array
lookup is O(n) in the array size.
● PostgreSQL RLS composes correctly when multiple policies apply
(tenant AND school).
● The Effective Permission Resolver (ADR-067) can reliably compute the
school_ids array for a session.
● School-scoped tables are a strict subset of tenant-scoped tables; no
school-scoped table is tenant-public.
● Property-based testing of school isolation is feasible within the same
framework as tenant isolation.
OPTIONS CONSIDERED
Option Pros Cons Verdict
Database-level Auditable at the Adds a second Adopted
RLS on school_id database layer; RLS policy to
with ANY() array composes with every school-
session setting tenant RLS; scoped table;
(the chosen supports role- planning overhead
strategy). dependent increases slightly.
scoping via array
session setting.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 47

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option |     | Pros | Cons |     | Verdict |     |
| ------ | --- | ---- | ---- | --- | ------- | --- |
Application-layer- No additional RLS  Not auditable at  Rejected
| only school        |     | policies; maximum   | the database       |     |     |     |
| ------------------ | --- | ------------------- | ------------------ | --- | --- | --- |
| filtering via the  |     | query flexibility;  | layer; bypassable  |     |     |     |
| Effective          |     | simpler schema.     | by any code path   |     |     |     |
| Permission         |     |                     | that forgets the   |     |     |     |
| Resolver.          |     |                     | filter; fails      |     |     |     |
compliance
review.
| Schema-per-      |     | Schema-level     | Migration runs N   |     | Rejected |     |
| ---------------- | --- | ---------------- | ------------------ | --- | -------- | --- |
| school within a  |     | isolation; a     | times per school   |     |          |     |
| shared tenant    |     | schema-level     | per change; query  |     |          |     |
| schema.          |     | breach does not  | routing            |     |          |     |
|                  |     | leak across      | complexity; cross- |     |          |     |
|                  |     | schools.         | school reporting   |     |          |     |
pain; does not
scale to 500
schools per
tenant.
| Database-per-     |     | Strongest          | Two isolation       |     | Rejected |     |
| ----------------- | --- | ------------------ | ------------------- | --- | -------- | --- |
| school for the    |     | isolation for the  | models to           |     |          |     |
| largest tenants,  |     | largest tenants;   | maintain;           |     |          |     |
| RLS for the rest. |     | RLS suffices for   | complicates the     |     |          |     |
|                   |     | the rest.          | reporting service;  |     |          |     |
operational cost
on the largest
tenants is high.
DECISION
ADOPTED
Adopt a sub-tenant isolation layer for schools within a tenant, enforced by
PostgreSQL Row-Level Security policies on every school-scoped table.
Every school-scoped table will have a nullable school_id UUID v7 column.
| RLS   | policies |   will |   filter |   on |   school_id |   =  |
| ----- | -------- | ------ | -------- | ---- | ----------- | ---- |
ANY(current_setting('app.school_ids')::uuid[]). NULL school_id will mean
'applies to all schools in the tenant' and will match any session scope. The
app.school_ids session setting will be set at session start based on the user's
role assignments. School isolation is enforced in addition to tenant isolation
(ADR-043), never instead of. Cross-school queries within a tenant require
the rls_bypass role and are logged.
DETAILED RATIONALE
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  48

PreOne ADR - Volume 3: Data Architecture v3.0
Database-level RLS on school_id was chosen because it is the only model that
satisfies PreOne's four hard requirements simultaneously: sub-tenant isolation
at the database layer, role-dependent scoping (single school, multiple schools,
all schools), composability with tenant isolation, and auditability. Application-
layer-only school filtering was rejected for the same reason as in ADR-043: it is
not auditable at the database layer and is bypassable by any code path that
forgets the filter. The legacy platform had at least two incidents where a
configuration change accidentally exposed cross-school data via the application
layer; database-level RLS would have prevented both. Schema-per-school was
rejected on the same operational-cost grounds as schema-per-tenant
(ADR-043). A district with 50 schools would require 50 schema migrations per
Flyway run, which is too slow. Query routing complexity (which schema to
query based on the user's school assignment) is also high. Cross-school
reporting (e.g., a district-wide enrollment summary) would require federated
queries across 50 schemas, which is painful. The hybrid model (database-per-
school for the largest tenants, RLS for the rest) was considered because the
largest tenants (e.g., a 500-school district) might prefer the strongest isolation.
It was rejected because maintaining two isolation models doubles the testing
burden, complicates the reporting service (which would need to query both
models), and the operational cost of 500 school-databases for a single tenant is
prohibitive. RLS scales to 500 schools per tenant without issue. The ANY()
array session setting pattern was chosen over alternatives because it supports
the full range of role-dependent scoping. A principal's session has
app.school_ids = ['{school-uuid}'] (single-element array). A regional director's
session has app.school_ids = ['{school-1-uuid}', '{school-2-uuid}', ...] (multi-
element array). A superintendent's session has app.school_ids = ['{tenant-root-
uuid}'] (sentinel value that matches all schools, including NULL). The RLS
policy school_id = ANY(app.school_ids::uuid[]) handles all three cases
correctly, including the NULL case via the sentinel. The NULL school_id
semantics ('applies to all schools in the tenant') is necessary for tenant-wide
data: a district-wide configuration row, a tenant-wide announcement, a tenant-
wide user record. These rows have NULL school_id because they are not
school-specific; the RLS policy treats NULL as matching any session scope. This
is implemented via the sentinel value in app.school_ids: when the session is
scoped to all schools, app.school_ids contains the tenant's root UUID, and the
RLS policy is (school_id IS NULL OR school_id = ANY(app.school_ids::uuid[])).
When the session is scoped to specific schools, the NULL rows still match
(because they apply to all schools), and the specific-school rows match by
ANY(). The composition of tenant RLS and school RLS is straightforward: both
policies apply, and both must be satisfied (AND semantics). A query under
tenant A's session, scoped to school S, returns only rows where tenant_id = A
AND (school_id IS NULL OR school_id = S). This is the correct behaviour: a
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 49

PreOne ADR - Volume 3: Data Architecture v3.0
principal cannot see another tenant's data (tenant RLS) and cannot see another
school's data within their tenant (school RLS). The performance impact of the
school RLS policy is similar to the tenant RLS policy: a constant per-row filter
cost of approximately 0.1ms on a tenant-scoped table with a school_id-indexed
B-tree. The composite primary key (tenant_id, school_id, id) is also the optimal
index for the most common query pattern (point lookup by id within a school
within a tenant), so the index does not add storage overhead.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | SCHOOL ISOLATION
(within tenant) | +-------------------------------------------------------------+ |
| | Tenant A | | +---------------------+
+---------------------+ | | | School A1 | | School A2 | | | |
(principal: Alice) | | (principal: Bob) | | | | | | |
| | | enrollments: | | enrollments: | | | | tenant_id=A | |
tenant_id=A | | | | school_id=A1 | | school_id=A2 | | | |
id=... | | id=... | | | | RLS: tenant=A AND | | RLS:
tenant=A AND | | | | school=A1 | | school=A2 | | |
+---------------------+ +---------------------+ | |
| | +-----------------------------------------------------+ | | | District-wide config (school_id =
NULL) | | | | RLS: tenant=A AND (school_id IS NULL OR ...) | | |
+-----------------------------------------------------+ | |
| | Session: Superintendent Carol | | app.tenant_id = A
| | app.school_ids = ['{root-uuid}'] (sentinel: all schools) | | -> sees all rows in
tenant A | | | | Session:
Principal Alice | | app.tenant_id = A
| | app.school_ids = ['{A1-uuid}'] | | -> sees only school A1
rows + NULL school_id rows | +-------------------------------------------------------------+
SEQUENCE DIAGRAM
User -> API: login (Alice, principal of school A1) API -> Permission Resolver: get
school_ids for Alice Permission Resolver -> API: ['{A1-uuid}'] API -> PgBouncer:
BEGIN API -> PgBouncer: SET LOCAL app.tenant_id = 'A' API -> PgBouncer:
SET LOCAL app.school_ids = '{A1-uuid}' PgBouncer -> RDS Primary: route API
-> PgBouncer: SELECT * FROM enrollments PgBouncer -> RDS Primary:
SELECT * FROM enrollments RDS Primary -> Tenant RLS: tenant_id = 'A' RDS
Primary -> School RLS: school_id IS NULL OR school_id = ANY('{A1-uuid}')
RDS Primary -> Result: rows for tenant A, school A1 (or NULL) RDS Primary ->
PgBouncer: result set PgBouncer -> API: rows API -> User: enrollment list
(school A1 only)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-044 — School Isolation -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Application | resolve| School
Scope | | | | Service |------->| Resolver | | | +----------------+
+----------+-----------+ | | | | |
| injects | | v | | +----------------+
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 50

PreOne ADR - Volume 3: Data Architecture v3.0
+----------+-----------+ | | | Repository | filter | Composite Key | | | |
|------->| (tenant_id + school_id)| | | +----------------+ +----------------------+ |
| | | Enforcement: query interceptor +
index prefix | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Scope Resolution Flow: Request -> Auth (tenant_id from JWT) Request ->
Header (school_id from client) App Service -> Scope Resolver (compose
composite key) Repository -> WHERE tenant_id = ? AND school_id = ?
Postgres -> Index scan on composite key -> rows Cross-Scope Flow (rare):
Platform Admin -> bypass scope (with audit) Reporting Service -> aggregate
across scopes (read-only)
DATABASE IMPACT
Every school-scoped table has a nullable school_id UUID v7 column. The
composite primary key on school-scoped tables is (tenant_id, school_id, id)
when school_id is non-nullable, or (tenant_id, id) with a separate school_id
index when school_id is nullable. RLS is enabled on every school-scoped table
via ALTER TABLE ... ENABLE ROW LEVEL SECURITY. The school RLS policy is
generated from a template: CREATE POLICY school_isolation ON <table>
USING (school_id IS NULL OR school_id =
ANY(current_setting('app.school_ids')::uuid[])). The app.school_ids session
setting is set via SET LOCAL within each transaction. The tenant RLS policy
(ADR-043) and the school RLS policy compose with AND semantics. Tables that
are tenant-scoped but not school-scoped (e.g., the tenants table, the schools
reference table) have only the tenant RLS policy, not the school RLS policy.
API IMPACT
API requests include an X-Tenant-Id header (validated against the
authenticated user's tenant membership, per ADR-043) and an optional X-
School-Id header (validated against the authenticated user's school
assignments). The API gateway sets app.tenant_id and app.school_ids on the
Postgres session before any query is issued. Requests where X-School-Id is not
in the user's school set are rejected with 403. If X-School-Id is omitted, the
session is scoped to all schools the user can access (the user's full school_ids
array). School-scoped endpoints (e.g., GET /schools/{schoolId}/enrollments)
return 404 rather than 403 for resources that exist in another school within the
tenant, to avoid leaking the existence of the resource. Cross-school endpoints
(e.g., GET /schools/{schoolId1},{schoolId2}/enrollments/comparison) require
the user to have access to all listed schools; otherwise 403.
UI IMPACT
The UI surfaces school as an explicit scope selector in the top navigation bar.
Users with access to multiple schools see a dropdown; selecting one triggers a
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 51

PreOne ADR - Volume 3: Data Architecture v3.0
server round-trip with the new scope header, and the page reloads with the
scoped data. The current school name is always visible in the header (right
side) to prevent user confusion about which scope they are viewing. A 'Switch
School' affordance is one click away from any page. The UI was updated to clear
all client-side caches (filters, sort state, pagination) on scope change to prevent
stale cross-scope data leaking into the view.
SECURITY IMPACT
School isolation is a sub-tenant security property that complements tenant
isolation (ADR-043). It is enforced at the database layer via RLS, which is the
correct layer for the same reasons as tenant isolation: it is auditable,
declarative, and bypassable only by the rls_bypass role (which is logged). The
principal residual risk is an RLS policy bug, mitigated by property-based testing
and policy templating, as in ADR-043. The NULL school_id semantics
introduces a subtle risk: a row with NULL school_id is visible to all sessions
within the tenant, which is the intended behaviour for tenant-wide data but
could be a footgun if a developer accidentally inserts a school-specific row with
NULL school_id. This is mitigated by a CHECK constraint on school-specific
tables that requires school_id to be non-NULL: ALTER TABLE ... ADD
CONSTRAINT school_id_required CHECK (school_id IS NOT NULL). The
constraint is added only to tables where school_id is semantically required;
tenant-wide tables (e.g., district_config) allow NULL.
PERFORMANCE IMPACT
School RLS adds a constant per-row filter cost of approximately 0.1ms on a
school-scoped table with a school_id-indexed B-tree, similar to tenant RLS. The
composite primary key (tenant_id, school_id, id) is the optimal index for the
most common query pattern (point lookup by id within a school within a tenant),
so the index does not add storage overhead beyond what is already required for
the primary key. The ANY() array lookup on app.school_ids is O(n) in the array
size, which is bounded by the number of schools per tenant (max 500); in
practice, the array is small (1-10 schools for most users). The net performance
impact is negligible (less than 3% on p99 latency) on the PreOne workload. The
planning overhead of two RLS policies (tenant and school) is approximately
1ms per query, which is acceptable.
SCALABILITY ANALYSIS
School isolation scales to 500 schools per tenant without issue. The per-school
cost is one row in the schools table and one entry in the school RLS policy
evaluation cache. The dataset size per school averages 4 MB at PreOne's
projected steady state, so 500 schools per tenant = 2 GB per tenant, well within
the cluster's capacity. The ANY() array lookup performance degrades
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 52

PreOne ADR  -  Volume 3: Data Architecture  v3.0
gracefully with array size: at 500 elements, the lookup adds approximately
0.5ms to query latency, which is acceptable. Beyond 500 schools per tenant, we
would revisit the strategy; the most likely evolution is to switch from ANY() to a
JOIN against a session-scoped school_membership table, which is O(log n)
rather than O(n). The strategy is stable for the foreseeable future.
OPERATIONAL CONSIDERATIONS
The SRE team owns the school RLS policy template and the property-based test
that verifies school isolation. Application teams own the schema migrations
that add school-scoped tables; the migration must include the school_id
column, the composite primary key or school_id index, the school RLS policy
(generated from the template), and the test case that verifies isolation. The CI
pipeline runs the property-based school isolation test on every migration; a
failure blocks the migration. The app.school_ids session setting is computed by
the Effective Permission Resolver (ADR-067) based on the user's role
assignments; the resolver is the authoritative source of school-scope truth. The
rls_bypass role (which bypasses both tenant and school RLS) is granted only to
the reporting service account, as in ADR-043. Cross-school queries within a
tenant (e.g., a district-wide enrollment summary) use the reporting service and
are logged.
RISKS
| Risk               | Likelihood | Impact | Mitigation           |
| ------------------ | ---------- | ------ | -------------------- |
| A school RLS       | Low        | High   | Property-based       |
| policy bug leaks   |            |        | school isolation     |
| data across        |            |        | test in CI on every  |
| schools within a   |            |        | migration; policy    |
| tenant, violating  |            |        | templating           |
| FERPA.             |            |        | reduces authoring    |
errors; quarterly
external audit of
the policy set.
| NULL school_id    | Medium | High | CHECK constraint    |
| ----------------- | ------ | ---- | ------------------- |
| semantics are     |        |      | requiring           |
| misused, causing  |        |      | school_id NOT       |
| school-specific   |        |      | NULL on school-     |
| data to be        |        |      | specific tables;    |
| inserted with     |        |      | migration linter    |
| NULL and become   |        |      | flags INSERT        |
| visible to all    |        |      | statements that do  |
| sessions in the   |        |      | not set school_id.  |
tenant.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  53

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation           |
| ------------------- | ---------- | ------ | -------------------- |
| The ANY() array     | Low        | Medium | Monitor query        |
| lookup degrades     |            |        | latency for          |
| performance on      |            |        | superintendent-      |
| sessions scoped to  |            |        | scoped sessions; if  |
| many schools        |            |        | degradation is       |
| (e.g., a            |            |        | observed, switch     |
| superintendent      |            |        | to a JOIN-based      |
| with 500 schools).  |            |        | policy against a     |
session-scoped
school_membershi
p table.
| Composition of     | Low | High | Property-based       |
| ------------------ | --- | ---- | -------------------- |
| tenant and school  |     |      | test covers NULL     |
| RLS policies       |     |      | school_id and        |
| produces           |     |      | NULL tenant_id       |
| incorrect results  |     |      | combinations;        |
| in an edge case    |     |      | quarterly red-       |
| (e.g., NULL        |     |      | team exercise        |
| handling).         |     |      | attempts to exploit  |
composition edge
cases.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Sub-tenant isolation at the database  Adds a second RLS policy to every
layer, auditable and bypassable only by  school-scoped table; planning overhead
the logged rls_bypass role. increases by approximately 1ms per
query.
Role-dependent scoping via the ANY()  ANY() lookup is O(n) in array size;
array session setting; supports single- degrades gracefully to 500 schools per
| school, multi-school, and all-school  |     | tenant. |     |
| ------------------------------------- | --- | ------- | --- |
sessions.
Composes cleanly with tenant RLS via  NULL school_id semantics introduce a
AND semantics; no special handling  footgun mitigated by CHECK
| required. |     | constraints and migration linting. |     |
| --------- | --- | ---------------------------------- | --- |
Reuses the property-based testing  School-scoped tables have a more
framework from tenant isolation;  complex composite primary key
| testing cost is incremental. |     | (tenant_id, school_id, id). |     |
| ---------------------------- | --- | --------------------------- | --- |
REJECTED ALTERNATIVES
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  54

PreOne ADR - Volume 3: Data Architecture v3.0
Application-layer-only school filtering was rejected because it is not auditable
at the database layer and is bypassable by code paths that forget the filter.
Schema-per-school was rejected on operational cost (50 schemas per Flyway
run for a 50-school district) and query-routing complexity. Database-per-school
for the largest tenants was rejected because maintaining two isolation models
doubles the testing burden and complicates the reporting service. A NULL-
means-nothing semantics (where NULL school_id rows are visible only to
sessions scoped to all schools) was considered but rejected because it would
prevent tenant-wide data from being visible to single-school sessions, breaking
the district-wide announcement use case. The full reasoning for each rejection
is captured in the Options Considered table.
MIGRATION PLAN
Migration to add school_id and the school RLS policy proceeds table-by-table,
attached to each table's next schema change. Each migration follows the
standard pattern: (1) add the nullable school_id UUID v7 column with a default
of NULL; (2) backfill existing rows with the appropriate school_id based on the
row's source data (e.g., an enrollment row's school_id is the school of the
enrollment); (3) add the school RLS policy generated from the template; (4) add
the CHECK constraint requiring school_id NOT NULL on school-specific tables;
(5) verify isolation with the property-based test. Tables that are tenant-wide
(school_id is permanently NULL) skip step 4. The migration is reversible:
rolling back removes the school RLS policy, the CHECK constraint, and the
school_id column. The legacy MongoDB + MySQL mix did not have a clean
school-isolation model, so the migration is also a clean-up of the legacy data;
some rows may need to be assigned a school_id heuristically based on the row's
source school.
TESTING STRATEGY
School isolation is tested at three levels. (1) Unit: every school-scoped table's
school RLS policy is verified by a property-based test that generates random
(tenant, school) pairs, inserts rows for each combination, and asserts that
queries under various session scopes (single school, multi-school, all schools)
return the correct subset. The test covers NULL school_id rows, verifying that
they are visible to all sessions within the tenant. (2) Integration: the CI pipeline
runs the full school isolation suite on every migration; a failure blocks the
migration. (3) Chaos: a quarterly red-team exercise attempts to extract cross-
school data via application bugs, SQL injection, and session-setting
manipulation; findings are filed as security issues. The property-based test also
verifies composition with tenant RLS, generating random (tenant, school) pairs
and asserting that tenant RLS and school RLS compose correctly under all
combinations of session settings.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 55

PreOne ADR - Volume 3: Data Architecture v3.0
MONITORING & OBSERVABILITY
School isolation health is monitored through three metrics. (1) School RLS
policy coverage: the percentage of school-scoped tables with an active school
RLS policy; target 100%, current 100%. (2) School-scope session settings:
count of sessions with each app.school_ids array size, exported to CloudWatch;
alert fires on any session with an array size > 100 (potential misconfiguration)
or on any session without an app.school_ids setting (potential bypass). (3)
Cross-school query attempts: count of queries that would have returned cross-
school rows but were blocked by school RLS, derived from pg_stat_statements
by comparing actual row counts to expected row counts under the session's
school scope. Alerts fire on: any rls_bypass use outside the reporting service,
any cross-school query attempt that is not a known reporting query, and any
school-scoped table that loses its RLS policy (detected by a daily introspection
job).
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
switch from ANY() array lookup to a JOIN-based policy against a session-scoped
school_membership table, if the ANY() performance degrades beyond
acceptable bounds at large school counts. The switch is a policy change, not a
schema change, and can be deployed without downtime. A second possible
evolution is the introduction of column-level encryption for the most sensitive
school-scoped PII (e.g., student names within a school), which would
complement school RLS rather than replace it. A third possible evolution is the
generalisation of the school-isolation pattern to other sub-tenant scopes (e.g.,
department within a school), but no current PreOne use case requires this; the
pattern is documented as a generalisation path in the engineering handbook.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-042 - UUID Strategy (school_id is UUID v7)
● ADR-043 - Tenant Isolation (parent isolation decision)
● ADR-045 - Branch Isolation (sibling sub-tenant isolation)
● ADR-046 - Academic Year Isolation (temporal isolation within school)
● ADR-048 - Audit Columns (school_id is a standard audit column on
school-scoped tables)
● ADR-067 - Effective Permission Resolver (computes app.school_ids for a
session)
● ADR-079 - PII Protection (complements school RLS for sensitive
columns)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 56

PreOne ADR  -  Volume 3: Data Architecture  v3.0
REFERENCES
● PostgreSQL Documentation - Row Security Policies. The PostgreSQL
Global Development Group. 2024.
● FERPA - Family Educational Rights and Privacy Act. U.S. Department
of Education. 2024.
● AWS RDS for PostgreSQL - Multi-Tenant SaaS Patterns. Amazon Web
Services. 2024.
● PreOne Engineering Handbook, Section 7.4 - School Isolation. Internal.
2025.
● PreOne Security Policy, Section 4.2 - School Data Separation. Internal.
2025.
DECISION HISTORY
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Office of the Chief Architect |     |
| ----------- | --- | ----------------------------- | --- |
| Tech Lead   |     | Data Platform Lead            |     |
| ARB Chair   |     | Architecture Review Board     |     |
| Approved On |     | 2025-10-15                    |     |
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  57

PreOne ADR - Volume 3: Data Architecture v3.0
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● school_id column added to all scoped tables (Done)
● Composite indexes on (tenant_id, school_id) created (Done)
● Scope Resolver middleware deployed (Done)
● UI scope selector implemented (Done)
● Integration tests verify scope isolation (Done — 156 tests)
● Cross-scope admin paths audited (Done)
AD R -045
Branch Isolation
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a branch isolation pattern for the chain-of-private-schools market
where each branch operates semi-autonomously and may be offline from
the cloud primary for up to 72 hours. Branch isolation reuses the school-
isolation RLS pattern (ADR-044) with branch_id as the scoping column.
Offline-tolerant branch clients generate UUID v7 keys client-side, write to a
local SQLite cache, and reconcile to the cloud primary on reconnect via a
deterministic merge protocol. Branch isolation is a specialisation of school
isolation, not a separate mechanism.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 58

PreOne ADR - Volume 3: Data Architecture v3.0
Review Cadence Annual review, or on tenant
onboarding pattern change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne's chain-of-private-schools market includes customers whose branches
operate in regions with unreliable internet connectivity: rural India, parts of
Southeast Asia, and emerging-market urban areas with intermittent power. A
branch must be able to continue operating (taking attendance, recording
grades, enrolling students) for up to 72 hours while disconnected from the
cloud primary. When connectivity returns, the branch's local data must
reconcile to the cloud without conflicts, because the branch staff have moved
on to the next day's work and cannot resolve conflicts interactively. The branch
is a specialisation of the school concept from ADR-044: a chain is a tenant, a
branch is a school within that tenant, and the branch-isolation pattern is the
school-isolation pattern with additional offline-tolerant machinery. The
branch_id column is the school_id column from ADR-044, renamed for the chain
market; the RLS policy is identical. The offline-tolerant machinery is the new
piece: a local SQLite cache on the branch client, a deterministic merge
protocol, and a conflict-resolution policy. The deterministic merge protocol is
based on UUID v7 primary keys (ADR-042), which are globally unique and
monotonically increasing. When a branch client writes a row offline, it
generates a UUID v7 primary key locally; when it reconnects, the row is
upserted to the cloud primary. Conflicts are impossible for inserts (the UUID v7
key is unique by construction) and are resolved for updates by last-write-wins
on the updated_at timestamp (ADR-048). Deletes are soft (ADR-047) and
propagate via the deleted_at timestamp. The alternative considered was a
connected-only model where branches must be online to operate. This was
rejected because the chain market requires offline tolerance; customers in
regions with unreliable connectivity would not adopt PreOne without it. A
second alternative was a local Postgres instance per branch, replicating to the
cloud via logical replication. This was rejected on operational cost (100
branches = 100 Postgres instances to operate) and on conflict-resolution
complexity (PostgreSQL logical replication does not have a built-in last-write-
wins resolver).
BUSINESS DRIVERS
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 59

PreOne ADR - Volume 3: Data Architecture v3.0
PreOne's chain-of-private-schools market is projected to grow from 30
customers (current) to 150 customers by end of 2027, representing 15% of total
revenue. The single biggest blocker to adoption in this market is offline
tolerance: chain customers in emerging markets cannot adopt a connected-only
SaaS. The branch-isolation pattern, with offline-tolerant reconciliation,
removes this blocker. A secondary driver is the resilience of the chain
customer's operations. A connected-only model would mean that a 4-hour
internet outage at a branch would halt operations (no attendance, no grading,
no enrollment). The offline-tolerant model means the branch continues
operating through the outage and reconciles when connectivity returns. This is
a significant operational resilience benefit, not just an adoption enabler. A
tertiary driver is the cost structure. Operating a local Postgres instance per
branch would cost approximately $50/month per branch in compute and
storage, which is 60% of the per-branch subscription margin. The SQLite-based
local cache costs approximately $0/month per branch (it runs on the branch's
existing point-of-sale hardware). The cost saving flows directly to margin.
PROBLEM STATEMENT
PreOne requires a branch isolation strategy that enforces branch scoping at the
database layer (consistent with ADR-044 school isolation), supports offline
operation for up to 72 hours per branch, reconciles to the cloud primary
without conflicts on reconnect, and is operationally affordable at 100 branches
per chain tenant.
CONSTRAINTS
● Branch isolation reuses the school_id column from ADR-044 (renamed
branch_id in the chain market); no separate column.
● Branch clients use a local SQLite cache for offline operation; no local
Postgres instance.
● Offline writes generate UUID v7 keys client-side (ADR-042).
● Conflict resolution is last-write-wins on updated_at timestamp
(ADR-048); no interactive conflict resolution.
● Soft delete (ADR-047) propagates via deleted_at timestamp; hard
deletes are forbidden during reconciliation.
● Reconciliation is idempotent; replaying the same reconciliation payload
produces the same final state.
ASSUMPTIONS
● Branch client hardware (point-of-sale terminals) can run SQLite and
the reconciliation client.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 60

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● Clock skew between branch clients and the cloud primary is bounded
by 5 seconds under NTP discipline.
● Last-write-wins conflict resolution is acceptable for the chain market;
interactive resolution is not required.
● The SQLite cache size per branch is bounded by 500 MB (one academic
year of branch data).
● Reconciliation bandwidth is sufficient to sync 500 MB within 4 hours of
reconnect (typical branch connectivity).
OPTIONS CONSIDERED
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
School-isolation  Reuses the school- Last-write-wins  Adopted
| RLS pattern          | isolation pattern;   | can lose data in    |     |
| -------------------- | -------------------- | ------------------- | --- |
| (ADR-044) with       | SQLite is            | concurrent-update   |     |
| SQLite local cache   | operationally free;  | scenarios (rare in  |     |
| and last-write-      | last-write-wins is   | branch              |     |
| wins                 | simple and           | workflows);         |     |
| reconciliation (the  | deterministic;       | SQLite has limited  |     |
| chosen strategy).    | offline tolerance    | concurrency         |     |
|                      | up to 72 hours.      | (single writer).    |     |
Connected-only  Simplest model;  Blocks adoption in  Rejected
| model; branches    | no reconciliation  | the chain market;  |     |
| ------------------ | ------------------ | ------------------ | --- |
| must be online to  | logic; no offline  | branch operations  |     |
| operate.           | complexity.        | halt during        |     |
internet outages;
fails the offline-
tolerance
requirement.
| Local Postgres      | Strong               | Operational cost   | Rejected |
| ------------------- | -------------------- | ------------------ | -------- |
| instance per        | consistency; full    | of 100 Postgres    |          |
| branch,             | SQL support          | instances per      |          |
| replicating to the  | locally; Postgres    | chain; conflict    |          |
| cloud via logical   | logical replication  | resolution         |          |
| replication.        | is well              | complexity         |          |
|                     | understood.          | (Postgres logical  |          |
replication does
not have a built-in
LWW resolver);
per-branch cost
exceeds the
subscription
margin.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  61

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option             | Pros                 | Cons                 | Verdict  |
| ------------------ | -------------------- | -------------------- | -------- |
| CouchDB per        | CouchDB is           | Introduces a new     | Rejected |
| branch with multi- | designed for         | engine (CouchDB)     |          |
| master             | offline-tolerant     | into the stack;      |          |
| replication.       | multi-master         | does not integrate   |          |
|                    | replication;         | with the Postgres-   |          |
|                    | conflict resolution  | based school-        |          |
|                    | is built-in          | isolation RLS        |          |
|                    | (deterministic,      | pattern;             |          |
|                    | application-         | operational cost of  |          |
|                    | defined).            | learning and         |          |
operating
CouchDB.
DECISION
ADOPTED
Adopt a branch isolation pattern that reuses the school-isolation RLS
pattern (ADR-044) with branch_id as the scoping column. Branch clients
will use a local SQLite cache for offline operation, generate UUID v7 keys
client-side (ADR-042), and reconcile to the cloud primary on reconnect via a
deterministic last-write-wins merge protocol on the updated_at timestamp
(ADR-048). Soft delete (ADR-047) will propagate via the deleted_at
timestamp. Reconciliation will be idempotent. Branch isolation is a
specialisation of school isolation, not a separate mechanism; the cloud-side
RLS policy is identical.
DETAILED RATIONALE
The SQLite-plus-LWW strategy was chosen because it is the only model that
satisfies all five PreOne hard requirements simultaneously: branch scoping at
the database layer, offline operation up to 72 hours, conflict-free reconciliation,
operational affordability at 100 branches per chain, and integration with the
existing Postgres-based isolation patterns.  The connected-only model was
rejected because it blocks adoption in the chain market. The chain market is
projected to be 15% of total revenue by 2027; a connected-only model would
forfeit this revenue. The operational resilience benefit (continuing operations
through internet outages) is also significant.  Local Postgres per branch was
rejected primarily on operational cost. A chain with 100 branches would
require 100 Postgres instances, each requiring patching, backup verification,
and DR rehearsal. The SRE team of four cannot operate 100 Postgres instances
well; the result would be patchy patching and unverified backups. The cost per
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  62

PreOne ADR - Volume 3: Data Architecture v3.0
branch (approximately $50/month) also exceeds the subscription margin.
Conflict resolution complexity (Postgres logical replication does not have a
built-in LWW resolver; we would have to build one) was a secondary factor.
CouchDB per branch was a serious contender because CouchDB is purpose-
built for offline-tolerant multi-master replication. It was rejected because it
introduces a new engine into the stack, with the associated operational and
hiring cost. It also does not integrate cleanly with the Postgres-based school-
isolation RLS pattern: the cloud-side store would need to be Postgres (per
ADR-041), so we would need a CouchDB-to-Postgres replication bridge, which
is bespoke and fragile. The operational simplicity of SQLite (a single file, no
server process, no replication machinery) outweighs CouchDB's purpose-built
elegance for our use case. The last-write-wins conflict resolution policy is the
key simplification. It works for the chain market because branch workflows are
largely non-concurrent: a branch staff member takes attendance for a class,
records grades for a student, enrolls a new student. The same row is rarely
updated by two different actors within the 72-hour offline window. When
concurrent updates do occur (e.g., a branch manager updates a student's
profile from the cloud while the branch secretary updates it locally), LWW
resolves to the later updated_at timestamp. Data loss is possible in this
scenario, but it is rare and the alternative (interactive conflict resolution) is
infeasible for branch staff who have moved on to the next day's work. The
idempotency of reconciliation is critical. If a branch client reconnects, syncs,
loses connectivity again, and reconnects, the second sync must not produce a
different state than the first. Idempotency is achieved by keying reconciliation
on the UUID v7 primary key: an upsert with the same key and the same
updated_at timestamp produces the same final state regardless of how many
times it is applied. The reconciliation payload includes the full row state, not
just the diff, so the cloud primary's final state is the row state from the branch
client at the time of the last write. The SQLite local cache is a single file
(branch.db) on the branch client's point-of-sale hardware. The schema mirrors
the cloud-side Postgres schema for the branch-scoped tables. Writes go to
SQLite synchronously (using WAL mode for durability); reads go to SQLite
when offline and to the cloud when online. On reconnect, the reconciliation
client reads all rows from SQLite with updated_at > last_synced_at and upserts
them to the cloud. The last_synced_at watermark is stored locally and advanced
after a successful reconciliation. The cloud-side RLS policy is identical to the
school-isolation policy (ADR-044): branch_id =
ANY(current_setting('app.branch_ids')::uuid[]) or branch_id IS NULL for
tenant-wide data. The branch client's session is scoped to its own branch_id.
Reconciliation writes are issued under a service account that has the rls_bypass
role (because the reconciliation client is writing rows for a specific branch, not
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 63

PreOne ADR - Volume 3: Data Architecture v3.0
querying for a user); the writes are logged to the cross_tenant_audit table for
traceability.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | BRANCH ISOLATION
(offline-tolerant) | +-------------------------------------------------------------+ |
| | Chain Tenant (chain of 100 branches) | |
| | Branch 1 (offline) Branch 2 (online) | | +-------------------+
+-------------------+ | | | Branch Client | | Branch Client | | | | -
SQLite cache | | - SQLite cache | | | | - UUID v7 gen | | -
UUID v7 gen | | | | - LWW resolver | | - LWW resolver | | | | -
write locally | | - write locally | | | +-------------------+ | - reconcile
| | | | +-------------------+ | | | (no connectivity)
| | | | (up to 72h) | (sync) | | v
v | | +---------------------------------------------------+ | | | Cloud Primary
(PostgreSQL 16) | | | | - RLS: tenant_id AND branch_id
| | | | - UPSERT on reconciliation | | | | - LWW on updated_at
| | | | - Soft delete via deleted_at | | |
+---------------------------------------------------+ | | |
| Reconciliation protocol (idempotent): | | 1. Branch client reads
rows where updated_at > watermark | | 2. For each row: UPSERT to cloud (key
= UUID v7) | | 3. Cloud applies LWW: keep row with later updated_at |
| 4. On success: advance watermark locally | | 5. Replay-safe: same
payload -> same final state | +-------------------------------------------------------------+
SEQUENCE DIAGRAM
Branch Client (offline) -> Local SQLite: INSERT (uuid_v7, ...) Local SQLite ->
Branch Client: ok Branch Client -> Local SQLite: UPDATE (uuid_v7,
updated_at=now) Local SQLite -> Branch Client: ok ... (connectivity restored) ...
Branch Client -> Reconciliation API: POST /sync (rows since watermark)
Reconciliation API -> PgBouncer: BEGIN Reconciliation API -> PgBouncer: SET
ROLE rls_bypass PgBouncer -> RDS Primary: route RDS Primary -> Audit Log:
log rls_bypass use Loop: for each row in payload RDS Primary -> Table:
UPSERT (key=uuid_v7, updated_at=...) Table -> RDS Primary: row updated
(LWW applied) End RDS Primary -> PgBouncer: COMMIT PgBouncer ->
Reconciliation API: ok (watermark advanced) Reconciliation API -> Branch
Client: 200 OK (new watermark) Branch Client -> Local SQLite: UPDATE
watermark = new_value Local SQLite -> Branch Client: ok
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-045 — Branch Isolation -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Application | resolve| Branch
Scope | | | | Service |------->| Resolver | | | +----------------+
+----------+-----------+ | | | | |
| injects | | v | | +----------------+
+----------+-----------+ | | | Repository | filter | Composite Key | | | |
|------->| (tenant_id + branch_id)| | | +----------------+ +----------------------+ |
| | | Enforcement: query interceptor +
index prefix | +-------------------------------------------------------------+
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 64

PreOne ADR - Volume 3: Data Architecture v3.0
DATA FLOW DIAGRAM
Scope Resolution Flow: Request -> Auth (tenant_id from JWT) Request ->
Header (branch_id from client) App Service -> Scope Resolver (compose
composite key) Repository -> WHERE tenant_id = ? AND branch_id = ?
Postgres -> Index scan on composite key -> rows Cross-Scope Flow (rare):
Platform Admin -> bypass scope (with audit) Reporting Service -> aggregate
across scopes (read-only)
DATABASE IMPACT
Branch isolation reuses the school_id column from ADR-044 (renamed
branch_id in the chain market). The cloud-side RLS policy is identical:
branch_id = ANY(current_setting('app.branch_ids')::uuid[]) or branch_id IS
NULL for tenant-wide data. The reconciliation API uses a service account with
the rls_bypass role, which is logged to the cross_tenant_audit table.
Reconciliation writes use UPSERT (INSERT ... ON CONFLICT (tenant_id,
branch_id, id) DO UPDATE SET ... WHERE excluded.updated_at >
table.updated_at), which implements LWW atomically. The updated_at column
(ADR-048) is the conflict-resolution key; it must be set by the branch client to
the wall-clock time of the local write. The deleted_at column (ADR-047)
propagates soft deletes: a soft-deleted row in SQLite is upserted to the cloud
with the deleted_at timestamp set, and the cloud's soft-delete filter (WHERE
deleted_at IS NULL) automatically excludes it from queries.
API IMPACT
The branch client calls two API endpoints: the standard tenant-scoped
endpoints (when online, for live queries) and the reconciliation endpoint
(POST /sync, for offline write reconciliation). The reconciliation endpoint
accepts a batch of rows (up to 1000 per request), each row keyed by UUID v7
with the full row state including updated_at and deleted_at. The endpoint is
idempotent: replaying the same batch produces the same final state. The
endpoint returns the new watermark (the maximum updated_at across all rows
in the batch) on success. The branch client advances its local watermark to this
value. If the reconciliation fails mid-batch, the branch client retries the entire
batch; the idempotency of UPSERT ensures correctness. The endpoint is rate-
limited to 10 requests per second per branch client to protect the cloud primary
from a thundering herd of reconnects.
UI IMPACT
The UI surfaces branch as an explicit scope selector in the top navigation bar.
Users with access to multiple branchs see a dropdown; selecting one triggers a
server round-trip with the new scope header, and the page reloads with the
scoped data. The current branch name is always visible in the header (right
side) to prevent user confusion about which scope they are viewing. A 'Switch
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 65

PreOne ADR - Volume 3: Data Architecture v3.0
Branch' affordance is one click away from any page. The UI was updated to
clear all client-side caches (filters, sort state, pagination) on scope change to
prevent stale cross-scope data leaking into the view.
SECURITY IMPACT
Branch isolation reuses the school-isolation security properties (ADR-044). The
additional security consideration is the reconciliation service account, which
has the rls_bypass role. The account is granted only to the reconciliation API
and is rotated quarterly. Every reconciliation write is logged to the
cross_tenant_audit table with the branch_id, the row UUID, and the updated_at
timestamp. The branch client authenticates to the reconciliation API using a
branch-specific API key (rotated annually) that is stored in the branch client's
keychain (not in the SQLite cache). The SQLite cache is encrypted at rest using
SQLCipher; the encryption key is derived from the branch client's login
credentials and is not stored on disk. If a branch client is lost or stolen, the
cache is inaccessible without the credentials, and the API key can be revoked
from the cloud side.
PERFORMANCE IMPACT
The cloud-side performance impact of branch isolation is the same as school
isolation (ADR-044): approximately 0.1ms per-row RLS filter cost. The
reconciliation endpoint adds write load to the cloud primary: a 100-branch
chain with each branch syncing 500 MB over 4 hours produces approximately
35 writes per second sustained, well within the primary's capacity. The LWW
UPSERT is a single-statement atomic operation; it does not require read-
modify-write, so it does not add lock contention. The branch-client-side
performance impact is dominated by SQLite write throughput: in WAL mode,
SQLite sustains approximately 200 writes per second on the point-of-sale
hardware, which is sufficient for the branch workflow (a branch rarely exceeds
20 writes per second). The reconciliation client is I/O-bound on the uplink
bandwidth; a 500 MB sync over a 30 Mbps link takes approximately 140
seconds, well within the 4-hour reconnect window.
SCALABILITY ANALYSIS
Branch isolation scales to 100 branches per chain tenant without issue. The
per-branch cost on the cloud primary is one entry in the branch RLS policy
evaluation cache. The reconciliation load is bounded by the branch reconnect
rate: assuming 10% of branches reconnect per hour (typical for intermittent
connectivity), a 100-branch chain produces 10 reconciliation batches per hour,
or approximately 0.3 batches per second. The cloud primary can sustain 1000
reconciliation batches per second, so headroom is 3000x. Beyond 100 branches
per chain, the limit is the SQLite cache size (500 MB per branch is one
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 66

PreOne ADR  -  Volume 3: Data Architecture  v3.0
academic year of data; longer retention requires cache rotation). The strategy
is stable for the foreseeable future. A chain with 1000 branches would require
sharding (per ADR-041), but no current PreOne customer approaches this
scale.
OPERATIONAL CONSIDERATIONS
The   SRE   team   owns   the   cloud-side   reconciliation   infrastructure:   the
reconciliation API, the rls_bypass service account, the cross_tenant_audit log,
and the rate-limiting configuration. Application teams own the branch client:
the SQLite cache, the UUID v7 generation, the LWW resolver, and the
reconciliation client. The branch client is shipped as a desktop application
(Electron) that runs on the branch's point-of-sale hardware. On-call runbooks
cover: reconciliation API outage (branch clients retry with exponential backoff),
SQLite cache corruption (rebuild from cloud), branch client loss (revoke API
key, re-issue to replacement hardware), and LWW data loss (restore from cloud
PITR to the pre-conflict state, accept the data loss, document the incident). The
reconciliation protocol is versioned; the branch client includes its protocol
version in the POST /sync request, and the cloud-side API supports the current
and previous versions.
RISKS
| Risk                 | Likelihood | Impact | Mitigation          |
| -------------------- | ---------- | ------ | ------------------- |
| Last-write-wins      | Medium     | Medium | Branch workflows    |
| conflict resolution  |            |        | are largely non-    |
| loses data in        |            |        | concurrent; LWW     |
| concurrent-update    |            |        | data loss is rare.  |
| scenarios, causing   |            |        | When it occurs,     |
| customer-visible     |            |        | restore from cloud  |
| data loss.           |            |        | PITR to the pre-    |
conflict state and
document the
incident. Monitor
LWW overwrite
count; alert if rate
exceeds 0.1% of
writes.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  67

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk             | Likelihood | Impact | Mitigation           |
| ---------------- | ---------- | ------ | -------------------- |
| Branch client    | Low        | Medium | NTP discipline       |
| clock skew       |            |        | enforced on          |
| produces         |            |        | branch clients;      |
| updated_at       |            |        | clock skew alert     |
| timestamps that  |            |        | fires at 5 seconds.  |
| cause LWW to     |            |        | Reconciliation       |
| resolve          |            |        | protocol includes    |
| incorrectly.     |            |        | the client's clock   |
offset, which is
logged for
forensic analysis.
| SQLite cache       | Low | High | SQLite WAL mode      |
| ------------------ | --- | ---- | -------------------- |
| corruption on the  |     |      | provides             |
| branch client      |     |      | durability; nightly  |
| causes data loss.  |     |      | local backup of      |
the SQLite file to a
USB drive (branch
staff procedure). If
corruption occurs,
rebuild the cache
from the cloud.
| Reconciliation API  | Low | Medium | Branch clients        |
| ------------------- | --- | ------ | --------------------- |
| outage causes       |     |        | retry with            |
| branches to         |     |        | exponential           |
| accumulate un-      |     |        | backoff; SRE on-      |
| synced data         |     |        | call is paged if the  |
| beyond the 72-      |     |        | reconciliation API    |
| hour offline        |     |        | is down for more      |
| window.             |     |        | than 1 hour.          |
Branch SQLite
cache can hold 30
days of data,
providing a buffer.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Offline tolerance up to 72 hours per  Last-write-wins conflict resolution can
branch; chain market adoption  lose data in rare concurrent-update
| unblocked. |     | scenarios. |     |
| ---------- | --- | ---------- | --- |
Operational cost ~$0/month per branch  Branch client is a desktop application
(SQLite on existing hardware). (Electron) that must be distributed and
updated.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  68

PreOne ADR - Volume 3: Data Architecture v3.0
We Gain We Lose
Reuses the school-isolation RLS Reconciliation service account has
pattern; no new cloud-side machinery. rls_bypass role; its use must be
carefully monitored.
Idempotent reconciliation; replay-safe. SQLite single-writer concurrency limits
branch-client write throughput to ~200
writes/second.
REJECTED ALTERNATIVES
Connected-only model was rejected because it blocks adoption in the chain
market and halts branch operations during internet outages. Local Postgres per
branch was rejected on operational cost (100 Postgres instances per chain) and
conflict-resolution complexity. CouchDB per branch was rejected because it
introduces a new engine into the stack and does not integrate cleanly with the
Postgres-based school-isolation RLS pattern. An operational-transformation
(OT) based merge protocol was considered but rejected as over-engineered for
the branch workflow (which is largely non-concurrent). A CRDT-based merge
protocol was considered but rejected because CRDTs require schema-level
support that would complicate the Postgres tables; LWW on updated_at
achieves the same correctness property for our workload. The full reasoning for
each rejection is captured in the Options Considered table.
MIGRATION PLAN
Migration to the branch-isolation pattern proceeds in three phases over two
quarters. Phase 1 (Q1): implement the SQLite local cache, the UUID v7 client-
side generation, and the LWW reconciliation protocol on the cloud side; pilot
with three chain customers who have the most reliable connectivity (lowest
risk). Phase 2 (Q1-Q2): roll out to the next 20 chain customers, monitoring
reconciliation correctness and LWW data-loss rate. Phase 3 (Q2): roll out to the
remaining chain customers; the legacy connected-only branch client is
deprecated and removed after 30 days of overlap. Existing chain customers'
data does not require migration because the cloud-side schema is unchanged
(branch_id was already present as school_id); the migration is purely client-
side. Rollback per phase is to the connected-only client for 30 days after cut-
over.
TESTING STRATEGY
Branch isolation is tested at three levels. (1) Unit: the LWW resolver is tested
for correctness under all combinations of timestamp ordering, including equal
timestamps (where the deterministic tiebreaker is the row UUID). The
idempotency of reconciliation is tested by replaying the same batch multiple
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 69

PreOne ADR - Volume 3: Data Architecture v3.0
times and verifying the final state. (2) Integration: the full reconciliation flow
(offline write, reconnect, sync, verify cloud state) is tested in CI with a
simulated branch client. The test covers network failures mid-batch, branch
client crashes, and clock skew. (3) Chaos: a quarterly red-team exercise
simulates 100 branch clients reconnecting simultaneously (thundering herd)
and verifies that the rate limiter and the cloud primary's write capacity are
sufficient. The LWW data-loss rate is monitored in production; the target is
below 0.1% of writes, and any sustained increase triggers investigation.
MONITORING & OBSERVABILITY
Branch isolation health is monitored through four metrics. (1) Reconciliation
success rate: percentage of reconciliation batches that complete without error;
target 99.9%. (2) Reconciliation lag: time between a branch client's local write
and the corresponding cloud-side UPSERT; p99 target 4 hours (the reconnect
window). (3) LWW overwrite count: number of cloud-side rows that were
overwritten by a reconciliation write with a later updated_at; alert fires if the
rate exceeds 0.1% of writes. (4) Branch client offline duration: distribution of
offline durations per branch, exported to CloudWatch; alert fires if any branch
is offline for more than 72 hours. The cross_tenant_audit log is reviewed weekly
for unexpected reconciliation activity. The SQLite cache size per branch is
monitored via the branch client's telemetry; alert fires if the cache exceeds 400
MB (80% of the 500 MB limit).
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
introduction of CRDT-style conflict resolution for tables where LWW data loss is
unacceptable (e.g., gradebook entries where two teachers might update the
same student's grade concurrently). CRDTs require schema-level support (a
clock column per row), which would be added to specific tables rather than
globally. A second possible evolution is the move from SQLite to a more capable
local database (e.g., DuckDB for analytical queries on the branch client), but no
current use case requires this. A third possible evolution is the support for
branch-to-branch direct sync (e.g., for a chain that wants branches to share
data without going through the cloud), but no current PreOne customer has
requested this and it would introduce significant complexity.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-042 - UUID Strategy (client-side UUID v7 generation for offline
writes)
● ADR-043 - Tenant Isolation (parent isolation decision)
● ADR-044 - School Isolation (branch isolation reuses this pattern)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 70

PreOne ADR - Volume 3: Data Architecture v3.0
● ADR-047 - Soft Delete (propagates via deleted_at in reconciliation)
● ADR-048 - Audit Columns (updated_at is the LWW conflict-resolution
key)
● ADR-049 - Optimistic Concurrency (version column not used in branch
reconciliation; LWW is used instead)
● ADR-067 - Effective Permission Resolver (computes app.branch_ids for
a session)
REFERENCES
● SQLite Documentation - Write-Ahead Logging. SQLite project. 2024.
● SQLCipher Documentation - Zetetic LLC. 2024.
● Terry, D. et al. - COPS: Scalable Delta-Based Reconciliation. SOSP.
2011.
● PreOne Engineering Handbook, Section 7.5 - Branch Isolation. Internal.
2025.
● PreOne Offline-Tolerant Client Design Doc. Internal. 2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-16 Draft Data Platform Initial draft;
Lead options
enumerated;
consultation with
engineering team
2025-09-24 Proposed Data Platform Submitted to
Lead Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
2026-07-15 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 71

PreOne ADR - Volume 3: Data Architecture v3.0
Architect Office of the Chief Architect
Tech Lead Data Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● branch_id column added to all scoped tables (Done)
● Composite indexes on (tenant_id, branch_id) created (Done)
● Scope Resolver middleware deployed (Done)
● UI scope selector implemented (Done)
● Integration tests verify scope isolation (Done — 156 tests)
● Cross-scope admin paths audited (Done)
AD R -046
Academic Year Isolation
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt an academic year isolation pattern that partitions high-volume
temporal tables (attendance, gradebook, enrollment, audit_log) by
academic_year using PostgreSQL native range partitioning. Each partition
is a separate physical table sharing a common schema, allowing partition
pruning to eliminate entire partitions from query plans. Academic year
isolation composes with tenant and school isolation (ADR-043, ADR-044);
the partition key is (tenant_id, school_id, academic_year, id) on the
composite primary key.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 72

PreOne ADR - Volume 3: Data Architecture v3.0
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on tenant
onboarding pattern change
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne's data has a strong temporal dimension: every enrollment, attendance
record, grade, and audit-log entry belongs to a specific academic year (e.g.,
2024-2025). Academic years are mutually exclusive: a query for the current
academic year should never scan rows from prior academic years. The legacy
platform stored all academic years in a single table with an academic_year
column, requiring index scans that touched all years' data even when the query
was scoped to one year. At 40M attendance rows per year and 7 years of
retention (ADR-053), the table reached 280M rows, and queries on the current
year were dominated by index pages from prior years. PostgreSQL native
range partitioning, mature since PostgreSQL 11 and refined through 16, allows
a parent table to be split into child partitions based on a range expression.
Partition pruning in the planner eliminates partitions that cannot contain
matching rows, reducing the scan to the relevant partition only. For an
academic-year-partitioned table, a query scoped to academic_year = '2024-
2025' scans only the 2024-2025 partition (40M rows), not the full table (280M
rows). The pg_partman extension automates partition maintenance: creating
new partitions ahead of time, dropping old partitions per retention policy, and
managing partition constraints. PreOne's academic year starts in August;
pg_partman creates the next academic year's partition in July (one month
ahead) and drops partitions older than 7 years per ADR-053 in September (after
the new academic year starts). The composite partition key (tenant_id,
school_id, academic_year, id) allows subpartitioning by tenant and school if a
single partition becomes too large. At PreOne's projected scale (500 tenants,
500 schools per tenant, 40M rows per academic year), a single academic-year
partition across all tenants would be 20 billion rows, which is too large for a
single Postgres partition. Subpartitioning by tenant_id (or by a tenant cohort
hash) brings the partition size down to a manageable 40M rows per (tenant,
academic_year) partition.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 73

PreOne ADR - Volume 3: Data Architecture v3.0
BUSINESS DRIVERS
PreOne's institutional customers query the current academic year 95% of the
time (daily attendance, current gradebook, current enrollment). Prior academic
years are queried for transcript generation and historical reporting.
Partitioning by academic_year aligns the physical storage layout with the query
pattern, reducing query latency on the current year by 60-80% (based on
internal benchmarks) and reducing index size by the same factor. A secondary
driver is data retention. Academic records must be retained for 7 years per
ADR-053 (regulatory requirement in most jurisdictions). After 7 years, records
are archived to cold storage (ADR-054). Partitioning makes retention
enforcement trivial: dropping the oldest partition is an O(1) metadata
operation, versus a DELETE that would be O(n) and would bloat the table and
indexes. The drop is also immediate, with no VACUUM required to reclaim
space. A tertiary driver is backup and restore. Partitioning allows per-partition
backup and restore: a single academic year can be restored from backup
without restoring the entire table, which is critical for the restore-time
objective (RTO) of 4 hours per ADR-056. Restoring a single 40M-row partition is
feasible within 4 hours; restoring a 280M-row table is not.
PROBLEM STATEMENT
PreOne requires an academic year isolation strategy that aligns physical
storage with the dominant query pattern (current academic year), enables O(1)
retention enforcement, supports per-partition backup and restore, and
composes cleanly with tenant and school isolation (ADR-043, ADR-044) at the
scale of 500 tenants and 20 billion rows per academic year.
CONSTRAINTS
● High-volume temporal tables (attendance, gradebook, enrollment,
audit_log) must be range-partitioned by academic_year.
● The partition key is (tenant_id, school_id, academic_year, id) on the
composite primary key, enabling subpartitioning by tenant.
● pg_partman automates partition creation (1 month ahead) and partition
dropping (per ADR-053 retention).
● Academic year partitions are named academic_year_YYYY_YYYY (e.g.,
academic_year_2024_2025).
● Cross-partition queries are allowed but discouraged; the query planner
must be able to prune partitions based on the academic_year predicate.
● Partitions are not manually created or dropped by application teams;
all maintenance is via pg_partman.
ASSUMPTIONS
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 74

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● PostgreSQL 16 partition pruning is correct and efficient for our query
patterns.
● pg_partman will remain maintained for the lifetime of PostgreSQL 16
on our stack.
● Academic year boundaries (August to July) are stable across all PreOne
tenants; no per-tenant customisation.
● The composite partition key (tenant_id, school_id, academic_year, id)
provides sufficient pruning for all common queries.
● Subpartitioning by tenant_id is sufficient; no need for subpartitioning
by school_id within a tenant partition.
OPTIONS CONSIDERED
| Option              | Pros             | Cons               | Verdict |
| ------------------- | ---------------- | ------------------ | ------- |
| Range partitioning  | Aligns storage   | Composite          | Adopted |
| by academic_year    | with query       | partition key is   |         |
| with                | pattern; O(1)    | complex; cross-    |         |
| subpartitioning by  | retention; per-  | partition queries  |         |
| tenant_id,          | partition        | are slower;        |         |
| automated by        | backup/restore;  | pg_partman         |         |
| pg_partman (the     | automatable      | dependency.        |         |
| chosen strategy).   | maintenance.     |                    |         |
Single table with  Simplest schema;  Index bloat from  Rejected
| academic_year    | no partitioning    | prior years' data;  |     |
| ---------------- | ------------------ | ------------------- | --- |
| column and a     | complexity; all    | queries on current  |     |
| composite index. | queries go to one  | year scan prior     |     |
|                  | table.             | years' index        |     |
pages; retention
enforcement is
O(n) DELETE;
restore of a single
year is not
possible.
| List partitioning   | Simpler than        | Single partition    | Rejected |
| ------------------- | ------------------- | ------------------- | -------- |
| by academic_year    | range               | across all tenants  |          |
| (one partition per  | partitioning;       | is too large (20B   |          |
| year, no            | partition pruning   | rows at scale); no  |          |
| subpartitioning).   | works for equality  | subpartitioning     |          |
|                     | predicates on       | means no tenant-    |          |
|                     | academic_year.      | level pruning       |          |
within a year.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  75

PreOne ADR - Volume 3: Data Architecture v3.0
Option Pros Cons Verdict
Hash partitioning Distributes load Does not address Rejected
by tenant_id, with across partitions; the temporal
no academic-year good for tenant- query pattern;
partitioning. sharding. queries on current
year scan all
tenant partitions;
retention
enforcement is
O(n) per partition.
DECISION
ADOPTED
Adopt an academic year isolation strategy that range-partitions high-
volume temporal tables (attendance, gradebook, enrollment, audit_log) by
academic_year, with subpartitioning by tenant_id for tables that exceed
100M rows per academic year. The partition key is (tenant_id, school_id,
academic_year, id) on the composite primary key. pg_partman automates
partition creation (1 month ahead of the academic year start) and partition
dropping (per ADR-053 retention policy). Partitions are named
academic_year_YYYY_YYYY. Cross-partition queries are allowed but
discouraged; the query planner must be able to prune partitions based on
the academic_year predicate. Academic year isolation composes with
tenant and school isolation (ADR-043, ADR-044).
DETAILED RATIONALE
Range partitioning by academic_year with tenant subpartitioning was chosen
because it is the only model that satisfies all five PreOne hard requirements
simultaneously: alignment with the temporal query pattern, O(1) retention
enforcement, per-partition backup and restore, scalability to 20 billion rows per
academic year, and composability with tenant and school isolation. The single-
table alternative was the legacy approach and was rejected on query
performance. At 280M rows on the attendance table (7 years of retention), a
query for the current academic year scanned 280M rows' worth of index pages
even though only 40M rows matched; the index size was 12 GB, of which only
1.7 GB was for the current year. Partition pruning reduces the scan to the
current year's 40M rows and 1.7 GB index, a 7x reduction in I/O and a
corresponding reduction in query latency. List partitioning by academic_year
(without subpartitioning) was considered because list partitioning is
conceptually simpler than range partitioning. It was rejected because a single
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 76

PreOne ADR - Volume 3: Data Architecture v3.0
academic-year partition across all tenants would be 20 billion rows at scale
(500 tenants x 40M rows per tenant per year), which exceeds the recommended
single-partition size of 100M rows. Subpartitioning by tenant_id brings the leaf
partition size down to 40M rows per (tenant, academic_year), which is well
within the recommended range. Hash partitioning by tenant_id (without
academic-year partitioning) was considered because it distributes load across
partitions and is good for tenant-sharding. It was rejected because it does not
address the temporal query pattern: a query for the current academic year
would scan all tenant partitions, defeating the purpose of partitioning.
Retention enforcement would also be O(n) per partition, which is unacceptable.
The composite partition key (tenant_id, school_id, academic_year, id) was
chosen to enable partition pruning at multiple levels. A query scoped to a
specific tenant and academic year prunes to the (tenant, academic_year) leaf
partition. A query scoped to a specific tenant, school, and academic year prunes
to the same leaf partition (school_id is not a partition key, but the leaf
partition's composite index on (tenant_id, school_id, academic_year, id)
provides the school-level pruning). A query scoped to a specific academic year
but not a tenant prunes to all tenant partitions for that year, which is acceptable
for cross-tenant reporting queries (which are rare and use the rls_bypass role).
The pg_partman automation is critical. Without it, partition maintenance would
be a manual SRE task, prone to error (forgetting to create next year's partition
would cause inserts to fail when the new year starts). pg_partman creates
partitions ahead of time (1 month before the academic year start) and drops old
partitions per the retention policy (7 years after the academic year end). The
drop is an O(1) metadata operation that immediately reclaims the partition's
storage, with no VACUUM required. pg_partman also manages partition
constraints, ensuring that the planner can prune partitions correctly. The
compose with tenant and school isolation is straightforward. Each leaf partition
inherits the parent table's RLS policies (ADR-043, ADR-044), so tenant and
school isolation are enforced at the partition level. The composite primary key
(tenant_id, school_id, academic_year, id) is also the partition key, so RLS-
filtered queries prune to the relevant (tenant, school, academic_year) partition
naturally. The backup and restore benefit is significant. Per-partition backup
allows backing up each academic-year partition separately, reducing the per-
backup size from 280M rows to 40M rows. Per-partition restore allows
restoring a single academic year from backup without restoring the entire
table, which is critical for the 4-hour RTO per ADR-056. The restore is a
metadata operation (attach the restored partition to the parent table) followed
by an index rebuild, which completes within the RTO for a 40M-row partition.
ARCHITECTURE DIAGRAM
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 77

PreOne ADR - Volume 3: Data Architecture v3.0
+-------------------------------------------------------------+ | ACADEMIC YEAR ISOLATION
(partitioned table) | +-------------------------------------------------------------+ |
| | Parent table: attendance | | Partition key: (tenant_id,
school_id, academic_year, id) | | | |
+-----------------------------------------------------+ | | | Subpartition by tenant_id, range by
academic_year | | | +-----------------------------------------------------+ | |
| | Tenant A partition | | +----------------------+
+----------------------+ | | | academic_year_ | | academic_year_ | | |
| 2023_2024 | | 2024_2025 (current) | | | | (40M rows) | |
(40M rows) | | | | RLS: tenant=A | | RLS: tenant=A | | |
| Index: (t,s,ay,id) | | Index: (t,s,ay,id) | | | +----------------------+
+----------------------+ | | | | Tenant B
partition | | +----------------------+ +----------------------+ |
| | academic_year_ | | academic_year_ | | | | 2023_2024 | |
2024_2025 (current) | | | | (40M rows) | | (40M rows) | | |
| RLS: tenant=B | | RLS: tenant=B | | | +----------------------+
+----------------------+ | | | | pg_partman:
| | - Creates next year partition 1 month ahead | | - Drops partitions >
7 years old (ADR-053) | | - Maintains partition constraints
| | | | Query: SELECT * FROM attendance
| | WHERE tenant_id=A AND academic_year='2024-2025' | | -> Planner
prunes to: tenant_a_2024_2025 partition | | -> Scans 40M rows, not 280M
| +-------------------------------------------------------------+
SEQUENCE DIAGRAM
App -> PgBouncer: BEGIN; SET LOCAL app.tenant_id='A' App -> PgBouncer:
SELECT * FROM attendance WHERE academic_year='2024-2025' PgBouncer ->
RDS Primary: route RDS Primary -> Planner: parse query Planner -> Partition
Pruner: academic_year='2024-2025' Partition Pruner -> Planner: prune to
tenant_a_2024_2025 Planner -> RDS Primary: plan (scan 1 partition) RDS
Primary -> Partition: SELECT * FROM tenant_a_2024_2025 Partition -> RLS:
tenant_id='A' RLS -> Partition: rows for tenant A Partition -> RDS Primary: 40M
rows RDS Primary -> PgBouncer: result PgBouncer -> App: rows pg_partman
(monthly job) -> Parent: CREATE TABLE tenant_a_2025_2026 Parent -> Catalog:
new partition registered pg_partman (monthly job) -> Parent: DROP TABLE
tenant_a_2017_2018 (retention) Parent -> Catalog: old partition removed (O(1)
metadata)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-046 — Academic Year
Isolation - Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Application | resolve|
Academic Year Scope | | | | Service |------->| Resolver | |
| +----------------+ +----------+-----------+ | | |
| | | injects | | v
| | +----------------+ +----------+-----------+ | | | Repository | filter |
Composite Key | | | | |------->| (tenant_id + academic year_id)|
| | +----------------+ +----------------------+ | |
| | Enforcement: query interceptor + index prefix |
+-------------------------------------------------------------+
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 78

PreOne ADR - Volume 3: Data Architecture v3.0
DATA FLOW DIAGRAM
Scope Resolution Flow: Request -> Auth (tenant_id from JWT) Request ->
Header (academic year_id from client) App Service -> Scope Resolver (compose
composite key) Repository -> WHERE tenant_id = ? AND academic year_id = ?
Postgres -> Index scan on composite key -> rows Cross-Scope Flow (rare):
Platform Admin -> bypass scope (with audit) Reporting Service -> aggregate
across scopes (read-only)
DATABASE IMPACT
High-volume temporal tables (attendance, gradebook, enrollment, audit_log)
are range-partitioned by academic_year with subpartitioning by tenant_id. The
parent table is declared as PARTITION BY RANGE (academic_year), with a
subpartition template that creates a tenant_id hash subpartition for each
academic-year partition. The composite primary key (tenant_id, school_id,
academic_year, id) is the partition key. Indexes are created on each leaf
partition, not on the parent (PostgreSQL 16 does not support partitioned
indexes globally; each partition has its own index). pg_partman is configured to
create the next academic-year partition one month ahead (July for an August
start) and to drop partitions older than 7 years per ADR-053. The drop is an
O(1) metadata operation that immediately reclaims storage. Cross-partition
queries (e.g., a 7-year transcript) are allowed but discouraged; the planner
prunes to the relevant partitions based on the academic_year predicate. The
default index on each leaf partition is a B-tree on (tenant_id, school_id,
academic_year, id) for point lookups; additional indexes are per-table per
ADR-050.
API IMPACT
API endpoints that query partitioned tables must include the academic_year as
a query parameter or path segment, enabling partition pruning. Endpoints that
omit academic_year default to the current academic year (resolved server-side
from the tenant's configuration); this default is documented in the API contract.
Endpoints that span multiple academic years (e.g., transcript generation)
accept an academic_year_range parameter and the planner prunes to the
relevant partitions. Bulk export endpoints (e.g., export all attendance for a
school for an academic year) are scoped to a single academic year by default;
multi-year exports require explicit academic_year_range and are rate-limited.
The API does not expose partition names; clients refer to academic years by
their canonical string (e.g., '2024-2025'). The API gateway validates
academic_year format with a regex; invalid formats are rejected with 400.
UI IMPACT
The UI surfaces academic year as an explicit scope selector in the top
navigation bar. Users with access to multiple academic years see a dropdown;
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 79

PreOne ADR - Volume 3: Data Architecture v3.0
selecting one triggers a server round-trip with the new scope header, and the
page reloads with the scoped data. The current academic year name is always
visible in the header (right side) to prevent user confusion about which scope
they are viewing. A 'Switch Academic Year' affordance is one click away from
any page. The UI was updated to clear all client-side caches (filters, sort state,
pagination) on scope change to prevent stale cross-scope data leaking into the
view.
SECURITY IMPACT
Academic year isolation does not introduce additional security properties
beyond tenant and school isolation (ADR-043, ADR-044). RLS policies are
inherited by each leaf partition, so tenant and school isolation are enforced at
the partition level. The partition key (tenant_id, school_id, academic_year, id)
ensures that a query scoped to a specific tenant and academic year prunes to a
single leaf partition, where RLS is applied. The pg_partman maintenance role is
granted only to the SRE team and is logged; partition creation and dropping are
audited. The retention drop (partitions older than 7 years) is permanent and
cannot be undone; the drop is preceded by a backup of the partition to S3
Glacier per ADR-054, and the partition is retained in cold storage for an
additional 7 years before final deletion. This two-stage retention ensures that
data is recoverable even if the drop was premature.
PERFORMANCE IMPACT
Partition pruning reduces query latency on the current academic year by 60-
80% versus the single-table alternative, based on internal benchmarks on the
attendance table (280M rows single-table vs 40M rows current-year partition).
The reduction is dominated by I/O: the current-year partition's B-tree index is
1.7 GB versus the single-table's 12 GB index, so the working set fits in memory
more readily. Cross-partition queries (e.g., a 7-year transcript) are slower than
single-partition queries but faster than the single-table alternative, because the
planner can parallelise across partitions
(max_parallel_workers_per_gather=4). Insert performance is unchanged:
inserts route to the correct leaf partition via the partition key, with the same B-
tree right-edge insertion cost as a single table. The pg_partman maintenance
operations (create, drop) are O(1) metadata operations and do not impact query
performance.
SCALABILITY ANALYSIS
Academic year partitioning scales to 500 tenants and 20 billion rows per
academic year. At 40M rows per (tenant, academic-year) leaf partition, the leaf
partition size is well within the recommended 100M-row ceiling. The number of
leaf partitions is 500 tenants x 7 academic years = 3500 leaf partitions per
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 80

PreOne ADR  -  Volume 3: Data Architecture  v3.0
table, which is within PostgreSQL's recommended partition count of 5000-
10000 per parent. The pg_partman maintenance overhead is linear in the
number of leaf partitions; the monthly create-and-drop job completes in under 5
minutes at 3500 leaf partitions. Beyond 500 tenants, the partition count
exceeds the recommended ceiling; the trigger for revisiting is documented in
the futureEvolution section. The strategy is stable for the foreseeable future.
OPERATIONAL CONSIDERATIONS
The SRE team owns the pg_partman configuration: the partition creation
schedule (1 month ahead), the retention policy (7 years per ADR-053), and the
partition naming convention. Application teams own the partitioned table
schemas: the parent table definition, the composite primary key, the per-
partition indexes, and the RLS policies. The CI pipeline verifies that every
partitioned table has a pg_partman configuration; a missing configuration
blocks the migration. The pg_partman monthly job is monitored: alert fires if
the job fails or if the next academic-year partition is missing less than 1 month
before the academic year start. The retention drop is preceded by a 7-day
warning to the application teams, who can request an extension for specific
tenants (e.g., a tenant under legal hold).
RISKS
| Risk                | Likelihood | Impact | Mitigation          |
| ------------------- | ---------- | ------ | ------------------- |
| A pg_partman        | Low        | High   | pg_partman          |
| failure causes the  |            |        | creates partitions  |
| next academic-      |            |        | 1 month ahead;      |
| year partition to   |            |        | alert fires if the  |
| be missing when     |            |        | next partition is   |
| the academic year   |            |        | missing less than   |
| starts, causing     |            |        | 1 month before      |
| inserts to fail.    |            |        | the academic year   |
start. SRE on-call
can create the
partition manually
as a fallback.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  81

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation           |
| ------------------ | ---------- | ------ | -------------------- |
| Partition count    | Medium     | Medium | Track partition      |
| exceeds the        |            |        | count quarterly; if  |
| recommended        |            |        | it exceeds 5000,     |
| ceiling (5000-     |            |        | accelerate tenant-   |
| 10000) at 500+     |            |        | sharding design      |
| tenants,           |            |        | (ADR-041 future      |
| degrading planner  |            |        | evolution).          |
| performance.       |            |        | Subpartitioning by   |
tenant cohort
hash can reduce
leaf partition
count.
| A cross-partition  | Medium | Medium | EXPLAIN             |
| ------------------ | ------ | ------ | ------------------- |
| query performs     |        |        | ANALYZE in CI       |
| poorly because     |        |        | for representative  |
| the planner does   |        |        | cross-partition     |
| not prune          |        |        | queries; alert on   |
| correctly,         |        |        | queries that scan   |
| scanning all       |        |        | more partitions     |
| partitions.        |        |        | than expected.      |
The
pg_stat_statement
s extension tracks
partition scans per
query.
| The retention drop  | Low | High | Retention drop is  |
| ------------------- | --- | ---- | ------------------ |
| removes a           |     |      | preceded by a 7-   |
| partition that is   |     |      | day warning;       |
| under legal hold,   |     |      | application teams  |
| causing data loss   |     |      | can request an     |
| with legal          |     |      | extension for      |
| consequences.       |     |      | specific tenants.  |
Legal holds are
tracked in a
separate table
that pg_partman
consults before
dropping.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
60-80% reduction in query latency on  Composite partition key is complex;
the current academic year via partition  cross-partition queries are slower than
| pruning. |     | single-table queries on a small dataset. |     |
| -------- | --- | ---------------------------------------- | --- |
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  82

PreOne ADR - Volume 3: Data Architecture v3.0
We Gain We Lose
O(1) retention enforcement via partition pg_partman dependency; partition
drop; no VACUUM required. maintenance is automated but must be
monitored.
Per-partition backup and restore within Partition count grows linearly with
the 4-hour RTO (ADR-056). tenants and academic years; must stay
below the 5000-10000 ceiling.
Composes cleanly with tenant and Indexes are per-partition, not global;
school isolation via inherited RLS adding a new index requires rebuilding
policies. it on every leaf partition.
REJECTED ALTERNATIVES
Single-table with academic_year column was the legacy approach and was
rejected on query performance (index bloat from prior years' data) and
retention enforcement (O(n) DELETE with VACUUM bloat). List partitioning by
academic_year without subpartitioning was rejected because a single
academic-year partition across all tenants would be 20 billion rows at scale,
exceeding the recommended single-partition size. Hash partitioning by
tenant_id without academic-year partitioning was rejected because it does not
address the temporal query pattern. A hybrid model (partitioning by
academic_year for the largest tables, single-table for the rest) was considered
but rejected because it would create two query patterns (partitioned and
single-table) that application teams would have to reason about; the uniform
partitioned approach is simpler. The full reasoning for each rejection is
captured in the Options Considered table.
MIGRATION PLAN
Migration from the legacy single-table schema to the partitioned schema
proceeds table-by-table over two quarters. Each migration follows the standard
pattern: (1) create the new partitioned parent table with the same schema as
the legacy table; (2) create the initial leaf partitions for the past 7 academic
years (per ADR-053 retention) and the upcoming academic year; (3) migrate
existing rows from the legacy table to the corresponding leaf partition via
INSERT ... SELECT, batched to avoid locking; (4) after migration, rename the
legacy table to <table>_legacy and rename the new partitioned parent to
<table>; (5) update application code to use the partitioned table; (6) drop the
legacy table after a 30-day observation period. Rollback per table is to rename
the partitioned parent to <table>_partitioned and rename the legacy table
back to <table>; the migrated rows are preserved in the partitioned table for
re-migration if needed.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 83

PreOne ADR - Volume 3: Data Architecture v3.0
TESTING STRATEGY
Academic year isolation is tested at three levels. (1) Unit: every partitioned
table's partition key is verified to be correct; inserts with each academic-year
value route to the correct leaf partition. (2) Integration: the CI pipeline runs
EXPLAIN ANALYZE on representative queries (current year, prior year, multi-
year, cross-tenant) and verifies that partition pruning reduces the scan to the
expected partitions. (3) Performance: the attendance-table query-latency
benchmark runs in CI on every schema change; regression beyond 5% on p99
latency blocks the change. The pg_partman monthly job is tested in staging by
advancing the clock and verifying that the next academic-year partition is
created and that the oldest partition is dropped per the retention policy.
MONITORING & OBSERVABILITY
Academic year isolation health is monitored through four metrics. (1) Partition
count per parent table; alert fires if the count exceeds 4000 (80% of the 5000-
10000 ceiling). (2) Partition pruning effectiveness: percentage of partitioned-
table queries that scan only the expected partitions, derived from
pg_stat_statements; target 95%, current 98%. (3) pg_partman job success:
alert fires if the monthly create-and-drop job fails or if the next academic-year
partition is missing less than 1 month before the academic year start. (4)
Retention drop count: number of partitions dropped per month per ADR-053;
alert fires if the count deviates from the expected value (one per tenant per
academic year). The EXPLAIN ANALYZE output for representative queries is
captured in the query-plan dashboard and reviewed weekly.
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
introduction of subpartitioning by tenant cohort hash when the partition count
exceeds the recommended ceiling at 500+ tenants. The cohort hash distributes
tenants across a fixed number of subpartitions (e.g., 32), reducing the leaf
partition count from 3500 to 32 x 7 = 224. The cohort hash is computed once
per tenant and stored in the tenants table. A second possible evolution is the
move to PostgreSQL 17's MERGE ... RETURNING for atomic cross-partition
operations, which would simplify some reporting queries. A third possible
evolution is the introduction of monthly partitioning for tables that grow faster
than the academic-year granularity (e.g., audit_log at 100M rows per academic
year per tenant), but no current table requires this.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-042 - UUID Strategy (id is part of the composite partition key)
● ADR-043 - Tenant Isolation (RLS inherited by leaf partitions)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 84

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● ADR-044 - School Isolation (RLS inherited by leaf partitions)
● ADR-050 - Indexing Strategy (per-partition indexes)
● ADR-053 - Data Retention (7-year retention enforced via partition drop)
● ADR-054 - Archive Policy (cold storage to S3 Glacier before drop)
● ADR-056 - Restore Strategy (per-partition restore within 4-hour RTO)
REFERENCES
● PostgreSQL Documentation - Table Partitioning. The PostgreSQL
Global Development Group. 2024.
● pg_partman Documentation - Keith Fiske. 2024.
● PostgreSQL 16 Release Notes - Partition Pruning Enhancements. 2023.
● PreOne Engineering Handbook, Section 7.6 - Academic Year Isolation.
Internal. 2025.
● PreOne Data Retention Policy, Section 3 - Academic Records. Internal.
2025.
DECISION HISTORY
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect |     | Office of the Chief Architect |     |
| --------- | --- | ----------------------------- | --- |
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  85

PreOne ADR - Volume 3: Data Architecture v3.0
Tech Lead Data Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● academic year_id column added to all scoped tables (Done)
● Composite indexes on (tenant_id, academic year_id) created (Done)
● Scope Resolver middleware deployed (Done)
● UI scope selector implemented (Done)
● Integration tests verify scope isolation (Done — 156 tests)
● Cross-scope admin paths audited (Done)
AD R -047
Soft Delete
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a soft delete pattern for every entity table in the PreOne schema:
rows are never physically deleted; instead, a deleted_at timestamptz
column is set to the current timestamp, and a deleted_by UUID v7 column
records the actor. All application queries filter on deleted_at IS NULL by
default; deleted rows are excluded unless explicitly requested. Hard deletes
are reserved for the retention enforcement job (ADR-053) and for explicitly
ephemeral data (cache, session). The pattern preserves auditability,
enables recovery from accidental deletion, and integrates with the branch
reconciliation protocol (ADR-045).
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 86

PreOne ADR - Volume 3: Data Architecture v3.0
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne is a regulated SaaS platform serving the education sector. Accidental
deletion of student records, enrollment records, or gradebook entries is a high-
impact incident: it disrupts operations, triggers regulatory reporting
obligations, and damages customer trust. The legacy platform used hard
deletes (DELETE FROM ...), and at least three incidents in the past two years
involved accidental deletion that required point-in-time recovery from backups,
with restore times of 4-8 hours and varying degrees of data loss. Soft delete is
the standard pattern for regulated SaaS: rows are marked as deleted via a
timestamp column, and queries exclude deleted rows by default. The pattern
preserves auditability (the row and its deletion event are retained), enables
recovery (the row can be un-deleted by clearing the timestamp), and integrates
with reconciliation protocols (a soft-deleted row in a branch client's SQLite
cache propagates to the cloud via the standard upsert, with the deleted_at
timestamp acting as the deletion marker). The principal alternative considered
was hard delete with a separate audit-log table that captures the deleted row's
state. This is the event-sourcing pattern: the audit log is the source of truth, and
the live table is a materialised view. This was rejected because it doubles the
storage cost (every row exists in both the live table and the audit log),
complicates queries (every read must join against the audit log to verify the row
is current), and does not integrate cleanly with the branch reconciliation
protocol (the audit log would need its own reconciliation path). A second
alternative was a tombstone table: a separate table that records the IDs of
deleted rows, with the live table queried via LEFT JOIN to exclude tombstoned
IDs. This was rejected because it complicates every query (the LEFT JOIN is
easy to forget, leading to deleted rows leaking into results) and because it does
not preserve the deleted row's state (recovery requires joining against a
historical backup, which is slow).
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 87

PreOne ADR - Volume 3: Data Architecture v3.0
BUSINESS DRIVERS
PreOne's institutional customers require that student records, enrollment
records, and gradebook entries be recoverable for at least 7 years (per
ADR-053 retention policy). Hard delete makes recovery dependent on backup
restore, which is slow (4-8 hours) and may lose data written between the last
backup and the deletion. Soft delete makes recovery an UPDATE (clearing
deleted_at), which is instant and lossless. A secondary driver is auditability.
Regulated SaaS must demonstrate that records were not improperly deleted. A
hard-delete schema can only demonstrate this via backup logs; a soft-delete
schema can demonstrate it via a simple query (SELECT * FROM enrollments
WHERE deleted_at IS NOT NULL). The soft-delete query is faster, more
reliable, and more auditable. A tertiary driver is integration with the branch
reconciliation protocol (ADR-045). When a branch client soft-deletes a row
offline, the deletion propagates to the cloud via the standard upsert: the row is
upserted with deleted_at set, and the cloud's soft-delete filter automatically
excludes it from queries. A hard-delete protocol would require a separate
delete-propagation path, complicating the reconciliation client.
PROBLEM STATEMENT
PreOne requires a deletion pattern that preserves auditability, enables instant
recovery from accidental deletion, integrates with the branch reconciliation
protocol (ADR-045), and is enforced uniformly across every entity table without
requiring application teams to remember to filter deleted rows.
CONSTRAINTS
● Every entity table must have a nullable deleted_at timestamptz column
and a nullable deleted_by UUID v7 column.
● Application queries must filter on deleted_at IS NULL by default;
deleted rows are excluded unless explicitly requested.
● Hard deletes (DELETE FROM) are forbidden in application code;
reserved for the retention enforcement job (ADR-053) and explicitly
ephemeral data.
● The soft-delete filter is enforced via a Postgres view that wraps the
underlying table, so application code querying the view automatically
gets the filter.
● Unique constraints must include deleted_at (e.g., UNIQUE (tenant_id,
school_id, email, deleted_at)) to allow re-creation of a soft-deleted
entity with the same natural key.
● Soft-deleted rows are retained for the full retention period (7 years per
ADR-053) and are archived to cold storage (ADR-054) before final hard
delete.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 88

PreOne ADR  -  Volume 3: Data Architecture  v3.0
ASSUMPTIONS
● The storage overhead of retaining soft-deleted rows for 7 years is
acceptable (estimated 15-25% increase in table size).
● Application teams will consistently query via the Postgres view rather
than the underlying table, ensuring the soft-delete filter is applied.
● Soft-deleted rows do not cause performance problems on queries (the
deleted_at IS NULL predicate is indexed).
● The retention enforcement job (ADR-053) correctly identifies rows
eligible for hard delete (deleted_at older than 7 years).
● Recovery from accidental deletion is sufficiently rare that the manual
UPDATE to clear deleted_at is acceptable; no self-service recovery UI is
required.
OPTIONS CONSIDERED
| Option               | Pros              | Cons              | Verdict |
| -------------------- | ----------------- | ----------------- | ------- |
| Soft delete via      | Preserves         | Storage overhead  | Adopted |
| deleted_at and       | auditability;     | (15-25%); unique  |         |
| deleted_by           | instant recovery  | constraints must  |         |
| columns, with        | via UPDATE;       | include           |         |
| application          | integrates with   | deleted_at; view  |         |
| queries filtered by  | branch            | indirection adds  |         |
| a Postgres view      | reconciliation;   | minor planning    |         |
| (the chosen          | uniform           | overhead.         |         |
| strategy).           | enforcement via   |                   |         |
view.
Hard delete with a  Clean separation  Doubles storage  Rejected
| separate audit-log  | between live and     | cost; complicates    |     |
| ------------------- | -------------------- | -------------------- | --- |
| table capturing     | historical data;     | queries (every       |     |
| the deleted row's   | live table stays     | read must verify     |     |
| state (event-       | small; audit log is  | against audit log);  |     |
| sourcing pattern).  | the source of        | does not integrate   |     |
|                     | truth.               | cleanly with         |     |
branch
reconciliation.
Tombstone table  Live table stays  Complicates every  Rejected
| recording deleted     | small; tombstone  | query (LEFT JOIN   |     |
| --------------------- | ----------------- | ------------------ | --- |
| IDs, with live table  | table is simple.  | easy to forget);   |     |
| queried via LEFT      |                   | does not preserve  |     |
| JOIN.                 |                   | deleted row's      |     |
state; recovery
requires backup
restore.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  89

PreOne ADR - Volume 3: Data Architecture v3.0
Option Pros Cons Verdict
Hard delete with Simplest schema; Recovery requires Rejected
daily backup as no soft-delete 4-8 hour backup
the recovery overhead. restore; data loss
mechanism. between last
backup and
deletion; fails
auditability
requirement.
DECISION
ADOPTED
Adopt a soft delete pattern for every entity table in the PreOne schema.
Every entity table will have a nullable deleted_at timestamptz column and a
nullable deleted_by UUID v7 column. Application queries will filter on
deleted_at IS NULL by default via a Postgres view that wraps the underlying
table; the view is the default query target, and the underlying table is
accessed only by the retention enforcement job (ADR-053) and by explicit
recovery operations. Hard deletes (DELETE FROM) are forbidden in
application code. Unique constraints will include deleted_at to allow re-
creation of soft-deleted entities with the same natural key. Soft-deleted
rows are retained for the full 7-year retention period and are archived to
cold storage (ADR-054) before final hard delete.
DETAILED RATIONALE
Soft delete via deleted_at and deleted_by columns was chosen because it is the
only pattern that satisfies all five PreOne hard requirements simultaneously:
auditability, instant recovery, integration with branch reconciliation, uniform
enforcement, and regulatory compliance. The event-sourcing alternative (hard
delete with separate audit log) was rejected primarily on storage cost. Every
row would exist in both the live table and the audit log, doubling storage. At
PreOne's projected scale (280M rows on the attendance table over 7 years),
doubling storage is a significant cost. The pattern also complicates queries:
every read must verify against the audit log to ensure the row is current, which
adds a join to every query and is easy to forget, leading to stale-data bugs. The
tombstone-table alternative was rejected because it does not preserve the
deleted row's state. Recovery from accidental deletion requires restoring the
row's state from a backup, which is slow (4-8 hours) and may lose data written
between the last backup and the deletion. The soft-delete pattern preserves the
row's state in place, so recovery is an instant UPDATE. The hard-delete-with-
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 90

PreOne ADR - Volume 3: Data Architecture v3.0
backup alternative was rejected because it fails the auditability requirement.
Regulated SaaS must demonstrate that records were not improperly deleted; a
hard-delete schema can only demonstrate this via backup logs, which are
indirect and slow to query. The soft-delete pattern allows a direct query
(SELECT * FROM enrollments WHERE deleted_at IS NOT NULL AND
deleted_at > now() - interval '24 hours') to list all deletions in the past 24 hours,
which is fast and auditable. The Postgres view enforcement is the key to
uniform application. Without it, application teams would have to remember to
filter on deleted_at IS NULL in every query, and the legacy platform had at least
two incidents where a forgotten filter caused deleted rows to leak into results.
The view wraps the underlying table and applies the filter automatically:
CREATE VIEW enrollments_active AS SELECT * FROM enrollments WHERE
deleted_at IS NULL. Application code queries the view (SELECT * FROM
enrollments_active), and the filter is applied by the planner. The underlying
table (enrollments) is accessed only by the retention enforcement job and by
explicit recovery operations, which are audited. The unique constraint
including deleted_at is a necessary consequence of soft delete. Consider an
email uniqueness constraint on the users table: a soft-deleted user with email
'alice@example.com' must not block the creation of a new user with the same
email (the original user is gone). A standard UNIQUE (email) constraint would
block the creation, which is wrong. Including deleted_at in the constraint
(UNIQUE (tenant_id, email, deleted_at)) allows multiple rows with the same
email, distinguished by their deleted_at timestamp (NULL for the active row, a
timestamp for each soft-deleted row). This is a partial uniqueness guarantee: at
most one row with deleted_at IS NULL for each (tenant_id, email). The
integration with branch reconciliation (ADR-045) is straightforward. When a
branch client soft-deletes a row offline, the deletion is recorded in the SQLite
cache as an UPDATE setting deleted_at. On reconciliation, the row is upserted
to the cloud with deleted_at set, and the cloud's soft-delete filter (the view)
automatically excludes it from queries. The LWW conflict resolution (ADR-045)
on updated_at ensures that a soft-delete from the branch client wins over a
concurrent update from the cloud, which is the correct behaviour (the branch
user explicitly deleted the row). The storage overhead of soft delete is
estimated at 15-25% increase in table size, based on the assumption that
approximately 15-25% of rows are soft-deleted over the 7-year retention period.
This is acceptable given the auditability and recovery benefits. The retention
enforcement job (ADR-053) hard-deletes rows older than 7 years, reclaiming
the storage.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | SOFT DELETE
PATTERN | +-------------------------------------------------------------+ |
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 91

PreOne ADR - Volume 3: Data Architecture v3.0
| | Table: enrollments | |
+-----------------------------------------------------+ | | | id (UUID v7) PK
| | | | tenant_id, school_id, academic_year | | | | student_id, status
| | | | created_at, updated_at, created_by, updated_by | | | | deleted_at
(NULL = active, timestamp = deleted) | | | | deleted_by (NULL = active,
UUID = deleted) | | | +-----------------------------------------------------+ | |
| | View: enrollments_active | |
+-----------------------------------------------------+ | | | SELECT * FROM enrollments
WHERE deleted_at IS NULL | | | +-----------------------------------------------------+ | |
^ | | | (default query target for application
code) | | | | | Application ->
enrollments_active (filtered) | | Retention Job -> enrollments
(unfiltered, hard delete) | | Recovery Op -> enrollments (unfiltered, UPDATE)
| | | | Unique constraint:
| | UNIQUE (tenant_id, school_id, student_id, deleted_at) | | -> allows re-
enrollment of soft-deleted student | | |
| Indexes: | | PRIMARY KEY (tenant_id,
school_id, academic_year, id) | | INDEX (tenant_id, school_id, student_id)
WHERE | | deleted_at IS NULL -- partial index for active |
+-------------------------------------------------------------+
SEQUENCE DIAGRAM
User -> API: DELETE /enrollments/{id} API -> Permission Resolver: verify can
delete Permission Resolver -> API: ok API -> PgBouncer: BEGIN API ->
PgBouncer: SET LOCAL app.tenant_id, app.school_ids PgBouncer -> RDS
Primary: route API -> PgBouncer: UPDATE enrollments SET deleted_at=now(),
deleted_by='user-uuid' WHERE id=... PgBouncer -> RDS Primary: UPDATE RDS
Primary -> Audit Trigger: log to audit_log RDS Primary -> PgBouncer: 1 row
updated PgBouncer -> API: ok API -> User: 204 No Content (Later, recovery:)
Admin -> API: POST /enrollments/{id}/recover API -> PgBouncer: UPDATE
enrollments SET deleted_at=NULL, deleted_by=NULL WHERE id=...
PgBouncer -> RDS Primary: UPDATE RDS Primary -> Audit Trigger: log
recovery to audit_log RDS Primary -> PgBouncer: 1 row updated PgBouncer ->
API: ok API -> Admin: 200 OK (recovered)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-047 — Soft Delete -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Application | delete |
Repository | | | | Service |------->| (intercepts delete) | | |
+----------------+ +----------+-----------+ | | |
| | | UPDATE | | |
deleted_at = now() | | v | |
+--------+----------+ | | | Table with | | |
| deleted_at column | | | +--------+----------+ | |
| | | | filter | |
v | | +--------+----------+ | | |
Default scope: | | | | WHERE deleted_at | | |
| IS NULL | | | +-------------------+ |
+-------------------------------------------------------------+
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 92

PreOne ADR - Volume 3: Data Architecture v3.0
DATA FLOW DIAGRAM
Delete Flow: App -> Repository.delete(id) Repository -> UPDATE ... SET
deleted_at = NOW() WHERE id = ? Postgres -> row updated (NOT deleted from
disk) Read Flow (default): App -> Repository.find(filter) Repository ->
SELECT ... WHERE deleted_at IS NULL AND ... Postgres -> partial index scan
-> active rows only Read Flow (with-deleted): Admin ->
Repository.findWithDeleted(filter) Repository -> SELECT ... WHERE ... (no
deleted_at filter) Postgres -> all rows including deleted
DATABASE IMPACT
Every entity table has nullable deleted_at timestamptz and deleted_by UUID v7
columns, both defaulting to NULL. A Postgres view (<table>_active) wraps
each entity table, filtering on deleted_at IS NULL. Application code queries the
view by default; the underlying table is accessed only by the retention
enforcement job and by explicit recovery operations. Unique constraints
include deleted_at to allow re-creation of soft-deleted entities: UNIQUE
(tenant_id, <natural_key>, deleted_at). Partial indexes on the active subset
(WHERE deleted_at IS NULL) provide efficient access for the common case.
The audit_log table (ADR-086) captures every UPDATE to deleted_at as a
deletion event and every UPDATE clearing deleted_at as a recovery event, with
the actor and timestamp. The retention enforcement job (ADR-053) hard-
deletes rows where deleted_at < now() - interval '7 years', after archiving them
to cold storage (ADR-054).
API IMPACT
API endpoints that retrieve entities query the active view by default, returning
only non-deleted rows. The DELETE method on an entity endpoint performs a
soft delete (UPDATE setting deleted_at and deleted_by). The endpoint returns
204 No Content on success. A separate POST /<entity>/{id}/recover endpoint
performs a recovery (UPDATE clearing deleted_at and deleted_by), returning
200 OK. Endpoints that need to include deleted rows accept an
include_deleted=true query parameter, which is validated against the caller's
permissions (only admins can query deleted rows). Bulk delete endpoints
perform soft delete in batch; bulk recover endpoints perform recovery in batch.
The API contract documents that DELETE is idempotent: deleting an already-
deleted row is a no-op (the deleted_at timestamp is not updated).
UI IMPACT
Soft delete changes the UI in two ways. First, list pages that previously hid
deleted items unchanged — they still hide them. Second, admin users gain a
'Show deleted' toggle on list pages; when enabled, deleted rows appear with a
strike-through style and a 'Restore' button. The restore action calls a dedicated
restore endpoint that clears the deleted_at column (with audit logging). The
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 93

PreOne ADR - Volume 3: Data Architecture v3.0
'Delete' button on detail pages was relabelled to 'Archive' for non-admin users
(because the data is recoverable) and remains 'Delete' for admins (who
understand the soft-delete semantics). No data loss is visible to end users.
SECURITY IMPACT
Soft delete preserves the audit trail for every deletion, which is a security
benefit. The audit_log captures the actor (deleted_by), the timestamp
(deleted_at), and the row state at deletion time, enabling forensic analysis of
improper deletions. The recover endpoint is restricted to admin roles; standard
users cannot recover deleted entities. The include_deleted=true query
parameter is restricted to admin roles; standard users cannot see deleted rows.
The retention enforcement job's hard delete is preceded by a 7-day warning and
is audited; the hard delete is permanent and cannot be undone (the row is gone
from Postgres, though it remains in cold storage per ADR-054 for an additional
7 years). The soft-delete pattern does not introduce new attack surfaces; the
principal residual risk is a forgotten filter in a query that bypasses the view and
reads the underlying table directly, which is mitigated by code review and by a
migration linter that flags queries against underlying tables.
PERFORMANCE IMPACT
Soft delete adds a constant per-query filter cost (deleted_at IS NULL), which is
satisfied by the partial index (WHERE deleted_at IS NULL) at O(log n) cost. The
partial index is smaller than a full index (it contains only active rows), so cache
hit ratio is higher. The net performance impact is negligible (less than 2% on
p99 latency) on the PreOne workload. The storage overhead is 15-25% increase
in table size, which is acceptable. The retention enforcement job's hard delete
is a batch DELETE that runs nightly; the DELETE produces dead tuples that are
reclaimed by autovacuum, with per-table autovacuum scaling factors tuned to
keep up with the deletion rate (ADR-050). The recovery operation (UPDATE
clearing deleted_at) is a single-row UPDATE that is O(log n) on the partial
index.
SCALABILITY ANALYSIS
Soft delete scales linearly with table size. The partial index (WHERE deleted_at
IS NULL) contains only active rows, so its size is proportional to the active row
count, not the total row count. At PreOne's projected scale (280M rows on the
attendance table over 7 years, of which approximately 25% are soft-deleted at
any time), the partial index is 210M rows, which is well within a single B-tree's
capacity. The retention enforcement job's nightly DELETE processes
approximately 200K rows per night (the daily deletion rate), which is well
within autovacuum's capacity. The strategy is stable for the foreseeable future.
The trigger for revisiting is if the soft-delete rate exceeds 50% of total rows,
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 94

PreOne ADR  -  Volume 3: Data Architecture  v3.0
which would indicate either a data-quality problem (rows being deleted and re-
created frequently) or a schema design problem (entities that should be
ephemeral are being soft-deleted).
OPERATIONAL CONSIDERATIONS
The SRE team owns the retention enforcement job (ADR-053) and the cold-
storage archive (ADR-054). Application teams own the entity table schemas,
the views, the partial indexes, and the API endpoints. The CI pipeline verifies
that every entity table has the deleted_at and deleted_by columns, the active
view, the partial index, and the unique constraint including deleted_at; a
missing element blocks the migration. The migration linter flags application
code that queries the underlying table directly (rather than the view); such
queries require explicit review and a justification comment. The recovery
operation is performed via the admin API; on-call runbooks document the
recovery procedure for common accidental-deletion scenarios. The retention
enforcement job's hard delete is monitored; alert fires if the job fails or if the
hard-delete count deviates from the expected value.
RISKS
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Application code   | Medium     | Medium | Migration linter    |
| queries the        |            |        | flags direct        |
| underlying table   |            |        | queries against     |
| directly,          |            |        | underlying tables;  |
| bypassing the      |            |        | code review         |
| view and leaking   |            |        | enforces view       |
| deleted rows into  |            |        | usage. Quarterly    |
| results.           |            |        | audit of            |
application code
for direct table
access.
| Storage overhead   | Low | Medium | Monitor soft-     |
| ------------------ | --- | ------ | ----------------- |
| of soft-deleted    |     |        | delete rate       |
| rows exceeds       |     |        | monthly; if rate  |
| projection,        |     |        | exceeds 30% of    |
| straining the      |     |        | total rows,       |
| cluster's storage  |     |        | investigate root  |
| budget.            |     |        | cause. Retention  |
enforcement job
reclaims storage
nightly.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  95

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk                 | Likelihood | Impact | Mitigation          |
| -------------------- | ---------- | ------ | ------------------- |
| The retention        | Low        | High   | Legal holds are     |
| enforcement job      |            |        | tracked in a        |
| hard-deletes rows    |            |        | separate table      |
| that are under       |            |        | that the retention  |
| legal hold, causing  |            |        | job consults        |
| data loss with       |            |        | before deleting.    |
| legal                |            |        | Hard delete is      |
| consequences.        |            |        | preceded by a 7-    |
day warning.
| Recovery from    | Low | Medium | Recovery is         |
| ---------------- | --- | ------ | ------------------- |
| accidental       |     |        | performed via the   |
| deletion is      |     |        | admin API with      |
| performed        |     |        | audit logging; the  |
| incorrectly,     |     |        | recovery            |
| restoring the    |     |        | operation is        |
| wrong row or     |     |        | reversible (re-     |
| restoring a row  |     |        | delete via          |
| that should      |     |        | DELETE). The        |
| remain deleted.  |     |        | audit log captures  |
the recovery actor
and timestamp for
forensic analysis.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Instant recovery from accidental  Storage overhead of 15-25% for
deletion via UPDATE (clearing  retaining soft-deleted rows for 7 years.
deleted_at).
Auditability: every deletion is captured  Application code must query the active
with actor and timestamp. view, not the underlying table; requires
linting discipline.
Integrates with branch reconciliation:  Unique constraints must include
soft-delete propagates via standard  deleted_at, complicating schema
| upsert. |     | design. |     |
| ------- | --- | ------- | --- |
Uniform enforcement via Postgres view;  View indirection adds minor planning
forgotten-filter risk eliminated. overhead (less than 1ms per query).
REJECTED ALTERNATIVES
Event-sourcing (hard delete with separate audit log) was rejected on storage
cost (doubling) and query complexity (every read must verify against audit log).
Tombstone table was rejected because it does not preserve the deleted row's
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  96

PreOne ADR - Volume 3: Data Architecture v3.0
state, requiring backup restore for recovery. Hard delete with backup as
recovery was rejected because it fails the auditability requirement and
recovery is slow (4-8 hours). A time-travel table (Temporal Tables extension)
was considered but rejected because it adds significant complexity and the
PostgreSQL 16 SQL:2011 temporal table support is incomplete. A separate
deleted_rows table (similar to tombstone but preserving state) was considered
but rejected because it duplicates the soft-delete pattern with extra indirection.
The full reasoning for each rejection is captured in the Options Considered
table.
MIGRATION PLAN
Migration from the legacy hard-delete schema to the soft-delete pattern
proceeds table-by-table over two quarters. Each migration follows the standard
pattern: (1) add the nullable deleted_at and deleted_by columns with defaults of
NULL; (2) create the active view (<table>_active) wrapping the table with the
deleted_at IS NULL filter; (3) create the partial index (WHERE deleted_at IS
NULL) on the columns used by the most common queries; (4) update the unique
constraints to include deleted_at; (5) update application code to query the view
instead of the underlying table; (6) update the DELETE endpoint to perform a
soft delete (UPDATE setting deleted_at and deleted_by); (7) add the POST
/<entity>/{id}/recover endpoint. Rollback per table is to drop the view, the
partial index, the deleted_at and deleted_by columns, and the recover endpoint;
the DELETE endpoint reverts to hard delete. Existing rows are not affected by
the migration (their deleted_at remains NULL).
TESTING STRATEGY
Soft delete is tested at three levels. (1) Unit: every entity table's active view is
verified to return only non-deleted rows; the underlying table is verified to
return all rows including deleted. The unique constraint including deleted_at is
verified to allow re-creation of soft-deleted entities. (2) Integration: the CI
pipeline verifies that the DELETE endpoint performs a soft delete (deleted_at is
set, the row remains in the underlying table) and that the recover endpoint
performs a recovery (deleted_at is cleared, the row reappears in the active
view). (3) End-to-end: a quarterly recovery drill simulates an accidental
deletion and verifies that the recovery procedure restores the data correctly
within the documented time. The migration linter is tested by injecting direct-
table-access queries and verifying that they are flagged.
MONITORING & OBSERVABILITY
Soft delete health is monitored through four metrics. (1) Soft-delete rate: count
of UPDATE statements setting deleted_at per hour per table; alert fires if the
rate deviates significantly from the historical baseline (potential incident). (2)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 97

PreOne ADR - Volume 3: Data Architecture v3.0
Recovery rate: count of UPDATE statements clearing deleted_at per hour per
table; alert fires if the rate exceeds 10 per hour (potential abuse of the recovery
endpoint). (3) Active row ratio: percentage of rows in each table with deleted_at
IS NULL; alert fires if the ratio drops below 70% (potential data-quality
problem). (4) Retention enforcement job: count of hard-deleted rows per night
per table; alert fires if the job fails or if the count deviates from the expected
value. The audit_log table is queried weekly to list all deletions and recoveries
for forensic review.
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
introduction of a self-service recovery UI for non-admin users (currently
recovery is admin-only), which would require a permission model for who can
recover which entities. A second possible evolution is the move to PostgreSQL
17's SQL:2011 temporal table support, which would provide system-versioned
tables natively; this would replace the soft-delete pattern with a more
standardised mechanism, but the migration cost is significant. A third possible
evolution is the introduction of a soft-delete cascade (deleting a parent entity
soft-deletes its child entities), but this is currently handled at the application
layer and a database-level cascade would introduce complexity. No current
PreOne use case requires these evolutions.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-042 - UUID Strategy (deleted_by is UUID v7)
● ADR-043 - Tenant Isolation (RLS applies to soft-deleted rows too)
● ADR-045 - Branch Isolation (soft-delete propagates via reconciliation
upsert)
● ADR-048 - Audit Columns (deleted_at and deleted_by are standard
audit columns)
● ADR-053 - Data Retention (7-year retention enforced via hard delete of
soft-deleted rows)
● ADR-054 - Archive Policy (soft-deleted rows archived to cold storage
before hard delete)
● ADR-086 - Audit Trail (audit_log captures deletion and recovery events)
REFERENCES
● PostgreSQL Documentation - Views and Partial Indexes. The
PostgreSQL Global Development Group. 2024.
● Fowler, M. - Patterns of Enterprise Application Architecture, Soft
Delete pattern. Addison-Wesley. 2002.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 98

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● PreOne Engineering Handbook, Section 7.7 - Soft Delete. Internal.
2025.
● PreOne Data Retention Policy, Section 4 - Deletion and Recovery.
Internal. 2025.
● PreOne Security Policy, Section 5 - Audit Trail for Deletions. Internal.
2025.
DECISION HISTORY
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Office of the Chief Architect |     |
| ----------- | --- | ----------------------------- | --- |
| Tech Lead   |     | Data Platform Lead            |     |
| ARB Chair   |     | Architecture Review Board     |     |
| Approved On |     | 2025-10-15                    |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  99

PreOne ADR - Volume 3: Data Architecture v3.0
● On-call runbook updated with operational procedures (Done)
● deleted_at column added to all soft-deletable tables (Done)
● Partial indexes (WHERE deleted_at IS NULL) created (Done)
● Repository default scope updated (Done)
● Admin 'Show deleted' UI toggle implemented (Done)
● Restore endpoint deployed (Done)
● Quarterly purge of stale soft-deleted rows (Scheduled)
AD R -048
Audit Columns
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a standard set of audit columns on every entity table in the PreOne
schema: created_at, updated_at, created_by, and updated_by. The
created_at and updated_at columns are timestamptz, populated by Postgres
DEFAULT and trigger respectively. The created_by and updated_by
columns are UUID v7 referencing the actors table, populated by the
application via session context. Audit columns are non-nullable on entity
tables, are indexed for forensic queries, and feed the audit_log table
(ADR-086) for full change history.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 100

PreOne ADR - Volume 3: Data Architecture v3.0
CONTEXT
PreOne is a regulated SaaS platform serving the education sector. Every
mutation to a regulated entity (student record, enrollment, gradebook entry)
must be attributable to an actor and a timestamp for compliance and forensic
purposes. The legacy platform used a mix of audit conventions: some tables had
created_at only, some had created_at and updated_at, some had created_by,
and the audit trail was incomplete. At least two compliance incidents in the past
two years involved the inability to attribute a mutation to an actor, requiring
manual investigation that took days. The standard audit-column set is the
industry norm: created_at, updated_at, created_by, updated_by. The first two
are timestamps populated by the database (created_at via DEFAULT,
updated_at via a BEFORE UPDATE trigger). The latter two are actor references
populated by the application via session context (the app.current_user_id
session setting, set at session start by the API gateway after authentication).
The principal alternative considered was a full audit-log table that captures
every mutation as a separate row (the event-sourcing pattern, also considered
in ADR-047). This was rejected for the same reasons as in ADR-047: storage
cost (the audit log doubles storage) and query complexity (every read must
verify against the audit log). The audit-column pattern provides the minimum
audit information (who created, who last updated) without the storage cost of a
full audit log. The full audit log is still maintained (ADR-086) but as a separate
concern, fed by triggers that capture the full row state at each mutation. A
second alternative was application-level audit only, where the application sets
the audit columns but the database does not enforce them. This was rejected
because it relies on application discipline, which is unreliable: a forgotten SET
on a session leaves the audit columns NULL, and a direct database write (e.g.,
by a migration or a maintenance script) bypasses the application entirely.
Database-level enforcement via DEFAULT and triggers ensures the audit
columns are always populated, regardless of how the write occurs.
BUSINESS DRIVERS
PreOne's institutional customers require that every mutation to a regulated
entity be attributable to an actor and a timestamp, for FERPA, GDPR, and
equivalent regulatory compliance. A compliance audit that cannot attribute a
mutation is a failed audit, with contractual and regulatory consequences. The
audit-column pattern ensures that the minimum audit information (who
created, who last updated) is always present, making compliance audits
routine. A secondary driver is forensic investigation. When a customer reports
an unexpected data change (e.g., 'why did this student's grade change?'), the
audit columns provide the first investigative lead: the updated_by column
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 101

PreOne ADR - Volume 3: Data Architecture v3.0
identifies the actor, and the updated_at column identifies the time. The full
audit_log (ADR-086) provides the complete change history, but the audit
columns are the entry point. A tertiary driver is the branch reconciliation
protocol (ADR-045). The updated_at column is the LWW conflict-resolution key:
when a branch client reconciles, the cloud applies the row with the later
updated_at. The updated_by column identifies which actor (branch user or
cloud user) made the change, which is useful for forensic analysis of LWW
conflicts.
PROBLEM STATEMENT
PreOne requires a standard audit-column pattern that captures who created
and who last updated every entity row, is enforced at the database layer (not
relying on application discipline), integrates with the branch reconciliation
protocol (ADR-045), and feeds the full audit_log (ADR-086) for complete change
history.
CONSTRAINTS
● Every entity table must have non-nullable created_at, updated_at,
created_by, and updated_by columns.
● created_at is populated by DEFAULT now() at insert; updated_at is
populated by a BEFORE UPDATE trigger.
● created_by and updated_by are UUID v7 referencing the actors table,
populated from app.current_user_id session setting.
● Audit columns are indexed (created_at, updated_at) for forensic queries
on time ranges.
● Audit columns are non-nullable; migrations that add audit columns
must backfill existing rows with a sentinel value.
● Direct database writes (migrations, maintenance scripts) must set
app.current_user_id or accept a sentinel value (system actor).
ASSUMPTIONS
● The app.current_user_id session setting is reliably set by the API
gateway before any application query.
● PgBouncer transaction pooling preserves app.current_user_id within a
transaction (via SET LOCAL).
● The actors table contains a sentinel 'system' actor for migrations and
maintenance scripts.
● The 4-column audit overhead (32 bytes for two UUIDs + 16 bytes for
two timestamps = 48 bytes per row) is acceptable.
● The BEFORE UPDATE trigger does not significantly impact write
performance (estimated 2-3% overhead).
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 102

PreOne ADR  -  Volume 3: Data Architecture  v3.0
OPTIONS CONSIDERED
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
Standard audit  Always populated;  Triggers add 2-3%  Adopted
| columns       | minimal storage     | write overhead;    |     |
| ------------- | ------------------- | ------------------ | --- |
| (created_at,  | overhead (48        | relies on          |     |
| updated_at,   | bytes); integrates  | app.current_user_i |     |
| created_by,   | with LWW            | d session setting  |     |
| updated_by)   | reconciliation;     | discipline.        |     |
| populated by  | feeds audit_log.    |                    |     |
DEFAULT and
triggers (the
chosen strategy).
| Full audit-log     | Complete change    | Doubles storage;   | Rejected |
| ------------------ | ------------------ | ------------------ | -------- |
| table capturing    | history; no        | complicates        |          |
| every mutation as  | information loss;  | queries; does not  |          |
| a separate row     | audit log is the   | integrate cleanly  |          |
| (event-sourcing    | source of truth.   | with LWW           |          |
| pattern).          |                    | reconciliation     |          |
(audit log has its
own conflict-
resolution path).
| Application-level  | No trigger        | Relies on        | Rejected |
| ------------------ | ----------------- | ---------------- | -------- |
| audit only, where  | overhead;         | application      |          |
| the application    | simplest schema;  | discipline;      |          |
| sets the audit     | maximum           | forgotten SET    |          |
| columns but the    | flexibility.      | leaves columns   |          |
| database does not  |                   | NULL; direct     |          |
| enforce them.      |                   | database writes  |          |
bypass audit
entirely.
Audit columns  Audit columns for  Storage cost of  Rejected (for the
plus a separate  fast access;  history table  history table; the
history table  history table for  (similar to event- audit columns are
| populated by       | complete change  | sourcing);         | adopted) |
| ------------------ | ---------------- | ------------------ | -------- |
| triggers (hybrid). | log.             | complexity of two  |          |
audit mechanisms.
DECISION
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  103

PreOne ADR - Volume 3: Data Architecture v3.0
ADOPTED
Adopt a standard set of audit columns on every entity table in the PreOne
schema: created_at, updated_at, created_by, and updated_by. The
created_at column is timestamptz populated by DEFAULT now() at insert.
The updated_at column is timestamptz populated by a BEFORE UPDATE
trigger. The created_by and updated_by columns are UUID v7 referencing
the actors table, populated from the app.current_user_id session setting.
Audit columns are non-nullable on entity tables, are indexed for forensic
queries, and feed the audit_log table (ADR-086) for full change history.
Direct database writes must set app.current_user_id or accept a sentinel
'system' actor value. The audit-column pattern is enforced at the database
layer, not relying on application discipline.
DETAILED RATIONALE
Standard audit columns populated by DEFAULT and triggers was chosen
because it is the only pattern that satisfies all five PreOne hard requirements
simultaneously: always-populated audit information, minimal storage
overhead, integration with LWW reconciliation, database-level enforcement,
and feed for the full audit_log. The full audit-log alternative was rejected on
storage cost, as in ADR-047. The audit-column pattern provides the minimum
audit information (who created, who last updated) at 48 bytes per row; a full
audit log would double storage by capturing every mutation as a separate row.
The audit columns and the audit_log are complementary: the audit columns are
the fast-access summary (who last touched this row), and the audit_log is the
complete change history (every mutation with the full row state). The audit_log
is fed by triggers that capture the full row state at each mutation, separately
from the audit-column triggers. The application-level-only alternative was
rejected because it relies on application discipline, which is unreliable. The
legacy platform had at least two incidents where a forgotten SET on a session
left the audit columns NULL, breaking the audit trail. Database-level
enforcement via DEFAULT and triggers ensures the audit columns are always
populated, regardless of how the write occurs: application code, migration
scripts, maintenance jobs, and even direct psql sessions all get the audit
columns populated correctly (with the 'system' sentinel for writes without a
user session). The hybrid alternative (audit columns plus a separate history
table) was rejected because it duplicates the audit_log pattern. The audit_log
table (ADR-086) already serves as the complete change history; adding a
separate history table would be redundant. The audit columns are the fast-
access summary; the audit_log is the complete history. Two mechanisms are
sufficient; three would be complexity without benefit. The created_at column is
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 104

PreOne ADR - Volume 3: Data Architecture v3.0
populated by DEFAULT now() at insert, which is the simplest and most reliable
mechanism. The DEFAULT ensures that even a bare INSERT (without
specifying created_at) gets the correct value. The updated_at column is
populated by a BEFORE UPDATE trigger that sets updated_at = now() on every
UPDATE. The trigger is a one-time schema setup; application code does not
need to set updated_at manually. The trigger also populates updated_by from
app.current_user_id, ensuring that the actor is captured even if the application
code forgets to set it. The created_by and updated_by columns are UUID v7
referencing the actors table, which is a unified table containing all actor types
(users, service accounts, system). The actors table is the authoritative source of
actor identity; the audit columns reference it. The app.current_user_id session
setting is set by the API gateway after authentication, based on the
authenticated user's UUID. For service-to-service calls, the setting is the
service account's UUID. For direct database writes (migrations, maintenance
scripts), the setting is the 'system' sentinel UUID, which is a well-known value
documented in the engineering handbook. The PgBouncer transaction pooling
preservation of app.current_user_id is critical. SET LOCAL (not SET) is used
within each transaction, so the setting is reset at COMMIT. This ensures that a
connection reused across transactions (via PgBouncer) does not carry the
previous transaction's user_id forward. The integration test verifies that
app.current_user_id is reset between transactions. The integration with LWW
reconciliation (ADR-045) is straightforward. The updated_at column is the
LWW conflict-resolution key: when a branch client reconciles, the cloud applies
the row with the later updated_at. The updated_by column identifies which
actor (branch user or cloud user) made the change, which is useful for forensic
analysis of LWW conflicts. The BEFORE UPDATE trigger does not interfere
with LWW reconciliation because the reconciliation upsert sets updated_at
explicitly (to the branch client's wall-clock time), and the trigger only fires on
UPDATE (not on INSERT ... ON CONFLICT DO UPDATE, where the conflict
action is treated as an INSERT for trigger purposes). The storage overhead of
48 bytes per row is acceptable. On the average PreOne entity table (8 columns,
96 bytes per row), the audit columns add 48 bytes, a 50% increase in row
storage. However, the audit columns are the same on every entity table, so the
overhead is uniform and predictable. The total storage increase across the
cluster is estimated at 30%, which is acceptable given the audit and forensic
benefits.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | AUDIT COLUMNS
PATTERN | +-------------------------------------------------------------+ |
| | Table: enrollments | |
+-----------------------------------------------------+ | | | id (UUID v7) PK
| | | | tenant_id, school_id, academic_year | | | | student_id, status
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 105

PreOne ADR - Volume 3: Data Architecture v3.0
| | | | | | | | -- Audit columns (non-nullable) --
| | | | created_at TIMESTAMPTZ DEFAULT now() | | | | updated_at
TIMESTAMPTZ (BEFORE UPDATE trigger) | | | | created_by UUID v7
(app.current_user_id) | | | | updated_by UUID v7 (app.current_user_id)
| | | | | | | | -- Soft delete columns (ADR-047)
-- | | | | deleted_at TIMESTAMPTZ (nullable) | | | |
deleted_by UUID v7 (nullable) | | |
+-----------------------------------------------------+ | |
| | BEFORE INSERT trigger: | | created_at := now()
(DEFAULT) | | created_by := app.current_user_id
| | updated_at := now() | | updated_by :=
app.current_user_id | | | |
BEFORE UPDATE trigger: | | updated_at := now()
| | updated_by := app.current_user_id | |
| | AFTER INSERT/UPDATE/DELETE trigger: | | INSERT INTO
audit_log (table, pk, action, old, new, | | actor, timestamp)
| | -> feeds full change history (ADR-086) | |
| | Indexes: | | INDEX (tenant_id, updated_at) --
forensic time queries | | INDEX (tenant_id, created_by) -- actor attribution |
+-------------------------------------------------------------+
SEQUENCE DIAGRAM
User -> API: POST /enrollments (authenticated) API -> API Gateway: validate
token, extract user_id API Gateway -> PgBouncer: BEGIN API Gateway ->
PgBouncer: SET LOCAL app.current_user_id = 'user-uuid' API Gateway ->
PgBouncer: SET LOCAL app.tenant_id = 'tenant-uuid' PgBouncer -> RDS
Primary: route API -> PgBouncer: INSERT INTO enrollments (student_id, ...)
VALUES (...) PgBouncer -> RDS Primary: INSERT RDS Primary -> BEFORE
INSERT trigger: set audit columns BEFORE INSERT trigger -> RDS Primary:
created_at=now(), created_by=user-uuid RDS Primary -> AFTER INSERT
trigger: log to audit_log AFTER INSERT trigger -> audit_log: INSERT
(action=INSERT, new=row, actor=user-uuid) RDS Primary -> PgBouncer: 1 row
inserted PgBouncer -> API: ok API -> User: 201 Created (Later, update:) User
-> API: PATCH /enrollments/{id} {status: 'active'} API -> PgBouncer: BEGIN;
SET LOCAL app.current_user_id PgBouncer -> RDS Primary: route API ->
PgBouncer: UPDATE enrollments SET status='active' WHERE id=... PgBouncer
-> RDS Primary: UPDATE RDS Primary -> BEFORE UPDATE trigger: set
updated_at, updated_by RDS Primary -> AFTER UPDATE trigger: log to
audit_log (action=UPDATE, old, new) RDS Primary -> PgBouncer: 1 row updated
PgBouncer -> API: ok API -> User: 200 OK
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-048 — Audit Columns -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Application | insert/|
Repository | | | | Service | update | (auto-populates) | | |
+----------------+ +----------+-----------+ | | |
| | | sets | | v
| | +-----------------------------------------------------+ | | | Every table includes:
| | | | created_at, created_by, | | | | updated_at,
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 106

PreOne ADR - Volume 3: Data Architecture v3.0
updated_by, | | | | version (optimistic lock) | |
| +-----------------------------------------------------+ | |
| | Trigger layer (Postgres BEFORE UPDATE): | | - updated_at =
NOW() | | - updated_by = current_user()
| | - version = version + 1 |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Insert Flow: App -> Repository.insert(entity) Repository -> set created_at,
created_by, version=0 Postgres -> INSERT row with audit columns Update
Flow: App -> Repository.update(entity) Repository -> set updated_at,
updated_by, version+1 Postgres -> BEFORE UPDATE trigger enforces non-null
Audit Read Flow: Audit Service -> SELECT created_at, created_by, updated_at,
updated_by Audit Service -> join to user table for display names
DATABASE IMPACT
Every entity table has non-nullable created_at, updated_at, created_by, and
updated_by columns. created_at is timestamptz DEFAULT now(). updated_at is
timestamptz, populated by a BEFORE UPDATE trigger. created_by and
updated_by are UUID v7 referencing the actors table, populated from
app.current_user_id session setting via the same trigger. The BEFORE INSERT
trigger sets created_at, created_by, updated_at, and updated_by (so that
updated_at matches created_at at insert time). The AFTER
INSERT/UPDATE/DELETE trigger inserts a row into audit_log (ADR-086) with
the table name, primary key, action (INSERT/UPDATE/DELETE), old row state
(for UPDATE/DELETE), new row state (for INSERT/UPDATE), actor
(app.current_user_id), and timestamp (now()). Audit columns are indexed:
INDEX (tenant_id, updated_at) for forensic time-range queries, INDEX
(tenant_id, created_by) for actor-attribution queries. The actors table is a
unified table containing all actor types (users, service accounts, system), with a
sentinel 'system' UUID for migrations and maintenance scripts.
API IMPACT
API endpoints do not directly set audit columns; the database triggers handle it.
The API gateway sets app.current_user_id on the Postgres session after
authentication, based on the authenticated user's UUID. For service-to-service
calls, the setting is the service account's UUID. The API contract documents
that audit columns are read-only via the API; clients cannot set created_at,
updated_at, created_by, or updated_by. The GET /<entity>/{id} endpoint
includes audit columns in the response (subject to permission: standard users
see created_at and updated_at; admin users also see created_by and
updated_by). The GET /<entity>/{id}/history endpoint returns the full change
history from audit_log (ADR-086), subject to admin permission. The API does
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 107

PreOne ADR - Volume 3: Data Architecture v3.0
not expose the app.current_user_id session setting directly; it is set
transparently by the gateway.
UI IMPACT
Audit columns are surfaced in the UI on detail pages and in admin list views.
Every entity detail page now includes a 'Metadata' panel at the bottom showing
'Created: <date> by <user>', 'Last updated: <date> by <user>', 'Version: N'.
This panel is read-only and uses a muted colour scheme to distinguish it from
business data. List views for admin users gained optional 'Created', 'Updated',
and 'Modified by' columns (hidden by default, available via the column picker).
No end-user-facing forms were affected; audit columns are populated
automatically by the repository layer.
SECURITY IMPACT
Audit columns provide the minimum audit information required for compliance
and forensic investigation. The created_by and updated_by columns reference
the actors table, which is the authoritative source of actor identity. The audit
columns are non-nullable, ensuring that every row has a complete audit trail.
The principal residual risk is a direct database write (e.g., by a migration or a
maintenance script) that does not set app.current_user_id, leaving the audit
columns NULL. This is mitigated by the BEFORE INSERT/UPDATE trigger,
which falls back to the 'system' sentinel UUID if app.current_user_id is not set.
The fallback ensures the audit columns are always populated, even for direct
database writes. The audit_log table (ADR-086) captures the full row state at
each mutation, enabling forensic reconstruction of any change. The audit
columns and audit_log are complementary: the audit columns are the fast-
access summary, and the audit_log is the complete history.
PERFORMANCE IMPACT
Audit columns add 48 bytes per row (16 bytes for two timestamps + 32 bytes for
two UUIDs), which is a 50% increase in row storage on the average entity table.
The total storage increase across the cluster is estimated at 30%, which is
acceptable. The BEFORE UPDATE trigger adds 2-3% write overhead, based on
internal benchmarks; the overhead is dominated by the trigger's now() and
session-setting lookup, which are fast. The AFTER INSERT/UPDATE/DELETE
trigger adds 5-8% write overhead, dominated by the INSERT into audit_log;
this is the price of the full audit trail (ADR-086) and is accepted as a compliance
cost. The indexes on (tenant_id, updated_at) and (tenant_id, created_by) add
storage overhead but enable fast forensic queries, which are critical for
compliance audits. The net performance impact is acceptable: 5-8% write
overhead and 30% storage overhead for the audit and compliance benefits.
SCALABILITY ANALYSIS
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 108

PreOne ADR  -  Volume 3: Data Architecture  v3.0
Audit columns scale linearly with table size. The 48-byte overhead per row is
constant, so the storage increase is proportional to row count. The trigger
overhead is constant per write, so the write-latency increase is independent of
table size. The audit_log table (ADR-086) grows at 1-3 rows per mutation
(depending on the action), which is the principal scalability concern; it is
partitioned by month per ADR-051 to manage size. The actors table is small
(projected 1M rows at steady state) and is not a scalability concern. The
strategy is stable for the foreseeable future. The trigger for revisiting is if the
audit_log table's growth exceeds the cluster's storage budget, which is
monitored monthly; the mitigation is to increase the audit_log retention
enforcement (ADR-053) frequency or to move older audit_log rows to cold
storage (ADR-054) earlier.
OPERATIONAL CONSIDERATIONS
The SRE team owns the trigger infrastructure: the BEFORE INSERT/UPDATE
trigger template, the AFTER INSERT/UPDATE/DELETE trigger template, and
the audit_log table (ADR-086). Application teams own the entity table schemas
and the actors table. The CI pipeline verifies that every entity table has the four
audit columns, the two triggers, and the two indexes; a missing element blocks
the migration. The app.current_user_id session setting is set by the API
gateway after authentication; the integration test verifies that the setting is
reset between transactions. The 'system' sentinel UUID is documented in the
engineering handbook and is used by all direct database writes (migrations,
maintenance scripts). The audit_log table is queried weekly by the security
team for forensic review; the audit columns are queried on-demand for
compliance audits.
RISKS
| Risk               | Likelihood | Impact | Mitigation           |
| ------------------ | ---------- | ------ | -------------------- |
| A direct database  | Low        | Medium | BEFORE               |
| write (migration,  |            |        | INSERT/UPDATE        |
| maintenance        |            |        | trigger falls back   |
| script) does not   |            |        | to 'system'          |
| set                |            |        | sentinel UUID if     |
| app.current_user_i |            |        | app.current_user_i   |
| d, leaving audit   |            |        | d is not set; audit  |
| columns NULL.      |            |        | columns are          |
always populated.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  109

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| PgBouncer          | Medium     | High   | SET LOCAL (not      |
| transaction        |            |        | SET) is used        |
| pooling fails to   |            |        | within each         |
| preserve           |            |        | transaction;        |
| app.current_user_i |            |        | integration test    |
| d across a         |            |        | verifies that       |
| transaction,       |            |        | app.current_user_i  |
| causing audit      |            |        | d is reset between  |
| columns to be      |            |        | transactions.       |
populated with the
wrong actor.
| The AFTER            | Low    | High   | Trigger failure is   |
| -------------------- | ------ | ------ | -------------------- |
| INSERT/UPDATE/       |        |        | monitored; alert     |
| DELETE trigger       |        |        | fires if audit_log   |
| fails, breaking the  |        |        | insert rate drops    |
| audit_log feed and   |        |        | to zero. Trigger is  |
| losing change        |        |        | tested in CI on      |
| history.             |        |        | every migration.     |
| The audit_log        | Medium | Medium | audit_log is         |
| table grows          |        |        | partitioned by       |
| beyond the           |        |        | month per            |
| cluster's storage    |        |        | ADR-051;             |
| budget, impacting    |        |        | retention            |
| overall              |        |        | enforcement          |
| performance.         |        |        | (ADR-053) moves      |
older rows to cold
storage
(ADR-054).
Storage growth is
monitored
monthly.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Always-populated audit information for  48-byte storage overhead per row (30%
compliance and forensic investigation. increase across cluster).
Database-level enforcement via  5-8% write overhead from triggers,
DEFAULT and triggers; not reliant on  dominated by audit_log INSERT.
application discipline.
Integrates with LWW reconciliation via  Trigger complexity; debugging trigger
updated_at column (ADR-045). issues requires Postgres expertise.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  110

PreOne ADR - Volume 3: Data Architecture v3.0
We Gain We Lose
Feeds the full audit_log (ADR-086) for Audit columns are read-only via the API;
complete change history. clients cannot override them, which
may surprise some users.
REJECTED ALTERNATIVES
Full audit-log table (event-sourcing) was rejected on storage cost (doubling)
and query complexity (every read must verify against audit log). Application-
level-only audit was rejected because it relies on application discipline, which is
unreliable. The hybrid (audit columns plus separate history table) was rejected
because it duplicates the audit_log pattern. A separate per-table audit trail
(each table has its own audit log) was considered but rejected because it
complicates cross-table forensic queries; the unified audit_log (ADR-086) is
simpler. A timestamp-only audit (created_at and updated_at, without actor) was
considered but rejected because actor attribution is required for compliance.
The full reasoning for each rejection is captured in the Options Considered
table.
MIGRATION PLAN
Migration from the legacy mixed audit conventions to the standard audit-
column pattern proceeds table-by-table over two quarters. Each migration
follows the standard pattern: (1) add the four audit columns (created_at,
updated_at, created_by, updated_by) as nullable initially; (2) backfill existing
rows: created_at and updated_at from the legacy created_at column (or from
the row's earliest known timestamp), created_by and updated_by from the
legacy actor column (or from the 'system' sentinel if unknown); (3) add the
BEFORE INSERT/UPDATE trigger and the AFTER INSERT/UPDATE/DELETE
trigger; (4) alter the columns to non-nullable; (5) add the indexes on (tenant_id,
updated_at) and (tenant_id, created_by). Rollback per table is to drop the
triggers, the indexes, and the audit columns; the audit_log table is not affected
(it retains the historical entries). Existing rows are backfilled with the best
available audit information; rows with unknown audit information are
backfilled with the 'system' sentinel and a created_at of the migration
timestamp, which is documented in the migration log.
TESTING STRATEGY
Audit columns are tested at three levels. (1) Unit: every entity table's BEFORE
INSERT/UPDATE trigger is verified to populate the audit columns correctly,
including the fallback to 'system' sentinel when app.current_user_id is not set.
(2) Integration: the CI pipeline verifies that the API gateway sets
app.current_user_id after authentication, that the setting is preserved within a
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 111

PreOne ADR - Volume 3: Data Architecture v3.0
transaction, and that the setting is reset between transactions. (3) End-to-end:
a quarterly compliance drill simulates a forensic investigation (e.g., 'who
changed this student's grade?') and verifies that the audit columns and
audit_log provide the correct answer within the documented time. The trigger
failure detection is tested by deliberately disabling a trigger in staging and
verifying that the alert fires.
MONITORING & OBSERVABILITY
Audit column health is monitored through four metrics. (1) Audit column
completeness: percentage of entity table rows with non-NULL audit columns;
target 100%, current 100%. (2) Trigger success rate: percentage of
INSERT/UPDATE/DELETE operations that successfully fire the BEFORE and
AFTER triggers; alert fires if the rate drops below 100%. (3) audit_log insert
rate: count of INSERTs into audit_log per hour; alert fires if the rate drops to
zero (potential trigger failure) or spikes (potential incident). (4)
app.current_user_id setting rate: percentage of application queries that set
app.current_user_id; alert fires if the rate drops below 99% (potential gateway
regression). The audit_log table is queried weekly by the security team for
forensic review; the audit columns are queried on-demand for compliance
audits.
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
move to PostgreSQL 17's SQL:2011 temporal table support, which would
provide system-versioned tables natively; this would replace the audit_log table
(ADR-086) with a more standardised mechanism, but the audit columns would
remain. A second possible evolution is the introduction of column-level audit
(tracking which specific columns changed, not just the row), which would
require a more detailed audit_log schema; this is currently under evaluation in
ADR-086. A third possible evolution is the addition of a source_ip column to
capture the IP address of the actor, which would require the API gateway to set
an app.source_ip session setting; this is a minor extension and is documented
as a future enhancement. No current PreOne use case requires these
evolutions.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-042 - UUID Strategy (created_by and updated_by are UUID v7)
● ADR-043 - Tenant Isolation (audit columns are tenant-scoped)
● ADR-045 - Branch Isolation (updated_at is the LWW conflict-resolution
key)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 112

PreOne ADR - Volume 3: Data Architecture v3.0
● ADR-047 - Soft Delete (deleted_at and deleted_by are extension audit
columns)
● ADR-049 - Optimistic Concurrency (version column complements audit
columns)
● ADR-053 - Data Retention (audit_log retention enforced via partition
drop)
● ADR-086 - Audit Trail (audit_log fed by audit-column triggers)
REFERENCES
● PostgreSQL Documentation - Triggers and Session Settings. The
PostgreSQL Global Development Group. 2024.
● Fowler, M. - Patterns of Enterprise Application Architecture, Audit Log
pattern. Addison-Wesley. 2002.
● FERPA - Family Educational Rights and Privacy Act, Audit
Requirements. U.S. Department of Education. 2024.
● PreOne Engineering Handbook, Section 7.8 - Audit Columns. Internal.
2025.
● PreOne Security Policy, Section 6 - Audit Trail. Internal. 2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-16 Draft Data Platform Initial draft;
Lead options
enumerated;
consultation with
engineering team
2025-09-24 Proposed Data Platform Submitted to
Lead Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
2026-07-15 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1 ADRs
added; 34-section
template applied
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 113

PreOne ADR - Volume 3: Data Architecture v3.0
APPROVAL & SIGN-OFF
Architect Office of the Chief Architect
Tech Lead Data Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● created_at, created_by, updated_at, updated_by, version columns added
(Done)
● Postgres BEFORE UPDATE triggers deployed (Done)
● Repository layer auto-populates audit columns (Done)
● Detail-page 'Metadata' panel implemented in admin UI (Done)
● Quarterly audit-column completeness check (Scheduled)
AD R -049
Optimistic Concurrency
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt optimistic concurrency control via a version integer column on every
entity table that supports concurrent updates. The version column is
incremented by the BEFORE UPDATE trigger (ADR-048) on every
successful UPDATE, and the UPDATE statement includes a WHERE version
= ? predicate that fails if the version has changed since the read. Failed
updates return SQLSTATE 40001 (serialization_failure) and are retried by
the application with exponential backoff. Pessimistic locking (SELECT ...
FOR UPDATE) is reserved for workflows that require explicit locking
semantics (e.g., bulk operations).
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 114

PreOne ADR - Volume 3: Data Architecture v3.0
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne is a multi-user SaaS where the same entity (e.g., a student's gradebook
entry) may be edited concurrently by multiple users (e.g., a teacher and an
administrator). Without concurrency control, the last write wins silently,
potentially overwriting the first writer's changes. The legacy platform used last-
write-wins without explicit versioning, and at least three incidents in the past
year involved silent data loss where a teacher's grade update was overwritten
by an administrator's concurrent update. Two concurrency control models are
relevant. (1) Optimistic: assume conflicts are rare, detect them at write time via
a version column, and retry on conflict. (2) Pessimistic: assume conflicts are
common, acquire a lock at read time via SELECT ... FOR UPDATE, and block
other writers until the lock is released. PreOne's workload is dominated by
short transactions on per-student-per-assignment records, where conflicts are
rare (the same gradebook entry is rarely edited by two users within seconds).
Optimistic concurrency is the better fit. The version-column pattern is the
standard optimistic concurrency mechanism. Every entity table has a version
integer column, initialised to 1 at insert and incremented by the BEFORE
UPDATE trigger on every successful UPDATE. The UPDATE statement includes
a WHERE version = ? predicate; if the version has changed since the read, the
predicate fails to match, the UPDATE affects zero rows, and the application
detects the conflict (no row updated) and retries. The retry re-reads the row
(getting the new version), merges the user's changes with the new state (or
surfaces the conflict to the user), and re-attempts the UPDATE. The principal
alternative considered was pessimistic locking (SELECT ... FOR UPDATE) for
all concurrent-edit workflows. This was rejected because pessimistic locking
blocks other writers for the duration of the transaction, which in a web
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 115

PreOne ADR - Volume 3: Data Architecture v3.0
application can be seconds (the duration of the user's editing session). Blocking
writers for seconds degrades throughput under load and risks connection pool
exhaustion. Pessimistic locking is appropriate for short, server-side
transactions (e.g., a bulk operation that reads and updates many rows in a
single transaction), not for interactive user editing.
BUSINESS DRIVERS
PreOne's institutional customers require that concurrent edits to the same
entity not silently lose data. A teacher who updates a student's grade must not
have their update silently overwritten by a concurrent administrator update.
The optimistic concurrency pattern detects the conflict at write time and
surfaces it to the user (or retries automatically), preventing silent data loss. A
secondary driver is throughput. Pessimistic locking blocks writers for the
duration of the transaction, which degrades throughput under load. Optimistic
concurrency does not block; it detects conflicts at write time and retries, which
scales better to high-concurrency workloads. PreOne's peak concurrency is 200
concurrent writers per tenant, which would saturate a pessimistic-locking
approach. A tertiary driver is the branch reconciliation protocol (ADR-045).
The branch client's offline writes use last-write-wins (LWW) on updated_at, not
optimistic concurrency, because the branch client cannot retry conflicts
interactively (the branch user has moved on). Optimistic concurrency is used
for online edits, where the user can be prompted to retry. The two patterns
coexist: online edits use optimistic concurrency, offline edits use LWW. The
version column is incremented by both patterns (the BEFORE UPDATE trigger
fires for both), so the version is a reliable indicator of how many times the row
has been updated, regardless of the conflict-resolution mechanism.
PROBLEM STATEMENT
PreOne requires a concurrency control pattern that prevents silent data loss on
concurrent edits, scales to 200 concurrent writers per tenant without blocking,
integrates with the branch reconciliation protocol (ADR-045), and surfaces
conflicts to the user (or retries automatically) rather than silently overwriting.
CONSTRAINTS
● Every entity table that supports concurrent updates must have a
version integer column, non-nullable, default 1.
● The BEFORE UPDATE trigger (ADR-048) increments version on every
successful UPDATE.
● UPDATE statements include WHERE version = ?; failure (zero rows
affected) is treated as a conflict.
● Conflicts return SQLSTATE 40001 (serialization_failure) to the
application, which retries with exponential backoff.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 116

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● Maximum retry count is 3; after 3 retries, the conflict is surfaced to the
user.
● Pessimistic locking (SELECT ... FOR UPDATE) is reserved for short
server-side transactions (e.g., bulk operations).
ASSUMPTIONS
● Conflicts on concurrent edits are rare (less than 1% of UPDATEs);
optimistic concurrency is the appropriate model.
● The application can reliably detect zero-rows-affected and retry with
the correct semantics.
● The BEFORE UPDATE trigger incrementing version is correct and race-
free (Postgres triggers are atomic with the UPDATE).
● The version column's integer type (4 bytes) does not overflow within
the row's lifetime (max 2^31 updates per row).
● Exponential backoff with 3 retries resolves 99% of conflicts without
user intervention.
OPTIONS CONSIDERED
| Option             | Pros                 | Cons               | Verdict |
| ------------------ | -------------------- | ------------------ | ------- |
| Optimistic         | No blocking;         | Requires           | Adopted |
| concurrency via    | scales to high       | application retry  |         |
| version column     | concurrency;         | logic; conflicts   |         |
| with WHERE         | detects conflicts    | that exceed 3      |         |
| version = ?        | at write time;       | retries are        |         |
| predicate and      | retries              | surfaced to the    |         |
| retry on conflict  | automatically for    | user, which is a   |         |
| (the chosen        | transient conflicts. | UX cost.           |         |
strategy).
| Pessimistic      | Simple semantics;    | Blocks writers for   | Rejected |
| ---------------- | -------------------- | -------------------- | -------- |
| locking via      | no retry logic       | the duration of the  |          |
| SELECT ... FOR   | required; conflicts  | transaction;         |          |
| UPDATE for all   | are prevented, not   | degrades             |          |
| concurrent-edit  | detected.            | throughput under     |          |
| workflows.       |                      | load; risks          |          |
connection pool
exhaustion in web
applications.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  117

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option             | Pros                 | Cons                | Verdict  |
| ------------------ | -------------------- | ------------------- | -------- |
| Serializable       | Database-level       | Higher overhead     | Rejected |
| isolation level    | conflict detection;  | (predicate locks);  |          |
| (SERIALIZABLE      | no application       | retry rate is       |          |
| transactions) for  | retry logic for the  | higher than         |          |
| concurrent-edit    | version check.       | version-column      |          |
| workflows.         |                      | optimistic;         |          |
PostgreSQL
serializable can
produce false
positives that
trigger
unnecessary
retries.
| Last-write-wins on  | Simplest            | Silent data loss on  | Rejected |
| ------------------- | ------------------- | -------------------- | -------- |
| updated_at with     | implementation;     | concurrent edits;    |          |
| no conflict         | no retry logic; no  | fails the no-silent- |          |
| detection (the      | version column.     | loss requirement.    |          |
legacy pattern).
DECISION
ADOPTED
Adopt optimistic concurrency control via a version integer column on every
entity table that supports concurrent updates. The version column is non-
nullable, default 1, incremented by the BEFORE UPDATE trigger (ADR-048)
on every successful UPDATE. UPDATE statements include a WHERE
version = ? predicate; failure (zero rows affected) is treated as a conflict.
Conflicts return SQLSTATE 40001 (serialization_failure) to the application,
which retries with exponential backoff (max 3 retries). After 3 retries, the
conflict is surfaced to the user. Pessimistic locking (SELECT ... FOR
UPDATE)   is   reserved   for   short   server-side   transactions   (e.g.,   bulk
operations). Online edits use optimistic concurrency; offline edits (branch
reconciliation) use last-write-wins on updated_at (ADR-045).
DETAILED RATIONALE
Optimistic concurrency via version column was chosen because it is the only
model that satisfies all five PreOne hard requirements simultaneously: no silent
data loss, scales to high concurrency without blocking, integrates with branch
reconciliation, surfaces conflicts to the user, and is simple to implement and
reason about.  Pessimistic locking was rejected primarily on throughput. In a
web application, the duration of a 'transaction' is the duration of the user's
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  118

PreOne ADR - Volume 3: Data Architecture v3.0
editing session, which can be seconds to minutes. Holding a row lock for that
duration blocks other writers, degrading throughput under load. At PreOne's
peak concurrency of 200 writers per tenant, pessimistic locking would saturate
the connection pool and produce unacceptable latency. Pessimistic locking is
appropriate for short, server-side transactions (e.g., a bulk operation that reads
and updates many rows in a single transaction), and we use it for those cases,
but not for interactive user editing. Serializable isolation (SERIALIZABLE
transactions) was a serious contender because it provides database-level
conflict detection without application-level version checks. It was rejected on
overhead. PostgreSQL's SERIALIZABLE implementation uses predicate locks,
which have higher overhead than row-level version checks. The retry rate is
also higher because SERIALIZABLE can produce false positives (conflicts
detected where none actually occurred), triggering unnecessary retries. The
version-column approach has lower overhead and a lower retry rate for our
workload, where conflicts are genuinely rare. Last-write-wins (the legacy
pattern) was rejected because it fails the no-silent-loss requirement. The legacy
platform had at least three incidents in the past year where silent data loss
occurred because LWW overwrote a concurrent update without surfacing the
conflict. The optimistic concurrency pattern detects the conflict at write time
and either retries automatically (for transient conflicts) or surfaces it to the
user (for persistent conflicts), preventing silent data loss. The version-column
pattern is implemented as follows. Every entity table has a version integer
column, non-nullable, default 1. The BEFORE UPDATE trigger (which already
sets updated_at and updated_by per ADR-048) also increments version:
NEW.version = OLD.version + 1. The UPDATE statement includes WHERE id =
? AND version = ?; if the version has changed since the read, the predicate fails
to match, the UPDATE affects zero rows, and the application detects the
conflict (no row updated). The application retries by re-reading the row (getting
the new version and the new state), merging the user's changes with the new
state (or surfacing the conflict to the user), and re-attempting the UPDATE with
the new version. The retry semantics are critical. Transient conflicts (where
two writers happened to update at the same time) are resolved by retry: the
second writer re-reads, merges, and re-attempts. The merge strategy depends
on the entity: for some entities (e.g., a student's profile), the second writer can
simply re-apply their changes to the new state. For other entities (e.g., a
gradebook entry), the second writer must surface the conflict to the user, who
decides how to merge. The application chooses the merge strategy based on the
entity type; the database simply detects the conflict and returns SQLSTATE
40001. The integration with branch reconciliation (ADR-045) is
straightforward. The branch client's offline writes use LWW on updated_at, not
optimistic concurrency, because the branch client cannot retry conflicts
interactively. The version column is incremented by both patterns (the BEFORE
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 119

PreOne ADR - Volume 3: Data Architecture v3.0
UPDATE trigger fires for both), so the version is a reliable indicator of how
many times the row has been updated. When a branch client reconciles, the
upsert includes the version from the branch client's local state; the cloud's
BEFORE UPDATE trigger increments it. If the cloud row has been updated
since the branch client's last sync (i.e., the version has diverged), the LWW
conflict resolution on updated_at determines the winner, and the version is set
to max(cloud_version, branch_version) + 1. This ensures the version remains
monotonically increasing across both patterns. The SQLSTATE 40001
(serialization_failure) return code is the standard PostgreSQL convention for
conflict-detection failures. The application's retry logic catches 40001 and
retries with exponential backoff (50ms, 200ms, 800ms). After 3 retries, the
conflict is surfaced to the user with a 409 Conflict response. The retry logic is
implemented in the application's data access layer, not in the business logic, so
business logic code is unaware of the retries. The data access layer logs each
retry for observability.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | OPTIMISTIC
CONCURRENCY PATTERN | +-------------------------------------------------------------
+ | | | Table: gradebook_entries
| | +-----------------------------------------------------+ | | | id (UUID v7) PK
| | | | tenant_id, school_id, academic_year | | | | student_id,
assignment_id, score | | | | version INTEGER NOT NULL DEFAULT
1 | | | | created_at, updated_at, created_by, updated_by | | | |
deleted_at, deleted_by (nullable) | | |
+-----------------------------------------------------+ | |
| | BEFORE UPDATE trigger: | | NEW.version =
OLD.version + 1 | | NEW.updated_at = now()
| | NEW.updated_by = app.current_user_id | |
| | Concurrent update flow: | |
| | Teacher (T) reads: SELECT * WHERE id=X -> version=5 | | Admin (A)
reads: SELECT * WHERE id=X -> version=5 | |
| | T updates: UPDATE ... SET score=90 WHERE id=X AND ver=5 | | ->
trigger fires, version becomes 6, 1 row updated | |
| | A updates: UPDATE ... SET score=85 WHERE id=X AND ver=5 | | -> 0
rows updated (version is now 6, not 5) | | -> SQLSTATE 40001
(serialization_failure) | | | | A
retries: | | 1. Re-read: SELECT * WHERE id=X
-> version=6, score=90 | | 2. Merge (surface to user or auto-merge) |
| 3. Re-attempt: UPDATE ... WHERE id=X AND ver=6 | | 4. -> trigger
fires, version becomes 7, 1 row updated |
+-------------------------------------------------------------+
SEQUENCE DIAGRAM
Teacher -> API: GET /gradebook/{id} (version=5) API -> PgBouncer: SELECT
PgBouncer -> RDS Primary: route RDS Primary -> API: row (version=5) API ->
Teacher: 200 OK (version=5) Admin -> API: GET /gradebook/{id} (version=5)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 120

PreOne ADR - Volume 3: Data Architecture v3.0
API -> RDS Primary: SELECT RDS Primary -> API: row (version=5) API ->
Admin: 200 OK (version=5) Teacher -> API: PATCH /gradebook/{id} {score: 90,
version: 5} API -> PgBouncer: BEGIN API -> PgBouncer: UPDATE ... SET
score=90 WHERE id=X AND version=5 PgBouncer -> RDS Primary: UPDATE
RDS Primary -> BEFORE UPDATE trigger: version=6, updated_at=now() RDS
Primary -> PgBouncer: 1 row updated PgBouncer -> API: ok API -> Teacher: 200
OK (version=6) Admin -> API: PATCH /gradebook/{id} {score: 85, version: 5}
API -> PgBouncer: BEGIN API -> PgBouncer: UPDATE ... SET score=85 WHERE
id=X AND version=5 PgBouncer -> RDS Primary: UPDATE RDS Primary ->
PgBouncer: 0 rows updated (version is 6, not 5) PgBouncer -> API: SQLSTATE
40001 (conflict) API -> Retry Logic: catch 40001, retry (backoff 50ms) Retry
Logic -> API: re-read (version=6, score=90) Retry Logic -> API: merge (surface
to user: "score is now 90, you tried 85") API -> Admin: 409 Conflict (current
state: score=90, your change: 85) Admin -> API: user resolves (e.g., accept 90 or
override to 85) API -> RDS Primary: UPDATE ... WHERE id=X AND version=6
RDS Primary -> API: ok (version=7) API -> Admin: 200 OK (version=7)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-049 — Optimistic
Concurrency - Component View | +-------------------------------------------------------------
+ | | | +----------------+ +----------------------+
| | | Application | read | Repository | | | | Service |------->|
returns version=N | | | +----------------+ +----------+-----------+ | | |
| | | | modify | | | v
| | | +----------------+ | | | | In-memory |
| | | | aggregate | | | | +----------------+
| | | | | | | | save |
| | v v | | +----------------+ +----------------------+
| | | Repository | update | UPDATE ... WHERE | | | | |------->|
version = N | | | +----------------+ +----------+-----------+ | |
| | | | 0 rows? -> retry | |
v | | +--------+----------+ | | |
Concurrency | | | | Exception | | |
+-------------------+ | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
Read-Modify-Write Flow: App -> Repository.findById(id) -> entity (version=N)
App -> modify entity in memory App -> Repository.save(entity) Repository ->
UPDATE ... WHERE id = ? AND version = N Postgres -> 1 row affected?
commit : throw ConcurrencyException Retry Flow: Catch
ConcurrencyException -> re-read entity (version=N+1) Re-apply modification
-> re-save (version=N+1) Max 3 retries -> surface to user as conflict
DATABASE IMPACT
Every entity table that supports concurrent updates has a version integer
column, non-nullable, default 1. The BEFORE UPDATE trigger (ADR-048)
increments version on every successful UPDATE: NEW.version = OLD.version
+ 1. UPDATE statements include WHERE id = ? AND version = ?; if the version
has changed since the read, the predicate fails to match, the UPDATE affects
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 121

PreOne ADR - Volume 3: Data Architecture v3.0
zero rows, and the application detects the conflict. The version column is
indexed implicitly by the primary key (it is not a separate index) because the
WHERE clause includes the primary key. The version column's integer type (4
bytes) supports up to 2^31 updates per row, which is sufficient for any PreOne
entity (the highest-update entity, gradebook_entries, has at most 100 updates
per row over its lifetime). The SQLSTATE 40001 return code is produced by the
application's data access layer (which checks the row count and raises the
error), not by Postgres directly; this is because Postgres does not raise 40001
for a zero-rows-affected UPDATE, only for SERIALIZABLE conflicts. The data
access layer's behaviour is documented in the engineering handbook.
API IMPACT
API endpoints that update entities accept a version field in the request body
(e.g., PATCH /gradebook/{id} {score: 90, version: 5}). The version field is the
version the client read; the server includes it in the UPDATE's WHERE clause.
If the version has changed, the server returns 409 Conflict with the current
state (including the new version) in the response body, allowing the client to
retry. The API contract documents that clients must include the version field on
updates; requests without it are rejected with 400. Bulk update endpoints (e.g.,
POST /gradebook/bulk) accept an array of {id, version, changes} objects and
return per-item results (200 for success, 409 for conflict). The retry logic is
implemented in the application's data access layer, not in the API layer; the API
layer simply returns 409 to the client, which can retry. The client SDK includes
automatic retry with exponential backoff for 409 responses, up to 3 retries;
after 3 retries, the conflict is surfaced to the user.
UI IMPACT
Optimistic concurrency surfaces in the UI as a 'conflict' notification when two
users edit the same entity concurrently. When a save fails with a
ConcurrencyException, the UI displays a modal: 'This record was modified by
another user. Reload to see their changes, or overwrite with your version.' The
'Reload' button re-fetches the entity (preserving the user's pending edits in a
side panel for reference); the 'Overwrite' button forces a save with the user's
version (admin-only, audited). The conflict modal was added to all edit forms in
the admin UI. For end-user forms (e.g., a parent updating contact info), the
conflict results in a generic 'Please try again' message with auto-retry.
SECURITY IMPACT
Optimistic concurrency does not introduce new security properties beyond the
standard tenant and school isolation (ADR-043, ADR-044). The version column
is not a security control; it is a correctness control. The principal residual risk is
a malicious client that intentionally sends an old version to force a conflict,
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 122

PreOne ADR - Volume 3: Data Architecture v3.0
causing a denial-of-service by triggering retries. This is mitigated by rate-
limiting on update endpoints (per-client, per-IP) and by the maximum retry
count of 3 (after which the conflict is surfaced and the client must re-read). The
version column is not exposed in API responses by default (only on the GET
/<entity>/{id} response, where it is needed for the next update); this prevents
information leakage about how many times an entity has been updated. The
audit_log (ADR-086) captures every UPDATE, including the version transition,
enabling forensic analysis of conflict patterns.
PERFORMANCE IMPACT
Optimistic concurrency adds negligible overhead to the UPDATE path: the
version column is included in the WHERE clause (one additional integer
comparison, sub-microsecond) and is incremented by the BEFORE UPDATE
trigger (one additional integer operation, sub-microsecond). The total per-
UPDATE overhead is less than 1%, which is negligible. The retry overhead is
bounded by the retry rate: at PreOne's conflict rate of less than 1% of
UPDATEs, the retry overhead is less than 1% of UPDATE throughput. The 3-
retry cap bounds the worst-case latency for a single UPDATE at approximately
1 second (50ms + 200ms + 800ms backoff), which is acceptable. The version
column's 4-byte storage overhead is negligible (less than 5% of row size on the
average entity table). The net performance impact is negligible, and the benefit
(no silent data loss) is significant.
SCALABILITY ANALYSIS
Optimistic concurrency scales linearly with concurrency. Unlike pessimistic
locking, which blocks writers and degrades throughput under load, optimistic
concurrency does not block; it detects conflicts at write time and retries. The
retry rate is independent of concurrency (it depends on the conflict rate, which
is a property of the workload, not the concurrency level). At PreOne's peak
concurrency of 200 writers per tenant, the conflict rate is approximately 0.5%
of UPDATEs, which is well within the 1% assumption. The retry overhead is
approximately 0.5% of UPDATE throughput, which is negligible. The strategy is
stable for the foreseeable future. The trigger for revisiting is if the conflict rate
exceeds 5% of UPDATEs, which would indicate either a workload change (more
concurrent edits) or a schema design problem (entities that should be split are
being edited concurrently). The mitigation is to investigate the root cause and
potentially switch to pessimistic locking for the high-conflict entities.
OPERATIONAL CONSIDERATIONS
The SRE team owns the BEFORE UPDATE trigger template (which includes the
version increment) and the data access layer's retry logic. Application teams
own the entity table schemas (including the version column) and the merge
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 123

PreOne ADR  -  Volume 3: Data Architecture  v3.0
strategies for conflict resolution. The CI pipeline verifies that every concurrent-
update entity table has a version column and that the BEFORE UPDATE trigger
increments it; a missing element blocks the migration. The retry logic is
monitored: alert fires if the retry rate exceeds 2% of UPDATEs (potential
workload change) or if the 3-retry-cap-exceeded rate exceeds 0.1% of UPDATEs
(potential user-visible conflict increase). The 409 Conflict response rate is
monitored per endpoint; alert fires if the rate exceeds 1% of requests (potential
UX problem).
RISKS
| Risk                 | Likelihood | Impact | Mitigation         |
| -------------------- | ---------- | ------ | ------------------ |
| A malicious client   | Low        | Medium | Rate-limiting on   |
| intentionally        |            |        | update endpoints   |
| sends old versions   |            |        | (per-client, per-  |
| to force conflicts,  |            |        | IP); maximum       |
| causing denial-of-   |            |        | retry count of 3;  |
| service via retries. |            |        | conflict surfaced  |
to user after 3
retries.
| The conflict rate  | Low | Medium | Monitor retry        |
| ------------------ | --- | ------ | -------------------- |
| exceeds the 1%     |     |        | rate; alert if rate  |
| assumption,        |     |        | exceeds 2%.          |
| degrading          |     |        | Investigate root     |
| throughput via     |     |        | cause; potentially   |
| excessive retries. |     |        | switch to            |
pessimistic
locking for high-
conflict entities.
| The application's   | Medium | Medium | Retry logic is     |
| ------------------- | ------ | ------ | ------------------ |
| retry logic         |        |        | implemented in     |
| incorrectly         |        |        | the data access    |
| handles 40001,      |        |        | layer, not in      |
| causing infinite    |        |        | business logic;    |
| loops or incorrect  |        |        | tested in CI with  |
| merges.             |        |        | simulated          |
conflicts.
Maximum retry
count of 3
prevents infinite
loops.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  124

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation         |
| ------------------- | ---------- | ------ | ------------------ |
| The version         | Low        | Low    | Integer type       |
| column overflows    |            |        | supports 2^31      |
| after 2^31          |            |        | updates; highest-  |
| updates on a        |            |        | update entity has  |
| single row,         |            |        | at most 100        |
| causing incorrect   |            |        | updates per row.   |
| conflict detection. |            |        | Overflow is not a  |
practical concern.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
No silent data loss on concurrent edits;  Requires application retry logic;
conflicts are detected and surfaced. conflicts that exceed 3 retries are
surfaced to the user.
Scales to high concurrency without  The 3-retry cap bounds worst-case
blocking; no throughput degradation  latency at approximately 1 second per
| under load. |     | UPDATE. |     |
| ----------- | --- | ------- | --- |
Integrates with branch reconciliation  Two conflict-resolution mechanisms
(LWW on updated_at) via shared  (optimistic for online, LWW for offline)
| version column. |     | coexist; complexity. |     |
| --------------- | --- | -------------------- | --- |
Negligible per-UPDATE overhead (less  The version column is exposed in API
than 1%) and negligible storage  responses, which may surprise some
| overhead (4 bytes). |     | clients (information about update  |     |
| ------------------- | --- | ---------------------------------- | --- |
frequency).
REJECTED ALTERNATIVES
Pessimistic locking (SELECT ... FOR UPDATE) was rejected on throughput
(blocks writers for the duration of the user's editing session, degrading
throughput under load). Serializable isolation (SERIALIZABLE transactions)
was rejected on overhead (predicate locks) and false-positive retry rate. Last-
write-wins without conflict detection was rejected because it fails the no-silent-
loss requirement (the legacy pattern, with at least three incidents in the past
year). A timestamp-based optimistic concurrency (using updated_at instead of a
separate version column) was considered but rejected because updated_at is
also the LWW conflict-resolution key for branch reconciliation (ADR-045),
conflating two concerns in one column. A separate version column cleanly
separates the two concerns. The full reasoning for each rejection is captured in
the Options Considered table.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  125

PreOne ADR - Volume 3: Data Architecture v3.0
MIGRATION PLAN
Migration from the legacy last-write-wins pattern to optimistic concurrency
proceeds table-by-table over one quarter. Each migration follows the standard
pattern: (1) add the version integer column with a default of 1, nullable initially;
(2) backfill existing rows with version = 1; (3) alter the column to non-nullable;
(4) update the BEFORE UPDATE trigger to increment version; (5) update the
application's UPDATE statements to include WHERE version = ?; (6) update the
data access layer to detect zero-rows-affected and retry with exponential
backoff; (7) update the API endpoints to accept and return the version field.
Rollback per table is to drop the version column and revert the trigger and
application changes; existing rows are not affected. The migration is low-risk
because the version column is additive; the legacy pattern (no version check)
continues to work during the transition, and the optimistic concurrency check
is enabled per-table as the migration progresses.
TESTING STRATEGY
Optimistic concurrency is tested at three levels. (1) Unit: every concurrent-
update entity table's BEFORE UPDATE trigger is verified to increment version
on every UPDATE. The WHERE version = ? predicate is verified to fail (zero
rows affected) when the version has changed. (2) Integration: the CI pipeline
simulates concurrent updates (two writers, same row, same version) and
verifies that the second writer receives 409 Conflict and that the retry logic
correctly re-reads and re-attempts. The 3-retry cap is verified to surface the
conflict to the user after 3 retries. (3) Chaos: a quarterly load test simulates 200
concurrent writers per tenant and verifies that the conflict rate is below 1% and
that the retry overhead is below 1% of UPDATE throughput. The merge
strategy is tested per entity type, verifying that the correct merge (auto-merge
or surface-to-user) is applied.
MONITORING & OBSERVABILITY
Optimistic concurrency health is monitored through four metrics. (1) Conflict
rate: percentage of UPDATEs that result in zero-rows-affected due to version
mismatch; target below 1%, current 0.5%. (2) Retry rate: percentage of
UPDATEs that are retried at least once; alert fires if rate exceeds 2%. (3) 3-
retry-cap-exceeded rate: percentage of UPDATEs that surface 409 to the user
after 3 retries; alert fires if rate exceeds 0.1%. (4) 409 Conflict response rate
per endpoint; alert fires if rate exceeds 1% of requests. The retry logic's logs
are exported to the application telemetry pipeline and reviewed weekly for
patterns (e.g., specific entities or users with abnormally high conflict rates).
The audit_log (ADR-086) captures every UPDATE, including the version
transition, enabling forensic analysis of conflict patterns.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 126

PreOne ADR - Volume 3: Data Architecture v3.0
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
switch to pessimistic locking for specific high-conflict entities, if the conflict
rate on those entities exceeds 5% of UPDATEs. The switch is per-entity, not
global, and is documented in the entity's schema. A second possible evolution is
the move to PostgreSQL's SERIALIZABLE isolation level for specific workflows
that require stronger guarantees (e.g., financial transactions), but no current
PreOne workflow requires this. A third possible evolution is the introduction of
a conflict-resolution UI that helps users merge conflicting changes (currently,
the user must re-read and re-attempt manually); this is a UX enhancement, not
a concurrency-control change. No current PreOne use case requires these
evolutions.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-042 - UUID Strategy (version column is integer, not UUID)
● ADR-043 - Tenant Isolation (optimistic concurrency applies within a
tenant)
● ADR-045 - Branch Isolation (LWW on updated_at coexists with
optimistic concurrency)
● ADR-048 - Audit Columns (BEFORE UPDATE trigger increments both
updated_at and version)
● ADR-050 - Indexing Strategy (version is indexed implicitly by primary
key)
● ADR-086 - Audit Trail (audit_log captures version transitions)
● ADR-150 - Performance Testing (concurrency load tests)
REFERENCES
● PostgreSQL Documentation - Transaction Isolation and Explicit
Locking. The PostgreSQL Global Development Group. 2024.
● Bernstein, P. and Newcomer, E. - Principles of Transaction Processing.
Morgan Kaufmann. 2009.
● Fowler, M. - Patterns of Enterprise Application Architecture, Optimistic
Offline Lock pattern. Addison-Wesley. 2002.
● PreOne Engineering Handbook, Section 7.9 - Optimistic Concurrency.
Internal. 2025.
● PreOne Data Access Layer Documentation - Retry Logic. Internal. 2025.
DECISION HISTORY
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 127

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Office of the Chief Architect |     |
| ----------- | --- | ----------------------------- | --- |
| Tech Lead   |     | Data Platform Lead            |     |
| ARB Chair   |     | Architecture Review Board     |     |
| Approved On |     | 2025-10-15                    |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● version column added to all mutable entities (Done)
● Repository UPDATE ... WHERE version = N pattern enforced (Done)
● ConcurrencyException + retry middleware deployed (Done)
● Conflict modal implemented in admin edit forms (Done)
● Integration tests for concurrent modification (Done — 38 tests)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  128

PreOne ADR - Volume 3: Data Architecture v3.0
AD R -050
Indexing Strategy
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a layered indexing strategy using PostgreSQL's four index types: B-
tree for equality and range queries (default), GIN for JSONB and full-text
search, GiST for geospatial and exclusion constraints, and BRIN for large
append-only tables (audit_log, event_log). Indexes are added based on
query-pattern analysis from pg_stat_statements and the slow-query log;
partial indexes (WHERE deleted_at IS NULL per ADR-047) are preferred
over full indexes for active-row queries. Index bloat is monitored via
pgstattuple and reclaimed via pg_repack during maintenance windows.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Semi-annual review, or on data-
volume growth exceeding 2x
baseline
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne's data layer serves a mix of workloads: OLTP (point lookups by primary
key, range scans by academic year), search (full-text and vector similarity),
geospatial (school locator), and append-only logging (audit_log, event_log).
Each workload has a different optimal index type, and choosing the wrong type
produces either poor performance (wrong index type) or excessive storage
overhead (too many indexes). The legacy platform had a mix of well-chosen and
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 129

PreOne ADR - Volume 3: Data Architecture v3.0
poorly-chosen indexes: some tables had 15 indexes (most unused), others had
none (causing sequential scans on 100M-row tables). PostgreSQL 16 supports
four index types relevant to PreOne. (1) B-tree: the default, optimal for equality
(=) and range (<, >, BETWEEN) queries on scalar columns. B-tree indexes are
O(log n) for lookups and O(n) for range scans. (2) GIN (Generalized Inverted
Index): optimal for queries on composite values like JSONB documents, arrays,
and full-text search vectors. GIN indexes map each element to a list of row
TIDs, enabling fast lookup of any element. (3) GiST (Generalized Search Tree):
optimal for geospatial data (PostGIS) and exclusion constraints (e.g., 'no two
enrollments for the same student in the same class at overlapping times'). (4)
BRIN (Block Range Index): optimal for large append-only tables where the
physical row order correlates with a sorted column (e.g., audit_log sorted by
timestamp). BRIN indexes store only the min/max of each block range,
producing tiny indexes (kilobytes instead of gigabytes). The strategy is to use
the right index type for each query pattern, to add indexes based on query-
pattern analysis (not guesswork), and to monitor and reclaim index bloat. The
pg_stat_statements extension tracks query execution statistics; the slow-query
log captures queries exceeding a latency threshold. Together, they identify the
queries that need indexes. The pgstattuple extension reports index bloat;
pg_repack reclaims bloat without locking the table (using triggers to capture
changes during the rebuild).
BUSINESS DRIVERS
PreOne's institutional customers require predictable query performance: a
daily attendance lookup that takes 12ms today must not degrade to 1200ms
next quarter as the table grows. Indexing is the primary lever for predictable
performance; without it, queries degrade as tables grow. The legacy platform
had at least two incidents where query latency degraded 10x over a quarter due
to missing indexes on growing tables. A secondary driver is storage cost. Each
index consumes storage proportional to the table size; a table with 10 indexes
consumes 10x the storage of the table itself. Indiscriminate indexing (the
legacy approach) wastes storage; targeted indexing (the proposed strategy)
minimises waste. At PreOne's projected scale (1 TB of table data), the index
overhead is estimated at 1.5 TB with targeted indexing versus 5 TB with
indiscriminate indexing, a 3.3x reduction. A tertiary driver is write
performance. Each index adds overhead to every INSERT, UPDATE, and
DELETE (the index must be updated). Indiscriminate indexing (10 indexes per
table) doubles write latency; targeted indexing (3-4 indexes per table) adds
approximately 30% write latency, which is acceptable. The trade-off is read
performance (more indexes = faster reads) versus write performance (more
indexes = slower writes); PreOne's workload is read-heavy (10:1 read:write
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 130

PreOne ADR - Volume 3: Data Architecture v3.0
ratio), so the trade-off favours reads, but not at the cost of write latency
doubling.
PROBLEM STATEMENT
PreOne requires an indexing strategy that selects the correct index type (B-
tree, GIN, GiST, BRIN) for each query pattern, adds indexes based on query-
pattern analysis rather than guesswork, monitors index bloat and reclaims it,
and balances read performance against write performance and storage cost.
CONSTRAINTS
● B-tree is the default index type for equality and range queries on scalar
columns.
● GIN is used for JSONB containment queries, array membership, and
full-text search vectors.
● GiST is used for PostGIS geospatial queries and exclusion constraints.
● BRIN is used for large append-only tables (audit_log, event_log) where
physical row order correlates with a sorted column.
● Partial indexes (WHERE deleted_at IS NULL per ADR-047) are
preferred over full indexes for active-row queries.
● Index additions require query-pattern evidence from
pg_stat_statements or the slow-query log; no guesswork.
ASSUMPTIONS
● pg_stat_statements and the slow-query log provide sufficient evidence
to identify queries that need indexes.
● pgstattuple accurately reports index bloat; pg_repack reclaims bloat
without table-level locking.
● The 3-4 indexes per table target balances read and write performance
for PreOne's 10:1 read:write ratio.
● BRIN's block-range min/max is sufficient for the audit_log and
event_log access patterns (range scans by timestamp).
● Per-table autovacuum scaling factors can be tuned to keep up with the
deletion rate on high-churn tables.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 131

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option             | Pros                | Cons              | Verdict |
| ------------------ | ------------------- | ----------------- | ------- |
| Layered indexing   | Right index type    | Requires query-   | Adopted |
| strategy: B-tree   | per query pattern;  | pattern analysis  |         |
| for scalars, GIN   | minimal storage;    | discipline;       |         |
| for JSONB/FTS,     | balanced            | pgstattuple and   |         |
| GiST for           | read/write          | pg_repack add     |         |
| geospatial/exclusi | performance;        | operational       |         |
| on, BRIN for       | bloat monitored     | complexity.       |         |
| append-only;       | and reclaimed.      |                   |         |
partial indexes for
active rows (the
chosen strategy).
| B-tree only: use B- | Simplest            | Cannot index      | Rejected |
| ------------------- | ------------------- | ----------------- | -------- |
| tree for all        | operational model;  | JSONB             |          |
| indexes,            | one index type to   | containment or    |          |
| regardless of       | understand.         | full-text search  |          |
| query pattern.      |                     | efficiently;      |          |
geospatial queries
are sequential
scans; BRIN-
applicable tables
waste storage on
B-tree.
| Indiscriminate    | Maximum read        | Storage overhead  | Rejected |
| ----------------- | ------------------- | ----------------- | -------- |
| indexing: add an  | performance; no     | (5x table size);  |          |
| index for every   | query is slow due   | write latency     |          |
| column that       | to a missing index. | doubles; many     |          |
| appears in a      |                     | indexes are       |          |
| WHERE clause.     |                     | unused;           |          |
maintenance cost
is high.
| No indexes; rely     | Zero storage     | Query latency is     | Rejected |
| -------------------- | ---------------- | -------------------- | -------- |
| on sequential        | overhead; zero   | O(n) on table size;  |          |
| scans and            | write overhead;  | unacceptable for     |          |
| Postgres's parallel  | simplest model.  | 100M-row tables;     |          |
| query.               |                  | fails the            |          |
predictable-
performance
requirement.
DECISION
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  132

PreOne ADR - Volume 3: Data Architecture v3.0
ADOPTED
Adopt a layered indexing strategy using PostgreSQL's four index types: B-
tree for equality and range queries (default), GIN for JSONB containment
and full-text search, GiST for geospatial (PostGIS) and exclusion
constraints, and BRIN for large append-only tables (audit_log, event_log).
Indexes are added based on query-pattern evidence from
pg_stat_statements and the slow-query log; no guesswork. Partial indexes
(WHERE deleted_at IS NULL per ADR-047) are preferred over full indexes
for active-row queries. The target is 3-4 indexes per table, balancing read
and write performance for PreOne's 10:1 read:write ratio. Index bloat is
monitored via pgstattuple and reclaimed via pg_repack during maintenance
windows. Per-table autovacuum scaling factors are tuned for high-churn
tables.
DETAILED RATIONALE
The layered indexing strategy was chosen because it is the only model that
satisfies all five PreOne hard requirements simultaneously: correct index type
per query pattern, evidence-based index addition, bloat monitoring and
reclamation, balanced read/write performance, and minimal storage overhead.
The B-tree-only alternative was rejected because it cannot index JSONB
containment queries efficiently. PreOne uses JSONB for flexible schemas
(ADR-052); a JSONB containment query (WHERE metadata @> '{"category":
"science"}') on a 10M-row table without a GIN index is a sequential scan, taking
seconds. With a GIN index, the same query takes milliseconds. Similarly, full-
text search (ADR-059) requires GIN indexes on tsvector columns; B-tree cannot
index tsvector. Geospatial queries (school locator) require GiST indexes on
PostGIS geometry columns; B-tree cannot index geometry. BRIN-applicable
tables (audit_log, event_log) would waste storage on B-tree: a B-tree index on a
1B-row audit_log table is approximately 60 GB, while a BRIN index on the same
table is approximately 5 MB, a 12000x reduction. The indiscriminate-indexing
alternative was rejected on storage cost and write performance. The legacy
platform had tables with 15 indexes, most of which were unused (verified by
pg_stat_user_indexes). The storage overhead was 5x table size, and write
latency was double what it would have been with targeted indexing. The
discipline of evidence-based index addition (requiring pg_stat_statements or
slow-query-log evidence) eliminates unused indexes and keeps the index count
at 3-4 per table. The no-indexes alternative was rejected because query latency
is O(n) on table size, which is unacceptable for PreOne's 100M-row tables. A
sequential scan on a 100M-row attendance table takes approximately 30
seconds, while a B-tree index lookup takes 12ms, a 2500x difference. Parallel
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 133

PreOne ADR - Volume 3: Data Architecture v3.0
query (max_parallel_workers_per_gather=4) reduces the sequential scan to
approximately 8 seconds, which is still 600x slower than the indexed lookup.
The partial-index preference for active-row queries is a key optimisation.
PreOne's queries on entity tables filter on deleted_at IS NULL by default (per
ADR-047); a partial index (WHERE deleted_at IS NULL) is smaller than a full
index (it contains only active rows, which are approximately 75% of total rows
per ADR-047's analysis). The partial index is 25% smaller than the full index,
improving cache hit ratio and reducing storage. The partial index also enables
the planner to use it for any query that includes the deleted_at IS NULL
predicate, which is the default for application queries. The BRIN choice for
append-only tables is driven by the access pattern. audit_log and event_log are
queried by timestamp range (e.g., 'all audit entries between 2024-01-01 and
2024-02-01'). The physical row order correlates with the timestamp (rows are
appended in timestamp order), so BRIN's block-range min/max is effective: the
planner can skip entire block ranges whose max timestamp is before the query
range. A BRIN index on a 1B-row audit_log table is approximately 5 MB, versus
a B-tree index of approximately 60 GB. The BRIN index is slightly less precise
than B-tree (it identifies candidate block ranges, not specific rows), but the
post-filter cost is low because the block range is small (128 pages = 1 MB). The
pgstattuple and pg_repack operational model is critical for long-term index
health. PostgreSQL's MVCC design produces dead tuples on every UPDATE
and DELETE; autovacuum reclaims dead tuples, but index bloat can
accumulate if autovacuum cannot keep up. pgstattuple reports the actual bloat
(free space within index pages), and pg_repack reclaims it by rebuilding the
index without table-level locking (it uses triggers to capture changes during the
rebuild, then applies them atomically). pg_repack runs during maintenance
windows (Sunday 02:00-04:00 tenant-local-time) on tables whose bloat exceeds
30%. The per-table autovacuum scaling factors are tuned for high-churn
tables. The default autovacuum_vacuum_scale_factor is 0.2 (vacuum when 20%
of rows are dead), which is too high for high-churn tables like audit_log (where
20% of 1B rows is 200M dead tuples, an excessive accumulation). For audit_log,
the scale factor is set to 0.05 (vacuum when 5% of rows are dead), and the cost
delay is reduced (autovacuum_vacuum_cost_delay = 2ms) to allow autovacuum
to keep up with the churn rate. The tuning is documented per table in the
operational runbook.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | INDEXING STRATEGY
LAYERS | +-------------------------------------------------------------+ |
| | Query Pattern -> Index Type | |
---------------------------------------------------- | | Point lookup (id=X) -> B-tree (PK)
| | Range scan (date BETWEEN) -> B-tree | | JSONB containment
(@>) -> GIN | | Full-text search (tsvector)-> GIN
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 134

PreOne ADR - Volume 3: Data Architecture v3.0
| | Geospatial (ST_DWithin) -> GiST (PostGIS) | | Exclusion constraint
-> GiST | | Append-only range (audit) -> BRIN | |
| | Active-row queries -> Partial index | | WHERE deleted_at IS
NULL | | | | Per-table
target: 3-4 indexes | | +---------------------------------------------------+
| | | enrollments table indexes: | | | | PRIMARY KEY (tenant_id,
school_id, ay, id) Btree | | | | INDEX (tenant_id, student_id) WHERE del_at IS
NULL| | | | INDEX (tenant_id, status, ay) WHERE del_at IS NULL| | | | (3
indexes total) | | | +---------------------------------------------------+
| | | | +---------------------------------------------------+
| | | audit_log table indexes: | | | | PRIMARY KEY (tenant_id,
id) Btree | | | | BRIN (created_at) -- 5MB for 1B rows | | |
| INDEX (tenant_id, actor_id) -- actor attribution | | | | (3 indexes total)
| | | +---------------------------------------------------+ | |
| | Operational: | | - pg_stat_statements: identifies
slow queries | | - pgstattuple: reports index bloat | | -
pg_repack: reclaims bloat during maintenance windows | | - autovacuum
tuning per high-churn table |
+-------------------------------------------------------------+
SEQUENCE DIAGRAM
Slow Query -> pg_stat_statements: captured (mean=2.5s, calls=500/hr)
pg_stat_statements -> SRE Dashboard: top-100 slow queries SRE -> Query
Analysis: EXPLAIN ANALYZE on slow query Query Analysis -> SRE: sequential
scan on enrollments (status, ay) SRE -> Migration: CREATE INDEX
CONCURRENTLY ... ON enrollments (tenant_id, status,
academic_year) WHERE deleted_at IS NULL Migration -> RDS
Primary: CREATE INDEX CONCURRENTLY (no lock) RDS Primary ->
pg_stat_statements: index now used (mean=12ms) pg_stat_statements -> SRE
Dashboard: latency drop confirmed (Quarterly bloat check:) pgstattuple -> SRE:
enrollments_status_idx bloat = 35% SRE -> pg_repack: --table=enrollments --
index=enrollments_status_idx pg_repack -> RDS Primary: BEGIN; create
shadow; trigger; sync; swap RDS Primary -> pg_repack: index rebuilt (bloat =
5%) pg_repack -> SRE: 200 OK (repack complete)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-050 — Indexing Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Query Logger | sample |
Index Advisor Job | | | | (per SQL) |------->| (weekly) | | |
+----------------+ +----------+-----------+ | | |
| | | analyses | | v
| | +----------------+ +----------------------+ | | | pg_stat_user_ | feed | Index
Recommender | | | | indexes |------->| (suggest + drop) | | |
+----------------+ +----------+-----------+ | | |
| | | proposes | | v
| | +----------------+ +----------------------+ | | | DBA Review | apply |
Flyway Migration | | | | (manual gate) |------->| (CREATE INDEX ...) |
| | +----------------+ +----------------------+ |
+-------------------------------------------------------------+
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 135

PreOne ADR - Volume 3: Data Architecture v3.0
DATA FLOW DIAGRAM
Index Discovery Flow: pg_stat_user_indexes (weekly) -> unused index report
pg_stat_statements (weekly) -> slow query report Index Advisor -> suggests
new indexes (CREATE INDEX CONCURRENTLY) DBA Review -> approve /
reject -> Flyway migration Index Creation Flow: Flyway migration -> CREATE
INDEX CONCURRENTLY (no lock) Postgres -> builds index in background
Verify -> EXPLAIN ANALYZE shows index usage
DATABASE IMPACT
Every table has a primary key index (B-tree on the composite (tenant_id,
school_id, academic_year, id) for tenant-scoped tables). Additional indexes are
added based on query-pattern evidence: the SRE team reviews
pg_stat_statements and the slow-query log weekly and proposes index
additions via a migration. Index additions use CREATE INDEX
CONCURRENTLY to avoid table-level locking. Partial indexes (WHERE
deleted_at IS NULL) are used for active-row queries per ADR-047. GIN indexes
are used on JSONB columns (ADR-052) and on tsvector columns (ADR-059).
GiST indexes are used on PostGIS geometry columns and on exclusion
constraints (e.g., no overlapping enrollment times for the same student). BRIN
indexes are used on the audit_log and event_log tables (range scans by
timestamp). Per-table autovacuum scaling factors are tuned for high-churn
tables (audit_log: scale_factor=0.05, cost_delay=2ms). Indexes are dropped
when pg_stat_user_indexes reports zero scans over a 90-day window; the drop
requires SRE review to confirm the index is genuinely unused.
API IMPACT
API endpoints do not directly interact with indexes; the database chooses the
index based on the query. However, API design affects index effectiveness.
Endpoints that filter on multiple columns (e.g., GET /enrollments?
student_id=X&status=active&academic_year=2024-2025) benefit from
composite indexes that cover the filter columns; the API contract documents
the recommended filter combinations for each endpoint. Endpoints that sort
(e.g., GET /enrollments?sort=created_at:desc) benefit from indexes that cover
the sort column; the API contract documents the recommended sort columns.
Endpoints that paginate via keyset pagination (WHERE id > ? ORDER BY id
LIMIT ?) benefit from the primary key index; the API contract requires keyset
pagination for all list endpoints. The API gateway includes a header (X-Query-
Plan) in staging responses that exposes the EXPLAIN output for the query,
enabling developers to verify index usage during development.
UI IMPACT
Indexing strategy has no direct UI surface — it is a database performance
concern. Indirectly, users benefit from faster page loads: the indexing strategy
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 136

PreOne ADR - Volume 3: Data Architecture v3.0
targets p95 query latency under 100ms, which translates to sub-second page
render times on list views. The admin UI gained a 'Slow Queries' dashboard
(admin-only) that surfaces queries exceeding 1 second from
pg_stat_statements, with a link to the relevant page in the app for context. No
end-user UI changes were required; the indexing strategy is invisible to users
except through improved performance.
SECURITY IMPACT
Indexing does not introduce new security properties beyond the standard
tenant and school isolation (ADR-043, ADR-044). Indexes are subject to the
same RLS policies as their underlying tables; an index lookup returns only rows
that satisfy the RLS policy. The principal residual risk is information leakage via
index-based timing attacks: an attacker who can measure query latency can
infer whether a particular value exists in an indexed column (a point lookup on
an existing value is faster than on a non-existing value). This is mitigated by the
API gateway's rate-limiting (which prevents high-frequency timing
measurements) and by the fact that most PreOne queries are tenant-scoped
(the attacker must already have tenant access to perform the timing attack).
The pg_stat_statements extension exposes query text, which can leak PII in
indexes on PII columns; this is mitigated by redacting parameters before they
reach pg_stat_statements (per ADR-041).
PERFORMANCE IMPACT
The layered indexing strategy delivers the expected performance: point
lookups on primary keys are 12ms p99, range scans on indexed columns are
85ms p99, JSONB containment queries with GIN are 18ms p99, full-text search
with GIN is 25ms p99, geospatial queries with GiST are 30ms p99, and
audit_log range scans with BRIN are 200ms p99. The 3-4 indexes per table
target adds approximately 30% write overhead, which is acceptable for
PreOne's 10:1 read:write ratio. The partial-index preference reduces index size
by 25% versus full indexes, improving cache hit ratio. The BRIN choice for
append-only tables reduces index size by 12000x versus B-tree, with negligible
query-latency increase. The pg_repack bloat reclamation runs quarterly and
prevents bloat from exceeding 30%, maintaining consistent query latency over
time.
SCALABILITY ANALYSIS
The indexing strategy scales to PreOne's projected 1 TB of table data and 1.5
TB of index data. B-tree indexes scale to 100M rows per index without issue;
beyond that, partitioning (ADR-051) keeps per-partition index sizes
manageable. GIN indexes scale to 10M rows per index; beyond that, the
jsonb_path_len constraint and the GIN fast-update mechanism manage the size.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 137

PreOne ADR  -  Volume 3: Data Architecture  v3.0
GiST indexes scale to 1M rows per index for PostGIS workloads; beyond that,
spatial partitioning is required. BRIN indexes scale to 1B rows per index
without issue; they are the most scalable index type for append-only tables. The
pg_repack bloat reclamation scales to the largest tables (1B rows on audit_log);
the repack runs in approximately 4 hours for a 1B-row table, within the
maintenance window. The strategy is stable for the foreseeable future.
OPERATIONAL CONSIDERATIONS
The SRE team owns the index-addition process (reviewing pg_stat_statements
and the slow-query log, proposing migrations), the bloat-monitoring process
(running pgstattuple quarterly, scheduling pg_repack), and the autovacuum
tuning (per-table scale factors and cost delays). Application teams own the
query patterns that drive index needs; they are encouraged to consult the SRE
team during API design to ensure index-friendly query patterns. The CI pipeline
runs EXPLAIN on representative queries in the integration suite and alerts on
sequential scans that should be indexed. The pg_repack maintenance window is
Sunday 02:00-04:00 tenant-local-time; the repack is scheduled per table to
avoid concurrent repacks on the same cluster. The autovacuum tuning is
documented per table in the operational runbook and reviewed quarterly.
RISKS
| Risk                | Likelihood | Impact | Mitigation           |
| ------------------- | ---------- | ------ | -------------------- |
| An index addition   | Medium     | Low    | CREATE INDEX         |
| (CREATE INDEX       |            |        | CONCURRENTLY         |
| CONCURRENTLY)       |            |        | is monitored;        |
| fails partway,      |            |        | failure triggers an  |
| leaving an invalid  |            |        | alert. The invalid   |
| index that must be  |            |        | index is dropped     |
| dropped and         |            |        | via DROP INDEX       |
| recreated.          |            |        | CONCURRENTLY         |
and the creation is
retried in the next
maintenance
window.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  138

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation           |
| ------------------- | ---------- | ------ | -------------------- |
| pg_repack fails     | Low        | Medium | pg_repack uses       |
| during the          |            |        | triggers to          |
| rebuild, leaving    |            |        | capture changes      |
| the table in a      |            |        | during the rebuild   |
| partially-repacked  |            |        | and applies them     |
| state.              |            |        | atomically; failure  |
rolls back to the
pre-repack state.
The repack is
retried in the next
maintenance
window.
| Autovacuum falls   | Medium | Medium | Per-table            |
| ------------------ | ------ | ------ | -------------------- |
| behind on a high-  |        |        | autovacuum           |
| churn table,       |        |        | tuning               |
| causing index      |        |        | (scale_factor=0.05   |
| bloat to           |        |        | for audit_log);      |
| accumulate faster  |        |        | alert fires if dead- |
| than pg_repack     |        |        | tuple count          |
| can reclaim it.    |        |        | exceeds 10% of       |
table size. Manual
VACUUM is the
fallback.
| An index is          | Low | Medium | Index drops         |
| -------------------- | --- | ------ | ------------------- |
| dropped based on     |     |        | require SRE         |
| pg_stat_user_inde    |     |        | review and a 7-     |
| xes showing zero     |     |        | day warning to      |
| scans, but the       |     |        | application teams;  |
| index was used by    |     |        | teams can request   |
| a rare query that    |     |        | an index be         |
| did not fire during  |     |        | retained if it      |
| the 90-day           |     |        | supports a rare-    |
| window.              |     |        | but-critical query. |
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Correct index type per query pattern;  Requires query-pattern analysis
optimal performance for OLTP, search,  discipline; SRE team must review
geospatial, and append-only workloads. pg_stat_statements weekly.
Evidence-based index addition  Adding an index requires a migration
| eliminates unused indexes; storage  |     | and a CREATE INDEX  |     |
| ----------------------------------- | --- | ------------------- | --- |
overhead is 1.5x table size, not 5x. CONCURRENTLY run, which takes
time.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  139

PreOne ADR - Volume 3: Data Architecture v3.0
We Gain We Lose
Partial indexes reduce index size by Partial indexes are slightly more
25% for active-row queries. complex to reason about; the planner
must match the partial predicate.
BRIN indexes reduce append-only index BRIN is slightly less precise than B-
size by 12000x versus B-tree. tree; post-filter cost is low but non-zero.
REJECTED ALTERNATIVES
B-tree-only was rejected because it cannot index JSONB, full-text search,
geospatial, or append-only workloads efficiently. Indiscriminate indexing was
rejected on storage cost (5x table size) and write performance (doubled write
latency). No indexes was rejected because query latency is O(n), unacceptable
for 100M-row tables. A fully-automated index advisor (e.g., HypoPG or a third-
party tool) was considered but rejected because the SRE team's query-pattern
analysis produces better results for PreOne's specific workload; the automated
tools are used as input, not as the sole decision-maker. The full reasoning for
each rejection is captured in the Options Considered table.
MIGRATION PLAN
Migration from the legacy mixed indexing to the layered strategy proceeds
table-by-table over two quarters. Each migration follows the standard pattern:
(1) audit existing indexes via pg_stat_user_indexes, identifying unused indexes
(zero scans over 90 days); (2) drop unused indexes via DROP INDEX
CONCURRENTLY; (3) identify missing indexes via pg_stat_statements and the
slow-query log; (4) add missing indexes via CREATE INDEX CONCURRENTLY,
using the correct index type (B-tree, GIN, GiST, BRIN) and partial predicates
where applicable; (5) tune per-table autovacuum scaling factors for high-churn
tables; (6) schedule quarterly pgstattuple checks and pg_repack runs for tables
with bloat > 30%. Rollback per table is to drop the added indexes and restore
the dropped indexes; the autovacuum tuning is reverted to defaults. The
migration is low-risk because index additions and drops are concurrent (no
table-level locking).
TESTING STRATEGY
The indexing strategy is tested at three levels. (1) Unit: every migration that
adds or drops an index is verified to use the correct index type and partial
predicate. The CI pipeline runs EXPLAIN on representative queries and verifies
that the expected index is used. (2) Integration: the slow-query log is monitored
in staging; queries exceeding 1 second trigger an alert, and the SRE team
proposes an index addition. (3) Performance: the query-latency benchmark
runs in CI on every schema change; regression beyond 5% on p99 latency
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 140

PreOne ADR - Volume 3: Data Architecture v3.0
blocks the change. The pg_repack bloat reclamation is tested in staging by
deliberately bloating an index (via UPDATEs) and verifying that pg_repack
reduces bloat to below 10%.
MONITORING & OBSERVABILITY
Indexing health is monitored through five metrics. (1) Index usage: per-index
scan count from pg_stat_user_indexes, exported daily; alert fires if a previously-
used index shows zero scans for 90 days (candidate for drop). (2) Index bloat:
per-index bloat percentage from pgstattuple, exported quarterly; alert fires if
bloat exceeds 30% (candidate for pg_repack). (3) Slow queries: count of queries
exceeding 1 second from pg_stat_statements; alert fires if rate exceeds 10 per
hour. (4) Sequential scans: count of sequential scans on tables larger than 1M
rows; alert fires if rate exceeds 100 per hour (potential missing index). (5)
Autovacuum lag: per-table dead-tuple count; alert fires if dead tuples exceed
10% of table size. The EXPLAIN output for representative queries is captured in
the query-plan dashboard and reviewed weekly by the SRE team.
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
introduction of covering indexes (INCLUDE clause) for queries that fetch a
small set of columns, enabling index-only scans. A second possible evolution is
the move to PostgreSQL 17's incremental sorting for queries that sort on a
prefix of an indexed column, which would reduce sort cost. A third possible
evolution is the introduction of vector indexes (HNSW via pgvector) for the AI
assistant workload (ADR-148), which is currently served by a separate HNSW
index per tenant. No current PreOne use case requires these evolutions beyond
what is already documented in ADR-052 (JSONB), ADR-059 (Search), and
ADR-148 (AI Assistant).
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision;
pg_stat_statements, pgstattuple)
● ADR-043 - Tenant Isolation (indexes are subject to RLS policies)
● ADR-047 - Soft Delete (partial indexes WHERE deleted_at IS NULL)
● ADR-048 - Audit Columns (indexes on updated_at and created_by for
forensic queries)
● ADR-051 - Partition Strategy (per-partition indexes)
● ADR-052 - JSONB Usage (GIN indexes on JSONB columns)
● ADR-059 - Search Strategy (GIN indexes on tsvector columns)
● ADR-148 - AI Assistant Architecture (HNSW vector indexes via
pgvector)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 141

PreOne ADR  -  Volume 3: Data Architecture  v3.0
REFERENCES
● PostgreSQL Documentation - Indexes Types (B-tree, GIN, GiST, BRIN).
The PostgreSQL Global Development Group. 2024.
● PostgreSQL Documentation - pg_stat_statements, pgstattuple. The
PostgreSQL Global Development Group. 2024.
● pg_repack Documentation - Reorg Project. 2024.
● PostGIS Documentation - GiST Indexes. PostGIS project. 2024.
● PreOne Engineering Handbook, Section 7.10 - Indexing Strategy.
Internal. 2025.
DECISION HISTORY
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Office of the Chief Architect |     |
| ----------- | --- | ----------------------------- | --- |
| Tech Lead   |     | Data Platform Lead            |     |
| ARB Chair   |     | Architecture Review Board     |     |
| Approved On |     | 2025-10-15                    |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  142

PreOne ADR - Volume 3: Data Architecture v3.0
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Baseline indexes on all foreign keys and equality-filtered columns
(Done)
● Composite indexes for hot query paths (Done)
● Partial indexes for soft-delete and status filters (Done)
● Weekly index-health report (pg_stat_user_indexes) scheduled (Done)
● Quarterly index review with DBA (Next: 2026-Q4)
● Slow-query dashboard deployed to admin UI (Done)
AD R -051
Partition Strategy
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a comprehensive partition strategy that applies PostgreSQL native
partitioning (range, list, hash) to high-volume and high-churn tables based
on their access patterns. Academic-year-partitioned tables use range
partitioning per ADR-046. Audit and event log tables use monthly range
partitioning to manage size and retention. Reference-data tables with
categorical scoping use list partitioning. Tenant-sharding (future) will use
hash partitioning. pg_partman automates partition creation and dropping;
partition pruning is verified via EXPLAIN in CI.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 143

PreOne ADR - Volume 3: Data Architecture v3.0
Review Cadence Semi-annual review, or on data-
volume growth exceeding 2x
baseline
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
ADR-046 established academic-year partitioning for the highest-volume
temporal tables (attendance, gradebook, enrollment, audit_log). This ADR
extends the partition strategy to cover the remaining high-volume and high-
churn tables that did not fit the academic-year model, and codifies the overall
partition policy framework that ADR-046 is a part of. The strategy covers three
additional partitioning use cases: (1) monthly range partitioning for audit_log
and event_log, which grow faster than academic-year granularity; (2) list
partitioning for reference-data tables with categorical scoping (e.g., region-
scoped reference data); (3) hash partitioning for future tenant-sharding.
Audit_log grows at approximately 100M rows per tenant per academic year (1-3
audit entries per mutation, 30M mutations per year). At 500 tenants, that is 50
billion rows per academic year, which is too large for a single academic-year
partition per tenant. Monthly range partitioning brings the leaf partition size
down to approximately 4M rows per (tenant, month), which is manageable. The
audit_log is also queried primarily by recent time range (the past 30 days), so
monthly partitioning aligns with the query pattern: a query for 'audit entries in
the past 30 days' prunes to 1-2 monthly partitions. Event_log (application-level
events: login, logout, feature-flag evaluation, etc.) grows at approximately 1B
rows per tenant per year, even faster than audit_log. Monthly partitioning
brings the leaf partition size to approximately 80M rows per (tenant, month),
which is at the upper end of the recommended range. Weekly partitioning was
considered for event_log but rejected because the maintenance overhead (52
partitions per year per tenant) exceeds the benefit; monthly is sufficient.
Reference-data tables with categorical scoping (e.g., a curriculum_standards
table scoped by region: US, EU, India) use list partitioning. The partition key is
the region column; queries scoped to a specific region prune to a single
partition. This is a niche use case (only 3 reference-data tables fit this pattern),
but the partitioning simplifies region-specific compliance (e.g., dropping the
EU partition for a tenant that exits the EU market). Hash partitioning for
tenant-sharding is documented as a future evolution in ADR-041 and ADR-046;
this ADR codifies the hash-partitioning approach so that the future migration is
well-defined. The hash partition key is tenant_id modulo N (where N is the
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 144

PreOne ADR - Volume 3: Data Architecture v3.0
number of shards); each shard is a separate Postgres cluster. Within a shard,
the existing range and list partitioning continues to apply.
BUSINESS DRIVERS
PreOne's institutional customers generate high-volume audit and event data
that must be retained for compliance (audit_log) and operational analytics
(event_log). Without partitioning, these tables would reach billions of rows
within a year, degrading query performance and complicating retention
enforcement. Monthly partitioning aligns the physical storage layout with the
query pattern (recent data is queried most) and enables O(1) retention
enforcement via partition drop. A secondary driver is the audit_log table's
growth rate. At 50 billion rows per academic year across 500 tenants, the
audit_log is the single largest table in the cluster. Monthly partitioning brings
the per-partition size down to manageable levels and enables per-month
backup and restore, which is critical for the 4-hour RTO per ADR-056. A
tertiary driver is region-specific compliance. Reference-data tables scoped by
region (US, EU, India) must support region-specific retention and deletion (e.g.,
dropping the EU partition for a tenant that exits the EU market under GDPR
right-to-erasure). List partitioning by region makes this a single DDL statement
(DROP TABLE region_eu), versus a DELETE that would be O(n) and would bloat
the table.
PROBLEM STATEMENT
PreOne requires a comprehensive partition strategy that extends beyond
academic-year partitioning (ADR-046) to cover audit_log and event_log
(monthly range), region-scoped reference data (list), and future tenant-
sharding (hash), with automated maintenance via pg_partman and verified
partition pruning via EXPLAIN in CI.
CONSTRAINTS
● Audit_log and event_log are monthly range-partitioned by created_at,
with tenant_id subpartitioning.
● Region-scoped reference-data tables are list-partitioned by region.
● Tenant-sharding (future) uses hash partitioning by tenant_id modulo N.
● pg_partman automates partition creation (1 month ahead) and
dropping (per retention policy).
● Partition pruning is verified via EXPLAIN in CI for representative
queries.
● Leaf partition size target is 1-100M rows; partitions exceeding 100M
rows are flagged for subpartitioning review.
ASSUMPTIONS
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 145

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● Monthly partitioning aligns with audit_log and event_log query patterns
(recent data queried most).
● pg_partman's monthly maintenance job can keep up with the partition
creation and dropping rate.
● List partitioning by region is stable across the lifetime of the reference-
data tables (regions do not change frequently).
● Hash partitioning for tenant-sharding will not be needed before 2028
(the trigger is 5000 tenants or 5 TB per cluster).
● PostgreSQL 16's partition pruning is correct for all partition types
(range, list, hash).
OPTIONS CONSIDERED
| Option                | Pros                 | Cons                | Verdict |
| --------------------- | -------------------- | ------------------- | ------- |
| Comprehensive         | Right partition      | Multiple partition  | Adopted |
| partition strategy:   | type per access      | types increase      |         |
| range for             | pattern; O(1)        | operational         |         |
| academic-year         | retention via drop;  | complexity;         |         |
| (ADR-046) and         | per-partition        | pg_partman          |         |
| monthly               | backup/restore;      | dependency;         |         |
| (audit_log,           | aligns storage       | partition count     |         |
| event_log), list for  | with queries.        | must stay below     |         |
| region-scoped         |                      | 5000-10000          |         |
| reference data,       |                      | ceiling.            |         |
hash for future
tenant-sharding
(the chosen
strategy).
| Extend academic-   | Single partition   | Audit_log and      | Rejected |
| ------------------ | ------------------ | ------------------ | -------- |
| year partitioning  | type; simpler      | event_log leaf     |          |
| to all tables (no  | operational model. | partitions exceed  |          |
| monthly            |                    | 100M rows at       |          |
| partitioning).     |                    | scale; retention   |          |
enforcement is
per-academic-
year, not per-
month (less
granular); does
not align with the
recent-data query
pattern.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  146

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option              | Pros              | Cons                | Verdict  |
| ------------------- | ----------------- | ------------------- | -------- |
| Single-table        | Simplest schema;  | Retention           | Rejected |
| audit_log and       | no partition      | enforcement is      |          |
| event_log with no   | maintenance.      | O(n) DELETE with    |          |
| partitioning; rely  |                   | VACUUM bloat;       |          |
| on BRIN indexes     |                   | per-month backup    |          |
| (ADR-050) and       |                   | and restore is not  |          |
| autovacuum          |                   | possible; table     |          |
| tuning.             |                   | size exceeds 50     |          |
billion rows,
degrading query
planning.
| External analytics  | Postgres stays     | Two engines to     | Rejected |
| ------------------- | ------------------ | ------------------ | -------- |
| store (e.g.,        | small; analytics   | operate; dual-     |          |
| Snowflake,          | store handles the  | write consistency  |          |
| BigQuery) for       | historical data;   | between Postgres   |          |
| audit_log and       | purpose-built      | and analytics      |          |
| event_log;          | engine for         | store; analytics   |          |
| Postgres holds      | analytics.         | store cost;        |          |
| only recent data.   |                    | complicates        |          |
compliance audits
(audit_log must be
in Postgres for
RLS).
DECISION
ADOPTED
Adopt a comprehensive partition strategy that applies PostgreSQL native
partitioning (range, list, hash) to high-volume and high-churn tables based
on their access patterns. Academic-year-partitioned tables use range
partitioning per ADR-046. Audit_log and event_log use monthly range
partitioning by created_at with tenant_id subpartitioning. Region-scoped
reference-data tables use list partitioning by region. Tenant-sharding
(future) uses hash partitioning by tenant_id modulo N. pg_partman
automates partition creation (1 month ahead) and dropping (per retention
policy). Partition pruning is verified via EXPLAIN in CI for representative
queries. Leaf partition size target is 1-100M rows; partitions exceeding
100M rows are flagged for subpartitioning review.
DETAILED RATIONALE
The comprehensive partition strategy was chosen because it applies the correct
partition type to each access pattern, in contrast to the one-size-fits-all
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  147

PreOne ADR - Volume 3: Data Architecture v3.0
alternatives that underperform for at least one pattern. The extend-academic-
year alternative was rejected because audit_log and event_log leaf partitions
would exceed 100M rows at scale. At 500 tenants and 100M audit_log rows per
tenant per academic year, a single (tenant, academic-year) partition would be
100M rows, which is at the upper end of the recommended range. For event_log
(1B rows per tenant per year), a single (tenant, academic-year) partition would
be 1B rows, far above the recommended ceiling. Monthly partitioning brings
audit_log to 8M rows per (tenant, month) and event_log to 80M rows per
(tenant, month), both within the recommended range. The single-table
alternative was rejected on retention enforcement and per-partition
backup/restore. A single-table audit_log with 50 billion rows cannot be
efficiently retained (DELETE is O(n) with VACUUM bloat) or restored per-
month (the entire 50B-row table would need to be restored, exceeding the 4-
hour RTO). Partition drop is O(1) metadata; partition restore is per-leaf-
partition, both within the RTO. The external-analytics-store alternative was
rejected on compliance and operational cost. The audit_log must be in Postgres
for RLS enforcement (ADR-043); moving it to an external store would require
replicating RLS in the external store, which is bespoke and fragile. The dual-
write consistency between Postgres and the external store would introduce the
same class of bugs that ADR-041 rejected for the polyglot persistence strategy.
The operational cost of a second engine (Snowflake or BigQuery) is also
significant; PreOne's SRE team of four cannot operate a second analytics
engine well. The monthly partitioning for audit_log aligns with the query
pattern. The most common audit_log query is 'show me audit entries for entity X
in the past 30 days', which prunes to 1-2 monthly partitions. The second most
common query is 'show me audit entries for entity X in the past 24 hours', which
prunes to 1 partition. The retention query ('drop audit entries older than 7
years') drops one partition per month per tenant, an O(1) metadata operation.
The list partitioning for region-scoped reference data is a niche use case but
important for compliance. The curriculum_standards table contains region-
specific educational standards (US Common Core, EU national frameworks,
India CBSE). A tenant in the EU must not see US standards (compliance), and a
tenant that exits the EU market must have its EU standards deleted (GDPR
right-to-erasure). List partitioning by region makes both queries and deletions
efficient: a query scoped to the EU region prunes to the EU partition, and a
deletion is a DROP TABLE region_eu, an O(1) metadata operation. The hash
partitioning for future tenant-sharding is documented but not yet implemented.
The hash partition key is tenant_id modulo N (where N is the number of
shards); each shard is a separate Postgres cluster. Within a shard, the existing
range and list partitioning continues to apply. The migration to tenant-sharding
is a topology change (move tenants to shards), not a policy change (the partition
strategy within a shard is unchanged). The trigger for tenant-sharding is
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 148

PreOne ADR - Volume 3: Data Architecture v3.0
documented in ADR-041 (5 TB per cluster or 5000 tenants). The pg_partman
automation handles all three partition types. For range partitioning (academic-
year and monthly), pg_partman creates the next partition ahead of time (1
month for monthly, 1 month before academic-year start for academic-year) and
drops old partitions per the retention policy (7 years for academic-year per
ADR-053, 7 years for audit_log per ADR-053, 1 year for event_log per ADR-053).
For list partitioning, pg_partman does not create or drop partitions (the region
set is stable); the partitions are created manually when a new region is added.
For hash partitioning (future), pg_partman will not be involved (the shard
topology is managed by the application layer). The partition pruning
verification in CI is the key correctness control. Every representative query
(current month, prior month, current academic year, prior academic year,
region-specific, cross-region) is run with EXPLAIN in CI, and the test verifies
that the planner prunes to the expected partitions. A regression (e.g., a query
that previously pruned to 1 partition now scans 12) blocks the migration. This
control caught two partition-pruning regressions in pre-production, both
caused by changes to the composite partition key.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | COMPREHENSIVE
PARTITION STRATEGY | +-------------------------------------------------------------+ |
| | Partition Type | Use Case | |
------------------|------------------------------------- | | RANGE (yearly) | attendance,
gradebook, enrollment | | | (ADR-046) | |
RANGE (monthly) | audit_log, event_log | | LIST (region) |
curriculum_standards (US, EU, India) | | HASH (tenant_id) | future tenant-
sharding (ADR-041) | | | | audit_log
partitioning: | | +-----------------------------------------------------+ | |
| Parent: audit_log (range by created_at, monthly) | | | | Subpartitioned by
tenant_id (hash, 32 buckets) | | | +-----------------------------------------------------+ | |
| audit_log_2024_01_t01 (8M rows) | | | | audit_log_2024_01_t02
(8M rows) | | | | ... (32 buckets x 12 months = 384 partitions/year)
| | | | audit_log_2024_12_t32 (8M rows) | | |
+-----------------------------------------------------+ | |
| | curriculum_standards partitioning: | |
+-----------------------------------------------------+ | | | Parent: curriculum_standards (list
by region) | | | +-----------------------------------------------------+ | | |
curriculum_standards_us (10K rows) | | | | curriculum_standards_eu
(15K rows) | | | | curriculum_standards_in (12K rows) | |
| +-----------------------------------------------------+ | |
| | pg_partman: | | - Creates next month's
partitions 1 month ahead | | - Drops partitions per ADR-053 retention
policy | | - Manages partition constraints | |
| | CI: EXPLAIN ANALYZE verifies partition pruning | | for
representative queries |
+-------------------------------------------------------------+
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 149

PreOne ADR - Volume 3: Data Architecture v3.0
SEQUENCE DIAGRAM
App -> PgBouncer: BEGIN; SET LOCAL app.tenant_id='A' App -> PgBouncer:
SELECT * FROM audit_log WHERE created_at > now() - interval '30
days' PgBouncer -> RDS Primary: route RDS Primary -> Planner: parse query
Planner -> Partition Pruner: created_at > now()-30d Partition Pruner -> Planner:
prune to audit_log_2024_11_t01, audit_log_2024_12_t01
Planner -> RDS Primary: plan (scan 2 partitions) RDS Primary -> Partition 1:
SELECT * WHERE tenant_id='A' Partition 1 -> RLS: tenant_id='A' RLS ->
Partition 1: rows for tenant A RDS Primary -> Partition 2: SELECT * WHERE
tenant_id='A' Partition 2 -> RLS: tenant_id='A' RLS -> Partition 2: rows for
tenant A RDS Primary -> PgBouncer: result (30 days of audit entries) PgBouncer
-> App: rows pg_partman (monthly job) -> Parent: CREATE TABLE
audit_log_2025_02_t01 Parent -> Catalog: new partition registered pg_partman
(retention) -> Parent: DROP TABLE audit_log_2018_01_t01 (7yr) Parent ->
Catalog: old partition removed (O(1) metadata)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-051 — Partition Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Repository | write |
Partitioned Table | | | | |------->| (range by year) | | |
+----------------+ +----------+-----------+ | | |
| | | routes by | | | partition
key | | v | | +-------------+ +-------------+
+-------------+ | | | part_2024 | | part_2025 | | part_2026 | | |
+-------------+ +-------------+ +-------------+ | |
| | pg_partman job: | | - creates future partitions 6
months ahead | | - detaches old partitions into archive schema |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Write Flow: App -> Repository.insert(row) Postgres -> routes by partition key
(academic_year) Postgres -> writes to part_YYYY sub-table Maintenance Flow:
pg_partman (weekly) -> create future partitions (6mo ahead) pg_partman
(annual) -> detach old partition -> archive schema Archive Job -> export
detached partition to S3 -> drop Query Flow: App -> SELECT ... WHERE
academic_year = 2026 Postgres -> partition pruning -> scan only part_2026
DATABASE IMPACT
Audit_log and event_log are range-partitioned by created_at monthly, with hash
subpartitioning by tenant_id (32 buckets) to keep leaf partition sizes
manageable. The composite partition key is (tenant_id, created_at, id) on the
composite primary key. The default index on each leaf partition is a B-tree on
(tenant_id, created_at, id) for point lookups; a BRIN index on created_at (per
ADR-050) provides efficient range-scan access. Region-scoped reference-data
tables are list-partitioned by region; the partition key is (region, id) on the
composite primary key. pg_partman is configured to create the next month's
audit_log and event_log partitions 1 month ahead and to drop partitions older
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 150

PreOne ADR - Volume 3: Data Architecture v3.0
than 7 years (audit_log) or 1 year (event_log) per ADR-053. The partition drop is
an O(1) metadata operation that immediately reclaims storage. Partition
pruning is verified in CI via EXPLAIN on representative queries; a regression
(more partitions scanned than expected) blocks the migration. The total
partition count per parent table is 32 (tenant buckets) x 12 (months) x 7
(retention years) = 2688 for audit_log, well within the 5000-10000 ceiling.
API IMPACT
API endpoints that query audit_log and event_log must include a time range
(created_at_start and created_at_end) as query parameters, enabling partition
pruning. Endpoints that omit the time range default to the past 30 days
(resolved server-side), which is documented in the API contract. Endpoints that
span multiple months (e.g., a year-end audit report) accept a wider time range;
the planner prunes to the relevant monthly partitions. The API does not expose
partition names; clients refer to time ranges by ISO 8601 dates. Bulk export
endpoints (e.g., export all audit entries for a tenant for a year) are scoped to a
single tenant and a single year by default; multi-year exports require explicit
time range and are rate-limited. The region-scoped reference-data endpoints
accept a region query parameter; the planner prunes to the relevant list
partition.
UI IMPACT
Partitioning is invisible to end users — the academic-year partitioning scheme
is a storage optimisation. The UI was updated to include a 'Year' selector on list
pages that span multiple academic years (e.g., attendance history, gradebook).
The default selection is the current academic year; users can switch to previous
years, which triggers a query against the corresponding partition. The year
selector is a dropdown in the filter bar, with the current year highlighted.
Behind the scenes, the partition pruning ensures these queries are fast
regardless of how many years of data exist. No data migration was visible to
users.
SECURITY IMPACT
Partitioning does not introduce new security properties beyond the standard
tenant and school isolation (ADR-043, ADR-044). RLS policies are inherited by
each leaf partition, so tenant and school isolation are enforced at the partition
level. The hash subpartitioning by tenant_id means that a single tenant's
audit_log rows are always in the same leaf partition (tenant_id mod 32), which
simplifies per-tenant backup and restore (a single partition can be restored for
a single tenant). The region-scoped list partitioning for reference data enforces
region isolation at the database layer: a query scoped to the EU region prunes
to the EU partition, and the US partition is never scanned. This is a compliance
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 151

PreOne ADR - Volume 3: Data Architecture v3.0
benefit for tenants that operate in a single region. The pg_partman
maintenance role is granted only to the SRE team and is logged; partition
creation and dropping are audited. The retention drop is permanent and is
preceded by a 7-day warning per ADR-053.
PERFORMANCE IMPACT
Monthly partitioning of audit_log and event_log reduces query latency by 80-
90% versus the single-table alternative, based on internal benchmarks. A query
for 'audit entries in the past 30 days' on a single-table audit_log with 50 billion
rows scans approximately 5 billion rows (10% selectivity); the same query on
the partitioned table scans approximately 800 million rows (2 partitions x 400M
rows per partition), a 6x reduction. The BRIN index on created_at further
reduces the scan to approximately 50 million rows (the relevant block ranges),
a 100x reduction versus the single-table scan. The per-partition backup and
restore benefit is critical for the 4-hour RTO per ADR-056: restoring a single
8M-row monthly partition takes approximately 5 minutes, versus restoring the
entire 50B-row table which would take days. The pg_partman maintenance
operations (create, drop) are O(1) metadata operations and do not impact query
performance.
SCALABILITY ANALYSIS
The comprehensive partition strategy scales to PreOne's projected 500 tenants
and 50 billion audit_log rows per academic year. The leaf partition count per
parent table is 2688 for audit_log (32 x 12 x 7), well within the 5000-10000
ceiling. The leaf partition size is 8M rows for audit_log and 80M rows for
event_log, both within the 1-100M target. The pg_partman monthly
maintenance job creates 32 partitions (one per tenant bucket) per month and
drops 32 partitions per month, completing in under 2 minutes. Beyond 500
tenants, the partition count would exceed the ceiling; the trigger for revisiting
is the same as in ADR-046 (tenant-sharding via hash partitioning across
multiple Postgres clusters). Within a shard, the comprehensive partition
strategy continues to apply, with the hash subpartitioning replaced by the
shard-level tenant isolation. The strategy is stable for the foreseeable future.
OPERATIONAL CONSIDERATIONS
The SRE team owns the pg_partman configuration for audit_log and event_log:
the monthly creation schedule, the retention policy (7 years for audit_log, 1
year for event_log per ADR-053), and the partition naming convention.
Application teams own the partitioned table schemas: the parent table
definition, the composite primary key, the per-partition indexes, and the RLS
policies. The CI pipeline runs EXPLAIN on representative queries for every
partitioned table and verifies partition pruning; a regression blocks the
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 152

PreOne ADR  -  Volume 3: Data Architecture  v3.0
migration. The pg_partman monthly job is monitored: alert fires if the job fails
or if the next month's partitions are missing less than 1 week before the month
start. The retention drop is preceded by a 7-day warning to the application
teams, who can request an extension for specific tenants (e.g., a tenant under
legal hold). The region-scoped reference-data partitions are created manually
when a new region is added; the creation is a migration reviewed by the SRE
team.
RISKS
| Risk               | Likelihood | Impact | Mitigation           |
| ------------------ | ---------- | ------ | -------------------- |
| The partition      | Medium     | Medium | Track partition      |
| count exceeds the  |            |        | count quarterly; if  |
| 5000-10000         |            |        | it exceeds 4000,     |
| ceiling at 500+    |            |        | accelerate tenant-   |
| tenants,           |            |        | sharding design      |
| degrading planner  |            |        | (ADR-041 future      |
| performance.       |            |        | evolution). Reduce   |
hash buckets from
32 to 16 to halve
the partition
count.
| A pg_partman        | Low | High | pg_partman          |
| ------------------- | --- | ---- | ------------------- |
| failure causes the  |     |      | creates partitions  |
| next month's        |     |      | 1 month ahead;      |
| audit_log           |     |      | alert fires if the  |
| partitions to be    |     |      | next month's        |
| missing, causing    |     |      | partitions are      |
| inserts to fail.    |     |      | missing less than   |
1 week before the
month start. SRE
on-call can create
the partitions
manually as a
fallback.
| A region is        | Low | Medium | Region removal is    |
| ------------------ | --- | ------ | -------------------- |
| removed from the   |     |        | a rare, deliberate   |
| curriculum_standa  |     |        | operation; the       |
| rds list           |     |        | partition is backed  |
| partitioning,      |     |        | up to S3 Glacier     |
| leaving orphaned   |     |        | (ADR-054) before     |
| rows in the        |     |        | the DROP TABLE.      |
| dropped partition. |     |        | The backup is        |
retained for 7
years per
ADR-053.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  153

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation          |
| ------------------ | ---------- | ------ | ------------------- |
| Partition pruning  | Medium     | Medium | EXPLAIN in CI on    |
| regresses for a    |            |        | representative      |
| query, scanning    |            |        | queries; alert on   |
| more partitions    |            |        | regression.         |
| than expected and  |            |        | pg_stat_statement   |
| degrading          |            |        | s tracks partition  |
| performance.       |            |        | scans per query;    |
alert on queries
that scan more
partitions than the
historical
baseline.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Right partition type per access pattern  Multiple partition types increase
(range, list, hash); optimal performance  operational complexity; SRE team must
| for all workloads. |     | understand all three. |     |
| ------------------ | --- | --------------------- | --- |
O(1) retention enforcement via partition  pg_partman dependency; partition
| drop; no VACUUM bloat. |     | maintenance is automated but must be  |     |
| ---------------------- | --- | ------------------------------------- | --- |
monitored.
Per-partition backup and restore within  Partition count grows linearly with
the 4-hour RTO (ADR-056). tenants and time; must stay below the
5000-10000 ceiling.
Region-scoped list partitioning enables  Region set must be stable; adding or
O(1) region-specific deletion for GDPR  removing a region is a manual
| compliance. |     | operation. |     |
| ----------- | --- | ---------- | --- |
REJECTED ALTERNATIVES
Extending academic-year partitioning to all tables was rejected because
audit_log and event_log leaf partitions would exceed 100M rows at scale.
Single-table with BRIN indexes was rejected on retention enforcement (O(n)
DELETE with VACUUM bloat) and per-partition backup/restore (the entire
50B-row table would need to be restored). External analytics store (Snowflake,
BigQuery) was rejected on compliance (audit_log must be in Postgres for RLS)
and operational cost (second engine to operate). Weekly partitioning for
event_log was considered but rejected because the maintenance overhead (52
partitions per year per tenant bucket) exceeds the benefit; monthly is sufficient.
The full reasoning for each rejection is captured in the Options Considered
table.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  154

PreOne ADR - Volume 3: Data Architecture v3.0
MIGRATION PLAN
Migration from the legacy single-table audit_log and event_log to the monthly
partitioned schema proceeds over one quarter. The migration follows the
standard pattern: (1) create the new partitioned parent tables with the same
schema as the legacy tables; (2) create the initial leaf partitions for the past 7
years (audit_log) or 1 year (event_log) per ADR-053 retention, plus the
upcoming month; (3) migrate existing rows from the legacy tables to the
corresponding leaf partitions via INSERT ... SELECT, batched by month to
avoid locking; (4) after migration, rename the legacy tables to <table>_legacy
and rename the new partitioned parents to <table>; (5) update application
code to use the partitioned tables; (6) drop the legacy tables after a 30-day
observation period. The region-scoped reference-data tables are migrated
similarly, with the list partitions created per region. Rollback per table is to
rename the partitioned parent to <table>_partitioned and rename the legacy
table back to <table>.
TESTING STRATEGY
The comprehensive partition strategy is tested at three levels. (1) Unit: every
partitioned table's partition key is verified to be correct; inserts with each
month's created_at value route to the correct leaf partition. The hash
subpartitioning is verified to distribute tenants evenly across the 32 buckets.
(2) Integration: the CI pipeline runs EXPLAIN ANALYZE on representative
queries (current month, prior month, current academic year, region-specific,
cross-region) and verifies that partition pruning reduces the scan to the
expected partitions. A regression (more partitions scanned than expected)
blocks the migration. (3) Performance: the audit_log query-latency benchmark
runs in CI on every schema change; regression beyond 5% on p99 latency
blocks the change. The pg_partman monthly job is tested in staging by
advancing the clock and verifying that the next month's partitions are created
and that the oldest partitions are dropped per the retention policy.
MONITORING & OBSERVABILITY
Partition strategy health is monitored through five metrics. (1) Partition count
per parent table; alert fires if the count exceeds 4000 (80% of the 5000-10000
ceiling). (2) Leaf partition size: per-leaf-partition row count, exported monthly;
alert fires if any leaf partition exceeds 100M rows (candidate for
subpartitioning review). (3) Partition pruning effectiveness: percentage of
partitioned-table queries that scan only the expected partitions, derived from
pg_stat_statements; target 95%, current 98%. (4) pg_partman job success:
alert fires if the monthly create-and-drop job fails or if the next month's
partitions are missing less than 1 week before the month start. (5) Retention
drop count: number of partitions dropped per month per ADR-053; alert fires if
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 155

PreOne ADR - Volume 3: Data Architecture v3.0
the count deviates from the expected value (32 per month for audit_log at 500
tenants). The EXPLAIN ANALYZE output for representative queries is captured
in the query-plan dashboard and reviewed weekly.
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
switch from 32 hash buckets to 16 when the partition count approaches the
5000-10000 ceiling, halving the partition count. The switch is a schema
migration that moves each tenant's rows from the 32-bucket partition to the
corresponding 16-bucket partition; it is a one-time operation. A second possible
evolution is the move to PostgreSQL 17's improved partition pruning for
prepared statements, which would benefit workloads that use prepared
statements heavily (currently, prepared statements do not benefit from
partition pruning for parameters). A third possible evolution is the introduction
of daily partitioning for a future high-volume table that grows faster than
event_log, but no current table requires this.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-043 - Tenant Isolation (RLS inherited by leaf partitions)
● ADR-046 - Academic Year Isolation (range partitioning for academic-
year tables)
● ADR-050 - Indexing Strategy (BRIN indexes on partitioned audit_log)
● ADR-053 - Data Retention (7-year audit_log retention, 1-year event_log
retention)
● ADR-054 - Archive Policy (partitions archived to S3 Glacier before
drop)
● ADR-056 - Restore Strategy (per-partition restore within 4-hour RTO)
● ADR-086 - Audit Trail (audit_log is the table served by this strategy)
REFERENCES
● PostgreSQL Documentation - Table Partitioning. The PostgreSQL
Global Development Group. 2024.
● pg_partman Documentation - Keith Fiske. 2024.
● PostgreSQL 16 Release Notes - Partition Pruning Enhancements. 2023.
● PreOne Engineering Handbook, Section 7.11 - Partition Strategy.
Internal. 2025.
● PreOne Data Retention Policy, Section 5 - Audit Log Retention.
Internal. 2025.
DECISION HISTORY
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 156

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Office of the Chief Architect |     |
| ----------- | --- | ----------------------------- | --- |
| Tech Lead   |     | Data Platform Lead            |     |
| ARB Chair   |     | Architecture Review Board     |     |
| Approved On |     | 2025-10-15                    |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Range partitioning by academic_year on high-volume tables (Done)
● pg_partman configured for 6-month-ahead partition creation (Done)
● Partition pruning verified via EXPLAIN (Done)
● Old-partition archival runbook documented (Done)
● Quarterly partition health check (Scheduled)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  157

PreOne ADR - Volume 3: Data Architecture v3.0
AD R -052
JSONB Usage
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a controlled JSONB usage strategy: JSONB columns are used for
flexible, schema-light data (configuration, metadata, custom fields,
integration payloads) where the structure varies per tenant or evolves
frequently. JSONB columns are always accompanied by a GIN index (per
ADR-050) for containment queries, are validated by a JSON Schema
constraint at write time, and are never used to model relationships (foreign
keys) or to store data that requires strong consistency (financial balances,
enrollment state). The strategy balances flexibility (JSONB) with integrity
(relational columns).
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on trigger event
(incident, major version upgrade, or
strategic shift)
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne is a multi-tenant SaaS where tenants have varying requirements for
flexible data: a school district may want to track custom student attributes (bus
route, lunch preference, parent employer), a university may want to track
custom course attributes (prerequisite chain, cross-listing), and an integration
may produce payloads with varying structure (LMS grade sync, SIS roster
sync). The legacy platform used a mix of EAV (entity-attribute-value) tables,
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 158

PreOne ADR - Volume 3: Data Architecture v3.0
JSON columns in MySQL (which lack efficient indexing), and per-tenant custom
tables, producing inconsistent flexibility and poor query performance.
PostgreSQL's JSONB type stores JSON values in a parsed binary format that
supports efficient containment queries (@>), existence queries (?), and path
extraction (->>, #>>). The GIN index type (per ADR-050) supports indexing
JSONB columns for containment and existence queries, enabling millisecond-
latency lookups on multi-million-row tables. The jsonb_path_match function
(PostgreSQL 12+) supports SQL/JSON path expressions for complex queries.
The principal alternative considered was EAV tables: a separate table with
(entity_id, attribute_name, attribute_value) rows, joined to the entity table. This
was rejected because EAV queries are expensive (a self-join per attribute), EAV
cannot enforce type constraints (all values are text), and EAV does not support
nested structures (an attribute with sub-attributes requires recursive joins).
JSONB addresses all three: containment queries are O(log n) via GIN, type
constraints are enforced by JSON Schema validation, and nested structures are
native to JSON. A second alternative was per-tenant custom tables: each tenant
gets a custom table for their custom attributes, created via a migration. This
was rejected on operational cost (500 tenants = 500 custom tables to migrate
per schema change) and on query complexity (cross-tenant queries must
UNION across custom tables, which is painful). JSONB with a tenant_id column
handles both: a single table serves all tenants, and cross-tenant queries are
standard SQL.
BUSINESS DRIVERS
PreOne's institutional customers require custom attributes for students,
courses, and enrollments: a school district tracks 'bus route' for students, a
university tracks 'cross-listed with' for courses, an LMS integration tracks
'source LMS ID' for enrollments. Without JSONB, these requirements would
require either EAV (slow, untyped) or per-tenant custom tables (operationally
expensive). JSONB with GIN indexing enables millisecond-latency queries on
custom attributes at scale. A secondary driver is integration payloads. PreOne
integrates with LMS (Canvas, Moodle), SIS (PowerSchool, Infinite Campus),
and authentication providers (Google, Microsoft). Each integration produces
payloads with varying structure (LMS grade sync, SIS roster sync, auth
provider user info). JSONB columns store these payloads natively, with JSON
Schema validation ensuring the payload matches the expected structure. The
alternative (typed columns for each payload field) would require a migration
every time an integration adds a field, which is operationally expensive. A
tertiary driver is configuration storage. PreOne's tenant configuration (feature
flags, UI preferences, notification settings) varies per tenant and evolves
frequently. JSONB columns store configuration natively, with JSON Schema
validation ensuring the configuration matches the expected structure. The
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 159

PreOne ADR - Volume 3: Data Architecture v3.0
alternative (typed columns for each configuration field) would require a
migration every time a new configuration option is added, which is
operationally expensive.
PROBLEM STATEMENT
PreOne requires a JSONB usage strategy that enables flexible, schema-light
data (custom attributes, integration payloads, configuration) with millisecond-
latency queries at scale, validates the JSON structure at write time, and never
compromises relational integrity for data that requires strong consistency.
CONSTRAINTS
● JSONB columns are used for flexible, schema-light data: configuration,
metadata, custom attributes, integration payloads.
● Every JSONB column must have a GIN index (per ADR-050) for
containment queries.
● Every JSONB column must have a JSON Schema constraint validated at
write time via a CHECK constraint.
● JSONB columns are never used to model relationships (foreign keys) or
strong-consistency data (financial balances, enrollment state).
● JSONB column names end in _json or _payload (e.g., metadata_json,
integration_payload) for clarity in the schema.
● JSONB columns are subject to the standard tenant, school, and
academic-year isolation (ADR-043, ADR-044, ADR-046).
ASSUMPTIONS
● PostgreSQL 16's JSONB implementation and GIN indexing meet
PreOne's performance requirements.
● JSON Schema validation via CHECK constraints is correct and does not
significantly impact write performance.
● The GIN index's fast-update mechanism is sufficient for the write rate
on JSONB columns.
● JSONB column sizes remain below the 1 GB per-row limit
(configurations and payloads are typically less than 100 KB).
● Application teams can author and maintain JSON Schemas for their
JSONB columns.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 160

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option              | Pros              | Cons               | Verdict |
| ------------------- | ----------------- | ------------------ | ------- |
| Controlled JSONB    | Flexibility for   | Two data models    | Adopted |
| usage: JSONB for    | varying data;     | (relational and    |         |
| flexible data with  | millisecond       | JSONB) that        |         |
| GIN index and       | queries via GIN;  | application teams  |         |
| JSON Schema         | type safety via   | must reason        |         |
| validation;         | JSON Schema;      | about; JSON        |         |
| relational columns  | clean separation  | Schema authoring   |         |
| for relationships   | of flexible and   | is an additional   |         |
| and strong-         | strict data.      | skill.             |         |
consistency data
(the chosen
strategy).
| EAV tables for     | All data in         | Expensive queries    | Rejected |
| ------------------ | ------------------- | -------------------- | -------- |
| flexible data:     | relational          | (self-join per       |          |
| separate           | columns; no         | attribute); no type  |          |
| (entity_id,        | JSONB               | constraints; no      |          |
| attribute_name,    | complexity;         | nested structures;   |          |
| attribute_value)   | standard SQL.       | does not scale to    |          |
| tables joined to   |                     | integration          |          |
| the entity table.  |                     | payloads.            |          |
| Per-tenant custom  | All data in         | Operational cost     | Rejected |
| tables: each       | relational          | (500 custom          |          |
| tenant gets a      | columns; strong     | tables per schema    |          |
| custom table for   | typing per tenant;  | change); cross-      |          |
| their custom       | standard SQL per    | tenant queries       |          |
| attributes.        | tenant.             | require UNION;       |          |
does not scale to
integration
payloads.
| JSONB               | Maximum             | No foreign keys;  | Rejected |
| ------------------- | ------------------- | ----------------- | -------- |
| everywhere: use     | flexibility; no     | no strong         |          |
| JSONB for all       | schema              | consistency; no   |          |
| data, including     | migrations; single  | transactions      |          |
| relationships and   | data model.         | across JSONB      |          |
| strong-consistency  |                     | documents; fails  |          |
| data.               |                     | the integrity     |          |
requirement for
financial and
enrollment data.
DECISION
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  161

PreOne ADR - Volume 3: Data Architecture v3.0
ADOPTED
Adopt a controlled JSONB usage strategy. JSONB columns are used for
flexible, schema-light data: configuration, metadata, custom attributes, and
integration payloads. Every JSONB column has a GIN index (per ADR-050)
for containment queries and a JSON Schema constraint validated at write
time via a CHECK constraint. JSONB columns are never used to model
relationships (foreign keys) or strong-consistency data (financial balances,
enrollment state). JSONB column names end in _json or _payload for clarity.
JSONB columns are subject to the standard tenant, school, and academic-
year isolation. The strategy balances flexibility (JSONB) with integrity
(relational columns).
DETAILED RATIONALE
Controlled JSONB usage was chosen because it is the only model that satisfies
all five PreOne hard requirements simultaneously: flexibility for varying data,
millisecond queries at scale, type safety at write time, clean separation of
flexible and strict data, and integration with the existing isolation patterns. The
EAV alternative was rejected primarily on query performance. A query for 'all
students with bus_route = Route 42' on an EAV table requires a self-join
(SELECT s.* FROM students s JOIN student_attrs a ON s.id = a.entity_id
WHERE a.attribute_name = 'bus_route' AND a.attribute_value = 'Route 42'),
which is O(n) on the EAV table and produces poor planner estimates. The same
query on a JSONB column with a GIN index (SELECT * FROM students WHERE
attributes_json @> '{"bus_route": "Route 42"}') is O(log n) via the GIN index
and produces millisecond latency on multi-million-row tables. The EAV
approach also cannot enforce type constraints (all values are text, so
'bus_route' could be stored as '42' or 'Route 42' interchangeably), and cannot
represent nested structures (an attribute with sub-attributes requires recursive
joins). The per-tenant-custom-tables alternative was rejected on operational
cost. A schema change to add a new custom attribute would require 500
migrations (one per tenant), each creating a new column on the tenant's custom
table. The migration would take hours and would lock the custom tables during
the alter. The JSONB approach requires no migration: the new attribute is
simply written to the JSONB column, and the JSON Schema constraint is
updated to allow the new attribute. The per-tenant approach also does not scale
to integration payloads: an LMS integration that adds a new field would require
a migration on every tenant that uses that integration, which is operationally
infeasible. The JSONB-everywhere alternative was rejected on integrity.
Financial balances (a student's outstanding tuition) and enrollment state (a
student's enrollment status) require strong consistency: transactions across
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 162

PreOne ADR - Volume 3: Data Architecture v3.0
multiple rows, foreign keys to reference data, and CHECK constraints on
values. JSONB does not support these: there are no foreign keys from JSONB to
relational tables, no transactions across JSONB documents (each document is
updated independently), and CHECK constraints on JSONB fields are limited
(the JSON Schema validation is structurally correct but cannot enforce
business rules like 'balance cannot be negative'). The controlled approach uses
JSONB where flexibility is required and relational columns where integrity is
required, getting the best of both. The GIN index on every JSONB column is the
key performance enabler. Without a GIN index, a containment query (WHERE
attributes_json @> '{"bus_route": "Route 42"}') is a sequential scan, taking
seconds on a multi-million-row table. With a GIN index, the same query is O(log
n) and takes milliseconds. The GIN index's fast-update mechanism
(gin_pending_list_limit = 4 MB) buffers updates in memory and flushes them in
batches, keeping write latency low even on high-churn JSONB columns. The
GIN index also supports existence queries (WHERE attributes_json ?
'bus_route') and path extraction (WHERE attributes_json ->> 'bus_route' =
'Route 42'), making it versatile for the common query patterns. The JSON
Schema validation via CHECK constraint is the key integrity enabler. The
CHECK constraint uses the jsonb_matches_schema function (from the
postgres-json-schema extension) to validate the JSONB column against a JSON
Schema at write time. The JSON Schema specifies the required fields, the field
types, and the allowed values (via enum). This catches malformed payloads at
write time, preventing data quality issues downstream. The CHECK constraint
adds approximately 5% write overhead (the JSON Schema validation is fast),
which is acceptable. The naming convention (_json or _payload suffix) is a
clarity aid. When reading a schema, the suffix immediately identifies the
column as JSONB, prompting the reader to look up the JSON Schema for the
structure. The convention is enforced by the migration linter, which flags
JSONB columns without the suffix. The integration with isolation patterns is
straightforward. JSONB columns are subject to the same RLS policies as their
containing tables (ADR-043, ADR-044), so tenant and school isolation are
enforced at the JSONB level. The JSONB column does not contain tenant_id or
school_id (those are relational columns on the same table), so the RLS policy on
the relational columns is sufficient. Academic-year isolation (ADR-046) applies
to the table, not to the JSONB column, so JSONB data is partitioned along with
the relational data.
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | JSONB USAGE
STRATEGY | +-------------------------------------------------------------+ |
| | Use JSONB for: Use relational columns for: | | - configuration
- relationships (FK) | | - metadata - strong-consistency data | |
- custom attributes - financial balances | | - integration payloads -
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 163

PreOne ADR - Volume 3: Data Architecture v3.0
enrollment state | | | | Table:
students | | +-----------------------------------------------------+ |
| | id (UUID v7) PK | | | | tenant_id, school_id (relational,
RLS) | | | | name, email, dob (relational, strong consistency) | | | |
enrollment_status (relational, FK to statuses) | | | | outstanding_balance
(numeric, strong consistency) | | | | attributes_json JSONB (flexible custom
attributes) | | | | - bus_route, lunch_pref, parent_employer, ... | | | | -
GIN index for containment queries | | | | - JSON Schema CHECK
constraint at write time | | | | integration_payload_json JSONB (LMS/SIS
sync) | | | | - source_lms_id, source_sis_id, last_sync_at | | | | - GIN
index for containment queries | | | | - JSON Schema CHECK
constraint at write time | | | +-----------------------------------------------------+ | |
| | Query examples: | | - SELECT * FROM students
| | WHERE attributes_json @> '{"bus_route": "Route 42"}' | | (uses GIN
index, millisecond latency) | | - SELECT attributes_json ->>
'lunch_pref' | | FROM students WHERE id = ? | |
(path extraction, no index needed) | | - SELECT * FROM students
| | WHERE integration_payload_json ? 'source_lms_id' | | (existence
check, uses GIN index) | +-------------------------------------------------------------
+
SEQUENCE DIAGRAM
Tenant Admin -> API: POST /students/{id}/attributes {bus_route: "Route 42"}
API -> Schema Validator: validate against JSON Schema Schema Validator ->
API: ok (matches schema) API -> PgBouncer: BEGIN; SET LOCAL app.tenant_id,
app.school_ids PgBouncer -> RDS Primary: route API -> PgBouncer: UPDATE
students SET attributes_json = jsonb_set(attributes_json,
'{bus_route}', '"Route 42"') WHERE id = ? PgBouncer -> RDS
Primary: UPDATE RDS Primary -> CHECK constraint: jsonb_matches_schema(...)
CHECK constraint -> RDS Primary: valid (matches schema) RDS Primary -> GIN
index: update (fast-update buffer) RDS Primary -> Audit Trigger: log to audit_log
RDS Primary -> PgBouncer: 1 row updated PgBouncer -> API: ok API -> Tenant
Admin: 200 OK (attributes updated) (Later, query:) Counselor -> API: GET
/students?bus_route=Route 42 API -> PgBouncer: SELECT * FROM students
WHERE attributes_json @> '{"bus_route": "Route 42"}' PgBouncer -> RDS
Primary: SELECT RDS Primary -> GIN index: lookup "bus_route" = "Route 42"
GIN index -> RDS Primary: matching row TIDs RDS Primary -> RLS: filter
tenant_id, school_id RLS -> RDS Primary: rows for current session RDS Primary
-> PgBouncer: result (students on Route 42) PgBouncer -> API: rows API ->
Counselor: 200 OK (student list)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-052 — JSONB Usage -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Application | read/ | JSONB
Column | | | | Service | write | (e.g., attributes) | | |
+----------------+ +----------+-----------+ | | |
| | | GIN index | | v
| | +--------+----------+ | | | jsonb_path_ops
| | | | (containment) | | |
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 164

PreOne ADR - Volume 3: Data Architecture v3.0
+-------------------+ | | | | Schema
validator (JSON Schema): | | - validates payload before write
| | - rejects unknown keys in strict mode |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Write Flow: App -> validate JSON against JSON Schema App ->
Repository.insert(row with jsonb_col) Postgres -> store JSONB (binary) -> GIN
index update Query Flow (containment): App -> SELECT ... WHERE jsonb_col
@> '{"key":"value"}' Postgres -> GIN index scan -> matching rows Query Flow
(path): App -> SELECT ... WHERE jsonb_col #>> '{path,to,key}' = 'x'
Postgres -> jsonb_path query -> seq or GIN scan
DATABASE IMPACT
Every JSONB column has a GIN index (per ADR-050) for containment and
existence queries. The GIN index uses the jsonb_path_ops operator class
(smaller index, faster queries) for columns where only containment queries are
needed, and the default operator class (larger index, supports all JSONB
operators) for columns where existence and path-extraction queries are also
needed. The GIN fast-update mechanism (gin_pending_list_limit = 4 MB)
buffers updates in memory and flushes them in batches, keeping write latency
low. Every JSONB column has a CHECK constraint that validates the column
against a JSON Schema via the jsonb_matches_schema function (from the
postgres-json-schema extension). The JSON Schema is stored in a version-
controlled schema registry (per table, per column) and is updated via a
migration when the schema evolves. JSONB columns are subject to the
standard RLS policies (ADR-043, ADR-044) and the standard audit columns
(ADR-048). JSONB columns are not used as foreign keys; relationships are
modelled with relational columns and standard foreign-key constraints.
API IMPACT
API endpoints that read JSONB columns return the JSONB value as a JSON
object in the response body. Endpoints that write JSONB columns accept a
JSON object in the request body, which is validated against the JSON Schema at
the API layer (before reaching the database) and at the database layer (via the
CHECK constraint). Endpoints that query on JSONB attributes accept query
parameters that map to JSONB paths (e.g., GET /students?
attributes.bus_route=Route 42 maps to WHERE attributes_json @>
'{"bus_route": "Route 42"}'). The API contract documents the queryable JSONB
paths for each endpoint, ensuring clients use supported paths. Bulk endpoints
that update JSONB columns accept a JSON merge patch (RFC 7396) for partial
updates, which is applied via the jsonb_patch function. The API does not expose
the GIN index or the JSON Schema directly; these are database-level concerns.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 165

PreOne ADR - Volume 3: Data Architecture v3.0
UI IMPACT
JSONB columns back flexible-form features in the UI. The 'Custom Attributes'
panel on entity detail pages (Student, Course, Guardian) is rendered
dynamically from a JSON Schema stored alongside the data: the schema
defines the fields, types, and validation rules; the UI renders an appropriate
input (text, number, date, dropdown) for each. Users with the 'Configure
Attributes' permission can edit the schema via a form builder, and the UI
immediately reflects the new fields on all entity pages within that tenant.
JSONB enables this flexibility without schema migrations per tenant — a key
UX advantage.
SECURITY IMPACT
JSONB columns do not introduce new security properties beyond the standard
tenant and school isolation (ADR-043, ADR-044). RLS policies apply to the row,
not to the JSONB column, so a JSONB column is visible to a session that has
access to the row. The principal residual risk is sensitive data in JSONB
columns: a tenant might store PII (e.g., parent employer, medical notes) in a
custom attribute, which would not be tagged as PII in the schema. This is
mitigated by the JSON Schema, which can mark certain fields as PII (via a
custom 'x-pii' annotation), and by the PII scanner (ADR-079), which scans
JSONB columns for PII patterns and flags them for review. The JSON Schema is
reviewed by the security team when a new field is added; fields that look like PII
are flagged and the tenant is notified of the retention implications.
PERFORMANCE IMPACT
JSONB with GIN indexing delivers millisecond-latency containment queries on
multi-million-row tables. Internal benchmarks on the students table (10M rows,
attributes_json column with 20 fields per row) show: containment query
(WHERE attributes_json @> '{"bus_route": "Route 42"}') p99 latency of 18ms
via GIN index; existence query (WHERE attributes_json ? 'bus_route') p99
latency of 12ms via GIN index; path extraction (WHERE attributes_json ->>
'bus_route' = 'Route 42') p99 latency of 25ms via GIN index. The GIN index size
is approximately 30% of the JSONB column size, which is acceptable. The JSON
Schema CHECK constraint adds approximately 5% write overhead, which is
acceptable. The GIN fast-update mechanism keeps write latency low even on
high-churn JSONB columns; the gin_pending_list_limit is tuned per column
based on the write rate.
SCALABILITY ANALYSIS
JSONB with GIN indexing scales to PreOne's projected 500 tenants and 10M
rows per tenant on the students table. The GIN index on the students table
(10M rows, 20 fields per row) is approximately 1.2 GB, which fits comfortably in
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 166

PreOne ADR  -  Volume 3: Data Architecture  v3.0
memory. Beyond 10M rows per tenant, the GIN index grows linearly; at 50M
rows per tenant (projected 2030), the index would be approximately 6 GB,
which is still manageable. The jsonb_path_len constraint (maximum 100 fields
per JSONB column) prevents unbounded growth of the JSONB document,
keeping the GIN index size bounded. The strategy is stable for the foreseeable
future. The trigger for revisiting is if the JSONB column size exceeds 100 KB
per row (which would degrade GIN index performance), but no current PreOne
use case approaches this limit.
OPERATIONAL CONSIDERATIONS
The SRE team owns the GIN index configuration (operator class, fast-update
limit) and the postgres-json-schema extension. Application teams own the
JSONB column schemas, the JSON Schemas, and the query patterns. The CI
pipeline verifies that every JSONB column has a GIN index and a CHECK
constraint; a missing element blocks the migration. The JSON Schema registry
is version-controlled and reviewed by the security team when a new field is
added. The GIN index bloat is monitored via pgstattuple (per ADR-050) and
reclaimed   via   pg_repack   during   maintenance   windows.   The
gin_pending_list_limit is tuned per column based on the write rate; columns
with high write rates have a higher limit (8 MB) to reduce flush frequency,
while columns with low write rates have the default (4 MB).
RISKS
| Risk                 | Likelihood | Impact | Mitigation           |
| -------------------- | ---------- | ------ | -------------------- |
| A tenant stores PII  | Medium     | High   | JSON Schema 'x-      |
| in a JSONB           |            |        | pii' annotation      |
| custom attribute     |            |        | marks sensitive      |
| without the          |            |        | fields; PII scanner  |
| security team's      |            |        | (ADR-079) scans      |
| knowledge,           |            |        | JSONB columns        |
| causing a            |            |        | for PII patterns;    |
| compliance           |            |        | security team        |
| incident.            |            |        | reviews new          |
fields.
| A JSONB column    | Low | Medium | jsonb_path_len     |
| ----------------- | --- | ------ | ------------------ |
| grows beyond 100  |     |        | constraint (max    |
| fields per row,   |     |        | 100 fields)        |
| degrading GIN     |     |        | prevents           |
| index             |     |        | unbounded          |
| performance.      |     |        | growth; migration  |
linter flags JSONB
columns
approaching the
limit.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  167

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation          |
| ------------------- | ---------- | ------ | ------------------- |
| The GIN fast-       | Low        | Medium | gin_pending_list_li |
| update buffer       |            |        | mit tuned per       |
| overflows, causing  |            |        | column based on     |
| a synchronous       |            |        | write rate; alert   |
| flush that          |            |        | fires if the        |
| degrades write      |            |        | pending list        |
| latency.            |            |        | exceeds 80% of      |
the limit.
| The JSON Schema     | Medium | Low | JSON Schema is    |
| ------------------- | ------ | --- | ----------------- |
| validation rejects  |        |     | reviewed by the   |
| a legitimate        |        |     | application team  |
| payload due to an   |        |     | and the SRE team  |
| overly strict       |        |     | before            |
| schema, blocking    |        |     | deployment;       |
| a write.            |        |     | schema updates    |
are tested in
staging with
production-like
payloads.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Flexibility for varying data (custom  Two data models (relational and
attributes, integration payloads,  JSONB) that application teams must
| configuration) without migrations. |     | reason about. |     |
| ---------------------------------- | --- | ------------- | --- |
Millisecond-latency containment and  GIN index size is approximately 30% of
existence queries via GIN index. JSONB column size; storage overhead.
Type safety at write time via JSON  JSON Schema authoring is an additional
| Schema CHECK constraint. |     | skill; 5% write overhead from  |     |
| ------------------------ | --- | ------------------------------ | --- |
validation.
Clean separation of flexible (JSONB)  JSONB cannot model relationships or
and strict (relational) data. strong-consistency data; some data
must be in relational columns.
REJECTED ALTERNATIVES
EAV tables were rejected on query performance (self-join per attribute), type
constraints (all values are text), and nested structures (recursive joins). Per-
tenant custom tables were rejected on operational cost (500 migrations per
schema change) and cross-tenant query complexity (UNION across custom
tables). JSONB everywhere was rejected on integrity (no foreign keys, no
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  168

PreOne ADR - Volume 3: Data Architecture v3.0
strong consistency, no transactions across documents). A hybrid model (JSONB
for custom attributes, EAV for integration payloads) was considered but
rejected because it duplicates the flexible-data pattern with two mechanisms;
JSONB handles both use cases. The full reasoning for each rejection is captured
in the Options Considered table.
MIGRATION PLAN
Migration from the legacy EAV and per-tenant-custom-tables mix to the JSONB
strategy proceeds table-by-table over two quarters. Each migration follows the
standard pattern: (1) add the JSONB column (e.g., attributes_json) to the entity
table, nullable initially; (2) backfill existing rows from the EAV table or the per-
tenant custom table into the JSONB column via a migration script; (3) author
the JSON Schema for the column and add the CHECK constraint; (4) create the
GIN index; (5) update application code to read and write the JSONB column
instead of the EAV table or the custom table; (6) after a 30-day observation
period, drop the EAV table or the custom table. Rollback per table is to drop the
JSONB column, the GIN index, and the CHECK constraint; the EAV table or the
custom table is restored from backup if it was dropped.
TESTING STRATEGY
JSONB usage is tested at three levels. (1) Unit: every JSONB column's CHECK
constraint is verified to reject malformed JSON (missing required fields, wrong
types, invalid enum values) and to accept well-formed JSON. The GIN index is
verified to be used by containment, existence, and path-extraction queries (via
EXPLAIN). (2) Integration: the CI pipeline verifies that the API layer validates
JSONB writes against the JSON Schema before reaching the database, and that
the database layer rejects writes that bypass the API (via direct database
writes). (3) Performance: the JSONB query-latency benchmark runs in CI on
every schema change; regression beyond 5% on p99 latency blocks the change.
The GIN index bloat is monitored and reclaimed via pg_repack per ADR-050.
MONITORING & OBSERVABILITY
JSONB usage health is monitored through four metrics. (1) JSONB column size:
per-column average and maximum JSONB document size, exported monthly;
alert fires if the maximum exceeds 80 KB (80% of the 100 KB limit). (2) GIN
index bloat: per-index bloat percentage from pgstattuple, exported quarterly;
alert fires if bloat exceeds 30% (candidate for pg_repack). (3) GIN pending list
size: per-column pending list size; alert fires if the size exceeds 80% of
gin_pending_list_limit. (4) JSON Schema validation failure rate: percentage of
writes that fail the CHECK constraint; alert fires if the rate exceeds 0.1% of
writes (potential schema mismatch with integration payloads). The PII scanner
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 169

PreOne ADR - Volume 3: Data Architecture v3.0
(ADR-079) runs weekly on JSONB columns and reports new fields that look like
PII.
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
move to PostgreSQL 17's SQL/JSON path expressions (jsonb_path_match,
jsonb_path_exists) for more complex queries, which would replace some
application-level JSON manipulation with database-level queries. A second
possible evolution is the introduction of generated columns (PostgreSQL 12+)
that extract frequently-queried JSONB fields into relational columns with B-tree
indexes, providing faster queries for the most common paths. A third possible
evolution is the introduction of JSONB schema versioning (a schema_version
field in the JSONB document) to support schema evolution without breaking
existing documents. No current PreOne use case requires these evolutions
beyond what is already documented.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-043 - Tenant Isolation (JSONB columns are subject to RLS)
● ADR-044 - School Isolation (JSONB columns are subject to RLS)
● ADR-046 - Academic Year Isolation (JSONB columns are partitioned
with the table)
● ADR-050 - Indexing Strategy (GIN indexes on JSONB columns)
● ADR-058 - Seed Data Strategy (reference data uses JSONB for flexible
metadata)
● ADR-059 - Search Strategy (tsvector generated from JSONB for full-text
search)
● ADR-079 - PII Protection (PII scanner covers JSONB columns)
REFERENCES
● PostgreSQL Documentation - JSON Types and JSONB Indexing. The
PostgreSQL Global Development Group. 2024.
● JSON Schema Specification - Internet Engineering Task Force. 2020.
● postgres-json-schema Extension - Gavin Wahl. 2024.
● PreOne Engineering Handbook, Section 7.12 - JSONB Usage. Internal.
2025.
● PreOne Integration Payloads Reference - Internal. 2025.
DECISION HISTORY
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 170

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Office of the Chief Architect |     |
| ----------- | --- | ----------------------------- | --- |
| Tech Lead   |     | Data Platform Lead            |     |
| ARB Chair   |     | Architecture Review Board     |     |
| Approved On |     | 2025-10-15                    |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● JSONB columns added to flexible-schema tables (Done)
● GIN indexes (jsonb_path_ops) created on hot query paths (Done)
● JSON Schema validator integrated into repository layer (Done)
● Form-builder UI for custom attributes deployed (Done)
● Quarterly JSONB query performance review (Scheduled)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  171

PreOne ADR - Volume 3: Data Architecture v3.0
AD R -053
Data Retention
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a 7-year rolling retention policy for academic records (enrollment,
attendance, gradebook, transcripts) and audit_log, a 1-year retention policy
for event_log, and a 30-day retention policy for ephemeral data (sessions,
cache). Retention is enforced via partition drop (per ADR-046, ADR-051) for
partitioned tables and via batched DELETE with VACUUM for non-
partitioned tables. Rows under legal hold are exempted from retention.
Archived data is moved to S3 Glacier (per ADR-054) before final deletion.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on RPO/RTO
target change, or on regulatory
update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne is a regulated SaaS platform serving the education sector. Academic
records must be retained for 7 years in most jurisdictions (FERPA in the US,
equivalent regulations in the EU and India). Audit logs must be retained for 7
years for compliance and forensic purposes. Event logs (application-level
events: login, logout, feature-flag evaluation) are retained for 1 year for
operational analytics. Ephemeral data (sessions, cache) is retained for 30 days
for security and debugging. Beyond these windows, data must be deleted to
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 172

PreOne ADR - Volume 3: Data Architecture v3.0
comply with privacy regulations (GDPR right-to-be-forgotten, CCPA deletion
rights) and to manage storage cost. The retention policy must be enforced
reliably: a row that is past its retention window must be deleted within a
bounded time, not retained indefinitely due to a forgotten job. The retention
policy must also be auditable: a compliance auditor must be able to verify that
data older than the retention window has been deleted (or archived). The
partition-drop mechanism (per ADR-046, ADR-051) provides both: the partition
drop is an O(1) metadata operation that immediately reclaims storage, and the
partition drop is logged for audit. The legal-hold exemption is a critical edge
case. A row that is under legal hold (e.g., a student record involved in a lawsuit)
must not be deleted even if it is past the retention window. The legal hold is
tracked in a separate table (legal_holds) that the retention enforcement job
consults before deleting. The legal-hold exemption applies to specific rows (by
primary key), not to entire partitions; if a partition contains a legally-held row,
the partition is not dropped, and the row is preserved by exporting it to a
separate table before the partition drop. The principal alternative considered
was indefinite retention (never delete data, rely on storage cost management).
This was rejected on regulatory grounds (GDPR right-to-be-forgotten requires
deletion) and on cost grounds (storage cost would grow unboundedly). A
second alternative was per-tenant retention policies (each tenant configures its
own retention window). This was rejected on operational complexity (per-
tenant configuration increases the testing and audit burden) and on the
principle that the 7-year window is a regulatory minimum, not a tenant
preference.
BUSINESS DRIVERS
PreOne's institutional customers require that academic records be retained for
7 years for regulatory compliance. A compliance audit that finds records older
than 7 years (which should have been deleted) is a failed audit, with contractual
and regulatory consequences. The 7-year retention policy ensures that the
audit finds neither missing records (deleted too early) nor excess records
(retained too long). A secondary driver is GDPR right-to-be-forgotten. A
student who requests deletion of their data must have their data deleted within
30 days (per GDPR Article 17). The 7-year retention policy applies to records
that are not subject to a deletion request; records subject to a deletion request
are deleted immediately, regardless of the retention window. The retention
policy and the deletion-request workflow are separate concerns, coordinated
via the legal_holds table. A tertiary driver is storage cost. Without retention
enforcement, storage would grow unboundedly, requiring ever-larger cluster
sizes. The 7-year retention policy bounds storage growth to 7 years of data,
which is a known and budgetable quantity. The partition-drop mechanism
reclaims storage immediately, without the VACUUM overhead of a DELETE.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 173

PreOne ADR - Volume 3: Data Architecture v3.0
PROBLEM STATEMENT
PreOne requires a data retention policy that enforces 7-year retention for
academic records and audit_log, 1-year retention for event_log, 30-day
retention for ephemeral data, exempts legally-held rows, archives data to cold
storage before final deletion, and is auditable by compliance reviewers.
CONSTRAINTS
● Academic records (enrollment, attendance, gradebook, transcripts) are
retained for 7 years.
● Audit_log is retained for 7 years; event_log is retained for 1 year.
● Ephemeral data (sessions, cache) is retained for 30 days.
● Retention is enforced via partition drop (per ADR-046, ADR-051) for
partitioned tables; via batched DELETE with VACUUM for non-
partitioned tables.
● Rows under legal hold (tracked in legal_holds table) are exempted from
retention.
● Archived data is moved to S3 Glacier (per ADR-054) before final
deletion; the archive is retained for an additional 7 years before final
deletion.
ASSUMPTIONS
● The 7-year retention window is correct for all jurisdictions PreOne
operates in (US, EU, India).
● The legal_holds table is reliably maintained (legal team adds and
removes holds as needed).
● The partition-drop mechanism correctly identifies partitions past the
retention window.
● The archive-to-S3-Glacier job runs reliably before the partition drop.
● Compliance auditors accept the partition-drop audit log as evidence of
retention enforcement.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 174

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option             | Pros                | Cons               | Verdict |
| ------------------ | ------------------- | ------------------ | ------- |
| 7-year retention   | Compliant with      | Requires           | Adopted |
| for academic       | regulations;        | coordination       |         |
| records and        | bounded storage     | between retention  |         |
| audit_log, 1-year  | growth; auditable;  | job, archive job,  |         |
| for event_log, 30- | legally-held rows   | and legal_holds    |         |
| day for ephemeral  | preserved.          | table; partition   |         |
| data; partition    |                     | drop is            |         |
| drop for           |                     | permanent.         |         |
enforcement;
legal-hold
exemption;
archive to S3
Glacier before
deletion (the
chosen strategy).
| Indefinite         | Simplest model;    | Fails GDPR right-   | Rejected |
| ------------------ | ------------------ | ------------------- | -------- |
| retention; never   | no retention job;  | to-be-forgotten;    |          |
| delete data; rely  | no legal-hold      | storage cost        |          |
| on storage cost    | complexity.        | grows               |          |
| management.        |                    | unboundedly; fails  |          |
compliance audits
for excess
records.
| Per-tenant           | Flexibility for  | Per-tenant          | Rejected |
| -------------------- | ---------------- | ------------------- | -------- |
| retention policies;  | tenants with     | configuration       |          |
| each tenant          | specific         | increases testing   |          |
| configures its own   | requirements;    | and audit burden;   |          |
| retention window.    | tenant self-     | 7-year window is a  |          |
|                      | service.         | regulatory          |          |
minimum, not a
tenant preference;
complicates the
retention job.
DELETE-based  Works for non- O(n) DELETE with  Rejected (for
retention (no  partitioned tables;  VACUUM bloat;  partitioned tables;
partitioning);  no partition  does not scale to  adopted for non-
| batched DELETE   | maintenance. | 50B-row         | partitioned tables) |
| ---------------- | ------------ | --------------- | ------------------- |
| with VACUUM for  |              | audit_log; per- |                     |
| all tables.      |              | month           |                     |
backup/restore is
not possible.
DECISION
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  175

PreOne ADR - Volume 3: Data Architecture v3.0
ADOPTED
Adopt a 7-year rolling retention policy for academic records (enrollment,
attendance, gradebook, transcripts) and audit_log, a 1-year retention policy
for event_log, and a 30-day retention policy for ephemeral data (sessions,
cache). Retention is enforced via partition drop (per ADR-046, ADR-051) for
partitioned tables and via batched DELETE with VACUUM for non-
partitioned tables. Rows under legal hold (tracked in the legal_holds table)
are exempted from retention. Archived data is moved to S3 Glacier (per
ADR-054) before final deletion; the archive is retained for an additional 7
years before final deletion. The retention enforcement job runs nightly and
is audited.
DETAILED RATIONALE
The 7-year retention policy with partition-drop enforcement was chosen
because it is the only model that satisfies all five PreOne hard requirements
simultaneously: regulatory compliance, bounded storage growth, auditability,
legal-hold exemption, and scalability to 50 billion rows. Indefinite retention
was rejected on regulatory grounds. GDPR Article 17 requires deletion of
personal data when requested by the data subject; indefinite retention makes
this impossible. CCPA and equivalent regulations have similar requirements.
Indefinite retention also fails compliance audits for excess records: an auditor
who finds records older than the regulatory retention window (7 years for
academic records) will flag the excess as a compliance violation, even if no
deletion request was made. Per-tenant retention policies were rejected on
operational complexity. Each tenant configuring its own retention window
would require per-tenant retention jobs, per-tenant audit reports, and per-
tenant test cases. The 7-year window is a regulatory minimum in all
jurisdictions PreOne operates in, so there is no tenant benefit to a shorter
window (which would violate regulation) and no regulatory benefit to a longer
window (which would increase storage cost without compliance benefit). The 7-
year window is the correct policy for all tenants. DELETE-based retention was
rejected for partitioned tables on scalability. A DELETE on a 50B-row audit_log
table to remove 7-year-old data would be O(n) where n is 50 billion rows, taking
days and producing massive VACUUM bloat. The partition-drop mechanism is
O(1) metadata, taking seconds. For non-partitioned tables (e.g., the sessions
table, which is small and not partitioned), DELETE-based retention is
appropriate and is used. The legal-hold exemption is implemented via the
legal_holds table, which contains (table_name, primary_key, hold_reason,
held_by, held_until) rows. The retention enforcement job consults this table
before deleting any row or dropping any partition. If a row is under legal hold,
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 176

PreOne ADR - Volume 3: Data Architecture v3.0
the row is exported to a separate table (legal_hold_archive) before the partition
drop, and the partition is dropped. The legal-hold exemption is auditable: the
legal_hold_archive table preserves the row, and the legal_holds table records
the reason and the actor. The archive-to-S3-Glacier step is critical for data
recoverability. The partition drop is permanent: the data is gone from Postgres.
The archive step preserves the data in cold storage for an additional 7 years,
enabling recovery if the drop was premature (e.g., a legal hold was added after
the drop, or a compliance audit requests data that was already dropped). The
archive is stored in S3 Glacier Deep Archive, which is the cheapest storage
class (approximately $0.00099 per GB per month), making the 7-year archive
cost negligible. The 30-day retention for ephemeral data is a security and
debugging choice. Session data older than 30 days is not useful for debugging
(the user has logged out long ago) and is a security risk (stale sessions could be
hijacked). The 30-day window is enforced via batched DELETE on the sessions
table (which is not partitioned), with VACUUM to reclaim space. The 30-day
window is shorter than the regulatory minimum (7 years) because ephemeral
data is not regulated. The nightly enforcement schedule is a balance between
promptness and load. A nightly job ensures that data is deleted within 24 hours
of becoming eligible, which is well within the regulatory tolerance. The job runs
during the low-traffic window (02:00-04:00 tenant-local-time) to avoid
impacting query performance. The job is idempotent: if it fails partway, it can
be re-run without double-deletion (the partition drop is idempotent because the
partition no longer exists after the first drop).
ARCHITECTURE DIAGRAM
+-------------------------------------------------------------+ | DATA RETENTION
POLICY | +-------------------------------------------------------------+ |
| | Data Category | Retention | Enforcement | |
---------------------|------------|---------------------- | | Academic records | 7 years |
Partition drop (yearly)| | (enrollment, attend, | | per ADR-046 | |
gradebook, transcr) | | | | Audit_log | 7 years |
Partition drop (monthly)| | | | per ADR-051 | |
Event_log | 1 year | Partition drop (monthly)| | | |
per ADR-051 | | Ephemeral (sessions)| 30 days | Batched
DELETE+VACUUM | | | | Legal hold
exemption: | | +-----------------------------------------------------+ | |
| legal_holds table | | | | (table_name, primary_key,
reason, held_by, until) | | | +-----------------------------------------------------+ | |
Retention job consults legal_holds before drop. | | If row is held: export to
legal_hold_archive, then drop. | | | |
Archive before deletion: | | Partition -> S3 Glacier Deep
Archive (per ADR-054) | | S3 Glacier -> retained for additional 7 years
| | S3 Glacier -> final deletion after additional 7 years | |
| | Nightly job: 02:00-04:00 tenant-local-time | | - Identify partitions
past retention window | | - Check legal_holds; export held rows
| | - Archive partition to S3 Glacier | | - Drop partition (O(1)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 177

PreOne ADR - Volume 3: Data Architecture v3.0
metadata) | | - Log to retention_audit_log |
+-------------------------------------------------------------+
SEQUENCE DIAGRAM
Nightly Job -> Retention Audit: identify partitions past 7yr Retention Audit ->
legal_holds: check for held rows in partition legal_holds -> Retention Audit: row
X is held (reason: lawsuit) Retention Audit -> legal_hold_archive: export row X
legal_hold_archive -> Retention Audit: row X archived Retention Audit -> S3
Glacier: archive partition (per ADR-054) S3 Glacier -> Retention Audit: archive
complete (S3 URI) Retention Audit -> Parent: DROP TABLE
partition_2017_2018_t01 Parent -> Catalog: partition removed (O(1) metadata)
Retention Audit -> retention_audit_log: log (partition, S3 URI, timestamp)
retention_audit_log -> Compliance Dashboard: visible to auditors (Legal hold
added later, after drop:) Legal Team -> legal_holds: INSERT (table=X, pk=Y,
reason=subpoena) legal_holds -> Retention Job: row Y is now held Retention Job
-> S3 Glacier: check if row Y was archived S3 Glacier -> Retention Job: yes,
archived on 2024-09-01 Retention Job -> Legal Team: row Y recoverable from S3
Glacier Legal Team -> Restore Job: restore row Y from S3 Glacier (per ADR-056)
Restore Job -> legal_hold_archive: INSERT row Y (recovered)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-053 — Data Retention -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Retention | scan | Tables
in scope | | | | Scheduler |------->| (with retention tag) | | | |
(daily) | +----------+-----------+ | | +----------------+ |
| | | rows past TTL | | v
| | +--------+----------+ | | | Archive Writer
| | | | (to S3 + Glacier) | | | +--------
+----------+ | | | | |
| after archive | | v | |
+--------+----------+ | | | Purge Job | | |
| (DELETE / DETACH) | | | +-------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Retention Enforcement Flow: Scheduler (daily 02:00) -> scan tables with
retention tag For each row past TTL -> mark for archive Archive Writer ->
batch export to S3 (Parquet) S3 -> lifecycle -> Glacier (after 90 days) Purge
Job -> DELETE archived rows (after verification) Audit Flow: Each purge
writes to retention_audit_log Audit log records: table, row count, archive path,
operator
DATABASE IMPACT
Retention is enforced via partition drop for partitioned tables (academic
records per ADR-046; audit_log and event_log per ADR-051) and via batched
DELETE with VACUUM for non-partitioned tables (sessions, cache). The
nightly retention job identifies partitions past the retention window, checks the
legal_holds table for held rows, exports held rows to legal_hold_archive,
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 178

PreOne ADR - Volume 3: Data Architecture v3.0
archives the partition to S3 Glacier (per ADR-054), and drops the partition. The
drop is logged to retention_audit_log with the partition name, the S3 archive
URI, and the timestamp. The legal_holds table contains (table_name,
primary_key, hold_reason, held_by, held_until) rows; the retention job consults
it before dropping. The legal_hold_archive table preserves legally-held rows
that would otherwise be lost in a partition drop. The S3 Glacier archive is
retained for an additional 7 years (14 years total from creation) before final
deletion; the S3 lifecycle policy manages this automatically. The
retention_audit_log table is the audit evidence for compliance reviewers; it is
queried by the compliance dashboard.
API IMPACT
API endpoints do not directly interact with retention; retention is a database-
level concern enforced by the nightly job. However, the API exposes a GET
/retention/audit endpoint (admin-only) that returns the retention_audit_log
entries for a given time range, enabling compliance reviewers to verify
retention enforcement without direct database access. The API exposes a POST
/legal-holds endpoint (legal-team-only) that adds a legal hold to a row,
exempting it from retention. The API exposes a DELETE /legal-holds/{id}
endpoint (legal-team-only) that removes a legal hold, allowing the row to be
retained on the next retention cycle. The API contract documents that data
older than the retention window may have been deleted (or archived to S3
Glacier); clients that need historical data must request a restore from the
archive (per ADR-056), which is a manual process with a 48-hour SLA.
UI IMPACT
Data retention affects the UI in two ways. First, list views with a time dimension
(e.g., audit log, attendance history) display a 'Data available from <date>'
notice indicating the retention boundary; users cannot query data older than
the retention window. Second, the admin UI gained a 'Data Retention' settings
page showing the retention policy per data category, the next purge date, and
an audit log of past purges. End users see no removal notices — retention is a
backend process. For records approaching the retention boundary, no advance
warning is shown (this was a deliberate UX choice to avoid alarm fatigue).
SECURITY IMPACT
Retention enforcement is a security and compliance control. Deleting data past
its retention window reduces the attack surface (less data to breach) and
ensures compliance with privacy regulations (GDPR, CCPA). The legal-hold
exemption is a security consideration: a row under legal hold must not be
deleted, even if it is past the retention window, because it may be evidence in a
legal proceeding. The legal_holds table is access-controlled (legal-team-only);
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 179

PreOne ADR - Volume 3: Data Architecture v3.0
the retention_audit_log table is access-controlled (compliance-team-only and
security-team-only). The S3 Glacier archive is encrypted at rest (SSE-S3) and
access-controlled via IAM; the archive is write-once (S3 Object Lock in
compliance mode) to prevent tampering. The retention job's service account
has the minimum privileges required (SELECT on the partitioned tables,
INSERT on legal_hold_archive and retention_audit_log, DROP on the partitions,
PUT on the S3 archive bucket).
PERFORMANCE IMPACT
Retention enforcement has negligible performance impact on the cluster. The
nightly job runs during the low-traffic window (02:00-04:00 tenant-local-time)
and processes one partition per table per night (the oldest partition past the
retention window). The partition drop is an O(1) metadata operation that takes
seconds. The archive-to-S3-Glacier step is the slowest part: archiving an 8M-
row monthly audit_log partition takes approximately 15 minutes (dominated by
the S3 PUT), well within the 2-hour window. The batched DELETE on the
sessions table processes approximately 100K rows per night (the daily session-
expiration rate), which is well within autovacuum's capacity (per-table
autovacuum tuning per ADR-050). The legal_holds table is small (projected
1000 rows at steady state) and does not impact performance. The
retention_audit_log table grows at one row per partition drop per night, which
is negligible.
SCALABILITY ANALYSIS
The retention policy scales to PreOne's projected 500 tenants and 50 billion
audit_log rows. The nightly job processes one partition per table per night per
tenant bucket (32 buckets for audit_log per ADR-051), so 32 partition drops per
night for audit_log, completing in under 10 minutes. The archive step processes
32 partitions per night, each taking approximately 15 minutes, totaling 8 hours,
which exceeds the 2-hour window. To stay within the window, the archive step
is parallelised across 4 threads, reducing the total to 2 hours. Beyond 500
tenants, the archive parallelism must increase (8 threads for 1000 tenants) or
the archive window must widen (4 hours for 1000 tenants). The strategy is
stable for the foreseeable future. The trigger for revisiting is if the nightly job
consistently exceeds the 2-hour window, which is monitored.
OPERATIONAL CONSIDERATIONS
The SRE team owns the nightly retention job, the S3 Glacier archive lifecycle,
and the retention_audit_log. The legal team owns the legal_holds table (adding
and removing holds as needed). The compliance team owns the
retention_audit_log review (verifying that retention was enforced correctly).
The CI pipeline verifies that the retention job is configured for every partitioned
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 180

PreOne ADR  -  Volume 3: Data Architecture  v3.0
table; a missing configuration blocks the migration. The legal_holds table is
monitored: alert fires if a legal hold is expiring within 7 days (the legal team
must review and renew or release). The S3 Glacier archive is monitored: alert
fires if the archive job fails or if the archive size deviates from the expected
value   (32   partitions   per   month   for   audit_log   at   500   tenants).   The
retention_audit_log is reviewed quarterly by the compliance team; any
deviation from the expected drop pattern triggers an investigation.
RISKS
| Risk               | Likelihood | Impact | Mitigation              |
| ------------------ | ---------- | ------ | ----------------------- |
| The retention job  | Low        | High   | Nightly job is          |
| fails to run,      |            |        | monitored; alert        |
| leaving data past  |            |        | fires if the job fails  |
| the retention      |            |        | or if the drop          |
| window and         |            |        | count deviates          |
| failing a          |            |        | from the expected       |
| compliance audit.  |            |        | value. SRE on-call      |
can run the job
manually as a
fallback.
| A legal hold is     | Low | Medium | S3 Glacier Deep      |
| ------------------- | --- | ------ | -------------------- |
| added after the     |     |        | Archive supports     |
| partition drop,     |     |        | retrieval within 12  |
| requiring recovery  |     |        | hours; the restore   |
| from the S3         |     |        | is performed via     |
| Glacier archive.    |     |        | ADR-056. The 14-     |
year total
retention (7 years
in Postgres + 7
years in Glacier)
provides a long
recovery window.
| The archive-to-S3-   | Low | Medium | The retention job      |
| -------------------- | --- | ------ | ---------------------- |
| Glacier step fails,  |     |        | is structured as       |
| causing the          |     |        | archive-then-drop:     |
| partition drop to    |     |        | if the archive fails,  |
| be skipped and       |     |        | the drop is            |
| storage to grow      |     |        | skipped. Alert         |
| unexpectedly.        |     |        | fires if the archive   |
fails; SRE on-call
can retry the
archive or drop
the partition
manually if the
archive is deemed
non-critical.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  181

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation          |
| ------------------- | ---------- | ------ | ------------------- |
| A compliance        | Low        | High   | The archive-to-S3-  |
| auditor requests    |            |        | Glacier step runs   |
| data that was       |            |        | before the drop,    |
| already deleted     |            |        | ensuring data is    |
| (and not            |            |        | recoverable. The    |
| archived), causing  |            |        | 14-year total       |
| a failed audit.     |            |        | retention provides  |
a long recovery
window. The
retention_audit_lo
g documents what
was dropped and
where it was
archived.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Regulatory compliance (FERPA, GDPR,  Requires coordination between
CCPA) via enforced 7-year retention. retention job, archive job, and
legal_holds table.
Bounded storage growth (7 years of  Data older than 7 years is deleted from
| data, not unbounded). |     | Postgres; recovery requires a 12-hour  |     |
| --------------------- | --- | -------------------------------------- | --- |
S3 Glacier restore.
Auditable: retention_audit_log provides  The legal-hold exemption adds
evidence of enforcement for compliance  complexity; legally-held rows must be
| reviewers. |     | exported before partition drop. |     |
| ---------- | --- | ------------------------------- | --- |
Partition drop is O(1) metadata,  Partition drop is permanent; the S3
reclaiming storage immediately without  Glacier archive is the only recovery
| VACUUM. |     | path. |     |
| ------- | --- | ----- | --- |
REJECTED ALTERNATIVES
Indefinite retention was rejected on regulatory grounds (GDPR right-to-be-
forgotten) and cost (unbounded storage growth). Per-tenant retention policies
were rejected on operational complexity (per-tenant jobs and audit reports) and
on the principle that 7 years is a regulatory minimum, not a tenant preference.
DELETE-based retention was rejected for partitioned tables on scalability (O(n)
DELETE with VACUUM bloat on 50B-row tables); it is adopted for non-
partitioned tables where it is appropriate. A shorter retention window (e.g., 3
years) was considered but rejected on regulatory grounds (7 years is the
minimum in most jurisdictions). A longer retention window (e.g., 10 years) was
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  182

PreOne ADR - Volume 3: Data Architecture v3.0
considered but rejected on cost grounds (additional storage without
compliance benefit). The full reasoning for each rejection is captured in the
Options Considered table.
MIGRATION PLAN
Migration from the legacy indefinite-retention model to the 7-year retention
policy proceeds in two phases over one quarter. Phase 1 (weeks 1-4):
implement the legal_holds table, the legal_hold_archive table, the
retention_audit_log table, and the nightly retention job; pilot on the audit_log
table (the highest-volume table). Phase 2 (weeks 5-12): extend the retention job
to all partitioned tables (academic records, event_log) and to the non-
partitioned sessions table; verify that the job runs nightly and that the
retention_audit_log is populated correctly. Existing data older than 7 years is
archived to S3 Glacier and dropped in batches during the migration, not all at
once. Rollback is to disable the nightly job; the existing data is unaffected (the
job only drops data past the retention window).
TESTING STRATEGY
Retention is tested at three levels. (1) Unit: the retention job is verified to
correctly identify partitions past the retention window, to consult the
legal_holds table, to export held rows to legal_hold_archive, to archive the
partition to S3 Glacier, and to drop the partition. The legal-hold exemption is
verified by inserting a legal hold and verifying that the corresponding row is
exported and not lost. (2) Integration: the CI pipeline runs the retention job in
staging with a clock advanced past the retention window and verifies that the
partition is dropped, the archive is created in S3, and the retention_audit_log is
populated. (3) End-to-end: a quarterly compliance drill simulates an auditor
request for data that was dropped (and archived), verifying that the data can be
restored from S3 Glacier within the 12-hour retrieval SLA. The legal-hold
workflow is tested by inserting a legal hold after a partition drop and verifying
that the data can be recovered from the S3 Glacier archive.
MONITORING & OBSERVABILITY
Retention health is monitored through five metrics. (1) Retention job success:
alert fires if the nightly job fails or if the drop count deviates from the expected
value (32 per month for audit_log at 500 tenants). (2) Archive job success: alert
fires if the archive-to-S3-Glacier step fails or if the archive size deviates from
the expected value. (3) Legal-hold expiry: alert fires if a legal hold is expiring
within 7 days (legal team must review). (4) Storage growth: monthly storage
growth, exported to CloudWatch; alert fires if growth exceeds projection by
20% (potential retention job failure). (5) retention_audit_log completeness:
percentage of partition drops that have a corresponding audit log entry; target
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 183

PreOne ADR - Volume 3: Data Architecture v3.0
100%, current 100%. The retention_audit_log is reviewed quarterly by the
compliance team; any deviation from the expected drop pattern triggers an
investigation.
FUTURE EVOLUTION
The decision is stable for the foreseeable future. The most likely evolution is the
introduction of per-jurisdiction retention windows (e.g., 5 years in the EU, 7
years in the US, 10 years in India) if regulatory changes require it. The
evolution would require per-tenant retention configuration (the rejected
alternative in this ADR), which would be revisited if the regulatory landscape
changes. A second possible evolution is the move to S3 Glacier Instant Retrieval
for frequently-accessed archives (e.g., legal-hold recoveries), which would
reduce retrieval latency from 12 hours to milliseconds at a higher storage cost.
A third possible evolution is the introduction of automated legal-hold detection
(e.g., flagging rows involved in support tickets for legal hold), but no current
PreOne use case requires this.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (parent engine decision)
● ADR-043 - Tenant Isolation (retention is tenant-scoped)
● ADR-046 - Academic Year Isolation (yearly partition drop for academic
records)
● ADR-047 - Soft Delete (soft-deleted rows are retained for the full
retention window)
● ADR-051 - Partition Strategy (monthly partition drop for audit_log and
event_log)
● ADR-054 - Archive Policy (S3 Glacier archive before partition drop)
● ADR-055 - Backup Strategy (backups are retained separately from the
retention policy)
● ADR-056 - Restore Strategy (restore from S3 Glacier for legally-held
rows)
REFERENCES
● FERPA - Family Educational Rights and Privacy Act, Record Retention.
U.S. Department of Education. 2024.
● GDPR - General Data Protection Regulation, Article 17 (Right to
Erasure). European Union. 2018.
● CCPA - California Consumer Privacy Act, Deletion Rights. State of
California. 2020.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 184

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● AWS S3 Glacier Documentation - Archive Classes and Retrieval.
Amazon Web Services. 2024.
● PreOne Data Retention Policy - Internal. 2025.
DECISION HISTORY
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Office of the Chief Architect |     |
| ----------- | --- | ----------------------------- | --- |
| Tech Lead   |     | Data Platform Lead            |     |
| ARB Chair   |     | Architecture Review Board     |     |
| Approved On |     | 2025-10-15                    |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Retention policy per data category documented (Done)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  185

PreOne ADR - Volume 3: Data Architecture v3.0
● Daily retention-enforcement job deployed (Done)
● Archive-to-S3 pipeline validated (Done)
● Purge audit log deployed (Done)
● Quarterly retention compliance audit (Scheduled)
AD R -054
Archive Policy
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a tiered archive policy that moves records older than the active
retention window from PostgreSQL hot storage to S3 Standard (90-day
transition), then to S3 Glacier Instant Retrieval (1-year transition), then to
Glacier Deep Archive (7-year transition), and finally deletes them after the
regulatory retention period expires. Archive is a managed background job,
not a manual operation.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on RPO/RTO
target change, or on regulatory
update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne accumulates data at a rate of approximately 50GB per month across all
tenants, dominated by academic records, assessment responses, attendance
logs, and audit trails. PostgreSQL hot storage on Aurora is expensive relative to
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 186

PreOne ADR - Volume 3: Data Architecture v3.0
object storage, and query performance on records older than the current
academic year is poor due to index bloat. At the same time, regulatory regimes
(GDPR, COPPA, DPDP) require records to be retained for varying periods: 7
years for academic records, 3 years for marketing consent, until-consent-
withdrawal for PII. A clear archive policy is needed to balance cost,
performance, and compliance. The current approach of keeping everything in
PostgreSQL indefinitely is unsustainable. Aurora storage costs grow linearly
with data accumulation and the largest tables (assessment_response,
attendance_record, audit_log) are projected to exceed 2TB by end of 2026.
Query latency on these tables has begun to degrade for year-over-year reports.
A tiered archive policy allows hot data to remain performant while cold data is
moved to cheaper storage with appropriate retrieval semantics. Archive is
distinct from backup (ADR-055). Backup is for disaster recovery; archive is for
regulatory retention and historical analytics. Backup retention is short (30
days); archive retention is long (7+ years). Backup data is in proprietary
format; archive data is in open format (Parquet on S3) for long-term readability.
BUSINESS DRIVERS
The primary business driver is cost reduction. Aurora storage costs
approximately $0.10/GB-month; S3 Glacier Deep Archive costs $0.00099/GB-
month - a 100x reduction. At projected growth, the archive policy will save
approximately $200K annually in storage costs by 2027. Secondary drivers
include query performance (smaller hot tables = faster OLTP), compliance
posture (clear retention demonstrates regulatory good faith), and analytics
capability (Parquet archive supports long-range historical reporting).
PROBLEM STATEMENT
PreOne needs a clear archive policy that defines when data moves from hot
PostgreSQL storage to cold S3 storage, what format it is stored in, how it can be
retrieved, and when it is permanently deleted - all while satisfying regulatory
retention requirements across multiple jurisdictions.
CONSTRAINTS
● GDPR Article 5(1)(e) requires personal data to be kept no longer than
necessary.
● Indian DPDP Act requires reasonable retention period for personal
data.
● COPPA requires parental consent deletion within 10 business days of
request.
● Academic records must be retained for 7 years per institutional
accreditation requirements.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 187

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● Archive retrieval latency must be acceptable for compliance audit
support (SLA: 4 hours).
● Archive format must be open and self-describing for long-term
readability.
ASSUMPTIONS
● Aurora PostgreSQL remains the hot storage through 2030.
● S3 Glacier Deep Archive remains available and price-stable through
2030.
● Parquet with Snappy compression remains a supported open format.
● Regulatory retention periods do not increase beyond current 7-year
maximum.
● Tenant data isolation is preserved end-to-end (PostgreSQL -> S3 prefix
-> Glacier vault).
OPTIONS CONSIDERED
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
Tiered S3 archive  Cost-optimized at  Multiple tiers add  Adopted
| (Standard ->     | every tier.         | operational         |          |
| ---------------- | ------------------- | ------------------- | -------- |
| Glacier IR ->    | Lifecycle rules     | complexity.         |          |
| Glacier Deep     | automated by S3.    | Retrieval latency   |          |
| Archive).        | Open format         | varies by tier (ms  |          |
|                  | (Parquet).          | to hours).          |          |
| Single-tier S3   | Simpler model -     | 10x more            | Rejected |
| Glacier Instant  | one tier, one       | expensive than      |          |
| Retrieval.       | retrieval latency.  | Deep Archive for    |          |
|                  | Lower operational   | the bulk of cold    |          |
|                  | complexity.         | data. Doesn't       |          |
differentiate
between rarely-
accessed and
never-accessed.
| Aurora cold      | Stays in           | 5x more expensive  | Rejected |
| ---------------- | ------------------ | ------------------ | -------- |
| storage cluster. | PostgreSQL - SQL   | than S3 Glacier.   |          |
|                  | access preserved.  | Doesn't solve the  |          |
|                  | No format          | index bloat        |          |
|                  | conversion.        | problem. Vendor    |          |
lock-in.
| Third-party        | Turnkey solution  | Significant        | Rejected |
| ------------------ | ----------------- | ------------------ | -------- |
| archive service    | with compliance   | licensing cost.    |          |
| (e.g., Commvault). | certifications.   | Vendor lock-in.    |          |
|                    | Managed           | Less control over  |          |
|                    | retrieval.        | data residency.    |          |
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  188

PreOne ADR - Volume 3: Data Architecture v3.0
DECISION
ADOPTED
We will adopt a tiered S3 archive policy with three transitions: (1)
PostgreSQL to S3 Standard (Parquet format) after the active retention
window (1 academic year for transactional data, 90 days for audit logs); (2)
S3 Standard to S3 Glacier Instant Retrieval after 1 year; (3) S3 Glacier IR to
S3 Glacier Deep Archive after 3 years; (4) Permanent deletion after 7 years
(or per-regulatory requirement). Archive is performed by a managed
background job (Spring Batch) that exports data to Parquet, validates
checksums, and deletes from PostgreSQL only after S3 verification.
DETAILED RATIONALE
The tiered approach matches access patterns to storage costs. Hot data
(current academic year) is queried frequently and lives in PostgreSQL. Warm
data (1-3 years old) is queried occasionally for year-over-year analysis and lives
in S3 Standard where retrieval is millisecond. Cold data (3-7 years old) is
queried rarely, only for compliance audits, and lives in S3 Glacier Deep Archive
where retrieval takes hours but costs 100x less. This is the standard pattern
recommended by AWS for S3 lifecycle management. The choice of Parquet as
the archive format is critical for long-term readability. Parquet is an open
columnar format with strong compression (typically 3-4x with Snappy) and is
supported by every major analytics tool (Athena, Spark, DuckDB, Trino). If
PreOne ever needs to migrate off AWS or change analytics tools, the archive
remains readable. Proprietary formats would create lock-in that becomes
painful at year 5+. The deletion-after-7-years rule is the maximum across all
regulatory regimes we operate under. Some data categories have shorter
retention (e.g., marketing consent is 3 years post-withdrawal); these are
archived with shorter deletion triggers and tracked in a retention metadata
table. The system never deletes data without an explicit retention policy match;
deletion is logged in the audit trail (ADR-086). The 4-hour retrieval SLA for
compliance audits is achievable via S3 Glacier Instant Retrieval (1-3 year tier)
which has millisecond latency, and S3 Glacier Deep Archive (3-7 year tier)
which has 12-hour standard retrieval. For expedited retrieval (1-5 minutes), the
higher cost is justified only by audit deadlines and is approved case-by-case.
The most likely counter-argument is that tiered archive adds operational
complexity - engineers must now think about where data lives when querying.
We address this by exposing a unified query API that abstracts the storage tier:
queries against archived data automatically fan out to Athena for S3-resident
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 189

PreOne ADR - Volume 3: Data Architecture v3.0
data, with results joined back to PostgreSQL where needed. Engineers write
SQL; the system handles routing.
ARCHITECTURE DIAGRAM
+----------------+ 1 academic +----------------+ 1 year +------------------+ |
PostgreSQL | year / 90d | S3 Standard | -> | S3 Glacier IR | |
Aurora (hot) | --------------> | (Parquet) | --------> | (1-3 yr cold) | +----------------
+ +----------------+ +------------------+
| | 3 years
v +--------------------------------+
| S3 Glacier Deep Archive | | (3-7 yr
freezing cold) |
+--------------------------------+ |
| 7 years v
+--------------------------------+ | PERMANENT
DELETION | | (with audit log
entry) | +--------------------------------+
Tenant isolation: S3 prefix
/tenant/{tenant_id}/archive/{table}/year={YYYY}/part-NNNN.parquet Retention
metadata: archive_retention table tracks each archive object's delete-after
timestamp
SEQUENCE DIAGRAM
Spring Batch Job -> PostgreSQL: SELECT records WHERE created_at < cutoff
PostgreSQL -> Spring Batch: Returns rows in batches of 10K Spring Batch ->
Parquet Writer: Writes /tenant/{tid}/archive/{tbl}/year={YYYY}/part-
NNNN.parquet Parquet Writer -> S3: PUT object with checksum S3 -> Spring
Batch: Returns ETag (MD5) Spring Batch -> PostgreSQL: INSERT INTO
archive_manifest (tenant, table, year, s3_key, etag, row_count) Spring Batch ->
PostgreSQL: DELETE FROM source WHERE id IN (batch) Spring Batch -> Audit
Log: LOG archive_complete (tenant, table, rows, s3_key) Note over Audit Log:
Deletion only after S3 verification Compliance Audit Query -> Unified Query
API: SELECT * FROM assessment_response WHERE created_at = '2022-01-15'
Unified Query API -> Archive Manifest: Find matching archive objects Archive
Manifest -> S3 Glacier: Restore object (if Deep Archive) S3 Glacier -> S3
Standard: Restore complete (1-12 hours) S3 Standard -> Athena: SELECT query
Athena -> Unified Query API: Returns rows Unified Query API -> Compliance
Audit Query: Result set
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-054 — Archive Policy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Retention | scan | Tables
in scope | | | | Scheduler |------->| (with retention tag) | | | |
(daily) | +----------+-----------+ | | +----------------+ |
| | | rows past TTL | | v
| | +--------+----------+ | | | Archive Writer
| | | | (to S3 + Glacier) | | | +--------
+----------+ | | | | |
| after archive | | v | |
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 190

PreOne ADR - Volume 3: Data Architecture v3.0
+--------+----------+ | | | Purge Job | | |
| (DELETE / DETACH) | | | +-------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Archive Flow: Scheduler (weekly) -> identify cold data (older than threshold)
Archive Writer -> SELECT cold data -> write to S3 (Parquet) S3 -> versioned
bucket -> lifecycle to Glacier Deep Archive Verify Job -> compare row counts
(S3 vs source) Purge Job -> DELETE source rows after verification Restore
Flow: Operator -> request archive restore (with justification) Restore Job ->
S3 select -> Parquet -> temp table Operator -> review -> promote to live table
DATABASE IMPACT
Archive reduces PostgreSQL storage growth by approximately 70% within 18
months of adoption. The largest tables (assessment_response,
attendance_record, audit_log) shrink to current-academic-year size, improving
query performance for OLTP workloads by an estimated 30-40%. A new
archive_manifest table is added to track archive objects: (tenant_id,
source_table, year_partition, s3_key, etag, row_count, archived_at,
delete_after). This table itself is small (~1 row per 10K archived rows) and does
not require partitioning. A daily vacuum analyze is recommended after archive
jobs complete to update planner statistics.
API IMPACT
A new /api/v1/archive endpoint is added for admin and compliance use: GET
/archive/manifest?tenant=X&table=Y returns the list of archive objects for a
tenant-table combination. GET /archive/restore?s3_key=K triggers a restore
from Glacier (async, returns job_id). GET /archive/query?sql=S executes a
read-only Athena query against archived data, scoped to the caller's tenant. All
endpoints require admin or compliance-officer role (RBAC: ADR-064). The
unified query API transparently routes between PostgreSQL and Athena based
on the time range in the WHERE clause.
UI IMPACT
The archive policy surfaces in the admin UI as an 'Archived Data' section.
Admins can search archived records via a dedicated search page (which
queries S3 via Athena), view archived entity details, and request a restore
(which copies the archived record back to a temp table for review). Restored
records appear with an 'Archived' badge in the UI to distinguish them from live
records. End users do not see archived data — the archive is read-only and
admin-access-only. The archive search UI was built with a date-range picker
and a category filter to narrow the search scope.
SECURITY IMPACT
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 191

PreOne ADR - Volume 3: Data Architecture v3.0
Archive objects are encrypted at rest using SSE-KMS with a per-tenant data key
(envelope encryption per ADR-077). S3 bucket policy denies all access except
the archive IAM role; no direct console access is permitted. Archive manifest
entries include tenant_id which is enforced at query time (row-level security).
Deletion is a two-step process: a retention-policy match is verified, then a
deletion job runs with separate IAM permissions. All archive operations (read,
restore, delete) are logged in the audit trail (ADR-086) with tenant, actor,
object, and timestamp.
PERFORMANCE IMPACT
Archive improves hot-path performance by shrinking the working set. The
largest tables see 30-40% query latency improvement for OLTP workloads. The
archive job itself runs nightly and is throttled to consume at most 20% of Aurora
read capacity, ensuring no impact on production traffic. Cold-path queries via
Athena are slower than PostgreSQL (seconds vs milliseconds) but acceptable
for compliance audit use cases which run infrequently. Parquet's columnar
format enables efficient predicate pushdown, so Athena queries that filter on
tenant_id and created_at are typically 2-5 seconds for 10M-row scans.
SCALABILITY ANALYSIS
The archive policy scales with data volume. At 50GB/month input, the system
generates 600GB/year of archive. S3 has effectively unlimited capacity. Athena
scales horizontally for archive queries. The main scaling concern is the nightly
archive job duration: at 50GB/month, the nightly job processes ~2GB and
completes in under 30 minutes. At 500GB/month (10x growth), the nightly job
would process ~20GB and complete in under 5 hours - still within the nightly
window. Beyond that, we would shard the archive job by tenant and run in
parallel.
OPERATIONAL CONSIDERATIONS
Operations team owns the archive job schedule and monitoring. The job runs
nightly at 02:00 UTC (low-traffic window) with a 4-hour SLA. Alerts fire on: job
failure, archive duration > 4 hours, S3 PUT errors, archive_manifest
inconsistency (count mismatch between PostgreSQL and S3). A weekly
reconciliation job verifies that every archive_manifest entry has a
corresponding S3 object and that row counts match. Quarterly DR drill tests
archive restoration from Glacier to verify the recovery path works end-to-end.
RISKS
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 192

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation            |
| ------------------- | ---------- | ------ | --------------------- |
| Archive job fails   | Medium     | Low    | Job is idempotent:    |
| mid-batch, leaving  |            |        | re-running picks      |
| some records        |            |        | up where it left off  |
| archived and        |            |        | using                 |
| others not.         |            |        | archive_manifest.     |
Transactions
ensure partial
archives are not
committed until
S3 PUT is verified.
| Glacier Deep       | Low | High | Expedited            |
| ------------------ | --- | ---- | -------------------- |
| Archive retrieval  |     |      | retrieval (1-5 min)  |
| takes longer than  |     |      | available at higher  |
| SLA during a       |     |      | cost. Compliance     |
| compliance audit.  |     |      | team has standing    |
approval to use
expedited for
audit deadlines.
| Parquet schema    | Medium | Medium | Each Parquet file  |
| ----------------- | ------ | ------ | ------------------ |
| drift over years  |        |        | embeds its         |
| makes old         |        |        | schema. Reader     |
| archives          |        |        | uses schema        |
| unreadable.       |        |        | evolution rules.   |
Annual schema
compatibility
review.
| Tenant data leaks  | Low | High | Per-tenant S3       |
| ------------------ | --- | ---- | ------------------- |
| across tenant      |     |      | prefix. IAM policy  |
| boundaries in      |     |      | enforces tenant     |
| archive.           |     |      | scoping. Athena     |
queries include
tenant_id filter.
Quarterly tenant
isolation test.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
70% reduction in PostgreSQL storage  Cold-path queries are slower (seconds
| cost over 18 months. |     | vs milliseconds). |     |
| -------------------- | --- | ----------------- | --- |
Hot-path query performance improves  Operational complexity increases
| 30-40%. |     | (archive job, manifest, reconciliation). |     |
| ------- | --- | ---------------------------------------- | --- |
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  193

PreOne ADR - Volume 3: Data Architecture v3.0
We Gain We Lose
Clear regulatory retention posture with Some data takes hours to retrieve for
auditable deletion. compliance audits.
Open format (Parquet) avoids vendor Engineers must understand the storage
lock-in. tier abstraction.
REJECTED ALTERNATIVES
Single-tier S3 Glacier IR was rejected because it doesn't differentiate between
rarely-accessed and never-accessed data, leaving significant cost savings on
the table. Aurora cold storage cluster was rejected because it doesn't solve the
index bloat problem (cold data still inflates indexes) and is 5x more expensive
than S3 Glacier. Third-party archive services were rejected because they
introduce vendor lock-in, licensing cost, and reduce control over data residency
- all of which conflict with PreOne's multi-tenant regulated posture.
MIGRATION PLAN
Migration is phased over 6 months. Phase 1 (month 1-2): build the archive job,
archive_manifest table, and S3 infrastructure. Archive the oldest 10% of data as
a pilot. Phase 2 (month 3-4): archive data older than 2 years across all tables.
Phase 3 (month 5-6): archive data older than 1 academic year for transactional
tables, 90 days for audit logs. Rollback plan: if archive causes issues, halt the
nightly job; existing data remains in PostgreSQL. Already-archived data can be
restored from S3 to PostgreSQL via the restore endpoint.
TESTING STRATEGY
The archive job is tested at three levels. Unit tests verify the Parquet writer,
checksum verification, and manifest updates. Integration tests with
Testcontainers verify end-to-end archive + restore on a small dataset.
Performance tests verify the job completes within SLA at 10x expected volume.
Tenant isolation tests verify a tenant cannot access another tenant's archive.
Quarterly DR drill verifies restore from Glacier Deep Archive works end-to-end.
MONITORING & OBSERVABILITY
Metrics: archive_job_duration_seconds (target < 4h),
archive_rows_processed_total, archive_s3_put_errors_total,
archive_manifest_inconsistency_count. Dashboards: archive status by tenant
and table, storage cost trend (PostgreSQL vs S3), retrieval latency. Alerts:
archive job failure, manifest inconsistency > 0, S3 PUT error rate > 1%. Audit
trail logs every archive operation with tenant, actor, object, and timestamp.
FUTURE EVOLUTION
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 194

PreOne ADR - Volume 3: Data Architecture v3.0
The archive policy should be revisited if: (a) data growth exceeds
500GB/month, requiring sharded archive jobs; (b) regulatory retention periods
increase beyond 7 years; (c) cold-path query latency becomes unacceptable,
requiring a faster cold tier (e.g., Athena on S3 Standard instead of Glacier IR);
(d) a new analytics use case requires frequent archive access, justifying a hot-
cache layer. The likely successor is a continuous archive model (streaming to
S3 via Kinesis Firehose) rather than nightly batch.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (hot storage for active data)
● ADR-047 - Soft Delete (archive is distinct from soft delete)
● ADR-053 - Data Retention (defines retention periods this policy
enforces)
● ADR-055 - Backup Strategy (archive is distinct from backup)
● ADR-077 - Encryption (envelope encryption for archive objects)
● ADR-079 - PII Protection (PII in archive is encrypted with per-tenant
key)
● ADR-086 - Audit Trail (all archive operations logged)
● ADR-087 - Compliance Logging (compliance audit retrieves from
archive)
REFERENCES
● AWS S3 Lifecycle Configuration. Amazon Web Services. 2024.
● Apache Parquet Format Specification. Apache Software Foundation.
2023.
● GDPR Article 5(1)(e) - Storage Limitation. European Union. 2018.
● Indian Digital Personal Data Protection Act. Government of India. 2023.
● PreOne Engineering Handbook, Section 3.14 - Archive Policy. Internal.
2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-16 Draft Data Platform Initial draft;
Lead options
enumerated;
consultation with
engineering team
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 195

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Date       | Status   | Actor          | Notes         |
| ---------- | -------- | -------------- | ------------- |
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Data Platform Architect   |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Data Platform Lead        |     |
| ARB Chair   |     | Architecture Review Board |     |
| Approved On |     | 2025-10-15                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Archive-to-S3 (Parquet) pipeline deployed (Done)
● Glacier Deep Archive lifecycle configured (Done)
● Archive search UI (via Athena) deployed (Done)
● Restore-request workflow documented (Done)
● Quarterly archive integrity check (Scheduled)
AD R -055
Backup Strategy
Volume 3 — Data Architecture  -  Data Architecture
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  196

PreOne ADR - Volume 3: Data Architecture v3.0
ACCEPTED
DECISION SUMMARY
DECISION
Adopt AWS Aurora PostgreSQL automated backups with Point-in-Time
Recovery (PITR) for up to 35 days, plus daily snapshot copies to a cross-
region S3 bucket in the DR region for 90-day retention. Backups are
encrypted, automated, and tested quarterly via restore drills. This is
distinct from archive (ADR-054) which handles long-term retention.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on RPO/RTO
target change, or on regulatory
update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne's data is its most valuable asset. Loss of academic records, assessment
responses, or audit trails would be catastrophic for tenant institutions and a
regulatory failure. The platform runs on AWS Aurora PostgreSQL across
multiple Availability Zones for high availability, but AZ-level redundancy is
insufficient against region-level failures, ransomware, or accidental deletion. A
robust backup strategy with clearly defined RPO (Recovery Point Objective)
and RTO (Recovery Time Objective) is required. The current state is AWS
Aurora's default automated backup with 7-day retention and 5-minute PITR.
This is insufficient for several reasons: (1) 7-day retention does not cover the
case of a slow-onset data corruption discovered after a week; (2) no cross-
region copy means a region outage would lose all data; (3) backups have never
been tested, so recovery is theoretical. This ADR defines the backup strategy:
what is backed up, how often, where copies are stored, how long they are
retained, and how recovery is tested. It works in concert with ADR-054 (Archive
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 197

PreOne ADR - Volume 3: Data Architecture v3.0
Policy) for long-term retention and ADR-056 (Restore Strategy) for recovery
procedures.
BUSINESS DRIVERS
The primary business driver is risk reduction. A data loss event would result in
regulatory fines (up to 4% of global revenue under GDPR), customer churn, and
reputational damage. The cost of a robust backup strategy (~$5K/month in
AWS backup storage) is trivial compared to the cost of a single data loss
incident. Secondary drivers include compliance (multiple regulations require
demonstrable backup capability) and customer trust (enterprises require
backup SLAs in their contracts).
PROBLEM STATEMENT
PreOne needs a backup strategy that defines RPO, RTO, retention period,
geographic redundancy, encryption, and testing cadence for all production
data, with documented evidence that the strategy works in practice.
CONSTRAINTS
● RPO must not exceed 15 minutes (max 15 min of data loss acceptable).
● RTO must not exceed 4 hours (max 4 hr to restore production service).
● Backups must be encrypted at rest with KMS-managed keys.
● Cross-region backup copy must be in a different AWS region (pilot-light
DR).
● Backup retention must comply with all regulatory regimes (max 90
days for routine backups).
● Restore drills must not impact production.
ASSUMPTIONS
● AWS Aurora PITR remains available with 5-minute granularity.
● Cross-region snapshot copy remains supported and price-stable.
● AWS KMS remains available for key management.
● Production data volume stays under 5TB through 2027.
● Network bandwidth between primary and DR region is sufficient for
daily snapshot copy.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 198

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option              | Pros               | Cons                | Verdict |
| ------------------- | ------------------ | ------------------- | ------- |
| Aurora automated    | Native AWS         | Aurora-specific -   | Adopted |
| backups (PITR) +    | service. No        | locks us in. Cross- |         |
| daily cross-region  | custom code. PITR  | region copy has     |         |
| snapshot copy.      | gives 5-min RPO.   | transfer cost.      |         |
Cross-region copy
gives geographic
redundancy.
| pg_dump nightly    | Open tool.       | No PITR (RPO =      | Rejected |
| ------------------ | ---------------- | ------------------- | -------- |
| + S3 cross-region  | Portable across  | 24 hours). Restore  |          |
| copy.              | PostgreSQL       | is slow (hours to   |          |
|                    | providers. Full  | days for large      |          |
|                    | control over     | DBs). Requires      |          |
|                    | format.          | custom              |          |
orchestration.
| Third-party     | Turnkey.         | Licensing cost     | Rejected |
| --------------- | ---------------- | ------------------ | -------- |
| backup service  | Compliance       | ($20K+/year).      |          |
| (e.g., Veeam,   | certifications.  | Doesn't integrate  |          |
| Rubrik).        | Multi-cloud      | with Aurora PITR.  |          |
|                 | support.         | Vendor lock-in.    |          |
| AWS Backup      | Centralized      | Doesn't add        | Rejected |
| service         | backup           | capability beyond  |          |
| (centralized).  | management       | Aurora native for  |          |
|                 | across AWS       | PostgreSQL. Adds   |          |
|                 | resources.       | an abstraction     |          |
|                 | Compliance       | layer.             |          |
reporting built-in.
DECISION
ADOPTED
We will adopt AWS Aurora PostgreSQL automated backups with 35-day
PITR retention, plus daily snapshot copies to the DR region (ap-south-1)
with 90-day retention. Backups are encrypted with KMS-managed keys. The
combined approach gives us 5-minute RPO (Aurora PITR) for the last 35
days, and daily snapshots for the last 90 days for slower-onset data loss
scenarios. Cross-region copy protects against region-level failure. Quarterly
restore drills verify the recovery path works.
DETAILED RATIONALE
Aurora PITR is the gold standard for PostgreSQL backup because it provides
continuous backup with 5-minute RPO and point-in-time restore to any second
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  199

PreOne ADR - Volume 3: Data Architecture v3.0
within the retention window. The 35-day retention is 5x the default 7-day
window, giving us coverage for slow-onset data corruptions (e.g., a bug that
silently corrupts records over weeks). The cross-region snapshot copy provides
geographic redundancy: if the primary region (ap-south-1) becomes
unavailable, we can restore from the DR region (ap-south-1 -> ap-southeast-1)
within the 4-hour RTO. The choice of 90-day retention for cross-region
snapshots is calibrated to balance storage cost and recovery window. Beyond
90 days, the archive policy (ADR-054) takes over for long-term retention in S3
Glacier. Snapshots older than 90 days are deleted automatically; archive
objects in Glacier cover the regulatory retention requirement. The quarterly
restore drill is the most important element. Untested backups are theoretical.
The drill restores the latest snapshot to a dedicated restore-test cluster, runs
data integrity checks, and verifies the restore time meets the RTO. Drill results
are documented and reviewed by the Architecture Review Board. Any drill
failure triggers an incident response. The most likely counter-argument is that
35-day PITR is excessive. We considered 14-day PITR but found real-world
cases (e.g., a billing bug discovered after 21 days) where 14 days was
insufficient. The cost difference between 14-day and 35-day PITR is
approximately $500/month - acceptable for the additional recovery window.
Backup encryption with KMS-managed keys is mandatory for compliance. The
KMS key is rotated annually per ADR-077. Backups in the DR region use a
separate KMS key so that compromise of the primary region's KMS does not
compromise DR-region backups.
ARCHITECTURE DIAGRAM
Primary Region (ap-south-1) DR Region (ap-southeast-1)
+-----------------------------+ +-----------------------------+ | Aurora PostgreSQL
Cluster | | (no Aurora cluster - | | - Writer instance |
| pilot-light only) | | - 2 Readers | | | |
| | | | Continuous backup to S3 | | S3
Bucket: preone-dr-backup| | (Aurora managed, encrypted)| | - Daily
snapshot copies | | - 5-min PITR | | - 90-day retention | |
- 35-day retention | | - KMS-encrypted (DR key) |
+-----------------------------+ +-----------------------------+ |
| | Daily snapshot copy (AWS DataSync) |
+---------------------------------------------->+ |
v +---------------------------+
| Quarterly Restore Drill | | - Restore to test cluster
| | - Verify integrity |
| - Measure RTO | +---------------------------+
SEQUENCE DIAGRAM
Aurora Cluster -> Aurora Backup: Continuous WAL streaming (every 5 min)
Aurora Backup -> S3 (primary): Stores encrypted backup blocks Note over S3
(primary): 35-day PITR window Daily Cron (02:00 UTC) -> Aurora API:
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 200

PreOne ADR - Volume 3: Data Architecture v3.0
CreateClusterSnapshot Aurora API -> Snapshot: Creates snapshot Snapshot ->
AWS DataSync: Copy to DR region AWS DataSync -> S3 (DR): PUT encrypted
snapshot Note over S3 (DR): 90-day retention Quarterly Drill -> Restore Test
Cluster: Restore from latest snapshot Restore Test Cluster -> Integrity Check:
Run SQL validation Integrity Check -> Drill Report: Document RTO + integrity
Drill Report -> ARB: Quarterly review Production Failure -> On-Call: Page on-
call engineer On-Call -> Runbook: Open ADR-056 runbook Runbook -> Aurora
API: Restore to point-in-time Aurora API -> New Cluster: Provision from backup
New Cluster -> Application: Promote to writer Note over Application: Target
RTO: 4 hours
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-055 — Backup Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | RDS Primary | stream | WAL
Archive | | | | |------->| (continuous, 5 min) | | |
+----------------+ +----------+-----------+ | | |
| | | sync | | v
| | +--------+----------+ | | | S3 (cross-
region) | | | | bucket (versioned)| | |
+--------+----------+ | | | | |
| lifecycle | | v | |
+--------+----------+ | | | Glacier Deep | | |
| Archive (90d+) | | | +-------------------+ | |
| | Snapshot Job: daily full, hourly incremental |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Continuous Backup Flow: RDS Primary -> WAL stream (continuous) WAL
stream -> S3 (cross-region, every 5 min) S3 -> versioned bucket (lifecycle:
Glacier after 90d) Snapshot Flow: Snapshot Job (daily 03:00) -> RDS snapshot
Snapshot -> S3 (incremental, cross-region copy) Verification Flow: Restore
Test Job (monthly) -> restore to test cluster Verify Job -> run integrity queries
-> compare to prod Report -> backup health scorecard
DATABASE IMPACT
Backup has minimal direct database impact. Aurora PITR runs continuously in
the background and does not affect production performance. Daily snapshot
creation completes within 10 minutes for the current data volume. Cross-region
snapshot copy runs in the background and does not affect production. The
restore-test cluster provisioned for quarterly drills is a separate Aurora cluster
that is torn down after the drill; it does not affect production capacity.
API IMPACT
Backup has no API impact. Backup and restore are infrastructure-level
operations, not application-level. The application does not need to be aware of
backup state. The only API impact is during restore: the application must
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 201

PreOne ADR - Volume 3: Data Architecture v3.0
support a brief downtime (up to 4 hours RTO) while the database is restored.
This is documented in the runbook (ADR-056).
UI IMPACT
Backup strategy has no UI surface — it is pure infrastructure. The admin UI
gained a 'Backup Health' dashboard (SRE-access-only) showing the last
snapshot time, WAL archive lag, cross-region replication status, and the most
recent restore-test result. The dashboard surfaces red/yellow/green status
indicators and links to the runbook for each failure mode. No end-user UI
changes were required; backups are invisible to users except in the rare DR
scenario, where the impact is a service-outage notification rather than a UI
element.
SECURITY IMPACT
Backups are encrypted at rest using SSE-KMS with the PreOne backup KMS
key. The KMS key policy restricts decryption to the backup-service IAM role
and the restore-service IAM role. Cross-region copies use a separate DR-region
KMS key, so compromise of the primary region's KMS does not compromise DR
backups. Backup access is logged in CloudTrail and alertable. Ransomware
protection: backups are immutable (AWS Backup Vault Lock) for the retention
period, preventing deletion even by an admin role.
PERFORMANCE IMPACT
Backup has negligible performance impact on production. Aurora PITR is
asynchronous and does not add write latency. Daily snapshots complete in
under 10 minutes and run during low-traffic windows. Cross-region copy runs
in the background. Restore-test cluster runs in isolation and does not compete
for resources with production.
SCALABILITY ANALYSIS
Backup strategy scales with data volume. At current 50GB/month growth, the
35-day PITR window holds approximately 50GB of incremental backup. Daily
snapshots are full copies (approximately 500MB compressed for the current
200GB database). Cross-region copy of 500MB takes under 5 minutes via AWS
DataSync. At 10x growth (5TB database), daily snapshots would be ~12GB
compressed; cross-region copy would take ~10 minutes - still well within the
backup window. Aurora's parallel restore capability keeps restore time
sublinear with data volume.
OPERATIONAL CONSIDERATIONS
Operations team owns backup monitoring and restore drills. Daily alerts verify
that the snapshot was created successfully and copied to DR. Weekly metrics
review covers backup duration, snapshot size growth, and DR region sync lag.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 202

PreOne ADR  -  Volume 3: Data Architecture  v3.0
Quarterly restore drill is a calendar event with documented runbook, expected
RTO, and post-drill review. Annual review of retention periods confirms
alignment with regulatory requirements.
RISKS
| Risk                 | Likelihood | Impact | Mitigation         |
| -------------------- | ---------- | ------ | ------------------ |
| Ransomware           | Low        | High   | AWS Backup Vault   |
| encrypts             |            |        | Lock makes         |
| production data      |            |        | backups            |
| and tries to delete  |            |        | immutable for      |
| backups.             |            |        | retention period.  |
KMS key policy
prevents deletion.
CloudTrail alerts
on backup
deletion attempts.
| Cross-region copy  | Medium | High | Daily alert verifies  |
| ------------------ | ------ | ---- | --------------------- |
| fails silently,    |        |      | DR snapshot           |
| leaving DR region  |        |      | exists and is < 24    |
| without recent     |        |      | hours old. Weekly     |
| backup.            |        |      | reconciliation        |
compares
snapshot count
between regions.
| Restore drill fails  | Medium | High | Drill failure   |
| -------------------- | ------ | ---- | --------------- |
| due to schema        |        |      | triggers Sev-2  |
| incompatibility or   |        |      | incident. Root  |
| data corruption.     |        |      | cause analysis  |
within 48 hours.
Fix verified in next
drill before
declaring backup
healthy.
| KMS key             | Low | High | DR region uses     |
| ------------------- | --- | ---- | ------------------ |
| compromise          |     |      | separate KMS key.  |
| allows attacker to  |     |      | Annual key         |
| decrypt backups.    |     |      | rotation per       |
ADR-077. KMS
key access logged
in CloudTrail with
anomaly
detection.
TRADE-OFFS
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  203

PreOne ADR - Volume 3: Data Architecture v3.0
We Gain We Lose
5-minute RPO and 4-hour RTO with ~$5K/month backup storage cost.
tested recovery.
Geographic redundancy protects Cross-region data transfer cost
against region failure. (~$50/month).
35-day PITR covers slow-onset data Higher storage cost than 7-day default.
corruption.
Immutable backups protect against Cannot delete backups early even if
ransomware. needed.
REJECTED ALTERNATIVES
pg_dump nightly was rejected because it lacks PITR (RPO would be 24 hours,
5x our target) and restore is slow for large databases. Third-party backup
services (Veeam, Rubrik) were rejected because they don't integrate with
Aurora PITR, add licensing cost, and don't provide additional capability over
native AWS services. AWS Backup service was rejected because it's an
abstraction layer over Aurora native backups without adding capability - the
only benefit (centralized reporting) is achievable via CloudTrail and
CloudWatch dashboards.
MIGRATION PLAN
Migration is a single-day cutover. Day 1: enable 35-day PITR retention on
Aurora cluster (was 7-day). Day 1: configure daily snapshot copy to DR region.
Day 1: configure CloudWatch alerts. Day 2: verify first daily snapshot was
created and copied. Day 7: schedule first quarterly restore drill. No data
migration is needed; existing 7-day PITR data is preserved and the retention
window is simply extended.
TESTING STRATEGY
Backup is tested at three levels. Daily automated test verifies that the previous
day's snapshot exists and is encrypted. Weekly automated test verifies that the
DR region snapshot exists and is < 24 hours old. Quarterly manual restore drill
provisions a restore-test cluster, restores the latest snapshot, runs data
integrity checks (row counts, schema validation, sample queries), measures
restore time, and documents results. Drill failure triggers Sev-2 incident and
root cause analysis.
MONITORING & OBSERVABILITY
Metrics: backup_pitr_lag_seconds (target < 300), backup_snapshot_age_hours
(target < 24), backup_dr_region_sync_lag_hours (target < 24),
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 204

PreOne ADR - Volume 3: Data Architecture v3.0
backup_restore_drill_duration_minutes (target < 240). Dashboards: backup
status (last snapshot, PITR window, DR sync), restore drill history. Alerts:
snapshot missing > 24 hours, DR sync lag > 24 hours, restore drill failure, KMS
key deletion attempt. CloudTrail alerts on any backup deletion operation.
FUTURE EVOLUTION
The backup strategy should be revisited if: (a) data volume exceeds 5TB,
requiring parallel restore testing; (b) RTO requirement tightens below 4 hours,
requiring warm standby in DR region; (c) regulatory changes require longer
retention; (d) multi-region active-active deployment changes the backup model.
The likely successor is continuous backup to S3 with restore-from-S3
capability, eliminating Aurora-specific backup dependency.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (database being backed up)
● ADR-053 - Data Retention (retention periods this strategy aligns with)
● ADR-054 - Archive Policy (long-term retention, distinct from backup)
● ADR-056 - Restore Strategy (recovery procedures)
● ADR-077 - Encryption (KMS-encrypted backups)
● ADR-124 - Disaster Recovery (DR region pilot-light)
● ADR-125 - High Availability (AZ-level redundancy complements backup)
● ADR-086 - Audit Trail (backup operations logged)
REFERENCES
● AWS Aurora PostgreSQL Backup and Restore. Amazon Web Services.
2024.
● AWS Backup Vault Lock Documentation. Amazon Web Services. 2024.
● NIST SP 800-34 - Contingency Planning Guide. NIST. 2010.
● GDPR Article 32 - Security of Processing. European Union. 2018.
● PreOne Engineering Handbook, Section 3.15 - Backup Strategy.
Internal. 2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-16 Draft Data Platform Initial draft;
Lead options
enumerated;
consultation with
engineering team
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 205

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Date       | Status   | Actor          | Notes         |
| ---------- | -------- | -------------- | ------------- |
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Data Platform Architect   |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Data Platform Lead        |     |
| ARB Chair   |     | Architecture Review Board |     |
| Approved On |     | 2025-10-15                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Continuous WAL archiving to S3 (5-min RPO) (Done)
● Daily snapshot with cross-region copy (Done)
● Monthly restore-test drill scheduled (Done)
● Backup health dashboard deployed (Done)
● Annual DR rehearsal with full failover (Next: 2026-Q4)
AD R -056
Restore Strategy
Volume 3 — Data Architecture  -  Data Architecture
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  206

PreOne ADR - Volume 3: Data Architecture v3.0
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a documented restore strategy with two paths: (1) Point-in-Time
Recovery for recent data loss (within 35 days) - restores to a new Aurora
cluster and promotes it; (2) Cross-region snapshot restore for region-level
failure - restores from DR region snapshot to a new region. RTO is 4 hours.
Quarterly restore drills verify both paths. Restore is a runbook-driven
operation executed by on-call engineers.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on RPO/RTO
target change, or on regulatory
update
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
Backup is only valuable if restore works. ADR-055 defines what is backed up;
this ADR defines how to restore. Restore has two distinct scenarios: (1) recent
data loss (e.g., accidental DROP TABLE, application bug corrupting data)
where the primary region is intact but the data needs to be rolled back; (2)
region-level failure (e.g., AWS region outage) where the primary region is
unavailable and recovery must happen in a different region. The two scenarios
have different procedures, RTO targets, and tooling. Scenario 1 uses Aurora
PITR to restore to a new cluster in the same region, then promotes the new
cluster to writer. Scenario 2 uses cross-region snapshot restore to provision a
new cluster in the DR region, then redirects the application. Both scenarios
require coordinated application-level action (traffic cutover, connection string
update, cache invalidation). Untested restore is theoretical. This ADR
mandates quarterly restore drills that exercise both scenarios end-to-end. Drill
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 207

PreOne ADR - Volume 3: Data Architecture v3.0
results document actual RTO, identify bottlenecks, and drive runbook
improvements. A drill that exceeds 4-hour RTO triggers a Sev-2 incident and
root cause analysis.
BUSINESS DRIVERS
The primary business driver is risk reduction. A data loss or region outage
without a tested restore procedure would result in extended downtime,
regulatory fines, and customer churn. The cost of restore drills (~10 engineer-
hours per quarter) is trivial compared to the cost of an untested restore failing
during a real incident. Secondary drivers include compliance (regulators
require evidence of restore capability) and customer contracts (enterprises
require restore SLAs).
PROBLEM STATEMENT
PreOne needs a documented, tested restore strategy that defines the
procedures, roles, RTO targets, and verification steps for both recent data loss
and region-level failure scenarios, with quarterly evidence that the strategy
works in practice.
CONSTRAINTS
● RTO must not exceed 4 hours for either scenario.
● RPO must not exceed 15 minutes (PITR scenario) or 24 hours (cross-
region snapshot scenario).
● Restore must not destroy original data (restore to new cluster, not in-
place).
● Restore drill must not impact production traffic.
● Restore must preserve tenant isolation and encryption.
● Application must support graceful cutover to restored database.
ASSUMPTIONS
● AWS Aurora PITR and cross-region snapshot restore remain available.
● On-call engineer has IAM permissions to perform restore operations.
● Application supports connection string update without restart.
● DR region has sufficient capacity to host production load.
● Network bandwidth supports cross-region restore within RTO.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 208

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option            | Pros                | Cons           | Verdict |
| ----------------- | ------------------- | -------------- | ------- |
| Documented        | Tested. Both        | Requires       | Adopted |
| runbook +         | scenarios covered.  | engineering    |         |
| quarterly drill,  | Clear ownership.    | investment in  |         |
| both restore      |                     | drills.        |         |
paths.
Automated restore  Faster restore.  Significant build  Rejected
| orchestration   | Less human error.  | cost. Automation  |     |
| --------------- | ------------------ | ----------------- | --- |
| (Lambda + Step  | Repeatable.        | bugs are hard to  |     |
| Functions).     |                    | detect without    |     |
drills. Less flexible
for edge cases.
| Manual restore  | Lowest cost. No  | Untested. First       | Rejected |
| --------------- | ---------------- | --------------------- | -------- |
| on-demand, no   | engineering      | real incident is the  |          |
| drills.         | investment.      | test. High risk.      |          |
Warm standby in  Lowest RTO (~15  2x database cost.  Rejected
| DR region     | min). Always-on  | Complex      |     |
| ------------- | ---------------- | ------------ | --- |
| (continuous   | DR.              | replication  |     |
| replication). |                  | management.  |     |
Overkill for
current scale.
DECISION
ADOPTED
We will adopt a documented restore strategy with two paths, both backed
by runbooks and tested quarterly. Scenario 1 (PITR, recent data loss):
restore to a new Aurora cluster in the same region using Aurora PITR API,
verify data integrity, promote new cluster to writer, update application
connection string. Target RTO 2 hours. Scenario 2 (cross-region restore,
region failure): restore from DR region snapshot to a new Aurora cluster in
DR region, verify data integrity, redirect application traffic to DR region.
Target RTO 4 hours. Both scenarios are runbook-driven, executed by on-call
engineers, and tested quarterly.
DETAILED RATIONALE
Manual runbook-driven restore was chosen over automated orchestration
because restore is a high-stakes, low-frequency operation where human
judgment matters. Automation is brittle for edge cases (e.g., partial data
corruption, schema mismatch, KMS key rotation in progress) where a human
can adapt. The runbook documents the standard path, and the engineer on call
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  209

PreOne ADR - Volume 3: Data Architecture v3.0
has authority to deviate when warranted. Quarterly drills verify the runbook
works and the engineer on call has hands-on experience. The choice of 2-hour
RTO for PITR scenario (vs 4-hour overall target) is calibrated to leave buffer for
the cross-region scenario which has more steps. PITR restore is fast (Aurora
provisions a new cluster from backup in 15-30 minutes for our data size); the
remaining 90 minutes is for verification, application cutover, and unexpected
issues. Cross-region restore adds snapshot copy time (10-30 minutes) and
region-failover configuration (60-90 minutes), justifying the 4-hour target. The
warm standby option was rejected because it doubles database cost
($15K/month additional) for a scenario that may never occur. The current 4-
hour RTO is acceptable for PreOne's SLA commitments. If customer contracts
tighten to require <1-hour RTO, warm standby becomes justified. The most
important element of this ADR is the drill requirement. An untested restore is a
theoretical restore. The quarterly drill exercises both scenarios end-to-end:
PITR to a test cluster, cross-region snapshot to a DR test cluster, data integrity
verification, RTO measurement. Drill results are documented, reviewed by
ARB, and drive runbook improvements. A drill that exceeds RTO is a Sev-2
incident. Application-level support for restore is critical. The application must
support connection string update without restart (Spring Boot's HikariCP
supports this via configuration refresh). Cache must be invalidated on cutover
to prevent serving stale data. Background jobs must be paused during cutover
and resumed after verification. These requirements are encoded in the
application runbook and tested in drills.
ARCHITECTURE DIAGRAM
SCENARIO 1: Recent Data Loss (PITR) +-------------------+ +-----------------------+
+-----------------------+ | Production Aurora | | New Aurora Cluster | |
Application | | (compromised) | | (restored from PITR) | |
| +-------------------+ +-----------------------+ +-----------------------+ |
^ | | 1. Identify loss time | | | 2.
Call RestoreDBCluster | | | ToPointInTime API |
| +----------------------------+ | | |
| | 3. Wait 15-30 min | | | 4. Verify integrity
| | | 5. Promote to writer | | |
+------------------------------+ | | 6. Update connection string |
| | 7. Invalidate cache | | | 8. Resume
background jobs | +----------------------------+------------------------------+
v RTO: 2 hours SCENARIO 2: Region Failure (Cross-Region
Snapshot) +-------------------+ +------------------------+ +-----------------------+ |
Primary Region | | DR Region | | Application | |
(DOWN) | | (ap-southeast-1) | | (redirected to DR) | |
Aurora: DOWN | | S3: snapshots exist | | |
+-------------------+ +------------------------+ +-----------------------+
| 1. Restore from snapshot | to new Aurora cluster
| 2. Wait 30-60 min | 3. Verify integrity
| 4. Update Route53 to DR | 5. Application reconnects
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 210

PreOne ADR - Volume 3: Data Architecture v3.0
+----------------------------------->+ |
v RTO: 4 hours
SEQUENCE DIAGRAM
On-Call Engineer -> Runbook: Open ADR-056 restore runbook On-Call Engineer
-> Aurora API: RestoreDBClusterToPointInTime (restore_time) Aurora API ->
New Cluster: Provision from PITR (15-30 min) New Cluster -> Available: Cluster
status = available On-Call Engineer -> Integrity Script: Run row count + schema
validation Integrity Script -> On-Call Engineer: Verification passed On-Call
Engineer -> Application Config: Update connection string Application Config ->
App Pods: Refresh HikariCP pool (no restart) App Pods -> New Cluster:
Connections established On-Call Engineer -> Cache: Flush Redis (invalidate stale
data) On-Call Engineer -> Job Scheduler: Resume background jobs On-Call
Engineer -> Monitoring: Verify traffic serving correctly On-Call Engineer ->
Incident Report: Document RTO, issues, lessons Quarterly Drill -> Test Cluster:
Restore to test (not production) Test Cluster -> Integrity Script: Run validation
Integrity Script -> Drill Report: Document RTO, integrity Drill Report -> ARB:
Quarterly review
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-056 — Restore Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Operator | pick | Restore
Orchestrator | | | | (runbook) |------->| (point-in-time) | | |
+----------------+ +----------+-----------+ | | |
| | | selects | | v
| | +-------------+ +-------------+ +-------------+ | | | Snapshot | | WAL archive |
| Cross-region| | | | (daily) | | (5-min RPO) | | replica | | |
+-------------+ +-------------+ +-------------+ | | |
| | | promotes | | v
| | +--------+----------+ | | | New RDS
Primary | | | | (DNS cutover) | | |
+-------------------+ | +-------------------------------------------------------------+
DATA FLOW DIAGRAM
PITR Flow (Point-in-Time Recovery): Operator -> select target timestamp
(within retention window) Restore Orchestrator -> new RDS cluster from
snapshot Restore Orchestrator -> replay WAL up to target timestamp Verify
Job -> run integrity queries DNS Cutover -> app traffic to new primary
Failover Flow (DR): Monitor detects primary failure -> promote cross-region
replica Route53 -> DNS update -> app traffic to new region Post-incident ->
root cause + restore original region
DATABASE IMPACT
Restore creates a new Aurora cluster with the same schema and data as the
source. The new cluster is independent and does not affect the original (until
promotion). Restore does not modify the source database. After cutover, the
original cluster is decommissioned. PITR restore preserves all data including
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 211

PreOne ADR - Volume 3: Data Architecture v3.0
indexes, constraints, and extensions. Cross-region snapshot restore preserves
all data but may have a longer RPO (up to 24 hours, the snapshot cadence).
API IMPACT
Restore has no direct API impact, but the application must support graceful
cutover. Application requirements: (1) connection pool refresh on config
change (HikariCP); (2) cache invalidation on cutover signal; (3) background job
pause/resume; (4) health check endpoint that verifies database connectivity.
These are tested in quarterly drills.
UI IMPACT
Restore strategy has no direct UI surface — it is operational infrastructure.
During a restore operation, the UI displays a maintenance page ('Service
temporarily unavailable — restoring from backup, ETA: X minutes') served by
the static-site failover. The admin UI includes a 'Restore Drill' page (SRE-
access-only) for scheduling monthly restore tests; the page shows the test
schedule, the last test result, and the restore-time-metric (RTM) trend. End
users see only the maintenance page during a real restore; no other UI
elements are involved.
SECURITY IMPACT
Restore preserves all security controls: encryption at rest (KMS), row-level
security policies, tenant isolation, audit trail. The restored cluster uses the
same KMS key as the source (PITR) or the DR-region KMS key (cross-region).
On cutover, IAM policies are updated to grant application roles access to the
new cluster. Audit trail continues logging to the new cluster without
interruption.
PERFORMANCE IMPACT
Restore itself has no performance impact on production (new cluster is
isolated). After cutover, the new cluster may have slightly different
performance characteristics until cache warms (5-15 minutes of elevated
latency). Application health checks detect this and the load balancer drains
traffic until cache is warm. Database statistics are auto-updated by Aurora after
restore; manual ANALYZE is run after cutover to optimize query plans.
SCALABILITY ANALYSIS
Restore time scales sublinearly with data volume. Aurora parallel restore
provisions multiple nodes that restore data in parallel. At current 200GB
database, PITR restore takes 15-30 minutes. At 5TB (25x), restore would take
60-90 minutes - still within the 2-hour target. Cross-region snapshot restore
adds snapshot copy time which scales linearly with data volume; at 5TB, copy
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 212

PreOne ADR  -  Volume 3: Data Architecture  v3.0
would take 30-60 minutes, still within the 4-hour target. Beyond 5TB, parallel
snapshot restore becomes necessary.
OPERATIONAL CONSIDERATIONS
On-call engineers are trained on restore procedures quarterly. The runbook is
versioned in the architecture repository and updated after each drill. Drill
results feed into runbook improvements. Restore requires IAM permissions for
Aurora API, KMS decrypt, S3 read (for snapshot), and Route53 update (for
cross-region). These permissions are scoped to the on-call role and rotated
quarterly. Restore operations are logged in CloudTrail and the audit trail.
RISKS
| Risk            | Likelihood | Impact | Mitigation      |
| --------------- | ---------- | ------ | --------------- |
| Restore drill   | Medium     | Medium | Drill failure   |
| exceeds 4-hour  |            |        | triggers Sev-2  |
| RTO.            |            |        | incident. Root  |
cause analysis
within 48 hours.
Bottleneck
identified and
addressed before
next drill.
| Cross-region       | Low | High | DR region uses  |
| ------------------ | --- | ---- | --------------- |
| restore fails due  |     |      | dedicated KMS   |
| to KMS key         |     |      | key with        |
| incompatibility.   |     |      | documented key  |
policy. Key access
tested in every
drill.
| Application does    | Medium | High | Application        |
| ------------------- | ------ | ---- | ------------------ |
| not gracefully cut  |        |      | cutover tested in  |
| over to restored    |        |      | every drill.       |
| database.           |        |      | Connection pool    |
refresh, cache
invalidation, and
job pause/resume
verified end-to-
end.
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  213

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk               | Likelihood | Impact | Mitigation         |
| ------------------ | ---------- | ------ | ------------------ |
| On-call engineer   | Medium     | High   | All on-call        |
| lacks training to  |            |        | engineers          |
| execute restore    |            |        | participate in     |
| correctly.         |            |        | quarterly drills.  |
Runbook is step-
by-step with
verification
checks. Pair-
restore for first
incident.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Tested restore capability with  Quarterly drill investment (~10
| documented RTO. |     | engineer-hours). |     |
| --------------- | --- | ---------------- | --- |
Manual runbook allows judgment for  Slower than fully automated restore.
edge cases.
Two paths cover both common failure  Two runbooks to maintain and drill.
modes.
4-hour RTO is achievable at current  May need warm standby if SLA tightens
| scale. |     | to <1 hour. |     |
| ------ | --- | ----------- | --- |
REJECTED ALTERNATIVES
Automated restore orchestration was rejected because restore is high-stakes
and low-frequency, where human judgment matters more than speed. The build
cost of robust automation (~3 engineer-months) was not justified. Warm
standby was rejected because it doubles database cost for a scenario that may
never occur. Manual restore without drills was rejected because untested
restore is theoretical - the first real incident would be the test, which is
unacceptable for a regulated platform.
MIGRATION PLAN
Migration is a single-day activity. Day 1: publish the runbook for both scenarios.
Day 1: identify on-call engineers and schedule training. Day 1: schedule first
quarterly drill. Week 2: conduct first drill, document results, refine runbook. No
data migration or infrastructure changes are needed; the restore procedures
use existing backup infrastructure (ADR-055).
TESTING STRATEGY
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  214

PreOne ADR - Volume 3: Data Architecture v3.0
Restore is tested via quarterly drills. Each drill exercises both scenarios end-to-
end: PITR restore to test cluster, cross-region snapshot restore to DR test
cluster, data integrity verification, RTO measurement, application cutover
(where applicable). Drill results are documented in a standard template:
scenario, start time, end time, RTO, issues encountered, runbook changes
needed. Drill failure triggers Sev-2 incident. Annual third-party audit reviews
drill history.
MONITORING & OBSERVABILITY
Restore operations are monitored via CloudTrail (API calls), CloudWatch
(cluster metrics), and the audit trail (data-level operations). During a real
restore, the on-call engineer posts updates to the incident channel every 30
minutes. Restore drill metrics: drill_duration_minutes, drill_rto_achieved,
drill_issues_encountered, drill_runbook_changes. Dashboards: drill history,
restore success rate, RTO trend over time. Alerts: drill failure, drill RTO
exceeded, restore operation failure in production.
FUTURE EVOLUTION
The restore strategy should be revisited if: (a) RTO requirement tightens below
1 hour, requiring warm standby; (b) data volume exceeds 5TB, requiring
parallel restore; (c) multi-region active-active deployment changes the restore
model; (d) automated orchestration tooling matures to the point where it's
more reliable than manual execution. The likely successor is partially-
automated restore with human approval gates, combining the speed of
automation with the judgment of human oversight.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (database being restored)
● ADR-055 - Backup Strategy (provides the backups being restored)
● ADR-054 - Archive Policy (long-term retention, distinct from restore)
● ADR-124 - Disaster Recovery (DR region pilot-light, used in scenario 2)
● ADR-125 - High Availability (AZ-level redundancy, complements
restore)
● ADR-077 - Encryption (KMS-encrypted restore)
● ADR-086 - Audit Trail (restore operations logged)
● ADR-089 - Incident Response (restore may be triggered by incident)
REFERENCES
● AWS Aurora PostgreSQL Restore. Amazon Web Services. 2024.
● NIST SP 800-34 - Contingency Planning Guide. NIST. 2010.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 215

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● PreOne Engineering Handbook, Section 3.16 - Restore Strategy.
Internal. 2025.
● PreOne On-Call Runbook, Section 5 - Database Restore. Internal. 2025.
● AWS Well-Architected Framework - Reliability Pillar. Amazon Web
Services. 2024.
DECISION HISTORY
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Data Platform Architect   |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Data Platform Lead        |     |
| ARB Chair   |     | Architecture Review Board |     |
| Approved On |     | 2025-10-15                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  216

PreOne ADR - Volume 3: Data Architecture v3.0
● PITR runbook documented and tested (Done)
● Cross-region failover playbook rehearsed (Done)
● Restore Orchestrator tool deployed (Done)
● Maintenance-page failover validated (Done)
● Quarterly restore-time drill (Next: 2026-Q4)
AD R -057
Migration Strategy
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt Flyway as the database migration tool with versioned migrations
(V{YYYYMMDDHHmm}__description.sql), repeatable migrations
(R__description.sql) for views and procedures, and Java-based callbacks for
pre/post-migration hooks. Migrations are forward-only with backward-
compatible schema changes; destructive changes require a two-release
deprecation cycle. Zero-downtime migrations are mandatory for
production.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Per-release review during migration
window; annual editorial review
thereafter
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 217

PreOne ADR - Volume 3: Data Architecture v3.0
Database schema evolution is one of the most error-prone activities in software
development. A bad migration can corrupt data, take down production, and
require painful manual recovery. PreOne has grown to 200+ tables across 12
bounded contexts, with multiple teams making schema changes weekly.
Without a disciplined migration strategy, the schema would drift, migrations
would conflict, and production deployments would be risky. The current
approach is ad-hoc SQL scripts checked into the repository and run manually by
developers. This has led to several issues: (1) migrations run out of order on
different environments; (2) there's no record of which migrations have been
applied; (3) rollback is manual and unreliable; (4) zero-downtime is not
enforced. A formal migration tool with versioned, atomic, and idempotent
migrations is needed. This ADR defines the migration strategy: tool choice,
naming convention, versioning scheme, rollback policy, zero-downtime
requirements, and review process. It works in concert with ADR-018
(Deployment Model) for migration execution during deployment.
BUSINESS DRIVERS
The primary business driver is deployment safety. A bad migration can take
down production for hours; the cost of a single incident exceeds the
engineering investment in a proper migration tool. Secondary drivers include
developer velocity (predictable migrations are faster to ship), compliance
(auditable schema changes), and multi-team coordination (no silent schema
drift).
PROBLEM STATEMENT
PreOne needs a database migration strategy that ensures schema changes are
versioned, ordered, atomic, idempotent, zero-downtime, and reversible - with
clear ownership and review process to prevent bad migrations from reaching
production.
CONSTRAINTS
● Migrations must be zero-downtime for production deployments.
● Migrations must be forward-only (no destructive changes in a single
step).
● Migrations must be idempotent (re-runnable without error).
● Migrations must be atomic (all-or-nothing within a single transaction).
● Migrations must be reviewed by a database engineer before
production.
● Migration tool must support PostgreSQL 16 specific features (JSONB,
partitioning, etc.).
ASSUMPTIONS
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 218

PreOne ADR  -  Volume 3: Data Architecture  v3.0
● Flyway remains actively maintained and PostgreSQL-compatible.
● Schema changes follow the backward-compatible pattern (add column,
add table, etc.).
● Application code is deployed before destructive schema changes.
● Production migrations run during low-traffic windows (02:00-04:00
UTC).
● Developers test migrations locally before submitting for review.
OPTIONS CONSIDERED
| Option       | Pros                | Cons                | Verdict |
| ------------ | ------------------- | ------------------- | ------- |
| Flyway with  | Industry standard.  | No built-in         | Adopted |
| versioned +  | Strong              | rollback (forward-  |         |
| repeatable   | PostgreSQL          | only). Community    |         |
| migrations.  | support.            | edition lacks some  |         |
|              | Versioned +         | features.           |         |
repeatable. Java
callbacks for
hooks. Mature.
| Liquibase with  | Database-            | XML changesets     | Rejected |
| --------------- | -------------------- | ------------------ | -------- |
| XML/YAML        | agnostic. Built-in   | are verbose. Less  |          |
| changesets.     | rollback. Diff tool. | PostgreSQL-        |          |
specific. Steeper
learning curve.
Custom migration  Full control. Can  Significant build  Rejected
| runner (in-house). | implement exact  | cost. Maintenance  |     |
| ------------------ | ---------------- | ------------------ | --- |
|                    | requirements.    | burden. Less       |     |
battle-tested than
Flyway.
Atlas (declarative  Declarative -  Newer tool, less  Rejected
| schema       | schema as code.  | battle-tested.     |     |
| ------------ | ---------------- | ------------------ | --- |
| management). | Diff-based       | Declarative model  |     |
|              | migrations.      | is unfamiliar to   |     |
|              | Modern tool.     | most engineers.    |     |
DECISION
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  219

PreOne ADR - Volume 3: Data Architecture v3.0
ADOPTED
We will adopt Flyway as the database migration tool. Migrations follow the
naming convention V{YYYYMMDDHHmm}__{snake_case_description}.sql
for versioned migrations and R__{snake_case_description}.sql for
repeatable migrations (views, procedures, functions). Migrations are
forward-only; destructive changes (drop column, drop table) require a two-
release deprecation cycle: release N marks the column deprecated, release
N+1 drops it. All migrations must be zero-downtime: add column as
nullable, backfill asynchronously, deploy application, then add NOT NULL
constraint in a follow-up migration. Migrations run automatically during
application startup via Flyway's Spring Boot integration.
DETAILED RATIONALE
Flyway was chosen over Liquibase primarily for its simplicity and PostgreSQL
focus. Flyway migrations are plain SQL files - developers write the exact SQL
that will run, with full access to PostgreSQL-specific features (JSONB
operators, partitioning, generated columns, etc.). Liquibase's XML abstraction
hides PostgreSQL specifics and adds verbosity without clear benefit. Atlas's
declarative model is appealing but requires a paradigm shift that the team is
not ready for; the imperative model (write the migration SQL) is more familiar
and easier to review. The forward-only policy is the most important decision.
Backward-compatible migrations (add column, add table, add index
CONCURRENTLY) are safe to run at any time. Destructive migrations (drop
column, drop table, rename column) are dangerous because the previous
application version may still expect the old schema. The two-release
deprecation cycle ensures that the application is fully updated to not use the
deprecated element before it's removed. Zero-downtime is enforced via the
expand-contract pattern. Expand: add the new schema element (nullable
column, new table, new index CONCURRENTLY). Migrate: backfill data
asynchronously, deploy application code that uses the new schema. Contract:
remove the old schema element in a follow-up release. This pattern is well-
documented and proven at scale. The most likely counter-argument is that two-
release deprecation is slow. We accept this cost because the alternative (big-
bang migrations) is riskier and has caused incidents at peer companies.
Velocity is not valuable if it comes with deployment risk. The naming
convention V{YYYYMMDDHHmm}__description.sql provides several benefits:
(1) migrations sort chronologically; (2) timestamp prevents numbering conflicts
when multiple teams create migrations on the same day; (3) description
provides human-readable context. The minute-level granularity ensures
uniqueness even for parallel work. Flyway's Spring Boot integration runs
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 220

PreOne ADR - Volume 3: Data Architecture v3.0
migrations automatically on application startup. This ensures the schema is
always in sync with the application code. Migrations are wrapped in
transactions (PostgreSQL DDL is transactional), so a failed migration leaves the
schema unchanged. The flyway_schema_history table records applied
migrations and provides an audit trail.
ARCHITECTURE DIAGRAM
Migration Lifecycle (Expand-Contract Pattern): RELEASE N (Expand):
+-------------------+ +----------------------+ +----------------------+ | Migration V1: |
| Application Code: | | Database: | | ALTER TABLE users | |
Reads old + new col | | old_col + new_col | | ADD new_col ... | |
Writes both | | both populated | +-------------------+
+----------------------+ +----------------------+ | |
| | Deploy migration | Deploy app code | | (zero-
downtime) | (zero-downtime) | v v
v RELEASE N+1 (Backfill): +-------------------+ +----------------------+
+----------------------+ | Async job: | | Application: | | Database:
| | UPDATE users | | Reads new_col only | | new_col fully | | SET
new_col = old | | (old_col unused) | | populated | +-------------------
+ +----------------------+ +----------------------+ RELEASE N+2 (Contract):
+-------------------+ +----------------------+ +----------------------+ | Migration V2: |
| Application: | | Database: | | ALTER TABLE users | | Does
not reference | | old_col dropped | | DROP old_col | | old_col
| | | +-------------------+ +----------------------+ +----------------------
+ Flyway History Table: +----+-------------+----------------------+---------------------+---------+
| id | version | description | installed_on | success | +----+-------------
+----------------------+---------------------+---------+ | 1 | 20251015102 | add users.new_col
| 2025-10-15 10:23:11 | true | | 2 | 20251020091 | backfill users async | 2025-
10-20 09:15:42 | true | | 3 | 20251101082 | drop users.old_col | 2025-11-01
08:31:18 | true | +----+-------------+----------------------+---------------------+---------+
SEQUENCE DIAGRAM
Developer -> Local DB: Write V{timestamp}__description.sql Developer -> Local
DB: Run flyway:migrate (test locally) Developer -> Pull Request: Submit
migration + application code Pull Request -> Code Review: Database engineer
reviews Code Review -> Approval: Zero-downtime verified, naming OK Approval
-> Main Branch: Merge CI Pipeline -> Test DB: Run flyway:migrate (verify
applies cleanly) CI Pipeline -> Test DB: Run flyway:info (verify migration order)
CI Pipeline -> Application Tests: Run test suite against migrated schema CI
Pipeline -> Production Deploy: Build artifact with migration Production Deploy
-> Flyway: Application starts, Flyway runs migrate Flyway ->
flyway_schema_history: Check applied migrations Flyway -> PostgreSQL: BEGIN
TRANSACTION PostgreSQL -> PostgreSQL: Apply migration SQL PostgreSQL ->
Flyway: COMMIT (or ROLLBACK on error) Flyway -> flyway_schema_history:
INSERT successful migration record Flyway -> Application: Continue startup
Note over Production Deploy: Migration runs before app accepts traffic Note
over Production Deploy: Zero-downtime via expand-contract pattern
COMPONENT DIAGRAM
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 221

PreOne ADR - Volume 3: Data Architecture v3.0
+-------------------------------------------------------------+ | ADR-057 — Migration Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Flyway | apply |
Versioned Migrations | | | | Runner |------->| (V001__... Vnnn__..) | |
| +----------------+ +----------+-----------+ | | |
| | | executes | | v
| | +--------+----------+ | | | Postgres |
| | | (DDL + data fixups)| | | +--------
+----------+ | | | | |
| records | | v | |
+--------+----------+ | | | flyway_schema_ | | |
| history | | | +-------------------+ | |
| | Verify Job: post-migration schema + data integrity check |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Migration Application Flow: CI/CD -> Flyway migrate on deploy Flyway ->
read flyway_schema_history -> identify pending Flyway -> apply pending
migrations (V001__... Vnnn__..) Flyway -> record in flyway_schema_history
Verify Job -> schema introspection -> expected vs actual Rollback Flow:
Operator -> Flyway undo (if reversible migration) Or: restore from pre-
migration snapshot (last resort) Postmortem -> add rollback test to migration
suite
DATABASE IMPACT
Migrations directly modify the database schema. The flyway_schema_history
table is added to every database (one row per applied migration). Migrations
are transactional in PostgreSQL - DDL is rolled back on error. Long-running
migrations (e.g., CREATE INDEX without CONCURRENTLY) can block writes;
the migration review process catches these and requires CONCURRENTLY or
alternative approaches. Backfill migrations run in batches to avoid lock
contention.
API IMPACT
Migrations are designed to be API-compatible. The expand-contract pattern
ensures the API contract is preserved across migrations. A new column doesn't
break existing API responses (the column is added to the response in a
backward-compatible way). A removed column is removed from the API
response only after all clients have been updated to not depend on it. API
versioning (ADR-092) provides additional safety for breaking changes.
UI IMPACT
Migration strategy has no direct UI surface — schema migrations run
transparently during deploys. The admin UI gained a 'Migrations' page (DBA-
access-only) showing the current Flyway version, pending migrations, and the
migration history with apply timestamps. During a migration window, the UI
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 222

PreOne ADR - Volume 3: Data Architecture v3.0
displays a 'Maintenance in progress' banner for the affected feature area; users
cannot initiate write operations on the affected entities during the window
(typically <5 minutes). Read operations continue to work against the pre-
migration schema. After the migration completes, the banner clears
automatically.
SECURITY IMPACT
Migrations are reviewed by a database engineer before production, which
provides a security checkpoint. Migrations that add columns containing PII are
flagged for PII protection (ADR-079) review. Migrations that add indexes or
constraints that affect query performance are reviewed for performance
impact. Migration scripts are stored in the version control system with full
history, providing an audit trail of schema changes.
PERFORMANCE IMPACT
Migrations are designed to have minimal performance impact. CREATE INDEX
CONCURRENTLY (PostgreSQL-specific) builds indexes without blocking
writes. ALTER TABLE ... ADD COLUMN ... DEFAULT (PostgreSQL-specific)
adds columns instantly without rewriting the table. Long-running backfill
migrations run in batches (1000 rows per transaction) to avoid lock contention
and replication lag. Migration duration is monitored and alerted if it exceeds 5
minutes.
SCALABILITY ANALYSIS
Migrations scale with database size. CREATE INDEX CONCURRENTLY on a
200GB table takes approximately 30 minutes; on a 5TB table (25x), it would
take approximately 12 hours - still feasible in a maintenance window but
requires careful planning. Backfill migrations on large tables run in parallel
batches with rate limiting to avoid overwhelming the database. The expand-
contract pattern is essential at scale: a single big-bang migration would be
infeasible for tables with billions of rows.
OPERATIONAL CONSIDERATIONS
Database engineers are on-call for migration issues. Migration failures in
production trigger a Sev-2 incident and rollback procedure (revert application
to previous version, manual schema rollback if needed). Flyway's
flyway_schema_history table is the source of truth for applied migrations; any
manual intervention is logged. Quarterly migration review covers all
migrations applied in the quarter, identifies patterns and anti-patterns, and
updates the migration playbook.
RISKS
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 223

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk                | Likelihood | Impact | Mitigation         |
| ------------------- | ---------- | ------ | ------------------ |
| Migration fails in  | Low        | High   | Migrations are     |
| production,         |            |        | transactional in   |
| leaving schema in   |            |        | PostgreSQL.        |
| inconsistent state. |            |        | Failed migrations  |
roll back
automatically.
Flyway detects
and prevents
further migrations
until the failed
one is resolved.
| Long-running        | Medium | High | Migration review  |
| ------------------- | ------ | ---- | ----------------- |
| migration blocks    |        |      | requires          |
| production traffic. |        |      | CONCURRENTLY      |
for indexes and
batches for
backfills.
Migration
duration alert
fires at 5 minutes.
| Two-release        | Medium | Medium | Code review          |
| ------------------ | ------ | ------ | -------------------- |
| deprecation cycle  |        |        | enforces the cycle.  |
| is bypassed under  |        |        | Database engineer    |
| pressure.          |        |        | approval required    |
for destructive
migrations.
Emergency
override requires
Sev-1 incident
declaration.
| Migration naming  | Medium | Low | Timestamp         |
| ----------------- | ------ | --- | ----------------- |
| conflict between  |        |     | granularity       |
| parallel PRs.     |        |     | (minute) reduces  |
conflict. CI
pipeline catches
conflicts during
merge. Developer
resolves by
renaming
migration.
TRADE-OFFS
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  224

PreOne ADR - Volume 3: Data Architecture v3.0
We Gain We Lose
Versioned, auditable schema evolution. Migrations add overhead to every
schema change.
Zero-downtime via expand-contract Two-release deprecation cycle slows
pattern. some changes.
Plain SQL migrations use full No database portability (locked to
PostgreSQL features. PostgreSQL).
Forward-only model is simpler than Rollback requires manual SQL or
rollback. forward-fix migration.
REJECTED ALTERNATIVES
Liquibase was rejected because its XML abstraction hides PostgreSQL specifics
and adds verbosity without clear benefit. Custom migration runner was
rejected because of build and maintenance cost; Flyway is battle-tested and
meets all requirements. Atlas was rejected because the declarative paradigm is
unfamiliar to the team and the tool is newer with less community support. The
expand-contract pattern was chosen over big-bang migrations because it
enables zero-downtime, which is a hard requirement for PreOne's SaaS SLA.
MIGRATION PLAN
Migration to Flyway is itself a migration. Day 1: add Flyway dependency to all
services. Day 1: create baseline migration V{today}__baseline.sql that
captures the current schema (extracted via pg_dump --schema-only). Day 1:
configure Flyway to use baseline-on-migrate so existing databases are marked
as baselined. Day 2: deploy to staging, verify Flyway runs cleanly. Day 3: deploy
to production during low-traffic window. Subsequent schema changes use the
Flyway migration pattern.
TESTING STRATEGY
Migrations are tested at three levels. Unit tests verify migration SQL syntax
(postgres-migration-test-runner). Integration tests run migrations against a
Testcontainers PostgreSQL instance and verify the resulting schema.
Production-like tests run migrations against a clone of production data to verify
performance and correctness at scale. Migration review by a database engineer
is required before production deployment.
MONITORING & OBSERVABILITY
Metrics: migration_duration_seconds (target < 300), migration_failure_total,
flyway_pending_migrations_count (target 0 in steady state). Dashboards:
migration history, migration duration trend, pending migrations by service.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 225

PreOne ADR - Volume 3: Data Architecture v3.0
Alerts: migration failure in production, migration duration > 5 minutes,
pending migrations > 0 after deployment (indicates Flyway didn't run). Audit
trail logs every migration with version, description, duration, and outcome.
FUTURE EVOLUTION
The migration strategy should be revisited if: (a) data volume exceeds 5TB,
requiring parallel migration execution; (b) multi-region active-active
deployment requires coordinated schema changes; (c) declarative schema
management tools (Atlas) mature and the team is ready for the paradigm shift;
(d) zero-downtime requirement tightens to true online schema changes (e.g.,
pg-osc for online schema change). The likely successor is a hybrid approach:
Flyway for versioned migrations + Atlas for declarative drift detection.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (database being migrated)
● ADR-018 - Deployment Model (migrations run during deployment)
● ADR-019 - Versioning Policy (migration versioning aligns with app
versioning)
● ADR-013 - Project Structure (migration files location)
● ADR-017 - Build Pipeline (migrations verified in CI)
● ADR-152 - Code Review Standards (migration review process)
● ADR-049 - Optimistic Concurrency (version column managed via
migration)
● ADR-053 - Data Retention (retention-driven migrations)
REFERENCES
● Flyway Documentation. Redgate. 2024.
● PostgreSQL Concurrency Control. PostgreSQL Global Development
Group. 2024.
● Expand-Contract Pattern. Martin Fowler. 2016.
● PreOne Engineering Handbook, Section 3.17 - Migration Strategy.
Internal. 2025.
● PreOne Database Migration Playbook. Internal. 2025.
DECISION HISTORY
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 226

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Data Platform Architect   |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Data Platform Lead        |     |
| ARB Chair   |     | Architecture Review Board |     |
| Approved On |     | 2025-10-15                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Flyway adopted as migration tool (Done)
● Migration naming convention documented (Done)
● CI/CD pipeline runs Flyway on deploy (Done)
● Verify Job (post-migration integrity check) deployed (Done)
● Quarterly migration retrospective (Scheduled)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  227

PreOne ADR - Volume 3: Data Architecture v3.0
AD R -058
Seed Data Strategy
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a versioned seed data strategy with three categories: (1) reference
data (countries, currencies, academic templates) versioned in YAML files
and loaded via Flyway repeatable migrations; (2) per-environment seed
(demo tenants, sample users) loaded by Spring Boot's data.sql mechanism;
(3) tenant bootstrap data (created via API on tenant provisioning). All seed
data is idempotent and reviewable.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Per-release review during migration
window; annual editorial review
thereafter
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne requires seed data in three distinct scenarios. First, reference data
(countries, currencies, academic year templates, grade scales, subject
taxonomies) must be present in every environment for the application to
function. This data rarely changes and is part of the application's baseline.
Second, demo and test environments require sample tenants, users, and
academic data for development, QA, and sales demos. This data must be
loadable on-demand and resettable. Third, when a new tenant is provisioned,
default roles, permissions, and configuration must be created. The current
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 228

PreOne ADR - Volume 3: Data Architecture v3.0
approach is ad-hoc: developers manually insert reference data, demo
environments are populated by hand, and tenant bootstrap is handled in
application code without a clear pattern. This has led to inconsistent
environments, time-consuming setup, and bugs that only appear in production
because dev environments lack certain reference data. This ADR defines a
unified seed data strategy that handles all three scenarios with clear
ownership, idempotency, and reviewability. It works in concert with ADR-057
(Migration Strategy) for schema management and ADR-043 (Tenant Isolation)
for tenant bootstrap.
BUSINESS DRIVERS
The primary business driver is engineering velocity. Predictable, idempotent
seed data reduces environment setup time from hours to minutes. Secondary
drivers include demo reliability (sales demos depend on consistent seed data)
and tenant onboarding speed (new tenants provisioned in minutes, not hours).
PROBLEM STATEMENT
PreOne needs a seed data strategy that handles reference data, demo data, and
tenant bootstrap data with clear versioning, idempotency, environment-specific
loading, and review process - ensuring consistency across environments and
fast tenant onboarding.
CONSTRAINTS
● Seed data must be idempotent (re-runnable without error).
● Seed data must be versioned (changes tracked in version control).
● Reference data must be present in every environment before
application starts.
● Demo data must be loadable on-demand and resettable.
● Tenant bootstrap must complete within 60 seconds.
● Seed data must not contain real PII (use synthetic data only).
ASSUMPTIONS
● Reference data changes infrequently (quarterly at most).
● Demo environments are reset weekly.
● Tenant provisioning is triggered via API by the platform admin.
● Spring Boot's data.sql mechanism remains supported.
● YAML remains a readable format for reference data definition.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 229

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
Flyway repeatable  Leverages existing  Three mechanisms  Adopted
| migrations           | Flyway.           | to learn. Demo       |     |
| -------------------- | ----------------- | -------------------- | --- |
| (R__seed_*.sql) for  | Idempotent.       | data in data.sql is  |     |
| reference +          | Versioned. Clear  | harder to            |     |
| Spring data.sql for  | separation of     | maintain.            |     |
| demo + API for       | concerns.         |                      |     |
tenant bootstrap.
| Single               | Single             | Reference data     | Rejected |
| -------------------- | ------------------ | ------------------ | -------- |
| mechanism:           | mechanism. Java    | changes require    |          |
| Spring Boot          | code is more       | code changes.      |          |
| ApplicationRunner    | flexible than SQL. | Demo data runs     |          |
| that loads all seed  |                    | on every startup.  |          |
| data on startup.     |                    | Not idempotent     |          |
without significant
custom logic.
| Database seeding     | Purpose-built.   | Another tool to   | Rejected |
| -------------------- | ---------------- | ----------------- | -------- |
| tool (e.g., dbseed,  | Tooling support. | learn. Less       |          |
| sqitch).             |                  | integration with  |          |
Spring Boot.
| External seeding  | Decoupled from    | Over-engineered   | Rejected |
| ----------------- | ----------------- | ----------------- | -------- |
| service           | application. Can  | for the problem.  |          |
| (microservice).   | be triggered      | Adds operational  |          |
|                   | independently.    | complexity.       |          |
DECISION
ADOPTED
We will adopt a three-tier seed data strategy. (1) Reference data: defined in
YAML files under src/main/resources/db/reference-data/, loaded via Flyway
repeatable migrations (R__seed_reference_data.sql) that reads YAML and
inserts/updates via INSERT ON CONFLICT. This ensures reference data is
always present and up-to-date. (2) Demo data: defined in SQL files under
src/main/resources/db/demo-data/,   loaded   by   Spring   Boot's   data.sql
mechanism only in non-production profiles. Demo data is resettable via a
Spring Boot actuator endpoint. (3) Tenant bootstrap: implemented as a
Spring service invoked by the tenant provisioning API. Creates default
roles, permissions, admin user, and configuration for a new tenant. All seed
data is idempotent and uses synthetic PII.
DETAILED RATIONALE
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  230

PreOne ADR - Volume 3: Data Architecture v3.0
The three-tier approach matches the three distinct use cases. Reference data is
part of the application baseline and should be versioned with the application
code. Flyway's repeatable migrations (R__ prefix) re-run whenever the file
content changes, making them ideal for reference data updates. The YAML
format is human-readable and reviewable; the SQL migration that loads YAML
uses PostgreSQL's INSERT ON CONFLICT for idempotency. Demo data is
environment-specific and should not be loaded in production. Spring Boot's
data.sql mechanism (or @Sql annotation on test classes) provides a clean way
to load demo data only in non-production profiles. Demo data is more volatile
than reference data (new demo scenarios added regularly) and benefits from
the faster iteration cycle of SQL files. A Spring Boot actuator endpoint
(/actuator/demo-data/reset) clears and reloads demo data on demand. Tenant
bootstrap is the most complex because it involves creating a coherent set of
related entities (roles, permissions, admin user, default configuration) for a
specific tenant. This logic is best implemented as a Spring service
(TenantBootstrapService) that can be tested, reviewed, and evolved
independently. The service is invoked by the tenant provisioning API and runs
within a transaction to ensure atomicity. The most likely counter-argument is
that three mechanisms are too many. We considered a single mechanism
(ApplicationRunner) but found it unsuitable for reference data (changes
require code changes) and demo data (runs on every startup, even production).
The three-tier approach uses the right tool for each job. Idempotency is critical
for all three tiers. Reference data uses INSERT ON CONFLICT. Demo data uses
DELETE + INSERT (idempotent because it resets to a known state). Tenant
bootstrap uses INSERT ON CONFLICT (so retrying a failed bootstrap doesn't
create duplicates). Idempotency allows re-running seed data without manual
cleanup. Synthetic PII in demo data is mandatory for compliance. Demo
tenants use fake names (from a faker library), fake email addresses (e.g.,
demo.user.{n}@example.com), and fake phone numbers. Real PII in demo data
would be a compliance violation and a security risk if demo environments are
accessed by non-employees.
ARCHITECTURE DIAGRAM
Three-Tier Seed Data Strategy: TIER 1: REFERENCE DATA (every environment)
+---------------------------+ +----------------------+ +-----------------+ | YAML files
| | Flyway R__seed_*.sql | | Database | | src/main/resources/db/ |
---> | (repeatable) | ---> | reference tables| | reference-data/ | |
INSERT ON CONFLICT | | (countries, | | - countries.yaml | |
| | currencies, | | - currencies.yaml | | Runs on every Flyway |
| grade_scales, | | - grade_scales.yaml | | migrate if changed | |
etc.) | | - subject_taxonomy.yaml | | | | |
+---------------------------+ +----------------------+ +-----------------+ TIER 2: DEMO
DATA (non-production only) +---------------------------+ +----------------------+
+-----------------+ | SQL files | | Spring Boot data.sql | | Database
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 231

PreOne ADR - Volume 3: Data Architecture v3.0
| | src/main/resources/db/ | ---> | (@Profile !prod) | ---> | demo tenants, | |
demo-data/ | | | | users, courses, | | -
demo_tenant_001.sql | | Runs on startup in | | assessments | | -
demo_tenant_002.sql | | dev/staging only | | | | -
demo_users.sql | | | | | +---------------------------+
+----------------------+ +-----------------+ ^
| /actuator/demo-data/reset (on-demand reload) TIER 3:
TENANT BOOTSTRAP (on-demand via API) +---------------------------+
+----------------------+ +-----------------+ | Tenant Provisioning API | |
TenantBootstrapSvc | | Database | | POST /api/v1/tenants | ---> |
(Spring service) | ---> | new tenant: | | {name, plan, admin} | |
| | - roles | | | | Creates: roles, | | -
permissions | | | | permissions, admin | | - admin user
| | | | user, config | | - config |
+---------------------------+ +----------------------+ +-----------------+
| v INSERT ON CONFLICT
(idempotent) Within transaction (atomic)
SEQUENCE DIAGRAM
TIER 1: Reference Data Application Startup -> Flyway: migrate command Flyway
-> R__seed_reference_data.sql: Check checksum Note over Flyway: If checksum
changed, re-run R__seed_reference_data.sql -> Read YAML: Load countries.yaml
Read YAML -> R__seed_reference_data.sql: Parse to objects
R__seed_reference_data.sql -> PostgreSQL: INSERT INTO countries ... ON
CONFLICT (code) DO UPDATE PostgreSQL -> R__seed_reference_data.sql: Rows
inserted/updated Flyway -> flyway_schema_history: Update repeatable migration
record TIER 2: Demo Data (dev/staging only) Application Startup -> Spring
Boot: Check active profile Spring Boot -> data.sql: Profile is dev/staging, load
data.sql data.sql -> PostgreSQL: DELETE + INSERT demo data PostgreSQL ->
data.sql: Demo data loaded Note over data.sql: /actuator/demo-data/reset re-runs
on demand TIER 3: Tenant Bootstrap Platform Admin -> Tenant API: POST
/api/v1/tenants {name, plan, admin_email} Tenant API ->
TenantBootstrapService: bootstrap(newTenant) TenantBootstrapService ->
PostgreSQL: BEGIN TRANSACTION PostgreSQL -> TenantBootstrapService:
INSERT tenant PostgreSQL -> TenantBootstrapService: INSERT roles (admin,
teacher, student, parent) PostgreSQL -> TenantBootstrapService: INSERT
permissions (per role) PostgreSQL -> TenantBootstrapService: INSERT admin
user (with temp password) PostgreSQL -> TenantBootstrapService: INSERT
default configuration TenantBootstrapService -> PostgreSQL: COMMIT (or
ROLLBACK on error) TenantBootstrapService -> Tenant API: Bootstrap complete
(tenant_id, admin user_id) Tenant API -> Platform Admin: 201 Created with
tenant details
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-058 — Seed Data Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Environment | boot | Seed
Runner | | | | Bootstrap |------->| (idempotent) | | |
+----------------+ +----------+-----------+ | | |
| | | applies | | v
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 232

PreOne ADR - Volume 3: Data Architecture v3.0
| | +-------------+ +-------------+ +-------------+ | | | reference | | demo tenants|
| test users | | | | data | | (dev only) | | (dev only) | | |
+-------------+ +-------------+ +-------------+ | |
| | Guard: prod env blocks demo/test seed |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Boot Flow (dev/staging): Env Bootstrap -> Seed Runner -> apply reference data
Seed Runner -> apply demo tenants (dev only) Seed Runner -> apply test users
(dev only) Verify Job -> row counts match seed spec Boot Flow (prod): Env
Bootstrap -> Seed Runner -> apply reference data only Guard -> block
demo/test seed in prod (env check) Verify Job -> reference data present, no
demo data
DATABASE IMPACT
Reference data adds approximately 50 rows per reference table (countries:
250, currencies: 170, grade_scales: 20, etc.). Total reference data is under
1MB. Demo data is larger (10 demo tenants with 100 users each = ~10MB) but
only in non-production environments. Tenant bootstrap adds approximately 20
rows per new tenant (roles + permissions + admin user + config). The seed
data strategy does not require schema changes; it populates existing tables.
API IMPACT
Reference and demo data have no API impact (they populate existing tables).
Tenant bootstrap exposes a new API endpoint: POST /api/v1/tenants for tenant
provisioning. The endpoint is admin-only (RBAC: platform_admin role) and
returns the new tenant's ID and admin user's temporary credentials. The
endpoint is idempotent via an Idempotency-Key header (ADR-106).
UI IMPACT
Seed data affects the UI only in non-production environments. In dev and
staging, the UI auto-loads with demo tenants (e.g., 'Sunshine Preschool',
'Maple Leaf Academy') and test users (e.g., 'admin@demo.com') pre-populated;
the login page displays a 'Use demo credentials' shortcut that auto-fills the
login form. In production, the UI shows no demo data and the shortcut is
hidden. The seed strategy enables a one-click dev-environment bootstrap: a
new engineer clones the repo, runs `make seed`, and immediately has a
populated UI to explore. This has measurably reduced onboarding time from 2
days to 2 hours.
SECURITY IMPACT
Reference data is public (country codes, currency codes). Demo data uses
synthetic PII only - real PII is forbidden in demo environments. Tenant
bootstrap creates an admin user with a temporary password that must be
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 233

PreOne ADR  -  Volume 3: Data Architecture  v3.0
changed on first login (per ADR-075). The tenant provisioning API is admin-only
and audited. Bootstrap operations are logged in the audit trail (ADR-086).
PERFORMANCE IMPACT
Reference data loading is fast (under 1 second for all reference tables). Demo
data loading takes 5-10 seconds (10 tenants with related data). Tenant
bootstrap completes in 2-5 seconds (20 inserts within a transaction). None of
these have measurable impact on production performance. Reference data is
loaded during application startup, adding approximately 1 second to startup
time - acceptable for a Spring Boot application.
SCALABILITY ANALYSIS
Reference data is bounded and small. Demo data is bounded by the number of
demo tenants (capped at 20). Tenant bootstrap scales linearly with tenant
count - each bootstrap is independent and can run in parallel. At 1000 tenants,
the tenant table has 1000 rows plus 20 child rows each = 20,000 rows total -
well within PostgreSQL's capacity.
OPERATIONAL CONSIDERATIONS
Reference data changes are reviewed by a domain architect (changes to grade
scales, for example, have academic implications). Demo data is owned by the
engineering team and reset weekly via a cron job. Tenant bootstrap is owned by
the platform team and monitored for failures. Failed bootstraps are retried
automatically (idempotent) and alerted if they fail repeatedly.
RISKS
| Risk                | Likelihood | Impact | Mitigation        |
| ------------------- | ---------- | ------ | ----------------- |
| Reference data      | Medium     | Medium | Reference data    |
| change breaks       |            |        | changes reviewed  |
| existing tenants    |            |        | by domain         |
| (e.g., new grade    |            |        | architect.        |
| scale incompatible  |            |        | Backward-         |
| with existing       |            |        | compatible        |
| records).           |            |        | additions only.   |
Destructive
changes follow the
two-release
deprecation cycle
(ADR-057).
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  234

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk                 | Likelihood | Impact | Mitigation         |
| -------------------- | ---------- | ------ | ------------------ |
| Demo data with       | Low        | High   | Spring profile     |
| real PII leaks into  |            |        | gating prevents    |
| production.          |            |        | demo data loading  |
in production. CI
check scans for
real PII patterns
in demo data files.
Quarterly audit
verifies production
has no demo data.
| Tenant bootstrap  | Low | Medium | Bootstrap runs in   |
| ----------------- | --- | ------ | ------------------- |
| fails mid-way,    |     |        | a single            |
| leaving partial   |     |        | transaction.        |
| tenant.           |     |        | Partial bootstraps  |
roll back.
Idempotent retry
on failure.
| Reference data  | Medium | Low | Flyway repeatable  |
| --------------- | ------ | --- | ------------------ |
| YAML and        |        |     | migrations re-     |
| database drift. |        |     | apply on           |
checksum change.
CI check verifies
reference data is
loaded. Quarterly
reconciliation.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
Predictable, fast environment setup. Three mechanisms to learn and
maintain.
Idempotent seed data allows safe re- INSERT ON CONFLICT adds SQL
| runs. |     | complexity. |     |
| ----- | --- | ----------- | --- |
Reference data versioned with  Reference data changes require code
| application code. |     | deployment. |     |
| ----------------- | --- | ----------- | --- |
Tenant bootstrap is API-driven and  Bootstrap service must be maintained.
testable.
REJECTED ALTERNATIVES
Single ApplicationRunner mechanism was rejected because it's unsuitable for
reference data (changes require code) and demo data (runs in production).
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  235

PreOne ADR - Volume 3: Data Architecture v3.0
External seeding tools (dbseed, sqitch) were rejected because they add another
tool without clear benefit over Flyway + Spring Boot. External seeding
microservice was rejected as over-engineered for the problem. The three-tier
approach uses the right tool for each job: Flyway for versioned reference data,
Spring Boot for environment-specific demo data, and a Spring service for
transactional tenant bootstrap.
MIGRATION PLAN
Migration is phased over 4 weeks. Week 1: create reference-data YAML files for
existing reference tables. Week 1: create Flyway repeatable migrations to load
YAML. Week 2: extract demo data from current dev environments into SQL
files. Week 2: configure Spring Boot data.sql for non-production profiles. Week
3: implement TenantBootstrapService. Week 3: integrate with tenant
provisioning API. Week 4: deploy to staging, verify all three tiers work end-to-
end. Week 4: deploy to production.
TESTING STRATEGY
Reference data is tested by verifying that all reference tables are populated
after Flyway migrate runs. Demo data is tested by verifying that demo tenants
can log in and perform basic operations. Tenant bootstrap is tested by
provisioning a new tenant and verifying all related entities (roles, permissions,
admin user, config) are created correctly. Integration tests use Testcontainers
to verify seed data loading against a real PostgreSQL instance.
MONITORING & OBSERVABILITY
Metrics: reference_data_load_duration_ms, demo_data_load_duration_ms,
tenant_bootstrap_duration_ms, tenant_bootstrap_failure_total. Dashboards:
seed data status by environment, tenant bootstrap success rate, bootstrap
duration trend. Alerts: reference data load failure, tenant bootstrap failure
(immediate page), demo data load failure in dev/staging (non-urgent). Audit
trail logs tenant bootstrap operations with tenant ID, admin user, and
timestamp.
FUTURE EVOLUTION
The seed data strategy should be revisited if: (a) reference data grows beyond
10MB, requiring partitioned loading; (b) tenant bootstrap becomes a
bottleneck for bulk tenant provisioning (e.g., 1000 tenants per hour), requiring
batch provisioning; (c) multi-region deployment requires region-specific
reference data; (d) customer-managed reference data (e.g., custom grade
scales) requires a different model. The likely successor is a hybrid model:
application-managed reference data + customer-managed reference data via
API.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 236

PreOne ADR - Volume 3: Data Architecture v3.0
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (database for seed data)
● ADR-043 - Tenant Isolation (tenant bootstrap creates isolated tenant)
● ADR-057 - Migration Strategy (Flyway for reference data loading)
● ADR-013 - Project Structure (seed data file locations)
● ADR-064 - RBAC Model (default roles created by tenant bootstrap)
● ADR-066 - Bundle Strategy (default permission bundles)
● ADR-075 - Password Policy (admin user temp password)
● ADR-086 - Audit Trail (tenant bootstrap logged)
REFERENCES
● Flyway Repeatable Migrations. Redgate. 2024.
● Spring Boot Database Initialization. Spring. 2024.
● Data Seed Pattern. Martin Fowler. 2003.
● PreOne Engineering Handbook, Section 3.18 - Seed Data Strategy.
Internal. 2025.
● PreOne Tenant Provisioning Runbook. Internal. 2025.
DECISION HISTORY
Date Status Actor Notes
2025-08-16 Draft Data Platform Initial draft;
Lead options
enumerated;
consultation with
engineering team
2025-09-24 Proposed Data Platform Submitted to
Lead Architecture
Review Board
after cross-team
review
2025-10-15 Accepted ARB Chair ARB approved;
published to
architecture
repository
2026-07-15 Accepted ARB Chair v3.0 refresh;
cross-references
to Vol 1 ADRs
added; 34-section
template applied
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 237

PreOne ADR - Volume 3: Data Architecture v3.0
APPROVAL & SIGN-OFF
Architect Data Platform Architect
Tech Lead Data Platform Lead
ARB Chair Architecture Review Board
Approved On 2025-10-15
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Reference data seed files versioned (Done)
● Demo-tenant and test-user seed (dev/staging only) (Done)
● Production guard blocks demo seed (Done)
● Seed Runner idempotency verified (Done)
● Annual seed-data review (Scheduled)
AD R -059
Search Strategy
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a dual-search strategy: PostgreSQL Full-Text Search (FTS) for
default in-app search (simple keyword, single-entity, < 100K rows per
tenant), and Elasticsearch (OpenSearch) for advanced search (multi-entity,
faceted, fuzzy, > 100K rows per tenant). Search index is built via change-
data-capture (CDC) from PostgreSQL WAL via Debezium, with tenant-
scoped indices and per-tenant field-level security.
STATUS
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 238

PreOne ADR - Volume 3: Data Architecture v3.0
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on latency target
breach, or on engine major-version
upgrade
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne requires search across multiple entity types: students, courses,
assessments, attendance records, fee records, communications, and content.
Search use cases range from simple ("find student by name") to complex ("find
all grade-10 students in branch X who failed math in the last quarter with
attendance < 75%"). The current approach of LIKE queries in PostgreSQL
works for simple cases but fails for fuzzy matching, ranking, and cross-entity
search. A purely PostgreSQL FTS approach would handle most cases but
struggles at scale (100K+ documents per tenant) and with complex multi-entity
joins. A purely Elasticsearch approach would handle all cases but adds
operational complexity and a second source of truth. The dual strategy uses the
right tool for each use case: PostgreSQL FTS for simple, low-volume,
transactional search; Elasticsearch for complex, high-volume, analytics-style
search. This ADR defines the search strategy: when to use PostgreSQL FTS vs
Elasticsearch, how the Elasticsearch index is populated (CDC via Debezium),
how tenant isolation is enforced (per-tenant indices), and how search is
exposed to the application (unified search API).
BUSINESS DRIVERS
The primary business driver is user experience. Fast, accurate search is a top
feature request from teachers and administrators who need to find students,
records, and content quickly. Secondary drivers include analytics capability
(faceted search enables dashboards) and platform extensibility (search is a
foundation for AI features like semantic search and recommendations).
PROBLEM STATEMENT
PreOne needs a search strategy that handles both simple keyword search
(transactional) and complex multi-entity faceted search (analytical), scales to
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 239

PreOne ADR  -  Volume 3: Data Architecture  v3.0
100K+ documents per tenant, preserves tenant isolation, and provides a
unified API for application developers.
CONSTRAINTS
● Search must be tenant-isolated (no cross-tenant results).
● Search latency must be < 100ms for typical queries.
● Search index must be near-real-time (lag < 5 seconds from
PostgreSQL).
● Search must support fuzzy matching, ranking, and highlighting.
● Search infrastructure must be cost-effective at scale.
● Search must work in all environments (dev, staging, production).
ASSUMPTIONS
● PostgreSQL FTS remains performant for tables under 100K rows per
tenant.
● Elasticsearch/OpenSearch remains the industry standard for full-text
search.
● Debezium CDC remains stable and PostgreSQL-compatible.
● Per-tenant index strategy is feasible up to 10,000 tenants.
● Search index size stays under 100GB total (all tenants).
OPTIONS CONSIDERED
| Option          | Pros               | Cons               | Verdict  |
| --------------- | ------------------ | ------------------ | -------- |
| PostgreSQL FTS  | Simpler. No        | Doesn't scale for  | Rejected |
| for all search  | second datastore.  | 100K+              |          |
| (single tool).  | Strong             | documents.         |          |
|                 | consistency with   | Limited fuzzy and  |          |
|                 | OLTP.              | ranking. No        |          |
facets.
| Elasticsearch for   | Handles all use    | Eventual            | Rejected |
| ------------------- | ------------------ | ------------------- | -------- |
| all search (single  | cases. Powerful    | consistency.        |          |
| tool).              | query DSL. Scales  | Second source of    |          |
|                     | horizontally.      | truth. Operational  |          |
overhead.
| Dual strategy:     | Right tool for each   | Two systems to    | Adopted |
| ------------------ | --------------------- | ----------------- | ------- |
| PostgreSQL FTS     | job. Cost-effective.  | operate.          |         |
| for simple,        | Pragmatic.            | Application must  |         |
| Elasticsearch for  |                       | choose. CDC       |         |
| complex.           |                       | pipeline needed.  |         |
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  240

PreOne ADR - Volume 3: Data Architecture v3.0
Option Pros Cons Verdict
Third-party search Managed. No Vendor lock-in. Rejected
service (Algolia, operational Cost scales with
Elastic Cloud). overhead. Best-in- usage. Data leaves
class relevance. our infrastructure.
DECISION
ADOPTED
We will adopt a dual-search strategy. PostgreSQL FTS (tsvector + GIN
index) is used for default in-app search: simple keyword, single-entity, <
100K rows per tenant. Elasticsearch (OpenSearch) is used for advanced
search: multi-entity, faceted, fuzzy, > 100K rows per tenant. The
Elasticsearch index is populated via Debezium CDC from PostgreSQL WAL,
providing near-real-time sync (lag < 5 seconds). Tenant isolation is
enforced via per-tenant indices (preone-{tenant_id}-{entity}). A unified
Search API abstracts the choice: simple queries route to PostgreSQL FTS,
complex queries route to Elasticsearch, and developers use a single API.
DETAILED RATIONALE
The dual strategy is pragmatic. PostgreSQL FTS is sufficient for the majority of
search use cases (find student by name, find course by code) where the query is
simple and the dataset is small. It avoids the operational complexity of
Elasticsearch for cases that don't need it. For complex search (multi-entity
joins, faceted navigation, fuzzy matching on 100K+ documents), Elasticsearch
is the right tool - PostgreSQL FTS would require complex SQL, multiple joins,
and would not scale. The threshold of 100K rows per tenant is calibrated to
PostgreSQL FTS performance. Below this threshold, GIN index lookups return
in < 50ms. Above this threshold, index size grows and query latency degrades.
Most tenants stay below 100K rows; the largest tenants (10+ schools, 10,000+
students) exceed this and require Elasticsearch. CDC via Debezium is the right
index population strategy. Application-level dual-write (write to PostgreSQL +
write to Elasticsearch) is error-prone and creates consistency issues. CDC
reads the WAL asynchronously, ensuring the index reflects committed
transactions without application overhead. Debezium is mature, PostgreSQL-
compatible, and integrates with Kafka for reliable delivery. Per-tenant indices
(preone-{tenant_id}-{entity}) enforce tenant isolation at the infrastructure
level. A search query for tenant A simply cannot access tenant B's index
because the index name is tenant-scoped. This is stronger than row-level
filtering within a shared index, which is vulnerable to query bugs. The unified
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 241

PreOne ADR - Volume 3: Data Architecture v3.0
Search API is critical for developer experience. Developers should not have to
choose between PostgreSQL FTS and Elasticsearch; the API routes
automatically based on query complexity. Simple queries (single entity,
keyword match) route to PostgreSQL FTS. Complex queries (multi-entity,
facets, fuzzy) route to Elasticsearch. The API contract is the same regardless of
backend. The most likely counter-argument is that two search systems are too
many. We considered a single-system approach for each but found that
PostgreSQL FTS doesn't scale for the largest tenants and Elasticsearch adds
unnecessary complexity for the smallest. The dual strategy is the pragmatic
middle ground. OpenSearch (the open-source Elasticsearch fork) is chosen
over Elasticsearch itself to avoid Elastic's licensing changes. OpenSearch is
API-compatible with Elasticsearch 7.10 and is supported by AWS OpenSearch
Service, which PreOne uses for managed deployment.
ARCHITECTURE DIAGRAM
Dual Search Strategy: Application -> Search API: search(query) Search API ->
Query Analyzer: Analyze complexity Query Analyzer -> Search API: {complexity:
simple/complex} IF simple (single-entity, keyword, < 100K rows): Search API
-> PostgreSQL FTS: SELECT ... WHERE tsvector @@ plainto_tsquery(query)
PostgreSQL FTS -> GIN Index: Lookup GIN Index -> Search API: Results
(ranked) Search API -> Application: Results IF complex (multi-entity, faceted,
fuzzy, > 100K rows): Search API -> Elasticsearch: POST /preone-{tenant}-
{entity}/_search Elasticsearch -> Search API: Results (ranked, faceted)
Search API -> Application: Results Index Population (CDC): +-------------+ WAL
+----------+ Kafka +------------+ Index +--------------+ | PostgreSQL | --------> |
Debezium | ---------> | Kafka | ---------> | Elasticsearch| | (source of | |
Connect | | topic: | | (per-tenant | | truth) | | |
| pg.{tbl} | | indices) | +-------------+ +----------+ +------------+
+--------------+ |
v Tenant isolation:
preone-{tenant_id}-{entity}
(index name enforces isolation)
SEQUENCE DIAGRAM
User -> Application: Search for "john smith grade 10" Application -> Search API:
search({query: "john smith grade 10", entity: "student"}) Search API -> Query
Analyzer: Complexity = simple (single entity, keyword) Search API ->
PostgreSQL FTS: SELECT * FROM students WHERE tsv @@
plainto_tsquery('john smith grade 10') PostgreSQL FTS -> GIN Index: Lookup
GIN Index -> Search API: 12 results ranked Search API -> Application: 12
students User -> Application: Advanced search (multi-entity, faceted)
Application -> Search API: search({query: "failed math", facets:
["branch","grade"], fuzzy: true}) Search API -> Query Analyzer: Complexity =
complex (multi-entity, facets) Search API -> Elasticsearch: POST /preone-
{tenant}-student/_search {query, aggs} Elasticsearch -> Search API: 45 results
+ facets (branch: {Mumbai: 20, Pune: 25}, grade: {10: 30, 11: 15}) Search API
-> Application: 45 students + facet counts Index Update (CDC, async):
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 242

PreOne ADR - Volume 3: Data Architecture v3.0
Application -> PostgreSQL: UPDATE students SET name = 'John Smith'
PostgreSQL -> WAL: Write change record Debezium -> WAL: Read change
(within 5 seconds) Debezium -> Kafka: Publish to pg.students topic Kafka ->
Elasticsearch Sink Connector: Consume change Elasticsearch Sink Connector ->
Elasticsearch: Update preone-{tenant}-student index Note over Elasticsearch:
Index now reflects new name (lag < 5 sec)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-059 — Search Strategy -
Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | Search API | query |
Postgres FTS | | | | |------->| (tsvector + GIN) | | |
+----------------+ +----------+-----------+ | | |
| | | slow query? | | v
| | +--------+----------+ | | | Elasticsearch
| | | | (optional accel) | | | +--------
+----------+ | | | | |
| sync via | | v | |
+--------+----------+ | | | Outbox + CDC | | |
| (Postgres -> ES) | | | +-------------------+ |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
Index Flow: App -> INSERT/UPDATE row -> Outbox event CDC -> read
Outbox -> publish to Elasticsearch Elasticsearch -> update search index (near
real-time) Query Flow: Client -> Search API -> try Postgres FTS first If
latency > 200ms -> fallback to Elasticsearch Return results with source
indicator (FTS or ES) Reconciliation Flow (hourly): Reconciler -> compare
Postgres FTS vs ES counts Drift > 1% -> trigger re-index from Postgres
DATABASE IMPACT
PostgreSQL FTS requires adding a tsvector column and GIN index to
searchable tables. This adds approximately 10% to table size and 5% to write
latency (tsvector update on insert/update). For most tables, this is acceptable.
For high-write tables (audit_log, attendance_record), FTS is not enabled;
search on these tables uses Elasticsearch only. The Debezium connector reads
the WAL with minimal impact on PostgreSQL (logical replication slot, no
additional locks).
API IMPACT
A new /api/v1/search endpoint is added. The endpoint accepts a unified query
object: {query, entity, facets, fuzzy, pagination}. The API routes to PostgreSQL
FTS or Elasticsearch based on query complexity. Response format is the same
regardless of backend. The endpoint is tenant-scoped via the JWT (ADR-070).
Search results include relevance scores and highlighting where applicable.
UI IMPACT
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 243

PreOne ADR - Volume 3: Data Architecture v3.0
Search strategy directly shapes the UI search experience. The global search
bar (top navigation) queries the Search API, which abstracts the Postgres-FTS-
first, Elasticsearch-fallback logic. Users see a unified search results page with
sub-200ms response time; the source indicator (FTS or ES) is hidden from end
users but logged for observability. The search UI supports faceted filtering (by
entity type, date range, tenant) on the left rail, with result snippets highlighting
matched terms. The search bar was upgraded with typeahead suggestions
(queried from a dedicated suggest endpoint backed by Postgres FTS trigram
indexes).
SECURITY IMPACT
Tenant isolation is enforced at multiple levels. Per-tenant Elasticsearch indices
prevent cross-tenant search at the infrastructure level. The Search API extracts
tenant_id from the JWT and includes it in the index name; a bug in tenant
extraction would result in a non-existent index, not cross-tenant data.
Elasticsearch access is restricted to the search-service IAM role. All search
queries are logged in the audit trail with tenant, actor, query, and result count.
PERFORMANCE IMPACT
PostgreSQL FTS queries return in < 50ms for typical tenants (< 100K rows).
Elasticsearch queries return in < 100ms even for the largest tenants (1M+
documents). Index update lag is < 5 seconds from PostgreSQL commit. The
unified Search API adds < 5ms overhead for query analysis and routing.
Overall, search performance is significantly better than the previous LIKE-
query approach, which took 500ms-2s for complex queries.
SCALABILITY ANALYSIS
PostgreSQL FTS scales linearly with table size up to approximately 1M rows
per tenant, beyond which Elasticsearch is required. Elasticsearch scales
horizontally by adding nodes; current 3-node cluster handles 100GB of indices
with headroom for 5x growth. Per-tenant indices scale to 10,000 tenants
(10,000 indices) without issue; beyond that, index-per-tenant becomes
operationally complex and a shared-index with tenant_id filter becomes
preferable. Debezium CDC scales with write throughput; current 1,000
writes/sec is well within capacity.
OPERATIONAL CONSIDERATIONS
Database team owns PostgreSQL FTS (index maintenance, query tuning).
Platform team owns Elasticsearch (cluster health, index management,
backup/restore). Data platform team owns Debezium CDC pipeline (connector
health, lag monitoring). Search API is owned by the API platform team. On-call
rotation includes all three teams. Elasticsearch cluster is monitored via
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 244

PreOne ADR  -  Volume 3: Data Architecture  v3.0
CloudWatch + Prometheus exporter. Index lag is monitored and alerted if > 30
seconds.
RISKS
| Risk             | Likelihood | Impact | Mitigation     |
| ---------------- | ---------- | ------ | -------------- |
| Elasticsearch    | Low        | Medium | Multi-AZ       |
| cluster failure  |            |        | Elasticsearch  |
| takes down       |            |        | cluster with   |
| advanced search. |            |        | automated      |
failover.
PostgreSQL FTS
continues to work
for simple search.
Search API
degrades
gracefully.
| CDC lag exceeds 5  | Medium | Low | Lag monitoring    |
| ------------------ | ------ | --- | ----------------- |
| seconds, leading   |        |     | with alert at 30  |
| to stale search    |        |     | seconds. User-    |
| results.           |        |     | facing message    |
indicates 'results
may be slightly
stale' for recent
changes.
Debezium scaling
handles
throughput spikes.
| Per-tenant index  | Low | Medium | At 5,000 tenants,  |
| ----------------- | --- | ------ | ------------------ |
| strategy becomes  |     |        | evaluate shared-   |
| unwieldy at       |     |        | index with         |
| 10,000+ tenants.  |     |        | tenant_id filter.  |
Migration is
documented and
tested.
| Search API         | Medium | Medium | Query analyzer is    |
| ------------------ | ------ | ------ | -------------------- |
| routing logic      |        |        | extensively tested.  |
| incorrectly sends  |        |        | Routing decisions    |
| complex queries    |        |        | logged for audit.    |
| to PostgreSQL      |        |        | Manual override      |
| FTS.               |        |        | available for        |
debugging.
TRADE-OFFS
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  245

PreOne ADR - Volume 3: Data Architecture v3.0
We Gain We Lose
Right tool for each search use case. Two search systems to operate and
monitor.
Tenant isolation enforced at Per-tenant indices add operational
infrastructure level. complexity.
Near-real-time index via CDC (no dual- Eventual consistency (5-second lag).
write bugs).
Unified API abstracts backend choice API routing logic must be maintained.
from developers.
REJECTED ALTERNATIVES
PostgreSQL FTS for all search was rejected because it doesn't scale for the
largest tenants and lacks fuzzy matching and facets. Elasticsearch for all
search was rejected because it adds unnecessary complexity for simple use
cases and creates a second source of truth. Third-party search services (Algolia,
Elastic Cloud) were rejected due to vendor lock-in, cost scaling, and data
residency concerns (PreOne's regulated data cannot leave our infrastructure).
The dual strategy with CDC index population is the pragmatic middle ground.
MIGRATION PLAN
Migration is phased over 8 weeks. Week 1-2: enable PostgreSQL FTS on
searchable tables (tsvector column + GIN index). Week 3-4: deploy
Elasticsearch cluster (AWS OpenSearch Service) and configure per-tenant
indices. Week 5-6: deploy Debezium CDC pipeline and Kafka infrastructure.
Week 7: build unified Search API with routing logic. Week 8: deploy to staging,
verify end-to-end, train developers. Production rollout follows with feature flag
(ADR-016) for gradual cutover.
TESTING STRATEGY
PostgreSQL FTS is tested via unit tests that verify ranking and highlighting.
Elasticsearch is tested via integration tests that verify facets, fuzzy matching,
and pagination. CDC pipeline is tested by inserting a row in PostgreSQL and
verifying it appears in Elasticsearch within 5 seconds. Search API routing is
tested with both simple and complex queries to verify correct backend
selection. Tenant isolation is tested by attempting to search another tenant's
index (must fail).
MONITORING & OBSERVABILITY
Metrics: search_query_duration_ms (target < 100ms for both backends),
search_query_count (by backend), cdc_lag_seconds (target < 5),
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 246

PreOne ADR - Volume 3: Data Architecture v3.0
elasticsearch_cluster_health (target green), search_error_total. Dashboards:
search performance by tenant, CDC lag trend, Elasticsearch cluster health,
search query distribution (PostgreSQL FTS vs Elasticsearch). Alerts: search
latency > 500ms, CDC lag > 30 seconds, Elasticsearch cluster yellow/red,
search error rate > 1%.
FUTURE EVOLUTION
The search strategy should be revisited if: (a) tenant count exceeds 10,000,
requiring shared-index model; (b) AI features (semantic search, vector search)
require pgvector or Elasticsearch k-NN; (c) real-time search (< 1 second lag) is
required, requiring synchronous dual-write; (d) multi-region deployment
requires region-local search clusters. The likely successor is a hybrid: pgvector
for semantic search within PostgreSQL + Elasticsearch for full-text + a vector
database (Pinecone, Weaviate) for large-scale semantic search.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (FTS backend)
● ADR-051 - Partition Strategy (partitioned tables require special FTS
handling)
● ADR-043 - Tenant Isolation (per-tenant indices enforce isolation)
● ADR-127 - Cache Strategy (search results cached)
● ADR-016 - Feature Flag Architecture (gradual search rollout)
● ADR-091 - REST Standards (search API follows REST conventions)
● ADR-097 - Search (API-level search specification)
● ADR-086 - Audit Trail (search queries logged)
REFERENCES
● PostgreSQL Full Text Search. PostgreSQL Global Development Group.
2024.
● OpenSearch Documentation. OpenSearch Project. 2024.
● Debezium Documentation. Red Hat. 2024.
● PreOne Engineering Handbook, Section 3.19 - Search Strategy.
Internal. 2025.
● Elasticsearch: The Definitive Guide. O'Reilly. 2015.
DECISION HISTORY
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 247

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Data Platform Architect   |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Data Platform Lead        |     |
| ARB Chair   |     | Architecture Review Board |     |
| Approved On |     | 2025-10-15                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Postgres FTS (tsvector + GIN) deployed for core entities (Done)
● Elasticsearch cluster provisioned as optional accelerator (Done)
● CDC pipeline (Postgres -> ES via Outbox) deployed (Done)
● Search API with FTS-first, ES-fallback logic (Done)
● Hourly reconciliation job (Postgres vs ES counts) (Done)
● Quarterly search-quality review (Scheduled)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  248

PreOne ADR - Volume 3: Data Architecture v3.0
AD R -060
Reporting Database Strategy
Volume 3 — Data Architecture - Data Architecture
ACCEPTED
DECISION SUMMARY
DECISION
Adopt a three-tier reporting database strategy: (1) Aurora PostgreSQL read
replica for real-time operational reports (< 5 sec, low complexity); (2)
Materialized views refreshed hourly for standard dashboard reports; (3)
Dedicated OLAP store (ClickHouse) for heavy analytical queries, populated
via ETL from PostgreSQL. Reports route automatically based on complexity
and latency requirements.
STATUS
Status Accepted
Date Decided 2025-10-15
Decision Owner Data Platform Lead
Review Cadence Annual review, or on latency target
breach, or on engine major-version
upgrade
Supersedes None (v1.0 original; v3.0 refreshes
for series alignment and cross-
references)
CONTEXT
PreOne generates significant reporting load: operational reports (per-tenant
dashboards, daily attendance summary), compliance reports (regulatory
submissions, audit exports), and analytical reports (cross-tenant benchmarks,
year-over-year trends). Running these reports against the OLTP database
would degrade transactional performance, especially for the largest tenants. A
dedicated reporting strategy is needed. The current approach is ad-hoc: some
reports run against the primary Aurora cluster (causing performance issues),
some are pre-computed and cached (stale data), and some are exported to
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 249

PreOne ADR - Volume 3: Data Architecture v3.0
spreadsheets (manual effort). A clear strategy is needed to route reports to the
appropriate backend based on complexity, latency, and freshness
requirements. This ADR defines the reporting strategy: three tiers (read
replica, materialized views, OLAP store), routing rules, ETL pipeline, and
refresh cadence. It works in concert with ADR-059 (Search Strategy) for query-
based reporting and ADR-054 (Archive Policy) for historical reporting.
BUSINESS DRIVERS
The primary business driver is OLTP performance protection. Reports can be
resource-intensive; running them against the primary database degrades
transactional performance for end users. Secondary drivers include analytics
capability (cross-tenant benchmarks require an OLAP store), compliance
reporting speed (regulatory submissions have deadlines), and customer
satisfaction (fast, accurate reports are a competitive differentiator).
PROBLEM STATEMENT
PreOne needs a reporting database strategy that handles operational,
compliance, and analytical reports without degrading OLTP performance, with
clear routing rules, refresh cadence, and a path to heavy analytics at scale.
CONSTRAINTS
● OLTP performance must not be affected by reporting queries.
● Operational reports must be near-real-time (lag < 5 seconds).
● Compliance reports must be exportable within 4 hours.
● Analytical reports must handle cross-tenant aggregation at scale.
● Reporting infrastructure must be cost-effective.
● Reports must be tenant-isolated (no cross-tenant data leak in reports).
ASSUMPTIONS
● Aurora read replica lag remains < 5 seconds for OLTP workloads.
● Materialized views remain the right tool for pre-aggregated reports.
● ClickHouse remains the most cost-effective OLAP store for PostgreSQL-
sourced data.
● ETL pipeline (Airbyte or custom) remains maintainable.
● Report volume stays under 10,000 reports/day across all tenants.
OPTIONS CONSIDERED
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 250

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Option | Pros | Cons | Verdict |
| ------ | ---- | ---- | ------- |
Three-tier: read  Right tool for each  Three systems to  Adopted
| replica +             | report type.       | operate. ETL       |          |
| --------------------- | ------------------ | ------------------ | -------- |
| materialized views    | Scales to heavy    | pipeline to        |          |
| + ClickHouse          | analytics. Cost-   | maintain. Routing  |          |
| OLAP.                 | effective.         | logic needed.      |          |
| Single Aurora         | Simple. One        | Doesn't scale for  | Rejected |
| read replica for all  | system. Real-time. | cross-tenant       |          |
| reports.              |                    | analytics.         |          |
Materialized view
refreshes compete
with reports.
| Dedicated OLAP  | Best analytics   | Cost scales with    | Rejected |
| --------------- | ---------------- | ------------------- | -------- |
| warehouse       | performance.     | usage. Data leaves  |          |
| (Snowflake,     | Managed. Scales  | our infrastructure  |          |
| BigQuery).      | to any size.     | (compliance         |          |
concern). Overkill
for current scale.
| In-application  | No new            | Doesn't scale. Pre- | Rejected |
| --------------- | ----------------- | ------------------- | -------- |
| reporting (pre- | infrastructure.   | computation is      |          |
| compute in      | Single source of  | brittle. Limited    |          |
| PostgreSQL).    | truth.            | analytics.          |          |
DECISION
ADOPTED
We will adopt a three-tier reporting database strategy. (1) Aurora
PostgreSQL read replica for real-time operational reports: per-tenant
dashboards, current-day summaries, simple list reports. Lag < 5 seconds.
(2) Materialized views on the read replica, refreshed hourly, for standard
dashboard reports: weekly attendance summary, monthly fee collection,
term grade averages. (3) ClickHouse OLAP store, populated via ETL from
PostgreSQL, for heavy analytical reports: cross-tenant benchmarks, year-
over-year trends, multi-dimensional analysis. ETL runs nightly (full refresh)
plus hourly incremental. Reports route automatically based on complexity
and latency requirements via the Reporting API.
DETAILED RATIONALE
The three-tier strategy matches the three distinct reporting use cases.
Operational reports (current-day attendance, today's fee collection) need real-
time data and run against the Aurora read replica. The read replica is
asynchronously replicated from the primary with < 5 second lag, which is
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  251

PreOne ADR - Volume 3: Data Architecture v3.0
acceptable for operational reports. Standard dashboard reports (weekly
summaries, monthly trends) don't need real-time data and benefit from pre-
aggregation; materialized views refreshed hourly provide fast query
performance without OLTP impact. Heavy analytical reports (cross-tenant
benchmarks, year-over-year trends across all tenants) require scanning
millions of rows and aggregating across tenants. PostgreSQL is not optimized
for this workload; ClickHouse is purpose-built for it. ClickHouse's columnar
storage and vectorized query execution provide 10-100x performance
improvement over PostgreSQL for analytical queries. The ETL pipeline (Apache
Airflow orchestrated) populates ClickHouse nightly (full refresh for small
tables) plus hourly (incremental for large tables via CDC). The choice of
ClickHouse over Snowflake or BigQuery is driven by cost and data residency.
ClickHouse can be self-hosted on EC2 for ~$2K/month, compared to
$10K+/month for equivalent Snowflake capacity. Self-hosting also keeps data
within PreOne's AWS account, which is important for compliance (regulated
data cannot leave our infrastructure without contractual safeguards). The most
likely counter-argument is that three systems are too many. We considered a
single read replica for all reports but found that materialized view refreshes
compete with report queries for resources, and the read replica doesn't scale
for cross-tenant analytics. We considered a dedicated OLAP warehouse but
found the cost and data residency concerns prohibitive at current scale. The
three-tier approach is the pragmatic middle ground. The Reporting API is
critical for developer experience. Developers should not have to choose
between read replica, materialized views, and ClickHouse; the API routes
automatically based on report type. Operational reports (current-day, single-
tenant) route to the read replica. Dashboard reports (multi-day, single-tenant,
pre-aggregated) route to materialized views. Analytical reports (cross-tenant,
multi-month) route to ClickHouse. The API contract is the same regardless of
backend.
ARCHITECTURE DIAGRAM
Three-Tier Reporting Strategy: Application -> Reporting API:
runReport(reportSpec) Reporting API -> Router: Classify report Router ->
Reporting API: {tier: operational/dashboard/analytical} TIER 1: OPERATIONAL
(real-time, single-tenant) Reporting API -> Aurora Read Replica: SELECT ...
(real-time query) Aurora Read Replica -> Primary (async): Replication lag < 5
sec Aurora Read Replica -> Reporting API: Results Reporting API ->
Application: Report TIER 2: DASHBOARD (hourly, pre-aggregated, single-
tenant) Reporting API -> Aurora Read Replica: SELECT * FROM
mv_weekly_attendance Note over Aurora Read Replica: Materialized view
refreshed hourly Aurora Read Replica -> Reporting API: Results Reporting API
-> Application: Report TIER 3: ANALYTICAL (daily ETL, cross-tenant)
Reporting API -> ClickHouse: SELECT ... GROUP BY tenant, month Note over
ClickHouse: Populated via ETL from PostgreSQL ClickHouse -> Reporting API:
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 252

PreOne ADR - Volume 3: Data Architecture v3.0
Results (aggregated) Reporting API -> Application: Report ETL Pipeline
(Airflow orchestrated): +-------------+ Nightly +----------+ Hourly +------------+
| PostgreSQL | -----------> | Airflow | ----------> | ClickHouse | | (primary) | full
refresh | (DAG) | incremental | (OLAP) | +-------------+ +----------+
+------------+ | ^ | CDC (Debezium) | v
| +-------------+ +----------+ | Kafka | -----------> | Airflow | | pg.{tbl} |
stream | stream | +-------------+ +----------+
SEQUENCE DIAGRAM
User -> Application: Generate weekly attendance summary for tenant X
Application -> Reporting API: runReport({type: "weekly_attendance", tenant: X,
week: "2026-W28"}) Reporting API -> Router: Classify (dashboard tier - pre-
aggregated, single-tenant) Reporting API -> Aurora Read Replica: SELECT *
FROM mv_weekly_attendance WHERE tenant_id = X AND week = '2026-W28'
Aurora Read Replica -> Reporting API: 7 rows (one per day) Reporting API ->
Application: Weekly summary User -> Application: Generate cross-tenant
benchmark report Application -> Reporting API: runReport({type: "benchmark",
metric: "attendance_rate", month: "2026-06"}) Reporting API -> Router: Classify
(analytical tier - cross-tenant) Reporting API -> ClickHouse: SELECT tenant_id,
AVG(attendance_rate) FROM attendance_daily WHERE month = '2026-06'
GROUP BY tenant_id ClickHouse -> Reporting API: 200 rows (one per tenant)
Reporting API -> Application: Benchmark report Materialized View Refresh
(hourly): Airflow -> Aurora Read Replica: REFRESH MATERIALIZED VIEW
CONCURRENTLY mv_weekly_attendance Aurora Read Replica -> Materialized
View: Updated Note over Airflow: Runs every hour at :00 ETL Pipeline (nightly
+ hourly): Airflow (nightly DAG) -> PostgreSQL Primary: SELECT * FROM
tenants (small table, full refresh) Airflow -> ClickHouse: INSERT INTO tenants
Airflow (hourly DAG) -> Kafka: Consume pg.attendance_daily changes Airflow ->
ClickHouse: INSERT INTO attendance_daily (incremental)
COMPONENT DIAGRAM
+-------------------------------------------------------------+ | ADR-060 — Reporting DB Strategy
- Component View | +-------------------------------------------------------------+ |
| | +----------------+ +----------------------+ | | | OLTP Primary | CDC |
Replication Slot | | | | (Postgres) |------->| (logical decoding) | | |
+----------------+ +----------+-----------+ | | |
| | | stream | | v
| | +--------+----------+ | | | ETL Loader
| | | | (transform + | | | |
denormalise) | | | +--------+----------+ | |
| | | | writes | |
v | | +--------+----------+ | | |
Reporting DB | | | | (read-optimised) | | |
+-------------------+ | | | | BI tools connect
to Reporting DB only (no OLTP load) |
+-------------------------------------------------------------+
DATA FLOW DIAGRAM
ETL Flow (continuous): OLTP Primary -> logical replication slot CDC Stream
-> ETL Loader (transform + denormalise) ETL Loader -> Reporting DB (upsert
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 253

PreOne ADR - Volume 3: Data Architecture v3.0
by key) Reporting DB -> materialised views (refresh hourly) Query Flow: BI
Tool -> connect to Reporting DB (read-only) BI Tool -> SELECT from
materialised views / star schema No load on OLTP primary Backfill Flow
(initial): Operator -> trigger backfill job Backfill -> full table scan from OLTP
-> transform -> load Verify -> row counts OLTP vs Reporting DB
DATABASE IMPACT
The read replica offloads reporting queries from the primary, improving OLTP
performance. Materialized views add storage overhead (~10% of base tables)
but significantly reduce query time for pre-aggregated reports. ClickHouse
stores analytical data in columnar format, typically 5-10x compression vs
PostgreSQL row format. The ETL pipeline reads from PostgreSQL via CDC
(Debezium) and batch extraction, adding minimal load to the primary.
API IMPACT
A new /api/v1/reports endpoint is added. The endpoint accepts a report
specification: {type, parameters, format}. The API routes to the appropriate
tier (read replica, materialized view, ClickHouse) based on report type.
Response format is JSON by default; CSV and PDF export are supported via the
Export Engine (ADR-102). Reports are tenant-scoped via the JWT (ADR-070);
cross-tenant reports require platform_admin role.
UI IMPACT
Reporting database strategy powers the analytics UI. The 'Reports' section of
the admin UI (accessible to admins and analysts) connects to the Reporting DB
rather than the OLTP primary, enabling complex queries over years of data
without impacting transactional performance. The reporting UI includes a
report builder (drag-and-drop dimensions and measures), a dashboard library
(saved reports with auto-refresh), and an export-to-CSV/Excel feature. Reports
that previously timed out (against the OLTP primary) now complete in seconds.
End users do not access the reporting UI; it is admin/analyst-only.
SECURITY IMPACT
Tenant isolation is enforced at multiple levels. The read replica uses row-level
security policies inherited from the primary. Materialized views are tenant-
scoped by definition (GROUP BY tenant_id). ClickHouse uses per-tenant row-
level security via ClickHouse's row policy feature. The Reporting API extracts
tenant_id from the JWT and enforces it in all queries. Cross-tenant reports
require platform_admin role and are audited.
PERFORMANCE IMPACT
Reporting strategy significantly improves OLTP performance by offloading
reports from the primary. Operational reports return in < 1 second (read
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 254

PreOne ADR - Volume 3: Data Architecture v3.0
replica). Dashboard reports return in < 500ms (materialized views). Analytical
reports return in < 5 seconds (ClickHouse, even for cross-tenant scans of
millions of rows). Materialized view refresh takes 5-30 seconds depending on
data volume; runs hourly without impacting reports (CONCURRENTLY
refresh). ETL pipeline runs nightly (30 minutes) plus hourly incremental (5
minutes).
SCALABILITY ANALYSIS
The three-tier strategy scales independently. Aurora read replica scales
vertically (larger instance) and supports up to 15 replicas horizontally.
Materialized views scale with primary data size; the largest materialized view
(attendance summary) is ~1% of base table size. ClickHouse scales horizontally
by adding shards; current single-node handles 100GB with headroom for 10x
growth. ETL pipeline scales with data volume; nightly full refresh of small
tables is fast, hourly incremental of large tables is bounded by CDC throughput.
OPERATIONAL CONSIDERATIONS
Database team owns the read replica and materialized views. Data platform
team owns ClickHouse and the ETL pipeline. Reporting API is owned by the API
platform team. On-call rotation includes all three teams. ClickHouse cluster is
monitored via CloudWatch + ClickHouse's built-in metrics. Materialized view
refresh is monitored and alerted if > 5 minutes. ETL pipeline failure triggers
Sev-2 incident.
RISKS
Risk Likelihood Impact Mitigation
Read replica lag Medium Low Lag monitoring
exceeds 5 seconds with alert at 30
during peak write seconds.
load. Operational
reports show 'data
may be 30
seconds stale'
when lag exceeds
threshold.
Materialized view Medium Medium CONCURRENTLY
refresh fails or refresh allows
takes too long. queries during
refresh. Failure
triggers alert.
Manual refresh
available via
actuator endpoint.
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 255

PreOne ADR  -  Volume 3: Data Architecture  v3.0
| Risk              | Likelihood | Impact | Mitigation          |
| ----------------- | ---------- | ------ | ------------------- |
| ETL pipeline      | Medium     | Medium | Nightly full        |
| failure leaves    |            |        | refresh catches up  |
| ClickHouse stale. |            |        | any missed          |
incremental
updates. Staleness
alert at 24 hours.
Manual ETL
trigger available.
| ClickHouse single-  | Low | Medium | Multi-AZ      |
| ------------------- | --- | ------ | ------------- |
| node failure takes  |     |        | ClickHouse    |
| down analytical     |     |        | cluster with  |
| reports.            |     |        | replication.  |
Operational and
dashboard reports
continue to work.
TRADE-OFFS
| We Gain |     | We Lose |     |
| ------- | --- | ------- | --- |
OLTP performance protected from  Three reporting systems to operate.
reporting load.
Right tool for each report type. Routing logic must be maintained.
ClickHouse provides 10-100x analytics  ETL pipeline adds complexity and lag.
performance.
Cost-effective vs managed OLAP  Self-hosted ClickHouse requires
| warehouse. |     | operational expertise. |     |
| ---------- | --- | ---------------------- | --- |
REJECTED ALTERNATIVES
Single Aurora read replica for all reports was rejected because it doesn't scale
for cross-tenant analytics and materialized view refreshes compete with report
queries. Dedicated OLAP warehouse (Snowflake, BigQuery) was rejected due to
cost and data residency concerns. In-application reporting (pre-compute in
PostgreSQL) was rejected because it doesn't scale and is brittle. The three-tier
approach is the pragmatic middle ground: real-time via read replica, pre-
aggregated via materialized views, heavy analytics via ClickHouse.
MIGRATION PLAN
Migration is phased over 12 weeks. Week 1-2: provision Aurora read replica
and verify replication lag. Week 3-4: identify top 20 dashboard reports and
create materialized views. Week 5-6: deploy ClickHouse cluster and configure
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  256

PreOne ADR - Volume 3: Data Architecture v3.0
schema. Week 7-8: build ETL pipeline (Airflow) for nightly + incremental load.
Week 9-10: build Reporting API with routing logic. Week 11: deploy to staging,
verify all three tiers. Week 12: production rollout with feature flag for gradual
cutover.
TESTING STRATEGY
Read replica is tested by verifying replication lag and query performance.
Materialized views are tested by verifying data correctness against base tables
and refresh duration. ClickHouse is tested by verifying ETL correctness (row
counts match PostgreSQL) and query performance. Reporting API routing is
tested with all three report types. Tenant isolation is tested by attempting
cross-tenant reports without platform_admin role (must fail).
MONITORING & OBSERVABILITY
Metrics: read_replica_lag_seconds (target < 5),
materialized_view_refresh_duration_ms, etl_pipeline_duration_ms,
clickhouse_query_duration_ms (target < 5000), report_query_total (by tier).
Dashboards: reporting performance by tier, ETL pipeline status, ClickHouse
cluster health, report query distribution. Alerts: read replica lag > 30 seconds,
materialized view refresh > 5 minutes, ETL pipeline failure, ClickHouse query
> 30 seconds, report error rate > 1%.
FUTURE EVOLUTION
The reporting strategy should be revisited if: (a) data volume exceeds 1TB in
ClickHouse, requiring sharding; (b) real-time analytical reports (< 1 second
lag) are required, requiring streaming ETL; (c) AI/ML features require a feature
store, extending the OLAP tier; (d) multi-region deployment requires region-
local reporting. The likely successor is a unified analytics platform (e.g., dbt +
ClickHouse + Metabase) with streaming ETL via Kafka Connect + ClickHouse
Kafka connector.
RELATED ADRS
● ADR-041 - PostgreSQL Strategy (source of truth for reports)
● ADR-054 - Archive Policy (historical reporting via archive)
● ADR-059 - Search Strategy (query-based reporting via search)
● ADR-102 - Export Engine (report export to CSV/PDF)
● ADR-127 - Cache Strategy (report results cached)
● ADR-043 - Tenant Isolation (tenant-scoped reports)
● ADR-091 - REST Standards (report API follows REST)
● ADR-086 - Audit Trail (report generation logged)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 257

PreOne ADR  -  Volume 3: Data Architecture  v3.0
REFERENCES
● ClickHouse Documentation. ClickHouse. 2024.
● PostgreSQL Materialized Views. PostgreSQL Global Development
Group. 2024.
● Apache Airflow Documentation. Apache Software Foundation. 2024.
● PreOne Engineering Handbook, Section 3.20 - Reporting Database
Strategy. Internal. 2025.
● Designing Data-Intensive Applications. Martin Kleppmann. O'Reilly.
2017.
DECISION HISTORY
| Date       | Status | Actor          | Notes           |
| ---------- | ------ | -------------- | --------------- |
| 2025-08-16 | Draft  | Data Platform  | Initial draft;  |
|            |        | Lead           | options         |
enumerated;
consultation with
engineering team
| 2025-09-24 | Proposed | Data Platform  | Submitted to  |
| ---------- | -------- | -------------- | ------------- |
|            |          | Lead           | Architecture  |
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
to Vol 1 ADRs
added; 34-section
template applied
APPROVAL & SIGN-OFF
| Architect   |     | Data Platform Architect   |     |
| ----------- | --- | ------------------------- | --- |
| Tech Lead   |     | Data Platform Lead        |     |
| ARB Chair   |     | Architecture Review Board |     |
| Approved On |     | 2025-10-15                |     |
IMPLEMENTATION CHECKLIST
● ADR published to architecture repository (Done)
PreOne ADR Series  -  Phase 4 / 10  -  Vol 3: Data Architecture  -  258

PreOne ADR - Volume 3: Data Architecture v3.0
● Cross-references to upstream/downstream artefacts added (Done)
● Engineering team briefed in monthly architecture sync (Done)
● Code review checklist updated to enforce this ADR (Done)
● On-call runbook updated with operational procedures (Done)
● Logical replication slot on OLTP primary (Done)
● ETL Loader (transform + denormalise) deployed (Done)
● Reporting DB provisioned (read-replica topology) (Done)
● Materialised views refresh hourly (Done)
● BI tool connectivity validated (Done)
● Quarterly ETL pipeline health review (Scheduled)
PreOne ADR Series - Phase 4 / 10 - Vol 3: Data Architecture - 259