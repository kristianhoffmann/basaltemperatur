import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rounded';
  animation?: 'pulse' | 'shimmer' | 'none';
}

export function Skeleton({
  className,
  variant = 'default',
  animation = 'pulse',
}: SkeletonProps) {
  const variantClasses = {
    default: 'rounded',
    circular: 'rounded-full',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      aria-hidden="true"
    />
  );
}

// Pre-built skeleton patterns for common use cases

// Text skeleton
interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && 'w-3/4')}
        />
      ))}
    </div>
  );
}

// Avatar skeleton
interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
}

export function SkeletonAvatar({
  size = 'md',
  withText = false,
  className,
}: SkeletonAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Skeleton variant="circular" className={sizeClasses[size]} />
      {withText && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      )}
    </div>
  );
}

// Card skeleton
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-6',
        className
      )}
    >
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" className="w-12 h-12" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

// Table row skeleton
interface SkeletonTableRowProps {
  columns?: number;
  className?: string;
}

export function SkeletonTableRow({
  columns = 5,
  className,
}: SkeletonTableRowProps) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" />
        </td>
      ))}
    </tr>
  );
}

// Table skeleton
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 5,
  className,
}: SkeletonTableProps) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// List item skeleton
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 py-3', className)}>
      <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

// Stats card skeleton
export function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 p-6',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton variant="circular" className="w-8 h-8" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

// Dashboard skeleton
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatsCard key={i} />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
