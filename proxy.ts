// proxy.ts
// Auth Proxy - Schützt Routen und managed Sessions
//
// Geschützte Routen: /dashboard/*, /einstellungen/*
// Öffentliche Routen: /, /login, /registrieren, /demo/*, /impressum, etc.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isConfiguredAdminEmail } from '@/lib/adminAccess'
import { normalizeFrom } from '@/lib/seo-autopilot/source'
import { isBlogRender } from '@/lib/seo-autopilot/blog-response'
import { getSeoSiteUrl } from '@/lib/seo-site-url'
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

  const target = new URL(`/${DEFAULT_BLOG_LOCALE}/blog${rest}`, getSeoSiteUrl())
  target.search = request.nextUrl.search
  return NextResponse.redirect(target, 308)
}

export async function proxy(request: NextRequest) {
  const unknownLocaleRedirect = redirectUnknownBlogLocale(request)
  if (unknownLocaleRedirect) return unknownLocaleRedirect

  const pathname = request.nextUrl.pathname
  if (/^\/(?:de\/)?blog(?:\/|$)/.test(pathname)) {
    const path = `${pathname}${request.nextUrl.search}`
    if (isBlogRender(path, request.headers)) return NextResponse.next({ request })
    const target = request.nextUrl.clone()
    target.pathname = '/api/seo-autopilot/blog-response'
    const headers = new Headers(request.headers)
    headers.set('x-seo-public-path', path)
    headers.delete('x-seo-render')
    return NextResponse.rewrite(target, { request: { headers } })
  }

  if (!/^\/(?:dashboard|kalender|einstellungen|statistiken|zyklen|export|eintrag|onboarding|erfolg|anleitung|admin|login|registrieren|passwort-vergessen|passwort-aendern|auth)(?:\/|$)/.test(pathname)) {
    return NextResponse.next({ request })
  }

  try {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-app-path', pathname)
    let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

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
            const refreshedHeaders = new Headers(request.headers)
            refreshedHeaders.set('x-app-path', pathname)
            supabaseResponse = NextResponse.next({ request: { headers: refreshedHeaders } })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // IMPORTANT: getUser() statt getSession() – sicherer, validiert JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError && (authError.status ?? 500) >= 500) throw authError

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
      const from = normalizeFrom(request.nextUrl.searchParams.get('from'))
      if (from && !normalizeFrom(user.user_metadata?.seo_from)) {
        const target = request.nextUrl.clone()
        target.pathname = '/auth/source'
        target.search = ''
        target.searchParams.set('from', from)
        return NextResponse.rewrite(target, { request })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
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
  } catch {
    return new NextResponse('Anmeldung vorübergehend nicht verfügbar. Bitte später erneut versuchen.', {
      status: 503, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }
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
