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

      <q-checkbox v-help="'Tick to include sort traits alphabetically on the sheet for the actions editor.'" v-if="selectedCategory === 'trait' || selectedCategory === 'all'" v-model="monster.alphaTraits" dark dense label="Sort traits alphabetically on the sheet" data-studio-trait-sort class="q-mb-sm" />

      <action-associations v-for="role in visibleAssociationRoles" :key="role" :role="role" />

      <role-header-editor v-for="role in visibleHeaderRoles" :key="role" :role="role" />

      <multiattack-composer v-if="selectedCategory === 'multiattack' || (selectedCategory === 'all' && monster.multiattacks.length > 0)" />

      <!-- Empty State -->
      <div v-if="filteredEntries.length === 0 && selectedCategory !== 'multiattack' && (selectedCategory !== 'all' || monster.multiattacks.length === 0)" class="q-pa-md text-center text-grey-5">
        <q-icon name="info" size="32px" class="q-mb-xs" />
        <div>No entries in category: <b>{{ selectedCategory }}</b></div>
        <div class="text-caption">Click "+ Add Entry" above to create one.</div>
      </div>

      <!-- Bulk Fold / Expand Controls -->
      <div v-if="filteredEntries.length > 0" class="row items-center justify-between q-py-xs q-px-sm bg-grey-9 rounded-borders q-mb-xs">
        <div class="text-caption text-grey-4">
          <span>Showing <b>{{ filteredEntries.length }}</b> entries</span>
        </div>
        <div class="row items-center q-gutter-x-xs">
          <q-btn v-help="'Collapse All in the actions editor.'"
            dense
            flat
            size="xs"
            icon="unfold_less"
            label="Collapse All"
            color="amber-4"
            no-caps
            @click="collapseAllEntries"
          />
          <q-btn v-help="'Expand All in the actions editor.'"
            dense
            flat
            size="xs"
            icon="unfold_more"
            label="Expand All"
            color="amber-4"
            no-caps
            @click="expandAllEntries"
          />
        </div>
      </div>

      <!-- Grouped List of Actions & Traits by Category with Per-Category Fold / Unfold -->
      <div v-if="groupedEntriesByCategory.length > 0" class="column q-gutter-y-sm">
        <div
          v-for="catGroup in groupedEntriesByCategory"
          :key="catGroup.role"
          class="category-fold-group rounded-borders overflow-hidden"
          style="border: 1px solid rgba(255, 255, 255, 0.14); background: rgba(15, 23, 42, 0.45);"
        >
          <!-- Category Fold / Unfold Header Bar -->
          <div
            class="row items-center justify-between q-px-sm q-py-xs cursor-pointer bg-grey-9 text-white"
            style="border-bottom: 1px solid rgba(255, 255, 255, 0.08);"
            @click="toggleCategoryCollapse(catGroup.role)"
          >
            <div class="row items-center q-gutter-x-xs">
              <q-btn
                flat
                round
                dense
                size="xs"
                :icon="isCategoryCollapsed(catGroup.role) ? 'chevron_right' : 'expand_more'"
                color="amber-4"
                @click.stop="toggleCategoryCollapse(catGroup.role)"
              >
                <q-tooltip>{{ isCategoryCollapsed(catGroup.role) ? 'Unfold Category Section' : 'Fold Category Section' }}</q-tooltip>
              </q-btn>
              <q-badge :color="getRoleBadgeColor(catGroup.role)" class="text-weight-bold text-caption">
                {{ catGroup.label }} ({{ catGroup.items.length }})
              </q-badge>
              <span v-if="isCategoryCollapsed(catGroup.role)" class="text-caption text-grey-5 q-ml-xs">
                — {{ catGroup.items.map((i) => i.name).join(', ') }}
              </span>
            </div>

            <div class="row items-center q-gutter-x-xs" @click.stop>
              <q-btn v-help="'Fold Cards in the actions editor.'"
                dense
                flat
                size="xs"
                icon="unfold_less"
                label="Fold Cards"
                color="grey-4"
                no-caps
                @click="collapseCategoryItems(catGroup.role)"
              >
                <q-tooltip>Collapse all individual entry cards inside {{ catGroup.label }}</q-tooltip>
              </q-btn>
              <q-btn v-help="'Unfold Cards in the actions editor.'"
                dense
                flat
                size="xs"
                icon="unfold_more"
                label="Unfold Cards"
                color="grey-4"
                no-caps
                @click="expandCategoryItems(catGroup.role)"
              >
                <q-tooltip>Expand all individual entry cards inside {{ catGroup.label }}</q-tooltip>
              </q-btn>
              <q-btn
                dense
                flat
                size="xs"
                :icon="isCategoryCollapsed(catGroup.role) ? 'visibility' : 'visibility_off'"
                :label="isCategoryCollapsed(catGroup.role) ? 'Unfold Category' : 'Fold Category'"
                color="amber-3"
                no-caps
                @click="toggleCategoryCollapse(catGroup.role)"
              />
            </div>
          </div>

          <!-- Entries Inside Category (v-show keeps ComposerChain mounted in DOM) -->
          <div v-show="!isCategoryCollapsed(catGroup.role)" class="column q-gutter-y-xs q-pa-xs">
        <div
          v-for="item in catGroup.items"
          :key="item.id"
          class="rounded-borders bg-grey-9 text-white q-pa-xs shadow-1"
          style="border: 1px solid rgba(255, 255, 255, 0.12);"
        >
          <!-- Card identity and commands; composable role lives in the head row below. -->
          <div class="row q-col-gutter-xs items-center">
            <div class="col-auto">
              <q-btn
                flat
                round
                dense
                size="sm"
                :icon="isItemCollapsed(item.id) ? 'chevron_right' : 'expand_more'"
                :color="isItemCollapsed(item.id) ? 'grey-5' : 'amber-4'"
                @click.stop="toggleItemCollapse(item.id)"
              >
                <q-tooltip>{{ isItemCollapsed(item.id) ? 'Expand card' : 'Collapse card' }}</q-tooltip>
              </q-btn>
            </div>
            <div class="col text-weight-bold ellipsis cursor-pointer" :title="item.name" @click="toggleItemCollapse(item.id)">{{ item.name }}</div>

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
              <q-btn v-if="item.rawReaction" round flat dense icon="save" color="cyan-3" size="sm" :data-save-reaction-template="item.id" @click="addTemplate(item.rawReaction, 'reaction')">
                <q-tooltip>Save as Reaction Template</q-tooltip>
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
            v-show="!isItemCollapsed(item.id)"
            v-if="item.rawAction || item.rawReaction || item.rawTrait || item.role === 'lair'"
            :action-id="item.id"
            :role="chainRole(item)"
            :cost="item.cost || 1"
            @update:cost="(cost: number) => updateItemCost(item, cost)"
          >
            <template #head-prefix>
              <q-select v-help="'Choose role for the actions editor.'"
                data-composer-role
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
                style="min-width: 130px; max-width: 180px;"
                @update:model-value="(newRole: string) => changeItemRole(item, newRole)"
              >
                <q-tooltip class="text-caption">Change compatible action roles, or create a copy for a different entry model. Review before applying.</q-tooltip>
              </q-select>
            </template>
          </composer-chain>

          <attack-composer v-show="!isItemCollapsed(item.id)" v-if="item.rawAttack" :attack-id="item.id" />

          <entry-display-settings v-show="!isItemCollapsed(item.id)" v-if="item.rawAction || item.rawReaction || item.role === 'lair'" :entry-id="item.id" :field="item.role === 'lair' ? 'lairActions' : item.rawReaction ? 'reactions' : 'actions'" />

          <trait-display-settings v-show="!isItemCollapsed(item.id)" v-if="item.rawTrait" :trait-id="item.id" />

          <!-- Description Text Editor with Integrated Intellisense & Dropdowns -->
          <monster-text-editor
            v-show="!isItemCollapsed(item.id)"
            v-if="!item.rawAttack"
            :field="item.description"
            i18n-label-key="monster.trait.description"
            :token-category="item.role === 'trait' ? 'trait' : item.role === 'lair' ? 'none' : 'action'"
            @update:model-value="(val: string) => updateItemDescription(item, val)"
          />

          <!-- Description Containers (Multi-Description Blocks & Outcome Tables) -->
          <div v-show="!isItemCollapsed(item.id)" v-if="!item.rawAttack" data-description-containers class="q-mt-sm q-pa-xs rounded-borders bg-grey-10 text-white" style="border: 1px dashed rgba(255, 255, 255, 0.2);">
            <div class="row items-center justify-between q-px-xs q-py-xs flex-wrap q-gutter-xs">
              <span class="text-caption text-amber-3 text-weight-bold">
                Additional Description Containers &amp; Tables ({{ (item.descriptionContainers || []).length }})
              </span>
              <div class="row items-center q-gutter-x-xs">
                <q-btn v-help="'+ Text Block in the actions editor.'"
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="cyan-3"
                  icon="notes"
                  type="button"
                  data-add-description="text"
                  label="+ Text Block"
                  @click="addTextContainer(item)"
                />
                <q-btn v-help="'+ Dice Table in the actions editor.'"
                  flat
                  dense
                  no-caps
                  size="xs"
                  color="amber-4"
                  icon="casino"
                  type="button"
                  data-add-description="table"
                  label="+ Dice Table"
                  @click="addTableContainer(item)"
                />
              </div>
            </div>

            <div v-for="(container, cIdx) in (item.descriptionContainers || [])" :key="container.id || cIdx" class="q-pa-xs q-my-xs rounded-borders bg-grey-9">
              <div class="row q-col-gutter-xs items-center q-mb-xs">
                <div class="col-12 col-sm-4">
                  <mechanic-text-editor v-help="'Enter outcome target / clause for the actions editor.'"
                    v-model="container.outcomeTarget"
                    dense
                    outlined
                    dark
                    label="Outcome Target / Clause"
                    placeholder="e.g. On Hit, On Failure, or leave blank"
                    @update:model-value="syncContainers(item)"
                  />
                </div>
                <div class="col-auto">
                  <q-btn-toggle
                    :model-value="container.kind"
                    :options="[{ label: 'Text', value: 'text' }, { label: 'Table', value: 'table' }]"
                    dense
                    no-caps
                    unelevated
                    size="xs"
                    toggle-color="amber-9"
                    color="grey-8"
                    @update:model-value="(val: 'text' | 'table') => setContainerKind(item, cIdx, val)"
                  />
                </div>
                <q-space />
                <div class="col-auto">
                  <q-btn flat round dense size="xs" color="red-4" icon="close" @click="removeContainer(item, cIdx)" />
                </div>
              </div>

              <!-- Text block container -->
              <div v-if="container.kind === 'text'">
                <mechanic-text-editor v-help="'Enter container text / rider for the actions editor.'"
                  v-model="container.text"
                  type="textarea"
                  rows="2"
                  dense
                  outlined
                  dark
                  label="Container Text / Rider"
                  placeholder="Additional rules clause or rider..."
                  @update:model-value="syncContainers(item)"
                />
              </div>

              <!-- Table container -->
              <div v-else-if="container.kind === 'table' && container.table" class="column q-gutter-y-xs q-pa-xs">
                <div class="row q-col-gutter-xs items-center">
                  <div class="col-12 col-sm-6">
                    <q-input v-help="'Enter headers (comma separated) for the actions editor.'"
                      :model-value="container.table.headers.join(', ')"
                      dense
                      outlined
                      dark
                      label="Headers (comma separated)"
                      @update:model-value="(val) => {
                        if (!container.table) return
                        container.table.headers = String(val ?? '').split(',').map((s) => s.trim())
                        syncContainers(item)
                      }"
                    />
                  </div>
                  <div class="col-auto">
                    <q-btn v-help="'Add Row in the actions editor.'" flat dense no-caps size="xs" icon="add" type="button" data-add-description-row label="Add Row" @click="addTableRow(container, item)" />
                  </div>
                </div>
                <div v-for="(row, rIdx) in container.table.rows" :key="rIdx" class="row q-col-gutter-xs items-center q-my-xs">
                  <div v-for="(cell, cellIdx) in row" :key="cellIdx" class="col">
                    <mechanic-text-editor
                      v-model="row[cellIdx]"
                      dense
                      outlined
                      dark
                      :label="container.table?.headers[cellIdx] || ('Col ' + (cellIdx + 1))"
                      @update:model-value="syncContainers(item)"
                    />
                  </div>
                  <div class="col-auto">
                    <q-btn flat round dense size="xs" color="red-4" icon="close" @click="removeTableRow(container, rIdx, item)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </q-card>
  </q-expansion-item>
</template>

<script lang="ts">
import MechanicTextEditor from './MechanicTextEditor.vue'
import { useMonsterStore } from 'src/stores/monster-store'
import { defineComponent, ref, computed } from 'vue'
import MonsterTextEditor from './MonsterTextEditor.vue'
import { useAutoUpdateCr } from './useAutoUpdateCr'
import { useQuasar } from 'quasar'
import { MonsterAction, MonsterTrait, MonsterReaction, DndAttack, ActionDescriptionContainer, LairAction, SwappableField } from '../models'
import NewTemplateDialog from './widgets/NewTemplateDialog.vue'
import { useTemplatesStore } from 'src/stores/templates-store'
import { useI18n } from 'vue-i18n'
import SwapButtons from './widgets/SwapButtons.vue'
import { v4 as uuidv4 } from 'uuid'
import { ACTION_TEMPLATES, applyActionTemplate, TEMPLATE_OWNED_FIELDS } from 'src/core/domain/action-templates'
import { entryBindingPrefix, withoutEntryBindings } from 'src/core/domain/entry-bindings'
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
  descriptionContainers?: ActionDescriptionContainer[]
  rawAttack?: DndAttack
  rawAction?: MonsterAction
  rawTrait?: MonsterTrait
  rawReaction?: MonsterReaction
  rawLair?: LairAction
}

export default defineComponent({
  name: 'ActionsEditor',
  components: {
    MechanicTextEditor,
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

    const categoryTabs = computed<Array<{ label: string; value: typeof selectedCategory.value; count: number; activeColor: string }>>(() => {
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
