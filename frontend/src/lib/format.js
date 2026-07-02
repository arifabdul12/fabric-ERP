// Indian numbering system formatter (lakhs, crores)
export function formatINR(value, opts = {}) {
  const { symbol = true, decimals = 2 } = opts;
  if (value === null || value === undefined || isNaN(value)) return symbol ? "₹0" : "0";
  const num = Number(value);
  const fixed = num.toFixed(decimals);
  const [whole, dec] = fixed.split(".");
  const sign = num < 0 ? "-" : "";
  const absWhole = whole.replace("-", "");
  let formatted;
  if (absWhole.length <= 3) {
    formatted = absWhole;
  } else {
    const last3 = absWhole.slice(-3);
    const rest = absWhole.slice(0, -3);
    formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
  }
  const decPart = decimals > 0 ? `.${dec}` : "";
  return `${symbol ? "₹" : ""}${sign}${formatted}${decPart}`;
}

export function formatMeters(m) {
  if (m === null || m === undefined) return "0 m";
  return `${Number(m).toFixed(2)} m`;
}

export function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Convert number to Indian words (paise-aware). Simple implementation.
export function inrInWords(num) {
  if (num === null || num === undefined || isNaN(num)) return "";
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function below100(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }
  function below1000(n) {
    if (n < 100) return below100(n);
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + below100(n % 100) : "");
  }
  function toWords(n) {
    if (n === 0) return "Zero";
    let result = "";
    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const rest = n;
    if (crore) result += below100(crore) + " Crore ";
    if (lakh) result += below100(lakh) + " Lakh ";
    if (thousand) result += below100(thousand) + " Thousand ";
    if (rest) result += below1000(rest);
    return result.trim();
  }
  let words = "Rupees " + toWords(rupees);
  if (paise) words += " and " + toWords(paise) + " Paise";
  return words + " Only";
}
