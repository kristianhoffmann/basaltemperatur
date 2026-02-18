// components/layout/MobileNav.tsx
// Client component for mobile bottom navigation with active state
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    CalendarDays,
    PlusCircle,
    Settings,
} from 'lucide-react'

const mobileNav = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Übersicht' },
    { href: '/kalender', icon: CalendarDays, label: 'Kalender' },
    { href: '/eintrag', icon: PlusCircle, label: 'Eintrag' },
    { href: '/einstellungen', icon: Settings, label: 'Mehr' },
]

export function MobileNav() {
    const pathname = usePathname()

    return (
        <nav className="bottom-nav lg:hidden">
            {mobileNav.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
