<template>
  <q-expansion-item
    expand-separator
    data-editor-section="skills"
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
              label="Add Skill..." v-help="'Add a skill the creature is proficient or expert in.'"
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
                  :color="effectiveSkillActionType(skill) === 'Bonus Action' ? 'amber-9' : 'blue-grey-8'"
                  :outline="typeof skill.bonusAction !== 'boolean'"
                  :label="effectiveSkillActionType(skill)"
                  @click="toggleSkillActionType(skill)"
                >
                  <q-tooltip class="dnd-tip">Action economy for this skill. <b>Outlined</b> = follows its group (Search, Study, Influence or Hide); click to set it explicitly.</q-tooltip>
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
                <q-btn v-help="'⏫ in the skills editor.'"
                  dense
                  round
                  size="sm"
                  :color="skill.advantage ? 'positive' : 'grey-8'"
                  label="⏫"
                  @click="toggleSkillAdvantage(skill)"
                >
                  <q-tooltip class="text-body2">Advantage</q-tooltip>
                </q-btn>
                <q-btn v-help="'⏬ in the skills editor.'"
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
                    label="Override" v-help="'Type a fixed bonus instead of the computed one.'"
                    new-value-mode="add-unique"
                    @input-value="(val) => (skill.overrideValue = validateNumber(val, 0))"
                    @update:model-value="(val) => (skill.overrideValue = validateNumber(val, 0))"
                  />
                </div>
                <div :class="skill.override ? 'col-8' : 'col-12'">
                  <mechanic-text-editor
                    dense
                    outlined
                    :model-value="skill.condition || skill.conditional || ''"
                    label="Condition / Trigger" v-help="'When the bonus or advantage applies, e.g. “in dim light”.'"
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
              label="Add Tool..." v-help="'Add a tool proficiency, such as a Poisoner’s Kit.'"
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
                <q-btn v-help="'⏫ in the skills editor.'"
                  dense
                  round
                  size="sm"
                  :color="tool.advantage ? 'positive' : 'grey-8'"
                  label="⏫"
                  @click="toggleToolAdvantage(tool)"
                >
                  <q-tooltip class="text-body2">Advantage</q-tooltip>
                </q-btn>
                <q-btn v-help="'⏬ in the skills editor.'"
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
                    label="Stat" v-help="'Ability used for this skill.'"
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
                    label="Mod" v-help="'Ability modifier used for this skill.'"
                    new-value-mode="add-unique"
                    @input-value="(val) => (tool.overrideValue = validateNumber(val, 0))"
                    @update:model-value="(val) => (tool.overrideValue = validateNumber(val, 0))"
                  />
                </div>
                <div :class="tool.override ? 'col-6' : 'col-9'">
                  <mechanic-text-editor
                    dense
                    outlined
                    v-model="tool.condition"
                    label="Condition / Trigger" v-help="'When the bonus or advantage applies, e.g. “in dim light”.'"
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
          <!-- SEARCH: Insight, Medicine, Perception, Survival -->
          <div class="col-12 col-md-6">
            <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
              <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
                <span class="text-caption text-weight-bold text-primary">🔍 Search Checks</span>
                <div class="row items-center q-gutter-x-xs">
                  <q-checkbox
                    :model-value="movesToActionGroup('search')"
                    v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                    dense
                    label="Move To Action Group"
                    @update:model-value="setMoveToActionGroup('search', $event)"
                  />
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
              </div>
              <div class="q-mb-xs">
                <mechanic-text-editor
                  dense
                  outlined
                  dark
                  v-model="passives.riders.search"
                  label="Search Scope / Verbose Rider" v-help="'Extra wording for the Search action (Insight, Medicine, Perception, Survival).'"
                  placeholder="e.g. 60ft across Ethereal and Material Planes: Sense the Presence of Undeads..."
                >
                  <template #append>
                    <q-btn v-if="passives.riders.search" flat round dense size="xs" icon="close" @click="passives.riders.search = ''">
                      <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                    </q-btn>
                  </template>
                  <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
                </mechanic-text-editor>
                <div class="row items-center q-gutter-xs q-mt-xs">
                  <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                    <q-list dense dark class="bg-grey-10">
                      <q-item v-for="(pr, prIdx) in riderPresets.search" :key="prIdx" clickable v-close-popup @click="applyRiderPreset('search', pr)">
                        <q-item-section class="text-caption">{{ pr }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                  <q-btn v-help="'+ Ethereal (60ft) in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ Ethereal (60ft)" @click="appendRiderTag('search', '60ft across Ethereal and Material Planes')" />
                  <q-btn v-help="'+ Undead/Fiends in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ Undead/Fiends" @click="appendRiderTag('search', 'Sense Undead and Fiends')" />
                  <q-btn v-help="'+ DC 15 in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ DC 15" @click="appendRiderTag('search', 'DC 15 check')" />
                </div>
              </div>
              <div v-for="pKey in groupPassiveKeys('search')" :key="pKey" class="row items-center q-col-gutter-xs q-mb-xs">
                <div class="col-3 text-caption">{{ passiveLabel(pKey) }}</div>
                <div class="col-3">
                  <q-btn-group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="!getPassive(pKey).override ? 'positive' : 'grey-8'"
                      label="Auto" v-help="'Use the bonus computed from the ability modifier and proficiency.'"
                      @click="getPassive(pKey).override = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).override ? 'warning' : 'grey-8'"
                      label="Ovr" v-help="'Type a fixed bonus instead of the computed one.'"
                      @click="getPassive(pKey).override = true"
                    />
                  </q-btn-group>
                </div>
                <div class="col-2">
                  <q-btn-group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'"
                      label="▲▲" v-help="'Advantage: roll two d20s and keep the higher.'"
                      @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'"
                      label="▼▼" v-help="'Disadvantage: roll two d20s and keep the lower.'"
                      @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                    />
                  </q-btn-group>
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
                    label="Score" v-help="'Passive score: 10 + the skill bonus (+5 with advantage, −5 with disadvantage).'"
                    new-value-mode="add-unique"
                    @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                    @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                  />
                </div>
                <div class="col-4" v-else>
                  <mechanic-text-editor
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
              <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
                <span class="text-caption text-weight-bold text-info">📖 Study Checks</span>
                <div class="row items-center q-gutter-x-xs">
                  <q-checkbox
                    :model-value="movesToActionGroup('study')"
                    v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                    dense
                    label="Move To Action Group"
                    @update:model-value="setMoveToActionGroup('study', $event)"
                  />
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
              </div>
              <div class="q-mb-xs">
                <mechanic-text-editor
                  dense
                  outlined
                  dark
                  v-model="passives.riders.study"
                  label="Study Scope / Verbose Rider" v-help="'Extra wording for the Study action (Arcana, History, Investigation, Nature, Religion).'"
                  placeholder="e.g. Touch: Learn target's Alignment, and if its either Charmed or Possessed..."
                >
                  <template #append>
                    <q-btn v-if="passives.riders.study" flat round dense size="xs" icon="close" @click="passives.riders.study = ''">
                      <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                    </q-btn>
                  </template>
                  <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
                </mechanic-text-editor>
                <div class="row items-center q-gutter-xs q-mt-xs">
                  <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                    <q-list dense dark class="bg-grey-10">
                      <q-item v-for="(pr, prIdx) in riderPresets.study" :key="prIdx" clickable v-close-popup @click="applyRiderPreset('study', pr)">
                        <q-item-section class="text-caption">{{ pr }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                  <q-btn v-help="'+ Touch in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ Touch" @click="appendRiderTag('study', 'Touch: Learn target alignment')" />
                  <q-btn v-help="'+ Resistances in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ Resistances" @click="appendRiderTag('study', 'Learn vulnerabilities, resistances, immunities')" />
                  <q-btn v-help="'+ DC 15 in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ DC 15" @click="appendRiderTag('study', 'DC 15 check')" />
                </div>
              </div>
              <div v-for="pKey in groupPassiveKeys('study')" :key="`study-${pKey}`" class="row items-center q-col-gutter-xs q-mb-xs">
                <div class="col-3 text-caption">{{ passiveLabel(pKey) }}</div>
                <div class="col-3">
                  <q-btn-group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="!getPassive(pKey).override ? 'positive' : 'grey-8'"
                      label="Auto" v-help="'Use the bonus computed from the ability modifier and proficiency.'"
                      @click="getPassive(pKey).override = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).override ? 'warning' : 'grey-8'"
                      label="Ovr" v-help="'Type a fixed bonus instead of the computed one.'"
                      @click="getPassive(pKey).override = true"
                    />
                  </q-btn-group>
                </div>
                <div class="col-2">
                  <q-btn-group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'"
                      label="▲▲" v-help="'Advantage: roll two d20s and keep the higher.'"
                      @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'"
                      label="▼▼" v-help="'Disadvantage: roll two d20s and keep the lower.'"
                      @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                    />
                  </q-btn-group>
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
                    label="Score" v-help="'Passive score: 10 + the skill bonus (+5 with advantage, −5 with disadvantage).'"
                    new-value-mode="add-unique"
                    @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                    @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                  />
                </div>
                <div class="col-4" v-else>
                  <mechanic-text-editor
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
              <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
                <span class="text-caption text-weight-bold text-amber-8">🗣️ Influence Checks</span>
                <div class="row items-center q-gutter-x-xs">
                  <q-checkbox
                    :model-value="movesToActionGroup('influence')"
                    v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                    dense
                    label="Move To Action Group"
                    @update:model-value="setMoveToActionGroup('influence', $event)"
                  />
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
              </div>
              <div class="q-mb-xs">
                <mechanic-text-editor
                  dense
                  outlined
                  dark
                  v-model="passives.riders.influence"
                  label="Influence Scope / Verbose Rider" v-help="'Extra wording for the Influence action (Deception, Intimidation, Performance, Persuasion, Animal Handling).'"
                  placeholder="e.g. De-escalate hostile creatures with DC 15 Charisma check..."
                >
                  <template #append>
                    <q-btn v-if="passives.riders.influence" flat round dense size="xs" icon="close" @click="passives.riders.influence = ''">
                      <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                    </q-btn>
                  </template>
                  <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
                </mechanic-text-editor>
                <div class="row items-center q-gutter-xs q-mt-xs">
                  <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                    <q-list dense dark class="bg-grey-10">
                      <q-item v-for="(pr, prIdx) in riderPresets.influence" :key="prIdx" clickable v-close-popup @click="applyRiderPreset('influence', pr)">
                        <q-item-section class="text-caption">{{ pr }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                  <q-btn v-help="'+ DC 15 in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ DC 15" @click="appendRiderTag('influence', 'DC 15 Charisma check')" />
                  <q-btn v-help="'+ Must Hear in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ Must Hear" @click="appendRiderTag('influence', 'Creature must hear and understand')" />
                  <q-btn v-help="'+ 30ft in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ 30ft" @click="appendRiderTag('influence', 'within 30ft')" />
                </div>
              </div>
              <div v-for="pKey in groupPassiveKeys('influence')" :key="pKey" class="row items-center q-col-gutter-xs q-mb-xs">
                <div class="col-3 text-caption">{{ pKey === 'animalHandling' ? 'Animal Hdl.' : pKey.charAt(0).toUpperCase() + pKey.slice(1) }}</div>
                <div class="col-3">
                  <q-btn-group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="!getPassive(pKey).override ? 'positive' : 'grey-8'"
                      label="Auto" v-help="'Use the bonus computed from the ability modifier and proficiency.'"
                      @click="getPassive(pKey).override = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).override ? 'warning' : 'grey-8'"
                      label="Ovr" v-help="'Type a fixed bonus instead of the computed one.'"
                      @click="getPassive(pKey).override = true"
                    />
                  </q-btn-group>
                </div>
                <div class="col-2">
                  <q-btn-group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'"
                      label="▲▲" v-help="'Advantage: roll two d20s and keep the higher.'"
                      @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'"
                      label="▼▼" v-help="'Disadvantage: roll two d20s and keep the lower.'"
                      @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                    />
                  </q-btn-group>
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
                    label="Score" v-help="'Passive score: 10 + the skill bonus (+5 with advantage, −5 with disadvantage).'"
                    new-value-mode="add-unique"
                    @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                    @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                  />
                </div>
                <div class="col-4" v-else>
                  <mechanic-text-editor
                    dense
                    outlined
                    v-model="getPassive(pKey).condition"
                    placeholder="Qualifier"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- HIDE: Acrobatics, Athletics, Sleight of Hand, Stealth -->
          <div class="col-12 col-md-6">
            <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
              <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
                <span class="text-caption text-weight-bold text-deep-purple-4">🥷 Hide Checks</span>
                <div class="row items-center q-gutter-x-xs">
                  <q-checkbox
                    :model-value="movesToActionGroup('hide')"
                    v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                    dense
                    label="Move To Action Group"
                    @update:model-value="setMoveToActionGroup('hide', $event)"
                  />
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
              </div>
              <div class="q-mb-xs">
                <mechanic-text-editor
                  dense
                  outlined
                  dark
                  v-model="passives.riders.hide"
                  label="Hide Scope / Verbose Rider" v-help="'Extra wording for the Hide action (Stealth).'"
                  placeholder="e.g. Can hide in dim light or darkness even while observed..."
                >
                  <template #append>
                    <q-btn v-if="passives.riders.hide" flat round dense size="xs" icon="close" @click="passives.riders.hide = ''">
                      <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                    </q-btn>
                  </template>
                  <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
                </mechanic-text-editor>
                <div class="row items-center q-gutter-xs q-mt-xs">
                  <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                    <q-list dense dark class="bg-grey-10">
                      <q-item v-for="(pr, prIdx) in riderPresets.hide" :key="prIdx" clickable v-close-popup @click="applyRiderPreset('hide', pr)">
                        <q-item-section class="text-caption">{{ pr }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                  <q-btn v-help="'+ Light Obscurement in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ Light Obscurement" @click="appendRiderTag('hide', 'Must have light obscurement or 3/4 cover')" />
                  <q-btn v-help="'+ While Observed in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ While Observed" @click="appendRiderTag('hide', 'Can hide while observed in dim light')" />
                  <q-btn v-help="'+ Invisible in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ Invisible" @click="appendRiderTag('hide', 'Become invisible until start of next turn')" />
                </div>
              </div>
              <div v-for="pKey in groupPassiveKeys('hide')" :key="`hide-${pKey}`" class="row items-center q-col-gutter-xs q-mb-xs">
                <div class="col-3 text-caption">{{ passiveLabel(pKey) }}</div>
                <div class="col-3">
                  <q-btn-group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="!getPassive(pKey).override ? 'positive' : 'grey-8'"
                      label="Auto" v-help="'Use the bonus computed from the ability modifier and proficiency.'"
                      @click="getPassive(pKey).override = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).override ? 'warning' : 'grey-8'"
                      label="Ovr" v-help="'Type a fixed bonus instead of the computed one.'"
                      @click="getPassive(pKey).override = true"
                    />
                  </q-btn-group>
                </div>
                <div class="col-2">
                  <q-btn-group spread flat dense>
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).advantage ? 'positive' : 'grey-9'"
                      label="▲▲" v-help="'Advantage: roll two d20s and keep the higher.'"
                      @click="getPassive(pKey).advantage = !getPassive(pKey).advantage; if (getPassive(pKey).advantage) getPassive(pKey).disadvantage = false"
                    />
                    <q-btn
                      dense
                      size="xs"
                      :color="getPassive(pKey).disadvantage ? 'negative' : 'grey-9'"
                      label="▼▼" v-help="'Disadvantage: roll two d20s and keep the lower.'"
                      @click="getPassive(pKey).disadvantage = !getPassive(pKey).disadvantage; if (getPassive(pKey).disadvantage) getPassive(pKey).advantage = false"
                    />
                  </q-btn-group>
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
                    label="Score" v-help="'Passive score: 10 + the skill bonus (+5 with advantage, −5 with disadvantage).'"
                    new-value-mode="add-unique"
                    @input-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                    @update:model-value="(val) => (getPassive(pKey).overrideValue = validateNumber(val, 10))"
                  />
                </div>
                <div class="col-4" v-else>
                  <mechanic-text-editor
                    dense
                    outlined
                    v-model="getPassive(pKey).condition"
                    placeholder="Qualifier"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- USE TOOL: Artisan tools, kits, musical instruments -->
          <div class="col-12 col-md-6">
            <div class="q-pa-xs rounded-borders" style="border: 1px solid rgba(255,255,255,0.1);">
              <div class="row items-center justify-between q-mb-xs flex-wrap q-gutter-xs">
                <span class="text-caption text-weight-bold text-teal-4">🛠️ Use Tool Checks</span>
                <div class="row items-center q-gutter-x-xs">
                  <q-checkbox
                    :model-value="movesToActionGroup('tools')"
                    v-help="'Place this group beneath the section chosen by its Action / Bonus Action toggle. Uncheck to keep it among the skill rows.'"
                    dense
                    label="Move To Action Group"
                    @update:model-value="setMoveToActionGroup('tools', $event)"
                  />
                  <q-btn-toggle
                    v-model="passives.toolsActionType"
                    dense
                    no-caps
                    rounded
                    unelevated
                    size="xs"
                    toggle-color="teal-6"
                    color="grey-9"
                    text-color="grey-4"
                    :options="[
                      { label: 'Action', value: 'Action' },
                      { label: 'Bonus Action', value: 'Bonus Action' },
                    ]"
                  />
                </div>
              </div>
              <div class="q-mb-xs">
                <mechanic-text-editor
                  dense
                  outlined
                  dark
                  v-model="passives.riders.tools"
                  label="Use Tool Scope / Verbose Rider" v-help="'Extra wording for using a tool as an action.'"
                  placeholder="e.g. Can craft or repair equipment during short rest..."
                >
                  <template #append>
                    <q-btn v-if="passives.riders.tools" flat round dense size="xs" icon="close" @click="passives.riders.tools = ''">
                      <q-tooltip class="dnd-tip">Clear rider</q-tooltip>
                    </q-btn>
                  </template>
                  <q-tooltip class="dnd-tip">Rider or verbose scope description rendered on the second row of the action plate.</q-tooltip>
                </mechanic-text-editor>
                <div class="row items-center q-gutter-xs q-mt-xs">
                  <q-btn-dropdown dense flat size="xs" color="amber-4" icon="auto_awesome" label="Presets">
                    <q-list dense dark class="bg-grey-10">
                      <q-item v-for="(pr, prIdx) in riderPresets.tools" :key="prIdx" clickable v-close-popup @click="applyRiderPreset('tools', pr)">
                        <q-item-section class="text-caption">{{ pr }}</q-item-section>
                      </q-item>
                    </q-list>
                  </q-btn-dropdown>
                  <q-btn v-help="'+ 1 min in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ 1 min" @click="appendRiderTag('tools', 'in 1 minute')" />
                  <q-btn v-help="'+ Bonus Action in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ Bonus Action" @click="appendRiderTag('tools', 'as a bonus action')" />
                  <q-btn v-help="'+ DC 15 in the skills editor.'" dense flat size="xs" color="cyan-3" label="+ DC 15" @click="appendRiderTag('tools', 'DC 15 tool check')" />
                </div>
              </div>
              <div v-if="monster.tools && monster.tools.length > 0" class="row q-gutter-xs q-mt-xs">
                <q-chip
                  v-for="t in monster.tools"
                  :key="t.id"
                  dense
                  size="sm"
                  color="teal-9"
                  text-color="teal-1"
                >
                  {{ t.name }} ({{ t.stat }})
                </q-chip>
              </div>
              <div v-else class="text-caption text-grey-5 q-pa-xs">
                No tools configured yet. Add tools above in Section 2 to include them here.
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import MechanicTextEditor from './MechanicTextEditor.vue'
import type { SkillPassiveState } from 'src/core/domain/skill-passive-state'
import { SKILL } from 'src/data/SKILL'
import { SKILL_ACTION_GROUPS, passiveConfigKey, skillActionGroupFor, skillGroupPlacement } from 'src/core/domain/skill-action-groups'
import type { CombatSkillGroupId, SkillActionGroupId } from 'src/core/domain/skill-action-groups'
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

const SKILL_ICONS: Record<string, string> = {
  PERCEPTION: 'fa-solid fa-magnifying-glass',
  INVESTIGATION: 'fa-solid fa-magnifying-glass-chart',
  INSIGHT: 'fa-solid fa-eye',
  SURVIVAL: 'fa-solid fa-compass',
  ARCANA: 'fa-solid fa-hat-wizard',
  HISTORY: 'fa-solid fa-scroll',
  NATURE: 'fa-solid fa-leaf',
  RELIGION: 'fa-solid fa-ankh',
  DECEPTION: 'fa-solid fa-masks-theater',
  INTIMIDATION: 'fa-solid fa-skull',
  PERFORMANCE: 'fa-solid fa-music',
  PERSUASION: 'fa-solid fa-comments',
  ANIMAL_HANDLING: 'fa-solid fa-paw',
  STEALTH: 'fa-solid fa-user-ninja',
  ACROBATICS: 'fa-solid fa-person-running',
  ATHLETICS: 'fa-solid fa-dumbbell',
  MEDICINE: 'fa-solid fa-kit-medical',
  SLIGHT_OF_HAND: 'fa-solid fa-hand-sparkles',
}

// Category chips follow the stat block grouping (src/core/domain/skill-action-groups.ts)
const SKILL_SCOPE_META: Record<string, { category: string; color: string; icon: string; order: number }> =
  Object.fromEntries(
    Object.keys(SKILL).map((key) => {
      const groupIdx = SKILL_ACTION_GROUPS.findIndex((g) => g.skills.includes(key))
      const group = SKILL_ACTION_GROUPS[groupIdx]
      return [
        key,
        {
          category: group ? `${group.label} (${SKILL[key].stat})` : `Skills (${SKILL[key].stat})`,
          color: group?.color ?? 'teal-6',
          icon: SKILL_ICONS[key] ?? group?.icon ?? 'fa-solid fa-dice-d20',
          order: group ? groupIdx + 1 : SKILL_ACTION_GROUPS.length + 1,
        },
      ]
    })
  )

export default defineComponent({
  name: 'SkillsEditor',
  components: { MechanicTextEditor, SwapButtons },
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

    const ensurePassives = (): SkillPassiveState & { riders: Record<string, string> } => {
      if (!monster.passives) {
        monster.passives = {
          hideActionType: monster.actionOrientedPassives?.bonusActionHide ? 'Bonus Action' : 'Action',
          searchActionType: monster.actionOrientedPassives?.bonusActionSearch ? 'Bonus Action' : 'Action',
          studyActionType: monster.actionOrientedPassives?.bonusActionStudy ? 'Bonus Action' : 'Action',
          influenceActionType: monster.actionOrientedPassives?.bonusActionInfluence ? 'Bonus Action' : 'Action',
          toolsActionType: monster.actionOrientedPassives?.bonusActionTools || (monster as unknown as { toolsActionType?: string }).toolsActionType === 'Bonus Action' ? 'Bonus Action' : 'Action',
          riders: { ...(monster.actionOrientedPassives?.riders || {}) },
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
      if (!monster.passives.riders) {
        monster.passives.riders = { ...(monster.actionOrientedPassives?.riders || {}) }
      }
      if (typeof monster.passives.riders.search !== 'string') monster.passives.riders.search = ''
      if (typeof monster.passives.riders.study !== 'string') monster.passives.riders.study = ''
      if (typeof monster.passives.riders.influence !== 'string') monster.passives.riders.influence = ''
      if (typeof monster.passives.riders.hide !== 'string') monster.passives.riders.hide = ''
      if (typeof monster.passives.riders.tools !== 'string') monster.passives.riders.tools = ''


      if (!monster.passives.searchActionType) monster.passives.searchActionType = monster.actionOrientedPassives?.bonusActionSearch ? 'Bonus Action' : 'Action'
      if (!monster.passives.studyActionType) monster.passives.studyActionType = monster.actionOrientedPassives?.bonusActionStudy ? 'Bonus Action' : 'Action'
      if (!monster.passives.influenceActionType) monster.passives.influenceActionType = monster.actionOrientedPassives?.bonusActionInfluence ? 'Bonus Action' : 'Action'
      if (!monster.passives.hideActionType) monster.passives.hideActionType = monster.actionOrientedPassives?.bonusActionHide ? 'Bonus Action' : 'Action'
      if (!monster.passives.toolsActionType) monster.passives.toolsActionType = monster.actionOrientedPassives?.bonusActionTools || (monster as unknown as { toolsActionType?: string }).toolsActionType === 'Bonus Action' ? 'Bonus Action' : 'Action'
      return monster.passives as SkillPassiveState & { riders: Record<string, string> }
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
        if (!aop) return
        if (p.searchActionType === 'Action' || p.searchActionType === 'Bonus Action') aop.bonusActionSearch = p.searchActionType === 'Bonus Action'
        if (p.studyActionType === 'Action' || p.studyActionType === 'Bonus Action') aop.bonusActionStudy = p.studyActionType === 'Bonus Action'
        if (p.hideActionType === 'Action' || p.hideActionType === 'Bonus Action') aop.bonusActionHide = p.hideActionType === 'Bonus Action'
        if (p.influenceActionType === 'Action' || p.influenceActionType === 'Bonus Action') aop.bonusActionInfluence = p.influenceActionType === 'Bonus Action'
        if (p.toolsActionType === 'Action' || p.toolsActionType === 'Bonus Action') aop.bonusActionTools = p.toolsActionType === 'Bonus Action'

        if (p.searchPlacement !== undefined) aop.searchPlacement = p.searchPlacement
        if (typeof p.searchMoveToActionGroup === 'boolean') aop.searchMoveToActionGroup = p.searchMoveToActionGroup
        if (p.studyPlacement !== undefined) aop.studyPlacement = p.studyPlacement
        if (typeof p.studyMoveToActionGroup === 'boolean') aop.studyMoveToActionGroup = p.studyMoveToActionGroup
        if (p.influencePlacement !== undefined) aop.influencePlacement = p.influencePlacement
        if (typeof p.influenceMoveToActionGroup === 'boolean') aop.influenceMoveToActionGroup = p.influenceMoveToActionGroup
        if (p.hidePlacement !== undefined) aop.hidePlacement = p.hidePlacement
        if (typeof p.hideMoveToActionGroup === 'boolean') aop.hideMoveToActionGroup = p.hideMoveToActionGroup
        if (p.toolsPlacement !== undefined) aop.toolsPlacement = p.toolsPlacement
        if (typeof p.toolsMoveToActionGroup === 'boolean') aop.toolsMoveToActionGroup = p.toolsMoveToActionGroup
        aop.riders = { ...(p.riders || {}) }

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

    // passive-config keys for one group card, in table order
    const groupPassiveKeys = (groupId: SkillActionGroupId): string[] =>
      (SKILL_ACTION_GROUPS.find((g) => g.id === groupId)?.skills ?? []).map((key) => passiveConfigKey(key))

    const passiveLabel = (cfgKey: string): string => {
      const key = Object.keys(SKILL).find((k) => passiveConfigKey(k) === cfgKey)
      return key ? SKILL[key].label : cfgKey
    }

    // a skill without an explicit economy follows its group's Action / Bonus Action toggle
    const groupActionTypeFor = (skillKey: string): 'Action' | 'Bonus Action' => {
      const group = skillActionGroupFor(skillKey)
      if (!group) return 'Action'
      const p = passives.value as unknown as Record<string, unknown>
      return p?.[`${group.id}ActionType`] === 'Bonus Action' ? 'Bonus Action' : 'Action'
    }

    const effectiveSkillActionType = (skill: MonsterSkill): 'Action' | 'Bonus Action' =>
      typeof skill.bonusAction === 'boolean' ? (skill.bonusAction ? 'Bonus Action' : 'Action') : groupActionTypeFor(String(skill.key))

    const toggleSkillActionType = (skill: MonsterSkill) => {
      const next = effectiveSkillActionType(skill) === 'Action' ? 'Bonus Action' : 'Action'
      skill.bonusAction = next === groupActionTypeFor(String(skill.key)) ? undefined : next === 'Bonus Action'
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
      const skillEntry = SKILL[String(s.key).toUpperCase() as keyof typeof SKILL]
      const statName = skillEntry?.stat || 'DEX'
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
      const skillKey =
        pKey === 'animalHandling'
          ? 'ANIMAL_HANDLING'
          : pKey === 'sleightOfHand'
            ? 'SLIGHT_OF_HAND'
            : pKey.toUpperCase()
      const statName = SKILL[skillKey as keyof typeof SKILL]?.stat || 'WIS'
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

    const movesToActionGroup = (group: CombatSkillGroupId): boolean => skillGroupPlacement(
      group, passives.value[group + 'ActionType'] === 'Bonus Action' ? 'Bonus Action' : 'Action',
      passives.value, monster.actionOrientedPassives as Record<string, unknown>, monster as unknown as Record<string, unknown>,
    ) !== 'header'
    const setMoveToActionGroup = (group: CombatSkillGroupId, enabled: boolean) => {
      passives.value[group + 'MoveToActionGroup'] = enabled
    }

    const riderPresets = {
      search: [
        '60ft across Ethereal and Material Planes: Sense the Presence of Undeads, Fiends, and Celestials.',
        'Secret doors or hidden compartments within 10ft.',
        'Discern truth or deception from any creature speaking to it.',
        'Track creatures across any terrain, including magical tracking.',
      ],
      study: [
        "Touch: Learn target's Alignment, and if its either Charmed or Possessed.",
        'Learn damage vulnerabilities, resistances, and immunities within 30ft.',
        'Identify spells cast or magical effects active on target.',
        'Recall ancient lore or sacred rites regarding celestial or fiendish origins.',
      ],
      influence: [
        'De-escalate hostile creatures with DC 15 Charisma check.',
        'Creature must be able to hear and understand.',
        'Command beast or summoned creature as a bonus action.',
        'Inspire allies within 30ft to add +1d4 to attack rolls.',
      ],
      hide: [
        'Must have light obscurement or three-quarters cover.',
        'Can hide in dim light or darkness even while observed.',
        'Break line of sight and shift silently up to 10ft.',
        'Become invisible until the start of next turn or until an attack is made.',
      ],
      tools: [
        'Herbalism Kit: Brew curative poultice or antitoxin in 1 minute.',
        "Thieves' Tools: Pick locks or disarm traps as a bonus action.",
        "Poisoner's Kit: Apply lethal coating to weapon as a bonus action.",
        'Craft or repair equipment during short rest with DC 15 check.',
      ],
    }

    const applyRiderPreset = (category: 'search' | 'study' | 'influence' | 'hide' | 'tools', text: string) => {
      if (!passives.value.riders) passives.value.riders = { search: '', study: '', influence: '', hide: '', tools: '' }
      passives.value.riders[category] = text
    }

    const appendRiderTag = (category: 'search' | 'study' | 'influence' | 'hide' | 'tools', tag: string) => {
      if (!passives.value.riders) passives.value.riders = { search: '', study: '', influence: '', hide: '', tools: '' }
      const cur = passives.value.riders[category] || ''
      passives.value.riders[category] = cur ? `${cur}, ${tag}` : tag
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
      movesToActionGroup,
      setMoveToActionGroup,
      riderPresets,
      applyRiderPreset,
      appendRiderTag,
      groupPassiveKeys,
      passiveLabel,
      effectiveSkillActionType,
      toggleSkillActionType,
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
