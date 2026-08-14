import React, { useState } from 'react'
import { Section, Fold, Callout, Hint, More } from './ui.jsx'

/* Table 8, compressed to essentials with an icon per dimension */
const DIMENSIONS = [
  { icon: '💰', dim: 'What you pay for', prop: 'Capability + training + R&D + margin', open: 'Hosting efficiency — the model itself is free' },
  { icon: '🏷️', dim: 'How the price is set', prop: 'What it is worth to you', open: 'What it costs to run, plus a thin margin' },
  { icon: '🏗️', dim: 'Training bill', prop: '$100M–$1B+, recovered in 12–18 months', open: 'None — hosts did not train it' },
  { icon: '🔀', dim: 'Switching supplier', prop: 'One vendor, one price', open: 'Same weights, ~20% price spread across hosts' },
  { icon: '📜', dim: 'Licensing', prop: 'Contract terms', open: 'Apache-2.0 to community licences — check the clauses' },
  { icon: '🏆', dim: 'Where it wins', prop: 'Frontier reliability, agentic robustness, the hard tail', open: 'Routine volume, cost control, data residency, leverage' },
]

const SHOCK_SIGNALS = [
  { icon: '↔️', signal: 'Frontier vs commodity price', value: '100–500×', scope: 'open weights generally', implication: 'The widest price spread of any enterprise input — routing carries enormous leverage' },
  { icon: '⚡', signal: 'DeepSeek V4 vs GPT-5.5-class', value: '~97% lower', scope: 'DeepSeek specifically', implication: 'Open-weight pricing is now an anchor in every negotiation' },
  { icon: '⏳', signal: 'Frontier capability half-life', value: '6–12 months', scope: 'open weights generally', implication: 'What commands $25/M today is matched by an open model within a year' },
  { icon: '🏢', signal: 'Same open model, different hosts', value: '~20% spread', scope: 'open weights generally', implication: 'Even within open hosting, operational efficiency is worth shopping for' },
]

function SideBySide() {
  const [sel, setSel] = useState(null)
  return (
    <div className="panel">
      <Hint>Two business models, not two prices. Click any row to see why the difference exists.</Hint>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 1, background: 'var(--border)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ background: 'var(--bg-soft)', padding: '10px 12px', fontSize: 11.5, fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dimension</div>
        <div style={{ background: 'var(--bg-soft)', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--accent-pink)' }}>🔒 Proprietary API</div>
        <div style={{ background: 'var(--bg-soft)', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--accent-green)' }}>🔓 Open weights</div>
        {DIMENSIONS.map((d) => (
          <React.Fragment key={d.dim}>
            <div onClick={() => setSel(sel === d.dim ? null : d.dim)} style={{ background: sel === d.dim ? 'var(--card-hover)' : 'var(--card)', padding: '10px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>
              <span style={{ marginRight: 6 }}>{d.icon}</span>{d.dim}
            </div>
            <div onClick={() => setSel(sel === d.dim ? null : d.dim)} style={{ background: sel === d.dim ? 'var(--card-hover)' : 'var(--card)', padding: '10px 12px', fontSize: 12, color: 'var(--text-dim)', cursor: 'pointer' }}>{d.prop}</div>
            <div onClick={() => setSel(sel === d.dim ? null : d.dim)} style={{ background: sel === d.dim ? 'var(--card-hover)' : 'var(--card)', padding: '10px 12px', fontSize: 12, color: 'var(--accent-green)', cursor: 'pointer' }}>{d.open}</div>
          </React.Fragment>
        ))}
      </div>
      <More label="Why this difference exists at all">
        A proprietary vendor must recover a $100M–$1B+ training bill plus R&amp;D, safety and data
        licensing, over a competitive half-life of 12–18 months. An open-weight host bears none of
        that: it downloads a free artifact and sells only the efficiency with which it runs it.
        That is the whole reason the same class of capability can differ 10× in price.
      </More>
    </div>
  )
}

// Real market anchors behind the illustrative curve
const ANCHORS = [
  { m: 0, price: 25, label: 'Frontier launch',
    real: 'Claude Opus 4.6 lists at $25 per 1M output tokens — the frontier tier in this guide’s price table (Module 2.1).' },
  { m: 9, price: 25, label: 'An open model matches the tier',
    real: 'The trigger event. DeepSeek’s V3/R1 (2025) and V4 (2026) matched Western frontier models on many agentic benchmarks while pricing 90–97% below them.' },
  { m: 12, price: 4.1, label: 'Collapse under way',
    real: 'Frontier vendors historically respond not with headline price cuts but with cheaper mid-tiers and aggressive caching discounts — defending frontier margin while ceding the mid-market.' },
  { m: 24, price: 0.6, label: 'Hosting economics',
    real: 'Llama-class 70B hosted lists at $0.30–0.90 per 1M output — cost-plus pricing on the hardware arithmetic in Module 2.2, not value-based pricing.' },
]

function HalfLifeViz() {
  const [months, setMonths] = useState(0)
  const [sel, setSel] = useState(null)
  const price = (m) => (m < 9 ? 25 : Math.max(0.6, 25 * Math.pow(0.55, m - 8)))
  const W = 640, H = 220, pad = 46
  const x = (m) => pad + (m / 24) * (W - 2 * pad)
  const y = (p) => H - pad - (p / 27) * (H - 2 * pad)
  const pts = Array.from({ length: 25 }, (_, m) => `${m === 0 ? 'M' : 'L'}${x(m)},${y(price(m))}`).join(' ')
  const cur = price(months)
  const anchor = ANCHORS.find((a) => a.m === sel)
  const phase = months < 9
    ? 'Frontier premium intact — no open model matches this tier yet, so the vendor holds the price.'
    : months < 13
      ? 'Collapse. An open model has matched the tier; the price falls toward hosting economics within weeks.'
      : 'New floor. This capability is now a commodity — the premium has moved on to the next tier up.'

  return (
    <div className="panel">
      <div className="popcard" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
          <strong>What this shows:</strong> a capability tier launches at a frontier premium. The
          moment an open-weight model matches it, the price falls toward hosting economics. The
          frontier premium survives only by moving to the next tier.
        </div>
      </div>
      <Hint>Drag the slider through 24 months, or <strong>click a ◆ marker</strong> to see which real model sits at that price point.</Hint>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--border-bright)" />
        <path d={pts} fill="none" stroke="var(--accent-pink)" strokeWidth="3" strokeLinecap="round" />
        <line x1={x(9)} y1={pad - 4} x2={x(9)} y2={H - pad} stroke="var(--accent-green)" strokeDasharray="4 4" />
        <text x={x(9) + 6} y={pad + 6} fill="var(--accent-green)" fontSize="11" fontFamily="var(--mono)">open weights match this tier</text>
        {/* clickable real-world anchors */}
        {ANCHORS.map((a) => {
          const on = sel === a.m
          return (
            <g key={a.m} onClick={() => { setSel(on ? null : a.m); setMonths(a.m) }} style={{ cursor: 'pointer' }}>
              <circle cx={x(a.m)} cy={y(a.price)} r="13" fill="transparent" />
              <rect x={x(a.m) - 5} y={y(a.price) - 5} width={10} height={10}
                transform={`rotate(45 ${x(a.m)} ${y(a.price)})`}
                fill={on ? 'var(--accent-yellow)' : 'var(--bg)'} stroke="var(--accent-yellow)" strokeWidth="2" />
            </g>
          )
        })}
        <circle cx={x(months)} cy={y(cur)} r="6" fill="var(--accent-cyan)" stroke="var(--bg)" strokeWidth="2" />
        <text x={x(months)} y={y(cur) - 14} fill="var(--accent-cyan)" fontSize="12" fontFamily="var(--mono)" textAnchor="middle">
          ${cur.toFixed(cur < 2 ? 2 : 0)}/M
        </text>
        {[0, 6, 12, 18, 24].map((m) => (
          <text key={m} x={x(m)} y={H - pad + 18} fill="var(--text-faint)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">month {m}</text>
        ))}
      </svg>
      <div className="control-row" style={{ marginTop: 10 }}>
        <div className="control-label">
          <span>Months since this tier launched</span>
          <span className="control-value">month {months} · ${cur.toFixed(cur < 2 ? 2 : 0)}/M output</span>
        </div>
        <input type="range" min={0} max={24} value={months} onChange={(e) => { setMonths(Number(e.target.value)); setSel(null) }} />
      </div>
      <div className="popcard" style={{ minHeight: 70, borderColor: anchor ? 'var(--accent-yellow)77' : undefined }}>
        {anchor ? (
          <>
            <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 5 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 700, color: 'var(--accent-yellow)' }}>
                ${anchor.price}/M
              </span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{anchor.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>month {anchor.m}</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{anchor.real}</div>
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{phase}</div>
        )}
      </div>
    </div>
  )
}

export default function OpenVsProprietary() {
  const [sel, setSel] = useState(null)
  return (
    <Section
      id="open"
      kicker="Module 06 · Two different businesses"
      title="Proprietary APIs vs open weights"
      lede={
        <>
          These are not two prices for the same product — they are{' '}
          <strong>two different businesses</strong>. One recovers a training bill; the other sells
          hosting efficiency for a free artifact. That explains almost all of the 10× price
          dispersion inside a single capability class.
        </>
      }
    >
      <Fold open title="Side by side" sub="Two business models, not two prices.">
        <SideBySide />
      </Fold>

      <Fold title="The repricing cascade — play it out" sub="What happens to a capability tier once open weights catch up." badge="interactive">
        <HalfLifeViz />
      </Fold>

      <Fold title="The open-weight effect, in four numbers" sub="Three of these describe open weights in general; one is DeepSeek specifically. Click for the implication.">
        <div className="grid grid-2">
          {SHOCK_SIGNALS.map((s) => (
            <button
              key={s.signal}
              className="card"
              onClick={() => setSel(sel === s.signal ? null : s.signal)}
              style={{
                textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit',
                borderColor: sel === s.signal ? 'var(--accent-cyan)' : undefined,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
                <span className="big-num" style={{ color: 'var(--accent-cyan)' }}>{s.value}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 13, margin: '4px 0 2px' }}>{s.signal}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-faint)', fontStyle: 'italic' }}>{s.scope}</div>
              {sel === s.signal && (
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  {s.implication}
                </div>
              )}
            </button>
          ))}
        </div>
      </Fold>

      <Callout tone="green" title="Bottom line">
        Open weights became the <strong>default substrate</strong> for routine workloads in 2026 —
        the frontier premium survives only where open models can’t yet follow: agentic reliability,
        long-horizon tasks, integrated tooling.
      </Callout>
    </Section>
  )
}
