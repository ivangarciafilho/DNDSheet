import { characterProficiency } from 'src/core/domain/math-utils'
import { previewRandomTableImport, nextRandomTableRow } from 'src/core/domain/random-table'
import { entryBindingPrefix, withoutEntryBindings } from 'src/core/domain/entry-bindings'
import { validate } from 'jsonschema'
import { defineStore } from 'pinia'
import { useQuasar } from 'quasar'
import { validateNumber } from 'src/components/editor/numberInput'
import { useFileLoader } from 'src/components/file/useFileLoader'
import { defaultAction, defaultReaction, defaultAttack, defaultCrAnnotation, defaultTrait, DndStat, MonsterSpeed, SwappableField } from 'src/components/models'
import { statModifier } from 'src/components/rendering/mathRendering'
import { CR } from 'src/data/CR'
import { DICE } from 'src/data/DICE'
import { SCHEMA } from 'src/data/SCHEMA'
import { HD_FOR_SIZE } from 'src/data/SIZE'
import { SKILL } from 'src/data/SKILL'
import { v4 as uuidv4 } from 'uuid'
import { useSpellsStore } from './spells-store'
import { monsterBindingActions } from './binding-runtime'
import { monsterStateGetters } from './monster-state-getters'
import { monsterCrGetters } from './monster-cr-getters'
export * from './monster-state.ts'
import { monsterState } from './monster-state.ts'

export const createMonsterState = monsterState.state

export const useMonsterStore = defineStore('monster', {
  ...monsterState,
  getters: {
    ...monsterStateGetters,
    ...monsterCrGetters,
    spellSave(): number {
      if (this.spellcasting?.save?.override) {
        return this.spellcasting.save.overrideValue
      } else {
        return this.defaultSpellSave(this.spellcasting?.stat || 'INT')
      }
    },
    spellAttackModifier(): number {
      if (this.spellcasting?.attack?.override) {
        return this.spellcasting.attack.overrideValue
      } else {
        return this.defaultSpellAttackModifier(this.spellcasting?.stat || 'INT')
      }
    },
    spellAbilityModifier(): number {
      if (this.spellcasting?.modifier?.override) {
        return this.spellcasting.modifier.overrideValue
      } else {
        return this.defaultSpellModifier(this.spellcasting?.stat || 'INT')
      }
    },
    knownSpellsOfLevel() {
      const spells = useSpellsStore()

      return (level: number) => {
        const allSpells = spells.allSpells
        const extraSpells = (
          this.spellcasting?.classes ||
          this.spellcasting?.multiclass?.classes ||
          this.spellcasting?.multiclass?.extraClasses ||
          []
        ).flatMap((c: { spells?: string[] }) => c.spells || [])
        const allStandard = Array.from(new Set([...(this.spellcasting?.standard || []), ...extraSpells]))

        return allStandard.filter(
          (id) => id in allSpells && allSpells[id].level === level
        )
      }
    },
    spellsBySlot(): {
      level: number
      slots: number
      spells: string[]
    }[] {
      const slots = this.spellcasting?.slots || []
      const ret = []
      for (const idx in slots) {
        if (slots[idx] > 0) {
          const spells = this.knownSpellsOfLevel(parseInt(idx) + 1)
          if (spells.length === 0) continue

          const level = parseInt(idx) + 1

          ret.push({
            level,
            slots: slots[idx],
            spells,
          })
        }
      }

      return ret
    },
    initiative(): { mod: number; passive: number; advantage?: boolean; disadvantage?: boolean; cantBeSurprised?: boolean } {
      const skillDefined = this.skills.find((s) => s.key === 'INITIATIVE')
      let baseMod = statModifier(this.stats.DEX)

      if (this.initiativeConfig) {
        if (this.initiativeConfig.secondaryStat && this.initiativeConfig.secondaryStat !== 'none') {
          const secMod = statModifier(this.stats[this.initiativeConfig.secondaryStat as DndStat])
          if (this.initiativeConfig.statMode === 'replace') {
            baseMod = secMod
          } else {
            baseMod += secMod
          }
        }
        if (this.initiativeConfig.proficient) {
          baseMod += this.proficiency
        }
      }

      if (skillDefined) {
        const bonus = skillDefined.override
          ? skillDefined.overrideValue
          : this.defaultSkillBonus(skillDefined)
        baseMod = bonus
      }

      const hasAdv = !!this.initiativeConfig?.advantage || !!skillDefined?.advantage
      const hasDisadv = !!this.initiativeConfig?.disadvantage || !!skillDefined?.disadvantage
      const passiveMod = hasAdv && !hasDisadv ? 5 : hasDisadv && !hasAdv ? -5 : 0

      return {
        mod: baseMod,
        passive: 10 + baseMod + passiveMod,
        advantage: hasAdv,
        disadvantage: hasDisadv,
        cantBeSurprised: !!this.initiativeConfig?.cantBeSurprised,
      }
    },
  },
  actions: {
    ...monsterBindingActions,
    setCR(value: number) {
      this.CR = value

      // automatically update proficiency too
      this.syncProficiency()
    },
    setProficiencyScale(scale: 'monster' | 'character') {
      this.$patch(state => {
        state.proficiencyScale = scale
        if (!state.proficiencyOverride) {
          state.proficiency = scale === 'character' ? characterProficiency(state.HP.HD) : CR[state.CR].proficiency
        }
      })
    },
    syncProficiency() {
      if (!this.proficiencyOverride) {
        this.proficiency = this.proficiencyScale === 'character' ? characterProficiency(this.HP.HD) : CR[this.CR].proficiency
      }
    },
    toggleProficiencyOverride() {
      this.proficiencyOverride = !this.proficiencyOverride

      if (!this.proficiencyOverride) {
        this.proficiency = CR[this.CR].proficiency
      }
    },
    setSize(value: string) {
      this.size = value

      if (!this.hpDieTypeOverride && value in HD_FOR_SIZE) {
        // value is in hd for size so value is a key
        this.HP.type = HD_FOR_SIZE[value as keyof typeof HD_FOR_SIZE]
      }
    },
    toggleDieTypeOverride() {
      this.hpDieTypeOverride = !this.hpDieTypeOverride

      this.setSize(this.size)
    },
    setHpModifier(
      hdCount: number | string | null,
      con: number | string | null
    ) {
      this.HP.HD = validateNumber(hdCount, 0)
      this.stats.CON = validateNumber(con, 0)

      if (!this.hpModifierOverride) {
        this.HP.modifier = statModifier(this.stats.CON) * this.HP.HD
      }
    },
    toggleHpModifierOverride() {
      this.hpModifierOverride = !this.hpModifierOverride

      // toggle refresh if needed
      this.setHpModifier(this.HP.HD, this.stats.CON)
    },
    setAcByCr() {
      this.AC = CR[this.CR].ac
    },
    setHdByCr() {
      const crObj = CR[this.CR]
      const hpMax = crObj.hpMax
      const gainPerHd = (this.HP.type + 1) / 2 + statModifier(this.stats.CON)

      const hd = Math.max(Math.floor(hpMax / gainPerHd), 1)
      const modifier = hd * statModifier(this.stats.CON)

      this.HP.HD = hd
      this.HP.modifier = modifier
    },
    addSpeed(initial: Partial<Omit<MonsterSpeed, 'id'>> = {}) {
      const seed = initial && typeof initial === 'object' && !('preventDefault' in initial) ? initial : {}
      this.speeds.push({
        type: 'walk',
        speed: 30,
        note: '',
        ...seed,
        id: uuidv4(),
      })
    },
    deleteSpeed(id: string) {
      const index = this.speeds.findIndex((s) => s.id === id)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('speeds', id))
          this.speeds.splice(index, 1)
        })
      }
    },
    addSkill(skillName: keyof typeof SKILL, proficient = true) {
      this.skills.push({
        skill: SKILL[skillName],
        key: String(skillName),
        proficient: proficient,
        expertise: false,
        override: false,
        overrideValue: 0,
      })
    },
    deleteSkill(skillName: keyof typeof SKILL) {
      const index = this.skills.findIndex((s) => s.key === skillName)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, `skills[key=${encodeURIComponent(String(skillName).toUpperCase())}]`)
          this.skills.splice(index, 1)
        })
      }
    },
    addTrait() {
      this.traits.push(defaultTrait())
    },
    deleteTrait(id: string) {
      const index = this.traits.findIndex((t) => t.id === id)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('traits', id))
          this.traits.splice(index, 1)
        })
      }
    },
    updateSpellsAtLevel(level: number, spells: string[]) {
      // first get the list of spells at the current level
      const spellsAtLevel = this.knownSpellsOfLevel(level)

      // if a spell isn't in the given list, remove it
      for (const spell of spellsAtLevel) {
        // if the spell isn't in the incoming list remove it
        if (spells.find((name) => name === spell) == null) {
          this.spellcasting.standard.splice(
            this.spellcasting.standard.indexOf(spell),
            1
          )
        }
      }

      // append new spells
      for (const spell of spells) {
        // if the spell isn't in the current list, add it
        if (spellsAtLevel.find((name) => name === spell) == null) {
          this.spellcasting.standard.push(spell)
        }
      }
    },
    addInnateSpellList() {
      this.spellcasting.atWill.push({
        id: uuidv4(),
        count: 1,
        rate: 'DAY',
        spells: [],
      })
    },
    deleteInnateSpellList(id: string) {
      const index = this.spellcasting.atWill.findIndex((aw) => aw.id === id)

      if (index !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('spellcasting.atWill', id))
        state.spellcasting.atWill.splice(index, 1)
      })
    },
    addNewAttack() {
      this.attacks.push(defaultAttack())
    },
    deleteAttack(id: string) {
      const index = this.attacks.findIndex((a) => a.id === id)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('attacks', id))
          this.attacks.splice(index, 1)
        })

        // filter out legendary actions
        this.deleteLegendaryAction(id)
        this.deleteMythicAction(id)

        // check if it's in a multiattack group
        this.multiattacks.forEach((ma) => {
          ma.attacks = ma.attacks.filter((aId) => aId !== id)
        })
      }
    },
    addAdditionalDamage(id: string) {
      const attack = this.attacks.find((a) => a.id === id)

      if (attack) {
        attack.additionalDamage.push({
          id: uuidv4(),
          dice: DICE.d6,
          count: 1,
          type: '',
          note: '',
        })
      }
    },
    deleteAdditionalDamage(id: string, addId: string) {
      const attack = this.attacks.find((a) => a.id === id)

      if (attack) {
        const index = attack.additionalDamage.findIndex((a) => a.id === addId)

        if (index !== -1) {
          this.$patch(state => {
            state.bindings = withoutEntryBindings(state.bindings, `${entryBindingPrefix('attacks', id)}.${entryBindingPrefix('additionalDamage', addId)}`)
            attack.additionalDamage.splice(index, 1)
          })
        }
      }
    },
    addMultiattack() {
      this.multiattacks.push({
        id: uuidv4(),
        attacks: [],
        actions: [],
      })
    },
    deleteMultiattack(id: string) {
      const idx = this.multiattacks.findIndex((ma) => ma.id === id)

      if (idx !== -1) {
        this.multiattacks.splice(idx, 1)
      }
    },
    addMultiattackAttack(id: string, attackId: string) {
      const ma = this.multiattacks.find((ma) => ma.id === id)

      if (ma) {
        ma.attacks.push(attackId)
      }
    },
    removeMultiattackAttack(id: string, attackId: string) {
      // remove the first instance, it's equivalent
      const ma = this.multiattacks.find((ma) => ma.id === id)

      if (ma) {
        const idx = ma.attacks.findIndex((id) => attackId === id)

        if (idx !== -1) {
          ma.attacks.splice(idx, 1)
        }
      }
    },
    addMultiattackAction(id: string, actionId: string) {
      const ma = this.multiattacks.find((ma) => ma.id === id)

      if (ma) {
        ma.actions.push(actionId)
      }
    },
    removeMultiattackAction(id: string, actionId: string) {
      // remove the first instance, it's equivalent
      const ma = this.multiattacks.find((ma) => ma.id === id)

      if (ma) {
        const idx = ma.actions.findIndex((id) => actionId === id)

        if (idx !== -1) {
          ma.actions.splice(idx, 1)
        }
      }
    },
    addAction() {
      this.actions.push(defaultAction())
    },
    deleteAction(actionId: string) {
      const index = this.actions.findIndex((a) => a.id === actionId)

      if (index !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('actions', actionId))
          this.actions.splice(index, 1)
        })

        // check if it's in a legendary action
        this.deleteLegendaryAction(actionId)
        this.deleteMythicAction(actionId)

        // check if it's in a multiattack group
        this.multiattacks.forEach((ma) => {
          ma.actions = ma.actions.filter((aId) => aId !== actionId)
        })
      }
    },
    addLegendaryAction(actionId: string, cost = 1) {
      if (this.legendaryActions.count === 0) {
        this.legendaryActions.count = 3
      }
      if (
        this.legendaryActions.actions.find((la) => la.actionId === actionId) ==
        null
      ) {
        this.legendaryActions.actions.push({
          actionId,
          cost,
        })
      }
    },
    createStandaloneLegendaryAction(name = 'New Legendary Action', description = '', cost = 1) {
      if (this.legendaryActions.count === 0) {
        this.legendaryActions.count = 3
      }
      const act = defaultAction()
      act.name = name
      act.description = description || '{NAME} makes a Perception check or moves up to half its speed.'
      act.legendaryOnly = true
      act.customPreamble = true
      this.actions.push(act)
      this.legendaryActions.actions.push({
        actionId: act.id,
        cost,
      })
      return act.id
    },
    deleteLegendaryAction(actionId: string) {
      const idx = this.legendaryActions.actions.findIndex(
        (a) => a.actionId === actionId
      )

      if (idx !== -1) {
        this.legendaryActions.actions.splice(idx, 1)
      }
    },
    addMythicAction(actionId: string) {
      if (
        this.mythicActions.actions.find((la) => la.actionId === actionId) ==
        null
      ) {
        this.mythicActions.actions.push({
          actionId,
          cost: 1,
        })
      }
    },
    deleteMythicAction(actionId: string) {
      const idx = this.mythicActions.actions.findIndex(
        (a) => a.actionId === actionId
      )

      if (idx !== -1) {
        this.mythicActions.actions.splice(idx, 1)
      }
    },
    addReaction() {
      this.reactions.push(defaultReaction())
    },
    deleteReaction(reactionId: string) {
      const idx = this.reactions.findIndex((r) => r.id === reactionId)

      if (idx !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('reactions', reactionId))
          this.reactions.splice(idx, 1)
        })
      }
    },
    addLairAction() {
      this.lairActions.push({
        id: uuidv4(),
        description: '',
        crAnnotation: defaultCrAnnotation(),
      })
    },
    deleteLairAction(actionId: string) {
      const idx = this.lairActions.findIndex((la) => la.id === actionId)

      if (idx !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('lairActions', actionId))
          this.lairActions.splice(idx, 1)
        })
      }
    },
    addRandomTable() {
      const id = uuidv4()
      if (!Array.isArray(this.randomTables)) this.randomTables = []
      this.randomTables.push({ id, title: '', dice: '1d6', rows: [{ id: uuidv4(), min: 1, max: 6, text: '' }] })
    },
    replaceRandomTableRows(tableId: string, input: string) {
      const table = (this.randomTables ?? []).find(t => t.id === tableId)
      if (!table) return false
      const reserved = (this.randomTables ?? []).flatMap(t => [t.id, ...t.rows.map(row => row.id)])
      const preview = previewRandomTableImport(table, input, reserved)
      if (!preview.canApply) return false
      table.rows = preview.table.rows
      return true
    },
    deleteRandomTable(tableId: string) {
      const idx = (this.randomTables ?? []).findIndex((t) => t.id === tableId)
      if (idx !== -1) this.randomTables!.splice(idx, 1)
    },
    addRandomTableRow(tableId: string) {
      const table = (this.randomTables ?? []).find((t) => t.id === tableId)
      if (table) table.rows.push(nextRandomTableRow(table, uuidv4()))
    },
    deleteRandomTableRow(tableId: string, rowId: string) {
      const table = (this.randomTables ?? []).find((t) => t.id === tableId)
      if (table) table.rows = table.rows.filter((r) => r.id !== rowId)
    },
    addRegionalEffect() {
      this.regionalEffects.push({
        id: uuidv4(),
        description: '',
      })
    },
    deleteRegionalEffect(effectId: string) {
      const idx = this.regionalEffects.findIndex((re) => re.id === effectId)

      if (idx !== -1) {
        this.regionalEffects.splice(idx, 1)
      }
    },
    validate() {
      const { updateMonster } = useFileLoader()
      const $q = useQuasar()

      updateMonster(this.$state)
      const valid = validate(this.$state, SCHEMA['9'])

      if (!valid.valid) {
        console.error(valid.errors.map((e) => e.toString()))

        $q.notify({
          message:
            'Monster failed to validate after update. Please submit a bug report and include the monster file.',
          color: 'negative',
        })

        $q.notify({
          message: `Errors: ${valid.errors
            .map((e) => e.toString())
            .join('\n')}`,
          color: 'negative',
        })
      }
    },
    addTool(name: string, stat: DndStat = 'DEX') {
      if (!Array.isArray(this.tools)) {
        this.tools = []
      }
      this.tools.push({
        id: uuidv4(),
        name,
        proficient: true,
        expertise: false,
        stat,
        override: false,
        overrideValue: 0,
        advantage: false,
        disadvantage: false,
        condition: '',
      })
    },
    deleteTool(id: string) {
      if (!Array.isArray(this.tools)) return
      const idx = this.tools.findIndex((t) => t.id === id)
      if (idx !== -1) {
        this.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('tools', id))
          this.tools?.splice(idx, 1)
        })
      }
    },
    addVillainAction(round: 1 | 2 | 3 = 1) {
      if (!Array.isArray(this.villainActions)) this.villainActions = []
      this.villainActions.push({
        id: uuidv4(),
        round,
        name: `Villain Action (Round ${round})`,
        description: '',
        trigger: "At the end of another creature's turn",
      })
    },
    deleteVillainAction(id: string) {
      if (!Array.isArray(this.villainActions)) return
      const idx = this.villainActions.findIndex((a) => a.id === id)
      if (idx !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('villainActions', id))
        this.villainActions?.splice(idx, 1)
      })
    },
    addBloodiedAction() {
      if (!Array.isArray(this.bloodiedActions)) this.bloodiedActions = []
      this.bloodiedActions.push({
        id: uuidv4(),
        name: 'Bloodied Surge',
        triggerType: 'immediate_reaction',
        description: 'When reduced to half hit points or fewer, immediately recharges all abilities and moves up to its speed.',
      })
    },
    deleteBloodiedAction(id: string) {
      if (!Array.isArray(this.bloodiedActions)) return
      const idx = this.bloodiedActions.findIndex((a) => a.id === id)
      if (idx !== -1) this.bloodiedActions.splice(idx, 1)
    },
    addReactiveAction() {
      if (!Array.isArray(this.reactiveActions)) this.reactiveActions = []
      this.reactiveActions.push({
        id: uuidv4(),
        name: 'Reactive Parry',
        trigger: 'When a creature within reach misses with a melee attack',
        description: 'Retaliates with a strike or gains +3 AC.',
        usesPerRound: 1,
      })
    },
    deleteReactiveAction(id: string) {
      if (!Array.isArray(this.reactiveActions)) return
      const idx = this.reactiveActions.findIndex((a) => a.id === id)
      if (idx !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('reactiveActions', id))
        this.reactiveActions?.splice(idx, 1)
      })
    },
    addComboAction() {
      if (!Array.isArray(this.comboActions)) this.comboActions = []
      this.comboActions.push({
        id: uuidv4(),
        name: 'Grab and Crush',
        leadAction: 'Bite',
        followUpAction: 'Constrict',
        condition: 'Target is grappled',
        description: 'Immediately follows up with automatic crushing damage.',
      })
    },
    deleteComboAction(id: string) {
      if (!Array.isArray(this.comboActions)) return
      const idx = this.comboActions.findIndex((a) => a.id === id)
      if (idx !== -1) this.comboActions.splice(idx, 1)
    },
    addAnatomyPart(name = 'Wings') {
      if (!Array.isArray(this.anatomyParts)) this.anatomyParts = []
      this.anatomyParts.push({
        id: uuidv4(),
        name,
        hp: 30,
        ac: 14,
        threshold: 10,
        breakEffect: 'Disabled: Loses flying speed when reduced to 0 HP.',
      })
    },
    deleteAnatomyPart(id: string) {
      if (!Array.isArray(this.anatomyParts)) return
      const idx = this.anatomyParts.findIndex((p) => p.id === id)
      if (idx !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('anatomyParts', id))
        this.anatomyParts?.splice(idx, 1)
      })
    },
    addTrackEvent(round = 1) {
      if (!this.runehammerTrack) {
        this.runehammerTrack = { enabled: true, timerDie: 'd4', name: 'Escalation Track', events: [] }
      }
      this.runehammerTrack.events.push({
        id: uuidv4(),
        round,
        name: `Escalation Round ${round}`,
        description: '',
      })
    },
    deleteTrackEvent(id: string) {
      if (!this.runehammerTrack?.events) return
      const idx = this.runehammerTrack.events.findIndex((e) => e.id === id)
      if (idx !== -1) this.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('runehammerTrack.events', id))
        this.runehammerTrack?.events?.splice(idx, 1)
      })
    },
    swapItems(target: SwappableField, source: number, dest: number) {
      const targetArray = this[target] as unknown[] | undefined
      if (!Array.isArray(targetArray)) return
      if (source < 0 || source >= targetArray.length || dest < 0 || dest >= targetArray.length) return

      const tmp = targetArray[dest]
      targetArray[dest] = targetArray[source]
      targetArray[source] = tmp
      // Reordering is an explicit order, so it ends the alphabetical sort the renderer would otherwise impose.
      if (target === 'traits') this.alphaTraits = false
    },
    moveItemUp(target: SwappableField, source: number) {
      if (source <= 0) return
      this.swapItems(target, source, source - 1)
    },
    moveItemDown(target: SwappableField, source: number) {
      const targetArray = this[target] as unknown[] | undefined
      if (!Array.isArray(targetArray) || source >= targetArray.length - 1) return
      this.swapItems(target, source, source + 1)
    },
  },
  persist: {
    // this should be changed to app.monster after parity reached, as it will then read all of the
    // existing data correctly
    key: 'app.monster',
  },
})
