import React, { useEffect, useState } from 'react'
import Hero from './components/Hero.jsx'
import InsideLLM from './components/InsideLLM.jsx'
import PrefillDecode from './components/PrefillDecode.jsx'
import PricingLandscape from './components/PricingLandscape.jsx'
import Future from './components/Future.jsx'
import OpenVsProprietary from './components/OpenVsProprietary.jsx'
import SupplySide from './components/SupplySide.jsx'
import WhyBillsExplode from './components/WhyBillsExplode.jsx'
import Optimization from './components/Optimization.jsx'
import FinOpsFuture from './components/FinOpsFuture.jsx'

const NAV = [
  { id: 'hero', num: '00', label: 'The paradox', comp: Hero },
  { id: 'llm', num: '01', label: 'How an LLM works', comp: InsideLLM },
  { id: 'prefill', num: '02', label: 'Prefill vs decode', comp: PrefillDecode },
  { id: 'pricing', num: '03', label: 'The pricing landscape', comp: PricingLandscape },
  { id: 'supply', num: '04', label: 'What a token costs', comp: SupplySide },
  { id: 'open', num: '05', label: 'Open vs proprietary', comp: OpenVsProprietary },
  { id: 'bills', num: '06', label: 'Why bills explode', comp: WhyBillsExplode },
  { id: 'optimize', num: '07', label: 'Optimization playground', comp: Optimization },
  { id: 'finops', num: '08', label: 'Token FinOps', comp: FinOpsFuture },
  { id: 'future', num: '09', label: 'The road to 2030', comp: Future },
]

const fromHash = () => {
  const h = window.location.hash.replace('#', '')
  if (h === 'tokens') return 'llm' // legacy anchor from the old module split
  return NAV.some((n) => n.id === h) ? h : 'hero'
}

export default function App() {
  const [active, setActive] = useState(fromHash)

  const select = (id) => {
    setActive(id)
    window.history.replaceState(null, '', '#' + id)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const onHash = () => setActive(fromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const idx = NAV.findIndex((n) => n.id === active)
  const Active = NAV[idx].comp
  const prev = NAV[idx - 1]
  const next = NAV[idx + 1]

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-brand">
          LLM <span className="tok">Tokenomics</span>
        </div>
        <div className="sidebar-sub">An interactive guide to the economics of tokens · July 2026</div>
        {NAV.map((n) => (
          <a
            key={n.id}
            href={'#' + n.id}
            className={'nav-item' + (active === n.id ? ' active' : '')}
            onClick={(e) => { e.preventDefault(); select(n.id) }}
          >
            <span className="nav-num">{n.num}</span>
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <main className="main">
        <Active key={active} />
        <div className="navfoot">
          {prev ? (
            <button className="btn" onClick={() => select(prev.id)}>
              ← {prev.num} · {prev.label}
            </button>
          ) : <span />}
          {next ? (
            <button className="btn primary" onClick={() => select(next.id)}>
              Next: {next.num} · {next.label} →
            </button>
          ) : (
            <button className="btn primary" onClick={() => select('hero')}>↺ Back to the start</button>
          )}
        </div>
        <footer className="footer">
          Built from “LLM Tokenomics — Detailed Report” (Group Digital &amp; Innovation, July 2026).
          Prices and benchmarks are indicative as of mid-2026; this market reprices monthly — treat
          all figures as orders of magnitude, not quotes. Not procurement guidance or financial advice.
        </footer>
      </main>
    </div>
  )
}
