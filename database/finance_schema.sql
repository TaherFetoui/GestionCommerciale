-- =====================================================
-- FINANCE MODULE - DATABASE SCHEMA
-- =====================================================
-- This file contains all table structures for the Finance module
-- Execute this in your Supabase SQL editor

-- =====================================================
-- 1. SUPPLIER RETURNS (Retenues à la source fournisseurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS supplier_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_amount DECIMAL(15, 3) DEFAULT 0,
    retention_rate DECIMAL(5, 2) DEFAULT 1.5,
    retention_amount DECIMAL(15, 3) NOT NULL,
    retention_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_supplier_returns_supplier ON supplier_returns(supplier);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_status ON supplier_returns(status);
CREATE INDEX IF NOT EXISTS idx_supplier_returns_date ON supplier_returns(retention_date);

-- Enable Row Level Security
ALTER TABLE supplier_returns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all supplier returns" ON supplier_returns FOR SELECT USING (true);
CREATE POLICY "Users can insert supplier returns" ON supplier_returns FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update supplier returns" ON supplier_returns FOR UPDATE USING (true);
CREATE POLICY "Users can delete supplier returns" ON supplier_returns FOR DELETE USING (true);

-- =====================================================
-- 2. CLIENT RETURNS (Retenues à la source clients)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    invoice_amount DECIMAL(15, 3) DEFAULT 0,
    retention_rate DECIMAL(5, 2) DEFAULT 1.5,
    retention_amount DECIMAL(15, 3) NOT NULL,
    retention_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_returns_client ON client_returns(client);
CREATE INDEX IF NOT EXISTS idx_client_returns_status ON client_returns(status);
CREATE INDEX IF NOT EXISTS idx_client_returns_date ON client_returns(retention_date);

ALTER TABLE client_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all client returns" ON client_returns FOR SELECT USING (true);
CREATE POLICY "Users can insert client returns" ON client_returns FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update client returns" ON client_returns FOR UPDATE USING (true);
CREATE POLICY "Users can delete client returns" ON client_returns FOR DELETE USING (true);

-- =====================================================
-- 3. PAYMENT ORDERS - SUPPLIERS (Ordres de paiement fournisseurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS supplier_payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    supplier TEXT NOT NULL,
    amount DECIMAL(15, 3) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'transfer', 'card')),
    payment_date DATE,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'rejected', 'cancelled')),
    bank_account TEXT,
    reference TEXT,
    note TEXT,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payment_orders_supplier ON supplier_payment_orders(supplier);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_orders_status ON supplier_payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_orders_order_number ON supplier_payment_orders(order_number);

ALTER TABLE supplier_payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all supplier payment orders" ON supplier_payment_orders FOR SELECT USING (true);
CREATE POLICY "Users can insert supplier payment orders" ON supplier_payment_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update supplier payment orders" ON supplier_payment_orders FOR UPDATE USING (true);
CREATE POLICY "Users can delete supplier payment orders" ON supplier_payment_orders FOR DELETE USING (true);

-- =====================================================
-- 4. PAYMENT ORDERS - CLIENTS (Ordres de paiement clients)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    client TEXT NOT NULL,
    amount DECIMAL(15, 3) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'transfer', 'card')),
    payment_date DATE,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'partial', 'overdue', 'cancelled')),
    bank_account TEXT,
    reference TEXT,
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_payment_orders_client ON client_payment_orders(client);
CREATE INDEX IF NOT EXISTS idx_client_payment_orders_status ON client_payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_client_payment_orders_order_number ON client_payment_orders(order_number);

ALTER TABLE client_payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all client payment orders" ON client_payment_orders FOR SELECT USING (true);
CREATE POLICY "Users can insert client payment orders" ON client_payment_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update client payment orders" ON client_payment_orders FOR UPDATE USING (true);
CREATE POLICY "Users can delete client payment orders" ON client_payment_orders FOR DELETE USING (true);

-- =====================================================
-- 5. PAYMENT SLIPS (Bordereaux de versement)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slip_number TEXT UNIQUE NOT NULL,
    slip_type TEXT NOT NULL CHECK (slip_type IN ('deposit', 'check_collection', 'transfer')),
    bank_account TEXT NOT NULL,
    total_amount DECIMAL(15, 3) NOT NULL DEFAULT 0,
    slip_date DATE NOT NULL DEFAULT CURRENT_DATE,
    value_date DATE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'processed', 'rejected')),
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_slips_slip_number ON payment_slips(slip_number);
CREATE INDEX IF NOT EXISTS idx_payment_slips_status ON payment_slips(status);
CREATE INDEX IF NOT EXISTS idx_payment_slips_date ON payment_slips(slip_date);

ALTER TABLE payment_slips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all payment slips" ON payment_slips FOR SELECT USING (true);
CREATE POLICY "Users can insert payment slips" ON payment_slips FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update payment slips" ON payment_slips FOR UPDATE USING (true);
CREATE POLICY "Users can delete payment slips" ON payment_slips FOR DELETE USING (true);

-- =====================================================
-- 6. BANK ACCOUNTS & CASH BOXES (Agences bancaires\caisses)
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'cash_box', 'mobile_money')),
    account_name TEXT NOT NULL,
    account_number TEXT,
    bank_name TEXT,
    branch_name TEXT,
    rib TEXT,
    iban TEXT,
    swift_code TEXT,
    currency TEXT DEFAULT 'TND',
    opening_balance DECIMAL(15, 3) DEFAULT 0,
    current_balance DECIMAL(15, 3) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_type ON bank_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_active ON bank_accounts(is_active);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all bank accounts" ON bank_accounts FOR SELECT USING (true);
CREATE POLICY "Users can insert bank accounts" ON bank_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update bank accounts" ON bank_accounts FOR UPDATE USING (true);
CREATE POLICY "Users can delete bank accounts" ON bank_accounts FOR DELETE USING (true);

-- =====================================================
-- 7. CASH SESSIONS (Sessions de caisse)
-- =====================================================
CREATE TABLE IF NOT EXISTS cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_number TEXT UNIQUE NOT NULL,
    cash_box_id UUID REFERENCES bank_accounts(id),
    opening_balance DECIMAL(15, 3) NOT NULL DEFAULT 0,
    closing_balance DECIMAL(15, 3),
    expected_balance DECIMAL(15, 3),
    difference DECIMAL(15, 3),
    total_sales DECIMAL(15, 3) DEFAULT 0,
    total_expenses DECIMAL(15, 3) DEFAULT 0,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    opened_by UUID REFERENCES auth.users(id),
    closed_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_cash_box ON cash_sessions(cash_box_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_opened_at ON cash_sessions(opened_at);

ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all cash sessions" ON cash_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert cash sessions" ON cash_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update cash sessions" ON cash_sessions FOR UPDATE USING (true);
CREATE POLICY "Users can delete cash sessions" ON cash_sessions FOR DELETE USING (true);

-- =====================================================
-- 8. CHECKS MANAGEMENT (Gestion des chèques)
-- =====================================================
CREATE TABLE IF NOT EXISTS checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_number TEXT NOT NULL,
    check_type TEXT NOT NULL CHECK (check_type IN ('received', 'issued')),
    drawer_name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    amount DECIMAL(15, 3) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    deposit_date DATE,
    encashment_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deposited', 'encashed', 'bounced', 'cancelled')),
    bank_account_id UUID REFERENCES bank_accounts(id),
    client_supplier TEXT,
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checks_type ON checks(check_type);
CREATE INDEX IF NOT EXISTS idx_checks_status ON checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_due_date ON checks(due_date);
CREATE INDEX IF NOT EXISTS idx_checks_drawer ON checks(drawer_name);

ALTER TABLE checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all checks" ON checks FOR SELECT USING (true);
CREATE POLICY "Users can insert checks" ON checks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update checks" ON checks FOR UPDATE USING (true);
CREATE POLICY "Users can delete checks" ON checks FOR DELETE USING (true);

-- =====================================================
-- 9. FISCAL YEAR SETTINGS (Exercices comptables)
-- =====================================================
CREATE TABLE IF NOT EXISTS fiscal_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year_type TEXT NOT NULL CHECK (year_type IN ('supplier', 'client')),
    fiscal_year TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_closed BOOLEAN DEFAULT false,
    note TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(year_type, fiscal_year)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_years_type ON fiscal_years(year_type);
CREATE INDEX IF NOT EXISTS idx_fiscal_years_active ON fiscal_years(is_active);

ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all fiscal years" ON fiscal_years FOR SELECT USING (true);
CREATE POLICY "Users can insert fiscal years" ON fiscal_years FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update fiscal years" ON fiscal_years FOR UPDATE USING (true);
CREATE POLICY "Users can delete fiscal years" ON fiscal_years FOR DELETE USING (true);

-- =====================================================
-- 10. FINANCIAL TRANSACTIONS (Journal général)
-- =====================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT UNIQUE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
    category TEXT,
    amount DECIMAL(15, 3) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    bank_account_id UUID REFERENCES bank_accounts(id),
    payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'transfer', 'card')),
    reference TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    related_entity_type TEXT CHECK (related_entity_type IN ('client', 'supplier', 'employee', 'other')),
    related_entity_name TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_bank_account ON financial_transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all financial transactions" ON financial_transactions FOR SELECT USING (true);
CREATE POLICY "Users can insert financial transactions" ON financial_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update financial transactions" ON financial_transactions FOR UPDATE USING (true);
CREATE POLICY "Users can delete financial transactions" ON financial_transactions FOR DELETE USING (true);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_supplier_returns_updated_at BEFORE UPDATE ON supplier_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_returns_updated_at BEFORE UPDATE ON client_returns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supplier_payment_orders_updated_at BEFORE UPDATE ON supplier_payment_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_payment_orders_updated_at BEFORE UPDATE ON client_payment_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_slips_updated_at BEFORE UPDATE ON payment_slips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cash_sessions_updated_at BEFORE UPDATE ON cash_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checks_updated_at BEFORE UPDATE ON checks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fiscal_years_updated_at BEFORE UPDATE ON fiscal_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- INSERT INTO supplier_returns (supplier, invoice_number, invoice_amount, retention_rate, retention_amount, status)
-- VALUES ('Fournisseur ABC', 'FAC-2025-001', 1000.000, 1.5, 15.000, 'pending');
