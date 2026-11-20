import { useId, useState } from 'react';

import type { StockDataPoint } from '@/types/stock';
import {
  formatObservationDate,
  formatPrice,
  formatShareCount,
} from '@/utils/stockFormatting';

const priceColumns = [
  { key: 'open', label: 'Open' },
  { key: 'high', label: 'High' },
  { key: 'low', label: 'Low' },
  { key: 'close', label: 'Close' },
] as const;

const columns = [
  { key: 'date', label: 'Date' },
  ...priceColumns,
  { key: 'volume', label: 'Volume' },
] as const;

type Column = (typeof columns)[number]['key'];
type Direction = 'ascending' | 'descending';

const pageSize = 5;

export function StockTable({
  observations,
}: {
  observations: readonly StockDataPoint[];
}) {
  const heading = useId();
  const [sort, setSort] = useState<{ column: Column; direction: Direction }>({
    column: 'date',
    direction: 'descending',
  });
  const [page, setPage] = useState(0);
  const lastPage = Math.max(0, Math.ceil(observations.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  if (currentPage !== page) setPage(currentPage);
  if (observations.length === 0) return null;

  const start = currentPage * pageSize;
  const rows = [...observations]
    .sort((left, right) => {
      const order =
        sort.column === 'date'
          ? left.date.localeCompare(right.date)
          : left[sort.column] - right[sort.column];
      return sort.direction === 'ascending' ? order : -order;
    })
    .slice(start, start + pageSize);

  function sortBy(column: Column) {
    setSort({
      column,
      direction:
        sort.column === column && sort.direction === 'descending'
          ? 'ascending'
          : 'descending',
    });
    setPage(0);
  }

  function movePage(offset: number) {
    const target = currentPage + offset;
    if (target >= 0 && target <= lastPage) setPage(target);
  }

  return (
    <section className="stock-history glass-panel" aria-labelledby={heading}>
      <h2 id={heading}>Historical prices</h2>
      <div
        className="stock-table-scroll"
        role="region"
        aria-label="Scrollable observations"
        tabIndex={0}
      >
        <table aria-labelledby={heading}>
          <thead>
            <tr>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  aria-sort={sort.column === key ? sort.direction : undefined}
                >
                  <button type="button" onClick={() => sortBy(key)}>
                    {label}
                    {sort.column === key && (
                      <span aria-hidden="true">
                        {' '}
                        {sort.direction === 'ascending' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((observation) => (
              <tr key={observation.date}>
                <th scope="row">
                  <time dateTime={observation.date}>
                    {formatObservationDate(observation.date)}
                  </time>
                </th>
                {priceColumns.map(({ key }) => (
                  <td key={key}>{formatPrice(observation[key])}</td>
                ))}
                <td>{formatShareCount(observation.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="stock-table-footer">
        <p role="status">
          {start + 1}–{start + rows.length} of {observations.length}
          {' observations'}
        </p>
        <div
          className="stock-table-pagination"
          role="group"
          aria-label="Pagination"
        >
          <button
            type="button"
            aria-label="Previous page"
            aria-disabled={currentPage === 0}
            onClick={() => movePage(-1)}
          >
            ←
          </button>
          <span>
            Page {currentPage + 1} of {lastPage + 1}
          </span>
          <button
            type="button"
            aria-label="Next page"
            aria-disabled={currentPage === lastPage}
            onClick={() => movePage(1)}
          >
            →
          </button>
        </div>
      </div>
    </section>
  );
}
