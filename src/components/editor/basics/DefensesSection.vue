<template>
  <!-- Build 274: one Armor Class module. Value, base, modifiers, defensive rule, riders and the
       composed result live in the same card, in the order the stat block reads them. -->
  <section class="compositor-card ac-compositor q-mt-md" data-ac-compositor>
    <header class="compositor-card__head">
      <q-icon name="shield" size="20px" class="text-blue-4" />
      <div class="compositor-card__title">
        <span class="text-weight-bold text-blue-3">Armor Class</span>
        <span class="text-caption text-grey-5">Compositor &amp; defensive mechanics · real-time auto-sync</span>
      </div>
      <q-space />
      <q-badge color="blue-8" class="text-weight-bold q-pa-xs" data-ac-headline>
        AC {{ computedCompositorAc }}<span v-if="computedCompositorType" v-safe-html="` (${mechanicRichHtml(computedCompositorType)})`"></span>
      </q-badge>
    </header>

    <!-- 1. Printed value -->
    <div class="compositor-step">
      <div class="compositor-step__label"><q-icon name="tag" size="14px" />Printed value</div>
      <div class="compositor-step__body">
        <formula-field
          v-help="'Armor Class value; supports formulas or Challenge Rating auto-scaling. Locked while the compositor sets it.'"
          path="AC"
          :label="$t('monster.ac')"
          compact
          outlined
          dense
          @applied="(value: number | string) => (monster.AC = Number(value) || 0)"
        >
          <template #append>
            <q-btn v-help="$t('monster.setAcByCr')" flat dense round color="primary" size="sm" icon="auto_fix_high" @click="monster.setAcByCr" />
          </template>
        </formula-field>
        <mechanic-text-editor
          v-model="monster.ACType"
          v-help="'Armor source or parenthetical note rendered beside Armor Class (for example natural armor).'"
          :label="$t('monster.acType')"
          class="compositor-step__grow"
          outlined
          dense
        />
      </div>
    </div>

    <!-- 2. Base -->
    <div class="compositor-step">
      <div class="compositor-step__label"><q-icon name="foundation" size="14px" />Base</div>
      <div class="compositor-step__body">
        <catalog-select
          v-help="'Where the base Armor Class comes from: natural armor, worn armor, or a formula.'"
          :model-value="acConfig.baseMode"
          :entries="AC_BASE_ENTRIES"
          preserve-order
          label="Base AC Source"
          class="compositor-step__grow"
          @update:model-value="(val) => { acConfig.baseMode = String(val || 'flat') as typeof acConfig.baseMode; onAcCompositorChanged() }"
        />
        <formula-field
          v-if="acConfig.baseMode === 'natural'"
          v-help="$t('help.defenses.acNaturalBonus')"
          path="acConfig.naturalBonus"
          label="Natural bonus"
          compact
          dense
          outlined
          data-natural-armor-bonus
          @applied="onAcCompositorChanged"
        />
        <catalog-select
          v-help="$t('help.defenses.acAbilityBonus')"
          :model-value="acConfig.abilityBonus"
          :entries="AC_ABILITY_BONUS_ENTRIES"
          preserve-order
          label="Ability Bonus"
          class="compositor-step__grow"
          @update:model-value="(val) => { acConfig.abilityBonus = String(val || 'none') as typeof acConfig.abilityBonus; onAcCompositorChanged() }"
        />
        <catalog-select
          v-help="$t('help.defenses.acDefenseItem')"
          :model-value="acConfig.defenseItem"
          :entries="AC_DEFENSE_ITEM_ENTRIES"
          preserve-order
          label="Defense Item"
          class="compositor-step__grow"
          @update:model-value="(val) => { acConfig.defenseItem = String(val || 'none') as typeof acConfig.defenseItem; onAcCompositorChanged() }"
        />
      </div>
    </div>

    <!-- 3. Modifiers -->
    <div class="compositor-step">
      <div class="compositor-step__label"><q-icon name="exposure" size="14px" />Modifiers</div>
      <div class="compositor-step__body">
        <catalog-select
          v-help="$t('help.defenses.acTemporary')"
          :model-value="acConfig.temporary"
          :entries="AC_TEMPORARY_ENTRIES"
          preserve-order
          label="Temporary / Reaction AC"
          class="compositor-step__grow"
          @update:model-value="(val) => { acConfig.temporary = String(val || 'none') as typeof acConfig.temporary; onAcCompositorChanged() }"
        />
        <catalog-select
          v-help="'AC bonus or penalty that applies only under a stated battlefield condition.'"
          :model-value="acConfig.conditional"
          :entries="AC_CONDITIONAL_ENTRIES"
          preserve-order
          label="Conditional AC Modifier"
          class="compositor-step__grow"
          @update:model-value="(val) => { acConfig.conditional = String(val || 'none') as typeof acConfig.conditional; onAcCompositorChanged() }"
        />
      </div>
      <defense-schedule-fields v-if="acConfig.temporary && acConfig.temporary !== 'none'" effect="temporaryAc" label="Temporary AC" />
      <defense-schedule-fields v-if="acConfig.conditional && acConfig.conditional !== 'none'" effect="conditionalAc" label="Conditional AC" />
    </div>

    <!-- 4. Defensive rule -->
    <div class="compositor-step">
      <div class="compositor-step__label"><q-icon name="gpp_maybe" size="14px" />Defensive rule</div>
      <div class="compositor-step__body">
        <catalog-select
          v-help="'Pick a defensive pattern such as attacker saves, conditional AC, or damage shields.'"
          :model-value="acConfig.conditionMode"
          :entries="AC_DEFENSIVE_MECHANIC_ENTRIES"
          preserve-order
          label="Defensive Mechanic / Invulnerability Mode"
          class="compositor-step__grow"
          @update:model-value="(val) => { acConfig.conditionMode = String(val || 'none') as typeof acConfig.conditionMode; onAcCompositorChanged() }"
        />
        <formula-field
          v-if="needsSecondaryAc"
          v-help="'Fallback or secondary Armor Class used when this defensive condition applies.'"
          path="acConfig.secondaryAc"
          label="Secondary AC"
          compact
          dense
          outlined
          @applied="onAcCompositorChanged"
        />
      </div>

      <catalog-select
        v-if="acConfig.conditionMode === 'creature_type' || acConfig.conditionMode === 'versus_creature_types'"
        v-help="'Creature types this defensive Armor Class rule applies against.'"
        :model-value="acConfig.conditionCreatureTypes ?? []"
        :entries="PLURAL_CREATURE_TYPE_ENTRIES"
        multiple
        use-chips
        label="Creature Types"
        class="q-mt-xs"
        @update:model-value="(val) => { acConfig.conditionCreatureTypes = Array.isArray(val) ? val.map(String) : []; onAcCompositorChanged() }"
      />
      <catalog-select
        v-if="acConfig.conditionMode === 'attack_type' || acConfig.conditionMode === 'ranged_attacks'"
        v-help="$t('help.defenses.acAttackTypes')"
        :model-value="acConfig.conditionAttackTypes ?? []"
        :entries="ATTACK_TYPE_ENTRIES"
        multiple
        use-chips
        label="Attack Types"
        class="q-mt-xs"
        @update:model-value="(val) => { acConfig.conditionAttackTypes = Array.isArray(val) ? val.map(String) : []; onAcCompositorChanged() }"
      />
      <catalog-select
        v-if="acConfig.conditionMode === 'versus_damage_types' || acConfig.conditionMode === 'damage_type'"
        v-help="$t('help.defenses.acDamageTypes')"
        :model-value="acConfig.conditionDamageTypes ?? []"
        catalog-id="damageTypes"
        multiple
        use-chips
        label="Trigger Damage Types"
        class="q-mt-xs"
        @update:model-value="(val) => { acConfig.conditionDamageTypes = Array.isArray(val) ? val.map(String) : []; onAcCompositorChanged() }"
      />

      <!-- Attacker save: phrasing, ability, DC, then failure / success outcomes -->
      <template v-if="acConfig.conditionMode === 'attacker_save'">
        <div class="compositor-step__body q-mt-xs">
          <catalog-select
            v-help="$t('help.defenses.acSaveTrigger')"
            :model-value="acConfig.saveVerb"
            :entries="SAVE_VERB_ENTRIES"
            preserve-order
            :searchable="false"
            label="Save Trigger Phrasing"
            class="compositor-step__grow"
            @update:model-value="(val) => { acConfig.saveVerb = String(val || 'must_succeed') as typeof acConfig.saveVerb; onAcCompositorChanged() }"
          />
          <catalog-select
            v-help="'Ability used for the saving throw.'"
            :model-value="acConfig.saveStat"
            :entries="FULL_ABILITY_NAME_ENTRIES"
            preserve-order
            :searchable="false"
            label="Save Ability"
            class="compositor-step__grow"
            @update:model-value="(val) => { acConfig.saveStat = String(val || 'Wisdom'); onAcCompositorChanged() }"
          />
          <catalog-select
            v-help="'Where the DC comes from: spell save DC, a formula, or a fixed number.'"
            :model-value="acConfig.saveDcSource"
            :entries="SAVE_DC_SOURCE_ENTRIES"
            preserve-order
            :searchable="false"
            label="DC Source"
            class="compositor-step__grow"
            @update:model-value="(val) => { acConfig.saveDcSource = String(val || 'flat') as typeof acConfig.saveDcSource; onAcCompositorChanged() }"
          />
          <formula-field
            v-help="'Difficulty Class attackers must beat on their saving throw.'"
            path="acConfig.saveDc"
            label="Save DC"
            compact
            dense
            outlined
            @applied="onAcCompositorChanged"
          />
        </div>
        <div class="compositor-step__body q-mt-xs">
          <catalog-select
            v-help="'What happens when the attacker fails the saving throw.'"
            :model-value="acConfig.onSaveFailure"
            :entries="ON_SAVE_FAILURE_ENTRIES"
            preserve-order
            :searchable="false"
            label="On Failure"
            class="compositor-step__grow"
            @update:model-value="(val) => { acConfig.onSaveFailure = String(val || 'none') as typeof acConfig.onSaveFailure; onAcCompositorChanged() }"
          />
          <template v-if="acConfig.onSaveFailure === 'takes_damage' || acConfig.onSaveFailure === 'damage_attacker'">
            <formula-field v-help="'Damage dealt to an attacker that fails its saving throw.'" path="acConfig.onSaveFailureDamageAmount" label="Fail dmg" compact dense outlined @applied="onAcCompositorChanged" />
            <catalog-select
              v-help="$t('help.defenses.acFailDamageType')"
              :model-value="acConfig.onSaveFailureDamageType"
              catalog-id="damageTypes"
              label="Fail type"
              class="compositor-step__grow"
              @update:model-value="(val) => { acConfig.onSaveFailureDamageType = String(val || 'psychic'); onAcCompositorChanged() }"
            />
          </template>
        </div>
        <div class="compositor-step__body q-mt-xs">
          <catalog-select
            v-help="'What happens when the attacker succeeds on the saving throw.'"
            :model-value="acConfig.onSaveSuccess"
            :entries="ON_SAVE_SUCCESS_ENTRIES"
            preserve-order
            :searchable="false"
            label="On Success"
            class="compositor-step__grow"
            @update:model-value="(val) => { acConfig.onSaveSuccess = String(val || 'none') as typeof acConfig.onSaveSuccess; onAcCompositorChanged() }"
          />
          <template v-if="acConfig.onSaveSuccess === 'takes_damage' || acConfig.onSaveSuccess === 'damage_attacker'">
            <formula-field v-help="'Damage dealt even when the attacker succeeds on its saving throw.'" path="acConfig.onSaveSuccessDamageAmount" label="Success dmg" compact dense outlined @applied="onAcCompositorChanged" />
            <catalog-select
              v-help="$t('help.defenses.acSuccessDamageType')"
              :model-value="acConfig.onSaveSuccessDamageType"
              catalog-id="damageTypes"
              label="Success type"
              class="compositor-step__grow"
              @update:model-value="(val) => { acConfig.onSaveSuccessDamageType = String(val || 'psychic'); onAcCompositorChanged() }"
            />
          </template>
        </div>
      </template>

      <div v-if="acConfig.conditionMode === 'took_damage_since'" class="compositor-step__body q-mt-xs">
        <catalog-select
          v-help="$t('help.defenses.acDamageTakenTrigger')"
          :model-value="acConfig.tookDamageType"
          catalog-id="damageTypes"
          label="Damage Type Taken"
          class="compositor-step__grow"
          @update:model-value="(val) => { acConfig.tookDamageType = String(val || 'fire'); onAcCompositorChanged() }"
        />
        <catalog-select
          v-help="'Window checked to see if this damage type was taken.'"
          :model-value="acConfig.tookDamageTimeframe"
          :entries="TIMEFRAME_ENTRIES"
          preserve-order
          label="Timeframe"
          class="compositor-step__grow"
          @update:model-value="(val) => { acConfig.tookDamageTimeframe = String(val || 'since the end of its last turn'); onAcCompositorChanged() }"
        />
      </div>
      <catalog-select
        v-if="acConfig.conditionMode === 'in_light'"
        v-help="'Illumination condition required for this defensive AC rule to apply.'"
        :model-value="acConfig.lightLevel"
        :entries="LIGHT_LEVEL_ENTRIES"
        preserve-order
        :searchable="false"
        label="Light Level"
        class="q-mt-xs"
        @update:model-value="(val) => { acConfig.lightLevel = String(val || 'dim light or darkness'); onAcCompositorChanged() }"
      />
      <mechanic-text-editor
        v-if="acConfig.conditionMode === 'custom'"
        v-model="acConfig.customCondition"
        v-help="$t('help.defenses.acCustomCondition')"
        dense
        outlined
        label="Custom Defensive Condition"
        placeholder="e.g. 30 while near a non-incapacitated allied creature"
        class="q-mt-xs"
        @update:model-value="onAcCompositorChanged"
      />
      <defense-schedule-fields v-if="acConfig.conditionMode && acConfig.conditionMode !== 'none'" effect="defensiveRule" label="Defensive rule" />
    </div>

    <!-- 5. Riders: on-hit / on-miss effects, then free-form AC riders -->
    <div class="compositor-step compositor-step--riders">
      <div class="compositor-step__label">
        <q-icon name="bolt" size="14px" />Riders
        <q-space />
        <q-toggle
          v-model="monster.splitAcRiderRows"
          v-help="$t('help.defenses.acSplitSubrows')"
          dark
          dense
          size="xs"
          color="cyan-4"
          label="Print on separate lines"
          class="text-caption text-cyan-2"
          data-contextual-split-ac="true"
        />
      </div>
      <ac-riders-editor @changed="onAcCompositorChanged" />
      <basic-riders-editor scope="ac" label="Free-form Armor Class riders" />
    </div>

    <!-- 6. Composed result -->
    <footer class="compositor-card__result">
      <q-icon name="preview" class="q-mr-xs text-cyan-3" />
      <span class="text-caption text-weight-bold text-cyan-3">Prints as</span>
      <q-space />
      <q-badge color="cyan-4" outline class="text-subtitle2 text-weight-bold q-pa-xs">
        <span v-safe-html="mechanicRichHtml(composedAcPreview)"></span>
      </q-badge>
    </footer>
  </section>
</template>

<script setup lang="ts">
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import FormulaField from 'src/components/kit/FormulaField.vue'
import BasicRidersEditor from '../BasicRidersEditor.vue'
import DefenseScheduleFields from '../DefenseScheduleFields.vue'
import AcRidersEditor from './AcRidersEditor.vue'
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

<style src="./compositor-card.css"></style>
