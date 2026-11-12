import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate }) => {
  const result = await evaluate(`(async () => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster'), editor = pinia._s.get('editor'), spells = pinia._s.get('spells');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const button = icon => [...document.querySelectorAll('header button')].find(el => el.querySelector('i')?.textContent.trim() === icon);
    const screenshotFacts = () => {
      const block = document.querySelector('#render .statblock');
      return { text: block.textContent, classes: block.className, font: getComputedStyle(block).getPropertyValue('--statblock-font-scale') };
    };
    const spellName = 'Roundtrip Custom Spell';
    const img = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="40"><rect width="24" height="40" fill="red"/></svg>');
    monster.$reset();
    monster.name = 'Native Roundtrip Witness';
    monster.portrait = { url: img, position: 'left', width: 240 };
    monster.customMacros = { WITNESS: 'PB+1' };
    monster.basicRiders = { ac: [{ id: 'native-rider', cadence: 'once_round', timing: 'As a Reaction', effect: 'Raise its shield.' }] };
    monster.defenseSchedules = { onHit: { cadence: 'once_round', timing: 'As a Reaction' } };
    monster.hpRiderSubrows = { mortality: true, regen: false };
    monster.addAction();
    Object.assign(monster.actions.at(-1), { name: 'Roundtrip Action', description: 'Restored action text.' });
    spells.addSpell({ name: spellName, damage: 0, multitarget: false, class: ['WIZARD'], level: 1, custom: true, srd: false });
    spells.addSpell({ name: 'Unrelated Custom Spell', damage: 0, multitarget: false, class: [], level: 1, custom: true, srd: false });
    monster.spellcasting.standard = [spellName];
    monster.spellcasting.class = 'Wizard';
    monster.spellcasting.level = 3;
    Object.assign(editor, {
      a4PreviewMode: true, a4Orientation: 'landscape', a4Layout: 'side_by_side', a4Zoom: 'fit',
      a4StatblockWidth: 77, statblockFontScale: 125, visualTemplate: 'modern', visualTheme: 'art_deco',
      a4Layers: [{ id: 'native-art', name: 'Roundtrip Artwork', type: 'background', url: img, opacity: 80,
        visible: true, blendMode: 'normal', rotation: 90, scaleX: 115, scaleY: 85, mirrorVertical: true }]
    });
    await wait(550);
    const before = screenshotFacts();
    let download;
    const nativeAnchor = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { download = fetch(this.href).then(response => response.text()); };
    try {
      button('download').click();
      await wait(200);
      [...document.querySelectorAll('.q-menu .q-item')].find(el => el.textContent.trim() === 'Export JSON (5emm format)').click();
    } finally { HTMLAnchorElement.prototype.click = nativeAnchor; }
    const raw = await download;
    const file = JSON.parse(raw);
    monster.$reset();
    monster.name = 'Different monster';
    monster.$state.futureEditorField = 'Unrelated field';
    editor.$reset();
    spells.$reset();
    await wait(150);
    const importFile = async (payload, name) => {
      const nativePicker = HTMLInputElement.prototype.click;
      HTMLInputElement.prototype.click = function () {
        if (this.type !== 'file') return nativePicker.call(this);
        const files = new DataTransfer();
        files.items.add(new File([payload], 'native.5emm.json', { type: 'application/json' }));
        this.files = files.files;
        this.dispatchEvent(new Event('change', { bubbles: true }));
      };
      try {
        document.querySelector('header button:has(.mdi-folder-open)').click();
        for (let i = 0; i < 30 && monster.name !== name; i++) await wait(100);
      } finally { HTMLInputElement.prototype.click = nativePicker; }
      await wait(550);
    };
    await importFile(raw, file.name);
    const after = screenshotFacts();
    const retained = (actual, expected) => Array.isArray(expected)
      ? Array.isArray(actual) && actual.length === expected.length && expected.every((item, i) => retained(actual[i], item))
      : expected && typeof expected === 'object'
        ? !!actual && Object.entries(expected).every(([key, value]) => retained(actual[key], value))
        : actual === expected;
    const { sheetPresentation, sheetCustomSpells, ...authored } = file;
    const result = {
      lost: Object.keys(authored).filter(key => !retained(monster.$state[key], authored[key])),
      presentationLost: Object.keys(sheetPresentation).filter(key => !retained(editor.$state[key], sheetPresentation[key])),
      customSpell: sheetCustomSpells.length === 1 && spells.allSpells[spellName]?.level === 1,
      staleFieldCleared: !Object.hasOwn(monster.$state, 'futureEditorField'),
      rendered: before.text === after.text && before.classes === after.classes && before.font === after.font,
      messages: [...document.querySelectorAll('.q-notification__message')].map(el => el.textContent),
    };
    const legacy = { ...authored, name: 'Legacy unresolved spell', spellcasting: {
      ...authored.spellcasting, standard: ['Missing Library Spell'],
      atWill: [{ id: 'legacy-innate', count: 1, rate: 'day', spells: ['Missing Innate Spell'] }]
    } };
    await importFile(JSON.stringify(legacy), legacy.name);
    return { ...result, legacyPreserved: monster.name === legacy.name &&
      monster.spellcasting.standard.includes('Missing Library Spell') &&
      monster.spellcasting.atWill[0]?.spells.includes('Missing Innate Spell') &&
      editor.statblockFontScale === 125 };
  })()`)
  assert.deepEqual(result.lost, [], JSON.stringify(result))
  assert.deepEqual(result.presentationLost, [], JSON.stringify(result))
  assert.ok(result.customSpell && result.staleFieldCleared && result.rendered && result.legacyPreserved, JSON.stringify(result))
  console.log('Native monster roundtrip restored all exported monster and presentation fields, its custom spell, and rendered sheet.')
}, { url: process.env.DNDSHEET_E2E_URL || 'http://127.0.0.1:9234/index.html#/', port: 9397 })
