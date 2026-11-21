import { MoonIcon } from '@/components/icons/MoonIcon';
import { SunIcon } from '@/components/icons/SunIcon';
import { THEME } from '@/hooks/useTheme';

interface ThemeToggleProps {
  theme: THEME;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === THEME.DARK;
  const label = isDark ? 'Light theme' : 'Dark theme';

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
