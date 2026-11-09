<template>
  <q-icon :name="icon" size="xs" class="help-tip cursor-pointer" tabindex="0" role="img" :aria-label="text">
    <q-tooltip class="text-caption" max-width="280px">{{ text }}</q-tooltip>
  </q-icon>
</template>

<script setup lang="ts">
/** A13.3: a focusable help icon for controls whose slot can host it (Quasar #append/#after). */
withDefaults(defineProps<{ text: string; icon?: string }>(), { icon: 'help_outline' })
</script>

<style scoped>
.help-tip { opacity: 0.65; }
.help-tip:hover, .help-tip:focus-visible { opacity: 1; }
</style>
