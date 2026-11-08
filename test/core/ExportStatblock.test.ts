import test from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  exportToMarkdown,
  exportToPlainText,
  exportToHtml,
  exportToFoundryActor,
  exportCharacterToMarkdown,
  exportCharacterToPlainText,
  exportCharacterToJson,
} from '../../src/core/usecases/ExportStatblock.ts'
import { defaultCharacterActor } from '../../src/core/domain/types.ts'
import type { Monster } from '../../src/core/domain/types.ts'
import { migrateMonsterSchema } from '../../src/core/usecases/MigrateMonsterSchema.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')
const templatesDir = path.join(projectRoot, 'src/data/templates/monsters')

test('ExportStatblock - Markdown export format', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(templatesDir, 'Knight.5emm.json'), 'utf8'))
  const knight = migrateMonsterSchema(raw)

  const md = exportToMarkdown(knight)

  assert.ok(md.includes('## Knight'))
  assert.ok(md.includes('**Armor Class** 18'))
  assert.ok(md.includes('**Hit Points** 52 (8d8 + 16)'))
  assert.ok(md.includes('|STR|DEX|CON|INT|WIS|CHA|'))
  assert.ok(md.includes('### Actions'))
  assert.ok(md.includes('Greatsword.'))
  assert.ok(md.includes('Brave.'))
})

test('ExportStatblock - structured abilities use the 2024 text grammar while legacy output stays unchanged', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(templatesDir, 'Knight.5emm.json'), 'utf8'))
  const knight = migrateMonsterSchema(raw)
  knight.actions.push({
    id: 'structured-soul-barrage',
    name: 'Soul Barrage',
    description: 'Its radiant force lingers.',
    recharge: '',
    actionType: 'spell_attack',
    attackBonus: 7,
    attackReach: 'ranged',
    attackSource: 'spell',
    targeting: {
      count: 3,
      countMode: 'up_to',
      kind: 'creatures',
      range: { distance: 120, unit: 'ft', relation: 'within', origin: 'you' },
    },
    outcomes: [{
      trigger: 'hit',
      effects: [{ kind: 'damage', formula: '1d10', damageType: 'radiant' }],
    }],
    legendaryOnly: false,
    limitedUse: { count: 0, rate: '' },
    stat: 'none',
    save: { override: false, overrideValue: 0 },
    range: '',
    effects: [],
    customPreamble: false,
    bonusAction: false,
    crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true },
  })

  const markdown2024 = exportToMarkdown(knight, '2024')
  const markdown2014 = exportToMarkdown(knight, '2014')
  const plainText2024 = exportToPlainText(knight, '2024')

  assert.ok(markdown2024.includes('***Soul Barrage.*** Ranged Attack Roll: +7, up to three creatures within 120 ft. of you. Hit: 5 (1d10) Radiant damage. Its radiant force lingers.'))
  assert.ok(markdown2014.includes('***Soul Barrage.*** Its radiant force lingers.'), '2014 export keeps the authored legacy prose')
  assert.ok(!markdown2014.includes('Ranged Attack Roll: +7'))
  assert.ok(plainText2024.includes('Ranged Attack Roll: +7, up to three creatures within 120 ft. of you. Hit: 5 (1d10) Radiant damage.'))
})

test('ExportStatblock - Plain Text export format', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(templatesDir, 'Knight.5emm.json'), 'utf8'))
  const knight = migrateMonsterSchema(raw)

  const text = exportToPlainText(knight)

  assert.ok(text.includes('Knight'))
  assert.ok(text.includes('Armor Class 18'))
  assert.ok(text.includes('Hit Points 52 (8d8 + 16)'))
  assert.ok(text.includes('----------------------------------------'))
  assert.strictEqual(text.includes('**Armor Class**'), false, 'Should strip markdown bold')
})

test('ExportStatblock - HTML snippet export format', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(templatesDir, 'Knight.5emm.json'), 'utf8'))
  const knight = migrateMonsterSchema(raw)

  const html = exportToHtml(knight)

  assert.ok(html.includes('<div class="dnd-statblock classic">'))
  assert.ok(html.includes('<h2 class="statblock-name">Knight</h2>'))
  assert.ok(html.includes('<hr class="statblock-divider" />'))
})

test('ExportStatblock - Foundry VTT Actor5e JSON structure', () => {
  const raw = JSON.parse(fs.readFileSync(path.join(templatesDir, 'Knight.5emm.json'), 'utf8'))
  const knight = migrateMonsterSchema(raw)

  const actor = exportToFoundryActor(knight)

  assert.strictEqual(actor.name, 'Knight')
  assert.strictEqual(actor.type, 'npc')
  assert.strictEqual(actor.system.abilities.str.value, 16)
  assert.strictEqual(actor.system.abilities.str.mod, 3)
  assert.strictEqual(actor.system.attributes.ac.value, 18)
  assert.strictEqual(actor.system.attributes.hp.value, 52)
  assert.ok(actor.items.length > 0)
  assert.strictEqual(actor.items[0].name, 'Greatsword')
})

test('ExportStatblock - CharacterActor Markdown, Plain Text, and JSON exports', () => {
  const hero = defaultCharacterActor()
  hero.name = 'Valeros Brightblade'
  hero.class = 'Paladin'
  hero.subclass = 'Oath of Devotion'
  hero.level = 7
  hero.features.push({
    id: 'feat-smite',
    name: 'Divine Smite',
    source: 'Paladin 2',
    description: 'Expend a spell slot to deal extra radiant damage.',
  })
  hero.inventory.push({
    id: 'item-sword',
    name: '+1 Longsword',
    quantity: 1,
    weight: 3,
  })

  hero.savingThrows = { WIS: true, CHA: true }
  hero.skills = { Athletics: { proficient: true, expertise: false }, Persuasion: { proficient: true, expertise: true } }
  hero.spellcasting = { ability: 'CHA' }
  hero.spells = [
    { id: 'sp-1', name: 'Bless', level: 1, prepared: true, notes: 'Concentration up to 1 min' },
    { id: 'sp-2', name: 'Shield of Faith', level: 1, prepared: false },
  ]

  // Markdown
  const md = exportCharacterToMarkdown(hero)
  assert.ok(md.includes('## Valeros Brightblade'))
  assert.ok(md.includes('Level 7 Oath of Devotion Paladin'))
  assert.ok(md.includes('|STR|DEX|CON|INT|WIS|CHA|'))
  assert.ok(md.includes('Divine Smite'))
  assert.ok(md.includes('+1 Longsword'))
  assert.ok(md.includes('**Saving Throws**'))
  assert.ok(md.includes('**Skills**'))
  assert.ok(md.includes('Athletics'))
  assert.ok(md.includes('Persuasion'))
  assert.ok(md.includes('**Spellcasting** Ability: CHA'))
  assert.ok(md.includes('### Prepared Spells'))
  assert.ok(md.includes('Bless'))

  // Plain Text
  const txt = exportCharacterToPlainText(hero)
  assert.ok(txt.includes('VALEROS BRIGHTBLADE'))
  assert.ok(txt.includes('Level 7 Oath of Devotion Paladin'))
  assert.ok(txt.includes('Divine Smite (Paladin 2):'))
  assert.ok(txt.includes('+1 Longsword (x1)'))
  assert.ok(txt.includes('Saving Throws:'))
  assert.ok(txt.includes('Skills:'))
  assert.ok(txt.includes('Spellcasting: Ability CHA'))
  assert.ok(txt.includes('PREPARED SPELLS:'))
  assert.ok(txt.includes('Bless'))

  // JSON
  const jsonStr = exportCharacterToJson(hero)
  const parsed = JSON.parse(jsonStr)
  assert.strictEqual(parsed.name, 'Valeros Brightblade')
  assert.strictEqual(parsed.class, 'Paladin')
  assert.strictEqual(parsed.features.length, 1)
  assert.strictEqual(parsed.spells.length, 2)
  assert.strictEqual(parsed.skills.Persuasion.expertise, true)
})

test('2024 action export puts cadence before identity and components before classification',()=>{
  const monster=migrateMonsterSchema(JSON.parse(fs.readFileSync(path.join(templatesDir,'Knight.5emm.json'),'utf8')))
  monster.actions=[{...monster.actions[0],name:'Mantle',recharge:'4–12',school:'Abjuration',spellLevel:'2nd Level',components:['V','S'],targeting:{kind:'allies'},description:'Keep authored effect.'}]
  const text=exportToMarkdown(monster, '2024')
  assert.ok(text.includes('Recharge 4–12 · Mantle (V, S).*** 2nd Level Abjuration.'),text)
  assert.equal((text.match(/\(V, S\)/g)||[]).length,1)
})

test('2024 structured attacks print the same automatic bonus as the sheet', () => {
  const monster = migrateMonsterSchema(JSON.parse(fs.readFileSync(path.join(templatesDir, 'Knight.5emm.json'), 'utf8')))
  const structured = (id: string, name: string, fields: Partial<Monster['actions'][number]>): Monster['actions'][number] => ({
    id, name, description: '', recharge: '', legendaryOnly: false, limitedUse: { count: 0, rate: '' }, stat: 'none',
    save: { override: false, overrideValue: 0 }, range: '', effects: [], customPreamble: false, bonusAction: false,
    crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: true },
    ...fields,
  })
  monster.actions = [
    structured('bow', 'Longbow Volley', { actionType: 'weapon_attack', attackSource: 'weapon', attackReach: 'ranged', targeting: { count: 1, kind: 'target' } }),
    structured('blade', 'Blade', { actionType: 'weapon_attack', attackSource: 'weapon', attackReach: 'melee', targeting: { count: 1, kind: 'target' } }),
    structured('rapier', 'Rapier', { attackSource: 'weapon', attackReach: 'melee', weaponAttackAbility: 'finesse', targeting: { count: 1, kind: 'target' } }),
    structured('javelin', 'Javelin', { attackSource: 'weapon', attackReach: 'ranged', weaponAttackAbility: 'thrown', targeting: { count: 1, kind: 'target' } }),
    structured('bolt', 'Bolt', { actionType: 'spell_attack', attackSource: 'spell', attackReach: 'ranged', targeting: { count: 1, kind: 'creature' } }),
  ]
  monster.spellcasting = { ...monster.spellcasting, attack: { override: true, overrideValue: 9 } }
  const text = exportToMarkdown(monster, '2024')
  assert.ok(text.includes('***Longbow Volley.*** Ranged Attack Roll: +2, one target.'), text)
  assert.ok(text.includes('***Blade.*** Melee Attack Roll: +5, one target.'), text)
  assert.ok(text.includes('***Bolt.*** Ranged Attack Roll: +9, one creature.'), text)
  assert.ok(text.includes('***Rapier.*** Melee Attack Roll: +5, one target.'), text)
  assert.ok(text.includes('***Javelin.*** Ranged Attack Roll: +5, one target.'), text)
})
