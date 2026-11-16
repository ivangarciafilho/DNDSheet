<template>
  <div
    class="q-pa-sm rounded-borders"
    style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
  >
    <div class="row items-center justify-between q-mb-xs">
      <div class="text-subtitle2 text-weight-bold text-negative">
        💔 Vulnerability (Damage)
      </div>
      <div v-if="vulnerabilitiesPreview" class="text-caption text-grey-4">
        <em>{{ vulnerabilitiesPreview }}</em>
      </div>
    </div>

    <!-- Add Vulnerability Dropdown -->
    <div class="q-mb-xs">
      <catalog-select
        v-help="'Vulnerability doubles damage of this type.'"
        :model-value="null"
        :entries="vulnerabilityDamageEntries"
        allow-custom
        searchable
        label="Select or Type Damage Vulnerability to Add"
        @update:model-value="(val) => addDefenseItem('vulnerabilities', val ? String(val) : null)"
      >
        <template #prepend>
          <q-icon name="add" />
        </template>
      </catalog-select>
    </div>

    <!-- Active Vulnerabilities List -->
    <div v-if="monster.vulnerabilitiesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
      No damage vulnerabilities added.
    </div>
    <div
      v-for="(item, idx) in monster.vulnerabilitiesList"
      :key="'vuln-' + idx"
      class="q-pa-xs q-mb-xs rounded-borders"
      style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
    >
      <div class="row items-center justify-between no-wrap">
        <q-chip
          dense
          outline
          color="negative"
          class="q-ma-none text-weight-bold"
          style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
        >
          {{ item.type }}
        </q-chip>
        <div class="row items-center q-gutter-x-xs no-wrap">
          <swap-buttons field="vulnerabilitiesList" :idx="idx" flat dense />
          <q-btn
            flat
            dense
            round
            size="sm"
            color="negative"
            icon="delete"
            @click="removeDefenseItem('vulnerabilities', idx)"
          />
        </div>
      </div>

      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-3">
          <q-checkbox v-model="item.nonmagical" v-help="$t('help.defenses.nonmagicalOnly')" label="Nonmagical" dense @update:model-value="syncDefenses" />
        </div>
        <div class="col-12 col-sm-9">
          <catalog-select
            v-help="'Save bonus or penalty and its result.'"
            :model-value="getUnifiedSaveOutcome(item)"
            :entries="unifiedSaveOutcomeOptions"
            preserve-order
            allow-custom
            searchable
            clearable
            label="Save Modifier & Outcome"
            @update:model-value="(val) => setUnifiedSaveOutcome(item, val ? String(val) : null)"
          />
        </div>
      </div>

      <!-- Acquired Condition when taking Vulnerability Damage & Duration -->
      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-5">
          <catalog-select
v-help="$t('help.defenses.acquiredCondition')"
            :model-value="item.acquiredCondition ?? ''"
            :entries="acquiredConditionEntries"
            allow-custom
            searchable
            clearable
            label="Acquired Negative Condition"
            @update:model-value="val => { item.acquiredCondition = String(val || ''); syncDefenses() }"
          />
        </div>
        <div class="col-12 col-sm-3">
          <catalog-select
            v-help="'How long the effect lasts.'"
            :model-value="item.conditionDuration ?? ''"
            :entries="conditionDurationEntries"
            preserve-order
            searchable
            clearable
            label="Duration"
            @update:model-value="val => { item.conditionDuration = String(val || ''); syncDefenses() }"
          />
        </div>
        <div class="col-12 col-sm-4">
          <mechanic-text-editor
v-model="item.note"
            v-help="$t('help.defenses.conditionTriggerNote')"
            label="Note (e.g. while frozen)"
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
  name: 'DamageVulnerabilitiesSection',
  components: { CatalogSelect, MechanicTextEditor, SwapButtons },
  setup() {
    return injectResistancesEditorState()
  },
})
</script>
