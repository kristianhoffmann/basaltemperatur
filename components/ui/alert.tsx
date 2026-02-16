import { type ReactNode } from 'react';
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  showIcon?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: ReactNode;
  className?: string;
}

const variantConfig = {
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

export function Alert({
  variant = 'info',
  title,
  children,
  icon,
  showIcon = true,
  dismissible = false,
  onDismiss,
  action,
  className,
}: AlertProps) {
  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 p-4 rounded-lg border',
        config.className,
        className
      )}
    >
      {showIcon && (
        <div className="flex-shrink-0">
          {typeof Icon === 'function' ? (
            <Icon className={cn('w-5 h-5', config.iconClassName)} />
          ) : (
            Icon
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>

      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 -m-1 rounded hover:bg-black/5 transition-colors"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Inline Alert (more compact, for form errors etc.)
interface InlineAlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

export function InlineAlert({
  variant = 'error',
  children,
  className,
}: InlineAlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn('flex items-center gap-2 text-sm', className)}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0', config.iconClassName)} />
      <span className={cn(config.className.split(' ').find(c => c.startsWith('text-')))}>{children}</span>
    </div>
  );
}

// Banner Alert (full-width, typically at top of page)
interface BannerAlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  action?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function BannerAlert({
  variant = 'info',
  children,
  action,
  dismissible = false,
  onDismiss,
  className,
}: BannerAlertProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center justify-center gap-3 px-4 py-3',
        config.className,
        className
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0', config.iconClassName)} />
      <p className="text-sm font-medium">{children}</p>
      {action && <div className="flex-shrink-0">{action}</div>}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 -m-1 ml-2 rounded hover:bg-black/10 transition-colors"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Callout (for documentation/tips)
interface CalloutProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Callout({
  variant = 'info',
  title,
  children,
  className,
}: CalloutProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const borderColors = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-blue-500',
  };

  return (
    <div
      className={cn(
        'pl-4 py-3 pr-4 border-l-4 bg-gray-50 rounded-r-lg',
        borderColors[variant],
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2 mb-1">
          <Icon className={cn('w-4 h-4', config.iconClassName)} />
          <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
        </div>
      )}
      <div className="text-sm text-gray-700">{children}</div>
    </div>
  );
}
