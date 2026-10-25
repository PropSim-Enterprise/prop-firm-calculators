const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole dollars for amounts of $100 or more, cents below that. */
export function money(n: number): string {
  if (!Number.isFinite(n)) return "never";
  return Math.abs(n) >= 100 ? usd0.format(n) : usd2.format(n);
}

export function percent(n: number, digits = 1): string {
  return Number.isFinite(n) ? `${n.toFixed(digits).replace(/\.0+$/, "")}%` : "–";
}

export function count(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "never";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
