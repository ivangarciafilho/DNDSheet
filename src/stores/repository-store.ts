import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Monster } from 'src/core/domain/types'
import type { StorageBackendKind, StorageFailureCode } from 'src/core/ports/StoragePort'
import {
  duplicateCreatureDocument,
  queryCreatureSummaries,
  collectFolders,
  collectTags,
  type CreatureLibraryEntry,
  type CreatureLibrarySort,
  type CreatureLibraryView,
  type CreatureSummary,
} from 'src/core/domain/creature-library'
import {
  MonsterRepository,
  selectRepositoryBackend,
  type MigrationReport,
  type RestoreResult,
  type SaveResult,
} from 'src/core/adapters/RepositoryStorage'
import { createMonsterState, useMonsterStore } from './monster-store'
import { migrateMonsterSchema } from 'src/core/usecases/MigrateMonsterSchema'

export type RepositorySaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'read_only'

let activeRepo: MonsterRepository | null = null
let initPromise: Promise<void> | null = null

export const useRepositoryStore = defineStore('repository', () => {
  const initialized = ref(false)
  const loading = ref(false)
  const backendKind = ref<StorageBackendKind>('indexeddb')
  const saveStatus = ref<RepositorySaveStatus>('idle')
  const lastSavedAt = ref<string | null>(null)
  const lastError = ref<{ code: StorageFailureCode; message: string } | null>(null)
  const summaries = ref<CreatureSummary[]>([])
  const activeCreatureId = ref<string | null>(null)
  const quarantined = ref<Array<{ id?: string; name?: string; reason: string }>>([])
  const migrationReport = ref<MigrationReport | null>(null)

  const folders = computed(() => collectFolders(summaries.value))
  const tags = computed(() => collectTags(summaries.value))

  function query(opts: {
    query?: string
    view?: CreatureLibraryView
    folder?: string
    tag?: string
    sortBy?: CreatureLibrarySort
  }): CreatureSummary[] {
    return queryCreatureSummaries(summaries.value, opts)
  }

  async function refreshIndex(): Promise<void> {
    if (!activeRepo) return
    const idx = await activeRepo.list()
    summaries.value = idx.summaries
    activeCreatureId.value = idx.activeId
  }

  async function init(force = false): Promise<void> {
    if (initPromise && !force) return initPromise
    const run = async () => {
      loading.value = true
      try {
        const selection = await selectRepositoryBackend()
        backendKind.value = selection.backend
        if (!selection.kv) {
          activeRepo = null
          saveStatus.value = 'read_only'
          lastError.value = selection.error
            ? { code: selection.error.code, message: selection.error.message }
            : { code: 'storage_blocked', message: 'Local repository storage is blocked or unavailable.' }
          initialized.value = true
          return
        }

        activeRepo = new MonsterRepository(selection.backend, selection.kv)
        const monsterStore = useMonsterStore()
        const currentDoc = JSON.parse(JSON.stringify(monsterStore.$state)) as Monster
        const ls = typeof window !== 'undefined' && window.localStorage ? window.localStorage : undefined
        const report = await activeRepo.migrateLegacySources(ls, currentDoc)
        migrationReport.value = report
        for (const q of report.quarantined) {
          quarantined.value.push({ id: q.key, name: q.key, reason: q.reason })
        }

        await refreshIndex()
        // Ensure active editor monster exists in library index
        const hasCurrent = summaries.value.some((s) => s.id === monsterStore.id)
        if (!hasCurrent) {
          const saveRes = await activeRepo.save(currentDoc, undefined, true)
          if (saveRes.ok && saveRes.summary) {
            if (!monsterStore.id) monsterStore.id = saveRes.summary.id
            await refreshIndex()
          } else if (!saveRes.ok && saveRes.error) {
            saveStatus.value = saveRes.error.code === 'storage_blocked' ? 'read_only' : 'error'
            lastError.value = saveRes.error
            initialized.value = true
            return
          }
        } else if (!activeCreatureId.value) {
          const activeId = monsterStore.id ?? null
          await activeRepo.setActiveId(activeId)
          activeCreatureId.value = activeId
        }

        saveStatus.value = 'saved'
        lastError.value = null
        lastSavedAt.value = new Date().toISOString()
        initialized.value = true
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        saveStatus.value = 'error'
        lastError.value = { code: 'io_error', message: msg }
        initialized.value = true
      } finally {
        loading.value = false
      }
    }
    initPromise = run()
    return initPromise
  }

  async function saveActiveNow(): Promise<SaveResult> {
    if (!initialized.value) await init()
    if (!activeRepo) {
      return {
        ok: false,
        backend: backendKind.value,
        preservedLastGood: true,
        error: lastError.value ?? { code: 'storage_blocked', message: 'Repository unavailable (read-only).' },
      }
    }

    saveStatus.value = 'saving'
    const monsterStore = useMonsterStore()
    if (!monsterStore.id || !String(monsterStore.id).trim()) {
      monsterStore.id = uuidv4()
    }
    const snapshot = JSON.parse(JSON.stringify(monsterStore.$state)) as Monster
    const res = await activeRepo.save(snapshot, undefined, true)
    if (res.ok && res.summary) {
      await refreshIndex()
      saveStatus.value = 'saved'
      lastSavedAt.value = res.savedAt ?? new Date().toISOString()
      lastError.value = null
    } else {
      saveStatus.value = res.error?.code === 'storage_blocked' ? 'read_only' : 'error'
      lastError.value = res.error ?? { code: 'io_error', message: 'Failed to save creature.' }
    }
    return res
  }

  async function loadCreature(id: string): Promise<CreatureLibraryEntry | null> {
    if (!initialized.value) await init()
    if (!activeRepo) return null
    try {
      const entry = await activeRepo.load(id)
      if (!entry) return null
      await activeRepo.setActiveId(id)
      activeCreatureId.value = id
      return entry
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      saveStatus.value = 'error'
      lastError.value = { code: 'corrupted_entry', message: msg }
      return null
    }
  }

  async function createCreature(name = 'New Creature'): Promise<CreatureLibraryEntry | null> {
    if (!initialized.value) await init()
    if (!activeRepo) return null
    const fresh = migrateMonsterSchema({
      ...createMonsterState(),
      id: uuidv4(),
      name: name.trim() || 'New Creature',
    })
    const res = await activeRepo.save(fresh, undefined, true)
    if (!res.ok || !res.summary) {
      saveStatus.value = res.error?.code === 'storage_blocked' ? 'read_only' : 'error'
      lastError.value = res.error ?? { code: 'io_error', message: 'Unable to create creature.' }
      return null
    }
    await refreshIndex()
    saveStatus.value = 'saved'
    lastSavedAt.value = res.savedAt ?? new Date().toISOString()
    lastError.value = null
    return { summary: res.summary, document: fresh }
  }

  async function duplicateCreature(id: string): Promise<CreatureLibraryEntry | null> {
    if (!initialized.value) await init()
    if (!activeRepo) return null
    const source = await activeRepo.load(id)
    if (!source) return null
    const dup = duplicateCreatureDocument(
      source.document,
      summaries.value.map((s) => s.name),
      source.summary,
    )
    const res = await activeRepo.save(dup.document, dup.summary, false)
    if (!res.ok || !res.summary) {
      saveStatus.value = res.error?.code === 'storage_blocked' ? 'read_only' : 'error'
      lastError.value = res.error ?? { code: 'io_error', message: 'Unable to duplicate creature.' }
      return null
    }
    await refreshIndex()
    saveStatus.value = 'saved'
    lastError.value = null
    return { summary: res.summary, document: dup.document }
  }

  async function renameCreature(id: string, nextName: string): Promise<boolean> {
    if (!initialized.value) await init()
    if (!activeRepo) return false
    const clean = nextName.trim()
    if (!clean) return false
    const entry = await activeRepo.load(id)
    if (entry) {
      entry.document.name = clean
      const res = await activeRepo.save(entry.document, { name: clean }, id === activeCreatureId.value)
      if (!res.ok) {
        saveStatus.value = res.error?.code === 'storage_blocked' ? 'read_only' : 'error'
        lastError.value = res.error ?? { code: 'io_error', message: 'Rename failed.' }
        return false
      }
    } else {
      const res = await activeRepo.updateSummary(id, { name: clean })
      if (!res.ok) return false
    }
    const monsterStore = useMonsterStore()
    if (monsterStore.id === id) monsterStore.name = clean
    await refreshIndex()
    return true
  }

  async function setFolderAndTags(id: string, folder: string, tagList: string[]): Promise<boolean> {
    if (!initialized.value) await init()
    if (!activeRepo) return false
    const res = await activeRepo.updateSummary(id, { folder: folder.trim(), tags: tagList })
    if (!res.ok) return false
    await refreshIndex()
    return true
  }

  async function setArchived(id: string, archived: boolean): Promise<boolean> {
    if (!initialized.value) await init()
    if (!activeRepo) return false
    const res = await activeRepo.updateSummary(id, { archived, trashed: false, trashedAt: undefined })
    if (!res.ok) return false
    await refreshIndex()
    return true
  }

  async function setTrashed(id: string, trashed: boolean): Promise<boolean> {
    if (!initialized.value) await init()
    if (!activeRepo) return false
    const res = await activeRepo.updateSummary(id, {
      trashed,
      trashedAt: trashed ? new Date().toISOString() : undefined,
    })
    if (!res.ok) return false
    await refreshIndex()
    return true
  }

  async function purgeCreature(id: string): Promise<boolean> {
    if (!initialized.value) await init()
    if (!activeRepo) return false
    const res = await activeRepo.purge(id)
    if (!res.ok) {
      saveStatus.value = res.error?.code === 'storage_blocked' ? 'read_only' : 'error'
      lastError.value = res.error ?? { code: 'io_error', message: 'Delete failed.' }
      return false
    }
    await refreshIndex()
    return true
  }

  async function exportBackupJson(): Promise<string> {
    if (!initialized.value) await init()
    if (!activeRepo) {
      const monsterStore = useMonsterStore()
      const doc = migrateMonsterSchema(JSON.parse(JSON.stringify(monsterStore.$state)))
      return JSON.stringify(
        {
          format: 'DNDSheetRepositoryBackupV1',
          exportedAt: new Date().toISOString(),
          activeId: doc.id,
          items: [{ summary: { id: doc.id, name: doc.name }, document: doc }],
        },
        null,
        2,
      )
    }
    const bundle = await activeRepo.exportBackup()
    return JSON.stringify(bundle, null, 2)
  }

  async function restoreBackupJson(rawJson: string): Promise<RestoreResult & { activeDocument?: Monster | null }> {
    if (!initialized.value) await init()
    if (!activeRepo) {
      return {
        ok: false,
        restoredCount: 0,
        rolledBack: false,
        quarantined: [],
        errors: ['Repository storage is unavailable in read-only mode.'],
        activeId: null,
      }
    }
    const result = await activeRepo.restoreBackup(rawJson)
    if (result.quarantined.length > 0) {
      quarantined.value = result.quarantined
    }
    if (result.ok) {
      await refreshIndex()
      saveStatus.value = 'saved'
      lastSavedAt.value = new Date().toISOString()
      lastError.value = null
      const activeEntry = result.activeId ? await activeRepo.load(result.activeId) : null
      return { ...result, activeDocument: activeEntry?.document ?? null }
    }
    saveStatus.value = 'error'
    lastError.value = { code: 'io_error', message: result.errors.join(' ') || 'Backup restore failed.' }
    return result
  }

  return {
    initialized,
    loading,
    backendKind,
    saveStatus,
    lastSavedAt,
    lastError,
    summaries,
    activeCreatureId,
    quarantined,
    migrationReport,
    folders,
    tags,
    query,
    init,
    refreshIndex,
    saveActiveNow,
    loadCreature,
    createCreature,
    duplicateCreature,
    renameCreature,
    setFolderAndTags,
    setArchived,
    setTrashed,
    purgeCreature,
    exportBackupJson,
    restoreBackupJson,
  }
})
