import { useEffect, useRef, useState } from 'react'

function getZone(score) {
  if (score < 0.3) return { label: 'Норма', color: '#22c55e' }
  if (score < 0.7) return { label: 'Внимание', color: '#eab308' }
  return { label: 'Высокий риск', color: '#ef4444' }
}

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

function arcPath(cx, cy, r, fromDeg, toDeg) {
  const s = polar(cx, cy, r, fromDeg)
  const e = polar(cx, cy, r, toDeg)
  const span = Math.abs(fromDeg - toDeg)
  const large = span > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

export default function StressGauge({ score = 0, size = 240, showLabel = true }) {
  const [anim, setAnim] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const from = anim, to = score, t0 = performance.now(), dur = 1200
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1)
      setAnim(from + (to - from) * (1 - Math.pow(1 - p, 3)))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [score])

  const padL = 44, padR = 44, padT = 20, padB = 62
  const r = (size - padL - padR) / 2
  const cx = padL + r
  const cy = padT + r
  const sw = Math.max(14, r * 0.18)

  const vw = size
  const vh = padT + r + padB

  const needleAngle = 180 - anim * 180
  const nLen = r * 0.82
  const nTip = polar(cx, cy, nLen, needleAngle)
  const zone = getZone(score)
  const pct = Math.round(score * 100)

  const segments = [
    { a1: 180, a2: 126, color: '#22c55e' },
    { a1: 126, a2: 54, color: '#eab308' },
    { a1: 54, a2: 0, color: '#ef4444' },
  ]

  const ticks = []
  for (let i = 0; i <= 10; i++) {
    const deg = 180 - i * 18
    const major = i % 5 === 0
    const p1 = polar(cx, cy, r + sw / 2 + 1, deg)
    const p2 = polar(cx, cy, r + sw / 2 + (major ? 10 : 6), deg)
    ticks.push(
      <line key={`t${i}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={major ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
        strokeWidth={major ? 1.5 : 0.8} />
    )
    if (major) {
      const lp = polar(cx, cy, r + sw / 2 + 22, deg)
      ticks.push(
        <text key={`l${i}`} x={lp.x} y={lp.y + 4} textAnchor="middle"
          fill="rgba(255,255,255,0.4)" fontSize={12} fontWeight="600" fontFamily="Space Grotesk">
          {i * 10}
        </text>
      )
    }
  }

  const uid = `g${size}`

  const activeSegIdx = score < 0.3 ? 0 : score < 0.7 ? 1 : 2

  return (
    <div className="flex flex-col items-center">
      <svg width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`}>
        <defs>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={zone.color} floodOpacity="0.5" />
          </filter>
        </defs>

        {segments.map((seg, i) => (
          <path key={i} d={arcPath(cx, cy, r, seg.a1, seg.a2)} fill="none"
            stroke={seg.color} strokeWidth={sw} strokeOpacity={i === activeSegIdx ? 0.7 : 0.3}
            strokeLinecap={i === 0 || i === 2 ? 'round' : 'butt'}
            style={i === activeSegIdx ? { animation: 'gaugePulse 2s ease-in-out infinite' } : {}} />
        ))}

        {ticks}

        <line x1={cx} y1={cy} x2={nTip.x} y2={nTip.y}
          stroke={zone.color} strokeWidth={2.5} strokeLinecap="round" filter={`url(#${uid}-glow)`} />

        <circle cx={cx} cy={cy} r={6} fill={zone.color} />
        <circle cx={cx} cy={cy} r={2.5} fill="white" opacity={0.9} />

        <text x={cx} y={cy + 30} textAnchor="middle"
          fill="white" fontSize={Math.max(26, r * 0.32)} fontWeight="800" fontFamily="Space Grotesk">
          {pct}
        </text>
        <text x={cx} y={cy + 48} textAnchor="middle"
          fill="rgba(255,255,255,0.25)" fontSize={11} fontFamily="Inter">
          из 100
        </text>
      </svg>

      {showLabel && (
        <div className="-mt-2 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: zone.color }} />
          <span className="text-sm font-semibold" style={{ color: zone.color }}>{zone.label}</span>
        </div>
      )}
    </div>
  )
}
