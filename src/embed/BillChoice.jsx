import React, { useState } from 'react'
import { Eyebrow, Range, Chips } from './primitives.jsx'
import { num } from './presets.js'

// Slide 36 — spend index = price × volume (2026 = 100), from the deck's planning table.
const YEARS = [2026, 2027, 2028, 2029, 2030]
const PRICE_FIXED = [100, 32.2, 12.4, 5.7, 2.9] // hold capability fixed: 35× cheaper by 2030
const PRICE_FRONTIER = [100, 53.6, 31.7, 20.6, 14.2] // keep buying up-tier: only ~7× cheaper
const VOLUME = [100, 259, 629, 1303, 2379] // ~24× by 2030 (Goldman Sachs Research)
const BASE_GROWTH = VOLUME[4] / 100

// rescale the volume path to a different 2030 multiple, keeping its shape
const volumeFor = (growth) => VOLUME.map((v) => 100 * Math.pow(v / 100, Math.log(growth) / Math.log(BASE_GROWTH)))
const spendPath = (u, vol) => YEARS.map((_, t) => (((1 - u) * PRICE_FIXED[t] + u * PRICE_FRONTIER[t]) * vol[t]) / 100)

const MIXES = [
  { label: 'Hold capability fixed', value: 0 },
  { label: 'Half and half', value: 50 },
  { label: 'Track the frontier', value: 100 },
]

const W = 1000, H = 372, PL = 56, PR = 150, PT = 14, PB = 30

export const SIZE = { w: 1000, h: 550 }

export default function BillChoice({ init = {} }) {
  const [share, setShare] = useState(() => num(init.share, 50, 0, 100)) // % of workloads that move up-tier each year
  const [growth, setGrowth] = useState(() => num(init.growth, 24, 8, 40))
  const vol = volumeFor(growth)
  const fixed = spendPath(0, vol)
  const frontier = spendPath(1, vol)
  const mine = spendPath(share / 100, vol)
  const end = mine[4] / 100
  // share of up-tier workloads at which the 2030 bill equals today's
  const breakEven = Math.min(1, Math.max(0, (10000 / vol[4] - PRICE_FIXED[4]) / (PRICE_FRONTIER[4] - PRICE_FIXED[4])))

  const yMax = Math.max(...frontier, 120) * 1.08
  const x = (t) => PL + (t / 4) * (W - PL - PR)
  const y = (v) => H - PB - (v / yMax) * (H - PT - PB)
  const line = (p) => p.map((v, t) => `${t ? 'L' : 'M'}${x(t)},${y(v)}`).join(' ')
  const ticks = [0, 100, 200, 300, 400, 500, 600, 700, 800].filter((v) => v < yMax)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 34 }}>
        <div>
          <Eyebrow>Workloads moved up-tier as models improve</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '2px 0 8px' }}>
            <span className="de-big" style={{ fontSize: 32 }}>{share}%</span>
            <Chips options={MIXES} active={MIXES.find((m) => m.value === share)?.label} onPick={(m) => setShare(m.value)} />
          </div>
          <Range value={share} min={0} max={100} onChange={setShare} />
        </div>
        <div>
          <Eyebrow>Token volume growth by 2030</Eyebrow>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '2px 0 8px' }}>
            <span className="de-big" style={{ fontSize: 32 }}>{growth}×</span>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{growth === 24 ? 'Goldman Sachs base case' : 'your assumption'}</span>
          </div>
          <Range value={growth} min={8} max={40} onChange={setGrowth} />
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} stroke={v === 100 ? 'var(--muted)' : 'var(--line)'} strokeDasharray={v === 100 ? '5 4' : undefined} />
            <text x={PL - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="var(--faint)">{v}</text>
          </g>
        ))}
        <text x={W - PR + 8} y={y(100) + 4} fontSize="12" fill="var(--muted)">today’s bill</text>
        {YEARS.map((yr, t) => (
          <text key={yr} x={x(t)} y={H - 8} textAnchor="middle" fontSize="12" fill="var(--faint)">{yr}</text>
        ))}
        <path d={line(frontier)} fill="none" stroke="var(--navy)" strokeWidth="2" strokeDasharray="6 5" opacity="0.55" />
        <path d={line(fixed)} fill="none" stroke="var(--teal)" strokeWidth="2" strokeDasharray="6 5" opacity="0.7" />
        <path d={line(mine)} fill="none" stroke="var(--blue)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        {YEARS.map((_, t) => <circle key={t} cx={x(t)} cy={y(mine[t])} r="4" fill="#fff" stroke="var(--blue)" strokeWidth="2.5" />)}
        <text x={x(4) + 10} y={y(frontier[4]) + 4} fontSize="12" fontWeight="700" fill="var(--navy)" opacity="0.75">track frontier {(frontier[4] / 100).toFixed(1)}×</text>
        <text x={x(4) + 10} y={y(fixed[4]) + 4} fontSize="12" fontWeight="700" fill="var(--teal)">hold fixed {(fixed[4] / 100).toFixed(1)}×</text>
        <text x={x(4) + 10} y={y(mine[4]) + 4} fontSize="13" fontWeight="800" fill="var(--blue)">your mix {end.toFixed(1)}×</text>
      </svg>

      <div style={{ display: 'flex', gap: 28, alignItems: 'baseline', padding: '8px 12px', background: 'var(--card)', borderRadius: 9 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>2030 bill <b className="de-big" style={{ fontSize: 24, color: end > 1 ? 'var(--amber)' : 'var(--teal)' }}>{end.toFixed(1)}×</b> today’s</span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>
          {breakEven >= 1
            ? 'The bill shrinks even if every workload tracks the frontier.'
            : breakEven <= 0
              ? 'At this volume growth the bill rises even with capability held fixed.'
              : <>The bill grows once more than <b style={{ color: 'var(--navy)', fontSize: 16 }}>{Math.round(breakEven * 100)}%</b> of workloads move up-tier.</>}
        </span>
      </div>
    </div>
  )
}
