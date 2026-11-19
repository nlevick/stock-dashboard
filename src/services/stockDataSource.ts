import { fetchStockData } from "@/services/stockApi";
import type { InstrumentSymbol } from "@/data/instruments";
import type { StockData } from "@/types/stock";

export interface StockDataResult extends StockData {
  source: string;
  asOf: string | null;
}

export async function loadStockData(
  symbol: InstrumentSymbol,
  signal?: AbortSignal,
): Promise<StockDataResult> {
  const result = await fetchStockData(symbol, signal);
  return {
    ...result,
    source: "Alpha Vantage",
    asOf: result.data[result.data.length - 1]?.date ?? null,
  };
}
