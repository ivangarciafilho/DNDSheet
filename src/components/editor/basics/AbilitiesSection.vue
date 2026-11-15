<template>
  <div>
    <!-- 5. Ability Scores (Feeds AC, HP & Initiative) -->
    <div class="row items-center justify-between q-mt-md q-mb-xs q-col-gutter-xs">
      <div class="editor-fit-wrap items-center">
        <span class="text-subtitle2 text-weight-bold text-grey-4">Ability Scores</span>
        <q-badge
          :color="pointBuyInfo.isValid ? (pointBuyInfo.remaining === 0 ? 'green-9' : 'amber-4') : 'negative'"
          :text-color="pointBuyInfo.isValid && pointBuyInfo.remaining > 0 ? 'grey-10' : 'white'"
          class="text-weight-bold text-caption"
        >
          Point Buy: {{ pointBuyInfo.remaining }} / 27 remaining
        </q-badge>
      </div>
      <div class="editor-fit-wrap items-center">
        <q-btn
          v-help="'Assign the standard 5e array (15, 14, 13, 12, 10, 8) across the six ability scores.'"
          size="xs"
          outline
          dense
          color="primary"
          label="Standard Array"
          @click="applyStandardArray"
        />
        <q-btn
          v-help="$t('help.abilities.setAllEight')"
          size="xs"
          outline
          dense
          color="grey-5"
          label="All 8s"
          @click="applyAllStats(8)"
        />
        <q-btn
          v-help="$t('help.abilities.setAllTen')"
          size="xs"
          outline
          dense
          color="grey-5"
          label="All 10s"
          @click="applyAllStats(10)"
        />
      </div>
    </div>

    <!-- Monster Role Archetype Heuristics Chips -->
    <div class="editor-fit-wrap items-center q-mb-sm">
      <span class="text-caption text-grey-5">Archetypes:</span>
      <q-btn
        v-for="arch in roleArchetypes"
        :key="arch.id"
        v-help="arch.description"
        size="xs"
        :color="arch.color"
        outline
        dense
        :icon="arch.icon"
        :label="arch.label"
        @click="applyArchetype(arch)"
      />
    </div>

    <div class="row q-col-gutter-sm q-mb-md">
      <formula-field
        v-for="stat in statKeys"
        :key="stat"
        v-help="'Base ability score; supports formulas and drives modifiers, saves, skills, and attack bonuses.'"
        :path="`stats.${stat}`"
        :label="stat"
        class="col-4 col-sm-2"
        outlined
        dense
        @applied="(value: number | string) => updateStat(stat, value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import FormulaField from 'src/components/kit/FormulaField.vue'
import { useBasicsContext } from './useBasicsContext'

const {
  statKeys,
  updateStat,
  pointBuyInfo,
  roleArchetypes,
  applyStandardArray,
  applyAllStats,
  applyArchetype,
} = useBasicsContext()
</script>
