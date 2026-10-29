import React from 'react'

export function Eyebrow({ children, style }) {
  return <div className="de-eyebrow" style={style}>{children}</div>
}

export function Range({ value, min, max, step = 1, onChange }) {
  const p = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      className="de-range"
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ '--p': p + '%' }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  )
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="de-seg">
      {options.map((o) => (
        <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          <span className="de-seg-label">{o.label}</span>
          {o.sub && <span className="de-seg-sub">{o.sub}</span>}
        </button>
      ))}
    </div>
  )
}

// small preset buttons; `active` marks the preset matching the current state
export function Chips({ options, active, onPick }) {
  return (
    <div className="de-chips">
      {options.map((o) => (
        <button key={o.label} className={'de-chip' + (active === o.label ? ' on' : '')} onClick={() => onPick(o)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange, children }) {
  return (
    <div className={'de-toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)} role="checkbox" aria-checked={on}>
      <span className="de-box">{on ? '✓' : ''}</span>
      <span>{children}</span>
    </div>
  )
}

export function Kpi({ label, value, sub, color }) {
  return (
    <div className="de-kpi">
      <div className="de-kpi-label">{label}</div>
      <div className="de-kpi-value" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="de-kpi-sub">{sub}</div>}
    </div>
  )
}
