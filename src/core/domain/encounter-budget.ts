import { stripDangerousKeys, isPlainRecord } from './file-payload-guard.ts'
import type { Combatant } from '../usecases/CombatTracker.ts'

export type EncounterRuleset = '2014' | '2024'

export type EncounterDifficulty =
  | 'trivial'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'deadly'
  | 'low'
  | 'moderate'
  | 'high'

export interface EncounterCreatureEntry {
  name: string
  cr?: number | string
  count?: number
  xp?: number
}

export interface EncounterThresholds {
  low: number
  moderate: number
  high: number
  deadly?: number
}

export interface EncounterBudgetResult {
  ruleset: EncounterRuleset
  partySize: number
  partyLevels: number[]
  monsterCount: number
  rawXp: number
  multiplier: number
  adjustedXp: number
  xpPerCharacter: number
  difficulty: EncounterDifficulty
  thresholds: EncounterThresholds
  warnings: string[]
}

export interface EncounterRosterV1 {
  schema: 'dndsheet.encounter.v1'
  title: string
  exportedAt: string
  ruleset: EncounterRuleset
  partySize: number
  partyLevel: number
  budget: EncounterBudgetResult
  combatants: Combatant[]
}

// 5e DMG CR 0 combatant XP = 10
const CR_XP_MAP: Record<string, number> = {
  '0': 10,
  '1/8': 25,
  '0.125': 25,
  '1/4': 50,
  '0.25': 50,
  '1/2': 100,
  '0.5': 100,
  '1': 200,
  '2': 450,
  '3': 700,
  '4': 1100,
  '5': 1800,
  '6': 2300,
  '7': 2900,
  '8': 3900,
  '9': 5000,
  '10': 5900,
  '11': 7200,
  '12': 8400,
  '13': 10000,
  '14': 11500,
  '15': 13000,
  '16': 15000,
  '17': 18000,
  '18': 20000,
  '19': 22000,
  '20': 25000,
  '21': 33000,
  '22': 41000,
  '23': 50000,
  '24': 62000,
  '25': 75000,
  '26': 90000,
  '27': 105000,
  '28': 120000,
  '29': 135000,
  '30': 155000,
}

const THRESHOLDS_2014: ReadonlyArray<readonly [number, number, number, number]> = [
  [25, 50, 75, 100],
  [50, 100, 150, 200],
  [75, 150, 225, 400],
  [125, 250, 375, 500],
  [250, 500, 750, 1100],
  [300, 600, 900, 1400],
  [350, 750, 1100, 1700],
  [450, 900, 1400, 2100],
  [550, 1100, 1600, 2400],
  [600, 1200, 1900, 2800],
  [800, 1600, 2400, 3600],
  [1000, 2000, 3000, 4500],
  [1100, 2200, 3400, 5100],
  [1250, 2500, 3800, 5700],
  [1400, 2800, 4300, 6400],
  [1600, 3200, 4800, 7200],
  [2000, 3900, 5900, 8800],
  [2100, 4200, 6300, 9500],
  [2400, 4900, 7300, 10900],
  [2800, 5700, 8500, 12700],
]

const BUDGETS_2024: ReadonlyArray<readonly [number, number, number]> = [
  [50, 75, 100],
  [100, 150, 200],
  [150, 225, 400],
  [250, 375, 500],
  [500, 750, 1100],
  [600, 1000, 1400],
  [750, 1300, 1700],
  [1000, 1700, 2100],
  [1300, 2000, 2600],
  [1600, 2300, 3100],
  [1900, 2900, 4100],
  [2200, 3700, 4700],
  [2600, 4200, 5400],
  [2900, 4900, 6200],
  [3300, 5400, 7800],
  [3800, 6100, 9800],
  [4500, 7200, 11700],
  [5000, 8700, 14200],
  [5500, 10700, 17200],
  [6400, 13200, 22000],
]

const MULTIPLIER_LADDER = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5] as const

export function crToXp(cr: number | string | undefined): number {
  if (cr === undefined || cr === null) return 0
  const key = String(cr).trim()
  if (key in CR_XP_MAP) return CR_XP_MAP[key]
  const num = Number(key)
  if (!Number.isFinite(num) || num <= 0) return 0
  const rounded = String(Math.min(30, Math.round(num)))
  return CR_XP_MAP[rounded] ?? 0
}

function resolveMultiplier2014(monsterCount: number, partySize: number): number {
  if (monsterCount <= 0) return 1
  let tier = 1
  if (monsterCount === 2) tier = 2
  else if (monsterCount <= 6) tier = 3
  else if (monsterCount <= 10) tier = 4
  else if (monsterCount <= 14) tier = 5
  else tier = 6

  if (partySize < 3) tier = Math.min(MULTIPLIER_LADDER.length - 1, tier + 1)
  else if (partySize >= 6) tier = Math.max(0, tier - 1)
  return MULTIPLIER_LADDER[tier]
}

function clampLevel(level: number): number {
  return Math.max(1, Math.min(20, Math.round(Number.isFinite(level) ? level : 1)))
}

export function calculateEncounterBudget(
  creatures: readonly EncounterCreatureEntry[],
  party: { size: number; level: number } | readonly number[],
  ruleset: EncounterRuleset = '2024',
): EncounterBudgetResult {
  const partyLevels = Array.isArray(party)
    ? ((party as readonly number[]).length ? (party as readonly number[]).map(clampLevel) : [1])
    : Array.from(
        { length: Math.max(1, Math.min(20, Math.round((party as { size: number; level: number }).size || 1))) },
        () => clampLevel((party as { size: number; level: number }).level),
      )
  const partySize = partyLevels.length

  let rawXp = 0
  let monsterCount = 0
  const warnings: string[] = []
  for (const c of creatures) {
    const count = Math.max(0, Math.round(c.count ?? 1))
    if (count === 0) continue
    const unitXp = typeof c.xp === 'number' && Number.isFinite(c.xp) && c.xp >= 0 ? c.xp : crToXp(c.cr)
    if (c.xp === undefined && (c.cr === undefined || c.cr === '')) {
      warnings.push(`Missing CR for "${c.name}"; counted as 0 XP.`)
    }
    rawXp += unitXp * count
    monsterCount += count
  }

  if (ruleset === '2014') {
    const sums = [0, 0, 0, 0]
    for (const lvl of partyLevels) {
      const row = THRESHOLDS_2014[lvl - 1]
      sums[0] += row[0]
      sums[1] += row[1]
      sums[2] += row[2]
      sums[3] += row[3]
    }
    const multiplier = resolveMultiplier2014(monsterCount, partySize)
    const adjustedXp = Math.round(rawXp * multiplier)
    let difficulty: EncounterDifficulty = 'trivial'
    if (adjustedXp >= sums[3]) difficulty = 'deadly'
    else if (adjustedXp >= sums[2]) difficulty = 'hard'
    else if (adjustedXp >= sums[1]) difficulty = 'medium'
    else if (adjustedXp >= sums[0] && monsterCount > 0) difficulty = 'easy'

    return {
      ruleset,
      partySize,
      partyLevels,
      monsterCount,
      rawXp,
      multiplier,
      adjustedXp,
      xpPerCharacter: Math.round(adjustedXp / partySize),
      difficulty,
      thresholds: { low: sums[0], moderate: sums[1], high: sums[2], deadly: sums[3] },
      warnings,
    }
  }

  const sums = [0, 0, 0]
  for (const lvl of partyLevels) {
    const row = BUDGETS_2024[lvl - 1]
    sums[0] += row[0]
    sums[1] += row[1]
    sums[2] += row[2]
  }
  let difficulty: EncounterDifficulty = 'trivial'
  if (rawXp >= sums[2]) difficulty = 'high'
  else if (rawXp >= sums[1]) difficulty = 'moderate'
  else if (rawXp >= sums[0] && monsterCount > 0) difficulty = 'low'

  return {
    ruleset,
    partySize,
    partyLevels,
    monsterCount,
    rawXp,
    multiplier: 1,
    adjustedXp: rawXp,
    xpPerCharacter: Math.round(rawXp / partySize),
    difficulty,
    thresholds: { low: sums[0], moderate: sums[1], high: sums[2] },
    warnings,
  }
}

function deepSanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(deepSanitizeValue)
  if (!isPlainRecord(value)) return value
  const stripped = stripDangerousKeys(value)
  if (!stripped) return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(stripped)) {
    out[k] = deepSanitizeValue(v)
  }
  return out
}

export function buildEncounterSummaryJson(
  combatants: readonly Combatant[],
  budget: EncounterBudgetResult,
  title = 'Encounter Roster',
): EncounterRosterV1 {
  const clonedCombatants = JSON.parse(JSON.stringify(combatants)) as Combatant[]
  return {
    schema: 'dndsheet.encounter.v1',
    title: title.trim() || 'Encounter Roster',
    exportedAt: new Date().toISOString(),
    ruleset: budget.ruleset,
    partySize: budget.partySize,
    partyLevel: budget.partyLevels[0] ?? 1,
    budget: { ...budget, partyLevels: [...budget.partyLevels], thresholds: { ...budget.thresholds }, warnings: [...budget.warnings] },
    combatants: clonedCombatants,
  }
}

export function parseEncounterSummaryJson(
  raw: unknown,
): { ok: true; roster: EncounterRosterV1 } | { ok: false; error: string } {
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ok: false, error: 'Invalid encounter JSON syntax.' }
    }
  }
  if (!isPlainRecord(parsed)) return { ok: false, error: 'Encounter payload must be a JSON object.' }
  const clean = deepSanitizeValue(parsed) as Record<string, unknown>
  if (clean.schema !== 'dndsheet.encounter.v1' || !Array.isArray(clean.combatants)) {
    return { ok: false, error: 'Unsupported encounter schema.' }
  }

  const seenIds = new Set<string>()
  const validCombatants: Combatant[] = []
  for (let i = 0; i < clean.combatants.length; i++) {
    const item = clean.combatants[i]
    if (!isPlainRecord(item) || typeof item.name !== 'string') continue
    const rawId = typeof item.id === 'string' && item.id.trim() ? item.id : `cbt-import-${i + 1}`
    let uniqueId = rawId
    let suffix = 2
    while (seenIds.has(uniqueId)) {
      uniqueId = `${rawId}-${suffix++}`
    }
    seenIds.add(uniqueId)
    const maxHp = typeof item.maxHp === 'number' && Number.isFinite(item.maxHp) ? Math.max(1, Math.round(item.maxHp)) : 1
    const currentHp = typeof item.currentHp === 'number' && Number.isFinite(item.currentHp) ? Math.max(0, Math.round(item.currentHp)) : maxHp
    const tempHp = typeof item.tempHp === 'number' && Number.isFinite(item.tempHp) ? Math.max(0, Math.round(item.tempHp)) : 0
    const initiative = typeof item.initiative === 'number' && Number.isFinite(item.initiative) ? Math.round(item.initiative) : 10
    const conditions = Array.isArray(item.conditions) ? item.conditions.filter((c): c is string => typeof c === 'string') : []
    const ds = isPlainRecord(item.deathSaves) ? item.deathSaves : {}
    validCombatants.push({
      id: uniqueId,
      sourceDocumentId: typeof item.sourceDocumentId === 'string' ? item.sourceDocumentId : undefined,
      sourceRevision: typeof item.sourceRevision === 'number' ? item.sourceRevision : undefined,
      sourceKind: item.sourceKind === 'monster' || item.sourceKind === 'character' || item.sourceKind === 'custom' ? item.sourceKind : 'custom',
      sourceSnapshot: isPlainRecord(item.sourceSnapshot) ? (item.sourceSnapshot as unknown as Combatant['sourceSnapshot']) : undefined,
      name: item.name,
      initiative,
      currentHp,
      maxHp,
      tempHp,
      conditions,
      deathSaves: {
        successes: typeof ds.successes === 'number' ? Math.max(0, Math.min(3, Math.round(ds.successes))) : 0,
        failures: typeof ds.failures === 'number' ? Math.max(0, Math.min(3, Math.round(ds.failures))) : 0,
      },
      isMonster: Boolean(item.isMonster),
    })
  }

  const ruleset: EncounterRuleset = clean.ruleset === '2014' ? '2014' : '2024'
  const partySize = typeof clean.partySize === 'number' && clean.partySize >= 1 ? Math.round(clean.partySize) : 4
  const partyLevel = clampLevel(typeof clean.partyLevel === 'number' ? clean.partyLevel : 5)
  const monsters = validCombatants
    .filter((c) => c.isMonster)
    .map((c) => ({ name: c.name, cr: c.sourceSnapshot?.monsterSnapshot?.CR ?? '1' }))
  const budget = calculateEncounterBudget(monsters, { size: partySize, level: partyLevel }, ruleset)

  return {
    ok: true,
    roster: {
      schema: 'dndsheet.encounter.v1',
      title: typeof clean.title === 'string' && clean.title.trim() ? clean.title : 'Encounter Roster',
      exportedAt: typeof clean.exportedAt === 'string' ? clean.exportedAt : new Date().toISOString(),
      ruleset,
      partySize,
      partyLevel,
      budget,
      combatants: validCombatants,
    },
  }
}

export function buildEncounterMarkdown(
  combatants: readonly Combatant[],
  budget: EncounterBudgetResult,
  title = 'Encounter Roster',
): string {
  const esc = (s: string) => s.replace(/\|/g, '\\|')
  const mult = budget.ruleset === '2014' && budget.multiplier !== 1 ? ` (×${budget.multiplier} -> ${budget.adjustedXp} adj XP)` : ''
  const lines = [
    `## ${title.trim() || 'Encounter Roster'}`,
    '',
    `- **Ruleset:** ${budget.ruleset} | **Party:** ${budget.partySize} × Level ${budget.partyLevels[0] ?? 1}`,
    `- **Monsters:** ${budget.monsterCount} | **XP:** ${budget.rawXp}${mult} | **Difficulty:** ${budget.difficulty.toUpperCase()} (${budget.xpPerCharacter} XP/PC)`,
    '',
    '| Name | Role | Init | AC | HP | Conditions |',
    '|---|---:|---:|---:|---:|---|',
  ]
  for (const c of combatants) {
    const role = c.isMonster ? 'Monster' : 'Hero'
    const ac = c.sourceSnapshot?.ac ?? 10
    const hp = c.tempHp > 0 ? `${c.currentHp}/${c.maxHp} (+${c.tempHp})` : `${c.currentHp}/${c.maxHp}`
    const conds = c.conditions.length ? c.conditions.join(', ') : '—'
    lines.push(`| ${esc(c.name)} | ${role} | ${c.initiative} | ${ac} | ${hp} | ${esc(conds)} |`)
  }
  return lines.join('\n')
}
