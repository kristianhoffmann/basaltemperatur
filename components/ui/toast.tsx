'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

// Context
const ToastContext = createContext<ToastContextValue | null>(null);

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Provider
interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'success', title, message });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'error', title, message, duration: 8000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'warning', title, message });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string) => {
      addToast({ type: 'info', title, message });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <Toaster toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

// Toaster Component
interface ToasterProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function Toaster({ toasts, removeToast }: ToasterProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// Single Toast Item
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-500',
  },
  error: {
    icon: AlertCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    className: 'bg-amber-50 border-amber-200 text-amber-800',
    iconClassName: 'text-amber-500',
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-500',
  },
};

function ToastItem({ toast, onClose }: ToastItemProps) {
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'animate-in slide-in-from-right-full fade-in-0 duration-300',
        config.className
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconClassName)} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-90 mt-0.5">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 -m-1 rounded hover:bg-black/5 transition-colors"
        aria-label="Schließen"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Simple toast function for use outside of React components
let toastFn: ToastContextValue | null = null;

export function setToastFunction(fn: ToastContextValue) {
  toastFn = fn;
}

export const toast = {
  success: (title: string, message?: string) => toastFn?.success(title, message),
  error: (title: string, message?: string) => toastFn?.error(title, message),
  warning: (title: string, message?: string) => toastFn?.warning(title, message),
  info: (title: string, message?: string) => toastFn?.info(title, message),
};
