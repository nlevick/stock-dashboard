# Architecture

Stock Dashboard reads daily and weekly price history from Alpha Vantage in
development and from checked-in JSON on GitHub Pages. Both sources pass through
the same parser. React coordinates data and interaction state, D3 computes chart
geometry, and React renders the SVG.

## Code map

| Area              | Responsibility                                                                                                              | Start here                                                                                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard state   | Owns the selected ticker, interval, and chart view. Coordinates the daily quote and active history.                         | [App](../App/App.tsx)                                                                                                                                                                                 |
| Data              | Selects the source, validates and normalizes observations, caches development responses, and maps failures to typed errors. | [API client](../services/stockApi.ts), [parser](../services/parseStockData.ts), [cache](../services/cache.ts)                                                                                         |
| Request lifecycle | Tracks the current request and retry attempt, aborts superseded requests, and ignores late results.                         | [Data hook](../hooks/useStockData.ts)                                                                                                                                                                 |
| Chart             | Computes scales and marks, measures the SVG, and handles pointer and keyboard inspection.                                   | [Chart model](../components/CandlestickChart/chartModel.ts), [chart interaction](../components/CandlestickChart/CandlestickChart.tsx), [SVG plot](../components/CandlestickChart/CandlestickPlot.tsx) |
| History table     | Sorts the active series and renders it in a bounded scroll area with a sticky header.                                       | [Stock table](../components/StockTable/StockTable.tsx)                                                                                                                                                 |

## Shared UI

`src/components/ui` holds the reusable controls and label–value display.
`Button` wraps a native button and defaults to `type="button"`.
`SegmentedControl` renders both the Daily/Weekly text buttons and the
Candles/Bars/Line icon buttons. `Statistic` renders a label and value inside
a description list, both in the daily stock summary and in the chart’s date
and OHLCV readout.
[Chart controls](../components/CandlestickChart/ChartControls/ChartControls.tsx) ·
[Daily stock summary](../components/QuoteHeader/StockSummary.tsx) ·
[Chart readout](../components/CandlestickChart/CandlestickChart.tsx)

Features own their layout and domain-specific rendering. `SymbolRail` owns
`TickerItem`, which composes `Button` with ticker details. The chart owns its
scales, axes, and SVG marks. Component styles live alongside the components
that use them. `index.html` loads `theme.css`, which imports those styles and
defines shared tokens, base styles, and focus treatment.
[Dashboard layout](../App/App.css) · [Theme stylesheet](../styles/theme.css)

## Data sources and request budget

- **Development.** The initial view loads the selected ticker's daily series
  for both the quote and history. Weekly history is fetched when selected. A
  cold ticker opened in Weekly view can require two requests. Switching chart
  styles uses the same observations.
- **Data size.** The daily request uses Alpha Vantage's compact output of up to
  100 observations. The weekly endpoint can return a longer history. The client
  validates and sorts each series, then keeps the latest 100 observations.
  [Alpha Vantage time-series documentation](https://www.alphavantage.co/documentation/)
- **Cache and pacing.** Validated, nonempty development responses are cached
  in `localStorage` by ticker, interval, and UTC date. Entries expire after
  12 hours or fall out of use at UTC midnight. Invalid entries and storage
  failures act as cache misses. Live requests are spaced about one second
  apart within the running app. Alpha Vantage enforces the daily quota.
- **Public demo.** GitHub Pages serves four [snapshot files](../../public/data)
  bundled with the production build. The app fetches these files under the
  configured Pages base path, so visitors use neither a key nor API quota.

## Loading and recovery

1. The [data hook](../hooks/useStockData.ts) associates each result with its
   ticker, interval, and retry attempt. Effect cleanup aborts superseded work,
   so a late response cannot replace the current selection.
2. On a ticker or interval change, the [dashboard](../App/App.tsx) keeps the previous
   chart and table visible while the requested data loads. The quote keeps
   the ticker of the data on screen, and the chart dims beneath a loading
   status. The dashboard switches once the active requests settle.
3. The [parser](../services/parseStockData.ts) validates the response at runtime,
   including dates, finite prices, OHLC bounds, and whole-number volume.
   The [API client](../services/stockApi.ts) separates network, HTTP, invalid
   data, invalid symbol, key access, and rate-limit errors. An empty live
   series gets its own status and a retry action.
4. In Weekly view, the daily close and weekly history can fail and be retried
   independently. A successful daily quote can remain visible through a
   weekly error, and loaded weekly history can still be inspected if the
   daily close fails.

## Chart and interaction

- **Rendering.** D3 builds the band and linear scales and generates the
  closing-price path. React renders the axes, marks, volume bars, and
  crosshair in SVG. A band scale gives consecutive trading sessions even
  spacing across market closures. The 100-observation cap keeps the amount
  of SVG markup bounded, and the three price views share the same scales.
- **Inspection.** The chart converts pointer position into the nearest
  observation using D3's `bisectCenter`. A touch selection stays visible
  after release. Keyboard navigation updates the same readout and publishes
  the selected date and values in a status region for screen readers.
- **Table selection.** Selecting a row or activating its date button pins that
  observation. `App` stores the pin by displayed ticker, interval, and date.
  The table marks the pinned row, and the chart uses the date to position its
  crosshair and update the readout. Hover previews another observation and
  restores the pin when the pointer leaves. Using the chart’s inspection keys
  or tapping the plot replaces the pin with a chart selection. The pin also
  clears when the displayed series changes or the selected date disappears.
  The daily quote continues to show the latest daily observation.
- **Table scrolling.** Sorting keeps the pin and resets the table’s vertical
  scroll. When the displayed series changes, the table returns to newest-first
  order and scrolls to the top. If a row had keyboard focus, focus moves to the
  scroll region. If the table becomes empty while focus is anywhere in the
  scroll region, focus moves to the table heading.
- **Layout and access.** A `ResizeObserver` remeasures the plot, and the chart
  reduces tick density at smaller sizes. CSS reflows the ticker controls and
  chart readout, increases key control sizes for coarse pointers, and gives
  keyboard focus a visible outline. The semantic table exposes the same
  observations and reports the active sort.

## Tests

```sh
npm exec -- vitest run
npm exec -- eslint .
npm run format:check
npm run build
```

Vitest covers the parser, cache, and chart calculations without a live API
key. React Testing Library tests exercise the rendered UI with controlled
responses. The suite checks stale requests, throttling and retry, independent
quote and history failures, keyboard, pointer, and touch inspection, table
sorting and row activation, chart pin restoration, full-series rendering, and
focus recovery when the displayed series changes.

[Dashboard tests](../App/App.test.tsx) · [Request tests](../hooks/useStockData.test.tsx) ·
[Chart tests](../components/CandlestickChart/CandlestickChart.test.tsx) ·
[Table tests](../components/StockTable/StockTable.test.tsx)
