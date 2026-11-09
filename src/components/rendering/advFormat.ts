import { effectiveAdvantage } from 'src/core/domain/skill-action-groups'

/**
 * One markup grammar for every rolled value on the stat block:
 * numbers are bold (.dnd-num); a value with Advantage or Disadvantage is
 * wrapped whole (numbers, label and glyph) in .dnd-adv / .dnd-disadv so the
 * color covers the entire label while only the numbers stay bold.
 */

export const ADV_GLYPH = { advantage: '▲▲', disadvantage: '▼▼' } as const

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function numHtml(value: string | number): string {
  return `<strong class="dnd-num">${value}</strong>`
}

export function advHtml(inner: string, advantage?: boolean, disadvantage?: boolean, tip?: string): string {
  const mode = effectiveAdvantage(advantage, disadvantage)
  if (mode === 'none') return inner
  const cls = mode === 'advantage' ? 'dnd-adv' : 'dnd-disadv'
  const title = tip ?? (mode === 'advantage' ? 'Advantage' : 'Disadvantage')
  // non-breaking space keeps the glyph on the same line as the value it marks
  return `<span class="${cls}" title="${escapeHtml(title)}">${inner}\u00a0<span class="dnd-adv-glyph" role="img" aria-label="${mode === 'advantage' ? 'Advantage' : 'Disadvantage'}">${ADV_GLYPH[mode]}</span></span>`
}

/** Drops markup produced by the helpers above for plain-text targets. */
export function htmlToText(html: string): string {
  return String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

export function condHtml(condition?: string): string {
  const text = (condition ?? '').trim()
  return text ? ` <span class="dnd-badge-cond">(${escapeHtml(text)})</span>` : ''
}
