'use client';

import { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  RefreshCw, 
  Copy, 
  Check, 
  ChevronDown,
  Loader2,
  Lightbulb,
  Languages,
  FileEdit,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// AI ASSISTANT BUTTON
// Kleiner Button zum Aktivieren von AI-Features in Formularen
// ============================================================================

interface AIAssistantButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
  label?: string;
}

export function AIAssistantButton({
  onClick,
  isLoading = false,
  className,
  label = 'Mit KI verbessern',
}: AIAssistantButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md',
        'bg-gradient-to-r from-purple-500 to-indigo-500',
        'text-white shadow-sm',
        'hover:from-purple-600 hover:to-indigo-600',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {label}
    </button>
  );
}

// ============================================================================
// AI TEXT ACTIONS MENU
// Dropdown mit verschiedenen Text-Aktionen
// ============================================================================

interface AITextActionsProps {
  onImprove: () => void;
  onShorten: () => void;
  onExpand: () => void;
  onTranslate: () => void;
  isLoading?: boolean;
  className?: string;
}

export function AITextActions({
  onImprove,
  onShorten,
  onExpand,
  onTranslate,
  isLoading = false,
  className,
}: AITextActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { label: 'Verbessern', icon: Wand2, onClick: onImprove },
    { label: 'Kürzen', icon: FileEdit, onClick: onShorten },
    { label: 'Erweitern', icon: FileEdit, onClick: onExpand },
    { label: 'Übersetzen (EN)', icon: Languages, onClick: onTranslate },
  ];

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md',
          'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
          'hover:bg-gray-200 dark:hover:bg-gray-700',
          'border border-gray-200 dark:border-gray-700',
          'disabled:opacity-50',
          'transition-colors duration-200'
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
        )}
        KI
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className={cn(
            'absolute right-0 mt-1 w-40 z-20',
            'bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700',
            'rounded-lg shadow-lg py-1',
            'animate-in fade-in-0 zoom-in-95'
          )}>
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 w-full px-3 py-2 text-sm',
                    'text-gray-700 dark:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'transition-colors duration-150'
                  )}
                >
                  <Icon className="w-4 h-4 text-gray-400" />
                  {action.label}
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
// AI SUGGESTION CARD
// Zeigt einen AI-generierten Vorschlag an
// ============================================================================

interface AISuggestionCardProps {
  text: string;
  onAccept: () => void;
  onRegenerate: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
  title?: string;
}

export function AISuggestionCard({
  text,
  onAccept,
  onRegenerate,
  onDismiss,
  isLoading = false,
  title = 'KI-Vorschlag',
}: AISuggestionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      'bg-gradient-to-r from-purple-50 to-indigo-50',
      'dark:from-purple-900/10 dark:to-indigo-900/10',
      'border-purple-200 dark:border-purple-800'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-purple-100/50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
            {title}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors"
          title="Kopieren"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Generiere Text...</span>
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {text}
          </p>
        )}
      </div>

      {/* Actions */}
      {!isLoading && (
        <div className="flex items-center justify-end gap-2 px-4 py-2 bg-purple-100/30 dark:bg-purple-900/10 border-t border-purple-200 dark:border-purple-800">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            Verwerfen
          </button>
          <button
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Neu generieren
          </button>
          <button
            onClick={onAccept}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Übernehmen
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AI QUICK ACTIONS TOOLBAR
// Schnellzugriff auf häufige AI-Aktionen
// ============================================================================

interface AIQuickAction {
  id: string;
  label: string;
  icon: typeof Sparkles;
  prompt: string;
}

interface AIQuickActionsToolbarProps {
  actions: AIQuickAction[];
  onAction: (action: AIQuickAction) => void;
  isLoading?: boolean;
  className?: string;
}

export function AIQuickActionsToolbar({
  actions,
  onAction,
  isLoading = false,
  className,
}: AIQuickActionsToolbarProps) {
  return (
    <div className={cn(
      'flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg',
      className
    )}>
      <span className="px-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <Lightbulb className="w-3.5 h-3.5" />
        KI:
      </span>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => onAction(action)}
            disabled={isLoading}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
              'text-gray-600 dark:text-gray-300',
              'hover:bg-white dark:hover:bg-gray-700',
              'hover:text-purple-600 dark:hover:text-purple-400',
              'disabled:opacity-50',
              'transition-all duration-150'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// DEFAULT QUICK ACTIONS (für Rechnungen/Angebote)
// ============================================================================

export const invoiceQuickActions: AIQuickAction[] = [
  {
    id: 'reminder',
    label: 'Zahlungserinnerung',
    icon: Mail,
    prompt: 'generatePaymentReminder',
  },
  {
    id: 'thank-you',
    label: 'Dankesmail',
    icon: Mail,
    prompt: 'generateThankYou',
  },
];

export const quoteQuickActions: AIQuickAction[] = [
  {
    id: 'intro',
    label: 'Einleitung',
    icon: FileEdit,
    prompt: 'generateQuoteIntro',
  },
  {
    id: 'follow-up',
    label: 'Nachfassen',
    icon: Mail,
    prompt: 'generateFollowUp',
  },
];
