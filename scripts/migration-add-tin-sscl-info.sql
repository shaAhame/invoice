-- Run this once in Supabase -> SQL Editor if you already created your tables
-- before this update. It only ADDS new columns, your existing invoices are safe.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS purchaser_tin TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS additional_info TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sscl_amount NUMERIC NOT NULL DEFAULT 0;
