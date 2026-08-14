import React from 'react'
import { Section, Fold, Callout } from './ui.jsx'
import { TIMELINE_2030 } from '../data.js'
import { IMPLICATIONS_SUPPLIER, IMPLICATIONS_BUYER } from '../forceModel.js'

const CONF_COLOR = {
  High: 'var(--accent-green)',
  'Medium-high': 'var(--accent-cyan)',
  Medium: 'var(--accent-yellow)',
  Directional: 'var(--accent-orange)',
}
const BUYER_ICONS = ['🧾', '⚙️', '🔄', '🔓', '⚠️']
const SELLER_ICONS = ['📉', '🏭', '🎯', '💳', '🔗']

function Cards({ items, icons, accent }) {
  return (
    <div className="grid grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
      {items.map((i, n) => (
        <div className="card" key={i.t} style={{ borderTopColor: accent, borderTopWidth: 2 }}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 18 }}>{icons[n]}</span>
            <span className="chip" style={{ color: CONF_COLOR[i.c], borderColor: CONF_COLOR[i.c] + '66', fontSize: 9.5, flexShrink: 0 }}>{i.c}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 13, margin: '5px 0 4px' }}>{i.t}</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{i.d}</div>
        </div>
      ))}
    </div>
  )
}

export default function WhatItMeans() {
  return (
    <Section
      id="means"
      kicker="Module 5.2 · Implications"
      title="What it means for you"
      lede="The same market looks very different depending on which side of the invoice you sit. Open the one that applies to you."
    >
      <Fold title="🧾 If you buy tokens" sub="For enterprises consuming LLM capacity." badge="5 points" open>
        <Cards items={IMPLICATIONS_BUYER} icons={BUYER_ICONS} accent="var(--accent-cyan)" />
        <Callout tone="green" title="The one that matters most">
          <strong>Your bill is a decision, not a forecast.</strong> At 24× volume growth, holding
          capability fixed cuts spend by about a third while tracking the frontier triples it. Decide
          the tier each workload deserves, and manage cost per business outcome rather than total spend.
        </Callout>
      </Fold>

      <Fold title="🏭 If you sell tokens" sub="For providers, hosts and platform builders." badge="5 points">
        <Cards items={IMPLICATIONS_SUPPLIER} icons={SELLER_ICONS} accent="var(--accent-pink)" />
        <Callout tone="pink" title="The one that matters most">
          <strong>The mid-market commoditises.</strong> Pure inference hosting converges on utility
          economics — scale, utilisation and energy decide the winners. Pricing power persists only
          where open models cannot yet follow.
        </Callout>
      </Fold>

      <Fold title="📅 The four horizons to 2030" sub="Extrapolations from observable trends, with confidence levels.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TIMELINE_2030.map((t) => (
            <div className="card" key={t.horizon} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: 'var(--accent-cyan)', width: 82, flexShrink: 0 }}>
                {t.horizon}
              </div>
              <div style={{ flex: 1, fontSize: 12.5, color: 'var(--text-dim)', minWidth: 220 }}>{t.dev}</div>
              <span className="chip" style={{ color: CONF_COLOR[t.confidence], borderColor: CONF_COLOR[t.confidence] + '66', fontSize: 10 }}>
                {t.confidence}
              </span>
            </div>
          ))}
        </div>
      </Fold>

      <Callout title="The closing thought">
        Treat tokens as a managed resource: <strong>meter, route, cache and batch — then reinvest
        the savings in scale.</strong> Through 2025 the risk was overspending on AI; from here, the
        greater risk is under-consuming it.
      </Callout>
    </Section>
  )
}
