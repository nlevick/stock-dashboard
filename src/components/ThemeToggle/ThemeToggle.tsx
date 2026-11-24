import { MoonIcon } from '@/components/icons/MoonIcon';
import { SunIcon } from '@/components/icons/SunIcon';
import { Button } from '@/components/ui/Button/Button';
import { THEME } from '@/hooks/useTheme';

interface ThemeToggleProps {
  theme: THEME;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === THEME.DARK;
  const label = isDark ? 'Light theme' : 'Dark theme';

  return (
    <Button
      className="theme-toggle"
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
