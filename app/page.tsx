// app/page.tsx
// Landing Page – Basaltemperatur App

import Link from 'next/link'
import {
  CheckCircle,
  ArrowRight,
  Thermometer,
  CalendarHeart,
  TrendingUp,
  Shield,
  Heart,
  Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: Thermometer,
    title: 'Temperatur erfassen',
    description: 'Trage täglich deine Basaltemperatur ein – schnell und unkompliziert.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
  },
  {
    icon: TrendingUp,
    title: 'Temperaturkurve',
    description: 'Deine Temperaturwerte als übersichtliche Kurve. Muster auf einen Blick.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10',
  },
  {
    icon: CalendarHeart,
    title: 'Periode markieren',
    description: 'Markiere deine Periodentage. Sie werden farblich hervorgehoben.',
    color: 'text-period-400',
    bg: 'bg-period-400/10',
  },
  {
    icon: Sparkles,
    title: 'Eisprung erkennen',
    description: 'Basierend auf der 3-über-6-Regel wird dein Eisprung automatisch erkannt.',
    color: 'text-violet-400',
    bg: 'bg-violet-400/10',
  },
  {
    icon: Shield,
    title: 'Daten in Deutschland',
    description: 'Deine Gesundheitsdaten werden DSGVO-konform in Deutschland gespeichert.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: Heart,
    title: 'Für Kinderwunsch & NFP',
    description: 'Ideal für natürliche Familienplanung. Verstehe deinen Körper besser.',
    color: 'text-gold-400',
    bg: 'bg-gold-400/10',
  },
]

const lifetimeFeatures = [
  'Unbegrenzte Temperatureinträge',
  'Temperaturkurve mit Periodenansicht',
  'Automatische Eisprung-Erkennung',
  'Zyklushistorie & Statistiken',
  'Datensicherung in der Cloud',
  'Web-App + iOS-App',
  'Alle zukünftigen Updates',
  'Kein Abo – einmalig zahlen',
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-400 to-rose-500">
                <span className="text-white text-xs">🌡️</span>
              </div>
              <span className="font-semibold text-sm text-[var(--text)]">
                Basaltemperatur
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-rose-400 transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-rose-400 transition-colors">Preis</a>
              <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-rose-400 transition-colors">Anmelden</Link>
              <Link href="/registrieren">
                <button className="btn-primary btn-sm">Jetzt starten</button>
              </Link>
            </div>
            <div className="md:hidden flex items-center gap-3">
              <Link href="/login" className="text-sm text-[var(--text-secondary)]">Anmelden</Link>
              <Link href="/registrieren">
                <button className="btn-primary btn-sm">Start</button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-rose-400/10 px-4 py-1.5 text-sm text-rose-400 mb-8 animate-fade-in">
            <Heart className="h-4 w-4" />
            Natürliches Zyklustracking
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--text)] tracking-tight leading-tight">
            Verstehe deinen Zyklus.{' '}
            <span className="text-gradient">Natürlich.</span>
          </h1>
          <p className="mt-6 text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Trage deine Basaltemperatur ein, erkenne deinen Eisprung und behalte
            deinen Zyklus im Blick – einfach, sicher und privat.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/registrieren">
              <button className="btn-primary btn-lg">
                Jetzt starten
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <a href="#features">
              <button className="btn-secondary btn-lg">
                Mehr erfahren
              </button>
            </a>
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Einmalig 9,99 € · Kein Abo · Lebenslanger Zugang
          </p>

          {/* Hero Chart */}
          <div className="mt-16 max-w-3xl mx-auto animate-slide-up">
            <div className="chart-container">
              <svg viewBox="0 0 800 280" className="w-full" aria-label="Beispiel Temperaturkurve">
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-rose-400)" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="var(--color-rose-400)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <rect x="40" y="20" width="100" height="220" rx="8" className="chart-period-bg" />
                <text x="90" y="260" textAnchor="middle" fill="var(--color-period-400)" fontSize="11" fontWeight="500">Periode</text>

                {[37.2, 37.0, 36.8, 36.6, 36.4].map((v, i) => (
                  <g key={v}>
                    <text x="15" y={30 + i * 52.5} textAnchor="middle" fill="var(--chart-label)" fontSize="10">{v.toFixed(1)}</text>
                    <line x1="35" y1={30 + i * 52.5} x2="780" y2={30 + i * 52.5} stroke="var(--chart-grid)" strokeWidth="1" />
                  </g>
                ))}

                <line x1="35" y1="175" x2="780" y2="175" className="chart-cover-line" />
                <text x="785" y="175" fill="var(--color-gold-400)" fontSize="10" dominantBaseline="middle">Cover</text>

                <path
                  d="M60,210 L100,200 L140,195 L180,210 L220,205 L260,190 L300,195 L340,190 L380,185 L420,175 L460,80 L500,70 L540,65 L580,75 L620,70 L660,80 L700,75 L740,72 L740,240 L60,240 Z"
                  fill="url(#heroGrad)"
                />
                <polyline
                  points="60,210 100,200 140,195 180,210 220,205 260,190 300,195 340,190 380,185 420,175 460,80 500,70 540,65 580,75 620,70 660,80 700,75 740,72"
                  className="chart-temp-line" strokeLinecap="round" strokeLinejoin="round"
                />

                {[[60, 210], [100, 200], [140, 195], [180, 210], [220, 205], [260, 190], [300, 195], [340, 190], [380, 185], [420, 175], [460, 80], [500, 70], [540, 65], [580, 75], [620, 70], [660, 80], [700, 75], [740, 72]].map(([cx, cy]) => (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" className="chart-temp-dot" />
                ))}

                <circle cx="420" cy="175" r="8" className="chart-ovulation-marker" />
                <text x="420" y="160" textAnchor="middle" fill="var(--color-violet-400)" fontSize="11" fontWeight="600">Eisprung</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">Alles für deinen Zyklus</h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">Einfach. Übersichtlich. Wissenschaftlich fundiert.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card card-hover group">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 transition-transform duration-300 group-hover:scale-110 ${f.bg} ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">{f.title}</h3>
                <p className="leading-relaxed text-sm text-[var(--text-secondary)]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">So einfach geht&apos;s</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '1', title: 'Registrieren', desc: 'Erstelle in Sekunden deinen Account.' },
              { step: '2', title: 'Temperatur eintragen', desc: 'Miss morgens deine Basaltemperatur und trage sie ein.' },
              { step: '3', title: 'Zyklus verstehen', desc: 'Deine Kurve zeigt dir Eisprung, Periode und Muster.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-rose-400/10 text-rose-400 text-xl font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text)]">Ein Preis. Für immer.</h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">Kein Abo. Keine versteckten Kosten.</p>
          </div>

          <div className="card relative border-2 border-rose-400">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-400 px-4 py-1.5 text-sm font-medium text-white">
                <Sparkles className="h-4 w-4" />
                Lifetime
              </span>
            </div>

            <div className="text-center pt-4">
              <h3 className="text-xl font-semibold text-[var(--text)]">Vollzugang</h3>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold text-[var(--text)]">9,99</span>
                <span className="text-xl text-[var(--text-muted)]">€</span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Einmalige Zahlung · Kein Abo</p>
            </div>

            <ul className="mt-8 space-y-3">
              {lifetimeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[var(--text-secondary)]">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Link href="/registrieren" className="block">
                <button className="btn-primary w-full btn-lg">
                  Jetzt freischalten
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center rounded-3xl p-12 bg-gradient-to-br from-rose-500 to-rose-400">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Bereit, deinen Zyklus zu verstehen?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Starte jetzt und behalte deine Basaltemperatur im Blick.
          </p>
          <div className="mt-8">
            <Link href="/registrieren">
              <button className="btn btn-lg bg-white text-rose-500 font-semibold hover:bg-white/90 active:scale-[0.98] transition-all shadow-soft">
                Jetzt registrieren
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br from-rose-400 to-rose-500">
                  <span className="text-white text-[10px]">🌡️</span>
                </div>
                <span className="font-semibold text-sm text-[var(--text)]">Basaltemperatur</span>
              </div>
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Dein Zyklustracker – einfach, sicher und privat.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-[var(--text)]">Produkt</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li><a href="#features" className="hover:text-rose-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-rose-400 transition-colors">Preis</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-[var(--text)]">Rechtliches</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li><Link href="/impressum" className="hover:text-rose-400 transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-rose-400 transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-rose-400 transition-colors">AGB</Link></li>
                <li><Link href="/widerruf" className="hover:text-rose-400 transition-colors">Widerruf</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-[var(--text)]">Kontakt</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li>info@basaltemperatur.online</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[var(--border)] text-center text-sm text-[var(--text-muted)]">
            <p>© {new Date().getFullYear()} Basaltemperatur. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer >
    </div >
  )
}
