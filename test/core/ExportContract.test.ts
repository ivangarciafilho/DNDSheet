import test from 'node:test'
import assert from 'node:assert/strict'
import { defaultMonster } from '../../src/core/domain/types.ts'
import {
  EXPORT_CAPABILITIES,
  buildExportResult,
  detectMonsterExportOmissions,
  resolveSpellcastingPlacement,
} from '../../src/core/domain/export-contract.ts'
import {
  exportToHtml,
  exportToMarkdown,
  exportToPlainText,
} from '../../src/core/usecases/ExportStatblock.ts'

function createGrammarSampleMonster() {
  const m = defaultMonster()
  m.name = 'Veil Weaver'
  m.CR = 9
  m.proficiency = 4
  m.stats.INT = 18
  m.stats.CHA = 16
  m.bindings = { AC: { mode: 'formula', expr: '10 + DEX_MOD + 2' } }
  m.randomTables = [{ id: 'rt-1', title: 'Surge', dice: '1d4', rows: [] }]
  m.traits = [{ name: 'Arcane Ward', description: 'Maintains a 10 HP barrier.' }]
  m.actions = [
    {
      id: 'act-barrage',
      name: 'Soul Barrage',
      description: 'Hurls spectral shards.',
      recharge: '',
      legendaryOnly: false,
      limitedUse: { count: 0, rate: '' },
      stat: 'INT',
      save: { override: true, overrideValue: 16 },
      range: '120 ft.',
      effects: [
        {
          id: 'eff-1',
          name: 'Soul Barrage',
          type: 'save',
          saveStat: 'WIS',
          damage: { count: 4, dice: 8, type: 'necrotic', modifier: 0 },
          halfOnSuccess: true,
        },
      ],
      customPreamble: false,
      bonusAction: false,
      actionType: 'save',
      saveAbility: 'WIS',
      targeting: { count: 1, kind: 'creature', range: 120 },
      crAnnotation: {
        maxDamage: 18,
        maxSave: 16,
        maxModifier: 8,
        multitarget: false,
        ehpMultiplier: 1,
        ehpModifier: 0,
        acModifier: 0,
        include: true,
      },
    },
  ]
  m.reactions = [{ name: 'Counter Glyph', description: 'Interrupts a spell.' }]
  m.spellcasting = {
    ...m.spellcasting,
    enabled: true,
    stat: 'INT',
    class: 'Wizard',
    level: 5,
    slots: [4, 3, 2, 0, 0, 0, 0, 0, 0],
    standard: ['Fire Bolt', 'Veil', 'Counterspell'],
    atWill: [{ rate: 'DAY', count: 1, spells: ['Misty Step'] }],
    metamagic: {
      enabled: true,
      sorceryPoints: 4,
      refreshRate: 'long_rest',
      options: ['Subtle Spell'],
    },
  }
  return m
}

test('Export capabilities, dynamic omissions, and revision stamping work accurately (B4.5)', () => {
  assert.ok(EXPORT_CAPABILITIES.some((c) => c.id === '5emm_json' && c.lossless))
  assert.ok(EXPORT_CAPABILITIES.some((c) => c.id === 'html_snippet' && c.supportsGrammarCss))

  const m = createGrammarSampleMonster()
  assert.deepEqual(detectMonsterExportOmissions(m, '5emm_json'), [])

  const tioOmissions = detectMonsterExportOmissions(m, 'tarrasque_io')
  assert.ok(tioOmissions.some((o) => o.feature.includes('Formula Bindings')))
  assert.ok(tioOmissions.some((o) => o.feature.includes('Random Tables')))
  assert.ok(tioOmissions.some((o) => o.feature.includes('Multiclass / Metamagic')))

  const stamped = buildExportResult({
    monster: m,
    targetId: 'html_snippet',
    sourceDocumentId: 'doc-42',
    sourceRevision: 17,
    style: '2024',
    spellcastingPlacement: 'auto',
    content: exportToHtml(m, '2024'),
  })
  assert.equal(stamped.sourceDocumentId, 'doc-42')
  assert.equal(stamped.sourceRevision, 17)
  assert.equal(stamped.blockingLintErrors.length, 0)
})

test('2024 Plain Text and HTML exports include check rows, Veil spellcasting, metamagic, and .sb-plate grammar CSS (B4.3, B4.4)', () => {
  const m = createGrammarSampleMonster()
  const spells = {
    Veil: {
      name: 'Veil',
      level: 3,
      school: 'Illusion',
      castingTime: '1 action',
      range: 'Self',
      components: ['V', 'S'],
      duration: '1 hour',
      description: 'Wreathes the caster in illusion.',
      concentration: true,
      ritual: false,
    },
  }

  const md = exportToMarkdown(m, '2024', { spells })
  assert.ok(md.includes('***Search (10/+0'))
  assert.ok(md.includes('***Study (14/+4'))
  assert.ok(md.includes('***Influence (10/+0'))
  assert.ok(md.includes('***Hide (10/+0'))
  assert.ok(md.includes('**Sorcery Points** 4'))
  assert.ok(md.includes('Veil'))
  assert.ok(md.includes('Misty Step'))
  assert.ok(md.includes('Soul Barrage'))

  const txt = exportToPlainText(m, '2024', { spells })
  assert.ok(txt.includes('Search (10/+0'))
  assert.ok(txt.includes('Study (14/+4'))
  assert.ok(txt.includes('Influence (10/+0'))
  assert.ok(txt.includes('Hide (10/+0'))
  assert.ok(txt.includes('Spellcasting.'))
  assert.ok(txt.includes('Veil'))
  assert.ok(txt.includes('Soul Barrage'))

  const html = exportToHtml(m, '2024', { spells })
  assert.ok(html.includes('.sb-plate {'))
  assert.ok(html.includes('<div class="class-spellcasting sb-plate">'))
  assert.ok(html.includes('<div class="innate-spellcasting sb-plate">'))
  assert.ok(html.includes('Search (10/+0'))
  assert.ok(html.includes('Veil'))
  assert.ok(html.includes('Soul Barrage'))
})

test('D-02 spellcastingPlacement resolves defaults per surface and reorders Markdown export sections', () => {
  assert.equal(resolveSpellcastingPlacement('auto', 'web'), 'with_traits')
  assert.equal(resolveSpellcastingPlacement('auto', 'export'), 'after_actions')
  assert.equal(resolveSpellcastingPlacement('before_actions', 'web'), 'before_actions')
  assert.equal(resolveSpellcastingPlacement('with_traits', 'export'), 'with_traits')

  const m = createGrammarSampleMonster()
  const mdWithTraits = exportToMarkdown(m, '2024', { spellcastingPlacement: 'with_traits' })
  assert.ok(mdWithTraits.indexOf('***Spellcasting.***') < mdWithTraits.indexOf('### Actions'))

  const mdBeforeActions = exportToMarkdown(m, '2024', { spellcastingPlacement: 'before_actions' })
  assert.ok(mdBeforeActions.indexOf('***Spellcasting.***') < mdBeforeActions.indexOf('### Actions'))

  const mdAfterActions = exportToMarkdown(m, '2024', { spellcastingPlacement: 'after_actions' })
  assert.ok(mdAfterActions.indexOf('### Actions') < mdAfterActions.indexOf('***Spellcasting.***'))
  assert.ok(mdAfterActions.indexOf('***Spellcasting.***') < mdAfterActions.indexOf('### Reactions'))
})
