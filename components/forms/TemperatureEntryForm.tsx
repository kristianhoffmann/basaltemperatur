// components/forms/TemperatureEntryForm.tsx
// Eingabeformular für Basaltemperatur, Periodenmarkierung und Zervixschleim
'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { Thermometer, Droplets, Save, Loader2, Check } from 'lucide-react'
import type { CervicalMucusType } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'

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

// Haptic helper
const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        if (intensity === 'light') window.navigator.vibrate(10)
        else if (intensity === 'medium') window.navigator.vibrate(20)
        else if (intensity === 'heavy') window.navigator.vibrate([30, 50, 30])
    }
}

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
        triggerHaptic('medium')

        const tempValue = parseFloat(temperature.replace(',', '.'))
        if (isNaN(tempValue) || tempValue < 34 || tempValue > 42) {
            setError('Bitte gib eine gültige Temperatur ein (34.00 – 42.00 °C)')
            triggerHaptic('heavy')
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
                triggerHaptic('medium')
                // Keep success state a bit longer for the nice animation
                setTimeout(() => setSuccess(false), 3000)
            } catch (err) {
                setError('Fehler beim Speichern. Bitte versuche es erneut.')
                triggerHaptic('heavy')
            }
        })
    }

    // Dynamic UI feedback based on temperature
    const parsedTemp = parseFloat(temperature.replace(',', '.'))
    const isHigh = !isNaN(parsedTemp) && parsedTemp >= 36.8
    const isLow = !isNaN(parsedTemp) && parsedTemp < 36.5

    // Choose dynamic colors
    const activeColor = isHigh ? '#F43F5E' : isLow ? '#8B5CF6' : 'var(--primary)'
    const glowColor = isHigh ? 'rgba(244, 63, 94, 0.15)' : isLow ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0, 0, 0, 0.05)'

    return (
        <motion.form
            layout
            onSubmit={handleSubmit}
            className={`card relative overflow-hidden transition-all duration-700 ${className || ''}`}
            style={{ boxShadow: `0 8px 32px ${glowColor}` }}
        >
            <motion.h3 layout="position" className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <motion.div
                    animate={{ color: activeColor }}
                    transition={{ duration: 0.5 }}
                >
                    <Thermometer className="h-5 w-5" style={{ color: activeColor }} />
                </motion.div>
                Temperatur eintragen
            </motion.h3>

            <motion.div layout className="space-y-6">
                {/* Datum */}
                <motion.div layout="position">
                    <label htmlFor="entry-date" className="label">Datum</label>
                    <input
                        id="entry-date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={today}
                        className="input"
                    />
                </motion.div>

                {/* Temperatur */}
                <motion.div layout="position">
                    <label htmlFor="entry-temp" className="label flex justify-between">
                        <span>Basaltemperatur (°C)</span>
                        <AnimatePresence>
                            {(isHigh || isLow) && (
                                <motion.span
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: isHigh ? '#FFF1F2' : '#F5F3FF',
                                        color: isHigh ? '#F43F5E' : '#8B5CF6'
                                    }}
                                >
                                    {isHigh ? 'Hochlage' : 'Tieflage'}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </label>
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
                            className="input pr-12 text-2xl font-semibold text-center tracking-wider transition-colors duration-500"
                            style={{
                                borderColor: temperature ? activeColor : undefined,
                                outlineColor: temperature ? activeColor : undefined
                            }}
                            autoComplete="off"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                            °C
                        </span>
                    </div>
                </motion.div>

                {/* Zervixschleim */}
                <motion.div layout="position">
                    <label className="label">Zervixschleim</label>
                    <div className="grid grid-cols-5 gap-1.5">
                        {mucusOptions.map((option, i) => {
                            const isSelected = cervicalMucus === option.value
                            return (
                                <motion.button
                                    key={option.value}
                                    type="button"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => {
                                        triggerHaptic('light')
                                        setCervicalMucus(isSelected ? null : option.value)
                                    }}
                                    className={`relative flex flex-col items-center gap-1 p-2 rounded-xl text-xs overflow-hidden transition-all duration-300 ${isSelected
                                            ? 'ring-2 ring-rose-400 bg-rose-50/80 shadow-inner'
                                            : 'bg-gray-50/80 hover:bg-gray-100'
                                        }`}
                                >
                                    {isSelected && (
                                        <motion.div
                                            layoutId="mucus-bg"
                                            className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-10"
                                            style={{ borderRadius: '0.75rem' }}
                                        />
                                    )}
                                    <span className="text-lg block transform transition-transform duration-300" style={{ transform: isSelected ? 'scale(1.1)' : 'scale(1)' }}>
                                        {option.emoji}
                                    </span>
                                    <span className={`font-medium leading-tight ${isSelected ? 'text-rose-600' : 'text-gray-600'}`}>
                                        {option.label}
                                    </span>
                                </motion.button>
                            )
                        })}
                    </div>
                    <AnimatePresence mode="popLayout">
                        {cervicalMucus && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs text-gray-500 mt-2 text-center"
                            >
                                {mucusOptions.find(o => o.value === cervicalMucus)?.description}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Periode Toggle */}
                <motion.div layout="position">
                    <label className="label">Periodenblutung</label>
                    <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            triggerHaptic('light')
                            setHasPeriod(!hasPeriod)
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-300 ${hasPeriod
                                ? 'border-period bg-period-light/20 text-period shadow-inner'
                                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <Droplets className={`h-5 w-5 ${hasPeriod ? 'fill-period/20' : ''}`} />
                            <span className="font-medium">
                                {hasPeriod ? 'Periode – Ja' : 'Periode – Nein'}
                            </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${hasPeriod ? 'border-period bg-period' : 'border-gray-300'}`}>
                            {hasPeriod && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                    </motion.button>
                </motion.div>

                {/* Flow Intensity */}
                <AnimatePresence mode="popLayout">
                    {hasPeriod && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -10 }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        >
                            <label className="label">Stärke</label>
                            <div className="grid grid-cols-4 gap-2">
                                {flowOptions.map((option, i) => (
                                    <motion.button
                                        key={option.value}
                                        type="button"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={() => {
                                            triggerHaptic('light')
                                            setFlowIntensity(option.value)
                                        }}
                                        className={`px-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${flowIntensity === option.value
                                                ? 'ring-2 ring-period shadow-md shadow-period/20'
                                                : 'hover:bg-gray-50'
                                            }`}
                                        style={{
                                            backgroundColor: flowIntensity === option.value ? option.color : `${option.color}20`,
                                            color: flowIntensity === option.value ? 'white' : '#9B4B5A',
                                            textShadow: flowIntensity === option.value ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        {option.label}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notizen */}
                <motion.div layout="position">
                    <label htmlFor="entry-notes" className="label">Notizen (optional)</label>
                    <textarea
                        id="entry-notes"
                        rows={2}
                        placeholder="z.B. schlecht geschlafen, krank, Stress..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input resize-none bg-gray-50/50 focus:bg-white transition-colors"
                    />
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: 'auto', scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            className="p-3 rounded-xl bg-error/10 text-error text-sm font-medium flex items-center gap-2"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit Container */}
                <motion.div layout className="pt-2 flex justify-center">
                    <motion.button
                        type="submit"
                        disabled={isPending || !temperature || success}
                        layout
                        whileTap={(!isPending && !success && temperature) ? { scale: 0.96 } : {}}
                        className={`relative overflow-hidden inline-flex items-center justify-center font-medium text-white transition-all overflow-hidden ${success ? 'bg-success rounded-full' : 'rounded-2xl w-full'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        style={{
                            height: '56px',
                            width: success ? '56px' : '100%',
                            background: success
                                ? '#10B981' // emerald-500
                                : `linear-gradient(135deg, ${activeColor}, ${isHigh ? '#E11D48' : isLow ? '#7C3AED' : 'var(--rose-dark)'})`,
                            boxShadow: success
                                ? '0 0 20px rgba(16, 185, 129, 0.4)'
                                : `0 4px 20px -2px ${glowColor}`,
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {success ? (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                >
                                    <Check className="h-7 w-7 text-white" strokeWidth={3} />
                                </motion.div>
                            ) : isPending ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2"
                                >
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="default"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 text-[15px]"
                                >
                                    <Save className="h-5 w-5" />
                                    Speichern
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </motion.div>
            </motion.div>
        </motion.form>
    )
}
