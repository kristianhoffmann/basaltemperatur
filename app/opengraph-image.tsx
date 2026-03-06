import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Basaltemperatur App'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 64px',
          background:
            'linear-gradient(135deg, #0F1029 0%, #1A0F2E 45%, #0D1B2A 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div style={{ fontSize: 30, opacity: 0.95 }}>Basaltemperatur</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 66, fontWeight: 800, lineHeight: 1.06 }}>
            Zyklus verstehen.
          </div>
          <div style={{ fontSize: 34, opacity: 0.88 }}>
            Temperatur und Periode tracken.
          </div>
          <div style={{ fontSize: 26, opacity: 0.74 }}>
            Kostenlos eintragen. Analyse einmalig 9,99 EUR.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
