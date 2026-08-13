import React, { useState } from 'react'
import { Section, Block, Slider, Seg, ResultStrip, Hint, More } from './ui.jsx'
import { LANG_TOKENS, fmtUSD } from '../data.js'

/* 1 — the vocabulary tax */
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
        Vocabularies are trained mostly on English text, so other languages split into more, smaller
        pieces. A multilingual workload costs more than its word count suggests — budget in tokens,
        not words.
      </More>
    </div>
  )
}

/* 2 — context window: re-sent and re-billed every turn */
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
      <More label="Why it compounds">
        The whole context — system prompt, every earlier turn, retrieved documents, tool outputs — is
        re-sent and re-billed on every single call. Trimming it is the lever called context
        engineering.
      </More>
    </div>
  )
}

/* 3 — dense vs MoE */
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
        reasons 2025–26 models got cheaper without getting worse.
      </More>
    </div>
  )
}

/* 4 — precision */
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
        halves the marginal cost of decoding — usually with little quality loss.
      </More>
    </div>
  )
}

/* 5 — KV cache */
function KVMini() {
  const [ctx, setCtx] = useState(32)
  const kvPerReq = (ctx * 1000 * 0.32) / 1000 // GB, 70B-class
  const free = 640 * 0.9 - 140
  const batch = Math.max(1, Math.floor(free / kvPerReq))
  return (
    <div>
      <Hint>Drag the context length. Watch how many customers still fit on the same GPU — that is what sets the price.</Hint>
      <Slider label="Context length per request" value={ctx} min={2} max={200} display={`${ctx}K tokens`} onChange={setCtx} />
      <div style={{ display: 'flex', height: 36, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-bright)', marginBottom: 4 }}>
        <div style={{ width: '22%', background: 'var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0b0e17' }}>weights</div>
        <div style={{ width: `${Math.min(78, (kvPerReq * batch / 640) * 100)}%`, background: 'var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0b0e17', transition: 'width 0.3s' }}>KV cache</div>
        <div style={{ flex: 1, background: 'var(--bg)' }} />
      </div>
      <ResultStrip items={[
        { label: 'Memory per request', value: `${kvPerReq.toFixed(1)} GB`, color: 'var(--accent-orange)' },
        { label: 'Requests that fit', value: batch > 400 ? '400+' : batch, color: batch < 8 ? 'var(--accent-pink)' : 'var(--accent-cyan)', note: 'sharing one GPU node' },
        { label: 'Cost per token', value: batch < 8 ? 'high' : batch < 40 ? 'moderate' : 'low', color: batch < 8 ? 'var(--accent-pink)' : 'var(--accent-green)' },
      ]} />
      <More label="Why long context is surcharged">
        Attention state for every token of every active request is held in GPU memory, competing
        with the model weights. Long contexts shrink the number of customers that fit on a GPU —
        fewer requests sharing the same hardware means a higher cost per token.
      </More>
    </div>
  )
}

const VARIABLES = [
  { key: 'vocab', icon: '🌐', label: 'Language', one: 'The same sentence costs up to 6.9× more in Hindi than English.', el: VocabularyMini },
  { key: 'context', icon: '📜', label: 'Context length', one: 'Everything is re-sent and re-billed on every single turn.', el: ContextMini },
  { key: 'moe', icon: '🧩', label: 'Model design', one: 'A 1T-parameter model can be cheaper to serve than a 70B one.', el: MoEMini },
  { key: 'precision', icon: '🎚', label: 'Precision', one: 'Halving bytes per weight roughly halves the cost of writing.', el: PrecisionMini },
  { key: 'kv', icon: '🧠', label: 'GPU memory', one: 'Long contexts crowd out other customers on the same GPU.', el: KVMini },
]

export default function PriceVariables() {
  const [sel, setSel] = useState('vocab')
  const cur = VARIABLES.find((v) => v.key === sel)
  const El = cur.el

  return (
    <Section
      id="variables"
      kicker="Module 03 · The hidden dials"
      title="Five things that quietly change your bill"
      lede={
        <>
          Two invoices for the “same” work can differ several-fold — not because of the price list,
          but because of five design choices most buyers never see. Pick one and try it.
        </>
      }
    >
      <Block title="Pick a dial">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 18 }}>
          {VARIABLES.map((v) => (
            <button
              key={v.key}
              onClick={() => setSel(v.key)}
              className="card"
              style={{
                cursor: 'pointer', textAlign: 'left', padding: '12px 14px', font: 'inherit', color: 'inherit',
                borderColor: sel === v.key ? 'var(--accent-cyan)' : undefined,
                background: sel === v.key ? 'rgba(56,209,224,0.08)' : undefined,
              }}
            >
              <div style={{ fontSize: 20 }}>{v.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginTop: 4, color: sel === v.key ? 'var(--accent-cyan)' : 'var(--text)' }}>{v.label}</div>
            </button>
          ))}
        </div>

        <div className="panel">
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 22 }}>{cur.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{cur.label}</span>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>— {cur.one}</span>
          </div>
          <El key={cur.key} />
        </div>
      </Block>
    </Section>
  )
}
