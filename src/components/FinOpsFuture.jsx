import React, { useState } from 'react'
import { Section, Block, Callout, DataTable, More } from './ui.jsx'
import { FINOPS_METRICS, TOOL_STACK, OPERATING_MODEL } from '../data.js'

const MOVES = [
  { n: '1', title: 'One gateway', desc: 'All API access through a single gateway: metering, routing, caching, budgets.',
    deep: 'This single move eliminates shadow usage and makes every other lever enforceable — it is the non-negotiable first step.' },
  { n: '2', title: 'Unit economics', desc: 'Make "cost per resolved task" a first-class product metric.',
    deep: 'Set cost targets per business outcome — per resolved ticket, per document processed, per code change — alongside latency and quality. It is the only number that connects spend to value.' },
  { n: '3', title: 'Quarterly model reviews', desc: 'At ~10× annual deflation, last year’s model choice is mispriced today.',
    deep: 'Architectures that abstract the model behind a routing layer capture the deflation automatically; hard-coded single-vendor integrations pay a "model inertia" tax.' },
  { n: '4', title: 'Token budgets in design reviews', desc: 'Every agent ships with a per-task budget; every feature with a unit-cost estimate.',
    deep: 'Token cost joins feature design review exactly as cloud cost joined architecture review a decade ago — before launch, not after the bill arrives.' },
]

const LOOP = ['Meter', 'Optimise', 'Govern', 'Expand']

function OperatingLoop() {
  const [step, setStep] = useState(0)
  const DESC = [
    'Instrument everything: per-team keys, per-feature token counts, cache-hit rates, routing mix. You cannot optimise what you do not meter.',
    'Apply the lever stack of Module 07 — caching, routing, batching, context engineering — against measured baselines.',
    'Enforce budgets, review quarterly against a repricing market, and hold teams accountable for spend against allocation.',
    'Reinvest the savings in scale. The strategic risk has inverted: under-consuming AI is now the bigger danger than overspending on it.',
  ]
  return (
    <div className="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {LOOP.map((l, i) => (
          <React.Fragment key={l}>
            <button
              className="btn"
              style={{
                borderColor: step === i ? 'var(--accent-cyan)' : undefined,
                color: step === i ? 'var(--accent-cyan)' : undefined,
                background: step === i ? 'rgba(56,209,224,0.08)' : undefined,
              }}
              onClick={() => setStep(i)}
            >
              {l}
            </button>
            {i < LOOP.length - 1 && <span style={{ color: 'var(--text-faint)' }}>→</span>}
          </React.Fragment>
        ))}
        <span style={{ color: 'var(--text-faint)' }}>↺ quarterly</span>
      </div>
      <div style={{ marginTop: 16, fontSize: 14, color: 'var(--text-dim)', minHeight: 48 }}>{DESC[step]}</div>
    </div>
  )
}

function ToolStackViz() {
  const [sel, setSel] = useState(0)
  const cur = TOOL_STACK[sel]
  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 26 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TOOL_STACK.map((t, i) => (
            <button
              key={t.layer}
              onClick={() => setSel(i)}
              className="card"
              style={{
                padding: '12px 16px', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit',
                borderColor: i === sel ? t.color : undefined,
                borderLeftWidth: 4, borderLeftColor: t.color,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13.5, color: i === sel ? t.color : 'var(--text)' }}>{t.layer}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>{t.role}</div>
            </button>
          ))}
        </div>
        <div className="card" style={{ padding: 18, borderColor: cur.color + '66' }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: cur.color, fontWeight: 700, marginBottom: 8 }}>
            {cur.layer}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>{cur.role}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Representative tools (2026)
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--text)', marginBottom: 12 }}>{cur.tools}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>💡 {cur.note}</div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 12 }}>
        Build-vs-buy is mostly a buy (or adopt) question — most layers have credible open-source
        options. The gateway is the non-negotiable layer; the rest attach to it.
      </div>
    </div>
  )
}

export default function FinOpsFuture() {
  return (
    <Section
      id="finops"
      kicker="Module 08 · Governance"
      title="Token FinOps — the operating discipline"
      lede={
        <>
          The FinOps Foundation ranks AI cost management as the top forward-looking priority for
          2026. The discipline enterprise IT applied to cloud spend between 2018 and 2022 now
          applies to tokens — with one difference: at ~10× annual deflation, the review cycle must
          be <strong>quarterly, not annual</strong>.
        </>
      }
    >
      <Block title="The operating loop" sub="Click through the four phases — refreshed quarterly.">
        <OperatingLoop />
      </Block>

      <Block title="The four governance moves that matter">
        <div className="grid grid-2">
          {MOVES.map((m) => (
            <div className="card" key={m.n}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 22, color: 'var(--accent-violet)', fontWeight: 600 }}>{m.n}</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{m.title}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 8 }}>{m.desc}</div>
              <More>{m.deep}</More>
            </div>
          ))}
        </div>
      </Block>

      <Block title="The tool stack" sub="Four layers, click each — none of the governance moves require building infrastructure from scratch.">
        <ToolStackViz />
      </Block>

      <Block title="The minimum viable token-FinOps dashboard">
        <DataTable
          headers={['Metric', 'Definition', 'Why it matters']}
          rows={FINOPS_METRICS.map((m) => [m.name, m.def, m.why])}
        />
      </Block>

      <Block title="Who owns what" sub="The operating model matters more than the tools — and the clock speed is quarterly, not annual.">
        <DataTable
          headers={['Who', 'Owns', 'Cadence']}
          rows={OPERATING_MODEL.map((o) => [
            o.who,
            o.owns,
            <span style={{ fontFamily: 'var(--mono)', color: 'var(--accent-cyan)' }}>{o.cadence}</span>,
          ])}
        />
      </Block>

      <Callout tone="green" title="Why the cadence is the whole game">
        At ~10× annual deflation, an annual review cadence guarantees systematic overpayment — this
        is cloud FinOps, <strong>run four times as fast</strong>.
      </Callout>
    </Section>
  )
}
