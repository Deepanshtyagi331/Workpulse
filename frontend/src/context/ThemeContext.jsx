import React, { createContext, useCallback, useMemo, useState } from 'react';
import { applyThemeClass, getStoredTheme, persistTheme } from './themeStorage';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const initial = getStoredTheme();
    applyThemeClass(initial);
    return initial;
  });

  const setTheme = useCallback((next) => {
    const resolved = next === 'dark' ? 'dark' : 'light';
    persistTheme(resolved);
    setThemeState(resolved);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export { ThemeContext };
export default ThemeProvider;
