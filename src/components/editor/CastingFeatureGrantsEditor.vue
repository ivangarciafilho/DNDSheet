<template>
  <q-expansion-item dense dense-toggle label="Feature spell grants" :caption="modelValue.length ? modelValue.length + ' custom grants' : 'Add grants from a class, subclass or species feature'">
    <div class="q-pa-sm">
      <div v-for="(grant, index) in modelValue" :key="index" class="row items-center justify-between q-mb-xs">
        <span>{{ grant.spell }} · {{ originLabel(grant.origin) }} · {{ grant.kind === 'known' ? 'Always known' : 'Always prepared' }} · Level {{ grant.minLevel }}</span>
        <q-btn flat round dense icon="close" :aria-label="'Remove grant for ' + grant.spell" @click="emit('update:modelValue', modelValue.filter((_, i) => i !== index))" />
      </div>
      <div class="row q-col-gutter-xs items-center">
        <q-select v-model="spell" v-help="'Spell automatically granted by a class, subclass, or species feature.'" :options="filtered" use-input emit-value map-options dense outlined dark class="col-12" label="Granted spell" @filter="filterSpells" />
        <q-select v-model="origin" v-help="'Feature source granting this spell.'" :options="origins" emit-value map-options dense outlined dark class="col-6 col-sm-4" label="Feature source" />
        <q-select v-model="kind" v-help="'Whether the granted spell is always prepared/known or eligible for free swaps.'" :options="kinds" emit-value map-options dense outlined dark class="col-6 col-sm-4" label="Availability" />
        <q-input v-model.number="minLevel" v-help="'Minimum class or source level required to unlock this grant.'" type="number" min="1" max="20" dense outlined dark class="col-6 col-sm-4" label="Unlock level" />
        <q-btn flat dense no-caps icon="add" label="Add grant" :disable="!spell || !Number.isInteger(minLevel) || minLevel < 1 || minLevel > 20" @click="add" />
      </div>
    </div>
  </q-expansion-item>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useSpellsStore } from 'src/stores/spells-store'
import type { CastingSpellGrant } from 'src/core/usecases/AutoSyncSpellcasting'
import { normalizeCastingSpellGrants } from 'src/core/domain/casting-source-selection'
const props = defineProps<{ modelValue: CastingSpellGrant[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: CastingSpellGrant[]] }>()
const spells = useSpellsStore()
const spell = ref(''), minLevel = ref(1), query = ref('')
const origin = ref<CastingSpellGrant['origin']>('class')
const kind = ref<'known' | 'prepared'>('prepared')
const origins = [{label:'Class',value:'class'},{label:'Subclass',value:'subclass'},{label:'Species',value:'species'}]
const kinds = [{label:'Always prepared',value:'prepared'},{label:'Always known',value:'known'}]
const originLabel = (value: CastingSpellGrant['origin']) => origins.find(option => option.value === value)?.label
const filtered = computed(() => spells.allSpellOptions.filter(option => option.label.toLowerCase().includes(query.value)).sort((a,b) => a.label.localeCompare(b.label)))
function filterSpells(value: string, update: (fn: () => void) => void) { update(() => { query.value = value.toLowerCase().trim() }) }
function add() {
  emit('update:modelValue', normalizeCastingSpellGrants([...props.modelValue, {spell: spell.value, minLevel: minLevel.value, origin: origin.value, kind: kind.value}]))
  spell.value = ''
}
</script>
