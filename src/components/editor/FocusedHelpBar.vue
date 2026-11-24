<template>
  <div
    class="focused-help-bar row items-center no-wrap q-px-sm q-py-xs q-mb-xs rounded-borders"
    role="status"
    aria-live="polite"
    data-focused-help-bar
  >
    <q-icon name="help_outline" size="16px" class="focused-help-bar__icon q-mr-xs col-auto" />
    <div class="focused-help-bar__body text-caption">
      <strong v-if="activeLabel" class="focused-help-bar__label q-mr-xs">{{ activeLabel }}:</strong>
      <span v-else class="focused-help-bar__label text-weight-medium q-mr-xs">{{ $t('studio.focusedHelp.title') }}:</span>
      <span class="focused-help-bar__text">{{ activeText || $t('studio.focusedHelp.idleHint') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const activeLabel = ref('')
const activeText = ref('')

const resolveControlLabel = (target: HTMLElement): string => {
  const aria = target.getAttribute('aria-label')?.trim()
  if (aria) return aria
  const field = target.closest('.q-field, .q-toggle, .q-checkbox, .q-btn-toggle, .q-btn')
  const fieldLabel = field?.querySelector('.q-field__label, .q-toggle__label, .q-checkbox__label')?.textContent?.trim()
  if (fieldLabel) return fieldLabel
  return target.textContent?.trim().slice(0, 36) ?? ''
}

const syncFromEvent = (event: Event) => {
  const rawTarget = event.target
  if (!(rawTarget instanceof HTMLElement)) return
  const helped = rawTarget.closest<HTMLElement>('[data-help-text]')
  if (!helped) return
  const text = helped.dataset.helpText?.trim() ?? ''
  if (!text) return
  activeText.value = text
  activeLabel.value = resolveControlLabel(helped)
}

onMounted(() => {
  const editorRoot = document.getElementById('editor')
  if (!editorRoot) return
  editorRoot.addEventListener('focusin', syncFromEvent, true)
  editorRoot.addEventListener('pointerover', syncFromEvent, true)
})

onBeforeUnmount(() => {
  const editorRoot = document.getElementById('editor')
  if (!editorRoot) return
  editorRoot.removeEventListener('focusin', syncFromEvent, true)
  editorRoot.removeEventListener('pointerover', syncFromEvent, true)
})
</script>

<style>
.focused-help-bar {
  --fhb-bg: #eef2ff;
  --fhb-border: rgba(30, 64, 175, 0.35);
  --fhb-accent: #1e3a8a;
  --fhb-text: #111827;
}

body.body--dark .focused-help-bar {
  --fhb-bg: rgba(30, 58, 138, 0.28);
  --fhb-border: rgba(96, 165, 250, 0.4);
  --fhb-accent: #b3e5fc;
  --fhb-text: #f5f5f5;
}
</style>

<style scoped>
.focused-help-bar {
  max-width: 100%;
  box-sizing: border-box;
  overflow-wrap: anywhere;
  background: var(--fhb-bg);
  border: 1px solid var(--fhb-border);
}

.focused-help-bar__icon,
.focused-help-bar__label {
  color: var(--fhb-accent);
}

.focused-help-bar__text {
  color: var(--fhb-text);
}

.focused-help-bar__body {
  min-width: 0;
  line-height: 1.35;
}
</style>
