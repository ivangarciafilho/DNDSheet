// this file is a mess
// the autoformatter is allowed to run here it's just ugly af
// due to the whitespace sensitivity of markdown
import { useMonsterStore } from 'src/stores/monster-store'
import { useTextRenderer } from './useTextRenderer'
import { avgRoll, renderBonus, renderModifier } from './mathRendering'
import { DndStat } from '../models'
import { useI18n } from 'vue-i18n'
import { useProcessTokens } from './useProcessTokens'
import { creatureTypeLine, splitEntryLead } from 'src/core/domain/export-markup'

export function useMdRenderer() {
  const monster = useMonsterStore()
  // Exports print prose in every visual template: plates are web markup.
  const renderer = useTextRenderer({ web: false })
  const { mdFormatter } = useProcessTokens({ web: false })

  const { t } = useI18n()

  const getTraits = () => {
    const g = renderer.groupedTraits.value
    const parts: string[] = []

    if (g.standard.length > 0) {
      parts.push(g.standard.map((t) => `> ${mdFormatter(t)}`).join('\n>\n'))
    }
    for (const sec of g.rechargeSections) {
      parts.push(`> ### ${sec.section}\n>\n` + sec.traits.map((t) => `> ${mdFormatter(t)}`).join('\n>\n'))
    }
    for (const cond of g.conditionals) {
      parts.push(`> ### ${cond.trigger}\n>\n` + cond.traits.map((t) => `> ${mdFormatter(t)}`).join('\n>\n'))
    }

    return parts.length === 0 ? '' : `${parts.join('\n>\n')}\n`
  }

  const getInnate = () => {
    const preamble = `> ${mdFormatter(
      renderer.innateSpellcastingPreamble.value
    )}`

    const lists = renderer.innateSpellcastingLists.value.map(
      (sl) => `> ${sl.renderedLabel} *${sl.renderedSpells}*`
    )
    return `> ${preamble}
>
${lists.join('\n')}`
  }

  const getSpellcasting = () => {
    const renderedRows: string[] = []
    renderer.classSpellcastingSlots.value.forEach((slot) => {
      renderedRows.push(`> ${slot.renderedLabel} *${slot.renderedSpells}*  `)
    })

    const preamble = mdFormatter(renderer.classSpellcastingPreamble.value)
    return `\n> ${preamble}
>
${renderedRows.join('\n')}`
  }

  const getAttacks = () => {
    if (renderer.attacks.value.length === 0) return ''

    const attacks = renderer.attacks.value.map((a) => `> ${mdFormatter(a)}`)
    return `\n${attacks.join('\n>\n')}\n>`
  }

  const getActions = () => {
    if (renderer.actions.value.length === 0) return ''

    const actions = renderer.actions.value.map((a) => `> ${mdFormatter(a)}`)
    return `\n${actions.join('\n>\n')}\n>`
  }

  const getBonusActions = () => {
    if (renderer.bonusActions.value.length === 0) return ''

    const actions = renderer.bonusActions.value.map(
      (a) => `> ${mdFormatter(a)}`
    )
    return `\n> ### ${t('monster.bonusActions')}\n>\n${actions.join(
      '\n>\n'
    )}\n>`
  }

  const getLegendaryActions = () => {
    if (renderer.legendaryActions.value.length === 0) return ''

    const preamble = `> ### ${t('editor.legendary.label')}
> ${mdFormatter(renderer.legendaryPreamble.value)}`

    const legendaryActions = renderer.legendaryActions.value.map(
      (la) => `> ${mdFormatter(la)}`
    )

    return `\n${preamble}
>
${legendaryActions.join('\n>\n')}\n>`
  }

  const getMythicTrait = () => {
    if (monster.mythicActions.actions.length === 0) return ''

    return `> ${mdFormatter(renderer.mythicTrait.value)}\n`
  }

  const getMythicActions = () => {
    if (renderer.mythicActions.value.length === 0) return ''

    const preamble = `> ### ${t('editor.mythic.label')}
> ${mdFormatter(renderer.mythicPreamble.value)}`

    const actions = renderer.mythicActions.value

    const formattedActions = actions.map((a) => {
      return `> ${mdFormatter(a)}`
    })

    return `\n${preamble}
>
${formattedActions.join('\n>\n')}\n>`
  }

  const getReactions = () => {
    if (renderer.reactions.value.length === 0) return ''

    const formattedReactions = renderer.reactions.value.map((r) => {
      return `> ${mdFormatter(r)}`
    })

    return `\n> ### ${t('editor.reaction.label')}\n${formattedReactions.join(
      '\n>\n'
    )}\n>`
  }

  const getLairActions = () => {
    if (monster.lairActions.length === 0) return ''

    const preamble = `> ### ${t('editor.lair.label')}
> ${mdFormatter(renderer.lairActionPreamble.value)}`

    const formattedLair = renderer.lairActions.value.map((r) => {
      return `> - ${mdFormatter(r)}`
    })

    return `\n${preamble}\n${formattedLair.join('\n')}\n`
  }

  const getRegionalEffects = () => {
    if (monster.regionalEffects.length === 0) return ''

    const preamble = `> ### ${t('editor.regional.label')}
> ${mdFormatter(renderer.regionalEffectPreamble.value)}`

    const formattedEffects = renderer.regionalEffects.value.map((e) => {
      return `> - ${mdFormatter(e)}`
    })

    return `\n${preamble}\n${formattedEffects.join('\n')}`
  }

  const getInventory = () => {
    if (monster.inventory === '') return ''

    const inventory = `> ### ${t('editor.inventory.label')}\n> ${mdFormatter(
      renderer.inventory.value
    )}`

    return inventory
  }

  const getVillainActions = () => {
    const list = renderer.villainActionsList.value
    if (!list || list.length === 0) return ''
    const parts = list.map(
      (va) => `> ***Round ${va.round}: ${va.name}.*** ${mdFormatter(va.description)}`
    )
    return `\n> ### Villain Actions\n>\n${parts.join('\n>\n')}\n>`
  }

  const getBloodiedActions = () => {
    const list = renderer.bloodiedActionsList.value
    if (!list || list.length === 0) return ''
    const parts = list.map(
      (ba) => `> ***${ba.name} (${ba.trigger || 'Bloodied'}).*** ${mdFormatter(ba.description)}`
    )
    return `\n> ### Bloodied Actions\n>\n${parts.join('\n>\n')}\n>`
  }

  const getReactiveActions = () => {
    const list = renderer.reactiveActionsList.value
    if (!list || list.length === 0) return ''
    const parts = list.map(
      (ra) => `> ***${ra.name} (${ra.trigger}).*** ${mdFormatter(ra.description)}`
    )
    return `\n> ### Reactive Actions\n>\n${parts.join('\n>\n')}\n>`
  }

  const getComboActions = () => {
    const list = renderer.comboActionsList.value
    if (!list || list.length === 0) return ''
    const parts = list.map(
      (ca) => `> ***${ca.name} (${ca.leadAction} ➔ ${ca.followup}).*** ${mdFormatter(ca.description)}`
    )
    return `\n> ### Combo Actions\n>\n${parts.join('\n>\n')}\n>`
  }

  const getDracoAnatomy = () => {
    const list = renderer.anatomyPartsList.value
    if (!list || list.length === 0) return ''
    const parts = list.map(
      (ap) => `> - **${ap.part}** (AC ${ap.ac}, ${ap.hp} HP): ${ap.severEffect}`
    )
    return `\n> ### Breakable Anatomy\n>\n${parts.join('\n')}\n>`
  }

  const getRunehammerTrack = () => {
    const track = renderer.runehammerTrackData.value
    if (!track?.enabled || !track.events?.length) return ''
    const parts = track.events.map(
      (ev) => `> - **Round ${ev.round}: ${ev.name}** — ${ev.effect}`
    )
    return `\n> ### Escalation Track (${track.die.toUpperCase()})\n>\n${parts.join('\n')}\n>`
  }

  const getParagonPools = () => {
    const p = renderer.paragonData.value
    if (!p?.enabled) return ''
    return `\n> ### Paragon Boss Pools\n> The creature has **${p.poolsCount} stage pools** (${p.actionsPerTurn} actions/pool/round). ${p.transitionEffect ? p.transitionEffect : ''}\n>`
  }

  // formatted for the Homebrewery system
  // https://homebrewery.naturalcrit.com/
  const renderMarkdown = (twoCol = false) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s: any = {}
    for (const stat in monster.stats) {
      s[stat] = {
        score: monster.stats[stat as DndStat],
        bonus: renderModifier(monster.stats[stat as DndStat]),
      }
    }

    // Header values carry web chrome (number pills, advantage marks); they cross the same boundary.
    const saves = renderer.saves.value.trim() ? `\n> - **${t('monster.saves')}** ${mdFormatter(renderer.saves.value)}` : ''
    const skills =
      monster.skills.length === 0
        ? ''
        : `\n> - **${t('monster.skills')}** ${mdFormatter(renderer.skills.value)}`
    const vuln =
      monster.vulnerabilities.length === 0
        ? ''
        : `\n> - **${t('monster.vulnerabilities')}** ${mdFormatter(
            renderer.vulnerabilities.value
          )}`
    const resist =
      monster.resistances.length === 0
        ? ''
        : `\n> - **${t('monster.resistances')}** ${mdFormatter(renderer.resistances.value)}`
    const immune =
      monster.immunities.length === 0
        ? ''
        : `\n> - **${t('monster.immunities')}** ${mdFormatter(renderer.immunities.value)}`
    const condition =
      monster.conditions.length === 0
        ? ''
        : `\n> - **${t('monster.conditionImmunities')}** ${mdFormatter(
            renderer.conditions.value
          )}`
    const traits = getTraits()
    const mythicTrait = getMythicTrait()
    const spellcasting = getSpellcasting()
    const innate = getInnate()
    // The rendered entry already leads with its name unless a custom renderer omits it.
    const multiattack = renderer.multiattacks.value
    const multi =
      monster.multiattacks.length === 0
        ? ''
        : `\n> ${splitEntryLead(multiattack).title ? '' : '***Multiattack.*** '}${mdFormatter(multiattack)}\n>`
    const attacks = getAttacks()
    const actions = getActions()
    const bonusActions = getBonusActions()
    const legendary = getLegendaryActions()
    const mythic = getMythicActions()
    const reactions = getReactions()
    const villainActions = getVillainActions()
    const bloodiedActions = getBloodiedActions()
    const reactiveActions = getReactiveActions()
    const comboActions = getComboActions()
    const dracoAnatomy = getDracoAnatomy()
    const runehammer = getRunehammerTrack()
    const paragon = getParagonPools()
    const lair = getLairActions()
    const regional = getRegionalEffects()
    const inventory = getInventory()

    return `___${twoCol ? '\n___' : ''}
> ## ${monster.name}
>*${creatureTypeLine(monster.size, monster.type, monster.alignment)}*
> ___
> - **${t('monster.armorClass')}** ${monster.AC} ${
      monster.ACType === '' ? '' : `(${monster.ACType})`
    }
> - **${t('monster.hp.full')}** ${mdFormatter(renderer.hp.value)}


> - **${t('monster.movement.speed')}** ${mdFormatter(renderer.speeds.value)}
>___
>|STR|DEX|CON|INT|WIS|CHA|
>|:---:|:---:|:---:|:---:|:---:|:---:|
>|${s.STR.score} (${s.STR.bonus})|${s.DEX.score} (${s.DEX.bonus})|${
      s.CON.score
    } (${s.CON.bonus})|${s.INT.score} (${s.INT.bonus})|${s.WIS.score} (${
      s.WIS.bonus
    })|${s.CHA.score} (${s.CHA.bonus})|
>___${saves}${skills}${renderer.tools.value ? `\n> - **Tools** ${mdFormatter(renderer.tools.value)}` : ''}${vuln}${resist}${immune}${condition}${renderer.senses.value.trim() ? `\n> - **${t('editor.senses.label')}** ${mdFormatter(renderer.senses.value)}` : ''}${renderer.actionPassives.value ? `\n> - **Passive Checks** ${mdFormatter(renderer.actionPassives.value)}` : ''}${renderer.languages.value.trim() ? `\n> - **${t('monster.languages')}** ${mdFormatter(renderer.languages.value)}` : ''}
> - **${t('monster.challenge')}** ${mdFormatter(renderer.cr.value)}
>___
${traits}${mythicTrait}> ### ${t(
      'editor.action.label'
    )}${multi}${attacks}${actions}${
      renderer.classSpellcastingSlots.value.length === 0 ? '' : `${spellcasting}\n>`
    }${
      monster.spellcasting.atWill.length === 0 ? '' : `${innate}\n>`
    }${bonusActions}${legendary}${mythic}${reactions}${villainActions}${bloodiedActions}${reactiveActions}${comboActions}${dracoAnatomy}${runehammer}${paragon}${lair}${regional}${inventory}`
  }

  return {
    renderMarkdown,
  }
}
