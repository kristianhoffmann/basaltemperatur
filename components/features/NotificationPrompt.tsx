// components/features/NotificationPrompt.tsx
// Push-Benachrichtigung – Erinnerung an Temperaturmessung
'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, X } from 'lucide-react'

export function NotificationPrompt() {
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
    const [dismissed, setDismissed] = useState(true)
    const [reminderTime, setReminderTime] = useState('06:30')

    useEffect(() => {
        if (!('Notification' in window)) {
            setPermission('unsupported')
            return
        }

        setPermission(Notification.permission)

        const wasDismissed = localStorage.getItem('notification-prompt-dismissed')
        const isEnabled = localStorage.getItem('notification-enabled')

        if (!wasDismissed && !isEnabled && Notification.permission === 'default') {
            setDismissed(false)
        }

        const savedTime = localStorage.getItem('notification-time')
        if (savedTime) setReminderTime(savedTime)

        // If enabled, set up check interval
        if (isEnabled === 'true' && Notification.permission === 'granted') {
            const checkInterval = setInterval(() => {
                checkAndNotify(savedTime || '06:30')
            }, 60000) // Check every minute

            return () => clearInterval(checkInterval)
        }
    }, [])

    const checkAndNotify = (time: string) => {
        const now = new Date()
        const [hours, minutes] = time.split(':').map(Number)
        const notifiedToday = localStorage.getItem('notified-date')
        const todayStr = now.toISOString().split('T')[0]

        if (
            now.getHours() === hours &&
            now.getMinutes() === minutes &&
            notifiedToday !== todayStr
        ) {
            new Notification('🌡️ Basaltemperatur', {
                body: 'Vergiss nicht, deine Temperatur einzutragen!',
                icon: '/icons/icon-192.png',
            })
            localStorage.setItem('notified-date', todayStr)
        }
    }

    const requestPermission = async () => {
        if (!('Notification' in window)) return

        const result = await Notification.requestPermission()
        setPermission(result)

        if (result === 'granted') {
            localStorage.setItem('notification-enabled', 'true')
            localStorage.setItem('notification-time', reminderTime)
            setDismissed(true)

            // Show confirmation
            new Notification('🌡️ Basaltemperatur', {
                body: `Erinnerung aktiviert! Täglich um ${reminderTime} Uhr.`,
            })
        }
    }

    const dismiss = () => {
        setDismissed(true)
        localStorage.setItem('notification-prompt-dismissed', 'true')
    }

    if (dismissed || permission === 'granted' || permission === 'unsupported') {
        return null
    }

    return (
        <div
            className="rounded-2xl p-4 mb-4 animate-fade-in relative"
            style={{
                background: 'linear-gradient(135deg, #eff6ff, #eef2ff)',
                border: '1px solid #bfdbfe',
            }}
        >
            <button
                onClick={dismiss}
                className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/50 transition-colors"
            >
                <X className="h-4 w-4 text-gray-400" />
            </button>

            <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                    <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">
                        Erinnerung aktivieren?
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Wir erinnern dich täglich an deine Temperaturmessung.
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                        <label className="text-xs text-gray-500">Um:</label>
                        <input
                            type="time"
                            value={reminderTime}
                            onChange={(e) => setReminderTime(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                        />
                        <button
                            onClick={requestPermission}
                            className="text-xs font-medium text-white px-3 py-1.5 rounded-lg transition-colors"
                            style={{ backgroundColor: '#3b82f6' }}
                        >
                            Aktivieren
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
