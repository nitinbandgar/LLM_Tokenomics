const { chromium } = require('playwright')
;(async () => {
  const times = process.argv.slice(2).map(Number)
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] })
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } })
  p.on('console', (m) => console.log('console:', m.text()))
  p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
  await p.goto('file://' + __dirname + '/film.html')
  await p.evaluate(() => window.READY)
  for (const t of times) {
    await p.evaluate((t) => window.render(t), t)
    await p.locator('canvas').screenshot({ path: `stills/s_${String(t).padStart(6, '0')}.png` })
  }
  await b.close()
})()
