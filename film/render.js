// node render.js <worker> <nWorkers>  → seg_<worker>.mp4
const { chromium } = require('playwright')
const { spawn } = require('child_process')
const FPS = 30
;(async () => {
  const [w, nw] = process.argv.slice(2).map(Number)
  const total = JSON.parse(require('fs').readFileSync('timings.json')).total
  const nF = Math.ceil(total * FPS)
  const per = Math.ceil(nF / nw), f0 = w * per, f1 = Math.min(nF, f0 + per)
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] })
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
  await p.goto('file://' + __dirname + '/film.html')
  await p.evaluate(() => window.READY)
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', `seg_${w}.mp4`], { stdio: ['pipe', 'inherit', 'inherit'] })
  const t0 = Date.now()
  for (let f = f0; f < f1; f++) {
    const data = await p.evaluate((t) => { window.render(t); return document.getElementById('c').toDataURL('image/png') }, f / FPS)
    const buf = Buffer.from(data.slice(data.indexOf(',') + 1), 'base64')
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if ((f - f0) % 300 === 0) console.log(`w${w} frame ${f - f0}/${f1 - f0}  ${((Date.now() - t0) / 1000).toFixed(0)}s`)
  }
  ff.stdin.end()
  await new Promise((r) => ff.on('close', r))
  await b.close()
  console.log(`w${w} done`)
})()
