import NewTemplateDialog from '../widgets/NewTemplateDialog.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { ref, computed, inject, provide } from 'vue'
import type { InjectionKey } from 'vue'
import { useAutoUpdateCr } from '../useAutoUpdateCr'
import { useQuasar } from 'quasar'
import { MonsterAction, MonsterTrait, MonsterReaction, DndAttack, ActionDescriptionContainer, LairAction, SwappableField } from '../../models'
import { useTemplatesStore } from 'src/stores/templates-store'
import { useI18n } from 'vue-i18n'
import { v4 as uuidv4 } from 'uuid'
import { ACTION_TEMPLATES, applyActionTemplate, TEMPLATE_OWNED_FIELDS } from 'src/core/domain/action-templates'
import { entryBindingPrefix, withoutEntryBindings } from 'src/core/domain/entry-bindings'
import type { ActionTemplate } from 'src/core/domain/action-templates'
import type { ActionComposerRole } from 'src/core/domain/action-composer'
import type { HeaderRole } from 'src/core/domain/role-headers'
import { roleTransition } from 'src/core/domain/role-transition'

export interface UnifiedEntry {
  id: string
  role: 'attack' | 'trait' | 'action' | 'bonus_action' | 'reaction' | 'legendary' | 'mythic' | 'lair'
  name: string
  description: string
  recharge?: string
  cost?: number
  showAdvanced?: boolean
  descriptionContainers?: ActionDescriptionContainer[]
  rawAttack?: DndAttack
  rawAction?: MonsterAction
  rawTrait?: MonsterTrait
  rawReaction?: MonsterReaction
  rawLair?: LairAction
}

// State and handlers shared by ActionsEditor and its section components (ADR-0003 provide/inject).
export function useActionsEditorState() {
  const monster = useMonsterStore()
  const { autoUpdateCr } = useAutoUpdateCr()
  const $q = useQuasar()
  const { t } = useI18n()
  const templateStore = useTemplatesStore()

  const selectedCategory = ref<'all' | 'multiattack' | 'attack' | 'trait' | 'action' | 'bonus_action' | 'reaction' | 'legendary' | 'mythic' | 'lair'>('all')

  const roleOptions = [
    { label: 'Action', value: 'action' },
    { label: 'Bonus Action', value: 'bonus_action' },
    { label: 'Trait', value: 'trait' },
    { label: 'Reaction', value: 'reaction' },
    { label: 'Legendary Action', value: 'legendary' },
    { label: 'Mythic Action', value: 'mythic' },
    { label: 'Lair Action', value: 'lair' },
  ]

  const actionTemplateGroups = computed(() => {
    const groups = new Map<string, ActionTemplate[]>()
    for (const template of ACTION_TEMPLATES) {
      const group = groups.get(template.category) ?? []
      group.push(template)
      groups.set(template.category, group)
    }
    return [...groups].map(([name, templates]) => ({ name, templates }))
  })

  // Unified List Aggregator
  const allEntries = computed<UnifiedEntry[]>(() => {
    const list: UnifiedEntry[] = []

    for (const attack of monster.attacks) list.push({ id: attack.id, role: 'attack', name: attack.name, description: attack.description, rawAttack: attack })

    // 1. Traits
    for (const tr of monster.traits || []) {
      list.push({
        id: tr.id,
        role: 'trait',
        name: tr.name || 'Trait',
        description: tr.description || '',
        recharge: tr.limitedUse?.count ? `${tr.limitedUse.count}/${tr.limitedUse.rate}` : '',
        rawTrait: tr,
        descriptionContainers: tr.descriptionContainers,
      })
    }

    // 2. Actions & Bonus Actions
    for (const ac of monster.actions || []) {
      // If it's legendary only, map it as legendary or mythic
      const isLeg = monster.legendaryActions?.actions?.find((la) => la.actionId === ac.id)
      const isMyth = monster.mythicActions?.actions?.find((ma) => ma.actionId === ac.id)

      let role: UnifiedEntry['role'] = ac.bonusAction ? 'bonus_action' : 'action'
      let cost: number | undefined = undefined

      if (isMyth) {
        role = 'mythic'
        cost = isMyth.cost
      } else if (isLeg) {
        role = 'legendary'
        cost = isLeg.cost
      }

      list.push({
        id: ac.id,
        role,
        name: ac.name || 'Action',
        description: ac.description || '',
        recharge: ac.recharge || (ac.limitedUse?.count ? `${ac.limitedUse.count}/${ac.limitedUse.rate}` : ''),
        cost,
        rawAction: ac,
        descriptionContainers: ac.descriptionContainers,
      })
    }

    // 3. Reactions
    for (const rx of monster.reactions || []) {
      list.push({
        id: rx.id,
        role: 'reaction',
        name: rx.name || 'Reaction',
        description: rx.description || '',
        recharge: rx.limitedUse?.count ? `${rx.limitedUse.count}/${rx.limitedUse.rate}` : '',
        rawReaction: rx,
        descriptionContainers: rx.descriptionContainers,
      })
    }

    // 4. Lair Actions
    for (const lr of monster.lairActions || []) {
      list.push({
        id: lr.id,
        role: 'lair',
        name: 'Lair Action',
        description: lr.description || '',
        rawLair: lr,
        descriptionContainers: lr.descriptionContainers,
      })
    }

    return list
  })

  const filteredEntries = computed(() => {
    if (selectedCategory.value === 'all') return allEntries.value
    return allEntries.value.filter((e) => e.role === selectedCategory.value)
  })

  const visibleAssociationRoles = computed(() => (['legendary', 'mythic'] as const).filter(role => selectedCategory.value === 'all' || selectedCategory.value === role))

  const visibleHeaderRoles = computed<HeaderRole[]>(() => {
    const roles: HeaderRole[] = ['legendary', 'mythic', 'lair']
    const populated = {
      legendary: monster.legendaryActions.actions.length > 0,
      mythic: monster.mythicActions.actions.length > 0,
      lair: monster.lairActions.length > 0,
    }
    return roles.filter((role) => selectedCategory.value === role ||
      (selectedCategory.value === 'all' && populated[role]))
  })

  const categoryTabs = computed<Array<{ label: string; value: typeof selectedCategory.value; count: number; activeColor: string; activeTextColor?: string }>>(() => {
    const all = allEntries.value
    return [
      { label: 'All', value: 'all', count: all.length + monster.multiattacks.length, activeColor: 'amber-4', activeTextColor: 'grey-10' },
      { label: 'Multiattack', value: 'multiattack', count: monster.multiattacks.length, activeColor: 'red-9' },
      { label: 'Attacks', value: 'attack', count: all.filter((e) => e.role === 'attack').length, activeColor: 'red-8' },
      { label: 'Actions', value: 'action', count: all.filter((e) => e.role === 'action').length, activeColor: 'amber-8', activeTextColor: 'grey-10' },
      { label: 'Bonus Actions', value: 'bonus_action', count: all.filter((e) => e.role === 'bonus_action').length, activeColor: 'orange-8', activeTextColor: 'grey-10' },
      { label: 'Traits', value: 'trait', count: all.filter((e) => e.role === 'trait').length, activeColor: 'cyan-10' },
      { label: 'Reactions', value: 'reaction', count: all.filter((e) => e.role === 'reaction').length, activeColor: 'blue-9' },
      { label: 'Legendary', value: 'legendary', count: all.filter((e) => e.role === 'legendary').length, activeColor: 'purple-8' },
      { label: 'Mythic', value: 'mythic', count: all.filter((e) => e.role === 'mythic').length, activeColor: 'deep-purple-8' },
      { label: 'Lair', value: 'lair', count: all.filter((e) => e.role === 'lair').length, activeColor: 'teal-8' },
    ]
  })

  const addNewEntry = (role: string) => {
    if (role === 'multiattack') {
      monster.addMultiattack()
      selectedCategory.value = 'multiattack'
    } else if (role === 'attack') {
      monster.addNewAttack()
      selectedCategory.value = 'attack'
    } else if (role === 'trait') {
      monster.addTrait()
    } else if (role === 'reaction') {
      monster.addReaction()
    } else if (role === 'lair') {
      monster.addLairAction()
    } else if (role === 'legendary') {
      monster.addAction()
      const latest = monster.actions[monster.actions.length - 1]
      if (latest) {
        latest.legendaryOnly = true
        monster.addLegendaryAction(latest.id, 1)
      }
    } else if (role === 'mythic') {
      monster.addAction()
      const latest = monster.actions[monster.actions.length - 1]
      if (latest) {
        latest.legendaryOnly = true
        monster.addMythicAction(latest.id)
      }
    } else if (role === 'bonus_action') {
      monster.addAction()
      const latest = monster.actions[monster.actions.length - 1]
      if (latest) latest.bonusAction = true
    } else {
      monster.addAction()
    }
  }

  const changeItemRole = (item: UnifiedEntry, newRole: string) => {
    if (item.rawAttack) return
    const copyId = uuidv4()
    const target = newRole as ActionComposerRole
    const decision = roleTransition(monster, item.id, item.role as ActionComposerRole, target, copyId)
    if (decision.kind === 'noop') return
    if (decision.kind === 'unavailable') {
      $q.notify({ type: 'warning', message: decision.message })
      return
    }
    $q.dialog({
      title: decision.title,
      message: decision.message,
      cancel: { label: 'Cancel', flat: true },
      ok: { label: decision.kind === 'copy' ? 'Create copy' : 'Change role', color: 'amber-4', textColor: 'grey-10' },
      persistent: true,
    }).onOk(() => {
      // Recompute from live data; never commit the stale preview's collection snapshots.
      const current = roleTransition(monster, item.id, item.role as ActionComposerRole, target, copyId)
      if (!current.patch || current.kind !== decision.kind) {
        $q.notify({ type: 'warning', message: 'The entry changed. Review it before trying again.' })
        return
      }
      const patch = current.patch
      monster.$patch(state => {
        Object.assign(state, patch)
        if (patch.bindings) state.bindings = patch.bindings
      })
      selectedCategory.value = target
      $q.notify({ type: 'positive', message: current.kind === 'copy' ? 'Copy created. Original entry kept.' : 'Role changed. Entry data and references kept.' })
    })
  }
  const addTextContainer = (item: UnifiedEntry) => {
    const container: ActionDescriptionContainer = {
      id: uuidv4(),
      kind: 'text',
      outcomeTarget: '',
      text: ''
    }
    if (!item.descriptionContainers) item.descriptionContainers = []
    item.descriptionContainers.push(container)
    syncContainers(item)
  }

  const addTableContainer = (item: UnifiedEntry) => {
    const container: ActionDescriptionContainer = {
      id: uuidv4(),
      kind: 'table',
      outcomeTarget: '',
      table: {
        headers: ['Roll', 'Outcome Effect'],
        rows: [
          ['1-10', 'Minor effect'],
          ['11-20', 'Major effect']
        ]
      }
    }
    if (!item.descriptionContainers) item.descriptionContainers = []
    item.descriptionContainers.push(container)
    syncContainers(item)
  }

  const removeContainer = (item: UnifiedEntry, index: number) => {
    if (!item.descriptionContainers) return
    item.descriptionContainers.splice(index, 1)
    syncContainers(item)
  }

  const setContainerKind = (item: UnifiedEntry, index: number, newKind: 'text' | 'table') => {
    if (!item.descriptionContainers || !item.descriptionContainers[index]) return
    const c = item.descriptionContainers[index]
    c.kind = newKind
    if (newKind === 'table' && !c.table) {
      c.table = {
        headers: ['Roll', 'Outcome Effect'],
        rows: [
          ['1-10', 'Minor effect'],
          ['11-20', 'Major effect']
        ]
      }
    }
    syncContainers(item)
  }

  const addTableRow = (container: ActionDescriptionContainer, item: UnifiedEntry) => {
    if (!container.table) return
    const colCount = Math.max(1, container.table.headers.length)
    const newRow = Array(colCount).fill('')
    container.table.rows.push(newRow)
    syncContainers(item)
  }

  const removeTableRow = (container: ActionDescriptionContainer, rowIndex: number, item: UnifiedEntry) => {
    if (!container.table) return
    container.table.rows.splice(rowIndex, 1)
    syncContainers(item)
  }

  const syncContainers = (item: UnifiedEntry) => {
    if (item.rawLair) item.rawLair.descriptionContainers = item.descriptionContainers ? [...item.descriptionContainers] : []
    if (item.rawAction) item.rawAction.descriptionContainers = item.descriptionContainers ? [...item.descriptionContainers] : []
    if (item.rawTrait) item.rawTrait.descriptionContainers = item.descriptionContainers ? [...item.descriptionContainers] : []
    if (item.rawReaction) item.rawReaction.descriptionContainers = item.descriptionContainers ? [...item.descriptionContainers] : []
  }

  const updateItemDescription = (item: UnifiedEntry, val: string) => {
    item.description = val
    if (item.rawAction) {
      item.rawAction.description = val
      autoUpdateCr(val, item.rawAction.crAnnotation, item.rawAction)
    }
    if (item.rawTrait) {
      item.rawTrait.description = val
      if (item.rawTrait.crAnnotation) autoUpdateCr(val, item.rawTrait.crAnnotation)
    }
    if (item.rawReaction) item.rawReaction.description = val

    if (item.role === 'lair') {
      const lr = monster.lairActions?.find((l) => l.id === item.id)
      if (lr) {
        lr.description = val
        if (lr.crAnnotation) autoUpdateCr(val, lr.crAnnotation)
      }
    }
  }

  const updateItemCost = (item: UnifiedEntry, val: number) => {
    item.cost = val
    if (item.role === 'legendary') {
      const la = monster.legendaryActions?.actions?.find((a) => a.actionId === item.id)
      if (la) la.cost = val
    }
    if (item.role === 'mythic') {
      const ma = monster.mythicActions?.actions?.find((a) => a.actionId === item.id)
      if (ma) ma.cost = val
    }
  }

  const deleteUnifiedItem = (item: UnifiedEntry) => {
    if (item.rawAttack) {
      monster.deleteAttack(item.id)
    } else if (item.role === 'trait') {
      monster.deleteTrait(item.id)
    } else if (item.role === 'reaction') {
      monster.deleteReaction(item.id)
    } else if (item.role === 'lair') {
      monster.deleteLairAction(item.id)
    } else if (item.role === 'legendary') {
      monster.deleteLegendaryAction(item.id)
      monster.deleteAction(item.id)
    } else if (item.role === 'mythic') {
      monster.deleteMythicAction(item.id)
      monster.deleteAction(item.id)
    } else {
      monster.deleteAction(item.id)
    }
  }

  const roleBadgeStyles: Record<string, { color: string; textColor: string }> = {
    action: { color: 'amber-4', textColor: 'grey-10' },
    bonus_action: { color: 'orange-8', textColor: 'grey-10' },
    trait: { color: 'cyan-10', textColor: 'white' },
    reaction: { color: 'blue-9', textColor: 'white' },
    legendary: { color: 'purple-8', textColor: 'white' },
    mythic: { color: 'deep-purple-8', textColor: 'white' },
    lair: { color: 'teal-8', textColor: 'white' },
  }

  const getRoleBadgeColor = (role: string): string => roleBadgeStyles[role]?.color ?? 'grey-8'

  const getRoleBadgeTextColor = (role: string): string => roleBadgeStyles[role]?.textColor ?? 'white'

  const getRoleLabel = (role: string): string => {
    switch (role) {
      case 'action': return 'Action'
      case 'bonus_action': return 'Bonus Action'
      case 'trait': return 'Trait'
      case 'reaction': return 'Reaction'
      case 'legendary': return 'Legendary'
      case 'mythic': return 'Mythic'
      case 'lair': return 'Lair Action'
      default: return role
    }
  }

  const getStoreCollectionField = (role: string): SwappableField => {
    if (role === 'attack') return 'attacks'
    if (role === 'trait') return 'traits'
    if (role === 'reaction') return 'reactions'
    if (role === 'lair') return 'lairActions'
    return 'actions'
  }

  const getItemStoreIndex = (item: UnifiedEntry): number => {
    if (item.rawAttack) return monster.attacks.findIndex(a => a.id === item.id)
    if (item.role === 'trait') {
      return monster.traits?.findIndex((t) => t.id === item.id) ?? 0
    }
    if (item.role === 'reaction') {
      return monster.reactions?.findIndex((r) => r.id === item.id) ?? 0
    }
    if (item.role === 'lair') {
      return monster.lairActions?.findIndex((l) => l.id === item.id) ?? 0
    }
    return monster.actions?.findIndex((a) => a.id === item.id) ?? 0
  }

  const chainRole = (item: UnifiedEntry): ActionComposerRole => {
    return item.role as ActionComposerRole
  }

  const confirmApplyActionTemplate = (item: UnifiedEntry, template: ActionTemplate) => {
    const action = item.rawAction
    if (!action) return
    $q.dialog({
      title: 'Replace action contents?',
      message: `Replace “${item.name}” with “${template.name}”? This replaces its name, mechanics, targeting, outcomes, and description. Role, uses, recharge, phase, and CR settings are kept.`,
      ok: { label: 'Apply template', color: 'primary' },
      cancel: { label: 'Keep current action', flat: true },
      persistent: true,
    }).onOk(() => {
      const applied = applyActionTemplate(action, template.id)
      monster.$patch(state => {
        state.bindings = withoutEntryBindings(state.bindings, entryBindingPrefix('actions', action.id), TEMPLATE_OWNED_FIELDS)
        Object.assign(action, applied)
      })
      item.name = applied.name
      item.description = applied.description
      item.recharge = applied.recharge
      autoUpdateCr(applied.description, applied.crAnnotation, applied)
      $q.notify({ message: `${template.name} applied`, type: 'positive' })
    })
  }

  const addTemplate = (target: MonsterAction | MonsterTrait | MonsterReaction, role: 'action' | 'trait' | 'reaction' = 'action') => {
    $q.dialog({
      component: NewTemplateDialog,
      componentProps: {
        targetName: target?.name || 'Action',
      },
    }).onOk(({ name, icon }: { name: string; icon: string }) => {
      if (role === 'reaction') templateStore.addCustomReaction(target as MonsterReaction, name, icon)
      else if (role === 'trait') templateStore.addCustomTrait(target as MonsterTrait, name, icon)
      else templateStore.addCustomAction(target as MonsterAction, name, icon)
      $q.notify({
        message: `${t('editor.template.added', [name])}. Saved numeric values are a snapshot; this creature’s formulas stay on this creature.`,
        type: 'positive',
      })
    })
  }

  const collapsedMap = ref<Record<string, boolean>>({})
  const collapsedCategoryMap = ref<Record<string, boolean>>({})

  const categoryOrder: Array<{ role: UnifiedEntry['role']; label: string }> = [
    { role: 'trait', label: 'Traits' },
    { role: 'attack', label: 'Attacks' },
    { role: 'action', label: 'Actions' },
    { role: 'bonus_action', label: 'Bonus Actions' },
    { role: 'reaction', label: 'Reactions' },
    { role: 'legendary', label: 'Legendary Actions' },
    { role: 'mythic', label: 'Mythic Actions' },
    { role: 'lair', label: 'Lair Actions' },
  ]

  const groupedEntriesByCategory = computed(() => {
    const entries = filteredEntries.value
    return categoryOrder
      .map((cat) => ({
        role: cat.role,
        label: cat.label,
        items: entries.filter((e) => e.role === cat.role),
      }))
      .filter((group) => group.items.length > 0)
  })

  const isCategoryCollapsed = (role: string) => Boolean(collapsedCategoryMap.value[role])
  const toggleCategoryCollapse = (role: string) => {
    collapsedCategoryMap.value[role] = !collapsedCategoryMap.value[role]
  }
  const collapseCategoryItems = (role: string) => {
    for (const item of filteredEntries.value) {
      if (item.role === role) collapsedMap.value[item.id] = true
    }
  }
  const expandCategoryItems = (role: string) => {
    collapsedCategoryMap.value[role] = false
    for (const item of filteredEntries.value) {
      if (item.role === role) collapsedMap.value[item.id] = false
    }
  }

  const isItemCollapsed = (id: string) => Boolean(collapsedMap.value[id])
  const toggleItemCollapse = (id: string) => {
    collapsedMap.value[id] = !collapsedMap.value[id]
  }
  const collapseAllEntries = () => {
    for (const item of filteredEntries.value) {
      collapsedMap.value[item.id] = true
    }
  }
  const expandAllEntries = () => {
    for (const group of groupedEntriesByCategory.value) {
      collapsedCategoryMap.value[group.role] = false
    }
    for (const item of filteredEntries.value) {
      collapsedMap.value[item.id] = false
    }
  }

  return {
    collapsedMap,
    collapsedCategoryMap,
    groupedEntriesByCategory,
    isCategoryCollapsed,
    toggleCategoryCollapse,
    collapseCategoryItems,
    expandCategoryItems,
    isItemCollapsed,
    toggleItemCollapse,
    collapseAllEntries,
    expandAllEntries,
    monster,
    selectedCategory,
    categoryTabs,
    filteredEntries,
    visibleHeaderRoles,
    visibleAssociationRoles,
    roleOptions,
    actionTemplateGroups,
    addNewEntry,
    changeItemRole,
    updateItemDescription,
    addTextContainer,
    addTableContainer,
    setContainerKind,
    removeContainer,
    addTableRow,
    removeTableRow,
    syncContainers,
    updateItemCost,
    deleteUnifiedItem,
    getRoleBadgeColor,
    getRoleBadgeTextColor,
    getRoleLabel,
    getStoreCollectionField,
    getItemStoreIndex,
    chainRole,
    confirmApplyActionTemplate,
    addTemplate,
  }
}

export type ActionsEditorState = ReturnType<typeof useActionsEditorState>
const KEY: InjectionKey<ActionsEditorState> = Symbol('ActionsEditor')
export const provideActionsEditorState = (state: ActionsEditorState) => { provide(KEY, state); return state }
export const injectActionsEditorState = (): ActionsEditorState => {
  const state = inject(KEY)
  if (!state) throw new Error('ActionsEditor section used outside ActionsEditor')
  return state
}
