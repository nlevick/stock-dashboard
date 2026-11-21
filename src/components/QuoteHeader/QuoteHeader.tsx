import type { ReactNode } from 'react';

import type { StockDataPoint } from '@/types/stock';
import { formatPrice } from '@/utils/stockFormatting';

import { StockSummary } from './StockSummary';

interface QuoteHeaderProps {
  symbol: string;
  latest?: StockDataPoint;
  previous?: StockDataPoint;
  status?: ReactNode;
}

const signedUsd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  signDisplay: 'exceptZero',
});
const signedPercent = new Intl.NumberFormat('en-US', {
  style: 'percent',
  signDisplay: 'exceptZero',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function QuoteHeader({
  symbol,
  latest,
  previous,
  status,
}: QuoteHeaderProps) {
  const change = latest && previous ? latest.close - previous.close : null;
  const percent =
    change !== null && previous && previous.close !== 0
      ? change / previous.close
      : null;

  return (
    <div
      className="quote-header"
      role={latest ? 'group' : undefined}
      aria-label={latest ? 'Latest close' : undefined}
    >
      <div className="quote-identity">
        <h2 className="quote-symbol">{symbol}</h2>
        <div className="quote-price-line">
          {status || (
            <p className="quote-price">
              {latest ? formatPrice(latest.close) : '—'}
            </p>
          )}
          {change !== null && (
            <p
              className="quote-change"
              data-direction={
                change < 0 ? 'down' : change > 0 ? 'up' : undefined
              }
            >
              {signedUsd.format(change)}
              {percent !== null && ` (${signedPercent.format(percent)})`}
            </p>
          )}
        </div>
      </div>
      <StockSummary observation={latest} />
    </div>
  );
}
