<template>
  <q-expansion-item
    expand-separator
    icon="mdi-movie-open"
    label="Actions &amp; Traits Studio"
    caption="Unified studio for attacks, multiattack, traits, actions, bonus actions, reactions, legendary, mythic &amp; lair actions"
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
              <q-item v-close-popup clickable @click="addNewEntry('multiattack')"><q-item-section>Add Multiattack Option</q-item-section></q-item>
              <q-item v-close-popup clickable @click="addNewEntry('attack')"><q-item-section>Add Attack</q-item-section></q-item>
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

      <q-checkbox v-if="selectedCategory === 'trait' || selectedCategory === 'all'" v-model="monster.alphaTraits" dark dense label="Sort traits alphabetically on the sheet" data-studio-trait-sort class="q-mb-sm" />

      <action-associations v-for="role in visibleAssociationRoles" :key="role" :role="role" />

      <role-header-editor v-for="role in visibleHeaderRoles" :key="role" :role="role" />

      <multiattack-composer v-if="selectedCategory === 'multiattack' || (selectedCategory === 'all' && monster.multiattacks.length > 0)" />

      <!-- Empty State -->
      <div v-if="filteredEntries.length === 0 && selectedCategory !== 'multiattack' && (selectedCategory !== 'all' || monster.multiattacks.length === 0)" class="q-pa-md text-center text-grey-5">
        <q-icon name="info" size="32px" class="q-mb-xs" />
        <div>No entries in category: <b>{{ selectedCategory }}</b></div>
        <div class="text-caption">Click "+ Add Entry" above to create one.</div>
      </div>

      <!-- Unified List of Actions & Traits -->
      <div v-if="filteredEntries.length > 0" class="column q-gutter-y-xs">
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
              <span v-if="item.rawAttack" class="q-pa-sm">Attack</span>
              <q-select
                v-else
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
                <q-tooltip class="text-caption">Change compatible action roles, or create a copy for a different entry model. Review before applying.</q-tooltip>
              </q-select>
            </div>

            <div class="col text-weight-bold ellipsis" :title="item.name">{{ item.name }}</div>

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
              <q-btn v-if="item.rawTrait" round flat dense icon="save" color="cyan-3" size="sm" @click="addTemplate(item.rawTrait, 'trait')">
                <q-tooltip>Save as Trait Template</q-tooltip>
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

          <!-- Typed role adapters preserve each collection while using the same cell editor and renderer. -->
          <composer-chain
            v-if="item.rawAction || item.rawReaction || item.rawTrait || item.role === 'lair'"
            :action-id="item.id"
            :role="chainRole(item)"
            :cost="item.cost || 1"
            @update:cost="(cost: number) => updateItemCost(item, cost)"
          />

          <attack-composer v-if="item.rawAttack" :attack-id="item.id" />

          <entry-display-settings v-if="item.rawAction || item.role === 'lair'" :entry-id="item.id" :field="item.role === 'lair' ? 'lairActions' : 'actions'" />

          <trait-display-settings v-if="item.rawTrait" :trait-id="item.id" />

          <!-- Description Text Editor with Integrated Intellisense & Dropdowns -->
          <monster-text-editor
            v-if="!item.rawAttack"
            :field="item.description"
            i18n-label-key="monster.trait.description"
            :token-category="item.role === 'trait' ? 'trait' : item.role === 'lair' ? 'none' : 'action'"
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
import { MonsterAction, MonsterTrait, MonsterReaction, DndAttack } from '../models'
import NewTemplateDialog from './widgets/NewTemplateDialog.vue'
import { useTemplatesStore } from 'src/stores/templates-store'
import { useI18n } from 'vue-i18n'
import SwapButtons from './widgets/SwapButtons.vue'
import { v4 as uuidv4 } from 'uuid'
import { ACTION_TEMPLATES, applyActionTemplate } from 'src/core/domain/action-templates'
import type { ActionTemplate } from 'src/core/domain/action-templates'
import type { ActionComposerRole } from 'src/core/domain/action-composer'
import MultiattackComposer from './composer/MultiattackComposer.vue'
import AttackComposer from './composer/AttackComposer.vue'
import ComposerChain from './composer/ComposerChain.vue'
import TraitDisplaySettings from './composer/TraitDisplaySettings.vue'
import RoleHeaderEditor from './composer/RoleHeaderEditor.vue'
import EntryDisplaySettings from './composer/EntryDisplaySettings.vue'
import ActionAssociations from './composer/ActionAssociations.vue'
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
  rawAttack?: DndAttack
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
    AttackComposer,
    MultiattackComposer,
    TraitDisplaySettings,
    RoleHeaderEditor,
    EntryDisplaySettings,
    ActionAssociations,
  },
  setup() {
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

    const visibleAssociationRoles = computed(() => (['legendary', 'mythic'] as const).filter(role => selectedCategory.value === 'all' || selectedCategory.value === role))

    const visibleHeaderRoles = computed<HeaderRole[]>(() => {
      const roles: HeaderRole[] = ['legendary', 'mythic', 'lair']
      return roles.filter((role) => selectedCategory.value === role ||
        (selectedCategory.value === 'all' && allEntries.value.some((entry) => entry.role === role)))
    })

    const categoryTabs = computed(() => {
      const all = allEntries.value
      return [
        { label: 'All', value: 'all', count: all.length + monster.multiattacks.length, activeColor: 'amber-9' },
        { label: 'Multiattack', value: 'multiattack', count: monster.multiattacks.length, activeColor: 'red-9' },
        { label: 'Attacks', value: 'attack', count: all.filter((e) => e.role === 'attack').length, activeColor: 'red-8' },
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
        ok: { label: decision.kind === 'copy' ? 'Create copy' : 'Change role', color: 'amber-9' },
        persistent: true,
      }).onOk(() => {
        // Recompute from live data; never commit the stale preview's collection snapshots.
        const current = roleTransition(monster, item.id, item.role as ActionComposerRole, target, copyId)
        if (!current.patch || current.kind !== decision.kind) {
          $q.notify({ type: 'warning', message: 'The entry changed. Review it before trying again.' })
          return
        }
        monster.$patch(current.patch)
        selectedCategory.value = target
        $q.notify({ type: 'positive', message: current.kind === 'copy' ? 'Copy created. Original entry kept.' : 'Role changed. Entry data and references kept.' })
      })
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
        Object.assign(action, applied)
        item.name = applied.name
        item.description = applied.description
        item.recharge = applied.recharge
        autoUpdateCr(applied.description, applied.crAnnotation, applied)
        $q.notify({ message: `${template.name} applied`, type: 'positive' })
      })
    }

    const addTemplate = (target: MonsterAction | MonsterTrait, role: 'action' | 'trait' = 'action') => {
      $q.dialog({
        component: NewTemplateDialog,
        componentProps: {
          targetName: target?.name || 'Action',
        },
      }).onOk(({ name, icon }: { name: string; icon: string }) => {
        if (role === 'trait') templateStore.addCustomTrait(target as MonsterTrait, name, icon)
        else templateStore.addCustomAction(target as MonsterAction, name, icon)
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
      visibleHeaderRoles,
      visibleAssociationRoles,
      roleOptions,
      actionTemplateGroups,
      macroChips,
      insertMacro,
      addNewEntry,
      changeItemRole,
      updateItemDescription,
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
