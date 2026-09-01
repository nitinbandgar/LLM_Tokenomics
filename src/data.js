// All figures sourced from the "LLM Tokenomics — Detailed Report".
// Prices are indicative list prices, September 2026 — orders of magnitude, not quotes.

export const HEADLINE_NUMBERS = [
  { value: '~50×', label: 'since 2022', text: 'Price decline for constant capability — about 2.7× a year, decelerating ("LLMflation")', source: 'a16z; Epoch AI' },
  { value: '$8.4B', label: 'H1 2025 spend', text: 'Enterprise LLM API spend at mid-2025, up from $3.5B six months earlier', source: 'Menlo Ventures' },
  { value: '5–30×', label: 'multiplier', text: 'Token consumption of agentic workloads vs a chat exchange', source: 'Gartner; production data' },
  { value: '~26%', label: 'wasted', text: 'Share of AI spend enterprises estimate is wasted', source: 'FinOps Foundation, 2026' },
  { value: '100–500×', label: 'spread', text: 'Quality-adjusted price spread, frontier vs commodity tiers', source: 'Public list prices' },
  { value: '60–80%', label: 'savings', text: 'Bill reduction reported by teams applying the full lever stack', source: 'Production case reports' },
]

// Table 4 — indicative list prices per 1M tokens, September 2026
export const MODEL_PRICES = [
  { name: 'Claude Fable 5', tier: 'frontier', input: 10, output: 50, notes: 'Frontier reasoning for difficult knowledge work' },
  { name: 'GPT-5.6 Sol', tier: 'frontier', input: 5, output: 30, notes: 'Flagship reasoning; promotional $4/$20 short-context rate since 22 Aug 2026' },
  { name: 'Claude Opus 5', tier: 'frontier', input: 5, output: 25, notes: 'Frontier; flat-rate long context' },
  { name: 'Gemini 3.1 Pro', tier: 'mid', input: 2, output: 12, notes: 'Cheapest frontier-class (≤200K prompts)' },
  { name: 'GPT-5.6 Terra', tier: 'mid', input: 2, output: 12, notes: 'Balanced default workhorse' },
  { name: 'Claude Sonnet 5', tier: 'mid', input: 2, output: 10, notes: 'Enterprise workhorse; $2/$10 made permanent 10 Aug 2026' },
  { name: 'Gemini 3.5 Flash', tier: 'value', input: 1.5, output: 9, notes: 'Fast value tier' },
  { name: 'GPT-5.6 Luna', tier: 'value', input: 0.2, output: 1.2, notes: 'Ultra-budget proprietary tier' },
  { name: 'DeepSeek V4 Pro', tier: 'open', input: 0.44, output: 0.87, notes: 'High-end open — the "DeepSeek shock" tier' },
  { name: 'DeepSeek V4 Flash', tier: 'open', input: 0.14, output: 0.28, notes: 'Cheaper open tier' },
  { name: 'Gemma 3 27B', tier: 'open', input: 0.08, output: 0.16, notes: 'Low-cost open; price varies by host' },
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

// Table 3 — the five commercial meters, with the real reference points behind each range
export const PRICING_MODELS = [
  { name: 'Subscription', unit: 'per seat / month', price: '$20–100+', icon: '👤',
    desc: 'Bundles the UI, usage caps, admin and support — not a pure model price.',
    refs: [
      ['ChatGPT Business', '~$20 / user / month, annual billing'],
      ['Claude Team', '$20 standard seat · $100 premium seat'],
    ] },
  { name: 'Per-token API', unit: 'per 1M tokens in/out', price: '$0.08–$50', icon: '🔤',
    desc: 'The dominant developer tariff: input and output metered separately.',
    refs: [
      ['Top of range', 'Claude Fable 5 — $50 / 1M output tokens'],
      ['Bottom of range', 'Gemma 3 27B — from $0.08 / 1M'],
      ['Who charges this way', 'OpenAI, Anthropic, Google, AWS Bedrock, open-weight hosts'],
    ] },
  { name: 'Per-request', unit: 'per tool call / query', price: '$2.50–$35 / 1,000', icon: '🔧',
    desc: 'Surcharges for tools and retrieval, on top of the tokens they generate.',
    refs: [
      ['Web search', '~$10 per 1,000 calls'],
      ['File search', '~$2.50 per 1,000 calls'],
      ['Search grounding', '~$35 per 1,000 prompts'],
    ] },
  { name: 'Compute-hour', unit: 'per GPU-hour', price: '$0.50–$80 / hr', icon: '🖥️',
    desc: 'Dedicated endpoints and provisioned throughput — you rent the silicon, not the tokens.',
    refs: [
      ['1× T4', '~$0.50 / hour'],
      ['1× H100', '~$4.50 / hour'],
      ['8× H100 node', '$36–80 / hour by provider and commitment — $36/hr is the unit used in this guide’s cost calculators'],
    ] },
  { name: 'Fine-tuning', unit: 'per hour or per token', price: '~$100/hr or ~$8/1M', icon: '🎛️',
    desc: 'Managed customisation, plus storage and hosting for the tuned model afterwards.',
    refs: [
      ['OpenAI RFT', '~$100 / hour; grader tokens billed separately'],
      ['Bedrock Llama-class', '~$8 per 1M training tokens, + storage + hosting'],
    ] },
]

// Table 5 — discount lanes
export const DISCOUNT_LANES = [
  { name: 'Cached / repeat-prefix input', saving: '~90%', how: 'Stable prompt prefixes (system prompts, tool schemas, documents) hit the provider’s KV cache', catch: 'Requires prompt stability and cache-aware design' },
  { name: 'Batch / async processing', saving: '~50%', how: 'Non-interactive jobs go to an offline queue scheduled into idle capacity', catch: 'Hours-scale latency; needs queue-tolerant workflows' },
  { name: 'Mini / value tiers', saving: '70–90%', how: 'Same model family, smaller model; adequate for the majority of routine requests', catch: 'Quality on hard cases — needs routing and escalation' },
  { name: 'Committed / provisioned use', saving: '10–50%', how: 'Reserved capacity or committed spend in exchange for lower unit rates', catch: 'Lower flexibility; committed budget' },
]

// LLMflation — what GPT-4-class capability has cost per 1M tokens over time.
// `detail` is what the reader sees when they hover or tap a point.
export const LLMFLATION = [
  { year: '2022', price: 20, label: '$20+',
    what: 'GPT-4-class launch pricing',
    detail: 'Late 2022: reaching GPT-4-level quality cost $20+ per million tokens. At the time this was the only way to get that capability at all.' },
  { year: '2023', price: 8, label: '~$8',
    what: 'Competition arrives',
    detail: 'Rival frontier models and the first efficient serving stacks (continuous batching) cut the going rate to roughly $8 per million.' },
  { year: '2024', price: 2, label: '~$2',
    what: 'Mid-tiers match the old frontier',
    detail: 'Workhorse tiers now delivered 2022-frontier quality at ~$2 per million — a 10× fall in about two years.' },
  { year: '2025', price: 0.9, label: '~$0.90',
    what: 'Open weights set the ceiling',
    detail: 'Open-weight releases matching each capability tier pushed hosted pricing toward marginal serving cost — under $1 per million.' },
  { year: '2026', price: 0.4, label: '$0.40–0.80',
    what: 'Commodity pricing',
    detail: 'GPT-4-level quality now costs $0.40–0.80 per million, with economy tiers delivering near-GPT-4 quality at ~$0.10. That is ~50× cheaper than 2022 — about 2.7× a year compounded, and the rate is decelerating.' },
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
  { horizon: '2026–27', dev: 'Per-capability prices fall ~3× a year, tapering; the mid-market commoditises to near-zero margin as open weights match each tier', confidence: 'High' },
  { horizon: '2027–28', dev: 'Pricing-model innovation spreads: outcome- and subscription-based hybrids, priority/provisioned tiers, long-context flat rates as competitive weapons', confidence: 'Medium' },
  { horizon: '2028–29', dev: 'Open weights become the default substrate for routine enterprise workloads; frontier APIs reserved for the hard tail', confidence: 'Medium-high' },
  { horizon: '2030', dev: 'Trillion-parameter inference costs providers >90% less than in 2025 (Gartner); agentic adoption multiplies token consumption 24×, to ~120 quadrillion tokens/month (Goldman Sachs Research)', confidence: 'Directional' },
]

// Appendix A — glossary
export const GLOSSARY = [
  { term: "Token", meaning: "A fragment of text, ~4 characters or ~¾ of a word", why: "The unit in which usage is metered and billed" },
  { term: "Context window", meaning: "Everything the model attends to in one call", why: "Re-sent and re-billed on every turn; priced steeply at long lengths" },
  { term: "KV cache", meaning: "GPU memory holding attention state for active sequences", why: "The physical driver of long-context surcharges" },
  { term: "Prefill / decode", meaning: "Parallel prompt pass / sequential token generation", why: "The reason output tokens cost 3–8× input tokens" },
  { term: "MFU", meaning: "Model FLOPs Utilisation — achieved vs peak throughput", why: "2× MFU ≈ half the compute cost" },
  { term: "MoE", meaning: "Mixture-of-Experts — only a fraction of parameters active per token", why: "Structurally cheaper serving; a key driver of 2025–26 price falls" },
  { term: "Quantisation", meaning: "Reducing weight precision (FP16 → FP8/FP4)", why: "Cuts memory traffic; AWQ-style 4-bit gives >3× serving speedup" },
  { term: "LoRA / QLoRA", meaning: "Adapter-based fine-tuning techniques", why: "Customisation at 1/10,000th of the trainable parameters" },
  { term: "Distillation", meaning: "Compressing a large model's behaviour into a small one", why: "Up to 10× cheaper serving on narrow tasks" },
  { term: "Prompt caching", meaning: "Provider-side reuse of a stable prompt prefix's KV cache", why: "~90% discount on repeat input" },
  { term: "Batch API", meaning: "Asynchronous, delay-tolerant processing lane", why: "~50% discount; monetises provider idle capacity" },
  { term: "LLMflation", meaning: "~2.7×/year price decline for constant capability (~50× since 2022); the widely quoted ~10×/year applied to GPT-3-class capability over 2021–24", why: "Why model choices must be revisited quarterly" },
  { term: "Transformer", meaning: "The neural architecture behind all current LLMs: stacked layers of attention + feed-forward networks", why: "Its serving profile (memory-bound decode) shapes all token pricing" },
  { term: "Attention", meaning: "Mechanism by which each token reads all previous tokens", why: "Work grows with the square of context length" },
  { term: "Embedding", meaning: "Numeric vector representing a token (or document, for retrieval)", why: "Embedding APIs are metered; vectors feed RAG" },
  { term: "Parameters / weights", meaning: "The learned numbers inside a model (7B–1T+)", why: "Read from memory on every decoded token" },
  { term: "FLOPs", meaning: "Floating-point operations; training needs ≈ 6 × parameters × tokens", why: "The physics of training cost" },
  { term: "HBM", meaning: "High-bandwidth memory stacked next to the GPU die", why: "Its bandwidth caps decode speed; its supply gates price declines" },
  { term: "ASIC / LPU", meaning: "Chips purpose-built for inference rather than general compute", why: "~28% of AI server shipments in 2026, ~40% by 2030; new price floors" },
  { term: "Reasoning tokens", meaning: "Hidden chain-of-thought output billed but not shown", why: "Inflate effective output cost 3–10× on reasoning tiers" },
  { term: "Model routing", meaning: "Classifying requests and sending each to the cheapest capable model", why: "The single highest-leverage optimisation decision" },
  { term: "Semantic caching", meaning: "Serving repeat queries from a similarity-matched answer cache", why: "40–70% savings on FAQ-like traffic" },
  { term: "RAG", meaning: "Retrieval-augmented generation: fetching documents into the prompt", why: "Bills three times — retrieval, embeddings, and inflated context" },
  { term: "Vector database", meaning: "Store that indexes embeddings for similarity search", why: "Metered per GB and per query; rarely the dominant RAG cost" },
  { term: "Agentic workflow", meaning: "Multi-step loop of plan → tool call → validate → retry", why: "5–30× the tokens of a chat exchange; context re-sent each step" },
  { term: "SLM", meaning: "Small language model (~1–15B parameters), often task-tuned", why: "10–30× cheaper than large generalists on routine agent steps" },
  { term: "AI gateway", meaning: "Proxy layer doing metering, routing, caching, budgets in one place", why: "The enforcement point for all token-FinOps policy" },
  { term: "PUE", meaning: "Power Usage Effectiveness: total facility power ÷ IT power", why: "1.2–1.4 typical; multiplies every watt a GPU draws" },
  { term: "Sovereign AI", meaning: "Deployment under a jurisdiction's legal and technical control", why: "Costs a premium; favours open weights and regional hosts" },
  { term: "Speculative decoding", meaning: "Small model drafts tokens; large model verifies in parallel", why: "2–3× decode speed-up at equal quality" },
  { term: "Continuous batching", meaning: "Dynamically packing many requests into each forward pass", why: "The main lever behind ~85% marginal-cost reduction" },
  { term: "Chinchilla scaling", meaning: "Compute-optimal ratio of model size to training data", why: "Why training cost is a design choice, not a size choice" },
]

// §1.1 — the same sentence, tokenized (real cl100k counts, precomputed)
export const LANG_TOKENS = [
  { lang: 'English', text: 'Artificial intelligence is transforming enterprise economics.', tokens: 8 },
  { lang: 'Python code', text: 'cost = tokens * price / 1_000_000', tokens: 12 },
  { lang: 'German', text: 'Künstliche Intelligenz verändert die Unternehmensökonomie.', tokens: 18 },
  { lang: 'French', text: 'L’intelligence artificielle transforme l’économie de l’entreprise.', tokens: 18 },
  { lang: 'Japanese', text: '人工知能は企業経済を変革しています。', tokens: 20 },
  { lang: 'Hindi', text: 'कृत्रिम बुद्धिमत्ता उद्यम अर्थशास्त्र को बदल रही है।', tokens: 55 },
]

// Table 18 — the token-FinOps tool stack
export const TOOL_STACK = [
  { layer: 'AI gateway', role: 'Single choke point: metering, routing, caching, budgets, guardrails, audit', tools: 'LiteLLM · Portkey · Kong AI Gateway · Cloudflare AI Gateway · TrueFoundry', note: 'The non-negotiable layer — every other lever becomes enforceable here', color: 'var(--accent-cyan)' },
  { layer: 'Model router / aggregator', role: 'One API key across hundreds of models; cheapest-capable selection', tools: 'OpenRouter · Not Diamond · Martian', note: 'Captures LLMflation automatically — no hard-coded vendor', color: 'var(--accent-violet)' },
  { layer: 'Observability & evaluation', role: 'Per-request cost attribution, tracing, prompt versioning, quality evals', tools: 'Helicone · Langfuse · Braintrust', note: 'You cannot optimise what you do not meter', color: 'var(--accent-orange)' },
  { layer: 'Caching & optimisation', role: 'Semantic caching, context compression, agent-side traffic reduction', tools: 'GPTCache · provider prompt caches · gateway-native caches', note: 'Attaches to the gateway; ~31% hit rates on FAQ-like traffic', color: 'var(--accent-green)' },
]

// Table 19 — who owns what
export const OPERATING_MODEL = [
  { who: 'Platform engineering', owns: 'Gateway, routing policy, caching, model onboarding and exit', cadence: 'Continuous' },
  { who: 'Product teams', owns: 'Cost per resolved task, output/input ratio, agent budgets for their features', cadence: 'Per release' },
  { who: 'Finance / FinOps', owns: 'Budgets, showback by team and feature, anomaly alerts', cadence: 'Monthly' },
  { who: 'Architecture review board', owns: 'Model portfolio refresh, self-host vs API decisions, negotiation strategy', cadence: 'Quarterly' },
]

// §8.1 / 8.2 — the forces repricing the market to 2030
export const FUTURE_SUPPLY = [
  { name: 'Next-gen silicon', fact: 'Rubin-class GPUs claim ~10× lower cost per generated token; $0.02/M already demonstrated on open 120B models', so: 'The hardware floor under every price keeps falling' },
  { name: 'Inference ASICs', fact: 'Purpose-built inference chips: ~28% of AI server shipments in 2026, heading toward ~40% by 2030; wafer-scale and LPU designs prove the latency frontier', so: 'Cheap-and-slow vs expensive-and-instant become separately priced lanes' },
  { name: 'The memory wall', fact: 'Decode is memory-bound, so HBM is the real roadmap. HBM4: >2.8 TB/s per stack — but three vendors control supply and prices rose ~20%', so: 'Token-price declines gated as much by memory supply as by GPU launches' },
  { name: 'Energy as a moat', fact: 'Nuclear PPAs (Three Mile Island 835 MW, Susquehanna 1.92 GW) and SMR orders anchor supplier cost structures into the 2030s', so: 'Power contracts become strategic assets — and a floor under long-run prices' },
  { name: 'Small, specialised models', fact: 'Task-specific small models expected at 3× the adoption rate of general LLMs by 2027; a 7B model serves routine agent steps 10–30× cheaper', so: 'Token volume shifts to small and cheap; frontier reserved for the hard tail' },
]
export const FUTURE_DEMAND = [
  { name: 'Machine-dominated consumption', fact: 'Token consumption is forecast to grow 24× by 2030, to ~120 quadrillion tokens/month (Goldman Sachs Research, May 2026) — agents calling agents, with no human reading most intermediate output', so: 'Cost per task replaces cost per token; latency-tolerant volume shifts to batch lanes' },
  { name: 'Sovereignty becomes procurement', fact: 'EU AI Act high-risk obligations fully applicable Aug 2026 (fines to 7% of turnover); European sovereign-cloud spend $7B → $12B+', so: 'Sovereign deployment costs a premium — and open weights are its natural substrate' },
  { name: 'Buyers professionalise', fact: 'Committed-use discounts, multi-vendor portfolios behind routing layers, open-weight price anchors in every negotiation', so: 'The buy side organises exactly as the sell side commoditises' },
  { name: 'Geopolitics stays priced in', fact: 'Export controls partition silicon; Chinese open-weight labs keep a global price anchor under every tier', so: 'Regionally divergent prices — an arbitrage portfolios capture and single-vendor stacks cannot' },
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
