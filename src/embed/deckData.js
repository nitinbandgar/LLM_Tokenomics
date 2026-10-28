// Figures used by the in-deck widgets. They follow the October 2026 deck
// (list prices checked on vendor pricing pages, 28 October 2026).

export const OCT_TIERS = [
  { id: 'frontier', label: 'Frontier', models: 'GPT-6 Astra · Claude Fable 5.1', input: 10, output: 50 },
  { id: 'workhorse', label: 'Workhorse', models: 'Claude Sonnet 5.5 · GPT-6.1 Sol', input: 2, output: 10 },
  { id: 'value', label: 'Value', models: 'Claude Haiku 5.5 · GPT-6 Luna', input: 0.1, output: 0.5 },
]

export const fmtPrice = (n) => (n < 1 ? '$' + n.toFixed(2) : '$' + n)
