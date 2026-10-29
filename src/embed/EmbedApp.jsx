import React, { useLayoutEffect, useState } from 'react'
import './embed.css'
import AgentLoop, { SIZE as AGENT_SIZE } from './AgentLoop.jsx'
import CostFloor, { SIZE as FLOOR_SIZE } from './CostFloor.jsx'
import RoutingMix, { SIZE as ROUTING_SIZE } from './RoutingMix.jsx'
import SelfCheck, { SIZE as CHECK_SIZE } from './SelfCheck.jsx'
import CaseA, { SIZE as CASE_SIZE } from './CaseA.jsx'
import BillChoice, { SIZE as BILL_SIZE } from './BillChoice.jsx'

// One entry per in-deck widget. URL: <site>/?embed=<id>
export const WIDGETS = {
  'cost-floor': { title: 'Slide 7 · The bottom-up floor', comp: CostFloor, size: FLOOR_SIZE },
  'agent-loop': { title: 'Slide 14 · The agentic multiplier', comp: AgentLoop, size: AGENT_SIZE },
  'routing-mix': { title: 'Slide 22 · Model routing in practice', comp: RoutingMix, size: ROUTING_SIZE },
  'self-check': { title: 'Slide 31 · Self-check', comp: SelfCheck, size: CHECK_SIZE },
  'case-a': { title: 'Slide 33 · Worked case A', comp: CaseA, size: CASE_SIZE },
  'bill-choice': { title: 'Slide 36 · The bill is a choice', comp: BillChoice, size: BILL_SIZE },
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
        <p className="de-note" style={{ fontSize: 13 }}>Paste one of these links into PowerPoint’s Web Viewer add-in.</p>
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
  return (
    <div className="deck-embed">
      <Stage w={widget.size.w} h={widget.size.h}>
        <Comp />
      </Stage>
    </div>
  )
}
