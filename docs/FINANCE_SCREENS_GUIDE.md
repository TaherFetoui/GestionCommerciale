# Finance Module - Screens Detailed Guide

## ✅ Completed Functional Screens (3/10)

### 1. Supplier Returns Screen (Retenues Fournisseurs)
**Purpose:** Manage supplier tax withholdings/retentions required by law

**Features:**
- **Full CRUD Operations:**
  - ✅ Create new supplier retention records
  - ✅ View all retentions in table format
  - ✅ Edit retention details
  - ✅ Delete retention records

- **Search & Filters:**
  - Search by supplier name or invoice number
  - Filter by status (pending/received/cancelled)

- **Form Fields:**
  - Supplier selection (dropdown from `suppliers` table)
  - Invoice number (text)
  - Invoice amount (decimal, TND)
  - Retention rate (default 1.5%)
  - Auto-calculated retention amount
  - Retention date
  - Status (pending/received/cancelled)
  - Optional notes

- **Business Logic:**
  - Automatic calculation: `retention_amount = invoice_amount × retention_rate / 100`
  - Status workflow: Pending → Received or Cancelled
  - Connected to Supabase `supplier_returns` table
  - RLS policies for security

**How It Works:**
1. User clicks "Nouvelle retenue" button
2. Modal opens with form
3. User selects supplier and enters invoice details
4. System auto-calculates retention amount
5. User saves → Record created in database
6. Table refreshes showing new retention
7. User can edit/delete using action buttons

---

### 2. Client Returns Screen (Retenues Clients)
**Purpose:** Manage client tax withholdings when issuing invoices

**Features:**
- **Full CRUD Operations:** ✅ Complete
- **Search:** Client name, invoice number
- **Filters:** Status-based (pending/received/cancelled)

**Form Fields:**
- Client selection
- Invoice number reference
- Invoice amount (TND)
- Retention rate (1.5% default)
- Auto-calculated retention amount
- Retention date
- Status management
- Notes

**Business Logic:**
- Same calculation as supplier returns
- Tracks receivables from client withholdings
- Connected to `client_returns` table

**Usage Workflow:**
1. Create invoice for client
2. If withholding applies (1.5%), create retention record
3. Track status until received
4. Generate reports on pending/received retentions

---

### 3. Bank Accounts Screen (Agences Bancaires et Caisses) ✅ NEW
**Purpose:** Manage all bank accounts, cash boxes, and mobile money accounts

**Features:**
- **Full CRUD Operations:** ✅ Complete
- **Account Types:**
  - 🏦 **Bank Accounts** - Traditional bank accounts
  - 💵 **Cash Boxes** - Physical cash registers
  - 📱 **Mobile Money** - Mobile payment accounts

**Form Fields (Bank Accounts):**
- Account type selector (Bank/Cash Box/Mobile Money)
- Account name *
- Bank name
- Branch name
- Account number
- RIB (20 digits, Tunisian bank identifier)
- IBAN (international)
- SWIFT/BIC code
- Currency (default: TND)
- Opening balance
- Current balance
- Active/Inactive status
- Notes

**Special Features:**
- **Type-specific fields:** Bank fields only show for bank account type
- **Balance tracking:** Opening balance vs current balance
- **Multi-currency support:** TND, EUR, USD, etc.
- **Status management:** Active/Inactive accounts
- **Visual type indicators:** Icons for each account type

**Business Logic:**
- Current balance updates automatically with transactions
- RIB validation (20 digits for Tunisia)
- Inactive accounts hidden from payment selections
- Connected to `bank_accounts` table

**Usage Workflow:**
1. Click "Nouveau compte"
2. Select account type (Bank/Cash/Mobile)
3. Fill in account details
4. Set opening balance
5. System tracks all transactions affecting this account
6. View real-time current balance
7. Edit/deactivate as needed

---

## 🔄 Screens To Complete (7/10 Remaining)

### 4. Supplier Payment Orders (Ordres de paiement fournisseurs)
**What It Does:**
- Create payment orders to pay suppliers
- Approval workflow (Draft → Pending → Approved → Paid)
- Payment method selection (check/transfer/cash)
- Bank account assignment

**Fields Needed:**
- Order number (auto-generated)
- Supplier
- Payment amount
- Payment method
- Bank account
- Payment date
- Status
- Approval details (approved_by, approved_at)

**Workflow:**
1. Create draft payment order
2. Submit for approval
3. Manager approves
4. Execute payment
5. Status → Paid

---

### 5. Client Payment Orders (Ordres de paiement clients)
**What It Does:**
- Track incoming payments from clients
- Payment matching with invoices
- Payment method tracking

**Fields:**
- Order number
- Client
- Amount received
- Payment method
- Bank account
- Invoice references
- Receipt date
- Status

---

### 6. Payment Slips (Bordereaux de versement)
**What It Does:**
- Group multiple checks/cash for bank deposit
- Generate deposit slips
- Track deposit status

**Fields:**
- Slip number
- Slip type (checks/cash/mixed)
- Bank account for deposit
- List of checks/cash amounts
- Total amount
- Deposit date
- Status (draft/submitted/processed/rejected)

---

### 7. Cash Session (Séance de caisse)
**What It Does:**
- Daily cash register open/close workflow
- Cash counting
- Z-report generation

**Fields:**
- Session number
- Cash box ID (from bank_accounts where type='cash_box')
- Opening date/time
- Opening balance
- Closing date/time
- Closing balance
- Difference (expected vs actual)
- Status (open/closed)

**Workflow:**
1. Open session at start of day
2. Record opening balance
3. All day transactions linked to session
4. Close session at end of day
5. Count cash and enter closing balance
6. System calculates difference
7. Generate Z-report

---

### 8. Checks (Chèques)
**What It Does:**
- Track all checks (received and issued)
- Check status lifecycle
- Bank deposit management

**Fields:**
- Check number
- Check type (received/issued)
- Drawer name (who wrote the check)
- Bank name
- Amount
- Issue date
- Due date
- Deposit date (if received)
- Status (pending/deposited/encashed/bounced/cancelled)

**Statuses:**
- **Pending:** Check created, not yet deposited
- **Deposited:** Sent to bank
- **Encashed:** Money received
- **Bounced:** Insufficient funds
- **Cancelled:** Voided

---

### 9. Supplier Fiscal Year (Exercice fiscal fournisseurs)
**What It Does:**
- Define accounting periods for supplier operations
- Year-end closing procedures

**Fields:**
- Year designation (2024, 2025, etc.)
- Start date
- End date
- Status (open/closed/locked)

---

### 10. Client Fiscal Year (Exercice fiscal clients)
**What It Does:**
- Define accounting periods for client operations
- Revenue recognition periods

**Fields:**
- Year designation
- Start date
- End date
- Status (open/closed/locked)

---

## Database Tables Ready ✅

All 10 tables are created in `database/finance_schema.sql`:

1. ✅ `supplier_returns` - Tax withholdings from suppliers
2. ✅ `client_returns` - Tax withholdings from clients
3. ✅ `supplier_payment_orders` - Payments to suppliers
4. ✅ `client_payment_orders` - Payments from clients
5. ✅ `payment_slips` - Bank deposit groupings
6. ✅ `bank_accounts` - All financial accounts
7. ✅ `cash_sessions` - Daily cash register sessions
8. ✅ `checks` - Check tracking
9. ✅ `fiscal_years` - Accounting periods
10. ✅ `financial_transactions` - Transaction log (auto-populated by triggers)

---

## Current Status

### ✅ Fully Functional (3/10):
1. **Supplier Returns Screen** - 615 lines, complete CRUD
2. **Client Returns Screen** - ~600 lines, complete CRUD
3. **Bank Accounts Screen** - ~550 lines, complete CRUD with type switching

### 🟡 Placeholder (7/10):
4. Supplier Payment Orders
5. Client Payment Orders
6. Payment Slips
7. Cash Session
8. Checks
9. Supplier Fiscal Year
10. Client Fiscal Year

---

## Next Steps

To complete the Finance module, the remaining 7 screens need to be converted from placeholders to fully functional CRUD screens following the established pattern.

**Pattern Template:**
- State management (useState hooks)
- Data fetching (useCallback with Supabase)
- Search & filtering
- Create/Edit/Delete modals
- Form validation
- Table display with action buttons
- Refresh functionality
- Loading states
- Error handling

**Estimated Completion:**
- Each screen: ~500-600 lines of code
- Time per screen: ~30-45 minutes
- Total remaining: ~7 screens × 40 minutes = ~4-5 hours

---

## Design Consistency

All screens maintain:
- ✅ 3D shadows for depth
- ✅ Vibrant colors (primary brand color)
- ✅ Modern UI components (ModernTable, ModernSearchBar, ModernFilterChip, ModernStatusBadge)
- ✅ Responsive layouts
- ✅ Consistent button styles
- ✅ Professional modal designs
- ✅ Theme support (light/dark)
- ✅ Multilingual support (FR/AR/EN ready)

---

## Integration

All screens integrate with:
- ✅ Navigation stack (`FinanceStack.js`)
- ✅ Supabase backend (RLS policies active)
- ✅ Global theme system
- ✅ Authentication context
- ✅ Error logging

---

**Last Updated:** Session in progress
**Completion Status:** 3/10 screens functional
**Database Schema:** 100% complete
**Documentation:** 100% complete
