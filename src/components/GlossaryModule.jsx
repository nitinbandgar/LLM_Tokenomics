import React, { useMemo, useState } from 'react'
import { Section, Block, Hint } from './ui.jsx'
import { GLOSSARY } from '../data.js'

// Light grouping so an executive can find a term by where it bites them.
const GROUPS = {
  'The unit itself': ['Token', 'Context window', 'Embedding', 'Parameters / weights', 'Transformer', 'Attention'],
  'Why it costs what it costs': ['KV cache', 'Prefill / decode', 'MFU', 'MoE', 'Quantisation', 'FLOPs', 'HBM', 'ASIC / LPU', 'Continuous batching', 'Speculative decoding', 'Chinchilla scaling'],
  'Ways to pay less': ['Prompt caching', 'Batch API', 'Model routing', 'Semantic caching', 'LoRA / QLoRA', 'Distillation', 'SLM', 'AI gateway'],
  'What drives the bill up': ['Reasoning tokens', 'Agentic workflow', 'RAG', 'Vector database'],
  'Market & context': ['LLMflation', 'Sovereign AI', 'PUE'],
}

export default function GlossaryModule() {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('all')

  const items = useMemo(() => {
    let list = GLOSSARY
    if (group !== 'all') {
      const names = GROUPS[group] || []
      list = list.filter((g) => names.includes(g.term))
    }
    if (q) {
      const s = q.toLowerCase()
      list = list.filter((g) => (g.term + g.meaning + g.why).toLowerCase().includes(s))
    }
    return list
  }, [q, group])

  return (
    <Section
      id="glossary"
      kicker="Module 12 · Reference"
      title="Glossary"
      lede="Every term used in this guide, in plain language — and why it shows up on your bill."
    >
      <Block title="Find a term">
        <Hint icon="🔎">Type to search, or pick a category. Each card says what it means <strong>and</strong> why it costs you money.</Hint>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search terms…"
            style={{
              flex: '1 1 240px', maxWidth: 340, background: 'var(--bg-soft)', color: 'var(--text)',
              border: '1px solid var(--border-bright)', borderRadius: 10, padding: '10px 14px',
              fontFamily: 'var(--sans)', fontSize: 13.5, outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {['all', ...Object.keys(GROUPS)].map((g) => (
            <button
              key={g}
              className="btn"
              onClick={() => setGroup(g)}
              style={{
                padding: '5px 12px', fontSize: 12,
                borderColor: group === g ? 'var(--accent-cyan)' : undefined,
                color: group === g ? 'var(--accent-cyan)' : undefined,
                background: group === g ? 'rgba(56,209,224,0.1)' : undefined,
              }}
            >
              {g === 'all' ? `All ${GLOSSARY.length}` : g}
            </button>
          ))}
        </div>

        <div className="grid grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {items.map((g) => (
            <div className="card" key={g.term} style={{ padding: 16 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13.5, fontWeight: 600, color: 'var(--accent-cyan)' }}>{g.term}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)', margin: '6px 0' }}>{g.meaning}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>💡 {g.why}</div>
            </div>
          ))}
        </div>
        {items.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text-faint)', padding: '20px 0' }}>
            No terms match “{q}”. Try a shorter search.
          </div>
        )}
      </Block>
    </Section>
  )
}
