import type {
  KeyboardEventHandler,
  PointerEventHandler,
  RefObject,
} from 'react';

import type { StockDataPoint, StockInterval } from '@/types/stock';
import { formatPrice } from '@/utils/stockFormatting';

import type { buildChartModel } from './chartModel';
import type { ChartView } from './ChartControls';

interface CandlestickPlotProps {
  data: readonly StockDataPoint[];
  interval: StockInterval;
  view: ChartView;
  width: number;
  height: number;
  model: ReturnType<typeof buildChartModel>;
  selectedObservation?: StockDataPoint;
  instructionsId: string;
  chartRef: RefObject<SVGSVGElement>;
  onKeyDown: KeyboardEventHandler<SVGSVGElement>;
  onPointerMove: PointerEventHandler<SVGSVGElement>;
  onPointerLeave: PointerEventHandler<SVGSVGElement>;
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

export function CandlestickPlot({
  data,
  interval,
  view,
  width,
  height,
  model,
  selectedObservation,
  instructionsId,
  chartRef,
  onKeyDown,
  onPointerMove,
  onPointerLeave,
}: CandlestickPlotProps) {
  const { plot, center, markWidth, price, volume, dateTicks, closingLine } =
    model;
  const priceMarkClass = view === 'bars' ? 'chart-bar' : 'chart-candle';
  const firstObservation = data[0];

  return (
    <svg
      ref={chartRef}
      className="stock-chart"
      role="img"
      aria-label={chartLabels[view]}
      aria-describedby={instructionsId}
      viewBox={`0 0 ${width} ${height}`}
      height={height}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
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
                  <line x1={x} x2={x + markWidth / 2} y1={closeY} y2={closeY} />
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
          cx={center(firstObservation.date)}
          cy={price(firstObservation.close)}
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
      {selectedObservation && (
        <g aria-hidden="true">
          <line
            className="chart-crosshair"
            x1={center(selectedObservation.date)}
            x2={center(selectedObservation.date)}
            y1={plot.top}
            y2={plot.bottom}
          />
          <circle
            className="chart-crosshair-point"
            cx={center(selectedObservation.date)}
            cy={price(selectedObservation.close)}
            r={3}
          />
        </g>
      )}
    </svg>
  );
}
