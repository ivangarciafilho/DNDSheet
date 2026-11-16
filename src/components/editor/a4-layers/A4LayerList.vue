<template>
  <div class="q-gutter-y-xs editor-scroll-region" data-a4-layer-list>
    <div class="text-caption text-grey-5 flex items-center justify-between q-px-xs">
      <span>▲ Top of Composition (Higher Z-Index)</span>
      <span>▼ Bottom of Composition (Lower Z-Index)</span>
    </div>

    <q-card
      v-for="(layer, index) in displayLayers"
      :key="layer.id"
      class="q-pa-xs rounded-borders bg-grey-9"
      :style="{
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderLeft: layer.type === 'statblock' ? '4px solid #f59e0b' : (layer.type === 'portrait' ? '4px solid #06b6d4' : (layer.type === 'foreground' ? '4px solid #a855f7' : '4px solid #3b82f6')),
        backgroundColor: layer.type === 'statblock' ? '#2c2519' : (layer.type === 'portrait' ? '#17292e' : undefined)
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
              color="amber-4"
              text-color="grey-10"
              class="text-weight-bold text-caption"
            >
              Statblock (Non-Removable)
            </q-badge>
            <q-badge
              v-else-if="layer.type === 'portrait'"
              color="cyan-10"
              text-color="white"
              class="text-weight-bold text-caption"
            >
              Portrait Artwork
            </q-badge>
            <q-badge
              v-else
              :color="layer.type === 'background' ? 'blue-9' : 'purple-8'"
              text-color="white"
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
            :color="layer.visible ? 'green-4' : 'grey-4'"
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
            color="red-3"
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
                <catalog-select
                  v-model="layer.blendMode"
                  v-help="'How this layer mixes with the layers below.'"
                  :entries="blendModeOptions"
                  preserve-order
                  dark
                  label="Blend Mode"
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
                      v-help="'Adjust parchment backdrop opacity behind stat block text to show underlying art.'"
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
                      v-help="'How see-through the layer is.'"
                      type="number"
                      min="0"
                      max="100"
                      dense
                      outlined
                      dark label="Opacity (%)"
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
                  v-help="'Drag to place the stat block on the page.'"
                  :min="-450"
                  :max="450"
                  :step="2" label="Statblock Position Gizmo"
                  unit="px"
                  color="amber"
                  icon="open_with"
                />
              </div>

              <div class="col-12 col-sm-8">
                <div class="text-caption text-amber-3">Overall font size · {{ editorStore.statblockFontScale }}%</div>
                <q-slider
v-model="editorStore.statblockFontScale" v-help="'Scale text typography inside the stat block before fitting box dimensions.'" aria-label="Overall font size"
                  :min="65" :max="150" :step="1" color="amber-5" dense />
                <div class="text-caption text-amber-3">Final width · {{ editorStore.a4StatblockFinalWidth }}%</div>
                <q-slider
v-model="editorStore.a4StatblockFinalWidth" v-help="'Adjust horizontal box squeeze or expansion after font scaling.'" aria-label="Final width"
                  :min="25" :max="150" :step="1" color="amber-5" dense />
                <div class="text-caption text-amber-3">Final height · {{ editorStore.a4StatblockFinalHeight }}%</div>
                <q-slider
v-model="editorStore.a4StatblockFinalHeight" v-help="'Adjust vertical stat block height scaling on the A4 sheet.'" aria-label="Final height"
                  :min="25" :max="150" :step="1" color="amber-5" dense />
                <div class="row items-center justify-between q-mb-sm">
                  <span class="text-caption">100% uses the natural size. The layer reduces text first, then scales the remaining difference.</span>
                  <q-btn flat dense no-caps label="Reset fit" @click="editorStore.a4StatblockFinalWidth = editorStore.a4StatblockFinalHeight = 100" />
                </div>
                <div class="row items-center justify-between text-caption text-amber-3">
                  <span>Statblock width</span>
                  <span>{{ editorStore.a4StatblockWidth == null ? 'Auto' : editorStore.a4StatblockWidth + '%' }}</span>
                </div>
                <q-slider
                  v-help="'Set the column share width allocated to the stat block when paired with artwork.'"
                  aria-label="Statblock width"
                  :model-value="editorStore.a4StatblockWidth ?? 70"
                  :min="35"
                  :max="95"
                  :step="1"
                  color="amber-5"
                  dense
                  @update:model-value="setStatblockWidth"
                />
                <div class="row items-center justify-between">
                  <span class="text-caption">Share of the page in Side-by-Side. Text reflows as width changes.</span>
                  <q-btn flat dense no-caps label="Auto width" @click="editorStore.a4StatblockWidth = null" />
                </div>
                <q-btn
                  v-if="editorStore.a4StatblockScaleX !== 100 || editorStore.a4StatblockScaleY !== 100"
                  flat dense no-caps
                  label="Reset saved stretch"
                  @click="editorStore.a4StatblockScaleX = editorStore.a4StatblockScaleY = 100"
                />
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
                  v-help="'Upload a portrait from this device; it stays in the browser.'" label="Upload Creature Portrait Image"
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
                  v-help="'Paste an image URL or data URI to display as the creature portrait artwork.'"
                  label="Or Portrait Image URL / Data URI"
                  dense
                  outlined
                  dark
                  clearable
                  @update:model-value="onPortraitUrlChanged"
                />
              </div>

              <div class="col-6 col-sm-4">
                <catalog-select
                  v-model="portraitPositionModel"
                  v-help="'Where the portrait sits relative to the stat block.'"
                  :entries="portraitPositionOptions"
                  preserve-order
                  :searchable="false"
                  dark
                  label="Layout Position"
                />
              </div>
              <div class="col-6 col-sm-4">
                <q-input
                  v-model.number="portraitWidthModel"
                  v-help="'Portrait width before scaling.'"
                  type="number" label="Base Width (px)"
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
                  v-help="'Credit shown under the image.'" label="Caption / Artist Credit"
                  dense
                  outlined
                  dark
                />
              </div>

              <div class="col-12 col-sm-4">
                <catalog-select
                  v-model="layer.blendMode"
                  v-help="'How this layer mixes with the layers below.'"
                  :entries="blendModeOptions"
                  preserve-order
                  dark
                  label="Blend Mode"
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
                      v-help="'Control how far the stat block overlaps portrait artwork (0% separate to 100% covered).'"
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
                      v-help="'Exact percentage of portrait area covered by the stat block column.'"
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

              <!-- 2 Radial Offset Controllers: Pre-Crop Focal Center & Post-Crop Layer Position -->
              <div class="col-12 col-sm-6 q-py-xs">
                <radial-offset-controller
                  v-model:x="editorStore.a4PortraitCropCenterX"
                  v-model:y="editorStore.a4PortraitCropCenterY"
                  :min="-150"
                  :max="150"
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
                  :min="-450"
                  :max="450"
                  :step="2"
                  label="Post-Crop Position &amp; Parallel Crop"
                  unit="px"
                  color="cyan"
                  icon="open_with"
                >
                  <layer-size-strip
                    :scale="editorStore.a4PortraitScale ?? 100"
                    :scale-x="layer.scaleX ?? 100"
                    :scale-y="layer.scaleY ?? 100"
                    color="cyan"
                    @update:scale="(value: number) => (editorStore.a4PortraitScale = value)"
                    @update:scale-x="(value: number) => (layer.scaleX = value)"
                    @update:scale-y="(value: number) => (layer.scaleY = value)"
                  />
                </radial-offset-controller>
              </div>

              <image-layer-transform-controls :layer="layer" class="col-12" @change="patch => Object.assign(layer, patch)" />

              <!-- Grayscale as Alpha Luminance Mask for Portrait -->
              <div class="col-12 row items-center q-gutter-x-md q-my-xs">
                <q-checkbox
                  v-model="layer.grayscaleAsAlpha"
                  v-help="'Use the image brightness as transparency.'" label="Use Grayscale as Alpha (Luminance Mask)"
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
                  v-help="'Swap light and dark in the mask.'" label="Invert Luminance"
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
                <catalog-select
                  v-help="'Apply an organic Homebrewery watercolor alpha mask to soften portrait edges.'"
                  :model-value="layer.maskUrl ?? ''"
                  :entries="watercolorMaskOptions"
                  preserve-order
                  :searchable="false"
                  clearable
                  dark
                  label="Watercolor Mask (Homebrewery Splatter Blend)"
                  @update:model-value="val => (layer.maskUrl = val ? String(val) : '')"
                >
                  <template #prepend>
                    <q-icon name="brush" color="cyan-4" />
                  </template>
                </catalog-select>
              </div>
            </div>
          </template>

          <!-- 3. CUSTOM BACKGROUND / FOREGROUND TEXTURE & FRAME LAYER CONTROLS -->
          <template v-else>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12 col-sm-6">
                <q-input v-model="layer.url" v-help="'Image URL or embedded data URI rendered for this composition layer.'" dense outlined dark label="Image URL" />
              </div>
              <div class="col-12 col-sm-6">
                <q-file
                  :model-value="null"
                  accept="image/*"
                  dense outlined dark
                  label="Replace image"
                  @update:model-value="file => replaceLayerImage(layer, Array.isArray(file) ? file[0] ?? null : file)"
                />
              </div>
              <div class="col-6 col-sm-4">
                <catalog-select
                  v-model="layer.blendMode"
                  v-help="'How this layer mixes with the layers below.'"
                  :entries="blendModeOptions"
                  preserve-order
                  dark
                  label="Blend Mode"
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
                      v-help="'Adjust layer opacity from completely transparent (0%) to solid (100%).'"
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
                      v-help="'Exact opacity percentage for this composition layer.'"
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

              <image-layer-transform-controls :layer="layer" class="col-12" @change="patch => Object.assign(layer, patch)" />

              <!-- 2 Radial Offset Controllers for Custom Layer -->
              <div class="col-12 col-sm-6 q-py-xs">
                <radial-offset-controller
                  :x="layer.cropCenterX || 0"
                  :y="layer.cropCenterY || 0"
                  :min="-150"
                  :max="150"
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
                  :min="-450"
                  :max="450"
                  :step="2"
                  label="Post-Crop Position &amp; Parallel Crop"
                  unit="px"
                  :color="layer.type === 'foreground' ? 'purple' : 'blue'"
                  icon="open_with"
                  @update:x="(val: number) => layer.offsetX = val"
                  @update:y="(val: number) => layer.offsetY = val"
                  @update:crop-x="(val: { min: number; max: number }) => layer.cropX = val"
                  @update:crop-y="(val: { min: number; max: number }) => layer.cropY = val"
                >
                  <layer-size-strip
                    :scale="layer.scale ?? 100"
                    :scale-x="layer.scaleX ?? 100"
                    :scale-y="layer.scaleY ?? 100"
                    :color="layer.type === 'foreground' ? 'purple' : 'blue'"
                    @update:scale="(value: number) => (layer.scale = value)"
                    @update:scale-x="(value: number) => (layer.scaleX = value)"
                    @update:scale-y="(value: number) => (layer.scaleY = value)"
                  />
                </radial-offset-controller>
              </div>

              <div class="col-12 col-sm-12">
                <catalog-select
                  v-help="'Fade the layer edges like watercolour.'"
                  :model-value="layer.maskUrl ?? ''"
                  :entries="watercolorMaskOptions"
                  preserve-order
                  :searchable="false"
                  clearable
                  dark
                  label="Watercolor Edge Mask"
                  @update:model-value="val => (layer.maskUrl = val ? String(val) : '')"
                >
                  <template #prepend>
                    <q-icon name="brush" color="purple-3" />
                  </template>
                </catalog-select>
              </div>

              <!-- Grayscale as Alpha Luminance Mask -->
              <div class="col-12 row items-center q-gutter-x-md q-my-xs">
                <q-checkbox
                  v-model="layer.grayscaleAsAlpha"
                  v-help="'Use the image brightness as transparency.'" label="Use Grayscale as Alpha (Luminance Mask)"
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
                  v-help="'Swap light and dark in the mask.'" label="Invert Luminance"
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
                    v-help="'Print text on this layer, such as a header or footer.'" label="Enable Layer Text Overlay (Header/Footer)"
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
                      v-help="'Text printed on the layer.'" label="Overlay Text (Header/Footer/Notes)"
                      dense
                      outlined
                      dark
                      hide-bottom-space
                    />
                  </div>
                  <div class="col-6 col-sm-3">
                    <catalog-select
                      v-model="layer.overlayTextAlign"
                      v-help="'Left, centre or right text alignment.'"
                      :entries="overlayAlignOptions"
                      preserve-order
                      :searchable="false"
                      dark
                      label="Text Align"
                    />
                  </div>
                  <div class="col-6 col-sm-3">
                    <q-input
                      v-model="layer.overlayTextColor"
                      v-help="'Hex or CSS color for running header or footer overlay text.'"
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
                      v-help="'Move the layer left or right.'"
                      type="number" label="Offset X (px)"
                      dense
                      outlined
                      dark
                      hide-bottom-space
                    />
                  </div>
                  <div class="col-4 col-sm-4 q-mt-xs">
                    <q-input
                      v-model.number="layer.overlayTextOffsetY"
                      v-help="'Move the layer up or down.'"
                      type="number" label="Offset Y (px)"
                      dense
                      outlined
                      dark
                      hide-bottom-space
                    />
                  </div>
                  <div class="col-4 col-sm-4 q-mt-xs">
                    <q-input
                      v-model.number="layer.overlayTextFontSize"
                      v-help="'Text size in points.'"
                      type="number" label="Font Size (pt)"
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
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ImageLayerTransformControls from '../widgets/ImageLayerTransformControls.vue'
import LayerSizeStrip from '../widgets/LayerSizeStrip.vue'
import RadialOffsetController from '../widgets/RadialOffsetController.vue'
import GradientOverlayController from '../widgets/GradientOverlayController.vue'
import CatalogSelect from '../../kit/CatalogSelect.vue'
import { injectA4LayerStudioState } from './useA4LayerStudioState'

export default defineComponent({
  name: 'A4LayerList',
  components: { LayerSizeStrip, ImageLayerTransformControls, RadialOffsetController, GradientOverlayController, CatalogSelect },
  setup() {
    return injectA4LayerStudioState()
  },
})
</script>

<style scoped>
.q-slider {
  min-height: 24px;
}
</style>
