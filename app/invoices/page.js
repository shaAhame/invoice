import { redirect } from "next/navigation";
import { getSession } from "../../lib/session";
import { listInvoices } from "../../lib/db";
import { BRANCHES } from "../../lib/branches";
import { formatDate } from "../../lib/formatDate";
import DeleteInvoiceButton from "../components/DeleteInvoiceButton";
import LogoutButton from "../components/LogoutButton";

function money(n) {
  return Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function InvoicesListPage({ searchParams }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "admin";
  // Branch users are always locked to their own branch, no matter what's in the URL.
  const branchCode = isAdmin ? searchParams?.branch : session.branchCode;

  const invoices = await listInvoices({ branchCode });
  const totalSales = invoices.reduce((s, inv) => s + Number(inv.total_amount), 0);
  const totalVat = invoices.reduce((s, inv) => s + Number(inv.vat_amount), 0);

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "16px" }}>
      <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Invoice History</h1>
        <div className="header-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isAdmin && <a href="/admin/passwords" style={{ fontSize: 14, color: "#2563eb" }}>Manage Passwords</a>}
          <a href="/" style={{ fontSize: 14, color: "#2563eb" }}>+ New Invoice</a>
          <LogoutButton />
        </div>
      </div>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <StatCard label="Invoices" value={invoices.length} />
        <StatCard label="Total Sales (Rs.)" value={money(totalSales)} />
        <StatCard label="Total VAT Collected (Rs.)" value={money(totalVat)} />
      </div>

      {isAdmin ? (
        <div style={{ marginBottom: 12, fontSize: 13 }}>
          Filter:{" "}
          <a href="/invoices" style={{ marginRight: 10 }}>All</a>
          {Object.values(BRANCHES).map((b) => (
            <a key={b.code} href={`/invoices?branch=${b.code}`} style={{ marginRight: 10 }}>{b.label}</a>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
          Showing invoices for your branch only.
        </p>
      )}

      <div className="table-scroll">
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, minWidth: 640 }}>
          <thead>
            <tr style={{ textAlign: "left", background: "#f3f4f6", fontSize: 12 }}>
              <th style={th}>Invoice No</th>
              <th style={th}>Date</th>
              <th style={th}>Branch</th>
              <th style={th}>Purchaser</th>
              <th style={th}>Total (Rs.)</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td style={td}>{inv.invoice_no}</td>
                <td style={td}>{formatDate(inv.invoice_date)}</td>
                <td style={td}>{inv.branch_code}</td>
                <td style={td}>{inv.purchaser_name || "Cash Sale"}</td>
                <td style={td}>{money(inv.total_amount)}</td>
                <td style={{ ...td, whiteSpace: "nowrap" }}>
                  <a href={`/invoice/${inv.id}`} style={{ marginRight: 10 }}>View</a>
                  <a href={`/invoice/${inv.id}/edit`} style={{ marginRight: 10 }}>Edit</a>
                  <DeleteInvoiceButton id={inv.id} invoiceNo={inv.invoice_no} style={rowDeleteBtn} />
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr><td style={td} colSpan={6}>No invoices yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

const th = { padding: "8px 10px", fontSize: 12 };
const td = { padding: "8px 10px", borderTop: "1px solid #f0f0f0", fontSize: 13 };
const rowDeleteBtn = { background: "none", border: "none", color: "#b91c1c", cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" };
