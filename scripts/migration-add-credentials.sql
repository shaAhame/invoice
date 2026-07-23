-- Run this once in Supabase -> SQL Editor if you already created your tables
-- before the in-app password management feature. This only ADDS a new table
-- for storing changed passwords; your existing invoices are untouched.
-- Roles whose password has never been changed through the app keep using
-- their ADMIN_PASSWORD / PRIME_PASSWORD / LIBERTY_PASSWORD / MARINO_PASSWORD
-- environment variable automatically — nothing breaks if you skip this until
-- the first time someone actually changes a password.

CREATE TABLE IF NOT EXISTS credentials (
  role_key TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);
