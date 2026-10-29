/**
 * One markup grammar for every multi-cell badge on the stat block
 * (traits, actions, attacks, reactions, legendary and mythic actions,
 * spellcasting). Styling lives in src/css/statblock-grammar.scss.
 *
 *   <div class="sb-plate">                     thick outer frame
 *     <div class="sb-row">                     one line of cells (wraps)
 *       <div class="sb-cell sb-head">          crimson header cell, first
 *       <div class="sb-cell">                  parchment data cells
 *     <div class="sb-body [sb-striped]">       description, striped when long
 */

export interface PlateCell {
  /** Trusted HTML (callers escape user text where needed). */
  html: string
  head?: boolean
  /** Plain-text tooltip. */
  tip?: string
  /** Help dictionary key, read by the stat block tooltip host. */
  help?: string
  /** Extra classes kept for older selectors and tests. */
  cls?: string
  /** Stretch to fill the rest of the row. */
  grow?: boolean
}

export interface PlateRow {
  cells: PlateCell[]
  cls?: string
}

export interface PlateModel {
  rows: PlateRow[]
  body?: string
  cls?: string
}

/** Text long enough to run past two lines gets reading stripes. */
export const STRIPE_THRESHOLD = 110

export function plainTextLength(html: string): number {
  return String(html ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length
}

export function shouldStripe(html: string): boolean {
  return plainTextLength(html) > STRIPE_THRESHOLD
}

// Plates reach the page through sanitizeWebString, which escapes every tag and restores only
// tags whose text holds no '&'. Attribute values therefore stay plain, entity-free text.
const plainAttr = (value: string) =>
  value.replace(/&/g, ' and ').replace(/"/g, "'").replace(/[<>]/g, '').replace(/\s+/g, ' ').trim()

const helpKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')

export function plateCellHtml(cell: PlateCell): string {
  const cls = ['sb-cell', cell.head ? 'sb-head' : '', cell.grow ? 'sb-grow' : '', cell.cls ?? ''].filter(Boolean).join(' ')
  const tipText = cell.tip ? plainAttr(cell.tip) : ''
  const helpText = cell.help ? helpKey(cell.help) : cell.head ? 'entry-name' : ''
  const tip = tipText ? ` title="${tipText}"` : ''
  const help = helpText ? ` data-help="${helpText}" tabindex="0"` : ''
  return `<div class="${cls}"${tip}${help}>${cell.html}</div>`
}

export function plateRowHtml(row: PlateRow): string {
  const cells = row.cells.filter((c) => c && String(c.html ?? '').trim() !== '')
  if (cells.length === 0) return ''
  return `<div class="sb-row${row.cls ? ` ${row.cls}` : ''}">${cells.map(plateCellHtml).join('')}</div>`
}

export function plateBodyHtml(body: string | undefined): string {
  const html = String(body ?? '').trim()
  if (!html) return ''
  const striped = shouldStripe(html) ? ' sb-striped zebra-stripe-text' : ''
  return `<div class="sb-body action-body-text${striped}">${html}</div>`
}

export function plateHtml(model: PlateModel): string {
  const rows = model.rows.map(plateRowHtml).join('')
  return `<div class="sb-plate${model.cls ? ` ${model.cls}` : ''}">${rows}${plateBodyHtml(model.body)}</div>`
}

/**
 * Bolds numbers (with their unit) inside plain text:
 * "3 creatures within 120ft" -> "<strong>3</strong> creatures within <strong>120ft</strong>".
 */
export function boldNumbers(text: string): string {
  return String(text ?? '').replace(
    /(^|[^\w<&#/])([+-]?\d+(?:[.,/]\d+)*(?:\s?(?:ft\.?|feet|foot|miles?|mi\.?))?)(?![\w>])/gi,
    (_m, lead: string, num: string) => `${lead}<strong class="dnd-num">${num}</strong>`
  )
}

/** "Phase" + "Final" -> "Phase Final"; the stage label of a multi-phase creature. */
export function phaseLabel(phaseName: string | undefined, stage: string | number | undefined): string {
  if (stage == null || stage === '' || stage === 'all') return ''
  return `${(phaseName || 'Phase').trim()} ${String(stage).trim()}`
}
