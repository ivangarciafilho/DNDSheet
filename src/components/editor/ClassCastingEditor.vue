<template>
  <div class="class-casting-editor-panel q-mt-sm">
    <q-card class="bg-grey-10 text-white rounded-borders" style="border: 1px solid rgba(255, 255, 255, 0.12);">
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
            :options="filteredPrimarySubclasses"
            @filter="filterPrimarySubclasses"
            input-debounce="0"
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

          <formula-field
            v-if="monster.spellcasting.save.override"
            path="spellcasting.save.overrideValue"
            label="Save DC"
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
          <q-input v-else :model-value="monster.spellSave" label="Save DC" readonly class="col-6 col-sm-2 q-pa-xs">
            <template #append><q-btn flat dense icon="lock_open" aria-label="Enable manual spell save DC" @click="monster.spellcasting.save.override = true"><q-tooltip>Enable a typed value or live formula.</q-tooltip></q-btn></template>
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

              <div class="col-12 col-sm-3 flex items-center">
                <q-checkbox
                  v-model="monster.spellcasting.splitHighCadence"
                  label="Split Restricted Cadences"
                  dense
                  color="amber-4"
                  class="text-caption text-weight-bold"
                >
                  <q-tooltip class="bg-grey-9 text-caption">Split spells with restricted cadences (Short/Long Rest, Dawn, etc.) into an appended secondary cell.</q-tooltip>
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
                    :options="extraSubclassOptions[clsEntry.className] || getSubclassesFor(clsEntry.className)"
                    @filter="(val, update) => filterExtraSubclasses(clsEntry.className, val, update)"
                    input-debounce="0"
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

                  <!-- Class Exclusive Spells Management -->
                  <div class="col-12 q-mt-xs">
                    <q-expansion-item
                      dense
                      dense-toggle
                      expand-separator
                      icon="menu_book"
                      :label="`${clsEntry.className || 'Class'} Stored Spells (${(clsEntry.spells || []).length})`"
                      class="bg-grey-10 rounded-borders text-caption"
                    >
                      <div class="q-pa-xs">
                        <div class="row q-gutter-x-xs items-center q-mb-xs">
                          <q-select
                            v-model="newSpellForClass[clsEntry.id || cIdx]"
                            :options="spellOptionsForClass(clsEntry.className)"
                            use-input
                            fill-input
                            hide-selected
                            clearable
                            dense
                            outlined
                            dark
                            label="Add Spell to Class"
                            class="col"
                          />
                          <q-btn
                            dense
                            color="purple-4"
                            icon="add"
                            label="Add"
                            size="sm"
                            :disable="!newSpellForClass[clsEntry.id || cIdx]"
                            @click="addSpellToClass(clsEntry, cIdx)"
                          />
                        </div>

                        <div v-if="clsEntry.spells && clsEntry.spells.length" class="column q-gutter-y-xs">
                          <div
                            v-for="(spName, spIdx) in clsEntry.spells"
                            :key="spName + spIdx"
                            class="row items-center justify-between q-pa-xs bg-grey-9 rounded-borders"
                          >
                            <span class="text-weight-medium text-white">{{ spName }}</span>
                            <div class="row items-center q-gutter-x-xs">
                              <q-select
                                :model-value="monster.spellcasting?.spellCadenceMap?.[spName] || 'At Will'"
                                :options="cadenceOptions"
                                dense
                                borderless
                                dark
                                emit-value
                                map-options
                                options-dense
                                style="width: 110px;"
                                @update:model-value="(v) => setSpellCadence(spName, v)"
                              >
                                <q-tooltip class="text-caption">Spell recovery cadence</q-tooltip>
                              </q-select>
                              <q-btn
                                dense
                                flat
                                round
                                size="xs"
                                :color="monster.spellcasting?.bonusActionSpellMap?.[spName] ? 'amber-4' : 'grey-5'"
                                :icon="monster.spellcasting?.bonusActionSpellMap?.[spName] ? 'flash_on' : 'flash_off'"
                                @click="toggleSpellBonusAction(spName)"
                              >
                                <q-tooltip class="dnd-tip">
                                  {{ monster.spellcasting?.bonusActionSpellMap?.[spName] ? 'Cast as Bonus Action' : 'Cast as Action' }}
                                </q-tooltip>
                              </q-btn>
                              <q-btn
                                flat
                                round
                                dense
                                size="xs"
                                icon="close"
                                color="negative"
                                @click="removeSpellFromClass(clsEntry, spIdx)"
                              />
                            </div>
                          </div>
                        </div>
                        <div v-else class="text-grey-5 text-center text-xs q-pa-xs">
                          No exclusive spells stored yet for this class. Select a spell above to assign.
                        </div>
                      </div>
                    </q-expansion-item>
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
                <formula-field path="spellcasting.preparedCountOverride" label="Prepared Spells Count">
                  <template #after><q-btn flat dense icon="restart_alt" aria-label="Use automatic prepared spell count" @click="resetPreparedCount"><q-tooltip>Use the class calculation.</q-tooltip></q-btn></template>
                </formula-field>
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
                <formula-field path="spellcasting.cantripSwitchCount" label="Count" />
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
                  <formula-field path="spellcasting.metamagic.sorceryPoints" label="Sorcery Points" />
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
                    emit-value
                    map-options
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
                  :color="monster.spellcasting.alwaysAvailableOnly ? 'purple-6' : 'grey-8'"
                  :label="monster.spellcasting.alwaysAvailableOnly ? 'Always Ready: ON' : 'All Cadences'"
                  @click="monster.spellcasting.alwaysAvailableOnly = !monster.spellcasting.alwaysAvailableOnly"
                >
                  <q-tooltip class="dnd-tip" max-width="260px">
                    Filter out spells bound to limited cadences (Short Rest, Long Rest, Dawn, Dusk, Ritual, Downtime) to show always-ready spells only.
                  </q-tooltip>
                </q-btn>
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
                            @update:model-value="(val: string | number | null) => {
                              const nextSlots = [...(monster.spellcasting.slots || [0,0,0,0,0,0,0,0,0])]
                              nextSlots[level - 1] = validateNumber(val, 0)
                              monster.spellcasting.slots = nextSlots
                            }"
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
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/runtime-core'
import { useClasses } from 'src/data/CLASS'
import { useRechargeTimes } from 'src/data/RECHARGE_TIME'
import { useMonsterStore } from 'src/stores/monster-store'
import { useEditorStore } from 'src/stores/editor-store'
import { useSpellsStore, SpellOption } from 'src/stores/spells-store'
import { ref, computed, watch } from 'vue'
import MonsterTextEditor from './MonsterTextEditor.vue'
import FormulaField from '../kit/FormulaField.vue'
import { entryBindingPrefix, withoutEntryBindings } from 'src/core/domain/entry-bindings'
import { useSpellLevels } from '../spell/useSpellLevels'
import { validateNumber } from './numberInput'
import {
  calculateSpellcastingMetrics,
  calculateMulticlassSpellcasting,
  getDefaultStatForClass,
  getSpellSlotsForClass,
  SRD_SUBCLASSES_BY_CLASS,
  getSubclassesForClass,
  ClassEntry
} from 'src/core/usecases/AutoSyncSpellcasting'
import { getSpellMetadata, getSpellTagString } from 'src/core/domain/spell-metadata'
import { statModifier } from 'src/core/domain/math-utils'
import { CADENCE_OPTIONS, RESOURCE_REFRESH_OPTIONS } from 'src/core/domain/catalogs/cadence'
import { METAMAGIC_OPTIONS, metamagicCost } from 'src/core/domain/catalogs/metamagic'
import { v4 as uuidv4 } from 'uuid'

export default defineComponent({
  name: 'ClassCastingEditor',
  components: { MonsterTextEditor, FormulaField },
  setup() {
    const classFilter = ref(false)

    const monster = useMonsterStore()
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
        const entry = monster.spellcasting.classes[idx]
        if (!entry) return
        monster.$patch(state => {
          state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('spellcasting.classes', entry.id))
          state.spellcasting.classes.splice(idx, 1)
        })
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

    const newSpellForClass = ref<Record<string, any>>({})
    const spellOptionsForClass = (className?: string) => {
      if (!className) return spells.allSpellOptions
      const filtered = spells.allSpellOptions.filter((s) =>
        s.class && s.class.some((c: string) => c.toLowerCase() === className.toLowerCase())
      )
      return filtered.length > 0 ? filtered : spells.allSpellOptions
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
      toggleMulticlass,
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
