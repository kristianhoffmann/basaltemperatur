// app/(dashboard)/erfolg/page.tsx
// Verifizierte Rückkehrseite nach Stripe Checkout

import Link from 'next/link'
import { AlertCircle, ArrowRight, CheckCircle, Clock3, RefreshCw, Sparkles } from 'lucide-react'
import Stripe from 'stripe'
import { resolveCheckoutResult, type CheckoutResult } from '@/lib/billing/checkout-result'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
    title: 'Zahlungsstatus',
    description: 'Prüfe den Status deines Basaltemperatur-Lifetime-Zugangs.',
}

async function verifyCheckout(sessionId: string | undefined): Promise<CheckoutResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !sessionId || !process.env.STRIPE_SECRET_KEY) {
        return 'invalid'
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('has_lifetime_access')
        .eq('id', user.id)
        .maybeSingle()

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        const sessionBelongsToUser =
            session.client_reference_id === user.id || session.metadata?.user_id === user.id

        return resolveCheckoutResult({
            authenticated: true,
            sessionBelongsToUser,
            sessionPaid: session.mode === 'payment' && session.payment_status === 'paid',
            entitlementActive: profile?.has_lifetime_access === true,
        })
    } catch (error) {
        console.error('Checkout session verification failed:', error)
        return 'invalid'
    }
}

export default async function ErfolgPage({
    searchParams,
}: {
    searchParams: Promise<{ session_id?: string | string[] }>
}) {
    const params = await searchParams
    const sessionId = typeof params.session_id === 'string' ? params.session_id : undefined
    const result = await verifyCheckout(sessionId)

    if (result === 'syncing') {
        return (
            <StatusCard
                icon={<Clock3 className="h-12 w-12 text-amber-400" />}
                iconClassName="bg-amber-400/10"
                title="Zahlung wird aktiviert"
                description="Stripe hat deine Zahlung bestätigt. Der Lifetime-Zugang wird gerade mit deinem Konto synchronisiert."
                detail="Das dauert normalerweise nur wenige Sekunden. Du kannst den Status direkt erneut prüfen."
            >
                <Link href={`/erfolg?session_id=${encodeURIComponent(sessionId ?? '')}`} className="inline-flex items-center justify-center gap-2 font-medium text-sm text-white rounded-2xl px-6 py-3 bg-amber-500 hover:bg-amber-600 transition-colors">
                    <RefreshCw className="h-4 w-4" />
                    Status erneut prüfen
                </Link>
            </StatusCard>
        )
    }

    if (result === 'invalid') {
        return (
            <StatusCard
                icon={<AlertCircle className="h-12 w-12 text-rose-400" />}
                iconClassName="bg-rose-400/10"
                title="Zahlung nicht verifizierbar"
                description="Diese Rückkehrseite gehört nicht zu einer bestätigten Zahlung deines Kontos."
                detail="Falls du gerade bezahlt hast, öffne bitte den ursprünglichen Stripe-Link erneut oder prüfe deinen Zugang im Dashboard."
            >
                <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 font-medium text-sm text-white rounded-2xl px-6 py-3 bg-[var(--rose)] hover:opacity-90 transition-opacity">
                    Zum Dashboard
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </StatusCard>
        )
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center py-12">
            <div className="max-w-md mx-auto text-center animate-fade-in">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-400/10 mb-6">
                    <CheckCircle className="h-12 w-12 text-emerald-400" />
                    <div className="absolute -top-2 -right-2">
                        <Sparkles className="h-7 w-7 text-amber-400" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-[var(--text)] mb-2">
                    Vielen Dank! 🎉
                </h1>
                <p className="text-lg text-[var(--text-secondary)] mb-2">
                    Dein Lifetime-Zugang ist jetzt aktiv.
                </p>
                <p className="text-sm text-[var(--text-muted)] mb-8">
                    Du hast jetzt unbegrenzten Zugang zu allen Features –
                    für immer, ohne Abo.
                </p>

                <div className="card p-6 mb-8 text-left">
                    <h2 className="text-sm font-semibold text-[var(--text)] mb-3">
                        Was du jetzt tun kannst:
                    </h2>
                    <ul className="space-y-3">
                        {[
                            'Trage täglich deine Basaltemperatur ein',
                            'Markiere deine Periodentage im Kalender',
                            'Exportiere deine Kurve als PDF für den Arzt',
                            'Vergleiche mehrere Zyklen miteinander',
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                                <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <Link href="/dashboard">
                    <button
                        className="inline-flex items-center justify-center gap-2 font-medium text-sm text-white rounded-2xl px-6 py-3 transition-all duration-200 active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
                            boxShadow: '0 4px 16px rgba(232, 120, 138, 0.3)',
                        }}
                    >
                        Zum Dashboard
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </Link>
            </div>
        </div>
    )
}

function StatusCard({
    icon,
    iconClassName,
    title,
    description,
    detail,
    children,
}: {
    icon: React.ReactNode
    iconClassName: string
    title: string
    description: string
    detail: string
    children: React.ReactNode
}) {
    return (
        <div className="min-h-[70vh] flex items-center justify-center py-12">
            <div className="max-w-md mx-auto text-center animate-fade-in">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${iconClassName}`}>
                    {icon}
                </div>
                <h1 className="text-2xl font-bold text-[var(--text)] mb-2">{title}</h1>
                <p className="text-lg text-[var(--text-secondary)] mb-2">{description}</p>
                <p className="text-sm text-[var(--text-muted)] mb-8">{detail}</p>
                {children}
            </div>
        </div>
    )
}
