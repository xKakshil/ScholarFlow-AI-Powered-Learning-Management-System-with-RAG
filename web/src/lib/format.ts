export const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

export const formatPrice = (price: number) => (price > 0 ? rupees(price) : "Free");

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export const plural = (count: number, word: string, pluralWord = `${word}s`) =>
  `${count} ${count === 1 ? word : pluralWord}`;

export const initial = (text: string) => (text.trim().charAt(0) || "?").toUpperCase();

export function monthlySeries(dates: string[], months = 6, weights?: number[]) {
  const now = new Date();
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      longLabel: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      value: 0,
    };
  });
  dates.forEach((iso, i) => {
    const d = new Date(iso);
    const bucket = buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.value += weights ? weights[i] : 1;
  });
  return buckets;
}
