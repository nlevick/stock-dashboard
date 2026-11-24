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
import type { StockDataPoint } from '@/types/stock';

import { StockTable } from './StockTable';

const observations: StockDataPoint[] = [
  { date: '2025-01-01', close: 12, volume: 12000 },
  { date: '2024-12-10', close: 2, volume: 2000 },
  { date: '2025-01-03', close: 32, volume: 32000 },
  { date: '2024-12-02', close: 9, volume: 9000 },
  { date: '2025-01-02', close: 100, volume: 100000 },
  { date: '2024-12-30', close: 21, volume: 21000 },
  { date: '2025-01-04', close: 3, volume: 3000 },
].map((row) => ({
  ...row,
  open: row.close,
  high: row.close + 1,
  low: row.close - 1,
}));

afterEach(cleanup);

it('sorts dates across years and numeric fields in both directions', () => {
  render(<StockTable observations={observations} />);
  const table = within(
    screen.getByRole('table', { name: 'Historical prices' })
  );
  const dates = () =>
    table.getAllByRole('rowheader').map((cell) => cell.textContent);
  const closePrices = () =>
    table
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[3].textContent);

  expect(
    table.getByRole('columnheader', { name: 'Date' }).getAttribute('aria-sort')
  ).toBe('descending');
  expect(dates()).toEqual([
    'Jan 4, 2025',
    'Jan 3, 2025',
    'Jan 2, 2025',
    'Jan 1, 2025',
    'Dec 30, 2024',
    'Dec 10, 2024',
    'Dec 2, 2024',
  ]);
  fireEvent.click(table.getByRole('button', { name: 'Date' }));
  expect(
    table.getByRole('columnheader', { name: 'Date' }).getAttribute('aria-sort')
  ).toBe('ascending');
  expect(dates()).toEqual([
    'Dec 2, 2024',
    'Dec 10, 2024',
    'Dec 30, 2024',
    'Jan 1, 2025',
    'Jan 2, 2025',
    'Jan 3, 2025',
    'Jan 4, 2025',
  ]);

  fireEvent.click(table.getByRole('button', { name: 'Close' }));
  expect(
    table.getByRole('columnheader', { name: 'Date' }).hasAttribute('aria-sort')
  ).toBe(false);
  expect(
    table.getByRole('columnheader', { name: 'Close' }).getAttribute('aria-sort')
  ).toBe('descending');
  expect(closePrices()).toEqual([
    '$100.00',
    '$32.00',
    '$21.00',
    '$12.00',
    '$9.00',
    '$3.00',
    '$2.00',
  ]);
  fireEvent.click(table.getByRole('button', { name: 'Close' }));
  expect(
    table.getByRole('columnheader', { name: 'Close' }).getAttribute('aria-sort')
  ).toBe('ascending');
  expect(closePrices()).toEqual([
    '$2.00',
    '$3.00',
    '$9.00',
    '$12.00',
    '$21.00',
    '$32.00',
    '$100.00',
  ]);
});

it('activates the sorted observation by date button and by price cell', () => {
  const onObservationSelect = vi.fn();
  const { rerender } = render(
    <StockTable
      observations={observations}
      onObservationSelect={onObservationSelect}
    />
  );
  const table = within(
    screen.getByRole('table', { name: 'Historical prices' })
  );
  fireEvent.click(table.getByRole('button', { name: 'Close' }));

  const dateButton = table.getByRole('button', { name: 'Jan 2, 2025' });
  fireEvent.click(dateButton);
  const row = table.getByRole('row', { name: /^Jan 2, 2025 / });
  fireEvent.click(within(row).getByRole('cell', { name: '$101.00' }));
  expect(onObservationSelect.mock.calls).toEqual([
    ['2025-01-02'],
    ['2025-01-02'],
  ]);

  rerender(
    <StockTable
      observations={observations}
      onObservationSelect={onObservationSelect}
      selectedDate="2025-01-02"
    />
  );
  expect(table.getByRole('button', { current: true }).textContent).toBe(
    'Jan 2, 2025'
  );
});

it('renders the full series and updates the rows when it shrinks', () => {
  const fullSeries = Array.from({ length: 100 }, (_, index) => ({
    ...observations[0],
    date: new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10),
  }));
  const { rerender } = render(<StockTable observations={fullSeries} />);
  const table = within(
    screen.getByRole('table', { name: 'Historical prices' })
  );

  expect(table.getAllByRole('rowheader')).toHaveLength(100);
  rerender(<StockTable observations={observations.slice(0, 2)} />);
  expect(
    table.getAllByRole('rowheader').map((cell) => cell.textContent)
  ).toEqual(['Jan 1, 2025', 'Dec 10, 2024']);
});

it.each([
  { replacement: 'keeps the focused date', next: observations.slice(1) },
  {
    replacement: 'drops the focused date',
    next: observations.filter(({ date }) => date !== '2024-12-02'),
  },
  { replacement: 'has no dates', next: [] },
])(
  'resets scroll and keeps focus visible when the new series $replacement',
  ({ next }) => {
    const onObservationSelect = () => undefined;
    const { rerender } = render(
      <StockTable
        observations={observations}
        series="SPY-daily"
        onObservationSelect={onObservationSelect}
      />
    );
    const scrollRegion = screen.getByRole('region', {
      name: 'Scrollable observations',
    });
    act(() => {
      within(scrollRegion).getByRole('button', { name: 'Dec 2, 2024' }).focus();
    });
    scrollRegion.scrollTop = 50;

    rerender(
      <StockTable
        observations={next}
        series="SPY-weekly"
        onObservationSelect={onObservationSelect}
      />
    );

    const focusTarget = next.length
      ? scrollRegion
      : screen.getByRole('heading', { name: 'Historical prices' });
    expect(document.activeElement).toBe(focusTarget);
    expect(scrollRegion.scrollTop).toBe(0);
  }
);

it.each([
  { control: 'scroll region', nextSeries: 'IBIT-daily' },
  { control: 'sort button', nextSeries: 'SPY-weekly' },
])(
  'recovers focus from the $control when the table becomes empty',
  ({ control, nextSeries }) => {
    const { rerender } = render(
      <StockTable observations={observations} series="SPY-daily" />
    );
    const scrollRegion = screen.getByRole('region', {
      name: 'Scrollable observations',
    });
    const focused =
      control === 'scroll region'
        ? scrollRegion
        : within(scrollRegion).getByRole('button', { name: 'Close' });
    act(() => focused.focus());

    rerender(<StockTable observations={observations} series="SPY-weekly" />);
    expect(document.activeElement).toBe(focused);

    rerender(<StockTable observations={[]} series={nextSeries} />);
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { name: 'Historical prices' })
    );
  }
);
