import React, { useEffect, useState } from 'react'
import Hero from './components/Hero.jsx'
import InsideLLM from './components/InsideLLM.jsx'
import PrefillDecode from './components/PrefillDecode.jsx'
import PriceVariables from './components/PriceVariables.jsx'
import PricingLandscape from './components/PricingLandscape.jsx'
import SupplySide from './components/SupplySide.jsx'
import OpenVsProprietary from './components/OpenVsProprietary.jsx'
import WhyBillsExplode from './components/WhyBillsExplode.jsx'
import Optimization from './components/Optimization.jsx'
import FinOpsFuture from './components/FinOpsFuture.jsx'
import SupplyForce from './components/SupplyForce.jsx'
import DemandForce from './components/DemandForce.jsx'
import BillIsAChoice from './components/BillIsAChoice.jsx'
import WhatItMeans from './components/WhatItMeans.jsx'
import GlossaryModule from './components/GlossaryModule.jsx'

// Two-level navigation: five themed parts, each with its own chapters.
const NAV = [
  { num: '0', label: 'The paradox', sub: 'Why tokenomics', pages: [{ id: 'hero', num: '0', label: 'The paradox', comp: Hero }] },
  {
    num: '1', label: 'The anatomy of an LLM', sub: 'What you are actually buying',
    pages: [
      { id: 'llm', num: '1.1', label: 'How an LLM works', comp: InsideLLM },
      { id: 'prefill', num: '1.2', label: 'Prefill vs decode', comp: PrefillDecode },
      { id: 'variables', num: '1.3', label: 'Five hidden dials', comp: PriceVariables },
    ],
  },
  {
    num: '2', label: 'Supplier economics', sub: 'How the price is set',
    pages: [
      { id: 'pricing', num: '2.1', label: 'The pricing landscape', comp: PricingLandscape },
      { id: 'supply', num: '2.2', label: 'What a token costs', comp: SupplySide },
      { id: 'open', num: '2.3', label: 'Open vs proprietary', comp: OpenVsProprietary },
    ],
  },
  {
    num: '3', label: 'Buyer economics', sub: 'Where your money goes',
    pages: [
      { id: 'bills', num: '3.1', label: 'Why bills explode', comp: WhyBillsExplode },
      { id: 'optimize', num: '3.2', label: 'Optimization playground', comp: Optimization },
      { id: 'finops', num: '3.3', label: 'Token FinOps', comp: FinOpsFuture },
    ],
  },
  {
    num: '4', label: '2030 trend modelling', sub: 'The two forces, quantified',
    pages: [
      { id: 'force-supply', num: '4.1', label: 'Supply side', comp: SupplyForce },
      { id: 'force-demand', num: '4.2', label: 'Demand side', comp: DemandForce },
    ],
  },
  {
    num: '5', label: 'Conclusion', sub: 'What to do about it',
    pages: [
      { id: 'choice', num: '5.1', label: 'Your bill is a choice', comp: BillIsAChoice },
      { id: 'means', num: '5.2', label: 'What it means for you', comp: WhatItMeans },
    ],
  },
  { num: '6', label: 'Glossary', sub: 'Every term, in plain language', pages: [{ id: 'glossary', num: '6', label: 'Glossary', comp: GlossaryModule }] },
]

const FLAT = NAV.flatMap((g) => g.pages.map((p) => ({ ...p, group: g })))

// old anchors from earlier structures keep working
const LEGACY = { tokens: 'llm', future: 'force-supply', forces: 'force-supply' }

const fromHash = () => {
  const h = window.location.hash.replace('#', '')
  if (LEGACY[h]) return LEGACY[h]
  return FLAT.some((n) => n.id === h) ? h : 'hero'
}

export default function App() {
  const [active, setActive] = useState(fromHash)
  const [openGroups, setOpenGroups] = useState(() => {
    const g = FLAT.find((n) => n.id === fromHash())
    return new Set([g ? g.group.num : '0'])
  })

  const select = (id) => {
    setActive(id)
    const page = FLAT.find((n) => n.id === id)
    if (page) setOpenGroups((s) => new Set([...s, page.group.num]))
    window.history.replaceState(null, '', '#' + id)
    window.scrollTo({ top: 0 })
  }

  useEffect(() => {
    const onHash = () => setActive(fromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const idx = FLAT.findIndex((n) => n.id === active)
  const Active = FLAT[idx].comp
  const prev = FLAT[idx - 1]
  const next = FLAT[idx + 1]

  const toggleGroup = (num) =>
    setOpenGroups((s) => {
      const n = new Set(s)
      n.has(num) ? n.delete(num) : n.add(num)
      return n
    })

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-brand">
          LLM <span className="tok">Tokenomics</span>
        </div>
        <div className="sidebar-sub">An interactive guide to the economics of tokens</div>

        {NAV.map((g) => {
          const single = g.pages.length === 1
          const isOpen = openGroups.has(g.num)
          const hasActive = g.pages.some((p) => p.id === active)
          if (single) {
            const p = g.pages[0]
            return (
              <a
                key={g.num}
                href={'#' + p.id}
                className={'nav-group' + (active === p.id ? ' active' : '')}
                onClick={(e) => { e.preventDefault(); select(p.id) }}
              >
                <span className="nav-num">{g.num}</span>
                <span className="nav-group-label">{g.label}</span>
              </a>
            )
          }
          return (
            <div key={g.num} className="nav-section">
              <button
                className={'nav-group' + (hasActive ? ' has-active' : '')}
                onClick={() => toggleGroup(g.num)}
                aria-expanded={isOpen}
              >
                <span className="nav-num">{g.num}</span>
                <span className="nav-group-label">{g.label}</span>
                <span className={'nav-caret' + (isOpen ? ' open' : '')}>▸</span>
              </button>
              {isOpen && (
                <div className="nav-children">
                  {g.pages.map((p) => (
                    <a
                      key={p.id}
                      href={'#' + p.id}
                      className={'nav-item' + (active === p.id ? ' active' : '')}
                      onClick={(e) => { e.preventDefault(); select(p.id) }}
                    >
                      <span className="nav-num">{p.num}</span>
                      <span>{p.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
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
          Prices and benchmarks are indicative as of mid-2026; this market reprices monthly. Please
          treat all figures as orders of magnitude, not quotes. Not procurement guidance or financial
          advice. If any questions, please reach out to{' '}
          <a href="mailto:nitin.bandgar@tata.com" style={{ color: 'var(--accent-cyan)' }}>
            nitin.bandgar@tata.com
          </a>
        </footer>
      </main>
    </div>
  )
}
