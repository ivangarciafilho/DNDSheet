import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'
import { computed, ref } from 'vue'
import {
  addCombatantPreserveTurn,
  applyDamage,
  applyHealing,
  Combatant,
  createCombatantFromMonster,
  createCombatantFromCharacter,
  removeCombatantPreserveTurn,
  setInitiativePreserveTurn,
  sortInitiative,
  toggleCondition,
  advanceTurn,
  previousTurn,
  recordDeathSave,
} from 'src/core/usecases/CombatTracker'
import type { CharacterActor, Monster } from 'src/core/domain/types'
import { useMonsterStore } from './monster-store'
import { useMonsterSessionStore } from './monster-session'

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
    const activeCombatantId = ref<string | null>(null)
    const isEncounterActive = ref(false)

    const sortedCombatants = computed(() => {
      return sortInitiative([...combatants.value])
    })

    const activeCombatant = computed(() => {
      return (
        sortedCombatants.value.find((c) => c.id === activeCombatantId.value) ??
        sortedCombatants.value[activeTurnIndex.value] ??
        null
      )
    })

    const applyAdd = (combatant: Combatant) => {
      const next = addCombatantPreserveTurn(
        combatants.value,
        combatant,
        activeCombatant.value?.id ?? activeCombatantId.value,
        activeTurnIndex.value,
      )
      combatants.value = next.combatants
      activeTurnIndex.value = next.activeTurnIndex
      activeCombatantId.value = next.activeCombatantId
      isEncounterActive.value = next.isEncounterActive
    }

    const addMonsterCombatant = (initRoll?: number) => {
      const monsterStore = useMonsterStore()
      const sessionStore = useMonsterSessionStore()
      const init = initRoll ?? Math.floor(Math.random() * 20) + 1 + Math.floor((monsterStore.stats.DEX - 10) / 2)
      const combatant = createCombatantFromMonster(monsterStore.$state as unknown as Monster, init, {
        sourceDocumentId: sessionStore.documentId,
        sourceRevision: sessionStore.contentRevision,
      })
      applyAdd(combatant)
    }

    const addCharacterCombatant = (character: CharacterActor, initRoll?: number) => {
      const init = initRoll ?? Math.floor(Math.random() * 20) + 1 + Math.floor((character.stats.DEX - 10) / 2)
      applyAdd(createCombatantFromCharacter(character, init))
    }

    const addCustomCombatant = (name = 'New Combatant', hp = 20, initiative = 10, isMonster = false) => {
      applyAdd({
        id: `cbt-${uuidv4()}`,
        sourceKind: 'custom',
        name,
        initiative,
        currentHp: hp,
        maxHp: hp,
        tempHp: 0,
        conditions: [],
        deathSaves: { successes: 0, failures: 0 },
        isMonster,
        sourceSnapshot: {
          sourceKind: 'custom',
          name,
          ac: 10,
          maxHp: hp,
        },
      })
    }

    const removeCombatant = (id: string) => {
      const next = removeCombatantPreserveTurn(
        combatants.value,
        id,
        activeTurnIndex.value,
        currentRound.value,
        activeCombatant.value?.id ?? activeCombatantId.value,
      )
      combatants.value = next.combatants
      activeTurnIndex.value = next.activeTurnIndex
      currentRound.value = next.currentRound
      activeCombatantId.value = next.activeCombatantId
      isEncounterActive.value = next.isEncounterActive
    }

    const setInitiative = (combatantId: string, nextInitiative: number) => {
      const next = setInitiativePreserveTurn(
        combatants.value,
        combatantId,
        nextInitiative,
        activeCombatant.value?.id ?? activeCombatantId.value,
        activeTurnIndex.value,
      )
      combatants.value = next.combatants
      activeTurnIndex.value = next.activeTurnIndex
      activeCombatantId.value = next.activeCombatantId
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
      activeCombatantId.value = sortedCombatants.value[res.turnIndex]?.id ?? null
    }

    const prevTurn = () => {
      const res = previousTurn(activeTurnIndex.value, currentRound.value, sortedCombatants.value.length)
      activeTurnIndex.value = res.turnIndex
      currentRound.value = res.round
      activeCombatantId.value = sortedCombatants.value[res.turnIndex]?.id ?? null
    }

    const resetEncounter = () => {
      combatants.value = []
      currentRound.value = 1
      activeTurnIndex.value = 0
      activeCombatantId.value = null
      isEncounterActive.value = false
    }

    return {
      combatants,
      currentRound,
      activeTurnIndex,
      activeCombatantId,
      isEncounterActive,
      sortedCombatants,
      activeCombatant,
      addMonsterCombatant,
      addCharacterCombatant,
      addCustomCombatant,
      removeCombatant,
      setInitiative,
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
