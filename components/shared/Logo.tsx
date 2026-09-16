// components/shared/Logo.tsx
// Logo Komponente – Basaltemperatur

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 32,
  md: 36,
  lg: 48,
}

export function Logo({ size = 'md', className }: LogoProps) {
  const px = sizes[size]
  return (
    <Image
      src="/icons/icon-192x192.png"
      alt=""
      width={px}
      height={px}
      className={cn('shrink-0 rounded-[28%] shadow-md shadow-violet-950/25 ring-1 ring-white/15', className)}
      style={{ width: px, height: px }}
    />
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
