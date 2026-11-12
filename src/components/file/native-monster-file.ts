import type { DndSpell } from 'src/core/domain/types'
import type { useEditorStore } from 'src/stores/editor-store'

type EditorState = ReturnType<typeof useEditorStore>['$state']

// These three fields describe the app session, rather than the sheet.
export function sheetPresentation({ activeMode, changelogShown, a4PageMeasuredHeight, ...presentation }: EditorState) {
  return presentation
}

export function nativeMonsterFile(monster: object, editor: EditorState, customSpells: Record<string, DndSpell>) {
  const referenced = new Set<string>()
  const collect = (value: unknown) => {
    if (typeof value === 'string' && Object.hasOwn(customSpells, value)) referenced.add(value)
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (Object.hasOwn(customSpells, key)) referenced.add(key)
        collect(child)
      }
    }
  }
  collect(monster)
  return {
    ...monster,
    sheetPresentation: sheetPresentation(editor),
    sheetCustomSpells: [...referenced].map(name => customSpells[name]),
  }
}

export function readSheetPresentation(value: unknown, editor: EditorState) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const input = value as Record<string, unknown>
  const allowed = sheetPresentation(editor)
  return Object.fromEntries(Object.entries(allowed).flatMap(([key, current]) => {
    const next = input[key]
    if (key === 'a4StatblockWidth') return next === null || Number.isFinite(next) ? [[key, next]] : []
    if (key === 'a4Zoom') return next === 'fit' || Number.isFinite(next) ? [[key, next]] : []
    if (Array.isArray(current)) {
      return Array.isArray(next) && next.every(layer => layer && typeof layer.id === 'string' && typeof layer.type === 'string' && typeof layer.name === 'string') ? [[key, next]] : []
    }
    if (typeof current === 'number') return Number.isFinite(next) ? [[key, next]] : []
    if (typeof current === 'object') {
      const crop = next as { min?: unknown; max?: unknown } | null
      return crop && Number.isFinite(crop.min) && Number.isFinite(crop.max) ? [[key, { min: crop.min, max: crop.max }]] : []
    }
    return typeof next === typeof current ? [[key, next]] : []
  }))
}

export function readSheetSpells(value: unknown): DndSpell[] {
  if (!Array.isArray(value)) return []
  return value.filter((spell): spell is DndSpell =>
    spell && typeof spell.name === 'string' && spell.name.trim() &&
    !Object.hasOwn(Object.prototype, spell.name) &&
    Number.isInteger(spell.level) && spell.level >= 0 && spell.level <= 9 &&
    Array.isArray(spell.class) && spell.class.every((entry: unknown) => typeof entry === 'string'))
}

