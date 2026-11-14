import { assertRevisionFresh, isStaleRevision } from './document-envelope.ts'
import type { DndSpell, Monster } from './types.ts'
import { autoFixMonster, lintMonster, sectionForFieldPath, type MonsterLintIssue } from '../usecases/LintMonster.ts'

export interface LintTargetEntry {
  prefix: string
  sectionKey: string
  label: string
  sectionSelector: string
  focusSelector: string
}

/**
 * Registry mapping lint issue field paths to editor expansion panels and focusable controls.
 */
export const LINT_TARGET_REGISTRY: readonly LintTargetEntry[] = Object.freeze([
  {
    prefix: 'spellcasting',
    sectionKey: 'spellcasting',
    label: 'Spellcasting',
    sectionSelector: '[data-editor-section="spellcasting"]',
    focusSelector: 'input, textarea, select, [tabindex="0"]',
  },
  {
    prefix: 'randomTables',
    sectionKey: 'randomTables',
    label: 'Random Tables',
    sectionSelector: '[data-editor-section="randomTables"]',
    focusSelector: 'input, textarea, button',
  },
  {
    prefix: 'multiattacks',
    sectionKey: 'actions',
    label: 'Actions & Traits Studio',
    sectionSelector: '[data-editor-section="actions"]',
    focusSelector: 'input, textarea, button',
  },
  {
    prefix: 'attacks',
    sectionKey: 'actions',
    label: 'Actions & Traits Studio',
    sectionSelector: '[data-editor-section="actions"]',
    focusSelector: 'input, textarea, button',
  },
  {
    prefix: 'actions',
    sectionKey: 'actions',
    label: 'Actions & Traits Studio',
    sectionSelector: '[data-editor-section="actions"]',
    focusSelector: 'input, textarea, button',
  },
  {
    prefix: 'traits',
    sectionKey: 'actions',
    label: 'Actions & Traits Studio',
    sectionSelector: '[data-editor-section="actions"]',
    focusSelector: 'input, textarea, button',
  },
  {
    prefix: 'reactions',
    sectionKey: 'actions',
    label: 'Actions & Traits Studio',
    sectionSelector: '[data-editor-section="actions"]',
    focusSelector: 'input, textarea, button',
  },
  {
    prefix: 'legendaryActions',
    sectionKey: 'actions',
    label: 'Actions & Traits Studio',
    sectionSelector: '[data-editor-section="actions"]',
    focusSelector: 'input, textarea, button',
  },
  {
    prefix: 'mythicActions',
    sectionKey: 'actions',
    label: 'Actions & Traits Studio',
    sectionSelector: '[data-editor-section="actions"]',
    focusSelector: 'input, textarea, button',
  },
  {
    prefix: 'lairActions',
    sectionKey: 'actions',
    label: 'Actions & Traits Studio',
    sectionSelector: '[data-editor-section="actions"]',
    focusSelector: 'input, textarea, button',
  },
  {
    prefix: 'senses',
    sectionKey: 'senses',
    label: 'Senses',
    sectionSelector: '[data-editor-section="senses"]',
    focusSelector: 'input, button',
  },
  {
    prefix: 'skills',
    sectionKey: 'skills',
    label: 'Skills',
    sectionSelector: '[data-editor-section="skills"]',
    focusSelector: 'input, button',
  },
  {
    prefix: 'saves',
    sectionKey: 'saves',
    label: 'Saving Throws',
    sectionSelector: '[data-editor-section="saves"]',
    focusSelector: 'input, button',
  },
  {
    prefix: 'speeds',
    sectionKey: 'speeds',
    label: 'Speeds',
    sectionSelector: '[data-editor-section="speeds"]',
    focusSelector: 'input, button',
  },
  {
    prefix: 'resistances',
    sectionKey: 'resistances',
    label: 'Damage & Conditions',
    sectionSelector: '[data-editor-section="resistances"]',
    focusSelector: 'input, button',
  },
  {
    prefix: 'CR',
    sectionKey: 'basics',
    label: 'Basics & CR',
    sectionSelector: '[data-editor-section="basics"]',
    focusSelector: 'input, textarea, select',
  },
  {
    prefix: 'AC',
    sectionKey: 'basics',
    label: 'Basics & CR',
    sectionSelector: '[data-editor-section="basics"]',
    focusSelector: 'input, textarea, select',
  },
  {
    prefix: 'HP',
    sectionKey: 'basics',
    label: 'Basics & CR',
    sectionSelector: '[data-editor-section="basics"]',
    focusSelector: 'input, textarea, select',
  },
  {
    prefix: 'stats',
    sectionKey: 'basics',
    label: 'Basics & CR',
    sectionSelector: '[data-editor-section="basics"]',
    focusSelector: 'input, textarea, select',
  },
  {
    prefix: 'description',
    sectionKey: 'basics',
    label: 'Basics & CR',
    sectionSelector: '[data-editor-section="basics"]',
    focusSelector: 'textarea, input',
  },
])

export interface LintTargetResolution {
  sectionKey: string
  label: string
  sectionSelector: string
  focusSelector: string
  fieldPath?: string
  targetId?: string
}

export function resolveLintTarget(
  issue: Pick<MonsterLintIssue, 'fieldPath' | 'targetId' | 'category' | 'section'>
): LintTargetResolution {
  const path = (issue.fieldPath || '').trim()
  const matched = path
    ? LINT_TARGET_REGISTRY.find((entry) => path === entry.prefix || path.startsWith(`${entry.prefix}.`) || path.startsWith(`${entry.prefix}[`))
    : undefined

  if (matched) {
    return {
      sectionKey: matched.sectionKey,
      label: matched.label,
      sectionSelector: matched.sectionSelector,
      focusSelector: matched.focusSelector,
      fieldPath: path,
      targetId: issue.targetId,
    }
  }

  if (issue.category === 'SPELLCASTING') {
    return {
      sectionKey: 'spellcasting',
      label: 'Spellcasting',
      sectionSelector: '[data-editor-section="spellcasting"]',
      focusSelector: 'input, textarea, button',
      fieldPath: path || 'spellcasting',
      targetId: issue.targetId,
    }
  }
  if (issue.category === 'RANDOM_TABLES') {
    return {
      sectionKey: 'randomTables',
      label: 'Random Tables',
      sectionSelector: '[data-editor-section="randomTables"]',
      focusSelector: 'input, textarea, button',
      fieldPath: path || 'randomTables',
      targetId: issue.targetId,
    }
  }
  if (issue.category === 'MULTIATTACK' || issue.category === 'ATTACK' || issue.category === 'TRAIT') {
    return {
      sectionKey: 'actions',
      label: 'Actions & Traits Studio',
      sectionSelector: '[data-editor-section="actions"]',
      focusSelector: 'input, textarea, button',
      fieldPath: path || 'actions',
      targetId: issue.targetId,
    }
  }

  const sectionLabel = sectionForFieldPath(path)
  return {
    sectionKey: 'basics',
    label: sectionLabel,
    sectionSelector: '[data-editor-section="basics"]',
    focusSelector: 'input, textarea, button',
    fieldPath: path || undefined,
    targetId: issue.targetId,
  }
}

export type CheckStatus = 'current' | 'stale' | 'failed' | 'empty' | 'repaired'

export interface LintRepairChange {
  fieldPath: string
  description: string
  before: string
  after: string
}

export interface LintRepairPlan {
  sourceRevision: number
  fixedCount: number
  changes: LintRepairChange[]
  repairedMonster: Monster
  remainingIssues: MonsterLintIssue[]
}

export interface CheckSession {
  status: CheckStatus
  sourceRevision: number
  currentRevision: number
  issues: MonsterLintIssue[]
  blockingErrors: MonsterLintIssue[]
  repairPlan: LintRepairPlan | null
  errorMessage?: string
  lastRepairedRevision?: number
}

export function planLintRepairs(
  monster: Monster,
  spells: Record<string, DndSpell>,
  sourceRevision: number
): LintRepairPlan {
  const { fixedCount, monster: repairedMonster } = autoFixMonster(monster)
  const changes: LintRepairChange[] = []

  const origMa = monster.multiattacks || []
  const nextMa = repairedMonster.multiattacks || []
  const origMaRefs = origMa.reduce((sum, ma) => sum + (ma.attacks?.length || 0) + (ma.actions?.length || 0), 0)
  const nextMaRefs = nextMa.reduce((sum, ma) => sum + (ma.attacks?.length || 0) + (ma.actions?.length || 0), 0)
  if (origMa.length !== nextMa.length || origMaRefs !== nextMaRefs) {
    changes.push({
      fieldPath: 'multiattacks',
      description: 'Remove orphaned multiattack references and empty multiattack groups',
      before: `${origMa.length} group(s), ${origMaRefs} reference(s)`,
      after: `${nextMa.length} group(s), ${nextMaRefs} reference(s)`,
    })
  }

  const remainingIssues = fixedCount > 0 ? lintMonster(repairedMonster, spells) : lintMonster(monster, spells)
  const beforeIssues = lintMonster(monster, spells)
  const danglingBefore = beforeIssues.filter((i) => i.code === 'DANGLING_RANDOM_TABLE_REF').length
  const danglingAfter = remainingIssues.filter((i) => i.code === 'DANGLING_RANDOM_TABLE_REF').length
  if (danglingBefore > danglingAfter) {
    changes.push({
      fieldPath: 'randomTables',
      description: 'Detach missing random table references on outcome containers while preserving prose',
      before: `${danglingBefore} dangling reference(s)`,
      after: `${danglingAfter} dangling reference(s)`,
    })
  }

  return {
    sourceRevision,
    fixedCount,
    changes,
    repairedMonster,
    remainingIssues,
  }
}

export function createCheckSession(
  monster: Monster,
  spells: Record<string, DndSpell>,
  sourceRevision: number,
  options: { currentRevision?: number; lastRepairedRevision?: number } = {}
): CheckSession {
  const currentRevision = options.currentRevision ?? sourceRevision
  try {
    const issues = lintMonster(monster, spells)
    const blockingErrors = issues.filter((i) => i.severity === 'ERROR')
    const stale = isStaleRevision(sourceRevision, currentRevision)
    const repairPlan = issues.some((i) => i.fixable)
      ? planLintRepairs(monster, spells, sourceRevision)
      : null
    let status: CheckStatus
    if (stale) {
      status = 'stale'
    } else if (options.lastRepairedRevision === sourceRevision) {
      status = 'repaired'
    } else if (issues.length === 0) {
      status = 'empty'
    } else {
      status = 'current'
    }
    return {
      status,
      sourceRevision,
      currentRevision,
      issues,
      blockingErrors,
      repairPlan,
      lastRepairedRevision: options.lastRepairedRevision,
    }
  } catch (error) {
    return {
      status: 'failed',
      sourceRevision,
      currentRevision,
      issues: [],
      blockingErrors: [],
      repairPlan: null,
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  }
}

export function markCheckSessionStale(session: CheckSession, nextRevision: number): CheckSession {
  if (!isStaleRevision(session.sourceRevision, nextRevision)) return session
  return {
    ...session,
    status: 'stale',
    currentRevision: nextRevision,
  }
}

export function applyCheckSessionRepairs(
  session: CheckSession,
  currentRevision: number,
  commitRepair: (repairedMonster: Monster) => number
): { nextRevision: number; fixedCount: number } {
  assertRevisionFresh(session.sourceRevision, currentRevision, 'lint repair')
  if (!session.repairPlan || session.repairPlan.fixedCount === 0) {
    return { nextRevision: currentRevision, fixedCount: 0 }
  }
  const nextRevision = commitRepair(session.repairPlan.repairedMonster)
  return {
    nextRevision,
    fixedCount: session.repairPlan.fixedCount,
  }
}

export interface ExportPolicyDecision {
  allowed: boolean
  requiresOverride: boolean
  blockingErrors: MonsterLintIssue[]
  warnings: MonsterLintIssue[]
  infos: MonsterLintIssue[]
  issues: MonsterLintIssue[]
}

export function evaluateExportPolicy(
  monster: Monster,
  spells: Record<string, DndSpell> = {},
  options: { allowBlockingIssues?: boolean } = {}
): ExportPolicyDecision {
  const issues = lintMonster(monster, spells)
  const blockingErrors = issues.filter((i) => i.severity === 'ERROR')
  const warnings = issues.filter((i) => i.severity === 'WARNING')
  const infos = issues.filter((i) => i.severity === 'INFO')
  const requiresOverride = blockingErrors.length > 0
  return {
    allowed: !requiresOverride || Boolean(options.allowBlockingIssues),
    requiresOverride,
    blockingErrors,
    warnings,
    infos,
    issues,
  }
}
