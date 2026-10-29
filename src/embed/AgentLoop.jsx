import React, { useEffect, useMemo, useRef, useState } from 'react'
import { OCT_TIERS, fmtPrice } from './deckData.js'
import { fmtUSD, fmtNum } from '../data.js'
import { Eyebrow, Range, Seg, Toggle, Kpi } from './primitives.jsx'
import { num, flag } from './presets.js'

// Slide 14 — "Agents pay for the same context again and again".
const BASE = 3000 // system prompt + tool schemas + task: re-sent at every step
const GROWTH = 600 // tool output and intermediate results added to the context per step
const OUT = 300 // output tokens per step
const COMPACT_CAP = 5000 // context ceiling when history is summarised between steps
const CHAT_OUT = 500
const CHAT = BASE + CHAT_OUT // one chat exchange: same prompt, one answer
const MAX_STEPS = 30
const BAND = [5, 30] // measured agentic range, × a chat exchange (Gartner)

const contextAt = (i, compact) => {
  const ctx = BASE + (i - 1) * GROWTH
  return compact ? Math.min(ctx, COMPACT_CAP) : ctx
}

function simulate(steps, compact) {
  const pts = []
  let cum = 0
  for (let i = 1; i <= steps; i++) {
    cum += contextAt(i, compact) + OUT
    pts.push({ i, cum })
  }
  return pts
}

// With caching, the stable prefix is written once (~1.25× input) and read at ~10% after that.
function taskCost(steps, compact, cache, tier) {
  let cost = 0
  for (let i = 1; i <= steps; i++) {
    const ctx = contextAt(i, compact)
    const prefixRate = !cache ? 1 : i === 1 ? 1.25 : 0.1
    cost += ((BASE * prefixRate + (ctx - BASE)) / 1e6) * tier.input + (OUT / 1e6) * tier.output
  }
  return cost
}

const W = 800, H = 200, PL = 46, PR = 14, PT = 12, PB = 24
const GHOST = simulate(MAX_STEPS, false)
const YMAX = GHOST[GHOST.length - 1].cum * 1.04
const x = (i) => PL + ((i - 1) / (MAX_STEPS - 1)) * (W - PL - PR)
const y = (v) => H - PB - (v / YMAX) * (H - PT - PB)
const toPath = (pts) => pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${x(p.i).toFixed(1)},${y(p.cum).toFixed(1)}`).join(' ')

export const SIZE = { w: 1200, h: 310 }

export default function AgentLoop({ init = {} }) {
  const [steps, setSteps] = useState(() => num(init.steps, 20, 1, MAX_STEPS))
  const [tierId, setTierId] = useState(() => (OCT_TIERS.some((t) => t.id === init.tier) ? init.tier : 'frontier'))
  const [compact, setCompact] = useState(() => flag(init.compact))
  const [cache, setCache] = useState(() => flag(init.cache))
  const [playing, setPlaying] = useState(false)
  const timer = useRef(null)
  const tier = OCT_TIERS.find((t) => t.id === tierId)

  // ▶ grows the loop step by step, so the room watches the curve bend
  const play = () => {
    if (playing) { clearInterval(timer.current); setPlaying(false); return }
    const target = steps > 1 ? steps : 20
    let i = 1
    setSteps(1)
    setPlaying(true)
    timer.current = setInterval(() => {
      i += 1
      setSteps(i)
      if (i >= target) { clearInterval(timer.current); setPlaying(false) }
    }, 120)
  }
  useEffect(() => () => clearInterval(timer.current), [])

  const pts = useMemo(() => simulate(steps, compact), [steps, compact])
  const cum = pts[pts.length - 1].cum
  const mult = cum / CHAT
  const cost = taskCost(steps, compact, cache, tier)
  const chatCost = (BASE / 1e6) * tier.input + (CHAT_OUT / 1e6) * tier.output
  const multColor = mult > BAND[1] ? 'var(--amber)' : mult >= BAND[0] ? 'var(--teal)' : 'var(--navy)'
  const multNote = mult > BAND[1] ? 'beyond the measured 5–30× range' : mult >= BAND[0] ? 'inside the measured 5–30× range' : 'below the measured 5–30× range'

  const area = toPath(pts) + ` L${x(steps)},${y(0)} L${x(1)},${y(0)} Z`
  const endX = x(steps), endY = y(cum)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 30, height: '100%', padding: '4px 6px' }}>
      {/* controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Eyebrow>Agent steps</Eyebrow>
            <button className={'de-btn' + (playing ? ' on' : '')} onClick={play}>{playing ? '■ Stop' : '▶ Play the loop'}</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '2px 0 6px' }}>
            <span style={{ fontSize: 34, fontWeight: 800, color: 'var(--navy)', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{steps}</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>plan → act → validate → repeat</span>
          </div>
          <Range value={steps} min={1} max={MAX_STEPS} onChange={(v) => { clearInterval(timer.current); setPlaying(false); setSteps(v) }} />
        </div>
        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Model tier · $ per 1M in / out</Eyebrow>
          <Seg
            value={tierId}
            onChange={setTierId}
            options={OCT_TIERS.map((t) => ({ value: t.id, label: t.label, sub: `${fmtPrice(t.input)} / ${fmtPrice(t.output)}` }))}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Toggle on={compact} onChange={setCompact}>Compact context between steps</Toggle>
          <Toggle on={cache} onChange={setCache}>Cache the stable prompt prefix</Toggle>
        </div>
        <div className="de-note">
          3K-token prompt re-sent every step, +600 tokens gathered per step, 300 out. Chat = 3K in + 500 out.
        </div>
      </div>

      {/* chart + readout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
          <defs>
            <linearGradient id="deAgentFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(18,104,179,0.22)" />
              <stop offset="100%" stopColor="rgba(18,104,179,0.02)" />
            </linearGradient>
          </defs>
          {[100000, 200000, 300000].map((g) => (
            <g key={g}>
              <line x1={PL} x2={W - PR} y1={y(g)} y2={y(g)} stroke="var(--line)" />
              <text x={PL - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="var(--faint)">{g / 1000}K</text>
            </g>
          ))}
          {/* measured range band */}
          <rect x={PL} width={W - PL - PR} y={y(CHAT * BAND[1])} height={y(CHAT * BAND[0]) - y(CHAT * BAND[1])} fill="rgba(0,153,153,0.09)" />
          <text x={PL + 8} y={y(CHAT * BAND[1]) - 6} fontSize="10.5" fontWeight="700" letterSpacing="0.08em" fill="var(--teal)">
            MEASURED AGENTIC RANGE · 5–30× A CHAT EXCHANGE
          </text>
          {/* where an uncompacted loop is heading */}
          <path d={toPath(GHOST)} fill="none" stroke="#c3cad4" strokeWidth="1.6" strokeDasharray="3 5" />
          <path d={area} fill="url(#deAgentFill)" />
          <path d={toPath(pts)} fill="none" stroke="var(--blue)" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" />
          <line x1={PL} x2={W - PR} y1={y(CHAT)} y2={y(CHAT)} stroke="var(--teal)" strokeWidth="1.5" strokeDasharray="5 4" />
          <text x={W - PR} y={y(CHAT) - 5} textAnchor="end" fontSize="10.5" fill="var(--teal)">one chat exchange · {fmtNum(CHAT)} tokens</text>
          <circle cx={endX} cy={endY} r="5.5" fill="#fff" stroke="var(--blue)" strokeWidth="3" />
          <text x={endX + (steps > 22 ? -10 : 10)} y={endY - 8} textAnchor={steps > 22 ? 'end' : 'start'} fontSize="13" fontWeight="800" fill="var(--navy)">
            {fmtNum(cum)} tokens
          </text>
          {[1, 10, 20, 30].map((s) => (
            <text key={s} x={x(s)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--faint)">step {s}</text>
          ))}
        </svg>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <Kpi label="Tokens paid · one task" value={fmtNum(cum)} sub={`vs ${fmtNum(CHAT)} for one chat exchange`} />
          <Kpi label="Agentic multiplier" value={`${mult.toFixed(mult < 10 ? 1 : 0)}×`} color={multColor} sub={multNote} />
          <Kpi label={`Cost per task · ${tier.label}`} value={fmtUSD(cost, cost < 0.1 ? 3 : 2)} sub={`${fmtUSD(cost * 10000)} per 10K tasks · chat ${fmtUSD(chatCost, 3)}`} />
        </div>
      </div>
    </div>
  )
}
