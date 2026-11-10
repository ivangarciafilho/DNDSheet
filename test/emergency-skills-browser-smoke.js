import assert from 'node:assert/strict'
import { browserProbe } from '../tools/qa/browser-probe.mjs'

// Every browser owns a temporary profile; the fixture never touches the user's sample.
const result = await browserProbe(async ({ evaluate, send, delay }) => {
  const initial = await evaluate(`(async () => {
    const pinia = document.querySelector('#q-app').__vue_app__.config.globalProperties.$pinia
    const monster = pinia._s.get('monster')
    const editor = pinia._s.get('editor')
    editor.activeMode = 'monster'
    editor.style = '2024'
    monster.$reset()
    await new Promise(resolve => setTimeout(resolve, 0))
    monster.name = 'Emergency Skills Routing Witness'
    monster.stats.WIS = 16
    monster.skills = [{ key: 'MEDICINE', skill: { stat: 'WIS', label: 'Medicine' }, proficient: true, expertise: false, override: false, overrideValue: 0 }]
    monster.passives = {
      searchActionType: 'Action', studyActionType: 'Action', hideActionType: 'Action', influenceActionType: 'Action', toolsActionType: 'Action',
      riders: { search: 'Emergency search rider' },
      medicine: { override: true, overrideValue: 23, advantage: true, disadvantage: false, condition: 'Emergency stabilization' },
    }
    monster.actionOrientedPassives = { bonusActionSearch: false, bonusActionStudy: false, bonusActionHide: false, bonusActionInfluence: false }
    delete monster.toolsPlacement
    return true
  })()`)
  assert.equal(initial, true)

  const checks = await evaluate(`(async () => {
    const wait = async (predicate, label) => {
      for (let attempt = 0; attempt < 60; attempt++) {
        const value = predicate()
        if (value) return value
        await new Promise(resolve => setTimeout(resolve, 80))
      }
      throw new Error('Timed out: ' + label)
    }
    const check = (value, label) => { if (!value) throw new Error(label) }
    const expansion = await wait(() => [...document.querySelectorAll('.q-expansion-item')].find(item => /^Skills$/.test(item.querySelector('.q-item__label')?.textContent.trim() || '')), 'Skills module')
    if (!expansion.classList.contains('q-expansion-item--expanded')) expansion.querySelector('.q-expansion-item__container > .q-item').click()
    const card = label => [...expansion.querySelectorAll('span')].find(span => span.textContent.trim().endsWith(label + ' Checks'))?.closest('.rounded-borders')
    const search = await wait(() => card('Search')?.querySelector('[role="checkbox"]'), 'Search checkbox')
    const searchCard = card('Search')
    const checkboxes = [...expansion.querySelectorAll('[role="checkbox"]')].filter(node => node.textContent.includes('Move To Action Group'))
    check(checkboxes.length === 5 && checkboxes.every(node => node.getAttribute('aria-checked') === 'true'), 'All five new group checkboxes must default on')
    check(![...expansion.querySelectorAll('.q-field__label')].some(node => node.textContent.trim() === 'Placement'), 'Placement dropdown must be removed')
    check(searchCard.textContent.includes('Medicine') && !card('Study').textContent.includes('Medicine'), 'Medicine must belong to Search rather than Study')
    const rendered = () => document.querySelector('#render .statblock')
    const actions = () => [...rendered().querySelectorAll('.action')].filter(node => /^\\s*Search\\b/.test(node.textContent))
    const header = () => rendered().querySelector('.cascade-skill-search')
    const retained = node => node && ['Medicine', '23', 'Emergency stabilization', 'Emergency search rider'].every(text => node.textContent.includes(text))
    await wait(() => actions().length === 1 && !actions()[0].closest('.bonus-actions') && retained(actions()[0]) && !header(), 'default Action section with passive detail')
    const bonusButton = [...searchCard.querySelectorAll('.q-btn-toggle button')].find(node => node.textContent.trim() === 'Bonus Action')
    check(bonusButton, 'Search needs its retained Bonus Action toggle')
    bonusButton.click()
    await wait(() => actions().length === 1 && actions()[0].closest('.bonus-actions') && retained(actions()[0]) && !header(), 'Bonus Action section after UI toggle')
    search.click()
    await wait(() => search.getAttribute('aria-checked') === 'false' && header()?.textContent.includes('Medicine') && header().textContent.includes('23') && header().textContent.includes('Emergency stabilization') && actions().length === 0, 'unchecked group returns to skills header without losing passive details')
    search.click()
    await wait(() => search.getAttribute('aria-checked') === 'true' && actions()[0]?.closest('.bonus-actions') && retained(actions()[0]), 'checkbox moves group back using selected cost')
    search.click()
    await wait(() => search.getAttribute('aria-checked') === 'false' && header(), 'final unchecked preference')
    return { defaultOn: true, placementRemoved: true, medicineInSearch: true, actionRouting: true, bonusRouting: true, uncheckedHeader: true, retainedDetails: true, repeatToggle: true }
  })()`)
  for (const [name, passed] of Object.entries(checks)) assert.equal(passed, true, name + ": " + JSON.stringify(checks))

  let persisted = false
  for (let attempt = 0; attempt < 50; attempt++) {
    persisted = await evaluate(`Object.values(localStorage).some(value => value.includes('Emergency Skills Routing Witness') && value.includes('searchMoveToActionGroup') && value.includes('Emergency stabilization'))`)
    if (persisted) break
    await delay(80)
  }
  assert.equal(persisted, true, 'The fixture and checkbox preference must reach persistence before reload')
  await send('Page.reload', { ignoreCache: true })
  let restored
  for (let attempt = 0; attempt < 80; attempt++) {
    restored = await evaluate(`(() => {
      const pinia = document.querySelector('#q-app')?.__vue_app__?.config.globalProperties.$pinia
      const monster = pinia?._s.get('monster')
      return monster?.name === 'Emergency Skills Routing Witness' && document.querySelector('#render .statblock .cascade-skill-search')?.textContent.includes('Medicine')
    })()`)
    if (restored) break
    await delay(100)
  }
  assert.equal(restored, true, 'Reload must restore the unchecked group in the skill header')
  const reload = await evaluate(`(async () => {
    const expansion = [...document.querySelectorAll('.q-expansion-item')].find(item => /^Skills$/.test(item.querySelector('.q-item__label')?.textContent.trim() || ''))
    if (!expansion) throw new Error('Skills module missing after reload')
    if (!expansion.classList.contains('q-expansion-item--expanded')) expansion.querySelector('.q-expansion-item__container > .q-item').click()
    for (let attempt = 0; attempt < 50; attempt++) {
      const card = [...expansion.querySelectorAll('span')].find(span => span.textContent.trim().endsWith('Search Checks'))?.closest('.rounded-borders')
      const checkbox = card?.querySelector('[role="checkbox"]')
      if (checkbox) {
        const header = document.querySelector('#render .statblock .cascade-skill-search')
        return { headerText: header?.textContent || '', checkboxOff: checkbox.getAttribute('aria-checked') === 'false', medicineRetained: ['Medicine', '23', 'Emergency stabilization'].every(text => header.textContent.includes(text)), bonusCostRetained: [...card.querySelectorAll('.q-btn-toggle button')].some(button => button.textContent.trim() === 'Bonus Action' && button.getAttribute('aria-pressed') === 'true') }
      }
      await new Promise(resolve => setTimeout(resolve, 80))
    }
    throw new Error('Search controls missing after reload')
  })()`)
  for (const [name, passed] of Object.entries(reload).filter(([name]) => name !== 'headerText')) assert.equal(passed, true, name + ': ' + JSON.stringify(reload))
  return { ...checks, ...reload }
}, { port: 9351 })
console.log(JSON.stringify({ suite: 'Emergency skills routing', checks: result }, null, 2))

