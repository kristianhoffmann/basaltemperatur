# App Store Review Checklist

Stand: 2026-05-18

## App Review Notes

- Basaltemperatur ist ein persönliches Zyklustagebuch mit rückblickender Temperaturauswertung und statistischen Prognosen.
- Die App ist kein Medizinprodukt, kein Verhütungsmittel, kein Diagnosewerkzeug und keine Behandlungsempfehlung.
- Prognosen zu fruchtbaren Tagen und Periodenbeginn werden erst angezeigt, wenn mindestens 3 abgeschlossene Zyklen und genügend auswertbare Temperaturwerte vorhanden sind.
- Die Verarbeitung sensibler Zyklusdaten erfordert eine ausdrückliche Einwilligung. Diese kann in den Einstellungen widerrufen werden.
- Premium-Funktionen: Prognosen, Statistiken, Zyklusvergleich und PDF-Export.

## App Store Connect

- Privacy Policy URL: `https://www.basaltemperatur.online/datenschutz`
- Support URL: `https://www.basaltemperatur.online/support`
- App Store Server Notifications V2 URL: `https://www.basaltemperatur.online/api/app-store/notifications`
- Medical Device Status: als nicht reguliertes Medizinprodukt deklarieren, sofern keine neuen medizinischen Claims ergänzt werden.
- Reviewer Notes: Testkonto, IAP-Testprodukt, Hinweis auf Consent-Gate und Premium-Freischaltung ergänzen.

## Privacy

- `ios/Basaltemperatur/PrivacyInfo.xcprivacy` muss im iOS-Target enthalten sein.
- App Privacy Details in App Store Connect müssen mindestens Gesundheitsdaten, E-Mail, Name, User-ID, Produktinteraktion, Kaufhistorie und ungefähren Standort abdecken.
- Tracking ist im Privacy Manifest deaktiviert; keine Tracking-Domains eintragen, solange keine cross-app/site Tracking-Nutzung ergänzt wird.

## Vor jedem Release prüfen

- Keine Claims wie sichere Verhütung, Diagnose, Therapie, garantierter Eisprung oder medizinische Genauigkeit.
- App-Store-Screenshots zeigen Hinweischarakter und keine medizinischen Versprechen.
- In-App-Kauf im Sandbox-Account testen.
- Refund/Revocation-Notification im App Store Connect Sandbox-Modus testen.
- Account-Löschung und Consent-Widerruf auf iOS und Web testen.
