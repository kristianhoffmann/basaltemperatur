// proxy.ts
// Auth Proxy - Schützt Routen und managed Sessions
//
// Geschützte Routen: /dashboard/*, /einstellungen/*
// Öffentliche Routen: /, /login, /registrieren, /demo/*, /impressum, etc.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isConfiguredAdminEmail } from '@/lib/adminAccess'
import { BLOG_LOCALES, isBlogLocale } from '@/lib/blog-locales'

const DEFAULT_BLOG_LOCALE = BLOG_LOCALES[0]

// /<irgendwas>/blog... hat frueher 200 geliefert — beliebig viele indexierbare,
// praktisch leere Seiten mit Selbst-Canonical. notFound() in der Page reicht nicht:
// Next.js streamt, der Status steht beim ersten Flush fest und bleibt auf 200.
// Der Proxy laeuft davor und kann noch sauber umleiten.
function redirectUnknownBlogLocale(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/([^/]+)\/blog(\/.*)?$/)
  if (!match) return null

  const [, locale, rest = ''] = match
  if (isBlogLocale(locale)) return null

  const target = new URL(`/${DEFAULT_BLOG_LOCALE}/blog${rest}`, request.url)
  target.search = request.nextUrl.search
  return NextResponse.redirect(target, 308)
}

export async function proxy(request: NextRequest) {
  const unknownLocaleRedirect = redirectUnknownBlogLocale(request)
  if (unknownLocaleRedirect) return unknownLocaleRedirect

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() statt getSession() – sicherer, validiert JWT
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ============================================
  // GESCHÜTZTE ROUTEN (Login erforderlich)
  // ============================================
  const protectedRoutes = [
    '/dashboard',
    '/kalender',
    '/einstellungen',
    '/statistiken',
    '/zyklen',
    '/export',
    '/eintrag',
    '/onboarding',
    '/erfolg',
    '/anleitung',
  ]

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ============================================
  // AUTH-ROUTEN (Redirect wenn eingeloggt)
  // ============================================
  const authRoutes = ['/login', '/registrieren', '/passwort-vergessen']

  const isAuthRoute = authRoutes.some(route => pathname === route)

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ============================================
  // ONBOARDING-GATING
  // ============================================
  if (isProtectedRoute && user && pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, sensitive_data_consent_at')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.onboarding_completed || !profile?.sensitive_data_consent_at) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // ============================================
  // ADMIN ROUTEN
  // ============================================
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (!isConfiguredAdminEmail(user.email)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match alle Pfade außer:
     * - _next/static (statische Dateien)
     * - _next/image (Bild-Optimierung)
     * - favicon.ico (Favicon)
     * - Öffentliche Dateien (.svg, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
