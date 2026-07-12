# LLM Tokenomics — An Interactive Guide

An interactive web app explaining the economics of LLM tokens, built from
"LLM Tokenomics — Detailed Report" (Group Digital & Innovation, July 2026).

## Run it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
```

## The eight modules

| # | Module | Core interactive |
|---|--------|------------------|
| 00 | The paradox | Animated diverging price-vs-spend chart, six headline numbers |
| 01 | How tokens are made | Live tokenizer demo, animated tokenize→prefill→decode→stream pipeline, input/output asymmetry explorer |
| 02 | The pricing landscape | Log/linear price-ladder explorer, five pricing meters, discount lanes, LLMflation chart |
| 03 | Open vs proprietary | Repricing-cascade timeline (drag through a capability tier's half-life), DeepSeek shock numbers |
| 04 | What a token costs | First-principles cost-floor calculator (model size × precision × batch × GPU rate), KV-cache/context visualizer, provider cost stack |
| 05 | Why bills explode | Agent-loop cost visualizer (super-linear token growth), workload cost calculator with RAG slider, waste anatomy |
| 06 | Optimization playground | Six-lever savings simulator with waterfall, self-hosting break-even tool |
| 07 | FinOps & 2030 | Operating-loop walkthrough, governance moves, dashboard metrics, 2030 timeline, searchable glossary |

All figures are indicative list prices as of mid-2026 — orders of magnitude, not quotes.
The calculators use simplified first-principles models described inline; assumptions are
stated next to each interactive.

## Stack

React 18 + Vite 5, no other runtime dependencies. All charts are hand-rolled SVG.
