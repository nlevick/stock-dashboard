import { expect, it } from "vitest";
import type { StockDataPoint } from "@/types/stock";
import { selectStockRange } from "@/utils/stockRange";

function observations(...dates: string[]): StockDataPoint[] {
  return dates.map((date) => ({ date, open: 12, high: 15, low: 11, close: 14, volume: 20 }));
}

it("uses inclusive 1M and 3M calendar boundaries anchored to the last observation", () => {
  const data = observations("2023-12-30", "2023-12-31", "2024-02-28", "2024-02-29", "2024-03-31");
  expect(selectStockRange(data, "1M")).toEqual({
    observations: data.slice(3), shortened: false,
  });
  expect(selectStockRange(data, "3M")).toEqual({
    observations: data.slice(1), shortened: false,
  });
});

it("returns the available records and flags history shorter than the selected range", () => {
  const data = observations("2025-02-10", "2025-03-07");
  expect(selectStockRange(data, "1M")).toEqual({ observations: data, shortened: true });
  expect(selectStockRange(data, "3M")).toEqual({ observations: data, shortened: true });
  expect(selectStockRange([], "3M")).toEqual({ observations: [], shortened: false });
});
