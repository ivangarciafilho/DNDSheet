import { v4 as uuidv4 } from 'uuid'
import { CR, getCrByNumber, getCrByString, type CrTier } from './cr-tables.ts'
import { isPlainRecord, stripDangerousKeys } from './file-payload-guard.ts'
import { defaultAction, defaultAttack, defaultReaction, defaultTrait } from './monster-defaults.ts'
import {
  parseOpen5eActionHeader,
  parseOpen5eAttackDamage,
  parseOpen5eAttackHeader,
  parseOpen5eLegendaryCost,
} from './open5e-parse.ts'
import type { DndStat, Monster, MonsterSkill, MonsterSpeed } from './types.ts'

export type ImportAbilityCategory = 'trait' | 'action' | 'bonus' | 'reaction' | 'legendary' | 'mythic'

const STAT_LIST: readonly DndStat[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

const SKILL_TABLE: ReadonlyArray<{ key: string; stat: DndStat; label: string }> = [
  { key: 'ACROBATICS', stat: 'DEX', label: 'Acrobatics' },
  { key: 'ANIMAL_HANDLING', stat: 'WIS', label: 'Animal Handling' },
  { key: 'ARCANA', stat: 'INT', label: 'Arcana' },
  { key: 'ATHLETICS', stat: 'STR', label: 'Athletics' },
  { key: 'DECEPTION', stat: 'CHA', label: 'Deception' },
  { key: 'HISTORY', stat: 'INT', label: 'History' },
  { key: 'INSIGHT', stat: 'WIS', label: 'Insight' },
  { key: 'INTIMIDATION', stat: 'CHA', label: 'Intimidation' },
  { key: 'INVESTIGATION', stat: 'INT', label: 'Investigation' },
  { key: 'MEDICINE', stat: 'WIS', label: 'Medicine' },
  { key: 'NATURE', stat: 'INT', label: 'Nature' },
  { key: 'PERCEPTION', stat: 'WIS', label: 'Perception' },
  { key: 'PERFORMANCE', stat: 'CHA', label: 'Performance' },
  { key: 'PERSUASION', stat: 'CHA', label: 'Persuasion' },
  { key: 'RELIGION', stat: 'INT', label: 'Religion' },
  { key: 'SLEIGHT_OF_HAND', stat: 'DEX', label: 'Sleight of Hand' },
  { key: 'STEALTH', stat: 'DEX', label: 'Stealth' },
  { key: 'SURVIVAL', stat: 'WIS', label: 'Survival' },
]

export function deepStripDangerousKeys(value: unknown, warnings?: string[]): unknown {
  if (Array.isArray(value)) return value.map((item) => deepStripDangerousKeys(item, warnings))
  if (!isPlainRecord(value)) return value
  for (const key of Object.keys(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      warnings?.push(`Stripped unsafe key "${key}".`)
    }
  }
  const clean = stripDangerousKeys(value)
  if (!clean) return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(clean)) {
    out[k] = deepStripDangerousKeys(v, warnings)
  }
  return out
}

export function sanitizeImportText(raw: unknown): string {
  if (typeof raw !== 'string') return ''
  return raw
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function parseCrTier(raw: unknown): CrTier {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return getCrByNumber(Math.max(0, raw))
  }
  const text = String(raw ?? '').trim()
  const lead = text.match(/^(\d+\/\d+|\d+(?:\.\d+)?)/)?.[1] ?? ''
  const exact = getCrByString(lead)
  if (exact) return exact
  const n = Number(lead)
  return Number.isFinite(n) && n >= 0 ? getCrByNumber(n) : CR[0]
}

export function normalizeSize(raw: unknown): string {
  const s = String(raw ?? '').trim().toLowerCase()
  const map: Record<string, string> = {
    tiny: 'Tiny',
    sm: 'Small',
    small: 'Small',
    med: 'Medium',
    medium: 'Medium',
    lg: 'Large',
    large: 'Large',
    huge: 'Huge',
    grg: 'Gargantuan',
    gargantuan: 'Gargantuan',
  }
  return map[s] ?? 'Medium'
}

export function parseHpDice(formula: unknown, fallbackMax = 10): { HD: number; type: number; modifier: number } {
  const m = String(formula ?? '').match(/(\d+)\s*d\s*(\d+)(?:\s*([+-])\s*(\d+))?/i)
  if (m) {
    const mod = m[3] && m[4] ? (m[3] === '-' ? -parseInt(m[4], 10) : parseInt(m[4], 10)) : 0
    return { HD: Math.max(1, parseInt(m[1], 10)), type: Math.max(4, parseInt(m[2], 10)), modifier: mod }
  }
  return { HD: Math.max(1, Math.round((fallbackMax || 10) / 5)), type: 8, modifier: 0 }
}

export function parseSpeedEntries(entries: readonly string[]): MonsterSpeed[] {
  const out: MonsterSpeed[] = []
  for (const raw of entries) {
    const clean = raw.trim()
    if (!clean) continue
    const hover = /hover/i.test(clean)
    const numMatch = clean.match(/(\d+)/)
    if (!numMatch) continue
    const speed = parseInt(numMatch[1], 10)
    const typeMatch = clean.match(/^(walk|fly|swim|climb|burrow)\b/i)
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'walk'
    out.push({ id: uuidv4(), type, speed, note: '', ...(hover ? { hover: true } : {}) })
  }
  return out.length ? out : [{ id: uuidv4(), type: 'walk', speed: 30, note: '' }]
}

export function parseSensesEntries(monster: Monster, entries: readonly string[]): void {
  const notes: string[] = []
  for (const raw of entries) {
    const clean = raw.trim()
    if (!clean || /^passive perception\s+\d+$/i.test(clean)) continue
    const m = clean.match(/^(darkvision|blindsight|tremorsense|truesight)\s+(\d+)/i)
    if (m) {
      const key = m[1].toLowerCase() as keyof Monster['senses']
      monster.senses[key] = parseInt(m[2], 10)
    } else {
      notes.push(clean)
    }
  }
  if (notes.length) monster.sensesNotes = notes.join(', ')
}

export function resolveSkillEntry(name: string, overrideValue?: number): MonsterSkill | null {
  const low = name.trim().toLowerCase()
  const found = SKILL_TABLE.find((s) => s.label.toLowerCase() === low || s.key.toLowerCase() === low)
  if (!found) return null
  return {
    key: found.key,
    skill: { stat: found.stat, label: found.label },
    proficient: overrideValue === undefined,
    expertise: false,
    override: overrideValue !== undefined,
    overrideValue: overrideValue ?? 0,
  }
}

export function parseSavingThrowsLine(monster: Monster, text: string): void {
  for (const part of text.split(',')) {
    const m = part.trim().match(/^(STR|DEX|CON|INT|WIS|CHA|Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s*([+-]\d+)/i)
    if (!m) continue
    const key = m[1].slice(0, 3).toUpperCase() as DndStat
    if (!STAT_LIST.includes(key)) continue
    monster.saves[key] = { proficient: true, override: true, overrideValue: parseInt(m[2], 10) }
  }
}

export function splitCommaList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((x) => sanitizeImportText(String(x))).filter(Boolean)
  if (typeof raw !== 'string') return []
  return raw
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function addParsedActionOrAttack(
  monster: Monster,
  rawName: string,
  rawDesc: string,
  category: ImportAbilityCategory,
): void {
  const name = sanitizeImportText(rawName)
  const desc = sanitizeImportText(rawDesc)
  if (!name && !desc) return

  if (category === 'trait') {
    const hdr = parseOpen5eActionHeader(name, desc)
    const trait = defaultTrait()
    trait.name = hdr.name || name
    if (hdr.recharge) trait.rechargeTagOverride = hdr.recharge
    if (hdr.limitedUseCount > 0) trait.limitedUse = { count: hdr.limitedUseCount, rate: hdr.limitedUseRate || 'DAY' }
    trait.description = desc
    monster.traits.push(trait)
    return
  }

  if (category === 'reaction') {
    const reaction = defaultReaction()
    reaction.name = name
    const trigMatch = desc.match(/Trigger:\s*([\s\S]*?)(?:\s*Response:\s*([\s\S]*))?$/i)
    if (trigMatch) {
      reaction.trigger = trigMatch[1].trim()
      reaction.description = (trigMatch[2] ?? '').trim() || desc
    } else {
      reaction.description = desc
    }
    monster.reactions.push(reaction)
    return
  }

  let effectiveName = name
  let legCost = 1
  if (category === 'legendary') {
    const leg = parseOpen5eLegendaryCost(name)
    effectiveName = leg.baseName
    legCost = leg.cost
  }

  const hdr = parseOpen5eActionHeader(effectiveName, desc)
  const atkHeader = parseOpen5eAttackHeader(desc)
  if (atkHeader && category !== 'mythic') {
    const atk = defaultAttack()
    atk.name = hdr.name || effectiveName
    atk.distance = atkHeader.distance
    atk.kind = atkHeader.kind
    atk.modifier.override = true
    atk.modifier.overrideValue = atkHeader.toHit
    atk.range = { reach: atkHeader.reach, standard: atkHeader.standard, long: atkHeader.long }
    atk.legendaryOnly = category === 'legendary'
    const atkDmg = parseOpen5eAttackDamage(desc)
    if (atkDmg) {
      atk.damage.count = atkDmg.count
      atk.damage.dice = atkDmg.dice
      atk.damage.type = atkDmg.type
      if (atkDmg.modifier !== null) {
        atk.damage.modifier.override = true
        atk.damage.modifier.overrideValue = atkDmg.modifier
      }
      atk.additionalDamage = atkDmg.additionalDamage.map((e) => ({ ...e, id: uuidv4() }))
    }
    atk.description = desc
    monster.attacks.push(atk)
    return
  }

  const action = defaultAction()
  action.name = hdr.name || effectiveName
  action.recharge = hdr.recharge
  if (hdr.limitedUseCount > 0) action.limitedUse = { count: hdr.limitedUseCount, rate: hdr.limitedUseRate || 'DAY' }
  action.bonusAction = category === 'bonus' || hdr.bonusAction
  action.legendaryOnly = category === 'legendary' || category === 'mythic'
  action.description = desc
  monster.actions.push(action)

  if (category === 'legendary') {
    monster.legendaryActions.actions.push({ actionId: action.id, cost: legCost })
    if (monster.legendaryActions.count === 0) monster.legendaryActions.count = 3
  } else if (category === 'mythic') {
    monster.mythicActions.actions.push({ actionId: action.id, cost: legCost })
  }
}
