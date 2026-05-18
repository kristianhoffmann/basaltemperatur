// lib/utils.ts
// Gemeinsame Hilfsfunktionen für die gesamte App

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Kombiniert Tailwind-Klassen mit clsx und tailwind-merge
 * Verwendung: cn('px-4', isActive && 'bg-primary', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatiert ein Datum
 * formatDate(new Date()) → "27.01.2026"
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  },
  locale: string = 'de-DE'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, options).format(d)
}

/**
 * Kürzt einen Text auf eine maximale Länge
 * truncate("Langer Text hier", 10) → "Langer Tex..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Generiert Initialen aus einem Namen
 * getInitials("Max Mustermann") → "MM"
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
