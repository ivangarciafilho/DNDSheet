import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  CANONICAL_CATALOGS,
  canonicalCatalog,
  canonicalCatalogIds,
} from '../../src/core/domain/catalogs/enumerations.ts'
import {
  buildCatalogOptions,
  filterCatalogOptions,
  stepOptionIndex,
} from '../../src/core/domain/catalogs/catalog-select-model.ts'
import { HELP_MESSAGES } from '../../src/i18n/en-US/help.ts'

test('A13.2: canonical catalog registry provides all 13 catalogs with structured labels', () => {
  const ids = canonicalCatalogIds()
  assert.equal(ids.length, 13)
  assert.deepEqual(ids.sort(), [
    'alignments',
    'conditions',
    'creatureTypes',
    'damageTypes',
    'languages',
    'recharge',
    'roles',
    'schools',
    'senses',
    'sizes',
    'skills',
    'spellLevels',
    'tools',
  ])

  for (const id of ids) {
    const cat = canonicalCatalog(id)
    assert.ok(cat.entries.length > 0, `Catalog ${id} must not be empty`)
    for (const entry of cat.entries) {
      assert.ok(typeof entry.label === 'string' && entry.label.trim().length > 0)
      if (id === 'spellLevels') {
        assert.ok(/Cantrip|Level/.test(entry.label), `spellLevel label must be prose/ordinal, got ${entry.label}`)
      }
    }
  }
  assert.equal(CANONICAL_CATALOGS.schools.entries.length, 8)
  assert.equal(CANONICAL_CATALOGS.tools.entries.length, 41)
})

test('A13.1: catalog-select model enforces custom-first, alphabetical vs preserveOrder, filter, and keyboard steps', () => {
  // preserveOrder for sizes: Tiny .. Gargantuan regardless of alphabet
  const sizes = buildCatalogOptions({ catalogId: 'sizes' })
  assert.deepEqual(
    sizes.map((s) => s.value),
    ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'],
  )
  assert.equal(sizes[0].firstInGroup, true)
  assert.equal(sizes[1].firstInGroup, false)

  // Custom-first with currentValue not in canonical catalog
  const creatureOpts = buildCatalogOptions({
    catalogId: 'creatureTypes',
    currentValue: 'Clockwork Titan',
    customValues: ['Starspawn'],
  })
  assert.equal(creatureOpts[0].custom, true)
  assert.equal(creatureOpts[0].group, 'Custom / Saved')
  assert.equal(creatureOpts[0].label, 'Clockwork Titan')
  assert.equal(creatureOpts[1].label, 'Starspawn')
  assert.equal(creatureOpts[1].firstInGroup, false)
  assert.equal(creatureOpts[2].firstInGroup, true)

  // Filtering refreshes firstInGroup boundaries and searches label + group + badge
  const filteredFire = filterCatalogOptions(
    buildCatalogOptions({ catalogId: 'damageTypes' }),
    'fire',
  )
  assert.ok(filteredFire.some((o) => o.value === 'Fire'))
  assert.equal(filteredFire[0].firstInGroup, true)

  // Keyboard navigation steps deterministically with wrap + Home/End
  assert.equal(stepOptionIndex(-1, 'ArrowDown', 5), 0)
  assert.equal(stepOptionIndex(0, 'ArrowDown', 5), 1)
  assert.equal(stepOptionIndex(4, 'ArrowDown', 5), 0)
  assert.equal(stepOptionIndex(0, 'ArrowUp', 5), 4)
  assert.equal(stepOptionIndex(2, 'Home', 5), 0)
  assert.equal(stepOptionIndex(1, 'End', 5), 4)
  assert.equal(stepOptionIndex(0, 'ArrowDown', 0), -1)
})

test('A13.7 + H9: help.ts covers all panels with purpose-led copy and zero generated boilerplate in Vue files', () => {
  const sections = Object.keys(HELP_MESSAGES)
  for (const expected of [
    'identity',
    'abilities',
    'defenses',
    'checks',
    'languages',
    'speeds',
    'actions',
    'composer',
    'encounterDynamics',
    'databaseStudio',
    'casting',
    'character',
    'workspace',
  ]) {
    assert.ok(sections.includes(expected), `Missing help section ${expected}`)
  }

  // Every help string in help.ts is non-empty and free of generated boilerplate
  for (const [sec, map] of Object.entries(HELP_MESSAGES)) {
    for (const [key, text] of Object.entries(map)) {
      assert.ok(typeof text === 'string' && text.trim().length >= 15, `help.${sec}.${key} too short`)
      assert.doesNotMatch(text, /for the .+ editor|in the .+ editor|^Tick to include/i)
    }
  }

  // Every $t('help...') usage in src/**/*.vue resolves to an existing key, and zero boilerplate remains
  const referencedKeys = new Set<string>()
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (entry.name.endsWith('.vue')) {
        const content = fs.readFileSync(full, 'utf8')
        assert.doesNotMatch(
          content,
          /v-help="[^"]*(?:for the [a-z ]+ editor|in the [a-z ]+ editor|Tick to include)/i,
          `Leftover generated v-help string in ${full}`,
        )
        for (const match of content.matchAll(/\$t\('help\.([^']+)'\)/g)) {
          referencedKeys.add(match[1])
        }
      }
    }
  }
  walk('src')
  assert.ok(referencedKeys.size >= 140, `Expected broad help key adoption, saw ${referencedKeys.size}`)

  const flatHelp = HELP_MESSAGES as unknown as Record<string, Record<string, string>>
  for (const dotted of referencedKeys) {
    const [sec, key] = dotted.split('.')
    assert.ok(flatHelp[sec]?.[key], `Missing help.ts key for $t('help.${dotted}')`)
  }
})
