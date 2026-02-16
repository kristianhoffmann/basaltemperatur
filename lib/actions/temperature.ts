// lib/actions/temperature.ts
// Server Actions für Temperatur- und Perioden-Einträge
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CervicalMucusType } from '@/types/database'

export async function saveTemperatureEntry(data: {
    date: string
    temperature: number
    notes: string
    hasPeriod: boolean
    flowIntensity: 'light' | 'medium' | 'heavy' | 'spotting'
    cervicalMucus?: CervicalMucusType | null
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Nicht angemeldet')
    }

    const userId = user.id

    // Temperatur speichern (upsert – falls schon ein Eintrag für den Tag existiert)
    const { error: tempError } = await supabase
        .from('temperature_entries')
        .upsert({
            user_id: userId,
            date: data.date,
            temperature: data.temperature,
            notes: data.notes || null,
            cervical_mucus: data.cervicalMucus || null,
        }, {
            onConflict: 'user_id,date',
        })

    if (tempError) {
        throw new Error(`Fehler beim Speichern der Temperatur: ${tempError.message}`)
    }

    // Periode speichern oder löschen
    if (data.hasPeriod) {
        const { error: periodError } = await supabase
            .from('period_entries')
            .upsert({
                user_id: userId,
                date: data.date,
                flow_intensity: data.flowIntensity,
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
            .eq('date', data.date)
    }

    revalidatePath('/')
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
    revalidatePath('/kalender')
}

export async function getTemperatureEntries(days: number = 45) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { entries: [], periodEntries: [] }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]

    const [tempResult, periodResult] = await Promise.all([
        supabase
            .from('temperature_entries')
            .select('date, temperature, notes')
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
