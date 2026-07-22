import { NextResponse } from "next/server";
import { getInvoiceById, updateInvoice, deleteInvoice } from "../../../../lib/db";
import { computeItems, computeTotals } from "../../../../lib/calc";
import { amountToWords } from "../../../../lib/numToWords";

export async function GET(req, { params }) {
  const invoice = await getInvoiceById(params.id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice });
}

export async function PUT(req, { params }) {
  try {
    const existing = await getInvoiceById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
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

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Recompute everything server-side, same logic as creating an invoice.
    const computedItems = computeItems(
      items.map((it) => ({ ...it, description: String(it.description || "").slice(0, 300) })),
      { applySscl }
    );
    const { totalExclusive, discountVal, ssclAmount, vatAmount, totalAmount } = computeTotals(
      computedItems,
      { discount, applySscl }
    );

    const saved = await updateInvoice(params.id, {
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
      paymentMode: paymentMode || existing.payment_mode,
    });

    return NextResponse.json({ invoice: saved });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const result = await deleteInvoice(params.id);
    if (!result.deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
