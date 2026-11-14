<template>
  <q-expansion-item
    expand-separator
    data-editor-section="saves"
    icon="fa-solid fa-helmet-safety"
    :label="$t('editor.saves.label')"
    :caption="$t('editor.saves.caption')"
  >
    <q-card class="q-pa-xs">
      <div class="row q-col-gutter-xs">
        <div
          v-for="stat in statList"
          :key="stat"
          class="col-12 col-sm-6 col-md-4 q-pa-xs"
        >
          <q-card
            flat
            bordered
            class="q-pa-xs rounded-borders"
            style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12);"
          >
            <div class="row items-center justify-between no-wrap q-mb-xs">
              <div class="row items-center no-wrap">
                <span class="text-subtitle2 text-weight-bold text-uppercase q-mr-xs">
                  {{ $t(`monster.stat.${stat}`) }}
                </span>
                <q-badge
                  :color="saves[stat]?.proficient ? 'positive' : 'grey-8'"
                  class="text-weight-bold"
                >
                  {{ formatModifier(saveModifierForStat(monster, stat)) }}
                </q-badge>
              </div>

              <!-- Action button group: Proficient, Override, Advantage, Disadvantage -->
              <div class="row items-center q-gutter-xs no-wrap">
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="saves[stat]?.proficient ? 'positive' : 'grey-8'"
                  icon="keyboard_arrow_up"
                  @click="toggleProficient(stat)"
                >
                  <q-tooltip class="text-body2">{{ $t('editor.proficient') }}</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="saves[stat]?.override ? 'warning' : 'grey-8'"
                  icon="handyman"
                  @click="toggleOverride(stat)"
                >
                  <q-tooltip class="text-body2">{{ $t('editor.override') }}</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="saves[stat]?.advantage ? 'positive' : 'grey-8'"
                  label="⏫"
                  @click="toggleAdvantage(stat)"
                >
                  <q-tooltip class="text-body2">Advantage</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="saves[stat]?.disadvantage ? 'negative' : 'grey-8'"
                  label="⏬"
                  @click="toggleDisadvantage(stat)"
                >
                  <q-tooltip class="text-body2">Disadvantage</q-tooltip>
                </q-btn>
              </div>
            </div>

            <div class="row q-col-gutter-xs items-center">
              <div v-if="saves[stat]?.override" class="col-4">
                <q-select
                  dense
                  outlined
                  :model-value="saves[stat]?.overrideValue ?? 0"
                  :options="getSaveOverrideOptions(stat)"
                  emit-value
                  map-options
                  use-input
                  fill-input
                  hide-selected
                  label="Override" v-help="'Type a fixed save bonus instead of the computed one.'"
                  new-value-mode="add-unique"
                  @input-value="(val) => (monster.saves[stat].overrideValue = validateNumber(val, 0))"
                  @update:model-value="(val) => (monster.saves[stat].overrideValue = validateNumber(val, 0))"
                />
              </div>
              <div :class="saves[stat]?.override ? 'col-8' : 'col-12'">
                <mechanic-text-editor
                  dense
                  outlined
                  v-model="monster.saves[stat].condition"
                  label="Condition / Trigger" v-help="'When the save bonus or advantage applies, e.g. “against being frightened”.'"
                  placeholder="e.g. vs spells, vs poison"
                  clearable
                />
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import MechanicTextEditor from './MechanicTextEditor.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { defineComponent, computed } from 'vue'
import { saveModifierForStat } from '../rendering/mathRendering'
import { validateNumber } from './numberInput'
import { DndStat } from 'src/core/domain/types'

export default defineComponent({
  name: 'SavesEditor',
  components: { MechanicTextEditor },
  setup() {
    const monster = useMonsterStore()
    const statList: DndStat[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']

    const formatModifier = (val: number): string => {
      return val >= 0 ? `+${val}` : `${val}`
    }

    const toggleProficient = (stat: DndStat) => {
      monster.saves[stat].proficient = !monster.saves[stat].proficient
    }

    const toggleOverride = (stat: DndStat) => {
      monster.saves[stat].override = !monster.saves[stat].override
    }

    const toggleAdvantage = (stat: DndStat) => {
      monster.saves[stat].advantage = !monster.saves[stat].advantage
      if (monster.saves[stat].advantage) {
        monster.saves[stat].disadvantage = false
      }
    }

    const toggleDisadvantage = (stat: DndStat) => {
      monster.saves[stat].disadvantage = !monster.saves[stat].disadvantage
      if (monster.saves[stat].disadvantage) {
        monster.saves[stat].advantage = false
      }
    }

    const getSaveOverrideOptions = (stat: DndStat) => {
      const pb = monster.proficiency ?? 2
      const statVal = monster.stats?.[stat] ?? 10
      const mod = Math.floor((statVal - 10) / 2)
      return [
        { label: `+PB (${pb >= 0 ? '+' : ''}${pb})`, value: pb },
        { label: `+2x PB (${pb * 2 >= 0 ? '+' : ''}${pb * 2})`, value: pb * 2 },
        { label: `Mod + PB (${mod + pb >= 0 ? '+' : ''}${mod + pb})`, value: mod + pb },
        { label: `Mod + 2x PB (${mod + pb * 2 >= 0 ? '+' : ''}${mod + pb * 2})`, value: mod + pb * 2 },
        { label: `Ability Mod (${mod >= 0 ? '+' : ''}${mod})`, value: mod },
        { label: '0 (Flat)', value: 0 },
      ]
    }

    return {
      monster,
      statList,
      saves: computed(() => monster.saves),
      saveModifierForStat,
      formatModifier,
      toggleProficient,
      toggleOverride,
      toggleAdvantage,
      toggleDisadvantage,
      getSaveOverrideOptions,
      validateNumber,
    }
  },
})
</script>
