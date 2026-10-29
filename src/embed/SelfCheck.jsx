import React, { useState } from 'react'

// Slide 31 — ten yes/no questions; the score maps to a maturity level.
const QUESTIONS = [
  'Do we know last month’s total AI spend across all vendors, seats and APIs?',
  'Does all production LLM traffic pass through one gateway?',
  'Is every request tagged to a business unit, app and feature?',
  'Can we state the cost per task for our top three use cases?',
  'Do we track cache-hit rate and routing mix every month?',
  'Is there a written routing policy — which tier for which task?',
  'Is all non-interactive work on batch or off-peak lanes?',
  'Do employees and agents have token budgets with alerts?',
  'Are public endpoints protected by per-user quotas?',
  'Do we review model choices and contracts at least quarterly?',
]
const LEVELS = [
  { range: '0–3', min: 0, max: 3, name: 'L1 · Ad hoc' },
  { range: '4–5', min: 4, max: 5, name: 'L2 · Visible' },
  { range: '6–7', min: 6, max: 7, name: 'L3 · Optimised' },
  { range: '8–9', min: 8, max: 9, name: 'L4 · Governed' },
  { range: '10', min: 10, max: 10, name: 'L5 · Value-managed' },
]

export const SIZE = { w: 1200, h: 429 }

function Question({ n, text, yes, onToggle }) {
  return (
    <div onClick={onToggle} role="checkbox" aria-checked={yes} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px', height: '100%', cursor: 'pointer', userSelect: 'none',
      borderRadius: 10, border: `1.5px solid ${yes ? 'var(--teal)' : 'var(--line)'}`,
      background: yes ? 'rgba(0,153,153,0.07)' : 'var(--card)', transition: 'all 0.15s',
    }}>
      <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--blue)', color: '#fff', fontWeight: 800, fontSize: 13, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{n}</span>
      <span style={{ flex: 1, fontSize: 14, lineHeight: 1.35, color: 'var(--ink)' }}>{text}</span>
      <span style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'grid', placeItems: 'center', fontSize: 17, fontWeight: 800,
        border: `2px solid ${yes ? 'var(--teal)' : 'var(--line-strong)'}`, background: yes ? 'var(--teal)' : '#fff', color: '#fff',
      }}>{yes ? '✓' : ''}</span>
    </div>
  )
}

export default function SelfCheck() {
  const [yes, setYes] = useState(() => QUESTIONS.map(() => false))
  const score = yes.filter(Boolean).length
  const level = LEVELS.find((l) => score >= l.min && score <= l.max)
  const toggle = (i) => setYes((prev) => prev.map((v, j) => (j === i ? !v : v)))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 290px', gap: 14, height: '100%' }}>
      {[0, 5].map((start) => (
        <div key={start} style={{ display: 'grid', gridTemplateRows: 'repeat(5, 1fr)', gap: 10 }}>
          {QUESTIONS.slice(start, start + 5).map((q, k) => (
            <Question key={start + k} n={start + k + 1} text={q} yes={yes[start + k]} onToggle={() => toggle(start + k)} />
          ))}
        </div>
      ))}
      <div style={{ background: 'var(--navy)', borderRadius: 12, padding: '18px 20px', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="de-eyebrow" style={{ color: 'var(--cyan)' }}>Your score and level</span>
          <button onClick={() => setYes(QUESTIONS.map(() => false))} style={{
            font: 'inherit', fontSize: 11, fontWeight: 700, color: '#fff', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.4)', borderRadius: 999, padding: '2px 10px', cursor: 'pointer',
          }}>Reset</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 2px' }}>
          <span className="de-big" style={{ fontSize: 52, color: '#fff' }}>{score}</span>
          <span style={{ fontSize: 18, opacity: 0.7, fontWeight: 700 }}>/ 10</span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--cyan)', marginBottom: 12 }}>{level.name}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
          {LEVELS.map((l) => {
            const on = l === level
            return (
              <div key={l.name} style={{
                display: 'flex', gap: 12, alignItems: 'center', padding: '7px 10px', borderRadius: 7,
                background: on ? '#fff' : 'transparent', color: on ? 'var(--navy)' : 'rgba(255,255,255,0.72)',
                fontWeight: on ? 800 : 600, fontSize: 14, transition: 'all 0.2s',
              }}>
                <span style={{ width: 38, fontVariantNumeric: 'tabular-nums' }}>{l.range}</span>
                <span>{l.name}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
