<template>
  <q-btn round flat icon="settings">
    <q-menu style="width: 300px">
      <div class="row no-wrap q-pa-md">
        <div class="row">
          <div class="text-h6 q-mb-md col-12">
            {{ $t('editor.renderSettings') }}
          </div>
          <div class="col-12 flex items-center justify-between">
            <div class="text-body1 q-mr-md">{{ $t('editor.columns') }}</div>
            <q-btn-toggle
              v-model="editorStore.statBlockColumns"
              :label="$t('editor.settings.cols')"
              :options="[
                {
                  label: $t('editor.settings.one'),
                  value: 1,
                },
                { label: $t('editor.settings.two'), value: 2 },
              ]"
            ></q-btn-toggle>
          </div>
          <div class="col-12 flex items-center justify-between q-my-sm">
            <div class="text-body1 q-mr-md">
              {{ $t('editor.settings.style') }}
            </div>
            <q-btn-toggle
              v-model="editorStore.style"
              :label="$t('editor.settings.style')"
              :options="[
                {
                  label: $t('editor.settings.2014'),
                  value: '2014',
                },
                { label: $t('editor.settings.2024'), value: '2024' },
              ]"
            ></q-btn-toggle>
          </div>
          <div class="col-12 q-mb-sm">
            <div class="text-body1 q-mb-xs">View Preset</div>
            <div class="row q-gutter-xs" data-workspace-presets>
              <q-btn
                v-for="preset in workspacePresets"
                :key="preset.id"
                dense
                no-caps
                size="sm"
                :unelevated="activeWorkspacePreset === preset.id"
                :outline="activeWorkspacePreset !== preset.id"
                :color="activeWorkspacePreset === preset.id ? 'primary' : 'grey-5'"
                :icon="preset.icon"
                :label="preset.label"
                :data-workspace-preset="preset.id"
                @click="selectWorkspacePreset(preset.id)"
              />
            </div>
          </div>
          <div class="col-12 flex items-center justify-between q-my-xs">
            <div class="text-body1 q-mr-md">Visual Template</div>
            <q-btn-toggle
              v-model="editorStore.visualTemplate"
              :options="[
                { label: 'Classic', value: 'classic' },
                { label: 'Modular', value: 'modern' },
              ]"
            ></q-btn-toggle>
          </div>
          <div class="col-12 q-my-sm">
            <div class="text-body1 q-mb-xs">Art Direction / Theme</div>
            <q-select
              v-model="editorStore.visualTheme"
              :options="themeOptions"
              emit-value
              map-options
              dense
              outlined
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps" dense>
                  <q-item-section avatar style="min-width: 24px;">
                    <q-icon :name="scope.opt.icon" :color="scope.opt.color" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-badge outline :color="scope.opt.color" class="text-caption">{{ scope.opt.category }}</q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
          <q-toggle
            v-if="editorStore.style === '2014'"
            v-model="editorStore.condenseImmunities"
            class="col-12"
            :label="$t('editor.settings.condenseImmunities')"
          />
          <q-toggle
            v-model="monsterStore.useArticleInToken"
            class="col-12"
            :label="$t('editor.settings.article')"
          />
          <q-toggle
            v-model="monsterStore.alphaTraits"
            class="col-12"
            :label="$t('editor.settings.alphaTrait')"
          />

          <q-separator class="col-12 q-my-sm" />

          <div class="col-12 flex items-center justify-between q-mb-xs">
            <div class="text-subtitle2 text-weight-bold flex items-center">
              <q-icon name="description" color="primary" class="q-mr-xs" size="18px" />
              A4 Sheet Preview (1:1)
            </div>
            <q-toggle
              v-model="editorStore.a4PreviewMode"
              dense
              color="primary"
            />
          </div>

          <template v-if="editorStore.a4PreviewMode">
            <div class="col-12 flex items-center justify-between q-my-xs">
              <div class="text-caption text-weight-medium">Orientation</div>
              <q-btn-toggle
                v-model="editorStore.a4Orientation"
                v-help="'Choose Portrait or Landscape A4 print page orientation.'"
                dense
                rounded
                unelevated
                toggle-color="primary"
                size="sm"
                :options="[
                  { label: 'Portrait', value: 'portrait', icon: 'portrait' },
                  { label: 'Landscape', value: 'landscape', icon: 'landscape' },
                ]"
              />
            </div>

            <div class="col-12 flex items-center justify-between q-my-xs">
              <div class="text-caption text-weight-medium">Layout</div>
              <q-btn-toggle
                v-model="editorStore.a4Layout"
                v-help="'Choose A4 sheet layout between stat block and art/notes panels.'"
                dense
                rounded
                unelevated
                toggle-color="primary"
                size="sm"
                :options="[
                  { label: 'Auto', value: 'auto' },
                  { label: 'Split', value: 'side_by_side' },
                  { label: 'Stacked', value: 'stacked' },
                  { label: 'Stat Only', value: 'statblock_only' },
                ]"
              />
            </div>

            <q-toggle
              v-model="editorStore.a4CompactDensity"
              v-help="'Tighten vertical A4 spacing so dense stat blocks fit onto a single page.'"
              class="col-12 q-my-xs"
              dense
              color="primary"
              label="Compact A4 Spacing"
            />
          </template>
        </div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script lang="ts">
import { useEditorStore, VisualTheme } from 'src/stores/editor-store'
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, defineComponent } from 'vue'
import {
  WORKSPACE_PRESETS,
  applyWorkspacePreset,
  detectActiveWorkspacePreset,
  type WorkspacePresetId,
} from 'src/core/domain/workspace-presets'

export interface ThemeOption {
  label: string
  value: VisualTheme
  category: string
  icon: string
  color: string
}

export const THEME_OPTIONS: ThemeOption[] = [
  { label: 'Classic WotC Parchment', value: 'wotc', category: 'Standard', icon: 'auto_stories', color: 'amber-8' },
  { label: 'Printer Friendly (B&W)', value: 'printer', category: 'Standard', icon: 'print', color: 'grey-8' },
  { label: 'Lovecraftian Gothic-Golden', value: 'lovecraft_golden', category: 'Lovecraftian', icon: 'shield_moon', color: 'amber-5' },
  { label: 'Lovecraftian Gothic-Silver', value: 'lovecraft_silver', category: 'Lovecraftian', icon: 'bedtime', color: 'blue-grey-4' },
  { label: 'Lovecraftian Gothic-Toxic', value: 'lovecraft_toxic', category: 'Lovecraftian', icon: 'science', color: 'positive' },
  { label: 'Lovecraftian Gothic-Spooky', value: 'lovecraft_spooky', category: 'Lovecraftian', icon: 'nights_stay', color: 'purple-4' },
  { label: 'Lovecraftian Gothic-Galactic', value: 'lovecraft_galactic', category: 'Lovecraftian', icon: 'flare', color: 'indigo-4' },
  { label: 'Lovecraftian Gothic-Fathomless', value: 'lovecraft_fathomless', category: 'Lovecraftian', icon: 'water_drop', color: 'cyan-4' },
  { label: 'Dwarves-Anvil and Forge', value: 'dwarves_forge', category: 'Dwarven', icon: 'local_fire_department', color: 'deep-orange-5' },
  { label: 'Dwarves-Aetherpunk', value: 'dwarves_aetherpunk', category: 'Dwarven', icon: 'precision_manufacturing', color: 'light-blue-4' },
  { label: 'Decaying Elegancy-Art Nouveau', value: 'art_nouveau', category: 'Decaying Elegancy', icon: 'spa', color: 'green-7' },
  { label: 'Decaying Elegancy-ArtDeco', value: 'art_deco', category: 'Decaying Elegancy', icon: 'diamond', color: 'yellow-7' },
]

export default defineComponent({
  name: 'WebRendererSettingsButton',
  setup() {
    const monsterStore = useMonsterStore()
    const editorStore = useEditorStore()
    const activeWorkspacePreset = computed(() => detectActiveWorkspacePreset(editorStore))

    const selectWorkspacePreset = (presetId: WorkspacePresetId) => {
      applyWorkspacePreset(editorStore as unknown as Record<string, unknown>, presetId)
    }

    return {
      monsterStore,
      editorStore,
      themeOptions: THEME_OPTIONS,
      workspacePresets: WORKSPACE_PRESETS,
      activeWorkspacePreset,
      selectWorkspacePreset,
    }
  },
})
</script>
