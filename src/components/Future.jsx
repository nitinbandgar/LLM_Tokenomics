import React, { useMemo, useState } from 'react'
import { Section, Block, Slider, Seg, ResultStrip, Callout, DataTable } from './ui.jsx'
import { TIMELINE_2030, GLOSSARY, FUTURE_SUPPLY, FUTURE_DEMAND } from '../data.js'

/* ------------------------------------------------------------------ */
/* The 2030 spend projector: deflation vs consumption, the Jevons race */
/* ------------------------------------------------------------------ */
function SpendProjector() {
  const [deflation, setDeflation] = useState(3) // ×/year price fall for constant capability
  const [growth, setGrowth] = useState(3.3) // ×/year token consumption growth (agentic adoption)

  const YEARS = [2026, 2027, 2028, 2029, 2030]
  const series = useMemo(() => YEARS.map((y, i) => ({
    year: y,
    price: Math.pow(1 / deflation, i),
    cons: Math.pow(growth, i),
    spend: Math.pow(growth / deflation, i),
  })), [deflation, growth])

  const last = series[series.length - 1]
  const spendUp = last.spend >= 1

  // log-scale chart
  const W = 640, H = 280, pad = 50
  const logMax = Math.log10(Math.max(last.cons, 1 / last.price, 10))
  const logMin = -logMax
  const x = (i) => pad + (i / (YEARS.length - 1)) * (W - 2 * pad)
  const y = (v) => H - pad - ((Math.log10(v) - logMin) / (logMax - logMin)) * (H - 2 * pad)
  const path = (key) => series.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d[key])}`).join(' ')
  const fmtX = (v) => (v >= 1 ? `${v >= 10 ? Math.round(v) : v.toFixed(1)}×` : `÷${(1 / v) >= 10 ? Math.round(1 / v) : (1 / v).toFixed(1)}`)

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="Price deflation — how fast unit prices keep falling" value={deflation} min={1.5} max={6} step={0.1}
            display={`÷${deflation.toFixed(1)} per year`} onChange={setDeflation} />
          <Slider label="Consumption growth — how fast agentic adoption multiplies tokens" value={growth} min={1.2} max={5} step={0.1}
            display={`×${growth.toFixed(1)} per year`} onChange={setGrowth} />
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>
            Reference points: the report expects prices to fall 3–5× annually through 2027, and
            agentic adoption to multiply consumption up to 120× by 2030 (≈ ×3.3/year). Drag both and
            watch which force wins the race.
          </div>
          <ResultStrip items={[
            { label: '2030 unit price', value: fmtX(last.price), note: 'vs today, same capability', color: 'var(--accent-cyan)' },
            { label: '2030 consumption', value: fmtX(last.cons), note: 'tokens per year', color: 'var(--accent-violet)' },
            { label: '2030 bill', value: fmtX(last.spend), color: spendUp ? 'var(--accent-pink)' : 'var(--accent-green)', note: spendUp ? 'consumption wins — spend rises' : 'deflation wins — spend falls' },
          ]} />
        </div>
        <div>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
            <line x1={pad} y1={y(1)} x2={W - pad} y2={y(1)} stroke="var(--border-bright)" strokeDasharray="4 5" />
            <text x={pad - 6} y={y(1) + 4} fill="var(--text-faint)" fontSize="10" textAnchor="end" fontFamily="var(--mono)">1×</text>
            <path d={path('cons')} fill="none" stroke="var(--accent-violet)" strokeWidth="3" strokeLinecap="round" />
            <path d={path('price')} fill="none" stroke="var(--accent-cyan)" strokeWidth="3" strokeLinecap="round" />
            <path d={path('spend')} fill="none" stroke={spendUp ? 'var(--accent-pink)' : 'var(--accent-green)'} strokeWidth="4" strokeLinecap="round" />
            {YEARS.map((yr, i) => (
              <text key={yr} x={x(i)} y={H - pad + 20} fill="var(--text-faint)" fontSize="10.5" textAnchor="middle" fontFamily="var(--mono)">{yr}</text>
            ))}
            <text x={W - pad + 4} y={y(last.cons) + 4} fill="var(--accent-violet)" fontSize="10.5" fontFamily="var(--mono)">tokens</text>
            <text x={W - pad + 4} y={y(last.price) + 4} fill="var(--accent-cyan)" fontSize="10.5" fontFamily="var(--mono)">price</text>
            <text x={W - pad + 4} y={y(last.spend) + 4} fill={spendUp ? 'var(--accent-pink)' : 'var(--accent-green)'} fontSize="11" fontWeight="700" fontFamily="var(--mono)">bill</text>
          </svg>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 4 }}>
            Log scale. The bill line is simply consumption ÷ deflation — the entire tension of
            tokenomics to 2030 in one ratio.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function ForceCards() {
  const [side, setSide] = useState('supply')
  const items = side === 'supply' ? FUTURE_SUPPLY : FUTURE_DEMAND
  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Seg
          options={[
            { value: 'supply', label: '⬇ Supply forces — push prices down' },
            { value: 'demand', label: '⬆ Demand forces — push spend up' },
          ]}
          value={side}
          onChange={setSide}
        />
      </div>
      <div className="grid grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {items.map((t) => (
          <div className="card" key={t.name}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: side === 'supply' ? 'var(--accent-cyan)' : 'var(--accent-pink)' }}>{t.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 8 }}>{t.fact}</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>→ {t.so}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
function Glossary() {
  const [q, setQ] = useState('')
  const items = GLOSSARY.filter(
    (g) => !q || (g.term + g.meaning + g.why).toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter terms… (try “cache”)"
        style={{
          width: '100%', maxWidth: 340, background: 'var(--bg-soft)', color: 'var(--text)',
          border: '1px solid var(--border-bright)', borderRadius: 10, padding: '10px 14px',
          fontFamily: 'var(--sans)', fontSize: 13.5, outline: 'none', marginBottom: 16,
        }}
      />
      <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
        {items.map((g) => (
          <div className="card" key={g.term} style={{ padding: 16 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13.5, fontWeight: 600, color: 'var(--accent-cyan)' }}>{g.term}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', margin: '6px 0' }}>{g.meaning}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>💡 {g.why}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const CONF_COLOR = {
  High: 'var(--accent-green)',
  'Medium-high': 'var(--accent-cyan)',
  Medium: 'var(--accent-yellow)',
  Directional: 'var(--accent-orange)',
}

const IMPLICATIONS = [
  ['Unit costs keep collapsing — $0.02/M already demonstrated on open 120B models', 'Bills rise even as prices fall — manage cost per business outcome, not total spend'],
  ['The mid-market commoditises to utility economics: scale, utilisation and energy decide winners', 'Token FinOps becomes a permanent platform-engineering function'],
  ['Frontier pricing power narrows to what open models cannot match; revenue shifts to the agent layer', 'Model choice becomes a portfolio, refreshed quarterly behind a routing layer'],
  ['Pricing shifts from tokens to outcomes — raw tokens become the wholesale layer', 'Open weights become the default for routine work; frontier for the hard tail'],
  ['Vertical integration (silicon, datacentres, energy) becomes the margin defence', 'The risk inverts: under-consuming AI becomes the bigger danger than overspending'],
]

export default function Future() {
  return (
    <Section
      id="future"
      kicker="Module 09 · Forward-looking"
      title="The road to 2030"
      lede={
        <>
          Everything ahead is a race between two forces: supply-side engineering pushing the price
          of a token relentlessly down, and agentic demand multiplying how many tokens the world
          consumes. Extrapolations, not certainties — confidence is indicated throughout.
        </>
      }
    >
      <Block
        title="Run the race yourself"
        sub="Two sliders: how fast prices fall vs how fast consumption grows. The bill is just the ratio."
      >
        <SpendProjector />
      </Block>

      <Block title="The forces behind each line" sub="Flip between the two sides of the race.">
        <ForceCards />
      </Block>

      <Block title="The trajectory to 2030" sub="Four horizons, with confidence.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TIMELINE_2030.map((t) => (
            <div className="card" key={t.horizon} style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 600, color: 'var(--accent-cyan)', width: 90, flexShrink: 0 }}>
                {t.horizon}
              </div>
              <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text-dim)', minWidth: 240 }}>{t.dev}</div>
              <span className="chip" style={{ color: CONF_COLOR[t.confidence], borderColor: CONF_COLOR[t.confidence] + '66' }}>
                {t.confidence} confidence
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="What it means — for sellers and for buyers">
        <DataTable
          headers={['Implications for suppliers', 'Implications for enterprise consumers']}
          rows={IMPLICATIONS}
        />
      </Block>

      <Callout title="The closing thought">
        Treat tokens as a managed resource: <strong>meter, route, cache and batch — then reinvest
        the savings in scale.</strong> The winning enterprise architecture is hybrid and
        policy-driven: small or open models for high-volume routine work; premium frontier models
        for hard cases; batch lanes for offline jobs; cached prefixes for repeated corpora; and
        private or regional deployment only where regulation justifies the uplift. Through 2025 the
        risk was overspending on AI. From here, the greater risk is under-consuming it.
      </Callout>

      <Block title="Glossary — the working vocabulary of token economics">
        <Glossary />
      </Block>
    </Section>
  )
}
