import { getCache, setCache } from "@/services/cache";
import { StockApiError } from "@/types/error";
import type { StockData, StockDataPoint } from "@/types/stock";

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY ?? "demo";
const BASE_URL = "https://www.alphavantage.co/query";

export const fetchStockData = async (
  symbol: string,
  signal?: AbortSignal,
): Promise<StockData> => {
  const cacheKey = `${symbol}-${new Date().toISOString().slice(0, 10)}`;
  const cached = getCache<StockData>(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`;

  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new StockApiError("NETWORK_ERROR", "Network request failed");
  }

  if (!response.ok) {
    throw new StockApiError(
      "HTTP_ERROR",
      `HTTP ${response.status}: ${response.statusText}`,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new StockApiError("PARSE_ERROR", "Failed to parse API response");
  }

  if (!isRecord(json)) {
    throw new StockApiError("PARSE_ERROR", "Unexpected API response shape");
  }

  if (typeof json["Error Message"] === "string") {
    throw new StockApiError("INVALID_SYMBOL", `Unknown symbol: ${symbol}`);
  }

  if (
    typeof json["Note"] === "string" ||
    typeof json["Information"] === "string"
  ) {
    throw new StockApiError(
      "RATE_LIMITED",
      "API rate limit reached. Please wait or use your own API key.",
    );
  }

  const timeSeries = json["Time Series (Daily)"];
  if (!isRecord(timeSeries)) {
    throw new StockApiError(
      "PARSE_ERROR",
      "No time series data returned from API",
    );
  }

  const data: StockDataPoint[] = Object.entries(timeSeries)
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

  const result: StockData = { symbol, data };
  setCache(cacheKey, result);
  return result;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
