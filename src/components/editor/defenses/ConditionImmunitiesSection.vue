<template>
  <div
    class="q-pa-sm rounded-borders"
    style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
  >
    <div class="row items-center justify-between q-mb-xs">
      <div class="text-subtitle2 text-weight-bold text-accent">
        ✨ Immunity (Conditions)
      </div>
      <div v-if="conditionsPreview" class="text-caption text-grey-4">
        <em>{{ conditionsPreview }}</em>
      </div>
    </div>

    <div class="q-mb-xs">
      <catalog-select
        v-help="'The creature cannot be affected by this condition.'"
        :model-value="null"
        :entries="conditionImmunitiesEntries"
        allow-custom
        searchable
        label="Select or Type Condition Immunity to Add"
        @update:model-value="(val) => addDefenseItem('conditions', val ? String(val) : null)"
      >
        <template #prepend>
          <q-icon name="add" />
        </template>
      </catalog-select>
    </div>

    <div v-if="monster.conditionsList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
      No condition immunities added.
    </div>
    <div
      v-for="(item, idx) in monster.conditionsList"
      :key="'cond-' + idx"
      class="q-pa-xs q-mb-xs rounded-borders"
      style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
    >
      <div class="row items-center justify-between no-wrap">
        <q-chip
          dense
          outline
          color="accent"
          class="q-ma-none text-weight-bold"
          style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
        >
          {{ item.type }}
        </q-chip>
        <div class="row items-center q-gutter-x-xs no-wrap">
          <swap-buttons field="conditionsList" :idx="idx" flat dense />
          <q-btn
            flat
            dense
            round
            size="sm"
            color="negative"
            icon="delete"
            @click="removeDefenseItem('conditions', idx)"
          />
        </div>
      </div>

      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-6">
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
        <div class="col-12 col-sm-6">
          <mechanic-text-editor
v-model="item.note"
            v-help="$t('help.defenses.immunityNote')"
            label="Note (e.g. against charm spells)"
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
  name: 'ConditionImmunitiesSection',
  components: { CatalogSelect, MechanicTextEditor, SwapButtons },
  setup() {
    return injectResistancesEditorState()
  },
})
</script>
