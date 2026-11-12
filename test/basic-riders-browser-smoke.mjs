import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

await browserProbe(async ({ evaluate }) => {
  const result = await evaluate(`(async () => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia;
    const monster = pinia._s.get('monster'), editor = pinia._s.get('editor');
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    monster.$reset();
    monster.name = 'Rider Witness';
    monster.stats.WIS = 16;
    monster.skills = [{ key: 'MEDICINE', skill: { label: 'Medicine', stat: 'WIS' }, proficient: false,
      expertise: false, override: true, overrideValue: 8 }];
    monster.extendedHp.damageThreshold = 5;
    monster.extendedHp.damageReduction = 2;
    monster.hpRiderSubrows = { dt: true, dr: false };
    const scopes = ['ac', 'hp', 'speed', 'senses', 'languages', 'deathThroes', 'onDamage'];
    monster.basicRiders = Object.fromEntries(scopes.map(scope => [scope, [{
      id: scope, cadence: scope === 'ac' ? 'once_round' : 'once_long_rest',
      timing: scope === 'ac' ? 'As a Reaction' : 'As an Action', effect: 'Witness ' + scope
    }]]));
    Object.assign(monster.spellcasting, { class: 'Warlock', level: 9, stat: 'CHA', resourceType: 'pact',
      refreshRate: 'short_rest', standard: ['Fire Bolt', 'Hold Person'], slots: [0, 0, 0, 0, 2],
      preparedCountOverride: 5, preparedInterval: 'short_rest', preparedSpellList: 'Cleric',
      metamagic: { enabled: true, sorceryPoints: 4, refreshRate: 'short_rest', options: ['Quickened Spell', 'Subtle Spell'] }
    });
    editor.visualTemplate = 'modern';
    editor.style = '2024';
    await wait(500);
    const acEditor = document.querySelector('[data-basic-riders="ac"]');
    acEditor.querySelector('.q-item').click();
    await wait(180);
    [...acEditor.querySelectorAll('button')].find(button => button.textContent.includes('Add rider')).click();
    await wait(150);
    const controls = [...acEditor.querySelectorAll('.q-field__label')].map(el => el.textContent);
    const authored = monster.basicRiders.ac.length === 2 && controls.includes('Cadence') &&
      controls.includes('Timing') && controls.includes('Effect');
    const render = document.querySelector('#render');
    const rows = () => [...render.querySelectorAll('.dnd-vitals-indented-subrow')].map(row => row.textContent.trim());
    const splitBefore = rows();
    const control = document.querySelector('[data-contextual-split-hp="dr"]');
    control.click();
    await wait(200);
    const splitAfter = rows();
    const meta = [...render.querySelectorAll('.sb-metamagic-option')];
    const resource = render.querySelector('.sb-spell-resource-row');
    const all = render.textContent;
    const roundness = parseFloat(getComputedStyle(meta[0]?.querySelector('.sb-metamagic-badge')).borderRadius);
    return {
      authored,
      scopeText: Object.fromEntries(scopes.map(scope => [scope, all.includes('Witness ' + scope)])),
      cadence: all.includes('Once per round: As a Reaction: Witness ac'),
      groups: all.includes('(13/+3, Perception, Insight, Survival), (18/+8, Medicine)'),
      skillText: all.slice(all.indexOf('13/+3'), all.indexOf('13/+3') + 120),
      splitBefore, splitAfter, dt: monster.hpRiderSubrows.dt, dr: monster.hpRiderSubrows.dr,
      options: meta.length, separateRows: meta[1]?.getBoundingClientRect().top > meta[0]?.getBoundingClientRect().top,
      roundness, number: [...resource.querySelectorAll('strong')].map(el => el.textContent),
      terms: [...resource.querySelectorAll('em')].map(el => el.textContent),
      optionTerms: [...meta[0].querySelectorAll('em')].map(el => el.textContent),
    };
  })()`)
  assert.ok(result.authored && Object.values(result.scopeText).every(Boolean) && result.cadence, JSON.stringify(result))
  assert.ok(result.groups, JSON.stringify(result))
  assert.ok(result.dt && result.dr && result.splitBefore.some(text => text.includes('DT 5')) &&
    result.splitBefore.every(text => !text.includes('DR 2')) && result.splitAfter.some(text => text.includes('DR 2')), JSON.stringify(result))
  assert.ok(result.options === 2 && result.separateRows && result.roundness > 20, JSON.stringify(result))
  assert.ok(result.number.includes('5') && result.terms.includes('Short Rest') && result.terms.includes('Cleric') &&
    result.optionTerms.includes('Bonus Action'), JSON.stringify(result))
  console.log('Rider cadence and timing, independent HP rows, grouped skill scores, and spellcasting typography passed.')
}, { url: process.env.DNDSHEET_E2E_URL || 'http://127.0.0.1:9234/index.html#/', port: 9396 })
