<template>
  <!-- Villain Actions (MCDM Flee, Mortals!) -->
  <div v-if="villainActionsList && villainActionsList.length > 0" class="actions villain-actions">
    <h3 class="section">Villain Actions</h3>
    <div class="preamble">
      <i>{{ monster.name }} can take 3 villain actions, using one at the end of another creature's turn. Only one villain action can be used per round, in numbered order (1, 2, 3).</i>
    </div>
    <div
      v-for="va in villainActionsList"
      :key="va.id"
      v-safe-html="va.rendered"
      class="action villain"
    ></div>
  </div>

  <!-- Bloodied Actions (Anne Gregersen / DMsGuild) -->
  <div v-if="bloodiedActionsList && bloodiedActionsList.length > 0" class="actions bloodied-actions">
    <h3 class="section">Bloodied Actions</h3>
    <div
      v-for="ba in bloodiedActionsList"
      :key="ba.id"
      v-safe-html="ba.rendered"
      class="action bloodied"
    ></div>
  </div>

  <!-- Reactive Actions (Official WotC 2024 / Level Up A5e) -->
  <div v-if="reactiveActionsList && reactiveActionsList.length > 0" class="actions reactive-actions">
    <h3 class="section">Reactive Actions</h3>
    <div
      v-for="ra in reactiveActionsList"
      :key="ra.id"
      v-safe-html="ra.rendered"
      class="action reactive"
    ></div>
  </div>

  <!-- Combo Actions (MCDM) -->
  <div v-if="comboActionsList && comboActionsList.length > 0" class="actions combo-actions">
    <h3 class="section">Combo Actions</h3>
    <div
      v-for="ca in comboActionsList"
      :key="ca.id"
      v-safe-html="ca.rendered"
      class="action combo"
    ></div>
  </div>

  <!-- Draco Anatomy (Breakable Monster Limbs) -->
  <div v-if="anatomyPartsList && anatomyPartsList.length > 0" class="actions anatomy-actions">
    <h3 class="section">Targeted Anatomy & Breakable Parts</h3>
    <div
      v-for="ap in anatomyPartsList"
      :key="ap.id"
      v-safe-html="ap.rendered"
      class="action anatomy"
    ></div>
  </div>

  <!-- Runehammer Track (Escalating Round Countdown) -->
  <div v-if="runehammerTrackData" class="actions runehammer-track">
    <h3 class="section">{{ runehammerTrackData.title }} (Timer: 1{{ runehammerTrackData.timerDie }} rounds)</h3>
    <div
      v-for="ev in runehammerTrackData.events"
      :key="ev.id"
      v-safe-html="ev.rendered"
      class="action track-event"
    ></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store'
import type { useEncounterDynamicsText } from './useEncounterDynamicsText'

type Dynamics = ReturnType<typeof useEncounterDynamicsText>

// Villain, bloodied, reactive and combo actions, anatomy parts and the Runehammer track.
// A fragment: the sections render as direct children of the stat block, exactly as when inline.
// Styles come from the parent's namespaced sheet (web-renderer.namespaced.scss).
export default defineComponent({
  name: 'StatblockEncounterDynamics',
  props: {
    villainActionsList: { type: Array as PropType<Dynamics['villainActionsList']['value']>, default: undefined },
    bloodiedActionsList: { type: Array as PropType<Dynamics['bloodiedActionsList']['value']>, default: undefined },
    reactiveActionsList: { type: Array as PropType<Dynamics['reactiveActionsList']['value']>, default: undefined },
    comboActionsList: { type: Array as PropType<Dynamics['comboActionsList']['value']>, default: undefined },
    anatomyPartsList: { type: Array as PropType<Dynamics['anatomyPartsList']['value']>, default: undefined },
    runehammerTrackData: { type: Object as PropType<Dynamics['runehammerTrackData']['value']>, default: null },
  },
  setup() {
    return { monster: useMonsterStore() }
  },
})
</script>
