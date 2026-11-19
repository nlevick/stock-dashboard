import { useEffect, useMemo, useState } from "react";
import type { InstrumentSymbol } from "@/data/instruments";
import { loadStockData, type StockDataResult } from "@/services/stockDataSource";
import { type ApiError, StockApiError } from "@/types/error";

type Request = { symbol: InstrumentSymbol; attempt: number };
type Result = { request: Request } & (
  | { data: StockDataResult; error: null }
  | { data: null; error: ApiError }
);

export function useStockData(symbol: InstrumentSymbol) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const request = useMemo(() => ({ symbol, attempt }), [symbol, attempt]);
  const current = result?.request === request ? result : null;

  useEffect(() => {
    const controller = new AbortController();

    // Strict Mode runs an effect setup and cleanup before the real setup in development.
    queueMicrotask(() => {
      if (controller.signal.aborted) return;

      loadStockData(request.symbol, controller.signal).then(
        (data) => {
          if (!controller.signal.aborted) setResult({ request, data, error: null });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          const details: ApiError = error instanceof StockApiError
            ? { code: error.code, message: error.message }
            : { code: "NETWORK_ERROR", message: "Network request failed" };
          setResult({ request, data: null, error: details });
        },
      );
    });

    return () => controller.abort();
  }, [request]);

  return {
    loading: current === null,
    error: current?.error ?? null,
    stockData: current?.data ?? null,
    retry: () => setAttempt((previous) => previous + 1),
  };
}
