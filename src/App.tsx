import { useState } from "react";
import { CandlestickChart } from "@/components/CandlestickChart";
import { ChartControls, type ChartView } from "@/components/ChartControls";
import { DashboardShell } from "@/components/DashboardShell";
import { DataStatus } from "@/components/DataStatus";
import { QuoteHeader } from "@/components/QuoteHeader";
import { StockTable } from "@/components/StockTable";
import { SymbolRail } from "@/components/SymbolRail";
import { instruments, type InstrumentSymbol } from "@/data/instruments";
import { useStockData } from "@/hooks/useStockData";
import { THEME, useTheme } from "@/hooks/useTheme";
import type { StockInterval } from "@/types/stock";
import "@/styles/theme.css";

function App() {
  const { theme, toggleTheme } = useTheme();
  const [symbol, setSymbol] = useState<InstrumentSymbol>(instruments[0].symbol);
  const [interval, setInterval] = useState<StockInterval>("daily");
  const [view, setView] = useState<ChartView>("candles");
  const daily = useStockData(symbol);
  const weekly = useStockData(interval === "weekly" ? symbol : null, "weekly");
  const active = interval === "daily" ? daily : weekly;
  const quote = daily.stockData;
  const latest = quote?.data[quote.data.length - 1];
  const history = active.stockData;
  const isDark = theme === THEME.DARK;
  const themeLabel = isDark ? "Light theme" : "Dark theme";

  return (
    <DashboardShell
      rail={<SymbolRail symbol={symbol} onSelect={setSymbol} />}
      themeControl={(
        <button className="theme-toggle" type="button" aria-label={themeLabel} title={themeLabel} onClick={toggleTheme}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {isDark ? (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
              </>
            ) : (
              <path d="M20.9 13.4A9 9 0 0 1 10.6 3.1 9 9 0 1 0 20.9 13.4Z" />
            )}
          </svg>
        </button>
      )}
    >
      <section className="price-history glass-panel" aria-label="Price history">
        {quote && latest ? (
          <QuoteHeader symbol={symbol} latest={latest} previous={quote.data[quote.data.length - 2]} />
        ) : (
          <h2 className="quote-symbol">{symbol}</h2>
        )}
        {interval === "weekly" && (
          <DataStatus
            loading={daily.loading}
            error={daily.error}
            empty={quote?.data.length === 0}
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
          empty={history?.data.length === 0}
          loadingMessage={`Loading ${interval} prices…`}
          emptyMessage={`No ${interval} observations returned.`}
          errorLabel={interval === "weekly" ? "Weekly history unavailable" : "Daily history unavailable"}
          retry={active.retry}
        />
        <ChartControls interval={interval} view={view} onIntervalChange={setInterval} onViewChange={setView} />
        {history?.asOf && (
          <CandlestickChart
            key={`${symbol}-${interval}`}
            data={history.data}
            interval={interval}
            view={view}
          />
        )}
      </section>
      {history?.asOf && <StockTable key={`${symbol}-${interval}`} observations={history.data} />}
    </DashboardShell>
  );
}

export default App;
