const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  ShadingType
} = require('docx');
const fs = require('fs');
const path = require('path');

const PRIMARY_COLOR = '1E3A8A'; // Navy Blue
const SECONDARY_COLOR = '0284C7'; // Sky Blue
const ACCENT_TEAL = '0D9488'; // Teal
const TEXT_COLOR = '1F2937'; // Dark Slate
const MUTED_COLOR = '4B5563'; // Gray
const BORDER_COLOR = 'D1D5DB'; // Light Gray
const BG_CALLOUT_INFO = 'F0F9FF'; // Light Sky
const BG_CALLOUT_TIP = 'F0FDF4'; // Light Green
const BG_CALLOUT_WARN = 'FEF3C7'; // Light Amber

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32,
        color: PRIMARY_COLOR,
        font: 'Segoe UI'
      })
    ]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26,
        color: SECONDARY_COLOR,
        font: 'Segoe UI'
      })
    ]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        color: PRIMARY_COLOR,
        font: 'Segoe UI'
      })
    ]
  });
}

function p(text, options = {}) {
  const runs = Array.isArray(text)
    ? text
    : [
        new TextRun({
          text,
          bold: options.bold || false,
          italics: options.italics || false,
          color: options.color || TEXT_COLOR,
          size: options.size || 22,
          font: 'Segoe UI'
        })
      ];

  return new Paragraph({
    spacing: { before: options.spaceBefore || 60, after: options.spaceAfter || 120 },
    alignment: options.alignment || AlignmentType.LEFT,
    children: runs
  });
}

function bullet(boldPrefix, text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60 },
    children: [
      new TextRun({
        text: boldPrefix ? `${boldPrefix}: ` : '',
        bold: true,
        color: PRIMARY_COLOR,
        size: 22,
        font: 'Segoe UI'
      }),
      new TextRun({
        text,
        color: TEXT_COLOR,
        size: 22,
        font: 'Segoe UI'
      })
    ]
  });
}

function step(num, title, description) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [
      new TextRun({
        text: `Step ${num}. `,
        bold: true,
        color: SECONDARY_COLOR,
        size: 22,
        font: 'Segoe UI'
      }),
      new TextRun({
        text: `${title} — `,
        bold: true,
        color: PRIMARY_COLOR,
        size: 22,
        font: 'Segoe UI'
      }),
      new TextRun({
        text: description,
        color: TEXT_COLOR,
        size: 22,
        font: 'Segoe UI'
      })
    ]
  });
}

function callout(title, text, type = 'info') {
  let borderColor = SECONDARY_COLOR;
  let bgColor = BG_CALLOUT_INFO;
  let titleColor = PRIMARY_COLOR;

  if (type === 'tip') {
    borderColor = ACCENT_TEAL;
    bgColor = BG_CALLOUT_TIP;
    titleColor = '065F46';
  } else if (type === 'warning') {
    borderColor = 'D97706';
    bgColor = BG_CALLOUT_WARN;
    titleColor = '92400E';
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: borderColor }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { before: 0, after: 60 },
                children: [
                  new TextRun({
                    text: `📌 ${title.toUpperCase()}`,
                    bold: true,
                    size: 20,
                    color: titleColor,
                    font: 'Segoe UI'
                  })
                ]
              }),
              new Paragraph({
                spacing: { before: 0, after: 0 },
                children: [
                  new TextRun({
                    text,
                    italics: true,
                    size: 21,
                    color: TEXT_COLOR,
                    font: 'Segoe UI'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function imageBlock(filename, caption) {
  const imgPath = path.join(process.cwd(), 'docs', 'manual-screenshots', filename);
  if (!fs.existsSync(imgPath)) {
    return p(`[Screenshot: ${caption} (File ${filename} pending)]`, { italics: true, color: MUTED_COLOR });
  }

  const imgBuffer = fs.readFileSync(imgPath);

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 60 },
      children: [
        new ImageRun({
          data: imgBuffer,
          transformation: { width: 580, height: 362 },
          type: 'png'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 200 },
      children: [
        new TextRun({
          text: `Figure: ${caption}`,
          bold: true,
          italics: true,
          size: 19,
          color: MUTED_COLOR,
          font: 'Segoe UI'
        })
      ]
    })
  ];
}

function table(headers, rows) {
  const headerCells = headers.map(
    h =>
      new TableCell({
        shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: h,
                bold: true,
                size: 20,
                color: 'FFFFFF',
                font: 'Segoe UI'
              })
            ]
          })
        ]
      })
  );

  const bodyRows = rows.map((r, rIdx) => {
    const bg = rIdx % 2 === 0 ? 'F9FAFB' : 'FFFFFF';
    return new TableRow({
      children: r.map(
        c =>
          new TableCell({
            shading: { fill: bg, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: c,
                    size: 20,
                    color: TEXT_COLOR,
                    font: 'Segoe UI'
                  })
                ]
              })
            ]
          })
      )
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: PRIMARY_COLOR },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE }
    },
    rows: [new TableRow({ children: headerCells }), ...bodyRows]
  });
}

async function buildDoc() {
  console.log('Generating PreOne Operations Client User Manual (.docx)...');

  const children = [];

  // =========================================================================
  // COVER PAGE
  // =========================================================================
  children.push(
    new Paragraph({
      spacing: { before: 1200, after: 120 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'PREONE OPERATING SYSTEM',
          bold: true,
          size: 44,
          color: PRIMARY_COLOR,
          font: 'Segoe UI'
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 0, after: 360 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Next-Generation Early Childhood & K-12 School Management Platform',
          size: 26,
          color: SECONDARY_COLOR,
          font: 'Segoe UI'
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 200, after: 600 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'COMPLETE OPERATIONS CLIENT USER MANUAL & STANDARD OPERATING PROCEDURES (SOP)',
          bold: true,
          size: 28,
          color: TEXT_COLOR,
          font: 'Segoe UI'
        })
      ]
    }),
    callout(
      'Target Audience & Usage Scope',
      'This comprehensive operations manual is tailored specifically for School Owners, Center Heads, Principals, Admissions Counselors, Teachers, Caregivers, Accounts Incharges, and Transport Officers. It provides step-by-step operating workflows, high-resolution user interface walkthroughs, security best practices, and daily operating checklists.',
      'tip'
    ),
    new Paragraph({
      spacing: { before: 600, after: 60 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Document Version: 2.4 (Enterprise Edition)  |  Release: October 2026',
          size: 20,
          color: MUTED_COLOR,
          font: 'Segoe UI'
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 0, after: 800 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Compliant with DPDP Act 2023  •  Multi-Tenant & Multi-Branch Architecture',
          bold: true,
          size: 20,
          color: ACCENT_TEAL,
          font: 'Segoe UI'
        })
      ]
    }),
    new Paragraph({ pageBreakBefore: true })
  );

  // =========================================================================
  // SECTION 1: EXECUTIVE OVERVIEW & ARCHITECTURE
  // =========================================================================
  children.push(
    h1('1. Executive Overview & System Architecture'),
    p(
      'PreOne is an all-in-one institutional operating system purpose-built for premium preschools, daycares, kindergarten chains, and K-12 educational institutions. It unifies admissions pipelines, student records, daily routine care logs, parent communication, automated fee collections, classroom allocations, transport tracking, and staff management into a single, cohesive cloud environment.'
    ),
    h2('1.1 Core Architectural Principles'),
    bullet(
      'Zero Data Leakage Multi-Tenancy',
      'Every school institution operates inside a strictly isolated tenant space. Database records, media files, and audit logs are cryptographically bound to the school ID.'
    ),
    bullet(
      'Multi-Branch Campus Scoping',
      'Schools with multiple branches (e.g., Campus East, Campus West) can seamlessly maintain independent class rosters, fee structures, and attendance records while giving group owners consolidated institutional oversight.'
    ),
    bullet(
      'Role-Based Access Control (RBAC)',
      'Granular permission tiers ensure that teachers only access their assigned classroom students, accountants only see financial ledgers, and campus principals cannot view unauthorized neighboring branches.'
    ),
    bullet(
      'DPDP Act 2023 Digital Privacy',
      'Built-in parental consent management, biometric encryption, audit trails for every child record lookup, and one-click data anonymization upon child withdrawal.'
    ),
    callout(
      'Operating System Gating Standard',
      'Every action in PreOne is authenticated via secure session cookies, signed JWTs, and audit-logged in real-time. Sensitive operations like staff password resets, guardian deletions, and bulk fee adjustments require elevated authorization checks.',
      'info'
    )
  );

  // =========================================================================
  // SECTION 2: ACCESS, AUTHENTICATION & SECURITY
  // =========================================================================
  children.push(
    h1('2. Access, Authentication & Security Governance'),
    p(
      'Access to the PreOne Operations Portal is safeguarded by enterprise multi-factor authentication (MFA) to prevent unauthorized entry into sensitive student and financial records.'
    ),
    h2('2.1 Logging into the Portal'),
    step(1, 'Navigate to Portal', 'Open your school portal URL in Google Chrome, Microsoft Edge, or Safari: https://app.preone.in/login (or your custom school domain).'),
    step(2, 'Enter Credentials', 'Enter your registered school email address or system-generated username, followed by your secure password.'),
    step(3, 'Multi-Factor Verification (MFA)', 'For privileged roles (Owner, Principal, Administrator, Accountant), a 6-digit Time-based One-Time Password (OTP) is automatically dispatched to your verified email or mobile phone.'),
    step(4, 'Complete Verification', 'Enter the 6-digit code within 5 minutes. Upon successful verification, you will be redirected to your personalized operational dashboard.'),
    ...imageBlock('01_login_screen.png', 'PreOne Enterprise Sign-In and Authentication Interface'),
    h2('2.2 Password Security & Account Protection'),
    bullet(
      'Password Strength Rule',
      'Passwords must contain at least 8 characters, including 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol.'
    ),
    bullet(
      'Automatic Lockout Protection',
      'Five consecutive failed login attempts automatically lock the user account for 15 minutes to thwart brute-force intrusion attacks.'
    ),
    bullet(
      'Session Inactivity Timeout',
      'User sessions automatically expire after 60 minutes of inactivity. High-security financial operations will prompt for quick password re-confirmation.'
    )
  );

  // =========================================================================
  // SECTION 3: EXECUTIVE DASHBOARD & REAL-TIME KPI HUB
  // =========================================================================
  children.push(
    h1('3. Executive Dashboard & Real-Time KPI Hub'),
    p(
      'The PreOne Dashboard serves as the command center for school administrators and principals. It provides instant visibility into day-to-day operations without requiring manual spreadsheet compilation.'
    ),
    h2('3.1 Dashboard KPI Widgets'),
    bullet('Active Students Enrolled', 'Total active child count across current academic terms, with breakdown by grade (Toddler, Playgroup, Nursery, LKG, UKG).'),
    bullet('Today Attendance Pulse', 'Live percentage of students checked in today, count of absent children, and unverified absences requiring parent follow-up.'),
    bullet('Fee Collection Summary', 'Daily and monthly revenue collected, pending fee dues, upcoming fee installments, and overdue fee accounts.'),
    bullet('Teacher-to-Student Ratio', 'Real-time compliance monitoring ensuring mandatory caregiver-to-child safety ratios (e.g., 1:8 for Playgroup) are met across every active room.'),
    ...imageBlock('02_dashboard_overview.png', 'Executive Dashboard with Live Operational KPIs and Branch Switcher'),
    callout(
      'Branch Switcher Feature',
      'Multi-branch administrators can toggle between different campuses using the top navigation branch selector. When a specific branch is selected, all attendance figures, rosters, and financial totals dynamically filter to that specific campus.',
      'tip'
    )
  );

  // =========================================================================
  // SECTION 4: CENTRAL APP LAUNCHER & PREO AI ASSISTANT
  // =========================================================================
  children.push(
    h1('4. Central App Launcher & Navigation Hub'),
    p(
      'The Central App Launcher (/app/home) provides instant access to every operational module, organized by institutional function. It also features Preo, the intelligent school operations mascot.'
    ),
    h2('4.1 Quick Module Grid'),
    table(
      ['Module Icon', 'Operational Category', 'Primary Operations Handled'],
      [
        ['Admissions', 'Admissions & Inquiries', 'Lead pipeline, tour bookings, online forms, conversions'],
        ['Students', 'Student Information System', 'Student 360 profile, health cards, emergency contacts'],
        ['Classrooms', 'Academic Setup', 'Section rosters, room capacity, teacher assignment'],
        ['Attendance', 'Daily Check-in', 'Student check-in/out, biometric sync, pick-up OTP'],
        ['Daily Diary', 'Early Child Routine', 'Meals, naps, diaper changes, milestone observations'],
        ['Fees & Finance', 'Cashier & Accounts', 'Invoicing, online UPI/card payments, receipts, dues'],
        ['Staff & HR', 'Workforce Management', 'Staff directory, role permissions, leave management'],
        ['Transport', 'Fleet & Bus Routes', 'Bus GPS routes, vehicle safety certificates, stop lists']
      ]
    ),
    ...imageBlock('03_home_portal.png', 'Central App Launcher Grid and Preo Assistant Portal')
  );

  // =========================================================================
  // SECTION 5: ADMISSIONS & STUDENT LEAD PIPELINE
  // =========================================================================
  children.push(
    h1('5. Admissions Pipeline & Lead Management'),
    p(
      'The Admissions Module streamlines parent inquiries from first contact to official enrollment, eliminating lost leads and delayed follow-ups.'
    ),
    h2('5.1 Managing the Admissions Funnel'),
    step(1, 'Log New Inquiry', 'Click "+ New Inquiry". Capture child name, date of birth, grade applied for, parent mobile number, email, and referral source.'),
    step(2, 'Schedule Campus Tour', 'Assign a tour slot. The system automatically sends an SMS confirmation and Google Calendar invite to the parent.'),
    step(3, 'Online Application Submission', 'Share the digital admission link with the parent via WhatsApp or Email for remote form completion.'),
    step(4, 'Document Verification', 'Review uploaded birth certificates, immunization charts, and parent address proofs in the verification drawer.'),
    step(5, 'Offer Admission & Fee Payment', 'Generate the admission fee invoice. Upon payment confirmation, click "Convert to Enrolled Student" to automatically generate the student profile and assign a roll number.'),
    ...imageBlock('04_admissions_pipeline.png', 'Admissions Funnel with Interactive Kanban Pipeline and Lead Tracking'),
    callout(
      'No Lead Left Behind',
      'Use the "Follow-Up Overdue" filter to instantly identify prospective parents who have visited the campus but have not yet completed their application form.',
      'tip'
    )
  );

  // =========================================================================
  // SECTION 6: STUDENT INFORMATION SYSTEM (SIS) & STUDENT 360
  // =========================================================================
  children.push(
    h1('6. Student Information System (SIS) & Student 360'),
    p(
      'The Student Information System centralizes comprehensive academic, demographic, medical, and guardian records for every child in the institution.'
    ),
    h2('6.1 Student 360 Profile Highlights'),
    bullet('Demographic Information', 'Official legal name, preferred nickname, date of birth, gender, blood group, mother tongue, and residential address.'),
    bullet('Guardian & Emergency Links', 'Primary contact phone numbers, secondary guardians, authorized pick-up persons with verified photo IDs.'),
    bullet('Medical & Allergy Registry', 'Critical allergy alerts (e.g., Peanuts, Dairy, Egg), dietary restrictions (Vegetarian, Vegan, Halal), ongoing medications, and pediatrician emergency contacts.'),
    bullet('Document Repository', 'Digitally archived birth certificates, Aadhaar cards, medical immunization certificates, and previous school transfer certificates.'),
    ...imageBlock('05_students_directory.png', 'Student Directory with Search Filters, Grade Tabs, and Student 360 Drawer'),
    callout(
      'Allergy Badge Warning',
      'Whenever a student has a registered severe allergy, a bright red "Medical Alert" pill appears beside their name in the classroom roster and daily diary, ensuring caregiver vigilance.',
      'warning'
    )
  );

  // =========================================================================
  // SECTION 7: CLASSROOM & SECTION MANAGEMENT
  // =========================================================================
  children.push(
    h1('7. Classroom & Section Allocation'),
    p(
      'Classrooms configure physical rooms, target age cohorts, maximum seat capacities, and assigned teaching staff.'
    ),
    h2('7.1 Managing Classrooms & Rosters'),
    step(1, 'Create Classroom Section', 'Navigate to Classrooms -> "+ New Classroom". Define grade (e.g., Nursery), section (e.g., Bluebells), and room capacity (e.g., 20 students).'),
    step(2, 'Assign Teaching Staff', 'Select the Lead Class Teacher and Assistant Teacher/Caregiver from the staff dropdown.'),
    step(3, 'Allocate Enrolled Students', 'Assign enrolled students to the section. PreOne automatically checks maximum room capacity and warns if the statutory teacher-to-child ratio is exceeded.'),
    step(4, 'Export Class Roster', 'Print or export official attendance sheets, name tags, and cubby labels with a single click.'),
    ...imageBlock('06_classrooms.png', 'Classroom Allocation, Room Capacity Gauges, and Teacher Assignment')
  );

  // =========================================================================
  // SECTION 8: ATTENDANCE & PICK-UP SECURITY
  // =========================================================================
  children.push(
    h1('8. Real-Time Attendance & Child Pick-up Security'),
    p(
      'Child safety is the highest priority. The Attendance Module provides rapid check-in during morning drop-off and cryptographic verification during evening pick-up.'
    ),
    h2('8.1 Morning Drop-off Workflow'),
    step(1, 'Open Attendance Tracker', 'Teachers or front desk staff open /app/attendance on their tablet or desktop.'),
    step(2, 'One-Tap Mark Present', 'Tap on the child photo or card to toggle status: Present, Absent, Late, or Excused.'),
    step(3, 'Health Check-in Note', 'Record child temperature or visible health notes (e.g., mild runny nose) during handover.'),
    step(4, 'Automated Absence Alerts', 'At 9:30 AM, click "Send Absence Broadcast" to instantly notify parents of unexcused absences via WhatsApp/SMS.'),
    h2('8.2 Safe Child Handover SOP'),
    bullet('Authorized Pick-up Verification', 'Only individuals registered in the Student 360 profile with verified photo IDs may pick up a child.'),
    bullet('One-Time Pick-up OTP', 'If an emergency alternate relative arrives, the parent generates a 4-digit Pick-up OTP in their mobile app, which the school staff verifies before child release.'),
    ...imageBlock('07_attendance_tracker.png', 'Real-Time Attendance Register with Drop-off Notes and Photo Verification')
  );

  // =========================================================================
  // SECTION 9: DAILY DIARY & PARENT ENGAGEMENT
  // =========================================================================
  children.push(
    h1('9. Daily Routine Diary & Child Activity Logging'),
    p(
      'For preschool and daycare operations, the Daily Diary is the core parent communication bridge. It records routine care events and milestone learning moments throughout the day.'
    ),
    h2('9.1 Logging Daily Routine Events'),
    bullet('Meals & Nutrition', 'Log meal intake: Breakfast, Morning Fruit, Lunch, Afternoon Snack. Record consumption levels (All, Most, Half, None) and fluid hydration.'),
    bullet('Nap Time Tracker', 'Record start and wake-up times (e.g., 1:00 PM to 2:30 PM) and quality of sleep (Sound, Restless).'),
    bullet('Potty & Hygiene Checks', 'Record diaper change times (Dry, Wet, Soiled) or potty training attempts to keep parents informed of developmental milestones.'),
    bullet('Learning Activities & Mood', 'Tag developmental learning activities (Sensory Exploration, Phonics, Fine Motor Play) and child emotional state (Happy, Energetic, Calm).'),
    bullet('Instant Photo Moments', 'Upload photos of the child engaged in school activities directly to the parent mobile feed with end-to-end privacy encryption.'),
    ...imageBlock('08_daily_diary.png', 'Daily Diary Logging Interface for Meals, Naps, Diapers, and Photo Moments'),
    callout(
      'Batch Logging Capability',
      'Teachers can select multiple children simultaneously to log shared group activities (e.g., Circle Time or Outdoor Play) in seconds, saving up to 45 minutes of teacher paperwork every day.',
      'tip'
    )
  );

  // =========================================================================
  // SECTION 10: FEE MANAGEMENT, BILLING & ACCOUNTING
  // =========================================================================
  children.push(
    h1('10. Fee Billing, Invoices & Receipt Generation'),
    p(
      'PreOne provides automated fee collection and reconciliation, supporting term fees, day-care hourly plans, transport charges, and uniform/book packages.'
    ),
    h2('10.1 Fee Collection Workflow'),
    step(1, 'Generate Term Invoices', 'Select academic term and grade. Click "Generate Invoices". PreOne computes tuition, meal charges, and transport based on each child selected options.'),
    step(2, 'Record Payment', 'When a parent pays, click "Record Payment". Choose payment mode: UPI / QR Code, Cash, Credit/Debit Card, Netbanking, or Cheque.'),
    step(3, 'Instant Receipt Delivery', 'The system immediately generates a GST-compliant digital receipt with QR verification, sending an automatic copy to the parent WhatsApp number and email.'),
    step(4, 'Track Overdue Accounts', 'Filter by "Overdue Dues". Click "Send Reminder" to deliver polite, automated payment reminder notifications with direct payment links.'),
    ...imageBlock('09_fees_billing.png', 'Fee Billing Dashboard, Invoice Register, and Payment Collection Modal')
  );

  // =========================================================================
  // SECTION 11: USER ROLES, PERMISSIONS & DATA PRIVACY
  // =========================================================================
  children.push(
    h1('11. User Management, Role Capabilities & Security Governance'),
    p(
      'PreOne enforces strict role-based separation of duties to protect sensitive institutional records and comply with India Digital Personal Data Protection (DPDP) Act 2023.'
    ),
    h2('11.1 Standard PreOne Role Capabilities'),
    table(
      ['Role Name', 'Branch Scope', 'Permitted Capabilities & Data Access'],
      [
        ['School Owner', 'All Campuses', 'Full administrative control, multi-campus financial ledgers, audit logs, staff hiring'],
        ['Principal', 'Assigned Campus', 'Campus academic oversight, student admissions, teacher evaluations, daily attendance'],
        ['Classroom Teacher', 'Assigned Room', 'Classroom roster view, daily diary logging, attendance marking, student health alerts'],
        ['Accountant', 'Assigned Branch', 'Fee collection, invoice generation, bank reconciliation, expense vouchers'],
        ['Transport Incharge', 'Assigned Branch', 'Bus fleet records, driver background checks, GPS route assignment'],
        ['Parent / Guardian', 'Own Children Only', 'Child daily diary, attendance history, fee receipts, pick-up OTP generation']
      ]
    ),
    h2('11.2 Primary Contact Guard & Deletion Safety'),
    bullet(
      'Atomic Guardian Reassignment',
      'If a primary guardian is deleted or archived, PreOne strictly prohibits orphan child records. The administrator must designate an active alternate guardian to receive primary contact responsibilities before deletion proceeds.'
    ),
    bullet(
      'DPDP Anonymization Request',
      'When a child leaves the institution, the school can execute a verified anonymization request. Personal identifiers are irreversibly masked while preserving required audit and tax accounting records.'
    ),
    ...imageBlock('10_users_roles.png', 'User Management, Role Permission Matrix, and Branch Assignment Drawer')
  );

  // =========================================================================
  // SECTION 12: TRANSPORT & FLEET MANAGEMENT
  // =========================================================================
  children.push(
    h1('12. School Transport & Vehicle Fleet Management'),
    p(
      'The Transport Module ensures student transit safety by monitoring vehicles, drivers, route schedules, and designated pick-up and drop-off points.'
    ),
    h2('12.1 Transport Management Workflows'),
    step(1, 'Vehicle Compliance Registry', 'Register school buses, vans, and contracted vehicles. Track mandatory documents: Vehicle Insurance, Fitness Certificate, Road Permit, and PUC expiry dates.'),
    step(2, 'Driver & Attendant Vetting', 'Log driver commercial license numbers, police verification certificates, and contact details.'),
    step(3, 'Route & Stop Definition', 'Create morning pick-up and afternoon drop-off routes with ordered stop coordinates and estimated arrival times.'),
    step(4, 'Student Transit Allocation', 'Map enrolled students to specific bus routes and stops. Caregivers receive instant transit manifests for student boarding verification.'),
    ...imageBlock('11_transport_fleet.png', 'Transport Fleet Directory, Route Maps, and Vehicle Compliance Tracking')
  );

  // =========================================================================
  // SECTION 13: INVENTORY & ASSET TRACKER
  // =========================================================================
  children.push(
    h1('13. School Inventory & Asset Management'),
    p(
      'Manage school stock, classroom supplies, branded uniforms, workbooks, sensory play kits, and administrative equipment in one place.'
    ),
    h2('13.1 Inventory Operations'),
    bullet('Stock Tracking', 'Monitor current on-hand quantities of school uniforms, activity workbooks, stationary kits, and hygiene supplies.'),
    bullet('Low-Stock Threshold Alerts', 'Automated system notifications when essential consumables (e.g., sanitizers, diapers, art supplies) fall below defined safety thresholds.'),
    bullet('Classroom Supply Distribution', 'Log asset issuance to specific teachers or classrooms, tracking annual equipment lifecycle and wear-and-tear.'),
    ...imageBlock('12_inventory_management.png', 'School Inventory and Asset Stock Management Dashboard')
  );

  // =========================================================================
  // SECTION 14: ONBOARDING & SYSTEM CONFIGURATION
  // =========================================================================
  children.push(
    h1('14. School Setup Wizard & System Configuration'),
    p(
      'Configure institutional branding, academic sessions, holiday calendars, grade levels, and communication templates.'
    ),
    h2('14.1 Key Configuration Milestones'),
    step(1, 'Institution Identity', 'Upload high-resolution school logo, address, contact numbers, and affiliated educational board (e.g., Early Childhood Association, CBSE, ICSE, Cambridge).'),
    step(2, 'Academic Calendar', 'Define academic terms (Term 1, Term 2, Summer Camp), working hours, weekend schedules, and national holidays.'),
    step(3, 'Communication Templates', 'Customize official SMS, WhatsApp, and Email message templates with dynamic placeholders ({childName}, {amountDue}, {date}).'),
    step(4, 'Custom Data Fields', 'Create custom attributes (e.g., Food Habits, Bus Stop Landmark, Parent Profession) tailored to your school admissions criteria.'),
    ...imageBlock('13_school_setup.png', 'School Onboarding Wizard and System Configuration Center')
  );

  // =========================================================================
  // SECTION 15: DAILY OPERATING CHECKLISTS (SOP)
  // =========================================================================
  children.push(
    h1('15. Daily Standard Operating Procedures (SOP) & Checklists'),
    p(
      'To ensure seamless institutional execution, school operation teams should follow these structured daily checklists.'
    ),
    h2('15.1 Morning Opening Checklist (7:30 AM – 9:30 AM)'),
    table(
      ['Time Window', 'Responsible Role', 'Action Item', 'System Verification'],
      [
        ['7:30 AM', 'Transport Incharge', 'Confirm driver attendance & vehicle readiness', 'Check Transport Dashboard'],
        ['8:00 AM', 'Front Desk Admin', 'Log into PreOne portal & check visitor logs', 'Review Dashboard Alerts'],
        ['8:30 AM', 'Classroom Teachers', 'Conduct morning greeting & mark child attendance', 'Attendance Register (/app/attendance)'],
        ['9:00 AM', 'Classroom Teachers', 'Record morning temperature / health triage notes', 'Student 360 Health Notes'],
        ['9:30 AM', 'Center Head', 'Trigger unverified absence broadcast to parents', 'Click "Send Absence SMS"']
      ]
    ),
    h2('15.2 Mid-Day Routine Care Checklist (11:30 AM – 2:30 PM)'),
    table(
      ['Time Window', 'Responsible Role', 'Action Item', 'System Verification'],
      [
        ['11:30 AM', 'Caregivers / Teachers', 'Log morning fruit & snack intake', 'Daily Diary (/app/daily-diary)'],
        ['12:30 PM', 'Caregivers / Teachers', 'Log lunch meal consumption & hydration', 'Daily Diary - Meals Section'],
        ['1:00 PM', 'Caregivers / Teachers', 'Log afternoon nap start time', 'Daily Diary - Nap Tracker'],
        ['2:00 PM', 'Caregivers / Teachers', 'Log wake-up time, mood & potty/diaper check', 'Daily Diary - Hygiene & Mood'],
        ['2:30 PM', 'Lead Teachers', 'Publish daily photos & learning activity highlights', 'Upload Photo Moments']
      ]
    ),
    h2('15.3 Evening Closing & Handover Checklist (3:30 PM – 6:30 PM)'),
    table(
      ['Time Window', 'Responsible Role', 'Action Item', 'System Verification'],
      [
        ['3:30 PM', 'Front Desk / Gate Staff', 'Verify pick-up guardian identity / Pick-up OTP', 'Attendance Pick-up Check'],
        ['4:30 PM', 'Transport Incharge', 'Verify evening bus boarding & student manifest', 'Transport Route Manifest'],
        ['5:30 PM', 'Accountant', 'Reconcile daily fee collections (Cash & UPI)', 'Finance Cash Register'],
        ['6:00 PM', 'Center Head', 'Verify all students checked out safely', 'Ensure zero "Still Checked In" children'],
        ['6:30 PM', 'Administrator', 'Secure log out of all workstation sessions', 'Logout & Lock Terminal']
      ]
    )
  );

  // =========================================================================
  // SECTION 16: TROUBLESHOOTING & SUPPORT ESCALATION
  // =========================================================================
  children.push(
    h1('16. Troubleshooting & Support Escalation Matrix'),
    p(
      'When technical or operational issues arise, follow this standardized resolution matrix.'
    ),
    table(
      ['Issue Category', 'Observed Symptom', 'Immediate Self-Service Fix', 'Escalation Level'],
      [
        ['Login Failure', '"Invalid credentials" or "Account Locked"', 'Use "Forgot Password" or wait 15 mins for auto-unlock', 'School Admin / Level 1'],
        ['OTP Not Received', '6-digit MFA OTP email delayed', 'Check Spam folder; click "Resend Code" after 45s cooldown', 'School Admin / Level 1'],
        ['Branch Access Denied', 'HTTP 403 Forbidden on foreign branch', 'Principal is restricted to assigned campus by design', 'School Owner (to grant multi-branch)'],
        ['Receipt Print Failure', 'Receipt PDF blank or formatting error', 'Verify browser pop-up blocker is disabled; re-generate', 'PreOne Tech Support / Level 2'],
        ['Primary Contact Error', 'Cannot delete guardian record', 'Assign an alternate primary contact before deleting sole guardian', 'Admissions / Level 1 SOP']
      ]
    ),
    callout(
      'PreOne Dedicated Customer Support',
      'For mission-critical technical assistance, database restore requests, or hardware biometric integrations, contact PreOne Enterprise Support: Email: support@preone.in  |  Helpline: +91 (800) PRE-ONE-HELP  |  Web: https://support.preone.in',
      'info'
    )
  );

  // =========================================================================
  // DOCUMENT CONSTRUCTION
  // =========================================================================
  const doc = new Document({
    creator: 'PreOne Product Operations Engineering',
    title: 'PreOne Operations Client User Manual',
    description: 'Comprehensive Product User Manual and Standard Operating Procedures for PreOne School Operating System',
    styles: {
      default: {
        document: {
          run: {
            font: 'Segoe UI',
            size: 22,
            color: TEXT_COLOR
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1200,
              right: 1200
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'PreOne School OS — Operations Client User Manual (v2.4)',
                    size: 18,
                    color: MUTED_COLOR,
                    font: 'Segoe UI'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 18,
                    color: MUTED_COLOR,
                    font: 'Segoe UI'
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: MUTED_COLOR,
                    font: 'Segoe UI'
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 18,
                    color: MUTED_COLOR,
                    font: 'Segoe UI'
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: MUTED_COLOR,
                    font: 'Segoe UI'
                  })
                ]
              })
            ]
          })
        },
        children
      }
    ]
  });

  const outFilePath = path.join(process.cwd(), 'docs', 'PreOne_Operations_Client_User_Manual.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outFilePath, buffer);
  console.log(`Manual successfully generated at: ${outFilePath} (Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

buildDoc().catch(err => {
  console.error('Failed to build user manual:', err);
  process.exit(1);
});
