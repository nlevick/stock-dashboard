import type { StockRange } from "@/utils/stockRange";

export type ChartView = "candles" | "line";

interface RangeControlsProps {
  range: StockRange;
  view: ChartView;
  onRangeChange: (range: StockRange) => void;
  onViewChange: (view: ChartView) => void;
}

export function RangeControls({ range, view, onRangeChange, onViewChange }: RangeControlsProps) {
  return (
    <div className="chart-controls">
      <div role="group" aria-label="Time range">
        {(["1M", "3M"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={range === value} onClick={() => onRangeChange(value)}>
            {value}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Chart style">
        <button type="button" aria-pressed={view === "candles"} onClick={() => onViewChange("candles")}>
          Candles
        </button>
        <button type="button" aria-pressed={view === "line"} onClick={() => onViewChange("line")}>
          Line
        </button>
      </div>
    </div>
  );
}
