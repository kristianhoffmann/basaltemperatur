import { type ReactNode } from 'react';
import {
  Search,
  Inbox,
  Package,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon?: ReactNode | LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'py-8',
    icon: 'w-10 h-10',
    iconWrapper: 'w-16 h-16',
    title: 'text-base',
    description: 'text-sm',
  },
  md: {
    container: 'py-12',
    icon: 'w-12 h-12',
    iconWrapper: 'w-20 h-20',
    title: 'text-lg',
    description: 'text-sm',
  },
  lg: {
    container: 'py-16',
    icon: 'w-16 h-16',
    iconWrapper: 'w-24 h-24',
    title: 'text-xl',
    description: 'text-base',
  },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={cn('text-gray-400', sizes.icon)} />;
    }
    return icon;
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        sizes.container,
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gray-100 mb-4',
            sizes.iconWrapper
          )}
        >
          {renderIcon()}
        </div>
      )}

      <h3 className={cn('font-semibold text-gray-900', sizes.title)}>
        {title}
      </h3>

      {description && (
        <p className={cn('text-gray-500 mt-1 max-w-sm', sizes.description)}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-6">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Search empty state
interface SearchEmptyStateProps {
  searchTerm: string;
  onClear?: () => void;
  className?: string;
}

export function SearchEmptyState({
  searchTerm,
  onClear,
  className,
}: SearchEmptyStateProps) {
  return (
    <EmptyState
      icon={Search}
      title="Keine Ergebnisse gefunden"
      description={`Keine Einträge für "${searchTerm}" gefunden. Versuchen Sie es mit anderen Suchbegriffen.`}
      action={
        onClear
          ? { label: 'Suche zurücksetzen', onClick: onClear, variant: 'secondary' }
          : undefined
      }
      className={className}
    />
  );
}

// Filter empty state
interface FilterEmptyStateProps {
  onClear?: () => void;
  className?: string;
}

export function FilterEmptyState({ onClear, className }: FilterEmptyStateProps) {
  return (
    <EmptyState
      icon={Inbox}
      title="Keine Übereinstimmungen"
      description="Keine Einträge entsprechen Ihren Filterkriterien."
      action={
        onClear
          ? { label: 'Filter zurücksetzen', onClick: onClear, variant: 'secondary' }
          : undefined
      }
      className={className}
    />
  );
}

// Generic no data empty state
export function NoDataEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={Package}
      title="Keine Daten vorhanden"
      description="Es sind noch keine Daten verfügbar."
      className={className}
    />
  );
}
