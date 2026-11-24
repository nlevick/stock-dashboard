import { useId } from 'react';

import { Button } from '@/components/ui/Button';

interface TickerItemProps {
  symbol: string;
  name: string;
  selected: boolean;
  onSelect: () => void;
}

export function TickerItem({
  symbol,
  name,
  selected,
  onSelect,
}: TickerItemProps) {
  const descriptionId = useId();

  return (
    <Button
      aria-label={symbol}
      aria-describedby={descriptionId}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <strong>{symbol}</strong>
      <span className="visually-hidden" id={descriptionId}>
        {name}
      </span>
    </Button>
  );
}
