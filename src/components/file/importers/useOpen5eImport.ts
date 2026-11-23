import { useQuasar } from 'quasar'
import {
  defaultAction,
  defaultAttack,
  defaultTrait,
  DndAttack,
  DndAtWillSpell,
  DndStat,
  Monster,
} from 'src/components/models'
import {
  bonusForSkill,
  saveModifierForStat,
  statModifier,
} from 'src/components/rendering/mathRendering'
import { CR, getCrByString } from 'src/data/CR'
import { SKILL } from 'src/data/SKILL'
import { useMonsterStore } from 'src/stores/monster-store'
import { v4 } from 'uuid'
import { useI18n } from 'vue-i18n'
import { Open5eAction, Open5eMonster } from '../Open5eData'
import _ from 'lodash'
import { useSpellsStore } from 'src/stores/spells-store'
import { useClasses } from 'src/data/CLASS'
import { useAutoUpdateCr } from 'src/components/editor/useAutoUpdateCr'
import { useRechargeTimes } from 'src/data/RECHARGE_TIME'
import {
  parseOpen5eActionHeader,
  parseOpen5eAttackDamage,
  parseOpen5eAttackHeader,
  parseOpen5eLegendaryCost,
} from 'src/core/domain/open5e-parse'

export function useOpen5eImport() {
  const monster = useMonsterStore()
  const spells = useSpellsStore()
  const { SrdClass } = useClasses()
  const { rechargeTimeKeys } = useRechargeTimes()
  const { autoUpdateCr } = useAutoUpdateCr()
  const $q = useQuasar()
  const { t } = useI18n()

  const StatMap: Record<DndStat, string> = {
    STR: 'strength',
    DEX: 'dexterity',
    CON: 'constitution',
    INT: 'intelligence',
    WIS: 'wisdom',
    CHA: 'charisma',
  }

  const StringToStat: Record<string, DndStat> = {
    strength: 'STR',
    dexterity: 'DEX',
    constitution: 'CON',
    intelligence: 'INT',
    wisdom: 'WIS',
    charisma: 'CHA',
  }

  // used for target count parsing.
  // I haven't actually seen more than one but it's possible
  // if more than 9 targets are specified the parser pops a warning.
  const wordToNumber: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
  }

  const importNote = (message: string) => {
    $q.notify({
      message,
      type: 'warning',
      timeout: 0,
      multiLine: true,
      actions: [{ label: t('editor.ok'), color: 'white' }],
    })
  }

  const replaceMdStrings = (input: string): string => {
    const bold = RegExp(/\*\*([^\*]+)\*\*/gi)
    let modifiedInput = input.replace(bold, (match, text) => {
      return `<b>${text}</b>`
    })

    modifiedInput = modifiedInput.replaceAll('\n', '<br>')

    return modifiedInput
  }

  const replaceFormattingStrings = (input: string): string => {
    const dice = RegExp(/\d+\s\((\d+)d(\d+)[ ]*([+-][ ]*\d+)?\)/gi)
    const modInput = input.replace(dice, (match, count, dice, modifier) => {
      return `{${count}d${dice}${modifier ? modifier : ''}}`
    })

    return replaceMdStrings(modInput)
  }

  const processAction = (a: Open5eAction, legendaryOnly = false) => {
    const parsed = parseOpen5eActionHeader(a.name, a.desc)
    const newAction = defaultAction()
    newAction.name = parsed.name
    newAction.recharge = parsed.recharge
    if (parsed.limitedUseCount > 0) {
      newAction.limitedUse.count = parsed.limitedUseCount
      newAction.limitedUse.rate = parsed.limitedUseRate
    }
    newAction.description = replaceFormattingStrings(a.desc)
    newAction.legendaryOnly = legendaryOnly
    newAction.bonusAction = parsed.bonusAction

    autoUpdateCr(newAction.description, newAction.crAnnotation)

    monster.actions.push(newAction)

    return newAction.id
  }

  const processSpellcasting = (desc: string) => {
    // oh boy
    const level = new RegExp(/is an? (\d+)(?:st|nd|th)-level/gi)
    const stat = new RegExp(/spellcasting ability is (\w+)/gi)
    const cls = new RegExp(/following (\w+) spells?/gi)
    const dc = new RegExp(/spell save DC (\d+)/gi)
    const toHit = new RegExp(/\+(\d+) to hit/gi)

    // the stat determines the modifiers, though we should check after the fact if the DCs match...
    const levelMatch = level.exec(desc)
    if (levelMatch != null) {
      monster.spellcasting.level = parseInt(levelMatch[1])
    } else {
      importNote(t('import.error.spellcasterLevel', [desc]))
    }

    const clsMatch = cls.exec(desc)
    if (clsMatch != null) {
      monster.spellcasting.class =
        clsMatch[1].toUpperCase() in SrdClass
          ? clsMatch[1].toUpperCase()
          : clsMatch[1]
    }

    const statMatch = stat.exec(desc)
    if (statMatch != null) {
      const stat: DndStat = StringToStat[statMatch[1].toLowerCase()]
      monster.spellcasting.stat = stat

      // modifier check
      const dcMatch = dc.exec(desc)
      const toHitMatch = toHit.exec(desc)
      if (dcMatch != null) {
        const targetSpellSave = parseInt(dcMatch[1])

        if (monster.spellSave !== targetSpellSave) {
          monster.spellcasting.save.override = true
          monster.spellcasting.save.overrideValue = targetSpellSave
        }
      }

      if (toHitMatch != null) {
        const targetToHit = parseInt(toHitMatch[1])

        if (monster.spellAttackModifier !== targetToHit) {
          monster.spellcasting.attack.override = true
          monster.spellcasting.attack.overrideValue = targetToHit
        }
      }
    } else {
      importNote(t('import.error.spellcasterStat', [desc]))
    }

    // spell list time
    const spellLists = [
      ...desc.matchAll(
        /(cantrips?)(?= \(at will\): ([^\n$]+))|(\d+)(?:st|nd|th) level \((\d+) slots?\): ([^\n$]+)/gi
      ),
    ]
    const unavailableSpells = [] as string[]

    // snapshot the spell names, casing issue
    const validSpellNames = Object.keys(spells.allSpells)
    const validSpells = [] as string[]

    spellLists.forEach((sl) => {
      console.log(`[Import] Processing spell list ${sl[0]}`)
      // check if cantrip list or not
      if (sl[1] != null) {
        // cantrip
        const spellNames = sl[2]
          .split(',')
          .map((s) => _.trim(s).replaceAll('*', ''))

        spellNames.forEach((s) => {
          const name = validSpellNames.find((name) => name.toLowerCase() === s)

          if (name != null) {
            validSpells.push(name)
          } else {
            unavailableSpells.push(s)
          }
        })
      } else {
        // not cantrip
        // one of the conditions has to match and if the first one is null then it's a level
        const level = parseInt(sl[3])
        const slots = parseInt(sl[4])
        const spellNames = sl[5]
          .split(',')
          .map((s) => _.trim(s).replaceAll('*', ''))

        monster.spellcasting.slots[level - 1] = slots

        spellNames.forEach((s) => {
          const name = validSpellNames.find((name) => name.toLowerCase() === s)

          if (name != null) {
            validSpells.push(name)
          } else {
            unavailableSpells.push(s)
          }
        })
      }
    })

    monster.spellcasting.standard = validSpells

    if (unavailableSpells.length > 0) {
      importNote(t('import.error.spells', [unavailableSpells.join(', ')]))
    }
  }

  const processInnateSpellcasting = (desc: string) => {
    // oh boy
    const stat = new RegExp(/spellcasting ability is (\w+)/gi)
    const dc = new RegExp(/spell save DC (\d+)/gi)
    const toHit = new RegExp(/\+(\d+) to hit/gi)

    // the stat determines the modifiers, though we should check after the fact if the DCs match...
    const statMatch = stat.exec(desc)
    if (statMatch != null) {
      const stat: DndStat = StringToStat[statMatch[1].toLowerCase()]
      monster.spellcasting.stat = stat

      // modifier check
      const dcMatch = dc.exec(desc)
      const toHitMatch = toHit.exec(desc)
      if (dcMatch != null) {
        const targetSpellSave = parseInt(dcMatch[1])

        if (monster.spellSave !== targetSpellSave) {
          monster.spellcasting.save.override = true
          monster.spellcasting.save.overrideValue = targetSpellSave
        }
      }

      if (toHitMatch != null) {
        const targetToHit = parseInt(toHitMatch[1])

        if (monster.spellAttackModifier !== targetToHit) {
          monster.spellcasting.attack.override = true
          monster.spellcasting.attack.overrideValue = targetToHit
        }
      }
    } else {
      importNote(t('import.error.innateSpellcasting', [desc]))
    }

    // spell list time
    const spellLists = [
      ...desc.matchAll(/(?:(at will)|(\d+)\/([^:]+)): ([^\n]+)/gi),
    ]
    const unavailableSpells = [] as string[]

    // snapshot the spell names, casing issue
    const validSpellNames = Object.keys(spells.allSpells)

    spellLists.forEach((sl) => {
      // each of these lists is separate so reinit this each loop
      const validSpells = [] as string[]
      console.log(`[Import] Processing spell list ${sl[0]}`)

      // rate check
      const newSpellList: DndAtWillSpell = {
        id: v4(),
        count: 0,
        rate: '',
        spells: [],
      }

      if (sl[1] != null) {
        newSpellList.rate = sl[1]

        const maybeKey = newSpellList.rate.toUpperCase().replaceAll(' ', '_')
        if (rechargeTimeKeys.includes(maybeKey)) {
          newSpellList.rate = maybeKey
        } else {
          importNote(t('import.error.innateRate', [sl[0]]))
        }
      } else if (sl[2] != null) {
        newSpellList.rate = sl[3]

        const maybeKey = newSpellList.rate.toUpperCase().replaceAll(' ', '_')
        if (rechargeTimeKeys.includes(maybeKey)) {
          newSpellList.rate = maybeKey
        } else {
          importNote(t('import.error.innateRate', [sl[0]]))
        }

        // count
        newSpellList.count = parseInt(sl[2])
      } else {
        importNote(t('import.error.innateSpellList', [sl[0]]))
      }

      // spell validation
      const spellNames = sl[4]
        .split(',')
        .map((s) => _.trim(s).replaceAll('*', ''))

      spellNames.forEach((s) => {
        const name = validSpellNames.find((name) => name.toLowerCase() === s)

        if (name != null) {
          validSpells.push(name)
        } else {
          unavailableSpells.push(s)
        }
      })

      newSpellList.spells = validSpells
      monster.spellcasting.atWill.push(newSpellList)
    })

    if (unavailableSpells.length > 0) {
      importNote(t('import.error.spells', [unavailableSpells.join(', ')]))
    }
  }

  const processTrait = (a: Open5eAction) => {
    console.log(`[Import] Processing trait ${a.name}`)

    // is secretly a bonus action
    const isBonusAction = a.desc.match(/^as a bonus action/gi) != null
    if (isBonusAction) {
      processAction(a, false)
    } else {
      // if we're dealing with spellcasting we're in for a time
      if (a.name.toLowerCase() === 'innate spellcasting') {
        processInnateSpellcasting(a.desc)
      } else if (a.name.toLowerCase() === 'spellcasting') {
        processSpellcasting(a.desc)
      } else {
        const newTrait = defaultTrait()
        newTrait.name = a.name
        newTrait.description = a.desc

        // check for limited use
        const limited = RegExp(/\((\d+)\/(\w+)\)/gi)
        const matches = limited.exec(a.name)
        if (matches != null) {
          newTrait.limitedUse.count = parseInt(matches[1])
          newTrait.limitedUse.rate = matches[2].toUpperCase()
          newTrait.name = a.name.substring(0, a.name.indexOf('(') - 1)
        }

        // replace dice strings
        newTrait.description = replaceFormattingStrings(newTrait.description)
        autoUpdateCr(newTrait.description, newTrait.crAnnotation)

        monster.traits.push(newTrait)
      }
    }
  }

  const guessAttackBonus = (
    target: number,
    order: DndAttack['kind']
  ): DndStat | undefined => {
    const searchOrder: DndStat[] =
      order === 'WEAPON'
        ? ['STR', 'DEX', 'CON', 'CHA', 'WIS', 'INT']
        : ['CHA', 'WIS', 'INT', 'STR', 'DEX', 'CON']

    for (const stat of searchOrder) {
      // check the attack modifier, proficiency assumed
      const modifier = statModifier(monster.stats[stat]) + monster.proficiency

      if (modifier === target) {
        console.log(`[Import] guessing ${stat} for modifier ${target}`)
        return stat
      }
    }

    // use the override
    return undefined
  }

  const processAttack = (a: Open5eAction) => {
    const newAttack = defaultAttack()
    const hdr = parseOpen5eAttackHeader(a.desc)
    if (hdr == null) {
      importNote(t('import.error.attackFail', [a.name, a.desc]))
      return
    }

    newAttack.distance = hdr.distance
    newAttack.kind = hdr.kind
    const attackStat = guessAttackBonus(hdr.toHit, newAttack.kind)
    if (attackStat != undefined) {
      newAttack.modifier.stat = attackStat
      newAttack.modifier.proficient = true
    } else {
      newAttack.modifier.stat = newAttack.kind === 'SPELL' ? 'WIS' : 'STR'
      newAttack.modifier.override = true
      newAttack.modifier.overrideValue = hdr.toHit
    }

    newAttack.range.reach = hdr.reach
    newAttack.range.standard = hdr.standard
    newAttack.range.long = hdr.long

    const targets = wordToNumber[hdr.targetWord]
    if (targets != null) {
      newAttack.targets = targets
    } else {
      importNote(t('import.error.targets', [a.name, hdr.targetWord]))
    }

    const dmg = parseOpen5eAttackDamage(a.desc)
    if (dmg != null) {
      newAttack.damage.count = dmg.count
      newAttack.damage.dice = dmg.dice
      if (dmg.modifier != null) {
        newAttack.damage.modifier.stat = newAttack.modifier.stat
        if (statModifier(monster.stats[newAttack.damage.modifier.stat]) !== dmg.modifier) {
          newAttack.damage.modifier.override = true
          newAttack.damage.modifier.overrideValue = dmg.modifier
        }
      } else {
        newAttack.damage.modifier.override = true
        newAttack.damage.modifier.overrideValue = 0
      }

      newAttack.damage.type = dmg.type
      for (const extra of dmg.additionalDamage) {
        newAttack.additionalDamage.push({ id: v4(), ...extra })
      }
      if (dmg.andClause) {
        newAttack.description = `${newAttack.description}, ${dmg.andClause}`
      }
      if (dmg.trailing) {
        newAttack.description = `${newAttack.description} ${dmg.trailing}`.trim()
      }
    } else {
      importNote(t('import.error.attackDamageFail', [a.name, a.desc]))
    }

    newAttack.name = a.name
    newAttack.description = replaceFormattingStrings(newAttack.description)
    monster.attacks.push(newAttack)
  }

  const processLegendaryActions = (desc: string, actions: Open5eAction[]) => {
    // first, get the number of actions.
    const laCount = new RegExp(/can take (\d+) legendary actions?/gi)
    const countMatches = laCount.exec(desc)

    monster.legendaryActions.useCustomPreamble = true
    monster.legendaryActions.customPreamble = desc

    if (countMatches != null) {
      monster.legendaryActions.count = parseInt(countMatches[1])
    } else {
      console.log(
        `Legendary action error. Unable to find action count. ${desc}`
      )
      importNote(t('import.error.legendaryCount', [desc]))
    }

    // action iteration
    actions.forEach((a) => {
      const { cost, baseName: name } = parseOpen5eLegendaryCost(a.name)

      // match an attack using the normalized base name (without cost suffix)
      const normalizedName = name.trim().toLowerCase()
      const existingAttack = monster.attacks.find(
        (atk) => atk.name.toLowerCase().includes(normalizedName)
      )

      if (existingAttack != null) {
        monster.addLegendaryAction(existingAttack.id, cost)
      } else {
        const id = processAction({ name, desc: a.desc }, true)
        monster.addLegendaryAction(id, cost)
      }
    })
  }

  const importOpen5eMonster = (data: Open5eMonster): boolean => {
    // reset the entire monster
    monster.$reset()

    // let's go in order from the top
    // basics
    monster.name = data.name
    monster.size = data.size
    monster.type = `${data.type}${
      data.subtype === '' ? '' : ` ${data.subtype}`
    }`
    monster.alignment = data.alignment
    monster.AC = data.armor_class
    monster.ACType = data.armor_desc ?? ''
    monster.languages = data.languages

    // challenge rating
    const cr = getCrByString(data.challenge_rating) ?? CR[0]
    monster.CR = cr.index
    monster.proficiency = cr.proficiency

    // core stats
    Object.entries(StatMap).forEach(([stat, dataKey]) => {
      monster.stats[stat as DndStat] = (data as unknown as Record<string, number>)[dataKey]
    })

    // let's parse hp
    const dice = RegExp(/(\d+)d(\d+)[ ]*([+-][ ]*\d+)?/gi)
    const dieMatches = dice.exec(data.hit_dice)

    if (dieMatches) {
      monster.HP.HD = parseInt(dieMatches[1])
      monster.HP.type = parseInt(dieMatches[2])
      monster.HP.modifier = dieMatches[3] == null ? 0 : parseInt(dieMatches[3])
    } else {
      importNote(t('import.error.hp', [data.hit_dice]))
    }

    // speeds
    monster.speeds = []
    for (const spd of Object.entries(data.speed)) {
      monster.speeds.push({
        id: v4(),
        type: spd[0],
        speed: spd[1],
        note: '',
      })
    }

    // saves is interesting in this format
    Object.entries(StatMap).forEach(([stat, dataKey]) => {
      const saveKey = `${dataKey}_save`

      const save: number | null = (data as unknown as Record<string, number | null>)[saveKey]

      if (save != null) {
        // assume proficiency
        monster.saves[stat as DndStat].proficient = true

        // check if the proficient value is the same as the expected
        const expectedSaveValue = saveModifierForStat(monster, stat as DndStat)

        if (expectedSaveValue !== save) {
          // override it instead
          console.log(
            `[Import] Save different than proficiency expected, overriding. ${stat} expected ${expectedSaveValue} got ${save}`
          )
          monster.saves[stat as DndStat].override = true
          monster.saves[stat as DndStat].overrideValue = save
        }
      }
    })

    // check passive perception
    const expectedPassivePerception = monster.computedPassivePerception
    if (expectedPassivePerception !== data.perception) {
      monster.passivePerception.override = true
      monster.passivePerception.overrideValue = data.perception
    }

    // skills
    // note that this will dynamically update passive perception if a large enough bonus
    // is applied
    Object.entries(data.skills).forEach(([name, value]) => {
      const key = name.toUpperCase().replaceAll(' ', '_')

      const skillData = SKILL[key]

      if (skillData != null) {
        const skill = {
          key,
          skill: skillData,
          proficient: false,
          expertise: false,
          override: false,
          overrideValue: value,
        }

        // check what flags we need to set
        const rawStat = bonusForSkill(monster, skill)

        skill.proficient = true
        const profStat = bonusForSkill(monster, skill)

        skill.expertise = true
        const expStat = bonusForSkill(monster, skill)

        // lol gross
        if (value === rawStat) {
          skill.proficient = false
          skill.expertise = false
        } else if (value === profStat) {
          skill.proficient = true
          skill.expertise = false
        } else if (value === expStat) {
          skill.expertise = true
          skill.proficient = false
        } else {
          skill.proficient = false
          skill.expertise = false
          skill.override = true
        }

        monster.skills.push(skill)
      } else {
        console.log(
          `[Import] Failed to resolve skill for key ${key}. Raw value: ${name}`
        )
        importNote(t('import.error.skill', [key, name]))
      }
    })

    // senses
    // need to split the string and look for keywords
    const splitSenses = data.senses.split(',')
    splitSenses.forEach((sense) => {
      // split on the ' ' again and filter empty string
      const fragments = sense.split(' ').filter((s) => s !== '')

      // first element is the name
      const key = fragments[0].toLowerCase()
      if (key in monster.senses) {
        monster.senses[key as keyof Monster['senses']] = parseInt(fragments[1])
      } else if (key !== 'passive') {
        console.log(`[Import] Unknown sense: ${key}`)
        importNote(t('import.error.sense', [key]))
      }
    })

    // condition things!
    // this is far from perfect but you can adjust if you need
    monster.vulnerabilities = data.damage_vulnerabilities
      .split(', ')
      .filter((s) => s !== '')
    monster.resistances = data.damage_resistances
      .split(', ')
      .filter((s) => s !== '')
    monster.immunities = data.damage_immunities
      .split(', ')
      .filter((s) => s !== '')
    monster.conditions = data.condition_immunities
      .split(', ')
      .filter((s) => s !== '')

    // now it's time for suffering
    if (data.actions !== '') {
      data.actions.forEach((a) => {
        // attack or not
        // attacks are very specific so we need to check if the action is an attack
        if (a.desc.startsWith('Melee') || a.desc.startsWith('Ranged')) {
          // process the attack
          console.log(`[Import] Processing attack ${a.name}`)
          processAttack(a)
        } else {
          console.log(`[Import] Processing action ${a.name}`)
          // special case for multiattack
          if (a.name === 'Multiattack') {
            // process multiattack
            importNote(t('import.multiattack'))

            // need to add a group to force the render
            monster.multiattacks.push({
              id: v4(),
              attacks: [],
              actions: [],
            })

            monster.multiattackOptions.useCustomRenderer = true
            monster.multiattackOptions.customMultiattackRenderer =
              replaceFormattingStrings(a.desc)
          } else {
            // process the action
            processAction(a)
          }
        }
      })
    }

    // traits aren't that bad though
    if (data.special_abilities !== '') {
      data.special_abilities.forEach((t) => {
        processTrait(t)
      })
    }

    if (data.reactions != null && data.reactions !== '') {
      data.reactions.forEach((r) => {
        monster.reactions.push({
          id: v4(),
          name: r.name,
          description: replaceFormattingStrings(r.desc),
          limitedUse: {
            count: 0,
            rate: 'DAY',
          },
          trigger: '',
        })
      })
    }

    // Process legendary actions if specified in import payload
    if (data.legendary_desc !== '' && data.legendary_actions != '') {
      processLegendaryActions(data.legendary_desc, data.legendary_actions)
    }

    // force save
    monster.$persist()
    return true
  }

  return {
    importOpen5eMonster,
  }
}
