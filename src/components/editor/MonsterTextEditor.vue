<template>
  <div class="column full-width">
    <q-editor
      ref="editorRef"
      :model-value="$props.modelValue !== undefined ? $props.modelValue : $props.field"
      :toolbar="toolbarOptions"
      :definitions="toolbarDefinitions"
      class="full-width q-ma-xs"
      @update:model-value="(value) => throttledUpdate(value)"
    >
      <template #title>
        <div
          class="text-subtitle2"
          style="display: flex; align-items: center; height: 100%"
        >
          {{ displayTitle }}
        </div>
      </template>
      <template #macros>
        <q-btn dense no-caps no-wrap unelevated size="sm" icon="data_object" label="Insert" :aria-label="`Insert a formula or macro${displayTitle ? ' into ' + displayTitle : ''}`" data-macro-browse @click="browse = true">
          <q-tooltip>Formulas, references, rolls and macros, filtered to what this text can use.</q-tooltip>
          <macro-browse-menu v-model="browse" :scope="scope" @pick="(entry: MacroEntry) => add(entry.insert)" />
        </q-btn>
      </template>
    </q-editor>
    <macro-suggest-popup :open="richSuggest.open.value" :entries="richSuggest.entries.value" :active="richSuggest.active.value" :x="richSuggest.x.value" :y="richSuggest.y.value" :label="`Suggestions${displayTitle ? ' for ' + displayTitle : ''}`" @pick="richSuggest.pick" />
    <div v-if="unknown.length" class="text-caption q-mx-xs" style="color: #f2a65a" data-macro-preview aria-live="polite">
      Not recognised: {{ unknown.join(', ') }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from 'vue'
import { MonsterContextType } from '../rendering/useProcessTokens'
import { useI18n } from 'vue-i18n'
import { useMonsterStore } from 'src/stores/monster-store'
import { useProcessTokens } from '../rendering/useProcessTokens'
import { catalogFor, unresolvedMacros } from 'src/core/domain/macro-catalog'
import type { MacroEntry, MacroScope } from 'src/core/domain/macro-catalog'
import MacroBrowseMenu from './MacroBrowseMenu.vue'
import MacroSuggestPopup from './MacroSuggestPopup.vue'
import { useRichMacroAutocomplete } from './useRichMacroAutocomplete'

const SCOPE_OF: Record<MonsterContextType, MacroScope> = {
  none: 'prose', trait: 'trait', attack: 'attack', spell: 'spell', action: 'action',
  multiattack: 'action', legendary: 'legendary', mythic: 'legendary', reaction: 'reaction',
}

export default defineComponent({
  name: 'MonsterTextEditor',
  components: { MacroBrowseMenu, MacroSuggestPopup },
  props: {
    field: { required: false, type: String, default: '' },
    modelValue: { type: String, default: undefined },
    label: { type: String, default: '' },
    tokenCategory: {
      type: String as PropType<MonsterContextType>,
      default: 'none',
    },
    i18nLabelKey: { required: false, type: String, default: '' },
    showReset: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue', 'reset'],
  setup(props, ctx) {
    const { t } = useI18n()
    const monster = useMonsterStore()
    const editorRef = ref<any>(null)
    const browse = ref(false)
    const { processTokens: renderTokens } = useProcessTokens()
    const scope = computed<MacroScope>(() => SCOPE_OF[props.tokenCategory] ?? 'prose')

    const displayTitle = computed(() => {
      if (props.label) return props.label
      if (props.i18nLabelKey) {
        try {
          return t(props.i18nLabelKey)
        } catch {
          return props.i18nLabelKey
        }
      }
      return ''
    })

    const toolbarOptions = ref([
      ['title'],
      ['bold', 'italic', 'underline'],
      ['undo', 'redo'],
      ['macros'],
    ])

    if (props.showReset) {
      toolbarOptions.value.push(['reset'])
    }

    const toolbarDefinitions = ref({
      reset: {
        tip: t('editor.resetTip'),
        icon: 'restart_alt',
        handler: () => ctx.emit('reset'),
      },
    })

    const throttledUpdate = (value: string) => {
      ctx.emit('update:modelValue', value)
    }

    const add = (token: string) => {
      const edit = editorRef.value as any
      browse.value = false
      if (edit && edit.caret) {
        edit.caret.restore()
        edit.runCmd('insertHTML', `${token}`)
        edit.focus()
      } else {
        const currentVal = props.modelValue !== undefined ? props.modelValue : props.field
        ctx.emit('update:modelValue', (currentVal || '') + token)
      }
    }

    // Tokens the stat block cannot resolve, ignoring context tokens resolved per entry at render time.
    const unknown = computed(() => {
      const source = String((props.modelValue !== undefined ? props.modelValue : props.field) ?? '')
      if (!source.includes('{')) return []
      const contextual = new Set(catalogFor({ scope: scope.value }).filter(entry => entry.kind === 'context').map(entry => entry.insert.toLowerCase()))
      let rendered = source
      try { rendered = String(renderTokens(source, undefined as never, monster, 'none') ?? '') } catch { rendered = source }
      return unresolvedMacros(rendered).filter(token => !contextual.has(token.toLowerCase()))
    })

    const contentEl = ref<HTMLElement | null>(null)
    onMounted(() => { contentEl.value = editorRef.value?.getContentEl?.() ?? null })
    const richSuggest = useRichMacroAutocomplete(contentEl, query => catalogFor({
      scope: scope.value, query, limit: 8,
      customVariables: (monster as unknown as { customVariables?: Record<string, unknown> }).customVariables,
      customMacros: (monster as unknown as { customMacros?: Record<string, unknown> }).customMacros,
    }))

    return {
      richSuggest,
      editorRef,
      browse,
      scope,
      add,
      unknown,
      displayTitle,
      throttledUpdate,
      toolbarOptions,
      toolbarDefinitions,
    }
  },
})
</script>
