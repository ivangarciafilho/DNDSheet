<template>
  <q-layout view="hHh lpR fFf">
    <q-header id="main-nav" elevated height-hint="64">
      <q-toolbar class="main-toolbar">
        <!-- 1. Document group -->
        <div
          role="group"
          aria-label="Document controls"
          data-toolbar-group="document"
          class="toolbar-group"
        >
          <q-btn v-help="'Menu in the main layout.'"
            flat
            dense
            round
            aria-label="Menu"
            icon="menu"
            @click="toggleLeftDrawer"
          />

          <q-toolbar-title
            v-if="$q.screen.gt.xs"
            shrink
            class="row items-center no-wrap"
          >
            <span class="q-ml-xs">{{ $t('app.name') }}</span>
          </q-toolbar-title>

          <q-btn
            dense
            rounded
            unelevated
            color="primary"
            icon="mdi-bookshelf"
            :label="$q.screen.gt.xs ? 'Library' : undefined"
            no-caps
            aria-label="Open Creature Library"
            data-library-open
            v-help="$t('help.workspace.libraryOpen')"
            @click="showLibrary = true"
          >
            <q-tooltip>Open Creature Library &amp; Local Backups</q-tooltip>
          </q-btn>

          <q-btn
            dense
            flat
            no-caps
            size="sm"
            class="save-status-pill"
            :data-save-status="repoStore.saveStatus"
            :color="saveStatusColor"
            :icon="saveStatusIcon"
            :label="$q.screen.gt.xs ? saveStatusText : undefined"
            :aria-label="`Save status: ${saveStatusText}`"
            @click="onSaveStatusClick"
          >
            <q-tooltip>{{ saveStatusTooltip }}</q-tooltip>
          </q-btn>

          <q-btn
            round
            flat
            dense
            icon="mdi-folder-open"
            aria-label="Open JSON File"
            @click="loadFileDialog()"
          >
            <q-tooltip>Open File</q-tooltip>
          </q-btn>
          <download-button />
        </div>

        <q-space class="gt-sm" />

        <!-- 2. Editing & History group -->
        <div
          role="group"
          aria-label="Editing controls"
          data-toolbar-group="editing"
          class="toolbar-group"
        >
          <q-btn
            round
            flat
            dense
            icon="undo"
            :disable="!historyStore.canUndo"
            @click="historyStore.undo()"
          >
            <q-tooltip>Undo (Ctrl+Z)</q-tooltip>
          </q-btn>
          <q-btn
            round
            flat
            dense
            icon="redo"
            :disable="!historyStore.canRedo"
            @click="historyStore.redo()"
          >
            <q-tooltip>Redo (Ctrl+Y)</q-tooltip>
          </q-btn>
        </div>

        <!-- 3. Rule Context & Combat Tools group -->
        <div
          role="group"
          aria-label="Context and combat tools"
          data-toolbar-group="context"
          class="toolbar-group"
        >
          <div class="template-bar">
            <template-search />
          </div>

          <!-- Mode Toggle: Monster vs Character -->
          <q-btn
            dense
            rounded
            unelevated
            :color="editorStore.activeMode === 'character' ? 'teal-9' : 'blue-grey-8'"
            :label="editorStore.activeMode === 'character' ? 'Hero Sheet' : 'Monster'"
            class="text-weight-bold text-caption q-px-sm"
            @click="editorStore.activeMode = editorStore.activeMode === 'character' ? 'monster' : 'character'"
          >
            <q-tooltip>Switch between Monster Maker and Hero Sheet</q-tooltip>
          </q-btn>

          <!-- Ruleset Toggle (when in monster mode) -->
          <q-btn
            v-if="editorStore.activeMode === 'monster'"
            dense
            rounded
            unelevated
            :color="editorStore.style === '2024' ? 'purple-9' : 'amber-9'"
            :label="editorStore.style === '2024' ? 'D&D 2024' : 'D&D 2014'"
            class="text-weight-bold text-caption q-px-sm"
            @click="editorStore.style = editorStore.style === '2024' ? '2014' : '2024'"
          >
            <q-tooltip>Switch between 2014 and 2024 Statblock Rulesets</q-tooltip>
          </q-btn>

          <!-- AI Ingest Studio -->
          <q-btn
            round
            flat
            dense
            icon="auto_awesome"
            color="amber-4"
            @click="showAiIngest = true"
          >
            <q-tooltip>AI Statblock Ingest Studio</q-tooltip>
          </q-btn>

          <!-- Combat HUD -->
          <q-btn
            round
            flat
            dense
            icon="mdi-sword-cross"
            color="deep-orange-4"
            @click="showCombatHud = !showCombatHud"
          >
            <q-tooltip>Combat Tracker HUD</q-tooltip>
          </q-btn>
        </div>

        <q-space class="gt-sm" />

        <!-- 4. Presentation & View Presets group -->
        <div
          role="group"
          aria-label="Presentation controls"
          data-toolbar-group="presentation"
          class="toolbar-group"
        >
          <!-- Workspace View Preset Menu -->
          <q-btn-dropdown
            v-if="editorStore.activeMode === 'monster'"
            dense
            rounded
            unelevated
            no-caps
            color="teal-9"
            icon="style"
            :label="$q.screen.gt.xs ? activePresetLabel : undefined"
            class="text-weight-bold text-caption q-px-sm"
            data-workspace-preset-menu
          >
            <q-list dense style="min-width: 240px;">
              <q-item-label header class="text-weight-bold text-caption text-grey-5">
                View Presets (Visual Only)
              </q-item-label>
              <q-item
                v-for="preset in workspacePresets"
                :key="preset.id"
                clickable
                v-close-popup
                :active="activeWorkspacePreset === preset.id"
                :data-workspace-preset="preset.id"
                @click="selectWorkspacePreset(preset.id)"
              >
                <q-item-section avatar style="min-width: 28px;">
                  <q-icon :name="preset.icon" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-caption text-weight-medium">{{ preset.label }}</q-item-label>
                  <q-item-label caption>{{ preset.description }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Visual Template Switcher (Classic WotC vs Modern Modular) -->
          <q-btn
            v-if="editorStore.activeMode === 'monster'"
            dense
            rounded
            unelevated
            :color="editorStore.visualTemplate === 'modern' ? 'teal-9' : 'blue-grey-8'"
            :label="editorStore.visualTemplate === 'modern' ? 'Modern Modular' : 'Classic WotC'"
            icon="dashboard_customize"
            class="text-weight-bold text-caption q-px-sm"
            @click="editorStore.visualTemplate = editorStore.visualTemplate === 'modern' ? 'classic' : 'modern'"
          >
            <q-tooltip>Switch between Classic WotC Statblock and Modern Modular (Giffyglyph-Inspired) Visual Layout</q-tooltip>
          </q-btn>

          <!-- Visual Theme Dropdown (12 Art Directions) -->
          <q-btn-dropdown
            v-if="editorStore.activeMode === 'monster'"
            dense
            rounded
            unelevated
            color="deep-purple-9"
            icon="palette"
            :label="$q.screen.gt.xs ? currentThemeName : undefined"
            class="text-weight-bold text-caption q-px-sm"
          >
            <q-list dense style="min-width: 250px;">
              <q-item-label header class="text-weight-bold text-caption text-grey-5">
                Art Directions &amp; Themes
              </q-item-label>
              <q-item
                v-for="opt in themeOptions"
                :key="opt.value"
                clickable
                v-close-popup
                :active="editorStore.visualTheme === opt.value"
                active-class="bg-deep-purple-10 text-white"
                @click="editorStore.visualTheme = opt.value"
              >
                <q-item-section avatar style="min-width: 28px;">
                  <q-icon :name="opt.icon" :color="opt.color" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-caption text-weight-medium">{{ opt.label }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge outline :color="opt.color" class="text-caption">{{ opt.category }}</q-badge>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- A4 Sheet 1:1 Preview Toggle -->
          <q-btn
            round
            flat
            dense
            :icon="editorStore.a4PreviewMode ? 'picture_as_pdf' : 'description'"
            :color="editorStore.a4PreviewMode ? 'amber-4' : 'grey-4'"
            @click="editorStore.a4PreviewMode = !editorStore.a4PreviewMode"
          >
            <q-tooltip>Toggle A4 Sheet 1:1 Print Preview (210×297mm)</q-tooltip>
          </q-btn>

          <web-renderer-settings-button />
        </div>
      </q-toolbar>
    </q-header>

    <app-drawer
      :left-drawer-open="leftDrawerOpen"
      @open-ai-ingest="showAiIngest = true"
      @open-combat-hud="showCombatHud = true"
    />

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer id="footer" elevated>
      <q-card class="full-width">
        <q-card-section class="bg-blue-grey-7 no-padding">
          <cr-footer />
        </q-card-section>
        <q-card-section class="bg-grey-10 no-padding">
          <generic-footer />
        </q-card-section>
      </q-card>
    </q-footer>

    <!-- AI Ingest Dialog -->
    <ai-ingest-dialog v-model="showAiIngest" />

    <!-- Combat Tracker Drawer -->
    <combat-tracker-drawer v-model="showCombatHud" />

    <!-- Creature Library & Local Repository Backup Dialog -->
    <creature-library-dialog v-model="showLibrary" />

    <q-dialog v-model="showDataLoad" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('io.dataUrl.title') }}</div>
          <div class="q-my-sm">
            {{ $t('io.dataUrl.loadText', [queryData.name]) }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('editor.load')"
            color="positive"
            @click="loadFromDataParam"
          />
          <q-btn
            v-close-popup
            flat
            :label="$t('editor.cancel')"
            color="negative"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CrFooter from 'src/components/cr/CrFooter.vue'
import GenericFooter from 'src/components/GenericFooter.vue'
import { useFileLoader } from 'src/components/file/useFileLoader'
import { popFileDialog } from 'src/components/file/popFileDialog'
import DownloadButton from 'src/components/file/DownloadButton.vue'
import { useRoute } from 'vue-router'

import jsonurl from 'json-url'
import { useQuasar } from 'quasar'
import WebRendererSettingsButton from 'src/components/rendering/WebRendererSettingsButton.vue'
import { useV1Updater } from 'src/components/file/useV1Updater'
import AppDrawer from 'src/components/AppDrawer.vue'
import TemplateSearch from 'src/components/editor/TemplateSearch.vue'
import { useEditorStore } from 'src/stores/editor-store'
import { useHistoryShortcuts } from 'src/components/history/useHistoryShortcuts'
import AiIngestDialog from 'src/components/ai/AiIngestDialog.vue'
import CombatTrackerDrawer from 'src/components/combat/CombatTrackerDrawer.vue'
import CreatureLibraryDialog from 'src/components/library/CreatureLibraryDialog.vue'
import { THEME_OPTIONS } from 'src/components/rendering/WebRendererSettingsButton.vue'
import { useRepositoryStore } from 'src/stores/repository-store'
import { useMonsterSessionStore } from 'src/stores/monster-session'
import {
  WORKSPACE_PRESETS,
  applyWorkspacePreset,
  detectActiveWorkspacePreset,
  type WorkspacePresetId,
} from 'src/core/domain/workspace-presets'

export default defineComponent({
  name: 'MainLayout',
  components: {
    AppDrawer,
    CrFooter,
    GenericFooter,
    DownloadButton,
    WebRendererSettingsButton,
    TemplateSearch,
    AiIngestDialog,
    CombatTrackerDrawer,
    CreatureLibraryDialog,
  },
  setup() {
    const leftDrawerOpen = ref(false)
    const showAiIngest = ref(false)
    const showCombatHud = ref(false)
    const showLibrary = ref(false)
    const route = useRoute()
    const codec = jsonurl('lzma')
    const $q = useQuasar()
    const editorStore = useEditorStore()
    const repoStore = useRepositoryStore()
    const sessionStore = useMonsterSessionStore()
    const { loadMonster } = useFileLoader()

    // Initialize history tracking and shortcuts
    const { historyStore } = useHistoryShortcuts()

    // run the v1 updater checks
    useV1Updater()

    const { loadFile } = useFileLoader()

    const loadFileDialog = async () => {
      const file = await popFileDialog()

      if (file) {
        loadFile(file)
      }
    }

    const dataParamFound = route.query.data != null

    const showDataLoad = ref(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryData: any = ref({})

    const loadDataParam = async () => {
      try {
        const data = (await codec.decompress(route.query.data)) as string
        const maybeMonster = JSON.parse(data)
        queryData.value = maybeMonster
        showDataLoad.value = true
      } catch (e) {
        $q.notify({
          message: 'Invalid data parameter',
          type: 'negative',
        })

        route.query.data = ''
      }
    }
    // only do this on load
    if (dataParamFound) {
      loadDataParam()
    }

    // load from data param
    const loadFromDataParam = () => {
      if (dataParamFound) {
        loadMonster(queryData.value)
      }

      showDataLoad.value = false
    }

    const openDnd = () => {
      window.open('https://opendnd.games')
    }

    const currentThemeName = computed(() => {
      const found = THEME_OPTIONS.find((t) => t.value === editorStore.visualTheme)
      return found ? found.label.replace('Lovecraftian Gothic-', 'Gothic-').replace('Decaying Elegancy-', '') : 'Theme'
    })

    const activeWorkspacePreset = computed(() => detectActiveWorkspacePreset(editorStore))
    const activePresetLabel = computed(() => {
      const found = WORKSPACE_PRESETS.find((p) => p.id === activeWorkspacePreset.value)
      return found ? found.label : 'Custom View'
    })

    const selectWorkspacePreset = (presetId: WorkspacePresetId) => {
      applyWorkspacePreset(editorStore as unknown as Record<string, unknown>, presetId)
    }

    const saveStatusText = computed(() => {
      switch (repoStore.saveStatus) {
        case 'saving':
          return 'Saving...'
        case 'saved':
          return 'Saved'
        case 'error':
          return 'Save Error'
        case 'read_only':
          return 'Read-only'
        default:
          return 'Local'
      }
    })

    const saveStatusColor = computed(() => {
      switch (repoStore.saveStatus) {
        case 'saved':
          return 'positive'
        case 'saving':
          return 'info'
        case 'error':
          return 'negative'
        case 'read_only':
          return 'warning'
        default:
          return 'grey-5'
      }
    })

    const saveStatusIcon = computed(() => {
      switch (repoStore.saveStatus) {
        case 'saved':
          return 'cloud_done'
        case 'saving':
          return 'sync'
        case 'error':
          return 'error_outline'
        case 'read_only':
          return 'lock'
        default:
          return 'save'
      }
    })

    const saveStatusTooltip = computed(() => {
      if (repoStore.lastError) {
        return `${repoStore.lastError.code}: ${repoStore.lastError.message} Click to open Library & Backup recovery.`
      }
      if (repoStore.lastSavedAt) {
        return `Saved locally (${repoStore.backendKind}). Click to save immediately.`
      }
      return 'Local repository status. Click to save current creature.'
    })

    const onSaveStatusClick = () => {
      if (repoStore.saveStatus === 'error' || repoStore.saveStatus === 'read_only') {
        showLibrary.value = true
      } else {
        void repoStore.saveActiveNow()
      }
    }

    let saveTimer: ReturnType<typeof setTimeout> | null = null
    watch(
      () => sessionStore.contentRevision,
      () => {
        if (!repoStore.initialized) return
        if (saveTimer !== null) clearTimeout(saveTimer)
        saveTimer = setTimeout(() => {
          saveTimer = null
          void repoStore.saveActiveNow()
        }, 450)
      },
    )

    onBeforeUnmount(() => {
      if (saveTimer !== null) clearTimeout(saveTimer)
    })

    onMounted(() => {
      // check data param on load, v1 links do not have the right hash
      if (!dataParamFound && window.location.search.startsWith('?data')) {
        const data = window.location.search
        window.location.search = ''
        window.location.href = `${window.location.origin}${window.location.pathname}#/${data}`
      }
      void repoStore.init()
    })

    return {
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value
      },
      loadFileDialog,
      dataParamFound,
      showDataLoad,
      queryData,
      loadFromDataParam,
      leftDrawerOpen,
      openDnd,
      editorStore,
      historyStore,
      repoStore,
      showAiIngest,
      showCombatHud,
      showLibrary,
      themeOptions: THEME_OPTIONS,
      currentThemeName,
      workspacePresets: WORKSPACE_PRESETS,
      activeWorkspacePreset,
      activePresetLabel,
      selectWorkspacePreset,
      saveStatusText,
      saveStatusColor,
      saveStatusIcon,
      saveStatusTooltip,
      onSaveStatusClick,
    }
  },
})
</script>

<style scoped>
.main-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  padding-top: 4px;
  padding-bottom: 4px;
}

.toolbar-group {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

@media screen and (max-width: 720px) {
  .main-toolbar .template-bar {
    max-width: 170px;
  }
}
</style>

<style lang="scss">
.template-bar {
  width: 40%;
}
</style>
