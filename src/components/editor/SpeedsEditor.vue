<template>
  <q-expansion-item
    expand-separator
    icon="speed"
    :label="$t('editor.speeds.label')"
    :caption="$t('editor.speeds.caption')"
  >
    <q-card class="q-pa-xs">
      <!-- Standard Speeds List -->
      <q-card-section class="q-pa-xs">
        <!-- Speeds Auto-Add Dropdown (No add button required) -->
        <div class="row items-center q-col-gutter-xs q-mb-sm">
          <div class="col-12">
            <q-select
              dense
              outlined
              :model-value="null"
              :options="availableSpeedOptions"
              use-input
              input-debounce="0"
              new-value-mode="add-unique"
              label="Add Speed (select or type to add)..."
              placeholder="Select or type movement type (e.g. fly, swim, burrow, climb)"
              clearable
              @update:model-value="onSpeedSelected"
              @filter="movementFilter"
            >
              <template #prepend>
                <q-icon name="add" />
              </template>
            </q-select>
          </div>
        </div>

        <div v-if="speeds.length === 0" class="text-caption text-grey-5 q-pa-xs text-center">
          No speeds configured. Select or type a speed type above to add.
        </div>

        <div class="row q-col-gutter-xs">
          <div
            v-for="(speed, idx) in speeds"
            :key="speed.id"
            class="col-12 q-pa-xs"
          >
            <q-card
              flat
              bordered
              class="q-pa-xs rounded-borders"
              style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12);"
            >
              <div class="row items-center q-col-gutter-xs">
                <div class="col-12 col-sm-4">
                  <q-select
                    dense
                    outlined
                    v-model="speed.type"
                    :options="filteredMovementOptions"
                    use-input
                    input-debounce="0"
                    :label="$t('monster.movement.type.label')"
                    new-value-mode="add-unique"
                    @filter="movementFilter"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    dense
                    outlined
                    :model-value="speed.speed"
                    :options="speedPresetOptions"
                    use-input
                    fill-input
                    hide-selected
                    :label="$t('monster.movement.speed')"
                    suffix="ft"
                    new-value-mode="add-unique"
                    @input-value="(val) => (speed.speed = validateNumber(val, 0))"
                    @update:model-value="(val) => (speed.speed = validateNumber(val, 0))"
                  />
                </div>
                <div class="col-9 col-sm-3">
                  <q-input
                    dense
                    outlined
                    v-model="speed.note"
                    :label="$t('monster.movement.note')"
                    placeholder="e.g. hover, 120 ft. outside water"
                  />
                </div>
                <div class="col-3 col-sm-2 text-right row items-center justify-end q-gutter-x-xs no-wrap">
                  <swap-buttons field="speeds" :idx="idx" flat dense />
                  <q-btn
                    dense
                    round
                    size="sm"
                    icon="delete"
                    color="negative"
                    flat
                    @click="() => deleteSpeed(speed.id)"
                  >
                    <q-tooltip class="text-body2">{{ $t('editor.delete') }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
              <div v-if="speed.type && speed.type.toLowerCase() === 'fly'" class="row items-center q-mt-xs q-px-xs">
                <q-checkbox
                  v-model="speed.hover"
                  dense
                  label="Hover (does not fall if speed reduced to 0)"
                  color="accent"
                />
              </div>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator class="q-my-sm" />

      <!-- Traversal & Cunning Actions Section -->
      <q-expansion-item
        dense
        dense-toggle
        expand-separator
        class="rounded-borders q-ma-xs"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
        icon="alt_route"
        label="Traversal & Cunning Actions"
        caption="Consolidated single-line speeds, difficult terrain, and bonus action moves"
      >
        <div class="q-pa-sm">
          <div class="text-caption text-grey-4 q-mb-sm">
            Configure terrain traversal, bonus action movements, and special tactical speeds (rendered cleanly on the single Speeds line):
          </div>

          <!-- Amorphous & Phasing Mechanics -->
          <div
            class="q-pa-xs q-mb-sm rounded-borders"
            style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);"
          >
            <div class="text-caption text-weight-bold text-teal q-mb-xs">
              💧 Amorphous & Fluid Movement Options
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="speedTraversal.amorphous1Inch"
                  dense
                  label="Move through 1-inch spaces without squeezing"
                  color="teal"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="speedTraversal.amorphousCannotEnterLiquids"
                  dense
                  label="Cannot enter liquid bodies"
                  color="teal"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="speedTraversal.moveThroughCreaturesDifficultTerrain"
                  dense
                  label="Move through creature spaces as difficult terrain"
                  color="teal"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-checkbox
                  v-model="speedTraversal.moveThroughCreaturesTwoSizesDifferent"
                  dense
                  label="Move through spaces of creatures 2+ sizes different"
                  color="teal"
                />
              </div>
              <template v-if="speedTraversal.moveThroughCreaturesDifficultTerrain">
                <div class="col-12 col-sm-6">
                  <q-checkbox
                    v-model="speedTraversal.moveThroughCreaturesShunt"
                    dense
                    label="Shunts creature if ending turn inside"
                    color="teal"
                  />
                </div>
                <template v-if="speedTraversal.moveThroughCreaturesShunt">
                  <div class="col-12 col-sm-6">
                    <q-select
                      v-model="speedTraversal.shuntDestination"
                      :options="shuntDestinationOptions"
                      emit-value
                      map-options
                      dense
                      outlined
                      label="Shunt Outcome"
                    />
                  </div>
                  <div v-if="speedTraversal.shuntDestination !== 'ethereal_plane'" class="col-12 col-sm-6">
                    <q-select
                      v-model="speedTraversal.moveThroughCreaturesShuntDamage"
                      :options="shuntDamageOptions"
                      dense
                      outlined
                      use-input
                      new-value-mode="add-unique"
                      label="Shunt Damage"
                      placeholder="e.g. 1d10 force"
                    />
                  </div>
                </template>
              </template>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="speedTraversal.etherealJaunt"
                  :options="etherealJauntOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Planar Shift (Material / Ethereal)"
                />
              </div>
            </div>
          </div>

          <!-- Aquatic Breathing & Environments -->
          <div
            class="q-pa-xs q-mb-sm rounded-borders"
            style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08);"
          >
            <div class="text-caption text-weight-bold text-info q-mb-xs">
              🌊 Aquatic Breathing & Physiology
            </div>
            <div class="row q-col-gutter-xs items-center">
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="speedTraversal.aquaticBreathing"
                  :options="aquaticBreathingOptions"
                  emit-value
                  map-options
                  dense
                  outlined
                  label="Aquatic Breathing"
                />
              </div>
              <div v-if="speedTraversal.aquaticBreathing === 'hold_breath'" class="col-12 col-sm-6">
                <q-input
                  v-model="speedTraversal.holdBreathDuration"
                  dense
                  outlined
                  label="Hold Breath Duration"
                  placeholder="e.g. 1 hour, 15 minutes"
                />
              </div>
            </div>
          </div>

          <!-- Terrain and Cunning Checkboxes -->
          <div class="row q-col-gutter-sm items-center q-mb-sm">
            <div class="col-12 col-sm-6 col-md-3">
              <q-checkbox
                v-model="speedTraversal.ignoresDifficultTerrain"
                dense
                label="Ignores Difficult Terrain"
                color="secondary"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-checkbox
                v-model="speedTraversal.bonusActionDash"
                dense
                label="Bonus Action Dash"
                color="primary"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-checkbox
                v-model="speedTraversal.bonusActionDodge"
                dense
                label="Bonus Action Dodge"
                color="primary"
              />
            </div>
            <div class="col-12 col-sm-6 col-md-3">
              <q-checkbox
                v-model="speedTraversal.bonusActionDisengage"
                dense
                label="Bonus Action Disengage"
                color="primary"
              />
            </div>
          </div>

          <!-- Specific Tactical Speeds -->
          <div class="row q-col-gutter-xs items-center q-mb-xs">
            <div class="col-12 col-sm-4">
              <q-select
                dense
                outlined
                v-model="speedTraversal.bonusActionSpeed"
                :options="speedPresetOptions"
                use-input
                fill-input
                hide-selected
                label="Bonus Action Speed"
                suffix="ft"
                new-value-mode="add-unique"
                @input-value="(val) => (speedTraversal.bonusActionSpeed = validateNumber(val, 0))"
                @update:model-value="(val) => (speedTraversal.bonusActionSpeed = validateNumber(val, 0))"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                dense
                outlined
                v-model="speedTraversal.trackingSpeed"
                :options="speedPresetOptions"
                use-input
                fill-input
                hide-selected
                label="Tracking Speed"
                suffix="ft"
                new-value-mode="add-unique"
                @input-value="(val) => (speedTraversal.trackingSpeed = validateNumber(val, 0))"
                @update:model-value="(val) => (speedTraversal.trackingSpeed = validateNumber(val, 0))"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-select
                dense
                outlined
                v-model="speedTraversal.stealthSpeed"
                :options="speedPresetOptions"
                use-input
                fill-input
                hide-selected
                label="Stealth / Silent Speed"
                suffix="ft"
                new-value-mode="add-unique"
                @input-value="(val) => (speedTraversal.stealthSpeed = validateNumber(val, 0))"
                @update:model-value="(val) => (speedTraversal.stealthSpeed = validateNumber(val, 0))"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center">
            <div class="col-12">
              <q-input
                dense
                outlined
                v-model="speedTraversal.note"
                label="Traversal Note"
                placeholder="e.g. climbing does not cost extra movement, ignores nonmagical webbing"
                clearable
              />
            </div>
          </div>
        </div>
      </q-expansion-item>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, defineComponent, ref } from 'vue'
import { STANDARD_MOVEMENTS } from 'src/data/MOVEMENT'
import { useI18n } from 'vue-i18n'
import { basicArrayFilter } from '../filters'
import { validateNumber } from './numberInput'
import SwapButtons from './widgets/SwapButtons.vue'

export default defineComponent({
  name: 'SpeedsEditor',
  components: { SwapButtons },
  setup() {
    const { t } = useI18n()
    const monster = useMonsterStore()

    if (!monster.speedTraversal) {
      monster.speedTraversal = {
        ignoresDifficultTerrain: false,
        bonusActionDash: false,
        bonusActionDodge: false,
        bonusActionDisengage: false,
        bonusActionSpeed: 0,
        trackingSpeed: 0,
        stealthSpeed: 0,
        note: '',
      }
    }
    const speedTraversal = monster.speedTraversal

    const defaultSpeedOptions = computed(() => {
      return STANDARD_MOVEMENTS.map((m) => t(`monster.movement.type.${m}`)).sort((a, b) => a.localeCompare(b))
    })
    const filteredMovementOptions = ref(Array.from(defaultSpeedOptions.value))

    const availableSpeedOptions = computed(() => {
      const existing = new Set((monster.speeds || []).map((s) => (s.type || 'walk').toLowerCase()))
      return filteredMovementOptions.value.filter((opt) => !existing.has(opt.toLowerCase()))
    })

    const movementFilter = basicArrayFilter(
      defaultSpeedOptions,
      filteredMovementOptions
    )

    const shuntDestinationOptions = [
      { label: 'Nearest Unoccupied Space (Deals Damage)', value: 'nearest_unoccupied' },
      { label: 'Shunt to Ethereal Plane', value: 'ethereal_plane' },
    ]

    const shuntDamageOptions = [
      '1d6 force',
      '1d10 force',
      '2d6 force',
      '2d10 force',
      '3d6 force',
      '3d10 force',
      '4d10 force',
      '1d6 bludgeoning',
      '1d10 bludgeoning',
    ]

    const etherealJauntOptions = [
      { label: 'None', value: 'none' },
      { label: 'Shift to/from Ethereal Plane (Bonus Action)', value: 'bonus_action' },
      { label: 'Shift to/from Ethereal Plane (Action)', value: 'action' },
      { label: 'Shift to/from Ethereal Plane (At-Will, No Action)', value: 'at_will' },
    ]

    const aquaticBreathingOptions = [
      { label: 'None', value: 'none' },
      { label: 'Can breathe underwater', value: 'underwater' },
      { label: 'Amphibious (breathes air and water)', value: 'amphibious' },
      { label: 'Water only (can breathe only underwater)', value: 'water_only' },
      { label: 'Hold Breath (can hold breath for duration)', value: 'hold_breath' },
    ]

    const onSpeedSelected = (val: string | null) => {
      if (!val) return
      const clean = val.trim()
      // Deduplicate: prevent adding duplicate speed type
      if ((monster.speeds || []).some((s) => (s.type || 'walk').toLowerCase() === clean.toLowerCase())) {
        return
      }
      monster.addSpeed({
        type: clean,
        speed: 30,
        note: '',
      })
    }

    const speedPresetOptions = [
      '0', '5', '10', '15', '20', '25', '30', '35', '40', '45', '50', '60', '70', '80', '90', '100', '120', '150'
    ]

    return {
      speeds: computed(() => monster.speeds),
      speedTraversal,
      speedPresetOptions,
      addSpeed: monster.addSpeed,
      deleteSpeed: monster.deleteSpeed,
      movementFilter,
      filteredMovementOptions,
      availableSpeedOptions,
      shuntDestinationOptions,
      shuntDamageOptions,
      etherealJauntOptions,
      aquaticBreathingOptions,
      onSpeedSelected,
      validateNumber,
    }
  },
})
</script>
