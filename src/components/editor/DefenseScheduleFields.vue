<template>
  <div class="row q-col-gutter-xs q-mt-xs" :data-defense-schedule="effect">
    <q-select :model-value="schedule?.cadence" :options="BASIC_RIDER_CADENCES" emit-value map-options clearable
      dense outlined :label="label + ' cadence'" class="col-12 col-sm-6" @update:model-value="update('cadence', $event)" />
    <q-select :model-value="schedule?.timing" :options="BASIC_RIDER_TIMINGS" clearable
      dense outlined :label="label + ' timing'" class="col-12 col-sm-6" @update:model-value="update('timing', $event)" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { BASIC_RIDER_CADENCES, BASIC_RIDER_TIMINGS, type DefenseEffect, type RiderSchedule } from 'src/core/domain/basic-riders'

const props = defineProps<{ effect: DefenseEffect; label: string }>()
const monster = useMonsterStore()
const schedule = computed(() => monster.defenseSchedules?.[props.effect])

function update(field: keyof RiderSchedule, value: string | null) {
  const next = { ...monster.defenseSchedules }
  const updated = { ...schedule.value, [field]: value || undefined }
  if (updated.cadence || updated.timing) next[props.effect] = updated
  else delete next[props.effect]
  monster.defenseSchedules = next
}
</script>
