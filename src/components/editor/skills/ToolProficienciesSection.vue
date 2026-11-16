<template>
  <div class="q-pa-xs">
    <div class="row items-center justify-between q-mb-xs">
      <div class="text-subtitle2 text-weight-bold text-secondary">
        🧰 Tool Proficiencies
      </div>
      <!-- Tool dropdown auto-adds on selection (no add button) -->
      <div style="min-width: 220px; max-width: 320px;">
        <catalog-select
          v-help="'Add a tool proficiency, such as a Poisoner’s Kit.'"
          :model-value="null"
          :entries="availableToolEntries"
          preserve-order
          allow-custom
          label="Add Tool..."
          placeholder="Select or type tool"
          clearable
          @update:model-value="val => onToolSelected(val ? String(val) : null)"
        />
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
              :color="tool.bonusAction ? 'amber-4' : 'blue-grey-8'"
              :text-color="tool.bonusAction ? 'grey-10' : 'white'"
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
              :text-color="tool.override ? 'grey-10' : 'white'"
              icon="handyman"
              @click="tool.override = !tool.override"
            >
              <q-tooltip class="text-body2">{{ $t('editor.override') }}</q-tooltip>
            </q-btn>
            <q-btn
v-help="$t('help.checks.skillDoubleUp')"
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
v-help="$t('help.checks.skillDoubleDown')"
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
              <catalog-select
                v-help="'Ability used for this skill.'"
                :model-value="tool.stat ?? 'DEX'"
                :entries="statEntries"
                preserve-order
                :searchable="false"
                label="Stat"
                @update:model-value="val => setToolStat(tool, val)"
              />
            </div>
            <div v-if="tool.override" class="col-3">
              <q-select
                v-help="'Ability modifier used for this skill.'"
                dense
                outlined
                :model-value="tool.overrideValue ?? 0"
                :options="getToolOverrideOptions(tool)"
                emit-value
                map-options
                use-input
                fill-input
                hide-selected label="Mod"
                new-value-mode="add-unique"
                @input-value="(val) => (tool.overrideValue = validateNumber(val, 0))"
                @update:model-value="(val) => (tool.overrideValue = validateNumber(val, 0))"
              />
            </div>
            <div :class="tool.override ? 'col-6' : 'col-9'">
              <mechanic-text-editor
                v-model="tool.condition"
                v-help="'When the bonus or advantage applies, e.g. “in dim light”.'"
                dense
                outlined label="Condition / Trigger"
                placeholder="e.g. traps, locks only"
                clearable
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
  name: 'ToolProficienciesSection',
  components: { CatalogSelect, MechanicTextEditor, SwapButtons },
  setup() {
    return injectSkillsEditorState()
  },
})
</script>
