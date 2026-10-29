<template>
  <div class="dual-knob-crop-slider q-pa-xs rounded-borders" style="background: rgba(15, 23, 42, 0.65); border: 1px solid rgba(255, 255, 255, 0.12);">
    <div class="text-caption text-weight-bold row items-center justify-between q-mb-xs" :class="labelColorClass">
      <span class="flex items-center">
        <q-icon name="crop" size="14px" class="q-mr-xs" />
        {{ label }}
      </span>
      <div class="row items-center q-gutter-x-xs">
        <span class="text-grey-4 text-caption font-mono">
          {{ startLabel }}: {{ cropStartAmount }}% | {{ endLabel }}: {{ cropEndAmount }}%
        </span>
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

    <!-- Dual Knob Q-Range Slider -->
    <div class="q-px-sm q-py-xs">
      <q-range
        :model-value="safeRange"
        :min="0"
        :max="100"
        :step="1"
        :color="color || 'cyan'"
        label-always
        dense
        @update:model-value="onRangeUpdate"
      />
    </div>

    <!-- Manual Numeric Input Controls (Dual-mode: Drag Knobs OR Type Exact Percentages) -->
    <div class="row q-col-gutter-xs items-center q-mt-xs">
      <div class="col-6">
        <q-input
          :model-value="cropStartAmount"
          type="number"
          min="0"
          max="95"
          dense
          outlined
          dark
          :label="`Crop ${startLabel} (%)`"
          input-class="text-caption text-center"
          @update:model-value="onStartAmountInput"
        />
      </div>
      <div class="col-6">
        <q-input
          :model-value="cropEndAmount"
          type="number"
          min="0"
          max="95"
          dense
          outlined
          dark
          :label="`Crop ${endLabel} (%)`"
          input-class="text-caption text-center"
          @update:model-value="onEndAmountInput"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'

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

    const onRangeUpdate = (val: { min: number; max: number }) => {
      emit('update:modelValue', {
        min: Math.max(0, Math.min(val.min, val.max - 1)),
        max: Math.min(100, Math.max(val.max, val.min + 1)),
      })
    }

    const onStartAmountInput = (val: string | number | null) => {
      const num = typeof val === 'number' ? val : (val ? parseFloat(val) : 0)
      const clamped = Math.max(0, Math.min(safeRange.value.max - 1, isNaN(num) ? 0 : num))
      emit('update:modelValue', {
        min: clamped,
        max: safeRange.value.max,
      })
    }

    const onEndAmountInput = (val: string | number | null) => {
      const num = typeof val === 'number' ? val : (val ? parseFloat(val) : 0)
      const safeEnd = Math.max(0, Math.min(100 - safeRange.value.min - 1, isNaN(num) ? 0 : num))
      emit('update:modelValue', {
        min: safeRange.value.min,
        max: 100 - safeEnd,
      })
    }

    const resetCrop = () => {
      emit('update:modelValue', { min: 0, max: 100 })
    }

    return {
      safeRange,
      cropStartAmount,
      cropEndAmount,
      labelColorClass,
      onRangeUpdate,
      onStartAmountInput,
      onEndAmountInput,
      resetCrop,
    }
  },
})
</script>
