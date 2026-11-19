import type { StockDataPoint } from "@/types/stock";

export type StockRange = "1M" | "3M";

export function selectStockRange(data: readonly StockDataPoint[], range: StockRange) {
  const latest = data[data.length - 1];
  if (!latest) return { observations: [], shortened: false };

  const date = new Date(latest.date);
  const latestDay = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() - (range === "1M" ? 1 : 3), 1);
  const lastDayOfTargetMonth = new Date(date);
  lastDayOfTargetMonth.setUTCMonth(date.getUTCMonth() + 1, 0);
  date.setUTCDate(Math.min(latestDay, lastDayOfTargetMonth.getUTCDate()));
  const boundary = date.toISOString().slice(0, 10);

  return {
    observations: data.filter(({ date }) => date >= boundary),
    shortened: data[0].date > boundary,
  };
}
