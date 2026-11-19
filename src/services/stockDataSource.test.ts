import { afterEach, expect, it, vi } from "vitest";
import { instruments } from "@/data/instruments";
import { loadStockData } from "@/services/stockDataSource";

afterEach(() => vi.unstubAllGlobals());

it("requests daily data for each curated ETF and reports observation provenance", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async () =>
    Response.json({
      "Time Series (Daily)": {
        "2025-03-12": {
          "1. open": "12", "2. high": "15", "3. low": "11", "4. close": "14", "5. volume": "20",
        },
      },
    }),
  );
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("localStorage", { getItem: () => null, setItem: () => undefined });

  expect(instruments.map(({ symbol }) => symbol)).toEqual(["SPY", "IBIT"]);
  for (const { symbol } of instruments) {
    await expect(loadStockData(symbol)).resolves.toEqual({
      symbol,
      source: "Alpha Vantage",
      asOf: "2025-03-12",
      data: [{ date: "2025-03-12", open: 12, high: 15, low: 11, close: 14, volume: 20 }],
    });
  }

  expect(fetch.mock.calls.map(([request]) => {
    const url = new URL(String(request));
    return [url.searchParams.get("function"), url.searchParams.get("symbol")];
  })).toEqual([
    ["TIME_SERIES_DAILY", "SPY"],
    ["TIME_SERIES_DAILY", "IBIT"],
  ]);
});
