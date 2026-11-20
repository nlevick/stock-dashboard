import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';

import type { ChartView } from '@/components/ChartControls';
import { buildChartModel, CHART_HEIGHT } from '@/components/chartModel';
import type { StockDataPoint, StockInterval } from '@/types/stock';
import { formatPrice, formatShareCount } from '@/utils/stockFormatting';

interface CandlestickChartProps {
  data: readonly StockDataPoint[];
  interval: StockInterval;
  view: ChartView;
}

const axisDates = {
  daily: new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }),
  weekly: new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }),
};
const chartLabels: Record<ChartView, string> = {
  candles: 'Candlestick price and volume chart',
  bars: 'OHLC price and volume bar chart',
  line: 'Closing price and volume line chart',
};

export function CandlestickChart({
  data,
  interval,
  view,
}: CandlestickChartProps) {
  const chartRef = useRef<SVGSVGElement>(null);
  const instructions = useId();
  const [{ width, height }, setSize] = useState({
    width: 640,
    height: CHART_HEIGHT,
  });
  const [inspection, setInspection] = useState<{
    date: string;
    keyboard: boolean;
  } | null>(null);
  const model = useMemo(
    () => buildChartModel(data, width, height),
    [data, width, height]
  );
  const { plot, center, markWidth, price, volume, dateTicks, closingLine } =
    model;
  const hasData = data.length > 0;
  const latest = data[data.length - 1];
  const activeIndex = inspection
    ? data.findIndex(({ date }) => date === inspection.date)
    : -1;
  const active = data[activeIndex];
  const current = active ?? latest;
  const priceMarkClass = view === 'bars' ? 'chart-bar' : 'chart-candle';

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || typeof ResizeObserver === 'undefined') return;

    function measureChart() {
      const bounds = chartRef.current?.getBoundingClientRect();
      if (!bounds?.width || !bounds.height) return;
      const width = Math.max(160, Math.round(bounds.width));
      const height = Math.max(120, Math.round(bounds.height));
      setSize((size) =>
        size.width === width && size.height === height
          ? size
          : { width, height }
      );
    }

    measureChart();
    const observer = new ResizeObserver(measureChart);
    observer.observe(chart);
    return () => observer.disconnect();
  }, [hasData]);

  if (!latest) return <p>No observations for this range.</p>;

  const fields = [
    ['Open', formatPrice(current.open)],
    ['High', formatPrice(current.high)],
    ['Low', formatPrice(current.low)],
    ['Close', formatPrice(current.close)],
    ['Volume', formatShareCount(current.volume)],
  ];

  function inspectPointer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width <= 0) return;
    const index = model.indexAt(
      ((event.clientX - bounds.left) * width) / bounds.width
    );
    const date = data[index].date;
    if (inspection?.date !== date || inspection.keyboard) {
      setInspection({ date, keyboard: false });
    }
  }

  function inspectKeyboard(event: KeyboardEvent<SVGSVGElement>) {
    const previous = activeIndex < 0 ? data.length - 1 : activeIndex;
    let index: number;

    switch (event.key) {
      case 'ArrowLeft':
        index = Math.max(0, previous - 1);
        break;
      case 'ArrowRight':
        index = Math.min(data.length - 1, previous + 1);
        break;
      case 'Home':
        index = 0;
        break;
      case 'End':
        index = data.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    setInspection({ date: data[index].date, keyboard: true });
  }

  return (
    <>
      <div
        className="chart-observation"
        role="group"
        aria-label="Inspected observation"
      >
        <dl className="chart-readout">
          <div>
            <dt>Date</dt>
            <dd>
              <time dateTime={current.date}>{current.date}</time>
            </dd>
          </div>
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="visually-hidden" role="status" aria-atomic="true">
        {inspection?.keyboard &&
          active &&
          `${current.date}. ${fields.map(([label, value]) => `${label} ${value}`).join(', ')}.`}
      </p>
      <svg
        ref={chartRef}
        className="stock-chart"
        role="img"
        aria-label={chartLabels[view]}
        aria-describedby={instructions}
        viewBox={`0 0 ${width} ${height}`}
        height={height}
        tabIndex={0}
        onKeyDown={inspectKeyboard}
        onPointerMove={inspectPointer}
        onPointerLeave={() => {
          if (!inspection?.keyboard) setInspection(null);
        }}
      >
        {price.ticks(height < 175 ? 3 : 5).map((tick) => (
          <g key={tick}>
            <line
              className="chart-grid"
              x1={plot.left}
              x2={plot.right}
              y1={price(tick)}
              y2={price(tick)}
            />
            <text x={plot.right + 7} y={price(tick)} dominantBaseline="middle">
              {formatPrice(tick)}
            </text>
          </g>
        ))}
        <g aria-label={interval === 'daily' ? 'Daily volume' : 'Weekly volume'}>
          {data.map(({ date, open, close, volume: shareVolume }) => (
            <rect
              key={date}
              className="chart-volume"
              data-direction={close < open ? 'down' : 'up'}
              x={center(date) - markWidth / 2}
              width={markWidth}
              y={volume(shareVolume)}
              height={plot.bottom - volume(shareVolume)}
            />
          ))}
        </g>
        {view !== 'line' ? (
          data.map(({ date, open, close, high, low }) => {
            const x = center(date);
            const left = x - markWidth / 2;
            const openY = price(open);
            const closeY = price(close);
            return (
              <g
                key={date}
                className={
                  close < open
                    ? `${priceMarkClass} ${priceMarkClass}-down`
                    : priceMarkClass
                }
              >
                <line x1={x} x2={x} y1={price(high)} y2={price(low)} />
                {view === 'bars' ? (
                  <>
                    <line x1={left} x2={x} y1={openY} y2={openY} />
                    <line
                      x1={x}
                      x2={x + markWidth / 2}
                      y1={closeY}
                      y2={closeY}
                    />
                  </>
                ) : (
                  <rect
                    x={left}
                    width={markWidth}
                    y={Math.min(openY, closeY)}
                    height={Math.max(1, Math.abs(openY - closeY))}
                  />
                )}
              </g>
            );
          })
        ) : data.length === 1 ? (
          <circle
            className="chart-close-point"
            cx={center(latest.date)}
            cy={price(latest.close)}
            r={3}
          />
        ) : (
          <path className="chart-close-line" d={closingLine ?? undefined} />
        )}
        {dateTicks.map((date, index) => (
          <text
            key={date}
            x={center(date)}
            y={height - 5}
            textAnchor={
              dateTicks.length === 1
                ? 'middle'
                : index === 0
                  ? 'start'
                  : index === dateTicks.length - 1
                    ? 'end'
                    : 'middle'
            }
          >
            {axisDates[interval].format(new Date(date))}
          </text>
        ))}
        {active && (
          <g aria-hidden="true">
            <line
              className="chart-crosshair"
              x1={center(active.date)}
              x2={center(active.date)}
              y1={plot.top}
              y2={plot.bottom}
            />
            <circle
              className="chart-crosshair-point"
              cx={center(active.date)}
              cy={price(active.close)}
              r={3}
            />
          </g>
        )}
      </svg>
      <p id={instructions} className="chart-instructions">
        Use the arrow keys to inspect {interval} prices. Home and End jump to
        the first and last observation.
      </p>
    </>
  );
}
