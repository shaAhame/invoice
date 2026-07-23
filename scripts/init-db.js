// One-time setup script. Run with:  npm run db:init
// Make sure DATABASE_URL is set (in .env.local, or exported in your shell) —
// it should be your Supabase connection string.
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set. Add it to .env.local first.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      branch_code TEXT NOT NULL,
      invoice_no TEXT UNIQUE NOT NULL,
      invoice_date DATE NOT NULL,
      purchaser_name TEXT,
      purchaser_address TEXT,
      purchaser_tp TEXT,
      purchaser_tin TEXT,
      additional_info TEXT,
      items JSONB NOT NULL,
      total_value NUMERIC NOT NULL,
      discount NUMERIC NOT NULL DEFAULT 0,
      sscl_amount NUMERIC NOT NULL DEFAULT 0,
      vat_amount NUMERIC NOT NULL,
      total_amount NUMERIC NOT NULL,
      amount_words TEXT,
      payment_mode TEXT,
      created_at TIMESTAMP DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS invoice_counters (
      branch_code TEXT NOT NULL,
      year_month TEXT NOT NULL,
      last_number INTEGER NOT NULL,
      PRIMARY KEY (branch_code, year_month)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS credentials (
      role_key TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT now()
    );
  `);

  console.log("✅ Tables created (or already existed). You're ready to go.");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ DB init failed:", err);
  process.exit(1);
});
