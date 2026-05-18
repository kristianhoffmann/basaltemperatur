// lib/actions/temperature.ts
// Server Actions für Temperatur- und Perioden-Einträge
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { z } from 'zod'
import type { CervicalMucusType } from '@/types/database'

const temperatureEntrySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datumsformat'),
    temperature: z.number().min(34.0, 'Temperatur zu niedrig').max(42.0, 'Temperatur zu hoch'),
    notes: z.string().max(500, 'Notiz zu lang').default(''),
    hasPeriod: z.boolean(),
    flowIntensity: z.enum(['light', 'medium', 'heavy', 'spotting']),
    cervicalMucus: z.enum(['dry', 'sticky', 'creamy', 'watery', 'eggwhite']).nullable().optional(),
    measurementTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Ungültige Uhrzeit').nullable().optional(),
    sleepHours: z.number().min(0).max(24).nullable().optional(),
    disturbed: z.boolean().default(false),
    disturbanceReason: z.string().max(200, 'Störfaktor zu lang').default(''),
    excludeFromAnalysis: z.boolean().default(false),
}).refine((data) => {
    const selectedDate = new Date(`${data.date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate <= today
}, {
    message: 'Datum darf nicht in der Zukunft liegen',
    path: ['date'],
})

export async function saveTemperatureEntry(data: {
    date: string
    temperature: number
    notes: string
    hasPeriod: boolean
    flowIntensity: 'light' | 'medium' | 'heavy' | 'spotting'
    cervicalMucus?: CervicalMucusType | null
    measurementTime?: string | null
    sleepHours?: number | null
    disturbed?: boolean
    disturbanceReason?: string
    excludeFromAnalysis?: boolean
}) {
    // Validate input server-side
    const validated = temperatureEntrySchema.parse(data)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Nicht angemeldet')
    }

    const userId = user.id

    const { data: profile } = await supabase
        .from('profiles')
        .select('sensitive_data_consent_at')
        .eq('id', userId)
        .maybeSingle()

    if (!profile?.sensitive_data_consent_at) {
        throw new Error('Bitte bestätige zuerst die Verarbeitung deiner Zyklusdaten im Onboarding.')
    }

    // Temperatur speichern (upsert – falls schon ein Eintrag für den Tag existiert)
    const { error: tempError } = await supabase
        .from('temperature_entries')
        .upsert({
            user_id: userId,
            date: validated.date,
            temperature: validated.temperature,
            notes: validated.notes || null,
            cervical_mucus: validated.cervicalMucus || null,
            measurement_time: validated.measurementTime || null,
            sleep_hours: validated.sleepHours ?? null,
            disturbed: validated.disturbed,
            disturbance_reason: validated.disturbed ? (validated.disturbanceReason || null) : null,
            exclude_from_analysis: validated.excludeFromAnalysis,
        }, {
            onConflict: 'user_id,date',
        })

    if (tempError) {
        throw new Error(`Fehler beim Speichern der Temperatur: ${tempError.message}`)
    }

    // Periode speichern oder löschen
    if (validated.hasPeriod) {
        const { error: periodError } = await supabase
            .from('period_entries')
            .upsert({
                user_id: userId,
                date: validated.date,
                flow_intensity: validated.flowIntensity,
            }, {
                onConflict: 'user_id,date',
            })

        if (periodError) {
            throw new Error(`Fehler beim Speichern der Periode: ${periodError.message}`)
        }
    } else {
        // Wenn Periode-Markierung entfernt wurde
        await supabase
            .from('period_entries')
            .delete()
            .eq('user_id', userId)
            .eq('date', validated.date)
    }

    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath('/kalender')
    revalidatePath('/eintrag')
}

export async function deleteTemperatureEntry(date: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Nicht angemeldet')
    }

    await supabase
        .from('temperature_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('date', date)

    await supabase
        .from('period_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('date', date)

    revalidatePath('/')
    revalidatePath('/dashboard')
    revalidatePath('/kalender')
}

export async function getTemperatureEntries(days: number = 45) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { entries: [], periodEntries: [] }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = format(startDate, 'yyyy-MM-dd')

    const [tempResult, periodResult] = await Promise.all([
        supabase
            .from('temperature_entries')
            .select('date, temperature, notes, cervical_mucus, measurement_time, sleep_hours, disturbed, disturbance_reason, exclude_from_analysis')
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

    return {
        entries: tempResult.data || [],
        periodEntries: periodResult.data || [],
    }
}

export async function getEntryForDate(date: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const [tempResult, periodResult] = await Promise.all([
        supabase
            .from('temperature_entries')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', date)
            .single(),
        supabase
            .from('period_entries')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', date)
            .single(),
    ])

    return {
        temperature: tempResult.data,
        period: periodResult.data,
    }
}
