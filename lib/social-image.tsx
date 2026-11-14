import { ImageResponse } from 'next/og'

// One design for the Open Graph and the Twitter card image ("Kurvenblatt").
// Satori rule that broke /twitter-image before: every element with more than one
// child needs an explicit `display: flex`.

const INK = '#221A24'
const PAPER = '#FAF7F2'
const ROSE = '#B4455C'
const MUTED = '#716877'

const TEMPS = [36.5, 36.45, 36.4, 36.42, 36.36, 36.4, 36.34, 36.38, 36.42, 36.36, 36.4, 36.62, 36.74, 36.8, 36.77, 36.83, 36.79, 36.85]

export function renderSocialImage(size: { width: number; height: number }) {
  const chartWidth = 470
  const chartHeight = 300
  const x = (index: number) => 20 + (index * (chartWidth - 40)) / (TEMPS.length - 1)
  const y = (temp: number) => 20 + ((36.95 - temp) / 0.7) * (chartHeight - 40)
  const points = TEMPS.map((temp, index) => `${x(index).toFixed(1)},${y(temp).toFixed(1)}`).join(' ')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background: PAPER,
          color: INK,
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', width: 560 }}>
          <div style={{ display: 'flex', fontSize: 26, color: ROSE, fontFamily: 'sans-serif', fontWeight: 600 }}>
            Basaltemperatur · Zyklustagebuch
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22, fontSize: 68, lineHeight: 1.05, letterSpacing: -1.5 }}>
            <span>Eintragen.</span>
            <span>Kurve sehen.</span>
            <span>Mehr nicht.</span>
          </div>
          <div style={{ display: 'flex', marginTop: 30, fontSize: 27, color: MUTED, fontFamily: 'sans-serif' }}>
            Kostenlos eintragen · Analyse 9,99 € · kein Abo
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            width: chartWidth,
            height: chartHeight,
            background: '#FFFFFF',
            border: '2px solid #E7E0D6',
            borderRadius: 24,
          }}
        >
          <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <line x1="20" x2={chartWidth - 20} y1={y(36.42)} y2={y(36.42)} stroke="#946016" strokeWidth="3" strokeDasharray="10 8" />
            <polyline points={points} fill="none" stroke={ROSE} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            {TEMPS.map((temp, index) => (
              <circle key={index} cx={x(index)} cy={y(temp)} r="6" fill="#FFFFFF" stroke={ROSE} strokeWidth="3.5" />
            ))}
          </svg>
        </div>
      </div>
    ),
    size,
  )
}
