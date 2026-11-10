import { mechanicRichHtml, mechanicPlainText } from './mechanic-rich-text.ts'
import type { ActionDescriptionContainer, ActionDescriptionRegion } from './types.ts'
import type { RandomTable } from './random-table.ts'
import { formatRandomTableAsHtml, tableToProse } from './random-table.ts'
import { cleanPunctuation, formatDistanceUnit, sanitizeProsePunctuation } from './number-grammar.ts'

export const MAX_REGIONS_PER_CONTAINER = 4

const plain = (value: unknown): string => (typeof value === 'string' || typeof value === 'number' ? String(value) : '')
const entries = (containers?: ActionDescriptionContainer[]) => (Array.isArray(containers) ? containers.filter((entry) => entry && typeof entry === 'object') : [])

const tableData = (table?: ActionDescriptionContainer['table']) => ({
  headers: Array.isArray(table?.headers) ? table.headers.map(plain) : [],
  rows: Array.isArray(table?.rows) ? table.rows.filter(Array.isArray).map((row) => row.map(plain)) : [],
})

export const escapeOutcomeHtml = (text: string): string =>
  plain(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

/**
 * Parses numeric ranges in dice roll table cells (e.g. "1", "1-2", "01-20", "1 to 3", "d6").
 */
export function parseDiceRange(cell: string): { min: number; max: number } | null {
  const s = plain(cell).trim().toLowerCase()
  if (!s) return null

  // Single number "4"
  const singleMatch = s.match(/^(\d+)$/)
  if (singleMatch) {
    const val = Number(singleMatch[1])
    return { min: val, max: val }
  }

  // Range "1-4", "1–4", "1 to 4"
  const rangeMatch = s.match(/^(\d+)\s*(?:[-–—]|to)\s*(\d+)$/)
  if (rangeMatch) {
    const min = Number(rangeMatch[1])
    const max = Number(rangeMatch[2])
    return { min: Math.min(min, max), max: Math.max(min, max) }
  }

  // Die notation "d6" or "1d6" -> 1 to 6
  const dieMatch = s.match(/^(?:1)?d(\d+)$/)
  if (dieMatch) {
    const sides = Number(dieMatch[1])
    return { min: 1, max: sides }
  }

  return null
}

export interface DiceTableDiagnostics {
  hasGaps: boolean
  hasOverlaps: boolean
  gaps: string[]
  overlaps: string[]
  valid: boolean
  continuous: boolean
}

/**
 * Diagnoses gaps, overlaps, and continuity in dice roll tables.
 */
export function diagnoseDiceTable(table?: ActionDescriptionContainer['table']): DiceTableDiagnostics {
  const data = tableData(table)
  const ranges: { min: number; max: number; rowIdx: number; raw: string }[] = []

  for (let idx = 0; idx < data.rows.length; idx++) {
    const row = data.rows[idx]
    if (row.length > 0) {
      const parsed = parseDiceRange(row[0])
      if (parsed) {
        ranges.push({ ...parsed, rowIdx: idx, raw: row[0] })
      }
    }
  }

  if (ranges.length < 2) {
    return {
      hasGaps: false,
      hasOverlaps: false,
      gaps: [],
      overlaps: [],
      valid: true,
      continuous: ranges.length === 1,
    }
  }

  // Sort ranges by min ascending
  const sorted = [...ranges].sort((a, b) => a.min - b.min)
  const gaps: string[] = []
  const overlaps: string[] = []

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const curr = sorted[i]

    if (curr.min <= prev.max) {
      overlaps.push(`Rows "${prev.raw}" (${prev.min}-${prev.max}) and "${curr.raw}" (${curr.min}-${curr.max}) overlap`)
    } else if (curr.min > prev.max + 1) {
      gaps.push(`Gap of ${curr.min - prev.max - 1} between "${prev.raw}" (max ${prev.max}) and "${curr.raw}" (min ${curr.min})`)
    }
  }

  const hasGaps = gaps.length > 0
  const hasOverlaps = overlaps.length > 0

  return {
    hasGaps,
    hasOverlaps,
    gaps,
    overlaps,
    valid: !hasGaps && !hasOverlaps,
    continuous: !hasGaps && !hasOverlaps,
  }
}

/**
 * Filter container regions by audience and/or plane.
 */
export function filterContainerRegions(
  regions?: ActionDescriptionRegion[],
  filter?: { audience?: 'all' | 'target' | 'creatures' | 'caster'; plane?: string }
): ActionDescriptionRegion[] {
  if (!Array.isArray(regions)) return []
  if (!filter || (!filter.audience && !filter.plane)) return [...regions]

  return regions.filter((r) => {
    if (filter.audience && r.audience && r.audience !== 'all' && r.audience !== filter.audience) {
      return false
    }
    if (filter.plane && r.plane && r.plane.trim().toLowerCase() !== filter.plane.trim().toLowerCase()) {
      return false
    }
    return true
  })
}

/**
 * Normalizes container ensuring the hard cap of 4 regions is respected and properties are safe.
 */
export function normalizeContainer(container: ActionDescriptionContainer): ActionDescriptionContainer {
  const norm: ActionDescriptionContainer = {
    id: container.id || `container-${Math.random().toString(36).slice(2, 9)}`,
    kind: container.kind === 'table' ? 'table' : container.kind === 'random_table' ? 'random_table' : 'text',
    outcomeTarget: container.outcomeTarget ? plain(container.outcomeTarget).trim() : undefined,
    text: container.text ? plain(container.text) : undefined,
    randomTableId: container.randomTableId ? plain(container.randomTableId).trim() : undefined,
  }

  if (container.kind === 'table' && container.table) {
    norm.table = {
      headers: Array.isArray(container.table.headers) ? container.table.headers.map(plain) : [],
      rows: Array.isArray(container.table.rows) ? container.table.rows.filter(Array.isArray).map((r) => r.map(plain)) : [],
    }
  }

  if (Array.isArray(container.regions)) {
    norm.regions = container.regions.slice(0, MAX_REGIONS_PER_CONTAINER).map((r, rIdx) => ({
      id: r.id || `region-${rIdx}-${Math.random().toString(36).slice(2, 7)}`,
      title: r.title ? plain(r.title).trim() : undefined,
      kind: r.kind === 'table' ? 'table' : r.kind === 'random_table' ? 'random_table' : 'text',
      audience: r.audience,
      plane: r.plane ? plain(r.plane).trim() : undefined,
      text: r.text ? plain(r.text) : undefined,
      randomTableId: r.randomTableId ? plain(r.randomTableId).trim() : undefined,
      table: r.table
        ? {
            headers: Array.isArray(r.table.headers) ? r.table.headers.map(plain) : [],
            rows: Array.isArray(r.table.rows) ? r.table.rows.filter(Array.isArray).map((row) => row.map(plain)) : [],
          }
        : undefined,
    }))
  }

  return norm
}

/**
 * Adds a region to container while strictly enforcing the hard cap of 4 regions.
 */
export function addRegionToContainer(
  container: ActionDescriptionContainer,
  region: ActionDescriptionRegion
): { success: boolean; container: ActionDescriptionContainer; error?: string } {
  const currentRegions = Array.isArray(container.regions) ? [...container.regions] : []
  if (currentRegions.length >= MAX_REGIONS_PER_CONTAINER) {
    return {
      success: false,
      container,
      error: `Maximum ${MAX_REGIONS_PER_CONTAINER} regions per container reached`,
    }
  }

  const updated: ActionDescriptionContainer = {
    ...container,
    regions: [...currentRegions, region],
  }
  return {
    success: true,
    container: normalizeContainer(updated),
  }
}

/**
 * Plain prose preserves every authored container and region in order for text exports.
 */
export function descriptionContainersText(
  containers?: ActionDescriptionContainer[],
  html = false,
  randomTables: RandomTable[] = []
): string {
  const text = entries(containers)
    .map((container) => {
      const parts: string[] = []
      const targetLabel = plain(container.outcomeTarget).replace(/[:\s]+$/, '').trim()
      const prefix = targetLabel ? `${targetLabel}: ` : ''

      let content = ''
      if (container.kind === 'random_table' || container.randomTableId) {
        const found = randomTables.find((t) => t.id === (container.randomTableId || container.id))
        if (found) content = tableToProse(found)
      }
      if (!content) {
        content =
          container.kind === 'table' && container.table
            ? [tableData(container.table).headers.join(' | '), ...tableData(container.table).rows.map((row) => row.join(' | '))].join('; ')
            : plain(container.text)
      }

      if (prefix || content) {
        parts.push(`${prefix}${content}`.trim())
      }

      if (Array.isArray(container.regions) && container.regions.length > 0) {
        for (const reg of container.regions.slice(0, MAX_REGIONS_PER_CONTAINER)) {
          const regTitle = reg.title ? `[${reg.title}] ` : ''
          const regAudience = reg.audience && reg.audience !== 'all' ? `(${reg.audience}) ` : ''
          const regPlane = reg.plane ? `[${reg.plane} Plane] ` : ''

          let regContent = ''
          if (reg.kind === 'random_table' || reg.randomTableId) {
            const found = randomTables.find((t) => t.id === (reg.randomTableId || reg.id))
            if (found) regContent = tableToProse(found)
          }
          if (!regContent) {
            regContent =
              reg.kind === 'table' && reg.table
                ? [tableData(reg.table).headers.join(' | '), ...tableData(reg.table).rows.map((row) => row.join(' | '))].join('; ')
                : plain(reg.text)
          }

          if (regTitle || regAudience || regPlane || regContent) {
            parts.push(`${regTitle}${regAudience}${regPlane}${regContent}`.trim())
          }
        }
      }

      return parts.join(' ')
    })
    .filter(Boolean)
    .join(' ')

  const sanitized = sanitizeProsePunctuation(text)
  return html ? mechanicRichHtml(sanitized) : mechanicPlainText(sanitized)
}

/**
 * Semantic HTML renderer for description containers and their sub-regions.
 */
export function descriptionContainersHtml(
  containers?: ActionDescriptionContainer[],
  randomTables: RandomTable[] = []
): string {
  return entries(containers)
    .map((container) => {
      const parts: string[] = []
      const targetLabel = plain(container.outcomeTarget).replace(/[:\s]+$/, '').trim()
      const prefix = targetLabel
        ? `<i>${mechanicRichHtml(targetLabel)}:</i> `
        : ''

      let hasMain = false
      if (container.kind === 'random_table' || container.randomTableId) {
        const found = randomTables.find((t) => t.id === (container.randomTableId || container.id))
        if (found) {
          parts.push(`${prefix}${formatRandomTableAsHtml(found)}`)
          hasMain = true
        }
      }
      if (!hasMain) {
        if (container.kind === 'table' && container.table) {
          const headers = tableData(container.table).headers.map((header) => `<th scope="col">${escapeOutcomeHtml(header)}</th>`).join('')
          const rows = tableData(container.table).rows.map((row) => `<tr>${row.map((cell) => `<td>${mechanicRichHtml(formatDistanceUnit(cell))}</td>`).join('')}</tr>`).join('')
          parts.push(`${prefix}<table class="outcome-dice-table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`)
        } else if (plain(container.text).trim()) {
          const formattedText = mechanicRichHtml(cleanPunctuation(formatDistanceUnit(plain(container.text))))
          parts.push(`${prefix}${formattedText}`)
        }
      }

      if (Array.isArray(container.regions) && container.regions.length > 0) {
        const renderedRegions = container.regions
          .slice(0, MAX_REGIONS_PER_CONTAINER)
          .map((reg) => {
            const metaTokens: string[] = []
            if (reg.title) metaTokens.push(`<strong class="region-title">${escapeOutcomeHtml(reg.title)}</strong>`)
            if (reg.audience && reg.audience !== 'all') metaTokens.push(`<span class="region-audience badge">Audience: ${escapeOutcomeHtml(reg.audience)}</span>`)
            if (reg.plane) metaTokens.push(`<span class="region-plane badge">${escapeOutcomeHtml(reg.plane)}</span>`)
            const metaHeader = metaTokens.length ? `<div class="region-meta">${metaTokens.join(' ')}</div>` : ''

            let regBody = ''
            if (reg.kind === 'random_table' || reg.randomTableId) {
              const found = randomTables.find((t) => t.id === (reg.randomTableId || reg.id))
              if (found) {
                regBody = formatRandomTableAsHtml(found)
              }
            }
            if (!regBody) {
              if (reg.kind === 'table' && reg.table) {
                const rHeaders = tableData(reg.table).headers.map((h) => `<th scope="col">${escapeOutcomeHtml(h)}</th>`).join('')
                const rRows = tableData(reg.table).rows.map((row) => `<tr>${row.map((cell) => `<td>${mechanicRichHtml(formatDistanceUnit(cell))}</td>`).join('')}</tr>`).join('')
                regBody = `<table class="outcome-dice-table region-table"><thead><tr>${rHeaders}</tr></thead><tbody>${rRows}</tbody></table>`
              } else if (plain(reg.text).trim()) {
                const cleanRegText = mechanicRichHtml(cleanPunctuation(formatDistanceUnit(plain(reg.text))))
                regBody = `<div class="region-text">${cleanRegText}</div>`
              }
            }

            return `<div class="description-region">${metaHeader}${regBody}</div>`
          })
          .join('')

        if (renderedRegions) {
          parts.push(`<div class="description-regions-container">${renderedRegions}</div>`)
        }
      }

      return parts.join(' ')
    })
    .join(' ')
}
