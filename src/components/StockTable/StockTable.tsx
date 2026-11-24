import { useId, useLayoutEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button/Button';
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
type TableFocus = 'row' | 'table' | null;

const defaultSort: { column: Column; direction: Direction } = {
  column: 'date',
  direction: 'descending',
};

export function StockTable({
  observations,
  series,
  selectedDate,
  onObservationSelect,
}: {
  observations: readonly StockDataPoint[];
  series?: string;
  selectedDate?: string;
  onObservationSelect?: (date: string) => void;
}) {
  const heading = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasObservations = observations.length > 0;
  const [tableFocus, setTableFocus] = useState<TableFocus>(null);
  const [tableView, setTableView] = useState({
    series,
    hasObservations,
    sort: defaultSort,
    restoreFocus: false,
  });
  const { sort } = tableView;
  const seriesChanged = series !== tableView.series;
  if (seriesChanged || hasObservations !== tableView.hasObservations) {
    // Replacing rows or hiding the table can displace focus before the layout effect.
    setTableView({
      series,
      hasObservations,
      sort: seriesChanged ? defaultSort : sort,
      restoreFocus:
        tableFocus === 'row' || (!hasObservations && tableFocus === 'table'),
    });
  }

  useLayoutEffect(() => {
    const scrollRegion = scrollRef.current;
    if (!scrollRegion) return;

    if (tableView.restoreFocus) {
      const { activeElement, body } = scrollRegion.ownerDocument;
      const focusIsInAffectedArea =
        scrollRegion.contains(activeElement) &&
        (scrollRegion.hidden || activeElement?.closest('tbody'));
      if (activeElement === body || focusIsInAffectedArea) {
        if (scrollRegion.hidden) {
          headingRef.current?.focus();
        } else {
          scrollRegion.focus({ preventScroll: true });
        }
      }
    }
    scrollRegion.scrollTop = 0;
  }, [tableView]);

  const rows = [...observations].sort((left, right) => {
    const order =
      sort.column === 'date'
        ? left.date.localeCompare(right.date)
        : left[sort.column] - right[sort.column];
    return sort.direction === 'ascending' ? order : -order;
  });

  function sortBy(column: Column) {
    setTableView({
      ...tableView,
      sort: {
        column,
        direction:
          sort.column === column && sort.direction === 'descending'
            ? 'ascending'
            : 'descending',
      },
      restoreFocus: tableFocus === 'row',
    });
  }

  return (
    <section
      className="stock-history glass-panel"
      aria-labelledby={heading}
      onFocus={({ target }) => {
        if (scrollRef.current?.contains(target)) {
          setTableFocus(target.closest('tbody') ? 'row' : 'table');
        } else {
          setTableFocus(null);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setTableFocus(null);
        }
      }}
    >
      <h2 id={heading} ref={headingRef} tabIndex={-1}>
        Historical prices
      </h2>
      <div
        ref={scrollRef}
        className="stock-table-scroll"
        role="region"
        aria-label="Scrollable observations"
        tabIndex={0}
        hidden={!hasObservations}
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
                    <span className="stock-table-sort-arrow" aria-hidden="true">
                      {sort.column === key &&
                        (sort.direction === 'ascending' ? '↑' : '↓')}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((observation) => {
              const date = (
                <time dateTime={observation.date}>
                  {formatObservationDate(observation.date)}
                </time>
              );
              return (
                <tr
                  key={observation.date}
                  onClick={
                    onObservationSelect &&
                    (() => onObservationSelect(observation.date))
                  }
                >
                  <th scope="row">
                    {onObservationSelect ? (
                      <Button
                        className="stock-table-date"
                        aria-current={
                          observation.date === selectedDate || undefined
                        }
                      >
                        {date}
                      </Button>
                    ) : (
                      date
                    )}
                  </th>
                  {priceColumns.map(({ key }) => (
                    <td key={key}>{formatPrice(observation[key])}</td>
                  ))}
                  <td>{formatShareCount(observation.volume)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
