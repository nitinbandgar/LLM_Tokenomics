// All figures sourced from "LLM Tokenomics — Detailed Report" (July 2026).
// Prices are indicative list prices, mid-2026 — orders of magnitude, not quotes.

export const HEADLINE_NUMBERS = [
  { value: '~10×', label: 'per year', text: 'Annual price decline for constant capability ("LLMflation")', source: 'a16z; Epoch AI' },
  { value: '$8.4B', label: '2025 spend', text: 'Global enterprise LLM API spend — doubling again in 2026', source: 'Market analyses' },
  { value: '5–30×', label: 'multiplier', text: 'Token consumption of agentic workloads vs a chat exchange', source: 'Gartner; production data' },
  { value: '40–60%', label: 'waste', text: 'Share of enterprise token spend that is removable waste', source: 'FinOps Foundation' },
  { value: '100–500×', label: 'spread', text: 'Quality-adjusted price spread, frontier vs commodity tiers', source: 'Public list prices' },
  { value: '60–80%', label: 'savings', text: 'Bill reduction reported by teams applying the full lever stack', source: 'Production case reports' },
]

// Table 4 — indicative list prices per 1M tokens, mid-2026
export const MODEL_PRICES = [
  { name: 'o-series reasoning', tier: 'frontier', input: 15, output: 60, notes: 'Reasoning tier — hidden chain-of-thought tokens are billed too' },
  { name: 'GPT-5 class', tier: 'frontier', input: 10, output: 30, notes: 'Premium reasoning tier' },
  { name: 'Claude Opus 4.6', tier: 'frontier', input: 5, output: 25, notes: 'Frontier; flat-rate long context' },
  { name: 'Claude Sonnet 4.6', tier: 'mid', input: 3, output: 15, notes: 'Workhorse tier; 1M context without surcharge' },
  { name: 'Gemini 3.1 Pro', tier: 'mid', input: 2, output: 12, notes: 'Cheapest frontier-class (≤200K prompts)' },
  { name: 'GPT mini tier', tier: 'value', input: 0.4, output: 1.6, notes: 'Ultra-budget proprietary; ~10–30% of flagship' },
  { name: 'Gemini 2.5 Flash', tier: 'value', input: 0.15, output: 0.6, notes: 'Value tier, 1M context' },
  { name: 'Llama-class 70B (hosted)', tier: 'open', input: 0.3, output: 0.6, notes: 'Cost-plus commodity hosting' },
  { name: 'DeepSeek V4', tier: 'open', input: 0.05, output: 0.15, notes: '~97% below frontier — the "DeepSeek shock"' },
  { name: 'Small open 7–8B', tier: 'open', input: 0.06, output: 0.06, notes: 'Effectively free at enterprise scale' },
]

export const TIER_COLORS = {
  frontier: 'var(--accent-pink)',
  mid: 'var(--accent-violet)',
  value: 'var(--accent-cyan)',
  open: 'var(--accent-green)',
}

export const TIER_LABELS = {
  frontier: 'Frontier',
  mid: 'Mid tier',
  value: 'Value tier',
  open: 'Open weights',
}

// Table 3 — the five commercial meters
export const PRICING_MODELS = [
  { name: 'Subscription', unit: 'per seat / month', price: '$20–100+', icon: '👤', desc: 'ChatGPT Business, Claude Team. Bundles UI, caps, admin, support — not a pure model price.' },
  { name: 'Per-token API', unit: 'per 1M tokens in/out', price: '$0.06–$60', icon: '🔤', desc: 'The dominant developer tariff: every hosted API meters input and output tokens separately.' },
  { name: 'Per-request', unit: 'per tool call / query', price: '$2.50–$35 / 1,000', icon: '🔧', desc: 'Tool & retrieval surcharges: web search ~$10/1k calls, file search ~$2.50/1k, grounding ~$35/1k.' },
  { name: 'Compute-hour', unit: 'per GPU-hour', price: '$2.50–$80 / hr', icon: '🖥️', desc: 'Dedicated endpoints & provisioned throughput: ~$10/hr for one H100, ~$80/hr for an 8× H100 node.' },
  { name: 'Fine-tuning', unit: 'per hour or per token', price: '~$100/hr or ~$8/1M', icon: '🎛️', desc: 'Managed customisation, plus storage and hosting for the tuned artifact.' },
]

// Table 5 — discount lanes
export const DISCOUNT_LANES = [
  { name: 'Cached / repeat-prefix input', saving: '~90%', how: 'Stable prompt prefixes (system prompts, tool schemas, documents) hit the provider’s KV cache', catch: 'Requires prompt stability and cache-aware design' },
  { name: 'Batch / async processing', saving: '~50%', how: 'Non-interactive jobs go to an offline queue scheduled into idle capacity', catch: 'Hours-scale latency; needs queue-tolerant workflows' },
  { name: 'Mini / value tiers', saving: '70–90%', how: 'Same model family, smaller model; adequate for the majority of routine requests', catch: 'Quality on hard cases — needs routing and escalation' },
  { name: 'Committed / provisioned use', saving: '10–50%', how: 'Reserved capacity or committed spend in exchange for lower unit rates', catch: 'Lower flexibility; committed budget' },
]

// LLMflation — GPT-4-class capability, $/M tokens (log scale story)
export const LLMFLATION = [
  { year: '2022', price: 20, label: '$20+' },
  { year: '2023', price: 8, label: '~$8' },
  { year: '2024', price: 2, label: '~$2' },
  { year: '2025', price: 0.9, label: '~$0.90' },
  { year: '2026', price: 0.4, label: '$0.40–0.80' },
]

// Table 9 — supplier cost stack (illustrative shares of serving cost)
export const COST_STACK = [
  { name: 'GPU capex / depreciation', share: 55, color: 'var(--accent-pink)', desc: 'Fixed; amortised over 3–5 years; dominated by utilisation achieved. The largest single item.' },
  { name: 'Energy & datacentre', share: 15, color: 'var(--accent-orange)', desc: '~700W per GPU plus cooling and facility overhead.' },
  { name: 'Networking / interconnect', share: 8, color: 'var(--accent-violet)', desc: 'NVLink/InfiniBand; all-reduce latency taxes fast decoding.' },
  { name: 'Idle / peak headroom', share: 12, color: 'var(--accent-cyan)', desc: 'Latency SLAs force headroom — why batch APIs are 50% off: they monetise idle capacity.' },
  { name: 'Margin (commodity host)', share: 10, color: 'var(--accent-green)', desc: 'Razor-thin for commodity hosting; value-based at the frontier.' },
]

// Table 12 — failure modes
export const FAILURE_MODES = [
  { name: 'Retry storms', what: 'Naive error handling resubmits full contexts on timeouts — multiplying spend precisely when systems are stressed', fix: 'Exponential backoff; truncated-context retries; circuit breakers' },
  { name: 'Agent loops without budgets', what: 'A stuck agent burns unbounded spend on a single task', fix: 'Per-task token ceilings; loop limits; context compaction between steps' },
  { name: 'Model over-provisioning', what: '100% of traffic routed to the frontier tier when 50–70% of requests are handled equally well by the cheapest tier', fix: 'Classification + routing with escalation on failure' },
  { name: 'Reasoning-tier default', what: 'Hidden chain-of-thought output is billed but never seen; a single hard query can cost dollars', fix: 'Reserve reasoning models for tasks that need them' },
  { name: 'Shadow usage', what: 'Unmetered API keys across teams; nobody owns the bill', fix: 'Central gateway; per-team keys; spend alerts' },
  { name: 'No unit economics', what: 'Nobody can answer "what does one resolved ticket cost in tokens?"', fix: 'Unit-cost dashboards per feature and use case' },
]

// Table 15 — FinOps dashboard metrics
export const FINOPS_METRICS = [
  { name: 'Cost per resolved task', def: 'Total LLM spend ÷ business outcomes delivered, per use case', why: 'The only number that connects spend to value' },
  { name: 'Cache-hit rate', def: 'Share of input tokens billed at the cached rate', why: 'Directly measures the biggest low-effort discount (~90% off)' },
  { name: 'Routing mix', def: 'Share of requests by model tier', why: 'Detects over-provisioning; target 50–70% on the cheapest capable tier' },
  { name: 'Batch share', def: 'Share of eligible tokens processed through 50%-off async lanes', why: 'Free saving on all non-interactive workloads' },
  { name: 'Output/input ratio', def: 'Output tokens ÷ input tokens by feature', why: 'Flags verbosity and reasoning-tier misuse (output costs 3–8× input)' },
  { name: 'Waste indicators', def: 'Retry rates, agent-loop overruns, context length percentiles', why: 'Early warning on the failure modes of runaway bills' },
  { name: 'Spend vs budget by team', def: 'Metered spend per team/key against allocation', why: 'Accountability; kills shadow usage' },
]

// Table 16 — trajectory to 2030
export const TIMELINE_2030 = [
  { horizon: '2026–27', dev: 'Per-capability prices fall 3–5× annually; the mid-market commoditises to near-zero margin as open weights match each tier', confidence: 'High' },
  { horizon: '2027–28', dev: 'Pricing-model innovation spreads: outcome- and subscription-based hybrids, priority tiers, long-context flat rates as competitive weapons', confidence: 'Medium' },
  { horizon: '2028–29', dev: 'Open weights become the default substrate for routine enterprise workloads; frontier APIs reserved for the hard tail', confidence: 'Medium-high' },
  { horizon: '2030', dev: 'Trillion-parameter inference costs providers >90% less than in 2025 (Gartner); agentic adoption multiplies token consumption up to 120×', confidence: 'Directional' },
]

// Appendix A — glossary
export const GLOSSARY = [
  { term: 'Token', meaning: 'A fragment of text, ~4 characters or ~¾ of a word', why: 'The unit in which usage is metered and billed' },
  { term: 'Context window', meaning: 'Everything the model attends to in one call', why: 'Re-sent and re-billed on every turn; priced steeply at long lengths' },
  { term: 'KV cache', meaning: 'GPU memory holding attention state for active sequences', why: 'The physical driver of long-context surcharges' },
  { term: 'Prefill / decode', meaning: 'Parallel prompt pass / sequential token generation', why: 'The reason output tokens cost 3–8× input tokens' },
  { term: 'MFU', meaning: 'Model FLOPs Utilisation — achieved vs peak throughput', why: '2× MFU ≈ half the compute cost' },
  { term: 'MoE', meaning: 'Mixture-of-Experts — only a fraction of parameters active per token', why: 'Structurally cheaper serving; key driver of 2025–26 price falls' },
  { term: 'Quantisation', meaning: 'Reducing weight precision (FP16 → FP8/FP4)', why: 'Cuts memory traffic; 4-bit gives >3× serving speedup' },
  { term: 'LoRA / QLoRA', meaning: 'Adapter-based fine-tuning techniques', why: 'Customisation at 1/10,000th of the trainable parameters' },
  { term: 'Distillation', meaning: 'Compressing a large model’s behaviour into a small one', why: 'Up to 10× cheaper serving on narrow tasks' },
  { term: 'Prompt caching', meaning: 'Provider-side reuse of a stable prompt prefix’s KV cache', why: '~90% discount on repeat input' },
  { term: 'Batch API', meaning: 'Asynchronous, delay-tolerant processing lane', why: '~50% discount; monetises provider idle capacity' },
  { term: 'LLMflation', meaning: '~10×/year price decline for constant capability', why: 'Why model choices must be revisited quarterly' },
]

export const fmtUSD = (n, digits) => {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (n >= 1000) return '$' + (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'K'
  if (n >= 100) return '$' + n.toFixed(0)
  if (n >= 1) return '$' + n.toFixed(digits ?? 2)
  return '$' + n.toFixed(digits ?? (n >= 0.1 ? 2 : 3))
}

export const fmtNum = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(n >= 100000 ? 0 : 1) + 'K'
  return String(Math.round(n))
}
