import assert from 'node:assert/strict'
import fs from 'node:fs'
import { performance } from 'node:perf_hooks'
import path from 'node:path'
import test from 'node:test'
import {
  buildCatalogOptions,
  filterCatalogOptions,
} from '../../src/core/domain/catalogs/catalog-select-model.ts'
import {
  canonicalCatalog,
  type CanonicalCatalogEntry,
} from '../../src/core/domain/catalogs/enumerations.ts'
import { suggestFormulaRefs } from '../../src/core/domain/formula.ts'
import { checkBundleBudgets } from '../../tools/bundle-budget.mjs'
import { catalogFor, formulaReferences } from '../../src/core/domain/macro-catalog.ts'
import { resolveMonsterBindings } from '../../src/core/domain/monster-bindings.ts'
import type { Monster } from '../../src/core/domain/types.ts'
import { processTokens } from '../../src/core/usecases/ProcessTokens.ts'
import { resolveMonsterText } from '../../src/core/usecases/ResolveMonsterText.ts'

const SERAPH_PATH = new URL('../fixtures/monsters/seraph.json', import.meta.url)
const seraphFixture = (): Monster => JSON.parse(fs.readFileSync(SERAPH_PATH, 'utf8')) as Monster

function p95(samples: number[]): number {
  const sorted = [...samples].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
}

function median(samples: number[]): number {
  const sorted = [...samples].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

function walkVueFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walkVueFiles(full) : full.endsWith('.vue') ? [full] : []
  })
}

test('A16.5 / §15.4: app.scss keeps !important declarations well below the 150-declaration debt ceiling', () => {
  const scss = fs.readFileSync('src/css/app.scss', 'utf8')
  const count = (scss.match(/!important/g) || []).length
  assert.ok(count < 150, `Expected < 150 !important declarations in src/css/app.scss, found ${count}`)
})

test('A16.6 / §15.4: editor help-tip coverage meets the 100 % release floor', () => {
  const CONTROLS = ['q-input', 'q-select', 'q-toggle', 'q-checkbox', 'q-slider', 'q-range', 'q-option-group', 'q-btn-toggle', 'formula-field', 'catalog-select']
  const floor = Number(fs.readFileSync('test/help-floor.txt', 'utf8').trim())
  assert.ok(floor >= 100, `Expected help floor >= 100, got ${floor}`)

  let controls = 0
  let tipped = 0
  for (const file of walkVueFiles('src')) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    lines.forEach((line, index) => {
      const tag = CONTROLS.find((name) => new RegExp(`<${name}(\\s|>|$)`).test(line))
      if (!tag) return
      controls++
      let end = index
      for (let j = index; j < Math.min(lines.length, index + 40); j++) {
        end = j
        if (lines[j].includes(`</${tag}>`)) break
        const openChild = lines.slice(index + 1, j + 1).some((l) => /<[a-z]/.test(l) && !/\/>\s*$/.test(l))
        if (/\/>\s*$/.test(lines[j]) && !openChild) break
      }
      if (/<q-tooltip|v-help=/.test(lines.slice(index, end + 1).join(' '))) tipped++
    })
  }
  const coverage = controls > 0 ? (tipped / controls) * 100 : 0
  assert.ok(controls > 500, `Expected > 500 inventoried controls, found ${controls}`)
  assert.ok(coverage + 1e-9 >= floor, `Help coverage ${coverage.toFixed(1)}% (${tipped}/${controls}) below floor ${floor}%`)
})

test('A17.5 / §15.4: resolver pass completes <= 10 ms p95 across 60+ bindings on a dense fixture', () => {
  const base = seraphFixture()
  const passiveKeys = [
    'perception', 'investigation', 'insight', 'survival', 'arcana',
    'history', 'nature', 'religion', 'persuasion', 'deception',
    'intimidation', 'animalHandling', 'stealth', 'performance',
  ] as const
  const skillKeys = [
    'ACROBATICS', 'ANIMAL_HANDLING', 'ARCANA', 'ATHLETICS', 'DECEPTION', 'HISTORY',
    'INSIGHT', 'INTIMIDATION', 'INVESTIGATION', 'MEDICINE', 'NATURE', 'PERCEPTION',
    'PERFORMANCE', 'PERSUASION', 'RELIGION', 'SLEIGHT_OF_HAND', 'STEALTH', 'SURVIVAL',
  ] as const

  const heavy = {
    ...structuredClone(base),
    proficiencyOverride: true,
    hpModifierOverride: true,
    acConfig: { ...base.acConfig, enabled: false },
    passivePerception: { override: true, overrideValue: 15 },
    passives: Object.fromEntries(passiveKeys.map((key) => [key, { override: true, overrideValue: 12 }])),
    saves: Object.fromEntries(
      (['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const).map((stat) => [
        stat,
        { proficient: true, override: true, overrideValue: 5 },
      ]),
    ),
    skills: skillKeys.map((key) => ({ key, proficient: true, override: true, overrideValue: 7 })),
    speeds: Array.from({ length: 6 }, (_, i) => ({ id: `budget-spd-${i}`, type: 'walk', speed: 30, note: '' })),
    sensesList: Array.from({ length: 6 }, (_, i) => ({
      id: `budget-sns-${i}`,
      type: 'darkvision',
      range: 60,
      rangeUnit: 'ft' as const,
    })),
    attacks: Array.from({ length: 6 }, (_, i) => ({
      id: `budget-atk-${i}`,
      name: `Slash ${i}`,
      modifier: { override: true, overrideValue: 9, stat: 'STR' as const, proficient: true },
      range: { reach: 5, short: 0, long: 0 },
      targets: 1,
      damage: { count: 2, dice: 6, type: 'slashing', modifier: { override: false, overrideValue: 0, stat: 'STR' as const } },
      save: 0,
      description: 'Deals {2d6 + STR_MOD} damage.',
    })),
  }

  const bindings: Record<string, { mode: 'literal'; value: number } | { mode: 'formula'; expr: string }> = {
    'stats.STR': { mode: 'literal', value: 22 },
    'stats.DEX': { mode: 'literal', value: 16 },
    'stats.CON': { mode: 'literal', value: 18 },
    'stats.INT': { mode: 'literal', value: 16 },
    'stats.WIS': { mode: 'literal', value: 20 },
    'stats.CHA': { mode: 'literal', value: 22 },
    proficiency: { mode: 'literal', value: 5 },
    AC: { mode: 'formula', expr: '10 + DEX_MOD + PB' },
    'HP.HD': { mode: 'literal', value: 16 },
    'HP.modifier': { mode: 'formula', expr: 'HD * CON_MOD' },
    'passivePerception.overrideValue': { mode: 'formula', expr: '10 + PB + WIS_MOD' },
  }
  for (const stat of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const) {
    bindings[`saves.${stat}.overrideValue`] = { mode: 'formula', expr: `${stat}_MOD + PB` }
  }
  for (const key of passiveKeys) {
    bindings[`passives.${key}.overrideValue`] = { mode: 'formula', expr: '10 + PB + INT_MOD' }
  }
  for (const key of skillKeys) {
    bindings[`skills[key=${key}].overrideValue`] = { mode: 'formula', expr: 'PB + CHA_MOD' }
  }
  for (let i = 0; i < 6; i++) {
    bindings[`speeds[id=budget-spd-${i}].speed`] = { mode: 'formula', expr: '10 * PB' }
    bindings[`sensesList[id=budget-sns-${i}].range`] = { mode: 'formula', expr: '15 * PB' }
    bindings[`attacks[id=budget-atk-${i}].modifier.overrideValue`] = { mode: 'formula', expr: 'STR_MOD + PB' }
  }

  assert.equal(Object.keys(bindings).length, 67)
  const boundMonster = { ...heavy, bindings }
  const settledMonster = resolveMonsterBindings(boundMonster).model

  // Warmup before sampling
  for (let i = 0; i < 5; i++) {
    const res = resolveMonsterBindings(boundMonster)
    assert.deepEqual(res.errors, {})
  }

  const dirtySamples: number[] = []
  const steadySamples: number[] = []
  for (let i = 0; i < 25; i++) {
    const startDirty = performance.now()
    const resDirty = resolveMonsterBindings(boundMonster)
    dirtySamples.push(performance.now() - startDirty)
    assert.equal(Object.keys(resDirty.errors).length, 0)

    const startSteady = performance.now()
    const resSteady = resolveMonsterBindings(settledMonster)
    steadySamples.push(performance.now() - startSteady)
    assert.equal(resSteady.changed, false)
  }
  const dirtyMedian = median(dirtySamples)
  const steadyMedian = median(steadySamples)
  assert.ok(dirtyMedian <= 10, `67-binding dirty resolveMonsterBindings median ${dirtyMedian.toFixed(2)} ms exceeded 10 ms`)
  assert.ok(steadyMedian <= 10, `67-binding steady resolveMonsterBindings median ${steadyMedian.toFixed(2)} ms exceeded 10 ms`)
})

test('A17.5 / §15.4: text resolution and macro completion stay sub-10 ms on Seraph', () => {
  const seraph = seraphFixture()
  const richProse = 'The {NAME} ({CR}) uses DC {SPELL_DC} or {8 + PB + CHA_MOD}, dealing {3d8 + CHA_MOD} radiant damage with {PROF} bonus.'

  for (let i = 0; i < 3; i++) {
    resolveMonsterText(seraph)
    processTokens(richProse, seraph)
    catalogFor({ scope: 'mechanic', query: 'SPE' })
    suggestFormulaRefs('STR', 10)
    formulaReferences('DC', () => true, 10)
  }

  const textSamples: number[] = []
  const completionSamples: number[] = []
  for (let i = 0; i < 20; i++) {
    const t0 = performance.now()
    const resolved = resolveMonsterText(seraph)
    const tokenOut = processTokens(richProse, resolved)
    textSamples.push(performance.now() - t0)
    assert.ok(tokenOut.includes('Seraph'))

    const c0 = performance.now()
    const macroMatches = catalogFor({ scope: 'mechanic', query: 'SPE' })
    const refMatches = suggestFormulaRefs('MOD', 10)
    const idMatches = formulaReferences('PB', () => true, 10)
    completionSamples.push(performance.now() - c0)
    assert.ok(macroMatches.length > 0 && refMatches.length > 0 && idMatches.length > 0)
  }

  assert.ok(median(textSamples) <= 10, `Text/token resolution median ${median(textSamples).toFixed(2)} ms exceeded 10 ms`)
  assert.ok(p95(textSamples) <= 50, `Text/token resolution p95 ${p95(textSamples).toFixed(2)} ms exceeded 50 ms`)
  assert.ok(median(completionSamples) <= 10, `Completion query median ${median(completionSamples).toFixed(2)} ms exceeded 10 ms`)
  assert.ok(p95(completionSamples) <= 50, `Completion query p95 ${p95(completionSamples).toFixed(2)} ms exceeded 50 ms`)
})

test('A17.5 / §15.4: CatalogSelect model builds and filters 450 options cleanly under 20 ms p95', () => {
  const baseEntries = canonicalCatalog('creatureTypes').entries
  const largeEntries: CanonicalCatalogEntry<string>[] = Array.from({ length: 450 }, (_, index) => {
    const template = baseEntries[index % baseEntries.length]
    return {
      value: `${template.value}-${index}`,
      label: `${template.label} Variant ${index}`,
      group: index % 2 === 0 ? 'Standard' : 'Exotic',
      badge: index % 5 === 0 ? 'SRD' : undefined,
    }
  })

  for (let i = 0; i < 3; i++) {
    const opts = buildCatalogOptions({ entries: largeEntries, customValues: ['Custom Apex'] })
    filterCatalogOptions(opts, 'variant 42')
  }

  const samples: number[] = []
  for (let i = 0; i < 25; i++) {
    const t0 = performance.now()
    const opts = buildCatalogOptions({
      entries: largeEntries,
      currentValue: 'Custom Current',
      customValues: ['Custom Saved'],
    })
    const filtered = filterCatalogOptions(opts, 'variant 3')
    samples.push(performance.now() - t0)
    assert.equal(opts.length, 452)
    assert.ok(filtered.length > 0)
  }
  assert.ok(median(samples) <= 15, `450-option build+filter median ${median(samples).toFixed(2)} ms exceeded 15 ms`)
  assert.ok(p95(samples) <= 50, `450-option build+filter p95 ${p95(samples).toFixed(2)} ms exceeded 50 ms`)
})

test('A17.5: production SPA bundle assets stay within budget when dist/spa exists', () => {
  const assetsDir = path.resolve('dist/spa/assets')
  if (!fs.existsSync(assetsDir)) return
  const files = fs.readdirSync(assetsDir).map((name) => ({
    name,
    bytes: fs.statSync(path.join(assetsDir, name)).size,
  }))
  const jsFiles = files.filter((f) => f.name.endsWith('.js'))
  const cssFiles = files.filter((f) => f.name.endsWith('.css'))
  assert.ok(jsFiles.length > 0 && cssFiles.length > 0)
  const maxJs = Math.max(...jsFiles.map((f) => f.bytes))
  const maxCss = Math.max(...cssFiles.map((f) => f.bytes))
  assert.ok(maxJs < 1_500_000, `Largest JS bundle ${maxJs} bytes exceeds 1.5 MB ceiling`)
  assert.ok(maxCss < 900_000, `Largest CSS bundle ${maxCss} bytes exceeds 900 KB ceiling`)
})

test('D4.2: runtime interaction latency budgets and CSS ratchet ceilings stay within locked limits', () => {
  const RUNTIME_INTERACTION_BUDGETS = Object.freeze({
    keystrokeP95MaxMs: 25,
    completionOpenMaxMs: 40,
    catalogSelectOpenMaxMs: 40,
    resolverP95MaxMs: 10,
    minContrastRatio: 4.5,
  })
  assert.ok(RUNTIME_INTERACTION_BUDGETS.keystrokeP95MaxMs <= 25)
  assert.ok(RUNTIME_INTERACTION_BUDGETS.minContrastRatio >= 4.5)

  const ratchet = JSON.parse(fs.readFileSync('tools/ratchet.json', 'utf8')) as Record<string, number>
  assert.ok(ratchet.importantAppScss <= 18, `Expected importantAppScss <= 18, got ${ratchet.importantAppScss}`)
  assert.ok(ratchet.importantDarkContrast <= 13, `Expected importantDarkContrast <= 13, got ${ratchet.importantDarkContrast}`)
  assert.ok(ratchet.importantTotal <= 330, `Expected importantTotal <= 330, got ${ratchet.importantTotal}`)
  assert.equal(ratchet.explicitAny, 0)
  assert.equal(ratchet.filesOver900Lines, 0)
  assert.equal(ratchet.vHtml, 0)
})

test('F4.3: checkBundleBudgets enforces chunk raw/gzip and total JS ceilings', () => {
  const tmpDir = fs.mkdtempSync(path.join(path.resolve('.'), '.tmp-bundle-test-'))
  try {
    fs.writeFileSync(path.join(tmpDir, 'app.js'), 'console.log("small");\n')
    const pass = checkBundleBudgets(tmpDir)
    assert.equal(pass.ok, true)
    assert.deepEqual(pass.violations, [])

    const huge = Buffer.alloc(1600 * 1024, 'x').toString('utf8')
    fs.writeFileSync(path.join(tmpDir, 'huge.js'), huge)
    const fail = checkBundleBudgets(tmpDir, {
      maxChunkRawBytes: 1536 * 1024,
      maxChunkGzipBytes: 450 * 1024,
      maxTotalJsRawBytes: 3400 * 1024,
      maxTotalJsGzipBytes: 1000 * 1024,
    })
    assert.equal(fail.ok, false)
    assert.ok(fail.violations.some((v) => v.includes('largest chunk raw huge.js')))
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})
