import React, { useState } from 'react'
import { Section, Block, Callout, Hint, More } from './ui.jsx'
import { FINOPS_METRICS, TOOL_STACK, OPERATING_MODEL } from '../data.js'

const MOVES = [
  { n: '1', icon: '🚪', title: 'One gateway', desc: 'All API access through a single door: metering, routing, caching, budgets.',
    deep: 'This single move eliminates shadow usage and makes every other lever enforceable — it is the non-negotiable first step.' },
  { n: '2', icon: '🎯', title: 'Unit economics', desc: 'Make "cost per resolved task" a first-class product metric.',
    deep: 'Set cost targets per business outcome — per resolved ticket, per document processed, per code change — alongside latency and quality. It is the only number that connects spend to value.' },
  { n: '3', icon: '🔄', title: 'Quarterly model reviews', desc: 'At ~10× annual deflation, last year’s model choice is mispriced today.',
    deep: 'Architectures that abstract the model behind a routing layer capture the deflation automatically; hard-coded single-vendor integrations pay a "model inertia" tax.' },
  { n: '4', icon: '📐', title: 'Token budgets in design reviews', desc: 'Every agent ships with a per-task budget; every feature with a unit-cost estimate.',
    deep: 'Token cost joins feature design review exactly as cloud cost joined architecture review a decade ago — before launch, not after the bill arrives.' },
]

const LOOP = [
  { l: 'Meter', icon: '📏', d: 'Instrument everything: per-team keys, per-feature token counts, cache-hit rates, routing mix. You cannot optimise what you do not meter.' },
  { l: 'Optimise', icon: '🎚', d: 'Apply the lever stack of Module 08 — caching, routing, batching, context engineering — against measured baselines.' },
  { l: 'Govern', icon: '🛡', d: 'Enforce budgets, review quarterly against a repricing market, and hold teams accountable for spend against allocation.' },
  { l: 'Expand', icon: '🚀', d: 'Reinvest the savings in scale. The strategic risk has inverted: under-consuming AI is now the bigger danger than overspending.' },
]

function OperatingLoop() {
  const [step, setStep] = useState(0)
  return (
    <div className="panel">
      <Hint>Click each phase. The loop runs <strong>quarterly</strong>, not annually — the market reprices too fast for an annual cycle.</Hint>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {LOOP.map((l, i) => (
          <React.Fragment key={l.l}>
            <button
              className="btn"
              style={{
                borderColor: step === i ? 'var(--accent-cyan)' : undefined,
                color: step === i ? 'var(--accent-cyan)' : undefined,
                background: step === i ? 'rgba(56,209,224,0.08)' : undefined,
              }}
              onClick={() => setStep(i)}
            >
              {l.icon} {l.l}
            </button>
            {i < LOOP.length - 1 && <span style={{ color: 'var(--text-faint)' }}>→</span>}
          </React.Fragment>
        ))}
        <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>↺ quarterly</span>
      </div>
      <div style={{ marginTop: 14, fontSize: 13.5, color: 'var(--text-dim)', minHeight: 44 }}>{LOOP[step].d}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* A dashboard that behaves like one                                   */
/* ------------------------------------------------------------------ */
const METRIC_META = {
  'Cost per resolved task': { icon: '🎯', value: '$0.42', trend: '▲ 8%', status: 'warn', target: 'target < $0.35' },
  'Cache-hit rate': { icon: '⚡', value: '31%', trend: '▲ 4pt', status: 'warn', target: 'target > 60%' },
  'Routing mix': { icon: '🔀', value: '22%', trend: '▲ 2pt', status: 'bad', target: 'target 50–70% on cheapest tier' },
  'Batch share': { icon: '📦', value: '12%', trend: '— flat', status: 'bad', target: 'target > 40% of eligible' },
  'Output/input ratio': { icon: '⚖️', value: '0.31', trend: '▼ 0.04', status: 'good', target: 'watch for verbosity creep' },
  'Waste indicators': { icon: '🚨', value: '3 alerts', trend: '▲ 1', status: 'warn', target: 'retries, loop overruns, p99 context' },
  'Spend vs budget by team': { icon: '💰', value: '94%', trend: '▲ 6pt', status: 'good', target: 'of monthly allocation' },
}
const STATUS_COLOR = { good: 'var(--accent-green)', warn: 'var(--accent-yellow)', bad: 'var(--accent-pink)' }

function Dashboard() {
  const [sel, setSel] = useState(null)
  const cur = FINOPS_METRICS.find((m) => m.name === sel)
  return (
    <div className="panel">
      <Hint>This is what the screen looks like in practice. Click any tile to see what the metric means and why it earns its place.</Hint>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
        {FINOPS_METRICS.map((m) => {
          const meta = METRIC_META[m.name] || {}
          const c = STATUS_COLOR[meta.status] || 'var(--text-dim)'
          return (
            <button
              key={m.name}
              onClick={() => setSel(sel === m.name ? null : m.name)}
              className="card"
              style={{
                cursor: 'pointer', textAlign: 'left', padding: '12px 14px', font: 'inherit', color: 'inherit',
                borderColor: sel === m.name ? 'var(--accent-cyan)' : undefined,
                borderLeft: `3px solid ${c}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 15 }}>{meta.icon}</span>
                <span style={{ fontSize: 10.5, color: c, fontFamily: 'var(--mono)' }}>{meta.trend}</span>
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 700, color: c, margin: '2px 0' }}>{meta.value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontWeight: 600 }}>{m.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{meta.target}</div>
            </button>
          )
        })}
      </div>
      <div className="popcard" style={{ marginTop: 12, minHeight: 78 }}>
        {cur ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--accent-cyan)', marginBottom: 6 }}>
              {METRIC_META[cur.name]?.icon} {cur.name}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 6 }}><strong>What it is:</strong> {cur.def}</div>
            <div style={{ fontSize: 12.5, color: 'var(--accent-green)' }}><strong>Why it matters:</strong> {cur.why}</div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            Sample values shown. <span style={{ color: STATUS_COLOR.good }}>●</span> on target ·{' '}
            <span style={{ color: STATUS_COLOR.warn }}>●</span> needs attention ·{' '}
            <span style={{ color: STATUS_COLOR.bad }}>●</span> off target. Click a tile for the definition.
          </div>
        )}
      </div>
    </div>
  )
}

const TOOL_ICONS = { 'AI gateway': '🚪', 'Model router / aggregator': '🔀', 'Observability & evaluation': '🔬', 'Caching & optimisation': '⚡' }

function ToolStackViz() {
  const [sel, setSel] = useState(0)
  const cur = TOOL_STACK[sel]
  return (
    <div className="panel">
      <Hint>Four layers. Click one to see what it does and who supplies it — the gateway is the only non-negotiable.</Hint>
      <div className="grid grid-2" style={{ gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TOOL_STACK.map((t, i) => (
            <button
              key={t.layer}
              onClick={() => setSel(i)}
              className="card"
              style={{
                padding: '11px 14px', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit',
                borderColor: i === sel ? t.color : undefined,
                borderLeft: `4px solid ${t.color}`,
              }}
            >
              <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
                <span style={{ fontSize: 17 }}>{TOOL_ICONS[t.layer]}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: i === sel ? t.color : 'var(--text)' }}>{t.layer}</span>
                {i === 0 && <span className="chip" style={{ fontSize: 9.5, color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)' }}>essential</span>}
              </div>
            </button>
          ))}
        </div>
        <div className="popcard" style={{ borderColor: cur.color + '66' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: cur.color, fontWeight: 700, marginBottom: 8 }}>
            {TOOL_ICONS[cur.layer]} {cur.layer}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 10 }}>{cur.role}</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', marginBottom: 10 }}>{cur.tools}</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>💡 {cur.note}</div>
        </div>
      </div>
    </div>
  )
}

const OWNER_ICONS = { 'Platform engineering': '⚙️', 'Product teams': '📦', 'Finance / FinOps': '💰', 'Architecture review board': '🏛' }
const CADENCE_COLOR = { Continuous: 'var(--accent-green)', 'Per release': 'var(--accent-cyan)', Monthly: 'var(--accent-violet)', Quarterly: 'var(--accent-orange)' }

function WhoOwnsWhat() {
  const [sel, setSel] = useState(null)
  return (
    <div className="panel">
      <Hint>Four owners, four clock speeds. Click a role to see exactly what sits on their desk.</Hint>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {OPERATING_MODEL.map((o) => (
          <button
            key={o.who}
            onClick={() => setSel(sel === o.who ? null : o.who)}
            className="card"
            style={{
              cursor: 'pointer', textAlign: 'left', padding: '13px 14px', font: 'inherit', color: 'inherit',
              borderColor: sel === o.who ? CADENCE_COLOR[o.cadence] : undefined,
            }}
          >
            <div style={{ fontSize: 20 }}>{OWNER_ICONS[o.who]}</div>
            <div style={{ fontWeight: 700, fontSize: 12.5, margin: '5px 0 4px' }}>{o.who}</div>
            <span className="chip" style={{ fontSize: 10, color: CADENCE_COLOR[o.cadence], borderColor: CADENCE_COLOR[o.cadence] + '66' }}>
              {o.cadence}
            </span>
          </button>
        ))}
      </div>
      <div className="popcard" style={{ marginTop: 12, minHeight: 62 }}>
        {sel ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>
              {OWNER_ICONS[sel]} {sel} owns:
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{OPERATING_MODEL.find((o) => o.who === sel).owns}</div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            The same pattern as cloud FinOps — but run four times as fast. Click a role above.
          </div>
        )}
      </div>
    </div>
  )
}

export default function FinOpsFuture() {
  return (
    <Section
      id="finops"
      kicker="Module 09 · Governance"
      title="Token FinOps — the operating discipline"
      lede={
        <>
          The discipline enterprise IT applied to cloud spend now applies to tokens — with one
          difference: at ~10× annual deflation, the review cycle must be{' '}
          <strong>quarterly, not annual</strong>.
        </>
      }
    >
      <Block title="The operating loop">
        <OperatingLoop />
      </Block>

      <Block title="The four moves that matter" sub="Click any card for the reasoning.">
        <div className="grid grid-2">
          {MOVES.map((m) => (
            <div className="card" key={m.n}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 18, color: 'var(--accent-violet)', fontWeight: 600 }}>{m.n}</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{m.title}</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 7 }}>{m.desc}</div>
              <More>{m.deep}</More>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Your dashboard" sub="The seven numbers worth putting on a screen.">
        <Dashboard />
      </Block>

      <Block title="The tool stack">
        <ToolStackViz />
      </Block>

      <Block title="Who owns what">
        <WhoOwnsWhat />
      </Block>

      <Callout tone="green" title="Why the cadence is the whole game">
        At ~10× annual deflation, an annual review cadence guarantees systematic overpayment — this
        is cloud FinOps, <strong>run four times as fast</strong>.
      </Callout>
    </Section>
  )
}
