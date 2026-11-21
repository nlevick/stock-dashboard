import { useEffect, useMemo, useState } from 'react';

import type { InstrumentSymbol } from '@/data/instruments';
import { fetchStockData } from '@/services/stockApi';
import { type ApiError, StockApiError } from '@/types/error';
import type { StockData, StockInterval } from '@/types/stock';

type Request = {
  symbol: InstrumentSymbol;
  interval: StockInterval;
  attempt: number;
};
type Result = { request: Request } & (
  { data: StockData; error: null } | { data: null; error: ApiError }
);

export function useStockData(
  symbol: InstrumentSymbol | null,
  interval: StockInterval = 'daily'
) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const request = useMemo(
    () => (symbol ? { symbol, interval, attempt } : null),
    [symbol, interval, attempt]
  );
  const current = result?.request === request ? result : null;

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();

    // Strict Mode runs an effect setup and cleanup before the real setup in development.
    queueMicrotask(() => {
      if (controller.signal.aborted) return;

      fetchStockData(request.symbol, request.interval, controller.signal).then(
        (data) => {
          if (!controller.signal.aborted) {
            setResult({ request, data, error: null });
          }
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          const details: ApiError =
            error instanceof StockApiError
              ? { code: error.code, message: error.message }
              : { code: 'NETWORK_ERROR', message: 'Network request failed' };
          setResult({ request, data: null, error: details });
        }
      );
    });

    return () => controller.abort();
  }, [request]);

  return {
    loading: request !== null && current === null,
    error: current?.error ?? null,
    stockData: current?.data ?? null,
    retry: () => setAttempt((previous) => previous + 1),
  };
}
