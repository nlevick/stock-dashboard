import { useStockData } from "@/hooks/useStockData";
import { THEME, useTheme } from "@/hooks/useTheme";
import "@/styles/theme.css";

function App() {
  const { theme, toggleTheme } = useTheme();
  const { loading, error, stockData, retry } = useStockData("IBIT");

  {
    /* TODO: Breakout components */
  }
  return (
    <div style={{ padding: "2rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>Stock Dashboard</h1>
        <button
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

      {loading && <p>Loading stock data...</p>}
      {error && (
        <div role="alert" style={{ color: "var(--chart-down)" }}>
          Error: {error.message}
          {" "}
          <button type="button" onClick={retry}>Retry</button>
          {error.code === "INVALID_SYMBOL" && (
            <span> — check the symbol and try again</span>
          )}
        </div>
      )}
      {stockData?.data.length === 0 && (
        <p role="status">No daily observations returned. <button type="button" onClick={retry}>Retry</button></p>
      )}
      {stockData && stockData.data.length > 0 && (
        <div>
          <h2>{stockData.symbol} Stock Data</h2>
          <p style={{ color: "var(--text-secondary)" }}>
            Loaded {stockData.data.length} data points from{" "}
            {stockData.data[0]?.date} to{" "}
            {stockData.data[stockData.data.length - 1]?.date}
          </p>
          <p>Source: {stockData.source}</p>
          {/* TODO: Chart goes here */}
          <div
            style={{
              marginTop: "2rem",
              padding: "2rem",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
            }}
          >
            <p>📊 Candlestick chart will be rendered here</p>
            <p style={{ color: "var(--text-secondary)", marginTop: "1rem" }}>
              Latest close: $
              {stockData.data[stockData.data.length - 1]?.close.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
