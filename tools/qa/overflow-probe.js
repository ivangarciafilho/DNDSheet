import fs from 'node:fs'
import path from 'node:path'
import { browserProbe } from './browser-probe.mjs'
const widths = [640, 960, 1280, 1600, 1920],
  zooms = [1, 2],
  rows = []
await browserProbe(
  async ({ send, evaluate }) => {
    for (const width of widths)
      for (const zoom of zooms) {
        await send('Emulation.setDeviceMetricsOverride', {
          width: Math.floor(width / zoom),
          height: Math.floor(1200 / zoom),
          deviceScaleFactor: zoom,
          mobile: false,
        })
        const row = await evaluate(
          `(async()=>{const wait=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));await wait();const panels=[...document.querySelectorAll('#editor > .q-list > .q-expansion-item')];for(const panel of panels){const head=panel.querySelector('.q-expansion-item__container > .q-item');if(head&&head.getAttribute('aria-expanded')==='false')head.click()}await wait();const root=document.querySelector('#editor'),issues=[],scrollable=[],exemptions=[];if(!root)throw Error('Editor missing');if(${
            process.env.DNDSHEET_FIT_CONTROL === '1'
          }){const control=document.createElement('div');control.style.cssText='width:10px;height:20px;overflow:hidden;white-space:nowrap';control.textContent='Intentional clipping control';root.append(control)}for(const el of root.querySelectorAll('*')){const style=getComputedStyle(el),rect=el.getBoundingClientRect();if(!rect.width||!rect.height||style.display==='none'||style.visibility==='hidden')continue;const own=el.scrollWidth-el.clientWidth;if(own>3){const record={tag:el.tagName,class:el.className,text:el.textContent.trim().slice(0,80),overflow:own};if(el.matches('.q-select__focus-target')||(el.matches('.ellipsis')&&el.closest('.q-field'))){exemptions.push({...record,reason:el.matches('.q-select__focus-target')?'Quasar zero-width keyboard focus helper':'Quasar field label/selection truncation; full field value remains available to assistive technology and the opened control'});continue}if(/auto|scroll/.test(style.overflowX))scrollable.push(record);else if(/hidden|clip/.test(style.overflowX)&&!el.matches('.q-field__native,.q-field__input,.q-select__dropdown-icon,.q-item__label--caption'))issues.push(record)}}return {panelCount:panels.length,issues,scrollable,exemptions}})()`
        )
        rows.push({
          width,
          zoom,
          effectiveCssWidth: Math.floor(width / zoom),
          ...row,
        })
      }
  },
  { port: 9347 }
)
const report = {
  matrix:
    '5 physical widths × 1x/2x effective CSS viewport and raster density; this is not browser UI zoom automation',
  rows,
  clipped: rows.reduce((n, r) => n + r.issues.length, 0),
}
const artifact = process.env.DNDSHEET_FIT_ARTIFACT || '.gate/fit.json'
fs.mkdirSync(path.dirname(artifact), { recursive: true })
fs.writeFileSync(artifact, JSON.stringify(report, null, 2))
console.log(
  `Fit inventory: ${rows.length} views, ${report.clipped} clipping observations; report ${artifact}`
)
if (rows.some((r) => r.panelCount !== 15) || report.clipped)
  process.exitCode = 1
