'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// useDebounce
// Verzögert einen Wert um eine bestimmte Zeit
// ============================================================================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// useLocalStorage
// Synchronisiert State mit localStorage
// ============================================================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // State initialisieren
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Setter, der auch localStorage aktualisiert
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

// ============================================================================
// useMediaQuery
// Reagiert auf Media Query Änderungen
// ============================================================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query, matches]);

  return matches;
}

// Vordefinierte Breakpoints
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

// ============================================================================
// useKeyboardShortcut
// Registriert globale Keyboard-Shortcuts
// ============================================================================

interface ShortcutOptions {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {}
): void {
  const { ctrl, alt, shift, meta, preventDefault = true } = options;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const matchesKey = e.key.toLowerCase() === key.toLowerCase();
      const matchesCtrl = ctrl ? e.ctrlKey || e.metaKey : true;
      const matchesAlt = alt ? e.altKey : true;
      const matchesShift = shift ? e.shiftKey : true;
      const matchesMeta = meta ? e.metaKey : true;

      if (matchesKey && matchesCtrl && matchesAlt && matchesShift && matchesMeta) {
        if (preventDefault) {
          e.preventDefault();
        }
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [key, callback, ctrl, alt, shift, meta, preventDefault]);
}

// ============================================================================
// useClickOutside
// Erkennt Klicks außerhalb eines Elements
// ============================================================================

export function useClickOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [callback]);

  return ref;
}

// ============================================================================
// useAsync
// Vereinfacht async Operations mit Loading/Error State
// ============================================================================

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  immediate = true
): AsyncState<T> & { execute: () => Promise<void> } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await asyncFn();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
    }
  }, [asyncFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}

// ============================================================================
// useToggle
// Einfacher Boolean Toggle
// ============================================================================

export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue((v) => !v), []);
  return [value, toggle, setValue];
}

// ============================================================================
// useCopyToClipboard
// Text in die Zwischenablage kopieren
// ============================================================================

export function useCopyToClipboard(): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setCopied(false);
    }
  }, []);

  return [copied, copy];
}

// ============================================================================
// useInterval
// setInterval als Hook
// ============================================================================

export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ============================================================================
// usePrevious
// Vorherigen Wert eines State speichern
// ============================================================================

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

// ============================================================================
// useOnScreen
// Erkennt ob ein Element im Viewport ist
// ============================================================================

export function useOnScreen<T extends HTMLElement>(
  options?: IntersectionObserverInit
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [ref, isIntersecting];
}

// ============================================================================
// useWindowSize
// Aktuelle Fenstergröße
// ============================================================================

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// ============================================================================
// useScrollPosition
// Aktuelle Scroll-Position
// ============================================================================

export function useScrollPosition(): { x: number; y: number } {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setPosition({
        x: window.scrollX,
        y: window.scrollY,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return position;
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export * from './useKeyboardShortcuts';
export * from './usePWA';
