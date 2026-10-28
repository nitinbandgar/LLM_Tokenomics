import React, { useLayoutEffect, useState } from 'react'
import './embed.css'
import AgentLoop, { SIZE as AGENT_SIZE } from './AgentLoop.jsx'

// One entry per in-deck widget. URL: <site>/?embed=<id>
const WIDGETS = {
  'agent-loop': { title: 'Slide 14 · The agentic multiplier', comp: AgentLoop, size: AGENT_SIZE },
}

const loadFont = () => {
  if (document.getElementById('de-font')) return
  const link = document.createElement('link')
  link.id = 'de-font'
  link.rel = 'stylesheet'
  link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap'
  document.head.appendChild(link)
}

// Render at a fixed design size and scale to fit the frame, so the widget
// looks the same in PowerPoint's edit view, in slide show, and in a browser.
function Stage({ w, h, children }) {
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
