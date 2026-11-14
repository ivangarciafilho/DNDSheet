<template>
  <q-select
    ref="selectRef"
    :model-value="modelValue"
    :options="filteredOptions"
    :label="label"
    :hint="hint"
    :placeholder="placeholder"
    :outlined="outlined"
    :dense="dense"
    :dark="dark"
    :disable="disable"
    :clearable="clearable"
    :multiple="multiple"
    :use-chips="useChips"
    :hide-bottom-space="hideBottomSpace"
    :use-input="searchable"
    :fill-input="searchable && !multiple"
    :hide-selected="searchable && !multiple"
    :input-debounce="0"
    :new-value-mode="effectiveAllowCustom ? 'add-unique' : undefined"
    emit-value
    map-options
    options-dense
    :data-catalog-select="catalogId || 'custom'"
    @input="onNativeInput"
    @input-value="onInputValue"
    @popup-show="onPopupShow"
    @popup-hide="onPopupHide"
    @update:model-value="onUpdate"
  >
    <q-tooltip v-if="help" class="dnd-tip">{{ help }}</q-tooltip>
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
    <template v-if="$slots.after" #after>
      <slot name="after" />
    </template>
    <template v-if="$slots['selected-item']" #selected-item="scope">
      <slot name="selected-item" v-bind="scope" />
    </template>
    <template #option="scope">
      <div class="catalog-select__row">
        <div
          v-if="scope.opt.firstInGroup && scope.opt.group"
          class="catalog-select__group text-overline q-px-md q-pt-xs q-pb-none"
          :class="dark ? 'text-grey-4' : 'text-grey-7'"
          aria-hidden="true"
        >
          {{ scope.opt.group }}
        </div>
        <q-item v-bind="scope.itemProps" :disable="Boolean(scope.opt.disable)" :data-catalog-option="String(scope.opt.value)">
          <q-item-section v-if="scope.opt.icon" avatar style="min-width: 28px;">
            <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'amber-4'" size="xs" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="scope.opt.badge || scope.opt.custom" side>
            <q-badge
              :color="scope.opt.custom ? 'deep-purple-6' : (scope.opt.color || 'blue-grey-7')"
              text-color="white"
              :label="scope.opt.badge || 'Custom'"
            />
          </q-item-section>
          <q-tooltip v-if="scope.opt.tooltip" class="bg-grey-10 text-amber-2 text-caption" :delay="250" max-width="260px">
            {{ scope.opt.tooltip }}
          </q-tooltip>
        </q-item>
      </div>
    </template>
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">
          {{ effectiveAllowCustom && query.trim() ? `Press Enter to use "${query.trim()}"` : 'No matching entries' }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { QSelect } from 'quasar'
import { canonicalCatalog, type CanonicalCatalogEntry, type CatalogId } from 'src/core/domain/catalogs/enumerations'
import { buildCatalogOptions, filterCatalogOptions } from 'src/core/domain/catalogs/catalog-select-model'

const props = withDefaults(
  defineProps<{
    modelValue: string | number | (string | number)[] | null | undefined
    catalogId?: CatalogId
    entries?: readonly CanonicalCatalogEntry<string | number>[]
    customValues?: readonly (string | number)[]
    preserveOrder?: boolean
    allowCustom?: boolean
    searchable?: boolean
    multiple?: boolean
    useChips?: boolean
    clearable?: boolean
    label?: string
    hint?: string
    placeholder?: string
    outlined?: boolean
    dense?: boolean
    dark?: boolean
    disable?: boolean
    hideBottomSpace?: boolean
    help?: string
  }>(),
  {
    searchable: true,
    outlined: true,
    dense: true,
    clearable: false,
    multiple: false,
    useChips: false,
    dark: false,
    disable: false,
    hideBottomSpace: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[] | null]
}>()

const selectRef = ref<QSelect | null>(null)
const popupOpen = ref(false)
const query = ref('')

const effectiveAllowCustom = computed(() => {
  if (props.allowCustom !== undefined) return props.allowCustom
  return props.catalogId ? canonicalCatalog(props.catalogId).allowCustom : false
})

const normalizedOptions = computed(() =>
  buildCatalogOptions({
    catalogId: props.catalogId,
    entries: props.entries,
    customValues: props.customValues,
    currentValue: props.modelValue,
    preserveOrder: props.preserveOrder,
  }),
)

const filteredOptions = computed(() => filterCatalogOptions(normalizedOptions.value, query.value))

function onPopupShow() {
  popupOpen.value = true
  query.value = ''
}

function onPopupHide() {
  popupOpen.value = false
  query.value = ''
}

function onInputValue(val: string) {
  if (!props.searchable || !popupOpen.value) return
  query.value = val
}

function onNativeInput(event: Event) {
  if (!props.searchable || props.disable) return
  const target = event.target as (HTMLInputElement & { qComposing?: boolean }) | null
  if (!target || target.tagName !== 'INPUT' || target.qComposing) return
  query.value = target.value
  if (!popupOpen.value) {
    selectRef.value?.showPopup()
  }
}

function onUpdate(val: unknown) {
  if (props.multiple) {
    emit('update:modelValue', Array.isArray(val) ? (val as (string | number)[]) : [])
    return
  }
  query.value = ''
  emit('update:modelValue', (val as string | number | null) ?? '')
}
</script>

<style scoped>
.catalog-select__group {
  font-size: 0.65rem;
  line-height: 1.4;
  letter-spacing: 0.06em;
  pointer-events: none;
}
</style>
