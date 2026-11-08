<template>
  <div class="gradient-overlay-controller q-pa-xs rounded-borders" style="background: rgba(0, 0, 0, 0.28); border: 1px solid rgba(255, 255, 255, 0.14);">
    <div class="row items-center justify-between q-mb-xs">
      <div class="row items-center q-gutter-x-xs">
        <q-icon name="gradient" color="amber-4" size="16px" />
        <span class="text-caption text-weight-bold text-amber-3">Extra Gradient Overlay &amp; Falloff Curve</span>
      </div>
      <q-toggle
        :model-value="Boolean(overlay.enabled)"
        dense
        dark
        size="xs"
        color="amber-5"
        label="Enable Overlay"
        @update:model-value="(v) => updateField('enabled', v)"
      />
    </div>

    <div v-if="overlay.enabled" class="q-gutter-y-xs">
      <!-- Direction, Blend Mode, Curve Preset Row -->
      <div class="row q-col-gutter-xs items-center">
        <div class="col-4">
          <q-select
            :model-value="overlay.direction || 'top_to_bottom'"
            :options="directionOptions"
            emit-value
            map-options
            dense
            outlined
            dark
            options-dense
            label="Direction"
            @update:model-value="(v) => updateField('direction', v)"
          />
        </div>
        <div class="col-4">
          <q-select
            :model-value="overlay.blendMode || 'normal'"
            :options="blendModeOptions"
            emit-value
            map-options
            dense
            outlined
            dark
            options-dense
            label="Overlay Blend"
            @update:model-value="(v) => updateField('blendMode', v)"
          />
        </div>
        <div class="col-4">
          <q-select
            :model-value="overlay.curve || 'linear'"
            :options="curveOptions"
            emit-value
            map-options
            dense
            outlined
            dark
            options-dense
            label="Falloff Curve"
            @update:model-value="onSelectCurvePreset"
          />
        </div>
      </div>

      <!-- Interactive Gradient Bar + SVG Falloff Curve Overlay -->
      <div class="gradient-bar-section q-mt-xs">
        <div class="row items-center justify-between q-mb-xs">
          <span class="text-caption text-grey-4" style="font-size: 10px;">
            Click bar to add color key • Drag keys or curve knob • Double-click key to type %
          </span>
          <div class="row items-center q-gutter-x-xs">
            <q-btn
              flat
              dense
              no-caps
              size="xs"
              icon="add"
              color="amber-3"
              label="Add Key"
              class="add-gradient-key-btn"
              @click="addStopAtMidpoint"
            />
            <q-btn
              v-if="stopsList.length > 2"
              flat
              dense
              no-caps
              size="xs"
              icon="delete"
              color="red-4"
              label="Remove Key"
              class="remove-gradient-key-btn"
              @click="removeSelectedStop"
            />
          </div>
        </div>

        <!-- Gradient Bar Track with Checkerboard + Live Gradient + Draggable Falloff Curve Overlay -->
        <div
          ref="barRef"
          class="gradient-interactive-bar"
          @pointerdown="onBarPointerDown"
        >
          <!-- Checkerboard alpha backdrop -->
          <div class="gradient-checkerboard"></div>
          <!-- Live interpolated CSS gradient -->
          <div class="gradient-live-fill" :style="{ background: barPreviewCss }"></div>

          <!-- Configurable Falloff Curve SVG Overlay on top of the Gradient Bar -->
          <svg
            class="gradient-falloff-svg"
            viewBox="0 0 200 48"
            preserveAspectRatio="none"
          >
            <!-- Subtle grid lines -->
            <line x1="0" y1="24" x2="200" y2="24" stroke="rgba(255,255,255,0.18)" stroke-dasharray="2,2" stroke-width="1" />
            <line x1="100" y1="0" x2="100" y2="48" stroke="rgba(255,255,255,0.18)" stroke-dasharray="2,2" stroke-width="1" />
            <!-- Falloff curve path -->
            <path
              :d="svgCurvePath"
              fill="none"
              stroke="rgba(255, 213, 79, 0.92)"
              stroke-width="2"
            />
          </svg>

          <!-- Draggable Falloff Curve Control Knob on top of the gradient bar -->
          <div
            class="curve-control-knob"
            :style="{ left: '50%', top: `${(1 - curveMidpointY) * 100}%` }"
            title="Drag vertically to bend the gradient falloff curve manually"
            @pointerdown.stop="startDragCurve"
          >
            <span class="curve-knob-label">{{ Math.round(curveMidpointY * 100) }}%</span>
          </div>

          <!-- Color Key (Stop) Knobs along the Gradient Bar -->
          <div
            v-for="(stop, idx) in stopsList"
            :key="'gstop-' + idx"
            class="gradient-stop-knob"
            :class="{ 'is-selected': selectedStopIdx === idx }"
            :style="{ left: `${stop.offset}%` }"
            :title="`Key #${idx + 1}: ${stop.color} @ ${stop.offset}% (Double-click to type %)`"
            @pointerdown.stop="(e) => startDragStop(idx, e)"
            @dblclick.stop="startEditStopOffset(idx)"
          >
            <div class="stop-color-chip" :style="{ background: stop.color }"></div>
            <input
              v-if="editingStopIdx === idx"
              ref="stopEditInputRef"
              v-model="editingStopDraft"
              type="number"
              min="0"
              max="100"
              class="stop-inline-input"
              @pointerdown.stop
              @click.stop
              @keydown.enter.prevent="commitEditStopOffset(idx)"
              @keydown.esc.prevent="cancelEditStopOffset"
              @blur="commitEditStopOffset(idx)"
            />
            <span v-else class="stop-offset-text">{{ Math.round(stop.offset) }}%</span>
          </div>
        </div>
      </div>

      <!-- Selected Key Color & Position Editor + Overlay Opacity -->
      <div v-if="activeStop" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-6 row items-center no-wrap q-gutter-x-xs">
          <div
            class="selected-stop-swatch cursor-pointer"
            :style="{ background: activeStop.color }"
            title="Click to pick key color & alpha"
          >
            <q-popup-proxy transition-show="scale" transition-hide="scale">
              <q-color
                :model-value="activeStop.color"
                format-model="rgba"
                dark
                @update:model-value="(val) => updateStopColor(selectedStopIdx, val || 'rgba(0,0,0,1)')"
              />
            </q-popup-proxy>
          </div>
          <q-input
            :model-value="activeStop.color"
            dense
            outlined
            dark
            label="Selected Key Color"
            class="col"
            @update:model-value="(val) => updateStopColor(selectedStopIdx, String(val || ''))"
          />
        </div>
        <div class="col-6 row items-center no-wrap q-gutter-x-xs">
          <span class="text-caption text-grey-4" style="min-width: 58px;">Opacity: {{ overlay.opacity ?? 80 }}%</span>
          <q-slider
            :model-value="overlay.opacity ?? 80"
            :min="0"
            :max="100"
            dense
            dark
            color="amber-5"
            class="col"
            @update:model-value="(val) => updateField('opacity', val ?? 80)"
          />
        </div>
      </div>

      <!-- Quick Color Swatches for Selected Key -->
      <div class="row items-center justify-between q-px-xs">
        <span class="text-caption text-grey-5" style="font-size: 10px;">Quick Key Presets:</span>
        <div class="row items-center q-gutter-x-xs">
          <q-btn
            v-for="preset in colorPresets"
            :key="preset.label"
            flat
            dense
            no-caps
            size="xs"
            class="q-px-xs"
            style="font-size: 10px;"
            :label="preset.label"
            @click="updateStopColor(selectedStopIdx, preset.value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, PropType, ref } from 'vue'
import { evaluateGradientCurve } from 'src/core/domain/gradient-curve'

export interface GradientStopItem {
  color: string
  offset: number
}

export interface GradientOverlayModel {
  enabled: boolean
  direction: 'left_to_right' | 'right_to_left' | 'top_to_bottom' | 'bottom_to_top' | 'vignette' | 'radial'
  blendMode: string
  opacity: number
  startColor: string
  endColor: string
  curve: 'linear' | 'ease_in' | 'ease_out' | 'smoothstep' | 'custom'
  curveTension?: number
  stops?: GradientStopItem[]
}

export default defineComponent({
  name: 'GradientOverlayController',
  props: {
    modelValue: {
      type: Object as PropType<GradientOverlayModel>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const barRef = ref<HTMLElement | null>(null)
    const selectedStopIdx = ref(0)
    const editingStopIdx = ref<number | null>(null)
    const editingStopDraft = ref('')
    const stopEditInputRef = ref<HTMLInputElement[] | HTMLInputElement | null>(null)

    const overlay = computed(() => props.modelValue || {
      enabled: false,
      direction: 'top_to_bottom',
      blendMode: 'normal',
      opacity: 80,
      startColor: 'rgba(0,0,0,0.65)',
      endColor: 'rgba(0,0,0,0)',
      curve: 'smoothstep',
      curveTension: 0.5,
      stops: [
        { color: 'rgba(0,0,0,0.65)', offset: 0 },
        { color: 'rgba(0,0,0,0)', offset: 100 },
      ],
    })

    const stopsList = computed<GradientStopItem[]>(() => {
      const raw = overlay.value.stops
      if (Array.isArray(raw) && raw.length >= 2) {
        return raw.map((s) => ({
          color: s.color || 'rgba(0,0,0,0)',
          offset: Math.max(0, Math.min(100, Number(s.offset) || 0)),
        }))
      }
      return [
        { color: overlay.value.startColor || 'rgba(0,0,0,0.65)', offset: 0 },
        { color: overlay.value.endColor || 'rgba(0,0,0,0)', offset: 100 },
      ]
    })

    const activeStop = computed(() => {
      const list = stopsList.value
      const idx = Math.max(0, Math.min(list.length - 1, selectedStopIdx.value))
      return list[idx]
    })

    const emitUpdated = (patch: Partial<GradientOverlayModel>) => {
      const nextStops = patch.stops ?? stopsList.value
      const sorted = [...nextStops].sort((a, b) => a.offset - b.offset)
      const next: GradientOverlayModel = {
        ...overlay.value,
        ...patch,
        stops: sorted,
        startColor: sorted[0]?.color || overlay.value.startColor || 'rgba(0,0,0,0.65)',
        endColor: sorted[sorted.length - 1]?.color || overlay.value.endColor || 'rgba(0,0,0,0)',
      }
      emit('update:modelValue', next)
    }

    const updateField = <K extends keyof GradientOverlayModel>(key: K, val: GradientOverlayModel[K]) => {
      emitUpdated({ [key]: val } as Partial<GradientOverlayModel>)
    }

    const onSelectCurvePreset = (curve: GradientOverlayModel['curve']) => {
      let curveTension = 0.5
      if (curve === 'ease_in') curveTension = 0.25
      else if (curve === 'ease_out') curveTension = 0.75
      else if (curve === 'smoothstep') curveTension = 0.5
      emitUpdated({ curve, curveTension })
    }

    const curveMidpointY = computed(() => {
      return evaluateGradientCurve(0.5, overlay.value.curve || 'linear', overlay.value.curveTension)
    })

    const svgCurvePath = computed(() => {
      const pts: string[] = []
      const steps = 24
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        const val = evaluateGradientCurve(t, overlay.value.curve || 'linear', overlay.value.curveTension)
        const x = (t * 200).toFixed(1)
        const y = ((1 - val) * 44 + 2).toFixed(1)
        pts.push(`${i === 0 ? 'M' : 'L'} ${x} ${y}`)
      }
      return pts.join(' ')
    })

    const barPreviewCss = computed(() => {
      const sorted = [...stopsList.value].sort((a, b) => a.offset - b.offset)
      const stopParts = sorted.map((s) => `${s.color} ${s.offset}%`)
      return `linear-gradient(to right, ${stopParts.join(', ')})`
    })

    const addStopAtOffset = (offsetPct: number) => {
      const clamped = Math.round(Math.max(0, Math.min(100, offsetPct)))
      const current = [...stopsList.value]
      const newColor = activeStop.value?.color || 'rgba(255, 255, 255, 0.5)'
      current.push({ color: newColor, offset: clamped })
      current.sort((a, b) => a.offset - b.offset)
      const newIdx = current.findIndex((s) => s.offset === clamped && s.color === newColor)
      selectedStopIdx.value = newIdx >= 0 ? newIdx : current.length - 1
      emitUpdated({ stops: current })
    }

    const addStopAtMidpoint = () => {
      const current = [...stopsList.value].sort((a, b) => a.offset - b.offset)
      let mid = 50
      if (current.length >= 2) {
        const idx = Math.min(selectedStopIdx.value, current.length - 2)
        mid = Math.round((current[idx].offset + current[idx + 1].offset) / 2)
      }
      addStopAtOffset(mid)
    }

    const removeSelectedStop = () => {
      const current = [...stopsList.value]
      if (current.length <= 2) return
      const idx = Math.max(0, Math.min(current.length - 1, selectedStopIdx.value))
      current.splice(idx, 1)
      selectedStopIdx.value = Math.max(0, Math.min(current.length - 1, idx))
      emitUpdated({ stops: current })
    }

    const updateStopColor = (idx: number, color: string) => {
      const current = [...stopsList.value]
      if (!current[idx]) return
      current[idx] = { ...current[idx], color }
      emitUpdated({ stops: current })
    }

    const onBarPointerDown = (e: PointerEvent) => {
      if (!barRef.value) return
      const rect = barRef.value.getBoundingClientRect()
      if (rect.width <= 0) return
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      addStopAtOffset(pct)
    }

    const startDragStop = (idx: number, e: PointerEvent) => {
      selectedStopIdx.value = idx
      if (editingStopIdx.value !== null) return
      const moveHandler = (ev: PointerEvent) => {
        if (!barRef.value) return
        const rect = barRef.value.getBoundingClientRect()
        if (rect.width <= 0) return
        const pct = Math.round(Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100)))
        const next = [...stopsList.value]
        if (!next[idx]) return
        next[idx] = { ...next[idx], offset: pct }
        emit('update:modelValue', {
          ...overlay.value,
          stops: next,
          startColor: next[0]?.color || overlay.value.startColor,
          endColor: next[next.length - 1]?.color || overlay.value.endColor,
        })
      }
      const upHandler = () => {
        window.removeEventListener('pointermove', moveHandler)
        window.removeEventListener('pointerup', upHandler)
      }
      window.addEventListener('pointermove', moveHandler)
      window.addEventListener('pointerup', upHandler)
      e.preventDefault()
    }

    const startDragCurve = (e: PointerEvent) => {
      const moveHandler = (ev: PointerEvent) => {
        if (!barRef.value) return
        const rect = barRef.value.getBoundingClientRect()
        if (rect.height <= 0) return
        const normY = 1 - Math.max(0.08, Math.min(0.92, (ev.clientY - rect.top) / rect.height))
        emitUpdated({
          curve: 'custom',
          curveTension: Number(normY.toFixed(2)),
        })
      }
      const upHandler = () => {
        window.removeEventListener('pointermove', moveHandler)
        window.removeEventListener('pointerup', upHandler)
      }
      window.addEventListener('pointermove', moveHandler)
      window.addEventListener('pointerup', upHandler)
      e.preventDefault()
    }

    const startEditStopOffset = (idx: number) => {
      selectedStopIdx.value = idx
      editingStopIdx.value = idx
      editingStopDraft.value = String(Math.round(stopsList.value[idx]?.offset ?? 0))
      void nextTick(() => {
        const el = Array.isArray(stopEditInputRef.value) ? stopEditInputRef.value[0] : stopEditInputRef.value
        el?.focus()
        el?.select()
      })
    }

    const commitEditStopOffset = (idx: number) => {
      if (editingStopIdx.value !== idx) return
      const parsed = Number(editingStopDraft.value)
      editingStopIdx.value = null
      if (!Number.isFinite(parsed)) return
      const clamped = Math.round(Math.max(0, Math.min(100, parsed)))
      const next = [...stopsList.value]
      if (!next[idx]) return
      next[idx] = { ...next[idx], offset: clamped }
      emitUpdated({ stops: next })
    }

    const cancelEditStopOffset = () => {
      editingStopIdx.value = null
    }

    const directionOptions = [
      { label: 'Top → Bottom', value: 'top_to_bottom' },
      { label: 'Bottom → Top', value: 'bottom_to_top' },
      { label: 'Left → Right', value: 'left_to_right' },
      { label: 'Right → Left', value: 'right_to_left' },
      { label: 'Vignette', value: 'vignette' },
      { label: 'Radial', value: 'radial' },
    ]

    const blendModeOptions = [
      { label: 'Normal', value: 'normal' },
      { label: 'Multiply', value: 'multiply' },
      { label: 'Screen', value: 'screen' },
      { label: 'Overlay', value: 'overlay' },
      { label: 'Soft Light', value: 'soft-light' },
      { label: 'Hard Light', value: 'hard-light' },
      { label: 'Color Dodge', value: 'color-dodge' },
      { label: 'Color Burn', value: 'color-burn' },
      { label: 'Darken', value: 'darken' },
      { label: 'Lighten', value: 'lighten' },
      { label: 'Difference', value: 'difference' },
      { label: 'Exclusion', value: 'exclusion' },
    ]

    const curveOptions = [
      { label: 'Linear', value: 'linear' },
      { label: 'Smoothstep', value: 'smoothstep' },
      { label: 'Ease In', value: 'ease_in' },
      { label: 'Ease Out', value: 'ease_out' },
      { label: 'Custom Curve', value: 'custom' },
    ]

    const colorPresets = [
      { label: 'Dark Shade', value: 'rgba(0,0,0,0.75)' },
      { label: 'Transparent', value: 'rgba(0,0,0,0)' },
      { label: 'Parchment', value: 'rgba(253,241,220,0.85)' },
      { label: 'Warm Gold', value: 'rgba(212,163,89,0.55)' },
      { label: 'Crimson', value: 'rgba(88,24,13,0.65)' },
    ]

    return {
      barRef,
      overlay,
      stopsList,
      selectedStopIdx,
      activeStop,
      editingStopIdx,
      editingStopDraft,
      stopEditInputRef,
      curveMidpointY,
      svgCurvePath,
      barPreviewCss,
      directionOptions,
      blendModeOptions,
      curveOptions,
      colorPresets,
      updateField,
      onSelectCurvePreset,
      addStopAtMidpoint,
      removeSelectedStop,
      updateStopColor,
      onBarPointerDown,
      startDragStop,
      startDragCurve,
      startEditStopOffset,
      commitEditStopOffset,
      cancelEditStopOffset,
    }
  },
})
</script>

<style scoped>
.gradient-interactive-bar {
  position: relative;
  height: 48px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  cursor: crosshair;
  user-select: none;
  touch-action: none;
  margin: 6px 10px 18px 10px;
}

.gradient-checkerboard {
  position: absolute;
  inset: 0;
  border-radius: 5px;
  background-image:
    linear-gradient(45deg, #444 25%, transparent 25%),
    linear-gradient(-45deg, #444 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #444 75%),
    linear-gradient(-45deg, transparent 75%, #444 75%);
  background-size: 10px 10px;
  background-position: 0 0, 0 5px, 5px -5px, -5px 0;
  background-color: #2a2a2a;
}

.gradient-live-fill {
  position: absolute;
  inset: 0;
  border-radius: 5px;
}

.gradient-falloff-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.curve-control-knob {
  position: absolute;
  transform: translate(-50%, -50%);
  min-width: 28px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: rgba(255, 193, 7, 0.95);
  border: 1.5px solid #1a1a1a;
  color: #111;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ns-resize;
  z-index: 4;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.65);
}

.gradient-stop-knob {
  position: absolute;
  bottom: -14px;
  transform: translateX(-50%);
  min-width: 30px;
  height: 20px;
  padding: 0 4px;
  border-radius: 4px;
  background: #212121;
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: ew-resize;
  z-index: 5;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.7);
}

.gradient-stop-knob.is-selected {
  border-color: #ffca28;
  box-shadow: 0 0 0 2px rgba(255, 202, 40, 0.45), 0 2px 6px rgba(0, 0, 0, 0.8);
}

.stop-color-chip {
  width: 9px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.stop-offset-text {
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.stop-inline-input {
  width: 34px;
  height: 15px;
  padding: 0 2px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: #111;
  border: 1px solid #ffca28;
  border-radius: 2px;
  outline: none;
}

.selected-stop-swatch {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1.5px solid rgba(255, 255, 255, 0.65);
  flex-shrink: 0;
}
</style>
