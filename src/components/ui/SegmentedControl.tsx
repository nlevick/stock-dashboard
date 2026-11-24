import type { ReactElement } from 'react';

import { Button } from './Button';

interface SegmentedOption<Value extends string> {
  value: Value;
  label: string;
  icon?: ReactElement;
  title?: string;
}

interface SegmentedControlProps<Value extends string> {
  className?: string;
  label: string;
  options: readonly SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}

export function SegmentedControl<Value extends string>({
  className,
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <div className={className} role="group" aria-label={label}>
      {options.map((option) => (
        <Button
          key={option.value}
          aria-label={option.icon ? option.label : undefined}
          aria-pressed={value === option.value}
          title={option.title}
          onClick={() => onChange(option.value)}
        >
          {option.icon ?? option.label}
        </Button>
      ))}
    </div>
  );
}
