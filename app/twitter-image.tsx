import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Basaltemperatur App'
export const size = {
  width: 1200,
  height: 600,
}
export const contentType = 'image/png'

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '46px 58px',
          background:
            'linear-gradient(120deg, #0F1029 0%, #1A0F2E 45%, #0D1B2A 100%)',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 28, opacity: 0.95 }}>Basaltemperatur</div>
          <div style={{ fontSize: 58, fontWeight: 800, lineHeight: 1.04 }}>
            Natürliches
            <br />
            Zyklustracking
          </div>
          <div style={{ fontSize: 24, opacity: 0.78 }}>
            Eintraege kostenlos, Analyse einmalig 9,99 EUR
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
