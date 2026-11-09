<template>
  <q-btn
    flat
    dense
    round
    :icon="locked ? 'lock' : 'lock_open'"
    :color="locked ? 'grey-8' : 'warning'"
    size="sm"
    class="q-ma-none lock-toggle-btn"
    @click.stop="$emit('click', $event)"
  >
    <q-tooltip class="text-body2">
      {{ locked ? lockTooltip : unlockTooltip }}
    </q-tooltip>
  </q-btn>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'

export default defineComponent({
  name: 'LockToggleButton',
  emits: ['click'],
  props: {
    locked: {
      type: Boolean,
      required: true,
    },
    lockTooltip: {
      type: String,
      required: true,
    },
    unlockTooltip: {
      type: String,
      required: true,
    },
  },
})
</script>

<style scoped>
.lock-toggle-btn {
  pointer-events: auto !important;
  cursor: pointer !important;
}
</style>
