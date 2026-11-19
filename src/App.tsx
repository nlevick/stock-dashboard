import { useState } from "react";
import { CandlestickChart } from "@/components/CandlestickChart";
import { ChartControls, type ChartView } from "@/components/ChartControls";
import { DashboardShell } from "@/components/DashboardShell";
import { DataStatus } from "@/components/DataStatus";
import { QuoteHeader } from "@/components/QuoteHeader";
import { StockSummary } from "@/components/StockSummary";
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

  return (
    <DashboardShell
      rail={<SymbolRail symbol={symbol} onSelect={setSymbol} />}
      themeControl={(
        <button className="dashboard-button" type="button" onClick={toggleTheme}>
          {theme === THEME.DARK ? "Light theme" : "Dark theme"}
        </button>
      )}
    >
      <section className="price-history glass-panel" aria-label="Price history">
        <div className="chart-header">
          <h2>{symbol}</h2>
          {quote && latest && (
            <QuoteHeader latest={latest} previous={quote.data[quote.data.length - 2]} source={quote.source} />
          )}
          <ChartControls interval={interval} view={view} onIntervalChange={setInterval} onViewChange={setView} />
        </div>
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
        {history?.asOf && (!latest || history.source !== quote?.source) && (
          <p className="data-source">Chart source: {history.source}</p>
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
        {history?.asOf && (
          <CandlestickChart
            key={`${symbol}-${interval}`}
            data={history.data}
            interval={interval}
            view={view}
          />
        )}
        {latest && <StockSummary observation={latest} />}
      </section>
      {history?.asOf && <StockTable key={`${symbol}-${interval}`} observations={history.data} />}
    </DashboardShell>
  );
}

export default App;
