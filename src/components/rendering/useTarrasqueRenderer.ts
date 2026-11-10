import { CR } from 'src/data/CR'
import { useMonsterStore } from 'src/stores/monster-store'
import { useI18n } from 'vue-i18n'
import { DndStat } from '../models'
import { avgRoll, renderBonus } from './mathRendering'
import { useProcessTokens } from './useProcessTokens'
import { useTextRenderer } from './useTextRenderer'
import { tarrasqueDamageDice, tarrasqueEntry, tarrasqueText } from 'src/core/domain/tarrasque-export'
import { structuredAttackBonus } from 'src/core/domain/structured-attack'
import { spellLevelHeading, spellNameWithCadence } from 'src/core/domain/spell-plate'

const statMap = {
  STR: 'strength',
  DEX: 'dexterity',
  CON: 'constitution',
  INT: 'intelligence',
  WIS: 'wisdom',
  CHA: 'charisma',
}

// this one's for tarrasque.io
// since i like using niche things, it exists here
export function useTarrasqueRenderer() {
  const monster = useMonsterStore()
  // Exports print prose in every visual template: plates are web markup.
  const renderer = useTextRenderer({ web: false })
  const { processTokens, processTrait, processAction, processAttack, processReaction, processLegendaryAction, processLairAction } = useProcessTokens({ web: false })
  const { t } = useI18n()

  // Tarrasque.io also uses JSON so we'll corral the 5emm monster data into tarrasque's format
  const renderTarrasqueJson = () => {
    // listen i'm not writing an interface for this i'm guessing at the types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tio: any = {}

    // basics
    tio.name = monster.name
    tio.size = monster.size
    tio.type = monster.type
    tio.subtype = '' // 5emm doesn't have a subtype field
    tio.alignment = monster.alignment
    tio.armor_class = monster.AC
    tio.armor_type = monster.ACType
    tio.hit_points =
      avgRoll(monster.HP.HD, monster.HP.type) + monster.HP.modifier
    tio.hit_dice = `${monster.HP.HD}d${monster.HP.type}${renderBonus(
      monster.HP.modifier
    )}`
    tio.speed = monster.speeds
      .map((s) => `${s.speed} ft. ${s.type}${s.note === '' ? '' : s.note}`)
      .join(', ')

    tio.speed_json = {}
    monster.speeds.forEach((s) => {
      tio.speed_json[s.type ?? 'unknown'] = s.speed
    })

    // stats
    for (const stat in monster.stats) {
      tio[statMap[stat as DndStat]] = monster.stats[stat as DndStat]

      // save, only add if proficient or overridden
      const save = monster.saves[stat as DndStat]
      const key = `${statMap[stat as DndStat]}_save`

      if (save.override) {
        tio[key] = save.overrideValue
      } else if (save.proficient) {
        tio[key] = monster.defaultSaveBonus(stat as DndStat)
      }
    }

    // skills
    // convert to lower case and replace ' ' with '_' (idk if this is how it actually works)S
    for (const skill of monster.skills) {
      const key = skill.skill.label.toLowerCase().replace(' ', '_')

      if (skill.override) {
        tio[key] = skill.overrideValue
      } else {
        tio[key] = monster.defaultSkillBonus(skill)
      }
    }

    // immunities, resistances, senses, languages
    // Header values carry web chrome (number pills, advantage marks); Tarrasque wants plain text.
    tio.damage_vulnerabilities = tarrasqueText(renderer.vulnerabilities.value)
    tio.damage_resistances = tarrasqueText(renderer.resistances.value)
    tio.damage_immunities = tarrasqueText(renderer.immunities.value)
    tio.condition_immunities = tarrasqueText(renderer.conditions.value)
    tio.senses = tarrasqueText(renderer.senses.value)

    tio.languages = tarrasqueText(renderer.languages.value)
    tio.challenge_rating = CR[monster.CR].cr

    // Pair each shared prose projection with its source record. Names are not identity:
    // duplicate names and cadence-prefixed leads must not redirect numeric metadata.
    tio.special_abilities = monster.traits.map((trait) =>
      tarrasqueEntry(processTrait(trait, monster), trait.name, trait.crAnnotation?.maxModifier ?? 0)
    )
    for (const lair of monster.lairActions || []) {
      tio.special_abilities.push({ name: 'Lair Action', desc: tarrasqueText(processLairAction(lair, monster)), attack_bonus: 0 })
    }

    // The existing target contract merges bonus actions into actions and retains
    // physical attack fields. Only their description now comes from shared prose.
    tio.actions = []
    if (monster.multiattacks.length > 0) {
      tio.actions.push({
        name: 'Multiattack',
        desc: tarrasqueText(processTokens('{multiattack.all}. {multiattack.postscript}', monster.multiattacks, monster, 'multiattack')),
        attack_bonus: 0,
      })
    }
    // Keep every physical definition: legendary references otherwise lose their dice/bonus source.
    for (const attack of monster.attacks) {
      tio.actions.push({
        ...tarrasqueEntry(processAttack(attack, monster), attack.name, monster.attackModifier(attack.id)),
        damage_dice: tarrasqueDamageDice(attack),
        damage_bonus: monster.attackDamageModifier(attack.id),
      })
    }
    for (const action of monster.actions.filter((entry) => !entry.legendaryOnly)) {
      tio.actions.push(tarrasqueEntry(
        processAction(action, monster),
        action.name,
        structuredAttackBonus(action, monster) ?? action.crAnnotation?.maxModifier ?? 0
      ))
    }

    // Project original memberships, independently of the sheet's active phase filter.
    if (monster.legendaryActions.actions.length > 0) {
      tio.legendary_desc = tarrasqueText(renderer.legendaryPreamble.value)
      tio.legendary_actions = monster.legendaryActions.actions.map((member) =>
        tarrasqueEntry(processLegendaryAction(member.actionId, member.cost, monster))
      )
    }
    // There is no established dedicated mythic field in this target adapter.
    // Retain the rule as a labeled special ability using the existing target shape.
    if (monster.mythicActions.actions.length > 0) {
      const mythicTrait = renderer.mythicTrait.value
      if (mythicTrait.trim()) tio.special_abilities.push(tarrasqueEntry(mythicTrait))
      const mythicEntries = monster.mythicActions.actions.map((member) =>
        processLegendaryAction(member.actionId, member.cost, monster)
      )
      tio.special_abilities.push({
        name: 'Mythic Actions',
        desc: tarrasqueText([renderer.mythicPreamble.value, ...mythicEntries].join('\n')),
        attack_bonus: 0,
      })
    }
    // spellcasting
    // this counts as a special ability
    // we're just gonna basically copy-pasta the markdown exporter for the description...
    const spellcasting = monster.spellcasting
    if (spellcasting.standard.length > 0) {
      const renderedRows = []
      const cantrips = monster.knownSpellsOfLevel(0).filter((name: string) => monster.spellcasting?.standard?.includes(name)).map((name: string) => spellNameWithCadence(name, monster.spellcasting?.spellCadenceMap?.[name], monster.spellcasting?.levelCadenceMap?.[0] || 'at_will'))

      if (cantrips.length > 0)
        renderedRows.push(
          `${spellLevelHeading({ level: 0, levelCadence: monster.spellcasting?.levelCadenceMap?.[0], bonusAction: Boolean(monster.spellcasting?.bonusActionLevelMap?.[0]), labels: { cantrips: t('editor.spellcasting.slot.cantripLabel'), level: t('editor.spellcasting.slot.levelWord'), bonusAction: t('editor.spellcasting.slot.bonusActionWord') } })} ${cantrips.join(', ')}`
        )

      renderer.classSpellcastingSlots.value.forEach((slot) => {
        renderedRows.push(`${slot.renderedLabel} ${slot.renderedSpells}`)
      })

      const preamble = renderer.classSpellcastingPreamble.value
      const renderedSpellcasting = `${preamble}\n• ${renderedRows.join('\n• ')}`

      tio.special_abilities.push({
        name: t('editor.spellcasting.class.label'),
        desc: tarrasqueText(renderedSpellcasting),
        attack_bonus: 0,
      })
    }

    // innate
    // more pasta
    if (spellcasting.atWill.length > 0) {
      const atWillRendered = renderer.innateSpellcastingLists.value
        .map((list) => `${list.renderedLabel}: ${list.renderedSpells}`)
        .join('\n• ')

      tio.special_abilities.push({
        name: t('editor.spellcasting.innate.label'),
        desc: tarrasqueText(
          `${renderer.innateSpellcastingPreamble.value}\n• ${atWillRendered}`
        ),
        attack_bonus: 0,
      })
    }

    const spells = Array.from(monster.spellcasting.standard)
    for (const atWill of monster.spellcasting.atWill) {
      spells.push(...atWill.spells)
    }

    if (spells.length > 0) tio.spellList = spells

    // Reaction prose includes its trigger, mechanics, outcomes and context tokens.
    if (monster.reactions.length > 0) {
      tio.reactions = monster.reactions.map((reaction) => tarrasqueEntry(
        processReaction(reaction, monster),
        reaction.name,
        structuredAttackBonus({ ...reaction, stagePool: reaction.stagePool === undefined ? undefined : String(reaction.stagePool) }, monster) ?? 0
      ))
    }
    tio.group = 'Custom (5e Monster Maker)'
    return JSON.stringify(tio)
  }

  return {
    renderTarrasqueJson,
  }
}
