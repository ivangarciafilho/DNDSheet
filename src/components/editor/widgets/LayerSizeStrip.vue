<template>
  <div class="layer-size-strip full-width q-mt-xs" data-layer-size-strip>
    <div class="row items-center justify-between text-caption">
      <span class="text-weight-bold" :class="`text-${color}-3`">Size</span>
      <q-btn
        flat
        dense
        round
        size="xs"
        :icon="linked ? 'link' : 'link_off'"
        :color="linked ? `${color}-4` : 'grey-5'"
        :aria-pressed="linked"
        aria-label="Link width and height"
        data-size-link
        @click="toggleLink"
      >
        <q-tooltip class="bg-grey-9 text-caption">{{ linked ? 'Linked: one uniform scale slider' : 'Unlinked: separate width and height' }}</q-tooltip>
      </q-btn>
    </div>
    <!-- Linked: one handle. Unlinked: width and height replace it, so no two sliders ever drive the same size. -->
    <div v-if="linked" class="row items-center no-wrap q-gutter-x-sm" data-size-uniform>
      <span class="size-label">Scale</span>
      <q-slider
        v-help="'Scale this image uniformly around its focal point.'"
        :model-value="scale"
        :min="25"
        :max="300"
        :step="1"
        :color="`${color}-5`"
        dense
        class="col"
        aria-label="Uniform scale"
        @update:model-value="(value) => $emit('update:scale', value ?? 100)"
      />
      <span class="size-value">{{ scale }}%</span>
    </div>
    <template v-else>
      <div class="row items-center no-wrap q-gutter-x-sm" data-size-width>
        <span class="size-label">W</span>
        <q-slider
          v-help="'Stretch or compress this image horizontally.'"
          :model-value="Math.round((scale * scaleX) / 100)"
          :min="10"
          :max="400"
          :step="1"
          :color="`${color}-5`"
          dense
          class="col"
          aria-label="Image width"
          @update:model-value="(value) => $emit('update:scaleX', axisFromEffective(value))"
        />
        <span class="size-value">{{ Math.round((scale * scaleX) / 100) }}%</span>
      </div>
      <div class="row items-center no-wrap q-gutter-x-sm" data-size-height>
        <span class="size-label">H</span>
        <q-slider
          v-help="'Stretch or compress this image vertically.'"
          :model-value="Math.round((scale * scaleY) / 100)"
          :min="10"
          :max="400"
          :step="1"
          :color="`${color}-5`"
          dense
          class="col"
          aria-label="Image height"
          @update:model-value="(value) => $emit('update:scaleY', axisFromEffective(value))"
        />
        <span class="size-value">{{ Math.round((scale * scaleY) / 100) }}%</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Build 269: width, height and uniform scale live in the post-crop radial card as one size control.
// The stored model is unchanged (uniform `scale` x per-axis `scaleX`/`scaleY`); the W/H sliders show and
// set the effective size (scale x axis), so the numbers match what the page renders.
const props = withDefaults(defineProps<{ scale?: number; scaleX?: number; scaleY?: number; color?: string }>(), {
  scale: 100,
  scaleX: 100,
  scaleY: 100,
  color: 'cyan',
})
const emit = defineEmits<{ 'update:scale': [value: number]; 'update:scaleX': [value: number]; 'update:scaleY': [value: number] }>()

const linked = ref(props.scaleX === props.scaleY)
const axisFromEffective = (effective: number | null) => Math.max(1, Math.round(((effective ?? 100) * 100) / (props.scale || 100)))

// Linking folds a stretched shape back to a uniform one at the average size, so nothing jumps unexpectedly.
function toggleLink() {
  if (!linked.value) {
    const average = Math.round((props.scaleX + props.scaleY) / 2)
    emit('update:scale', Math.round((props.scale * average) / 100))
    emit('update:scaleX', 100)
    emit('update:scaleY', 100)
  }
  linked.value = !linked.value
}
</script>

<style scoped>
.size-label {
  width: 2.4rem;
  font-size: 11px;
  opacity: 0.8;
}
.size-value {
  width: 2.8rem;
  text-align: right;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
</style>
