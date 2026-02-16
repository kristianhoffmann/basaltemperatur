// components/ui/input.tsx
// Input Komponente mit Label und Error-State

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="label"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'input',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-400/20',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="error-message">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
