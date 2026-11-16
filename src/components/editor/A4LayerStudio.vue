<template>
  <q-expansion-item
    id="a4-layer-studio-expansion"
    data-editor-section="a4Layers"
    expand-separator
    icon="layers"
    label="A4 Composition & Page Layer Studio"
    caption="Photoshop-style layer stack: Z-index ordering, blend modes, opacity, offsets, and Homebrew watercolor masks"
    header-class="text-weight-bold text-purple-3"
    default-opened
  >
    <q-card class="q-pa-sm bg-grey-10 text-white rounded-borders">
      <!-- Top Action Bar: Add Preset & Custom Layer Buttons -->
      <div class="row items-center justify-between q-mb-sm q-col-gutter-xs">
        <div class="col-12 col-sm-auto text-subtitle2 text-weight-bolder flex items-center text-purple-3">
          <q-icon name="photo_filter" class="q-mr-xs" size="20px" />
          Composition Layers
          <q-badge color="purple-7" class="q-ml-sm text-caption text-weight-bold">
            {{ displayLayers.length }} Layers
          </q-badge>
        </div>

        <!-- Quick 1-Click Homebrew Preset Adders -->
        <div class="col-12 col-sm-auto row items-center q-gutter-x-xs">
          <q-btn-dropdown
            v-help="'Ready-made parchment backgrounds and masks.'"
            dense
            outline
            color="amber-4"
            icon="auto_awesome" label="Homebrew Presets"
            no-caps
            size="sm"
          >
            <q-list dense dark class="bg-grey-9 text-white">
              <q-item v-close-popup clickable @click="addPreset('yellowed_parchment')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="history_edu" color="amber-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Yellowed Stained Parchment</q-item-label>
                  <q-item-label caption class="text-grey-4">Authentic aged paper texture</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-close-popup clickable @click="addPreset('phb_parchment')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="menu_book" color="amber-5" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Classic PHB Parchment</q-item-label>
                  <q-item-label caption class="text-grey-4">Official 5e handbook parchment</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-close-popup clickable @click="addPreset('silvered_parchment')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="auto_stories" color="grey-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Silvered Parchment</q-item-label>
                  <q-item-label caption class="text-grey-4">Cool grey vintage tone</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator dark />

              <q-item v-close-popup clickable @click="addPreset('watercolor_splash')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="brush" color="purple-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Watercolor Splash Vignette</q-item-label>
                  <q-item-label caption class="text-grey-4">Homebrewery organic watercolor mask</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-close-popup clickable @click="addPreset('watercolor_bottom')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="waves" color="cyan-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Watercolor Bottom Border</q-item-label>
                  <q-item-label caption class="text-grey-4">Edge splatter fade at page foot</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator dark />

              <q-item v-close-popup clickable @click="addPreset('header_overlay')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="border_top" color="amber-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Running Header Overlay</q-item-label>
                  <q-item-label caption class="text-grey-4">Top chapter / source running header</q-item-label>
                </q-item-section>
              </q-item>

              <q-item v-close-popup clickable @click="addPreset('footer_overlay')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="border_bottom" color="amber-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Running Footer Overlay</q-item-label>
                  <q-item-label caption class="text-grey-4">Bottom book title / page number footer</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn
            v-help="'Add an image or colour layer to the A4 page.'"
            dense
            color="purple-7"
            icon="add" label="Add Layer"
            no-caps
            size="sm"
            @click="showAddLayerForm = !showAddLayerForm"
          />
        </div>
      </div>

      <!-- Expandable Add Custom Layer Form (Direct inline, no popups) -->
      <q-slide-transition>
        <div v-show="showAddLayerForm" class="q-mb-md q-pa-sm bg-grey-9 rounded-borders" style="border: 1px dashed #a855f7;">
          <div class="text-caption text-weight-bold text-purple-2 q-mb-xs flex items-center justify-between">
            <span>Add Custom Composition Layer</span>
            <q-btn flat round dense size="xs" icon="close" @click="showAddLayerForm = false" />
          </div>

          <div class="row q-col-gutter-xs items-center">
            <div class="col-12 col-sm-3">
              <catalog-select
                v-model="newLayerType"
                v-help="'Place the layer behind the stat block texture stack or as a foreground overlay.'"
                :entries="layerTypeOptions"
                preserve-order
                :searchable="false"
                dark
                label="Target"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model="newLayerName"
                v-help="'Name shown in the layer list.'"
                dense
                outlined
                dark label="Layer Name"
                placeholder="e.g. Stained Parchment"
              />
            </div>
            <div class="col-12 col-sm-5">
              <q-file
                v-model="newLayerFile"
                v-help="'Upload a background texture from this device.'" label="Upload local texture (PNG/JPG)"
                dense
                outlined
                dark
                accept="image/*"
                @update:model-value="onNewLayerFileSelected"
              >
                <template #prepend>
                  <q-icon name="upload_file" />
                </template>
              </q-file>
            </div>
            <div class="col-12 col-sm-6 q-mt-xs">
              <q-input
                v-model="newLayerUrl"
                v-help="'Web address or embedded image for this layer.'"
                dense
                outlined
                dark label="Or Image URL / Data URI"
                placeholder="/homebrew/backgrounds/Yellowed parchment background.jpg"
              />
            </div>
            <div class="col-6 col-sm-3 q-mt-xs">
              <catalog-select
                v-model="newLayerBlend"
                v-help="'How this layer mixes with the layers below.'"
                :entries="blendModeOptions"
                preserve-order
                dark
                label="Blend Mode"
              />
            </div>
            <div class="col-6 col-sm-3 q-mt-xs text-right">
              <q-btn
                v-help="'Create the layer with these settings.'"
                color="purple-7"
                icon="check" label="Create Layer"
                no-caps
                class="full-width"
                :disable="!newLayerUrl && !newLayerFile"
                @click="addCustomLayer"
              />
            </div>
          </div>
        </div>
      </q-slide-transition>

      <!-- Photoshop-Style Unified Layer Stack -->
      <a4-layer-list />
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import A4LayerList from './a4-layers/A4LayerList.vue'
import CatalogSelect from '../kit/CatalogSelect.vue'
import { useA4LayerStudioState, provideA4LayerStudioState } from './a4-layers/useA4LayerStudioState'

export default defineComponent({
  name: 'A4LayerStudio',
  components: { A4LayerList, CatalogSelect },
  setup() {
    // The parent template still binds its own toolbar to the shared state.
    return provideA4LayerStudioState(useA4LayerStudioState())
  },
})
</script>

