import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    User,
    Settings as SettingsIcon,
    Info,
    BarChart3,
    GitCompareArrows,
    FileDown,
    ChevronRight,
} from 'lucide-react'
import { ProfileSection } from './ProfileSection'
import { AccountDangerZone } from './AccountDangerZone'

export const metadata = {
    title: 'Einstellungen',
    description: 'Verwalte dein Konto und deine Einstellungen.',
}

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const userName = (user.user_metadata?.owner_name as string) || ''

    const quickLinks = [
        { href: '/statistiken', icon: BarChart3, label: 'Statistiken', desc: 'Zyklusdaten & Trends', color: '#E8788A' },
        { href: '/zyklen', icon: GitCompareArrows, label: 'Zyklusvergleich', desc: 'Mehrere Zyklen vergleichen', color: '#8B5CF6' },
        { href: '/export', icon: FileDown, label: 'PDF-Export', desc: 'Kurve für den Arzt', color: '#3B82F6' },
    ]

    return (
        <div className="space-y-6 pb-20 pt-4">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    Einstellungen
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Verwalte dein Konto und deine App-Präferenzen.
                </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
                {quickLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="card flex items-center gap-4 p-4 hover:scale-[1.01] transition-all duration-200"
                    >
                        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${link.color}15` }}>
                            <link.icon className="h-5 w-5" style={{ color: link.color }} />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>
                                {link.label}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                {link.desc}
                            </p>
                        </div>
                        <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                    </Link>
                ))}
            </div>

            {/* Profil – Client Component */}
            <ProfileSection
                email={user.email || ''}
                initialName={userName}
                userId={user.id}
            />

            {/* Erscheinungsbild */}
            <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <SettingsIcon className="h-5 w-5 text-rose-400" />
                    Erscheinungsbild
                </h2>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100 text-orange-500">
                            <span className="text-lg">☀️</span>
                        </div>
                        <div>
                            <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>Design</p>
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Immer Hell</p>
                        </div>
                    </div>
                    <div className="text-xs font-medium text-[var(--text-muted)]">
                        Aktiv
                    </div>
                </div>
            </div>

            {/* Informationen */}
            <div className="card space-y-4">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                    <Info className="h-5 w-5 text-rose-400" />
                    Informationen
                </h2>

                <div className="space-y-1">
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Version</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>1.0.0</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[var(--border-subtle)]">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Datenschutz</span>
                        <a href="/datenschutz" className="text-sm font-medium text-rose-400 hover:underline">Ansehen</a>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Impressum</span>
                        <a href="/impressum" className="text-sm font-medium text-rose-400 hover:underline">Ansehen</a>
                    </div>
                </div>
            </div>

            {/* Account Aktionen – Client Component */}
            <AccountDangerZone userId={user.id} />
        </div>
    )
}
