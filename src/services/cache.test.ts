// @vitest-environment jsdom
/// <reference types="vitest/jsdom" />

import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getCache, setCache } from "@/services/cache";
import { fetchStockData } from "@/services/stockApi";

const key = "SPY-2025-03-12";
const validPoint = { date: "2025-03-12", open: 12, high: 15, low: 11, close: 14, volume: 20 };
const valid = { symbol: "SPY", data: [validPoint] };
const envelope = {
  cachedAt: "2025-03-12T08:00:00.000Z",
  expiresAt: "2025-03-12T20:00:00.000Z",
  data: valid,
};

beforeEach(() => {
  const storage = jsdom.window.localStorage;
  storage.clear();
  vi.stubGlobal("localStorage", storage);
  vi.setSystemTime(new Date("2025-03-12T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("reuses a valid legacy cache entry", async () => {
  localStorage.setItem(key, JSON.stringify(envelope));
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);

  await expect(fetchStockData("SPY")).resolves.toEqual(valid);
  expect(fetch).not.toHaveBeenCalled();
});

it.each([
  ["expired exactly now", { ...envelope, expiresAt: "2025-03-12T12:00:00.000Z" }],
  ["invalid expiry", { ...envelope, expiresAt: "invalid" }],
  ["missing cache timestamp", { ...envelope, cachedAt: undefined }],
  ["reversed cache timestamps", { ...envelope, cachedAt: "2025-03-12T21:00:00.000Z" }],
  ["an empty legacy response", { ...envelope, data: { ...valid, data: [] } }],
  ["wrong symbol", { ...envelope, data: { ...valid, symbol: "IBIT" } }],
  ["malformed OHLCV", { ...envelope, data: { ...valid, data: [{ ...validPoint, low: null }] } }],
  ["duplicate dates", { ...envelope, data: { ...valid, data: [validPoint, validPoint] } }],
  ["missing payload", { ...envelope, data: undefined }],
])("fetches when the cache is %s", async (_, entry) => {
  localStorage.setItem(key, JSON.stringify(entry));
  const fetch = vi.fn().mockResolvedValue(Response.json({ "Time Series (Daily)": {} }));
  vi.stubGlobal("fetch", fetch);

  await expect(fetchStockData("SPY")).resolves.toEqual({ symbol: "SPY", data: [] });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("treats invalid JSON and storage access failures as cache misses", () => {
  const isString = (value: unknown): value is string => typeof value === "string";
  localStorage.setItem(key, "{");
  expect(getCache(key, isString)).toBeNull();

  vi.spyOn(jsdom.window.Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("Storage unavailable", "SecurityError");
  });
  vi.spyOn(jsdom.window.Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Storage full", "QuotaExceededError");
  });
  expect(getCache(key, isString)).toBeNull();
  expect(() => setCache(key, "data")).not.toThrow();
});
