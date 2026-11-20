import { useState, useEffect } from 'react';

export enum THEME {
  LIGHT = 'light',
  DARK = 'dark',
}

export function useTheme() {
  const [theme, setTheme] = useState<THEME>(THEME.DARK);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === THEME.LIGHT ? THEME.DARK : THEME.LIGHT));
  };

  return { theme, toggleTheme };
}
