import Link from 'next/link'
import { BarChart3, LayoutDashboard } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'

export const metadata = {
  title: 'Admin',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireAdmin()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/admin/traffic" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5 text-rose-300" />
            Admin Analytics
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full border border-white/10 px-3 py-1 text-slate-300">
              {role}
            </span>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-300 hover:text-white">
              <LayoutDashboard className="h-4 w-4" />
              App
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
