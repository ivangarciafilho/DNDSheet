<template>
  <nav
    class="section-strip q-mb-xs"
    aria-label="Editor sections"
    data-section-strip
    @keydown="onStripKeydown"
  >
    <button
      v-for="(section, idx) in sections"
      :key="section.id"
      :ref="(el) => setButtonRef(idx, el)"
      type="button"
      class="section-strip__pill"
      :class="{ 'section-strip__pill--active': activeSectionId === section.id }"
      :data-section-jump="section.id"
      :aria-current="activeSectionId === section.id ? 'location' : undefined"
      @click="jumpToSection(section.id)"
    >
      <q-icon :name="section.icon" size="14px" class="section-strip__icon" />
      <span>{{ section.shortLabel }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { WORKSPACE_SECTIONS } from 'src/core/domain/workspace-sections'

const sections = WORKSPACE_SECTIONS
const activeSectionId = ref<string>('basics')
const buttonRefs = ref<(HTMLElement | null)[]>([])

function setButtonRef(index: number, el: unknown) {
  buttonRefs.value[index] = el instanceof HTMLElement ? el : null
}

function jumpToSection(sectionId: string) {
  activeSectionId.value = sectionId
  const root = document.getElementById('editor')
  if (!root) return
  const target = root.querySelector<HTMLElement>(`[data-editor-section="${sectionId}"]`)
  if (!target) return

  const headerBtn = target.querySelector<HTMLElement>('.q-expansion-item__container > .q-item')
  const isCollapsed =
    target.classList.contains('q-expansion-item--collapsed') ||
    headerBtn?.getAttribute('aria-expanded') === 'false'

  if (isCollapsed && headerBtn) {
    headerBtn.click()
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' })

  window.setTimeout(() => {
    const focusable = target.querySelector<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]):not(.q-expansion-item__toggle-icon)',
    )
    if (focusable) focusable.focus({ preventScroll: true })
    else headerBtn?.focus({ preventScroll: true })
  }, 60)
}

function onStripKeydown(event: KeyboardEvent) {
  const buttons = buttonRefs.value
  const currentIdx = buttons.findIndex((b) => b === document.activeElement)
  if (currentIdx < 0) return

  let nextIdx = -1
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextIdx = (currentIdx + 1) % sections.length
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextIdx = (currentIdx - 1 + sections.length) % sections.length
  } else if (event.key === 'Home') {
    nextIdx = 0
  } else if (event.key === 'End') {
    nextIdx = sections.length - 1
  }
  if (nextIdx >= 0) {
    event.preventDefault()
    buttonRefs.value[nextIdx]?.focus()
  }
}
</script>

<style scoped lang="scss">
.section-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.1);
  border: 1px solid rgba(128, 128, 128, 0.2);
}

.section-strip__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 14px;
  border: 1px solid rgba(128, 128, 128, 0.25);
  background: transparent;
  color: inherit;
  font-size: 0.72rem;
  line-height: 1.3;
  cursor: pointer;
  white-space: nowrap;
}

.section-strip__pill:hover,
.section-strip__pill:focus-visible {
  background: rgba(25, 118, 210, 0.16);
  border-color: rgba(25, 118, 210, 0.6);
  outline: none;
}

.section-strip__pill--active {
  background: rgba(25, 118, 210, 0.22);
  border-color: rgba(25, 118, 210, 0.85);
  font-weight: 600;
}
</style>
