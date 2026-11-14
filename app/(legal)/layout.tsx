import { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '@/components/layout/SiteChrome';

// ============================================================================
// LEGAL LAYOUT
// Shared chrome for Impressum, Datenschutz, AGB, Widerruf, Support.
// The footer carries "Vertrag widerrufen" on every page (§ 356a BGB).
// ============================================================================

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <SiteHeader current="legal" />

      <main id="inhalt" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article
          className="
            rounded-2xl border border-[var(--card-border)]
            bg-white p-6 sm:p-10
            text-[var(--text-secondary)] leading-relaxed
            [&_h1]:font-display [&_h1]:text-4xl [&_h1]:text-[var(--text)] [&_h1]:mb-6 sm:[&_h1]:text-5xl
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-[var(--text)] [&_h2]:mt-10 [&_h2]:mb-3
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-[var(--text)] [&_h3]:mt-6 [&_h3]:mb-2
            [&_p]:my-3
            [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-1.5
            [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-rose-300
            [&_a]:text-rose-700 hover:[&_a]:text-rose-800
            [&_hr]:my-8 [&_hr]:border-[var(--card-border)]
            [&_strong]:font-semibold [&_strong]:text-[var(--text)]
          "
        >
          {children}
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
