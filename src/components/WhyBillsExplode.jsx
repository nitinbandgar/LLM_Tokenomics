import React, { useMemo, useState } from 'react'
import { Section, Fold, Slider, Seg, ResultStrip, Callout, Hint, More } from './ui.jsx'
import { FAILURE_MODES, fmtUSD, fmtNum } from '../data.js'

const TIERS = [
  { value: 'flagship', label: 'Flagship', input: 10, output: 30 },
  { value: 'mid', label: 'Mid tier', input: 3, output: 15 },
  { value: 'value', label: 'Value tier', input: 0.15, output: 0.6 },
]

const MODE_ICONS = {
  'Retry storms': '🔁',
  'Agent loops without budgets': '🌀',
  'Model over-provisioning': '🏋️',
  'Reasoning-tier default': '🧠',
  'Shadow usage': '👻',
  'No unit economics': '📊',
}

/* ------------------------------------------------------------------ */
/* OVERVIEW — where the waste hides                                    */
/* ------------------------------------------------------------------ */
function WasteOverview() {
  const [sel, setSel] = useState(null)
  const cur = FAILURE_MODES.find((f) => f.name === sel)
  return (
    <div className="panel">
      <Hint>Click any of the six to see what goes wrong and how to stop it. Together they account for the 40–60% of spend that is removable.</Hint>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {FAILURE_MODES.map((f) => (
          <button
            key={f.name}
            onClick={() => setSel(sel === f.name ? null : f.name)}
            className="card"
            style={{
              cursor: 'pointer', textAlign: 'left', padding: '12px 14px', font: 'inherit', color: 'inherit',
              borderColor: sel === f.name ? 'var(--accent-pink)' : undefined,
              background: sel === f.name ? 'rgba(244,114,182,0.07)' : undefined,
            }}
          >
            <div style={{ fontSize: 19 }}>{MODE_ICONS[f.name]}</div>
            <div style={{ fontWeight: 700, fontSize: 12.5, marginTop: 4, color: sel === f.name ? 'var(--accent-pink)' : 'var(--text)' }}>{f.name}</div>
          </button>
        ))}
      </div>
      <div className="popcard" style={{ marginTop: 12, minHeight: 84 }}>
        {cur ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--accent-pink)', marginBottom: 6 }}>
              {MODE_ICONS[cur.name]} {cur.name}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 8 }}>{cur.what}</div>
            <div style={{ fontSize: 12.5, color: 'var(--accent-green)' }}>✓ Fix: {cur.fix}</div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            <strong style={{ color: 'var(--accent-pink)', fontSize: 20, fontFamily: 'var(--mono)' }}>40–60%</strong>{' '}
            of enterprise token budgets is removable waste. Pick one above to see how it happens.
          </div>
        )}
      </div>
      <More label="Why there is no percentage on each one">
        The research quantifies the total (40–60% of spend) but does not publish a split across the
        six modes — the mix is highly specific to each deployment. Rather than invent numbers, meter
        your own: the dashboard in Module 09 lists exactly which indicators expose each mode.
      </More>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DRIVER ① — the agentic multiplier                                   */
/* ------------------------------------------------------------------ */
function AgentLoopViz() {
  const [steps, setSteps] = useState(20)
  const [tier, setTier] = useState('flagship')
  const t = TIERS.find((x) => x.value === tier)
  const BASE = 3000, GROWTH = 900, OUT = 350

  const series = useMemo(() => {
    let cumIn = 0, cumOut = 0
    const pts = []
    for (let i = 1; i <= steps; i++) {
      cumIn += BASE + (i - 1) * GROWTH
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

  const W = 640, H = 240, pad = 46
  const x = (i) => pad + ((i - 1) / Math.max(1, steps - 1)) * (W - 2 * pad)
  const y = (v) => H - pad - (v / last.cum) * (H - 2 * pad)
  const path = series.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.step)},${y(p.cum)}`).join(' ')

  return (
    <div className="panel">
      <Hint>Drag <strong>agent steps</strong> from 1 to 40 and watch the curve bend upward — that bend is the compounding. Then switch model tier to see the same task on cheaper models.</Hint>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ flex: '1 1 260px' }}>
          <Slider label="Agent steps (plan → tool call → validate → retry…)" value={steps} min={1} max={40} display={`${steps} steps`} onChange={setSteps} />
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
        <path d={path + ` L${x(steps)},${H - pad} L${x(1)},${H - pad} Z`} fill="url(#agentArea)" />
        <path d={path} fill="none" stroke="var(--accent-pink)" strokeWidth="3" strokeLinecap="round" />
        <line x1={pad} y1={y(chatTokens)} x2={W - pad} y2={y(chatTokens)} stroke="var(--accent-cyan)" strokeWidth="2" strokeDasharray="5 5" />
        <text x={pad + 4} y={y(chatTokens) - 8} fill="var(--accent-cyan)" fontSize="11.5" fontFamily="var(--mono)">
          one chat exchange · {fmtNum(chatTokens)} tokens
        </text>
        <text x={x(steps)} y={y(last.cum) - 10} fill="var(--accent-pink)" fontSize="12" textAnchor="end" fontFamily="var(--mono)" fontWeight="600">
          {fmtNum(last.cum)} tokens paid
        </text>
        {[1, Math.ceil(steps / 2), steps].filter((v, i, a) => a.indexOf(v) === i).map((s) => (
          <text key={s} x={x(s)} y={H - pad + 18} fill="var(--text-faint)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">step {s}</text>
        ))}
      </svg>

      <ResultStrip items={[
        { label: 'Tokens, one agent task', value: fmtNum(last.cum), note: `vs ${fmtNum(chatTokens)} for a chat turn` },
        { label: 'Agentic multiplier', value: `${mult.toFixed(0)}×`, color: 'var(--accent-pink)' },
        { label: `Cost per task (${t.label})`, value: fmtUSD(agentCost, 2), note: `chat: ${fmtUSD(chatCost, 4)}` },
        { label: '× 10K tasks / month', value: fmtUSD(agentCost * 10000), color: 'var(--accent-pink)' },
      ]} />
      <More label="Why it grows faster than the step count">
        Each step re-sends the entire accumulated context — system prompt, history, every previous
        tool output. By step 20 you have paid for the same system prompt twenty times, and the
        context has grown at every step. Assumptions: 3K base context, +900 tokens/step, 350 output
        tokens/step.
      </More>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DRIVER ② — context & RAG bloat                                      */
/* ------------------------------------------------------------------ */
function ContextBloatCalculator() {
  const [requests, setRequests] = useState(100)
  const [inTok, setInTok] = useState(2000)
  const [outTok, setOutTok] = useState(500)
  const [rag, setRag] = useState(3000)

  const monthly = (tier) => requests * 1000 * (((inTok + rag) / 1e6) * tier.input + (outTok / 1e6) * tier.output)
  const lean = requests * 1000 * ((inTok / 1e6) * TIERS[0].input + (outTok / 1e6) * TIERS[0].output)
  const ragCost = monthly(TIERS[0]) - lean
  const vectorCost = 85 * (requests / 100)

  return (
    <div className="panel">
      <Hint>Set your workload shape, then drag <strong>retrieved context</strong> up and down. Compare what the retrieved text costs against what the vector database costs.</Hint>
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="Requests per month" value={requests} min={10} max={2000} step={10} display={`${requests}K`} onChange={setRequests} />
          <Slider label="Prompt tokens per request" value={inTok} min={200} max={10000} step={100} display={inTok.toLocaleString()} onChange={setInTok} />
          <Slider label="Output tokens per request" value={outTok} min={50} max={3000} step={50} display={outTok.toLocaleString()} onChange={setOutTok} />
          <Slider label="Retrieved context per request (RAG)" value={rag} min={0} max={8000} step={250} display={rag ? `+${rag.toLocaleString()} tokens` : 'none'} onChange={setRag} />
        </div>
        <div>
          {TIERS.map((t) => {
            const v = monthly(t)
            return (
              <div className="bar-row" key={t.value} style={{ marginBottom: 12 }}>
                <div className="bar-label">{t.label} <span style={{ color: 'var(--text-faint)', fontSize: 10.5 }}>(${t.input}/${t.output})</span></div>
                <div className="bar-track" style={{ height: 28 }}>
                  <div className="bar-fill" style={{
                    width: `${Math.max(3, (v / monthly(TIERS[0])) * 100)}%`,
                    background: t.value === 'flagship' ? 'var(--accent-pink)' : t.value === 'mid' ? 'var(--accent-violet)' : 'var(--accent-cyan)',
                  }}>
                    <span className="bar-value" style={{ fontSize: 13 }}>{fmtUSD(v)}/mo</span>
                  </div>
                </div>
              </div>
            )
          })}
          <ResultStrip items={[
            { label: 'Retrieved text costs', value: fmtUSD(ragCost) + '/mo', color: 'var(--accent-pink)', note: 'extra prompt tokens' },
            { label: 'The vector database costs', value: fmtUSD(vectorCost) + '/mo', color: 'var(--accent-green)', note: 'storage + queries' },
            { label: 'Ratio', value: `${(ragCost / Math.max(vectorCost, 1)).toFixed(0)}×`, note: 'context vs search' },
          ]} />
        </div>
      </div>
      <Callout title="RAG bills you three times — and search is the cheap one">
        The retrieved <em>text</em> costs many times what the vector <em>search</em> costs. Optimise
        retrieval precision and context compression before shaving database pennies.
      </Callout>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DRIVER ③ — the reasoning tax                                        */
/* ------------------------------------------------------------------ */
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

  const RATE = 30
  const disc = batch ? 0.5 : 1
  const visCost = (visible / 1e6) * RATE * disc
  const hidCost = (hidden / 1e6) * RATE * disc
  const total = visCost + hidCost
  const mult = total / Math.max(visCost, 1e-9)
  const h = (tok) => Math.max(tok > 0 ? 26 : 0, Math.sqrt(tok) * 2.2)

  return (
    <div className="panel">
      <Hint>Step the <strong>thinking effort</strong> up from Standard to High and watch the pink block below the waterline grow — that is what you pay for but never see. Then try the batch toggle.</Hint>
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <div className="control-row">
            <div className="control-label"><span>Model tier &amp; thinking effort</span>
              <span className="control-value">{hidden.toLocaleString()} hidden tokens</span></div>
            <Seg options={EFFORTS.map((e) => ({ value: e.value, label: e.label }))} value={hidden} onChange={setHidden} />
          </div>
          <Slider label="Visible answer length" value={visible} min={50} max={1000} step={50} display={`${visible} tokens`} onChange={setVisible} />
          <div className={'toggle-row' + (batch ? ' on' : '')} onClick={() => setBatch(!batch)} style={{ marginTop: 4 }}>
            <div className="switch" />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Send it through the batch lane</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>50% off applies to hidden tokens too</div>
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            What you see vs what you pay
          </div>
          <div style={{ maxWidth: 340 }}>
            <div style={{
              height: h(visible), background: 'rgba(74,222,128,0.35)', border: '1px solid var(--accent-green)',
              borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11.5, fontWeight: 700, color: 'var(--accent-green)', transition: 'height 0.3s',
            }}>
              visible answer · {visible} tokens
            </div>
            <div style={{ borderTop: '2px dashed var(--accent-cyan)', position: 'relative' }}>
              <span style={{ position: 'absolute', right: -4, top: -9, fontSize: 9.5, color: 'var(--accent-cyan)', background: 'var(--bg-soft)', padding: '0 4px' }}>
                what the user sees
              </span>
            </div>
            <div style={{
              height: h(hidden), background: 'rgba(244,114,182,0.25)', border: '1px solid var(--accent-pink)',
              borderTop: 'none', borderRadius: '0 0 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11.5, fontWeight: 700, color: 'var(--accent-pink)', transition: 'height 0.3s',
            }}>
              {hidden > 0 ? `hidden thinking · ${hidden.toLocaleString()} tokens` : null}
            </div>
          </div>
          <ResultStrip items={[
            { label: 'Cost per query', value: fmtUSD(total, 3), color: 'var(--accent-pink)' },
            { label: 'vs the answer alone', value: `${mult.toFixed(0)}×` },
            { label: '× 10K queries / month', value: fmtUSD(total * 10000), color: 'var(--accent-pink)' },
          ]} />
        </div>
      </div>
      <Callout title="Pay for thinking only where thinking pays">
        Reasoning tiers inflate effective output cost <strong>3–10×</strong> — route only genuinely
        hard steps to them, at the lowest effort that passes evaluation.
      </Callout>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function WhyBillsExplode() {
  return (
    <Section
      id="bills"
      kicker="Module 07 · The demand side"
      title="Why enterprise bills explode"
      lede={
        <>
          If unit prices fell ~80% in a year, why did spend double? Because bills are{' '}
          <strong>consumption × price</strong>, and consumption is exploding faster than price is
          falling. Start with where the waste hides, then meet the three biggest drivers.
        </>
      }
    >
      <Fold open title="Start here: the six ways money leaks" sub="Together these account for the 40–60% of spend that is removable.">
        <WasteOverview />
      </Fold>

      <Fold title="① The agentic multiplier" badge="driver 1" sub="A chat is one call. An agent runs a loop — and each step re-sends everything before it.">
        <AgentLoopViz />
      </Fold>

      <Fold title="② Context &amp; RAG bloat" badge="driver 2" sub="Everything you retrieve becomes prompt tokens — on every single request.">
        <ContextBloatCalculator />
      </Fold>

      <Fold title="③ The reasoning tax" badge="driver 3" sub="Reasoning models think before they answer, and you pay for the thinking.">
        <ReasoningTax />
      </Fold>
    </Section>
  )
}
