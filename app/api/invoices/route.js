import { NextResponse } from "next/server";
import { BRANCHES } from "../../../lib/branches";
import { getNextInvoiceNumber, createInvoice, listInvoices } from "../../../lib/db";
import { computeItems, computeTotals } from "../../../lib/calc";
import { amountToWords } from "../../../lib/numToWords";

export async function POST(req) {
  try {
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
      applySscl,
      items,
    } = body;

    const branchConfig = BRANCHES[branch];
    if (!branchConfig) {
      return NextResponse.json({ error: "Invalid branch" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Recompute everything server-side — never trust totals sent from the client.
    const computedItems = computeItems(
      items.map((it) => ({ ...it, description: String(it.description || "").slice(0, 300) })),
      { applySscl }
    );
    const { totalExclusive, discountVal, ssclAmount, vatAmount, totalAmount } = computeTotals(
      computedItems,
      { discount, applySscl }
    );

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
      ssclAmount,
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
  const { searchParams } = new URL(req.url);
  const branchCode = searchParams.get("branch") || undefined;
  const invoices = await listInvoices({ branchCode });
  return NextResponse.json({ invoices });
}
