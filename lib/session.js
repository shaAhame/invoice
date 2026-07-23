import { cookies } from "next/headers";
import { SESSION_COOKIE, parseSessionValue } from "./auth";

// Returns { role: "admin" | "branch", branchCode: string|null } or null if not logged in.
export async function getSession() {
  const store = cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  return parseSessionValue(raw);
}
