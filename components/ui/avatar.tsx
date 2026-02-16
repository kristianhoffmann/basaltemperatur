import { type ReactNode } from 'react';
import { User } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
  fallback?: ReactNode;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string; icon: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-xs', icon: 'w-3 h-3' },
  sm: { container: 'w-8 h-8', text: 'text-xs', icon: 'w-4 h-4' },
  md: { container: 'w-10 h-10', text: 'text-sm', icon: 'w-5 h-5' },
  lg: { container: 'w-12 h-12', text: 'text-base', icon: 'w-6 h-6' },
  xl: { container: 'w-16 h-16', text: 'text-lg', icon: 'w-8 h-8' },
  '2xl': { container: 'w-24 h-24', text: 'text-2xl', icon: 'w-12 h-12' },
};

// Generate consistent color from name
function getColorFromName(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  className,
  fallback,
}: AvatarProps) {
  const sizes = sizeClasses[size];
  const initials = name ? getInitials(name) : '';
  const bgColor = name ? getColorFromName(name) : 'bg-gray-400';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0',
        sizes.container,
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      ) : fallback ? (
        <div className={cn('w-full h-full flex items-center justify-center bg-gray-100')}>
          {fallback}
        </div>
      ) : initials ? (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center text-white font-medium',
            bgColor,
            sizes.text
          )}
        >
          {initials}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <User className={cn('text-gray-500', sizes.icon)} />
        </div>
      )}
    </div>
  );
}

// Avatar Group (for showing multiple avatars stacked)
interface AvatarGroupProps {
  avatars: Array<{
    src?: string;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;
  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium ring-2 ring-white',
            sizes.container,
            sizes.text
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

// Avatar with status indicator
interface AvatarWithStatusProps extends AvatarProps {
  status?: 'online' | 'offline' | 'busy' | 'away';
}

export function AvatarWithStatus({
  status,
  size = 'md',
  ...props
}: AvatarWithStatusProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
  };

  const statusSizes: Record<AvatarSize, string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
  };

  return (
    <div className="relative inline-flex">
      <Avatar size={size} {...props} />
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            statusColors[status],
            statusSizes[size]
          )}
          aria-label={status}
        />
      )}
    </div>
  );
}

// User Info component (Avatar + Name + optional subtitle)
interface UserInfoProps {
  name: string;
  subtitle?: string;
  src?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

export function UserInfo({
  name,
  subtitle,
  src,
  size = 'md',
  status,
  className,
}: UserInfoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {status ? (
        <AvatarWithStatus src={src} name={name} size={size} status={status} />
      ) : (
        <Avatar src={src} name={name} size={size} />
      )}
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate">{name}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
