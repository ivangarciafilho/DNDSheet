import { v4 as uuidv4 } from 'uuid'
import type { DocumentProvenance, DocumentRulesetProvenance, Monster } from './types.ts'
import { METAMAGIC_OPTIONS, type MetamagicOption, type RulesEdition } from './catalogs/metamagic.ts'

export const ENVELOPE_VERSION = 1

export interface StoreCopyInventoryEntry {
  storeId: string
  storageKey: string | null
  copyMode: 'canonical' | 'undo_snapshot' | 'encounter_snapshot' | 'library_copy' | 'presentation_only'
  ownership: string
}

/** BS-38 inventory of stores holding monster or presentation state. */
export const MONSTER_STORE_COPY_INVENTORY: readonly StoreCopyInventoryEntry[] = Object.freeze([
  {
    storeId: 'monster',
    storageKey: 'app.monster',
    copyMode: 'canonical',
    ownership: 'Live editable Monster state and formula bindings',
  },
  {
    storeId: 'history',
    storageKey: null,
    copyMode: 'undo_snapshot',
    ownership: 'Bounded deep clones of prior Monster revisions (up to 50)',
  },
  {
    storeId: 'combat',
    storageKey: 'app.combat',
    copyMode: 'encounter_snapshot',
    ownership: 'Immutable combatant sourceSnapshot cloned at encounter add time',
  },
  {
    storeId: 'templates',
    storageKey: 'app.templates',
    copyMode: 'library_copy',
    ownership: 'Saved custom template snapshots copied on load',
  },
  {
    storeId: 'editor',
    storageKey: 'app.editor',
    copyMode: 'presentation_only',
    ownership: 'Display style, visual theme, A4 layout, and spellcasting placement',
  },
])

export interface DocumentEnvelope<T = Monster> {
  envelopeVersion: number
  documentId: string
  contentRevision: number
  provenance: DocumentProvenance
  document: T
}

export interface RulesPolicy {
  provenance: DocumentProvenance
  activeRuleset: RulesEdition
  catalogLabel: string
  metamagicOptions: readonly (MetamagicOption & { activeCost: string; activeEffect: string; activeSource: string })[]
}

export class StaleDocumentRevisionError extends Error {
  readonly code = 'STALE_REVISION'
  readonly expectedRevision: number
  readonly actualRevision: number
  readonly operation: string

  constructor(expectedRevision: number, actualRevision: number, operation = 'apply') {
    super(`Stale proposal for ${operation}: expected revision #${expectedRevision}, current revision is #${actualRevision}.`)
    this.name = 'StaleDocumentRevisionError'
    this.expectedRevision = expectedRevision
    this.actualRevision = actualRevision
    this.operation = operation
  }
}

export function isStaleRevision(expectedRevision: number, actualRevision: number): boolean {
  return expectedRevision !== actualRevision
}

export function assertRevisionFresh(expectedRevision: number, actualRevision: number, operation = 'apply'): void {
  if (isStaleRevision(expectedRevision, actualRevision)) {
    throw new StaleDocumentRevisionError(expectedRevision, actualRevision, operation)
  }
}

export function normalizeRulesetProvenance(value: unknown): DocumentRulesetProvenance {
  return value === '2014' || value === '2024' ? value : 'unknown'
}

/**
 * Legacy files/fixtures without an explicit ruleset record `'unknown'` provenance
 * instead of fabricating a rules edition.
 */
export function deriveDocumentProvenance(document: Partial<Monster> | null | undefined): DocumentProvenance {
  if (!document) {
    return {
      ruleset: 'unknown',
      editionLabel: 'Legacy / Unspecified',
      sourceKind: 'legacy_fixture',
    }
  }
  if (document.provenance) {
    const ruleset = normalizeRulesetProvenance(document.provenance.ruleset)
    return {
      ruleset,
      editionLabel: document.provenance.editionLabel || (ruleset === '2024' ? 'SRD 5.2.1 (2024)' : ruleset === '2014' ? 'SRD 5.1 (2014)' : 'Legacy / Unspecified'),
      sourceKind: document.provenance.sourceKind || (ruleset === 'unknown' ? 'legacy_fixture' : 'authored'),
      ...(document.provenance.updatedAt ? { updatedAt: document.provenance.updatedAt } : {}),
    }
  }
  const primaryEdition = document.spellcasting?.rulesEdition
  if (primaryEdition === '2014' || primaryEdition === '2024') {
    return {
      ruleset: primaryEdition,
      editionLabel: primaryEdition === '2024' ? 'SRD 5.2.1 (2024)' : 'SRD 5.1 (2014)',
      sourceKind: 'authored',
    }
  }
  return {
    ruleset: 'unknown',
    editionLabel: 'Legacy / Unspecified',
    sourceKind: 'legacy_fixture',
  }
}

/**
 * Resolves ruleset-aware catalogs and capacity behavior for a monster document.
 * When provenance is `'unknown'`, `fallbackEdition` sets the active ruleset while keeping provenance honest.
 */
export function resolveRulesPolicy(
  document: Partial<Monster> | null | undefined,
  fallbackEdition: RulesEdition = '2014',
): RulesPolicy {
  const provenance = deriveDocumentProvenance(document)
  const activeRuleset: RulesEdition =
    provenance.ruleset === '2014' || provenance.ruleset === '2024'
      ? provenance.ruleset
      : fallbackEdition
  const editionKey = activeRuleset === '2014' ? '2014' : '2024'
  const catalogLabel =
    provenance.ruleset === 'unknown'
      ? `Legacy ruleset (fallback ${activeRuleset})`
      : provenance.editionLabel
  return {
    provenance,
    activeRuleset,
    catalogLabel,
    metamagicOptions: METAMAGIC_OPTIONS.map((option) => ({
      ...option,
      activeCost: editionKey === '2014' ? option.cost2014 : option.cost2024,
      activeEffect: editionKey === '2014' ? option.effect2014 : option.effect2024,
      activeSource: editionKey === '2014' ? option.source2014 : option.source2024,
    })),
  }
}

export function createDocumentId(): string {
  return uuidv4()
}

export function canonicalDocumentFingerprint(document: Partial<Monster> | null | undefined): string {
  if (!document || typeof document !== 'object') return '{}'
  const clone: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(document)) {
    // Session provenance timestamps are non-mechanical metadata when excluding no-op churn.
    if (key === 'provenance') continue
    clone[key] = value
  }
  return JSON.stringify(clone)
}

export interface DocumentRevisionRecordOptions {
  resolverPatch?: boolean
  presentationOnly?: boolean
  historyTransition?: boolean
}

export interface DocumentSessionTracker {
  getDocumentId(): string
  setDocumentId(nextId: string): string
  forkIdentity(): string
  getRevision(): number
  recordMutation(snapshot: Partial<Monster>, options?: DocumentRevisionRecordOptions): boolean
  isStale(expectedRevision: number): boolean
  toEnvelope<T extends Partial<Monster>>(document: T): DocumentEnvelope<T>
}

export function createDocumentSessionTracker(
  initialDocument?: Partial<Monster>,
  initialId?: string,
): DocumentSessionTracker {
  let documentId = (initialId && initialId.trim()) || (initialDocument?.id && initialDocument.id.trim()) || createDocumentId()
  let contentRevision = 1
  let lastFingerprint = canonicalDocumentFingerprint(initialDocument)

  return {
    getDocumentId: () => documentId,
    setDocumentId: (nextId: string) => {
      documentId = nextId.trim() || createDocumentId()
      return documentId
    },
    forkIdentity: () => {
      documentId = createDocumentId()
      return documentId
    },
    getRevision: () => contentRevision,
    recordMutation(snapshot: Partial<Monster>, options: DocumentRevisionRecordOptions = {}) {
      if (options.resolverPatch || options.presentationOnly) {
        return false
      }
      const nextFingerprint = canonicalDocumentFingerprint(snapshot)
      if (!options.historyTransition && nextFingerprint === lastFingerprint) {
        return false
      }
      lastFingerprint = nextFingerprint
      contentRevision += 1
      return true
    },
    isStale: (expectedRevision: number) => isStaleRevision(expectedRevision, contentRevision),
    toEnvelope: <T extends Partial<Monster>>(document: T): DocumentEnvelope<T> => ({
      envelopeVersion: ENVELOPE_VERSION,
      documentId,
      contentRevision,
      provenance: deriveDocumentProvenance(document),
      document,
    }),
  }
}
