const { VAT_RATE } = require("./branches");

// Turns raw {description, qty, unitPrice, isMrp} rows into fully-costed line items.
//
// Two pricing scenarios per item, chosen with the "MRP" checkbox on that row:
//
//   MRP checked   -> unitPrice already includes 18% VAT (the sticker/MRP price).
//                    We work backwards to split out the VAT: base = price / 1.18
//
//   MRP unchecked -> unitPrice is the bill amount BEFORE tax. The system adds
//                    18% VAT on top: total = price * 1.18
//
// Either way, the item table always shows the same breakdown: Excl. VAT, VAT (18%), Line Total.
function computeItems(items) {
  return items.map((it) => {
    const qty = Number(it.qty);
    const unitPrice = Number(it.unitPrice);
    const isMrp = !!it.isMrp;
    const lineRaw = qty * unitPrice;

    let lineExclusive, lineVat, lineInclusive;
    if (isMrp) {
      // Price entered already includes VAT — split it out.
      lineInclusive = lineRaw;
      lineExclusive = lineRaw / (1 + VAT_RATE);
      lineVat = lineInclusive - lineExclusive;
    } else {
      // Price entered is before tax — add VAT on top.
      lineExclusive = lineRaw;
      lineVat = lineExclusive * VAT_RATE;
      lineInclusive = lineExclusive + lineVat;
    }

    return {
      description: it.description,
      qty,
      unitPrice,
      isMrp,
      lineExclusive,
      lineVat,
      lineInclusive,
    };
  });
}

// Computes invoice-level totals from already-computed line items.
// Discount is subtracted from the excl.-VAT total, then VAT is recalculated
// on the discounted base — same pattern as before.
function computeTotals(computedItems, { discount } = {}) {
  const totalExclusive = computedItems.reduce((s, r) => s + r.lineExclusive, 0);
  const discountVal = Number(discount) || 0;
  const netExclusive = totalExclusive - discountVal;
  const vatAmount = netExclusive * VAT_RATE;
  const totalAmount = netExclusive + vatAmount;
  return { totalExclusive, discountVal, vatAmount, totalAmount };
}

module.exports = { computeItems, computeTotals };
