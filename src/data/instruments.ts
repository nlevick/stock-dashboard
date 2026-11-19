export const instruments = [
  { symbol: "SPY", name: "State Street SPDR S&P 500 ETF Trust" },
  { symbol: "IBIT", name: "iShares Bitcoin Trust ETF" },
  { symbol: "GDX", name: "VanEck Gold Miners ETF" },
] as const;

export type InstrumentSymbol = (typeof instruments)[number]["symbol"];
