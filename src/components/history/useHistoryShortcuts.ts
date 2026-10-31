import { onMounted, onUnmounted } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { useHistoryStore } from 'src/stores/history-store'
import { bindingRuntimeFor } from 'src/stores/binding-runtime'

export function useHistoryShortcuts() {
  const monsterStore = useMonsterStore()
  const historyStore = useHistoryStore()

  let unsubscribe: (() => void) | null = null

  const handleKeydown = (e: KeyboardEvent) => {
    const isCtrlOrMeta = e.ctrlKey || e.metaKey
    if (!isCtrlOrMeta) return

    const key = e.key.toLowerCase()

    if (key === 'z') {
      if (e.shiftKey) {
        // Redo (Ctrl+Shift+Z)
        e.preventDefault()
        historyStore.redo()
      } else {
        // Undo (Ctrl+Z)
        // If actively typing inside an input/textarea, allow browser default if desired,
        // or prioritize whole statblock undo when modifier pressed
        e.preventDefault()
        historyStore.undo()
      }
    } else if (key === 'y') {
      // Redo (Ctrl+Y)
      e.preventDefault()
      historyStore.redo()
    }
  }

  onMounted(() => {
    // Record initial snapshot if history is empty
    if (!historyStore.canUndo) {
      historyStore.pushSnapshot('Initial State')
    }

    // Subscribe to store mutations
    unsubscribe = monsterStore.$subscribe(() => {
      if (bindingRuntimeFor(monsterStore).historySilent) return
      historyStore.scheduleDebouncedSnapshot('Statblock Edit')
    }, { flush: 'sync' })

    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    undo: historyStore.undo,
    redo: historyStore.redo,
    historyStore,
  }
}
