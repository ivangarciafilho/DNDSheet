import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  applyDamage,
  applyHealing,
  Combatant,
  createCombatantFromMonster,
  createCombatantFromCharacter,
  sortInitiative,
  toggleCondition,
  advanceTurn,
  previousTurn,
  recordDeathSave,
} from 'src/core/usecases/CombatTracker'
import { useMonsterStore } from './monster-store'

export const STANDARD_CONDITIONS = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
  'Exhaustion',
]

export const useCombatStore = defineStore(
  'combat',
  () => {
    const combatants = ref<Combatant[]>([])
    const currentRound = ref(1)
    const activeTurnIndex = ref(0)
    const isEncounterActive = ref(false)

    const sortedCombatants = computed(() => {
      return sortInitiative([...combatants.value])
    })

    const activeCombatant = computed(() => {
      if (sortedCombatants.value.length === 0) return null
      const idx = activeTurnIndex.value % sortedCombatants.value.length
      return sortedCombatants.value[idx] || null
    })

    const addMonsterCombatant = (initRoll?: number) => {
      const monsterStore = useMonsterStore()
      const init = initRoll ?? Math.floor(Math.random() * 20) + 1 + Math.floor((monsterStore.stats.DEX - 10) / 2)
      const combatant = createCombatantFromMonster(monsterStore.$state as any, init)
      combatants.value.push(combatant)
      isEncounterActive.value = true
    }

    const addCustomCombatant = (name = 'New Combatant', hp = 20, initiative = 10, isMonster = false) => {
      combatants.value.push({
        id: `cbt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        initiative,
        currentHp: hp,
        maxHp: hp,
        tempHp: 0,
        conditions: [],
        deathSaves: { successes: 0, failures: 0 },
        isMonster,
      })
      isEncounterActive.value = true
    }

    const removeCombatant = (id: string) => {
      combatants.value = combatants.value.filter((c) => c.id !== id)
      if (combatants.value.length === 0) {
        isEncounterActive.value = false
        activeTurnIndex.value = 0
        currentRound.value = 1
      }
    }

    const damage = (combatantId: string, amount: number) => {
      const c = combatants.value.find((x) => x.id === combatantId)
      if (c) {
        applyDamage(c, amount)
      }
    }

    const heal = (combatantId: string, amount: number) => {
      const c = combatants.value.find((x) => x.id === combatantId)
      if (c) {
        applyHealing(c, amount)
      }
    }

    const setTempHp = (combatantId: string, amount: number) => {
      const c = combatants.value.find((x) => x.id === combatantId)
      if (c) {
        c.tempHp = Math.max(0, amount)
      }
    }

    const toggleCond = (combatantId: string, condition: string) => {
      const c = combatants.value.find((x) => x.id === combatantId)
      if (c) {
        toggleCondition(c, condition)
      }
    }

    const addDeathSave = (combatantId: string, result: 'success' | 'failure') => {
      const c = combatants.value.find((x) => x.id === combatantId)
      if (c) {
        recordDeathSave(c, result)
      }
    }

    const nextTurn = () => {
      const res = advanceTurn(activeTurnIndex.value, currentRound.value, sortedCombatants.value.length)
      activeTurnIndex.value = res.turnIndex
      currentRound.value = res.round
    }

    const prevTurn = () => {
      const res = previousTurn(activeTurnIndex.value, currentRound.value, sortedCombatants.value.length)
      activeTurnIndex.value = res.turnIndex
      currentRound.value = res.round
    }

    const resetEncounter = () => {
      combatants.value = []
      currentRound.value = 1
      activeTurnIndex.value = 0
      isEncounterActive.value = false
    }

    return {
      combatants,
      currentRound,
      activeTurnIndex,
      isEncounterActive,
      sortedCombatants,
      activeCombatant,
      addMonsterCombatant,
      addCustomCombatant,
      removeCombatant,
      damage,
      heal,
      setTempHp,
      toggleCond,
      addDeathSave,
      nextTurn,
      prevTurn,
      resetEncounter,
    }
  },
  {
    persist: {
      key: 'app.combat',
    },
  }
)
