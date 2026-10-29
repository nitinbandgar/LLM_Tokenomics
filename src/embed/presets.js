// Starting state for a widget from URL-style string params (?steps=10&tier=value).
// The offline deck is built from images of these preset states, captured in one pass
// per widget with ?embed=<id>&stack=1.

export const num = (v, fallback, min = -Infinity, max = Infinity) => {
  const n = Number(v)
  return v === undefined || v === null || v === '' || Number.isNaN(n) ? fallback : Math.min(max, Math.max(min, n))
}

export const flag = (v) => v === '1' || v === 'true'

// Preset states per widget, in capture order. The deck build uses the same keys.
export const PRESETS = {
  'cost-floor': [
    { key: 'base', hourly: '36', tps: '5000' },
    { key: 'unbatched', hourly: '36', tps: '24' },
    { key: 'light', hourly: '36', tps: '1180' },
    { key: 'node80', hourly: '80', tps: '5000' },
    { key: 'node32', hourly: '32', tps: '5000' },
    { key: 'node50', hourly: '50', tps: '5000' },
  ],
  'agent-loop': [
    { key: 's1', steps: '1' },
    { key: 's10', steps: '10' },
    { key: 's20', steps: '20' },
    { key: 's30', steps: '30' },
    { key: 'compact', steps: '20', compact: '1' },
    { key: 'cache', steps: '20', compact: '1', cache: '1' },
    { key: 'cache-workhorse', steps: '20', compact: '1', cache: '1', tier: 'workhorse' },
    { key: 'workhorse', steps: '20', tier: 'workhorse' },
    { key: 'value', steps: '20', tier: 'value' },
  ],
  'routing-mix': [
    { key: 'deck', mix: '60-28-10-2' },
    { key: 'cautious', mix: '40-35-20-5' },
    { key: 't3', mix: '0-0-100-0' },
    { key: 't4', mix: '0-0-0-100' },
  ],
  'self-check': [{ key: 'native', mode: 'native' }],
  'case-a': [
    { key: 'none', levers: '' },
    { key: 'ctx', levers: 'ctx' },
    { key: 'cache', levers: 'ctx,cache' },
    { key: 'out', levers: 'ctx,cache,out' },
    { key: 'all', levers: 'ctx,cache,out,route' },
    { key: 'route', levers: 'route' },
    { key: 'route-first', levers: 'route,ctx,cache,out' },
  ],
  'bill-choice': [
    { key: 'half', share: '50' },
    { key: 'fixed', share: '0' },
    { key: 'frontier', share: '100' },
    { key: 'breakeven', share: '11' },
  ],
}
