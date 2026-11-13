/**
 * WAI-ARIA combobox wiring for an input or contenteditable that owns a suggestion listbox:
 * screen readers announce the popup state and the highlighted option without moving focus.
 */
let counter = 0
export const nextListId = (prefix = 'macro-suggest') => `${prefix}-${++counter}`
export const optionId = (listId: string, index: number) => `${listId}-opt-${index}`

export function syncComboboxAria(el: HTMLElement | null | undefined, open: boolean, listId: string, active: number): void {
  if (!el) return
  if (el.getAttribute('contenteditable') !== 'true') el.setAttribute('role', 'combobox')
  el.setAttribute('aria-haspopup', 'listbox')
  el.setAttribute('aria-autocomplete', 'list')
  el.setAttribute('aria-expanded', open ? 'true' : 'false')
  if (open) {
    el.setAttribute('aria-controls', listId)
    el.setAttribute('aria-activedescendant', optionId(listId, active))
  } else {
    el.removeAttribute('aria-controls')
    el.removeAttribute('aria-activedescendant')
  }
}
