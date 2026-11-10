import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string; showLabel?: boolean }> = ({
  className = '',
  showLabel = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Pure Black Dark Mode'}
      className={`inline-flex items-center gap-2 p-2 rounded-xl transition-all duration-200 border cursor-pointer select-none ${
        isDark
          ? 'bg-black/90 hover:bg-neutral-900 border-neutral-800 text-amber-400 hover:border-amber-400/40 shadow-xs'
          : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-700 shadow-2xs'
      } ${className}`}
      aria-label="Toggle pure black theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};

