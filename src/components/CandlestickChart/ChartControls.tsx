import { CandlestickIcon } from '@/components/icons/CandlestickIcon';
import { LineChartIcon } from '@/components/icons/LineChartIcon';
import { OhlcBarIcon } from '@/components/icons/OhlcBarIcon';
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
          <CandlestickIcon />
        </button>
        <button
          type="button"
          aria-label="Bars"
          title="OHLC bars"
          aria-pressed={view === 'bars'}
          onClick={() => onViewChange('bars')}
        >
          <OhlcBarIcon />
        </button>
        <button
          type="button"
          aria-label="Line"
          title="Line"
          aria-pressed={view === 'line'}
          onClick={() => onViewChange('line')}
        >
          <LineChartIcon />
        </button>
      </div>
    </div>
  );
}
