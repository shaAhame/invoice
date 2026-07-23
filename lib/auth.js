const crypto = require("crypto");

const SESSION_COOKIE = "idealz_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add a long random string as this environment variable (used to sign login sessions)."
    );
  }
  return secret;
}

function sign(payloadStr) {
  return crypto.createHmac("sha256", getSecret()).update(payloadStr).digest("hex");
}

// payload example: { role: "admin", branchCode: null } or { role: "branch", branchCode: "IDMA" }
function createSessionValue(payload) {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(payloadStr);
  return `${payloadStr}.${signature}`;
}

function parseSessionValue(value) {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, signature] = parts;

  let expected;
  try {
    expected = sign(payloadStr);
  } catch {
    return null;
  }

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

module.exports = { SESSION_COOKIE, MAX_AGE_SECONDS, createSessionValue, parseSessionValue };
