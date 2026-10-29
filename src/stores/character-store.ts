import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { CharacterActor, defaultCharacterActor, DndStat } from 'src/core/domain/types'
import { statModifier } from 'src/core/domain/math-utils'

export const useCharacterStore = defineStore(
  'character',
  () => {
    const actor = ref<CharacterActor>(defaultCharacterActor())

    // Ensure backwards compatibility with stored state that may lack new fields
    if (!actor.value.savingThrows) {
      actor.value.savingThrows = { STR: true, CON: true }
    }
    if (!actor.value.skills) {
      actor.value.skills = { Athletics: { proficient: true, expertise: false } }
    }
    if (!actor.value.spells) {
      actor.value.spells = []
    }
    if (!actor.value.spellcasting) {
      actor.value.spellcasting = { ability: 'INT' }
    }
    if (!actor.value.portrait) {
      actor.value.portrait = { url: '', position: 'none', caption: '' }
    }
    if (!actor.value.spellSlots || !actor.value.spellSlots.current) {
      actor.value.spellSlots = {
        current: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        max: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      }
    }

    watch(
      () => actor.value.level,
      (lvl) => {
        const clampedLvl = Math.max(1, Math.min(20, lvl || 1))
        actor.value.proficiency = Math.floor((clampedLvl - 1) / 4) + 2
      }
    )

    const resetCharacter = () => {
      actor.value = defaultCharacterActor()
    }

    const setStat = (stat: keyof CharacterActor['stats'], value: number) => {
      actor.value.stats[stat] = Math.max(1, Math.min(30, value))
    }

    const getModifier = (stat: keyof CharacterActor['stats']) => {
      return statModifier(actor.value.stats[stat])
    }

    const getSaveModifier = (stat: DndStat) => {
      const base = getModifier(stat)
      const prof = actor.value.savingThrows?.[stat] ? actor.value.proficiency : 0
      return base + prof
    }

    const toggleSavingThrow = (stat: DndStat) => {
      if (!actor.value.savingThrows) {
        actor.value.savingThrows = {}
      }
      actor.value.savingThrows[stat] = !actor.value.savingThrows[stat]
    }

    const getSkillModifier = (skillName: string, stat: DndStat) => {
      const base = getModifier(stat)
      const skill = actor.value.skills?.[skillName]
      if (!skill) return base
      let bonus = 0
      if (skill.proficient) bonus += actor.value.proficiency
      if (skill.expertise) bonus += actor.value.proficiency
      return base + bonus
    }

    const toggleSkillProficiency = (skillName: string) => {
      if (!actor.value.skills) {
        actor.value.skills = {}
      }
      if (!actor.value.skills[skillName]) {
        actor.value.skills[skillName] = { proficient: true, expertise: false }
      } else if (!actor.value.skills[skillName].proficient) {
        actor.value.skills[skillName].proficient = true
      } else {
        actor.value.skills[skillName].proficient = false
        actor.value.skills[skillName].expertise = false
      }
    }

    const toggleSkillExpertise = (skillName: string) => {
      if (!actor.value.skills) {
        actor.value.skills = {}
      }
      if (!actor.value.skills[skillName]) {
        actor.value.skills[skillName] = { proficient: true, expertise: true }
      } else {
        const currentExp = !!actor.value.skills[skillName].expertise
        actor.value.skills[skillName].expertise = !currentExp
        if (!currentExp) {
          actor.value.skills[skillName].proficient = true
        }
      }
    }

    const addSpell = (name = 'New Spell', level = 1, prepared = true, notes = '') => {
      if (!actor.value.spells) {
        actor.value.spells = []
      }
      actor.value.spells.push({
        id: `spell-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        level,
        prepared,
        notes,
      })
    }

    const removeSpell = (id: string) => {
      if (!actor.value.spells) return
      actor.value.spells = actor.value.spells.filter((s) => s.id !== id)
    }

    const toggleSpellPrepared = (id: string) => {
      if (!actor.value.spells) return
      const sp = actor.value.spells.find((s) => s.id === id)
      if (sp) {
        sp.prepared = !sp.prepared
      }
    }

    const setSpellSlot = (levelIdx: number, current: number, max: number) => {
      if (!actor.value.spellSlots) {
        actor.value.spellSlots = {
          current: [0, 0, 0, 0, 0, 0, 0, 0, 0],
          max: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        }
      }
      if (levelIdx >= 0 && levelIdx < 9) {
        actor.value.spellSlots.current[levelIdx] = Math.max(0, current)
        actor.value.spellSlots.max[levelIdx] = Math.max(0, max)
      }
    }

    const addFeature = (name = 'New Feature', source = 'Class', description = '') => {
      actor.value.features.push({
        id: `feat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        source,
        description,
      })
    }

    const removeFeature = (id: string) => {
      actor.value.features = actor.value.features.filter((f) => f.id !== id)
    }

    const addItem = (name = 'New Item', quantity = 1, weight = 1) => {
      actor.value.inventory.push({
        id: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        quantity,
        weight,
        equipped: false,
      })
    }

    const removeItem = (id: string) => {
      actor.value.inventory = actor.value.inventory.filter((i) => i.id !== id)
    }

    return {
      actor,
      resetCharacter,
      setStat,
      getModifier,
      getSaveModifier,
      toggleSavingThrow,
      getSkillModifier,
      toggleSkillProficiency,
      toggleSkillExpertise,
      addSpell,
      removeSpell,
      toggleSpellPrepared,
      setSpellSlot,
      addFeature,
      removeFeature,
      addItem,
      removeItem,
    }
  },
  {
    persist: {
      key: 'app.character',
    },
  }
)
