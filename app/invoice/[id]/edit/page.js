"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PAYMENT_MODES } from "../../../../lib/branches";

function itemFromExisting(it) {
  return {
    id: Math.random().toString(36).slice(2),
    description: it.description,
    qty: it.qty,
    unitPrice: it.unitPrice,
    isMrp: it.isMrp !== undefined ? it.isMrp : true,
  };
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserAddress, setPurchaserAddress] = useState("");
  const [purchaserTp, setPurchaserTp] = useState("");
  const [purchaserTin, setPurchaserTin] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES[0]);
  const [discount, setDiscount] = useState("0");
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/invoices/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invoice");
        const inv = data.invoice;
        const parsedItems = typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items;
        setInvoiceNo(inv.invoice_no);
        setPurchaserName(inv.purchaser_name || "");
        setPurchaserAddress(inv.purchaser_address || "");
        setPurchaserTp(inv.purchaser_tp || "");
        setPurchaserTin(inv.purchaser_tin || "");
        setAdditionalInfo(inv.additional_info || "");
        setPaymentMode(inv.payment_mode || PAYMENT_MODES[0]);
        setDiscount(String(inv.discount || 0));
        setItems(parsedItems.map(itemFromExisting));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  const updateItem = (id, field, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  };
  const addItem = () =>
    setItems((prev) => [...prev, { id: Math.random().toString(36).slice(2), description: "", qty: 1, unitPrice: "", isMrp: true }]);
  const removeItem = (id) => setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));

  const VAT_RATE = 0.18;
  const rows = items.map((it) => {
    const qty = Number(it.qty) || 0;
    const unitPrice = Number(it.unitPrice) || 0;
    const lineRaw = qty * unitPrice;
    let lineExclusive, lineVat, lineInclusive;
    if (it.isMrp) {
      lineInclusive = lineRaw;
      lineExclusive = lineRaw / (1 + VAT_RATE);
      lineVat = lineInclusive - lineExclusive;
    } else {
      lineExclusive = lineRaw;
      lineVat = lineExclusive * VAT_RATE;
      lineInclusive = lineExclusive + lineVat;
    }
    return { ...it, qty, unitPrice, lineExclusive, lineVat, lineInclusive };
  });

  const totalExclusive = rows.reduce((s, r) => s + r.lineExclusive, 0);
  const discountVal = Number(discount) || 0;
  const netExclusive = totalExclusive - discountVal;
  const vatAmount = netExclusive * VAT_RATE;
  const totalAmount = netExclusive + vatAmount;

  const fmt = (n) => (isFinite(n) ? n.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00");

  const handleSubmit = async () => {
    setError("");
    const validItems = rows.filter((r) => r.description.trim() && r.qty > 0 && r.unitPrice > 0);
    if (validItems.length === 0) {
      setError("Add at least one item with a description, quantity and price.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaserName,
          purchaserAddress,
          purchaserTp,
          purchaserTin,
          additionalInfo,
          paymentMode,
          discount: discountVal,
          items: validItems.map((r) => ({ description: r.description, qty: r.qty, unitPrice: r.unitPrice, isMrp: r.isMrp })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save changes");
      router.push(`/invoice/${params.id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main style={{ padding: 24 }}>Loading...</main>;

  return (
    <main style={{ maxWidth: 940, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Edit Invoice {invoiceNo}</h1>
        <a href={`/invoice/${params.id}`} style={{ fontSize: 14, color: "#2563eb" }}>← Cancel</a>
      </div>

      <p style={{ fontSize: 13, color: "#666", marginBottom: 14 }}>
        Branch and invoice number can't be changed here — only the customer details, items and totals.
      </p>

      <div style={{ ...card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>Purchaser Name (optional)</label>
          <input style={input} value={purchaserName} onChange={(e) => setPurchaserName(e.target.value)} />
        </div>
        <div>
          <label style={label}>Purchaser Phone (optional)</label>
          <input style={input} value={purchaserTp} onChange={(e) => setPurchaserTp(e.target.value)} />
        </div>
        <div>
          <label style={label}>Purchaser TIN (optional)</label>
          <input style={input} value={purchaserTin} onChange={(e) => setPurchaserTin(e.target.value)} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={label}>Purchaser Address (optional)</label>
          <input style={input} value={purchaserAddress} onChange={(e) => setPurchaserAddress(e.target.value)} />
        </div>
      </div>

      <div style={card}>
        <label style={label}>Items</label>
        <p style={{ fontSize: 12, color: "#666", marginTop: -2, marginBottom: 8 }}>
          Tick <b>MRP</b> on a row if the price already includes 18% VAT. Leave it unticked to add VAT on top of the price typed.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 12, color: "#555" }}>
              <th style={th}>Description</th>
              <th style={th}>Qty</th>
              <th style={{ ...th, textAlign: "center" }}>MRP?</th>
              <th style={th}>Unit Price</th>
              <th style={th}>Excl. VAT</th>
              <th style={th}>VAT (18%)</th>
              <th style={th}>Line Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}><input style={cellInput} value={r.description} onChange={(e) => updateItem(r.id, "description", e.target.value)} /></td>
                <td style={td}><input style={{ ...cellInput, width: 60 }} type="number" min="0" value={r.qty} onChange={(e) => updateItem(r.id, "qty", e.target.value)} /></td>
                <td style={{ ...td, textAlign: "center" }}>
                  <input type="checkbox" checked={r.isMrp} onChange={(e) => updateItem(r.id, "isMrp", e.target.checked)} />
                </td>
                <td style={td}><input style={{ ...cellInput, width: 110 }} type="number" min="0" value={r.unitPrice} onChange={(e) => updateItem(r.id, "unitPrice", e.target.value)} /></td>
                <td style={{ ...td, fontSize: 13 }}>{fmt(r.lineExclusive)}</td>
                <td style={{ ...td, fontSize: 13 }}>{fmt(r.lineVat)}</td>
                <td style={{ ...td, fontSize: 13, fontWeight: 600 }}>{fmt(r.lineInclusive)}</td>
                <td style={td}><button onClick={() => removeItem(r.id)} style={removeBtn}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addItem} style={addBtn}>+ Add item</button>
      </div>

      <div style={{ ...card, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>Discount (Rs., excl. VAT basis, optional)</label>
          <input style={input} type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </div>
        <div>
          <label style={label}>Mode of Payment</label>
          <select style={input} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
            {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={label}>Additional Information (optional)</label>
          <input style={input} value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />
        </div>
      </div>

      <div style={{ ...card, background: "#fafafa" }}>
        <Row label="Total Value of Supply (excl. VAT)" value={fmt(totalExclusive)} />
        <Row label="Discount" value={fmt(discountVal)} />
        <Row label="VAT Amount (18%)" value={fmt(vatAmount)} />
        <Row label="Total Amount including VAT" value={fmt(totalAmount)} bold />
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>}

      <button onClick={handleSubmit} disabled={saving} style={submitBtn}>
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </main>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: bold ? 700 : 400, fontSize: bold ? 16 : 14 }}>
      <span>{label}</span>
      <span>Rs. {value}</span>
    </div>
  );
}

const card = { background: "#fff", borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const label = { display: "block", fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 6 };
const input = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" };
const th = { padding: "4px 6px", borderBottom: "1px solid #eee" };
const td = { padding: "4px 6px", borderBottom: "1px solid #f2f2f2" };
const cellInput = { width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" };
const addBtn = { marginTop: 10, background: "none", border: "1px dashed #999", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 };
const removeBtn = { background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 14 };
const submitBtn = { width: "100%", padding: "14px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: "pointer", marginBottom: 40 };
