import { getCache, setCache } from "@/services/cache";
import { isStockDataPoint, parseStockData } from "@/services/parseStockData";
import { StockApiError } from "@/types/error";
import type { StockData, StockInterval } from "@/types/stock";

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY ?? "demo";
const BASE_URL = "https://www.alphavantage.co/query";
const OBSERVATION_LIMIT = 100;
const REQUEST_SPACING_MS = 1_050;
const series = {
  daily: { endpoint: "TIME_SERIES_DAILY", responseKey: "Time Series (Daily)" },
  weekly: { endpoint: "TIME_SERIES_WEEKLY", responseKey: "Weekly Time Series" },
};
let nextRequestAt = 0;

export const fetchStockData = async (
  symbol: string,
  interval: StockInterval = "daily",
  signal?: AbortSignal,
): Promise<StockData> => {
  const date = new Date().toISOString().slice(0, 10);
  const cacheKey = interval === "daily" ? `${symbol}-${date}` : `${symbol}-${interval}-${date}`;
  const cached = getCache(cacheKey, (value): value is StockData =>
    isRecord(value) &&
    value.symbol === symbol &&
    Array.isArray(value.data) &&
    value.data.length > 0 &&
    value.data.every(isStockDataPoint) &&
    value.data.every((point, index, points) => index === 0 || points[index - 1].date < point.date),
  );
  if (cached) return { ...cached, data: cached.data.slice(-OBSERVATION_LIMIT) };

  const { endpoint, responseKey } = series[interval];
  const params = new URLSearchParams({
    function: endpoint,
    symbol,
    apikey: API_KEY,
  });
  if (interval === "daily") params.set("outputsize", "compact");

  let response: Response;
  try {
    // A cold ticker can need both its daily quote and its weekly history.
    let wait = nextRequestAt - performance.now();
    while (wait > 0 && !signal?.aborted) {
      await new Promise((resolve) => setTimeout(resolve, wait));
      wait = nextRequestAt - performance.now();
    }
    signal?.throwIfAborted();
    nextRequestAt = performance.now() + REQUEST_SPACING_MS;
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
      `Alpha Vantage did not return data for this key. Check your API key and access to ${interval} data.`,
    );
  }

  const data = parseStockData(json[responseKey]).slice(-OBSERVATION_LIMIT);
  const result: StockData = { symbol, data };
  if (data.length && !signal?.aborted) setCache(cacheKey, result);
  return result;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
