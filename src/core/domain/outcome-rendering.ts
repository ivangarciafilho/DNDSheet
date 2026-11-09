import { outcomePhrase } from './ability-grammar.ts'
import type { AbilityProjection, AbilityRenderContext } from './ability-grammar.ts'
import { escapeOutcomeHtml } from './description-containers.ts'
import { formatRandomTableAsHtml } from './random-table.ts'

/** Uses the prose resolver for both ordinary clauses and visual sectors. */
export function outcomesHtml(ability: AbilityProjection, context: AbilityRenderContext = {}): string {
  const sectors = ability.outcomes.some((outcome) => (outcome.layoutSector && outcome.layoutSector !== 'all') || outcome.targetFilter || outcome.diceTable?.length || outcome.randomTableId || (outcome.presentation && outcome.presentation !== 'inline'))
  if (!sectors) {
    const prose = outcomePhrase(ability, context, 'screen', 'html').join(' ')
    return prose ? `${prose} ` : ''
  }
  const proseAbility = { ...ability, outcomes: ability.outcomes.map((item) => ({ ...item, diceTable: undefined })) }
  const proseLines = outcomePhrase(proseAbility, context, 'screen', 'html')
  const clauses = ability.outcomes.map((outcome, index) => {
    const prose = proseLines[index]
    let table = ''
    if (outcome.randomTableId && Array.isArray((context as any).randomTables)) {
      const found = (context as any).randomTables.find((t: any) => t && t.id === outcome.randomTableId)
      if (found) table = formatRandomTableAsHtml(found)
    }
    if (!table && outcome.diceTable?.length) {
      table = `<table class="outcome-dice-table"><thead><tr><th scope="col">Roll</th><th scope="col">Effect</th></tr></thead><tbody>${outcome.diceTable.map((row) => `<tr><td>${escapeOutcomeHtml(row.roll)}</td><td>${escapeOutcomeHtml(row.effect)}</td></tr>`).join('')}</tbody></table>`
    }
    const presentation = outcome.presentation === 'horizontal' || outcome.presentation === 'vertical' ? outcome.presentation : 'inline'
    const sector = ['all', 'top_left', 'top_right', 'bottom_left', 'bottom_right', 'row_1', 'row_2', 'col_1', 'col_2'].includes(outcome.layoutSector ?? '') ? outcome.layoutSector : 'all'
    return `<div class="outcome-sector outcome-${presentation}" data-sector="${escapeOutcomeHtml(sector || 'all')}">${prose}${table}</div>`
  }).join('')
  return `<div class="action-outcomes-grid">${clauses}</div> `
}
