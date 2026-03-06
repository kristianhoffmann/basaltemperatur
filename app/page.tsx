// app/page.tsx
// Landing Page – Basaltemperatur App – 2026 Premium Dark Hero Design

import type { Metadata } from 'next'
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
  Star,
  Quote,
  Lock,
  Zap,
  FileDown,
} from 'lucide-react'

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.basaltemperatur.online').replace(/\/$/, '')

export const metadata: Metadata = {
  title: 'Basaltemperatur App: Zyklus tracken, Eisprung erkennen',
  description: 'Basaltemperatur App für natürliches Zyklustracking: Temperatur und Periode kostenlos eintragen, komplette Analyse einmalig für 9,99 € freischalten.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Basaltemperatur App: Zyklus tracken, Eisprung erkennen',
    description: 'Temperatur & Periode kostenlos eintragen. Analyse, Prognosen und Export einmalig für 9,99 € freischalten.',
    url: '/',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Basaltemperatur App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Basaltemperatur App',
    description: 'Zyklustracking mit Basaltemperatur, Periodenkalender und Analyse.',
    images: ['/twitter-image'],
  },
}

const features = [
  {
    icon: Thermometer,
    title: 'Temperatur erfassen',
    description: 'Trage täglich deine Basaltemperatur ein – schnell und unkompliziert.',
    tier: 'Kostenlos',
    accent: 'from-rose-400 to-pink-500',
    iconBg: 'bg-rose-400/10',
    iconColor: 'text-rose-500',
  },
  {
    icon: CalendarHeart,
    title: 'Periode markieren',
    description: 'Markiere deine Periodentage. Sie werden farblich hervorgehoben.',
    tier: 'Kostenlos',
    accent: 'from-pink-400 to-rose-500',
    iconBg: 'bg-pink-400/10',
    iconColor: 'text-pink-500',
  },
  {
    icon: TrendingUp,
    title: 'Analyse-Dashboard',
    description: 'Temperaturkurve, Trends und Zyklus-KPIs auf einen Blick.',
    tier: 'Premium Analyse',
    accent: 'from-blue-400 to-indigo-500',
    iconBg: 'bg-blue-400/10',
    iconColor: 'text-blue-500',
  },
  {
    icon: Sparkles,
    title: 'Prognosen & Eisprung',
    description: 'Eisprung-, Fruchtbarkeits- und Periodenprognosen basierend auf deinem Verlauf.',
    tier: 'Premium Analyse',
    accent: 'from-violet-400 to-purple-500',
    iconBg: 'bg-violet-400/10',
    iconColor: 'text-violet-500',
  },
  {
    icon: Heart,
    title: 'Statistiken & Vergleich',
    description: 'Analysiere Zyklusverläufe über mehrere Monate und vergleiche Zyklen.',
    tier: 'Premium Analyse',
    accent: 'from-amber-400 to-orange-500',
    iconBg: 'bg-amber-400/10',
    iconColor: 'text-amber-500',
  },
  {
    icon: FileDown,
    title: 'PDF-Export',
    description: 'Exportiere deine Kurve als PDF für Arztgespräche und Dokumentation.',
    tier: 'Premium Analyse',
    accent: 'from-emerald-400 to-teal-500',
    iconBg: 'bg-emerald-400/10',
    iconColor: 'text-emerald-500',
  },
]

const lifetimeFeatures = [
  'Analyse-Dashboard mit Zyklus-KPIs',
  'Temperaturkurve mit Mustererkennung',
  'Eisprung-, Fruchtbarkeits- und Periodenprognosen',
  'Zyklusstatistiken und Verlaufstrends',
  'Zyklusvergleich mehrerer Zyklen',
  'PDF-Export für den Frauenarzt',
  'Web-App + iOS Analyse',
  'Alle zukünftigen Updates',
  'Kein Abo – einmalig zahlen',
]

const testimonials = [
  {
    name: 'Sarah M.',
    location: 'München',
    text: 'Endlich eine App, die einfach nur funktioniert – ohne Werbung, ohne Abo, ohne Schnickschnack. Mein Eisprung wird zuverlässig erkannt.',
    rating: 5,
  },
  {
    name: 'Laura K.',
    location: 'Hamburg',
    text: 'Die PDF-Export-Funktion ist Gold wert! Mein Frauenarzt war begeistert von der übersichtlichen Temperaturkurve. Klare Empfehlung.',
    rating: 5,
  },
  {
    name: 'Anna W.',
    location: 'Berlin',
    text: 'Als Datenschutz-bewusste Person war mir wichtig, dass meine Gesundheitsdaten in Deutschland bleiben. Hier habe ich ein gutes Gefühl.',
    rating: 5,
  },
]

const faqItems = [
  {
    question: 'Ist Basaltemperatur kostenlos?',
    answer:
      'Ja. Das Eintragen von Temperatur und Periodentagen ist kostenlos. Die komplette Analyse kann einmalig für 9,99 € freigeschaltet werden.',
  },
  {
    question: 'Ist Basaltemperatur ein Abo?',
    answer:
      'Nein. Es gibt kein Abonnement. Der Analyse-Zugang ist eine einmalige Zahlung.',
  },
  {
    question: 'Sind meine Daten sicher?',
    answer:
      'Die App ist DSGVO-konform aufgebaut. Gesundheitsdaten werden ausschließlich zur Bereitstellung der Funktionen verarbeitet.',
  },
  {
    question: 'Kann ich Basaltemperatur auf iOS und Web nutzen?',
    answer:
      'Ja. Du kannst deine Daten auf Web und iOS nutzen und die Analyse plattformübergreifend verwenden.',
  },
]

export default function LandingPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Basaltemperatur',
        url: siteUrl,
      },
      {
        '@type': 'WebSite',
        name: 'Basaltemperatur',
        url: siteUrl,
        inLanguage: 'de-DE',
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Basaltemperatur',
        applicationCategory: 'HealthApplication',
        operatingSystem: 'Web, iOS',
        inLanguage: 'de-DE',
        description:
          'Zyklustracking mit Basaltemperatur, Periodentagen, Prognosen und Auswertungen.',
        offers: {
          '@type': 'Offer',
          price: '9.99',
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* ═══════════════════════════════════════════════════
          HERO — Dark Gradient with Floating Orbs
          ═══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1029 0%, #1A0F2E 45%, #0D1B2A 100%)' }}>

        {/* Animated gradient orbs */}
        <div className="orb orb-rose w-[500px] h-[500px] -top-32 -right-32 opacity-50" />
        <div className="orb orb-violet w-[400px] h-[400px] top-1/3 -left-48 opacity-40" />
        <div className="orb orb-teal w-[350px] h-[350px] bottom-0 right-1/4 opacity-30" />

        {/* Navigation */}
        <nav className="relative z-20 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-rose-400 to-violet-500 shadow-lg shadow-rose-500/20">
                <span className="text-white text-sm">🌡️</span>
              </div>
              <span className="font-bold text-white text-sm tracking-tight">Basaltemperatur</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Features</a>
              <a href="#faq" className="text-sm text-white/50 hover:text-white transition-colors">FAQ</a>
              <a href="#testimonials" className="text-sm text-white/50 hover:text-white transition-colors">Erfahrungen</a>
              <a href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors">Preis</a>
              <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">Anmelden</Link>
              <Link href="/registrieren">
                <button className="btn btn-sm text-white border border-white/15 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">Kostenlos starten</button>
              </Link>
            </div>
            <div className="md:hidden flex items-center gap-3">
              <Link href="/login" className="text-sm text-white/60">Anmelden</Link>
              <Link href="/registrieren">
                <button className="btn btn-sm text-white border border-white/15 bg-white/5">Kostenlos starten</button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 px-4 py-1.5 text-sm text-white/80 font-medium mb-8 animate-fade-in">
            <Heart className="h-4 w-4 text-rose-400" />
            Natürliches Zyklustracking
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-[-0.04em] leading-[1.05] animate-fade-in animate-stagger-1">
            Verstehe deinen Zyklus.
            <br />
            <span className="text-gradient-hero">Natürlich.</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 sm:mt-8 text-base sm:text-lg lg:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed animate-fade-in animate-stagger-2">
            Trage kostenlos deine Einträge ein und schalte bei Bedarf die komplette
            Zyklusanalyse frei – einfach, sicher und privat.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in animate-stagger-3">
            <Link href="/registrieren">
              <button className="btn btn-glow btn-xl animate-glow">
                Kostenlos starten
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <a href="#features">
              <button className="btn btn-lg text-white/70 border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
                Mehr erfahren
              </button>
            </a>
          </div>

          <p className="mt-5 text-sm text-white/35 animate-fade-in animate-stagger-4">
            Einträge kostenlos · Analyse einmalig 9,99 € · Kein Abo
          </p>

          {/* Floating Glass Chart Preview */}
          <div className="mt-16 sm:mt-20 max-w-3xl mx-auto animate-slide-up animate-stagger-5 animate-float">
            <div className="glass-dark p-6 sm:p-8 rounded-[28px]">
              <svg viewBox="0 0 800 260" className="w-full" aria-label="Beispiel Temperaturkurve">
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8788A" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#E8788A" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#E8788A" />
                    <stop offset="100%" stopColor="#7B61FF" />
                  </linearGradient>
                </defs>

                {/* Period background */}
                <rect x="40" y="15" width="100" height="220" rx="14" fill="rgba(232,93,117,0.08)" />
                <text x="90" y="250" textAnchor="middle" fill="#E85D75" fontSize="11" fontWeight="600">Periode</text>

                {/* Grid lines */}
                {[37.2, 37.0, 36.8, 36.6, 36.4].map((v, i) => (
                  <g key={v}>
                    <text x="18" y={28 + i * 50} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="10">{v.toFixed(1)}</text>
                    <line x1="38" y1={28 + i * 50} x2="780" y2={28 + i * 50} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  </g>
                ))}

                {/* Cover line */}
                <line x1="38" y1="168" x2="780" y2="168" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
                <text x="785" y="168" fill="#F59E0B" fontSize="10" fontWeight="600" dominantBaseline="middle" opacity="0.6">Cover</text>

                {/* Area fill */}
                <path
                  d="M60,200 L100,192 L140,188 L180,200 L220,196 L260,183 L300,188 L340,183 L380,178 L420,168 L460,78 L500,68 L540,63 L580,73 L620,68 L660,78 L700,73 L740,70 L740,235 L60,235 Z"
                  fill="url(#heroGrad)"
                />

                {/* Temperature line */}
                <polyline
                  points="60,200 100,192 140,188 180,200 220,196 260,183 300,188 340,183 380,178 420,168 460,78 500,68 540,63 580,73 620,68 660,78 700,73 740,70"
                  fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(232, 120, 138, 0.4))' }}
                />

                {/* Data points */}
                {[[60, 200], [100, 192], [140, 188], [180, 200], [220, 196], [260, 183], [300, 188], [340, 183], [380, 178], [420, 168], [460, 78], [500, 68], [540, 63], [580, 73], [620, 68], [660, 78], [700, 73], [740, 70]].map(([cx, cy]) => (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="#0F1029" stroke="url(#lineGrad)" strokeWidth="2" />
                ))}

                {/* Ovulation marker */}
                <circle cx="420" cy="168" r="10" fill="rgba(123,97,255,0.2)" stroke="#7B61FF" strokeWidth="2" />
                <circle cx="420" cy="168" r="4" fill="#7B61FF" />
                <text x="420" y="152" textAnchor="middle" fill="#7B61FF" fontSize="11" fontWeight="700">Eisprung</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom fade into white */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F5F6FA] to-transparent z-10" />
      </section>

      {/* ═══════════════════════════════════════════════════
          TRUST BADGES
          ═══════════════════════════════════════════════════ */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Lock, label: 'DSGVO-konform', sublabel: 'Daten in Deutschland', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { icon: Shield, label: 'Made in Germany', sublabel: 'Entwickelt in Hannover', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Zap, label: 'Kein Abo', sublabel: 'Einmalig 9,99 €', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            ].map((badge, i) => (
              <div
                key={badge.label}
                className={`card card-hover flex flex-col items-center text-center p-4 sm:p-6 animate-fade-in animate-stagger-${i + 1}`}
              >
                <div className={`p-3 rounded-2xl ${badge.bg} ${badge.color} mb-3`}>
                  <badge.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-[var(--text)]">{badge.label}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{badge.sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURES
          ═══════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text)] tracking-[-0.04em]">Alles für deinen Zyklus</h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">Kostenlos eintragen. Analyse bei Bedarf freischalten.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className={`card card-hover group animate-fade-in animate-stagger-${i + 1}`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg ${f.iconBg} ${f.iconColor}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <span className={`inline-flex text-[10px] font-semibold px-2 py-1 rounded-full mb-3 ${
                  f.tier === 'Kostenlos'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {f.tier}
                </span>
                <h3 className="text-lg font-bold mb-2 text-[var(--text)] tracking-tight">{f.title}</h3>
                <p className="leading-relaxed text-sm text-[var(--text-secondary)]">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-[-0.04em]">So einfach geht&apos;s</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: '1', title: 'Registrieren', desc: 'Erstelle in Sekunden deinen Account.' },
              { step: '2', title: 'Temperatur eintragen', desc: 'Miss morgens deine Basaltemperatur und trage sie ein.' },
              { step: '3', title: 'Zyklus verstehen', desc: 'Deine Kurve zeigt dir Eisprung, Periode und Muster.' },
            ].map((item, i) => (
              <div key={item.step} className={`text-center animate-fade-in animate-stagger-${i + 1}`}>
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-3xl bg-gradient-to-br from-rose-400 to-violet-500 text-white text-2xl font-bold mb-6 shadow-lg shadow-rose-500/20">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2 text-[var(--text)] tracking-tight">{item.title}</h3>
                <p className="text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════════════ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-[-0.04em]">Häufige Fragen</h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">Kurz und transparent beantwortet.</p>
          </div>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div key={item.question} className={`card animate-fade-in animate-stagger-${i + 1}`}>
                <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TESTIMONIALS — Dark Section
          ═══════════════════════════════════════════════════ */}
      <section id="testimonials" className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F1029 0%, #1A0F2E 100%)' }}>
        <div className="orb orb-rose w-[350px] h-[350px] -top-20 -right-20 opacity-30" />
        <div className="orb orb-violet w-[250px] h-[250px] bottom-0 left-0 opacity-20" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-[-0.04em]">Das sagen unsere Nutzerinnen</h2>
            <p className="mt-4 text-lg text-white/50">Echte Erfahrungen von echten Frauen.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <div key={t.name} className={`glass-dark p-6 group animate-fade-in animate-stagger-${i + 1}`}>
                <Quote className="h-8 w-8 text-white/8 mb-4" />
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/90">{t.name}</p>
                    <p className="text-xs text-white/40">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PRICING — Shimmer Border
          ═══════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg)]">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] tracking-[-0.04em]">Ein Preis. Für immer.</h2>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">Einträge bleiben kostenlos. Kein Abo. Keine versteckten Kosten.</p>
          </div>

          <div className="shimmer-border rounded-[24px]">
            <div className="card card-lg relative overflow-visible" style={{ margin: '2px', borderRadius: '22px' }}>
              {/* Lifetime badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-violet-500 px-5 py-1.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25">
                  <Sparkles className="h-4 w-4" />
                  Lifetime
                </span>
              </div>

              <div className="text-center pt-4">
                <h3 className="text-xl font-bold text-[var(--text)]">Vollzugang</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-6xl font-extrabold text-[var(--text)] tracking-[-0.04em]">9,99</span>
                  <span className="text-2xl text-[var(--text-muted)]">€</span>
                </div>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Einmalige Zahlung · Kein Abo</p>
              </div>

              <ul className="mt-8 space-y-3.5">
                {lifetimeFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-[var(--text-secondary)] text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link href="/registrieren" className="block">
                  <button className="btn btn-glow w-full btn-lg">
                    Jetzt freischalten
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA — Gradient Banner
          ═══════════════════════════════════════════════════ */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg)]">
        <div className="max-w-4xl mx-auto text-center rounded-[28px] p-12 sm:p-16 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, var(--rose) 0%, var(--violet) 100%)',
        }}>
          {/* Decorative orb inside */}
          <div className="absolute -top-20 -right-20 w-[200px] h-[200px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[200px] h-[200px] rounded-full bg-white/5 blur-3xl" />

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-[-0.04em] relative z-10">
            Bereit, deinen Zyklus zu verstehen?
          </h2>
          <p className="mt-4 text-lg text-white/70 relative z-10">
            Starte jetzt und behalte deine Basaltemperatur im Blick.
          </p>
          <div className="mt-8 relative z-10">
            <Link href="/registrieren">
              <button className="btn btn-xl bg-white text-[var(--rose-vibrant)] font-extrabold hover:bg-white/90 active:scale-[0.97] transition-all shadow-xl shadow-black/10">
                Jetzt registrieren
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════ */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[var(--bg-secondary)] border-t border-[var(--card-border)]">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-rose-400 to-violet-500 shadow-md">
                  <span className="text-white text-[11px]">🌡️</span>
                </div>
                <span className="font-bold text-sm text-[var(--text)]">Basaltemperatur</span>
              </div>
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Dein Zyklustracker – einfach, sicher und privat.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm text-[var(--text)]">Produkt</h4>
              <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
                <li><a href="#features" className="hover:text-[var(--rose)] transition-colors">Features</a></li>
                <li><a href="#faq" className="hover:text-[var(--rose)] transition-colors">FAQ</a></li>
                <li><a href="#pricing" className="hover:text-[var(--rose)] transition-colors">Preis</a></li>
                <li><a href="#testimonials" className="hover:text-[var(--rose)] transition-colors">Erfahrungen</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm text-[var(--text)]">Rechtliches</h4>
              <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
                <li><Link href="/impressum" className="hover:text-[var(--rose)] transition-colors">Impressum</Link></li>
                <li><Link href="/datenschutz" className="hover:text-[var(--rose)] transition-colors">Datenschutz</Link></li>
                <li><Link href="/agb" className="hover:text-[var(--rose)] transition-colors">AGB</Link></li>
                <li><Link href="/widerruf" className="hover:text-[var(--rose)] transition-colors">Widerruf</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm text-[var(--text)]">Kontakt</h4>
              <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
                <li>
                  <a href="mailto:info@kristianhoffmann.de" className="hover:text-[var(--rose)] transition-colors">
                    info@kristianhoffmann.de
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-[var(--card-border)] text-center text-sm text-[var(--text-muted)]">
            <p>© {new Date().getFullYear()} Basaltemperatur. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
