import { expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
vi.mock('@/components/forms/LoginForm', () => ({ LoginForm: () => <span>Loginformular</span> }))
vi.mock('@/components/forms/RegisterForm', () => ({ RegisterForm: ({ from }: { from?: string }) => <input type="hidden" name="from" value={from ?? ''} /> }))
vi.mock('@/components/forms/ForgotPasswordForm', () => ({ ForgotPasswordForm: () => <span>Reset anfordern</span> }))
vi.mock('@/components/forms/ResetPasswordForm', () => ({ ResetPasswordForm: () => <span>Neues Passwort</span> }))
vi.mock('@/components/auth/SocialLogin', () => ({ SocialLogin: () => null }))
vi.mock('next/navigation', () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`) } }))
import Login from '@/app/(auth)/login/page'
import Register from '@/app/(auth)/registrieren/page'
import ForgotPassword from '@/app/(auth)/passwort-vergessen/page'
import ResetPassword from '@/app/(auth)/passwort-aendern/page'
it('reads login feedback from asynchronous Next.js searchParams', async () => {
  expect(renderToStaticMarkup(await Login({ searchParams: Promise.resolve({ message: 'email_confirmed' }) }))).toContain('E-Mail bestätigt!')
})
it('reads registration feedback from asynchronous Next.js searchParams', async () => {
  expect(renderToStaticMarkup(await Register({ searchParams: Promise.resolve({ error: 'Lokaler Testfehler' }) }))).toContain('Lokaler Testfehler')
})
it('renders password reset success from asynchronous Next.js searchParams', async () => {
  expect(renderToStaticMarkup(await ForgotPassword({ searchParams: Promise.resolve({ success: 'true' }) }))).toContain('E-Mail gesendet!')
})
it('retains a valid password reset code from asynchronous Next.js searchParams', async () => {
  expect(renderToStaticMarkup(await ResetPassword({ searchParams: Promise.resolve({ code: 'local-test' }) }))).toContain('Neues Passwort')
})

it('passes only a validated server-read source to the signup form and login link', async () => {
  const html = renderToStaticMarkup(await Register({ searchParams: Promise.resolve({ from: 'temperatur-messen' }) }))
  expect(html).toContain('name="from" value="temperatur-messen"')
  expect(html).toContain('href="/login?from=temperatur-messen"')
  const invalid = renderToStaticMarkup(await Register({ searchParams: Promise.resolve({ from: ['a', 'b'] }) }))
  expect(invalid).not.toContain('/login?from=')
})
