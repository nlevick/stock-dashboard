import type { StockInterval } from '@/types/stock';

export type ChartView = 'candles' | 'bars' | 'line';

interface ChartControlsProps {
  interval: StockInterval;
  view: ChartView;
  onIntervalChange: (interval: StockInterval) => void;
  onViewChange: (view: ChartView) => void;
}

const intervalLabels = { daily: 'Daily', weekly: 'Weekly' };

export function ChartControls({
  interval,
  view,
  onIntervalChange,
  onViewChange,
}: ChartControlsProps) {
  return (
    <div className="chart-controls">
      <div className="chart-intervals" role="group" aria-label="Chart interval">
        {(['daily', 'weekly'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={interval === value}
            onClick={() => onIntervalChange(value)}
          >
            {intervalLabels[value]}
          </button>
        ))}
      </div>
      <div className="chart-views" role="group" aria-label="Chart style">
        <button
          type="button"
          aria-label="Candles"
          title="Candles"
          aria-pressed={view === 'candles'}
          onClick={() => onViewChange('candles')}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6 3v14m8-14v14" />
            <rect x="4" y="6" width="4" height="6" rx=".5" />
            <rect x="12" y="8" width="4" height="5" rx=".5" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Bars"
          title="OHLC bars"
          aria-pressed={view === 'bars'}
          onClick={() => onViewChange('bars')}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6 6v11m-3-4h3m0-4h3m5-6v11m-3-4h3m0-4h3" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Line"
          title="Line"
          aria-pressed={view === 'line'}
          onClick={() => onViewChange('line')}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="m3 15 5-6 4 3 5-7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
