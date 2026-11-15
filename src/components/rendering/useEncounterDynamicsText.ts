import type { useProcessTokens as UseProcessTokens } from './useProcessTokens'
import { computed } from 'vue'
import type { useMonsterStore as UseMonsterStore } from 'src/stores/monster-store'

/** Villain, bloodied, reactive and combo actions, anatomy parts, Runehammer track and paragon pools. Extracted verbatim from useTextRenderer (C1b). */
export function useEncounterDynamicsText(monster: ReturnType<typeof UseMonsterStore>, { processTokens }: {
  processTokens: ReturnType<typeof UseProcessTokens>['processTokens']
}) {
  // Advanced Battle Dynamics Computed Getters
  const buildCompositePill = (name: string, cells: string[]): string => {
    const cellHtml = cells
      .filter(Boolean)
      .map((c) => `<span class="action-pill-cell">${c}</span>`)
      .join('')
    return `<div class="action-composite-pill"><span class="action-pill-name">${name}</span>${cellHtml}</div>`
  }

  const villainActionsList = computed(() => {
    if (!Array.isArray(monster.villainActions) || monster.villainActions.length === 0) return []
    return monster.villainActions.map((va) => ({
      ...va,
      rendered: `${buildCompositePill(`Round ${va.round}: ${va.name}`, [va.trigger || "End of another creature's turn"])} ${processTokens(va.description, undefined, monster, 'action')}`,
    }))
  })

  const bloodiedActionsList = computed(() => {
    if (!Array.isArray(monster.bloodiedActions) || monster.bloodiedActions.length === 0) return []
    return monster.bloodiedActions.map((ba) => {
      const trig = ba.trigger || (ba.triggerType === 'immediate_reaction' ? 'Immediate Reaction' : 'While Bloodied')
      return {
        ...ba,
        rendered: `${buildCompositePill(ba.name, [String(trig)])} ${processTokens(ba.description, undefined, monster, 'action')}`,
      }
    })
  })

  const reactiveActionsList = computed(() => {
    if (!Array.isArray(monster.reactiveActions) || monster.reactiveActions.length === 0) return []
    return monster.reactiveActions.map((ra) => ({
      ...ra,
      rendered: `${buildCompositePill(ra.name, [ra.trigger ? `Trigger: ${ra.trigger}` : 'Reaction', ra.usesPerRound ? `${ra.usesPerRound}/round` : ''])} ${processTokens(ra.description, undefined, monster, 'action')}`,
    }))
  })

  const comboActionsList = computed(() => {
    if (!Array.isArray(monster.comboActions) || monster.comboActions.length === 0) return []
    return monster.comboActions.map((ca) => {
      const followUp = ca.followUpAction || ca.followup || 'Follow-Up'
      const cond = ca.condition || ca.triggerCondition || ''
      return {
        ...ca,
        rendered: `${buildCompositePill(ca.name, [`Combo: ${ca.leadAction} ➔ ${followUp}`, cond ? `Condition: ${cond}` : ''])} ${processTokens(ca.description, undefined, monster, 'action')}`,
      }
    })
  })

  const anatomyPartsList = computed(() => {
    if (!Array.isArray(monster.anatomyParts) || monster.anatomyParts.length === 0) return []
    return monster.anatomyParts.map((ap) => {
      const partName = ap.name || ap.part || 'Targetable Part'
      const effect = ap.breakEffect || ap.severEffect || 'Disabled when reduced to 0 HP.'
      return {
        ...ap,
        name: partName,
        breakEffect: effect,
        rendered: `${buildCompositePill(partName, [`HP ${ap.hp || 0}`, ap.ac ? `AC ${ap.ac}` : '', ap.threshold ? `DT ${ap.threshold}` : ''])} ${effect}`,
      }
    })
  })

  const runehammerTrackData = computed(() => {
    const die = monster.runehammerTrack?.timerDie || monster.runehammerTrack?.die || 'd4'
    if (!monster.runehammerTrack?.enabled || !Array.isArray(monster.runehammerTrack.events) || monster.runehammerTrack.events.length === 0) {
      return null
    }
    return {
      title: monster.runehammerTrack.name || 'Escalation Track',
      timerDie: die,
      events: monster.runehammerTrack.events.map((ev) => {
        const desc = ev.description || ev.effect || ''
        return {
          ...ev,
          rendered: `${buildCompositePill(`Round ${ev.round}: ${ev.name}`, [`Timer ${die}`])} ${desc}`,
        }
      }),
    }
  })

  const paragonData = computed(() => {
    if (!monster.paragonConfig?.enabled) return null
    const poolCount = monster.paragonConfig.poolCount || monster.paragonConfig.poolsCount || 2
    return {
      title: `Paragon Boss (${poolCount} Action Pools)`,
      pools: Array.isArray(monster.paragonConfig.poolHp)
        ? monster.paragonConfig.poolHp.map((hp, idx) => `Pool ${idx + 1}: ${hp} HP`).join(' | ')
        : `${poolCount} Stages`,
      initiative: monster.paragonConfig.initiativeStep || 'Acts at multiple initiatives',
      enrageNote: monster.paragonConfig.enrageNote || monster.paragonConfig.transitionEffect || '',
    }
  })

  return { buildCompositePill, villainActionsList, bloodiedActionsList, reactiveActionsList, comboActionsList, anatomyPartsList, runehammerTrackData, paragonData }
}
