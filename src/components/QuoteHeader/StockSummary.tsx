import { useId } from 'react';

import type { StockDataPoint } from '@/types/stock';
import {
  formatObservationDate,
  formatPrice,
  formatShareCount,
} from '@/utils/stockFormatting';

export function StockSummary({
  observation,
}: {
  observation?: StockDataPoint;
}) {
  const heading = useId();

  return (
    <div className="quote-summary">
      <h3 className="visually-hidden" id={heading}>
        Daily statistics
      </h3>
      <dl className="stock-summary" aria-labelledby={heading}>
        <div>
          <dt>At close</dt>
          <dd>
            {observation ? (
              <time dateTime={observation.date}>
                {formatObservationDate(observation.date)}
              </time>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div>
          <dt>Open</dt>
          <dd>{observation ? formatPrice(observation.open) : '—'}</dd>
        </div>
        <div>
          <dt>Day range</dt>
          <dd>
            {observation
              ? `${formatPrice(observation.low)} – ${formatPrice(observation.high)}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Volume</dt>
          <dd>{observation ? formatShareCount(observation.volume) : '—'}</dd>
        </div>
      </dl>
    </div>
  );
}
