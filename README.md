# LLM Tokenomics — An Interactive Guide

An interactive web app explaining the economics of LLM tokens, built from
"LLM Tokenomics — Detailed Report" (Group Digital & Innovation, July 2026).

## Run it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
```

## The nine modules

Navigation is section-based: pick a module from the sidebar (or the horizontal bar on
mobile), or step through with the Next/Back buttons at the bottom of each section.

| # | Module | Core interactive |
|---|--------|------------------|
| 00 | The paradox | Animated diverging price-vs-spend chart, six headline numbers |
| 01 | How an LLM works | Pick one of three curated sentences and follow it through seven stages: real BPE token IDs → embeddings → an orbitable 3D transformer stack (Three.js) → clickable attention with curated per-sentence weights → a next-token distribution that makes linguistic sense → be-the-sampler streaming loop whose continuation reads coherently, with temperature |
| 02 | Prefill vs decode | Animated tokenize→prefill→decode→stream pipeline, wall-clock "time race" explorer, input/output cost asymmetry meter, output÷input price-ratio chart across the market |
| 03 | The pricing landscape | Log/linear price-ladder explorer, five pricing meters, discount lanes, LLMflation chart |
| 04 | Open vs proprietary | Repricing-cascade timeline (drag through a capability tier's half-life), DeepSeek shock numbers |
| 05 | What a token costs | First-principles cost-floor calculator (model size × precision × batch × GPU rate), KV-cache/context visualizer, provider cost stack |
| 06 | Why bills explode | Agent-loop cost visualizer (super-linear token growth), workload cost calculator with RAG slider, waste anatomy |
| 07 | Optimization playground | Six-lever savings simulator with waterfall, self-hosting break-even tool |
| 08 | FinOps & 2030 | Operating-loop walkthrough, governance moves, dashboard metrics, 2030 timeline, searchable glossary |

All figures are indicative list prices as of mid-2026 — orders of magnitude, not quotes.
The calculators use simplified first-principles models described inline; assumptions are
stated next to each interactive.

## Stack

React 18 + Vite 5. Three.js (via @react-three/fiber) renders the 3D transformer in
Module 01, lazy-loaded so it never blocks initial page load. All 2D charts are
hand-rolled SVG. Module 01's example sentences carry real cl100k BPE token IDs,
precomputed with js-tiktoken (dev dependency only — see src/examples.js).
