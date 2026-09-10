/** Restore only a local transaction-list destination, never an external URL. */
export function safeTransactionListUrl(value: string | null) {
  if (value === "/transactions") return value;
  if (value?.startsWith("/transactions?") && !/[\r\n]/.test(value)) return value;
  return "/transactions";
}

/** Groups adjacent dates without overriding the user's selected transaction order. */
export function groupAdjacentDates<T extends { transaction_date: string }>(items: T[]) {
  return items.reduce<Array<{ date: string; items: T[] }>>((groups, item) => {
    const previous = groups.at(-1);
    if (previous?.date === item.transaction_date) previous.items.push(item);
    else groups.push({ date: item.transaction_date, items: [item] });
    return groups;
  }, []);
}

/** Keep the pie a complete whole, aggregating only the visual breakdown. */
export function summarizeCategories<T extends { name: string; value: number }>(items: T[], limit = 6) {
  if (items.length <= limit) return items;
  const keep = Math.max(0, limit - 1);
  return [...items.slice(0, keep), {
    name: "Lainnya (gabungan)",
    value: items.slice(keep).reduce((total, item) => total + item.value, 0),
  }];
}
