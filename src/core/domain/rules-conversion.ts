import { getMetamagicOption, type RulesEdition } from './catalogs/metamagic.ts'
import { deriveDocumentProvenance } from './document-envelope.ts'
import type { Monster, SpellcastingClassEntry } from './types.ts'

export interface RulesConversionAdjustment {
  path: string
  kind: 'edition_tag' | 'subclass_grants' | 'metamagic_cost' | 'provenance'
  before: string
  after: string
  note: string
}

export interface RulesConversionWarning {
  path: string
  code:
    | 'LEGACY_SUBCLASS_GRANTS_UNMAPPED'
    | 'SRD_521_GRANTS_COLLAPSED'
    | 'METAMAGIC_COST_SHIFT'
    | 'UNKNOWN_SOURCE_PROVENANCE'
  message: string
}

export interface RulesConversionReport {
  fromEdition: RulesEdition | 'unknown'
  toEdition: RulesEdition
  changedCount: number
  adjustments: RulesConversionAdjustment[]
  warnings: RulesConversionWarning[]
  reversible: boolean
}

const EDITION_LABEL: Record<RulesEdition, string> = {
  '2014': 'SRD 5.1 (2014)',
  '2024': 'SRD 5.2.1 (2024)',
}

const auditMetamagicOptions = (
  basePath: string,
  options: readonly string[] | undefined,
  fromEdition: RulesEdition | 'unknown',
  toEdition: RulesEdition,
  adjustments: RulesConversionAdjustment[],
  warnings: RulesConversionWarning[]
) => {
  const baselineEdition: RulesEdition = fromEdition === '2024' ? '2024' : '2014'
  if (baselineEdition === toEdition) return
  for (const name of options ?? []) {
    const meta = getMetamagicOption(name)
    if (!meta) continue
    const beforeCost = baselineEdition === '2014' ? meta.cost2014 : meta.cost2024
    const afterCost = toEdition === '2024' ? meta.cost2024 : meta.cost2014
    const beforeEffect = baselineEdition === '2014' ? meta.effect2014 : meta.effect2024
    const afterEffect = toEdition === '2024' ? meta.effect2024 : meta.effect2014
    if (beforeCost !== afterCost || beforeEffect !== afterEffect) {
      adjustments.push({
        path: `${basePath}.metamagic.${meta.name}`,
        kind: 'metamagic_cost',
        before: `${beforeCost} SP — ${beforeEffect}`,
        after: `${afterCost} SP — ${afterEffect}`,
        note: `Updated ${meta.name} policy for ${EDITION_LABEL[toEdition]}.`,
      })
      warnings.push({
        path: `${basePath}.metamagic.${meta.name}`,
        code: 'METAMAGIC_COST_SHIFT',
        message: `${meta.name} changes from ${beforeCost} SP (${baselineEdition}) to ${afterCost} SP (${toEdition}).`,
      })
    }
  }
}

const auditSubclassGrants = (
  path: string,
  subclass: string | undefined,
  fromEdition: RulesEdition | 'unknown',
  toEdition: RulesEdition,
  adjustments: RulesConversionAdjustment[],
  warnings: RulesConversionWarning[]
) => {
  const cleanSubclass = (subclass ?? '').trim()
  if (!cleanSubclass) return
  if (fromEdition === '2024' && toEdition === '2014') {
    adjustments.push({
      path,
      kind: 'subclass_grants',
      before: `${cleanSubclass} (2024 automatic grants)`,
      after: `${cleanSubclass} (2014 manual selection)`,
      note: 'Authored spells are preserved; automatic SRD 5.2.1 subclass grants no longer auto-populate.',
    })
    warnings.push({
      path,
      code: 'SRD_521_GRANTS_COLLAPSED',
      message: `Subclass "${cleanSubclass}" switched from SRD 5.2.1 grants to 2014 mode; authored spells are kept.`,
    })
  } else if (fromEdition !== '2024' && toEdition === '2024') {
    adjustments.push({
      path,
      kind: 'subclass_grants',
      before: `${cleanSubclass} (${fromEdition})`,
      after: `${cleanSubclass} (2024)`,
      note: 'Review subclass spell grants against SRD 5.2.1 table; existing authored spells stay untouched.',
    })
    warnings.push({
      path,
      code: 'LEGACY_SUBCLASS_GRANTS_UNMAPPED',
      message: `Subclass "${cleanSubclass}" moved to 2024 rules; non-SRD legacy subclass grants require verification.`,
    })
  }
}

const cloneEntries = (
  entries: readonly SpellcastingClassEntry[] | undefined,
  basePath: string,
  fromEdition: RulesEdition | 'unknown',
  toEdition: RulesEdition,
  adjustments: RulesConversionAdjustment[],
  warnings: RulesConversionWarning[]
): SpellcastingClassEntry[] | undefined => {
  if (!entries) return undefined
  return entries.map((entry, index) => {
    const entryPath = `${basePath}[${index}]`
    const entryEdition = entry.rulesEdition ?? (fromEdition === '2014' || fromEdition === '2024' ? fromEdition : 'unknown')
    if (entry.rulesEdition !== toEdition) {
      adjustments.push({
        path: `${entryPath}.rulesEdition`,
        kind: 'edition_tag',
        before: String(entry.rulesEdition ?? 'unset'),
        after: toEdition,
        note: `Updated casting source ${entry.className || entry.id} edition tag.`,
      })
    }
    auditSubclassGrants(`${entryPath}.subclass`, entry.subclass, entryEdition, toEdition, adjustments, warnings)
    auditMetamagicOptions(entryPath, entry.metamagic?.options, entryEdition, toEdition, adjustments, warnings)
    return { ...entry, rulesEdition: toEdition }
  })
}

/**
 * Generates a lossless preview/adjustment report for converting a Monster between
 * D&D 2014 (SRD 5.1) and 2024 (SRD 5.2.1) rule conventions without mutating input.
 */
export function previewRulesEditionConversion(
  monster: Partial<Monster> | null | undefined,
  targetEdition: RulesEdition
): RulesConversionReport {
  return convertMonsterRulesEdition(monster ?? {}, targetEdition).report
}

/**
 * Deterministically converts a Monster snapshot to `targetEdition` while emitting an
 * explicit loss/adjustment report. All authored spells, actions, traits, and bindings
 * are preserved intact so reverting or reviewing differences never drops content.
 */
export function convertMonsterRulesEdition<T extends Partial<Monster>>(
  monster: T,
  targetEdition: RulesEdition
): { monster: T; report: RulesConversionReport } {
  const clone = JSON.parse(JSON.stringify(monster)) as T
  const provenance = deriveDocumentProvenance(clone)
  const fromEdition = provenance.ruleset
  const adjustments: RulesConversionAdjustment[] = []
  const warnings: RulesConversionWarning[] = []

  if (fromEdition === 'unknown') {
    warnings.push({
      path: 'provenance.ruleset',
      code: 'UNKNOWN_SOURCE_PROVENANCE',
      message: `Document had legacy/unspecified provenance; tagging explicitly as ${EDITION_LABEL[targetEdition]}.`,
    })
  }

  if (provenance.ruleset !== targetEdition || provenance.editionLabel !== EDITION_LABEL[targetEdition]) {
    adjustments.push({
      path: 'provenance',
      kind: 'provenance',
      before: `${provenance.ruleset} (${provenance.editionLabel})`,
      after: `${targetEdition} (${EDITION_LABEL[targetEdition]})`,
      note: 'Updated document ruleset provenance metadata.',
    })
  }

  clone.provenance = {
    ruleset: targetEdition,
    editionLabel: EDITION_LABEL[targetEdition],
    sourceKind: 'authored',
    updatedAt: clone.provenance?.updatedAt,
  }

  const sc = clone.spellcasting
  if (sc) {
    const primaryBefore = sc.rulesEdition ?? (fromEdition === '2014' || fromEdition === '2024' ? fromEdition : 'unknown')
    if (sc.rulesEdition !== targetEdition) {
      adjustments.push({
        path: 'spellcasting.rulesEdition',
        kind: 'edition_tag',
        before: String(sc.rulesEdition ?? 'unset'),
        after: targetEdition,
        note: `Set primary spellcasting rules edition to ${targetEdition}.`,
      })
    }
    auditSubclassGrants('spellcasting.subclass', sc.subclass, primaryBefore, targetEdition, adjustments, warnings)
    auditMetamagicOptions('spellcasting', sc.metamagic?.options, primaryBefore, targetEdition, adjustments, warnings)
    sc.rulesEdition = targetEdition

    if (sc.classes) {
      sc.classes = cloneEntries(sc.classes, 'spellcasting.classes', primaryBefore, targetEdition, adjustments, warnings)
    }
    if (sc.multiclass?.classes) {
      sc.multiclass.classes = cloneEntries(
        sc.multiclass.classes,
        'spellcasting.multiclass.classes',
        primaryBefore,
        targetEdition,
        adjustments,
        warnings
      )
    }
    if (sc.multiclass?.extraClasses) {
      sc.multiclass.extraClasses = cloneEntries(
        sc.multiclass.extraClasses,
        'spellcasting.multiclass.extraClasses',
        primaryBefore,
        targetEdition,
        adjustments,
        warnings
      )
    }
  }

  return {
    monster: clone,
    report: {
      fromEdition,
      toEdition: targetEdition,
      changedCount: adjustments.length,
      adjustments,
      warnings,
      reversible: true,
    },
  }
}
