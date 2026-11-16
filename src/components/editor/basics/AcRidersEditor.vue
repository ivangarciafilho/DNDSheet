<template>
  <div class="q-mt-xs" data-ac-riders>
    <div class="row items-center justify-between q-mb-xs">
      <div class="text-caption text-weight-bold text-blue-3">AC Riders ({{ riders.length }})</div>
      <q-btn
        v-help="$t('help.defenses.acAddRider')"
        flat
        dense
        no-caps
        size="sm"
        color="cyan-3"
        icon="add"
        label="AC Rider"
        data-add-ac-rider
        @click="addRider"
      />
    </div>
    <div
      v-for="(rider, idx) in riders"
      :key="rider.id"
      class="row q-col-gutter-xs items-center q-mb-xs q-pa-xs rounded-borders bg-grey-9"
      data-ac-rider
    >
      <catalog-select
        v-help="'How often this AC rider triggers or refreshes.'"
        :model-value="rider.cadence ?? ''"
        :entries="BASIC_RIDER_CADENCES"
        preserve-order
        clearable
        :searchable="false"
        label="Cadence"
        class="col-6 col-sm-2"
        @update:model-value="(value) => patch(idx, { cadence: value ? String(value) : undefined })"
      />
      <catalog-select
        v-help="'Trigger window or action cost when this AC rider applies.'"
        :model-value="rider.timing ?? ''"
        :entries="timingEntries"
        preserve-order
        allow-custom
        clearable
        label="Timing"
        class="col-6 col-sm-2"
        @update:model-value="(value) => patch(idx, { timing: value ? String(value) : undefined })"
      />
      <div class="col-auto">
        <q-btn-toggle
          v-help="'Whether this rider fires when an attack hits or misses this creature.'"
          :model-value="rider.trigger"
          :options="[{ label: 'On Hit', value: 'hit' }, { label: 'On Miss', value: 'miss' }]"
          dense
          no-caps
          unelevated
          size="sm"
          toggle-color="cyan-6"
          color="grey-8"
          @update:model-value="(value: 'hit' | 'miss') => patch(idx, { trigger: value, effect: 'custom' })"
        />
      </div>
      <catalog-select
        v-help="$t(rider.trigger === 'hit' ? 'help.defenses.acOnHit' : 'help.defenses.acOnMiss')"
        :model-value="rider.effect"
        :entries="rider.trigger === 'hit' ? HIT_EFFECTS : MISS_EFFECTS"
        preserve-order
        label="Effect"
        class="col-12 col-sm"
        @update:model-value="(value) => patch(idx, { effect: String(value || 'custom') })"
      />
      <q-input
        v-if="rider.effect === 'custom'"
        v-help="'Write the rider effect exactly as it should print after On Hit / On Miss.'"
        :model-value="rider.text ?? ''"
        label="Effect text"
        class="col-12 col-sm-4"
        dense
        outlined
        dark
        debounce="300"
        @update:model-value="(value) => patch(idx, { text: String(value ?? '') })"
      />
      <q-input
        v-if="rider.effect === 'hits_target_feet'"
        v-help="'Maximum distance in feet to redirect a missed attack to another creature.'"
        :model-value="rider.distance ?? ''"
        label="Distance (ft)"
        class="col-4 col-sm-1"
        dense
        outlined
        dark
        @update:model-value="(value) => patch(idx, { distance: Number(value) || undefined })"
      />
      <template v-if="rider.effect === 'damage_attacker'">
        <q-input
          v-help="'Damage dealt to the attacker, as a number or dice text such as 7 (2d6).'"
          :model-value="rider.damageAmount ?? ''"
          label="Damage"
          class="col-4 col-sm-1"
          dense
          outlined
          dark
          @update:model-value="(value) => patch(idx, { damageAmount: value === '' || value == null ? undefined : String(value) })"
        />
        <catalog-select
          v-help="'Damage type dealt to the attacker.'"
          :model-value="rider.damageType"
          catalog-id="damageTypes"
          label="Type"
          class="col-8 col-sm-2"
          @update:model-value="(value) => patch(idx, { damageType: value ? String(value) : undefined })"
        />
      </template>
      <div class="col-auto">
        <q-btn flat round dense size="sm" color="red-4" icon="close" :aria-label="`Remove AC rider ${idx + 1}`" @click="removeRider(idx)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { BASIC_RIDER_CADENCES, BASIC_RIDER_TIMINGS } from 'src/core/domain/basic-riders'
import type { AcRider } from 'src/core/domain/types'
import { ON_HIT_ENTRIES, ON_MISS_ENTRIES } from './basics-catalogs'

// Build 269: AC riders replace the single On Miss / When Hit pickers. Each rider composes
// cadence -> timing -> trigger -> effect (preset wording or custom text) and prints in the AC line.
const monster = useMonsterStore()
const emit = defineEmits<{ changed: [] }>()
const timingEntries = BASIC_RIDER_TIMINGS.map((timing) => ({ value: timing, label: timing }))
const custom = { value: 'custom', label: 'Custom text…' }
const HIT_EFFECTS = [...ON_HIT_ENTRIES.filter((entry) => entry.value !== 'none'), custom]
const MISS_EFFECTS = [...ON_MISS_ENTRIES.filter((entry) => entry.value !== 'none'), custom]

const riders = computed<AcRider[]>(() => monster.acConfig?.riders ?? [])

function write(next: AcRider[]) {
  if (!monster.acConfig) return
  monster.acConfig.riders = next
  emit('changed')
}
const patch = (idx: number, change: Partial<AcRider>) => write(riders.value.map((rider, i) => (i === idx ? { ...rider, ...change } : rider)))
const addRider = () => write([...riders.value, { id: uuidv4(), trigger: 'hit', effect: 'custom', text: '' }])
const removeRider = (idx: number) => write(riders.value.filter((_, i) => i !== idx))

// Migration: a legacy single On Miss / When Hit pick (from storage, import or library) becomes riders,
// keeping its numbers and schedule, so the printed AC line stays the same. Watching (not onMounted)
// also covers a creature loaded while the editor is already open.
watch(() => [monster.acConfig?.onMiss, monster.acConfig?.onHit], () => {
  const cfg = monster.acConfig
  if (!cfg || ((!cfg.onMiss || cfg.onMiss === 'none') && (!cfg.onHit || cfg.onHit === 'none'))) return
  const migrated: AcRider[] = []
  const schedules = { ...(monster.defenseSchedules ?? {}) }
  if (cfg.onMiss && cfg.onMiss !== 'none') {
    migrated.push({ id: uuidv4(), trigger: 'miss', effect: cfg.onMiss, distance: cfg.onMissDistance, damageAmount: cfg.onMissDamageAmount, damageType: cfg.onMissDamageType, ...schedules.onMiss })
    cfg.onMiss = 'none'
    delete schedules.onMiss
  }
  if (cfg.onHit && cfg.onHit !== 'none') {
    migrated.push({ id: uuidv4(), trigger: 'hit', effect: cfg.onHit, damageAmount: cfg.onHitDamageAmount, damageType: cfg.onHitDamageType, doubleIfBloodied: Boolean(cfg.onHitDoubleBloodied || cfg.doubleIfBloodied), ...schedules.onHit })
    cfg.onHit = 'none'
    delete schedules.onHit
  }
  if (!migrated.length) return
  monster.defenseSchedules = schedules
  write([...(cfg.riders ?? []), ...migrated])
}, { immediate: true })
</script>
