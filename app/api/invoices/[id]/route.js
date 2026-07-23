import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/session";
import { getInvoiceById, updateInvoice, deleteInvoice } from "../../../../lib/db";
import { computeItems, computeTotals } from "../../../../lib/calc";
import { amountToWords } from "../../../../lib/numToWords";

function canAccess(session, invoice) {
  if (!session) return false;
  if (session.role === "admin") return true;
  return invoice.branch_code === session.branchCode;
}

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const invoice = await getInvoiceById(params.id);
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccess(session, invoice)) {
    return NextResponse.json({ error: "You don't have access to this invoice" }, { status: 403 });
  }
  return NextResponse.json({ invoice });
}

export async function PUT(req, { params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const existing = await getInvoiceById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!canAccess(session, existing)) {
      return NextResponse.json({ error: "You don't have access to this invoice" }, { status: 403 });
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
      items,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    // Recompute everything server-side, same logic as creating an invoice.
    const computedItems = computeItems(
      items.map((it) => ({ ...it, description: String(it.description || "").slice(0, 300) }))
    );
    const { totalExclusive, discountVal, vatAmount, totalAmount } = computeTotals(computedItems, {
      discount,
    });

    const saved = await updateInvoice(params.id, {
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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const existing = await getInvoiceById(params.id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!canAccess(session, existing)) {
      return NextResponse.json({ error: "You don't have access to this invoice" }, { status: 403 });
    }

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
