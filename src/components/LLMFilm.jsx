import React, { useRef, useState } from 'react'
import { Section, Fold, Hint, More } from './ui.jsx'
import filmSrc from '../assets/film/llm-anatomy.mp4'
import posterSrc from '../assets/film/llm-anatomy-poster.jpg'
import captionsSrc from '../assets/film/llm-anatomy.en.vtt?url'
import { FILM_CHAPTERS, FILM_DURATION, FILM_TRANSCRIPT } from '../assets/film/filmMeta.js'

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

export default function LLMFilm() {
  const video = useRef(null)
  const [now, setNow] = useState(0)

  const current = FILM_CHAPTERS.reduce((acc, c, i) => (now >= c.t - 0.05 ? i : acc), 0)

  const jump = (t) => {
    const v = video.current
    if (!v) return
    v.currentTime = t
    v.play().catch(() => { /* autoplay blocked — the seek still lands */ })
  }

  return (
    <Section
      id="film"
      kicker="Module 1.0 · The film"
      title="The anatomy of an LLM, in under three minutes"
      lede={
        <>
          A narrated, animated tour of the whole chapter before you open the interactives: how a
          sentence becomes tokens and flows through the model, why <strong>writing costs more than
          reading</strong>, and the <strong>five hidden dials</strong> that set your bill.
        </>
      }
    >
      <Fold open title="Watch the film" sub={`${fmtTime(FILM_DURATION)} · voice-over with sound effects · captions available`}>
        <div className="panel">
          <Hint icon="🔊">Turn your sound on and press play. Use the chapter buttons to jump ahead; captions are under <strong>CC</strong>.</Hint>
          <div className="film-frame">
            <video
              ref={video}
              controls
              playsInline
              preload="metadata"
              poster={posterSrc}
              onTimeUpdate={(e) => setNow(e.currentTarget.currentTime)}
              aria-label="Animated film: the anatomy of an LLM"
            >
              <source src={filmSrc} type="video/mp4" />
              <track kind="captions" src={captionsSrc} srcLang="en" label="English" />
            </video>
          </div>
          <div className="film-chapters" role="group" aria-label="Film chapters">
            {FILM_CHAPTERS.map((c, i) => (
              <button
                key={c.num}
                className={'film-chapter' + (i === current ? ' active' : '')}
                onClick={() => jump(c.t)}
                aria-current={i === current ? 'true' : undefined}
              >
                <span className="film-chapter-num">{c.num}</span>
                <span>{c.label}</span>
                <span className="film-chapter-time">{fmtTime(c.t)}</span>
              </button>
            ))}
          </div>
          <More label="Read the script">
            {FILM_TRANSCRIPT.map((p) => (
              <p key={p.chapter} style={{ margin: '0 0 10px' }}>
                <strong>{p.chapter}</strong> — {p.text}
              </p>
            ))}
          </More>
        </div>
      </Fold>
    </Section>
  )
}
