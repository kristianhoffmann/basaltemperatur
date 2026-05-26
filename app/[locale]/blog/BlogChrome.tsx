import Link from 'next/link'

export function BlogHeader({ locale }: { locale: string }) {
  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-400 to-violet-500 text-sm font-bold text-white shadow-lg shadow-rose-500/15">
            BT
          </span>
          <span className="font-bold tracking-tight">Basaltemperatur</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#features" className="transition-colors hover:text-slate-950">Features</Link>
          <Link href="/#pricing" className="transition-colors hover:text-slate-950">Preis</Link>
          <Link href={`/${locale}/blog`} className="text-rose-500 transition-colors hover:text-rose-600">Blog</Link>
          <Link href="/login" className="transition-colors hover:text-slate-950">Anmelden</Link>
        </nav>
        <Link
          href="/registrieren"
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Kostenlos starten
        </Link>
      </div>
    </header>
  )
}

export function BlogFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-slate-600 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-bold text-slate-950">Basaltemperatur</p>
          <p className="mt-2 max-w-sm leading-6">
            Zyklustracking mit Temperaturkurve, Auswertung und klarer Privatsphaere.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-950">Produkt</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/#features" className="hover:text-rose-500">Features</Link></li>
            <li><Link href="/#pricing" className="hover:text-rose-500">Preis</Link></li>
            <li><Link href="/blog" className="hover:text-rose-500">Blog</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-950">Rechtliches</p>
          <ul className="mt-3 space-y-2">
            <li><Link href="/impressum" className="hover:text-rose-500">Impressum</Link></li>
            <li><Link href="/datenschutz" className="hover:text-rose-500">Datenschutz</Link></li>
            <li><Link href="/agb" className="hover:text-rose-500">AGB</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
