import React, { useMemo, useState } from 'react'
import { Section, Block, Seg, Callout, DataTable } from './ui.jsx'
import { MODEL_PRICES, TIER_COLORS, TIER_LABELS, PRICING_MODELS, DISCOUNT_LANES, LLMFLATION, fmtUSD } from '../data.js'

function PriceExplorer() {
  const [metric, setMetric] = useState('output')
  const [scale, setScale] = useState('log')
  const [hover, setHover] = useState(null)

  const vals = MODEL_PRICES.map((m) => m[metric])
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  const width = (v) => {
    if (scale === 'linear') return (v / max) * 100
    const lmin = Math.log10(min / 1.6)
    const lmax = Math.log10(max)
    return ((Math.log10(v) - lmin) / (lmax - lmin)) * 100
  }

  const spread = Math.round(max / min)

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        <Seg
          options={[{ value: 'input', label: 'Input $/M' }, { value: 'output', label: 'Output $/M' }]}
          value={metric}
          onChange={setMetric}
        />
        <Seg
          options={[{ value: 'log', label: 'Log scale' }, { value: 'linear', label: 'Linear scale' }]}
          value={scale}
          onChange={setScale}
        />
        <span style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
          Tip: flip to linear to feel how extreme the spread really is.
        </span>
      </div>

      {MODEL_PRICES.map((m) => (
        <div
          className="bar-row"
          key={m.name}
          onMouseEnter={() => setHover(m.name)}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: 'default' }}
        >
          <div className="bar-label" style={{ color: hover === m.name ? 'var(--text)' : undefined }}>{m.name}</div>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{
                width: `${width(m[metric])}%`,
                background: TIER_COLORS[m.tier],
                opacity: hover && hover !== m.name ? 0.35 : 0.9,
              }}
            >
              <span className="bar-value">{fmtUSD(m[metric], 2)}</span>
            </div>
          </div>
        </div>
      ))}

      <div className="legend">
        {Object.entries(TIER_LABELS).map(([k, label]) => (
          <div className="legend-item" key={k}>
            <div className="legend-dot" style={{ background: TIER_COLORS[k] }} />
            {label}
          </div>
        ))}
      </div>

      <div style={{ minHeight: 40, marginTop: 14, fontSize: 13, color: 'var(--text-dim)' }}>
        {hover
          ? <><strong style={{ color: 'var(--text)' }}>{hover}:</strong> {MODEL_PRICES.find((m) => m.name === hover)?.notes}</>
          : <>Hover a bar for context. Spread on this metric: <strong style={{ color: 'var(--accent-pink)' }}>{spread}×</strong> between
            the most and least expensive tier — the widest quality-adjusted price dispersion of any input an enterprise buys.</>}
      </div>
    </div>
  )
}

function LLMflationChart() {
  const W = 640, H = 280, pad = 52
  const logMin = Math.log10(0.1), logMax = Math.log10(30)
  const x = (i) => pad + (i / (LLMFLATION.length - 1)) * (W - 2 * pad)
  const y = (p) => H - pad - ((Math.log10(p) - logMin) / (logMax - logMin)) * (H - 2 * pad)
  const path = LLMFLATION.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.price)}`).join(' ')
  const gridlines = [20, 10, 5, 2, 1, 0.5, 0.2]

  return (
    <div className="panel">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {gridlines.map((g) => (
          <g key={g}>
            <line x1={pad} y1={y(g)} x2={W - pad} y2={y(g)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3 5" />
            <text x={pad - 8} y={y(g) + 4} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--mono)">
              ${g}
            </text>
          </g>
        ))}
        <defs>
          <linearGradient id="flation" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent-pink)" />
            <stop offset="100%" stopColor="var(--accent-cyan)" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="url(#flation)" strokeWidth="3.5" strokeLinecap="round" />
        {LLMFLATION.map((d, i) => (
          <g key={d.year}>
            <circle cx={x(i)} cy={y(d.price)} r="5.5" fill="var(--bg)" stroke="var(--accent-cyan)" strokeWidth="2.5" />
            <text x={x(i)} y={y(d.price) - 14} fill="var(--text)" fontSize="11.5" textAnchor="middle" fontFamily="var(--mono)">
              {d.label}
            </text>
            <text x={x(i)} y={H - pad + 20} fill="var(--text-faint)" fontSize="11" textAnchor="middle" fontFamily="var(--mono)">
              {d.year}
            </text>
          </g>
        ))}
        <text x={W - pad} y={pad - 10} fill="var(--text-faint)" fontSize="10.5" textAnchor="end" fontFamily="var(--mono)">
          $/M tokens for GPT-4-class capability · log scale
        </text>
      </svg>
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 8 }}>
        “LLMflation”: for constant capability, prices have fallen ~10×/year since 2022 — faster than
        compute in the PC era or bandwidth in the dot-com era. The decline stacks four multiplicative
        layers: hardware generations (4–15× each), model architecture (MoE, distillation,
        quantisation), serving software (batching, paged KV caches, speculative decoding), and
        open-weight competition.
      </div>
    </div>
  )
}

export default function PricingLandscape() {
  return (
    <Section
      id="pricing"
      kicker="Module 03 · The pricing landscape"
      title="Five meters, three discounts, one collapsing price curve"
      lede={
        <>
          The commercial menu spans five distinct pricing models, usually layered on top of each
          other in a real deployment. Understanding <strong>which meter is running</strong> — per
          seat, per token, per call, per hour, or per training run — is the first step of any cost
          review.
        </>
      }
    >
      <Block title="The five commercial meters">
        <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          {PRICING_MODELS.map((p) => (
            <div className="card" key={p.name}>
              <div style={{ fontSize: 22 }}>{p.icon}</div>
              <div style={{ fontWeight: 700, margin: '8px 0 2px' }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent-cyan)' }}>{p.price}</div>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 8 }}>{p.unit}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </Block>

      <Block
        title="Explore the price ladder"
        sub="Indicative list prices per 1M tokens, mid-2026. These figures move monthly — the structure matters more than any single number."
      >
        <PriceExplorer />
      </Block>

      <Callout title="Structural reading">
        Three features matter more than any single number. First, the frontier-to-commodity spread
        is roughly <strong>100–500×</strong>. Second, every major provider offers the same three
        discounts — ~90% off cached input, 50% off batch, steep mini tiers — and batch + caching
        together take effective cost to <strong>~25% of on-demand rates</strong> before any
        engineering effort. Third, the moment an open-weight model matches a capability tier, that
        tier’s price collapses to hosting economics — in weeks, not years.
      </Callout>

      <Block title="The discount lanes every provider offers">
        <DataTable
          headers={['Discount lane', 'Typical saving', 'How it works', 'The catch']}
          rows={DISCOUNT_LANES.map((d) => [
            d.name,
            <span style={{ color: 'var(--accent-green)', fontFamily: 'var(--mono)', fontWeight: 600 }}>{d.saving}</span>,
            d.how,
            d.catch,
          ])}
        />
      </Block>

      <Block
        title="LLMflation: the trend underneath it all"
        sub="What GPT-4-level intelligence has cost per million tokens, 2022 → 2026."
      >
        <LLMflationChart />
      </Block>
    </Section>
  )
}
