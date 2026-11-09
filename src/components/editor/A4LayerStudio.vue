<template>
  <q-expansion-item
    id="a4-layer-studio-expansion"
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
            dense
            outline
            color="amber-4"
            icon="auto_awesome"
            label="Homebrew Presets" v-help="'Ready-made parchment backgrounds and masks.'"
            no-caps
            size="sm"
          >
            <q-list dense dark class="bg-grey-9 text-white">
              <q-item clickable v-close-popup @click="addPreset('yellowed_parchment')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="history_edu" color="amber-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Yellowed Stained Parchment</q-item-label>
                  <q-item-label caption class="text-grey-4">Authentic aged paper texture</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="addPreset('phb_parchment')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="menu_book" color="amber-5" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Classic PHB Parchment</q-item-label>
                  <q-item-label caption class="text-grey-4">Official 5e handbook parchment</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="addPreset('silvered_parchment')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="auto_stories" color="grey-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Silvered Parchment</q-item-label>
                  <q-item-label caption class="text-grey-4">Cool grey vintage tone</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator dark />

              <q-item clickable v-close-popup @click="addPreset('watercolor_splash')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="brush" color="purple-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Watercolor Splash Vignette</q-item-label>
                  <q-item-label caption class="text-grey-4">Homebrewery organic watercolor mask</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="addPreset('watercolor_bottom')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="waves" color="cyan-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Watercolor Bottom Border</q-item-label>
                  <q-item-label caption class="text-grey-4">Edge splatter fade at page foot</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator dark />

              <q-item clickable v-close-popup @click="addPreset('header_overlay')">
                <q-item-section avatar style="min-width: 24px;">
                  <q-icon name="border_top" color="amber-4" size="xs" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Running Header Overlay</q-item-label>
                  <q-item-label caption class="text-grey-4">Top chapter / source running header</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-close-popup @click="addPreset('footer_overlay')">
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
            dense
            color="purple-7"
            icon="add"
            label="Add Layer" v-help="'Add an image or colour layer to the A4 page.'"
            no-caps
            size="sm"
            @click="showAddLayerForm = !showAddLayerForm"
          />
        </div>
      </div>

      <!-- Expandable Add Custom Layer Form (Direct inline, no popups) -->
      <q-slide-transition>
        <div v-show="showAddLayerForm" class="q-mb-md q-pa-sm bg-grey-9 rounded-borders" style="border: 1px dashed #a855f7;">
          <div class="text-caption text-weight-bold text-purple-3 q-mb-xs flex items-center justify-between">
            <span>Add Custom Composition Layer</span>
            <q-btn flat round dense size="xs" icon="close" @click="showAddLayerForm = false" />
          </div>

          <div class="row q-col-gutter-xs items-center">
            <div class="col-12 col-sm-3">
              <q-select
                v-model="newLayerType"
                :options="[
                  { label: 'Background Texture', value: 'background' },
                  { label: 'Foreground Frame / Vignette', value: 'foreground' }
                ]"
                emit-value
                map-options
                dense
                outlined
                dark
                label="Target"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input
                v-model="newLayerName"
                dense
                outlined
                dark
                label="Layer Name" v-help="'Name shown in the layer list.'"
                placeholder="e.g. Stained Parchment"
              />
            </div>
            <div class="col-12 col-sm-5">
              <q-file
                v-model="newLayerFile"
                label="Upload local texture (PNG/JPG)" v-help="'Upload a background texture from this device.'"
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
                dense
                outlined
                dark
                label="Or Image URL / Data URI" v-help="'Web address or embedded image for this layer.'"
                placeholder="/homebrew/backgrounds/Yellowed parchment background.jpg"
              />
            </div>
            <div class="col-6 col-sm-3 q-mt-xs">
              <q-select
                v-model="newLayerBlend"
                :options="blendModeOptions"
                emit-value
                map-options
                dense
                outlined
                dark
                label="Blend Mode" v-help="'How this layer mixes with the layers below.'"
              />
            </div>
            <div class="col-6 col-sm-3 q-mt-xs text-right">
              <q-btn
                color="purple-7"
                icon="check"
                label="Create Layer" v-help="'Create the layer with these settings.'"
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
      <div class="q-gutter-y-xs">
        <div class="text-caption text-grey-5 flex items-center justify-between q-px-xs">
          <span>▲ Top of Composition (Higher Z-Index)</span>
          <span>▼ Bottom of Composition (Lower Z-Index)</span>
        </div>

        <q-card
          v-for="(layer, index) in displayLayers"
          :key="layer.id"
          class="q-pa-xs rounded-borders"
          :class="{
            'bg-amber-10': layer.type === 'statblock',
            'bg-cyan-10': layer.type === 'portrait',
            'bg-grey-9': layer.type !== 'statblock' && layer.type !== 'portrait'
          }"
          :style="{
            borderLeft: layer.type === 'statblock' ? '4px solid #f59e0b' : (layer.type === 'portrait' ? '4px solid #06b6d4' : (layer.type === 'foreground' ? '4px solid #a855f7' : '4px solid #3b82f6')),
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }"
        >
          <!-- Layer Main Row: Drag Order Buttons, Thumbnail, Name, Blend, Opacity, Visibility, Delete -->
          <div class="row items-center justify-between no-wrap q-col-gutter-xs">
            <!-- Left: Order Shift Buttons & Icon/Thumbnail -->
            <div class="col-auto row items-center q-gutter-x-xs no-wrap">
              <div class="column q-gutter-y-none">
                <q-btn
                  flat
                  dense
                  round
                  size="xs"
                  icon="keyboard_arrow_up"
                  color="grey-4"
                  :disable="index === 0"
                  @click="shiftLayer(index, -1)"
                >
                  <q-tooltip>Bring Forward (Higher Z-Index)</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  dense
                  round
                  size="xs"
                  icon="keyboard_arrow_down"
                  color="grey-4"
                  :disable="index === displayLayers.length - 1"
                  @click="shiftLayer(index, 1)"
                >
                  <q-tooltip>Send Backward (Lower Z-Index)</q-tooltip>
                </q-btn>
              </div>

              <!-- Thumbnail or Layer Type Icon -->
              <div
                class="rounded-borders flex items-center justify-center overflow-hidden"
                style="width: 38px; height: 38px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.15);"
              >
                <img
                  v-if="layer.url"
                  :src="appAsset(layer.url)"
                  style="width: 100%; height: 100%; object-fit: cover;"
                />
                <q-icon
                  v-else-if="layer.type === 'statblock'"
                  name="article"
                  color="amber-4"
                  size="22px"
                />
                <q-icon
                  v-else-if="layer.type === 'portrait'"
                  name="photo"
                  color="cyan-4"
                  size="22px"
                />
                <q-icon
                  v-else
                  name="image"
                  color="grey-4"
                  size="22px"
                />
              </div>
            </div>

            <!-- Middle: Name & Status Badges -->
            <div class="col q-px-sm">
              <div class="row items-center q-gutter-x-xs">
                <span class="text-body2 text-weight-bolder">
                  {{ layer.name }}
                </span>
                <q-badge
                  v-if="layer.type === 'statblock'"
                  color="amber-9"
                  class="text-weight-bold text-caption"
                >
                  Statblock (Non-Removable)
                </q-badge>
                <q-badge
                  v-else-if="layer.type === 'portrait'"
                  color="cyan-9"
                  class="text-weight-bold text-caption"
                >
                  Portrait Artwork
                </q-badge>
                <q-badge
                  v-else
                  :color="layer.type === 'background' ? 'blue-8' : 'purple-8'"
                  class="text-weight-bold text-caption"
                >
                  {{ layer.type === 'background' ? 'Background Texture' : 'Foreground Frame' }}
                </q-badge>
              </div>

              <div class="row items-center q-gutter-x-sm text-caption text-grey-4 q-mt-xs">
                <span>Blend: <b>{{ layer.blendMode || 'normal' }}</b></span>
                <span>Opacity: <b>{{ layer.opacity ?? 100 }}%</b></span>
                <span v-if="layer.type === 'statblock'">Scale: <b>{{ layer.scaleX ?? 100 }}% × {{ layer.scaleY ?? 100 }}%</b></span>
                <span v-else>Scale: <b>{{ layer.scale ?? 100 }}%</b></span>
                <span v-if="layer.maskUrl" class="text-cyan-3 flex items-center">
                  <q-icon name="brush" size="14px" class="q-mr-xs" />
                  Masked
                </span>
              </div>
            </div>

            <!-- Right: Quick Toggles (Settings Expand, Visibility, Delete) -->
            <div class="col-auto row items-center q-gutter-x-xs no-wrap">
              <q-btn
                flat
                round
                dense
                size="sm"
                :icon="expandedLayerId === layer.id ? 'expand_less' : 'tune'"
                color="grey-3"
                @click="expandedLayerId = expandedLayerId === layer.id ? null : layer.id"
              >
                <q-tooltip>Configure Layer Transforms &amp; Masks</q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                size="sm"
                :icon="layer.visible ? 'visibility' : 'visibility_off'"
                :color="layer.visible ? 'positive' : 'grey-6'"
                @click="toggleLayerVisibility(layer)"
              >
                <q-tooltip>{{ layer.visible ? 'Hide Layer' : 'Show Layer' }}</q-tooltip>
              </q-btn>

              <q-btn
                v-if="!layer.locked && layer.type !== 'statblock'"
                flat
                round
                dense
                size="sm"
                icon="delete"
                color="negative"
                @click="removeLayer(index)"
              >
                <q-tooltip>Delete Layer</q-tooltip>
              </q-btn>
              <q-icon
                v-else
                name="lock"
                color="amber-4"
                size="xs"
                class="q-px-xs"
              >
                <q-tooltip>Permanent Core Layer</q-tooltip>
              </q-icon>
            </div>
          </div>

          <!-- Expanded Layer Parameters Drawer (Transforms, Blend Modes, Watercolor Masks) -->
          <q-slide-transition>
            <div v-show="expandedLayerId === layer.id" class="q-mt-xs q-pt-xs" style="border-top: 1px solid rgba(255, 255, 255, 0.08);">
              <!-- 1. STATBLOCK LAYER CONTROLS (Dual-Axis Anamorphic Scaling & Background Opacity & Position Gizmo) -->
              <template v-if="layer.type === 'statblock'">
                <div class="row q-col-gutter-xs items-center">
                  <div class="col-12 col-sm-3">
                    <q-select
                      v-model="layer.blendMode"
                      :options="blendModeOptions"
                      emit-value
                      map-options
                      dense
                      outlined
                      dark
                      label="Blend Mode" v-help="'How this layer mixes with the layers below.'"
                    />
                  </div>
                  <div class="col-12 col-sm-9">
                    <div class="text-caption text-weight-bold flex items-center justify-between text-amber-3">
                      <span>Statblock Background Opacity</span>
                      <span>{{ editorStore.a4StatblockOpacity ?? 100 }}%</span>
                    </div>
                    <div class="row items-center q-col-gutter-xs">
                      <div class="col">
                        <q-slider
                          v-model="editorStore.a4StatblockOpacity"
                          :min="0"
                          :max="100"
                          :step="1"
                          color="amber-4"
                          dense
                        />
                      </div>
                      <div class="col-auto">
                        <q-input
                          v-model.number="editorStore.a4StatblockOpacity"
                          type="number"
                          min="0"
                          max="100"
                          dense
                          outlined
                          dark
                          label="Opacity (%)" v-help="'How see-through the layer is.'"
                          style="width: 85px;"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Consolidated Post-Crop Position Gizmo -->
                  <div class="col-12 col-sm-4 q-py-xs">
                    <radial-offset-controller
                      v-model:x="editorStore.a4StatblockOffsetX"
                      v-model:y="editorStore.a4StatblockOffsetY"
                      :min="-300"
                      :max="300"
                      :step="2"
                      label="Statblock Position Gizmo" v-help="'Drag to place the stat block on the page.'"
                      unit="px"
                      color="amber"
                      icon="open_with"
                    />
                  </div>

                  <!-- Dual-Axis Anamorphic Scaling with Drag Sliders & Manual Inputs -->
                  <div class="col-12 col-sm-8">
                    <div class="row q-col-gutter-xs">
                      <div class="col-12 col-sm-6">
                        <div class="text-caption text-amber-3 flex justify-between">
                          <span>Scale X (Width)</span>
                          <span>{{ editorStore.a4StatblockScaleX ?? 100 }}%</span>
                        </div>
                        <div class="row items-center q-col-gutter-xs">
                          <div class="col">
                            <q-slider
                              v-model="editorStore.a4StatblockScaleX"
                              :min="50"
                              :max="200"
                              :step="1"
                              color="amber-5"
                              dense
                            />
                          </div>
                          <div class="col-auto">
                            <q-input
                              v-model.number="editorStore.a4StatblockScaleX"
                              type="number"
                              min="50"
                              max="200"
                              dense
                              outlined
                              dark
                              label="Width %" v-help="'Layer width as a share of the page.'"
                              style="width: 80px;"
                            />
                          </div>
                        </div>
                      </div>

                      <div class="col-12 col-sm-6">
                        <div class="text-caption text-amber-3 flex justify-between">
                          <span>Scale Y (Height)</span>
                          <span>{{ editorStore.a4StatblockScaleY ?? 100 }}%</span>
                        </div>
                        <div class="row items-center q-col-gutter-xs">
                          <div class="col">
                            <q-slider
                              v-model="editorStore.a4StatblockScaleY"
                              :min="50"
                              :max="200"
                              :step="1"
                              color="amber-5"
                              dense
                            />
                          </div>
                          <div class="col-auto">
                            <q-input
                              v-model.number="editorStore.a4StatblockScaleY"
                              type="number"
                              min="50"
                              max="200"
                              dense
                              outlined
                              dark
                              label="Height %" v-help="'Layer height as a share of the page.'"
                              style="width: 80px;"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 2. PORTRAIT ARTWORK LAYER CONTROLS (Radar Controllers, Dual-Knob Cropping, Uniform Scale, File Upload) -->
              <template v-else-if="layer.type === 'portrait'">
                <div class="row q-col-gutter-xs items-center">
                  <!-- Direct Creature Portrait Image File & URL Controls -->
                  <div class="col-12 col-sm-6 q-mb-xs">
                    <q-file
                      v-model="portraitFileInput"
                      label="Upload Creature Portrait Image" v-help="'Upload a portrait from this device; it stays in the browser.'"
                      dense
                      outlined
                      dark
                      accept="image/*"
                      @update:model-value="onPortraitFileSelected"
                    >
                      <template #prepend>
                        <q-icon name="photo_camera" color="cyan-3" />
                      </template>
                    </q-file>
                  </div>
                  <div class="col-12 col-sm-6 q-mb-xs">
                    <q-input
                      v-model="portraitUrlModel"
                      label="Or Portrait Image URL / Data URI"
                      dense
                      outlined
                      dark
                      clearable
                      @update:model-value="onPortraitUrlChanged"
                    />
                  </div>

                  <div class="col-6 col-sm-4">
                    <q-select
                      v-model="portraitPositionModel"
                      :options="[
                        { label: 'Right Side', value: 'right' },
                        { label: 'Left Side', value: 'left' },
                        { label: 'Top Header', value: 'top' },
                        { label: 'Bottom Foot', value: 'bottom' },
                        { label: 'Hidden', value: 'none' }
                      ]"
                      emit-value
                      map-options
                      dense
                      outlined
                      dark
                      label="Layout Position" v-help="'Where the portrait sits relative to the stat block.'"
                    />
                  </div>
                  <div class="col-6 col-sm-4">
                    <q-input
                      v-model.number="portraitWidthModel"
                      type="number"
                      label="Base Width (px)" v-help="'Portrait width before scaling.'"
                      dense
                      outlined
                      dark
                      min="80"
                      max="600"
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <q-input
                      v-model="portraitCaptionModel"
                      label="Caption / Artist Credit" v-help="'Credit shown under the image.'"
                      dense
                      outlined
                      dark
                    />
                  </div>

                  <div class="col-12 col-sm-4">
                    <q-select
                      v-model="layer.blendMode"
                      :options="blendModeOptions"
                      emit-value
                      map-options
                      dense
                      outlined
                      dark
                      label="Blend Mode" v-help="'How this layer mixes with the layers below.'"
                    />
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="text-caption text-weight-bold flex items-center justify-between text-cyan-3">
                      <span>Statblock Occlusion / Overlap</span>
                      <span>{{ editorStore.a4PictureOcclusion || 0 }}%</span>
                    </div>
                    <div class="row items-center q-col-gutter-xs">
                      <div class="col">
                        <q-slider
                          v-model="editorStore.a4PictureOcclusion"
                          :min="0"
                          :max="100"
                          :step="1"
                          color="cyan-4"
                          dense
                        />
                      </div>
                      <div class="col-auto">
                        <q-input
                          v-model.number="editorStore.a4PictureOcclusion"
                          type="number"
                          min="0"
                          max="100"
                          dense
                          outlined
                          dark
                          label="%"
                          style="width: 70px;"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="text-caption text-cyan-3 flex justify-between">
                      <span>Uniform Scale</span>
                      <span>{{ editorStore.a4PortraitScale ?? 100 }}%</span>
                    </div>
                    <div class="row items-center q-col-gutter-xs">
                      <div class="col">
                        <q-slider
                          v-model="editorStore.a4PortraitScale"
                          :min="50"
                          :max="200"
                          :step="1"
                          color="cyan-5"
                          dense
                        />
                      </div>
                      <div class="col-auto">
                        <q-input
                          v-model.number="editorStore.a4PortraitScale"
                          type="number"
                          min="50"
                          max="200"
                          dense
                          outlined
                          dark
                          label="%"
                          style="width: 70px;"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- 2 Radial Offset Controllers: Pre-Crop Focal Center & Post-Crop Layer Position -->
                  <div class="col-12 col-sm-6 q-py-xs">
                    <radial-offset-controller
                      v-model:x="editorStore.a4PortraitCropCenterX"
                      v-model:y="editorStore.a4PortraitCropCenterY"
                      :min="-100"
                      :max="100"
                      :step="1"
                      label="Pre-Crop Focal Center Radar"
                      unit="%"
                      color="cyan"
                      icon="filter_center_focus"
                    />
                  </div>
                  <div class="col-12 col-sm-6 q-py-xs">
                    <radial-offset-controller
                      v-model:x="editorStore.a4PortraitOffsetX"
                      v-model:y="editorStore.a4PortraitOffsetY"
                      v-model:crop-x="editorStore.a4PortraitCropX"
                      v-model:crop-y="editorStore.a4PortraitCropY"
                      :min="-300"
                      :max="300"
                      :step="2"
                      label="Post-Crop Position &amp; Parallel Crop"
                      unit="px"
                      color="cyan"
                      icon="open_with"
                    />
                  </div>

                  <!-- Grayscale as Alpha Luminance Mask for Portrait -->
                  <div class="col-12 row items-center q-gutter-x-md q-my-xs">
                    <q-checkbox
                      v-model="layer.grayscaleAsAlpha"
                      label="Use Grayscale as Alpha (Luminance Mask)" v-help="'Use the image brightness as transparency.'"
                      dark
                      dense
                      color="cyan-4"
                      class="text-caption text-weight-bold"
                    >
                      <q-tooltip>Uses image grayscale luminance as alpha channel even when imported without alpha transparency</q-tooltip>
                    </q-checkbox>
                    <q-checkbox
                      v-if="layer.grayscaleAsAlpha"
                      v-model="layer.grayscaleInvert"
                      label="Invert Luminance" v-help="'Swap light and dark in the mask.'"
                      dark
                      dense
                      color="cyan-4"
                      class="text-caption"
                    />
                  </div>

                  <!-- Interactive Gradient Overlay & Falloff Curve for Portrait -->
                  <div class="col-12 q-my-xs">
                    <gradient-overlay-controller
                      :model-value="layer.gradientOverlay"
                      :blend-mode-options="blendModeOptions"
                      @update:model-value="(val) => layer.gradientOverlay = val"
                    />
                  </div>

                  <!-- Watercolor Masking for Artwork -->
                  <div class="col-12">
                    <q-select
                      v-model="layer.maskUrl"
                      :options="watercolorMaskOptions"
                      emit-value
                      map-options
                      clearable
                      dense
                      outlined
                      dark
                      label="Watercolor Mask (Homebrewery Splatter Blend)"
                    >
                      <template #prepend>
                        <q-icon name="brush" color="cyan-4" />
                      </template>
                    </q-select>
                  </div>
                </div>
              </template>

              <!-- 3. CUSTOM BACKGROUND / FOREGROUND TEXTURE & FRAME LAYER CONTROLS -->
              <template v-else>
                <div class="row q-col-gutter-xs items-center">
                  <div class="col-6 col-sm-4">
                    <q-select
                      v-model="layer.blendMode"
                      :options="blendModeOptions"
                      emit-value
                      map-options
                      dense
                      outlined
                      dark
                      label="Blend Mode" v-help="'How this layer mixes with the layers below.'"
                    />
                  </div>
                  <div class="col-6 col-sm-4">
                    <div class="text-caption text-grey-4 flex justify-between">
                      <span>Opacity</span>
                      <span>{{ layer.opacity }}%</span>
                    </div>
                    <div class="row items-center q-col-gutter-xs">
                      <div class="col">
                        <q-slider
                          v-model="layer.opacity"
                          :min="0"
                          :max="100"
                          :step="1"
                          color="purple-4"
                          dense
                        />
                      </div>
                      <div class="col-auto">
                        <q-input
                          v-model.number="layer.opacity"
                          type="number"
                          min="0"
                          max="100"
                          dense
                          outlined
                          dark
                          label="%"
                          style="width: 70px;"
                        />
                      </div>
                    </div>
                  </div>
                  <div class="col-12 col-sm-4">
                    <div class="text-caption text-purple-3 flex justify-between">
                      <span>Uniform Scale</span>
                      <span>{{ layer.scale ?? 100 }}%</span>
                    </div>
                    <div class="row items-center q-col-gutter-xs">
                      <div class="col">
                        <q-slider
                          v-model="layer.scale"
                          :min="50"
                          :max="200"
                          :step="1"
                          color="purple-4"
                          dense
                        />
                      </div>
                      <div class="col-auto">
                        <q-input
                          v-model.number="layer.scale"
                          type="number"
                          min="50"
                          max="200"
                          dense
                          outlined
                          dark
                          label="%"
                          style="width: 70px;"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- 2 Radial Offset Controllers for Custom Layer -->
                  <div class="col-12 col-sm-6 q-py-xs">
                    <radial-offset-controller
                      :x="layer.cropCenterX || 0"
                      :y="layer.cropCenterY || 0"
                      :min="-100"
                      :max="100"
                      :step="1"
                      label="Pre-Crop Focal Center Radar"
                      unit="%"
                      :color="layer.type === 'foreground' ? 'purple' : 'blue'"
                      icon="filter_center_focus"
                      @update:x="(val: number) => layer.cropCenterX = val"
                      @update:y="(val: number) => layer.cropCenterY = val"
                    />
                  </div>
                  <div class="col-12 col-sm-6 q-py-xs">
                    <radial-offset-controller
                      :x="layer.offsetX || 0"
                      :y="layer.offsetY || 0"
                      :crop-x="layer.cropX || { min: 0, max: 100 }"
                      :crop-y="layer.cropY || { min: 0, max: 100 }"
                      :min="-300"
                      :max="300"
                      :step="2"
                      label="Post-Crop Position &amp; Parallel Crop"
                      unit="px"
                      :color="layer.type === 'foreground' ? 'purple' : 'blue'"
                      icon="open_with"
                      @update:x="(val: number) => layer.offsetX = val"
                      @update:y="(val: number) => layer.offsetY = val"
                      @update:crop-x="(val: { min: number; max: number }) => layer.cropX = val"
                      @update:crop-y="(val: { min: number; max: number }) => layer.cropY = val"
                    />
                  </div>

                  <div class="col-12 col-sm-12">
                    <q-select
                      v-model="layer.maskUrl"
                      :options="watercolorMaskOptions"
                      emit-value
                      map-options
                      clearable
                      dense
                      outlined
                      dark
                      label="Watercolor Edge Mask" v-help="'Fade the layer edges like watercolour.'"
                    >
                      <template #prepend>
                        <q-icon name="brush" color="purple-3" />
                      </template>
                    </q-select>
                  </div>

                  <!-- Grayscale as Alpha Luminance Mask -->
                  <div class="col-12 row items-center q-gutter-x-md q-my-xs">
                    <q-checkbox
                      v-model="layer.grayscaleAsAlpha"
                      label="Use Grayscale as Alpha (Luminance Mask)" v-help="'Use the image brightness as transparency.'"
                      dark
                      dense
                      color="purple-4"
                      class="text-caption text-weight-bold"
                    >
                      <q-tooltip>Treats texture brightness/luminance as transparency mask (black=transparent, white=opaque)</q-tooltip>
                    </q-checkbox>
                    <q-checkbox
                      v-if="layer.grayscaleAsAlpha"
                      v-model="layer.grayscaleInvert"
                      label="Invert Luminance" v-help="'Swap light and dark in the mask.'"
                      dark
                      dense
                      color="purple-4"
                      class="text-caption"
                    >
                      <q-tooltip>Inverts white and black transparency</q-tooltip>
                    </q-checkbox>
                  </div>

                  <!-- Interactive Gradient Overlays Section with Color Keys, Falloff Curve Overlay & Blend Modes -->
                  <div class="col-12 q-mt-xs">
                    <gradient-overlay-controller
                      :model-value="layer.gradientOverlay"
                      :blend-mode-options="blendModeOptions"
                      @update:model-value="(val) => layer.gradientOverlay = val"
                    />
                  </div>

                  <!-- Custom Layer Text Overlay (Headers, Footers, Page Notes) -->
                  <div class="col-12 q-mt-xs q-pa-xs rounded-borders bg-grey-10" style="border: 1px solid rgba(255, 255, 255, 0.1);">
                    <div class="row items-center justify-between no-wrap">
                      <q-toggle
                        v-model="layer.showTextOverlay"
                        label="Enable Layer Text Overlay (Header/Footer)" v-help="'Print text on this layer, such as a header or footer.'"
                        color="amber-7"
                        dense
                        dark
                        class="text-caption text-weight-bold text-amber-3"
                      />
                    </div>
                    <div v-if="layer.showTextOverlay" class="row q-col-gutter-xs items-center q-mt-xs">
                      <div class="col-12 col-sm-6">
                        <q-input
                          v-model="layer.overlayText"
                          label="Overlay Text (Header/Footer/Notes)" v-help="'Text printed on the layer.'"
                          dense
                          outlined
                          dark
                          hide-bottom-space
                        />
                      </div>
                      <div class="col-6 col-sm-3">
                        <q-select
                          v-model="layer.overlayTextAlign"
                          :options="['left', 'center', 'right']"
                          label="Text Align" v-help="'Left, centre or right text alignment.'"
                          dense
                          outlined
                          dark
                          options-dense
                          hide-bottom-space
                        />
                      </div>
                      <div class="col-6 col-sm-3">
                        <q-input
                          v-model="layer.overlayTextColor"
                          label="Color"
                          dense
                          outlined
                          dark
                          hide-bottom-space
                        >
                          <template #append>
                            <q-icon name="colorize" class="cursor-pointer">
                              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="layer.overlayTextColor" />
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                      </div>
                      <div class="col-4 col-sm-4 q-mt-xs">
                        <q-input
                          v-model.number="layer.overlayTextOffsetX"
                          type="number"
                          label="Offset X (px)" v-help="'Move the layer left or right.'"
                          dense
                          outlined
                          dark
                          hide-bottom-space
                        />
                      </div>
                      <div class="col-4 col-sm-4 q-mt-xs">
                        <q-input
                          v-model.number="layer.overlayTextOffsetY"
                          type="number"
                          label="Offset Y (px)" v-help="'Move the layer up or down.'"
                          dense
                          outlined
                          dark
                          hide-bottom-space
                        />
                      </div>
                      <div class="col-4 col-sm-4 q-mt-xs">
                        <q-input
                          v-model.number="layer.overlayTextFontSize"
                          type="number"
                          label="Font Size (pt)" v-help="'Text size in points.'"
                          dense
                          outlined
                          dark
                          hide-bottom-space
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </q-slide-transition>
        </q-card>
      </div>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useEditorStore, A4CompositionLayer } from 'src/stores/editor-store'
import { useMonsterStore } from 'src/stores/monster-store'
import { appAsset } from 'src/core/domain/asset-url'
import RadialOffsetController from './widgets/RadialOffsetController.vue'
import GradientOverlayController from './widgets/GradientOverlayController.vue'

export default defineComponent({
  name: 'A4LayerStudio',
  components: {
    RadialOffsetController,
    GradientOverlayController,
  },
  props: {
    inline: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const a4MeasuredPx = computed(() => editorStore.a4PageMeasuredHeight || 0)
    const a4TargetPx = computed(() => editorStore.a4Orientation === 'landscape' ? 794 : 1123)
    const a4OverflowPx = computed(() => Math.max(0, a4MeasuredPx.value - a4TargetPx.value))
    const a4CapacityRatio = computed(() => a4TargetPx.value > 0 ? (a4MeasuredPx.value / a4TargetPx.value) : 0)
    const a4StatusLabel = computed(() => {
      if (a4OverflowPx.value > 0) return `Overflow (+${a4OverflowPx.value}px)`
      if (a4CapacityRatio.value > 0.9) return `Near Capacity (${Math.round((1 - a4CapacityRatio.value) * a4TargetPx.value)}px left)`
      return 'Optimal Capacity'
    })

    const toggleOrientation = () => {
      editorStore.a4Orientation = editorStore.a4Orientation === 'portrait' ? 'landscape' : 'portrait'
    }

    const toggleColumns = () => {
      editorStore.statBlockColumns = editorStore.statBlockColumns === 2 ? 1 : 2
    }

    const resetA4Layout = () => {
      editorStore.a4Orientation = 'portrait'
      editorStore.statBlockColumns = 1
      editorStore.a4CompactDensity = false
      editorStore.a4StatblockScaleX = 100
      editorStore.a4StatblockScaleY = 100
      editorStore.a4StatblockOffsetX = 0
      editorStore.a4StatblockOffsetY = 0
      editorStore.a4PortraitOffsetX = 0
      editorStore.a4PortraitOffsetY = 0
      editorStore.a4PortraitScale = 100
    }

    const editorStore = useEditorStore()
    const monsterStore = useMonsterStore()

    const showAddLayerForm = ref(false)
    const expandedLayerId = ref<string | null>(null)

    const newLayerType = ref<'background' | 'foreground'>('background')
    const newLayerName = ref('')
    const newLayerUrl = ref('')
    const newLayerFile = ref<File | null>(null)
    const newLayerBlend = ref<A4CompositionLayer['blendMode']>('normal')

    const blendModeOptions = [
      { label: 'Normal', value: 'normal' },
      { label: 'Multiply (Darken & Texture)', value: 'multiply' },
      { label: 'Screen (Lighten & Glow)', value: 'screen' },
      { label: 'Overlay (High Contrast)', value: 'overlay' },
      { label: 'Soft Light (Subtle Tint)', value: 'soft-light' },
      { label: 'Darken', value: 'darken' },
      { label: 'Lighten', value: 'lighten' },
      { label: 'Color Dodge', value: 'color-dodge' },
      { label: 'Color Burn', value: 'color-burn' },
      { label: 'Difference', value: 'difference' },
    ]

    const watercolorMaskOptions = [
      { label: 'None (No Mask)', value: '' },
      { label: 'Watercolor Splash Center', value: '/homebrew/masks/watercolor_splash_center.png' },
      { label: 'Watercolor Bottom Edge Splatter', value: '/homebrew/masks/watercolor_bottom_01.png' },
      { label: 'Watercolor Top Edge Splatter', value: '/homebrew/masks/watercolor_top_01.png' },
      { label: 'Watercolor Left Edge Splatter', value: '/homebrew/masks/watercolor_left_01.png' },
      { label: 'Watercolor Right Edge Splatter', value: '/homebrew/masks/watercolor_right_01.png' },
    ]

    // Ensure the permanent Statblock layer and Portrait layer are always in the unified stack
    const ensureCoreLayers = () => {
      if (!editorStore.a4Layers) {
        editorStore.a4Layers = []
      }

      // 1. Permanent Statblock Layer
      let statblockLayer = editorStore.a4Layers.find(l => l.id === 'statblock_layer' || l.type === 'statblock')
      if (!statblockLayer) {
        statblockLayer = {
          id: 'statblock_layer',
          type: 'statblock',
          name: 'Monster Statblock (Dual-Axis Anamorphic)',
          opacity: editorStore.a4StatblockOpacity ?? 100,
          blendMode: 'normal',
          visible: true,
          offsetX: editorStore.a4StatblockOffsetX || 0,
          offsetY: editorStore.a4StatblockOffsetY || 0,
          scaleX: editorStore.a4StatblockScaleX ?? 100,
          scaleY: editorStore.a4StatblockScaleY ?? 100,
          locked: true,
        }
        editorStore.a4Layers.push(statblockLayer)
      } else {
        statblockLayer.locked = true
        statblockLayer.type = 'statblock'
      }

      // 2. Creature Portrait Artwork Layer (always present as core layer in composition)
      let portraitLayer = editorStore.a4Layers.find(l => l.id === 'portrait_layer' || l.type === 'portrait')
      if (!portraitLayer) {
        portraitLayer = {
          id: 'portrait_layer',
          type: 'portrait',
          name: 'Creature Portrait Artwork',
          url: monsterStore.portrait?.url || '',
          opacity: 100,
          blendMode: 'normal',
          visible: true,
          offsetX: editorStore.a4PortraitOffsetX || 0,
          offsetY: editorStore.a4PortraitOffsetY || 0,
          scale: editorStore.a4PortraitScale ?? 100,
          occlusion: editorStore.a4PictureOcclusion || 0,
        }
        // Insert behind statblock by default (higher array index = lower z-index)
        const sIdx = editorStore.a4Layers.findIndex(l => l.type === 'statblock')
        const insertAt = sIdx >= 0 ? sIdx + 1 : editorStore.a4Layers.length
        editorStore.a4Layers.splice(insertAt, 0, portraitLayer)
      } else {
        portraitLayer.url = monsterStore.portrait?.url || ''
      }
    }

    const insertBackgroundLayerOnTopOfBackgrounds = (layer: A4CompositionLayer) => {
      const firstBgIdx = editorStore.a4Layers.findIndex(l => l.type === 'background')
      if (firstBgIdx >= 0) {
        editorStore.a4Layers.splice(firstBgIdx, 0, layer)
      } else {
        editorStore.a4Layers.push(layer)
      }
    }

    ensureCoreLayers()

    watch(() => monsterStore.portrait?.url, () => {
      ensureCoreLayers()
    })

    const displayLayers = computed(() => {
      ensureCoreLayers()
      return editorStore.a4Layers || []
    })

    const shiftLayer = (index: number, delta: number) => {
      const targetIndex = index + delta
      if (targetIndex < 0 || targetIndex >= editorStore.a4Layers.length) return
      const item = editorStore.a4Layers.splice(index, 1)[0]
      editorStore.a4Layers.splice(targetIndex, 0, item)
    }

    const toggleLayerVisibility = (layer: A4CompositionLayer) => {
      layer.visible = !layer.visible
    }

    const removeLayer = (index: number) => {
      const layer = editorStore.a4Layers[index]
      if (layer && (layer.locked || layer.type === 'statblock')) {
        return
      }
      editorStore.a4Layers.splice(index, 1)
    }

    const onNewLayerFileSelected = (file: File | null) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          newLayerUrl.value = e.target.result as string
          if (!newLayerName.value) {
            newLayerName.value = file.name.replace(/\.[^/.]+$/, '')
          }
        }
      }
      reader.readAsDataURL(file)
    }

    const addCustomLayer = () => {
      if (!newLayerUrl.value) return
      const id = 'layer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
      const layer: A4CompositionLayer = {
        id,
        type: newLayerType.value,
        name: newLayerName.value || (newLayerType.value === 'background' ? 'Custom Background' : 'Custom Frame'),
        url: newLayerUrl.value,
        opacity: 100,
        blendMode: newLayerBlend.value || 'normal',
        visible: true,
        offsetX: 0,
        offsetY: 0,
        scale: 100,
      }

      if (newLayerType.value === 'background') {
        // Place new background above existing backgrounds so 'normal' blend occludes backgrounds beneath it
        insertBackgroundLayerOnTopOfBackgrounds(layer)
      } else {
        // Place foregrounds towards the top
        editorStore.a4Layers.unshift(layer)
      }

      newLayerUrl.value = ''
      newLayerName.value = ''
      newLayerFile.value = null
      showAddLayerForm.value = false
      expandedLayerId.value = id
    }

    const addPreset = (presetKey: string) => {
      const id = 'layer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
      let layer: A4CompositionLayer

      switch (presetKey) {
        case 'yellowed_parchment':
          layer = {
            id,
            type: 'background',
            name: 'Aged Yellowed Parchment',
            url: '/homebrew/backgrounds/Yellowed parchment background.jpg',
            opacity: 100,
            blendMode: 'multiply',
            visible: true,
            scale: 100,
            offsetX: 0,
            offsetY: 0,
          }
          insertBackgroundLayerOnTopOfBackgrounds(layer)
          break

        case 'phb_parchment':
          layer = {
            id,
            type: 'background',
            name: 'Classic PHB Stained Background',
            url: '/homebrew/backgrounds/PHB-background.png',
            opacity: 100,
            blendMode: 'normal',
            visible: true,
            scale: 100,
            offsetX: 0,
            offsetY: 0,
          }
          insertBackgroundLayerOnTopOfBackgrounds(layer)
          break

        case 'silvered_parchment':
          layer = {
            id,
            type: 'background',
            name: 'Silvered Vintage Parchment',
            url: '/homebrew/backgrounds/Silvered parchment background.jpg',
            opacity: 100,
            blendMode: 'multiply',
            visible: true,
            scale: 100,
            offsetX: 0,
            offsetY: 0,
          }
          insertBackgroundLayerOnTopOfBackgrounds(layer)
          break

        case 'watercolor_splash':
          layer = {
            id,
            type: 'foreground',
            name: 'Watercolor Splash Vignette',
            url: '/homebrew/masks/watercolor_splash_center.png',
            maskUrl: '/homebrew/masks/watercolor_splash_center.png',
            opacity: 85,
            blendMode: 'multiply',
            visible: true,
            scale: 100,
            offsetX: 0,
            offsetY: 0,
          }
          editorStore.a4Layers.unshift(layer)
          break

        case 'watercolor_bottom':
          layer = {
            id,
            type: 'foreground',
            name: 'Watercolor Bottom Edge',
            url: '/homebrew/masks/watercolor_bottom_01.png',
            opacity: 90,
            blendMode: 'multiply',
            visible: true,
            scale: 100,
            offsetX: 0,
            offsetY: 0,
          }
          editorStore.a4Layers.unshift(layer)
          break

        case 'header_overlay':
          layer = {
            id,
            type: 'foreground',
            name: 'Running Header Overlay',
            opacity: 100,
            blendMode: 'normal',
            visible: true,
            scale: 100,
            offsetX: 0,
            offsetY: 0,
            showTextOverlay: true,
            overlayText: `${monsterStore.name || 'CREATURE COMPENDIUM'} | CHAPTER 1`,
            overlayTextAlign: 'center',
            overlayTextOffsetX: 0,
            overlayTextOffsetY: -1050,
            overlayTextColor: '#58180d',
            overlayTextFontSize: 9,
          }
          editorStore.a4Layers.unshift(layer)
          break

        case 'footer_overlay':
          layer = {
            id,
            type: 'foreground',
            name: 'Running Footer Overlay',
            opacity: 100,
            blendMode: 'normal',
            visible: true,
            scale: 100,
            offsetX: 0,
            offsetY: 0,
            showTextOverlay: true,
            overlayText: 'D&D 5E COMPENDIUM | 1:1 PHYSICAL A4 PRINT PREVIEW',
            overlayTextAlign: 'center',
            overlayTextOffsetX: 0,
            overlayTextOffsetY: 0,
            overlayTextColor: '#58180d',
            overlayTextFontSize: 9,
          }
          editorStore.a4Layers.unshift(layer)
          break
      }

      expandedLayerId.value = id
    }

    const portraitFileInput = ref<File | null>(null)

    const portraitUrlModel = computed({
      get: () => monsterStore.portrait?.url || '',
      set: (val: string) => {
        if (!monsterStore.portrait) {
          monsterStore.portrait = {
            url: val,
            caption: '',
            position: 'right',
            width: 280,
          }
        } else {
          monsterStore.portrait.url = val
        }
        ensureCoreLayers()
      }
    })

    const portraitPositionModel = computed({
      get: () => {
        if (editorStore.a4Layout === 'statblock_only') return 'none'
        if (editorStore.a4Layout === 'stacked') {
          return monsterStore.portrait?.position === 'bottom' ? 'bottom' : 'top'
        }
        return monsterStore.portrait?.position === 'left' ? 'left' : 'right'
      },
      set: (val: 'left' | 'right' | 'top' | 'bottom' | 'none') => {
        if (!monsterStore.portrait) {
          monsterStore.portrait = {
            url: '',
            caption: '',
            position: val,
            width: 280,
          }
        } else {
          monsterStore.portrait.position = val
        }
        if (val === 'none') {
          editorStore.a4Layout = 'statblock_only'
        } else if (val === 'top' || val === 'bottom') {
          editorStore.a4Layout = 'stacked'
        } else {
          editorStore.a4Layout = 'side_by_side'
        }
      }
    })

    const portraitWidthModel = computed({
      get: () => monsterStore.portrait?.width || 280,
      set: (val: number) => {
        if (monsterStore.portrait) {
          monsterStore.portrait.width = val
        }
      }
    })

    const portraitCaptionModel = computed({
      get: () => monsterStore.portrait?.caption || '',
      set: (val: string) => {
        if (monsterStore.portrait) {
          monsterStore.portrait.caption = val
        }
      }
    })

    const onPortraitFileSelected = (file: File | null) => {
      if (!file) return
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          if (!monsterStore.portrait) {
            monsterStore.portrait = {
              url: e.target.result,
              caption: '',
              position: 'right',
              width: 280,
            }
          } else {
            monsterStore.portrait.url = e.target.result
            if (monsterStore.portrait.position === 'none') {
              monsterStore.portrait.position = 'right'
            }
          }
          ensureCoreLayers()
        }
      }
      reader.readAsDataURL(file)
    }

    const onPortraitUrlChanged = (val: string) => {
      portraitUrlModel.value = val
    }

    return {
      a4MeasuredPx,
      a4TargetPx,
      a4OverflowPx,
      a4CapacityRatio,
      a4StatusLabel,
      toggleOrientation,
      toggleColumns,
      resetA4Layout,
      
      appAsset,
      editorStore,
      monsterStore,
      displayLayers,
      showAddLayerForm,
      expandedLayerId,
      newLayerType,
      newLayerName,
      newLayerUrl,
      newLayerFile,
      newLayerBlend,
      blendModeOptions,
      watercolorMaskOptions,
      shiftLayer,
      toggleLayerVisibility,
      removeLayer,
      onNewLayerFileSelected,
      addCustomLayer,
      addPreset,
      portraitFileInput,
      portraitUrlModel,
      portraitPositionModel,
      portraitWidthModel,
      portraitCaptionModel,
      onPortraitFileSelected,
      onPortraitUrlChanged,
    }
  }
})
</script>

<style scoped>
.q-slider {
  min-height: 24px;
}
</style>
