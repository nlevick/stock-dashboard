// @vitest-environment jsdom

import { StrictMode } from 'react';

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { InstrumentSymbol } from '@/data/instruments';
import { useStockData } from '@/hooks/useStockData';

const requestWait = { timeout: 2_500 };

function dailyResponse(date: string) {
  return Response.json({
    'Time Series (Daily)': {
      [date]: {
        '1. open': '12',
        '2. high': '15',
        '3. low': '11',
        '4. close': '14',
        '5. volume': '20',
      },
    },
  });
}

beforeEach(() => vi.stubGlobal('localStorage', undefined));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function deferredResponse() {
  let resolve!: (response: Response) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Response>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

it.each(['resolve', 'reject'] as const)(
  'keeps the newer selection when the older request settles via %s',
  async (outcome) => {
    const older = deferredResponse();
    const newer = deferredResponse();
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    vi.stubGlobal('fetch', fetch);

    const { result, rerender } = renderHook(
      ({ symbol }: { symbol: InstrumentSymbol }) => useStockData(symbol),
      { initialProps: { symbol: 'SPY' } }
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1), requestWait);
    rerender({ symbol: 'IBIT' });
    expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(result.current).toMatchObject({
      loading: true,
      stockData: null,
      error: null,
    });

    if (outcome === 'reject') {
      await act(async () => older.reject(new Error('old failure')));
      expect(result.current).toMatchObject({
        loading: true,
        stockData: null,
        error: null,
      });
    }
    await act(async () => newer.resolve(dailyResponse('2025-03-12')));
    await waitFor(
      () =>
        expect(result.current).toMatchObject({
          loading: false,
          error: null,
          stockData: { symbol: 'IBIT', data: [{ date: '2025-03-12' }] },
        }),
      requestWait
    );
    if (outcome === 'resolve') {
      await act(async () => older.resolve(dailyResponse('2025-03-11')));
      expect(result.current.stockData).toMatchObject({
        symbol: 'IBIT',
        data: [{ date: '2025-03-12' }],
      });
    }
  }
);

it('clears the old quote, retries the current symbol, and recovers from burst throttling', async () => {
  const fetch = vi
    .fn<typeof globalThis.fetch>()
    .mockResolvedValueOnce(dailyResponse('2025-03-11'))
    .mockResolvedValueOnce(
      Response.json({
        Information: 'Please spread out your requests (1 per second).',
      })
    )
    .mockResolvedValueOnce(dailyResponse('2025-03-12'));
  vi.stubGlobal('fetch', fetch);

  const { result, rerender } = renderHook(
    ({ symbol }: { symbol: InstrumentSymbol }) => useStockData(symbol),
    { initialProps: { symbol: 'SPY' }, wrapper: StrictMode }
  );
  await waitFor(
    () => expect(result.current.stockData?.symbol).toBe('SPY'),
    requestWait
  );

  rerender({ symbol: 'IBIT' });
  expect(result.current).toMatchObject({
    loading: true,
    stockData: null,
    error: null,
  });
  await waitFor(
    () =>
      expect(result.current.error).toMatchObject({
        code: 'RATE_LIMITED',
        message: expect.stringContaining('Wait a moment'),
      }),
    requestWait
  );

  act(() => result.current.retry());
  expect(result.current).toMatchObject({
    loading: true,
    stockData: null,
    error: null,
  });
  await waitFor(
    () =>
      expect(result.current).toMatchObject({
        loading: false,
        error: null,
        stockData: { symbol: 'IBIT', data: [{ date: '2025-03-12' }] },
      }),
    requestWait
  );
  expect(
    fetch.mock.calls.map(([url]) =>
      new URL(String(url)).searchParams.get('symbol')
    )
  ).toEqual(['SPY', 'IBIT', 'IBIT']);
});

it.each([
  [
    'daily',
    'Our standard API rate limit is 25 requests per day.',
    'RATE_LIMITED',
    'Daily API limit reached',
  ],
  [
    'daily',
    'This is a premium endpoint. Please subscribe.',
    'ACCESS_RESTRICTED',
    'access to daily data',
  ],
  [
    'weekly',
    'This is a premium endpoint. Please subscribe.',
    'ACCESS_RESTRICTED',
    'access to weekly data',
  ],
] as const)(
  'classifies %s provider feedback for %s',
  async (interval, Information, code, message) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ Information }))
    );
    const { result } = renderHook(() => useStockData('SPY', interval));

    await waitFor(
      () =>
        expect(result.current.error).toMatchObject({
          code,
          message: expect.stringContaining(message),
        }),
      requestWait
    );
  }
);
