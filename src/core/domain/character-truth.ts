import type { CharacterActor } from './types.ts'
import { statModifier } from './math-utils.ts'

export interface CharacterVitalProjection {
  value: number
  kind: 'recorded' | 'estimate'
  label: string
  provenance: string
}

/** Identity strings and inventory names cannot establish armor or species rules. */
export function characterVitals(actor: CharacterActor): {
  armorClass: CharacterVitalProjection
  speed: CharacterVitalProjection
} {
  const recorded = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0
  const note = (value: unknown, fallback: string) =>
    typeof value === 'string' && value.trim() ? value.trim() : fallback
  const ac = actor.combatVitals?.armorClass
  const speed = actor.combatVitals?.speed
  return {
    armorClass: recorded(ac)
      ? {
          value: ac,
          kind: 'recorded',
          label: 'Recorded value',
          provenance: note(
            actor.combatVitals?.armorClassSource,
            'User supplied total; rules not verified.'
          ),
        }
      : {
          value: 10 + statModifier(actor.stats.DEX),
          kind: 'estimate',
          label: 'Estimate',
          provenance:
            '10 + DEX modifier; armor, shields and features are not applied.',
        },
    speed: recorded(speed)
      ? {
          value: speed,
          kind: 'recorded',
          label: 'Recorded value',
          provenance: note(
            actor.combatVitals?.speedSource,
            'User supplied total; rules not verified.'
          ),
        }
      : {
          value: 30,
          kind: 'estimate',
          label: 'Estimate',
          provenance:
            '30 ft. placeholder; species, class and equipment are not applied.',
        },
  }
}

export function characterVitalText(
  vital: CharacterVitalProjection,
  unit = ''
): string {
  return `${vital.value}${unit} (${vital.label.toLowerCase()}: ${
    vital.provenance
  })`
}
