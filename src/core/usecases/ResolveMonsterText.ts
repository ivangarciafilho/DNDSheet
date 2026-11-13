/**
 * Field-level macro resolution for every output that reads authored text directly (text exports,
 * Foundry, character sheets). Resolution runs per value, never on finished output: LaTeX and JSON
 * use braces of their own. Context tokens ({attack.*}, {trait.*}) survive for the per-entry pass.
 */
import { processTokens } from './ProcessTokens.ts'
import type { CharacterActor, Monster } from '../domain/types.ts'

/** Definitions and wiring, never printed: resolving them would destroy the source of truth. */
const KEEP_RAW = new Set(['bindings', 'customVariables', 'customMacros', 'id', 'saveVersion'])

type Macros = { customVariables?: Record<string, unknown>; customMacros?: Record<string, unknown> }

const escapeKey = (key: string) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** One authored value, resolved against `monster` (formulas, tokens, the author's variables and macros). */
export function resolveText(text: string, monster: Partial<Monster> & Macros): string {
  if (!text || !text.includes('{')) return text
  let out = text
  for (const source of [monster.customVariables, monster.customMacros]) {
    for (const [key, value] of Object.entries(source ?? {})) {
      if (key.trim()) out = out.replace(new RegExp(`\\{${escapeKey(key)}\\}`, 'gi'), String(value))
    }
  }
  return processTokens(out, monster as Monster)
}

function resolveDeep(value: unknown, monster: Partial<Monster> & Macros, depth: number): unknown {
  if (typeof value === 'string') return resolveText(value, monster)
  if (!value || typeof value !== 'object' || depth > 12) return value
  if (Array.isArray(value)) return value.map((item) => resolveDeep(item, monster, depth + 1))
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, KEEP_RAW.has(key) ? item : resolveDeep(item, monster, depth + 1)]))
}

/** A copy of `monster` whose printed text is resolved; the input is not modified. */
export function resolveMonsterText<T extends object>(monster: T): T {
  const plain = ((monster as { $state?: T }).$state ?? monster) as Partial<Monster> & Macros
  return resolveDeep(plain, plain, 0) as T
}

/**
 * A read-only view of a live monster (store or plain object) whose string reads come back resolved.
 * Renderers that read fields directly use it so they print exactly what the stat block prints.
 */
export function resolvingMonsterView<T extends object>(monster: T): T {
  const source = () => (((monster as { $state?: unknown }).$state ?? monster) as Partial<Monster> & Macros)
  const cache = new WeakMap<object, object>()
  const wrap = (target: object): object => {
    const known = cache.get(target)
    if (known) return known
    const view = new Proxy(target, {
      get(obj, key, receiver) {
        const value = Reflect.get(obj, key, receiver)
        if (typeof key === 'string' && KEEP_RAW.has(key)) return value
        if (typeof value === 'string') return resolveText(value, source())
        if (value && typeof value === 'object') return wrap(value)
        return value
      },
      set() { return false },
    })
    cache.set(target, view)
    return view
  }
  return wrap(monster) as T
}

/** The character as a formula source: its scores, proficiency, AC, hit points, Hit Dice and casting ability. */
export function characterFormulaMonster(char: Partial<CharacterActor>): Partial<Monster> {
  return {
    name: char.name ?? '',
    stats: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10, ...(char.stats ?? {}) },
    proficiency: char.proficiency ?? 2,
    AC: char.combatVitals?.armorClass ?? 10,
    HP: { HD: char.hitDice?.total ?? char.level ?? 1, type: char.hitDice?.die ?? 8, modifier: 0 },
    avgHp: char.hp?.max ?? 0,
    spellcasting: { stat: char.spellcasting?.ability ?? 'INT', level: char.level ?? 1 } as Monster['spellcasting'],
  } as Partial<Monster>
}

export function resolveCharacterText(text: string, char: Partial<CharacterActor>): string {
  return resolveText(text, characterFormulaMonster(char))
}

/** A copy of the character whose authored notes and descriptions are resolved. */
export function resolveCharacterFields<T extends Partial<CharacterActor>>(char: T): T {
  return resolveDeep(char, characterFormulaMonster(char), 0) as T
}
