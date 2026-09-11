P R E O N E E N T E R P R I S E
PreOne ADR-111
DevOps & Infrastructure
Architecture Decision Record — DevOps & Infrastructure Architecture
ADR ID: ADR-111
Status: LOCKED
Document Version: 1.0
Date: 2026-07-14
Product: PreOne — Enterprise Preschool Operating System
Predecessor: ADR Catalog v1.0, Backend TD v1.0, Frontend Architecture v1.0
Successor: DevOps Runbook, Kubernetes Manifests, Terraform Modules, Production Release
Scope: Docker, Kubernetes, CI/CD, NGINX, PostgreSQL HA, Redis, Monitoring, Logging, DR
Classification: Internal Engineering Reference
Prepared by: PreOne Architecture & DevOps Team
PreOne Platform ADR-111 v1.0

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Table of Contents
1. Introduction...................................................................................................................1
1.1 Purpose...........................................................................................................................1
1.2 Scope..............................................................................................................................2
1.3 Audience.........................................................................................................................4
1.4 ADR Status......................................................................................................................5
1.5 Related Documents........................................................................................................6
2. Infrastructure Overview..................................................................................................6
2.1 High-Level Architecture..................................................................................................6
2.2 Pipeline Diagram............................................................................................................7
2.3 Technology Stack..........................................................................................................10
2.4 Design Principles..........................................................................................................10
3. Docker Architecture......................................................................................................12
3.1 Containerization Strategy.............................................................................................12
3.2 Docker Images..............................................................................................................13
3.3 Docker Principles..........................................................................................................13
3.4 Sample Dockerfile (preone-api)...................................................................................14
4. Kubernetes Architecture...............................................................................................22
4.1 Cluster Topology...........................................................................................................22
4.2 Namespace Architecture..............................................................................................23
4.3 Cluster Diagram............................................................................................................23
4.4 Workload Types............................................................................................................25
4.5 Sample Deployment Manifest (preone-api)................................................................26
5. CI/CD Pipeline (GitHub Actions)....................................................................................37
5.1 Pipeline Overview.........................................................................................................37
1

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
5.2 Pipeline Stages.............................................................................................................38
5.3 Pipeline Diagram..........................................................................................................38
5.4 Sample GitHub Actions Workflow................................................................................42
6. NGINX Ingress...............................................................................................................58
6.1 Role of NGINX...............................................................................................................58
6.2 Responsibilities.............................................................................................................58
6.3 Sample Ingress Manifest..............................................................................................59
7. PostgreSQL High Availability.........................................................................................67
7.1 HA Architecture............................................................................................................68
7.2 HA Diagram...................................................................................................................68
7.3 HA Features..................................................................................................................70
7.4 Connection Pooling Strategy........................................................................................71
8. Redis.............................................................................................................................71
8.1 Role of Redis.................................................................................................................71
8.2 Use Cases......................................................................................................................72
8.3 Redis HA Setup.............................................................................................................72
8.4 Logical Database Allocation.........................................................................................75
9. Monitoring...................................................................................................................76
9.1 Monitoring Architecture..............................................................................................76
9.2 Monitoring Pipeline......................................................................................................77
9.3 Monitored Metrics.......................................................................................................78
9.4 Sample Prometheus Alert Rules...................................................................................79
10. Logging.......................................................................................................................88
10.1 Logging Architecture..................................................................................................88
10.2 Logging Pipeline..........................................................................................................89
10.3 Log Types....................................................................................................................90
10.4 Structured Log Example.............................................................................................90
11. Backup Strategy..........................................................................................................95
2

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
11.1 Backup Philosophy.....................................................................................................95
11.2 Backup Schedule........................................................................................................95
11.3 Backup Architecture...................................................................................................95
12. Disaster Recovery.....................................................................................................100
12.1 DR Strategy...............................................................................................................101
12.2 DR Metrics................................................................................................................101
12.3 DR Runbook (High-Level)..........................................................................................101
13. Environment Strategy...............................................................................................106
13.1 Environment Pipeline...............................................................................................106
13.2 Environment Catalog................................................................................................108
13.3 Environment Policies................................................................................................108
14. Security.....................................................................................................................110
14.1 Security Architecture................................................................................................110
14.2 Security Controls......................................................................................................110
14.3 NetworkPolicies Sample...........................................................................................111
15. Scalability.................................................................................................................119
15.1 Scalability Strategy...................................................................................................119
15.2 Scalability Tactics......................................................................................................120
15.3 HPA + Cluster Autoscaler Flow.................................................................................120
16. Final Production Stack...............................................................................................122
16.1 Stack Summary.........................................................................................................123
16.2 Stack Justification.....................................................................................................123
17. Appendix A — Decision Drivers.................................................................................123
17.1 Key Decision Drivers.................................................................................................123
18. Appendix B — Glossary.............................................................................................124
18.1 Terms........................................................................................................................124
19. Document Control.....................................................................................................124
19.1 Document Information.............................................................................................124
3

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
19.2 Change History.........................................................................................................124
19.3 Approval Matrix........................................................................................................124
19.4 Next Steps.................................................................................................................124
Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-
click the TOC and select "Update Field."
4

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
1. Introduction
1.1 Purpose
हा(cid:2) ADR-111 PreOne च्या(cid:2) DevOps आणि(cid:8) Infrastructure Architecture ची(cid:10) complete blueprint प्र(cid:12)दा(cid:2)न
करतो(cid:18). PreOne हा(cid:19) Enterprise Preschool Operating System आहा(cid:19) जे(cid:19) 14 business domains, 530+
REST APIs, real-time WebSocket channels, आणि(cid:8) background job processing सा(cid:2)ठी(cid:10) robust,
scalable, आणि(cid:8) highly available infrastructure आवश्याक आहा(cid:19). या(cid:2) ADR ची(cid:2) primary goal म्हा(cid:8)जे(cid:19)
DevOps practices, infrastructure components, deployment strategy, आणि(cid:8) operational
runbooks ची(cid:10) एकची source of truth स्था(cid:2)णिप्रतो कर(cid:8).(cid:19)
हा(cid:2) ADR Backend TD v1.0 आणि(cid:8) Frontend Architecture v1.0 च्या(cid:2) वर build हा(cid:18)तो(cid:18) — त्या(cid:2)च्(cid:31) या(cid:2)
application architecture ला(cid:2) concrete infrastructure architecture मध्या(cid:19) translate करतो(cid:18).
Backend TD मध्या(cid:19) define क(cid:19) लाला(cid:19) (cid:19) NestJS modules, BullMQ jobs, Prisma schemas, आणि(cid:8) Redis
cache layers या(cid:2) साव#न(cid:31) (cid:2) appropriate infrastructure support आवश्याक आहा(cid:19). Frontend
Architecture मध्या(cid:19) defined Next.js SSR + React Native mobile apps दाखी(cid:19) (cid:10)ला containerized,
deployed, आणि(cid:8) monitored हा(cid:18)(cid:8) (cid:19)आवश्याक आहा(cid:19).
या(cid:2) ADR वरून प्रढी& (cid:10)ला production artifacts तोया(cid:2)र हा(cid:18)तो(cid:10)ला: Docker images (5 services), Kubernetes
manifests (Helm charts), GitHub Actions workflows (CI/CD), Terraform modules
(infrastructure-as-code), NGINX Ingress configurations, PostgreSQL HA setup (Patroni +
PgBouncer), Redis Sentinel setup, Prometheus + Grafana dashboards, Loki log queries,
Jaeger tracing dashboards, Velero backup schedules, आणि(cid:8) Production Runbook.
1.2 Scope
हा(cid:2) ADR PreOne च्या(cid:2) complete infrastructure stack cover करतो(cid:18) — local development प्र(cid:2)सान(
production deployment प्रया)तो(cid:31) . खी(cid:2)ला(cid:10)ला explicitly in scope आहा(cid:19)तो:
• Containerization strategy (Docker multi-stage builds)
• Kubernetes orchestration (namespaces, workloads, services, ingress)
• CI/CD pipeline (GitHub Actions workflows + deployment strategy)
• Reverse proxy + load balancing (NGINX Ingress)
• Database high availability (PostgreSQL HA via Patroni)
• Cache + queue backend (Redis HA via Sentinel)
• Observability stack (Prometheus + Grafana + Loki + Jaeger)
• Backup strategy + disaster recovery
• Environment strategy (Local → Dev → QA → UAT → Staging → Production)
5

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
• Security controls (TLS, secrets, RBAC, network policies)
• Scalability tactics (HPA, cluster autoscaler, CDN)
खी(cid:2)ला(cid:10)ला explicitly out of scope आहा(cid:19)तो:
• Application architecture (covered in Backend TD + Frontend Architecture)
• Domain model + database schema (covered in DDD + ERD + Prisma Schema)
• API contracts (covered in API Contract Catalog + OpenAPI Spec)
• Third-party SDK integration details (per-provider spec sheets)
• Cost analysis + billing (separate cost-optimization doc)
1.3 Audience
हा(cid:2) ADR खी(cid:2)ला(cid:10)ला audiences सा(cid:2)ठी(cid:10) णिलाणिखीतो आहा(cid:19):
• DevOps Engineers: Primary reference — infrastructure provisioning, K8s
management, deployment automation.
• SRE / On-Call Engineers: Operational runbook — monitoring, alerting, incident
response, DR drills.
• Backend / Frontend Engineers: Deployment awareness — Dockerization, health
checks, graceful shutdown.
• Security Engineers: Security review — TLS, RBAC, network policies, secrets
management.
• QA / Test Engineers: Test environments — QA + UAT + staging setup, smoke tests
in CI/CD.
• Tech Leads / Architects: Architecture enforcement — decision rationale,
alternatives, trade-offs.
• Compliance Officers: Audit reference — DR metrics, backup strategy, access
controls.
• New Hires: Onboarding reference — infrastructure mental model in first 2 weeks.
1.4 ADR Status
हा(cid:2) ADR 'LOCKED' status मध्या(cid:19) आहा(cid:19). LOCKED म्हा(cid:8)जे(cid:19) architecture decision frozen झा(cid:2)ला(cid:2) आहा(cid:19) आणि(cid:8)
v1.0 release सा(cid:2)ठी(cid:10) implementation सारू& आहा(cid:19). LOCKED status नतो(cid:31) र changes require new ADR
(e.g., ADR-112 for changes) + Architecture Review Board approval. हा(cid:19) ensure करतो(cid:19) क(cid:10)
infrastructure stability maintained र(cid:2)हा(cid:10)ला आणि(cid:8) ad-hoc changes prevent हा(cid:18)तो(cid:10)ला.
6

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
LOCKED status ची(cid:2) meaning: Docker + Kubernetes + GitHub Actions + NGINX + PostgreSQL
HA + Redis + Prometheus + Loki हा(cid:19) core stack णिनवडला(cid:19) गे(cid:19)ला(cid:19) आहा(cid:19) आणि(cid:8) या(cid:2)वर implementation ची(cid:2)ला (
आहा(cid:19). Future ADRs हा(cid:19) specific aspects extend करू शकतो(cid:2)तो — उदा(cid:2). ADR-112 (Service Mesh —
Linkerd), ADR-113 (Secrets — Vault migration), ADR-114 (Multi-region — Active-Active).
1.5 Related Documents
PreOne document series  मध्या(cid:19) या(cid:2)  ADR  ची(cid:19)  specific position  आहा(cid:19).  खी(cid:2)ला(cid:10)ला  documents
predecessors आहा(cid:19)तो:
| Document        | Version | Relationship to ADR-111 |
| --------------- | ------- | ----------------------- |
| Vision Document | v1.0    | Strategic intent — non- |
functional requirements
(scale, availability,
compliance)
| Master PRD | v1.0 | Functional requirements —  |
| ---------- | ---- | -------------------------- |
infrastructure must support
all FRs
| DDD | v1.0 | Domain model —  |
| --- | ---- | --------------- |
infrastructure must support
bounded contexts +
aggregates
| Backend TD | v1.0 | Application architecture —  |
| ---------- | ---- | --------------------------- |
Docker + K8s deployment of
NestJS modules
| Frontend Architecture | v1.0 | Web + Mobile deployment —  |
| --------------------- | ---- | -------------------------- |
Next.js SSR + React Native
build pipeline
| ADR Catalog | v1.0 | Decision context — ADR-111  |
| ----------- | ---- | --------------------------- |
is part of larger ADR series
| ERD | v3.0 | Database schema —  |
| --- | ---- | ------------------ |
PostgreSQL HA must support
physical schema
| Prisma Schema | v3.0 | ORM config — PgBouncer +  |
| ------------- | ---- | ------------------------- |
connection pooling
alignment
7

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
| Document             | Version | Relationship to ADR-111    |
| -------------------- | ------- | -------------------------- |
| API Contract Catalog | v1.0    | API endpoints — ingress +  |
rate limiting + load balancing
scope
| OpenAPI Specification | v1.0 | API contracts — Swagger UI  |
| --------------------- | ---- | --------------------------- |
hosting + mock server
deployment
8

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
2. Infrastructure Overview
2.1 High-Level Architecture
PreOne ची(cid:10) infrastructure completely containerized आहा (cid:19)आणि(cid:8) Kubernetes द्वा(cid:2)र (cid:19)orchestrated. हा(cid:10)
architecture खी(cid:2)ला(cid:10)ला principles follow करतो(cid:19): infrastructure-as-code (Terraform + Helm),
GitOps (GitHub as source of truth), immutable infrastructure (containers + declarative K8s
manifests), defense-in-depth (multiple security layers), आणि(cid:8) observability-first (metrics +
logs + traces from day one). प्र(cid:8)( ) pipeline — code commit प्र(cid:2)सान( production deployment प्रया)तो(cid:31)
— automated आहा(cid:19) आणि(cid:8) minimal manual intervention required आहा(cid:19).
Pipeline ची(cid:2) flow सामजेन( घे(cid:19)(cid:8) (cid:19) critical आहा(cid:19). Developer code push करतो(cid:18) → GitHub repository मध्या (cid:19)
change detect हा(cid:18)तो(cid:18) → GitHub Actions CI/CD pipeline triggered हा(cid:18)तो(cid:18) → code lint, test, build,
security scan हा(cid:18)तो(cid:18) → Docker image build हा(cid:18)तो(cid:18) → GitHub Container Registry (GHCR) मध्या (cid:19)push
हा(cid:18)तो(cid:18) → Kubernetes cluster मध्या(cid:19) deploy हा(cid:18)तो(cid:18) → health checks pass हा(cid:18)तो(cid:2)तो → smoke tests run
हा(cid:18)तो(cid:2)तो → traffic new deployment वर route हा(cid:18)तो(cid:18). हा(cid:19) साव) ~20 minutes मध्या (cid:19)complete हा(cid:18)तो(cid:19).
2.2 Pipeline Diagram
Developers
|
GitHub Repository
|
GitHub Actions CI/CD
|
Build - Test - Security Scan
|
Docker Image Build
|
GitHub Container Registry
|
Kubernetes (Production)
+----------------+----------------+
| | |
API Pods Web Pods Worker Pods
(NestJS) (Next.js) (BullMQ)
| | |
+----------------+----------------+
|
NGINX Ingress
|
+----------------+----------------+
| | |
PostgreSQL HA Redis Object Storage
Primary Cache/Queue (S3/MinIO)
|
9

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
     Backup & Disaster Recovery
2.3 Technology Stack
PreOne च्या(cid:2) infrastructure stack मध्या(cid:19) प्र(cid:12)त्याक(cid:19)  layer सा(cid:2)ठी(cid:10) carefully chosen technology आहा(cid:19).
Selection rationale: open-source first (avoid vendor lock-in), production-proven (no
bleeding-edge), cloud-portable (K8s abstraction),  आणि(cid:8)  operational simplicity (team
familiarity). हा(cid:19) stack v1.0 release सा(cid:2)ठी(cid:10) frozen आहा(cid:19); future migrations (e.g., Vault, Linkerd,
Redis Cluster) separate ADRs द्वा(cid:2)र(cid:19) evaluated हा(cid:18)तो(cid:10)ला.
| Layer            | Technology | Rationale                 |
| ---------------- | ---------- | ------------------------- |
| Containerization | Docker     | Industry standard; multi- |
stage builds; layer caching
| Orchestration | Kubernetes (K8s) | Auto-healing, auto-scaling,  |
| ------------- | ---------------- | ---------------------------- |
declarative config, huge
ecosystem
| CI/CD | GitHub Actions | Native GitHub integration;  |
| ----- | -------------- | --------------------------- |
matrix builds; reusable
workflows
| Reverse Proxy | NGINX Ingress Controller | Production-proven;  |
| ------------- | ------------------------ | ------------------- |
WebSocket support; rich
config
| Database | PostgreSQL HA | ACID; replication; pgvector;  |
| -------- | ------------- | ----------------------------- |
RLS; mature ecosystem
| Cache | Redis | Sub-ms reads; pub/sub;  |
| ----- | ----- | ----------------------- |
streams; BullMQ backend
| Queue | BullMQ | Built on Redis;  |
| ----- | ------ | ---------------- |
delayed/repeatable jobs;
DLQ; sandboxed processors
| Object Storage | AWS S3 / MinIO | S3 API compatible; lifecycle  |
| -------------- | -------------- | ----------------------------- |
to Glacier; MinIO for self-
hosted
| Monitoring | Prometheus + Grafana | Pull-based metrics; PromQL;  |
| ---------- | -------------------- | ---------------------------- |
rich dashboarding
| Logging | Loki + Promtail | Loki for log storage; Promtail  |
| ------- | --------------- | ------------------------------- |
for collection; Grafana for
queries
10

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Layer Technology Rationale
Tracing OpenTelemetry + Jaeger Vendor-neutral; spans
correlated to logs
Secrets Kubernetes Secrets (Vault Native K8s secrets for v1;
later) Vault migration roadmap
v1.2
Service Mesh Linkerd (future) Roadmap v1.3 — mTLS +
traffic splitting for canary
deployments
2.4 Design Principles
PreOne infrastructure खी(cid:2)ला(cid:10)ला design principles follow करतो(cid:19):
• Infrastructure-as-Code (IaC) — Terraform + Helm; no manual cluster changes
• GitOps — GitHub source of truth; ArgoCD for declarative deployment
• Immutable Infrastructure — containers are immutable; changes via new image
• Defense-in-Depth — multiple security layers (WAF + NGINX + Network Policies +
RBAC)
• Observability-First — metrics + logs + traces from day one
• 12-Factor App — stateless services, externalized config, disposability
• Cattle not Pets — pods are replaceable; no manual SSH into pods
• Progressive Delivery — rolling updates; canary via Argo Rollouts (v1.2 roadmap)
• Cost-Awareness — spot instances for non-critical; auto-scaling for efficiency
• Documentation as Code — runbooks + dashboards-as-code in Git
11

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
3. Docker Architecture
3.1 Containerization Strategy
Docker हा (cid:19)PreOne ची (cid:19)containerization standard आहा(cid:19). प्र(cid:12)त्याक(cid:19)  service (API, Web, Worker, Mobile
Build, NGINX) ची(cid:10) स्वतोत्र(cid:31)  Docker image असातो(cid:19) ज्या(cid:2)मळे& (cid:19) services independently build, version,
deploy, आणि(cid:8) scale हा(cid:18)ऊ शकतो(cid:2)तो. Docker images multi-stage builds द्वा(cid:2)र(cid:19) optimized आहा(cid:19)तो —
builder stage मध्या(cid:19) dev dependencies + build tools व(cid:2)प्ररून production artifact तोया(cid:2)र क(cid:19) ला(cid:2) जे(cid:2)तो(cid:18),
runtime stage मध्या (cid:19)फक्तो production artifact + minimal runtime copied हा(cid:18)तो(cid:18). हा(cid:19) approach final
image size कम(cid:10) करतो(cid:19) आणि(cid:8) attack surface कम(cid:10) करतो(cid:19).
Docker images क(cid:19)  साव) aspects standardized आहा(cid:19)तो: base image (node:20-alpine for runtime,
node:20 for build), non-root user (uid 1000) for security, HEALTHCHECK instruction
embedded, OCI standard labels (org.opencontainers.image.{version,revision,source}),
reproducible builds via .dockerignore + lock files, layer caching for faster rebuilds, आणि(cid:8)
image signing via cosign (Sigstore) for supply chain security.
3.2 Docker Images
| Image Name | Service | Size + Notes | Scaling |
| ---------- | ------- | ------------ | ------- |
preone-api NestJS backend Node 20 Alpine;  Horizontally scaled
|     |     | multi-stage build;  | via HPA |
| --- | --- | ------------------- | ------- |
pruned devDeps;
~110 MB
preone-web Next.js 16 frontend Node 20 Alpine;  SSR + static; HPA
|     |     | standalone output;  | scaled |
| --- | --- | ------------------- | ------ |
~140 MB
preone-mobile-build React Native + Expo  Node 20 + JDK 17;  Used in CI only —
|     | build | ~800 MB (build-only,  | produces    |
| --- | ----- | --------------------- | ----------- |
|     |       | not deployed)         | APK/AAB/IPA |
preone-worker BullMQ background  Node 20 Alpine;  Scaled by queue
|     | job processor | same base as API but  | depth |
| --- | ------------- | --------------------- | ----- |
different entrypoint
preone-nginx NGINX reverse proxy Alpine; ~25 MB;  Ingress Controller
|     |     | custom nginx.conf  | manages this |
| --- | --- | ------------------ | ------------ |
via ConfigMap
12

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
3.3 Docker Principles
Docker architecture खी(cid:2)ला(cid:10)ला principles follow करतो(cid:19):
• Each service has its own Dockerfile in its repo subfolder
• All images built via multi-stage builds (builder + runtime)
• Base image: node:20-alpine for runtime; node:20 for build
• Non-root user (uid 1000) in runtime image for security
• Health checks (HEALTHCHECK instruction) embedded in image
• Image labels: org.opencontainers.image.{version,revision,source}
• Reproducible builds via .dockerignore + lock files (bun.lock / package-lock.json)
• Layer caching: install deps before copying source code
• Distroless variant explored for v1.2 (further attack surface reduction)
• All images signed via cosign (Sigstore) — verified at deploy time
3.4 Sample Dockerfile (preone-api)
# syntax=docker/dockerfile:1.6
# ============ Builder Stage ============
FROM node:20 AS builder
WORKDIR /app
# Install bun for faster installs
RUN npm install -g bun
# Copy lock files first for layer caching
COPY package.json bun.lock ./
COPY prisma ./prisma/
# Install dependencies (including devDeps for build)
RUN bun install --frozen-lockfile
RUN bunx prisma generate
# Copy source code
COPY . .
# Build NestJS app
RUN bun run build
# Prune dev dependencies for production
RUN bun install --production --frozen-lockfile
13

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
# ============ Runtime Stage ============
FROM node:20-alpine AS runtime
WORKDIR /app
# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
adduser -S nestjs -u 1001
# Copy built artifacts + production deps from builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules
./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
# Switch to non-root user
USER nestjs
# Expose port
EXPOSE 3000
# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
# OCI labels
LABEL org.opencontainers.image.title="preone-api" \
org.opencontainers.image.description="PreOne Enterprise API" \
org.opencontainers.image.source="https://github.com/preone/api" \
org.opencontainers.image.version="${VERSION}" \
org.opencontainers.image.revision="${GIT_SHA}"
# Start with dumb-init for proper signal propagation
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
14

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
4. Kubernetes Architecture
4.1 Cluster Topology
PreOne ची(cid:19) Kubernetes cluster multi-AZ (across 3 availability zones) deployed आहा(cid:19) ज्या(cid:2)मळे& (cid:19)
single AZ failure सा(cid:2)ठी(cid:10) resilience णिमळेतो(cid:19). Cluster मध्या(cid:19) multiple node groups आहा(cid:19)तो: system node
group (CoreDNS, CNI, Ingress Controller), application node group (API, Web, Worker pods),
data node group (PostgreSQL, Redis — stateful, larger instances), आणि(cid:8) monitoring node
group (Prometheus, Loki — storage-heavy).  हा(cid:19)  separation ensure  करतो(cid:19) क(cid:10) heavy data
workloads application workloads ला(cid:2) impact कर(cid:8)(cid:2)र न(cid:2)हा(cid:10)तो.
Cluster version: Kubernetes v1.29 (latest stable). Managed via EKS (AWS Elastic Kubernetes
Service). Worker nodes: AWS Graviton (ARM64) for cost optimization; spot instances for
non-critical workloads (workers, monitoring); on-demand for critical workloads (API, Web,
DB). Cluster autoscaler automatically adds/removes nodes based on pending pods.
4.2 Namespace Architecture
Cluster मध्या(cid:19) namespaces द्वा(cid:2)र(cid:19) logical isolation आहा(cid:19). प्र(cid:12)त्याक(cid:19)  namespace ची(cid:19) specific purpose आहा(cid:19)
आणि(cid:8) NetworkPolicies enforce करतो(cid:2)तो क(cid:10) फक्तो allowed namespaces एकम(cid:19)क(cid:2)श(cid:31) (cid:10) communicate
करू शकतो(cid:2)तो. Default deny policy द्वा(cid:2)र(cid:19) defense-in-depth साणि&नणिश्चीतो हा(cid:18)तो(cid:19).
| Namespace | Workloads | Notes |
| --------- | --------- | ----- |
ingress NGINX Ingress Controller  Cluster-wide; routes external
|     | pods + LoadBalancer Service | traffic                     |
| --- | --------------------------- | --------------------------- |
| api | preone-api Deployment +     | NestJS pods; 3-30 replicas  |
|     | HPA + Service + ConfigMaps  | based on load               |
| web | preone-web Deployment +     | Next.js pods; 2-10 replicas |
HPA + Service
| worker | preone-worker Deployment     | BullMQ processors; 2-15         |
| ------ | ---------------------------- | ------------------------------- |
|        | + HPA (queue-depth based)    | replicas                        |
| redis  | Redis StatefulSet (HA mode)  | 6 replicas (3 master + 3        |
|        | + Service                    | replica); Sentinel for failover |
postgres PostgreSQL StatefulSet (HA  1 primary + 2 replicas;
|            | via Patroni) + Service  | PgBouncer sidecar      |
| ---------- | ----------------------- | ---------------------- |
| monitoring | Prometheus + Grafana +  | Pull metrics from all  |
|            | AlertManager + Node     | namespaces             |
Exporter
15

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Namespace Workloads Notes
logging Loki + Promtail + Grafana Push logs via Promtail
(shared with monitoring) DaemonSet
backup Velero + cron Jobs for Daily full + continuous WAL
backups archiving
kube-system Kubernetes system pods Managed by EKS/GKE
(CoreDNS, CNI, etc.)
4.3 Cluster Diagram
Cluster
|
+-- ingress (NGINX Ingress Controller)
+-- api (preone-api Deployment)
+-- web (preone-web Deployment)
+-- worker (preone-worker Deployment)
+-- redis (Redis StatefulSet HA)
+-- postgres (PostgreSQL StatefulSet HA via Patroni)
+-- monitoring (Prometheus + Grafana + AlertManager)
+-- logging (Loki + Promtail)
+-- backup (Velero + cron jobs)
+-- kube-system (managed by EKS)
Node Groups:
+-- system (m5.large, on-demand, 2 nodes min)
+-- app (m5.xlarge, mixed, 3-20 nodes)
+-- data (r5.xlarge, on-demand, 3 nodes min)
+-- monitoring (r5.large, spot, 2 nodes min)
4.4 Workload Types
PreOne च्या(cid:2) cluster मध्या (cid:19)णिवणिवध workload types व(cid:2)प्ररला (cid:19)जे(cid:2)तो(cid:2)तो based on workload characteristics:
• Deployment — stateless workloads (API, Web, NGINX). Rolling updates + HPA
scaling.
• StatefulSet — stateful workloads (PostgreSQL, Redis). Stable network identity +
persistent volumes.
• DaemonSet — per-node agents (Promtail, node-exporter, Filebeat). One pod per
node.
• CronJob — scheduled tasks (backups, cleanup, reports). Time-based execution.
• Job — one-off batch tasks (database migrations, seed data). Run-to-completion.
16

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
4.5 Sample Deployment Manifest (preone-api)
apiVersion: apps/v1
kind: Deployment
metadata:
name: preone-api
namespace: api
labels:
app: preone-api
tier: backend
spec:
replicas: 3
selector:
matchLabels:
app: preone-api
strategy:
type: RollingUpdate
rollingUpdate:
maxSurge: 1
maxUnavailable: 0
template:
metadata:
labels:
app: preone-api
tier: backend
spec:
serviceAccountName: preone-api
containers:
- name: api
image: ghcr.io/preone/api:1.0.0
ports:
- containerPort: 3000
name: http
envFrom:
- configMapRef:
name: preone-api-config
- secretRef:
name: preone-api-secrets
resources:
requests:
cpu: 250m
memory: 512Mi
limits:
cpu: 1000m
memory: 1Gi
livenessProbe:
httpGet:
path: /health
port: 3000
initialDelaySeconds: 30
periodSeconds: 10
17

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
readinessProbe:
httpGet:
path: /ready
port: 3000
initialDelaySeconds: 5
periodSeconds: 5
lifecycle:
preStop:
exec:
command: ["sh", "-c", "sleep 10"]
terminationGracePeriodSeconds: 60
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
name: preone-api-hpa
namespace: api
spec:
scaleTargetRef:
apiVersion: apps/v1
kind: Deployment
name: preone-api
minReplicas: 3
maxReplicas: 30
metrics:
- type: Resource
resource:
name: cpu
target:
type: Utilization
averageUtilization: 70
- type: Resource
resource:
name: memory
target:
type: Utilization
averageUtilization: 80
18

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
5. CI/CD Pipeline (GitHub Actions)
5.1 Pipeline Overview
PreOne ची(cid:10) CI/CD pipeline GitHub Actions द्वा(cid:2)र(cid:19) powered आहा(cid:19). Pipeline completely automated
आहा(cid:19) — developer code push क(cid:19) ल्या(cid:2)प्र(cid:2)सान(  production deployment प्रया)तो(cid:31)  क(cid:18)(cid:8)तो(cid:2)हा(cid:10) manual step
न(cid:2)हा(cid:10) (except production approval gate). Pipeline stages द्वा(cid:2)र(cid:19) quality gates enforce हा(cid:18)तो(cid:2)तो —
एकहा(cid:10)  stage fail  झा(cid:2)ल्या(cid:2)सा  pipeline stop  हा(cid:18)तो(cid:18) आणि(cid:8)  deployment blocked  हा(cid:18)तो(cid:18).  हा(cid:19)  approach
production quality साणि&नणिश्चीतो करतो(cid:18) आणि(cid:8) broken code production मध्या(cid:19) reach हा(cid:18)(cid:8)(cid:2)र न(cid:2)हा(cid:10) या(cid:2)ची(cid:10)
ग्या(cid:2)रटी(cid:31) (cid:10) दातो(cid:19) (cid:18).
Pipeline design principles: fast feedback (lint + unit tests < 5 min), fail-fast (stop on first
failure), reproducible (lock files + pinned action versions), observable (status checks visible
in PR), recoverable (auto-rollback on health check failure). Pipeline runs on every push
(feature branch) + every PR (against main). Production deploy फक्तो main branch merge नतो(cid:31) र
+ manual approval.
5.2 Pipeline Stages
| Stage | Action | Description | Duration |
| ----- | ------ | ----------- | -------- |
1. Developer Push Git push to feature  Triggers workflow on  Seconds
|     | branch on GitHub | push event |     |
| --- | ---------------- | ---------- | --- |
2. Lint ESLint + Prettier +  Fails on lint errors;  ~30 seconds
|     | TypeScript check | auto-fix comments  |     |
| --- | ---------------- | ------------------ | --- |
via bot
3. Unit Tests Vitest for backend;  Coverage threshold  ~2 minutes
|                  | Jest for frontend    | 80%; fails below    |            |
| ---------------- | -------------------- | ------------------- | ---------- |
| 4. Build         | tsc build + Next.js  | Produces dist/      | ~3 minutes |
|                  | build + NestJS build | or .next/ artifacts |            |
| 5. Security Scan | Trivy (image), Snyk  | Fails on            | ~2 minutes |
|                  | (deps), GitLeaks     | HIGH/CRITICAL       |            |
|                  | (secrets)            | vulnerabilities     |            |
6. Docker Build Multi-stage build via  Layer caching via  ~4 minutes
|     | docker/build-push- | GHA cache |     |
| --- | ------------------ | --------- | --- |
action
19

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Stage Action Description Duration
7. Push to Registry GHCR (GitHub Tagged with SHA + ~1 minute
Container Registry) branch + semantic
version
8. Deploy to kubectl apply via Rolling update with ~3 minutes
Kubernetes Helm chart readiness probes
9. Health Check Wait for pods Ready Auto-rollback if ~1 minute
+ run smoke tests health check fails
10. Smoke Tests Playwright e2e Critical user journeys ~2 minutes
against new only (~10 tests)
deployment
11. Production (if Auto-deploy on Manual approval Manual + 5 min
main branch) merge to main gate for v1.0
5.3 Pipeline Diagram
Developer Push
|
v
GitHub
|
v
Lint
|
v
Unit Tests
|
v
Build
|
v
Security Scan
|
v
Docker Build
|
v
Push to Registry
|
v
Deploy to K8s
|
v
Health Check
|
20

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
v
Smoke Tests
|
v
Production
5.4 Sample GitHub Actions Workflow
name: CI/CD Pipeline
on:
push:
branches: [main, develop]
pull_request:
branches: [main, develop]
env:
REGISTRY: ghcr.io
IMAGE_NAME: ${{ github.repository }}
jobs:
lint:
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
with:
node-version: 20
cache: 'bun'
- run: bun install --frozen-lockfile
- run: bun run lint
- run: bun run typecheck
test:
needs: lint
runs-on: ubuntu-latest
services:
postgres:
image: postgres:16
env:
POSTGRES_PASSWORD: test
ports: ['5432:5432']
redis:
image: redis:7-alpine
ports: ['6379:6379']
steps:
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
with:
node-version: 20
21

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
- run: bun install --frozen-lockfile
- run: bunx prisma migrate deploy
env:
DATABASE_URL: postgresql://postgres:test@localhost:5432/test
- run: bun run test:unit -- --coverage
- run: bun run test:integration
- name: Upload coverage
uses: codecov/codecov-action@v4
security-scan:
needs: test
runs-on: ubuntu-latest
steps:
- uses: actions/checkout@v4
- name: Trivy filesystem scan
uses: aquasecurity/trivy-action@master
with:
scan-type: fs
scan-ref: '.'
severity: 'CRITICAL,HIGH'
fail-on-severity: 'CRITICAL'
- name: Snyk dependency scan
uses: snyk/actions/node@master
env:
SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
- name: GitLeaks secrets scan
uses: gitleaks/gitleaks-action@v2
docker-build-push:
needs: security-scan
runs-on: ubuntu-latest
permissions:
contents: read
packages: write
steps:
- uses: actions/checkout@v4
- uses: docker/setup-buildx-action@v3
- name: Login to GHCR
uses: docker/login-action@v3
with:
registry: ${{ env.REGISTRY }}
username: ${{ github.actor }}
password: ${{ secrets.GITHUB_TOKEN }}
- name: Build + Push
uses: docker/build-push-action@v5
with:
context: .
push: true
tags: |
${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
22

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:$
{{ github.ref_name }}
cache-from: type=gha
cache-to: type=gha,mode=max
deploy:
needs: docker-build-push
if: github.ref == 'refs/heads/main'
runs-on: ubuntu-latest
environment: production
steps:
- uses: actions/checkout@v4
- uses: azure/setup-kubectl@v4
- name: Configure AWS credentials
uses: aws-actions/configure-aws-credentials@v4
with:
aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
aws-region: ap-south-1
- name: Update kubeconfig
run: aws eks update-kubeconfig --name preone-prod --region ap-south-1
- name: Deploy via Helm
run: |
helm upgrade --install preone-api ./helm/preone-api \
--namespace api --create-namespace \
--set image.tag=${{ github.sha }} \
--wait --timeout 5m
- name: Wait for rollout
run: kubectl rollout status deployment/preone-api -n api --timeout=5m
- name: Smoke tests
run: bun run test:smoke -- --base-url=https://api.preone.com
23

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
6. NGINX Ingress
6.1 Role of NGINX
NGINX Ingress Controller हा(cid:2) PreOne ची(cid:2) single entry point आहा (cid:19)साव) external traffic सा(cid:2)ठी(cid:10). NGINX
च्या(cid:2) आध(cid:10) Cloudflare (CDN + WAF + DDoS protection) आहा(cid:19) जे(cid:18) edge security + static asset
caching handle करतो(cid:18). NGINX च्या(cid:2) प्र(cid:2)ठी(cid:10)श(cid:10) multiple service namespaces आहा(cid:19)तो (api, web) ज्या(cid:2)न(cid:31)
(cid:2)
NGINX path-based routing द्वा(cid:2)र(cid:19) traffic route करतो(cid:18). NGINX Ingress Controller K8s-native
implementation  आहा(cid:19) जे(cid:18)  Ingress resources watch  करतो(cid:18) आणि(cid:8)  nginx.conf automatically
generate करतो(cid:18).
NGINX च्या(cid:2) core responsibilities: SSL termination (TLS 1.3), reverse proxy (routes /api/* to
api service, /* to web service), load balancing (round-robin with health checks), rate
limiting (per-IP + per-user), compression (Gzip + Brotli), security headers (OWASP-
recommended), WebSocket support (Socket.IO long-polling fallback also supported), आणि(cid:8)
access logging (JSON format with traceId). NGINX ची (cid:19)config ConfigMaps द्वा(cid:2)र (cid:19)managed हा(cid:18)तो(cid:18) जे(cid:18)
GitOps approach follow करतो(cid:18).
6.2 Responsibilities
| Responsibility | Configuration | Notes |
| -------------- | ------------- | ----- |
SSL Termination TLS 1.3 certificates managed  Auto-renewal at 30 days
|     | via cert-manager + Let's  | before expiry |
| --- | ------------------------- | ------------- |
Encrypt
| Reverse Proxy | Routes /api/* to api  | Path-based routing |
| ------------- | --------------------- | ------------------ |
Service, /* to web Service
Load Balancing Round-robin with health  Per-upstream load balancing
checks; max_fails=3
fail_timeout=30s
Rate Limiting Per-IP rate limit via  100 req/s default; 1000 req/s
|     | limit_req_zone; burst +  | for whitelisted partners |
| --- | ------------------------ | ------------------------ |
nodelay
Compression Gzip for text/*; Brotli for  Compression level 6; min
|                  | clients supporting it      | length 256 bytes   |
| ---------------- | -------------------------- | ------------------ |
| Security Headers | HSTS, X-Content-Type-      | OWASP-recommended  |
|                  | Options, X-Frame-Options,  | headers            |
CSP
24

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Responsibility Configuration Notes
WebSocket Support Upgrade: websocket header Socket.IO long-polling
pass-through fallback also supported
Client Caching Cache-Control for static Fingerprinted asset filenames
assets (1 year immutable)
Request Body Size Limit client_max_body_size 50m For file uploads; larger via
dedicated upload endpoint
Access Logging JSON format logs to stdout; Includes traceId for
piped to Promtail correlation
6.3 Sample Ingress Manifest
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
name: preone-ingress
namespace: ingress
annotations:
kubernetes.io/ingress.class: nginx
cert-manager.io/cluster-issuer: letsencrypt-prod
nginx.ingress.kubernetes.io/ssl-protocols: 'TLSv1.3'
nginx.ingress.kubernetes.io/limit-rps: '100'
nginx.ingress.kubernetes.io/limit-burst: '200'
nginx.ingress.kubernetes.io/proxy-body-size: '50m'
nginx.ingress.kubernetes.io/proxy-read-timeout: '300'
nginx.ingress.kubernetes.io/proxy-send-timeout: '300'
nginx.ingress.kubernetes.io/configuration-snippet: |
more_set_headers 'X-Content-Type-Options: nosniff';
more_set_headers 'X-Frame-Options: DENY';
more_set_headers 'X-XSS-Protection: 1; mode=block';
more_set_headers 'Strict-Transport-Security: max-age=31536000;
includeSubDomains';
more_set_headers 'Content-Security-Policy: default-src \'self\'; script-src
\'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:
https:; font-src \'self\' data:;';
nginx.ingress.kubernetes.io/server-snippet: |
gzip on;
gzip_comp_level 6;
gzip_min_length 256;
gzip_types text/plain text/css application/json application/javascript
text/xml application/xml;
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css application/json application/javascript;
spec:
tls:
25

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
- hosts:
- api.preone.com
- app.preone.com
secretName: preone-tls
rules:
- host: api.preone.com
http:
paths:
- path: /
pathType: Prefix
backend:
service:
name: preone-api
port:
number: 80
- host: app.preone.com
http:
paths:
- path: /api
pathType: Prefix
backend:
service:
name: preone-api
port:
number: 80
- path: /
pathType: Prefix
backend:
service:
name: preone-web
port:
number: 80
- path: /socket.io
pathType: Prefix
backend:
service:
name: preone-api
port:
number: 80
26

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
7. PostgreSQL High Availability
7.1 HA Architecture
PostgreSQL HA PreOne ची(cid:2) critical infrastructure component आहा(cid:19). Database failure म्हा(cid:8)जे(cid:19)
complete platform outage, त्या(cid:2)मळे& (cid:19) database HA design साव#तो जे(cid:2)स्तो careful आहा(cid:19). PreOne
Patroni-based HA solution व(cid:2)प्ररतो(cid:18) जे(cid:18) etcd cluster द्वा(cid:2)र (cid:19)leader election handle करतो(cid:18). Cluster मध्या (cid:19)
1 primary + 2 replicas आहा(cid:19)तो. Primary साव) writes handle करतो(cid:18), replicas साव) reads (via
PgBouncer) handle करतो(cid:2)तो. Automatic failover < 30 seconds मध्या(cid:19) complete हा(cid:18)तो(cid:18) — primary
failure detect → new primary election → connection rerouting via PgBouncer.
HA architecture ची (cid:19)key components: Patroni (HA manager), etcd (distributed consensus for
leader election), PgBouncer (connection pooling + read/write splitting), pgBackRest
(backup + WAL archiving), postgres_exporter (Prometheus metrics). साव) components
containerized आहा(cid:19)तो आणि(cid:8) StatefulSet द्वा(cid:2)र(cid:19) managed हा(cid:18)तो(cid:2)तो ज्या(cid:2)मळे& (cid:19) stable network identity +
persistent volumes ensure हा(cid:18)तो(cid:2)तो.
7.2 HA Diagram
PostgreSQL HA
|
Primary Database
|
Streaming Replication
|
Read Replica 1
|
Read Replica 2
+---------------------------------+
| Patroni + etcd |
| (Leader Election + Failover)|
+---------------------------------+
|
PgBouncer Sidecar
(per-pod; 1000 conns)
|
Application Pods
27

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
7.3 HA Features
| Feature | Implementation | Notes |
| ------- | -------------- | ----- |
Automatic Failover Patroni + etcd-based leader  Failover < 30 seconds; client
|     | election | reconnect via PgBouncer |
| --- | -------- | ----------------------- |
Streaming Replication Synchronous for writes;  1 sync standby + 2 async
|     | async for read replicas | standbys |
| --- | ----------------------- | -------- |
Read Scaling PgBouncer routes reads to  Application marks queries
|     | replicas | with /* replica */ comment  |
| --- | -------- | --------------------------- |
hint
PITR (Point-in-Time  WAL archiving to S3; restore  Last 7 days PITR window
| Recovery)     | to any timestamp        |                  |
| ------------- | ----------------------- | ---------------- |
| WAL Archiving | archive_command pushes  | RPO < 15 minutes |
WAL files to S3 every 200ms
Connection Pooling PgBouncer sidecar per pod;  transaction-mode pooling
1000 connections per pool
Backups pgBackRest daily full +  30-day retention; S3 lifecycle
|     | continuous incremental | to Glacier |
| --- | ---------------------- | ---------- |
Vacuuming Autovacuum tuned per table;  Prevents bloat; runs in
|     | aggressive on high-churn  | background |
| --- | ------------------------- | ---------- |
tables
| Monitoring | postgres_exporter →  | Replication lag, connection  |
| ---------- | -------------------- | ---------------------------- |
|            | Prometheus → Grafana | count, cache hit ratio       |
Extensions pgvector, pgcrypto, pg_trgm,  Enabled via Postgres initdb
|     | unaccent, uuid-ossp | scripts |
| --- | ------------------- | ------- |
7.4 Connection Pooling Strategy
PgBouncer  हा(cid:19)  PreOne  ची(cid:19)  connection pooling layer  आहा(cid:19) जे(cid:18)  PostgreSQL connections  च्या(cid:2)
exhaustion ला(cid:2) prevent करतो(cid:18). PgBouncer sidecar pattern मध्या(cid:19) deploy झा(cid:2)लाला(cid:19) (cid:2) आहा(cid:19) — प्र(cid:12)त्याक(cid:19)
Postgres pod मध्या(cid:19) PgBouncer container alongside run हा(cid:18)तो(cid:18). PgBouncer transaction-mode
pooling व(cid:2)प्ररतो(cid:18) ज्या(cid:2)मळे& (cid:19) connection per transaction असातो(cid:19), न क(cid:10) connection per session. हा(cid:19)
approach connection count कम(cid:10) करतो(cid:19) (1000 → ~50 actual Postgres connections) आणि(cid:8)
performance improve हा(cid:18)तो(cid:19).
Read/write splitting द्वा(cid:2)र(cid:19) read replicas ची(cid:2) efficient use हा(cid:18)तो(cid:18). PgBouncer configured आहा(cid:19) ज्या(cid:2)मळे& (cid:19)
queries with /* replica */ comment hint read replicas ला(cid:2) route हा(cid:18)तो(cid:2)तो, बा(cid:2)क(cid:10) साव) queries
28

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
primary ला(cid:2) route हा(cid:18)तो(cid:2)तो. Reports dashboard आणि(cid:8) analytics endpoints read replicas व(cid:2)प्ररतो(cid:2)तो
ज्या(cid:2)मळे& (cid:19) primary वर जे(cid:18)र कम(cid:10) प्रडतो(cid:18). PgBouncer प्र(cid:12)त्याक(cid:19) pool सा(cid:2)ठी(cid:10) max 1000 client connections + 50
server connections allow करतो(cid:18).
29

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
8. Redis
8.1 Role of Redis
Redis हा(cid:19) PreOne ची(cid:2) second most critical infrastructure component आहा(cid:19) Postgres नतो(cid:31) र. Redis
multiple roles handle करतो(cid:18) — cache, session store, rate limiter, OTP cache, BullMQ queue
backend, distributed locks, real-time pub/sub, feature flags, idempotency store, आणि(cid:8) geo
indexing. हा (cid:19)साव )use cases single Redis cluster द्वा(cid:2)र (cid:19)handled हा(cid:18)तो(cid:2)तो प्र(cid:8) separate logical databases
(db 0-9) द्वा(cid:2)र (cid:19)isolation आहा(cid:19). Redis Sentinel द्वा(cid:2)र (cid:19)HA ensured आहा (cid:19)— 3 master + 3 replica nodes +
3 Sentinel monitors.
Redis cluster ची (cid:19)key characteristics: 6 nodes (3 master + 3 replica) across 3 AZs, Sentinel for
automatic failover (< 10 seconds), AOF + RDB persistence enabled, maxmemory-policy =
allkeys-lru, maxmemory = 8 GB per node, TLS for in-transit encryption, AUTH password for
access control. Redis monitoring via redis_exporter → Prometheus → Grafana dashboard
with alerts on memory usage, connection count, hit rate, replication lag.
8.2 Use Cases
| Use Case  | Description             | TTL / Notes             |
| --------- | ----------------------- | ----------------------- |
| API Cache | Hot endpoint responses  | Permission cache, menu  |
|           | cached (5-60s TTL)      | cache, lookup data      |
Session Store JWT refresh tokens, OTP  TTL-based expiry; atomic
|     | attempts, idempotency keys | operations |
| --- | -------------------------- | ---------- |
Rate Limiting Per-IP + per-user rate limit  Sliding window via sorted
|     | counters | sets |
| --- | -------- | ---- |
OTP Cache OTP codes with 5-min TTL;  Atomic INCR + EXPIRE for
|     | max 3 attempts | race-condition-free  |
| --- | -------------- | -------------------- |
validation
Queue Backend (BullMQ) Job queue + delayed jobs +  Persistent across restarts;
|     | repeatable jobs | DLQ for failures |
| --- | --------------- | ---------------- |
Distributed Locks Redis Redlock algorithm for  Used in scheduled jobs to
|     | cross-pod coordination | prevent duplicates |
| --- | ---------------------- | ------------------ |
Real-time Pub/Sub WebSocket fan-out across  Socket.IO Redis Adapter for
|     | pods via Redis Adapter | multi-pod broadcast |
| --- | ---------------------- | ------------------- |
Feature Flags Per-tenant feature flag cache  Refreshed from Postgres on
|     | (5-min TTL) | cache miss |
| --- | ----------- | ---------- |
30

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Use Case Description TTL / Notes
Idempotency Store Request fingerprint → Prevents duplicate writes on
response cache (24-hour TTL) retry
Geo Indexing Transport vehicle live Haversine queries for nearest
location via Redis GEO vehicle
8.3 Redis HA Setup
Redis Cluster Topology:
+-- redis-0 (Master, AZ-a)
+-- redis-1 (Master, AZ-b)
+-- redis-2 (Master, AZ-c)
+-- redis-3 (Replica of redis-0, AZ-b)
+-- redis-4 (Replica of redis-1, AZ-c)
+-- redis-5 (Replica of redis-2, AZ-a)
+-- sentinel-0 (Sentinel, AZ-a)
+-- sentinel-1 (Sentinel, AZ-b)
+-- sentinel-2 (Sentinel, AZ-c)
Failover Behavior:
1. Sentinel monitors Master nodes every 1s
2. Master unresponsive for 30s -> mark as down
3. Sentinels elect new Master via quorum
4. Replica promoted to Master
5. Clients re-connect via Sentinel discovery
6. Total failover time < 10 seconds
Persistence:
- AOF (appendonly.aof) every 1s (fsync)
- RDB snapshot every 6 hours
- Backups to S3 every 6 hours (7-day retention)
8.4 Logical Database Allocation
Redis मध्या (cid:19)16 logical databases (db 0-15) supported आहा(cid:19)तो. PreOne च्या(cid:2) convention प्र(cid:12)म(cid:2)(cid:8) (cid:19)each
use case ची(cid:2) separate database आहा(cid:19) ज्या(cid:2)मळे& (cid:19) isolation + monitoring clear हा(cid:18)तो(cid:19):
• db 0 — API Cache (hot endpoint responses)
• db 1 — Session Store (JWT refresh tokens, OTP attempts)
• db 2 — Rate Limiting (per-IP + per-user counters)
• db 3 — OTP Cache (mobile → OTP mapping with TTL)
• db 4 — BullMQ Queues (job queues per domain)
• db 5 — Distributed Locks (Redlock + scheduled jobs)
31

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
• db 6 — Pub/Sub (WebSocket fan-out via Redis Adapter)
• db 7 — Feature Flags (per-tenant config cache)
• db 8 — Idempotency Store (request fingerprint → response)
• db 9 — Geo Indexing (transport vehicle live location)
9. Monitoring
9.1 Monitoring Architecture
PreOne ची(cid:10) monitoring stack Prometheus + Grafana + AlertManager द्वा(cid:2)र(cid:19) powered आहा(cid:19).
Monitoring हा(cid:19) observability ची(cid:2) first pillar आहा(cid:19) — 'what is happening' answer करतो(cid:19).
Prometheus pull-based model व(cid:2)प्ररतो(cid:18) ज्या(cid:2)मळे& (cid:19) applications metrics expose करतो(cid:2)तो (/metrics
endpoint) आणि(cid:8) Prometheus त्या(cid:2)न(cid:31) (cid:2) periodically scrape करतो(cid:18). Grafana dashboards metrics
visualize करतो(cid:2)तो आणि(cid:8) AlertManager alerts route करतो(cid:18) (Email, Slack, PagerDuty).
Monitoring stack architecture: Applications expose /metrics endpoint via prom-client
(Node.js library) → Prometheus scrapes every 15s → Prometheus stores in time-series DB
(15-day retention) → Grafana queries via PromQL → AlertManager evaluates alert rules
every 30s → routes to on-call engineer via PagerDuty + Slack #engineering-alerts. SLO burn
rate tracking द्वा(cid:2)र(cid:19) error budget consumption monitored हा(cid:18)तो(cid:18) — high burn rate trigger करतो(cid:18)
incident review.
9.2 Monitoring Pipeline
Applications
|
v
Prometheus
|
v
Grafana Dashboards
|
v
AlertManager
|
v
Email / Slack / PagerDuty
32

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
9.3 Monitored Metrics
| Metric | Scope | Source | Alert Threshold |
| ------ | ----- | ------ | --------------- |
CPU / Memory Container + pod +  node-exporter +  Alert if CPU > 80%
|     | node level | cAdvisor | for 5 min |
| --- | ---------- | -------- | --------- |
API Latency p50, p90, p99 per  Prometheus  Alert if p99 > 1s for 5
|     | endpoint | histogram | min |
| --- | -------- | --------- | --- |
Error Rate 5xx responses per  Prometheus counter Alert if > 1% for 2
|     | second |     | min |
| --- | ------ | --- | --- |
Database  Active + idle  pgbouncer_exporter Alert if > 80% pool
| Connections | connections per pool |     | capacity |
| ----------- | -------------------- | --- | -------- |
Redis Health Memory usage,  redis_exporter Alert if memory >
|     | connected clients,  |     | 80% |
| --- | ------------------- | --- | --- |
ops/sec
Queue Length BullMQ queue depth  bull-board + custom  Alert if > 1000
|     | per queue | exporter | pending for 5 min |
| --- | --------- | -------- | ----------------- |
Pod Restarts Restart count per  kube-state-metrics Alert if > 3 restarts in
|     | pod |     | 10 min |
| --- | --- | --- | ------ |
Storage Usage PVC + node disk  kubelet metrics Alert if PVC > 85%
usage
Replication Lag Postgres + Redis  Built-in metrics Alert if lag > 5
|     | replica lag |     | seconds |
| --- | ----------- | --- | ------- |
HTTP Status  2xx / 4xx / 5xx  NGINX exporter Anomaly detection
| Distribution | counts per service |     | on 5xx spike |
| ------------ | ------------------ | --- | ------------ |
Business Metrics Admissions  Custom Prometheus  Dashboard-only;
|     | submitted, fees  | gauges | alert via Grafana  |
| --- | ---------------- | ------ | ------------------ |
|     | collected,       |        | thresholds         |
attendance marked
SLO Burn Rate Error budget  Derived metric Alert if burn rate > 2x
|     | consumption per SLO |     | normal |
| --- | ------------------- | --- | ------ |
9.4 Sample Prometheus Alert Rules
# prometheus-rules.yaml
groups:
  - name: preone-alerts
    rules:
      - alert: HighCPUUsage
33

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
expr: |
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}
[5m])) * 100) > 80
for: 5m
labels:
severity: warning
team: devops
annotations:
summary: 'High CPU usage on {{ $labels.instance }}'
description: 'CPU usage > 80% for 5 minutes'
- alert: HighAPIErrorRate
expr: |
sum(rate(http_requests_total{status=~"5.."}[2m])) by(service)
/ sum(rate(http_requests_total[2m])) by(service) > 0.01
for: 2m
labels:
severity: critical
team: backend
annotations:
summary: 'High error rate on {{ $labels.service }}'
description: '5xx error rate > 1% for 2 minutes'
- alert: HighAPILatency
expr: |
histogram_quantile(0.99,
sum(rate(http_request_duration_seconds_bucket[5m]))
by(le, service)) > 1
for: 5m
labels:
severity: warning
team: backend
annotations:
summary: 'High p99 latency on {{ $labels.service }}'
description: 'p99 latency > 1s for 5 minutes'
- alert: PostgresReplicationLag
expr: pg_replication_lag_seconds > 5
for: 2m
labels:
severity: critical
team: devops
annotations:
summary: 'PostgreSQL replication lag > 5s'
- alert: RedisMemoryHigh
expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
for: 5m
labels:
severity: warning
34

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
team: devops
annotations:
summary: 'Redis memory usage > 80%'
- alert: PodRestartLoop
expr: increase(kube_pod_container_status_restarts_total[10m]) > 3
for: 1m
labels:
severity: warning
team: devops
annotations:
summary: 'Pod {{ $labels.pod }} restarting frequently'
- alert: QueueBacklog
expr: bullmq_pending_jobs > 1000
for: 5m
labels:
severity: warning
team: backend
annotations:
summary: 'BullMQ queue {{ $labels.queue }} backlog > 1000'
35

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
10. Logging
10.1 Logging Architecture
Logging हा (cid:19)observability ची(cid:2) second pillar आहा (cid:19)— 'why is it happening' answer करतो(cid:19). PreOne ची(cid:10)
logging stack Loki + Promtail + Grafana द्वा(cid:2)र (cid:19)powered आहा(cid:19). Loki हा (cid:19)Grafana Labs ची (cid:19)horizontally-
scalable log aggregation system आहा (cid:19)जे (cid:19)Elasticsearch/Loki comparison मध्या (cid:19)cost-effective आहा(cid:19)
क(cid:2)र(cid:8) तो (cid:19)फक्तो metadata indexes करतो(cid:18) (न क(cid:10) full-text index). Promtail हा (cid:19)log shipping agent आहा(cid:19)
जे(cid:18) DaemonSet म्हा(cid:8)न( साव) nodes वर deploy झा(cid:2)लाला(cid:19) (cid:2) आहा(cid:19) आणि(cid:8) container logs scrape करतो(cid:18).
Application logs Pino (Node.js JSON logger) द्वा(cid:2)र(cid:19) emitted हा(cid:18)तो(cid:2)तो — stdout कड(cid:19) write हा(cid:18)तो(cid:2)तो.
Promtail container logs /var/log/pods/*.log प्र(cid:2)सान( scrape करतो(cid:18), JSON parse करतो(cid:18), traceId +
tenantId + userId जेसा (cid:19)labels extract करतो(cid:18), आणि(cid:8) Loki कड(cid:19) push करतो(cid:18). Grafana Loki queries via
LogQL (PromQL-like syntax) द्वा(cid:2)र(cid:19) support करतो(cid:18). Dashboards pre-built आहा(cid:19)तो per service (API,
Web, Worker) आणि(cid:8) per log type (requests, audit, errors, jobs).
10.2 Logging Pipeline
Application Logs
|
v
Promtail
(DaemonSet per node)
|
v
Loki
(Log Storage + Index)
|
v
Grafana
(Log Queries + Views)
10.3 Log Types
Log Type Content When Emitted Format
API Requests HTTP method, path, Per-request log Pino JSON format
status, latency, emitted by NestJS
userId, traceId interceptor
Authentication Login attempts, OTP Always logged with Security audit trail
send, token refresh, userId + IP +
logout userAgent
36

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
| Log Type   | Content                  | When Emitted    | Format      |
| ---------- | ------------------------ | --------------- | ----------- |
| Audit Logs | Entity changes           | Stored in DB +  | Compliance  |
|            | (before/after diff) for  | shipped to Loki | requirement |
sensitive operations
Background Jobs Job start, success,  Per-job log with  BullMQ
|     | failure, retry, DLQ | jobId + queueName  | instrumentation |
| --- | ------------------- | ------------------ | --------------- |
+ duration
| Exceptions | Unhandled errors    | Pino + Sentry  | Alert to Slack      |
| ---------- | ------------------- | -------------- | ------------------- |
|            | with stack trace +  | integration    | #engineering-alerts |
context
Infrastructure Events Pod starts/stops,  Kubernetes event  Via kubernetes-
|     | HPA scaling, failovers | stream → Loki | event-exporter |
| --- | ---------------------- | ------------- | -------------- |
WebSocket  Connect, disconnect,  Per-connection log  Socket.IO
| Connections    | room joins, message  | with socketId +     | middleware        |
| -------------- | -------------------- | ------------------- | ----------------- |
|                | count                | userId              |                   |
| Database Slow  | Queries > 500ms      | Postgres            | Tuning + anomaly  |
| Queries        | with query +         | log_min_duration_st | detection         |
|                | duration             | atement             |                   |
Cache Hit/Miss Cache hit ratio per  Redis MONITOR  Performance tuning
|     | cache key prefix | (sampled) |     |
| --- | ---------------- | --------- | --- |
Deployment Events Image deployed,  GitHub Actions +  Audit + compliance
|     | version, who  | ArgoCD notifications |     |
| --- | ------------- | -------------------- | --- |
triggered, smoke test
result
10.4 Structured Log Example
{
  "level": "info",
  "time": 1736832000000,
  "msg": "Request completed",
  "traceId": "550e8400-e29b-41d4-a716-446655440000",
  "spanId": "a1b2c3d4e5f6",
  "method": "POST",
  "path": "/api/v1/students",
  "status": 201,
  "durationMs": 145,
  "userId": "usr_01HXY...",
  "tenantId": "ten_01HXY...",
  "branchId": "br_01HXY...",
  "ip": "192.168.1.100",
37

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
"userAgent": "Mozilla/5.0...",
"requestId": "req_01HXY...",
"service": "preone-api",
"version": "1.0.0",
"hostname": "preone-api-7f8b9c6d4-x2y3z"
}
# LogQL query examples:
# 1. All 5xx errors in last hour
{service="preone-api"} | json | level="error" | status >= 500
# 2. Slow requests (>500ms) for specific tenant
{service="preone-api", tenantId="ten_01HXY..."} | json | durationMs > 500
# 3. Count errors per service in last 5 minutes
sum by (service) (count_over_time({level="error"}[5m]))
# 4. Audit logs for specific user
{logType="audit", userId="usr_01HXY..."} | json
38

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
11. Backup Strategy
11.1 Backup Philosophy
Backups  हा(cid:19)  PreOne  च्या(cid:2)  disaster recovery  ची(cid:2)  foundation  आहा(cid:19)तो. Backup strategy  खी(cid:2)ला(cid:10)ला
principles follow करतो(cid:19): 3-2-1 rule (3 copies, 2 different media, 1 offsite), automated (no
manual backups), tested (daily restore tests), encrypted (at rest + in transit), versioned
(multiple point-in-time restores), आणि(cid:8) documented (runbook for every backup type).
PreOne च्या(cid:2) backup stack मध्या(cid:19) Velero (K8s resources + PVs), pgBackRest (Postgres), Redis
BGSAVE (Redis), S3 cross-region replication (object storage), आणि(cid:8) GitHub mirror (source
code) included आहा(cid:19)तो.
Backup verification critical आहा(cid:19) — untested backup हा(cid:2) no backup ची साम(cid:2)न आहा(cid:19). PreOne मध्या (cid:19)
daily automated restore tests run हा(cid:18)तो(cid:2)तो जे(cid:19) QA cluster मध्या(cid:19) restore करतो(cid:2)तो आणि(cid:8) smoke tests
execute करतो(cid:2)तो. Restore test failure trigger करतो(cid:18) PagerDuty alert. Quarterly full DR drill
execute हा(cid:18)तो(cid:18) णिजेथा(cid:19) complete production cluster restore simulate क(cid:19) ला(cid:2) जे(cid:2)तो(cid:18).
11.2 Backup Schedule
| Component       | Frequency          | Retention | Storage / Notes  |
| --------------- | ------------------ | --------- | ---------------- |
| PostgreSQL Full | Daily at 02:00 IST | 30 Days   | pgBackRest → S3  |
(encrypted); lifecycle
to Glacier at 7 days
| PostgreSQL WAL | Continuous (every  | 7 Days | archive_command →    |
| -------------- | ------------------ | ------ | -------------------- |
|                | WAL segment)       |        | S3; enables PITR up  |
to 7 days back
PostgreSQL Base  Weekly (Sunday  4 Weeks Full base backup for
| Backup | 01:00 IST) |     | faster PITR  |
| ------ | ---------- | --- | ------------ |
restoration
| Redis Snapshot | Every 6 hours | 7 Days | BGSAVE → S3;  |
| -------------- | ------------- | ------ | ------------- |
restore on cold start
Object Storage (S3) Daily incremental via  30 Days Cross-region
|     | S3 replication |     | replication to DR  |
| --- | -------------- | --- | ------------------ |
region
Kubernetes Config Daily via Velero 30 Days ConfigMaps, Secrets,
Deployments,
StatefulSets
39

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Component Frequency Retention Storage / Notes
Kubernetes PVs Daily via Velero + 30 Days File-system-level
Restic backup for PVs
GitHub Repository Daily mirror to Indefinite Disaster recovery for
Bitbucket source code
Container Images GHCR + replicate to Indefinite Image retention
ECR (DR region) policy: keep last 100
per tag
Grafana Dashboards Daily export to Git Indefinite Dashboards-as-code
via Grafana Operator
11.3 Backup Architecture
Backup Sources:
+-- PostgreSQL (primary)
| |
| +--> pgBackRest full backup (daily 02:00)
| +--> WAL archive (continuous)
| +--> Base backup (weekly Sunday 01:00)
| |
| v
| S3 (encrypted, cross-region replicated)
| |
| +--> Glacier (after 7 days)
|
+-- Redis (master)
| |
| +--> BGSAVE (every 6 hours)
| |
| v
| S3 (encrypted)
|
+-- Object Storage (S3)
| |
| +--> Cross-region replication (continuous)
|
+-- Kubernetes (cluster state)
| |
| +--> Velero backup (daily)
| |
| v
| S3 (encrypted)
|
+-- GitHub (source code)
|
+--> Mirror to Bitbucket (daily)
40

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Verification:
+-- Daily restore test (automated, QA cluster)
+-- Quarterly DR drill (manual, full simulation)
+-- Monthly DR report (RPO/RTO actual vs target)
41

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
12. Disaster Recovery
12.1 DR Strategy
Disaster Recovery (DR) हा(cid:19) PreOne च्या(cid:2) business continuity ची(cid:2) critical component आहा(cid:19). DR
strategy दा(cid:18)न pillars वर built आहा(cid:19): RPO (Recovery Point Objective — max acceptable data loss)
आणि(cid:8) RTO (Recovery Time Objective — max acceptable downtime). PreOne ची (cid:19)targets: RPO ≤
15 minutes, RTO ≤ 60 minutes. हा(cid:19) targets aggressive आहा(cid:19)तो प्र(cid:8) preschool domain मध्या(cid:19) parent
communication + fee operations critical असाल्या(cid:2)मळे& (cid:19) justified आहा(cid:19)तो.
DR architecture multi-layered आहा(cid:19). Layer 1: Multi-AZ deployment (3 AZs) — single AZ failure
handle करतो(cid:19). Layer 2: Automated failover (Patroni for Postgres, Sentinel for Redis) — single
node failure handle करतो(cid:19). Layer 3: Cross-region replication (S3, ECR) — region failure handle
करतो(cid:19). Layer 4: Multi-region standby (v1.0: active-passive; v2.0: active-active) — complete
region failure handle करतो(cid:19). Each layer ची(cid:10) testing regular असातो(cid:19) — daily automated tests +
quarterly full DR drills.
12.2 DR Metrics
| Metric               | Target       | Implementation             |
| -------------------- | ------------ | -------------------------- |
| RPO (Recovery Point  | ≤ 15 Minutes | Max acceptable data loss;  |
| Objective)           |              | achieved via WAL streaming |
| RTO (Recovery Time   | ≤ 60 Minutes | Max acceptable downtime;   |
| Objective)           |              | achieved via automated     |
failover
| Database Recovery | Automatic Failover | Patroni + etcd leader  |
| ----------------- | ------------------ | ---------------------- |
election; < 30 seconds for
primary failover
Region Recovery Restore from Backup Cross-region restore from S3
+ ECR; < 60 minutes for full
region failover
Backup Verification Daily Restore Test Automated restore to QA
cluster; smoke test
verification
| DR Drill | Quarterly | Full DR simulation;  |
| -------- | --------- | -------------------- |
documented runbook; sign-
off required
42

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Metric Target Implementation
Multi-AZ Deployment Always On Pods spread across 3 AZs;
PVCs on multi-AZ storage
Multi-Region Strategy Active-Passive (v1.0) Primary region active; DR
region standby with
replicated data
Multi-Region Future Active-Active (v2.0) Roadmap — geo-routing via
Route53; cross-region
Postgres via logical
replication
Compliance Reporting Monthly DR Report RPO/RTO actual vs target;
failover history; restore test
results
12.3 DR Runbook (High-Level)
Scenario: Primary Region Complete Failure
Phase 1: Detection (0-5 minutes)
- Cloudflare health check fails for 3 consecutive checks
- Alert triggered to on-call engineer via PagerDuty
- On-call acknowledges + starts incident bridge
Phase 2: Decision (5-15 minutes)
- On-call verifies primary region is genuinely down
- On-call escalates to DevOps Lead + Engineering Manager
- Decision: failover to DR region OR wait for primary recovery
- Decision criteria: estimated primary recovery > 30 min -> failover
Phase 3: Failover (15-45 minutes)
- Update Cloudflare DNS to point to DR region load balancer
- Promote DR Postgres replica to primary (via Patroni)
- Scale up DR Kubernetes cluster (min 3 nodes -> 10 nodes)
- Deploy latest Helm charts to DR cluster
- Verify health checks pass
Phase 4: Verification (45-55 minutes)
- Smoke tests against DR endpoints
- Verify data consistency (last 15 min may be lost - RPO)
- Monitor error rates, latency, queue backlog
- Communicate to customers via status page
Phase 5: Stabilization (55-60 minutes)
- Traffic fully routed to DR region
43

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
- On-call hands off to follow-the-sun team
- Post-incident review scheduled within 48 hours
Phase 6: Recovery (post-incident)
- Primary region restored from latest backup
- Data reconciled (DR primary -> restored primary)
- Traffic routed back to primary region
- DR cluster scaled back down to standby
44

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
13. Environment Strategy
13.1 Environment Pipeline
PreOne च्या(cid:2) 6 environments आहा(cid:19)तो ज्या(cid:2)ची(cid:31) (cid:2) specific purpose + control level आहा(cid:19). प्र(cid:12)त्याक(cid:19)
environment सा(cid:2)ठी(cid:10) स्वतोत्र(cid:31) Kubernetes namespace आणि(cid:8) configuration व(cid:2)प्ररला(cid:10) जे(cid:2)तो(cid:19).
Environments strict pipeline follow करतो(cid:2)तो — क(cid:18)(cid:8)तो(cid:2)हा(cid:10) code change local dev प्र(cid:2)सान(
production प्रया)तो(cid:31) साव) environments मधन( जे(cid:2)(cid:8)(cid:19) आवश्याक आहा(cid:19). हा(cid:19) approach ensure करतो(cid:19) क(cid:10)
production मध्या (cid:19)क(cid:2)हा(cid:10) break हा(cid:18)(cid:8)(cid:2)र न(cid:2)हा(cid:10) क(cid:2)र(cid:8) issues lower environments मध्या (cid:19)catch हा(cid:18)तो(cid:10)ला.
Local Development
|
v
Development
|
v
QA
|
v
UAT
|
v
Staging
|
v
Production
13.2 Environment Catalog
Environment Cluster / Location Deployment Trigger Purpose
Local Development developer laptop Docker Compose for Each developer has
dependencies own stack
(Postgres, Redis,
MinIO)
Development shared dev cluster Auto-deploy from Shared by all
namespace develop branch developers for
integration testing
QA dedicated QA cluster Auto-deploy from QA team executes
main branch after PR test cases here
merge
UAT UAT cluster Manual deploy from Customer UAT —
namespace release branch pre-staging gate
45

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Environment Cluster / Location Deployment Trigger Purpose
Staging production-mirror Manual deploy from Pre-production; load
cluster release branch after testing; partner
UAT sign-off integration
Production production cluster Manual deploy after Customer-facing;
staging sign-off + highest controls
change advisory
board approval
13.3 Environment Policies
Environment management खी(cid:2)ला(cid:10)ला policies follow करतो(cid:19):
• Each environment has separate Kubernetes namespace + config
• No shared databases between environments — full isolation
• Secrets per environment (no reuse); rotated independently
• Production access: break-glass only; MFA + audit logged
• Staging must mirror production (same K8s version, same DB version, same configs)
• Data: synthetic data in lower envs; production-like data in staging via
anonymization
• Network policies block cross-environment traffic
• Cost optimization: dev/QA clusters scaled down after-hours (20:00-08:00 IST)
• Environment provisioning via Terraform modules (infrastructure-as-code)
• Decommissioning: lower envs rebuilt weekly for hygiene
46

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
14. Security
14.1 Security Architecture
PreOne ची(cid:10) security architecture defense-in-depth model वर based आहा(cid:19) — multiple security
layers द्वा(cid:2)र(cid:19) protection. Single layer compromise हा(cid:18)ण्या(cid:2)ची(cid:19) case मध्या(cid:19) other layers protection
provide करतो(cid:2)तो. Security layers: Cloudflare (edge — WAF + DDoS + bot protection), NGINX
(network — TLS + rate limiting + security headers), Kubernetes (cluster — NetworkPolicies +
RBAC + Pod Security Standards), Application (code — JWT auth + input validation + RBAC),
Database (data — RLS + encryption at rest + audit logs). हा (cid:19)साव) layers comprehensive security
posture provide करतो(cid:2)तो.
Security operations core activities: vulnerability scanning (Trivy + Snyk + GitLeaks in CI/CD),
penetration testing (annual third-party pentest), security training (annual OWASP training
for engineers), incident response (documented runbook + on-call rotation), compliance
audits (SOC 2 Type II roadmap + monthly internal audits), secrets management (K8s Secrets
for v1 + Vault migration in v1.2), image signing (cosign / Sigstore — verify at deploy time),
आणि(cid:8) supply chain security (SBOM generation + dependency pinning).
14.2 Security Controls
| Control | Implementation | Notes |
| ------- | -------------- | ----- |
HTTPS Everywhere TLS 1.3 enforced; HTTP auto- No plain-text HTTP endpoints
|         | redirects to HTTPS        | exposed                    |
| ------- | ------------------------- | -------------------------- |
| TLS 1.3 | Minimum TLS version; old  | Cipher suite: ECDHE-ECDSA- |
|         | TLS rejected at LB        | AES256-GCM-SHA384          |
Kubernetes Secrets Base64-encoded at rest; etcd  Vault migration roadmap
|     | encryption enabled | v1.2 |
| --- | ------------------ | ---- |
JWT Authentication RS256-signed; 15 min access  JWKS endpoint for key
|     | + 30 day refresh; rotated | distribution |
| --- | ------------------------- | ------------ |
Network Policies Default deny; explicit allow  API → Postgres allowed; API
|     | per namespace | → Internet denied |
| --- | ------------- | ----------------- |
Image Vulnerability Scanning Trivy in CI; admission  Block deploy on CRITICAL
|     | controller (Kyverno) in K8s | vulnerabilities |
| --- | --------------------------- | --------------- |
Role-Based Access Control  K8s RBAC + app-level RBAC Least-privilege; service
| (RBAC) |     | accounts per namespace |
| ------ | --- | ---------------------- |
47

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Control Implementation Notes
Audit Logging K8s audit log + app audit log Immutable; shipped to Loki +
S3
Pod Security Standards Restricted profile enforced No privileged pods; no host
via PSA namespaces
Secret Rotation DB credentials rotated Automated via sealed-secrets
quarterly; JWT keys annually + cron jobs
OWASP Top 10 Protection Helmet middleware + WAF + CSP, HSTS, X-Frame-Options,
input validation SQL injection prevention via
Prisma
DDoS Protection Cloudflare in front; rate L3/L4 via Cloudflare; L7 via
limiting at NGINX + NGINX
Cloudflare
Compliance SOC 2 Type II roadmap; Annual external audit;
GDPR; India DPDP Act monthly internal audit
14.3 NetworkPolicies Sample
# Default deny all ingress + egress
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
name: default-deny-all
namespace: api
spec:
podSelector: {}
policyTypes:
- Ingress
- Egress
---
# Allow ingress from NGINX Ingress namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
name: allow-from-ingress
namespace: api
spec:
podSelector:
matchLabels:
tier: backend
policyTypes:
- Ingress
ingress:
- from:
48

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
- namespaceSelector:
matchLabels:
name: ingress
ports:
- protocol: TCP
port: 3000
---
# Allow egress to Postgres + Redis only
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
name: allow-egress-data
namespace: api
spec:
podSelector:
matchLabels:
tier: backend
policyTypes:
- Egress
egress:
- to:
- namespaceSelector:
matchLabels:
name: postgres
ports:
- protocol: TCP
port: 5432
- to:
- namespaceSelector:
matchLabels:
name: redis
ports:
- protocol: TCP
port: 6379
- to:
- namespaceSelector:
matchLabels:
name: monitoring
ports:
- protocol: TCP
port: 9090
49

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
15. Scalability
15.1 Scalability Strategy
PreOne ची(cid:10) scalability strategy horizontal scaling वर based आहा (cid:19)— more pods + more nodes, न
क(cid:10) bigger machines. Horizontal scaling preferred क(cid:2)र(cid:8) तो(cid:19) granular, cost-effective, आणि(cid:8)
stateless-friendly आहा(cid:19). Stateless API pods द्वा(cid:2)र(cid:19) any pod can serve any request — या(cid:2)मळे& (cid:19) HPA
(Horizontal Pod Autoscaler) effectively scale करू शकतो(cid:18). Cluster Autoscaler pending pods
detect करतो(cid:18) आणि(cid:8) automatically new nodes add करतो(cid:18). हा(cid:19) साव) automated आहा(cid:19) — manual
scaling intervention required न(cid:2)हा(cid:10).
Scalability targets: API 3-30 pods, Web 2-10 pods, Worker 2-15 pods, cluster 3-20 nodes.
HPA CPU + memory + custom metrics (request latency, queue depth) द्वा(cid:2)र(cid:19) scaling decisions
घे(cid:19)तो(cid:18). Cluster Autoscaler pending pods detect करतो(cid:18) (pods unschedulable due to resource
constraints)  आणि(cid:8)  new nodes provision  करतो(cid:18). Scale-down  द्वा(cid:2)र(cid:19)  underutilized nodes
automatically removed हा(cid:18)तो(cid:2)तो (after 10 min of low utilization).
15.2 Scalability Tactics
| Tactic | Description | Scope |
| ------ | ----------- | ----- |
Horizontal Pod Autoscaler  Scale pods based on  API: 3-30 pods; Web: 2-10;
| (HPA) | CPU/Memory + custom  | Worker: 2-15 |
| ----- | -------------------- | ------------ |
metrics
Cluster Autoscaler Add/remove nodes based on  Min 3 nodes; max 20 nodes
|     | pending pods | per node group |
| --- | ------------ | -------------- |
Vertical Pod Autoscaler (VPA) Auto-adjust CPU/Memory  Used for stateful workloads
|     | requests based on usage | (Postgres, Redis) |
| --- | ----------------------- | ----------------- |
Stateless API Pods No session in pod; all state in  Any pod can serve any
|     | Redis/DB | request; enables HPA |
| --- | -------- | -------------------- |
Redis-based Distributed  BullMQ workers scale  Workers consume from
| Queue | independently of API | queue; auto-scaled by queue  |
| ----- | -------------------- | ---------------------------- |
depth
Read Replicas for Reporting Heavy reads routed to  Reports dashboard uses
|     | Postgres replicas | replica; prevents primary  |
| --- | ----------------- | -------------------------- |
load
CDN for Static Assets Cloudflare CDN for /static/*  1-year immutable cache;
|     | paths | fingerprinted filenames |
| --- | ----- | ----------------------- |
50

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Tactic Description Scope
Database Connection Pooling PgBouncer sidecar; 1000 Prevents connection
connections per pool exhaustion under load
Redis Cluster (future) Current: Redis Sentinel HA; v1.2 — when memory
Roadmap: Redis Cluster for exceeds 25 GB
sharding
Caching Strategy Multi-layer: browser → CDN Each layer has appropriate
→ NGINX → Redis → DB TTL; invalidation by version
Graceful Shutdown Pods receive SIGTERM; drain Zero-downtime
connections over 30s deployments; no dropped
requests
Circuit Breakers opossum library for Fail fast; prevent cascading
downstream service calls failures
15.3 HPA + Cluster Autoscaler Flow
1. Traffic increases -> API pods CPU > 70%
2. HPA detects high CPU via Prometheus metrics
3. HPA increases replicas (3 -> 5)
4. K8s scheduler tries to schedule 2 new pods
5. If insufficient node capacity -> pods Pending
6. Cluster Autoscaler detects Pending pods
7. Cluster Autoscaler provisions new node (1-2 min)
8. New pods scheduled on new node
9. New pods pass readiness check
10. NGINX routes traffic to new pods
11. CPU usage normalizes
Scale-down flow (reverse):
1. Traffic decreases -> CPU < 30%
2. HPA decreases replicas (5 -> 3)
3. Pods gracefully terminate (SIGTERM)
4. NGINX removes from upstream
5. If node underutilized -> Cluster Autoscaler drains
6. Node removed after 10 min
51

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
16. Final Production Stack
16.1 Stack Summary
PreOne ची(cid:10) final production stack खी(cid:2)ला(cid:10)ला table मध्या(cid:19) summarized आहा(cid:19). हा(cid:19) साव) components v1.0
release सा(cid:2)ठी(cid:10) frozen आहा(cid:19)तो आणि(cid:8) LOCKED status च्या(cid:2) अ(cid:31)तोगे)तो यातो(cid:19) (cid:2)तो. क(cid:18)(cid:8)तो(cid:2)हा(cid:10) change require करतो(cid:18)
new ADR + Architecture Review Board approval. Stack ची(cid:19) design philosophy: open-source
first, production-proven, cloud-portable, आणि(cid:8) operational simplicity. हा(cid:10) stack PreOne च्या(cid:2) 14
business domains, 530+ APIs, real-time WebSocket channels,  आणि(cid:8)  background jobs
efficiently handle करू शकतो(cid:19).
| Layer          | Technology | Role                        |
| -------------- | ---------- | --------------------------- |
| Source Control | GitHub     | Git hosting + PR reviews +  |
Issues
| CI/CD         | GitHub Actions | Build + test + deploy pipeline |
| ------------- | -------------- | ------------------------------ |
| Containers    | Docker         | Image format + build tool      |
| Orchestration | Kubernetes     | Container orchestration        |
| Ingress       | NGINX          | Reverse proxy + load           |
balancer
| Backend  | NestJS              | API + WebSocket gateway  |
| -------- | ------------------- | ------------------------ |
| Web      | Next.js             | SSR + static site        |
| Mobile   | React Native + Expo | iOS + Android apps       |
| Database | PostgreSQL HA       | Primary data store       |
| Cache    | Redis               | Cache + session + queue  |
backend
| Queue   | BullMQ         | Background job processing |
| ------- | -------------- | ------------------------- |
| Storage | AWS S3 / MinIO | Object storage for files  |
Monitoring Prometheus + Grafana Metrics + dashboards + alerts
| Logging | Loki + Promtail        | Centralized log aggregation |
| ------- | ---------------------- | --------------------------- |
| Tracing | OpenTelemetry + Jaeger | Distributed tracing         |
| Backup  | PostgreSQL WAL + S3    | PITR + object storage       |
|         | Backups                | backups                     |
52

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Layer Technology Role
Disaster Recovery Multi-zone with automated RPO ≤ 15min; RTO ≤ 60min
failover
16.2 Stack Justification
प्र(cid:12)त्याक(cid:19) technology choice carefully evaluated आहा(cid:19) alternatives च्या(cid:2) णिवरुद्ध. Selection rationale
documented आहा(cid:19) खी(cid:2)ला(cid:10)ला table मध्या(cid:19) — या(cid:2)मळे& (cid:19) future engineers न(cid:2) decisions ची context सामजे(cid:19)ला
आणि(cid:8) तो(cid:19) informed changes करू शकतो(cid:10)ला. हा(cid:19) साव) alternatives evaluated हा(cid:18)तो(cid:19) आणि(cid:8) णिनवड क(cid:19) लाला(cid:19) (cid:10)
technology production-proven + team-familiar + cost-effective हा(cid:18)तो(cid:10).
Decision Choice Rationale
Docker Swarm vs Kubernetes Kubernetes chosen K8s ecosystem richer; better
long-term bet
Jenkins vs GitHub Actions GitHub Actions chosen Native GitHub integration;
YAML-based; no infra to
manage
AWS ECS vs Kubernetes Kubernetes chosen Portability across cloud
providers
Traefik vs NGINX Ingress NGINX chosen Production-proven; larger
community; better
WebSocket support
MongoDB vs PostgreSQL PostgreSQL chosen ACID; RLS; relational fits DDD
aggregates better
RabbitMQ vs BullMQ (Redis) BullMQ chosen Single backend (Redis) for
cache + queue; simpler ops
ELK vs Loki Loki chosen Lower cost; integrates with
Grafana; no separate ES
cluster
Datadog vs Prometheus chosen Open source; no vendor lock-
Prometheus+Grafana in; mature ecosystem
Vault vs K8s Secrets K8s Secrets for v1; Vault later Simpler ops for v1; Vault
adds complexity
AWS RDS vs Self-managed Self-managed chosen Patroni HA + PgBouncer
Postgres control; RDS limitations on
extensions
53

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
17. Appendix A — Decision Drivers
17.1 Key Decision Drivers
हा(cid:2) ADR ची (cid:19)साव) decisions खी(cid:2)ला(cid:10)ला drivers द्वा(cid:2)र(cid:19) influenced आहा(cid:19)तो. हा(cid:19) drivers prioritized आहा(cid:19)तो — जे(cid:19)व्हा(cid:2)
drivers conflict करतो(cid:2)तो तो(cid:19)व्हा(cid:2) higher-priority driver wins. हा(cid:19) drivers future ADRs सा(cid:2)ठी(cid:10) reference
साद्ध& (cid:2) serve करतो(cid:2)तो.
Driver Specifics Weight
Operational Maturity Team familiar with K8s + Reduce learning curve; ship
Docker + GitHub Actions faster
Cost Optimization Spot instances + HPA + auto- Pay only for actual usage
scaling
Vendor Lock-in Avoidance K8s portable across cloud AWS now, but migration path
providers to GCP/Azure
Security Posture Defense-in-depth; least- OWASP + SOC 2 alignment
privilege
Compliance GDPR + India DPDP Act + Audit logs + DR + access
future SOC 2 controls
Developer Experience Local dev mirrors production Docker Compose + same
images
Observability Three pillars — metrics, logs, Prometheus + Loki + Jaeger
traces
Reliability Multi-AZ + automated 99.9% uptime target for v1.0
failover
18. Appendix B — Glossary
18.1 Terms
Term Definition
ADR Architecture Decision Record — document
capturing architectural decisions + rationale
CI/CD Continuous Integration / Continuous
Deployment
54

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Term Definition
HPA Horizontal Pod Autoscaler — scales pods
based on metrics
PITR Point-in-Time Recovery — restore database
to specific timestamp
RPO Recovery Point Objective — max acceptable
data loss
RTO Recovery Time Objective — max acceptable
downtime
WAL Write-Ahead Log — Postgres transaction log
for durability + replication
PgBouncer Connection pooler for PostgreSQL
Patroni HA solution for PostgreSQL using etcd for
leader election
StatefulSet K8s workload type for stateful applications
(DB, cache)
ConfigMap K8s resource for non-confidential
configuration data
Secret K8s resource for sensitive data (passwords,
tokens)
Ingress K8s resource managing external access to
services
Namespace K8s mechanism for isolating groups of
resources within a cluster
Prometheus Pull-based metrics collection + time-series
database
Grafana Visualization + dashboarding tool for metrics
+ logs
Loki Horizontally-scalable log aggregation system
by Grafana Labs
Promtail Log shipping agent for Loki (similar to
Promtail for Prometheus)
OpenTelemetry Vendor-neutral observability standard for
traces, metrics, logs
55

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Term Definition
Jaeger Distributed tracing backend (CNCF project)
Velero K8s backup + restore tool for cluster
resources + PVs
BullMQ Redis-based queue library for Node.js
background jobs
RBAC Role-Based Access Control
DLQ Dead Letter Queue — queue for messages
that failed processing
CDN Content Delivery Network — edge caching for
static assets
19. Document Control
19.1 Document Information
Document Title PreOne ADR-111 DevOps & Infrastructure
Architecture
ADR ID ADR-111
Status LOCKED
Document Version 1.0
Date 2026-07-14
Product PreOne — Enterprise Preschool Operating
System
Predecessor ADR Catalog v1.0, Backend TD v1.0, Frontend
Architecture v1.0
Successor DevOps Runbook, Kubernetes Manifests,
Terraform Modules, Production Release
Scope Docker, Kubernetes, CI/CD, NGINX,
PostgreSQL HA, Redis, Monitoring, Logging,
DR
Classification Internal Engineering Reference
Prepared by PreOne Architecture & DevOps Team
56

PreOne ADR-111 v1.0  |  DevOps & Infrastructure Architecture
19.2 Change History
| Version | Date       | Author          | Changes         |
| ------- | ---------- | --------------- | --------------- |
| 1.0     | 2026-07-14 | Architecture &  | Initial LOCKED  |
|         |            | DevOps Team     | version — 16    |
chapters covering
Docker, K8s, CI/CD,
NGINX, Postgres HA,
Redis, Monitoring,
Logging, Backup, DR,
Environments,
Security, Scalability,
Final Stack
| 0.9 | 2026-07-10 | Architecture &  | Pre-lock draft —  |
| --- | ---------- | --------------- | ----------------- |
|     |            | DevOps Team     | security review   |
feedback
incorporated
| 0.5 | 2026-07-01 | Architecture &  | Initial draft —        |
| --- | ---------- | --------------- | ---------------------- |
|     |            | DevOps Team     | chapters 1-8 (Docker,  |
K8s, CI/CD, NGINX,
Postgres, Redis)
| 0.1 | 2026-06-20 | Architecture &  | Skeleton — TOC +   |
| --- | ---------- | --------------- | ------------------ |
|     |            | DevOps Team     | section headers +  |
placeholder content
19.3 Approval Matrix
| Role        | Name | Responsibility  | Status  |
| ----------- | ---- | --------------- | ------- |
| DevOps Lead | —    | Infrastructure  | Pending |
architecture, K8s
setup, CI/CD
| Engineering Manager | —   | Team capacity, on- | Pending |
| ------------------- | --- | ------------------ | ------- |
call rotation, budget
| Security Lead | —   | Security review,  | Pending |
| ------------- | --- | ----------------- | ------- |
compliance sign-off
| Architecture Review  | —   | ADR review +   | Pending |
| -------------------- | --- | -------------- | ------- |
| Board                |     | LOCKED status  |         |
approval
57

PreOne ADR-111 v1.0 | DevOps & Infrastructure Architecture
Role Name Responsibility Status
CTO — Final approval for Pending
production release
19.4 Next Steps
• Architecture Review Board sign-off (this week)
• Security review for NetworkPolicies + RBAC (next sprint)
• DevOps team walkthrough + Q&A session
• Terraform modules development (infrastructure-as-code)
• Helm charts authoring for all services
• GitHub Actions workflows implementation
• Production cluster provisioning (EKS + node groups)
• PostgreSQL HA setup (Patroni + etcd + PgBouncer)
• Redis Sentinel setup (3 masters + 3 replicas)
• Monitoring stack deployment (Prometheus + Grafana + AlertManager)
• Logging stack deployment (Loki + Promtail + Grafana)
• Backup + DR verification (daily restore tests)
• Production Runbook documentation
• Quarterly DR drill scheduling
58