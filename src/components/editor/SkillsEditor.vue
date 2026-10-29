<template>
  <q-expansion-item
    expand-separator
    icon="fa-solid fa-dice-d20"
    :label="$t('editor.skills.label')"
    :caption="$t('editor.skills.caption')"
  >
    <q-card class="q-pa-xs">
      <!-- Section 1: Skill Proficiencies -->
      <div class="q-pa-xs">
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-primary">
            Skill Proficiencies
          </div>
          <!-- Dropdown auto-adds on selection (no add button, clicking outside does not select) -->
          <div style="min-width: 220px; max-width: 320px;">
            <q-select
              dense
              outlined
              :model-value="null"
              :options="availableSkills"
              emit-value
              map-options
              label="Add Skill..."
              placeholder="Select skill to add"
              clearable
              @update:model-value="onSkillSelected"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps" dense>
                  <q-item-section avatar style="min-width: 28px; padding-right: 8px;">
                    <q-icon :name="scope.opt.icon || 'fa-solid fa-dice-d20'" :color="scope.opt.color || 'primary'" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                  <q-item-section side v-if="scope.opt.category">
                    <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>

        <div v-if="skills.length === 0" class="text-caption text-grey-5 q-pa-sm text-center">
          No individual skills added yet. Select a skill above to add it.
        </div>

        <div class="row q-col-gutter-xs">
          <div
            v-for="(skill, idx) in skills"
            :key="skill.key"
            class="col-12 col-md-6 q-pa-xs"
          >
            <q-card
              flat
              bordered
              class="q-pa-xs rounded-borders"
              style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12);"
            >
              <!-- Row 1: Name, Badge, and Action Buttons (Swap & Delete) -->
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center q-gutter-x-xs">
                  <span class="text-subtitle2 text-weight-bold">
                    {{ $t(`skill.${skill.key}`) }}
                  </span>
                  <q-badge
                    :color="skill.expertise ? 'purple-6' : (skill.proficient ? 'positive' : 'grey-8')"
                    class="text-weight-bold"
                  >
                    ({{ 10 + bonusForSkill(monster, skill) + (skill.advantage ? 5 : 0) - (skill.disadvantage ? 5 : 0) }}/{{ formatModifier(bonusForSkill(monster, skill)) }})
                  </q-badge>
                </div>

                <div class="row items-center q-gutter-x-xs">
                  <swap-buttons field="skills" :idx="idx" flat dense />
                  <q-btn
                    dense
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    flat
                    @click="() => deleteSkill(skill.key)"
                  >
                    <q-tooltip class="text-body2">{{ $t('editor.delete') }}</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <!-- Row 2: Status Chips & Modifier Toggles (Wrapped with Clean Breathing Space) -->
              <div class="row items-center q-gutter-xs q-mb-xs flex-wrap">
                <q-btn
                  dense
                  no-caps
                  size="sm"
                  class="q-px-xs"
                  :color="skill.bonusAction ? 'amber-9' : 'blue-grey-8'"
                  :label="skill.bonusAction ? 'Bonus Action' : 'Action'"
                  @click="skill.bonusAction = !skill.bonusAction"
                >
                  <q-tooltip class="text-body2">Toggle Action vs Bonus Action execution</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="skill.proficient ? 'positive' : 'grey-8'"
                  icon="keyboard_arrow_up"
                  @click="skill.proficient = !skill.proficient"
                >
                  <q-tooltip class="text-body2">{{ $t('editor.proficient') }}</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="skill.expertise ? 'purple-6' : 'grey-8'"
                  icon="keyboard_double_arrow_up"
                  @click="skill.expertise = !skill.expertise"
                >
                  <q-tooltip class="text-body2">{{ $t('editor.expertise') }}</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="skill.override ? 'warning' : 'grey-8'"
                  icon="handyman"
                  @click="skill.override = !skill.override"
                >
                  <q-tooltip class="text-body2">{{ $t('editor.override') }}</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="skill.advantage ? 'positive' : 'grey-8'"
                  label="⏫"
                  @click="toggleSkillAdvantage(skill)"
                >
                  <q-tooltip class="text-body2">Advantage</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="skill.disadvantage ? 'negative' : 'grey-8'"
                  label="⏬"
                  @click="toggleSkillDisadvantage(skill)"
                >
                  <q-tooltip class="text-body2">Disadvantage</q-tooltip>
                </q-btn>
              </div>

              <div class="row q-col-gutter-xs items-center">
                <div v-if="skill.override" class="col-4">
                  <q-select
                    dense
                    outlined
                    :model-value="skill.overrideValue ?? 0"
                    :options="getSkillOverrideOptions(skill)"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    label="Override"
                    new-value-mode="add-unique"
                    @input-value="(val) => (skill.overrideValue = validateNumber(val, 0))"
                    @update:model-value="(val) => (skill.overrideValue = validateNumber(val, 0))"
                  />
                </div>
                <div :class="skill.override ? 'col-8' : 'col-12'">
                  <q-input
                    dense
                    outlined
                    :model-value="skill.condition || skill.conditional || ''"
                    label="Condition / Trigger"
                    placeholder="e.g. in darkness, vs undead"
                    clearable
                    @update:model-value="(val) => { skill.condition = `${val ?? ''}`; skill.conditional = `${val ?? ''}` }"
                  />
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </div>

      <q-separator class="q-my-sm" />

      <!-- Section 2: Tool Proficiencies Module -->
      <div class="q-pa-xs">
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-secondary">
            🧰 Tool Proficiencies
          </div>
          <!-- Tool dropdown auto-adds on selection (no add button) -->
          <div style="min-width: 220px; max-width: 320px;">
            <q-select
              dense
              outlined
              :model-value="null"
              :options="toolOptions"
              emit-value
              map-options
              use-input
              new-value-mode="add-unique"
              label="Add Tool..."
              placeholder="Select or type tool"
              clearable
              @update:model-value="onToolSelected"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps" dense>
                  <q-item-section avatar style="min-width: 28px; padding-right: 8px;">
                    <q-icon :name="scope.opt.icon || 'fa-solid fa-screwdriver-wrench'" :color="scope.opt.color || 'secondary'" size="xs" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label || scope.opt }}</q-item-label>
                  </q-item-section>
                  <q-item-section side v-if="scope.opt.category">
                    <q-badge :color="scope.opt.color || 'grey-7'" outline class="text-caption">{{ scope.opt.category }}</q-badge>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>

        <div v-if="!monster.tools || monster.tools.length === 0" class="text-caption text-grey-5 q-pa-sm text-center">
          No tool proficiencies configured. Select or type a tool above to add it.
        </div>

        <div v-else class="row q-col-gutter-xs">
          <div
            v-for="(tool, idx) in monster.tools"
            :key="tool.id"
            class="col-12 col-md-6 q-pa-xs"
          >
            <q-card
              flat
              bordered
              class="q-pa-xs rounded-borders"
              style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.12);"
            >
              <!-- Row 1: Tool Name, Badge, and Action Buttons (Swap & Delete) -->
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center q-gutter-x-xs">
                  <span class="text-subtitle2 text-weight-bold">
                    {{ tool.name }}
                  </span>
                  <q-badge
                    :color="tool.expertise ? 'purple-6' : (tool.proficient ? 'positive' : 'grey-8')"
                    class="text-weight-bold"
                  >
                    ({{ 10 + calculateToolBonus(tool) + (tool.advantage ? 5 : 0) - (tool.disadvantage ? 5 : 0) }}/{{ formatModifier(calculateToolBonus(tool)) }})
                  </q-badge>
                </div>

                <div class="row items-center q-gutter-x-xs">
                  <swap-buttons field="tools" :idx="idx" flat dense />
                  <q-btn
                    dense
                    round
                    size="sm"
                    color="negative"
                    icon="delete"
                    flat
                    @click="() => monster.deleteTool(tool.id)"
                  >
                    <q-tooltip class="text-body2">{{ $t('editor.delete') }}</q-tooltip>
                  </q-btn>
                </div>
              </div>

              <!-- Row 2: Status Chips & Modifier Toggles (Wrapped with Clean Breathing Space) -->
              <div class="row items-center q-gutter-xs q-mb-xs flex-wrap">
                <q-btn
                  dense
                  no-caps
                  size="sm"
                  class="q-px-xs"
                  :color="tool.bonusAction ? 'amber-9' : 'blue-grey-8'"
                  :label="tool.bonusAction ? 'Bonus Action' : 'Action'"
                  @click="tool.bonusAction = !tool.bonusAction"
                >
                  <q-tooltip class="text-body2">Toggle Action vs Bonus Action execution</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="tool.proficient ? 'positive' : 'grey-8'"
                  icon="keyboard_arrow_up"
                  @click="tool.proficient = !tool.proficient"
                >
                  <q-tooltip class="text-body2">{{ $t('editor.proficient') }}</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="tool.expertise ? 'purple-6' : 'grey-8'"
                  icon="keyboard_double_arrow_up"
                  @click="tool.expertise = !tool.expertise"
                >
                  <q-tooltip class="text-body2">{{ $t('editor.expertise') }}</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="tool.override ? 'warning' : 'grey-8'"
                  icon="handyman"
                  @click="tool.override = !tool.override"
                >
                  <q-tooltip class="text-body2">{{ $t('editor.override') }}</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="tool.advantage ? 'positive' : 'grey-8'"
                  label="⏫"
                  @click="toggleToolAdvantage(tool)"
                >
                  <q-tooltip class="text-body2">Advantage</q-tooltip>
                </q-btn>
                <q-btn
                  dense
                  round
                  size="sm"
                  :color="tool.disadvantage ? 'negative' : 'grey-8'"
                  label="⏬"
                  @click="toggleToolDisadvantage(tool)"
                >
                  <q-tooltip class="text-body2">Disadvantage</q-tooltip>
                </q-btn>
              </div>

              <div class="row q-col-gutter-xs items-center">
                <div class="col-3">
                  <q-select
                    dense
                    outlined
                    v-model="tool.stat"
                    :options="['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA']"
                    label="Stat"
                  />
                </div>
                <div v-if="tool.override" class="col-3">
                  <q-select
                    dense
                    outlined
                    :model-value="tool.overrideValue ?? 0"
                    :options="getToolOverrideOptions(tool)"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    label="Mod"
                    new-value-mode="add-unique"
                    @input-value="(val) => (tool.overrideValue = validateNumber(val, 0))"
                    @update:model-value="(val) => (tool.overrideValue = validateNumber(val, 0))"
                  />
                </div>
                <div :class="tool.override ? 'col-6' : 'col-9'">
                  <q-input
                    dense
                    outlined
                    v-model="tool.condition"
                    label="Condition / Trigger"
                    placeholder="e.g. traps, locks only"
                    clearable
                  />
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </div>

      <q-separator class="q-my-sm" />

      <!-- Section 3: Action-Oriented Passive & Active Scope Checks (Search, Study, Hide, Influence) -->
      <div class="q-pa-xs">
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-amber-8">
            🎯 Action-Oriented Passive &amp; Active Scope Checks (Search, Study, Influence, Hide)
          </div>
          <div class="text-caption text-grey-5">
            Consolidated (Passive/Active) checks &amp; Action / Bonus Action scope routing
          </div>
        </div>

        <div class="row q-col-gutter-xs">
          <!-- SEARCH: Perception, Investigation, Insight, Survival -->
          <div class="col-12 col-md-6">
            <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-weight-bold text-primary">🔍 Search Checks</span>
                <q-btn-toggle
                  v-model="passives.searchActionType"
                  dense
                  no-caps
                  rounded
                  unelevated
                  size="xs"
                  toggle-color="primary"
                  color="grey-9"
                  text-color="grey-4"
                  :options="[
                    { label: 'Action', value: 'Action' },
                    { label: 'Bonus Action', value: 'Bonus Action' },
                  ]"
                />
              </div>
              <div v-for="pKey in ['perception', 'investigation', 'insight', 'survival']" :key="pKey" class="row items-center q-col-gutter-xs q-mb-xs">
                <div class="col-3 text-caption text-capitalize">{{ pKey }}</div>
                <div class="col-3">
                  <q-btn-Group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="!getPassive(pKey).override ? 'positive' : 'grey-8'"
                      label="Auto"
                      @click="getPassive(pKey).override = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).override ? 'warning' : 'grey-8'"
                      label="Ovr"
                      @click="getPassive(pKey).override = true"
                    />
                  </q-btn-Group>
                </div>
                <div class="col-2">
                  <q-btn-Group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'"
                      label="▲▲"
                      @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'"
                      label="▼▼"
                      @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                    />
                  </q-btn-Group>
                </div>
                <div class="col-4" v-if="getPassive(pKey).override">
                  <q-select
                    dense
                    outlined
                    :model-value="getPassive(pKey).overrideValue ?? 10"
                    :options="getPassiveOverrideOptions(pKey)"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    label="Score"
                    new-value-mode="add-unique"
                    @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                    @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                  />
                </div>
                <div class="col-4" v-else>
                  <q-input
                    dense
                    outlined
                    v-model="getPassive(pKey).condition"
                    placeholder="Qualifier"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- STUDY: Arcana, History, Investigation, Nature, Religion -->
          <div class="col-12 col-md-6">
            <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-weight-bold text-info">📖 Study Checks</span>
                <q-btn-toggle
                  v-model="passives.studyActionType"
                  dense
                  no-caps
                  rounded
                  unelevated
                  size="xs"
                  toggle-color="info"
                  color="grey-9"
                  text-color="grey-4"
                  :options="[
                    { label: 'Action', value: 'Action' },
                    { label: 'Bonus Action', value: 'Bonus Action' },
                  ]"
                />
              </div>
              <div v-for="pKey in ['arcana', 'history', 'investigation', 'nature', 'religion']" :key="`study-${pKey}`" class="row items-center q-col-gutter-xs q-mb-xs">
                <div class="col-3 text-caption text-capitalize">{{ pKey }}</div>
                <div class="col-3">
                  <q-btn-Group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="!getPassive(pKey).override ? 'positive' : 'grey-8'"
                      label="Auto"
                      @click="getPassive(pKey).override = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).override ? 'warning' : 'grey-8'"
                      label="Ovr"
                      @click="getPassive(pKey).override = true"
                    />
                  </q-btn-Group>
                </div>
                <div class="col-2">
                  <q-btn-Group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'"
                      label="▲▲"
                      @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'"
                      label="▼▼"
                      @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                    />
                  </q-btn-Group>
                </div>
                <div class="col-4" v-if="getPassive(pKey).override">
                  <q-select
                    dense
                    outlined
                    :model-value="getPassive(pKey).overrideValue ?? 10"
                    :options="getPassiveOverrideOptions(pKey)"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    label="Score"
                    new-value-mode="add-unique"
                    @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                    @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                  />
                </div>
                <div class="col-4" v-else>
                  <q-input
                    dense
                    outlined
                    v-model="getPassive(pKey).condition"
                    placeholder="Qualifier"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- INFLUENCE: Deception, Intimidation, Performance, Persuasion, Animal Handling -->
          <div class="col-12 col-md-6">
            <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-weight-bold text-amber-8">🗣️ Influence Checks</span>
                <q-btn-toggle
                  v-model="passives.influenceActionType"
                  dense
                  no-caps
                  rounded
                  unelevated
                  size="xs"
                  toggle-color="amber-9"
                  color="grey-9"
                  text-color="grey-4"
                  :options="[
                    { label: 'Action', value: 'Action' },
                    { label: 'Bonus Action', value: 'Bonus Action' },
                  ]"
                />
              </div>
              <div v-for="pKey in ['deception', 'intimidation', 'performance', 'persuasion', 'animalHandling']" :key="pKey" class="row items-center q-col-gutter-xs q-mb-xs">
                <div class="col-3 text-caption">{{ pKey === 'animalHandling' ? 'Animal Hdl.' : pKey.charAt(0).toUpperCase() + pKey.slice(1) }}</div>
                <div class="col-3">
                  <q-btn-Group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="!getPassive(pKey).override ? 'positive' : 'grey-8'"
                      label="Auto"
                      @click="getPassive(pKey).override = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).override ? 'warning' : 'grey-8'"
                      label="Ovr"
                      @click="getPassive(pKey).override = true"
                    />
                  </q-btn-Group>
                </div>
                <div class="col-2">
                  <q-btn-Group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'"
                      label="▲▲"
                      @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'"
                      label="▼▼"
                      @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                    />
                  </q-btn-Group>
                </div>
                <div class="col-4" v-if="getPassive(pKey).override">
                  <q-select
                    dense
                    outlined
                    :model-value="getPassive(pKey).overrideValue ?? 10"
                    :options="getPassiveOverrideOptions(pKey)"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    label="Score"
                    new-value-mode="add-unique"
                    @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                    @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                  />
                </div>
                <div class="col-4" v-else>
                  <q-input
                    dense
                    outlined
                    v-model="getPassive(pKey).condition"
                    placeholder="Qualifier"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- HIDE: Stealth -->
          <div class="col-12 col-md-6">
            <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-caption text-weight-bold text-deep-purple-4">🥷 Hide Checks</span>
                <q-btn-toggle
                  v-model="passives.hideActionType"
                  dense
                  no-caps
                  rounded
                  unelevated
                  size="xs"
                  toggle-color="deep-purple-6"
                  color="grey-9"
                  text-color="grey-4"
                  :options="[
                    { label: 'Action', value: 'Action' },
                    { label: 'Bonus Action', value: 'Bonus Action' },
                  ]"
                />
              </div>
              <div class="row items-center q-col-gutter-xs q-mb-xs">
                <div class="col-3 text-caption">Stealth</div>
                <div class="col-3">
                  <q-btn-Group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="!getPassive('stealth').override ? 'positive' : 'grey-8'"
                      label="Auto"
                      @click="getPassive('stealth').override = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive('stealth').override ? 'warning' : 'grey-8'"
                      label="Ovr"
                      @click="getPassive('stealth').override = true"
                    />
                  </q-btn-Group>
                </div>
                <div class="col-2">
                  <q-btn-Group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive('stealth').advantage ? 'positive' : 'grey-9'"
                      label="▲▲"
                      @click="getPassive('stealth').advantage = !getPassive('stealth').advantage; if (getPassive('stealth').advantage) getPassive('stealth').disadvantage = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive('stealth').disadvantage ? 'negative' : 'grey-9'"
                      label="▼▼"
                      @click="getPassive('stealth').disadvantage = !getPassive('stealth').disadvantage; if (getPassive('stealth').disadvantage) getPassive('stealth').advantage = false"
                    />
                  </q-btn-Group>
                </div>
                <div class="col-4" v-if="getPassive('stealth').override">
                  <q-select
                    dense
                    outlined
                    :model-value="getPassive('stealth').overrideValue ?? 10"
                    :options="getPassiveOverrideOptions('stealth')"
                    emit-value
                    map-options
                    use-input
                    fill-input
                    hide-selected
                    label="Score"
                    new-value-mode="add-unique"
                    @input-value="(val) => (getPassive('stealth').overrideValue = validateNumber(val, 10))"
                    @update:model-value="(val) => (getPassive('stealth').overrideValue = validateNumber(val, 10))"
                  />
                </div>
                <div class="col-4" v-else>
                  <q-input
                    dense
                    outlined
                    v-model="getPassive('stealth').condition"
                    placeholder="Qualifier"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { SKILL } from 'src/data/SKILL'
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, defineComponent, watch } from 'vue'
import { bonusForSkill, statModifier } from '../rendering/mathRendering'
import { validateNumber } from './numberInput'
import { MonsterSkill, MonsterToolProficiency } from '../models'
import SwapButtons from './widgets/SwapButtons.vue'

const STANDARD_5E_TOOLS: Array<{ label: string; value: string; category: string; color: string; icon: string }> = [
  // Kits & Specialist Tools
  { label: 'Disguise Kit', value: 'Disguise Kit', category: 'Specialist Kit', color: 'deep-purple-6', icon: 'fa-solid fa-masks-theater' },
  { label: 'Forgery Kit', value: 'Forgery Kit', category: 'Specialist Kit', color: 'deep-purple-6', icon: 'fa-solid fa-feather-pointed' },
  { label: 'Herbalism Kit', value: 'Herbalism Kit', category: 'Specialist Kit', color: 'green-7', icon: 'fa-solid fa-leaf' },
  { label: "Navigator's Tools", value: "Navigator's Tools", category: 'Specialist Kit', color: 'cyan-7', icon: 'fa-solid fa-compass' },
  { label: "Poisoner's Kit", value: "Poisoner's Kit", category: 'Specialist Kit', color: 'purple-7', icon: 'fa-solid fa-skull-crossbones' },
  { label: "Thieves' Tools", value: "Thieves' Tools", category: 'Specialist Kit', color: 'amber-8', icon: 'fa-solid fa-key' },
  // Artisan's Tools
  { label: "Alchemist's Supplies", value: "Alchemist's Supplies", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-flask' },
  { label: "Brewer's Supplies", value: "Brewer's Supplies", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-beer-mug-empty' },
  { label: "Calligrapher's Supplies", value: "Calligrapher's Supplies", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-pen-nib' },
  { label: "Carpenter's Tools", value: "Carpenter's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-hammer' },
  { label: "Cartographer's Tools", value: "Cartographer's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-map' },
  { label: "Cobbler's Tools", value: "Cobbler's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-shoe-prints' },
  { label: "Cook's Utensils", value: "Cook's Utensils", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-utensils' },
  { label: "Glassblower's Tools", value: "Glassblower's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-wine-glass' },
  { label: "Jeweler's Tools", value: "Jeweler's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-gem' },
  { label: "Leatherworker's Tools", value: "Leatherworker's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-vest' },
  { label: "Mason's Tools", value: "Mason's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-trowel-bricks' },
  { label: "Painter's Supplies", value: "Painter's Supplies", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-palette' },
  { label: "Potter's Tools", value: "Potter's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-jar' },
  { label: "Smith's Tools", value: "Smith's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-gavel' },
  { label: "Tinker's Tools", value: "Tinker's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-gears' },
  { label: "Weaver's Tools", value: "Weaver's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-shirt' },
  { label: "Woodcarver's Tools", value: "Woodcarver's Tools", category: "Artisan's Tools", color: 'teal-6', icon: 'fa-solid fa-tree' },
  // Musical Instruments
  { label: 'Bagpipes', value: 'Bagpipes', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-music' },
  { label: 'Drum', value: 'Drum', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-drum' },
  { label: 'Dulcimer', value: 'Dulcimer', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-music' },
  { label: 'Flute', value: 'Flute', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-music' },
  { label: 'Horn', value: 'Horn', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-bullhorn' },
  { label: 'Lute', value: 'Lute', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-guitar' },
  { label: 'Lyre', value: 'Lyre', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-music' },
  { label: 'Pan Flute', value: 'Pan Flute', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-music' },
  { label: 'Shawm', value: 'Shawm', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-music' },
  { label: 'Viol', value: 'Viol', category: 'Instrument', color: 'pink-6', icon: 'fa-solid fa-music' },
  // Gaming Sets
  { label: 'Dice Set', value: 'Dice Set', category: 'Gaming Set', color: 'indigo-6', icon: 'fa-solid fa-dice' },
  { label: 'Dragonchess Set', value: 'Dragonchess Set', category: 'Gaming Set', color: 'indigo-6', icon: 'fa-solid fa-chess' },
  { label: 'Playing Card Set', value: 'Playing Card Set', category: 'Gaming Set', color: 'indigo-6', icon: 'fa-solid fa-diamond' },
  { label: 'Three-Dragon Ante Set', value: 'Three-Dragon Ante Set', category: 'Gaming Set', color: 'indigo-6', icon: 'fa-solid fa-dragon' },
  // Vehicles
  { label: 'Vehicles (Air)', value: 'Vehicles (Air)', category: 'Vehicle', color: 'blue-grey-6', icon: 'fa-solid fa-wind' },
  { label: 'Vehicles (Land)', value: 'Vehicles (Land)', category: 'Vehicle', color: 'blue-grey-6', icon: 'fa-solid fa-horse' },
  { label: 'Vehicles (Space)', value: 'Vehicles (Space)', category: 'Vehicle', color: 'blue-grey-6', icon: 'fa-solid fa-shuttle-space' },
  { label: 'Vehicles (Water)', value: 'Vehicles (Water)', category: 'Vehicle', color: 'blue-grey-6', icon: 'fa-solid fa-ship' },
]

const SKILL_SCOPE_META: Record<string, { category: string; color: string; icon: string; order: number }> = {
  PERCEPTION: { category: 'Search (WIS)', color: 'primary', icon: 'fa-solid fa-magnifying-glass', order: 1 },
  INVESTIGATION: { category: 'Search / Study (INT)', color: 'primary', icon: 'fa-solid fa-magnifying-glass-chart', order: 1 },
  INSIGHT: { category: 'Search / Influence (WIS)', color: 'primary', icon: 'fa-solid fa-eye', order: 1 },
  SURVIVAL: { category: 'Search (WIS)', color: 'primary', icon: 'fa-solid fa-compass', order: 1 },
  ARCANA: { category: 'Study (INT)', color: 'info', icon: 'fa-solid fa-hat-wizard', order: 2 },
  HISTORY: { category: 'Study (INT)', color: 'info', icon: 'fa-solid fa-scroll', order: 2 },
  NATURE: { category: 'Study (INT)', color: 'info', icon: 'fa-solid fa-leaf', order: 2 },
  RELIGION: { category: 'Study (INT)', color: 'info', icon: 'fa-solid fa-ankh', order: 2 },
  DECEPTION: { category: 'Influence (CHA)', color: 'amber-8', icon: 'fa-solid fa-masks-theater', order: 3 },
  INTIMIDATION: { category: 'Influence (CHA)', color: 'amber-8', icon: 'fa-solid fa-skull', order: 3 },
  PERFORMANCE: { category: 'Influence (CHA)', color: 'amber-8', icon: 'fa-solid fa-music', order: 3 },
  PERSUASION: { category: 'Influence (CHA)', color: 'amber-8', icon: 'fa-solid fa-comments', order: 3 },
  ANIMAL_HANDLING: { category: 'Influence / Skills (WIS)', color: 'amber-8', icon: 'fa-solid fa-paw', order: 3 },
  STEALTH: { category: 'Hide (DEX)', color: 'deep-purple-5', icon: 'fa-solid fa-user-ninja', order: 4 },
  ACROBATICS: { category: 'Skills (DEX)', color: 'teal-6', icon: 'fa-solid fa-person-running', order: 5 },
  ATHLETICS: { category: 'Skills (STR)', color: 'teal-6', icon: 'fa-solid fa-dumbbell', order: 5 },
  MEDICINE: { category: 'Skills (WIS)', color: 'teal-6', icon: 'fa-solid fa-kit-medical', order: 5 },
  SLEIGHT_OF_HAND: { category: 'Skills (DEX)', color: 'teal-6', icon: 'fa-solid fa-hand-sparkles', order: 5 },
}

export default defineComponent({
  name: 'SkillsEditor',
  components: { SwapButtons },
  setup() {
    const monster = useMonsterStore()

    const availableSkills = computed(() => {
      return Object.keys(SKILL)
        .map((key) => {
          const meta = SKILL_SCOPE_META[key] || { category: 'Skills', color: 'teal-6', icon: 'fa-solid fa-dice-d20', order: 5 }
          return {
            value: key,
            label: SKILL[key].label,
            category: meta.category,
            color: meta.color,
            icon: meta.icon,
            order: meta.order,
          }
        })
        .sort((a, b) => (a.order - b.order) || a.label.localeCompare(b.label))
        .filter(
          (skill) => monster.skills.find((s) => s.key === skill.value) == null
        )
    })

    const availableTools = computed(() => {
      const existing = new Set((monster.tools || []).map((t) => t.name.toLowerCase().trim()))
      return STANDARD_5E_TOOLS
        .filter((tool) => !existing.has(tool.value.toLowerCase().trim()))
    })

    const onSkillSelected = (skillKey: string | null) => {
      if (!skillKey) return
      monster.addSkill(skillKey)
    }

    const onToolSelected = (toolInput: string | { value?: string; label?: string } | null) => {
      if (!toolInput) return
      const rawName = typeof toolInput === 'string' ? toolInput : (toolInput.value || toolInput.label || '')
      if (!rawName.trim()) return
      const clean = rawName.trim()
      if ((monster.tools || []).some((t) => t.name.toLowerCase().trim() === clean.toLowerCase())) {
        return
      }
      const defaultStat = clean.toLowerCase().includes('thieves') ? 'DEX'
        : clean.toLowerCase().includes('navigat') || clean.toLowerCase().includes('herbal') ? 'WIS'
        : clean.toLowerCase().includes('alchem') || clean.toLowerCase().includes('forger') ? 'INT'
        : clean.toLowerCase().includes('smith') || clean.toLowerCase().includes('mason') ? 'STR'
        : 'DEX'
      monster.addTool(clean, defaultStat)
    }

    const ensurePassives = () => {
      if (!monster.passives) {
        monster.passives = {
          hideActionType: 'Bonus Action',
          searchActionType: 'Action',
          studyActionType: 'Action',
          influenceActionType: 'Action',
          perception: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          investigation: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          insight: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          survival: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          arcana: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          history: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          nature: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          religion: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          stealth: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          deception: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          intimidation: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          performance: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          persuasion: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
          animalHandling: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        }
      }
      if (!monster.passives.influenceActionType) {
        monster.passives.influenceActionType = 'Action'
      }
      return monster.passives
    }

    const passives = computed(() => ensurePassives())

    // Two-way synchronization between monster.passives and monster.actionOrientedPassives
    watch(
      () => monster.passives,
      (p) => {
        if (!p) return
        if (!monster.actionOrientedPassives) {
          monster.actionOrientedPassives = {
            bonusActionSearch: false,
            bonusActionStudy: false,
            bonusActionHide: false,
            bonusActionInfluence: false,
            search: { perception: true, investigation: false, survival: false },
            study: { arcana: false, history: false, nature: false, religion: false },
            hide: { stealth: false },
            influence: { animalHandling: false, insight: false, deception: false, intimidation: false, persuasion: false },
            conditions: {},
          }
        }
        const aop = monster.actionOrientedPassives
        aop.bonusActionSearch = p.searchActionType === 'Bonus Action'
        aop.bonusActionStudy = p.studyActionType === 'Bonus Action'
        aop.bonusActionHide = p.hideActionType === 'Bonus Action'
        aop.bonusActionInfluence = p.influenceActionType === 'Bonus Action'

        if (!aop.conditions) aop.conditions = {}
        for (const key of Object.keys(p)) {
          const item = (p as Record<string, unknown>)[key]
          if (item && typeof item === 'object' && 'condition' in item) {
            aop.conditions[key.toLowerCase()] = ((item as { condition?: string }).condition || '').trim()
          }
        }
      },
      { deep: true, immediate: true }
    )

    const getPassive = (key: string) => {
      const p = passives.value as unknown as Record<string, { override: boolean; overrideValue: number | null; advantage: boolean; disadvantage: boolean; condition: string }>
      if (!p[key]) {
        p[key] = { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' }
      }
      return p[key]
    }

    const formatModifier = (val: number): string => {
      return val >= 0 ? `+${val}` : `${val}`
    }

    const calculateToolBonus = (t: MonsterToolProficiency): number => {
      if (t.override) return t.overrideValue ?? 0
      const statMod = statModifier(monster.stats[t.stat] ?? 10)
      return statMod + (t.proficient ? monster.proficiency : 0) + (t.expertise ? monster.proficiency : 0)
    }

    const toggleSkillAdvantage = (s: MonsterSkill) => {
      s.advantage = !s.advantage
      if (s.advantage) s.disadvantage = false
    }

    const toggleSkillDisadvantage = (s: MonsterSkill) => {
      s.disadvantage = !s.disadvantage
      if (s.disadvantage) s.advantage = false
    }

    const toggleToolAdvantage = (t: MonsterToolProficiency) => {
      t.advantage = !t.advantage
      if (t.advantage) t.disadvantage = false
    }

    const toggleToolDisadvantage = (t: MonsterToolProficiency) => {
      t.disadvantage = !t.disadvantage
      if (t.disadvantage) t.advantage = false
    }

    const getSkillOverrideOptions = (s: MonsterSkill) => {
      const pb = monster.proficiency ?? 2
      const statName = SKILL[s.key as keyof typeof SKILL] || 'DEX'
      const statVal = monster.stats[statName as keyof typeof monster.stats] ?? 10
      const mod = Math.floor((statVal - 10) / 2)
      return [
        { label: `Mod + PB (${mod + pb >= 0 ? '+' : ''}${mod + pb})`, value: mod + pb },
        { label: `Mod + 2x PB (${mod + pb * 2 >= 0 ? '+' : ''}${mod + pb * 2})`, value: mod + pb * 2 },
        { label: `Passive 10 + Mod + PB (${10 + mod + pb})`, value: 10 + mod + pb },
        { label: `Passive 10 + Mod + 2x PB (${10 + mod + pb * 2})`, value: 10 + mod + pb * 2 },
        { label: `+PB (${pb >= 0 ? '+' : ''}${pb})`, value: pb },
        { label: `+2x PB (${pb * 2 >= 0 ? '+' : ''}${pb * 2})`, value: pb * 2 },
        { label: `Ability Mod (${mod >= 0 ? '+' : ''}${mod})`, value: mod },
      ]
    }

    const getToolOverrideOptions = (t: MonsterToolProficiency) => {
      const pb = monster.proficiency ?? 2
      const statVal = monster.stats[t.stat as keyof typeof monster.stats] ?? 10
      const mod = Math.floor((statVal - 10) / 2)
      return [
        { label: `Mod + PB (${mod + pb >= 0 ? '+' : ''}${mod + pb})`, value: mod + pb },
        { label: `Mod + 2x PB (${mod + pb * 2 >= 0 ? '+' : ''}${mod + pb * 2})`, value: mod + pb * 2 },
        { label: `+PB (${pb >= 0 ? '+' : ''}${pb})`, value: pb },
        { label: `+2x PB (${pb * 2 >= 0 ? '+' : ''}${pb * 2})`, value: pb * 2 },
        { label: `Ability Mod (${mod >= 0 ? '+' : ''}${mod})`, value: mod },
      ]
    }

    const getPassiveOverrideOptions = (pKey: string) => {
      const pb = monster.proficiency ?? 2
      const skillName = pKey === 'animalHandling' ? 'animal-handling' : pKey
      const statName = SKILL[skillName as keyof typeof SKILL] || 'WIS'
      const statVal = monster.stats[statName as keyof typeof monster.stats] ?? 10
      const mod = Math.floor((statVal - 10) / 2)
      return [
        { label: `10 + Mod (${10 + mod})`, value: 10 + mod },
        { label: `10 + Mod + PB (${10 + mod + pb})`, value: 10 + mod + pb },
        { label: `10 + Mod + 2x PB (${10 + mod + pb * 2})`, value: 10 + mod + pb * 2 },
        { label: `15 (Keen Sense)`, value: 15 },
        { label: `20 (Legendary)`, value: 20 },
      ]
    }

    return {
      monster,
      skills: computed(() => monster.skills),
      deleteSkill: monster.deleteSkill,
      availableSkills,
      onSkillSelected,
      toolOptions: availableTools,
      onToolSelected,
      passives,
      getPassive,
      bonusForSkill,
      calculateToolBonus,
      formatModifier,
      toggleSkillAdvantage,
      toggleSkillDisadvantage,
      toggleToolAdvantage,
      toggleToolDisadvantage,
      getSkillOverrideOptions,
      getToolOverrideOptions,
      getPassiveOverrideOptions,
      validateNumber,
    }
  },
})
</script>
