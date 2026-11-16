<template>
  <div
    class="q-pa-sm rounded-borders"
    style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
  >
    <div class="row items-center justify-between q-mb-xs">
      <div class="text-subtitle2 text-weight-bold text-secondary">
        ⚡ Immunity (Damage)
      </div>
      <div v-if="immunitiesPreview" class="text-caption text-grey-4">
        <em>{{ immunitiesPreview }}</em>
      </div>
    </div>

    <div class="q-mb-xs">
      <catalog-select
        v-help="'Immunity: the creature takes no damage of this type.'"
        :model-value="null"
        :entries="immunityDamageEntries"
        allow-custom
        searchable
        label="Select or Type Damage Immunity to Add"
        @update:model-value="(val) => addDefenseItem('immunities', val ? String(val) : null)"
      >
        <template #prepend>
          <q-icon name="add" />
        </template>
      </catalog-select>
    </div>

    <div v-if="monster.immunitiesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
      No damage immunities added.
    </div>
    <div
      v-for="(item, idx) in monster.immunitiesList"
      :key="'imm-' + idx"
      class="q-pa-xs q-mb-xs rounded-borders"
      style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
    >
      <div class="row items-center justify-between no-wrap">
        <q-chip
          dense
          outline
          color="secondary"
          class="q-ma-none text-weight-bold"
          style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
        >
          {{ item.type }}
        </q-chip>
        <div class="row items-center q-gutter-x-xs no-wrap">
          <swap-buttons field="immunitiesList" :idx="idx" flat dense />
          <q-btn
            flat
            dense
            round
            size="sm"
            color="negative"
            icon="delete"
            @click="removeDefenseItem('immunities', idx)"
          />
        </div>
      </div>

      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-3">
          <q-checkbox v-model="item.nonmagical" v-help="$t('help.defenses.nonmagicalOnly')" label="Nonmagical" dense @update:model-value="syncDefenses" />
        </div>
        <div class="col-12 col-sm-9">
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
      </div>

      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-5">
          <mechanic-select-editor
            v-model="item.triggeredBenefit"
            v-help="'What the creature gains when the trigger happens.'"
            :options="benefitOptions"
            use-input
            new-value-mode="add-unique" label="Triggered Benefit / Reaction"
            dense
            outlined
            clearable
            @update:model-value="syncDefenses"
          />
        </div>
        <div class="col-12 col-sm-3">
          <catalog-select
            v-help="'What sets off this defensive effect.'"
            :model-value="item.benefitTrigger ?? ''"
            :entries="benefitTriggerOptions"
            preserve-order
            :searchable="false"
            label="Trigger"
            @update:model-value="val => { item.benefitTrigger = String(val || 'when hit'); syncDefenses() }"
          />
        </div>
        <div class="col-12 col-sm-4">
          <mechanic-text-editor
v-model="item.note"
            v-help="$t('help.defenses.immunityNote')"
            label="Note (e.g. adamantine)"
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
import MechanicSelectEditor from '../MechanicSelectEditor.vue'
import SwapButtons from '../widgets/SwapButtons.vue'
import { injectResistancesEditorState } from './useResistancesEditorState'

export default defineComponent({
  name: 'DamageImmunitiesSection',
  components: { CatalogSelect, MechanicTextEditor, MechanicSelectEditor, SwapButtons },
  setup() {
    return injectResistancesEditorState()
  },
})
</script>
