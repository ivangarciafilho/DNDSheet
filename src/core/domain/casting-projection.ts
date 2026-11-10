import type { Monster } from './types.ts'
import { aggregateSpellcastingSources, allCastingSourceEntries, castingLearningSummary, hasCastingSources, formatSpellcastingTitle, spellcastingRuleClass, SPELL_POINTS_BY_LEVEL } from '../usecases/AutoSyncSpellcasting.ts'
import { buildSpellPlate, consolidateSpellPlates, ordinalLabel, type SpellPlateModel } from './spell-plate.ts'
import { castingResourceView, castingResourceSummary } from './casting-resource-view.ts'
import { sourceEffectiveSpells } from './casting-source-selection.ts'

export interface CastingProjectionOptions {
  stats: Record<string, number>
  proficiency: number
  save: string | number
  attack: string | number
  spellLevel(name: string): number | undefined
  spellTags?(name: string): string
  title?: string
  edition?: '2014' | '2024'
}

/** Shared display projection: source ownership, learning and budgets reach every adapter together. */
export function buildCastingProjection(sc: Monster['spellcasting'], options: CastingProjectionOptions): SpellPlateModel {
  const empty = () => buildSpellPlate({ title: 'Spellcasting', stat: sc.stat || 'INT', save: options.save, attack: options.attack, level: 0, spellLevels: [] })
  if (!hasCastingSources(sc)) return empty()
  const aggregate = aggregateSpellcastingSources(sc, options.stats, options.proficiency)
  const learning = castingLearningSummary(sc, options.stats, options.proficiency)
  const sources = allCastingSourceEntries(sc)
  const effectiveLevel = learning.casterLevel || sc.level || 1
  const title = options.title || (sources.length > 1 ? ordinalLabel(effectiveLevel) + ' Level Spellcaster' : formatSpellcastingTitle(sc.class || 'Spellcaster', effectiveLevel, undefined, undefined, sc.displayTitleMode || 'class_names').replace(/Level (\d+) /g, (_match, level) => ordinalLabel(Number(level)) + ' Level '))
  const visible = (cadence?: string) => !sc.alwaysAvailableOnly || !cadence || ['at_will', 'at will', 'always', 'none'].includes(cadence.trim().toLowerCase())
  const primarySource = { ...sc, className: sc.class || '', spells: sc.standard }
  const primaryPool = castingResourceView(primarySource, aggregate)
  const primaryNames = sourceEffectiveSpells(primarySource)
  const primary = buildSpellPlate({
    title, stat: sc.stat || 'INT', save: options.save, attack: options.attack,
    className: sc.class, level: sc.level, slots: primaryPool.slots,
    resourceType: primaryPool.resourceType, pactPool: primaryPool.pactPool, resourceValue: primaryPool.resourceValue ?? (sc.resourceType === 'points' ? SPELL_POINTS_BY_LEVEL[sc.level] : sc.resourceType === 'focus' ? sc.level : undefined),
    refreshRate: sc.refreshRate, customRefreshRate: sc.customRefreshRate, preparedCount: sc.preparedCountOverride ?? learning.perClass[0]?.preparedSpells,
    preparedInterval: sc.preparedInterval, levelAmountMap: sc.levelAmountMap, levelCadenceMap: sc.levelCadenceMap,
    metamagic: sc.metamagic ? { enabled: sc.metamagic.enabled, points: sc.metamagic.sorceryPoints, refreshRate: sc.metamagic.refreshRate, options: sc.metamagic.options } : undefined,
    edition: options.edition,
    spellLevels: sc.primarySourceEnabled === false ? [] : Array.from({ length: 10 }, (_, level) => ({
      level, amount: sc.levelAmountMap?.[level], cadence: sc.levelCadenceMap?.[level], bonusAction: Boolean(sc.bonusActionLevelMap?.[level]),
      spells: primaryNames.filter(name => (options.spellLevel(name) ?? 0) === level && visible(sc.spellCadenceMap?.[name])).map(name => ({ name, tags: options.spellTags?.(name), cadence: sc.spellCadenceMap?.[name], amount: sc.spellAmountMap?.[name], bonusAction: sc.spellBonusActionMap?.[name] })),
    })),
  })
  const additions = (sc.classes || []).map(source => {
    const pool = castingResourceView(source, aggregate), names = sourceEffectiveSpells(source)
    return {
      id: source.id, label: [source.className, source.subclass].filter(Boolean).join(' · '),
      plate: buildSpellPlate({
        title: source.className, stat: source.stat, save: options.save, attack: options.attack,
        className: source.className, level: source.level, slots: pool.slots,
        resourceType: pool.resourceType, pactPool: pool.pactPool, resourceValue: pool.resourceValue, refreshRate: source.refreshRate,
        spellLevels: Array.from({ length: 10 }, (_, level) => ({
          level, amount: source.levelAmounts?.[level], cadence: source.levelCadences?.[level], bonusAction: Boolean(source.levelBonusAction?.[level]),
          spells: names.filter(name => (options.spellLevel(name) ?? 0) === level && visible(source.spellCadenceMap?.[name])).map(name => ({ name, tags: options.spellTags?.(name), cadence: source.spellCadenceMap?.[name], amount: source.spellAmounts?.[name], bonusAction: source.spellBonusAction?.[name] })),
        })),
      }),
    }
  })
  const result = consolidateSpellPlates(primary, additions)
  if (learning.perClass.length && (sources.length > 1 || sc.contribution?.cantrips || sc.contribution?.spells)) {
    const primaryMaximum = learning.perClass[0]?.preparedSpells || 0
    const maximum = learning.spells - primaryMaximum + (sc.preparedCountOverride ?? primaryMaximum)
    result.prepared = 'Up to ' + learning.cantrips + ' cantrips; ' + maximum + ' known/prepared spells'
  }
  const secondaryAbilities = learning.perClass.slice(1).filter(entry => entry.saveDc !== Number(options.save) || entry.spellAttack !== Number(options.attack))
  if (secondaryAbilities.length) result.consolidatedSummary = secondaryAbilities.map(entry => [entry.className, entry.subclass].filter(Boolean).join(' / ') + ' (' + entry.stat + '): DC ' + entry.saveDc + ', ' + (entry.spellAttack >= 0 ? '+' : '') + entry.spellAttack + ' spell attack').join('; ')
  const summary = castingResourceSummary(sc, options.stats, options.proficiency)
  if (summary && !['points', 'focus'].includes(sc.resourceType || '')) {
    const manual = additions.filter(entry => { const source = sc.classes?.find(item => item.id === entry.id); return source && source.contribution?.mode !== 'custom' && (!spellcastingRuleClass(source.className) || ['points', 'focus'].includes(source.resourceType || '')) }).map(entry => entry.label + ': ' + entry.plate.resource).filter(text => !text.endsWith(': '))
    result.resource = [summary, ...manual].join(' · ')
  }
  return result
}
