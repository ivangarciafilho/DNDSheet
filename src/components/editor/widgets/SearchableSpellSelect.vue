<template>
  <q-select
    :model-value="$props.modelValue"
    :label="$props.label"
    :options="spellOptions"
    use-chips
    multiple
    use-input
    clearable
    emit-value
    input-debounce="0"
    @filter="spellFilter"
    @update:model-value="(value) => $emit('update:model-value', value)"
    @clear="$emit('clear')"
  >
    <template #option="scope">
      <casting-spell-option :option="scope.opt" :item-props="scope.itemProps" />
    </template>
    <template #after>
      <slot name="after"></slot>
    </template>
  </q-select>
</template>

<script lang="ts">
import CastingSpellOption from '../CastingSpellOption.vue'
import { defineComponent, PropType } from '@vue/runtime-core'
import { spellArrayFilter } from 'src/components/filters'
import { useSpellLevels } from 'src/components/spell/useSpellLevels'
import { SpellOption, useSpellsStore } from 'src/stores/spells-store'
import { computed, ref } from 'vue'

export default defineComponent({
  name: 'SearchableSpellSelect',
  components: { CastingSpellOption },
  props: {
    modelValue: {
      type: Object as PropType<string[]>,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  emits: ['update:model-value', 'clear'],
  setup() {
    const spells = useSpellsStore()
    const baseSpells = computed(() => spells.allSpellOptions)
    const spellOptions = ref<SpellOption[]>([])
    const spellFilter = spellArrayFilter(baseSpells, spellOptions)
    const { ordinalSpellLevels } = useSpellLevels()

    return {
      spellOptions,
      spellFilter,
      spellLevels: ordinalSpellLevels,
    }
  },
})
</script>
