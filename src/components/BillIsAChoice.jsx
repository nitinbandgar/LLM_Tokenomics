import React, { useMemo, useState } from 'react'
import { Section, Block, Callout, More } from './ui.jsx'
import { GLOSSARY, TIMELINE_2030 } from '../data.js'
import {
  TRAJECTORY, CAPABILITY_STRATEGIES, DEMAND_SCENARIOS, spendMultiple,
  IMPLICATIONS_SUPPLIER, IMPLICATIONS_BUYER,
} from '../forceModel.js'

const CONF_COLOR = {
  High: 'var(--accent-green)',
  'Medium-high': 'var(--accent-cyan)',
  Medium: 'var(--accent-yellow)',
  Directional: 'var(--accent-orange)',
}

const cellColor = (m) =>
  m < 1 ? 'var(--accent-green)' : m < 2 ? 'var(--accent-yellow)' : m < 4 ? 'var(--accent-orange)' : 'var(--accent-pink)'

/* ------------------------------------------------------------------ */
/* The 3×3 decision matrix — rows are your choice, columns the market  */
/* ------------------------------------------------------------------ */
function StrategyMatrix({ sel, setSel }) {
  return (
    <div className="panel">
      <div style={{ overflowX: 'auto' }}>
        <table className="data" style={{ minWidth: 460 }}>
          <thead>
            <tr>
              <th style={{ width: 190 }}>Your capability strategy ↓</th>
              {DEMAND_SCENARIOS.map((d) => (
                <th key={d.key} style={{ textAlign: 'center' }}>
                  {d.label}<br />
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-faint)' }}>demand ×{d.mult}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAPABILITY_STRATEGIES.map((s) => (
              <tr key={s.key}>
                <td>
                  <div style={{ fontWeight: 600 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-faint)' }}>price captured ÷{s.capture}</div>
                </td>
                {DEMAND_SCENARIOS.map((d) => {
                  const m = spendMultiple(s.key, d.key)
                  const on = sel.strategy === s.key && sel.demand === d.key
                  return (
                    <td key={d.key} style={{ padding: 6 }}>
                      <button
                        onClick={() => setSel({ strategy: s.key, demand: d.key })}
                        style={{
                          width: '100%', padding: '12px 6px', borderRadius: 8, cursor: 'pointer',
                          border: `1px solid ${on ? cellColor(m) : 'var(--border)'}`,
                          background: on ? cellColor(m).replace('var(', 'var(') : 'var(--card)',
                          backgroundColor: on ? 'rgba(255,255,255,0.06)' : undefined,
                          boxShadow: on ? `0 0 0 1px ${cellColor(m)}` : 'none',
                          font: 'inherit', transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 21, fontWeight: 700, color: cellColor(m) }}>
                          {m.toFixed(2)}×
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>
                          {m < 1 ? `${Math.round((1 - m) * 100)}% lower` : `${m.toFixed(1)}× higher`}
                        </div>
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 10 }}>
        2030 enterprise spend as a multiple of 2026. Spend = demand growth ÷ the price decline you
        actually capture.
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Live readout for the selected cell                                  */
/* ------------------------------------------------------------------ */
function CellReadout({ sel }) {
  const s = CAPABILITY_STRATEGIES.find((x) => x.key === sel.strategy)
  const d = DEMAND_SCENARIOS.find((x) => x.key === sel.demand)
  const m = spendMultiple(s.key, d.key)
  const start = 10 // $M/yr illustrative starting spend
  const end = start * m
  const c = cellColor(m)

  const W = 620, H = 190, pad = 46
  const years = [2026, 2027, 2028, 2029, 2030]
  // interpolate the spend path in log space between 1 and m
  const path = years.map((y, i) => {
    const t = i / (years.length - 1)
    return { year: y, v: start * Math.pow(m, t) }
  })
  const maxV = Math.max(...path.map((p) => p.v), start)
  const minV = Math.min(...path.map((p) => p.v), start)
  const x = (i) => pad + (i / (years.length - 1)) * (W - 2 * pad)
  const yy = (v) => {
    const lo = Math.log10(minV * 0.85), hi = Math.log10(maxV * 1.15)
    return H - pad - ((Math.log10(v) - lo) / (hi - lo)) * (H - 2 * pad)
  }

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 26 }}>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            You chose
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, margin: '4px 0 2px' }}>{s.label}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{s.note}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 8 }}>
            Market: <strong style={{ color: 'var(--text)' }}>{d.label}</strong> — {d.note} (volume ×{d.mult})
          </div>

          <div style={{ display: 'flex', gap: 22, marginTop: 20, flexWrap: 'wrap' }}>
            <div className="result-item">
              <div className="r-label">2026 bill</div>
              <div className="r-value" style={{ fontSize: 22 }}>${start}M</div>
            </div>
            <div className="result-item">
              <div className="r-label">2030 bill</div>
              <div className="r-value" style={{ fontSize: 26, color: c }}>${end.toFixed(1)}M</div>
              <div className="r-note" style={{ color: c }}>
                {m < 1 ? `↓ ${Math.round((1 - m) * 100)}% lower` : `↑ ${m.toFixed(2)}× higher`}
              </div>
            </div>
          </div>
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            <line x1={pad} y1={yy(start)} x2={W - pad} y2={yy(start)} stroke="var(--border-bright)" strokeDasharray="4 5" />
            <text x={pad - 6} y={yy(start) + 4} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--mono)">${start}M</text>
            <path d={path.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${yy(p.v)}`).join(' ')}
              fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />
            {path.map((p, i) => (
              <circle key={i} cx={x(i)} cy={yy(p.v)} r="4" fill="var(--bg)" stroke={c} strokeWidth="2" />
            ))}
            {years.map((y, i) => (
              <text key={y} x={x(i)} y={H - pad + 18} fill="var(--text-faint)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">{y}</text>
            ))}
            <text x={x(4)} y={yy(path[4].v) - 12} fill={c} fontSize="12.5" fontWeight="700" textAnchor="end" fontFamily="var(--mono)">
              ${end.toFixed(1)}M
            </text>
          </svg>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
            Illustrative $10M starting spend. Same market, same volume growth — the line moves
            because of a decision, not a forecast.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Why the two price lines diverge                                     */
/* ------------------------------------------------------------------ */
function TwoPriceLines() {
  const [show, setShow] = useState('both')
  const W = 660, H = 260, pad = 50
  const years = TRAJECTORY.map((t) => t.year)
  const x = (i) => pad + (i / (years.length - 1)) * (W - 2 * pad)
  const all = TRAJECTORY.flatMap((t) => [t.constCap, t.blended, t.volume, t.hold, t.uptier])
  const lo = Math.log10(Math.min(...all) * 0.8), hi = Math.log10(Math.max(...all) * 1.2)
  const y = (v) => H - pad - ((Math.log10(v) - lo) / (hi - lo)) * (H - 2 * pad)
  const line = (k) => TRAJECTORY.map((t, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(t[k])}`).join(' ')

  const LINES = [
    { k: 'volume', c: 'var(--accent-violet)', label: 'Volume ×24', group: 'both' },
    { k: 'constCap', c: 'var(--accent-cyan)', label: 'Price ÷35 (fixed capability)', group: 'price' },
    { k: 'blended', c: 'var(--accent-orange)', label: 'Price ÷7 (what you actually pay)', group: 'price' },
    { k: 'hold', c: 'var(--accent-green)', label: 'Spend — hold fixed (0.69×)', group: 'spend' },
    { k: 'uptier', c: 'var(--accent-pink)', label: 'Spend — up-tier (3.39×)', group: 'spend' },
  ]
  const visible = LINES.filter((l) => show === 'both' || l.group === show || l.group === 'both')

  return (
    <div className="panel">
      <div style={{ marginBottom: 14 }}>
        <div className="seg">
          {[{ v: 'both', l: 'Everything' }, { v: 'price', l: 'The two price lines' }, { v: 'spend', l: 'The two spend lines' }].map((o) => (
            <button key={o.v} className={show === o.v ? 'active' : ''} onClick={() => setShow(o.v)}>{o.l}</button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <line x1={pad} y1={y(100)} x2={W - pad} y2={y(100)} stroke="var(--border-bright)" strokeDasharray="4 5" />
        <text x={pad - 6} y={y(100) + 4} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--mono)">100</text>
        {visible.map((l) => (
          <g key={l.k}>
            <path d={line(l.k)} fill="none" stroke={l.c} strokeWidth={l.group === 'spend' ? 3.5 : 2.5} strokeLinecap="round"
              strokeDasharray={l.group === 'price' ? '6 4' : undefined} />
            <text x={W - pad + 3} y={y(TRAJECTORY[4][l.k]) + 4} fill={l.c} fontSize="10" fontFamily="var(--mono)">
              {Math.round(TRAJECTORY[4][l.k])}
            </text>
          </g>
        ))}
        {years.map((yr, i) => (
          <text key={yr} x={x(i)} y={H - pad + 18} fill="var(--text-faint)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">{yr}</text>
        ))}
      </svg>
      <div className="legend">
        {visible.map((l) => (
          <div className="legend-item" key={l.k}><div className="legend-dot" style={{ background: l.c }} />{l.label}</div>
        ))}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 10 }}>
        Indexed to 2026 = 100, log scale. The gap between the two price lines <em>is</em> the up-tier decision.
      </div>
      <More label="Why the two price lines diverge">
        The headline decline applies to a <strong>fixed capability level</strong> — what today’s
        quality will cost in 2030. Enterprises don’t hold capability fixed: as models improve they
        move workloads onto better tiers, so their realised average price falls far more slowly
        (modelled at ~55% of the log decline: ÷7 rather than ÷35). The deflation is real; most
        enterprises simply spend it on more capability rather than banking it.
      </More>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function Glossary() {
  const [q, setQ] = useState('')
  const items = GLOSSARY.filter((g) => !q || (g.term + g.meaning + g.why).toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter terms… (try “cache”)"
        style={{
          width: '100%', maxWidth: 340, background: 'var(--bg-soft)', color: 'var(--text)',
          border: '1px solid var(--border-bright)', borderRadius: 10, padding: '10px 14px',
          fontFamily: 'var(--sans)', fontSize: 13.5, outline: 'none', marginBottom: 16,
        }}
      />
      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {items.map((g) => (
          <div className="card" key={g.term} style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13.5, fontWeight: 600, color: 'var(--accent-cyan)' }}>{g.term}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', margin: '6px 0' }}>{g.meaning}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>💡 {g.why}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function BillIsAChoice() {
  const [sel, setSel] = useState({ strategy: 'frontier', demand: 'base' })
  const [side, setSide] = useState('buyer')
  const items = side === 'buyer' ? IMPLICATIONS_BUYER : IMPLICATIONS_SUPPLIER

  return (
    <Section
      id="choice"
      kicker="Module 10 · The strategic conclusion"
      title="Your bill is a choice, not a forecast"
      lede={
        <>
          Take the same 24× volume growth. Hold capability fixed and your 2030 bill{' '}
          <strong>falls by a third</strong>. Keep buying up-tier and it <strong>triples</strong>.
          Same market, opposite outcomes — click any cell below.
        </>
      }
    >
      <Block title="Rows are your decision. Columns are the market.">
        <StrategyMatrix sel={sel} setSel={setSel} />
      </Block>

      <Block title="What that cell means for a $10M budget">
        <CellReadout sel={sel} />
      </Block>

      <Callout tone="pink" title="The strategic reading">
        This is not an argument for freezing capability — better models finish tasks in fewer
        attempts and unlock work that wasn’t feasible before. It is an argument for{' '}
        <strong>making the choice deliberately, per workload, instead of discovering it in the
        invoice</strong>. The organisations that lose control of AI spend are not the ones consuming
        the most intelligence; they are the ones that never decided which tier each workload deserved.
      </Callout>

      <Block title="The whole trajectory, 2026 → 2030" sub="Toggle between the price lines and the spend lines.">
        <TwoPriceLines />
      </Block>

      <Block title="The four horizons" sub="Extrapolations from observable trends — confidence indicated.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TIMELINE_2030.map((t) => (
            <div className="card" key={t.horizon} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, color: 'var(--accent-cyan)', width: 90, flexShrink: 0 }}>
                {t.horizon}
              </div>
              <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-dim)', minWidth: 240 }}>{t.dev}</div>
              <span className="chip" style={{ color: CONF_COLOR[t.confidence], borderColor: CONF_COLOR[t.confidence] + '66' }}>
                {t.confidence}
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="What it means for you">
        <div style={{ marginBottom: 14 }}>
          <div className="seg">
            <button className={side === 'buyer' ? 'active' : ''} onClick={() => setSide('buyer')}>If you buy tokens</button>
            <button className={side === 'supplier' ? 'active' : ''} onClick={() => setSide('supplier')}>If you sell them</button>
          </div>
        </div>
        <div className="grid grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {items.map((i) => (
            <div className="card" key={i.t}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontWeight: 700, fontSize: 13.5 }}>{i.t}</span>
                <span className="chip" style={{ color: CONF_COLOR[i.c], borderColor: CONF_COLOR[i.c] + '66', fontSize: 10, flexShrink: 0 }}>{i.c}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 6 }}>{i.d}</div>
            </div>
          ))}
        </div>
      </Block>

      <Callout title="The closing thought">
        Treat tokens as a managed resource: <strong>meter, route, cache and batch — then reinvest
        the savings in scale.</strong> Through 2025 the risk was overspending on AI; from here, the
        greater risk is under-consuming it.
      </Callout>

      <Block title="Glossary">
        <Glossary />
      </Block>
    </Section>
  )
}
