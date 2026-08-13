# 📝 PRD: BC Savings Group Manager (React + Vite)

## 1. Project Overview

- **App Name**: BC Manager Dashboard
- **Core Function**: A digital ledger and automated calculator for a peer-to-peer savings group (Chit Fund / BC model) manager.
- **Architecture**: A client-side React single-page application (SPA) that uses a Google Sheet as its backend database via a simple REST API wrapper (e.g., SheetDB or Stein).

## 2. Tech Stack & Tools

- **Frontend Framework**: React + Vite
- **Styling**: Tailwind CSS (use standard utility classes, no custom CSS files)
- **Icons**: Lucide React
- **State Management**: React Context (for global pool/settings state)
- **Database**: Google Sheets (via fetch requests to API wrapper)

## 3. Data Architecture (Google Sheets Schema)

The agent must design the app to read/write to three specific tabs in a Google Sheet.

### Tab 1: Members
- `id` (string/uuid)
- `name` (string)
- `phone` (string)
- `monthly_commitment` (number - e.g., 2000, 4000)
- `total_paid_to_date` (number)

### Tab 2: Transactions
- `id` (string/uuid)
- `date` (ISO timestamp)
- `member_id` (string)
- `type` (enum: `deposit`, `loan_disbursement`, `interest_payment`, `penalty`)
- `amount` (number)

### Tab 3: Settings
- `key` (string)
- `value` (number)

#### Expected Rows:
| key | value |
| :--- | :--- |
| `interest_rate_percent` | 2 |
| `default_late_fee` | 500 |

## 4. UI/UX Design System

- **Color Palette**: Clean financial dashboard aesthetic. Deep greens for positive balances, neutral grays for backgrounds, red strictly reserved for penalties or late alerts.
- **Typography & Layout**: Minimalist and data-heavy. Prioritize table readability. Ensure directional flows (like loan disbursement steps) are centered and visually obvious. Do not use floating visual elements without clear targets.
- **Mobile-First**: The manager will likely use this on a phone/tablet while collecting cash.

## 5. Core Views & Logic Requirements

### View A: Main Dashboard (The Control Center)
- **Top Metric Cards**:
  1. **Total Pool This Month**: Sum of deposit transactions for current month.
  2. **Total Active Loans**: Sum of `loan_disbursement` minus principal repayments.
  3. **Interest & Penalty Fund**: Sum of `interest_payment` + `penalty` transactions.
- **Member Checklist List**: A scrollable list of all members mapped from the Members tab. Each row must have a quick-action `[ Mark Paid ]` button and a `[ Mark Late ]` button.

### View B: Loan & Bidding Calculator
- **Action**: Manager selects a member requesting a loan.
- **Input**: Loan Amount.
- **Automated Math**: App must fetch `interest_rate_percent` from Settings tab. Calculate monthly interest dynamically: `(Loan Amount * (Interest Rate / 100))`.
- **Output**: Show the generated repayment schedule on screen and push the `loan_disbursement` transaction to the Sheet.

### View C: Transaction Ledger (History)
- A simple, filterable table displaying the Transactions tab data.
- Must allow filtering by the last 3 months.

### View D: Settings Modal
- A modal with input fields mapped to the Settings tab.
- Allows the manager to update the `interest_rate_percent` and `default_late_fee` directly from the UI.

## 6. Execution Plan for AI Agent

Agent Instructions: Please execute this build in the following strict phases. Do not move to the next phase until the current one is verified.

- **Phase 1: Project Setup**: Initialize the Vite + React app, configure Tailwind CSS, and set up the folder structure (`/components`, `/hooks`, `/services`).
- **Phase 2: API Service Layer**: Create a `googleSheets.js` service file with dummy fetch functions (GET/POST) that mock the expected data structures for Members, Transactions, and Settings.
- **Phase 3: State & Context**: Wrap the app in a Context Provider that loads the Settings and Member data on initial mount.
- **Phase 4: Component Assembly**: Build the UI components using Tailwind and dummy data. Ensure the Dashboard, Checklist, and Ledger match the styling guidelines.
- **Phase 5: Business Logic Wiring**: Connect the UI buttons (Mark Paid, Issue Loan) to the mock API service, ensuring the math for 2% interest and total pool calculations works perfectly in the console logs.