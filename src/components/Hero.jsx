import React, { useEffect, useRef, useState } from 'react'
import { HEADLINE_NUMBERS } from '../data.js'

// Animated diverging chart: unit price falls, enterprise spend rises.
function ParadoxChart() {
  const [t, setT] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true
          const t0 = performance.now()
          const tick = (now) => {
            const p = Math.min(1, (now - t0) / 1800)
            setT(1 - Math.pow(1 - p, 3))
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 },
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const W = 640, H = 250, pad = 46
  const years = ['2022', '2023', '2024', '2025', '2026']
  const x = (i) => pad + (i / (years.length - 1)) * (W - 2 * pad)
  // price (log-ish decline) and spend (exponential rise), normalized to plot
  const price = [1, 0.72, 0.45, 0.22, 0.05]
  const spend = [0.04, 0.1, 0.24, 0.52, 1]
  const y = (v) => H - pad - v * (H - 2 * pad)

  const toPath = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ')
  const len = 900

  return (
    <div ref={ref} className="panel" style={{ marginTop: 42 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
        {years.map((yr, i) => (
          <g key={yr}>
            <line x1={x(i)} y1={pad - 8} x2={x(i)} y2={H - pad} stroke="var(--border)" strokeWidth="1" />
            <text x={x(i)} y={H - pad + 22} fill="var(--text-faint)" fontSize="11" textAnchor="middle" fontFamily="var(--mono)">
              {yr}
            </text>
          </g>
        ))}
        <path d={toPath(price)} fill="none" stroke="var(--accent-cyan)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={len} strokeDashoffset={len * (1 - t)} />
        <path d={toPath(spend)} fill="none" stroke="var(--accent-pink)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={len} strokeDashoffset={len * (1 - t)} />
        <text x={x(4) - 6} y={y(price[4]) - 12} fill="var(--accent-cyan)" fontSize="12" textAnchor="end" fontWeight="600">
          Price per unit of intelligence ÷10 / year
        </text>
        <text x={x(4) - 6} y={y(spend[4]) + 20} fill="var(--accent-pink)" fontSize="12" textAnchor="end" fontWeight="600">
          Enterprise LLM spend ×2 / year
        </text>
      </svg>
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 6 }}>
        The Jevons paradox of AI: cheaper tokens → agentic workloads that consume 5–50× more of them —
        and consumption growth outruns unit-price deflation.
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <header className="hero" id="hero">
      <div className="hero-glow" />
      <div className="hero-glow2" />
      <div className="section-kicker">An interactive guide · July 2026</div>
      <h1>
        Tokens are getting <span className="grad">10× cheaper</span> every year. So why is your AI
        bill <span className="grad">doubling</span>?
      </h1>
      <p className="hero-lede">
        Two things are simultaneously true about LLM economics in 2026: the price of a unit of
        intelligence is <strong>collapsing ~10× per year</strong>, and enterprise LLM bills are{' '}
        <strong>exploding</strong> — global API spend passed $8.4B in 2025 and is doubling in 2026.
        This is not a contradiction. Scroll through eight interactive modules to understand why —
        and what to do about it.
      </p>
      <ParadoxChart />
      <div className="stat-grid">
        {HEADLINE_NUMBERS.map((s) => (
          <div className="stat-card" key={s.text}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-text">{s.text}</div>
            <div className="stat-source">{s.source}</div>
          </div>
        ))}
      </div>
    </header>
  )
}
