<template>
  <q-expansion-item
    data-editor-section="anatomy"
    expand-separator
    icon="fa-solid fa-shield-halved"
    label="Draco Anatomy (Breakable Limbs)"
    caption="Targetable body parts with separate HP/AC thresholds (e.g. sever wings, break horns)"
  >
    <q-card class="q-pa-sm">
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-teal">
            🐉 Draco Anatomy (Targetable Body Parts)
          </div>
          <q-btn
            dense
            outline
            size="sm"
            color="teal"
            icon="add"
            label="Add Anatomy Part"
            @click="() => monster.addAnatomyPart('Wings')"
          />
        </div>
        <div v-if="!monster.anatomyParts || monster.anatomyParts.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No breakable anatomy configured. Targetable body parts with separate HP/AC thresholds (e.g. sever wings to ground creature).
        </div>
        <div
          v-for="(ap, idx) in monster.anatomyParts"
          :key="ap.id"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06);"
        >
          <div class="row q-col-gutter-xs items-center justify-between no-wrap q-mb-xs">
            <div class="col-3 col-sm-3">
              <q-input
                :model-value="ap.name || ap.part"
                @update:model-value="(val: string | number | null) => { const s = String(val ?? ''); ap.name = s; ap.part = s; }"
                dense
                outlined
                label="Body Part"
                placeholder="e.g. Left Wing, Tail, Horn"
              />
            </div>
            <div class="col-2 col-sm-1">
              <formula-field
                :path="`anatomyParts[id=${encodeURIComponent(ap.id)}].hp`"
                label="Part HP"
                v-help="'Hit points required to disable or sever this body part.'"
                dense
                outlined
              />
            </div>
            <div class="col-2 col-sm-1">
              <formula-field
                :path="`anatomyParts[id=${encodeURIComponent(ap.id)}].ac`"
                label="Part AC"
                v-help="'Armor Class used when targeting this part instead of main AC.'"
                dense
                outlined
                clearable
              />
            </div>
            <div class="col-2 col-sm-2">
              <formula-field
                :path="`anatomyParts[id=${encodeURIComponent(ap.id)}].threshold`"
                label="Threshold"
                placeholder="Dmg"
                v-help="'Minimum damage a single hit must deal before damaging this part.'"
                dense
                outlined
                clearable
              />
            </div>
            <div class="col-3 col-sm-3">
              <q-input
                :model-value="ap.breakEffect || ap.severEffect"
                @update:model-value="(val: string | number | null) => { const s = String(val ?? ''); ap.breakEffect = s; ap.severEffect = s; }"
                dense
                outlined
                label="Severed / Broken Consequence"
                placeholder="e.g. Loses fly speed, -2 AC"
              />
            </div>
            <div class="col-1 col-sm-2 text-right row items-center justify-end q-gutter-x-xs no-wrap">
              <swap-buttons field="anatomyParts" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="monster.deleteAnatomyPart(ap.id)"
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
import FormulaField from '../kit/FormulaField.vue'
import SwapButtons from './widgets/SwapButtons.vue'

export default defineComponent({
  name: 'AnatomyEditor',
  components: { FormulaField, SwapButtons },
  setup() {
    const monster = useMonsterStore()
    if (!Array.isArray(monster.anatomyParts)) monster.anatomyParts = []

    return {
      monster,
    }
  },
})
</script>
