import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

/**
 * Only an explicit user choice (made via toggleTheme / setTheme) is persisted.
 * Everyone defaults to light — the OS `prefers-color-scheme` is intentionally ignored,
 * as is the legacy `genie_theme` key (which used to be written automatically).
 * Keep this key in sync with the pre-mount script in admin/index.html.
 */
const THEME_CHOICE_KEY = 'genie_admin_theme_choice';

const readStoredChoice = (): Theme => {
  try {
    return localStorage.getItem(THEME_CHOICE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const persistChoice = (theme: Theme) => {
  try {
    localStorage.setItem(THEME_CHOICE_KEY, theme);
  } catch {
    // Storage unavailable (private mode / blocked) — the choice just won't persist.
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(readStoredChoice);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    persistChoice(next);
    setThemeState(next);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    persistChoice(t);
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
