import { CandlestickIcon } from '@/components/icons/CandlestickIcon';
import { LineChartIcon } from '@/components/icons/LineChartIcon';
import { OhlcBarIcon } from '@/components/icons/OhlcBarIcon';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { StockInterval } from '@/types/stock';

const intervalOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
] as const;

const viewOptions = [
  {
    value: 'candles',
    label: 'Candles',
    title: 'Candles',
    icon: <CandlestickIcon />,
  },
  { value: 'bars', label: 'Bars', title: 'OHLC bars', icon: <OhlcBarIcon /> },
  { value: 'line', label: 'Line', title: 'Line', icon: <LineChartIcon /> },
] as const;

export type ChartView = (typeof viewOptions)[number]['value'];

interface ChartControlsProps {
  interval: StockInterval;
  view: ChartView;
  onIntervalChange: (interval: StockInterval) => void;
  onViewChange: (view: ChartView) => void;
}

export function ChartControls({
  interval,
  view,
  onIntervalChange,
  onViewChange,
}: ChartControlsProps) {
  return (
    <div className="chart-controls">
      <SegmentedControl
        className="chart-intervals"
        label="Chart interval"
        options={intervalOptions}
        value={interval}
        onChange={onIntervalChange}
      />
      <SegmentedControl
        className="chart-views"
        label="Chart style"
        options={viewOptions}
        value={view}
        onChange={onViewChange}
      />
    </div>
  );
}
