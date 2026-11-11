import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Light/dark switch. The icon + label describe the mode you will switch TO.
 * Uses neutral-* / white-alpha classes in the dark branch on purpose: index.css force-overrides
 * bg-white / text-slate-* under `html.dark`, so those are avoided here for predictable colors.
 */
export const ThemeToggle: React.FC<{ className?: string; showLabel?: boolean }> = ({
  className = '',
  showLabel = false,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const nextLabel = isDark ? 'Light' : 'Dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={`Switch to ${nextLabel.toLowerCase()} mode`}
      aria-label={`Switch to ${nextLabel.toLowerCase()} mode`}
      className={`inline-flex items-center justify-center gap-2 h-9 ${
        showLabel ? 'pl-2.5 pr-3' : 'w-9'
      } rounded-lg border text-xs font-semibold transition-colors duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
        isDark
          ? 'bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-neutral-800 hover:border-neutral-700'
          : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 shrink-0 text-indigo-500" aria-hidden="true" />
      )}
      {showLabel && <span>{nextLabel}</span>}
    </button>
  );
};
