<template>
  <q-expansion-item
    expand-separator
    icon="shield"
    :label="$t('editor.resistances.label')"
    :caption="$t('editor.resistances.caption')"
  >
    <q-card class="q-pa-sm q-gutter-y-md">
      <!-- Category Row Splitting & Order Controls -->
      <div
        class="q-pa-xs rounded-borders bg-grey-9 text-white"
        style="border: 1px solid rgba(255, 255, 255, 0.15);"
      >
        <div class="row items-center justify-between q-px-xs q-pb-xs">
          <div class="text-caption text-weight-bold text-cyan-3 flex items-center">
            <q-icon name="view_headline" size="14px" class="q-mr-xs" />
            Category Row Splitting &amp; Disclose Order
          </div>
          <div class="row items-center q-gutter-x-sm">
            <q-checkbox
              v-model="monster.autoSortDefenses"
              dark
              dense
              size="xs"
              label="Auto-Sort Concise First" v-help="'List short entries before long ones.'"
              class="text-caption text-grey-4"
            >
              <q-tooltip>When checked, automatically sorts shorter/concise resistances first and complex conditions last. When unchecked, strictly preserves your authored order.</q-tooltip>
            </q-checkbox>
            <q-checkbox
              v-model="monster.autoSplitDefenses"
              dark
              dense
              size="xs"
              label="Auto-Split on Line Overflow" v-help="'Break the defenses line automatically when it is too long.'"
              class="text-caption text-grey-4"
            >
              <q-tooltip>Automatically splits Damage and Conditions into separate dedicated rows if the text exceeds the line</q-tooltip>
            </q-checkbox>
          </div>
        </div>

        <div class="row q-col-gutter-xs items-center q-px-xs">
          <div class="col-12 col-sm-4">
            <q-toggle
              v-model="monster.splitVulnRows"
              dark
              dense
              size="xs"
              color="negative"
              label="Split Vulnerabilities Row" v-help="'Show vulnerabilities on their own lines.'"
              class="text-caption"
            >
              <q-tooltip>Dedicated row for Damage Vulnerabilities and dedicated row for Condition Vulnerabilities</q-tooltip>
            </q-toggle>
          </div>
          <div class="col-12 col-sm-4">
            <q-toggle
              v-model="monster.splitResRows"
              dark
              dense
              size="xs"
              color="warning"
              label="Split Resistances Row" v-help="'Show resistances on their own lines.'"
              class="text-caption"
            >
              <q-tooltip>Dedicated row for Damage Resistances and dedicated row for Condition Resistances</q-tooltip>
            </q-toggle>
          </div>
          <div class="col-12 col-sm-4">
            <q-toggle
              v-model="monster.splitImmRows"
              dark
              dense
              size="xs"
              color="secondary"
              label="Split Immunities Row" v-help="'Show immunities on their own lines.'"
              class="text-caption"
            >
              <q-tooltip>Dedicated row for Damage Immunities and dedicated row for Condition Immunities</q-tooltip>
            </q-toggle>
          </div>
        </div>

        <!-- Category Order Chips -->
        <div class="row items-center q-gutter-x-xs q-mt-xs q-px-xs">
          <span class="text-caption text-grey-5">Category Precedence:</span>
          <q-chip
            v-for="(cat, cIdx) in currentCategoryOrder"
            :key="cat"
            dense
            size="sm"
            color="grey-8"
            text-color="white"
            class="text-capitalize"
          >
            <span class="q-mr-xs text-weight-bold">{{ cIdx + 1 }}.</span>
            {{ cat }}
            <q-btn flat round dense size="xs" icon="swap_horiz" class="q-ml-xs" @click.stop="swapCategory(cIdx)" />
          </q-chip>
        </div>
      </div>

      <!-- 1. Damage Vulnerabilities -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-negative">
            💔 Vulnerability (Damage)
          </div>
          <div v-if="vulnerabilitiesPreview" class="text-caption text-grey-4">
            <em>{{ vulnerabilitiesPreview }}</em>
          </div>
        </div>

        <!-- Add Vulnerability Dropdown -->
        <div class="q-mb-xs">
          <q-select
            :model-value="null"
            :options="vulnerabilityDamageOptions"
            use-input
            input-debounce="0"
            new-value-mode="add-unique"
            label="Select or Type Damage Vulnerability to Add" v-help="'Vulnerability doubles damage of this type.'"
            dense
            outlined
            @update:model-value="(val) => addDefenseItem('vulnerabilities', val)"
          >
            <template #prepend>
              <q-icon name="add" />
            </template>
          </q-select>
        </div>

        <!-- Active Vulnerabilities List -->
        <div v-if="monster.vulnerabilitiesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No damage vulnerabilities added.
        </div>
        <div
          v-for="(item, idx) in monster.vulnerabilitiesList"
          :key="'vuln-' + idx"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
        >
          <div class="row items-center justify-between no-wrap">
            <q-chip
              dense
              outline
              color="negative"
              class="q-ma-none text-weight-bold"
              style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
            >
              {{ item.type }}
            </q-chip>
            <div class="row items-center q-gutter-x-xs no-wrap">
              <swap-buttons field="vulnerabilitiesList" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="removeDefenseItem('vulnerabilities', idx)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-3">
              <q-checkbox v-help="'Tick to include nonmagical for the resistances editor.'" v-model="item.nonmagical" label="Nonmagical" dense @update:model-value="syncDefenses" />
            </div>
            <div class="col-12 col-sm-9">
              <q-select
                :model-value="getUnifiedSaveOutcome(item)"
                :options="unifiedSaveOutcomeOptions"
                emit-value
                map-options
                use-input
                new-value-mode="add-unique"
                label="Save Modifier & Outcome" v-help="'Save bonus or penalty and its result.'"
                dense
                outlined
                clearable
                @update:model-value="(val) => setUnifiedSaveOutcome(item, val)"
              />
            </div>
          </div>

          <!-- Acquired Condition when taking Vulnerability Damage & Duration -->
          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-5">
              <q-select v-help="'Choose acquired negative condition for the resistances editor.'"
                v-model="item.acquiredCondition"
                :options="acquiredConditionOptions"
                use-input
                new-value-mode="add-unique"
                label="Acquired Negative Condition"
                dense
                outlined
                clearable
                @update:model-value="syncDefenses"
              />
            </div>
            <div class="col-12 col-sm-3">
              <q-select
                v-model="item.conditionDuration"
                :options="conditionDurationOptions"
                emit-value
                map-options
                label="Duration" v-help="'How long the effect lasts.'"
                dense
                outlined
                clearable
                @update:model-value="syncDefenses"
              >
                <template #option="scope">
                  <q-item v-bind="scope.itemProps" dense>
                    <q-item-section avatar style="min-width: 28px; padding-right: 8px;">
                      <q-icon :name="scope.opt.icon || 'fa-solid fa-clock'" :color="scope.opt.color || 'primary'" size="xs" />
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
            <div class="col-12 col-sm-4">
              <mechanic-text-editor v-help="'Enter note (e.g. while frozen) for the resistances editor.'"
                v-model="item.note"
                label="Note (e.g. while frozen)"
                dense
                outlined
                @update:model-value="syncDefenses"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Condition Vulnerabilities -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-deep-orange-4">
            ⚠️ Vulnerability (Conditions)
          </div>
          <div v-if="conditionVulnerabilitiesPreview" class="text-caption text-grey-4">
            <em>{{ conditionVulnerabilitiesPreview }}</em>
          </div>
        </div>

        <div class="q-mb-xs">
          <q-select
            :model-value="null"
            :options="vulnerabilityConditionOptions"
            use-input
            input-debounce="0"
            new-value-mode="add-unique"
            label="Select or Type Condition Vulnerability to Add" v-help="'Disadvantage on saves against this condition.'"
            dense
            outlined
            @update:model-value="(val) => addDefenseItem('conditionVulnerabilities', val)"
          >
            <template #prepend>
              <q-icon name="add" />
            </template>
          </q-select>
        </div>

        <div v-if="monster.conditionVulnerabilitiesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No condition vulnerabilities added.
        </div>
        <div
          v-for="(item, idx) in monster.conditionVulnerabilitiesList"
          :key="'condvuln-' + idx"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
        >
          <div class="row items-center justify-between no-wrap">
            <q-chip
              dense
              outline
              color="deep-orange-4"
              class="q-ma-none text-weight-bold"
              style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
            >
              {{ item.type }}
            </q-chip>
            <div class="row items-center q-gutter-x-xs no-wrap">
              <swap-buttons field="conditionVulnerabilitiesList" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="removeDefenseItem('conditionVulnerabilities', idx)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-7">
              <q-select v-help="'Choose compelled action / weakness for the resistances editor.'"
                v-model="item.acquiredCondition"
                :options="conditionVulnerabilityActionOptions"
                use-input
                new-value-mode="add-unique"
                label="Compelled Action / Weakness"
                dense
                outlined
                clearable
                placeholder="e.g. wastes Reaction to move up to speed"
                @update:model-value="syncDefenses"
              />
            </div>
            <div class="col-12 col-sm-5">
              <mechanic-text-editor v-help="'Enter note / duration for the resistances editor.'"
                v-model="item.note"
                label="Note / Duration"
                dense
                outlined
                @update:model-value="syncDefenses"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Damage Resistances -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-primary">
            🛡️ Resistances (Damage)
          </div>
          <div v-if="resistancesPreview" class="text-caption text-grey-4">
            <em>{{ resistancesPreview }}</em>
          </div>
        </div>

        <div class="q-mb-xs">
          <q-select
            :model-value="null"
            :options="resistanceDamageOptions"
            use-input
            input-debounce="0"
            new-value-mode="add-unique"
            label="Select or Type Damage Resistance to Add" v-help="'Resistance halves damage of this type.'"
            dense
            outlined
            @update:model-value="(val) => addDefenseItem('resistances', val)"
          >
            <template #prepend>
              <q-icon name="add" />
            </template>
          </q-select>
        </div>

        <div v-if="monster.resistancesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No damage resistances added.
        </div>
        <div
          v-for="(item, idx) in monster.resistancesList"
          :key="'res-' + idx"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
        >
          <div class="row items-center justify-between no-wrap">
            <q-chip
              dense
              outline
              color="primary"
              class="q-ma-none text-weight-bold"
              style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
            >
              {{ item.type }}
            </q-chip>
            <div class="row items-center q-gutter-x-xs no-wrap">
              <swap-buttons field="resistancesList" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="removeDefenseItem('resistances', idx)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-3">
              <q-checkbox v-help="'Tick to include nonmagical for the resistances editor.'" v-model="item.nonmagical" label="Nonmagical" dense @update:model-value="syncDefenses" />
            </div>
            <div class="col-12 col-sm-9">
              <q-select
                :model-value="getUnifiedSaveOutcome(item)"
                :options="unifiedSaveOutcomeOptions"
                emit-value
                map-options
                use-input
                new-value-mode="add-unique"
                label="Save Modifier & Outcome" v-help="'Save bonus or penalty and its result.'"
                dense
                outlined
                clearable
                @update:model-value="(val) => setUnifiedSaveOutcome(item, val)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-5">
              <mechanic-select-editor
                v-model="item.triggeredBenefit"
                :options="benefitOptions"
                use-input
                new-value-mode="add-unique"
                label="Triggered Benefit / Reaction" v-help="'What the creature gains when the trigger happens.'"
                dense
                outlined
                clearable
                @update:model-value="syncDefenses"
              />
            </div>
            <div class="col-12 col-sm-3">
              <q-select
                v-model="item.benefitTrigger"
                :options="benefitTriggerOptions"
                emit-value
                map-options
                label="Trigger" v-help="'What sets off this defensive effect.'"
                dense
                outlined
                @update:model-value="syncDefenses"
              />
            </div>
            <div class="col-12 col-sm-4">
              <mechanic-text-editor v-help="'Enter note (e.g. silvered) for the resistances editor.'"
                v-model="item.note"
                label="Note (e.g. silvered)"
                dense
                outlined
                @update:model-value="syncDefenses"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Condition Resistances -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-teal-4">
            🔰 Resistances (Conditions)
          </div>
          <div v-if="conditionResistancesPreview" class="text-caption text-grey-4">
            <em>{{ conditionResistancesPreview }}</em>
          </div>
        </div>

        <div class="q-mb-xs">
          <q-select
            :model-value="null"
            :options="conditionResistancesOptions"
            use-input
            input-debounce="0"
            new-value-mode="add-unique"
            label="Select or Type Condition Resistance to Add" v-help="'Advantage on saves against this condition.'"
            dense
            outlined
            @update:model-value="(val) => addDefenseItem('conditionResistances', val)"
          >
            <template #prepend>
              <q-icon name="add" />
            </template>
          </q-select>
        </div>

        <div v-if="monster.conditionResistancesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No condition resistances added.
        </div>
        <div
          v-for="(item, idx) in monster.conditionResistancesList"
          :key="'condres-' + idx"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
        >
          <div class="row items-center justify-between no-wrap">
            <q-chip
              dense
              outline
              color="teal-4"
              class="q-ma-none text-weight-bold"
              style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
            >
              {{ item.type }}
            </q-chip>
            <div class="row items-center q-gutter-x-xs no-wrap">
              <swap-buttons field="conditionResistancesList" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="removeDefenseItem('conditionResistances', idx)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-8">
              <q-select
                :model-value="getUnifiedSaveOutcome(item)"
                :options="unifiedSaveOutcomeOptions"
                emit-value
                map-options
                label="Save Outcome & Defense Mode" v-help="'What a successful or failed save means here.'"
                dense
                outlined
                clearable
                @update:model-value="(val) => setUnifiedSaveOutcome(item, val)"
              />
            </div>
            <div class="col-12 col-sm-4">
              <mechanic-text-editor v-help="'Enter note / details for the resistances editor.'"
                v-model="item.note"
                label="Note / Details"
                dense
                outlined
                @update:model-value="syncDefenses"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 5. Damage Immunities -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-secondary">
            ⚡ Immunity (Damage)
          </div>
          <div v-if="immunitiesPreview" class="text-caption text-grey-4">
            <em>{{ immunitiesPreview }}</em>
          </div>
        </div>

        <div class="q-mb-xs">
          <q-select
            :model-value="null"
            :options="immunityDamageOptions"
            use-input
            input-debounce="0"
            new-value-mode="add-unique"
            label="Select or Type Damage Immunity to Add" v-help="'Immunity: the creature takes no damage of this type.'"
            dense
            outlined
            @update:model-value="(val) => addDefenseItem('immunities', val)"
          >
            <template #prepend>
              <q-icon name="add" />
            </template>
          </q-select>
        </div>

        <div v-if="monster.immunitiesList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No damage immunities added.
        </div>
        <div
          v-for="(item, idx) in monster.immunitiesList"
          :key="'imm-' + idx"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
        >
          <div class="row items-center justify-between no-wrap">
            <q-chip
              dense
              outline
              color="secondary"
              class="q-ma-none text-weight-bold"
              style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
            >
              {{ item.type }}
            </q-chip>
            <div class="row items-center q-gutter-x-xs no-wrap">
              <swap-buttons field="immunitiesList" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="removeDefenseItem('immunities', idx)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-3">
              <q-checkbox v-help="'Tick to include nonmagical for the resistances editor.'" v-model="item.nonmagical" label="Nonmagical" dense @update:model-value="syncDefenses" />
            </div>
            <div class="col-12 col-sm-9">
              <q-select
                :model-value="getUnifiedSaveOutcome(item)"
                :options="unifiedSaveOutcomeOptions"
                emit-value
                map-options
                label="Save Outcome & Defense Mode" v-help="'What a successful or failed save means here.'"
                dense
                outlined
                clearable
                @update:model-value="(val) => setUnifiedSaveOutcome(item, val)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-5">
              <mechanic-select-editor
                v-model="item.triggeredBenefit"
                :options="benefitOptions"
                use-input
                new-value-mode="add-unique"
                label="Triggered Benefit / Reaction" v-help="'What the creature gains when the trigger happens.'"
                dense
                outlined
                clearable
                @update:model-value="syncDefenses"
              />
            </div>
            <div class="col-12 col-sm-3">
              <q-select
                v-model="item.benefitTrigger"
                :options="benefitTriggerOptions"
                emit-value
                map-options
                label="Trigger" v-help="'What sets off this defensive effect.'"
                dense
                outlined
                @update:model-value="syncDefenses"
              />
            </div>
            <div class="col-12 col-sm-4">
              <mechanic-text-editor v-help="'Enter note (e.g. adamantine) for the resistances editor.'"
                v-model="item.note"
                label="Note (e.g. adamantine)"
                dense
                outlined
                @update:model-value="syncDefenses"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 6. Condition Immunities -->
      <div
        class="q-pa-sm rounded-borders"
        style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      >
        <div class="row items-center justify-between q-mb-xs">
          <div class="text-subtitle2 text-weight-bold text-accent">
            ✨ Immunity (Conditions)
          </div>
          <div v-if="conditionsPreview" class="text-caption text-grey-4">
            <em>{{ conditionsPreview }}</em>
          </div>
        </div>

        <div class="q-mb-xs">
          <q-select
            :model-value="null"
            :options="conditionImmunitiesOptions"
            use-input
            input-debounce="0"
            new-value-mode="add-unique"
            label="Select or Type Condition Immunity to Add" v-help="'The creature cannot be affected by this condition.'"
            dense
            outlined
            @update:model-value="(val) => addDefenseItem('conditions', val)"
          >
            <template #prepend>
              <q-icon name="add" />
            </template>
          </q-select>
        </div>

        <div v-if="monster.conditionsList?.length === 0" class="text-caption text-grey-5 q-pa-xs">
          No condition immunities added.
        </div>
        <div
          v-for="(item, idx) in monster.conditionsList"
          :key="'cond-' + idx"
          class="q-pa-xs q-mb-xs rounded-borders"
          style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);"
        >
          <div class="row items-center justify-between no-wrap">
            <q-chip
              dense
              outline
              color="accent"
              class="q-ma-none text-weight-bold"
              style="white-space: normal; height: auto; max-width: calc(100% - 90px); word-break: break-word; line-height: 1.3; padding: 4px 8px;"
            >
              {{ item.type }}
            </q-chip>
            <div class="row items-center q-gutter-x-xs no-wrap">
              <swap-buttons field="conditionsList" :idx="idx" flat dense />
              <q-btn
                flat
                dense
                round
                size="sm"
                color="negative"
                icon="delete"
                @click="removeDefenseItem('conditions', idx)"
              />
            </div>
          </div>

          <div class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col-12 col-sm-6">
              <q-select
                :model-value="getUnifiedSaveOutcome(item)"
                :options="unifiedSaveOutcomeOptions"
                emit-value
                map-options
                label="Save Outcome & Defense Mode" v-help="'What a successful or failed save means here.'"
                dense
                outlined
                clearable
                @update:model-value="(val) => setUnifiedSaveOutcome(item, val)"
              />
            </div>
            <div class="col-12 col-sm-6">
              <mechanic-text-editor v-help="'Enter note (e.g. against charm spells) for the resistances editor.'"
                v-model="item.note"
                label="Note (e.g. against charm spells)"
                dense
                outlined
                @update:model-value="syncDefenses"
              />
            </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import MechanicTextEditor from './MechanicTextEditor.vue'
import MechanicSelectEditor from './MechanicSelectEditor.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, defineComponent } from 'vue'
import { DamageDefenseItem, DefenseModifierMode } from '../models'
import { formatDefenseList } from 'src/core/domain/defense-and-traits-utils'
import { v4 as uuidv4 } from 'uuid'
import SwapButtons from './widgets/SwapButtons.vue'

const DAMAGE_PRESETS = [
  'acid',
  'bludgeoning',
  'cold',
  'fire',
  'force',
  'lightning',
  'necrotic',
  'piercing',
  'poison',
  'psychic',
  'radiant',
  'slashing',
  'thunder',
  'bludgeoning, piercing, and slashing from nonmagical attacks',
  'non-magical non-adamantine bludgeoning',
  'non-magical non-silvered slashing',
]

const CONDITION_PRESETS = [
  'blinded',
  'charmed',
  'deafened',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
]

const UNIFIED_SAVE_OPTIONS = [
  { label: 'Standard / None', value: 'standard' },
  { label: 'Advantage on Saves', value: 'advantage' },
  { label: 'Disadvantage on Saves', value: 'disadvantage' },
  { label: 'Regains HP (Absorbs)', value: 'absorbs' },
  { label: 'On Success: no effect', value: 'On Success: no effect' },
  { label: 'On Success: half damage', value: 'On Success: half damage' },
  { label: 'On Failure: knocked Prone', value: 'On Failure: knocked Prone' },
  { label: 'On Failure: pushed 10 ft.', value: 'On Failure: full damage & pushed 10 ft.' },
]

const RESISTANCE_MODE_OPTIONS = [
  { label: 'Standard', value: 'none' },
  { label: 'Advantage', value: 'advantage' },
  { label: 'Disadvantage', value: 'disadvantage' },
  { label: 'Absorb (Regains HP)', value: 'absorbs' },
]

const VULNERABILITY_MODE_OPTIONS = [
  { label: 'Standard', value: 'none' },
  { label: 'Disadvantage', value: 'disadvantage' },
  { label: 'Advantage', value: 'advantage' },
]

const CONDITION_MODE_OPTIONS = [
  { label: 'Standard Immunity', value: 'none' },
  { label: 'Advantage', value: 'advantage' },
  { label: 'Disadvantage', value: 'disadvantage' },
]

const SAVE_OUTCOME_OPTIONS = [
  'On Success: no effect',
  'On Success: half damage',
  'On Failure: knocked Prone',
  'On Failure: pushed 10 ft.',
  'On Failure: wastes Reaction',
]

const CONDITION_VULNERABILITY_ACTIONS = [
  'cannot take Reactions',
  'disadvantage on attacks until end of turn',
  'falls Prone and ends turn',
  'must Dash/Disengage towards source',
  'must Dodge, Dash, or Disengage',
  'wastes Reaction to move up to speed',
]

const ACQUIRED_CONDITION_OPTIONS = [
  'Blinded',
  'Deafened',
  'Frightened',
  'Incapacitated',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
]

const CONDITION_DURATION_OPTIONS = [
  { label: 'until start of its next turn', value: 'until start of its next turn', category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-play' },
  { label: 'until start of a turn', value: 'until start of a turn', category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-forward-step' },
  { label: 'until end of its next turn', value: 'until end of its next turn', category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-stop' },
  { label: 'until end of a turn', value: 'until end of a turn', category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-backward-step' },
  { label: 'until end of current turn', value: 'until end of current turn', category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-hourglass-end' },
  { label: 'until end of round', value: 'until end of round', category: 'Turn Boundary', color: 'teal-6', icon: 'fa-solid fa-arrows-spin' },
  { label: 'for 1 minute', value: 'for 1 minute', category: 'Time Interval', color: 'cyan-6', icon: 'fa-solid fa-stopwatch' },
  { label: 'for 1 hour', value: 'for 1 hour', category: 'Time Interval', color: 'cyan-6', icon: 'fa-solid fa-clock' },
  { label: 'for 1 day', value: 'for 1 day', category: 'Time Interval', color: 'cyan-6', icon: 'fa-solid fa-calendar-day' },
  { label: 'until Dawn', value: 'until Dawn', category: 'Solar Cycle', color: 'amber-7', icon: 'fa-solid fa-sun' },
  { label: 'until Dusk', value: 'until Dusk', category: 'Solar Cycle', color: 'deep-orange-6', icon: 'fa-solid fa-cloud-sun' },
  { label: 'until Midday', value: 'until Midday', category: 'Solar Cycle', color: 'yellow-8', icon: 'fa-solid fa-certificate' },
  { label: 'until Midnight', value: 'until Midnight', category: 'Solar Cycle', color: 'indigo-6', icon: 'fa-solid fa-moon' },
  { label: 'until a Short Rest', value: 'until a Short Rest', category: 'Rest & Recovery', color: 'green-6', icon: 'fa-solid fa-campground' },
  { label: 'until a Long Rest', value: 'until a Long Rest', category: 'Rest & Recovery', color: 'green-7', icon: 'fa-solid fa-bed' },
  { label: 'until Downtime', value: 'until Downtime', category: 'Rest & Recovery', color: 'blue-grey-6', icon: 'fa-solid fa-house-chimney' },
  { label: 'until regaining HP', value: 'until regaining hit points', category: 'Rest & Recovery', color: 'pink-6', icon: 'fa-solid fa-heart-pulse' },
]

const BENEFIT_OPTIONS = [
  'gains 10 temporary hit points',
  'gains advantage on its next attack roll',
  'regains hit points equal to damage taken',
  'teleports up to 30 ft.',
  'uses its Reaction to fall Prone',
  'uses its Reaction to make an opportunity attack',
  'uses its Reaction to move up to its speed',
]

const BENEFIT_TRIGGER_OPTIONS = [
  { label: 'when hit', value: 'when hit' },
  { label: 'when targeted', value: 'when targeted' },
  { label: 'when taking damage', value: 'when taking damage' },
  { label: 'when subjected to effect', value: 'when subjected to effect' },
]

export default defineComponent({
  name: 'ResistancesEditor',
  components: { MechanicSelectEditor, MechanicTextEditor, SwapButtons },
  setup() {
    const monster = useMonsterStore()

    // Ensure list arrays exist
    if (!Array.isArray(monster.resistancesList)) monster.resistancesList = []
    if (!Array.isArray(monster.immunitiesList)) monster.immunitiesList = []
    if (!Array.isArray(monster.vulnerabilitiesList)) monster.vulnerabilitiesList = []
    if (!Array.isArray(monster.conditionsList)) monster.conditionsList = []
    if (!Array.isArray(monster.conditionVulnerabilitiesList)) monster.conditionVulnerabilitiesList = []
    if (!Array.isArray(monster.conditionResistancesList)) monster.conditionResistancesList = []

    // Seed from string arrays if lists are empty but strings exist
    if (monster.resistancesList.length === 0 && monster.resistances?.length > 0) {
      monster.resistancesList = monster.resistances.map((type) => ({ id: uuidv4(), type }))
    }
    if (monster.immunitiesList.length === 0 && monster.immunities?.length > 0) {
      monster.immunitiesList = monster.immunities.map((type) => ({ id: uuidv4(), type }))
    }
    if (monster.vulnerabilitiesList.length === 0 && monster.vulnerabilities?.length > 0) {
      monster.vulnerabilitiesList = monster.vulnerabilities.map((type) => ({ id: uuidv4(), type }))
    }
    if (monster.conditionsList.length === 0 && monster.conditions?.length > 0) {
      monster.conditionsList = monster.conditions.map((type) => ({ id: uuidv4(), type }))
    }

    if (!monster.defenseCategoryOrder || !Array.isArray(monster.defenseCategoryOrder) || monster.defenseCategoryOrder.length === 0) {
      monster.defenseCategoryOrder = ['vulnerabilities', 'resistances', 'immunities']
    }

    const currentCategoryOrder = computed({
      get: () => monster.defenseCategoryOrder || ['vulnerabilities', 'resistances', 'immunities'],
      set: (val: string[]) => { monster.defenseCategoryOrder = val }
    })

    const swapCategory = (idx: number) => {
      const order = [...currentCategoryOrder.value]
      const nextIdx = (idx + 1) % order.length
      const temp = order[idx]
      order[idx] = order[nextIdx]
      order[nextIdx] = temp
      monster.defenseCategoryOrder = order
      syncDefenses()
    }

    const getItemMode = (item: DamageDefenseItem): DefenseModifierMode => {
      if (item.mode) return item.mode
      if (item.absorbs) return 'absorbs'
      if (item.advantage) return 'advantage'
      if (item.disadvantage) return 'disadvantage'
      return 'none'
    }

    const setItemMode = (item: DamageDefenseItem, mode: DefenseModifierMode) => {
      item.mode = mode
      item.absorbs = mode === 'absorbs'
      item.advantage = mode === 'advantage'
      item.disadvantage = mode === 'disadvantage'
      syncDefenses()
    }

        const getUnifiedSaveOutcome = (item: DamageDefenseItem): string => {
      if (item.saveOutcome) return item.saveOutcome
      if (item.absorbs) return 'absorbs'
      if (item.advantage) return 'advantage'
      if (item.disadvantage) return 'disadvantage'
      return 'standard'
    }

    const setUnifiedSaveOutcome = (item: DamageDefenseItem, val: string | null) => {
      item.advantage = false
      item.disadvantage = false
      item.absorbs = false
      item.saveOutcome = undefined
      if (val === 'advantage') {
        item.advantage = true
        item.mode = 'advantage'
      } else if (val === 'disadvantage') {
        item.disadvantage = true
        item.mode = 'disadvantage'
      } else if (val === 'absorbs') {
        item.absorbs = true
        item.mode = 'absorbs'
      } else if (val && val !== 'standard') {
        item.saveOutcome = val
        item.mode = 'none'
      } else {
        item.mode = 'none'
      }
      syncDefenses()
    }

const syncDefenses = () => {
      monster.resistances = (monster.resistancesList ?? []).map((i) => i.type)
      monster.immunities = (monster.immunitiesList ?? []).map((i) => i.type)
      monster.vulnerabilities = (monster.vulnerabilitiesList ?? []).map((i) => i.type)
      monster.conditions = (monster.conditionsList ?? []).map((i) => i.type)
    }

    const addDefenseItem = (
      category: 'resistances' | 'immunities' | 'vulnerabilities' | 'conditions' | 'conditionVulnerabilities' | 'conditionResistances',
      type: string | null
    ) => {
      if (!type || !type.trim()) return
      const clean = type.trim()
      const item: DamageDefenseItem = {
        id: uuidv4(),
        type: clean,
        category: category.includes('condition') || category === 'conditions' ? 'condition' : 'damage',
        nonmagical: clean.toLowerCase().includes('nonmagical') || clean.toLowerCase().includes('non-magical'),
        mode: 'none',
        absorbs: false,
        advantage: false,
        disadvantage: false,
        saveOutcome: '',
        acquiredCondition: '',
        conditionDuration: '',
        triggeredBenefit: '',
        benefitTrigger: 'when hit',
        benefitDuration: 'instantaneous',
        trigger: '',
        duration: '',
        note: '',
      }

      if (category === 'resistances') {
        const list = (monster.resistancesList ??= [])
        if (list.some((i) => i.type.toLowerCase().trim() === clean.toLowerCase())) return
        list.push(item)
      } else if (category === 'immunities') {
        const list = (monster.immunitiesList ??= [])
        if (list.some((i) => i.type.toLowerCase().trim() === clean.toLowerCase())) return
        list.push(item)
      } else if (category === 'vulnerabilities') {
        const list = (monster.vulnerabilitiesList ??= [])
        if (list.some((i) => i.type.toLowerCase().trim() === clean.toLowerCase())) return
        list.push(item)
      } else if (category === 'conditions') {
        const list = (monster.conditionsList ??= [])
        if (list.some((i) => i.type.toLowerCase().trim() === clean.toLowerCase())) return
        list.push(item)
      } else if (category === 'conditionVulnerabilities') {
        const list = (monster.conditionVulnerabilitiesList ??= [])
        if (list.some((i) => i.type.toLowerCase().trim() === clean.toLowerCase())) return
        list.push(item)
      } else if (category === 'conditionResistances') {
        const list = (monster.conditionResistancesList ??= [])
        if (list.some((i) => i.type.toLowerCase().trim() === clean.toLowerCase())) return
        list.push(item)
      }
      syncDefenses()
    }

    const removeDefenseItem = (
      category: 'resistances' | 'immunities' | 'vulnerabilities' | 'conditions' | 'conditionVulnerabilities' | 'conditionResistances',
      index: number
    ) => {
      if (category === 'resistances') monster.resistancesList?.splice(index, 1)
      else if (category === 'immunities') monster.immunitiesList?.splice(index, 1)
      else if (category === 'vulnerabilities') monster.vulnerabilitiesList?.splice(index, 1)
      else if (category === 'conditions') monster.conditionsList?.splice(index, 1)
      else if (category === 'conditionVulnerabilities') monster.conditionVulnerabilitiesList?.splice(index, 1)
      else if (category === 'conditionResistances') monster.conditionResistancesList?.splice(index, 1)
      syncDefenses()
    }

    // Deduplicated and sorted computed options per defense category
    const vulnerabilityDamageOptions = computed(() => {
      const existing = new Set((monster.vulnerabilitiesList ?? []).map((i) => i.type.toLowerCase().trim()))
      return DAMAGE_PRESETS.filter((d) => !existing.has(d.toLowerCase().trim())).slice().sort((a, b) => a.localeCompare(b))
    })
    const vulnerabilityConditionOptions = computed(() => {
      const existing = new Set((monster.conditionVulnerabilitiesList ?? []).map((i) => i.type.toLowerCase().trim()))
      return CONDITION_PRESETS.filter((c) => !existing.has(c.toLowerCase().trim())).slice().sort((a, b) => a.localeCompare(b))
    })
    const resistanceDamageOptions = computed(() => {
      const existing = new Set((monster.resistancesList ?? []).map((i) => i.type.toLowerCase().trim()))
      return DAMAGE_PRESETS.filter((d) => !existing.has(d.toLowerCase().trim())).slice().sort((a, b) => a.localeCompare(b))
    })
    const conditionResistancesOptions = computed(() => {
      const existing = new Set((monster.conditionResistancesList ?? []).map((i) => i.type.toLowerCase().trim()))
      return CONDITION_PRESETS.filter((c) => !existing.has(c.toLowerCase().trim())).slice().sort((a, b) => a.localeCompare(b))
    })
    const immunityDamageOptions = computed(() => {
      const existing = new Set((monster.immunitiesList ?? []).map((i) => i.type.toLowerCase().trim()))
      return DAMAGE_PRESETS.filter((d) => !existing.has(d.toLowerCase().trim())).slice().sort((a, b) => a.localeCompare(b))
    })
    const conditionImmunitiesOptions = computed(() => {
      const existing = new Set((monster.conditionsList ?? []).map((i) => i.type.toLowerCase().trim()))
      return CONDITION_PRESETS.filter((c) => !existing.has(c.toLowerCase().trim())).slice().sort((a, b) => a.localeCompare(b))
    })

    const resistancesPreview = computed(() => formatDefenseList(monster.resistancesList ?? []))
    const conditionResistancesPreview = computed(() => formatDefenseList(monster.conditionResistancesList ?? []))
    const immunitiesPreview = computed(() => formatDefenseList(monster.immunitiesList ?? []))
    const vulnerabilitiesPreview = computed(() => formatDefenseList(monster.vulnerabilitiesList ?? []))
    const conditionVulnerabilitiesPreview = computed(() => formatDefenseList(monster.conditionVulnerabilitiesList ?? []))
    const conditionsPreview = computed(() => formatDefenseList(monster.conditionsList ?? []))

    return {
      monster,
      damageTypeOptions: DAMAGE_PRESETS,
      conditionTypeOptions: CONDITION_PRESETS,
      vulnerabilityDamageOptions,
      vulnerabilityConditionOptions,
      resistanceDamageOptions,
      conditionResistancesOptions,
      immunityDamageOptions,
      conditionImmunitiesOptions,
      resistanceModeOptions: RESISTANCE_MODE_OPTIONS,
      vulnerabilityModeOptions: VULNERABILITY_MODE_OPTIONS,
      conditionModeOptions: CONDITION_MODE_OPTIONS,
      saveOutcomeOptions: SAVE_OUTCOME_OPTIONS,
      conditionVulnerabilityActionOptions: CONDITION_VULNERABILITY_ACTIONS,
      acquiredConditionOptions: ACQUIRED_CONDITION_OPTIONS,
      conditionDurationOptions: CONDITION_DURATION_OPTIONS,
      benefitOptions: BENEFIT_OPTIONS,
      benefitTriggerOptions: BENEFIT_TRIGGER_OPTIONS,
      getItemMode,
      setItemMode,
      getUnifiedSaveOutcome,
      setUnifiedSaveOutcome,
      unifiedSaveOutcomeOptions: UNIFIED_SAVE_OPTIONS,
      addDefenseItem,
      removeDefenseItem,
      syncDefenses,
      resistancesPreview,
      conditionResistancesPreview,
      immunitiesPreview,
      vulnerabilitiesPreview,
      conditionVulnerabilitiesPreview,
      conditionsPreview,
      currentCategoryOrder,
      swapCategory,
    }
  },
})
</script>
