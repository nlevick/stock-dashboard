import { useState } from "react";
import { CandlestickChart } from "@/components/CandlestickChart";
import { RangeControls, type ChartView } from "@/components/RangeControls";
import { useStockData } from "@/hooks/useStockData";
import { THEME, useTheme } from "@/hooks/useTheme";
import { selectStockRange, type StockRange } from "@/utils/stockRange";
import "@/styles/theme.css";

function App() {
  const { theme, toggleTheme } = useTheme();
  const { loading, error, stockData, retry } = useStockData("IBIT");
  const [range, setRange] = useState<StockRange>("3M");
  const [view, setView] = useState<ChartView>("candles");
  const latest = stockData?.data[stockData.data.length - 1];
  const selected = stockData && latest ? selectStockRange(stockData.data, range) : null;

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

      {loading && <p role="status">Loading stock data...</p>}
      {error && (
        <div role="alert" style={{ color: "var(--chart-down)" }}>
          {error.message} <button type="button" onClick={retry}>Retry</button>
        </div>
      )}
      {stockData?.data.length === 0 && (
        <p role="status">
          No daily observations returned. <button type="button" onClick={retry}>Retry</button>
        </p>
      )}
      {stockData?.asOf && latest && selected && (
        <section className="price-history" aria-label="Price history">
          <h2>{stockData.symbol}</h2>
          <div role="group" aria-label="Latest close">
            <p>${latest.close.toFixed(2)}</p>
            <p>At close <time dateTime={stockData.asOf}>{stockData.asOf}</time></p>
          </div>
          <p>Source: {stockData.source}</p>
          <RangeControls range={range} view={view} onRangeChange={setRange} onViewChange={setView} />
          {selected.shortened && (
            <p>Less than {range === "1M" ? "one month" : "three months"} of history available. Showing all available observations.</p>
          )}
          <CandlestickChart
            key={`${stockData.symbol}-${range}`}
            data={selected.observations}
            view={view}
          />
        </section>
      )}
    </div>
  );
}

export default App;
