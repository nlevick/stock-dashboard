import { useId } from "react";
import type { StockDataPoint } from "@/types/stock";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const shares = new Intl.NumberFormat("en-US");

export function StockSummary({ observation }: { observation: StockDataPoint }) {
  const heading = useId();

  return (
    <div className="stock-summary">
      <h3 id={heading}>Daily statistics</h3>
      <dl aria-labelledby={heading}>
        <div><dt>Open</dt><dd>{usd.format(observation.open)}</dd></div>
        <div><dt>Day range</dt><dd>{usd.format(observation.low)} – {usd.format(observation.high)}</dd></div>
        <div><dt>Volume</dt><dd>{shares.format(observation.volume)}</dd></div>
      </dl>
    </div>
  );
}
