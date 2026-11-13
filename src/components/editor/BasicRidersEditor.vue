<template>
  <q-expansion-item dense expand-separator :label="label" :data-basic-riders="scope">
    <div class="q-pa-sm q-gutter-y-sm">
      <q-toggle v-if="hpGroup" :model-value="monster.hpRiderSubrows?.[hpGroup] ?? legacySplit"
        dense label="Show on separate lines" @update:model-value="monster.hpRiderSubrows = { ...monster.hpRiderSubrows, [hpGroup]: $event }" />
      <div v-for="(rider, index) in rows" :key="rider.id" class="row q-col-gutter-sm items-center">
        <q-select v-model="rider.cadence" :options="BASIC_RIDER_CADENCES" emit-value map-options clearable dense outlined label="Cadence" class="col-12 col-sm-4" />
        <q-select v-model="rider.timing" :options="BASIC_RIDER_TIMINGS" clearable dense outlined label="Timing" class="col-12 col-sm-4" />
        <q-btn flat dense icon="delete_outline" color="negative" aria-label="Remove rider" @click="rows.splice(index, 1)" />
        <mechanic-text-editor v-model="rider.effect" autogrow dense outlined label="Effect" class="col-12" />
      </div>
      <q-btn flat dense no-caps icon="add" label="Add rider" @click="addRider" />
    </div>
  </q-expansion-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { v4 as uuid } from 'uuid'
import { useMonsterStore } from 'src/stores/monster-store'
import { BASIC_RIDER_CADENCES, BASIC_RIDER_TIMINGS, type BasicRiderScope } from 'src/core/domain/basic-riders'

const props = defineProps<{ scope: BasicRiderScope; label: string }>()
const monster = useMonsterStore()
const hpGroup = computed(() => props.scope === 'hp' || props.scope === 'deathThroes' || props.scope === 'onDamage' ? props.scope : null)
const legacySplit = computed(() => (monster.$state as { splitHpRiderRows?: boolean }).splitHpRiderRows)
const rows = computed(() => monster.basicRiders?.[props.scope] ?? [])

function addRider() {
  monster.basicRiders ??= {}
  const scopeRows = monster.basicRiders[props.scope] ??= []
  const timing = props.scope === 'deathThroes' ? 'When it drops to 0 hit points'
    : props.scope === 'onDamage' ? 'When it takes damage' : ''
  scopeRows.push({ id: uuid(), cadence: '', timing, effect: '' })
}
</script>
