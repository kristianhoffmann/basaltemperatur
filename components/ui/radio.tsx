'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, ...props }, ref) => {
    return (
      <div className={cn('relative flex items-start', className)}>
        <div className="flex items-center h-5">
          <input
            ref={ref}
            type="radio"
            className={cn(
              'w-5 h-5 rounded-full',
              'border-2 border-gray-300',
              'text-primary-600',
              'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'cursor-pointer'
            )}
            {...props}
          />
        </div>

        {(label || description) && (
          <div className="ml-3">
            {label && (
              <label
                htmlFor={props.id}
                className={cn(
                  'text-sm font-medium cursor-pointer',
                  props.disabled ? 'text-gray-400' : 'text-gray-900'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

// Radio Group
interface RadioGroupProps {
  label?: string;
  name: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  direction = 'vertical',
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={className}>
      {label && (
        <legend className="text-sm font-medium text-gray-900 mb-3">
          {label}
        </legend>
      )}

      <div
        className={cn(
          'flex gap-4',
          direction === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'
        )}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            id={`${name}-${option.value}`}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}

// Radio Card Group (for more visual selection)
interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string;
}

interface RadioCardGroupProps {
  label?: string;
  name: string;
  options: RadioCardOption[];
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function RadioCardGroup({
  label,
  name,
  options,
  value,
  onChange,
  error,
  columns = 1,
  className,
}: RadioCardGroupProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <fieldset className={className}>
      {label && (
        <legend className="text-sm font-medium text-gray-900 mb-3">
          {label}
        </legend>
      )}

      <div className={cn('grid gap-3', gridCols[columns])}>
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                'relative flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all',
                isSelected
                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={option.disabled}
                onChange={(e) => onChange(e.target.value)}
                className="sr-only"
              />

              {option.icon && (
                <div
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mr-4',
                    isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {option.icon}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'font-medium',
                      isSelected ? 'text-primary-900' : 'text-gray-900'
                    )}
                  >
                    {option.label}
                  </span>
                  {option.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                      {option.badge}
                    </span>
                  )}
                </div>
                {option.description && (
                  <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                )}
              </div>

              {/* Selection indicator */}
              <div
                className={cn(
                  'absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                  isSelected
                    ? 'border-primary-500 bg-primary-500'
                    : 'border-gray-300'
                )}
              >
                {isSelected && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}
