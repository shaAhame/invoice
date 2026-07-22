const ONES = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

function threeDigits(n) {
  let str = "";
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + " HUNDRED ";
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + " ";
    n %= 10;
  }
  if (n > 0) {
    str += ONES[n] + " ";
  }
  return str.trim();
}

function integerToWords(num) {
  if (num === 0) return "ZERO";
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const rest = num;

  let parts = [];
  if (crore) parts.push(threeDigits(crore) + " CRORE");
  if (lakh) parts.push(threeDigits(lakh) + " LAKH");
  if (thousand) parts.push(threeDigits(thousand) + " THOUSAND");
  if (rest) parts.push(threeDigits(rest));

  return parts.join(" ").trim();
}

// Converts a rupee amount (number, may have decimals) into Sri Lankan style words.
// e.g. 1662884.20 -> "ONE MILLION SIX HUNDRED SIXTY TWO THOUSAND EIGHT HUNDRED EIGHTY FOUR AND CENTS TWENTY ONLY"
// Note: your sample invoice used the international scale (MILLION) rather than lakh/crore,
// so we mirror that by default. Set useLakhCrore=true if you prefer lakh/crore wording.
export function amountToWords(amount, useLakhCrore = false) {
  const rupees = Math.floor(amount);
  const cents = Math.round((amount - rupees) * 100);

  let rupeeWords;
  if (useLakhCrore) {
    rupeeWords = integerToWords(rupees);
  } else {
    rupeeWords = integerToWordsInternational(rupees);
  }

  let result = rupeeWords;
  if (cents > 0) {
    result += " AND CENTS " + integerToWordsInternational(cents);
  }
  return result + " ONLY";
}

function integerToWordsInternational(num) {
  if (num === 0) return "ZERO";
  const billion = Math.floor(num / 1000000000);
  num %= 1000000000;
  const million = Math.floor(num / 1000000);
  num %= 1000000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const rest = num;

  let parts = [];
  if (billion) parts.push(threeDigits(billion) + " BILLION");
  if (million) parts.push(threeDigits(million) + " MILLION");
  if (thousand) parts.push(threeDigits(thousand) + " THOUSAND");
  if (rest) parts.push(threeDigits(rest));

  return parts.join(" ").trim();
}
