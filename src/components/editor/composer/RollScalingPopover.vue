<template>
  <button
    v-if="visible"
    type="button"
    class="chain-chip"
    :class="hasConfig ? 'chain-chip--set' : 'chain-chip--empty'"
    data-roll-scaling-trigger
    aria-label="Edit roll count, scaling source, and advantage"
    aria-haspopup="dialog"
    :aria-expanded="open ? 'true' : 'false'"
  >
    <q-icon :name="hasConfig ? 'tune' : 'add'" size="12px" class="chain-chip__icon" />
    <span class="chain-chip__text">{{ summaryText }}</span>
    <q-tooltip v-if="!open" class="text-caption" :delay="350" max-width="320px">
      Configure independent roll count, beam/ray count, damage multiplier, scaling driver (CR/HD/Level), and separate roll vs saving throw advantage.
    </q-tooltip>

    <q-menu
      v-model="open"
      anchor="bottom left"
      self="top left"
      :offset="[0, 4]"
      :transition-duration="0"
      max-width="min(96vw, 480px)"
      class="chain-editor-menu bg-grey-10 text-white"
      @before-show="loadDraft"
    >
      <form class="chain-editor q-pa-sm" style="min-width: 340px;" @submit.prevent="applyDraft">
        <div class="chain-editor__title q-mb-xs">Roll Count, Scaling &amp; Conditional Rolls</div>

        <div class="row q-col-gutter-xs q-mb-xs">
          <div class="col-4">
            <formula-field
              v-if="entryCollection && entryId && draftModel"
              :path="fieldPath('rollCount')"
              label="Roll Count"
              :draft-model="draftModel"
              v-help="'How many attack or action rolls are made, distinct from targets and beams.'"
              dense
              outlined
              clearable
              @applied="val => onFormulaApplied('rollCount', val)"
            />
          </div>
          <div class="col-4">
            <formula-field
              v-if="entryCollection && entryId && draftModel"
              :path="fieldPath('beamCount')"
              label="Beams / Rays"
              :draft-model="draftModel"
              v-help="'Independent projectile or beam count (separate from target count).'"
              dense
              outlined
              clearable
              @applied="val => onFormulaApplied('beamCount', val)"
            />
          </div>
          <div class="col-4">
            <formula-field
              v-if="entryCollection && entryId && draftModel"
              :path="fieldPath('damageMultiplier')"
              label="Dmg Multiplier"
              :draft-model="draftModel"
              v-help="'Multiplier applied per hit without altering target or beam count.'"
              dense
              outlined
              clearable
              @applied="val => onFormulaApplied('damageMultiplier', val)"
            />
          </div>
        </div>

        <div class="row q-col-gutter-xs q-mb-xs">
          <div class="col-5">
            <q-select
              v-model="draft.source"
              :options="sourceOptions"
              emit-value
              map-options
              dense
              outlined
              dark
              label="Scaling Source"
              v-help="'Which progression stat drives tier scaling (Fixed, CR, Hit Dice, Level, or Custom).'"
            />
          </div>
          <div class="col-7">
            <q-input
              v-model="draft.sourceLabel"
              dense
              outlined
              dark
              label="Provenance Note"
              placeholder="e.g. Cantrip tiers by CR"
              v-help="'Explains where the scaling count or multiplier comes from at the table.'"
            />
          </div>
        </div>

        <div class="row q-col-gutter-xs q-mb-xs">
          <div class="col-5">
            <q-select
              v-model="draft.rollMode"
              :options="modeOptions"
              emit-value
              map-options
              dense
              outlined
              dark
              label="Attack Roll Mode"
              v-help="'Advantage or disadvantage specifically on attack rolls (kept separate from saves).'"
            />
          </div>
          <div class="col-7">
            <q-input
              v-model="draft.rollCondition"
              dense
              outlined
              dark
              label="Roll Condition"
              placeholder="e.g. against Undead"
              v-help="'Optional condition under which attack roll advantage or disadvantage applies.'"
            />
          </div>
        </div>

        <div class="row q-col-gutter-xs q-mb-sm">
          <div class="col-5">
            <q-select
              v-model="draft.saveMode"
              :options="modeOptions"
              emit-value
              map-options
              dense
              outlined
              dark
              label="Target Save Mode"
              v-help="'Advantage or disadvantage specifically on target saving throws (kept separate from attack rolls).'"
            />
          </div>
          <div class="col-7">
            <q-input
              v-model="draft.saveCondition"
              dense
              outlined
              dark
              label="Save Condition"
              placeholder="e.g. if blinded"
              v-help="'Optional condition under which target saving throws have advantage or disadvantage.'"
            />
          </div>
        </div>

        <div class="row justify-end q-gutter-xs">
          <q-btn v-if="hasConfig" v-close-popup flat dense no-caps size="sm" color="grey-4" label="Clear" @click="clearDraft" />
          <q-btn v-close-popup flat dense no-caps size="sm" color="grey-4" label="Cancel" />
          <q-btn v-close-popup type="submit" unelevated dense no-caps size="sm" color="amber-9" label="Apply" />
        </div>
      </form>
    </q-menu>
  </button>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import FormulaField from 'src/components/kit/FormulaField.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import type { NumericBinding } from 'src/core/domain/formula'
import { withoutEntryBindings } from 'src/core/domain/entry-bindings'
import { hasRollScaling, normalizeRollScaling, rollScalingChipText } from 'src/core/domain/roll-scaling'
import type { AttackRollMode, RollScalingSource, RollScalingSpec } from 'src/core/domain/types'

const SOURCE_OPTIONS: Array<{ label: string; value: RollScalingSource }> = [
  { label: 'Fixed / Manual', value: 'manual' },
  { label: 'Challenge Rating (CR)', value: 'cr' },
  { label: 'Hit Dice (HD)', value: 'hd' },
  { label: 'Caster / Character Level', value: 'level' },
  { label: 'Custom Source', value: 'custom' },
]

const MODE_OPTIONS: Array<{ label: string; value: AttackRollMode }> = [
  { label: 'Normal', value: 'normal' },
  { label: 'Advantage (▲▲)', value: 'advantage' },
  { label: 'Disadvantage (▼▼)', value: 'disadvantage' },
]

type ScalingNumericKey = 'rollCount' | 'beamCount' | 'damageMultiplier'

export default defineComponent({
  name: 'RollScalingPopover',
  components: { FormulaField },
  props: {
    modelValue: { type: Object as PropType<RollScalingSpec | undefined>, default: undefined },
    entryCollection: { type: String, default: 'actions' },
    entryId: { type: String, default: '' },
    visible: { type: Boolean, default: true },
  },
  emits: ['update:model-value'],
  setup(props, { emit }) {
    const monster = useMonsterStore()
    const open = ref(false)
    const draft = ref<RollScalingSpec>({
      source: 'manual',
      rollMode: 'normal',
      saveMode: 'normal',
    })
    const draftModel = ref<(object & { bindings?: Record<string, NumericBinding> }) | undefined>()

    const hasConfig = computed(() => hasRollScaling(props.modelValue))
    const summaryText = computed(() => rollScalingChipText(props.modelValue) || 'Scaling / Adv')
    const fieldPath = (key: ScalingNumericKey) =>
      `${props.entryCollection}[id=${encodeURIComponent(props.entryId)}].rollScaling.${key}`

    const loadDraft = () => {
      const src = props.modelValue
      draft.value = {
        rollCount: src?.rollCount,
        beamCount: src?.beamCount,
        damageMultiplier: src?.damageMultiplier,
        source: src?.source || 'manual',
        sourceLabel: src?.sourceLabel || '',
        tiers: src?.tiers ? JSON.parse(JSON.stringify(src.tiers)) : undefined,
        rollMode: src?.rollMode || 'normal',
        rollCondition: src?.rollCondition || '',
        saveMode: src?.saveMode || 'normal',
        saveCondition: src?.saveCondition || '',
      }
      const cloned = JSON.parse(JSON.stringify(monster.$state))
      const list = Array.isArray(cloned[props.entryCollection]) ? cloned[props.entryCollection] : []
      const entry = list.find((item: { id?: string }) => item?.id === props.entryId)
      if (entry) {
        entry.rollScaling = JSON.parse(JSON.stringify(draft.value))
      }
      draftModel.value = cloned
    }

    const onFormulaApplied = (key: ScalingNumericKey, val: number | undefined) => {
      draft.value[key] = val
    }

    const syncScalingBindings = () => {
      if (!props.entryId) return
      const draftBindings = draftModel.value?.bindings || {}
      const prefix = `${props.entryCollection}[id=${encodeURIComponent(props.entryId)}]`
      const keys: ScalingNumericKey[] = ['rollCount', 'beamCount', 'damageMultiplier']
      monster.$patch((state) => {
        const cleaned = withoutEntryBindings(state.bindings, prefix, ['rollScaling'])
        for (const k of keys) {
          const p = `${prefix}.rollScaling.${k}`
          if (draftBindings[p]) cleaned[p] = { ...draftBindings[p] }
        }
        state.bindings = cleaned
      })
    }

    const applyDraft = () => {
      syncScalingBindings()
      emit('update:model-value', normalizeRollScaling(draft.value))
    }

    const clearDraft = () => {
      if (props.entryId) {
        const prefix = `${props.entryCollection}[id=${encodeURIComponent(props.entryId)}]`
        monster.$patch((state) => {
          state.bindings = withoutEntryBindings(state.bindings, prefix, ['rollScaling'])
        })
      }
      emit('update:model-value', undefined)
    }

    return {
      open,
      draft,
      draftModel,
      hasConfig,
      summaryText,
      sourceOptions: SOURCE_OPTIONS,
      modeOptions: MODE_OPTIONS,
      fieldPath,
      loadDraft,
      onFormulaApplied,
      applyDraft,
      clearDraft,
    }
  },
})
</script>

<style scoped src="./composer-chain.css"></style>
