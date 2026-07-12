import React, { useState } from 'react'
import { Section, Block, Callout, DataTable } from './ui.jsx'
import { FINOPS_METRICS, TIMELINE_2030, GLOSSARY } from '../data.js'

const MOVES = [
  { n: '1', title: 'One gateway', desc: 'Centralise API access behind a single gateway that does metering, routing, caching and budget enforcement in one place. This single move eliminates shadow usage and makes every other lever enforceable.' },
  { n: '2', title: 'Unit economics', desc: 'Set cost targets per business outcome — cost per resolved ticket, per document processed, per code change — and make "cost per resolved task" a first-class product metric alongside latency and quality.' },
  { n: '3', title: 'Quarterly model reviews', desc: 'At ~10× annual deflation, last year’s model choice is almost certainly mispriced today. Architectures that abstract the model behind a routing layer capture the deflation automatically; hard-coded integrations pay a "model inertia" tax.' },
  { n: '4', title: 'Token budgets in design reviews', desc: 'Make token cost part of feature design review, exactly as cloud cost became part of architecture review a decade ago. Every agent ships with a per-task budget; every feature ships with a unit-cost estimate.' },
]

const LOOP = ['Meter', 'Optimise', 'Govern', 'Expand']

function OperatingLoop() {
  const [step, setStep] = useState(0)
  const DESC = [
    'Instrument everything: per-team keys, per-feature token counts, cache-hit rates, routing mix. You cannot optimise what you do not meter.',
    'Apply the lever stack of Module 06 — caching, routing, batching, context engineering — against measured baselines.',
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

function Glossary() {
  const [q, setQ] = useState('')
  const items = GLOSSARY.filter(
    (g) => !q || (g.term + g.meaning + g.why).toLowerCase().includes(q.toLowerCase()),
  )
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

const CONF_COLOR = {
  High: 'var(--accent-green)',
  'Medium-high': 'var(--accent-cyan)',
  Medium: 'var(--accent-yellow)',
  Directional: 'var(--accent-orange)',
}

export default function FinOpsFuture() {
  return (
    <Section
      id="finops"
      kicker="Module 08 · Governance & the future"
      title="Token FinOps — and the road to 2030"
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
            </div>
          ))}
        </div>
      </Block>

      <Block title="The minimum viable token-FinOps dashboard">
        <DataTable
          headers={['Metric', 'Definition', 'Why it matters']}
          rows={FINOPS_METRICS.map((m) => [m.name, m.def, m.why])}
        />
      </Block>

      <Block title="The trajectory to 2030" sub="Extrapolations from observable trends, not certainties — confidence indicated.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TIMELINE_2030.map((t) => (
            <div className="card" key={t.horizon} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, color: 'var(--accent-cyan)', width: 90, flexShrink: 0 }}>
                {t.horizon}
              </div>
              <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-dim)', minWidth: 240 }}>{t.dev}</div>
              <span className="chip" style={{ color: CONF_COLOR[t.confidence], borderColor: CONF_COLOR[t.confidence] + '66' }}>
                {t.confidence} confidence
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Callout title="The closing thought">
        Treat tokens as a managed resource: <strong>meter, route, cache and batch — then reinvest
        the savings in scale.</strong> The winning enterprise architecture is hybrid and
        policy-driven: small or open models for high-volume routine work; premium frontier models
        for hard cases; batch lanes for offline jobs; cached prefixes for repeated corpora; and
        private or regional deployment only where regulation justifies the uplift. Through 2025 the
        risk was overspending on AI. From here, the greater risk is under-consuming it.
      </Callout>

      <Block title="Glossary — the working vocabulary of token economics">
        <Glossary />
      </Block>
    </Section>
  )
}
