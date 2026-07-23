// Central branch configuration.
// To add/edit a branch, just edit this list — nothing else in the app needs to change.

export const SUPPLIER_NAME = "IDEALZ LANKA PRIVATE LIMITED";
export const SUPPLIER_TIN = "174008078-7000";

export const BRANCHES = {
  prime: {
    code: "IDPR",
    label: "iDealz Prime",
    address: "No. 86, Galle Road, Colombo 04",
    tp: "077 724 3243",
  },
  liberty: {
    code: "IDLB",
    label: "iDealz Liberty",
    address: "01-64 First Floor, Liberty Plaza, Colombo 03",
    tp: "0777655565",
  },
  marino: {
    code: "IDMA",
    label: "iDealz Marino",
    address: "No. 590 - 9A, Ground Floor, Marino Mall, Colombo 03",
    tp: "0777656565",
  },
};

// Starting invoice numbers, per your instructions.
// Format: YYMMM-BRANCHCODE-NNNNN  e.g. 26JUL-IDMA-00144
// The first invoice generated for a branch in a given month will use this number,
// then auto-increment by 1 for every invoice after that (per branch, per month).
export const STARTING_NUMBERS = {
  IDMA: 144,
  IDLB: 138,
  IDPR: 123,
};

export const VAT_RATE = 0.18;

export const PAYMENT_MODES = [
  "FULL CASH",
  "BANK TRANSFER",
  "FULL CARD",
  "CASH + CARD",
  "CASH + BANK TRANSFER",
  "CARD + BANK TRANSFER",
];

// Looks up the branch key ("prime", "liberty", "marino") from its code ("IDPR").
// Used by the login system to turn a session's branchCode back into a branch entry.
export function getBranchKeyByCode(code) {
  const entry = Object.entries(BRANCHES).find(([, b]) => b.code === code);
  return entry ? entry[0] : null;
}
