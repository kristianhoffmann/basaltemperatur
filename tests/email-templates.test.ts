import { existsSync, readFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const templates = [
  'confirm_signup.html',
  'change_email.html',
  'invite_user.html',
  'magic_link.html',
  'reset_password.html',
].map((name) => resolve(process.cwd(), 'supabase/templates', name))
const configPath = resolve(process.cwd(), 'supabase/config.toml')

describe('Basaltemperatur email templates', () => {
  it('versions all five active Supabase Auth templates', () => {
    for (const template of templates) {
      expect(existsSync(template), `missing ${basename(template)}`).toBe(true)
    }
  })

  it.each(templates)('uses the shared accessible brand contract in %s', (template) => {
    const html = readFileSync(template, 'utf8')

    expect(html).toContain('role="presentation"')
    expect(html).toContain('email-hero-auth-universal.png')
    expect(html).toContain('<meta name="color-scheme" content="light dark">')
    expect(html).toContain('@media (prefers-color-scheme: dark)')
    expect(html).toContain('#E8788A')
    expect(html).toContain('#7B61FF')
    expect(html).toContain('min-height:44px')
    expect(html).toContain('Warum du diese E-Mail erhältst')
    expect(html).toContain('{{ .ConfirmationURL }}')
    expect(html).toContain('https://www.basaltemperatur.online/support')
    expect(html).toContain('https://www.basaltemperatur.online/datenschutz')
    expect(html).toContain('https://www.basaltemperatur.online/impressum')
  })

  it('maps every active Auth event to its versioned template', () => {
    const config = readFileSync(configPath, 'utf8')

    expect(config).toContain('[auth.email.template.invite]')
    expect(config).toContain('content_path = "./supabase/templates/invite_user.html"')
    expect(config).toContain('[auth.email.template.email_change]')
    expect(config).toContain('content_path = "./supabase/templates/change_email.html"')
  })
})
