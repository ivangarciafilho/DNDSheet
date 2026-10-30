<template>
  <q-btn-dropdown flat dense no-caps :label="label" :aria-label="label" :disable="targets.length === 0" @before-show="query = ''">
    <q-list class="bg-grey-10 text-white reference-picker">
      <q-item><q-item-section><q-input v-model="query" dense dark outlined autofocus label="Find an entry" /></q-item-section></q-item>
      <q-item v-for="target in matches" :key="target.id" v-close-popup clickable :data-reference-target="target.id" @click="$emit('choose', target.id)">
        <q-item-section>
          <q-item-label>{{ target.name || 'Unnamed entry' }}</q-item-label>
          <q-item-label caption>{{ target.id }}</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="matches.length === 0"><q-item-section>No matching entries. Try another name or ID.</q-item-section></q-item>
    </q-list>
  </q-btn-dropdown>
</template>
<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import type { ReferenceTarget } from 'src/core/domain/multiattack-composer'
export default defineComponent({
  name: 'MultiattackReferencePicker',
  props: { label: { type: String, required: true }, targets: { type: Array as PropType<ReferenceTarget[]>, required: true } },
  emits: ['choose'],
  setup(props) {
    const query = ref('')
    const matches = computed(() => props.targets.filter(target => `${target.name} ${target.id}`.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())))
    return { query, matches }
  },
})
</script>
<style scoped>
.reference-picker { min-width: 240px; max-width: min(92vw, 420px); max-height: 50vh; overflow-y: auto; }
</style>
