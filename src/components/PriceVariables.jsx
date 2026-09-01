import React, { useState } from 'react'
import { Section, Fold, Slider, Seg, ResultStrip, Hint, More } from './ui.jsx'
import { LANG_TOKENS, fmtUSD } from '../data.js'

/* 1 — tokenizer & vocabulary (set by the model maker) */
function VocabularyMini() {
  const [sel, setSel] = useState('Hindi')
  const base = LANG_TOKENS[0].tokens
  const max = Math.max(...LANG_TOKENS.map((l) => l.tokens))
  const cur = LANG_TOKENS.find((l) => l.lang === sel)
  return (
    <div>
      <Hint>Click a language. Same sentence, same meaning — the bar is what you actually pay for.</Hint>
      {LANG_TOKENS.map((l) => (
        <div className="bar-row" key={l.lang} onClick={() => setSel(l.lang)} style={{ cursor: 'pointer' }}>
          <div className="bar-label" style={{ width: 100, color: sel === l.lang ? 'var(--text)' : undefined }}>{l.lang}</div>
          <div className="bar-track" style={{ height: 20 }}>
            <div className="bar-fill" style={{
              width: `${(l.tokens / max) * 100}%`,
              background: l.lang === sel ? 'var(--accent-yellow)' : 'var(--accent-violet)',
              opacity: l.lang === sel ? 1 : 0.5,
            }}>
              <span className="bar-value">{l.tokens} tokens{l.tokens !== base ? ` · ${(l.tokens / base).toFixed(1)}×` : ''}</span>
            </div>
          </div>
        </div>
      ))}
      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text)', margin: '12px 0 6px' }}>“{cur.text}”</div>
      <ResultStrip items={[
        { label: 'Tokens billed', value: cur.tokens, color: 'var(--accent-yellow)' },
        { label: 'Vs English', value: cur.lang === 'English' ? 'baseline' : `${(cur.tokens / base).toFixed(1)}× the bill`, color: cur.tokens > base ? 'var(--accent-pink)' : undefined },
      ]} />
      <More label="Why non-English costs more">
        The vocabulary is fixed when the model is trained, and it is built mostly from English text.
        Other languages therefore split into more, smaller pieces — the same document costs more to
        process in Hindi than in English. Budget in tokens, not words.
      </More>
    </div>
  )
}

/* 2 — model architecture (set by the model maker) */
function MoEMini() {
  const [mode, setMode] = useState('moe')
  const dense = mode === 'dense'
  return (
    <div>
      <Hint>Toggle the two designs. Lit squares are the parameters actually doing work on each token.</Hint>
      <Seg options={[{ value: 'dense', label: 'Dense · 70B total' }, { value: 'moe', label: 'MoE · 1T total' }]} value={mode} onChange={setMode} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, margin: '16px 0 12px', maxWidth: 420 }}>
        {Array.from({ length: 16 }).map((_, i) => {
          const lit = dense || i === 3 || i === 9
          return (
            <div key={i} style={{
              height: 30, borderRadius: 6, transition: 'all 0.3s',
              background: lit ? 'var(--accent-violet)' : 'var(--card-hover)',
              boxShadow: lit ? '0 0 10px rgba(139,124,247,0.6)' : 'none',
              border: '1px solid ' + (lit ? 'var(--accent-violet)' : 'var(--border)'),
              opacity: lit ? 0.95 : 0.55,
            }} />
          )
        })}
      </div>
      <ResultStrip items={[
        { label: 'Read per token', value: dense ? '70B of 70B' : '~37B of 1T', color: 'var(--accent-violet)' },
        { label: 'Experts working', value: dense ? 'all of them' : '2 of 16' },
        { label: 'What sets your price', value: dense ? 'headline size' : 'active size', color: 'var(--accent-green)' },
      ]} />
      <More label="Why a 1T model can be cheaper than a 70B one">
        A Mixture-of-Experts model routes each token through a few specialist “experts”, so serving
        cost tracks <em>active</em> parameters, not the headline number. This is one of the main
        reasons 2025–26 models got cheaper without getting worse — and why headline parameter counts
        stopped being a useful guide to price.
      </More>
    </div>
  )
}

/* 3 — precision (set by whoever serves the model) */
const PRECISIONS = [{ value: 2, label: 'FP16' }, { value: 1, label: 'FP8' }, { value: 0.5, label: 'FP4' }]
function PrecisionMini() {
  const [bytes, setBytes] = useState(2)
  return (
    <div>
      <Hint>Switch precision. Fewer bytes per weight means less memory traffic per token — and a cheaper token.</Hint>
      <Seg options={PRECISIONS} value={bytes} onChange={setBytes} />
      <div style={{ margin: '16px 0 4px' }}>
        {PRECISIONS.map((p) => (
          <div className="bar-row" key={p.value}>
            <div className="bar-label" style={{ width: 70 }}>{p.label}</div>
            <div className="bar-track" style={{ height: 22 }}>
              <div className="bar-fill" style={{
                width: `${(p.value / 2) * 100}%`,
                background: p.value === bytes ? 'var(--accent-cyan)' : 'var(--accent-violet)',
                opacity: p.value === bytes ? 1 : 0.4,
              }}>
                <span className="bar-value">{70 * p.value} GB read per token</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ResultStrip items={[
        { label: 'Weights to move, 70B model', value: `${70 * bytes} GB`, note: 'per generated token' },
        { label: 'Relative decode cost', value: `${Math.round((bytes / 2) * 100)}%`, color: 'var(--accent-cyan)', note: 'vs 16-bit' },
      ]} />
      <More label="The closest thing to a free lunch">
        Every generated token re-reads all the weights from memory, so halving the bytes roughly
        halves the marginal cost of writing — usually with little quality loss. Quantisation is
        chosen by whoever runs the model, which is why the same open model costs different amounts
        at different hosts.
      </More>
    </div>
  )
}

/* 4 — batching (set by whoever serves the model) */
function BatchingMini() {
  const [batch, setBatch] = useState(32)
  const NODE_BW = 26.8e12 * 0.82, WEIGHTS = 140e9, HOURLY = 36 // 82% achieved bandwidth
  const single = NODE_BW / WEIGHTS
  const tps = Math.min(single * batch, 3.2e15 / (2 * 70e9))
  const cost = (HOURLY / (tps * 3600)) * 1e6
  const costAt1 = (HOURLY / (single * 3600)) * 1e6
  const saving = Math.round((1 - cost / costAt1) * 100)

  return (
    <div>
      <Hint>Drag the batch size. This single dial moves the cost of a token more than any other.</Hint>
      <Slider label="Requests served together on one GPU node" value={batch} min={1} max={256} step={1} display={`${batch}×`} onChange={setBatch} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(32, 1fr)', gap: 2, margin: '8px 0 14px' }}>
        {Array.from({ length: 32 }).map((_, i) => (
          <div key={i} style={{
            height: 22, borderRadius: 3,
            background: i < Math.min(batch, 32) ? 'var(--accent-green)' : 'var(--card-hover)',
            opacity: i < Math.min(batch, 32) ? 0.9 : 0.5, transition: 'all 0.2s',
          }} />
        ))}
      </div>
      <ResultStrip items={[
        { label: 'Cost per 1M output tokens', value: fmtUSD(cost, 2), color: 'var(--accent-green)' },
        { label: 'If served one at a time', value: fmtUSD(costAt1, 2), color: 'var(--accent-pink)' },
        { label: 'Batching saves', value: `${saving}%`, color: 'var(--accent-green)' },
      ]} />
      <More label="Why this is the biggest dial of all">
        The model’s weights are read once per forward pass and reused across every request in the
        batch. Serve 32 together and each one pays a thirty-second of that read. The catch is
        latency — a bigger batch means waiting for it to fill, which is exactly why batch APIs are
        50% cheaper and interactive traffic is not.
      </More>
    </div>
  )
}

/* 5 — context you send (set by you) */
function ContextMini() {
  const [turns, setTurns] = useState(10)
  const SYS = 1200, PER_TURN = 400
  let cumulative = 0
  for (let i = 1; i <= turns; i++) cumulative += SYS + PER_TURN * i
  const naive = (SYS + PER_TURN) * turns
  const cost = (cumulative / 1e6) * 3
  return (
    <div>
      <Hint>Drag the conversation length. Watch what you pay for the <strong>same system prompt</strong>, over and over.</Hint>
      <Slider label="Turns in the conversation" value={turns} min={1} max={40} display={`${turns} turns`} onChange={setTurns} />
      <div className="bar-row">
        <div className="bar-label">If context were free</div>
        <div className="bar-track" style={{ height: 22 }}>
          <div className="bar-fill" style={{ width: `${(naive / cumulative) * 100}%`, background: 'var(--accent-cyan)' }}>
            <span className="bar-value">{(naive / 1000).toFixed(0)}K</span>
          </div>
        </div>
      </div>
      <div className="bar-row">
        <div className="bar-label">What you actually pay</div>
        <div className="bar-track" style={{ height: 22 }}>
          <div className="bar-fill" style={{ width: '100%', background: 'var(--accent-pink)' }}>
            <span className="bar-value">{(cumulative / 1000).toFixed(0)}K tokens</span>
          </div>
        </div>
      </div>
      <ResultStrip items={[
        { label: 'System prompt paid for', value: `${turns}×`, color: 'var(--accent-pink)', note: 'once per turn' },
        { label: 'Cost @ $3/M input', value: fmtUSD(cost, 3), note: 'this one conversation' },
      ]} />
      <More label="Context window vs context sent">
        The <em>context window</em> is the maximum the model accepts — a model-maker decision, and
        the number vendors advertise. The <em>context you send</em> is how much of it you actually
        fill, which is entirely your choice and the only one of the two that appears on your bill.
        Everything you send is re-sent and re-billed on every turn.
      </More>
    </div>
  )
}

const OWNER_STYLE = {
  'Model maker': { c: 'var(--accent-violet)', t: 'Fixed when the model was built' },
  'Whoever serves it': { c: 'var(--accent-cyan)', t: 'Chosen by the provider or your platform team' },
  'You': { c: 'var(--accent-green)', t: 'Entirely your call, request by request' },
}

const VARIABLES = [
  { key: 'vocab', icon: '🌐', label: 'Tokenizer & vocabulary', owner: 'Model maker', one: 'The same sentence costs up to 6.9× more in Hindi than in English.', el: VocabularyMini },
  { key: 'moe', icon: '🧩', label: 'Model architecture', owner: 'Model maker', one: 'A 1T-parameter model can be cheaper to serve than a 70B one.', el: MoEMini },
  { key: 'precision', icon: '🎚', label: 'Precision', owner: 'Whoever serves it', one: 'Halving bytes per weight roughly halves the cost of writing.', el: PrecisionMini },
  { key: 'batching', icon: '📦', label: 'Batching', owner: 'Whoever serves it', one: 'The single biggest lever on cost per token — and why batch APIs are half price.', el: BatchingMini },
  { key: 'context', icon: '📜', label: 'Context you send', owner: 'You', one: 'Everything you send is re-sent and re-billed on every turn.', el: ContextMini },
]

export default function PriceVariables() {
  const [sel, setSel] = useState('vocab')
  const cur = VARIABLES.find((v) => v.key === sel)
  const El = cur.el
  const owner = OWNER_STYLE[cur.owner]

  return (
    <Section
      id="variables"
      kicker="Module 1.3 · The hidden dials"
      title="Five settings that quietly change your bill"
      lede={
        <>
          Two invoices for the “same” work can differ several-fold — because of five settings most
          buyers never see. Two are locked in by the model maker, two by whoever runs the model, and
          one is entirely yours.
        </>
      }
    >
      <Fold open title="Pick a dial" sub="Each shows who controls it — that determines whether you can do anything about it.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))', gap: 10, marginBottom: 18 }}>
          {VARIABLES.map((v) => {
            const o = OWNER_STYLE[v.owner]
            return (
              <button
                key={v.key}
                onClick={() => setSel(v.key)}
                className="card"
                style={{
                  cursor: 'pointer', textAlign: 'left', padding: '12px 14px', font: 'inherit', color: 'inherit',
                  borderColor: sel === v.key ? 'var(--accent-cyan)' : undefined,
                  background: sel === v.key ? 'rgba(56,209,224,0.08)' : undefined,
                  borderTop: `2px solid ${o.c}`,
                }}
              >
                <div style={{ fontSize: 19 }}>{v.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 12.5, marginTop: 4, color: sel === v.key ? 'var(--accent-cyan)' : 'var(--text)' }}>{v.label}</div>
                <div style={{ fontSize: 10, color: o.c, marginTop: 3 }}>{v.owner}</div>
              </button>
            )
          })}
        </div>

        <div className="panel">
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 21 }}>{cur.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{cur.label}</span>
            <span className="chip" style={{ fontSize: 10, color: owner.c, borderColor: owner.c + '66' }}>set by: {cur.owner}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', margin: '4px 0 12px' }}>
            {owner.t} — {cur.one}
          </div>
          <El key={cur.key} />
        </div>
      </Fold>
    </Section>
  )
}
