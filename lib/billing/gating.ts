/**
 * Die Paywall-Texte, die eine Nutzerin ohne Vollzugang tatsächlich zu sehen
 * bekommt.
 *
 * Sie stehen hier und nicht in der Seite, weil die QA-Sonde denselben String
 * ausliefern muss, den das UI rendert. Tippt man ihn an beiden Stellen ab,
 * behauptet der Fleet-Test irgendwann etwas über Copy, die es nicht mehr gibt —
 * genau der Fehler, den `gating.blockedCopy` verhindern soll.
 *
 * Deutsch bleibt deutsch: das Produkt hat keine zweite Sprache.
 */

/** Überschrift der Premium-Schranke auf /statistiken. */
export const STATISTICS_GATE_HEADING = 'Statistiken sind Premium'

/** Erklärender Absatz unter der Überschrift. */
export const STATISTICS_GATE_BODY =
    'Der Vollzugang schaltet Auswertbarkeit, Zyklus-Stabilität, Messqualität, ' +
    'Temperaturtrends und den Verlauf deiner Zyklen frei.'

/**
 * Der String, gegen den der Fleet-Test prüft. Bewusst die Überschrift und nicht
 * der Fließtext: sie ist kurz, steht als eigener Knoten im DOM und überlebt
 * Umformulierungen des Absatzes.
 */
export function statisticsGateMessage(): string {
    return STATISTICS_GATE_HEADING
}
