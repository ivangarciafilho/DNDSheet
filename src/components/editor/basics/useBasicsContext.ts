import { computed, inject, provide, ref, watch, type InjectionKey } from 'vue'
import { useQuasar } from 'quasar'
import { v4 as uuidv4 } from 'uuid'
import { useMonsterStore } from 'src/stores/monster-store'
import { useEditorStore } from 'src/stores/editor-store'
import { mechanicRichHtml } from 'src/core/domain/mechanic-rich-text'
import { DICE_SELECT, DIE_LOOKUP } from 'src/data/DICE'
import { ALL_OFFICIAL_LANGUAGES } from 'src/data/LANGUAGES'
import { entryBindingPrefix, withoutEntryBindings } from 'src/core/domain/entry-bindings'
import { avgHP } from 'src/core/domain/math-utils'
import {
  calculatePointBuySpent,
  STANDARD_ARRAY,
  MONSTER_ROLE_ARCHETYPES,
  SPECIES_CATALOG,
  type MonsterRoleArchetype,
} from 'src/core/domain/species-and-heuristics'
import {
  formatLanguagesList,
  formatMinimalistRegen,
  formatMinimalistDeathPrevention,
  resolveDynamicNumericSource,
  composeAcAndDefenses,
} from 'src/core/domain/defense-and-traits-utils'
import {
  ComposableInitiativeRider,
  InitiativeAdvantageMode,
  InitiativeActionType,
  formatInitiativeRider,
  formatInitiativeRiders,
} from 'src/core/domain/initiative-composer'
import {
  defaultCrAnnotation,
  MonsterAcConfig,
  MonsterExtendedHp,
  MonsterInitiativeConfig,
  MonsterLanguageItem,
  ParagonConfig,
  ParagonPhaseConfig,
} from '../../models'
import { validateNumber } from '../numberInput'

const AC_SECONDARY_MODES = new Set([
  'parry',
  'without_advantage',
  'versus_damage_types',
  'damage_type',
  'while_cursed',
  'near_ally',
  'while_moving',
  'while_bloodied',
  'bloodied',
  'while_within_ally',
  'while_within_shield_bearer',
  'while_prone',
  'shield_spell',
  'shield_of_faith',
  'ranged_attacks',
  'melee_attacks',
  'distance_away',
  'first_attack_each_round',
  'attacks_beyond_first',
  'spell_attacks',
  'behind_flanking',
  'while_flying',
  'while_underwater',
  'in_bright_light',
  'in_daylight',
  'in_darkness',
  'in_light',
  'versus_bps',
  'versus_creature_types',
  'creature_type',
  'attack_type',
  'has_temp_hp',
  'took_damage_since',
  'while_concentrating',
  'asleep_unconscious',
])

const REGEN_TIMEFRAME_FREQS = new Set([
  'minute',
  'hour',
  'day',
  'dawn',
  'dusk',
  'midday',
  'midnight',
  'short_rest',
  'long_rest',
  'downtime',
])

const REGEN_END_TURN_FREQS = new Set([
  'turn_end',
  'end_of_its_turn',
  'end_of_a_turn',
  'end_of_current_turn',
])

export function createBasicsContext() {
  const monster = useMonsterStore()
  const editorStore = useEditorStore()
  const $q = useQuasar()

  const diceOptions = DICE_SELECT
  const diceLookup = DIE_LOOKUP
  const statKeys = Object.keys(monster.stats) as (keyof typeof monster.stats)[]
  const pointBuyInfo = computed(() => calculatePointBuySpent(monster.stats))
  const roleArchetypes = Object.values(MONSTER_ROLE_ARCHETYPES)
  const selectedSpecies = ref<string | null>(null)
  const portraitFile = ref<File | null>(null)
  const showManualLangEdit = ref(false)

  const openLayerStudio = () => {
    document.getElementById('a4-layer-studio-expansion')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const applyStandardArray = () => {
    monster.$patch((state) => {
      Object.assign(state.stats, STANDARD_ARRAY)
    })
  }

  const applyAllStats = (val: number) => {
    monster.$patch((state) => {
      for (const k of statKeys) {
        state.stats[k] = val
      }
    })
  }

  const applyArchetype = (arch: MonsterRoleArchetype) => {
    monster.$patch((state) => {
      Object.assign(state.stats, arch.stats)
    })
    $q.notify({ type: 'positive', message: `Applied ${arch.label} stat heuristic array` })
  }

  const onSpeciesSelected = (speciesId: string | null) => {
    if (!speciesId) return
    const entry = SPECIES_CATALOG.find((s) => s.id === speciesId)
    if (!entry) return
    $q.dialog({
      title: `Apply ${entry.name} Features?`,
      message: `This will update Type (${entry.type}), Subtype (${entry.subtype || 'none'}), Speed (${entry.speed || 30}ft), and append ${entry.traits.length} species traits.`,
      ok: { label: 'Apply', color: 'primary' },
      cancel: true,
    }).onOk(() => {
      monster.$patch((state) => {
        if (entry.type) state.type = entry.type
        if (entry.subtype) state.subtype = entry.subtype
        if (entry.size) state.size = entry.size
        if (entry.speed) {
          const walk = state.speeds.find((s) => !s.type || s.type.toLowerCase() === 'walk')
          if (walk) walk.speed = entry.speed
        }
        if (entry.traits?.length) {
          for (const t of entry.traits) {
            if (!state.traits.some((existing) => existing.name.toLowerCase() === t.name.toLowerCase())) {
              state.traits.push({
                id: `trait-species-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: t.name,
                description: t.description,
                customPreamble: false,
                limitedUse: { count: 0, rate: '' },
                crAnnotation: { ...defaultCrAnnotation(), include: false },
              })
            }
          }
        }
        if (entry.senses?.length) {
          for (const s of entry.senses) {
            const val = parseInt(s.value) || 60
            if (/darkvision/i.test(s.name)) {
              if (!state.senses.darkvision || state.senses.darkvision < val) state.senses.darkvision = val
            } else if (/blindsight/i.test(s.name)) {
              if (!state.senses.blindsight || state.senses.blindsight < val) state.senses.blindsight = val
            } else if (/tremorsense/i.test(s.name)) {
              if (!state.senses.tremorsense || state.senses.tremorsense < val) state.senses.tremorsense = val
            } else if (/truesight/i.test(s.name)) {
              if (!state.senses.truesight || state.senses.truesight < val) state.senses.truesight = val
            } else {
              state.sensesNotes = state.sensesNotes ? `${state.sensesNotes}, ${s.name} ${s.value}` : `${s.name} ${s.value}`
            }
          }
        }
        for (const res of entry.resistances || []) {
          if (!state.resistances.includes(res)) state.resistances.push(res)
        }
        for (const imm of entry.immunities || []) {
          if (!state.immunities.includes(imm)) state.immunities.push(imm)
        }
        for (const lang of entry.languages || []) {
          if (!state.languages.toLowerCase().includes(lang.toLowerCase())) {
            state.languages = state.languages ? `${state.languages}, ${lang}` : lang
          }
        }
      })
      $q.notify({
        type: 'positive',
        message: `Auto-populated features from ${entry.name}! Racial stat hints: ${Object.entries(entry.statBonuses).map(([s, b]) => `+${b} ${s}`).join(', ')}`,
      })
    })
  }

  const defaultInvuln = () => ({
    enabled: false,
    rule: 'none' as const,
    conditions: [] as string[],
    nthAttack: 3,
    saveStat: 'Wisdom',
    saveDc: 15,
    alignmentFilter: 'Good',
    damageTypesFilter: ['radiant', 'fire'],
    customRule: '',
    firstXCount: 1,
    disruption: 'none' as const,
    customDisruption: '',
    displayLocation: 'ac' as const,
  })

  const defaultRegen = () => ({
    recoveryType: 'regen' as const,
    valueSource: 'flat' as const,
    amount: 10,
    frequency: 'turn_start' as const,
    diceFormula: '',
    disruptedBy: 'acid or fire',
    disruptedByTypes: ['acid', 'fire'],
    disruptedByNote: '',
    timeframe: 'turn',
    displayMode: 'both' as const,
    enabled: false,
  })

  const defaultDeathPrev = () => ({
    enabled: false,
    name: 'Mortal',
    dcRule: 'always_survives' as const,
    returnHpSource: '1',
    returnHpValue: 1,
    returnHpDice: '2d8',
    requiresSave: false,
    saveStat: 'CON',
    saveDc: 15,
    hideHp: false,
    critHitsToKill: 3,
    exceptions: ['radiant', 'critical hit'],
    customNote: '',
    displayMode: 'both' as const,
  })

  const defaultInitConfig: MonsterInitiativeConfig = {
    proficient: false,
    secondaryStat: 'none',
    statMode: 'add',
    advantage: false,
    disadvantage: false,
    cantBeSurprised: false,
    useLairInitiative: false,
    lairInitiative: 20,
    specialTrigger: 'none',
    specialTriggerSpell: '',
    customEffectNote: '',
    riders: [],
  }

  const defaultAcConfig: MonsterAcConfig = {
    enabled: false,
    baseMode: 'flat',
    abilityBonus: 'none',
    defenseItem: 'none',
    temporary: 'none',
    conditional: 'none',
  }

  const defaultPortrait = {
    url: '',
    position: 'none' as const,
    width: 220,
    caption: '',
  }

  const ensureExtendedHp = () => {
    if (!monster.extendedHp) {
      monster.extendedHp = {
        showBloodied: false,
        bloodiedSource: 'none',
        bloodiedDice: '2d8',
        bloodiedAtPhase: 'half_total',
        damageThresholdSource: 'flat',
        damageThresholdDice: '2d6',
        damageThresholdDisruption: 'none',
        damageReductionSource: 'flat',
        damageReductionDice: '1d6',
        damageReductionDisruption: 'none',
        bloodiedOverride: null,
        damageThreshold: null,
        damageReduction: null,
        tempHp: { amount: 0, trigger: 'start_turn', damageType: 'fire' },
        invulnerability: defaultInvuln(),
        regeneration: defaultRegen(),
        deathPrevention: defaultDeathPrev(),
      }
    }
    if (!monster.extendedHp.invulnerability) {
      monster.extendedHp.invulnerability = defaultInvuln()
    } else {
      const inv = monster.extendedHp.invulnerability
      if (!Array.isArray(inv.conditions)) inv.conditions = []
      if (inv.nthAttack == null) inv.nthAttack = 3
      if (!inv.saveStat) inv.saveStat = 'Wisdom'
      if (inv.saveDc == null) inv.saveDc = 15
      if (!inv.alignmentFilter) inv.alignmentFilter = 'Good'
      if (!Array.isArray(inv.damageTypesFilter)) inv.damageTypesFilter = ['radiant', 'fire']
    }
    if (!monster.extendedHp.tempHp) {
      monster.extendedHp.tempHp = { amount: 0, trigger: 'start_turn', damageType: 'fire' }
    }
    if (!monster.extendedHp.regeneration) monster.extendedHp.regeneration = defaultRegen()
    if (!monster.extendedHp.deathPrevention) monster.extendedHp.deathPrevention = defaultDeathPrev()
    return monster.extendedHp as MonsterExtendedHp & {
      regeneration: NonNullable<MonsterExtendedHp['regeneration']>
    }
  }

  const ensureAcConfig = () => {
    if (!monster.acConfig) monster.acConfig = { ...defaultAcConfig }
    return monster.acConfig
  }

  const ensureParagonConfig = (): ParagonConfig => {
    if (!monster.paragonConfig) {
      monster.paragonConfig = {
        enabled: false,
        poolCount: 1,
        poolHp: [],
        initiativeStep: 'Initiative 20 & 10',
        enrageNote: '',
        transitionEffect: '',
        phaseName: 'Phase',
        bloodiedPerPhase: [],
        phaseConfigs: [],
      }
    }
    return monster.paragonConfig
  }

  ensureParagonConfig()
  if (!monster.specialCommunicationArchetype) {
    monster.specialCommunicationArchetype = 'none'
  }
  if (!Array.isArray(monster.languagesList)) {
    monster.languagesList = []
    if (monster.languages) {
      const parts = monster.languages.split(/[,;]/).map((s) => s.trim()).filter(Boolean)
      monster.languagesList = parts.map((name) => ({
        id: uuidv4(),
        name,
        understandsOnly: false,
        telepathy: name.toLowerCase().includes('telepathy'),
        telepathyRange: 120,
      }))
    }
  }

  const extendedHp = computed(() => ensureExtendedHp())
  const tempHpConfig = computed(() => extendedHp.value.tempHp as NonNullable<typeof extendedHp.value.tempHp>)
  const deathPrevention = computed(() => extendedHp.value.deathPrevention as NonNullable<typeof extendedHp.value.deathPrevention>)
  const initiativeConfig = computed(() => monster.initiativeConfig || defaultInitConfig)
  const acConfig = computed<MonsterAcConfig>(() => monster.acConfig || defaultAcConfig)
  const paragonConfig = computed(() => ensureParagonConfig())
  const portrait = computed(() => monster.portrait || defaultPortrait)

  const initiativeRollMode = computed({
    get: () => {
      if (initiativeConfig.value.advantage) return 'advantage'
      if (initiativeConfig.value.disadvantage) return 'disadvantage'
      return 'normal'
    },
    set: (val: 'normal' | 'advantage' | 'disadvantage') => {
      if (!monster.initiativeConfig) monster.initiativeConfig = { ...defaultInitConfig }
      monster.initiativeConfig.advantage = val === 'advantage'
      monster.initiativeConfig.disadvantage = val === 'disadvantage'
    },
  })

  const initiativePreview = computed(() => {
    const init = monster.initiative
    const parts = [`${init.mod >= 0 ? '+' : ''}${init.mod}`]
    if (init.advantage) parts.push('Advantage')
    if (init.disadvantage) parts.push('Disadvantage')
    if (init.cantBeSurprised) parts.push("Can't be Surprised")
    const trig = initiativeConfig.value.specialTrigger
    if (trig === 'at_end_of_every_turn') parts.push('At End of Every Turn')
    else if (trig === 'at_end_and_start_lair') parts.push('At End of Every Turn | At Start of Every Turn (Lair)')
    else if (trig === 'within_1d6_rounds') parts.push('Within 1d6 of rounds')
    else if (trig === 'no_temp_hp_remaining') parts.push('No Temp HP')
    else if (trig === 'hp_not_equal_max') parts.push('HP != Max')
    else if (trig === 'while_bloodied_act_twice') parts.push('Acts twice while Bloodied')
    else if (trig === 'cast_thaumaturgy' || trig === 'choose_lowest_thaumaturgy') parts.push('can cast Thaumaturgy')
    else if (trig === 'cast_compelled_duel' || trig === 'choose_lowest_compelled_duel') parts.push('can cast Compelled Duel')
    else if (trig === 'cast_custom' || trig === 'choose_lowest_custom') {
      parts.push(`can cast ${initiativeConfig.value.specialTriggerSpell || 'Spell'}`)
    } else if (trig === 'custom' && initiativeConfig.value.customEffectNote) {
      parts.push(initiativeConfig.value.customEffectNote)
    }
    if (initiativeConfig.value.useLairInitiative && trig !== 'at_end_and_start_lair') {
      parts.push(`| ${initiativeConfig.value.lairInitiative ?? 20} (Lair)`)
    }
    if (Array.isArray(initiativeConfig.value.riders) && initiativeConfig.value.riders.length > 0) {
      const ridersFormatted = formatInitiativeRiders(initiativeConfig.value.riders)
      if (ridersFormatted.length > 0) parts.push(...ridersFormatted)
    }
    return parts.join(', ')
  })

  const newRiderAdvMode = ref<InitiativeAdvantageMode>('none')
  const newRiderCreatureTypes = ref<string[]>([])
  const newRiderRollEffect = ref<'disadvantage' | 'advantage'>('disadvantage')
  const newRiderActionType = ref<InitiativeActionType>('none')
  const newRiderSpellName = ref('')
  const newRiderHpAmount = ref<number | string>(10)
  const newRiderMoveDistance = ref<number | string>('10ft')
  const newRiderCustomText = ref('')

  const addInitiativeRider = () => {
    const cfg = (monster.initiativeConfig ??= { ...defaultInitConfig })
    if (!cfg.riders) cfg.riders = []
    const rider: ComposableInitiativeRider = {
      id: uuidv4(),
      advMode: newRiderAdvMode.value,
      targetCreatureTypes: [...newRiderCreatureTypes.value],
      targetRollEffect: newRiderRollEffect.value,
      actionType: newRiderActionType.value,
      spellName: newRiderSpellName.value.trim(),
      hpAmount: newRiderHpAmount.value,
      moveDistance: newRiderMoveDistance.value,
      customText: newRiderCustomText.value.trim(),
    }
    cfg.riders.push(rider)
    newRiderAdvMode.value = 'none'
    newRiderCreatureTypes.value = []
    newRiderRollEffect.value = 'disadvantage'
    newRiderActionType.value = 'none'
    newRiderSpellName.value = ''
    newRiderCustomText.value = ''
  }

  const removeInitiativeRider = (index: number) => {
    monster.initiativeConfig?.riders?.splice(index, 1)
  }

  const needsSecondaryAc = computed(() => AC_SECONDARY_MODES.has(acConfig.value.conditionMode || ''))
  const composedAcPreview = computed(() => composeAcAndDefenses(monster).fullText)
  const computedCompositorAc = computed(() => composeAcAndDefenses(monster).totalAc)
  const computedCompositorType = computed(() => composeAcAndDefenses(monster).armorTypeDesc)

  const onAcCompositorChanged = () => {
    const cfg = ensureAcConfig()
    cfg.enabled = true
    const res = composeAcAndDefenses(monster)
    monster.AC = res.totalAc
    if (res.armorTypeDesc) monster.ACType = res.armorTypeDesc
  }

  const clearHpThreshold = (field: 'damageThreshold' | 'damageReduction') => {
    monster.clearBinding(`extendedHp.${field}`)
    extendedHp.value[field] = null
  }

  const getDynamicSourceValue = (source: string | undefined, diceFormula?: string): string =>
    resolveDynamicNumericSource(source, 10, diceFormula, {
      avgHp: monster.avgHp,
      proficiency: monster.proficiency,
      hd: monster.HP.HD,
      hdType: monster.HP.type,
      stats: monster.stats as unknown as Record<string, number>,
    })

  const computedBloodiedHp = computed(() => {
    if (extendedHp.value.bloodiedOverride && extendedHp.value.bloodiedOverride > 0) {
      return extendedHp.value.bloodiedOverride
    }
    return Math.max(1, Math.floor(avgHP(monster.HP) / 2))
  })

  const numericContext = () => ({
    avgHp: monster.avgHp,
    proficiency: monster.proficiency,
    hd: monster.HP.HD,
    hdType: monster.HP.type,
    stats: monster.stats as unknown as Record<string, number>,
  })

  const regenPreview = computed(() => formatMinimalistRegen(extendedHp.value.regeneration, numericContext()))
  const deathPreventionPreview = computed(() => formatMinimalistDeathPrevention(deathPrevention.value, numericContext()))

  const onRegenDamageTypeTriggerChanged = (dmgType: string) => {
    if (!dmgType || dmgType === 'none') return
    if (!Array.isArray(monster.immunitiesList)) monster.immunitiesList = []
    const existing = monster.immunitiesList.find((i) => i.type?.toLowerCase() === dmgType.toLowerCase())
    if (existing) {
      existing.absorbs = true
    } else {
      monster.immunitiesList.push({ id: uuidv4(), type: dmgType, absorbs: true })
    }
  }

  const onRegenFrequencyChanged = (freq: string) => {
    if (!extendedHp.value.regeneration) {
      extendedHp.value.regeneration = { amount: 10, disruptedBy: 'acid or fire', enabled: false }
    }
    const reg = extendedHp.value.regeneration
    if (freq === 'none') {
      reg.enabled = false
      return
    }
    reg.enabled = true
    reg.frequency = freq as typeof reg.frequency
    reg.timeframe = REGEN_TIMEFRAME_FREQS.has(freq) ? freq : 'turn'
    if (freq === 'no_damage_taken' || freq === 'damage_taken' || freq === 'long_rest') {
      reg.triggerCondition = freq
    } else if (REGEN_END_TURN_FREQS.has(freq)) {
      reg.triggerCondition = 'end_turn'
    } else {
      reg.triggerCondition = 'start_turn'
    }
  }

  const onDeathPreventionTemplateChanged = (tmpl: string) => {
    const dp = deathPrevention.value
    if (!tmpl || tmpl === 'Mortal') {
      dp.enabled = false
      dp.name = 'Mortal'
      return
    }
    dp.enabled = true
    if (tmpl === 'Undead Fortitude') {
      dp.dcRule = 'dc_5_plus_dmg'
      dp.returnHpSource = '1'
      dp.hideHp = false
      dp.exceptions = ['radiant', 'critical hit']
    } else if (tmpl === 'Relentless Endurance' || tmpl === 'Death Ward') {
      dp.dcRule = 'always_survives'
      dp.returnHpSource = '1'
      dp.hideHp = false
      dp.exceptions = ['disintegration']
    } else if (tmpl === 'Immortal') {
      if (!dp.returnHpSource) dp.returnHpSource = 'half_hp'
      if (!dp.dcRule) dp.dcRule = 'always_survives'
    }
  }

  const onDeathPreventionRuleChanged = (rule: string) => {
    const dp = deathPrevention.value
    dp.hideHp = rule === 'true_immortal' || rule === 'until_x_crits'
    dp.requiresSave = rule === 'custom_save'
    if (rule !== 'death_save_success' && dp.triggerCondition === 'death_save_success') dp.triggerCondition = undefined
    if (rule !== 'upon_death_burst' && dp.triggerCondition === 'upon_death_burst') {
      dp.triggerCondition = undefined
      dp.uponDeathDealsDamage = false
    }
    if (rule === 'death_save_success') {
      dp.triggerCondition = 'death_save_success'
      if (!dp.returnHpSource) dp.returnHpSource = '1'
    } else if (rule === 'upon_death_burst') {
      dp.triggerCondition = 'upon_death_burst'
      dp.uponDeathDealsDamage = true
      if (!dp.deathBurstDamageAmount) dp.deathBurstDamageAmount = 38
      if (!dp.deathBurstDamageType) dp.deathBurstDamageType = 'Radiant'
      if (!dp.deathBurstTargetFilter) dp.deathBurstTargetFilter = 'Creatures'
      if (!dp.deathBurstRange) dp.deathBurstRange = 30
    } else if (rule === 'always_survives' && !dp.returnHpSource) {
      dp.returnHpSource = '1'
    }
  }

  const onPortraitFileSelected = (file: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        portrait.value.url = e.target.result
        if (portrait.value.position === 'none') portrait.value.position = 'right'
      }
    }
    reader.readAsDataURL(file)
  }

  const defaultSourcesByIdx = ['half_hp', 'quarter_hp', 'eighth_hp']

  const ensureParagonPhaseConfigs = () => {
    const p = monster.paragonConfig
    if (!p) return []
    const count = Math.max(1, p.poolCount || 1)
    if (count <= 1) {
      p.enabled = false
      return []
    }
    p.enabled = true
    const pName = p.phaseName?.trim() || 'Phase'
    if (!Array.isArray(p.phaseConfigs)) p.phaseConfigs = []
    while (p.phaseConfigs.length < count) {
      const idx = p.phaseConfigs.length
      p.phaseConfigs.push({
        id: `phase-${idx + 1}`,
        name: idx === count - 1 ? 'Final' : `${pName} ${idx + 2}`,
        source: (defaultSourcesByIdx[idx] || 'flat') as ParagonPhaseConfig['source'],
        hpOverride: p.bloodiedPerPhase?.[idx] ?? null,
        diceFormula: '4d10',
        initiativeBonus: (idx + 1) * 10,
      })
    }
    if (p.phaseConfigs.length > count) {
      const dropped = p.phaseConfigs.splice(count)
      let nextBindings = monster.bindings
      for (const cfg of dropped) {
        if (cfg?.id) {
          nextBindings = withoutEntryBindings(nextBindings, entryBindingPrefix('paragonConfig.phaseConfigs', cfg.id))
        }
      }
      monster.bindings = nextBindings
    }
    p.phaseConfigs.forEach((cfg, idx) => {
      if (!cfg.id) cfg.id = `phase-${idx + 1}`
      const isAuto = !cfg.name || cfg.name === 'Final' || /^(Phase|Stage|Pool) \d+$/i.test(cfg.name)
      if (isAuto) cfg.name = idx === count - 1 ? 'Final' : `${pName} ${idx + 2}`
    })
    return p.phaseConfigs
  }

  const isLastBloodiedPhase = (pIdx: number): boolean => {
    const p = monster.paragonConfig
    if (!p || !Array.isArray(p.phaseConfigs) || !p.phaseConfigs[pIdx]?.isBloodied) return false
    for (let i = pIdx + 1; i < p.phaseConfigs.length; i++) {
      if (p.phaseConfigs[i]?.isBloodied) return false
    }
    return true
  }

  const paragonPhaseRows = computed<ParagonPhaseConfig[]>(() => {
    const p = monster.paragonConfig
    if (!p) return []
    const count = Math.max(1, p.poolCount || 1)
    if (count <= 1) return []
    const stored = Array.isArray(p.phaseConfigs) ? p.phaseConfigs : []
    if (stored.length === count) return stored
    const pName = p.phaseName?.trim() || 'Phase'
    const rows = stored.slice(0, count).map((cfg) => ({ ...cfg }))
    while (rows.length < count) {
      const idx = rows.length
      rows.push({
        id: `phase-${idx + 1}`,
        name: '',
        source: (defaultSourcesByIdx[idx] || 'flat') as ParagonPhaseConfig['source'],
        hpOverride: p.bloodiedPerPhase?.[idx] ?? null,
        diceFormula: '4d10',
        initiativeBonus: (idx + 1) * 10,
      })
    }
    rows.forEach((cfg, idx) => {
      if (!cfg.id) cfg.id = `phase-${idx + 1}`
      const isAuto = !cfg.name || cfg.name === 'Final' || /^(Phase|Stage|Pool) \d+$/i.test(cfg.name)
      if (isAuto) cfg.name = idx === count - 1 ? 'Final' : `${pName} ${idx + 2}`
    })
    return rows
  })

  const materializeParagonRows = () => {
    const p = monster.paragonConfig
    if (!p || Math.max(1, p.poolCount || 1) <= 1) return
    if (Array.isArray(p.phaseConfigs) && p.phaseConfigs.length === p.poolCount) return
    ensureParagonPhaseConfigs()
  }

  const resolvePhaseRowPreview = (cfg: ParagonPhaseConfig): string => {
    if (cfg.hpOverride != null && cfg.hpOverride > 0 && cfg.source === 'flat') {
      return `${cfg.hpOverride}`
    }
    return resolveDynamicNumericSource(cfg.source || 'half_hp', cfg.hpOverride ?? 10, cfg.diceFormula, numericContext())
  }

  const syncParagonPhaseRows = () => {
    materializeParagonRows()
    const p = monster.paragonConfig
    if (!p || !Array.isArray(p.phaseConfigs)) return
    p.bloodiedPerPhase = p.phaseConfigs.map((cfg) => Number(resolvePhaseRowPreview(cfg)) || 10)
  }

  const onTogglePhaseBloodied = (pIdx: number, val: boolean) => {
    materializeParagonRows()
    const p = monster.paragonConfig
    if (!p || !Array.isArray(p.phaseConfigs)) return
    if (val) {
      for (let i = pIdx; i < p.phaseConfigs.length; i++) p.phaseConfigs[i].isBloodied = true
    } else {
      for (let i = 0; i <= pIdx; i++) {
        if (p.phaseConfigs[i]) p.phaseConfigs[i].isBloodied = false
      }
    }
    syncParagonPhaseRows()
  }

  const updateParagonPoolHp = () => {
    const p = monster.paragonConfig
    if (!p) return
    const count = Math.max(1, p.poolCount || 1)
    if (count <= 1) {
      p.enabled = false
      p.poolHp = []
      let nextBindings = monster.bindings
      for (const cfg of p.phaseConfigs || []) {
        if (cfg?.id) {
          nextBindings = withoutEntryBindings(nextBindings, entryBindingPrefix('paragonConfig.phaseConfigs', cfg.id))
        }
      }
      monster.bindings = nextBindings
      p.phaseConfigs = []
      p.bloodiedPerPhase = []
      return
    }
    p.enabled = true
    p.poolHp = Array(count).fill(Math.max(1, Math.floor(monster.avgHp / count)))
    ensureParagonPhaseConfigs()
    syncParagonPhaseRows()
  }

  const updateStat = (stat: keyof typeof monster.stats, value: number | string | null) => {
    if (stat === 'CON') {
      monster.setHpModifier(monster.HP.HD, value)
    } else {
      monster.stats[stat] = validateNumber(value, 10)
    }
  }

  const availableLanguageEntries = computed(() => {
    const existing = new Set((monster.languagesList || []).map((l) => l.name.toLowerCase().trim()))
    return ALL_OFFICIAL_LANGUAGES
      .filter((l) => !existing.has(l.toLowerCase().trim()))
      .slice()
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, label: name, group: 'Languages' }))
  })

  const syncLanguagesToString = () => {
    monster.languages = formatLanguagesList(monster.languagesList, monster.specialCommunicationArchetype)
  }

  const onLanguageSelected = (val: unknown) => {
    if (typeof val !== 'string' || !val.trim()) return
    const name = val.trim()
    const lower = name.toLowerCase()
    if ((monster.languagesList || []).some((l) => l.name.toLowerCase().trim() === lower)) return
    const isTele = lower.includes('telepathy')
    const item: MonsterLanguageItem = {
      id: uuidv4(),
      name,
      understandsOnly: false,
      telepathy: isTele,
      telepathyRange: isTele ? 120 : undefined,
      broadcast: false,
      noReply: false,
      languageRequirement: 'none',
      creatureTarget: 'all',
      simpleConceptsOnly: false,
      acrossPlanes: false,
      multiverseWide: false,
      learnDesires: false,
      readThoughts: false,
      senseEmotions: false,
      senseAlignment: false,
      senseIntentions: false,
      detectSincerity: false,
      accessMemories: false,
      shareOwnSenses: false,
      probeCreatureSenses: false,
      probeRequiresSave: false,
      probeSaveType: 'WIS',
      probeSaveDc: 13,
      probeSaveAwareness: 'unaware_on_fail',
      sensoryRequiresSave: false,
      sensorySaveType: 'WIS',
      sensorySaveDc: 13,
      syncSaves: true,
      requiresSave: false,
      saveType: 'WIS',
      saveDc: 13,
      saveAwareness: 'unaware_on_fail',
      disruptedByPsychicDamage: false,
      telepathicAwareness: false,
      concentration: 'none',
      animalHandling: (lower === 'handle animals' || lower.includes('animal handling'))
        ? {
            enabled: true,
            dc: 10,
            peacefulOutcome: 'calm/cease aggression',
            commandOutcome: 'convey basic commands',
            recruitOutcome: 'recruit aid/bond',
            customNotes: '',
          }
        : undefined,
      animalsConfig: lower === 'animals' ? { simpleConceptsOnly: true, specificSubtype: '', note: '' } : undefined,
      plantsConfig: lower === 'plants' ? { canQuestionPastDay: true, difficultTerrainNegotiation: false, note: '' } : undefined,
      undeadConfig: lower === 'undead' ? { commandMindless: true, telepathicRange: 60, note: '' } : undefined,
      deadConfig: lower.startsWith('dead')
        ? { maxQuestions: 5, corpseMustHaveMouth: true, answersCryptic: false, deadWithinYears: '', note: '' }
        : undefined,
    }
    if (!Array.isArray(monster.languagesList)) monster.languagesList = []
    monster.languagesList.push(item)
    syncLanguagesToString()
  }

  const removeLanguage = (index: number) => {
    const language = monster.languagesList?.[index]
    if (!language) return
    monster.$patch((state) => {
      state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('languagesList', language.id))
      state.languagesList?.splice(index, 1)
    })
    syncLanguagesToString()
  }

  const getAnimalHandling = (lang: MonsterLanguageItem) =>
    (lang.animalHandling ??= {
      enabled: true,
      dc: 10,
      peacefulOutcome: 'calm/cease aggression',
      commandOutcome: 'convey basic commands',
      recruitOutcome: 'recruit aid/bond',
      customNotes: '',
    })
  const getAnimalsConfig = (lang: MonsterLanguageItem) =>
    (lang.animalsConfig ??= { simpleConceptsOnly: true, specificSubtype: '', note: '' })
  const getPlantsConfig = (lang: MonsterLanguageItem) =>
    (lang.plantsConfig ??= { canQuestionPastDay: true, difficultTerrainNegotiation: false, note: '' })
  const getUndeadConfig = (lang: MonsterLanguageItem) =>
    (lang.undeadConfig ??= { commandMindless: true, telepathicRange: 60, note: '' })
  const getDeadConfig = (lang: MonsterLanguageItem) =>
    (lang.deadConfig ??= {
      maxQuestions: 5,
      corpseMustHaveMouth: true,
      answersCryptic: false,
      deadWithinYears: '',
      note: '',
    })

  // Keep singleton watchers mounted once in the container context
  const registerWatchers = () => {
    watch(
      () => [monster.extendedHp, monster.initiativeConfig, monster.portrait, monster.acConfig],
      () => {
        ensureExtendedHp()
        ensureAcConfig()
        if (!monster.initiativeConfig) {
          monster.initiativeConfig = { ...defaultInitConfig, riders: [] }
        } else {
          if (monster.initiativeConfig.lairInitiative == null) monster.initiativeConfig.lairInitiative = 20
          if (!monster.initiativeConfig.specialTrigger) monster.initiativeConfig.specialTrigger = 'none'
        }
        if (!monster.portrait) monster.portrait = { ...defaultPortrait }
      },
      { immediate: true },
    )
    watch(
      () => JSON.stringify(monster.acConfig),
      () => {
        if (monster.acConfig?.enabled && Object.keys(monster.bindings || {}).some((path) => path.startsWith('acConfig.'))) {
          onAcCompositorChanged()
        }
      },
      { immediate: true },
    )
    watch(
      () => portrait.value.position,
      (pos) => {
        if (pos === 'none') editorStore.a4Layout = 'statblock_only'
        else if (pos === 'top' || pos === 'bottom') editorStore.a4Layout = 'stacked'
        else if (pos === 'left' || pos === 'right') editorStore.a4Layout = 'side_by_side'
      },
    )
    watch(
      () => monster.paragonConfig?.poolCount,
      (count) => {
        if (!monster.bindings?.['paragonConfig.poolCount']) return
        const p = monster.paragonConfig
        const expectedRows = (count ?? 0) > 1 ? (count ?? 0) : 0
        if (p && p.phaseConfigs?.length !== expectedRows) updateParagonPoolHp()
      },
      { immediate: true },
    )
    watch(
      () => extendedHp.value.regeneration?.amount,
      (amount) => {
        if (monster.bindings?.['extendedHp.regeneration.amount'] && extendedHp.value.regeneration) {
          extendedHp.value.regeneration.enabled = (amount ?? 0) > 0
        }
      },
      { immediate: true },
    )
    watch(
      () => deathPrevention.value.returnHpValue,
      (amount) => {
        if (monster.bindings?.['extendedHp.deathPrevention.returnHpValue']) {
          deathPrevention.value.returnHpAmount = amount
        }
      },
      { immediate: true },
    )
    watch(
      () => JSON.stringify(monster.languagesList),
      () => {
        if (Object.keys(monster.bindings || {}).some((path) => path.startsWith('languagesList['))) {
          syncLanguagesToString()
        }
      },
      { immediate: true },
    )
  }

  return {
    monster,
    editorStore,
    diceOptions,
    diceLookup,
    statKeys,
    updateStat,
    pointBuyInfo,
    roleArchetypes,
    selectedSpecies,
    portrait,
    portraitFile,
    openLayerStudio,
    applyStandardArray,
    applyAllStats,
    applyArchetype,
    onSpeciesSelected,
    onPortraitFileSelected,
    acConfig,
    needsSecondaryAc,
    composedAcPreview,
    computedCompositorAc,
    computedCompositorType,
    onAcCompositorChanged,
    mechanicRichHtml,
    extendedHp,
    tempHpConfig,
    deathPrevention,
    clearHpThreshold,
    getDynamicSourceValue,
    computedBloodiedHp,
    regenPreview,
    deathPreventionPreview,
    onRegenDamageTypeTriggerChanged,
    onRegenFrequencyChanged,
    onDeathPreventionTemplateChanged,
    onDeathPreventionRuleChanged,
    initiativeConfig,
    initiativeRollMode,
    initiativePreview,
    newRiderAdvMode,
    newRiderCreatureTypes,
    newRiderRollEffect,
    newRiderActionType,
    newRiderSpellName,
    newRiderHpAmount,
    newRiderMoveDistance,
    newRiderCustomText,
    addInitiativeRider,
    removeInitiativeRider,
    formatInitiativeRider,
    paragonConfig,
    paragonPhaseRows,
    materializeParagonRows,
    resolvePhaseRowPreview,
    syncParagonPhaseRows,
    onTogglePhaseBloodied,
    updateParagonPoolHp,
    isLastBloodiedPhase,
    availableLanguageEntries,
    showManualLangEdit,
    syncLanguagesToString,
    onLanguageSelected,
    removeLanguage,
    getAnimalHandling,
    getAnimalsConfig,
    getPlantsConfig,
    getUndeadConfig,
    getDeadConfig,
    registerWatchers,
  }
}

export type BasicsContext = ReturnType<typeof createBasicsContext>
export const BASICS_CONTEXT_KEY: InjectionKey<BasicsContext> = Symbol('dnd-basics-context')

export function provideBasicsContext(): BasicsContext {
  const ctx = createBasicsContext()
  ctx.registerWatchers()
  provide(BASICS_CONTEXT_KEY, ctx)
  return ctx
}

export function useBasicsContext(): BasicsContext {
  const injected = inject(BASICS_CONTEXT_KEY, null)
  if (injected) return injected
  const fallback = createBasicsContext()
  fallback.registerWatchers()
  return fallback
}
