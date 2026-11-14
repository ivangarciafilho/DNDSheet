import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { buildCatalogOptions } from '../../src/core/domain/catalogs/catalog-select-model.ts'
import {
  AC_BASE_ENTRIES,
  AC_DEFENSIVE_MECHANIC_ENTRIES,
  BLOODIED_SOURCE_ENTRIES,
  CR_ENTRIES,
  DEATH_PREVENTION_RULE_ENTRIES,
  DT_DR_SOURCE_ENTRIES,
  LAIR_CR_ENTRIES,
} from '../../src/components/editor/basics/basics-catalogs.ts'

const BASICS_DIR = 'src/components/editor/basics'
const EXPECTED_SECTIONS = [
  'IdentitySection.vue',
  'AbilitiesSection.vue',
  'DefensesSection.vue',
  'HitPointsSection.vue',
  'ParagonSection.vue',
  'LoreSection.vue',
] as const

test('A14.1: BasicsEditor is a thin 6-panel wrapper preserving the single top-level expansion root', () => {
  const wrapper = fs.readFileSync('src/components/editor/BasicsEditor.vue', 'utf8')
  const wrapperLines = wrapper.split(/\r?\n/).length
  assert.ok(wrapperLines <= 45, `BasicsEditor.vue wrapper should stay thin (got ${wrapperLines} lines)`)
  assert.match(wrapper, /data-editor-section="basics"/)
  assert.match(wrapper, /provideBasicsContext\(\)/)

  // Only one top-level q-expansion-item wrapper in BasicsEditor.vue so #editor > .q-list > .q-expansion-item remains 15
  assert.equal((wrapper.match(/<q-expansion-item/g) || []).length, 1)

  for (const file of EXPECTED_SECTIONS) {
    const full = path.join(BASICS_DIR, file)
    assert.ok(fs.existsSync(full), `Missing decomposed Basics section: ${full}`)
    const src = fs.readFileSync(full, 'utf8')
    assert.match(src, /useBasicsContext\(\)/, `${file} must read state via useBasicsContext()`)
  }
})

test('A14.2: zero raw <q-select> elements remain across BasicsEditor and its six subpanels', () => {
  const files = ['src/components/editor/BasicsEditor.vue', ...EXPECTED_SECTIONS.map((f) => path.join(BASICS_DIR, f))]
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8')
    assert.doesNotMatch(src, /<q-select\b/, `Raw <q-select> still present in ${file}`)
  }

  const combined = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n')
  for (const marker of [
    'catalog-id="sizes"',
    'catalog-id="creatureTypes"',
    'catalog-id="alignments"',
    'catalog-id="damageTypes"',
    'data-paragon-phase-row',
    'data-contextual-split-hp="dr"',
    'data-contextual-split-ac="true"',
    'data-proficiency-scale',
  ]) {
    assert.ok(combined.includes(marker), `Preserved test/contract marker missing from Basics panels: ${marker}`)
  }
})

test('A14.2: Basics catalog entry sets preserve progression order and numeric zero/negative sentinel values', () => {
  const crOpts = buildCatalogOptions({ entries: CR_ENTRIES, currentValue: 0, preserveOrder: true })
  assert.equal(crOpts[0].value, 0)
  assert.equal(crOpts[0].label, '0')
  assert.equal(crOpts[1].label, '1/8')

  const lairOpts = buildCatalogOptions({ entries: LAIR_CR_ENTRIES, currentValue: -1, preserveOrder: true })
  assert.equal(lairOpts[0].value, -1)
  assert.equal(lairOpts[0].label, LAIR_CR_ENTRIES[0].label)

  for (const entries of [
    AC_BASE_ENTRIES,
    AC_DEFENSIVE_MECHANIC_ENTRIES,
    BLOODIED_SOURCE_ENTRIES,
    DT_DR_SOURCE_ENTRIES,
    DEATH_PREVENTION_RULE_ENTRIES,
  ]) {
    const opts = buildCatalogOptions({ entries, preserveOrder: true })
    assert.ok(opts.length > 0)
    assert.equal(opts[0].value, entries[0].value)
  }
})
