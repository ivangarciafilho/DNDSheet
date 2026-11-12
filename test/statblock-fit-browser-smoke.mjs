import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate }) => {
  const result = await evaluate(`(async () => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster'), editor = pinia._s.get('editor');
    const wait = () => new Promise(resolve => setTimeout(resolve, 250));
    monster.$reset();
    monster.name = 'Statblock Fit Witness';
    for (let index = 0; index < 5; index++) {
      monster.addTrait();
      Object.assign(monster.traits.at(-1), { name: 'Fit Trait ' + index,
        description: 'This full description stays visible and wraps in the available column space. '.repeat(6) });
    }
    Object.assign(editor, { a4PreviewMode: true, a4Orientation: 'landscape',
      a4Layout: 'statblock_only', a4Zoom: 100, statblockFontScale: 100 });
    await wait();
    const block = document.querySelector('#render .statblock');
    const measure = () => {
      const style = getComputedStyle(block);
      const transform = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
      const { width, height } = block.getBoundingClientRect();
      return { width, height, x: transform.a, y: transform.d,
        font: Number(style.getPropertyValue('--statblock-font-scale')),
        titleFont: parseFloat(getComputedStyle(block.querySelector('h3')).fontSize) };
    };
    await document.fonts.ready;
    await wait();
    const natural = measure();
    editor.statblockFontScale = 125;
    await wait();
    const larger = measure();
    editor.statblockFontScale = 100;
    editor.a4StatblockFinalWidth = 90;
    await wait();
    const mild = measure();
    editor.a4StatblockFinalWidth = 40;
    editor.a4StatblockFinalHeight = 40;
    await wait();
    const tight = measure();
    editor.a4StatblockFinalWidth = 100;
    editor.a4StatblockFinalHeight = 100;
    await wait();
    return { natural, larger, mild, tight, restored: measure(),
      textPresent: block.textContent.includes('Fit Trait 4') };
  })()`)
  const { natural, larger, mild, tight, restored } = result
  const near = (a, b) => Math.abs(a - b) < 2
  assert.ok(larger.titleFont > natural.titleFont && larger.font === 1.25, JSON.stringify(result))
  assert.ok(mild.font < 1 && mild.font > 0.75 && mild.x === 1 && mild.y === 1 &&
    near(mild.width, natural.width * 0.9), JSON.stringify(result))
  assert.ok(tight.font === 0.75 && tight.x < 1 && tight.y < 1 &&
    near(tight.width, natural.width * 0.4) && near(tight.height, natural.height * 0.4), JSON.stringify(result))
  assert.ok(near(restored.width, natural.width) && Math.abs(restored.height - natural.height) < 4 && result.textPresent, JSON.stringify(result))
  console.log('A4 statblock font scale, proportional fit, independent axis compression, and reset passed.')
}, { url: process.env.DNDSHEET_E2E_URL || 'http://127.0.0.1:9234/index.html#/', port: 9395 })
