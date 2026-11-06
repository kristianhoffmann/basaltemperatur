# Flottenstandard Runde zwei

**Ziel:** Vorhandene SEO-Korrekturen erhalten und Conversion-Fluss ohne Browser-Attribution ergänzen.
**Architektur:** `from` wird validiert, serverseitig als Formularwert und OAuth-Redirect übernommen und in vorhandenen Kontometadaten gespeichert. Der bestehende HMAC-Sender läuft mit Timeout nach der Antwort. Ein öffentliches Hilfslinien-Werkzeug nutzt `calculateCoverLine`; thematische Artikel-CTAs führen dorthin oder direkt zur Erfassung.
**Technik:** Next.js 16, Supabase Auth, Stripe, Vitest.

1. Regressionstests für URL-Validierung, Themenzuordnung, HMAC, Ausfälle und Kontoausschluss anlegen und rot ausführen.
2. Cookie-Attribution durch URL-/Metadaten-Fluss ersetzen; Signup, OAuth, Checkout und bezahlte Webhooks integrieren. Keine Migration erforderlich.
3. Öffentliches Werkzeug mit Methodik und rechnerischem Beispiel, zwei Artikel-CTAs und globale Organization-/WebSite-Daten ergänzen.
4. Sitemap, llms.txt, Navigation und Datenschutzhinweis aktualisieren. Bestandsinhalte auf offene redaktionelle Kriterien abgrenzen.
5. Tests, Typprüfung, Lint, Build und lokalen HTTP-Test durchführen; vollständige A1–H2-Matrix berichten.

Keine Commits, Pushes, Deployments oder Produktionszugriffe.
