import { defaultCharacterActor, type CharacterActor } from './types.ts'

const STATS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)

/** A character file (`*.character.json`) has a class, level, race and six ability scores, and no monster `saveVersion`. */
export function looksLikeCharacter(raw: unknown): raw is Record<string, unknown> {
  if (!isRecord(raw) || 'saveVersion' in raw) return false
  const stats = raw.stats
  return typeof raw.class === 'string' && typeof raw.level === 'number' && typeof raw.race === 'string' &&
    isRecord(stats) && STATS.every((stat) => typeof stats[stat] === 'number')
}

/**
 * B4.17: the inverse of `exportCharacterToJson`. Unknown fields are kept (forward compatibility); missing ones come
 * from the default character so the sheet never meets an undefined section; ability scores are clamped to 1..30.
 */
export function importCharacter(raw: unknown): CharacterActor | null {
  if (!looksLikeCharacter(raw)) return null
  const base = defaultCharacterActor()
  const merged = { ...base, ...JSON.parse(JSON.stringify(raw)) } as CharacterActor
  const stats = raw.stats as Record<string, number>
  merged.stats = { ...base.stats }
  for (const stat of STATS) merged.stats[stat] = Math.min(30, Math.max(1, Math.round(stats[stat])))
  merged.level = Math.min(20, Math.max(1, Math.round(Number(raw.level))))
  if (typeof merged.id !== 'string' || !merged.id) merged.id = base.id
  if (typeof merged.name !== 'string') merged.name = base.name
  return merged
}
