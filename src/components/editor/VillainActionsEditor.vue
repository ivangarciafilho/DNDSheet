<template>
  <q-expansion-item
    data-editor-section="villainActions"
    expand-separator
    icon="fa-solid fa-crown"
    label="Villain & Bloodied Actions"
    caption="MCDM Villain Actions (Rounds 1–3) & Bloodied Triggers"
  >
    <q-card class="q-pa-sm q-gutter-y-md">
      <!-- 1. MCDM Villain Actions (Round 1-3) -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-accent">
            👑 MCDM Villain Actions (Rounds 1–3)
          </div>
          <q-btn
            dense
            outline
            size="sm"
            color="accent"
            icon="add"
            label="Add Villain Action"
            @click="() => monster.addVillainAction(1)"
          />
        </div>
        <div v-if="!monster.villainActions || monster.villainActions.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No villain actions configured. Add round-specific boss moments (Round 1 Opening, Round 2 Escalation, Round 3 Climax).
        </div>
        <div
          v-for="(va, idx) in monster.villainActions"
          :key="va.id"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);"
        >
          <div class="row q-col-gutter-xs items-center justify-between no-wrap q-mb-xs">
            <div class="col-4 col-sm-3">
              <catalog-select
                v-help="'Boss combat round when this villain action activates (1 Opening, 2 Escalation, 3 Climax).'"
                :model-value="String(va.round)"
                :entries="villainRoundOptions"
                preserve-order
                :searchable="false"
                outlined
                label="Round"
                @update:model-value="(val) => (va.round = ((Number(val) || 1) as 1 | 2 | 3))"
              />
            </div>
            <div class="col-6 col-sm-7">
              <q-input
                v-model="va.name"
                v-help="'Title of this villain action printed in the Villain Actions section.'"
                dense
                outlined
                label="Action Name"
                placeholder="e.g. Call the Pack, Rain of Cinders"
              />
            </div>
            <div class="col-2 col-sm-2 text-right row items-center justify-end q-gutter-x-xs no-wrap">
              <swap-buttons field="villainActions" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="monster.deleteVillainAction(va.id)"
              />
            </div>
          </div>
          <monster-text-editor
            v-model="va.description"
            label="Action Description & Mechanical Effects"
          />
        </div>
      </div>

      <!-- 2. Bloodied Actions (50% HP Triggers) -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-negative">
            🩸 Bloodied Actions (50% HP Triggers)
          </div>
          <q-btn
            dense
            outline
            size="sm"
            color="negative"
            icon="add"
            label="Add Bloodied Action"
            @click="monster.addBloodiedAction"
          />
        </div>
        <div v-if="!monster.bloodiedActions || monster.bloodiedActions.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No bloodied actions configured. Triggers instantaneously when the creature drops to or below 50% HP.
        </div>
        <div
          v-for="(ba, idx) in monster.bloodiedActions"
          :key="ba.id"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);"
        >
          <div class="row q-col-gutter-xs items-center justify-between no-wrap q-mb-xs">
            <div class="col-4 col-sm-3">
              <q-input
                v-model="ba.name"
                v-help="'Title of this Bloodied action printed when the creature reaches half HP.'"
                dense
                outlined
                label="Action Name"
                placeholder="e.g. Enraged Thrash, Death Curse"
              />
            </div>
            <div class="col-3 col-sm-3">
              <catalog-select
                v-model="ba.triggerType"
                v-help="'Action economy cost when becoming Bloodied (Free, Reaction, or Bonus Action).'"
                :entries="bloodiedTriggerOptions"
                preserve-order
                :searchable="false"
                outlined
                label="Action Cost"
              />
            </div>
            <div class="col-3 col-sm-3">
              <mechanic-text-editor
                v-model="ba.trigger"
                dense
                outlined
                label="Trigger Note"
                placeholder="e.g. On Bloodied (50% HP)"
              />
            </div>
            <div class="col-2 col-sm-1">
              <q-checkbox
                v-model="ba.resetOnHeal"
                v-help="'Allow this Bloodied trigger to reactivate if healing restores HP above 50% and it drops again.'"
                label="Resets"
                dense
              />
            </div>
            <div class="col-1 col-sm-2 text-right row items-center justify-end q-gutter-x-xs no-wrap">
              <swap-buttons field="bloodiedActions" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="monster.deleteBloodiedAction(ba.id)"
              />
            </div>
          </div>
          <monster-text-editor
            v-model="ba.description"
            label="Action Description & Effects"
          />
        </div>
      </div>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import MechanicTextEditor from './MechanicTextEditor.vue'
import CatalogSelect from '../kit/CatalogSelect.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { defineComponent } from 'vue'
import MonsterTextEditor from './MonsterTextEditor.vue'
import SwapButtons from './widgets/SwapButtons.vue'

export default defineComponent({
  name: 'VillainActionsEditor',
  components: { CatalogSelect, MechanicTextEditor, MonsterTextEditor, SwapButtons },
  setup() {
    const monster = useMonsterStore()

    if (!Array.isArray(monster.villainActions)) monster.villainActions = []
    if (!Array.isArray(monster.bloodiedActions)) monster.bloodiedActions = []

    const villainRoundOptions = [
      { label: 'Round 1 (Opening Gambit)', value: '1' },
      { label: 'Round 2 (Escalation & Chaos)', value: '2' },
      { label: 'Round 3 (Desperate Climax)', value: '3' },
    ]

    const bloodiedTriggerOptions = [
      { label: 'Free (Instantaneous)', value: 'free' },
      { label: 'Reaction', value: 'reaction' },
      { label: 'Bonus Action', value: 'bonus' },
    ]

    return {
      monster,
      villainRoundOptions,
      bloodiedTriggerOptions,
    }
  },
})
</script>
