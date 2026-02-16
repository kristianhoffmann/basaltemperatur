// app/(dashboard)/zyklen/page.tsx
// Zyklusvergleich – Mehrere Zyklen übereinander

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CycleComparisonChart } from '@/components/features/CycleComparisonChart'
import { differenceInDays, parseISO, format } from 'date-fns'
import { de } from 'date-fns/locale'

export const metadata = {
    title: 'Zyklusvergleich',
    description: 'Vergleiche deine Zyklen miteinander.',
}

export default async function CycleComparisonPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Lade alle Perioden- und Temperatureinträge der letzten 365 Tage
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 365)
    const startDateStr = startDate.toISOString().split('T')[0]

    const [tempResult, periodResult] = await Promise.all([
        supabase
            .from('temperature_entries')
            .select('date, temperature')
            .eq('user_id', user.id)
            .gte('date', startDateStr)
            .order('date', { ascending: true }),
        supabase
            .from('period_entries')
            .select('date, flow_intensity')
            .eq('user_id', user.id)
            .gte('date', startDateStr)
            .order('date', { ascending: true }),
    ])

    const entries = tempResult.data || []
    const periodEntries = periodResult.data || []

    // Finde Zyklusstarts (erste Tage der Periode nach einer Pause)
    const periodDates = periodEntries.map(p => p.date).sort()
    const cycleStarts: string[] = []

    for (let i = 0; i < periodDates.length; i++) {
        if (i === 0) {
            cycleStarts.push(periodDates[i])
        } else {
            const diff = differenceInDays(parseISO(periodDates[i]), parseISO(periodDates[i - 1]))
            if (diff > 3) {
                cycleStarts.push(periodDates[i])
            }
        }
    }

    // Erstelle Zyklusdaten
    const cycles = cycleStarts.map((start, idx) => {
        const nextStart = cycleStarts[idx + 1]
        const cycleEntries = entries
            .filter(e => {
                if (e.date < start) return false
                if (nextStart && e.date >= nextStart) return false
                return true
            })
            .map(e => ({
                cycleDay: differenceInDays(parseISO(e.date), parseISO(start)) + 1,
                temperature: Number(e.temperature),
            }))

        return {
            cycleNumber: idx + 1,
            startDate: format(parseISO(start), 'd. MMM', { locale: de }),
            entries: cycleEntries,
            color: '',
        }
    }).filter(c => c.entries.length >= 3) // Nur Zyklen mit mind. 3 Einträgen

    return (
        <div className="space-y-6 pb-20 pt-4">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    Zyklusvergleich
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {cycles.length} {cycles.length === 1 ? 'Zyklus' : 'Zyklen'} gefunden
                </p>
            </div>

            <CycleComparisonChart cycles={cycles} />

            {cycles.length > 0 && (
                <div className="card">
                    <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
                        Zyklusübersicht
                    </h2>
                    <div className="space-y-2">
                        {cycles.map((cycle, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between py-2 border-b last:border-0"
                                style={{ borderColor: 'var(--border-subtle)' }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                        Zyklus {cycle.cycleNumber}
                                    </span>
                                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                        ab {cycle.startDate}
                                    </span>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                                    {cycle.entries.length} Einträge
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
