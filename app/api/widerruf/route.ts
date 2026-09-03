import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { formatDeclarationSummary, validateWithdrawal } from '@/lib/withdrawal'
import { sendWithdrawalAcknowledgement } from '@/lib/withdrawal-mail'

/**
 * POST /api/widerruf — die elektronische Widerrufsfunktion nach § 356a BGB.
 *
 * BEWUSST OHNE LOGIN: Wer widerrufen will, kommt oft nicht mehr ins Konto oder
 * hat nie eines angelegt. Ein Loginzwang würde die gesetzlich geforderte
 * leichte Zugänglichkeit verfehlen.
 *
 * Reihenfolge mit Absicht: erst speichern, dann bestätigen. Scheitert der
 * Mailversand, ist der Widerruf trotzdem zugegangen und nachweisbar.
 */

const attempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

function checkRateLimit(key: string): boolean {
    const now = Date.now()
    const entry = attempts.get(key)
    if (!entry || now >= entry.resetAt) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
        return true
    }
    if (entry.count >= MAX_ATTEMPTS) return false
    entry.count += 1
    return true
}

function clientKey(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for') ?? ''
    const ip = forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
    return createHash('sha256').update(ip).digest('hex').slice(0, 32)
}

export async function POST(request: Request) {
    if (!checkRateLimit(clientKey(request))) {
        return NextResponse.json(
            { error: 'Zu viele Versuche. Bitte versuche es später erneut oder schreibe uns per E-Mail.' },
            { status: 429 },
        )
    }

    let body: Record<string, unknown>
    try {
        body = (await request.json()) as Record<string, unknown>
    } catch {
        return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
    }

    const validation = validateWithdrawal({
        name: body.name,
        email: body.email,
        contractReference: body.contractReference,
        contractDate: body.contractDate,
        message: body.message,
    })
    if (!validation.ok) return NextResponse.json({ errors: validation.errors }, { status: 422 })

    const { declaration } = validation
    const receivedAt = new Date()
    const summary = formatDeclarationSummary(declaration, receivedAt)

    const supabase = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } },
    )

    const { data, error } = await supabase
        .from('withdrawal_declarations')
        .insert({
            received_at: receivedAt.toISOString(),
            name: declaration.name,
            email: declaration.email,
            contract_reference: declaration.contractReference,
            contract_date: declaration.contractDate,
            message: declaration.message,
            receipt_summary: summary,
            source_ip_hash: clientKey(request),
            user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
        })
        .select('id')
        .single()

    if (error) {
        console.error('[widerruf] persist failed', error.message)
        return NextResponse.json(
            {
                error:
                    'Dein Widerruf konnte technisch nicht entgegengenommen werden. Bitte sende ihn per E-Mail an moin@kristianhoffmann.de — dein Widerrufsrecht bleibt davon unberührt.',
            },
            { status: 500 },
        )
    }

    const sent = await sendWithdrawalAcknowledgement({
        to: declaration.email,
        name: declaration.name,
        summary,
    })

    await supabase
        .from('withdrawal_declarations')
        .update({ acknowledgement_sent: sent.ok, acknowledgement_error: sent.ok ? null : sent.code })
        .eq('id', data.id)

    return NextResponse.json({
        ok: true,
        receivedAt: receivedAt.toISOString(),
        summary,
        acknowledgementSent: sent.ok,
    })
}
