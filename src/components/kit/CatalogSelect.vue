<template>
  <q-select
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
    :use-input="searchable"
    :fill-input="searchable && !multiple"
    :hide-selected="searchable && !multiple"
    :input-debounce="0"
    :new-value-mode="effectiveAllowCustom ? 'add-unique' : undefined"
    emit-value
    map-options
    options-dense
    :data-catalog-select="catalogId || 'custom'"
    @filter="onFilter"
    @update:model-value="onUpdate"
  >
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
        <q-item v-bind="scope.itemProps" :data-catalog-option="String(scope.opt.value)">
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="scope.opt.badge || scope.opt.custom" side>
            <q-badge
              :color="scope.opt.custom ? 'deep-purple-6' : 'blue-grey-7'"
              text-color="white"
              :label="scope.opt.badge || 'Custom'"
            />
          </q-item-section>
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
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number | (string | number)[] | null]
}>()

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

function onFilter(val: string, update: (fn: () => void) => void) {
  update(() => {
    query.value = val
  })
}

function onUpdate(val: unknown) {
  if (props.multiple) {
    emit('update:modelValue', Array.isArray(val) ? (val as (string | number)[]) : [])
    return
  }
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
