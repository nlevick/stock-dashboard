export const instruments = [
  { symbol: 'SPY', name: 'State Street SPDR S&P 500 ETF Trust' },
  { symbol: 'IBIT', name: 'iShares Bitcoin Trust ETF' },
] as const;

export type InstrumentSymbol = (typeof instruments)[number]['symbol'];
