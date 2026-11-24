<template>
  <div class="row q-col-gutter-xs q-mt-xs" :data-defense-schedule="effect">
    <catalog-select
      v-help="'How often this defense rider triggers or refreshes.'"
      :model-value="schedule?.cadence ?? ''"
      :entries="BASIC_RIDER_CADENCE_ENTRIES"
      clearable
      :searchable="false"
      :label="label + ' cadence'"
      class="col-12 col-sm-6"
      @update:model-value="value => update('cadence', value ? String(value) : null)"
    />
    <catalog-select
      v-help="'Trigger window or action cost when this defense effect applies.'"
      :model-value="schedule?.timing ?? ''"
      :entries="BASIC_RIDER_TIMING_ENTRIES"
      allow-custom
      clearable
      :label="label + ' timing'"
      class="col-12 col-sm-6"
      @update:model-value="value => update('timing', value ? String(value) : null)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { BASIC_RIDER_CADENCE_ENTRIES, BASIC_RIDER_TIMING_ENTRIES, type DefenseEffect, type RiderSchedule } from 'src/core/domain/basic-riders'

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
