<template>
  <div class="chain-outcomes">
    <template v-if="mode === 'outcomes'">
      <!-- Outcomes Matrix / Sector Notice -->
      <div class="text-caption text-amber-3 q-mb-xs flex items-center justify-between">
        <span>Modular Sectorized Outcomes (Up to 4 Regions)</span>
      </div>

      <fieldset v-for="(outcome, index) in outcomes" :key="index" class="chain-outcomes__item">
        <legend class="chain-outcomes__legend">Outcome {{ index + 1 }} {{ outcome.targetFilter ? `· [${outcome.targetFilter}]` : '' }}</legend>
        
        <!-- Row 1: When (Trigger), Target Filter & Sector Quadrant -->
        <div class="row q-col-gutter-xs items-center">
          <div class="col-12 col-sm-4">
            <q-input v-help="'Enter when for the chain outcomes editor.'"
              :model-value="outcome.trigger"
              dense
              outlined
              dark
              label="When"
              hint="hit, miss, failure, success, etc."
              :list="`${uid}-triggers`"
              :autofocus="index === 0"
              @update:model-value="(value: string | number | null) => setOutcome(index, { trigger: String(value ?? '') })"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-input v-help="'Enter target scope / filter for the chain outcomes editor.'"
              :model-value="outcome.targetFilter ?? ''"
              dense
              outlined
              dark
              label="Target Scope / Filter"
              placeholder="e.g. Allies, Hostile creatures"
              :list="`${uid}-target-filters`"
              @update:model-value="(value: string | number | null) => setOutcome(index, { targetFilter: String(value ?? '') })"
            />
          </div>
          <div class="col-12 col-sm-4">
            <q-select v-help="'Choose sector for the chain outcomes editor.'"
              :model-value="outcome.layoutSector || 'all'"
              :options="sectorOptions"
              emit-value
              map-options
              dense
              outlined
              dark
              label="Sector"
              @update:model-value="(val: string) => setOutcome(index, { layoutSector: val })"
            />
          </div>
          <div class="col-12 q-mt-xs">
            <q-input v-help="'Enter rider (optional condition/clause) for the chain outcomes editor.'"
              :model-value="outcome.rider ?? ''"
              dense
              outlined
              dark
              label="Rider (optional condition/clause)"
              placeholder="e.g. until end of turn they do not benefit from being Invisible"
              @update:model-value="(value: string | number | null) => setOutcome(index, { rider: String(value ?? '') })"
            />
          </div>
        </div>
        <!-- A11.5 recipient, references and presentation -->
        <div class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12 col-sm-5">
            <q-input v-help="'Who this result applies to, e.g. “each creature in the area”.'" :model-value="outcome.recipient ?? ''" dense outlined dark label="Applies to (optional)" @update:model-value="(value: string | number | null) => setOutcome(index, { recipient: String(value ?? '') || undefined })" />
          </div>
          <div class="col-12 col-sm-4">
            <q-select v-help="'Earlier results this one builds on, e.g. “half as much” on a success.'" :model-value="outcome.refs ?? []" :options="refOptions(index)" multiple emit-value map-options dense outlined dark label="Builds on" @update:model-value="(value: string[]) => setOutcome(index, { refs: value })" />
          </div>
          <div class="col-12 col-sm-3">
            <q-select v-help="'How the clause is laid out; does not change the rules.'" :model-value="outcome.presentation ?? 'inline'" :options="['inline', 'vertical', 'horizontal']" dense outlined dark label="Layout" @update:model-value="(value: string) => setOutcome(index, { presentation: value as 'inline' | 'vertical' | 'horizontal' })" />
          </div>
          <div v-for="issue in issuesFor(outcome)" :key="issue.kind + issue.message" class="col-12 text-caption text-warning">⚠ {{ issue.message }}</div>
        </div>

        <!-- Row 2: Effects (Damage / Text) -->
        <div v-for="(effect, effectIndex) in outcome.effects" :key="effectIndex" class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-auto">
            <q-btn-toggle
              :model-value="effect.kind === 'text' ? 'text' : 'damage'"
              :options="effectKinds"
              dense
              no-caps
              unelevated
              size="sm"
              toggle-color="amber-9"
              color="grey-8"
              @update:model-value="(kind: 'damage' | 'text') => setEffect(index, effectIndex, { kind })"
            />
          </div>
          <template v-if="effect.kind !== 'text'">
            <div class="col">
              <q-input v-help="'Enter damage for the chain outcomes editor.'"
                :model-value="effect.formula ?? ''"
                dense
                outlined
                dark
                label="Damage"
                placeholder="2d6 + STR_MOD"
                @update:model-value="(value: string | number | null) => setEffect(index, effectIndex, { formula: String(value ?? '') })"
              />
            </div>
            <div class="col-12 col-sm-4">
              <q-input v-help="'Enter type for the chain outcomes editor.'"
                :model-value="effect.damageType ?? ''"
                dense
                outlined
                dark
                label="Type"
                :list="`${uid}-damage`"
                @update:model-value="(value: string | number | null) => setEffect(index, effectIndex, { damageType: String(value ?? '') })"
              />
            </div>
          </template>
          <div v-else class="col">
            <q-input v-help="'Enter effect for the chain outcomes editor.'"
              :model-value="effect.text ?? ''"
              dense
              outlined
              dark
              label="Effect"
              placeholder="e.g. gains Temporary Hit Points equal to total rolled"
              @update:model-value="(value: string | number | null) => setEffect(index, effectIndex, { text: String(value ?? '') })"
            />
          </div>
          <div class="col-auto">
            <q-btn flat round dense size="sm" icon="close" :aria-label="`Remove effect ${effectIndex + 1}`" @click="removeEffect(index, effectIndex)" />
          </div>
        </div>

        <!-- Optional Random Dice Table (Chaos Bolt / Confusion / Wild Magic outcomes) -->
        <div v-if="outcome.diceTable && outcome.diceTable.length" class="q-mt-sm q-pa-xs rounded-borders" style="background: rgba(0,0,0,0.2); border: 1px dashed rgba(255,255,255,0.15);">
          <div class="text-caption text-cyan-3 flex items-center justify-between q-mb-xs">
            <span>🎲 Random Dice Roll Table</span>
            <q-btn v-help="'Add Roll in the chain outcomes editor.'" flat round dense size="xs" icon="add" label="Add Roll" @click="addDiceRow(index)" />
          </div>
          <div v-for="(dRow, rIdx) in outcome.diceTable" :key="rIdx" class="row q-col-gutter-xs items-center q-mb-xs">
            <div class="col-3">
              <q-input v-help="'Enter roll for the chain outcomes editor.'"
                :model-value="dRow.roll"
                dense
                outlined
                dark
                label="Roll"
                placeholder="1-2"
                @update:model-value="(val: string | number | null) => updateDiceRow(index, rIdx, { roll: String(val ?? '') })"
              />
            </div>
            <div class="col">
              <q-input v-help="'Enter outcome effect for the chain outcomes editor.'"
                :model-value="dRow.effect"
                dense
                outlined
                dark
                label="Outcome Effect"
                placeholder="Random effect text..."
                @update:model-value="(val: string | number | null) => updateDiceRow(index, rIdx, { effect: String(val ?? '') })"
              />
            </div>
            <div class="col-auto">
              <q-btn flat round dense size="xs" icon="close" @click="removeDiceRow(index, rIdx)" />
            </div>
          </div>
        </div>

        <div class="row q-gutter-xs q-mt-xs items-center justify-between">
          <div class="row q-gutter-xs">
            <q-btn v-help="'Effect in the chain outcomes editor.'" flat dense no-caps size="sm" icon="add" label="Effect" @click="addEffect(index)" />
            <q-btn flat dense no-caps size="sm" icon="casino" :label="outcome.diceTable && outcome.diceTable.length ? 'Add Table Row' : '+ Dice Table'" @click="addDiceRow(index)" />
          </div>
          <q-btn v-help="'Remove outcome in the chain outcomes editor.'" flat dense no-caps size="sm" icon="delete" color="red-4" label="Remove outcome" @click="removeOutcome(index)" />
        </div>
      </fieldset>
      <q-btn v-help="'Add Outcome in the chain outcomes editor.'" flat dense no-caps size="sm" icon="add" label="Add Outcome" @click="addOutcome" />

      <!-- Native suggestions: a Quasar select here would open a popup inside the editor's popup. -->
      <datalist :id="`${uid}-triggers`">
        <option v-for="trigger in triggers" :key="trigger" :value="trigger" />
      </datalist>
      <datalist :id="`${uid}-target-filters`">
        <option v-for="tf in targetFilters" :key="tf" :value="tf" />
      </datalist>
      <datalist :id="`${uid}-damage`">
        <option v-for="type in damageTypes" :key="type" :value="type" />
      </datalist>
    </template>

    <template v-else>
      <div v-for="(effect, index) in effects" :key="index" class="row q-col-gutter-xs items-center q-mb-xs">
        <div class="col-12 col-sm-4">
          <q-input v-help="'Enter case for the chain outcomes editor.'"
            :model-value="effect.case"
            dense
            outlined
            dark
            label="Case"
            :autofocus="index === 0"
            @update:model-value="(value: string | number | null) => setLegacy(index, { case: String(value ?? '') })"
          />
        </div>
        <div class="col">
          <q-input v-help="'Enter effect for the chain outcomes editor.'"
            :model-value="effect.effect"
            dense
            outlined
            dark
            label="Effect"
            @update:model-value="(value: string | number | null) => setLegacy(index, { effect: String(value ?? '') })"
          />
        </div>
        <div class="col-auto">
          <q-btn flat round dense size="sm" icon="close" :aria-label="`Remove line ${index + 1}`" @click="removeLegacy(index)" />
        </div>
      </div>
      <q-btn v-help="'Line in the chain outcomes editor.'" flat dense no-caps size="sm" icon="add" label="Line" @click="addLegacy" />
    </template>
  </div>
</template>

<script lang="ts">
import { newOutcomeId, triggerLead, validateOutcomes } from 'src/core/domain/outcome-graph'
import { computed, defineComponent, PropType } from 'vue'
import { DAMAGE_TYPES, OUTCOME_TRIGGERS } from 'src/core/domain/action-composer'
import type { AbilityOutcome, ActionEffect, EffectClause, OutcomeDiceTableRow } from 'src/core/domain/types'

let instances = 0

export default defineComponent({
  name: 'ChainOutcomesEditor',
  props: {
    modelValue: { type: Array as PropType<unknown[]>, required: true },
    mode: { type: String as PropType<'outcomes' | 'effects'>, default: 'outcomes' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const uid = `chain-outcomes-${++instances}`
    // Drafts are replaced, never mutated, so the parent's copy stays the single source of truth.
    const outcomes = computed(() => props.modelValue as AbilityOutcome[])
    const effects = computed(() => props.modelValue as ActionEffect[])
    const emitOutcomes = (next: AbilityOutcome[]) => emit('update:modelValue', next)
    const emitEffects = (next: ActionEffect[]) => emit('update:modelValue', next)

    const setOutcome = (index: number, change: Partial<AbilityOutcome>) =>
      emitOutcomes(outcomes.value.map((outcome, i) => (i === index ? { ...outcome, ...change } : outcome)).map((o) => (o.id ? o : { ...o, id: newOutcomeId() })))

    const setEffect = (index: number, effectIndex: number, change: Partial<EffectClause>) =>
      emitOutcomes(outcomes.value.map((outcome, i) => i !== index ? outcome : {
        ...outcome,
        effects: outcome.effects.map((effect, j) => (j === effectIndex ? { ...effect, ...change } : effect)),
      }))

    const addEffect = (index: number) =>
      emitOutcomes(outcomes.value.map((outcome, i) => i !== index ? outcome : {
        ...outcome,
        effects: [...outcome.effects, { kind: 'damage', formula: '', damageType: '' }],
      }))

    const removeEffect = (index: number, effectIndex: number) =>
      emitOutcomes(outcomes.value.map((outcome, i) => i !== index ? outcome : {
        ...outcome,
        effects: outcome.effects.filter((_, j) => j !== effectIndex),
      }))

    const addOutcome = () =>
      emitOutcomes([...outcomes.value, { id: newOutcomeId(), trigger: outcomes.value.length ? 'success' : 'hit', effects: [{ kind: 'damage', formula: '', damageType: '' }] }])

    const removeOutcome = (index: number) => emitOutcomes(outcomes.value.filter((_, i) => i !== index))

    const addDiceRow = (index: number) => {
      const outcome = outcomes.value[index]
      const existing = outcome.diceTable || []
      const nextRoll = `${existing.length + 1}`
      setOutcome(index, {
        diceTable: [...existing, { roll: nextRoll, effect: '' }]
      })
    }

    const updateDiceRow = (outcomeIndex: number, rowIndex: number, change: Partial<OutcomeDiceTableRow>) => {
      const outcome = outcomes.value[outcomeIndex]
      const existing = outcome.diceTable || []
      const updated = existing.map((r, i) => i === rowIndex ? { ...r, ...change } : r)
      setOutcome(outcomeIndex, { diceTable: updated })
    }

    const removeDiceRow = (outcomeIndex: number, rowIndex: number) => {
      const outcome = outcomes.value[outcomeIndex]
      const existing = outcome.diceTable || []
      setOutcome(outcomeIndex, { diceTable: existing.filter((_, i) => i !== rowIndex) })
    }

    const setLegacy = (index: number, change: Partial<ActionEffect>) =>
      emitEffects(effects.value.map((effect, i) => (i === index ? { ...effect, ...change } : effect)))
    const addLegacy = () => emitEffects([...effects.value, { case: '', effect: '' }])
    const removeLegacy = (index: number) => emitEffects(effects.value.filter((_, i) => i !== index))

    return {
      uid,
      outcomes,
      effects,
      setOutcome,
      setEffect,
      addEffect,
      removeEffect,
      addOutcome,
      removeOutcome,
      addDiceRow,
      updateDiceRow,
      removeDiceRow,
      refOptions: (index: number) => outcomes.value.filter((o, i) => i !== index && o.id).map((o) => ({ label: triggerLead(o.trigger), value: o.id as string })),
      issuesFor: (o: AbilityOutcome) => validateOutcomes(outcomes.value).filter((x) => x.outcomeId === o.id && x.kind !== 'empty'),
      setLegacy,
      addLegacy,
      removeLegacy,
      triggers: [
        ...OUTCOME_TRIGGERS,
        'miss',
        'willingly fails',
        'start of turn',
        'end of turn',
        'critical hit',
      ],
      targetFilters: [
        'Allies',
        'Hostile creatures',
        'Undead and Fiends',
        'Material Plane',
        'Ethereal Plane',
        'Willing creatures',
        'Creatures that can see you',
        'Bloodied creatures',
      ],
      sectorOptions: [
        { label: 'All Sectors (Default)', value: 'all' },
        { label: 'Quadrant 1 (Top-Left)', value: 'top_left' },
        { label: 'Quadrant 2 (Top-Right)', value: 'top_right' },
        { label: 'Quadrant 3 (Bottom-Left)', value: 'bottom_left' },
        { label: 'Quadrant 4 (Bottom-Right)', value: 'bottom_right' },
        { label: 'Row 1 (Upper)', value: 'row_1' },
        { label: 'Row 2 (Lower)', value: 'row_2' },
        { label: 'Column 1 (Left)', value: 'col_1' },
        { label: 'Column 2 (Right)', value: 'col_2' },
      ],
      damageTypes: DAMAGE_TYPES,
      effectKinds: [
        { label: 'Damage', value: 'damage' },
        { label: 'Text', value: 'text' },
      ],
    }
  },
})
</script>

<style scoped>
.chain-outcomes__item {
  margin: 0 0 8px;
  padding: 6px 8px 8px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 6px;
}

.chain-outcomes__legend {
  padding: 0 4px;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #ffcc80;
}
</style>
