<template>
  <div class="q-pa-xs">
    <div class="row items-center justify-between q-mb-xs">
      <div class="text-subtitle2 text-weight-bold text-primary">
        Skill Proficiencies
      </div>
      <!-- Dropdown auto-adds on selection (no add button, clicking outside does not select) -->
      <div style="min-width: 220px; max-width: 320px;">
        <catalog-select
          v-help="'Add a skill the creature is proficient or expert in.'"
          :model-value="null"
          :entries="availableSkillEntries"
          preserve-order
          label="Add Skill..."
          placeholder="Select skill to add"
          clearable
          @update:model-value="val => onSkillSelected(val ? String(val) : null)"
        />
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
              :color="effectiveSkillActionType(skill) === 'Bonus Action' ? 'amber-4' : (typeof skill.bonusAction === 'boolean' ? 'blue-grey-8' : 'blue-grey-3')"
              :text-color="typeof skill.bonusAction === 'boolean' ? (effectiveSkillActionType(skill) === 'Bonus Action' ? 'grey-10' : 'white') : undefined"
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
              :text-color="skill.override ? 'grey-10' : 'white'"
              icon="handyman"
              @click="skill.override = !skill.override"
            >
              <q-tooltip class="text-body2">{{ $t('editor.override') }}</q-tooltip>
            </q-btn>
            <q-btn
v-help="$t('help.checks.skillDoubleUp')"
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
v-help="$t('help.checks.skillDoubleDown')"
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
                v-help="'Type a fixed bonus instead of the computed one.'"
                dense
                outlined
                :model-value="skill.overrideValue ?? 0"
                :options="getSkillOverrideOptions(skill)"
                emit-value
                map-options
                use-input
                fill-input
                hide-selected label="Override"
                new-value-mode="add-unique"
                @input-value="(val) => (skill.overrideValue = validateNumber(val, 0))"
                @update:model-value="(val) => (skill.overrideValue = validateNumber(val, 0))"
              />
            </div>
            <div :class="skill.override ? 'col-8' : 'col-12'">
              <mechanic-text-editor
                v-help="'When the bonus or advantage applies, e.g. “in dim light”.'"
                dense
                outlined
                :model-value="skill.condition || skill.conditional || ''" label="Condition / Trigger"
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
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import CatalogSelect from '../../kit/CatalogSelect.vue'
import MechanicTextEditor from '../MechanicTextEditor.vue'
import SwapButtons from '../widgets/SwapButtons.vue'
import { injectSkillsEditorState } from './useSkillsEditorState'

export default defineComponent({
  name: 'SkillProficienciesSection',
  components: { CatalogSelect, MechanicTextEditor, SwapButtons },
  setup() {
    return injectSkillsEditorState()
  },
})
</script>
