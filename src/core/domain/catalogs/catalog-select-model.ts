/**
 * Pure presentation/selection model for CatalogSelect:
 * - Custom / saved values always come first
 * - Remaining options keep canonical group headings and sort alphabetically within each group
 *   unless preserveOrder is true (e.g., Size Scale, Spell Levels, Alignment)
 * - Deterministic case-insensitive search filtering and keyboard index navigation
 */
import { canonicalCatalog, type CanonicalCatalogEntry, type CatalogId } from './enumerations.ts'

export interface CatalogOption<T extends string | number = string | number> {
  value: T
  label: string
  group: string
  badge?: string
  custom?: boolean
  firstInGroup?: boolean
  meta?: Record<string, string>
}

export interface BuildCatalogOptionsConfig {
  catalogId?: CatalogId
  entries?: readonly CanonicalCatalogEntry<string | number>[]
  customValues?: readonly (string | number)[]
  currentValue?: string | number | readonly (string | number)[] | null
  preserveOrder?: boolean
  customGroupLabel?: string
}

const DEFAULT_CUSTOM_GROUP = 'Custom / Saved'

function compareAlpha(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base' })
}

function asArray(value: BuildCatalogOptionsConfig['currentValue']): (string | number)[] {
  if (value === undefined || value === null || value === '') return []
  return Array.isArray(value) ? [...value] : [value as string | number]
}

/** Build custom-first, group-ordered option list obeying the catalog order law. */
export function buildCatalogOptions(config: BuildCatalogOptionsConfig): CatalogOption[] {
  const catalog = config.catalogId ? canonicalCatalog(config.catalogId) : undefined
  const baseEntries = config.entries ?? catalog?.entries ?? []
  const preserveOrder = config.preserveOrder ?? catalog?.preserveOrder ?? false
  const customGroup = config.customGroupLabel ?? DEFAULT_CUSTOM_GROUP

  const knownKeys = new Set(baseEntries.map((entry) => String(entry.value)))
  const seen = new Set<string>()
  const customOptions: CatalogOption[] = []

  const pushCustom = (raw: string | number) => {
    const key = String(raw)
    if (!key.trim() || knownKeys.has(key) || seen.has(key)) return
    seen.add(key)
    customOptions.push({
      value: raw,
      label: key,
      group: customGroup,
      badge: 'Custom',
      custom: true,
    })
  }

  for (const val of asArray(config.currentValue)) pushCustom(val)
  for (const val of config.customValues ?? []) pushCustom(val)
  if (!preserveOrder) {
    customOptions.sort((a, b) => compareAlpha(a.label, b.label))
  }

  const groupBuckets = new Map<string, CatalogOption[]>()
  const groupOrder: string[] = []
  for (const entry of baseEntries) {
    const key = String(entry.value)
    if (seen.has(key)) continue
    seen.add(key)
    const group = entry.group || catalog?.label || 'Options'
    if (!groupBuckets.has(group)) {
      groupBuckets.set(group, [])
      groupOrder.push(group)
    }
    groupBuckets.get(group)!.push({
      value: entry.value,
      label: entry.label,
      group,
      badge: entry.badge,
      meta: entry.meta,
    })
  }

  const ordered: CatalogOption[] = []
  const appendBucket = (list: CatalogOption[], keepOrder: boolean) => {
    const items = keepOrder ? list : [...list].sort((a, b) => compareAlpha(a.label, b.label))
    items.forEach((item, index) => {
      ordered.push({ ...item, firstInGroup: index === 0 })
    })
  }

  if (customOptions.length > 0) appendBucket(customOptions, false)
  for (const group of groupOrder) {
    appendBucket(groupBuckets.get(group)!, preserveOrder)
  }

  return ordered
}

/** Case-insensitive search across option label, group, badge, and raw value while refreshing group header flags. */
export function filterCatalogOptions<T extends string | number>(
  options: readonly CatalogOption<T>[],
  query: string,
): CatalogOption<T>[] {
  const needle = query.trim().toLowerCase()
  const matched = !needle
    ? options
    : options.filter((opt) =>
        opt.label.toLowerCase().includes(needle) ||
        String(opt.value).toLowerCase().includes(needle) ||
        opt.group.toLowerCase().includes(needle) ||
        (opt.badge ? opt.badge.toLowerCase().includes(needle) : false),
      )

  let lastGroup = ''
  return matched.map((opt) => {
    const firstInGroup = opt.group !== lastGroup
    lastGroup = opt.group
    return opt.firstInGroup === firstInGroup ? opt : { ...opt, firstInGroup }
  })
}

/** Deterministic keyboard navigation helper across filtered option lists. */
export function stepOptionIndex(
  currentIndex: number,
  key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End',
  optionCount: number,
): number {
  if (optionCount <= 0) return -1
  if (key === 'Home') return 0
  if (key === 'End') return optionCount - 1
  if (key === 'ArrowDown') {
    if (currentIndex < 0 || currentIndex >= optionCount - 1) return 0
    return currentIndex + 1
  }
  if (currentIndex <= 0 || currentIndex >= optionCount) return optionCount - 1
  return currentIndex - 1
}
