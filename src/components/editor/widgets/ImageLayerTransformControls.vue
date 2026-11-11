<template>
  <div class="row q-col-gutter-xs items-center" role="group" aria-label="Image shape">
    <div class="col-12 col-sm-6">
      <div class="row justify-between text-caption">
        <span>Image width</span>
        <span>{{ layer.scaleX ?? 100 }}%</span>
      </div>
      <q-slider
        :model-value="layer.scaleX ?? 100"
        :min="25" :max="300" :step="1"
        aria-label="Image width"
        dense
        @update:model-value="value => $emit('change', { scaleX: value ?? 100 })"
      />
    </div>
    <div class="col-12 col-sm-6">
      <div class="row justify-between text-caption">
        <span>Image height</span>
        <span>{{ layer.scaleY ?? 100 }}%</span>
      </div>
      <q-slider
        :model-value="layer.scaleY ?? 100"
        :min="25" :max="300" :step="1"
        aria-label="Image height"
        dense
        @update:model-value="value => $emit('change', { scaleY: value ?? 100 })"
      />
    </div>
    <div class="col-12 row q-gutter-xs">
      <q-btn
        dense flat no-caps icon="rotate_right" label="Rotate 90°"
        @click="$emit('change', { rotation: ((layer.rotation ?? 0) + 90) % 360 })"
      >
        <q-tooltip>Rotation: {{ layer.rotation ?? 0 }}° clockwise</q-tooltip>
      </q-btn>
      <q-btn
        dense flat no-caps icon="flip" label="Mirror horizontally"
        :color="layer.mirrorHorizontal ? 'cyan-4' : undefined"
        :aria-pressed="Boolean(layer.mirrorHorizontal)"
        @click="$emit('change', { mirrorHorizontal: !layer.mirrorHorizontal })"
      />
      <q-btn
        dense flat no-caps label="Mirror vertically"
        :color="layer.mirrorVertical ? 'cyan-4' : undefined"
        :aria-pressed="Boolean(layer.mirrorVertical)"
        @click="$emit('change', { mirrorVertical: !layer.mirrorVertical })"
      >
        <q-icon name="flip" class="q-mr-xs rotate-90" />
      </q-btn>
      <q-btn
        dense flat no-caps label="Reset shape"
        @click="$emit('change', { scaleX: 100, scaleY: 100, rotation: 0, mirrorHorizontal: false, mirrorVertical: false })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { A4CompositionLayer } from 'src/stores/editor-store'

defineProps<{ layer: A4CompositionLayer }>()
defineEmits<{ change: [patch: Partial<A4CompositionLayer>] }>()
</script>
