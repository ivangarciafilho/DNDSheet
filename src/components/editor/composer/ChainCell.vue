<template>
  <button
    type="button"
    class="chain-chip"
    :class="chipClasses"
    :data-chain-cell="cell.id"
    :aria-label="ariaLabel"
    :aria-invalid="cell.invalid ? 'true' : undefined"
    aria-haspopup="dialog"
    :aria-expanded="open ? 'true' : 'false'"
    @keydown.delete.prevent="clearFromChip"
  >
    <q-icon v-if="cell.state === 'empty'" name="add" size="12px" class="chain-chip__icon" />
    <q-icon v-else-if="cell.shadowed" name="visibility_off" size="12px" class="chain-chip__icon" />
    <span v-if="cell.items && cell.items.length" class="chain-chip__items">
      <span v-for="(item, index) in cell.items" :key="index" class="chain-chip__item">{{ item }}</span>
    </span>
    <span v-else class="chain-chip__text">{{ cell.text }}</span>
    <span v-if="cell.auto" class="chain-chip__tag">auto</span>
    <span v-if="cell.legacy" class="chain-chip__tag">legacy</span>
    <q-tooltip v-if="!open" class="text-caption" :delay="400" max-width="300px">{{ tooltip }}</q-tooltip>

    <!-- One popup only: nested Quasar popups mis-position inside a menu, so options render inline. -->
    <q-menu
      v-model="open"
      anchor="bottom left"
      self="top left"
      :offset="[0, 4]"
      :transition-duration="0"
      max-width="min(94vw, 460px)"
      class="chain-editor-menu bg-grey-10 text-white"
      @before-show="startEditing"
      @show="focusOption"
    >
      <form class="chain-editor" :aria-label="`Edit ${cell.label}`" @submit.prevent="apply" @keydown="holdEnter" @keyup="applyOnEnter">
        <div class="chain-editor__title">{{ cell.label }}</div>

        <mechanic-text-editor v-if="kind === 'text' && cell.id === 'trigger'" v-model="draft" dense outlined dark :label="cell.label" />
        <mechanic-text-editor v-else-if="kind === 'text'" v-model="draft" scope="action" dense outlined dark autofocus :label="cell.label" :hint="hint" />

        <formula-field v-else-if="kind === 'number' && numericPath && isolatedNumericModel" data-enter-local :path="numericPath" :label="cell.label" :draft-model="isolatedNumericModel" @applied="value => draft = value" @draft-state="value => numericDraftPending = value" />
        <q-input
          v-else-if="kind === 'number'"
          v-model="draft"
          type="number"
          dense
          outlined
          dark
          autofocus
          :label="cell.label"
          :hint="numberHint"
        />

        <div v-else-if="kind === 'select'" ref="optionList" class="chain-options" role="listbox" :aria-label="cell.label" @keydown="moveOptionFocus">
          <q-item
            v-for="option in selectOptions"
            :key="option.value"
            clickable
            dense
            class="chain-option"
            :class="{ 'chain-option--active': option.value === draft }"
            :data-category="option.category || undefined"
            :data-tone="option.tone || undefined"
            role="option"
            :aria-selected="option.value === draft ? 'true' : 'false'"
            @click="pick(option.value)"
          >
            <q-item-section>{{ option.label }}</q-item-section>
            <q-item-section v-if="option.value === draft" side>
              <q-icon name="check" size="16px" color="amber-5" />
            </q-item-section>
            <q-tooltip v-if="option.tooltip" class="bg-grey-10 text-amber-2 text-caption" :delay="250" max-width="260px">
              {{ option.tooltip }}
            </q-tooltip>
          </q-item>
        </div>

        <template v-else-if="kind === 'suggest'">
          <q-input v-model="draft" dense outlined dark autofocus :label="cell.label" :list="listId" hint="Pick a categorized suggestion below or type your own" />
          <datalist :id="listId">
            <option v-for="option in spec.options" :key="option" :value="option" />
          </datalist>
          <div v-if="suggestCatalog.length" class="chain-suggest-catalog q-mt-xs">
            <div
              v-for="item in suggestCatalog"
              :key="item.value"
              class="chain-suggest-item row items-center no-wrap justify-between q-px-sm q-py-xs cursor-pointer"
              :class="{ 'chain-suggest-item--active': item.value === draft }"
              @click="pick(item.value)"
            >
              <div class="row items-center no-wrap q-gutter-x-xs ellipsis">
                <q-icon :name="item.icon" :color="item.color" size="14px" />
                <span class="text-caption text-grey-2 ellipsis">{{ item.label }}</span>
              </div>
              <q-badge outline :color="item.color" :label="item.category" class="q-ml-xs" style="font-size: 9px; padding: 1px 4px" />
              <q-tooltip class="bg-grey-10 text-amber-2 text-caption" :delay="250" max-width="260px">
                {{ item.tooltip }}
              </q-tooltip>
            </div>
          </div>
        </template>

        <div v-else-if="kind === 'multi'" class="chain-checks">
          <q-checkbox v-for="option in multiOptions" :key="option" v-model="draft" :val="option" :label="option" dense dark />
          <div v-if="spec.allowCustom" class="row q-col-gutter-xs items-center q-mt-xs">
            <div class="col">
              <q-input v-help="'Enter other for the chain cell.'" v-model="customEntry" dense outlined dark label="Other" data-enter-local @keydown.enter.prevent="addCustom" />
            </div>
            <div class="col-auto">
              <q-btn v-help="'Add in the chain cell.'" flat dense no-caps size="sm" icon="add" label="Add" @click="addCustom" />
            </div>
          </div>
        </div>

        <div v-else-if="kind === 'count'" class="row q-col-gutter-xs items-center">
          <div class="col">
            <q-input v-help="'Enter how many for the chain cell.'" v-model="draft.count" dense outlined dark autofocus label="How many" hint="A number, all, or a formula such as PB" />
          </div>
          <div class="col-auto">
            <q-toggle v-help="'Turn on or off up to for the chain cell.'" v-model="draft.mode" true-value="up_to" false-value="exact" label="up to" dark dense />
          </div>
        </div>

        <div v-else-if="kind === 'range'" class="column q-gutter-y-xs">
          <q-btn-toggle v-model="draft.relation" :options="relationOptions" dense no-caps unelevated size="sm" toggle-color="amber-9" color="grey-8" />
          <div class="row q-col-gutter-xs items-start">
            <div class="col-5">
              <q-input v-help="'Enter distance for the chain cell.'" v-model="draft.distance" dense outlined dark autofocus label="Distance" />
            </div>
            <div class="col-auto self-center">
              <q-btn-toggle v-model="draft.unit" :options="unitOptions" dense no-caps unelevated size="sm" toggle-color="amber-9" color="grey-8" />
            </div>
            <div class="col">
              <q-input v-help="'Enter of for the chain cell.'" v-model="draft.origin" dense outlined dark label="Of" placeholder="you" />
            </div>
          </div>
        </div>

        <div v-else-if="kind === 'area'" class="row q-col-gutter-xs items-start">
          <div class="col-12 col-sm-5">
            <q-input v-help="'Enter shape for the chain cell.'" v-model="draft.shape" dense outlined dark autofocus label="Shape" :list="listId" />
            <datalist :id="listId">
              <option v-for="shape in areaShapes" :key="shape" :value="shape" />
            </datalist>
          </div>
          <div class="col-5 col-sm-3">
            <q-input v-help="'Enter size for the chain cell.'" v-model="draft.distance" dense outlined dark label="Size" />
          </div>
          <div class="col-auto self-center">
            <q-btn-toggle v-model="draft.unit" :options="unitOptions" dense no-caps unelevated size="sm" toggle-color="amber-9" color="grey-8" />
          </div>
          <div class="col-12">
            <q-input v-help="'Enter originating from for the chain cell.'" v-model="draft.origin" dense outlined dark label="Originating from" placeholder="itself" />
          </div>
        </div>

        <action-usage-editor v-else-if="kind === 'action-usage'" ref="usageEditor" v-model="draft" />
        <trait-cadence-editor v-else-if="kind === 'trait-cadence'" v-model="draft" />
        <chain-outcomes-editor v-else-if="kind === 'outcomes' || kind === 'effects'" v-model="draft" :mode="kind" />

        <div v-if="error" class="chain-editor__error" role="alert">{{ error }}</div>

        <div class="row justify-end q-gutter-xs q-mt-sm">
          <q-btn v-help="'Clear in the chain cell.'" v-if="clearable" flat dense no-caps size="sm" color="grey-4" label="Clear" @click="clear" />
          <q-btn v-help="'Cancel in the chain cell.'" v-close-popup flat dense no-caps size="sm" color="grey-4" label="Cancel" />
          <q-btn v-help="'Apply in the chain cell.'" v-close-popup type="submit" unelevated dense no-caps size="sm" color="amber-9" label="Apply" :disable="!!error || numericDraftPending" />
        </div>
      </form>
    </q-menu>
  </button>
</template>

<script lang="ts">
import MechanicTextEditor from '../MechanicTextEditor.vue'
import { stabilizeOutcomeIds } from 'src/core/domain/outcome-identities'
import { computed, defineComponent, PropType, ref } from 'vue'
import TraitCadenceEditor from './TraitCadenceEditor.vue'
import ActionUsageEditor from './ActionUsageEditor.vue'
import { ABILITY_NAMES } from 'src/core/domain/ability-grammar'
import { AREA_SHAPES, LEGENDARY_COSTS, SAVE_ABILITIES } from 'src/core/domain/action-composer'
import type { ComposerCellSpec } from 'src/core/domain/action-composer'
import { ATTACK_KINDS, validateCell } from 'src/core/domain/composer-chain'
import type { ChainCellView } from 'src/core/domain/composer-chain'
import type { DndStat } from 'src/core/domain/types'
import ChainOutcomesEditor from './ChainOutcomesEditor.vue'
import FormulaField from 'src/components/kit/FormulaField.vue'
import type { NumericBinding } from 'src/core/domain/formula'

type EditorKind = 'text' | 'number' | 'select' | 'suggest' | 'multi' | 'count' | 'range' | 'area' | 'outcomes' | 'effects' | 'trait-cadence' | 'action-usage'

const HELP: Readonly<Record<string, string>> = {
  'trait-usage': 'Edit limited uses, specific recharge timing, count and printed tag overrides. Conditional text is managed in Trait display settings.',
  usage: 'Choose no usage limit, a recharge roll, limited uses per interval, or custom recharge text.',
  discipline: 'Magic school or martial discipline, printed before the name.',
  tier: 'Spell level or power tier. Cantrips print after the school.',
  name: 'The name exactly as printed; casing is kept.',
  components: 'Verbal, Somatic and Material components, plus the Concentration and Ritual tags.',
  duration: 'Printed after the name unless Instantaneous.',
  attack: 'Melee or Ranged, Weapon or Spell. Prints as the attack roll.',
  'weapon-ability': 'Automatic uses DEX for ranged-only attacks and STR otherwise. Finesse uses the better modifier. Thrown melee weapons keep STR unless finesse; thrown ranged weapons use Automatic. A numeric attack bonus overrides this rule.',
  'attack-bonus': "Bonus to hit. Blank uses the creature's own bonus.",
  'save-ability': 'The ability targets save with.',
  'save-dc': "The DC targets roll against. Blank uses the creature's DC for that ability.",
  'target-count': 'How many targets: a number, all, or a formula such as PB.',
  'target-kind': 'What it targets: creatures, objects, allies…',
  'target-qualifier': 'A condition on the targets, such as "which you can see".',
  'target-range': 'Distance and relation, such as "within 120 ft. of you".',
  'target-area': 'Area shape and size, such as a 20-foot cone.',
  'target-planes': 'Planes of existence the effect reaches across.',
  outcomes: 'What happens on a hit, a failed save or a success.',
  'legacy-targets': 'Imported target text, kept as written.',
  'legacy-range': 'Imported range text, kept as written.',
  'legacy-area': 'Imported area text, kept as written.',
  'legacy-area-distance': 'Imported area size, kept as written.',
  'legacy-effects': 'Imported effect lines, kept as written.',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Plain-data copy: the draft must never write through to the store before Apply. */
const copy = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)))

let instances = 0

export default defineComponent({
  name: 'ChainCell',
  components: { MechanicTextEditor, FormulaField, ChainOutcomesEditor, TraitCadenceEditor, ActionUsageEditor },
  props: {
    cell: { type: Object as PropType<ChainCellView>, required: true },
    spec: { type: Object as PropType<ComposerCellSpec>, required: true },
    /** The editor's starting value, read fresh from the store each time the editor opens. */
    value: { type: [String, Number, Boolean, Object, Array, Symbol] as PropType<unknown>, required: false },
    numericPath: { type: String, default: undefined },
    numericDraftModel: { type: Function as PropType<(cellId: string) => object>, default: undefined },
    allowClear: { type: Boolean, default: true },
    numberHint: { type: String, default: "Leave blank to use the creature's own value" },
    validate: { type: Function as PropType<(value: unknown) => string>, default: undefined },
  },
  emits: ['commit', 'clear'],
  setup(props, { emit }) {
    const usageEditor = ref<{ focus: () => void }>()
    const listId = `chain-cell-options-${++instances}`
    const open = ref(false)
    const numericDraftPending = ref(false)
    const isolatedNumericModel = ref<(object & { bindings?: Record<string, NumericBinding> }) | undefined>()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the draft's shape depends on the cell kind
    const draft = ref<any>('')
    const customEntry = ref('')
    const optionList = ref<HTMLElement | null>(null)

    const kind = computed<EditorKind>(() => {
      if (['usage','trait-usage'].includes(props.cell.id) && isRecord(props.value) && 'mode' in props.value) return 'action-usage'
      switch (props.cell.id) {
        case 'trait-usage': return 'trait-cadence'
        case 'target-count': return 'count'
        case 'target-range': return 'range'
        case 'target-area': return 'area'
        case 'outcomes': return 'outcomes'
        case 'legacy-effects': return 'effects'
      }
      if (props.spec.editor === 'number') return 'number'
      if (props.spec.editor === 'catalog') return props.spec.multiple ? 'multi' : props.spec.allowCustom ? 'suggest' : 'select'
      return 'text'
    })

    const describeOption = (cellId: string, label: string, value: string) => {
      if (cellId === 'discipline') {
        const isMartial = ['Martial', 'Psionic', 'Supernatural'].includes(value)
        return {
          label,
          value,
          category: isMartial ? 'Origin' : 'School',
          tone: isMartial ? 'amber' : 'purple',
          tooltip: isMartial
            ? `${label} origin classification printed in the ability header.`
            : `${label} school of magic printed in the spell/action header.`,
        }
      }
      if (cellId === 'tier') {
        const isEpic = ['Heroic', 'Legendary', 'Mythic'].includes(value)
        const isCantrip = value === 'Cantrip'
        return {
          label,
          value,
          category: isEpic ? 'Tier' : isCantrip ? 'At-Will' : 'Spell Slot',
          tone: isEpic ? 'orange' : isCantrip ? 'teal' : 'blue',
          tooltip: isCantrip
            ? 'At-will cantrip tier (printed after the school name).'
            : `${label} power or spell tier printed in the header.`,
        }
      }
      if (cellId === 'attack') {
        const isSpell = value.includes('spell')
        return {
          label,
          value,
          category: isSpell ? 'Spell' : 'Weapon',
          tone: isSpell ? 'purple' : 'red',
          tooltip: `${label} roll printed in the action mechanics row.`,
        }
      }
      if (cellId === 'save-ability') {
        const physical = ['STR', 'DEX', 'CON'].includes(value)
        return {
          label,
          value,
          category: physical ? 'Physical' : 'Mental',
          tone: physical ? 'orange' : 'cyan',
          tooltip: `Targets roll a ${label} saving throw against the Save DC.`,
        }
      }
      return {
        label,
        value,
        category: '',
        tone: 'amber',
        tooltip: `${label} (${props.cell.label})`,
      }
    }

    const selectOptions = computed(() => {
      switch (props.cell.id) {
        case 'attack':
          return ATTACK_KINDS.map((attack) => describeOption('attack', attack.label, attack.id))
        case 'save-ability':
          return SAVE_ABILITIES.map((stat) => describeOption('save-ability', `${ABILITY_NAMES[stat as DndStat]} (${stat})`, stat))
        case 'usage':
          return LEGENDARY_COSTS.map((cost) => describeOption('usage', cost === '1' ? '1 Action' : `Costs ${cost} Actions`, cost))
        default:
          return (props.spec.options ?? []).map((option) => describeOption(props.cell.id, option, option))
      }
    })

    const suggestCatalog = computed(() => {
      const raw = [...(props.spec.options ?? [])]
      const q = typeof draft.value === 'string' ? draft.value.trim().toLowerCase() : ''
      const categorize = (opt: string) => {
        if (props.cell.id === 'duration') {
          if (/^Instantaneous$/i.test(opt) || /turn|combat/i.test(opt)) {
            return { category: 'Turn / Combat', icon: 'bolt', color: 'amber-5', order: 1, tooltip: `Tactical combat duration: ${opt}.` }
          }
          if (/^Concentration/i.test(opt)) {
            return { category: 'Concentration', icon: 'psychology', color: 'purple-4', order: 2, tooltip: `Requires Concentration: ${opt}.` }
          }
          if (/^\d+\s+(round|minute|hour)/i.test(opt)) {
            return { category: 'Measured Time', icon: 'schedule', color: 'cyan-4', order: 3, tooltip: `Fixed elapsed duration: ${opt}.` }
          }
          return { category: 'Rest / State', icon: 'autorenew', color: 'teal-4', order: 4, tooltip: `Condition, rest, or state milestone: ${opt}.` }
        }
        if (props.cell.id === 'target-kind') {
          if (/^(ally|allies|enemy|enemies|self|creature|creatures|target|targets)$/i.test(opt)) {
            return { category: 'Core Role', icon: 'groups', color: 'amber-5', order: 1, tooltip: `Target role or unit: ${opt}.` }
          }
          if (/^(object|objects|point|space|spaces|structure|structures)$/i.test(opt)) {
            return { category: 'Object / Space', icon: 'category', color: 'cyan-4', order: 2, tooltip: `Inanimate or spatial target: ${opt}.` }
          }
          return { category: 'Creature Type', icon: 'pets', color: 'purple-4', order: 3, tooltip: `Specific creature type filter: ${opt}.` }
        }
        if (props.cell.id === 'target-qualifier') {
          if (/see|hear/i.test(opt)) {
            return { category: 'Sensory', icon: 'visibility', color: 'cyan-4', order: 1, tooltip: `Line-of-sight or sensory requirement: ${opt}.` }
          }
          if (/Bloodied|Prone|Grappled|Restrained|Construct|Undead/i.test(opt)) {
            return { category: 'Condition / State', icon: 'New_releases', color: 'orange-4', order: 2, tooltip: `Target state or condition filter: ${opt}.` }
          }
          return { category: 'Selection', icon: 'tune', color: 'amber-4', order: 3, tooltip: `Target selection qualifier: ${opt}.` }
        }
        return { category: 'Option', icon: 'label', color: 'amber-4', order: 1, tooltip: opt }
      }
      return raw
        .filter((opt) => !q || opt.toLowerCase().includes(q) || opt === draft.value)
        .map((opt) => ({ label: opt, value: opt, ...categorize(opt) }))
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
    })

    // Custom values already on the entry stay visible as checked options.
    const multiOptions = computed(() => {
      const chosen: string[] = Array.isArray(draft.value) ? draft.value : []
      return [...(props.spec.options ?? []), ...chosen.filter((value) => !(props.spec.options ?? []).includes(value))]
    })

    const startEditing = () => {
      customEntry.value = ''
      numericDraftPending.value = false
      isolatedNumericModel.value = props.numericPath ? props.numericDraftModel?.(props.cell.id) : undefined
      const value = copy(props.value)
      switch (kind.value) {
        case 'count':
          draft.value = isRecord(value) ? { count: value.count ?? '', mode: value.mode === 'up_to' ? 'up_to' : 'exact' } : { count: '', mode: 'exact' }
          break
        case 'range':
          draft.value = isRecord(value) ? { relation: '', unit: 'ft', origin: '', ...value } : { relation: 'within', unit: 'ft', origin: '', distance: '' }
          break
        case 'area':
          draft.value = isRecord(value) ? { unit: 'ft', origin: '', distance: '', ...value } : { shape: '', unit: 'ft', origin: '', distance: '' }
          break
        case 'outcomes':
          draft.value = stabilizeOutcomeIds(value === undefined || value === null || Array.isArray(value) && !value.length ? [{ trigger: 'hit', effects: [{ kind: 'damage', formula: '', damageType: '' }] }] : value, listId)
          break
        case 'effects':
        case 'multi':
          draft.value = Array.isArray(value) ? value : []
          break
        default:
          draft.value = value ?? ''
      }
    }

    const error = computed(() => (open.value ? (props.validate?.(draft.value) ?? validateCell(props.cell.id, draft.value)) : ''))
    const clearable = computed(() => props.allowClear && props.cell.state === 'set' && props.cell.id !== 'name' && props.spec.field !== 'cost')

    const apply = () => {
      if (error.value || numericDraftPending.value) return
      emit('commit', copy(draft.value), props.numericPath ? isolatedNumericModel.value?.bindings?.[props.numericPath] ?? null : undefined)
      open.value = false
    }
    const isFieldEnter = (event: KeyboardEvent): boolean => {
      const target = event.target as HTMLInputElement
      return event.key === 'Enter' && !event.isComposing && target.tagName === 'INPUT' &&
        !['checkbox', 'radio', 'button', 'submit'].includes(target.type) && !target.closest('[data-enter-local]')
    }
    // Quasar re-opens a menu on an Enter keyup at its anchor. Applying on keydown would close the menu,
    // refocus the chip and let that keyup re-open it, so Enter is held on keydown and applied on keyup.
    const holdEnter = (event: KeyboardEvent) => {
      if (!event.defaultPrevented && isFieldEnter(event)) event.preventDefault()
    }
    const applyOnEnter = (event: KeyboardEvent) => {
      if (isFieldEnter(event)) apply()
    }
    const pick = (value: string) => {
      draft.value = value
      apply()
    }
    const clear = () => {
      emit('clear')
      open.value = false
    }
    const clearFromChip = () => {
      if (clearable.value) emit('clear')
    }
    const addCustom = () => {
      const value = customEntry.value.trim()
      if (value && Array.isArray(draft.value) && !draft.value.includes(value)) draft.value = [...draft.value, value]
      customEntry.value = ''
    }

    const options = () => [...(optionList.value?.querySelectorAll<HTMLElement>('.chain-option') ?? [])]
    const focusOption = () => {
      if (kind.value === 'action-usage') { usageEditor.value?.focus(); return }
      if (kind.value !== 'select') return
      const list = options()
      ;(list.find((option) => option.classList.contains('chain-option--active')) ?? list[0])?.focus()
    }
    const moveOptionFocus = (event: KeyboardEvent) => {
      const list = options()
      const current = list.indexOf(document.activeElement as HTMLElement)
      const next =
        event.key === 'ArrowDown' ? Math.min(list.length - 1, current + 1)
        : event.key === 'ArrowUp' ? Math.max(0, current - 1)
        : event.key === 'Home' ? 0
        : event.key === 'End' ? list.length - 1
        : -1
      if (next < 0) return
      event.preventDefault()
      list[next]?.focus()
    }

    const tooltip = computed(() => {
      const help = props.cell.id === 'usage' && props.cell.label === 'Uses'
        ? 'Uses per recharge interval. Enter a count and rate such as 3/Day.'
        : HELP[props.cell.id] ?? props.cell.label
      const parts = [help]
      if (props.cell.auto) parts.push('The shown value is automatic.')
      if (props.cell.shadowed) parts.push('Not printed: structured data on this ability replaces it. Clear it or move it into the chips.')
      if (props.cell.invalid) parts.push(props.cell.invalid + '.')
      parts.push(clearable.value ? 'Enter to edit, Delete to clear.' : 'Enter to edit.')
      return parts.join(' ')
    })

    const ariaLabel = computed(() => {
      const state = props.cell.state === 'set' ? props.cell.text : 'not set'
      const notes = [props.cell.auto ? 'automatic' : '', props.cell.shadowed ? 'not printed' : '', props.cell.invalid ?? ''].filter(Boolean)
      return `${props.cell.label}: ${state}${notes.length ? ` (${notes.join(', ')})` : ''}`
    })

    const chipClasses = computed(() => [
      `chain-chip--${props.cell.row === 'head' ? 'head' : 'data'}`,
      `chain-chip--${props.cell.state}`,
      {
        'chain-chip--name': props.cell.id === 'name',
        'chain-chip--legacy': props.cell.legacy,
        'chain-chip--shadowed': props.cell.shadowed,
        'chain-chip--invalid': !!props.cell.invalid,
        'chain-chip--multiline': !!props.cell.items?.length,
      },
    ])

    const hint = computed(() => props.cell.id === 'usage' && props.cell.label === 'Uses'
      ? 'Count and recharge rate, such as 3/Day'
      : props.cell.id === 'usage'
        ? 'Recharge range such as 5–6, or text'
        : props.cell.legacy ? 'Printed exactly as written' : undefined)

    return {
      isolatedNumericModel,
      numericDraftPending,
      usageEditor,
      listId,
      open,
      draft,
      customEntry,
      optionList,
      kind,
      selectOptions,
      suggestCatalog,
      multiOptions,
      startEditing,
      error,
      clearable,
      apply,
      holdEnter,
      applyOnEnter,
      pick,
      clear,
      clearFromChip,
      addCustom,
      focusOption,
      moveOptionFocus,
      tooltip,
      ariaLabel,
      chipClasses,
      hint,
      areaShapes: AREA_SHAPES,
      relationOptions: [
        { label: '—', value: '' },
        { label: 'within', value: 'within' },
        { label: 'reach', value: 'reach' },
        { label: 'range', value: 'range' },
      ],
      unitOptions: [
        { label: 'ft', value: 'ft' },
        { label: 'mi', value: 'mi' },
      ],
    }
  },
})
</script>

<style scoped>
.chain-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  min-height: 26px;
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  font: inherit;
  font-size: 0.8rem;
  line-height: 1.25;
  text-align: left;
  cursor: pointer;
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
}

.chain-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.chain-chip:focus-visible {
  outline: 2px solid #ffca28;
  outline-offset: 2px;
}

/* Set chips wear the plate's WotC colours: crimson head, parchment data. */
.chain-chip--head.chain-chip--set {
  background: #58180d;
  color: #fdf1dc;
  font-weight: 700;
}

.chain-chip--data.chain-chip--set {
  background: #fbf2e3;
  color: #2b1b12;
  font-weight: 600;
}

.chain-chip--name.chain-chip--set {
  font-size: 0.86rem;
  font-weight: 800;
}

.chain-chip--empty {
  background: transparent;
  color: #b0b7bf;
  border: 1px dashed rgba(255, 255, 255, 0.35);
  font-style: italic;
}

.chain-chip--multiline {
  align-items: flex-start;
}

.chain-chip--shadowed {
  opacity: 0.55;
}

.chain-chip--invalid {
  border-bottom: 2px solid #ef5350;
}

.chain-chip__icon {
  flex: 0 0 auto;
}

.chain-chip__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chain-chip__text,
.chain-chip__item {
  overflow-wrap: anywhere;
}

.chain-chip__tag {
  font-size: 0.62rem;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.7;
}

.chain-editor {
  width: min(92vw, 440px);
  max-width: 100%;
  box-sizing: border-box;
  padding: 10px 12px 12px;
}

.chain-editor__title {
  margin-bottom: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #ffcc80;
}

.chain-options {
  max-height: min(50vh, 320px);
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}

.chain-option--active {
  background: rgba(255, 179, 0, 0.14);
}

.chain-option[data-category]::after {
  content: attr(data-category);
  margin-left: auto;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 202, 40, 0.45);
  color: #ffe082;
  background: rgba(255, 179, 0, 0.12);
}

.chain-option[data-tone="purple"]::after {
  border-color: rgba(186, 104, 200, 0.5);
  color: #e1bee7;
  background: rgba(156, 39, 176, 0.14);
}

.chain-option[data-tone="teal"]::after,
.chain-option[data-tone="cyan"]::after {
  border-color: rgba(77, 208, 225, 0.5);
  color: #b2ebf2;
  background: rgba(0, 188, 212, 0.14);
}

.chain-option[data-tone="red"]::after,
.chain-option[data-tone="orange"]::after {
  border-color: rgba(255, 138, 101, 0.5);
  color: #ffccbc;
  background: rgba(244, 81, 30, 0.14);
}

.chain-suggest-catalog {
  max-height: 210px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.65);
}

.chain-suggest-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  transition: background 0.12s ease;
}

.chain-suggest-item:hover {
  background: rgba(255, 179, 0, 0.12);
}

.chain-suggest-item--active {
  background: rgba(255, 179, 0, 0.2);
}

.chain-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.chain-editor__error {
  margin-top: 6px;
  font-size: 0.75rem;
  color: #ff8a80;
}

@media (prefers-reduced-motion: reduce) {
  .chain-chip {
    transition: none;
  }

  .chain-chip:hover {
    transform: none;
  }
}
</style>
