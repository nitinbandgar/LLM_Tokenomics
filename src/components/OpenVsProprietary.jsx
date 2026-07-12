import React, { useState } from 'react'
import { Section, Block, Callout, DataTable } from './ui.jsx'

const DIMENSIONS = [
  { dim: 'What you pay for', prop: 'Capability + training amortisation + R&D + margin', open: 'Hosting efficiency only — the artifact is free' },
  { dim: 'Pricing logic', prop: 'Value-based; price ladders are price discrimination as much as cost', open: 'Cost-plus; competition drives price toward marginal serving cost' },
  { dim: 'Training cost recovery', prop: '$100M–$1B+ per model, recovered over a 12–18-month competitive half-life', open: 'None — hosts bear no training cost and serve identical artifacts' },
  { dim: 'Same model across hosts', prop: 'Single vendor', open: 'Same weights vary ~20% in price between hosts on operational efficiency alone' },
  { dim: 'Licensing', prop: 'Contract terms', open: 'Apache-2.0 (fully open) to community licences with thresholds; check hosted-service clauses' },
  { dim: 'When it wins', prop: 'Frontier reliability, agentic robustness, integrated tooling, the hard tail of tasks', open: 'Routine volume, cost control, data residency, portability & negotiating leverage' },
]

const SHOCK_SIGNALS = [
  { signal: 'Frontier premium over commodity', value: '100–500×', implication: 'The widest price spread of any enterprise input — routing decisions carry enormous leverage' },
  { signal: 'DeepSeek V4 vs GPT-5.5-class list price', value: '~97% lower', implication: 'Open-weight pricing is now an anchor for every negotiation' },
  { signal: 'Frontier capability half-life', value: '6–12 months', implication: 'Capability commanding $25/M output today is matched by an open model within a year, then reprices to hosting economics' },
  { signal: 'Same open model across hosts', value: '~20% spread', implication: 'Even within open hosting, operational efficiency is worth shopping for' },
]

function HalfLifeViz() {
  const [months, setMonths] = useState(0)
  // frontier price for a fixed capability tier decays once open weights match (~month 9)
  const price = (m) => {
    if (m < 9) return 25
    return Math.max(0.6, 25 * Math.pow(0.55, (m - 8)))
  }
  const W = 640, H = 220, pad = 46
  const x = (m) => pad + (m / 24) * (W - 2 * pad)
  const y = (p) => H - pad - (p / 27) * (H - 2 * pad)
  const pts = Array.from({ length: 25 }, (_, m) => `${m === 0 ? 'M' : 'L'}${x(m)},${y(price(m))}`).join(' ')
  const cur = price(months)

  return (
    <div className="panel">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="var(--border-bright)" />
        <path d={pts} fill="none" stroke="var(--accent-pink)" strokeWidth="3" strokeLinecap="round" />
        <line x1={x(9)} y1={pad - 4} x2={x(9)} y2={H - pad} stroke="var(--accent-green)" strokeDasharray="4 4" />
        <text x={x(9) + 6} y={pad + 6} fill="var(--accent-green)" fontSize="11" fontFamily="var(--mono)">
          open weights match this tier
        </text>
        <circle cx={x(months)} cy={y(cur)} r="6" fill="var(--accent-cyan)" stroke="var(--bg)" strokeWidth="2" />
        <text x={x(months)} y={y(cur) - 12} fill="var(--accent-cyan)" fontSize="12" fontFamily="var(--mono)" textAnchor="middle">
          ${cur.toFixed(cur < 2 ? 2 : 0)}/M
        </text>
        {[0, 6, 12, 18, 24].map((m) => (
          <text key={m} x={x(m)} y={H - pad + 18} fill="var(--text-faint)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">
            month {m}
          </text>
        ))}
      </svg>
      <div className="control-row" style={{ marginTop: 10 }}>
        <div className="control-label">
          <span>Drag through the life of a capability tier</span>
          <span className="control-value">month {months} · ${cur.toFixed(cur < 2 ? 2 : 0)}/M output</span>
        </div>
        <input type="range" min={0} max={24} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
        Illustrative dynamics: a capability tier launches at a frontier premium; when an open-weight
        model matches it (typically within 6–12 months), the price for that tier collapses toward
        hosting economics within weeks. The frontier premium survives only by moving to the next tier.
      </div>
    </div>
  )
}

export default function OpenVsProprietary() {
  return (
    <Section
      id="open"
      kicker="Module 03 · Two different businesses"
      title="Proprietary APIs vs open weights: not two prices for the same product"
      lede={
        <>
          Proprietary APIs and open-weight models are <strong>two different businesses</strong>.
          One recovers a $100M–$1B training bill plus R&amp;D and margin; the other sells raw
          hosting efficiency for a free artifact. This difference explains almost all of the 10×
          price dispersion within a capability class.
        </>
      }
    >
      <Block title="Side by side">
        <DataTable
          headers={['Dimension', 'Proprietary frontier APIs', 'Open-weight models']}
          rows={DIMENSIONS.map((d) => [d.dim, d.prop, <span style={{ color: 'var(--accent-green)' }}>{d.open}</span>])}
        />
      </Block>

      <Block
        title="The repricing cascade — play it out"
        sub="What happens to the price of a fixed capability level once open weights catch up."
      >
        <HalfLifeViz />
      </Block>

      <Block title="The DeepSeek shock, in four numbers">
        <div className="grid grid-2">
          {SHOCK_SIGNALS.map((s) => (
            <div className="card" key={s.signal}>
              <div className="big-num" style={{ color: 'var(--accent-cyan)' }}>{s.value}</div>
              <div style={{ fontWeight: 600, fontSize: 13.5, margin: '4px 0' }}>{s.signal}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{s.implication}</div>
            </div>
          ))}
        </div>
      </Block>

      <Callout tone="green" title="Bottom line">
        Open weights stopped being the budget alternative in 2026 and became the{' '}
        <strong>default substrate</strong> for a widening set of routine workloads. The frontier
        premium survives — but its scope narrows to what open models cannot yet do: agentic
        reliability, very long-horizon tasks, and integrated tooling.
      </Callout>
    </Section>
  )
}
