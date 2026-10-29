import React, { useState } from 'react'
import { Eyebrow, Range, Chips } from './primitives.jsx'

// Slide 7 — "The bottom-up floor": $/hr ÷ (tokens/s × 3,600 s) × 1M
const TPS_MIN = 20, TPS_MAX = 6000
const tpsAt = (pos) => TPS_MIN * Math.pow(TPS_MAX / TPS_MIN, pos / 1000)
const posOf = (tps) => Math.round((1000 * Math.log(tps / TPS_MIN)) / Math.log(TPS_MAX / TPS_MIN))
const tidy = (tps) => (tps < 100 ? Math.round(tps) : Math.round(tps / 10) * 10)

const NODES = [
  { label: '8× H100 · $32', value: 32 },
  { label: '8× H100 · $36', value: 36 },
  { label: '8× H100 · $50', value: 50 },
  { label: '8× B200 · $80', value: 80 },
]
const LOADS = [
  { label: 'Unbatched · ~24', value: 24 },
  { label: 'Light batch · ~1,200', value: 1180 },
  { label: 'Well batched · ~5,000', value: 5000 },
]

// market price bands, $ per 1M output tokens (slide 7)
const BANDS = [
  { label: 'Open-weight hosts', lo: 0.04, hi: 0.9, color: 'var(--green)' },
  { label: 'Frontier APIs', lo: 10, hi: 50, color: 'var(--navy)' },
]
const LMIN = -2, LMAX = 3 // log10 axis: $0.01 … $1,000
const W = 460, H = 112, PX = 10
const lx = (v) => PX + ((Math.log10(v) - LMIN) / (LMAX - LMIN)) * (W - 2 * PX)

const money = (v) => (v >= 100 ? '$' + Math.round(v).toLocaleString() : '$' + v.toFixed(2))

export const SIZE = { w: 920, h: 420 }

export default function CostFloor() {
  const [hourly, setHourly] = useState(36)
  const [tps, setTps] = useState(5000)
  const cost = (hourly / (tps * 3600)) * 1e6

  let verdict
  if (cost <= 0.9) verdict = <>Inside the <b style={{ color: 'var(--green)' }}>open-weight</b> price band — cost-plus hosting works at this setup.</>
  else if (cost < 10) verdict = <>Frontier list prices ($10–50) sit <b style={{ color: 'var(--navy)' }}>{Math.round(10 / cost)}–{Math.round(50 / cost)}×</b> above this floor: that gap is training, R&amp;D and margin.</>
  else verdict = <>At this setup the hardware alone costs as much as a frontier API. <b style={{ color: 'var(--navy)' }}>Batching</b> is what makes serving pay.</>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 44, height: '100%', alignItems: 'center', padding: '0 6px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        <div>
          <Eyebrow>Node rental · $ per hour</Eyebrow>
          <div className="de-big" style={{ fontSize: 36, margin: '4px 0 10px' }}>${hourly}<span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 600 }}>/hr</span></div>
          <Range value={hourly} min={20} max={80} onChange={setHourly} />
          <div style={{ marginTop: 10 }}><Chips options={NODES} active={NODES.find((n) => n.value === hourly)?.label} onPick={(o) => setHourly(o.value)} /></div>
        </div>
        <div>
          <Eyebrow>Throughput · output tokens per second</Eyebrow>
          <div className="de-big" style={{ fontSize: 36, margin: '4px 0 10px' }}>{tidy(tps).toLocaleString()}<span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 600 }}> tok/s</span></div>
          <Range value={posOf(tps)} min={0} max={1000} onChange={(p) => setTps(tidy(tpsAt(p)))} />
          <div style={{ marginTop: 10 }}><Chips options={LOADS} active={LOADS.find((l) => l.value === tps)?.label} onPick={(o) => setTps(o.value)} /></div>
        </div>
        <div className="de-note" style={{ fontSize: 12 }}>
          Unbatched, a 70B model is memory-starved at ~24 tok/s. Continuous batching (64–512 requests) reaches ~5,000 on one node.
        </div>
      </div>

      <div>
        <Eyebrow>Hardware floor · per 1M output tokens</Eyebrow>
        <div className="de-big" style={{ fontSize: 76, color: 'var(--blue)', margin: '6px 0 4px' }}>{money(cost)}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
          ${hourly}/hr ÷ ({tidy(tps).toLocaleString()} tok/s × 3,600 s) × 1M
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, marginTop: 18, overflow: 'visible' }}>
          {BANDS.map((b) => (
            <g key={b.label}>
              <rect x={lx(b.lo)} y={26} width={lx(b.hi) - lx(b.lo)} height={22} rx={4} fill={b.color} opacity={0.88} />
              <text x={(lx(b.lo) + lx(b.hi)) / 2} y={18} textAnchor="middle" fontSize="11" fontWeight="700" fill={b.color}>{b.label}</text>
            </g>
          ))}
          <line x1={PX} x2={W - PX} y1={60} y2={60} stroke="var(--line-strong)" />
          {[0.01, 0.1, 1, 10, 100, 1000].map((v) => (
            <g key={v}>
              <line x1={lx(v)} x2={lx(v)} y1={56} y2={64} stroke="var(--line-strong)" />
              <text x={lx(v)} y={78} textAnchor="middle" fontSize="11" fill="var(--faint)">{v < 1 ? '$' + v : '$' + v.toLocaleString()}</text>
            </g>
          ))}
          {cost >= 0.01 && cost <= 1000 && (
            <g style={{ transition: 'transform 0.3s' }}>
              <line x1={lx(cost)} x2={lx(cost)} y1={22} y2={60} stroke="var(--blue)" strokeWidth="2.5" />
              <path d={`M${lx(cost) - 7},${90} L${lx(cost) + 7},${90} L${lx(cost)},${81} Z`} fill="var(--blue)" />
              <text x={lx(cost)} y={106} textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--blue)">your floor</text>
            </g>
          )}
        </svg>
        <div style={{ fontSize: 14, color: 'var(--body)', marginTop: 10, lineHeight: 1.45 }}>{verdict}</div>
      </div>
    </div>
  )
}
