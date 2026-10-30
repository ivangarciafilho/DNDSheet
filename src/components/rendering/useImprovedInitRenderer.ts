import { CR } from 'src/data/CR'
import { useMonsterStore } from 'src/stores/monster-store'
import { useI18n } from 'vue-i18n'
import { DndStat } from '../models'
import { avgRoll, renderBonus, statModifier } from './mathRendering'
import { useProcessTokens } from './useProcessTokens'
import { useTextRenderer } from './useTextRenderer'
import { splitEntryLead } from 'src/core/domain/export-markup'
import slugify from 'slugify'

const statMap = {
  STR: 'Str',
  DEX: 'Dex',
  CON: 'Con',
  INT: 'Int',
  WIS: 'Wis',
  CHA: 'Cha',
}

const attackNoName =
  '<i>{attack.distance}:</i> {attack.modifier} to hit, {attack.range}, {attack.targets}. <i>Hit:</i> {attack.damage}{attack.conditionalDamage}{attack.additionalDamage}. {attack.description}'

export function useImprovedInitRenderer() {
  const monster = useMonsterStore()
  // Exports print prose in every visual template: plates are web markup.
  const renderer = useTextRenderer({ web: false })
  const { processTokens, stripTags } = useProcessTokens({ web: false })
  const { t } = useI18n()

  // https://www.improved-initiative.com/
  const renderImprovedInitJson = async () => {
    // improved init has a manifest for what creatures are in the data file
    // manifest
    const iiManifest = [slugify(monster.name)]

    // listen i'm not writing an interface for this i'm guessing at the types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ii: any = {}

    // basics
    ii.Id = iiManifest[0] // slugified id
    ii.Name = monster.name
    ii.Path = ''

    // could put the full data link here but i don't see this field on
    // improved initiative?
    ii.Link = 'https://ebshimizu.github.io/5emm/'

    ii.SearchHint = `${monster.name}\n${monster.type}\n${monster.alignment}`
    ii.FilterDimensions = {
      Level: CR[monster.CR].cr,
      Source: "Homebrew (Falindrith's Monster Maker)",
      Type: `${monster.size} ${monster.type}, ${monster.alignment}`,
    }
    ii.LastUpdateMs = 0
    ii.Version = '1.0.0'
    ii.Source = "Homebrew (Falindrith's Monster Maker)"
    ii.Type = `${monster.size} ${monster.type}, ${monster.alignment}`
    ii.HP = {
      Value: avgRoll(monster.HP.HD, monster.HP.type) + monster.HP.modifier,
      Notes: `(${monster.HP.HD}d${monster.HP.type}${renderBonus(
        monster.HP.modifier
      )})`,
    }
    ii.InitiativeModifier = statModifier(monster.stats.DEX)
    ii.InitiativeAdvantage = false // TODO: 5emm needs a flag for that maybe
    ii.Speed = []
    monster.speeds.forEach((s) => {
      ii.Speed.push(`${s.type ?? 'walk'} ${s.speed} ft.`)
    })
    ii.AC = {
      Value: monster.AC,
      Notes: monster.ACType,
    }

    ii.Abilities = {}
    ii.Saves = []

    // stats
    for (const stat in monster.stats) {
      ii.Abilities[statMap[stat as DndStat]] = monster.stats[stat as DndStat]

      // save, only add if proficient or overridden
      const save = monster.saves[stat as DndStat]

      if (save.override) {
        ii.Saves.push({
          Name: statMap[stat as DndStat],
          Modifier: save.overrideValue,
        })
      } else if (save.proficient) {
        ii.Saves.push({
          Name: statMap[stat as DndStat],
          Modifier: monster.defaultSaveBonus(stat as DndStat),
        })
      }
    }

    ii.DamageVulnerabilities = monster.vulnerabilities
    ii.DamageResistances = monster.resistances
    ii.DamageImmunities = monster.immunities
    ii.ConditionImmunities = monster.conditions

    // skills
    ii.Skills = []
    // convert to lower case and replace ' ' with '_' (idk if this is how it actually works)S
    for (const skill of monster.skills) {
      const key = skill.skill.label

      if (skill.override) {
        ii.Skills.push({
          Name: key,
          Modifier: skill.overrideValue,
        })
      } else {
        ii.Skills.push({
          Name: key,
          Modifier: monster.defaultSkillBonus(skill),
        })
      }
    }

    // immunities, resistances, senses, languages
    ii.Senses = []
    Object.entries(monster.senses).forEach(([sense, range]) => {
      if (range > 0) {
        ii.Senses.push(`${sense} ${range} ft.`)
      }
    })
    ii.Senses.push(`passive Perception ${monster.computedPassivePerception}`)

    if (monster.sensesNotes) {
      ii.Senses.push(
        processTokens(monster.sensesNotes, undefined, monster, 'none')
      )
    }

    ii.Languages = (renderer.languages.value || monster.languages).split(',').map((s: string) => s.trim())
    ii.Challenge = CR[monster.CR].cr

    // traits
    ii.Traits = []
    for (const trait of monster.traits) {
      // name includes uses
      const name = processTokens(
        '{trait.name}{trait.limitedUse}',
        trait,
        monster,
        'trait'
      )

      ii.Traits.push({
        Name: name,
        Content: stripTags(
          processTokens(trait.description, trait, monster, 'trait')
        ),
      })
    }

    // actions includes multiattack, regular attack, and extra actions
    ii.Actions = []

    // tarrasque io likes to have multiattack first looks like
    if (monster.multiattacks.length > 0) {
      ii.Actions.push({
        Name: 'Multiattack',
        Content: stripTags(
          processTokens(
            '{multiattack.all}. {multiattack.postscript}',
            monster.multiattacks,
            monster,
            'multiattack'
          )
        ),
      })
    }

    // attacks next
    for (const attack of monster.attacks) {
      ii.Actions.push({
        Name: attack.name,
        Content: stripTags(
          processTokens(attackNoName, attack, monster, 'attack')
        ),
      })
    }

    // full actions
    const regularActions = monster.actions.filter(
      (a) => !a.legendaryOnly && !a.bonusAction
    )

    for (const action of regularActions) {
      const name = stripTags(
        processTokens(
          '{action.name}{action.limitedUse}',
          action,
          monster,
          'action'
        )
      )

      ii.Actions.push({
        Name: name,
        Content: stripTags(
          processTokens(action.description, action, monster, 'action')
        ),
      })
    }

    // bonus actions
    const bonusActions = monster.actions.filter((a) => a.bonusAction)
    for (const ba of bonusActions) {
      const name = stripTags(
        processTokens('{action.name}{action.limitedUse}', ba, monster, 'action')
      )

      ii.Actions.push({
        Name: name,
        Content: stripTags(
          processTokens(ba.description, ba, monster, 'action')
        ),
      })
    }

    // Legendary and mythic entries come from the shared prose projection, so structured mechanics
    // (rolls, saves, outcomes) survive. Improved Initiative has no preamble field.
    const poolEntries = (entries: string[]) =>
      entries
        .filter((entry) => entry.trim())
        .map((entry) => {
          const { title, body } = splitEntryLead(entry)
          return { Name: stripTags(title), Content: stripTags(body) }
        })
    ii.LegendaryActions = poolEntries(renderer.legendaryActions.value)
    ii.MythicActions = poolEntries(renderer.mythicActions.value)

    // spellcasting
    // this counts as a special ability
    // we're just gonna basically copy-pasta the markdown exporter for the description...
    const spellcasting = monster.spellcasting
    if (spellcasting.standard.length > 0) {
      const renderedRows = []
      const cantrips = monster.knownSpellsOfLevel(0)

      if (cantrips.length > 0)
        renderedRows.push(
          `> ${t('editor.spellcasting.slot.cantripLabel')} *${cantrips.join(
            ', '
          )}*  `
        )

      renderer.classSpellcastingSlots.value.forEach((slot) => {
        renderedRows.push(`${slot.renderedLabel} ${slot.renderedSpells}`)
      })

      const preamble = renderer.classSpellcastingPreamble.value
      const renderedSpellcasting = `${preamble}\n• ${renderedRows.join('\n• ')}`

      ii.Actions.push({
        Name: t('editor.spellcasting.class.label'),
        Content: stripTags(renderedSpellcasting),
      })
    }

    // innate
    // more pasta
    if (spellcasting.atWill.length > 0) {
      const atWillRendered = renderer.innateSpellcastingLists.value
        .map((list) => `${list.renderedLabel} ${list.renderedSpells}`)
        .join('\n• ')

      ii.Actions.push({
        Name: t('editor.spellcasting.innate.label'),
        Content: stripTags(
          `${renderer.innateSpellcastingPreamble.value}\n• ${atWillRendered}`
        ),
      })
    }

    // hold up reaction time
    ii.Reactions = []
    if (monster.reactions.length > 0) {
      for (const reaction of monster.reactions) {
        ii.Reactions.push({
          Name: reaction.name,
          Content: stripTags(
            processTokens(reaction.description, undefined, monster, 'none')
          ),
        })
      }
    }

    // i don't know what these fields are
    ii.Description = ''
    ii.Player = ''
    ii.ImageURL = '' // ok well i do know what this one is but we don't use it

    return JSON.stringify({
      Creatures: iiManifest,
      [`Creatures.${iiManifest[0]}`]: ii,
    })
  }

  return {
    renderImprovedInitJson,
  }
}
