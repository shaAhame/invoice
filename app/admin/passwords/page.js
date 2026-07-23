import { redirect } from "next/navigation";
import { getSession } from "../../../lib/session";
import AdminPasswordsForm from "./AdminPasswordsForm";

export default async function AdminPasswordsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role !== "admin") {
    return (
      <main style={{ padding: 24 }}>
        <p>Admin access required.</p>
        <a href="/" style={{ color: "#2563eb" }}>← Back</a>
      </main>
    );
  }

  return <AdminPasswordsForm />;
}
