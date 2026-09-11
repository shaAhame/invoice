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
      invoiceDate,
      manualInvoiceNo,
    } = body;

    // Backdating: if a valid past (or any) date is given, use it — otherwise
    // default to today. Never allowed to be a future date.
    let resolvedDate = new Date();
    if (invoiceDate) {
      const parsed = new Date(`${invoiceDate}T00:00:00Z`);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid invoice date" }, { status: 400 });
      }
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      if (parsed > today) {
        return NextResponse.json({ error: "Invoice date can't be in the future" }, { status: 400 });
      }
      resolvedDate = parsed;
    }

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
    const { totalExclusive, discountVal, ssclAmount, vatAmount, totalAmount } = computeTotals(computedItems, {
      discount,
    });

    // Manual override: if the person typed their own invoice number, use it
    // as-is instead of auto-generating one. The running counter for this
    // branch is left untouched either way, so auto-numbering picks up
    // normally next time regardless of what manual numbers were used in between.
    const trimmedManual = (manualInvoiceNo || "").trim();
    const invoiceNo = trimmedManual || (await getNextInvoiceNumber(branchConfig.code, resolvedDate));

    let saved;
    try {
      saved = await createInvoice({
        branchCode: branchConfig.code,
        invoiceNo,
        invoiceDate: resolvedDate.toISOString().slice(0, 10),
        purchaserName: purchaserName || "",
        purchaserAddress: purchaserAddress || "",
        purchaserTp: purchaserTp || "",
        purchaserTin: purchaserTin || "",
        additionalInfo: additionalInfo || "",
        items: computedItems,
        totalValue: totalExclusive,
        discount: discountVal,
        ssclAmount,
        vatAmount,
        totalAmount,
        amountWords: amountToWords(totalAmount),
        paymentMode: paymentMode || "FULL CASH",
      });
    } catch (err) {
      // Postgres unique_violation — this invoice number is already used.
      if (err.code === "23505") {
        return NextResponse.json(
          { error: `Invoice number "${invoiceNo}" is already used. Choose a different number.` },
          { status: 409 }
        );
      }
      throw err;
    }

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
