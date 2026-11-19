import { StockApiError } from "@/types/error";
import type { StockDataPoint } from "@/types/stock";

export function parseStockData(
  timeSeries: unknown,
): StockDataPoint[] {
  if (!isRecord(timeSeries)) {
    throw new StockApiError(
      "PARSE_ERROR",
      "No time series data returned from API",
    );
  }

  return Object.entries(timeSeries)
    .map(([date, values]) => {
      if (!isRecord(values)) {
        throw new StockApiError(
          "PARSE_ERROR",
          `Malformed data for date ${date}`,
        );
      }
      return {
        date,
        open: parseFloat(values["1. open"] as string),
        high: parseFloat(values["2. high"] as string),
        low: parseFloat(values["3. low"] as string),
        close: parseFloat(values["4. close"] as string),
        volume: parseInt(values["5. volume"] as string, 10),
      };
    })
    .reverse();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
