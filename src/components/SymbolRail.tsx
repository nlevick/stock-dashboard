import { instruments, type InstrumentSymbol } from "@/data/instruments";

interface SymbolRailProps {
  symbol: InstrumentSymbol;
  onSelect: (symbol: InstrumentSymbol) => void;
}

export function SymbolRail({ symbol, onSelect }: SymbolRailProps) {
  return (
    <div className="symbol-rail glass-panel" role="group" aria-label="Ticker">
      <h2>Symbols</h2>
      {instruments.map((instrument) => (
        <button
          key={instrument.symbol}
          type="button"
          aria-label={instrument.symbol}
          aria-describedby={`instrument-${instrument.symbol}`}
          aria-pressed={symbol === instrument.symbol}
          onClick={() => onSelect(instrument.symbol)}
        >
          <strong>{instrument.symbol}</strong>
          <span className="symbol-name" id={`instrument-${instrument.symbol}`}>{instrument.name}</span>
        </button>
      ))}
    </div>
  );
}
