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
} from './importer-utils.ts'
import { defaultMonster } from './monster-defaults.ts'
import type { DndStat } from './types.ts'
import type { OfflineImportResult } from './foundry-import.ts'
import { migrateMonsterSchema } from '../usecases/MigrateMonsterSchema.ts'

function extractCreatureRecord(clean: Record<string, unknown>): Record<string, unknown> | null {
  if (Array.isArray(clean.Creatures) && clean.Creatures.length > 0) {
    const key = `Creatures.${String(clean.Creatures[0])}`
    if (isPlainRecord(clean[key])) return clean[key] as Record<string, unknown>
  }
  if (isPlainRecord(clean.Abilities) && Array.isArray(clean.Actions)) return clean
  return null
}

export function looksLikeImprovedInit(raw: unknown): raw is Record<string, unknown> {
  if (!isPlainRecord(raw)) return false
  if (Array.isArray(raw.Creatures) && raw.Creatures.some((k) => isPlainRecord(raw[`Creatures.${String(k)}`]))) return true
  return typeof raw.Name === 'string' && isPlainRecord(raw.Abilities) && Array.isArray(raw.Actions)
}

const II_STATS: ReadonlyArray<[DndStat, string]> = [
  ['STR', 'Str'],
  ['DEX', 'Dex'],
  ['CON', 'Con'],
  ['INT', 'Int'],
  ['WIS', 'Wis'],
  ['CHA', 'Cha'],
]

export function importImprovedInit(raw: unknown): OfflineImportResult {
  if (!looksLikeImprovedInit(raw)) {
    return { ok: false, error: 'Payload is not a valid Improved Initiative creature JSON.' }
  }
  const warnings: string[] = []
  const clean = deepStripDangerousKeys(raw, warnings) as Record<string, unknown>
  const src = extractCreatureRecord(clean)
  if (!src) return { ok: false, error: 'Missing creature payload in Improved Initiative bundle.' }

  const monster = defaultMonster()
  monster.name = sanitizeImportText(src.Name) || 'Improved Initiative Creature'

  const typeStr = sanitizeImportText(src.Type)
  if (typeStr) {
    const tm = typeStr.match(/^(Tiny|Small|Medium|Large|Huge|Gargantuan)\s+([^,]+)(?:,\s*(.+))?$/i)
    if (tm) {
      monster.size = normalizeSize(tm[1])
      monster.type = tm[2].trim()
      if (tm[3]) monster.alignment = tm[3].trim()
    } else {
      monster.type = typeStr
    }
  }

  const abilities = isPlainRecord(src.Abilities) ? src.Abilities : {}
  for (const [stat, key] of II_STATS) {
    const v = abilities[key]
    if (typeof v === 'number' && Number.isFinite(v)) monster.stats[stat] = Math.max(1, Math.min(30, Math.round(v)))
  }

  if (isPlainRecord(src.AC)) {
    if (typeof src.AC.Value === 'number') monster.AC = Math.max(1, Math.round(src.AC.Value))
    if (typeof src.AC.Notes === 'string') monster.ACType = sanitizeImportText(src.AC.Notes).replace(/^\((.+)\)$/, '$1')
  }
  if (isPlainRecord(src.HP)) {
    const hpMax = typeof src.HP.Value === 'number' ? Math.max(1, Math.round(src.HP.Value)) : 10
    monster.HP = parseHpDice(src.HP.Notes, hpMax)
  }

  if (typeof src.InitiativeAdvantage === 'boolean') {
    monster.initiativeConfig = {
      ...(monster.initiativeConfig ?? {}),
      advantage: src.InitiativeAdvantage,
    }
  }
  if (Array.isArray(src.Speed)) monster.speeds = parseSpeedEntries(src.Speed.map(String))
  if (Array.isArray(src.Senses)) parseSensesEntries(monster, src.Senses.map(String))
  if (Array.isArray(src.Languages)) monster.languages = src.Languages.map((x) => sanitizeImportText(x)).filter(Boolean).join(', ')
  const crTier = parseCrTier(src.Challenge)
  monster.CR = crTier.index
  monster.proficiency = crTier.proficiency

  monster.vulnerabilities = splitCommaList(src.DamageVulnerabilities)
  monster.resistances = splitCommaList(src.DamageResistances)
  monster.immunities = splitCommaList(src.DamageImmunities)
  monster.conditions = splitCommaList(src.ConditionImmunities)

  if (Array.isArray(src.Saves)) {
    for (const item of src.Saves) {
      if (!isPlainRecord(item) || typeof item.Name !== 'string') continue
      const key = item.Name.slice(0, 3).toUpperCase() as DndStat
      if (key in monster.saves && typeof item.Modifier === 'number') {
        monster.saves[key] = { proficient: true, override: true, overrideValue: Math.round(item.Modifier) }
      }
    }
  }
  if (Array.isArray(src.Skills)) {
    for (const item of src.Skills) {
      if (!isPlainRecord(item) || typeof item.Name !== 'string') continue
      const sk = resolveSkillEntry(item.Name, typeof item.Modifier === 'number' ? Math.round(item.Modifier) : undefined)
      if (sk) monster.skills.push(sk)
    }
  }

  const pushNamed = (list: unknown, cat: 'trait' | 'action' | 'reaction' | 'legendary' | 'mythic') => {
    if (!Array.isArray(list)) return
    for (const item of list) {
      if (!isPlainRecord(item)) continue
      addParsedActionOrAttack(monster, sanitizeImportText(item.Name), sanitizeImportText(item.Content), cat)
    }
  }
  pushNamed(src.Traits, 'trait')
  pushNamed(src.Actions, 'action')
  pushNamed(src.Reactions, 'reaction')
  pushNamed(src.LegendaryActions, 'legendary')
  pushNamed(src.MythicActions, 'mythic')

  return { ok: true, source: 'improved-initiative', monster: migrateMonsterSchema(monster), warnings }
}
