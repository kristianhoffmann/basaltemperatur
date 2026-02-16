'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
  error?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, indeterminate = false, className, ...props }, ref) => {
    return (
      <div className={cn('relative flex items-start', className)}>
        <div className="flex items-center h-5">
          <div className="relative">
            <input
              ref={(el) => {
                if (typeof ref === 'function') ref(el);
                else if (ref) ref.current = el;
                if (el) el.indeterminate = indeterminate;
              }}
              type="checkbox"
              className={cn(
                'peer w-5 h-5 rounded',
                'border-2 border-gray-300',
                'text-primary-600',
                'focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'cursor-pointer appearance-none',
                'checked:bg-primary-600 checked:border-primary-600',
                'transition-colors',
                error && 'border-red-500'
              )}
              aria-invalid={!!error}
              {...props}
            />
            {/* Custom checkmark */}
            <Check
              className={cn(
                'absolute top-0.5 left-0.5 w-4 h-4 text-white',
                'pointer-events-none opacity-0',
                'peer-checked:opacity-100',
                'transition-opacity'
              )}
              strokeWidth={3}
            />
            {/* Indeterminate mark */}
            {indeterminate && (
              <Minus
                className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none"
                strokeWidth={3}
              />
            )}
          </div>
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
            {error && <p className="text-sm text-red-600 mt-0.5">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Checkbox Group
interface CheckboxGroupProps {
  label?: string;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function CheckboxGroup({
  label,
  options,
  values,
  onChange,
  error,
  direction = 'vertical',
  className,
}: CheckboxGroupProps) {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...values, value]);
    } else {
      onChange(values.filter((v) => v !== value));
    }
  };

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
          <Checkbox
            key={option.value}
            id={`checkbox-${option.value}`}
            label={option.label}
            description={option.description}
            checked={values.includes(option.value)}
            disabled={option.disabled}
            onChange={(e) => handleChange(option.value, e.target.checked)}
          />
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}
