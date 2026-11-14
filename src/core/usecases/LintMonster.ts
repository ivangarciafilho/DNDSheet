import { sourceGrantedSpells } from '../domain/casting-source-selection.ts'
import { CR } from '../domain/cr-tables.ts'
import { unresolvedMacros } from '../domain/macro-catalog.ts'
import { statModifier } from '../domain/math-utils.ts'
import { resolveMonsterBindings } from '../domain/monster-bindings.ts'
import type { AbilityOutcome, ActionDescriptionContainer, DndSpell, Monster } from '../domain/types.ts'

type LintableOutcome = AbilityOutcome & {
  containers?: ActionDescriptionContainer[]
}

interface LintableContainerOwner {
  id?: string
  name?: string
  description?: string
  descriptionContainers?: ActionDescriptionContainer[]
  outcomes?: LintableOutcome[]
}
import { getDefaultStatForClass, sourceLearningMetrics } from './AutoSyncSpellcasting.ts'
import { calculateCr } from './CalculateCr.ts'
import { processTokens } from './ProcessTokens.ts'

export type LintSeverity = 'ERROR' | 'WARNING' | 'INFO'

export type LintCategory =
  | 'MULTIATTACK'
  | 'ATTACK'
  | 'CR'
  | 'SPELLCASTING'
  | 'TRAIT'
  | 'GENERAL'
  | 'BINDINGS'
  | 'MACROS'
  | 'RANDOM_TABLES'

export interface MonsterLintIssue {
  code: string
  severity: LintSeverity
  category: LintCategory
  message: string
  targetId?: string
  fieldPath?: string
  section?: string
  fixable: boolean
}

export function sectionForFieldPath(fieldPath?: string): string {
  const path = (fieldPath || '').trim()
  if (!path) return 'Basics'
  if (path.startsWith('spellcasting')) return 'Spellcasting'
  if (path.startsWith('randomTables')) return 'Random Tables'
  if (path.startsWith('skills')) return 'Skills'
  if (path.startsWith('saves')) return 'Saves'
  if (path.startsWith('speeds')) return 'Speeds'
  if (path.startsWith('senses')) return 'Senses'
  if (
    path.startsWith('multiattacks') ||
    path.startsWith('attacks') ||
    path.startsWith('actions') ||
    path.startsWith('traits') ||
    path.startsWith('reactions') ||
    path.startsWith('legendaryActions') ||
    path.startsWith('mythicActions') ||
    path.startsWith('lairActions')
  ) {
    return 'Actions & Traits'
  }
  return 'Basics & CR'
}

interface TextScanTarget {
  label: string
  text: string
  targetId?: string
  fieldPath: string
  section: string
}

function collectTextTargets(monster: Monster): TextScanTarget[] {
  const out: TextScanTarget[] = []
  const legacyDesc = (monster as unknown as { description?: unknown }).description
  if (typeof legacyDesc === 'string' && legacyDesc.trim()) {
    out.push({
      label: 'Description',
      text: legacyDesc,
      fieldPath: 'description',
      section: 'Basics & CR',
    })
  }
  const collectCollection = (
    items: LintableContainerOwner[] | undefined,
    prefix: string,
    section: string,
    kindLabel: string
  ) => {
    for (const item of items || []) {
      const itemSelector = item.id ? `${prefix}[id=${encodeURIComponent(item.id)}]` : prefix
      if (typeof item.description === 'string' && item.description.trim()) {
        out.push({
          label: `${kindLabel} "${item.name || item.id || 'unnamed'}"`,
          text: item.description,
          targetId: item.id,
          fieldPath: `${itemSelector}.description`,
          section,
        })
      }
      const scanContainers = (containers: ActionDescriptionContainer[] | undefined) => {
        for (const container of containers || []) {
          if (typeof container.text === 'string' && container.text.trim()) {
            out.push({
              label: `${kindLabel} "${item.name || item.id || 'unnamed'}" outcome`,
              text: container.text,
              targetId: item.id,
              fieldPath: `${itemSelector}.outcomes`,
              section,
            })
          }
          for (const reg of container.regions || []) {
            if (typeof reg.text === 'string' && reg.text.trim()) {
              out.push({
                label: `${kindLabel} "${item.name || item.id || 'unnamed'}" region`,
                text: reg.text,
                targetId: item.id,
                fieldPath: `${itemSelector}.outcomes`,
                section,
              })
            }
          }
        }
      }
      scanContainers(item.descriptionContainers)
      for (const outcome of item.outcomes || []) {
        scanContainers(outcome.containers)
      }
    }
  }

  collectCollection(monster.traits, 'traits', 'Actions & Traits', 'Trait')
  collectCollection(monster.attacks, 'attacks', 'Actions & Traits', 'Attack')
  collectCollection(monster.actions, 'actions', 'Actions & Traits', 'Action')
  collectCollection(monster.reactions, 'reactions', 'Actions & Traits', 'Reaction')
  collectCollection(monster.lairActions, 'lairActions', 'Actions & Traits', 'Lair Action')
  return out
}

function collectDanglingRandomTableRefs(monster: Monster): MonsterLintIssue[] {
  const issues: MonsterLintIssue[] = []
  const tableIds = new Set((monster.randomTables || []).map((t) => t.id))
  const collections: Array<{
    items: LintableContainerOwner[] | undefined
    prefix: string
  }> = [
    { items: monster.traits, prefix: 'traits' },
    { items: monster.actions, prefix: 'actions' },
    { items: monster.reactions, prefix: 'reactions' },
    { items: monster.attacks, prefix: 'attacks' },
    { items: monster.lairActions, prefix: 'lairActions' },
  ]

  const checkContainer = (
    container: ActionDescriptionContainer,
    item: { id?: string; name?: string },
    fieldPath: string
  ) => {
    if (container.kind === 'random_table' || container.randomTableId) {
      const refId = container.randomTableId || container.id || ''
      if (!refId || !tableIds.has(refId)) {
        issues.push({
          code: 'DANGLING_RANDOM_TABLE_REF',
          severity: 'ERROR',
          category: 'RANDOM_TABLES',
          message: `Ability "${item.name || item.id || 'unnamed'}" references missing random table "${refId || '(empty)'}".`,
          targetId: refId || item.id,
          fieldPath,
          section: 'Random Tables',
          fixable: true,
        })
      }
    }
    for (const reg of container.regions || []) {
      if (reg.kind === 'random_table' || reg.randomTableId) {
        const refId = reg.randomTableId || reg.id || ''
        if (!refId || !tableIds.has(refId)) {
          issues.push({
            code: 'DANGLING_RANDOM_TABLE_REF',
            severity: 'ERROR',
            category: 'RANDOM_TABLES',
            message: `Ability "${item.name || item.id || 'unnamed'}" region references missing random table "${refId || '(empty)'}".`,
            targetId: refId || item.id,
            fieldPath,
            section: 'Random Tables',
            fixable: true,
          })
        }
      }
    }
  }

  for (const { items, prefix } of collections) {
    for (const item of items || []) {
      const fieldPath = item.id ? `${prefix}[id=${encodeURIComponent(item.id)}].outcomes` : `${prefix}.outcomes`
      for (const container of item.descriptionContainers || []) {
        checkContainer(container, item, fieldPath)
      }
      for (const outcome of item.outcomes || []) {
        for (const container of outcome.containers || []) {
          checkContainer(container, item, fieldPath)
        }
      }
    }
  }
  return issues
}

function collectPreparedLimitIssues(
  monster: Monster,
  spells: Record<string, DndSpell>
): MonsterLintIssue[] {
  const issues: MonsterLintIssue[] = []
  const sc = monster.spellcasting
  if (!sc) return issues
  const hasSpellDict = Object.keys(spells).length > 0
  const findSpell = (name: string): DndSpell | undefined => {
    if (!hasSpellDict) return undefined
    if (spells[name]) return spells[name]
    const lower = name.trim().toLowerCase()
    return Object.values(spells).find((s) => s.name?.toLowerCase() === lower)
  }

  const sources: Array<{
    label: string
    className: string
    subclass?: string
    level: number
    stat: string
    rulesEdition?: '2014' | '2024'
    preparedCountOverride?: number
    automaticGrants?: boolean
    spells: string[]
    cantrips: string[]
    fieldPath: string
    targetId?: string
  }> = []

  const nonEmptyStrings = (list: unknown): string[] =>
    Array.isArray(list) ? [...new Set(list.filter((s): s is string => typeof s === 'string' && s.trim().length > 0))] : []

  if (sc.primarySourceEnabled !== false && sc.class && sc.level > 0) {
    sources.push({
      label: `${sc.class} ${sc.level}`,
      className: sc.class,
      subclass: sc.subclass,
      level: sc.level,
      stat: sc.stat || getDefaultStatForClass(sc.class),
      rulesEdition: sc.rulesEdition,
      preparedCountOverride: sc.preparedCountOverride,
      automaticGrants: sc.automaticGrants,
      spells: nonEmptyStrings(sc.standard),
      cantrips: nonEmptyStrings((sc as { cantrips?: unknown }).cantrips),
      fieldPath: 'spellcasting.standard',
      targetId: 'primary',
    })
  }

  for (const cls of sc.classes || []) {
    if (cls.className && cls.level > 0) {
      sources.push({
        label: `${cls.className} ${cls.level}`,
        className: cls.className,
        subclass: cls.subclass,
        level: cls.level,
        stat: cls.stat || getDefaultStatForClass(cls.className),
        rulesEdition: cls.rulesEdition ?? sc.rulesEdition,
        preparedCountOverride: cls.preparedCountOverride,
        automaticGrants: cls.automaticGrants,
        spells: nonEmptyStrings(cls.spells),
        cantrips: nonEmptyStrings((cls as { cantrips?: unknown }).cantrips),
        fieldPath: `spellcasting.classes[id=${encodeURIComponent(cls.id)}].spells`,
        targetId: cls.id,
      })
    }
  }

  const statsMap = (monster.stats || {}) as unknown as Record<string, number>
  for (const src of sources) {
    const abilityMod = statModifier(statsMap[src.stat] ?? 10)
    const metrics = sourceLearningMetrics(
      {
        className: src.className,
        subclass: src.subclass,
        level: src.level,
        rulesEdition: src.rulesEdition,
      },
      abilityMod,
      undefined,
      sources.length
    )
    const budget =
      typeof src.preparedCountOverride === 'number' && Number.isFinite(src.preparedCountOverride)
        ? Math.max(0, Math.trunc(src.preparedCountOverride))
        : metrics.preparedSpells

    if (budget <= 0 && metrics.cantripsKnown <= 0) continue

    const granted = new Set(
      sourceGrantedSpells({
        className: src.className,
        subclass: src.subclass,
        level: src.level,
        rulesEdition: src.rulesEdition,
        automaticGrants: src.automaticGrants,
        spells: src.spells,
      })
    )

    if (hasSpellDict) {
      let cantripCount = src.cantrips.filter((n) => !granted.has(n)).length
      let leveledCount = 0
      for (const name of src.spells) {
        if (granted.has(name)) continue
        const found = findSpell(name)
        if (found?.level === 0) cantripCount++
        else leveledCount++
      }
      if (leveledCount > budget) {
        issues.push({
          code: 'PREPARED_OVER_LIMIT',
          severity: 'WARNING',
          category: 'SPELLCASTING',
          message: `${src.label} has ${leveledCount} prepared/known spells assigned, exceeding capacity of ${budget}.`,
          targetId: src.targetId,
          fieldPath: src.fieldPath,
          section: 'Spellcasting',
          fixable: false,
        })
      } else if (src.cantrips.length > 0 && cantripCount > metrics.cantripsKnown) {
        issues.push({
          code: 'PREPARED_OVER_LIMIT',
          severity: 'WARNING',
          category: 'SPELLCASTING',
          message: `${src.label} has ${cantripCount} cantrips assigned, exceeding capacity of ${metrics.cantripsKnown}.`,
          targetId: src.targetId,
          fieldPath: src.fieldPath,
          section: 'Spellcasting',
          fixable: false,
        })
      }
    } else {
      const nonGranted = src.spells.filter((n) => !granted.has(n))
      if (nonGranted.length > budget + metrics.cantripsKnown) {
        issues.push({
          code: 'PREPARED_OVER_LIMIT',
          severity: 'WARNING',
          category: 'SPELLCASTING',
          message: `${src.label} assigns ${nonGranted.length} spells, exceeding combined prepared + cantrip capacity (${budget + metrics.cantripsKnown}).`,
          targetId: src.targetId,
          fieldPath: src.fieldPath,
          section: 'Spellcasting',
          fixable: false,
        })
      }
    }
  }

  return issues
}

export function lintMonster(
  monster: Monster,
  spells: Record<string, DndSpell> = {}
): MonsterLintIssue[] {
  const issues: MonsterLintIssue[] = []

  const attackIds = new Set((monster.attacks || []).map((a) => a.id))
  const actionIds = new Set((monster.actions || []).map((a) => a.id))

  // 1. Multiattack Integrity
  for (const ma of monster.multiattacks || []) {
    for (const atkId of ma.attacks || []) {
      if (!attackIds.has(atkId)) {
        issues.push({
          code: 'MULTIATTACK_ORPHAN_ATTACK',
          severity: 'ERROR',
          category: 'MULTIATTACK',
          message: `Multiattack references non-existent attack ID "${atkId}".`,
          targetId: atkId,
          fieldPath: 'multiattacks',
          section: 'Actions & Traits',
          fixable: true,
        })
      }
    }
    for (const actId of ma.actions || []) {
      if (!actionIds.has(actId)) {
        issues.push({
          code: 'MULTIATTACK_ORPHAN_ACTION',
          severity: 'ERROR',
          category: 'MULTIATTACK',
          message: `Multiattack references non-existent action ID "${actId}".`,
          targetId: actId,
          fieldPath: 'multiattacks',
          section: 'Actions & Traits',
          fixable: true,
        })
      }
    }

    if ((ma.attacks || []).length === 0 && (ma.actions || []).length === 0) {
      issues.push({
        code: 'EMPTY_MULTIATTACK',
        severity: 'WARNING',
        category: 'MULTIATTACK',
        message: 'Multiattack entry exists but contains no attack or action references.',
        targetId: ma.id,
        fieldPath: 'multiattacks',
        section: 'Actions & Traits',
        fixable: true,
      })
    }
  }

  // 2. Attacks Validation
  for (const atk of monster.attacks || []) {
    const atkPath = `attacks[id=${encodeURIComponent(atk.id)}]`
    if (atk.damage && atk.damage.count > 0 && (!atk.damage.type || atk.damage.type.trim() === '')) {
      issues.push({
        code: 'MISSING_DAMAGE_TYPE',
        severity: 'WARNING',
        category: 'ATTACK',
        message: `Attack "${atk.name}" deals damage without a specified damage type.`,
        targetId: atk.id,
        fieldPath: `${atkPath}.damage.type`,
        section: 'Actions & Traits',
        fixable: false,
      })
    }

    if (
      atk.damage &&
      atk.damage.count === 0 &&
      !atk.damage.modifier.override &&
      atk.targets === 0
    ) {
      issues.push({
        code: 'ZERO_DAMAGE_ATTACK',
        severity: 'INFO',
        category: 'ATTACK',
        message: `Attack "${atk.name}" has 0 damage count and 0 targets.`,
        targetId: atk.id,
        fieldPath: `${atkPath}.damage.count`,
        section: 'Actions & Traits',
        fixable: false,
      })
    }
  }

  // 3. Challenge Rating Drift Check
  const currentCrObj = CR[monster.CR] || CR[0]
  const evalResult = calculateCr(monster, spells)
  const calcCrObj = evalResult.estimatedCr

  const stepDelta = Math.abs(currentCrObj.index - calcCrObj.index)
  if (stepDelta >= 2 && !monster.useCrDisplayOverride) {
    issues.push({
      code: 'CR_DRIFT',
      severity: 'WARNING',
      category: 'CR',
      message: `Selected CR is ${currentCrObj.cr}, but DMG calculated challenge rating is ${calcCrObj.cr} (${stepDelta} steps apart). Consider re-balancing or updating target CR.`,
      fieldPath: 'CR',
      section: 'Basics & CR',
      fixable: false, // autoFixMonster cannot repair CR drift; the Auto-Tune dialog proposes the changes
    })
  }

  // 4. Redundant Senses & Traits
  const traitNames = (monster.traits || []).map((t) => t.name.toLowerCase())
  if (monster.senses?.darkvision > 0 && traitNames.some((n) => n.includes('darkvision'))) {
    issues.push({
      code: 'REDUNDANT_SENSES',
      severity: 'INFO',
      category: 'TRAIT',
      message: 'Darkvision is declared in senses and also duplicated as a trait.',
      fieldPath: 'senses.darkvision',
      section: 'Senses',
      fixable: false,
    })
  }

  // 5. Spellcasting Consistency
  if (monster.spellcasting && monster.spellcasting.class && monster.spellcasting.level > 0) {
    const totalSlots = (monster.spellcasting.slots || []).reduce((a, b) => a + b, 0)
    const totalStandard = (monster.spellcasting.standard || []).length
    const totalAtWill = (monster.spellcasting.atWill || []).reduce(
      (a, b) => a + (b.spells || []).length,
      0
    )

    if (totalSlots === 0 && totalStandard > 0 && totalAtWill === 0) {
      issues.push({
        code: 'SPELL_SLOTS_EMPTY',
        severity: 'WARNING',
        category: 'SPELLCASTING',
        message: `Monster is a Level ${monster.spellcasting.level} ${monster.spellcasting.class} with standard spells prepared, but has 0 spell slots assigned.`,
        fieldPath: 'spellcasting.slots',
        section: 'Spellcasting',
        fixable: false, // slot counts are an authoring choice made in the spellcasting editor
      })
    }
  }

  // 6. Track A: Broken Formula Bindings
  const bindingRes = resolveMonsterBindings(monster)
  for (const [path, reason] of Object.entries(bindingRes.errors)) {
    issues.push({
      code: 'BROKEN_BINDING',
      severity: 'ERROR',
      category: 'BINDINGS',
      message: `Formula binding at "${path}" failed: ${reason}`,
      targetId: path,
      fieldPath: path,
      section: sectionForFieldPath(path),
      fixable: false,
    })
  }

  // 7. Track A: Prepared / Cantrip Capacity Overages
  issues.push(...collectPreparedLimitIssues(monster, spells))

  // 8. Track A: Unknown or Unresolved Macros
  for (const entry of collectTextTargets(monster)) {
    const rendered = processTokens(entry.text, monster)
    const unresolved = unresolvedMacros(rendered)
    if (unresolved.length > 0) {
      issues.push({
        code: 'UNKNOWN_MACRO',
        severity: 'WARNING',
        category: 'MACROS',
        message: `${entry.label} contains unresolved macro token(s): ${unresolved.join(', ')}.`,
        targetId: entry.targetId || entry.fieldPath,
        fieldPath: entry.fieldPath,
        section: entry.section,
        fixable: false,
      })
    }
  }

  // 9. Track A: Dangling Random Table References
  issues.push(...collectDanglingRandomTableRefs(monster))

  return issues
}

function scrubDanglingTableNodes(
  containers: ActionDescriptionContainer[] | undefined,
  tableIds: Set<string>
): number {
  let fixed = 0
  for (const container of containers || []) {
    if (container.kind === 'random_table' || container.randomTableId) {
      const refId = container.randomTableId || container.id || ''
      if (!refId || !tableIds.has(refId)) {
        delete container.randomTableId
        if (container.kind === 'random_table') container.kind = 'text'
        fixed++
      }
    }
    for (const reg of container.regions || []) {
      if (reg.kind === 'random_table' || reg.randomTableId) {
        const refId = reg.randomTableId || reg.id || ''
        if (!refId || !tableIds.has(refId)) {
          delete reg.randomTableId
          if (reg.kind === 'random_table') reg.kind = 'text'
          fixed++
        }
      }
    }
  }
  return fixed
}

export function autoFixMonster(monster: Monster): { fixedCount: number; monster: Monster } {
  const tuned: Monster = JSON.parse(JSON.stringify(monster))
  let fixedCount = 0

  const attackIds = new Set((tuned.attacks || []).map((a) => a.id))
  const actionIds = new Set((tuned.actions || []).map((a) => a.id))

  // 1. Clean orphan multiattacks
  const cleanedMultiattacks = []
  for (const ma of tuned.multiattacks || []) {
    const validAttacks = (ma.attacks || []).filter((id) => attackIds.has(id))
    const validActions = (ma.actions || []).filter((id) => actionIds.has(id))

    const orphanAttacksCount = (ma.attacks || []).length - validAttacks.length
    const orphanActionsCount = (ma.actions || []).length - validActions.length
    fixedCount += orphanAttacksCount + orphanActionsCount

    if (validAttacks.length > 0 || validActions.length > 0) {
      cleanedMultiattacks.push({
        ...ma,
        attacks: validAttacks,
        actions: validActions,
      })
    } else {
      fixedCount++ // Dropped empty multiattack
    }
  }
  tuned.multiattacks = cleanedMultiattacks

  // 2. Scrub dangling random table references inside ability outcome & description containers/regions
  const tableIds = new Set((tuned.randomTables || []).map((t) => t.id))
  const outcomeGroups: Array<LintableContainerOwner[] | undefined> = [
    tuned.traits,
    tuned.actions,
    tuned.reactions,
    tuned.attacks,
    tuned.lairActions,
  ]
  for (const group of outcomeGroups) {
    for (const item of group || []) {
      fixedCount += scrubDanglingTableNodes(item.descriptionContainers, tableIds)
      for (const outcome of item.outcomes || []) {
        fixedCount += scrubDanglingTableNodes(outcome.containers, tableIds)
      }
    }
  }

  return {
    fixedCount,
    monster: tuned,
  }
}
