// components/ui/button.tsx
// Button Komponente mit Varianten

import * as React from 'react'
import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-rose-400 text-white hover:bg-rose-500 focus:ring-rose-400 active:scale-[0.98] shadow-glow',
      secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-rose-300 focus:ring-rose-300',
      accent: 'bg-gold-400 text-white font-semibold hover:bg-gold-500 focus:ring-gold-400 active:scale-[0.98]',
      destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
      ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
      link: 'bg-transparent text-rose-400 underline-offset-4 hover:underline focus:ring-rose-400 p-0',
    }

    const sizes = {
      sm: 'px-3.5 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    return (
      <button
        className={clsx(
          baseStyles,
          variants[variant],
          variant !== 'link' && sizes[size],
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
