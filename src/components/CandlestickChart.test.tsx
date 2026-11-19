// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import App from "@/App";

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

it.each(["candles", "line"])("inspects the same OHLCV with the pointer and keys in the %s view", async (view) => {
  render(<App />);
  await screen.findByRole("img", { name: "Candlestick price and volume chart" });
  if (view === "line") fireEvent.click(screen.getByRole("button", { name: "Line" }));

  const chart = screen.getByRole("img", { name: /price and volume.*chart/i });
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

it("defaults to 3M and retains the selected view and its volume records as ranges change", async () => {
  render(<App />);
  await screen.findByRole("img", { name: "Candlestick price and volume chart" });

  const candles = () => document.querySelectorAll(".chart-candle");
  const volumeBars = () => document.querySelectorAll('[aria-label="Daily volume"] rect');
  expect(screen.getByRole("button", { name: "3M", pressed: true })).toBeTruthy();
  expect(candles()).toHaveLength(3);
  expect(volumeBars()).toHaveLength(3);
  expect(screen.getByText(/less than three months/i)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "1M" }));
  expect(candles()).toHaveLength(2);
  const candleVolumes = Array.from(volumeBars(), (bar) => [bar.getAttribute("x"), bar.getAttribute("height")]);
  fireEvent.click(screen.getByRole("button", { name: "Line" }));
  expect(candles()).toHaveLength(0);
  expect(Array.from(volumeBars(), (bar) => [bar.getAttribute("x"), bar.getAttribute("height")]))
    .toEqual(candleVolumes);

  fireEvent.click(screen.getByRole("button", { name: "3M" }));
  expect(screen.getByRole("button", { name: "Line", pressed: true })).toBeTruthy();
  expect(volumeBars()).toHaveLength(3);
});
