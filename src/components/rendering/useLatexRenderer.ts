import N2W from 'number-to-words'
import { CR } from 'src/data/CR'
import { useMonsterStore } from 'src/stores/monster-store'
import { resolvingMonsterView } from 'src/core/usecases/ResolveMonsterText'
import { useI18n } from 'vue-i18n'
import { renderBonus, statModifier } from './mathRendering'
import { listJoin, useProcessTokens } from './useProcessTokens'
import { useTextRenderer } from './useTextRenderer'
import { creatureTypeLine, escapeLatexText, splitEntryLead } from 'src/core/domain/export-markup'
import { resolveSpellcastingPlacement } from 'src/core/domain/export-contract'
import { useEditorStore } from 'src/stores/editor-store'

// one change to the LaTeX renderer is that I'm dropping the \DndDice command
// if you're exporting from here you can selectively replace that where you need it, the
// existing formatting is equivalent
// the LaTeX renderer is also more rigid than the other renderers, so formatting might not carry over.
export function useLatexRenderer() {
  // Fields read directly print resolved, exactly as the stat block does.
  const monster = resolvingMonsterView(useMonsterStore())
  // Exports print prose in every visual template: plates are web markup.
  const renderer = useTextRenderer({ web: false })
  const editor = useEditorStore()
  const { latexFormatter, processTokens } = useProcessTokens({ web: false })
  const { t } = useI18n()

  const getTraits = () => {
    const traits = renderer.traits.value
      .map((t) => latexFormatter(t))
      .join('\n')
    return traits
  }

  const getAtWill = () => {
    const spellcasting = monster.spellcasting

    return `${latexFormatter(renderer.innateSpellcastingPreamble.value)}
  \\begin{DndMonsterSpells}
    ${spellcasting.atWill
      .map((s) => {
        return `\\DndInnateSpellLevel${
          s.count > 0 ? `[${s.count}]` : ''
        }{${s.spells.join(', ')}}`
      })
      .join('\n    ')}
  \\end{DndMonsterSpells}
  `
  }

  const getStandard = () => {
    const preamble = latexFormatter(renderer.classSpellcastingPreamble.value)
    const rows = renderer.classSpellcastingSlots.value.map((row) =>
      `\\par ${latexFormatter(`${row.renderedLabel} ${row.renderedSpells}`)}`
    )
    return [preamble, ...rows].join('\n  ')
  }

  // note that the latex formatter does not respect custom formatting
  // due to the way the command is formatted. so this is basically another renderer
  const getAttacks = () => {
    const renderedAttacks = []

    for (const attack of monster.attacks) {
      const showRange = attack.distance !== 'MELEE'
      const showReach = attack.distance !== 'RANGED'
      const distance =
        attack.distance === 'BOTH' ? 'both' : attack.distance.toLowerCase()
      const type = attack.kind.toLowerCase()
      const damageBonus = monster.attackDamageModifier(attack.id)
      const altBonus = attack.alternateDamage.modifier.override
        ? attack.alternateDamage.modifier.overrideValue
        : statModifier(monster.stats[attack.alternateDamage.modifier.stat])

      // library only has one plus damage field so we'll just kinda fill that out manually
      const additionalDamage = attack.additionalDamage.map((ad) => {
        return `\\DndDice{${ad.count}d${ad.dice}} ${ad.type}${ad.note}`
      })

      renderedAttacks.push(`\\DndMonsterAttack[
      name=${escapeLatexText(attack.name)},
      distance=${distance},
      type=${type},
      mod=${renderBonus(monster.attackModifier(attack.id))},
      ${!showReach ? '%' : ''}reach=${attack.range.reach},
      ${!showRange ? '%' : ''}range=${attack.range.standard}/${
        attack.range.long
      },
      targets=${N2W.toWords(attack.targets)} target${
        attack.targets === 1 ? '' : 's'
      },
      dmg=\\DndDice{${attack.damage.count}d${attack.damage.dice}${renderBonus(
        damageBonus
      )}},
      dmg-type=${attack.damage.type},
      ${additionalDamage.length === 0 ? '%' : ''}plus-dmg={${listJoin(
        additionalDamage,
        ', '
      )}},
      ${!attack.alternateDamage.active ? '%' : ''}or-dmg=\\DndDice{${
        attack.alternateDamage.count
      }d${attack.alternateDamage.dice}${renderBonus(altBonus)}},
      ${!attack.alternateDamage.active ? '%' : ''}or-dmg-when={${
        attack.alternateDamage.condition
      }},
      extra={${latexFormatter(
        processTokens(attack.description, attack, monster, 'attack')
      )}}
    ]`)
    }

    return renderedAttacks.join('\n\n  ')
  }

  const getMultiattack = () => {
    return latexFormatter(renderer.multiattacks.value)
  }

  const getActions = () => {
    return renderer.actions.value.map((a) => latexFormatter(a)).join('\n ')
  }

  const getBonusActions = () => {
    if (renderer.bonusActions.value.length > 0) {
      return `\\DndMonsterSection{${t(
        'monster.bonusActions'
      )}}\n${renderer.bonusActions.value
        .map((a) => latexFormatter(a))
        .join('\n ')}`
    }

    return ''
  }

  // Rendered entries carry structured mechanics; the template's legendary list keeps its own layout.
  const legendaryList = (entries: string[]) => {
    const items = entries.map((entry) => {
      const { title, body } = splitEntryLead(entry)
      return `\\DndMonsterLegendaryAction{${latexFormatter(title)}}{${latexFormatter(body)}}`
    })
    return `\\begin{DndMonsterLegendaryActions}
    ${items.join('\n    ')}
  \\end{DndMonsterLegendaryActions}`
  }

  const getLegendary = () => {
    const preamble = latexFormatter(renderer.legendaryPreamble.value)

    return `\\DndMonsterSection{Legendary Actions}
  ${preamble}
  ${legendaryList(renderer.legendaryActions.value)}`
  }

  const getMythicTrait = () => {
    return latexFormatter(renderer.mythicTrait.value)
  }

  const getMythic = () => {
    const preamble = latexFormatter(renderer.mythicPreamble.value)

    return `\\DndMonsterSection{Mythic Actions}
  ${preamble}
  ${legendaryList(renderer.mythicActions.value)}`
  }
  const getReactions = () => {
    const formattedReactions = renderer.reactions.value.map((r) =>
      latexFormatter(r)
    )

    return `\\DndMonsterSection{Reactions}
    ${formattedReactions.join('\n  ')}
  `
  }

  const getLairActions = () => {
    const preamble = `\\DndMonsterSection{${t('editor.lair.label')}}
${latexFormatter(renderer.lairActionPreamble.value)}`

    const formattedLairActions = renderer.lairActions.value.map((a) => {
      return `\\item ${latexFormatter(a)}`
    })

    return `${preamble}
    \\begin{itemize}
      ${formattedLairActions.join('\n')}
    \\end{itemize}`
  }

  const getRegionalEffects = () => {
    const preamble = `\\DndMonsterSection{${t('editor.regional.label')}}
  ${latexFormatter(renderer.regionalEffectPreamble.value)}`

    const formattedEffects = renderer.regionalEffects.value.map((a) => {
      return `\\item ${latexFormatter(a)}`
    })

    return `${preamble}
    \\begin{itemize}
      ${formattedEffects.join('\n')}
    \\end{itemize}`
  }

  const getInventory = () => {
    return `\\DndMonsterSection{${t(
      'editor.inventory.label'
    )}}\n${latexFormatter(renderer.inventory.value)}`
  }

  // exporter for the rpgtex template
  // https://github.com/rpgtex/DND-5e-LaTeX-Template
  // notes:
  // - latex renderer does not support custom cr values
  const renderLatex = (twoCol = false) => {
    const saves = renderer.saves.value
    const placement = resolveSpellcastingPlacement(editor.spellcastingPlacement, 'export')
    const spellBlock = `${monster.spellcasting.atWill.length > 0 ? getAtWill() : ''}

  ${renderer.classSpellcastingSlots.value.length > 0 ? getStandard() : ''}`

    return `\\begin{DndMonster}[${twoCol ? 'width=\\textwidth + 8pt' : ''}]{${
      escapeLatexText(monster.name)
    }}
  ${twoCol ? '\\begin{multicols}{2}' : ''}
  \\DndMonsterType{${escapeLatexText(creatureTypeLine(monster.size, monster.type, monster.alignment))}}
  \\DndMonsterBasics[
    armor-class = {${monster.AC}${
      monster.ACType === '' ? '' : ` (${escapeLatexText(monster.ACType)})`
    }},
    hit-points = {\\DndDice{${monster.HP.HD}d${monster.HP.type}${renderBonus(
      monster.HP.modifier
    )}}},
    speed = {${latexFormatter(renderer.speeds.value)}}
  ]

  \\DndMonsterAbilityScores[
    str = ${monster.stats.STR},
    dex = ${monster.stats.DEX},
    con = ${monster.stats.CON},
    int = ${monster.stats.INT},
    wis = ${monster.stats.WIS},
    cha = ${monster.stats.CHA},
  ]

  \\DndMonsterDetails[
    ${saves === '' ? '%' : ''}saving-throws = {${latexFormatter(saves)}},
    ${monster.skills.length === 0 ? '%' : ''}skills = {${latexFormatter(
      renderer.skills.value
    )}},
    ${
      renderer.vulnerabilities.value === '' ? '%' : ''
    }damage-vulnerabilities = {${latexFormatter(renderer.vulnerabilities.value)}},
    ${renderer.resistances.value === '' ? '%' : ''}damage-resistances = {${latexFormatter(
      renderer.resistances.value
    )}},
    ${renderer.immunities.value === '' ? '%' : ''}damage-immunities = {${latexFormatter(
      renderer.immunities.value
    )}},
    ${renderer.conditions.value === '' ? '%' : ''}condition-immunities = {${latexFormatter(
      renderer.conditions.value
    )}},
    senses = {${latexFormatter(renderer.senses.value)}},
    languages = {${latexFormatter(renderer.languages.value)}},
    challenge = {${CR[monster.CR].cr}},
  ]

  % Traits
  ${getTraits()}

  ${monster.mythicActions.actions.length > 0 ? getMythicTrait() : ''}
  ${placement === 'with_traits' ? spellBlock : ''}
  ${placement === 'before_actions' ? spellBlock : ''}

  % Actions
  \\DndMonsterSection{${t('editor.action.label')}}
  ${monster.multiattacks.length > 0 ? getMultiattack() : ''}

  ${getAttacks()}

  ${getActions()}

  ${placement === 'after_actions' ? `% Spellcasting\n  ${spellBlock}` : ''}

  ${getBonusActions()}

  ${monster.legendaryActions.count > 0 ? getLegendary() : ''}

  ${monster.mythicActions.actions.length > 0 ? getMythic() : ''}

  ${monster.reactions.length > 0 ? getReactions() : ''}

  ${monster.lairActions.length > 0 ? getLairActions() : ''}

  ${monster.regionalEffects.length > 0 ? getRegionalEffects() : ''}

  ${monster.inventory !== '' ? getInventory() : ''}

  ${twoCol ? '\\end{multicols}' : ''}
\\end{DndMonster}`
  }

  return {
    renderLatex,
  }
}
