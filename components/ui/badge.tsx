import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-100 text-primary-700',
  secondary: 'bg-secondary-100 text-secondary-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  outline: 'bg-transparent border border-gray-300 text-gray-700',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  outline: 'bg-gray-500',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

// Status-spezifische Badges für häufige Anwendungsfälle
interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  // Kunden
  aktiv: { variant: 'success', label: 'Aktiv' },
  inaktiv: { variant: 'default', label: 'Inaktiv' },
  interessent: { variant: 'info', label: 'Interessent' },
  
  // Projekte
  planung: { variant: 'info', label: 'Planung' },
  'in-arbeit': { variant: 'primary', label: 'In Arbeit' },
  abgeschlossen: { variant: 'success', label: 'Abgeschlossen' },
  pausiert: { variant: 'warning', label: 'Pausiert' },
  storniert: { variant: 'danger', label: 'Storniert' },
  
  // Angebote
  entwurf: { variant: 'default', label: 'Entwurf' },
  versendet: { variant: 'info', label: 'Versendet' },
  angenommen: { variant: 'success', label: 'Angenommen' },
  abgelehnt: { variant: 'danger', label: 'Abgelehnt' },
  abgelaufen: { variant: 'warning', label: 'Abgelaufen' },
  
  // Rechnungen
  offen: { variant: 'warning', label: 'Offen' },
  bezahlt: { variant: 'success', label: 'Bezahlt' },
  ueberfaellig: { variant: 'danger', label: 'Überfällig' },
  storno: { variant: 'default', label: 'Storniert' },
  teilbezahlt: { variant: 'info', label: 'Teilbezahlt' },
  
  // Allgemein
  neu: { variant: 'primary', label: 'Neu' },
  archiviert: { variant: 'default', label: 'Archiviert' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    variant: 'default' as BadgeVariant,
    label: status,
  };

  return (
    <Badge variant={config.variant} dot className={className}>
      {config.label}
    </Badge>
  );
}

// Plan/Subscription Badges
interface PlanBadgeProps {
  plan: 'starter' | 'pro' | 'business' | 'enterprise';
  className?: string;
}

const planConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  starter: { variant: 'default', label: 'Starter' },
  pro: { variant: 'primary', label: 'Pro' },
  business: { variant: 'secondary', label: 'Business' },
  enterprise: { variant: 'info', label: 'Enterprise' },
};

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const config = planConfig[plan] || planConfig.starter;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
