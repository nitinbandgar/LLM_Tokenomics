import React from 'react'
import ReactDOM from 'react-dom/client'

const root = ReactDOM.createRoot(document.getElementById('root'))

// ?embed=<id> serves a single deck-styled widget for PowerPoint's Web Viewer;
// anything else is the full guide. Both load lazily so neither pays for the other.
const embed = new URLSearchParams(window.location.search).get('embed')

if (embed !== null) {
  import('./embed/EmbedApp.jsx').then(({ default: EmbedApp }) =>
    root.render(<React.StrictMode><EmbedApp id={embed} /></React.StrictMode>),
  )
} else {
  Promise.all([import('./App.jsx'), import('./index.css')]).then(([{ default: App }]) =>
    root.render(<React.StrictMode><App /></React.StrictMode>),
  )
}
