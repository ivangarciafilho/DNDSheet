<template>
  <div>
    <!-- 8. Initiative Tuning & Paragon Multi-Phase Gate -->
    <q-expansion-item
      dense
      dense-toggle
      expand-separator
      class="q-mt-sm rounded-borders"
      style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      icon="flash_on"
      label="Initiative Tuning & Paragon Phases"
      v-help="'Tune initiative bonus, advantage, lair count, start-of-combat riders, and Paragon stage pools.'"
      caption="Proficiency, secondary ability, Lair count, spell triggers & Paragon phase pools"
    >
      <div class="q-pa-sm q-gutter-y-sm">
        <div class="row q-col-gutter-xs items-center">
          <div class="col-12 col-sm-3">
            <q-checkbox
              v-model="initiativeConfig.proficient"
              label="Add Proficiency Bonus"
              v-help="$t('help.checks.proficiency')"
              dense
            />
          </div>
          <div class="col-12 col-sm-3">
            <catalog-select
              :model-value="initiativeConfig.secondaryStat"
              :entries="SECONDARY_STAT_ENTRIES"
              preserve-order
              :searchable="false"
              label="Secondary Ability"
              v-help="'Second ability score that adds to or replaces Dexterity on Initiative rolls.'"
              @update:model-value="(val) => (initiativeConfig.secondaryStat = String(val || 'none') as typeof initiativeConfig.secondaryStat)"
            />
          </div>
          <div class="col-12 col-sm-2">
            <catalog-select
              v-help="$t('help.checks.secondaryStatMode')"
              :model-value="initiativeConfig.statMode"
              :entries="STAT_MODE_ENTRIES"
              preserve-order
              :searchable="false"
              label="Secondary Mode"
              :disable="initiativeConfig.secondaryStat === 'none'"
              @update:model-value="(val) => (initiativeConfig.statMode = String(val || 'add') as typeof initiativeConfig.statMode)"
            />
          </div>
          <div class="col-12 col-sm-4 text-center">
            <q-badge
              color="accent"
              outline
              class="text-subtitle2 q-pa-xs"
              style="white-space: normal; word-break: break-word; line-height: 1.25; display: inline-flex; align-items: center; justify-content: center; max-width: 100%;"
            >
              Initiative: {{ initiativePreview }}
            </q-badge>
          </div>
        </div>

        <div class="row q-col-gutter-xs items-center">
          <div class="col-12 col-sm-5 editor-fit-wrap items-center">
            <span class="text-caption text-grey-4">Roll State:</span>
            <q-btn-toggle
              v-model="initiativeRollMode"
              v-help="'Set whether the creature rolls Initiative normally, with Advantage, or with Disadvantage.'"
              dense
              no-caps
              rounded
              unelevated
              size="sm"
              toggle-color="primary"
              color="grey-9"
              text-color="grey-4"
              :options="[
                { label: 'Normal', value: 'normal' },
                { label: 'Advantage', value: 'advantage' },
                { label: 'Disadvantage', value: 'disadvantage' }
              ]"
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-checkbox
              v-model="initiativeConfig.cantBeSurprised"
              label="Can't be Surprised"
              v-help="'Grants immunity to the Surprised condition at combat start.'"
              dense
            />
          </div>
          <div class="col-6 col-sm-2">
            <q-checkbox
              v-model="initiativeConfig.useLairInitiative"
              label="Lair Initiative"
              v-help="'Enable a dedicated initiative count for Lair Actions (typically 20, losing ties).'"
              dense
            />
          </div>
          <div v-if="initiativeConfig.useLairInitiative" class="col-6 col-sm-2">
            <formula-field
              path="initiativeConfig.lairInitiative"
              label="Lair"
              v-help="'Initiative count on which Lair Actions occur (typically 20).'"
              dense
              outlined
            />
          </div>
        </div>

        <!-- Special Initiative Trigger / Spell Cast Rule -->
        <div class="row q-col-gutter-sm items-center">
          <div class="col-12 col-sm-6">
            <catalog-select
              v-help="$t('help.checks.initSpecialRule')"
              :model-value="initiativeConfig.specialTrigger"
              :entries="INITIATIVE_TRIGGER_ENTRIES"
              preserve-order
              label="Special Initiative Trigger / Spell Rule"
              @update:model-value="(val) => (initiativeConfig.specialTrigger = String(val || 'none') as typeof initiativeConfig.specialTrigger)"
            />
          </div>
          <div v-if="initiativeConfig.specialTrigger === 'cast_custom'" class="col-12 col-sm-6">
            <q-input
              v-help="$t('help.checks.initLowestDieSpell')"
              v-model="initiativeConfig.specialTriggerSpell"
              dense
              outlined
              label="Spell Name to Cast on Lowest Dice"
              placeholder="e.g. Sanctuary, Shield of Faith"
            />
          </div>
          <div v-else-if="initiativeConfig.specialTrigger === 'custom'" class="col-12 col-sm-6">
            <mechanic-text-editor
              v-help="$t('help.checks.initCustomNote')"
              v-model="initiativeConfig.customEffectNote"
              dense
              outlined
              label="Custom Initiative Note"
              placeholder="e.g. Acts twice per round"
            />
          </div>
        </div>

        <!-- Modular Composable Initiative Riders -->
        <div
          class="q-pa-sm rounded-borders"
          style="background: rgba(147, 51, 234, 0.05); border: 1px dashed rgba(147, 51, 234, 0.4);"
        >
          <div class="row items-center justify-between q-mb-xs">
            <div class="text-caption text-weight-bold" style="color: #c084fc;">
              Composable Initiative Riders &amp; Permutable Mechanics
            </div>
            <q-badge v-if="initiativeConfig.riders && initiativeConfig.riders.length > 0" color="purple-5" outline>
              {{ initiativeConfig.riders.length }} Active Rider{{ initiativeConfig.riders.length > 1 ? 's' : '' }}
            </q-badge>
          </div>

          <div v-if="initiativeConfig.riders && initiativeConfig.riders.length > 0" class="editor-fit-wrap q-mb-sm">
            <q-chip
              v-for="(rider, rIdx) in initiativeConfig.riders"
              :key="rider.id || 'r-' + rIdx"
              removable
              dense
              color="purple-9"
              text-color="purple-1"
              @remove="removeInitiativeRider(rIdx)"
            >
              {{ formatInitiativeRider(rider) }}
            </q-chip>
          </div>

          <!-- Composer Row -->
          <div class="row q-col-gutter-xs items-center">
            <div class="col-12 col-sm-3">
              <catalog-select
                v-help="$t('help.checks.initPrecondition')"
                :model-value="newRiderAdvMode"
                :entries="INITIATIVE_ADV_MODE_ENTRIES"
                preserve-order
                :searchable="false"
                label="Roll Precondition"
                @update:model-value="(val) => (newRiderAdvMode = String(val || 'any') as typeof newRiderAdvMode)"
              />
            </div>

            <div class="col-12 col-sm-4">
              <catalog-select
                v-help="$t('help.checks.initTargetCreatureTypes')"
                :model-value="newRiderCreatureTypes"
                :entries="PLURAL_CREATURE_TYPE_ENTRIES"
                multiple
                use-chips
                label="Target Creature Types"
                placeholder="e.g. Fiends, Undead"
                @update:model-value="(val) => (newRiderCreatureTypes = Array.isArray(val) ? val.map(String) : [])"
              />
            </div>

            <div v-if="newRiderCreatureTypes && newRiderCreatureTypes.length > 0" class="col-12 col-sm-2">
              <catalog-select
                v-help="$t('help.checks.initTargetEffect')"
                :model-value="newRiderRollEffect"
                :entries="INITIATIVE_ROLL_EFFECT_ENTRIES"
                preserve-order
                :searchable="false"
                label="Target Roll Effect"
                @update:model-value="(val) => (newRiderRollEffect = String(val || 'disadvantage') as typeof newRiderRollEffect)"
              />
            </div>

            <div :class="newRiderCreatureTypes && newRiderCreatureTypes.length > 0 ? 'col-12 col-sm-3' : 'col-12 col-sm-5'">
              <catalog-select
                v-help="$t('help.checks.initComposableAction')"
                :model-value="newRiderActionType"
                :entries="INITIATIVE_ACTION_TYPE_ENTRIES"
                preserve-order
                label="Composable Action"
                @update:model-value="(val) => (newRiderActionType = String(val || 'cast_spell') as typeof newRiderActionType)"
              />
            </div>
          </div>

          <!-- Parameter Row -->
          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div v-if="newRiderActionType === 'cast_spell'" class="col-12 col-sm-6">
              <q-input
                v-model="newRiderSpellName"
                dense
                outlined
                label="Spell Name"
                v-help="'Spell automatically cast at the start of combat when this initiative rider triggers.'"
                placeholder="e.g. Thaumaturgy, Compelled Duel"
              />
            </div>
            <div v-else-if="newRiderActionType === 'regain_hp' || newRiderActionType === 'gain_temp_hp'" class="col-12 col-sm-6">
              <q-input
                v-model="newRiderHpAmount"
                dense
                outlined
                :label="newRiderActionType === 'regain_hp' ? 'Hit Points Regained' : 'Temporary Hit Points Gained'"
                v-help="'Hit Points or Temporary Hit Points amount or dice expression gained on this initiative trigger.'"
                placeholder="e.g. 10 or 2d8+2"
              />
            </div>
            <div v-else-if="newRiderActionType === 'move_distance'" class="col-12 col-sm-6">
              <q-input
                v-help="$t('help.checks.initDistance')"
                v-model="newRiderMoveDistance"
                dense
                outlined
                label="Distance (e.g. 10ft)"
                placeholder="10ft"
              />
            </div>
            <div v-else-if="newRiderActionType === 'custom'" class="col-12 col-sm-6">
              <mechanic-text-editor
                v-help="$t('help.checks.initCustomActionText')"
                v-model="newRiderCustomText"
                dense
                outlined
                label="Custom Action Text"
                placeholder="e.g. Can take the Disengage action"
              />
            </div>

            <div class="col-12 col-sm-3 q-ml-auto text-right">
              <q-btn
                v-help="$t('help.checks.initAddRider')"
                color="purple"
                icon="add"
                label="Add Rider"
                dense
                unelevated
                class="full-width"
                @click="addInitiativeRider"
              />
            </div>
          </div>
        </div>

        <!-- Single Gate for Paragon Multi-Phase Pools & Per-Phase Initiative Counts -->
        <div
          class="q-pa-sm rounded-borders"
          style="background: rgba(156, 43, 27, 0.05); border: 1px dashed rgba(156, 43, 27, 0.4);"
        >
          <div class="row items-center justify-between">
            <div class="text-caption text-weight-bold" style="color: #f87171;">
              Paragon Multi-Phase Pools &amp; Initiative Gate (1 = Standard Single Pool)
            </div>
            <q-badge v-if="paragonConfig.poolCount > 1" color="negative" outline>
              Active ({{ paragonConfig.poolCount }} {{ paragonConfig.phaseName || 'Phase' }}s)
            </q-badge>
          </div>
          <div class="q-mt-xs q-gutter-y-xs text-caption">
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-3">
                <formula-field
                  path="paragonConfig.poolCount"
                  label="Number of Stage Pools"
                  v-help="'How many Hit Point pools or boss stages this Paragon creature possesses.'"
                  dense
                  outlined
                  @applied="updateParagonPoolHp"
                />
              </div>
              <div class="col-12 col-sm-3">
                <q-input
                  v-model="paragonConfig.phaseName"
                  dense
                  outlined
                  label="Stage Naming (Phase/Pool)"
                  v-help="'Label prefix used for stages on the stat block (such as Phase or Pool).'"
                  placeholder="Phase"
                />
              </div>
              <div class="col-12 col-sm-6">
                <mechanic-text-editor
                  v-model="paragonConfig.transitionEffect"
                  dense
                  outlined
                  label="Stage Transition Fury / Trigger"
                  v-help="'Effect triggered whenever the creature finishes one stage and enters the next.'"
                  placeholder="e.g. sheds all conditions and unleashes Bloodied roar"
                />
              </div>
            </div>
            <div v-if="paragonConfig.poolCount > 1" class="row q-col-gutter-sm items-center q-mt-xs">
              <div
                v-for="(phaseCfg, pIdx) in paragonPhaseRows"
                :key="'init-phase-bonus-' + pIdx"
                data-paragon-phase-row
                class="col-6 col-sm-3"
                @pointerdown.capture="materializeParagonRows"
                @focusin="materializeParagonRows"
              >
                <formula-field
                  :path="`paragonConfig.phaseConfigs[id=${encodeURIComponent(phaseCfg.id || `phase-${pIdx + 1}`)}].initiativeBonus`"
                  dense
                  outlined
                  clearable
                  :label="`${phaseCfg.name} Init Bonus`"
                  :placeholder="`+${(pIdx + 1) * 10}`"
                  v-help="'Initiative modifier or flat bonus used for this paragon phase turn.'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import FormulaField from 'src/components/kit/FormulaField.vue'
import MechanicTextEditor from '../MechanicTextEditor.vue'
import {
  INITIATIVE_ACTION_TYPE_ENTRIES,
  INITIATIVE_ADV_MODE_ENTRIES,
  INITIATIVE_ROLL_EFFECT_ENTRIES,
  INITIATIVE_TRIGGER_ENTRIES,
  PLURAL_CREATURE_TYPE_ENTRIES,
  SECONDARY_STAT_ENTRIES,
  STAT_MODE_ENTRIES,
} from './basics-catalogs'
import { useBasicsContext } from './useBasicsContext'

const {
  initiativeConfig,
  initiativeRollMode,
  initiativePreview,
  newRiderAdvMode,
  newRiderCreatureTypes,
  newRiderRollEffect,
  newRiderActionType,
  newRiderSpellName,
  newRiderHpAmount,
  newRiderMoveDistance,
  newRiderCustomText,
  addInitiativeRider,
  removeInitiativeRider,
  formatInitiativeRider,
  paragonConfig,
  paragonPhaseRows,
  materializeParagonRows,
  updateParagonPoolHp,
} = useBasicsContext()
</script>
