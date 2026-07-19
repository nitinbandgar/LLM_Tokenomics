import React from 'react'

export function Section({ id, kicker, title, lede, children }) {
  return (
    <section className="section" id={id}>
      <div className="section-kicker">{kicker}</div>
      <h2>{title}</h2>
      {lede && <p className="section-lede">{lede}</p>}
      {children}
    </section>
  )
}

export function Block({ title, sub, children }) {
  return (
    <>
      <h3 className="block-title">{title}</h3>
      {sub && <p className="block-sub">{sub}</p>}
      {children}
    </>
  )
}

export function Slider({ label, value, display, min, max, step = 1, onChange }) {
  return (
    <div className="control-row">
      <div className="control-label">
        <span>{label}</span>
        <span className="control-value">{display ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.value}
          className={value === o.value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange, title, sub }) {
  return (
    <div className={'toggle-row' + (on ? ' on' : '')} onClick={() => onChange(!on)}>
      <div className="switch" />
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{sub}</div>}
      </div>
    </div>
  )
}

export function ResultStrip({ items }) {
  return (
    <div className="result-strip">
      {items.map((it) => (
        <div className="result-item" key={it.label}>
          <div className="r-label">{it.label}</div>
          <div className="r-value" style={it.color ? { color: it.color } : undefined}>
            {it.value}
          </div>
          {it.note && <div className="r-note">{it.note}</div>}
        </div>
      ))}
    </div>
  )
}

export function DataTable({ headers, rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data">
        <thead>
          <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Collapsed-by-default detail text: one click opens the deep dive.
export function More({ label = 'Understand why', children }) {
  return (
    <details className="more">
      <summary>{label}</summary>
      <div className="more-body">{children}</div>
    </details>
  )
}

export function Callout({ tone, title, children }) {
  return (
    <div className={'callout' + (tone ? ' ' + tone : '')}>
      {title && <strong>{title} — </strong>}
      {children}
    </div>
  )
}
