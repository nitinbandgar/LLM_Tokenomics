import React, { useMemo, useState } from 'react'
import { Section, Block, Seg, ResultStrip, Callout, More } from './ui.jsx'
import { SUPPLY_FORCES, DEMAND_FORCES, DRAG_FORCE, decompose } from '../forceModel.js'
import { FUTURE_SUPPLY, FUTURE_DEMAND } from '../data.js'

const CONF_COLOR = {
  High: 'var(--accent-green)',
  'Medium-high': 'var(--accent-cyan)',
  Medium: 'var(--accent-yellow)',
  Low: 'var(--accent-orange)',
}

const fmtX = (v) => (v >= 10 ? v.toFixed(1) : v.toFixed(2))

/* Cumulative walk: the waterfall the report draws (log-scaled y) */
function Waterfall({ walk, dir }) {
  const W = 660, H = 200, pad = 44
  const vals = walk.map((w) => w.index).concat([100])
  const lo = Math.min(...vals), hi = Math.max(...vals)
  const lgLo = Math.log10(Math.max(0.5, lo)), lgHi = Math.log10(hi)
  const span = Math.max(0.35, lgHi - lgLo)
  const y = (v) => H - pad - ((Math.log10(Math.max(0.5, v)) - lgLo) / span) * (H - 2 * pad)
  const n = walk.length + 1
  const x = (i) => pad + (i / (n - 1)) * (W - 2 * pad)
  const pts = [{ index: 100 }, ...walk]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <line x1={pad} y1={y(100)} x2={W - pad} y2={y(100)} stroke="var(--border-bright)" strokeDasharray="4 5" />
      <text x={pad - 6} y={y(100) + 4} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--mono)">100</text>
      {pts.map((p, i) => {
        if (i === 0) return null
        const prev = pts[i - 1]
        const up = p.index > prev.index
        const c = walk[i - 1].color
        const top = Math.min(y(p.index), y(prev.index))
        const h = Math.abs(y(p.index) - y(prev.index))
        return (
          <g key={i}>
            <line x1={x(i - 1)} y1={y(prev.index)} x2={x(i)} y2={y(prev.index)} stroke="var(--border-bright)" strokeDasharray="2 3" />
            <rect x={x(i) - 13} y={top} width={26} height={Math.max(2, h)} rx={3}
              fill={up ? 'var(--accent-green)' : c} opacity={0.85} style={{ transition: 'all 0.25s' }} />
          </g>
        )
      })}
      <path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.index)}`).join(' ')}
        fill="none" stroke="var(--text-dim)" strokeWidth="1.5" opacity={0.5} />
      {pts.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.index)} r="3" fill="var(--bg)" stroke="var(--text-dim)" strokeWidth="1.5" />
      ))}
      <text x={x(0)} y={y(100) - 10} fill="var(--text-faint)" fontSize="10" textAnchor="middle" fontFamily="var(--mono)">2026</text>
      <text x={x(n - 1)} y={y(pts[pts.length - 1].index) + (dir === 'down' ? 18 : -10)} fill={dir === 'down' ? 'var(--accent-green)' : 'var(--accent-pink)'}
        fontSize="12" fontWeight="700" textAnchor="end" fontFamily="var(--mono)">
        {fmtX(pts[pts.length - 1].index)}
      </text>
    </svg>
  )
}

function ForceRow({ f, value, onChange, dragMode }) {
  const pct = ((value - f.low) / (f.high - f.low)) * 100
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, fontSize: 12.5 }}>
        <span style={{ color: 'var(--text-dim)' }}>{f.name}</span>
        <span style={{ fontFamily: 'var(--mono)', color: f.color, fontWeight: 600, flexShrink: 0 }}>
          {dragMode ? '÷' : '×'}{value.toFixed(2)}
        </span>
      </div>
      <input
        type="range" min={f.low} max={f.high} step={0.05} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--mono)' }}>
        <span>{f.low}</span>
        <span style={{ color: CONF_COLOR[f.confidence] }}>{f.confidence} confidence</span>
        <span>{f.high}</span>
      </div>
    </div>
  )
}

function Decomposition({ side }) {
  const supply = side === 'supply'
  const forces = supply ? SUPPLY_FORCES : DEMAND_FORCES
  const [values, setValues] = useState(() => {
    const v = {}
    forces.forEach((f) => (v[f.key] = f.base))
    if (!supply) v[DRAG_FORCE.key] = DRAG_FORCE.base
    return v
  })

  const preset = (which) => {
    const v = {}
    forces.forEach((f) => (v[f.key] = f[which]))
    // drag inverts: a low-demand world is one with MORE optimisation, not less
    if (!supply) {
      v[DRAG_FORCE.key] =
        which === 'low' ? DRAG_FORCE.scenarioLow : which === 'high' ? DRAG_FORCE.scenarioHigh : DRAG_FORCE.base
    }
    setValues(v)
  }
  const PRESET_LABELS = supply
    ? { low: 'Slow decline', base: 'Base case', high: 'Fast decline' }
    : { low: 'Low demand', base: 'Base case', high: 'High demand' }

  const res = useMemo(
    () => decompose(forces, values, { dir: supply ? 'down' : 'up', dragValue: supply ? null : values[DRAG_FORCE.key] }),
    [forces, values, supply],
  )
  const sorted = [...res.rows].sort((a, b) => b.share - a.share)
  const maxShare = Math.max(...sorted.map((r) => r.share))
  const hw = res.rows.find((r) => r.key === 'accel')?.share || 0
  const num = res.rows.find((r) => r.key === 'numerics')?.share || 0
  const arch = res.rows.find((r) => r.key === 'arch')?.share || 0
  const sw = res.rows.find((r) => r.key === 'software')?.share || 0

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
        <button className="btn" onClick={() => preset('low')}>{PRESET_LABELS.low}</button>
        <button className="btn primary" onClick={() => preset('base')}>{PRESET_LABELS.base}</button>
        <button className="btn" onClick={() => preset('high')}>{PRESET_LABELS.high}</button>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>…or drag any force below.</span>
      </div>

      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          {forces.map((f) => (
            <ForceRow key={f.key} f={f} value={values[f.key]} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
          ))}
          {!supply && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
              <ForceRow f={DRAG_FORCE} value={values[DRAG_FORCE.key]} dragMode
                onChange={(v) => setValues((s) => ({ ...s, [DRAG_FORCE.key]: v }))} />
              <div style={{ fontSize: 11.5, color: 'var(--accent-green)' }}>
                ↑ The only force you control. Market average is 1.45×.
              </div>
            </div>
          )}
        </div>

        <div>
          <ResultStrip items={supply ? [
            { label: 'A token gets cheaper by', value: `÷${fmtX(res.gross)}`, color: 'var(--accent-green)', note: `${((1 - 1 / res.gross) * 100).toFixed(0)}% cheaper by 2030` },
            { label: 'Price index (2026 = 100)', value: (100 / res.gross).toFixed(1) },
          ] : [
            { label: 'Billable volume grows', value: `×${fmtX(res.net)}`, color: 'var(--accent-pink)', note: `gross ×${fmtX(res.gross)}, less the drag` },
            { label: 'Volume index (2026 = 100)', value: Math.round(res.net * 100).toLocaleString() },
          ]} />

          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 8px' }}>
            Share of the total movement
          </div>
          {sorted.map((r) => (
            <div className="bar-row" key={r.key}>
              <div className="bar-label" style={{ width: 150 }}>{r.name}</div>
              <div className="bar-track" style={{ height: 18 }}>
                <div className="bar-fill" style={{ width: `${(r.share / maxShare) * 100}%`, background: r.color }}>
                  <span className="bar-value">{(r.share * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
          {res.drag && (
            <div className="bar-row">
              <div className="bar-label" style={{ width: 150, color: 'var(--accent-green)' }}>{res.drag.name}</div>
              <div className="bar-track" style={{ height: 18 }}>
                <div className="bar-fill" style={{ width: `${(Math.abs(res.drag.share) / maxShare) * 100}%`, background: 'var(--accent-green)' }}>
                  <span className="bar-value">{(res.drag.share * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
            Shares computed in log space — they sum to exactly 100% and don’t depend on the order.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          One force at a time, 2026 → 2030 (log scale)
        </div>
        <Waterfall walk={res.walk} dir={supply ? 'down' : 'up'} />
      </div>

      {supply ? (
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 10 }}>
          Chips + numerics = <strong style={{ color: 'var(--accent-cyan)' }}>{Math.round((hw + num) * 100)}%</strong>.
          Model &amp; software design = <strong style={{ color: 'var(--accent-violet)' }}>{Math.round((arch + sw) * 100)}%</strong>.
          Roughly half the coming price fall is <em>not</em> chips.
        </div>
      ) : (
        <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 10 }}>
          Five forces are market-wide — no single company slows agentic adoption or multimodality.
          Push your own drag from 1.45× to 3× and you halve your token growth while consuming the
          same intelligence.
        </div>
      )}

      <More label="What each force means, and how good the evidence is">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...forces, ...(supply ? [] : [DRAG_FORCE])].map((f) => (
            <div key={f.key}>
              <span style={{ color: f.color, fontWeight: 700, fontSize: 12.5 }}>{f.name}</span>{' '}
              <span className="chip" style={{ color: CONF_COLOR[f.confidence], borderColor: CONF_COLOR[f.confidence] + '66', fontSize: 10 }}>
                {f.confidence}
              </span>
              <div style={{ fontSize: 12, marginTop: 2 }}>{f.what} — {f.basis}</div>
            </div>
          ))}
        </div>
      </More>
    </div>
  )
}

export default function ForceModel() {
  const [side, setSide] = useState('supply')
  return (
    <Section
      id="forces"
      kicker="Module 10 · The 2030 force model"
      title="Why tokens get 35× cheaper — and volume 24× bigger"
      lede={
        <>
          These forces are usually asserted, rarely quantified. They can be: cost per token is a{' '}
          <strong>product</strong> of independent efficiency terms, so each force can be given a
          share that sums to exactly 100%. Drag any of them and watch 2030 change.
        </>
      }
    >
      <Block title="Pick a side of the race">
        <div style={{ marginBottom: 16 }}>
          <Seg
            options={[
              { value: 'supply', label: '⬇ Supply — what makes a token cheaper' },
              { value: 'demand', label: '⬆ Demand — what makes volume bigger' },
            ]}
            value={side}
            onChange={setSide}
          />
        </div>
        <Decomposition key={side} side={side} />
      </Block>

      <Block
        title={side === 'supply' ? 'What is actually driving those numbers' : 'What is actually driving that volume'}
        sub="The qualitative story behind each factor."
      >
        <div className="grid grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {(side === 'supply' ? FUTURE_SUPPLY : FUTURE_DEMAND).map((t) => (
            <div className="card" key={t.name}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6, color: side === 'supply' ? 'var(--accent-cyan)' : 'var(--accent-pink)' }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>→ {t.so}</div>
              <More label="The evidence">{t.fact}</More>
            </div>
          ))}
        </div>
      </Block>

      <Callout tone={side === 'supply' ? 'green' : 'pink'} title={side === 'supply' ? 'The headline finding' : 'The one number an enterprise controls'}>
        {side === 'supply' ? (
          <>
            Energy dominates the trade press but contributes about <strong>3%</strong>. It constrains
            where capacity can be built — it is not what makes tokens cheap.
            <More label="Where this model could be wrong">
              The two largest terms are also the least certain. If HBM supply stays tight and
              accelerators deliver 2× rather than 3×, and architecture yields 1.9× rather than 2.8×,
              the total decline falls to roughly 10× instead of 35×. A genuine ASIC breakout with
              sub-4-bit numerics could push past 100×. Try the Slow and Fast presets.
            </More>
          </>
        ) : (
          <>
            Of six forces, five are market-wide. Only the <strong>optimisation drag</strong> is
            yours — and it is the difference between a bill that grows and one that doesn’t.
            <More label="A correction worth stating openly">
              An earlier draft of this research cited “120× token growth by 2030” attributed to
              Gartner. Both were wrong. The source is Goldman Sachs Research (20 May 2026), which
              forecasts token consumption multiplying <strong>24×</strong>, to 120 quadrillion tokens
              per month. The 120 is the absolute monthly volume, not the multiplier — and this model
              is calibrated to the corrected 24×.
            </More>
          </>
        )}
      </Callout>
    </Section>
  )
}
