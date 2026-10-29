import React, { useState } from 'react'
import { Eyebrow } from './primitives.jsx'
import { fmtUSD } from '../data.js'

// Slide 33 — support assistant, 500K conversations × 4 turns, Sonnet 5.5 ($2/$10) baseline.
const TURNS = 500000 * 4
const RESOLVED = 500000 * 0.6
const SONNET = { input: 2, output: 10, cached: 0.1 }
const HAIKU = { input: 0.1, output: 0.5, cached: 0.01 }

const LEVERS = [
  { id: 'ctx', title: 'Context engineering', sub: 'Snippets 6K → 2K; history summarised' },
  { id: 'cache', title: 'Prompt caching', sub: '3K-token prefix read from cache' },
  { id: 'out', title: 'Output control', sub: 'Answers capped at 250 tokens' },
  { id: 'route', title: 'Routing', sub: '70% of turns to Haiku 5.5 after evals' },
]

function turnCost(m, on) {
  const sys = 3000, user = 100
  const retrieved = on.has('ctx') ? 2000 : 6000
  const history = on.has('ctx') ? 500 : 1500
  const out = on.has('out') ? 250 : 400
  const sysRate = on.has('cache') ? m.cached : m.input
  return (sys * sysRate + (retrieved + history + user) * m.input + out * m.output) / 1e6
}

function monthly(on) {
  const r = on.has('route') ? 0.7 : 0
  return TURNS * ((1 - r) * turnCost(SONNET, on) + r * turnCost(HAIKU, on))
}

const BASE = monthly(new Set())

export const SIZE = { w: 1000, h: 483 }

export default function CaseA({ init = {} }) {
  // lever ids, in the order they were switched on; the static snapshot shows all four
  const [order, setOrder] = useState(() => {
    if (init.snapshot !== undefined) return LEVERS.map((l) => l.id)
    const ids = String(init.levers || '').split(',').filter((id) => LEVERS.some((l) => l.id === id))
    return [...new Set(ids)]
  })
  const toggle = (id) => setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]))

  // cumulative cost after each lever, in the order the room chose
  const rows = [{ key: 'base', title: 'Baseline', sub: 'Full RAG and history, workhorse model', cost: BASE }]
  const applied = new Set()
  for (const id of order) {
    applied.add(id)
    const lever = LEVERS.find((l) => l.id === id)
    rows.push({ key: id, title: lever.title, sub: lever.sub, cost: monthly(applied) })
  }
  const now = rows[rows.length - 1].cost
  const saved = 1 - now / BASE

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Eyebrow>Monthly token cost · switch levers on in any order</Eyebrow>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="de-btn" onClick={() => setOrder(LEVERS.map((l) => l.id))}>All four</button>
          <button className="de-btn" onClick={() => setOrder([])}>Reset</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {LEVERS.map((l) => {
          const pos = order.indexOf(l.id)
          const on = pos >= 0
          return (
            <div key={l.id} onClick={() => toggle(l.id)} role="checkbox" aria-checked={on} style={{
              cursor: 'pointer', userSelect: 'none', borderRadius: 9, padding: '8px 10px',
              border: `1.5px solid ${on ? 'var(--teal)' : 'var(--line)'}`, background: on ? 'rgba(0,153,153,0.07)' : '#fff', transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  width: 20, height: 20, borderRadius: 5, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0,
                  border: `1.5px solid ${on ? 'var(--teal)' : 'var(--line-strong)'}`, background: on ? 'var(--teal)' : '#fff', color: '#fff',
                }}>{on ? pos + 1 : ''}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{l.title}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.3 }}>{l.sub}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {rows.map((r, i) => {
          const prev = i > 0 ? rows[i - 1].cost : null
          return (
            <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 64px', gap: 12, alignItems: 'center', minHeight: 40, borderBottom: '1px solid var(--line)', paddingBottom: 4 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{i === 0 ? r.title : `${i} · ${r.title}`}</div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{i === 0 ? r.sub : `saves ${fmtUSD(prev - r.cost)} a month here`}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 22, width: `${(r.cost / BASE) * 78}%`, minWidth: 6, borderRadius: 5, background: i === 0 ? '#a7b1bf' : 'var(--blue)', transition: 'width 0.4s' }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--navy)', fontVariantNumeric: 'tabular-nums' }}>{fmtUSD(r.cost)}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)', textAlign: 'right' }}>{i === 0 ? '' : `−${Math.round((1 - r.cost / BASE) * 100)}%`}</div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 22, alignItems: 'baseline', padding: '8px 12px', background: 'var(--card)', borderRadius: 9 }}>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>Now <b className="de-big" style={{ fontSize: 22 }}>{fmtUSD(now)}</b> a month</span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>saved <b style={{ fontSize: 20, color: 'var(--green)' }}>{Math.round(saved * 100)}%</b></span>
        <span style={{ fontSize: 13, color: 'var(--muted)' }}>per resolved conversation <b style={{ fontSize: 20, color: 'var(--navy)' }}>${(now / RESOLVED).toFixed(now / RESOLVED < 0.1 ? 3 : 2)}</b> <span style={{ fontSize: 11 }}>(SaaS: $0.50–2.00)</span></span>
      </div>
    </div>
  )
}
