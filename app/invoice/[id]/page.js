import { redirect } from "next/navigation";
import { getSession } from "../../../lib/session";
import { getInvoiceById } from "../../../lib/db";
import { BRANCHES } from "../../../lib/branches";
import { formatDate } from "../../../lib/formatDate";
import DeleteInvoiceButton from "../../components/DeleteInvoiceButton";
import LogoutButton from "../../components/LogoutButton";

function money(n) {
  return Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function InvoiceViewPage({ params }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const invoice = await getInvoiceById(params.id);
  if (!invoice) {
    return <main style={{ padding: 24 }}>Invoice not found.</main>;
  }

  const isAdmin = session.role === "admin";
  if (!isAdmin && invoice.branch_code !== session.branchCode) {
    return (
      <main style={{ padding: 24 }}>
        <p>You don't have access to this invoice.</p>
        <a href="/invoices" style={{ color: "#2563eb" }}>← Back to your invoices</a>
      </main>
    );
  }

  const branch = Object.values(BRANCHES).find((b) => b.code === invoice.branch_code);
  const items = typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items;

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "16px" }}>
      <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Invoice {invoice.invoice_no}</h1>
        <div className="header-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" style={btnPrimary}>Download PDF</a>
          <a href={`/invoice/${invoice.id}/edit`} style={btnSecondary}>Edit</a>
          <DeleteInvoiceButton id={invoice.id} invoiceNo={invoice.invoice_no} redirectTo="/invoices" style={btnDanger} />
          <a href="/" style={btnSecondary}>New Invoice</a>
          <LogoutButton style={btnSecondary} />
        </div>
      </div>

      <div style={card}>
        <p><b>Branch:</b> {branch?.label}</p>
        <p><b>Address:</b> {branch?.address}</p>
        <p><b>Telephone:</b> {branch?.tp}</p>
        <p><b>Date:</b> {formatDate(invoice.invoice_date)}</p>
        <p><b>Purchaser:</b> {invoice.purchaser_name || "Cash Sale"}</p>
        {invoice.purchaser_tin && <p><b>Purchaser TIN:</b> {invoice.purchaser_tin}</p>}
        {invoice.additional_info && <p><b>Additional Information:</b> {invoice.additional_info}</p>}
      </div>

      <div style={card}>
        <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: "left", fontSize: 12 }}>
                <th style={th}>Item</th>
                <th style={th}>Qty</th>
                <th style={th}>Unit Price</th>
                <th style={th}>Excl. VAT</th>
                <th style={th}>VAT (18%)</th>
                <th style={th}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td style={td}>{it.description}</td>
                  <td style={td}>{it.qty}</td>
                  <td style={td}>{money(it.unitPrice)}</td>
                  <td style={td}>{money(it.lineExclusive)}</td>
                  <td style={td}>{money(it.lineVat)}</td>
                  <td style={td}>{money(it.lineInclusive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...card, background: "#fafafa" }}>
        <Row label="Total Value of Supply (excl. VAT)" value={money(invoice.total_value)} />
        <Row label="Discount" value={money(invoice.discount)} />
        <Row label="VAT Amount (18%)" value={money(invoice.vat_amount)} />
        <Row label="Total Amount including VAT" value={money(invoice.total_amount)} bold />
      </div>
    </main>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: bold ? 700 : 400 }}>
      <span>{label}</span>
      <span>Rs. {value}</span>
    </div>
  );
}

const card = { background: "#fff", borderRadius: 10, padding: 16, marginBottom: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" };
const th = { padding: "4px 6px", borderBottom: "1px solid #eee" };
const td = { padding: "4px 6px", borderBottom: "1px solid #f2f2f2" };
const btnPrimary = { background: "#111827", color: "#fff", padding: "8px 14px", borderRadius: 6, textDecoration: "none", fontSize: 14 };
const btnSecondary = { background: "#e5e7eb", color: "#111", padding: "8px 14px", borderRadius: 6, textDecoration: "none", fontSize: 14, border: "none", cursor: "pointer" };
const btnDanger = { background: "#fee2e2", color: "#b91c1c", border: "none", padding: "8px 14px", borderRadius: 6, fontSize: 14, cursor: "pointer" };
