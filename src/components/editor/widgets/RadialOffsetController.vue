<template>
  <div class="radial-offset-controller column items-center q-pa-xs">
    <div class="text-caption text-weight-bold row items-center justify-between full-width q-mb-xs" :class="labelColorClass">
      <span class="flex items-center">
        <q-icon :name="icon || 'radar'" size="14px" class="q-mr-xs" />
        {{ label }}
      </span>
      <q-btn
        flat
        round
        dense
        size="xs"
        icon="restart_alt"
        color="grey-4"
        @click="resetToCenter"
      >
        <q-tooltip class="bg-grey-9 text-caption">Reset (0, 0)</q-tooltip>
      </q-btn>
    </div>

    <!-- 2D Circular Radar Pad -->
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

    <!-- Manual Numeric Typing Inputs (Dual-mode: Drag Radar OR Type Exact Numbers) -->
    <div class="row q-col-gutter-xs full-width q-mt-xs items-center">
      <div class="col-6">
        <q-input
          :model-value="x"
          type="number"
          :min="min"
          :max="max"
          :step="step || 1"
          dense
          outlined
          dark
          :label="`X (${unit || 'px'})`"
          input-class="text-caption text-center"
          @update:model-value="onUpdateX"
        />
      </div>
      <div class="col-6">
        <q-input
          :model-value="y"
          type="number"
          :min="min"
          :max="max"
          :step="step || 1"
          dense
          outlined
          dark
          :label="`Y (${unit || 'px'})`"
          input-class="text-caption text-center"
          @update:model-value="onUpdateY"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'

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
  emits: ['update:x', 'update:y'],
  setup(props, { emit }) {
    const radarPadRef = ref<HTMLElement | null>(null)

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

    // Map [min, max] value to [0, 100] percentage for puck coordinates
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

      // Center-relative coordinates [-radius, +radius]
      let dx = clientX - (rect.left + radius)
      let dy = clientY - (rect.top + radius)

      // Clamp inside circular boundary
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > radius) {
        dx = (dx / dist) * radius
        dy = (dy / dist) * radius
      }

      // Map normalized [-1, 1] to [min, max]
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

    const resetToCenter = () => {
      emit('update:x', 0)
      emit('update:y', 0)
    }

    const onUpdateX = (val: string | number | null) => {
      const num = typeof val === 'number' ? val : (val ? parseFloat(val) : 0)
      emit('update:x', isNaN(num) ? 0 : num)
    }

    const onUpdateY = (val: string | number | null) => {
      const num = typeof val === 'number' ? val : (val ? parseFloat(val) : 0)
      emit('update:y', isNaN(num) ? 0 : num)
    }

    return {
      radarPadRef,
      labelColorClass,
      puckLeftPercent,
      puckTopPercent,
      startDrag,
      startTouch,
      resetToCenter,
      onUpdateX,
      onUpdateY,
    }
  },
})
</script>

<style scoped>
.radial-offset-controller {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  min-width: 140px;
}

.radar-pad-disc {
  width: 90px;
  height: 90px;
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
</style>
