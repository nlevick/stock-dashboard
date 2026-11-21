import { useState } from 'react';

import { CandlestickChart } from '@/components/CandlestickChart/CandlestickChart';
import {
  ChartControls,
  type ChartView,
} from '@/components/CandlestickChart/ChartControls';
import { DashboardShell } from '@/components/DashboardShell';
import { DataStatus } from '@/components/DataStatus';
import { QuoteHeader } from '@/components/QuoteHeader/QuoteHeader';
import { StockTable } from '@/components/StockTable/StockTable';
import { SymbolRail } from '@/components/SymbolRail';
import { ThemeToggle } from '@/components/ThemeToggle';
import { instruments, type InstrumentSymbol } from '@/data/instruments';
import { useStockData } from '@/hooks/useStockData';
import { useTheme } from '@/hooks/useTheme';
import type { StockInterval } from '@/types/stock';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [symbol, setSymbol] = useState<InstrumentSymbol>(instruments[0].symbol);
  const [interval, setInterval] = useState<StockInterval>('daily');
  const [view, setView] = useState<ChartView>('candles');
  const daily = useStockData(symbol);
  const weekly = useStockData(interval === 'weekly' ? symbol : null, 'weekly');
  const active = interval === 'daily' ? daily : weekly;
  const quote = daily.stockData?.data;
  const latest = quote?.[quote.length - 1];
  const history = active.stockData?.data;
  const hasHistory = history !== undefined && history.length > 0;

  return (
    <DashboardShell
      rail={<SymbolRail symbol={symbol} onSelect={setSymbol} />}
      themeControl={<ThemeToggle theme={theme} onToggle={toggleTheme} />}
    >
      <section className="price-history glass-panel" aria-label="Price history">
        {quote && latest ? (
          <QuoteHeader
            symbol={symbol}
            latest={latest}
            previous={quote[quote.length - 2]}
          />
        ) : (
          <h2 className="quote-symbol">{symbol}</h2>
        )}
        {interval === 'weekly' && (
          <DataStatus
            loading={daily.loading}
            error={daily.error}
            empty={quote?.length === 0}
            loadingMessage="Loading daily close…"
            emptyMessage="Daily close unavailable."
            errorLabel="Daily close unavailable"
            retry={daily.retry}
            retryLabel="Retry daily close"
          />
        )}
        <DataStatus
          loading={active.loading}
          error={active.error}
          empty={history?.length === 0}
          loadingMessage={`Loading ${interval} prices…`}
          emptyMessage={`No ${interval} observations returned.`}
          errorLabel={
            interval === 'weekly'
              ? 'Weekly history unavailable'
              : 'Daily history unavailable'
          }
          retry={active.retry}
        />
        <ChartControls
          interval={interval}
          view={view}
          onIntervalChange={setInterval}
          onViewChange={setView}
        />
        {hasHistory && (
          <CandlestickChart
            key={`${symbol}-${interval}`}
            data={history}
            interval={interval}
            view={view}
          />
        )}
      </section>
      {hasHistory && (
        <StockTable key={`${symbol}-${interval}`} observations={history} />
      )}
    </DashboardShell>
  );
}

export default App;
