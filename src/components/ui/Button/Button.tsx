import type { ComponentPropsWithoutRef } from 'react';

export function Button({
  className,
  type = 'button',
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      {...props}
      className={className ? `ui-button ${className}` : 'ui-button'}
      type={type}
    />
  );
}
