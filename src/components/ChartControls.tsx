import type { StockInterval } from "@/types/stock";

export type ChartView = "candles" | "bars" | "line";

interface ChartControlsProps {
  interval: StockInterval;
  view: ChartView;
  onIntervalChange: (interval: StockInterval) => void;
  onViewChange: (view: ChartView) => void;
}

const intervalLabels = { daily: "Daily", weekly: "Weekly" };

export function ChartControls({ interval, view, onIntervalChange, onViewChange }: ChartControlsProps) {
  return (
    <div className="chart-controls">
      <div role="group" aria-label="Chart interval">
        {(["daily", "weekly"] as const).map((value) => (
          <button key={value} type="button" aria-pressed={interval === value} onClick={() => onIntervalChange(value)}>
            {intervalLabels[value]}
          </button>
        ))}
      </div>
      <div role="group" aria-label="Chart style">
        <button type="button" aria-pressed={view === "candles"} onClick={() => onViewChange("candles")}>
          Candles
        </button>
        <button type="button" aria-pressed={view === "bars"} onClick={() => onViewChange("bars")}>
          Bars
        </button>
        <button type="button" aria-pressed={view === "line"} onClick={() => onViewChange("line")}>
          Line
        </button>
      </div>
    </div>
  );
}
