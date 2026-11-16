import { sourceEffectiveSpells } from 'src/core/domain/casting-source-selection'
import { sortBy } from 'lodash'
import { DndAttack, DndStat, MonsterSkill } from 'src/components/models'
import { avgHP, avgRoll, bonusForAttack, bonusForAttackDamage, bonusForConditionalDamage, bonusForSkill, saveModifier, statModifier } from 'src/components/rendering/mathRendering'
import { useI18n } from 'vue-i18n'
import type { Monster } from 'src/components/models'

// Getters that read only the monster state (no `this`), spread into the monster store's getters (C1b split).
export const monsterStateGetters = {
  statsWithModifiers: (state: Monster) => {
    const statKeys = Object.keys(state.stats) as (keyof typeof state.stats)[]

    return statKeys.map((k) => {
      return {
        stat: k,
        score: state.stats[k],
        modifier: statModifier(state.stats[k]),
      }
    })
  },
  avgHp: (state: Monster) => {
    return avgHP(state.HP)
  },
  computedPassivePerception: (state: Monster) => {
    // first check the override
    if (state.passivePerception?.override) {
      return state.passivePerception.overrideValue
    }

    // non-override, default computation
    // check if perception is in the skills
    const perception = state.skills.find(
      (s) => String(s.key ?? '').toUpperCase() === 'PERCEPTION'
    )
    let passive = 10

    if (perception) {
      passive += bonusForSkill(state, perception)
      if (perception.advantage) passive += 5
      if (perception.disadvantage) passive -= 5
    } else {
      passive += statModifier(state.stats.WIS)
    }

    return passive
  },
  defaultSaveBonus: (state: Monster) => {
    return (stat: keyof typeof state.stats) => {
      const proficient = state.saves[stat].proficient
      return saveModifier(
        state.stats[stat],
        proficient ? state.proficiency : 0
      )
    }
  },
  defaultSkillBonus: (state: Monster) => {
    return (skill: MonsterSkill) => {
      const proficient = skill.proficient
      // back compat safety
      const expertise = skill.expertise ? skill.expertise : false

      return saveModifier(
        state.stats[skill.skill.stat],
        expertise ? state.proficiency * 2 : proficient ? state.proficiency : 0
      )
    }
  },
  defaultSpellSave: (state: Monster) => {
    return (stat: keyof typeof state.stats) =>
      8 + state.proficiency + statModifier(state.stats[stat])
  },
  defaultSpellAttackModifier: (state: Monster) => {
    return (stat: keyof typeof state.stats) => {
      return state.proficiency + statModifier(state.stats[stat])
    }
  },
  defaultSpellModifier: (state: Monster) => {
    return (stat: DndStat) => {
      return statModifier(state.stats[stat])
    }
  },
  attackModifier: (state: Monster) => {
    return (id: string): number => {
      const attack = state.attacks.find((a) => a.id === id)

      if (attack) {
        return bonusForAttack(state, attack)
      }

      return 0
    }
  },
  attackDamageModifier: (state: Monster) => {
    return (id: string): number => {
      const attack = state.attacks.find((a) => a.id === id)

      if (attack) {
        return bonusForAttackDamage(state, attack)
      }

      return 0
    }
  },
  conditionalDamageModifier: (state: Monster) => {
    return (id: string): number => {
      const attack = state.attacks.find((a) => a.id === id)

      if (attack) {
        return bonusForConditionalDamage(state, attack)
      }

      return 0
    }
  },
  expectedAttackDamage: (state: Monster) => {
    return (attack: DndAttack) => {
      const primary =
        avgRoll(attack.damage?.count ?? 0, attack.damage?.dice ?? 'd6') +
        (attack.damage?.modifier?.override
          ? (attack.damage.modifier.overrideValue ?? 0)
          : statModifier(state.stats[attack.damage?.modifier?.stat ?? 'STR']))

      const secondary =
        avgRoll(attack.alternateDamage?.count ?? 0, attack.alternateDamage?.dice ?? 'd6') +
        (attack.alternateDamage?.modifier?.override
          ? (attack.alternateDamage.modifier.overrideValue ?? 0)
          : statModifier(state.stats[attack.alternateDamage?.modifier?.stat ?? 'STR']))

      const base = attack.alternateDamage.active
        ? Math.max(primary, secondary)
        : primary

      const extra = attack.additionalDamage
        .map((a) => avgRoll(a.count, a.dice))
        .reduce((acc, current) => acc + current, 0)

      return (base + extra) * attack.targets
    }
  },
  attackName: (state: Monster) => {
    return (attackId: string) => {
      if (!attackId) return ''
      const attack = state.attacks.find((a) => a.id === attackId)
      if (attack) return attack.name
      const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const byName = state.attacks.find((a) => norm(a.name) === norm(attackId))
      if (byName) return byName.name
      return attackId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
  },
  actionName: (state: Monster) => {
    return (actionId: string) => {
      if (!actionId) return ''
      const action = state.actions.find((a) => a.id === actionId)
      if (action) return action.name
      const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const byName = state.actions.find((a) => norm(a.name) === norm(actionId))
      if (byName) return byName.name
      return actionId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
  },
  attacksAndActions: (state: Monster) => {
    return (t: ReturnType<typeof useI18n>) => {
      // concatenates actions and attacks for use in a list
      const actions = state.actions.map((a) => {
        return {
          name: a.name,
          id: a.id,
          typeInternal: 'action',
          type: t('editor.action.tokenLabel'),
        }
      })

      const attacks = state.attacks.map((a) => {
        return {
          name: a.name,
          id: a.id,
          typeInternal: 'attack',
          type: t('editor.attack.tokenLabel'),
        }
      })

      return sortBy([...actions, ...attacks], 'name')
    }
  },
  legendaryActionName: (state: Monster) => {
    return (id: string) => {
      if (!id) return ''
      const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const targetNorm = norm(id)

      // 1. Exact ID match
      const maybeAction = state.actions.find((a) => a.id === id)
      if (maybeAction) return maybeAction.name

      const maybeAttack = state.attacks.find((a) => a.id === id)
      if (maybeAttack) return maybeAttack.name

      // 2. Case-insensitive or normalized name match
      const actionByName = state.actions.find((a) => a.name.trim().toLowerCase() === id.trim().toLowerCase() || norm(a.name) === targetNorm)
      if (actionByName) return actionByName.name

      const attackByName = state.attacks.find((a) => a.name.trim().toLowerCase() === id.trim().toLowerCase() || norm(a.name) === targetNorm)
      if (attackByName) return attackByName.name

      // 3. Fallback clean name instead of [Invalid Id]
      return id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
  },
  legendaryAction: (state: Monster) => {
    return (id: string) => {
      if (!id) return undefined
      const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const targetNorm = norm(id)

      // 1. Exact ID match
      const maybeAction = state.actions.find((a) => a.id === id)
      if (maybeAction) return { action: maybeAction, type: 'action' }

      const maybeAttack = state.attacks.find((a) => a.id === id)
      if (maybeAttack) return { action: maybeAttack, type: 'attack' }

      // 2. Name or slug match
      const actionByName = state.actions.find((a) => a.name.trim().toLowerCase() === id.trim().toLowerCase() || norm(a.name) === targetNorm)
      if (actionByName) return { action: actionByName, type: 'action' }

      const attackByName = state.attacks.find((a) => a.name.trim().toLowerCase() === id.trim().toLowerCase() || norm(a.name) === targetNorm)
      if (attackByName) return { action: attackByName, type: 'attack' }

      // 3. Graceful fallback synthesis
      const fallbackName = id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      return {
        action: {
          id,
          name: fallbackName,
          description: '',
          recharge: '',
          legendaryOnly: true,
          limitedUse: { count: 0, rate: '' },
          stat: 'none',
          save: { override: false, overrideValue: 0 },
          range: '',
          effects: [],
          customPreamble: false,
          bonusAction: false,
          crAnnotation: { maxDamage: 0, maxSave: 0, maxModifier: 0, multitarget: false, ehpMultiplier: 1, ehpModifier: 0, acModifier: 0, include: false, automatic: true }
        },
        type: 'action'
      }
    }
  },
  isSpellcaster: (state: Monster) => {
    return (
      (state.spellcasting.primarySourceEnabled !== false && sourceEffectiveSpells({className:state.spellcasting.class || '',subclass:state.spellcasting.subclass,level:state.spellcasting.level,rulesEdition:state.spellcasting.rulesEdition,spells:state.spellcasting.standard}).length > 0) ||
      (state.spellcasting.classes || []).some(source => sourceEffectiveSpells(source).length > 0) ||
      state.spellcasting.atWill.length > 0
    )
  },
}
