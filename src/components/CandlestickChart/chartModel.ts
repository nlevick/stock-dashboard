import { bisectCenter, line, max, min, scaleBand, scaleLinear } from 'd3';

import type { StockDataPoint } from '@/types/stock';

export const CHART_WIDTH = 640;
export const CHART_HEIGHT = 284;

export function buildChartModel(
  data: readonly StockDataPoint[],
  width: number,
  height = CHART_HEIGHT
) {
  const dates = data.map(({ date }) => date);
  const bottom = height - 24;
  const volumeTop = bottom - Math.min(36, height * 0.12);
  const plot = {
    left: 6,
    right: width - 72,
    top: 12,
    priceBottom: volumeTop - 12,
    volumeTop,
    bottom,
  };

  const x = scaleBand(dates, [plot.left, plot.right]);
  const center = (date: string) => x(date)! + x.bandwidth() / 2;
  const centers = dates.map(center);
  const markWidth = Math.min(9, x.bandwidth() * 0.65);

  const low = min(data, ({ low }) => low) ?? 0;
  const high = max(data, ({ high }) => high) ?? 1;
  const padding = (high - low) * 0.08 || Math.max(high * 0.01, 0.01);
  const price = scaleLinear(
    [Math.max(0, low - padding), Math.min(Number.MAX_VALUE, high + padding)],
    [plot.priceBottom, plot.top]
  );
  const volume = scaleLinear(
    [0, max(data, ({ volume }) => volume) || 1],
    [plot.bottom, plot.volumeTop]
  );
  const closingLine = line<StockDataPoint>()
    .x(({ date }) => center(date))
    .y(({ close }) => price(close))(data);

  const tickCount = Math.min(dates.length, width < 490 ? 3 : 6);
  const dateTicks = Array.from(
    { length: tickCount },
    (_, index) =>
      dates[
        Math.round((index * (dates.length - 1)) / Math.max(1, tickCount - 1))
      ]
  );

  return {
    plot,
    center,
    markWidth,
    price,
    volume,
    closingLine,
    dateTicks,
    indexAt: (position: number) =>
      data.length ? bisectCenter(centers, position) : -1,
  };
}
