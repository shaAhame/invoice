import { NextResponse } from "next/server";
import { createSessionValue, SESSION_COOKIE, MAX_AGE_SECONDS } from "../../../lib/auth";
import { BRANCHES } from "../../../lib/branches";
import { verifyLogin } from "../../../lib/credentials";

const VALID_ROLES = ["admin", "prime", "liberty", "marino"];

export async function POST(req) {
  try {
    const { role, password } = await req.json();

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role selected" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Enter a password" }, { status: 400 });
    }

    const result = await verifyLogin(role, password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Incorrect password" }, { status: 401 });
    }

    const payload =
      role === "admin"
        ? { role: "admin", branchCode: null }
        : { role: "branch", branchCode: BRANCHES[role].code };

    const sessionValue = createSessionValue(payload);

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
