import { useId } from 'react';

import { Statistic } from '@/components/ui/Statistic/Statistic';
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
        <Statistic
          label="At close"
          value={
            observation ? (
              <time dateTime={observation.date}>
                {formatObservationDate(observation.date)}
              </time>
            ) : (
              '—'
            )
          }
        />
        <Statistic
          label="Open"
          value={observation ? formatPrice(observation.open) : '—'}
        />
        <Statistic
          label="Day range"
          value={
            observation
              ? `${formatPrice(observation.low)} – ${formatPrice(observation.high)}`
              : '—'
          }
        />
        <Statistic
          label="Volume"
          value={observation ? formatShareCount(observation.volume) : '—'}
        />
      </dl>
    </div>
  );
}
