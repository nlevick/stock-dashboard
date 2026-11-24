import { instruments, type InstrumentSymbol } from '@/data/instruments';

import { TickerItem } from './TickerItem';

interface SymbolRailProps {
  symbol: InstrumentSymbol;
  onSelect: (symbol: InstrumentSymbol) => void;
}

export function SymbolRail({ symbol, onSelect }: SymbolRailProps) {
  return (
    <div className="symbol-rail glass-panel" role="group" aria-label="Ticker">
      <h2>Symbols</h2>
      {instruments.map((instrument) => (
        <TickerItem
          key={instrument.symbol}
          symbol={instrument.symbol}
          name={instrument.name}
          selected={symbol === instrument.symbol}
          onSelect={() => onSelect(instrument.symbol)}
        />
      ))}
    </div>
  );
}
