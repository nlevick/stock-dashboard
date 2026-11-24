import type { ReactNode } from 'react';

interface StatisticProps {
  label: string;
  value: ReactNode;
}

export function Statistic({ label, value }: StatisticProps) {
  return (
    <div className="statistic">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
