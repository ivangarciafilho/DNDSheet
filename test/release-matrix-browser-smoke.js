import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { migrateMonsterSchema } from '../src/core/usecases/MigrateMonsterSchema.ts'
import { browserProbe } from '../tools/qa/browser-probe.mjs'
const ids = ['seraph', 'pact', 'full', 'innate', 'legacy-actions'],
  themes = [
    'wotc',
    'printer',
    'lovecraft_golden',
    'lovecraft_silver',
    'lovecraft_toxic',
    'lovecraft_spooky',
    'lovecraft_galactic',
    'lovecraft_fathomless',
    'dwarves_forge',
    'dwarves_aetherpunk',
    'art_nouveau',
    'art_deco',
  ]
const rows = []
try {
  await browserProbe(async ({ evaluate }) => {
    for (const id of ids) {
      const fixture = migrateMonsterSchema(
        JSON.parse(
          fs.readFileSync(
            new URL(`./fixtures/monsters/${id}.json`, import.meta.url),
            'utf8'
          )
        )
      )
      await evaluate(
        `(async()=>{const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,m=p._s.get('monster');m.$reset();await new Promise(r=>setTimeout(r,0));m.$patch(${JSON.stringify(
          fixture
        )});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))})()`
      )
      for (const theme of themes) {
        const row = await evaluate(
          `(async()=>{const p=document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia,e=p._s.get('editor');e.visualTheme=${JSON.stringify(
            theme
          )};e.visualTemplate='modern';await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const paint=node=>{for(let n=node;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor;if(c!=='transparent'&&c!=='rgba(0, 0, 0, 0)')return c}return 'rgb(255, 255, 255)'};const rgb=s=>s.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});const luminance=s=>rgb(s).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);const samples=['.ac > .dnd-cascade-title','.ac > .dnd-cascade-badges-wrap'].map(selector=>{const n=document.querySelector('#render .statblock '+selector);if(!n)return {selector,ratio:0,missing:true};const foreground=getComputedStyle(n).color,background=paint(n),a=luminance(foreground),b=luminance(background);return {selector,foreground,background,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}});return {theme:${JSON.stringify(
            theme
          )},fixture:${JSON.stringify(
            id
          )},nameVisible:document.querySelector('#render').textContent.includes(${JSON.stringify(
            fixture.name
          )}),samples}})()`
        )
        rows.push(row)
      }
    }
  })
  assert.equal(rows.length, 60)
  for (const row of rows) {
    assert.ok(row.nameVisible, JSON.stringify(row))
    for (const sample of row.samples)
      assert.ok(
        sample.ratio >= 4.5,
        JSON.stringify({ fixture: row.fixture, theme: row.theme, ...sample })
      )
  }
  console.log(
    'Release matrix passed: 5 shared fixtures × 12 themes; 120 computed head/body contrast samples'
  )
} finally {
  const artifact =
    process.env.DNDSHEET_MATRIX_ARTIFACT || '.gate/release-matrix.json'
  fs.mkdirSync(path.dirname(artifact), { recursive: true })
  fs.writeFileSync(
    artifact,
    JSON.stringify(
      {
        scope:
          'AC head and body computed foreground/nearest painted background; not a full accessibility audit',
        rows,
      },
      null,
      2
    )
  )
}
