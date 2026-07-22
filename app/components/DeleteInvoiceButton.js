"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteInvoiceButton({ id, invoiceNo, redirectTo, style }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    const ok = window.confirm(
      `Permanently delete invoice ${invoiceNo}? This cannot be undone.`
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete invoice");

      if (data.counterReset) {
        window.alert(
          `Invoice ${invoiceNo} deleted. It was the most recent one for its branch, so the invoice number counter was rolled back — the next invoice generated will reuse ${invoiceNo}.`
        );
      } else {
        window.alert(`Invoice ${invoiceNo} deleted.`);
      }

      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    } catch (e) {
      window.alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={busy} style={style || defaultStyle}>
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}

const defaultStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
  border: "none",
  padding: "6px 12px",
  borderRadius: 6,
  fontSize: 13,
  cursor: "pointer",
};
