# Architecture

A technical reference for the decisions and tradeoffs made in this project. Written for engineers, not recruiters.

---

## D3 + React Boundary

_fill in after profiling_

**Decision:** React owns the SVG DOM via JSX. D3 is used purely for math: scales, axis generation, data transformation. D3 never touches the DOM directly.

**Why:**

**The one exception — crosshair tooltip:**

**What I measured:**

---

## SVG vs Canvas

_fill in after profiling_

**Decision:** SVG at current data density (~1,200 daily data points).

**Why SVG is appropriate here:**

**The threshold:** SVG degrades around 2,000–3,000 DOM nodes due to...

**Canvas migration path:** If I added tick-level intraday data or needed to render 10k+ points...

**What I measured:**

---

## Caching Strategy

Local development fetches from Alpha Vantage and caches validated observations
in `localStorage` by symbol, interval, and UTC date. Entries expire after 12
hours. A storage failure leaves the app free to fetch fresh data.

The GitHub Pages build fetches four static JSON files containing the 100 most
recent daily and weekly observations for SPY and IBIT through November 20, 2026.
The files use the Alpha Vantage time-series format and pass through the same
parser as local API responses. Browsers can cache the files over HTTP.

---

## What I'd Do at 100k+ Points

_fill in after profiling_

**Canvas rendering:**

**Data aggregation:**

**WebSocket streaming:**

**Virtualization:**

---

## Profiling Results

_fill in after profiling_

| Interaction            | Render time | DOM nodes | Notes |
| ---------------------- | ----------- | --------- | ----- |
| Symbol switch          |             |           |       |
| Range toggle (1M → 1Y) |             |           |       |
| Initial load           |             |           |       |

Screenshots: [`docs/profiling/`](./profiling/)

---

## What I'd Build Next

- [ ] Canvas renderer behind a feature flag, switchable at runtime
- [ ] IndexedDB cache with TTL and cache invalidation strategy
- [ ] WebSocket integration for real-time tick data
- [ ] Data aggregation layer for variable time resolution
