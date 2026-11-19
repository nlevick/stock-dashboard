import type { StockDataPoint } from "@/types/stock";

interface QuoteHeaderProps {
  latest: StockDataPoint;
  previous?: StockDataPoint;
  source: string;
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const signedUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", signDisplay: "exceptZero" });
const signedPercent = new Intl.NumberFormat("en-US", {
  style: "percent", signDisplay: "exceptZero", minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function QuoteHeader({ latest, previous, source }: QuoteHeaderProps) {
  const change = previous ? latest.close - previous.close : null;
  const percent = change !== null && previous && previous.close !== 0 ? change / previous.close : null;

  return (
    <div className="quote-header" role="group" aria-label="Latest close">
      <div className="quote-price-line">
        <p className="quote-price">{usd.format(latest.close)}</p>
        {change !== null && (
          <p className="quote-change" data-direction={change < 0 ? "down" : change > 0 ? "up" : undefined}>
            {signedUsd.format(change)}{percent !== null && ` (${signedPercent.format(percent)})`}
          </p>
        )}
      </div>
      <p className="quote-date">At close <time dateTime={latest.date}>{date.format(new Date(latest.date))}</time></p>
      <p className="data-source">Source: {source}</p>
    </div>
  );
}
