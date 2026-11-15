import { v4 as uuidv4 } from 'uuid'
import type { Monster, MonsterAction, MonsterTrait } from '../domain/types.ts'

/**
 * A library preset: a partial monster plus a few legacy authoring keys that have no
 * Monster field of their own (`hpNotes`, `initiative`, `bonusActions`). Those are mapped
 * onto their real homes here; writing them onto the monster as-is leaves dead fields
 * that nothing renders.
 */
export type MonsterPreset = Partial<Omit<Monster, 'actions' | 'traits' | 'spellcasting'>> & {
  spellcasting?: Partial<Monster['spellcasting']>
  isBuiltin?: boolean
  hpNotes?: string
  initiative?: { advantage?: boolean; disadvantage?: boolean; notes?: string }
  actions?: Partial<MonsterAction>[]
  bonusActions?: Partial<MonsterAction>[]
  traits?: Partial<MonsterTrait>[]
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

// `proficiency` and `hpModifierOverride` were declared by built-in presets but silently dropped before.
const REPLACED = ['type', 'subtype', 'size', 'alignment', 'CR', 'proficiency', 'AC', 'ACType', 'HP', 'hpModifierOverride', 'speeds',
  'senses', 'sensesList', 'languages', 'stats', 'saves', 'compactNameplate', 'showXp'] as const

/** Mutates `state` (call inside a store `$patch`). Built-in presets also replace the name. */
export function applyMonsterPreset(state: Monster, preset: MonsterPreset): void {
  if (preset.name && preset.isBuiltin) state.name = preset.name.replace(/\s*\(Master.*\)$/, '')
  const target = state as unknown as Record<string, unknown>
  for (const key of REPLACED) {
    const value = preset[key]
    // An empty subtype is a real value (it clears the field); only absent keys are skipped.
    if (value === undefined || value === null) continue
    target[key] = typeof value === 'object' ? clone(value) : value
  }

  // A preset's spellcasting is partial: merge it, so required fields keep their current values.
  if (preset.spellcasting) state.spellcasting = { ...state.spellcasting, ...clone(preset.spellcasting) }

  if (preset.initiative) {
    const { advantage, disadvantage, notes } = preset.initiative
    state.initiativeConfig = {
      ...state.initiativeConfig,
      ...(advantage !== undefined ? { advantage } : {}),
      ...(disadvantage !== undefined ? { disadvantage } : {}),
      ...(notes ? { customEffectNote: notes } : {}),
    }
  }

  const actions = [
    ...(preset.actions ?? []).map((a) => ({ ...clone(a), bonusAction: Boolean(a.bonusAction) })),
    ...(preset.bonusActions ?? []).map((a) => ({ ...clone(a), bonusAction: true })),
  ] as MonsterAction[]
  if (preset.actions) state.actions = actions
  else if (actions.length) state.actions = [...state.actions, ...actions]

  const note = preset.hpNotes?.trim()
  if (note) {
    const riders = state.basicRiders ?? (state.basicRiders = {})
    const hp = riders.hp ?? (riders.hp = [])
    if (!hp.some((r) => r.effect.trim() === note)) hp.push({ id: uuidv4(), cadence: '', timing: '', effect: note })
  }

  for (const t of preset.traits ?? []) {
    const name = String(t.name ?? '').toLowerCase()
    if (name && !state.traits.some((ex) => ex.name.toLowerCase() === name)) state.traits.push(clone(t) as MonsterTrait)
  }
  for (const key of ['resistances', 'vulnerabilities'] as const) {
    for (const entry of preset[key] ?? []) if (!state[key].includes(entry)) state[key].push(entry)
  }
}
