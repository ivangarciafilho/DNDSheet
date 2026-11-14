/**
 * Repository storage layer (B5.2-B5.6):
 * - Selects backend ONCE at startup (never silently fails over per call)
 * - Enforces last-good preservation on quota/IO failures and surfaces typed StorageFailureError
 * - Executes verify-then-mark legacy migration from dndsheet_monster_* and app.monster
 * - Restores versioned backup bundles atomically with pre-restore rollback guard
 */
import {
  classifyStorageError,
  StorageFailureError,
  type StorageBackendKind,
  type StorageFailureCode,
} from '../ports/StoragePort.ts'
import type { Monster } from '../domain/types.ts'
import {
  buildBackupBundle,
  parseAndValidateBackupBundle,
  summarizeMonster,
  type CreatureLibraryEntry,
  type CreatureSummary,
  type QuarantinedBackupEntry,
  type RepositoryBackupBundle,
} from '../domain/creature-library.ts'
import { migrateMonsterSchema } from '../usecases/MigrateMonsterSchema.ts'
import { LocalStorageAdapter, type StorageBackend } from './LocalStorageAdapter.ts'

export interface AsyncKvStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
  keys(): Promise<string[]>
}

export interface SaveResult {
  ok: boolean
  backend: StorageBackendKind
  savedAt?: string
  preservedLastGood?: boolean
  error?: {
    code: StorageFailureCode
    message: string
  }
}

export interface MigrationReport {
  alreadyMigrated: boolean
  migratedCount: number
  migratedIds: string[]
  quarantined: Array<{ key: string; reason: string }>
}

export interface RestoreResult {
  ok: boolean
  restoredCount: number
  rolledBack: boolean
  quarantined: QuarantinedBackupEntry[]
  errors: string[]
  activeId: string | null
}

const INDEX_KEY = '__index__'
const MIGRATION_KEY = 'DNDSheetRepositoryMigrationV1'
const DOC_PREFIX = 'doc:'
const REPO_PREFIX = 'dndsheet_repo_v1:'

interface RepositoryIndexState {
  version: 1
  activeId: string | null
  summaries: CreatureSummary[]
}

export class BackendKvStore implements AsyncKvStore {
  private backend: StorageBackend
  private prefix: string

  constructor(backend: StorageBackend, prefix = REPO_PREFIX) {
    this.backend = backend
    this.prefix = prefix
  }

  async get(key: string): Promise<string | null> {
    try {
      return this.backend.getItem(`${this.prefix}${key}`)
    } catch (err) {
      throw classifyStorageError(err, 'io_error')
    }
  }

  async set(key: string, value: string): Promise<void> {
    try {
      this.backend.setItem(`${this.prefix}${key}`, value)
    } catch (err) {
      throw classifyStorageError(err, 'io_error')
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.backend.removeItem(`${this.prefix}${key}`)
    } catch (err) {
      throw classifyStorageError(err, 'io_error')
    }
  }

  async keys(): Promise<string[]> {
    const out: string[] = []
    for (let i = 0; i < this.backend.length; i++) {
      const rawKey = this.backend.key(i)
      if (rawKey && rawKey.startsWith(this.prefix)) {
        out.push(rawKey.slice(this.prefix.length))
      }
    }
    return out
  }
}

export class IndexedDbKvStore implements AsyncKvStore {
  private dbName: string
  private storeName = 'kv'

  constructor(dbName = 'DNDSheetRepositoryV1') {
    this.dbName = dbName
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new StorageFailureError('storage_blocked', 'IndexedDB is unavailable.'))
        return
      }
      let settled = false
      const request = window.indexedDB.open(this.dbName, 1)
      const fail = (err: unknown) => {
        if (settled) return
        settled = true
        clearTimeout(timer)
        reject(classifyStorageError(err, 'storage_blocked'))
      }
      const timer = setTimeout(() => fail(new Error('IndexedDB open timed out (blocked).')), 3500)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
      request.onerror = () => fail(request.error)
      request.onblocked = () => fail(new Error('IndexedDB database upgrade/open was blocked.'))
      request.onsuccess = () => {
        if (settled) {
          request.result.close()
          return
        }
        settled = true
        clearTimeout(timer)
        resolve(request.result)
      }
    })
  }

  private async transact<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.openDb()
    try {
      return await new Promise<T>((resolve, reject) => {
        const tx = db.transaction(this.storeName, mode)
        const req = run(tx.objectStore(this.storeName))
        tx.oncomplete = () => resolve(req.result)
        tx.onabort = () => reject(classifyStorageError(tx.error ?? req.error ?? new Error('Transaction aborted.')))
        tx.onerror = () => reject(classifyStorageError(tx.error ?? req.error ?? new Error('Transaction error.')))
      })
    } finally {
      db.close()
    }
  }

  async get(key: string): Promise<string | null> {
    const res = await this.transact('readonly', (store) => store.get(key))
    return typeof res === 'string' ? res : null
  }

  async set(key: string, value: string): Promise<void> {
    await this.transact('readwrite', (store) => store.put(value, key))
  }

  async remove(key: string): Promise<void> {
    await this.transact('readwrite', (store) => store.delete(key))
  }

  async keys(): Promise<string[]> {
    const raw = await this.transact('readonly', (store) => store.getAllKeys())
    return Array.isArray(raw) ? raw.map(String) : []
  }
}

export interface SelectBackendOptions {
  probeIndexedDb?: () => Promise<AsyncKvStore>
  localStorageBackend?: StorageBackend
}

/**
 * Selects the single persistence backend for the session ONCE at startup.
 * Never mixes IndexedDB and localStorage mid-operation on per-call errors.
 */
export async function selectRepositoryBackend(
  options: SelectBackendOptions = {},
): Promise<{ backend: StorageBackendKind; kv: AsyncKvStore | null; error?: StorageFailureError }> {
  try {
    if (options.probeIndexedDb) {
      const store = await options.probeIndexedDb()
      return { backend: 'indexeddb', kv: store }
    }
    if (typeof window !== 'undefined' && window.indexedDB) {
      const store = new IndexedDbKvStore()
      await store.get(INDEX_KEY)
      return { backend: 'indexeddb', kv: store }
    }
  } catch (err) {
    // Only fall back to localStorage at startup if IndexedDB cannot open; localStorage itself must pass a write probe.
    void err
  }

  const ls =
    options.localStorageBackend ??
    (typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined)

  if (ls) {
    try {
      const probeKey = `${REPO_PREFIX}__startup_probe__`
      ls.setItem(probeKey, '1')
      ls.removeItem(probeKey)
      return { backend: 'localstorage', kv: new BackendKvStore(ls) }
    } catch (err) {
      return {
        backend: 'unavailable',
        kv: null,
        error: classifyStorageError(err, 'storage_blocked'),
      }
    }
  }

  return {
    backend: 'unavailable',
    kv: null,
    error: new StorageFailureError('storage_blocked', 'No browser persistence backend is available.'),
  }
}

export class MonsterRepository {
  readonly backendKind: StorageBackendKind
  readonly kv: AsyncKvStore

  constructor(backendKind: StorageBackendKind, kv: AsyncKvStore) {
    this.backendKind = backendKind
    this.kv = kv
  }

  private async readIndex(): Promise<RepositoryIndexState> {
    const raw = await this.kv.get(INDEX_KEY)
    if (!raw) return { version: 1, activeId: null, summaries: [] }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      throw classifyStorageError(err, 'corrupted_entry')
    }
    const obj = parsed as Partial<RepositoryIndexState>
    if (!obj || !Array.isArray(obj.summaries)) {
      throw new StorageFailureError('corrupted_entry', 'Repository index payload is malformed.')
    }
    return {
      version: 1,
      activeId: typeof obj.activeId === 'string' && obj.activeId ? obj.activeId : null,
      summaries: obj.summaries,
    }
  }

  private async writeIndex(index: RepositoryIndexState): Promise<void> {
    await this.kv.set(INDEX_KEY, JSON.stringify(index))
  }

  async list(): Promise<{ activeId: string | null; summaries: CreatureSummary[] }> {
    const idx = await this.readIndex()
    return { activeId: idx.activeId, summaries: idx.summaries }
  }

  async load(id: string): Promise<CreatureLibraryEntry | null> {
    const raw = await this.kv.get(`${DOC_PREFIX}${id}`)
    if (!raw) return null
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      throw classifyStorageError(err, 'corrupted_entry')
    }
    const migrated = migrateMonsterSchema(parsed)
    const idx = await this.readIndex()
    const existing = idx.summaries.find((s) => s.id === id)
    const summary = summarizeMonster(migrated, existing, { id })
    return { summary, document: migrated }
  }

  async setActiveId(id: string | null): Promise<void> {
    const idx = await this.readIndex()
    idx.activeId = id
    await this.writeIndex(idx)
  }

  /**
   * Saves a creature atomically while preserving the last good stored record on any error.
   */
  async save(
    monster: Monster,
    summaryPatch?: Partial<CreatureSummary>,
    setAsActive = true,
  ): Promise<SaveResult & { summary?: CreatureSummary }> {
    const doc = migrateMonsterSchema(JSON.parse(JSON.stringify(monster)))
    const nowIso = new Date().toISOString()

    let idx: RepositoryIndexState
    try {
      idx = await this.readIndex()
    } catch (err) {
      const classified = classifyStorageError(err, 'corrupted_entry')
      return {
        ok: false,
        backend: this.backendKind,
        preservedLastGood: true,
        error: { code: classified.code, message: classified.message },
      }
    }

    const existingIdx = idx.summaries.findIndex((s) => s.id === doc.id)
    const existingSummary = existingIdx >= 0 ? idx.summaries[existingIdx] : undefined
    const nextSummary = summarizeMonster(doc, existingSummary, { ...summaryPatch, updatedAt: nowIso }, nowIso)
    doc.id = nextSummary.id

    const docKey = `${DOC_PREFIX}${nextSummary.id}`
    const prevRawDoc = await this.kv.get(docKey).catch(() => null)
    const docPayload = JSON.stringify(doc)

    try {
      await this.kv.set(docKey, docPayload)
      const nextSummaries = [...idx.summaries]
      if (existingIdx >= 0) nextSummaries[existingIdx] = nextSummary
      else nextSummaries.push(nextSummary)

      const nextIndex: RepositoryIndexState = {
        version: 1,
        activeId: setAsActive ? nextSummary.id : idx.activeId,
        summaries: nextSummaries,
      }
      try {
        await this.writeIndex(nextIndex)
      } catch (indexErr) {
        // Restore previous document snapshot if writing index fails (last-good protection)
        if (prevRawDoc !== null) await this.kv.set(docKey, prevRawDoc).catch(() => undefined)
        else await this.kv.remove(docKey).catch(() => undefined)
        throw indexErr
      }
      return {
        ok: true,
        backend: this.backendKind,
        savedAt: nowIso,
        summary: nextSummary,
      }
    } catch (err) {
      const classified = classifyStorageError(err, 'io_error')
      return {
        ok: false,
        backend: this.backendKind,
        preservedLastGood: true,
        error: { code: classified.code, message: classified.message },
      }
    }
  }

  async updateSummary(id: string, patch: Partial<CreatureSummary>): Promise<SaveResult & { summary?: CreatureSummary }> {
    try {
      const idx = await this.readIndex()
      const pos = idx.summaries.findIndex((s) => s.id === id)
      if (pos < 0) {
        return {
          ok: false,
          backend: this.backendKind,
          preservedLastGood: true,
          error: { code: 'io_error', message: `Creature ${id} not found in index.` },
        }
      }
      const nowIso = new Date().toISOString()
      const current = idx.summaries[pos]
      const next: CreatureSummary = {
        ...current,
        ...patch,
        id: current.id,
        updatedAt: patch.updatedAt ?? nowIso,
      }
      const nextSummaries = [...idx.summaries]
      nextSummaries[pos] = next
      await this.writeIndex({ ...idx, summaries: nextSummaries })
      return { ok: true, backend: this.backendKind, savedAt: nowIso, summary: next }
    } catch (err) {
      const classified = classifyStorageError(err, 'io_error')
      return {
        ok: false,
        backend: this.backendKind,
        preservedLastGood: true,
        error: { code: classified.code, message: classified.message },
      }
    }
  }

  async purge(id: string): Promise<SaveResult> {
    try {
      const idx = await this.readIndex()
      const nextSummaries = idx.summaries.filter((s) => s.id !== id)
      const nextActive = idx.activeId === id ? nextSummaries.find((s) => !s.trashed)?.id ?? null : idx.activeId
      await this.writeIndex({ version: 1, activeId: nextActive, summaries: nextSummaries })
      await this.kv.remove(`${DOC_PREFIX}${id}`)
      return { ok: true, backend: this.backendKind, savedAt: new Date().toISOString() }
    } catch (err) {
      const classified = classifyStorageError(err, 'io_error')
      return {
        ok: false,
        backend: this.backendKind,
        preservedLastGood: true,
        error: { code: classified.code, message: classified.message },
      }
    }
  }

  async exportBackup(): Promise<RepositoryBackupBundle> {
    const idx = await this.readIndex()
    const entries: CreatureLibraryEntry[] = []
    for (const s of idx.summaries) {
      const loaded = await this.load(s.id).catch(() => null)
      if (loaded) entries.push(loaded)
    }
    return buildBackupBundle(entries, idx.activeId)
  }

  /**
   * Restores a validated backup bundle with pre-restore snapshot rollback if any write fails.
   */
  async restoreBackup(bundleInput: unknown): Promise<RestoreResult> {
    const validated = parseAndValidateBackupBundle(bundleInput)
    if (!validated.valid) {
      return {
        ok: false,
        restoredCount: 0,
        rolledBack: false,
        quarantined: validated.quarantined,
        errors: validated.errors,
        activeId: null,
      }
    }

    // Snapshot existing repository before overwriting anything
    const prevRawIndex = await this.kv.get(INDEX_KEY).catch(() => null)
    const prevDocSnapshots = new Map<string, string>()
    const existingKeys = await this.kv.keys().catch(() => [] as string[])
    for (const k of existingKeys) {
      if (k.startsWith(DOC_PREFIX)) {
        const val = await this.kv.get(k).catch(() => null)
        if (val !== null) prevDocSnapshots.set(k, val)
      }
    }

    const rollback = async () => {
      const curKeys = await this.kv.keys().catch(() => [] as string[])
      for (const k of curKeys) {
        if (k.startsWith(DOC_PREFIX) && !prevDocSnapshots.has(k)) {
          await this.kv.remove(k).catch(() => undefined)
        }
      }
      for (const [k, v] of prevDocSnapshots) {
        await this.kv.set(k, v).catch(() => undefined)
      }
      if (prevRawIndex !== null) {
        await this.kv.set(INDEX_KEY, prevRawIndex).catch(() => undefined)
      } else {
        await this.kv.remove(INDEX_KEY).catch(() => undefined)
      }
    }

    try {
      const summaries: CreatureSummary[] = []
      for (const entry of validated.entries) {
        await this.kv.set(`${DOC_PREFIX}${entry.summary.id}`, JSON.stringify(entry.document))
        summaries.push(entry.summary)
      }
      await this.writeIndex({
        version: 1,
        activeId: validated.activeId,
        summaries,
      })

      // Remove stale docs that were replaced by the backup
      const newIds = new Set(summaries.map((s) => `${DOC_PREFIX}${s.id}`))
      for (const oldKey of prevDocSnapshots.keys()) {
        if (!newIds.has(oldKey)) {
          await this.kv.remove(oldKey)
        }
      }

      return {
        ok: true,
        restoredCount: entriesCount(validated.entries),
        rolledBack: false,
        quarantined: validated.quarantined,
        errors: [],
        activeId: validated.activeId,
      }
    } catch (err) {
      await rollback()
      const classified = classifyStorageError(err, 'io_error')
      return {
        ok: false,
        restoredCount: 0,
        rolledBack: true,
        quarantined: validated.quarantined,
        errors: [classified.message],
        activeId: null,
      }
    }
  }

  /**
   * Verify-then-mark migration from legacy localStorage keys (`dndsheet_monster_*` and `app.monster`).
   * Never deletes original legacy keys; marks completion ONLY after read-back verification succeeds.
   */
  async migrateLegacySources(
    legacyBackend?: StorageBackend,
    currentMonster?: Partial<Monster> | null,
  ): Promise<MigrationReport> {
    const existingMark = await this.kv.get(MIGRATION_KEY).catch(() => null)
    if (existingMark) {
      return {
        alreadyMigrated: true,
        migratedCount: 0,
        migratedIds: [],
        quarantined: [],
      }
    }

    const candidates: Array<{ key: string; doc: Monster }> = []
    const quarantined: Array<{ key: string; reason: string }> = []
    const seenIds = new Set<string>()
    const currentIdx = await this.readIndex().catch(() => ({ version: 1 as const, activeId: null, summaries: [] }))
    for (const s of currentIdx.summaries) seenIds.add(s.id)

    if (legacyBackend) {
      // Collect legacy `dndsheet_monster_*` entries using LocalStorageAdapter format awareness
      const legacyAdapter = new LocalStorageAdapter('dndsheet_monster_', legacyBackend)
      const legacyKeys: string[] = []
      for (let i = 0; i < legacyBackend.length; i++) {
        const k = legacyBackend.key(i)
        if (k && k.startsWith('dndsheet_monster_')) legacyKeys.push(k)
      }
      for (const fullKey of legacyKeys) {
        const legacyId = fullKey.slice('dndsheet_monster_'.length)
        if (!legacyId || legacyId.startsWith('__')) continue
        try {
          const loaded = await legacyAdapter.getMonster(legacyId)
          if (loaded) {
            const docId = loaded.id ?? legacyId
            if (!seenIds.has(docId)) {
              seenIds.add(docId)
              candidates.push({ key: fullKey, doc: { ...loaded, id: docId } })
            }
          } else {
            quarantined.push({ key: fullKey, reason: 'Empty or unreadable legacy record.' })
          }
        } catch (err) {
          quarantined.push({
            key: fullKey,
            reason: err instanceof Error ? err.message : String(err),
          })
        }
      }

      // Also check Pinia persisted `app.monster` key if present and non-empty
      const piniaRaw = legacyBackend.getItem('app.monster')
      if (piniaRaw && !piniaRaw.startsWith('__indexeddb_overflow__')) {
        try {
          const parsed = JSON.parse(piniaRaw) as Record<string, unknown>
          const rawDoc = parsed && typeof parsed === 'object' && !parsed.name && parsed.$state ? parsed.$state : parsed
          if (rawDoc && typeof rawDoc === 'object') {
            const migrated = migrateMonsterSchema(rawDoc)
            if (migrated.id && !seenIds.has(migrated.id)) {
              seenIds.add(migrated.id)
              candidates.push({ key: 'app.monster', doc: migrated })
            }
          }
        } catch (err) {
          quarantined.push({
            key: 'app.monster',
            reason: err instanceof Error ? err.message : String(err),
          })
        }
      }
    }

    if (currentMonster && typeof currentMonster === 'object') {
      const migrated = migrateMonsterSchema(currentMonster)
      const docId = migrated.id
      if (!docId || !seenIds.has(docId)) {
        if (docId) seenIds.add(docId)
        candidates.push({ key: 'activeSession', doc: migrated })
      }
    }

    const migratedIds: string[] = []
    for (const candidate of candidates) {
      const saveRes = await this.save(candidate.doc, undefined, currentIdx.activeId === null && migratedIds.length === 0)
      if (!saveRes.ok || !saveRes.summary) {
        throw new StorageFailureError(
          saveRes.error?.code ?? 'io_error',
          `Migration failed while writing ${candidate.key}: ${saveRes.error?.message ?? 'unknown error'}`,
        )
      }
      // Verify-then-mark: read back from kv before counting as verified
      const verified = await this.load(saveRes.summary.id)
      if (!verified || verified.summary.id !== saveRes.summary.id) {
        throw new StorageFailureError(
          'io_error',
          `Verification failed reading back migrated entry ${candidate.key}.`,
        )
      }
      migratedIds.push(saveRes.summary.id)
    }

    await this.kv.set(
      MIGRATION_KEY,
      JSON.stringify({
        format: MIGRATION_KEY,
        completedAt: new Date().toISOString(),
        migratedIds,
        quarantinedCount: quarantined.length,
      }),
    )

    return {
      alreadyMigrated: false,
      migratedCount: migratedIds.length,
      migratedIds,
      quarantined,
    }
  }
}

function entriesCount(entries: readonly CreatureLibraryEntry[]): number {
  return entries.length
}
