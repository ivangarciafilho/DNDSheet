<template>
  <div>
    <!-- 7. Hit Points & Hit Dice -->
    <div class="row q-col-gutter-xs items-center q-mt-xs">
      <formula-field
        v-help="'Number of Hit Dice rolled for average and rolled Hit Points.'"
        path="HP.HD"
        :label="$t('monster.hp.hd')"
        class="col-12 col-sm-4"
        outlined
        dense
        @applied="(value: number | string) => monster.setHpModifier(value, monster.stats.CON)"
      >
        <template #append>
          <q-btn
            v-help="$t('monster.setHdByCr')"
            flat
            dense
            round
            color="primary"
            size="sm"
            icon="auto_fix_high"
            @click="monster.setHdByCr"
          />
        </template>
      </formula-field>

      <formula-field
        v-help="'Hit Die size (auto-synced to creature size unless unlocked for manual override).'"
        path="HP.type"
        :label="$t('monster.hp.type')"
        class="col-12 col-sm-4"
        :disable="!monster.hpDieTypeOverride"
        outlined
        dense
      >
        <template #append>
          <lock-toggle-button
            :locked="!monster.hpDieTypeOverride"
            :lock-tooltip="$t('monster.hp.unlockFromSize')"
            :unlock-tooltip="$t('monster.hp.lockToSize')"
            @click="monster.toggleDieTypeOverride"
          />
        </template>
      </formula-field>

      <formula-field
        v-help="'Flat Hit Point bonus (normally Hit Dice multiplied by Constitution modifier) unless unlocked.'"
        path="HP.modifier"
        :disable="!monster.hpModifierOverride"
        :label="$t('monster.hp.modifier')"
        class="col-12 col-sm-4"
        outlined
        dense
        @applied="(value: number | string) => (monster.HP.modifier = Number(value) || 0)"
      >
        <template #append>
          <lock-toggle-button
            :locked="!monster.hpModifierOverride"
            :lock-tooltip="$t('monster.hp.unlockModifier')"
            :unlock-tooltip="$t('monster.hp.lockModifier')"
            @click="monster.toggleHpModifierOverride"
          />
        </template>
      </formula-field>
    </div>

    <!-- 9. Hit Points Defenses & Survival -->
    <q-expansion-item
      v-help="'Configure Bloodied thresholds, Damage Threshold/Reduction, Regeneration, and Mortality rules.'"
      dense
      dense-toggle
      expand-separator
      class="q-mt-sm rounded-borders"
      style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12);"
      icon="favorite_border"
      label="Hit Points Defenses & Survival"
      caption="Bloodied, Damage Threshold/Reduction, Regeneration & Immortality"
    >
      <div class="q-pa-sm q-gutter-y-sm">
        <div class="row items-center justify-between q-px-xs q-mb-xs">
          <q-toggle
            v-model="monster.splitHpRiderRows"
            v-help="'Display every Hit Point rider group on its own indented sub-row beneath Hit Points.'"
            dark
            dense
            size="xs"
            color="red-4"
            label="Split all HP riders into sub-rows"
            class="text-caption text-weight-medium text-red-2"
            @update:model-value="monster.hpRiderSubrows = {}"
          />
        </div>

        <!-- Row 1: Bloodied & Per-Phase Bloodied States -->
        <div class="q-pa-sm rounded-borders" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.25);">
          <div class="row items-center justify-between q-mb-xs q-col-gutter-xs">
            <div class="text-caption text-weight-bold text-red-4">
              Bloodied &amp; Phase Thresholds
            </div>
            <div class="editor-fit-wrap items-center">
              <q-toggle
                v-help="$t('help.defenses.hpSplitSubrows')"
                :model-value="monster.hpRiderSubrows?.bloodied ?? monster.splitHpRiderRows"
                dark
                dense
                size="xs"
                color="red-4"
                label="Sub-Row"
                class="text-caption text-red-2"
                data-contextual-split-hp="bloodied"
                @update:model-value="monster.hpRiderSubrows = { ...monster.hpRiderSubrows, bloodied: $event }"
              />
              <q-badge v-if="(extendedHp.bloodiedSource && extendedHp.bloodiedSource !== 'none') || extendedHp.showBloodied || paragonConfig.poolCount > 1" color="red-5" outline>
                {{ paragonConfig.poolCount > 1 ? `${paragonConfig.poolCount} Stages` : `Bloodied: ${extendedHp.bloodiedSource === 'flat' ? (extendedHp.bloodiedOverride || Math.max(1, Math.floor(monster.avgHp / 2))) : getDynamicSourceValue(extendedHp.bloodiedSource || 'half_hp', extendedHp.bloodiedDice)} HP` }}
              </q-badge>
            </div>
          </div>

          <!-- Single-Stage Bloodied Source Row -->
          <div v-if="!monster.paragonConfig?.poolCount || monster.paragonConfig.poolCount <= 1" class="row q-col-gutter-sm items-center">
            <div class="col-12 col-sm-6">
              <catalog-select
                v-help="'How the Bloodied Hit Point threshold is determined: half HP, fixed value, or dice.'"
                :model-value="extendedHp.bloodiedSource"
                :entries="BLOODIED_SOURCE_ENTRIES"
                preserve-order
                label="Bloodied Threshold Source"
                @update:model-value="(val) => { const next = String(val || 'none'); extendedHp.bloodiedSource = next; extendedHp.showBloodied = next !== 'none' }"
              />
            </div>
            <div v-if="extendedHp.bloodiedSource === 'dice'" class="col-12 col-sm-6">
              <q-input
                v-model="extendedHp.bloodiedDice"
                v-help="$t('help.defenses.hpBloodiedDice')"
                dense
                outlined
                label="Bloodied Dice Formula"
                placeholder="e.g. 4d10 + 10"
                @update:model-value="() => { extendedHp.showBloodied = true }"
              />
            </div>
            <div v-else-if="extendedHp.bloodiedSource === 'flat'" class="col-12 col-sm-6">
              <formula-field
                v-help="'Exact Hit Points at which the creature becomes Bloodied.'"
                path="extendedHp.bloodiedOverride"
                label="Bloodied HP Value"
                dense
                outlined
                @applied="(val: number | string) => { extendedHp.bloodiedOverride = Number(val) || 0; if (extendedHp.bloodiedOverride > 0) extendedHp.showBloodied = true; }"
              />
            </div>
            <div v-else-if="extendedHp.bloodiedSource && extendedHp.bloodiedSource !== 'none'" class="col-12 col-sm-6">
              <div class="q-pa-xs rounded-borders text-caption text-red-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                Resolved: {{ getDynamicSourceValue(extendedHp.bloodiedSource, extendedHp.bloodiedDice) }} HP
              </div>
            </div>
          </div>

          <!-- Multi-Stage Paragon Creature Per-Phase HP Threshold Rows -->
          <div v-if="monster.paragonConfig?.poolCount && monster.paragonConfig.poolCount > 1" class="q-gutter-y-xs q-mt-xs">
            <div class="text-caption text-amber-4 q-mb-xs">
              Configure each stage HP threshold &amp; check <b>Bloodied</b> on any stage (cascades to subsequent stages):
            </div>
            <div
              v-for="(phaseCfg, pIdx) in paragonPhaseRows"
              :key="'paragon-phase-row-' + pIdx"
              data-paragon-phase-row
              class="row q-col-gutter-sm items-center q-pa-xs rounded-borders"
              :style="phaseCfg.isBloodied ? 'background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.45);' : 'background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);'"
              @pointerdown.capture="materializeParagonRows"
              @focusin="materializeParagonRows"
            >
              <div class="col-12 col-sm-2">
                <q-checkbox
                  v-help="'Marks this Paragon stage as Bloodied and cascades the status to subsequent stages.'"
                  :model-value="Boolean(phaseCfg.isBloodied)"
                  color="red-5"
                  dense
                  label="Bloodied"
                  class="text-weight-bold text-red-4"
                  @update:model-value="(val) => onTogglePhaseBloodied(pIdx, Boolean(val))"
                />
              </div>
              <div class="col-12 col-sm-2">
                <q-input
                  v-model="phaseCfg.name"
                  v-help="'Label printed for this Paragon stage, such as Phase 2.'"
                  dense
                  outlined
                  label="Stage Label"
                  @update:model-value="syncParagonPhaseRows"
                />
              </div>
              <div class="col-12 col-sm-4">
                <catalog-select
                  v-help="$t('help.defenses.thresholdSource')"
                  :model-value="phaseCfg.source"
                  :entries="DYNAMIC_SOURCE_ENTRIES"
                  preserve-order
                  label="Threshold Source"
                  @update:model-value="(val) => { phaseCfg.source = String(val || 'flat') as typeof phaseCfg.source; syncParagonPhaseRows() }"
                />
              </div>
              <div v-if="phaseCfg.source === 'dice'" class="col-12 col-sm-2">
                <q-input
                  v-model="phaseCfg.diceFormula"
                  v-help="'Dice expression used to derive this stage threshold (for example 6d10).'"
                  dense
                  outlined
                  label="Dice Formula"
                  placeholder="e.g. 6d10"
                  @update:model-value="syncParagonPhaseRows"
                />
              </div>
              <div v-else-if="!phaseCfg.source || phaseCfg.source === 'flat'" class="col-12 col-sm-2">
                <formula-field
                  v-help="'Fixes the exact Hit Point threshold for this paragon stage instead of scaling automatically.'"
                  :path="`paragonConfig.phaseConfigs[id=${encodeURIComponent(phaseCfg.id || `phase-${pIdx + 1}`)}].hpOverride`"
                  dense
                  outlined
                  clearable
                  label="HP Override"
                  @applied="syncParagonPhaseRows"
                />
              </div>
              <div v-else class="col-12 col-sm-2">
                <div class="q-pa-xs rounded-borders text-caption text-amber-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                  {{ resolvePhaseRowPreview(phaseCfg) }} HP
                </div>
              </div>
              <div class="col-12 col-sm-2 text-right">
                <q-badge :color="phaseCfg.isBloodied ? 'red-8' : 'amber-8'" :text-color="phaseCfg.isBloodied ? 'white' : 'black'" class="text-weight-bold q-pa-xs">
                  {{ phaseCfg.name }}: {{ resolvePhaseRowPreview(phaseCfg) }}{{ isLastBloodiedPhase(pIdx) ? ' [Bloodied]' : '' }}
                </q-badge>
              </div>
            </div>
          </div>
        </div>

        <!-- Row 2: Dedicated Damage Threshold (DT) Row -->
        <div class="q-pa-sm rounded-borders" style="background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.25);">
          <div class="row items-center justify-between q-mb-xs q-col-gutter-xs">
            <div class="text-caption text-weight-bold text-blue-4">
              Damage Threshold (DT - Ignores hits below threshold)
            </div>
            <div class="editor-fit-wrap items-center">
              <q-toggle
                v-help="$t('help.defenses.hpSplitSubrows')"
                :model-value="monster.hpRiderSubrows?.dt ?? monster.splitHpRiderRows"
                dark
                dense
                size="xs"
                color="blue-4"
                label="Sub-Row"
                class="text-caption text-blue-2"
                data-contextual-split-hp="dt"
                @update:model-value="monster.hpRiderSubrows = { ...monster.hpRiderSubrows, dt: $event }"
              />
              <q-badge v-if="(extendedHp.damageThreshold && extendedHp.damageThreshold > 0) || (extendedHp.damageThresholdSource && extendedHp.damageThresholdSource !== 'flat' && extendedHp.damageThresholdSource !== 'none')" color="blue-4" outline>
                DT {{ extendedHp.damageThresholdSource && extendedHp.damageThresholdSource !== 'flat' ? getDynamicSourceValue(extendedHp.damageThresholdSource, extendedHp.damageThresholdDice) : extendedHp.damageThreshold }}
              </q-badge>
            </div>
          </div>
          <div class="row q-col-gutter-sm items-center">
            <div class="col-12 col-sm-4">
              <catalog-select
                v-help="$t('help.defenses.thresholdSource')"
                :model-value="extendedHp.damageThresholdSource"
                :entries="DT_DR_SOURCE_ENTRIES"
                preserve-order
                label="Threshold Value Source"
                @update:model-value="(val) => (extendedHp.damageThresholdSource = String(val || 'flat') as typeof extendedHp.damageThresholdSource)"
              />
            </div>
            <div v-if="extendedHp.damageThresholdSource === 'dice'" class="col-12 col-sm-4">
              <q-input
                v-model="extendedHp.damageThresholdDice"
                v-help="$t('help.defenses.hpBloodiedDice')"
                dense
                outlined
                label="Threshold Dice Formula"
                placeholder="e.g. 2d10"
              />
            </div>
            <div v-else-if="!extendedHp.damageThresholdSource || extendedHp.damageThresholdSource === 'flat' || extendedHp.damageThresholdSource === 'none'" class="col-12 col-sm-4">
              <formula-field
                v-help="'Single-hit damage strictly below this threshold deals 0 damage.'"
                path="extendedHp.damageThreshold"
                label="Damage Threshold Value"
                dense
                outlined
              />
              <q-btn
                v-if="extendedHp.damageThreshold != null"
                v-help="$t('help.defenses.hpClearValue')"
                flat
                dense
                size="sm"
                icon="restart_alt"
                label="Clear value"
                @click="clearHpThreshold('damageThreshold')"
              />
            </div>
            <div v-else class="col-12 col-sm-4">
              <div class="q-pa-xs rounded-borders text-caption text-blue-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                Resolved: DT {{ getDynamicSourceValue(extendedHp.damageThresholdSource, extendedHp.damageThresholdDice) }}
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <catalog-select
                v-help="'Condition or damage type that temporarily disables Damage Threshold until the next turn.'"
                :model-value="extendedHp.damageThresholdDisruption"
                :entries="DISRUPTION_ENTRIES"
                preserve-order
                label="Disrupted By"
                @update:model-value="(val) => (extendedHp.damageThresholdDisruption = String(val || 'none'))"
              />
            </div>
          </div>
          <defense-schedule-fields effect="damageThreshold" label="Damage threshold" />
        </div>

        <!-- Row 3: Dedicated Damage Reduction (DR) Row -->
        <div class="q-pa-sm rounded-borders" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.25);">
          <div class="row items-center justify-between q-mb-xs q-col-gutter-xs">
            <div class="text-caption text-weight-bold text-emerald-4" style="color: #34d399;">
              Damage Reduction (DR - Subtracts from incoming damage)
            </div>
            <div class="editor-fit-wrap items-center">
              <q-toggle
                v-help="$t('help.defenses.hpSplitSubrows')"
                :model-value="monster.hpRiderSubrows?.dr ?? monster.splitHpRiderRows"
                dark
                dense
                size="xs"
                color="teal-4"
                label="Sub-Row"
                class="text-caption text-teal-2"
                data-contextual-split-hp="dr"
                @update:model-value="monster.hpRiderSubrows = { ...monster.hpRiderSubrows, dr: $event }"
              />
              <q-badge v-if="(extendedHp.damageReduction && extendedHp.damageReduction > 0) || (extendedHp.damageReductionSource && extendedHp.damageReductionSource !== 'flat' && extendedHp.damageReductionSource !== 'none')" color="teal-4" outline>
                DR {{ extendedHp.damageReductionSource && extendedHp.damageReductionSource !== 'flat' ? getDynamicSourceValue(extendedHp.damageReductionSource, extendedHp.damageReductionDice) : extendedHp.damageReduction }}
              </q-badge>
            </div>
          </div>
          <div class="row q-col-gutter-sm items-center">
            <div class="col-12 col-sm-4">
              <catalog-select
                v-help="$t('help.defenses.reductionSource')"
                :model-value="extendedHp.damageReductionSource"
                :entries="DT_DR_SOURCE_ENTRIES"
                preserve-order
                label="Reduction Value Source"
                @update:model-value="(val) => (extendedHp.damageReductionSource = String(val || 'flat') as typeof extendedHp.damageReductionSource)"
              />
            </div>
            <div v-if="extendedHp.damageReductionSource === 'dice'" class="col-12 col-sm-4">
              <q-input
                v-model="extendedHp.damageReductionDice"
                v-help="$t('help.defenses.reductionSource')"
                dense
                outlined
                label="Reduction Dice Formula"
                placeholder="e.g. 1d8 + 2"
              />
            </div>
            <div v-else-if="!extendedHp.damageReductionSource || extendedHp.damageReductionSource === 'flat' || extendedHp.damageReductionSource === 'none'" class="col-12 col-sm-4">
              <formula-field
                v-help="'Flat amount subtracted from every incoming hit of matching damage.'"
                path="extendedHp.damageReduction"
                label="Damage Reduction Value"
                dense
                outlined
              />
              <q-btn
                v-if="extendedHp.damageReduction != null"
                v-help="$t('help.defenses.hpClearValue')"
                flat
                dense
                size="sm"
                icon="restart_alt"
                label="Clear value"
                @click="clearHpThreshold('damageReduction')"
              />
            </div>
            <div v-else class="col-12 col-sm-4">
              <div class="q-pa-xs rounded-borders text-caption text-teal-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                Resolved: DR {{ getDynamicSourceValue(extendedHp.damageReductionSource, extendedHp.damageReductionDice) }}
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <catalog-select
                v-help="'Damage type or state that suppresses Damage Reduction until the next turn.'"
                :model-value="extendedHp.damageReductionDisruption"
                :entries="DISRUPTION_ENTRIES"
                preserve-order
                label="Disrupted By"
                @update:model-value="(val) => (extendedHp.damageReductionDisruption = String(val || 'none'))"
              />
            </div>
          </div>
          <defense-schedule-fields effect="damageReduction" label="Damage reduction" />
        </div>

        <!-- Row 5: Unified Regeneration & Temporary Hit Points Module -->
        <div
          class="q-pa-sm rounded-borders"
          style="background: rgba(20, 184, 166, 0.05); border: 1px solid rgba(20, 184, 166, 0.25);"
        >
          <div class="row items-center justify-between q-mb-xs q-col-gutter-xs">
            <div class="text-weight-bold text-caption text-teal-3">
              Regeneration &amp; Temporary Hit Points Module
            </div>
            <div class="editor-fit-wrap items-center">
              <q-toggle
                v-help="$t('help.defenses.hpSplitSubrows')"
                :model-value="monster.hpRiderSubrows?.regen ?? monster.splitHpRiderRows"
                dark
                dense
                size="xs"
                color="teal-4"
                label="Sub-Row"
                class="text-caption text-teal-2"
                data-contextual-split-hp="regen"
                @update:model-value="monster.hpRiderSubrows = { ...monster.hpRiderSubrows, regen: $event }"
              />
              <q-badge v-if="regenPreview" color="positive" outline class="q-pa-xs">
                {{ regenPreview }}
              </q-badge>
              <q-btn
                v-if="extendedHp.regeneration.enabled"
                v-help="$t('help.defenses.disruptionDisable')"
                flat
                dense
                size="xs"
                color="grey-5"
                icon="close"
                label="Disable"
                @click="extendedHp.regeneration.enabled = false"
              />
            </div>
          </div>

          <div class="q-gutter-y-xs">
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-4">
                <catalog-select
                  v-help="'Choose between standard Regeneration, Temporary Hit Points, or elemental absorption.'"
                  :model-value="extendedHp.regeneration.recoveryType"
                  :entries="RECOVERY_TYPE_ENTRIES"
                  preserve-order
                  label="Recovery Mode"
                  @update:model-value="(val) => { extendedHp.regeneration.recoveryType = String(val || 'regeneration') as typeof extendedHp.regeneration.recoveryType; extendedHp.regeneration.enabled = true }"
                />
              </div>
              <div class="col-12 col-sm-4">
                <catalog-select
                  v-help="'Whether recovered Hit Points use a fixed number, dice roll, or scaling formula.'"
                  :model-value="extendedHp.regeneration.valueSource"
                  :entries="DYNAMIC_SOURCE_ENTRIES"
                  preserve-order
                  label="Value Source"
                  @update:model-value="(val) => { extendedHp.regeneration.valueSource = String(val || 'flat') as typeof extendedHp.regeneration.valueSource; extendedHp.regeneration.enabled = true }"
                />
              </div>
              <div v-if="!extendedHp.regeneration.valueSource || extendedHp.regeneration.valueSource === 'flat'" class="col-12 col-sm-4">
                <formula-field
                  v-help="'Hit Points or Temporary Hit Points regained each time this recovery effect triggers.'"
                  path="extendedHp.regeneration.amount"
                  label="Amount"
                  dense
                  outlined
                  @applied="(val) => { extendedHp.regeneration.enabled = Number(val) > 0 }"
                />
              </div>
              <div v-else-if="extendedHp.regeneration.valueSource === 'dice' || extendedHp.regeneration.valueSource.startsWith('dice_')" class="col-12 col-sm-4">
                <q-input
                  v-model="extendedHp.regeneration.diceFormula"
                  v-help="'Dice expression rolled for recovered Hit Points (for example 2d10 + 5).'"
                  dense
                  outlined
                  label="Dice Formula"
                  placeholder="e.g. 2d10 + 5"
                  @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                />
              </div>
              <div v-else class="col-12 col-sm-4">
                <div class="q-pa-xs rounded-borders text-caption text-teal-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                  Resolved: +{{ getDynamicSourceValue(extendedHp.regeneration.valueSource, extendedHp.regeneration.diceFormula) }}
                </div>
              </div>
            </div>

            <div class="row q-col-gutter-sm items-center q-mt-xs">
              <div class="col-12 col-sm-4">
                <catalog-select
                  v-help="'Turn timing or combat event that activates this healing or Temporary HP gain.'"
                  :model-value="extendedHp.regeneration.frequency"
                  :entries="FREQUENCY_ENTRIES"
                  preserve-order
                  label="Frequency & Trigger"
                  @update:model-value="(val) => onRegenFrequencyChanged(String(val || 'turn'))"
                />
              </div>
              <div v-if="extendedHp.regeneration.recoveryType === 'absorb_hp' || extendedHp.regeneration.recoveryType === 'absorb_temp_hp' || extendedHp.regeneration.frequency === 'damage_taken'" class="col-12 col-sm-4">
                <catalog-select
                  v-help="'Damage type absorbed into Hit Points or Temporary Hit Points.'"
                  :model-value="extendedHp.regeneration.triggeredByDamageType"
                  catalog-id="damageTypes"
                  label="Trigger Damage Type"
                  @update:model-value="(val) => { const next = String(val || 'fire'); extendedHp.regeneration.triggeredByDamageType = next; onRegenDamageTypeTriggerChanged(next) }"
                />
              </div>
              <div v-else class="col-12 col-sm-4">
                <catalog-select
                  v-help="$t('help.defenses.disruptionDamageTypes')"
                  :model-value="extendedHp.regeneration.disruptedByTypes ?? []"
                  catalog-id="damageTypes"
                  multiple
                  use-chips
                  clearable
                  label="Disrupted by Damage Type(s)"
                  @update:model-value="(val) => { extendedHp.regeneration.disruptedByTypes = Array.isArray(val) ? val.map(String) : []; extendedHp.regeneration.enabled = true }"
                />
              </div>
              <div class="col-12 col-sm-4">
                <catalog-select
                  v-help="'Choose whether regeneration renders inline in Hit Points, as a trait, or in both places.'"
                  :model-value="extendedHp.regeneration.displayMode"
                  :entries="DISPLAY_MODE_ENTRIES"
                  preserve-order
                  :searchable="false"
                  label="Display Format"
                  @update:model-value="(val) => { extendedHp.regeneration.displayMode = String(val || 'both') as typeof extendedHp.regeneration.displayMode; extendedHp.regeneration.enabled = true }"
                />
              </div>
            </div>

            <!-- Special Heuristic Conditions Row -->
            <div class="row q-col-gutter-sm items-center q-mt-xs">
              <div class="col-12 col-sm-6">
                <catalog-select
                  v-help="$t('help.defenses.disruptionCondition')"
                  :model-value="extendedHp.regeneration.conditionModifier"
                  :entries="REGEN_CONDITION_MODIFIER_ENTRIES"
                  preserve-order
                  label="Special Condition / Trigger Heuristic"
                  @update:model-value="(val) => { extendedHp.regeneration.conditionModifier = String(val || 'none') as typeof extendedHp.regeneration.conditionModifier; extendedHp.regeneration.enabled = true }"
                />
              </div>
              <div v-if="extendedHp.regeneration.conditionModifier === 'max_hp_reduction'" class="col-12 col-sm-6">
                <catalog-select
                  v-help="'How long a Hit Point maximum reduction penalty persists before clearing.'"
                  :model-value="extendedHp.regeneration.maxHpReductionUntil"
                  :entries="MAX_HP_REDUCTION_UNTIL_ENTRIES"
                  preserve-order
                  label="Maximum HP Reduction Duration"
                  @update:model-value="(val) => { extendedHp.regeneration.maxHpReductionUntil = String(val || 'long rest'); extendedHp.regeneration.enabled = true }"
                />
              </div>
              <div v-else class="col-12 col-sm-6">
                <mechanic-text-editor
                  v-model="extendedHp.regeneration.disruptedByNote"
                  v-help="$t('help.defenses.disruptionCustomNote')"
                  dense
                  outlined
                  label="Custom Disruption / Condition Note"
                  placeholder="e.g. if head is severed"
                  @update:model-value="() => { extendedHp.regeneration.enabled = true }"
                />
              </div>
            </div>
          </div>
          <defense-schedule-fields effect="regeneration" label="Regeneration / temporary HP" />
        </div>

        <!-- Row 6: Immortality / Undead Fortitude / Death Prevention Module -->
        <div
          class="q-pa-sm rounded-borders"
          style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.25);"
        >
          <div class="row items-center justify-between q-mb-xs q-col-gutter-xs">
            <div class="text-caption text-weight-bold text-amber-4">
              Mortality &amp; Death Prevention (Mortal / Immortal / Undead Fortitude)
            </div>
            <div class="editor-fit-wrap items-center">
              <q-toggle
                v-help="$t('help.defenses.hpSplitSubrows')"
                :model-value="monster.hpRiderSubrows?.mortality ?? monster.splitHpRiderRows"
                dark
                dense
                size="xs"
                color="amber-4"
                label="Sub-Row"
                class="text-caption text-amber-2"
                data-contextual-split-hp="mortality"
                @update:model-value="monster.hpRiderSubrows = { ...monster.hpRiderSubrows, mortality: $event }"
              />
              <q-badge v-if="deathPrevention.enabled && deathPrevention.name !== 'Mortal' && deathPreventionPreview" color="amber-5" outline class="q-pa-xs">
                {{ deathPreventionPreview }}
              </q-badge>
            </div>
          </div>

          <div class="row q-col-gutter-sm items-center">
            <div class="col-12 col-sm-4">
              <catalog-select
                v-help="$t('help.defenses.mortalityTemplate')"
                :model-value="deathPrevention.name"
                :entries="DEATH_PREVENTION_TEMPLATE_ENTRIES"
                preserve-order
                allow-custom
                label="Mortality / Trait Template"
                @update:model-value="(val) => { const next = String(val || 'Mortal'); deathPrevention.name = next; onDeathPreventionTemplateChanged(next) }"
              />
            </div>
            <div v-if="deathPrevention.name && deathPrevention.name !== 'Mortal'" class="col-12 col-sm-4">
              <catalog-select
                v-help="$t('help.defenses.immortalityRule')"
                :model-value="deathPrevention.dcRule"
                :entries="DEATH_PREVENTION_RULE_ENTRIES"
                preserve-order
                label="Immortality / Survival Rule"
                @update:model-value="(val) => { const raw = String(val || 'always_survives'); deathPrevention.dcRule = raw as typeof deathPrevention.dcRule; onDeathPreventionRuleChanged(raw) }"
              />
            </div>
            <div v-if="deathPrevention.name && deathPrevention.name !== 'Mortal'" class="col-12 col-sm-4">
              <catalog-select
                v-help="'Choose whether death prevention renders in Hit Points, as a trait, or in both places.'"
                :model-value="deathPrevention.displayMode"
                :entries="DISPLAY_MODE_ENTRIES"
                preserve-order
                :searchable="false"
                label="Display Format"
                @update:model-value="(val) => (deathPrevention.displayMode = String(val || 'both') as typeof deathPrevention.displayMode)"
              />
            </div>
          </div>

          <div v-if="deathPrevention.name && deathPrevention.name !== 'Mortal'" class="q-mt-xs q-gutter-y-xs">
            <!-- Critical Hits to Kill Mode -->
            <div v-if="deathPrevention.dcRule === 'until_x_crits'" class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-4">
                <formula-field
                  v-help="'Number of critical hits required to destroy an immortal creature.'"
                  path="extendedHp.deathPrevention.critHitsToKill"
                  label="Critical Hits to Slay (X)"
                  dense
                  outlined
                />
              </div>
              <div class="col-12 col-sm-8 text-caption text-amber-3">
                Hides numeric HP on statblock: <code>Immortal (Until being hit by {{ deathPrevention.critHitsToKill || 3 }} Critical Hits)</code>
              </div>
            </div>

            <!-- Return to Life HP Source & Saving Throw Configuration -->
            <div v-else-if="!deathPrevention.hideHp" class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-4">
                <catalog-select
                  v-help="$t('help.defenses.returnHpSource')"
                  :model-value="deathPrevention.returnHpSource"
                  :entries="RETURN_HP_SOURCE_ENTRIES"
                  preserve-order
                  label="Return HP Source"
                  @update:model-value="(val) => (deathPrevention.returnHpSource = String(val || '1'))"
                />
              </div>
              <div v-if="deathPrevention.returnHpSource === 'flat'" class="col-12 col-sm-3">
                <formula-field
                  v-help="'Hit Points restored when the creature survives or returns to life.'"
                  path="extendedHp.deathPrevention.returnHpValue"
                  label="Return HP Value"
                  dense
                  outlined
                  @applied="(val) => { deathPrevention.returnHpAmount = Number(val) || 0 }"
                />
              </div>
              <div v-else-if="deathPrevention.returnHpSource === 'dice' || deathPrevention.returnHpSource?.startsWith('dice_')" class="col-12 col-sm-3">
                <q-input
                  v-model="deathPrevention.returnHpDice"
                  v-help="$t('help.defenses.returnHpDice')"
                  dense
                  outlined
                  label="Return HP Dice Formula"
                  placeholder="e.g. 2d8 + 4"
                />
              </div>
              <div v-else class="col-12 col-sm-3">
                <div class="q-pa-xs rounded-borders text-caption text-amber-3 text-weight-bold" style="background: rgba(255,255,255,0.05); height: 40px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                  Resolved: {{ getDynamicSourceValue(deathPrevention.returnHpSource || '1', deathPrevention.returnHpDice) }} HP
                </div>
              </div>
              <div v-if="deathPrevention.requiresSave || deathPrevention.dcRule === 'custom_save'" class="col-6 col-sm-2">
                <catalog-select
                  v-help="'Ability used for the survival saving throw.'"
                  :model-value="deathPrevention.saveStat"
                  :entries="SAVE_SHORT_ABILITY_ENTRIES"
                  preserve-order
                  :searchable="false"
                  label="Save Stat"
                  @update:model-value="(val) => (deathPrevention.saveStat = String(val || 'CON'))"
                />
              </div>
              <div v-if="deathPrevention.requiresSave || deathPrevention.dcRule === 'custom_save'" class="col-6 col-sm-3">
                <formula-field
                  v-help="'Difficulty Class needed to survive reaching 0 Hit Points.'"
                  path="extendedHp.deathPrevention.saveDc"
                  label="Save DC"
                  dense
                  outlined
                />
              </div>
            </div>

            <!-- Revival Timing / Timeframe -->
            <div v-if="!deathPrevention.hideHp && deathPrevention.dcRule !== 'until_x_crits'" class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-6">
                <catalog-select
                  v-help="'When the creature reforms or returns to consciousness after hitting 0 HP.'"
                  :model-value="deathPrevention.returnTimeframe"
                  :entries="REVIVAL_TIMEFRAME_ENTRIES"
                  preserve-order
                  :searchable="false"
                  label="Revival Timing"
                  @update:model-value="(val) => (deathPrevention.returnTimeframe = String(val || 'none') as typeof deathPrevention.returnTimeframe)"
                />
              </div>
            </div>

            <!-- Death Burst Damage Configuration -->
            <div v-if="deathPrevention.dcRule === 'upon_death_burst' || deathPrevention.uponDeathDealsDamage" class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-3">
                <formula-field
                  v-help="'Damage dealt to nearby targets when the creature dies and explodes.'"
                  path="extendedHp.deathPrevention.deathBurstDamageAmount"
                  label="Death Burst Damage"
                  dense
                  outlined
                />
              </div>
              <div class="col-12 col-sm-3">
                <catalog-select
                  v-help="'Damage type inflicted by the creature death burst.'"
                  :model-value="deathPrevention.deathBurstDamageType"
                  catalog-id="damageTypes"
                  label="Burst Damage Type"
                  @update:model-value="(val) => (deathPrevention.deathBurstDamageType = String(val || 'Radiant'))"
                />
              </div>
              <div class="col-12 col-sm-3">
                <catalog-select
                  v-help="$t('help.defenses.targetFilter')"
                  :model-value="deathPrevention.deathBurstTargetFilter"
                  :entries="BURST_TARGET_FILTER_ENTRIES"
                  preserve-order
                  allow-custom
                  label="Target Filter"
                  @update:model-value="(val) => (deathPrevention.deathBurstTargetFilter = String(val || 'Creatures'))"
                />
              </div>
              <div class="col-12 col-sm-3">
                <formula-field
                  v-help="'Blast radius in feet around the dying creature.'"
                  path="extendedHp.deathPrevention.deathBurstRange"
                  label="Burst Radius (ft)"
                  dense
                  outlined
                />
              </div>
            </div>

            <!-- Exceptions & Custom Note -->
            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-6">
                <catalog-select
                  v-help="$t('help.defenses.revivalExceptions')"
                  :model-value="deathPrevention.exceptions ?? []"
                  :entries="DEATH_EXCEPTION_ENTRIES"
                  multiple
                  use-chips
                  clearable
                  allow-custom
                  label="Exceptions (Bypass Revival)"
                  @update:model-value="(val) => (deathPrevention.exceptions = Array.isArray(val) ? val.map(String) : [])"
                />
              </div>
              <div class="col-12 col-sm-6">
                <mechanic-text-editor
                  v-model="deathPrevention.customNote"
                  v-help="$t('help.defenses.revivalCustomException')"
                  label="Custom Exception / Condition Note"
                  dense
                  outlined
                  placeholder="e.g. or while in sunlight"
                />
              </div>
            </div>
          </div>
          <defense-schedule-fields v-if="deathPrevention.enabled && deathPrevention.name !== 'Mortal'" effect="deathPrevention" label="Death prevention" />
        </div>
      </div>

      <basic-riders-editor scope="hp" label="Hit point riders" />
      <basic-riders-editor scope="deathThroes" label="Death Throes" />
      <basic-riders-editor scope="onDamage" label="On Damage" />
    </q-expansion-item>
  </div>
</template>

<script setup lang="ts">
import CatalogSelect from 'src/components/kit/CatalogSelect.vue'
import FormulaField from 'src/components/kit/FormulaField.vue'
import BasicRidersEditor from '../BasicRidersEditor.vue'
import DefenseScheduleFields from '../DefenseScheduleFields.vue'
import LockToggleButton from '../../LockToggleButton.vue'
import MechanicTextEditor from '../MechanicTextEditor.vue'
import {
  BLOODIED_SOURCE_ENTRIES,
  BURST_TARGET_FILTER_ENTRIES,
  DEATH_EXCEPTION_ENTRIES,
  DEATH_PREVENTION_RULE_ENTRIES,
  DEATH_PREVENTION_TEMPLATE_ENTRIES,
  DISPLAY_MODE_ENTRIES,
  DISRUPTION_ENTRIES,
  DT_DR_SOURCE_ENTRIES,
  DYNAMIC_SOURCE_ENTRIES,
  FREQUENCY_ENTRIES,
  MAX_HP_REDUCTION_UNTIL_ENTRIES,
  RECOVERY_TYPE_ENTRIES,
  REGEN_CONDITION_MODIFIER_ENTRIES,
  RETURN_HP_SOURCE_ENTRIES,
  REVIVAL_TIMEFRAME_ENTRIES,
  SAVE_SHORT_ABILITY_ENTRIES,
} from './basics-catalogs'
import { useBasicsContext } from './useBasicsContext'

const {
  monster,
  extendedHp,
  deathPrevention,
  paragonConfig,
  paragonPhaseRows,
  clearHpThreshold,
  getDynamicSourceValue,
  regenPreview,
  deathPreventionPreview,
  onRegenDamageTypeTriggerChanged,
  onRegenFrequencyChanged,
  onDeathPreventionTemplateChanged,
  onDeathPreventionRuleChanged,
  materializeParagonRows,
  resolvePhaseRowPreview,
  syncParagonPhaseRows,
  onTogglePhaseBloodied,
  isLastBloodiedPhase,
} = useBasicsContext()
</script>
