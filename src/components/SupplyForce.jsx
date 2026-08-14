import React from 'react'
import { Section, Fold, Callout, More } from './ui.jsx'
import { Decomposition } from './ForceShared.jsx'
import { FUTURE_SUPPLY } from '../data.js'

export default function SupplyForce() {
  return (
    <Section
      id="force-supply"
      kicker="Module 4.1 · Supply side"
      title="What makes a token 35× cheaper by 2030"
      lede={
        <>
          These forces are usually asserted, rarely quantified. They can be: cost per token is a{' '}
          <strong>product</strong> of independent efficiency terms, so each force can be given a
          share that sums to exactly 100%.
        </>
      }
    >
      <Fold title="Build the number yourself" sub="Seven forces. Drag any one and watch 2030 change." open>
        <Decomposition side="supply" />
      </Fold>

      <Fold title="The headline finding" sub="Half the coming price fall is not chips.">
        <Callout tone="green" title="Software and model design matter as much as silicon">
          Hardware and numerics together account for ~42% of the decline; model architecture and
          serving software account for another ~42%. Energy — which dominates the trade press —
          contributes about <strong>3%</strong>. It constrains where capacity can be built; it is
          not what makes tokens cheap.
          <More label="Where this model could be wrong">
            The two largest terms are also the least certain. If HBM supply stays tight and
            accelerators deliver 2× rather than 3×, and architecture yields 1.9× rather than 2.8×,
            the total decline falls to roughly 10× instead of 35×. A genuine ASIC breakout with
            sub-4-bit numerics could push past 100×. Try the Slow and Fast presets above.
          </More>
        </Callout>
      </Fold>

      <Fold title="The trends behind the numbers" sub="Five structural shifts driving the supply side.">
        <div className="grid grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          {FUTURE_SUPPLY.map((t) => (
            <div className="card" key={t.name}>
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6, color: 'var(--accent-cyan)' }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>→ {t.so}</div>
              <More label="The evidence">{t.fact}</More>
            </div>
          ))}
        </div>
      </Fold>
    </Section>
  )
}
