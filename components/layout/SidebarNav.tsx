// components/layout/SidebarNav.tsx
// Client component for sidebar navigation with active state detection
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    PlusCircle,
    CalendarDays,
    BarChart3,
    GitCompareArrows,
    FileDown,
} from 'lucide-react'

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Übersicht' },
    { href: '/eintrag', icon: PlusCircle, label: 'Neuer Eintrag' },
    { href: '/kalender', icon: CalendarDays, label: 'Kalender' },
    { href: '/statistiken', icon: BarChart3, label: 'Statistiken' },
    { href: '/zyklen', icon: GitCompareArrows, label: 'Zyklen' },
    { href: '/export', icon: FileDown, label: 'PDF Export' },
]

export function SidebarNav() {
    const pathname = usePathname()

    return (
        <>
            {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                    >
                        <item.icon className="h-[18px] w-[18px]" />
                        {item.label}
                    </Link>
                )
            })}
        </>
    )
}
