import { redirect } from "next/navigation";
import { getSession } from "../lib/session";
import { getBranchKeyByCode } from "../lib/branches";
import NewInvoiceForm from "./NewInvoiceForm";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isAdmin = session.role === "admin";
  const lockedBranchKey = isAdmin ? null : getBranchKeyByCode(session.branchCode);

  return <NewInvoiceForm isAdmin={isAdmin} lockedBranchKey={lockedBranchKey} />;
}
