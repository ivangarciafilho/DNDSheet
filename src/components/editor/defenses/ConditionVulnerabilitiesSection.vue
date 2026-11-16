<template>
  <div
    class="q-pa-sm rounded-borders"
    style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
  >
    <div class="row items-center justify-between q-mb-xs">
      <div class="text-subtitle2 text-weight-bold text-deep-orange-4">
        ⚠️ Vulnerability (Conditions)
      </div>
      <div v-if="conditionVulnerabilitiesPreview" class="text-caption text-grey-4">
        <em>{{ conditionVulnerabilitiesPreview }}</em>
      </div>
    </div>

    <div class="q-mb-xs">
      <catalog-select
        v-help="'Disadvantage on saves against this condition.'"
        :model-value="null"
        :entries="vulnerabilityConditionEntries"
        allow-custom
        searchable
        label="Select or Type Condition Vulnerability to Add"
        @update:model-value="(val) => addDefenseItem('conditionVulnerabilities', val ? String(val) : null)"
      >
        <template #prepend>
          <q-icon name="add" />
        </template>
      </catalog-select>
    </div>

    <div v-if="monster.conditionVulnerabilitiesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
      No condition vulnerabilities added.
    </div>
    <div
      v-for="(item, idx) in monster.conditionVulnerabilitiesList"
      :key="'condvuln-' + idx"
      class="q-pa-xs q-mb-xs rounded-borders"
      style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
    >
      <div class="row items-center justify-between no-wrap">
        <q-chip
          dense
          outline
          color="deep-orange-4"
          class="q-ma-none text-weight-bold"
          style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
        >
          {{ item.type }}
        </q-chip>
        <div class="row items-center q-gutter-x-xs no-wrap">
          <swap-buttons field="conditionVulnerabilitiesList" :idx="idx" flat dense />
          <q-btn
            flat
            dense
            round
            size="sm"
            color="negative"
            icon="delete"
            @click="removeDefenseItem('conditionVulnerabilities', idx)"
          />
        </div>
      </div>

      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-7">
          <catalog-select
v-help="$t('help.defenses.compelledWeakness')"
            :model-value="item.acquiredCondition ?? ''"
            :entries="conditionVulnerabilityActionEntries"
            allow-custom
            searchable
            clearable
            label="Compelled Action / Weakness"
            placeholder="e.g. wastes Reaction to move up to speed"
            @update:model-value="val => { item.acquiredCondition = String(val || ''); syncDefenses() }"
          />
        </div>
        <div class="col-12 col-sm-5">
          <mechanic-text-editor
v-model="item.note"
            v-help="$t('help.defenses.weaknessNote')"
            label="Note / Duration"
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
  name: 'ConditionVulnerabilitiesSection',
  components: { CatalogSelect, MechanicTextEditor, SwapButtons },
  setup() {
    return injectResistancesEditorState()
  },
})
</script>
