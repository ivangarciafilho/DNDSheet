import type { ActionDescriptionContainer } from './types'

const plain = (value: unknown): string => typeof value === 'string' || typeof value === 'number' ? String(value) : ''
const entries = (containers?: ActionDescriptionContainer[]) => Array.isArray(containers) ? containers.filter((entry) => entry && typeof entry === 'object') : []
const tableData = (table: ActionDescriptionContainer['table']) => ({
  headers: Array.isArray(table?.headers) ? table.headers.map(plain) : [],
  rows: Array.isArray(table?.rows) ? table.rows.filter(Array.isArray).map((row) => row.map(plain)) : [],
})

export const escapeOutcomeHtml = (text: string): string => plain(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** Plain prose preserves every authored container in order for text exports. */
export function descriptionContainersText(containers?: ActionDescriptionContainer[], html = false): string {
  const text = entries(containers).map((container) => {
    const prefix = plain(container.outcomeTarget).trim() ? `${plain(container.outcomeTarget).trim()}: ` : ''
    const content = container.kind === 'table' && container.table
      ? [tableData(container.table).headers.join(' | '), ...tableData(container.table).rows.map((row) => row.join(' | '))].join('; ')
      : plain(container.text)
    return `${prefix}${content}`
  }).filter(Boolean).join(' ')
  return html ? escapeOutcomeHtml(text) : text
}

export function descriptionContainersHtml(containers?: ActionDescriptionContainer[]): string {
  return entries(containers).map((container) => {
    const prefix = plain(container.outcomeTarget).trim() ? `<i>${escapeOutcomeHtml(plain(container.outcomeTarget).trim())}:</i> ` : ''
    if (container.kind === 'table' && container.table) {
      const headers = tableData(container.table).headers.map((header) => `<th scope="col">${escapeOutcomeHtml(header)}</th>`).join('')
      const rows = tableData(container.table).rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeOutcomeHtml(cell)}</td>`).join('')}</tr>`).join('')
      return `${prefix}<table class="outcome-dice-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`
    }
    return `${prefix}${escapeOutcomeHtml(plain(container.text))}`
  }).join(' ')
}
