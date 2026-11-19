import { fetchStockData } from "@/services/stockApi";
import type { InstrumentSymbol } from "@/data/instruments";
import type { StockData, StockInterval } from "@/types/stock";

export interface StockDataResult extends StockData {
  source: string;
  asOf: string | null;
}

export async function loadStockData(
  symbol: InstrumentSymbol,
  interval: StockInterval = "daily",
  signal?: AbortSignal,
): Promise<StockDataResult> {
  const result = await fetchStockData(symbol, interval, signal);
  return {
    ...result,
    source: "Alpha Vantage",
    asOf: result.data[result.data.length - 1]?.date ?? null,
  };
}
