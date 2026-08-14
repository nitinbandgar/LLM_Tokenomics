import React, { useState } from 'react'
import { Section, Fold, Callout, Hint } from './ui.jsx'
import {
  TRAJECTORY, CAPABILITY_STRATEGIES, DEMAND_SCENARIOS, spendMultiple,
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
/* Matrix + live readout, side by side — no scrolling between them     */
/* ------------------------------------------------------------------ */
function MatrixAndReadout() {
  const [sel, setSel] = useState({ strategy: 'frontier', demand: 'base' })
  const s = CAPABILITY_STRATEGIES.find((x) => x.key === sel.strategy)
  const d = DEMAND_SCENARIOS.find((x) => x.key === sel.demand)
  const m = spendMultiple(s.key, d.key)
  const start = 10
  const end = start * m
  const c = cellColor(m)

  const W = 560, H = 170, pad = 42
  const years = [2026, 2027, 2028, 2029, 2030]
  const path = years.map((y, i) => ({ year: y, v: start * Math.pow(m, i / (years.length - 1)) }))
  const maxV = Math.max(...path.map((p) => p.v), start)
  const minV = Math.min(...path.map((p) => p.v), start)
  const x = (i) => pad + (i / (years.length - 1)) * (W - 2 * pad)
  const yy = (v) => {
    const lo = Math.log10(minV * 0.85), hi = Math.log10(maxV * 1.15)
    return H - pad - ((Math.log10(v) - lo) / (hi - lo)) * (H - 2 * pad)
  }

  return (
    <div className="panel">
      <Hint>
        <strong>Rows are your decision; columns are the market.</strong> Click any cell — the panel
        on the right immediately shows what that choice does to a $10M budget.
      </Hint>
      <div className="grid grid-2" style={{ gap: 24 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data" style={{ minWidth: 330 }}>
            <thead>
              <tr>
                <th style={{ width: 126, fontSize: 11 }}>Your strategy ↓</th>
                {DEMAND_SCENARIOS.map((dd) => (
                  <th key={dd.key} style={{ textAlign: 'center', fontSize: 11 }}>
                    {dd.label}<br />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-faint)' }}>×{dd.mult}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CAPABILITY_STRATEGIES.map((ss) => (
                <tr key={ss.key}>
                  <td style={{ fontSize: 11.5 }}>
                    <div style={{ fontWeight: 600 }}>{ss.label}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-faint)' }}>÷{ss.capture}</div>
                  </td>
                  {DEMAND_SCENARIOS.map((dd) => {
                    const mm = spendMultiple(ss.key, dd.key)
                    const on = sel.strategy === ss.key && sel.demand === dd.key
                    return (
                      <td key={dd.key} style={{ padding: 4 }}>
                        <button
                          onClick={() => setSel({ strategy: ss.key, demand: dd.key })}
                          style={{
                            width: '100%', padding: '10px 4px', borderRadius: 8, cursor: 'pointer',
                            border: `1px solid ${on ? cellColor(mm) : 'var(--border)'}`,
                            background: on ? 'rgba(255,255,255,0.06)' : 'var(--card)',
                            boxShadow: on ? `0 0 0 1px ${cellColor(mm)}` : 'none',
                            font: 'inherit', transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: cellColor(mm) }}>{mm.toFixed(2)}×</div>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
            2030 spend as a multiple of 2026.
          </div>
        </div>

        <div className="popcard" style={{ borderColor: c + '66' }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>You chose</div>
          <div style={{ fontSize: 16, fontWeight: 700, margin: '3px 0 2px' }}>{s.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{s.note}</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6 }}>
            Market: <strong style={{ color: 'var(--text)' }}>{d.label}</strong> — {d.note}
          </div>
          <div style={{ display: 'flex', gap: 20, margin: '14px 0 6px', flexWrap: 'wrap' }}>
            <div className="result-item">
              <div className="r-label">2026 bill</div>
              <div className="r-value" style={{ fontSize: 19 }}>${start}M</div>
            </div>
            <div className="result-item">
              <div className="r-label">2030 bill</div>
              <div className="r-value" style={{ fontSize: 24, color: c }}>${end.toFixed(1)}M</div>
              <div className="r-note" style={{ color: c }}>
                {m < 1 ? `↓ ${Math.round((1 - m) * 100)}% lower` : `↑ ${m.toFixed(2)}× higher`}
              </div>
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            <line x1={pad} y1={yy(start)} x2={W - pad} y2={yy(start)} stroke="var(--border-bright)" strokeDasharray="4 5" />
            <path d={path.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${yy(p.v)}`).join(' ')}
              fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" style={{ transition: 'all 0.3s' }} />
            {path.map((p, i) => <circle key={i} cx={x(i)} cy={yy(p.v)} r="4" fill="var(--bg)" stroke={c} strokeWidth="2" />)}
            {years.map((y, i) => (
              <text key={y} x={x(i)} y={H - pad + 16} fill="var(--text-faint)" fontSize="10" textAnchor="middle" fontFamily="var(--mono)">{y}</text>
            ))}
          </svg>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Trajectory with a clickable legend                                  */
/* ------------------------------------------------------------------ */
const LINES = [
  { k: 'volume', c: 'var(--accent-violet)', label: 'Volume', end: '×24',
    insight: 'Token consumption multiplies 24× by 2030 (Goldman Sachs Research). This is the market — no single company changes it.' },
  { k: 'constCap', c: 'var(--accent-cyan)', label: 'Price · fixed capability', end: '÷35',
    insight: 'What today’s quality will cost in 2030 — a 35× fall. This is the headline deflation number everyone quotes.' },
  { k: 'blended', c: 'var(--accent-orange)', label: 'Price · what you actually pay', end: '÷7',
    insight: 'Your realised price falls only ~7×, because as models improve you move workloads onto better tiers. The deflation is real; most enterprises spend it on more capability instead of banking it.' },
  { k: 'hold', c: 'var(--accent-green)', label: 'Spend · hold capability', end: '0.69×',
    insight: 'Hold today’s quality bar and your 2030 bill is 31% LOWER than today — despite 24× more tokens. Deflation more than covers the growth.' },
  { k: 'uptier', c: 'var(--accent-pink)', label: 'Spend · keep up-tiering', end: '3.39×',
    insight: 'Keep moving to the best available model and your bill TRIPLES — same market, same volume growth. This is the most consequential line on the chart.' },
]

function Trajectory() {
  const [iso, setIso] = useState(null)
  const W = 660, H = 250, pad = 50
  const years = TRAJECTORY.map((t) => t.year)
  const x = (i) => pad + (i / (years.length - 1)) * (W - 2 * pad)
  const all = TRAJECTORY.flatMap((t) => [t.constCap, t.blended, t.volume, t.hold, t.uptier])
  const lo = Math.log10(Math.min(...all) * 0.8), hi = Math.log10(Math.max(...all) * 1.2)
  const y = (v) => H - pad - ((Math.log10(v) - lo) / (hi - lo)) * (H - 2 * pad)
  const line = (k) => TRAJECTORY.map((t, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(t[k])}`).join(' ')
  const cur = LINES.find((l) => l.k === iso)

  return (
    <div className="panel">
      <Hint>Click any line or legend chip to isolate it and read what it means. Click again to bring all five back.</Hint>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <line x1={pad} y1={y(100)} x2={W - pad} y2={y(100)} stroke="var(--border-bright)" strokeDasharray="4 5" />
        <text x={pad - 6} y={y(100) + 4} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--mono)">100</text>
        {LINES.map((l) => {
          const dim = iso && iso !== l.k
          return (
            <g key={l.k} onClick={() => setIso(iso === l.k ? null : l.k)} style={{ cursor: 'pointer' }}>
              <path d={line(l.k)} fill="none" stroke={l.c} strokeWidth={iso === l.k ? 4.5 : 2.6}
                strokeLinecap="round" opacity={dim ? 0.12 : 1}
                strokeDasharray={l.k === 'constCap' || l.k === 'blended' ? '6 4' : undefined}
                style={{ transition: 'all 0.25s' }} />
              <path d={line(l.k)} fill="none" stroke="transparent" strokeWidth="16" />
              {!dim && (
                <text x={W - pad + 4} y={y(TRAJECTORY[4][l.k]) + 4} fill={l.c} fontSize="10" fontFamily="var(--mono)">
                  {Math.round(TRAJECTORY[4][l.k])}
                </text>
              )}
            </g>
          )
        })}
        {years.map((yr, i) => (
          <text key={yr} x={x(i)} y={H - pad + 18} fill="var(--text-faint)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">{yr}</text>
        ))}
      </svg>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {LINES.map((l) => (
          <button
            key={l.k}
            onClick={() => setIso(iso === l.k ? null : l.k)}
            className="chip"
            style={{
              cursor: 'pointer', fontSize: 11,
              color: iso && iso !== l.k ? 'var(--text-faint)' : l.c,
              borderColor: iso === l.k ? l.c : 'var(--border)',
              background: iso === l.k ? 'rgba(255,255,255,0.05)' : 'transparent',
            }}
          >
            ● {l.label} <span style={{ fontFamily: 'var(--mono)', opacity: 0.8 }}>{l.end}</span>
          </button>
        ))}
      </div>

      <div className="popcard" style={{ marginTop: 12, minHeight: 66, borderColor: cur ? cur.c + '77' : undefined }}>
        {cur ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 13, color: cur.c, marginBottom: 5 }}>{cur.label} — {cur.end} by 2030</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{cur.insight}</div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            Indexed to 2026 = 100, log scale. <strong>The gap between the green and pink spend lines
            is the entire up-tier decision.</strong> Click a line for what it means.
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

export default function BillIsAChoice() {

  return (
    <Section
      id="choice"
      kicker="Module 5.1 · The strategic conclusion"
      title="Your bill is a choice, not a forecast"
      lede={
        <>
          Take the same 24× volume growth. Hold capability fixed and your 2030 bill{' '}
          <strong>falls by a third</strong>. Keep buying up-tier and it <strong>triples</strong>.
          Same market, opposite outcomes.
        </>
      }
    >
      <Fold title="Pick a strategy, see the bill" sub="Rows are your decision; columns are the market." open>
        <MatrixAndReadout />
      </Fold>

      <Callout tone="pink" title="The strategic reading">
        This is not an argument for freezing capability — better models finish tasks in fewer
        attempts and unlock work that wasn’t feasible before. It is an argument for{' '}
        <strong>making the choice deliberately, per workload, instead of discovering it in the
        invoice</strong>.
      </Callout>

      <Fold title="The whole trajectory, 2026 → 2030" sub="Five lines. Click one to isolate it and read what it means.">
        <Trajectory />
      </Fold>


      <Callout title="The closing thought">
        Treat tokens as a managed resource: <strong>meter, route, cache and batch — then reinvest
        the savings in scale.</strong> Through 2025 the risk was overspending on AI; from here, the
        greater risk is under-consuming it.
      </Callout>
    </Section>
  )
}
