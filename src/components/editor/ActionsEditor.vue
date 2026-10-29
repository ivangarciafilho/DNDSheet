<template>
  <q-expansion-item
    expand-separator
    icon="mdi-movie-open"
    label="Actions &amp; Traits Studio"
    caption="Unified studio for traits, actions, bonus actions, reactions, legendary, mythic &amp; lair actions"
    header-class="bg-amber-10 text-white text-weight-bold"
  >
    <q-card class="bg-grey-10 text-white q-pa-sm">
      <!-- Category Filter Bar & Quick Add Header -->
      <div class="row items-center justify-between q-mb-sm q-col-gutter-xs">
        <div class="col-12 col-md-9 row items-center q-gutter-xs flex-wrap">
          <q-btn
            v-for="cat in categoryTabs"
            :key="cat.value"
            dense
            size="sm"
            :color="selectedCategory === cat.value ? cat.activeColor : 'grey-9'"
            :text-color="selectedCategory === cat.value ? 'white' : 'grey-4'"
            no-caps
            class="text-weight-bold"
            @click="selectedCategory = cat.value"
          >
            <span>{{ cat.label }}</span>
            <span
              class="q-ml-xs text-weight-bolder"
              :class="selectedCategory === cat.value ? 'text-amber-3' : 'text-grey-5'"
            >
              ({{ cat.count }})
            </span>
          </q-btn>
        </div>

        <div class="col-12 col-md-3 row justify-end">
          <q-btn-dropdown
            color="positive"
            dense
            no-caps
            icon="add"
            label="Add Entry"
            class="full-width text-weight-bold"
          >
            <q-list class="bg-grey-9 text-white">
              <q-item v-close-popup clickable @click="addNewEntry('action')">
                <q-item-section avatar><q-icon name="mdi-sword" color="amber-5" /></q-item-section>
                <q-item-section>Add Action</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('bonus_action')">
                <q-item-section avatar><q-icon name="mdi-flash" color="orange-5" /></q-item-section>
                <q-item-section>Add Bonus Action</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('trait')">
                <q-item-section avatar><q-icon name="auto_awesome" color="cyan-4" /></q-item-section>
                <q-item-section>Add Trait</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('reaction')">
                <q-item-section avatar><q-icon name="mdi-account-reactivate" color="blue-4" /></q-item-section>
                <q-item-section>Add Reaction</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('legendary')">
                <q-item-section avatar><q-icon name="fa-solid fa-dragon" color="purple-4" /></q-item-section>
                <q-item-section>Add Legendary Action</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('mythic')">
                <q-item-section avatar><q-icon name="mdi-crown" color="deep-purple-3" /></q-item-section>
                <q-item-section>Add Mythic Action</q-item-section>
              </q-item>
              <q-item v-close-popup clickable @click="addNewEntry('lair')">
                <q-item-section avatar><q-icon name="home" color="teal-4" /></q-item-section>
                <q-item-section>Add Lair Action</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredEntries.length === 0" class="q-pa-md text-center text-grey-5">
        <q-icon name="info" size="32px" class="q-mb-xs" />
        <div>No entries in category: <b>{{ selectedCategory }}</b></div>
        <div class="text-caption">Click "+ Add Entry" above to create one.</div>
      </div>

      <!-- Unified List of Actions & Traits -->
      <div v-else class="column q-gutter-y-xs">
        <div
          v-for="item in filteredEntries"
          :key="item.id"
          class="rounded-borders bg-grey-9 text-white q-pa-xs shadow-1"
          style="border: 1px solid rgba(255, 255, 255, 0.12);"
        >
          <!-- Top Row: Role Selector, Recharge/Cost, Name & Actions -->
          <div class="row q-col-gutter-xs items-center">
            <!-- Far-Left Role Selector -->
            <div class="col-12 col-sm-3 col-md-2">
              <q-select
                :model-value="item.role"
                :options="roleOptions"
                emit-value
                map-options
                dense
                outlined
                dark
                hide-bottom-space
                options-dense
                label="Role"
                @update:model-value="(newRole: string) => changeItemRole(item, newRole)"
              >
                <template #selected>
                  <q-badge :color="getRoleBadgeColor(item.role)" class="text-caption text-weight-bold">
                    {{ getRoleLabel(item.role) }}
                  </q-badge>
                </template>
                <q-tooltip class="text-caption">Switch entry between Action, Bonus Action, Trait, Reaction, Legendary, Mythic or Lair</q-tooltip>
              </q-select>
            </div>

            <template v-if="!item.rawAction && !item.rawReaction">
              <!-- Far-Left Recharge / Cost Selector -->
              <div class="col-6 col-sm-3 col-md-2">
                <template v-if="item.role === 'legendary' || item.role === 'mythic'">
                  <q-select
                    :model-value="item.cost || 1"
                    :options="[1, 2, 3]"
                    dense
                    outlined
                    dark
                    hide-bottom-space
                    options-dense
                    label="Cost"
                    @update:model-value="(val: number) => updateItemCost(item, val)"
                  >
                    <template #selected>
                      <span class="text-caption text-weight-bold text-amber-3">
                        Cost: {{ item.cost || 1 }}
                      </span>
                    </template>
                    <q-tooltip class="text-caption">Legendary / Mythic action point cost</q-tooltip>
                  </q-select>
                </template>
                <template v-else>
                  <q-input
                    :model-value="item.recharge || ''"
                    dense
                    outlined
                    dark
                    hide-bottom-space
                    label="Recharge"
                    placeholder="e.g. 5–6, 3/Day"
                    @update:model-value="(val: string | number | null) => updateItemRecharge(item, String(val || ''))"
                  >
                    <q-tooltip class="text-caption">Cadence or recharge rate (e.g. Recharge 5-6, 1/Day, Short Rest)</q-tooltip>
                  </q-input>
                </template>
              </div>

              <!-- Name Input -->
              <div class="col-6 col-sm-6 col-md-5">
                <q-input
                  :model-value="item.name"
                  dense
                  outlined
                  dark
                  hide-bottom-space
                  label="Name"
                  class="full-width"
                  @update:model-value="(val: string | number | null) => updateItemName(item, String(val || ''))"
                >
                  <template #after>
                    <q-btn
                      round
                      flat
                      dense
                      icon="save"
                      color="cyan-3"
                      size="sm"
                      @click="addTemplate(item.rawAction || item)"
                    >
                      <q-tooltip>Save as Template</q-tooltip>
                    </q-btn>
                  </template>
                  <q-tooltip class="text-caption">Title of the action, attack, or trait</q-tooltip>
                </q-input>
              </div>
            </template>
            <div v-else class="col text-weight-bold ellipsis" :title="item.name">{{ item.name }}</div>

            <!-- Swap and Delete Actions -->
            <div class="col-12 col-md-auto row items-center justify-end q-gutter-x-xs">
              <!-- Reusable templates use the same structured fields read by the A6 renderer. -->
              <div v-if="item.rawAction" class="row items-center">
                <q-btn-dropdown
                  :data-action-editor-id="item.id"
                  dense
                  flat
                  size="sm"
                  color="teal-3"
                  icon="auto_fix_normal"
                  label="Apply template"
                  no-caps
                >
                  <q-list dense class="bg-grey-9 text-white" style="min-width: 280px; max-width: min(92vw, 420px);">
                    <template v-for="group in actionTemplateGroups" :key="group.name">
                      <q-item-label header class="text-amber-3">{{ group.name }}</q-item-label>
                      <q-item
                        v-for="template in group.templates"
                        :key="template.id"
                        v-close-popup
                        :data-action-template="template.id"
                        clickable
                        @click="confirmApplyActionTemplate(item, template)"
                      >
                        <q-item-section>
                          <q-item-label>{{ template.name }}</q-item-label>
                          <q-item-label caption>{{ template.summary }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-list>
                </q-btn-dropdown>
                <q-tooltip>Apply a reusable structured action. Existing action content is shown for confirmation before replacement.</q-tooltip>
              </div>
              <q-btn v-if="item.rawAction" round flat dense icon="save" color="cyan-3" size="sm" @click="addTemplate(item.rawAction)">
                <q-tooltip>Save as Template</q-tooltip>
              </q-btn>
              <swap-buttons :field="getStoreCollectionField(item.role)" :idx="getItemStoreIndex(item)" />
              <q-btn
                round
                flat
                dense
                icon="delete"
                color="negative"
                size="sm"
                @click="deleteUnifiedItem(item)"
              >
                <q-tooltip>Delete Entry</q-tooltip>
              </q-btn>
            </div>
          </div>

          <!-- A7: abilities stored as MonsterAction are edited as a chain of plate cells, in plate order. -->
          <composer-chain
            v-if="item.rawAction || item.rawReaction"
            :action-id="item.id"
            :role="chainRole(item)"
            :cost="item.cost || 1"
            @update:cost="(cost: number) => updateItemCost(item, cost)"
          />

          <!-- Description Text Editor with Integrated Intellisense & Dropdowns -->
          <monster-text-editor
            :field="item.description"
            i18n-label-key="monster.trait.description"
            token-category="action"
            @update:model-value="(val: string) => updateItemDescription(item, val)"
          />
        </div>
      </div>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import { useMonsterStore } from 'src/stores/monster-store'
import { defineComponent, ref, computed } from 'vue'
import MonsterTextEditor from './MonsterTextEditor.vue'
import { useAutoUpdateCr } from './useAutoUpdateCr'
import { useQuasar } from 'quasar'
import { MonsterAction, MonsterTrait, MonsterReaction } from '../models'
import NewTemplateDialog from './widgets/NewTemplateDialog.vue'
import { useTemplatesStore } from 'src/stores/templates-store'
import { useI18n } from 'vue-i18n'
import SwapButtons from './widgets/SwapButtons.vue'
import { v4 as uuidv4 } from 'uuid'
import { ACTION_TEMPLATES, applyActionTemplate } from 'src/core/domain/action-templates'
import type { ActionTemplate } from 'src/core/domain/action-templates'
import type { ActionModelRole } from 'src/core/domain/composer-chain'
import type { ActionComposerRole } from 'src/core/domain/action-composer'
import ComposerChain from './composer/ComposerChain.vue'

export interface UnifiedEntry {
  id: string
  role: 'trait' | 'action' | 'bonus_action' | 'reaction' | 'legendary' | 'mythic' | 'lair'
  name: string
  description: string
  recharge?: string
  cost?: number
  showAdvanced?: boolean
  rawAction?: MonsterAction
  rawTrait?: MonsterTrait
  rawReaction?: MonsterReaction
}

export default defineComponent({
  name: 'ActionsEditor',
  components: {
    MonsterTextEditor,
    SwapButtons,
    ComposerChain,
  },
  setup() {
    const monster = useMonsterStore()
    const { autoUpdateCr } = useAutoUpdateCr()
    const $q = useQuasar()
    const { t } = useI18n()
    const templateStore = useTemplatesStore()

    const selectedCategory = ref<'all' | 'trait' | 'action' | 'bonus_action' | 'reaction' | 'legendary' | 'mythic' | 'lair'>('all')

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

      // 1. Traits
      for (const tr of monster.traits || []) {
        list.push({
          id: tr.id,
          role: 'trait',
          name: tr.name || 'Trait',
          description: tr.description || '',
          recharge: tr.limitedUse?.count ? `${tr.limitedUse.count}/${tr.limitedUse.rate}` : '',
          rawTrait: tr,
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
        })
      }

      // 4. Lair Actions
      for (const lr of monster.lairActions || []) {
        list.push({
          id: lr.id,
          role: 'lair',
          name: 'Lair Action',
          description: lr.description || '',
        })
      }

      return list
    })

    const filteredEntries = computed(() => {
      if (selectedCategory.value === 'all') return allEntries.value
      return allEntries.value.filter((e) => e.role === selectedCategory.value)
    })

    const categoryTabs = computed(() => {
      const all = allEntries.value
      return [
        { label: 'All', value: 'all', count: all.length, activeColor: 'amber-9' },
        { label: 'Actions', value: 'action', count: all.filter((e) => e.role === 'action').length, activeColor: 'amber-8' },
        { label: 'Bonus Actions', value: 'bonus_action', count: all.filter((e) => e.role === 'bonus_action').length, activeColor: 'orange-8' },
        { label: 'Traits', value: 'trait', count: all.filter((e) => e.role === 'trait').length, activeColor: 'cyan-8' },
        { label: 'Reactions', value: 'reaction', count: all.filter((e) => e.role === 'reaction').length, activeColor: 'blue-8' },
        { label: 'Legendary', value: 'legendary', count: all.filter((e) => e.role === 'legendary').length, activeColor: 'purple-8' },
        { label: 'Mythic', value: 'mythic', count: all.filter((e) => e.role === 'mythic').length, activeColor: 'deep-purple-8' },
        { label: 'Lair', value: 'lair', count: all.filter((e) => e.role === 'lair').length, activeColor: 'teal-8' },
      ]
    })

    const macroChips = computed(() => [
      { label: '{NAME}', token: '{NAME}', color: 'amber-4', preview: monster.name || 'Monster' },
      { label: '{STR_MOD}', token: '{STR_MOD}', color: 'red-4', preview: `${Math.floor(((monster.stats?.STR ?? 10) - 10) / 2)}` },
      { label: '{DEX_MOD}', token: '{DEX_MOD}', color: 'blue-4', preview: `${Math.floor(((monster.stats?.DEX ?? 10) - 10) / 2)}` },
      { label: '{CON_MOD}', token: '{CON_MOD}', color: 'green-4', preview: `${Math.floor(((monster.stats?.CON ?? 10) - 10) / 2)}` },
      { label: '{DC:CON}', token: '{DC:CON}', color: 'purple-3', preview: `DC ${8 + monster.proficiency + Math.floor(((monster.stats?.CON ?? 10) - 10) / 2)}` },
      { label: '{DC:WIS}', token: '{DC:WIS}', color: 'cyan-3', preview: `DC ${8 + monster.proficiency + Math.floor(((monster.stats?.WIS ?? 10) - 10) / 2)}` },
      { label: '{PROF}', token: '{PROF}', color: 'indigo-3', preview: `+${monster.proficiency}` },
      { label: '{AC}', token: '{AC}', color: 'teal-3', preview: `${monster.computedAc || 10}` },
      { label: '{HP}', token: '{HP}', color: 'pink-3', preview: `${monster.computedHp || 10}` },
      { label: '{DICE:2d6+4}', token: '{2d6+4}', color: 'yellow-4', preview: '11 (2d6 + 4)' },
    ])

    const insertMacro = (item: UnifiedEntry, token: string) => {
      const currentDesc = item.description || ''
      const updated = currentDesc ? `${currentDesc} ${token}` : token
      updateItemDescription(item, updated)
    }

    const addNewEntry = (role: string) => {
      if (role === 'trait') {
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
      if (item.role === newRole) return

      // Extract existing data
      const id = item.id || uuidv4()
      const name = item.name || 'Action'
      const description = item.description || ''
      const recharge = item.recharge || ''

      // 1. Remove from old collection
      if (item.role === 'trait') {
        monster.deleteTrait(id)
      } else if (item.role === 'reaction') {
        monster.deleteReaction(id)
      } else if (item.role === 'lair') {
        monster.deleteLairAction(id)
      } else if (item.role === 'legendary') {
        monster.deleteLegendaryAction(id)
        monster.deleteAction(id)
      } else if (item.role === 'mythic') {
        monster.deleteMythicAction(id)
        monster.deleteAction(id)
      } else {
        // regular action or bonus action
        monster.deleteAction(id)
      }

      // 2. Add to new collection
      if (newRole === 'trait') {
        monster.traits.push({
          id,
          name,
          description,
          limitedUse: { count: 0, rate: 'DAY' },
        })
      } else if (newRole === 'reaction') {
        monster.reactions.push({
          id,
          name,
          description,
          trigger: 'When a creature ...',
          limitedUse: { count: 0, rate: 'DAY' },
        })
      } else if (newRole === 'lair') {
        monster.lairActions.push({
          id,
          description,
        })
      } else if (newRole === 'legendary') {
        monster.actions.push({
          id,
          name,
          description,
          bonusAction: false,
          legendaryOnly: true,
          recharge,
          limitedUse: { count: 0, rate: 'DAY' },
          stat: 'none',
          effects: [],
        })
        monster.addLegendaryAction(id, 1)
      } else if (newRole === 'mythic') {
        monster.actions.push({
          id,
          name,
          description,
          bonusAction: false,
          legendaryOnly: true,
          recharge,
          limitedUse: { count: 0, rate: 'DAY' },
          stat: 'none',
          effects: [],
        })
        monster.addMythicAction(id)
      } else {
        // action or bonus_action
        monster.actions.push({
          id,
          name,
          description,
          bonusAction: newRole === 'bonus_action',
          legendaryOnly: false,
          recharge,
          limitedUse: { count: 0, rate: 'DAY' },
          stat: 'none',
          effects: [],
        })
      }
    }

    const updateItemName = (item: UnifiedEntry, val: string) => {
      item.name = val
      if (item.rawAction) item.rawAction.name = val
      if (item.rawTrait) item.rawTrait.name = val
      if (item.rawReaction) item.rawReaction.name = val
    }

    const updateItemDescription = (item: UnifiedEntry, val: string) => {
      item.description = val
      if (item.rawAction) {
        item.rawAction.description = val
        autoUpdateCr(val, item.rawAction.crAnnotation, item.rawAction)
      }
      if (item.rawTrait) item.rawTrait.description = val
      if (item.rawReaction) item.rawReaction.description = val

      if (item.role === 'lair') {
        const lr = monster.lairActions?.find((l) => l.id === item.id)
        if (lr) lr.description = val
      }
    }

    const updateItemRecharge = (item: UnifiedEntry, val: string) => {
      item.recharge = val
      if (item.rawAction) item.rawAction.recharge = val
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
      if (item.role === 'trait') {
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

    const getRoleBadgeColor = (role: string): string => {
      switch (role) {
        case 'action': return 'amber-9'
        case 'bonus_action': return 'orange-8'
        case 'trait': return 'cyan-8'
        case 'reaction': return 'blue-8'
        case 'legendary': return 'purple-8'
        case 'mythic': return 'deep-purple-8'
        case 'lair': return 'teal-8'
        default: return 'grey-7'
      }
    }

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

    const getStoreCollectionField = (role: string): string => {
      if (role === 'trait') return 'traits'
      if (role === 'reaction') return 'reactions'
      if (role === 'lair') return 'lairActions'
      return 'actions'
    }

    const getItemStoreIndex = (item: UnifiedEntry): number => {
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
      if (item.role === 'reaction') return 'reaction'
      return (item.role === 'bonus_action' || item.role === 'legendary' || item.role === 'mythic' ? item.role : 'action') as ActionModelRole
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
        Object.assign(action, applied)
        item.name = applied.name
        item.description = applied.description
        item.recharge = applied.recharge
        autoUpdateCr(applied.description, applied.crAnnotation, applied)
        $q.notify({ message: `${template.name} applied`, type: 'positive' })
      })
    }

    const addTemplate = (target: MonsterAction) => {
      $q.dialog({
        component: NewTemplateDialog,
        componentProps: {
          targetName: target?.name || 'Action',
        },
      }).onOk(({ name, icon }: { name: string; icon: string }) => {
        templateStore.addCustomAction(target, name, icon)
        $q.notify({
          message: t('editor.template.added', [name]),
          type: 'positive',
        })
      })
    }

    return {
      monster,
      selectedCategory,
      categoryTabs,
      filteredEntries,
      roleOptions,
      actionTemplateGroups,
      macroChips,
      insertMacro,
      addNewEntry,
      changeItemRole,
      updateItemName,
      updateItemDescription,
      updateItemRecharge,
      updateItemCost,
      deleteUnifiedItem,
      getRoleBadgeColor,
      getRoleLabel,
      getStoreCollectionField,
      getItemStoreIndex,
      chainRole,
      confirmApplyActionTemplate,
      addTemplate,
    }
  },
})
</script>
