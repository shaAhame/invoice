import { NextResponse } from "next/server";
import { getSession } from "../../../lib/session";
import { BRANCHES, getBranchKeyByCode } from "../../../lib/branches";
import { getNextInvoiceNumber, createInvoice, listInvoices } from "../../../lib/db";
import { computeItems, computeTotals } from "../../../lib/calc";
import { amountToWords } from "../../../lib/numToWords";

export async function POST(req) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const body = await req.json();
    const {
      branch,
      purchaserName,
      purchaserAddress,
      purchaserTp,
      purchaserTin,
      additionalInfo,
      paymentMode,
      discount,
      items,
    } = body;

    // Branch users can only ever create invoices for their own branch — the
    // branch value from the client is ignored and replaced with their session's
    // branch, so a tampered request can't post to a different branch.
    let branchKey;
    if (session.role === "admin") {
      branchKey = branch;
    } else {
      branchKey = getBranchKeyByCode(session.branchCode);
    }

    const branchConfig = BRANCHES[branchKey];
    if (!branchConfig) {
      return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Recompute everything server-side — never trust totals sent from the client.
    const computedItems = computeItems(
      items.map((it) => ({ ...it, description: String(it.description || "").slice(0, 300) }))
    );
    const { totalExclusive, discountVal, vatAmount, totalAmount } = computeTotals(computedItems, {
      discount,
    });

    const invoiceNo = await getNextInvoiceNumber(branchConfig.code);

    const saved = await createInvoice({
      branchCode: branchConfig.code,
      invoiceNo,
      invoiceDate: new Date().toISOString().slice(0, 10),
      purchaserName: purchaserName || "",
      purchaserAddress: purchaserAddress || "",
      purchaserTp: purchaserTp || "",
      purchaserTin: purchaserTin || "",
      additionalInfo: additionalInfo || "",
      items: computedItems,
      totalValue: totalExclusive,
      discount: discountVal,
      ssclAmount: 0,
      vatAmount,
      totalAmount,
      amountWords: amountToWords(totalAmount),
      paymentMode: paymentMode || "FULL CASH",
    });

    return NextResponse.json({ id: saved.id, invoiceNo });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function GET(req) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  // Branch users only ever see their own branch, regardless of the query string.
  const branchCode = session.role === "admin" ? searchParams.get("branch") || undefined : session.branchCode;
  const invoices = await listInvoices({ branchCode });
  return NextResponse.json({ invoices });
}
