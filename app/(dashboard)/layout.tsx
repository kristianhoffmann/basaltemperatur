// app/(dashboard)/layout.tsx
// Dashboard Layout – Premium mit Bottom Nav

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  LayoutDashboard,
  CalendarDays,
  PlusCircle,
  Settings,
  BarChart3,
  GitCompareArrows,
} from 'lucide-react'
import { NotificationPrompt } from '@/components/features/NotificationPrompt'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Übersicht' },
  { href: '/kalender', icon: CalendarDays, label: 'Kalender' },
  { href: '/eintrag', icon: PlusCircle, label: 'Eintrag' },
]

const desktopExtraNav = [
  { href: '/statistiken', icon: BarChart3, label: 'Statistiken' },
  { href: '/zyklen', icon: GitCompareArrows, label: 'Zyklen' },
  { href: '/einstellungen', icon: Settings, label: 'Mehr' },
]

const mobileNav = [
  ...navItems,
  { href: '/einstellungen', icon: Settings, label: 'Mehr' },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen pb-20 lg:pb-0 bg-[var(--bg)]">
      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 inset-x-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto w-full px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-400 to-rose-500">
              <span className="text-white text-xs">🌡️</span>
            </div>
            <span className="font-semibold text-sm text-[var(--text)]">
              Basaltemperatur
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {[...navItems, ...desktopExtraNav].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:text-rose-400 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pt-24 pt-2">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <NotificationPrompt />
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav lg:hidden">
        {mobileNav.map((item) => (
          <Link key={item.href} href={item.href} className="bottom-nav-item">
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
