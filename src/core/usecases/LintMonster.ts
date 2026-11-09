import { CR } from '../domain/cr-tables.ts'
import type { DndSpell, Monster } from '../domain/types.ts'
import { calculateCr } from './CalculateCr.ts'

export type LintSeverity = 'ERROR' | 'WARNING' | 'INFO'

export interface MonsterLintIssue {
  code: string
  severity: LintSeverity
  category: 'MULTIATTACK' | 'ATTACK' | 'CR' | 'SPELLCASTING' | 'TRAIT' | 'GENERAL'
  message: string
  targetId?: string
  fixable: boolean
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
        fixable: true,
      })
    }
  }

  // 2. Attacks Validation
  for (const atk of monster.attacks || []) {
    if (atk.damage && atk.damage.count > 0 && (!atk.damage.type || atk.damage.type.trim() === '')) {
      issues.push({
        code: 'MISSING_DAMAGE_TYPE',
        severity: 'WARNING',
        category: 'ATTACK',
        message: `Attack "${atk.name}" deals damage without a specified damage type.`,
        targetId: atk.id,
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
        fixable: false, // slot counts are an authoring choice made in the spellcasting editor
      })
    }
  }

  return issues
}

export function autoFixMonster(monster: Monster): { fixedCount: number; monster: Monster } {
  const tuned: Monster = JSON.parse(JSON.stringify(monster))
  let fixedCount = 0

  const attackIds = new Set((tuned.attacks || []).map((a) => a.id))
  const actionIds = new Set((tuned.actions || []).map((a) => a.id))

  // Clean orphan multiattacks
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

  return {
    fixedCount,
    monster: tuned,
  }
}
