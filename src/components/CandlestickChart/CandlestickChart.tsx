import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

import { Statistic } from '@/components/ui/Statistic';
import type { StockDataPoint, StockInterval } from '@/types/stock';
import { formatPrice, formatShareCount } from '@/utils/stockFormatting';

import { CandlestickPlot } from './CandlestickPlot';
import { buildChartModel, CHART_HEIGHT, CHART_WIDTH } from './chartModel';
import type { ChartView } from './ChartControls';

interface CandlestickChartProps {
  data: readonly StockDataPoint[];
  interval: StockInterval;
  view: ChartView;
  loading?: boolean;
  status?: ReactNode;
}

interface ObservationSelection {
  data: readonly StockDataPoint[];
  date: string;
  source: 'pointer' | 'touch' | 'keyboard';
}

const MIN_CHART_WIDTH = 160;
const MIN_CHART_HEIGHT = 120;

export function CandlestickChart({
  data,
  interval,
  view,
  loading = false,
  status,
}: CandlestickChartProps) {
  const chartRef = useRef<SVGSVGElement>(null);
  const instructionsId = useId();
  const [{ width, height }, setSize] = useState({
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
  });
  const [observationSelection, setObservationSelection] =
    useState<ObservationSelection | null>(null);
  if (observationSelection && observationSelection.data !== data) {
    setObservationSelection(null);
  }
  const model = useMemo(
    () => buildChartModel(data, width, height),
    [data, width, height]
  );
  const hasData = data.length > 0;
  const latestObservation = data[data.length - 1];
  const selectedIndex = observationSelection
    ? data.findIndex(({ date }) => date === observationSelection.date)
    : -1;
  const selectedObservation =
    selectedIndex === -1 ? undefined : data[selectedIndex];
  const readoutObservation = selectedObservation ?? latestObservation;

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const measureChart = () => {
      const bounds = chart.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const width = Math.max(MIN_CHART_WIDTH, Math.round(bounds.width));
      const height = Math.max(MIN_CHART_HEIGHT, Math.round(bounds.height));
      setSize((size) =>
        size.width === width && size.height === height
          ? size
          : { width, height }
      );
    };

    measureChart();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measureChart);
    observer.observe(chart);
    return () => observer.disconnect();
  }, []);

  const fields = [
    ['Open', readoutObservation && formatPrice(readoutObservation.open)],
    ['High', readoutObservation && formatPrice(readoutObservation.high)],
    ['Low', readoutObservation && formatPrice(readoutObservation.low)],
    ['Close', readoutObservation && formatPrice(readoutObservation.close)],
    [
      'Volume',
      readoutObservation && formatShareCount(readoutObservation.volume),
    ],
  ] as const;

  function inspectPointer(
    event: PointerEvent<SVGSVGElement>,
    source: 'pointer' | 'touch'
  ) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!hasData || bounds.width <= 0) return;
    const index = model.indexAt(
      ((event.clientX - bounds.left) * width) / bounds.width
    );
    const date = data[index].date;
    if (
      observationSelection?.source !== source ||
      observationSelection.date !== date
    ) {
      setObservationSelection({ data, date, source });
    }
  }

  function handleChartKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (!hasData) return;
    const previous = selectedIndex < 0 ? data.length - 1 : selectedIndex;
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
    setObservationSelection({
      data,
      date: data[index].date,
      source: 'keyboard',
    });
  }

  return (
    <>
      <div
        className="chart-observation"
        role="group"
        aria-label="Inspected observation"
      >
        <dl className="chart-readout">
          <Statistic
            label="Date"
            value={
              readoutObservation ? (
                <time dateTime={readoutObservation.date}>
                  {readoutObservation.date}
                </time>
              ) : (
                '—'
              )
            }
          />
          {fields.map(([label, value]) => (
            <Statistic key={label} label={label} value={value ?? '—'} />
          ))}
        </dl>
      </div>
      <p className="visually-hidden" role="status" aria-atomic="true">
        {observationSelection?.source === 'keyboard' &&
          selectedObservation &&
          `${selectedObservation.date}. ${fields.map(([label, value]) => `${label} ${value}`).join(', ')}.`}
      </p>
      <div className="chart-plot" data-empty={!hasData} data-loading={loading}>
        <CandlestickPlot
          data={data}
          interval={interval}
          view={view}
          width={width}
          height={height}
          model={model}
          selectedObservation={selectedObservation}
          instructionsId={instructionsId}
          chartRef={chartRef}
          onKeyDown={handleChartKeyDown}
          onPointerMove={(event) => inspectPointer(event, 'pointer')}
          onPointerUp={(event) => {
            if (event.pointerType === 'touch' && event.isPrimary) {
              inspectPointer(event, 'touch');
            }
          }}
          onPointerLeave={() => {
            if (observationSelection?.source === 'pointer') {
              setObservationSelection(null);
            }
          }}
        />
        <div className="chart-status">{status}</div>
      </div>
      <p id={instructionsId} className="chart-instructions" hidden={!hasData}>
        Use the arrow keys to inspect {interval} prices. Home and End jump to
        the first and last observation.
      </p>
    </>
  );
}
