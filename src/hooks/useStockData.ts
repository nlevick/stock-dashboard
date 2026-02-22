import { useEffect, useState } from "react";
import { fetchStockData } from "@/services/stockApi";
import type { StockData } from "@/types/stock";
import { ApiError, StockApiError } from "@/types/error";

export function useStockData(symbol: string) {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStockData(symbol, controller.signal);
        if (!cancelled) {
          setStockData(data);
        }
      } catch (err) {
        if (err instanceof StockApiError) {
          setError({ code: err.code, message: err.message });
        } else if (err instanceof DOMException && err.name === "AbortError") {
          // fetch was cancelled by AbortController so ignore
        } else {
          setError({
            code: "NETWORK_ERROR",
            message: "Network request failed",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [symbol]);

  return { loading, error, stockData };
}
