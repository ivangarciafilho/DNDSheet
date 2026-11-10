<template>
  <div class="chain-outcomes">
    <template v-if="mode === 'outcomes'">
      <div v-if="invalidOutcomeList" role="alert" class="q-pa-sm q-mb-sm text-warning">
        <p class="q-mb-xs">The outcome list has an invalid format. Replace it with an empty list to edit this draft.</p>
        <q-btn flat dense no-caps label="Replace with empty outcome list" @click="confirmListReplacement = true" />
        <div v-if="confirmListReplacement">
          <p class="q-mb-xs">Replace the invalid outcome data in this draft? Apply will save the replacement; Cancel will discard it.</p>
          <q-btn flat dense no-caps label="Confirm empty outcome list" @click="replaceOutcomeList" />
          <q-btn flat dense no-caps label="Keep current data" @click="confirmListReplacement = false" />
        </div>
      </div>
      <!-- Outcomes Matrix / Sector Notice -->
      <div class="text-caption text-amber-3 q-mb-xs flex items-center justify-between">
        <span>Outcome clauses · layout and results</span>
      </div>

      <fieldset v-for="{ outcome, index, occurrenceKey } in outcomeRows" :key="occurrenceKey" :data-outcome-id="outcome.id" class="chain-outcomes__item">
        <legend class="chain-outcomes__legend">Outcome {{ index + 1 }} {{ outcome.targetFilter ? `· [${outcome.targetFilter}]` : '' }}</legend>
        
        <div v-if="needsIdentityRepair(outcome)" class="q-mb-sm text-warning">
          <p class="q-mb-xs">This outcome has a missing or shared ID. Assign a new clause ID to edit it safely. Existing references will keep their current target IDs; review their intended targets afterward.</p>
          <q-btn flat dense no-caps label="Assign new clause ID" :aria-label="`Assign new clause ID to outcome ${index + 1}`" @click="pendingRepair = occurrenceKey" />
          <div v-if="pendingRepair === occurrenceKey" role="alert">
            <p class="q-mb-xs">Assign a new ID to this outcome? References will remain unchanged because their intended targets cannot be inferred.</p>
            <q-btn flat dense no-caps label="Assign ID and keep references" @click="repairIdentity(index)" />
            <q-btn flat dense no-caps label="Keep current ID" @click="pendingRepair = undefined" />
          </div>
        </div>
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
              @update:model-value="(value: string | number | null) => setOutcome(outcome.id, { trigger: String(value ?? '') })"
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
              @update:model-value="(value: string | number | null) => setOutcome(outcome.id, { targetFilter: String(value ?? '') })"
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
              @update:model-value="(val: string) => setOutcome(outcome.id, { layoutSector: val })"
            />
          </div>
          <div class="col-12 q-mt-xs">
            <mechanic-text-editor v-help="'Enter rider (optional condition/clause) for the chain outcomes editor.'"
              :model-value="outcome.rider ?? ''"
              dense
              outlined
              dark
              label="Rider (optional condition/clause)"
              placeholder="e.g. until end of turn they do not benefit from being Invisible"
              @update:model-value="(value: string | number | null) => setOutcome(outcome.id, { rider: String(value ?? '') })"
            />
          </div>
        </div>
        <!-- A11.5 recipient, references and presentation -->
        <div class="row q-col-gutter-xs items-center q-mt-xs">
          <div class="col-12 col-sm-5">
            <q-input v-help="'Who this result applies to, e.g. “each creature in the area”.'" :model-value="outcome.recipient ?? ''" dense outlined dark label="Applies to (optional)" @update:model-value="(value: string | number | null) => setOutcome(outcome.id, { recipient: String(value ?? '') || undefined })" />
          </div>
          <div class="col-12 col-sm-4">
            <q-select v-help="'Results this one builds on, e.g. “half as much” on a success.'" :model-value="outcome.refs ?? []" :options="refOptions(outcome.id)" multiple emit-value map-options dense outlined dark label="Builds on" @update:model-value="(value: string[]) => setOutcome(outcome.id, { refs: value })" />
          </div>
          <div class="col-12 col-sm-3">
            <q-select v-help="'How the clause is laid out; does not change the rules.'" :model-value="outcome.presentation ?? 'inline'" :options="['inline', 'vertical', 'horizontal']" dense outlined dark label="Layout" @update:model-value="(value: string) => setOutcome(outcome.id, { presentation: value as 'inline' | 'vertical' | 'horizontal' })" />
          </div>
          <div v-for="issue in issuesFor(occurrenceKey)" :key="issue.kind + issue.message" class="col-12 text-caption text-warning">⚠ {{ issue.message }}</div>
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
              @update:model-value="(kind: 'damage' | 'text') => setEffect(outcome.id, effectIndex, { kind })"
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
                @update:model-value="(value: string | number | null) => setEffect(outcome.id, effectIndex, { formula: String(value ?? '') })"
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
                @update:model-value="(value: string | number | null) => setEffect(outcome.id, effectIndex, { damageType: String(value ?? '') })"
              />
            </div>
          </template>
          <div v-else class="col">
            <mechanic-text-editor v-help="'Enter effect for the chain outcomes editor.'"
              :model-value="effect.text ?? ''"
              dense
              outlined
              dark
              label="Effect"
              placeholder="e.g. gains Temporary Hit Points equal to total rolled"
              @update:model-value="(value: string | number | null) => setEffect(outcome.id, effectIndex, { text: String(value ?? '') })"
            />
          </div>
          <div class="col-auto">
            <q-btn flat round dense size="sm" icon="close" :aria-label="`Remove effect ${effectIndex + 1}`" @click="removeEffect(outcome.id, effectIndex)" />
          </div>
        </div>

        <!-- Optional Random Dice Table (Chaos Bolt / Confusion / Wild Magic outcomes) -->
        <div v-if="outcome.diceTable && outcome.diceTable.length" class="q-mt-sm q-pa-xs rounded-borders" style="background: rgba(0,0,0,0.2); border: 1px dashed rgba(255,255,255,0.15);">
          <div class="text-caption text-cyan-3 flex items-center justify-between q-mb-xs">
            <span>🎲 Random Dice Roll Table</span>
            <q-btn v-help="'Add Roll in the chain outcomes editor.'" flat round dense size="xs" icon="add" label="Add Roll" @click="addDiceRow(outcome.id)" />
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
                @update:model-value="(val: string | number | null) => updateDiceRow(outcome.id, rIdx, { roll: String(val ?? '') })"
              />
            </div>
            <div class="col">
              <mechanic-text-editor v-help="'Enter outcome effect for the chain outcomes editor.'"
                :model-value="dRow.effect"
                dense
                outlined
                dark
                label="Outcome Effect"
                placeholder="Random effect text..."
                @update:model-value="(val: string | number | null) => updateDiceRow(outcome.id, rIdx, { effect: String(val ?? '') })"
              />
            </div>
            <div class="col-auto">
              <q-btn flat round dense size="xs" icon="close" :aria-label="`Remove table row ${rIdx + 1} from outcome ${index + 1}`" @click="removeDiceRow(outcome.id, rIdx)" />
            </div>
          </div>
        </div>

        <div class="row q-gutter-xs q-mt-xs items-center justify-between">
          <div class="row q-gutter-xs">
            <q-btn v-help="'Effect in the chain outcomes editor.'" flat dense no-caps size="sm" icon="add" label="Effect" @click="addEffect(outcome.id)" />
            <q-btn flat dense no-caps size="sm" icon="casino" :label="outcome.diceTable && outcome.diceTable.length ? 'Add Table Row' : '+ Dice Table'" @click="addDiceRow(outcome.id)" />
          </div>
          <div class="row q-gutter-xs">
            <q-btn flat dense no-caps size="sm" icon="arrow_upward" label="Move up" :aria-label="`Move outcome ${index + 1} up`" :disable="index === 0" @click="moveOutcome(outcome.id, -1)" />
            <q-btn flat dense no-caps size="sm" icon="arrow_downward" label="Move down" :aria-label="`Move outcome ${index + 1} down`" :disable="index === outcomes.length - 1" @click="moveOutcome(outcome.id, 1)" />
            <q-btn flat dense no-caps size="sm" icon="content_copy" label="Duplicate" :aria-label="`Duplicate outcome ${index + 1}`" @click="duplicateOutcome(outcome.id)" />
            <q-btn flat dense no-caps size="sm" icon="delete" color="red-4" label="Remove outcome" :aria-label="`Remove outcome ${index + 1}`" @click="requestRemoval(outcome.id)" />
          </div>
        </div>
        <div v-if="pendingRemoval === outcome.id" role="alert" class="q-mt-sm q-pa-sm text-warning">
          <p class="q-mb-xs">{{ removalWarning(outcome.id) }} Their references will remain and be marked as missing. No dependent outcomes will be removed.</p>
          <q-btn flat dense no-caps color="red-4" label="Remove and keep references" @click="confirmRemoval(outcome.id)" />
          <q-btn flat dense no-caps label="Keep outcome" @click="pendingRemoval = undefined" />
        </div>
      </fieldset>
      <div v-if="commandMessage" role="alert" class="text-warning q-mb-xs">{{ commandMessage }}</div>
      <q-btn v-help="'Add Outcome in the chain outcomes editor.'" flat dense no-caps size="sm" icon="add" label="Add Outcome" :disable="invalidOutcomeList" @click="addOutcome" />

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
          <mechanic-text-editor v-help="'Enter effect for the chain outcomes editor.'"
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
import MechanicTextEditor from '../MechanicTextEditor.vue'
import { outcomeOccurrences, repairOutcomeIdAt, moveOutcomeById, removeOutcomeById, duplicateOutcomeById, newOutcomeId, triggerLead, validateOutcomes, type OutcomeIssue } from 'src/core/domain/outcome-graph'
import { computed, defineComponent, PropType, ref } from 'vue'
import { normalizeOutcomeData } from 'src/core/domain/outcome-data'
import { DAMAGE_TYPES, OUTCOME_TRIGGERS } from 'src/core/domain/action-composer'
import type { AbilityOutcome, ActionEffect, EffectClause, OutcomeDiceTableRow } from 'src/core/domain/types'

let instances = 0

export default defineComponent({
  name: 'ChainOutcomesEditor',
  components: { MechanicTextEditor },
  props: {
    modelValue: { type: Array as PropType<unknown[]>, required: true },
    mode: { type: String as PropType<'outcomes' | 'effects'>, default: 'outcomes' },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const uid = `chain-outcomes-${++instances}`
    // Drafts are replaced, never mutated, so the parent's copy stays the single source of truth.
    const record = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
    const rawId = (value: unknown) => typeof record(value).id === 'string' ? record(value).id as string : ''
    const rawArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : []
    const invalidOutcomeList = computed(() => !Array.isArray(props.modelValue))
    const confirmListReplacement = ref(false)
    const outcomes = computed(() => Array.isArray(props.modelValue) ? props.modelValue as AbilityOutcome[] : [])
    const displayOutcomes = computed(() => normalizeOutcomeData(props.modelValue))
    const outcomeRows = computed(() => outcomeOccurrences(props.modelValue).map((row) => ({ ...row, outcome: displayOutcomes.value[row.index]! })))
    const effects = computed(() => props.modelValue as ActionEffect[])
    const emitOutcomes = (next: AbilityOutcome[]) => {
      if (!invalidOutcomeList.value) emit('update:modelValue', next)
    }
    const replaceOutcomeList = () => {
      emit('update:modelValue', [])
      confirmListReplacement.value = false
    }
    // One validation pass per outcome list; the template reads per-clause issues from this map.
    const outcomeIssues = computed(() => {
      const byId = new Map<string, OutcomeIssue[]>()
      for (const issue of validateOutcomes(props.modelValue)) {
        if (issue.kind === 'empty' || !issue.occurrenceKey) continue
        byId.set(issue.occurrenceKey, [...(byId.get(issue.occurrenceKey) ?? []), issue])
      }
      return byId
    })
    const emitEffects = (next: ActionEffect[]) => emit('update:modelValue', next)

    const pendingRemoval = ref<string>()
    const pendingRepair = ref<string>()
    const needsIdentityRepair = (outcome: AbilityOutcome) => !outcome.id || outcomes.value.filter((other) => rawId(other) === outcome.id).length !== 1
    const commandMessage = ref('')
    const findOutcome = (id: string | undefined) => {
      const matches = outcomes.value.filter((outcome) => rawId(outcome) === id)
      if (!id || matches.length !== 1) {
        commandMessage.value = 'Assign a new clause ID before editing this outcome.'
        return undefined
      }
      commandMessage.value = ''
      return matches[0]
    }
    const setOutcome = (id: string | undefined, change: Partial<AbilityOutcome>) => {
      if (!findOutcome(id)) return
      emitOutcomes(outcomes.value.map((outcome) => rawId(outcome) === id ? { ...record(outcome), ...change, id } as AbilityOutcome : outcome))
    }
    const setEffect = (id: string | undefined, effectIndex: number, change: Partial<EffectClause>) => {
      const outcome = findOutcome(id)
      if (outcome) setOutcome(id, { effects: rawArray<EffectClause>(outcome.effects).map((effect, i) => i === effectIndex ? { ...record(effect), ...change } as EffectClause : effect) })
    }
    const addEffect = (id: string | undefined) => {
      const outcome = findOutcome(id)
      if (outcome) setOutcome(id, { effects: [...rawArray<EffectClause>(outcome.effects), { kind: 'damage', formula: '', damageType: '' }] })
    }
    const removeEffect = (id: string | undefined, effectIndex: number) => {
      const outcome = findOutcome(id)
      if (outcome) setOutcome(id, { effects: rawArray<EffectClause>(outcome.effects).filter((_, i) => i !== effectIndex) })
    }
    const addOutcome = () => emitOutcomes([...outcomes.value, { id: newOutcomeId(), trigger: outcomes.value.length ? 'success' : 'hit', effects: [{ kind: 'damage', formula: '', damageType: '' }] }])
    const applyCommand = (result: ReturnType<typeof moveOutcomeById>) => {
      if (result.changed) {
        commandMessage.value = ''
        emitOutcomes(result.outcomes)
      } else commandMessage.value = result.issues.map((issue) => issue.message).join(' ')
    }
    const repairIdentity = (index: number) => {
      applyCommand(repairOutcomeIdAt(outcomes.value, index))
      pendingRepair.value = undefined
    }
    const moveOutcome = (id: string | undefined, offset: number) => {
      if (findOutcome(id)) applyCommand(moveOutcomeById(outcomes.value, id!, offset))
    }
    const duplicateOutcome = (id: string | undefined) => {
      if (findOutcome(id)) applyCommand(duplicateOutcomeById(outcomes.value, id!))
    }
    const dependents = (id: string | undefined) => outcomeRows.value.filter(({ outcome }) => outcome.id !== id && outcome.refs?.includes(id ?? ''))
    const removalWarning = (id: string | undefined) => {
      const labels = dependents(id).map(({ outcome, index }) => `Outcome ${index + 1} (${triggerLead(outcome.trigger)})`)
      return `${labels.join(', ')} ${labels.length === 1 ? 'builds' : 'build'} on this outcome.`
    }
    const confirmRemoval = (id: string | undefined) => {
      if (!findOutcome(id)) return
      applyCommand(removeOutcomeById(outcomes.value, id!))
      pendingRemoval.value = undefined
    }
    const requestRemoval = (id: string | undefined) => {
      if (!findOutcome(id)) return
      if (dependents(id).length) pendingRemoval.value = id
      else confirmRemoval(id)
    }
    const addDiceRow = (id: string | undefined) => {
      const outcome = findOutcome(id)
      if (!outcome) return
      const existing = rawArray<OutcomeDiceTableRow>(outcome.diceTable)
      setOutcome(id, { diceTable: [...existing, { roll: `${existing.length + 1}`, effect: '' }] })
    }
    const updateDiceRow = (id: string | undefined, rowIndex: number, change: Partial<OutcomeDiceTableRow>) => {
      const outcome = findOutcome(id)
      if (outcome) setOutcome(id, { diceTable: rawArray<OutcomeDiceTableRow>(outcome.diceTable).map((row, i) => i === rowIndex ? { ...record(row), ...change } as OutcomeDiceTableRow : row) })
    }
    const removeDiceRow = (id: string | undefined, rowIndex: number) => {
      const outcome = findOutcome(id)
      if (outcome) setOutcome(id, { diceTable: rawArray<OutcomeDiceTableRow>(outcome.diceTable).filter((_, i) => i !== rowIndex) })
    }

    const setLegacy = (index: number, change: Partial<ActionEffect>) =>
      emitEffects(effects.value.map((effect, i) => (i === index ? { ...effect, ...change } : effect)))
    const addLegacy = () => emitEffects([...effects.value, { case: '', effect: '' }])
    const removeLegacy = (index: number) => emitEffects(effects.value.filter((_, i) => i !== index))

    return {
      uid,
      outcomes,
      invalidOutcomeList,
      confirmListReplacement,
      replaceOutcomeList,
      outcomeRows,
      pendingRepair,
      needsIdentityRepair,
      repairIdentity,
      effects,
      setOutcome,
      setEffect,
      addEffect,
      removeEffect,
      addOutcome,
      moveOutcome,
      duplicateOutcome,
      pendingRemoval,
      commandMessage,
      requestRemoval,
      confirmRemoval,
      removalWarning,
      addDiceRow,
      updateDiceRow,
      removeDiceRow,
      refOptions: (id: string | undefined) => {
        const options = displayOutcomes.value.flatMap((outcome, index) => outcome.id !== id && outcome.id && !needsIdentityRepair(outcome)
          ? [{ label: `${index + 1}. ${triggerLead(outcome.trigger)}`, value: outcome.id }] : [])
        const selected = displayOutcomes.value.find((outcome) => outcome.id === id)?.refs ?? []
        for (const target of selected) {
          if (!options.some((option) => option.value === target)) {
            const matches = outcomes.value.filter((outcome) => rawId(outcome) === target)
            options.push({ label: `${matches.length > 1 ? 'Shared ID' : matches.length ? 'Self reference' : 'Missing outcome'} (${target})`, value: target })
          }
        }
        return options
      },
      issuesFor: (key: string) => outcomeIssues.value.get(key) ?? [],
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
