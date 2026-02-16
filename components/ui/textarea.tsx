import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxLength?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      showCount = false,
      maxLength,
      className,
      required,
      value,
      ...props
    },
    ref
  ) => {
    const charCount = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          value={value}
          maxLength={maxLength}
          required={required}
          className={cn(
            'w-full px-4 py-3 text-sm text-gray-900',
            'bg-white border rounded-lg',
            'placeholder:text-gray-500',
            'focus:outline-none focus:ring-2',
            'transition-colors resize-y',
            'min-h-[100px]',
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500',
            props.disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? 'textarea-error' : hint ? 'textarea-hint' : undefined}
          {...props}
        />

        <div className="flex items-center justify-between mt-1.5">
          <div>
            {error && (
              <p id="textarea-error" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {hint && !error && (
              <p id="textarea-hint" className="text-sm text-gray-500">
                {hint}
              </p>
            )}
          </div>

          {showCount && maxLength && (
            <p
              className={cn(
                'text-xs',
                charCount > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-400',
                charCount >= maxLength && 'text-red-600'
              )}
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
