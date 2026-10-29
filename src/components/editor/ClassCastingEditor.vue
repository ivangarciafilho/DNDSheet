<template>
  <q-expansion-item
    expand-separator
    :label="$t('editor.spellcasting.class.label')"
    :caption="$t('editor.spellcasting.class.caption')"
    header-class="bg-purple-10"
  >
    <q-card>
      <q-card-section>
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
            :options="primarySubclassOptions"
            label="Subclass"
            new-value-mode="add-unique"
            use-input
            clearable
            class="col-12 col-sm-3 q-pa-xs"
          >
            <q-tooltip class="text-caption">Subclass (e.g. Evocation, Fiend, Draconic)</q-tooltip>
          </q-select>

          <q-input
            :model-value="monster.spellcasting.level"
            :label="$t('monster.spellcasting.level')"
            type="number"
            min="1"
            max="20"
            class="col-6 col-sm-2 q-pa-xs"
            @update:model-value="
              (value: string | number | null) => {
                monster.spellcasting.level = validateNumber(value, 1)
                updateSpellcastingSlots(monster.spellcasting.level)
              }
            "
          >
            <q-tooltip class="text-caption">Caster level in primary class</q-tooltip>
          </q-input>

          <q-select
            v-model="monster.spellcasting.stat"
            :options="['INT', 'WIS', 'CHA', 'CON', 'STR', 'DEX']"
            label="Casting Stat"
            class="col-6 col-sm-2 q-pa-xs"
            @update:model-value="updateSpellcastingSlots(monster.spellcasting.level)"
          >
            <q-tooltip class="text-caption">Spellcasting ability score</q-tooltip>
          </q-select>

          <q-input
            :model-value="monster.spellSave"
            label="Save DC"
            type="number"
            class="col-6 col-sm-2 q-pa-xs"
            @update:model-value="(v: string | number | null) => {
              monster.spellcasting.save.override = true
              monster.spellcasting.save.overrideValue = validateNumber(v, 10)
            }"
          >
            <template #after>
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
              <span class="text-caption text-weight-bold text-amber-3 q-mr-xs">5e Auto-Calculated:</span>
              <q-badge color="purple-7" class="text-caption text-weight-bold">
                Ability: {{ monster.spellcasting.stat }}
              </q-badge>
              <q-badge color="purple-7" class="text-caption text-weight-bold">
                Save DC {{ monster.spellSave }}
              </q-badge>
              <q-badge color="purple-7" class="text-caption text-weight-bold">
                Spell Attack {{ monster.spellAttackModifier >= 0 ? `+${monster.spellAttackModifier}` : monster.spellAttackModifier }}
              </q-badge>
              <q-badge color="cyan-8" class="text-caption text-weight-bold">
                Known Cantrips: {{ metrics?.cantripsKnown ?? 0 }}
              </q-badge>
              <q-badge color="blue-8" class="text-caption text-weight-bold">
                Prepared Spells: {{ metrics?.preparedSpells ?? 0 }}
              </q-badge>
              <q-badge color="amber-8" class="text-caption text-weight-bold">
                Highest Slot: Level {{ metrics?.highestSlot ?? 0 }}
              </q-badge>
              <q-badge color="grey-8" class="text-caption text-capitalize">
                {{ metrics?.casterType ?? 'full' }} Caster
              </q-badge>
            </div>
          </div>

          <!-- Quality of Life: Presentation & Resource Mode Controls -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div class="row q-col-gutter-xs items-center q-pa-xs rounded-borders bg-grey-9 text-white" style="border: 1px solid rgba(255, 255, 255, 0.12);">
              <div class="col-12 col-sm-3">
                <q-select
                  v-model="monster.spellcasting.resourceType"
                  :options="resourceTypeOptions"
                  emit-value
                  map-options
                  label="Resource Mode"
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
                  :options="refreshRateOptions"
                  emit-value
                  map-options
                  label="Refresh Cadence"
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
                  :options="displayTitleModeOptions"
                  emit-value
                  map-options
                  label="Title Disclosure"
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
                  label="Bypass Max Slot Level"
                  dense
                  color="purple-4"
                  class="text-caption text-weight-bold"
                >
                  <q-tooltip class="bg-grey-9 text-caption">Allow selecting spells beyond the class's standard 5e maximum slot level.</q-tooltip>
                </q-checkbox>
              </div>
            </div>
          </div>

          <!-- Multiclass Spellcaster Support (Arbitrary Classes & Subclasses) -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div class="q-pa-xs rounded-borders bg-grey-10 text-white" style="border: 1px dashed #a855f7;">
              <div class="row items-center justify-between q-mb-xs">
                <q-checkbox
                  v-model="multiclassEnabled"
                  label="Multiclass Spellcasting (Combined Slot Progression &amp; Subclasses)"
                  dense
                  color="purple-4"
                  class="text-weight-bold text-caption text-purple-3"
                  @update:model-value="toggleMulticlass"
                />
                <span v-if="multiclassEnabled" class="text-caption text-cyan-3">
                  Combined Caster Level: <b>{{ multiclassResult?.combinedCasterLevel || monster.spellcasting.level }}</b>
                </span>
              </div>

              <div v-if="multiclassEnabled" class="column q-gutter-y-xs q-mt-xs">
                <!-- List of Extra Classes -->
                <div
                  v-for="(clsEntry, cIdx) in extraClasses"
                  :key="clsEntry.id || cIdx"
                  class="row q-col-gutter-xs items-center q-pa-xs rounded-borders bg-grey-9"
                >
                  <q-select
                    v-model="clsEntry.className"
                    :options="SrdCastingClassOptions"
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
                    :options="getSubclassesFor(clsEntry.className)"
                    label="Subclass"
                    new-value-mode="add-unique"
                    use-input
                    clearable
                    dense
                    outlined
                    dark
                    class="col-12 col-sm-3"
                    @update:model-value="onExtraClassChanged"
                  />
                  <q-input
                    v-model.number="clsEntry.level"
                    type="number"
                    min="1"
                    max="20"
                    label="Level"
                    dense
                    outlined
                    dark
                    class="col-6 col-sm-2"
                    @update:model-value="onExtraClassChanged"
                  />
                  <q-select
                    v-model="clsEntry.stat"
                    :options="['INT', 'WIS', 'CHA', 'CON', 'STR', 'DEX']"
                    label="Stat"
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
                      @click="removeExtraClass(cIdx)"
                    >
                      <q-tooltip class="text-caption">Remove Class</q-tooltip>
                    </q-btn>
                  </div>
                </div>

                <div class="row justify-between items-center q-mt-xs">
                  <q-btn
                    dense
                    outline
                    size="sm"
                    color="purple-3"
                    icon="add"
                    label="Add Class"
                    no-caps
                    class="text-weight-bold"
                    @click="addExtraClass"
                  />
                </div>

                <!-- Multiclass Live Calculation Breakdowns -->
                <div v-if="multiclassResult" class="q-pa-xs rounded-borders bg-grey-9 text-caption q-mt-xs">
                  <div class="text-amber-3 text-weight-bold q-mb-xs">5e Combined Multiclass Resolution:</div>
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

          <!-- Prepared Spells & Cantrip Switching Configuration -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div class="row q-col-gutter-xs items-center q-pa-xs rounded-borders bg-grey-9 text-white" style="border: 1px solid rgba(255, 255, 255, 0.12);">
              <div class="col-12 col-sm-3">
                <q-input
                  v-model.number="monster.spellcasting.preparedCountOverride"
                  type="number"
                  min="0"
                  label="Prepared Spells Count"
                  dense
                  outlined
                  dark
                  hide-bottom-space
                >
                  <q-tooltip>Custom number of spells the creature can prepare (defaults to 5e class calculation if empty)</q-tooltip>
                </q-input>
              </div>

              <div class="col-12 col-sm-3">
                <q-select
                  v-model="monster.spellcasting.preparedInterval"
                  :options="['Long Rest', 'Short Rest', 'Dawn', 'Dusk', 'Midnight', 'Downtime']"
                  label="Prepared Interval"
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
                  label="Switch Cantrips"
                  dense
                  color="purple-4"
                  class="text-caption text-weight-bold"
                >
                  <q-tooltip>Allow switching cantrips per rest</q-tooltip>
                </q-checkbox>
              </div>

              <div v-if="monster.spellcasting.cantripSwitch" class="col-6 col-sm-2">
                <q-input
                  v-model.number="monster.spellcasting.cantripSwitchCount"
                  type="number"
                  min="1"
                  label="Count"
                  dense
                  outlined
                  dark
                  hide-bottom-space
                />
              </div>

              <div v-if="monster.spellcasting.cantripSwitch" class="col-6 col-sm-2">
                <q-select
                  v-model="monster.spellcasting.cantripSwitchInterval"
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

          <!-- Metamagic Studio Configuration -->
          <div class="col-12 q-pa-xs q-mb-xs">
            <div class="q-pa-xs rounded-borders bg-grey-10 text-white" style="border: 1px dashed rgba(236, 72, 153, 0.6);">
              <div class="row items-center justify-between q-mb-xs">
                <q-checkbox
                  v-model="metamagicEnabled"
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
                  <q-input
                    v-model.number="monster.spellcasting.metamagic.sorceryPoints"
                    type="number"
                    min="0"
                    label="Sorcery Points"
                    dense
                    outlined
                    dark
                    hide-bottom-space
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    v-model="monster.spellcasting.metamagic.refreshRate"
                    :options="['Long Rest', 'Short Rest', 'Dawn', 'Dusk', 'Midnight']"
                    label="Points Refresh"
                    dense
                    outlined
                    dark
                    hide-bottom-space
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="monster.spellcasting.metamagic.options"
                    :options="metamagicOptionsList"
                    multiple
                    use-chips
                    label="Active Metamagic Techniques"
                    dense
                    outlined
                    dark
                    hide-bottom-space
                  />
                </div>
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

          <!-- Folded Per-Level Spell Slots & Spells Selection (Primary Architecture) -->
          <div class="col-12 q-pa-xs q-mt-sm">
            <div class="text-caption text-weight-bold text-purple-3 q-mb-xs flex items-center justify-between">
              <span>Folded Level Thresholds &amp; Assigned Spells</span>
              <div class="row items-center q-gutter-x-xs">
                <q-btn
                  dense
                  size="xs"
                  :color="classFilter ? 'positive' : 'grey-8'"
                  :label="classFilter ? 'Class Spells Only: ON' : 'All 5e Spells'"
                  @click="classFilter = !classFilter"
                />
              </div>
            </div>

            <!-- Accordion of folded level sections -->
            <div class="column q-gutter-y-xs">
              <q-expansion-item
                v-for="(ordinal, level) in spellLevels"
                :key="'lvl-exp-' + level"
                dense
                dense-toggle
                expand-separator
                header-class="bg-grey-9 text-white rounded-borders"
                style="border: 1px solid rgba(255, 255, 255, 0.1);"
                :default-opened="level === 0 || monster.knownSpellsOfLevel(level).length > 0 || (level > 0 && monster.spellcasting.slots[level - 1] > 0)"
              >
                <!-- Level Header -->
                <template #header>
                  <div class="row items-center full-width no-wrap justify-between q-pr-sm">
                    <!-- Far-Left: Level Cadence & Bonus Action Toggle -->
                    <div class="row items-center q-gutter-x-xs no-wrap" @click.stop>
                      <q-select
                        :model-value="getLevelCadence(level)"
                        :options="cadenceOptions"
                        emit-value
                        map-options
                        dense
                        outlined
                        dark
                        options-dense
                        hide-bottom-space
                        style="min-width: 120px;"
                        @update:model-value="(val: string) => setLevelCadence(level, val)"
                      >
                        <q-tooltip class="text-caption">Availability cadence for Level {{ level }} spells (e.g. Long Rest, Short Rest, At-Will)</q-tooltip>
                      </q-select>

                      <q-btn
                        dense
                        size="xs"
                        :color="monster.spellcasting.bonusActionLevelMap?.[level] ? 'positive' : 'grey-8'"
                        :label="monster.spellcasting.bonusActionLevelMap?.[level] ? 'BA: ON' : 'BA'"
                        class="text-weight-bold"
                        @click="toggleBonusActionLevel(level)"
                      >
                        <q-tooltip class="text-caption">Bonus Action: Cast Level {{ level }} spells as a Bonus Action</q-tooltip>
                      </q-btn>
                    </div>

                    <!-- Level Title & Slot Count -->
                    <div class="row items-center q-gutter-x-sm">
                      <span class="text-weight-bold text-subtitle2 text-amber-3">
                        {{ level === 0 ? 'Cantrips' : `Level ${level}` }}
                      </span>
                      <template v-if="level > 0">
                        <div class="row items-center q-gutter-x-xs" @click.stop>
                          <span class="text-caption text-grey-4">Slots:</span>
                          <q-input
                            :model-value="monster.spellcasting.slots[level - 1]"
                            type="number"
                            dense
                            outlined
                            dark
                            min="0"
                            style="width: 60px;"
                            input-class="text-center font-bold"
                            @update:model-value="(val: string | number | null) => (monster.spellcasting.slots[level - 1] = validateNumber(val, 0))"
                          />
                        </div>
                      </template>
                      <template v-else>
                        <q-badge color="amber-9" class="text-caption text-weight-bold">
                          At-Will
                        </q-badge>
                      </template>
                    </div>

                    <!-- Spells Count Chip -->
                    <div class="row items-center">
                      <q-badge color="purple-7" class="text-caption text-weight-bold">
                        {{ monster.knownSpellsOfLevel(level).length }} Spells
                      </q-badge>
                    </div>
                  </div>
                </template>

                <!-- Level Body: Level Spell Picker + Assigned Cards -->
                <q-card class="bg-grey-10 text-white q-pa-sm">
                  <!-- Spell Selector Filtered to this Level -->
                  <div class="q-mb-xs">
                    <q-select
                      :model-value="monster.knownSpellsOfLevel(level)"
                      :options="spellOptionsByLevel(level, classFilter ? monster.spellcasting.class : undefined)"
                      multiple
                      use-chips
                      emit-value
                      dense
                      outlined
                      dark
                      hide-bottom-space
                      label="Select or search spells to assign..."
                      input-debounce="0"
                      @update:model-value="(val: string[]) => monster.updateSpellsAtLevel(level, val)"
                    >
                      <template #option="scope">
                        <q-item v-bind="scope.itemProps" dense>
                          <q-item-section>
                            <q-item-label class="text-weight-bold">{{ scope.opt.label }}</q-item-label>
                            <q-item-label caption class="text-grey-4">{{ scope.opt.classDisplay }}</q-item-label>
                          </q-item-section>
                          <q-item-section side>
                            <span class="text-caption text-purple-3 font-mono text-weight-bold">
                              {{ getSpellTag(scope.opt.value) }}
                            </span>
                          </q-item-section>
                        </q-item>
                      </template>
                    </q-select>
                  </div>

                  <!-- Assigned Spells Cards Grid -->
                  <div v-if="monster.knownSpellsOfLevel(level).length > 0" class="row q-col-gutter-xs q-mt-xs">
                    <div
                      v-for="spellId in monster.knownSpellsOfLevel(level)"
                      :key="spellId"
                      class="col-12 col-sm-6 col-md-4"
                    >
                      <div
                        class="row items-center justify-between q-pa-xs rounded-borders bg-grey-9 text-white shadow-1"
                        style="border: 1px solid rgba(168, 85, 247, 0.35); min-height: 48px;"
                      >
                        <div class="col ellipsis q-pr-xs">
                          <span class="text-weight-bold text-caption text-white">{{ getSpellName(spellId) }}</span>
                          <span class="text-purple-3 text-caption q-ml-xs">({{ getSpellTagString(spellId) }})</span>
                        </div>
                        <div class="row items-center q-gutter-x-xs no-wrap">
                          <q-select
                            :model-value="getSpellCadence(spellId)"
                            :options="cadenceOptions"
                            emit-value
                            map-options
                            dense
                            outlined
                            dark
                            options-dense
                            hide-bottom-space
                            style="min-width: 110px;"
                            @update:model-value="(val: string) => setSpellCadence(spellId, val)"
                          >
                            <q-tooltip class="text-caption">Spell recovery/cadence (defaults to Long Rest / Daily)</q-tooltip>
                          </q-select>
                          <q-btn
                            flat
                            round
                            dense
                            size="xs"
                            icon="close"
                            color="negative"
                            @click="removeSpell(spellId)"
                          >
                            <q-tooltip class="text-caption">Remove Spell</q-tooltip>
                          </q-btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card>
              </q-expansion-item>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { useClasses } from 'src/data/CLASS'
import { useRechargeTimes } from 'src/data/RECHARGE_TIME'
import { useMonsterStore } from 'src/stores/monster-store'
import { useSpellsStore, SpellOption } from 'src/stores/spells-store'
import { ref, computed } from 'vue'
import MonsterTextEditor from './MonsterTextEditor.vue'
import { useSpellLevels } from '../spell/useSpellLevels'
import { validateNumber } from './numberInput'
import {
  calculateSpellcastingMetrics,
  calculateMulticlassSpellcasting,
  getDefaultStatForClass,
  getSpellSlotsForClass,
  SRD_SUBCLASSES_BY_CLASS,
  ClassEntry
} from 'src/core/usecases/AutoSyncSpellcasting'
import { getSpellMetadata, getSpellTagString } from 'src/core/domain/spell-metadata'
import { statModifier } from 'src/core/domain/math-utils'
import { CADENCE_OPTIONS, RESOURCE_REFRESH_OPTIONS } from 'src/core/domain/catalogs/cadence'
import { METAMAGIC_OPTIONS } from 'src/core/domain/catalogs/metamagic'
import { v4 as uuidv4 } from 'uuid'

export default defineComponent({
  name: 'ClassCastingEditor',
  components: { MonsterTextEditor },
  setup() {
    const classFilter = ref(false)

    const monster = useMonsterStore()
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

    const primarySubclass = ref<string>('')

    const primarySubclassOptions = computed(() => {
      const cls = monster.spellcasting.class || 'Wizard'
      return SRD_SUBCLASSES_BY_CLASS[cls] || []
    })

    const getSubclassesFor = (clsName?: string) => {
      return SRD_SUBCLASSES_BY_CLASS[clsName || 'Wizard'] || []
    }

    const metrics = computed(() => {
      try {
        const stat = monster.spellcasting.stat || 'INT'
        const mod = statModifier(monster.stats?.[stat] ?? 10)
        return calculateSpellcastingMetrics(
          monster.spellcasting.class || 'Wizard',
          monster.spellcasting.level || 1,
          mod
        )
      } catch {
        return {
          cantripsKnown: 3,
          preparedSpells: 4,
          highestSlot: 1,
          casterType: 'full',
          recommendedStat: 'INT'
        }
      }
    })

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
      monster.spellcasting.classes.push({
        id: uuidv4(),
        className: 'Sorcerer',
        subclass: '',
        level: 3,
        stat: 'CHA',
      })
      updateSpellcastingSlots(monster.spellcasting.level)
    }

    const removeExtraClass = (idx: number) => {
      if (monster.spellcasting.classes) {
        monster.spellcasting.classes.splice(idx, 1)
        updateSpellcastingSlots(monster.spellcasting.level)
      }
    }

    const onExtraClassChanged = () => {
      updateSpellcastingSlots(monster.spellcasting.level)
    }

    // Multiclass Reactive Bindings
    const multiclassEnabled = computed({
      get: () => !!monster.spellcasting.multiclass?.enabled,
      set: (val: boolean) => {
        if (!monster.spellcasting.multiclass) {
          monster.spellcasting.multiclass = {
            enabled: val,
            secondaryClass: 'Cleric',
            secondaryLevel: 3,
            secondaryStat: 'WIS',
          }
        } else {
          monster.spellcasting.multiclass.enabled = val
        }
        if (val && (!monster.spellcasting.classes || monster.spellcasting.classes.length === 0)) {
          addExtraClass()
        }
        updateSpellcastingSlots(monster.spellcasting.level)
      }
    })

    const multiclassResult = computed(() => {
      if (!monster.spellcasting.multiclass?.enabled) return null
      const classEntries: ClassEntry[] = [
        {
          className: monster.spellcasting.class || 'Wizard',
          subclass: primarySubclass.value,
          level: monster.spellcasting.level || 1,
          stat: monster.spellcasting.stat,
        }
      ]
      for (const extra of extraClasses.value) {
        classEntries.push({
          className: extra.className,
          subclass: extra.subclass,
          level: extra.level,
          stat: extra.stat,
        })
      }
      return calculateMulticlassSpellcasting(
        classEntries,
        monster.stats,
        monster.proficiency
      )
    })

    const toggleMulticlass = (val: boolean) => {
      multiclassEnabled.value = val
    }

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
      if (monster.spellcasting.multiclass?.enabled && extraClasses.value.length > 0) {
        const classEntries: ClassEntry[] = [
          {
            className: monster.spellcasting.class || 'Wizard',
            subclass: primarySubclass.value,
            level,
            stat: monster.spellcasting.stat,
          }
        ]
        for (const extra of extraClasses.value) {
          classEntries.push({
            className: extra.className,
            subclass: extra.subclass,
            level: extra.level,
            stat: extra.stat,
          })
        }
        const multi = calculateMulticlassSpellcasting(
          classEntries,
          monster.stats,
          monster.proficiency
        )
        monster.spellcasting.slots = multi.slots
        if (monster.spellcasting.multiclass) {
          monster.spellcasting.multiclass.secondarySaveDc = multi.secondarySaveDc
          monster.spellcasting.multiclass.secondarySpellAttack = multi.secondarySpellAttack
        }
      } else if (monster.spellcasting.class) {
        monster.spellcasting.slots = getSpellSlotsForClass(monster.spellcasting.class, level)
      }
    }

    const getSpellTag = (name: string) => getSpellTagString(name)

    const getSpellName = (id: string) => {
      const sp = spells.allSpells[id]
      return sp?.name || id
    }

    const getSpellCadence = (spellId: string): string => {
      if (!monster.spellcasting.spellCadenceMap) {
        monster.spellcasting.spellCadenceMap = {}
      }
      return monster.spellcasting.spellCadenceMap[spellId] || 'long_rest'
    }

    const setSpellCadence = (spellId: string, cadence: string) => {
      if (!monster.spellcasting.spellCadenceMap) {
        monster.spellcasting.spellCadenceMap = {}
      }
      monster.spellcasting.spellCadenceMap[spellId] = cadence
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

    const metamagicOptionsList = METAMAGIC_OPTIONS.map(({ name }) => name)

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

    const getLevelCadence = (lvl: number): string => {
      if (!monster.spellcasting.levelCadenceMap) {
        monster.spellcasting.levelCadenceMap = {}
      }
      return monster.spellcasting.levelCadenceMap[lvl] || (lvl === 0 ? 'at_will' : 'long_rest')
    }

    const setLevelCadence = (lvl: number, val: string) => {
      if (!monster.spellcasting.levelCadenceMap) {
        monster.spellcasting.levelCadenceMap = {}
      }
      monster.spellcasting.levelCadenceMap[lvl] = val
    }

    const spellOptionsByLevel = (level: number, className?: string) => {
      let list = spells.allSpellOptions.filter((s) => s.level === level)
      if (className) {
        list = list.filter((s) =>
          s.class.find((c) => c.toLowerCase() === className.toLowerCase())
        )
      }
      return list
    }

    return {
      classFilter,
      monster,
      primarySubclass,
      primarySubclassOptions,
      getSubclassesFor,
      extraClasses,
      addExtraClass,
      removeExtraClass,
      onExtraClassChanged,
      metrics,
      spellLevels,
      classDisplayValue,
      multiclassEnabled,
      multiclassResult,
      toggleMulticlass,
      updateSpellcastingClass,
      updateSpellcastingSlots,
      getSpellTag,
      getSpellTagString,
      getSpellName,
      getSpellCadence,
      setSpellCadence,
      getCadenceLabel,
      removeSpell,
      spellOptionsByLevel,
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
