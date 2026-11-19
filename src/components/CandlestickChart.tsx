import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { ChartView } from "@/components/RangeControls";
import { buildChartModel, CHART_HEIGHT } from "@/components/chartModel";
import type { StockDataPoint } from "@/types/stock";
import "./CandlestickChart.css";

interface CandlestickChartProps {
  data: readonly StockDataPoint[];
  view: ChartView;
}

const axisDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const shares = new Intl.NumberFormat("en-US");

export function CandlestickChart({ data, view }: CandlestickChartProps) {
  const chartRef = useRef<SVGSVGElement>(null);
  const instructions = useId();
  const [width, setWidth] = useState(640);
  const [inspection, setInspection] = useState<{ date: string; keyboard: boolean } | null>(null);
  const model = useMemo(() => buildChartModel(data, width), [data, width]);
  const { plot, center, markWidth, price, volume, dateTicks, closingLine } = model;
  const hasData = data.length > 0;
  const latest = data[data.length - 1];
  const activeIndex = inspection ? data.findIndex(({ date }) => date === inspection.date) : -1;
  const active = data[activeIndex];
  const current = active ?? latest;

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || typeof ResizeObserver === "undefined") return;

    function updateWidth(measured: number) {
      if (measured > 0) setWidth(Math.max(160, Math.round(measured)));
    }

    updateWidth(chart.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => updateWidth(entry.contentRect.width));
    observer.observe(chart);
    return () => observer.disconnect();
  }, [hasData]);

  if (!latest) return <p>No observations for this range.</p>;

  const fields = [
    ["Open", usd.format(current.open)],
    ["High", usd.format(current.high)],
    ["Low", usd.format(current.low)],
    ["Close", usd.format(current.close)],
    ["Volume", shares.format(current.volume)],
  ];

  function inspectPointer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const index = model.indexAt((event.clientX - bounds.left) * width / bounds.width);
    const date = data[index].date;
    if (inspection?.date !== date || inspection.keyboard) setInspection({ date, keyboard: false });
  }

  function inspectKeyboard(event: KeyboardEvent<SVGSVGElement>) {
    const previous = activeIndex < 0 ? data.length - 1 : activeIndex;
    let index: number;

    switch (event.key) {
      case "ArrowLeft": index = Math.max(0, previous - 1); break;
      case "ArrowRight": index = Math.min(data.length - 1, previous + 1); break;
      case "Home": index = 0; break;
      case "End": index = data.length - 1; break;
      default: return;
    }

    event.preventDefault();
    setInspection({ date: data[index].date, keyboard: true });
  }

  return (
    <>
      <p id={instructions} className="chart-instructions">
        Use the arrow keys to inspect daily prices. Home and End jump to the first and last day.
      </p>
      <div
        className="chart-readout"
        role="group"
        aria-label="Inspected observation"
      >
        <time dateTime={current.date}>{current.date}</time>
        {fields.map(([label, value]) => (
          <span key={label}>{label} <strong>{value}</strong></span>
        ))}
      </div>
      <p className="chart-announcement" role="status" aria-atomic="true">
        {inspection?.keyboard && active && (
          `${current.date}. ${fields.map(([label, value]) => `${label} ${value}`).join(", ")}.`
        )}
      </p>
      <svg
        ref={chartRef}
        className="stock-chart"
        role="img"
        aria-label={view === "candles" ? "Candlestick price and volume chart" : "Closing price and volume line chart"}
        aria-describedby={instructions}
        viewBox={`0 0 ${width} ${CHART_HEIGHT}`}
        height={CHART_HEIGHT}
        tabIndex={0}
        onKeyDown={inspectKeyboard}
        onPointerMove={inspectPointer}
        onPointerLeave={() => {
          if (!inspection?.keyboard) setInspection(null);
        }}
      >
        {price.ticks(5).map((tick) => (
          <g key={tick}>
            <line className="chart-grid" x1={plot.left} x2={plot.right} y1={price(tick)} y2={price(tick)} />
            <text x={plot.right + 7} y={price(tick)} dominantBaseline="middle">{usd.format(tick)}</text>
          </g>
        ))}
        <g aria-label="Daily volume">
          {data.map(({ date, volume: shareVolume }) => (
            <rect
              key={date}
              className="chart-volume"
              x={center(date) - markWidth / 2}
              width={markWidth}
              y={volume(shareVolume)}
              height={plot.bottom - volume(shareVolume)}
            />
          ))}
          <text x={plot.right + 7} y={plot.bottom - 3}>Volume</text>
        </g>
        {view === "candles" ? data.map(({ date, open, close, high, low }) => (
          <g key={date} className={close < open ? "chart-candle chart-candle-down" : "chart-candle"}>
            <line x1={center(date)} x2={center(date)} y1={price(high)} y2={price(low)} />
            <rect
              x={center(date) - markWidth / 2}
              width={markWidth}
              y={Math.min(price(open), price(close))}
              height={Math.max(1, Math.abs(price(open) - price(close)))}
            />
          </g>
        )) : data.length === 1 ? (
          <circle className="chart-close-point" cx={center(latest.date)} cy={price(latest.close)} r={3} />
        ) : (
          <path className="chart-close-line" d={closingLine ?? undefined} />
        )}
        {dateTicks.map((date, index) => (
          <text
            key={date}
            x={center(date)}
            y={CHART_HEIGHT - 7}
            textAnchor={dateTicks.length === 1 ? "middle" : index === 0 ? "start" : index === dateTicks.length - 1 ? "end" : "middle"}
          >
            {axisDate.format(new Date(date))}
          </text>
        ))}
        {active && (
          <g aria-hidden="true">
            <line className="chart-crosshair" x1={center(active.date)} x2={center(active.date)} y1={plot.top} y2={plot.bottom} />
            <circle className="chart-crosshair-point" cx={center(active.date)} cy={price(active.close)} r={3} />
          </g>
        )}
      </svg>
    </>
  );
}
