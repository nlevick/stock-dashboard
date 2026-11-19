import { expect, it } from "vitest";
import { buildChartModel } from "@/components/chartModel";
import type { StockDataPoint } from "@/types/stock";

const flat: StockDataPoint = { date: "2025-03-07", open: 15, high: 15, low: 15, close: 15, volume: 0 };
const followingMonday = { ...flat, date: "2025-03-10" };

it.each([
  { name: "empty", data: [] },
  { name: "single", data: [flat] },
  { name: "flat", data: [flat, followingMonday] },
])("produces finite price and volume geometry for $name data", ({ data }) => {
  const model = buildChartModel(data, 320);
  const [low, high] = model.price.domain();
  const [minVolume, maxVolume] = model.volume.domain();
  expect([low, high, minVolume, maxVolume].every(Number.isFinite)).toBe(true);
  expect(high).toBeGreaterThan(low);
  expect(maxVolume).toBeGreaterThan(minVolume);

  if (data.length === 0) {
    expect(model.closingLine).toBeNull();
    expect(model.dateTicks).toEqual([]);
  } else {
    expect(model.closingLine).toMatch(/^M\d/);
    expect(model.closingLine).not.toMatch(/NaN|Infinity/);
    expect(model.price(15)).toBeGreaterThan(model.plot.top);
    expect(model.price(15)).toBeLessThan(model.plot.priceBottom);
    expect(model.volume(0)).toBe(model.plot.bottom);
  }
});

it("fits a resized plot and spaces neighboring trading sessions evenly across a weekend", () => {
  const tuesday = { ...flat, date: "2025-03-11" };
  for (const width of [240, 900]) {
    const { center, plot } = buildChartModel([flat, followingMonday, tuesday], width);
    const [fridayX, mondayX, tuesdayX] = [flat, followingMonday, tuesday].map(({ date }) => center(date));
    expect(fridayX).toBeGreaterThan(plot.left);
    expect(tuesdayX).toBeLessThan(plot.right);
    expect(plot.right).toBeLessThan(width);
    expect(mondayX - fridayX).toBeCloseTo(tuesdayX - mondayX);
  }
});
