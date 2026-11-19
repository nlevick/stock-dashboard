// @vitest-environment jsdom
/// <reference types="vitest/jsdom" />

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "@/App";

const requestWait = { timeout: 2_500 };
const candleChartLabel = "Candlestick price and volume chart";

beforeEach(() => {
  vi.stubGlobal("localStorage", undefined);
  const days = [
    ["2025-03-12", 14, 16, 13, 15, 9000],
    ["2025-02-12", 12, 15, 11, 14, 8000],
    ["2025-01-10", 11, 13, 10, 12, 7000],
  ] as const;
  vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => Response.json({
    "Time Series (Daily)": Object.fromEntries(days.map(([date, open, high, low, close, volume]) => [
      date,
      { "1. open": String(open), "2. high": String(high), "3. low": String(low), "4. close": String(close), "5. volume": String(volume) },
    ])),
  })));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it.each([
  ["Candles", candleChartLabel],
  ["Bars", "OHLC price and volume bar chart"],
  ["Line", "Closing price and volume line chart"],
])("inspects the same OHLCV with the pointer and keys in the %s view", async (view, chartLabel) => {
  render(<App />);
  await screen.findByRole("img", { name: candleChartLabel }, requestWait);
  fireEvent.click(screen.getByRole("button", { name: view }));

  const chart = screen.getByRole("img", { name: chartLabel });
  const readout = screen.getByRole("group", { name: "Inspected observation" });
  const quote = screen.getByRole("group", { name: "Latest close" });
  const assertLatestQuote = () => {
    expect(within(quote).getByText("$15.00")).toBeTruthy();
    expect(within(quote).getByText("2025-03-12")).toBeTruthy();
  };

  expect(chart.tabIndex).toBe(0);
  chart.focus();
  fireEvent.keyDown(chart, { key: "ArrowLeft" });
  const expectedReadout = readout.textContent;
  expect(within(readout).getByText("2025-02-12")).toBeTruthy();
  for (const [label, value] of Object.entries({
    Open: "$12.00", High: "$15.00", Low: "$11.00", Close: "$14.00", Volume: "8,000",
  })) {
    expect(within(readout).getByText(label).textContent).toBe(`${label} ${value}`);
  }
  assertLatestQuote();

  fireEvent.keyDown(chart, { key: "End" });
  expect(within(readout).getByText("2025-03-12")).toBeTruthy();
  vi.spyOn(chart, "getBoundingClientRect").mockReturnValue(new DOMRect(10, 0, 640, 284));
  fireEvent(chart, new MouseEvent("pointermove", { bubbles: true, clientX: 300 }));
  expect(readout.textContent).toBe(expectedReadout);
  assertLatestQuote();

  fireEvent.keyDown(chart, { key: "Home" });
  fireEvent.keyDown(chart, { key: "ArrowLeft" });
  expect(within(readout).getByText("2025-01-10")).toBeTruthy();
  fireEvent.keyDown(chart, { key: "End" });
  fireEvent.keyDown(chart, { key: "ArrowRight" });
  expect(within(readout).getByText("2025-03-12")).toBeTruthy();
});

it("shows the latest 100 observations and reuses each ticker and interval independently", async () => {
  const storage = jsdom.window.localStorage;
  storage.clear();
  vi.stubGlobal("localStorage", storage);
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (request) => {
    const params = new URL(String(request)).searchParams;
    const weekly = params.get("function") === "TIME_SERIES_WEEKLY";
    const close = params.get("symbol") === "SPY" ? 15 : 25;
    const dates = Array.from({ length: 105 }, (_, index) =>
      new Date(Date.UTC(2025, 2, weekly ? 7 - 7 * index : 12 - index)).toISOString().slice(0, 10),
    );
    return Response.json({
      [weekly ? "Weekly Time Series" : "Time Series (Daily)"]: Object.fromEntries(dates.map((date) => [date, {
        "1. open": "12", "2. high": "30", "3. low": "11", "4. close": String(close), "5. volume": "20",
      }])),
    });
  });
  vi.stubGlobal("fetch", fetch);

  render(<App />);
  const ticker = screen.getByRole("group", { name: "Ticker" });
  expect(within(ticker).getAllByRole("button").map((button) => button.textContent)).toEqual(["SPY", "IBIT"]);
  expect(within(ticker).getByRole("button", { name: "SPY", pressed: true })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Daily", pressed: true })).toBeTruthy();
  const candleChart = await screen.findByRole("img", { name: candleChartLabel }, requestWait);
  const volumeMarks = (chart: HTMLElement, interval: "Daily" | "Weekly") =>
    chart.querySelectorAll(`[aria-label="${interval} volume"] rect`);
  expect(volumeMarks(candleChart, "Daily")).toHaveLength(100);
  fireEvent.keyDown(candleChart, { key: "Home" });
  const observation = screen.getByRole("group", { name: "Inspected observation" });
  expect(within(observation).getByText("2024-12-03")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Bars" }));
  const barLabel = "OHLC price and volume bar chart";
  expect(volumeMarks(screen.getByRole("img", { name: barLabel }), "Daily")).toHaveLength(100);
  expect(fetch).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "Weekly" }));
  const weekly = await screen.findByRole("img", { name: barLabel }, requestWait);
  expect(volumeMarks(weekly, "Weekly")).toHaveLength(100);
  expect(within(screen.getByRole("group", { name: "Inspected observation" })).getByText("2025-03-07")).toBeTruthy();
  expect(within(screen.getByRole("group", { name: "Latest close" })).getByText("2025-03-12")).toBeTruthy();

  fireEvent.click(within(ticker).getByRole("button", { name: "IBIT" }));
  await screen.findByRole("img", { name: barLabel }, requestWait);
  const ibitQuote = await screen.findByRole("group", { name: "Latest close" }, requestWait);
  expect(within(ibitQuote).getByText("$25.00")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Weekly", pressed: true })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Bars", pressed: true })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Daily" }));
  await screen.findByRole("img", { name: barLabel }, requestWait);
  fireEvent.click(within(ticker).getByRole("button", { name: "SPY" }));
  await screen.findByRole("img", { name: barLabel }, requestWait);
  fireEvent.click(screen.getByRole("button", { name: "Weekly" }));
  await screen.findByRole("img", { name: barLabel }, requestWait);

  expect(fetch.mock.calls.map(([request]) => {
    const params = new URL(String(request)).searchParams;
    return `${params.get("symbol")}:${params.get("function")}`;
  }).sort()).toEqual([
    "IBIT:TIME_SERIES_DAILY", "IBIT:TIME_SERIES_WEEKLY",
    "SPY:TIME_SERIES_DAILY", "SPY:TIME_SERIES_WEEKLY",
  ]);
}, 8_000);

it("draws the high–low stem with the open tick on the left and the close tick on the right", async () => {
  render(<App />);
  const candleChart = await screen.findByRole("img", { name: candleChartLabel }, requestWait);
  const candle = candleChart.querySelectorAll(".chart-candle")[2];
  const wick = candle.querySelector("line")!;
  const body = candle.querySelector("rect")!;
  const coordinates = ["x1", "x2", "y1", "y2"];
  const wickCoordinates = coordinates.map((coordinate) => wick.getAttribute(coordinate));
  const candleTop = Number(body.getAttribute("y"));
  const candleBottom = candleTop + Number(body.getAttribute("height"));

  fireEvent.click(screen.getByRole("button", { name: "Bars" }));
  const barChart = screen.getByRole("img", { name: "OHLC price and volume bar chart" });
  const bars = barChart.querySelectorAll(".chart-bar");
  expect(bars).toHaveLength(3);
  const lines = bars[2].querySelectorAll("line");
  expect(lines).toHaveLength(3);
  const [stem, open, close] = lines;

  expect(coordinates.map((coordinate) => stem.getAttribute(coordinate))).toEqual(wickCoordinates);
  const center = Number(stem.getAttribute("x1"));
  expect(Number(open.getAttribute("x1"))).toBeLessThan(center);
  expect(Number(open.getAttribute("x2"))).toBe(center);
  expect(Number(close.getAttribute("x1"))).toBe(center);
  expect(Number(close.getAttribute("x2"))).toBeGreaterThan(center);

  expect(Number(open.getAttribute("y1"))).toBeCloseTo(candleBottom);
  expect(open.getAttribute("y2")).toBe(open.getAttribute("y1"));
  expect(Number(close.getAttribute("y1"))).toBeCloseTo(candleTop);
  expect(close.getAttribute("y2")).toBe(close.getAttribute("y1"));
});
