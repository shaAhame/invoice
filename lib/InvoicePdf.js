import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { SUPPLIER_NAME, SUPPLIER_TIN } from "./branches";
import { formatDate } from "./formatDate";

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#111" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  logo: { width: 130, height: 60, objectFit: "contain" },
  titleBox: { border: "1px solid #000", padding: "6px 18px" },
  titleText: { fontSize: 14, fontWeight: 700 },
  infoGrid: { flexDirection: "row", marginBottom: 10 },
  infoCol: { flex: 1, border: "1px solid #000" },
  infoRow: { flexDirection: "row", borderBottom: "1px solid #000" },
  infoLabel: { width: "42%", padding: 4, borderRight: "1px solid #000", fontWeight: 700, fontSize: 8 },
  infoValue: { flex: 1, padding: 4, fontSize: 8 },
  table: { border: "1px solid #000", marginBottom: 10 },
  tRow: { flexDirection: "row", borderBottom: "1px solid #000" },
  tHeadCell: { padding: 4, fontWeight: 700, fontSize: 8, borderRight: "1px solid #000" },
  tCell: { padding: 4, fontSize: 8, borderRight: "1px solid #000" },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.3, textAlign: "right" },
  colVat: { flex: 1.1, textAlign: "right" },
  colAmt: { flex: 1.3, textAlign: "right" },
  totalsBox: { border: "1px solid #000", marginBottom: 10 },
  totalsRow: { flexDirection: "row", borderBottom: "1px solid #000" },
  totalsLabel: { flex: 3, padding: 4, fontSize: 8 },
  totalsValue: { flex: 1.3, padding: 4, fontSize: 8, textAlign: "right", borderLeft: "1px solid #000" },
  wordsBox: { border: "1px solid #000", padding: 5, fontSize: 8, marginBottom: 10 },
  infoNoteBox: { border: "1px solid #000", padding: 5, fontSize: 8, marginBottom: 10 },
  footerRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 24 },
  small: { fontSize: 7, color: "#444" },
});

function money(n) {
  return Number(n || 0).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvoicePdf({ invoice, branch, logoDataUrl }) {
  const items = typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items;
  const hasSscl = Number(invoice.sscl_amount) > 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {logoDataUrl ? <Image src={logoDataUrl} style={styles.logo} /> : <Text style={{ fontSize: 16, fontWeight: 700 }}>{branch.label}</Text>}
          <View style={styles.titleBox}>
            <Text style={styles.titleText}>TAX INVOICE</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Invoice</Text>
              <Text style={styles.infoValue}>{formatDate(invoice.invoice_date)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Supplier's TIN</Text>
              <Text style={styles.infoValue}>{SUPPLIER_TIN}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Supplier's Name</Text>
              <Text style={styles.infoValue}>{SUPPLIER_NAME}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{branch.address}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottom: "none" }]}>
              <Text style={styles.infoLabel}>Telephone No</Text>
              <Text style={styles.infoValue}>{branch.tp}</Text>
            </View>
          </View>
          <View style={[styles.infoCol, { borderLeft: "none" }]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tax Invoice No</Text>
              <Text style={styles.infoValue}>{invoice.invoice_no}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Purchaser's TIN</Text>
              <Text style={styles.infoValue}>{invoice.purchaser_tin || "-"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Purchaser's Name</Text>
              <Text style={styles.infoValue}>{invoice.purchaser_name || "Cash Sale"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{invoice.purchaser_address || "-"}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottom: "none" }]}>
              <Text style={styles.infoLabel}>Telephone No</Text>
              <Text style={styles.infoValue}>{invoice.purchaser_tp || "-"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tRow}>
            <Text style={[styles.tHeadCell, styles.colDesc]}>Description of Goods and Services</Text>
            <Text style={[styles.tHeadCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tHeadCell, styles.colPrice]}>Unit Price (final)</Text>
            <Text style={[styles.tHeadCell, styles.colPrice]}>Amount Excl. VAT</Text>
            {hasSscl && <Text style={[styles.tHeadCell, styles.colVat]}>SSCL (2.5%)</Text>}
            <Text style={[styles.tHeadCell, styles.colVat]}>VAT (18%)</Text>
            <Text style={[styles.tHeadCell, styles.colAmt, { borderRight: "none" }]}>Amount Incl. VAT</Text>
          </View>
          {items.map((it, idx) => (
            <View style={styles.tRow} key={idx}>
              <Text style={[styles.tCell, styles.colDesc]}>{it.description}</Text>
              <Text style={[styles.tCell, styles.colQty]}>{it.qty}</Text>
              <Text style={[styles.tCell, styles.colPrice]}>{money(it.unitPrice)}</Text>
              <Text style={[styles.tCell, styles.colPrice]}>{money(it.lineExclusive)}</Text>
              {hasSscl && <Text style={[styles.tCell, styles.colVat]}>{money(it.lineSscl)}</Text>}
              <Text style={[styles.tCell, styles.colVat]}>{money(it.lineVat)}</Text>
              <Text style={[styles.tCell, styles.colAmt, { borderRight: "none" }]}>{money(it.lineInclusive)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Total Value of Supply (excl. VAT)</Text>
            <Text style={styles.totalsValue}>{money(invoice.total_value)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Discount</Text>
            <Text style={styles.totalsValue}>{money(invoice.discount)}</Text>
          </View>
          {hasSscl && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>SSCL (2.5%)</Text>
              <Text style={styles.totalsValue}>{money(invoice.sscl_amount)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>VAT Amount (18%)</Text>
            <Text style={styles.totalsValue}>{money(invoice.vat_amount)}</Text>
          </View>
          <View style={[styles.totalsRow, { borderBottom: "none" }]}>
            <Text style={[styles.totalsLabel, { fontWeight: 700 }]}>Total Amount including VAT</Text>
            <Text style={[styles.totalsValue, { fontWeight: 700 }]}>{money(invoice.total_amount)}</Text>
          </View>
        </View>

        <View style={styles.wordsBox}>
          <Text><Text style={{ fontWeight: 700 }}>Total Amount in Words: </Text>{invoice.amount_words}</Text>
        </View>

        {invoice.additional_info ? (
          <View style={styles.infoNoteBox}>
            <Text><Text style={{ fontWeight: 700 }}>Additional Information: </Text>{invoice.additional_info}</Text>
          </View>
        ) : null}

        <Text style={styles.small}>Mode of Payment: {invoice.payment_mode}</Text>

        <View style={styles.footerRow}>
          <Text style={styles.small}>Authorized Signature: ______________________</Text>
        </View>
      </Page>
    </Document>
  );
}