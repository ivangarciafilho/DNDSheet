<template>
  <q-select
    ref="selectRef"
    :model-value="displayValue"
    :options="filteredOptions"
    :label="label"
    :dense="dense"
    :outlined="outlined"
    :disable="disable"
    :prefix="prefix"
    :suffix="suffix"
    :hint="hint || undefined"
    hide-bottom-space
    use-input
    fill-input
    hide-selected
    options-dense
    emit-value
    map-options
    new-value-mode="add-unique"
    input-debounce="0"
    @filter="onFilter"
    @input-value="onInputValue"
    @update:model-value="onOptionSelect"
  >
    <!-- Slot pass-through for prepend / append -->
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
    <template v-if="$slots.after" #after>
      <slot name="after" />
    </template>

    <!-- Floating rich tooltip for maximum clarity without vertical layout collapse -->
    <q-tooltip
      class="bg-grey-10 text-white shadow-4 border-subtle q-pa-sm"
      :offset="[0, 8]"
      anchor="top middle"
      self="bottom middle"
    >
      <div class="row items-center no-wrap q-gutter-xs text-weight-bold text-amber-3">
        <q-icon name="functions" size="xs" color="amber-4" />
        <span>{{ label || 'Dynamic 5e Value' }}</span>
      </div>
      <div class="text-caption q-mt-xs">
        <span class="text-grey-4">Resolved: </span>
        <strong class="text-teal-3 text-body2">{{ resolvedPreviewNumber }}</strong>
        <span v-if="activeFormulaLabel" class="text-grey-5 q-ml-xs">({{ activeFormulaLabel }})</span>
      </div>
      <div class="text-caption text-grey-4 q-mt-xs" style="max-width: 220px; line-height: 1.2;">
        {{ tooltipExplanation }}
      </div>
    </q-tooltip>

    <!-- Option rendering with category badges & dynamic values -->
    <template #option="scope">
      <q-item v-bind="scope.itemProps" dense class="dynamic-ref-option-item">
        <q-item-section v-if="scope.opt.icon" avatar style="min-width: 24px;">
          <q-icon :name="scope.opt.icon" :color="scope.opt.color || 'blue-4'" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ scope.opt.label }}</q-item-label>
          <q-item-label v-if="scope.opt.subLabel" caption class="text-grey-5">
            {{ scope.opt.subLabel }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge
            v-if="scope.opt.category"
            :color="scope.opt.categoryColor || 'grey-8'"
            outline
            class="text-caption text-weight-bold"
          >
            {{ scope.opt.category }}
          </q-badge>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMonsterStore } from 'src/stores/monster-store.ts'
import { evaluateSafeFormula } from 'src/core/domain/defense-and-traits-utils.ts'

interface SelectOption {
  label: string
  value: number | string
  subLabel?: string
  formula?: string
  category?: string
  categoryColor?: string
  icon?: string
  color?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: number | string | null | undefined
    label?: string
    hint?: string
    prefix?: string
    suffix?: string
    min?: number
    max?: number
    step?: number
    dense?: boolean
    outlined?: boolean
    disable?: boolean
    allowFormulaString?: boolean
    contextType?: 'general' | 'dc' | 'ac' | 'range' | 'dice_count' | 'bonus' | 'stat'
  }>(),
  {
    label: '',
    hint: '',
    prefix: '',
    suffix: '',
    min: undefined,
    max: undefined,
    step: undefined,
    dense: true,
    outlined: true,
    disable: false,
    allowFormulaString: false,
    contextType: 'general',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: number | string): void
  (e: 'evaluated', val: number): void
}>()

const monsterStore = useMonsterStore()
const filterText = ref('')

const dynamicContext = computed(() => {
  const m = monsterStore
  const pb = m.proficiency ?? 2
  const cr = m.CR ?? 0
  const hd = m.HP?.HD ?? 1
  const hdType = m.HP?.type ?? 8
  const stats = m.stats ?? { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }
  const strMod = Math.floor(((stats.STR ?? 10) - 10) / 2)
  const dexMod = Math.floor(((stats.DEX ?? 10) - 10) / 2)
  const conMod = Math.floor(((stats.CON ?? 10) - 10) / 2)
  const intMod = Math.floor(((stats.INT ?? 10) - 10) / 2)
  const wisMod = Math.floor(((stats.WIS ?? 10) - 10) / 2)
  const chaMod = Math.floor(((stats.CHA ?? 10) - 10) / 2)
  const avgHp = m.computedHp ?? 20

  return {
    pb,
    cr,
    hd,
    hdType,
    stats,
    strMod,
    dexMod,
    conMod,
    intMod,
    wisMod,
    chaMod,
    avgHp,
  }
})

// Build comprehensive master reference list
const allOptions = computed<SelectOption[]>(() => {
  const ctx = dynamicContext.value
  const list: SelectOption[] = []

  // 1. Dynamic 5e Reference Variables
  list.push(
    {
      label: `PB (+${ctx.pb})`,
      value: ctx.pb,
      formula: 'PB',
      category: 'Dynamic 5e Ref',
      categoryColor: 'purple-8',
      icon: 'stars',
      color: 'purple-4',
    },
    {
      label: `2x PB (+${ctx.pb * 2})`,
      value: ctx.pb * 2,
      formula: '2 * PB',
      category: 'Dynamic 5e Ref',
      categoryColor: 'purple-8',
      icon: 'auto_awesome',
      color: 'purple-4',
    },
    {
      label: `Half PB (+${Math.floor(ctx.pb / 2)})`,
      value: Math.floor(ctx.pb / 2),
      formula: 'PB / 2',
      category: 'Dynamic 5e Ref',
      categoryColor: 'purple-8',
      icon: 'change_history',
      color: 'purple-4',
    },
    {
      label: `CR (${ctx.cr})`,
      value: ctx.cr,
      formula: 'CR',
      category: 'Dynamic 5e Ref',
      categoryColor: 'purple-8',
      icon: 'military_tech',
      color: 'purple-4',
    },
    {
      label: `HD Count (${ctx.hd})`,
      value: ctx.hd,
      formula: 'HD',
      category: 'Dynamic 5e Ref',
      categoryColor: 'teal-8',
      icon: 'casino',
      color: 'teal-4',
    },
    {
      label: `HD Type (d${ctx.hdType})`,
      value: ctx.hdType,
      formula: 'HD_TYPE',
      category: 'Dynamic 5e Ref',
      categoryColor: 'teal-8',
      icon: 'view_in_ar',
      color: 'teal-4',
    },
    {
      label: `Max / Avg HP (${ctx.avgHp})`,
      value: ctx.avgHp,
      formula: 'HP',
      category: 'Dynamic 5e Ref',
      categoryColor: 'red-9',
      icon: 'favorite',
      color: 'red-4',
    },
    {
      label: `Bloodied HP (${Math.floor(ctx.avgHp / 2)})`,
      value: Math.floor(ctx.avgHp / 2),
      formula: 'HP / 2',
      category: 'Dynamic 5e Ref',
      categoryColor: 'red-9',
      icon: 'water_drop',
      color: 'red-4',
    }
  )

  // 2. Ability Modifiers
  list.push(
    {
      label: `STR Mod (${ctx.strMod >= 0 ? '+' : ''}${ctx.strMod})`,
      value: ctx.strMod,
      formula: 'STR_MOD',
      category: 'Ability Mod',
      categoryColor: 'red-8',
      icon: 'fitness_center',
      color: 'red-4',
    },
    {
      label: `DEX Mod (${ctx.dexMod >= 0 ? '+' : ''}${ctx.dexMod})`,
      value: ctx.dexMod,
      formula: 'DEX_MOD',
      category: 'Ability Mod',
      categoryColor: 'green-8',
      icon: 'directions_run',
      color: 'green-4',
    },
    {
      label: `CON Mod (${ctx.conMod >= 0 ? '+' : ''}${ctx.conMod})`,
      value: ctx.conMod,
      formula: 'CON_MOD',
      category: 'Ability Mod',
      categoryColor: 'orange-8',
      icon: 'shield',
      color: 'orange-4',
    },
    {
      label: `INT Mod (${ctx.intMod >= 0 ? '+' : ''}${ctx.intMod})`,
      value: ctx.intMod,
      formula: 'INT_MOD',
      category: 'Ability Mod',
      categoryColor: 'blue-8',
      icon: 'psychology',
      color: 'blue-4',
    },
    {
      label: `WIS Mod (${ctx.wisMod >= 0 ? '+' : ''}${ctx.wisMod})`,
      value: ctx.wisMod,
      formula: 'WIS_MOD',
      category: 'Ability Mod',
      categoryColor: 'cyan-8',
      icon: 'visibility',
      color: 'cyan-4',
    },
    {
      label: `CHA Mod (${ctx.chaMod >= 0 ? '+' : ''}${ctx.chaMod})`,
      value: ctx.chaMod,
      formula: 'CHA_MOD',
      category: 'Ability Mod',
      categoryColor: 'pink-8',
      icon: 'record_voice_over',
      color: 'pink-4',
    },
    {
      label: `Max Physical Mod (+${Math.max(ctx.strMod, ctx.dexMod)})`,
      value: Math.max(ctx.strMod, ctx.dexMod),
      formula: 'MAX(STR_MOD, DEX_MOD)',
      category: 'Ability Mod',
      categoryColor: 'indigo-8',
      icon: 'bolt',
      color: 'indigo-4',
    },
    {
      label: `Max Mental Mod (+${Math.max(ctx.intMod, ctx.wisMod, ctx.chaMod)})`,
      value: Math.max(ctx.intMod, ctx.wisMod, ctx.chaMod),
      formula: 'MAX(INT_MOD, WIS_MOD, CHA_MOD)',
      category: 'Ability Mod',
      categoryColor: 'indigo-8',
      icon: 'lightbulb',
      color: 'indigo-4',
    }
  )

  // 3. Ability Scores
  list.push(
    {
      label: `STR Score (${ctx.stats.STR ?? 10})`,
      value: ctx.stats.STR ?? 10,
      formula: 'STR',
      category: 'Ability Score',
      categoryColor: 'grey-8',
    },
    {
      label: `DEX Score (${ctx.stats.DEX ?? 10})`,
      value: ctx.stats.DEX ?? 10,
      formula: 'DEX',
      category: 'Ability Score',
      categoryColor: 'grey-8',
    },
    {
      label: `CON Score (${ctx.stats.CON ?? 10})`,
      value: ctx.stats.CON ?? 10,
      formula: 'CON',
      category: 'Ability Score',
      categoryColor: 'grey-8',
    },
    {
      label: `INT Score (${ctx.stats.INT ?? 10})`,
      value: ctx.stats.INT ?? 10,
      formula: 'INT',
      category: 'Ability Score',
      categoryColor: 'grey-8',
    },
    {
      label: `WIS Score (${ctx.stats.WIS ?? 10})`,
      value: ctx.stats.WIS ?? 10,
      formula: 'WIS',
      category: 'Ability Score',
      categoryColor: 'grey-8',
    },
    {
      label: `CHA Score (${ctx.stats.CHA ?? 10})`,
      value: ctx.stats.CHA ?? 10,
      formula: 'CHA',
      category: 'Ability Score',
      categoryColor: 'grey-8',
    }
  )

  // 4. Standard 5e DC and AC Formulas
  list.push(
    {
      label: `8 + PB + STR (DC ${8 + ctx.pb + ctx.strMod})`,
      value: 8 + ctx.pb + ctx.strMod,
      formula: '8 + PB + STR_MOD',
      category: '5e DC Formula',
      categoryColor: 'deep-orange-8',
    },
    {
      label: `8 + PB + DEX (DC ${8 + ctx.pb + ctx.dexMod})`,
      value: 8 + ctx.pb + ctx.dexMod,
      formula: '8 + PB + DEX_MOD',
      category: '5e DC Formula',
      categoryColor: 'deep-orange-8',
    },
    {
      label: `8 + PB + CON (DC ${8 + ctx.pb + ctx.conMod})`,
      value: 8 + ctx.pb + ctx.conMod,
      formula: '8 + PB + CON_MOD',
      category: '5e DC Formula',
      categoryColor: 'deep-orange-8',
    },
    {
      label: `8 + PB + INT (DC ${8 + ctx.pb + ctx.intMod})`,
      value: 8 + ctx.pb + ctx.intMod,
      formula: '8 + PB + INT_MOD',
      category: '5e DC Formula',
      categoryColor: 'deep-orange-8',
    },
    {
      label: `8 + PB + WIS (DC ${8 + ctx.pb + ctx.wisMod})`,
      value: 8 + ctx.pb + ctx.wisMod,
      formula: '8 + PB + WIS_MOD',
      category: '5e DC Formula',
      categoryColor: 'deep-orange-8',
    },
    {
      label: `8 + PB + CHA (DC ${8 + ctx.pb + ctx.chaMod})`,
      value: 8 + ctx.pb + ctx.chaMod,
      formula: '8 + PB + CHA_MOD',
      category: '5e DC Formula',
      categoryColor: 'deep-orange-8',
    },
    {
      label: `10 + DEX (AC ${10 + ctx.dexMod})`,
      value: 10 + ctx.dexMod,
      formula: '10 + DEX_MOD',
      category: '5e AC Formula',
      categoryColor: 'cyan-9',
    },
    {
      label: `10 + DEX + CON (AC ${10 + ctx.dexMod + ctx.conMod})`,
      value: 10 + ctx.dexMod + ctx.conMod,
      formula: '10 + DEX_MOD + CON_MOD',
      category: '5e AC Formula',
      categoryColor: 'cyan-9',
    },
    {
      label: `10 + DEX + WIS (AC ${10 + ctx.dexMod + ctx.wisMod})`,
      value: 10 + ctx.dexMod + ctx.wisMod,
      formula: '10 + DEX_MOD + WIS_MOD',
      category: '5e AC Formula',
      categoryColor: 'cyan-9',
    },
    {
      label: `13 + DEX (AC ${13 + ctx.dexMod})`,
      value: 13 + ctx.dexMod,
      formula: '13 + DEX_MOD',
      category: '5e AC Formula',
      categoryColor: 'cyan-9',
    }
  )

  // 5. Context-Specific Standards
  if (props.contextType === 'range') {
    const ranges = [5, 10, 15, 20, 30, 60, 90, 120, 150, 300, 600]
    ranges.forEach((r) => {
      list.push({
        label: `${r} ft`,
        value: r,
        category: 'Standard Range',
        categoryColor: 'blue-grey-8',
      })
    })
  } else if (props.contextType === 'dice_count') {
    const counts = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20]
    counts.forEach((c) => {
      list.push({
        label: `${c} Dice`,
        value: c,
        category: 'Dice Count',
        categoryColor: 'blue-grey-8',
      })
    })
  } else {
    // Standard Common Integers
    const stdInts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 25, 30, 40, 50, 60, 100]
    stdInts.forEach((num) => {
      list.push({
        label: `${num}`,
        value: num,
        category: 'Flat Value',
        categoryColor: 'grey-7',
      })
    })
  }

  return list
})

const filteredOptions = computed(() => {
  const needle = filterText.value.toLowerCase().trim()
  if (!needle) return allOptions.value

  const matches = allOptions.value.filter(
    (opt) =>
      opt.label.toLowerCase().includes(needle) ||
      (opt.formula && opt.formula.toLowerCase().includes(needle)) ||
      (opt.category && opt.category.toLowerCase().includes(needle))
  )

  // If user typed something not strictly matching, offer dynamic formula evaluation option
  const evaluated = evaluateSafeFormula(needle, {
    avgHp: dynamicContext.value.avgHp,
    proficiency: dynamicContext.value.pb,
    cr: dynamicContext.value.cr,
    hd: dynamicContext.value.hd,
    hdType: dynamicContext.value.hdType,
    stats: dynamicContext.value.stats,
  })

  if (evaluated != null) {
    matches.unshift({
      label: `Custom Formula: "${needle}" (= ${evaluated})`,
      value: props.allowFormulaString ? needle : evaluated,
      formula: needle,
      category: 'Evaluated Custom Formula',
      categoryColor: 'amber-9',
      icon: 'calculate',
      color: 'amber-4',
    })
  }

  return matches
})

const displayValue = computed(() => {
  if (props.modelValue == null || props.modelValue === '') return ''
  // If it's a numeric value or numeric string, return it directly so we never show "HD Typ" or "DEX Sc"
  if (typeof props.modelValue === 'number' || (!isNaN(Number(props.modelValue)) && !props.allowFormulaString)) {
    return String(props.modelValue)
  }
  const strVal = String(props.modelValue)
  const formulaMatch = allOptions.value.find(
    (opt) => opt.formula === strVal
  )
  if (formulaMatch) return formulaMatch.label
  return strVal
})

const resolvedPreviewNumber = computed(() => {
  if (props.modelValue == null || props.modelValue === '') return 0
  if (typeof props.modelValue === 'number') return props.modelValue
  const evalRes = evaluateSafeFormula(String(props.modelValue), {
    avgHp: dynamicContext.value.avgHp,
    proficiency: dynamicContext.value.pb,
    cr: dynamicContext.value.cr,
    hd: dynamicContext.value.hd,
    hdType: dynamicContext.value.hdType,
    stats: dynamicContext.value.stats,
  })
  return (evalRes ?? Number(props.modelValue)) || 0
})

const activeFormulaLabel = computed(() => {
  if (typeof props.modelValue === 'string' && props.modelValue && isNaN(Number(props.modelValue))) {
    const match = allOptions.value.find((opt) => opt.formula === props.modelValue)
    return match ? match.label : props.modelValue
  }
  return ''
})

const tooltipExplanation = computed(() => {
  if (props.contextType === 'stat') return 'Score drives ability modifier, saving throws, skills, and DCs.'
  if (props.contextType === 'ac') return 'Armor Class protects against incoming attack rolls.'
  if (props.contextType === 'dc') return 'Difficulty Class target for creatures to resist effects.'
  if (props.contextType === 'bonus') return 'Modifier added to d20 rolls or damage.'
  return 'Select a standard 5e dynamic reference or enter a custom formula.'
})

function onFilter(val: string, update: (callbackFn: () => void) => void) {
  update(() => {
    filterText.value = val
  })
}

function onInputValue(val: string) {
  filterText.value = val
}

function onOptionSelect(selected: SelectOption | number | string) {
  let valToEmit: number | string
  let evaluatedNum: number

  if (typeof selected === 'object' && selected !== null && 'value' in selected) {
    valToEmit = props.allowFormulaString && selected.formula ? selected.formula : selected.value
    evaluatedNum = typeof selected.value === 'number' ? selected.value : (evaluateSafeFormula(selected.value, dynamicContext.value) ?? 0)
  } else if (typeof selected === 'number') {
    valToEmit = selected
    evaluatedNum = selected
  } else {
    // String input
    const evalRes = evaluateSafeFormula(selected, {
      avgHp: dynamicContext.value.avgHp,
      proficiency: dynamicContext.value.pb,
      cr: dynamicContext.value.cr,
      hd: dynamicContext.value.hd,
      hdType: dynamicContext.value.hdType,
      stats: dynamicContext.value.stats,
    })
    evaluatedNum = evalRes ?? 0
    valToEmit = props.allowFormulaString ? selected : evaluatedNum
  }

  if (props.min != null && typeof valToEmit === 'number') {
    valToEmit = Math.max(props.min, valToEmit)
  }
  if (props.max != null && typeof valToEmit === 'number') {
    valToEmit = Math.min(props.max, valToEmit)
  }

  emit('update:modelValue', valToEmit)
  emit('evaluated', evaluatedNum)
}
</script>

<style scoped lang="scss">
.dynamic-ref-option-item {
  transition: background-color 0.15s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }
}
</style>
