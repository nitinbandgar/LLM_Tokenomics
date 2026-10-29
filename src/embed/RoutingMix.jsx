import React, { useRef, useState } from 'react'
import { Eyebrow, Chips } from './primitives.jsx'

// Slide 22 — four-tier routing. Blended $ per 1M at OpenAI list prices, 3 input : 1 output.
const TIERS = [
  { id: 'T1', name: 'Value', rate: 0.2, color: '#009999' },
  { id: 'T2', name: 'Workhorse', rate: 2, color: '#1268B3' },
  { id: 'T3', name: 'Advanced', rate: 4, color: '#0E4F99' },
  { id: 'T4', name: 'Frontier', rate: 20, color: '#002060' },
]
const PRESETS = [
  { label: 'Deck mix 60/28/10/2', shares: [60, 28, 10, 2] },
  { label: 'Cautious 40/35/20/5', shares: [40, 35, 20, 5] },
  { label: 'All T3', shares: [0, 0, 100, 0] },
  { label: 'All T4', shares: [0, 0, 0, 100] },
]

const toBounds = (s) => [s[0], s[0] + s[1], s[0] + s[1] + s[2]]
const toShares = (b) => [b[0], b[1] - b[0], b[2] - b[1], 100 - b[2]]
// "60-28-10-2" -> [60, 28, 10, 2], or null unless four shares adding to 100
const parseMix = (mix) => {
  const s = String(mix || '').split('-').map(Number)
  return s.length === 4 && s.every((v) => v >= 0) && s.reduce((a, b) => a + b, 0) === 100 ? s : null
}

export const SIZE = { w: 1200, h: 120 }

export default function RoutingMix({ init = {} }) {
  const [bounds, setBounds] = useState(() => toBounds(parseMix(init.mix) || PRESETS[0].shares))
  const bar = useRef(null)
  const drag = useRef(null) // { candidates: [k…], k, startX }

  const shares = toShares(bounds)
  const blended = shares.reduce((sum, s, i) => sum + (s / 100) * TIERS[i].rate, 0)
  const vsT3 = 1 - blended / 4
  const vsT4 = 1 - blended / 20
  const preset = PRESETS.find((p) => p.shares.every((s, i) => s === shares[i]))?.label

  const pctAt = (clientX) => {
    const r = bar.current.getBoundingClientRect()
    return Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }

  const onDown = (k) => (e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    // handles can sit on top of each other (a tier at 0%); pick one once the drag direction is known
    const candidates = [0, 1, 2].filter((j) => bounds[j] === bounds[k])
    drag.current = { candidates, k: candidates.length === 1 ? k : null, startX: e.clientX }
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d) return
    if (d.k === null) {
      if (Math.abs(e.clientX - d.startX) < 2) return
      d.k = e.clientX > d.startX ? Math.max(...d.candidates) : Math.min(...d.candidates)
    }
    const k = d.k
    const lo = k === 0 ? 0 : bounds[k - 1]
    const hi = k === 2 ? 100 : bounds[k + 1]
    const v = Math.min(hi, Math.max(lo, pctAt(e.clientX)))
    if (v !== bounds[k]) setBounds(bounds.map((b, j) => (j === k ? v : b)))
  }
  const onUp = () => { drag.current = null }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 30, height: '100%', alignItems: 'center', padding: '0 4px' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Eyebrow>The math · drag the dividers to set your mix</Eyebrow>
          <Chips options={PRESETS} active={preset} onPick={(p) => setBounds(toBounds(p.shares))} />
        </div>
        <div ref={bar} style={{ position: 'relative', height: 40, display: 'flex', borderRadius: 8, overflow: 'visible', touchAction: 'none' }}
          onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          {TIERS.map((t, i) => (
            <div key={t.id} style={{
              width: shares[i] + '%', background: t.color, color: '#fff', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', overflow: 'hidden',
              borderRadius: i === 0 ? '8px 0 0 8px' : i === 3 ? '0 8px 8px 0' : 0,
            }}>
              {shares[i] >= 18 ? `${t.id} ${t.name} · ${shares[i]}%` : shares[i] >= 6 ? `${t.id} · ${shares[i]}%` : ''}
            </div>
          ))}
          {bounds.map((b, k) => (
            <div key={k} onPointerDown={onDown(k)} title="Drag"
              style={{ position: 'absolute', left: `calc(${b}% - 14px)`, top: -6, width: 28, height: 52, cursor: 'ew-resize', display: 'grid', placeItems: 'center', zIndex: 2 + k }}>
              <div style={{ width: 8, height: 52, borderRadius: 4, background: '#fff', border: '2px solid var(--navy)', boxShadow: '0 1px 4px rgba(0,32,96,0.3)' }} />
            </div>
          ))}
        </div>
        <div className="de-note" style={{ marginTop: 8, fontSize: 11 }}>
          Per 1M tokens, blended at OpenAI list prices, 3 input : 1 output — T1 Luna $0.20 · T2 Terra $2 · T3 Sol $4 · T4 Astra $20.
          Intro prices: Argon doubles 1 Dec, 3.8 Flash 1 Jan.
        </div>
      </div>
      <div>
        <Eyebrow>Blended rate</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '2px 0' }}>
          <span className="de-big" style={{ fontSize: 40, color: 'var(--blue)' }}>${blended.toFixed(2)}</span>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>per 1M tokens</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--body)' }}>
          <b>{Math.abs(Math.round(vsT3 * 100))}% {vsT3 >= 0 ? 'below' : 'above'}</b> all-T3 · <b>{Math.round(vsT4 * 100)}% below</b> all-T4
        </div>
      </div>
    </div>
  )
}
