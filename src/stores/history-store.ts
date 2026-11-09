import { defineStore } from 'pinia'
import { ref } from 'vue'
import { HistoryLedger } from 'src/core/usecases/HistoryLedger'
import type { Monster } from 'src/core/domain/types'
import { useMonsterStore } from './monster-store'
import { bindingRuntimeFor } from './binding-runtime'

export const useHistoryStore = defineStore('history', () => {
  const ledger = new HistoryLedger<Monster>(50)
  const canUndo = ref(false)
  const canRedo = ref(false)
  const isExecutingHistory = ref(false)
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const updateFlags = () => {
    canUndo.value = ledger.canUndo()
    canRedo.value = ledger.canRedo()
  }

  const pushSnapshot = (description = 'Edit') => {
    if (isExecutingHistory.value || bindingRuntimeFor(useMonsterStore()).historySilent) return
    const monsterStore = useMonsterStore()
    // Unrwap raw object
    const rawState = JSON.parse(JSON.stringify(monsterStore.$state))
    ledger.pushSnapshot(rawState, description)
    updateFlags()
  }

  const scheduleDebouncedSnapshot = (description = 'Typing') => {
    if (isExecutingHistory.value || bindingRuntimeFor(useMonsterStore()).historySilent) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      pushSnapshot(description)
    }, 400)
  }

  const undo = (): boolean => {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
    if (!ledger.canUndo()) return false
    const monsterStore = useMonsterStore()
    isExecutingHistory.value = true
    try {
      const currentState = JSON.parse(JSON.stringify(monsterStore.$state))
      const entry = ledger.undo(currentState)
      updateFlags()
      if (entry) {
        monsterStore.$patch(state => Object.assign(state, entry.snapshot, { bindings: entry.snapshot.bindings ?? {} }))
        updateFlags()
        return true
      }
      return false
    } finally {
      setTimeout(() => {
        isExecutingHistory.value = false
      }, 50)
    }
  }

  const redo = (): boolean => {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
    if (!ledger.canRedo()) return false
    const monsterStore = useMonsterStore()
    isExecutingHistory.value = true
    try {
      const currentState = JSON.parse(JSON.stringify(monsterStore.$state))
      const entry = ledger.redo(currentState)
      updateFlags()
      if (entry) {
        monsterStore.$patch(state => Object.assign(state, entry.snapshot, { bindings: entry.snapshot.bindings ?? {} }))
        updateFlags()
        return true
      }
      return false
    } finally {
      setTimeout(() => {
        isExecutingHistory.value = false
      }, 50)
    }
  }

  const clear = () => {
    ledger.clear()
    updateFlags()
  }

  return {
    canUndo,
    canRedo,
    pushSnapshot,
    scheduleDebouncedSnapshot,
    undo,
    redo,
    clear,
  }
})
