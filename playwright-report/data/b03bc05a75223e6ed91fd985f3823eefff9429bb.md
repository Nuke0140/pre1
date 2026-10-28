# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-persona-targeted.spec.ts >> PreOne Dashboard Targeted Browser Verification Suite (Step 6.1) >> Persona: Finance (ACCOUNTS) >> verifies responsive layout & accessibility at 768-tablet-landscape (768x1024)
- Location: tests\e2e\dashboard-persona-targeted.spec.ts:80:13

# Error details

```
Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content":
    - /url: "#main"
  - button "Open PreO Mascot companion" [ref=e2] [cursor=pointer]:
    - 'img "PreO: The Explorer — PreOne Mascot" [ref=e3]'
  - banner [ref=e10]:
    - generic [ref=e11]:
      - link "PreOne OS Home" [ref=e13] [cursor=pointer]:
        - /url: /app/home
      - generic [ref=e18]:
        - button "Open global search (⌘K)" [ref=e19] [cursor=pointer]
        - button "Switch to dark theme" [ref=e23] [cursor=pointer]
        - button "Inbox & Attention" [ref=e27] [cursor=pointer]
        - button "Alerts and Notifications" [ref=e32] [cursor=pointer]
        - button "Open user profile menu" [ref=e38] [cursor=pointer]:
          - generic [aria-hidden] [ref=e39]: AA
          - generic [ref=e40]:
            - generic [ref=e41]: Alexander Accountant
            - generic [ref=e42]: Accounts
  - main [ref=e45]:
    - generic [ref=e47]:
      - generic [ref=e49]:
        - generic [ref=e50]: Finance & Accounts Operations
        - generic [ref=e51]:
          - heading "Fee Management & Collection Center" [level=1] [ref=e52]
          - generic [ref=e53]: All-Time Cumulative View (No Active Academic Session)
        - paragraph [ref=e55]: Authorized institutional fee ledger, collection efficiency tracking, uncommitted drafts, and receivables recovery.
      - generic [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58]:
            - heading "Receivables & Cash Flow Pulse" [level=2] [ref=e59]
            - paragraph [ref=e60]: No active academic session was detected. Showing all tenant records with session-unrestricted scope.
          - generic [ref=e61]: "Role: ACCOUNTS"
        - generic [ref=e63]:
          - generic [ref=e65]:
            - generic [ref=e66]: Active Billed Revenue
            - generic [ref=e72]: ₹0
            - generic [ref=e75]:
              - generic [aria-hidden] [ref=e76]: ●
              - generic [ref=e77]: 0 fully settled
          - generic [ref=e79]:
            - generic [ref=e80]: Cash Collected
            - generic [ref=e86]: ₹0
            - generic [ref=e89]:
              - generic [aria-hidden] [ref=e90]: ●
              - generic [ref=e91]: 0% recovery efficiency
          - generic [ref=e93]:
            - generic [ref=e94]: Overdue Arrears
            - generic [ref=e99]: ₹0
            - generic [ref=e102]:
              - generic [aria-hidden] [ref=e103]: ●
              - generic [ref=e104]: No overdue arrears
          - generic [ref=e106]:
            - generic [ref=e107]: Draft Invoices Pending
            - generic [ref=e113]: "0"
            - generic [ref=e116]:
              - generic [aria-hidden] [ref=e117]: ●
              - generic [ref=e118]: Draft queue clear
      - generic [ref=e119]:
        - generic [ref=e120]: "Finance Actions:"
        - link "Create Invoice" [ref=e121] [cursor=pointer]:
          - /url: /app/finance?action=create-invoice
        - link "Record Offline Payment" [ref=e123] [cursor=pointer]:
          - /url: /app/finance?action=record-payment
        - link "Follow-Up Reminders" [ref=e127] [cursor=pointer]:
          - /url: /app/finance?tab=invoices&filter=overdue
        - link "Full Fee Register" [ref=e131] [cursor=pointer]:
          - /url: /app/finance
      - generic [ref=e135]:
        - generic [ref=e136]:
          - generic [ref=e137]:
            - generic [ref=e138]:
              - generic [ref=e139]: Recent Invoices & Priority Receivables
              - generic [ref=e140]: Active billing accounts and outstanding balances
            - link "All Invoices" [ref=e141] [cursor=pointer]:
              - /url: /app/finance?tab=invoices
          - generic [ref=e145]:
            - heading "No Invoices Issued" [level=3] [ref=e151]
            - paragraph [ref=e152]: No fee invoices found in the institutional records.
        - generic [ref=e153]:
          - generic [ref=e154]:
            - generic [ref=e155]:
              - generic [ref=e156]: Authoritative Collections Log
              - generic [ref=e157]: Cleared transactions deposited into school ledger
            - link "All Receipts" [ref=e158] [cursor=pointer]:
              - /url: /app/finance?tab=payments
          - generic [ref=e162]:
            - heading "No Payments Recorded" [level=3] [ref=e168]
            - paragraph [ref=e169]: No payment receipts recorded in the institutional ledger.
  - contentinfo:
    - navigation "Global navigation dock" [ref=e170]:
      - generic [ref=e171]:
        - generic [ref=e172]:
          - link "Home" [ref=e173] [cursor=pointer]:
            - /url: /app/home
          - link "Dashboard" [ref=e179] [cursor=pointer]:
            - /url: /app/dashboard
            - generic [ref=e180]:
              - img "Dashboard"
        - button "PreOne Start Menu" [ref=e184] [cursor=pointer]
        - generic [ref=e197]:
          - link "Students" [ref=e198] [cursor=pointer]:
            - /url: /app/students
            - generic [ref=e199]:
              - img "Students"
          - link "PreO Learning" [ref=e201] [cursor=pointer]:
            - /url: /app/learning
            - generic [ref=e202]:
              - img "PreO Learning"
          - link "Daily Diary" [ref=e204] [cursor=pointer]:
            - /url: /app/daily-diary
            - generic [ref=e205]:
              - img "Daily Diary"
  - status
```