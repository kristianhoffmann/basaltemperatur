// middleware.ts
// Auth Middleware - Schützt Routen und managed Sessions
//
// Geschützte Routen: /dashboard/*, /einstellungen/*
// Öffentliche Routen: /, /login, /registrieren, /demo/*, /impressum, etc.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value, options }) =>
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
    '/kunden',
    '/projekte',
    '/angebote',
    '/rechnungen',
    '/kalender',
    '/vorlagen',
    '/einstellungen',
    '/statistiken',
    '/zyklen',
    '/export',
    '/eintrag',
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
  // ADMIN ROUTEN
  // ============================================
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Prüfen ob Admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminUser) {
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
