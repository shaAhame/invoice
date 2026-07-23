const crypto = require("crypto");
const { getPool } = require("./pg");

const ENV_KEYS = {
  admin: "ADMIN_PASSWORD",
  prime: "PRIME_PASSWORD",
  liberty: "LIBERTY_PASSWORD",
  marino: "MARINO_PASSWORD",
};

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyHash(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

async function getStoredHash(roleKey) {
  const pool = getPool();
  const { rows } = await pool.query(`SELECT password_hash FROM credentials WHERE role_key = $1;`, [roleKey]);
  return rows[0]?.password_hash || null;
}

// Sets (or replaces) the password for a role. Takes effect immediately.
async function setPassword(roleKey, newPassword) {
  const pool = getPool();
  const hash = hashPassword(newPassword);
  await pool.query(
    `INSERT INTO credentials (role_key, password_hash, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (role_key) DO UPDATE SET password_hash = $2, updated_at = now();`,
    [roleKey, hash]
  );
}

// Verifies a login attempt.
// - If the admin has ever changed this role's password, it's checked against
//   the database (hashed, never stored in plain text).
// - Otherwise it falls back to the original PRIME_PASSWORD / ADMIN_PASSWORD /
//   etc. environment variable, so nothing breaks for roles whose password
//   has never been changed through the app.
async function verifyLogin(roleKey, password) {
  const stored = await getStoredHash(roleKey);
  if (stored) {
    return { ok: verifyHash(password, stored) };
  }

  const envKey = ENV_KEYS[roleKey];
  const envPassword = envKey ? process.env[envKey] : null;
  if (!envPassword) {
    return {
      ok: false,
      error: `No password is set for this role yet. Ask your admin to set one, or set the ${envKey} environment variable.`,
    };
  }
  return { ok: password === envPassword };
}

module.exports = { ENV_KEYS, hashPassword, verifyHash, getStoredHash, setPassword, verifyLogin };
