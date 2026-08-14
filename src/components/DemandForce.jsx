import React from 'react'
import { Section, Fold, Callout, More } from './ui.jsx'
import { Decomposition } from './ForceShared.jsx'
import { FUTURE_DEMAND } from '../data.js'

export default function DemandForce() {
  return (
    <Section
      id="force-demand"
      kicker="Module 4.2 · Demand side"
      title="What makes token volume 24× larger by 2030"
      lede={
        <>
          The same arithmetic, with one structural difference: five forces multiply demand upward,
          and a sixth — <strong>your own optimisation</strong> — divides it back down. That sixth
          one is the only number you control.
        </>
      }
    >
      <Fold title="Build the number yourself" sub="Six forces. The last one is yours." open>
        <Decomposition side="demand" />
      </Fold>

      <Fold title="The one number an enterprise controls" sub="Five forces are market-wide. One is not.">
        <Callout tone="pink" title="Your optimisation drag">
          No single organisation slows agentic adoption, multimodality or context inflation. But
          push your own drag from the market-average <strong>1.45×</strong> to <strong>3×</strong> —
          well within reach of caching, routing and compression applied seriously — and you halve
          your own token growth while consuming the same intelligence.
          <More label="A correction worth stating openly">
            An earlier draft of this research cited “120× token growth by 2030” attributed to
            Gartner. Both were wrong. The source is Goldman Sachs Research (20 May 2026), which
            forecasts token consumption multiplying <strong>24×</strong>, to 120 quadrillion tokens
            per month. The 120 is the absolute monthly volume, not the multiplier — and this model
            is calibrated to the corrected 24×.
          </More>
        </Callout>
      </Fold>

      <Fold title="The trends behind the numbers" sub="Four structural shifts driving the demand side.">
        <div className="grid grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {FUTURE_DEMAND.map((t) => (
            <div className="card" key={t.name}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6, color: 'var(--accent-pink)' }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>→ {t.so}</div>
              <More label="The evidence">{t.fact}</More>
            </div>
          ))}
        </div>
      </Fold>
    </Section>
  )
}
