import { useState } from "react";
import { CandlestickChart } from "@/components/CandlestickChart";
import { ChartControls, type ChartView } from "@/components/ChartControls";
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
  const { loading, error, stockData, retry } = interval === "daily" ? daily : weekly;
  const quote = daily.stockData;
  const latest = quote?.data[quote.data.length - 1];

  return (
    <div style={{ padding: "clamp(0.75rem, 4vw, 2rem)" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "2rem",
        }}
      >
        <h1>Stock Dashboard</h1>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--accent)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          {theme === THEME.DARK ? "🌙" : "☀️"} Toggle Theme
        </button>
      </header>

      <div className="chart-controls" role="group" aria-label="Ticker">
        {instruments.map((instrument) => (
          <button key={instrument.symbol} type="button" aria-pressed={symbol === instrument.symbol} onClick={() => setSymbol(instrument.symbol)}>
            {instrument.symbol}
          </button>
        ))}
      </div>

      <section className="price-history" aria-label="Price history">
        <h2>{symbol}</h2>
        {quote?.asOf && latest && (
          <div role="group" aria-label="Latest close">
            <p>${latest.close.toFixed(2)}</p>
            <p>At close <time dateTime={quote.asOf}>{quote.asOf}</time></p>
          </div>
        )}
        {interval === "weekly" && stockData?.asOf && !quote?.asOf && (
          daily.loading ? <p role="status">Loading daily close...</p> : (
            <p>Daily close unavailable. <button type="button" onClick={daily.retry}>Retry daily close</button></p>
          )
        )}
        {stockData?.asOf && <p>Source: {stockData.source}</p>}
        <ChartControls interval={interval} view={view} onIntervalChange={setInterval} onViewChange={setView} />
        {loading && <p role="status">Loading {interval} prices...</p>}
        {error && (
          <div role="alert" style={{ color: "var(--chart-down)" }}>
            {error.message} <button type="button" onClick={retry}>Retry</button>
          </div>
        )}
        {stockData?.data.length === 0 && (
          <p role="status">
            No {interval} observations returned. <button type="button" onClick={retry}>Retry</button>
          </p>
        )}
        {stockData?.asOf && (
          <CandlestickChart
            key={`${symbol}-${interval}`}
            data={stockData.data}
            interval={interval}
            view={view}
          />
        )}
      </section>
    </div>
  );
}

export default App;
