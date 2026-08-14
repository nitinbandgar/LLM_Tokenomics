import React, { useState } from 'react'
import { Section, Fold, Slider, Seg, ResultStrip, Callout, DataTable, Hint, More } from './ui.jsx'
import { COST_STACK, fmtUSD } from '../data.js'

// 8× H100 node reference specs
const NODE_HBM_GB = 640 // 8 × 80 GB
const NODE_BW_TBS = 26.8 // 8 × 3.35 TB/s aggregate
const NODE_FLOPS = 8e15 * 0.4 // ~8 PFLOP/s FP16 dense × 40% MFU

/* ------------------------------------------------------------------ */
/* 1 · OVERVIEW — the whole stack first, then drill in                 */
/* ------------------------------------------------------------------ */
function CostStack({ onDrill }) {
  const [sel, setSel] = useState(null)
  const cur = COST_STACK.find((c) => c.name === sel)
  const DRILL = { 'GPU capex / depreciation': 'floor', 'Energy & datacentre': 'energy' }

  return (
    <div className="panel">
      <Hint>Click any band to see what it is. The two biggest — hardware and energy — have their own calculators below.</Hint>
      <div style={{ display: 'flex', height: 52, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-bright)' }}>
        {COST_STACK.map((c) => (
          <button
            key={c.name}
            onClick={() => setSel(c.name === sel ? null : c.name)}
            style={{
              width: `${c.share}%`, background: c.color, cursor: 'pointer', border: 'none',
              opacity: sel && sel !== c.name ? 0.32 : 0.95, transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#0b0e17', font: 'inherit', fontWeight: 700,
            }}
          >
            {c.share >= 7 ? `${c.share}%` : ''}
          </button>
        ))}
      </div>
      <div className="legend">
        {COST_STACK.map((c) => (
          <div className="legend-item" key={c.name} onClick={() => setSel(c.name === sel ? null : c.name)} style={{ cursor: 'pointer' }}>
            <div className="legend-dot" style={{ background: c.color }} />{c.name}
          </div>
        ))}
      </div>

      <div className="popcard" style={{ marginTop: 12, minHeight: 74 }}>
        {cur ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: cur.color }}>{cur.name}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 700, color: cur.color }}>{cur.share}%</span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 6 }}>{cur.desc}</div>
            {DRILL[cur.name] && (
              <button className="btn" style={{ marginTop: 10, fontSize: 12 }} onClick={() => onDrill(DRILL[cur.name])}>
                ↓ Open the {DRILL[cur.name] === 'floor' ? 'hardware' : 'energy'} calculator
              </button>
            )}
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
            Illustrative shares of <strong style={{ color: 'var(--text)' }}>serving</strong> cost for a
            commodity host. Click a band for detail.
          </div>
        )}
      </div>

      <Callout tone="pink" title="Important: this is the cost of running the model, not building it">
        These shares cover <strong>inference only</strong> — the cost of answering your requests.
        Training a frontier model ($100M–$1B+, recovered over a 12–18 month competitive half-life)
        is a <strong>separate line</strong> that proprietary vendors price into their margin and
        open-weight hosts do not carry at all. That single difference explains much of why the same
        capability can cost 10× more from one supplier than another.
      </Callout>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 2 · The hardware floor (biggest band)                               */
/* ------------------------------------------------------------------ */
const PRECISIONS = [
  { value: 2, label: 'FP16' },
  { value: 1, label: 'FP8' },
  { value: 0.5, label: 'FP4' },
]

function CostFloorCalculator() {
  const [params, setParams] = useState(70)
  const [bytes, setBytes] = useState(2)
  const [batch, setBatch] = useState(32)
  const [hourly, setHourly] = useState(20)

  const weightGB = params * bytes
  const fits = weightGB < NODE_HBM_GB * 0.85
  const singleStream = (NODE_BW_TBS * 1e12) / (weightGB * 1e9)
  const memBound = singleStream * batch
  const computeBound = NODE_FLOPS / (2 * params * 1e9)
  const tokensPerSec = Math.min(memBound, computeBound)
  const regime = memBound < computeBound ? 'memory-bandwidth-bound' : 'compute-bound (GPU saturated)'
  const costPerM = (hourly / (tokensPerSec * 3600)) * 1e6
  const unbatchedCost = (hourly / (singleStream * 3600)) * 1e6
  const atBase = params === 70 && bytes === 2 && batch === 32 && hourly === 20

  return (
    <div className="panel">
      <div className="popcard" style={{ marginBottom: 14, borderColor: 'rgba(74,222,128,0.4)' }}>
        <div style={{ fontSize: 12.5, color: 'var(--text)' }}>
          <strong>What this models:</strong> you rent one 8×H100 node and serve a model on it
          yourself. The answer is the <strong>floor</strong> — the raw hardware cost of producing a
          million output tokens, before any margin, training or R&amp;D.{' '}
          <span style={{ color: 'var(--text-faint)' }}>Inference only.</span>
        </div>
      </div>
      <Hint>
        Starts on the report’s worked example — <strong>70B model, FP16, batch 32, $20/hr → ≈$1 per
        million tokens</strong>. Now try it: drag <strong>batch size</strong> down to 1 to see why
        batching matters, or switch precision to FP4 to halve the memory traffic.
      </Hint>

      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="Model size (dense parameters)" value={params} min={7} max={405} step={1} display={`${params}B`} onChange={setParams} />
          <div className="control-row">
            <div className="control-label"><span>Weight precision</span>
              <span className="control-value">{bytes * 8}-bit · {weightGB.toFixed(0)} GB of weights</span></div>
            <Seg options={PRECISIONS} value={bytes} onChange={setBytes} />
          </div>
          <Slider label="Batch size (requests served together)" value={batch} min={1} max={256} step={1} display={`${batch}×`} onChange={setBatch} />
          <Slider label="Node rental cost (8× H100)" value={hourly} min={5} max={80} step={1} display={`$${hourly}/hr`} onChange={setHourly} />
          {atBase && (
            <div style={{ fontSize: 11.5, color: 'var(--accent-green)' }}>✓ You are on the report’s worked example.</div>
          )}
        </div>
        <div>
          {!fits ? (
            <div className="callout pink" style={{ margin: 0 }}>
              <strong>Doesn’t fit.</strong> {weightGB.toFixed(0)} GB of weights exceeds this node’s usable
              memory (~{Math.round(NODE_HBM_GB * 0.85)} GB). Quantise to a lower precision, pick a smaller
              model, or add nodes.
            </div>
          ) : (
            <>
              <ResultStrip items={[
                { label: 'Cost per 1M output tokens', value: fmtUSD(costPerM, 2), color: 'var(--accent-green)', note: 'your hardware floor' },
                { label: 'Node throughput', value: `${Math.round(tokensPerSec).toLocaleString()} tok/s`, note: regime },
                { label: 'If you did not batch', value: fmtUSD(unbatchedCost, 2), color: 'var(--accent-pink)', note: `batching saves ${Math.round((1 - costPerM / unbatchedCost) * 100)}%` },
              ]} />
              <div style={{ marginTop: 16 }}>
                {[
                  { name: 'Your hardware floor', v: costPerM, c: 'var(--accent-green)' },
                  { name: 'Open-weight host (70B)', v: 0.6, c: 'var(--accent-cyan)' },
                  { name: 'Mid-tier API output', v: 15, c: 'var(--accent-violet)' },
                  { name: 'Frontier API output', v: 25, c: 'var(--accent-pink)' },
                ].map((r) => (
                  <div className="bar-row" key={r.name}>
                    <div className="bar-label">{r.name}</div>
                    <div className="bar-track" style={{ height: 19 }}>
                      <div className="bar-fill" style={{ width: `${Math.max(2, (r.v / Math.max(costPerM, 25)) * 100)}%`, background: r.c }}>
                        <span className="bar-value">{fmtUSD(r.v, 2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                Everything above your floor is the rest of the stack — plus pricing power.
              </div>
            </>
          )}
        </div>
      </div>
      <More label="How the calculation works">
        Decoding reads every weight per forward pass, so single-stream speed = memory bandwidth ÷
        weight bytes; batching shares that read across requests until arithmetic becomes the limit
        (~40% MFU assumed). Blackwell-class silicon pushes the floor toward $0.02/M on open 120B
        models.
      </More>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 3 · Energy (second band)                                            */
/* ------------------------------------------------------------------ */
function EnergyCalculator() {
  const [gpus, setGpus] = useState(1000)
  const [price, setPrice] = useState(0.12)
  const [pue, setPue] = useState(1.3)

  const itMW = (gpus * 1.25) / 1000
  const totalMW = itMW * pue
  const monthlyBill = totalMW * 1000 * 730 * price
  const homes = Math.round((totalMW * 1000) / 1.2)

  const chain = [
    { name: '1 GPU', val: '~700 W', color: 'var(--accent-cyan)' },
    { name: '8-GPU server', val: '~10 kW', color: 'var(--accent-violet)' },
    { name: `${gpus.toLocaleString()} GPUs`, val: `${itMW.toFixed(2)} MW`, color: 'var(--accent-orange)' },
    { name: '+ cooling', val: `${totalMW.toFixed(2)} MW`, color: 'var(--accent-pink)' },
  ]

  return (
    <div className="panel">
      <Hint>Size a cluster and set your power price. Watch how a single 700-watt chip becomes a megawatt-scale utility bill.</Hint>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {chain.map((c, i) => (
          <React.Fragment key={c.name}>
            <div className="card" style={{ flex: '1 1 120px', padding: 11, borderColor: c.color + '66', textAlign: 'center' }}>
              <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{c.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 600, color: c.color }}>{c.val}</div>
            </div>
            {i < chain.length - 1 && <div style={{ alignSelf: 'center', color: 'var(--text-faint)' }}>→</div>}
          </React.Fragment>
        ))}
      </div>
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="GPUs in the cluster" value={gpus} min={8} max={5000} step={8} display={gpus.toLocaleString()} onChange={setGpus} />
          <Slider label="Electricity price" value={price} min={0.05} max={0.25} step={0.01} display={`$${price.toFixed(2)}/kWh`} onChange={setPrice} />
          <Slider label="Cooling overhead (PUE)" value={pue} min={1.1} max={1.5} step={0.05} display={`×${pue.toFixed(2)}`} onChange={setPue} />
        </div>
        <div>
          <ResultStrip items={[
            { label: 'Continuous draw', value: `${totalMW.toFixed(2)} MW`, note: `≈ ${homes.toLocaleString()} homes, day and night`, color: 'var(--accent-orange)' },
            { label: 'Electricity bill', value: fmtUSD(monthlyBill) + '/mo', color: 'var(--accent-pink)', note: 'before a single salary' },
          ]} />
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 14 }}>
            Huge in absolute terms — but only <strong>~10–20%</strong> of serving cost. An idle GPU
            burns depreciation whether or not it serves tokens, which is why operators obsess over
            utilisation, not watts.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* 4 · The context squeeze                                             */
/* ------------------------------------------------------------------ */
function KVCacheViz() {
  const [ctx, setCtx] = useState(16)
  const [params, setParams] = useState(70)
  const weightGB = params * 2
  const kvPerTokMB = 0.32 * (params / 70)
  const freeGB = Math.max(0, NODE_HBM_GB * 0.9 - weightGB)
  const perSeqGB = (ctx * 1000 * kvPerTokMB) / 1000
  const maxBatch = Math.max(0, Math.floor(freeGB / Math.max(0.001, perSeqGB)))
  const singleStream = (NODE_BW_TBS * 1e12) / (weightGB * 1e9)
  const cost = maxBatch > 0 ? (20 / (Math.min(singleStream * maxBatch, NODE_FLOPS / (2 * params * 1e9)) * 3600)) * 1e6 : Infinity
  const weightsPct = (weightGB / NODE_HBM_GB) * 100
  const kvPct = Math.min(100 - weightsPct, ((perSeqGB * Math.min(maxBatch, 64)) / NODE_HBM_GB) * 100)

  return (
    <div className="panel">
      <Hint>Drag the context length up. Watch the orange band eat the GPU — and the cost per token climb as fewer customers fit.</Hint>
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="Context length per request" value={ctx} min={1} max={200} step={1} display={`${ctx}K tokens`} onChange={setCtx} />
          <Slider label="Model size (FP16)" value={params} min={7} max={180} step={1} display={`${params}B · ${weightGB.toFixed(0)} GB`} onChange={setParams} />
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            One node has {NODE_HBM_GB} GB of memory. Whatever the weights don’t use is working space
            for live conversations.
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', height: 38, borderRadius: 9, overflow: 'hidden', border: '1px solid var(--border-bright)' }}>
            <div style={{ width: `${weightsPct}%`, background: 'var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0b0e17', transition: 'width 0.3s' }}>
              {weightsPct > 14 ? 'weights' : ''}
            </div>
            <div style={{ width: `${kvPct}%`, background: 'var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0b0e17', transition: 'width 0.3s' }}>
              {kvPct > 12 ? 'live conversations' : ''}
            </div>
            <div style={{ flex: 1, background: 'var(--bg)' }} />
          </div>
          <ResultStrip items={[
            { label: 'Customers that fit', value: maxBatch > 999 ? '1000+' : maxBatch, color: maxBatch < 8 ? 'var(--accent-pink)' : 'var(--accent-cyan)' },
            { label: 'Cost per 1M tokens', value: isFinite(cost) ? fmtUSD(cost, 2) : '—', color: maxBatch < 8 ? 'var(--accent-pink)' : 'var(--accent-green)', note: maxBatch === 0 ? 'context does not fit' : maxBatch < 8 ? 'small batch → expensive' : 'healthy batching' },
          ]} />
        </div>
      </div>
      <Callout tone="pink" title="Why long context is surcharged">
        Long contexts crowd out other customers on the same GPU — fewer requests sharing the same
        hardware means a higher cost per token. <strong>“Stuff everything into the context window”
        is the most expensive habit in enterprise usage.</strong>
      </Callout>
    </div>
  )
}

/* ------------------------------------------------------------------ */
export default function SupplySide() {
  const [drill, setDrill] = useState(null)

  return (
    <Section
      id="supply"
      kicker="Module 05 · Supply-side economics"
      title="What a token actually costs to produce"
      lede={
        <>
          Every price on an API page is a markup over a physical cost. Start with the whole stack a
          provider must recover, then open up the two biggest pieces yourself.
        </>
      }
    >
      <Fold title="Start here: what a provider is actually paying for" sub="Shares of the cost of serving one token. Click a band to drill in." open>
        <CostStack onDrill={setDrill} />
      </Fold>

      <Fold title="① The hardware floor" sub="55% of serving cost. Derive the physical floor under every token price." badge="calculator">
        <CostFloorCalculator key={drill === 'floor' ? 'drilled' : 'normal'} />
      </Fold>

      <Fold title="② Energy and data centres" sub="15% of serving cost. Every token is, at bottom, converted electricity." badge="calculator">
        <EnergyCalculator key={drill === 'energy' ? 'drilled' : 'normal'} />
      </Fold>

      <Fold title="③ The context squeeze — why batching decides the price" sub="Long contexts crowd out other customers, shrinking the batch that makes tokens cheap." badge="calculator">
        <KVCacheViz />
      </Fold>

      <Callout tone="green" title="The one number that decides everything">
        Serve 32 requests together and per-token cost drops <strong>~85%</strong> for ~20% added
        latency. <strong>Serving cost is overwhelmingly a function of achieved batch size and
        utilisation</strong> — not of which logo is on the GPU.
      </Callout>

      <details className="expand">
        <summary>Go deeper: training economics — the 6 × N × D rule, MFU, and adapter-era fine-tuning</summary>
        <div className="expand-body">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text)' }}>This is the separate line.</strong> Everything
            above is the cost of <em>running</em> a model. Training one is a different budget
            entirely: dense transformer training costs roughly{' '}
            <span style={{ fontFamily: 'var(--mono)' }}>FLOPs ≈ 6 × N × D</span> (N = parameters,
            D = training tokens). Chinchilla showed many large models were undertrained — a 70B
            model trained on 4× more data can beat much larger models at the same budget.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text)' }}>Utilisation (MFU).</strong> Achieved throughput
            versus theoretical peak ranges from ~21% to 44–56%. A cluster at 50% MFU is roughly twice
            as cost-effective as one at 25% on the same silicon. Frontier runs today are $100M–$1B+,
            recovered over a 12–18 month competitive half-life.
          </p>
          <DataTable
            headers={['Technique', 'What it showed', 'Economic consequence']}
            rows={[
              ['LoRA (2021)', 'Adapters cut trainable parameters 10,000× and GPU memory 3×', 'Customisation becomes an engineering project, not capex'],
              ['QLoRA (2023)', 'A 65B model fine-tuned on a single 48GB GPU in ~24 hours', 'Serious tuning fits on one workstation GPU'],
              ['Distillation', 'A frontier model’s behaviour compressed into a small open model', 'Up to 10× cheaper serving on that workload'],
            ]}
          />
        </div>
      </details>
    </Section>
  )
}
