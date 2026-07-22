// Formats a date (JS Date object from Postgres, ISO string "2026-07-22", or a
// full timestamp string) as "2026-JUL-22" (Year-Month-Date).
//
// Note: node-postgres returns DATE columns as JS Date objects, not strings —
// calling String() on those gives something like "Wed Jul 22 2026 00:00:00 GMT...",
// so we handle Date objects explicitly instead of just string-slicing.
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function formatDate(value) {
  if (!value) return "";

  let year, monthIndex, day;

  if (value instanceof Date) {
    year = value.getUTCFullYear();
    monthIndex = value.getUTCMonth();
    day = value.getUTCDate();
  } else {
    // String input: "2026-07-22" or "2026-07-22T00:00:00.000Z"
    const isoPart = String(value).slice(0, 10);
    const [y, m, d] = isoPart.split("-").map(Number);
    if (!y || !m || !d) return isoPart;
    year = y;
    monthIndex = m - 1;
    day = d;
  }

  const dayStr = String(day).padStart(2, "0");
  return `${year}-${MONTHS[monthIndex]}-${dayStr}`;
}

module.exports = { formatDate };
