// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { StockTable } from "@/components/StockTable";
import type { StockDataPoint } from "@/types/stock";

const observations: StockDataPoint[] = [
  { date: "2025-01-01", close: 12, volume: 12000 },
  { date: "2024-12-10", close: 2, volume: 2000 },
  { date: "2025-01-03", close: 32, volume: 32000 },
  { date: "2024-12-02", close: 9, volume: 9000 },
  { date: "2025-01-02", close: 100, volume: 100000 },
  { date: "2024-12-30", close: 21, volume: 21000 },
  { date: "2025-01-04", close: 3, volume: 3000 },
].map((row) => ({ ...row, open: row.close, high: row.close + 1, low: row.close - 1 }));

afterEach(cleanup);

it("sorts dates across years and numeric fields in both directions", () => {
  render(<StockTable observations={observations} />);
  const table = within(screen.getByRole("table", { name: "Historical prices" }));
  const dates = () => table.getAllByRole("rowheader").map((cell) => cell.textContent);
  const closePrices = () => table.getAllByRole("row").slice(1).map((row) =>
    within(row).getAllByRole("cell")[3].textContent,
  );

  expect(table.getByRole("columnheader", { name: "Date" }).getAttribute("aria-sort")).toBe("descending");
  expect(dates()).toEqual(["Jan 4, 2025", "Jan 3, 2025", "Jan 2, 2025", "Jan 1, 2025", "Dec 30, 2024"]);
  fireEvent.click(table.getByRole("button", { name: "Date" }));
  expect(table.getByRole("columnheader", { name: "Date" }).getAttribute("aria-sort")).toBe("ascending");
  expect(dates()).toEqual(["Dec 2, 2024", "Dec 10, 2024", "Dec 30, 2024", "Jan 1, 2025", "Jan 2, 2025"]);

  fireEvent.click(table.getByRole("button", { name: "Close" }));
  expect(table.getByRole("columnheader", { name: "Date" }).hasAttribute("aria-sort")).toBe(false);
  expect(table.getByRole("columnheader", { name: "Close" }).getAttribute("aria-sort")).toBe("descending");
  expect(closePrices()).toEqual(["$100.00", "$32.00", "$21.00", "$12.00", "$9.00"]);
  fireEvent.click(table.getByRole("button", { name: "Close" }));
  expect(table.getByRole("columnheader", { name: "Close" }).getAttribute("aria-sort")).toBe("ascending");
  expect(closePrices()).toEqual(["$2.00", "$3.00", "$9.00", "$12.00", "$21.00"]);
});

it("paginates, then resets an invalid page when the observations shrink", () => {
  const { rerender } = render(<StockTable observations={observations} />);
  const previous = screen.getByRole<HTMLButtonElement>("button", { name: "Previous page" });
  const next = screen.getByRole<HTMLButtonElement>("button", { name: "Next page" });
  const dates = () => screen.getAllByRole("rowheader").map((cell) => cell.textContent);

  expect(screen.getByRole("status").textContent).toBe("1–5 of 7 observations");
  expect(previous.getAttribute("aria-disabled")).toBe("true");
  next.focus();
  fireEvent.click(next);
  expect(document.activeElement).toBe(next);
  expect(dates()).toEqual(["Dec 10, 2024", "Dec 2, 2024"]);
  expect(screen.getByRole("status").textContent).toBe("6–7 of 7 observations");
  expect(next.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(next);
  expect(screen.getByRole("status").textContent).toBe("6–7 of 7 observations");
  previous.focus();
  fireEvent.click(previous);
  expect(document.activeElement).toBe(previous);
  fireEvent.click(previous);
  expect(screen.getByRole("status").textContent).toBe("1–5 of 7 observations");
  fireEvent.click(next);

  rerender(<StockTable observations={observations.slice(0, 2)} />);
  expect(dates()).toEqual(["Jan 1, 2025", "Dec 10, 2024"]);
  expect(screen.getByRole("status").textContent).toBe("1–2 of 2 observations");
  expect(previous.getAttribute("aria-disabled")).toBe("true");
  expect(next.getAttribute("aria-disabled")).toBe("true");

  rerender(<StockTable observations={observations} />);
  expect(screen.getByRole("status").textContent).toBe("1–5 of 7 observations");
});
