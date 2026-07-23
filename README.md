# iDealz Tax Invoice System

Generates tax invoices for **iDealz Prime**, **iDealz Liberty**, and **iDealz Marino**, with:
- Branch auto-fill (address, phone, invoice number series)
- Cashier types the selling price (VAT inclusive) — the system back-calculates the
  Excl. VAT / VAT (18%) breakdown per line and in the totals, exactly like your sample invoice
- Saved invoice history, searchable by branch
- One-click "Download PDF" matching the tax invoice layout
- Auto-incrementing invoice numbers per branch: `YYMMM-BRANCHCODE-NNNNN`
  (e.g. `26JUL-IDMA-00144`), continuing from the starting numbers you gave:
  - Marino (IDMA): starts at 00144
  - Liberty (IDLB): starts at 00138
  - Prime (IDPR): starts at 00123
- Login-protected: each branch only sees and creates its own invoices; Admin
  can see everything and create an invoice for any branch
- Mobile-friendly — usable on a phone or tablet, not just desktop

## 1. Add your logo
Save your logo as `public/logo.png` (transparent background PNG works best,
roughly 400x180px). It's used automatically on every PDF.

## 2. Push this to GitHub
```
cd idealz-invoice
git init
git add .
git commit -m "Initial commit"
```
Create a new empty repo on GitHub, then:
```
git remote add origin https://github.com/YOUR_USERNAME/idealz-invoice.git
git push -u origin main
```

## 3. Deploy to Vercel
1. Go to https://vercel.com → **Add New → Project** → import the GitHub repo you just pushed.
2. Click **Deploy** (it will build once — the invoice creation screen will load,
   but saving an invoice will fail until step 4 is done).

## 4. Set up login access (branches + admin)
This version adds login: each branch only sees its own invoices, and only
Admin can see and create invoices for every branch. This works with simple
shared passwords (no user database needed) — set these as environment
variables in Vercel (**Settings → Environment Variables**):

| Key | Value | Who logs in with it |
|---|---|---|
| `SESSION_SECRET` | any long random string, e.g. `openssl rand -hex 32` output | (not a password — used internally to sign login sessions) |
| `ADMIN_PASSWORD` | a password you choose | Admin — sees/creates invoices for all 3 branches |
| `PRIME_PASSWORD` | a password you choose | iDealz Prime staff — locked to Prime only |
| `LIBERTY_PASSWORD` | a password you choose | iDealz Liberty staff — locked to Liberty only |
| `MARINO_PASSWORD` | a password you choose | iDealz Marino staff — locked to Marino only |

Give each branch's shared password to that branch's device only, and keep
`ADMIN_PASSWORD` separate. Anyone can log out via the **Logout** button and
a different person can log in with a different password on the same device.

**Changing passwords later:** log in as Admin, click **"Manage Passwords"**
at the top of the page, and set a new password for any role right there —
it takes effect immediately, no redeploy needed. (The environment variables
above are only used the very first time each role logs in, before its
password has ever been changed through the app.)

## 5. Add your Supabase database connection
1. In Supabase → your project → **Project Settings → Database → Connection string → URI**.
2. Use the **Transaction pooler** string (port `6543`) — it's the one built for
   serverless functions like Vercel's. Copy it and fill in your actual database
   password (Supabase shows `[YOUR-PASSWORD]` as a placeholder).
3. In Vercel → your project → **Settings → Environment Variables**, add:
   - Key: `DATABASE_URL`
   - Value: the connection string from step 2
4. Redeploy (Deployments tab → Redeploy), or just push a new commit, so the new
   env var is picked up.

## 6. Create the database tables (one-time)
Easiest way — from your computer:
```
npm install
cp .env.local.example .env.local
# paste your DATABASE_URL into .env.local
npm run db:init
```
You should see: `✅ Tables created (or already existed). You're ready to go.`

(Alternatively, open your Supabase project → **SQL Editor**, and paste the
`CREATE TABLE` statements straight out of `scripts/init-db.js`.)

## 7. Go live
Visit your Vercel URL (e.g. `idealz-invoice.vercel.app`). Each store can bookmark this
URL on their billing computer. Select the branch, enter items, click **Generate Invoice**,
then **Download PDF** to print or save.

Past invoices are always available at `/invoices` (filterable by branch).

## Notes on the numbers
- **VAT-inclusive entry**: the cashier types the price the customer actually pays
  (e.g. 60,000). The system divides by 1.18 to get the Excl. VAT amount, and the
  difference is shown as VAT (18%) — this matches "the sales person types 60,000
  and the 18% VAT breakdown must show in the bill."
- **Discount**: entered in Rupees, applied to the Excl. VAT total before VAT is
  calculated on the net amount (same logic as your sample GNext invoice, where
  1,450,671 − 41,447.10 = 1,409,223.90, then 18% VAT = 253,660.30).
- **Invoice numbering** resets to a fresh count of 1 automatically at the start of
  each new month code (e.g. `26AUG-IDMA-00001`), continuing from your given
  starting numbers only in the current month (`26JUL`). Tell me if you'd rather
  it keep counting forever without a monthly reset — that's a one-line change in
  `lib/db.js`.

## Editing branch details later
Everything about the 3 branches (address, phone, invoice code, starting number)
lives in one file: `lib/branches.js`. Add a 4th branch or change an address there
— no other file needs touching.

## Updating an existing database
If you already ran `db:init` / created the tables before this version (adding
Purchaser TIN, SSCL tax, Additional Information), run this once in Supabase's
**SQL Editor** — it only adds new columns, your existing invoices stay intact:

```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS purchaser_tin TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS additional_info TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sscl_amount NUMERIC NOT NULL DEFAULT 0;
```

(Same statements are saved in `scripts/migration-add-tin-sscl-info.sql`.)

## Updating an existing database (again) — password management
If you already ran `db:init` before this version, run this once in Supabase's
**SQL Editor** to add the table that stores changed passwords:

```sql
CREATE TABLE IF NOT EXISTS credentials (
  role_key TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);
```

(Same statement is saved in `scripts/migration-add-credentials.sql`.) Until
you change a password through the app, that role keeps logging in with its
original environment variable — nothing breaks if you skip this step for now.
