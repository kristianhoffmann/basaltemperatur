// components/shared/Logo.tsx
// Logo Komponente – Basaltemperatur

import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-2xl font-bold text-white',
        sizes[size],
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #D4637A, #E8788A)',
        boxShadow: '0 4px 12px rgba(212, 99, 122, 0.3)',
      }}
    >
      <span className={textSizes[size]}>🌡️</span>
    </div>
  )
}

export function LogoFull({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <Logo size="sm" />
      <span className="font-heading font-bold text-xl text-gray-900">
        Basaltemperatur
      </span>
    </div>
  )
}
