import { useState } from 'react';

import { CandlestickChart } from '@/components/CandlestickChart/CandlestickChart';
import {
  ChartControls,
  type ChartView,
} from '@/components/CandlestickChart/ChartControls/ChartControls';
import { DashboardShell } from '@/components/DashboardShell/DashboardShell';
import { DataStatus } from '@/components/DataStatus/DataStatus';
import { QuoteHeader } from '@/components/QuoteHeader/QuoteHeader';
import { StockTable } from '@/components/StockTable/StockTable';
import { SymbolRail } from '@/components/SymbolRail/SymbolRail';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { instruments, type InstrumentSymbol } from '@/data/instruments';
import { useStockData } from '@/hooks/useStockData';
import { useTheme } from '@/hooks/useTheme';
import type { StockDataPoint, StockInterval } from '@/types/stock';

interface Selection {
  symbol: InstrumentSymbol;
  interval: StockInterval;
}

interface Prices extends Selection {
  quote: readonly StockDataPoint[];
  history: readonly StockDataPoint[];
}

const noObservations: readonly StockDataPoint[] = [];

function App() {
  const { theme, toggleTheme } = useTheme();
  const [{ symbol, interval }, setSelection] = useState<Selection>({
    symbol: instruments[0].symbol,
    interval: 'daily',
  });
  const [view, setView] = useState<ChartView>('candles');
  const [previous, setPrevious] = useState<Prices | null>(null);
  const daily = useStockData(symbol);
  const weekly = useStockData(interval === 'weekly' ? symbol : null, 'weekly');
  const active = interval === 'daily' ? daily : weekly;
  // Weekly history and the daily quote can arrive at different times.
  const pending = daily.loading || active.loading;
  const showingPrevious = pending && previous !== null;
  const displayed = showingPrevious
    ? previous
    : {
        symbol,
        interval,
        quote: daily.stockData?.data ?? noObservations,
        history: active.stockData?.data ?? noObservations,
      };
  const { quote, history } = displayed;
  const historyLoading = active.loading || showingPrevious;

  function select(next: Selection) {
    if (next.symbol === symbol && next.interval === interval) return;
    setPrevious(quote.length || history.length ? displayed : null);
    setSelection(next);
  }

  function retry(load: () => void) {
    setPrevious(null);
    load();
  }

  return (
    <DashboardShell
      rail={
        <SymbolRail
          symbol={symbol}
          onSelect={(symbol) => select({ symbol, interval })}
        />
      }
      themeControl={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
    >
      <section className="price-history glass-panel" aria-label="Price history">
        <QuoteHeader
          symbol={displayed.symbol}
          latest={quote[quote.length - 1]}
          previous={quote[quote.length - 2]}
          status={
            interval === 'weekly' &&
            !showingPrevious &&
            quote.length === 0 &&
            (!daily.loading || !historyLoading) && (
              <DataStatus
                loading={daily.loading}
                error={daily.error}
                empty
                emptyMessage="Daily close unavailable."
                errorLabel="Daily close unavailable"
                retry={() => retry(daily.retry)}
                retryLabel="Retry daily close"
              />
            )
          }
        />
        <ChartControls
          interval={interval}
          view={view}
          onIntervalChange={(interval) => select({ symbol, interval })}
          onViewChange={setView}
        />
        <CandlestickChart
          data={history}
          interval={displayed.interval}
          view={view}
          loading={historyLoading}
          status={
            <DataStatus
              loading={historyLoading}
              error={active.error}
              empty={history.length === 0}
              emptyMessage={`No ${interval} observations returned.`}
              errorLabel={
                interval === 'weekly'
                  ? 'Weekly history unavailable'
                  : 'Daily history unavailable'
              }
              retry={() => retry(active.retry)}
            />
          }
        />
      </section>
      <StockTable
        observations={history}
        series={`${displayed.symbol}-${displayed.interval}`}
      />
    </DashboardShell>
  );
}

export default App;
