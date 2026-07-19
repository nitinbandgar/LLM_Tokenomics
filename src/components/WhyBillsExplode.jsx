import React, { useMemo, useState } from 'react'
import { Section, Block, Slider, Seg, ResultStrip, Callout, DataTable, More } from './ui.jsx'
import { FAILURE_MODES, fmtUSD, fmtNum } from '../data.js'

const TIERS = [
  { value: 'flagship', label: 'Flagship', input: 10, output: 30 },
  { value: 'mid', label: 'Mid tier', input: 3, output: 15 },
  { value: 'value', label: 'Value tier', input: 0.15, output: 0.6 },
]

function AgentLoopViz() {
  const [steps, setSteps] = useState(20)
  const [tier, setTier] = useState('flagship')
  const t = TIERS.find((x) => x.value === tier)

  const BASE = 3000 // system prompt + tools + task
  const GROWTH = 900 // context added per step (tool output + response)
  const OUT = 350 // output per step

  const series = useMemo(() => {
    let cumIn = 0, cumOut = 0
    const pts = []
    for (let i = 1; i <= steps; i++) {
      cumIn += BASE + (i - 1) * GROWTH // the whole accumulated context, re-sent
      cumOut += OUT
      pts.push({ step: i, cum: cumIn + cumOut, cumIn, cumOut })
    }
    return pts
  }, [steps])

  const last = series[series.length - 1]
  const chatTokens = BASE + OUT
  const agentCost = (last.cumIn / 1e6) * t.input + (last.cumOut / 1e6) * t.output
  const chatCost = (BASE / 1e6) * t.input + (OUT / 1e6) * t.output
  const mult = last.cum / chatTokens

  // chart
  const W = 640, H = 260, pad = 48
  const maxY = last.cum
  const x = (i) => pad + ((i - 1) / Math.max(1, steps - 1)) * (W - 2 * pad)
  const y = (v) => H - pad - (v / maxY) * (H - 2 * pad)
  const path = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.step)},${y(p.cum)}`).join(' ')
  const area = path + ` L${x(steps)},${H - pad} L${x(1)},${H - pad} Z`

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ flex: '1 1 260px' }}>
          <Slider label="Agent steps (plan → tool call → validate → retry…)" value={steps} min={1} max={40}
            display={`${steps} steps`} onChange={setSteps} />
        </div>
        <Seg options={TIERS.map((x) => ({ value: x.value, label: x.label }))} value={tier} onChange={setTier} />
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="agentArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(244,114,182,0.35)" />
            <stop offset="100%" stopColor="rgba(244,114,182,0.02)" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#agentArea)" />
        <path d={path} fill="none" stroke="var(--accent-pink)" strokeWidth="3" strokeLinecap="round" />
        {/* chat baseline */}
        <line x1={pad} y1={y(chatTokens)} x2={W - pad} y2={y(chatTokens)} stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="5 5" />
        <text x={pad + 4} y={y(chatTokens) - 8} fill="var(--accent-cyan)" fontSize="11.5" fontFamily="var(--mono)">
          single chat exchange · {fmtNum(chatTokens)} tokens
        </text>
        <text x={x(steps)} y={y(last.cum) - 10} fill="var(--accent-pink)" fontSize="12" textAnchor="end" fontFamily="var(--mono)" fontWeight="600">
          {fmtNum(last.cum)} tokens paid
        </text>
        {[1, Math.ceil(steps / 2), steps].filter((v, i, a) => a.indexOf(v) === i).map((s) => (
          <text key={s} x={x(s)} y={H - pad + 18} fill="var(--text-faint)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">
            step {s}
          </text>
        ))}
      </svg>

      <ResultStrip items={[
        { label: 'Tokens, one agent task', value: fmtNum(last.cum), note: `vs ${fmtNum(chatTokens)} for one chat turn` },
        { label: 'Agentic multiplier', value: `${mult.toFixed(0)}×`, color: 'var(--accent-pink)', note: 'report range: 5–30× (some 50×)' },
        { label: `Cost per task (${t.label})`, value: fmtUSD(agentCost, 2), note: `chat: ${fmtUSD(chatCost, 4)}` },
        { label: '× 10K tasks / month', value: fmtUSD(agentCost * 10000), color: 'var(--accent-pink)' },
      ]} />

      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 14 }}>
        Each step re-sends the <em>entire accumulated context</em> — by step 20 you’ve paid for the
        same system prompt twenty times.
      </div>
      <More label="Why super-linear">
        The context grows with every step (tool outputs, responses), and all of it is re-sent and
        re-billed on each loop iteration — so cost per task grows faster than step count.
        Assumptions here: 3K base context, +900 tokens/step, 350 output tokens/step.
      </More>
    </div>
  )
}

function WorkloadCalculator() {
  const [requests, setRequests] = useState(100)
  const [inTok, setInTok] = useState(2000)
  const [outTok, setOutTok] = useState(500)
  const [rag, setRag] = useState(0)

  const monthly = (tier) =>
    requests * 1000 * (((inTok + rag) / 1e6) * tier.input + (outTok / 1e6) * tier.output)

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="Requests per month" value={requests} min={10} max={2000} step={10}
            display={`${requests}K`} onChange={setRequests} />
          <Slider label="Input tokens per request" value={inTok} min={200} max={10000} step={100}
            display={inTok.toLocaleString()} onChange={setInTok} />
          <Slider label="Output tokens per request" value={outTok} min={50} max={3000} step={50}
            display={outTok.toLocaleString()} onChange={setOutTok} />
          <Slider label="Retrieved RAG context per request" value={rag} min={0} max={8000} step={250}
            display={rag ? `+${rag.toLocaleString()} tokens` : 'none'} onChange={setRag} />
        </div>
        <div>
          {TIERS.map((t) => {
            const v = monthly(t)
            const maxV = monthly(TIERS[0])
            return (
              <div className="bar-row" key={t.value} style={{ marginBottom: 14 }}>
                <div className="bar-label">{t.label} <span style={{ color: 'var(--text-faint)', fontSize: 10.5 }}>(${t.input}/${t.output})</span></div>
                <div className="bar-track" style={{ height: 30 }}>
                  <div className="bar-fill" style={{
                    width: `${Math.max(3, (v / maxV) * 100)}%`,
                    background: t.value === 'flagship' ? 'var(--accent-pink)' : t.value === 'mid' ? 'var(--accent-violet)' : 'var(--accent-cyan)',
                  }}>
                    <span className="bar-value" style={{ fontSize: 13 }}>{fmtUSD(v)}/mo</span>
                  </div>
                </div>
              </div>
            )
          })}
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 16 }}>
            The same workload varies ~{Math.round(monthly(TIERS[0]) / Math.max(1e-9, monthly(TIERS[2])))}× across tiers —
            and adding {rag > 0 ? `${rag.toLocaleString()} tokens of RAG context` : 'RAG context'} inflates every
            tier’s bill. The gap between a lean and a RAG-heavy workload can rival the gap between providers.
          </div>
        </div>
      </div>
      <Callout title="RAG bills you three times — and vector search is the small one">
        100K vector queries ≈ $85; the 3,000 extra context tokens they inject ≈ <strong>$750</strong> —
        optimise retrieval precision before shaving vector-database pennies.
        <More label="The three meters">
          Retrieved passages inflate prompt tokens (the big one); embedding and indexing are
          metered; and the vector store charges for storage and queries (the small one). In most
          enterprise RAG systems the dominant cost is the extra model context, not the search.
        </More>
      </Callout>
    </div>
  )
}

const EFFORTS = [
  { value: 0, label: 'Standard model' },
  { value: 1000, label: 'Reasoning · low' },
  { value: 4000, label: 'Reasoning · medium' },
  { value: 10000, label: 'Reasoning · high' },
]

function ReasoningTax() {
  const [hidden, setHidden] = useState(4000)
  const [visible, setVisible] = useState(200)
  const [batch, setBatch] = useState(false)

  const RATE = 30 // $/M output tokens, reasoning tier
  const disc = batch ? 0.5 : 1
  const visCost = (visible / 1e6) * RATE * disc
  const hidCost = (hidden / 1e6) * RATE * disc
  const total = visCost + hidCost
  const mult = total / Math.max(visCost, 1e-9)

  // iceberg heights (px), sqrt-compressed so the visible tip stays visible
  const h = (tok) => Math.max(tok > 0 ? 26 : 0, Math.sqrt(tok) * 2.2)

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <div className="control-row">
            <div className="control-label"><span>Model tier & thinking effort</span>
              <span className="control-value">{hidden.toLocaleString()} hidden tokens</span></div>
            <Seg options={EFFORTS.map((e) => ({ value: e.value, label: e.label }))} value={hidden} onChange={setHidden} />
          </div>
          <Slider label="Visible answer length" value={visible} min={50} max={1000} step={50}
            display={`${visible} tokens`} onChange={setVisible} />
          <div className={'toggle-row' + (batch ? ' on' : '')} onClick={() => setBatch(!batch)} style={{ marginTop: 4 }}>
            <div className="switch" />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Send it through the batch lane</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>50% off applies to hidden reasoning tokens too</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 10 }}>
            Priced at $30/M output tokens (reasoning tier). Hidden chain-of-thought is billed at the
            full output rate — but never appears in the response.
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            The iceberg: what you see vs what you pay
          </div>
          <div style={{ maxWidth: 340 }}>
            <div style={{
              height: h(visible), background: 'rgba(74,222,128,0.35)', border: '1px solid var(--accent-green)',
              borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11.5, fontWeight: 700, color: 'var(--accent-green)', transition: 'height 0.3s',
            }}>
              visible answer · {visible} tokens · {fmtUSD(visCost, 4)}
            </div>
            <div style={{ borderTop: '2px dashed var(--accent-cyan)', position: 'relative', margin: '0' }}>
              <span style={{ position: 'absolute', right: -4, top: -9, fontSize: 9.5, color: 'var(--accent-cyan)', background: 'var(--bg-soft)', padding: '0 4px' }}>
                what the user sees
              </span>
            </div>
            <div style={{
              height: h(hidden), background: 'rgba(244,114,182,0.25)', border: '1px solid var(--accent-pink)',
              borderTop: 'none', borderRadius: '0 0 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11.5, fontWeight: 700, color: 'var(--accent-pink)', transition: 'height 0.3s',
            }}>
              {hidden > 0 ? <>hidden thinking · {hidden.toLocaleString()} tokens · {fmtUSD(hidCost, 3)}</> : null}
            </div>
          </div>
          <ResultStrip items={[
            { label: 'Cost per query', value: fmtUSD(total, 3), color: 'var(--accent-pink)' },
            { label: 'vs the visible answer alone', value: `${mult.toFixed(0)}×`, note: hidden > 0 ? 'invisible spend wrapped around it' : 'no hidden tokens' },
            { label: '× 10K queries / month', value: fmtUSD(total * 10000), color: 'var(--accent-pink)' },
          ]} />
        </div>
      </div>
      <Callout title="Pay for thinking only where thinking pays">
        Reasoning tiers inflate effective output cost <strong>3–10×</strong> — route only genuinely
        hard steps to them, at the lowest effort that passes evaluation.
        <More label="The discipline in full">
          Providers ship ~10× price gaps between standard and pro reasoning tiers, plus effort knobs
          that change hidden token volume several-fold. Reserve reasoning for planning, verification
          and novel synthesis. Its cousin, the long-context habit (stuffing whole repositories into
          million-token windows), compounds the bill the same way — the cheapest token remains the
          one never sent.
        </More>
      </Callout>
    </div>
  )
}

export default function WhyBillsExplode() {
  return (
    <Section
      id="bills"
      kicker="Module 06 · The demand side"
      title="Why enterprise bills explode"
      lede={
        <>
          If unit prices fell ~80% between 2025 and 2026, why did enterprise spend double? Because
          bills are <strong>consumption × price</strong>, and consumption is exploding faster than
          price is falling. 85% of organisations misestimate AI costs by more than 10%, and 79%
          report cost overruns in the past twelve months.
        </>
      }
    >
      <Block
        title="The agentic multiplier — watch a loop burn tokens"
        sub="A chatbot exchange is one call. An agent runs a loop — and each step re-sends the entire accumulated context."
      >
        <AgentLoopViz />
      </Block>

      <Block
        title="What a workload actually costs"
        sub="Straight token arithmetic at list prices. Shape your workload and compare tiers."
      >
        <WorkloadCalculator />
      </Block>

      <Block
        title="The reasoning tax — pay for thinking you never see"
        sub="Reasoning models generate an internal chain of thought before the visible answer. Those tokens are billed at the full output rate."
      >
        <ReasoningTax />
      </Block>

      <Block
        title="Where the waste hides"
        sub="Studies estimate 40–60% of enterprise token budgets go to redundant context, repeated retrieval, retry storms and unbounded agent loops."
      >
        <DataTable
          headers={['Failure mode', 'What happens', 'Countermeasure']}
          rows={FAILURE_MODES.map((f) => [
            f.name,
            f.what,
            <span style={{ color: 'var(--accent-green)' }}>{f.fix}</span>,
          ])}
        />
      </Block>
    </Section>
  )
}
