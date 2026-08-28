# LLM Tokenomics — An Interactive Guide

An interactive web app explaining the economics of LLM tokens, built from
"LLM Tokenomics — Detailed Report" (Group Digital & Innovation).

## Run it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
```

## Structure

Six themed parts in a collapsible sidebar; each part opens to its own chapters. Within a
chapter, sections stay folded until the reader opens them, so nothing arrives as a wall of
content.

Design rules: every interactive opens with a one-line "how to use this" hint, captions
are one line, and the depth sits behind "＋ understand why" disclosures so an executive
can move through the whole guide without reading a wall of text.

| Part | Chapters |
|---|---|
| **0 · The paradox** | Why tokenomics — the diverging price/spend chart |
| **1 · The anatomy of an LLM** | 1.1 How an LLM works · 1.2 Prefill vs decode · 1.3 Five hidden dials |
| **2 · Supplier economics** | 2.1 The pricing landscape · 2.2 What a token costs · 2.3 Open vs proprietary |
| **3 · Buyer economics** | 3.1 Why bills explode · 3.2 Optimization playground · 3.3 Token FinOps |
| **4 · 2030 trend modelling** | 4.1 Supply side (÷34.6) · 4.2 Demand side (×23.8) |
| **5 · Conclusion** | 5.1 Your bill is a choice · 5.2 What it means for you |
| **6 · Glossary** | All 32 terms, searchable |

All figures are indicative list prices as of mid-2026 — orders of magnitude, not quotes.
The calculators use simplified first-principles models described inline; assumptions are
stated next to each interactive.

## Reading experience

- **Collapsible contents.** Hide the sidebar with the ⟨ button (or the  key) and the content
  reclaims the full width; a floating "☰ Contents" button brings it back.
- **Light and dark themes.** Toggle top-right. The choice persists, and the first visit follows
  the operating-system preference. Both palettes meet WCAG AA for body and UI text.
- **Keyboard and motion.** Visible focus rings throughout, and animations respect
  .

## Stack

React 18 + Vite 5. Three.js (via @react-three/fiber) renders the 3D transformer in
chapter 1.1, lazy-loaded so it never blocks initial page load. All 2D charts are
hand-rolled SVG. Chapter 1.1's example sentences carry real cl100k BPE token IDs,
precomputed with js-tiktoken (dev dependency only — see `src/examples.js`).

Chapters 4.1, 4.2 and 5.1 implement `LLM_Tokenomics_Force_Model_v5.xlsx` directly: totals,
log-space contribution shares, the cumulative index walk and the published strategy
matrix all reconcile to the workbook.

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via `.github/workflows/deploy.yml`.
Vite's `base` is `./` so the same build works from a domain root or a repo subpath.
