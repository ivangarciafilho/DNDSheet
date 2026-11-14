<template>
  <div>
    <!-- 6. Armor Class & AC Compositor -->
    <div class="row q-col-gutter-sm items-center q-mt-md">
      <formula-field
        path="AC"
        :label="$t('monster.ac')"
        v-help="'Armor Class value; supports formulas or Challenge Rating auto-scaling.'"
        class="col-12 col-sm-3"
        outlined
        dense
        @applied="(value: number | string) => (monster.AC = Number(value) || 0)"
      >
        <template #append>
          <q-btn
            flat
            dense
            round
            color="primary"
            size="sm"
            icon="auto_fix_high"
            v-help="$t('monster.setAcByCr')"
            @click="monster.setAcByCr"
          />
        </template>
      </formula-field>
      <mechanic-text-editor
        v-model="monster.ACType"
        :label="$t('monster.acType')"
        v-help="'Armor source or parenthetical note rendered beside Armor Class (for example natural armor).'"
        class="col-12 col-sm-5"
        outlined
        dense
      />
      <div class="col-12 col-sm-4 text-right">
        <q-badge color="blue-8" class="text-weight-bold q-pa-xs">
          Preview: AC {{ computedCompositorAc }} <span v-if="computedCompositorType" v-html="`(${mechanicRichHtml(computedCompositorType)})`"></span>
        </q-badge>
      </div>
    </div>

    <!-- AC Formula & Defensive Mechanics Compositor Card -->
    <div
      class="q-pa-sm rounded-borders q-mt-xs q-mb-xs"
      style="background: rgba(30, 58, 138, 0.08); border: 1.5px solid #3b82f6;"
    >
      <div class="row items-center justify-between q-mb-xs q-col-gutter-xs">
        <div class="text-caption text-weight-bold text-blue-4">
          Armor Class Compositor &amp; Defensive Mechanics (Real-Time Auto-Sync)
        </div>
        <div class="editor-fit-wrap items-center">
          <q-toggle
            v-model="monster.splitAcRiderRows"
            dark
            dense
            size="xs"
            color="blue-4"
            label="Split AC Riders"
            v-help="$t('help.defenses.acSplitSubrows')"
            class="text-caption text-weight-medium text-blue-2"
          />
          <q-badge outline color="cyan-4" class="text-weight-bold text-caption">
            Auto-Synced
          </q-badge>
        </div>
      </div>

      <div class="row q-col-gutter-xs items-center">
        <!-- 1. Base -->
        <div class="col-12 col-sm-4">
          <catalog-select
            :model-value="acConfig.baseMode"
            :entries="AC_BASE_ENTRIES"
            preserve-order
            label="Base AC Source"
            v-help="'Where the base Armor Class comes from: natural armor, worn armor, or a formula.'"
            @update:model-value="(val) => { acConfig.baseMode = String(val || 'flat') as typeof acConfig.baseMode; onAcCompositorChanged() }"
          />
        </div>

        <!-- 2. Ability Bonus -->
        <div class="col-12 col-sm-4">
          <catalog-select
            :model-value="acConfig.abilityBonus"
            :entries="AC_ABILITY_BONUS_ENTRIES"
            preserve-order
            label="Ability Bonus"
            v-help="$t('help.defenses.acAbilityBonus')"
            @update:model-value="(val) => { acConfig.abilityBonus = String(val || 'none') as typeof acConfig.abilityBonus; onAcCompositorChanged() }"
          />
        </div>

        <!-- 3. Defense Item -->
        <div class="col-12 col-sm-4">
          <catalog-select
            :model-value="acConfig.defenseItem"
            :entries="AC_DEFENSE_ITEM_ENTRIES"
            preserve-order
            label="Defense Item"
            v-help="$t('help.defenses.acDefenseItem')"
            @update:model-value="(val) => { acConfig.defenseItem = String(val || 'none') as typeof acConfig.defenseItem; onAcCompositorChanged() }"
          />
        </div>
      </div>

      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <!-- 4. Temporary Bonus -->
        <div class="col-12 col-sm-6">
          <catalog-select
            :model-value="acConfig.temporary"
            :entries="AC_TEMPORARY_ENTRIES"
            preserve-order
            label="Temporary / Reaction AC"
            v-help="$t('help.defenses.acTemporary')"
            @update:model-value="(val) => { acConfig.temporary = String(val || 'none') as typeof acConfig.temporary; onAcCompositorChanged() }"
          />
        </div>

        <!-- 5. Conditional Bonus -->
        <div class="col-12 col-sm-6">
          <catalog-select
            :model-value="acConfig.conditional"
            :entries="AC_CONDITIONAL_ENTRIES"
            preserve-order
            label="Conditional AC Modifier"
            v-help="'AC bonus or penalty that applies only under a stated battlefield condition.'"
            @update:model-value="(val) => { acConfig.conditional = String(val || 'none') as typeof acConfig.conditional; onAcCompositorChanged() }"
          />
        </div>
      </div>

      <!-- 6. Defensive Mechanic / Condition Mode -->
      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <div :class="needsSecondaryAc ? 'col-12 col-sm-8' : 'col-12'">
          <catalog-select
            :model-value="acConfig.conditionMode"
            :entries="AC_DEFENSIVE_MECHANIC_ENTRIES"
            preserve-order
            label="Defensive Mechanic / Invulnerability Mode"
            v-help="'Pick a defensive pattern such as attacker saves, conditional AC, or damage shields.'"
            @update:model-value="(val) => { acConfig.conditionMode = String(val || 'none') as typeof acConfig.conditionMode; onAcCompositorChanged() }"
          />
        </div>
        <div v-if="needsSecondaryAc" class="col-12 col-sm-4">
          <formula-field
            path="acConfig.secondaryAc"
            label="Secondary AC / Value"
            v-help="'Fallback or secondary Armor Class used when this defensive condition applies.'"
            dense
            outlined
            @applied="onAcCompositorChanged"
          />
        </div>
      </div>

      <!-- 6a. Versus Creature Types -->
      <div v-if="acConfig.conditionMode === 'creature_type' || acConfig.conditionMode === 'versus_creature_types'" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12">
          <catalog-select
            :model-value="acConfig.conditionCreatureTypes ?? []"
            :entries="PLURAL_CREATURE_TYPE_ENTRIES"
            multiple
            use-chips
            label="Creature Types"
            v-help="'Creature types this defensive Armor Class rule applies against.'"
            @update:model-value="(val) => { acConfig.conditionCreatureTypes = Array.isArray(val) ? val.map(String) : []; onAcCompositorChanged() }"
          />
        </div>
      </div>

      <!-- 6b. Versus Attack Types -->
      <div v-if="acConfig.conditionMode === 'attack_type' || acConfig.conditionMode === 'ranged_attacks'" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12">
          <catalog-select
            :model-value="acConfig.conditionAttackTypes ?? []"
            :entries="ATTACK_TYPE_ENTRIES"
            multiple
            use-chips
            label="Attack Types"
            v-help="$t('help.defenses.acAttackTypes')"
            @update:model-value="(val) => { acConfig.conditionAttackTypes = Array.isArray(val) ? val.map(String) : []; onAcCompositorChanged() }"
          />
        </div>
      </div>

      <!-- 6c. Versus Damage Types -->
      <div v-if="acConfig.conditionMode === 'versus_damage_types' || acConfig.conditionMode === 'damage_type'" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12">
          <catalog-select
            :model-value="acConfig.conditionDamageTypes ?? []"
            catalog-id="damageTypes"
            multiple
            use-chips
            label="Trigger Damage Types"
            v-help="$t('help.defenses.acDamageTypes')"
            @update:model-value="(val) => { acConfig.conditionDamageTypes = Array.isArray(val) ? val.map(String) : []; onAcCompositorChanged() }"
          />
        </div>
      </div>

      <!-- 6d. Attacker Save DC, Phrasing & Failure/Success Outcomes -->
      <div v-if="acConfig.conditionMode === 'attacker_save'" class="col-12 q-mt-xs">
        <div class="row q-col-gutter-xs items-center">
          <div class="col-12 col-sm-4">
            <catalog-select
              :model-value="acConfig.saveVerb"
              :entries="SAVE_VERB_ENTRIES"
              preserve-order
              :searchable="false"
              label="Save Trigger Phrasing"
              v-help="$t('help.defenses.acSaveTrigger')"
              @update:model-value="(val) => { acConfig.saveVerb = String(val || 'must_succeed') as typeof acConfig.saveVerb; onAcCompositorChanged() }"
            />
          </div>
          <div class="col-12 col-sm-4">
            <catalog-select
              :model-value="acConfig.saveStat"
              :entries="FULL_ABILITY_NAME_ENTRIES"
              preserve-order
              :searchable="false"
              label="Save Ability"
              v-help="'Ability used for the saving throw.'"
              @update:model-value="(val) => { acConfig.saveStat = String(val || 'Wisdom'); onAcCompositorChanged() }"
            />
          </div>
          <div class="col-12 col-sm-2">
            <catalog-select
              :model-value="acConfig.saveDcSource"
              :entries="SAVE_DC_SOURCE_ENTRIES"
              preserve-order
              :searchable="false"
              label="DC Source"
              v-help="'Where the DC comes from: spell save DC, a formula, or a fixed number.'"
              @update:model-value="(val) => { acConfig.saveDcSource = String(val || 'flat') as typeof acConfig.saveDcSource; onAcCompositorChanged() }"
            />
          </div>
          <div class="col-12 col-sm-2">
            <formula-field
              path="acConfig.saveDc"
              label="Save DC"
              v-help="'Difficulty Class attackers must beat on their saving throw.'"
              dense
              outlined
              @applied="onAcCompositorChanged"
            />
          </div>
        </div>

        <!-- Failure & Success Outcome Clauses -->
        <div class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12 col-sm-3">
            <catalog-select
              :model-value="acConfig.onSaveFailure"
              :entries="ON_SAVE_FAILURE_ENTRIES"
              preserve-order
              :searchable="false"
              label="On Failure Outcome"
              v-help="'What happens when the attacker fails the saving throw.'"
              @update:model-value="(val) => { acConfig.onSaveFailure = String(val || 'none') as typeof acConfig.onSaveFailure; onAcCompositorChanged() }"
            />
          </div>
          <div v-if="acConfig.onSaveFailure === 'takes_damage' || acConfig.onSaveFailure === 'damage_attacker'" class="col-6 col-sm-2">
            <formula-field
              path="acConfig.onSaveFailureDamageAmount"
              label="Fail Dmg"
              v-help="'Damage dealt to an attacker that fails its saving throw.'"
              dense
              outlined
              @applied="onAcCompositorChanged"
            />
          </div>
          <div v-if="acConfig.onSaveFailure === 'takes_damage' || acConfig.onSaveFailure === 'damage_attacker'" class="col-6 col-sm-2">
            <catalog-select
              :model-value="acConfig.onSaveFailureDamageType"
              catalog-id="damageTypes"
              label="Fail Type"
              v-help="$t('help.defenses.acFailDamageType')"
              @update:model-value="(val) => { acConfig.onSaveFailureDamageType = String(val || 'psychic'); onAcCompositorChanged() }"
            />
          </div>

          <div class="col-12 col-sm-3">
            <catalog-select
              :model-value="acConfig.onSaveSuccess"
              :entries="ON_SAVE_SUCCESS_ENTRIES"
              preserve-order
              :searchable="false"
              label="On Success Outcome"
              v-help="'What happens when the attacker succeeds on the saving throw.'"
              @update:model-value="(val) => { acConfig.onSaveSuccess = String(val || 'none') as typeof acConfig.onSaveSuccess; onAcCompositorChanged() }"
            />
          </div>
          <div v-if="acConfig.onSaveSuccess === 'takes_damage' || acConfig.onSaveSuccess === 'damage_attacker'" class="col-6 col-sm-2">
            <formula-field
              path="acConfig.onSaveSuccessDamageAmount"
              label="Succ Dmg"
              v-help="'Damage dealt even when the attacker succeeds on its saving throw.'"
              dense
              outlined
              @applied="onAcCompositorChanged"
            />
          </div>
          <div v-if="acConfig.onSaveSuccess === 'takes_damage' || acConfig.onSaveSuccess === 'damage_attacker'" class="col-6 col-sm-2">
            <catalog-select
              :model-value="acConfig.onSaveSuccessDamageType"
              catalog-id="damageTypes"
              label="Succ Type"
              v-help="$t('help.defenses.acSuccessDamageType')"
              @update:model-value="(val) => { acConfig.onSaveSuccessDamageType = String(val || 'psychic'); onAcCompositorChanged() }"
            />
          </div>
        </div>
      </div>

      <!-- 6e. Took Damage Since Timeframe -->
      <div v-if="acConfig.conditionMode === 'took_damage_since'" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-6">
          <catalog-select
            :model-value="acConfig.tookDamageType"
            catalog-id="damageTypes"
            label="Damage Type Taken"
            v-help="$t('help.defenses.acDamageTakenTrigger')"
            @update:model-value="(val) => { acConfig.tookDamageType = String(val || 'fire'); onAcCompositorChanged() }"
          />
        </div>
        <div class="col-12 col-sm-6">
          <catalog-select
            :model-value="acConfig.tookDamageTimeframe"
            :entries="TIMEFRAME_ENTRIES"
            preserve-order
            label="Timeframe"
            v-help="'Window checked to see if this damage type was taken.'"
            @update:model-value="(val) => { acConfig.tookDamageTimeframe = String(val || 'since the end of its last turn'); onAcCompositorChanged() }"
          />
        </div>
      </div>

      <!-- 6f. In Light Level -->
      <div v-if="acConfig.conditionMode === 'in_light'" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12">
          <catalog-select
            :model-value="acConfig.lightLevel"
            :entries="LIGHT_LEVEL_ENTRIES"
            preserve-order
            :searchable="false"
            label="Light Level"
            v-help="'Illumination condition required for this defensive AC rule to apply.'"
            @update:model-value="(val) => { acConfig.lightLevel = String(val || 'dim light or darkness'); onAcCompositorChanged() }"
          />
        </div>
      </div>

      <!-- 6g. Custom Defensive Condition -->
      <div v-if="acConfig.conditionMode === 'custom'" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12">
          <mechanic-text-editor
            v-model="acConfig.customCondition"
            v-help="$t('help.defenses.acCustomCondition')"
            dense
            outlined
            label="Custom Defensive Condition"
            placeholder="e.g. 30 while near a non-incapacitated allied creature"
            @update:model-value="onAcCompositorChanged"
          />
        </div>
      </div>

      <!-- 6h. Decoupled On Miss & When Hit Logic + Contextual Split Riders Toggle -->
      <div class="editor-fit-wrap items-center justify-between q-mt-xs q-px-xs">
        <span class="text-caption text-cyan-3 text-weight-bold">Decoupled AC Riders (On Miss / When Hit)</span>
        <q-toggle
          v-model="monster.splitAcRiderRows"
          v-help="$t('help.defenses.acSplitSubrows')"
          dark
          dense
          size="xs"
          color="cyan-4"
          label="Split AC Sub-Rows"
          class="text-caption text-cyan-2"
          data-contextual-split-ac="true"
        />
      </div>
      <div class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-6">
          <catalog-select
            :model-value="acConfig.onMiss"
            :entries="ON_MISS_ENTRIES"
            preserve-order
            label="On Miss Effect"
            v-help="$t('help.defenses.acOnMiss')"
            @update:model-value="(val) => { acConfig.onMiss = String(val || 'none') as typeof acConfig.onMiss; onAcCompositorChanged() }"
          />
        </div>
        <div class="col-12 col-sm-6">
          <catalog-select
            :model-value="acConfig.onHit"
            :entries="ON_HIT_ENTRIES"
            preserve-order
            label="When Hit Effect"
            v-help="$t('help.defenses.acOnHit')"
            @update:model-value="(val) => { acConfig.onHit = String(val || 'none') as typeof acConfig.onHit; onAcCompositorChanged() }"
          />
        </div>
      </div>

      <!-- On Miss Extra Inputs -->
      <div v-if="acConfig.onMiss === 'hits_target_feet'" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-12 col-sm-6">
          <formula-field
            path="acConfig.onMissDistance"
            label="Redirect Distance (ft)"
            v-help="'Maximum distance in feet to redirect a missed attack to another creature.'"
            dense
            outlined
            @applied="onAcCompositorChanged"
          />
        </div>
      </div>

      <div v-if="acConfig.onMiss === 'damage_attacker'" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-6 col-sm-3">
          <formula-field
            path="acConfig.onMissDamageAmount"
            label="Damage Amount"
            v-help="'Damage dealt back to the attacker when its attack misses.'"
            dense
            outlined
            @applied="onAcCompositorChanged"
          />
        </div>
        <div class="col-6 col-sm-3">
          <catalog-select
            :model-value="acConfig.onMissDamageType"
            catalog-id="damageTypes"
            label="Damage Type"
            v-help="'Damage type dealt back to an attacker on a miss.'"
            @update:model-value="(val) => { acConfig.onMissDamageType = String(val || 'fire'); onAcCompositorChanged() }"
          />
        </div>
      </div>

      <!-- When Hit Extra Inputs -->
      <div v-if="acConfig.onHit === 'damage_attacker'" class="row q-col-gutter-xs items-center q-mt-xs">
        <div class="col-6 col-sm-3">
          <formula-field
            path="acConfig.onHitDamageAmount"
            label="On Hit Damage"
            v-help="'Damage dealt automatically to the attacker whenever a hit lands.'"
            dense
            outlined
            @applied="onAcCompositorChanged"
          />
        </div>
        <div class="col-6 col-sm-3">
          <catalog-select
            :model-value="acConfig.onHitDamageType"
            catalog-id="damageTypes"
            label="On Hit Type"
            v-help="'Damage type dealt automatically to the attacker whenever a hit lands.'"
            @update:model-value="(val) => { acConfig.onHitDamageType = String(val || 'fire'); onAcCompositorChanged() }"
          />
        </div>
      </div>

      <defense-schedule-fields v-if="acConfig.temporary && acConfig.temporary !== 'none'" effect="temporaryAc" label="Temporary AC" />
      <defense-schedule-fields v-if="acConfig.conditional && acConfig.conditional !== 'none'" effect="conditionalAc" label="Conditional AC" />
      <defense-schedule-fields v-if="acConfig.conditionMode && acConfig.conditionMode !== 'none'" effect="defensiveRule" label="Defensive rule" />
      <defense-schedule-fields v-if="acConfig.onMiss && acConfig.onMiss !== 'none'" effect="onMiss" label="On miss" />
      <defense-schedule-fields v-if="acConfig.onHit && acConfig.onHit !== 'none'" effect="onHit" label="On hit" />

      <!-- 6i. Composed Real-Time AC Result Preview -->
      <div class="row items-center justify-between q-mt-xs q-pa-xs rounded-borders bg-grey-9">
        <div class="text-caption text-weight-bold text-cyan-3 flex items-center">
          <q-icon name="preview" class="q-mr-xs" />
          Composed AC &amp; Defensive Ruling:
        </div>
        <q-badge color="cyan-4" outline class="text-subtitle2 text-weight-bold q-pa-xs">
          <span v-html="mechanicRichHtml(composedAcPreview)"></span>
        </q-badge>
      </div>
    </div>

    <basic-riders-editor scope="ac" label="Armor Class riders" />
  </div>
</template>

<script setup lang="ts">
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import FormulaField from 'src/components/kit/FormulaField.vue'
import BasicRidersEditor from '../BasicRidersEditor.vue'
import DefenseScheduleFields from '../DefenseScheduleFields.vue'
import MechanicTextEditor from '../MechanicTextEditor.vue'
import {
  AC_ABILITY_BONUS_ENTRIES,
  AC_BASE_ENTRIES,
  AC_CONDITIONAL_ENTRIES,
  AC_DEFENSE_ITEM_ENTRIES,
  AC_DEFENSIVE_MECHANIC_ENTRIES,
  AC_TEMPORARY_ENTRIES,
  ATTACK_TYPE_ENTRIES,
  FULL_ABILITY_NAME_ENTRIES,
  LIGHT_LEVEL_ENTRIES,
  ON_HIT_ENTRIES,
  ON_MISS_ENTRIES,
  ON_SAVE_FAILURE_ENTRIES,
  ON_SAVE_SUCCESS_ENTRIES,
  PLURAL_CREATURE_TYPE_ENTRIES,
  SAVE_DC_SOURCE_ENTRIES,
  SAVE_VERB_ENTRIES,
  TIMEFRAME_ENTRIES,
} from './basics-catalogs'
import { useBasicsContext } from './useBasicsContext'

const {
  monster,
  acConfig,
  needsSecondaryAc,
  composedAcPreview,
  computedCompositorAc,
  computedCompositorType,
  onAcCompositorChanged,
  mechanicRichHtml,
} = useBasicsContext()
</script>
