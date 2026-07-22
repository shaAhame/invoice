const { VAT_RATE, SSCL_RATE } = require("./branches");

// Turns raw {description, qty, unitPrice} rows into fully-costed line items.
//
// unitPrice is always the FINAL price the customer actually pays per unit —
// whatever taxes are switched on for this invoice are assumed to already be
// baked into that number, and we work backwards to split it out:
//
//   SSCL off: unitPrice = base * (1 + VAT_RATE)
//   SSCL on:  unitPrice = base * (1 + SSCL_RATE) * (1 + VAT_RATE)
//
// This means the number the cashier types never changes when the SSCL toggle
// is flipped — only how that same final price is split between base / SSCL / VAT.
function computeItems(items, { applySscl } = {}) {
  const divisor = applySscl ? (1 + SSCL_RATE) * (1 + VAT_RATE) : (1 + VAT_RATE);

  return items.map((it) => {
    const qty = Number(it.qty);
    const unitPrice = Number(it.unitPrice);
    const lineFinal = qty * unitPrice; // what the customer pays for this line, unchanged by the SSCL toggle
    const lineExclusive = lineFinal / divisor; // base price before any tax
    const lineSscl = applySscl ? lineExclusive * SSCL_RATE : 0;
    const lineVat = lineFinal - lineExclusive - lineSscl;
    return {
      description: it.description,
      qty,
      unitPrice,
      lineExclusive,
      lineSscl,
      lineVat,
      lineInclusive: lineFinal,
    };
  });
}

// Computes invoice-level totals from already-computed line items.
// Discount is subtracted from the base (excl.) amount, then SSCL and VAT are
// recalculated on the discounted base — so a discount slightly changes the
// final total, same as it would with VAT alone.
function computeTotals(computedItems, { discount, applySscl } = {}) {
  const totalExclusive = computedItems.reduce((s, r) => s + r.lineExclusive, 0);
  const discountVal = Number(discount) || 0;
  const netExclusive = totalExclusive - discountVal;
  const ssclAmount = applySscl ? netExclusive * SSCL_RATE : 0;
  const subtotalWithSscl = netExclusive + ssclAmount;
  const vatAmount = subtotalWithSscl * VAT_RATE;
  const totalAmount = subtotalWithSscl + vatAmount;
  return { totalExclusive, discountVal, ssclAmount, subtotalWithSscl, vatAmount, totalAmount };
}

module.exports = { computeItems, computeTotals };