// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { fetchStockData } from '@/services/stockApi';
import type { StockData } from '@/types/stock';

import App from './App';

vi.mock('@/services/stockApi', () => ({ fetchStockData: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it('replaces the ticker data in place and keeps the quote fixed during chart inspection', async () => {
  const spy: StockData = {
    symbol: 'SPY',
    data: [
      {
        date: '2025-03-11',
        open: 19,
        low: 18,
        high: 21,
        close: 20,
        volume: 5000,
      },
      {
        date: '2025-03-12',
        open: 20,
        low: 19,
        high: 23,
        close: 22,
        volume: 8000,
      },
    ],
  };
  const ibit: StockData = {
    symbol: 'IBIT',
    data: [
      {
        date: '2025-03-12',
        open: 42,
        low: 39,
        high: 43,
        close: 40,
        volume: 9000,
      },
      {
        date: '2025-03-13',
        open: 41,
        low: 37,
        high: 42,
        close: 38,
        volume: 15000,
      },
    ],
  };
  let resolveIbit!: (data: StockData) => void;
  const ibitRequest = new Promise<StockData>((resolve) => {
    resolveIbit = resolve;
  });
  vi.mocked(fetchStockData).mockImplementation((symbol) =>
    symbol === 'SPY' ? Promise.resolve(spy) : ibitRequest
  );

  render(<App />);
  await screen.findByRole('group', { name: 'Latest close' });
  const expectQuote = (
    price: string,
    change: string,
    date: string,
    stats: string[]
  ) => {
    const quote = within(screen.getByRole('group', { name: 'Latest close' }));
    for (const text of [price, change, date]) {
      expect(quote.getByText(text)).toBeTruthy();
    }
    const summary = within(quote.getByLabelText('Daily statistics'));
    expect(
      summary.getAllByRole('definition').map((item) => item.textContent)
    ).toEqual([date, ...stats]);
  };
  expect(
    screen.getByRole('heading', { name: 'Daily statistics' })
  ).toBeTruthy();
  expectQuote('$22.00', '+$2.00 (+10.00%)', 'Mar 12, 2025', [
    '$20.00',
    '$19.00 – $23.00',
    '8,000',
  ]);

  const chart = screen.getByRole('img', {
    name: 'Candlestick price and volume chart',
  });
  const table = screen.getByRole('table', { name: 'Historical prices' });
  fireEvent.click(screen.getByRole('button', { name: 'IBIT' }));
  expect(screen.getByText('Loading...', { exact: true })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'SPY' })).toBeTruthy();
  expect(within(table).getByText('Mar 11, 2025')).toBeTruthy();

  await act(async () => resolveIbit(ibit));

  expect(screen.getByRole('heading', { name: 'IBIT' })).toBeTruthy();
  expect(within(table).getByText('Mar 13, 2025')).toBeTruthy();
  expect(
    screen.getByRole('img', { name: 'Candlestick price and volume chart' })
  ).toBe(chart);
  expect(screen.getByRole('table', { name: 'Historical prices' })).toBe(table);
  const ibitStats = ['$41.00', '$37.00 – $42.00', '15,000'];
  expectQuote('$38.00', '-$2.00 (-5.00%)', 'Mar 13, 2025', ibitStats);

  fireEvent.keyDown(chart, { key: 'ArrowLeft' });
  expect(
    within(
      screen.getByRole('group', { name: 'Inspected observation' })
    ).getByText('2025-03-12')
  ).toBeTruthy();
  expectQuote('$38.00', '-$2.00 (-5.00%)', 'Mar 13, 2025', ibitStats);
});

it.each([
  ['daily', 'Daily close unavailable. Network request failed'],
  ['weekly', 'Weekly history unavailable. Network request failed'],
] as const)(
  'identifies a failed %s request while the other result remains available',
  async (failedInterval, message) => {
    vi.mocked(fetchStockData).mockImplementation(async (symbol, interval) => {
      if (interval === failedInterval) {
        throw new Error('Network request failed');
      }

      const date = interval === 'weekly' ? '2025-03-07' : '2025-03-12';
      return {
        symbol,
        data: [{ date, open: 20, low: 19, high: 23, close: 22, volume: 8000 }],
      };
    });

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Weekly' }));
    expect((await screen.findByRole('alert')).textContent).toBe(message);

    if (failedInterval === 'daily') {
      expect(
        await screen.findByRole('img', {
          name: 'Candlestick price and volume chart',
        })
      ).toBeTruthy();
      expect(screen.queryByRole('group', { name: 'Latest close' })).toBeNull();
      expect(
        screen.getByRole('button', { name: 'Retry daily close' })
      ).toBeTruthy();
    } else {
      const quote = await screen.findByRole('group', { name: 'Latest close' });
      expect(within(quote).getByText('Mar 12, 2025')).toBeTruthy();
      expect(
        screen.queryByRole('img', {
          name: 'Candlestick price and volume chart',
        })
      ).toBeNull();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
    }
  }
);

it('shows an empty-history message and keeps the chart and table panels in place', async () => {
  vi.mocked(fetchStockData).mockImplementation(async (symbol) => ({
    symbol,
    data: [],
  }));

  render(<App />);

  expect(
    await screen.findByText('No daily observations returned.')
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  expect(
    screen.getByRole('heading', { name: 'Historical prices' })
  ).toBeTruthy();
  expect(
    screen.queryByRole('img', { name: 'Candlestick price and volume chart' })
  ).toBeNull();
  expect(screen.queryByRole('table', { name: 'Historical prices' })).toBeNull();
});
