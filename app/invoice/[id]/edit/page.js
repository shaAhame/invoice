import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/session";
import { getInvoiceById } from "../../../../lib/db";
import EditInvoiceForm from "./EditInvoiceForm";

export default async function EditInvoicePageWrapper({ params }) {
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
        <p>You don't have access to edit this invoice.</p>
        <a href="/invoices" style={{ color: "#2563eb" }}>← Back to your invoices</a>
      </main>
    );
  }

  return <EditInvoiceForm />;
}
