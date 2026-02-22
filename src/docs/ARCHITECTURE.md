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

**Decision:** localStorage keyed by `${symbol}-${dateString}`.

**Why:**

**Tradeoffs:**

- Pro:
- Pro:
- Con:
- Con:

**What I'd do next:** IndexedDB would allow...

TTL prevents stale data — without expiry you'd serve yesterday's prices forever
try/catch on both read and write — localStorage throws in private browsing on some browsers, and on write if the 5MB quota is exceeded.
Silent failure is correct here since the cache is an optimization, not a requirement
cachedAt gives you observability — you can log it in DevTools to confirm caching is working during Session 7 profiling

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
