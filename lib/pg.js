const { Pool } = require("pg");

// DATABASE_URL should be your Supabase "Connection string" (Transaction pooler,
// port 6543 works best for serverless functions like Vercel).
// Project Settings -> Database -> Connection string -> URI, then paste it as
// the DATABASE_URL environment variable in Vercel / your .env.local.
let pool;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set. Add your Supabase connection string as the DATABASE_URL env var."
      );
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    });
  }
  return pool;
}

module.exports = { getPool };
