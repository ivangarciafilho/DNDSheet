<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="onDialogToggle"
  >
    <q-card
      class="creature-library-dialog"
      data-library-dialog
      style="width: min(980px, 96vw); max-width: 96vw"
      @keydown="onDialogKeydown"
    >
      <q-card-section class="row items-center q-gutter-sm q-pb-sm">
        <q-icon name="mdi-bookshelf" size="24px" color="primary" />
        <div class="text-h6 text-weight-bold">Creature Library</div>
        <q-badge color="grey-8" text-color="white" class="q-ml-xs" data-library-backend>
          {{ backendLabel }}
        </q-badge>
        <q-badge
          :color="saveBadgeColor"
          text-color="white"
          class="q-ml-xs"
          data-library-save-status
        >
          {{ saveStatusLabel }}
        </q-badge>
        <span class="text-caption text-grey-5" data-library-count>
          {{ filteredRows.length }} / {{ repo.summaries.length }} creatures
        </span>
        <q-space />
        <q-btn
          dense
          color="primary"
          icon="add"
          label="New Creature"
          no-caps
          data-library-create
          v-help="$t('help.library.create')"
          @click="handleCreate"
        />
        <q-btn
          dense
          outline
          color="secondary"
          icon="download"
          label="Export Backup"
          no-caps
          data-library-export
          v-help="$t('help.library.exportBackup')"
          @click="handleExportBackup"
        />
        <q-btn
          dense
          outline
          color="amber-4"
          icon="upload_file"
          label="Restore Backup"
          no-caps
          data-library-import
          v-help="$t('help.library.importBackup')"
          @click="triggerImportInput"
        />
        <input
          ref="importInputRef"
          type="file"
          accept="application/json,.json"
          hidden
          data-library-import-input
          @change="onImportFileChange"
        />
        <q-btn
          flat
          round
          dense
          icon="close"
          aria-label="Close Creature Library"
          @click="closeDialog"
        />
      </q-card-section>

      <q-separator />

      <q-card-section
        v-if="repo.lastError || repo.quarantined.length > 0 || feedbackMessage"
        class="q-py-xs q-gutter-y-xs"
      >
        <q-banner
          v-if="repo.lastError"
          dense
          rounded
          class="bg-negative text-white"
          role="alert"
          data-library-error
        >
          <template #avatar>
            <q-icon name="error" />
          </template>
          <strong>{{ repo.lastError.code }}:</strong> {{ repo.lastError.message }}
        </q-banner>

        <q-banner
          v-if="repo.quarantined.length > 0"
          dense
          rounded
          class="bg-warning text-black"
          role="status"
          data-library-quarantine
        >
          <template #avatar>
            <q-icon name="warning" />
          </template>
          Quarantined {{ repo.quarantined.length }} invalid record(s):
          {{
            repo.quarantined
              .slice(0, 3)
              .map((q) => `${q.name || q.id || 'entry'} (${q.reason})`)
              .join('; ')
          }}
        </q-banner>

        <q-banner
          v-if="feedbackMessage"
          dense
          rounded
          :class="feedbackIsError ? 'bg-red-9 text-white' : 'bg-teal-9 text-white'"
          role="status"
          data-library-feedback
        >
          {{ feedbackMessage }}
          <template #action>
            <q-btn flat dense label="Dismiss" no-caps @click="feedbackMessage = ''" />
          </template>
        </q-banner>
      </q-card-section>

      <q-card-section class="q-py-sm">
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-md-auto">
            <q-btn-toggle
              v-model="view"
              dense
              unelevated
              no-caps
              toggle-color="primary"
              :options="viewOptions"
              data-library-view
            />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model="searchQuery"
              dense
              outlined
              clearable
              debounce="40"
              placeholder="Search creatures..."
              data-library-search
              v-help="$t('help.library.search')"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-select
              v-model="selectedFolder"
              dense
              outlined
              clearable
              label="Folder"
              :options="repo.folders"
              data-library-folder
              v-help="$t('help.library.folderFilter')"
            />
          </div>
          <div class="col-6 col-sm-3 col-md-2">
            <q-select
              v-model="selectedTag"
              dense
              outlined
              clearable
              label="Tag"
              :options="repo.tags"
              data-library-tag
              v-help="$t('help.library.tagFilter')"
            />
          </div>
          <div class="col-12 col-sm-4 col-md-2">
            <q-select
              v-model="sortBy"
              dense
              outlined
              emit-value
              map-options
              label="Sort"
              :options="sortOptions"
              data-library-sort
              v-help="$t('help.library.sort')"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none">
        <div
          ref="listContainerRef"
          tabindex="0"
          role="listbox"
          aria-label="Creature Library List"
          data-library-list
          class="creature-library-list"
          @keydown="onListKeydown"
        >
          <div
            v-if="repo.loading && filteredRows.length === 0"
            class="q-pa-lg text-center text-grey-5"
            data-library-loading
          >
            <q-spinner-dots size="32px" color="primary" />
            <div class="q-mt-sm">Loading creatures from repository...</div>
          </div>

          <div
            v-else-if="filteredRows.length === 0"
            class="q-pa-lg text-center text-grey-5"
            data-library-empty
          >
            <q-icon name="inbox" size="36px" class="q-mb-sm" />
            <div class="text-subtitle1">No creatures match the current view or filter.</div>
            <div class="q-mt-sm row justify-center q-gutter-sm">
              <q-btn
                v-if="hasActiveFilters"
                outline
                dense
                no-caps
                label="Clear Filters"
                @click="clearFilters"
              />
              <q-btn
                color="primary"
                dense
                no-caps
                icon="add"
                label="Create New Creature"
                @click="handleCreate"
              />
            </div>
          </div>

          <q-virtual-scroll
            v-else
            ref="virtualScrollRef"
            style="max-height: 52vh"
            :items="filteredRows"
            :virtual-scroll-item-size="82"
          >
            <template #default="{ item, index }">
              <div
                :key="item.id"
                class="creature-library-row q-px-md q-py-sm"
                :class="{
                  'creature-library-row--selected': selectedId === item.id,
                  'creature-library-row--active': repo.activeCreatureId === item.id,
                }"
                role="option"
                :aria-selected="selectedId === item.id"
                data-library-row
                :data-creature-id="item.id"
                :data-selected="selectedId === item.id ? 'true' : 'false'"
                :data-active="repo.activeCreatureId === item.id ? 'true' : 'false'"
                @click="selectIndex(index)"
                @dblclick="openCreature(item.id)"
              >
                <div class="row items-center justify-between no-wrap q-col-gutter-sm">
                  <div class="col min-width-0">
                    <div class="row items-center q-gutter-xs no-wrap">
                      <span class="text-subtitle1 text-weight-medium ellipsis" data-library-row-name>
                        {{ item.name }}
                      </span>
                      <q-badge
                        v-if="repo.activeCreatureId === item.id"
                        color="positive"
                        text-color="white"
                        label="Active"
                      />
                      <q-badge
                        color="amber-9"
                        text-color="white"
                        :label="`CR ${item.cr}`"
                      />
                      <q-badge
                        v-if="item.archived"
                        color="blue-grey-7"
                        text-color="white"
                        label="Archived"
                      />
                      <q-badge
                        v-if="item.trashed"
                        color="deep-orange-9"
                        text-color="white"
                        label="Trash"
                      />
                    </div>
                    <div class="text-caption text-grey-5 row items-center q-gutter-xs q-mt-xs">
                      <span>{{ item.size }} {{ item.type }}</span>
                      <span v-if="item.folder">• Folder: {{ item.folder }}</span>
                      <span v-if="item.updatedAt">• {{ formatDate(item.updatedAt) }}</span>
                      <q-chip
                        v-for="tag in item.tags"
                        :key="tag"
                        dense
                        size="sm"
                        color="grey-8"
                        text-color="white"
                        :label="tag"
                      />
                    </div>
                  </div>

                  <div class="col-auto row items-center q-gutter-xs">
                    <q-btn
                      dense
                      flat
                      color="primary"
                      icon="folder_open"
                      label="Open"
                      no-caps
                      data-library-action="open"
                      v-help="$t('help.library.open')"
                      @click.stop="openCreature(item.id)"
                    />
                    <q-btn
                      dense
                      flat
                      color="secondary"
                      icon="content_copy"
                      label="Duplicate"
                      no-caps
                      data-library-action="duplicate"
                      v-help="$t('help.library.duplicate')"
                      @click.stop="duplicateRow(item.id)"
                    />
                    <q-btn
                      dense
                      flat
                      icon="edit"
                      aria-label="Rename creature"
                      data-library-action="rename"
                      v-help="$t('help.library.rename')"
                      @click.stop="startRename(item)"
                    />
                    <q-btn
                      dense
                      flat
                      icon="label"
                      aria-label="Folder and tags"
                      data-library-action="organize"
                      v-help="$t('help.library.organize')"
                      @click.stop="startOrganize(item)"
                    />
                    <q-btn
                      v-if="!item.trashed"
                      dense
                      flat
                      :icon="item.archived ? 'unarchive' : 'archive'"
                      :aria-label="item.archived ? 'Unarchive creature' : 'Archive creature'"
                      data-library-action="archive"
                      v-help="$t('help.library.archive')"
                      @click.stop="toggleArchive(item)"
                    />
                    <q-btn
                      dense
                      flat
                      :color="item.trashed ? 'positive' : 'orange-5'"
                      :icon="item.trashed ? 'restore_from_trash' : 'delete_outline'"
                      :aria-label="item.trashed ? 'Restore from trash' : 'Move to trash'"
                      data-library-action="trash"
                      v-help="$t('help.library.trash')"
                      @click.stop="toggleTrash(item)"
                    />
                    <template v-if="item.trashed">
                      <q-btn
                        v-if="confirmPurgeId !== item.id"
                        dense
                        flat
                        color="negative"
                        icon="delete_forever"
                        aria-label="Delete permanently"
                        data-library-action="purge"
                        v-help="$t('help.library.purge')"
                        @click.stop="confirmPurgeId = item.id"
                      />
                      <template v-else>
                        <q-btn
                          dense
                          color="negative"
                          label="Confirm Delete"
                          no-caps
                          data-library-action="confirm-purge"
                          @click.stop="purgeRow(item.id)"
                        />
                        <q-btn
                          dense
                          flat
                          label="Cancel"
                          no-caps
                          @click.stop="confirmPurgeId = null"
                        />
                      </template>
                    </template>
                  </div>
                </div>

                <div
                  v-if="editingRenameId === item.id"
                  class="row items-center q-gutter-xs q-mt-xs"
                  @click.stop
                >
                  <q-input
                    v-model="renameDraft"
                    dense
                    outlined
                    autofocus
                    class="col"
                    label="New Creature Name"
                    data-library-rename-input
                    @keyup.enter="saveRename(item.id)"
                    @keyup.escape="cancelRename"
                  />
                  <q-btn
                    dense
                    color="primary"
                    label="Save"
                    no-caps
                    data-library-rename-save
                    @click="saveRename(item.id)"
                  />
                  <q-btn
                    dense
                    flat
                    label="Cancel"
                    no-caps
                    data-library-rename-cancel
                    @click="cancelRename"
                  />
                </div>

                <div
                  v-if="editingOrganizeId === item.id"
                  class="row items-center q-gutter-xs q-mt-xs"
                  @click.stop
                >
                  <q-input
                    v-model="folderDraft"
                    dense
                    outlined
                    class="col-4"
                    label="Folder"
                    data-library-folder-input
                    @keyup.enter="saveOrganize(item.id)"
                  />
                  <q-input
                    v-model="tagsDraft"
                    dense
                    outlined
                    class="col"
                    label="Tags (comma-separated)"
                    data-library-tags-input
                    @keyup.enter="saveOrganize(item.id)"
                  />
                  <q-btn
                    dense
                    color="primary"
                    label="Save"
                    no-caps
                    data-library-organize-save
                    @click="saveOrganize(item.id)"
                  />
                  <q-btn
                    dense
                    flat
                    label="Cancel"
                    no-caps
                    @click="editingOrganizeId = null"
                  />
                </div>
              </div>
            </template>
          </q-virtual-scroll>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="between" class="q-px-md q-py-xs text-caption text-grey-5">
        <span>Keyboard: ArrowUp / ArrowDown to move, Enter to open, Esc to close</span>
        <q-btn flat dense no-caps label="Done" @click="closeDialog" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type {
  CreatureLibrarySort,
  CreatureLibraryView,
  CreatureSummary,
} from 'src/core/domain/creature-library'
import { useRepositoryStore } from 'src/stores/repository-store'
import { useFileLoader } from 'src/components/file/useFileLoader'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const repo = useRepositoryStore()
const { loadMonster } = useFileLoader()

const view = ref<CreatureLibraryView>('active')
const searchQuery = ref('')
const selectedFolder = ref<string | null>(null)
const selectedTag = ref<string | null>(null)
const sortBy = ref<CreatureLibrarySort>('updatedAt')
const selectedId = ref<string | null>(null)
const confirmPurgeId = ref<string | null>(null)
const editingRenameId = ref<string | null>(null)
const renameDraft = ref('')
const editingOrganizeId = ref<string | null>(null)
const folderDraft = ref('')
const tagsDraft = ref('')
const feedbackMessage = ref('')
const feedbackIsError = ref(false)
const importInputRef = ref<HTMLInputElement | null>(null)
const listContainerRef = ref<HTMLElement | null>(null)
const virtualScrollRef = ref<{ scrollTo: (index: number, edge?: string) => void } | null>(null)

const viewOptions: Array<{ label: string; value: CreatureLibraryView }> = [
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
  { label: 'Trash', value: 'trash' },
  { label: 'All', value: 'all' },
]

const sortOptions: Array<{ label: string; value: CreatureLibrarySort }> = [
  { label: 'Recently Updated', value: 'updatedAt' },
  { label: 'Name (A-Z)', value: 'name' },
  { label: 'Challenge Rating', value: 'cr' },
]

const filteredRows = computed(() =>
  repo.query({
    query: searchQuery.value,
    view: view.value,
    folder: selectedFolder.value ?? '',
    tag: selectedTag.value ?? '',
    sortBy: sortBy.value,
  }),
)

const hasActiveFilters = computed(
  () => Boolean(searchQuery.value.trim() || selectedFolder.value || selectedTag.value || view.value !== 'active'),
)

const backendLabel = computed(() => {
  if (repo.backendKind === 'indexeddb') return 'IndexedDB'
  if (repo.backendKind === 'localstorage') return 'localStorage'
  if (repo.backendKind === 'memory') return 'Memory'
  return 'Read-only'
})

const saveStatusLabel = computed(() => {
  switch (repo.saveStatus) {
    case 'saving':
      return 'Saving...'
    case 'saved':
      return 'Saved'
    case 'error':
      return 'Save error'
    case 'read_only':
      return 'Read-only'
    default:
      return 'Idle'
  }
})

const saveBadgeColor = computed(() => {
  switch (repo.saveStatus) {
    case 'saved':
      return 'positive'
    case 'saving':
      return 'info'
    case 'error':
      return 'negative'
    case 'read_only':
      return 'warning'
    default:
      return 'grey-7'
  }
})

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return
    await repo.init()
    await repo.refreshIndex()
    if (!selectedId.value && filteredRows.value.length > 0) {
      selectedId.value = repo.activeCreatureId ?? filteredRows.value[0]?.id ?? null
    }
  },
)

watch(filteredRows, (rows) => {
  if (rows.length === 0) {
    selectedId.value = null
    return
  }
  if (!selectedId.value || !rows.some((r) => r.id === selectedId.value)) {
    selectedId.value = rows[0]?.id ?? null
  }
})

function onDialogToggle(next: boolean) {
  emit('update:modelValue', next)
}

function closeDialog() {
  emit('update:modelValue', false)
}

function clearFilters() {
  searchQuery.value = ''
  selectedFolder.value = null
  selectedTag.value = null
  view.value = 'active'
}

function setFeedback(msg: string, isError = false) {
  feedbackMessage.value = msg
  feedbackIsError.value = isError
}

function selectIndex(idx: number) {
  const row = filteredRows.value[idx]
  if (row) {
    selectedId.value = row.id
    virtualScrollRef.value?.scrollTo(idx)
  }
}

function formatDate(iso: string): string {
  const ts = Date.parse(iso)
  if (!Number.isFinite(ts)) return ''
  return new Date(ts).toLocaleDateString()
}

async function openCreature(id: string) {
  const entry = await repo.loadCreature(id)
  if (!entry) {
    setFeedback('Could not load creature from storage.', true)
    return
  }
  await loadMonster(entry.document)
  closeDialog()
}

async function handleCreate() {
  const created = await repo.createCreature('New Creature')
  if (!created) {
    setFeedback(repo.lastError?.message ?? 'Unable to create creature.', true)
    return
  }
  view.value = 'active'
  selectedId.value = created.summary.id
  await loadMonster(created.document)
  setFeedback(`Created "${created.summary.name}".`)
}

async function duplicateRow(id: string) {
  const dup = await repo.duplicateCreature(id)
  if (!dup) {
    setFeedback(repo.lastError?.message ?? 'Unable to duplicate creature.', true)
    return
  }
  view.value = 'active'
  selectedId.value = dup.summary.id
  setFeedback(`Duplicated as "${dup.summary.name}" with fresh IDs and bindings.`)
}

function startRename(item: CreatureSummary) {
  editingOrganizeId.value = null
  editingRenameId.value = item.id
  renameDraft.value = item.name
}

function cancelRename() {
  editingRenameId.value = null
  renameDraft.value = ''
}

async function saveRename(id: string) {
  const next = renameDraft.value.trim()
  if (!next) return
  const ok = await repo.renameCreature(id, next)
  if (ok) {
    editingRenameId.value = null
    setFeedback(`Renamed creature to "${next}".`)
  } else {
    setFeedback(repo.lastError?.message ?? 'Rename failed.', true)
  }
}

function startOrganize(item: CreatureSummary) {
  editingRenameId.value = null
  editingOrganizeId.value = item.id
  folderDraft.value = item.folder
  tagsDraft.value = item.tags.join(', ')
}

async function saveOrganize(id: string) {
  const tagList = tagsDraft.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const ok = await repo.setFolderAndTags(id, folderDraft.value, tagList)
  if (ok) {
    editingOrganizeId.value = null
    setFeedback('Updated folder and tags.')
  } else {
    setFeedback('Failed to update folder and tags.', true)
  }
}

async function toggleArchive(item: CreatureSummary) {
  const ok = await repo.setArchived(item.id, !item.archived)
  if (ok) {
    setFeedback(item.archived ? `Restored "${item.name}" from Archive.` : `Archived "${item.name}".`)
  }
}

async function toggleTrash(item: CreatureSummary) {
  confirmPurgeId.value = null
  const ok = await repo.setTrashed(item.id, !item.trashed)
  if (ok) {
    setFeedback(item.trashed ? `Restored "${item.name}" from Trash.` : `Moved "${item.name}" to Trash.`)
  }
}

async function purgeRow(id: string) {
  confirmPurgeId.value = null
  const ok = await repo.purgeCreature(id)
  if (ok) {
    setFeedback('Permanently deleted creature.')
  } else {
    setFeedback(repo.lastError?.message ?? 'Permanent delete failed.', true)
  }
}

async function handleExportBackup() {
  const json = await repo.exportBackupJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `dndsheet-library-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  setFeedback('Downloaded repository backup JSON.')
}

function triggerImportInput() {
  importInputRef.value?.click()
}

async function onImportFileChange(evt: Event) {
  const input = evt.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const text = await file.text()
  const res = await repo.restoreBackupJson(text)
  if (res.ok) {
    if (res.activeDocument) {
      await loadMonster(res.activeDocument)
    }
    const qNote = res.quarantined.length > 0 ? ` Quarantined ${res.quarantined.length} invalid record(s).` : ''
    setFeedback(`Restored ${res.restoredCount} creature(s).${qNote}`)
  } else {
    const rbNote = res.rolledBack ? ' Previous library state was restored.' : ''
    setFeedback(`Backup restore failed: ${res.errors.join(' ')}${rbNote}`, true)
  }
}

function onDialogKeydown(evt: KeyboardEvent) {
  if (evt.key === 'Escape' && !editingRenameId.value && !editingOrganizeId.value) {
    evt.preventDefault()
    closeDialog()
  }
}

function onListKeydown(evt: KeyboardEvent) {
  const target = evt.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return
  const rows = filteredRows.value
  if (rows.length === 0) return

  const curIdx = rows.findIndex((r) => r.id === selectedId.value)
  if (evt.key === 'ArrowDown') {
    evt.preventDefault()
    selectIndex(curIdx < 0 ? 0 : Math.min(rows.length - 1, curIdx + 1))
  } else if (evt.key === 'ArrowUp') {
    evt.preventDefault()
    selectIndex(curIdx <= 0 ? 0 : curIdx - 1)
  } else if (evt.key === 'Enter' && selectedId.value) {
    evt.preventDefault()
    void openCreature(selectedId.value)
  }
}
</script>

<style scoped>
.creature-library-list {
  outline: none;
}

.creature-library-row {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background-color 120ms ease;
}

.creature-library-row:hover {
  background: rgba(255, 255, 255, 0.04);
}

.creature-library-row--selected {
  background: rgba(25, 118, 210, 0.16);
}

.creature-library-row--active {
  border-left: 3px solid #21ba45;
}
</style>
