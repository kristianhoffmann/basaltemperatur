'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// THEME SYSTEM
// Dark Mode / Light Mode / System Theme Support
// ============================================================================

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================================================
// THEME PROVIDER
// ============================================================================

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Initiales Theme aus localStorage oder System laden
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  // Theme anwenden und resolvedTheme berechnen
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      // Immer hell – kein Dark Mode
      const resolved: 'light' | 'dark' = 'light';

      setResolvedTheme(resolved);
      root.classList.remove('dark');
    };

    applyTheme();

    // System-Präferenz-Änderungen beobachten
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Hydration-Fehler vermeiden
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// USE THEME HOOK
// ============================================================================

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ============================================================================
// THEME TOGGLE BUTTON
// Einfacher Button zum Umschalten zwischen Light/Dark
// ============================================================================

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-md text-gray-600 dark:text-gray-400',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'dark:focus:ring-offset-gray-900',
        className
      )}
      aria-label={resolvedTheme === 'dark' ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln'}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}

// ============================================================================
// THEME SELECTOR
// Dropdown mit Light/Dark/System Optionen
// ============================================================================

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'light' as Theme, label: 'Hell', icon: Sun },
    { value: 'dark' as Theme, label: 'Dunkel', icon: Moon },
    { value: 'system' as Theme, label: 'System', icon: Monitor },
  ];

  const currentOption = options.find((o) => o.value === theme) || options[2];
  const CurrentIcon = currentOption.icon;

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'border border-gray-200 dark:border-gray-700',
          'transition-colors duration-200'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <CurrentIcon className="w-4 h-4" />
        <span>{currentOption.label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div
            className={cn(
              'absolute right-0 mt-2 w-36 z-20',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              'rounded-lg shadow-lg',
              'py-1',
              'animate-in fade-in-0 zoom-in-95'
            )}
            role="listbox"
          >
            {options.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 text-sm',
                    'transition-colors duration-150',
                    isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// THEME SCRIPT
// Inline-Script um Flash of Unstyled Content (FOUC) zu vermeiden
// In app/layout.tsx im <head> einfügen
// ============================================================================

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              document.documentElement.classList.remove('dark');
            } catch (e) {}
          })();
        `,
      }}
    />
  );
}
