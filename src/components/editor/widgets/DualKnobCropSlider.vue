<template>
  <div class="dual-knob-crop-slider q-pa-xs rounded-borders" style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255, 255, 255, 0.12);">
    <div class="text-caption text-weight-bold row items-center justify-between q-mb-xs" :class="labelColorClass">
      <span class="flex items-center">
        <q-icon name="crop" size="14px" class="q-mr-xs" />
        {{ label }}
      </span>
      <div class="row items-center q-gutter-x-xs">
        <span class="text-grey-5" style="font-size: 9px">Dbl-click knob</span>
        <q-btn
          flat
          round
          dense
          size="xs"
          icon="restart_alt"
          color="grey-4"
          @click="resetCrop"
        >
          <q-tooltip class="bg-grey-9 text-caption">Reset Crop (0%)</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Custom Dual-Knob Track with Values Inside Knobs & Double-Click Manual Edit + Per-Side Resets -->
    <div class="row items-center no-wrap q-px-xs q-py-sm">
      <q-btn
        flat
        round
        dense
        size="xs"
        icon="restart_alt"
        color="grey-4"
        class="q-mr-xs"
        data-reset-knob="min"
        :aria-label="`Reset ${startLabel} Crop`"
        @click.stop="resetMin"
      >
        <q-tooltip class="bg-grey-9 text-caption">Reset {{ startLabel }} Crop (0%)</q-tooltip>
      </q-btn>
      <div
        ref="trackRef"
        class="crop-slider-track col relative-position cursor-pointer"
      >
        <div
          class="crop-active-bar"
          :style="{
            left: `${safeRange.min}%`,
            width: `${Math.max(0, safeRange.max - safeRange.min)}%`,
          }"
        ></div>

        <!-- Start Crop Knob -->
        <div
          class="crop-value-knob"
          :class="'knob-' + (color || 'cyan')"
          :style="{ left: `${safeRange.min}%` }"
          :title="`${startLabel} Crop % (Drag or double-click to edit)`"
          @mousedown.stop="startKnobDrag('min', $event)"
          @dblclick.stop="startEdit('min')"
        >
          <input
            v-if="editingWhich === 'min'"
            ref="knobInputRef"
            v-model="editingText"
            type="number"
            class="knob-inline-input"
            @keydown.enter.prevent="commitEdit"
            @keydown.esc.prevent="cancelEdit"
            @blur="commitEdit"
            @mousedown.stop
          />
          <span v-else>{{ Math.round(cropStartAmount) }}%</span>
        </div>

        <!-- End Crop Knob -->
        <div
          class="crop-value-knob"
          :class="'knob-' + (color || 'cyan')"
          :style="{ left: `${safeRange.max}%` }"
          :title="`${endLabel} Crop % (Drag or double-click to edit)`"
          @mousedown.stop="startKnobDrag('max', $event)"
          @dblclick.stop="startEdit('max')"
        >
          <input
            v-if="editingWhich === 'max'"
            ref="knobInputRef"
            v-model="editingText"
            type="number"
            class="knob-inline-input"
            @keydown.enter.prevent="commitEdit"
            @keydown.esc.prevent="cancelEdit"
            @blur="commitEdit"
            @mousedown.stop
          />
          <span v-else>{{ Math.round(cropEndAmount) }}%</span>
        </div>
      </div>
      <q-btn
        flat
        round
        dense
        size="xs"
        icon="restart_alt"
        color="grey-4"
        class="q-ml-xs"
        data-reset-knob="max"
        :aria-label="`Reset ${endLabel} Crop`"
        @click.stop="resetMax"
      >
        <q-tooltip class="bg-grey-9 text-caption">Reset {{ endLabel }} Crop (0%)</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, nextTick, PropType } from 'vue'

export interface CropRange {
  min: number
  max: number
}

export default defineComponent({
  name: 'DualKnobCropSlider',
  props: {
    modelValue: {
      type: Object as PropType<CropRange>,
      required: true,
      default: () => ({ min: 0, max: 100 }),
    },
    label: {
      type: String,
      default: 'Edge Cropping',
    },
    startLabel: {
      type: String,
      default: 'Start',
    },
    endLabel: {
      type: String,
      default: 'End',
    },
    color: {
      type: String,
      default: 'cyan',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const trackRef = ref<HTMLElement | null>(null)
    const editingWhich = ref<'min' | 'max' | null>(null)
    const editingText = ref<string>('')
    const knobInputRef = ref<HTMLInputElement | null>(null)

    const safeRange = computed<CropRange>(() => {
      const min = props.modelValue?.min ?? 0
      const max = props.modelValue?.max ?? 100
      return { min, max }
    })

    const cropStartAmount = computed(() => safeRange.value.min)
    const cropEndAmount = computed(() => 100 - safeRange.value.max)

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

    const startKnobDrag = (which: 'min' | 'max', e: MouseEvent) => {
      if (editingWhich.value) return
      e.preventDefault()
      const updateFromClientX = (clientX: number) => {
        if (!trackRef.value) return
        const rect = trackRef.value.getBoundingClientRect()
        const pct = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / Math.max(1, rect.width)) * 100)))
        if (which === 'min') {
          emit('update:modelValue', {
            min: Math.max(0, Math.min(pct, safeRange.value.max - 1)),
            max: safeRange.value.max,
          })
        } else {
          emit('update:modelValue', {
            min: safeRange.value.min,
            max: Math.min(100, Math.max(pct, safeRange.value.min + 1)),
          })
        }
      }
      const onMove = (ev: MouseEvent) => updateFromClientX(ev.clientX)
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    const startEdit = (which: 'min' | 'max') => {
      editingWhich.value = which
      editingText.value = String(Math.round(which === 'min' ? cropStartAmount.value : cropEndAmount.value))
      void nextTick(() => {
        if (knobInputRef.value) {
          knobInputRef.value.focus()
          knobInputRef.value.select()
        }
      })
    }

    const commitEdit = () => {
      if (!editingWhich.value) return
      const which = editingWhich.value
      const num = parseFloat(editingText.value)
      editingWhich.value = null
      if (isNaN(num)) return

      if (which === 'min') {
        const clamped = Math.max(0, Math.min(safeRange.value.max - 1, Math.round(num)))
        emit('update:modelValue', { min: clamped, max: safeRange.value.max })
      } else {
        const safeEnd = Math.max(0, Math.min(100 - safeRange.value.min - 1, Math.round(num)))
        emit('update:modelValue', { min: safeRange.value.min, max: 100 - safeEnd })
      }
    }

    const cancelEdit = () => {
      editingWhich.value = null
    }

    const resetMin = () => {
      emit('update:modelValue', { min: 0, max: safeRange.value.max })
    }

    const resetMax = () => {
      emit('update:modelValue', { min: safeRange.value.min, max: 100 })
    }

    const resetCrop = () => {
      emit('update:modelValue', { min: 0, max: 100 })
    }

    return {
      trackRef,
      editingWhich,
      editingText,
      knobInputRef,
      safeRange,
      cropStartAmount,
      cropEndAmount,
      labelColorClass,
      startKnobDrag,
      startEdit,
      commitEdit,
      cancelEdit,
      resetMin,
      resetMax,
      resetCrop,
    }
  },
})
</script>

<style scoped>
.crop-slider-track {
  height: 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.35);
  user-select: none;
}

.crop-active-bar {
  position: absolute;
  top: 1px;
  bottom: 1px;
  background: rgba(56, 189, 248, 0.28);
  border-radius: 999px;
  pointer-events: none;
}

.crop-value-knob {
  position: absolute;
  top: 50%;
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
  z-index: 2;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}

.knob-cyan {
  border-color: #22d3ee;
}
.knob-amber {
  border-color: #fbbf24;
}
.knob-purple {
  border-color: #c084fc;
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
</style>
