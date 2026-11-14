import { renderSocialImage } from '@/lib/social-image'

export const alt = 'Basaltemperatur – Zyklustagebuch mit Temperaturkurve'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return renderSocialImage(size)
}
