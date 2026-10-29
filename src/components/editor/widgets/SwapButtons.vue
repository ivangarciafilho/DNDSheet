<template>
  <q-btn-group :push="!flat" :flat="flat">
    <q-btn
      :disabled="idx === 0"
      :push="!flat"
      :flat="flat"
      :dense="dense"
      size="sm"
      :ripple="false"
      icon="arrow_upward"
      :color="color"
      @click="(e: Event) => {
        e.stopPropagation()
        monster.moveItemUp(field, idx)
      }"
    >
      <q-tooltip class="text-body2">Move Up</q-tooltip>
    </q-btn>
    <q-btn
      :disabled="idx === itemCount - 1"
      :push="!flat"
      :flat="flat"
      :dense="dense"
      size="sm"
      :ripple="false"
      icon="arrow_downward"
      :color="color"
      @click="(e: Event) => {
        e.stopPropagation()
        monster.moveItemDown(field, idx)
      }"
    >
      <q-tooltip class="text-body2">Move Down</q-tooltip>
    </q-btn>
  </q-btn-group>
</template>

<script lang="ts">
import { SwappableField } from 'src/components/models'
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'SwapButtons',
  props: {
    idx: {
      type: Number,
      required: true,
    },
    field: {
      type: String as PropType<SwappableField>,
      required: true,
    },
    dense: {
      type: Boolean,
      default: true,
    },
    flat: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: 'primary',
    },
  },
  setup(props) {
    const monster = useMonsterStore()

    const itemCount = computed(() => {
      const arr = monster[props.field] as unknown[] | undefined
      return Array.isArray(arr) ? arr.length : 0
    })

    return {
      monster,
      itemCount,
    }
  },
})
</script>
