# LLM Tokenomics — An Interactive Guide

An interactive web app explaining the economics of LLM tokens, built from
"LLM Tokenomics — Detailed Report" (Group Digital & Innovation).

## Run it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
```

## The thirteen modules

One chapter per topic, mirroring the report's structure. Navigation is section-based:
pick a module from the sidebar (or the horizontal bar on mobile), or step through with
the Next/Back buttons at the bottom of each section.

Design rules: every interactive opens with a one-line "how to use this" hint, captions
are one line, and the depth sits behind "＋ understand why" disclosures so an executive
can move through the whole guide without reading a wall of text.

| # | Module | Core interactive |
|---|--------|------------------|
| 00 | The paradox | Animated diverging price-vs-spend chart, six headline numbers |
| 01 | How an LLM works | Pick a sentence and follow it through seven stages: real BPE token IDs → embeddings → a horizontal orbitable 3D transformer (Three.js) → clickable attention → prediction → streaming loop with temperature. Stage-4 machinery (inside a layer, how a token is born, where "70B" comes from) sits behind click-to-open panels |
| 02 | Prefill vs decode | Four-stage pipeline that visually separates GPU work (decode) from delivery (stream); combined time / GPU-cost / two-regimes explorer; your meter beside the market-wide output÷input ratio chart |
| 03 | Five hidden dials | One tab each for the design choices that quietly change the bill: language, context length, model design (dense vs MoE), precision, and GPU memory |
| 04 | The pricing landscape | Log/linear price-ladder explorer, five pricing meters, three structural facts, LLMflation chart |
| 05 | What a token costs | Clickable cost stack first — labelled as serving cost, with training called out as a separate line — then drill-downs: hardware floor calculator, cluster power bill, context squeeze |
| 06 | Open vs proprietary | Icon grid of the two business models, repricing-cascade slider with live phase commentary, the open-weight effect in four numbers (each labelled as general or DeepSeek-specific) |
| 07 | Why bills explode | Six-way waste overview first, then the three drivers one at a time: agentic multiplier, context/RAG bloat, reasoning-tax iceberg |
| 08 | Optimization playground | Six-lever savings simulator, distillation payback, self-hosting break-even, and a four-question decider that returns a plain self-host vs API recommendation |
| 09 | Token FinOps | Operating loop, four governance moves, a dashboard of live-looking metric tiles with click-through definitions, icon tool stack, who-owns-what |
| 10 | The 2030 force model | 13 draggable forces across supply (÷34.6) and demand (×23.8); click any force name for its story, evidence and confidence inline. Log-space shares sum to exactly 100% |
| 11 | Your bill is a choice | 3×3 strategy matrix beside a live $10M readout; trajectory chart with a clickable legend that isolates each line and explains what it means |
| 12 | Glossary | All 32 terms from the report appendix, searchable and grouped into five categories |

All figures are indicative list prices as of mid-2026 — orders of magnitude, not quotes.
The calculators use simplified first-principles models described inline; assumptions are
stated next to each interactive.

## Stack

React 18 + Vite 5. Three.js (via @react-three/fiber) renders the 3D transformer in
Module 01, lazy-loaded so it never blocks initial page load. All 2D charts are
hand-rolled SVG. Module 01's example sentences carry real cl100k BPE token IDs,
precomputed with js-tiktoken (dev dependency only — see `src/examples.js`).

Modules 10 and 11 implement `LLM_Tokenomics_Force_Model_v5.xlsx` directly: totals,
log-space contribution shares, the cumulative index walk and the published strategy
matrix all reconcile to the workbook.

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`.
Vite's `base` is `./` so the same build works from a domain root or a repo subpath.
