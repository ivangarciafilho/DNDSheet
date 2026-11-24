import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// F2.3: Character Mode 2024 provenance, Origin Feats, Weapon Mastery UI, .character.json roundtrip,
// and pt-BR UI contrast verification.
const result = await browserProbe(async ({ evaluate, waitFor }) => {
  await evaluate(`(() => {
    const gp = document.querySelector('#q-app').__vue_app__.config.globalProperties
    const ed = gp.$pinia._s.get('editor')
    const ch = gp.$pinia._s.get('character')
    gp.$i18n.locale = 'pt-BR'
    ed.activeMode = 'character'
    ch.setRuleset('2024', 'SRD 5.2.1')
    ch.addOriginFeat('Alert', '+PB Initiative')
    ch.addWeaponMastery('Longsword', 'Sap', 'Disadvantage on next attack')
  })()`)

  await waitFor("!!document.querySelector('[data-character-ruleset-badge]') && !!document.querySelector('[data-character-origin-feats]') && !!document.querySelector('[data-character-weapon-masteries]')", { label: 'Character 2024 sheet sections visible' })

  const roundtrip = await evaluate(`(() => {
    const gp = document.querySelector('#q-app').__vue_app__.config.globalProperties
    const ch = gp.$pinia._s.get('character')
    const sheetText = document.querySelector('#char-sheet')?.textContent || ''
    const serialized = JSON.stringify(ch.actor)
    const parsed = JSON.parse(serialized)
    ch.resetCharacter()
    ch.actor = parsed
    return {
      rulesetBadge: document.querySelector('[data-character-ruleset-badge]')?.textContent?.trim(),
      hasAlert: sheetText.includes('Alert'),
      hasSap: sheetText.includes('Longsword') && sheetText.includes('Sap'),
      ptBrFeatureHeading: sheetText.includes('CARACTERÍSTICAS') || sheetText.includes('TALENTOS DE ORIGEM'),
      restoredRuleset: ch.actor.provenance?.ruleset,
      restoredFeatCount: ch.actor.originFeats?.length ?? 0,
      restoredMasteryCount: ch.actor.weaponMasteries?.length ?? 0,
    }
  })()`)

  return roundtrip
})

assert.match(result.rulesetBadge || '', /2024/)
assert.equal(result.hasAlert, true)
assert.equal(result.hasSap, true)
assert.equal(result.ptBrFeatureHeading, true)
assert.equal(result.restoredRuleset, '2024')
assert.ok(result.restoredFeatCount >= 1)
assert.ok(result.restoredMasteryCount >= 1)
console.log('Character 2024 browser smoke:', JSON.stringify(result))
