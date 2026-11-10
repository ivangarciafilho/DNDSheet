<template>
  <q-expansion-item
    expand-separator
    icon="fa-solid fa-hourglass-half"
    label="Encounter Dynamics (Combos & Tracks)"
    caption="Combo strikes, reactive triggers, and Runehammer escalation tracks"
  >
    <q-card class="q-pa-sm q-gutter-y-md">
      <!-- 1. Reactive Actions -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-warning">
            ⚡ Reactive Actions (Special Triggered Reactions)
          </div>
          <q-btn v-help="'Add Reactive Action in the encounter dynamics editor.'"
            dense
            outline
            size="sm"
            color="warning"
            icon="add"
            label="Add Reactive Action"
            @click="monster.addReactiveAction"
          />
        </div>
        <div v-if="!monster.reactiveActions || monster.reactiveActions.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No reactive actions configured. Special combat counters with custom trigger parameters.
        </div>
        <div
          v-for="(ra, idx) in monster.reactiveActions"
          :key="ra.id"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);"
        >
          <div class="row q-col-gutter-xs items-center justify-between no-wrap q-mb-xs">
            <div class="col-4 col-sm-4">
              <q-input v-help="'Enter action name for the encounter dynamics editor.'"
                v-model="ra.name"
                dense
                outlined
                label="Action Name"
                placeholder="e.g. Riposte, Spell Reflection"
              />
            </div>
            <div class="col-4 col-sm-4">
              <mechanic-text-editor v-help="'Enter trigger condition for the encounter dynamics editor.'"
                v-model="ra.trigger"
                dense
                outlined
                label="Trigger Condition"
                placeholder="e.g. When hit by ranged attack"
              />
            </div>
            <div class="col-2 col-sm-2">
              <mechanic-text-editor v-help="'Enter cost/limit for the encounter dynamics editor.'"
                v-model="ra.cost"
                dense
                outlined
                label="Cost/Limit"
                placeholder="e.g. 1/round"
              />
            </div>
            <div class="col-2 col-sm-2 text-right row items-center justify-end q-gutter-x-xs no-wrap">
              <swap-buttons field="reactiveActions" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="monster.deleteReactiveAction(ra.id)"
              />
            </div>
          </div>
          <monster-text-editor
            v-model="ra.description"
            label="Reaction Description & Consequences"
          />
        </div>
      </div>

      <!-- 2. Combo Actions (Synergy Strikes) -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-info">
            ⛓️ Combo Actions (Chained Strike Synergies)
          </div>
          <q-btn v-help="'Add Combo Action in the encounter dynamics editor.'"
            dense
            outline
            size="sm"
            color="info"
            icon="add"
            label="Add Combo Action"
            @click="monster.addComboAction"
          />
        </div>
        <div v-if="!monster.comboActions || monster.comboActions.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No combo actions configured. Define chained attacks (e.g. Claw hit unlocks instant Bite or Rend).
        </div>
        <div
          v-for="(ca, idx) in monster.comboActions"
          :key="ca.id"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);"
        >
          <div class="row q-col-gutter-xs items-center justify-between no-wrap q-mb-xs">
            <div class="col-3 col-sm-3">
              <q-input v-help="'Enter combo name for the encounter dynamics editor.'"
                v-model="ca.name"
                dense
                outlined
                label="Combo Name"
                placeholder="e.g. Pounce & Rend"
              />
            </div>
            <div class="col-3 col-sm-2">
              <q-input v-help="'Enter lead attack for the encounter dynamics editor.'"
                v-model="ca.leadAction"
                dense
                outlined
                label="Lead Attack"
                placeholder="e.g. Claw hits"
              />
            </div>
            <div class="col-2 col-sm-3">
              <q-input v-help="'Enter followup strike for the encounter dynamics editor.'"
                :model-value="ca.followUpAction || ca.followup"
                dense
                outlined
                label="Followup Strike"
                placeholder="e.g. Free Bite attack"
                @update:model-value="(val: string | number | null) => { ca.followUpAction = `${val ?? ''}`; ca.followup = `${val ?? ''}`; }"
              />
            </div>
            <div class="col-2 col-sm-2">
              <mechanic-text-editor v-help="'Enter condition for the encounter dynamics editor.'"
                v-model="ca.condition"
                dense
                outlined
                label="Condition"
                placeholder="e.g. If Prone"
              />
            </div>
            <div class="col-2 col-sm-2 text-right row items-center justify-end q-gutter-x-xs no-wrap">
              <swap-buttons field="comboActions" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="monster.deleteComboAction(ca.id)"
              />
            </div>
          </div>
          <monster-text-editor
            v-model="ca.description"
            label="Combo Description & Synergies"
          />
        </div>
      </div>

      <!-- 3. Runehammer Escalation Track -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="row items-center q-gutter-x-sm">
            <div class="text-subtitle2 text-weight-bold text-orange">
              ⏳ Runehammer Escalation Track
            </div>
            <q-checkbox v-help="'Tick to include enabled for the encounter dynamics editor.'"
              v-model="monster.runehammerTrack.enabled"
              dense
              label="Enabled"
              color="orange"
            />
          </div>
          <q-btn v-help="'Add Track Event in the encounter dynamics editor.'"
            v-if="monster.runehammerTrack.enabled"
            dense
            outline
            size="sm"
            color="orange"
            icon="add"
            label="Add Track Event"
            @click="() => monster.addTrackEvent((monster.runehammerTrack.events?.length || 0) + 1)"
          />
        </div>
        <div v-if="monster.runehammerTrack.enabled" class="q-gutter-y-xs q-mt-xs">
          <div class="row q-col-gutter-xs items-center">
            <div class="col-12 col-sm-4">
              <q-select v-help="'Choose track die (timer / escalation) for the encounter dynamics editor.'"
                :model-value="monster.runehammerTrack.timerDie || monster.runehammerTrack.die"
                :options="runehammerDieOptions"
                dense
                outlined
                label="Track Die (Timer / Escalation)"
                @update:model-value="(val: string) => { monster.runehammerTrack.timerDie = val as any; monster.runehammerTrack.die = val as any; }"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-help="'Enter starting / current count for the encounter dynamics editor.'"
                v-model.number="monster.runehammerTrack.currentCount"
                type="number"
                dense
                outlined
                label="Starting / Current Count"
              />
            </div>
          </div>

          <!-- Track Events List -->
          <div
            v-for="ev in monster.runehammerTrack.events"
            :key="ev.id"
            class="row q-col-gutter-xs items-center q-pa-xs rounded-borders q-mt-xs"
            style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);"
          >
            <div class="col-2 col-sm-2">
              <q-input v-help="'Enter round/count for the encounter dynamics editor.'"
                v-model.number="ev.round"
                type="number"
                dense
                outlined
                label="Round/Count"
              />
            </div>
            <div class="col-4 col-sm-3">
              <q-input v-help="'Enter event title for the encounter dynamics editor.'"
                v-model="ev.name"
                dense
                outlined
                label="Event Title"
                placeholder="e.g. Roof Collapses"
              />
            </div>
            <div class="col-5 col-sm-6">
              <mechanic-text-editor v-help="'Enter mechanical effect for the encounter dynamics editor.'"
                :model-value="ev.description || ev.effect"
                dense
                outlined
                label="Mechanical Effect"
                placeholder="e.g. 3d6 bludgeoning, DC 15 Dex save"
                @update:model-value="(val: string | number | null) => { ev.description = `${val ?? ''}`; ev.effect = `${val ?? ''}`; }"
              />
            </div>
            <div class="col-1 col-sm-1 text-right">
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="monster.deleteTrackEvent(ev.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { useMonsterStore } from 'src/stores/monster-store'
import { defineComponent } from 'vue'
import MonsterTextEditor from './MonsterTextEditor.vue'
import MechanicTextEditor from './MechanicTextEditor.vue'
import SwapButtons from './widgets/SwapButtons.vue'

export default defineComponent({
  name: 'EncounterDynamicsEditor',
  components: { MechanicTextEditor, MonsterTextEditor, SwapButtons },
  setup() {
    const monster = useMonsterStore()

    if (!Array.isArray(monster.reactiveActions)) monster.reactiveActions = []
    if (!Array.isArray(monster.comboActions)) monster.comboActions = []
    if (!monster.runehammerTrack) {
      monster.runehammerTrack = { enabled: false, die: 'd4', currentCount: 4, events: [] }
    }
    if (!Array.isArray(monster.runehammerTrack.events)) {
      monster.runehammerTrack.events = []
    }

    const runehammerDieOptions = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20']

    return {
      monster,
      runehammerDieOptions,
    }
  },
})
</script>
