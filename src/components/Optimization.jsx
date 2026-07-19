import React, { useMemo, useState } from 'react'
import { Section, Block, Slider, ResultStrip, DataTable, More } from './ui.jsx'
import { fmtUSD } from '../data.js'

// Baseline workload: 500K requests/mo on a flagship API, no optimisation.
const REQ = 500_000
const IN_TOK = 3000
const OUT_TOK = 600
const FLAG = { input: 10, output: 30 }
const VALUE = { input: 0.15, output: 0.6 }

function computeBill(levers) {
  const { semHit, ctxTrim, route, cacheHit, batchShare, outTrim } = levers
  // requests served entirely from semantic cache cost ~nothing
  const req = REQ * (1 - semHit / 100)
  const inTok = IN_TOK * (1 - ctxTrim / 100)
  const outTok = OUT_TOK * (1 - outTrim / 100)

  const split = [
    { share: 1 - route / 100, price: FLAG },
    { share: route / 100, price: VALUE },
  ]

  let bill = 0
  for (const s of split) {
    if (s.share <= 0) continue
    const nReq = req * s.share
    // cached input billed at 10% of the input rate
    const inCost = (nReq * inTok / 1e6) * s.price.input * (1 - (cacheHit / 100) * 0.9)
    const outCost = (nReq * outTok / 1e6) * s.price.output
    let sub = inCost + outCost
    // batch lane: 50% off the batch-eligible share
    sub *= 1 - (batchShare / 100) * 0.5
    bill += sub
  }
  return bill
}

const LEVER_DEFS = [
  { key: 'cacheHit', label: 'Prompt caching', unit: 'cache-hit rate', max: 90, color: 'var(--accent-cyan)', hint: 'Stable prefixes (system prompt, tool schemas, documents) billed at ~10% of the input rate' },
  { key: 'route', label: 'Model routing', unit: 'traffic to value tier', max: 70, color: 'var(--accent-violet)', hint: '50–70% of requests are handled equally well by the cheapest capable tier' },
  { key: 'batchShare', label: 'Batch APIs', unit: 'traffic through 50%-off lanes', max: 60, color: 'var(--accent-green)', hint: 'Documents, ETL, evaluations, reports — anything that can wait hours' },
  { key: 'ctxTrim', label: 'Context engineering', unit: 'input tokens trimmed', max: 40, color: 'var(--accent-orange)', hint: 'Trim prompts, summarise histories, retrieve snippets not documents' },
  { key: 'semHit', label: 'Semantic caching', unit: 'repeat queries served from cache', max: 30, color: 'var(--accent-yellow)', hint: '~31% hit rates measured on FAQ-like enterprise workloads' },
  { key: 'outTrim', label: 'Output control', unit: 'output tokens saved', max: 30, color: 'var(--accent-pink)', hint: 'Cap max output, request terse formats, avoid reasoning tiers for routine tasks' },
]

const PRESET_OFF = { cacheHit: 0, route: 0, batchShare: 0, ctxTrim: 0, semHit: 0, outTrim: 0 }
const PRESET_TYPICAL = { cacheHit: 50, route: 40, batchShare: 20, ctxTrim: 15, semHit: 10, outTrim: 10 }
const PRESET_MAX = { cacheHit: 90, route: 70, batchShare: 60, ctxTrim: 40, semHit: 30, outTrim: 30 }

function Playground() {
  const [levers, setLevers] = useState(PRESET_TYPICAL)
  const baseline = useMemo(() => computeBill(PRESET_OFF), [])
  const bill = useMemo(() => computeBill(levers), [levers])
  const saved = baseline - bill
  const pct = (saved / baseline) * 100

  // incremental waterfall: apply levers one at a time in order
  const waterfall = useMemo(() => {
    const steps = []
    let acc = { ...PRESET_OFF }
    let prev = baseline
    for (const def of LEVER_DEFS) {
      acc = { ...acc, [def.key]: levers[def.key] }
      const b = computeBill(acc)
      steps.push({ ...def, saving: prev - b })
      prev = b
    }
    return steps
  }, [levers, baseline])

  const set = (key) => (v) => setLevers((l) => ({ ...l, [key]: v }))

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <button className="btn" onClick={() => setLevers(PRESET_OFF)}>No optimisation</button>
        <button className="btn" onClick={() => setLevers(PRESET_TYPICAL)}>Typical production stack</button>
        <button className="btn" onClick={() => setLevers(PRESET_MAX)}>Everything maxed</button>
      </div>

      <div className="grid grid-2" style={{ gap: 32 }}>
        <div>
          {LEVER_DEFS.map((d) => (
            <div key={d.key} style={{ marginBottom: 4 }}>
              <Slider
                label={<span><span style={{ color: d.color, fontWeight: 600 }}>{d.label}</span> · {d.unit}</span>}
                value={levers[d.key]} min={0} max={d.max}
                display={`${levers[d.key]}%`}
                onChange={set(d.key)}
              />
            </div>
          ))}
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Baseline: 500K requests/mo · 3,000 in + 600 out tokens · flagship API ($10/$30 per M) · no discounts.
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
            <div className="result-item">
              <div className="r-label">Baseline bill</div>
              <div className="r-value" style={{ color: 'var(--accent-pink)', fontSize: 26 }}>{fmtUSD(baseline)}/mo</div>
            </div>
            <div className="result-item">
              <div className="r-label">Optimised bill</div>
              <div className="r-value" style={{ color: 'var(--accent-green)', fontSize: 26 }}>{fmtUSD(bill)}/mo</div>
            </div>
            <div className="result-item">
              <div className="r-label">Saved</div>
              <div className="r-value" style={{ fontSize: 26 }}>{pct.toFixed(0)}%</div>
              <div className="r-note">{fmtUSD(saved)}/mo · {fmtUSD(saved * 12)}/yr</div>
            </div>
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Where the savings come from
          </div>
          {waterfall.map((w) => (
            <div className="bar-row" key={w.key}>
              <div className="bar-label">{w.label}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.max(w.saving > 0 ? 2 : 0, (w.saving / baseline) * 100)}%`, background: w.color }}>
                  <span className="bar-value">{w.saving > baseline * 0.002 ? fmtUSD(w.saving) : ''}</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
            Incremental savings, applied in order — levers compound, so later levers save less in
            absolute terms on an already-smaller bill.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-dim)' }}>
        {pct < 5 && 'This is the unoptimised default most teams start with — 100% flagship, zero discounts.'}
        {pct >= 5 && pct < 45 && 'A decent start. The report’s production teams routinely reach 50–70% with the first five levers.'}
        {pct >= 45 && pct < 70 && '✓ This matches the report’s findings: the first five levers routinely deliver 50–70% without capability loss.'}
        {pct >= 70 && '✓ Deep-optimisation territory (60–80%+ reported in production). Beyond this, the next step is distillation or self-hosting — see below.'}
      </div>
    </div>
  )
}

function BreakEven() {
  const [spend, setSpend] = useState(12) // $K/mo API spend on open-model-capable workloads
  const FIXED = 12 // $K/mo: engineering + ops overhead for self-hosting
  const VAR = 0.22 // self-host variable cost as fraction of API spend
  const selfHost = FIXED + spend * VAR
  const savings = spend - selfHost
  const breakEven = FIXED / (1 - VAR) // ≈ 15.4

  const W = 640, H = 250, pad = 50
  const maxX = 60
  const x = (s) => pad + (s / maxX) * (W - 2 * pad)
  const y = (c) => H - pad - (c / maxX) * (H - 2 * pad)

  return (
    <div className="panel">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {[0, 15, 30, 45, 60].map((g) => (
          <g key={g}>
            <line x1={x(g)} y1={pad - 6} x2={x(g)} y2={H - pad} stroke="var(--border)" />
            <text x={x(g)} y={H - pad + 18} fill="var(--text-faint)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">${g}K</text>
          </g>
        ))}
        {/* API cost = y=x line */}
        <line x1={x(0)} y1={y(0)} x2={x(maxX)} y2={y(maxX)} stroke="var(--accent-pink)" strokeWidth="3" strokeLinecap="round" />
        {/* self-host line */}
        <line x1={x(0)} y1={y(FIXED)} x2={x(maxX)} y2={y(FIXED + maxX * VAR)} stroke="var(--accent-green)" strokeWidth="3" strokeLinecap="round" />
        <line x1={x(breakEven)} y1={pad - 4} x2={x(breakEven)} y2={H - pad} stroke="var(--accent-yellow)" strokeDasharray="4 4" />
        <text x={x(breakEven)} y={pad - 10} fill="var(--accent-yellow)" fontSize="11" textAnchor="middle" fontFamily="var(--mono)">
          break-even ≈ ${breakEven.toFixed(0)}K/mo
    </text>
        <text x={x(maxX) - 4} y={y(maxX) - 8} fill="var(--accent-pink)" fontSize="11.5" textAnchor="end" fontWeight="600">stay on APIs</text>
        <text x={x(maxX) - 4} y={y(FIXED + maxX * VAR) + 18} fill="var(--accent-green)" fontSize="11.5" textAnchor="end" fontWeight="600">self-host open weights</text>
        <circle cx={x(spend)} cy={y(spend)} r="6" fill="var(--accent-pink)" stroke="var(--bg)" strokeWidth="2" />
        <circle cx={x(spend)} cy={y(selfHost)} r="6" fill="var(--accent-green)" stroke="var(--bg)" strokeWidth="2" />
      </svg>
      <Slider label="Your steady monthly API spend on workloads an open model can handle" value={spend} min={1} max={60}
        display={`$${spend}K/mo`} onChange={setSpend} />
      <ResultStrip items={[
        { label: 'Self-host total cost', value: `$${selfHost.toFixed(1)}K/mo`, note: `$${FIXED}K fixed ops + ~${Math.round(VAR * 100)}% variable` },
        savings > 0.5
          ? { label: 'Verdict', value: `save $${savings.toFixed(1)}K/mo`, color: 'var(--accent-green)', note: 'self-hosting is economically rational' }
          : { label: 'Verdict', value: 'stay on APIs', color: 'var(--accent-pink)', note: 'overhead exceeds savings below the threshold' },
      ]} />
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 12 }}>
        Rule of thumb: self-hosting becomes rational at roughly{' '}
        <strong style={{ color: 'var(--text)' }}>$15–20K/month</strong> of steady, open-model-capable spend.
      </div>
      <More label="The pragmatic middle path">
        Open weights on commodity hosts capture marginal-cost pricing without operating GPUs — and
        the portability doubles as negotiating leverage with every other vendor.
      </More>
    </div>
  )
}

function DistillationCalc() {
  const [spend, setSpend] = useState(20) // $K/mo frontier spend on one narrow workload
  const PROJECT = 40 // $K one-time: data curation, tuning runs, evaluation
  const SERVE_FRACTION = 0.1 // distilled small model serves at ~1/10th the cost
  const after = spend * SERVE_FRACTION
  const saving = spend - after
  const payback = PROJECT / saving
  const net12 = saving * 12 - PROJECT

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="Monthly frontier-API spend on one narrow, high-volume task" value={spend} min={2} max={100} step={1}
            display={`$${spend}K/mo`} onChange={setSpend} />
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
            One-time project ~${PROJECT}K; the distilled model then serves at ~10% of frontier cost.
          </div>
          <More label="Behind the assumptions">
            The project cost covers data curation, tuning runs and evaluation; “up to 10× cheaper
            on that workload” is the report’s distillation figure. QLoRA-era tuning fits on one
            workstation GPU — thousands of dollars, not millions.
          </More>
        </div>
        <div>
          <div className="bar-row">
            <div className="bar-label">Before — frontier API</div>
            <div className="bar-track" style={{ height: 26 }}>
              <div className="bar-fill" style={{ width: '100%', background: 'var(--accent-pink)' }}>
                <span className="bar-value">${spend}K/mo</span>
              </div>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">After — distilled model</div>
            <div className="bar-track" style={{ height: 26 }}>
              <div className="bar-fill" style={{ width: `${SERVE_FRACTION * 100}%`, background: 'var(--accent-green)' }}>
                <span className="bar-value">${after.toFixed(1)}K</span>
              </div>
            </div>
          </div>
          <ResultStrip items={[
            { label: 'Monthly saving', value: `$${saving.toFixed(1)}K`, color: 'var(--accent-green)' },
            { label: 'Project pays back in', value: payback > 24 ? '>24 mo' : `${payback.toFixed(1)} mo`, color: payback <= 6 ? 'var(--accent-green)' : payback <= 12 ? 'var(--accent-yellow)' : 'var(--accent-pink)', note: `$${PROJECT}K one-time project` },
            { label: '12-month net', value: `${net12 >= 0 ? '+' : '−'}$${Math.abs(net12).toFixed(0)}K`, color: net12 >= 0 ? 'var(--accent-green)' : 'var(--accent-pink)' },
          ]} />
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
            {payback <= 4 && 'Clear yes — high-volume routine tasks are the end-game for distillation.'}
            {payback > 4 && payback <= 12 && 'Worth scoping — the economics work if the task stays stable for a year.'}
            {payback > 12 && 'Not yet — below this volume, routing and caching (above) capture most of the saving with no project risk.'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Optimization() {
  return (
    <Section
      id="optimize"
      kicker="Module 07 · The playbook"
      title="The optimization playground"
      lede={
        <>
          The most effective strategy is almost never “pick the cheapest model.” It is to align
          model quality, traffic pattern and SLA to the <strong>cheapest acceptable serving
          path</strong>. Pull the six levers below on a simulated enterprise bill — the prerequisite
          for all of them is measurement: you cannot optimise what you do not meter.
        </>
      }
    >
      <Block title="Pull the levers" sub="A simulated 500K-request/month flagship workload. Every lever mirrors a discount or technique from the report.">
        <Playground />
      </Block>

      <Block title="The big three, in practice">
        <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          <div className="card">
            <div className="big-num" style={{ color: 'var(--accent-cyan)' }}>~90% off</div>
            <div style={{ fontWeight: 600, fontSize: 13.5, margin: '4px 0' }}>Prompt caching</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Underused because teams optimise prompts for quality, not repetition — make cache-hit rate a top-level metric.</div>
          </div>
          <div className="card">
            <div className="big-num" style={{ color: 'var(--accent-violet)' }}>½ the bill</div>
            <div style={{ fontWeight: 600, fontSize: 13.5, margin: '4px 0' }}>Model routing</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>The highest-leverage single decision: 70% of a flagship workload on a capable mini tier roughly halves the bill.</div>
          </div>
          <div className="card">
            <div className="big-num" style={{ color: 'var(--accent-green)' }}>50% off</div>
            <div style={{ fontWeight: 600, fontSize: 13.5, margin: '4px 0' }}>Batch lanes</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Free money for anything that can wait — batch + caching together reach ~25% of list price.</div>
          </div>
        </div>
      </Block>

      <Block
        title="Distillation: the 80%+ tier"
        sub="Compress a frontier model's behaviour on one narrow task into a small open model. When does the project pay for itself?"
      >
        <DistillationCalc />
      </Block>

      <Block
        title="The self-hosting break-even"
        sub="Above the first five levers sits the 80%+ tier: distillation and self-hosting. When does running your own GPUs beat the API?"
      >
        <BreakEven />
      </Block>

      <Block title="When each side wins">
        <DataTable
          headers={['Favours self-hosting', 'Favours staying on APIs']}
          rows={[
            ['High-volume, steady traffic (good batching economics)', 'Spiky, latency-sensitive traffic (poor utilisation)'],
            ['Relaxed latency requirements', 'Capability needs that track the frontier'],
            ['Data-residency or air-gap requirements add real value', 'Scarce GPU-operations talent'],
            ['Narrow tasks a distilled model can absorb', 'Spend below the ~$15–20K/month threshold'],
          ]}
        />
      </Block>
    </Section>
  )
}
