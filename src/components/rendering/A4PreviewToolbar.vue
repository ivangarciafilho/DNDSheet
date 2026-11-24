<template>
  <!-- A4 Control Toolbar -->
  <div class="a4-preview-toolbar row items-center justify-between q-px-sm q-py-xs bg-grey-9 text-white rounded-borders q-mb-sm">
    <div class="row items-center q-gutter-xs">
      <q-btn
        :color="editorStore?.a4PreviewMode ? 'amber-5' : 'grey-7'"
        :text-color="editorStore?.a4PreviewMode ? 'black' : 'white'"
        dense
        no-caps
        icon="description"
        :label="editorStore?.a4PreviewMode ? 'A4 Sheet 1:1 Preview: ON' : 'A4 Sheet 1:1 Preview: OFF'"
        class="text-weight-bold"
        @click="editorStore.a4PreviewMode = !editorStore.a4PreviewMode"
      >
        <q-tooltip>Simulate true A4 physical sheet aspect ratio (210×297mm) with integrated creature artwork</q-tooltip>
      </q-btn>

      <q-btn flat dense no-caps icon="format_size" :label="`Text: ${editorStore.statblockFontScale}%`">
        <q-menu class="q-pa-sm bg-grey-10 text-white" style="min-width: 200px">
          <div class="text-caption">Statblock text size</div>
          <q-slider
            v-model="editorStore.statblockFontScale"
            v-help="'Scale overall typography size inside the stat block preview from 65% to 150%.'"
            aria-label="Statblock text size"
            :min="65"
            :max="150"
            :step="1"
            label
            dense
          />
          <q-btn flat dense no-caps label="Reset text size" @click="editorStore.statblockFontScale = 100" />
        </q-menu>
      </q-btn>

      <!-- A4 Controls (Visible when A4 preview is ON) -->
      <template v-if="editorStore?.a4PreviewMode">
        <q-separator vertical dark class="q-mx-xs" />
        <q-btn-toggle
          v-model="editorStore.a4Orientation"
          dense
          no-caps
          rounded
          toggle-color="primary"
          color="grey-8"
          :options="[
            { label: 'Portrait', value: 'portrait', icon: 'crop_portrait' },
            { label: 'Landscape', value: 'landscape', icon: 'crop_landscape' }
          ]"
        >
          <q-tooltip>A4 Page Orientation (210×297mm vs 297×210mm)</q-tooltip>
        </q-btn-toggle>

        <q-btn-toggle
          v-model="editorStore.a4Layout"
          dense
          no-caps
          rounded
          toggle-color="secondary"
          color="grey-8"
          :options="[
            { label: 'Auto', value: 'auto' },
            { label: 'Side-by-Side', value: 'side_by_side' },
            { label: 'Hero Top', value: 'stacked' },
            { label: 'Statblock Only', value: 'statblock_only' }
          ]"
        >
          <q-tooltip>Page Composition & Artwork Placement</q-tooltip>
        </q-btn-toggle>

        <q-btn-toggle
          v-model="editorStore.a4Zoom"
          dense
          no-caps
          rounded
          toggle-color="indigo"
          color="grey-8"
          :options="[
            { label: 'Fit', value: 'fit' },
            { label: '100%', value: 100 },
            { label: '75%', value: 75 }
          ]"
        >
          <q-tooltip>Preview Zoom Scale</q-tooltip>
        </q-btn-toggle>

        <q-btn
          :flat="!editorStore.a4CompactDensity"
          :color="editorStore.a4CompactDensity ? 'teal-4' : 'grey-5'"
          dense
          no-caps
          icon="compress"
          label="Compact"
          @click="editorStore.a4CompactDensity = !editorStore.a4CompactDensity"
        >
          <q-tooltip>Tighten line height and vertical margins to fit large statblocks on 1 page</q-tooltip>
        </q-btn>

        <!-- Occlusion Popover -->
        <q-btn
          flat
          dense
          no-caps
          icon="layers_clear"
          color="cyan-3"
          :label="`Cover: ${editorStore.a4PictureOcclusion || 0}%`"
        >
          <q-tooltip>Picture Occlusion: Decides how much the statblock covers/occludes the picture (0% = Side by Side, 50% = Covers Half, 100% = Full Cover)</q-tooltip>
          <q-menu class="q-pa-sm bg-grey-10 text-white" style="min-width: 220px;">
            <div class="text-caption text-weight-bold q-mb-xs text-cyan-3">
              Artwork Occlusion: {{ editorStore.a4PictureOcclusion || 0 }}%
            </div>
            <q-slider
              v-model="editorStore.a4PictureOcclusion"
              v-help="'Control how much the stat block frame overlaps portrait artwork (0% side-by-side to 100% full cover).'"
              :min="0"
              :max="100"
              color="cyan-4"
              label
              dense
            />
            <div class="text-caption text-grey-5" style="font-size: 0.7rem;">
              0% = Side-by-Side | 50% = 50% Overlap | 100% = Full Cover
            </div>
          </q-menu>
        </q-btn>

        <!-- Opacity Popover -->
        <q-btn
          flat
          dense
          no-caps
          icon="opacity"
          color="amber-3"
          :label="`Opacity: ${editorStore.a4StatblockOpacity ?? 100}%`"
        >
          <q-tooltip>Statblock background opacity to reveal underlying artwork and background textures</q-tooltip>
          <q-menu class="q-pa-sm bg-grey-10 text-white" style="min-width: 220px;">
            <div class="text-caption text-weight-bold q-mb-xs text-amber-3">
              Statblock Opacity: {{ editorStore.a4StatblockOpacity ?? 100 }}%
            </div>
            <q-slider
              v-model="editorStore.a4StatblockOpacity"
              v-help="'Adjust parchment backdrop opacity behind stat block text to reveal A4 page art underneath.'"
              :min="0"
              :max="100"
              color="amber-4"
              label
              dense
            />
            <div class="text-caption text-grey-5" style="font-size: 0.7rem;">
              Lower opacity to reveal artwork and page textures
            </div>
          </q-menu>
        </q-btn>

        <!-- Layer Studio Button -->
        <q-btn
          flat
          dense
          no-caps
          icon="layers"
          color="purple-3"
          label="Layers"
          @click="openLayerStudio"
        >
          <q-tooltip>Scroll to A4 Composition Layer Studio</q-tooltip>
        </q-btn>
      </template>
    </div>

    <div class="row items-center q-gutter-xs">
      <template v-if="editorStore?.a4PreviewMode">
        <q-badge
          v-if="editorStore.a4MultiPagePrint && a4Pagination?.isOverflowing"
          color="indigo-8"
          text-color="white"
          class="text-weight-bold q-pa-xs"
          data-a4-multipage-active
        >
          {{ a4Pagination.pageCount }}p
        </q-badge>

        <q-badge
          :color="a4PageOverflowPx > 0 ? 'amber-4' : 'green-9'"
          :text-color="a4PageOverflowPx > 0 ? 'grey-10' : 'white'"
          :data-a4-overflow-indicator="a4Pagination?.isOverflowing ? 'true' : undefined"
          class="text-weight-bold q-pa-xs"
        >
          <q-icon :name="a4PageOverflowPx > 0 ? 'warning' : 'check_circle'" class="q-mr-xs" />
          {{ a4PageOverflowPx > 0 ? 'Content exceeds one A4 page' : 'Fits on one A4 page' }}
          <q-tooltip v-if="a4Pagination?.isOverflowing">
            {{ $t('studio.settings.overflowTooltip', [a4Pagination.pageCount, a4Pagination.overflowPx]) }}
          </q-tooltip>
        </q-badge>

        <q-btn
          flat
          dense
          color="white"
          icon="print"
          label="Print / PDF"
          @click="printA4Sheet"
        >
          <q-tooltip>Print or save as PDF. Stretch the artwork and statblock to fill one A4 page.</q-tooltip>
        </q-btn>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import type { A4PaginationMetrics } from 'src/core/domain/a4-pagination'
import { useEditorStore } from 'src/stores/editor-store'

// A4 preview toolbar above the sheet: preview toggle, occlusion/opacity popovers, layer studio, fit badge, print.
// Global styles (web-renderer.global.scss) cover it; it reads and writes the editor store directly.
export default defineComponent({
  name: 'A4PreviewToolbar',
  props: {
    a4PageOverflowPx: { type: Number, required: true },
    a4Pagination: { type: Object as PropType<A4PaginationMetrics>, required: false, default: undefined },
    printA4Sheet: { type: Function as PropType<() => void | Promise<void>>, required: true },
    openLayerStudio: { type: Function as PropType<() => void>, required: true },
  },
  setup() {
    return { editorStore: useEditorStore() }
  },
})
</script>
