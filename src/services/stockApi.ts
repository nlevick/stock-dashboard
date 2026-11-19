import { getCache, setCache } from "@/services/cache";
import { isStockDataPoint, parseStockData } from "@/services/parseStockData";
import { StockApiError } from "@/types/error";
import type { StockData } from "@/types/stock";

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY ?? "demo";
const BASE_URL = "https://www.alphavantage.co/query";

export const fetchStockData = async (
  symbol: string,
  signal?: AbortSignal,
): Promise<StockData> => {
  const cacheKey = `${symbol}-${new Date().toISOString().slice(0, 10)}`;
  const cached = getCache(cacheKey, (value): value is StockData =>
    isRecord(value) &&
    value.symbol === symbol &&
    Array.isArray(value.data) &&
    value.data.length > 0 &&
    value.data.every(isStockDataPoint) &&
    value.data.every((point, index, points) => index === 0 || points[index - 1].date < point.date),
  );
  if (cached) return cached;

  const params = new URLSearchParams({
    function: "TIME_SERIES_DAILY",
    symbol,
    apikey: API_KEY,
  });

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}?${params}`, { signal });
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

  const providerMessage = json["Information"] ?? json["Note"];
  if (typeof providerMessage === "string") {
    if (/per second|burst|spread out/i.test(providerMessage)) {
      throw new StockApiError("RATE_LIMITED", "Requests are too close together. Wait a moment and retry.");
    }
    if (/per day|daily.{0,20}(?:limit|quota)|(?:rate|frequency|quota) limit/i.test(providerMessage)) {
      throw new StockApiError("RATE_LIMITED", "Daily API limit reached. Retry after the quota resets or use your own key.");
    }
    throw new StockApiError(
      "ACCESS_RESTRICTED",
      "Alpha Vantage did not return data for this key. Check your API key and daily-data access.",
    );
  }

  const data = parseStockData(json["Time Series (Daily)"]);
  const result: StockData = { symbol, data };
  if (data.length && !signal?.aborted) setCache(cacheKey, result);
  return result;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
