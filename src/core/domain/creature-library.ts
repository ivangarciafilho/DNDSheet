/**
 * Local Creature Library domain logic (B5.5, B5.6, B6.1-B6.4):
 * - Lightweight indexed summary records separated from full Monster documents
 * - Search, filter, folder/tag/archive/trash/sort queries (fast across 200+ entries)
 * - Conflict-free duplicate remapping (root ID + nested item IDs + bindings keys)
 * - Versioned backup bundle serialization & quarantine-aware validation
 */
import { v4 as uuidv4 } from 'uuid'
import { CR } from './cr-tables.ts'
import { deriveDocumentProvenance } from './document-envelope.ts'
import { entryBindingPrefix, withoutEntryBindings } from './entry-bindings.ts'
import type { DocumentRulesetProvenance, Monster } from './types.ts'
import { CURRENT_MONSTER_VERSION, migrateMonsterSchema } from '../usecases/MigrateMonsterSchema.ts'

export const REPOSITORY_BACKUP_FORMAT = 'DNDSheetRepositoryBackupV1' as const

export interface CreatureSummary {
  id: string
  name: string
  size: string
  type: string
  cr: string
  numericCr: number
  folder: string
  tags: string[]
  archived: boolean
  trashed: boolean
  trashedAt?: string
  createdAt: string
  updatedAt: string
  saveVersion: number
  ruleset: DocumentRulesetProvenance
}

export interface CreatureLibraryEntry {
  summary: CreatureSummary
  document: Monster
}

export type CreatureLibraryView = 'active' | 'archived' | 'trash' | 'all'
export type CreatureLibrarySort = 'updatedAt' | 'name' | 'cr'

export interface CreatureLibraryFilter {
  query?: string
  view?: CreatureLibraryView
  folder?: string
  tag?: string
  sortBy?: CreatureLibrarySort
}

export interface RepositoryBackupBundle {
  format: typeof REPOSITORY_BACKUP_FORMAT
  exportedAt: string
  activeId?: string | null
  items: Array<{
    summary: CreatureSummary
    document: Monster
  }>
}

export interface QuarantinedBackupEntry {
  index: number
  id?: string
  name?: string
  reason: string
}

export interface BackupValidationResult {
  valid: boolean
  errors: string[]
  entries: CreatureLibraryEntry[]
  quarantined: QuarantinedBackupEntry[]
  activeId: string | null
}

function crInfo(crIndex: number | undefined): { cr: string; numeric: number } {
  const idx = typeof crIndex === 'number' && Number.isInteger(crIndex) ? crIndex : 0
  const found = CR[idx]
  if (found) return { cr: String(found.cr), numeric: Number(found.numeric ?? 0) }
  return { cr: '0', numeric: 0 }
}

function cleanTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const tag of tags) {
    const cleaned = String(tag ?? '').trim()
    if (!cleaned || seen.has(cleaned.toLowerCase())) continue
    seen.add(cleaned.toLowerCase())
    out.push(cleaned)
  }
  return out
}

export function summarizeMonster(
  rawMonster: Partial<Monster> | Monster,
  existing?: Partial<CreatureSummary>,
  patch?: Partial<CreatureSummary>,
  nowIso = new Date().toISOString(),
): CreatureSummary {
  const migrated = migrateMonsterSchema(rawMonster)
  const id = String(patch?.id ?? existing?.id ?? migrated.id ?? '').trim() || uuidv4()
  const cr = crInfo(migrated.CR)
  const provenance = deriveDocumentProvenance(migrated)

  return {
    id,
    name: patch?.name?.trim() || migrated.nickname?.trim() || migrated.name?.trim() || 'Unnamed Creature',
    size: String(migrated.size || 'Medium'),
    type: String(migrated.type || 'Humanoid'),
    cr: cr.cr,
    numericCr: cr.numeric,
    folder: String(patch?.folder ?? existing?.folder ?? '').trim(),
    tags: cleanTags(patch?.tags ?? existing?.tags ?? []),
    archived: Boolean(patch?.archived ?? existing?.archived ?? false),
    trashed: Boolean(patch?.trashed ?? existing?.trashed ?? false),
    trashedAt:
      patch?.trashed === false
        ? undefined
        : patch?.trashedAt ?? existing?.trashedAt,
    createdAt: existing?.createdAt || patch?.createdAt || nowIso,
    updatedAt: patch?.updatedAt || nowIso,
    saveVersion: migrated.saveVersion || CURRENT_MONSTER_VERSION,
    ruleset: provenance.ruleset,
  }
}

export function queryCreatureSummaries(
  summaries: readonly CreatureSummary[],
  filter: CreatureLibraryFilter = {},
): CreatureSummary[] {
  const view = filter.view ?? 'active'
  const query = (filter.query ?? '').trim().toLowerCase()
  const folder = (filter.folder ?? '').trim().toLowerCase()
  const tag = (filter.tag ?? '').trim().toLowerCase()
  const sortBy = filter.sortBy ?? 'updatedAt'

  const filtered = summaries.filter((item) => {
    if (view === 'active' && (item.trashed || item.archived)) return false
    if (view === 'archived' && (item.trashed || !item.archived)) return false
    if (view === 'trash' && !item.trashed) return false
    if (view === 'all' && item.trashed) return false

    if (folder && item.folder.toLowerCase() !== folder) return false
    if (tag && !item.tags.some((t) => t.toLowerCase() === tag)) return false

    if (query) {
      const hay = `${item.name} ${item.type} ${item.size} ${item.cr} ${item.folder} ${item.tags.join(' ')}`.toLowerCase()
      if (!hay.includes(query)) return false
    }
    return true
  })

  return [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) || a.id.localeCompare(b.id)
    }
    if (sortBy === 'cr') {
      return b.numericCr - a.numericCr || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    }
    return b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

export function collectFolders(summaries: readonly CreatureSummary[]): string[] {
  const set = new Set<string>()
  for (const s of summaries) {
    if (!s.trashed && s.folder) set.add(s.folder)
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

export function collectTags(summaries: readonly CreatureSummary[]): string[] {
  const set = new Set<string>()
  for (const s of summaries) {
    if (!s.trashed) {
      for (const t of s.tags) set.add(t)
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
}

function makeDuplicateName(baseName: string, existingNames: readonly string[]): string {
  const normalized = new Set(existingNames.map((n) => n.trim().toLowerCase()))
  const cleanBase = baseName.replace(/\s+\(Copy(?:\s+\d+)?\)$/i, '').trim() || 'Unnamed Creature'
  const candidate1 = `${cleanBase} (Copy)`
  if (!normalized.has(candidate1.toLowerCase())) return candidate1
  let index = 2
  while (normalized.has(`${cleanBase} (Copy ${index})`.toLowerCase())) index++
  return `${cleanBase} (Copy ${index})`
}

function remapArrayCollectionIds(
  collectionKey: string,
  items: unknown,
  bindings: Monster['bindings'],
  idMap?: Map<string, string>,
): Monster['bindings'] {
  if (!Array.isArray(items) || items.length === 0) return bindings
  let nextBindings = bindings ? { ...bindings } : undefined
  for (const entry of items) {
    if (!entry || typeof entry !== 'object') continue
    const rec = entry as { id?: unknown }
    const oldId = typeof rec.id === 'string' && rec.id.trim() ? rec.id : ''
    const nextId = uuidv4()
    if (oldId && idMap) idMap.set(oldId, nextId)
    rec.id = nextId
    if (oldId && nextBindings) {
      const oldPrefix = entryBindingPrefix(collectionKey, oldId)
      const nextPrefix = entryBindingPrefix(collectionKey, nextId)
      const remapped: Record<string, NonNullable<Monster['bindings']>[string]> = {}
      for (const [key, binding] of Object.entries(nextBindings)) {
        if (key.startsWith(`${oldPrefix}.`)) {
          remapped[`${nextPrefix}.${key.slice(oldPrefix.length + 1)}`] = { ...binding }
        }
      }
      const cleaned = withoutEntryBindings(nextBindings, oldPrefix)
      nextBindings = Object.keys(remapped).length > 0 ? { ...(cleaned ?? {}), ...remapped } : cleaned
    }
  }
  return nextBindings
}

/**
 * Duplicate a creature with an independent root UUID, remapped nested entry IDs,
 * updated legendary/mythic actionId references, and remapped formula binding keys.
 */
export function duplicateCreatureDocument(
  source: Monster,
  existingNames: readonly string[] = [],
  existingSummary?: Partial<CreatureSummary>,
): CreatureLibraryEntry {
  const clone = migrateMonsterSchema(JSON.parse(JSON.stringify(source)))
  clone.id = uuidv4()
  clone.name = makeDuplicateName(clone.name || 'Unnamed Creature', existingNames)

  const idMap = new Map<string, string>()
  let bindings = clone.bindings ? { ...clone.bindings } : undefined

  for (const collectionKey of [
    'traits',
    'actions',
    'reactions',
    'attacks',
    'skills',
    'tools',
    'sensesList',
    'languagesList',
    'anatomyParts',
    'randomTables',
  ] as const) {
    bindings = remapArrayCollectionIds(
      collectionKey,
      (clone as unknown as Record<string, unknown>)[collectionKey],
      bindings,
      idMap,
    )
  }

  if (clone.paragonConfig?.phaseConfigs) {
    bindings = remapArrayCollectionIds('paragonConfig.phaseConfigs', clone.paragonConfig.phaseConfigs, bindings, idMap)
  }
  if (clone.lairActions) {
    bindings = remapArrayCollectionIds('lairActions', clone.lairActions, bindings)
  }
  if (clone.regionalEffects) {
    bindings = remapArrayCollectionIds('regionalEffects', clone.regionalEffects, bindings)
  }

  const legendaryList = Array.isArray(clone.legendaryActions) ? clone.legendaryActions : []
  const mythicList = Array.isArray(clone.mythicActions?.actions) ? clone.mythicActions.actions : []
  for (const ref of [...legendaryList, ...mythicList]) {
    if (ref?.actionId && idMap.has(ref.actionId)) {
      ref.actionId = idMap.get(ref.actionId)!
    }
  }

  const encounterDynamics = (
    clone as unknown as {
      encounterDynamics?: {
        reactiveActions?: Array<{ id?: string }>
        comboActions?: Array<{ id?: string }>
        trackEvents?: Array<{ id?: string }>
      }
    }
  ).encounterDynamics
  if (encounterDynamics) {
    for (const key of ['reactiveActions', 'comboActions', 'trackEvents'] as const) {
      const arr = encounterDynamics[key]
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && typeof item === 'object' && 'id' in item) {
            item.id = uuidv4()
          }
        }
      }
    }
  }

  clone.bindings = bindings && Object.keys(bindings).length > 0 ? bindings : {}

  const summary = summarizeMonster(clone, undefined, {
    folder: existingSummary?.folder ?? '',
    tags: existingSummary?.tags ?? [],
    archived: false,
    trashed: false,
  })
  return { summary, document: clone }
}

export function buildBackupBundle(
  entries: readonly CreatureLibraryEntry[],
  activeId: string | null = null,
): RepositoryBackupBundle {
  return {
    format: REPOSITORY_BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    activeId,
    items: entries.map((entry) => ({
      summary: { ...entry.summary },
      document: migrateMonsterSchema(JSON.parse(JSON.stringify(entry.document))),
    })),
  }
}

export function parseAndValidateBackupBundle(input: unknown): BackupValidationResult {
  let parsed: unknown = input
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input)
    } catch (err) {
      return {
        valid: false,
        errors: [`Backup JSON is malformed: ${err instanceof Error ? err.message : String(err)}`],
        entries: [],
        quarantined: [],
        activeId: null,
      }
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      valid: false,
      errors: ['Backup payload must be a JSON object or array of creatures.'],
      entries: [],
      quarantined: [],
      activeId: null,
    }
  }

  let rawItems: unknown[] = []
  let activeId: string | null = null

  if (Array.isArray(parsed)) {
    rawItems = parsed.map((doc) => ({ document: doc }))
  } else {
    const obj = parsed as { format?: unknown; items?: unknown; activeId?: unknown }
    if (obj.format !== REPOSITORY_BACKUP_FORMAT) {
      return {
        valid: false,
        errors: [`Unsupported backup format: expected ${REPOSITORY_BACKUP_FORMAT}.`],
        entries: [],
        quarantined: [],
        activeId: null,
      }
    }
    if (!Array.isArray(obj.items)) {
      return {
        valid: false,
        errors: ['Backup bundle is missing an items array.'],
        entries: [],
        quarantined: [],
        activeId: null,
      }
    }
    rawItems = obj.items
    activeId = typeof obj.activeId === 'string' && obj.activeId.trim() ? obj.activeId : null
  }

  const entries: CreatureLibraryEntry[] = []
  const quarantined: QuarantinedBackupEntry[] = []
  const seenIds = new Set<string>()

  rawItems.forEach((rawItem, index) => {
    if (!rawItem || typeof rawItem !== 'object') {
      quarantined.push({ index, reason: 'Entry is not an object.' })
      return
    }
    const wrapper = rawItem as { summary?: Partial<CreatureSummary>; document?: unknown }
    const rawDoc = wrapper.document !== undefined ? wrapper.document : rawItem
    if (!rawDoc || typeof rawDoc !== 'object' || Array.isArray(rawDoc)) {
      quarantined.push({
        index,
        id: typeof wrapper.summary?.id === 'string' ? wrapper.summary.id : undefined,
        name: typeof wrapper.summary?.name === 'string' ? wrapper.summary.name : undefined,
        reason: 'Missing valid monster document payload.',
      })
      return
    }

    const docRecord = rawDoc as Record<string, unknown>
    if (typeof docRecord.name !== 'string' && typeof wrapper.summary?.name !== 'string') {
      quarantined.push({
        index,
        id: typeof docRecord.id === 'string' ? docRecord.id : undefined,
        reason: 'Monster record is missing a name.',
      })
      return
    }

    try {
      const migrated = migrateMonsterSchema(docRecord)
      let candidateId = String(migrated.id || wrapper.summary?.id || '').trim() || uuidv4()
      if (seenIds.has(candidateId)) candidateId = uuidv4()
      seenIds.add(candidateId)
      migrated.id = candidateId
      const summary = summarizeMonster(migrated, wrapper.summary, { id: candidateId })
      entries.push({ summary, document: migrated })
    } catch (err) {
      quarantined.push({
        index,
        id: typeof docRecord.id === 'string' ? docRecord.id : undefined,
        name: typeof docRecord.name === 'string' ? docRecord.name : undefined,
        reason: `Schema migration failed: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  })

  const errors: string[] = []
  if (entries.length === 0) {
    errors.push('No valid creature entries were found in the backup bundle.')
  }

  return {
    valid: errors.length === 0,
    errors,
    entries,
    quarantined,
    activeId: activeId && entries.some((e) => e.summary.id === activeId) ? activeId : entries[0]?.summary.id ?? null,
  }
}
