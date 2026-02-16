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
 * Formatiert einen Betrag als Währung
 * formatCurrency(1234.56) → "1.234,56 €"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'de-DE'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
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
 * Formatiert ein Datum mit Uhrzeit
 * formatDateTime(new Date()) → "27.01.2026, 14:30"
 */
export function formatDateTime(
  date: Date | string,
  locale: string = 'de-DE'
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
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

/**
 * Wartet für eine bestimmte Zeit (in ms)
 * await sleep(1000) // wartet 1 Sekunde
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Prüft ob ein Objekt leer ist
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0
}

/**
 * Generiert eine zufällige ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Formatiert eine Telefonnummer (Deutschland)
 * formatPhone("01234567890") → "+49 123 456 7890"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('49')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
  }
  if (cleaned.startsWith('0')) {
    return `+49 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

/**
 * Berechnet Netto, Brutto und MwSt.
 */
export function calculateTax(
  amount: number,
  taxRate: number = 19,
  isGross: boolean = false
): { net: number; gross: number; tax: number } {
  if (isGross) {
    const net = amount / (1 + taxRate / 100)
    const tax = amount - net
    return { net, gross: amount, tax }
  }
  const tax = amount * (taxRate / 100)
  const gross = amount + tax
  return { net: amount, gross, tax }
}

/**
 * Status-Farben für Badges
 */
export const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-600',
  accepted: 'bg-green-100 text-green-600',
  rejected: 'bg-red-100 text-red-600',
  paid: 'bg-green-100 text-green-600',
  overdue: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-600',
  inactive: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-600',
  completed: 'bg-green-100 text-green-600',
  in_progress: 'bg-blue-100 text-blue-600',
}

/**
 * Status-Labels (Deutsch)
 */
export const statusLabels: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  accepted: 'Angenommen',
  rejected: 'Abgelehnt',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
  active: 'Aktiv',
  inactive: 'Inaktiv',
  pending: 'Ausstehend',
  completed: 'Abgeschlossen',
  in_progress: 'In Bearbeitung',
}
