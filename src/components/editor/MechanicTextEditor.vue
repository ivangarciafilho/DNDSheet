<template>
  <div class="mechanic-text-editor" :class="$attrs.class" :style="$attrs.style as StyleValue" data-enter-local>
    <q-input v-if="!rich" ref="inputRef" v-bind="$attrs" :model-value="modelValue" :label="label" @update:model-value="onInput" @keydown="onKeydown" @blur="closeSuggest">
      <template v-for="(_, name) in forwardedSlots" #[name]="scope"><slot :name="name" v-bind="scope || {}" /></template>
      <template #append>
        <slot name="append" />
        <q-btn type="button" flat dense size="sm" icon="data_object" :disable="Boolean($attrs.disable || $attrs.readonly)" :aria-label="'Insert a formula or macro into '+label" data-macro-browse @click.stop="browse = true">
          <q-tooltip>Insert a formula, reference or macro. Typing { also suggests them.</q-tooltip>
          <macro-browse-menu v-model="browse" :scope="scope" @pick="insertEntry" />
        </q-btn>
        <q-btn type="button" flat dense size="sm" icon="format_bold" label="Format" :disable="Boolean($attrs.disable || $attrs.readonly)" :aria-label="'Format '+label" @click.stop="formatting = true"><q-tooltip>Format this text</q-tooltip></q-btn>
      </template>
      <q-menu v-model="suggestOpen" no-focus no-refocus fit anchor="bottom left" self="top left" class="macro-suggest-menu" data-macro-suggest>
        <q-list dense role="listbox" :aria-label="'Suggestions for '+label">
          <q-item v-for="(entry, index) in suggestions" :key="entry.insert" clickable dense role="option" :aria-selected="index === active" :active="index === active" active-class="macro-suggest-active" @mousedown.prevent="pick(entry)">
            <q-item-section>
              <q-item-label class="macro-suggest-label">{{ entry.label }}</q-item-label>
              <q-item-label caption><code>{{ entry.insert }}</code> · {{ entry.group }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-input>
    <div v-else class="mechanic-text-editor__formatted">
      <div class="row items-center justify-between q-mb-xs">
        <span class="text-caption">{{ label }}</span>
        <div class="row items-center no-wrap">
          <slot name="append" />
          <q-btn type="button" flat dense size="sm" icon="data_object" :disable="Boolean($attrs.disable || $attrs.readonly)" :aria-label="'Insert a formula or macro into '+label" data-macro-browse @click.stop="browse = true">
            <q-tooltip>Insert a formula, reference or macro.</q-tooltip>
            <macro-browse-menu v-model="browse" :scope="scope" @pick="insertEntry" />
          </q-btn>
        </div>
      </div>
      <q-editor ref="editorRef" :disable="Boolean($attrs.disable)" :readonly="Boolean($attrs.readonly)" :model-value="editorValue" :toolbar="toolbar" min-height="3rem" :content-class="'mechanic-text-editor__content'" :aria-label="label" @keydown.stop @keyup.stop @update:model-value="value => emitValue(mechanicRichHtml(value))" />
      <macro-suggest-popup :open="richSuggest.open.value" :entries="richSuggest.entries.value" :active="richSuggest.active.value" :x="richSuggest.x.value" :y="richSuggest.y.value" :label="'Suggestions for '+label" @pick="richSuggest.pick" />
    </div>
    <div v-if="preview" class="mechanic-text-editor__preview" :class="{ 'is-unresolved': preview.unknown.length > 0 }" data-macro-preview aria-live="polite">
      <template v-if="preview.unknown.length">Not recognised: {{ preview.unknown.join(', ') }}</template>
      <template v-else>Prints: {{ preview.text }}</template>
    </div>
  </div>
</template>
<script lang="ts">
import type { PropType, StyleValue } from 'vue'
import { computed, defineComponent, nextTick, ref, useSlots, watch } from 'vue'
import { hasMechanicFormatting, mechanicPlainText, mechanicRichHtml } from 'src/core/domain/mechanic-rich-text'
import { catalogFor, insertMacro, openMacroAt, unresolvedMacros } from 'src/core/domain/macro-catalog'
import type { MacroEntry, MacroScope } from 'src/core/domain/macro-catalog'
import { useMonsterStore } from 'src/stores/monster-store'
import { useCharacterStore } from 'src/stores/character-store'
import { resolveCharacterText } from 'src/core/usecases/ResolveMonsterText'
import { useProcessTokens } from '../rendering/useProcessTokens'
import MacroBrowseMenu from './MacroBrowseMenu.vue'
import MacroSuggestPopup from './MacroSuggestPopup.vue'
import { useRichMacroAutocomplete } from './useRichMacroAutocomplete'

// Plain text by default; formulas and macros resolve silently in the preview and on the stat block.
export default defineComponent({
  name: 'MechanicTextEditor',
  components: { MacroBrowseMenu, MacroSuggestPopup },
  inheritAttrs: false,
  props: {
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, default: 'Mechanic text' },
    forceRich: { type: Boolean, default: false },
    /** Which tokens this field's renderer resolves; filters suggestions. */
    scope: { type: String as PropType<MacroScope>, default: 'mechanic' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const formatting = ref(false), browse = ref(false), slots = useSlots()
    const inputRef = ref<{ $el?: HTMLElement } | null>(null), editorRef = ref<{ runCmd?: (cmd: string, value?: string) => void; focus?: () => void; getContentEl?: () => HTMLElement } | null>(null)
    const forwardedSlots = Object.fromEntries(Object.entries(slots).filter(([name]) => name !== 'append'))
    const rich = computed(() => props.forceRich || formatting.value || hasMechanicFormatting(props.modelValue))
    const editorValue = computed(() => mechanicRichHtml(props.modelValue))
    const toolbar = [['bold', 'italic', 'underline', 'strike'], ['subscript', 'superscript'], ['unordered', 'ordered'], ['undo', 'redo', 'removeFormat']]
    const emitValue = (value: string) => emit('update:modelValue', value)

    const monster = useMonsterStore()
    const character = useCharacterStore()
    const { processTokens } = useProcessTokens()
    // Character fields resolve against the character; every other field against the monster.
    const render = (html: string): string => props.scope === 'character'
      ? resolveCharacterText(html, character.actor)
      : String(processTokens(html, undefined as never, monster, 'none') ?? '')
    const custom = () => props.scope === 'character' ? {} : ({
      customVariables: (monster as unknown as { customVariables?: Record<string, unknown> }).customVariables,
      customMacros: (monster as unknown as { customMacros?: Record<string, unknown> }).customMacros,
    })
    const contextInserts = computed(() => new Set(catalogFor({ scope: props.scope }).filter(entry => entry.kind === 'context').map(entry => entry.insert.toLowerCase())))

    // Passive evaluation: shown only when the text holds a macro.
    const preview = computed(() => {
      const source = String(props.modelValue ?? '')
      if (!source.includes('{')) return null
      let rendered = source
      try { rendered = render(mechanicRichHtml(source)) } catch { rendered = source }
      const unknown = unresolvedMacros(rendered).filter(token => !contextInserts.value.has(token.toLowerCase()))
      return { text: mechanicPlainText(rendered), unknown }
    })

    const nativeInput = (): HTMLInputElement | HTMLTextAreaElement | null =>
      (inputRef.value?.$el?.querySelector('input,textarea') as HTMLInputElement | HTMLTextAreaElement | null) ?? null

    const suggestOpen = ref(false), active = ref(0), open = ref<{ query: string; start: number } | undefined>()
    const suggestions = ref<MacroEntry[]>([])
    const closeSuggest = () => { suggestOpen.value = false; open.value = undefined }
    const refreshSuggest = (text: string) => {
      const el = nativeInput()
      const caret = el?.selectionStart ?? text.length
      open.value = openMacroAt(text, caret)
      if (!open.value) return closeSuggest()
      suggestions.value = catalogFor({ scope: props.scope, query: open.value.query, limit: 8, ...custom() })
      active.value = 0
      suggestOpen.value = suggestions.value.length > 0
    }
    const onInput = (value: string | number | null) => {
      const text = String(value ?? '')
      emitValue(text)
      void nextTick(() => refreshSuggest(text))
    }
    const place = (caret: number) => void nextTick(() => { const el = nativeInput(); el?.focus(); el?.setSelectionRange(caret, caret) })
    const pick = (entry: MacroEntry) => {
      const text = String(props.modelValue ?? '')
      const el = nativeInput()
      const caret = el?.selectionStart ?? text.length
      const start = open.value?.start ?? caret
      const next = insertMacro(text, start, caret, entry.insert)
      emitValue(next.text)
      closeSuggest()
      place(next.caret)
    }
    const insertEntry = (entry: MacroEntry) => {
      browse.value = false
      if (rich.value) {
        editorRef.value?.focus?.()
        editorRef.value?.runCmd?.('insertText', entry.insert)
        return
      }
      const text = String(props.modelValue ?? '')
      const el = nativeInput()
      const caret = el?.selectionStart ?? text.length
      const next = insertMacro(text, caret, el?.selectionEnd ?? caret, entry.insert)
      emitValue(next.text)
      place(next.caret)
    }
    const onKeydown = (event: KeyboardEvent) => {
      if (!suggestOpen.value) return
      if (event.key === 'ArrowDown') { active.value = (active.value + 1) % suggestions.value.length; event.preventDefault() }
      else if (event.key === 'ArrowUp') { active.value = (active.value - 1 + suggestions.value.length) % suggestions.value.length; event.preventDefault() }
      else if (event.key === 'Enter' || event.key === 'Tab') { const entry = suggestions.value[active.value]; if (entry) { pick(entry); event.preventDefault(); event.stopPropagation() } }
      else if (event.key === 'Escape') { closeSuggest(); event.stopPropagation() }
    }

    const contentEl = ref<HTMLElement | null>(null)
    watch([rich, editorRef], () => void nextTick(() => { contentEl.value = rich.value ? editorRef.value?.getContentEl?.() ?? null : null }), { immediate: true })
    const richSuggest = useRichMacroAutocomplete(contentEl, query => catalogFor({ scope: props.scope, query, limit: 8, ...custom() }))

    return { richSuggest, formatting, browse, rich, editorValue, toolbar, forwardedSlots, emitValue, mechanicRichHtml, inputRef, editorRef, preview, suggestOpen, suggestions, active, onInput, onKeydown, pick, insertEntry, closeSuggest }
  },
})
</script>
<style scoped>
.mechanic-text-editor { min-width:0; width:100%; }
.mechanic-text-editor__formatted :deep(.q-editor__toolbars-container) { overflow-x:auto; }
.mechanic-text-editor__formatted :deep(.q-editor__toolbar) { flex-wrap:wrap; }
.mechanic-text-editor__formatted :deep(.q-editor__content) { overflow-wrap:anywhere; }
.mechanic-text-editor__preview { margin-top:2px; font-size:0.72rem; line-height:1.3; opacity:0.72; overflow-wrap:anywhere; }
.mechanic-text-editor__preview.is-unresolved { color:#f2a65a; opacity:1; }
</style>
<style>
.macro-suggest-menu { max-height: 280px; }
.macro-suggest-menu .macro-suggest-active { background: rgba(255, 179, 0, 0.16); }
.macro-suggest-menu code { font-size: 0.72rem; }
</style>
