import type { DndStat } from './types.ts'
import { SPECIES_CATALOG_PART_1 } from './species-catalog-1.ts'
import { SPECIES_CATALOG_PART_2 } from './species-catalog-2.ts'
import { SPECIES_CATALOG_PART_3 } from './species-catalog-3.ts'

export interface PointBuyResult {
  spent: number
  remaining: number
  total: number
  isValid: boolean
  outOfRangeStats: string[]
}

export const POINT_BUY_BUDGET = 27

export const POINT_BUY_COST_TABLE: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export function calculatePointBuySpent(stats: Record<string, number>): PointBuyResult {
  const statKeys = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']
  let spent = 0
  const outOfRangeStats: string[] = []

  for (const k of statKeys) {
    const val = Number(stats[k]) || 10
    if (val < 8 || val > 15) {
      outOfRangeStats.push(k)
      // Approximate costs for stats outside 8-15
      if (val < 8) spent += 0
      else spent += 9 + (val - 15) * 2
    } else {
      spent += POINT_BUY_COST_TABLE[val] ?? 0
    }
  }

  const remaining = POINT_BUY_BUDGET - spent
  return {
    spent,
    remaining,
    total: POINT_BUY_BUDGET,
    isValid: remaining >= 0 && outOfRangeStats.length === 0,
    outOfRangeStats,
  }
}

export const STANDARD_ARRAY: Record<DndStat, number> = {
  STR: 15,
  DEX: 14,
  CON: 13,
  INT: 12,
  WIS: 10,
  CHA: 8,
}

export interface MonsterRoleArchetype {
  id: string
  label: string
  icon: string
  color: string
  stats: Record<DndStat, number>
  description: string
}

export const MONSTER_ROLE_ARCHETYPES: Record<string, MonsterRoleArchetype> = {
  brute: {
    id: 'brute',
    label: 'Brute',
    icon: 'fitness_center',
    color: 'deep-orange',
    stats: { STR: 18, DEX: 10, CON: 16, INT: 8, WIS: 10, CHA: 8 },
    description: 'High STR and CON; melee powerhouse with high hit points and devastating physical attacks.',
  },
  skirmisher: {
    id: 'skirmisher',
    label: 'Skirmisher',
    icon: 'directions_run',
    color: 'teal',
    stats: { STR: 10, DEX: 18, CON: 14, INT: 12, WIS: 14, CHA: 10 },
    description: 'High DEX and mobility; excels at hit-and-run tactics, stealth, and elusive traversal.',
  },
  artillery: {
    id: 'artillery',
    label: 'Artillery',
    icon: 'gps_fixed',
    color: 'amber-9',
    stats: { STR: 8, DEX: 16, CON: 12, INT: 16, WIS: 12, CHA: 10 },
    description: 'High DEX and ranged attack/spell stat; deals heavy damage from safe distance.',
  },
  controller: {
    id: 'controller',
    label: 'Controller',
    icon: 'psychology',
    color: 'purple-3',
    stats: { STR: 8, DEX: 12, CON: 14, INT: 18, WIS: 16, CHA: 12 },
    description: 'High casting stat; alters the battlefield, inflicts conditions, and disables enemies.',
  },
  leader: {
    id: 'leader',
    label: 'Leader',
    icon: 'military_tech',
    color: 'indigo',
    stats: { STR: 14, DEX: 10, CON: 14, INT: 12, WIS: 14, CHA: 18 },
    description: 'High CHA and defenses; enhances allies, grants tactical commands, and coordinates troops.',
  },
  soldier: {
    id: 'soldier',
    label: 'Soldier',
    icon: 'shield',
    color: 'blue-grey',
    stats: { STR: 16, DEX: 12, CON: 16, INT: 10, WIS: 12, CHA: 10 },
    description: 'Disciplined and well-armored; works in formations with balanced physical defenses.',
  },
}

export interface SpeciesEntry {
  id: string
  name: string
  type: string
  subtype?: string
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan'
  speed?: number
  senses?: Array<{ name: string; value: string }>
  resistances?: string[]
  immunities?: string[]
  languages?: string[]
  statBonuses: Partial<Record<DndStat, number>>
  traits: Array<{ name: string; description: string }>
}

export const SPECIES_CATALOG: SpeciesEntry[] = [...SPECIES_CATALOG_PART_1, ...SPECIES_CATALOG_PART_2, ...SPECIES_CATALOG_PART_3]

const PROPOSAL_STAT_KEYS: readonly DndStat[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

export interface SeededAbilityRollResult {
  seed: number
  rolls: number[]
  assignments: Record<DndStat, number>
  diceBreakdown: number[][]
}

function createMulberry32(seed: number): () => number {
  let state = (seed >>> 0) || 1
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function rollSeededAbilityScores(
  seed: number,
  options: { method?: '4d6dl' | '3d6'; sortDescending?: boolean; priorityOrder?: DndStat[] } = {}
): SeededAbilityRollResult {
  const rng = createMulberry32(seed)
  const diceCount = options.method === '3d6' ? 3 : 4
  const rolls: number[] = []
  const diceBreakdown: number[][] = []

  for (let i = 0; i < 6; i++) {
    const dice: number[] = []
    for (let d = 0; d < diceCount; d++) {
      dice.push(Math.floor(rng() * 6) + 1)
    }
    const sortedDice = [...dice].sort((a, b) => b - a)
    const kept = options.method === '3d6' ? sortedDice : sortedDice.slice(0, 3)
    rolls.push(kept.reduce((sum, v) => sum + v, 0))
    diceBreakdown.push(dice)
  }

  const orderedScores = options.sortDescending !== false ? [...rolls].sort((a, b) => b - a) : [...rolls]
  const order = options.priorityOrder && options.priorityOrder.length === 6
    ? options.priorityOrder
    : PROPOSAL_STAT_KEYS

  const assignments = {} as Record<DndStat, number>
  order.forEach((stat, idx) => {
    assignments[stat] = orderedScores[idx]
  })

  return {
    seed,
    rolls,
    assignments,
    diceBreakdown,
  }
}

export type ProposalRuleset = '2024' | '2014'

export interface ProposalFieldDiff {
  path: string
  kind: 'scalar' | 'stat' | 'list-add' | 'trait-add'
  before: unknown
  after: unknown
  label: string
}

export interface ProposalProvenance {
  sourceType: 'ability-scores' | 'species'
  sourceId: string
  sourceName: string
  ruleset: ProposalRuleset
  includeStats: boolean
  seed?: number
}

export interface AppliedGrantRecord {
  sourceId: string
  sourceName: string
  ruleset: ProposalRuleset
  scalarSnapshots: Record<string, unknown>
  scalarApplied: Record<string, unknown>
  addedStats: Partial<Record<DndStat, number>>
  addedLists: Record<string, string[]>
  addedSenses: Array<{ name: string; value: string }>
  addedTraits: Array<{ name: string; description: string }>
}

export interface ProposalTargetMonster {
  type?: string
  subtype?: string
  size?: string
  speed?: number | string
  speeds?: string
  stats?: Partial<Record<DndStat, number>>
  senses?: Array<{ name?: string; value?: string; type?: string }>
  resistances?: string[]
  immunities?: string[]
  languages?: string[]
  traits?: Array<{ name: string; description: string; grantedBy?: string }>
  boundPaths?: string[]
  appliedGrants?: Record<string, AppliedGrantRecord>
  [key: string]: unknown
}

export interface MonsterProposal {
  id: string
  status: 'pending' | 'applied' | 'cancelled'
  provenance: ProposalProvenance
  diffs: ProposalFieldDiff[]
  skippedBoundPaths: string[]
  preservedUserEditPaths: string[]
  speciesSnapshot?: SpeciesEntry
}

export interface ProposalApplyResult<T extends ProposalTargetMonster> {
  monster: T
  proposal: MonsterProposal
  undoSnapshot: T
  appliedPaths: string[]
}

function deepCloneProposalMonster<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function resolveBoundSet(monster: ProposalTargetMonster, extraBoundPaths?: string[]): Set<string> {
  const combined = [...(monster.boundPaths || []), ...(extraBoundPaths || [])]
  return new Set(combined.map((p) => String(p).trim()).filter(Boolean))
}

function isPathBound(path: string, bound: Set<string>): boolean {
  if (bound.has(path)) return true
  const root = path.split('.')[0]
  return bound.has(root)
}

export function proposeAbilityScores(
  monster: ProposalTargetMonster,
  nextStats: Partial<Record<DndStat, number>>,
  options: {
    sourceName?: string
    ruleset?: ProposalRuleset
    boundPaths?: string[]
    seed?: number
  } = {}
): MonsterProposal {
  const bound = resolveBoundSet(monster, options.boundPaths)
  const diffs: ProposalFieldDiff[] = []
  const skippedBoundPaths: string[] = []
  const currentStats = monster.stats || {}

  for (const stat of PROPOSAL_STAT_KEYS) {
    const nextVal = nextStats[stat]
    if (nextVal === undefined) continue
    const path = `stats.${stat}`
    if (isPathBound(path, bound)) {
      skippedBoundPaths.push(path)
      continue
    }
    const beforeVal = currentStats[stat] ?? 10
    if (beforeVal !== nextVal) {
      diffs.push({
        path,
        kind: 'stat',
        before: beforeVal,
        after: nextVal,
        label: `${stat}: ${beforeVal} -> ${nextVal}`,
      })
    }
  }

  return {
    id: `prop-stats-${options.seed ?? 'custom'}`,
    status: 'pending',
    provenance: {
      sourceType: 'ability-scores',
      sourceId: options.seed !== undefined ? `seed:${options.seed}` : 'ability-proposal',
      sourceName: options.sourceName || 'Ability Score Assignment',
      ruleset: options.ruleset || '2024',
      includeStats: true,
      ...(options.seed !== undefined ? { seed: options.seed } : {}),
    },
    diffs,
    skippedBoundPaths,
    preservedUserEditPaths: [],
  }
}

export function proposeSpeciesGrants(
  monster: ProposalTargetMonster,
  species: SpeciesEntry,
  options: {
    ruleset?: ProposalRuleset
    includeStats?: boolean
    boundPaths?: string[]
  } = {}
): MonsterProposal {
  const ruleset: ProposalRuleset = options.ruleset || '2024'
  // 2024 ruleset defaults to no automatic species ASI unless explicitly opted in via includeStats: true
  const includeStats = ruleset === '2024' ? options.includeStats === true : options.includeStats !== false
  const bound = resolveBoundSet(monster, options.boundPaths)
  const diffs: ProposalFieldDiff[] = []
  const skippedBoundPaths: string[] = []
  const preservedUserEditPaths: string[] = []
  const priorGrant = monster.appliedGrants?.[species.id]

  const maybePushScalar = (path: string, nextVal: unknown, label: string) => {
    if (nextVal === undefined) return
    if (isPathBound(path, bound)) {
      skippedBoundPaths.push(path)
      return
    }
    const currentVal = monster[path]
    // Preserve user customization if previously granted scalar was manually altered
    if (
      priorGrant &&
      path in priorGrant.scalarSnapshots &&
      currentVal !== species[path as keyof SpeciesEntry] &&
      currentVal !== priorGrant.scalarSnapshots[path]
    ) {
      preservedUserEditPaths.push(path)
      return
    }
    if (currentVal !== nextVal) {
      diffs.push({ path, kind: 'scalar', before: currentVal, after: nextVal, label })
    }
  }

  maybePushScalar('type', species.type, `Type: ${species.type}`)
  if (species.subtype) maybePushScalar('subtype', species.subtype, `Subtype: ${species.subtype}`)
  if (species.size) maybePushScalar('size', species.size, `Size: ${species.size}`)
  if (species.speed !== undefined) maybePushScalar('speed', species.speed, `Speed: ${species.speed} ft.`)

  for (const listKey of ['languages', 'resistances', 'immunities'] as const) {
    const incoming = species[listKey]
    if (!incoming || incoming.length === 0) continue
    if (isPathBound(listKey, bound)) {
      skippedBoundPaths.push(listKey)
      continue
    }
    const existing = new Set((monster[listKey] || []).map((v) => v.toLowerCase()))
    const additions = incoming.filter((item) => !existing.has(item.toLowerCase()))
    if (additions.length > 0) {
      diffs.push({
        path: listKey,
        kind: 'list-add',
        before: [...(monster[listKey] || [])],
        after: additions,
        label: `Add ${listKey}: ${additions.join(', ')}`,
      })
    }
  }

  if (species.senses && species.senses.length > 0) {
    if (isPathBound('senses', bound)) {
      skippedBoundPaths.push('senses')
    } else {
      const existingNames = new Set(
        (monster.senses || []).map((s) => String(s.name || s.type || '').toLowerCase())
      )
      const missingSenses = species.senses.filter((s) => !existingNames.has(s.name.toLowerCase()))
      if (missingSenses.length > 0) {
        diffs.push({
          path: 'senses',
          kind: 'list-add',
          before: monster.senses || [],
          after: missingSenses,
          label: `Add senses: ${missingSenses.map((s) => `${s.name} ${s.value}`).join(', ')}`,
        })
      }
    }
  }

  if (species.traits && species.traits.length > 0) {
    if (isPathBound('traits', bound)) {
      skippedBoundPaths.push('traits')
    } else {
      const existingTraits = new Map(
        (monster.traits || []).map((t) => [t.name.toLowerCase(), t])
      )
      const addedTraits = [] as Array<{ name: string; description: string }>
      for (const trait of species.traits) {
        const existing = existingTraits.get(trait.name.toLowerCase())
        if (!existing) {
          addedTraits.push(trait)
        } else if (existing.description !== trait.description) {
          preservedUserEditPaths.push(`traits.${trait.name}`)
        }
      }
      if (addedTraits.length > 0) {
        diffs.push({
          path: 'traits',
          kind: 'trait-add',
          before: (monster.traits || []).map((t) => t.name),
          after: addedTraits,
          label: `Add traits: ${addedTraits.map((t) => t.name).join(', ')}`,
        })
      }
    }
  }

  if (includeStats && species.statBonuses) {
    for (const stat of PROPOSAL_STAT_KEYS) {
      const bonus = species.statBonuses[stat]
      if (!bonus) continue
      const path = `stats.${stat}`
      if (isPathBound(path, bound)) {
        skippedBoundPaths.push(path)
        continue
      }
      const alreadyGranted = priorGrant?.addedStats[stat] || 0
      const delta = bonus - alreadyGranted
      if (delta === 0) continue
      const beforeVal = monster.stats?.[stat] ?? 10
      diffs.push({
        path,
        kind: 'stat',
        before: beforeVal,
        after: beforeVal + delta,
        label: `${stat} ${delta >= 0 ? '+' : ''}${delta} (${species.name})`,
      })
    }
  }

  return {
    id: `prop-species-${species.id}`,
    status: 'pending',
    provenance: {
      sourceType: 'species',
      sourceId: species.id,
      sourceName: species.name,
      ruleset,
      includeStats,
    },
    diffs,
    skippedBoundPaths,
    preservedUserEditPaths,
    speciesSnapshot: species,
  }
}

export function cancelProposal(proposal: MonsterProposal): MonsterProposal {
  return { ...proposal, status: 'cancelled' }
}

export function applyProposal<T extends ProposalTargetMonster>(
  monster: T,
  proposal: MonsterProposal
): ProposalApplyResult<T> {
  const undoSnapshot = deepCloneProposalMonster(monster)
  const next = deepCloneProposalMonster(monster)
  if (proposal.status === 'cancelled') {
    return { monster: next, proposal, undoSnapshot, appliedPaths: [] }
  }

  const appliedPaths: string[] = []
  const grantRecord: AppliedGrantRecord = {
    sourceId: proposal.provenance.sourceId,
    sourceName: proposal.provenance.sourceName,
    ruleset: proposal.provenance.ruleset,
    scalarSnapshots: { ...(next.appliedGrants?.[proposal.provenance.sourceId]?.scalarSnapshots || {}) },
    scalarApplied: { ...(next.appliedGrants?.[proposal.provenance.sourceId]?.scalarApplied || {}) },
    addedStats: { ...(next.appliedGrants?.[proposal.provenance.sourceId]?.addedStats || {}) },
    addedLists: { ...(next.appliedGrants?.[proposal.provenance.sourceId]?.addedLists || {}) },
    addedSenses: [...(next.appliedGrants?.[proposal.provenance.sourceId]?.addedSenses || [])],
    addedTraits: [...(next.appliedGrants?.[proposal.provenance.sourceId]?.addedTraits || [])],
  }

  for (const diff of proposal.diffs) {
    if (diff.kind === 'stat') {
      const stat = diff.path.split('.')[1] as DndStat
      if (!next.stats) next.stats = {}
      const beforeNum = Number(next.stats[stat] ?? 10)
      const afterNum = Number(diff.after)
      next.stats[stat] = afterNum
      if (proposal.provenance.sourceType === 'species') {
        grantRecord.addedStats[stat] = (grantRecord.addedStats[stat] || 0) + (afterNum - beforeNum)
      }
      appliedPaths.push(diff.path)
      continue
    }

    if (diff.kind === 'scalar') {
      if (!(diff.path in grantRecord.scalarSnapshots)) {
        grantRecord.scalarSnapshots[diff.path] = (next as Record<string, unknown>)[diff.path]
      }
      ;(next as Record<string, unknown>)[diff.path] = diff.after
      grantRecord.scalarApplied[diff.path] = diff.after
      appliedPaths.push(diff.path)
      continue
    }

    if (diff.path === 'senses' && diff.kind === 'list-add') {
      const toAdd = diff.after as Array<{ name: string; value: string }>
      const current = [...(next.senses || [])]
      for (const s of toAdd) {
        current.push({ ...s })
        grantRecord.addedSenses.push({ ...s })
      }
      next.senses = current
      appliedPaths.push('senses')
      continue
    }

    if (diff.kind === 'list-add') {
      const key = diff.path as 'languages' | 'resistances' | 'immunities'
      const toAdd = diff.after as string[]
      const current = [...(next[key] || [])]
      const priorAdded = grantRecord.addedLists[key] || []
      for (const item of toAdd) {
        current.push(item)
        priorAdded.push(item)
      }
      next[key] = current
      grantRecord.addedLists[key] = priorAdded
      appliedPaths.push(key)
      continue
    }

    if (diff.kind === 'trait-add') {
      const toAdd = diff.after as Array<{ name: string; description: string }>
      const current = [...(next.traits || [])]
      for (const t of toAdd) {
        current.push({ ...t, grantedBy: proposal.provenance.sourceId })
        grantRecord.addedTraits.push({ ...t })
      }
      next.traits = current
      appliedPaths.push('traits')
    }
  }

  if (proposal.provenance.sourceType === 'species' && appliedPaths.length > 0) {
    next.appliedGrants = {
      ...(next.appliedGrants || {}),
      [proposal.provenance.sourceId]: grantRecord,
    }
  }

  return {
    monster: next,
    proposal: { ...proposal, status: 'applied' },
    undoSnapshot,
    appliedPaths,
  }
}

export function revokeSpeciesGrants<T extends ProposalTargetMonster>(
  monster: T,
  sourceId: string
): { monster: T; preservedUserEdits: string[] } {
  const next = deepCloneProposalMonster(monster)
  const record = next.appliedGrants?.[sourceId]
  const preservedUserEdits: string[] = []
  if (!record) return { monster: next, preservedUserEdits }

  // Restore unmodified scalars; preserve user-customized scalars
  for (const [path, priorVal] of Object.entries(record.scalarSnapshots)) {
    const appliedVal = record.scalarApplied?.[path]
    if (appliedVal !== undefined && next[path] !== appliedVal) {
      preservedUserEdits.push(path)
      continue
    }
    ;(next as Record<string, unknown>)[path] = priorVal
  }

  // Revert stat bonuses
  if (next.stats) {
    for (const stat of PROPOSAL_STAT_KEYS) {
      const delta = record.addedStats[stat]
      if (delta) {
        next.stats[stat] = (next.stats[stat] ?? 10) - delta
      }
    }
  }

  // Remove only list items introduced by this grant
  for (const [listKey, added] of Object.entries(record.addedLists)) {
    const key = listKey as 'languages' | 'resistances' | 'immunities'
    const removeSet = new Set(added.map((x) => x.toLowerCase()))
    const remaining = (next[key] || []).filter((item) => {
      if (removeSet.has(item.toLowerCase())) {
        removeSet.delete(item.toLowerCase())
        return false
      }
      return true
    })
    next[key] = remaining
  }

  // Remove senses added by this grant unless modified
  if (next.senses && record.addedSenses.length > 0) {
    const addedMap = new Map(record.addedSenses.map((s) => [s.name.toLowerCase(), s.value]))
    next.senses = next.senses.filter((s) => {
      const nameKey = String(s.name || s.type || '').toLowerCase()
      const grantedVal = addedMap.get(nameKey)
      if (!grantedVal) return true
      if (String(s.value || '') !== grantedVal) {
        preservedUserEdits.push(`senses.${nameKey}`)
        return true
      }
      addedMap.delete(nameKey)
      return false
    })
  }

  // Remove traits matching the granted baseline; preserve user-edited traits!
  if (next.traits && record.addedTraits.length > 0) {
    const baselineMap = new Map(record.addedTraits.map((t) => [t.name.toLowerCase(), t.description]))
    next.traits = next.traits.filter((t) => {
      const grantedDesc = baselineMap.get(t.name.toLowerCase())
      if (grantedDesc === undefined) return true
      if (t.description !== grantedDesc) {
        preservedUserEdits.push(`traits.${t.name}`)
        return true
      }
      baselineMap.delete(t.name.toLowerCase())
      return false
    })
  }

  if (next.appliedGrants) {
    delete next.appliedGrants[sourceId]
  }
  return { monster: next, preservedUserEdits }
}
