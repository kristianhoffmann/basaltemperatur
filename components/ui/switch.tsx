'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  labelPosition?: 'left' | 'right';
}

const sizeClasses = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    translate: 'translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translate-x-5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translate-x-7',
  },
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      description,
      size = 'md',
      labelPosition = 'right',
      className,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const sizes = sizeClasses[size];

    const switchElement = (
      <label
        className={cn(
          'relative inline-flex items-center cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="sr-only peer"
          role="switch"
          aria-checked={checked}
          {...props}
        />
        {/* Track */}
        <div
          className={cn(
            'rounded-full transition-colors duration-200',
            'bg-gray-200 peer-checked:bg-primary-600',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2',
            sizes.track
          )}
        >
          {/* Thumb */}
          <div
            className={cn(
              'absolute top-0.5 left-0.5 bg-white rounded-full shadow-sm',
              'transition-transform duration-200',
              'peer-checked:' + sizes.translate,
              sizes.thumb
            )}
          />
        </div>
      </label>
    );

    if (!label && !description) {
      return <div className={className}>{switchElement}</div>;
    }

    return (
      <div
        className={cn(
          'flex items-start gap-3',
          labelPosition === 'left' && 'flex-row-reverse justify-end',
          className
        )}
      >
        {switchElement}
        <div className="flex-1">
          {label && (
            <p
              className={cn(
                'text-sm font-medium',
                disabled ? 'text-gray-400' : 'text-gray-900'
              )}
            >
              {label}
            </p>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
    );
  }
);

Switch.displayName = 'Switch';

// Switch Group for multiple related toggles
interface SwitchGroupItem {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled?: boolean;
}

interface SwitchGroupProps {
  label?: string;
  items: SwitchGroupItem[];
  onChange: (id: string, checked: boolean) => void;
  className?: string;
}

export function SwitchGroup({ label, items, onChange, className }: SwitchGroupProps) {
  return (
    <div className={className}>
      {label && (
        <h3 className="text-sm font-medium text-gray-900 mb-4">{label}</h3>
      )}
      <div className="space-y-4">
        {items.map((item) => (
          <Switch
            key={item.id}
            id={item.id}
            label={item.label}
            description={item.description}
            checked={item.checked}
            disabled={item.disabled}
            onChange={(e) => onChange(item.id, e.target.checked)}
          />
        ))}
      </div>
    </div>
  );
}
