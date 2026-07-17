import React, { useMemo, useState } from 'react'
import { Section, Block, Slider, Seg, ResultStrip, Callout, DataTable } from './ui.jsx'
import { COST_STACK, fmtUSD } from '../data.js'

// 8× H100 node reference specs
const NODE_HBM_GB = 640 // 8 × 80 GB
const NODE_BW_TBS = 26.8 // 8 × 3.35 TB/s aggregate
const NODE_FLOPS = 8e15 * 0.4 // ~8 PFLOP/s FP16 dense × 40% MFU

const PRECISIONS = [
  { value: 2, label: 'FP16' },
  { value: 1, label: 'FP8' },
  { value: 0.5, label: 'FP4' },
]

function CostFloorCalculator() {
  const [params, setParams] = useState(70) // billions
  const [bytes, setBytes] = useState(2)
  const [batch, setBatch] = useState(32)
  const [hourly, setHourly] = useState(20)

  const weightGB = params * bytes
  const fits = weightGB < NODE_HBM_GB * 0.85
  // memory-bound: one full weight read per forward pass, shared across the batch
  const singleStream = (NODE_BW_TBS * 1e12) / (weightGB * 1e9)
  const memBound = singleStream * batch
  const computeBound = NODE_FLOPS / (2 * params * 1e9)
  const tokensPerSec = Math.min(memBound, computeBound)
  const regime = memBound < computeBound ? 'memory-bandwidth-bound' : 'compute-bound (GPU saturated)'
  const costPerM = (hourly / (tokensPerSec * 3600)) * 1e6
  const unbatchedCost = (hourly / (singleStream * 3600)) * 1e6

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="Model size (dense parameters)" value={params} min={7} max={405} step={1}
            display={`${params}B`} onChange={setParams} />
          <div className="control-row">
            <div className="control-label"><span>Weight precision</span>
              <span className="control-value">{bytes * 8}-bit · {weightGB.toFixed(0)} GB of weights</span></div>
            <Seg options={PRECISIONS} value={bytes} onChange={setBytes} />
          </div>
          <Slider label="Achieved batch size (requests served together)" value={batch} min={1} max={256} step={1}
            display={`${batch}×`} onChange={setBatch} />
          <Slider label="Node rental cost (8× H100)" value={hourly} min={5} max={80} step={1}
            display={`$${hourly}/hr`} onChange={setHourly} />
        </div>
        <div>
          {!fits ? (
            <div className="callout pink" style={{ margin: 0 }}>
              <strong>Doesn’t fit.</strong> {weightGB.toFixed(0)} GB of weights exceeds this node’s
              usable HBM (~{Math.round(NODE_HBM_GB * 0.85)} GB). Quantise to a lower precision, pick
              a smaller model, or add nodes.
            </div>
          ) : (
            <>
              <ResultStrip items={[
                { label: 'Node throughput', value: `${Math.round(tokensPerSec).toLocaleString()} tok/s`, note: regime },
                { label: 'Cost per 1M output tokens', value: fmtUSD(costPerM, 2), color: 'var(--accent-green)' },
                { label: 'Same, unbatched', value: fmtUSD(unbatchedCost, 2), note: `batching saves ${Math.round((1 - costPerM / unbatchedCost) * 100)}%`, color: 'var(--accent-pink)' },
              ]} />
              <div style={{ marginTop: 18, fontSize: 13, color: 'var(--text-dim)' }}>
                Compare your floor of <strong style={{ color: 'var(--accent-green)' }}>{fmtUSD(costPerM, 2)}/M</strong> to market list prices:
              </div>
              <div style={{ marginTop: 10 }}>
                {[
                  { name: 'Your hardware floor', v: costPerM, c: 'var(--accent-green)' },
                  { name: 'Open-weight host (70B)', v: 0.6, c: 'var(--accent-cyan)' },
                  { name: 'Mid-tier API output', v: 15, c: 'var(--accent-violet)' },
                  { name: 'Frontier API output', v: 25, c: 'var(--accent-pink)' },
                ].map((r) => {
                  const maxV = Math.max(costPerM, 25)
                  return (
                    <div className="bar-row" key={r.name}>
                      <div className="bar-label">{r.name}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${Math.max(2, (r.v / maxV) * 100)}%`, background: r.c }}>
                          <span className="bar-value">{fmtUSD(r.v, 2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 16 }}>
        Simplified first-principles model: decoding reads every weight per forward pass, so
        single-stream speed = memory bandwidth ÷ weight bytes; batching shares that read across
        requests until arithmetic becomes the limit (~40% MFU assumed). The report’s worked example —
        70B dense, FP16, batch ~32, $20/hr — lands at ≈$1/M output tokens. Blackwell-class silicon
        pushes the floor toward $0.02/M on open 120B models.
      </div>
    </div>
  )
}

function KVCacheViz() {
  const [ctx, setCtx] = useState(16) // K tokens
  const [params, setParams] = useState(70)
  const bytes = 2
  const weightGB = params * bytes
  const kvPerTokMB = 0.32 * (params / 70) // ~320 KB/token for a 70B-class model, scaled
  const freeGB = Math.max(0, NODE_HBM_GB * 0.9 - weightGB)
  const perSeqGB = (ctx * 1000 * kvPerTokMB) / 1000
  const maxBatch = Math.max(0, Math.floor(freeGB / Math.max(0.001, perSeqGB)))
  const shownBatch = Math.min(maxBatch, 64)
  const singleStream = (NODE_BW_TBS * 1e12) / (weightGB * 1e9)
  const cost = maxBatch > 0 ? (20 / (Math.min(singleStream * maxBatch, NODE_FLOPS / (2 * params * 1e9)) * 3600)) * 1e6 : Infinity

  const weightsPct = (weightGB / NODE_HBM_GB) * 100
  const kvPct = Math.min(100 - weightsPct, ((perSeqGB * shownBatch) / NODE_HBM_GB) * 100)

  return (
    <div className="panel">
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="Context length per request" value={ctx} min={1} max={200} step={1}
            display={`${ctx}K tokens`} onChange={setCtx} />
          <Slider label="Model size (FP16)" value={params} min={7} max={180} step={1}
            display={`${params}B · ${weightGB.toFixed(0)} GB weights`} onChange={setParams} />
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 6 }}>
            One 8× H100 node = {NODE_HBM_GB} GB of HBM. Whatever the weights don’t occupy is
            KV-cache space — and KV grows with context length × concurrent requests.
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            GPU memory (HBM) — {NODE_HBM_GB} GB
          </div>
          <div style={{ display: 'flex', height: 40, borderRadius: 9, overflow: 'hidden', border: '1px solid var(--border-bright)' }}>
            <div style={{ width: `${weightsPct}%`, background: 'var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0b0e17', transition: 'width 0.3s' }}>
              {weightsPct > 14 ? 'Model weights' : ''}
            </div>
            <div style={{ width: `${kvPct}%`, background: 'var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0b0e17', transition: 'width 0.3s' }}>
              {kvPct > 12 ? 'KV cache' : ''}
            </div>
            <div style={{ flex: 1, background: 'var(--bg)' }} />
          </div>
          <div className="legend">
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-violet)' }} />Weights · {weightGB.toFixed(0)} GB</div>
            <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--accent-orange)' }} />KV cache · {perSeqGB.toFixed(1)} GB per request</div>
          </div>
          <ResultStrip items={[
            { label: 'Max concurrent requests', value: maxBatch > 999 ? '1000+' : maxBatch, note: 'the feasible batch size', color: maxBatch < 8 ? 'var(--accent-pink)' : 'var(--accent-cyan)' },
            { label: 'Cost floor at that batch', value: isFinite(cost) ? fmtUSD(cost, 2) + '/M' : '—', note: maxBatch === 0 ? 'context doesn’t fit at all' : maxBatch < 8 ? 'small batch → expensive tokens' : 'healthy batching' },
          ]} />
        </div>
      </div>
      <Callout tone="pink" title="Why long context is priced steeply">
        Long contexts squeeze the KV cache and shrink the feasible batch size for everyone sharing
        the GPU — fewer requests amortising the same hardware means a higher cost per token. That is
        the physical reason providers surcharge long context, and why{' '}
        <strong>“stuff everything into the context window” is the most expensive habit in enterprise usage.</strong>
      </Callout>
    </div>
  )
}

function CostStack() {
  const [hover, setHover] = useState(null)
  return (
    <div className="panel">
      <div style={{ display: 'flex', height: 46, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-bright)' }}>
        {COST_STACK.map((c) => (
          <div
            key={c.name}
            onMouseEnter={() => setHover(c.name)}
            onMouseLeave={() => setHover(null)}
            style={{
              width: `${c.share}%`, background: c.color, cursor: 'default',
              opacity: hover && hover !== c.name ? 0.35 : 0.92,
              transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11.5, fontWeight: 700, color: '#0b0e17',
            }}
          >
            {c.share >= 10 ? `${c.share}%` : ''}
          </div>
        ))}
      </div>
      <div className="legend">
        {COST_STACK.map((c) => (
          <div className="legend-item" key={c.name} onMouseEnter={() => setHover(c.name)} onMouseLeave={() => setHover(null)}>
            <div className="legend-dot" style={{ background: c.color }} />{c.name}
          </div>
        ))}
      </div>
      <div style={{ minHeight: 44, marginTop: 12, fontSize: 13, color: 'var(--text-dim)' }}>
        {hover
          ? <><strong style={{ color: 'var(--text)' }}>{hover}:</strong> {COST_STACK.find((c) => c.name === hover)?.desc}</>
          : 'Hover a segment. Illustrative share of serving cost for a commodity host. Proprietary vendors add training amortisation ($100M–$1B+ per frontier model over a 12–18-month half-life), R&D, safety and data licensing on top — priced into their margins.'}
      </div>
    </div>
  )
}

const PPA_CARDS = [
  { who: 'Microsoft', what: 'restarting Three Mile Island Unit 1', num: '835 MW', note: '~20-year nuclear power purchase agreement' },
  { who: 'AWS', what: 'Susquehanna nuclear plant contract', num: '1.92 GW', note: 'direct plant-adjacent capacity' },
  { who: 'Google', what: 'fleet of small modular reactors', num: '2030s', note: 'ordered for the next decade of AI load' },
  { who: 'US grid queues', what: 'projects waiting for interconnection', num: '2,600 GW', note: '~half of planned AI datacentres face delays' },
]

function EnergyCalculator() {
  const [gpus, setGpus] = useState(1000)
  const [price, setPrice] = useState(0.12) // $/kWh
  const [pue, setPue] = useState(1.3)

  const serverKWPerGpu = 1.25 // ~10 kW per 8-GPU server, incl. CPU/memory/network
  const itMW = (gpus * serverKWPerGpu) / 1000
  const totalMW = itMW * pue
  const monthlyKWh = totalMW * 1000 * 730
  const monthlyBill = monthlyKWh * price
  const homes = Math.round((totalMW * 1000) / 1.2) // ~1.2 kW average home draw

  const chain = [
    { name: '1 GPU', val: '~700 W', sub: 'under load', color: 'var(--accent-cyan)' },
    { name: '8-GPU server', val: '~10 kW', sub: '+CPUs, memory, network', color: 'var(--accent-violet)' },
    { name: `${gpus.toLocaleString()}-GPU cluster`, val: `${itMW.toFixed(2)} MW`, sub: 'IT load', color: 'var(--accent-orange)' },
    { name: 'With cooling (PUE)', val: `${totalMW.toFixed(2)} MW`, sub: `× ${pue.toFixed(2)} facility overhead`, color: 'var(--accent-pink)' },
  ]

  return (
    <div className="panel">
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'stretch', marginBottom: 18 }}>
        {chain.map((c, i) => (
          <React.Fragment key={c.name}>
            <div className="card" style={{ flex: '1 1 130px', padding: 12, borderColor: c.color + '66', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{c.name}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: c.color, margin: '3px 0' }}>{c.val}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{c.sub}</div>
            </div>
            {i < chain.length - 1 && <div style={{ alignSelf: 'center', color: 'var(--text-faint)' }}>→</div>}
          </React.Fragment>
        ))}
      </div>
      <div className="grid grid-2" style={{ gap: 30 }}>
        <div>
          <Slider label="GPUs in the cluster" value={gpus} min={8} max={5000} step={8}
            display={gpus.toLocaleString()} onChange={setGpus} />
          <Slider label="Electricity price" value={price} min={0.05} max={0.25} step={0.01}
            display={`$${price.toFixed(2)}/kWh`} onChange={setPrice} />
          <Slider label="PUE — cooling & facility overhead" value={pue} min={1.1} max={1.5} step={0.05}
            display={`×${pue.toFixed(2)}`} onChange={setPue} />
        </div>
        <div>
          <ResultStrip items={[
            { label: 'Continuous draw', value: `${totalMW.toFixed(2)} MW`, note: `≈ ${homes.toLocaleString()} homes, day and night`, color: 'var(--accent-orange)' },
            { label: 'Electricity bill', value: fmtUSD(monthlyBill) + '/mo', color: 'var(--accent-pink)', note: 'before a single salary or lease' },
          ]} />
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '14px 0 6px' }}>
            But per token, energy is small
          </div>
          <div style={{ display: 'flex', height: 30, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-bright)' }}>
            <div style={{ width: '15%', background: 'var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#0b0e17' }}>energy</div>
            <div style={{ width: '85%', background: 'var(--accent-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10.5, fontWeight: 700, color: '#0b0e17' }}>GPU depreciation & everything else</div>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
            Electricity is only ~10–20% of serving cost — but an idle GPU burns depreciation whether
            or not it serves tokens, which is why <strong style={{ color: 'var(--text)' }}>utilisation,
            not wattage, is the number operators obsess over</strong>.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SupplySide() {
  return (
    <Section
      id="supply"
      kicker="Module 04 · Supply-side economics"
      title="What a token actually costs to produce"
      lede={
        <>
          Every price on an API page is a markup over a marginal cost you can derive from four
          quantities: <strong>arithmetic per token, memory bandwidth, memory capacity, and the
          hourly cost of hardware</strong>. Build the cost from first principles and the entire
          pricing landscape stops looking arbitrary.
        </>
      }
    >
      <Block
        title="The cost-floor calculator"
        sub="Rent a GPU node, pick a model, and derive the physical floor under every token price. Watch what batching and quantisation do."
      >
        <CostFloorCalculator />
      </Block>

      <Callout tone="green" title="Batching changes everything">
        If 32 requests are processed together, the weights are read once per forward pass and reused
        across all 32 sequences — per-token cost drops ~85% for ~20% added latency. Continuous
        batching (vLLM-style) pushes batch sizes to 64–512 and makes the GPU compute-saturated: the
        regime where expensive hardware earns its price. <strong>Serving cost is overwhelmingly a
        function of achieved batch size and utilisation.</strong>
      </Callout>

      <Block
        title="The KV-cache tax: why long context costs more"
        sub="Model weights and the KV cache compete for the same scarce GPU memory. Slide the context length and watch the feasible batch collapse."
      >
        <KVCacheViz />
      </Block>

      <Block
        title="Every token is converted electricity"
        sub="Size a GPU cluster and watch the power bill assemble — one GPU at a time, up to the grid connection."
      >
        <EnergyCalculator />
      </Block>

      <Block title="Power is now the binding constraint" sub="When suppliers sign decade-long nuclear deals to serve tokens, energy stops being an operating detail and becomes a strategic moat — and a floor under long-run prices.">
        <div className="grid grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          {PPA_CARDS.map((p) => (
            <div className="card" key={p.who}>
              <div className="big-num" style={{ color: 'var(--accent-orange)', fontSize: 26 }}>{p.num}</div>
              <div style={{ fontWeight: 600, fontSize: 13.5, margin: '4px 0' }}>{p.who} — {p.what}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.note}</div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="The full stack a provider must recover">
        <CostStack />
      </Block>

      <details className="expand">
        <summary>Go deeper: training economics — the 6 × N × D rule, MFU, and adapter-era fine-tuning</summary>
        <div className="expand-body">
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text)' }}>The compute rule.</strong> Dense transformer
            training costs roughly <span style={{ fontFamily: 'var(--mono)' }}>FLOPs ≈ 6 × N × D</span>{' '}
            (N = parameters, D = training tokens). Chinchilla showed many large models were
            undertrained: a 70B model trained on 4× more data can beat much larger models at the
            same budget — training cost is a design choice, not just a size choice.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong style={{ color: 'var(--text)' }}>Utilisation (MFU).</strong> Model FLOPs
            Utilisation ranges from ~21% (GPT-3 on V100) to 44–56% (TPU v4). A cluster at 50% MFU is
            roughly twice as cost-effective as one at 25% on the same silicon. PaLM-class training
            used 6,144 TPU v4 chips ≈ $20,000/hour of rented accelerator time — $14–28M for a run.
            Frontier runs today are $100M–$1B+.
          </p>
          <DataTable
            headers={['Technique', 'What it showed', 'Economic consequence']}
            rows={[
              ['LoRA (2021)', 'Low-rank adapters cut trainable parameters 10,000× and GPU memory 3× vs full fine-tuning', 'Customisation becomes a low-cost engineering project, not frontier capex'],
              ['QLoRA (2023)', 'A 65B model fine-tuned on a single 48GB GPU in ~24 hours (4-bit)', 'Serious tuning fits on one workstation GPU — thousands of dollars, not millions'],
              ['Distillation', 'A frontier model’s behaviour on a narrow task compressed into a small open model', 'Up to 10× cheaper serving on that workload — the end-game for high-volume routine tasks'],
            ]}
          />
        </div>
      </details>
    </Section>
  )
}
