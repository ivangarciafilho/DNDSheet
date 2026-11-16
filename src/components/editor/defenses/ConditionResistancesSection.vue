<template>
  <div
    class="q-pa-sm rounded-borders"
    style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
  >
    <div class="row items-center justify-between q-mb-xs">
      <div class="text-subtitle2 text-weight-bold text-teal-4">
        🔰 Resistances (Conditions)
      </div>
      <div v-if="conditionResistancesPreview" class="text-caption text-grey-4">
        <em>{{ conditionResistancesPreview }}</em>
      </div>
    </div>

    <div class="q-mb-xs">
      <catalog-select
        v-help="'Advantage on saves against this condition.'"
        :model-value="null"
        :entries="conditionResistancesEntries"
        allow-custom
        searchable
        label="Select or Type Condition Resistance to Add"
        @update:model-value="(val) => addDefenseItem('conditionResistances', val ? String(val) : null)"
      >
        <template #prepend>
          <q-icon name="add" />
        </template>
      </catalog-select>
    </div>

    <div v-if="monster.conditionResistancesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
      No condition resistances added.
    </div>
    <div
      v-for="(item, idx) in monster.conditionResistancesList"
      :key="'condres-' + idx"
      class="q-pa-xs q-mb-xs rounded-borders"
      style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
    >
      <div class="row items-center justify-between no-wrap">
        <q-chip
          dense
          outline
          color="teal-4"
          class="q-ma-none text-weight-bold"
          style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
        >
          {{ item.type }}
        </q-chip>
        <div class="row items-center q-gutter-x-xs no-wrap">
          <swap-buttons field="conditionResistancesList" :idx="idx" flat dense />
          <q-btn
            flat
            dense
            round
            size="sm"
            color="negative"
            icon="delete"
            @click="removeDefenseItem('conditionResistances', idx)"
          />
        </div>
      </div>

      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-8">
          <catalog-select
            v-help="'What a successful or failed save means here.'"
            :model-value="getUnifiedSaveOutcome(item)"
            :entries="unifiedSaveOutcomeOptions"
            preserve-order
            :searchable="false"
            clearable
            label="Save Outcome & Defense Mode"
            @update:model-value="(val) => setUnifiedSaveOutcome(item, val ? String(val) : null)"
          />
        </div>
        <div class="col-12 col-sm-4">
          <mechanic-text-editor
v-model="item.note"
            v-help="$t('help.defenses.weaknessNote')"
            label="Note / Details"
            dense
            outlined
            @update:model-value="syncDefenses"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CatalogSelect from '../../kit/CatalogSelect.vue'
import MechanicTextEditor from '../MechanicTextEditor.vue'
import SwapButtons from '../widgets/SwapButtons.vue'
import { injectResistancesEditorState } from './useResistancesEditorState'

export default defineComponent({
  name: 'ConditionResistancesSection',
  components: { CatalogSelect, MechanicTextEditor, SwapButtons },
  setup() {
    return injectResistancesEditorState()
  },
})
</script>
