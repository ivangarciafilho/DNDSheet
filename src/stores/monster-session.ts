import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  assertRevisionFresh,
  canonicalDocumentFingerprint,
  createDocumentId,
  createDocumentSessionTracker,
  deriveDocumentProvenance,
  MONSTER_STORE_COPY_INVENTORY,
  resolveRulesPolicy,
  type DocumentEnvelope,
} from 'src/core/domain/document-envelope'
import type { Monster } from 'src/core/domain/types'
import { useMonsterStore } from './monster-store'
import { useEditorStore } from './editor-store'
import { useHistoryStore } from './history-store'
import { bindingRuntimeFor } from './binding-runtime'

export const useMonsterSessionStore = defineStore('monsterSession', () => {
  const monsterStore = useMonsterStore()
  const editorStore = useEditorStore()
  const historyStore = useHistoryStore()

  const tracker = createDocumentSessionTracker(
    monsterStore.$state as unknown as Monster,
    monsterStore.id || createDocumentId(),
  )

  const documentId = ref(tracker.getDocumentId())
  const contentRevision = ref(tracker.getRevision())
  let pendingHistoryTransition = false

  const syncFromStore = (forceHistory = false) => {
    const runtime = bindingRuntimeFor(monsterStore)
    if (runtime.resolving || runtime.historySilent) return
    const nextId = typeof monsterStore.id === 'string' && monsterStore.id.trim() ? monsterStore.id.trim() : documentId.value
    if (nextId !== documentId.value) {
      documentId.value = tracker.setDocumentId(nextId)
    }
    const changed = tracker.recordMutation(monsterStore.$state as unknown as Monster, {
      historyTransition: forceHistory || pendingHistoryTransition,
    })
    if (changed) {
      contentRevision.value = tracker.getRevision()
    }
  }

  monsterStore.$subscribe(() => {
    syncFromStore(false)
  }, { detached: true, flush: 'sync' })

  const provenance = computed(() =>
    deriveDocumentProvenance(monsterStore.$state as unknown as Monster),
  )

  const rulesPolicy = computed(() =>
    resolveRulesPolicy(
      monsterStore.$state as unknown as Monster,
      editorStore.style === '2014' ? '2014' : '2024',
    ),
  )

  const envelope = computed<DocumentEnvelope<Monster>>(() => ({
    ...tracker.toEnvelope(monsterStore.$state as unknown as Monster),
    documentId: documentId.value,
    contentRevision: contentRevision.value,
    provenance: provenance.value,
  }))

  const ensureDistinctDocumentId = (forceNew = false): string => {
    if (forceNew || !monsterStore.id?.trim()) {
      const next = tracker.forkIdentity()
      documentId.value = next
      return next
    }
    documentId.value = tracker.setDocumentId(monsterStore.id)
    return documentId.value
  }

  const recordHistoryTransition = () => {
    pendingHistoryTransition = true
    try {
      syncFromStore(true)
    } finally {
      pendingHistoryTransition = false
    }
  }

  const runSingleUndoCommand = (
    description: string,
    expectedRevision: number | undefined,
    applyFn: () => void,
  ): number => {
    if (typeof expectedRevision === 'number') {
      assertRevisionFresh(expectedRevision, contentRevision.value, description)
    }
    const before = canonicalDocumentFingerprint(monsterStore.$state as unknown as Monster)
    historyStore.pushSnapshot(description)
    const runtime = bindingRuntimeFor(monsterStore)
    const prevSilent = runtime.historySilent
    runtime.historySilent = true
    try {
      applyFn()
    } finally {
      runtime.historySilent = prevSilent
    }
    const after = canonicalDocumentFingerprint(monsterStore.$state as unknown as Monster)
    if (before !== after) {
      syncFromStore(true)
    }
    return contentRevision.value
  }

  return {
    documentId,
    contentRevision,
    provenance,
    rulesPolicy,
    envelope,
    storeCopyInventory: MONSTER_STORE_COPY_INVENTORY,
    ensureDistinctDocumentId,
    recordHistoryTransition,
    runSingleUndoCommand,
    isStale: (expectedRevision: number) => tracker.isStale(expectedRevision),
    assertFresh: (expectedRevision: number, operation = 'apply') =>
      assertRevisionFresh(expectedRevision, contentRevision.value, operation),
  }
})
