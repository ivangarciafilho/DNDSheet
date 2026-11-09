<template>
  <div class="radial-offset-controller column items-center q-pa-sm">
    <div class="text-caption text-weight-bold row items-center justify-between full-width q-mb-xs" :class="labelColorClass">
      <span class="flex items-center">
        <q-icon :name="icon || 'radar'" size="14px" class="q-mr-xs" />
        {{ label }}
      </span>
      <div class="row items-center q-gutter-x-xs">
        <span class="text-grey-5" style="font-size: 9px">Dbl-click knob to type</span>
        <q-btn
          flat
          round
          dense
          size="xs"
          icon="restart_alt"
          color="grey-4"
          @click="resetAll"
        >
          <q-tooltip class="bg-grey-9 text-caption">Reset Offset (0, 0) &amp; Crop (0%)</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Main 2D Matrix: Radar Pad + Parallel Vertical Sliders (Y Offset & Y Crop) -->
    <div class="radial-matrix-grid">
      <!-- Top-Left: 2D Circular Radar Pad -->
      <div
        ref="radarPadRef"
        class="radar-pad-disc relative-position flex flex-center cursor-pointer"
        :class="'radar-pad-' + (color || 'cyan')"
        @mousedown="startDrag"
        @touchstart.passive="startTouch"
      >
        <!-- Radar Background Concentric Circles & Crosshairs -->
        <svg class="radar-svg-grid full-width full-height" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48" class="radar-ring outer-ring" />
          <circle cx="50" cy="50" r="36" class="radar-ring" />
          <circle cx="50" cy="50" r="24" class="radar-ring" />
          <circle cx="50" cy="50" r="12" class="radar-ring" />
          <!-- Axis Crosshairs -->
          <line x1="50" y1="2" x2="50" y2="98" class="radar-axis" />
          <line x1="2" y1="50" x2="98" y2="50" class="radar-axis" />
        </svg>

        <!-- Center Deadzone Pip -->
        <div class="radar-center-pip"></div>

        <!-- Glowing Draggable Puck Indicator -->
        <div
          class="radar-puck"
          :style="{
            left: `${puckLeftPercent}%`,
            top: `${puckTopPercent}%`,
          }"
        ></div>
      </div>

      <!-- Top-Right Column 1: Vertical Offset Slider (Y) with Value Inside Knob + Exclusive Reset -->
      <div class="vertical-sliders-cluster row no-wrap items-center q-gutter-x-xs">
        <div class="axis-track-column column items-center">
          <div class="axis-micro-label text-grey-4">Y</div>
          <div
            ref="vOffsetTrackRef"
            class="axis-slider-track vertical-track relative-position cursor-pointer"
            :class="'track-' + (color || 'cyan')"
            @mousedown="startVOffsetDrag"
          >
            <div class="track-center-tick horizontal-tick"></div>
            <!-- Knob with Y Value Inside (Double-click to edit) -->
            <div
              class="axis-value-knob vertical-knob"
              :class="'knob-' + (color || 'cyan')"
              :style="{ top: `${puckTopPercent}%` }"
              title="Drag to adjust Y offset, or double-click to type value"
              @mousedown.stop="startVOffsetDrag"
              @dblclick.stop="startEditingKnob('y')"
            >
              <input
                v-if="editingKnob === 'y'"
                ref="knobInputRef"
                v-model="editingValue"
                type="number"
                class="knob-inline-input"
                @keydown.enter.prevent="commitKnobEdit"
                @keydown.esc.prevent="cancelKnobEdit"
                @blur="commitKnobEdit"
                @mousedown.stop
              />
              <span v-else class="knob-value-text">{{ Math.round(y) }}</span>
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            size="xs"
            icon="restart_alt"
            color="grey-5"
            class="slider-mini-reset q-mt-xs"
            data-reset-slider="y"
            aria-label="Reset Y Offset"
            @click.stop="resetY"
          >
            <q-tooltip class="bg-grey-9 text-caption">Reset Y Offset (0)</q-tooltip>
          </q-btn>
        </div>

        <!-- Top-Right Column 2: Parallel Vertical Cropping Slider (Top/Bottom Crop) with 2 Per-Side Resets -->
        <div v-if="hasCrop" class="axis-track-column column items-center dual-knob-crop-slider">
          <div class="row items-center no-wrap q-gutter-x-none">
            <div class="axis-micro-label text-amber-3" title="Vertical Cropping (Top / Bottom %)">Crop Y</div>
            <q-btn
              flat
              round
              dense
              size="xs"
              icon="restart_alt"
              color="amber-4"
              class="slider-mini-reset"
              data-reset-slider="cropY-min"
              aria-label="Reset Top Crop"
              @click.stop="resetCropYMin"
            >
              <q-tooltip class="bg-grey-9 text-caption">Reset Top Crop (0%)</q-tooltip>
            </q-btn>
          </div>
          <div
            ref="vCropTrackRef"
            class="axis-slider-track vertical-track crop-track relative-position cursor-pointer"
          >
            <!-- Active uncropped region bar -->
            <div
              class="crop-active-fill vertical-fill"
              :style="{
                top: `${safeCropY.min}%`,
                height: `${Math.max(0, safeCropY.max - safeCropY.min)}%`,
              }"
            ></div>
            <!-- Top Crop Knob (min) -->
            <div
              class="axis-value-knob vertical-knob knob-crop"
              :style="{ top: `${safeCropY.min}%` }"
              title="Top Crop % (Drag or double-click to edit)"
              @mousedown.stop="startVCropDrag('min', $event)"
              @dblclick.stop="startEditingKnob('cropYMin')"
            >
              <input
                v-if="editingKnob === 'cropYMin'"
                ref="knobInputRef"
                v-model="editingValue"
                type="number"
                class="knob-inline-input"
                @keydown.enter.prevent="commitKnobEdit"
                @keydown.esc.prevent="cancelKnobEdit"
                @blur="commitKnobEdit"
                @mousedown.stop
              />
              <span v-else class="knob-value-text">{{ Math.round(safeCropY.min) }}%</span>
            </div>
            <!-- Bottom Crop Knob (max -> displays 100 - max %) -->
            <div
              class="axis-value-knob vertical-knob knob-crop"
              :style="{ top: `${safeCropY.max}%` }"
              title="Bottom Crop % (Drag or double-click to edit)"
              @mousedown.stop="startVCropDrag('max', $event)"
              @dblclick.stop="startEditingKnob('cropYMax')"
            >
              <input
                v-if="editingKnob === 'cropYMax'"
                ref="knobInputRef"
                v-model="editingValue"
                type="number"
                class="knob-inline-input"
                @keydown.enter.prevent="commitKnobEdit"
                @keydown.esc.prevent="cancelKnobEdit"
                @blur="commitKnobEdit"
                @mousedown.stop
              />
              <span v-else class="knob-value-text">{{ Math.round(100 - safeCropY.max) }}%</span>
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            size="xs"
            icon="restart_alt"
            color="amber-4"
            class="slider-mini-reset q-mt-xs"
            data-reset-slider="cropY-max"
            aria-label="Reset Bottom Crop"
            @click.stop="resetCropYMax"
          >
            <q-tooltip class="bg-grey-9 text-caption">Reset Bottom Crop (0%)</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Bottom-Left Row 1 & 2: Horizontal Offset Slider (X) + Parallel Horizontal Cropping Slider (Left/Right Crop) -->
      <div class="horizontal-sliders-cluster column no-wrap items-center q-gutter-y-xs q-mt-xs">
        <!-- Row 1: Horizontal Offset Slider (X) with Value Inside Knob + Exclusive Reset -->
        <div class="axis-track-row row no-wrap items-center full-width">
          <div class="axis-micro-label text-grey-4 q-mr-xs">X</div>
          <div
            ref="hOffsetTrackRef"
            class="axis-slider-track horizontal-track relative-position cursor-pointer"
            :class="'track-' + (color || 'cyan')"
            @mousedown="startHOffsetDrag"
          >
            <div class="track-center-tick vertical-tick"></div>
            <!-- Knob with X Value Inside (Double-click to edit) -->
            <div
              class="axis-value-knob horizontal-knob"
              :class="'knob-' + (color || 'cyan')"
              :style="{ left: `${puckLeftPercent}%` }"
              title="Drag to adjust X offset, or double-click to type value"
              @mousedown.stop="startHOffsetDrag"
              @dblclick.stop="startEditingKnob('x')"
            >
              <input
                v-if="editingKnob === 'x'"
                ref="knobInputRef"
                v-model="editingValue"
                type="number"
                class="knob-inline-input"
                @keydown.enter.prevent="commitKnobEdit"
                @keydown.esc.prevent="cancelKnobEdit"
                @blur="commitKnobEdit"
                @mousedown.stop
              />
              <span v-else class="knob-value-text">{{ Math.round(x) }}</span>
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            size="xs"
            icon="restart_alt"
            color="grey-5"
            class="slider-mini-reset q-ml-xs"
            data-reset-slider="x"
            aria-label="Reset X Offset"
            @click.stop="resetX"
          >
            <q-tooltip class="bg-grey-9 text-caption">Reset X Offset (0)</q-tooltip>
          </q-btn>
        </div>

        <!-- Row 2: Parallel Horizontal Cropping Slider (Left/Right Crop) with 2 Per-Side Resets -->
        <div v-if="hasCrop" class="axis-track-row row no-wrap items-center full-width dual-knob-crop-slider">
          <div class="axis-micro-label text-cyan-3 q-mr-xs" title="Horizontal Cropping (Left / Right %)">Crop X</div>
          <q-btn
            flat
            round
            dense
            size="xs"
            icon="restart_alt"
            color="cyan-4"
            class="slider-mini-reset q-mr-xs"
            data-reset-slider="cropX-min"
            aria-label="Reset Left Crop"
            @click.stop="resetCropXMin"
          >
            <q-tooltip class="bg-grey-9 text-caption">Reset Left Crop (0%)</q-tooltip>
          </q-btn>
          <div
            ref="hCropTrackRef"
            class="axis-slider-track horizontal-track crop-track relative-position cursor-pointer"
          >
            <!-- Active uncropped region bar -->
            <div
              class="crop-active-fill horizontal-fill"
              :style="{
                left: `${safeCropX.min}%`,
                width: `${Math.max(0, safeCropX.max - safeCropX.min)}%`,
              }"
            ></div>
            <!-- Left Crop Knob (min) -->
            <div
              class="axis-value-knob horizontal-knob knob-crop"
              :style="{ left: `${safeCropX.min}%` }"
              title="Left Crop % (Drag or double-click to edit)"
              @mousedown.stop="startHCropDrag('min', $event)"
              @dblclick.stop="startEditingKnob('cropXMin')"
            >
              <input
                v-if="editingKnob === 'cropXMin'"
                ref="knobInputRef"
                v-model="editingValue"
                type="number"
                class="knob-inline-input"
                @keydown.enter.prevent="commitKnobEdit"
                @keydown.esc.prevent="cancelKnobEdit"
                @blur="commitKnobEdit"
                @mousedown.stop
              />
              <span v-else class="knob-value-text">{{ Math.round(safeCropX.min) }}%</span>
            </div>
            <!-- Right Crop Knob (max -> displays 100 - max %) -->
            <div
              class="axis-value-knob horizontal-knob knob-crop"
              :style="{ left: `${safeCropX.max}%` }"
              title="Right Crop % (Drag or double-click to edit)"
              @mousedown.stop="startHCropDrag('max', $event)"
              @dblclick.stop="startEditingKnob('cropXMax')"
            >
              <input
                v-if="editingKnob === 'cropXMax'"
                ref="knobInputRef"
                v-model="editingValue"
                type="number"
                class="knob-inline-input"
                @keydown.enter.prevent="commitKnobEdit"
                @keydown.esc.prevent="cancelKnobEdit"
                @blur="commitKnobEdit"
                @mousedown.stop
              />
              <span v-else class="knob-value-text">{{ Math.round(100 - safeCropX.max) }}%</span>
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            size="xs"
            icon="restart_alt"
            color="cyan-4"
            class="slider-mini-reset q-ml-xs"
            data-reset-slider="cropX-max"
            aria-label="Reset Right Crop"
            @click.stop="resetCropXMax"
          >
            <q-tooltip class="bg-grey-9 text-caption">Reset Right Crop (0%)</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, nextTick, PropType } from 'vue'
import { CropRange } from './DualKnobCropSlider.vue'

type KnobKey = 'x' | 'y' | 'cropXMin' | 'cropXMax' | 'cropYMin' | 'cropYMax'

export default defineComponent({
  name: 'RadialOffsetController',
  props: {
    x: {
      type: Number,
      required: true,
      default: 0,
    },
    y: {
      type: Number,
      required: true,
      default: 0,
    },
    cropX: {
      type: Object as PropType<CropRange | null>,
      default: null,
    },
    cropY: {
      type: Object as PropType<CropRange | null>,
      default: null,
    },
    min: {
      type: Number,
      default: -100,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 1,
    },
    label: {
      type: String,
      default: 'Radial Offset',
    },
    unit: {
      type: String,
      default: 'px',
    },
    color: {
      type: String,
      default: 'cyan',
    },
    icon: {
      type: String,
      default: 'radar',
    },
  },
  emits: ['update:x', 'update:y', 'update:cropX', 'update:cropY'],
  setup(props, { emit }) {
    const radarPadRef = ref<HTMLElement | null>(null)
    const hOffsetTrackRef = ref<HTMLElement | null>(null)
    const vOffsetTrackRef = ref<HTMLElement | null>(null)
    const hCropTrackRef = ref<HTMLElement | null>(null)
    const vCropTrackRef = ref<HTMLElement | null>(null)

    const editingKnob = ref<KnobKey | null>(null)
    const editingValue = ref<string>('')
    const knobInputRef = ref<HTMLInputElement | null>(null)

    const hasCrop = computed(() => props.cropX !== null || props.cropY !== null)

    const safeCropX = computed<CropRange>(() => ({
      min: props.cropX?.min ?? 0,
      max: props.cropX?.max ?? 100,
    }))

    const safeCropY = computed<CropRange>(() => ({
      min: props.cropY?.min ?? 0,
      max: props.cropY?.max ?? 100,
    }))

    const labelColorClass = computed(() => {
      switch (props.color) {
        case 'amber':
          return 'text-amber-3'
        case 'purple':
          return 'text-purple-3'
        case 'cyan':
        default:
          return 'text-cyan-3'
      }
    })

    // Map [min, max] value to [0, 100] percentage for puck and axis knob coordinates
    const puckLeftPercent = computed(() => {
      const range = props.max - props.min
      if (range <= 0) return 50
      const clamped = Math.max(props.min, Math.min(props.max, props.x))
      return ((clamped - props.min) / range) * 100
    })

    const puckTopPercent = computed(() => {
      const range = props.max - props.min
      if (range <= 0) return 50
      const clamped = Math.max(props.min, Math.min(props.max, props.y))
      return ((clamped - props.min) / range) * 100
    })

    const updateFromPointer = (clientX: number, clientY: number) => {
      if (!radarPadRef.value) return
      const rect = radarPadRef.value.getBoundingClientRect()
      const radius = rect.width / 2

      let dx = clientX - (rect.left + radius)
      let dy = clientY - (rect.top + radius)

      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > radius) {
        dx = (dx / dist) * radius
        dy = (dy / dist) * radius
      }

      const normX = dx / radius
      const normY = dy / radius
      const halfRange = (props.max - props.min) / 2
      const center = (props.max + props.min) / 2

      let newX = Math.round((center + normX * halfRange) / props.step) * props.step
      let newY = Math.round((center + normY * halfRange) / props.step) * props.step

      newX = Math.max(props.min, Math.min(props.max, newX))
      newY = Math.max(props.min, Math.min(props.max, newY))

      emit('update:x', newX)
      emit('update:y', newY)
    }

    const onPointerMove = (e: MouseEvent) => {
      updateFromPointer(e.clientX, e.clientY)
    }

    const onPointerUp = () => {
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)
    }

    const startDrag = (e: MouseEvent) => {
      updateFromPointer(e.clientX, e.clientY)
      window.addEventListener('mousemove', onPointerMove)
      window.addEventListener('mouseup', onPointerUp)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        updateFromPointer(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const onTouchEnd = () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }

    const startTouch = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        updateFromPointer(e.touches[0].clientX, e.touches[0].clientY)
        window.addEventListener('touchmove', onTouchMove)
        window.addEventListener('touchend', onTouchEnd)
      }
    }

    // Horizontal Offset Slider (X) Drag
    const updateHOffsetFromPointer = (clientX: number) => {
      if (!hOffsetTrackRef.value) return
      const rect = hOffsetTrackRef.value.getBoundingClientRect()
      const norm = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)))
      const raw = props.min + norm * (props.max - props.min)
      const stepped = Math.round(raw / props.step) * props.step
      emit('update:x', Math.max(props.min, Math.min(props.max, stepped)))
    }

    const startHOffsetDrag = (e: MouseEvent) => {
      if (editingKnob.value) return
      updateHOffsetFromPointer(e.clientX)
      const onMove = (ev: MouseEvent) => updateHOffsetFromPointer(ev.clientX)
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    // Vertical Offset Slider (Y) Drag
    const updateVOffsetFromPointer = (clientY: number) => {
      if (!vOffsetTrackRef.value) return
      const rect = vOffsetTrackRef.value.getBoundingClientRect()
      const norm = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)))
      const raw = props.min + norm * (props.max - props.min)
      const stepped = Math.round(raw / props.step) * props.step
      emit('update:y', Math.max(props.min, Math.min(props.max, stepped)))
    }

    const startVOffsetDrag = (e: MouseEvent) => {
      if (editingKnob.value) return
      updateVOffsetFromPointer(e.clientY)
      const onMove = (ev: MouseEvent) => updateVOffsetFromPointer(ev.clientY)
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    // Horizontal Crop Slider (Crop X) Drag
    const startHCropDrag = (which: 'min' | 'max', e: MouseEvent) => {
      if (editingKnob.value) return
      e.preventDefault()
      const updateCropX = (clientX: number) => {
        if (!hCropTrackRef.value) return
        const rect = hCropTrackRef.value.getBoundingClientRect()
        const pct = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / Math.max(1, rect.width)) * 100)))
        if (which === 'min') {
          const clamped = Math.min(pct, safeCropX.value.max - 2)
          emit('update:cropX', { min: Math.max(0, clamped), max: safeCropX.value.max })
        } else {
          const clamped = Math.max(pct, safeCropX.value.min + 2)
          emit('update:cropX', { min: safeCropX.value.min, max: Math.min(100, clamped) })
        }
      }
      const onMove = (ev: MouseEvent) => updateCropX(ev.clientX)
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    // Vertical Crop Slider (Crop Y) Drag
    const startVCropDrag = (which: 'min' | 'max', e: MouseEvent) => {
      if (editingKnob.value) return
      e.preventDefault()
      const updateCropY = (clientY: number) => {
        if (!vCropTrackRef.value) return
        const rect = vCropTrackRef.value.getBoundingClientRect()
        const pct = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / Math.max(1, rect.height)) * 100)))
        if (which === 'min') {
          const clamped = Math.min(pct, safeCropY.value.max - 2)
          emit('update:cropY', { min: Math.max(0, clamped), max: safeCropY.value.max })
        } else {
          const clamped = Math.max(pct, safeCropY.value.min + 2)
          emit('update:cropY', { min: safeCropY.value.min, max: Math.min(100, clamped) })
        }
      }
      const onMove = (ev: MouseEvent) => updateCropY(ev.clientY)
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    // Double-Click Knob Inline Edit
    const startEditingKnob = (key: KnobKey) => {
      editingKnob.value = key
      if (key === 'x') editingValue.value = String(Math.round(props.x))
      else if (key === 'y') editingValue.value = String(Math.round(props.y))
      else if (key === 'cropXMin') editingValue.value = String(Math.round(safeCropX.value.min))
      else if (key === 'cropXMax') editingValue.value = String(Math.round(100 - safeCropX.value.max))
      else if (key === 'cropYMin') editingValue.value = String(Math.round(safeCropY.value.min))
      else if (key === 'cropYMax') editingValue.value = String(Math.round(100 - safeCropY.value.max))

      void nextTick(() => {
        if (knobInputRef.value) {
          knobInputRef.value.focus()
          knobInputRef.value.select()
        }
      })
    }

    const commitKnobEdit = () => {
      if (!editingKnob.value) return
      const key = editingKnob.value
      const num = parseFloat(editingValue.value)
      editingKnob.value = null
      if (isNaN(num)) return

      if (key === 'x') {
        emit('update:x', Math.max(props.min, Math.min(props.max, num)))
      } else if (key === 'y') {
        emit('update:y', Math.max(props.min, Math.min(props.max, num)))
      } else if (key === 'cropXMin') {
        const clamped = Math.max(0, Math.min(safeCropX.value.max - 1, Math.round(num)))
        emit('update:cropX', { min: clamped, max: safeCropX.value.max })
      } else if (key === 'cropXMax') {
        const rightCrop = Math.max(0, Math.min(100 - safeCropX.value.min - 1, Math.round(num)))
        emit('update:cropX', { min: safeCropX.value.min, max: 100 - rightCrop })
      } else if (key === 'cropYMin') {
        const clamped = Math.max(0, Math.min(safeCropY.value.max - 1, Math.round(num)))
        emit('update:cropY', { min: clamped, max: safeCropY.value.max })
      } else if (key === 'cropYMax') {
        const bottomCrop = Math.max(0, Math.min(100 - safeCropY.value.min - 1, Math.round(num)))
        emit('update:cropY', { min: safeCropY.value.min, max: 100 - bottomCrop })
      }
    }

    const cancelKnobEdit = () => {
      editingKnob.value = null
    }

    const resetX = () => {
      emit('update:x', 0)
    }

    const resetY = () => {
      emit('update:y', 0)
    }

    const resetCropXMin = () => {
      if (props.cropX !== null) emit('update:cropX', { min: 0, max: safeCropX.value.max })
    }

    const resetCropXMax = () => {
      if (props.cropX !== null) emit('update:cropX', { min: safeCropX.value.min, max: 100 })
    }

    const resetCropYMin = () => {
      if (props.cropY !== null) emit('update:cropY', { min: 0, max: safeCropY.value.max })
    }

    const resetCropYMax = () => {
      if (props.cropY !== null) emit('update:cropY', { min: safeCropY.value.min, max: 100 })
    }

    const resetAll = () => {
      emit('update:x', 0)
      emit('update:y', 0)
      if (props.cropX !== null) emit('update:cropX', { min: 0, max: 100 })
      if (props.cropY !== null) emit('update:cropY', { min: 0, max: 100 })
    }

    return {
      radarPadRef,
      hOffsetTrackRef,
      vOffsetTrackRef,
      hCropTrackRef,
      vCropTrackRef,
      editingKnob,
      editingValue,
      knobInputRef,
      hasCrop,
      safeCropX,
      safeCropY,
      labelColorClass,
      puckLeftPercent,
      puckTopPercent,
      startDrag,
      startTouch,
      startHOffsetDrag,
      startVOffsetDrag,
      startHCropDrag,
      startVCropDrag,
      startEditingKnob,
      commitKnobEdit,
      cancelKnobEdit,
      resetX,
      resetY,
      resetCropXMin,
      resetCropXMax,
      resetCropYMin,
      resetCropYMax,
      resetAll,
    }
  },
})
</script>

<style scoped>
.radial-offset-controller {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  min-width: 190px;
}

.radial-matrix-grid {
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  gap: 8px 10px;
  align-items: center;
  justify-items: center;
}

.radar-pad-disc {
  width: 98px;
  height: 98px;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1.5px solid rgba(148, 163, 184, 0.35);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.3);
  user-select: none;
  touch-action: none;
}

.radar-pad-cyan {
  border-color: rgba(6, 182, 212, 0.5);
}
.radar-pad-amber {
  border-color: rgba(245, 158, 11, 0.5);
}
.radar-pad-purple {
  border-color: rgba(168, 85, 247, 0.5);
}

.radar-svg-grid {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.radar-ring {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 1;
}

.radar-ring.outer-ring {
  stroke: rgba(255, 255, 255, 0.2);
}

.radar-axis {
  stroke: rgba(255, 255, 255, 0.18);
  stroke-width: 1;
  stroke-dasharray: 2, 2;
}

.radar-center-pip {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  pointer-events: none;
}

.radar-puck {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  transition: transform 0.05s ease;
}

.radar-pad-cyan .radar-puck {
  background: #22d3ee;
  border: 2px solid #ffffff;
  box-shadow: 0 0 10px #06b6d4, inset 0 0 4px #ffffff;
}

.radar-pad-amber .radar-puck {
  background: #fbbf24;
  border: 2px solid #ffffff;
  box-shadow: 0 0 10px #f59e0b, inset 0 0 4px #ffffff;
}

.radar-pad-purple .radar-puck {
  background: #c084fc;
  border: 2px solid #ffffff;
  box-shadow: 0 0 10px #a855f7, inset 0 0 4px #ffffff;
}

.axis-micro-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  margin-bottom: 3px;
  user-select: none;
}

.axis-slider-track {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  user-select: none;
}

.vertical-track {
  width: 12px;
  height: 92px;
  margin: 0 10px;
}

.horizontal-track {
  width: 110px;
  height: 12px;
  margin: 6px 0;
}

.horizontal-sliders-cluster {
  grid-column: 1 / -1;
  width: 100%;
}

.track-center-tick {
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
  pointer-events: none;
}

.horizontal-tick {
  top: 50%;
  left: 1px;
  right: 1px;
  height: 1px;
}

.vertical-tick {
  left: 50%;
  top: 1px;
  bottom: 1px;
  width: 1px;
}

.crop-active-fill {
  position: absolute;
  background: rgba(56, 189, 248, 0.25);
  border-radius: 999px;
  pointer-events: none;
}

.vertical-fill {
  left: 1px;
  right: 1px;
}

.horizontal-fill {
  top: 1px;
  bottom: 1px;
}

.axis-value-knob {
  position: absolute;
  min-width: 28px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #0f172a;
  border: 1.5px solid #22d3ee;
  color: #f8fafc;
  font-size: 9.5px;
  font-weight: 700;
  font-family: monospace;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  cursor: grab;
  z-index: 3;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}

.vertical-knob {
  left: 50%;
}

.horizontal-knob {
  top: 50%;
}

.knob-cyan {
  border-color: #22d3ee;
  box-shadow: 0 0 6px rgba(34, 211, 238, 0.45);
}

.knob-amber {
  border-color: #fbbf24;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.45);
}

.knob-purple {
  border-color: #c084fc;
  box-shadow: 0 0 6px rgba(192, 132, 252, 0.45);
}

.knob-crop {
  border-color: #38bdf8;
  background: #1e293b;
  min-width: 26px;
  height: 16px;
  font-size: 8.5px;
}

.knob-inline-input {
  width: 34px;
  height: 14px;
  background: #020617;
  color: #38bdf8;
  border: none;
  outline: none;
  font-size: 9.5px;
  font-family: monospace;
  font-weight: 700;
  text-align: center;
  padding: 0;
  margin: 0;
}

.slider-mini-reset {
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  padding: 0 !important;
  opacity: 0.78;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.slider-mini-reset:hover {
  opacity: 1;
  transform: rotate(-35deg) scale(1.1);
}
</style>
