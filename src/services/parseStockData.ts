import { StockApiError } from "@/types/error";
import type { StockDataPoint } from "@/types/stock";

const DAILY_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL = /^(?:\d+(?:\.\d+)?|\.\d+)$/;

export function parseStockData(timeSeries: unknown): StockDataPoint[] {
  if (!isRecord(timeSeries)) {
    throw new StockApiError(
      "PARSE_ERROR",
      "No time series data returned from API",
    );
  }

  return Object.entries(timeSeries)
    .map(([date, values]) => {
      const fields = isRecord(values) ? values : {};
      const point = {
        date,
        open: parseNumber(fields["1. open"]),
        high: parseNumber(fields["2. high"]),
        low: parseNumber(fields["3. low"]),
        close: parseNumber(fields["4. close"]),
        volume: parseNumber(fields["5. volume"]),
      };

      if (!isStockDataPoint(point)) {
        throw new StockApiError("PARSE_ERROR", `Malformed data for date ${date}`);
      }
      return point;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function isStockDataPoint(value: unknown): value is StockDataPoint {
  if (!isRecord(value)) return false;

  const { date, open, high, low, close, volume } = value;
  return (
    isDailyDate(date) &&
    isFiniteNumber(open) &&
    isFiniteNumber(high) &&
    isFiniteNumber(low) &&
    isFiniteNumber(close) &&
    isFiniteNumber(volume) &&
    Number.isSafeInteger(volume) &&
    volume >= 0 &&
    low > 0 &&
    low <= Math.min(open, close) &&
    high >= Math.max(open, close)
  );
}

function isDailyDate(value: unknown): value is string {
  if (typeof value !== "string" || !DAILY_DATE.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseNumber(value: unknown): number {
  return typeof value === "string" && DECIMAL.test(value) ? Number(value) : NaN;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
