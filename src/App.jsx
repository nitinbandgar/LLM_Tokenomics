import React, { useEffect, useState } from 'react'
import Hero from './components/Hero.jsx'
import TokenPipeline from './components/TokenPipeline.jsx'
import PricingLandscape from './components/PricingLandscape.jsx'
import OpenVsProprietary from './components/OpenVsProprietary.jsx'
import SupplySide from './components/SupplySide.jsx'
import WhyBillsExplode from './components/WhyBillsExplode.jsx'
import Optimization from './components/Optimization.jsx'
import FinOpsFuture from './components/FinOpsFuture.jsx'

const NAV = [
  { id: 'hero', num: '00', label: 'The paradox' },
  { id: 'tokens', num: '01', label: 'How tokens are made' },
  { id: 'pricing', num: '02', label: 'The pricing landscape' },
  { id: 'open', num: '03', label: 'Open vs proprietary' },
  { id: 'supply', num: '04', label: 'What a token costs' },
  { id: 'bills', num: '05', label: 'Why bills explode' },
  { id: 'optimize', num: '06', label: 'Optimization playground' },
  { id: 'finops', num: '07', label: 'FinOps & the road to 2030' },
]

export default function App() {
  const [active, setActive] = useState('hero')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    NAV.forEach((n) => {
      const el = document.getElementById(n.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-brand">
          LLM <span className="tok">Tokenomics</span>
        </div>
        <div className="sidebar-sub">An interactive guide to the economics of tokens · July 2026</div>
        {NAV.map((n) => (
          <a key={n.id} href={'#' + n.id} className={'nav-item' + (active === n.id ? ' active' : '')}>
            <span className="nav-num">{n.num}</span>
            <span>{n.label}</span>
          </a>
        ))}
      </nav>
      <main className="main">
        <Hero />
        <TokenPipeline />
        <PricingLandscape />
        <OpenVsProprietary />
        <SupplySide />
        <WhyBillsExplode />
        <Optimization />
        <FinOpsFuture />
        <footer className="footer">
          Built from “LLM Tokenomics — Detailed Report” (Group Digital &amp; Innovation, July 2026).
          Prices and benchmarks are indicative as of mid-2026; this market reprices monthly — treat
          all figures as orders of magnitude, not quotes. Not procurement guidance or financial advice.
        </footer>
      </main>
    </div>
  )
}
