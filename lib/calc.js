const { VAT_RATE, SSCL_RATE } = require("./branches");

// Turns raw {description, qty, unitPrice, pricingMode} rows into fully-costed line items.
//
// Three pricing scenarios, chosen per item with the "Pricing" dropdown on that row:
//
//   "mrp"      -> unitPrice already includes 18% VAT (the sticker/MRP price).
//                 Work backwards to split out VAT: base = price / 1.18
//
//   "vat"      -> unitPrice is the bill amount BEFORE tax. Add 18% VAT on top:
//                 total = price * 1.18
//
//   "sscl_vat" -> unitPrice is the bill amount BEFORE tax. Add SSCL 2.5% on the
//                 base first, THEN add 18% VAT on (base + SSCL):
//                 sscl = base * 0.025
//                 vat  = (base + sscl) * 0.18
//                 total = base + sscl + vat
//
// Every mode always reports the same shape: Excl. VAT, SSCL, VAT, Line Total —
// so items with different pricing modes can sit side by side on one invoice.
function computeItems(items) {
  return items.map((it) => {
    const qty = Number(it.qty);
    const unitPrice = Number(it.unitPrice);
    const mode = it.pricingMode === "mrp" || it.pricingMode === "sscl_vat" ? it.pricingMode : "vat";
    const lineRaw = qty * unitPrice;

    let lineExclusive, lineSscl, lineVat, lineInclusive;

    if (mode === "mrp") {
      lineInclusive = lineRaw;
      lineExclusive = lineRaw / (1 + VAT_RATE);
      lineSscl = 0;
      lineVat = lineInclusive - lineExclusive;
    } else if (mode === "sscl_vat") {
      lineExclusive = lineRaw;
      lineSscl = lineExclusive * SSCL_RATE;
      lineVat = (lineExclusive + lineSscl) * VAT_RATE;
      lineInclusive = lineExclusive + lineSscl + lineVat;
    } else {
      // "vat"
      lineExclusive = lineRaw;
      lineSscl = 0;
      lineVat = lineExclusive * VAT_RATE;
      lineInclusive = lineExclusive + lineVat;
    }

    return {
      description: it.description,
      serialNo: (it.serialNo || "").trim().slice(0, 100),
      qty,
      unitPrice,
      pricingMode: mode,
      lineExclusive,
      lineSscl,
      lineVat,
      lineInclusive,
    };
  });
}

// Computes invoice-level totals from already-computed line items.
// Since items on one invoice can now mix pricing modes (some MRP, some
// SSCL+VAT, some plain VAT), the discount is applied as a straight rupee
// deduction from the grand total rather than recalculating tax on a
// discounted base — that keeps it correct no matter what mix of modes is used.
function computeTotals(computedItems, { discount } = {}) {
  const totalExclusive = computedItems.reduce((s, r) => s + r.lineExclusive, 0);
  const ssclAmount = computedItems.reduce((s, r) => s + (r.lineSscl || 0), 0);
  const vatAmount = computedItems.reduce((s, r) => s + r.lineVat, 0);
  const discountVal = Number(discount) || 0;
  const totalAmount = totalExclusive + ssclAmount + vatAmount - discountVal;
  return { totalExclusive, discountVal, ssclAmount, vatAmount, totalAmount };
}

module.exports = { computeItems, computeTotals };
