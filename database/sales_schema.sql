-- =====================================================
-- SALES MODULE - DATABASE SCHEMA
-- =====================================================
-- This file updates existing tables for the Sales module
-- Execute this in your Supabase SQL editor

-- =====================================================
-- 1. QUOTES (Devis) - Table already exists, just add missing columns
-- =====================================================
-- Note: The quotes table already exists with: id, user_id, client_id, quote_number, 
-- issue_date, expiry_date, total_amount, status, items, created_at

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='quotes' AND column_name='updated_at') THEN
        ALTER TABLE quotes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add notes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='quotes' AND column_name='notes') THEN
        ALTER TABLE quotes ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add indexes for better performance (IF NOT EXISTS prevents errors if they exist)
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_issue_date ON quotes(issue_date);

-- Ensure Row Level Security is enabled
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own quotes" ON quotes;
    DROP POLICY IF EXISTS "Users can insert their own quotes" ON quotes;
    DROP POLICY IF EXISTS "Users can update their own quotes" ON quotes;
    DROP POLICY IF EXISTS "Users can delete their own quotes" ON quotes;
END $$;

-- Recreate RLS Policies
CREATE POLICY "Users can view their own quotes" 
    ON quotes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes" 
    ON quotes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes" 
    ON quotes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes" 
    ON quotes FOR DELETE 
    USING (auth.uid() = user_id);

-- =====================================================
-- 2. DELIVERY NOTES (Bons de livraison) - Table already exists, update it
-- =====================================================
-- Note: The delivery_notes table already exists with: id, user_id, client_id, note_number,
-- delivery_date, status, items, total_amount, related_invoice_id, created_at

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='delivery_notes' AND column_name='updated_at') THEN
        ALTER TABLE delivery_notes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- Add notes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='delivery_notes' AND column_name='notes') THEN
        ALTER TABLE delivery_notes ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Update status column constraint if needed
DO $$
BEGIN
    -- Drop old constraint if it exists
    ALTER TABLE delivery_notes DROP CONSTRAINT IF EXISTS delivery_notes_status_check;
    
    -- Add new constraint with correct values
    ALTER TABLE delivery_notes ADD CONSTRAINT delivery_notes_status_check 
        CHECK (status IN ('pending', 'delivered', 'cancelled'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delivery_notes_user_id ON delivery_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_client_id ON delivery_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_status ON delivery_notes(status);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_note_number ON delivery_notes(note_number);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_delivery_date ON delivery_notes(delivery_date);

-- Ensure Row Level Security is enabled
ALTER TABLE delivery_notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own delivery notes" ON delivery_notes;
    DROP POLICY IF EXISTS "Users can insert their own delivery notes" ON delivery_notes;
    DROP POLICY IF EXISTS "Users can update their own delivery notes" ON delivery_notes;
    DROP POLICY IF EXISTS "Users can delete their own delivery notes" ON delivery_notes;
END $$;

-- Recreate RLS Policies
CREATE POLICY "Users can view their own delivery notes" 
    ON delivery_notes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own delivery notes" 
    ON delivery_notes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own delivery notes" 
    ON delivery_notes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own delivery notes" 
    ON delivery_notes FOR DELETE 
    USING (auth.uid() = user_id);

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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
DROP TRIGGER IF EXISTS update_delivery_notes_updated_at ON delivery_notes;

-- Apply triggers to both tables
CREATE TRIGGER update_quotes_updated_at 
    BEFORE UPDATE ON quotes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_notes_updated_at 
    BEFORE UPDATE ON delivery_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The quotes and delivery_notes tables have been updated with:
-- - RLS policies for user isolation
-- - Indexes for better query performance
-- - updated_at triggers for automatic timestamp management
-- - notes column for additional information
-- - Proper status constraints
