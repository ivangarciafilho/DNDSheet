<template>
  <div class="class-casting-editor-panel q-mt-sm">
          <!-- Metamagic Studio Configuration -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div class="q-pa-xs rounded-borders bg-grey-10 text-white" style="border: 1px dashed rgba(236, 72, 153, 0.6);">
              <div class="row items-center justify-between q-mb-xs">
                <q-checkbox
v-model="metamagicEnabled"
                  v-help="'Tick to include metamagic studio (sorcery points &amp; enhancements) for the class casting editor.'"
                  data-metamagic-toggle
                  label="Metamagic Studio (Sorcery Points &amp; Enhancements)"
                  dense
                  color="pink-5"
                  class="text-weight-bold text-caption text-pink-3"
                  @update:model-value="toggleMetamagic"
                />
                <span v-if="metamagicEnabled && monster.spellcasting.metamagic" class="text-caption text-pink-3">
                  Sorcery Points: <b>{{ monster.spellcasting.metamagic.sorceryPoints || 0 }}</b>
                </span>
              </div>

              <div v-if="metamagicEnabled && monster.spellcasting.metamagic" class="row q-col-gutter-xs items-center q-mt-xs">
                <div class="col-12 col-sm-3">
                  <formula-field v-help="'Points spent on metamagic and flexible casting.'" path="spellcasting.metamagic.sorceryPoints" label="Sorcery Points" />
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    v-model="monster.spellcasting.metamagic.refreshRate"
                    v-help="'When sorcery points come back.'"
                    :options="['Long Rest', 'Short Rest', 'Dawn', 'Dusk', 'Midnight']" label="Points Refresh"
                    dense
                    outlined
                    dark
                    hide-bottom-space
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="monster.spellcasting.metamagic.options"
                    v-help="'Metamagic options the sorcerer knows; costs follow the selected rules edition.'"
                    :options="metamagicOptionsList"
                    multiple
                    emit-value
                    map-options
                    use-chips label="Active Metamagic Techniques"
                    dense
                    outlined
                    dark
                    hide-bottom-space
                  />
                </div>
              </div>
            </div>
          </div>


    <div class="row justify-between items-center q-mb-sm">
      <span class="text-caption text-grey-3">Each source owns its class, resources and spell list.</span>
      <q-btn dense outline no-caps icon="add" color="purple-3" label="Add spellcasting source" data-add-casting-source @click="addExtraClass" />
    </div>
    <p v-if="sourceCount === 0" class="text-caption text-grey-4 q-pa-sm" data-casting-empty>No spellcasting sources. Add a class or custom casting system to begin.</p>
    <q-expansion-item v-if="primaryEnabled" :label="sourceTitle(primarySource)" :caption="sourceCaption(primarySource)" default-opened dense data-source-panel="primary" data-casting-source-fold="primary" class="q-mb-sm">
      <div class="q-pa-sm bg-grey-10 text-white" data-casting-source="primary">
        <div class="row justify-end"><q-btn flat dense icon="delete" color="negative" label="Remove source" no-caps data-remove-casting-source="primary" @click="removePrimarySource" /></div>
        <!-- Primary Class, Subclass, Level, Stat, DC & Attack -->
        <div class="row q-col-gutter-xs items-center">
          <q-select
            :label="$t('monster.spellcasting.class')"
            :model-value="monster.spellcasting.class"
            :display-value="classDisplayValue"
            :options="SrdCastingClassOptions"
            new-value-mode="add-unique"
            use-input
            emit-value
            class="col-12 col-sm-3 q-pa-xs"
            @update:model-value="updateSpellcastingClass"
          >
            <q-tooltip class="text-caption">Primary spellcasting class</q-tooltip>
          </q-select>

          <q-select
            v-model="primarySubclass"
            v-help="'Subclass, e.g. Evocation or Fiend; it can add always-prepared spells.'"
            :options="filteredPrimarySubclasses"
            input-debounce="0"
            label="Subclass" new-value-mode="add-unique"
            use-input
            clearable
            class="col-12 col-sm-3 q-pa-xs"
            @filter="filterPrimarySubclasses"
          >
            <q-tooltip class="text-caption">Subclass (e.g. Evocation, Fiend, Draconic)</q-tooltip>
          </q-select>

          <formula-field
            path="spellcasting.level"
            :label="$t('monster.spellcasting.level')"
            class="col-6 col-sm-2 q-pa-xs"
            @applied="updateSpellcastingSlots(monster.spellcasting.level)"
          >
            <template #after><q-tooltip class="text-caption">Caster level in primary class</q-tooltip></template>
          </formula-field>

          <q-select
            v-model="monster.spellcasting.stat"
            v-help="'Ability used for spell save DC and spell attacks.'"
            :options="['INT', 'WIS', 'CHA', 'CON', 'STR', 'DEX']" label="Casting Stat"
            class="col-6 col-sm-2 q-pa-xs"
            @update:model-value="updateSpellcastingSlots(monster.spellcasting.level)"
          >
            <q-tooltip class="text-caption">Spellcasting ability score</q-tooltip>
          </q-select>

          <formula-field
            v-if="monster.spellcasting.save.override"
            v-help="'Spell save DC: 8 + proficiency bonus + spellcasting ability modifier.'"
            path="spellcasting.save.overrideValue" label="Save DC"
            class="col-6 col-sm-2 q-pa-xs"
          >
            <template #append>
              <q-btn
                round
                flat
                dense
                size="xs"
                :icon="monster.spellcasting.save.override ? 'lock' : 'lock_open'"
                :color="monster.spellcasting.save.override ? 'warning' : 'grey-5'"
                @click="monster.spellcasting.save.override = !monster.spellcasting.save.override"
              >
                <q-tooltip class="text-caption">Toggle manual DC override</q-tooltip>
              </q-btn>
            </template>
            <q-tooltip class="text-caption">Spell save DC (auto-computed from stat + proficiency, or manual)</q-tooltip>
          </formula-field>
          <q-input v-else v-help="'Spell save DC: 8 + proficiency bonus + spellcasting ability modifier.'" :model-value="monster.spellSave" label="Save DC" readonly class="col-6 col-sm-2 q-pa-xs">
            <template #append><q-btn v-help="'Type the spell save DC instead of 8 + proficiency + ability modifier.'" flat dense icon="lock_open" aria-label="Enable manual spell save DC" @click="monster.spellcasting.save.override = true"><q-tooltip>Enable a typed value or live formula.</q-tooltip></q-btn></template>
          </q-input>

          <q-input
            v-model="monster.spellcasting.notes"
            :label="$t('monster.spellcasting.notes')"
            class="col-12 q-pa-xs"
            bottom-slots
          >
            <template #hint>{{ $t('editor.plainTextNote') }}</template>
            <template #after>
              <q-btn
                push
                :icon="
                  monster.spellcasting.useCustomClassPreamble
                    ? 'edit'
                    : 'edit_off'
                "
                :color="
                  monster.spellcasting.useCustomClassPreamble
                    ? 'warning'
                    : 'dark'
                "
                size="md"
                @click="
                  monster.spellcasting.useCustomClassPreamble =
                    !monster.spellcasting.useCustomClassPreamble
                "
              >
                <q-tooltip class="text-body2">{{
                  monster.spellcasting.useCustomClassPreamble
                    ? $t('editor.spellcasting.slot.useCustomPreamble')
                    : $t('editor.spellcasting.slot.useDefaultPreamble')
                }}</q-tooltip></q-btn
              >
            </template>
          </q-input>

          <!-- 5e Standard Spellcasting Auto-Calculated Metrics Banner -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div
              class="row items-center q-gutter-x-xs q-gutter-y-xs q-pa-xs rounded-borders bg-purple-10 text-white"
              style="border: 1px solid rgba(255, 255, 255, 0.15);"
            >
              <span class="text-caption text-weight-bold text-amber-3 q-mr-xs">{{ metrics ? 'Legacy base-class reference:' : 'Custom source:' }}</span>
              <q-badge color="purple-7" class="text-caption text-weight-bold">
                Ability: {{ monster.spellcasting.stat }}
              </q-badge>
              <q-badge color="purple-7" class="text-caption text-weight-bold">
                Save DC {{ monster.spellSave }}
              </q-badge>
              <q-badge color="purple-7" class="text-caption text-weight-bold">
                Spell Attack {{ monster.spellAttackModifier >= 0 ? `+${monster.spellAttackModifier}` : monster.spellAttackModifier }}
              </q-badge>
              <q-badge v-if="metrics" color="cyan-8" class="text-caption text-weight-bold">
                Known Cantrips: {{ metrics?.cantripsKnown ?? 0 }}
              </q-badge>
              <q-badge v-if="metrics" color="blue-8" class="text-caption text-weight-bold">
                Base {{ metrics?.selectionModel }} spells: {{ metrics?.preparedSpells }}
              </q-badge>
              <q-badge v-if="metrics" color="amber-8" class="text-caption text-weight-bold">
                Highest Slot: Level {{ metrics?.highestSlot ?? 0 }}
              </q-badge>
              <q-badge v-if="metrics" color="grey-8" class="text-caption text-capitalize">
                {{ metrics?.casterType ?? 'full' }} Caster
              </q-badge>
            </div>
          </div>

          <p class="col-12 text-caption text-cyan-3 q-px-xs" data-primary-capacity>{{ sourceGuidance(primarySource) }}</p>

          <!-- Quality of Life: Presentation & Resource Mode Controls -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div class="row q-col-gutter-xs items-center q-pa-xs rounded-borders bg-grey-9 text-white" style="border: 1px solid rgba(255, 255, 255, 0.12);">
              <div class="col-12 col-sm-3">
                <q-select
                  v-model="monster.spellcasting.resourceType"
                  v-help="'Spell slots, spell points, pact slots or focus.'"
                  :options="resourceTypeOptions"
                  emit-value
                  map-options label="Resource Mode"
                  dense
                  outlined
                  dark
                >
                  <q-tooltip class="bg-grey-9 text-caption">Spell slots, spell points (DMG variant), focus points, or pact slots.</q-tooltip>
                </q-select>
              </div>

              <div class="col-12 col-sm-3">
                <q-select
                  v-model="monster.spellcasting.refreshRate"
                  v-help="'When spell slots come back: long rest, short rest, or another cadence.'"
                  :options="refreshRateOptions"
                  emit-value
                  map-options label="Refresh Cadence"
                  dense
                  outlined
                  dark
                >
                  <q-tooltip class="bg-grey-9 text-caption">Spell recovery rate: Long Rest, Short Rest, or Downtime.</q-tooltip>
                </q-select>
              </div>

              <div class="col-12 col-sm-3">
                <q-select
                  v-model="monster.spellcasting.displayTitleMode"
                  v-help="'How the spellcasting heading names the caster.'"
                  :options="displayTitleModeOptions"
                  emit-value
                  map-options label="Title Disclosure"
                  dense
                  outlined
                  dark
                >
                  <q-tooltip class="bg-grey-9 text-caption">Disclose class names (Wizard 9), caster source (Arcane / Divine / Primal Caster), or split levels.</q-tooltip>
                </q-select>
              </div>

              <div class="col-12 col-sm-3 flex items-center">
                <q-checkbox
                  v-model="monster.spellcasting.bypassSlotLevelFilter"
                  v-help="'Allow spells above the highest slot level this class can cast.'" label="Bypass Max Slot Level"
                  dense
                  color="purple-4"
                  class="text-caption text-weight-bold"
                >
                  <q-tooltip class="bg-grey-9 text-caption">Allow selecting spells beyond the class's standard 5e maximum slot level.</q-tooltip>
                </q-checkbox>
              </div>

              <div class="col-12 col-sm-3 flex items-center">
                <q-checkbox
                  v-model="monster.spellcasting.splitHighCadence"
                  v-help="'Show spells with their own uses per day on separate lines.'" label="Split Restricted Cadences"
                  dense
                  color="amber-4"
                  class="text-caption text-weight-bold"
                >
                  <q-tooltip class="bg-grey-9 text-caption">Split spells with restricted cadences (Short/Long Rest, Dawn, etc.) into an appended secondary cell.</q-tooltip>
                </q-checkbox>
              </div>
            </div>
          </div>

        </div>
          <casting-learning-contribution-editor v-model="monster.spellcasting.contribution" :source-count="sourceCount" />
          <q-select :model-value="monster.spellcasting.rulesEdition || '2014'" :options="['2014','2024']" dense outlined dark label="Subclass grant rules" @update:model-value="value => monster.spellcasting.rulesEdition = value" />
          <casting-contribution-editor v-model="monster.spellcasting.contribution" class="col-12" @update:model-value="onExtraClassChanged" />

          <!-- Prepared Spells & Cantrip Switching Configuration -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div class="row q-col-gutter-xs items-center q-pa-xs rounded-borders bg-grey-9 text-white" style="border: 1px solid rgba(255, 255, 255, 0.12);">
              <div class="col-12 col-sm-3">
                <formula-field v-help="'How many spells the caster has prepared.'" path="spellcasting.preparedCountOverride" label="Prepared Spells Count">
                  <template #after><q-btn v-help="'Compute prepared spells from class, level and ability.'" flat dense icon="restart_alt" aria-label="Use automatic prepared spell count" @click="resetPreparedCount"><q-tooltip>Use the class calculation.</q-tooltip></q-btn></template>
                </formula-field>
              </div>

              <div class="col-12 col-sm-3">
                <q-select
                  v-model="monster.spellcasting.preparedInterval"
                  v-help="'When the caster can change prepared spells.'"
                  :options="['Long Rest', 'Short Rest', 'Dawn', 'Dusk', 'Midnight', 'Downtime']" label="Prepared Interval"
                  dense
                  outlined
                  dark
                  hide-bottom-space
                >
                  <q-tooltip>Cadence for preparing spells</q-tooltip>
                </q-select>
              </div>

              <div class="col-12 col-sm-2 flex items-center">
                <q-checkbox
                  v-model="monster.spellcasting.cantripSwitch"
                  v-help="'Change which cantrips are known.'" label="Switch Cantrips"
                  dense
                  color="purple-4"
                  class="text-caption text-weight-bold"
                >
                  <q-tooltip>Allow switching cantrips per rest</q-tooltip>
                </q-checkbox>
              </div>

              <div v-if="monster.spellcasting.cantripSwitch" class="col-6 col-sm-2">
                <formula-field v-help="'Number of uses.'" path="spellcasting.cantripSwitchCount" label="Count" />
              </div>

              <div v-if="monster.spellcasting.cantripSwitch" class="col-6 col-sm-2">
                <q-select
v-model="monster.spellcasting.cantripSwitchInterval"
                  v-help="'Choose per for the class casting editor.'"
                  :options="['Short Rest', 'Long Rest', 'Dawn', 'Dusk']"
                  label="Per"
                  dense
                  outlined
                  dark
                  hide-bottom-space
                />
              </div>
            </div>
          </div>

          <!-- Custom Preamble Slide -->
          <q-slide-transition>
            <div
              v-show="monster.spellcasting.useCustomClassPreamble"
              class="col-12 q-mt-md"
            >
              <monster-text-editor
                :field="monster.spellcasting.customClassPreamble"
                i18n-label-key="editor.spellcasting.slot.preamble"
                token-category="spell"
                :show-reset="true"
                @update:model-value="
                  (value: string) =>
                    (monster.spellcasting.customClassPreamble = value)
                "
                @reset="
                  monster.spellcasting.customClassPreamble = $t(
                    'presets.classSpellcasting'
                  )
                "
              />
            </div>
          </q-slide-transition>

          <casting-source-spell-rows :source="monster.spellcasting" primary @patch="patch => Object.assign(monster.spellcasting, patch)" />

      </div>
    </q-expansion-item>
          <!-- Multiclass Spellcaster Support (Arbitrary Classes & Subclasses) -->
          <div v-if="extraClasses.length" class="col-12 q-pa-xs q-mb-xs">
            <div class="q-pa-xs bg-grey-10 text-white">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-purple-3">{{ sourceCount }} spellcasting {{ sourceCount === 1 ? 'source' : 'sources' }}</span>
                <span v-if="multiclassEnabled" class="text-caption text-cyan-3">
                  Combined Caster Level: <b>{{ multiclassResult?.combinedCasterLevel || monster.spellcasting.level }}</b>
                </span>
              </div>

              <div class="column q-gutter-y-xs q-mt-xs">
                <!-- List of Extra Classes -->
                <q-expansion-item
                  v-for="(clsEntry, cIdx) in extraClasses"
                  :key="clsEntry.id || cIdx"
                  :label="sourceTitle(clsEntry)"
                  :caption="sourceCaption(clsEntry)"
                  default-opened
                  dense :data-source-panel="clsEntry.id"
                  :data-casting-source-fold="clsEntry.id"
                  class="q-mb-sm"
                >
                  <div class="row q-col-gutter-xs items-center q-pa-xs bg-grey-9">
                  <q-select
v-model="clsEntry.className"
                    v-help="'Choose class for the class casting editor.'"
                    :options="SrdCastingClassOptions"
                    use-input
                    new-value-mode="add-unique"
                    emit-value
                    map-options
                    label="Class"
                    dense
                    outlined
                    dark
                    class="col-12 col-sm-3"
                    @update:model-value="onExtraClassChanged"
                  />
                  <q-select
                    v-model="clsEntry.subclass"
                    v-help="'Subclass, e.g. Evocation or Fiend; it can add always-prepared spells.'"
                    :options="extraSubclassOptions[clsEntry.className] || getSubclassesFor(clsEntry.className)"
                    input-debounce="0"
                    label="Subclass" new-value-mode="add-unique"
                    use-input
                    clearable
                    dense
                    outlined
                    dark
                    class="col-12 col-sm-3"
                    @filter="(val, update) => filterExtraSubclasses(clsEntry.className, val, update)"
                    @update:model-value="onExtraClassChanged"
                  />
                  <formula-field
                    v-help="'Class level for this caster.'"
                    :path="`spellcasting.classes[id=${encodeURIComponent(clsEntry.id)}].level`" label="Level"
                    dense
                    outlined
                    class="col-6 col-sm-2"
                    @applied="onExtraClassChanged"
                  />
                  <q-select
                    v-model="clsEntry.stat"
                    v-help="'Spellcasting ability.'"
                    :options="['INT', 'WIS', 'CHA', 'CON', 'STR', 'DEX']" label="Stat"
                    dense
                    outlined
                    dark
                    class="col-4 col-sm-2"
                    @update:model-value="onExtraClassChanged"
                  />
                  <div class="col-2 col-sm-2 text-right">
                    <q-btn
                      flat
                      round
                      dense
                      size="sm"
                      icon="delete"
                      color="negative"
                      :data-remove-casting-source="clsEntry.id" @click="removeExtraClass(cIdx)"
                    >
                      <q-tooltip class="text-caption">Remove Class</q-tooltip>
                    </q-btn>
                  </div>

                  <div class="col-12 q-mt-xs" :data-casting-source="clsEntry.id">
                    <div class="text-caption text-cyan-3">{{ sourceGuidance(clsEntry) }}</div>
                    <casting-learning-contribution-editor v-model="clsEntry.contribution" :source-count="sourceCount" />
                    <q-select :model-value="clsEntry.rulesEdition || '2014'" :options="['2014','2024']" dense outlined dark label="Subclass grant rules" @update:model-value="value => clsEntry.rulesEdition = value" />
                    <casting-contribution-editor v-model="clsEntry.contribution" @update:model-value="onExtraClassChanged" />
                    <div class="row q-col-gutter-xs q-my-xs">
                      <q-select v-model="clsEntry.resourceType" :options="resourceTypeOptions" emit-value map-options dense outlined dark label="Source resource" class="col-6" />
                      <q-select v-model="clsEntry.refreshRate" :options="cadenceOptions" emit-value map-options dense outlined dark label="Source recovery" class="col-6" />
                      <q-input v-if="clsEntry.resourceType === 'focus' || clsEntry.resourceType === 'points'" v-model.number="clsEntry.resourceValue" type="number" min="0" dense outlined dark label="Authored resource maximum" hint="Custom value; no external system rules are inferred." class="col-12" />
                      <q-checkbox v-model="clsEntry.bypassSlotFilter" dark dense label="Allow spells above this source’s level" />
                    </div>
                    <casting-source-spell-rows :source="clsEntry" @patch="patch => Object.assign(clsEntry, patch)" />
                  </div>
                  </div>
                </q-expansion-item>

                <!-- Multiclass Live Calculation Breakdowns -->
                <div v-if="multiclassResult" class="q-pa-xs rounded-borders bg-grey-9 text-caption q-mt-xs">
                  <div class="text-amber-3 text-weight-bold q-mb-xs">Shared source resource calculation:</div>
                  <div class="row q-gutter-x-sm items-center flex-wrap">
                    <span
                      v-for="(bd, bIdx) in multiclassResult.classes"
                      :key="'mc-bd-' + bIdx"
                      class="text-weight-medium q-mr-sm"
                    >
                      <b class="text-purple-3">{{ bd.className }}{{ bd.subclass ? ` (${bd.subclass})` : '' }} Lvl {{ bd.level }}:</b>
                      DC <b>{{ bd.saveDc }}</b> (+{{ bd.spellAttack }})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>


  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { useClasses } from 'src/data/CLASS'
import { useRechargeTimes } from 'src/data/RECHARGE_TIME'
import { useMonsterStore } from 'src/stores/monster-store'
import { useEditorStore } from 'src/stores/editor-store'
import { useSpellsStore, SpellOption } from 'src/stores/spells-store'
import { spellRowRecovery } from 'src/core/domain/spell-plate'
import { sourceSpellOptions, sourceSpellCeiling, sourceAssignedAtLevel, replaceSourceLevelSpells, sourceCapacityReference, type CastingSourceSelection } from 'src/core/domain/casting-source-selection'
import { subclassSpells } from 'src/core/domain/catalogs/subclass-spells'
import { ref, computed, watch } from 'vue'
import MonsterTextEditor from './MonsterTextEditor.vue'
import FormulaField from '../kit/FormulaField.vue'
import CastingContributionEditor from './CastingContributionEditor.vue'
import CastingSourceSpellRows from './CastingSourceSpellRows.vue'
import CastingLearningContributionEditor from './CastingLearningContributionEditor.vue'
import { removeCastingSource } from 'src/core/domain/casting-source-list'
import { useSpellLevels } from '../spell/useSpellLevels'
import { validateNumber } from './numberInput'
import {
  allCastingSourceEntries,
  aggregateSpellcastingSources,
  getDefaultStatForClass,
  getSpellSlotsForClass,
  spellcastingRuleClass,
  SRD_SUBCLASSES_BY_CLASS,
  getSubclassesForClass,
} from 'src/core/usecases/AutoSyncSpellcasting'
import { getSpellTagString } from 'src/core/domain/spell-metadata'
import type { DndStat } from 'src/core/domain/types'
import { statModifier } from 'src/core/domain/math-utils'
import { CADENCE_OPTIONS, RESOURCE_REFRESH_OPTIONS } from 'src/core/domain/catalogs/cadence'
import { METAMAGIC_OPTIONS, metamagicCost } from 'src/core/domain/catalogs/metamagic'
import { v4 as uuidv4 } from 'uuid'

export default defineComponent({
  name: 'ClassCastingEditor',
  components: { MonsterTextEditor, FormulaField, CastingContributionEditor, CastingSourceSpellRows, CastingLearningContributionEditor },
  setup() {

    const monster = useMonsterStore()
    const primaryEnabled = computed(() => monster.spellcasting.primarySourceEnabled !== false)
    const sourceCount = computed(() => allCastingSourceEntries(monster.spellcasting).length)
    const sourceTitle = (source: {className?: string; class?: string; subclass?: string; level?: number}) => [source.className || source.class || 'Custom casting source', source.subclass].filter(Boolean).join(' / ') + ' � Level ' + (source.level || 1)
    const sourceCaption = (source: {standard?: string[];spells?: string[];stat?:string}) => (source.stat || 'INT') + ' � ' + (source.standard || source.spells || []).length + ' assigned spells'
    const resetPreparedCount = () => {
      monster.clearBinding('spellcasting.preparedCountOverride')
      monster.spellcasting.preparedCountOverride = null
    }
    const spells = useSpellsStore()
    const { rechargeTimeOptions } = useRechargeTimes()
    const classes = useClasses()

    const resourceTypeOptions = [
      { label: 'Spell Slots (Standard)', value: 'slots' },
      { label: 'Spell Points (DMG Variant)', value: 'points' },
      { label: 'Focus Points', value: 'focus' },
      { label: 'Pact Magic Slots', value: 'pact' },
    ]

    const refreshRateOptions = RESOURCE_REFRESH_OPTIONS

    const displayTitleModeOptions = [
      { label: 'Class Names (e.g. Level 9 Wizard)', value: 'class_names' },
      { label: 'Caster Source (Arcane / Divine / Primal)', value: 'caster_source' },
      { label: 'Split Levels (Wizard (9) / Cleric (5))', value: 'split_levels' },
    ]

    const cadenceOptions = CADENCE_OPTIONS

    const primarySubclass = computed<string>({
      get: () => monster.spellcasting.subclass || '',
      set: (val: string) => {
        monster.spellcasting.subclass = val || ''
      }
    })

    const primarySubclassOptions = computed(() => {
      const cls = monster.spellcasting.class || 'Wizard'
      return getSubclassesForClass(cls)
    })

    const filteredPrimarySubclasses = ref<string[]>(getSubclassesForClass(monster.spellcasting.class || 'Wizard'))
    watch(primarySubclassOptions, (opts) => {
      filteredPrimarySubclasses.value = opts
    })

    const filterPrimarySubclasses = (val: string, update: (fn: () => void) => void) => {
      update(() => {
        const full = primarySubclassOptions.value
        if (!val) {
          filteredPrimarySubclasses.value = full
        } else {
          const needle = val.toLowerCase()
          filteredPrimarySubclasses.value = full.filter((v: string) => v.toLowerCase().includes(needle))
        }
      })
    }

    const extraSubclassOptions = ref<Record<string, string[]>>({})
    const filterExtraSubclasses = (clsName: string, val: string, update: (fn: () => void) => void) => {
      update(() => {
        const full = getSubclassesForClass(clsName)
        if (!val) {
          extraSubclassOptions.value[clsName] = full
        } else {
          const needle = val.toLowerCase()
          extraSubclassOptions.value[clsName] = full.filter((v: string) => v.toLowerCase().includes(needle))
        }
      })
    }

    const getSubclassesFor = (clsName?: string) => {
      return getSubclassesForClass(clsName || 'Wizard')
    }

    const primarySource = computed(() => ({ className: monster.spellcasting.class || '', subclass: primarySubclass.value, level: monster.spellcasting.level, stat: monster.spellcasting.stat, spells: monster.spellcasting.standard, refreshRate: monster.spellcasting.refreshRate, customRefreshRate: monster.spellcasting.customRefreshRate, resourceType: monster.spellcasting.resourceType, contribution: monster.spellcasting.contribution, rulesEdition:monster.spellcasting.rulesEdition, bypassSlotFilter: monster.spellcasting.bypassSlotLevelFilter }))
    const metrics = computed(() => sourceCapacityReference(spells.allSpellOptions, primarySource.value, statModifier(monster.stats?.[monster.spellcasting.stat || 'INT'] ?? 10), multiclassResult.value?.combinedCasterLevel, sourceCount.value))

    const { ordinalSpellLevels } = useSpellLevels()
    const spellLevels = ordinalSpellLevels

    const classDisplayValue = computed(() => {
      if (monster.spellcasting.class == null) return ''
      return monster.spellcasting.class in classes.SrdClass.value
        ? classes.SrdClass.value[
            monster.spellcasting.class as keyof typeof classes.SrdClass.value
          ]
        : monster.spellcasting.class
    })

    // Extra Multiclass Entries
    if (!monster.spellcasting.classes) {
      monster.spellcasting.classes = []
    }
    const extraClasses = computed({
      get: () => monster.spellcasting.classes || [],
      set: (val: any) => {
        monster.spellcasting.classes = val
        updateSpellcastingSlots(monster.spellcasting.level)
      }
    })

    const addExtraClass = () => {
      if (!monster.spellcasting.classes) {
        monster.spellcasting.classes = []
      }
      if (!primaryEnabled.value) {
        monster.spellcasting.primarySourceEnabled = true
        monster.spellcasting.class = 'Wizard'
        monster.spellcasting.level = 1
        monster.spellcasting.stat = 'INT'
        monster.spellcasting.rulesEdition = editorStore.style === '2014' ? '2014' : '2024'
        monster.spellcasting.standard = []
        monster.spellcasting.slots = getSpellSlotsForClass('Wizard', 1)
        return
      }
      monster.spellcasting.classes.push({
        id: uuidv4(),
        className: 'Sorcerer',
        subclass: '',
        level: 3,
        stat: 'CHA',
        rulesEdition: editorStore.style === '2014' ? '2014' : '2024',
      })
      updateSpellcastingSlots(monster.spellcasting.level)
    }

    const removeSource = (id: string) => {
      const result = removeCastingSource(monster.spellcasting, id)
      monster.$patch(state => {
        const bindings = { ...state.bindings }
        for (const remap of result.bindingRemaps) for (const [path, binding] of Object.entries(bindings)) {
          if (path !== remap.from && !path.startsWith(remap.from + '.')) continue
          delete bindings[path]
          if (remap.to) bindings[remap.to + path.slice(remap.from.length)] = binding
        }
        state.bindings = bindings
        state.spellcasting = result.source
      })
    }
    const removePrimarySource = () => removeSource('primary')
    const removeExtraClass = (idx: number) => { const entry = extraClasses.value[idx]; if (entry) removeSource(entry.id) }

    const onExtraClassChanged = () => {
      updateSpellcastingSlots(monster.spellcasting.level)
    }

    // Multiclass Reactive Bindings
    const multiclassEnabled = computed(() => sourceCount.value > 1)

    const multiclassResult = computed(() => (multiclassEnabled.value || monster.spellcasting.contribution?.mode === 'custom') ? aggregateSpellcastingSources(monster.spellcasting, monster.stats, monster.proficiency) : undefined)

    const updateSpellcastingClass = (value: string | undefined) => {
      if (value != null) {
        monster.spellcasting.class = value
        monster.spellcasting.stat = getDefaultStatForClass(value)
        primarySubclass.value = ''
        updateSpellcastingSlots(monster.spellcasting.level)
      } else {
        monster.spellcasting.class = value
      }
    }

    const updateSpellcastingSlots = (level: number) => {
      if (extraClasses.value.length > 0 || monster.spellcasting.contribution?.mode === 'custom') {
        const multi = aggregateSpellcastingSources({ ...monster.spellcasting, level }, monster.stats, monster.proficiency)
        if (!multi) return
        monster.spellcasting.slots = multi.slots
        if (monster.spellcasting.multiclass) {
          monster.spellcasting.multiclass.secondarySaveDc = multi.secondarySaveDc
          monster.spellcasting.multiclass.secondarySpellAttack = multi.secondarySpellAttack
        }
      } else if (monster.spellcasting.class && sourceSpellCeiling({ className: monster.spellcasting.class, subclass: primarySubclass.value, level }) !== undefined) {
        monster.spellcasting.slots = getSpellSlotsForClass(spellcastingRuleClass(monster.spellcasting.class, primarySubclass.value) || monster.spellcasting.class, level)
      }
    }

    const getSpellTag = (name: string) => getSpellTagString(name)

    const getSpellName = (id: string) => {
      const sp = spells.allSpells[id]
      return sp?.name || id
    }

    const getSpellCadence = (spellId: string): string => {
      const level=spells.allSpellOptions.find(spell => spell.value === spellId)?.level ?? 0
      return monster.spellcasting.spellCadenceMap?.[spellId] || getLevelCadence(level)
    }

    const setSpellCadence = (spellId: string, cadence: string) => {
      if (!monster.spellcasting.spellCadenceMap) {
        monster.spellcasting.spellCadenceMap = {}
      }
      monster.spellcasting.spellCadenceMap[spellId] = cadence
    }

    const toggleSpellBonusAction = (spellId: string) => {
      if (!monster.spellcasting.bonusActionSpellMap) {
        monster.spellcasting.bonusActionSpellMap = {}
      }
      monster.spellcasting.bonusActionSpellMap[spellId] = !monster.spellcasting.bonusActionSpellMap[spellId]
    }

    const getCadenceLabel = (val: string): string => {
      const match = cadenceOptions.find((c) => c.value === val)
      return match ? match.label : val
    }

    const removeSpell = (spellId: string) => {
      monster.spellcasting.standard = monster.spellcasting.standard.filter((id) => id !== spellId)
      if (monster.spellcasting.spellCadenceMap) {
        delete monster.spellcasting.spellCadenceMap[spellId]
      }
    }

    // Option labels carry the cost for the selected rules edition; the stored value stays the plain name.
    const editorStore = useEditorStore()
    const metamagicOptionsList = computed(() => {
      const edition = editorStore.style === '2014' ? '2014' : '2024'
      return METAMAGIC_OPTIONS.map(({ name }) => {
        const cost = metamagicCost(name, edition)
        return { label: /^\d+$/.test(cost) ? `${name} (${cost} SP)` : `${name} (${cost})`, value: name }
      })
    })

    const metamagicEnabled = computed({
      get: () => !!monster.spellcasting.metamagic?.enabled,
      set: (val: boolean) => {
        if (!monster.spellcasting.metamagic) {
          monster.spellcasting.metamagic = {
            enabled: val,
            sorceryPoints: Math.max(2, monster.spellcasting.level || 3),
            refreshRate: 'Long Rest',
            options: ['Quickened Spell', 'Subtle Spell'],
          }
        } else {
          monster.spellcasting.metamagic.enabled = val
        }
      }
    })

    const toggleMetamagic = (val: boolean) => {
      metamagicEnabled.value = val
    }

    const toggleBonusActionLevel = (lvl: number) => {
      if (!monster.spellcasting.bonusActionLevelMap) {
        monster.spellcasting.bonusActionLevelMap = {}
      }
      monster.spellcasting.bonusActionLevelMap[lvl] = !monster.spellcasting.bonusActionLevelMap[lvl]
    }

    const getLevelCadence = (lvl: number): string => spellRowRecovery(lvl, monster.spellcasting.levelCadenceMap?.[lvl], { ...monster.spellcasting, className: monster.spellcasting.class })
    const sourceLevelRecovery = (source: OwnedSource, level: number): string => spellRowRecovery(level, source.levelCadences?.[level], source)

    const setLevelCadence = (lvl: number, val: string) => {
      if (!monster.spellcasting.levelCadenceMap) {
        monster.spellcasting.levelCadenceMap = {}
      }
      monster.spellcasting.levelCadenceMap[lvl] = val
    }

    const primaryAssignedLevel = (level: number) => sourceAssignedAtLevel(spells.allSpellOptions, monster.spellcasting.standard, level)
    const setPrimaryLevelSpells = (level: number, values: string[]) => { monster.spellcasting.standard = replaceSourceLevelSpells(spells.allSpellOptions, monster.spellcasting.standard, level, values) }
    type OwnedSource = NonNullable<typeof monster.spellcasting.classes>[number]
    const assignedSourceLevel = (source: OwnedSource, level: number) => sourceAssignedAtLevel(spells.allSpellOptions, source.spells || [], level)
    const sourceLevelUnavailable = (source: CastingSourceSelection, level: number) => !source.bypassSlotFilter && (sourceSpellCeiling(source) ?? 9) < level && !sourceAssignedAtLevel(spells.allSpellOptions, source.spells || [], level).length
    const optionsSourceLevel = (source: OwnedSource, level: number) => queryOptions(sourceSpellOptions(spells.allSpellOptions, source, level), source.id + ':' + level)
    const spellQueries = ref<Record<string, string>>({})
    const filterSpellQuery = (key: string, value: string, update: (fn: () => void) => void) => update(() => { spellQueries.value[key] = value.toLowerCase().trim() })
    const queryOptions = (options: SpellOption[], key: string) => options.filter(option => !spellQueries.value[key] || (option.label + ' ' + option.classDisplay).toLowerCase().includes(spellQueries.value[key]))
    const sourceLevelLabel = (source: OwnedSource, level: number | string) => (Number(level) === 0 ? 'Cantrips' : 'Level ' + level) + ' · ' + assignedSourceLevel(source, Number(level)).length + ' assigned'
    const sourceGuidance = (source: CastingSourceSelection & { stat?: DndStat }) => {
      const maximum = sourceSpellCeiling(source)
      const capacity = sourceCapacityReference(spells.allSpellOptions, source, statModifier(monster.stats?.[source.stat || 'INT'] ?? 10), multiclassResult.value?.combinedCasterLevel, sourceCount.value)
      if (maximum === undefined || !capacity) return 'Custom source: assign spells and resource limits explicitly. No automatic ruleset capacity is assumed. ' + (source.spells || []).length + ' spells assigned.'
      const slots = getSpellSlotsForClass(spellcastingRuleClass(source.className, source.subclass) || source.className, source.level).map((count, index) => count ? count + ' slots at level ' + (index + 1) : '').filter(Boolean).join(', ')
      const recovery = spellRowRecovery(1, undefined, source)
      const grants = capacity.grantedSpells.length ? ' Always prepared: ' + capacity.grantedSpells.join(', ') + '; ' + capacity.selectedGrantedSpells.length + ' assigned grants do not use the selection budget.' : ' No verified always-prepared grants apply for this source and rules edition.'
      const expansion = source.rulesEdition === '2024' ? 'Verified subclass grants follow their source-level thresholds; other catalog options remain manually selectable.' : capacity.subclassCatalogSpells.length ? capacity.subclassCatalogSpells.length + ' subclass catalog options expand selection; always-prepared grants are not inferred for legacy rules.' : 'No subclass grants are inferred.'
      return 'Legacy 2014 base-class reference: ' + capacity.cantripsKnown + ' cantrips known; ' + capacity.preparedSpells + ' spells ' + capacity.selectionModel + '. Selected: ' + capacity.selectedCantrips + ' cantrips, ' + capacity.selectedSpells + ' leveled spells' + (capacity.unknownAssignments ? ', ' + capacity.unknownAssignments + ' uncatalogued assignments' : '') + '. Cantrip calculation level: ' + capacity.cantripCapacityLevel + '; known/prepared calculation level: ' + capacity.spellCapacityLevel + '. Budget selections: ' + capacity.selectedBudgetSpells + ' / ' + capacity.preparedSpells + '.' + grants + ' Own-class ceiling: level ' + maximum + '. Base resources: ' + (slots || 'no leveled slots') + ' / ' + recovery.replaceAll('_', ' ') + '. ' + expansion + ' Shared multiclass slots do not expand this source’s learnable levels. Existing assignments are preserved.'
    }
    const setSourceLevelSpells = (source: OwnedSource, level: number, values: string[]) => { source.spells = replaceSourceLevelSpells(spells.allSpellOptions, source.spells || [], level, values) }
    const setSourceLevelCadence = (source: OwnedSource, level: number, value: string) => { source.levelCadences = { ...source.levelCadences, [level]: value } }
    const setSourceLevelBonus = (source: OwnedSource, level: number, value: boolean) => { source.levelBonusAction = { ...source.levelBonusAction, [level]: value } }
    const setSourceSpellCadence = (source: OwnedSource, id: string, value: string) => { source.spellCadenceMap = { ...source.spellCadenceMap, [id]: value } }
    const newSpellForClass = ref<Record<string, any>>({})
    // A12.5: a class list always includes custom spells and the subclass's own spells, labelled as such.
    const markSubclass = (opts: SpellOption[], subclass?: string) => {
      const own = subclassSpells(subclass)
      return opts.map((s) => own.includes(s.value) && !s.custom ? { ...s, label: `${s.value} (subclass)` } : s)
    }
    const inClassList = (s: SpellOption, className: string, subclass?: string) =>
      !!s.custom || subclassSpells(subclass).includes(s.value) || (s.class || []).some((c: string) => c.toLowerCase() === className.toLowerCase())
    const spellOptionsForClass = (className?: string, subclass?: string) => {
      if (!className) return spells.allSpellOptions
      const filtered = markSubclass(spells.allSpellOptions.filter((s) => inClassList(s, className, subclass)), subclass)
      return filtered
    }
    const addSpellToClass = (clsEntry: any, index: number) => {
      const key = clsEntry.id || index
      const spellVal = newSpellForClass.value[key]
      if (!spellVal) return
      const spellName = typeof spellVal === 'object' ? spellVal.value || spellVal.label : spellVal
      if (!clsEntry.spells) clsEntry.spells = []
      if (!clsEntry.spells.includes(spellName)) {
        clsEntry.spells.push(spellName)
      }
      newSpellForClass.value[key] = null
    }
    const removeSpellFromClass = (clsEntry: any, spIdx: number) => {
      if (clsEntry.spells) {
        clsEntry.spells.splice(spIdx, 1)
      }
    }

    const spellOptionsByLevel = (level: number, className?: string, subclass?: string) => {
      const source = { className: className || monster.spellcasting.class || '', subclass, level: monster.spellcasting.level, bypassSlotFilter: monster.spellcasting.bypassSlotLevelFilter }
      if (!className) {
        const ceiling = sourceSpellCeiling(source)
        return spells.allSpellOptions.filter(s => s.level === Number(level) && (source.bypassSlotFilter || ceiling === undefined || Number(level) === 0 || Number(level) <= ceiling)).sort((a,b)=>a.label.localeCompare(b.label))
      }
      return queryOptions(sourceSpellOptions(spells.allSpellOptions, source, Number(level)), 'primary:' + level)
    }

    return {
      primaryEnabled, sourceCount, sourceTitle, sourceCaption, removePrimarySource, filterSpellQuery, sourceLevelRecovery, sourceLevelUnavailable, primarySource, primaryAssignedLevel, setPrimaryLevelSpells, assignedSourceLevel, optionsSourceLevel, sourceLevelLabel, sourceGuidance, setSourceLevelSpells, setSourceLevelCadence, setSourceLevelBonus, setSourceSpellCadence,
      monster,
      primarySubclass,
      primarySubclassOptions,
      filteredPrimarySubclasses,
      filterPrimarySubclasses,
      extraSubclassOptions,
      filterExtraSubclasses,
      getSubclassesFor,
      extraClasses,
      addExtraClass,
      removeExtraClass,
      onExtraClassChanged,
      resetPreparedCount,
      metrics,
      spellLevels,
      classDisplayValue,
      multiclassEnabled,
      multiclassResult,
      updateSpellcastingClass,
      updateSpellcastingSlots,
      getSpellTag,
      getSpellTagString,
      getSpellName,
      getSpellCadence,
      setSpellCadence,
      toggleSpellBonusAction,
      getCadenceLabel,
      removeSpell,
      spellOptionsByLevel,
      newSpellForClass,
      spellOptionsForClass,
      addSpellToClass,
      removeSpellFromClass,
      validateNumber,
      rechargeTimeOptions,
      resourceTypeOptions,
      refreshRateOptions,
      displayTitleModeOptions,
      cadenceOptions,
      metamagicOptionsList,
      metamagicEnabled,
      toggleMetamagic,
      toggleBonusActionLevel,
      getLevelCadence,
      setLevelCadence,
      ...classes,
    }
  },
})
</script>
