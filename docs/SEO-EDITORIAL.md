# SEO-Veröffentlichung und lokale Prüfung

## Verhalten nach dem Ausrollen

Bestehende veröffentlichte Artikel bleiben unverändert lesbar. Der signierte Autopilot-Webhook speichert neue Texte und Aktualisierungen zunächst in `seo_autopilot_drafts`. Ohne redaktionelle Freigabe antwortet er **202**, `published: false`, `status: pending_review` bzw. `needs_changes`. Er überschreibt in diesem Fall keine Veröffentlichung und meldet keine URL an IndexNow.

Vor Aktivierung muss die vorbereitete Migration `20261105000000_seo_editorial_drafts.sql` durch den Betreiber im vorgesehenen Deployment-Prozess angewendet werden. Sie wurde hier nicht ausgeführt. Die Tabelle hat RLS und keine öffentliche Lesepolicy. Bei fehlender Tabelle schlägt der Webhook mit 503 fehl, statt ungeprüft zu veröffentlichen. `SEO_AUTOPILOT_SITE_ID` muss gesetzt sein und zur signierten Lieferung passen. Tabellen für Veröffentlichungen und deren Daten bleiben unverändert.

## Redaktionelle Freigabe

1. Den vollständigen Entwurf, Suchintention, Quellen, Autorendaten, rechtliche Produktaussagen und vorgeschlagene `overlappingSlugs` prüfen. Die Schlagwort-/Themenprüfung unterstützt die Redaktion, ersetzt sie aber nicht. Überlappende Artikel gegebenenfalls redaktionell zusammenführen; keine automatische Löschung oder Umleitung.
2. Den `contentDigest` aus der Webhook-Antwort verwenden. Er bindet die Freigabe an alle validierten Payload-Felder einschließlich Text, Datum, Autor und Links.
3. In `lib/seo-autopilot/editorial-approvals.json` einen Eintrag mit diesem Digest als Schlüssel und den Feldern `topic`, `reviewedBy`, `reviewedAt` (YYYY-MM-DD), `overlapDecision` ergänzen. Nur echte Namen, tatsächliches Prüfdatum und die konkrete Entscheidung zur Suchintention verwenden. `topic` muss eines der vom Webhook erkannten Themen sein.
4. Die Datei nach dem normalen, separat freizugebenden Veröffentlichungsprozess ausrollen. Anschließend dieselbe Payload neu signiert senden. Geänderte Felder erfordern eine neue Prüfung. Eine Freigabe in der Webhook-Payload selbst wird nicht akzeptiert.
5. Nur bei erfolgreicher Freigabe wird die öffentliche Tabelle aktualisiert; Antwort: **200**, `published: true`, kanonische `url`. Cache-Tags werden invalidiert. Falls `SEO_AUTOPILOT_INDEXNOW_KEY` vorhanden ist, folgt die fehlertolerante Meldung nach der Antwort.

Die Entwurfstabelle enthält jeweils die zuletzt empfangene Fassung pro Site/Sprache/Slug. Der Status `approved` bezeichnet die redaktionelle Freigabe; erst die HTTP-200-Antwort mit `published: true` bestätigt die Speicherung in der öffentlichen Tabelle. Die Freigabedatei ist absichtlich leer: Diese Codearbeit gibt keine Inhalte frei.

## Caching und Status

Artikelcache: 60 Sekunden; Index/Discovery/Sitemap: 300 Sekunden. Nur erfolgreiche Datenbankabfragen liefern Daten oder ein tatsächliches Nichtvorhandensein. Fehler werden geworfen und nicht als leere Ergebnisse gespeichert; Next.js kann erfolgreiche Altstände bei Revalidierungsfehlern weiter ausliefern. Die vorgeschaltete Prüfung im Proxy setzt 404 bzw. 503 vor Streamingbeginn. Fehlerantworten tragen `Cache-Control: no-store`; 503 trägt `Retry-After: 60`, kein `noindex`.

Neue Themen-, Autoren- und Artikelseiten, `/sitemap.xml` und `/llms.txt` nutzen dieselben veröffentlichten Datensätze. Bestehende rechtlich zurückgezogene Slugs bleiben 308-Weiterleitungen und werden aus Discovery/Sitemap ausgeschlossen. Statische Seiten ohne belastbares Änderungsdatum erhalten kein erfundenes `lastmod`.

## Nach dem Ausrollen prüfen

- Unbekannter Artikel: 404 für Browser, Googlebot und OAI-SearchBot; kein Startseiten-Canonical.
- Simulierter Datenbankausfall ausschließlich in Staging: 503/Retry statt leerem Index oder 404; Wiederherstellung ohne manuellen Cache-Reset.
- Webhook: Entwurf 202, freigegebene identische Fassung 200, veränderte Fassung wieder 202. Autopilot muss 202 als gespeichert, aber nicht veröffentlicht verstehen.
- Sitemap, llms.txt, Themenhubs und Autorenprofile gegen veröffentlichte Artikel prüfen. HTTP-Cache am Reverse Proxy darf 404/503 nicht dauerhaft speichern.
- Mit gesetztem IndexNow-Key den Schlüsselpfad und Einreichungsprotokolle prüfen. Kein neuer Schlüssel oder externer Dienst ist für die übrigen Änderungen erforderlich.

## Offene redaktionelle Arbeit

Bestehende ähnliche und themenferne Artikel prüfen; Suchnachfrage vor neuen Produktseiten prüfen. Keine medizinische Fachprüfung oder zusätzliche Qualifikation behaupten, solange sie nicht tatsächlich vorliegt. Profiltexte zeigen ausschließlich bereits gespeicherte Autorendaten. Der Betreiber sollte diese Angaben redaktionell verifizieren.

## Reproduzierbare Offline-Prüfung

`bash scripts/verify-seo-build.sh` baut mit Webpack, zwei ausschließlich lokalen Testartikeln und Font-Mockantworten. Der Prozess erhält eine bereinigte Umgebung, Dummy-Schlüssel und einen Fetch-Mock, der externe Requests zurückweist. Die Testdateien unter `tests/fixtures/seo-*` werden ausschließlich über explizite Test-Umgebungsvariablen geladen; Anwendung und normaler Build verwenden sie nicht. Den so erzeugten `.next`-Ordner niemals deployen: Er enthält Testinhalte und Font-Platzhalter. Vor einem echten Release regulär mit realer Konfiguration neu bauen.

Die Sandbox verhindert lokale Listener (`listen EPERM`). Direkte HTTP-Status-Prüfungen am laufenden Next.js-Server müssen deshalb außerhalb dieser Umgebung nachgeholt werden. Regressionstests rufen den tatsächlichen Proxy mit `NextRequest` und gemockter Speichergrenze auf.

## Prüfergebnis dieser Umsetzung

- `npm test`: 144 Tests in 28 Dateien bestanden, einschließlich Themenverteilung, Entwürfen/Freigaben, Speicherfehlern, Proxy-Status, JSON-LD, relativen Markdown-Links und IndexNow mit gemocktem Transport.
- `npx tsc --noEmit`, `npm run lint`, `git diff --check`: bestanden.
- Reguläres `npm run build` ohne Produktionsumgebung: am Google-Fonts-Download gescheitert. Turbopack mit Offline-Mocks scheitert außerdem am Sandbox-Portverbot.
- `bash scripts/verify-seo-build.sh`: vollständiger Webpack-Produktionsbuild mit isolierten Testdaten bestanden. Die dabei aufgedeckten synchronen `searchParams` in vier Auth-Seiten wurden minimal auf das Next.js-16-Promise-API umgestellt und durch Rendering-Regressionstests abgesichert.
- Erzeugtes HTML von Startseite, Blogindex und Testartikel geprüft: Artikel-, Themen- und Autorenlinks serverseitig vorhanden; JSON-LD mit den gespeicherten Veröffentlichungs-/Änderungsdaten; generische Fehlerseite ohne Startseiten-Canonical.
- Direkter HTTP-Test über einen lokalen Server nicht ausführbar (`listen EPERM`). Proxy-Tests prüfen die echten Response-Objekte für Browser, Googlebot und OAI-SearchBot mit gemockter Datengrenze.

Keine produktive Datenbank wurde gelesen oder verändert; Anwendungs-Live-Systeme und externe IndexNow-Endpunkte wurden für diese Prüfungen nicht verwendet. Die Test-Build-Artefakte wurden anschließend entfernt.

## Zweite Runde: Flottenstandard und Conversion (05.11.2026)

Die Änderungen aus Runde eins bleiben erhalten. Zusätzlich:

- `ArticleCta.tsx` und `lib/seo-autopilot/source.ts` ordnen Artikel anhand Titel, Slug und Tags einer öffentlichen Hilfslinien-Berechnung, Analyse-Methodik oder kostenlosen Tagebuch-Erfassung zu. Ein CTA folgt dem ersten Absatz, ein zweiter dem Artikeltext. Header-Links zu Registrierung/Login übernehmen ebenfalls `from`.
- `/werkzeuge/temperatur-hilfslinie` nutzt die vorhandene Funktion `calculateCoverLine`. Beispiel, Methodik und Ergebnis des ausdrücklich fiktiven Beispiels stehen bereits im Server-HTML. Eigene Berechnungen laufen mit JavaScript ausschließlich im Browser; Temperaturwerte werden weder gespeichert noch an den Server gesendet. Ohne JavaScript bleibt das Rechenbeispiel lesbar.
- Für zugeordneten Produktcontent mit Autorenprofil gibt es drei unterschiedliche Linkquellen: Themenhub, Autorenprofil und Werkzeugseite. Dies ist mit gerendertem HTML getestet. Themenfremde Bestandsartikel werden nicht automatisch als Produktwissen ausgegeben. Für diese bleiben C1 und ein wirklich kontextueller F1 offen, bis die Redaktion über Überarbeitung, Zusammenführung oder Rücknahme entscheidet.
- Die Blogübersicht hat serverseitige Seitennavigation mit zwölf Artikeln pro Seite, eigenen Canonicals und Sitemap-Einträgen. Ungültige Seitennummern liefern 404, `?page=1` leitet 308 auf den Index. Die Speicherabfrage liest in 500er-Seiten weiter, statt am Supabase-Standardlimit aufzuhören.
- `robots.txt` nennt die neun geforderten Such-/KI-Crawler zusätzlich zum Wildcard-Zugang ausdrücklich; Renderingressourcen bleiben frei.
- Das Root-Layout liefert `Organization` und `WebSite` auf allen Seiten. `/ueber-uns` verwendet ausschließlich vorhandene Betreiber- und Autorenangaben. Sitemap und llms.txt führen die neuen Seiten auf; die öffentliche Widerrufsfunktion hat einen eigenen Canonical.
- Die Veröffentlichungsprüfung verlangt strukturell eine Kurzantwort mit zwei bis drei Sätzen sowie verlinkte Quellen bei Zahlen mit Einheiten. Hinweise stehen als `contentIssues` in der Entwurfsantwort. Das ist keine automatische fachliche Quellenprüfung. Bestandsartikel werden dadurch nicht verändert oder als geprüft erklärt.

### Herkunft und Ereignisse

Es wird kein Attribution-Cookie mehr gesetzt oder ausgelesen. Der bisherige POST-Endpunkt antwortet 410; DELETE bleibt zum Entfernen alter Cookies verfügbar. `BlogAttributionTracker` sendet keine Requests mehr. Die vorhandene allgemeine, einwilligungsabhängige Browserstatistik entfernt `from` aus URLs und Referrern vor Speicherung bzw. Übertragung.

`from` akzeptiert ausschließlich einen einzelnen Slug mit höchstens 200 Zeichen. Die Registrierungsseite liest ihn serverseitig und übergibt ihn als verborgenes Formularfeld. Die Serveraktion speichert ihn in den vorhandenen Auth-Kontometadaten unter `seo_from`. Login und OAuth-Callback übernehmen ihn ebenfalls serverseitig; ein vorhandener Herkunftswert wird beibehalten. OAuth erhält ihn über `redirectTo`, nicht über zusätzlichen Browser-Speicher. Die Callback-URL inklusive Query muss im Auth-System zulässig sein.

- Signup: `signup:<userId>`; leere Identitäten eines obfuskierten Supabase-Duplikats zählen nicht.
- OAuth: neue Google-Konten anhand Erstellungs-/erstem Anmeldezeitpunkt; dieselbe Signup-ID verhindert Doppelzählung. Rückkehrende alte Konten zählen nicht als Signup.
- Checkout: Kontometadatum → Stripe `seo_slug`; Ereignis `checkout_started` mit `checkout:<sessionId>`.
- Kauf: nur bezahlte Live-Checkout-Sessions des passenden Produkts, EUR und mit tatsächlichem Betrag. `purchase:<sessionId>` dedupliziert auch die zwei möglichen bezahlten Stripe-Ereignistypen. Bei Wiederholung kann die Messung erneut gesendet werden, ohne die Bestätigungsmail zu wiederholen. Der Zeitpunkt stammt aus dem Stripe-Ereignis.

Alle Meldungen gehen nach der Serverantwort via `after()` an den festen Endpoint `https://www.seoautopilot.cloud/api/conversions/track`. HMAC-SHA256 signiert exakt `${timestamp}.${rawBody}`; der Fetch bricht nach 2,5 Sekunden ab. Fehlendes Secret, Netzwerkfehler und abgelehnte Antworten blockieren weder Konto noch Kauf. Keine garantierte Zustellwarteschlange: Bei einem Ausfall wird protokolliert; der Signup-/Checkout-Pfad wird nicht für Analytics zurückgerollt.

Bekannte Admin-E-Mail, Admin-Rollen, Testmarkierungen, erkennbare Testadressen und konfigurierte Ausschlussadressen zählen nicht. Stripe-Testmodus meldet weder Checkout noch Kauf. Im Kauf-Callback wird zusätzlich das Konto serverseitig geprüft; bei Fehlern dieser Prüfung wird keine Conversion gesendet. Es werden keine Namen, E-Mail-Adressen oder Gesundheitsmesswerte in Conversion-Meldungen übertragen. Idempotenzschlüssel mit Konto-/Checkout-ID sind pseudonyme Kennungen und nicht automatisch anonym.

### Vor Aktivierung durch den Inhaber

- `SEO_AUTOPILOT_SITE_ID=16802323-34a0-4eaa-9836-61f53596c916` und Site-Secret prüfen. Der Sender nutzt `SEO_AUTOPILOT_SECRET`, alternativ `SEO_AUTOPILOT_WEBHOOK_SECRET`. Keine dieser Variablen darf öffentlich sein. Optional: `SEO_AUTOPILOT_EXCLUDED_EMAILS` als kommagetrennte Liste echter Testkonten ergänzen.
- Auth-Redirect-Allowlist für `/auth/callback?from=…` prüfen. Bestehende Supabase-, Stripe- und IndexNow-Konfiguration bleibt erforderlich. `SEO_AUTOPILOT_APP_URL` verändert den Conversion-Endpunkt nicht mehr; der Flottenstandard schreibt den festen Endpoint vor.
- Für die neue Herkunftsverarbeitung: Interessenabwägung, tatsächlichen Empfänger/AVV und Löschfristen im Redaktionssystem bestätigen und Datenschutzabschnitt 9a darauf abstimmen. Cookie-Verzicht allein beantwortet die DSGVO-Rechtsgrundlage nicht. Grundlage der Abgrenzung: [DSK-Orientierungshilfe](https://www.datenschutzkonferenz-online.de/media/oh/20221130_OH_Telemedien_2021_Version_1_1.pdf) und [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html).
- Autorenbiografien, Betreiber-/Infrastrukturangaben und bestehende Artikelzahlen/-quellen tatsächlich verifizieren. Es wurden dafür keine neuen Behauptungen oder Qualifikationen erfunden. C1, D4, E2 und F1 sind für den kompletten Bestandsinhalt noch nicht abschließend belegbar.
- Neue Anwendungsmigrationen sind für diese Runde nicht erforderlich. Die Entwurfsmigration aus Runde eins bleibt vorbereitet und **unausgeführt**; vor Aktivierung des Veröffentlichungs-Gates muss sie durch den Inhaber im regulären Prozess angewendet werden.
- Keine zusätzlichen Slug-Weiterleitungen wurden erfunden. Bestehende 308-Regeln bleiben bestehen; neu ist die Normalisierung der ersten Blogseite.

### Lokale Prüfungen Runde zwei

- `npm test`: 188 Tests in 32 Testdateien bestanden.
- `npx tsc --noEmit`, `npm run lint`, `git diff --check`: bestanden.
- `bash scripts/verify-seo-build.sh`: vollständiger Webpack-Produktionsbuild mit ausschließlich lokalen Artikel-, Auth-Konfigurations- und Font-Fixtures. Reguläre Produktionsdaten wurden nicht gelesen.
- Erzeugtes HTML von Startseite, Impressum, Datenschutz, Über-uns und Testartikel: Titel, Description, H1 sowie Organization/WebSite vorhanden; Testartikel enthält zwei attribuierte Werkzeug-CTAs, BlogPosting und BreadcrumbList. Generierte robots.txt nennt alle neun Bots ausdrücklich und sperrt /_next nicht.
- Lokaler Serverstart mit den Fixtures: `listen EPERM 127.0.0.1:4317`; daher keine vollständige Browser-/HTTP-Laufzeitprüfung. Direkte Proxy-, Route- und Server-HTML-Tests bestehen.
- Die Test-Build-Artefakte wurden nach der Prüfung entfernt und dürfen nicht veröffentlicht werden. Die Änderungen sind weder committed noch gepusht oder deployed.

## Korrekturrunde nach unabhängigem Review (05.11.2026)

Diese Hinweise ersetzen abweichende Aussagen der vorherigen Prüfrunden:

- **Befund 1:** `deploy-hostinger.sh` führt vor dem App-Wechsel zwingend `migrate-seo-drafts.sh` aus. Auf dem Deploy-Host muss `psql` installiert sein. In `shared/.env.seo-migrations` (Modus 0600, außerhalb des Repos) muss `SEO_AUTOPILOT_DATABASE_URL` auf dieselbe Blog-PostgreSQL-Datenbank zeigen, die die App per Supabase verwendet. Die Verbindung benötigt DDL-/Grant-Rechte. Diese Zugangsdaten gehören nicht in die App-Umgebung. Die bestehende Datei `20261105000000_seo_editorial_drafts.sql` wird transaktional mit Fehlerabbruch angewendet; Spalten und Rechte von `service_role` werden geprüft. Anschließend prüft der neue App-Container den REST-Tabellenzugriff mit seinen tatsächlichen Laufzeit-Zugangsdaten. Bei Fehlern bleibt die bisherige App aktiv. **In dieser Korrekturrunde wurde keine Migration ausgeführt.**
- **Befund 2:** Der Proxy fragt weder Blogtabellen noch Profile ab und schreibt keine Kontometadaten. Er leitet Bloganfragen an den Route-Handler `api/seo-autopilot/blog-response` weiter. Dieser prüft benötigte Inhalte und puffert die vollständige HTML-/RSC-Antwort vor der Auslieferung. Die eigentliche Next-Seite wird intern über `127.0.0.1:$PORT` mit einer kurzlebigen, pfadgebundenen Signatur gerendert. Das setzt den vorhandenen selbst gehosteten Node-/Standalone-Betrieb voraus. Der vorhandene SEO-Signierschlüssel oder serverseitige Supabase-Service-Schlüssel wird verwendet; keine neue öffentliche Variable ist nötig. Nexts `_rsc`-Cache-Schlüssel wird an den vollständigen internen RSC-Abruf angepasst.
- Bei fehlgeschlagenen Speicherzugriffen ohne nutzbaren Cache liefern Blog-, Themen-, Autoren-, Sitemap- und llms.txt-Antworten 503, `Retry-After: 60` und `Cache-Control: no-store`. Nur ergänzende Artikelmodule auf sonstigen Seiten dürfen leer bleiben. `app/sitemap.ts` wurde durch den expliziten XML-Route-Handler `app/sitemap.xml/route.ts` und die gemeinsame Eintragsfunktion `lib/seo-autopilot/sitemap.ts` ersetzt. Der Onboarding-/Einwilligungsschutz liegt in der Dashboard-Servervorlage; der Proxy überschreibt den dafür verwendeten Pfadheader. Die Herkunftsübernahme bereits angemeldeter Nutzer erfolgt im Server-Handler `/auth/source`.
- **Befund 3:** Der historische Kauf-Schlüssel bleibt `stripe:purchase:<sessionId>`. Eine Stripe-Wiederholung verwendet damit auch für vor dem Deploy gezählte Käufe dieselbe ID. Der Regressionstest simuliert einen Empfänger, der diese ID bereits kennt.
- **Vertrag:** `tests/fixtures/autopilot-publish-real.json` enthält unverändert die ersten zwei gelieferten Original-Payloads. `seo-publish-contract.test.ts` durchläuft mit echter HMAC-Prüfung, Validierung und Speicherfunktionen den Webhook; nur die Supabase-Transportgrenze wird ersetzt. Beide Payloads werden mit 202 in der privaten Entwurfstabelle akzeptiert. Das bestehende redaktionelle Freigabe-Gate bleibt aktiv. Beliebige Schemaformen einschließlich `null` oder fehlendem Schema führen nicht zur Ablehnung; öffentliche strukturierte Daten werden lokal aufgebaut.
- Login- und Callback-Ziele aus Parametern verwenden dieselbe Prüfung auf interne Pfade, einschließlich Abwehr von Backslashes und Steuerzeichen. Rechtstextänderungen außerhalb des Conversion-Abschnitts wurden auf HEAD zurückgesetzt, insbesondere Rechtsstand, Cookie-Tabelle und Widerrufs-Metadaten.

### Prüfung dieser Runde

- `npm test`: 227 Tests in 36 Dateien bestanden, einschließlich Original-Payloads, historischer Kauf-ID, Speicherfehlern, Response-Grenzen, Redirects und Deploy-Abbruch bei simuliertem SQL-Fehler.
- `npx tsc --noEmit`, `npm run lint` und `git diff --check`: bestanden.
- `SEO_FIXTURE_OUTAGE=1 bash scripts/verify-seo-build.sh`: Webpack-Produktionsbuild mit simulierter nicht erreichbarer Blog-DB und ausschließlich lokalen Font-/Konfigurations-Fixtures bestanden. Der bereinigte Build-Prozess kann keine Produktionsdaten abfragen. Dieser Testbuild darf nicht deployt werden.
- Ein echter Listener bleibt durch die Sandbox gesperrt (`listen EPERM`). Die kompilierten Next-Route-Handler wurden zusätzlich mit lokalen Request-/Response-Objekten ohne Listener aufgerufen: Blogindex, Artikel, Thema und Autor liefern mit lokalen Daten 200, fehlende Artikel 404, kanonische Ziele 308; vollständige RSC-Navigation liefert 200. Ohne Speicher und Cache liefern alle sechs Inhalts-/Discovery-Routen sowie RSC 503 mit Retry-After und no-store. Der Proxy-Rewrite als echte Netzwerkstrecke konnte wegen der Sandbox nicht geprüft werden. Vor Aktivierung sind ein HTTP-/Browser-Smoke-Test in Staging und die Migration samt Laufzeit-Zugriffsprüfung im autorisierten Deploy-Ablauf erforderlich.

Keine Commits, Pushes, Deployments, produktiven Datenzugriffe oder tatsächlich ausgeführten Migrationen.
