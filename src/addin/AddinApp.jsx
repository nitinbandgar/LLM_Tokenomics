/* global Office */
import React, { useEffect, useState } from 'react'
import '../embed/embed.css'
import { WIDGETS, Stage, loadFont } from '../embed/EmbedApp.jsx'

// PowerPoint content add-in: each instance on a slide remembers its widget in
// the document's add-in settings, so one add-in serves every live slide.
const inOffice = () => typeof Office !== 'undefined' && Office.context && Office.context.document

function Picker({ current, onPick }) {
  return (
    <div className="deck-embed de-index">
      <h1>Choose the widget for this slide</h1>
      <p className="de-note" style={{ fontSize: 13, marginTop: 0 }}>Your choice is saved with the presentation.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginTop: 14 }}>
        {Object.entries(WIDGETS).map(([id, w]) => (
          <button key={id} onClick={() => onPick(id)} className="de-btn" style={{
            borderRadius: 10, textAlign: 'left', padding: '12px 14px', fontSize: 14,
            background: id === current ? 'var(--blue)' : '#fff', color: id === current ? '#fff' : 'var(--navy)',
          }}>
            {w.title}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function AddinApp() {
  const [widget, setWidget] = useState(null)
  const [ready, setReady] = useState(false)
  const [view, setView] = useState('edit') // 'edit', or 'read' during the slide show
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    loadFont()
    const onReady = typeof Office !== 'undefined' ? Office.onReady() : Promise.resolve()
    onReady.then(() => {
      if (inOffice()) {
        const saved = Office.context.document.settings.get('widget')
        if (WIDGETS[saved]) setWidget(saved)
        const doc = Office.context.document
        if (doc.getActiveViewAsync) doc.getActiveViewAsync((r) => r.status === 'succeeded' && setView(r.value))
        if (doc.addHandlerAsync) doc.addHandlerAsync(Office.EventType.ActiveViewChanged, (e) => setView(e.activeView))
      } else {
        // opened in a browser: ?widget=<id> previews one
        const id = new URLSearchParams(window.location.search).get('widget')
        if (WIDGETS[id]) setWidget(id)
      }
      setReady(true)
    })
  }, [])

  const pick = (id) => {
    setWidget(id)
    setPicking(false)
    if (inOffice()) {
      Office.context.document.settings.set('widget', id)
      Office.context.document.settings.saveAsync()
    }
  }

  if (!ready) return null
  if (!widget || picking) return <Picker current={widget} onPick={pick} />

  const w = WIDGETS[widget]
  const Comp = w.comp
  return (
    <div className="deck-embed">
      <Stage w={w.size.w} h={w.size.h}>
        <Comp />
      </Stage>
      {view === 'edit' && (
        <button className="de-chip" onClick={() => setPicking(true)}
          style={{ position: 'fixed', top: 4, right: 4, zIndex: 10, opacity: 0.85 }}>
          Change widget
        </button>
      )}
    </div>
  )
}
