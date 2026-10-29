<template>
  <div class="chain-outcomes">
    <template v-if="mode === 'outcomes'">
      <fieldset v-for="(outcome, index) in outcomes" :key="index" class="chain-outcomes__item">
        <legend class="chain-outcomes__legend">Outcome {{ index + 1 }}</legend>
        <div class="row q-col-gutter-xs items-center">
          <div class="col-12 col-sm-4">
            <q-input
              :model-value="outcome.trigger"
              dense
              outlined
              dark
              label="When"
              hint="hit, failure, success or your own"
              :list="`${uid}-triggers`"
              :autofocus="index === 0"
              @update:model-value="(value: string | number | null) => setOutcome(index, { trigger: String(value ?? '') })"
            />
          </div>
          <div class="col-12 col-sm-8">
            <q-input
              :model-value="outcome.rider ?? ''"
              dense
              outlined
              dark
              label="Rider (optional)"
              placeholder="The target is knocked Prone."
              @update:model-value="(value: string | number | null) => setOutcome(index, { rider: String(value ?? '') })"
            />
          </div>
        </div>
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
              <q-input
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
              <q-input
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
            <q-input
              :model-value="effect.text ?? ''"
              dense
              outlined
              dark
              label="Effect"
              placeholder="The target is pushed 10 feet."
              @update:model-value="(value: string | number | null) => setEffect(index, effectIndex, { text: String(value ?? '') })"
            />
          </div>
          <div class="col-auto">
            <q-btn flat round dense size="sm" icon="close" :aria-label="`Remove effect ${effectIndex + 1}`" @click="removeEffect(index, effectIndex)" />
          </div>
        </div>
        <div class="row q-gutter-xs q-mt-xs">
          <q-btn flat dense no-caps size="sm" icon="add" label="Effect" @click="addEffect(index)" />
          <q-btn flat dense no-caps size="sm" icon="delete" color="red-4" label="Remove outcome" @click="removeOutcome(index)" />
        </div>
      </fieldset>
      <q-btn flat dense no-caps size="sm" icon="add" label="Outcome" @click="addOutcome" />
      <!-- Native suggestions: a Quasar select here would open a popup inside the editor's popup. -->
      <datalist :id="`${uid}-triggers`">
        <option v-for="trigger in triggers" :key="trigger" :value="trigger" />
      </datalist>
      <datalist :id="`${uid}-damage`">
        <option v-for="type in damageTypes" :key="type" :value="type" />
      </datalist>
    </template>

    <template v-else>
      <div v-for="(effect, index) in effects" :key="index" class="row q-col-gutter-xs items-center q-mb-xs">
        <div class="col-12 col-sm-4">
          <q-input
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
          <q-input
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
      <q-btn flat dense no-caps size="sm" icon="add" label="Line" @click="addLegacy" />
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { DAMAGE_TYPES, OUTCOME_TRIGGERS } from 'src/core/domain/action-composer'
import type { AbilityOutcome, ActionEffect, EffectClause } from 'src/core/domain/types'

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
      emitOutcomes(outcomes.value.map((outcome, i) => (i === index ? { ...outcome, ...change } : outcome)))

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
      emitOutcomes([...outcomes.value, { trigger: outcomes.value.length ? 'success' : 'hit', effects: [{ kind: 'damage', formula: '', damageType: '' }] }])

    const removeOutcome = (index: number) => emitOutcomes(outcomes.value.filter((_, i) => i !== index))

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
      setLegacy,
      addLegacy,
      removeLegacy,
      triggers: OUTCOME_TRIGGERS,
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
