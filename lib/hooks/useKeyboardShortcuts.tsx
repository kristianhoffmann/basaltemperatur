'use client';

import { useEffect, useCallback, useState, createContext, useContext, ReactNode } from 'react';
import { X, Command } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// KEYBOARD SHORTCUTS SYSTEM
// Globale Tastenkombinationen für die gesamte App
// ============================================================================

interface Shortcut {
  id: string;
  keys: string[]; // z.B. ['ctrl', 'k'] oder ['g', 'd']
  description: string;
  category: 'navigation' | 'actions' | 'editing' | 'general';
  action: () => void;
  enabled?: boolean;
}

interface ShortcutsContextType {
  shortcuts: Shortcut[];
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextType | null>(null);

// ============================================================================
// SHORTCUTS PROVIDER
// ============================================================================

interface ShortcutsProviderProps {
  children: ReactNode;
  defaultShortcuts?: Shortcut[];
}

export function ShortcutsProvider({ children, defaultShortcuts = [] }: ShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(defaultShortcuts);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [sequenceKeys, setSequenceKeys] = useState<string[]>([]);

  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setShortcuts((prev) => {
      const exists = prev.find((s) => s.id === shortcut.id);
      if (exists) {
        return prev.map((s) => (s.id === shortcut.id ? shortcut : s));
      }
      return [...prev, shortcut];
    });
  }, []);

  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);

  // Keyboard Event Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorieren wenn in Input/Textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const now = Date.now();

      // Modifier Keys tracken
      const modifiers = new Set<string>();
      if (e.ctrlKey || e.metaKey) modifiers.add('ctrl');
      if (e.altKey) modifiers.add('alt');
      if (e.shiftKey) modifiers.add('shift');

      // Shortcut mit Modifiern prüfen
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const shortcutKeys = shortcut.keys.map((k) => k.toLowerCase());
        const hasModifier = shortcutKeys.some((k) => ['ctrl', 'alt', 'shift'].includes(k));

        if (hasModifier) {
          // Modifier-basierte Shortcuts (z.B. Ctrl+K)
          const requiredModifiers = shortcutKeys.filter((k) => ['ctrl', 'alt', 'shift'].includes(k));
          const mainKey = shortcutKeys.find((k) => !['ctrl', 'alt', 'shift'].includes(k));

          const modifiersMatch = requiredModifiers.every((m) => modifiers.has(m));
          const keyMatch = mainKey === key;

          if (modifiersMatch && keyMatch && modifiers.size === requiredModifiers.length) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }

      // Sequenz-basierte Shortcuts (z.B. g dann d)
      if (now - lastKeyTime > 1000) {
        // Reset nach 1 Sekunde
        setSequenceKeys([key]);
      } else {
        const newSequence = [...sequenceKeys, key];
        setSequenceKeys(newSequence);

        // Sequenz prüfen
        for (const shortcut of shortcuts) {
          if (shortcut.enabled === false) continue;

          const shortcutKeys = shortcut.keys.map((k) => k.toLowerCase());
          const hasModifier = shortcutKeys.some((k) => ['ctrl', 'alt', 'shift'].includes(k));

          if (!hasModifier && shortcutKeys.length > 1) {
            // Sequenz-basiert
            if (
              newSequence.length === shortcutKeys.length &&
              newSequence.every((k, i) => k === shortcutKeys[i])
            ) {
              e.preventDefault();
              shortcut.action();
              setSequenceKeys([]);
              return;
            }
          }
        }
      }

      setLastKeyTime(now);

      // Single-Key Shortcuts (z.B. ?)
      if (!modifiers.size) {
        for (const shortcut of shortcuts) {
          if (shortcut.enabled === false) continue;
          if (shortcut.keys.length === 1 && shortcut.keys[0].toLowerCase() === key) {
            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, lastKeyTime, sequenceKeys]);

  // ? für Hilfe registrieren
  useEffect(() => {
    registerShortcut({
      id: 'help',
      keys: ['?'],
      description: 'Tastenkombinationen anzeigen',
      category: 'general',
      action: () => setIsHelpOpen((prev) => !prev),
    });

    return () => unregisterShortcut('help');
  }, [registerShortcut, unregisterShortcut]);

  return (
    <ShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        isHelpOpen,
        openHelp,
        closeHelp,
      }}
    >
      {children}
      {isHelpOpen && <ShortcutsHelp />}
    </ShortcutsContext.Provider>
  );
}

// ============================================================================
// USE SHORTCUTS HOOK
// ============================================================================

export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
}

// ============================================================================
// USE SHORTCUT HOOK - Einzelnen Shortcut registrieren
// ============================================================================

export function useShortcut(
  id: string,
  keys: string[],
  description: string,
  category: Shortcut['category'],
  action: () => void,
  enabled: boolean = true
) {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  useEffect(() => {
    registerShortcut({ id, keys, description, category, action, enabled });
    return () => unregisterShortcut(id);
  }, [id, keys, description, category, action, enabled, registerShortcut, unregisterShortcut]);
}

// ============================================================================
// SHORTCUTS HELP MODAL
// ============================================================================

function ShortcutsHelp() {
  const { shortcuts, closeHelp } = useShortcuts();

  const categories: Record<string, string> = {
    navigation: 'Navigation',
    actions: 'Aktionen',
    editing: 'Bearbeitung',
    general: 'Allgemein',
  };

  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const cat = shortcut.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>
  );

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={closeHelp}
      />
      <div className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-lg animate-in fade-in-0 zoom-in-95">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Tastenkombinationen
            </h2>
            <button
              onClick={closeHelp}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto p-6 space-y-6">
            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {categories[category]}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <KeyCombo keys={shortcut.keys} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Drücken Sie <KeyCombo keys={['?']} inline /> um dieses Menü zu öffnen
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// KEY COMBO DISPLAY
// ============================================================================

interface KeyComboProps {
  keys: string[];
  inline?: boolean;
}

function KeyCombo({ keys, inline = false }: KeyComboProps) {
  const formatKey = (key: string) => {
    const keyMap: Record<string, string | React.ReactNode> = {
      ctrl: <Command className="w-3 h-3" />,
      alt: 'Alt',
      shift: '⇧',
      enter: '↵',
      escape: 'Esc',
      arrowup: '↑',
      arrowdown: '↓',
      arrowleft: '←',
      arrowright: '→',
    };
    return keyMap[key.toLowerCase()] || key.toUpperCase();
  };

  return (
    <span className={cn('flex items-center gap-1', inline && 'inline-flex')}>
      {keys.map((key, i) => (
        <span key={i} className="flex items-center gap-1">
          <kbd
            className={cn(
              'inline-flex items-center justify-center min-w-[24px] px-1.5 py-0.5',
              'text-xs font-medium',
              'bg-gray-100 dark:bg-gray-800',
              'border border-gray-300 dark:border-gray-600',
              'rounded shadow-sm'
            )}
          >
            {formatKey(key)}
          </kbd>
          {i < keys.length - 1 && (
            <span className="text-gray-400 text-xs">+</span>
          )}
        </span>
      ))}
    </span>
  );
}

// ============================================================================
// VORDEFINIERTE SHORTCUTS (für App-weite Nutzung)
// ============================================================================

export const defaultAppShortcuts: Omit<Shortcut, 'action'>[] = [
  // Navigation
  { id: 'goto-dashboard', keys: ['g', 'd'], description: 'Zum Dashboard', category: 'navigation' },
  { id: 'goto-customers', keys: ['g', 'k'], description: 'Zu Kunden', category: 'navigation' },
  { id: 'goto-quotes', keys: ['g', 'a'], description: 'Zu Angeboten', category: 'navigation' },
  { id: 'goto-invoices', keys: ['g', 'r'], description: 'Zu Rechnungen', category: 'navigation' },
  { id: 'goto-settings', keys: ['g', 's'], description: 'Zu Einstellungen', category: 'navigation' },
  
  // Actions
  { id: 'new-customer', keys: ['n', 'k'], description: 'Neuer Kunde', category: 'actions' },
  { id: 'new-quote', keys: ['n', 'a'], description: 'Neues Angebot', category: 'actions' },
  { id: 'new-invoice', keys: ['n', 'r'], description: 'Neue Rechnung', category: 'actions' },
  { id: 'search', keys: ['ctrl', 'k'], description: 'Suche öffnen', category: 'actions' },
  { id: 'save', keys: ['ctrl', 's'], description: 'Speichern', category: 'actions' },
  
  // General
  { id: 'help', keys: ['?'], description: 'Hilfe anzeigen', category: 'general' },
  { id: 'escape', keys: ['Escape'], description: 'Schließen/Abbrechen', category: 'general' },
];
