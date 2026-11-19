import { useId } from "react";
import type { StockDataPoint } from "@/types/stock";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const shares = new Intl.NumberFormat("en-US");
const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function StockSummary({ observation }: { observation: StockDataPoint }) {
  const heading = useId();

  return (
    <div className="quote-summary">
      <h3 className="visually-hidden" id={heading}>Daily statistics</h3>
      <dl className="stock-summary" aria-labelledby={heading}>
        <div><dt>At close</dt><dd><time dateTime={observation.date}>{date.format(new Date(observation.date))}</time></dd></div>
        <div><dt>Open</dt><dd>{usd.format(observation.open)}</dd></div>
        <div><dt>Day range</dt><dd>{usd.format(observation.low)} – {usd.format(observation.high)}</dd></div>
        <div><dt>Volume</dt><dd>{shares.format(observation.volume)}</dd></div>
      </dl>
    </div>
  );
}
