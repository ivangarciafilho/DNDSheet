import { onBeforeUnmount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { openMacroAt } from 'src/core/domain/macro-catalog'
import type { MacroEntry } from 'src/core/domain/macro-catalog'
import { nextListId, syncComboboxAria } from './comboboxAria'

/**
 * "{" autocomplete inside a contenteditable (QEditor content). Reads the text node at the caret,
 * places the popup at the caret rectangle, and inserts through execCommand so the editor's own
 * input pipeline (and undo stack) records the change.
 */
export function useRichMacroAutocomplete(content: Ref<HTMLElement | null>, entriesFor: (query: string) => MacroEntry[]) {
  const open = ref(false), active = ref(0), x = ref(0), y = ref(0)
  const entries = ref<MacroEntry[]>([])
  let target: { node: Text; start: number; end: number } | undefined
  const listId = nextListId()
  watch([open, active], () => syncComboboxAria(content.value, open.value, listId, active.value), { flush: 'post' })

  const close = () => { open.value = false; target = undefined }

  const refresh = () => {
    const root = content.value, selection = window.getSelection()
    if (!root || !selection || selection.rangeCount === 0 || !selection.isCollapsed) return close()
    const node = selection.anchorNode
    if (!node || node.nodeType !== Node.TEXT_NODE || !root.contains(node)) return close()
    const offset = selection.anchorOffset
    const found = openMacroAt(node.textContent ?? '', offset)
    if (!found) return close()
    entries.value = entriesFor(found.query)
    if (entries.value.length === 0) return close()
    target = { node: node as Text, start: found.start, end: offset }
    const rect = selection.getRangeAt(0).getBoundingClientRect()
    // Flip above the caret when the list would run off the bottom of the viewport.
    const height = Math.min(280, entries.value.length * 44 + 8)
    x.value = Math.round(Math.min(rect.left, window.innerWidth - 368))
    y.value = Math.round(rect.bottom + 4 + height > window.innerHeight ? Math.max(4, rect.top - height - 4) : rect.bottom + 4)
    active.value = 0
    open.value = true
  }

  const pick = (entry: MacroEntry) => {
    const selection = window.getSelection()
    if (!target || !selection || !target.node.isConnected) return close()
    const range = document.createRange()
    range.setStart(target.node, target.start)
    range.setEnd(target.node, Math.min(target.end, target.node.length))
    selection.removeAllRanges()
    selection.addRange(range)
    close()
    content.value?.focus()
    document.execCommand('insertText', false, entry.insert)
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (!open.value) return
    const count = entries.value.length
    if (event.key === 'ArrowDown') active.value = (active.value + 1) % count
    else if (event.key === 'ArrowUp') active.value = (active.value - 1 + count) % count
    else if (event.key === 'Enter' || event.key === 'Tab') { const entry = entries.value[active.value]; if (entry) pick(entry) }
    else if (event.key === 'Escape') close()
    else return
    // QEditor handles keys on the same element; stop it from also acting (Enter would add a line).
    event.preventDefault()
    event.stopImmediatePropagation()
  }
  const onInput = () => refresh()
  const onBlur = () => window.setTimeout(close, 150)

  // Listeners follow the content element as rich mode mounts and unmounts.
  watch(content, (next, previous) => {
    previous?.removeEventListener('input', onInput)
    previous?.removeEventListener('keydown', onKeydown, true)
    previous?.removeEventListener('blur', onBlur)
    next?.addEventListener('input', onInput)
    next?.addEventListener('keydown', onKeydown, true)
    next?.addEventListener('blur', onBlur)
  }, { immediate: true, flush: 'post' })
  onBeforeUnmount(() => {
    content.value?.removeEventListener('input', onInput)
    content.value?.removeEventListener('keydown', onKeydown, true)
    content.value?.removeEventListener('blur', onBlur)
  })

  return { listId, open, entries, active, x, y, pick, close }
}
