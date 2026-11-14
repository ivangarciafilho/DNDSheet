<template>
  <q-layout view="hHh lpR fFf" class="bg-dark text-white">
    <q-header elevated height-hint="64" class="bg-grey-10">
      <q-toolbar>
        <q-btn flat round icon="arrow_back" to="/" aria-label="Return to Editor">
          <q-tooltip>Return to Editor</q-tooltip>
        </q-btn>
        <q-toolbar-title shrink class="row items-center no-wrap">
          <span class="q-ml-sm">{{ $t('app.name') }}</span>
          <span class="text-caption text-grey-4 q-ml-md">— Data Recovery & Diagnostic Studio</span>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="flex items-center justify-center full-height full-width q-pa-md">
        <q-card
          bordered
          style="max-width: 650px; width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12);"
          class="q-mt-lg shadow-6 rounded-borders"
        >
          <q-card-section class="row items-center justify-between">
            <div class="text-h6 text-teal-4">
              <q-icon name="build" class="q-mr-xs" /> Reset & Diagnostic Tool
            </div>
            <q-btn flat dense icon="home" to="/" label="Home" color="teal-3" />
          </q-card-section>
          <q-separator style="background: rgba(255, 255, 255, 0.1);" />

          <q-card-section>
            <p class="text-body2 text-grey-3">
              {{ $t('error.message') }}
            </p>
            <p class="text-body2 text-grey-4">
              {{ $t('error.report') }}
            </p>
          </q-card-section>

          <!-- Recovery Backups Section -->
          <q-card-section class="q-pt-none">
            <div class="text-subtitle2 text-weight-bold text-grey-4 q-mb-xs">Export Diagnostic Snapshots</div>
            <div class="row q-col-gutter-xs">
              <div class="col-6 col-sm-3">
                <q-btn outline color="primary" class="full-width" @click="downloadFile">
                  Monster JSON
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn outline color="teal-4" class="full-width" @click="downloadCharacter">
                  Hero JSON
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn outline color="amber-4" class="full-width" @click="downloadSpells">
                  Spells JSON
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn outline color="purple-4" class="full-width" @click="downloadTemplates">
                  Templates JSON
                </q-btn>
              </div>
            </div>
          </q-card-section>

          <q-separator style="background: rgba(255, 255, 255, 0.1);" class="q-my-sm" />

          <!-- Repository Backup & Recovery Section -->
          <q-card-section class="q-pt-none">
            <div class="text-subtitle2 text-weight-bold text-grey-4 q-mb-xs">
              Repository Backup &amp; Restore
            </div>
            <div class="row q-col-gutter-xs">
              <div class="col-12 col-sm-6">
                <q-btn
                  outline
                  color="cyan-4"
                  icon="download"
                  class="full-width"
                  no-caps
                  data-recovery-export-backup
                  v-help="$t('help.library.exportBackup')"
                  @click="exportRepositoryBackup"
                >
                  Download Repository Backup (.json)
                </q-btn>
              </div>
              <div class="col-12 col-sm-6">
                <q-btn
                  outline
                  color="amber-4"
                  icon="upload_file"
                  class="full-width"
                  no-caps
                  data-recovery-restore-backup
                  v-help="$t('help.library.importBackup')"
                  @click="triggerRestoreBackup"
                >
                  Restore Repository Backup (.json)
                </q-btn>
                <input
                  ref="recoveryImportRef"
                  type="file"
                  accept="application/json,.json"
                  hidden
                  data-recovery-import-input
                  @change="onRestoreBackupChange"
                />
              </div>
            </div>
            <q-banner
              v-if="recoveryMessage"
              dense
              rounded
              :class="recoveryIsError ? 'bg-red-9 text-white q-mt-xs' : 'bg-teal-9 text-white q-mt-xs'"
              role="status"
              data-recovery-status
            >
              {{ recoveryMessage }}
            </q-banner>
          </q-card-section>

          <q-separator style="background: rgba(255, 255, 255, 0.1);" class="q-my-sm" />

          <!-- Reset / Purge Section -->
          <q-card-section class="q-pt-none">
            <div class="text-subtitle2 text-weight-bold text-negative q-mb-xs">Purge Corrupted Local Storage</div>
            <div class="row q-col-gutter-xs">
              <div class="col-6 col-sm-3">
                <q-btn color="negative" class="full-width" @click="clear">
                  Reset Monster
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn color="negative" class="full-width" @click="clearCharacter">
                  Reset Hero
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn color="negative" class="full-width" @click="clearSpells">
                  Reset Spells
                </q-btn>
              </div>
              <div class="col-6 col-sm-3">
                <q-btn color="negative" class="full-width" @click="clearTemplates">
                  Reset Templates
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-page-container>

    <q-footer elevated class="bg-grey-10 text-center q-py-xs text-caption text-grey-5">
      5e Monster Maker & Hero Sheet • 100% Offline PWA Diagnostic Safe Mode
    </q-footer>
  </q-layout>
</template>

<script lang="ts">
import { download } from '../components/file/download'
import { defineComponent, ref } from 'vue'
import { Notify } from 'quasar'
import { clearOverflowSnapshot, indexedDbSnapshots } from 'src/core/adapters/IndexedDbAutosave'
import { useRepositoryStore } from 'src/stores/repository-store'

export default defineComponent({
  name: 'ErrorCorrectionLayout',
  setup() {
    const clear = async () => {
      const key = 'app.monster'
      try {
        localStorage.removeItem(key)
        if (window.indexedDB) await clearOverflowSnapshot(key)
        window.location.assign(`${window.location.origin}${window.location.pathname}`)
      } catch {
        Notify.create({ type: 'negative', message: 'Could not clear all saved monster data. Browser storage may be blocked.' })
      }
    }

    const clearCharacter = () => {
      localStorage.removeItem('app.character')
      window.location.assign(`${window.location.origin}${window.location.pathname}`)
    }

    const clearSpells = () => {
      localStorage.removeItem('app.spells')
      window.location.assign(`${window.location.origin}${window.location.pathname}`)
    }

    const clearTemplates = () => {
      localStorage.removeItem('app.templates')
      window.location.assign(`${window.location.origin}${window.location.pathname}`)
    }

    const downloadFile = async () => {
      const key = 'app.monster'
      const overflow = await indexedDbSnapshots.read(key).catch(() => null)
      try {
        const data = overflow ?? localStorage.getItem(key)
        if (data) download(data, 'monster-error.json', 'application/json')
      } catch {
        Notify.create({ type: 'negative', message: 'Browser storage blocked the monster backup.' })
      }
    }

    const downloadCharacter = () => {
      const data = localStorage.getItem('app.character')
      if (data) download(data, 'character-error.json', 'application/json')
    }

    const downloadSpells = () => {
      const data = localStorage.getItem('app.spells')
      if (data) download(data, 'spells-error.json', 'application/json')
    }

    const downloadTemplates = () => {
      const data = localStorage.getItem('app.templates')
      if (data) download(data, 'templates-error.json', 'application/json')
    }

    const recoveryImportRef = ref<HTMLInputElement | null>(null)
    const recoveryMessage = ref('')
    const recoveryIsError = ref(false)

    const exportRepositoryBackup = async () => {
      try {
        const repoStore = useRepositoryStore()
        const json = await repoStore.exportBackupJson()
        download(json, `dndsheet-library-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
        recoveryIsError.value = false
        recoveryMessage.value = 'Exported full repository backup JSON.'
      } catch (err) {
        recoveryIsError.value = true
        recoveryMessage.value = `Backup export failed: ${err instanceof Error ? err.message : String(err)}`
      }
    }

    const triggerRestoreBackup = () => {
      recoveryImportRef.value?.click()
    }

    const onRestoreBackupChange = async (evt: Event) => {
      const input = evt.target as HTMLInputElement
      const file = input.files?.[0]
      input.value = ''
      if (!file) return
      try {
        const text = await file.text()
        const repoStore = useRepositoryStore()
        const res = await repoStore.restoreBackupJson(text)
        if (res.ok) {
          const qText = res.quarantined.length > 0 ? ` Quarantined ${res.quarantined.length} invalid record(s).` : ''
          recoveryIsError.value = false
          recoveryMessage.value = `Restored ${res.restoredCount} creature(s).${qText}`
        } else {
          const rbText = res.rolledBack ? ' Rolled back to previous repository state.' : ''
          recoveryIsError.value = true
          recoveryMessage.value = `Restore failed: ${res.errors.join(' ')}${rbText}`
        }
      } catch (err) {
        recoveryIsError.value = true
        recoveryMessage.value = `Restore error: ${err instanceof Error ? err.message : String(err)}`
      }
    }

    return {
      clear,
      clearCharacter,
      clearSpells,
      clearTemplates,
      downloadFile,
      downloadCharacter,
      downloadSpells,
      downloadTemplates,
      recoveryImportRef,
      recoveryMessage,
      recoveryIsError,
      exportRepositoryBackup,
      triggerRestoreBackup,
      onRestoreBackupChange,
    }
  },
})
</script>

<style scoped>
</style>
