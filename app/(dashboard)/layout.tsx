// app/(dashboard)/layout.tsx
// Dashboard Layout – Premium 2026 with Dark Sidebar

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { NotificationPrompt } from '@/components/features/NotificationPrompt'
import { SidebarNav } from '@/components/layout/SidebarNav'
import { MobileNav } from '@/components/layout/MobileNav'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const email = user.email || ''

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ── Desktop Sidebar ──────────────────────────────── */}
      <aside className="sidebar hidden lg:flex">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🌡️</div>
          <span className="sidebar-logo-text">Basaltemperatur</span>
        </div>

        {/* Navigation */}
        <div className="sidebar-section-label">Menü</div>
        <nav className="sidebar-nav">
          <SidebarNav />
        </nav>

        {/* Settings link */}
        <div className="px-3 pb-2">
          <Link
            href="/einstellungen"
            className="sidebar-link"
          >
            <Settings className="h-[18px] w-[18px]" />
            Einstellungen
          </Link>
        </div>

        {/* User */}
        <div className="sidebar-footer">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {email[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white/80 truncate">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="lg:ml-[260px] pb-24 lg:pb-8 pt-4 lg:pt-8 min-h-screen relative">
        {/* Decorative gradient orbs */}
        <div className="orb orb-rose w-[400px] h-[400px] -top-40 -right-40 opacity-30 hidden lg:block" />
        <div className="orb orb-violet w-[300px] h-[300px] top-1/2 -left-20 opacity-20 hidden lg:block" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <NotificationPrompt />
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ────────────────────────────── */}
      <MobileNav />
    </div>
  )
}
