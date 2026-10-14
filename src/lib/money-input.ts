/**
 * Money fields keep the raw amount ("1440.5") in state, which `parseMoney`
 * reads, and show it formatted ("$1,440.5") as the person types.
 */

/** Typed or pasted text back to a raw amount: digits, one dot, two decimals. */
export function cleanAmount(text: string) {
  const [whole, ...rest] = text.replace(/[^\d.]/g, "").split(".");
  const dollars = whole.replace(/^0+(?=\d)/, "").slice(0, 7);
  if (!rest.length) return dollars;
  return (dollars || "0") + "." + rest.join("").slice(0, 2);
}

/** A raw amount as currency, keeping a trailing dot or zero mid-typing. */
export function formatAmount(raw: string) {
  if (!raw) return "";
  const [dollars, cents] = raw.split(".");
  const grouped = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return "$" + grouped + (cents === undefined ? "" : "." + cents);
}

/** Cents as a raw amount, without trailing ".00". */
export const amountOf = (cents: number) =>
  cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
