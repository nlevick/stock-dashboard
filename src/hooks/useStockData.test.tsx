// @vitest-environment jsdom

import { StrictMode } from "react";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { InstrumentSymbol } from "@/data/instruments";
import { useStockData } from "@/hooks/useStockData";

function dailyResponse(date: string) {
  return Response.json({
    "Time Series (Daily)": {
      [date]: { "1. open": "12", "2. high": "15", "3. low": "11", "4. close": "14", "5. volume": "20" },
    },
  });
}

beforeEach(() => vi.stubGlobal("localStorage", undefined));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function deferredResponse() {
  let resolve!: (response: Response) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Response>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

it.each(["resolve", "reject"] as const)(
  "keeps the newer selection when the older request settles via %s",
  async (outcome) => {
    const older = deferredResponse();
    const newer = deferredResponse();
    const fetch = vi.fn<typeof globalThis.fetch>()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    vi.stubGlobal("fetch", fetch);

    const { result, rerender } = renderHook(
      ({ symbol }: { symbol: InstrumentSymbol }) => useStockData(symbol),
      { initialProps: { symbol: "SPY" } },
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    rerender({ symbol: "GDX" });
    expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(result.current).toMatchObject({ loading: true, stockData: null, error: null });

    if (outcome === "reject") {
      await act(async () => older.reject(new Error("old failure")));
      expect(result.current).toMatchObject({ loading: true, stockData: null, error: null });
    }
    await act(async () => newer.resolve(dailyResponse("2025-03-12")));
    if (outcome === "resolve") {
      await act(async () => older.resolve(dailyResponse("2025-03-11")));
    }
    expect(result.current).toMatchObject({
      loading: false, error: null, stockData: { symbol: "GDX", asOf: "2025-03-12" },
    });
  },
);

it("clears the old quote, retries the current symbol, and recovers from burst throttling", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(dailyResponse("2025-03-11"))
    .mockResolvedValueOnce(Response.json({ Information: "Please spread out your requests (1 per second)." }))
    .mockResolvedValueOnce(dailyResponse("2025-03-12"));
  vi.stubGlobal("fetch", fetch);

  const { result, rerender } = renderHook(
    ({ symbol }: { symbol: InstrumentSymbol }) => useStockData(symbol),
    { initialProps: { symbol: "SPY" }, wrapper: StrictMode },
  );
  await waitFor(() => expect(result.current.stockData?.symbol).toBe("SPY"));

  rerender({ symbol: "IBIT" });
  expect(result.current).toMatchObject({ loading: true, stockData: null, error: null });
  await waitFor(() => expect(result.current.error).toMatchObject({
    code: "RATE_LIMITED", message: expect.stringContaining("Wait a moment"),
  }));

  act(() => result.current.retry());
  expect(result.current).toMatchObject({ loading: true, stockData: null, error: null });
  await waitFor(() => expect(result.current).toMatchObject({
    loading: false, error: null, stockData: { symbol: "IBIT", asOf: "2025-03-12" },
  }));
  expect(fetch.mock.calls.map(([url]) => new URL(String(url)).searchParams.get("symbol")))
    .toEqual(["SPY", "IBIT", "IBIT"]);
});

it.each([
  ["Our standard API rate limit is 25 requests per day.", "RATE_LIMITED"],
  ["This is a premium endpoint. Please subscribe.", "ACCESS_RESTRICTED"],
])("classifies provider feedback for %s", async (Information, code) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ Information })));
  const { result } = renderHook(() => useStockData("SPY"));

  await waitFor(() => expect(result.current.error?.code).toBe(code));
});
