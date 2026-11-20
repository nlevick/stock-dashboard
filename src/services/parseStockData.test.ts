import { describe, expect, it } from 'vitest';

import { parseStockData } from '@/services/parseStockData';
import { StockApiError } from '@/types/error';

const valid = {
  '1. open': '102.50',
  '2. high': '105.00',
  '3. low': '101.00',
  '4. close': '104.00',
  '5. volume': '1500',
};

describe('parseStockData', () => {
  it.each([
    ['a non-ISO date', { '2/28/2025': valid }],
    ['an impossible date', { '2025-02-29': valid }],
    ['a missing field', { '2025-02-28': { ...valid, '2. high': undefined } }],
    [
      'a nonfinite value',
      { '2025-02-28': { ...valid, '4. close': 'Infinity' } },
    ],
    ['a partial number', { '2025-02-28': { ...valid, '1. open': '102oops' } }],
    [
      'inconsistent OHLC bounds',
      { '2025-02-28': { ...valid, '2. high': '103.00' } },
    ],
    [
      'fractional volume',
      { '2025-02-28': { ...valid, '5. volume': '1500.5' } },
    ],
    ['a missing series', undefined],
  ])('rejects %s with a typed parse error', (_, series) => {
    expect(() => parseStockData(series)).toThrow(
      expect.toSatisfy(
        (error: unknown) =>
          error instanceof StockApiError && error.code === 'PARSE_ERROR'
      )
    );
  });

  it('returns numeric observations in chronological order regardless of input order', () => {
    const observations = parseStockData({
      '2024-03-04': valid,
      '2024-02-29': valid,
      '2024-03-01': valid,
    });

    expect(observations.map(({ date }) => date)).toEqual([
      '2024-02-29',
      '2024-03-01',
      '2024-03-04',
    ]);
    expect(observations[0]).toEqual({
      date: '2024-02-29',
      open: 102.5,
      high: 105,
      low: 101,
      close: 104,
      volume: 1500,
    });
  });

  it('returns no observations for an explicitly empty series', () => {
    expect(parseStockData({})).toEqual([]);
  });
});
