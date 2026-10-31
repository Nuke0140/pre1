# PreOne School Operating System — Operations Client User Manual & SOP (v2.4)

> **Document Type:** Institutional Operations Manual & Standard Operating Procedures (SOP)  
> **Release:** Enterprise Edition (October 2026)  
> **Word Document (`.docx`) Location:** [`docs/PreOne_Operations_Client_User_Manual.docx`](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/PreOne_Operations_Client_User_Manual.docx)  
> **High-Resolution Screenshots Directory:** [`docs/manual-screenshots/`](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/)

---

## Table of Contents

1. [Executive Overview & System Architecture](#1-executive-overview--system-architecture)
2. [Access, Authentication & Security Governance](#2-access-authentication--security-governance)
3. [Executive Dashboard & Real-Time KPI Hub](#3-executive-dashboard--real-time-kpi-hub)
4. [Central App Launcher & Preo AI Assistant](#4-central-app-launcher--preo-ai-assistant)
5. [Admissions Pipeline & Student Lead Management](#5-admissions-pipeline--student-lead-management)
6. [Student Information System (SIS) & Student 360](#6-student-information-system-sis--student-360)
7. [Classroom & Section Management](#7-classroom--section-management)
8. [Real-Time Attendance & Child Pick-up Security](#8-real-time-attendance--child-pick-up-security)
9. [Daily Routine Diary & Child Activity Logging](#9-daily-routine-diary--child-activity-logging)
10. [Fee Billing, Invoices & Receipt Generation](#10-fee-billing-invoices--receipt-generation)
11. [User Management, Role Capabilities & Security Governance](#11-user-management-role-capabilities--security-governance)
12. [School Transport & Vehicle Fleet Management](#12-school-transport--vehicle-fleet-management)
13. [School Inventory & Asset Management](#13-school-inventory--asset-management)
14. [School Setup Wizard & System Configuration](#14-school-setup-wizard--system-configuration)
15. [Daily Standard Operating Procedures (SOP) & Checklists](#15-daily-standard-operating-procedures-sop--checklists)
16. [Troubleshooting & Support Escalation Matrix](#16-troubleshooting--support-escalation-matrix)

---

## 1. Executive Overview & System Architecture

PreOne is an all-in-one institutional operating system purpose-built for premium preschools, daycares, kindergarten chains, and K-12 educational institutions. It unifies admissions pipelines, student records, daily routine care logs, parent communication, automated fee collections, classroom allocations, transport tracking, and staff management into a single, cohesive cloud environment.

### Core Architectural Principles
- **Zero Data Leakage Multi-Tenancy:** Complete tenant isolation. Database records, media files, and audit logs are cryptographically bound to the school ID.
- **Multi-Branch Campus Scoping:** Independent class rosters, fee structures, and attendance records per branch with consolidated group-level owner oversight.
- **Role-Based Access Control (RBAC):** Strict permission boundaries between Owner, Principal, Teachers, Accountants, and Parents.
- **DPDP Act 2023 Digital Privacy:** Built-in parental consent management, biometric encryption, and one-click data anonymization upon child withdrawal.

---

## 2. Access, Authentication & Security Governance

Access to the PreOne Operations Portal is safeguarded by enterprise multi-factor authentication (MFA).

### 2.1 Logging into the Portal
1. **Navigate to Portal:** Open your school portal URL (`https://app.preone.in/login` or local instance `http://localhost:3000/login`).
2. **Enter Credentials:** Enter your registered school email address or username, followed by your secure password.
3. **Multi-Factor Verification (MFA):** For privileged roles (Owner, Principal, Administrator, Accountant), a 6-digit Time-based One-Time Password (OTP) is automatically dispatched to your verified email or mobile phone.
4. **Complete Verification:** Enter the 6-digit code within 5 minutes to access your personalized operational dashboard.

![PreOne Sign-In and Authentication Interface](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/01_login_screen.png)
*Figure 2.1: PreOne Enterprise Sign-In and Authentication Interface*

---

## 3. Executive Dashboard & Real-Time KPI Hub

The PreOne Dashboard serves as the command center for school administrators and principals.

### Key Operational Widgets
- **Active Students Enrolled:** Live count breakdown by grade (Toddler, Playgroup, Nursery, LKG, UKG).
- **Today's Attendance Pulse:** Live percentage of students checked in today, absent count, and unexcused absence follow-ups.
- **Fee Collection Summary:** Daily and monthly revenue collected, pending fee dues, and overdue fee accounts.
- **Teacher-to-Student Ratio:** Real-time compliance monitoring ensuring mandatory caregiver-to-child safety ratios.

![Executive Dashboard](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/02_dashboard_overview.png)
*Figure 3.1: Executive Dashboard with Live Operational KPIs and Branch Switcher*

---

## 4. Central App Launcher & Preo AI Assistant

The Central App Launcher (`/app/home`) provides instant access to every operational module, organized by institutional function.

![Central App Launcher Grid](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/03_home_portal.png)
*Figure 4.1: Central App Launcher Grid and Preo Assistant Portal*

---

## 5. Admissions Pipeline & Student Lead Management

The Admissions Module streamlines parent inquiries from first contact to official enrollment.

### Step-by-Step Lead Progression
1. **Log New Inquiry:** Capture child name, date of birth, grade applied for, parent mobile number, email, and referral source.
2. **Schedule Campus Tour:** Assign a tour slot with automated SMS confirmation and calendar invites.
3. **Online Application Submission:** Share the digital admission link with the parent via WhatsApp or Email.
4. **Document Verification:** Review uploaded birth certificates, immunization charts, and parent address proofs.
5. **Offer Admission & Fee Payment:** Generate the admission fee invoice and convert to an enrolled student.

![Admissions Pipeline](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/04_admissions_pipeline.png)
*Figure 5.1: Admissions Funnel with Interactive Kanban Pipeline and Lead Tracking*

---

## 6. Student Information System (SIS) & Student 360

Centralizes academic, demographic, medical, and guardian records for every child.

### Student 360 Profile Highlights
- **Demographic Information:** Official legal name, preferred nickname, date of birth, gender, blood group, mother tongue.
- **Guardian & Emergency Links:** Primary contact phone numbers, secondary guardians, authorized pick-up persons.
- **Medical & Allergy Registry:** Critical allergy alerts (Peanuts, Dairy, Egg), dietary restrictions, and emergency pediatric contacts.
- **Document Repository:** Digitally archived birth certificates, Aadhaar cards, and immunization records.

![Student Directory](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/05_students_directory.png)
*Figure 6.1: Student Directory with Search Filters, Grade Tabs, and Student 360 Drawer*

---

## 7. Classroom & Section Management

Configures physical rooms, target age cohorts, maximum seat capacities, and assigned teaching staff.

![Classroom Allocation](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/06_classrooms.png)
*Figure 7.1: Classroom Allocation, Room Capacity Gauges, and Teacher Assignment*

---

## 8. Real-Time Attendance & Child Pick-up Security

Provides rapid check-in during morning drop-off and cryptographic verification during evening pick-up.

### Safe Child Handover SOP
- **Authorized Pick-up Verification:** Only individuals registered in the Student 360 profile with verified photo IDs may pick up a child.
- **One-Time Pick-up OTP:** Parents generate a 4-digit Pick-up OTP in their mobile app for emergency alternate relatives.

![Real-Time Attendance](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/07_attendance_tracker.png)
*Figure 8.1: Real-Time Attendance Register with Drop-off Notes and Photo Verification*

---

## 9. Daily Routine Diary & Child Activity Logging

For preschool and daycare operations, the Daily Diary records routine care events and milestone learning moments throughout the day.

### Routine Events Logged
- **Meals & Nutrition:** Breakfast, Fruit Snack, Lunch, Afternoon Milk with consumption metrics (All, Most, Half, None).
- **Nap Time:** Sleep duration and quality of sleep.
- **Potty & Hygiene Checks:** Diaper change times (Dry, Wet, Soiled) and potty training updates.
- **Milestones & Photos:** Tagged early learning milestones and high-resolution photo moments sent directly to parents.

![Daily Routine Diary](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/08_daily_diary.png)
*Figure 9.1: Daily Diary Logging Interface for Meals, Naps, Diapers, and Photo Moments*

---

## 10. Fee Billing, Invoices & Receipt Generation

Automated fee collection, multi-head invoicing, online payments, and GST-compliant receipts.

![Fee Billing](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/09_fees_billing.png)
*Figure 10.1: Fee Billing Dashboard, Invoice Register, and Payment Collection Modal*

---

## 11. User Management, Role Capabilities & Security Governance

Enforces role-based separation of duties, primary contact protection during guardian deletion, and multi-branch scoping.

![User Management](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/10_users_roles.png)
*Figure 11.1: User Management, Role Permission Matrix, and Branch Assignment Drawer*

---

## 12. School Transport & Vehicle Fleet Management

Monitors school buses, vans, drivers, route schedules, and student pick/drop stops.

![School Transport](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/11_transport_fleet.png)
*Figure 12.1: Transport Fleet Directory, Route Maps, and Vehicle Compliance Tracking*

---

## 13. School Inventory & Asset Management

Tracks uniforms, books, stationery, classroom sensory play kits, and hygiene stock.

![Inventory Tracker](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/12_inventory_management.png)
*Figure 13.1: School Inventory and Asset Stock Management Dashboard*

---

## 14. School Setup Wizard & System Configuration

Configures institutional branding, academic sessions, holiday calendars, grade levels, and communication templates.

![School Setup](file:///c:/Users/Nuke/Documents/GitHub/pre-one/docs/manual-screenshots/13_school_setup.png)
*Figure 14.1: School Onboarding Wizard and System Configuration Center*

---

## 15. Daily Standard Operating Procedures (SOP) & Checklists

### Morning Opening Checklist (7:30 AM – 9:30 AM)
- `07:30 AM` Transport incharge confirms driver attendance & vehicle readiness.
- `08:00 AM` Front desk admin logs in & checks dashboard alerts.
- `08:30 AM` Teachers conduct morning greeting & mark child attendance in `/app/attendance`.
- `09:00 AM` Caregivers record morning temperature & health notes in Student 360.
- `09:30 AM` Center head triggers unverified absence broadcast via WhatsApp/SMS.

### Mid-Day Routine Care Checklist (11:30 AM – 2:30 PM)
- `11:30 AM` Caregivers log morning fruit & snack intake in `/app/daily-diary`.
- `12:30 PM` Caregivers log lunch meal consumption & hydration levels.
- `01:00 PM` Caregivers log afternoon nap start time.
- `02:00 PM` Caregivers log wake-up time, child mood & potty/diaper check.
- `02:30 PM` Lead teachers upload daily photo moments and milestone highlights.

### Evening Closing & Handover Checklist (3:30 PM – 6:30 PM)
- `03:30 PM` Gate staff verifies pick-up guardian identity or 4-digit Pick-up OTP.
- `04:30 PM` Transport incharge verifies bus boarding against manifest.
- `05:30 PM` Accountant reconciles daily cash & UPI fee collections.
- `06:00 PM` Center head verifies zero students remain checked-in.
- `06:30 PM` Administrative staff safely log out and lock terminals.

---

## 16. Troubleshooting & Support Escalation Matrix

| Issue Category | Observed Symptom | Immediate Self-Service Fix | Escalation Level |
| :--- | :--- | :--- | :--- |
| **Login Failure** | *"Invalid credentials"* or *"Account Locked"* | Use "Forgot Password" or wait 15 mins for auto-unlock | Level 1: School Admin |
| **OTP Not Received** | 6-digit MFA OTP email delayed | Check Spam; click "Resend Code" after 45s cooldown | Level 1: School Admin |
| **Branch Denied** | HTTP 403 Forbidden on foreign branch | Principal is restricted to assigned campus by design | Level 2: School Owner |
| **Receipt Print** | Receipt PDF blank or formatting error | Verify browser pop-up blocker is disabled; re-generate | Level 2: PreOne Tech Support |
| **Guardian Deletion** | Cannot delete guardian record | Assign an alternate primary contact before deleting sole guardian | Level 1: Admissions SOP |

---
*© 2026 PreOne Operating System. All Rights Reserved. Confidential & Proprietary.*
