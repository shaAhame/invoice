import { NextResponse } from "next/server";
import { getSession } from "../../../lib/session";

// Lets client components check who's logged in (role + branch) without
// needing to be a Server Component themselves.
export async function GET() {
  const session = await getSession();
  return NextResponse.json({ session });
}
