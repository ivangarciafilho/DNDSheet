import { useMonsterStore } from 'src/stores/monster-store'
import { computed, inject, provide } from 'vue'
import type { InjectionKey } from 'vue'
import { DamageDefenseItem, DefenseModifierMode } from '../../models'
import { formatDefenseList } from 'src/core/domain/defense-and-traits-utils'
import { v4 as uuidv4 } from 'uuid'

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

// State and handlers shared by ResistancesEditor and its section components (ADR-0003 provide/inject).
export function useResistancesEditorState() {
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

  const toCatalogEntries = (items: readonly string[]) => items.map((value) => ({ value, label: value }))
  const vulnerabilityDamageEntries = computed(() => toCatalogEntries(vulnerabilityDamageOptions.value))
  const vulnerabilityConditionEntries = computed(() => toCatalogEntries(vulnerabilityConditionOptions.value))
  const resistanceDamageEntries = computed(() => toCatalogEntries(resistanceDamageOptions.value))
  const conditionResistancesEntries = computed(() => toCatalogEntries(conditionResistancesOptions.value))
  const immunityDamageEntries = computed(() => toCatalogEntries(immunityDamageOptions.value))
  const conditionImmunitiesEntries = computed(() => toCatalogEntries(conditionImmunitiesOptions.value))
  const acquiredConditionEntries = toCatalogEntries(ACQUIRED_CONDITION_OPTIONS)
  const conditionVulnerabilityActionEntries = toCatalogEntries(CONDITION_VULNERABILITY_ACTIONS)
  const conditionDurationEntries = CONDITION_DURATION_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
    group: opt.category,
    badge: opt.category,
    icon: opt.icon,
    color: opt.color,
  }))

  return {
    monster,
    damageTypeOptions: DAMAGE_PRESETS,
    conditionTypeOptions: CONDITION_PRESETS,
    vulnerabilityDamageEntries,
    vulnerabilityConditionEntries,
    resistanceDamageEntries,
    conditionResistancesEntries,
    immunityDamageEntries,
    conditionImmunitiesEntries,
    resistanceModeOptions: RESISTANCE_MODE_OPTIONS,
    vulnerabilityModeOptions: VULNERABILITY_MODE_OPTIONS,
    conditionModeOptions: CONDITION_MODE_OPTIONS,
    saveOutcomeOptions: SAVE_OUTCOME_OPTIONS,
    conditionVulnerabilityActionEntries,
    acquiredConditionEntries,
    conditionDurationEntries,
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
}

export type ResistancesEditorState = ReturnType<typeof useResistancesEditorState>
const KEY: InjectionKey<ResistancesEditorState> = Symbol('ResistancesEditor')
export const provideResistancesEditorState = (state: ResistancesEditorState) => { provide(KEY, state); return state }
export const injectResistancesEditorState = (): ResistancesEditorState => {
  const state = inject(KEY)
  if (!state) throw new Error('ResistancesEditor section used outside ResistancesEditor')
  return state
}
