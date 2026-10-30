import { FORMULA_REFS } from '../formula.ts'
import type { ReferenceSources } from '../formula.ts'
import type { DndStat, Monster } from '../types.ts'

const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const
const validOverride = (block: { override?: boolean; overrideValue?: number | null } | undefined) =>
  !!block?.override && Number.isFinite(Number(block.overrideValue))

/**
 * Sources of formulaContextForMonster(monster), with its default derived argument.
 * This deliberately follows the stored context rather than live store getters:
 * PB is stored proficiency, HP uses stored dice and modifier, AC is stored AC,
 * and caster level is the primary stored level. CR/size/CON automatic modes,
 * multiclass, armor calculations and spell modifier overrides are not read by
 * that context. External derived getter injection needs its own matching source
 * policy; consumers must not use this provider for an injected context.
 * Recreate this provider after changes to selectors, overrides or collections.
 * Boolean/string selectors are included alongside numeric authored sources.
 */
export function referenceSourcesForMonster(monster: Monster): ReferenceSources {
  const m = monster
  const statRaw = String(m.spellcasting?.stat ?? 'INT').toUpperCase()
  const spellStat = (abilities.includes(statRaw as DndStat) ? statRaw : 'INT') as DndStat
  const spell = ['spellcasting.stat', `stats.${spellStat}`]
  // The wrapper reads the raw authored key for DC/attack; SPELL_MOD is
  // normalized by buildFormulaContext. Keep these policies distinct.
  const rawSpellStat = String(m.spellcasting?.stat ?? 'INT')
  const rawSpell = ['spellcasting.stat', `stats.${rawSpellStat}`]
  const overrideGuard = (prefix: string, enabled: boolean | undefined) =>
    [`${prefix}.override`, ...(enabled ? [`${prefix}.overrideValue`] : [])]
  const spellSources = (kind: 'save' | 'attack') => {
    const prefix = `spellcasting.${kind}`
    return validOverride(m.spellcasting?.[kind])
      ? [`${prefix}.override`, `${prefix}.overrideValue`]
      : [...overrideGuard(prefix, m.spellcasting?.[kind]?.override), 'proficiency', ...rawSpell]
  }
  const saveSources = (stat: DndStat) => {
    const prefix = `saves.${stat}`
    const save = m.saves?.[stat]
    if (validOverride(save)) return [`${prefix}.override`, `${prefix}.overrideValue`]
    return [...overrideGuard(prefix, save?.override), `stats.${stat}`, `${prefix}.proficient`, ...(save?.proficient ? ['proficiency'] : [])]
  }
  const passiveSources = (): string[] => {
    const prefix = 'passivePerception'
    if (validOverride(m.passivePerception)) return [`${prefix}.override`, `${prefix}.overrideValue`]
    const paths = overrideGuard(prefix, m.passivePerception?.override)
    const matches = (m.skills ?? []).filter(s => String(s.key ?? '').toUpperCase() === 'PERCEPTION')
    if (matches.length > 1) throw new Error('Ambiguous perception skill identity')
    const skill = matches[0]
    if (!skill) return [...paths, 'stats.WIS']
    const p = 'skills[key=PERCEPTION]'
    paths.push(`${p}.override`, `${p}.advantage`, `${p}.disadvantage`)
    if (skill.override) return [...paths, `${p}.overrideValue`]
    return [...paths, `${p}.skill.stat`, `stats.${skill.skill?.stat ?? 'WIS'}`, `${p}.expertise`, `${p}.proficient`, ...(skill.expertise || skill.proficient ? ['proficiency'] : [])]
  }
  const speedSources = (): string[] => {
    const speeds = m.speeds ?? []
    const active = speeds.find(s => !s.type || s.type.toLowerCase() === 'walk') ?? speeds[0]
    if (!active) return []
    if (typeof active.id !== 'string' || !active.id || speeds.filter(s => s.id === active.id).length !== 1) {
      throw new Error('Missing or ambiguous active speed identity')
    }
    return [`speeds[id=${encodeURIComponent(active.id)}].speed`]
  }
  return (referenceId) => {
    const token = referenceId.toUpperCase()
    const ref = FORMULA_REFS.find(r => r.id === token || r.aliases?.includes(token))
    if (!ref) throw new Error(`Unknown formula reference: ${referenceId}`)
    const id = ref.id
    for (const stat of abilities) {
      if (id === stat || id === `${stat}_MOD`) return [`stats.${stat}`]
      if (id === `ATK_${stat}` || id === `DC_${stat}`) return ['proficiency', `stats.${stat}`]
      if (id === `SAVE_${stat}`) return saveSources(stat)
    }
    switch (id) {
      case 'PB': return ['proficiency']
      case 'HP': case 'BLOODIED': return ['HP.HD', 'HP.type', 'HP.modifier']
      case 'HD': return ['HP.HD']
      case 'HD_DIE': case 'HIT_DIE': return ['HP.type']
      case 'HP_BONUS': return ['HP.modifier']
      case 'HIT_DICE': return ['HP.HD', 'HP.type']
      case 'AC': return ['AC']
      case 'CR': return ['CR']
      case 'LEGENDARY': return ['legendaryActions.count']
      case 'CASTER_LEVEL': case 'CANTRIP_DICE': return ['spellcasting.level']
      case 'SPELL_MOD': return spell
      case 'SPELL_ATK': return spellSources('attack')
      case 'SPELL_DC': return spellSources('save')
      case 'INIT': return ['stats.DEX', 'initiativeConfig.proficient', ...(m.initiativeConfig?.proficient ? ['proficiency'] : [])]
      case 'PASSIVE_PERCEPTION': return passiveSources()
      case 'SPEED': return speedSources()
      default: throw new Error(`Missing source policy for formula reference: ${id}`)
    }
  }
}
