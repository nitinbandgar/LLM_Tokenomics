import React, { useMemo, useState } from 'react'
import { ResultStrip, Hint, More } from './ui.jsx'
import { SUPPLY_FORCES, DEMAND_FORCES, DRAG_FORCE, decompose } from '../forceModel.js'

export const CONF_COLOR = {
  High: 'var(--accent-green)',
  'Medium-high': 'var(--accent-cyan)',
  Medium: 'var(--accent-yellow)',
  Low: 'var(--accent-orange)',
}
const fmtX = (v) => (v >= 10 ? v.toFixed(1) : v.toFixed(2))

/* Cumulative walk — each bar is clickable and reports its own contribution */
function Waterfall({ walk, dir, selKey, onSelect }) {
  const W = 660, H = 210, pad = 44
  const vals = walk.map((w) => w.index).concat([100])
  const lgLo = Math.log10(Math.max(0.5, Math.min(...vals)))
  const lgHi = Math.log10(Math.max(...vals))
  const span = Math.max(0.35, lgHi - lgLo)
  const y = (v) => H - pad - ((Math.log10(Math.max(0.5, v)) - lgLo) / span) * (H - 2 * pad)
  const pts = [{ index: 100 }, ...walk]
  const n = pts.length
  const x = (i) => pad + (i / (n - 1)) * (W - 2 * pad)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <line x1={pad} y1={y(100)} x2={W - pad} y2={y(100)} stroke="var(--border-bright)" strokeDasharray="4 5" />
      <text x={pad - 6} y={y(100) + 4} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--mono)">100</text>
      {pts.map((p, i) => {
        if (i === 0) return null
        const step = walk[i - 1]
        const prev = pts[i - 1]
        const up = p.index > prev.index
        const on = selKey === step.key
        const top = Math.min(y(p.index), y(prev.index))
        const h = Math.abs(y(p.index) - y(prev.index))
        return (
          <g key={i} onClick={() => onSelect(on ? null : step.key)} style={{ cursor: 'pointer' }}>
            <line x1={x(i - 1)} y1={y(prev.index)} x2={x(i)} y2={y(prev.index)} stroke="var(--border-bright)" strokeDasharray="2 3" />
            <rect x={x(i) - 14} y={top} width={28} height={Math.max(3, h)} rx={3}
              fill={up ? 'var(--accent-green)' : step.color}
              opacity={selKey && !on ? 0.3 : 0.9}
              stroke={on ? '#fff' : 'none'} strokeWidth={on ? 1.5 : 0}
              style={{ transition: 'all 0.2s' }} />
            {/* generous hit area */}
            <rect x={x(i) - 16} y={pad - 6} width={32} height={H - pad - (pad - 6)} fill="transparent" />
            <text x={x(i)} y={H - pad + 15} fill={on ? 'var(--text)' : 'var(--text-faint)'} fontSize="9.5" textAnchor="middle" fontFamily="var(--mono)">
              {(step.share * 100).toFixed(0)}%
            </text>
          </g>
        )
      })}
      <path d={pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.index)}`).join(' ')}
        fill="none" stroke="var(--text-dim)" strokeWidth="1.5" opacity={0.45} />
      {pts.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.index)} r="3" fill="var(--bg)" stroke="var(--text-dim)" strokeWidth="1.5" />)}
      <text x={x(0)} y={y(100) - 10} fill="var(--text-faint)" fontSize="10" textAnchor="middle" fontFamily="var(--mono)">2026</text>
      <text x={x(n - 1)} y={y(pts[n - 1].index) + (dir === 'down' ? 18 : -10)}
        fill={dir === 'down' ? 'var(--accent-green)' : 'var(--accent-pink)'}
        fontSize="12" fontWeight="700" textAnchor="end" fontFamily="var(--mono)">
        {fmtX(pts[n - 1].index)}
      </text>
    </svg>
  )
}

function ForceRow({ f, value, onChange, dragMode, selected, onSelect }) {
  return (
    <div style={{
      marginBottom: 8, padding: '7px 10px', borderRadius: 8,
      border: `1px solid ${selected ? f.color : 'transparent'}`,
      background: selected ? 'rgba(255,255,255,0.03)' : 'transparent',
      transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, fontSize: 12.5 }}>
        <button
          onClick={() => onSelect(selected ? null : f.key)}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit',
            color: selected ? f.color : 'var(--text-dim)', textAlign: 'left', textDecoration: 'underline',
            textDecorationStyle: 'dotted', textUnderlineOffset: 3, textDecorationColor: 'var(--border-bright)',
          }}
        >
          {f.name} <span style={{ opacity: 0.65 }}>ⓘ</span>
        </button>
        <span style={{ fontFamily: 'var(--mono)', color: f.color, fontWeight: 600, flexShrink: 0 }}>
          {dragMode ? '÷' : '×'}{value.toFixed(2)}
        </span>
      </div>
      <input type="range" min={f.low} max={f.high} step={0.05} value={value}
        onChange={(e) => onChange(Number(e.target.value))} style={{ width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-faint)', fontFamily: 'var(--mono)' }}>
        <span>{f.low}</span>
        <span style={{ color: CONF_COLOR[f.confidence] }}>{f.confidence} confidence</span>
        <span>{f.high}</span>
      </div>
    </div>
  )
}

function ForceDetail({ f, share, dir }) {
  if (!f) {
    return (
      <div className="popcard" style={{ minHeight: 120 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
          <strong>Click a force name</strong> — or a bar on the chart below — to see what it
          contributes and how good the evidence is.
        </div>
      </div>
    )
  }
  const pct = Math.abs(share * 100)
  return (
    <div className="popcard" style={{ minHeight: 120, borderColor: f.color + '77' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: f.color }}>{f.name}</span>
        <span className="chip" style={{ fontSize: 10, color: CONF_COLOR[f.confidence], borderColor: CONF_COLOR[f.confidence] + '66' }}>
          {f.confidence} confidence
        </span>
      </div>
      <div style={{ display: 'flex', gap: 20, margin: '8px 0 10px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contributes</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 21, fontWeight: 700, color: f.color }}>
            {share < 0 ? '−' : ''}{pct.toFixed(0)}%
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
            of the total {dir === 'down' ? 'price fall' : 'volume growth'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Measures</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{f.what}</div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 6 }}>{f.story}</div>
      <More label="The sourcing">{f.basis}</More>
    </div>
  )
}

export function Decomposition({ side }) {
  const supply = side === 'supply'
  const forces = supply ? SUPPLY_FORCES : DEMAND_FORCES
  const [selKey, setSelKey] = useState(null)
  const [values, setValues] = useState(() => {
    const v = {}
    forces.forEach((f) => (v[f.key] = f.base))
    if (!supply) v[DRAG_FORCE.key] = DRAG_FORCE.base
    return v
  })

  const preset = (which) => {
    const v = {}
    forces.forEach((f) => (v[f.key] = f[which]))
    if (!supply) {
      v[DRAG_FORCE.key] = which === 'low' ? DRAG_FORCE.scenarioLow : which === 'high' ? DRAG_FORCE.scenarioHigh : DRAG_FORCE.base
    }
    setValues(v)
  }
  const LABELS = supply
    ? { low: 'Slow decline', base: 'Base case', high: 'Fast decline' }
    : { low: 'Low demand', base: 'Base case', high: 'High demand' }

  const res = useMemo(
    () => decompose(forces, values, { dir: supply ? 'down' : 'up', dragValue: supply ? null : values[DRAG_FORCE.key] }),
    [forces, values, supply],
  )
  const sorted = [...res.rows].sort((a, b) => b.share - a.share)
  const maxShare = Math.max(...sorted.map((r) => r.share))
  const allRows = res.drag ? [...res.rows, res.drag] : res.rows
  const selRow = allRows.find((r) => r.key === selKey) || null

  return (
    <div className="panel">
      <Hint>Click any <strong>force name</strong> or <strong>bar on the chart</strong> to see what it contributes. Drag a slider to change the 2030 answer.</Hint>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <button className="btn" onClick={() => preset('low')}>{LABELS.low}</button>
        <button className="btn primary" onClick={() => preset('base')}>{LABELS.base}</button>
        <button className="btn" onClick={() => preset('high')}>{LABELS.high}</button>
      </div>

      <div className="grid grid-2" style={{ gap: 28 }}>
        <div>
          {forces.map((f) => (
            <ForceRow key={f.key} f={f} value={values[f.key]} selected={selKey === f.key} onSelect={setSelKey}
              onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
          ))}
          {!supply && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
              <ForceRow f={DRAG_FORCE} value={values[DRAG_FORCE.key]} dragMode selected={selKey === DRAG_FORCE.key} onSelect={setSelKey}
                onChange={(v) => setValues((s) => ({ ...s, [DRAG_FORCE.key]: v }))} />
              <div style={{ fontSize: 11.5, color: 'var(--accent-green)', paddingLeft: 10 }}>
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
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 8px' }}>
            Share of the total movement
          </div>
          {sorted.map((r) => (
            <div className="bar-row" key={r.key} onClick={() => setSelKey(selKey === r.key ? null : r.key)} style={{ cursor: 'pointer' }}>
              <div className="bar-label" style={{ width: 148, color: selKey === r.key ? 'var(--text)' : undefined }}>{r.name}</div>
              <div className="bar-track" style={{ height: 18 }}>
                <div className="bar-fill" style={{ width: `${(r.share / maxShare) * 100}%`, background: r.color, opacity: selKey && selKey !== r.key ? 0.4 : 1 }}>
                  <span className="bar-value">{(r.share * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          ))}
          {res.drag && (
            <div className="bar-row" onClick={() => setSelKey(selKey === res.drag.key ? null : res.drag.key)} style={{ cursor: 'pointer' }}>
              <div className="bar-label" style={{ width: 148, color: 'var(--accent-green)' }}>{res.drag.name}</div>
              <div className="bar-track" style={{ height: 18 }}>
                <div className="bar-fill" style={{ width: `${(Math.abs(res.drag.share) / maxShare) * 100}%`, background: 'var(--accent-green)', opacity: selKey && selKey !== res.drag.key ? 0.4 : 1 }}>
                  <span className="bar-value">{(res.drag.share * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>
            Shares are computed in log space — they sum to exactly 100% and don’t depend on order.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          One force at a time, 2026 → 2030 (log scale) — click a bar
        </div>
        <Waterfall walk={res.walk} dir={supply ? 'down' : 'up'} selKey={selKey} onSelect={setSelKey} />
      </div>

      <div style={{ marginTop: 12 }}>
        <ForceDetail f={selRow} share={selRow ? selRow.share : 0} dir={supply ? 'down' : 'up'} />
      </div>
    </div>
  )
}
