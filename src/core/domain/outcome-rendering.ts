import { mechanicRichHtml } from './mechanic-rich-text.ts'
import { outcomePhrase } from './ability-grammar.ts'
import type { AbilityProjection, AbilityRenderContext } from './ability-grammar.ts'
import { normalizeOutcomeData } from './outcome-data.ts'
import { escapeOutcomeHtml } from './description-containers.ts'
import { formatRandomTableAsHtml } from './random-table.ts'

/** Uses the prose resolver for both ordinary clauses and visual sectors. */
export function outcomesHtml(ability: AbilityProjection, context: AbilityRenderContext = {}): string {
  const outcomes = normalizeOutcomeData(ability.outcomes)
  const projected = { ...ability, outcomes }
  const hasSectors = outcomes.some((outcome) => outcome.layoutSector !== 'all' || outcome.targetFilter || outcome.diceTable?.length || outcome.randomTableId || outcome.presentation !== 'inline')
  if (!hasSectors) {
    const prose = outcomePhrase(projected, context, 'screen', 'html').join(' ')
    return prose ? `${prose} ` : ''
  }
  const proseAbility = { ...projected, outcomes: outcomes.map((item) => ({ ...item, diceTable: undefined })) }
  const proseLines = outcomePhrase(proseAbility, context, 'screen', 'html', true)
  const clauses = outcomes.map((outcome, index) => {
    const prose = proseLines[index] ?? ''
    const caption = `${outcome.trigger || 'Outcome'}${outcome.recipient ? `, ${outcome.recipient}` : ''} — roll effects`
    const tables = Array.isArray(context.randomTables) ? context.randomTables : []
    const linked = outcome.randomTableId ? tables.find(table => table && table.id === outcome.randomTableId) : undefined
    const table = linked ? formatRandomTableAsHtml(linked) : outcome.diceTable?.length ? `<table class="outcome-dice-table"><caption>${escapeOutcomeHtml(caption)}</caption><thead><tr><th scope="col">Roll</th><th scope="col">Effect</th></tr></thead><tbody>${outcome.diceTable.map((row) => `<tr><td>${escapeOutcomeHtml(row.roll)}</td><td>${mechanicRichHtml(row.effect)}</td></tr>`).join('')}</tbody></table>` : ''
    return `<div class="outcome-sector outcome-${outcome.presentation}" data-sector="${escapeOutcomeHtml(outcome.layoutSector || 'all')}">${prose}${table}</div>`
  }).join('')
  return `<div class="action-outcomes-grid">${clauses}</div> `
}
