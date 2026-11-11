import type { Monster } from './types.ts'
import { aggregateSpellcastingSources, sourceLearningMetrics, spellcastingRuleClass, SPELL_POINTS_BY_LEVEL } from '../usecases/AutoSyncSpellcasting.ts'
import { buildSpellPlate, ordinalLabel, type SpellPlateLevel, type SpellPlateModel } from './spell-plate.ts'
import { castingResourceView } from './casting-resource-view.ts'
import { sourceEffectiveSpells, sourceSpellCeiling } from './casting-source-selection.ts'
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

function preparationLabel(count: number, cadence: string): string {
  const noun = count === 1 ? 'spell' : 'spells'
  if (!cadence) return 'Can prepare ' + count + ' ' + noun
  const timing = cadence === 'Downtime' ? 'during downtime'
    : /rest$/i.test(cadence) ? 'after a ' + cadence
    : /^at /i.test(cadence) ? cadence.toLowerCase()
    : 'on ' + cadence
  return 'Can prepare ' + count + ' ' + noun + ' ' + timing
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
  const result = buildSpellPlate({
    title, stat: sc.stat || 'INT', save: options.save, attack: options.attack, level: effectiveLevel,
    spellLevels: [], edition: options.edition,
    metamagic: sources.length && sc.metamagic ? { enabled: sc.metamagic.enabled, points: sc.metamagic.sorceryPoints, refreshRate: sc.metamagic.refreshRate, options: sc.metamagic.options } : undefined,
  })
  const resourceLines = new Set<string>()
  const rows = new Map<string, SpellPlateLevel>()
  const preparation = new Map<string, number>()
  let cantrips = 0, known = 0
  for (const source of sources) {
    const pool = castingResourceView(source, aggregate)
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
    const learning = sourceLearningMetrics(source, modifier, effectiveLevel, sources.length)
    cantrips += learning.cantripsKnown
    const override = source.preparedCountOverride
    const limit = override ?? learning.preparedSpells
    const prepares = override != null || Boolean(source.preparedInterval) || Boolean(rules && ['wizard', 'cleric', 'druid', 'paladin', 'artificer'].includes(rules))
    if (limit > 0 && prepares) {
      const cadence = cadenceLabel(source.preparedInterval || 'long_rest')
      preparation.set(cadence, (preparation.get(cadence) || 0) + limit)
    } else known += limit
    const customRefreshRate = 'customRefreshRate' in source && typeof source.customRefreshRate === 'string' ? source.customRefreshRate : undefined
    const plate = buildSpellPlate({
      title, stat: source.stat, save, attack, className: source.className, level: source.level,
      resourceType: pool.resourceType, pactPool: pool.pactPool, slots,
      resourceValue: pool.resourceValue ?? (source.id === 'primary' ? source.resourceType === 'points' ? SPELL_POINTS_BY_LEVEL[source.level] : source.resourceType === 'focus' ? source.level : undefined : undefined),
      refreshRate: source.refreshRate, customRefreshRate,
      spellLevels: Array.from({ length: 10 }, (_, level) => ({
        level, amount: source.levelAmounts?.[level], cadence: source.levelCadences?.[level], bonusAction: Boolean(source.levelBonusAction?.[level]),
        spells: names.filter(name => (options.spellLevel(name) ?? 0) === level && (ceiling === undefined || level <= ceiling) && visible(source.spellCadenceMap?.[name])).map(name => ({
          name, tags: options.spellTags?.(name), cadence: source.spellCadenceMap?.[name], amount: source.spellAmounts?.[name], bonusAction: source.spellBonusAction?.[name],
        })),
      })),
    })
    if (plate.resource) resourceLines.add(plate.resource)
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
  result.resource = [...resourceLines].join(' · ')
  result.prepared = [
    cantrips ? 'Up to ' + cantrips + ' cantrips' : '',
    known ? known + (known === 1 ? ' spell known' : ' spells known') : '',
    ...[...preparation].map(([cadence, count]) => preparationLabel(count, cadence)),
  ].filter(Boolean).join('; ')
  return result
}
