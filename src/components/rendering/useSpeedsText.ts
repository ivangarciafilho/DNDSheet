import { type BasicRiderScope } from 'src/core/domain/basic-riders'
import { mechanicPlainText } from 'src/core/domain/mechanic-rich-text'
import { cleanPunctuation, formatDistanceUnit } from 'src/core/domain/number-grammar'
import { computed } from 'vue'
import { capitalize } from 'lodash'
import { escapeHtml } from './advFormat'
import { formatSpeedActionRider } from 'src/core/domain/speeds-traversal'
import type { useMonsterStore as UseMonsterStore } from 'src/stores/monster-store'

/** Speeds: base line, traversal riders and badges. Extracted verbatim from useTextRenderer (C1b). */
export function useSpeedsText(monster: ReturnType<typeof UseMonsterStore>, { formattedNumeric, basicRiderText, options }: { formattedNumeric: (path: string, text: string | number) => string; basicRiderText: (scope: BasicRiderScope) => string[]; options: { web?: boolean } }) {
  const speeds = computed(() => {
    const trav = monster.speedTraversal
    const parts = monster.speeds.map((s) => {
      const typeLower = (s.type || '').toLowerCase()
      const isFly = typeLower === 'fly'
      const isSwim = typeLower === 'swim'
      const noteBits: string[] = []
      if ((s.hover || (isFly && s.hover)) && !s.note?.toLowerCase().includes('hover')) {
        noteBits.push('hover')
      }
      if (isSwim && trav?.aquaticBreathing && trav.aquaticBreathing !== 'none') {
        if (trav.aquaticBreathing === 'amphibious') {
          noteBits.push('amphibious')
        } else if (trav.aquaticBreathing === 'underwater') {
          noteBits.push('can breathe underwater')
        } else if (trav.aquaticBreathing === 'water_only') {
          noteBits.push('can only breathe underwater')
        } else if (trav.aquaticBreathing === 'hold_breath') {
          noteBits.push(`can hold breath for ${trav.holdBreathDuration?.trim() || '1 hour'}`)
        }
      }
      if (s.note && s.note.trim()) {
        noteBits.push(s.note.trim())
      }
      const note = noteBits.length > 0 ? ` (${noteBits.join(', ')})` : ''
      const type =
        s.type != null && s.type.toLowerCase() === 'walk' ? '' : `${s.type} `
      return `${capitalize(type)}${formattedNumeric(`speeds[id=${encodeURIComponent(s.id)}].speed`, s.speed)} ft.${note}`
    })

    if (trav) {
      if (trav.amorphous1Inch) {
        parts.push('move through 1-inch spaces without squeezing')
      }
      if (trav.amorphousCannotEnterLiquids) {
        parts.push("can't enter liquid bodies")
      }
      if (trav.moveThroughCreaturesDifficultTerrain) {
        if (trav.moveThroughCreaturesShunt) {
          if (trav.shuntDestination === 'ethereal_plane') {
            parts.push('move through creature spaces as difficult terrain (shunts creature to Ethereal Plane)')
          } else {
            const dmg = trav.moveThroughCreaturesShuntDamage?.trim() || '1d10 force'
            parts.push(`move through creature spaces as difficult terrain (shunts to adjacent space dealing ${dmg} damage)`)
          }
        } else {
          parts.push('move through creature spaces as difficult terrain')
        }
      }
      if (trav.moveThroughCreaturesTwoSizesDifferent) {
        parts.push('move through spaces of creatures 2 sizes different')
      }
      if (trav.ignoresDifficultTerrain) {
        parts.push('ignores difficult terrain')
      }
      const cunning: string[] = []
      if (trav.bonusActionDash) {
        cunning.push(trav.dashRider?.trim() ? `Dash (${trav.dashRider.trim()})` : 'Dash')
      }
      if (trav.bonusActionDodge) {
        cunning.push(trav.dodgeRider?.trim() ? `Dodge (${trav.dodgeRider.trim()})` : 'Dodge')
      }
      if (trav.bonusActionDisengage) {
        cunning.push(trav.disengageRider?.trim() ? `Disengage (${trav.disengageRider.trim()})` : 'Disengage')
      }
      if (cunning.length > 0) {
        const cunningSeparator = cunning.every((c) => !c.includes('(')) ? '/' : ', '
        parts.push(`bonus action ${cunning.join(cunningSeparator)}`)
      }
      if (Array.isArray(trav.actionRiders) && trav.actionRiders.length > 0) {
        for (const rider of trav.actionRiders) {
          const formatted = formatSpeedActionRider(rider)
          if (formatted) parts.push(formatted)
        }
      }
      if (trav.bonusActionSpeed && trav.bonusActionSpeed > 0) {
        parts.push(`bonus action speed ${trav.bonusActionSpeed} ft.`)
      }
      if (trav.trackingSpeed && trav.trackingSpeed > 0) {
        parts.push(`tracking ${trav.trackingSpeed} ft.`)
      }
      if (trav.stealthSpeed && trav.stealthSpeed > 0) {
        parts.push(`stealth ${trav.stealthSpeed} ft.`)
      }
      if (trav.etherealJaunt && trav.etherealJaunt !== 'none') {
        if (trav.etherealJaunt === 'bonus_action') {
          parts.push('Ethereal Jaunt (Bonus Action: shift to/from Ethereal Plane)')
        } else if (trav.etherealJaunt === 'action') {
          parts.push('Ethereal Jaunt (Action: shift to/from Ethereal Plane)')
        } else if (trav.etherealJaunt === 'at_will') {
          parts.push('Ethereal Jaunt (shift to/from Ethereal Plane at will)')
        }
      }
      const hasSwimSpeed = monster.speeds.some((s) => (s.type || '').toLowerCase() === 'swim')
      if (!hasSwimSpeed && trav.aquaticBreathing && trav.aquaticBreathing !== 'none') {
        if (trav.aquaticBreathing === 'amphibious') {
          parts.push('amphibious')
        } else if (trav.aquaticBreathing === 'underwater') {
          parts.push('can breathe underwater')
        } else if (trav.aquaticBreathing === 'water_only') {
          parts.push('can only breathe underwater')
        } else if (trav.aquaticBreathing === 'hold_breath') {
          parts.push(`can hold breath for ${trav.holdBreathDuration?.trim() || '1 hour'}`)
        }
      }
      if (trav.note && trav.note.trim()) {
        parts.push(trav.note.trim())
      }
    }

    parts.push(...basicRiderText('speed').map(escapeHtml))
    return options.web === false ? mechanicPlainText(parts.join('; ')) : parts.join('; ')
  })

  const speedBaseBadges = computed(() => {
    const trav = monster.speedTraversal
    const parts = monster.speeds.map((s) => {
      const typeLower = (s.type || '').toLowerCase()
      const isFly = typeLower === 'fly'
      const isSwim = typeLower === 'swim'
      const noteBits: string[] = []
      if ((s.hover || (isFly && s.hover)) && !s.note?.toLowerCase().includes('hover')) {
        noteBits.push('hover')
      }
      if (isSwim && trav?.aquaticBreathing && trav.aquaticBreathing !== 'none') {
        if (trav.aquaticBreathing === 'amphibious') {
          noteBits.push('amphibious')
        } else if (trav.aquaticBreathing === 'underwater') {
          noteBits.push('can breathe underwater')
        } else if (trav.aquaticBreathing === 'water_only') {
          noteBits.push('can only breathe underwater')
        } else if (trav.aquaticBreathing === 'hold_breath') {
          noteBits.push(`can hold breath for ${trav.holdBreathDuration?.trim() || '1 hour'}`)
        }
      }
      if (s.note && s.note.trim()) {
        noteBits.push(s.note.trim())
      }
      const note = noteBits.length > 0 ? ` (${noteBits.join(', ')})` : ''
      const type =
        s.type != null && s.type.toLowerCase() === 'walk' ? '' : `${s.type} `
      return `${capitalize(type)}${s.speed} ft.${note}`
    })

    if (trav?.trackingSpeed && trav.trackingSpeed > 0) {
      parts.push(`tracking ${trav.trackingSpeed} ft.`)
    }
    if (trav?.stealthSpeed && trav.stealthSpeed > 0) {
      parts.push(`stealth ${trav.stealthSpeed} ft.`)
    }
    if (trav?.bonusActionSpeed && trav.bonusActionSpeed > 0) {
      parts.push(`bonus action speed ${trav.bonusActionSpeed} ft.`)
    }
    return parts
  })

  const speedRiderBadges = computed(() => {
    const trav = monster.speedTraversal
    const authored = basicRiderText('speed').map(escapeHtml)
    if (!trav) return authored
    const riders: string[] = []

    const sanitizeRiderText = (txt: string) => cleanPunctuation(formatDistanceUnit(txt.replace(/(?<!\bft)\.+$/i, '').trim()))
    if (trav.bonusActionDash) {
      riders.push(trav.dashRider?.trim() ? `Dash: ${sanitizeRiderText(trav.dashRider)}` : 'Bonus Action Dash')
    }
    if (trav.bonusActionDodge) {
      riders.push(trav.dodgeRider?.trim() ? `Dodge: ${sanitizeRiderText(trav.dodgeRider)}` : 'Bonus Action Dodge')
    }
    if (trav.bonusActionDisengage) {
      riders.push(trav.disengageRider?.trim() ? `Disengage: ${sanitizeRiderText(trav.disengageRider)}` : 'Bonus Action Disengage')
    }
    if (trav.bonusActionHide) {
      riders.push(trav.hideRider?.trim() ? `Hide: ${trav.hideRider.trim()}` : 'Bonus Action Hide')
    }
    if (Array.isArray(trav.actionRiders) && trav.actionRiders.length > 0) {
      for (const rider of trav.actionRiders) {
        const formatted = formatSpeedActionRider(rider)
        if (formatted) riders.push(formatted)
      }
    }
    if (trav.amorphous1Inch) {
      riders.push('Amorphous: Move through 1-inch spaces without squeezing')
    }
    if (trav.amorphousCannotEnterLiquids) {
      riders.push("Amorphous: Can't enter liquid bodies")
    }
    if (trav.moveThroughCreaturesDifficultTerrain) {
      if (trav.moveThroughCreaturesShunt) {
        if (trav.shuntDestination === 'ethereal_plane') {
          riders.push('Move through creature spaces as difficult terrain (shunts creature to Ethereal Plane)')
        } else {
          const dmg = trav.moveThroughCreaturesShuntDamage?.trim() || '1d10 force'
          riders.push(`Move through creature spaces as difficult terrain (shunts to adjacent space dealing ${dmg} damage)`)
        }
      } else {
        riders.push('Move through creature spaces as difficult terrain')
      }
    }
    if (trav.moveThroughCreaturesTwoSizesDifferent) {
      riders.push('Move through spaces of creatures 2 sizes different')
    }
    if (trav.ignoresDifficultTerrain) {
      riders.push('Ignores difficult terrain')
    }
    if (trav.etherealJaunt && trav.etherealJaunt !== 'none') {
      if (trav.etherealJaunt === 'bonus_action') {
        riders.push('Ethereal Jaunt (Bonus Action: shift to/from Ethereal Plane)')
      } else if (trav.etherealJaunt === 'action') {
        riders.push('Ethereal Jaunt (Action: shift to/from Ethereal Plane)')
      } else if (trav.etherealJaunt === 'at_will') {
        riders.push('Ethereal Jaunt (shift to/from Ethereal Plane at will)')
      }
    }
    if (trav.note && trav.note.trim()) {
      riders.push(trav.note.trim())
    }
    return [...riders, ...authored]
  })

  const speedBadges = computed(() => {
    return [...speedBaseBadges.value, ...speedRiderBadges.value]
  })

  return { speeds, speedBaseBadges, speedRiderBadges, speedBadges }
}
