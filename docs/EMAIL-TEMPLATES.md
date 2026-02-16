# E-Mail-Templates für Supabase Auth

> **⚠️ ANPASSEN ERFORDERLICH!**
> 
> Ersetze `Handwerker-CRM` mit `{{APP_NAME}}` und passe die Farben an:
> - Primärfarbe: `#1b4d89` → `{{PRIMARY_COLOR}}`
> - Akzentfarbe: `#f9e45b` → `{{ACCENT_COLOR}}`
> - Hintergrund: `#e8f5f2` → `{{BACKGROUND_COLOR}}`
> - Domain: `handwerker-crm.de` → `{{APP_DOMAIN}}`

---

> **Supabase Dashboard → Authentication → Email Templates**
> 
> Kopiere den HTML-Code für jedes Template in das entsprechende Feld.

---

## Design-Variablen

Die Templates verwenden das Handwerker-CRM Farbschema:
- **Primär:** #1b4d89 (Dunkelblau)
- **Akzent:** #f9e45b (Gelb)
- **Erfolg:** #6db784 (Grün)
- **Hintergrund:** #e8f5f2 (Mint)

---

## 1. Confirm Sign Up (Registrierung bestätigen)

**Subject:** Bestätige deine E-Mail-Adresse | Handwerker-CRM

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Mail bestätigen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #e8f5f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d89 0%, #2a5a9a 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Handwerker-CRM</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Vom Anruf zur Rechnung in 3 Klicks</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1b4d89; font-size: 22px; font-weight: 600;">Willkommen bei Handwerker-CRM! 🎉</h2>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Vielen Dank für deine Registrierung! Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.
              </p>
              
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="background-color: #1b4d89; border-radius: 12px;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      E-Mail-Adresse bestätigen →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Dieser Link ist <strong>24 Stunden</strong> gültig. Falls du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.
              </p>
              
              <!-- Divider -->
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Falls der Button nicht funktioniert, kopiere diesen Link in deinen Browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #1b4d89; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2025 Handwerker-CRM | 
                <a href="https://handwerker-crm.de/datenschutz" style="color: #1b4d89; text-decoration: none;">Datenschutz</a> | 
                <a href="https://handwerker-crm.de/impressum" style="color: #1b4d89; text-decoration: none;">Impressum</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 2. Invite User (Nutzer einladen)

**Subject:** Du wurdest zu Handwerker-CRM eingeladen

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Einladung</title>
</head>
<body style="margin: 0; padding: 0; background-color: #e8f5f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d89 0%, #2a5a9a 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Handwerker-CRM</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Vom Anruf zur Rechnung in 3 Klicks</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1b4d89; font-size: 22px; font-weight: 600;">Du wurdest eingeladen! 🎉</h2>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Du wurdest eingeladen, Handwerker-CRM zu nutzen – die einfachste Lösung für Kundenverwaltung, Angebote und Rechnungen.
              </p>
              
              <!-- Features Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2; border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">✓ Kunden & Projekte verwalten</p>
                    <p style="margin: 0 0 12px 0; color: #374151; font-size: 14px;">✓ Professionelle Angebote & Rechnungen</p>
                    <p style="margin: 0; color: #374151; font-size: 14px;">✓ 100% DSGVO-konform</p>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="background-color: #f9e45b; border-radius: 12px;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #1b4d89; text-decoration: none; font-size: 16px; font-weight: 700;">
                      Einladung annehmen →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Dieser Link ist <strong>24 Stunden</strong> gültig.
              </p>
              
              <!-- Divider -->
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #1b4d89; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2025 Handwerker-CRM | 
                <a href="https://handwerker-crm.de/datenschutz" style="color: #1b4d89; text-decoration: none;">Datenschutz</a> | 
                <a href="https://handwerker-crm.de/impressum" style="color: #1b4d89; text-decoration: none;">Impressum</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 3. Magic Link (Login per E-Mail)

**Subject:** Dein Login-Link für Handwerker-CRM

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Magic Link</title>
</head>
<body style="margin: 0; padding: 0; background-color: #e8f5f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d89 0%, #2a5a9a 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Handwerker-CRM</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1b4d89; font-size: 22px; font-weight: 600;">Dein Login-Link 🔐</h2>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Klicke auf den Button unten, um dich bei Handwerker-CRM anzumelden. Du benötigst kein Passwort.
              </p>
              
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="background-color: #1b4d89; border-radius: 12px;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Jetzt anmelden →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <strong>⚠️ Sicherheitshinweis:</strong> Dieser Link ist nur <strong>1 Stunde</strong> gültig und kann nur einmal verwendet werden.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Falls du diese E-Mail nicht angefordert hast, kannst du sie ignorieren. Dein Konto ist sicher.
              </p>
              
              <!-- Divider -->
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Falls der Button nicht funktioniert:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #1b4d89; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2025 Handwerker-CRM | 
                <a href="https://handwerker-crm.de/datenschutz" style="color: #1b4d89; text-decoration: none;">Datenschutz</a> | 
                <a href="https://handwerker-crm.de/impressum" style="color: #1b4d89; text-decoration: none;">Impressum</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 4. Change Email Address (E-Mail ändern)

**Subject:** Bestätige deine neue E-Mail-Adresse | Handwerker-CRM

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Mail ändern</title>
</head>
<body style="margin: 0; padding: 0; background-color: #e8f5f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d89 0%, #2a5a9a 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Handwerker-CRM</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1b4d89; font-size: 22px; font-weight: 600;">E-Mail-Adresse ändern ✉️</h2>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Du hast eine Änderung deiner E-Mail-Adresse angefordert. Bitte bestätige deine neue E-Mail-Adresse, indem du auf den Button klickst.
              </p>
              
              <!-- Info Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2; border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #374151; font-size: 14px;">
                      <strong>Neue E-Mail-Adresse:</strong><br>
                      {{ .Email }}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="background-color: #1b4d89; border-radius: 12px;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Neue E-Mail bestätigen →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      <strong>⚠️ Nicht angefordert?</strong> Falls du diese Änderung nicht angefordert hast, ignoriere diese E-Mail. Deine aktuelle E-Mail-Adresse bleibt aktiv.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Dieser Link ist 24 Stunden gültig.<br>
                <a href="{{ .ConfirmationURL }}" style="color: #1b4d89; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2025 Handwerker-CRM | 
                <a href="https://handwerker-crm.de/datenschutz" style="color: #1b4d89; text-decoration: none;">Datenschutz</a> | 
                <a href="https://handwerker-crm.de/impressum" style="color: #1b4d89; text-decoration: none;">Impressum</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 5. Reset Password (Passwort zurücksetzen)

**Subject:** Passwort zurücksetzen | Handwerker-CRM

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Passwort zurücksetzen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #e8f5f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d89 0%, #2a5a9a 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Handwerker-CRM</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1b4d89; font-size: 22px; font-weight: 600;">Passwort zurücksetzen 🔑</h2>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort zu wählen.
              </p>
              
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="background-color: #1b4d89; border-radius: 12px;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Neues Passwort wählen →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Warning Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      <strong>⏰ Zeitlimit:</strong> Dieser Link ist nur <strong>1 Stunde</strong> gültig.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Not Requested Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px;">
                      <strong>⚠️ Nicht angefordert?</strong> Falls du kein neues Passwort angefordert hast, ignoriere diese E-Mail. Dein aktuelles Passwort bleibt aktiv und dein Konto ist sicher.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Falls der Button nicht funktioniert:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #1b4d89; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2025 Handwerker-CRM | 
                <a href="https://handwerker-crm.de/datenschutz" style="color: #1b4d89; text-decoration: none;">Datenschutz</a> | 
                <a href="https://handwerker-crm.de/impressum" style="color: #1b4d89; text-decoration: none;">Impressum</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 6. Reauthentication (Erneute Authentifizierung)

**Subject:** Bestätige deine Identität | Handwerker-CRM

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Identität bestätigen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #e8f5f2; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1b4d89 0%, #2a5a9a 100%); padding: 32px 40px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Handwerker-CRM</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #1b4d89; font-size: 22px; font-weight: 600;">Identität bestätigen 🔐</h2>
              
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Du versuchst, eine sensible Aktion durchzuführen. Aus Sicherheitsgründen bitten wir dich, deine Identität zu bestätigen.
              </p>
              
              <!-- Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 32px 0;">
                <tr>
                  <td align="center" style="background-color: #1b4d89; border-radius: 12px;">
                    <a href="{{ .ConfirmationURL }}" target="_blank" style="display: inline-block; padding: 16px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                      Identität bestätigen →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Security Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #e8f5f2; border-radius: 12px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">🛡️ Warum diese E-Mail?</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Bei sensiblen Aktionen wie dem Ändern deines Passworts oder dem Löschen deines Kontos bestätigen wir deine Identität per E-Mail.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Dieser Link ist nur <strong>10 Minuten</strong> gültig. Falls du diese Aktion nicht durchführen möchtest, ignoriere diese E-Mail.
              </p>
              
              <!-- Divider -->
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
              
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Falls der Button nicht funktioniert:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #1b4d89; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                © 2025 Handwerker-CRM | 
                <a href="https://handwerker-crm.de/datenschutz" style="color: #1b4d89; text-decoration: none;">Datenschutz</a> | 
                <a href="https://handwerker-crm.de/impressum" style="color: #1b4d89; text-decoration: none;">Impressum</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Supabase-Variablen

Diese Variablen werden von Supabase automatisch ersetzt:

| Variable | Beschreibung |
|----------|--------------|
| `{{ .ConfirmationURL }}` | Der Bestätigungs-/Action-Link |
| `{{ .Email }}` | Die E-Mail-Adresse des Nutzers |
| `{{ .Token }}` | Der Bestätigungs-Token (falls benötigt) |
| `{{ .TokenHash }}` | Hash des Tokens |
| `{{ .SiteURL }}` | Die konfigurierte Site URL |

---

## Checkliste

Nach dem Einfügen der Templates:

- [ ] **Confirm sign up** – HTML eingefügt, Subject angepasst
- [ ] **Invite user** – HTML eingefügt, Subject angepasst
- [ ] **Magic link** – HTML eingefügt, Subject angepasst
- [ ] **Change email address** – HTML eingefügt, Subject angepasst
- [ ] **Reset password** – HTML eingefügt, Subject angepasst
- [ ] **Reauthentication** – HTML eingefügt, Subject angepasst
- [ ] SMTP Settings konfiguriert (Reiter "SMTP Settings")
- [ ] Test-E-Mail gesendet und Design geprüft
