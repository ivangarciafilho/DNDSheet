import type { CharacterActor } from './monster-defaults.ts'

export type CharacterRuleset = '2014' | '2024'

export type WeaponMasteryProperty =
  | 'Cleave'
  | 'Graze'
  | 'Nick'
  | 'Push'
  | 'Sap'
  | 'Slow'
  | 'Topple'
  | 'Vex'

export interface CharacterProvenance {
  ruleset: CharacterRuleset
  source?: string
}

export interface CharacterOriginFeat {
  id: string
  name: string
  notes?: string
}

export interface CharacterWeaponMastery {
  id: string
  weapon: string
  mastery: WeaponMasteryProperty
  notes?: string
}

export const WEAPON_MASTERY_PROPERTIES: ReadonlyArray<{
  value: WeaponMasteryProperty
  label: string
  summary: string
}> = [
  { value: 'Cleave', label: 'Cleave', summary: 'Follow-up melee attack against a second creature within 5 ft. on hit.' },
  { value: 'Graze', label: 'Graze', summary: 'Deal ability modifier damage on a missed attack roll.' },
  { value: 'Nick', label: 'Nick', summary: 'Make the Light weapon extra attack as part of the Attack action.' },
  { value: 'Push', label: 'Push', summary: 'Push a Large or smaller creature up to 10 ft. straight away on hit.' },
  { value: 'Sap', label: 'Sap', summary: 'Target has Disadvantage on its next attack roll before your next turn.' },
  { value: 'Slow', label: 'Slow', summary: 'Reduce target speed by 10 ft. until the start of your next turn.' },
  { value: 'Topple', label: 'Topple', summary: 'Force a CON save on hit or knock the target Prone.' },
  { value: 'Vex', label: 'Vex', summary: 'Gain Advantage on your next attack roll against that creature before next turn ends.' },
]

export const ORIGIN_FEAT_SUGGESTIONS: readonly string[] = [
  'Alert',
  'Crafter',
  'Healer',
  'Lucky',
  'Magic Initiate',
  'Musician',
  'Savage Attacker',
  'Skilled',
  'Tavern Bouncer',
  'Tough',
]

const VALID_MASTERIES = new Set<string>(WEAPON_MASTERY_PROPERTIES.map((m) => m.value))

export function characterRuleset(actor: Pick<CharacterActor, 'provenance'>): CharacterRuleset {
  return actor.provenance?.ruleset === '2024' ? '2024' : '2014'
}

export function normalizeCharacter2024Fields(actor: CharacterActor): void {
  if (actor.provenance !== undefined) {
    const raw = actor.provenance as unknown as Record<string, unknown>
    const ruleset: CharacterRuleset = raw?.ruleset === '2024' ? '2024' : '2014'
    const normalized: CharacterProvenance = { ruleset }
    if (typeof raw?.source === 'string' && raw.source.trim()) {
      normalized.source = raw.source.trim()
    }
    actor.provenance = normalized
  }

  if (actor.originFeats !== undefined) {
    actor.originFeats = Array.isArray(actor.originFeats)
      ? actor.originFeats
          .filter((f): f is CharacterOriginFeat => !!f && typeof f === 'object' && typeof f.name === 'string')
          .map((f, idx) => ({
            id: typeof f.id === 'string' && f.id.trim() ? f.id : `of-${idx + 1}`,
            name: f.name.trim(),
            ...(typeof f.notes === 'string' && f.notes.trim() ? { notes: f.notes.trim() } : {}),
          }))
      : []
  }

  if (actor.weaponMasteries !== undefined) {
    actor.weaponMasteries = Array.isArray(actor.weaponMasteries)
      ? actor.weaponMasteries
          .filter((w): w is CharacterWeaponMastery => !!w && typeof w === 'object' && typeof w.weapon === 'string')
          .map((w, idx) => ({
            id: typeof w.id === 'string' && w.id.trim() ? w.id : `wm-${idx + 1}`,
            weapon: w.weapon.trim(),
            mastery: VALID_MASTERIES.has(w.mastery) ? w.mastery : 'Vex',
            ...(typeof w.notes === 'string' && w.notes.trim() ? { notes: w.notes.trim() } : {}),
          }))
      : []
  }
}
