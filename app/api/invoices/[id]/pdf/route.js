export const runtime = "nodejs";

import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import fs from "fs";
import path from "path";
import { getInvoiceById } from "../../../../../lib/db";
import { BRANCHES } from "../../../../../lib/branches";
import InvoicePdf from "../../../../../lib/InvoicePdf";

function getBranchByCode(code) {
  return Object.values(BRANCHES).find((b) => b.code === code);
}

function getLogoDataUrl() {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo.png");
    const buf = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null; // logo.png not added yet — PDF will fall back to text
  }
}

export async function GET(req, { params }) {
  const invoice = await getInvoiceById(params.id);
  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }
  const branch = getBranchByCode(invoice.branch_code);
  const logoDataUrl = getLogoDataUrl();

  const buffer = await renderToBuffer(
    React.createElement(InvoicePdf, { invoice, branch, logoDataUrl })
  );

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoice_no}.pdf"`,
    },
  });
}
