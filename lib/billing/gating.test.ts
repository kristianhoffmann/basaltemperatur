// Drift-Wache für gating.blockedCopy.
//
// Der flottenweite Standardtest navigiert zu gating.surface und prüft gegen
// gating.blockedCopy. Das ist nur so viel wert, wie der String der Sonde dem
// String entspricht, den die Seite rendert. Also wird hier festgenagelt, dass
// beide aus lib/billing/gating.ts kommen und niemand die Copy irgendwo
// zweitgeschrieben hat.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
    STATISTICS_GATE_BODY,
    STATISTICS_GATE_HEADING,
    statisticsGateMessage,
} from './gating'

const ROOT = join(__dirname, '..', '..')
const PAGE = join(ROOT, 'app', '(dashboard)', 'statistiken', 'page.tsx')
const PROBE = join(ROOT, 'app', 'api', 'qa', 'status', 'route.ts')

describe('statistics paywall copy', () => {
    it('is what the QA probe reports as blockedCopy', () => {
        expect(statisticsGateMessage()).toBe(STATISTICS_GATE_HEADING)
    })

    it('is rendered by the page from the shared module, not retyped', () => {
        const source = readFileSync(PAGE, 'utf8')

        expect(source).toContain("from '@/lib/billing/gating'")
        expect(source).toContain('{STATISTICS_GATE_HEADING}')
        expect(source).toContain('{STATISTICS_GATE_BODY}')

        // Ein wörtlich abgetippter Text hier wäre genau die Divergenz, die der
        // Vertrag verhindern soll.
        expect(source).not.toContain(STATISTICS_GATE_HEADING)
        expect(source).not.toContain('Der Vollzugang schaltet')
    })

    it('reaches the probe through the same function', () => {
        const source = readFileSync(PROBE, 'utf8')

        expect(source).toContain("statisticsGateMessage } from '@/lib/billing/gating'")
        expect(source).toContain('blockedCopy: statisticsGateMessage()')
        expect(source).not.toContain(STATISTICS_GATE_HEADING)
    })

    it('keeps the body a single line once JSX whitespace is collapsed', () => {
        // Die Seite rendert BODY als einen Textknoten; ein eingebauter
        // Zeilenumbruch würde im Browser zu doppelten Leerzeichen führen.
        expect(STATISTICS_GATE_BODY).not.toMatch(/\s{2,}|\n/)
    })
})
