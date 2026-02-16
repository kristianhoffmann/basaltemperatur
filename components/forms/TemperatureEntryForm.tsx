// components/forms/TemperatureEntryForm.tsx
// Eingabeformular für Basaltemperatur, Periodenmarkierung und Zervixschleim
'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Thermometer, Droplets, Save, Loader2 } from 'lucide-react'
import type { CervicalMucusType } from '@/types/database'

interface TemperatureEntryFormProps {
    onSubmit: (data: {
        date: string
        temperature: number
        notes: string
        hasPeriod: boolean
        flowIntensity: 'light' | 'medium' | 'heavy' | 'spotting'
        cervicalMucus: CervicalMucusType | null
    }) => Promise<void>
    initialDate?: string
    initialTemperature?: number
    initialNotes?: string
    initialHasPeriod?: boolean
    initialFlowIntensity?: 'light' | 'medium' | 'heavy' | 'spotting'
    initialCervicalMucus?: CervicalMucusType | null
    className?: string
}

const flowOptions = [
    { value: 'spotting' as const, label: 'Schmierblutung', color: '#FACDD6' },
    { value: 'light' as const, label: 'Leicht', color: '#F5A3B5' },
    { value: 'medium' as const, label: 'Mittel', color: '#E85D75' },
    { value: 'heavy' as const, label: 'Stark', color: '#B84D65' },
]

const mucusOptions: { value: CervicalMucusType; label: string; emoji: string; description: string }[] = [
    { value: 'dry', label: 'Trocken', emoji: '◽', description: 'Kein Schleim' },
    { value: 'sticky', label: 'Klebrig', emoji: '🟡', description: 'Zäh, klumpig' },
    { value: 'creamy', label: 'Cremig', emoji: '⚪', description: 'Lotionartig' },
    { value: 'watery', label: 'Wässrig', emoji: '💧', description: 'Klar, dünn' },
    { value: 'eggwhite', label: 'Spinnbar', emoji: '✨', description: 'Eiweiß-ähnlich' },
]

export function TemperatureEntryForm({
    onSubmit,
    initialDate,
    initialTemperature,
    initialNotes = '',
    initialHasPeriod = false,
    initialFlowIntensity = 'medium',
    initialCervicalMucus = null,
    className,
}: TemperatureEntryFormProps) {
    const today = format(new Date(), 'yyyy-MM-dd')
    const [date, setDate] = useState(initialDate || today)
    const [temperature, setTemperature] = useState(
        initialTemperature ? initialTemperature.toFixed(2) : ''
    )
    const [notes, setNotes] = useState(initialNotes)
    const [hasPeriod, setHasPeriod] = useState(initialHasPeriod)
    const [flowIntensity, setFlowIntensity] = useState(initialFlowIntensity)
    const [cervicalMucus, setCervicalMucus] = useState<CervicalMucusType | null>(initialCervicalMucus)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)

        const tempValue = parseFloat(temperature.replace(',', '.'))
        if (isNaN(tempValue) || tempValue < 34 || tempValue > 42) {
            setError('Bitte gib eine gültige Temperatur ein (34.00 – 42.00 °C)')
            return
        }

        startTransition(async () => {
            try {
                await onSubmit({
                    date,
                    temperature: tempValue,
                    notes,
                    hasPeriod,
                    flowIntensity,
                    cervicalMucus,
                })
                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            } catch (err) {
                setError('Fehler beim Speichern. Bitte versuche es erneut.')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className={`card ${className || ''}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-primary" />
                Temperatur eintragen
            </h3>

            <div className="space-y-5">
                {/* Datum */}
                <div>
                    <label htmlFor="entry-date" className="label">Datum</label>
                    <input
                        id="entry-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={today}
                        className="input"
                    />
                </div>

                {/* Temperatur */}
                <div>
                    <label htmlFor="entry-temp" className="label">Basaltemperatur (°C)</label>
                    <div className="relative">
                        <input
                            id="entry-temp"
                            type="text"
                            inputMode="decimal"
                            placeholder="36.45"
                            value={temperature}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^\d.,]/g, '')
                                setTemperature(val)
                            }}
                            className="input pr-12 text-2xl font-semibold text-center tracking-wider"
                            autoComplete="off"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                            °C
                        </span>
                    </div>
                </div>

                {/* Zervixschleim */}
                <div>
                    <label className="label">Zervixschleim</label>
                    <div className="grid grid-cols-5 gap-1.5">
                        {mucusOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setCervicalMucus(
                                    cervicalMucus === option.value ? null : option.value
                                )}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all duration-200 ${cervicalMucus === option.value
                                        ? 'ring-2 ring-rose-400 bg-rose-50 scale-105 shadow-sm'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="text-lg">{option.emoji}</span>
                                <span className={`font-medium leading-tight ${cervicalMucus === option.value ? 'text-rose-600' : 'text-gray-600'
                                    }`}>
                                    {option.label}
                                </span>
                            </button>
                        ))}
                    </div>
                    {cervicalMucus && (
                        <p className="text-xs text-gray-500 mt-1.5 text-center animate-fade-in">
                            {mucusOptions.find(o => o.value === cervicalMucus)?.description}
                        </p>
                    )}
                </div>

                {/* Periode Toggle */}
                <div>
                    <label className="label">Periodenblutung</label>
                    <button
                        type="button"
                        onClick={() => setHasPeriod(!hasPeriod)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-200 ${hasPeriod
                            ? 'border-period bg-period-light text-period'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                            }`}
                    >
                        <Droplets className="h-5 w-5" />
                        <span className="font-medium">
                            {hasPeriod ? 'Periode – Ja' : 'Periode – Nein'}
                        </span>
                    </button>
                </div>

                {/* Flow Intensity */}
                {hasPeriod && (
                    <div className="animate-slide-up">
                        <label className="label">Stärke</label>
                        <div className="grid grid-cols-4 gap-2">
                            {flowOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setFlowIntensity(option.value)}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${flowIntensity === option.value
                                        ? 'ring-2 ring-period shadow-sm scale-105'
                                        : 'hover:scale-102'
                                        }`}
                                    style={{
                                        backgroundColor: flowIntensity === option.value ? option.color : `${option.color}40`,
                                        color: flowIntensity === option.value ? 'white' : '#9B4B5A',
                                    }}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notizen */}
                <div>
                    <label htmlFor="entry-notes" className="label">Notizen (optional)</label>
                    <textarea
                        id="entry-notes"
                        rows={2}
                        placeholder="z.B. schlecht geschlafen, krank, Stress..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input resize-none"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 rounded-xl bg-error/10 text-error text-sm">
                        {error}
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="p-3 rounded-xl bg-success/10 text-success text-sm animate-fade-in">
                        ✓ Gespeichert!
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isPending || !temperature}
                    className="w-full inline-flex items-center justify-center gap-2 font-medium text-sm text-white rounded-2xl px-5 py-3 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        background: 'linear-gradient(135deg, var(--rose), var(--rose-dark))',
                        boxShadow: '0 4px 16px rgba(232, 120, 138, 0.3)',
                    }}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Speichern...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            Speichern
                        </>
                    )}
                </button>
            </div>
        </form>
    )
}
