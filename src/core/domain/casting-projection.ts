import type { Monster } from './types.ts'
import { aggregateSpellcastingSources, sourceLearningMetrics, spellcastingRuleClass, SPELL_POINTS_BY_LEVEL } from '../usecases/AutoSyncSpellcasting.ts'
import { buildSpellPlate, ordinalLabel, spellRowRecovery, type SpellPlateLevel, type SpellPlateModel } from './spell-plate.ts'
import { castingResourceView } from './casting-resource-view.ts'
import { sourceEffectiveSpells, sourceSpellCeiling } from './casting-source-selection.ts'
import { getSpellMetadata } from './spell-metadata.ts'
import { cadenceLabel } from './catalogs/cadence.ts'

export interface CastingProjectionOptions {
  stats: Record<string, number>
  proficiency: number
  save: string | number
  attack: string | number
  spellLevel(name: string): number | undefined
  spellTags?(name: string): string
  edition?: '2014' | '2024'
}

function preparedSpellCount(count: number, spellList: string): string {
  return count + ' ' + (spellList ? spellList + ' ' : '') + (count === 1 ? 'spell' : 'spells')
}

function preparationLabel(count: number, cadence: string, spellList: string): string {
  const spells = preparedSpellCount(count, spellList)
  if (!cadence) return 'Can prepare ' + spells
  const timing = cadence === 'Downtime' ? 'during downtime'
    : /rest$/i.test(cadence) ? 'per ' + cadence
    : /^at /i.test(cadence) ? cadence.toLowerCase()
    : 'on ' + cadence
  return 'Can prepare ' + spells + ' ' + timing
}

export const RESTRICTED_SPELL_CADENCES = ['Dawn', 'Downtime', 'Dusk', 'Long Rest', 'Midday', 'Midnight', 'Monthly', 'Ritual', 'Short Rest', 'Short or Long Rest', 'Weekly', 'Yearly'] as const

function isRestrictedSpell(sc: Monster['spellcasting'], cadence: string | undefined, name: string, castingTime?: string): boolean {
  const selected = sc.restrictedCadences ?? RESTRICTED_SPELL_CADENCES
  const normalized = cadenceLabel(cadence).toLowerCase().replace(/^at /, '')
  return Boolean(castingTime?.trim()) || selected.some(value => {
    const filter = cadenceLabel(value).toLowerCase().replace(/^at /, '')
    return filter === normalized || (filter === 'ritual' && getSpellMetadata(name).ritual)
  })
}

/** The output groups casting rules; source identity remains in the editor and saved model. */
export function buildCastingProjection(sc: Monster['spellcasting'], options: CastingProjectionOptions): SpellPlateModel {
  const aggregate = aggregateSpellcastingSources(sc, options.stats, options.proficiency)
  const sources = [
    ...(sc.primarySourceEnabled === false ? [] : [{
      ...sc, id: 'primary', className: sc.class || '', spells: sc.standard,
      levelAmounts: sc.levelAmountMap, levelCadences: sc.levelCadenceMap,
      levelBonusAction: sc.bonusActionLevelMap, spellAmounts: sc.spellAmountMap,
      spellBonusAction: sc.spellBonusActionMap,
    }]),
    ...(sc.classes || []),
  ]
  const effectiveLevel = aggregate?.combinedCasterLevel || sources[0]?.level || 1
  const title = ordinalLabel(effectiveLevel) + ' Level Spellcaster'
  const visible = (cadence?: string) => !sc.alwaysAvailableOnly || !cadence || ['at_will', 'at will', 'always', 'none'].includes(cadence.trim().toLowerCase())
  const perSourceSorceryPoints = (sc.classes || []).reduce(
    (sum, entry) => {
      const explicitSp = Number.isFinite(entry.sorceryPoints) && (entry.sorceryPoints ?? 0) > 0 ? Math.trunc(entry.sorceryPoints!) : 0
      const legacySp = !explicitSp && entry.metamagic?.enabled && Number.isFinite(entry.metamagic.sorceryPoints)
        ? Math.max(0, Math.trunc(entry.metamagic.sorceryPoints))
        : 0
      return sum + explicitSp + legacySp
    },
    0,
  )
  const primarySorceryPoints = sc.metamagic?.enabled
    ? Number(sc.metamagic.sorceryPoints ?? 0)
    : (Number.isFinite(sc.sorceryPoints) && (sc.sorceryPoints ?? 0) > 0 ? Math.trunc(sc.sorceryPoints!) : 0)
  const combinedSorceryPoints = primarySorceryPoints + perSourceSorceryPoints
  const combinedMetamagicOptions = [...new Set([
    ...(sc.metamagic?.options || []),
    ...(sc.classes || []).flatMap(entry => entry.metamagic?.enabled || (entry.sorceryPoints ?? 0) > 0 ? (entry.metamagic?.options || []) : []),
  ])]
  const hasMetamagic = Boolean(sources.length && (sc.metamagic?.enabled || perSourceSorceryPoints > 0 || (sc.sorceryPoints ?? 0) > 0))
  const result = buildSpellPlate({
    title, stat: sc.stat || 'INT', save: options.save, attack: options.attack, level: effectiveLevel,
    spellLevels: [], edition: options.edition,
    metamagic: hasMetamagic
      ? {
          enabled: true,
          points: combinedSorceryPoints,
          refreshRate: sc.metamagic?.refreshRate || 'long_rest',
          options: combinedMetamagicOptions,
        }
      : undefined,
  })
  const resources = new Map<string, NonNullable<SpellPlateModel['resourceRecovery']>>()
  const rows = new Map<string, SpellPlateLevel>()
  const preparation = new Map<string, { cadence: string; spellList: string; count: number }>()
  const pools = sources.map(source => ({ source, pool: castingResourceView(source, aggregate) }))
  const poolRecovery = ({ source, pool }: typeof pools[number]) => cadenceLabel(spellRowRecovery(1, undefined, { ...source, ...pool }))
  for (const entry of pools) {
    const { source, pool } = entry
    const recovery = poolRecovery(entry)
    const sharedResourceCadence = pools.some(other => other !== entry && other.pool.resourceType === pool.resourceType && poolRecovery(other) === recovery)
      ? recovery
      : undefined
    const ceiling = source.contribution?.highestSlot ? sourceSpellCeiling(source, effectiveLevel, sources.length) : undefined
    const slots = ceiling === undefined ? pool.slots : pool.slots?.map((amount, index) => index < ceiling ? amount : 0)
    const names = sourceEffectiveSpells(source, effectiveLevel, sources.length)
    const modifier = Math.floor(((options.stats[source.stat] ?? 10) - 10) / 2)
    const save = source.id === 'primary' ? Number(options.save) : source.save?.override ? source.save.overrideValue : 8 + options.proficiency + modifier
    const attack = source.id === 'primary' ? Number(options.attack) : source.attack?.override ? source.attack.overrideValue : options.proficiency + modifier
    const mechanics = save !== Number(options.save) || attack !== Number(options.attack)
      ? 'DC ' + save + ', ' + (attack >= 0 ? '+' : '') + attack + ' spell attack'
      : ''
    const rules = spellcastingRuleClass(source.className, source.subclass)
    const learning = sourceLearningMetrics(source, modifier, effectiveLevel, sources.length, options.edition || '2014')
    const override = source.preparedCountOverride
    const limit = override ?? learning.preparedSpells
    const prepares = override != null || Boolean(source.preparedInterval) || Boolean(rules && ['wizard', 'cleric', 'druid', 'paladin', 'artificer'].includes(rules))
    if (limit > 0 && prepares) {
      const cadence = cadenceLabel(source.preparedInterval || 'long_rest')
      const spellList = typeof source.preparedSpellList === 'string' ? source.preparedSpellList.trim() : ''
      const key = JSON.stringify([cadence, spellList])
      preparation.set(key, { cadence, spellList, count: (preparation.get(key)?.count || 0) + limit })
    }
    const customRefreshRate = 'customRefreshRate' in source && typeof source.customRefreshRate === 'string' ? source.customRefreshRate : undefined
    const plate = buildSpellPlate({
      title, stat: source.stat, save, attack, className: source.className, level: source.level,
      resourceType: pool.resourceType, pactPool: pool.pactPool, slots,
      resourceValue: pool.resourceValue ?? (source.id === 'primary' ? source.resourceType === 'points' ? SPELL_POINTS_BY_LEVEL[source.level] : source.resourceType === 'focus' ? source.level : undefined : undefined),
      refreshRate: source.refreshRate, customRefreshRate, sharedResourceCadence,
      spellLevels: Array.from({ length: 10 }, (_, level) => ({
        level, amount: source.levelAmounts?.[level], cadence: source.levelCadences?.[level], bonusAction: Boolean(source.levelBonusAction?.[level]),
        spells: names.filter(name => (options.spellLevel(name) ?? 0) === level && (ceiling === undefined || level <= ceiling) && visible(source.spellCadenceMap?.[name])).map(name => {
          const override = source.spellCastingTimeMap?.[name]
          const castingTime = (typeof override === 'string' ? override.trim() : '') || getSpellMetadata(name).extendedCastingTime
          const cadence = source.spellCadenceMap?.[name]
          const restrictionCadence = cadence || source.levelCadences?.[level]
          return {
            name, castingTime, restrictionCadence,
            restricted: isRestrictedSpell(sc, restrictionCadence, name, castingTime),
            tags: options.spellTags?.(name), cadence, amount: source.spellAmounts?.[name], bonusAction: source.spellBonusAction?.[name],
          }
        }),
      })),
    })
    if (plate.resourceRecovery) resources.set(plate.resource, plate.resourceRecovery)
    for (const row of plate.levels) {
      // Cantrips without their own budget can share a row across resource types.
      const budget = row.level || row.amount ? plate.resource || pool.resourceType : ''
      const key = JSON.stringify([row.level, row.heading, row.effectiveCadence, mechanics, budget])
      const existing = rows.get(key)
      if (existing) {
        const seen = new Set(existing.spells.map(spell => JSON.stringify(spell)))
        existing.spells.push(...row.spells.filter(spell => {
          const token = JSON.stringify(spell)
          if (seen.has(token)) return false
          seen.add(token)
          return true
        }))
      } else {
        rows.set(key, {
          ...row, sourceId: 'casting-row-' + rows.size,
          heading: mechanics ? row.heading.replace(/:$/, ' (' + mechanics + '):') : row.heading,
          spells: [...row.spells],
        })
      }
    }
  }
  result.levels = [...rows.values()].sort((a, b) => a.level - b.level)
  const summaries: string[] = []
  const emittedCadences = new Set<string>()
  for (const [summary, resource] of resources) {
    const cadence = resource.cadence
    if (emittedCadences.has(cadence)) continue
    const prepares = [...preparation].filter(([, entry]) => entry.cadence === cadence)
    if (prepares.length === 0) {
      summaries.push(summary)
      continue
    }
    const matching = [...resources.values()].filter(entry => entry.cadence === cadence)
    const units = [...new Set(matching.map(entry => entry.unit))]
    const otherPool = [...resources.values()].some(entry => entry.cadence !== cadence && units.includes(entry.unit))
    const timing = /rest$/i.test(cadence) ? 'On a ' + cadence
      : cadence === 'Downtime' ? 'During downtime'
      : /^At /i.test(cadence) ? cadence
      : 'On ' + cadence
    const available = prepares.map(([, entry]) => preparedSpellCount(entry.count, entry.spellList))
    summaries.push(matching.map(entry => entry.description).join('. ') + '. ' + timing + ', regains '
      + (otherPool ? 'these expended ' : 'all expended ') + units.join(' and ')
      + ' and can prepare ' + available.join(' and '))
    emittedCadences.add(cadence)
    for (const [key] of prepares) preparation.delete(key)
  }
  result.resource = summaries.join(' · ')
  result.prepared = [...preparation.values()].map(({ count, cadence, spellList }) => preparationLabel(count, cadence, spellList)).join('; ')
  return result
}
