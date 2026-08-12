// The 2026–2030 force model — mirrors LLM_Tokenomics_Force_Model_v5.xlsx.
//
// Cost per token is a PRODUCT of independent efficiency terms, so contributions
// are computed in log space (ln of each factor ÷ ln of the product). That makes
// each share order-independent and exactly additive to 100%.

export const SUPPLY_FORCES = [
  { key: 'accel', name: 'Accelerator price-performance', low: 2, base: 3.0, high: 4, color: 'var(--accent-cyan)',
    what: 'Tokens per second per dollar of silicon',
    basis: 'Rubin-class GPUs and inference ASICs toward ~40% share. NVIDIA claims ~10× cost/token for Rubin vs Blackwell; deliberately conservative here because software and numerics are counted separately.',
    confidence: 'Medium-high' },
  { key: 'arch', name: 'Model architecture efficiency', low: 1.9, base: 2.8, high: 3.5, color: 'var(--accent-violet)',
    what: 'Active parameters per unit of delivered quality',
    basis: 'MoE sparsity, distillation and routing to small models. 7B SLMs are 10–30× cheaper than 70–175B models on routine agentic steps (NVIDIA Research).',
    confidence: 'Medium' },
  { key: 'software', name: 'Serving software', low: 1.35, base: 1.6, high: 1.9, color: 'var(--accent-green)',
    what: 'Throughput per GPU from better scheduling',
    basis: 'Continuous batching already delivers ~85% and is priced in today. Remaining upside is speculative decoding, disaggregated prefill/decode and prefix reuse.',
    confidence: 'Medium' },
  { key: 'numerics', name: 'Numerics & quantisation', low: 1.25, base: 1.5, high: 1.8, color: 'var(--accent-orange)',
    what: 'Bytes moved per parameter per decoded token',
    basis: 'FP8 → FP4 and below; Blackwell is FP4-native. Theoretical ~2× remaining, discounted for accuracy preservation.',
    confidence: 'Medium-high' },
  { key: 'margin', name: 'Margin & market structure', low: 1.15, base: 1.3, high: 1.45, color: 'var(--accent-pink)',
    what: 'The markup of price over cost',
    basis: 'Open-weight substitutes compress margin independently of any cost change. Weakest sourcing — vendor margins are not disclosed.',
    confidence: 'Low' },
  { key: 'capex', name: 'Capex amortisation & utilisation', low: 1.05, base: 1.2, high: 1.3, color: 'var(--accent-yellow)',
    what: 'Achieved fleet utilisation and useful life',
    basis: 'MFU spans 21–56% across published campaigns; hyperscalers have extended server depreciation to 5–6 years.',
    confidence: 'Medium' },
  { key: 'energy', name: 'Energy & datacentre', low: 0.95, base: 1.1, high: 1.2, color: 'var(--text-dim)',
    what: 'Power and facility cost per token',
    basis: 'PPAs, nuclear supply and better PUE — near-neutral by design, because efficiency gains are offset by grid scarcity and HBM prices +20%.',
    confidence: 'Medium' },
]

export const DEMAND_FORCES = [
  { key: 'penetration', name: 'Workload penetration', low: 3, base: 5.2, high: 8, color: 'var(--accent-pink)',
    what: 'Share of business tasks that run on a model at all',
    basis: 'Absorbs what were previously separate “use-case breadth” and “adoption depth” terms — they measure the same thing. Anchored to Goldman’s 12% of knowledge workers using agentic AI by 2030.',
    confidence: 'Medium' },
  { key: 'agentic', name: 'Agentic task structure', low: 1.8, base: 3.0, high: 4.5, color: 'var(--accent-violet)',
    what: 'Tokens per task once a task is agentic',
    basis: 'Multi-step loops re-sending accumulated context. Gartner measures 5–30× per task; this is the blended mix effect across all traffic.',
    confidence: 'Medium' },
  { key: 'reasoning', name: 'Reasoning tokens', low: 1.2, base: 1.45, high: 1.8, color: 'var(--accent-orange)',
    what: 'Hidden chain-of-thought billed per call',
    basis: 'Discounted because Goldman’s simulated use-case token counts already embed some reasoning overhead.',
    confidence: 'Medium' },
  { key: 'multimodal', name: 'Multimodality', low: 1.1, base: 1.25, high: 1.6, color: 'var(--accent-cyan)',
    what: 'Image, audio and video tokens per interaction',
    basis: 'Judgement-based — no direct source. Challenge this one first.',
    confidence: 'Low' },
  { key: 'context', name: 'Context growth per call', low: 1.1, base: 1.22, high: 1.45, color: 'var(--accent-yellow)',
    what: 'Longer windows, richer retrieval, larger tool payloads',
    basis: 'Judgement-based — no direct source.',
    confidence: 'Low' },
]

// The only force that removes billable tokens — and the only one an enterprise controls.
// Note the inversion: MORE drag means LESS billable demand, so the low-demand
// scenario uses the high drag value (and vice versa). Slider range runs to 3×
// because that is what a serious optimisation programme can reach.
export const DRAG_FORCE = {
  key: 'drag', name: 'Efficiency & optimisation drag', low: 1.1, base: 1.45, high: 3,
  scenarioLow: 2, scenarioHigh: 1.1, color: 'var(--accent-green)',
  what: 'Caching, routing to small models, context compression, distillation',
  basis: 'The only force that removes billable tokens — and the only one an individual enterprise controls. Market average is ~1.45×; 3× is within reach of caching, routing and compression applied seriously.',
  confidence: 'Medium',
}

// ln-space contribution shares; order-independent and sum to exactly 100%.
// `dir` is 'down' for supply (each factor divides cost) or 'up' for demand
// (each factor multiplies volume). Shares are taken over GROSS movement, so
// the optimisation drag reads as a negative offset rather than rebasing them.
export function decompose(forces, values, { dir = 'down', dragValue = null } = {}) {
  const gross = forces.reduce((a, f) => a * values[f.key], 1)
  const lnGross = Math.log(gross)
  const rows = forces.map((f) => ({
    ...f,
    factor: values[f.key],
    share: lnGross > 0 ? Math.log(values[f.key]) / lnGross : 0,
  }))
  const drag = dragValue
    ? { ...DRAG_FORCE, factor: dragValue, share: lnGross > 0 ? -Math.log(dragValue) / lnGross : 0 }
    : null
  // cumulative index walk from 100 — exactly what the report's waterfall draws
  let idx = 100
  const walk = rows.map((r) => {
    idx = dir === 'down' ? idx / r.factor : idx * r.factor
    return { ...r, index: idx }
  })
  if (drag) {
    idx = idx / drag.factor
    walk.push({ ...drag, index: idx })
  }
  const net = dragValue ? gross / dragValue : gross
  return { rows, walk, drag, gross, net }
}

/* ------------------------------------------------------------------ */
/* §8.5 — the bill is a choice                                        */
/* ------------------------------------------------------------------ */
export const TRAJECTORY = [
  { year: 2026, constCap: 100, blended: 100, volume: 100, hold: 100, uptier: 100 },
  { year: 2027, constCap: 32.2, blended: 53.6, volume: 259, hold: 83, uptier: 139 },
  { year: 2028, constCap: 12.4, blended: 31.7, volume: 629, hold: 78, uptier: 199 },
  { year: 2029, constCap: 5.7, blended: 20.6, volume: 1303, hold: 74, uptier: 269 },
  { year: 2030, constCap: 2.9, blended: 14.2, volume: 2379, hold: 69, uptier: 339 },
]

// Spend multiples are the published Table 23 figures, so the app and the report
// agree exactly. (Conceptually: demand multiple ÷ the price decline you capture;
// the workbook carries more precision than the rounded ÷35 / ÷15 / ÷7 labels.)
export const CAPABILITY_STRATEGIES = [
  { key: 'hold', label: 'Hold capability fixed', capture: 35, note: 'Keep today’s quality bar; bank the deflation.',
    spend: { muted: 0.19, base: 0.69, high: 1.52 } },
  { key: 'partial', label: 'Partial up-tier', capture: 15, note: 'Move the workloads that clearly benefit; hold the rest.',
    spend: { muted: 0.45, base: 1.59, high: 3.5 } },
  { key: 'frontier', label: 'Track the frontier', capture: 7, note: 'Always move to the best available model.',
    spend: { muted: 0.95, base: 3.39, high: 7.48 } },
]

export const DEMAND_SCENARIOS = [
  { key: 'muted', label: 'Muted', mult: 7, note: 'Adoption stalls' },
  { key: 'base', label: 'Base — Goldman', mult: 24, note: 'The published forecast' },
  { key: 'high', label: 'High', mult: 53, note: 'Agentic everywhere' },
]

export const spendMultiple = (strategyKey, demandKey) => {
  const s = CAPABILITY_STRATEGIES.find((x) => x.key === strategyKey)
  return s ? s.spend[demandKey] : 1
}

export const IMPLICATIONS_SUPPLIER = [
  { t: 'Unit costs keep collapsing', c: 'High', d: '$0.02/M tokens is already demonstrated on open 120B models.' },
  { t: 'The mid-market commoditises', c: 'High', d: 'Pure inference hosting converges on utility economics — more like cloud storage than software.' },
  { t: 'The frontier premium narrows in scope', c: 'Medium', d: 'Pricing power persists only where open models cannot yet follow; revenue shifts to the agent layer.' },
  { t: 'Pricing shifts from tokens to outcomes', c: 'Medium', d: 'Raw tokens become the wholesale layer beneath value-priced products.' },
  { t: 'Vertical integration intensifies', c: 'Medium', d: 'Custom silicon, owned datacentres and energy procurement become the margin defence.' },
]

export const IMPLICATIONS_BUYER = [
  { t: 'Your bill is a decision, not a forecast', c: 'High', d: 'At 24× volume growth, holding capability fixed cuts spend ~31%; tracking the frontier triples it.' },
  { t: 'Token FinOps becomes permanent', c: 'High', d: 'Metering, routing, caching and agent budgets become standard platform functions.' },
  { t: 'Model choice is a portfolio, refreshed quarterly', c: 'High', d: 'Any static selection is mispriced within months; route behind an abstraction layer.' },
  { t: 'Open weights become the default for routine work', c: 'Medium-high', d: 'Frontier APIs for the hard tail; portability doubles as negotiating leverage.' },
  { t: 'The strategic risk inverts', c: 'Medium', d: 'The greater risk is now under-consuming AI. Optimisation should fund expansion, not contraction.' },
]
