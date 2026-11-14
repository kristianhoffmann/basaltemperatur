import { SiteFooter, SiteHeader, type SiteSection } from '@/components/layout/SiteChrome'

// The guide shares the public site chrome. `locale` stays in the signature because
// every caller already passes it; there is only the German guide today.
export function BlogHeader({ from, current = 'guide' }: { locale: string; from?: string; current?: SiteSection }) {
  return (
    <>
      <meta name="seo-content-ready" content="true" />
      <SiteHeader current={current} from={from} />
    </>
  )
}

export function BlogFooter() {
  return <SiteFooter />
}
