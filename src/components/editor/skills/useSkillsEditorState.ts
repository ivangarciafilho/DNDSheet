import type { SkillPassiveState } from 'src/core/domain/skill-passive-state'
import { SKILL } from 'src/data/SKILL'
import { SKILL_ACTION_GROUPS, passiveConfigKey, skillActionGroupFor, skillGroupPlacement } from 'src/core/domain/skill-action-groups'
import type { CombatSkillGroupId, SkillActionGroupId } from 'src/core/domain/skill-action-groups'
import { useMonsterStore } from 'src/stores/monster-store'
import { computed, watch, inject, provide } from 'vue'
import type { InjectionKey } from 'vue'
import { bonusForSkill, statModifier } from '../../rendering/mathRendering'
import { validateNumber } from '../numberInput'
import { MonsterSkill, MonsterToolProficiency } from '../../models'
import { CANONICAL_TOOLS } from 'src/core/domain/catalogs/enumerations'

const STANDARD_5E_TOOLS: Array<{ label: string; value: string; category: string; color: string; icon: string }> = CANONICAL_TOOLS.map((tool) => ({
  label: tool.label,
  value: String(tool.value),
  category: tool.group || 'Tools',
  color: tool.meta?.color || 'teal-6',
  icon: tool.meta?.icon || 'fa-solid fa-wrench',
}))

const SKILL_ICONS: Record<string, string> = {
  PERCEPTION: 'fa-solid fa-magnifying-glass',
  INVESTIGATION: 'fa-solid fa-magnifying-glass-chart',
  INSIGHT: 'fa-solid fa-eye',
  SURVIVAL: 'fa-solid fa-compass',
  ARCANA: 'fa-solid fa-hat-wizard',
  HISTORY: 'fa-solid fa-scroll',
  NATURE: 'fa-solid fa-leaf',
  RELIGION: 'fa-solid fa-ankh',
  DECEPTION: 'fa-solid fa-masks-theater',
  INTIMIDATION: 'fa-solid fa-skull',
  PERFORMANCE: 'fa-solid fa-music',
  PERSUASION: 'fa-solid fa-comments',
  ANIMAL_HANDLING: 'fa-solid fa-paw',
  STEALTH: 'fa-solid fa-user-ninja',
  ACROBATICS: 'fa-solid fa-person-running',
  ATHLETICS: 'fa-solid fa-dumbbell',
  MEDICINE: 'fa-solid fa-kit-medical',
  SLIGHT_OF_HAND: 'fa-solid fa-hand-sparkles',
}

// Category chips follow the stat block grouping (src/core/domain/skill-action-groups.ts)
const SKILL_SCOPE_META: Record<string, { category: string; color: string; icon: string; order: number }> =
  Object.fromEntries(
    Object.keys(SKILL).map((key) => {
      const groupIdx = SKILL_ACTION_GROUPS.findIndex((g) => g.skills.includes(key))
      const group = SKILL_ACTION_GROUPS[groupIdx]
      return [
        key,
        {
          category: group ? `${group.label} (${SKILL[key].stat})` : `Skills (${SKILL[key].stat})`,
          color: group?.color ?? 'teal-6',
          icon: SKILL_ICONS[key] ?? group?.icon ?? 'fa-solid fa-dice-d20',
          order: group ? groupIdx + 1 : SKILL_ACTION_GROUPS.length + 1,
        },
      ]
    })
  )

// State and handlers shared by SkillsEditor and its section components (ADR-0003 provide/inject).
export function useSkillsEditorState() {
  const monster = useMonsterStore()

  const availableSkills = computed(() => {
    return Object.keys(SKILL)
      .map((key) => {
        const meta = SKILL_SCOPE_META[key] || { category: 'Skills', color: 'teal-6', icon: 'fa-solid fa-dice-d20', order: 5 }
        return {
          value: key,
          label: SKILL[key].label,
          category: meta.category,
          color: meta.color,
          icon: meta.icon,
          order: meta.order,
        }
      })
      .sort((a, b) => (a.order - b.order) || a.label.localeCompare(b.label))
      .filter(
        (skill) => monster.skills.find((s) => s.key === skill.value) == null
      )
  })

  const availableTools = computed(() => {
    const existing = new Set((monster.tools || []).map((t) => t.name.toLowerCase().trim()))
    return STANDARD_5E_TOOLS
      .filter((tool) => !existing.has(tool.value.toLowerCase().trim()))
  })

  const onSkillSelected = (skillKey: string | null) => {
    if (!skillKey) return
    monster.addSkill(skillKey)
  }

  const onToolSelected = (toolInput: string | { value?: string; label?: string } | null) => {
    if (!toolInput) return
    const rawName = typeof toolInput === 'string' ? toolInput : (toolInput.value || toolInput.label || '')
    if (!rawName.trim()) return
    const clean = rawName.trim()
    if ((monster.tools || []).some((t) => t.name.toLowerCase().trim() === clean.toLowerCase())) {
      return
    }
    const defaultStat = clean.toLowerCase().includes('thieves') ? 'DEX'
      : clean.toLowerCase().includes('navigat') || clean.toLowerCase().includes('herbal') ? 'WIS'
      : clean.toLowerCase().includes('alchem') || clean.toLowerCase().includes('forger') ? 'INT'
      : clean.toLowerCase().includes('smith') || clean.toLowerCase().includes('mason') ? 'STR'
      : 'DEX'
    monster.addTool(clean, defaultStat)
  }

  const ensurePassives = (): SkillPassiveState & { riders: Record<string, string> } => {
    if (!monster.passives) {
      monster.passives = {
        hideActionType: monster.actionOrientedPassives?.bonusActionHide ? 'Bonus Action' : 'Action',
        searchActionType: monster.actionOrientedPassives?.bonusActionSearch ? 'Bonus Action' : 'Action',
        studyActionType: monster.actionOrientedPassives?.bonusActionStudy ? 'Bonus Action' : 'Action',
        influenceActionType: monster.actionOrientedPassives?.bonusActionInfluence ? 'Bonus Action' : 'Action',
        toolsActionType: monster.actionOrientedPassives?.bonusActionTools || (monster as unknown as { toolsActionType?: string }).toolsActionType === 'Bonus Action' ? 'Bonus Action' : 'Action',
        riders: { ...(monster.actionOrientedPassives?.riders || {}) },
        perception: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        investigation: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        insight: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        survival: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        arcana: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        history: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        nature: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        religion: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        stealth: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        deception: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        intimidation: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        performance: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        persuasion: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
        animalHandling: { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' },
      }
    }
    if (!monster.passives.riders) {
      monster.passives.riders = { ...(monster.actionOrientedPassives?.riders || {}) }
    }
    if (typeof monster.passives.riders.search !== 'string') monster.passives.riders.search = ''
    if (typeof monster.passives.riders.study !== 'string') monster.passives.riders.study = ''
    if (typeof monster.passives.riders.influence !== 'string') monster.passives.riders.influence = ''
    if (typeof monster.passives.riders.hide !== 'string') monster.passives.riders.hide = ''
    if (typeof monster.passives.riders.tools !== 'string') monster.passives.riders.tools = ''


    if (!monster.passives.searchActionType) monster.passives.searchActionType = monster.actionOrientedPassives?.bonusActionSearch ? 'Bonus Action' : 'Action'
    if (!monster.passives.studyActionType) monster.passives.studyActionType = monster.actionOrientedPassives?.bonusActionStudy ? 'Bonus Action' : 'Action'
    if (!monster.passives.influenceActionType) monster.passives.influenceActionType = monster.actionOrientedPassives?.bonusActionInfluence ? 'Bonus Action' : 'Action'
    if (!monster.passives.hideActionType) monster.passives.hideActionType = monster.actionOrientedPassives?.bonusActionHide ? 'Bonus Action' : 'Action'
    if (!monster.passives.toolsActionType) monster.passives.toolsActionType = monster.actionOrientedPassives?.bonusActionTools || (monster as unknown as { toolsActionType?: string }).toolsActionType === 'Bonus Action' ? 'Bonus Action' : 'Action'
    return monster.passives as SkillPassiveState & { riders: Record<string, string> }
  }

  const passives = computed(() => ensurePassives())

  // Two-way synchronization between monster.passives and monster.actionOrientedPassives
  watch(
    () => monster.passives,
    (p) => {
      if (!p) return
      if (!monster.actionOrientedPassives) {
        monster.actionOrientedPassives = {
          bonusActionSearch: false,
          bonusActionStudy: false,
          bonusActionHide: false,
          bonusActionInfluence: false,
          search: { perception: true, investigation: false, survival: false },
          study: { arcana: false, history: false, nature: false, religion: false },
          hide: { stealth: false },
          influence: { animalHandling: false, insight: false, deception: false, intimidation: false, persuasion: false },
          conditions: {},
        }
      }
      const aop = monster.actionOrientedPassives
      if (!aop) return
      if (p.searchActionType === 'Action' || p.searchActionType === 'Bonus Action') aop.bonusActionSearch = p.searchActionType === 'Bonus Action'
      if (p.studyActionType === 'Action' || p.studyActionType === 'Bonus Action') aop.bonusActionStudy = p.studyActionType === 'Bonus Action'
      if (p.hideActionType === 'Action' || p.hideActionType === 'Bonus Action') aop.bonusActionHide = p.hideActionType === 'Bonus Action'
      if (p.influenceActionType === 'Action' || p.influenceActionType === 'Bonus Action') aop.bonusActionInfluence = p.influenceActionType === 'Bonus Action'
      if (p.toolsActionType === 'Action' || p.toolsActionType === 'Bonus Action') aop.bonusActionTools = p.toolsActionType === 'Bonus Action'

      if (p.searchPlacement !== undefined) aop.searchPlacement = p.searchPlacement
      if (typeof p.searchMoveToActionGroup === 'boolean') aop.searchMoveToActionGroup = p.searchMoveToActionGroup
      if (p.studyPlacement !== undefined) aop.studyPlacement = p.studyPlacement
      if (typeof p.studyMoveToActionGroup === 'boolean') aop.studyMoveToActionGroup = p.studyMoveToActionGroup
      if (p.influencePlacement !== undefined) aop.influencePlacement = p.influencePlacement
      if (typeof p.influenceMoveToActionGroup === 'boolean') aop.influenceMoveToActionGroup = p.influenceMoveToActionGroup
      if (p.hidePlacement !== undefined) aop.hidePlacement = p.hidePlacement
      if (typeof p.hideMoveToActionGroup === 'boolean') aop.hideMoveToActionGroup = p.hideMoveToActionGroup
      if (p.toolsPlacement !== undefined) aop.toolsPlacement = p.toolsPlacement
      if (typeof p.toolsMoveToActionGroup === 'boolean') aop.toolsMoveToActionGroup = p.toolsMoveToActionGroup
      aop.riders = { ...(p.riders || {}) }

      if (!aop.conditions) aop.conditions = {}
      for (const key of Object.keys(p)) {
        const item = (p as Record<string, unknown>)[key]
        if (item && typeof item === 'object' && 'condition' in item) {
          aop.conditions[key.toLowerCase()] = ((item as { condition?: string }).condition || '').trim()
        }
      }
    },
    { deep: true, immediate: true }
  )

  const getPassive = (key: string) => {
    const p = passives.value as unknown as Record<string, { override: boolean; overrideValue: number | null; advantage: boolean; disadvantage: boolean; condition: string }>
    if (!p[key]) {
      p[key] = { override: false, overrideValue: null, advantage: false, disadvantage: false, condition: '' }
    }
    return p[key]
  }

  // passive-config keys for one group card, in table order
  const groupPassiveKeys = (groupId: SkillActionGroupId): string[] =>
    (SKILL_ACTION_GROUPS.find((g) => g.id === groupId)?.skills ?? []).map((key) => passiveConfigKey(key))

  const passiveLabel = (cfgKey: string): string => {
    const key = Object.keys(SKILL).find((k) => passiveConfigKey(k) === cfgKey)
    return key ? SKILL[key].label : cfgKey
  }

  // a skill without an explicit economy follows its group's Action / Bonus Action toggle
  const groupActionTypeFor = (skillKey: string): 'Action' | 'Bonus Action' => {
    const group = skillActionGroupFor(skillKey)
    if (!group) return 'Action'
    const p = passives.value as unknown as Record<string, unknown>
    return p?.[`${group.id}ActionType`] === 'Bonus Action' ? 'Bonus Action' : 'Action'
  }

  const effectiveSkillActionType = (skill: MonsterSkill): 'Action' | 'Bonus Action' =>
    typeof skill.bonusAction === 'boolean' ? (skill.bonusAction ? 'Bonus Action' : 'Action') : groupActionTypeFor(String(skill.key))

  const toggleSkillActionType = (skill: MonsterSkill) => {
    const next = effectiveSkillActionType(skill) === 'Action' ? 'Bonus Action' : 'Action'
    skill.bonusAction = next === groupActionTypeFor(String(skill.key)) ? undefined : next === 'Bonus Action'
  }

  const formatModifier = (val: number): string => {
    return val >= 0 ? `+${val}` : `${val}`
  }

  const calculateToolBonus = (t: MonsterToolProficiency): number => {
    if (t.override) return t.overrideValue ?? 0
    const statMod = statModifier(monster.stats[t.stat] ?? 10)
    return statMod + (t.proficient ? monster.proficiency : 0) + (t.expertise ? monster.proficiency : 0)
  }

  const toggleSkillAdvantage = (s: MonsterSkill) => {
    s.advantage = !s.advantage
    if (s.advantage) s.disadvantage = false
  }

  const toggleSkillDisadvantage = (s: MonsterSkill) => {
    s.disadvantage = !s.disadvantage
    if (s.disadvantage) s.advantage = false
  }

  const toggleToolAdvantage = (t: MonsterToolProficiency) => {
    t.advantage = !t.advantage
    if (t.advantage) t.disadvantage = false
  }

  const toggleToolDisadvantage = (t: MonsterToolProficiency) => {
    t.disadvantage = !t.disadvantage
    if (t.disadvantage) t.advantage = false
  }

  const getSkillOverrideOptions = (s: MonsterSkill) => {
    const pb = monster.proficiency ?? 2
    const skillEntry = SKILL[String(s.key).toUpperCase() as keyof typeof SKILL]
    const statName = skillEntry?.stat || 'DEX'
    const statVal = monster.stats[statName as keyof typeof monster.stats] ?? 10
    const mod = Math.floor((statVal - 10) / 2)
    return [
      { label: `Mod + PB (${mod + pb >= 0 ? '+' : ''}${mod + pb})`, value: mod + pb },
      { label: `Mod + 2x PB (${mod + pb * 2 >= 0 ? '+' : ''}${mod + pb * 2})`, value: mod + pb * 2 },
      { label: `Passive 10 + Mod + PB (${10 + mod + pb})`, value: 10 + mod + pb },
      { label: `Passive 10 + Mod + 2x PB (${10 + mod + pb * 2})`, value: 10 + mod + pb * 2 },
      { label: `+PB (${pb >= 0 ? '+' : ''}${pb})`, value: pb },
      { label: `+2x PB (${pb * 2 >= 0 ? '+' : ''}${pb * 2})`, value: pb * 2 },
      { label: `Ability Mod (${mod >= 0 ? '+' : ''}${mod})`, value: mod },
    ]
  }

  const getToolOverrideOptions = (t: MonsterToolProficiency) => {
    const pb = monster.proficiency ?? 2
    const statVal = monster.stats[t.stat as keyof typeof monster.stats] ?? 10
    const mod = Math.floor((statVal - 10) / 2)
    return [
      { label: `Mod + PB (${mod + pb >= 0 ? '+' : ''}${mod + pb})`, value: mod + pb },
      { label: `Mod + 2x PB (${mod + pb * 2 >= 0 ? '+' : ''}${mod + pb * 2})`, value: mod + pb * 2 },
      { label: `+PB (${pb >= 0 ? '+' : ''}${pb})`, value: pb },
      { label: `+2x PB (${pb * 2 >= 0 ? '+' : ''}${pb * 2})`, value: pb * 2 },
      { label: `Ability Mod (${mod >= 0 ? '+' : ''}${mod})`, value: mod },
    ]
  }

  const getPassiveOverrideOptions = (pKey: string) => {
    const pb = monster.proficiency ?? 2
    const skillKey =
      pKey === 'animalHandling'
        ? 'ANIMAL_HANDLING'
        : pKey === 'sleightOfHand'
          ? 'SLIGHT_OF_HAND'
          : pKey.toUpperCase()
    const statName = SKILL[skillKey as keyof typeof SKILL]?.stat || 'WIS'
    const statVal = monster.stats[statName as keyof typeof monster.stats] ?? 10
    const mod = Math.floor((statVal - 10) / 2)
    return [
      { label: `10 + Mod (${10 + mod})`, value: 10 + mod },
      { label: `10 + Mod + PB (${10 + mod + pb})`, value: 10 + mod + pb },
      { label: `10 + Mod + 2x PB (${10 + mod + pb * 2})`, value: 10 + mod + pb * 2 },
      { label: '15 (Keen Sense)', value: 15 },
      { label: '20 (Legendary)', value: 20 },
    ]
  }

  const movesToActionGroup = (group: CombatSkillGroupId): boolean => skillGroupPlacement(
    group, passives.value[group + 'ActionType'] === 'Bonus Action' ? 'Bonus Action' : 'Action',
    passives.value, monster.actionOrientedPassives as Record<string, unknown>, monster as unknown as Record<string, unknown>,
  ) !== 'header'
  const setMoveToActionGroup = (group: CombatSkillGroupId, enabled: boolean) => {
    passives.value[group + 'MoveToActionGroup'] = enabled
  }

  const riderPresets = {
    search: [
      '60ft across Ethereal and Material Planes: Sense the Presence of Undeads, Fiends, and Celestials.',
      'Secret doors or hidden compartments within 10ft.',
      'Discern truth or deception from any creature speaking to it.',
      'Track creatures across any terrain, including magical tracking.',
    ],
    study: [
      "Touch: Learn target's Alignment, and if its either Charmed or Possessed.",
      'Learn damage vulnerabilities, resistances, and immunities within 30ft.',
      'Identify spells cast or magical effects active on target.',
      'Recall ancient lore or sacred rites regarding celestial or fiendish origins.',
    ],
    influence: [
      'De-escalate hostile creatures with DC 15 Charisma check.',
      'Creature must be able to hear and understand.',
      'Command beast or summoned creature as a bonus action.',
      'Inspire allies within 30ft to add +1d4 to attack rolls.',
    ],
    hide: [
      'Must have light obscurement or three-quarters cover.',
      'Can hide in dim light or darkness even while observed.',
      'Break line of sight and shift silently up to 10ft.',
      'Become invisible until the start of next turn or until an attack is made.',
    ],
    tools: [
      'Herbalism Kit: Brew curative poultice or antitoxin in 1 minute.',
      "Thieves' Tools: Pick locks or disarm traps as a bonus action.",
      "Poisoner's Kit: Apply lethal coating to weapon as a bonus action.",
      'Craft or repair equipment during short rest with DC 15 check.',
    ],
  }

  const applyRiderPreset = (category: 'search' | 'study' | 'influence' | 'hide' | 'tools', text: string) => {
    if (!passives.value.riders) passives.value.riders = { search: '', study: '', influence: '', hide: '', tools: '' }
    passives.value.riders[category] = text
  }

  const appendRiderTag = (category: 'search' | 'study' | 'influence' | 'hide' | 'tools', tag: string) => {
    if (!passives.value.riders) passives.value.riders = { search: '', study: '', influence: '', hide: '', tools: '' }
    const cur = passives.value.riders[category] || ''
    passives.value.riders[category] = cur ? `${cur}, ${tag}` : tag
  }

  const availableSkillEntries = computed(() =>
    availableSkills.value.map((skill) => ({
      value: skill.value,
      label: skill.label,
      group: skill.category,
      badge: skill.category,
      icon: skill.icon,
      color: skill.color,
    }))
  )

  const availableToolEntries = computed(() =>
    availableTools.value.map((tool) => ({
      value: tool.value,
      label: tool.label,
      group: tool.category,
      badge: tool.category,
      icon: tool.icon,
      color: tool.color,
    }))
  )

  const statEntries = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((stat) => ({
    value: stat,
    label: stat,
  }))

  const setToolStat = (tool: MonsterToolProficiency, val: unknown) => {
    tool.stat = (val ? String(val) : 'DEX') as MonsterToolProficiency['stat']
  }

  return {
    monster,
    setToolStat,
    skills: computed(() => monster.skills),
    deleteSkill: monster.deleteSkill,
    availableSkillEntries,
    onSkillSelected,
    availableToolEntries,
    statEntries,
    onToolSelected,
    passives,
    movesToActionGroup,
    setMoveToActionGroup,
    riderPresets,
    applyRiderPreset,
    appendRiderTag,
    groupPassiveKeys,
    passiveLabel,
    effectiveSkillActionType,
    toggleSkillActionType,
    getPassive,
    bonusForSkill,
    calculateToolBonus,
    formatModifier,
    toggleSkillAdvantage,
    toggleSkillDisadvantage,
    toggleToolAdvantage,
    toggleToolDisadvantage,
    getSkillOverrideOptions,
    getToolOverrideOptions,
    getPassiveOverrideOptions,
    validateNumber,
  }
}

export type SkillsEditorState = ReturnType<typeof useSkillsEditorState>
const KEY: InjectionKey<SkillsEditorState> = Symbol('SkillsEditor')
export const provideSkillsEditorState = (state: SkillsEditorState) => { provide(KEY, state); return state }
export const injectSkillsEditorState = (): SkillsEditorState => {
  const state = inject(KEY)
  if (!state) throw new Error('SkillsEditor section used outside SkillsEditor')
  return state
}
