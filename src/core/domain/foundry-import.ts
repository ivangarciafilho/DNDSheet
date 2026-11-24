import { isPlainRecord } from './file-payload-guard.ts'
import {
  addParsedActionOrAttack,
  deepStripDangerousKeys,
  normalizeSize,
  parseCrTier,
  parseHpDice,
  parseSensesEntries,
  parseSpeedEntries,
  resolveSkillEntry,
  sanitizeImportText,
  splitCommaList,
  type ImportAbilityCategory,
} from './importer-utils.ts'
import { defaultMonster } from './monster-defaults.ts'
import type { DndStat, Monster } from './types.ts'
import { migrateMonsterSchema } from '../usecases/MigrateMonsterSchema.ts'

export interface OfflineImportSuccess {
  ok: true
  source: 'foundry' | 'homebrewery' | 'improved-initiative'
  monster: Monster
  warnings: string[]
}

export interface OfflineImportFailure {
  ok: false
  error: string
}

export type OfflineImportResult = OfflineImportSuccess | OfflineImportFailure

export function looksLikeFoundryActor(raw: unknown): raw is Record<string, unknown> {
  if (!isPlainRecord(raw)) return false
  return raw.type === 'npc' && (isPlainRecord(raw.system) || isPlainRecord(raw.data))
}

const STAT_KEYS: ReadonlyArray<[DndStat, string]> = [
  ['STR', 'str'],
  ['DEX', 'dex'],
  ['CON', 'con'],
  ['INT', 'int'],
  ['WIS', 'wis'],
  ['CHA', 'cha'],
]

const FOUNDRY_SKILLS: Record<string, string> = {
  acr: 'Acrobatics',
  ani: 'Animal Handling',
  arc: 'Arcana',
  ath: 'Athletics',
  dec: 'Deception',
  his: 'History',
  ins: 'Insight',
  itm: 'Intimidation',
  inv: 'Investigation',
  med: 'Medicine',
  nat: 'Nature',
  prc: 'Perception',
  prf: 'Performance',
  per: 'Persuasion',
  rel: 'Religion',
  slt: 'Sleight of Hand',
  ste: 'Stealth',
  sur: 'Survival',
}

function extractTraitList(val: unknown): string[] {
  if (Array.isArray(val)) return val.map((x) => sanitizeImportText(String(x))).filter(Boolean)
  if (isPlainRecord(val)) {
    const out = Array.isArray(val.value) ? val.value.map((x) => sanitizeImportText(String(x))).filter(Boolean) : []
    if (typeof val.custom === 'string' && val.custom.trim()) out.push(...splitCommaList(val.custom))
    return out
  }
  return splitCommaList(val)
}

export function importFoundryActor(raw: unknown): OfflineImportResult {
  if (!looksLikeFoundryActor(raw)) {
    return { ok: false, error: 'Payload is not a valid Foundry VTT 5e NPC Actor JSON.' }
  }
  const warnings: string[] = []
  const clean = deepStripDangerousKeys(raw, warnings) as Record<string, unknown>
  const sys = (isPlainRecord(clean.system) ? clean.system : clean.data) as Record<string, unknown>

  const monster = defaultMonster()
  monster.name = sanitizeImportText(clean.name) || 'Foundry NPC'

  const abilities = isPlainRecord(sys.abilities) ? sys.abilities : {}
  for (const [stat, key] of STAT_KEYS) {
    const entry = abilities[key]
    if (isPlainRecord(entry) && typeof entry.value === 'number' && Number.isFinite(entry.value)) {
      monster.stats[stat] = Math.max(1, Math.min(30, Math.round(entry.value)))
    }
  }

  const attrs = isPlainRecord(sys.attributes) ? sys.attributes : {}
  const acObj = isPlainRecord(attrs.ac) ? attrs.ac : {}
  if (typeof acObj.value === 'number' && Number.isFinite(acObj.value)) monster.AC = Math.max(1, Math.round(acObj.value))
  if (typeof acObj.calc === 'string' && acObj.calc && acObj.calc !== 'flat') monster.ACType = sanitizeImportText(acObj.calc)

  const hpObj = isPlainRecord(attrs.hp) ? attrs.hp : {}
  const hpMax = typeof hpObj.max === 'number' && Number.isFinite(hpObj.max) ? Math.max(1, Math.round(hpObj.max)) : 10
  monster.HP = parseHpDice(hpObj.formula, hpMax)

  const move = isPlainRecord(attrs.movement) ? attrs.movement : {}
  const speeds: string[] = []
  for (const mode of ['walk', 'fly', 'swim', 'climb', 'burrow'] as const) {
    const dist = move[mode]
    if (typeof dist === 'number' && dist > 0) {
      speeds.push(`${mode} ${dist} ft.${mode === 'fly' && move.hover ? ' (hover)' : ''}`)
    }
  }
  if (speeds.length) monster.speeds = parseSpeedEntries(speeds)

  const details = isPlainRecord(sys.details) ? sys.details : {}
  const crTier = parseCrTier(details.cr)
  monster.CR = crTier.index
  monster.proficiency = crTier.proficiency
  if (typeof details.alignment === 'string') monster.alignment = sanitizeImportText(details.alignment)
  const typeObj = isPlainRecord(details.type) ? details.type : {}
  if (typeof typeObj.value === 'string' && typeObj.value.trim()) monster.type = sanitizeImportText(typeObj.value)
  else if (typeof details.type === 'string' && details.type.trim()) monster.type = sanitizeImportText(details.type)

  const traits = isPlainRecord(sys.traits) ? sys.traits : {}
  monster.size = normalizeSize(traits.size)
  monster.resistances = extractTraitList(traits.dr)
  monster.immunities = extractTraitList(traits.di)
  monster.vulnerabilities = extractTraitList(traits.dv)
  monster.conditions = extractTraitList(traits.ci)
  const langs = extractTraitList(traits.languages)
  if (langs.length) monster.languages = langs.join(', ')
  if (isPlainRecord(traits.senses)) {
    const sensesArr: string[] = []
    for (const sKey of ['darkvision', 'blindsight', 'tremorsense', 'truesight'] as const) {
      const val = traits.senses[sKey]
      if (typeof val === 'number' && val > 0) sensesArr.push(`${sKey} ${val} ft.`)
    }
    if (typeof traits.senses.special === 'string' && traits.senses.special.trim()) {
      sensesArr.push(sanitizeImportText(traits.senses.special))
    }
    parseSensesEntries(monster, sensesArr)
  }

  const skills = isPlainRecord(sys.skills) ? sys.skills : {}
  for (const [k, rawSk] of Object.entries(skills)) {
    if (!isPlainRecord(rawSk) || !rawSk.value) continue
    const skillName = FOUNDRY_SKILLS[k.toLowerCase()] ?? k
    const entry = resolveSkillEntry(skillName, typeof rawSk.total === 'number' ? rawSk.total : undefined)
    if (entry) {
      entry.expertise = Number(rawSk.value) >= 2
      monster.skills.push(entry)
    }
  }

  const items = Array.isArray(clean.items) ? clean.items : []
  for (const rawItem of items) {
    if (!isPlainRecord(rawItem)) continue
    const itemName = sanitizeImportText(rawItem.name)
    const itemSys = (isPlainRecord(rawItem.system) ? rawItem.system : isPlainRecord(rawItem.data) ? rawItem.data : {}) as Record<string, unknown>
    const descObj = isPlainRecord(itemSys.description) ? itemSys.description : {}
    const desc = sanitizeImportText(descObj.value ?? itemSys.description)
    const act = isPlainRecord(itemSys.activation) ? String(itemSys.activation.type ?? '').toLowerCase() : ''

    let category: ImportAbilityCategory = 'trait'
    if (act === 'reaction') category = 'reaction'
    else if (act === 'legendary') category = 'legendary'
    else if (act === 'mythic') category = 'mythic'
    else if (act === 'bonus') category = 'bonus'
    else if (act === 'action' || rawItem.type === 'weapon') category = 'action'
    addParsedActionOrAttack(monster, itemName, desc, category)
  }

  return { ok: true, source: 'foundry', monster: migrateMonsterSchema(monster), warnings }
}
