import React, { useLayoutEffect, useState } from 'react'
import './embed.css'
import AgentLoop, { SIZE as AGENT_SIZE } from './AgentLoop.jsx'
import CostFloor, { SIZE as FLOOR_SIZE } from './CostFloor.jsx'
import RoutingMix, { SIZE as ROUTING_SIZE } from './RoutingMix.jsx'
import SelfCheck, { SIZE as CHECK_SIZE } from './SelfCheck.jsx'
import CaseA, { SIZE as CASE_SIZE } from './CaseA.jsx'
import BillChoice, { SIZE as BILL_SIZE } from './BillChoice.jsx'
import { PRESETS } from './presets.js'

// One entry per in-deck widget. URL: <site>/?embed=<id>
export const WIDGETS = {
  // titles match the slide titles (slide numbers shift once hidden fallback slides are added)
  'cost-floor': { title: 'The bottom-up floor', comp: CostFloor, size: FLOOR_SIZE },
  'agent-loop': { title: 'The agentic multiplier', comp: AgentLoop, size: AGENT_SIZE },
  'routing-mix': { title: 'Model routing in practice', comp: RoutingMix, size: ROUTING_SIZE },
  'self-check': { title: 'Self-check · three minutes', comp: SelfCheck, size: CHECK_SIZE },
  'case-a': { title: 'Worked case A · customer support', comp: CaseA, size: CASE_SIZE },
  'bill-choice': { title: 'Price × volume = spend', comp: BillChoice, size: BILL_SIZE },
}

export const loadFont = () => {
  if (document.getElementById('de-font')) return
  const link = document.createElement('link')
  link.id = 'de-font'
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'
  document.head.appendChild(link)
}

// Render at a fixed design size and scale to fit the frame, so the widget
// looks the same in PowerPoint's edit view, in slide show, and in a browser.
export function Stage({ w, h, children }) {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / w, window.innerHeight / h))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [w, h])
  return (
    <div className="de-stage-outer">
      <div className="de-stage" style={{ width: w, height: h, transform: `translate(-50%, -50%) scale(${scale})` }}>
        {children}
      </div>
    </div>
  )
}

export default function EmbedApp({ id }) {
  loadFont()
  const widget = WIDGETS[id]
  if (!widget) {
    const base = window.location.origin + window.location.pathname
    return (
      <div className="deck-embed de-index">
        <h1>In-deck widgets</h1>
        <p className="de-note" style={{ fontSize: 13 }}>Each link opens one live widget, scaled to the window.</p>
        <ul>
          {Object.entries(WIDGETS).map(([key, w]) => (
            <li key={key} style={{ margin: '8px 0', fontSize: 14 }}>
              {w.title} — <a href={`?embed=${key}`}>{`${base}?embed=${key}`}</a>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  const Comp = widget.comp
  const params = Object.fromEntries(new URLSearchParams(window.location.search))
  // ?stack=1 lays out every preset state top to bottom at design size, so the offline
  // deck's images come from a single capture per widget
  if (params.stack !== undefined) {
    return (
      <div className="deck-embed">
        {(PRESETS[id] || []).map((p) => (
          <div key={p.key} data-preset={p.key} style={{ width: widget.size.w, height: widget.size.h, overflow: 'hidden' }}>
            <Comp init={p} />
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="deck-embed">
      <Stage w={widget.size.w} h={widget.size.h}>
        <Comp init={params} />
      </Stage>
    </div>
  )
}
