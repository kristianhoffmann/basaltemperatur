// app/(dashboard)/eintrag/EntryPageClient.tsx
'use client'

import { TemperatureEntryForm } from '@/components/forms/TemperatureEntryForm'
import { saveTemperatureEntry } from '@/lib/actions/temperature'
import { useRouter } from 'next/navigation'
import type { CervicalMucusType } from '@/types/database'

interface EntryPageClientProps {
    initialDate?: string
    initialTemperature?: number
    initialNotes?: string
    initialHasPeriod?: boolean
    initialFlowIntensity?: 'light' | 'medium' | 'heavy' | 'spotting'
    initialCervicalMucus?: CervicalMucusType | null
}

export function EntryPageClient(props: EntryPageClientProps) {
    const router = useRouter()

    const handleSubmit = async (data: {
        date: string
        temperature: number
        notes: string
        hasPeriod: boolean
        flowIntensity: 'light' | 'medium' | 'heavy' | 'spotting'
        cervicalMucus: CervicalMucusType | null
    }) => {
        await saveTemperatureEntry(data)
        setTimeout(() => {
            router.push('/dashboard')
        }, 1500)
    }

    return (
        <TemperatureEntryForm
            onSubmit={handleSubmit}
            initialDate={props.initialDate}
            initialTemperature={props.initialTemperature}
            initialNotes={props.initialNotes}
            initialHasPeriod={props.initialHasPeriod}
            initialFlowIntensity={props.initialFlowIntensity}
            initialCervicalMucus={props.initialCervicalMucus}
        />
    )
}
