P R E O N E E N T E R P R I S E
PreOne Business Rules Catalog
Enterprise Preschool Operating System
Document: BRC v1.0
Status: Draft (Business Review)
Date: 2026-07-12
Total Rules: 176 across 12 categories
Predecessor: BPM v1.0 (Business Freeze)
Successor: Master PRD v1.0
Classification: Internal Engineering Reference
Prepared by: PreOne Product & Architecture Team
PreOne Platform BRC v1.0

PreOne BRC v1.0 | Business Rules Catalog
Table of Contents
Executive Summary..........................................................................................................................1
How to Use This Document...............................................................................................................2
Rule ID Convention............................................................................................................................2
Schema Fields....................................................................................................................................2
Cross-References...............................................................................................................................3
Version Control..................................................................................................................................4
Change Request Process...................................................................................................................4
Rule Schema Definition.....................................................................................................................4
2. Eligibility Rules..............................................................................................................................5
2.1 Summary Table — Eligibility Rules..............................................................................................5
2.2 Detailed Rule Cards — Eligibility Rules........................................................................................5
R-ELG-001 — Playgroup Age Eligibility.......................................................................................5
R-ELG-002 — Nursery Age Eligibility...........................................................................................6
R-ELG-003 — Jr.KG Age Eligibility...............................................................................................6
R-ELG-004 — Sr.KG Age Eligibility...............................................................................................6
R-ELG-005 — Age Proof Document Mandatory.........................................................................6
R-ELG-006 — Birth Certificate Mandatory..................................................................................7
R-ELG-007 — Medical Fitness Declaration.................................................................................7
R-ELG-008 — Photograph Mandatory........................................................................................7
R-ELG-009 — Parent/Guardian Identity Proof............................................................................7
R-ELG-010 — Primary Contact Mandatory.................................................................................8
R-ELG-011 — Sibling Admission Priority.....................................................................................8
R-ELG-012 — Staff Ward Admission Quota................................................................................8
R-ELG-013 — Transfer Student Eligibility...................................................................................8
R-ELG-014 — RTE Section 12 (25% EWS Reservation)................................................................9
R-ELG-015 — Special Needs Child Admission.............................................................................9
1

PreOne BRC v1.0 | Business Rules Catalog
3. Financial Rules..............................................................................................................................9
3.1 Summary Table — Financial Rules............................................................................................10
3.2 Detailed Rule Cards — Financial Rules......................................................................................10
R-FIN-001 — Fee Due Date Enforcement.................................................................................10
R-FIN-002 — Late Fee Calculation............................................................................................10
R-FIN-003 — Refund Policy — Withdrawal Before Term Start................................................10
R-FIN-004 — Refund — Mid-Term Withdrawal........................................................................11
R-FIN-005 — Sibling Discount...................................................................................................11
R-FIN-006 — Early Bird Discount..............................................................................................11
R-FIN-007 — GST on Educational Services...............................................................................11
R-FIN-008 — Invoice Number Generation................................................................................12
R-FIN-009 — Payment Receipt Generation..............................................................................12
R-FIN-010 — Digital Payment Mandate....................................................................................12
R-FIN-011 — Cheque Bounce Handling (NSF)...........................................................................12
R-FIN-012 — Installment Plan Approval...................................................................................13
R-FIN-013 — Merit Scholarship Eligibility.................................................................................13
R-FIN-014 — Bad Debt Write-off..............................................................................................13
R-FIN-015 — Expense Approval Matrix....................................................................................13
R-FIN-016 — Vendor Payment Terms.......................................................................................14
R-FIN-017 — TDS Deduction on Vendor Payments..................................................................14
R-FIN-018 — Financial Hardship Waiver...................................................................................14
R-FIN-019 — RTE Section 12 Reimbursement Claim................................................................14
R-FIN-020 — Annual Financial Audit.........................................................................................15
4. Operational Rules.......................................................................................................................15
4.1 Summary Table — Operational Rules.......................................................................................15
4.2 Detailed Rule Cards — Operational Rules.................................................................................16
R-OPS-001 — Authorized Pickup Person List............................................................................16
R-OPS-002 — Unauthorized Pickup Block................................................................................16
R-OPS-003 — Late Pickup Fee...................................................................................................16
R-OPS-004 — Arrival Cutoff Time.............................................................................................16
2

PreOne BRC v1.0 | Business Rules Catalog
R-OPS-005 — Attendance Threshold for Promotion................................................................17
R-OPS-006 — Attendance Marking Window............................................................................17
R-OPS-007 — Mid-Day Exit Gate Pass......................................................................................17
R-OPS-008 — Visitor Logging....................................................................................................17
R-OPS-009 — Bus Route Assignment.......................................................................................18
R-OPS-010 — Bus Tracking — Real-time GPS...........................................................................18
R-OPS-011 — Bus Missing Child Alert.......................................................................................18
R-OPS-012 — Morning Health Check........................................................................................18
R-OPS-013 — Meal Allergy Check.............................................................................................19
R-OPS-014 — Nap Time Supervision........................................................................................19
R-OPS-015 — Incident Escalation Matrix..................................................................................19
R-OPS-016 — Photo Consent for Marketing.............................................................................19
R-OPS-017 — Daily Timeline Push to Parent............................................................................20
R-OPS-018 — Food Sample Retention......................................................................................20
R-OPS-019 — Washroom Assistance........................................................................................20
R-OPS-020 — CCTV Coverage and Retention...........................................................................20
5. Academic Rules...........................................................................................................................21
5.1 Summary Table — Academic Rules...........................................................................................21
5.2 Detailed Rule Cards — Academic Rules....................................................................................21
R-ACD-001 — Curriculum Theme Rotation..............................................................................21
R-ACD-002 — Weekly Lesson Plan Submission........................................................................22
R-ACD-003 — Daily Activity Slots..............................................................................................22
R-ACD-004 — Observation Recording Frequency....................................................................22
R-ACD-005 — Observation Quality Check................................................................................22
R-ACD-006 — Milestone Assessment Frequency.....................................................................23
R-ACD-007 — Milestone Delay Alert........................................................................................23
R-ACD-008 — Portfolio Update Cadence..................................................................................23
R-ACD-009 — Report Card Generation Cycle...........................................................................23
R-ACD-010 — Report Card Approval Workflow.......................................................................24
R-ACD-011 — Promotion Criteria.............................................................................................24
3

PreOne BRC v1.0 | Business Rules Catalog
R-ACD-012 — Age-Based Class Cap..........................................................................................24
R-ACD-013 — PTM Frequency..................................................................................................24
R-ACD-014 — Remedial Program Trigger.................................................................................25
R-ACD-015 — Outdoor Play Duration.......................................................................................25
R-ACD-016 — Activity Participation Tracking...........................................................................25
R-ACD-017 — Annual Curriculum Audit...................................................................................25
R-ACD-018 — Field Trip Safety Protocol...................................................................................26
6. Human Resources Rules..............................................................................................................26
6.1 Summary Table — Human Resources Rules.............................................................................26
6.2 Detailed Rule Cards — Human Resources Rules.......................................................................27
R-HR-001 — Staff Qualification Minimum................................................................................27
R-HR-002 — Staff Background Verification..............................................................................27
R-HR-003 — Leave Entitlement Annual....................................................................................27
R-HR-004 — Max Consecutive Leave........................................................................................27
R-HR-005 — Substitute Teacher Assignment...........................................................................28
R-HR-006 — Payroll Cutoff Date...............................................................................................28
R-HR-007 — Performance Review Cycle...................................................................................28
R-HR-008 — Exit Process..........................................................................................................28
R-HR-009 — Internal Complaints Committee (ICC)..................................................................29
R-HR-010 — Annual POSH Training..........................................................................................29
R-HR-011 — Food Handler Medical Certificate........................................................................29
R-HR-012 — Probation Period..................................................................................................29
7. Inventory Rules...........................................................................................................................30
7.1 Summary Table — Inventory Rules...........................................................................................30
7.2 Detailed Rule Cards — Inventory Rules.....................................................................................30
R-INV-001 — Auto Reorder Trigger..........................................................................................30
R-INV-002 — Minimum Stock Threshold..................................................................................31
R-INV-003 — Perishable Item Expiry Tracking..........................................................................31
R-INV-004 — Expired Item Disposal.........................................................................................31
R-INV-005 — Asset Depreciation..............................................................................................31
4

PreOne BRC v1.0 | Business Rules Catalog
R-INV-006 — Vendor Rating Threshold....................................................................................32
R-INV-007 — PO Approval Threshold.......................................................................................32
R-INV-008 — Issue Slip Mandatory...........................................................................................32
R-INV-009 — Stock Audit Frequency........................................................................................32
R-INV-010 — Return Window...................................................................................................33
R-INV-011 — Consumption Tracking........................................................................................33
R-INV-012 — Asset Disposal Approval......................................................................................33
8. Communication Rules.................................................................................................................33
8.1 Summary Table — Communication Rules.................................................................................34
8.2 Detailed Rule Cards — Communication Rules..........................................................................34
R-COM-001 — Parent Message Response Time.......................................................................34
R-COM-002 — Unacknowledged Message Escalation.............................................................34
R-COM-003 — Non-Academic Hour Messaging Restriction.....................................................35
R-COM-004 — Broadcast Restriction........................................................................................35
R-COM-005 — Language Preference........................................................................................35
R-COM-006 — Marketing Communication Opt-in...................................................................35
R-COM-007 — Communication Channel Opt-out....................................................................36
R-COM-008 — Announcement Approval Workflow.................................................................36
R-COM-009 — Photo Caption Mandatory................................................................................36
R-COM-010 — Two-way Chat History Retention......................................................................36
R-COM-011 — WhatsApp Business API Rate Limit...................................................................37
R-COM-012 — Emergency Notification Cascade......................................................................37
9. Compliance Rules........................................................................................................................37
9.1 Summary Table — Compliance Rules........................................................................................38
9.2 Detailed Rule Cards — Compliance Rules.................................................................................38
R-CMP-001 — Parent Consent for Child Data..........................................................................38
R-CMP-002 — Consent Withdrawal.........................................................................................38
R-CMP-003 — Child Data Retention Policy...............................................................................38
R-CMP-004 — Child Photo Storage Encryption........................................................................39
R-CMP-005 — CCTV Retention Period......................................................................................39
5

PreOne BRC v1.0 | Business Rules Catalog
R-CMP-006 — Quarterly PII Audit.............................................................................................39
R-CMP-007 — Fire NOC Renewal.............................................................................................39
R-CMP-008 — Data Breach Notification...................................................................................40
R-CMP-009 — POSH Complaint Filing.......................................................................................40
R-CMP-010 — POSH Confidentiality.........................................................................................40
R-CMP-011 — POSH Training for All Staff.................................................................................40
R-CMP-012 — POSH Complaint Timeline.................................................................................41
R-CMP-013 — Quarterly Fire Drill.............................................................................................41
R-CMP-014 — Fire Extinguisher Inspection..............................................................................41
R-CMP-015 — Evacuation Plan Display....................................................................................41
R-CMP-016 — RTE Non-Discrimination....................................................................................42
R-CMP-017 — FSSAI Kitchen License........................................................................................42
R-CMP-018 — Food Handler Medical Certificate.....................................................................42
10. Approval Matrix Rules..............................................................................................................42
10.1 Summary Table — Approval Matrix Rules..............................................................................43
10.2 Detailed Rule Cards — Approval Matrix Rules........................................................................43
R-APR-001 — Discount Approval by Amount...........................................................................43
R-APR-002 — Refund Approval Matrix.....................................................................................43
R-APR-003 — Leave Approval Matrix.......................................................................................44
R-APR-004 — Expense Approval by Amount............................................................................44
R-APR-005 — Vendor Onboarding Approval............................................................................44
R-APR-006 — Admission Final Approval...................................................................................44
R-APR-007 — Fee Waiver Approval..........................................................................................45
R-APR-008 — Asset Disposal Approval.....................................................................................45
R-APR-009 — Action-Based Role Escalation.............................................................................45
R-APR-010 — New Position Approval.......................................................................................45
R-APR-011 — Salary Revision Approval....................................................................................46
R-APR-012 — School Policy Change Approval..........................................................................46
R-APR-013 — Bulk Data Export Approval.................................................................................46
R-APR-014 — Vendor Payment Approval.................................................................................46
6

PreOne BRC v1.0 | Business Rules Catalog
R-APR-015 — Curriculum Change Approval.............................................................................47
11. Notification Rules......................................................................................................................47
11.1 Summary Table — Notification Rules......................................................................................47
11.2 Detailed Rule Cards — Notification Rules...............................................................................48
R-NOT-001 — Fee Due Reminder Cadence..............................................................................48
R-NOT-002 — Child Absence Alert...........................................................................................48
R-NOT-003 — Daily Report Push Time.....................................................................................48
R-NOT-004 — Birthday Greeting..............................................................................................48
R-NOT-005 — Festival Greeting................................................................................................49
R-NOT-006 — Incident Notification..........................................................................................49
R-NOT-007 — Photo Share Alert..............................................................................................49
R-NOT-008 — Event Schedule Announcement........................................................................49
R-NOT-009 — Holiday Alert......................................................................................................50
R-NOT-010 — Transport Delay Alert........................................................................................50
R-NOT-011 — Salary Credit Notification...................................................................................50
R-NOT-012 — System Maintenance Notification.....................................................................50
12. Data Governance Rules.............................................................................................................51
12.1 Summary Table — Data Governance Rules.............................................................................51
12.2 Detailed Rule Cards — Data Governance Rules......................................................................51
R-DAT-001 — PII Encryption at Rest.........................................................................................51
R-DAT-002 — Data in Transit Encryption..................................................................................52
R-DAT-003 — PII Field Masking in UI........................................................................................52
R-DAT-004 — Role-Based Field Visibility..................................................................................52
R-DAT-005 — Audit Log Retention...........................................................................................52
R-DAT-006 — Data Residency — India Only.............................................................................53
R-DAT-007 — Data Subject Access Request (DSAR).................................................................53
R-DAT-008 — Data Erasure Request.........................................................................................53
R-DAT-009 — Backup Retention Policy....................................................................................53
R-DAT-010 — Breach Detection & Response...........................................................................54
R-DAT-011 — Soft Delete Policy...............................................................................................54
7

PreOne BRC v1.0 | Business Rules Catalog
R-DAT-012 — Anonymized Analytics Data...............................................................................54
13. Platform & Multi-tenant Rules..................................................................................................54
13.1 Summary Table — Platform & Multi-tenant Rules.................................................................55
13.2 Detailed Rule Cards — Platform & Multi-tenant Rules...........................................................55
R-PLT-001 — Tenant Data Isolation..........................................................................................55
R-PLT-002 — Subscription Grace Period...................................................................................55
R-PLT-003 — Tenant Suspension Process.................................................................................56
R-PLT-004 — Feature Flag per Tier...........................................................................................56
R-PLT-005 — License Seat Allocation........................................................................................56
R-PLT-006 — Branch-Level Data Partition................................................................................56
R-PLT-007 — Platform Admin Role Restrictions.......................................................................57
R-PLT-008 — Cross-Tenant Data Block.....................................................................................57
R-PLT-009 — Tenant Onboarding Validation............................................................................57
R-PLT-010 — Tenant Offboarding Process................................................................................57
Appendix A — Cross-Reference Matrix (BRC ↔ ADR ↔ PRD).......................................................58
Appendix B — Compliance Framework Mapping............................................................................58
DPDP Act 2023 (Digital Personal Data Protection)..........................................................................58
POSH Act 2013 (Sexual Harassment of Women at Workplace)......................................................59
Fire Safety (NBC 2016 / State Fire Services Act).............................................................................59
RTE Section 12 (25% Reservation for EWS/Disadvantaged)...........................................................59
FSSAI (Food Safety for Mid-day Meals / Snacks).............................................................................59
Appendix C — Glossary...................................................................................................................60
Appendix D — Sign-off Page...........................................................................................................60
Approval Matrix...............................................................................................................................60
Document Control...........................................................................................................................60
Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-
click the TOC and select "Update Field."
8

PreOne BRC v1.0 | Business Rules Catalog
Executive Summary
PreOne Business Rules Catalog (BRC) v1.0 हा(cid:2) PreOne Enterprise Build Roadmap चा(cid:2) ति(cid:6)सरा(cid:2)
foundational document आहा(cid:10) — Vision Document आति(cid:12) Business Process Model (BPM) नं(cid:6)(cid:14) रा. BRC चा(cid:2)
primary purpose म्हा(cid:12)जे(cid:10) प्र(cid:18)त्येक(cid:10) business decision ला(cid:2) govern करा(cid:12)(cid:2)रा(cid:10) rules एक(cid:2) centralized, machine-
readable, AI-friendly format मध्ये(cid:10) capture करा(cid:12),(cid:10) ज्ये(cid:2)मळे(cid:27) (cid:10) Master PRD, DDD models, ERD, API contracts
आति(cid:12) final code सर्व(cid:30) एक(cid:2)चा rule source र्वरा depend करा(cid:6)(cid:31)ला.
ह्या(cid:2) document मध्ये(cid:10) 176 rules 12 categories मध्ये(cid:10) तिर्वभा(cid:2)गल्ये(cid:2) आहा(cid:10)(cid:6): Eligibility, Financial, Operational,
Academic, HR, Inventory, Communication, Compliance, Approval Matrix, Notification, Data
Governance, आति(cid:12) Platform/Multi-tenant. प्र(cid:18)त्ये(cid:10)क rule ला(cid:2) unique Rule ID (e.g., R-ADM-007) आहा (cid:10)जे$ PRD
acceptance criteria, ADR references, आति(cid:12) unit tests मध्ये (cid:10)cross-reference क(cid:10)ला(cid:2) जे(cid:2)ईला. ह्या(cid:2) ID convention
मळे(cid:27) (cid:10) AI assistants ला(cid:2) business context precise तिमळे(cid:6)$ आति(cid:12) development team ला(cid:2) ambiguity नं प्रड(cid:6)(cid:2) rule
locate करा(cid:6)(cid:2) ये(cid:6)(cid:10) (cid:10).
BRC हा(cid:2) BPM आति(cid:12) PRD मधी(cid:31)ला missing link आहा(cid:10). BPM फक्(cid:6) "what happens" define करा(cid:6)$ (process flow),
प्र(cid:12) "why a decision is taken this way" define करा(cid:6) नं(cid:2)हा(cid:31). PRD मध्ये (cid:10)rules feature-by-feature scatter हा$(cid:6)(cid:2)(cid:6)
— acceptance criteria मध्ये(cid:10), edge cases मध्ये(cid:10), error messages मध्ये(cid:10). BRC त्ये(cid:2) सर्व(cid:30) rules एक(cid:2) जे(cid:2)ग(cid:31)
consolidate करा(cid:6)$ आति(cid:12) ति(cid:6)थूनं+ PRD/DDD/code सर्व(cid:30)त्र reference करा(cid:6)$. ह्या(cid:2)मळे(cid:27) (cid:10) rule change करा(cid:2)येचा(cid:2) असला(cid:10) (cid:6)रा
एक(cid:2) जे(cid:2)ग(cid:31) change करा(cid:2)र्व(cid:2) ला(cid:2)ग(cid:6)$ — नंव्र्व(cid:10) ति/क(cid:2)(cid:12)(cid:31) trace करा(cid:2)र्व(cid:10) ला(cid:2)ग(cid:6) नं(cid:2)हा(cid:31).
Document चा(cid:31) status आत्ता(cid:2) Draft (Business Review) आहा(cid:10). प्र(cid:18)त्ये(cid:10)क rule चा(cid:31) review business stakeholders
(Principal, Owner, Counsellor, Teacher, Accounts, HR) स$ब(cid:6) हा$ईला. Review प्र(cid:12)+ (cid:30)झा(cid:2)ल्ये(cid:2)र्वरा status Business
Freeze करा(cid:6)(cid:2) येई(cid:10) ला आति(cid:12) नं(cid:6)(cid:14) रा Master PRD Phase सरू(cid:27) हा$ईला. BRC र्वरा क$(cid:12)(cid:6)(cid:2)हा(cid:31) change कराण्ये(cid:2)स(cid:2)/(cid:31) formal
Change Request (CR) process follow करा(cid:2)र्व(cid:2) ला(cid:2)ग(cid:10)ला — version increment, impact analysis, आति(cid:12) sign-off
mandatory.
How to Use This Document
Rule ID Convention
प्र(cid:18)त्ये(cid:10)क rule चा(cid:31) ID format R-DOM-NNN आहा(cid:10), तिजेथू(cid:10) DOM हा(cid:2) 3-letter domain code आहा(cid:10) आति(cid:12) NNN हा(cid:2)
sequential number आहा(cid:10). उदा(cid:2).: R-ADM-007 = Admission domain चा(cid:31) 7र्व(cid:31) rule. हा(cid:31) convention stable आहा(cid:10)
— एकदा(cid:2) ID assign झा(cid:2)ला(cid:31) क(cid:31) (cid:6)(cid:31) change हा$(cid:12)(cid:2)रा नं(cid:2)हा(cid:31), जेरा rule delete झा(cid:2)ला(cid:31) (cid:6)रा(cid:31) ID retire क(cid:10)ला(cid:31) जे(cid:2)(cid:6) (cid:10)प्र(cid:12) reuse हा$(cid:6)
नं(cid:2)हा(cid:31).
Schema Fields
प्र(cid:18)त्ये(cid:10)क rule 14 fields मध्ये(cid:10) structured आहा(cid:10). हा(cid:10) fields AI LLM context feeding, unit test generation, आति(cid:12)
developer onboarding स(cid:2)/(cid:31) design क(cid:10)ला (cid:10)आहा(cid:10)(cid:6):
9

PreOne BRC v1.0 | Business Rules Catalog
• Trigger — क$(cid:12)त्ये(cid:2) event नं(cid:6)(cid:14) रा rule evaluate हा$(cid:6)(cid:10) (e.g., application form submission).
• Condition — IF/THEN logic ज्ये(cid:2)नंस(cid:27) (cid:2)रा decision हा$(cid:6)(cid:10).
• Action — rule pass झा(cid:2)ल्ये(cid:2)र्वरा क(cid:2)ये हा$(cid:6)(cid:10) (allow, block, escalate, notify).
• Exception — क$(cid:12)त्ये(cid:2) प्रतिराति7थू(cid:6)(cid:31)(cid:6) rule override हा$ऊ शक(cid:6)(cid:10) आति(cid:12) क$(cid:12).
• Owner Role — क$(cid:12)त्ये(cid:2) role च्ये(cid:2) owner ला(cid:2) rule enforce कराण्ये(cid:2)चा(cid:31) primary responsibility.
• Source — rule क(cid:27)/+नं आला(cid:31) (school policy, government regulation, industry best practice).
• Compliance — क$(cid:12)त्ये(cid:2) compliance framework श(cid:31) link आहा(cid:10) (DPDP, POSH, Fire Safety).
• Related ADR — क$(cid:12)त्ये(cid:2) Architecture Decision Record श(cid:31) technical link आहा(cid:10).
Cross-References
BRC हा(cid:2) standalone document नं(cid:2)हा(cid:31) — (cid:6)$ Vision, BPM, ADR, आति(cid:12) PRD स$ब(cid:6) deeply linked आहा(cid:10). Cross-
Reference Matrix (Appendix A) मध्ये (cid:10)प्र(cid:18)त्येक(cid:10) rule चा(cid:31) ADR mapping तिदाला(cid:31) आहा(cid:10). PRD phase मध्ये (cid:10)प्र(cid:18)त्येक(cid:10) feature
च्ये(cid:2) acceptance criteria मध्ये(cid:10) relevant Rule IDs cite क(cid:10)ला(cid:10) जे(cid:2)(cid:6)(cid:31)ला — उदा(cid:2).: "Acceptance: R-ADM-007
satisfied".
Version Control
BRC चा(cid:10) versioning semantic versioning follow करा(cid:6)(cid:10) — MAJOR.MINOR.PATCH. MAJOR version
business freeze नं(cid:6)(cid:14) राचा change हा$(cid:6)$ (breaking rule changes). MINOR version नंर्व(cid:31)नं rules add क(cid:10)ल्ये(cid:2)र्वरा
increment हा$(cid:6)$. PATCH version rule clarification, typo fixes स(cid:2)/(cid:31). Current version 1.0 — pre-freeze
draft.
Change Request Process
एकदा(cid:2) BRC Business Freeze झा(cid:2)ल्ये(cid:2)र्वरा क$(cid:12)(cid:6)(cid:31)हा(cid:31) rule change स(cid:2)/(cid:31) formal CR process mandatory आहा(cid:10): (1) CR
form मध्ये(cid:10) rule ID, current behavior, proposed change, business justification भारा(cid:2)र्व(cid:10) ला(cid:2)ग(cid:10)ला; (2) Impact
analysis — क$(cid:12)(cid:6) (cid:10)PRD sections, ADRs, code modules affected हा$(cid:6)(cid:31)ला; (3) Product Lead + Eng Lead joint
sign-off; (4) Version increment + changelog update; (5) Stakeholder communication.
Rule Schema Definition
प्र(cid:18)त्ये(cid:10)क rule 14 fields मध्ये(cid:10) structured आहा(cid:10). खा(cid:2)ला(cid:31)ला table प्र(cid:18)त्ये(cid:10)क field चा(cid:31) purpose आति(cid:12) example दाश(cid:30)र्व(cid:6)$:
Field Purpose Example
Rule ID Unique identifier (R-DOM-NNN R-ADM-007
format). Stable, never reused.
10

PreOne BRC v1.0  |  Business Rules Catalog
| Field  | Purpose                   | Example   |
| ------ | ------------------------- | --------- |
| Domain | Business domain the rule  | Admission |
belongs to (from BPM).
Sub-Process Specific sub-process within the  Document Verification
domain.
| Title | Short human-readable rule  | Mandatory Document Check |
| ----- | -------------------------- | ------------------------ |
name.
| Trigger | Event that causes rule  | Application form submission |
| ------- | ----------------------- | --------------------------- |
evaluation.
Condition IF/THEN logic for decision- IF age<2.5 AND docs_missing
|     | making. | THEN block |
| --- | ------- | ---------- |
Action What happens when rule fires. Block + show missing docs list
Exception Conditions under which rule can  Branch Head discretionary
|     | be overridden. | approval |
| --- | -------------- | -------- |
Owner Role Role accountable for enforcing  Admission Counsellor
rule.
| Source | Where rule originated  | School Policy 2024 §3.2 |
| ------ | ---------------------- | ----------------------- |
(policy/regulation).
| Compliance | External compliance framework  | DPDP Act §4 |
| ---------- | ------------------------------ | ----------- |
link.
| Status | Draft / Reviewed / Approved /  | Approved |
| ------ | ------------------------------ | -------- |
Frozen.
| Version | Rule version (independent of  | 1.0 |
| ------- | ----------------------------- | --- |
doc version).
| Related ADR | Architecture Decision Record  | ADR-012, ADR-019 |
| ----------- | ----------------------------- | ---------------- |
references.
2. Eligibility Rules
Eligibility rules define क$(cid:12)त्ये(cid:2) conditions मध्ये(cid:10) एक candidate admission स(cid:2)/(cid:31) eligible आहा(cid:10). ह्या(cid:2) rules चा(cid:2)
primary goal म्हा(cid:12)जे(cid:10) age-appropriate placement, mandatory documentation completeness, आति(cid:12)
medical fitness ensure करा(cid:12).(cid:10)  NEP 2020 Early Childhood Care and Education (ECCE) norms आति(cid:12)
school-specific policies ये(cid:2)च्(cid:14) ये(cid:2) आधी(cid:2)रा (cid:10)सर्व (cid:30)rules draft क(cid:10)ल्ये(cid:2) आहा(cid:10)(cid:6). Each rule चा(cid:31) compliance DPDP Act (child
data consent) आति(cid:12) Right to Education (RTE) Section 12 (25% reservation compliance) श(cid:31) mapping
क(cid:10)ला(cid:31) आहा(cid:10).
11

PreOne BRC v1.0  |  Business Rules Catalog
ह्या(cid:2) category मध्ये (cid:10)15 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
| quick overview दा(cid:6)(cid:10) | (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) |  rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10). |     |     |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | --- | --- |
2.1 Summary Table — Eligibility Rules
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-ELG-001 Playgroup Age  Application Form  Block application;  Admission
|     | Eligibility | submission for  | show age- | Counsellor |
| --- | ----------- | --------------- | --------- | ---------- |
Playgroup class appropriate class
suggestion
(Nursery if >2.5)
R-ELG-002 Nursery Age  Application Form  Block application;  Admission
|     | Eligibility | submission for  | suggest Playgroup  | Counsellor |
| --- | ----------- | --------------- | ------------------ | ---------- |
Nursery class (if <2.5) or Jr.KG
(if >3.5)
R-ELG-003 Jr.KG Age  Application Form  Block application;  Admission
|     | Eligibility | submission for  | suggest Nursery  | Counsellor |
| --- | ----------- | --------------- | ---------------- | ---------- |
Jr.KG class (if <3.5) or Sr.KG
(if >4.5)
R-ELG-004 Sr.KG Age  Application Form  Block application;  Admission
|     | Eligibility | submission for  | suggest Jr.KG (if  | Counsellor |
| --- | ----------- | --------------- | ------------------ | ---------- |
Sr.KG class <4.5) or Grade 1
(if >5.5)
R-ELG-005 Age Proof  Application Form  Block submission;  Admission
|     | Document  | submission | request         | Counsellor |
| --- | --------- | ---------- | --------------- | ---------- |
|     | Mandatory |            | acceptable age  |            |
proof document
R-ELG-006 Birth Certificate  Application Form  Mark application  Admission
|     | Mandatory | submission | 'Pending  | Counsellor |
| --- | --------- | ---------- | --------- | ---------- |
Documents'; send
automated
reminder to
parent (D+3, D+7,
D+14)
R-ELG-007 Medical Fitness  Application Form  Mark 'Pending  Admission
|     | Declaration | submission (post- | Medical'; require  | Counsellor |
| --- | ----------- | ----------------- | ------------------ | ---------- |
document  signed medical
upload) declaration by
parent +
pediatrician
certificate
12

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-ELG-008 Photograph  Application Form  Send automated  Admission
|     | Mandatory | submission | reminder; allow  | Counsellor |
| --- | --------- | ---------- | ---------------- | ---------- |
admission
approval
conditional on
photo within 7
days
R-ELG-009 Parent/Guardian  Application Form  Require  Admission
|     | Identity Proof | submission | acceptable parent  | Counsellor |
| --- | -------------- | ---------- | ------------------ | ---------- |
ID proof upload
R-ELG-010 Primary Contact  Application Form  Require valid  Admission
|     | Mandatory | submission | Indian mobile  | Counsellor |
| --- | --------- | ---------- | -------------- | ---------- |
number (+91
format) for
primary contact
R-ELG-011 Sibling Admission  Application Form  Auto-flag  Admission
|     | Priority | submission with   | application as       | Counsellor |
| --- | -------- | ----------------- | -------------------- | ---------- |
|     |          | sibling_already_e | 'Sibling Priority';  |            |
|     |          | nrolled = TRUE    | fast-track           |            |
counselling slot
within 48 hours
R-ELG-012 Staff Ward  Application Form  Apply staff ward  HR + Admission
|     | Admission Quota | submission with  | discount; route to  | Counsellor |
| --- | --------------- | ---------------- | ------------------- | ---------- |
|     |                 | staff_ward =     | HR validation for   |            |
|     |                 | TRUE             | staff tenure        |            |
confirmation
R-ELG-013 Transfer Student  Mid-year  Allow admission;  Admission
|     | Eligibility | application from   | carry forward  | Counsellor +  |
| --- | ----------- | ------------------ | -------------- | ------------- |
|     |             | student            | previous       | Principal     |
|     |             | transferring from  | attendance     |               |
|     |             | another school     | records        |               |
R-ELG-014 RTE Section 12  Annual admission  Reserve 25%  Principal +
|     | (25% EWS     | cycle planning  | seats for EWS  | Management |
| --- | ------------ | --------------- | -------------- | ---------- |
|     | Reservation) | (Jan-March)     | category;      |            |
integrate with
state RTE portal
for
reimbursement
claims
13

PreOne BRC v1.0 | Business Rules Catalog
Rule ID Title Trigger Action Owner
R-ELG-015 Special Needs Application Form Admission Principal + Special
Child Admission with conditional on Educator
special_needs_fla assessment; if
g = TRUE severity >
moderate,
recommend
shadow teacher
requirement
2.2 Detailed Rule Cards — Eligibility Rules
R-ELG-001 — Playgroup Age Eligibility
Rule ID R-ELG-001
Domain Admission
Sub-Process Age Verification
Title Playgroup Age Eligibility
Trigger Application Form submission for Playgroup class
Condition IF age_at_joining < 1.5 years OR age_at_joining >
2.5 years THEN ineligible
Action Block application; show age-appropriate class
suggestion (Nursery if >2.5)
Exception Branch Head discretionary approval with
documented child development assessment
reason
Owner Role Admission Counsellor
Source School Policy 2024 §3.1; NEP 2020 ECCE norms
Compliance DPDP §4 (consent for child data)
Status Approved
Version 1.0
Related ADR ADR-005, ADR-012
R-ELG-002 — Nursery Age Eligibility
Rule ID R-ELG-002
Domain Admission
14

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process Age Verification
Title Nursery Age Eligibility
Trigger Application Form submission for Nursery class
Condition IF age_at_joining < 2.5 years OR age_at_joining >
3.5 years THEN ineligible
Action Block application; suggest Playgroup (if <2.5) or
Jr.KG (if >3.5)
Exception Branch Head approval + child readiness
assessment by qualified ECCE educator
Owner Role Admission Counsellor
Source School Policy 2024 §3.1
Compliance DPDP §4
Status Approved
Version 1.0
Related ADR ADR-005
R-ELG-003 — Jr.KG Age Eligibility
Rule ID R-ELG-003
Domain Admission
Sub-Process Age Verification
Title Jr.KG Age Eligibility
Trigger Application Form submission for Jr.KG class
Condition IF age_at_joining < 3.5 years OR age_at_joining >
4.5 years THEN ineligible
Action Block application; suggest Nursery (if <3.5) or
Sr.KG (if >4.5)
Exception Branch Head approval + prior schooling certificate
verification
Owner Role Admission Counsellor
Source School Policy 2024 §3.1
Compliance DPDP §4
Status Approved
Version 1.0
Related ADR ADR-005
15

PreOne BRC v1.0 | Business Rules Catalog
R-ELG-004 — Sr.KG Age Eligibility
Rule ID R-ELG-004
Domain Admission
Sub-Process Age Verification
Title Sr.KG Age Eligibility
Trigger Application Form submission for Sr.KG class
Condition IF age_at_joining < 4.5 years OR age_at_joining >
5.5 years THEN ineligible
Action Block application; suggest Jr.KG (if <4.5) or Grade
1 (if >5.5)
Exception Branch Head approval + academic readiness
assessment
Owner Role Admission Counsellor
Source School Policy 2024 §3.1
Compliance DPDP §4
Status Approved
Version 1.0
Related ADR ADR-005
R-ELG-005 — Age Proof Document Mandatory
Rule ID R-ELG-005
Domain Admission
Sub-Process Age Proof
Title Age Proof Document Mandatory
Trigger Application Form submission
Condition IF age_proof_doc NOT IN [Birth Certificate,
Passport, Aadhaar, Hospital Certificate] THEN
ineligible
Action Block submission; request acceptable age proof
document
Exception Affidavit on stamp paper (₹100) for
orphaned/adopted children with court order
Owner Role Admission Counsellor
Source RTE Act §14; School Policy 2024 §3.3
Compliance RTE §14; DPDP §4
16

PreOne BRC v1.0 | Business Rules Catalog
Status Approved
Version 1.0
Related ADR ADR-005
R-ELG-006 — Birth Certificate Mandatory
Rule ID R-ELG-006
Domain Admission
Sub-Process Document Verification
Title Birth Certificate Mandatory
Trigger Application Form submission
Condition IF birth_certificate_uploaded = FALSE THEN block
admission approval
Action Mark application 'Pending Documents'; send
automated reminder to parent (D+3, D+7, D+14)
Exception Passport or Aadhaar accepted as substitute if Birth
Certificate unavailable (with written undertaking)
Owner Role Admission Counsellor
Source School Policy 2024 §3.3
Compliance RTE §14
Status Approved
Version 1.0
Related ADR ADR-005, ADR-012
R-ELG-007 — Medical Fitness Declaration
Rule ID R-ELG-007
Domain Admission
Sub-Process Medical Fitness
Title Medical Fitness Declaration
Trigger Application Form submission (post-document
upload)
Condition IF medical_fitness_form = FALSE OR
medical_declaration_signed = FALSE THEN block
approval
17

PreOne BRC v1.0 | Business Rules Catalog
Action Mark 'Pending Medical'; require signed medical
declaration by parent + pediatrician certificate
Exception Conditional admission with 7-day grace period for
medical fitness certificate submission
Owner Role Admission Counsellor
Source School Policy 2024 §3.4; FSSR 2011 (food handler
interaction)
Compliance FSSR 2011; DPDP §4
Status Approved
Version 1.0
Related ADR ADR-005
R-ELG-008 — Photograph Mandatory
Rule ID R-ELG-008
Domain Admission
Sub-Process Document Verification
Title Photograph Mandatory
Trigger Application Form submission
Condition IF passport_photo_count < 2 THEN block ID card
generation
Action Send automated reminder; allow admission
approval conditional on photo within 7 days
Exception Photo captured at campus visit if parent unable to
upload
Owner Role Admission Counsellor
Source School Policy 2024 §3.3
Compliance —
Status Approved
Version 1.0
Related ADR ADR-005
R-ELG-009 — Parent/Guardian Identity Proof
Rule ID R-ELG-009
Domain Admission
18

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process Parent Details
Title Parent/Guardian Identity Proof
Trigger Application Form submission
Condition IF parent_id_proof NOT IN [Aadhaar, PAN,
Passport, Driving License] THEN block submission
Action Require acceptable parent ID proof upload
Exception School management discretion for NRIs with
international ID — passport mandatory
Owner Role Admission Counsellor
Source School Policy 2024 §3.3
Compliance DPDP §4
Status Approved
Version 1.0
Related ADR ADR-005
R-ELG-010 — Primary Contact Mandatory
Rule ID R-ELG-010
Domain Admission
Sub-Process Parent Details
Title Primary Contact Mandatory
Trigger Application Form submission
Condition IF primary_contact_phone IS NULL OR
primary_contact_phone
NOT_VALID_INDIAN_MOBILE THEN block
submission
Action Require valid Indian mobile number (+91 format)
for primary contact
Exception NRI parents — international number with country
code accepted
Owner Role Admission Counsellor
Source School Policy 2024 §3.5
Compliance —
Status Approved
Version 1.0
Related ADR ADR-005
19

PreOne BRC v1.0 | Business Rules Catalog
R-ELG-011 — Sibling Admission Priority
Rule ID R-ELG-011
Domain Admission
Sub-Process Sibling Priority
Title Sibling Admission Priority
Trigger Application Form submission with
sibling_already_enrolled = TRUE
Condition IF sibling_enrolled_in_same_school = TRUE AND
sibling_status = ACTIVE THEN priority_score +10
Action Auto-flag application as 'Sibling Priority'; fast-track
counselling slot within 48 hours
Exception Sibling must have no fee due >30 days; if due
pending, priority on hold
Owner Role Admission Counsellor
Source School Policy 2024 §3.6
Compliance —
Status Approved
Version 1.0
Related ADR ADR-005
R-ELG-012 — Staff Ward Admission Quota
Rule ID R-ELG-012
Domain Admission
Sub-Process Staff Ward Quota
Title Staff Ward Admission Quota
Trigger Application Form submission with staff_ward =
TRUE
Condition IF parent_is_staff = TRUE AND staff_tenure >= 1
year THEN eligible for 50% fee waiver + priority
admission
Action Apply staff ward discount; route to HR validation
for staff tenure confirmation
Exception Tenure <1 year: pro-rata waiver (25% if 6-12
months, 0% if <6 months)
20

PreOne BRC v1.0 | Business Rules Catalog
Owner Role HR + Admission Counsellor
Source School Policy 2024 §7.2 (Staff Benefits)
Compliance —
Status Approved
Version 1.0
Related ADR ADR-005
R-ELG-013 — Transfer Student Eligibility
Rule ID R-ELG-013
Domain Student Lifecycle
Sub-Process Transfer Admission
Title Transfer Student Eligibility
Trigger Mid-year application from student transferring
from another school
Condition IF transfer_certificate_provided = TRUE AND
previous_school_attendance >= 75% THEN eligible
Action Allow admission; carry forward previous
attendance records
Exception Attendance <75% requires Branch Head approval
+ remedial plan documentation
Owner Role Admission Counsellor + Principal
Source School Policy 2024 §3.7; RTE §5
Compliance RTE §5 (No denial of admission for transfer
students)
Status Approved
Version 1.0
Related ADR ADR-005
R-ELG-014 — RTE Section 12 (25% EWS Reservation)
Rule ID R-ELG-014
Domain Admission
Sub-Process RTE Quota
Title RTE Section 12 (25% EWS Reservation)
21

PreOne BRC v1.0 | Business Rules Catalog
Trigger Annual admission cycle planning (Jan-March)
Condition IF entry_class (Playgroup/Nursery) AND
ews_applications_received < 25% seats THEN flag
for state reimbursement portal sync
Action Reserve 25% seats for EWS category; integrate
with state RTE portal for reimbursement claims
Exception School-specific quota may exceed 25% but cannot
go below (mandatory minimum)
Owner Role Principal + Management
Source RTE Act 2009 §12(1)(c); State RTE Rules
Compliance RTE §12
Status Approved
Version 1.0
Related ADR ADR-005, ADR-019
R-ELG-015 — Special Needs Child Admission
Rule ID R-ELG-015
Domain Admission
Sub-Process Special Needs
Title Special Needs Child Admission
Trigger Application Form with special_needs_flag = TRUE
Condition IF special_needs_assessment_pending = TRUE
THEN route to special educator for assessment
within 7 days
Action Admission conditional on assessment; if severity >
moderate, recommend shadow teacher
requirement
Exception Cannot deny admission solely on special needs
basis (RPWD Act 2016 §3)
Owner Role Principal + Special Educator
Source RPWD Act 2016 §3; School Policy 2024 §3.8
Compliance RPWD Act 2016; RTE §3(2)
Status Approved
Version 1.0
Related ADR ADR-005
22

PreOne BRC v1.0  |  Business Rules Catalog
3. Financial Rules
Financial rules govern fee collection, refunds, discounts, GST compliance, आति(cid:12) payment failure
handling. ह्या(cid:2) rules चा(cid:2) primary goal म्हा(cid:12)जे(cid:10) revenue leakage prevention, statutory compliance (GST,
TDS), आति(cid:12) parent-friendly payment experience. RBI guidelines for digital payments, GST Council
notifications for educational services, आति(cid:12) school fee regulation acts (state-specific) ये(cid:2)च्(cid:14) ये(cid:2) आधी(cid:2)रा(cid:10)
rules draft क(cid:10)ल्ये(cid:2) आहा(cid:10)(cid:6).
ह्या(cid:2) category मध्ये (cid:10)20 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
रा प्र(cid:18)त्येक(cid:10)
| quick overview दा(cid:6)(cid:10) | (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) |  rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10). |     |     |
| -------------------------------- | -------------------------------------- | ----------------------------------------------------------- | --- | --- |
3.1 Summary Table — Financial Rules
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-FIN-001 Fee Due Date  Invoice generated  Mark invoice  Accounts Team
|     | Enforcement | with due_date | overdue; trigger  |     |
| --- | ----------- | ------------- | ----------------- | --- |
R-FIN-002 (late
fee calculation);
trigger R-
NOT-001
(reminder)
R-FIN-002 Late Fee  Invoice overdue  Add late fee line  Accounts Team
|     | Calculation | (post R-FIN-001) | item to invoice;  |     |
| --- | ----------- | ---------------- | ----------------- | --- |
send notification;
if >60 days, block
attendance
marking + ID card
R-FIN-003 Refund Policy —  Parent submits  Process refund  Accounts Team +
|     | Withdrawal        | withdrawal      | within 14 working  | Branch Head |
| --- | ----------------- | --------------- | ------------------ | ----------- |
|     | Before Term Start | request before  | days to original   |             |
term start date payment method
R-FIN-004 Refund — Mid- Parent submits  Generate refund  Accounts Team +
|     | Term Withdrawal | withdrawal  | invoice; route to  | Branch Head |
| --- | --------------- | ----------- | ------------------ | ----------- |
request after  Branch Head
term start approval; process
within 14 days
23

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-FIN-005 Sibling Discount Second+ child  Auto-apply  Accounts Team
|     |     | admission in  | discount on  |     |
| --- | --- | ------------- | ------------ | --- |
|     |     | same school   | invoice      |     |
generation;
visible as
separate line item
| R-FIN-006 | Early Bird  | Admission         | Auto-apply   | Accounts Team |
| --------- | ----------- | ----------------- | ------------ | ------------- |
|           | Discount    | confirmed before  | discount at  |               |
|           |             | April 30th for    | invoice      |               |
|           |             | next academic     | generation   |               |
year
R-FIN-007 GST on  Invoice  Apply correct GST  Accounts Team +
|     | Educational  | generation | rate; generate  | Finance Head |
| --- | ------------ | ---------- | --------------- | ------------ |
|     | Services     |            | GST-compliant   |              |
invoice with HSN
code, GSTIN,
place of supply
R-FIN-008 Invoice Number  New invoice  Generate  Accounts Team
|     | Generation | created | sequential invoice  |     |
| --- | ---------- | ------- | ------------------- | --- |
number; GST
invoice series
registered with
GST portal
R-FIN-009 Payment Receipt  Payment  Auto-generate  Accounts Team
|     | Generation | confirmed (post- | PDF receipt;      |     |
| --- | ---------- | ---------------- | ----------------- | --- |
|     |            | payment-success  | email to parent;  |     |
|     |            | webhook)         | sync to parent    |     |
app; archive in
document store
R-FIN-010 Digital Payment  Fee payment  Disable cash  Accounts Team
|     | Mandate | attempt | payment option  |     |
| --- | ------- | ------- | --------------- | --- |
above ₹50,000;
show digital
payment
methods only
24

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-FIN-011 Cheque Bounce  Bank webhook:  Reverse receipt;  Accounts Team +
|     | Handling (NSF) | cheque_returned  | mark invoice  | Finance Head |
| --- | -------------- | ---------------- | ------------- | ------------ |
|     |                | NSF              | unpaid; send  |              |
demand notice
(legal format)
within 3 days;
block future
cheque payments
for parent
R-FIN-012 Installment Plan  Parent requests  Create  Accounts Team +
|     | Approval | installment plan  | installment  | Branch Head |
| --- | -------- | ----------------- | ------------ | ----------- |
|     |          | for annual fee    | schedule;    |             |
generate
separate invoices
per installment
with respective
due dates
R-FIN-013 Merit Scholarship  Annual  Auto-flag eligible  Principal +
|     | Eligibility | scholarship cycle  | students; route to  | Scholarship  |
| --- | ----------- | ------------------ | ------------------- | ------------ |
|     |             | (April)            | scholarship         | Committee    |
committee for
final selection
R-FIN-014 Bad Debt Write- Invoice overdue >  Route to Finance  Finance Head +
|     | off | 365 days | Head + Director  | Director |
| --- | --- | -------- | ---------------- | -------- |
approval; if
approved, write-
off in books;
retain recovery
rights for 3 years
R-FIN-015 Expense Approval  Expense claim  Route to  Accounts Team +
|     | Matrix | submitted | appropriate     | Multi-level  |
| --- | ------ | --------- | --------------- | ------------ |
|     |        |           | approver based  | Approvers    |
on amount; multi-
level approval
workflow
R-FIN-016 Vendor Payment  Vendor invoice  Schedule  Accounts Team +
|     | Terms | received + GRN  | payment; auto-   | Branch Head |
| --- | ----- | --------------- | ---------------- | ----------- |
|     |       | verified        | pay on due date  |             |
via NEFT/RTGS
25

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-FIN-017 TDS Deduction on  Vendor payment  Deduct TDS;  Accounts Team +
|     | Vendor Payments | > ₹30,000 (single)  | generate Form        | Finance Head |
| --- | --------------- | ------------------- | -------------------- | ------------ |
|     |                 | or > ₹1,00,000      | 16A quarterly; file  |              |
|     |                 | (annual             | TDS return; issue    |              |
|     |                 | aggregate)          | TDS certificate to   |              |
vendor
R-FIN-018 Financial  Parent submits  Route to Branch  Branch Head +
|     | Hardship Waiver | fee waiver    | Head + Director   | Director |
| --- | --------------- | ------------- | ----------------- | -------- |
|     |                 | request with  | joint approval;   |          |
|     |                 | documentation | waiver valid for  |          |
current term only
(renewal
required)
R-FIN-019 RTE Section 12  Quarterly RTE  Generate claim  Principal +
|     | Reimbursement  | reimbursement  | file; upload to    | Accounts Team |
| --- | -------------- | -------------- | ------------------ | ------------- |
|     | Claim          | cycle          | state RTE portal;  |               |
track
reimbursement
status; reconcile
on receipt
R-FIN-020 Annual Financial  End of financial  Engage CA firm;  Finance Head +
|     | Audit | year (March 31) | provide books,  | CA  |
| --- | ----- | --------------- | --------------- | --- |
invoices, receipts,
bank statements;
receive audit
report; file ITR
3.2 Detailed Rule Cards — Financial Rules
R-FIN-001 — Fee Due Date Enforcement
Rule ID R-FIN-001
Domain Finance
Sub-Process
Fee Collection
Title Fee Due Date Enforcement
Trigger Invoice generated with due_date
Condition IF current_date > due_date + 0 days THEN status =
'Overdue'
26

PreOne BRC v1.0 | Business Rules Catalog
Action Mark invoice overdue; trigger R-FIN-002 (late fee
calculation); trigger R-NOT-001 (reminder)
Exception Holiday grace: if due_date falls on
weekend/holiday, deadline extends to next
working day
Owner Role Accounts Team
Source School Policy 2024 §5.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-002 — Late Fee Calculation
Rule ID R-FIN-002
Domain Finance
Sub-Process Late Fee
Title Late Fee Calculation
Trigger Invoice overdue (post R-FIN-001)
Condition IF days_overdue BETWEEN 1 AND 7 THEN late_fee
= 0; IF 8-30 THEN late_fee = ₹100; IF 31-60 THEN
late_fee = ₹500; IF >60 THEN late_fee = ₹1000 +
hold services
Action Add late fee line item to invoice; send notification;
if >60 days, block attendance marking + ID card
Exception Branch Head can waive late fee with documented
reason (medical, family emergency, job loss)
Owner Role Accounts Team
Source School Policy 2024 §5.3
Compliance —
Status Approved
Version 1.0
Related ADR ADR-008
27

PreOne BRC v1.0 | Business Rules Catalog
R-FIN-003 — Refund Policy — Withdrawal Before Term Start
Rule ID R-FIN-003
Domain Finance
Sub-Process Refund
Title Refund Policy — Withdrawal Before Term Start
Trigger Parent submits withdrawal request before term
start date
Condition IF withdrawal_request_date < term_start_date - 7
days THEN refund = 100% - ₹1000 processing; IF 1-
7 days before THEN refund = 75%; IF after term
start THEN refund = 0% (term fee non-refundable)
Action Process refund within 14 working days to original
payment method
Exception Medical emergency (with hospital certificate):
90% refund even after term start
Owner Role Accounts Team + Branch Head
Source School Policy 2024 §5.4; State School Fee
Regulation Act
Compliance State Fee Regulation Act (varies by state)
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-004 — Refund — Mid-Term Withdrawal
Rule ID R-FIN-004
Domain Finance
Sub-Process Refund
Title Refund — Mid-Term Withdrawal
Trigger Parent submits withdrawal request after term
start
Condition IF attendance_days < 30 THEN refund = 50% of
annual fee proportionate; IF >= 30 THEN refund =
0%
Action Generate refund invoice; route to Branch Head
approval; process within 14 days
28

PreOne BRC v1.0 | Business Rules Catalog
Exception Transfer case (parent job relocation >100km): 75%
refund irrespective of attendance
Owner Role Accounts Team + Branch Head
Source School Policy 2024 §5.4.2
Compliance State Fee Regulation Act
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-005 — Sibling Discount
Rule ID R-FIN-005
Domain Finance
Sub-Process Discount
Title Sibling Discount
Trigger Second+ child admission in same school
Condition IF sibling_count_in_school = 2 THEN 10% discount
on lower fee; IF = 3 THEN 15%; IF >= 4 THEN 20%
Action Auto-apply discount on invoice generation; visible
as separate line item
Exception Sibling discount not applicable on RTE quota seats
(already subsidized)
Owner Role Accounts Team
Source School Policy 2024 §5.5
Compliance —
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-006 — Early Bird Discount
Rule ID R-FIN-006
Domain Finance
Sub-Process Discount
Title Early Bird Discount
29

PreOne BRC v1.0 | Business Rules Catalog
Trigger Admission confirmed before April 30th for next
academic year
Condition IF admission_confirmation_date <= April 30 THEN
5% discount on annual tuition fee
Action Auto-apply discount at invoice generation
Exception Discount not stackable with staff ward waiver (R-
ELG-012)
Owner Role Accounts Team
Source School Policy 2024 §5.5.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-007 — GST on Educational Services
Rule ID R-FIN-007
Domain Finance
Sub-Process GST Compliance
Title GST on Educational Services
Trigger Invoice generation
Condition IF service_type IN [Tuition Fee, Activity Fee,
Examination Fee] THEN GST = 0% (exempt); IF
service_type IN [Transportation, Food/Canteen,
Books/Materials] THEN GST = 5% or 18% per HSN
Action Apply correct GST rate; generate GST-compliant
invoice with HSN code, GSTIN, place of supply
Exception Pure preschool education (Playgroup-Sr.KG) is
fully GST-exempt; only auxiliary services taxable
Owner Role Accounts Team + Finance Head
Source CGST Act §2(45); GST Notification 12/2017
Compliance GST Act 2017
Status Approved
Version 1.0
Related ADR ADR-008, ADR-022
30

PreOne BRC v1.0 | Business Rules Catalog
R-FIN-008 — Invoice Number Generation
Rule ID R-FIN-008
Domain Finance
Sub-Process Invoice
Title Invoice Number Generation
Trigger New invoice created
Condition IF branch_id + financial_year + sequence_number
= unique THEN assign; format: INV-{BRANCH}-{FY}-
{SEQ:00000}
Action Generate sequential invoice number; GST invoice
series registered with GST portal
Exception Cancelled invoices retain number with status
'CANCELLED' — never reused
Owner Role Accounts Team
Source GST Act §31; GSTN Invoice Format Rules
Compliance GST Act 2017
Status Approved
Version 1.0
Related ADR ADR-008, ADR-022
R-FIN-009 — Payment Receipt Generation
Rule ID R-FIN-009
Domain Finance
Sub-Process Receipt
Title Payment Receipt Generation
Trigger Payment confirmed (post-payment-success
webhook)
Condition IF payment_status = SUCCESS THEN generate
receipt within 60 seconds; receipt number: RCT-
{BRANCH}-{FY}-{SEQ}
Action Auto-generate PDF receipt; email to parent; sync
to parent app; archive in document store
Exception Failed payment generates no receipt; attempt
logged for audit
Owner Role Accounts Team
31

PreOne BRC v1.0 | Business Rules Catalog
Source School Policy 2024 §5.6
Compliance GST Act (receipt as proof of payment)
Status Approved
Version 1.0
Related ADR ADR-008, ADR-022
R-FIN-010 — Digital Payment Mandate
Rule ID R-FIN-010
Domain Finance
Sub-Process Payment
Title Digital Payment Mandate
Trigger Fee payment attempt
Condition IF payment_amount > ₹50,000 THEN digital
payment mandatory (UPI/NetBanking/Card); cash
rejected
Action Disable cash payment option above ₹50,000;
show digital payment methods only
Exception Cash accepted for amounts <₹50,000 with PAN
number capture (Income Tax §269ST)
Owner Role Accounts Team
Source Income Tax Act §269ST; RBI Digital Payment
Guidelines
Compliance IT Act §269ST; RBI Guidelines
Status Approved
Version 1.0
Related ADR ADR-008, ADR-022
R-FIN-011 — Cheque Bounce Handling (NSF)
Rule ID R-FIN-011
Domain Finance
Sub-Process Payment
Title Cheque Bounce Handling (NSF)
Trigger Bank webhook: cheque_returned NSF
32

PreOne BRC v1.0 | Business Rules Catalog
Condition IF cheque_bounce_reason = NSF THEN charge
₹500 bounce charge + original late fee (R-FIN-002)
Action Reverse receipt; mark invoice unpaid; send
demand notice (legal format) within 3 days; block
future cheque payments for parent
Exception Bank error (rare): bank letter required; charges
waived after verification
Owner Role Accounts Team + Finance Head
Source Negotiable Instruments Act §138; School Policy
2024 §5.7
Compliance NI Act §138
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-012 — Installment Plan Approval
Rule ID R-FIN-012
Domain Finance
Sub-Process Installment
Title Installment Plan Approval
Trigger Parent requests installment plan for annual fee
Condition IF requested_installments <= 4 AND
parent_credit_history != 'default' THEN auto-
approve; IF > 4 OR prior default THEN Branch
Head approval required
Action Create installment schedule; generate separate
invoices per installment with respective due dates
Exception Default on any installment triggers full
outstanding amount due immediately
Owner Role Accounts Team + Branch Head
Source School Policy 2024 §5.8
Compliance —
Status Approved
Version 1.0
Related ADR ADR-008
33

PreOne BRC v1.0 | Business Rules Catalog
R-FIN-013 — Merit Scholarship Eligibility
Rule ID R-FIN-013
Domain Finance
Sub-Process Scholarship
Title Merit Scholarship Eligibility
Trigger Annual scholarship cycle (April)
Condition IF child_attendance >= 95% AND milestone_score
>= 90th percentile AND family_income < ₹8 lakh
THEN eligible for 25% scholarship
Action Auto-flag eligible students; route to scholarship
committee for final selection
Exception Special talent scholarship (sports/arts) — separate
evaluation criteria; income criteria relaxed
Owner Role Principal + Scholarship Committee
Source School Policy 2024 §5.9
Compliance —
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-014 — Bad Debt Write-off
Rule ID R-FIN-014
Domain Finance
Sub-Process Write-off
Title Bad Debt Write-off
Trigger Invoice overdue > 365 days
Condition IF invoice_overdue_days > 365 AND
recovery_attempts >= 3 THEN mark for write-off
Action Route to Finance Head + Director approval; if
approved, write-off in books; retain recovery
rights for 3 years
Exception Recovery agent/legal action initiated: write-off
held in abeyance
Owner Role Finance Head + Director
Source School Policy 2024 §5.10; Income Tax §36(1)(vii)
34

PreOne BRC v1.0 | Business Rules Catalog
Compliance IT Act §36(1)(vii) (bad debt deduction)
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-015 — Expense Approval Matrix
Rule ID R-FIN-015
Domain Finance
Sub-Process Expense
Title Expense Approval Matrix
Trigger Expense claim submitted
Condition IF amount <= ₹5,000 THEN Branch Admin
approve; IF 5,001-25,000 THEN Branch Head; IF
25,001-1,00,000 THEN Director; IF > 1,00,000
THEN Board approval
Action Route to appropriate approver based on amount;
multi-level approval workflow
Exception Emergency expenses (medical, fire, safety) bypass
matrix — post-facto approval within 48 hours
Owner Role Accounts Team + Multi-level Approvers
Source School Policy 2024 §5.11
Compliance —
Status Approved
Version 1.0
Related ADR ADR-008, ADR-014
R-FIN-016 — Vendor Payment Terms
Rule ID R-FIN-016
Domain Finance
Sub-Process Vendor Payment
Title Vendor Payment Terms
Trigger Vendor invoice received + GRN verified
35

PreOne BRC v1.0 | Business Rules Catalog
Condition IF vendor_invoice_amount_matches_grn = TRUE
AND po_amount >= invoice_amount THEN
approve for payment within agreed credit period
(typically 30 days)
Action Schedule payment; auto-pay on due date via
NEFT/RTGS
Exception Early payment discount (2/10 net 30): if vendor
offers 2% discount for 10-day payment, auto-avail
Owner Role Accounts Team + Branch Head
Source School Policy 2024 §5.12
Compliance —
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-017 — TDS Deduction on Vendor Payments
Rule ID R-FIN-017
Domain Finance
Sub-Process TDS
Title TDS Deduction on Vendor Payments
Trigger Vendor payment > ₹30,000 (single) or > ₹1,00,000
(annual aggregate)
Condition IF vendor_payment_threshold_crossed THEN
deduct TDS per §194C (1% contract) or §194J
(10% professional)
Action Deduct TDS; generate Form 16A quarterly; file TDS
return; issue TDS certificate to vendor
Exception Vendor with Lower Deduction Certificate (Form
13) — deduct at reduced rate per certificate
Owner Role Accounts Team + Finance Head
Source Income Tax Act §194C, §194J
Compliance IT Act §194
Status Approved
Version 1.0
Related ADR ADR-008, ADR-022
36

PreOne BRC v1.0 | Business Rules Catalog
R-FIN-018 — Financial Hardship Waiver
Rule ID R-FIN-018
Domain Finance
Sub-Process Fee Waiver
Title Financial Hardship Waiver
Trigger Parent submits fee waiver request with
documentation
Condition IF parent_job_loss_proven OR
medical_emergency_proven THEN 25-50% waiver;
IF death_of_earning_member THEN 100% waiver
for current term
Action Route to Branch Head + Director joint approval;
waiver valid for current term only (renewal
required)
Exception RTE students already subsidized — no additional
waiver applicable
Owner Role Branch Head + Director
Source School Policy 2024 §5.13
Compliance —
Status Approved
Version 1.0
Related ADR ADR-008
R-FIN-019 — RTE Section 12 Reimbursement Claim
Rule ID R-FIN-019
Domain Finance
Sub-Process RTE Reimbursement
Title RTE Section 12 Reimbursement Claim
Trigger Quarterly RTE reimbursement cycle
Condition IF ews_student_enrolled AND
ews_student_attendance >= 75% THEN claim per-
child-reimbursement from state (either actual fee
or state-per-capita-cost, whichever is lower)
Action Generate claim file; upload to state RTE portal;
track reimbursement status; reconcile on receipt
37

PreOne BRC v1.0 | Business Rules Catalog
Exception State delay: provision for interest after 90 days
per state RTE rules
Owner Role Principal + Accounts Team
Source RTE Act §12(2); State RTE Reimbursement Rules
Compliance RTE §12
Status Approved
Version 1.0
Related ADR ADR-008, ADR-019
R-FIN-020 — Annual Financial Audit
Rule ID R-FIN-020
Domain Finance
Sub-Process Audit
Title Annual Financial Audit
Trigger End of financial year (March 31)
Condition IF financial_year_end = TRUE THEN initiate
external audit within 30 days
Action Engage CA firm; provide books, invoices, receipts,
bank statements; receive audit report; file ITR
Exception Tax audit mandatory if turnover > ₹1 crore
(§44AB)
Owner Role Finance Head + CA
Source Income Tax Act §44AB; Companies Act §139 (if
incorporated)
Compliance IT Act §44AB
Status Approved
Version 1.0
Related ADR ADR-008
4. Operational Rules
Operational rules cover Daily Operations domain — child safety, pickup authorization, attendance
thresholds, transport routing, meal/nap time rules, आति(cid:12) incident escalation. ह्या(cid:2) rules चा(cid:2) primary goal
म्हा(cid:12)जे(cid:10) child safety + operational consistency. Pickup authorization rule हा(cid:31) सर्व<(cid:6) critical rule आहा(cid:10) —
38

PreOne BRC v1.0 | Business Rules Catalog
unauthorized pickup हा(cid:2) direct safety risk आहा(cid:10). त्ये(cid:2)मळे(cid:27) (cid:10) ह्या(cid:2) category मधी(cid:31)ला बहा(cid:27)(cid:6)(cid:2)श(cid:14) rules exception-averse
आहा(cid:10)(cid:6) (exception क(cid:10)र्वळे documented Branch Head override स$ब(cid:6)).
ह्या(cid:2) category मध्ये (cid:10)20 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
quick overview दा(cid:6)(cid:10) (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10).
4.1 Summary Table — Operational Rules
Rule ID Title Trigger Action Owner
R-OPS-001 Authorized Pickup Child Enforce max 4 Branch Admin +
Person List enrollment / authorized Parent
Parent app pickups per child;
onboarding store photos + ID
proof in
encrypted form
R-OPS-002 Unauthorized Person arrives for Hold child in Teacher + Branch
Pickup Block child pickup not supervision area; Admin
in authorized list call parent for
authorization; if
confirmed via
parent app OTP,
allow pickup with
photo capture
R-OPS-003 Late Pickup Fee Child picked up Auto-generate Branch Admin
after school late pickup
closing time invoice; notify
parent; recurring
late (>3
times/quarter)
triggers meeting
with Branch Head
R-OPS-004 Arrival Cutoff Child arrival at Allow entry with Branch Admin +
Time school gate late pass; log Teacher
reason (parent
input); recurring
late (>3/week)
triggers parent
meeting
39

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title          | Trigger          | Action            | Owner        |
| --------- | -------------- | ---------------- | ----------------- | ------------ |
| R-OPS-005 | Attendance     | Annual           | Flag for review;  | Principal +  |
|           | Threshold for  | promotion cycle  | require parent    | Teacher      |
|           | Promotion      | (March-April)    | meeting +         |              |
remedial plan;
conditional
promotion with
attendance
improvement
plan
R-OPS-006 Attendance  Daily school  Send reminder to  Teacher + Branch
|     | Marking Window | session start | teacher; after 60  | Admin |
| --- | -------------- | ------------- | ------------------ | ----- |
min, escalate to
Branch Admin to
mark attendance
R-OPS-007 Mid-Day Exit Gate  Parent requests  Generate digital  Branch Admin +
|     | Pass | mid-day child  | gate pass;        | Security |
| --- | ---- | -------------- | ----------------- | -------- |
|     |      | pickup         | teacher releases  |          |
child; security
logs exit time
R-OPS-008 Visitor Logging Visitor arrives at  Capture visitor  Security +
|     |     | school gate | details; issue  | Reception |
| --- | --- | ----------- | --------------- | --------- |
visitor badge;
host notified via
app; badge
returned on exit
R-OPS-009 Bus Route  Transport opt-in  Assign child to  Transport In-
|     | Assignment | during         | nearest pickup    | charge |
| --- | ---------- | -------------- | ----------------- | ------ |
|     |            | admission /    | point; notify     |        |
|     |            | annual renewal | parent + driver;  |        |
generate route
card
R-OPS-010 Bus Tracking —  Bus trip start  Auto-notify  Transport In-
|     | Real-time GPS | (morning pickup /  | parents of       | charge |
| --- | ------------- | ------------------ | ---------------- | ------ |
|     |               | evening drop)      | expected delay;  |        |
Transport In-
charge calls
driver; if
unreachable >15
min, escalate to
Branch Head
40

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-OPS-011 Bus Missing Child  Bus arrives at  Trigger P0 alert:  Transport In-
|     | Alert | school / drop  | Branch Head +  | charge + Branch  |
| --- | ----- | -------------- | -------------- | ---------------- |
|     |       | point          | Transport In-  | Head             |
charge + Parent +
Driver; halt bus;
conduct physical
search
R-OPS-012 Morning Health  Child arrival at  Move child to  Teacher + Health
|     | Check | classroom | health room;  | Attendant |
| --- | ----- | --------- | ------------- | --------- |
notify parent
within 5 min;
record
observation in
health log
R-OPS-013 Meal Allergy  Daily meal  Generate  Kitchen In-charge
|     | Check | preparation /  | allergen-safe  | + Teacher |
| --- | ----- | -------------- | -------------- | --------- |
|     |       | serving        | meal list per  |           |
class; kitchen gets
allergy-aware
menu; serve
alternative
R-OPS-014 Nap Time  Daily nap time  Assign supervisor;  Teacher + Nap
|     | Supervision | slot (post-lunch) | conduct visual  | Supervisor |
| --- | ----------- | ----------------- | --------------- | ---------- |
check every 10
min; record nap
quality in daily
sheet
R-OPS-015 Incident  Any incident  Auto-route to  Teacher + Branch
|     | Escalation Matrix | reported (injury,  | appropriate        | Head |
| --- | ----------------- | ------------------ | ------------------ | ---- |
|     |                   | illness,           | escalation level;  |      |
|     |                   | behavioral,        | incident report    |      |
|     |                   | safety)            | generated;         |      |
mandatory
follow-up within
24 hours
R-OPS-016 Photo Consent  Child photo  Flag photos with  Teacher +
for Marketing captured for  consent status; AI  Marketing Team
|     |     | marketing/social  | face-blur applied  |     |
| --- | --- | ----------------- | ------------------ | --- |
|     |     | media             | for non-           |     |
consenting
children in batch
photos
41

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-OPS-017 Daily Timeline  Each major daily  Auto-push  System
|     | Push to Parent | activity         | timeline entry to  | (Automated) |
| --- | -------------- | ---------------- | ------------------ | ----------- |
|     |                | completion       | parent app with    |             |
|     |                | (arrival, meal,  | timestamp, photo   |             |
|     |                | activity, nap,   | (if consent),      |             |
|     |                | pickup)          | activity           |             |
description
R-OPS-018 Food Sample  Each meal served  Auto-label sample  Kitchen In-charge
|     | Retention | (breakfast, lunch,  | with             |     |
| --- | --------- | ------------------- | ---------------- | --- |
|     |           | snack)              | date/meal/quanti |     |
ty; dispose after
48 hours; log
retention +
disposal
R-OPS-019 Washroom  Child requests  Assign staff per  Teacher + Care
|     | Assistance | washroom break | age group; log  | Staff |
| --- | ---------- | -------------- | --------------- | ----- |
washroom visits
in daily sheet;
monitor
frequency for
health issues
R-OPS-020 CCTV Coverage  Daily school  Continuous  Branch Admin +
|     | and Retention | operations | recording;  | IT  |
| --- | ------------- | ---------- | ----------- | --- |
motion-detection
alerts in
restricted areas;
auto-overwrite
after 90 days
4.2 Detailed Rule Cards — Operational Rules
R-OPS-001 — Authorized Pickup Person List
Rule ID R-OPS-001
Domain Daily Operations
Sub-Process Pickup Authorization
Title Authorized Pickup Person List
Trigger Child enrollment / Parent app onboarding
42

PreOne BRC v1.0 | Business Rules Catalog
Condition IF authorized_pickup_count > 4 THEN block
additional entries; each pickup person must have
photo + ID proof
Action Enforce max 4 authorized pickups per child; store
photos + ID proof in encrypted form
Exception Court-ordered guardianship: additional entries
with legal documentation
Owner Role Branch Admin + Parent
Source School Policy 2024 §4.1 (Child Safety)
Compliance DPDP §4; POCSO §19 (child safety reporting)
Status Approved
Version 1.0
Related ADR ADR-007, ADR-015
R-OPS-002 — Unauthorized Pickup Block
Rule ID R-OPS-002
Domain Daily Operations
Sub-Process Pickup Authorization
Title Unauthorized Pickup Block
Trigger Person arrives for child pickup not in authorized
list
Condition IF pickup_person_id NOT IN
child.authorized_pickup_list THEN block release
Action Hold child in supervision area; call parent for
authorization; if confirmed via parent app OTP,
allow pickup with photo capture
Exception Police/emergency services pickup: with written
documentation + Branch Head presence
Owner Role Teacher + Branch Admin
Source School Policy 2024 §4.1.2
Compliance POCSO §19
Status Approved
Version 1.0
Related ADR ADR-007, ADR-015
43

PreOne BRC v1.0 | Business Rules Catalog
R-OPS-003 — Late Pickup Fee
Rule ID R-OPS-003
Domain Daily Operations
Sub-Process Pickup
Title Late Pickup Fee
Trigger Child picked up after school closing time
Condition IF pickup_time > school_close_time + 15 min
THEN charge ₹100 per 30 min late
Action Auto-generate late pickup invoice; notify parent;
recurring late (>3 times/quarter) triggers meeting
with Branch Head
Exception Medical emergency (with proof): fee waived;
traffic conditions: first-time grace
Owner Role Branch Admin
Source School Policy 2024 §4.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-004 — Arrival Cutoff Time
Rule ID R-OPS-004
Domain Daily Operations
Sub-Process Arrival
Title Arrival Cutoff Time
Trigger Child arrival at school gate
Condition IF arrival_time > school_start_time + 30 min THEN
mark 'Late Arrival' in attendance
Action Allow entry with late pass; log reason (parent
input); recurring late (>3/week) triggers parent
meeting
Exception Medical appointment: late arrival excused with
doctor's note
Owner Role Branch Admin + Teacher
Source School Policy 2024 §4.3
44

PreOne BRC v1.0 | Business Rules Catalog
Compliance —
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-005 — Attendance Threshold for Promotion
Rule ID R-OPS-005
Domain Daily Operations
Sub-Process Attendance
Title Attendance Threshold for Promotion
Trigger Annual promotion cycle (March-April)
Condition IF annual_attendance < 75% THEN not eligible for
auto-promotion; case review by Principal
Action Flag for review; require parent meeting + remedial
plan; conditional promotion with attendance
improvement plan
Exception Medical condition with hospital certificate:
threshold relaxed to 60%
Owner Role Principal + Teacher
Source School Policy 2024 §4.4
Compliance RTE §16 (no expulsion until elementary)
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-006 — Attendance Marking Window
Rule ID R-OPS-006
Domain Daily Operations
Sub-Process Attendance
Title Attendance Marking Window
Trigger Daily school session start
Condition IF teacher NOT marked attendance by start_time
+ 30 min THEN system escalation
45

PreOne BRC v1.0 | Business Rules Catalog
Action Send reminder to teacher; after 60 min, escalate
to Branch Admin to mark attendance
Exception Substitute teacher scenario: substitute
responsible for marking
Owner Role Teacher + Branch Admin
Source School Policy 2024 §4.4.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-007 — Mid-Day Exit Gate Pass
Rule ID R-OPS-007
Domain Daily Operations
Sub-Process Gate Pass
Title Mid-Day Exit Gate Pass
Trigger Parent requests mid-day child pickup
Condition IF parent_request_received AND
parent_is_authorized_pickup THEN issue gate
pass with reason code
Action Generate digital gate pass; teacher releases child;
security logs exit time
Exception Unauthorized person: denied; emergency medical:
with Branch Head approval
Owner Role Branch Admin + Security
Source School Policy 2024 §4.5
Compliance —
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-008 — Visitor Logging
Rule ID R-OPS-008
Domain Daily Operations
46

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process Visitor
Title Visitor Logging
Trigger Visitor arrives at school gate
Condition IF visitor_purpose = 'School Visit' THEN
mandatory: photo + ID proof + purpose + host
name + entry/exit time
Action Capture visitor details; issue visitor badge; host
notified via app; badge returned on exit
Exception Regular service providers (vendors, school bus
drivers) — pre-registered with annual badges
Owner Role Security + Reception
Source School Policy 2024 §4.6; POSH Act §4 (visitor
safety)
Compliance POSH §4; DPDP §4
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-009 — Bus Route Assignment
Rule ID R-OPS-009
Domain Daily Operations
Sub-Process Transport
Title Bus Route Assignment
Trigger Transport opt-in during admission / annual
renewal
Condition IF child_address_within_route_radius = TRUE AND
seats_available = TRUE THEN assign route
Action Assign child to nearest pickup point; notify parent
+ driver; generate route card
Exception Special needs child: priority routing + seat
allocation near driver attendant
Owner Role Transport In-charge
Source School Policy 2024 §4.7
Compliance DPDP §4 (address data)
Status Approved
47

PreOne BRC v1.0 | Business Rules Catalog
Version 1.0
Related ADR ADR-007, ADR-018
R-OPS-010 — Bus Tracking — Real-time GPS
Rule ID R-OPS-010
Domain Daily Operations
Sub-Process Transport
Title Bus Tracking — Real-time GPS
Trigger Bus trip start (morning pickup / evening drop)
Condition IF gps_signal_lost > 5 min THEN alert Transport In-
charge + parent notification
Action Auto-notify parents of expected delay; Transport
In-charge calls driver; if unreachable >15 min,
escalate to Branch Head
Exception Tunnel/poor signal areas: 15-min grace before
alert
Owner Role Transport In-charge
Source School Policy 2024 §4.7.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-007, ADR-018
R-OPS-011 — Bus Missing Child Alert
Rule ID R-OPS-011
Domain Daily Operations
Sub-Process Transport
Title Bus Missing Child Alert
Trigger Bus arrives at school / drop point
Condition IF child_marked_on_bus = TRUE AND
child_not_present_at_arrival = TRUE THEN
immediate alert
48

PreOne BRC v1.0 | Business Rules Catalog
Action Trigger P0 alert: Branch Head + Transport In-
charge + Parent + Driver; halt bus; conduct
physical search
Exception None — safety rule, no exceptions
Owner Role Transport In-charge + Branch Head
Source School Policy 2024 §4.7.3 (POCSO-aligned)
Compliance POCSO §19
Status Approved
Version 1.0
Related ADR ADR-007, ADR-018
R-OPS-012 — Morning Health Check
Rule ID R-OPS-012
Domain Daily Operations
Sub-Process Health Check
Title Morning Health Check
Trigger Child arrival at classroom
Condition IF child_showing_symptoms [fever, rash,
contagious signs] THEN isolate + call parent for
pickup
Action Move child to health room; notify parent within 5
min; record observation in health log
Exception Chronic conditions (asthma, allergies) with
medication plan: child stays with monitoring
Owner Role Teacher + Health Attendant
Source School Policy 2024 §4.8; FSSR 2011 (food handling
proximity)
Compliance FSSR 2011; DPDP §4 (health data)
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-013 — Meal Allergy Check
Rule ID R-OPS-013
49

PreOne BRC v1.0 | Business Rules Catalog
Domain Daily Operations
Sub-Process Meals
Title Meal Allergy Check
Trigger Daily meal preparation / serving
Condition IF child_allergy_list intersects
today_meal_ingredients THEN allergen-safe
alternative meal served
Action Generate allergen-safe meal list per class; kitchen
gets allergy-aware menu; serve alternative
Exception None — allergy rule, no exceptions (life safety)
Owner Role Kitchen In-charge + Teacher
Source School Policy 2024 §4.9; FSSR 2011 §4
Compliance FSSR 2011
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-014 — Nap Time Supervision
Rule ID R-OPS-014
Domain Daily Operations
Sub-Process Nap Time
Title Nap Time Supervision
Trigger Daily nap time slot (post-lunch)
Condition IF child_age < 4 years AND nap_opted = TRUE
THEN mandatory supervised nap; supervisor:child
ratio 1:8
Action Assign supervisor; conduct visual check every 10
min; record nap quality in daily sheet
Exception Child refuses nap: quiet activity alternative with
supervisor monitoring
Owner Role Teacher + Nap Supervisor
Source School Policy 2024 §4.10
Compliance —
Status Approved
Version 1.0
50

PreOne BRC v1.0 | Business Rules Catalog
Related ADR ADR-007
R-OPS-015 — Incident Escalation Matrix
Rule ID R-OPS-015
Domain Daily Operations
Sub-Process Incidents
Title Incident Escalation Matrix
Trigger Any incident reported (injury, illness, behavioral,
safety)
Condition IF severity = LOW (minor scratch) THEN teacher
logs; IF MEDIUM (minor injury) THEN Branch
Admin + parent notified; IF HIGH (hospital) THEN
Branch Head + Director + parent immediate call
Action Auto-route to appropriate escalation level;
incident report generated; mandatory follow-up
within 24 hours
Exception None — incident reporting mandatory, no
suppression allowed
Owner Role Teacher + Branch Head
Source School Policy 2024 §4.11; POCSO §19
Compliance POCSO §19; DPDP §4 (incident data)
Status Approved
Version 1.0
Related ADR ADR-007, ADR-015
R-OPS-016 — Photo Consent for Marketing
Rule ID R-OPS-016
Domain Daily Operations
Sub-Process Photos
Title Photo Consent for Marketing
Trigger Child photo captured for marketing/social media
Condition IF parent_marketing_consent = FALSE THEN
child's face auto-blurred in marketing materials;
class photos OK
51

PreOne BRC v1.0 | Business Rules Catalog
Action Flag photos with consent status; AI face-blur
applied for non-consenting children in batch
photos
Exception Marketing consent can be withdrawn anytime via
parent app; takes effect within 24 hours
Owner Role Teacher + Marketing Team
Source School Policy 2024 §4.12
Compliance DPDP §4, §11, §21
Status Approved
Version 1.0
Related ADR ADR-007, ADR-015
R-OPS-017 — Daily Timeline Push to Parent
Rule ID R-OPS-017
Domain Daily Operations
Sub-Process Timeline
Title Daily Timeline Push to Parent
Trigger Each major daily activity completion (arrival, meal,
activity, nap, pickup)
Condition IF activity_completed = TRUE AND
parent_push_enabled = TRUE THEN push timeline
entry within 5 min
Action Auto-push timeline entry to parent app with
timestamp, photo (if consent), activity description
Exception Network failure: timeline cached, pushed on
reconnection; no data loss
Owner Role System (Automated)
Source School Policy 2024 §4.13
Compliance DPDP §4 (parental access to child data)
Status Approved
Version 1.0
Related ADR ADR-007
52

PreOne BRC v1.0 | Business Rules Catalog
R-OPS-018 — Food Sample Retention
Rule ID R-OPS-018
Domain Daily Operations
Sub-Process Food Safety
Title Food Sample Retention
Trigger Each meal served (breakfast, lunch, snack)
Condition IF meal_served = TRUE THEN retain sample (50g)
for 48 hours in refrigerated storage
Action Auto-label sample with date/meal/quantity;
dispose after 48 hours; log retention + disposal
Exception None — FSSAI mandatory rule
Owner Role Kitchen In-charge
Source FSSR 2011 §4; FSSAI Guidelines
Compliance FSSR 2011 §4
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-019 — Washroom Assistance
Rule ID R-OPS-019
Domain Daily Operations
Sub-Process Washroom
Title Washroom Assistance
Trigger Child requests washroom break
Condition IF child_age < 3.5 years THEN mandatory staff
assistance; IF 3.5-5 years THEN staff escort to
door; IF > 5 years THEN independent with periodic
check
Action Assign staff per age group; log washroom visits in
daily sheet; monitor frequency for health issues
Exception Special needs child: one-on-one assistance
irrespective of age
Owner Role Teacher + Care Staff
Source School Policy 2024 §4.14
Compliance POCSO §19 (child safety)
53

PreOne BRC v1.0 | Business Rules Catalog
Status Approved
Version 1.0
Related ADR ADR-007
R-OPS-020 — CCTV Coverage and Retention
Rule ID R-OPS-020
Domain Daily Operations
Sub-Process CCTV
Title CCTV Coverage and Retention
Trigger Daily school operations
Condition IF area IN [classroom, corridor, gate, playground,
kitchen] THEN mandatory CCTV coverage;
retention = 90 days
Action Continuous recording; motion-detection alerts in
restricted areas; auto-overwrite after 90 days
Exception Washrooms, changing rooms: NO cameras
(POCSO/privacy law)
Owner Role Branch Admin + IT
Source School Policy 2024 §4.15; NBC 2016; POSH Act §4
Compliance POSH §4; DPDP §4; POCSO §19
Status Approved
Version 1.0
Related ADR ADR-007, ADR-015
5. Academic Rules
Academic rules govern curriculum planning, milestone assessment, observation recording
frequency, report card generation, आति(cid:12) promotion criteria. ह्या(cid:2) rules चा(cid:2) primary goal म्हा(cid:12)जे(cid:10) learning
outcome consistency across teachers आति(cid:12) branches. NEP 2020 ECCE curriculum framework आति(cid:12)
age-appropriate milestone guidelines (WHO/CDC Early Childhood Development) ये(cid:2)च्(cid:14) ये(cid:2) आधी(cid:2)रा(cid:10) rules
design क(cid:10)ल्ये(cid:2) आहा(cid:10)(cid:6).
ह्या(cid:2) category मध्ये (cid:10)18 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
quick overview दा(cid:6)(cid:10) (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10).
54

PreOne BRC v1.0  |  Business Rules Catalog
5.1 Summary Table — Academic Rules
| Rule ID   | Title          | Trigger          | Action           | Owner          |
| --------- | -------------- | ---------------- | ---------------- | -------------- |
| R-ACD-001 | Curriculum     | Academic year    | Auto-create      | Academic       |
|           | Theme Rotation | planning (April) | theme calendar;  | Coordinator +  |
|           |                |                  | each theme       | Principal      |
duration 3-4
weeks; activities
linked to theme
R-ACD-002 Weekly Lesson  Friday end-of-day Send reminder  Teacher +
|     | Plan Submission |     | Friday 5 PM;  | Coordinator |
| --- | --------------- | --- | ------------- | ----------- |
escalate to
Coordinator
Saturday 10 AM;
Coordinator
prepares default
plan if not
received by
Saturday 5 PM
R-ACD-003 Daily Activity  Daily school day  Enforce minimum  Teacher +
|     | Slots | start | activities per day;  | Coordinator |
| --- | ----- | ----- | -------------------- | ----------- |
system warns if
teacher marks
fewer activities
R-ACD-004 Observation  Daily observation  Friday summary:  Teacher +
|     | Recording  | window | list of children  | Coordinator |
| --- | ---------- | ------ | ----------------- | ----------- |
|     | Frequency  |        | with missing      |             |
observations;
teacher must
complete by
Saturday EOD
R-ACD-005 Observation  Observation  Prompt teacher  Teacher +
|     | Quality Check | saved by teacher | to expand  | Coordinator |
| --- | ------------- | ---------------- | ---------- | ----------- |
observation;
weekly review by
Coordinator;
recurring low-
quality triggers
coaching
55

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title       | Trigger         | Action             | Owner       |
| --------- | ----------- | --------------- | ------------------ | ----------- |
| R-ACD-006 | Milestone   | Quarterly       | Generate           | Teacher +   |
|           | Assessment  | milestone cycle | assessment         | Coordinator |
|           | Frequency   |                 | templates per age  |             |
group; teachers
complete within 2
weeks; parents
get milestone
report
R-ACD-007 Milestone Delay  Milestone  Auto-flag; parent- Teacher +
|     | Alert | assessment  | teacher meeting   | Principal + Parent |
| --- | ----- | ----------- | ----------------- | ------------------ |
|     |       | completion  | scheduled within  |                    |
14 days; if
developmental
concern,
recommend
specialist
assessment
R-ACD-008 Portfolio Update  Monthly portfolio  Auto-compile  Teacher + System
|     | Cadence | cycle | portfolio entries  | (Automated) |
| --- | ------- | ----- | ------------------ | ----------- |
(observations,
photos, artwork,
milestone
progress); share
with parent via
app
R-ACD-009 Report Card  Term end  AI-assisted draft  Teacher +
|     | Generation Cycle | (October + April) | (combines  | Principal |
| --- | ---------------- | ----------------- | ---------- | --------- |
observations,
milestones,
activities);
teacher review +
edit; parent
notification + app
push
R-ACD-010 Report Card  Teacher submits  Multi-level  Teacher +
|     | Approval  | report card | approval          | Coordinator +  |
| --- | --------- | ----------- | ----------------- | -------------- |
|     | Workflow  |             | workflow; locked  | Principal      |
once approved;
parent release
after final
approval
56

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title      | Trigger          | Action          | Owner        |
| --------- | ---------- | ---------------- | --------------- | ------------ |
| R-ACD-011 | Promotion  | Annual           | Auto-promote;   | Principal +  |
|           | Criteria   | promotion cycle  | update student  | Teacher      |
|           |            | (March-April)    | record; notify  |              |
parent; assign to
next class section
R-ACD-012 Age-Based Class  Promotion cycle Flag for Principal  Principal + Parent
|     | Cap |     | review; parent  |     |
| --- | --- | --- | --------------- | --- |
meeting; may
recommend
transition to
mainstream
school (Sr.KG →
Grade 1)
R-ACD-013 PTM Frequency Quarterly PTM  Auto-schedule  Teacher +
|     |     | cycle | PTM; parent  | Coordinator |
| --- | --- | ----- | ------------ | ----------- |
invites via app +
SMS; teacher
prepares child
progress
summary; PTM
attendance
logged
R-ACD-014 Remedial  Milestone  Auto-enroll in 4- Teacher + Special
Program Trigger assessment OR  week remedial  Educator + Parent
|     |     | teacher     | track; weekly  |     |
| --- | --- | ----------- | -------------- | --- |
|     |     | observation | progress       |     |
monitoring;
specialist
consultation if no
improvement
R-ACD-015 Outdoor Play  Daily schedule Enforce minimum  Teacher +
|     | Duration |     | outdoor time in  | Coordinator |
| --- | -------- | --- | ---------------- | ----------- |
daily schedule; if
weather
prevents, indoor
gross-motor
activities
substitute
57

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title          | Trigger        | Action          | Owner   |
| --------- | -------------- | -------------- | --------------- | ------- |
| R-ACD-016 | Activity       | Each activity  | Prompt teacher  | Teacher |
|           | Participation  | completion     | to log reason   |         |
|           | Tracking       |                | (mood, health,  |         |
social); if pattern
persists, parent
notification
| R-ACD-017 | Annual           | End of academic  | Committee        | Principal +  |
| --------- | ---------------- | ---------------- | ---------------- | ------------ |
|           | Curriculum Audit | year (April)     | meeting in May;  | Academic     |
|           |                  |                  | revised          | Committee    |
curriculum
approved by
June; new theme
calendar
published
R-ACD-018 Field Trip Safety  Field trip planned Block trip if any  Coordinator +
|     | Protocol |     | criterion fails;  | Branch Head |
| --- | -------- | --- | ----------------- | ----------- |
generate
permission slips;
pre-trip safety
briefing; post-trip
report
5.2 Detailed Rule Cards — Academic Rules
R-ACD-001 — Curriculum Theme Rotation
Rule ID R-ACD-001
Domain
Academics
Sub-Process Curriculum Planning
Title Curriculum Theme Rotation
Trigger Academic year planning (April)
Condition IF class IN [Playgroup, Nursery, Jr.KG, Sr.KG] THEN
minimum 12 themes per year (1 per month)
Action Auto-create theme calendar; each theme duration
3-4 weeks; activities linked to theme
Exception Festival/special event months: theme adjusted to
align with cultural context
Owner Role Academic Coordinator + Principal
58

PreOne BRC v1.0 | Business Rules Catalog
Source School Policy 2024 §6.1; NEP 2020 ECCE
Framework
Compliance NEP 2020
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-002 — Weekly Lesson Plan Submission
Rule ID R-ACD-002
Domain Academics
Sub-Process Weekly Planning
Title Weekly Lesson Plan Submission
Trigger Friday end-of-day
Condition IF teacher.lesson_plan_for_next_week NOT
submitted by Friday 5 PM THEN escalation
Action Send reminder Friday 5 PM; escalate to
Coordinator Saturday 10 AM; Coordinator
prepares default plan if not received by Saturday 5
PM
Exception Holiday week: deadline extended to next working
day
Owner Role Teacher + Coordinator
Source School Policy 2024 §6.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-003 — Daily Activity Slots
Rule ID R-ACD-003
Domain Academics
Sub-Process Daily Activities
Title Daily Activity Slots
Trigger Daily school day start
59

PreOne BRC v1.0 | Business Rules Catalog
Condition IF class = Playgroup/Nursery THEN min 6 activity
slots; IF Jr/Sr.KG THEN min 8 slots
Action Enforce minimum activities per day; system warns
if teacher marks fewer activities
Exception Special event days (sports day, festival):
customized activity schedule
Owner Role Teacher + Coordinator
Source School Policy 2024 §6.3
Compliance —
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-004 — Observation Recording Frequency
Rule ID R-ACD-004
Domain Academics
Sub-Process Observation
Title Observation Recording Frequency
Trigger Daily observation window
Condition IF teacher NOT recorded min 1 observation per
child per week THEN system alert
Action Friday summary: list of children with missing
observations; teacher must complete by Saturday
EOD
Exception Child absent >3 days in week: observation waived
for that week
Owner Role Teacher + Coordinator
Source School Policy 2024 §6.4; NEP 2020 ECCE
Compliance NEP 2020
Status Approved
Version 1.0
Related ADR ADR-006
60

PreOne BRC v1.0 | Business Rules Catalog
R-ACD-005 — Observation Quality Check
Rule ID R-ACD-005
Domain Academics
Sub-Process Observation
Title Observation Quality Check
Trigger Observation saved by teacher
Condition IF observation_text_length < 20 chars OR
observation_text = 'Good'/'Fine' THEN flag as low-
quality
Action Prompt teacher to expand observation; weekly
review by Coordinator; recurring low-quality
triggers coaching
Exception AI Observation Assistant: teacher can accept AI-
suggested expansion (with edit) — auto-qualifies
Owner Role Teacher + Coordinator
Source School Policy 2024 §6.4.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-006, ADR-020
R-ACD-006 — Milestone Assessment Frequency
Rule ID R-ACD-006
Domain Academics
Sub-Process Milestone
Title Milestone Assessment Frequency
Trigger Quarterly milestone cycle
Condition IF quarter_end = TRUE THEN mandatory
milestone assessment for all enrolled children
Action Generate assessment templates per age group;
teachers complete within 2 weeks; parents get
milestone report
Exception Child enrolled <30 days in quarter: assessment
deferred to next quarter
Owner Role Teacher + Coordinator
61

PreOne BRC v1.0 | Business Rules Catalog
Source School Policy 2024 §6.5; WHO/CDC ECD
Milestones
Compliance NEP 2020
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-007 — Milestone Delay Alert
Rule ID R-ACD-007
Domain Academics
Sub-Process Milestone
Title Milestone Delay Alert
Trigger Milestone assessment completion
Condition IF child_milestone_score < 50th percentile for age
THEN flag for monitoring; IF <25th percentile
THEN developmental concern flag
Action Auto-flag; parent-teacher meeting scheduled
within 14 days; if developmental concern,
recommend specialist assessment
Exception Premature birth / known developmental history:
calibrated milestones per pediatrician guidance
Owner Role Teacher + Principal + Parent
Source School Policy 2024 §6.5.2; WHO ECD Milestones
Compliance RPWD Act 2016 (early intervention)
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-008 — Portfolio Update Cadence
Rule ID R-ACD-008
Domain Academics
Sub-Process Portfolio
Title Portfolio Update Cadence
Trigger Monthly portfolio cycle
62

PreOne BRC v1.0 | Business Rules Catalog
Condition IF month_end = TRUE THEN min 4 portfolio
entries per child (1 per week)
Action Auto-compile portfolio entries (observations,
photos, artwork, milestone progress); share with
parent via app
Exception Child absent >50% in month: portfolio reflects
available entries with explanatory note
Owner Role Teacher + System (Automated)
Source School Policy 2024 §6.6
Compliance DPDP §4 (parental access)
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-009 — Report Card Generation Cycle
Rule ID R-ACD-009
Domain Academics
Sub-Process Report Card
Title Report Card Generation Cycle
Trigger Term end (October + April)
Condition IF term_end = TRUE THEN generate report card
for every active child
Action AI-assisted draft (combines observations,
milestones, activities); teacher review + edit;
parent notification + app push
Exception Child enrolled <60 days in term: abbreviated
report card with note
Owner Role Teacher + Principal
Source School Policy 2024 §6.7
Compliance —
Status Approved
Version 1.0
Related ADR ADR-006, ADR-020
63

PreOne BRC v1.0 | Business Rules Catalog
R-ACD-010 — Report Card Approval Workflow
Rule ID R-ACD-010
Domain Academics
Sub-Process Report Card
Title Report Card Approval Workflow
Trigger Teacher submits report card
Condition IF class = Playgroup/Nursery THEN Coordinator
approval; IF Jr/Sr.KG THEN Coordinator + Principal
approval
Action Multi-level approval workflow; locked once
approved; parent release after final approval
Exception Disagreement on assessment: teacher can request
re-review with documented rationale
Owner Role Teacher + Coordinator + Principal
Source School Policy 2024 §6.7.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-011 — Promotion Criteria
Rule ID R-ACD-011
Domain Academics
Sub-Process Promotion
Title Promotion Criteria
Trigger Annual promotion cycle (March-April)
Condition IF annual_attendance >= 75% AND
milestone_score >= 50th percentile AND
fee_clearance = TRUE THEN auto-promote to next
class
Action Auto-promote; update student record; notify
parent; assign to next class section
Exception Fails any criterion: case review by Principal;
conditional promotion with improvement plan OR
retention (RTE §16 prohibits expulsion)
Owner Role Principal + Teacher
64

PreOne BRC v1.0 | Business Rules Catalog
Source School Policy 2024 §6.8; RTE §16
Compliance RTE §16
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-012 — Age-Based Class Cap
Rule ID R-ACD-012
Domain Academics
Sub-Process Promotion
Title Age-Based Class Cap
Trigger Promotion cycle
Condition IF promoted_child_age > class_max_age + 1 year
THEN discussion with parent for grade-
appropriate placement
Action Flag for Principal review; parent meeting; may
recommend transition to mainstream school
(Sr.KG → Grade 1)
Exception Special needs child: continue in preschool with
modified curriculum (RPWD Act compliance)
Owner Role Principal + Parent
Source School Policy 2024 §6.8.2
Compliance RPWD Act 2016
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-013 — PTM Frequency
Rule ID R-ACD-013
Domain Academics
Sub-Process Parent-Teacher Meeting
Title PTM Frequency
Trigger Quarterly PTM cycle
65

PreOne BRC v1.0 | Business Rules Catalog
Condition IF quarter_end = TRUE THEN mandatory PTM for
all classes
Action Auto-schedule PTM; parent invites via app + SMS;
teacher prepares child progress summary; PTM
attendance logged
Exception Parent unable to attend: reschedule within 7 days;
if 2+ missed PTMs, escalate to Branch Head
Owner Role Teacher + Coordinator
Source School Policy 2024 §6.9
Compliance —
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-014 — Remedial Program Trigger
Rule ID R-ACD-014
Domain Academics
Sub-Process Remedial
Title Remedial Program Trigger
Trigger Milestone assessment OR teacher observation
Condition IF child_milestone_score < 25th percentile OR
teacher_flags_concern = TRUE THEN enroll in
remedial program
Action Auto-enroll in 4-week remedial track; weekly
progress monitoring; specialist consultation if no
improvement
Exception Parent refusal: documented; child continues
regular curriculum; quarterly reassessment
Owner Role Teacher + Special Educator + Parent
Source School Policy 2024 §6.10; RPWD Act 2016
Compliance RPWD Act 2016
Status Approved
Version 1.0
Related ADR ADR-006
66

PreOne BRC v1.0 | Business Rules Catalog
R-ACD-015 — Outdoor Play Duration
Rule ID R-ACD-015
Domain Academics
Sub-Process Outdoor Play
Title Outdoor Play Duration
Trigger Daily schedule
Condition IF class = Playgroup/Nursery THEN min 60 min
outdoor; IF Jr/Sr.KG THEN min 90 min
Action Enforce minimum outdoor time in daily schedule;
if weather prevents, indoor gross-motor activities
substitute
Exception Air quality index > 200 (poor): indoor alternatives;
rain: indoor play area
Owner Role Teacher + Coordinator
Source School Policy 2024 §6.11; WHO Physical Activity
Guidelines
Compliance —
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-016 — Activity Participation Tracking
Rule ID R-ACD-016
Domain Academics
Sub-Process Activity Assessment
Title Activity Participation Tracking
Trigger Each activity completion
Condition IF child_participation_in_activity = FALSE for >3
consecutive activities THEN teacher investigation
Action Prompt teacher to log reason (mood, health,
social); if pattern persists, parent notification
Exception Child new to school (<2 weeks): grace period for
adjustment
Owner Role Teacher
Source School Policy 2024 §6.12
67

PreOne BRC v1.0 | Business Rules Catalog
Compliance —
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-017 — Annual Curriculum Audit
Rule ID R-ACD-017
Domain Academics
Sub-Process Curriculum Review
Title Annual Curriculum Audit
Trigger End of academic year (April)
Condition IF academic_year_end = TRUE THEN curriculum
review committee evaluates theme effectiveness,
milestone outcomes, parent feedback
Action Committee meeting in May; revised curriculum
approved by June; new theme calendar published
Exception Mid-year emergency revision allowed with Branch
Head approval (e.g., pandemic-driven changes)
Owner Role Principal + Academic Committee
Source School Policy 2024 §6.13; NEP 2020
Compliance NEP 2020
Status Approved
Version 1.0
Related ADR ADR-006
R-ACD-018 — Field Trip Safety Protocol
Rule ID R-ACD-018
Domain Academics
Sub-Process Field Trip
Title Field Trip Safety Protocol
Trigger Field trip planned
Condition IF field_trip_planned = TRUE THEN mandatory:
parent consent (per child), staff:child ratio 1:5,
first aid kit, emergency contact list
68

PreOne BRC v1.0 | Business Rules Catalog
Action Block trip if any criterion fails; generate
permission slips; pre-trip safety briefing; post-trip
report
Exception None — safety rule, no exceptions
Owner Role Coordinator + Branch Head
Source School Policy 2024 §6.14; POCSO §19
Compliance POCSO §19
Status Approved
Version 1.0
Related ADR ADR-006
6. Human Resources Rules
HR rules govern staff recruitment, leave, payroll, performance review, background verification, आति(cid:12)
exit process. POSH Act 2013 compliance mandatory आहा(cid:10) — Internal Complaints Committee
formation, annual POSH training, complaint redressal SLA. Staff qualification rules NEP 2020 ECCE
teacher qualification norms श(cid:31) aligned आहा(cid:10)(cid:6) (minimum Diploma in Early Childhood Education).
ह्या(cid:2) category मध्ये (cid:10)12 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
quick overview दा(cid:6)(cid:10) (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10).
6.1 Summary Table — Human Resources Rules
Rule ID Title Trigger Action Owner
R-HR-001 Staff Qualification New staff Mandatory HR + Principal
Minimum onboarding qualification
verification;
reject if not met;
document reason
R-HR-002 Staff Background New staff Mandatory: HR + Branch Head
Verification onboarding (post- police verification
offer, pre-joining) (within 30 days),
2 reference
checks, previous
employer
verification,
address proof
69

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-HR-003 Leave Entitlement  Annual leave  Auto-credit leave  HR + Staff
|     | Annual | cycle (April- | balance on April  |     |
| --- | ------ | ------------- | ----------------- | --- |
|     |        | March)        | 1; carry forward  |     |
max 5 earned
leaves
R-HR-004 Max Consecutive  Leave application  Route to  HR + Branch Head
|     | Leave | submitted | appropriate  |     |
| --- | ----- | --------- | ------------ | --- |
approver; ensure
substitute
teacher
arrangement for
teaching staff
R-HR-005 Substitute  Teacher absence  Auto-assign from  Coordinator + HR
|     | Teacher    | (approved leave  | substitute pool; if  |     |
| --- | ---------- | ---------------- | -------------------- | --- |
|     | Assignment | or unplanned)    | unavailable,         |     |
Coordinator
covers; parent
notification if
delay >30 min
R-HR-006 Payroll Cutoff  Monthly payroll  Lock attendance  HR + Accounts
|     | Date | cycle | on 25th EOD;  |     |
| --- | ---- | ----- | ------------- | --- |
process payroll
26-28; final
review 29th;
disbursement
30th
R-HR-007 Performance  Annual  Self-appraisal  HR + Reporting
|     | Review Cycle | performance   | (March 1-15);     | Manager |
| --- | ------------ | ------------- | ----------------- | ------- |
|     |              | cycle (March- | reviewer          |         |
|     |              | April)        | appraisal (March  |         |
16-31);
calibration (April
1-7); feedback
(April 8-15)
R-HR-008 Exit Process Staff submits  Mandatory:  HR + Branch Head
|     |     | resignation | notice period (60  |     |
| --- | --- | ----------- | ------------------ | --- |
days full-time, 30
days part-time);
handover
document; exit
interview; final
settlement within
30 days
70

PreOne BRC v1.0 | Business Rules Catalog
Rule ID Title Trigger Action Owner
R-HR-009 Internal Annual ICC Constitute ICC; HR + Director
Complaints constitution publish
Committee (ICC) (April) committee details
on notice board +
employee
handbook; annual
training
R-HR-010 Annual POSH Annual training Online POSH HR + Compliance
Training cycle (April-May) module; quiz with Officer
80% pass mark;
certificate valid 1
year; non-
completion blocks
payroll
R-HR-011 Food Handler Kitchen staff Annual medical HR + Kitchen In-
Medical onboarding + checkup; charge
Certificate annual renewal certificate on file;
non-completion
blocks kitchen
duties
R-HR-012 Probation Period New staff joining Probation review HR + Reporting
at end of period; Manager
confirmation OR
extension (max 6
months) OR
termination
6.2 Detailed Rule Cards — Human Resources Rules
R-HR-001 — Staff Qualification Minimum
Rule ID R-HR-001
Domain HR
Sub-Process Recruitment
Title Staff Qualification Minimum
Trigger New staff onboarding
Condition IF role = Teacher AND qualification NOT IN
[Diploma in ECCE, B.Ed, NTT, Montessori Diploma]
THEN reject
71

PreOne BRC v1.0 | Business Rules Catalog
Action Mandatory qualification verification; reject if not
met; document reason
Exception Assistant teacher: 12th pass + ECCE certificate in
progress (1-year grace)
Owner Role HR + Principal
Source NEP 2020 ECCE Teacher Qualification Norms;
School Policy 2024 §7.1
Compliance NEP 2020
Status Approved
Version 1.0
Related ADR ADR-009
R-HR-002 — Staff Background Verification
Rule ID R-HR-002
Domain HR
Sub-Process Background Verification
Title Staff Background Verification
Trigger New staff onboarding (post-offer, pre-joining)
Condition IF police_verification_pending = TRUE OR
reference_check_pending = TRUE THEN block
joining
Action Mandatory: police verification (within 30 days), 2
reference checks, previous employer verification,
address proof
Exception None — mandatory for child safety (POCSO)
Owner Role HR + Branch Head
Source School Policy 2024 §7.1.2; POCSO Act 2012
Compliance POCSO Act 2012
Status Approved
Version 1.0
Related ADR ADR-009, ADR-015
R-HR-003 — Leave Entitlement Annual
Rule ID R-HR-003
72

PreOne BRC v1.0 | Business Rules Catalog
Domain HR
Sub-Process Leave
Title Leave Entitlement Annual
Trigger Annual leave cycle (April-March)
Condition IF staff_role = Full-time AND tenure >= 1 year
THEN 12 casual + 15 earned + 12 sick leaves
Action Auto-credit leave balance on April 1; carry forward
max 5 earned leaves
Exception Maternity: 26 weeks per Maternity Benefit Act;
Paternity: 5 days
Owner Role HR + Staff
Source School Policy 2024 §7.3; Maternity Benefit Act
2017
Compliance Maternity Benefit Act 2017
Status Approved
Version 1.0
Related ADR ADR-009
R-HR-004 — Max Consecutive Leave
Rule ID R-HR-004
Domain HR
Sub-Process Leave
Title Max Consecutive Leave
Trigger Leave application submitted
Condition IF leave_type = Casual AND consecutive_days > 3
THEN Branch Head approval required; IF > 7 THEN
Director approval
Action Route to appropriate approver; ensure substitute
teacher arrangement for teaching staff
Exception Medical leave with hospital certificate: bypass
consecutive limit
Owner Role HR + Branch Head
Source School Policy 2024 §7.3.2
Compliance —
Status Approved
73

PreOne BRC v1.0 | Business Rules Catalog
Version 1.0
Related ADR ADR-009
R-HR-005 — Substitute Teacher Assignment
Rule ID R-HR-005
Domain HR
Sub-Process Substitute Teacher
Title Substitute Teacher Assignment
Trigger Teacher absence (approved leave or unplanned)
Condition IF teacher_absent = TRUE AND
class_has_session_today = TRUE THEN assign
substitute within 30 min
Action Auto-assign from substitute pool; if unavailable,
Coordinator covers; parent notification if delay
>30 min
Exception Multiple teacher absence: priority by class age
(younger children get priority)
Owner Role Coordinator + HR
Source School Policy 2024 §7.4
Compliance —
Status Approved
Version 1.0
Related ADR ADR-009
R-HR-006 — Payroll Cutoff Date
Rule ID R-HR-006
Domain HR
Sub-Process Payroll
Title Payroll Cutoff Date
Trigger Monthly payroll cycle
Condition IF attendance_recorded_through_25th = TRUE
THEN payroll processed on 28th; credit on
30th/31st
74

PreOne BRC v1.0 | Business Rules Catalog
Action Lock attendance on 25th EOD; process payroll 26-
28; final review 29th; disbursement 30th
Exception Weekend: payroll credit shifted to last working
day
Owner Role HR + Accounts
Source School Policy 2024 §7.5; Payment of Wages Act
Compliance Payment of Wages Act 1936
Status Approved
Version 1.0
Related ADR ADR-009
R-HR-007 — Performance Review Cycle
Rule ID R-HR-007
Domain HR
Sub-Process Performance Review
Title Performance Review Cycle
Trigger Annual performance cycle (March-April)
Condition IF staff_tenure >= 6 months THEN mandatory
annual performance review
Action Self-appraisal (March 1-15); reviewer appraisal
(March 16-31); calibration (April 1-7); feedback
(April 8-15)
Exception Probation staff (<6 months): no formal review;
informal 90-day check-in
Owner Role HR + Reporting Manager
Source School Policy 2024 §7.6
Compliance —
Status Approved
Version 1.0
Related ADR ADR-009
R-HR-008 — Exit Process
Rule ID R-HR-008
Domain HR
75

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process Exit
Title Exit Process
Trigger Staff submits resignation
Condition IF notice_period_served = TRUE AND
handover_complete = TRUE AND dues_cleared =
TRUE THEN process exit
Action Mandatory: notice period (60 days full-time, 30
days part-time); handover document; exit
interview; final settlement within 30 days
Exception Termination for cause: immediate exit with
pending dues adjustment + legal hold
Owner Role HR + Branch Head
Source School Policy 2024 §7.7; Industrial Employment
Standing Orders Act
Compliance IESO Act 1946
Status Approved
Version 1.0
Related ADR ADR-009
R-HR-009 — Internal Complaints Committee (ICC)
Rule ID R-HR-009
Domain HR
Sub-Process POSH Compliance
Title Internal Complaints Committee (ICC)
Trigger Annual ICC constitution (April)
Condition IF staff_count >= 10 THEN mandatory ICC with:
senior woman employee as chair + 2 women
members + 1 external NGO member
Action Constitute ICC; publish committee details on
notice board + employee handbook; annual
training
Exception Staff < 10: constitute Internal Complaints
Committee per state rules (may combine with
other branches)
Owner Role HR + Director
Source POSH Act 2013 §4
76

PreOne BRC v1.0 | Business Rules Catalog
Compliance POSH Act 2013
Status Approved
Version 1.0
Related ADR ADR-009, ADR-015
R-HR-010 — Annual POSH Training
Rule ID R-HR-010
Domain HR
Sub-Process Training
Title Annual POSH Training
Trigger Annual training cycle (April-May)
Condition IF staff_status = ACTIVE THEN mandatory POSH
training completion by May 31
Action Online POSH module; quiz with 80% pass mark;
certificate valid 1 year; non-completion blocks
payroll
Exception Maternity/long leave staff: 30 days post-return
grace period
Owner Role HR + Compliance Officer
Source POSH Act 2013 §19
Compliance POSH Act 2013
Status Approved
Version 1.0
Related ADR ADR-009, ADR-015
R-HR-011 — Food Handler Medical Certificate
Rule ID R-HR-011
Domain HR
Sub-Process Medical
Title Food Handler Medical Certificate
Trigger Kitchen staff onboarding + annual renewal
Condition IF staff_role IN [Cook, Kitchen Helper, Food
Server] THEN mandatory medical certificate with
stool/urine test
77

PreOne BRC v1.0 | Business Rules Catalog
Action Annual medical checkup; certificate on file; non-
completion blocks kitchen duties
Exception None — FSSAI mandatory
Owner Role HR + Kitchen In-charge
Source FSSR 2011 §4; FSSAI Food Handler Guidelines
Compliance FSSR 2011
Status Approved
Version 1.0
Related ADR ADR-009
R-HR-012 — Probation Period
Rule ID R-HR-012
Domain HR
Sub-Process Probation
Title Probation Period
Trigger New staff joining
Condition IF staff_role = Full-time THEN probation = 6
months; IF Part-time THEN 3 months
Action Probation review at end of period; confirmation
OR extension (max 6 months) OR termination
Exception Senior hires (Coordinator+): probation 3 months
with early confirmation option
Owner Role HR + Reporting Manager
Source School Policy 2024 §7.8
Compliance —
Status Approved
Version 1.0
Related ADR ADR-009
7. Inventory Rules
Inventory rules cover procurement, stock management, reorder triggers, expiry tracking, vendor
rating, आति(cid:12) audit cycles. ह्या(cid:2) rules चा(cid:2) primary goal म्हा(cid:12)जे(cid:10) stockout prevention, expiry loss
78

PreOne BRC v1.0  |  Business Rules Catalog
minimization, आति(cid:12) vendor quality assurance. Perishable items (food, art supplies) स(cid:2)/(cid:31) stricter
expiry rules आहा(cid:10)(cid:6) — FIFO (First In First Out) issuance mandatory.
ह्या(cid:2) category मध्ये (cid:10)12 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
| quick overview दा(cid:6)(cid:10) | (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) |  rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10). |     |     |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | --- | --- |
7.1 Summary Table — Inventory Rules
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-INV-001 Auto Reorder  Stock level  Create PR with  Inventory
|     | Trigger | update (post-     | vendor             | Manager +    |
| --- | ------- | ----------------- | ------------------ | ------------ |
|     |         | issue / post-GRN) | suggestion; route  | Branch Admin |
to Branch Admin
approval; auto-
set expected
delivery date
R-INV-002 Minimum Stock  Daily stock  Send P0 alert to  Inventory
|     | Threshold | reconciliation | Inventory  | Manager |
| --- | --------- | -------------- | ---------- | ------- |
Manager +
Branch Admin;
emergency
procurement
process
R-INV-003 Perishable Item  GRN for  FIFO issuance:  Inventory
|     | Expiry Tracking | perishable item     | oldest stock   | Manager +         |
| --- | --------------- | ------------------- | -------------- | ----------------- |
|     |                 | (food, paint, glue) | issued first;  | Kitchen In-charge |
expiring items
flagged in kitchen
/ classroom
dashboard
R-INV-004 Expired Item  Item crosses  Mark item as  Inventory
|     | Disposal | expiry date | 'Expired -  | Manager +   |
| --- | -------- | ----------- | ----------- | ----------- |
|     |          |             | Dispose';   | Branch Head |
generate disposal
log; Inventory
Manager +
Branch Head joint
approval for
write-off
R-INV-005 Asset  Annual financial  Auto-calculate  Accounts +
|     | Depreciation | closure (March) | depreciation;  | Inventory  |
| --- | ------------ | --------------- | -------------- | ---------- |
|     |              |                 | update asset   | Manager    |
register; reflect in
balance sheet
79

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-INV-006 Vendor Rating  Quarterly vendor  Notify vendor;  Inventory
|     | Threshold | review | 90-day       | Manager +   |
| --- | --------- | ------ | ------------ | ----------- |
|     |           |        | improvement  | Branch Head |
period; if no
improvement,
black-list +
remove from
preferred list
R-INV-007 PO Approval  Purchase Order  Multi-level  Inventory
|     | Threshold | creation | approval        | Manager + Multi- |
| --- | --------- | -------- | --------------- | ---------------- |
|     |           |          | workflow; auto- | level Approvers  |
route based on
amount; locked
after final
approval
R-INV-008 Issue Slip  Inventory item  Mandatory digital  Inventory
|     | Mandatory | issued to       | issue slip with:  | Manager +  |
| --- | --------- | --------------- | ----------------- | ---------- |
|     |           | classroom /     | item, qty,        | Recipient  |
|     |           | kitchen / admin | recipient, date,  |            |
purpose;
recipient
acknowledges via
app
R-INV-009 Stock Audit  Quarterly audit  Physical count;  Inventory
|     | Frequency | cycle | reconcile with    | Manager +   |
| --- | --------- | ----- | ----------------- | ----------- |
|     |           |       | system; variance  | Branch Head |
>5% triggers
investigation;
Branch Head
approval for
adjustments
R-INV-010 Return Window Item return  Generate return  Inventory
|     |     | request | note; vendor  | Manager |
| --- | --- | ------- | ------------- | ------- |
pickup arranged;
credit note raised
R-INV-011 Consumption  Daily issue / use Auto-aggregate  Inventory
|     | Tracking |     | monthly       | Manager +   |
| --- | -------- | --- | ------------- | ----------- |
|     |          |     | consumption;  | Coordinator |
variance >20%
from average
triggers review
80

PreOne BRC v1.0 | Business Rules Catalog
Rule ID Title Trigger Action Owner
R-INV-012 Asset Disposal Asset disposal Disposal: sale / Inventory
Approval request scrap / donation; Manager +
document Director
disposal method;
remove from
asset register;
adjust books
7.2 Detailed Rule Cards — Inventory Rules
R-INV-001 — Auto Reorder Trigger
Rule ID R-INV-001
Domain Inventory
Sub-Process Reorder
Title Auto Reorder Trigger
Trigger Stock level update (post-issue / post-GRN)
Condition IF current_stock <= reorder_level THEN auto-
generate Purchase Request (PR)
Action Create PR with vendor suggestion; route to
Branch Admin approval; auto-set expected
delivery date
Exception Vendor lock-in items: PR pre-addressed to
preferred vendor
Owner Role Inventory Manager + Branch Admin
Source School Policy 2024 §8.1
Compliance —
Status Approved
Version 1.0
Related ADR ADR-010
R-INV-002 — Minimum Stock Threshold
Rule ID R-INV-002
Domain Inventory
81

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process Stock Threshold
Title Minimum Stock Threshold
Trigger Daily stock reconciliation
Condition IF current_stock < min_stock_threshold THEN
critical alert + auto-PR
Action Send P0 alert to Inventory Manager + Branch
Admin; emergency procurement process
Exception Items with long lead time (>30 days): safety stock
= 2x normal min
Owner Role Inventory Manager
Source School Policy 2024 §8.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-010
R-INV-003 — Perishable Item Expiry Tracking
Rule ID R-INV-003
Domain Inventory
Sub-Process Perishable
Title Perishable Item Expiry Tracking
Trigger GRN for perishable item (food, paint, glue)
Condition IF item.category = Perishable AND expiry_date <
today + 7 days THEN flag for priority use
Action FIFO issuance: oldest stock issued first; expiring
items flagged in kitchen / classroom dashboard
Exception Items with extended shelf life if refrigerated:
recalculated expiry
Owner Role Inventory Manager + Kitchen In-charge
Source School Policy 2024 §8.3; FSSR 2011
Compliance FSSR 2011
Status Approved
Version 1.0
Related ADR ADR-010
82

PreOne BRC v1.0 | Business Rules Catalog
R-INV-004 — Expired Item Disposal
Rule ID R-INV-004
Domain Inventory
Sub-Process Perishable
Title Expired Item Disposal
Trigger Item crosses expiry date
Condition IF expiry_date < today AND item_stock > 0 THEN
mandatory disposal within 24 hours
Action Mark item as 'Expired - Dispose'; generate
disposal log; Inventory Manager + Branch Head
joint approval for write-off
Exception None — expired food items cannot be used
(FSSAI)
Owner Role Inventory Manager + Branch Head
Source FSSR 2011 §4; FSSAI Disposal Guidelines
Compliance FSSR 2011
Status Approved
Version 1.0
Related ADR ADR-010
R-INV-005 — Asset Depreciation
Rule ID R-INV-005
Domain Inventory
Sub-Process Asset
Title Asset Depreciation
Trigger Annual financial closure (March)
Condition IF asset_value > ₹5,000 AND asset_age > 1 year
THEN calculate depreciation per Income Tax §32
(15% SLM for furniture, 25% for IT equipment)
Action Auto-calculate depreciation; update asset register;
reflect in balance sheet
Exception Assets < ₹5,000: 100% depreciation in year of
purchase
Owner Role Accounts + Inventory Manager
83

PreOne BRC v1.0 | Business Rules Catalog
Source Income Tax Act §32; Companies Act §148 (if
applicable)
Compliance IT Act §32
Status Approved
Version 1.0
Related ADR ADR-010, ADR-022
R-INV-006 — Vendor Rating Threshold
Rule ID R-INV-006
Domain Inventory
Sub-Process Vendor
Title Vendor Rating Threshold
Trigger Quarterly vendor review
Condition IF vendor_rating < 3.0 (out of 5) OR
vendor_on_time_delivery < 80% THEN vendor on
probation
Action Notify vendor; 90-day improvement period; if no
improvement, black-list + remove from preferred
list
Exception Single-source vendor (no alternative): extended
probation + active search for alternatives
Owner Role Inventory Manager + Branch Head
Source School Policy 2024 §8.4
Compliance —
Status Approved
Version 1.0
Related ADR ADR-010
R-INV-007 — PO Approval Threshold
Rule ID R-INV-007
Domain Inventory
Sub-Process Purchase Order
Title PO Approval Threshold
Trigger Purchase Order creation
84

PreOne BRC v1.0 | Business Rules Catalog
Condition IF po_amount <= ₹10,000 THEN Branch Admin
approve; IF 10,001-50,000 THEN Branch Head; IF
50,001-2,00,000 THEN Director; IF > 2,00,000
THEN Board
Action Multi-level approval workflow; auto-route based
on amount; locked after final approval
Exception Emergency PO (medical, fire, safety): post-facto
approval within 48 hours
Owner Role Inventory Manager + Multi-level Approvers
Source School Policy 2024 §8.5
Compliance —
Status Approved
Version 1.0
Related ADR ADR-010, ADR-014
R-INV-008 — Issue Slip Mandatory
Rule ID R-INV-008
Domain Inventory
Sub-Process Issue
Title Issue Slip Mandatory
Trigger Inventory item issued to classroom / kitchen /
admin
Condition IF issue_slip_not_generated = TRUE THEN block
issue
Action Mandatory digital issue slip with: item, qty,
recipient, date, purpose; recipient acknowledges
via app
Exception Emergency issue (first aid, fire safety): verbal
approval with slip generated within 4 hours
Owner Role Inventory Manager + Recipient
Source School Policy 2024 §8.6
Compliance —
Status Approved
Version 1.0
Related ADR ADR-010
85

PreOne BRC v1.0 | Business Rules Catalog
R-INV-009 — Stock Audit Frequency
Rule ID R-INV-009
Domain Inventory
Sub-Process Audit
Title Stock Audit Frequency
Trigger Quarterly audit cycle
Condition IF quarter_end = TRUE THEN mandatory physical
stock audit
Action Physical count; reconcile with system; variance
>5% triggers investigation; Branch Head approval
for adjustments
Exception High-value items (electronics): monthly audit
Owner Role Inventory Manager + Branch Head
Source School Policy 2024 §8.7
Compliance —
Status Approved
Version 1.0
Related ADR ADR-010
R-INV-010 — Return Window
Rule ID R-INV-010
Domain Inventory
Sub-Process Return
Title Return Window
Trigger Item return request
Condition IF return_request_within_7_days AND
item_condition_original THEN accept return to
vendor; IF > 7 days THEN restocking fee (10%)
Action Generate return note; vendor pickup arranged;
credit note raised
Exception Defective items: full refund within 30 days
(Consumer Protection Act)
Owner Role Inventory Manager
Source School Policy 2024 §8.8; Consumer Protection Act
2019
86

PreOne BRC v1.0 | Business Rules Catalog
Compliance Consumer Protection Act 2019
Status Approved
Version 1.0
Related ADR ADR-010
R-INV-011 — Consumption Tracking
Rule ID R-INV-011
Domain Inventory
Sub-Process Consumption
Title Consumption Tracking
Trigger Daily issue / use
Condition IF item.category = Consumable THEN daily
consumption logged per classroom / kitchen
Action Auto-aggregate monthly consumption; variance
>20% from average triggers review
Exception Special events (annual day, sports day): expected
consumption spike; pre-approved
Owner Role Inventory Manager + Coordinator
Source School Policy 2024 §8.9
Compliance —
Status Approved
Version 1.0
Related ADR ADR-010
R-INV-012 — Asset Disposal Approval
Rule ID R-INV-012
Domain Inventory
Sub-Process Asset Disposal
Title Asset Disposal Approval
Trigger Asset disposal request
Condition IF asset_value > ₹10,000 OR asset_age < 5 years
THEN Director approval required
87

PreOne BRC v1.0 | Business Rules Catalog
Action Disposal: sale / scrap / donation; document
disposal method; remove from asset register;
adjust books
Exception Donated to charity / NGO: tax benefit under §80G
documented
Owner Role Inventory Manager + Director
Source School Policy 2024 §8.10; IT Act §50C (capital
gains on disposal)
Compliance IT Act §50C
Status Approved
Version 1.0
Related ADR ADR-010, ADR-022
8. Communication Rules
Communication rules govern parent-teacher messaging, broadcast restrictions, response SLAs,
language preferences, आति(cid:12) opt-out mechanisms. ह्या(cid:2) rules चा(cid:2) primary goal म्हा(cid:12)जे(cid:10) spam prevention +
timely response + multi-language support. Teacher-parent non-academic hour messaging restricted
आहा(cid:10) work-life balance स(cid:2)/(cid:31). Marketing communications स(cid:2)/(cid:31) explicit opt-in mandatory (DPDP
compliance).
ह्या(cid:2) category मध्ये (cid:10)12 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
quick overview दा(cid:6)(cid:10) (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10).
8.1 Summary Table — Communication Rules
Rule ID Title Trigger Action Owner
R-COM-001 Parent Message Parent sends Auto- Teacher +
Response Time message via app acknowledge Coordinator
receipt; assign to
class teacher;
escalate to
Coordinator if no
response within
SLA
R-COM-002 Unacknowledged Message Auto-escalate; System
Message unacknowledged notify next-level (Automated) +
Escalation beyond SLA via app + SMS; log Coordinator
escalation chain
88

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-COM-003 Non-Academic  Teacher attempts  Show warning;  Teacher + System
|     | Hour Messaging  | to send parent   | teacher confirms  | (Automated) |
| --- | --------------- | ---------------- | ----------------- | ----------- |
|     | Restriction     | message outside  | urgent OR defers  |             |
|     |                 | school hours     | to next working   |             |
day
R-COM-004 Broadcast  User attempts  Block broadcast;  Branch Head + IT
|     | Restriction | broadcast  | route to         |     |
| --- | ----------- | ---------- | ---------------- | --- |
|     |             | message    | authorized role  |     |
for approval; pre-
approved
templates only
R-COM-005 Language  Parent  AI translation  Teacher + System
|     | Preference | onboarding /  | applied; teacher  | (AI) |
| --- | ---------- | ------------- | ----------------- | ---- |
|     |            | message send  | reviews before    |      |
send; parent
reads in preferred
language
R-COM-006 Marketing  Marketing  Filter marketing  Marketing +
|     | Communication  | message send | audience; send    | Compliance |
| --- | -------------- | ------------ | ----------------- | ---------- |
|     | Opt-in         |              | only to opted-in  |            |
parents; honor
opt-out within 24
hours
| R-COM-007 | Communication   | Parent updates  | Update            | System         |
| --------- | --------------- | --------------- | ----------------- | -------------- |
|           | Channel Opt-out | communication   | preferences       | (Automated) +  |
|           |                 | preferences     | within 24 hours;  | Parent         |
route via
remaining
channels;
confirmation to
parent
R-COM-008 Announcement  Branch-wide  Route to  Branch Head +
|     | Approval  | announcement  | approver;        | Coordinator |
| --- | --------- | ------------- | ---------------- | ----------- |
|     | Workflow  | creation      | preview + edit;  |             |
scheduled send
after approval
R-COM-009 Photo Caption  Photo uploaded  Require caption  Teacher + System
|     | Mandatory | to parent app | (min 5 chars)  | (AI) |
| --- | --------- | ------------- | -------------- | ---- |
describing
context; AI
suggests auto-
caption; teacher
edits
89

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title             | Trigger         | Action           | Owner          |
| --------- | ----------------- | --------------- | ---------------- | -------------- |
| R-COM-010 | Two-way Chat      | Chat message    | Auto-archive;    | System         |
|           | History Retention | sent / received | encrypted        | (Automated) +  |
|           |                   |                 | storage; parent  | Compliance     |
can access own
chat history; audit
access for staff
| R-COM-011 | WhatsApp           | WhatsApp     | Enforce rate limit;  | System      |
| --------- | ------------------ | ------------ | -------------------- | ----------- |
|           | Business API Rate  | message send | queue non-urgent     | (Automated) |
|           | Limit              |              | messages for next    |             |
day; urgent
overrides allowed
R-COM-012 Emergency  Emergency  Trigger cascade  Branch Head +
|     | Notification  | declared (fire,    | within 60         | System      |
| --- | ------------- | ------------------ | ----------------- | ----------- |
|     | Cascade       | medical, security) | seconds; confirm  | (Automated) |
receipt per
parent; escalate
non-
acknowledged to
phone call
8.2 Detailed Rule Cards — Communication Rules
R-COM-001 — Parent Message Response Time
Rule ID R-COM-001
Domain Communication
Sub-Process Parent Response SLA
Title Parent Message Response Time
Trigger Parent sends message via app
Condition IF message_received_during_school_hours THEN
response within 2 hours; IF after hours THEN next
working day 10 AM
Action Auto-acknowledge receipt; assign to class teacher;
escalate to Coordinator if no response within SLA
Exception Emergency keywords ('emergency', 'urgent', 'sick',
'injury'): immediate response within 15 min, 24/7
Owner Role Teacher + Coordinator
Source School Policy 2024 §9.1
90

PreOne BRC v1.0 | Business Rules Catalog
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011
R-COM-002 — Unacknowledged Message Escalation
Rule ID R-COM-002
Domain Communication
Sub-Process Escalation Matrix
Title Unacknowledged Message Escalation
Trigger Message unacknowledged beyond SLA
Condition IF message_age > 2 hours AND no_ack = TRUE
THEN escalate to Coordinator; IF > 24 hours THEN
Branch Head
Action Auto-escalate; notify next-level via app + SMS; log
escalation chain
Exception Weekend messages: 24-hour SLA before
escalation
Owner Role System (Automated) + Coordinator
Source School Policy 2024 §9.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011
R-COM-003 — Non-Academic Hour Messaging Restriction
Rule ID R-COM-003
Domain Communication
Sub-Process Non-Academic Hours
Title Non-Academic Hour Messaging Restriction
Trigger Teacher attempts to send parent message outside
school hours
Condition IF message_time NOT IN [08:00-18:00 weekdays]
THEN system warning; require explicit 'urgent' tag
91

PreOne BRC v1.0 | Business Rules Catalog
Action Show warning; teacher confirms urgent OR defers
to next working day
Exception Emergency (child safety, incident): override
allowed with Branch Head notification
Owner Role Teacher + System (Automated)
Source School Policy 2024 §9.3 (Work-life Balance)
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011
R-COM-004 — Broadcast Restriction
Rule ID R-COM-004
Domain Communication
Sub-Process Broadcast
Title Broadcast Restriction
Trigger User attempts broadcast message
Condition IF user_role NOT IN [Branch Head, Principal,
Coordinator, Director] AND recipient_count > 50
THEN block
Action Block broadcast; route to authorized role for
approval; pre-approved templates only
Exception Class-level broadcast (one class): teacher can
broadcast to that class parents
Owner Role Branch Head + IT
Source School Policy 2024 §9.4
Compliance DPDP §7 (no unsolicited communication)
Status Approved
Version 1.0
Related ADR ADR-011
R-COM-005 — Language Preference
Rule ID R-COM-005
Domain Communication
92

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process Language
Title Language Preference
Trigger Parent onboarding / message send
Condition IF parent_language_preference = Marathi THEN
auto-translate English template to Marathi; IF
Hindi THEN translate to Hindi
Action AI translation applied; teacher reviews before
send; parent reads in preferred language
Exception Technical/legal terms kept in English with
parenthetical translation
Owner Role Teacher + System (AI)
Source School Policy 2024 §9.5; NEP 2020 (multilingual
education)
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011, ADR-020
R-COM-006 — Marketing Communication Opt-in
Rule ID R-COM-006
Domain Communication
Sub-Process Marketing
Title Marketing Communication Opt-in
Trigger Marketing message send
Condition IF parent_marketing_opt_in = FALSE THEN
exclude from marketing list
Action Filter marketing audience; send only to opted-in
parents; honor opt-out within 24 hours
Exception Critical regulatory/safety messages (e.g., school
closure): bypass opt-in status
Owner Role Marketing + Compliance
Source School Policy 2024 §9.6; DPDP Act 2023
Compliance DPDP §7
Status Approved
Version 1.0
93

PreOne BRC v1.0 | Business Rules Catalog
Related ADR ADR-011, ADR-015
R-COM-007 — Communication Channel Opt-out
Rule ID R-COM-007
Domain Communication
Sub-Process Opt-out
Title Communication Channel Opt-out
Trigger Parent updates communication preferences
Condition IF parent_opted_out_channel IN [SMS, WhatsApp,
Email, Push] THEN exclude from that channel
Action Update preferences within 24 hours; route via
remaining channels; confirmation to parent
Exception Fee reminders + safety alerts: cannot opt-out
(mandatory)
Owner Role System (Automated) + Parent
Source School Policy 2024 §9.7; DPDP Act 2023
Compliance DPDP §21
Status Approved
Version 1.0
Related ADR ADR-011, ADR-015
R-COM-008 — Announcement Approval Workflow
Rule ID R-COM-008
Domain Communication
Sub-Process Announcement
Title Announcement Approval Workflow
Trigger Branch-wide announcement creation
Condition IF announcement_target = 'All Parents' THEN
Branch Head approval required; IF 'Class Parents'
THEN Coordinator approval
Action Route to approver; preview + edit; scheduled send
after approval
Exception Emergency announcements (school closure,
safety): auto-approved with post-facto review
94

PreOne BRC v1.0 | Business Rules Catalog
Owner Role Branch Head + Coordinator
Source School Policy 2024 §9.8
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011
R-COM-009 — Photo Caption Mandatory
Rule ID R-COM-009
Domain Communication
Sub-Process Photos
Title Photo Caption Mandatory
Trigger Photo uploaded to parent app
Condition IF photo_uploaded = TRUE AND caption = EMPTY
THEN block publish
Action Require caption (min 5 chars) describing context;
AI suggests auto-caption; teacher edits
Exception Bulk upload (>10 photos): single group caption
acceptable
Owner Role Teacher + System (AI)
Source School Policy 2024 §9.9
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011, ADR-020
R-COM-010 — Two-way Chat History Retention
Rule ID R-COM-010
Domain Communication
Sub-Process Chat
Title Two-way Chat History Retention
Trigger Chat message sent / received
95

PreOne BRC v1.0 | Business Rules Catalog
Condition IF message_type = Chat THEN retain for 2 years; IF
contains incident reference THEN retain for 7
years
Action Auto-archive; encrypted storage; parent can
access own chat history; audit access for staff
Exception Parent requests deletion: soft-delete from view
but retain for legal hold
Owner Role System (Automated) + Compliance
Source School Policy 2024 §9.10; DPDP Act 2023
Compliance DPDP §8, §17
Status Approved
Version 1.0
Related ADR ADR-011, ADR-015
R-COM-011 — WhatsApp Business API Rate Limit
Rule ID R-COM-011
Domain Communication
Sub-Process WhatsApp Integration
Title WhatsApp Business API Rate Limit
Trigger WhatsApp message send
Condition IF message_count_per_parent_per_day > 5 THEN
block additional messages
Action Enforce rate limit; queue non-urgent messages for
next day; urgent overrides allowed
Exception Approved marketing window: 1 message per
parent per week (template-based)
Owner Role System (Automated)
Source WhatsApp Business API Policy; School Policy 2024
§9.11
Compliance DPDP §7
Status Approved
Version 1.0
Related ADR ADR-011
96

PreOne BRC v1.0 | Business Rules Catalog
R-COM-012 — Emergency Notification Cascade
Rule ID R-COM-012
Domain Communication
Sub-Process Emergency
Title Emergency Notification Cascade
Trigger Emergency declared (fire, medical, security)
Condition IF emergency_type IN [Fire, Medical, Security,
Natural Disaster] THEN multi-channel cascade:
SMS + Push + WhatsApp + IVR call
Action Trigger cascade within 60 seconds; confirm receipt
per parent; escalate non-acknowledged to phone
call
Exception None — emergency protocol, no opt-outs
Owner Role Branch Head + System (Automated)
Source School Policy 2024 §9.12; Disaster Management
Act 2005
Compliance DPDP §17 (emergency data); Disaster
Management Act
Status Approved
Version 1.0
Related ADR ADR-011, ADR-015
9. Compliance Rules
Compliance rules cover DPDP Act 2023 (data protection), POSH Act 2013 (workplace harassment),
Fire Safety (NBC 2016), Food Safety (FSSAI), आ(cid:12)i RTE Section 12. ह्या(cid:2) category मधी(cid:31)ला rules non-
negotiable आहा(cid:10)(cid:6) — exception फक्(cid:6) regulatory authority च्ये(cid:2) written approval नं(cid:6)(cid:14) रा. ह्या(cid:2) rules मध्ये(cid:10)
deviation क(cid:10)ल्ये(cid:2)स legal liability school management र्वरा ये(cid:10)ईला.
ह्या(cid:2) category मध्ये (cid:10)18 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
quick overview दा(cid:6)(cid:10) (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10).
97

PreOne BRC v1.0  |  Business Rules Catalog
9.1 Summary Table — Compliance Rules
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-CMP-001 Parent Consent  Admission  Capture digital  Admission
|     | for Child Data | confirmation | consent with      | Counsellor +  |
| --- | -------------- | ------------ | ----------------- | ------------- |
|     |                |              | timestamp + IP +  | Compliance    |
|     |                |              | device; store in  | Officer       |
immutable
consent ledger;
parent can view
consents in app
R-CMP-002 Consent  Parent withdraws  Honor withdrawal  Compliance
Withdrawal consent via app within 24 hours;  Officer + System
|     |     |     | stop data  | (Automated) |
| --- | --- | --- | ---------- | ----------- |
collection for
withdrawn
purpose; retain
data already
collected per
retention policy;
notify child of
withdrawal (if
age-appropriate)
R-CMP-003 Child Data  Student exits  Auto-archive  Compliance
|     | Retention Policy | school           | student record;  | Officer + IT |
| --- | ---------------- | ---------------- | ---------------- | ------------ |
|     |                  | (graduation/with | apply retention  |              |
|     |                  | drawal)          | schedule; auto-  |              |
delete past
retention period;
parent notified
pre-deletion
R-CMP-004 Child Photo  Photo captured /  Encrypt on  IT + Compliance
|     | Storage    | uploaded | upload; CDN    |     |
| --- | ---------- | -------- | -------------- | --- |
|     | Encryption |          | delivery with  |     |
signed URLs;
auto-expire
access URLs; log
all access
98

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-CMP-005 CCTV Retention  CCTV recording in  Continuous loop  IT + Branch
|     | Period | progress | recording;  | Admin |
| --- | ------ | -------- | ----------- | ----- |
motion-detected
incidents flagged;
flagged footage
moved to long-
term encrypted
archive
R-CMP-006 Quarterly PII  Quarterly audit  Generate PII  Compliance
|     | Audit | cycle | access logs;  | Officer + IT |
| --- | ----- | ----- | ------------- | ------------ |
compliance
officer reviews
anomalies; report
to management;
corrective actions
R-CMP-007 Fire NOC Renewal Annual fire NOC  Apply to local fire  Branch Admin +
|     |     | expiry     | department;  | Compliance |
| --- | --- | ---------- | ------------ | ---------- |
|     |     | (November) | schedule     |            |
inspection;
receive renewed
NOC; upload to
compliance store
R-CMP-008 Data Breach  Data breach  Trigger breach  Compliance
|     | Notification | detected      | response plan;  | Officer + IT +  |
| --- | ------------ | ------------- | --------------- | --------------- |
|     |              | (anomaly /    | forensic        | Director        |
|     |              | unauthorized  | investigation;  |                 |
|     |              | access)       | notification    |                 |
template;
remediation
tracking
R-CMP-009 POSH Complaint  Staff files POSH  Confidential  ICC + HR
|     | Filing | complaint (via    | intake; ICC       |     |
| --- | ------ | ----------------- | ----------------- | --- |
|     |        | app / email / in- | constituted;      |     |
|     |        | person)           | inquiry process;  |     |
written report;
action within 60
days of report
R-CMP-010 POSH  POSH complaint  Access control list  ICC + IT
|     | Confidentiality | in process | enforced; audit  |     |
| --- | --------------- | ---------- | ---------------- | --- |
log of all access;
breach of
confidentiality =
separate offense
99

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-CMP-011 POSH Training for  Annual POSH  Online module;  HR + Compliance
|     | All Staff | training cycle  | quiz; certificate;  |     |
| --- | --------- | --------------- | ------------------- | --- |
|     |           | (April-May)     | non-completion      |     |
blocks payroll (R-
HR-010)
| R-CMP-012 | POSH Complaint  | POSH complaint  | Auto-track           | ICC |
| --------- | --------------- | --------------- | -------------------- | --- |
|           | Timeline        | filed           | timeline; alerts at  |     |
60 days (inquiry
half-way), 80 days
(inquiry near-
due), 90 days
(final)
R-CMP-013 Quarterly Fire  Quarterly fire drill  Schedule drill;  Branch Admin +
|     | Drill | cycle | conduct with  | Compliance |
| --- | ----- | ----- | ------------- | ---------- |
timing; document
attendance;
report to local fire
dept (annual
submission)
R-CMP-014 Fire Extinguisher  Monthly fire  Monthly visual  Branch Admin +
|     | Inspection | safety inspection | inspection;  | Inventory |
| --- | ---------- | ----------------- | ------------ | --------- |
annual third-
party inspection;
refill/replacement
tracking
R-CMP-015 Evacuation Plan  Annual  Display floor-wise  Branch Admin
|     | Display | evacuation plan  | evacuation plan;  |     |
| --- | ------- | ---------------- | ----------------- | --- |
|     |         | update           | multi-language    |     |
(English + local
language); Braille
if special needs
students
R-CMP-016 RTE Non- EWS student  System flags EWS  Principal +
|     | Discrimination | enrolled under  | students for non- | Compliance |
| --- | -------------- | --------------- | ----------------- | ---------- |
|     |                | RTE §12         | discrimination    |            |
monitoring;
anonymous audit
quarterly
100

PreOne BRC v1.0 | Business Rules Catalog
Rule ID Title Trigger Action Owner
R-CMP-017 FSSAI Kitchen Annual FSSAI Renew license Kitchen In-charge
License license renewal before expiry; + Compliance
display license in
kitchen; monthly
self-audit per
FSSAI checklist
R-CMP-018 Food Handler Kitchen staff Annual medical HR + Kitchen In-
Medical onboarding + checkup; charge
Certificate annual renewal stool/urine test;
certificate on file;
non-completion
blocks duty
9.2 Detailed Rule Cards — Compliance Rules
R-CMP-001 — Parent Consent for Child Data
Rule ID R-CMP-001
Domain Cross-Domain
Sub-Process DPDP Consent
Title Parent Consent for Child Data
Trigger Admission confirmation
Condition IF parent_consent_signed = TRUE AND
consent_covers = [education, photos,
marketing_optional, emergency] THEN activate
student record
Action Capture digital consent with timestamp + IP +
device; store in immutable consent ledger; parent
can view consents in app
Exception Emergency medical care: consent presumed
(Bonafide emergency doctrine)
Owner Role Admission Counsellor + Compliance Officer
Source DPDP Act 2023 §4, §6
Compliance DPDP Act 2023
Status Approved
Version 1.0
Related ADR ADR-015, ADR-019
101

PreOne BRC v1.0 | Business Rules Catalog
R-CMP-002 — Consent Withdrawal
Rule ID R-CMP-002
Domain Cross-Domain
Sub-Process DPDP Consent
Title Consent Withdrawal
Trigger Parent withdraws consent via app
Condition IF parent_withdraws_consent = TRUE THEN
cease_processing_for_purpose = TRUE
Action Honor withdrawal within 24 hours; stop data
collection for withdrawn purpose; retain data
already collected per retention policy; notify child
of withdrawal (if age-appropriate)
Exception Legal obligation data (attendance, fee records)
retained despite withdrawal
Owner Role Compliance Officer + System (Automated)
Source DPDP Act 2023 §21
Compliance DPDP Act 2023
Status Approved
Version 1.0
Related ADR ADR-015, ADR-019
R-CMP-003 — Child Data Retention Policy
Rule ID R-CMP-003
Domain Cross-Domain
Sub-Process Child Data Retention
Title Child Data Retention Policy
Trigger Student exits school (graduation/withdrawal)
Condition IF student_exit = TRUE THEN retain academic
records 7 years; medical records 10 years; photos
3 years; financial records 8 years (IT Act)
Action Auto-archive student record; apply retention
schedule; auto-delete past retention period;
parent notified pre-deletion
Exception Legal hold: retention extended until hold released
102

PreOne BRC v1.0 | Business Rules Catalog
Owner Role Compliance Officer + IT
Source DPDP Act 2023 §8; IT Act §44AA (records
retention)
Compliance DPDP §8; IT Act §44AA
Status Approved
Version 1.0
Related ADR ADR-015, ADR-019
R-CMP-004 — Child Photo Storage Encryption
Rule ID R-CMP-004
Domain Cross-Domain
Sub-Process Photo Storage
Title Child Photo Storage Encryption
Trigger Photo captured / uploaded
Condition IF photo_contains_child = TRUE THEN AES-256
encryption at rest; access via signed URL with 24h
expiry
Action Encrypt on upload; CDN delivery with signed URLs;
auto-expire access URLs; log all access
Exception None — mandatory encryption
Owner Role IT + Compliance
Source DPDP Act 2023 §8; School Policy 2024 §10.1
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-015
R-CMP-005 — CCTV Retention Period
Rule ID R-CMP-005
Domain Cross-Domain
Sub-Process CCTV
Title CCTV Retention Period
Trigger CCTV recording in progress
103

PreOne BRC v1.0 | Business Rules Catalog
Condition IF cctv_footage_age > 90 days THEN auto-
overwrite; IF incident_flagged = TRUE THEN retain
7 years
Action Continuous loop recording; motion-detected
incidents flagged; flagged footage moved to long-
term encrypted archive
Exception Police investigation: footage handed over with
chain-of-custody documentation; copy retained
Owner Role IT + Branch Admin
Source DPDP Act 2023 §8; NBC 2016 §4.3
Compliance DPDP §8; NBC 2016
Status Approved
Version 1.0
Related ADR ADR-015
R-CMP-006 — Quarterly PII Audit
Rule ID R-CMP-006
Domain Cross-Domain
Sub-Process PII Audit
Title Quarterly PII Audit
Trigger Quarterly audit cycle
Condition IF quarter_end = TRUE THEN mandatory PII access
audit: who accessed what PII, for what purpose
Action Generate PII access logs; compliance officer
reviews anomalies; report to management;
corrective actions
Exception None — mandatory audit
Owner Role Compliance Officer + IT
Source DPDP Act 2023 §8; School Policy 2024 §10.2
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-015
104

PreOne BRC v1.0 | Business Rules Catalog
R-CMP-007 — Fire NOC Renewal
Rule ID R-CMP-007
Domain Cross-Domain
Sub-Process Fire Safety
Title Fire NOC Renewal
Trigger Annual fire NOC expiry (November)
Condition IF fire_noc_expiry_within_30_days = TRUE THEN
alert + auto-generate renewal application
Action Apply to local fire department; schedule
inspection; receive renewed NOC; upload to
compliance store
Exception None — mandatory per NBC 2016
Owner Role Branch Admin + Compliance
Source NBC 2016 §4.3; State Fire Services Act
Compliance NBC 2016
Status Approved
Version 1.0
Related ADR ADR-015
R-CMP-008 — Data Breach Notification
Rule ID R-CMP-008
Domain Cross-Domain
Sub-Process Data Breach
Title Data Breach Notification
Trigger Data breach detected (anomaly / unauthorized
access)
Condition IF breach_confirmed = TRUE THEN notify Data
Protection Board + affected parents within 72
hours
Action Trigger breach response plan; forensic
investigation; notification template; remediation
tracking
Exception None — mandatory per DPDP §17 (72-hour SLA)
Owner Role Compliance Officer + IT + Director
Source DPDP Act 2023 §17
105

PreOne BRC v1.0 | Business Rules Catalog
Compliance DPDP §17
Status Approved
Version 1.0
Related ADR ADR-015, ADR-019
R-CMP-009 — POSH Complaint Filing
Rule ID R-CMP-009
Domain Cross-Domain
Sub-Process POSH
Title POSH Complaint Filing
Trigger Staff files POSH complaint (via app / email / in-
person)
Condition IF complaint_received = TRUE THEN acknowledge
within 7 days; inquiry complete within 90 days
Action Confidential intake; ICC constituted; inquiry
process; written report; action within 60 days of
report
Exception None — POSH Act mandatory timeline
Owner Role ICC + HR
Source POSH Act 2013 §9, §10, §11
Compliance POSH Act 2013
Status Approved
Version 1.0
Related ADR ADR-015, ADR-019
R-CMP-010 — POSH Confidentiality
Rule ID R-CMP-010
Domain Cross-Domain
Sub-Process POSH
Title POSH Confidentiality
Trigger POSH complaint in process
Condition IF complaint_status = ACTIVE THEN access
restricted to ICC + Director only; complainant +
respondent + witnesses
106

PreOne BRC v1.0 | Business Rules Catalog
Action Access control list enforced; audit log of all access;
breach of confidentiality = separate offense
Exception Legal counsel: added to access list with written
engagement letter
Owner Role ICC + IT
Source POSH Act 2013 §16
Compliance POSH §16
Status Approved
Version 1.0
Related ADR ADR-015
R-CMP-011 — POSH Training for All Staff
Rule ID R-CMP-011
Domain Cross-Domain
Sub-Process POSH
Title POSH Training for All Staff
Trigger Annual POSH training cycle (April-May)
Condition IF staff_status = ACTIVE THEN mandatory POSH
training + 80% quiz pass by May 31
Action Online module; quiz; certificate; non-completion
blocks payroll (R-HR-010)
Exception Maternity leave staff: 30 days post-return grace
Owner Role HR + Compliance
Source POSH Act 2013 §19
Compliance POSH §19
Status Approved
Version 1.0
Related ADR ADR-009, ADR-015
R-CMP-012 — POSH Complaint Timeline
Rule ID R-CMP-012
Domain Cross-Domain
Sub-Process POSH
107

PreOne BRC v1.0 | Business Rules Catalog
Title POSH Complaint Timeline
Trigger POSH complaint filed
Condition IF complaint_filed = TRUE THEN
inquiry_complete_within_90_days;
action_within_60_days_post_inquiry
Action Auto-track timeline; alerts at 60 days (inquiry half-
way), 80 days (inquiry near-due), 90 days (final)
Exception Complainant request for extension: ICC discretion
max 30 days
Owner Role ICC
Source POSH Act 2013 §9, §10
Compliance POSH Act 2013
Status Approved
Version 1.0
Related ADR ADR-015
R-CMP-013 — Quarterly Fire Drill
Rule ID R-CMP-013
Domain Cross-Domain
Sub-Process Fire Safety
Title Quarterly Fire Drill
Trigger Quarterly fire drill cycle
Condition IF quarter_end = TRUE THEN mandatory fire drill
with full evacuation
Action Schedule drill; conduct with timing; document
attendance; report to local fire dept (annual
submission)
Exception None — mandatory per NBC 2016
Owner Role Branch Admin + Compliance
Source NBC 2016 §4.4; State Fire Rules
Compliance NBC 2016
Status Approved
Version 1.0
Related ADR ADR-015
108

PreOne BRC v1.0 | Business Rules Catalog
R-CMP-014 — Fire Extinguisher Inspection
Rule ID R-CMP-014
Domain Cross-Domain
Sub-Process Fire Safety
Title Fire Extinguisher Inspection
Trigger Monthly fire safety inspection
Condition IF extinguisher_inspection_overdue = TRUE THEN
alert; IF expiry_within_30_days = TRUE THEN
auto-PR for refill
Action Monthly visual inspection; annual third-party
inspection; refill/replacement tracking
Exception None — mandatory per NBC 2016
Owner Role Branch Admin + Inventory
Source NBC 2016 §4.5
Compliance NBC 2016
Status Approved
Version 1.0
Related ADR ADR-015
R-CMP-015 — Evacuation Plan Display
Rule ID R-CMP-015
Domain Cross-Domain
Sub-Process Evacuation
Title Evacuation Plan Display
Trigger Annual evacuation plan update
Condition IF plan_not_displayed_in_classrooms = TRUE OR
plan_not_displayed_at_exits = TRUE THEN non-
compliance
Action Display floor-wise evacuation plan; multi-language
(English + local language); Braille if special needs
students
Exception None — mandatory
Owner Role Branch Admin
Source NBC 2016 §4.7
Compliance NBC 2016
109

PreOne BRC v1.0 | Business Rules Catalog
Status Approved
Version 1.0
Related ADR ADR-015
R-CMP-016 — RTE Non-Discrimination
Rule ID R-CMP-016
Domain Cross-Domain
Sub-Process RTE
Title RTE Non-Discrimination
Trigger EWS student enrolled under RTE §12
Condition IF student_category = EWS THEN no
discrimination in: classes, activities, uniforms,
food, treatment
Action System flags EWS students for non-discrimination
monitoring; anonymous audit quarterly
Exception None — mandatory per RTE §12(3)
Owner Role Principal + Compliance
Source RTE Act §12(3); State RTE Rules
Compliance RTE §12
Status Approved
Version 1.0
Related ADR ADR-019
R-CMP-017 — FSSAI Kitchen License
Rule ID R-CMP-017
Domain Cross-Domain
Sub-Process Food Safety
Title FSSAI Kitchen License
Trigger Annual FSSAI license renewal
Condition IF kitchen_serves_food = TRUE AND
fssai_license_active = FALSE THEN block food
service
Action Renew license before expiry; display license in
kitchen; monthly self-audit per FSSAI checklist
110

PreOne BRC v1.0 | Business Rules Catalog
Exception None — FSSAI mandatory
Owner Role Kitchen In-charge + Compliance
Source FSSR 2011 §3; FSSAI Guidelines
Compliance FSSR 2011
Status Approved
Version 1.0
Related ADR ADR-015
R-CMP-018 — Food Handler Medical Certificate
Rule ID R-CMP-018
Domain Cross-Domain
Sub-Process Food Safety
Title Food Handler Medical Certificate
Trigger Kitchen staff onboarding + annual renewal
Condition IF kitchen_staff_medical_cert_pending = TRUE
THEN block kitchen duties
Action Annual medical checkup; stool/urine test;
certificate on file; non-completion blocks duty
Exception None — FSSAI mandatory (see R-HR-011)
Owner Role HR + Kitchen In-charge
Source FSSR 2011 §4; FSSAI Food Handler Guidelines
Compliance FSSR 2011
Status Approved
Version 1.0
Related ADR ADR-009, ADR-015
10. Approval Matrix Rules
Approval matrix rules define क$(cid:12)त्ये(cid:2) action स(cid:2)/(cid:31) क$(cid:12)त्ये(cid:2) role आति(cid:12) amount threshold च्ये(cid:2) approval चा(cid:31)
गराजे आहा(cid:10). ह्या(cid:2) rules चा(cid:2) primary goal म्हा(cid:12)जे(cid:10) delegation of authority + fraud prevention. Matrix format:
Action × Role × Amount Threshold. उदा(cid:2).: Discount >10% needs Branch Head approval; Discount
>25% needs Director approval.
111

PreOne BRC v1.0  |  Business Rules Catalog
ह्या(cid:2) category मध्ये (cid:10)15 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
| quick overview दा(cid:6)(cid:10) | (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) |  rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10). |     |     |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | --- | --- |
10.1 Summary Table — Approval Matrix Rules
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-APR-001 Discount  Discount applied  Auto-route to  Accounts Team +
|     | Approval by  | to invoice | approver; multi-   | Multi-level  |
| --- | ------------ | ---------- | ------------------ | ------------ |
|     | Amount       |            | level workflow if  | Approvers    |
escalation; locked
after approval
R-APR-002 Refund Approval  Refund request  Multi-level  Accounts Team +
|     | Matrix | submitted | workflow; finance   | Multi-level  |
| --- | ------ | --------- | ------------------- | ------------ |
|     |        |           | verification; bank  | Approvers    |
account
validation;
payment within
14 days
R-APR-003 Leave Approval  Leave application  Auto-route;  Reporting
|     | Matrix | submitted | ensure substitute  | Manager + Multi- |
| --- | ------ | --------- | ------------------ | ---------------- |
|     |        |           | arrangement for    | level Approvers  |
teachers; lock on
approval
R-APR-004 Expense Approval  Expense claim  Multi-level  Accounts Team +
|     | by Amount | submitted | workflow; receipt  | Multi-level  |
| --- | --------- | --------- | ------------------ | ------------ |
|     |           |           | verification; GST  | Approvers    |
compliance
check; payment
scheduling
| R-APR-005 | Vendor      | New vendor   | Verify GSTIN,  | Inventory        |
| --------- | ----------- | ------------ | -------------- | ---------------- |
|           | Onboarding  | registration | PAN, bank      | Manager + Multi- |
|           | Approval    |              | account,       | level Approvers  |
references;
signed contract;
system access
grant
R-APR-006 Admission Final  Application Form  Auto-approve if  Admission
|     | Approval | + Documents +  | all criteria met;  | Counsellor +  |
| --- | -------- | -------------- | ------------------ | ------------- |
|     |          | Fee submitted  | Branch Head        | Branch Head   |
approval if any
exception
applied; student
record created
112

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title       | Trigger         | Action             | Owner        |
| --------- | ----------- | --------------- | ------------------ | ------------ |
| R-APR-007 | Fee Waiver  | Fee waiver      | Multi-level        | Multi-level  |
|           | Approval    | request         | approval;          | Approvers    |
|           |             | submitted with  | documentation      |              |
|           |             | documentation   | review; valid for  |              |
current term only
R-APR-008 Asset Disposal  Asset disposal  Disposal method  Inventory
|     | Approval | request | (sale/scrap/dona   | Manager + Multi- |
| --- | -------- | ------- | ------------------ | ---------------- |
|     |          |         | tion); valuation;  | level Approvers  |
book adjustment;
NOC for
hazardous items
R-APR-009 Action-Based Role  User attempts  Auto-route to  System
|     | Escalation | action outside   | higher role;        | (Automated) +  |
| --- | ---------- | ---------------- | ------------------- | -------------- |
|     |            | role permissions | original requester  | Higher Role    |
notified; audit
logged
R-APR-010 New Position  New position  Job description  Branch Head +
|     | Approval | requisition | finalization; HR  | Director + HR |
| --- | -------- | ----------- | ----------------- | ------------- |
sourcing;
interview panel;
offer approval
| R-APR-011 | Salary Revision  | Annual         | Multi-level       | Multi-level    |
| --------- | ---------------- | -------------- | ----------------- | -------------- |
|           | Approval         | performance    | workflow; budget  | Approvers + HR |
|           |                  | review outcome | verification; HR  |                |
record update;
payroll
adjustment next
cycle
R-APR-012 School Policy  Policy revision  Impact analysis;  Multi-level
|     | Change Approval | proposed | stakeholder    | Approvers +  |
| --- | --------------- | -------- | -------------- | ------------ |
|     |                 |          | consultation;  | Compliance   |
version control;
parent
communication if
parent-facing
R-APR-013 Bulk Data Export  User requests  Approval  Compliance
|     | Approval | bulk data export  | workflow;  | Officer + Director |
| --- | -------- | ----------------- | ---------- | ------------------ |
|     |          | (>50 records)     | purpose    |                    |
documentation;
data encryption
in transit; audit
logged
113

PreOne BRC v1.0 | Business Rules Catalog
Rule ID Title Trigger Action Owner
R-APR-014 Vendor Payment Vendor invoice + Multi-level Accounts Team +
Approval GRN verified workflow; TDS Multi-level
deduction (R- Approvers
FIN-017); GST
input credit
verification;
NEFT/RTGS
payment
R-APR-015 Curriculum Curriculum Review Principal +
Change Approval revision proposed committee; pilot Academic
if needed; parent Committee
communication;
phased rollout
10.2 Detailed Rule Cards — Approval Matrix Rules
R-APR-001 — Discount Approval by Amount
Rule ID R-APR-001
Domain Cross-Domain
Sub-Process Discount Approval
Title Discount Approval by Amount
Trigger Discount applied to invoice
Condition IF discount_percent <= 5% THEN Accounts Team
approve; IF 5-15% THEN Branch Head; IF 15-25%
THEN Director; IF > 25% THEN Board
Action Auto-route to approver; multi-level workflow if
escalation; locked after approval
Exception Staff ward discount (R-ELG-012) auto-approved
per policy
Owner Role Accounts Team + Multi-level Approvers
Source School Policy 2024 §11.1
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
114

PreOne BRC v1.0 | Business Rules Catalog
R-APR-002 — Refund Approval Matrix
Rule ID R-APR-002
Domain Cross-Domain
Sub-Process Refund Approval
Title Refund Approval Matrix
Trigger Refund request submitted
Condition IF refund_amount <= ₹5,000 THEN Branch Admin
approve; IF 5,001-25,000 THEN Branch Head; IF >
25,000 THEN Director
Action Multi-level workflow; finance verification; bank
account validation; payment within 14 days
Exception Medical emergency refund: fast-track Branch
Head approval within 48 hours
Owner Role Accounts Team + Multi-level Approvers
Source School Policy 2024 §11.2
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-003 — Leave Approval Matrix
Rule ID R-APR-003
Domain Cross-Domain
Sub-Process Leave Approval
Title Leave Approval Matrix
Trigger Leave application submitted
Condition IF leave_days <= 2 THEN Reporting Manager; IF 3-
7 THEN Branch Head; IF > 7 OR consecutive > 3
THEN Director + HR
Action Auto-route; ensure substitute arrangement for
teachers; lock on approval
Exception Medical leave with hospital certificate: bypass
hierarchy, HR approval sufficient
Owner Role Reporting Manager + Multi-level Approvers
Source School Policy 2024 §11.3
115

PreOne BRC v1.0 | Business Rules Catalog
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-004 — Expense Approval by Amount
Rule ID R-APR-004
Domain Cross-Domain
Sub-Process Expense Approval
Title Expense Approval by Amount
Trigger Expense claim submitted
Condition IF expense <= ₹5,000 THEN Branch Admin; IF
5,001-25,000 THEN Branch Head; IF 25,001-
1,00,000 THEN Director; IF > 1,00,000 THEN Board
Action Multi-level workflow; receipt verification; GST
compliance check; payment scheduling
Exception Emergency expenses (medical/fire/safety): post-
facto approval within 48 hours
Owner Role Accounts Team + Multi-level Approvers
Source School Policy 2024 §11.4
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-005 — Vendor Onboarding Approval
Rule ID R-APR-005
Domain Cross-Domain
Sub-Process Vendor Onboarding
Title Vendor Onboarding Approval
Trigger New vendor registration
Condition IF vendor_annual_value_estimate <= ₹50,000
THEN Branch Admin; IF 50,001-5,00,000 THEN
Branch Head; IF > 5,00,000 THEN Director
116

PreOne BRC v1.0 | Business Rules Catalog
Action Verify GSTIN, PAN, bank account, references;
signed contract; system access grant
Exception Single-purchase vendor (<₹10,000): basic KYC
sufficient, no formal onboarding
Owner Role Inventory Manager + Multi-level Approvers
Source School Policy 2024 §11.5
Compliance GST Act (vendor GSTIN validation)
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-006 — Admission Final Approval
Rule ID R-APR-006
Domain Admission
Sub-Process Admission Approval
Title Admission Final Approval
Trigger Application Form + Documents + Fee submitted
Condition IF age_eligible = TRUE AND docs_complete = TRUE
AND fee_paid = TRUE THEN Counsellor approve
Action Auto-approve if all criteria met; Branch Head
approval if any exception applied; student record
created
Exception Special needs / RTE quota / staff ward: Branch
Head + Director joint approval
Owner Role Admission Counsellor + Branch Head
Source School Policy 2024 §11.6
Compliance —
Status Approved
Version 1.0
Related ADR ADR-005, ADR-014
R-APR-007 — Fee Waiver Approval
Rule ID R-APR-007
Domain Finance
117

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process Fee Waiver
Title Fee Waiver Approval
Trigger Fee waiver request submitted with
documentation
Condition IF waiver_percent <= 25% THEN Branch Head +
Finance Head; IF 25-75% THEN Director; IF > 75%
OR amount > ₹50,000 THEN Board
Action Multi-level approval; documentation review; valid
for current term only
Exception Death of earning member: Director fast-track
approval within 48 hours
Owner Role Multi-level Approvers
Source School Policy 2024 §11.7
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-008 — Asset Disposal Approval
Rule ID R-APR-008
Domain Cross-Domain
Sub-Process Asset Disposal
Title Asset Disposal Approval
Trigger Asset disposal request
Condition IF asset_value <= ₹10,000 THEN Branch Head; IF
10,001-1,00,000 THEN Director; IF > 1,00,000
THEN Board
Action Disposal method (sale/scrap/donation); valuation;
book adjustment; NOC for hazardous items
Exception Donated to charity: 80G certificate obtained; tax
benefit documented
Owner Role Inventory Manager + Multi-level Approvers
Source School Policy 2024 §11.8; IT Act §50C
Compliance IT Act §50C
Status Approved
118

PreOne BRC v1.0 | Business Rules Catalog
Version 1.0
Related ADR ADR-014, ADR-022
R-APR-009 — Action-Based Role Escalation
Rule ID R-APR-009
Domain Cross-Domain
Sub-Process Role Escalation
Title Action-Based Role Escalation
Trigger User attempts action outside role permissions
Condition IF user_role NOT IN action.allowed_roles THEN
escalate to next higher role
Action Auto-route to higher role; original requester
notified; audit logged
Exception Emergency override: Branch Head can perform
any action with post-facto review
Owner Role System (Automated) + Higher Role
Source School Policy 2024 §11.9
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-010 — New Position Approval
Rule ID R-APR-010
Domain HR
Sub-Process Recruitment Approval
Title New Position Approval
Trigger New position requisition
Condition IF position_count <= 2 AND budgeted_role = TRUE
THEN Branch Head approve; IF > 2 OR unbudgeted
THEN Director
Action Job description finalization; HR sourcing; interview
panel; offer approval
119

PreOne BRC v1.0 | Business Rules Catalog
Exception Emergency replacement (sudden exit): Branch
Head approve; budget realignment post-facto
Owner Role Branch Head + Director + HR
Source School Policy 2024 §11.10
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-011 — Salary Revision Approval
Rule ID R-APR-011
Domain HR
Sub-Process Salary Revision
Title Salary Revision Approval
Trigger Annual performance review outcome
Condition IF revision_percent <= 10% THEN Reporting
Manager + Branch Head; IF 10-25% Then Director;
IF > 25% OR promotion THEN Board
Action Multi-level workflow; budget verification; HR
record update; payroll adjustment next cycle
Exception Counter-offer cases: Director fast-track decision
within 7 days
Owner Role Multi-level Approvers + HR
Source School Policy 2024 §11.11
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-012 — School Policy Change Approval
Rule ID R-APR-012
Domain Cross-Domain
Sub-Process Policy Change
120

PreOne BRC v1.0 | Business Rules Catalog
Title School Policy Change Approval
Trigger Policy revision proposed
Condition IF policy_change_impact = LOW THEN Branch
Head; IF MEDIUM THEN Director; IF HIGH (parent-
facing/financial) THEN Board
Action Impact analysis; stakeholder consultation; version
control; parent communication if parent-facing
Exception Regulatory-driven changes (DPDP, RTE, GST):
compliance officer mandate, no approval needed
Owner Role Multi-level Approvers + Compliance
Source School Policy 2024 §11.12
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-013 — Bulk Data Export Approval
Rule ID R-APR-013
Domain Cross-Domain
Sub-Process Data Export
Title Bulk Data Export Approval
Trigger User requests bulk data export (>50 records)
Condition IF export_contains_PII = TRUE THEN Compliance
Officer approval; IF > 500 records THEN Director
approval
Action Approval workflow; purpose documentation; data
encryption in transit; audit logged
Exception Regulatory/law enforcement request: with court
order, Director + Legal approval
Owner Role Compliance Officer + Director
Source School Policy 2024 §11.13; DPDP Act 2023
Compliance DPDP §8, §17
Status Approved
Version 1.0
Related ADR ADR-014, ADR-015
121

PreOne BRC v1.0 | Business Rules Catalog
R-APR-014 — Vendor Payment Approval
Rule ID R-APR-014
Domain Cross-Domain
Sub-Process Vendor Payment
Title Vendor Payment Approval
Trigger Vendor invoice + GRN verified
Condition IF payment_amount <= ₹25,000 THEN Branch
Admin; IF 25,001-1,00,000 Then Branch Head; IF
1,00,001-5,00,000 Then Director; IF > 5,00,000
Then Board
Action Multi-level workflow; TDS deduction (R-FIN-017);
GST input credit verification; NEFT/RTGS payment
Exception Vendor with standing payment instructions: auto-
pay within credit period
Owner Role Accounts Team + Multi-level Approvers
Source School Policy 2024 §11.14
Compliance —
Status Approved
Version 1.0
Related ADR ADR-014
R-APR-015 — Curriculum Change Approval
Rule ID R-APR-015
Domain Cross-Domain
Sub-Process Curriculum Change
Title Curriculum Change Approval
Trigger Curriculum revision proposed
Condition IF change_impact = Single Class THEN
Coordinator; IF Multiple Classes THEN Principal; IF
School-wide THEN Academic Committee +
Director
Action Review committee; pilot if needed; parent
communication; phased rollout
122

PreOne BRC v1.0  |  Business Rules Catalog
Exception NEP/regulatory updates: implement within
mandated timeline
Owner Role Principal + Academic Committee
Source School Policy 2024 §11.15
Compliance NEP 2020
Status Approved
Version 1.0
Related ADR ADR-006, ADR-014
11. Notification Rules
Notification   rules   govern  क$(cid:12)त्ये(cid:2)  event  स(cid:2)/(cid:31)   क$(cid:12)(cid:6)(cid:2)  notification   channel
(SMS/Email/Push/WhatsApp), क$(cid:12)त्ये(cid:2) timing मध्ये(cid:10), आति(cid:12) क$(cid:12)त्ये(cid:2) priority नं(cid:10) trigger हा$ईला. ह्या(cid:2) rules चा(cid:2)
primary goal म्हा(cid:12)जे(cid:10) right message + right channel + right time — without spamming parents.
Absence alerts सर्व<(cid:6) high priority (child safety concern), birthday greetings सर्व<(cid:6) low priority.
ह्या(cid:2) category मध्ये (cid:10)12 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
| quick overview दा(cid:6)(cid:10) | (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) |  rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10). |     |     |
| -------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | --- | --- |
11.1 Summary Table — Notification Rules
| Rule ID   | Title     | Trigger           | Action           | Owner          |
| --------- | --------- | ----------------- | ---------------- | -------------- |
| R-NOT-001 | Fee Due   | Invoice due date  | Multi-channel    | System         |
|           | Reminder  | approaching /     | cascade; parent  | (Automated) +  |
|           | Cadence   | overdue           | app + SMS +      | Accounts Team  |
email +
WhatsApp; auto-
stop after parent
acknowledges
R-NOT-002 Child Absence  Child marked  Push + SMS to  System
|     | Alert | absent in  | primary parent; if  | (Automated) +  |
| --- | ----- | ---------- | ------------------- | -------------- |
|     |       | attendance | no ack within 30    | Teacher        |
min, call primary
parent; if
unreachable,
secondary
contact
123

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-NOT-003 Daily Report Push  Daily school end  Auto-compile  System
|     | Time | (pickup) | daily sheet  | (Automated) |
| --- | ---- | -------- | ------------ | ----------- |
(activities, meals,
nap,
observations,
photos); push to
parent app +
email
R-NOT-004 Birthday Greeting Child birthday Customizable  System
|     |     |     | template; school  | (Automated) |
| --- | --- | --- | ----------------- | ----------- |
logo; photo if
consented; small
in-app
celebration
R-NOT-005 Festival Greeting Public festival day Multi-language  System
|     |     |     | greeting; cultural  | (Automated) +  |
| --- | --- | --- | ------------------- | -------------- |
|     |     |     | context; school     | Branch Admin   |
closure reminder
if applicable
R-NOT-006 Incident  Incident reported  Auto-notify based  Teacher + Branch
|     | Notification | (R-OPS-015) | on severity;  | Head |
| --- | ------------ | ----------- | ------------- | ---- |
Branch Head
involvement for
HIGH;
documentation
shared via app
R-NOT-007 Photo Share Alert Teacher shares  Push with  System
|     |     | photo with  | thumbnail; parent   | (Automated) |
| --- | --- | ----------- | ------------------- | ----------- |
|     |     | parent      | taps to view full;  |             |
like/comment
options; teacher
notified of parent
engagement
R-NOT-008 Event Schedule  School event  Multi-channel:  Coordinator +
|     | Announcement | scheduled (PTM,  | app push + email  | System      |
| --- | ------------ | ---------------- | ----------------- | ----------- |
|     |              | sports day,      | + SMS for major   | (Automated) |
|     |              | annual day)      | events; app-only  |             |
for routine
R-NOT-009 Holiday Alert Public holiday /  Push + SMS +  Branch Admin +
|     |     | school-declared  | email; update  | System      |
| --- | --- | ---------------- | -------------- | ----------- |
|     |     | holiday          | calendar;      | (Automated) |
reschedule
affected activities
124

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-NOT-010 Transport Delay  Bus delayed > 10  Push notification  System
|     | Alert | minutes from   | with new ETA;        | (Automated) +  |
| --- | ----- | -------------- | -------------------- | -------------- |
|     |       | scheduled time | live tracking link;  | Transport In-  |
|     |       |                | auto-update          | charge         |
every 5 min
| R-NOT-011 | Salary Credit  | Payroll       | Notification with  | System            |
| --------- | -------------- | ------------- | ------------------ | ----------------- |
|           | Notification   | disbursement  | salary slip        | (Automated) + HR  |
|           |                | complete      | attached; bank     | + Accounts        |
credit
confirmation; tax
breakdown
R-NOT-012 System  Scheduled system  Email + app  IT + System
|     | Maintenance  | downtime | banner; affected  | (Automated) |
| --- | ------------ | -------- | ----------------- | ----------- |
|     | Notification |          | features list;    |             |
expected
restoration time;
alternate contact
(phone) for
emergencies
11.2 Detailed Rule Cards — Notification Rules
R-NOT-001 — Fee Due Reminder Cadence
Rule ID R-NOT-001
Domain Finance
Sub-Process Fee Reminder
Title Fee Due Reminder Cadence
Trigger Invoice due date approaching / overdue
Condition IF days_to_due = 7 THEN reminder 1 (Push); IF
days_to_due = 3 THEN reminder 2 (Push + SMS);
IF overdue = TRUE THEN reminder 3 (Push + SMS +
Email + WhatsApp)
Action Multi-channel cascade; parent app + SMS + email
+ WhatsApp; auto-stop after parent acknowledges
Exception RTE students (state-funded): no fee reminders
Owner Role System (Automated) + Accounts Team
Source School Policy 2024 §12.1
125

PreOne BRC v1.0 | Business Rules Catalog
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011
R-NOT-002 — Child Absence Alert
Rule ID R-NOT-002
Domain Daily Operations
Sub-Process Absence Alert
Title Child Absence Alert
Trigger Child marked absent in attendance
Condition IF child_absent = TRUE AND parent_pre_notify =
FALSE THEN alert parent within 15 minutes
Action Push + SMS to primary parent; if no ack within 30
min, call primary parent; if unreachable,
secondary contact
Exception Parent pre-notified absence via app: no alert;
logged as 'parent-reported absence'
Owner Role System (Automated) + Teacher
Source School Policy 2024 §12.2; POCSO §19 (child safety)
Compliance POCSO §19
Status Approved
Version 1.0
Related ADR ADR-007, ADR-011
R-NOT-003 — Daily Report Push Time
Rule ID R-NOT-003
Domain Daily Operations
Sub-Process Daily Report
Title Daily Report Push Time
Trigger Daily school end (pickup)
Condition IF pickup_completed = TRUE THEN push daily
report within 30 minutes
126

PreOne BRC v1.0 | Business Rules Catalog
Action Auto-compile daily sheet (activities, meals, nap,
observations, photos); push to parent app + email
Exception Half-day pickup: interim report at pickup; final
report at end of day
Owner Role System (Automated)
Source School Policy 2024 §12.3
Compliance —
Status Approved
Version 1.0
Related ADR ADR-007, ADR-011
R-NOT-004 — Birthday Greeting
Rule ID R-NOT-004
Domain Communication
Sub-Process Birthday
Title Birthday Greeting
Trigger Child birthday
Condition IF child_birthday = today THEN auto-greeting at 9
AM (parent + child)
Action Customizable template; school logo; photo if
consented; small in-app celebration
Exception Parent opt-out: child birthday not celebrated
publicly
Owner Role System (Automated)
Source School Policy 2024 §12.4
Compliance DPDP §4 (birthday is PII)
Status Approved
Version 1.0
Related ADR ADR-011
R-NOT-005 — Festival Greeting
Rule ID R-NOT-005
Domain Communication
127

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process Festival
Title Festival Greeting
Trigger Public festival day
Condition IF festival_in_calendar = TRUE AND school_closed
= TRUE THEN greeting at 9 AM
Action Multi-language greeting; cultural context; school
closure reminder if applicable
Exception Religious sensitivity: only secular/major national
festivals by default; parents can opt-in for specific
Owner Role System (Automated) + Branch Admin
Source School Policy 2024 §12.5
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011
R-NOT-006 — Incident Notification
Rule ID R-NOT-006
Domain Daily Operations
Sub-Process Incident
Title Incident Notification
Trigger Incident reported (R-OPS-015)
Condition IF severity = MEDIUM THEN parent notify within
30 min; IF HIGH Then immediate call + app + SMS
Action Auto-notify based on severity; Branch Head
involvement for HIGH; documentation shared via
app
Exception None — incident reporting mandatory, no
suppression
Owner Role Teacher + Branch Head
Source School Policy 2024 §12.6; POCSO §19
Compliance POCSO §19
Status Approved
Version 1.0
Related ADR ADR-007, ADR-011, ADR-015
128

PreOne BRC v1.0 | Business Rules Catalog
R-NOT-007 — Photo Share Alert
Rule ID R-NOT-007
Domain Daily Operations
Sub-Process Photo Share
Title Photo Share Alert
Trigger Teacher shares photo with parent
Condition IF photo_shared = TRUE THEN immediate push
notification to parent
Action Push with thumbnail; parent taps to view full;
like/comment options; teacher notified of parent
engagement
Exception Batch photo upload (>10): single notification
'Photos added' instead of individual alerts
Owner Role System (Automated)
Source School Policy 2024 §12.7
Compliance DPDP §4 (photo consent R-OPS-016)
Status Approved
Version 1.0
Related ADR ADR-007, ADR-011
R-NOT-008 — Event Schedule Announcement
Rule ID R-NOT-008
Domain Academics
Sub-Process Schedule
Title Event Schedule Announcement
Trigger School event scheduled (PTM, sports day, annual
day)
Condition IF event_scheduled = TRUE THEN 14-day advance
notice + 7-day reminder + 1-day reminder
Action Multi-channel: app push + email + SMS for major
events; app-only for routine
Exception Emergency unscheduled events: as-needed
notification
Owner Role Coordinator + System (Automated)
129

PreOne BRC v1.0 | Business Rules Catalog
Source School Policy 2024 §12.8
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011
R-NOT-009 — Holiday Alert
Rule ID R-NOT-009
Domain Daily Operations
Sub-Process Holiday
Title Holiday Alert
Trigger Public holiday / school-declared holiday
Condition IF holiday_declared = TRUE THEN notify parents
48 hours prior (or ASAP if emergency)
Action Push + SMS + email; update calendar; reschedule
affected activities
Exception Emergency holiday (weather, law-and-order):
immediate notification
Owner Role Branch Admin + System (Automated)
Source School Policy 2024 §12.9
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011
R-NOT-010 — Transport Delay Alert
Rule ID R-NOT-010
Domain Daily Operations
Sub-Process Transport
Title Transport Delay Alert
Trigger Bus delayed > 10 minutes from scheduled time
Condition IF bus_eta_delay > 10 min THEN alert affected
parents
130

PreOne BRC v1.0 | Business Rules Catalog
Action Push notification with new ETA; live tracking link;
auto-update every 5 min
Exception Minor delay (<10 min): no notification (avoid
spam)
Owner Role System (Automated) + Transport In-charge
Source School Policy 2024 §12.10
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011, ADR-018
R-NOT-011 — Salary Credit Notification
Rule ID R-NOT-011
Domain HR
Sub-Process Payroll
Title Salary Credit Notification
Trigger Payroll disbursement complete
Condition IF salary_credited = TRUE THEN immediate push +
SMS + email to staff
Action Notification with salary slip attached; bank credit
confirmation; tax breakdown
Exception Failed credit: error notification + HR follow-up
within 24 hours
Owner Role System (Automated) + HR + Accounts
Source School Policy 2024 §12.11; Payment of Wages Act
Compliance Payment of Wages Act 1936
Status Approved
Version 1.0
Related ADR ADR-011
R-NOT-012 — System Maintenance Notification
Rule ID R-NOT-012
Domain Cross-Domain
131

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process System
Title System Maintenance Notification
Trigger Scheduled system downtime
Condition IF downtime_window_scheduled = TRUE THEN
48-hour advance notice to all users
Action Email + app banner; affected features list;
expected restoration time; alternate contact
(phone) for emergencies
Exception Emergency maintenance (security patch): as-soon-
as-possible notification, post-deployment within 4
hours
Owner Role IT + System (Automated)
Source School Policy 2024 §12.12
Compliance —
Status Approved
Version 1.0
Related ADR ADR-011
12. Data Governance Rules
Data Governance rules cover PII encryption, field-level access control, audit log retention, data
subject access requests (DSAR), consent withdrawal, आति(cid:12) cross-tenant data isolation. DPDP Act
2023 Section 17 (data breach notification within 72 hours) compliance mandatory. ह्या(cid:2) rules मधी(cid:31)ला
deviation हा(cid:2) direct legal risk आहा(cid:10).
ह्या(cid:2) category मध्ये (cid:10)12 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
quick overview दा(cid:6)(cid:10) (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10).
12.1 Summary Table — Data Governance Rules
Rule ID Title Trigger Action Owner
R-DAT-001 PII Encryption at PII data stored in Field-level IT + Compliance
Rest database encryption;
encryption keys in
HSM (Hardware
Security Module);
key rotation
quarterly
132

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-DAT-002 Data in Transit  Data transmission  All API calls over  IT
|     | Encryption | over network | HTTPS; certificate  |     |
| --- | ---------- | ------------ | ------------------- | --- |
pinning for
mobile apps;
HSTS enabled;
mixed-content
blocked
R-DAT-003 PII Field Masking  PII field displayed  Auto-mask in  IT + System
|     | in UI | in user interface | lists, exports,  | (Automated) |
| --- | ----- | ----------------- | ---------------- | ----------- |
logs; full view
only with explicit
permission +
audit log
R-DAT-004 Role-Based Field  User requests  Enforce at API  IT + Compliance
|     | Visibility | data access | layer; deny by  |     |
| --- | ---------- | ----------- | --------------- | --- |
default; allow
only explicitly
granted; audit
logged
R-DAT-005 Audit Log  User action on PII  Immutable audit  IT + Compliance
|     | Retention | data | log; WORM  |     |
| --- | --------- | ---- | ---------- | --- |
(Write Once Read
Many) storage;
quarterly
compliance
review
R-DAT-006 Data Residency —  Cloud  All primary data  IT + Compliance
|     | India Only | infrastructure  | in India regions;  |     |
| --- | ---------- | --------------- | ------------------ | --- |
|     |            | setup / data    | backups in India;  |     |
|     |            | storage         | DR site in         |     |
different India
region
R-DAT-007 Data Subject  Parent / staff  Compile data  Compliance
|     | Access Request  | requests their  | package; provide  | Officer + IT |
| --- | --------------- | --------------- | ----------------- | ------------ |
|     | (DSAR)          | data via app /  | in machine-       |              |
|     |                 | email           | readable format   |              |
(JSON/CSV);
explain
processing
purposes
133

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-DAT-008 Data Erasure  Parent requests  Soft-delete from  Compliance
|     | Request | erasure of child  | primary store;    | Officer + IT |
| --- | ------- | ----------------- | ----------------- | ------------ |
|     |         | data post-exit    | hard-delete from  |              |
backups within 90
days; erase from
analytics;
certificate of
erasure
| R-DAT-009 | Backup Retention  | Daily backup  | Automated  | IT  |
| --------- | ----------------- | ------------- | ---------- | --- |
|           | Policy            | cycle         | backups;   |     |
encrypted;
geographically
separated (India
region); quarterly
restore drills
R-DAT-010 Breach Detection  Anomaly  Incident response  IT + Compliance +
|     | & Response | detection /   | team activation;   | Director |
| --- | ---------- | ------------- | ------------------ | -------- |
|     |            | unauthorized  | forensic capture;  |          |
|     |            | access alert  | containment;       |          |
eradication;
recovery; post-
mortem
R-DAT-011 Soft Delete Policy User requests  Soft-delete  System
|     |     | data deletion | immediate; data     | (Automated) +  |
| --- | --- | ------------- | ------------------- | -------------- |
|     |     |               | not visible in UI;  | Compliance     |
restorable within
90 days; auto
hard-delete after
R-DAT-012 Anonymized  Data aggregated  Anonymization  IT + Data Science
|     | Analytics Data | for analytics / ML  | pipeline;    | + Compliance |
| --- | -------------- | ------------------- | ------------ | ------------ |
|     |                | training            | statistical  |              |
disclosure
control; re-
identification risk
assessment
12.2 Detailed Rule Cards — Data Governance Rules
R-DAT-001 — PII Encryption at Rest
Rule ID R-DAT-001
134

PreOne BRC v1.0 | Business Rules Catalog
Domain Cross-Domain
Sub-Process Encryption
Title PII Encryption at Rest
Trigger PII data stored in database
Condition IF field IN [aadhaar, pan, medical_records,
parent_phone, parent_email, child_photo,
bank_account] THEN AES-256 encryption at rest
Action Field-level encryption; encryption keys in HSM
(Hardware Security Module); key rotation
quarterly
Exception None — mandatory encryption
Owner Role IT + Compliance
Source DPDP Act 2023 §8; School Policy 2024 §10.1
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-015, ADR-016
R-DAT-002 — Data in Transit Encryption
Rule ID R-DAT-002
Domain Cross-Domain
Sub-Process Encryption
Title Data in Transit Encryption
Trigger Data transmission over network
Condition IF data_transmitted_over_network = TRUE THEN
TLS 1.3 mandatory
Action All API calls over HTTPS; certificate pinning for
mobile apps; HSTS enabled; mixed-content
blocked
Exception None — mandatory TLS 1.3
Owner Role IT
Source DPDP Act 2023 §8; OWASP Transport Layer
Protection
Compliance DPDP §8
Status Approved
135

PreOne BRC v1.0 | Business Rules Catalog
Version 1.0
Related ADR ADR-015, ADR-016
R-DAT-003 — PII Field Masking in UI
Rule ID R-DAT-003
Domain Cross-Domain
Sub-Process Field Masking
Title PII Field Masking in UI
Trigger PII field displayed in user interface
Condition IF user_role NOT IN [Compliance, Director] AND
field IN [aadhaar, pan, bank_account] THEN mask
except last 4 chars
Action Auto-mask in lists, exports, logs; full view only
with explicit permission + audit log
Exception Compliance audit: full access with audit trail; auto-
expire after 24 hours
Owner Role IT + System (Automated)
Source DPDP Act 2023 §8; School Policy 2024 §10.3
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-015
R-DAT-004 — Role-Based Field Visibility
Rule ID R-DAT-004
Domain Cross-Domain
Sub-Process Access Control
Title Role-Based Field Visibility
Trigger User requests data access
Condition IF user_role NOT IN field.allowed_roles THEN field
not visible in API response
Action Enforce at API layer; deny by default; allow only
explicitly granted; audit logged
136

PreOne BRC v1.0 | Business Rules Catalog
Exception Branch Head: emergency override for child safety
(audit + 24h review)
Owner Role IT + Compliance
Source School Policy 2024 §10.4; RBAC Standard
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-015, ADR-016
R-DAT-005 — Audit Log Retention
Rule ID R-DAT-005
Domain Cross-Domain
Sub-Process Audit Log
Title Audit Log Retention
Trigger User action on PII data
Condition IF action = READ/WRITE/DELETE on PII THEN audit
logged; retention 7 years
Action Immutable audit log; WORM (Write Once Read
Many) storage; quarterly compliance review
Exception None — audit retention mandatory
Owner Role IT + Compliance
Source DPDP Act 2023 §8; IT Act §67C
Compliance DPDP §8; IT Act §67C
Status Approved
Version 1.0
Related ADR ADR-015, ADR-016
R-DAT-006 — Data Residency — India Only
Rule ID R-DAT-006
Domain Cross-Domain
Sub-Process Data Residency
Title Data Residency — India Only
Trigger Cloud infrastructure setup / data storage
137

PreOne BRC v1.0 | Business Rules Catalog
Condition IF data_storage_location NOT IN [India
(Mumbai/AWS ap-south-1 / Azure Central India)]
THEN block storage
Action All primary data in India regions; backups in India;
DR site in different India region
Exception Cross-border transfer (DPDP §33): explicit consent
+ DPA agreement + approved country list
Owner Role IT + Compliance
Source DPDP Act 2023 §33; RBI Data Localization (for
payment data)
Compliance DPDP §33; RBI Data Localization
Status Approved
Version 1.0
Related ADR ADR-015, ADR-016, ADR-019
R-DAT-007 — Data Subject Access Request (DSAR)
Rule ID R-DAT-007
Domain Cross-Domain
Sub-Process DSAR
Title Data Subject Access Request (DSAR)
Trigger Parent / staff requests their data via app / email
Condition IF dsar_received = TRUE THEN acknowledge
within 72 hours; fulfill within 30 days
Action Compile data package; provide in machine-
readable format (JSON/CSV); explain processing
purposes
Exception Third-party data redacted; legal hold data flagged
Owner Role Compliance Officer + IT
Source DPDP Act 2023 §8; GDPR Article 15 (international
best practice)
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-015, ADR-019
138

PreOne BRC v1.0 | Business Rules Catalog
R-DAT-008 — Data Erasure Request
Rule ID R-DAT-008
Domain Cross-Domain
Sub-Process DSAR
Title Data Erasure Request
Trigger Parent requests erasure of child data post-exit
Condition IF erasure_request_received AND legal_hold =
FALSE AND retention_period_expired = TRUE
THEN erase within 30 days
Action Soft-delete from primary store; hard-delete from
backups within 90 days; erase from analytics;
certificate of erasure
Exception Legal obligation data (fee, attendance, medical)
retained per R-CMP-003 schedule despite erasure
request
Owner Role Compliance Officer + IT
Source DPDP Act 2023 §8, §21
Compliance DPDP §8, §21
Status Approved
Version 1.0
Related ADR ADR-015, ADR-019
R-DAT-009 — Backup Retention Policy
Rule ID R-DAT-009
Domain Cross-Domain
Sub-Process Backup
Title Backup Retention Policy
Trigger Daily backup cycle
Condition IF backup_type = Daily THEN retain 30 days; IF
Weekly THEN 90 days; IF Monthly THEN 7 years
Action Automated backups; encrypted; geographically
separated (India region); quarterly restore drills
Exception None — backup retention mandatory
Owner Role IT
Source School Policy 2024 §10.5; DPDP Act 2023 §8
139

PreOne BRC v1.0 | Business Rules Catalog
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-015, ADR-016
R-DAT-010 — Breach Detection & Response
Rule ID R-DAT-010
Domain Cross-Domain
Sub-Process Breach Response
Title Breach Detection & Response
Trigger Anomaly detection / unauthorized access alert
Condition IF breach_detected = TRUE THEN activate IR plan
within 1 hour; assess within 24 hours; notify DPB
within 72 hours (R-CMP-008)
Action Incident response team activation; forensic
capture; containment; eradication; recovery; post-
mortem
Exception None — mandatory breach response per DPDP
§17
Owner Role IT + Compliance + Director
Source DPDP Act 2023 §17; NIST IR Framework
Compliance DPDP §17
Status Approved
Version 1.0
Related ADR ADR-015, ADR-019
R-DAT-011 — Soft Delete Policy
Rule ID R-DAT-011
Domain Cross-Domain
Sub-Process Soft Delete
Title Soft Delete Policy
Trigger User requests data deletion
140

PreOne BRC v1.0 | Business Rules Catalog
Condition IF delete_request = TRUE THEN soft_delete (mark
deleted=true, retain 90 days); after 90 days, hard-
delete if no legal hold
Action Soft-delete immediate; data not visible in UI;
restorable within 90 days; auto hard-delete after
Exception Legal hold: data retained beyond 90 days until
hold released
Owner Role System (Automated) + Compliance
Source School Policy 2024 §10.6
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-015, ADR-016
R-DAT-012 — Anonymized Analytics Data
Rule ID R-DAT-012
Domain Cross-Domain
Sub-Process Analytics
Title Anonymized Analytics Data
Trigger Data aggregated for analytics / ML training
Condition IF data_used_for_analytics = TRUE THEN
mandatory anonymization (k-anonymity k>=10);
direct identifiers removed
Action Anonymization pipeline; statistical disclosure
control; re-identification risk assessment
Exception Internal analytics with consented data: limited
access, audit logged
Owner Role IT + Data Science + Compliance
Source DPDP Act 2023 §8; School Policy 2024 §10.7
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-015, ADR-020
141

PreOne BRC v1.0 | Business Rules Catalog
13. Platform & Multi-tenant Rules
Platform & Multi-tenant rules govern SaaS layer — tenant isolation, subscription lifecycle, feature
flags per tier, license seat allocation, आति(cid:12) platform admin actions. ह्या(cid:2) rules चा(cid:2) primary goal म्हा(cid:12)जे(cid:10)
tenant data security + revenue protection (subscription enforcement) + fair resource allocation.
ह्या(cid:2) category मध्ये (cid:10)10 rules आहा(cid:10)(cid:6). प्र(cid:18)त्ये(cid:10)क rule खा(cid:2)ला(cid:31)लाप्र(cid:18)म(cid:2)(cid:12) (cid:10)detailed क(cid:10)ला(cid:31) आहा (cid:10)— summary table सर्व(cid:30) rules चा(cid:2)
quick overview दा(cid:6)(cid:10) (cid:10), त्ये(cid:2)नं(cid:6)(cid:14) रा प्र(cid:18)त्येक(cid:10) rule चा(cid:2) full schema card तिदाला(cid:2) आहा(cid:10).
13.1 Summary Table — Platform & Multi-tenant Rules
Rule ID Title Trigger Action Owner
R-PLT-001 Tenant Data Every data access Enforce at ORM IT + Platform
Isolation query layer (Prisma Admin
row-level
security); audit
log all cross-
tenant denial
attempts
R-PLT-002 Subscription Subscription Notify Director + Platform Admin +
Grace Period renewal overdue Branch Head + Accounts
Accounts; restrict
features
progressively;
data archived
(read-only) for 90
days post-
suspension
R-PLT-003 Tenant Subscription Notify tenant Platform Admin +
Suspension breach / admin; provide Director + Legal
Process compliance export link;
violation / abuse remediation plan;
reactivation
process
documented
R-PLT-004 Feature Flag per Tenant Auto-enable Platform Admin +
Tier onboarding / plan features per tier; Product
upgrade hide restricted
features in UI;
upgrade triggers
feature unlock
142

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID | Title | Trigger | Action | Owner |
| ------- | ----- | ------- | ------ | ----- |
R-PLT-005 License Seat  User added to  Notify tenant  Platform Admin +
|     | Allocation | tenant | admin; offer seat  | System      |
| --- | ---------- | ------ | ------------------ | ----------- |
|     |            |        | upgrade; pending   | (Automated) |
user request
queued
R-PLT-006 Branch-Level Data  Multi-branch  Enforce  IT + Compliance
|     | Partition | tenant data  | branch_id in    |     |
| --- | --------- | ------------ | --------------- | --- |
|     |           | access       | queries; cross- |     |
branch data only
for Director role;
audit logged
R-PLT-007 Platform Admin  Platform admin  Approval  Platform Admin +
|     | Role Restrictions | action | workflow; access  | Director +  |
| --- | ----------------- | ------ | ----------------- | ----------- |
|     |                   |        | request with      | Compliance  |
justification;
auto-expire;
quarterly
compliance
review of all
admin accesses
R-PLT-008 Cross-Tenant  Any cross-tenant  Code-level  IT + Platform
|     | Data Block | data reference in  | enforcement  | Admin |
| --- | ---------- | ------------------ | ------------ | ----- |
|     |            | code               | (Prisma      |       |
middleware);
deny by default;
explicit allowlist
for legitimate
cross-tenant
operations
(platform-wide
analytics with
anonymization)
R-PLT-009 Tenant  New tenant  KYC verification;  Platform Admin +
|     | Onboarding  | registration | GSTIN validation;  | Sales |
| --- | ----------- | ------------ | ------------------ | ----- |
|     | Validation  |              | authorized         |       |
signatory OTP;
initial
subscription
payment
143

PreOne BRC v1.0 | Business Rules Catalog
Rule ID Title Trigger Action Owner
R-PLT-010 Tenant Tenant Final invoice Platform Admin +
Offboarding cancellation settlement; data Accounts +
Process request export link (30- Compliance
day validity);
tenant
deactivation; data
archived 90 days;
permanent
deletion after
13.2 Detailed Rule Cards — Platform & Multi-tenant Rules
R-PLT-001 — Tenant Data Isolation
Rule ID R-PLT-001
Domain Platform
Sub-Process Tenant Isolation
Title Tenant Data Isolation
Trigger Every data access query
Condition IF user.tenant_id != data.tenant_id THEN deny
access (HTTP 403)
Action Enforce at ORM layer (Prisma row-level security);
audit log all cross-tenant denial attempts
Exception Platform Admin (PreOne internal): explicit super-
admin role with full audit + Director approval per
access
Owner Role IT + Platform Admin
Source School Policy 2024 §13.1; Multi-tenant SaaS Best
Practices
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-016, ADR-019
144

PreOne BRC v1.0 | Business Rules Catalog
R-PLT-002 — Subscription Grace Period
Rule ID R-PLT-002
Domain Platform
Sub-Process Subscription
Title Subscription Grace Period
Trigger Subscription renewal overdue
Condition IF subscription_overdue = TRUE THEN 7-day grace
period; after grace, suspend write access; after 30
days, archive data
Action Notify Director + Branch Head + Accounts; restrict
features progressively; data archived (read-only)
for 90 days post-suspension
Exception Disputed payment: extended grace (15 days)
while dispute resolved
Owner Role Platform Admin + Accounts
Source School Policy 2024 §13.2; PreOne SaaS Agreement
Compliance —
Status Approved
Version 1.0
Related ADR ADR-016
R-PLT-003 — Tenant Suspension Process
Rule ID R-PLT-003
Domain Platform
Sub-Process Tenant Suspension
Title Tenant Suspension Process
Trigger Subscription breach / compliance violation / abuse
Condition IF violation_severity = HIGH THEN suspend within
24 hours; read-only access for 30 days; data
export available
Action Notify tenant admin; provide export link;
remediation plan; reactivation process
documented
Exception Active child safety concern (POCSO): immediate
suspension, Director + Legal approval post-facto
Owner Role Platform Admin + Director + Legal
145

PreOne BRC v1.0 | Business Rules Catalog
Source School Policy 2024 §13.3
Compliance DPDP §8; POCSO §19
Status Approved
Version 1.0
Related ADR ADR-016, ADR-019
R-PLT-004 — Feature Flag per Tier
Rule ID R-PLT-004
Domain Platform
Sub-Process Feature Flag
Title Feature Flag per Tier
Trigger Tenant onboarding / plan upgrade
Condition IF tenant_tier = Small THEN features = [basic]; IF
Medium THEN + [advanced]; IF Large Then +
[enterprise]; IF Chain Then + [multi-branch]
Action Auto-enable features per tier; hide restricted
features in UI; upgrade triggers feature unlock
Exception Trial features: time-bound access for evaluation
Owner Role Platform Admin + Product
Source School Policy 2024 §13.4; PreOne Pricing Tiers
Compliance —
Status Approved
Version 1.0
Related ADR ADR-016
R-PLT-005 — License Seat Allocation
Rule ID R-PLT-005
Domain Platform
Sub-Process License
Title License Seat Allocation
Trigger User added to tenant
Condition IF active_users_in_tenant >= licensed_seats THEN
block new user creation
146

PreOne BRC v1.0 | Business Rules Catalog
Action Notify tenant admin; offer seat upgrade; pending
user request queued
Exception Director / Owner role: always allowed (essential
personnel)
Owner Role Platform Admin + System (Automated)
Source School Policy 2024 §13.5; PreOne License
Agreement
Compliance —
Status Approved
Version 1.0
Related ADR ADR-016
R-PLT-006 — Branch-Level Data Partition
Rule ID R-PLT-006
Domain Platform
Sub-Process Branch Isolation
Title Branch-Level Data Partition
Trigger Multi-branch tenant data access
Condition IF user.role != Director AND user.branch_id !=
data.branch_id THEN deny access
Action Enforce branch_id in queries; cross-branch data
only for Director role; audit logged
Exception Compliance audit: cross-branch access with
Director approval + audit trail
Owner Role IT + Compliance
Source School Policy 2024 §13.6
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-016, ADR-019
R-PLT-007 — Platform Admin Role Restrictions
Rule ID R-PLT-007
Domain Platform
147

PreOne BRC v1.0 | Business Rules Catalog
Sub-Process Platform Admin
Title Platform Admin Role Restrictions
Trigger Platform admin action
Condition IF admin_action = 'tenant_data_access' THEN
explicit Director approval per access; audit logged;
time-bound (4 hours)
Action Approval workflow; access request with
justification; auto-expire; quarterly compliance
review of all admin accesses
Exception Active incident response: emergency access with
post-facto review within 24 hours
Owner Role Platform Admin + Director + Compliance
Source School Policy 2024 §13.7
Compliance DPDP §8
Status Approved
Version 1.0
Related ADR ADR-016, ADR-019
R-PLT-008 — Cross-Tenant Data Block
Rule ID R-PLT-008
Domain Platform
Sub-Process Cross-Tenant
Title Cross-Tenant Data Block
Trigger Any cross-tenant data reference in code
Condition IF query.references_multiple_tenants AND NOT
platform_admin_approved = TRUE THEN block
Action Code-level enforcement (Prisma middleware);
deny by default; explicit allowlist for legitimate
cross-tenant operations (platform-wide analytics
with anonymization)
Exception Platform-wide aggregate analytics: anonymized
data only (R-DAT-012)
Owner Role IT + Platform Admin
Source School Policy 2024 §13.8; Multi-tenant Security
Best Practices
Compliance DPDP §8
148

PreOne BRC v1.0 | Business Rules Catalog
Status Approved
Version 1.0
Related ADR ADR-016
R-PLT-009 — Tenant Onboarding Validation
Rule ID R-PLT-009
Domain Platform
Sub-Process Onboarding
Title Tenant Onboarding Validation
Trigger New tenant registration
Condition IF business_proof_provided = TRUE AND
authorized_signatory_verified = TRUE AND
payment_method_valid = TRUE THEN activate
tenant
Action KYC verification; GSTIN validation; authorized
signatory OTP; initial subscription payment
Exception Trial onboarding: 14-day trial without business
proof (limited features, watermarked)
Owner Role Platform Admin + Sales
Source School Policy 2024 §13.9; GST Act (GSTIN
validation)
Compliance GST Act; DPDP §4
Status Approved
Version 1.0
Related ADR ADR-016, ADR-019
R-PLT-010 — Tenant Offboarding Process
Rule ID R-PLT-010
Domain Platform
Sub-Process Offboarding
Title Tenant Offboarding Process
Trigger Tenant cancellation request
149

PreOne BRC v1.0  |  Business Rules Catalog
| Condition |     | IF cancellation_request_received = TRUE THEN 30- |     |
| --------- | --- | ------------------------------------------------ | --- |
day offboarding window; data export provided;
tenant deactivated post-window
| Action |     | Final invoice settlement; data export link (30-day  |     |
| ------ | --- | --------------------------------------------------- | --- |
validity); tenant deactivation; data archived 90
days; permanent deletion after
| Exception |     | Compliance investigation: extended retention  |     |
| --------- | --- | --------------------------------------------- | --- |
with legal hold; offboarding paused
| Owner Role |     | Platform Admin + Accounts + Compliance  |     |
| ---------- | --- | --------------------------------------- | --- |
| Source     |     | School Policy 2024 §13.10; PreOne SaaS  |     |
Agreement; DPDP Act 2023
| Compliance  |     | DPDP §8          |     |
| ----------- | --- | ---------------- | --- |
| Status      |     | Approved         |     |
| Version     |     | 1.0              |     |
| Related ADR |     | ADR-016, ADR-019 |     |
Appendix A — Cross-Reference Matrix (BRC ↔ ADR ↔ PRD)
ह्या(cid:2) appendix मध्ये (cid:10)सर्व (cid:30)176 rules चा(cid:31) ADR mapping consolidated क(cid:10)ला(cid:31) आहा(cid:10). PRD column मध्ये (cid:10)expected PRD
module reference placeholder आहा(cid:10) — PRD writing phase मध्ये(cid:10) actual reference fill हा$ईला.
| Rule ID   | Title          | Related ADR      | PRD Module  |
| --------- | -------------- | ---------------- | ----------- |
| R-ELG-001 | Playgroup Age  | ADR-005, ADR-012 | PRD-ADM-001 |
Eligibility
| R-ELG-002 | Nursery Age Eligibility | ADR-005 | PRD-ADM-001 |
| --------- | ----------------------- | ------- | ----------- |
| R-ELG-003 | Jr.KG Age Eligibility   | ADR-005 | PRD-ADM-001 |
| R-ELG-004 | Sr.KG Age Eligibility   | ADR-005 | PRD-ADM-001 |
| R-ELG-005 | Age Proof Document      | ADR-005 | PRD-ADM-001 |
Mandatory
| R-ELG-006 | Birth Certificate  | ADR-005, ADR-012 | PRD-ADM-001 |
| --------- | ------------------ | ---------------- | ----------- |
Mandatory
| R-ELG-007 | Medical Fitness  | ADR-005 | PRD-ADM-001 |
| --------- | ---------------- | ------- | ----------- |
Declaration
| R-ELG-008 | Photograph Mandatory | ADR-005 | PRD-ADM-001 |
| --------- | -------------------- | ------- | ----------- |
| R-ELG-009 | Parent/Guardian      | ADR-005 | PRD-ADM-001 |
Identity Proof
150

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title            | Related ADR | PRD Module  |
| --------- | ---------------- | ----------- | ----------- |
| R-ELG-010 | Primary Contact  | ADR-005     | PRD-ADM-001 |
Mandatory
| R-ELG-011 | Sibling Admission  | ADR-005 | PRD-ADM-001 |
| --------- | ------------------ | ------- | ----------- |
Priority
| R-ELG-012 | Staff Ward Admission  | ADR-005 | PRD-ADM-001 |
| --------- | --------------------- | ------- | ----------- |
Quota
| R-ELG-013 | Transfer Student  | ADR-005 | PRD-ADM-001 |
| --------- | ----------------- | ------- | ----------- |
Eligibility
| R-ELG-014 | RTE Section 12 (25%  | ADR-005, ADR-019 | PRD-ADM-001 |
| --------- | -------------------- | ---------------- | ----------- |
EWS Reservation)
| R-ELG-015 | Special Needs Child  | ADR-005 | PRD-ADM-001 |
| --------- | -------------------- | ------- | ----------- |
Admission
| R-FIN-001 | Fee Due Date  | ADR-008 | PRD-FIN-001 |
| --------- | ------------- | ------- | ----------- |
Enforcement
| R-FIN-002 | Late Fee Calculation | ADR-008 | PRD-FIN-001 |
| --------- | -------------------- | ------- | ----------- |
| R-FIN-003 | Refund Policy —      | ADR-008 | PRD-FIN-001 |
Withdrawal Before
Term Start
| R-FIN-004 | Refund — Mid-Term  | ADR-008 | PRD-FIN-001 |
| --------- | ------------------ | ------- | ----------- |
Withdrawal
| R-FIN-005 | Sibling Discount    | ADR-008          | PRD-FIN-001 |
| --------- | ------------------- | ---------------- | ----------- |
| R-FIN-006 | Early Bird Discount | ADR-008          | PRD-FIN-001 |
| R-FIN-007 | GST on Educational  | ADR-008, ADR-022 | PRD-FIN-001 |
Services
| R-FIN-008 | Invoice Number  | ADR-008, ADR-022 | PRD-FIN-001 |
| --------- | --------------- | ---------------- | ----------- |
Generation
| R-FIN-009 | Payment Receipt  | ADR-008, ADR-022 | PRD-FIN-001 |
| --------- | ---------------- | ---------------- | ----------- |
Generation
| R-FIN-010 | Digital Payment  | ADR-008, ADR-022 | PRD-FIN-001 |
| --------- | ---------------- | ---------------- | ----------- |
Mandate
| R-FIN-011 | Cheque Bounce  | ADR-008 | PRD-FIN-001 |
| --------- | -------------- | ------- | ----------- |
Handling (NSF)
| R-FIN-012 | Installment Plan  | ADR-008 | PRD-FIN-001 |
| --------- | ----------------- | ------- | ----------- |
Approval
| R-FIN-013 | Merit Scholarship  | ADR-008 | PRD-FIN-001 |
| --------- | ------------------ | ------- | ----------- |
Eligibility
151

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title              | Related ADR      | PRD Module  |
| --------- | ------------------ | ---------------- | ----------- |
| R-FIN-014 | Bad Debt Write-off | ADR-008          | PRD-FIN-001 |
| R-FIN-015 | Expense Approval   | ADR-008, ADR-014 | PRD-FIN-001 |
Matrix
| R-FIN-016 | Vendor Payment Terms | ADR-008          | PRD-FIN-001 |
| --------- | -------------------- | ---------------- | ----------- |
| R-FIN-017 | TDS Deduction on     | ADR-008, ADR-022 | PRD-FIN-001 |
Vendor Payments
| R-FIN-018 | Financial Hardship  | ADR-008 | PRD-FIN-001 |
| --------- | ------------------- | ------- | ----------- |
Waiver
| R-FIN-019 | RTE Section 12  | ADR-008, ADR-019 | PRD-FIN-001 |
| --------- | --------------- | ---------------- | ----------- |
Reimbursement Claim
| R-FIN-020 | Annual Financial Audit | ADR-008          | PRD-FIN-001 |
| --------- | ---------------------- | ---------------- | ----------- |
| R-OPS-001 | Authorized Pickup      | ADR-007, ADR-015 | PRD-OPS-001 |
Person List
| R-OPS-002 | Unauthorized Pickup  | ADR-007, ADR-015 | PRD-OPS-001 |
| --------- | -------------------- | ---------------- | ----------- |
Block
| R-OPS-003 | Late Pickup Fee       | ADR-007 | PRD-OPS-001 |
| --------- | --------------------- | ------- | ----------- |
| R-OPS-004 | Arrival Cutoff Time   | ADR-007 | PRD-OPS-001 |
| R-OPS-005 | Attendance Threshold  | ADR-007 | PRD-OPS-001 |
for Promotion
| R-OPS-006 | Attendance Marking  | ADR-007 | PRD-OPS-001 |
| --------- | ------------------- | ------- | ----------- |
Window
| R-OPS-007 | Mid-Day Exit Gate Pass | ADR-007          | PRD-OPS-001 |
| --------- | ---------------------- | ---------------- | ----------- |
| R-OPS-008 | Visitor Logging        | ADR-007          | PRD-OPS-001 |
| R-OPS-009 | Bus Route Assignment   | ADR-007, ADR-018 | PRD-OPS-001 |
| R-OPS-010 | Bus Tracking — Real-   | ADR-007, ADR-018 | PRD-OPS-001 |
time GPS
R-OPS-011 Bus Missing Child Alert ADR-007, ADR-018 PRD-OPS-001
| R-OPS-012 | Morning Health Check | ADR-007          | PRD-OPS-001 |
| --------- | -------------------- | ---------------- | ----------- |
| R-OPS-013 | Meal Allergy Check   | ADR-007          | PRD-OPS-001 |
| R-OPS-014 | Nap Time Supervision | ADR-007          | PRD-OPS-001 |
| R-OPS-015 | Incident Escalation  | ADR-007, ADR-015 | PRD-OPS-001 |
Matrix
152

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title              | Related ADR      | PRD Module  |
| --------- | ------------------ | ---------------- | ----------- |
| R-OPS-016 | Photo Consent for  | ADR-007, ADR-015 | PRD-OPS-001 |
Marketing
| R-OPS-017 | Daily Timeline Push to  | ADR-007 | PRD-OPS-001 |
| --------- | ----------------------- | ------- | ----------- |
Parent
| R-OPS-018 | Food Sample Retention | ADR-007          | PRD-OPS-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-OPS-019 | Washroom Assistance   | ADR-007          | PRD-OPS-001 |
| R-OPS-020 | CCTV Coverage and     | ADR-007, ADR-015 | PRD-OPS-001 |
Retention
| R-ACD-001 | Curriculum Theme  | ADR-006 | PRD-ACD-001 |
| --------- | ----------------- | ------- | ----------- |
Rotation
| R-ACD-002 | Weekly Lesson Plan  | ADR-006 | PRD-ACD-001 |
| --------- | ------------------- | ------- | ----------- |
Submission
| R-ACD-003 | Daily Activity Slots   | ADR-006 | PRD-ACD-001 |
| --------- | ---------------------- | ------- | ----------- |
| R-ACD-004 | Observation Recording  | ADR-006 | PRD-ACD-001 |
Frequency
| R-ACD-005 | Observation Quality  | ADR-006, ADR-020 | PRD-ACD-001 |
| --------- | -------------------- | ---------------- | ----------- |
Check
| R-ACD-006 | Milestone Assessment  | ADR-006 | PRD-ACD-001 |
| --------- | --------------------- | ------- | ----------- |
Frequency
| R-ACD-007 | Milestone Delay Alert | ADR-006 | PRD-ACD-001 |
| --------- | --------------------- | ------- | ----------- |
| R-ACD-008 | Portfolio Update      | ADR-006 | PRD-ACD-001 |
Cadence
| R-ACD-009 | Report Card  | ADR-006, ADR-020 | PRD-ACD-001 |
| --------- | ------------ | ---------------- | ----------- |
Generation Cycle
| R-ACD-010 | Report Card Approval  | ADR-006 | PRD-ACD-001 |
| --------- | --------------------- | ------- | ----------- |
Workflow
| R-ACD-011 | Promotion Criteria  | ADR-006 | PRD-ACD-001 |
| --------- | ------------------- | ------- | ----------- |
| R-ACD-012 | Age-Based Class Cap | ADR-006 | PRD-ACD-001 |
| R-ACD-013 | PTM Frequency       | ADR-006 | PRD-ACD-001 |
| R-ACD-014 | Remedial Program    | ADR-006 | PRD-ACD-001 |
Trigger
| R-ACD-015 | Outdoor Play Duration   | ADR-006 | PRD-ACD-001 |
| --------- | ----------------------- | ------- | ----------- |
| R-ACD-016 | Activity Participation  | ADR-006 | PRD-ACD-001 |
Tracking
153

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title              | Related ADR | PRD Module  |
| --------- | ------------------ | ----------- | ----------- |
| R-ACD-017 | Annual Curriculum  | ADR-006     | PRD-ACD-001 |
Audit
| R-ACD-018 | Field Trip Safety  | ADR-006 | PRD-ACD-001 |
| --------- | ------------------ | ------- | ----------- |
Protocol
| R-HR-001 | Staff Qualification  | ADR-009 | PRD-HR-001 |
| -------- | -------------------- | ------- | ---------- |
Minimum
| R-HR-002 | Staff Background  | ADR-009, ADR-015 | PRD-HR-001 |
| -------- | ----------------- | ---------------- | ---------- |
Verification
| R-HR-003 | Leave Entitlement  | ADR-009 | PRD-HR-001 |
| -------- | ------------------ | ------- | ---------- |
Annual
| R-HR-004 | Max Consecutive Leave | ADR-009 | PRD-HR-001 |
| -------- | --------------------- | ------- | ---------- |
| R-HR-005 | Substitute Teacher    | ADR-009 | PRD-HR-001 |
Assignment
| R-HR-006 | Payroll Cutoff Date | ADR-009 | PRD-HR-001 |
| -------- | ------------------- | ------- | ---------- |
| R-HR-007 | Performance Review  | ADR-009 | PRD-HR-001 |
Cycle
| R-HR-008 | Exit Process         | ADR-009          | PRD-HR-001 |
| -------- | -------------------- | ---------------- | ---------- |
| R-HR-009 | Internal Complaints  | ADR-009, ADR-015 | PRD-HR-001 |
Committee (ICC)
| R-HR-010 | Annual POSH Training  | ADR-009, ADR-015 | PRD-HR-001 |
| -------- | --------------------- | ---------------- | ---------- |
| R-HR-011 | Food Handler Medical  | ADR-009          | PRD-HR-001 |
Certificate
| R-HR-012  | Probation Period     | ADR-009 | PRD-HR-001  |
| --------- | -------------------- | ------- | ----------- |
| R-INV-001 | Auto Reorder Trigger | ADR-010 | PRD-INV-001 |
| R-INV-002 | Minimum Stock        | ADR-010 | PRD-INV-001 |
Threshold
| R-INV-003 | Perishable Item Expiry  | ADR-010 | PRD-INV-001 |
| --------- | ----------------------- | ------- | ----------- |
Tracking
| R-INV-004 | Expired Item Disposal | ADR-010          | PRD-INV-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-INV-005 | Asset Depreciation    | ADR-010, ADR-022 | PRD-INV-001 |
| R-INV-006 | Vendor Rating         | ADR-010          | PRD-INV-001 |
Threshold
| R-INV-007 | PO Approval Threshold | ADR-010, ADR-014 | PRD-INV-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-INV-008 | Issue Slip Mandatory  | ADR-010          | PRD-INV-001 |
154

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title                 | Related ADR      | PRD Module  |
| --------- | --------------------- | ---------------- | ----------- |
| R-INV-009 | Stock Audit Frequency | ADR-010          | PRD-INV-001 |
| R-INV-010 | Return Window         | ADR-010          | PRD-INV-001 |
| R-INV-011 | Consumption Tracking  | ADR-010          | PRD-INV-001 |
| R-INV-012 | Asset Disposal        | ADR-010, ADR-022 | PRD-INV-001 |
Approval
| R-COM-001 | Parent Message  | ADR-011 | PRD-COM-001 |
| --------- | --------------- | ------- | ----------- |
Response Time
| R-COM-002 | Unacknowledged  | ADR-011 | PRD-COM-001 |
| --------- | --------------- | ------- | ----------- |
Message Escalation
| R-COM-003 | Non-Academic Hour  | ADR-011 | PRD-COM-001 |
| --------- | ------------------ | ------- | ----------- |
Messaging Restriction
| R-COM-004 | Broadcast Restriction | ADR-011          | PRD-COM-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-COM-005 | Language Preference   | ADR-011, ADR-020 | PRD-COM-001 |
| R-COM-006 | Marketing             | ADR-011, ADR-015 | PRD-COM-001 |
Communication Opt-in
| R-COM-007 | Communication  | ADR-011, ADR-015 | PRD-COM-001 |
| --------- | -------------- | ---------------- | ----------- |
Channel Opt-out
| R-COM-008 | Announcement  | ADR-011 | PRD-COM-001 |
| --------- | ------------- | ------- | ----------- |
Approval Workflow
| R-COM-009 | Photo Caption  | ADR-011, ADR-020 | PRD-COM-001 |
| --------- | -------------- | ---------------- | ----------- |
Mandatory
| R-COM-010 | Two-way Chat History  | ADR-011, ADR-015 | PRD-COM-001 |
| --------- | --------------------- | ---------------- | ----------- |
Retention
| R-COM-011 | WhatsApp Business API  | ADR-011 | PRD-COM-001 |
| --------- | ---------------------- | ------- | ----------- |
Rate Limit
R-COM-012 Emergency Notification  ADR-011, ADR-015 PRD-COM-001
Cascade
| R-CMP-001 | Parent Consent for  | ADR-015, ADR-019 | PRD-CMP-001 |
| --------- | ------------------- | ---------------- | ----------- |
Child Data
| R-CMP-002 | Consent Withdrawal    | ADR-015, ADR-019 | PRD-CMP-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-CMP-003 | Child Data Retention  | ADR-015, ADR-019 | PRD-CMP-001 |
Policy
| R-CMP-004 | Child Photo Storage  | ADR-015 | PRD-CMP-001 |
| --------- | -------------------- | ------- | ----------- |
Encryption
| R-CMP-005 | CCTV Retention Period | ADR-015 | PRD-CMP-001 |
| --------- | --------------------- | ------- | ----------- |
155

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title               | Related ADR      | PRD Module  |
| --------- | ------------------- | ---------------- | ----------- |
| R-CMP-006 | Quarterly PII Audit | ADR-015          | PRD-CMP-001 |
| R-CMP-007 | Fire NOC Renewal    | ADR-015          | PRD-CMP-001 |
| R-CMP-008 | Data Breach         | ADR-015, ADR-019 | PRD-CMP-001 |
Notification
| R-CMP-009 | POSH Complaint Filing | ADR-015, ADR-019 | PRD-CMP-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-CMP-010 | POSH Confidentiality  | ADR-015          | PRD-CMP-001 |
R-CMP-011 POSH Training for All  ADR-009, ADR-015 PRD-CMP-001
Staff
| R-CMP-012 | POSH Complaint  | ADR-015 | PRD-CMP-001 |
| --------- | --------------- | ------- | ----------- |
Timeline
| R-CMP-013 | Quarterly Fire Drill | ADR-015 | PRD-CMP-001 |
| --------- | -------------------- | ------- | ----------- |
| R-CMP-014 | Fire Extinguisher    | ADR-015 | PRD-CMP-001 |
Inspection
| R-CMP-015 | Evacuation Plan Display | ADR-015 | PRD-CMP-001 |
| --------- | ----------------------- | ------- | ----------- |
| R-CMP-016 | RTE Non-                | ADR-019 | PRD-CMP-001 |
Discrimination
| R-CMP-017 | FSSAI Kitchen License | ADR-015          | PRD-CMP-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-CMP-018 | Food Handler Medical  | ADR-009, ADR-015 | PRD-CMP-001 |
Certificate
| R-APR-001 | Discount Approval by  | ADR-014 | PRD-APR-001 |
| --------- | --------------------- | ------- | ----------- |
Amount
| R-APR-002 | Refund Approval  | ADR-014 | PRD-APR-001 |
| --------- | ---------------- | ------- | ----------- |
Matrix
| R-APR-003 | Leave Approval Matrix | ADR-014 | PRD-APR-001 |
| --------- | --------------------- | ------- | ----------- |
| R-APR-004 | Expense Approval by   | ADR-014 | PRD-APR-001 |
Amount
| R-APR-005 | Vendor Onboarding  | ADR-014 | PRD-APR-001 |
| --------- | ------------------ | ------- | ----------- |
Approval
| R-APR-006 | Admission Final  | ADR-005, ADR-014 | PRD-APR-001 |
| --------- | ---------------- | ---------------- | ----------- |
Approval
| R-APR-007 | Fee Waiver Approval | ADR-014          | PRD-APR-001 |
| --------- | ------------------- | ---------------- | ----------- |
| R-APR-008 | Asset Disposal      | ADR-014, ADR-022 | PRD-APR-001 |
Approval
156

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title              | Related ADR | PRD Module  |
| --------- | ------------------ | ----------- | ----------- |
| R-APR-009 | Action-Based Role  | ADR-014     | PRD-APR-001 |
Escalation
| R-APR-010 | New Position Approval | ADR-014 | PRD-APR-001 |
| --------- | --------------------- | ------- | ----------- |
| R-APR-011 | Salary Revision       | ADR-014 | PRD-APR-001 |
Approval
| R-APR-012 | School Policy Change  | ADR-014 | PRD-APR-001 |
| --------- | --------------------- | ------- | ----------- |
Approval
| R-APR-013 | Bulk Data Export  | ADR-014, ADR-015 | PRD-APR-001 |
| --------- | ----------------- | ---------------- | ----------- |
Approval
| R-APR-014 | Vendor Payment  | ADR-014 | PRD-APR-001 |
| --------- | --------------- | ------- | ----------- |
Approval
| R-APR-015 | Curriculum Change  | ADR-006, ADR-014 | PRD-APR-001 |
| --------- | ------------------ | ---------------- | ----------- |
Approval
| R-NOT-001 | Fee Due Reminder  | ADR-011 | PRD-NOT-001 |
| --------- | ----------------- | ------- | ----------- |
Cadence
| R-NOT-002 | Child Absence Alert | ADR-007, ADR-011 | PRD-NOT-001 |
| --------- | ------------------- | ---------------- | ----------- |
R-NOT-003 Daily Report Push Time ADR-007, ADR-011 PRD-NOT-001
| R-NOT-004 | Birthday Greeting | ADR-011 | PRD-NOT-001 |
| --------- | ----------------- | ------- | ----------- |
| R-NOT-005 | Festival Greeting | ADR-011 | PRD-NOT-001 |
R-NOT-006 Incident Notification ADR-007, ADR-011,  PRD-NOT-001
ADR-015
| R-NOT-007 | Photo Share Alert | ADR-007, ADR-011 | PRD-NOT-001 |
| --------- | ----------------- | ---------------- | ----------- |
| R-NOT-008 | Event Schedule    | ADR-011          | PRD-NOT-001 |
Announcement
| R-NOT-009 | Holiday Alert         | ADR-011          | PRD-NOT-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-NOT-010 | Transport Delay Alert | ADR-011, ADR-018 | PRD-NOT-001 |
| R-NOT-011 | Salary Credit         | ADR-011          | PRD-NOT-001 |
Notification
| R-NOT-012 | System Maintenance  | ADR-011 | PRD-NOT-001 |
| --------- | ------------------- | ------- | ----------- |
Notification
R-DAT-001 PII Encryption at Rest ADR-015, ADR-016 PRD-DAT-001
| R-DAT-002 | Data in Transit  | ADR-015, ADR-016 | PRD-DAT-001 |
| --------- | ---------------- | ---------------- | ----------- |
Encryption
| R-DAT-003 | PII Field Masking in UI | ADR-015 | PRD-DAT-001 |
| --------- | ----------------------- | ------- | ----------- |
157

PreOne BRC v1.0  |  Business Rules Catalog
| Rule ID   | Title             | Related ADR      | PRD Module  |
| --------- | ----------------- | ---------------- | ----------- |
| R-DAT-004 | Role-Based Field  | ADR-015, ADR-016 | PRD-DAT-001 |
Visibility
| R-DAT-005 | Audit Log Retention  | ADR-015, ADR-016   | PRD-DAT-001 |
| --------- | -------------------- | ------------------ | ----------- |
| R-DAT-006 | Data Residency —     | ADR-015, ADR-016,  | PRD-DAT-001 |
|           | India Only           | ADR-019            |             |
| R-DAT-007 | Data Subject Access  | ADR-015, ADR-019   | PRD-DAT-001 |
Request (DSAR)
| R-DAT-008 | Data Erasure Request | ADR-015, ADR-019 | PRD-DAT-001 |
| --------- | -------------------- | ---------------- | ----------- |
| R-DAT-009 | Backup Retention     | ADR-015, ADR-016 | PRD-DAT-001 |
Policy
| R-DAT-010 | Breach Detection &  | ADR-015, ADR-019 | PRD-DAT-001 |
| --------- | ------------------- | ---------------- | ----------- |
Response
| R-DAT-011 | Soft Delete Policy    | ADR-015, ADR-016 | PRD-DAT-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-DAT-012 | Anonymized Analytics  | ADR-015, ADR-020 | PRD-DAT-001 |
Data
| R-PLT-001 | Tenant Data Isolation | ADR-016, ADR-019 | PRD-PLT-001 |
| --------- | --------------------- | ---------------- | ----------- |
| R-PLT-002 | Subscription Grace    | ADR-016          | PRD-PLT-001 |
Period
| R-PLT-003 | Tenant Suspension  | ADR-016, ADR-019 | PRD-PLT-001 |
| --------- | ------------------ | ---------------- | ----------- |
Process
| R-PLT-004 | Feature Flag per Tier   | ADR-016          | PRD-PLT-001 |
| --------- | ----------------------- | ---------------- | ----------- |
| R-PLT-005 | License Seat Allocation | ADR-016          | PRD-PLT-001 |
| R-PLT-006 | Branch-Level Data       | ADR-016, ADR-019 | PRD-PLT-001 |
Partition
| R-PLT-007 | Platform Admin Role  | ADR-016, ADR-019 | PRD-PLT-001 |
| --------- | -------------------- | ---------------- | ----------- |
Restrictions
| R-PLT-008 | Cross-Tenant Data  | ADR-016 | PRD-PLT-001 |
| --------- | ------------------ | ------- | ----------- |
Block
| R-PLT-009 | Tenant Onboarding  | ADR-016, ADR-019 | PRD-PLT-001 |
| --------- | ------------------ | ---------------- | ----------- |
Validation
| R-PLT-010 | Tenant Offboarding  | ADR-016, ADR-019 | PRD-PLT-001 |
| --------- | ------------------- | ---------------- | ----------- |
Process
158

PreOne BRC v1.0  |  Business Rules Catalog
Appendix B — Compliance Framework Mapping
ह्या(cid:2)  appendix  मध्ये(cid:10)  major compliance frameworks  चा(cid:31)  PreOne BRC rules  श(cid:31)  mapping  तिदाला(cid:31) आहा(cid:10).
Compliance officer ह्या(cid:2) matrix चा(cid:2) use करूनं audit readiness check करू शक(cid:6)(cid:31)ला.
DPDP Act 2023 (Digital Personal Data Protection)
| DPDP Section | Requirement            | BRC Rules Enforcing      |
| ------------ | ---------------------- | ------------------------ |
| §4           | Consent for child data | R-ELG-002, R-CMP-001, R- |
CMP-002, R-DAT-001
| §8  | Data Principal rights (access,  | R-DAT-007, R-DAT-008, R- |
| --- | ------------------------------- | ------------------------ |
|     | correction, erasure)            | DAT-009                  |
| §11 | Purpose limitation              | R-DAT-002, R-DAT-003     |
| §17 | Data breach notification (72h)  | R-CMP-008, R-DAT-010     |
| §21 | Consent withdrawal              | R-COM-007, R-DAT-008     |
| §33 | Cross-border transfer           | R-DAT-006, R-PLT-009     |
restrictions
POSH Act 2013 (Sexual Harassment of Women at Workplace)
| POSH Section | Requirement                    | BRC Rules Enforcing |
| ------------ | ------------------------------ | ------------------- |
| §4           | Internal Complaints Committee  | R-HR-009, R-CMP-011 |
(ICC)
| §9  | Time-bound complaint redressal  | R-CMP-012 |
| --- | ------------------------------- | --------- |
(90 days)
| §19 | Annual POSH training  | R-HR-010, R-CMP-013 |
| --- | --------------------- | ------------------- |
mandatory
| §16 | Confidentiality of complaint | R-DAT-004, R-CMP-014 |
| --- | ---------------------------- | -------------------- |
Fire Safety (NBC 2016 / State Fire Services Act)
| NBC Clause | Requirement                      | BRC Rules Enforcing |
| ---------- | -------------------------------- | ------------------- |
| §4.3       | Fire NOC renewal (annual)        | R-CMP-015           |
| §4.4       | Fire drill frequency (quarterly) | R-CMP-016           |
159

PreOne BRC v1.0  |  Business Rules Catalog
| NBC Clause | Requirement                   | BRC Rules Enforcing |
| ---------- | ----------------------------- | ------------------- |
| §4.5       | Fire extinguisher inspection  | R-CMP-017           |
(monthly)
| §4.7 | Evacuation plan displayed | R-CMP-018 |
| ---- | ------------------------- | --------- |
RTE Section 12 (25% Reservation for EWS/Disadvantaged)
| RTE Clause | Requirement                    | BRC Rules Enforcing |
| ---------- | ------------------------------ | ------------------- |
| §12(1)(c)  | 25% seats reserved for EWS in  | R-ELG-014           |
entry class
| §12(2) | Reimbursement claim per state  | R-FIN-019 |
| ------ | ------------------------------ | --------- |
rules
| §12(3) | No discrimination against EWS  | R-CMP-019 |
| ------ | ------------------------------ | --------- |
students
FSSAI (Food Safety for Mid-day Meals / Snacks)
| FSSAI Regulation | Requirement               | BRC Rules Enforcing |
| ---------------- | ------------------------- | ------------------- |
| FSSR 2011 §3     | Kitchen license mandatory | R-CMP-020           |
FSSR 2011 §4 Food handler medical certificate R-HR-011, R-CMP-021
FSSR 2011 §5 Sample retention (48 hours) R-OPS-018, R-CMP-022
Appendix C — Glossary
ह्या(cid:2) appendix मध्ये(cid:10) BRC मध्ये(cid:10) र्व(cid:2)प्ररालाला(cid:10)  (cid:10)technical + business terms define क(cid:10)ला (cid:10)आहा(cid:10)(cid:6).
Term Definition
ACV Annual Contract Value — total contract value per
school per year.
ADR Architecture Decision Record — technical decision
documentation.
160

PreOne BRC v1.0 | Business Rules Catalog
Term Definition
BPM Business Process Model — high-level process flow
document.
BRC Business Rules Catalog — this document;
centralized rule repository.
CR Change Request — formal request to modify a
frozen rule.
CSAT Customer Satisfaction Score — post-interaction
survey metric.
DAU/MAU Daily/Monthly Active Users ratio — product
stickiness metric.
DDD Domain-Driven Design — software architecture
pattern PreOne uses.
DPDP Digital Personal Data Protection Act 2023 — India
data protection law.
DSAR Data Subject Access Request — user request for
their data (DPDP §8).
ECCE Early Childhood Care and Education — NEP 2020
framework for ages 3-8.
EWS Economically Weaker Section — RTE §12(1)(c)
reservation category.
FIFO First In First Out — inventory issuance method for
perishables.
FSSAI Food Safety and Standards Authority of India.
FSSR Food Safety and Standards Regulations 2011.
GRN Goods Received Note — inventory receipt
confirmation document.
GST Goods and Services Tax — Indian indirect tax.
ICC Internal Complaints Committee — POSH Act
compliance body.
KPI Key Performance Indicator — measurable success
metric.
MRR Monthly Recurring Revenue — SaaS subscription
revenue metric.
NBC National Building Code 2016 — fire safety
reference.
161

PreOne BRC v1.0  |  Business Rules Catalog
| Term |     | Definition                               |
| ---- | --- | ---------------------------------------- |
| NEP  |     | National Education Policy 2020 — Indian  |
education framework.
| NOC |     | No Objection Certificate — fire safety compliance  |
| --- | --- | -------------------------------------------------- |
certificate.
| NPS |     | Net Promoter Score — customer loyalty metric. |
| --- | --- | --------------------------------------------- |
| NRR |     | Net Revenue Retention — SaaS expansion +      |
retention metric.
| PII |     | Personally Identifiable Information — data  |
| --- | --- | ------------------------------------------- |
identifying an individual.
| PO  |     | Purchase Order — formal procurement  |
| --- | --- | ------------------------------------ |
document.
| POSH |     | Prevention of Sexual Harassment Act 2013.      |
| ---- | --- | ---------------------------------------------- |
| PRD  |     | Product Requirements Document — feature-level  |
specifications.
| RBAC |     | Role-Based Access Control — permission model  |
| ---- | --- | --------------------------------------------- |
PreOne uses.
| RTE  |     | Right to Education Act 2009.                 |
| ---- | --- | -------------------------------------------- |
| SaaS |     | Software as a Service — multi-tenant hosted  |
software model.
| SLA |     | Service Level Agreement — response/resolution  |
| --- | --- | ---------------------------------------------- |
time commitment.
| SOC2 |     | Service Organization Control 2 — security audit  |
| ---- | --- | ------------------------------------------------ |
framework.
| TDS |     | Tax Deducted at Source — Indian tax withholding  |
| --- | --- | ------------------------------------------------ |
mechanism.
| UUID |     | Universally Unique Identifier — PreOne primary  |
| ---- | --- | ----------------------------------------------- |
key type.
Appendix D — Sign-off Page
ह्या(cid:2) BRC v1.0 document चा(cid:31) Business Freeze approval खा(cid:2)ला(cid:31)ला stakeholders च्ये(cid:2) signature नं(cid:6)(cid:14) रा complete
| हा$ईला. Sign-off प्र(cid:12)+ | (cid:30) झा(cid:2)ल्ये(cid:2)र्वराचा Master PRD phase सरू(cid:27) |  हा$ईला. |
| ----------------------------- | ----------------------------------------------------------------- | -------- |
162

PreOne BRC v1.0  |  Business Rules Catalog
Approval Matrix
| Role         | Name   | Responsibility | Signature | Date         |
| ------------ | ------ | -------------- | --------- | ------------ |
| Product Lead | [Name] | Final product  | [Sign]    | [DD/MM/YYYY] |
ownership +
roadmap
alignment
| Engineering Lead | [Name] | Technical  | [Sign] | [DD/MM/YYYY] |
| ---------------- | ------ | ---------- | ------ | ------------ |
feasibility +
architecture
alignment
| Compliance  | [Name] | DPDP/POSH/  | [Sign] | [DD/MM/YYYY] |
| ----------- | ------ | ----------- | ------ | ------------ |
| Officer     |        | Fire/FSSAI  |        |              |
compliance
validation
| Business Owner | [Name] | Final business  | [Sign] | [DD/MM/YYYY] |
| -------------- | ------ | --------------- | ------ | ------------ |
approval + freeze
authorization
| Operations Head | [Name] | Operational  | [Sign] | [DD/MM/YYYY] |
| --------------- | ------ | ------------ | ------ | ------------ |
feasibility + rule
enforceability
| Academic  | [Name] | Academic +        | [Sign] | [DD/MM/YYYY] |
| --------- | ------ | ----------------- | ------ | ------------ |
| Director  |        | curriculum rules  |        |              |
validation
Document Control
Field Value
Document Title PreOne Business Rules Catalog (BRC)
Version 1.0
Status Draft (Business Review)
Prepared By PreOne Product & Architecture Team
Prepared Date 2026-07-12
Reviewers [Stakeholder list — see Approval Matrix]
Freeze Date [TBD — post-review completion]
Next Review Date [TBD — post-freeze, 6 months from freeze date]
163

PreOne BRC v1.0 | Business Rules Catalog
Field Value
Distribution Internal Engineering + Product + Compliance
Confidentiality Internal — Not for external distribution
ह्या(cid:2) document चा(cid:31) final authority PreOne Product Lead कड(cid:10) आहा(cid:10). क$(cid:12)(cid:6)(cid:2)हा(cid:31) clarification तिक(cid:14)र्व(cid:2) change
request स(cid:2)/(cid:31) product team श(cid:31) सप्र(cid:14) क(cid:30) करा(cid:2)र्व(cid:2). Document freeze झा(cid:2)ल्ये(cid:2)नं(cid:6)(cid:14) रा changes स(cid:2)/(cid:31) formal CR
process (ह्या(cid:2) document च्ये(cid:2) How to Use section मध्ये(cid:10) documented) mandatory आहा(cid:10).
164