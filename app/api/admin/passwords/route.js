import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/session";
import { setPassword } from "../../../../lib/credentials";

const VALID_ROLES = ["admin", "prime", "liberty", "marino"];

export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { roleKey, newPassword } = await req.json();
    if (!VALID_ROLES.includes(roleKey)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }

    await setPassword(roleKey, newPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to update password" }, { status: 500 });
  }
}
